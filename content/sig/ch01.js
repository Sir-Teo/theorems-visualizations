// Signals & Systems — Chapter 1: Signals

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
const SR = 44100;

/** Stem plot of [[n, x], …]: a thin line from the baseline to each value, capped with a dot (smaller when stems crowd). */
function stems(s, pts, st = {}) {
  const col = st.color || 'accent', base = st.base ?? 0;
  let r = st.r ?? 3.8;
  if (pts.length > 1) { const gap = Math.abs(s.X(pts[1][0]) - s.X(pts[0][0])); r = Math.min(r, Math.max(1.3, gap * 0.3)); }
  const w = st.width ?? (r < 2.4 ? 1 : 1.6);
  for (const [n, y] of pts) if (isFinite(y)) s.line(n, base, n, y, { color: col, width: w, alpha: st.alpha });
  for (const [n, y] of pts) if (isFinite(y)) s.dot(n, y, { r, color: col, alpha: st.alpha, ring: r >= 3 });
}

/**
 * A signal the reader redraws by dragging on stage s: N + 1 samples on [a, b], linear in between, 0 outside.
 * sig.f(t) evaluates it, sig.set(fn) resets it, sig.ver counts edits (for cache keys).
 */
function drawable(s, a, b, N, init, yr, enabled) {
  const ys = new Float64Array(N + 1), h = (b - a) / N;
  const sig = {
    ys, a, b, N, h, ver: 0,
    set(fn) { for (let i = 0; i <= N; i++) ys[i] = fn(a + i * h); sig.ver++; },
    f(t) { if (!(t >= a && t <= b)) return 0; const u = (t - a) / h, i = Math.min(N - 1, Math.floor(u)); return ys[i] + (ys[i + 1] - ys[i]) * (u - i); },
  };
  sig.set(init);
  let last = null;
  s.onDrag((x, y, ph) => {
    if (enabled && !enabled()) return;
    if (ph === 'end') { last = null; return; }
    const i = Math.max(0, Math.min(N, Math.round((x - a) / h))), yy = Math.max(yr[0], Math.min(yr[1], y));
    if (!last) ys[i] = yy;
    else {
      const [i0, y0] = last, lo = Math.min(i0, i), hi = Math.max(i0, i);
      for (let k = lo; k <= hi; k++) ys[k] = i === i0 ? yy : y0 + ((yy - y0) * (k - i0)) / (i - i0);
    }
    last = [i, yy]; sig.ver++;
  });
  return sig;
}

/** Short linear fade in and out (in place) so sample buffers start and stop without clicks. */
function fade(buf, sr, t = 0.02) {
  const n = Math.min(Math.floor(t * sr), buf.length >> 1);
  for (let i = 0; i < n; i++) { const g = i / n; buf[i] *= g; buf[buf.length - 1 - i] *= g; }
  return buf;
}

/**
 * A playhead that follows a sound for `dur` seconds and redraws the viz about 25 times a second
 * (sound only ever starts from a click, so the timer only runs after one). ph.t is the elapsed time, or null.
 */
function playhead(v) {
  let t0 = 0, dur = 0, id = 0;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; v.invalidate(); };
  v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d) {
      if (id) clearInterval(id);
      t0 = performance.now(); dur = d;
      id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 80) stop(); else v.invalidate(); }, 40);
      v.invalidate();
    },
    stop,
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
  };
}

/** "+ 1.5" / "− 0.5" for building formulas like x(2t + 1). */
const signed = (v, x, d = 2) => (x >= 0 ? `+${v.fix(x, d)}` : `-${v.fix(-x, d)}`);
/** Principal value of an angle in (−π, π]. */
const wrapPi = (w) => { const r = ((((w + Math.PI) % TAU) + TAU) % TAU) - Math.PI; return r === -Math.PI ? Math.PI : r; };

