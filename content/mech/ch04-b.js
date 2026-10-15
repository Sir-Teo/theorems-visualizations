// Classical Mechanics — Chapter 4: Oscillations (part b: 4.11–4.19)

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
/** One classical RK4 step for y' = f(t, y) with an array state. */
function rk4step(f, t, y, h) {
  const n = y.length, k1 = f(t, y), y2 = new Array(n), y3 = new Array(n), y4 = new Array(n), out = new Array(n);
  for (let i = 0; i < n; i++) y2[i] = y[i] + h / 2 * k1[i];
  const k2 = f(t + h / 2, y2); for (let i = 0; i < n; i++) y3[i] = y[i] + h / 2 * k2[i];
  const k3 = f(t + h / 2, y3); for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
  const k4 = f(t + h, y4); for (let i = 0; i < n; i++) out[i] = y[i] + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  return out;
}
/** Arithmetic–geometric mean (Gauss). */
function agm(a, b) { for (let i = 0; i < 60 && Math.abs(a - b) > 1e-15 * a; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return (a + b) / 2; }
/** Complete elliptic integral of the first kind K(k) = π / (2 AGM(1, √(1−k²))). */
const ellK = (k) => (k >= 1 ? Infinity : Math.PI / (2 * agm(1, Math.sqrt(1 - k * k))));
/** Zig-zag spring polyline from (x0, y0) to (x1, y1). */
function springPts(x0, y0, x1, y1, n = 10, w = 0.6, lead = 0.1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-9, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = lead * L;
  const pts = [[x0, y0], [x0 + ux * a, y0 + uy * a]];
  for (let i = 1; i < 2 * n; i++) { const s = a + (L - 2 * a) * i / (2 * n), o = (i % 2 ? 1 : -1) * w; pts.push([x0 + ux * s + nx * o, y0 + uy * s + ny * o]); }
  pts.push([x1 - ux * a, y1 - uy * a], [x1, y1]);
  return pts;
}
/** A wall / ceiling: segment (x0,y0)–(x1,y1) with hatching on one side (side = ±1), drawn in pixels. */
function hatch(v, s, x0, y0, x1, y1, side = 1, gap = 7, len = 7) {
  const c = s.ctx, X0 = s.X(x0), Y0 = s.Y(y0), X1 = s.X(x1), Y1 = s.Y(y1), L = Math.hypot(X1 - X0, Y1 - Y0);
  if (L < 1) return;
  const ux = (X1 - X0) / L, uy = (Y1 - Y0) / L, nx = -uy * side, ny = ux * side;
  c.save(); c.strokeStyle = v.color('muted', 0.75); c.lineWidth = 1.1; c.beginPath();
  for (let d = gap / 2; d < L; d += gap) { const px = X0 + ux * d, py = Y0 + uy * d; c.moveTo(px, py); c.lineTo(px + (nx - ux) * len * 0.7, py + (ny - uy) * len * 0.7); }
  c.stroke(); c.restore();
  s.line(x0, y0, x1, y1, { color: 'muted', width: 2 });
}
/** Times at which a sampled signal crosses `level` upward (linear interpolation). */
function upCrossings(ts, xs, level = 0) {
  const out = [];
  for (let i = 1; i < xs.length; i++) if (xs[i - 1] < level && xs[i] >= level) out.push(ts[i - 1] + (level - xs[i - 1]) / (xs[i] - xs[i - 1]) * (ts[i] - ts[i - 1]));
  return out;
}
/** Pendulum θ'' = −sin θ released from rest at θ0: RK4 until the velocity vanishes again (half period). */
function pendulumHalf(th0, h) {
  let y = [th0, 0], t = 0; const f = (t, y) => [y[1], -Math.sin(y[0])], ts = [0], xs = [th0];
  for (;;) {
    const yn = rk4step(f, t, y, h);
    if (t > 0 && y[1] < 0 && yn[1] >= 0) { const u = y[1] / (y[1] - yn[1]); ts.push(t + u * h); xs.push(y[0] + u * (yn[0] - y[0])); return { half: t + u * h, ts, xs }; }
    y = yn; t += h; ts.push(t); xs.push(y[0]);
    if (t > 400) return { half: NaN, ts, xs };
  }
}
/** Real roots of a x³ + b x² + c x + d (degree drops when leading coefficients vanish). */
function cubicRoots(a, b, c, d) {
  if (Math.abs(a) < 1e-13) {
    if (Math.abs(b) < 1e-13) return Math.abs(c) < 1e-13 ? [] : [-d / c];
    const D = c * c - 4 * b * d; if (D < 0) return []; const s = Math.sqrt(D); return [(-c + s) / (2 * b), (-c - s) / (2 * b)];
  }
  b /= a; c /= a; d /= a;
  const p = c - b * b / 3, q = 2 * b * b * b / 27 - b * c / 3 + d, off = -b / 3, disc = q * q / 4 + p * p * p / 27;
  if (disc > 0) { const s = Math.sqrt(disc); return [Math.cbrt(-q / 2 + s) + Math.cbrt(-q / 2 - s) + off]; }
  if (p > -1e-15) return [Math.cbrt(-q) + off];
  const r = 2 * Math.sqrt(-p / 3), ph = Math.acos(clamp(3 * q / (p * r), -1, 1)) / 3;
  return [0, 1, 2].map((k) => r * Math.cos(ph - TAU * k / 3) + off);
}
/** Float32 audio buffer with short fade-in/out ramps (no clicks). */
function fade(buf, sr, msIn = 20, msOut = 30) {
  const a = Math.floor(sr * msIn / 1000), b = Math.floor(sr * msOut / 1000);
  for (let i = 0; i < a && i < buf.length; i++) buf[i] *= i / a;
  for (let i = 0; i < b && i < buf.length; i++) buf[buf.length - 1 - i] *= i / b;
  return buf;
}
const piTicks = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];

