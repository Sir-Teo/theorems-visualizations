// Classical Mechanics — Chapter 4: Oscillations

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
/** Fixed-step RK4 run → {t: [], y: [[…]]}. */
function rk4run(f, y0, t1, n, t0 = 0) {
  const h = (t1 - t0) / n, T = [t0], Y = [y0]; let y = y0;
  for (let i = 0; i < n; i++) { y = rk4step(f, t0 + i * h, y, h); T.push(t0 + (i + 1) * h); Y.push(y); }
  return { t: T, y: Y, h };
}
/** Zig-zag spring polyline from (x0, y0) to (x1, y1): n coils of half-width w, straight leads (fraction `lead` of the length). */
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
const meanGap = (c) => (c.length > 1 ? (c[c.length - 1] - c[0]) / (c.length - 1) : NaN);
/**
 * Motion x'' = F(x) released from rest at x0, by RK4 with step h: integrates until the velocity has vanished twice
 * (the other turning point, then back). → {half, T, x1 (other turning point), ts, xs (one full period), h}.
 */
function releasePeriod(F, x0, h = 0.01, onlyHalf = false, tMax = 600) {
  const f = (t, y) => [y[1], F(y[0])], s0 = Math.sign(F(x0));
  const ts = [0], xs = [x0]; let y = [x0, 0], t = 0, half = NaN, x1 = NaN, T = NaN, phase = 0;
  if (!s0) return { half, T, x1, ts, xs, h };
  while (t < tMax) {
    const yn = rk4step(f, t, y, h), a = y[1] * s0, b = yn[1] * s0;
    if (phase === 0 && a > 0 && b <= 0) { const u = a / (a - b); half = t + u * h; x1 = y[0] + u * (yn[0] - y[0]); phase = 1; if (onlyHalf) break; }
    else if (phase === 1 && a < 0 && b >= 0) { T = t + a / (a - b) * h; ts.push(t + h); xs.push(yn[0]); break; }
    y = yn; t += h; ts.push(t); xs.push(y[0]);
  }
  return { half, T, x1, ts, xs, h };
}
/** Closed-form free motion of x'' + 2βx' + ω0²x = 0 with β = ζω0 (any sign), from (x0, v0). → t ↦ x(t). */
function dampedClosed(zeta, w0, x0, v0) {
  const b = zeta * w0;
  if (Math.abs(zeta - 1) < 1e-7) return (t) => (x0 + (v0 + b * x0) * t) * Math.exp(-b * t);
  if (zeta < 1) { const w1 = w0 * Math.sqrt(1 - zeta * zeta); return (t) => Math.exp(-b * t) * (x0 * Math.cos(w1 * t) + (v0 + b * x0) / w1 * Math.sin(w1 * t)); }
  const s = w0 * Math.sqrt(zeta * zeta - 1), l1 = -b + s, l2 = -b - s, c1 = (v0 - l2 * x0) / (l1 - l2), c2 = x0 - c1;
  return (t) => c1 * Math.exp(l1 * t) + c2 * Math.exp(l2 * t);
}
/** Steady-state complex response of x'' + 2βx' + ω0²x = f0 e^{iωt}: amplitude A and lag δ ∈ [0, π]. */
function steady(w, w0, beta, f0 = 1) {
  const re = w0 * w0 - w * w, im = 2 * beta * w;
  return { A: f0 / Math.hypot(re, im), d: Math.atan2(im, re) };
}
/** Amplitude and lag of a sampled signal at angular frequency w (least squares over whole periods at the end of the run). */
function lockIn(ts, xs, w, periods = 4) {
  const tEnd = ts[ts.length - 1], t0 = tEnd - periods * TAU / w; let a = 0, b = 0, n = 0;
  for (let i = 1; i < ts.length; i++) {
    if (ts[i - 1] < t0 - 1e-9 * tEnd) continue;
    const dt = ts[i] - ts[i - 1], tm = (ts[i] + ts[i - 1]) / 2, xm = (xs[i] + xs[i - 1]) / 2;
    a += xm * Math.cos(w * tm) * dt; b += xm * Math.sin(w * tm) * dt; n += dt;
  }
  a *= 2 / n; b *= 2 / n;
  return { A: Math.hypot(a, b), d: Math.atan2(b, a) };
}
/** Float32 audio buffer with short fade-in/out ramps (no clicks). */
function fade(buf, sr, ms = 30) {
  const n = Math.floor(sr * ms / 1000);
  for (let i = 0; i < n && i < buf.length; i++) { const g = i / n; buf[i] *= g; buf[buf.length - 1 - i] *= g; }
  return buf;
}