export default {
  collection: 'sig',
  chapter: 1,
  title: 'Signals',
  summary: String.raw`A signal is a function of time, either continuous or defined only at the integers, and much of the subject runs on a small vocabulary of operations on such functions (shifting, flipping, stretching, splitting into even and odd parts) and a small cast of special signals. Complex exponentials are the stars: their real and imaginary parts are the damped and steady sinusoids, and in discrete time they hide two surprises, frequencies that wrap around every $2\pi$ and sinusoids that never repeat. The unit impulse, made precise as a limit of narrowing pulses and then as a distribution, is the probe that will reveal everything about a linear system. Energy, power and an inner product turn signals into vectors and set up Fourier analysis as geometry.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Continuous-time and discrete-time signals',
      statement: String.raw`A **signal** is a function that carries information, usually as it varies in time. A **continuous-time** signal $x(t)$ is defined for every real $t$ (a microphone voltage, a temperature record); a **discrete-time** signal $x[n]$ is defined only at the integers $n\in\Z$, so it is a sequence (daily closing prices, the numbers stored in an audio file). Parentheses and square brackets keep the two kinds apart. Values may be real or complex.

The commonest way a discrete-time signal arises is **sampling** a continuous one every $T$ seconds:
$$x[n]=x(nT),\qquad n\in\Z,$$
at the sampling rate $f_s=1/T$. The sequence itself knows only the index $n$, which has no unit; the spacing $T$ is extra information. Between two integers $x[n]$ is not zero or small: it is simply not defined.`,
      idea: String.raw`The split runs through the whole subject. Continuous-time signals are acted on by integrals and differential equations, discrete-time ones by sums and difference equations, and every tool later on (convolution, Fourier series and transforms, the Laplace and z-transforms) comes in a matched pair. Sampling is the bridge, and whether the samples pin down the curve between them is a real question. The sampling theorem of chapter 7 answers it: yes, provided $f_s$ exceeds twice the highest frequency present. Below that rate the samples are consistent with a different, slower curve, and a converter that plays them back produces the wrong sound.`,
      caption: String.raw`Top: a waveform in continuous time (a synthetic vowel “ah” or a bird-like chirp) with its samples $x(nT)$ in gold. Bottom: the same numbers as a sequence $x[n]$ against the bare index $n$. Change the sampling rate $f_s$: the samples spread out or crowd together, and the same index $n$ now points at a different instant. Drag the purple handle under the bottom axis: at an integer you read a sample, between integers there is nothing to read. *Listen* compares $x(t)$ with what a simple converter plays when it holds each sample for $T$ seconds; lower $f_s$ until the held version sounds wrong.`,
      deps: [],
      refs: ['Oppenheim–Willsky §1.1', 'Lathi ch. 1'],
      tags: ['signals', 'sampling'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Discrete-time_and_continuous-time' },
      viz(v) {
        const M = v.M, WIN = 12e-3;
        // vowel "ah": harmonics of F0 through three formant resonances (a cascade source–filter model)
        const F0 = 180, FORM = [[730, 90], [1090, 110], [2440, 160]], parts = [];
        for (let k = 1; k * F0 < 4000; k++) {
          const f = k * F0; let H = v.cx(1, 0);
          for (const [Fi, Bi] of FORM) H = H.mul(v.cx(1 - (f / Fi) ** 2, (f * Bi) / (Fi * Fi)).inv());
          parts.push([f, H.abs(), H.arg()]);
        }
        const vowel0 = (t) => { let s = 0; for (const [f, a, p] of parts) s += a * Math.cos(TAU * f * t + p); return s; };
        let vmax = 0; for (let i = 0; i < 1200; i++) vmax = Math.max(vmax, Math.abs(vowel0(i / 1200 / F0)));
        const amax = Math.max(...parts.map((p) => p[1]));
        const vowelTop = Math.max(...parts.filter((p) => p[1] > 0.01 * amax).map((p) => p[0]));
        const FA = 250, FB = 2750;
        const chirp = (t) => (t <= 0 || t >= WIN ? 0 : Math.pow(Math.sin((Math.PI * t) / WIN), 0.6) * Math.sin(TAU * (FA * t + ((FB - FA) * t * t) / (2 * WIN))));
        const SIG = {
          vowel: { f: (t) => vowel0(t) / vmax, rep: (t) => vowel0(t) / vmax, dur: 1.2, top: vowelTop, what: 'harmonics above 1% of the strongest reach' },
          chirp: { f: chirp, rep: (t) => chirp(M.mod(t, 0.11)), dur: 0.77, top: FB, what: 'the chirp ends at' },
        };
        const which = v.select('signal', [{ value: 'vowel', label: 'vowel “ah”' }, { value: 'chirp', label: 'chirp' }], 'vowel');
        const fsS = v.slider('sampling rate $f_s$', 1000, 16000, 6000, { log: true, fmt: (x) => M.si(Math.round(x / 50) * 50, 'Hz', 3) });
        const hold = v.toggle('show the held (staircase) signal', false);
        const fsv = () => Math.round(fsS.value / 50) * 50;
        const synth = (f, dur, fsH) => {
          const n = Math.round(dur * SR), out = new Float32Array(n);
          for (let i = 0; i < n; i++) { const t = i / SR; out[i] = f(fsH ? Math.floor(t * fsH) / fsH : t); }
          return fade(out, SR);
        };
        v.soundButton('Listen: $x(t)$', (snd) => { const S = SIG[which.value]; snd.samples(synth(S.rep, S.dur, 0), SR, { gain: 0.5 }); });
        v.soundButton('Listen: samples, held', (snd) => { const S = SIG[which.value]; snd.samples(synth(S.rep, S.dur, fsv()), SR, { gain: 0.5 }); });
        const top = v.stage({ x: [-0.15, 12.15], y: [-1.32, 1.32], height: 215, axes: 'box', yticks: [-1, 0, 1], xlabel: 't (ms)', full: true, title: 'continuous time: $x(t)$ has a value at every instant $t$' });
        const bot = v.stage({ x: [-2, 74], y: [-1.48, 1.32], height: 210, axes: 'box', yticks: [-1, 0, 1], xlabel: 'n (sample index: no unit)', full: true, title: 'discrete time: $x[n]=x(nT)$ has a value only at the integers $n$' });
        const YH = -1.08;
        let Nnow = 72;
        const cur = bot.handle(9.4, YH, { color: 'purple', constrain: (x) => { let n = M.clamp(x, 0, Nnow); if (Math.abs(n - Math.round(n)) < 0.14) n = Math.round(n); return [n, YH]; } });
        v.render(() => {
          const S = SIG[which.value], f = S.f, F = fsv(), T = 1 / F, N = Math.floor(WIN * F + 1e-9);
          Nnow = N;
          const pad = Math.max(0.7, 0.025 * N);
          bot.setView([-pad, N + pad], null);
          if (cur.x > N) cur.x = N;
          const nC = cur.x, isInt = Number.isInteger(nC), tC = nC * T;
          // ---- continuous panel
          top.hline(0, { color: 'faint', width: 1 });
          top.fn((ms) => f(ms / 1e3), { color: 'accent', width: 2, n: 1800 });
          const pts = []; for (let n = 0; n <= N; n++) pts.push([n * T * 1e3, f(n * T)]);
          if (hold.value) {
            const st = []; pts.forEach(([x, y], i) => { const x1 = i < N ? pts[i + 1][0] : Math.min(12, x + T * 1e3); st.push([x, y], [x1, y]); });
            top.path(st, { color: 'orange', width: 1.8 });
          }
          stems(top, pts, { color: 'gold' });
          top.vline(tC * 1e3, { color: 'purple', dash: [4, 4], width: 1.3 });
          top.dot(tC * 1e3, f(tC), { color: 'purple', r: 5 });
          // ---- discrete panel
          bot.hline(0, { color: 'faint', width: 1 });
          stems(bot, pts.map(([, y], n) => [n, y]), { color: 'gold' });
          bot.vline(nC, { color: 'purple', dash: [4, 4], width: 1.3 });
          const al = nC < 0.12 * N ? 'left' : nC > 0.88 * N ? 'right' : 'center';
          if (isInt) {
            bot.dot(nC, f(nC * T), { r: 8, hollow: true, color: 'green', width: 2.2 });
            bot.text(`x[${nC}] = ${v.fix(f(nC * T), 3)}`, nC, 1.16, { align: al, color: 'green', size: 13, weight: 600 });
          } else {
            bot.dot(nC, 0, { r: 5, hollow: true, color: 'red', width: 2 });
            bot.text(`no sample at n = ${v.fix(nC, 2)}`, nC, 1.16, { align: al, color: 'red', size: 13, weight: 600 });
          }
        });
        v.legend([['accent', 'continuous-time signal $x(t)$'], ['gold', 'samples $x(nT)$ = sequence $x[n]$', { dot: true }], ['orange', 'held between samples (staircase)'], ['purple', 'the probe $n$ and the instant $t=nT$', { dot: true }]]);
        v.readout(() => {
          const S = SIG[which.value], F = fsv(), T = 1 / F, N = Math.floor(WIN * F + 1e-9), nC = cur.x;
          const head = `$f_s$ = ${M.si(F, 'Hz')}, so $T=1/f_s$ = ${M.si(T, 's')}: the 12 ms window holds ${N + 1} samples $x[0],\\dots,x[${N}]$`;
          const probe = Number.isInteger(nC)
            ? `probe $n=${nC}$: $x[${nC}]=x(${nC}T)$ = $x$(${v.fix(nC * T * 1e3, 3)} ms) = ${v.fix(S.f(nC * T), 3)}`
            : `probe $n$ = ${v.fix(nC, 2)} is not an integer: $x(nT)$ = $x$(${v.fix(nC * T * 1e3, 3)} ms) exists, but $x[${v.fix(nC, 2)}]$ is not defined`;
          const ok = F / 2 > S.top;
          return `${head} · ${probe} · ${S.what} ${M.si(S.top, 'Hz')}, half the sampling rate is ${M.si(F / 2, 'Hz')}: ${ok ? 'fine enough to rebuild the curve from its samples (chapter 7)' : '**too coarse**: the samples cannot follow the fastest wiggles, and the held playback sounds wrong'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Time shift, reversal and scaling',
      statement: String.raw`For a signal $x$ and real constants $a\ne0$ and $b$, the signal
$$y(t)=x(at+b)$$
is obtained from $x$ by a change of the time variable. Special cases: the **time shift** $x(t-t_0)$ delays $x$ by $t_0$ (it moves right when $t_0>0$); the **time reversal** $x(-t)$ mirrors it about $t=0$; the **time scaling** $x(at)$ with $a>0$ compresses it by the factor $a$ when $a>1$ and stretches it when $0<a<1$. In general the value $x$ takes at time $\tau$ appears in $y$ at
$$t=\frac{\tau-b}{a},$$
so $y$ is $x$ shifted left by $b$ and then compressed by $a$ (flipped as well if $a<0$), or equivalently compressed first and then shifted left by $b/a$. In discrete time $x[n-n_0]$ and $x[-n]$ work the same way, while $x[kn]$ for an integer $k\ge2$ keeps only every $k$-th sample.`,
      idea: String.raw`Everything follows from solving $at+b=\tau$ for $t$: each point of the graph of $x$ moves horizontally to $(\tau-b)/a$, and its height is unchanged. Doing the substitutions one at a time, $x(t)\to x(t+b)\to x(at+b)$, is a shift followed by a scaling; the other order needs the shift $b/a$, because $x(a(t+b/a))=x(at+b)$. The classic mistake is to scale and then shift by $b$, which lands on $x(at+ab)$, off by $b-b/a$. For a sound, scaling time by $a$ changes both duration and pitch by the factor $|a|$ (a tape played fast), a negative $a$ plays it backwards, and a shift only delays it.`,
      caption: String.raw`Draw any signal in the top panel (or keep the lopsided pulse). The green curve below is $x(at+b)$, computed directly. Press play to watch the gold copy get there in two steps along the chosen route: the points from $\tau=0$ (orange) and $\tau=1$ (purple) travel with it. Drag the two handles under the lower axis to say where $\tau=0$ and $\tau=1$ should land; $a$ and $b$ follow, and swapping them flips the signal. Pick the *wrong* route to see it miss. *Listen* uses the drawn shape as the loudness of a rising whistle and applies the same change of variable to the sound.`,
      deps: ['sig-1.1'],
      refs: ['Oppenheim–Willsky §1.2'],
      tags: ['time shift', 'time scaling'],
      viz(v) {
        const M = v.M, A0 = -1, B0 = 2.6, YH = -0.55;
        const pulse = (t) => (t >= 0 && t <= 1 ? 1 : t > 1 && t < 2 ? 2 - t : 0);
        const aS = v.slider('scale $a$', -3, 3, 2, { step: 0.05 });
        const bS = v.slider('shift $b$', -6, 6, 1, { step: 0.05 });
        const route = v.select('route', [{ value: 'shift', label: 'shift by $b$, then scale' }, { value: 'scale', label: 'scale, then shift by $b/a$' }, { value: 'wrong', label: 'scale, then shift by $b$ (wrong)' }], 'shift');
        const top = v.stage({ x: [-4, 4], y: [-0.45, 1.6], height: 185, axes: 'box', yticks: [0, 1], xlabel: 'τ (s)', full: true, title: 'the signal $x(\\tau)$: drag in this panel to redraw it' });
        const bot = v.stage({ x: [-4, 4], y: [-0.85, 1.6], height: 245, axes: 'box', yticks: [0, 1], xlabel: 't (s)', full: true, title: '$y(t)=x(at+b)$' });
        const sig = drawable(top, A0, B0, 360, pulse, [-0.4, 1.45]);
        v.button('Reset the pulse', () => sig.set(pulse));
        const h0 = bot.handle(-0.5, YH, { color: 'orange', label: '$\\tau=0$', constrain: 'x' });
        const h1 = bot.handle(0, YH, { color: 'purple', label: '$\\tau=1$', constrain: 'x' });
        const fromHandles = () => {
          let d = h1.x - h0.x; if (Math.abs(d) < 1 / 3) d = d < 0 ? -1 / 3 : 1 / 3;
          const a = M.clamp(1 / d, -3, 3); aS.set(a); bS.set(M.clamp(-a * h0.x, -6, 6));
        };
        h0.onDrag = fromHandles; h1.onDrag = fromHandles;
        // sound: the drawn shape is the envelope of a whistle whose pitch rises from 400 Hz at τ = 0 by an octave per 2 s
        const cyc = (tau) => ((400 * 2) / Math.LN2) * (Math.pow(2, tau / 2) - 1);
        const audio = (a, b) => {
          let i0 = 0, i1 = sig.N; while (i0 < sig.N && Math.abs(sig.ys[i0]) < 1e-3) i0++; while (i1 > 0 && Math.abs(sig.ys[i1]) < 1e-3) i1--;
          if (i1 <= i0 || Math.abs(a) < 0.025) return null;
          const ta = A0 + Math.max(0, i0 - 1) * sig.h, tb = A0 + Math.min(sig.N, i1 + 1) * sig.h;
          const t1 = (ta - b) / a, t2 = (tb - b) / a, lo = Math.min(t1, t2), dur = Math.min(6, Math.abs(t2 - t1));
          const n = Math.round(dur * SR), out = new Float32Array(n);
          for (let i = 0; i < n; i++) { const tau = a * (lo + i / SR) + b; out[i] = sig.f(tau) * Math.sin(TAU * cyc(tau)); }
          return fade(out, SR, 0.01);
        };
        v.soundButton('Listen: $x$', (snd) => { const b = audio(1, 0); if (b) snd.samples(b, SR, { gain: 0.5 }); });
        v.soundButton('Listen: $x(at+b)$', (snd) => { const b = audio(aS.value, bS.value); if (b) snd.samples(b, SR, { gain: 0.5 }); });
        let st = null;
        v.animate((tt) => {
          const a = aS.value, b = bS.value, deg = Math.abs(a) < 0.025, R = route.value;
          if (!deg && !h0.dragging && !h1.dragging) { h0.x = -b / a; h1.x = (1 - b) / a; }
          const inView = (x) => x > -4 && x < 4;
          h0.visible = !deg && inView(h0.x); h1.visible = !deg && inView(h1.x);
          h0.labelPos = h0.x <= h1.x ? 'w' : 'e'; h1.labelPos = h0.x <= h1.x ? 'e' : 'w';
          // ---- top: x(τ) with its two landmarks
          for (const S of [top, bot]) { S.hline(0, { color: 'faint', width: 1 }); S.vline(0, { color: 'faint', width: 1 }); }
          top.fn(sig.f, { color: 'accent', width: 2.6, n: 900 });
          top.dot(0, sig.f(0), { color: 'orange', r: 5.5 }); top.dot(1, sig.f(1), { color: 'purple', r: 5.5 });
          top.text('τ = 0', 0, -0.28, { align: 'center', color: 'orange', size: 12, weight: 600 });
          top.text('τ = 1', 1, -0.28, { align: 'center', color: 'purple', size: 12, weight: 600 });
          // ---- bottom
          bot.fn(sig.f, { color: 'muted', width: 1.2, dash: [4, 4], alpha: 0.7 });
          const y = (t) => sig.f(a * t + b);
          bot.fn(y, { color: 'green', width: 2.6, n: 1200 });
          let u1 = 1, u2 = 1, mism = 0;
          if (!deg) {
            u1 = M.ease((tt - 0.6) / 2.2); u2 = M.ease((tt - 3.6) / 2.2);
            const pos = (tau) => {
              if (R === 'shift') return (tau - b * u1) * (1 - u2 + u2 / a);
              const p1 = tau * (1 - u1 + u1 / a);
              return p1 - (R === 'scale' ? b / a : b) * u2;
            };
            if (R === 'wrong') for (let i = 0; i <= 600; i++) { const t = -4 + (8 * i) / 600; mism = Math.max(mism, Math.abs(sig.f(a * (t + b)) - y(t))); }
            const bad = R === 'wrong' && u2 > 0.999 && mism > 0.01;
            bot.clip(() => bot.curve((tau) => [pos(tau), sig.f(tau)], A0, B0, { color: bad ? 'red' : 'gold', width: 3.2, n: 900, alpha: 0.9 }));
            bot.dot(pos(0), sig.f(0), { color: 'orange', r: 5 }); bot.dot(pos(1), sig.f(1), { color: 'purple', r: 5 });
            for (const hd of [h0, h1]) if (hd.visible) bot.line(hd.x, YH, hd.x, sig.f(hd === h0 ? 0 : 1), { color: hd.color, dash: [3, 4], width: 1.2, alpha: 0.8 });
            const A = v.fix(a, 2), Bs = signed(v, b), Ba = signed(v, b / a);
            let msg;
            if (u1 < 1e-3) msg = 'start: $x(t)$';
            else if (u2 < 1e-3) msg = R === 'shift' ? `step 1, shift: $x(t${Bs})$` : `step 1, scale: $x(${A}t)$`;
            else if (R === 'shift') msg = `step 2, scale: $x(${A}t${Bs})$`;
            else if (R === 'scale') msg = `step 2, shift by $b/a$: $x(${A}(t${Ba}))=x(${A}t${Bs})$`;
            else msg = `step 2, shift by $b$: $x(${A}(t${Bs}))=x(${A}t${signed(v, a * b)})$` + (u2 > 0.999 && mism > 0.01 ? ' ✗' : '');
            bot.corner(msg, 'tl', { color: bad ? 'red' : 'ink', size: 13 });
          } else bot.corner(`$a=0$: every $t$ reads the same value $x(b)$ = ${v.fix(sig.f(b), 2)}`, 'tl', { color: 'red', size: 13 });
          st = { a, b, deg, mism };
        }, { period: 7.5, still: 7.2 });
        v.legend([['accent', 'drawn signal $x$'], ['green', '$y(t)=x(at+b)$, computed directly'], ['gold', 'a copy of $x$ on its way'], ['muted', '$x(t)$ for comparison', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, deg, mism } = st;
          if (deg) return `$a$ = 0 is not a time scaling: $x(0\\cdot t+b)=x(b)$ is a constant signal, so all the time structure is lost · move $a$ away from 0`;
          const k = Math.abs(a), semis = 12 * Math.log2(k);
          const speed = k > 1.0001 ? `compressed by ${v.fix(k, 2)} (the sound plays ${v.fix(k, 2)}× faster, ${v.fix(semis, 1)} semitones higher)` : k < 0.9999 ? `stretched by ${v.fix(1 / k, 2)} (the sound plays slower, ${v.fix(-semis, 1)} semitones lower)` : 'same speed';
          const rev = a < 0 ? ' · $a<0$: reversed in time (the sound plays backwards)' : '';
          const wrong = route.value === 'wrong' ? ` · scaling first and then shifting by $b$ gives $x(a(t+b))=x(at+ab)$, which sits $b-b/a$ = ${v.fix(b - b / a, 2)} too far left: largest mismatch ${v.fix(mism, 3)}` : '';
          return `$a$ = ${v.fix(a, 2)}, $b$ = ${v.fix(b, 2)}: the value $x$ had at time $\\tau$ appears at $t=(\\tau-b)/a$, so $\\tau=0\\mapsto t$ = ${v.fix(-b / a, 2)} and $\\tau=1\\mapsto t$ = ${v.fix((1 - b) / a, 2)} · ${speed}${rev}${wrong}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Even and odd parts of a signal',
      statement: String.raw`A signal is **even** if $x(-t)=x(t)$ for all $t$ (its graph is mirror-symmetric about $t=0$) and **odd** if $x(-t)=-x(t)$ (symmetric under a half-turn about the origin; then $x(0)=0$). Every signal splits uniquely as the sum of an even and an odd signal,
$$x(t)=x_e(t)+x_o(t),\qquad x_e(t)=\tfrac12\big[x(t)+x(-t)\big],\qquad x_o(t)=\tfrac12\big[x(t)-x(-t)\big].$$
The same formulas with $x[n]$ and $x[-n]$ split a discrete-time signal. The two parts are orthogonal: $\int x_e(t)\,x_o(t)\,dt=0$ whenever the integral exists, so the energy of $x$ is the sum of the energies of its parts.`,
      idea: String.raw`Replacing $t$ by $-t$ swaps $x(t)$ and $x(-t)$, which leaves their average unchanged and flips the sign of their half-difference, so $x_e$ is even and $x_o$ is odd, and they add up to $x$. Uniqueness: if $x=e+o$ with $e$ even and $o$ odd, then $x(-t)=e(t)-o(t)$, and adding and subtracting recovers the formulas. The product of an even and an odd function is odd, so its integral over a symmetric interval vanishes; expanding $\int (x_e+x_o)^2$ then gives $E_x=E_e+E_o$. The split is used constantly later: the Fourier transform of a real signal has an even real part and an odd imaginary part, coming from $x_e$ and $x_o$.`,
      caption: String.raw`Drag in the top panel to draw any signal, or pick a starting shape. The dashed grey curve is its mirror image $x(-t)$. At the probe time $t_0$ (drag the black handle along the curve) the purple midpoint of $x(t_0)$ and $x(-t_0)$ is the even part and the orange half-gap is the odd part. Below, the even part is symmetric about the dashed mirror line and the odd part about the origin; the green dotted curve in the top panel is their sum, which lies exactly on $x$. Try *already even* and watch the odd part vanish.`,
      deps: ['sig-1.2'],
      refs: ['Oppenheim–Willsky §1.2'],
      tags: ['symmetry', 'decomposition'],
      viz(v) {
        const M = v.M, L = 4, N = 400;
        const at0 = (t, x, mid) => (Math.abs(t) < 1e-9 ? mid : x);
        const PRE = {
          exp: { label: '$e^{-t}u(t)$', f: (t) => at0(t, t > 0 ? Math.exp(-t) : 0, 0.5) },
          step: { label: '$u(t)$', f: (t) => at0(t, t > 0 ? 1 : 0, 0.5) },
          lop: { label: 'lopsided', f: (t) => 1.15 * Math.exp(-((t - 1.1) ** 2) / 0.5) - 0.6 * Math.exp(-((t + 1.8) ** 2) / 0.16) + 0.35 * Math.exp(-((t + 0.35) ** 2) / 0.06) },
          even: { label: 'already even', f: (t) => Math.max(0, 1 - Math.abs(t) / 2.4) * (0.55 + 0.45 * Math.cos(3.2 * t)) },
        };
        let sig = null;
        v.select('start from', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'exp', { onChange: (k) => sig.set(PRE[k].f) });
        const top = v.stage({ x: [-4.3, 4.3], y: [-1.3, 1.68], height: 215, axes: true, full: true, title: '$x(t)$ (drag to draw) and its mirror image $x(-t)$' });
        const se = v.stage({ x: [-4.3, 4.3], y: [-1, 1], height: 185, axes: true, title: 'even part $x_e(t)=\\tfrac12[x(t)+x(-t)]$' });
        const so = v.stage({ x: [-4.3, 4.3], y: [-1, 1], height: 185, axes: true, title: 'odd part $x_o(t)=\\tfrac12[x(t)-x(-t)]$' });
        sig = drawable(top, -L, L, N, PRE.exp.f, [-1.2, 1.55]);
        const probe = top.handle(1.2, PRE.exp.f(1.2), { color: 'ink', r: 6, constrain: (x) => { const t = M.clamp(x, 0.1, 3.9); return [t, sig.f(t)]; } });
        let st = null;
        v.render(() => {
          const f = sig.f, xe = (t) => (f(t) + f(-t)) / 2, xo = (t) => (f(t) - f(-t)) / 2, t0 = probe.x, h = sig.h, ys = sig.ys;
          probe.y = f(t0);
          // energies on the symmetric grid (trapezoid); sample i mirrors sample N − i
          let Ex = 0, Ee = 0, Eo = 0, X = 0, rec = 0, m = 0.55;
          for (let i = 0; i <= N; i++) {
            const w = i === 0 || i === N ? h / 2 : h, a = ys[i], b = ys[N - i], e = (a + b) / 2, o = (a - b) / 2;
            Ex += w * a * a; Ee += w * e * e; Eo += w * o * o; X += w * e * o; rec = Math.max(rec, Math.abs(e + o - a)); m = Math.max(m, Math.abs(e), Math.abs(o));
          }
          se.setView(null, [-1.22 * m, 1.3 * m]); so.setView(null, [-1.22 * m, 1.3 * m]);
          // ---- top
          top.fn((t) => f(-t), { color: 'muted', width: 1.6, dash: [5, 4], n: 900 });
          top.fn(f, { color: 'accent', width: 2.6, n: 900 });
          top.fn((t) => xe(t) + xo(t), { color: 'green', width: 1.8, dash: [2, 5], n: 900 });
          const a = f(t0), b = f(-t0), mid = (a + b) / 2;
          top.line(-t0, b, t0, b, { color: 'muted', width: 1, dash: [2, 3] });
          top.dot(-t0, b, { color: 'muted', r: 4 });
          top.line(t0, mid, t0, a, { color: 'orange', width: 3.5 });
          top.line(t0, b, t0, mid, { color: 'orange', width: 3.5, alpha: 0.35 });
          top.dot(t0, b, { color: 'muted', r: 4.5 });
          top.dot(t0, mid, { color: 'purple', r: 5.5 });
          top.tex('t_0', t0, -1.12, { color: 'ink', size: 14 }); top.tex('-t_0', -t0, -1.12, { color: 'muted', size: 14 });
          // ---- even part
          se.vline(0, { color: 'purple', dash: [5, 4], width: 1.2, alpha: 0.7 });
          se.fn(xe, { color: 'purple', width: 2.6, n: 900 });
          se.line(-t0, xe(t0), t0, xe(t0), { color: 'purple', dash: [3, 4], width: 1.2 });
          se.dot(t0, xe(t0), { color: 'purple', r: 5 }); se.dot(-t0, xe(-t0), { color: 'purple', r: 5, hollow: true });
          // ---- odd part
          so.fn(xo, { color: 'orange', width: 2.6, n: 900 });
          so.line(-t0, xo(-t0), t0, xo(t0), { color: 'orange', dash: [3, 4], width: 1.2 });
          so.dot(0, 0, { r: 4, hollow: true, color: 'ink' });
          so.dot(t0, xo(t0), { color: 'orange', r: 5 }); so.dot(-t0, xo(-t0), { color: 'orange', r: 5, hollow: true });
          st = { t0, a, b, Ex, Ee, Eo, X, rec, oddMax: Math.max(...Array.from(ys, (y, i) => Math.abs(y - ys[N - i]) / 2)) };
        });
        v.legend([['accent', '$x(t)$'], ['muted', '$x(-t)$', { dash: true }], ['purple', 'even part $x_e$'], ['orange', 'odd part $x_o$'], ['green', '$x_e+x_o$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { t0, a, b, Ex, Ee, Eo, X, rec, oddMax } = st;
          return `at $t_0$ = ${v.fix(t0, 2)}: $x(t_0)$ = ${v.fix(a, 3)}, $x(-t_0)$ = ${v.fix(b, 3)}, so $x_e(t_0)$ = ${v.fix((a + b) / 2, 3)} (their average) and $x_o(t_0)$ = ${v.fix((a - b) / 2, 3)} (half their difference) · $\\max|x-(x_e+x_o)|$ = ${v.fix(rec, 4)} · energies on $[-4,4]$: $E_x$ = ${v.fix(Ex, 4)} = $E_e+E_o$ = ${v.fix(Ee, 4)} + ${v.fix(Eo, 4)}, because $\\int x_e x_o\\,dt$ = ${v.fix(Math.abs(X) < 5e-13 ? 0 : X, 4)}` + (oddMax < 1e-9 ? ' · the odd part is identically zero: $x$ is even' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Periodic signals and the fundamental period',
      statement: String.raw`A continuous-time signal is **periodic** with period $T>0$ if
$$x(t+T)=x(t)\quad\text{for all }t .$$
Then $2T,3T,\dots$ are periods too, and the smallest positive period, when there is one, is the **fundamental period** $T_0$ (a constant signal is periodic with no smallest period). The sinusoid $\cos(2\pi f t+\varphi)$ has $T_0=1/f$. A sum of two sinusoids with frequencies $f_1,f_2$ is periodic exactly when the ratio $f_2/f_1=p/q$ is rational: in lowest terms its fundamental period is $T_0=q/f_1=p/f_2$, the least common multiple of the two periods, and $1/T_0=\gcd(f_1,f_2)$. If $f_2/f_1$ is irrational (for instance $\sqrt2$) the sum never repeats exactly, although it comes arbitrarily close. A discrete-time signal is periodic with period $N\in\{1,2,\dots\}$ if $x[n+N]=x[n]$ for all $n$.`,
      idea: String.raw`A lag $T$ is a period of $\cos(2\pi f_1t)+\cos(2\pi f_2t)$ only if it is a period of each term (the two components are separated by frequency, so neither can compensate a slip of the other), that is, $T=q/f_1=p/f_2$ for whole numbers $p,q$; this forces $f_2/f_1=p/q$ to be rational, and the smallest such $T$ uses $p/q$ in lowest terms. Lags that are whole periods of the first tone, $T=q/f_1$, make the second tone slip by $q\,f_2/f_1$ cycles, and the sum repeats when that is a whole number. For $p/q$ the slip is a multiple of $1/q$, so it is either exactly $0$ or at least $1/q$. For $\sqrt2$ it is never $0$, but the continued-fraction convergents $7/5,\ 17/12,\ 41/29,\ 99/70,\dots$ make it ever smaller: near-repeats without a period.`,
      caption: String.raw`The top panel shows $x(t)=\cos(2\pi f_1t)+\cos(2\pi f_2t)$ with $f_1$ = 220 Hz (orange dashed: the copy $x(t+\tau)$, red: their difference). The bars show, for each lag $\tau=q/f_1$, how many cycles the second tone slips; a green dot means a slip of exactly zero, so $\tau$ is a period. Click a bar or use the slider to choose the lag. For $\sqrt2$, the equal-tempered tritone, the record-small slips (blue, labelled) shrink at $q=5,12,29,70$ but never reach zero. *Listen* plays the two tones together; with 56 : 55 you hear the 4 Hz beats whose period is the fundamental period.`,
      deps: ['sig-1.1'],
      see: ['mech-4.6'],
      refs: ['Oppenheim–Willsky §1.2'],
      tags: ['periodicity', 'sinusoids'],
      viz(v) {
        const M = v.M, F1 = 220, QMAX = 80, LO = 2e-4;
        const PRE = {
          fifth: { label: 'fifth 3 : 2', r: [3, 2], W: 30 },
          third: { label: 'major third 5 : 4', r: [5, 4], W: 45 },
          beats: { label: 'beats 56 : 55', r: [56, 55], W: 320 },
          just: { label: 'just tritone 45 : 32', r: [45, 32], W: 60 },
          et: { label: 'tempered tritone $\\sqrt2$', r: null, W: 60 },
        };
        const pre = v.select('ratio $f_2/f_1$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'fifth', { onChange: (k) => qS.set(PRE[k].r ? PRE[k].r[1] : 5) });
        const qS = v.slider('lag $\\tau=q/f_1$, $q$ =', 1, QMAX, 2, { int: true });
        v.soundButton('Listen', (snd) => snd.chord(F1, F1 * ratio(), { duration: 2.6, gain: 0.3 }));
        const ratio = () => { const P = PRE[pre.value]; return P.r ? P.r[0] / P.r[1] : Math.SQRT2; };
        /** slip of the second tone after q periods of the first, in cycles (exact for rational ratios) */
        const slip = (q) => { const P = PRE[pre.value]; if (P.r) { const [p, d] = P.r, m = (q * p) % d; return Math.min(m, d - m) / d; } const x = q * Math.SQRT2; return Math.abs(x - Math.round(x)); };
        const st = v.stage({ x: [0, 30], y: [-2.45, 2.45], height: 205, axes: 'box', yticks: [-2, -1, 0, 1, 2], xlabel: 't (ms)', full: true, title: '$x(t)=\\cos 2\\pi f_1t+\\cos 2\\pi f_2t$ and the shifted copy $x(t+\\tau)$' });
        const sb = v.stage({ x: [0.2, QMAX + 0.8], y: [LO, 0.9], ylog: true, height: 215, axes: 'box', xlabel: 'q (the lag in periods of the first tone)', ylabel: 'slip (cycles)', full: true, title: 'how far the second tone slips after the lag $q/f_1$: zero means a period' });
        sb.onClick((x) => qS.set(M.clamp(Math.round(x), 1, QMAX)));
        let info = null;
        v.render(() => {
          const P = PRE[pre.value], r = ratio(), f2 = F1 * r, q = qS.value, tau = q / F1;
          const x = (ms) => Math.cos((TAU * F1 * ms) / 1e3) + Math.cos((TAU * f2 * ms) / 1e3);
          const xs = (ms) => x(ms + tau * 1e3);
          st.setView([0, P.W], null);
          st.hline(0, { color: 'faint', width: 1 });
          st.between(x, xs, 0, P.W, { fill: 'red', fillAlpha: 0.28, n: 2400 });
          st.fn(x, { color: 'accent', width: 2, n: 2400 });
          st.fn(xs, { color: 'orange', width: 1.6, dash: [5, 4], n: 2400 });
          let mx = 0; for (let i = 0; i <= 4000; i++) { const t = (P.W * i) / 4000; mx = Math.max(mx, Math.abs(xs(t) - x(t))); }
          // ---- slip bars
          let best = 1, firstZero = null; const records = [];
          for (let k = 1; k <= QMAX; k++) {
            const e = slip(k), sel = k === q;
            if (e === 0 || e < 1e-12) {
              if (firstZero == null) firstZero = k;
              sb.line(k, LO, k, LO * 1.6, { color: sel ? 'gold' : 'green', width: 3 });
              sb.dot(k, LO * 1.75, { color: sel ? 'gold' : 'green', r: sel ? 6 : 4.5 });
              continue;
            }
            const rec = e < best - 1e-12; if (rec) { best = e; records.push(k); }
            sb.rect(k - 0.36, LO, k + 0.36, e, { fill: sel ? 'gold' : rec && !P.r ? 'accent' : 'muted', fillAlpha: sel ? 0.95 : rec && !P.r ? 0.75 : 0.45, stroke: false });
          }
          if (!P.r) for (const k of records) if (k > 1) sb.text(String(k), k, slip(k), { dy: -9, align: 'center', color: 'accent', size: 11.5, weight: 600 });
          if (firstZero) sb.text(`0 (exact) at q = ${firstZero}`, firstZero, LO * 3.2, { align: firstZero > 60 ? 'right' : 'left', dx: firstZero > 60 ? -8 : 8, color: 'green', size: 12, weight: 600 });
          info = { r, f2, q, tau, mx, e: slip(q), firstZero, best, bestAt: records[records.length - 1] };
        });
        v.legend([['accent', '$x(t)$'], ['orange', '$x(t+\\tau)$', { dash: true }], ['red', 'difference', { area: true }], ['green', 'zero slip: a period', { dot: true }], ['gold', 'chosen lag', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const P = PRE[pre.value], { f2, q, tau, mx, e, firstZero, best, bestAt } = info;
          const head = `$f_1$ = 220 Hz, $f_2$ = ${v.fix(f2, 3)} Hz · lag $\\tau=${q}/f_1$ = ${v.fix(tau * 1e3, 3)} ms: the second tone slips by ${e === 0 ? '0' : v.fix(e, 5)} cycles and $\\max_t|x(t+\\tau)-x(t)|$ = ${v.fix(mx, 4)}${mx < 1e-9 ? ': **a period**' : ': not a period'}`;
          if (P.r) {
            const [p, d] = P.r, T0 = d / F1;
            return `${head} · $f_2/f_1=${p}/${d}$ in lowest terms, so the fundamental period is $T_0=${d}/f_1=${p}/f_2$ = ${v.fix(T0 * 1e3, 2)} ms, i.e. $1/T_0=\\gcd(f_1,f_2)$ = ${v.fix(1 / T0, 3)} Hz${pre.value === 'beats' ? ' (also the beat rate $|f_2-f_1|$)' : ''}; every other slip is at least $1/${d}$`;
          }
          return `${head} · $f_2/f_1=\\sqrt2$ is irrational: no lag up to $q=${QMAX}$ is a period${firstZero ? '' : ''}; the smallest slip is ${v.fix(best, 5)} cycles at $q=${bestAt}$ (from $${Math.round(bestAt * Math.SQRT2)}/${bestAt}\\approx\\sqrt2$), and the slips keep shrinking but never reach zero`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Complex exponentials and sinusoids',
      statement: String.raw`A **complex exponential signal** is $x(t)=Ce^{st}$ with complex constants $C=|C|e^{j\theta}$ and $s=\sigma+j\omega$. By Euler's formula
$$Ce^{st}=|C|e^{\sigma t}\big[\cos(\omega t+\theta)+j\sin(\omega t+\theta)\big],$$
so its real and imaginary parts are sinusoids of angular frequency $\omega$ inside the envelope $\pm|C|e^{\sigma t}$: **damped** when $\sigma<0$, **growing** when $\sigma>0$, and steady when $\sigma=0$. With $\sigma=0$, $e^{j\omega t}$ is periodic with fundamental period $2\pi/|\omega|$ (for $\omega\ne0$); with $\omega=0$ and $C,s$ real it is a real exponential. Real sinusoids are sums of a conjugate pair:
$$A\cos(\omega t+\theta)=\tfrac{A}{2}e^{j\theta}e^{j\omega t}+\tfrac{A}{2}e^{-j\theta}e^{-j\omega t}.$$
In discrete time the analogous signal is $Cz^n$ with $z=e^{s}$.`,
      idea: String.raw`The exponential law $e^{(a+b)}=e^ae^b$ (pma-8.6) splits $e^{st}$ into a real growth factor $e^{\sigma t}$ and a unit-modulus factor $e^{j\omega t}$, and $t\mapsto e^{j\omega t}$ runs round the unit circle at angular speed $\omega$, returning after $2\pi/|\omega|$ because $e^{2\pi j}=1$ (pma-8.7). So $Ce^{st}$ is a phasor of length $|C|e^{\sigma t}$ turning at rate $\omega$; seen against time it is a spiral, and its shadows on the real and imaginary axes are $|C|e^{\sigma t}\cos(\omega t+\theta)$ and $|C|e^{\sigma t}\sin(\omega t+\theta)$. It is also the solution of $\dot x=sx$ with $x(0)=C$, which is why these signals are the eigenfunctions of every linear time-invariant system (chapter 3).`,
      caption: String.raw`Drag $s$ in the left panel (it snaps onto the axes): left of the imaginary axis the signal decays, right of it it grows, on it it keeps a constant size. Drag $C$ (gold) in the middle panel to set the starting value $x(0)$. Press play: the gold phasor $Ce^{st}$ turns and shrinks or grows; its purple and orange shadows on the axes are the real and imaginary parts. The 3D panel stretches the motion out along time: the spiral's shadow on the floor is $\Re\,x(t)$, on the back wall $\Im\,x(t)$ (drag to rotate). The grey streamlines are the flow of $\dot x=sx$, whose solutions all have this form.`,
      deps: ['pma-8.6', 'pma-8.7', 'sig-1.4'],
      refs: ['Oppenheim–Willsky §1.3', 'Lathi App. B'],
      tags: ['complex exponential', 'phasor'],
      credit: 'Euler, 1748',
      links: { wikipedia: "https://en.wikipedia.org/wiki/Euler%27s_formula" },
      viz(v) {
        const M = v.M, TEND = 6, RMAX = 2.6;
        const sp = v.stage({ x: [-1.1, 0.62], y: [-7.2, 7.2], height: 265, axes: true, xlabel: 'σ (1/s)', ylabel: 'ω (rad/s)', title: 'the exponent $s=\\sigma+j\\omega$' });
        const pz = v.stage({ x: [-2.75, 2.75], y: [-2.75, 2.75], equal: true, height: 265, axes: true, title: '$x(t)=Ce^{st}$ in the complex plane' });
        const s3 = v.stage3d({ height: 330, range: 3.45, axes: false, yaw: -0.5, pitch: 0.36, persp: 9, full: true, title: 'against time: a spiral, with $\\Re\\,x$ on the floor and $\\Im\\,x$ on the back wall' });
        const sH = sp.handle(-0.22, 3.2, { color: 'accent', label: '$s$', constrain: (x, y) => [Math.abs(x) < 0.035 ? 0 : x, Math.abs(y) < 0.28 ? 0 : y] });
        const cH = pz.handle(1.7, 0.35, { color: 'gold', label: '$C$', constrain: (x, y) => { const r = Math.hypot(x, y), k = r > 2.4 ? 2.4 / r : r < 0.3 ? 0.3 / Math.max(r, 1e-9) : 1; return [x * k, y * k]; } });
        const pp = v.phasePlane(pz, { f: (x, y, t, p) => [p.sg * x - p.om * y, p.om * x + p.sg * y], params: { sg: () => sH.x, om: () => sH.y }, field: 'stream', nullclines: false, fixedPoints: true, click: false, both: false, seeds: [] });
        const z = (t) => v.cx(cH.x, cH.y).mul(v.cx(sH.x * t, sH.y * t).exp());
        const X3 = (t) => -3 + (6 * t) / TEND;
        let tc = 0;
        v.animate((tt) => {
          tc = Math.min(TEND, tt % 7);
          const sg = sH.x, om = sH.y, zero = sg === 0 && om === 0, zc = z(tc);
          // ---- s-plane
          sp.rect(-1.1, -7.2, 0, 7.2, { fill: 'green', fillAlpha: 0.07, stroke: false });
          sp.rect(0, -7.2, 0.62, 7.2, { fill: 'red', fillAlpha: 0.07, stroke: false });
          sp.text('decays', -0.55, -6.3, { align: 'center', color: 'green', size: 12, weight: 600 });
          sp.text('grows', 0.31, -6.3, { align: 'center', color: 'red', size: 12, weight: 600 });
          sp.text('steady', 0.03, 6.5, { align: 'left', color: 'muted', size: 11.5 });
          sp.dot(sg, -om, { r: 5, hollow: true, color: 'accent', label: om ? '$\\bar s$' : null, labelPos: 'se' });
          sp.line(sg, om, sg, -om, { color: 'accent', dash: [2, 4], width: 1, alpha: 0.5 });
          // ---- complex plane
          if (!zero) pp.draw();
          const pts = []; for (let i = 0; i <= 700; i++) { const w = z((TEND * i) / 700); pts.push(Math.hypot(w.re, w.im) < 3.3 ? [w.re, w.im] : null); }
          pz.path(pts, { color: 'accent', width: 1.6, alpha: 0.35 });
          pz.path(pts.slice(0, Math.round((700 * tc) / TEND) + 1), { color: 'accent', width: 2.6 });
          const inside = Math.hypot(zc.re, zc.im) < 2.75;
          if (inside) {
            pz.line(zc.re, zc.im, zc.re, 0, { color: 'purple', dash: [3, 3], width: 1.2 });
            pz.line(zc.re, zc.im, 0, zc.im, { color: 'orange', dash: [3, 3], width: 1.2 });
            pz.arrow(0, 0, zc.re, zc.im, { color: 'gold', width: 2.6 });
            pz.dot(zc.re, 0, { color: 'purple', r: 5 }); pz.dot(0, zc.im, { color: 'orange', r: 5 });
          } else pz.corner('|x(t)| has left the frame', 'br', { color: 'red' });
          // ---- 3D spiral
          const W = 2.75, wallY = W, floorZ = -W;
          s3.poly([[-3, wallY, -W], [3, wallY, -W], [3, wallY, W], [-3, wallY, W]], { fill: 'orange', fillAlpha: 0.05, color: 'faint', width: 1 });
          s3.poly([[-3, -W, floorZ], [3, -W, floorZ], [3, W, floorZ], [-3, W, floorZ]], { fill: 'purple', fillAlpha: 0.05, color: 'faint', width: 1 });
          s3.line([-3, wallY, 0], [3, wallY, 0], { color: 'faint', width: 1 });
          s3.line([-3, 0, floorZ], [3, 0, floorZ], { color: 'faint', width: 1 });
          s3.arrow([-3.25, 0, 0], [3.35, 0, 0], { color: 'muted', width: 1.4 });
          s3.text('t', [3.55, 0, 0], { math: true, color: 'muted' });
          s3.line([-3, -1.2, 0], [-3, 1.2, 0], { color: 'muted', width: 1 }); s3.line([-3, 0, -1.2], [-3, 0, 1.2], { color: 'muted', width: 1 });
          s3.text('Re', [-3, 1.45, 0], { color: 'purple', size: 12 }); s3.text('Im', [-3, 0, 1.45], { color: 'orange', size: 12 });
          const P3 = [], Fl = [], Wl = [];
          for (let i = 0; i <= 420; i++) {
            const t = (TEND * i) / 420, w = z(t), ok = Math.hypot(w.re, w.im) <= RMAX;
            P3.push(ok ? [X3(t), w.re, w.im] : null); Fl.push(ok ? [X3(t), w.re, floorZ] : null); Wl.push(ok ? [X3(t), wallY, w.im] : null);
          }
          s3.path(Fl, { color: 'purple', width: 1.8 }); s3.path(Wl, { color: 'orange', width: 1.8 }); s3.path(P3, { color: 'accent', width: 2.4 });
          if (Math.hypot(zc.re, zc.im) <= RMAX) {
            const p = [X3(tc), zc.re, zc.im];
            s3.line(p, [X3(tc), zc.re, floorZ], { color: 'purple', dash: [3, 3], width: 1.2 });
            s3.line(p, [X3(tc), wallY, zc.im], { color: 'orange', dash: [3, 3], width: 1.2 });
            s3.arrow([X3(tc), 0, 0], p, { color: 'gold', width: 2.2 });
            s3.dot(p, { color: 'gold', r: 5 }); s3.dot([X3(tc), zc.re, floorZ], { color: 'purple', r: 3.5 }); s3.dot([X3(tc), wallY, zc.im], { color: 'orange', r: 3.5 });
          }
        }, { period: 7, still: 3.4 });
        v.legend([['accent', '$x(t)=Ce^{st}$'], ['gold', 'the phasor at time $t$'], ['purple', '$\\Re\\,x(t)=|C|e^{\\sigma t}\\cos(\\omega t+\\theta)$'], ['orange', '$\\Im\\,x(t)=|C|e^{\\sigma t}\\sin(\\omega t+\\theta)$'], ['muted', 'flow of $\\dot x=sx$']]);
        v.readout(() => {
          const sg = sH.x, om = sH.y, C = v.cx(cH.x, cH.y), th = C.arg(), zc = z(tc);
          const euler = C.abs() * Math.exp(sg * tc) * Math.cos(om * tc + th);
          const kind = sg === 0 && om === 0 ? 'the constant signal $C$' : om === 0 ? (sg < 0 ? 'a decaying real exponential' : sg > 0 ? 'a growing real exponential' : '') : sg === 0 ? 'a steady sinusoid (pure phasor)' : sg < 0 ? 'a damped sinusoid' : 'a growing sinusoid';
          const env = sg === 0 ? 'constant envelope $|C|$' : `envelope $|C|e^{\\sigma t}$ with time constant $1/|\\sigma|$ = ${v.fix(1 / Math.abs(sg), 2)} s`;
          const turn = om === 0 ? 'no rotation' : `turns ${om > 0 ? 'counter-clockwise' : 'clockwise'} at $|\\omega|$ = ${v.fix(Math.abs(om), 2)} rad/s (period $2\\pi/|\\omega|$ = ${v.fix(TAU / Math.abs(om), 3)} s)`;
          const fp = sg === 0 && om === 0 ? '' : (() => { const f = pp.fixedPoints()[0]; return f ? ` · the origin of $\\dot x=sx$ is a **${f.type}** with eigenvalues $\\sigma\\pm j\\omega$` : ''; })();
          return `$s$ = ${v.fix(sg, 2)} ${om < 0 ? '−' : '+'} ${v.fix(Math.abs(om), 2)}$j$: ${kind}, ${env}, ${turn} · at $t$ = ${v.fix(tc, 2)} s: $Ce^{st}$ = ${v.fix(zc.re, 3)} ${zc.im < 0 ? '−' : '+'} ${v.fix(Math.abs(zc.im), 3)}$j$, and Euler's $|C|e^{\\sigma t}\\cos(\\omega t+\\theta)$ = ${v.fix(euler, 3)}${fp}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Phenomenon',
      name: 'Discrete-time frequencies wrap around every 2π',
      statement: String.raw`For integer $n$, $e^{j(\omega+2\pi k)n}=e^{j\omega n}$ for every integer $k$, so the discrete-time complex exponentials (and the sinusoids $\cos(\omega n+\varphi)$) with frequencies $\omega$ and $\omega+2\pi k$ are **the same signal**. Only an interval of length $2\pi$ of frequencies is distinct, conventionally $-\pi<\omega\le\pi$: as $\omega$ increases from $0$, the sequence oscillates faster until $\omega=\pi$, where $\cos\pi n=(-1)^n$ alternates, then looks slower again, and at $\omega=2\pi$ it is constant. For real cosines $\omega$ and $-\omega$ also coincide, so $\cos\omega n=\cos\omega_a n$ with $\omega_a=|\omega-2\pi\,\mathrm{round}(\omega/2\pi)|\in[0,\pi]$.

Unlike its continuous-time counterpart, $e^{j\omega n}$ is **periodic only if $\omega/2\pi$ is rational**: if $\omega/2\pi=m/N$ in lowest terms the fundamental period is $N$; otherwise no period exists. In particular $\cos n$ (with $\omega=1$ rad) is not periodic.`,
      idea: String.raw`Since $e^{j2\pi kn}=1$ for integers $k$ and $n$ (pma-8.7), adding $2\pi k$ to $\omega$ multiplies every sample by $1$: the samples cannot tell the frequencies apart, even though the continuous curves through them differ wildly. For periodicity, $e^{j\omega(n+N)}=e^{j\omega n}$ requires $e^{j\omega N}=1$, i.e. $\omega N=2\pi m$ for some integer $m$, i.e. $\omega/2\pi=m/N$ rational; the least such $N$ is the denominator in lowest terms. On the unit circle the points $e^{j\omega n}$ then close up into a regular $N$-gon or star; when $\omega/2\pi$ is irrational they never repeat and fill the circle densely. The same wrap-around, met in continuous signals that are sampled, is aliasing (chapter 7).`,
      caption: String.raw`Choose the frequency as $\omega=2\pi m/N$ with whole numbers $m,N$, or directly in radians. Top: the samples $\cos\omega n$ (gold) with the continuous cosine at $\omega$ behind them and, in green, the slowest cosine through the same samples. Raise $m$ past $N/2$: the stems slow down again, and at $m=N$ they are constant. Left: the points $e^{j\omega n}$ on the unit circle close into an $N$-gon or star. Switch to *radians* and try $\omega=1$: the points never close up, so the sequence never repeats. *Listen* plays the samples at 8 kHz; *Sweep* raises $\omega$ from $0$ to $4\pi$ and you hear the pitch rise and fall twice.`,
      deps: ['sig-1.5', 'sig-1.4', 'pma-8.7'],
      refs: ['Oppenheim–Willsky §1.3'],
      tags: ['discrete time', 'aliasing'],
      viz(v) {
        const M = v.M, NS = 32, FS = 8000;
        const mode = v.select('frequency', [{ value: 'rat', label: '$\\omega=2\\pi m/N$' }, { value: 'rad', label: '$\\omega$ in radians' }], 'rat');
        const mS = v.slider('$m$', 0, 40, 3, { int: true });
        const nS = v.slider('$N$', 1, 24, 8, { int: true });
        const wS = v.slider('$\\omega$ (rad per sample)', 0, 12.6, 1, { step: 0.01 });
        const kS = v.slider('points on the circle: $n\\le$', 8, 400, 40, { int: true });
        const ph = playhead(v);
        const omega = () => (mode.value === 'rat' ? (TAU * mS.value) / nS.value : wS.value);
        v.soundButton('Listen', (snd) => {
          const w = omega(), n = Math.round(1.2 * FS), out = new Float32Array(n);
          for (let i = 0; i < n; i++) out[i] = 0.8 * Math.cos(w * i);
          snd.samples(fade(out, FS), FS, { gain: 0.35 });
        });
        v.soundButton('Sweep $\\omega$: 0 → 4π', (snd) => {
          const D = 4, n = D * FS, out = new Float32Array(n); let p = 0;
          for (let i = 0; i < n; i++) { out[i] = 0.8 * Math.cos(p); p += (4 * Math.PI * i) / n; }
          snd.samples(fade(out, FS), FS, { gain: 0.35 }); ph.start(D);
        });
        const s1 = v.stage({ x: [-0.8, NS + 0.8], y: [-1.38, 1.5], height: 205, axes: 'box', yticks: [-1, 0, 1], xlabel: 'n', full: true, title: 'the sequence $x[n]=\\cos\\omega n$' });
        const s2 = v.stage({ x: [-1.32, 1.32], y: [-1.32, 1.32], equal: true, height: 270, axes: false, title: 'the points $e^{j\\omega n}$ on the unit circle' });
        const s3 = v.stage({ x: [0, 4 * Math.PI + 0.25], y: [-0.25, Math.PI + 0.75], height: 270, axes: 'box', xlabel: 'ω', ylabel: 'ω_a', xticks: [0, 1, 2, 3, 4].map((k) => [k * Math.PI, k ? `${k > 1 ? k : ''}π` : '0']), yticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'the slowest frequency $\\omega_a$ with the same samples' });
        let info = null;
        v.render(() => {
          const rat = mode.value === 'rat';
          mS.el.hidden = !rat; nS.el.hidden = !rat; wS.el.hidden = rat;
          const w = omega(), wa = Math.abs(wrapPi(w));
          let N0 = null, p = 0, q = 1;
          if (rat) { const g = M.gcd(mS.value, nS.value) || 1; p = mS.value / g; q = nS.value / g; N0 = p === 0 ? 1 : q; }
          // ---- sequence
          s1.hline(0, { color: 'faint', width: 1 });
          if (N0 && N0 > 1 && N0 <= NS) for (let k = 0; k * N0 <= NS; k += 2) s1.rect(k * N0 - 0.5, -1.38, Math.min(NS + 0.8, (k + 1) * N0 - 0.5), 1.5, { fill: 'accent', fillAlpha: 0.06, stroke: false });
          s1.fn((t) => Math.cos(w * t), { color: 'muted', width: 1.1, alpha: 0.6, n: 2400 });
          if (Math.abs(wa - w) > 1e-9) s1.fn((t) => Math.cos(wa * t), { color: 'green', width: 2, dash: [6, 4], n: 900 });
          const pts = []; for (let n = 0; n <= NS; n++) pts.push([n, Math.cos(w * n)]);
          stems(s1, pts, { color: 'gold', r: 4 });
          if (N0 && N0 > 1 && N0 <= NS) s1.measure(-0.5, 1.33, N0 - 0.5, 1.33, `N₀ = ${N0}`, { color: 'accent', math: false, size: 12, offset: -1 });
          let mx = 0; for (let n = 0; n <= 400; n++) mx = Math.max(mx, Math.abs(Math.cos(w * n) - Math.cos(wa * n)));
          // ---- unit circle
          s2.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          s2.line(-1.25, 0, 1.25, 0, { color: 'faint', width: 1 }); s2.line(0, -1.25, 0, 1.25, { color: 'faint', width: 1 });
          const K = kS.value, cp = [];
          for (let n = 0; n <= K; n++) cp.push([Math.cos(w * n), Math.sin(w * n)]);
          s2.path(cp, { color: 'gold', width: 1, alpha: K > 60 ? 0.22 : 0.5 });
          s2.dots(cp, { r: K > 120 ? 1.8 : 3, color: 'gold' });
          const wp = M.mod(w, TAU);
          if (wp > 1e-6) s2.curve((u) => [0.3 * Math.cos(u), 0.3 * Math.sin(u)], 0, wp, { color: 'accent', width: 1.6, n: 80 });
          s2.arrow(0, 0, Math.cos(w), Math.sin(w), { color: 'accent', width: 2 });
          s2.dot(1, 0, { color: 'ink', r: 4.5, label: 'n = 0', labelPos: 'e', math: false });
          if (Math.abs(Math.cos(w) - 1) + Math.abs(Math.sin(w)) > 0.05) s2.text('n = 1', 1.12 * Math.cos(w), 1.12 * Math.sin(w), { align: Math.cos(w) < -0.2 ? 'right' : Math.cos(w) > 0.2 ? 'left' : 'center', color: 'accent', size: 12, weight: 600 });
          let ret = null; for (let n = 1; n <= K; n++) { const d = Math.hypot(Math.cos(w * n) - 1, Math.sin(w * n)); if (!ret || d < ret.d - 1e-15) ret = { n, d }; }
          s2.corner(N0 ? `${N0} distinct point${N0 > 1 ? 's' : ''}` : `${K + 1} distinct points`, 'tl', { color: 'muted' });
          // ---- apparent frequency
          s3.fn((x) => Math.abs(wrapPi(x)), { color: 'accent', width: 2.2, n: 800 });
          for (let k = 1; k <= 4; k++) s3.vline(k * Math.PI, { color: 'faint', width: 1, dash: [3, 4] });
          s3.dot(w, wa, { color: 'gold', r: 6 });
          s3.line(w, -0.25, w, wa, { color: 'gold', width: 1.2, dash: [3, 3] });
          if (ph.t != null) { const ws = Math.min(4 * Math.PI, ((ph.t / 4) * 4 * Math.PI)); s3.dot(ws, Math.abs(wrapPi(ws)), { color: 'red', r: 6 }); s3.corner(`sweep: ω = ${v.fix(ws, 2)}`, 'tl', { color: 'red' }); }
          info = { w, wa, N0, p, q, mx, ret };
        });
        v.legend([['gold', 'samples $\\cos\\omega n$ and points $e^{j\\omega n}$', { dot: true }], ['muted', 'continuous $\\cos\\omega t$'], ['green', 'slowest cosine through the same samples, $\\cos\\omega_a t$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { w, wa, N0, p, q, mx, ret } = info, play = `played at $f_s$ = 8 kHz it sounds at $\\omega_a f_s/2\\pi$ = ${M.si((wa * FS) / TAU, 'Hz')}`;
          const same = `$\\omega_a$ = ${v.fix(wa, 4)}: $\\max_{n\\le400}|\\cos\\omega n-\\cos\\omega_a n|$ = ${v.fix(mx, 4)}`;
          if (mode.value === 'rat') {
            const per = p === 0 ? 'constant (period 1)' : `$\\omega/2\\pi=${p}/${q}$ in lowest terms, so the fundamental period is $N_0$ = ${q}`;
            return `$\\omega=2\\pi\\cdot${mS.value}/${nS.value}$ = ${v.fix(w, 4)} rad/sample · ${per} · ${same} · ${play}`;
          }
          return `$\\omega$ = ${v.fix(w, 2)} rad/sample: $\\omega/2\\pi$ = ${v.fix(w / TAU, 6)}… is irrational (because $\\pi$ is), so **no** $N$ gives $x[n+N]=x[n]$: the points never repeat · closest return to $e^{j0}$ for $1\\le n\\le$ ${kS.value}: $n$ = ${ret.n}, distance ${v.fix(ret.d, 5)} · ${same} · ${play}`;
        });
      },
    },
  ],
};