export default {
  collection: 'mech',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11', kind: 'Definition', name: 'Quality factor',
      statement: String.raw`The **quality factor** of a damped oscillator $\ddot x+2\beta\dot x+\omega_0^2x=0$ is the dimensionless number
$$Q = \frac{\omega_0}{2\beta} \;\approx\; 2\pi\,\frac{\text{energy stored}}{\text{energy lost per cycle}} .$$
For light damping ($Q\gg1$) it measures three things at once:
(a) the **width** of resonance: the curve $A^2(\omega)$ has full width at half maximum $\Delta\omega\approx\omega_0/Q$;
(b) the **ring-down time**: freely, the amplitude falls by a factor $e$ in time $1/\beta = 2Q/\omega_0$, i.e. in about $Q/\pi$ cycles;
(c) the **loss per cycle**: each cycle removes a fraction $\approx 2\pi/Q$ of the stored energy.`,
      idea: String.raw`All three come from the single small number $\beta/\omega_0 = 1/2Q$. In free decay $E\propto e^{-2\beta t}$, so one cycle ($t=2\pi/\omega_0$) multiplies $E$ by $e^{-2\pi/Q}\approx1-2\pi/Q$, and the amplitude reaches $1/e$ after $t=1/\beta$, which is $\omega_0/(2\pi\beta) = Q/\pi$ cycles. Near resonance (4.10) write $\omega=\omega_0+\epsilon$: then $(\omega_0^2-\omega^2)^2+4\beta^2\omega^2\approx4\omega_0^2(\epsilon^2+\beta^2)$, a Lorentzian in $\epsilon$ whose height halves at $\epsilon=\pm\beta$ — full width $2\beta=\omega_0/Q$. The approximations fail once $Q$ is of order 1, and below $Q=\tfrac12$ there is no oscillation at all.`,
      caption: String.raw`Slide $Q$ (log scale) from a sluggish $0.3$ to a tuning-fork-like $3000$. Left: the resonance peak narrows; its measured width (green bracket) tracks $\omega_0/Q$. Right: the free ring-down, simulated, with the $1/e$ point marked; at high $Q$ the individual cycles are too dense to draw and only the envelope is shown. **Ring it** plays the ring-down as a $440$ Hz tone: a dull tock at low $Q$, a sustained ping at high $Q$.`,
      deps: ['mech-4.10', 'mech-4.7'],
      refs: ['Taylor §5.6'],
      tags: ['resonance', 'damping'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Q_factor' },
      viz(v) {
        const Qs = v.slider('quality factor $Q$', 0.3, 3000, 40, { log: true, decimals: 1 });
        const sR = v.stage({ x: [0, 2], y: [0, 1.15], height: 300, axes: 'box', xlabel: 'ω/ω₀', weight: 1, title: 'resonance curve $A^2(\\omega)/A^2_{\\max}$' });
        const sD = v.stage({ x: [0, 10], y: [-1.15, 1.15], height: 300, axes: 'box', xlabel: 'cycles', weight: 1.2, title: 'free ring-down from $x=1$ (simulated)' });
        const P = (w, Q) => 1 / ((1 - w * w) ** 2 + (w / Q) ** 2);
        let S = null, key = -1;
        function compute() {
          const Q = Qs.value; if (Q === key) return S; key = Q;
          const wR = Q > Math.SQRT1_2 ? Math.sqrt(1 - 1 / (2 * Q * Q)) : 0, Pm = P(wR, Q), half = Pm / 2;
          const bis = (a, b) => { const fa = P(a, Q) - half; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if ((P(m, Q) - half) * fa > 0) a = m; else b = m; } return (a + b) / 2; };
          let wHi = wR + 0.1; while (P(wHi, Q) > half) wHi *= 1.5;
          const hi = bis(wR, wHi), lo = P(0, Q) > half ? NaN : bis(0, wR);
          const ws = []; for (let i = 0; i <= 600; i++) ws.push(2 * i / 600);
          for (let i = -300; i <= 300; i++) { const w = wR + 10 * i / (300 * Q); if (w > 0 && w < 2) ws.push(w); }
          ws.sort((a, b) => a - b);
          const curve = ws.map((w) => [w, P(w, Q) / Pm]);
          // ring-down: RK4 inline (48 steps per natural period), over ~3.2 Q/π cycles
          const b = 1 / (2 * Q), C = Math.max(4, Math.min(3000, 3.2 * Q / Math.PI)), m = 48, n = Math.ceil(C * m), h = TAU / m;
          let x = 1, u = 0; const peaks = [[0, 1]], dense = C <= 150, pts = dense ? [[0, 1]] : null;
          const acc = (x, u) => -2 * b * u - x;
          for (let i = 0; i < n; i++) {
            const k1x = u, k1u = acc(x, u), k2x = u + h / 2 * k1u, k2u = acc(x + h / 2 * k1x, u + h / 2 * k1u);
            const k3x = u + h / 2 * k2u, k3u = acc(x + h / 2 * k2x, u + h / 2 * k2u), k4x = u + h * k3u, k4u = acc(x + h * k3x, u + h * k3u);
            const xn = x + h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x), un = u + h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
            if (u * un < 0) { const s = u / (u - un); peaks.push([(i + s) / m, Math.abs(x + s * (xn - x))]); }
            x = xn; u = un; if (dense) pts.push([(i + 1) / m, x]);
          }
          let ce = NaN; for (let i = 1; i < peaks.length; i++) if (peaks[i][1] < 1 / Math.E) { const [t0, a0] = peaks[i - 1], [t1, a1] = peaks[i]; ce = t0 + (Math.log(a0) + 1) / (Math.log(a0) - Math.log(a1)) * (t1 - t0); break; }
          if (!isFinite(ce) && peaks.length < 3) { // overdamped: no peaks — use the monotone decay itself
            const X = (t) => { const s = Math.sqrt(b * b - 1 + 1e-15), l1 = -b + s, l2 = -b - s, c1 = -l2 / (l1 - l2); return c1 * Math.exp(l1 * t) + (1 - c1) * Math.exp(l2 * t); };
            let a = 0, z = 1; while (X(z) > 1 / Math.E && z < 1e6) z *= 2; for (let i = 0; i < 80; i++) { const mm = (a + z) / 2; if (X(mm) > 1 / Math.E) a = mm; else z = mm; } ce = a / TAU;
          }
          const loss = peaks.length > 3 ? 1 - (peaks[3][1] / peaks[1][1]) ** 2 : NaN;
          return (S = { Q, wR, lo, hi, curve, C, peaks, pts, ce, loss, b });
        }
        v.render(() => {
          const s = compute(), Q = s.Q;
          // resonance curve
          sR.hline(0.5, { color: 'muted', dash: [4, 4], width: 1 });
          sR.path(s.curve, { color: 'accent', width: 2.4 });
          if (isFinite(s.lo)) {
            sR.line(s.lo, 0.5, s.hi, 0.5, { color: 'green', width: 3 });
            sR.line(s.lo, 0.44, s.lo, 0.56, { color: 'green', width: 2 }); sR.line(s.hi, 0.44, s.hi, 0.56, { color: 'green', width: 2 });
            sR.text(`Δω = ${v.fmt(s.hi - s.lo, 3)} ω₀`, Math.min(1.97, s.hi + 0.04), 0.5, { color: 'green', size: 11.5, weight: 600, dy: -10, align: s.hi + 0.04 > 1.6 ? 'right' : 'left' });
          } else sR.corner('Q < 1/√2: the curve never halves below the peak', 'tr', { color: 'red', weight: 600 });
          // ring-down
          sD.setView([0, s.C], [-1.15, 1.15]);
          sD.hline(0, { color: 'faint', width: 1 });
          for (const sg of [1, -1]) sD.fn((c) => sg * Math.exp(-s.b * TAU * c), { color: 'orange', dash: [5, 4], width: 1.4 });
          if (s.pts) sD.path(s.pts, { color: 'accent', width: s.C > 60 ? 1 : 1.8 });
          else {
            const top = s.peaks.map((p) => [p[0], p[1]]), bot = s.peaks.map((p) => [p[0], -p[1]]).reverse();
            sD.path(top.concat(bot), { fill: 'accent', fillAlpha: 0.3, stroke: false, close: true });
            sD.path(top, { color: 'accent', width: 1.6 }); sD.path(bot, { color: 'accent', width: 1.6 });
            sD.corner(`${v.fmt(s.C, 3)} cycles: only the envelope can be drawn`, 'br', { size: 11 });
          }
          if (isFinite(s.ce) && s.ce < s.C) {
            sD.vline(s.ce, { color: 'green', dash: [4, 3], width: 1.4 });
            sD.dot(s.ce, 1 / Math.E, { color: 'green', r: 4.5 });
            sD.text(`1/e after ${v.fmt(s.ce, 3)} cycles`, s.ce, 0.95, { color: 'green', size: 11.5, weight: 600, dx: 6 });
          }
        });
        v.legend([['accent', 'simulated / exact curve'], ['green', 'measured width and $1/e$ time'], ['orange', 'envelope $e^{-\\beta t}$', { dash: true }]]);
        v.readout(() => {
          const s = compute(), Q = s.Q;
          if (Q < 0.5) return `$Q = ${v.fix(Q, 2)} < \\tfrac12$: overdamped — no oscillation, no peak; the amplitude creeps to $1/e$ after ${v.fmt(s.ce, 3)} natural periods. The cycle-based meanings of $Q$ are lost.`;
          const fw = isFinite(s.lo) ? `measured FWHM $${v.fmt(s.hi - s.lo, 4)}\\,\\omega_0$ vs $\\omega_0/Q = ${v.fmt(1 / Q, 4)}\\,\\omega_0$` : 'no half-maximum width (peak too broad)';
          return `$Q = ${v.fmt(Q, 4)}$ · ${fw} · amplitude falls by $e$ after ${v.fmt(s.ce, 4)} cycles vs $Q/\\pi = ${v.fmt(Q / Math.PI, 4)}$ · energy lost per cycle ${isFinite(s.loss) ? v.fix(100 * s.loss, 3) + ' %' : '—'} vs $2\\pi/Q = ${v.fix(100 * TAU / Q, 3)}$ %${Q < 10 ? ' (the small-loss formulas are only good for $Q\\gg1$)' : ''}`;
        });
        v.soundButton('Ring it (440 Hz)', (snd) => {
          const sr = 44100, Q = Qs.value, W0 = TAU * 440, b = W0 / (2 * Q), dur = Math.min(6, Math.max(0.5, 7 / b)), n = Math.floor(sr * dur), out = new Float32Array(n);
          const w1 = Q > 0.5 ? W0 * Math.sqrt(1 - 1 / (4 * Q * Q)) : 0;
          for (let i = 0; i < n; i++) { const t = i / sr; out[i] = Q > 0.5 ? Math.exp(-b * t) * (Math.cos(w1 * t) + b / w1 * Math.sin(w1 * t)) : Math.exp(-W0 * W0 / (2 * b) * t); }
          snd.samples(fade(out, sr, 2, 40), sr, { gain: 0.7 });
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12', kind: 'Method', name: 'Fourier analysis of periodic driving',
      statement: String.raw`Let a damped oscillator be driven by a $T$-periodic force, $\ddot x+2\beta\dot x+\omega_0^2x = \omega_0^2 f(t)$, and expand the drive in a Fourier series $f(t) = \sum_{n\in\Z} c_n e^{in\omega t}$ with $\omega = 2\pi/T$. Then the steady-state response is
$$x(t) = \sum_{n\in\Z} c_n\,H(n\omega)\,e^{in\omega t},\qquad H(\Omega) = \frac{\omega_0^2}{\omega_0^2-\Omega^2+2i\beta\Omega},$$
a series that converges absolutely and uniformly (since $|H(n\omega)| = O(1/n^2)$ and $\sum|c_n|^2<\infty$). Each harmonic is amplified by its own resonance factor; if $\omega_0\approx n\omega$ and the damping is light, the $n$-th harmonic dominates the motion.`,
      idea: String.raw`The equation is linear, so solutions to sums of drives are sums of solutions. Each Fourier mode $c_ne^{in\omega t}$ is a sinusoidal drive whose steady response is $c_nH(n\omega)e^{in\omega t}$ (4.9). The coefficients are the inner products of $f$ with the orthonormal system $e^{in\omega t}$ (pma-8.10), and Parseval’s theorem (pma-8.16) makes $\sum|c_n|^2$ finite; together with $|H|\le C/n^2$ the Cauchy–Schwarz inequality gives absolute convergence. The mean square of the response splits harmonic by harmonic, which is how the readout measures which term dominates.`,
      caption: String.raw`Pick a drive waveform and tune the natural frequency $\omega_0$ against the drive frequency $\omega$. Top: one cycle of drive (orange) and response — the Fourier sum (blue) and a direct numerical integration (dashed) coincide. Bottom, on a log scale: the size of each drive harmonic (orange), of each response harmonic (blue), and the gain $|H(\Omega)|$ (grey). Put $\omega_0$ on an odd harmonic of the square wave and that one term takes over; on an even one, nothing happens — the square wave has no even harmonics. **Listen** to the drive and the response at $110$ Hz.`,
      deps: ['mech-4.9', 'pma-8.10', 'pma-8.16'],
      refs: ['Taylor §5.7', 'Taylor §5.8'],
      tags: ['Fourier series', 'superposition', 'resonance'],
      viz(v) {
        const PD = 0.12;
        const WAVES = {
          square: { label: 'square', f: (u) => (u >= 0 ? 1 : -1), a0: 0, an: () => 0, bn: (n) => (n % 2 ? 4 / (Math.PI * n) : 0) },
          saw: { label: 'sawtooth', f: (u) => u / Math.PI, a0: 0, an: () => 0, bn: (n) => 2 * (n % 2 ? 1 : -1) / (Math.PI * n) },
          tri: { label: 'triangle', f: (u) => 1 - 2 * Math.abs(u) / Math.PI, a0: 0, an: (n) => (n % 2 ? 8 / (Math.PI * Math.PI * n * n) : 0), bn: () => 0 },
          pulse: { label: 'pulse train', f: (u) => (Math.abs(u) < Math.PI * PD ? 1 : 0), a0: 2 * PD, an: (n) => 2 * Math.sin(n * Math.PI * PD) / (n * Math.PI), bn: () => 0 },
        };
        const wave = v.select('drive', Object.entries(WAVES).map(([value, w]) => ({ value, label: w.label })), 'square');
        const r0 = v.slider('natural frequency $\\omega_0/\\omega$', 0.6, 9.5, 3, { step: 0.01 });
        const Qs = v.slider('quality factor $Q$', 1, 50, 15, { log: true, decimals: 1 });
        const sT = v.stage({ x: [-Math.PI, Math.PI], y: [-2, 2], height: 250, full: true, axes: true, xlabel: 'ωt', xticks: piTicks, title: 'one drive period' });
        const sB = v.stage({ x: [-0.6, 16.6], y: [5e-4, 60], ylog: true, height: 230, full: true, axes: 'box', xlabel: 'harmonic n', xticks: Array.from({ length: 17 }, (_, n) => n), title: 'harmonic amplitudes (log scale)' });
        const NH = 300, NP = 400;
        const wrap = (t) => { let u = (t + Math.PI) % TAU; if (u < 0) u += TAU; return u - Math.PI; };
        let S = null, key = '';
        function compute() {
          const kk = `${wave.value}|${r0.value}|${Qs.value}`; if (kk === key) return S; key = kk;
          const W = WAVES[wave.value], w0 = r0.value, b = w0 / (2 * Qs.value), w2 = w0 * w0;
          const H = (n) => { const re = w2 - n * n, im = 2 * b * n, d = re * re + im * im; return [w2 * re / d, -w2 * im / d]; };
          const terms = []; let pw = (W.a0 / 2) ** 2, total = 0;
          for (let n = 1; n <= NH; n++) { const a = W.an(n), bb = W.bn(n); if (!a && !bb) { terms.push(null); continue; } const [hr, hi] = H(n); terms.push({ n, a, b: bb, hr, hi, d: Math.hypot(a, bb), r: Math.hypot(a, bb) * Math.hypot(hr, hi) }); }
          const dc = W.a0 / 2; pw = dc * dc; for (const tm of terms) if (tm) pw += tm.r * tm.r / 2; total = pw;
          const X = (t) => { let s = dc; for (const tm of terms) { if (!tm) continue; const c = Math.cos(tm.n * t), sn = Math.sin(tm.n * t); s += tm.a * (tm.hr * c - tm.hi * sn) + tm.b * (tm.hr * sn + tm.hi * c); } return s; };
          const xs = []; for (let i = 0; i <= NP; i++) { const t = -Math.PI + TAU * i / NP; xs.push([t, X(t)]); }
          // direct integration from rest, stages kept off the drive's discontinuities (which sit on step boundaries)
          const m = 400, h = TAU / m, K = Math.min(150, Math.ceil(18 / (TAU * b)) + 1), F = (t) => W.f(wrap(t));
          let x = 0, u = 0, t = -Math.PI; const acc = (tt, x, u) => w2 * F(tt) - 2 * b * u - w2 * x, last = [];
          for (let k = 0; k < K; k++) for (let i = 0; i < m; i++) {
            t = -Math.PI + (k * m + i) * h; // from integers: no drift across the discontinuities
            const e = 1e-7 * h, k1x = u, k1u = acc(t + e, x, u), k2x = u + h / 2 * k1u, k2u = acc(t + h / 2, x + h / 2 * k1x, u + h / 2 * k1u);
            const k3x = u + h / 2 * k2u, k3u = acc(t + h / 2, x + h / 2 * k2x, u + h / 2 * k2u), k4x = u + h * k3u, k4u = acc(t + h - e, x + h * k3x, u + h * k3u);
            x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); u += h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
            if (k === K - 1) last.push([-Math.PI + (i + 1) * h, x]);
          }
          let err = 0; for (const [tt, xx] of last) err = Math.max(err, Math.abs(xx - X(tt)));
          let best = null; for (const tm of terms) if (tm && (!best || tm.r > best.r)) best = tm;
          const share = best ? best.r * best.r / 2 / total : 0, resid = Math.exp(-b * K * TAU);
          return (S = { W, w0, b, terms, dc, xs, last, err, best, share, resid, H, total, X });
        }
        v.render(() => {
          const s = compute(), W = s.W;
          let mx = 1.2; for (const p of s.xs) mx = Math.max(mx, Math.abs(p[1]) * 1.12);
          sT.setView(null, [-mx, mx]);
          sT.fn((t) => W.f(t), { color: 'orange', width: 1.8 });
          sT.path(s.xs, { color: 'accent', width: 2.8 });
          sT.path(s.last, { color: 'ink', dash: [5, 5], width: 1.3 });
          // bars
          sB.fn((Om) => { const [hr, hi] = s.H(Om); return Math.hypot(hr, hi); }, { domain: [0.05, 16.6], color: 'muted', width: 1.4, n: 1200 });
          if (Math.abs(s.dc) > 1e-12) { sB.rect(-0.36, 2e-3, -0.04, Math.abs(s.dc), { fill: 'orange', fillAlpha: 0.75, color: 'orange', width: 1 }); sB.rect(0.04, 2e-3, 0.36, Math.abs(s.dc), { fill: 'accent', fillAlpha: 0.8, color: 'accent', width: 1 }); }
          for (const tm of s.terms) {
            if (!tm || tm.n > 16) continue;
            if (tm.d > 2e-3) sB.rect(tm.n - 0.36, 2e-3, tm.n - 0.04, tm.d, { fill: 'orange', fillAlpha: 0.75, color: 'orange', width: 1 });
            if (tm.r > 2e-3) sB.rect(tm.n + 0.04, 2e-3, tm.n + 0.36, tm.r, { fill: 'accent', fillAlpha: 0.8, color: 'accent', width: 1 });
          }
          sB.vline(s.w0, { color: 'green', dash: [4, 4], width: 1.3 });
          sB.text('ω₀', s.w0, 40, { color: 'green', size: 12, dx: 5 });
        });
        v.legend([['orange', 'drive $f$ / its harmonics'], ['accent', 'response: Fourier sum / its harmonics'], ['ink', 'direct numerical integration', { dash: true }], ['muted', 'gain $|H(\\Omega)|$']]);
        v.readout(() => {
          const s = compute(), n = s.best ? s.best.n : 0;
          return `largest response harmonic: $n = ${n}$, carrying ${v.fix(100 * s.share, 1)} % of the response’s mean square (Parseval) · Fourier sum ($${NH}$ harmonics) vs direct integration: max difference $${v.sci(Math.max(s.err, 1e-12), 1)}$${s.resid > 1e-4 ? ` (the integration from rest still carries a transient of relative size $\\sim${v.sci(s.resid, 1)}$)` : ''}`;
        });
        const synth = (resp) => {
          const s = compute(), sr = 44100, f1 = 110, dur = 2.5, n = Math.floor(sr * dur), out = new Float32Array(n);
          const terms = s.terms.filter((tm) => tm && tm.n * f1 < 15000);
          for (const tm of terms) {
            const A = resp ? 1 : 0, w = TAU * f1 * tm.n;
            const ca = resp ? tm.a * tm.hr + tm.b * tm.hi : tm.a, sa = resp ? -tm.a * tm.hi + tm.b * tm.hr : tm.b;
            if (Math.abs(ca) + Math.abs(sa) < 1e-7 * (A + 1)) continue;
            for (let i = 0; i < n; i++) { const ph = w * i / sr; out[i] += ca * Math.cos(ph) + sa * Math.sin(ph); }
          }
          return fade(out, sr);
        };
        v.soundButton('drive (110 Hz)', (snd) => snd.samples(synth(false), 44100, { gain: 0.5 }));
        v.soundButton('response', (snd) => snd.samples(synth(true), 44100, { gain: 0.5 }));
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13', kind: 'Method', name: 'Green’s function of the oscillator',
      statement: String.raw`For the damped oscillator $\ddot x+2\beta\dot x+\omega_0^2x = \omega_0^2f(t)$ at rest before the force begins, the motion is the convolution
$$x(t) = \int_{-\infty}^{t} G(t-t')\,f(t')\,dt',\qquad G(\tau) = \omega_0^2\,\frac{e^{-\beta\tau}\sin\omega_1\tau}{\omega_1}\ \ (\tau\ge0),\quad G(\tau)=0\ \ (\tau<0),$$
with $\omega_1 = \sqrt{\omega_0^2-\beta^2}$ (underdamped case). $G$ is the **Green’s function**: the response to a unit impulse $f = \delta(t-t')$. It is causal — the oscillator never responds before it is pushed.`,
      idea: String.raw`Cut the force history into short slices. During a slice of length $\Delta t'$ the force delivers an impulse $\omega_0^2 f(t')\,\Delta t'$ (per unit mass), which changes the velocity by that amount without moving the mass (mech-2.1); afterwards the oscillator rings freely, which by 4.7 is the decaying sine $f(t')\Delta t'\,G(t-t')$. Because the equation is linear (4.9), the responses to all the slices simply add, and as the slices shrink the sum becomes the convolution integral — a Riemann sum converging like $\Delta t'^2$ for the midpoint rule.`,
      caption: String.raw`**Drag in the top panel to draw any force history**, or pick a preset. The force is cut into $N$ slices (orange bars); each one launches its own decaying sine (thin gold curves), and their sum (blue) lies on top of the directly integrated motion (dashed). Raise $N$ and the sum converges. Try **two kicks**: the second, half a period after the first, arrives in antiphase and almost stops the ringing — and since each slice’s impulse is placed at the slice’s centre, sharp kicks need many slices before the sum locks on.`,
      deps: ['mech-4.9', 'mech-2.1'],
      refs: ['Goldstein §6.5'],
      tags: ['Green’s function', 'convolution', 'impulse response'],
      credit: 'George Green, 1828',
      viz(v) {
        const TW = 10, NS = 500, w0 = TAU, f = new Float64Array(NS + 1);
        const ts = (i) => TW * i / NS;
        const pre = v.select('force', [{ value: 'pulse', label: 'pulse' }, { value: 'step', label: 'step' }, { value: 'kicks', label: 'two kicks' }, { value: 'noise', label: 'noise' }], 'pulse', { onChange: (p) => load(p) });
        const N = v.slider('slices $N$', 4, 200, 40, { int: true });
        const zr = v.slider('damping $\\beta/\\omega_0$', 0, 0.6, 0.06, { step: 0.01, onChange: () => { if (pre.value === 'kicks') load('kicks'); } });
        let ver = 0;
        function load(p) {
          const z = zr.value, T1 = TAU / (w0 * Math.sqrt(1 - z * z)), r = v.rng(7);
          let nz = 0, nz2 = 0;
          for (let i = 0; i <= NS; i++) {
            const t = ts(i);
            if (p === 'pulse') f[i] = 0.9 * Math.exp(-(((t - 1.6) / 0.45) ** 2));
            else if (p === 'step') f[i] = t >= 1 ? 1 : 0;
            else if (p === 'kicks') { const i1 = Math.round(NS / TW), i2 = Math.round((1 + T1 / 2) * NS / TW), HW = [1, 0.75, 0.25]; const d1 = Math.abs(i - i1), d2 = Math.abs(i - i2); f[i] = 1.5 * ((d1 < 3 ? HW[d1] : 0) + (d2 < 3 ? HW[d2] : 0)); }
            else { if (i % 10 === 0) { nz2 = nz; nz = r.normal() * 0.6; } const a = (i % 10) / 10; f[i] = t < 0.5 ? 0 : nz2 + (nz - nz2) * (0.5 - 0.5 * Math.cos(Math.PI * a)); }
          }
          ver++;
        }
        load('pulse');
        v.button('Clear (then draw)', () => { f.fill(0); ver++; pre.set('custom'); });
        const sF = v.stage({ x: [0, TW], y: [-1.6, 1.6], height: 170, full: true, axes: true, xlabel: 't (s)', title: 'force $f(t)$, in units of the static displacement — drag to draw' });
        const sX = v.stage({ x: [0, TW], y: [-2, 2], height: 280, full: true, axes: true, xlabel: 't (s)', title: 'response $x(t)$: sum of impulse responses vs direct integration' });
        let lastI = null;
        sF.onDrag((x, y, phase) => {
          const i = clamp(Math.round(x / TW * NS), 0, NS), yy = clamp(y, -1.55, 1.55);
          if (phase === 'start' || lastI == null) { f[i] = yy; lastI = [i, yy]; }
          else { const [i0, y0] = lastI, n = Math.abs(i - i0); for (let k = 0; k <= n; k++) { const j = i0 + Math.sign(i - i0) * k; f[j] = n ? y0 + (yy - y0) * k / n : yy; } lastI = [i, yy]; }
          if (phase === 'end') lastI = null;
          if (pre.value !== 'custom') pre.set('custom');
          ver++;
        });
        const fAt = (t) => { const u = clamp(t / TW * NS, 0, NS), i = Math.min(NS - 1, Math.floor(u)), a = u - i; return f[i] + (f[i + 1] - f[i]) * a; };
        let S = null, key = '';
        function compute() {
          const kk = `${ver}|${N.value}|${zr.value}`; if (kk === key) return S; key = kk;
          const z = zr.value, b = z * w0, w1 = w0 * Math.sqrt(1 - z * z), G = (tau) => (tau < 0 ? 0 : w0 * w0 * Math.exp(-b * tau) * Math.sin(w1 * tau) / w1);
          const NG = 600, grid = Array.from({ length: NG + 1 }, (_, i) => TW * i / NG);
          const slices = (n) => { const d = TW / n, out = []; for (let k = 0; k < n; k++) { let I = 0; const m = 16; for (let j = 0; j < m; j++) I += fAt(k * d + (j + 0.5) * d / m) * d / m; out.push([(k + 0.5) * d, I, k * d, (k + 1) * d]); } return out; };
          const sumOf = (sl) => grid.map((t) => { let s = 0; for (const [tk, I] of sl) if (t > tk) s += I * G(t - tk); return s; });
          const sl = slices(N.value), xN = sumOf(sl), x2N = sumOf(slices(2 * N.value));
          // direct RK4 integration of x'' + 2βx' + ω0²x = ω0² f(t)
          const m = 6000, h = TW / m; let x = 0, u = 0; const xd = [0];
          const acc = (t, x, u) => w0 * w0 * fAt(t) - 2 * b * u - w0 * w0 * x;
          for (let i = 0; i < m; i++) {
            const t = i * h, k1x = u, k1u = acc(t, x, u), k2x = u + h / 2 * k1u, k2u = acc(t + h / 2, x + h / 2 * k1x, u + h / 2 * k1u);
            const k3x = u + h / 2 * k2u, k3u = acc(t + h / 2, x + h / 2 * k2x, u + h / 2 * k2u), k4x = u + h * k3u, k4u = acc(t + h, x + h * k3x, u + h * k3u);
            x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); u += h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
            if ((i + 1) % (m / NG) === 0) xd.push(x);
          }
          let e1 = 0, e2 = 0, mx = 0.5; for (let i = 0; i <= NG; i++) { e1 = Math.max(e1, Math.abs(xN[i] - xd[i])); e2 = Math.max(e2, Math.abs(x2N[i] - xd[i])); mx = Math.max(mx, Math.abs(xd[i]), Math.abs(xN[i])); }
          const each = N.value <= 80 ? sl.filter(([, I]) => Math.abs(I) > 1e-9).map(([tk, I]) => grid.filter((t) => t >= tk).map((t) => [t, I * G(t - tk)])) : null;
          return (S = { sl, grid, xN, xd, e1, e2, mx, each });
        }
        v.render(() => {
          const s = compute();
          for (const [tk, I, a, bb] of s.sl) { const hgt = I / (bb - a); if (Math.abs(hgt) > 1e-9) sF.rect(a, 0, bb, hgt, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 0.8, alpha: 0.6 }); }
          sF.path(Array.from({ length: NS + 1 }, (_, i) => [ts(i), f[i]]), { color: 'orange', width: 2 });
          sX.setView(null, [-1.12 * s.mx, 1.12 * s.mx]);
          if (s.each) for (const c of s.each) if (c.length > 1) sX.path(c, { color: 'gold', width: 1, alpha: 0.55 });
          sX.path(s.grid.map((t, i) => [t, s.xN[i]]), { color: 'accent', width: 2.8 });
          sX.path(s.grid.map((t, i) => [t, s.xd[i]]), { color: 'ink', dash: [5, 5], width: 1.3 });
        });
        v.legend([['orange', 'force and its $N$ slices'], ['gold', 'one impulse response per slice'], ['accent', 'their sum $\\sum_k G(t-t_k)\\,f_k\\Delta t$'], ['ink', 'direct integration', { dash: true }]]);
        v.readout(() => {
          const s = compute();
          return `sum of $N = ${N.value}$ impulse responses vs direct integration: max difference $${v.fix(s.e1, 4)}$; with $2N$ slices $${v.fix(s.e2, 4)}$ (ratio $${v.fix(s.e1 / Math.max(s.e2, 1e-12), 2)}$ — about 4 for a midpoint Riemann sum, until the slices resolve the force)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14', kind: 'Phenomenon', name: 'Nonlinear pendulum: period grows with amplitude',
      statement: String.raw`A pendulum released from rest at angle $\theta_0\in(0,\pi)$ has period
$$T(\theta_0) = 4\sqrt{\frac Lg}\;K\!\left(\sin\tfrac{\theta_0}{2}\right) = \frac{T_0}{\mathrm{AGM}\big(1,\cos\tfrac{\theta_0}2\big)},\qquad T_0 = 2\pi\sqrt{L/g},$$
where $K$ is the complete elliptic integral of the first kind and AGM the arithmetic–geometric mean. $T$ increases strictly with amplitude, $T = T_0\big(1+\tfrac1{16}\theta_0^2+\tfrac{11}{3072}\theta_0^4+\cdots\big)$, and diverges logarithmically as the release approaches the upright position: $T\approx\tfrac{2}{\pi}T_0\ln\frac{8}{\pi-\theta_0}$.`,
      idea: String.raw`Energy conservation gives $\dot\theta^2 = \tfrac{2g}{L}(\cos\theta-\cos\theta_0)$, and the energy integral (mech-3.11) turns the quarter period into $\int_0^{\theta_0}d\theta/\dot\theta$. The substitution $\sin\tfrac\theta2 = \sin\tfrac{\theta_0}2\sin\varphi$ removes the endpoint singularity and yields $4\sqrt{L/g}\,K(k)$ with $k=\sin\tfrac{\theta_0}{2}$; Gauss showed $K(k) = \pi/\big(2\,\mathrm{AGM}(1,\sqrt{1-k^2})\big)$, which converges in a handful of steps. As $\theta_0\to\pi$ the turning point approaches the unstable equilibrium, where the bob lingers ever longer: the logarithmic divergence. For small $\theta_0$ the expansion recovers the isochronous model 4.4.`,
      caption: String.raw`**Drag the point along the curve** to choose the release angle. Left: the exact period (AGM), the measured periods of simulated pendulums (gold dots), the small-angle constant, the two-term series and the logarithmic asymptote. Right: one swing of the simulated pendulum, rescaled to unit height and unit period, against a pure cosine — at large amplitude the bob lingers near the top and the waveform flattens toward a square-topped shape.`,
      deps: ['mech-4.4', 'mech-3.11'],
      refs: ['Arnold §4'],
      tags: ['pendulum', 'elliptic integrals', 'nonlinear oscillations'],
      viz(v) {
        const Ls = v.slider('length $L$ (m)', 0.1, 5, 1, { step: 0.01 });
        const sP = v.stage({ x: [0, 180], y: [0.72, 4], height: 330, axes: 'box', xlabel: 'θ₀ (°)', ylabel: 'T / T₀', xticks: [0, 30, 60, 90, 120, 150, 180], weight: 1.2, title: 'period against release angle' });
        const sW = v.stage({ x: [0, 1], y: [-1.2, 1.2], height: 330, axes: true, xlabel: 't/T', weight: 1, title: 'one swing, rescaled: $\\theta(t)/\\theta_0$' });
        const R = (deg) => 1 / agm(1, Math.cos(deg * Math.PI / 360));
        const hd = sP.handle(165, R(165), { color: 'accent', constrain: (x) => { const d = clamp(x, 1, 179.5); return [d, Math.min(4, R(d))]; } });
        const DOTS = [10, 30, 50, 70, 90, 110, 130, 150, 160, 170, 175].map((d) => { const r = pendulumHalf(d * Math.PI / 180, 0.002); return [d, 2 * r.half / TAU]; });
        let W = null, wkey = -1;
        function wave() {
          if (wkey === hd.x) return W; wkey = hd.x;
          const th0 = hd.x * Math.PI / 180, r = pendulumHalf(th0, Math.min(0.004, 2e-3 * R(hd.x)));
          const half = r.half, pts = r.ts.map((t, i) => [t / (2 * half), r.xs[i] / th0]);
          const back = pts.slice().reverse().map(([u, y]) => [1 - u, y]); // second half mirrors the first (time reversal)
          let ex = 0; for (const [u, y] of pts) ex = Math.max(ex, Math.abs(y - Math.cos(TAU * u)));
          return (W = { T: 2 * half / TAU, pts: pts.concat(back), ex });
        }
        v.render(() => {
          const w = wave(), d = hd.x;
          hd.y = Math.min(4, R(d));
          sP.hline(1, { color: 'muted', dash: [5, 5], width: 1.3 });
          sP.fn((x) => { const t = x * Math.PI / 180; return 1 + t * t / 16 + 11 * t ** 4 / 3072; }, { color: 'orange', dash: [6, 4], width: 1.5 });
          sP.fn((x) => (2 / Math.PI) * Math.log(8 / (Math.PI - x * Math.PI / 180)), { domain: [100, 179.9], color: 'purple', dash: [3, 4], width: 1.5 });
          sP.fn(R, { domain: [0, 179.95], color: 'accent', width: 2.6, n: 1200 });
          sP.dots(DOTS, { color: 'gold', r: 4.5 });
          sP.vline(d, { color: 'accent', alpha: 0.35, width: 1 });
          sW.hline(0, { color: 'faint', width: 1 });
          sW.fn((u) => Math.cos(TAU * u), { color: 'orange', dash: [6, 4], width: 1.6 });
          sW.path(w.pts, { color: 'accent', width: 2.6 });
        });
        v.legend([['accent', 'exact: $1/\\mathrm{AGM}(1,\\cos\\frac{\\theta_0}{2})$ / simulated swing'], ['gold', 'simulated periods', { dot: true }], ['orange', '$1+\\theta_0^2/16+11\\theta_0^4/3072$ / pure cosine', { dash: true }], ['purple', '$\\frac{2}{\\pi}\\ln\\frac{8}{\\pi-\\theta_0}$', { dash: true }], ['muted', 'small-angle $T_0$', { dash: true }]]);
        v.readout(() => {
          const w = wave(), d = hd.x, t = d * Math.PI / 180, T0 = TAU * Math.sqrt(Ls.value / v.M.CONST.g0), ser = 1 + t * t / 16 + 11 * t ** 4 / 3072;
          return `$\\theta_0 = ${v.fix(d, 1)}^\\circ$: exact $T/T_0 = ${v.fix(R(d), 5)}$, simulated $${v.fix(w.T, 5)}$, series $${v.fix(ser, 5)}$ · with $L = ${v.fix(Ls.value, 2)}$ m on Earth: $T_0 = $ ${v.M.si(T0, 's', 4)}, $T = $ ${v.M.si(T0 * R(d), 's', 4)} · largest gap between the swing and a cosine: ${v.fix(w.ex, 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15', kind: 'Definition', name: 'Pendulum phase portrait and the separatrix',
      statement: String.raw`Measure time in units of $1/\omega_0$, $\omega_0=\sqrt{g/L}$. The pendulum’s state $(\theta,\dot\theta)$ lives on the **cylinder** $S^1\times\R$, since $\theta$ and $\theta+2\pi$ are the same position. Its orbits are the level sets of $E = \tfrac12\dot\theta^2-\cos\theta$:
- $-1<E<1$: **librations**, closed orbits around the stable equilibrium $(0,0)$ (back-and-forth swinging);
- $E>1$: **rotations**, orbits that wind around the cylinder (the pendulum goes over the top);
- $E=1$: the **separatrix** $\dot\theta = \pm2\cos\tfrac\theta2$, made of the unstable equilibrium $(\pi,0)$ and two orbits that leave it and return to it, each taking infinite time.

The period of the motion diverges logarithmically as $E\to1$ from either side.`,
      idea: String.raw`Energy is conserved, so orbits lie on level curves of $E$ (4.5). The level $E=1$ passes through the saddle $(\pi,0)$, where the potential has its maximum: below it the energy cannot carry the bob over the top, above it the speed never vanishes. Near the saddle the motion is like $\ddot u = u$, so getting within distance $\varepsilon$ of it takes time $\sim\ln(1/\varepsilon)$: this is why the period (4.14) blows up at the separatrix. In closed form $T = 4K(k)$ for librations and $T=2K(1/k)/k$ per turn for rotations, with $k^2 = (E+1)/2$.`,
      caption: String.raw`**Drag the initial state** in the flat chart (left). Below the separatrix (green/red curves through the saddles) it swings back and forth; drag it across and the pendulum starts to go over the top. The same orbit is wrapped on the cylinder at the right (drag to rotate; the red curves are the separatrix) — there a rotation is a closed loop around the cylinder. Watch the period in the readout blow up as you approach the separatrix from either side.`,
      deps: ['mech-4.14', 'mech-4.5'],
      refs: ['Arnold §4', 'Taylor §12.7'],
      tags: ['phase space', 'pendulum', 'separatrix'],
      viz(v) {
        const s = v.stage({ x: [-Math.PI, Math.PI], y: [-3.2, 3.2], height: 360, axes: 'box', xlabel: 'θ', ylabel: 'θ̇', xticks: piTicks, yticks: [-3, -2, -1, 0, 1, 2, 3], weight: 1.15 });
        const s3 = v.stage3d({ height: 360, range: 1.4, axes: false, yaw: 0.28, pitch: 0.24, weight: 0.85 });
        const pp = v.phasePlane(s, {
          f: (x, y) => [y, -Math.sin(x)], field: 'none', nullclines: false, separatrices: true, fixedPoints: true,
          H: (x, y) => y * y / 2 - Math.cos(x), contours: [-0.75, -0.3, 0.3, 1.6, 2.6], seeds: [], click: false,
        });
        const h0 = s.handle(1.5, 1.0, { color: 'accent', label: 'start', constrain: (x, y) => [clamp(x, -Math.PI + 0.01, Math.PI - 0.01), clamp(y, -3.1, 3.1)] });
        const P = (th, om) => [Math.sin(th), -Math.cos(th), om * 0.31];
        let O = null, key = '';
        function orbit() {
          const kk = `${h0.x}|${h0.y}`; if (kk === key) return O; key = kk;
          const E = 0.5 * h0.y * h0.y - Math.cos(h0.x), k2 = (E + 1) / 2, lib = E < 1;
          const Tx = lib ? 4 * ellK(Math.sqrt(k2)) : 2 * ellK(Math.sqrt(1 / k2)) / Math.sqrt(k2);
          const h = 0.004, f = (t, y) => [y[1], -Math.sin(y[0])], tMax = Math.min(80, isFinite(Tx) ? Tx * 1.05 + 0.5 : 80);
          let y = [h0.x, h0.y], t = 0, Tm = NaN, a0 = Math.atan2(h0.y, h0.x), acc = 0, prevA = a0; const pts = [[h0.x, h0.y]], ts = [0];
          while (t < tMax) {
            const yn = rk4step(f, t, y, h);
            if (lib) { const a = Math.atan2(yn[1], yn[0]); let d = a - prevA; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; const accN = acc + d; if (accN <= -TAU) { Tm = t + h * (-TAU - acc) / (accN - acc); acc = accN; pts.push(yn); ts.push(t + h); break; } acc = accN; prevA = a; }
            else if (Math.abs(yn[0] - h0.x) >= TAU) { Tm = t + h * (TAU - Math.abs(y[0] - h0.x)) / Math.abs(yn[0] - y[0]); pts.push(yn); ts.push(t + h); break; }
            y = yn; t += h; pts.push(y); ts.push(t);
          }
          return (O = { E, lib, Tx, Tm, pts, ts, h });
        }
        const wrapA = (a) => { let u = (a + Math.PI) % TAU; if (u < 0) u += TAU; return u - Math.PI; };
        v.animate((t) => {
          const o = orbit();
          pp.draw();
          // the orbit, wrapped onto [−π, π)
          const flat = []; let prev = null;
          for (const [th, om] of o.pts) { const w = wrapA(th); if (prev != null && Math.abs(w - prev) > Math.PI) flat.push(null); flat.push([w, om]); prev = w; }
          s.path(flat, { color: o.lib ? 'accent' : 'orange', width: 2.8 });
          const T = isFinite(o.Tm) ? o.Tm : o.ts[o.ts.length - 1], i = Math.min(o.pts.length - 1, Math.round((t * 1.5 % T) / o.h)), cur = o.pts[i];
          s.dot(wrapA(cur[0]), cur[1], { color: 'gold', r: 6 });
          s.corner(o.lib ? 'libration' : 'rotation (over the top)', 'tr', { color: o.lib ? 'accent' : 'orange', weight: 600 });
          // cylinder
          // cylinder drawn as a wireframe; anything on the far side is faded (depth cue)
          const back = (p) => s3.project(p)[2] > s3.project([0, 0, p[2]])[2] + 1e-9;
          const cyl = (pts3, st) => {
            let run = [], side = null;
            for (const p of pts3) { const bk = back(p); if (side !== null && bk !== side) { s3.path(run, { ...st, alpha: side ? 0.25 : 1 }); run = [run[run.length - 1]]; } run.push(p); side = bk; }
            if (run.length > 1) s3.path(run, { ...st, alpha: side ? 0.25 : 1 });
          };
          const ring = (om, st) => cyl(Array.from({ length: 73 }, (_, j) => P(TAU * j / 72, om)), st);
          for (const om of [-3.3, 3.3]) ring(om, { color: 'muted', width: 1.3 });
          for (const om of [-1.65, 0, 1.65]) ring(om, { color: 'muted', width: 0.8, dash: [3, 4] });
          for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, bk = back(P(a, 0)); s3.line(P(a, -3.3), P(a, 3.3), { color: 'muted', width: k % 6 ? 0.6 : 1.1, alpha: bk ? 0.2 : 0.55 }); }
          for (const sg of [1, -1]) cyl(Array.from({ length: 121 }, (_, j) => { const a = -Math.PI + TAU * j / 120; return P(a, sg * 2 * Math.cos(a / 2)); }), { color: 'red', width: 1.8 });
          cyl(o.pts.filter((_, j) => j % 3 === 0 || j === o.pts.length - 1).map(([th, om]) => P(th, om)), { color: o.lib ? 'accent' : 'orange', width: 3 });
          s3.dot(P(0, 0), { color: 'teal', r: 5, alpha: back(P(0, 0)) ? 0.35 : 1 }); s3.dot(P(Math.PI, 0), { color: 'ink', r: 5, alpha: back(P(Math.PI, 0)) ? 0.35 : 1 });
          s3.text('θ = 0 (hanging)', P(0, 0), { color: 'teal', size: 11, dy: 15 }); s3.text('θ = π (upright)', P(Math.PI, 0), { color: 'muted', size: 11, dy: -13 });
          s3.dot(P(cur[0], cur[1]), { color: 'gold', r: 6 });
        });
        pp.legend([['accent', 'your orbit: libration'], ['orange', 'your orbit: rotation']]);
        v.readout(() => {
          const o = orbit();
          const per = o.lib ? `libration, period $T = 4K(k) = ${v.fix(o.Tx, 4)}$` : `rotation, time per turn $T = 2K(1/k)/k = ${v.fix(o.Tx, 4)}$`;
          return `$E = \\tfrac12\\dot\\theta^2-\\cos\\theta = ${v.fix(o.E, 4)}$ (separatrix at $E = 1$) · ${per} $/\\omega_0$, measured along the computed orbit ${isFinite(o.Tm) ? v.fix(o.Tm, 4) : '> 80 (still going)'} · small-swing value $2\\pi = 6.283$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16', kind: 'Phenomenon', name: 'Duffing oscillator: bent resonance curves and jumps',
      statement: String.raw`A driven, damped oscillator with a cubic spring,
$$\ddot x+2\beta\dot x+\omega_0^2x+\epsilon x^3 = f_0\cos\omega t,$$
responds (to first order in a harmonic balance $x\approx A\cos(\omega t-\delta)$) with amplitude given by
$$\Big[\big(\omega_0^2+\tfrac34\epsilon A^2-\omega^2\big)^2+4\beta^2\omega^2\Big]A^2 = f_0^2 .$$
The resonance peak leans toward higher frequency for a hardening spring ($\epsilon>0$) and toward lower frequency for a softening one ($\epsilon<0$). Once it leans far enough, three steady amplitudes coexist over a band of frequencies; the middle one is unstable. A slow frequency sweep then follows one branch to its end and **jumps** to the other, at different frequencies going up and coming down: **hysteresis**.`,
      scope: String.raw`The cubic-spring model holds for moderate amplitudes of a symmetric restoring force; the harmonic-balance curve is a first-order approximation valid for weak nonlinearity and damping, and the jumps need a sweep slow compared with the decay time $1/\beta$. Strong driving can produce subharmonics and chaos, which this picture does not capture.`,
      idea: String.raw`A cubic spring makes the effective stiffness grow with amplitude, $\omega_0^2\to\omega_0^2+\tfrac34\epsilon A^2$ (the $\tfrac34$ is the average of $\cos^4$ against $\cos^2$), so the natural frequency depends on how hard the system swings — as the pendulum’s does (4.14), since near its minimum any potential is quadratic plus small corrections (4.3). Substituting this amplitude-dependent frequency into the linear resonance formula (4.10) bends the peak along the **backbone** $\omega^2 = \omega_0^2+\tfrac34\epsilon A^2$. Where the bent curve folds over, the turning points are saddle-node bifurcations: a branch simply ends, and the system must jump to the surviving one.`,
      caption: String.raw`The curve is the harmonic-balance prediction (dashed where unstable). The dots come from an honest numerical integration while the drive frequency creeps up (red) and then back down (blue), one dot per drive cycle; the animation retraces the sweep. Going up, the response climbs the leaning peak and suddenly falls off; coming down it stays low until it jumps back up. Set $\epsilon=0$ for the linear oscillator — the loop closes; make $\epsilon$ negative to bend the peak the other way.`,
      deps: ['mech-4.10', 'mech-4.3'],
      refs: ['Goldstein Ex. 11.8'],
      tags: ['nonlinear oscillations', 'hysteresis', 'bifurcation'],
      credit: 'Georg Duffing, 1918',
      viz(v) {
        const ep = v.slider('cubic stiffness $\\epsilon/\\omega_0^2$', -0.2, 1, 0.5, { step: 0.01 });
        const F0 = v.slider('drive $f_0/\\omega_0^2$', 0.02, 0.2, 0.12, { step: 0.005 });
        const zr = v.slider('damping $\\beta/\\omega_0$', 0.03, 0.15, 0.04, { step: 0.005 });
        const s = v.stage({ x: [0.4, 2], y: [0, 1.4], height: 380, full: true, axes: 'box', xlabel: 'ω/ω₀', ylabel: 'amplitude A' });
        let S = null, key = '';
        function compute() {
          const kk = `${ep.value}|${F0.value}|${zr.value}`; if (kk === key) return S; key = kk;
          const e = ep.value, F = F0.value, b = zr.value, c = 0.75 * e, Abb = F / (2 * b);
          const wHi = clamp(1.25 * Math.sqrt(Math.max(0.3, 1 + c * Abb * Abb)), 1.6, 3.2), wLo = clamp(0.8 * Math.sqrt(Math.max(0.2, 1 + Math.min(0, c) * Abb * Abb)), 0.3, 0.75);
          // harmonic balance: c² a³ + 2Dc a² + (D² + 4b²ω²) a − F² = 0 with a = A², D = 1 − ω²
          const NW = 700, cols = [], folds = [];
          let prevN = 1;
          for (let i = 0; i <= NW; i++) {
            const w = wLo + (wHi - wLo) * i / NW, D = 1 - w * w;
            const rs = cubicRoots(c * c, 2 * D * c, D * D + 4 * b * b * w * w, -F * F).filter((a) => a > 0).map(Math.sqrt).sort((p, q) => p - q);
            cols.push({ w, rs });
            if (i > 0 && (rs.length === 3) !== (prevN === 3)) folds.push(w); prevN = rs.length;
          }
          // slow sweep up then down: RK4 (inline), 40 steps per drive cycle, frequency constant within each cycle, phase continuous
          const NC = 900, up = [], down = []; let x = 0, u = 0, ph = 0;
          const runCycle = (w, out) => {
            const h = TAU / (w * 40); let mx = 0;
            const ac = (x, u, p) => F * Math.cos(p) - 2 * b * u - x - e * x * x * x;
            for (let k = 0; k < 40; k++) {
              const k1x = u, k1u = ac(x, u, ph), k2x = u + h / 2 * k1u, k2u = ac(x + h / 2 * k1x, u + h / 2 * k1u, ph + w * h / 2);
              const k3x = u + h / 2 * k2u, k3u = ac(x + h / 2 * k2x, u + h / 2 * k2u, ph + w * h / 2), k4x = u + h * k3u, k4u = ac(x + h * k3x, u + h * k3u, ph + w * h);
              x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); u += h / 6 * (k1u + 2 * k2u + 2 * k3u + k4u); ph += w * h; mx = Math.max(mx, Math.abs(x));
            }
            ph %= TAU; if (out) out.push([w, mx]);
          };
          for (let k = 0; k < 60; k++) runCycle(wLo, null); // settle at the start
          for (let k = 0; k <= NC; k++) runCycle(wLo + (wHi - wLo) * k / NC, up);
          for (let k = 0; k <= NC; k++) runCycle(wHi - (wHi - wLo) * k / NC, down);
          // a jump = the largest change over 20 cycles; located at the steepest single-cycle step inside that window
          const jump = (arr, sgn) => {
            let best = 0, k0 = -1; for (let k = 0; k + 20 < arr.length; k++) { const d = sgn * (arr[k + 20][1] - arr[k][1]); if (d > best) { best = d; k0 = k; } }
            if (k0 < 0) return { d: 0, at: NaN };
            let st = 0, at = NaN; for (let k = k0; k < k0 + 20; k++) { const d = sgn * (arr[k + 1][1] - arr[k][1]); if (d > st) { st = d; at = (arr[k][0] + arr[k + 1][0]) / 2; } }
            return { d: best, at };
          };
          const jd = jump(up, -1), ju = jump(down, 1);
          let Amax = 0.3; for (const p of up.concat(down)) Amax = Math.max(Amax, p[1]); for (const col of cols) for (const r of col.rs) Amax = Math.max(Amax, Math.min(r, 3 * Abb));
          return (S = { cols, folds, up, down, jd, ju, wLo, wHi, Amax, e, Abb, c });
        }
        v.animate((t) => {
          const R = compute(), n = R.up.length, prog = (t * 150) % (2 * n), Ay = 1.15 * R.Amax;
          s.setView([R.wLo, R.wHi], [0, Ay]);
          if (R.folds.length >= 2) s.vband(R.folds[0], R.folds[R.folds.length - 1], { color: 'orange', alpha: 0.07 });
          if (Math.abs(R.c) > 1e-9) s.curve((a) => [Math.sqrt(Math.max(0, 1 + R.c * a * a)), a], 0, Ay, { color: 'faint', dash: [2, 4], width: 1.2 });
          // harmonic-balance branches: stable = solid, middle root = dashed; join neighbouring columns
          const tol = 0.06 * Ay;
          for (let i = 0; i + 1 < R.cols.length; i++) {
            const A = R.cols[i], B = R.cols[i + 1];
            A.rs.forEach((r, j) => {
              const mid = A.rs.length === 3 && j === 1; let best = null, bd = tol;
              B.rs.forEach((q, jj) => { const midB = B.rs.length === 3 && jj === 1; if (midB === mid && Math.abs(q - r) < bd) { bd = Math.abs(q - r); best = q; } });
              if (best != null) s.line(A.w, r, B.w, best, { color: 'ink', width: mid ? 1.4 : 2.2, dash: mid ? [4, 4] : null, alpha: mid ? 0.7 : 0.85 });
            });
          }
          // measured sweep points
          s.dots(R.up, { color: 'red', r: 1.8, alpha: 0.28 }); s.dots(R.down, { color: 'blue', r: 1.8, alpha: 0.28 });
          const k = Math.floor(prog), done = k < n ? R.up.slice(0, k + 1) : R.up, back = k < n ? [] : R.down.slice(0, k - n + 1);
          s.dots(done, { color: 'red', r: 2.6 }); s.dots(back, { color: 'blue', r: 2.6 });
          const cur = k < n ? R.up[k] : R.down[Math.min(n - 1, k - n)];
          s.vline(cur[0], { color: k < n ? 'red' : 'blue', alpha: 0.35, width: 1 });
          s.dot(cur[0], cur[1], { color: k < n ? 'red' : 'blue', r: 6.5 });
          s.corner(k < n ? 'sweeping up →' : '← sweeping down', 'tr', { color: k < n ? 'red' : 'blue', weight: 600 });
        });
        v.legend([['ink', 'harmonic balance: stable'], ['ink', 'unstable (middle) branch', { dash: true }], ['red', 'simulated, frequency rising', { dot: true }], ['blue', 'simulated, frequency falling', { dot: true }], ['faint', 'backbone $\\omega^2=\\omega_0^2+\\frac34\\epsilon A^2$', { dash: true }]]);
        v.readout(() => {
          const R = compute(), big = 0.25 * R.Amax;
          const hb = R.folds.length >= 2 ? `harmonic balance folds at $\\omega = ${v.fix(R.folds[0], 3)}$ and $${v.fix(R.folds[R.folds.length - 1], 3)}\\,\\omega_0$` : 'harmonic balance: a single branch (no fold)';
          const sim = R.jd.d > big && R.ju.d > big ? `simulation: falls off the peak at $\\omega = ${v.fix(R.jd.at, 3)}\\,\\omega_0$ going up, jumps back at $${v.fix(R.ju.at, 3)}\\,\\omega_0$ going down — a hysteresis loop $${v.fix(Math.abs(R.jd.at - R.ju.at), 3)}\\,\\omega_0$ wide` : 'simulation: no jumps — up- and down-sweeps retrace the same curve';
          return `${sim} · ${hb}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17', kind: 'Phenomenon', name: 'Parametric resonance',
      statement: String.raw`An oscillator whose *parameters* vary periodically can be destabilised although nothing pushes it. For a pendulum whose effective gravity is modulated, $g_{\rm eff} = g(1+\epsilon\cos\Omega t)$ — its pivot shaken vertically — the small-angle equation is Mathieu’s, $\ddot\theta+\omega_0^2(1+\epsilon\cos\Omega t)\,\theta = 0$, and the equilibrium $\theta = 0$ is unstable (small swings grow exponentially) inside **instability tongues** that emanate from
$$\Omega = \frac{2\omega_0}{n},\qquad n = 1, 2, 3,\dots,\qquad \omega_0=\sqrt{g/L},$$
the widest at $\Omega = 2\omega_0$ (two pumps per swing), the $n$-th of width $O(\epsilon^n)$. Stability is decided by the monodromy matrix $M$ of the linear equation over one modulation period: with $\det M = 1$ the motion is unstable exactly when $|\operatorname{tr}M|>2$. A swing pumped by changing its length, $L = L_0(1+\epsilon\cos\Omega t)$, has the same main tongue at $\Omega = 2\omega_0$. Damping lifts the tongues off the axis, so a threshold $\epsilon$ must be exceeded.`,
      scope: String.raw`The tongues belong to the linearised (small-angle) equation. At finite amplitude the pendulum’s period grows (4.14), which detunes the pumping, so real growth saturates or beats instead of continuing exponentially. Which higher tongues appear depends on how the parameter is modulated: for the length-pumped swing the computed chart shows only the main tongue (the even ones are absent and the third is a hairline).`,
      idea: String.raw`The linearised equation is linear with periodic coefficients (Hill’s equation; Floquet theory): one period maps the state by a matrix $M$, $k$ periods by $M^k$, so the eigenvalues $\mu$ of $M$ (Floquet multipliers) decide everything. Both systems are Hamiltonian (for the swing, in the variables $\theta$ and $p = L^2\dot\theta$), so $\det M = 1$ by Liouville’s theorem and $\mu_1\mu_2 = 1$: either both multipliers lie on the unit circle (bounded motion) or one is real with $|\mu|>1$ (growth), and $|\operatorname{tr}M| = 2$ is the boundary. At small $\epsilon$ a modulation can only feed the swing if it comes back in step with it, after a whole number of half natural periods — whence $\Omega = 2\omega_0/n$ (4.2, 4.4).`,
      caption: String.raw`Left: the stability chart, computed pixel by pixel from the monodromy matrix (shaded where $\theta = 0$ is unstable; darker = faster growth). **Drag the point** to choose the pumping frequency and depth, and switch between a shaken pivot and a pumped swing. Right: the pendulum, animated from the simulation, and below its angle from a $3^\circ$ start, integrated with the full nonlinear equation, against the linear Floquet growth (dashed). Inside a tongue the swing builds up — and then saturates as the growing amplitude detunes it.`,
      deps: ['mech-4.2', 'mech-4.4'],
      refs: ['Arnold §25', 'Goldstein §11.7'],
      tags: ['parametric resonance', 'Floquet theory', 'stability'],
      credit: 'Faraday, 1831; Mathieu, 1868; Floquet, 1883',
      viz(v) {
        const mode = v.select('modulate', [{ value: 'g', label: 'gravity (shaken pivot)' }, { value: 'L', label: 'length (pumped swing)' }], 'g');
        const gam = v.slider('damping $\\gamma/\\omega_0$', 0, 0.12, 0, { step: 0.005 });
        const sC = v.stage({ x: [0.3, 2.8], y: [0, 0.6], height: 320, axes: 'box', xlabel: 'Ω/ω₀', weight: 1.35, title: 'stability chart in the $(\\Omega, \\epsilon)$ plane (shaded: unstable)' });
        const sS = v.stage({ x: [-1.25, 1.25], y: [-1.45, 0.65], equal: true, height: 320, axes: false, weight: 0.65, minWidth: 190, title: 'the pendulum' });
        const sT = v.stage({ x: [0, 120], y: [-40, 40], height: 220, full: true, axes: true, xlabel: 't ω₀', ylabel: 'θ (°)' });
        const hp = sC.handle(2.0, 0.25, { color: 'accent', r: 8, constrain: (x, y) => [clamp(x, 0.32, 2.78), clamp(y, 0.005, 0.59)] });
        const NX = 240, NY = 72, X0 = 0.3, X1 = 2.8, Y1 = 0.6;
        // monodromy over one period 2π/Ω (g = L0 = 1, ω0 = 1); 'g': θ' = p, p' = −(1 + ε cos)θ − γp; 'L': θ' = p/L², p' = −Lθ − γp
        function monodromy(Om, eps, g, cosTab, n, md) {
          const T = TAU / Om, h = T / n; let a = [1, 0], b = [0, 1];
          for (let i = 0; i < n; i++) {
            const c0 = 1 + eps * cosTab[2 * i], cm = 1 + eps * cosTab[2 * i + 1], c1 = 1 + eps * cosTab[2 * i + 2];
            const i0 = md === 'L' ? 1 / (c0 * c0) : 1, im = md === 'L' ? 1 / (cm * cm) : 1, i1 = md === 'L' ? 1 / (c1 * c1) : 1;
            for (const s of [a, b]) {
              const th = s[0], p = s[1];
              const k1t = p * i0, k1p = -c0 * th - g * p;
              const k2t = (p + h / 2 * k1p) * im, k2p = -cm * (th + h / 2 * k1t) - g * (p + h / 2 * k1p);
              const k3t = (p + h / 2 * k2p) * im, k3p = -cm * (th + h / 2 * k2t) - g * (p + h / 2 * k2p);
              const k4t = (p + h * k3p) * i1, k4p = -c1 * (th + h * k3t) - g * (p + h * k3p);
              s[0] = th + h / 6 * (k1t + 2 * k2t + 2 * k3t + k4t); s[1] = p + h / 6 * (k1p + 2 * k2p + 2 * k3p + k4p);
            }
          }
          const tr = a[0] + b[1], det = a[0] * b[1] - a[1] * b[0], disc = tr * tr / 4 - det;
          const rho = disc >= 0 ? Math.max(Math.abs(tr / 2 + Math.sqrt(disc)), Math.abs(tr / 2 - Math.sqrt(disc))) : Math.sqrt(Math.abs(det));
          return { tr, det, rho, T };
        }
        const tables = (Om) => { const T = TAU / Om, n = Math.max(48, Math.ceil(T / 0.06)), c = new Float64Array(2 * n + 1); for (let j = 0; j <= 2 * n; j++) c[j] = Math.cos(Om * T * j / (2 * n)); return { c, n }; };
        let CH = null, ckey = '';
        function chart() {
          const kk = `${gam.value}|${mode.value}`; if (ckey === kk) return CH; ckey = kk;
          const g = gam.value, grow = new Float32Array(NX * NY);
          for (let i = 0; i < NX; i++) {
            const Om = X0 + (X1 - X0) * (i + 0.5) / NX, tb = tables(Om);
            for (let j = 0; j < NY; j++) { const m = monodromy(Om, Y1 * (j + 0.5) / NY, g, tb.c, tb.n, mode.value); grow[i * NY + j] = Math.log(Math.max(m.rho, 1e-300)) / m.T; }
          }
          return (CH = { grow, key: kk });
        }
        let SM = null, skey = '';
        function swing() {
          const kk = `${hp.x}|${hp.y}|${gam.value}|${mode.value}`; if (kk === skey) return SM; skey = kk;
          const Om = hp.x, eps = hp.y, g = gam.value, md = mode.value, tb = tables(Om), m = monodromy(Om, eps, g, tb.c, tb.n, md);
          const th0 = 3 * Math.PI / 180, h = Math.min(0.02, m.T / 60), n = Math.ceil(120 / h), hh = 120 / n;
          const f = md === 'L'
            ? (t, s) => { const L = 1 + eps * Math.cos(Om * t); return [s[1] / (L * L), -L * Math.sin(s[0]) - g * s[1]]; }
            : (t, s) => [s[1], -(1 + eps * Math.cos(Om * t)) * Math.sin(s[0]) - g * s[1]];
          let s = [th0, 0]; const pts = [[0, th0]];
          let over = NaN;
          for (let i = 0; i < n; i++) { s = rk4step(f, i * hh, s, hh); if (i % 4 === 3 || Math.abs(s[0]) > Math.PI) pts.push([(i + 1) * hh, s[0]]); if (Math.abs(s[0]) > Math.PI) { over = (i + 1) * hh; break; } }
          let mx = 0; for (const p of pts) mx = Math.max(mx, Math.abs(p[1]));
          return (SM = { m, pts, mx, th0, Om, eps, md, over, tEnd: pts[pts.length - 1][0] });
        }
        const PAL = v.rgb('orange');
        v.animate((t) => {
          const C = chart(), W = swing(), D = 180 / Math.PI;
          sC.raster((x, y) => {
            const i = Math.floor((x - X0) / (X1 - X0) * NX), j = Math.floor(y / Y1 * NY);
            if (i < 0 || i >= NX || j < 0 || j >= NY) return null;
            const gr = C.grow[i * NY + j]; if (!(gr > 1e-4)) return null;
            return [PAL[0], PAL[1], PAL[2], Math.round(255 * Math.min(0.85, 0.3 + gr / 0.1))];
          }, { res: 1, key: `${C.key}|${PAL.join()}`, id: 'chart' });
          for (let n = 1; n <= 4; n++) { const x = 2 / n; if (x > X0) { sC.vline(x, { color: 'muted', dash: [2, 4], width: 1 }); sC.text(`n = ${n}`, x, 0.57, { color: 'muted', size: 11, align: 'center', dx: n === 4 ? 4 : 0 }); } }
          sC.axes();
          // the pendulum (angle from the simulation; pivot or length modulated as in the model)
          const tsim = (t * 4) % W.tEnd, idx = Math.min(W.pts.length - 1, Math.round(tsim / (W.pts[1][0] - W.pts[0][0]))), th = W.pts[idx][1];
          const mod = Math.cos(W.Om * tsim), L = W.md === 'L' ? 1 + W.eps * mod : 1, yp = W.md === 'L' ? 0 : -W.eps / (W.Om * W.Om) * mod;
          if (W.md === 'L') hatch(v, sS, -0.45, 0.06, 0.45, 0.06, -1, 6, 6);
          else { sS.rect(-0.3, yp, 0.3, yp + 0.1, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.5 }); sS.line(0, yp + 0.1, 0, 0.6, { color: 'orange', width: 1.4 }); }
          const Lv = 0.95 * L;
          sS.line(0, yp, Lv * Math.sin(th), yp - Lv * Math.cos(th), { color: 'ink', width: 2 });
          sS.dot(Lv * Math.sin(th), yp - Lv * Math.cos(th), { color: 'accent', r: 10 });
          sS.dot(0, yp, { color: 'ink', r: 3 });
          sS.corner(W.md === 'L' ? `L = ${v.fix(L, 2)} L₀` : `effective g = ${v.fix(1 + W.eps * mod, 2)} g`, 'bl', { size: 11 });
          // angle against time
          const ym = clamp(1.15 * W.mx * D, 6, 200); sT.setView(null, [-ym, ym]);
          const lam = Math.log(W.m.rho) / W.m.T;
          if (lam > 1e-4) for (const sg of [1, -1]) sT.fn((u) => sg * W.th0 * D * Math.exp(lam * u), { color: 'orange', dash: [5, 4], width: 1.5 });
          sT.path(W.pts.map(([u, a]) => [u, a * D]), { color: 'accent', width: 1.8 });
          sT.vline(tsim, { color: 'gold', width: 1.2, alpha: 0.6 });
          if (isFinite(W.over)) { sT.dot(W.over, W.pts[W.pts.length - 1][1] * D, { color: 'red', r: 5 }); sT.corner(`over the top at tω₀ = ${v.fix(W.over, 1)}`, 'tr', { color: 'red', weight: 600 }); }
        });
        v.legend([['orange', 'unstable region / linear growth $\\theta_0|\\mu|^{t/T}$', { area: true }], ['accent', 'nonlinear simulation']]);
        v.readout(() => {
          const W = swing(), m = W.m, unst = m.rho > 1 + 1e-6;
          const head = `$\\Omega = ${v.fix(W.Om, 3)}\\,\\omega_0$, $\\epsilon = ${v.fix(W.eps, 3)}$: $\\operatorname{tr}M = ${v.fix(m.tr, 4)}$, $\\det M = ${v.fix(m.det, 4)}$, largest Floquet multiplier $|\\mu| = ${v.fix(m.rho, 4)}$ per pump cycle`;
          if (unst && isFinite(W.over)) return `${head} → **unstable**: linear theory multiplies the swing by ${v.fix(m.rho, 3)} every cycle; here the pumping is strong enough that the nonlinear pendulum is driven right over the top`;
          return unst ? `${head} → **unstable**: linear theory multiplies the swing by ${v.fix(m.rho, 3)} every cycle; the nonlinear simulation grows from 3° to ${v.fix(W.mx * 180 / Math.PI, 1)}° and stops growing as the larger swing detunes itself` : `${head} → stable: the swing stays bounded (largest angle ${v.fix(W.mx * 180 / Math.PI, 2)}°)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18', kind: 'Model', name: 'Kapitza’s pendulum',
      statement: String.raw`A rigid pendulum of length $L$ whose pivot is shaken vertically, $y_{\rm pivot} = a\cos\omega t$, obeys (with $\varphi$ the angle from the **upward** vertical)
$$\ddot\varphi = \frac{g - a\omega^2\cos\omega t}{L}\,\sin\varphi .$$
If the shaking is fast and small ($\omega\gg\sqrt{g/L}$, $a\ll L$), the slow motion is governed by the effective potential (per unit $mL^2$)
$$U_{\rm eff}(\varphi) = \frac gL\cos\varphi + \frac{a^2\omega^2}{4L^2}\sin^2\varphi ,$$
and the **inverted position $\varphi=0$ is stable** exactly when $a^2\omega^2 > 2gL$; the pendulum then rocks slowly about the upright with frequency $\Omega = \sqrt{a^2\omega^2/2L^2 - g/L}$.`,
      scope: String.raw`The averaged description requires a clear separation of time scales — shaking much faster than the slow motion and an amplitude small compared with $L$. When $\omega$ is not large the averaged prediction fails, and at moderate frequencies the system shows parametric resonances (4.17) instead.`,
      idea: String.raw`Split the motion into a slow part $\Phi$ and a small fast jitter $\xi\approx-\tfrac{a}{L}\sin\Phi\cos\omega t$ forced by the shaking. Averaging the equation over one fast period, the product of the jitter and the oscillating force does not average to zero: it gives a slow restoring force $-\tfrac{a^2\omega^2}{2L^2}\sin\Phi\cos\Phi$, the gradient of the extra term in $U_{\rm eff}$. At the top, $U_{\rm eff}''(0) = -g/L + a^2\omega^2/2L^2$, so the top is a minimum (stable equilibrium, mech-3.12) once $a^2\omega^2>2gL$ — the same vibrating-pivot equation as the parametric pendulum 4.17, read at high frequency.`,
      caption: String.raw`The pendulum at left is simulated from the full equation, its pivot visibly shaking. Middle: the effective potential (blue) and the bare one (dashed): above the threshold a dimple forms at the top, and the gold dot rides in it. Bottom: the angle from the upright, full simulation (blue, with its fast jitter) against the slow motion predicted by $U_{\rm eff}$ (dashed). Lower the shaking frequency or amplitude below the threshold and the pendulum falls; at low $\omega$ the averaged prediction stops matching even when it stays up.`,
      deps: ['mech-4.17', 'mech-3.12'],
      refs: ['Arnold §25'],
      tags: ['stability', 'averaging', 'effective potential'],
      credit: 'Stephenson, 1908; Pyotr Kapitza, 1951',
      viz(v) {
        const aL = v.slider('shaking amplitude $a/L$', 0, 0.25, 0.1, { step: 0.005 });
        const wr = v.slider('shaking frequency $\\omega/\\omega_0$', 4, 60, 25, { step: 0.5 });
        const p0 = v.slider('initial tilt $\\varphi_0$ (°)', 1, 90, 25, { step: 1 });
        const sP = v.stage({ x: [-1.3, 1.3], y: [-1.25, 1.55], equal: true, height: 300, axes: false, weight: 0.62, minWidth: 190, title: 'the shaken pendulum' });
        const sU = v.stage({ x: [-Math.PI, Math.PI], y: [-1.6, 3], height: 300, axes: 'box', xlabel: 'φ (from upright)', xticks: piTicks, weight: 1.38, title: 'effective potential $U_{\\rm eff}(\\varphi)$' });
        const sT = v.stage({ x: [0, 40], y: [-100, 100], height: 220, full: true, axes: true, xlabel: 't ω₀', ylabel: 'φ (°)' });
        let S = null, key = '';
        function sim() {
          const kk = `${aL.value}|${wr.value}|${p0.value}`; if (kk === key) return S; key = kk;
          const a = aL.value, w = wr.value, ph0 = p0.value * Math.PI / 180, kap = a * a * w * w / 4, TE = 40;
          const Tf = TAU / w, m = 60, h = Tf / m, n = Math.ceil(TE / h);
          const f = (t, y) => [y[1], (1 - a * w * w * Math.cos(w * t)) * Math.sin(y[0])];
          let y = [ph0, 0]; const pts = [[0, ph0]], smooth = []; let acc = 0, cnt = 0;
          for (let i = 0; i < n; i++) {
            y = rk4step(f, i * h, y, h); const t = (i + 1) * h;
            if (i % 3 === 2) pts.push([t, y[0]]);
            acc += y[0]; cnt++; if (cnt === m) { smooth.push([t - Tf / 2, acc / m]); acc = 0; cnt = 0; }
          }
          // averaged slow dynamics: φ'' = sin φ (1 − 2κ cos φ), released at the same angle
          const g2 = (t, y) => [y[1], Math.sin(y[0]) * (1 - 2 * kap * Math.cos(y[0]))];
          let z = [ph0, 0]; const av = [[0, ph0]]; const ha = 0.01;
          for (let i = 0; i < TE / ha; i++) { z = rk4step(g2, 0, z, ha); if (i % 2 === 1) av.push([(i + 1) * ha, z[0]]); }
          const cr = upCrossings(smooth.map((p) => p[0]), smooth.map((p) => p[1]));
          const crA = upCrossings(av.map((p) => p[0]), av.map((p) => p[1]));
          const Tm = cr.length > 1 ? (cr[cr.length - 1] - cr[0]) / (cr.length - 1) : NaN;
          let mx = 0; for (const p of pts) mx = Math.max(mx, Math.abs(p[1]));
          return (S = { a, w, kap, pts, av, Tm, TA: crA.length > 1 ? (crA[crA.length - 1] - crA[0]) / (crA.length - 1) : NaN, mx, h3: 3 * h });
        }
        v.animate((t) => {
          const s = sim(), D = 180 / Math.PI, tt = t % 40, i = Math.min(s.pts.length - 1, Math.round(tt / s.h3)), ph = s.pts[i][1];
          const yp = s.a * Math.cos(s.w * tt), Ueff = (p) => Math.cos(p) + s.kap * Math.sin(p) ** 2;
          // pendulum on its shaking pivot
          sP.line(0, -1.2, 0, 1.45, { color: 'faint', dash: [3, 4], width: 1 });
          sP.rect(-0.28, yp - 0.12, 0.28, yp, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.5 });
          sP.line(-0.06, -0.12 - 0.25 + yp, -0.06, yp - 0.12, { color: 'orange', width: 1.2 }); sP.line(0.06, -0.12 - 0.25 + yp, 0.06, yp - 0.12, { color: 'orange', width: 1.2 });
          const bx = Math.sin(ph), by = yp + Math.cos(ph);
          sP.line(0, yp, bx, by, { color: 'ink', width: 2.2 });
          sP.dot(bx, by, { color: 'accent', r: 10 }); sP.dot(0, yp, { color: 'ink', r: 3.5 });
          sP.corner(`a²ω²/2gL = ${v.fix(2 * s.kap, 2)}`, 'bl', { color: 2 * s.kap > 1 ? 'green' : 'red', weight: 600, size: 11.5 });
          // effective potential
          let lo = Infinity, hi = -Infinity; for (let k = 0; k <= 100; k++) { const p = -Math.PI + TAU * k / 100, u = Ueff(p); lo = Math.min(lo, u); hi = Math.max(hi, u); }
          sU.setView(null, [Math.min(-1.2, lo) - 0.15, Math.max(1.3, hi) + 0.35]);
          sU.fn(Math.cos, { color: 'muted', dash: [5, 4], width: 1.4 });
          sU.fn(Ueff, { color: 'accent', width: 2.6 });
          sU.vline(0, { color: 'faint', width: 1 });
          sU.text('upright', 0, sU.bounds.y[1], { color: 'muted', size: 11, dy: 12, dx: 5 });
          const pw = ((ph + Math.PI) % TAU + TAU) % TAU - Math.PI;
          sU.dot(pw, Ueff(pw), { color: 'gold', r: 6.5 });
          // angle against time
          const ym = clamp(s.mx * D * 1.12, 30, 400); sT.setView(null, [-ym, ym]);
          sT.path(s.av.map(([u, p]) => [u, p * D]), { color: 'orange', dash: [5, 4], width: 1.6 });
          sT.path(s.pts.map(([u, p]) => [u, p * D]), { color: 'accent', width: 1.4 });
          sT.vline(tt, { color: 'gold', width: 1.2, alpha: 0.6 });
        });
        v.legend([['accent', 'full simulation'], ['orange', 'slow motion in $U_{\\rm eff}$ (averaged)', { dash: true }], ['muted', 'bare potential $\\frac gL\\cos\\varphi$', { dash: true }]]);
        v.readout(() => {
          const s = sim(), r = 2 * s.kap, Om = Math.sqrt(Math.max(0, r - 1)), up = s.mx < Math.PI / 2;
          if (r <= 1) return `$a^2\\omega^2/2gL = ${v.fix(r, 3)} < 1$: no dimple at the top — the upright position is unstable and the pendulum falls (largest angle ${v.fix(s.mx * 180 / Math.PI, 0)}°)`;
          return `$a^2\\omega^2/2gL = ${v.fix(r, 3)} > 1$: the top is a minimum of $U_{\\rm eff}$ · predicted slow frequency $\\Omega = \\sqrt{a^2\\omega^2/2L^2-g/L} = ${v.fix(Om, 3)}\\,\\omega_0$ (small rocking), averaged model at this amplitude: period $${v.fix(s.TA, 3)}$ · full simulation: ${up ? `stays up, slow period $${v.fix(s.Tm, 3)}$ (in $1/\\omega_0$)` : 'falls over — the tilt is too large for the dimple'}${s.w < 12 ? ' · $\\omega$ is not ≫ $\\omega_0$ here, so averaging is unreliable' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.19
    {
      num: '4.19', kind: 'Phenomenon', name: 'Limit cycles: the van der Pol oscillator',
      statement: String.raw`The van der Pol oscillator
$$\ddot x-\mu(1-x^2)\dot x+x = 0\qquad(\mu>0)$$
has negative damping at small amplitude ($|x|<1$ pumps energy in) and positive damping at large amplitude. For every $\mu>0$ it has a unique **limit cycle**: an isolated closed orbit that attracts every trajectory except the unstable equilibrium at the origin, so the system settles into the same oscillation whatever its start. For small $\mu$ the cycle is nearly a circle of radius $2$ with period $\approx2\pi$; for large $\mu$ it becomes a **relaxation oscillation** — slow creeping alternating with fast jumps — with period $\approx(3-2\ln2)\,\mu$.`,
      idea: String.raw`Energy $E=\tfrac12(x^2+\dot x^2)$ changes at the rate $\dot E = \mu(1-x^2)\dot x^2$: inside the strip $|x|<1$ it grows, outside it shrinks. Small orbits spend all their time in the strip and grow; large ones spend most of it outside and shrink; in between there is exactly one balance, and averaging $\dot E$ over a near-circular orbit of radius $r$ gives $\propto r^2(1-r^2/4)$, which vanishes at $r=2$. Unlike a damped oscillator (4.7) the amplitude is fixed by the system, not by the initial conditions; unlike the harmonic oscillator’s orbits (4.5) the cycle is isolated. Liénard’s theorem proves existence and uniqueness for this whole class of equations.`,
      caption: String.raw`Two trajectories, one started near the origin and one far outside, spiral onto the same closed orbit (the shaded strip $|x|<1$ is where energy is pumped in). Raise $\mu$ and the cycle distorts into a relaxation oscillation; the right panel shows $x(t)$ from the inner start, growing and then locking onto the cycle’s waveform. **Click** in the phase plane to launch more trajectories.`,
      deps: ['mech-4.7', 'mech-4.5'],
      refs: ['Goldstein §11.3'],
      tags: ['limit cycles', 'nonlinear oscillations', 'self-excited oscillations'],
      credit: 'Balthasar van der Pol, 1926; Alfred-Marie Liénard, 1928',
      viz(v) {
        const mu = v.slider('$\\mu$', 0.05, 6, 1, { step: 0.05 });
        const s = v.stage({ x: [-3.2, 3.2], y: [-4, 4], height: 380, axes: true, xlabel: 'x', ylabel: 'ẋ', weight: 1 });
        const sx = v.stage({ x: [0, 50], y: [-2.6, 2.6], height: 380, axes: true, xlabel: 't', ylabel: 'x', weight: 1.15 });
        const pp = v.phasePlane(s, { f: (x, y, t, p) => [y, p.mu * (1 - x * x) * y - x], params: { mu }, method: 'rk45', seeds: [[0.12, 0, 'accent'], [-3.0, 3.0, 'orange']], field: 'arrows', nullclines: false, tMax: 200, maxTraj: 8 });
        let X = null, key = -1;
        function run() {
          if (key === mu.value) return X; key = mu.value;
          const m = mu.value, TE = Math.max(50, 12 * (3 - 2 * Math.log(2)) * m), r = v.M.rk45((t, y) => [y[1], m * (1 - y[0] * y[0]) * y[1] - y[0]], 0, [0.12, 0], TE, { tol: 1e-8, hmax: 0.05 });
          const ts = r.t, xs = r.y.map((y) => y[0]), vs = r.y.map((y) => y[1]);
          const late = ts.findIndex((t) => t > TE * 0.6), cr = upCrossings(ts.slice(late), xs.slice(late));
          const T = cr.length > 1 ? (cr[cr.length - 1] - cr[0]) / (cr.length - 1) : NaN;
          let amp = 0, vmax = 0; for (let i = late; i < xs.length; i++) { amp = Math.max(amp, Math.abs(xs[i])); vmax = Math.max(vmax, Math.abs(vs[i])); }
          return (X = { ts, xs, T, amp, vmax, TE });
        }
        v.button('Clear extra trajectories', () => { pp.clear(); pp.add(0.12, 0); pp.add(-3.0, 3.0); });
        v.animate((t) => {
          const r = run(), ym = Math.max(4, 1.25 * r.vmax);
          s.setView(null, [-ym, ym]);
          s.vband(-1, 1, { color: 'green', alpha: 0.08 });
          s.text('energy pumped in', 0, -ym, { color: 'green', size: 11, align: 'center', dy: -12 });
          pp.draw({ particles: true, t: t * 2 });
          sx.setView([0, r.TE], null);
          sx.hband(-1, 1, { color: 'green', alpha: 0.06 });
          sx.path(r.ts.map((u, i) => [u, r.xs[i]]), { color: 'accent', width: 1.8 });
        });
        pp.legend([['green', 'negative damping, $|x|<1$', { area: true }], ['gold', 'moving with the flow', { dot: true }]]);
        v.readout(() => {
          const r = run(), m = mu.value;
          return `limit cycle (from the simulation): amplitude ${v.fix(r.amp, 3)}, period $T = ${v.fix(r.T, 3)}$ · small-$\\mu$ estimate $2\\pi(1+\\mu^2/16) = ${v.fix(TAU * (1 + m * m / 16), 3)}$ (for $\\mu\\ll1$) · relaxation estimate $(3-2\\ln2)\\mu = ${v.fix((3 - 2 * Math.log(2)) * m, 3)}$ (for $\\mu\\gg1$)${m > 3 ? ' (plus a correction $\\approx 7.0\\,\\mu^{-1/3}$ for finite $\\mu$: ' + v.fix((3 - 2 * Math.log(2)) * m + 7.014 * Math.pow(m, -1 / 3), 3) + ')' : ''}`;
        });
      },
    },
  ],
};
