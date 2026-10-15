// Signals & Systems — Chapter 2: Systems and their properties (part b: diagrams, counterexamples, worked examples)
import {
  TAU, DT, NG, VIEW, I0, I1, tOf, iOf, sample, combo, maxDiff, maxAbs, pts, bump, rand,
  SYS, PROPS, TESTS, makeCustom, sysTex, stems, drawable, bdBlock, bdSum, bdWire, along, num, errTex,
} from './ch02.shared.js';

/** Gold dots streaming along a polyline P (phase and gap in data units of arc length). */
function flowDots(s, P, phase, gap, r, alpha = 1) {
  let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const out = []; for (let u = ((phase % gap) + gap) % gap; u < L - 0.1; u += gap) out.push(along(P, u));
  s.dots(out, { r, color: 'gold', alpha });
}
/** Standard normal draws from a uniform generator (Box–Muller). */
const normal = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(TAU * r());
/** Path from a time series [t] and values [y] (ms scaling optional), with null where not finite. */
const series = (T, Y, k = 1, step = 1) => { const o = []; for (let j = 0; j < T.length; j += step) o.push(isFinite(Y[j]) ? [T[j] * k, Y[j]] : null); return o; };

export default {
  collection: 'sig',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Concept',
      name: 'Block diagrams: series, parallel and feedback',
      statement: String.raw`A **block diagram** draws a system as boxes (subsystems) joined by arrows (signals), with **summing junctions** that add or subtract signals and **pick-off points** that copy a signal to several places. Three connections build every diagram:
(a) **series** (cascade): $y=S_2\{S_1\{x\}\}$;
(b) **parallel**: $y=S_1\{x\}+S_2\{x\}$;
(c) **feedback**: $y=S_1\{e\}$ driven by the error $e=x\mp S_2\{y\}$ (negative or positive feedback), an equation in which $y$ appears on both sides.
For gains $k_1,k_2$ the three give $k_1k_2$, $k_1+k_2$ and $k_1/(1\pm k_1k_2)$; for linear time-invariant blocks with transfer functions $H_1,H_2$ (chapter 9) the same rules read $H_1H_2$, $H_1+H_2$ and $H_1/(1\pm H_1H_2)$. A feedback loop is well posed when the loop contains memory or $1\pm k_1k_2\neq0$ for its instantaneous gains, and feedback can make an unstable block stable and a stable one unstable.`,
      idea: String.raw`A diagram is a set of equations between signals, and simulating it means advancing every block one time step while closing each loop consistently at every instant. Series composes maps; parallel adds outputs; feedback must be solved: for gains, $y=k_1(x-k_2y)$ gives $y=\frac{k_1}{1+k_1k_2}x$, which tends to $x/k_2$ when the loop gain $k_1k_2$ is large, so the closed loop hardly depends on $k_1$: Black's feedback amplifier. An integrator with negative feedback $k_2$ obeys $y'=k_1(x-k_2y)$, a first-order lag with time constant $1/(k_1k_2)$ (the RC circuit of 2.9 seen as a loop), while positive feedback around it gives exponential growth. A delay in a loop produces echoes $k_1x(t-1)$, $-k_1^2k_2x(t-2)$, … that die out exactly when $|k_1k_2|<1$. Control engineering builds on these rules (ctrl-1.3, ctrl-1.4).`,
      caption: String.raw`Choose a connection, two blocks and their gains. The diagram shows the live value of every signal at the moving time cursor, with gold dots streaming along the wires; the plot below draws the input $x$, the internal signal ($e$ for a loop) and the output $y$, computed by stepping the blocks forward together. The readout compares the simulated final value of the step response with the value $H(0)$ predicted by the connection rule. Put an integrator in the forward path and a gain in the feedback path, then flip to positive feedback; put a delay in a loop and raise $k_1k_2$ past 1.`,
      deps: ['sig-2.1'],
      see: ['ctrl-1.3', 'ctrl-1.4'],
      refs: ['Oppenheim–Willsky §1.5', 'Lathi ch. 1'],
      tags: ['block diagrams', 'feedback'],
      viz(v) {
        const M = v.M, TE = 12, h = 0.005, N = Math.round(TE / h);
        const conn = v.select('connection', [{ value: 'series', label: 'series' }, { value: 'parallel', label: 'parallel' }, { value: 'neg', label: 'negative feedback' }, { value: 'pos', label: 'positive feedback' }], 'neg');
        const BL = [{ value: 'gain', label: 'gain' }, { value: 'int', label: 'integrator' }, { value: 'delay', label: 'delay 1' }, { value: 'lag', label: 'lag' }];
        const b1 = v.select('block 1', BL, 'int'), b2 = v.select('block 2', BL, 'gain');
        const k1 = v.slider('$k_1$', 0, 4, 2, { step: 0.05 }), k2 = v.slider('$k_2$', 0, 2, 0.5, { step: 0.05 });
        const inp = v.select('input', [{ value: 'step', label: 'step' }, { value: 'pulse', label: 'pulse' }, { value: 'sine', label: 'sinusoid' }], 'step');
        const sD = v.stage({ x: [-3.6, 23.6], y: [0, 7], equal: true, height: 230, axes: false, full: true });
        const sP = v.stage({ x: [0, TE], y: [-1, 2], height: 230, axes: 'box', xlabel: 't', full: true, title: 'the signals of the diagram' });
        const TF = { gain: (i) => `k_${i}`, int: (i) => `\\dfrac{k_${i}}{s}`, delay: (i) => `k_${i}e^{-s}`, lag: (i) => `\\dfrac{k_${i}}{s+1}` };
        const SUB = { gain: 'gain', int: 'integrator', delay: 'delay by 1', lag: 'first-order lag' };
        const DC = (type, k) => (type === 'int' ? (k === 0 ? 0 : Infinity) : k);
        const mk = (type, k) => {
          if (type === 'gain') return { D: k, c: () => 0, upd: () => {} };
          if (type === 'int') { let yp = 0, up = 0; return { D: (k * h) / 2, c: () => yp + ((k * h) / 2) * up, upd: (u, y) => { yp = y; up = u; } }; }
          if (type === 'lag') { const A = (1 - h / 2) / (1 + h / 2), B = (k * h) / 2 / (1 + h / 2); let yp = 0, up = 0; return { D: B, c: () => A * yp + B * up, upd: (u, y) => { yp = y; up = u; } }; }
          const m = Math.round(1 / h), buf = new Float64Array(m); let j = 0;
          return { D: 0, c: () => k * buf[j], upd: (u) => { buf[j] = u; j = (j + 1) % m; } };
        };
        const xin = (t) => (inp.value === 'step' ? +(t >= 0.5) : inp.value === 'pulse' ? +(t >= 0.5 && t < 1.5) : t >= 0.5 ? Math.sin((TAU * (t - 0.5)) / 4) : 0);
        let run = { key: '' };
        const simulate = () => {
          const c = conn.value, key = `${c}|${b1.value}|${b2.value}|${k1.value}|${k2.value}|${inp.value}`;
          if (key === run.key) return run;
          const B1 = mk(b1.value, k1.value), B2 = mk(b2.value, k2.value), sg = c === 'neg' ? 1 : -1;
          const x = new Float64Array(N + 1).fill(NaN), m1 = new Float64Array(N + 1).fill(NaN), m2 = new Float64Array(N + 1).fill(NaN), y = new Float64Array(N + 1).fill(NaN);
          let status = 'ok', stopAt = null;
          for (let n = 0; n <= N; n++) {
            const xn = xin(n * h); let yn, a, b;
            if (c === 'series') { a = B1.D * xn + B1.c(); yn = B2.D * a + B2.c(); B1.upd(xn, a); B2.upd(a, yn); b = NaN; }
            else if (c === 'parallel') { a = B1.D * xn + B1.c(); b = B2.D * xn + B2.c(); yn = a + b; B1.upd(xn, a); B2.upd(xn, b); }
            else {
              const c1 = B1.c(), c2 = B2.c(), den = 1 + sg * B1.D * B2.D;
              if (Math.abs(den) < 1e-9) { status = 'illposed'; stopAt = n * h; break; }
              yn = (B1.D * (xn - sg * c2) + c1) / den; b = B2.D * yn + c2; a = xn - sg * b; B1.upd(a, yn); B2.upd(yn, b);
            }
            if (!isFinite(yn) || Math.abs(yn) > 1e6) { status = 'diverged'; stopAt = n * h; break; }
            x[n] = xn; m1[n] = a; m2[n] = b; y[n] = yn;
          }
          // the connection rule at s = 0 (the DC gain), with ∞ for an integrator
          const d1 = DC(b1.value, k1.value), d2 = DC(b2.value, k2.value);
          let H0;
          if (c === 'series') H0 = d1 * d2;
          else if (c === 'parallel') H0 = d1 + d2;
          else if (isFinite(d1) && isFinite(d2)) H0 = 1 + sg * d1 * d2 === 0 ? Infinity : d1 / (1 + sg * d1 * d2);
          else if (!isFinite(d1) && isFinite(d2)) H0 = d2 === 0 ? Infinity : 1 / (sg * d2);
          else H0 = 0;
          let lo = Infinity, hi = -Infinity; const n0 = Math.round(9.6 / h);
          for (let n = n0; n <= N; n++) { lo = Math.min(lo, y[n]); hi = Math.max(hi, y[n]); }
          const settled = status === 'ok' && hi - lo < 0.01 * Math.max(1, Math.abs(y[N]));
          return (run = { key, c, x, m1, m2, y, status, stopAt, H0, settled, yEnd: y[N] });
        };
        v.animate((t) => {
          const R = simulate(), c = R.c, tp = Math.min(TE, t * 1.7), np = Math.min(N, Math.round(tp / h));
          const val = (arr) => (isFinite(arr[np]) ? arr[np] : null), sg = c === 'neg' ? 1 : -1;
          const ymax = Math.max(1, ...[R.x, R.m1, R.m2, R.y].map((a) => { let m = 0; for (let n = 0; n <= N; n += 4) if (isFinite(a[n])) m = Math.max(m, Math.abs(a[n])); return m; }));
          const lab = (name, arr, X, Y, col, al = 'center') => { const w = val(arr); sD.text(`${name} = ${w == null ? '—' : v.fix(w, 2)}`, X, Y, { color: col, size: 12.5, weight: 600, align: al }); };
          const dots = (P, arr) => { const w = val(arr); if (w != null && Math.abs(w) > 1e-3) flowDots(sD, P, t * 2.2 * Math.sign(w), 0.8, 1.6 + 2.6 * Math.min(1, Math.abs(w) / ymax)); };
          const W = 4.4, Hb = 1.75, rPx = 15, rD = rPx / Math.abs(sD.X(1) - sD.X(0));
          // ---- diagram
          if (c === 'series') {
            const Y = 3.6, P1 = [[0, Y], [4.3, Y]], P2 = [[8.7, Y], [11.3, Y]], P3 = [[15.7, Y], [20, Y]];
            for (const [P, arr] of [[P1, R.x], [P2, R.m1], [P3, R.y]]) { bdWire(sD, P, { color: 'ink' }); dots(P, arr); }
            bdBlock(sD, 6.5, Y, W, Hb, TF[b1.value](1), { color: 'accent', sub: SUB[b1.value] });
            bdBlock(sD, 13.5, Y, W, Hb, TF[b2.value](2), { color: 'accent', sub: SUB[b2.value] });
            lab('x', R.x, 2, Y + 0.55, 'accent'); lab('v', R.m1, 10, Y + 0.55, 'orange'); lab('y', R.y, 17.9, Y + 0.55, 'purple');
          } else if (c === 'parallel') {
            const Y = 3.5, ya = 5.6, yb = 1.4, P0 = [[0, Y], [3, Y]], Pa = [[3, Y], [3, ya], [7.3, ya]], Pb = [[3, Y], [3, yb], [7.3, yb]];
            const Qa = [[11.7, ya], [16, ya], [16, Y + rD]], Qb = [[11.7, yb], [16, yb], [16, Y - rD]], Po = [[16 + rD, Y], [20, Y]];
            bdWire(sD, P0, { color: 'ink', arrow: false }); dots(P0, R.x);
            for (const [P, arr] of [[Pa, R.x], [Pb, R.x], [Qa, R.m1], [Qb, R.m2], [Po, R.y]]) { bdWire(sD, P, { color: 'ink' }); dots(P, arr); }
            sD.dot(3, Y, { r: 3.5, color: 'ink' });
            bdBlock(sD, 9.5, ya, W, Hb, TF[b1.value](1), { color: 'accent', sub: SUB[b1.value] });
            bdBlock(sD, 9.5, yb, W, Hb, TF[b2.value](2), { color: 'accent', sub: SUB[b2.value] });
            bdSum(sD, 16, Y, rPx, { n: '+', s: '+' });
            lab('x', R.x, 1.3, Y + 0.55, 'accent'); lab('v₁', R.m1, 14, ya + 0.55, 'orange'); lab('v₂', R.m2, 14, yb + 0.55, 'teal'); lab('y', R.y, 18.6, Y + 0.55, 'purple');
          } else {
            const Y = 4.9, yf = 1.5, P0 = [[0, Y], [4 - rD, Y]], Pe = [[4 + rD, Y], [7.3, Y]], Py = [[11.7, Y], [20, Y]];
            const Pf = [[15.5, Y], [15.5, yf], [11.7, yf]], Pr = [[7.3, yf], [4, yf], [4, Y - rD]];
            for (const [P, arr] of [[P0, R.x], [Pe, R.m1], [Py, R.y], [Pf, R.y], [Pr, R.m2]]) { bdWire(sD, P, { color: 'ink' }); dots(P, arr); }
            sD.dot(15.5, Y, { r: 3.5, color: 'ink' });
            bdBlock(sD, 9.5, Y, W, Hb, TF[b1.value](1), { color: 'accent', sub: SUB[b1.value] });
            bdBlock(sD, 9.5, yf, W, Hb, TF[b2.value](2), { color: 'teal', sub: SUB[b2.value] });
            bdSum(sD, 4, Y, rPx, { w: '+', s: sg > 0 ? '−' : '+' });
            lab('x', R.x, 1.6, Y + 0.55, 'accent'); lab('e', R.m1, 5.9, Y + 0.55, 'orange'); lab('y', R.y, 18, Y + 0.55, 'purple'); lab('f', R.m2, 5.9, yf + 0.55, 'teal');
          }
          sD.corner(`t = ${v.fix(tp, 2)}`, 'tr', { color: 'muted' });
          if (R.status !== 'ok') sD.corner(R.status === 'illposed' ? 'ill-posed loop: 1 ± D₁D₂ = 0' : `diverged at t = ${v.fix(R.stopAt, 1)}`, 'br', { color: 'red', size: 12.5, weight: 600 });
          // ---- plot
          const top = Math.min(60, ymax * 1.15);
          sP.setView(null, [-top * (inp.value === 'sine' || ymax > 1.01 ? 1 : 0.25), top]);
          sP.hline(0, { color: 'faint', width: 1 });
          if (R.settled && inp.value === 'step' && isFinite(R.H0)) sP.hline(R.H0, { color: 'green', width: 1.2, dash: [6, 4] });
          const draw = (arr, col, w) => { const done = [], rest = []; for (let n = 0; n <= N; n += 2) { const p = isFinite(arr[n]) ? [n * h, arr[n]] : null; (n <= np ? done : rest).push(p); } rest.unshift(done[done.length - 1] ?? null); sP.clip(() => { sP.path(rest, { color: col, width: w, alpha: 0.22 }); sP.path(done, { color: col, width: w }); }); };
          draw(R.x, 'accent', 1.8); if (c !== 'series' || true) draw(R.m1, 'orange', 1.5); if (c !== 'series') draw(R.m2, 'teal', 1.5); draw(R.y, 'purple', 2.6);
          sP.vline(tp, { color: 'gold', width: 1.4 });
        }, { period: 10, still: 9.6 });
        v.legend([['accent', 'input $x$'], ['orange', 'internal signal ($v$, $v_1$ or the error $e$)'], ['teal', 'second branch or feedback signal $f$'], ['purple', 'output $y$'], ['green', 'predicted final value $H(0)$', { dash: true }]]);
        v.readout(() => {
          const R = run; if (!R.y) return '';
          const c = R.c, t1 = TF[b1.value](1), t2 = TF[b2.value](2), sg = c === 'neg' ? '+' : '-';
          const rule = c === 'series' ? `$H=H_1H_2=${t1}\\cdot${t2}$` : c === 'parallel' ? `$H=H_1+H_2=${t1}+${t2}$` : `$H=\\dfrac{H_1}{1${sg}H_1H_2}$ with $H_1=${t1}$, $H_2=${t2}$`;
          const h0 = !isFinite(R.H0) ? '$H(0)=\\infty$' : `$H(0)$ = ${v.fix(R.H0, 4)}`;
          let cmp;
          if (R.status === 'illposed') cmp = `the loop is **ill-posed**: with instantaneous gains $D_1D_2=1$ the loop equation $y=k_1(x+k_2y)$ has no solution`;
          else if (R.status === 'diverged') cmp = `the simulated output **diverges** (passed $10^6$ at $t$ = ${v.fix(R.stopAt, 1)}): the connected system is unstable, so ${h0} is not a final value`;
          else if (inp.value !== 'step') cmp = `with a step input the final value would be ${h0}`;
          else if (R.settled) cmp = `simulated $y(12)$ = ${v.fix(R.yEnd, 4)}, predicted ${h0}${isFinite(R.H0) && Math.abs(R.yEnd - R.H0) < 2e-3 * Math.max(1, Math.abs(R.H0)) ? ' ✓' : ''}`;
          else cmp = !isFinite(R.H0) ? `the step response keeps growing (${h0}: a pole at $s=0$), $y(12)$ = ${v.fix(R.yEnd, 2)}` : `the output has not settled by $t=12$ ($y(12)$ = ${v.fix(R.yEnd, 3)}); ${h0} is the limit only if the connection is stable`;
          let extra = '';
          if ((c === 'neg' || c === 'pos') && b1.value === 'gain' && b2.value === 'gain') extra = ` · loop gain $k_1k_2$ = ${v.fix(k1.value * k2.value, 2)}${c === 'neg' && k2.value > 0 ? `; as it grows, $H\\to1/k_2$ = ${v.fix(1 / k2.value, 3)}` : ''}`;
          if ((c === 'neg' || c === 'pos') && (b1.value === 'delay' || b2.value === 'delay')) extra = ` · a delay in the loop makes echoes that ${k1.value * k2.value < 1 ? 'die out' : 'do not die out'}: $|k_1k_2|$ = ${v.fix(k1.value * k2.value, 2)} ${k1.value * k2.value < 1 ? '<' : '≥'} 1`;
          if (c === 'neg' && b1.value === 'int' && b2.value === 'gain' && k1.value * k2.value > 0) extra = ` · this loop is the first-order lag $y'=k_1(x-k_2y)$ with time constant $1/(k_1k_2)$ = ${v.fix(1 / (k1.value * k2.value), 3)}`;
          return `${rule} · ${cmp}${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Proposition',
      name: 'Counterexamples among the system properties',
      statement: String.raw`Linearity, time invariance, causality, memorylessness, invertibility and BIBO stability are logically independent, with one exception: **every memoryless system is causal**. Precisely, for every ordered pair $(P,Q)$ of distinct properties other than (memoryless, causal) there is a system that has $P$ and lacks $Q$. Standard witnesses: the squarer $x^2$ (time-invariant, causal, memoryless, stable, but neither linear nor invertible); $2x+1$ (everything except linear); the modulator $x(t)\cos2\pi t$ (everything except time-invariant); the advance $x(t+1)$ (linear, time-invariant, invertible and stable, but neither causal nor memoryless); the delay $x(t-1)$ (everything except memoryless); the chopper $x(t)g(t)$ with an on/off switching $g$ (linear, causal, memoryless and stable, but neither time-invariant nor invertible); the accumulator (everything except memoryless and stable); and $t\,x(t)$ (memoryless but unstable).`,
      idea: String.raw`Each property says "for all inputs", so one witness refutes it, and that is what the bench searches for: random combinations for linearity, random shifts for time invariance, pairs of inputs that agree up to $t_0$ (causality) or at an instant (memory), two inputs with one output or an explicit inverse (invertibility), and bounded inputs against a bound or an escaping output (stability). A property that survives the tests is only confirmed up to the tests run; it is proved from the formula. The implication is immediate: if $y(t)$ depends on $x(t)$ alone, it depends only on $x(s)$ for $s\le t$. Every other pair is separated by a system in the table. Two consequences: a linear, time-invariant, memoryless system is $y=kx$, hence stable, and invertible exactly when $k\neq0$; and some answers depend on the class of inputs allowed. On signals that start at rest the moving average is invertible (a recursion recovers the input), but on signals that last forever it erases every sinusoid of period 1, so it is not.`,
      caption: String.raw`The table fills in as every test runs on random inputs; click any cell to see its evidence plotted on the right (a witness for a ✗, the passing test for a ✓). The square grid on the left collects, for each ordered pair of properties, a system with the row property but not the column property; click a square to see that system fail, click again for another witness. Only one square stays empty, and it must. Type your own system in $x$, $t$, $xd=x(t-1)$ and $xa=x(t+1)$ to add it as the last row; *Run again* repeats every test on fresh random inputs.`,
      deps: ['sig-2.2', 'sig-2.3', 'sig-2.4', 'sig-2.5', 'sig-2.6'],
      refs: ['Oppenheim–Willsky §1.6'],
      tags: ['system properties', 'counterexamples'],
      viz(v) {
        const M = v.M;
        const ROWS = ['gain', 'square', 'delay', 'reverse', 'mavg', 'accum', 'mod', 'clip', 'rc', 'affine', 'tx', 'compress', 'advance', 'cavg', 'gate', 'custom'];
        const NAMES = { gain: 'amplifier  2x', square: 'squarer  x²', delay: 'delay  x(t−1)', reverse: 'reversal  x(−t)', mavg: 'moving average', accum: 'accumulator  ∫x', mod: 'modulator  x·cos 2πt', clip: 'clipper ±1', rc: 'RC filter', affine: 'affine  2x+1', tx: 'gain  t·x(t)', compress: 'compressor  x(2t)', advance: 'advance  x(t+1)', cavg: 'centred average', gate: 'chopper  x·g(t)' };
        const SHORT = { gain: '2x', square: 'x²', delay: 'delay', reverse: 'x(−t)', mavg: 'average', accum: 'accum.', mod: 'modul.', clip: 'clipper', rc: 'RC', affine: '2x+1', tx: 't·x', compress: 'x(2t)', advance: 'x(t+1)', cavg: 'c. avg', gate: 'chopper', custom: 'yours' };
        const PREF = ['delay', 'square', 'affine', 'mod', 'advance', 'accum', 'gate', 'reverse', 'tx', 'clip', 'mavg', 'rc', 'compress', 'cavg', 'gain', 'custom'];
        const fx = v.input('your system $y(t)=$', 'x^2 + t', { vars: ['x', 't', 'xd', 'xa'], width: 190, placeholder: 'e.g. x xd, t x, sin(x), xa - x' });
        let seed = 1, R = ROWS.map(() => Array(6).fill(null)), cust = { src: null, sys: null }, sel = [6, 1], sepPick = {};
        v.button('Run again on new random inputs', () => { seed++; R = ROWS.map(() => Array(6).fill(null)); v.restart(); v.play(); });
        const sysOf = (i) => {
          if (ROWS[i] !== 'custom') return SYS[ROWS[i]];
          if (fx.fn && fx.value !== cust.src) { cust = { src: fx.value, sys: makeCustom(fx.fn, fx.value) }; R[i] = Array(6).fill(null); }
          return cust.sys || SYS.gain;
        };
        const cell = (i, j) => { const s = sysOf(i); if (!R[i][j]) R[i][j] = TESTS[PROPS[j].id](s, seed); return R[i][j]; };
        const label = (i) => (ROWS[i] === 'custom' ? `yours: ${String(fx.value).slice(0, 16)}` : NAMES[ROWS[i]]);
        const sT = v.stage({ x: [0, 1], y: [0, 1], height: 418, axes: false, full: true, title: 'every system on the bench against every property (click a cell)' });
        const sS = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, weight: 1, title: 'has the row property but not the column one' });
        const sW = v.stage({ x: [-5.2, 5.2], y: [-2, 2], height: 300, axes: 'box', weight: 1.45, xlabel: 't', title: 'evidence' });
        const T = v.table(sT, { rows: ROWS.length, cols: 6, square: false, maxCell: 22.5, cellAspect: 4.6, size: 13.5, rowLabels: label, colLabels: PROPS.map((p) => p.name), labelSize: 12.5, margin: 4 });
        const TS = v.table(sS, { rows: 6, cols: 6, square: false, maxCell: 37, cellAspect: 1.55, size: 11.5, rowLabels: PROPS.map((p) => p.short), colLabels: PROPS.map((p) => p.short), labelSize: 11, margin: 6 });
        sT.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { sel = [c.i, c.j]; cell(c.i, c.j); } });
        sS.onClick((x, y) => {
          const c = TS.hit(x, y); if (!c || c.i < 0 || c.j < 0 || c.i === c.j) return;
          const ws = witnesses(c.i, c.j); if (!ws.length) return;
          const k = `${c.i},${c.j}`; sepPick[k] = ((sepPick[k] ?? -1) + 1) % ws.length; sel = [ws[sepPick[k]], c.j];
        });
        const witnesses = (a, b) => PREF.map((id) => ROWS.indexOf(id)).filter((i) => R[i][a]?.pass === true && R[i][b]?.pass === false);
        let shown = 0;
        v.animate((t) => {
          // reveal the table cell by cell
          const total = ROWS.length * 6, K = Math.min(total, Math.floor(t / 0.032) + 1);
          for (let k = 0; k < K; k++) cell(Math.floor(k / 6), k % 6);
          sysOf(ROWS.length - 1);
          shown = K;
          const sym = (r) => (!r ? '' : r.pass === true ? '✓' : r.pass === false ? '✗' : '?');
          T.draw({
            value: (i, j) => sym(R[i][j]),
            fill: (i, j) => { const r = R[i][j]; return !r ? null : r.pass === true ? ['green', 0.2] : r.pass === false ? ['red', 0.2] : ['muted', 0.14]; },
            textColor: (i, j) => { const r = R[i][j]; return !r ? 'muted' : r.pass === true ? 'green' : r.pass === false ? 'red' : 'muted'; },
            weight: () => 700,
            highlight: [[sel[0], sel[1], 'gold']],
            rowLabelColor: (i) => (i === sel[0] ? 'ink' : ROWS[i] === 'custom' ? 'purple' : 'muted'),
          });
          // separation grid
          TS.draw({
            value: (a, b) => { if (a === b) return ''; const ws = witnesses(a, b); return ws.length ? SHORT[ROWS[ws[(sepPick[`${a},${b}`] ?? 0) % ws.length]]] : PROPS[a].id === 'mless' && PROPS[b].id === 'causal' ? 'none' : ''; },
            fill: (a, b) => (a === b ? ['muted', 0.22] : witnesses(a, b).length ? ['accent', 0.13] : PROPS[a].id === 'mless' && PROPS[b].id === 'causal' ? ['gold', 0.22] : null),
            textColor: (a, b) => (PROPS[a].id === 'mless' && PROPS[b].id === 'causal' ? 'gold' : 'ink'),
            highlight: (() => { const out = []; for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) if (a !== b && sel[1] === b && R[sel[0]][a]?.pass === true && R[sel[0]][b]?.pass === false) out.push([a, b, 'gold']); return out; })(),
          });
          const im = PROPS.findIndex((p) => p.id === 'mless'), ic = PROPS.findIndex((p) => p.id === 'causal');
          const [x0, y0, x1, y1] = TS.cellRect(im, ic); sS.rect(x0, y0, x1, y1, { fill: 'gold', fillAlpha: 0.1, hatch: 'gold', hatchAlpha: 0.35, stroke: false });
          // evidence for the selected cell
          const r = cell(sel[0], sel[1]), sys = sysOf(sel[0]);
          drawEvidence(r, sys);
        }, { period: 4, once: true, still: 3.9 });
        const range = (...arrs) => { let lo = 0, hi = 0; for (const a of arrs) for (let i = I0; i <= I1; i++) if (isFinite(a[i])) { lo = Math.min(lo, a[i]); hi = Math.max(hi, a[i]); } const pad = 0.12 * Math.max(0.5, hi - lo); return [Math.max(-40, lo - pad), Math.min(40, hi + pad)]; };
        const between = (A, B) => { const L = pts(A, -5.2, 5.2, 2), Q = pts(B, -5.2, 5.2, 2); sW.clip(() => { for (let k = 0; k + 1 < L.length; k++) if (L[k] && Q[k] && L[k + 1] && Q[k + 1] && Math.abs(L[k][1] - Q[k][1]) > 1e-9) sW.poly([L[k], L[k + 1], Q[k + 1], Q[k]], { fill: 'red', fillAlpha: 0.3, stroke: false }); }); };
        const line = (A, col, w, dash, alpha) => sW.clip(() => sW.path(pts(A, -5.2, 5.2), { color: col, width: w, dash, alpha }));
        let lg = '';
        const legend = (items) => { const k = JSON.stringify(items); if (k !== lg) { lg = k; v.legend(items); } };
        function drawEvidence(r, sys) {
          sW.hline(0, { color: 'faint', width: 1 });
          if (!r || r.nan) { sW.setView(null, [-1, 1]); sW.setTitle('evidence'); sW.text('the output is undefined for some inputs', 0, 0.3, { align: 'center', color: 'red', size: 13 }); legend([]); return; }
          const P = r.prop;
          if (P === 'lin') {
            sW.setView(null, range(r.lhs, r.rhs)); sW.setTitle(`linearity: $S\\{ax_1+bx_2\\}$ vs $aS\\{x_1\\}+bS\\{x_2\\}$, $a$ = ${v.fix(r.a, 2)}, $b$ = ${v.fix(r.b, 2)}`);
            between(r.lhs, r.rhs); line(r.lhs, 'green', 2.5); line(r.rhs, 'orange', 2, [6, 4]);
            legend([['green', '$S\\{ax_1+bx_2\\}$'], ['orange', '$aS\\{x_1\\}+bS\\{x_2\\}$', { dash: true }], ['red', 'mismatch', { area: true }]]);
          } else if (P === 'ti') {
            sW.setView(null, range(r.lhs, r.rhs)); sW.setTitle(`time invariance: $S\\{x(t-\\tau)\\}$ vs $y(t-\\tau)$, $\\tau$ = ${v.fix(r.tau, 2)}`);
            between(r.lhs, r.rhs); line(r.lhs, 'green', 2.5); line(r.rhs, 'orange', 2, [6, 4]);
            legend([['green', 'shift, then system'], ['orange', 'system, then shift', { dash: true }], ['red', 'mismatch', { area: true }]]);
          } else if (P === 'causal') {
            sW.setView(null, range(r.y1, r.y2, r.x1, r.x2)); sW.setTitle(`causality: inputs agree up to $t_0$ = ${v.fix(r.t0, 2)}`);
            sW.rect(r.t0, -50, 5.3, 50, { fill: 'orange', fillAlpha: 0.06, stroke: false });
            if (r.first != null && r.first <= r.t0) sW.rect(r.first, -50, r.t0, 50, { fill: 'red', fillAlpha: 0.12, stroke: false });
            line(r.x2, 'accent', 1.2, [4, 4], 0.6); line(r.x1, 'accent', 1.2, null, 0.6); line(r.y1, 'green', 2.5); line(r.y2, 'orange', 2, [6, 4]);
            sW.vline(r.t0, { color: 'gold', width: 1.4, dash: [5, 4] });
            legend([['accent', 'the two inputs'], ['green', 'output 1'], ['orange', 'output 2', { dash: true }], ['red', 'outputs differ before the inputs do', { area: true }]]);
          } else if (P === 'mless') {
            sW.setView(null, range(r.y1, r.y2, r.x1, r.x2)); sW.setTitle(r.pass ? 'memoryless: wherever the inputs agree, so do the outputs' : `memory: the inputs agree at $t$ = ${v.fix(r.at, 2)}, the outputs do not`);
            for (let i = I0; i <= I1; i += 3) if (r.q[i] !== 0) sW.line(tOf(i), -50, tOf(i), 50, { color: 'orange', alpha: 0.06, width: 3 });
            line(r.x2, 'accent', 1.2, [4, 4], 0.6); line(r.x1, 'accent', 1.2, null, 0.6); line(r.y1, 'green', 2.5); line(r.y2, 'orange', 2, [6, 4]);
            if (!r.pass && r.at != null) { const i = iOf(r.at); sW.vline(r.at, { color: 'red', width: 1.3, dash: [4, 4] }); sW.dot(r.at, r.y1[i], { color: 'green', r: 5 }); sW.dot(r.at, r.y2[i], { color: 'orange', r: 5 }); sW.dot(r.at, r.x1[i], { color: 'accent', r: 4 }); }
            legend([['accent', 'two inputs (differ only in the orange stripes)'], ['green', 'output 1'], ['orange', 'output 2', { dash: true }]]);
          } else if (P === 'inv') {
            if (r.kind === 'pair') {
              sW.setView(null, range(r.x1, r.x2, r.y1)); sW.setTitle('not invertible: two different inputs, one output');
              line(r.x1, 'accent', 1.8); line(r.x2, 'red', 1.8, [6, 4]); line(r.y1, 'purple', 3); line(r.y2, 'gold', 1.6, [3, 4]);
              legend([['accent', 'input $x$'], ['red', "input $x'$", { dash: true }], ['purple', 'output of $x$'], ['gold', "output of $x'$", { dash: true }]]);
            } else if (r.kind === 'inverse') {
              sW.setView(null, range(r.x, r.y)); sW.setTitle(`invertible: $S^{-1}$: $${sys.invTex ?? ''}$ recovers the input`);
              line(r.y, 'purple', 1.6, null, 0.55); line(r.x, 'accent', 2.4); line(r.xr, 'green', 2.4, [2, 4]);
              legend([['accent', 'input $x$'], ['purple', 'output $y$'], ['green', 'recovered $S^{-1}\\{y\\}$', { dash: true }]]);
            } else { sW.setView(null, [-1, 1]); sW.setTitle('invertibility: not decided by the bench'); sW.text('no inverse or twin input found automatically', 0, 0.3, { align: 'center', color: 'muted', size: 13 }); legend([]); }
          } else if (P === 'stable') {
            sW.setView(null, range(r.x, r.y, r.K != null ? Float64Array.from({ length: NG + 1 }, () => r.K) : r.x)); sW.setTitle(r.pass ? `stable: $|x|\\le1$ gives $|y|\\le$ ${v.fix(r.K, 3)}` : 'unstable: a bounded input whose output grows without bound');
            sW.hband(-1, 1, { color: 'accent', alpha: 0.06 });
            if (r.pass && r.K != null) sW.hband(-r.K, r.K, { color: 'green', alpha: 0.08, edges: true });
            line(r.x, 'accent', 1.8); line(r.y, 'purple', 2.6);
            legend([['accent', 'bounded input, $|x|\\le1$'], ['purple', 'output'], ['green', 'bound on $|y|$', { area: true }]]);
          }
        }
        v.readout(() => {
          const [i, j] = sel, r = R[i][j], sys = sysOf(i), P = PROPS[j];
          const who = ROWS[i] === 'custom' ? `your system y = ${String(fx.value).replace(/\*/g, '·')}` : `${NAMES[ROWS[i]].split('  ')[0]} ${sysTex(sys)}`;
          let what = 'not tested yet';
          if (r && r.nan) what = 'the output is undefined (not finite) for some test inputs';
          else if (r) {
            const pass = r.pass;
            if (P.id === 'lin') what = pass ? `superposition held on 4 random trials (largest mismatch $${errTex(r.err)}$)` : `**fails**: $S\\{ax_1+bx_2\\}$ and $aS\\{x_1\\}+bS\\{x_2\\}$ differ by up to ${num(r.err)}`;
            if (P.id === 'ti') what = pass ? `the two routes agreed on 3 random shifts (largest mismatch $${errTex(r.err)}$)` : `**fails**: shifting by $\\tau$ = ${v.fix(r.tau, 2)} before and after the system differs by up to ${num(r.err)}`;
            if (P.id === 'causal') what = pass ? 'outputs agreed up to $t_0$ on 4 pairs of inputs that differed only after $t_0$' : `**fails**: the inputs agree up to $t_0$ = ${v.fix(r.t0, 2)} but the outputs already differ at $t$ = ${v.fix(r.first, 2)}`;
            if (P.id === 'mless') what = pass ? 'wherever two inputs agreed, the outputs agreed (3 random pairs)' : `**fails**: at $t$ = ${v.fix(r.at, 2)} the inputs agree but the outputs differ by ${num(r.err)}`;
            if (P.id === 'inv') what = r.kind === 'pair' ? `**fails**: inputs differing by up to ${v.fix(r.dIn, 2)} give outputs differing by ${r.dOut === 0 ? '0' : num(r.dOut)} ($${sys.pairTex ?? ''}$)` : r.kind === 'inverse' ? (pass ? `the inverse $${sys.invTex}$ recovers the input with error $${errTex(r.err <= 1e-12 ? 0 : r.err)}$${sys.invNote ? ` (${sys.invNote})` : ''}` : `the candidate inverse missed by ${num(r.err)}: undecided`) : 'undecided: the bench found neither an inverse nor two inputs with one output';
            if (P.id === 'stable') what = r.kind === 'blowup' ? `**fails**: ${r.desc}` : r.probe ? `probing $f$ with $|x|\\le1$ at times up to $|t|=10^4$ found $|y|$ at most ${num(r.K)}` : `every bounded test input ($|x|\\le1$) gave $|y|\\le$ ${num(r.sup)} ≤ ${num(r.K)}, the bound for this system`;
          }
          let sep = 0, imp = 0;
          for (let a = 0; a < 6; a++) for (let b = 0; b < 6; b++) if (a !== b) { if (witnesses(a, b).length) sep++; else if (PROPS[a].id === 'mless' && PROPS[b].id === 'causal') imp++; }
          const done = shown >= ROWS.length * 6;
          const tally = done ? ` · ${sep} of the 30 ordered pairs of properties are separated by systems in the table; the remaining one, memoryless but not causal, is impossible` : ' · running the tests…';
          return `${who}, ${P.name}: ${what}${tally}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Model',
      name: 'The RC circuit as a first-order system',
      statement: String.raw`A resistor $R$ in series with a capacitor $C$ is driven by a source voltage $x(t)=v_{in}(t)$; the output is the capacitor voltage $y(t)=v_C(t)$. Kirchhoff's voltage law and the capacitor law $i=C\,dv_C/dt$ give the linear first-order differential equation
$$RC\,\frac{dy}{dt}+y(t)=x(t).$$
With the capacitor uncharged before the input starts (initial rest), its solution is
$$y(t)=\int_{-\infty}^{t}\frac{1}{RC}\,e^{-(t-s)/RC}\,x(s)\,ds,$$
so the circuit is a linear, time-invariant, causal, BIBO-stable system with memory ($|y|\le\sup|x|$), and it is invertible, with inverse $x=RC\,y'+y$. Its step response is $y(t)=V\,(1-e^{-t/\tau})$ for $t\ge0$, with **time constant** $\tau=RC$: 63.2% of the final value after one time constant, 99% after $4.6\tau$.`,
      scope: String.raw`Holds for ideal linear components: a constant resistance, a capacitor without leakage or dielectric absorption, a source whose internal resistance is negligible or included in $R$, and signals slow enough that the inductance of the wiring and radiation play no part.`,
      idea: String.raw`Around the loop, $x=Ri+y$, and the current that charges the capacitor is $i=Cy'$, so $RCy'+y=x$: the linear equation of ode-1.4, solved with the integrating factor $e^{t/RC}$. The solution formula exhibits every property at once. It integrates $x$ against a fixed kernel (linear); the kernel depends only on $t-s$ (time-invariant); only $s\le t$ enter (causal); the kernel has area 1 (stable, with $|y|\le\sup|x|$). The time constant sets the scale: the capacitor voltage is an exponentially weighted average of the input over roughly the last $\tau$, so changes much faster than $\tau$ are smoothed out and slower ones pass. This is the first low-pass filter; the kernel $\tfrac1\tau e^{-t/\tau}u(t)$ is its impulse response (chapter 3) and $1/(1+s\tau)$ its transfer function (chapter 9).`,
      caption: String.raw`The schematic is simulated by the circuit solver (gold dots: current; wire colour: voltage). Choose a source waveform, or draw your own on the plot, and change $R$ and $C$. The plot shows the source (blue), the simulated capacitor voltage (purple) and the exact solution of $RC\,y'+y=x$ (dashed); for the step, the dashed lines mark one time constant and 63.2%. *Check* runs a second simulation of the same circuit to test a property: double the input, delay it, or change it only after 30 ms.`,
      deps: ['circ-5.5', 'sig-2.2', 'sig-2.3', 'ode-1.4'],
      see: ['circ-5.6'],
      refs: ['Oppenheim–Willsky §1.5', 'Lathi ch. 1'],
      tags: ['RC circuit', 'first-order system'],
      viz(v) {
        const M = v.M, V0 = 5, TE = 0.06, hS = 5e-5, NT = Math.round(TE / hS);
        const inp = v.select('source', [{ value: 'step', label: 'step' }, { value: 'square', label: 'square wave' }, { value: 'ramp', label: 'ramp' }, { value: 'draw', label: 'draw it' }], 'step');
        const chk = v.select('check', [{ value: 'none', label: 'none' }, { value: 'lin', label: 'double $v_{in}$' }, { value: 'ti', label: 'delay $v_{in}$ by 8 ms' }, { value: 'causal', label: 'change $v_{in}$ after 30 ms' }], 'none');
        const sC = v.stage({ x: [-2.2, 6.6], y: [-1.5, 4.1], equal: true, height: 275, axes: false, weight: 0.85 });
        const sP = v.stage({ x: [0, 60], y: [-0.7, 6.4], height: 275, axes: 'box', xlabel: 't (ms)', yticks: [0, 1, 2, 3, 4, 5, 6], weight: 1.35, title: 'source $v_{in}$ and capacitor voltage $v_C$ (volts)' });
        const sig = drawable(sP, 0, 60, 240, (t) => (t >= 5 && t < 25 ? 4 : t >= 25 && t < 40 ? 1.5 + 2.5 * Math.sin((TAU * (t - 25)) / 15) : 0), [-0.5, 6], { enabled: () => inp.value === 'draw' });
        const vin0 = (ms) => {
          switch (inp.value) {
            case 'step': return ms >= 5 ? V0 : 0;
            case 'square': return ms >= 5 && (ms - 5) % 20 < 10 ? V0 : 0;
            case 'ramp': return V0 * M.clamp((ms - 5) / 20, 0, 1);
            default: return sig.f(ms);
          }
        };
        let wave = (t) => vin0(t * 1e3);
        const C = v.circuit(sC, [
          { type: 'V', id: 'Vin', wave: (t) => wave(t), at: [0, 3, 0, 0], label: false },
          { type: 'R', id: 'R', value: 1e3, at: [0, 3, 4, 3] },
          { type: 'C', id: 'C', value: 10e-6, at: [4, 3, 4, 0] },
          { type: 'W', at: [4, 0, 0, 0] }, { type: 'GND', at: [2, 0] },
          { type: 'label', at: [4, 3], text: '$v_C$', dx: 10, dy: -6 },
          { type: 'label', at: [0, 3], text: '$v_{in}$', dx: -10, dy: -6 },
        ]);
        C.control('R', '$R$', 100, 10e3); C.control('C', '$C$', 1e-6, 100e-6);
        let run = { key: '' };
        const nC = () => C.net.termNode.get('C').a;
        const simulate = () => {
          const Rv = C.part('R').value, Cv = C.part('C').value, key = `${Rv}|${Cv}|${inp.value}|${sig.ver}|${chk.value}`;
          if (key === run.key) return run;
          const tau = Rv * Cv;
          wave = (t) => vin0(t * 1e3); const tr = C.transient(TE, hS);
          const T = tr.t, y = tr.v[nC()], x = Float64Array.from(T, (t) => vin0(t * 1e3));
          // exact solution of τy' + y = x for an input linear between samples
          const ex = new Float64Array(T.length), a = Math.exp(-hS / tau);
          for (let j = 1; j < T.length; j++) { const s = (x[j] - x[j - 1]) / hS; ex[j] = a * ex[j - 1] + x[j] - a * x[j - 1] - tau * s * (1 - a); }
          let dODE = 0; for (let j = 0; j < T.length; j++) dODE = Math.max(dODE, Math.abs(y[j] - ex[j]));
          // a second run of the same circuit for the property check
          let y2 = null, ref = null, x2 = null, err = null, k = 0;
          if (chk.value !== 'none') {
            const alt = chk.value === 'lin' ? (t) => 2 * vin0(t * 1e3) : chk.value === 'ti' ? (t) => vin0(t * 1e3 - 8) : (t) => vin0(t * 1e3) + (t * 1e3 > 30 ? 2.5 * bump(t * 1e3, 38, 8) : 0);
            wave = alt; const tr2 = C.transient(TE, hS); wave = (t) => vin0(t * 1e3);
            y2 = tr2.v[nC()]; x2 = Float64Array.from(T, (t) => alt(t));
            k = Math.round(8e-3 / hS);
            ref = chk.value === 'lin' ? Float64Array.from(y, (u) => 2 * u) : chk.value === 'ti' ? Float64Array.from(y, (u, j) => (j - k >= 0 ? y[j - k] : 0)) : y;
            err = 0; const jmax = chk.value === 'causal' ? Math.round(30e-3 / hS) : T.length - 1;
            for (let j = 0; j <= jmax; j++) err = Math.max(err, Math.abs(y2[j] - ref[j]));
          }
          return (run = { key, tau, T, x, y, ex, dODE, y2, x2, ref, err, tr });
        };
        v.animate((t) => {
          const R0 = simulate(), { tau, T, x, y, ex, y2, x2, ref, tr } = R0, tp = Math.min(TE, ((t % 8) / 7) * TE), ms = tp * 1e3;
          let big = 0; for (const A of [x, y2 || x, x2 || x]) for (let q = 0; q < A.length; q += 8) big = Math.max(big, A[q]);
          sP.setView(null, big > 6.3 ? [-0.7, 11.2] : [-0.7, 6.4]);
          C.draw({ result: tr.at(tp), t, vmax: 6 });
          sC.tex(`\\tau\\,\\dot v_C+v_C=v_{in}`, 2, -0.75, { size: 15, color: 'ink' });
          sC.text(`τ = RC = ${M.si(tau, 's')}`, 2, -1.25, { size: 12, color: 'muted', align: 'center' });
          // ---- plot
          sP.hline(0, { color: 'faint', width: 1 });
          if (inp.value === 'step') {
            const t1 = 5 + tau * 1e3, lvl = V0 * (1 - Math.exp(-1));
            if (t1 < 60) { sP.vline(t1, { color: 'muted', width: 1, dash: [4, 4] }); sP.text('τ', t1, 6.1, { dx: 5, color: 'muted', size: 12, align: 'left', math: true }); }
            sP.hline(lvl, { color: 'muted', width: 1, dash: [2, 3] }); sP.text('63.2%', 60, lvl, { dx: -5, dy: -9, color: 'muted', size: 11, align: 'right' });
          }
          if (x2) sP.path(series(T, x2, 1e3, 2), { color: 'accent', width: 1.3, dash: [5, 4], alpha: 0.7 });
          sP.path(series(T, x, 1e3, 2), { color: 'accent', width: 1.8 });
          sP.path(series(T, y, 1e3, 2), { color: 'purple', width: 2.8 });
          sP.path(series(T, ex, 1e3, 4), { color: 'ink', width: 1.3, dash: [5, 4], alpha: 0.8 });
          if (y2) {
            sP.clip(() => { sP.path(series(T, ref, 1e3, 2), { color: 'green', width: 2.2 }); sP.path(series(T, y2, 1e3, 2), { color: 'orange', width: 2, dash: [6, 4] }); });
            if (chk.value === 'causal') sP.vline(30, { color: 'gold', width: 1.3, dash: [5, 4] });
          }
          sP.vline(ms, { color: 'gold', width: 1.2, alpha: 0.7 });
          const j = Math.min(T.length - 1, Math.round(tp / hS)); sP.dot(ms, y[j], { color: 'purple', r: 4.5 });
        }, { period: 8, still: 6.6 });
        const LG = { lin: ['$2\\times v_C$ (first run)', 'response to $2v_{in}$'], ti: ['$v_C(t-8\\text{ ms})$ (first run)', 'response to the delayed $v_{in}$'], causal: ['$v_C$ (first run)', 'response to the changed $v_{in}$'] };
        v.render(() => { const c = chk.value; v.legend([['accent', 'source $v_{in}$'], ['purple', '$v_C$ simulated'], ['ink', 'exact solution of $\\tau y\'+y=x$', { dash: true }], ...(c !== 'none' ? [['green', LG[c][0]], ['orange', LG[c][1], { dash: true }]] : [])]); });
        v.readout(() => {
          const R0 = run; if (!R0.y) return '';
          const { tau, T, y, dODE, err } = R0;
          let step = '';
          if (inp.value === 'step' && 5e-3 + tau < TE) { const j = Math.round((5e-3 + tau) / hS), vt = y[j]; step = ` · after one time constant $v_C$ = ${v.fix(vt, 4)} V = ${v.fix((100 * vt) / V0, 2)}% of ${V0} V (theory $1-1/e$ = 63.21%)`; }
          else if (inp.value === 'step') step = ' · $\\tau$ is longer than the window: lower $R$ or $C$';
          const CH = {
            lin: `doubling the source doubles $v_C$: largest difference ${errTex(err) === '0' ? '0' : `$${errTex(err)}$`} V (**linear**)`,
            ti: `the delayed source gives the delayed response: largest difference ${errTex(err) === '0' ? '0' : `$${errTex(err)}$`} V (**time-invariant**)`,
            causal: `before 30 ms the two runs agree to ${errTex(err) === '0' ? '0' : `$${errTex(err)}$`} V although the sources differ later (**causal**)`,
          };
          return `$\\tau=RC$ = ${M.si(tau, 's')}: the circuit obeys $(${v.fix(tau * 1e3, 2)}\\text{ ms})\\,v_C'+v_C=v_{in}$${step} · circuit solver vs exact solution: within ${M.si(dODE, 'V')} (time step 50 µs)${chk.value !== 'none' ? ` · check: ${CH[chk.value]}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Model',
      name: 'Difference equations: moving average and accumulator',
      statement: String.raw`A **linear constant-coefficient difference equation** computes each output sample from the current and past inputs and the past outputs:
$$y[n]=\sum_{k=0}^{M}b_k\,x[n-k]\;-\;\sum_{k=1}^{N}a_k\,y[n-k].$$
Two basic cases. The **$M$-point moving average** $y[n]=\frac1M\big(x[n]+x[n-1]+\dots+x[n-M+1]\big)$ uses inputs only (non-recursive); fed the impulse $\delta[n]$ it returns $h[n]=1/M$ for $0\le n<M$ and $0$ afterwards, a **finite impulse response**. The **accumulator** $y[n]=\sum_{k\le n}x[k]$ satisfies the recursion $y[n]=y[n-1]+x[n]$; its impulse response is the step $h[n]=u[n]$, which never ends, an **infinite impulse response**. Run forward from rest, such an equation defines a linear, time-invariant, causal system. The moving average is stable ($\sum|h|=1$) and the accumulator is not ($\sum|h|=\infty$); the leaky accumulator $y[n]=\alpha\,y[n-1]+x[n]$ has $h[n]=\alpha^nu[n]$ and is stable exactly when $|\alpha|<1$.`,
      scope: String.raw`An exact description of the computation. As a model of a data series, the moving average smooths fluctuations shorter than about $M$ samples and lags the trend by $(M-1)/2$ samples.`,
      idea: String.raw`A difference equation is an algorithm: march forward in $n$, keeping the last $M$ inputs (and, if it is recursive, the last outputs) in memory. Feeding $\delta[n]$ from rest gives the impulse response: for a non-recursive equation it is just the list of coefficients $b_0,\dots,b_M$, while a recursive one feeds each output back, so $y[n]=y[n-1]+\delta[n]$ returns $1,1,1,\dots$ forever. Running sums and first differences undo each other (sig-1.7), so the accumulator turns daily price changes back into the price, and the first difference of the price returns the changes. Linearity and time invariance make every output a sum of shifted copies of $h$, the convolution $y=h\ast x$ of chapter 3, which the readout checks numerically.`,
      caption: String.raw`Step through the equation sample by sample with the player (or let it run). Top: the input; the gold band is what the equation reads at step $n$. Middle: the output, built up to $n$. Bottom left: the impulse response $h[n]$; bottom right: the equation as a diagram of delays $z^{-1}$, gains and a sum, with the live values at step $n$. Feed the accumulator the daily changes and it rebuilds the price; feed it the step and it ramps forever; raise the leak $\alpha$ past 1.`,
      deps: ['sig-1.7', 'sig-2.1', 'sig-2.6'],
      see: ['sig-3.12'],
      refs: ['Oppenheim–Willsky §2.4', 'Lathi ch. 3'],
      tags: ['difference equations', 'FIR and IIR'],
      viz(v) {
        const M = v.M, NN = 60, NA = -4, HN = 24;
        const eqS = v.select('equation', [{ value: 'ma', label: 'moving average' }, { value: 'acc', label: 'accumulator' }, { value: 'leaky', label: 'leaky accumulator' }, { value: 'diff', label: 'first difference' }], 'ma', { onChange: (k) => S.setCode(CODE[k], 'difference equation') });
        const MS = v.slider('$M$', 2, 20, 5, { int: true });
        const aS = v.slider('leak $\\alpha$', 0, 1.06, 0.85, { step: 0.01 });
        const inS = v.select('input', [{ value: 'price', label: 'price' }, { value: 'chg', label: 'daily changes' }, { value: 'imp', label: 'impulse $\\delta[n]$' }, { value: 'step', label: 'step $u[n]$' }], 'price');
        const CODE = {
          ma: ['inputs before $n=0$ are $0$ (rest)', 'for $n=0,1,2,\\dots$', '    $y[n]\\leftarrow\\frac1M\\,\\big(x[n]+x[n-1]+\\dots+x[n-M+1]\\big)$'],
          acc: ['$y[-1]\\leftarrow0$ (rest)', 'for $n=0,1,2,\\dots$', '    $y[n]\\leftarrow y[n-1]+x[n]$'],
          leaky: ['$y[-1]\\leftarrow0$ (rest)', 'for $n=0,1,2,\\dots$', '    $y[n]\\leftarrow\\alpha\\,y[n-1]+x[n]$'],
          diff: ['$x[-1]\\leftarrow0$ (rest)', 'for $n=0,1,2,\\dots$', '    $y[n]\\leftarrow x[n]-x[n-1]$'],
        };
        const S = v.steps({ frames: Array.from({ length: NN + 1 }, (_, n) => ({ n, line: 3 })), code: CODE.ma, codeTitle: 'difference equation', codePos: 'below', speed: 7, autoplay: true, still: 42, note: false });
        // a synthetic share price: daily changes with a slight upward drift, price measured from day 0
        const r = rand(21), chg = [], price = []; let p = 0;
        for (let n = 0; n <= NN; n++) { const d = n === 0 ? 0 : 0.18 + 1.1 * normal(r); chg.push(d); p += d; price.push(p); }
        const sX = v.stage({ x: [NA - 0.8, NN + 0.8], y: [-3, 3], height: 165, axes: 'box', full: true, title: 'input $x[n]$' });
        const sY = v.stage({ x: [NA - 0.8, NN + 0.8], y: [-3, 3], height: 175, axes: 'box', xlabel: 'n', full: true, title: 'output $y[n]$' });
        const sH = v.stage({ x: [-2.8, HN + 0.8], y: [-1.3, 1.3], height: 205, axes: 'box', xlabel: 'n', weight: 1, title: 'impulse response $h[n]$' });
        const sD = v.stage({ x: [0, 16], y: [0, 6], equal: true, height: 205, axes: false, weight: 1.5, title: 'the equation as a diagram' });
        const runEq = (x) => {
          const k = eqS.value, Mv = MS.value, al = aS.value, y = new Array(x.length).fill(0);
          for (let n = 0; n < x.length; n++) {
            if (k === 'ma') { let s = 0; for (let j = 0; j < Mv; j++) s += n - j >= 0 ? x[n - j] : 0; y[n] = s / Mv; }
            else if (k === 'acc') y[n] = (n ? y[n - 1] : 0) + x[n];
            else if (k === 'leaky') y[n] = al * (n ? y[n - 1] : 0) + x[n];
            else y[n] = x[n] - (n ? x[n - 1] : 0);
          }
          return y;
        };
        const input = () => Array.from({ length: NN + 1 }, (_, n) => (inS.value === 'price' ? price[n] : inS.value === 'chg' ? chg[n] : inS.value === 'imp' ? +(n === 0) : 1));
        let info = null;
        v.render(() => {
          const k = eqS.value, Mv = MS.value, al = aS.value, n = S.frame.n ?? NN;
          MS.el.hidden = k !== 'ma'; aS.el.hidden = k !== 'leaky';
          const x = input(), y = runEq(x), hh = runEq(Array.from({ length: Math.max(NN, HN) + 1 }, (_, j) => +(j === 0)));
          // convolution check: y = h ∗ x
          let cerr = 0; for (let m = 0; m <= NN; m++) { let s = 0; for (let j = 0; j <= m; j++) s += hh[j] * x[m - j]; cerr = Math.max(cerr, Math.abs(s - y[m])); }
          const fit = (S2, vals, extra = []) => { let lo = 0, hi = 0; for (const u of [...vals, ...extra]) if (isFinite(u)) { lo = Math.min(lo, u); hi = Math.max(hi, u); } const pad = 0.15 * Math.max(1, hi - lo); S2.setView(null, [lo - pad, hi + pad]); };
          fit(sX, x); fit(sY, y, inS.value === 'price' && k === 'ma' ? x : []);
          // ---- input with the window the equation reads
          const w0 = k === 'ma' ? n - Mv + 1 : k === 'diff' ? n - 1 : NA - 0.3;
          sX.rect(Math.max(NA - 0.6, w0 - 0.5), -1e3, n + 0.5, 1e3, { fill: 'gold', fillAlpha: k === 'ma' || k === 'diff' ? 0.22 : 0.1, stroke: false });
          sX.hline(0, { color: 'faint', width: 1 });
          stems(sX, Array.from({ length: NN - NA + 1 }, (_, j) => [NA + j, NA + j < 0 ? 0 : x[NA + j]]), { color: 'accent' });
          // ---- output up to step n
          sY.hline(0, { color: 'faint', width: 1 });
          if (inS.value === 'price' && k === 'ma') sY.path(x.map((u, j) => [j, u]), { color: 'accent', width: 1.2, alpha: 0.45 });
          if (inS.value === 'chg' && k === 'acc') sY.path(price.map((u, j) => [j, u]), { color: 'green', width: 5, alpha: 0.25 });
          const P = Array.from({ length: NN - NA + 1 }, (_, j) => [NA + j, NA + j < 0 ? 0 : y[NA + j]]);
          stems(sY, P.filter(([m]) => m > n), { color: 'purple', alpha: 0.18 });
          stems(sY, P.filter(([m]) => m <= n), { color: 'purple' });
          sY.dot(n, y[n], { r: 8, hollow: true, color: 'gold', width: 2.2 });
          // ---- impulse response
          const hv = Array.from({ length: HN + 3 }, (_, j) => [j - 2, j - 2 < 0 ? 0 : hh[j - 2]]), hm = Math.max(1, ...hv.map((q) => Math.abs(q[1])));
          sH.setView(null, [-0.35 * hm - (k === 'diff' ? 0.9 : 0), 1.3 * hm]);
          sH.hline(0, { color: 'faint', width: 1 });
          stems(sH, hv, { color: 'teal' });
          const iir = k === 'acc' || k === 'leaky';
          if (iir && Math.abs(hh[HN]) > 1e-3) sH.text('… forever', HN, hv[hv.length - 1][1], { dx: -2, dy: -14, color: 'teal', size: 11.5, align: 'right', weight: 600 });
          const sumAbs = k === 'ma' ? 1 : k === 'diff' ? 2 : k === 'acc' || al >= 1 ? Infinity : 1 / (1 - al);
          sH.corner(`Σ|h| = ${isFinite(sumAbs) ? v.fix(sumAbs, 3) : '∞'}`, 'tr', { color: isFinite(sumAbs) ? 'green' : 'red', size: 12.5, weight: 600 });
          // ---- diagram
          const val = (m, arr) => (m < 0 ? 0 : arr[m]);
          if (!iir) {
            const taps = k === 'diff' ? [0, 1] : Mv <= 5 ? Array.from({ length: Mv }, (_, j) => j) : [0, 1, 2, null, Mv - 1];
            const X0 = 1.2, dx = 13 / Math.max(2, taps.length), yT = 4.4, yS = 1.1;
            bdWire(sD, [[0.1, yT], [X0, yT]], { color: 'ink', arrow: false });
            taps.forEach((j, q) => {
              const xq = X0 + q * dx;
              if (q > 0) { bdWire(sD, [[xq - dx + 0.25, yT], [xq - 1.15, yT]], { color: 'ink' }); bdBlock(sD, xq - 0.6, yT, 1.1, 0.95, j === null ? '\\cdots' : taps[q - 1] === null ? `z^{-${j - taps[q - 2]}}` : 'z^{-1}', { color: 'ink', size: 13 }); bdWire(sD, [[xq - 0.05, yT], [xq + 0.25, yT]], { color: 'ink', arrow: false }); }
              if (j === null) return;
              sD.dot(xq + 0.25, yT, { r: 3, color: 'ink' });
              bdWire(sD, [[xq + 0.25, yT], [xq + 0.25, 2.7]], { color: 'ink' });
              bdBlock(sD, xq + 0.25, 2.3, 1.2, 0.75, k === 'diff' ? (j === 0 ? '+1' : '-1') : '\\tfrac1M', { color: 'teal', size: 12 });
              bdWire(sD, [[xq + 0.25, 1.92], [xq + 0.25, yS + 0.08]], { color: 'ink', arrow: false });
              sD.text(`${v.fix(val(n - j, x), 2)}`, xq + 0.25, yT + 0.75, { size: 11.5, color: 'accent', align: 'center', weight: 600 });
              sD.text(j === 0 ? 'x[n]' : `x[n−${j}]`, xq + 0.25, yT + 1.25, { size: 11, color: 'muted', align: 'center', math: false });
            });
            const xe = X0 + (taps.length - 1) * dx + 0.25;
            bdWire(sD, [[X0 + 0.25, yS], [xe + 1.2, yS]], { color: 'ink' });
            sD.text(`y[n] = ${v.fix(y[n], 2)}`, xe + 1.3, yS, { size: 12.5, color: 'purple', weight: 700, align: 'left' });
            sD.text('Σ', X0 - 0.35, yS, { size: 15, color: 'muted', align: 'center', weight: 700 });
          } else {
            const yT = 4.2, yB = 1.4, xs = 4.2;
            bdWire(sD, [[0.3, yT], [xs - 0.4, yT]], { color: 'ink' });
            bdSum(sD, xs, yT, 15, { w: '+', s: '+' });
            bdWire(sD, [[xs + 0.4, yT], [14.5, yT]], { color: 'ink' });
            sD.dot(11, yT, { r: 3, color: 'ink' });
            bdWire(sD, [[11, yT], [11, yB], [9.6, yB]], { color: 'ink' });
            bdBlock(sD, 9, yB, 1.2, 0.95, 'z^{-1}', { color: 'ink', size: 13 });
            bdWire(sD, [[8.4, yB], [6.9, yB]], { color: 'ink' });
            bdBlock(sD, 6.2, yB, 1.3, 0.85, k === 'acc' ? '1' : '\\alpha', { color: 'teal', size: 13 });
            bdWire(sD, [[5.55, yB], [xs, yB], [xs, yT - 0.4]], { color: 'ink' });
            sD.text(`x[n] = ${v.fix(x[n], 2)}`, 1.9, yT + 0.6, { size: 12, color: 'accent', weight: 600, align: 'center' });
            sD.text(`y[n] = ${v.fix(y[n], 2)}`, 12.9, yT + 0.6, { size: 12.5, color: 'purple', weight: 700, align: 'center' });
            sD.text(`y[n−1] = ${v.fix(n ? y[n - 1] : 0, 2)}`, 11.6, (yT + yB) / 2, { size: 11.5, color: 'muted', weight: 600, align: 'left' });
          }
          info = { k, Mv, al, n, x, y, hh, cerr, sumAbs, iir };
        });
        v.legend([['accent', 'input $x[n]$', { dot: true }], ['purple', 'output $y[n]$', { dot: true }], ['teal', 'impulse response $h[n]$', { dot: true }], ['gold', 'what the equation reads at step $n$', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { k, Mv, al, n, x, y, cerr, sumAbs } = info, f = (u) => v.fix(u, 2);
          let eq;
          if (k === 'ma') { const terms = Array.from({ length: Math.min(Mv, 4) }, (_, j) => f(n - j >= 0 ? x[n - j] : 0)); eq = `$y[${n}]=\\frac1{${Mv}}$(${terms.join(' + ')}${Mv > 4 ? ' + …' : ''}) = ${f(y[n])}`; }
          else if (k === 'acc') eq = `$y[${n}]=y[${n - 1}]+x[${n}]$ = ${f(n ? y[n - 1] : 0)} + ${f(x[n])} = ${f(y[n])}`;
          else if (k === 'leaky') eq = `$y[${n}]=\\alpha\\,y[${n - 1}]+x[${n}]$ = ${v.fix(al, 2)}·${f(n ? y[n - 1] : 0)} + ${f(x[n])} = ${f(y[n])}`;
          else eq = `$y[${n}]=x[${n}]-x[${n - 1}]$ = ${f(x[n])} − ${f(n ? x[n - 1] : 0)} = ${f(y[n])}`;
          const fir = k === 'ma' ? `**FIR**: $h$ has ${Mv} nonzero samples, $\\sum|h|=1$, stable` : k === 'diff' ? '**FIR**: $h=\\delta[n]-\\delta[n-1]$, $\\sum|h|=2$, stable' : k === 'acc' ? '**IIR**: $h[n]=u[n]$ never ends and $\\sum|h|=\\infty$: unstable (a step makes $y$ grow like $n+1$)' : al < 1 ? `**IIR**: $h[n]=\\alpha^n$ decays, $\\sum|h|=1/(1-\\alpha)$ = ${v.fix(sumAbs, 2)}: stable` : `**IIR** with $\\alpha\\ge1$: $h[n]=\\alpha^n$ does not decay, unstable`;
          let extra = '';
          if (inS.value === 'chg' && k === 'acc') extra = ` · summing the daily changes rebuilds the price: $\\max_n|y[n]-\\text{price}[n]|$ = ${num(Math.max(...y.map((u, j) => Math.abs(u - price[j]))))}`;
          if (inS.value === 'price' && k === 'diff') extra = ` · differencing the price returns the daily changes: $\\max_n|y[n]-\\text{change}[n]|$ = ${num(Math.max(...y.map((u, j) => Math.abs(u - chg[j]))))}`;
          if (inS.value === 'price' && k === 'ma') extra = ` · the average lags the price by about $(M-1)/2$ = ${v.fix((Mv - 1) / 2, 1)} days`;
          return `${eq} · ${fir} · the output equals the convolution $h\\ast x$ to ${num(cerr)} (chapter 3)${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Concept',
      name: 'Incremental linearity: zero-input plus zero-state response',
      statement: String.raw`A system is **incrementally linear** if the difference between the responses to any two inputs depends linearly on the difference of the inputs: $S\{x_1\}-S\{x_2\}=L\{x_1-x_2\}$ for a linear system $L$. Equivalently $S\{x\}=y_{zi}+L\{x\}$, the sum of the **zero-input response** $y_{zi}=S\{0\}$ and the **zero-state response** $L\{x\}$ (the response from rest). The standard example is an RC circuit whose capacitor starts charged: for $RC\,y'+y=x$ with $y(0)=y_0$,
$$y(t)=\underbrace{y_0\,e^{-t/RC}}_{\text{zero-input}}+\underbrace{\int_0^t\frac1{RC}\,e^{-(t-s)/RC}\,x(s)\,ds}_{\text{zero-state}},\qquad t\ge0.$$
Unless $y_0=0$ this system is not linear: zero input gives a nonzero output, and $S\{a x\}-a\,S\{x\}=(1-a)\,y_0e^{-t/RC}$. The affine map $y=2x+1$ is the memoryless example.`,
      idea: String.raw`A linear differential equation is linear in the pair (initial state, input) jointly. The solution with initial value $y_0$ and input $x$ is therefore the sum of the solution with initial value $y_0$ and no input and the solution from rest with input $x$: each solves its own problem, and the sum solves the original one (ode-1.4). Seen as a map from the input alone, the stored charge adds a fixed signal $y_0e^{-t/RC}$, which is why a charged capacitor seems to break superposition (2.2). The cure is bookkeeping: either treat the initial state as an extra input, or subtract the zero-input response, after which differences of responses are always linear. This zero-input/zero-state split is how the Laplace transform handles initial conditions (chapter 9).`,
      caption: String.raw`Set the capacitor's initial charge and choose a source. The circuit solver runs three times: with the charge and the source (purple), with the charge only (zero-input, teal) and from rest with the source (zero-state, orange); the shaded bands stack the two parts and land exactly on the purple curve. Bottom: the linearity test $S\{ax\}$ against $aS\{x\}$, whose mismatch (red) is exactly $(1-a)$ times the zero-input response (dotted). Set the initial charge to 0 and the mismatch disappears. Drag the gold cursor to see the circuit at that instant.`,
      deps: ['sig-2.2', 'sig-2.9', 'ode-1.4'],
      see: ['circ-3.1'],
      refs: ['Oppenheim–Willsky §1.6', 'Lathi ch. 2'],
      tags: ['incremental linearity', 'initial conditions'],
      viz(v) {
        const M = v.M, TE = 0.06, hS = 5e-5;
        const v0S = v.slider('initial charge $v_C(0)$', -4, 5, 3.5, { step: 0.1, fmt: (u) => `${v.fix(u, 1)} V` });
        const inp = v.select('source $v_{in}$', [{ value: 'step', label: 'step' }, { value: 'pulse', label: 'pulse' }, { value: 'sine', label: 'sinusoid' }, { value: 'none', label: 'none' }], 'sine');
        const aS = v.slider('test with $a$ =', -1, 3, 2, { step: 0.05 });
        const sC = v.stage({ x: [-2.2, 6.6], y: [-1.4, 4.1], equal: true, height: 255, axes: false, weight: 0.8 });
        const sP = v.stage({ x: [0, 60], y: [-5, 6], height: 255, axes: 'box', xlabel: 't (ms)', weight: 1.4, title: 'total response = zero-input + zero-state (volts)' });
        const sL = v.stage({ x: [0, 60], y: [-5, 6], height: 200, axes: 'box', xlabel: 't (ms)', full: true, title: 'is $x\\mapsto v_C$ linear? $S\\{ax\\}$ against $aS\\{x\\}$' });
        const src = (ms) => (inp.value === 'step' ? (ms >= 8 ? 4 : 0) : inp.value === 'pulse' ? (ms >= 8 && ms < 22 ? 4 : 0) : inp.value === 'sine' ? 3 * Math.sin((TAU * ms) / 25) : 0);
        let wave = (t) => src(t * 1e3);
        const C = v.circuit(sC, [
          { type: 'V', id: 'Vin', wave: (t) => wave(t), at: [0, 3, 0, 0], label: false },
          { type: 'R', id: 'R', value: 1e3, at: [0, 3, 4, 3] },
          { type: 'C', id: 'C', value: 10e-6, ic: 3.5, at: [4, 3, 4, 0] },
          { type: 'W', at: [4, 0, 0, 0] }, { type: 'GND', at: [2, 0] },
          { type: 'label', at: [4, 3], text: '$v_C$', dx: 10, dy: -6 },
          { type: 'label', at: [0, 3], text: '$v_{in}$', dx: -10, dy: -6 },
        ]);
        C.control('R', '$R$', 200, 5e3);
        const cur = sP.handle(14, -4.4, { color: 'gold', r: 6.5, constrain: (x) => [M.clamp(x, 0, 60), sP.bounds ? sP.bounds.y[0] + 0.07 * (sP.bounds.y[1] - sP.bounds.y[0]) : -4.4] });
        let run = { key: '' };
        const nC = () => C.net.termNode.get('C').a;
        const simulate = () => {
          const Rv = C.part('R').value, Cv = C.part('C').value, y0 = v0S.value, a = aS.value, key = `${Rv}|${Cv}|${y0}|${inp.value}|${a}`;
          if (key === run.key) return run;
          const go = (ic, k) => { C.part('C').ic = ic; wave = (t) => k * src(t * 1e3); const tr = C.transient(TE, hS); return tr; };
          const trT = go(y0, 1), zi = go(y0, 0).v[nC()], zs = go(0, 1).v[nC()], tA = go(y0, a).v[nC()];
          C.part('C').ic = y0; wave = (t) => src(t * 1e3);
          const T = trT.t, tot = trT.v[nC()], x = Float64Array.from(T, (t) => src(t * 1e3));
          let dec = 0, lin = 0, pred = 0;
          for (let j = 0; j < T.length; j++) { dec = Math.max(dec, Math.abs(tot[j] - zi[j] - zs[j])); const mm = tA[j] - a * tot[j]; lin = Math.max(lin, Math.abs(mm)); pred = Math.max(pred, Math.abs(mm - (1 - a) * zi[j])); }
          return (run = { key, tau: Rv * Cv, y0, a, T, tot, zi, zs, tA, x, dec, lin, pred, trT });
        };
        v.render(() => {
          const R0 = simulate(), { T, tot, zi, zs, tA, x, a, trT } = R0;
          const fitv = (S2, arrs) => { let lo = 0, hi = 0; for (const A of arrs) for (let j = 0; j < A.length; j += 4) { lo = Math.min(lo, A[j]); hi = Math.max(hi, A[j]); } const pad = 0.14 * Math.max(1, hi - lo); S2.setView(null, [lo - pad * 1.6, hi + pad]); };
          fitv(sP, [tot, zi, zs, x]);
          const ms = cur.x, j = Math.min(T.length - 1, Math.round(ms / 1e3 / hS));
          cur.y = sP.bounds.y[0] + 0.07 * (sP.bounds.y[1] - sP.bounds.y[0]);
          C.draw({ result: trT.at(ms / 1e3), dots: false, vmax: 6 });
          sC.text(`v_C(0) = ${v.fix(R0.y0, 1)} V`, 4, 1.5, { dx: 16, size: 12, color: 'teal', weight: 600, align: 'left' });
          sC.text(`t = ${v.fix(ms, 1)} ms`, 2, -0.8, { size: 12.5, color: 'gold', weight: 600, align: 'center' });
          sC.text(`τ = RC = ${M.si(R0.tau, 's')}`, 2, -1.25, { size: 12, color: 'muted', align: 'center' });
          // ---- decomposition: stacked bands and curves
          sP.hline(0, { color: 'faint', width: 1 });
          const band = (lo, hi, col) => { const top = [], bot = []; for (let k = 0; k < T.length; k += 4) { top.push([T[k] * 1e3, hi(k)]); bot.push([T[k] * 1e3, lo(k)]); } sP.path(top.concat(bot.reverse()), { fill: col, fillAlpha: 0.18, stroke: false, close: true }); };
          band(() => 0, (k) => zi[k], 'teal'); band((k) => zi[k], (k) => zi[k] + zs[k], 'orange');
          sP.path(series(T, x, 1e3, 4), { color: 'accent', width: 1.3, alpha: 0.7 });
          sP.path(series(T, zi, 1e3, 2), { color: 'teal', width: 2 });
          sP.path(series(T, zs, 1e3, 2), { color: 'orange', width: 2 });
          sP.path(series(T, tot, 1e3, 2), { color: 'purple', width: 3 });
          sP.path(Array.from({ length: Math.floor(T.length / 8) }, (_, q) => [T[q * 8] * 1e3, zi[q * 8] + zs[q * 8]]), { color: 'green', width: 2, dash: [2, 5] });
          sP.vline(ms, { color: 'gold', width: 1.2, dash: [4, 4] });
          sP.dot(ms, tot[j], { color: 'purple', r: 4.5 });
          // ---- linearity test
          const mm = Float64Array.from(T, (_, k) => tA[k] - a * tot[k]), aT = Float64Array.from(tot, (u) => a * u);
          fitv(sL, [tA, aT, mm]);
          sL.hline(0, { color: 'faint', width: 1 });
          const L = series(T, tA, 1e3, 4), Q = series(T, aT, 1e3, 4);
          for (let k = 0; k + 1 < L.length; k++) sL.poly([L[k], L[k + 1], Q[k + 1], Q[k]], { fill: 'red', fillAlpha: 0.18, stroke: false });
          sL.path(series(T, tA, 1e3, 2), { color: 'green', width: 2.5 });
          sL.path(series(T, aT, 1e3, 2), { color: 'orange', width: 2, dash: [6, 4] });
          sL.path(series(T, mm, 1e3, 2), { color: 'red', width: 2.2 });
          sL.path(Array.from({ length: Math.floor(T.length / 10) }, (_, q) => [T[q * 10] * 1e3, (1 - a) * zi[q * 10]]), { color: 'ink', width: 1.6, dash: [2, 4] });
        });
        v.legend([['accent', 'source $v_{in}$'], ['purple', 'total $v_C$'], ['teal', 'zero-input (charge only)'], ['orange', 'zero-state (from rest)'], ['green', '$S\\{ax\\}$ / sum of the parts', { dash: true }], ['red', 'mismatch $S\\{ax\\}-aS\\{x\\}$'], ['ink', '$(1-a)\\times$ zero-input', { dash: true }]]);
        v.readout(() => {
          const R0 = run; if (!R0.T) return '';
          const { y0, a, dec, lin, pred, tau } = R0;
          const lt = lin < 1e-9 ? `$S\\{ax\\}$ and $aS\\{x\\}$ agree to $${errTex(lin < 1e-12 ? 0 : lin)}$ V: with no stored charge the circuit is linear` : `$S\\{ax\\}$ and $aS\\{x\\}$ differ by up to ${num(lin)} V, so $x\\mapsto v_C$ is **not linear**; the mismatch equals $(1-a)\\,y_{zi}$ to $${errTex(pred < 1e-13 ? 0 : pred)}$ V`;
          return `$v_C(0)$ = ${v.fix(y0, 1)} V, $\\tau$ = ${M.si(tau, 's')}: zero-input response $${v.fix(y0, 1)}\\,e^{-t/\\tau}$, zero-state response from rest · the three simulations satisfy total = zero-input + zero-state to $${errTex(dec < 1e-13 ? 0 : dec)}$ V · with $a$ = ${v.fix(a, 2)}: ${lt}`;
        });
      },
    },
  ],
};