export default {
  collection: 'mech',
  chapter: 4,
  title: 'Oscillations',
  summary: String.raw`Near any stable equilibrium a system behaves like a mass on a spring, which is why the harmonic oscillator is everywhere. Friction splits its motion into three regimes of decay; a periodic drive produces resonance, whose sharpness is measured by the quality factor; and linearity lets any drive be handled by a Fourier series or by a Green’s function. Then we leave the linear world: the pendulum’s period grows with amplitude, resonance curves bend over and jump, modulating a parameter pumps energy in, a fast-shaken pivot holds a pendulum upside down, and self-excited systems settle on limit cycles.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Law', name: 'Hooke’s law',
      credit: 'Robert Hooke, 1678 (“ut tensio, sic vis”)',
      statement: String.raw`A body that is deformed elastically by a small amount pulls back with a force proportional to the deformation. For a spring of natural length $\ell_0$ held at length $\ell$, the force it exerts on the attached body is
$$F = -k\,(\ell-\ell_0) = -k\,x ,$$
directed back toward the natural length, in stretching ($x>0$) and in compression ($x<0$) alike. The **spring constant** $k>0$ (in N/m) depends on the material and on the geometry of the spring.`,
      scope: String.raw`Holds for deformations well below the elastic (proportional) limit of the material and for slow loading. Past the yield point the material flows: the force–extension curve bends away from the line, and unloading leaves a permanent set, so the spring no longer returns to $\ell_0$. A coil spring compressed to its solid length (coils touching) stops behaving like a spring altogether.`,
      idea: String.raw`Any smooth restoring force with $F(0)=0$ is linear to first order, $F(x) = F'(0)\,x + O(x^2)$, and Hooke’s law keeps that first term with $k = -F'(0)$. Physically, the wire of a coil spring is twisted, and as long as the coil geometry barely changes the shear strain in the wire is proportional to the extension; the atoms of the metal sit near the bottom of their interaction potential, where every potential looks like a parabola (4.3). Fed into Newton’s second law (mech-1.6) the law produces the harmonic oscillator (4.2). It is an empirical law with a definite range: once the stress reaches the yield stress, dislocations move and part of the deformation becomes permanent.`,
      caption: String.raw`**Drag the block** to stretch or compress the spring; the right panel records the force on the block (gold trace) against the Hooke line $F=-kx$ (dashed). Inside the green band the trace follows the line and retraces it on the way back. Pull past the elastic limit and the curve bends away; **Let go** and the spring comes back along a parallel line to a new rest length — a permanent set. Push it to its solid length and the coils bind (red zone).`,
      deps: ['mech-1.6'],
      refs: ['Taylor §5.1'],
      tags: ['springs', 'elasticity', 'linearity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hooke%27s_law' },
      viz(v) {
        // units: cm and N. k = 40 N/m; yield at 4 N with 10 % linear hardening; solid length reached at x = −8 cm
        const K = 0.4, FY = 4, HK = 0.04, L0 = 20, XB = -8, KB = 8, BW = 4;
        const rig = v.stage({ x: [-3, 49], y: [-7.2, 6.4], equal: true, height: 220, axes: false, full: true });
        const plot = v.stage({ x: [-10, 25], y: [-6.5, 8.5], height: 270, full: true, xlabel: 'extension x (cm)', ylabel: 'F (N)' });
        let st;
        const force = (x) => -K * (Math.max(x, XB) - st.p) - (x < XB ? KB * (x - XB) : 0); // once the coils touch the wire is frozen
        function moveTo(x1) {
          const x0 = st.x, n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 0.05));
          for (let i = 1; i <= n; i++) {
            const x = x0 + (x1 - x0) * i / n, f = K * (Math.max(x, XB) - st.p), fy = FY + HK * st.al;
            if (Math.abs(f) > fy) { const d = (Math.abs(f) - fy) / (K + HK); st.p += Math.sign(f) * d; st.al += d; } // return mapping
            st.x = x; st.hist.push([x, force(x)]);
          }
          if (st.hist.length > 9000) st.hist.splice(0, st.hist.length - 9000);
        }
        const blk = rig.handle(L0 + BW / 2, 0, { color: 'accent', constrain: (x) => [clamp(x, L0 + XB - 0.7 + BW / 2, L0 + 24 + BW / 2), 0] });
        blk.onDrag = () => moveTo(blk.x - L0 - BW / 2);
        const sync = () => { blk.x = L0 + st.x + BW / 2; };
        const reset = () => { st = { x: 0, p: 0, al: 0, hist: [[0, 0]] }; };
        reset(); moveTo(8); sync();
        v.button('Let go', () => { moveTo(Math.max(st.p, XB)); sync(); });
        v.button('Load to 18 cm and let go', () => { moveTo(18); moveTo(st.p); sync(); });
        v.button('New spring', () => { reset(); sync(); });
        v.render(() => {
          const x = st.x, F = force(x), bx = L0 + x, cx = bx + BW / 2, fy = FY + HK * st.al;
          // --- the rig
          hatch(v, rig, 0, -5.4, 0, 5.4, -1);
          rig.line(0, -2.6, 48.5, -2.6, { color: 'faint', width: 1.5 });
          rig.path(springPts(0, 0, bx, 0, 12, 1.5, 0.05), { color: x < XB ? 'red' : Math.abs(st.p) > 0.01 ? 'orange' : 'ink', width: 1.8 });
          rig.rect(bx, -2.5, bx + BW, 2.5, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          rig.line(L0, -5.6, L0, 3.4, { color: 'muted', dash: [4, 4], width: 1.2 });
          rig.tex('\\ell_0', L0, -6.4, { color: 'muted', size: 14 });
          if (Math.abs(st.p) > 0.05) {
            rig.line(L0 + st.p, -5.6, L0 + st.p, 3.4, { color: 'orange', dash: [4, 4], width: 1.2 });
            rig.text('new rest length', L0 + st.p, -6.4, { color: 'orange', size: 11, align: st.p > 0 ? 'left' : 'right', dx: st.p > 0 ? 11 : -11 });
          }
          if (Math.abs(F) > 0.06) {
            rig.arrow(cx, 4.4, cx + F * 1.7, 4.4, { color: 'purple', width: 2.4 });
            rig.tex('F', cx + F * 0.85, 4.4, { color: 'purple', dy: -12, size: 14 });
          }
          if (x < XB) rig.corner('coils touching: solid length reached', 'tr', { color: 'red', weight: 600 });
          else if (Math.abs(st.p) > 0.01) rig.corner(`permanently stretched by ${v.fix(st.p, 1)} cm`, 'tr', { color: 'orange', weight: 600 });
          // --- force against extension
          const lo = Math.max(st.p - fy / K, XB), hi = st.p + fy / K;
          plot.vband(lo, hi, { color: 'green', alpha: 0.1 });
          plot.vband(-12, XB, { color: 'red', alpha: 0.09 });
          plot.text('elastic range', Math.min(hi, 25) - 0.4, -5.9, { color: 'green', align: 'right', size: 11.5, weight: 600 });
          plot.text('coil bind', (XB - 10) / 2, -5.9, { color: 'red', align: 'center', size: 11 });
          plot.fn((u) => -K * u, { color: 'muted', dash: [6, 5], width: 1.5 });
          plot.tex('F=-kx', 16, -K * 16, { color: 'muted', align: 'right', baseline: 'top', dx: -8, dy: 6, size: 14 });
          plot.path(st.hist, { color: 'gold', width: 2.6 });
          plot.dot(x, F, { color: 'accent', r: 5.5 });
        });
        v.legend([['gold', 'measured force while you drag'], ['muted', 'Hooke’s law $F=-kx$, $k = 40$ N/m', { dash: true }], ['green', 'current elastic range', { area: true }]]);
        v.readout(() => {
          const x = st.x, F = force(x), hk = -K * x;
          let s = `$x = ${v.fix(x, 1)}$ cm · force on the block $F = ${v.fix(F, 2)}$ N · Hooke: $-kx = ${v.fix(hk, 2)}$ N`;
          if (x < XB) s += ' · **coils touching**: the steep rise is contact between the coils, not elasticity';
          else if (Math.abs(st.p) > 0.01) s += ` · **permanent set** of ${v.fix(st.p, 1)} cm: the spring now rests at $\\ell_0 ${st.p > 0 ? '+' : '-'} ${v.fix(Math.abs(st.p), 1)}$ cm, and $F=-kx$ (measured from the old $\\ell_0$) is off by ${v.fix(Math.abs(F - hk), 2)} N`;
          else s += ` · elastic: deviation ${v.fix(Math.abs(x) > 0.3 ? 100 * Math.abs(F - hk) / Math.abs(hk) : 0, 1)} % — drag back and the trace retraces the line`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Model', name: 'Simple harmonic oscillator',
      statement: String.raw`A mass $m$ on a spring obeying Hooke’s law moves according to $m\ddot x = -kx$. With $\omega = \sqrt{k/m}$, every solution is
$$x(t) = A\cos(\omega t-\varphi) = \mathrm{Re}\big(a\,e^{i\omega t}\big),\qquad a = A e^{-i\varphi},$$
the shadow on the real axis of a phasor $a e^{i\omega t}$ turning at constant angular speed $\omega$. The constants $A\ge0$ and $\varphi$ are fixed by $x(0)$ and $\dot x(0)$. The period $T = 2\pi/\omega = 2\pi\sqrt{m/k}$ does not depend on the amplitude (**isochronism**), and the energy is $E = \tfrac12 kA^2$.`,
      scope: String.raw`Holds as long as the spring obeys Hooke’s law over the whole swing (amplitudes well inside the elastic range, 4.1) and friction is negligible over the times of interest. A spring with a cubic correction makes the period depend on the amplitude.`,
      idea: String.raw`Look for solutions $e^{\lambda t}$: the equation gives $\lambda^2 = -k/m$, so $\lambda = \pm i\omega$. Because $\tfrac{d}{dt}e^{i\omega t} = i\omega\,e^{i\omega t}$ (rca-0.3), $z(t)=a e^{i\omega t}$ satisfies $\ddot z = -\omega^2 z$, and since the equation is linear with real coefficients its real part is a real solution; with two free real constants it matches any initial position and velocity, and by uniqueness of solutions these are all the motions. Linearity also explains isochronism: doubling the amplitude doubles the whole solution, so it cannot change its period.`,
      caption: String.raw`The arrow is the phasor $Ae^{i(\omega t-\varphi)}$; the block below is a mass integrated directly from $m\ddot x=-kx$, and it rides exactly under the phasor’s shadow. Change $A$: the period readout does not move. Change $m$ or $k$: it scales as $\sqrt{m/k}$. Then add a **non-Hooke term** $\epsilon$ (force $-kx[1+\epsilon(x/10\,\mathrm{cm})^2]$): the mass slips away from the phasor and the period starts to depend on $A$.`,
      deps: ['mech-4.1', 'rca-0.3', 'mech-1.9'],
      refs: ['Taylor §5.2'],
      tags: ['harmonic oscillator', 'phasors'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Harmonic_oscillator' },
      viz(v) {
        const m = v.slider('mass $m$ (kg)', 0.1, 2, 0.5, { step: 0.01 });
        const k = v.slider('spring constant $k$ (N/m)', 5, 50, 20, { step: 0.5 });
        const A = v.slider('amplitude $A$ (cm)', 2, 12, 9, { step: 0.1 });
        const ph = v.slider('phase $\\varphi$ (rad)', 0, 6.28, 0.6, { step: 0.01 });
        const eps = v.slider('non-Hooke term $\\epsilon$', 0, 3, 0, { step: 0.01 });
        const W = 6;
        const sP = v.stage({ x: [-35, 15.5], y: [-25, 14.5], equal: true, height: 340, axes: false, weight: 1.05 });
        const sT = v.stage({ x: [0, W], y: [-15, 15], height: 340, axes: 'box', xlabel: 't (s)', ylabel: 'x (cm)', weight: 1 });
        let sim = null, key = '';
        function simulate() {
          const kk = `${m.value}|${k.value}|${A.value}|${ph.value}|${eps.value}`; if (kk === key) return sim; key = kk;
          const w = Math.sqrt(k.value / m.value), T = TAU / w, e = eps.value, R = A.value;
          const acc = (x) => -w * w * x * (1 + e * (x / 10) ** 2);
          const tEnd = Math.max(W, 3.5 * T), n = Math.ceil(tEnd / (T / 500)), dt = tEnd / n;
          const r = v.M.verlet(acc, R * Math.cos(ph.value), R * w * Math.sin(ph.value), dt, n);
          let err = 0; for (let i = 0; i < r.t.length && r.t[i] <= W; i++) err = Math.max(err, Math.abs(r.x[i] - R * Math.cos(w * r.t[i] - ph.value)));
          const cr = upCrossings(r.t, r.x);
          return (sim = { w, T, r, dt, err, Tm: meanGap(cr), cr });
        }
        v.animate((t) => {
          const S = simulate(), R = A.value, th = S.w * t - ph.value;
          const tt = t % W, i = Math.min(S.r.x.length - 1, Math.round(tt / S.dt)), xs = S.r.x[i];
          // phasor plane
          sP.line(-15, 0, 15, 0, { color: 'faint', width: 1 }); sP.line(0, -14, 0, 14, { color: 'faint', width: 1 });
          sP.text('Re', 15.3, 0, { color: 'muted', size: 11, dy: -9, align: 'right' }); sP.text('Im', 0, 13.6, { color: 'muted', size: 11, dx: 6 });
          sP.circle(0, 0, R, { color: 'accent', alpha: 0.35, width: 1.2 });
          const px = R * Math.cos(th), py = R * Math.sin(th);
          sP.line(px, py, px, -16.2, { color: 'orange', dash: [3, 4], width: 1.3 });
          sP.arrow(0, 0, px, py, { color: 'accent', width: 2.6 });
          sP.tex('Ae^{i(\\omega t-\\varphi)}', px, py, { color: 'accent', align: px >= 0 ? 'left' : 'right', baseline: py >= 0 ? 'bottom' : 'top', dx: px >= 0 ? 6 : -6, dy: py >= 0 ? -4 : 4, size: 14 });
          // rig
          hatch(v, sP, -33, -22.4, -33, -14.4, -1);
          sP.line(-33, -21.6, 15.5, -21.6, { color: 'faint', width: 1.5 });
          sP.line(0, -23.8, 0, -15, { color: 'muted', dash: [2, 3], width: 1 });
          sP.path(springPts(-33, -18.8, xs - 2.6, -18.8, 12, 1.4, 0.05), { color: 'ink', width: 1.6 });
          sP.rect(xs - 2.6, -21.5, xs + 2.6, -16.2, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          sP.tex('m', xs, -18.85, { color: 'accent', size: 14 });
          sP.text('x = 0', 0, -24.4, { color: 'muted', size: 10.5, align: 'center' });
          // x(t)
          sT.hline(0, { color: 'faint', width: 1 });
          sT.fn((u) => R * Math.cos(S.w * u - ph.value), { color: 'orange', dash: [5, 4], width: 1.5 });
          const pts = []; for (let j = 0; j <= i; j++) pts.push([S.r.t[j], S.r.x[j]]);
          sT.path(pts, { color: 'accent', width: 2.4 });
          sT.dot(tt, xs, { color: 'gold', r: 5 });
          const c = S.cr.filter((u) => u <= W);
          if (c.length > 1) sT.measure(c[0], -R - 1.6, c[1], -R - 1.6, 'T', { color: 'green', offset: -12 });
        });
        v.legend([['accent', 'mass integrated from $m\\ddot x=-kx$ (Verlet)'], ['orange', 'shadow of the phasor, $A\\cos(\\omega t-\\varphi)$', { dash: true }]]);
        v.readout(() => {
          const S = simulate(), E = 0.5 * k.value * (A.value / 100) ** 2;
          let s = `$\\omega = \\sqrt{k/m} = ${v.fix(S.w, 3)}$ rad/s · $T = 2\\pi\\sqrt{m/k} = $ ${v.M.si(S.T, 's', 4)} · simulated period ${v.M.si(S.Tm, 's', 4)}`;
          if (eps.value === 0) s += ` for amplitude ${v.fix(A.value, 1)} cm — change $A$, it stays put · $\\max|x_{\\rm sim}-A\\cos(\\omega t-\\varphi)| = ${v.sci(S.err, 2)}$ cm · $E = \\tfrac12 kA^2 = $ ${v.M.si(E, 'J')}`;
          else s += ` — **not** $2\\pi\\sqrt{m/k}$ (${v.fix(100 * (S.Tm / S.T - 1), 1)} %): the spring is no longer linear, so the period depends on $A$ and the mass drifts away from the phasor’s shadow`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Theorem', name: 'Small oscillations about any minimum are harmonic',
      statement: String.raw`Let a particle of mass $m$ move on a line in a potential $U$ of class $C^3$, and let $x_0$ be a **non-degenerate minimum**: $U'(x_0)=0$ and $U''(x_0)>0$. Then the motions with energy close to $U(x_0)$ are oscillations about $x_0$ that are approximated by the harmonic oscillator with spring constant $k = U''(x_0)$. In particular, if $T(a)$ is the period of the oscillation with amplitude $a$,
$$T(a) \;\longrightarrow\; T_0 = 2\pi\sqrt{\frac{m}{U''(x_0)}}\quad (a\to 0), \qquad T(a) = T_0\big(1+O(a^2)\big).$$
If $U''(x_0)=0$ the conclusion fails: for $U = cx^4$ the period is proportional to $1/a$.`,
      idea: String.raw`Taylor’s theorem (pma-5.15) gives $U(x) = U(x_0)+\tfrac12U''(x_0)(x-x_0)^2+O(|x-x_0|^3)$, so near the minimum the force $-U'(x)$ is Hooke’s law with $k=U''(x_0)$ plus a correction of order $(x-x_0)^2$. Rescaling $x-x_0 = a\xi$ turns the equation into the harmonic one plus terms of size $O(a)$; the first-order term is odd in $\xi$, so its effect on the period cancels over a cycle, leaving a shift of order $a^2$. The minimum is a stable equilibrium (mech-3.12), and the harmonic oscillator (4.2) is its universal local model. When $U''(x_0)=0$ there is no quadratic term to dominate and no harmonic limit.`,
      caption: String.raw`Choose a potential and **drag the release point** along the curve. The gold ball moves under the true potential; the hollow orange ball follows the osculating parabola (dashed). Right: the simulated period against the amplitude — it starts exactly at the harmonic value $2\pi/\sqrt{U''/m}$ and drifts as the amplitude grows (longer for the Morse and pendulum wells, shorter for the stiffening one). The degenerate well $x^4/4$ has no harmonic limit at all.`,
      deps: ['mech-4.2', 'mech-3.12', 'pma-5.15'],
      refs: ['Taylor §5.1', 'Arnold §22'],
      tags: ['stability', 'linearization', 'harmonic oscillator'],
      viz(v) {
        const POT = {
          morse: { label: 'Morse', U: (x) => 0.5 * (1 - Math.exp(-x)) ** 2, F: (x) => -(1 - Math.exp(-x)) * Math.exp(-x), x: [-1, 4], y: [-0.04, 0.62], lim: [-0.66, 3.5], x0: 0.7, amax: 2.2 },
          pend: { label: 'pendulum $1-\\cos x$', U: (x) => 1 - Math.cos(x), F: (x) => -Math.sin(x), x: [-3.5, 3.5], y: [-0.08, 2.25], lim: [-3.08, 3.08], x0: 1.6, amax: 3.15 },
          stiff: { label: '$\\tfrac12x^2+\\tfrac14x^4$', U: (x) => x * x / 2 + x ** 4 / 4, F: (x) => -x - x ** 3, x: [-1.8, 1.8], y: [-0.08, 2.4], lim: [-1.45, 1.45], x0: 1.0, amax: 1.5 },
          quart: { label: '$\\tfrac14x^4$ (degenerate)', U: (x) => x ** 4 / 4, F: (x) => -(x ** 3), x: [-1.9, 1.9], y: [-0.08, 2.4], lim: [-1.7, 1.7], x0: 1.0, amax: 1.75 },
        };
        const sel = v.select('potential', Object.entries(POT).map(([value, p]) => ({ value, label: p.label })), 'morse');
        const sU = v.stage({ x: POT.morse.x, y: POT.morse.y, height: 320, axes: 'box', xlabel: 'x', ylabel: 'U(x)', weight: 1.15 });
        const sT = v.stage({ x: [0, 2.2], y: [0, 2.6], height: 320, axes: 'box', xlabel: 'amplitude a', ylabel: 'T / 2π', weight: 1 });
        const hp = sU.handle(POT.morse.x0, POT.morse.U(POT.morse.x0), {
          color: 'accent', label: 'release', labelPos: 'ne',
          constrain: (x) => { const P = POT[sel.value]; let xx = clamp(x, P.lim[0], P.lim[1]); if (Math.abs(xx) < 0.03) xx = 0.03 * (Math.sign(xx) || 1); return [xx, P.U(xx)]; },
        });
        const curves = {}; let run = null, rkey = '', last = null;
        function curve(name) {
          if (curves[name]) return curves[name];
          const P = POT[name], out = [];
          for (let j = 1; j <= 44; j++) {
            const xr = P.lim[1] * (j / 44) ** 1.3, r = releasePeriod(P.F, xr, 0.01, true);
            if (isFinite(r.half)) out.push([(xr - r.x1) / 2, 2 * r.half / TAU]);
          }
          return (curves[name] = out);
        }
        function current() {
          const kk = `${sel.value}|${hp.x}`; if (kk === rkey) return run; rkey = kk;
          const P = POT[sel.value], r = releasePeriod(P.F, hp.x, 0.005);
          return (run = { ...r, a: Math.abs(hp.x - r.x1) / 2, lo: Math.min(hp.x, r.x1), hi: Math.max(hp.x, r.x1) });
        }
        v.animate((t) => {
          const P = POT[sel.value];
          if (last !== sel.value) { last = sel.value; sU.setView(P.x, P.y); hp.x = P.x0; sT.setView([0, P.amax], null); }
          hp.y = P.U(hp.x);
          const R = current(), k2 = v.M.deriv2(P.U, 0), E = P.U(hp.x);
          // potential, parabola, energy level
          if (k2 > 1e-6) sU.fn((x) => 0.5 * k2 * x * x, { color: 'orange', dash: [6, 5], width: 1.6 });
          sU.fn(P.U, { color: 'ink', width: 2.4 });
          sU.line(R.lo, E, R.hi, E, { color: 'gold', dash: [3, 3], width: 1.3 });
          sU.dot(R.x1, E, { color: 'gold', r: 3.5 });
          if (isFinite(R.T)) {
            const tt = t % R.T, i = Math.min(R.xs.length - 1, Math.round(tt / R.h)), xs = R.xs[i];
            if (k2 > 1e-6) { const xh = hp.x * Math.cos(Math.sqrt(k2) * tt); sU.dot(xh, 0.5 * k2 * xh * xh, { color: 'orange', hollow: true, r: 6.5, width: 2.2 }); }
            sU.dot(xs, P.U(xs), { color: 'gold', r: 7.5 });
          }
          // period against amplitude
          const C = curve(sel.value);
          if (k2 > 1e-6) {
            sT.hline(Math.sqrt(1 / k2), { color: 'orange', dash: [6, 5], width: 1.5 });
            sT.text('harmonic prediction 2π√(m/U″(x₀))', P.amax * 0.97, Math.sqrt(1 / k2), { color: 'orange', size: 11, dy: 11, align: 'right' });
          } else sT.corner('U″(x₀) = 0: no harmonic limit, T → ∞ as a → 0', 'tr', { color: 'red', weight: 600 });
          sT.path(C, { color: 'accent', width: 2.4 });
          sT.dots(C, { color: 'accent', r: 2.2 });
          if (isFinite(R.T)) sT.dot(R.a, R.T / TAU, { color: 'gold', r: 6, label: 'now', labelPos: 'se' });
        });
        v.legend([['ink', 'potential $U$'], ['orange', 'osculating parabola $\\tfrac12U\'\'(x_0)(x-x_0)^2$', { dash: true }], ['gold', 'simulated motion', { dot: true }], ['accent', 'simulated period $T(a)$']]);
        v.readout(() => {
          const P = POT[sel.value], R = current(), k2 = v.M.deriv2(P.U, 0);
          if (!isFinite(R.T)) return 'release away from the minimum';
          if (k2 > 1e-6) {
            const T0 = TAU / Math.sqrt(k2), rel = R.T / T0 - 1;
            return `$U''(x_0) = ${v.fix(k2, 4)}$ (numerical) → $T_0 = 2\\pi\\sqrt{m/U''(x_0)} = ${v.fix(T0, 4)}$ · simulated $T = ${v.fix(R.T, 4)}$ at amplitude $a = ${v.fix(R.a, 3)}$, ${rel >= 0 ? '+' : '−'}${v.fix(Math.abs(100 * rel), 2)} % · $(T/T_0-1)/a^2 = ${v.fix(rel / (R.a * R.a), 4)}$ — this ratio settles to a constant as $a\\to0$ (try it), so the error is $O(a^2)$`;
          }
          return `$U''(x_0) = 0$: the hypothesis fails. Simulated $T = ${v.fix(R.T, 3)}$ at $a = ${v.fix(R.a, 3)}$, and $T\\cdot a = ${v.fix(R.T * R.a, 4)}$ is the same for every amplitude ($= 4K(1/\\sqrt2) = 7.416$), so $T\\to\\infty$ as $a\\to0$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Model', name: 'Simple pendulum',
      statement: String.raw`A point mass $m$ on a massless rigid rod (or taut string) of length $L$, swinging without friction about a fixed pivot in uniform gravity $g$, obeys
$$mL\ddot\theta = -mg\sin\theta .$$
For small angles $\sin\theta\approx\theta$, and the motion is simple harmonic with angular frequency $\omega_0 = \sqrt{g/L}$ and period $T_0 = 2\pi\sqrt{L/g}$, independent of the mass and of the amplitude.`,
      scope: String.raw`The linear (small-angle) model is accurate to better than 0.2 % in period for amplitudes below about $10^\circ$ and to 1 % below about $23^\circ$; beyond that the period grows with amplitude (4.14). It also assumes a point bob, a massless inextensible suspension, no friction or air drag, and a string that stays taut.`,
      idea: String.raw`The tension in the string is a constraint force along the string (mech-1.14), so only the tangential component of gravity, $-mg\sin\theta$, changes the speed along the arc $s=L\theta$. The potential $U(\theta)=mgL(1-\cos\theta)$ has a non-degenerate minimum at $\theta=0$ with $U''(0)=mgL$, so by 4.3 small swings are harmonic with $\omega_0^2 = U''(0)/(mL^2) = g/L$. The mass cancels because the same $m$ measures inertia and weight.`,
      caption: String.raw`The solid pendulum is integrated from the full equation; the hollow orange one is the small-angle model started at the same angle. At a few degrees they swing in lockstep; raise $\theta_0$ and the true pendulum falls behind, since its period is longer. Change $L$ or the planet: the period follows $2\pi\sqrt{L/g}$, and the mass never enters.`,
      deps: ['mech-4.3', 'mech-1.14'],
      refs: ['Taylor §5.2'],
      tags: ['pendulum', 'small oscillations'],
      credit: 'Galileo (isochronism, c. 1602); Huygens, 1673',
      viz(v) {
        const th0 = v.slider('release angle $\\theta_0$ (°)', 1, 175, 50, { step: 1 });
        const Ls = v.slider('length $L$ (m)', 0.2, 3, 1, { step: 0.01 });
        const G = { earth: v.M.CONST.g0, moon: 1.62, jupiter: 24.79 };
        const gs = v.select('gravity', [{ value: 'earth', label: 'Earth' }, { value: 'moon', label: 'Moon' }, { value: 'jupiter', label: 'Jupiter' }], 'earth');
        const sp = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 320, axes: false, weight: 0.75, minWidth: 220 });
        const sg = v.stage({ x: [0, 4], y: [-70, 70], height: 320, axes: 'box', xlabel: 't (s)', ylabel: 'θ (°)', weight: 1.25 });
        let S = null, key = '';
        function sim() {
          const kk = `${th0.value}|${Ls.value}|${gs.value}`; if (kk === key) return S; key = kk;
          const g = G[gs.value], w0 = Math.sqrt(g / Ls.value), T0 = TAU / w0, a0 = th0.value * Math.PI / 180;
          const n = 2400, r = v.M.verlet((x) => -w0 * w0 * Math.sin(x), a0, 0, 4 * T0 / n, n);
          const P = releasePeriod((x) => -w0 * w0 * Math.sin(x), a0, T0 / 3000, true);
          return (S = { g, w0, T0, a0, r, dt: 4 * T0 / n, T: 2 * P.half });
        }
        v.animate((t) => {
          const s = sim(), W = 4 * s.T0, tt = t % W, i = Math.min(s.r.x.length - 1, Math.round(tt / s.dt));
          const th = s.r.x[i], tl = s.a0 * Math.cos(s.w0 * tt), D = 180 / Math.PI;
          // pendulum picture (window fitted to the swing)
          const hx = s.a0 > Math.PI / 2 ? 1.15 : Math.max(0.5, 1.12 * Math.sin(s.a0) + 0.1);
          sp.setView([-hx, hx], [-1.18, Math.max(0.22, -1.12 * Math.cos(s.a0) + 0.12)]);
          hatch(v, sp, -0.16, 0.035, 0.16, 0.035, -1, 6, 6);
          sp.curve((a) => [Math.sin(a), -Math.cos(a)], -s.a0, s.a0, { color: 'faint', dash: [3, 4], width: 1 });
          sp.line(0, 0, 0, -1.12, { color: 'faint', width: 1, dash: [2, 4] });
          sp.line(0, 0, Math.sin(tl), -Math.cos(tl), { color: 'orange', width: 1.4, dash: [5, 4] });
          sp.dot(Math.sin(tl), -Math.cos(tl), { color: 'orange', hollow: true, r: 10, width: 2.2 });
          sp.line(0, 0, Math.sin(th), -Math.cos(th), { color: 'ink', width: 2 });
          sp.dot(Math.sin(th), -Math.cos(th), { color: 'accent', r: 11 });
          sp.dot(0, 0, { color: 'ink', r: 3 });
          sp.corner(`L = ${v.fix(Ls.value, 2)} m`, 'bl');
          // angle against time
          sg.setView([-0.02 * W, W], [-1.22 * th0.value, 1.22 * th0.value]);
          sg.hline(0, { color: 'faint', width: 1 });
          sg.fn((u) => th0.value * Math.cos(s.w0 * u), { color: 'orange', dash: [5, 4], width: 1.6 });
          const pts = s.r.x.map((x, j) => [s.r.t[j], x * D]);
          sg.path(pts, { color: 'accent', width: 1.2, alpha: 0.3 });
          sg.path(pts.slice(0, i + 1), { color: 'accent', width: 2.4 });
          sg.dot(tt, th * D, { color: 'accent', r: 5 });
          sg.dot(tt, tl * D, { color: 'orange', r: 4.5, hollow: true });
        });
        v.legend([['accent', 'true pendulum, $\\ddot\\theta=-(g/L)\\sin\\theta$'], ['orange', 'small-angle model $\\theta_0\\cos\\omega_0t$', { dash: true }]]);
        v.readout(() => {
          const s = sim(), lag = 360 * 4 * (1 - s.T0 / s.T);
          return `$T_0 = 2\\pi\\sqrt{L/g} = $ ${v.M.si(s.T0, 's', 4)} (small-angle model, $g = ${v.fix(s.g, 2)}$ m/s²) · true period (simulation) ${v.M.si(s.T, 's', 4)} $= ${v.fix(s.T / s.T0, 4)}\\,T_0$ · after four model swings the model is ahead by ${lag < 360 ? v.fix(lag, 1) + '°' : 'more than a whole swing'}${th0.value <= 10 ? ' — inside the small-angle regime' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Definition', name: 'State-space orbits of the oscillator',
      statement: String.raw`The **state** of a one-dimensional oscillator is the pair $(x, v)$ of position and velocity, and the **state space** (phase plane) is the set of all states. Newton’s law $\dot x = v$, $\dot v = -\omega^2 x$ is a vector field on it, and the motion starting from a state traces an **orbit** — by uniqueness exactly one through each state. For the harmonic oscillator the orbits are the origin (equilibrium) and the ellipses
$$\tfrac12 v^2 + \tfrac12\omega^2x^2 = E,$$
all traversed clockwise in the same time $2\pi/\omega$.`,
      idea: String.raw`Energy is conserved (mech-3.6), so each orbit stays on one level set of $E$, which for the oscillator (4.2) is an ellipse with semi-axes $\sqrt{2E}/\omega$ and $\sqrt{2E}$. The picture turns the qualitative question “what does the motion do?” into geometry, and it is the natural test for a numerical method: its discrete orbit should stay on (or near) the ellipse. Forward Euler multiplies $E$ by exactly $1+h^2\omega^2$ every step and spirals out; backward Euler divides by the same factor; leapfrog keeps every point exactly on the nearby ellipse $\tfrac12v^2+\tfrac12\omega^2(1-\tfrac14h^2\omega^2)x^2=\text{const}$, so its energy error stays bounded forever (until $h\omega>2$).`,
      caption: String.raw`**Drag the initial state.** The green dashed ellipse is the exact orbit; the blue polygon is the computed one over eight periods, and the right panel plots its energy on a log scale. Switch integrators and change the step: forward Euler spirals out, backward Euler spirals in, leapfrog stays on its slightly stretched ellipse (dashed blue), RK4 decays imperceptibly. Push $h\omega$ past 2 and even leapfrog blows up.`,
      deps: ['mech-4.2', 'mech-3.6'],
      refs: ['Taylor §12.7', 'Arnold §4'],
      tags: ['phase space', 'numerical integration'],
      viz(v) {
        const W = 1.5, NP = 8;
        const meth = v.select('integrator', [{ value: 'lf', label: 'leapfrog' }, { value: 'fe', label: 'forward Euler' }, { value: 'be', label: 'backward Euler' }, { value: 'rk', label: 'RK4' }], 'fe');
        const hs = v.slider('step $h\\,\\omega$', 0.02, 2.2, 0.15, { step: 0.01 });
        const sP = v.stage({ x: [-2.7, 2.7], y: [-3.7, 3.7], height: 360, axes: true, xlabel: 'x', ylabel: 'v', weight: 1.1 });
        const sE = v.stage({ x: [0, NP], y: [1e-3, 1e3], ylog: true, height: 360, axes: 'box', xlabel: 't / T', ylabel: 'E / E₀', weight: 1 });
        const h0 = sP.handle(1.1, 0.8, { color: 'accent', label: '(x₀, v₀)', labelPos: 'ne' });
        let R = null, key = '';
        function run() {
          const kk = `${meth.value}|${hs.value}|${h0.x}|${h0.y}`; if (kk === key) return R; key = kk;
          const h = hs.value / W, w2 = W * W, n = Math.ceil(NP * TAU / hs.value), M = meth.value;
          const E = (x, u) => 0.5 * u * u + 0.5 * w2 * x * x;
          let x = h0.x, u = h0.y; const pts = [[x, u]], en = [1], E0 = E(x, u) || 1e-12;
          const f = (t, y) => [y[1], -w2 * y[0]];
          for (let i = 0; i < n; i++) {
            if (M === 'fe') { const xn = x + h * u; u -= h * w2 * x; x = xn; }
            else if (M === 'be') { const d = 1 + h * h * w2, xn = (x + h * u) / d; u = (u - h * w2 * x) / d; x = xn; }
            else if (M === 'lf') { u -= 0.5 * h * w2 * x; x += h * u; u -= 0.5 * h * w2 * x; }
            else { [x, u] = rk4step(f, 0, [x, u], h); }
            if (!isFinite(x) || Math.abs(x) > 1e150) break;
            pts.push([x, u]); en.push(E(x, u) / E0);
          }
          const mod = (p) => 0.5 * p[1] * p[1] + 0.5 * w2 * (1 - h * h * w2 / 4) * p[0] * p[0];
          let dev = 0; if (M === 'lf') { const m0 = mod(pts[0]); for (const p of pts) dev = Math.max(dev, Math.abs(mod(p) / m0 - 1)); }
          return (R = { pts, en, h, n, E0, dev, perStep: hs.value / TAU });
        }
        const ellipse = (E, k = 1) => (a) => [Math.sqrt(2 * E / (W * W * k)) * Math.cos(a), Math.sqrt(2 * E) * Math.sin(a)];
        v.animate((t) => {
          const r = run(), hw = hs.value;
          sP.field((x, y) => [y, -W * W * x], { spacing: 36, color: 'faint' });
          for (const E of [0.4, 1.2, 2.4, 4]) sP.curve(ellipse(E), 0, TAU, { color: 'grid', width: 1 });
          sP.curve(ellipse(r.E0), 0, TAU, { color: 'green', dash: [6, 5], width: 1.8 });
          if (meth.value === 'lf' && hw < 2) { const k = 1 - hw * hw / 4, m0 = 0.5 * h0.y * h0.y + 0.5 * W * W * k * h0.x * h0.x; sP.curve(ellipse(m0, k), 0, TAU, { color: 'accent', dash: [3, 4], width: 1.3 }); }
          sP.path(r.pts, { color: 'accent', width: 1.3 });
          if (r.pts.length < 700) sP.dots(r.pts, { color: 'accent', r: 1.8 });
          const i = Math.min(r.pts.length - 1, Math.floor(t * TAU / hw) % (r.n + 1));
          sP.dot(r.pts[i][0], r.pts[i][1], { color: 'gold', r: 5.5 });
          // energy history
          let lo = Infinity, hi = 0; for (const e of r.en) if (e > 0 && isFinite(e)) { lo = Math.min(lo, e); hi = Math.max(hi, e); }
          if (hi / lo < 1.2) { const pd = Math.max(0.002, (hi / lo - 1) * 0.4); sE.setView(null, [lo / (1 + pd), hi * (1 + pd)]); }
          else sE.setView(null, [Math.max(1e-3, Math.min(0.5, lo / 2)), Math.min(1e3, Math.max(2, hi * 2))]);
          sE.hline(1, { color: 'green', dash: [6, 5], width: 1.3 });
          sE.path(r.en.map((e, j) => [j * r.perStep, e]), { color: 'accent', width: 2.6 });
          if (meth.value === 'fe' || meth.value === 'be') {
            const g = Math.log10(1 + hw * hw) * (meth.value === 'fe' ? 1 : -1);
            sE.fn((u) => 10 ** (g * u / r.perStep), { color: 'orange', dash: [5, 4], width: 1.6 });
          }
          if (i < r.en.length) sE.dot(i * r.perStep, r.en[i], { color: 'gold', r: 5 });
        });
        v.legend([['green', 'exact orbit (energy ellipse)', { dash: true }], ['accent', 'computed orbit'], ['orange', 'predicted $E_n = E_0(1\\pm h^2\\omega^2)^{\\pm n}$', { dash: true }]]);
        v.readout(() => {
          const r = run(), M = meth.value, hw = hs.value, Ef = r.en[r.en.length - 1];
          const after = `after ${NP} periods $E/E_0 = ${Math.abs(Math.log10(Ef)) > 3 ? v.sci(Ef, 3) : v.fix(Ef, 4)}$`;
          if (M === 'fe') return `forward Euler: every step multiplies $E$ by exactly $1+h^2\\omega^2 = ${v.fix(1 + hw * hw, 4)}$ — ${after}; the orbit spirals outward`;
          if (M === 'be') return `backward Euler: every step divides $E$ by $1+h^2\\omega^2 = ${v.fix(1 + hw * hw, 4)}$ — ${after}; artificial damping`;
          if (M === 'lf') return hw < 2 ? `leapfrog: ${after}; the energy wobbles but never drifts, because every computed point lies on the ellipse $\\tfrac12v^2+\\tfrac12\\omega^2(1-\\tfrac14h^2\\omega^2)x^2 = $ const (largest deviation $${v.sci(Math.max(r.dev, 1e-16), 1)}$)` : `leapfrog with $h\\omega = ${v.fix(hw, 2)} > 2$: the conserved quadratic form is no longer an ellipse, and the method is unstable — ${after}`;
          return `RK4: ${after} — a tiny decay, about $(h\\omega)^6/72$ per step, but not exactly conservative`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Model', name: 'Two-dimensional oscillator and Lissajous figures',
      statement: String.raw`A particle in the anisotropic harmonic potential $U = \tfrac12k_xx^2+\tfrac12k_yy^2$ moves independently in the two directions:
$$x = A\cos\omega_xt,\qquad y = B\cos(\omega_yt-\delta),\qquad \omega_{x,y}=\sqrt{k_{x,y}/m}.$$
If $\omega_y/\omega_x = p/q$ is rational (in lowest terms) the orbit is closed, with period $2\pi q/\omega_x = 2\pi p/\omega_y$ — a **Lissajous figure** (an ellipse when $p=q=1$). If the ratio is irrational the orbit never closes and comes arbitrarily close to every point of the rectangle $|x|\le A$, $|y|\le B$.`,
      scope: String.raw`Holds for exactly quadratic potentials with principal axes along $x$ and $y$; small anharmonic couplings make the figures precess and can exchange energy between the two directions.`,
      idea: String.raw`The force $(-k_xx,-k_yy)$ separates, so each coordinate is an independent harmonic oscillator (4.2). The motion returns to its initial state exactly when both phases $\omega_xt$ and $\omega_yt$ are multiples of $2\pi$ at once, which needs $\omega_y/\omega_x$ rational. Otherwise the point $(\omega_xt,\omega_yt)$ winds densely around the torus of the two phases (Kronecker’s theorem), and its image under the two cosines fills the rectangle.`,
      caption: String.raw`Pick a frequency ratio (or fine-tune it with the slider) and the phase $\delta$. Rational ratios close up into Lissajous figures, and the fraction of the rectangle visited (right) stops growing once the curve closes. Irrational ratios ($\varphi$, $\sqrt2$) never close: the curve keeps sweeping and the visited fraction climbs toward 1. A ratio *near* a simple fraction gives a figure that slowly rotates.`,
      deps: ['mech-4.2'],
      refs: ['Taylor §5.3', 'Arnold §5'],
      tags: ['harmonic oscillator', 'quasi-periodic motion'],
      credit: 'Nathaniel Bowditch, 1815; Jules Antoine Lissajous, 1857',
      viz(v) {
        const PRE = { '1': 1, '2': 2, '1.5': 1.5, '4/3': 4 / 3, phi: (1 + Math.sqrt(5)) / 2, sqrt2: Math.SQRT2 };
        let r = 1.5;
        const fine = v.slider('fine-tune $\\omega_y/\\omega_x$', 0.5, 3.2, 1.5, { step: 0.001, onChange: (x) => { r = x; } });
        const pre = v.select('ratio', [{ value: '1', label: '1:1' }, { value: '2', label: '2:1' }, { value: '1.5', label: '3:2' }, { value: '4/3', label: '4:3' }, { value: 'phi', label: 'golden $\\varphi$' }, { value: 'sqrt2', label: '$\\sqrt2$' }], '1.5', { onChange: (val) => { r = PRE[val]; fine.value = r; } });
        const dl = v.slider('phase $\\delta$', 0, 3.14, 0.5, { step: 0.01 });
        const NPER = 40, PER = 800, G = 50, N = NPER * PER;
        const s = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 360, axes: false, weight: 1 });
        const sc = v.stage({ x: [0.25, NPER], y: [0, 1], xlog: true, height: 360, axes: 'box', xlabel: 'time (x-periods)', ylabel: 'fraction of cells visited', weight: 1 });
        let D = null, key = '';
        function data() {
          const kk = `${r}|${dl.value}`; if (kk === key) return D; key = kk;
          const xs = new Float32Array(N + 1), ys = new Float32Array(N + 1), cov = new Uint16Array(N + 1), seen = new Uint8Array(G * G);
          const cell = (u) => Math.min(G - 1, Math.max(0, Math.floor((u + 1) / 2 * G)));
          let c = 0;
          for (let i = 0; i <= N; i++) {
            const tau = i / PER, x = Math.cos(TAU * tau), y = Math.cos(TAU * r * tau - dl.value);
            xs[i] = x; ys[i] = y; const k = cell(x) * G + cell(y); if (!seen[k]) { seen[k] = 1; c++; } cov[i] = c;
          }
          let frac = null; for (let q = 1; q <= 40 && !frac; q++) { const p = Math.round(r * q); if (p > 0 && Math.abs(r - p / q) < 1e-9) frac = [p, q]; }
          let near = null; if (!frac) for (let q = 1; q <= 4 && !near; q++) { const p = Math.round(r * q); if (p > 0 && Math.abs(r - p / q) < 0.01) near = [p, q]; }
          return (D = { xs, ys, cov, frac, near });
        }
        v.animate((t) => {
          const d = data(), tau = (3 * t) % NPER, i = Math.min(N, Math.floor(tau * PER));
          s.rect(-1, -1, 1, 1, { color: 'muted', dash: [4, 4], width: 1 });
          s.line(-1.12, 0, 1.12, 0, { color: 'faint', width: 1 }); s.line(0, -1.12, 0, 1.12, { color: 'faint', width: 1 });
          const pts = new Array(i + 1); for (let j = 0; j <= i; j++) pts[j] = [d.xs[j], d.ys[j]];
          s.path(pts, { color: 'accent', width: 1.3, alpha: 0.85 });
          const x = d.xs[i], y = d.ys[i];
          s.line(x, y, x, 1.1, { color: 'orange', dash: [2, 3], width: 1 }); s.line(x, y, 1.1, y, { color: 'purple', dash: [2, 3], width: 1 });
          s.dot(x, 1.1, { color: 'orange', r: 4 }); s.dot(1.1, y, { color: 'purple', r: 4 });
          s.dot(x, y, { color: 'gold', r: 6 });
          s.text('x', x, 1.1, { color: 'orange', math: true, dx: 9 }); s.text('y', 1.1, y, { color: 'purple', math: true, dy: -12 });
          const cpts = []; for (let j = 160; j <= N; j += 20) cpts.push([j / PER, d.cov[j] / (G * G)]);
          sc.path(cpts, { color: 'accent', width: 1, alpha: 0.25 });
          sc.path(cpts.filter((p) => p[0] <= tau), { color: 'accent', width: 2.4 });
          if (tau >= 0.25) sc.dot(tau, d.cov[i] / (G * G), { color: 'gold', r: 5 });
          if (d.frac) { sc.vline(d.frac[1], { color: 'green', dash: [5, 4], width: 1.3 }); sc.text(`closes after ${d.frac[1]} period${d.frac[1] > 1 ? 's' : ''}`, d.frac[1], 0.06, { color: 'green', size: 11, dx: 6 }); }
        });
        v.legend([['accent', 'orbit so far'], ['orange', '$x$ oscillation', { dot: true }], ['purple', '$y$ oscillation', { dot: true }]]);
        v.readout((t) => {
          const d = data(), tau = (3 * t) % NPER, i = Math.min(N, Math.floor(tau * PER)), pc = v.fix(100 * d.cov[i] / (G * G), 0);
          if (d.frac) return `$\\omega_y/\\omega_x = ${d.frac[0]}/${d.frac[1]}$: the orbit closes after ${d.frac[1]} $x$-period${d.frac[1] > 1 ? 's' : ''} (${d.frac[0]} $y$-period${d.frac[0] > 1 ? 's' : ''}); it visits only ${v.fix(100 * d.cov[N] / (G * G), 0)} % of the $${G}\\times${G}$ cells, however long you wait`;
          const nearTxt = d.near ? ` It is close to ${d.near[0]}/${d.near[1]}, so the figure looks like a slowly rotating ${d.near[0]}:${d.near[1]} Lissajous curve.` : '';
          return `$\\omega_y/\\omega_x = ${v.fix(r, 6)}$ is not a fraction with a small denominator: the orbit has not closed after ${v.fix(tau, 1)} periods and has visited ${pc} % of the cells — and keeps filling the rectangle.${nearTxt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Model', name: 'Damped harmonic oscillator',
      statement: String.raw`A mass on a spring with a linear drag force $-b\dot x$ obeys $m\ddot x + b\dot x + kx = 0$, i.e.
$$\ddot x + 2\beta\dot x + \omega_0^2x = 0,\qquad \beta = \frac{b}{2m},\ \ \omega_0=\sqrt{k/m}.$$
Its solutions are combinations of $e^{\lambda_\pm t}$ with $\lambda_\pm = -\beta\pm\sqrt{\beta^2-\omega_0^2}$:
- **underdamped** ($\beta<\omega_0$): $x = Ae^{-\beta t}\cos(\omega_1t-\varphi)$ with $\omega_1=\sqrt{\omega_0^2-\beta^2}$;
- **critically damped** ($\beta=\omega_0$): $x = (c_1+c_2t)e^{-\beta t}$;
- **overdamped** ($\beta>\omega_0$): $x = c_1e^{\lambda_+t}+c_2e^{\lambda_-t}$, both exponents negative.

The energy decreases at the rate $\dot E = -b\dot x^2\le0$.`,
      scope: String.raw`Linear (viscous) damping is a good model for slow motion through a fluid, dashpots and eddy-current brakes; dry (Coulomb) friction instead gives an amplitude that falls linearly and stops dead, and fast motion through air gives quadratic drag.`,
      idea: String.raw`The trial solution $e^{\lambda t}$ turns the differential equation into the characteristic equation $\lambda^2+2\beta\lambda+\omega_0^2=0$, whose two roots have product $\omega_0^2$ and sum $-2\beta$. While $\beta<\omega_0$ they are complex conjugates on the circle $|\lambda|=\omega_0$, giving oscillation at $\omega_1=\mathrm{Im}\,\lambda$ inside an envelope $e^{-\beta t}$. At $\beta=\omega_0$ they collide on the real axis (a double root, hence the factor $t$), and beyond it they separate along the axis, one toward $0$ — the slow creeping return. The drag force is the linear air resistance of mech-1.12 added to the oscillator 4.2.`,
      caption: String.raw`Slide the damping. Left: the two characteristic roots $\lambda_\pm/\omega_0$ in the complex plane — they slide around the unit circle, collide at $-1$ when $\beta=\omega_0$ and split along the real axis. Right: $x(t)$ integrated numerically (blue) on top of the closed form (dashed), with the envelope $\pm e^{-\beta t}$. Push $\beta$ below zero: the roots cross into the right half-plane and the motion grows instead of dying.`,
      deps: ['mech-4.2', 'mech-1.12'],
      refs: ['Taylor §5.4'],
      tags: ['damping', 'characteristic equation'],
      viz(v) {
        const w0 = TAU;
        const z = v.slider('damping $\\beta/\\omega_0$', -0.2, 2.5, 0.2, { step: 0.01 });
        const ic = v.select('start', [{ value: 'rest', label: 'released from rest' }, { value: 'kick', label: 'kicked at $x=0$' }], 'rest');
        const sL = v.stage({ x: [-5, 0.9], y: [-1.6, 1.6], equal: true, height: 310, axes: true, xlabel: 'Re λ/ω₀', ylabel: 'Im λ/ω₀', weight: 1 });
        const sX = v.stage({ x: [0, 4], y: [-1.3, 1.3], height: 310, axes: true, xlabel: 't (s)', ylabel: 'x', weight: 1.2 });
        let S = null, key = '';
        function sim() {
          const kk = `${z.value}|${ic.value}`; if (kk === key) return S; key = kk;
          const b = z.value * w0, [x0, v0] = ic.value === 'rest' ? [1, 0] : [0, w0];
          const r = rk4run((t, y) => [y[1], -2 * b * y[1] - w0 * w0 * y[0]], [x0, v0], 4, 2000);
          const X = dampedClosed(z.value, w0, x0, v0); let err = 0, mx = 0;
          for (let i = 0; i < r.t.length; i++) { err = Math.max(err, Math.abs(r.y[i][0] - X(r.t[i]))); mx = Math.max(mx, Math.abs(r.y[i][0])); }
          const e1 = r.y[500], E1 = (e1[1] ** 2 + w0 * w0 * e1[0] ** 2) / (v0 ** 2 + w0 * w0 * x0 ** 2);
          return (S = { r, X, err, mx, x0, v0, b, E1 });
        }
        v.render(() => {
          const s = sim(), zz = z.value;
          // λ-plane
          sL.rect(-6, -3, 0, 3, { fill: 'green', fillAlpha: 0.05, stroke: false }); sL.rect(0, -3, 2, 3, { fill: 'red', fillAlpha: 0.07, stroke: false });
          sL.circle(0, 0, 1, { color: 'muted', dash: [4, 4], width: 1 });
          sL.curve((a) => [Math.cos(a), Math.sin(a)], Math.PI / 2 - 0.2, 3 * Math.PI / 2 + 0.2, { color: 'accent', width: 5, alpha: 0.12 });
          sL.line(-1, 0, -5.2, 0, { color: 'accent', width: 5, alpha: 0.12 });
          sL.text('decay', -4.6, 1.35, { color: 'green', size: 11 }); sL.text('growth', 0.12, 1.35, { color: 'red', size: 11 });
          let roots;
          if (zz < 1) { const im = Math.sqrt(1 - zz * zz); roots = [[-zz, im], [-zz, -im]]; sL.line(-zz, -im, -zz, im, { color: 'orange', dash: [3, 3], width: 1.2 }); }
          else { const sq = Math.sqrt(zz * zz - 1); roots = [[-zz + sq, 0], [-zz - sq, 0]]; }
          const col = zz < 0 ? 'red' : 'accent';
          sL.dot(roots[0][0], roots[0][1], { color: col, r: 6.5 }); sL.dot(roots[1][0], roots[1][1], { color: col, r: 6.5 });
          sL.tex('\\lambda_+', roots[0][0], roots[0][1], { color: col, dx: 14, dy: zz < 1 ? -12 : -14, size: 14 });
          sL.tex('\\lambda_-', roots[1][0], roots[1][1], { color: col, dx: zz < 1 ? 14 : -4, dy: zz < 1 ? 12 : 16, size: 14 });
          const reg = zz < 0 ? ['negative damping: growth', 'red'] : zz < 0.995 ? ['underdamped', 'accent'] : zz <= 1.005 ? ['critically damped', 'green'] : ['overdamped', 'purple'];
          sL.corner(reg[0], 'tl', { color: reg[1], weight: 600 });
          // x(t)
          const yl = Math.max(1.3, 1.12 * s.mx); sX.setView(null, [-yl, yl]);
          if (zz < 1) { const w1 = w0 * Math.sqrt(1 - zz * zz), A = Math.hypot(s.x0, (s.v0 + s.b * s.x0) / w1); for (const sg of [1, -1]) sX.fn((t) => sg * A * Math.exp(-s.b * t), { color: 'orange', dash: [4, 4], width: 1.2 }); }
          sX.path(s.r.y.map((y, i) => [s.r.t[i], y[0]]), { color: 'accent', width: 2.6 });
          sX.fn(s.X, { color: 'ink', dash: [5, 5], width: 1.1 });
        });
        v.legend([['accent', 'RK4 integration'], ['ink', 'closed form', { dash: true }], ['orange', 'envelope $\\pm Ae^{-\\beta t}$', { dash: true }]]);
        v.readout(() => {
          const s = sim(), zz = z.value, b = zz * w0;
          const lam = zz < 1 ? `${v.fix(-b, 2)} \\pm ${v.fix(w0 * Math.sqrt(1 - zz * zz), 2)}\\,i` : `${v.fix(-b + w0 * Math.sqrt(zz * zz - 1), 2)},\\ ${v.fix(-b - w0 * Math.sqrt(zz * zz - 1), 2)}`;
          return `$\\omega_0 = 2\\pi$ rad/s · $\\lambda_\\pm = ${lam}$ s⁻¹ · RK4 vs closed form: max difference $${v.sci(s.err, 1)}$ · energy left after 1 s: ${v.fix(100 * s.E1, s.E1 < 0.01 ? 4 : 1)} %${zz < 0 ? ' — negative damping feeds energy in (the roots have positive real part)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Proposition', name: 'Critical damping is the fastest return',
      statement: String.raw`For $\ddot x+2\beta\dot x+\omega_0^2x=0$ with $\omega_0$ fixed, every solution decays at least as fast as $e^{-\sigma(\beta)t}$ (up to a factor $t$ at $\beta=\omega_0$), and generic solutions exactly that fast, where
$$\sigma(\beta) = \min_\pm\big(-\mathrm{Re}\,\lambda_\pm\big) = \begin{cases}\beta, & \beta\le\omega_0,\\ \beta-\sqrt{\beta^2-\omega_0^2}, & \beta\ge\omega_0.\end{cases}$$
The asymptotic decay rate $\sigma$ is maximal, equal to $\omega_0$, exactly at critical damping $\beta=\omega_0$. (For a particular start and a finite tolerance band, a slightly underdamped system can settle sooner — see the second panel.)`,
      idea: String.raw`From 4.7: below critical damping both roots have real part $-\beta$, so the decay rate grows with $\beta$. Above it the slow root is $-\beta+\sqrt{\beta^2-\omega_0^2} = -\omega_0^2/(\beta+\sqrt{\beta^2-\omega_0^2})$, which tends to $0$ like $-\omega_0^2/2\beta$: heavy damping makes the return a slow creep. The two branches meet with a corner at $\beta=\omega_0$, the unique maximum. Settling into a band $\pm\varepsilon$ is a different question: an underdamped system overshoots slightly, but if the overshoot stays inside the band it is already “settled”, which favours $\beta$ a little below $\omega_0$.`,
      caption: String.raw`Left: $|x(t)|$ on a log scale for an underdamped (orange), a critically damped (green) and an overdamped (purple) oscillator, all released from rest, with your choice of $\beta$ in blue — the slope of the tail is the decay rate (dips are zero crossings). Right: the decay rate $\sigma(\beta)$, with the rate measured from the simulated tail as a hollow dot; it peaks at $\beta=\omega_0$. Switch the right panel to **settling time** to see the honest caveat.`,
      deps: ['mech-4.7'],
      refs: ['Taylor §5.4'],
      tags: ['damping', 'optimization'],
      viz(v) {
        const w0 = TAU;
        const z = v.slider('damping $\\beta/\\omega_0$', 0.05, 3, 0.6, { step: 0.01 });
        const mode = v.select('right panel', [{ value: 'rate', label: 'decay rate' }, { value: 'settle', label: 'settling time (±2 %)' }], 'rate');
        const sL = v.stage({ x: [0, 3], y: [1e-8, 3], ylog: true, height: 330, axes: 'box', xlabel: 't (s)', weight: 1.1, title: '$|x(t)|$ on a log scale, released from rest' });
        const sR = v.stage({ x: [0, 3.08], y: [0, 1.15], height: 330, axes: 'box', xlabel: 'β/ω₀', weight: 1, title: ' ' });
        const sigma = (zz) => (zz <= 1 ? zz : zz - Math.sqrt(zz * zz - 1));
        const absPath = (zz) => { const r = rk4run((t, y) => [y[1], -2 * zz * w0 * y[1] - w0 * w0 * y[0]], [1, 0], 3, 3000); return r.y.map((y, i) => [r.t[i], Math.abs(y[0])]); };
        const REF = [[0.25, 'orange'], [1, 'green'], [3, 'purple']].map(([zz, c]) => ({ zz, c, pts: absPath(zz) }));
        let U = null, key = '', ST = null;
        function measured(zz) { // decay rate fitted to the simulated tail: ratio of maxima over windows one half-period long
          const P = zz < 1 ? Math.PI / (w0 * Math.sqrt(1 - zz * zz)) : 1;
          const t1 = 30, nW = Math.max(1, Math.round(20 / P)), t2 = t1 + nW * P, tEnd = t2 + P, n = Math.ceil(tEnd / 0.002);
          let y = [1, 0], m1 = 0, m2 = 0; const h = tEnd / n, f = (t, y) => [y[1], -2 * zz * w0 * y[1] - w0 * w0 * y[0]];
          for (let i = 1; i <= n; i++) { y = rk4step(f, 0, y, h); const t = i * h, a = Math.abs(y[0]); if (t >= t1 && t <= t1 + P) m1 = Math.max(m1, a); if (t >= t2 && t <= t2 + P) m2 = Math.max(m2, a); }
          return Math.log(m1 / m2) / (t2 - t1) / w0;
        }
        function user() {
          if (key === String(z.value)) return U; key = String(z.value);
          return (U = { pts: absPath(z.value), sm: measured(z.value) });
        }
        function settleCurve() { // last time |x| > 2 % for a release from rest, from the closed form
          if (ST) return ST;
          const out = [];
          for (let j = 0; j <= 300; j++) {
            const zz = 0.05 + 2.95 * j / 300, X = dampedClosed(zz, w0, 1, 0), sg = sigma(zz) * w0;
            const amp = zz < 1 ? 1 / Math.sqrt(1 - zz * zz) : zz > 1.0001 ? 2 * zz / Math.sqrt(zz * zz - 1) : 1;
            let t = Math.log(50 * amp * (zz > 0.99 && zz < 1.01 ? 40 : 1)) / sg + 0.3;
            while (t > 0 && Math.abs(X(t)) <= 0.02) t -= 0.0005;
            out.push([zz, t]);
          }
          let best = out[0]; for (const p of out) if (p[1] < best[1]) best = p;
          return (ST = { out, best });
        }
        v.render(() => {
          const u = user(), zz = z.value;
          for (const R of REF) sL.path(R.pts, { color: R.c, width: 1.6, alpha: 0.85 });
          sL.path(u.pts, { color: 'accent', width: 2.8 });
          if (mode.value === 'rate') {
            sR.setView(null, [0, 1.15]); sR.setTitle('asymptotic decay rate $\\sigma(\\beta)/\\omega_0$');
            sR.vline(1, { color: 'green', dash: [5, 4], width: 1.2 });
            sR.text('critical', 1, 1.1, { color: 'green', size: 11, dx: 5 });
            sR.fn(sigma, { domain: [0, 3], color: 'ink', width: 2.2 });
            for (const R of REF) sR.dot(R.zz, sigma(R.zz), { color: R.c, r: 4.5 });
            sR.dot(zz, u.sm, { color: 'gold', hollow: true, r: 10, width: 2.2 });
            sR.dot(zz, sigma(zz), { color: 'accent', r: 5 });
          } else {
            const S = settleCurve();
            sR.setView(null, [0, 3]); sR.setTitle('time to stay within $\\pm2\\%$, released from rest (s)');
            sR.vline(1, { color: 'green', dash: [5, 4], width: 1.2 });
            sR.path(S.out, { color: 'ink', width: 2 });
            sR.dot(S.best[0], S.best[1], { color: 'green', r: 5.5, label: `min at β = ${v.fix(S.best[0], 2)} ω₀`, labelPos: 'se' });
            const me = S.out[Math.round((zz - 0.05) / 2.95 * 300)];
            sR.dot(me[0], me[1], { color: 'accent', r: 6.5 });
          }
        });
        v.legend([['orange', '$\\beta = 0.25\\,\\omega_0$'], ['green', '$\\beta=\\omega_0$ (critical)'], ['purple', '$\\beta = 3\\,\\omega_0$'], ['accent', 'your $\\beta$']]);
        v.readout(() => {
          const u = user(), zz = z.value;
          if (mode.value === 'rate') return `$\\beta = ${v.fix(zz, 2)}\\,\\omega_0$: predicted $\\sigma = ${v.fix(sigma(zz), 4)}\\,\\omega_0$, measured from the simulated tail (30–50 s) $${v.fix(u.sm, 4)}\\,\\omega_0$ · the largest possible rate, $\\sigma=\\omega_0$, occurs only at $\\beta=\\omega_0$; heavier damping is *slower* (at $3\\omega_0$ only $${v.fix(sigma(3), 3)}\\,\\omega_0$)`;
          const S = settleCurve(), me = S.out[Math.round((zz - 0.05) / 2.95 * 300)], cr = S.out[Math.round(0.95 / 2.95 * 300)];
          return `settling into $\\pm2\\%$: ${v.fix(me[1], 3)} s at your $\\beta$, ${v.fix(cr[1], 3)} s at critical damping, and the minimum ${v.fix(S.best[1], 3)} s at $\\beta = ${v.fix(S.best[0], 2)}\\,\\omega_0$ — slightly underdamped: the small overshoot stays inside the band. That is why meters and suspensions are often tuned a little below critical.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Model', name: 'Driven damped oscillator',
      statement: String.raw`A damped oscillator driven by a sinusoidal force obeys
$$\ddot x+2\beta\dot x+\omega_0^2x = f_0\cos\omega t\qquad (f_0 = F_0/m).$$
Every solution is the sum $x = x_{\rm tr}+x_{\rm ss}$ of the **steady state**
$$x_{\rm ss} = A\cos(\omega t-\delta),\qquad A = \frac{f_0}{\sqrt{(\omega_0^2-\omega^2)^2+4\beta^2\omega^2}},\qquad \tan\delta = \frac{2\beta\omega}{\omega_0^2-\omega^2},$$
which oscillates at the driving frequency and lags it by $\delta\in(0,\pi)$, and a **transient** $x_{\rm tr}$, a free damped motion (4.7) fixed by the initial conditions, which dies out like $e^{-\beta t}$. After a few multiples of $1/\beta$ the motion forgets how it started.`,
      scope: String.raw`Holds for a linear spring and linear damping ($\beta>0$). With $\beta=0$ the transient never dies, and at $\omega=\omega_0$ there is no bounded steady state at all.`,
      idea: String.raw`The equation is linear, so the difference of two solutions solves the undriven equation of 4.7: once one particular solution is known, all others are it plus a transient. A particular solution comes from the complex trial $z = Ce^{i\omega t}$: substituting gives $C(\omega_0^2-\omega^2+2i\beta\omega) = f_0$, so $C = Ae^{-i\delta}$ with the amplitude and lag above, and $x_{\rm ss}=\mathrm{Re}\,z$. The initial position and velocity then fix the two constants of the transient.`,
      caption: String.raw`The drive switches on at $t=0$ with the oscillator at rest (or displaced). Black: direct numerical integration. Toggle the **steady state** (blue dashed) and the **transient** (orange); their sum (green dotted) lies exactly on the simulation. Lower left: the complex amplitude $Ae^{-i\delta}$ against the drive. Lower right: the size of the transient, measured from the simulation, falls on the line $e^{-\beta t}$. Drive near $\omega_0$ with little damping and watch the transient beat against the steady state.`,
      deps: ['mech-4.7'],
      refs: ['Taylor §5.5'],
      tags: ['driven oscillator', 'superposition'],
      viz(v) {
        const w0 = TAU, TW = 20;
        const wr = v.slider('drive $\\omega/\\omega_0$', 0.2, 2.5, 0.85, { step: 0.005 });
        const zr = v.slider('damping $\\beta/\\omega_0$', 0.01, 0.5, 0.04, { log: true, decimals: 3 });
        const ic = v.select('start', [{ value: 'rest', label: 'at rest' }, { value: 'disp', label: 'displaced, $x_0 = 2$' }], 'rest');
        const tSS = v.toggle('steady state', true), tTR = v.toggle('transient', true);
        const sX = v.stage({ x: [0, TW], y: [-3, 3], height: 260, full: true, axes: true, xlabel: 't (s)', ylabel: 'x / (F₀/k)' });
        const sP = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 240, axes: false, weight: 0.8, title: 'complex amplitude' });
        const sE = v.stage({ x: [0, TW], y: [1e-8, 30], ylog: true, height: 240, axes: 'box', xlabel: 't (s)', weight: 1.2, title: 'size of the transient (simulation − steady state)' });
        let S = null, key = '';
        function sim() {
          const kk = `${wr.value}|${zr.value}|${ic.value}`; if (kk === key) return S; key = kk;
          const w = wr.value * w0, b = zr.value * w0, f0 = w0 * w0, { A, d } = steady(w, w0, b, f0);
          const x0 = ic.value === 'rest' ? 0 : 2, v0 = 0, n = Math.ceil(TW / (Math.min(1, TAU / w) / 400));
          const r = rk4run((t, y) => [y[1], f0 * Math.cos(w * t) - 2 * b * y[1] - w0 * w0 * y[0]], [x0, v0], TW, n);
          const ss = (t) => A * Math.cos(w * t - d), vss = (t) => -A * w * Math.sin(w * t - d);
          const tr = dampedClosed(zr.value, w0, x0 - ss(0), v0 - vss(0));
          const w1 = w0 * Math.sqrt(1 - zr.value ** 2);
          let err = 0, mx = 0; const env = [], fitT = [], fitY = [], floor = 3e-5 * Math.max(1, A);
          for (let i = 0; i < r.t.length; i++) {
            const t = r.t[i], x = r.y[i][0], u = r.y[i][1];
            err = Math.max(err, Math.abs(x - ss(t) - tr(t))); mx = Math.max(mx, Math.abs(x));
            const xt = x - ss(t), ut = u - vss(t), e = Math.hypot(xt, (ut + b * xt) / w1);
            if (i % 4 === 0) env.push([t, e]);
            if (t > 0.5 && e > floor) { fitT.push(t); fitY.push(Math.log(e)); }
          }
          const rate = fitT.length > 10 ? -v.M.linreg(fitT, fitY).slope : NaN;
          const C0 = Math.hypot(x0 - ss(0), (v0 - vss(0) + b * (x0 - ss(0))) / w1);
          return (S = { r, A, d, w, b, ss, tr, err, mx, env, rate, C0 });
        }
        v.render(() => {
          const s = sim(), yl = Math.max(1.2, 1.15 * s.mx);
          sX.setView(null, [-yl, yl]);
          sX.path(s.r.y.map((y, i) => [s.r.t[i], y[0]]), { color: 'ink', width: 2.6 });
          if (tSS.value) sX.fn(s.ss, { color: 'accent', dash: [6, 4], width: 1.8 });
          if (tTR.value) sX.fn(s.tr, { color: 'orange', width: 1.8 });
          if (tSS.value && tTR.value) sX.fn((t) => s.ss(t) + s.tr(t), { color: 'green', dash: [2, 4], width: 2 });
          // phasor diagram
          const R = 1.15 * Math.max(1, s.A), qx = s.A * Math.cos(s.d), qy = -s.A * Math.sin(s.d);
          const x0 = Math.min(0, qx) - 0.22 * R, x1 = Math.max(1, qx) + 0.22 * R, y0 = Math.min(0, qy) - 0.22 * R, y1 = 0.28 * R;
          sP.setView([x0, x1], [y0, y1]);
          sP.line(x0 - R, 0, x1 + R, 0, { color: 'faint', width: 1 }); sP.line(0, y0 - R, 0, y1 + R, { color: 'faint', width: 1 });
          sP.arrow(0, 0, 1, 0, { color: 'muted', width: 2.2 }); sP.text('drive F₀/k', 1, 0, { color: 'muted', size: 11, dy: -10, align: 'center' });
          const px = s.A * Math.cos(-s.d), py = s.A * Math.sin(-s.d);
          sP.curve((a) => [0.35 * R * Math.cos(a), 0.35 * R * Math.sin(a)], -s.d, 0, { color: 'orange', width: 1.6 });
          sP.tex('\\delta', 0.42 * R * Math.cos(-s.d / 2), 0.42 * R * Math.sin(-s.d / 2), { color: 'orange', size: 14 });
          sP.arrow(0, 0, px, py, { color: 'accent', width: 2.6 });
          sP.tex('Ae^{-i\\delta}', px / 2, py / 2, { color: 'accent', dx: py < -0.3 * R ? (px > 0 ? 26 : -26) : 0, dy: py < -0.3 * R ? 0 : 16, size: 13 });
          // transient size
          let lo = Infinity, hi = 0; for (const p of s.env) { if (p[1] > 0) lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
          sE.setView(null, [Math.max(1e-9, lo * 0.3), hi * 3]);
          sE.path(s.env, { color: 'ink', width: 3.2 });
          sE.fn((t) => s.C0 * Math.exp(-s.b * t), { color: 'orange', dash: [6, 4], width: 1.8 });
        });
        v.legend([['ink', 'numerical solution'], ['accent', 'steady state $x_{\\rm ss}$', { dash: true }], ['orange', 'transient $x_{\\rm tr}$ / its envelope $e^{-\\beta t}$'], ['green', '$x_{\\rm ss}+x_{\\rm tr}$', { dash: true }]]);
        v.readout(() => {
          const s = sim();
          return `steady state: $A = ${v.fix(s.A, 3)}\\,F_0/k$, lag $\\delta = ${v.fix(s.d * 180 / Math.PI, 1)}^\\circ$ · the transient decays at the measured rate $${v.fix(s.rate / w0, 4)}\\,\\omega_0$ (theory: $\\beta = ${v.fix(zr.value, 4)}\\,\\omega_0$) · $\\max|x_{\\rm sim}-(x_{\\rm tr}+x_{\\rm ss})| = ${v.sci(s.err, 1)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Phenomenon', name: 'Resonance',
      statement: String.raw`For the driven damped oscillator of 4.9 the steady-state amplitude
$$A(\omega) = \frac{f_0}{\sqrt{(\omega_0^2-\omega^2)^2+4\beta^2\omega^2}}$$
is largest at $\omega_R=\sqrt{\omega_0^2-2\beta^2}$ (when $\beta<\omega_0/\sqrt2$), where $A_{\max} = f_0/\big(2\beta\sqrt{\omega_0^2-\beta^2}\big)\approx f_0/(2\beta\omega_0)$ — far larger than the static response $f_0/\omega_0^2$ when the damping is light. The phase lag $\delta$ rises from $0$ (slow drive: in step) through **exactly $90^\circ$ at $\omega=\omega_0$** to $180^\circ$ (fast drive: opposite). As $\beta\to0$ the peak grows without bound.`,
      scope: String.raw`For a linear oscillator. Real resonators stop being linear at large amplitude: the peak bends and can jump (4.16), or something breaks. The formula describes the steady state, reached only after the transient has died out (a few $1/\beta$).`,
      idea: String.raw`In the amplitude formula only the term $(\omega_0^2-\omega^2)^2$ depends strongly on $\omega$ near $\omega_0$; it vanishes there, leaving the damping term alone to limit the response — hence $A_{\max}\approx f_0/(2\beta\omega_0)$. Minimizing the radicand in $\omega^2$ gives $\omega_R$. At $\omega=\omega_0$ the spring force and inertia cancel exactly, so the drive balances the friction force $-2\beta\dot x$ alone: it must be in phase with the velocity, a quarter cycle ahead of the displacement. In energy terms, the drive then does positive work during the whole cycle.`,
      caption: String.raw`**Drag the orange marker** along the frequency axis. The curves are the steady-state formulas; the gold dots are measured from long numerical runs, one per frequency. The little rig shows the support (driven) and the mass at the same scale: off resonance the mass barely moves or moves against the drive; at $\omega_0$ it swings far and lags by a quarter cycle. Lower the damping and the peak shoots up. **Listen** plays a drive tone sweeping from $220$ to $660$ Hz through a $440$ Hz oscillator with this damping.`,
      deps: ['mech-4.9'],
      refs: ['Taylor §5.6'],
      tags: ['resonance', 'driven oscillator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Resonance' },
      viz(v) {
        const w0 = TAU;
        const zr = v.slider('damping $\\beta/\\omega_0$', 0.02, 0.6, 0.1, { log: true, decimals: 3 });
        const sRig = v.stage({ x: [-2, 2], y: [-3.4, 5.2], height: 300, axes: false, weight: 0.42, minWidth: 150 });
        const sA = v.stage({ x: [0, 2.5], y: [0, 6], height: 300, axes: 'box', xlabel: 'ω/ω₀', ylabel: 'A / (F₀/k)', weight: 1.58 });
        const sD = v.stage({ x: [0, 2.5], y: [0, 180], height: 170, full: true, axes: 'box', xlabel: 'ω/ω₀', ylabel: 'δ (°)', yticks: [0, 45, 90, 135, 180] });
        const AW = (x, z) => steady(x, 1, z).A, DW = (x, z) => steady(x, 1, z).d * 180 / Math.PI;
        const hw = sA.handle(0.7, AW(0.7, 0.1), { color: 'orange', r: 8, constrain: (x) => { const xx = clamp(x, 0.03, 2.47); return [xx, AW(xx, zr.value)]; } });
        const meas = {};
        function measure(x, z) { // long RK4 run from rest, then lock-in on the last drive periods
          const k = `${x}|${z}`; if (meas[k]) return meas[k];
          // a whole number K of drive periods, m steps each, so the lock-in window is exactly the last 4 periods
          const w = x * w0, b = z * w0, Td = TAU / w, m = Math.max(50, Math.ceil(50 * Td)), hh = Td / m, K = Math.max(16, Math.ceil(9.5 / b / Td) + 4), n = K * m;
          const f = (t, y) => [y[1], w0 * w0 * Math.cos(w * t) - 2 * b * y[1] - w0 * w0 * y[0]];
          let y = [0, 0]; const ts = [], xs = [];
          for (let i = 0; i < n; i++) { y = rk4step(f, i * hh, y, hh); if (i + 1 >= n - 4 * m) { ts.push((i + 1) * hh); xs.push(y[0]); } }
          const L = lockIn(ts, xs, w, 4);
          return (meas[k] = { A: L.A, d: ((L.d * 180 / Math.PI) + 360) % 360 });
        }
        const GRID = [0.2, 0.4, 0.55, 0.7, 0.8, 0.88, 0.94, 0.97, 1, 1.03, 1.06, 1.12, 1.2, 1.35, 1.6, 1.9, 2.2];
        v.animate((t) => {
          const z = zr.value, x = hw.x, st = steady(x, 1, z), Amax = AW(Math.sqrt(Math.max(1e-6, 1 - 2 * z * z)), z);
          hw.y = st.A;
          sA.setView(null, [0, 1.15 * Math.max(Amax, 1.2)]);
          sA.vline(1, { color: 'muted', dash: [4, 4], width: 1 });
          if (z < 0.7) { const wR = Math.sqrt(1 - 2 * z * z); sA.vline(wR, { color: 'green', dash: [2, 3], width: 1.2 }); sA.tex('\\omega_R', wR, 1.08 * Amax, { color: 'green', size: 13, dx: -5, align: 'right' }); }
          sA.hline(1, { color: 'faint', dash: [3, 3], width: 1 }); sA.text('static response', 2.45, 1, { color: 'muted', size: 10.5, align: 'right', dy: -8 });
          sA.fn((u) => AW(u, z), { color: 'accent', width: 2.4, n: 800 });
          sD.hline(90, { color: 'muted', dash: [4, 4], width: 1 }); sD.vline(1, { color: 'muted', dash: [4, 4], width: 1 });
          sD.fn((u) => DW(u, z), { color: 'accent', width: 2.4 });
          for (const g of GRID) { const m = measure(g, z); sA.dot(g, m.A, { color: 'gold', r: 3.6 }); sD.dot(g, m.d, { color: 'gold', r: 3.6 }); }
          const mx = measure(x, z);
          sA.dot(x, mx.A, { color: 'gold', r: 6, hollow: true, width: 2.2 });
          sD.vline(x, { color: 'orange', width: 1.2, alpha: 0.6 }); sD.dot(x, st.d * 180 / Math.PI, { color: 'orange', r: 5.5 });
          // rig: support moves d(t) = cos ωt, the mass x(t) = A cos(ωt − δ), same scale
          const sc = Math.min(0.85, 2.0 / st.A), ph = x * w0 * t * 0.5, ys = 4.1 + sc * Math.cos(ph), ym = 0 + sc * st.A * Math.cos(ph - st.d);
          sRig.rect(-1.2, ys, 1.2, ys + 0.35, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.6 });
          sRig.path(springPts(0, ys, 0, ym + 0.55, 9, 0.38, 0.08), { color: 'ink', width: 1.5 });
          sRig.rect(-0.75, ym - 0.55, 0.75, ym + 0.55, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          sRig.line(-1.9, 4.27, 1.9, 4.27, { color: 'faint', dash: [3, 3], width: 1 }); sRig.line(-1.9, 0, 1.9, 0, { color: 'faint', dash: [3, 3], width: 1 });
          sRig.text('drive', 0, ys + 0.75, { color: 'orange', size: 11, align: 'center' }); sRig.text('mass', 0, ym - 0.95, { color: 'accent', size: 11, align: 'center' });
          sRig.corner(`× ${v.fix(sc, 2)} scale`, 'bl', { size: 10.5 });
        });
        v.legend([['accent', 'steady-state formula'], ['gold', 'measured from simulation', { dot: true }], ['orange', 'your drive frequency', { dot: true }]]);
        v.readout(() => {
          const z = zr.value, x = hw.x, st = steady(x, 1, z), mx = measure(x, z), m1 = measure(1, z);
          const wR = 1 - 2 * z * z > 0 ? Math.sqrt(1 - 2 * z * z) : NaN;
          return `$\\omega = ${v.fix(x, 3)}\\,\\omega_0$: amplitude $${v.fix(st.A, 3)}$ × static (simulated $${v.fix(mx.A, 3)}$), lag $${v.fix(st.d * 180 / Math.PI, 1)}^\\circ$ (simulated $${v.fix(mx.d, 1)}^\\circ$) · peak at $\\omega_R = \\sqrt{\\omega_0^2-2\\beta^2} = ${isFinite(wR) ? v.fix(wR, 4) : '—'}\\,\\omega_0$, height $${v.fix(isFinite(wR) ? AW(wR, z) : 1, 2)}$ · at $\\omega=\\omega_0$ the simulated lag is $${v.fix(m1.d, 2)}^\\circ$`;
        });
        v.soundButton('Listen: sweep 220 → 660 Hz through a 440 Hz oscillator', (snd) => {
          const sr = 44100, dur = 4.5, n = Math.floor(sr * dur), out = new Float32Array(n), W0 = TAU * 440, b = zr.value * W0, h = 1 / sr;
          let x = 0, u = 0, ph = 0;
          for (let i = 0; i < n; i++) { // semi-analytic RK2 per sample is plenty at 44.1 kHz (ω0 h = 0.063)
            const t = i * h, f = 220 + 440 * t / dur; ph += TAU * f * h;
            const F = W0 * W0 * Math.cos(ph), a1 = F - 2 * b * u - W0 * W0 * x, xm = x + 0.5 * h * u, um = u + 0.5 * h * a1;
            const a2 = F - 2 * b * um - W0 * W0 * xm; x += h * um; u += h * a2; out[i] = x;
          }
          snd.samples(fade(out, sr), sr, { gain: 0.7 });
        });
      },
    },
  ],
};
