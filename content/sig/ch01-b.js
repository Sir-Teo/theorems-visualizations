// Signals & Systems — Chapter 1: Signals (part b: impulses, energy and inner products)

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;

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
 * sig.f(t) evaluates it, sig.F(t) = ∫_{−∞}^t f exactly, sig.set(fn) resets it, sig.ver counts edits.
 */
function drawable(s, a, b, N, init, yr, enabled) {
  const ys = new Float64Array(N + 1), cum = new Float64Array(N + 1), h = (b - a) / N;
  let cumVer = -1;
  const sig = {
    ys, a, b, N, h, ver: 0,
    set(fn) { for (let i = 0; i <= N; i++) ys[i] = fn(a + i * h); sig.ver++; },
    f(t) { if (!(t >= a && t <= b)) return 0; const u = (t - a) / h, i = Math.min(N - 1, Math.floor(u)); return ys[i] + (ys[i + 1] - ys[i]) * (u - i); },
    F(t) {
      if (cumVer !== sig.ver) { cumVer = sig.ver; cum[0] = 0; for (let i = 0; i < N; i++) cum[i + 1] = cum[i] + (h * (ys[i] + ys[i + 1])) / 2; }
      if (t <= a) return 0; if (t >= b) return cum[N];
      const u = (t - a) / h, i = Math.min(N - 1, Math.floor(u)), w = (u - i) * h;
      return cum[i] + ys[i] * w + ((ys[i + 1] - ys[i]) * w * w) / (2 * h);
    },
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

/** Simpson's rule on [a, b] split at the given breakpoints (so jumps of the integrand cost no accuracy). */
function integrateSplit(M, f, a, b, breaks = [], n = 200) {
  const pts = [a, ...breaks.filter((x) => x > a && x < b).sort((p, q) => p - q), b];
  let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) { const d = 1e-10 * (Math.abs(pts[i]) + Math.abs(pts[i + 1]) + 1); if (pts[i + 1] - pts[i] > 2 * d) s += M.integrate(f, pts[i] + d, pts[i + 1] - d, n); }
  return s;
}

/** An upward or downward arrow marking an impulse of area J at t (drawn with height J). */
function impulse(s, t, J, col, label) {
  s.arrow(t, 0, t, J, { color: col, width: 2.6, head: 10 });
  if (label) s.text(label, t, J, { dx: 7, dy: J > 0 ? 4 : -4, align: 'left', color: col, size: 12.5, weight: 600 });
}

export default {
  collection: 'sig',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Discrete unit impulse and unit step',
      statement: String.raw`The **unit impulse** (unit sample) and the **unit step** are the sequences
$$\delta[n]=\begin{cases}1,&n=0\\0,&n\ne0\end{cases}\qquad\qquad u[n]=\begin{cases}1,&n\ge0\\0,&n<0.\end{cases}$$
Each determines the other: the impulse is the first difference of the step, and the step is the running sum of the impulse,
$$\delta[n]=u[n]-u[n-1],\qquad u[n]=\sum_{k=-\infty}^{n}\delta[k]=\sum_{m=0}^{\infty}\delta[n-m].$$
Multiplying by a shifted impulse picks out one sample, $x[n]\,\delta[n-n_0]=x[n_0]\,\delta[n-n_0]$, so $\sum_n x[n]\,\delta[n-n_0]=x[n_0]$. More generally the running sum $\sum_{k\le n}x[k]$ and the first difference $x[n]-x[n-1]$ undo each other for every sequence that vanishes far to the left.`,
      idea: String.raw`The running sum of $\delta$ is $0$ until the single nonzero sample is reached and $1$ from then on, which is $u$; differencing $u$ gives $0$ everywhere except at $n=0$, where it jumps by $1$. Both directions are one telescoping sum: $\sum_{k\le n}(x[k]-x[k-1])=x[n]$, and the difference of $\sum_{k\le n}x[k]$ and $\sum_{k\le n-1}x[k]$ is the last term $x[n]$. This discrete fundamental theorem of calculus is the model for the continuous pair $u'=\delta$ and $u(t)=\int_{-\infty}^t\delta$ (1.10). Writing $x[n]=\sum_k x[k]\,\delta[n-k]$ as a sum of shifted, scaled impulses is the first step to the convolution sum (chapter 3).`,
      caption: String.raw`Press play: a cursor sweeps from left to right. In the middle panel the accumulator adds up every input stem in the shaded region, building the running sum stem by stem; in the bottom panel each stem is the orange step between consecutive inputs. With $x=\delta[n-n_0]$ the running sum is the step and the difference is a $\pm1$ pair; switch to $u[n-n_0]$ and the running sum becomes a ramp while the difference recovers $\delta$. Drag in the top panel to move $n_0$, or choose *your own* and drag the stems up and down.`,
      deps: ['sig-1.1'],
      refs: ['Oppenheim–Willsky §1.4'],
      tags: ['impulse', 'unit step'],
      viz(v) {
        const M = v.M, NA = -8, NB = 16, ns = M.range(NB - NA + 1, NA), DT = 0.42;
        const input = v.select('input $x[n]$', [{ value: 'd', label: '$\\delta[n-n_0]$' }, { value: 'u', label: '$u[n-n_0]$' }, { value: 'own', label: 'your own' }], 'd');
        const n0S = v.slider('$n_0$', -6, 10, 0, { int: true });
        const own = Float64Array.from(ns, (n) => ({ '-3': 0.5, '-2': 1, '-1': 1.5, 0: 1.5, 1: 0.75, 2: -0.5, 3: -1, 4: -0.25, 6: 1, 7: 1 })[n] ?? 0);
        const X0 = [NA - 1.7, NB + 0.8];
        const sx = v.stage({ x: X0, y: [-1.7, 2.3], height: 150, axes: 'box', yticks: [-1, 0, 1, 2], xticks: M.range(7, 0).map((k) => NA + 4 * k), full: true, title: 'input $x[n]$ (drag in this panel)' });
        const ss = v.stage({ x: X0, y: [-1, 2], height: 170, axes: 'box', xticks: M.range(7, 0).map((k) => NA + 4 * k), full: true, title: 'running sum $s[n]=\\sum_{k\\le n}x[k]$: an accumulator' });
        const sd = v.stage({ x: X0, y: [-2.2, 2.2], height: 150, axes: 'box', xticks: M.range(7, 0).map((k) => NA + 4 * k), xlabel: 'n', full: true, title: 'first difference $d[n]=x[n]-x[n-1]$' });
        sx.onDrag((x, y) => {
          const n = Math.round(x); if (n < NA || n > NB) return;
          if (input.value === 'own') own[n - NA] = M.clamp(Math.round(y * 4) / 4, -1.5, 2);
          else n0S.set(M.clamp(n, -6, 10));
        });
        const xs = () => ns.map((n, i) => (input.value === 'own' ? own[i] : input.value === 'd' ? +(n === n0S.value) : +(n >= n0S.value)));
        let st = null;
        v.animate((t) => {
          n0S.el.hidden = input.value === 'own';
          const x = xs(), S = [], D = [];
          let acc = 0; x.forEach((xi, i) => { acc += xi; S.push(acc); D.push(xi - (i ? x[i - 1] : 0)); });
          const k = Math.min(ns.length - 1, Math.floor(t / DT)), nc = ns[k];
          const lim = (arr, lo, hi) => [Math.min(lo, ...arr) - 0.35, Math.max(hi, ...arr) + 0.55];
          ss.setView(null, lim(S, -0.6, 1.6)); sd.setView(null, lim(D, -1.4, 1.4));
          for (const S2 of [sx, ss, sd]) S2.hline(0, { color: 'faint', width: 1 });
          // ---- input
          sx.rect(NA - 0.5, -1.7, nc + 0.5, 2.3, { fill: 'gold', fillAlpha: 0.1, stroke: false });
          stems(sx, ns.map((n, i) => [n, x[i]]), { color: 'accent' });
          const xp = k ? x[k - 1] : 0;
          sx.line(nc - 1, xp, nc, xp, { color: 'orange', dash: [3, 3], width: 1.4 });
          if (Math.abs(x[k] - xp) > 1e-9) sx.arrow(nc, xp, nc, x[k], { color: 'orange', width: 2.2, head: 7 });
          sx.dot(nc, x[k], { r: 8, hollow: true, color: 'gold', width: 2.2 });
          // ---- running sum
          stems(ss, ns.map((n, i) => [n, S[i]]).slice(k + 1), { color: 'purple', alpha: 0.16 });
          stems(ss, ns.map((n, i) => [n, S[i]]).slice(0, k + 1), { color: 'purple' });
          ss.dot(nc, S[k], { r: 8, hollow: true, color: 'gold', width: 2.2 });
          ss.text(`s[${nc}] = ${v.fmt(S[k], 3)}`, nc, S[k], { dx: nc > 10 ? -12 : 12, align: nc > 10 ? 'right' : 'left', dy: -10, color: 'purple', size: 12.5, weight: 600 });
          // ---- difference
          stems(sd, ns.map((n, i) => [n, D[i]]).slice(k + 1), { color: 'orange', alpha: 0.16 });
          stems(sd, ns.map((n, i) => [n, D[i]]).slice(0, k + 1), { color: 'orange' });
          sd.dot(nc, D[k], { r: 8, hollow: true, color: 'gold', width: 2.2 });
          // inverse-pair checks over the whole window
          let e1 = 0, e2 = 0, cs = 0;
          for (let i = 0; i < x.length; i++) { e1 = Math.max(e1, Math.abs(S[i] - (i ? S[i - 1] : 0) - x[i])); cs += D[i]; e2 = Math.max(e2, Math.abs(cs - x[i])); }
          st = { nc, x: x[k], s: S[k], d: D[k], e1, e2 };
        }, { period: (NB - NA + 1) * DT + 2.4, still: (NB - NA + 1) * DT + 1 });
        v.legend([['accent', 'input $x[n]$', { dot: true }], ['purple', 'running sum', { dot: true }], ['orange', 'first difference', { dot: true }], ['gold', 'the cursor $n$ and what has been summed so far', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { nc, s, d, e1, e2 } = st, n0 = n0S.value, sh = n0 === 0 ? 'n' : `n${n0 > 0 ? '-' : '+'}${Math.abs(n0)}`, sh1 = n0 + 1 === 0 ? 'n' : `n${n0 + 1 > 0 ? '-' : '+'}${Math.abs(n0 + 1)}`;
          const what = input.value === 'd' ? `with $x=\\delta[${sh}]$ the running sum is the step $u[${sh}]$ and the difference is $\\delta[${sh}]-\\delta[${sh1}]$` : input.value === 'u' ? `with $x=u[${sh}]$ the running sum is the ramp $(${sh}+1)\\,u[${sh}]$ and the difference is the impulse $\\delta[${sh}]$` : 'for your sequence';
          return `at $n=${nc}$: $s[${nc}]=\\sum_{k\\le ${nc}}x[k]$ = ${v.fmt(s, 3)}, $d[${nc}]=x[${nc}]-x[${nc - 1}]$ = ${v.fmt(d, 3)} · ${what} · inverse pair on the whole window: $\\max_n|s[n]-s[n-1]-x[n]|$ = ${v.fix(e1, 3)} and $\\max_n|\\sum_{k\\le n}d[k]-x[n]|$ = ${v.fix(e2, 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'The Dirac delta as a limit of narrowing pulses',
      statement: String.raw`The **unit impulse** $\delta(t)$ is not an ordinary function; it is defined by what it does when integrated against a function that is continuous at $0$:
$$\int_{-\infty}^{\infty}\delta(t)\,\varphi(t)\,dt=\varphi(0).$$
Concretely it is the limit of **unit-area pulses**: if $p_\varepsilon\ge0$, $\int p_\varepsilon=1$ and $p_\varepsilon$ vanishes outside $[-c\varepsilon,c\varepsilon]$ (or decays fast enough, like a Gaussian of width $\varepsilon$), then for every bounded $\varphi$ continuous at $0$,
$$\lim_{\varepsilon\to0}\int p_\varepsilon(t)\,\varphi(t)\,dt=\varphi(0),$$
whatever the shape of the pulse. Pointwise the pulses tend to $0$ for $t\ne0$ and blow up at $t=0$, so there is no limiting function; in distribution theory $\delta$ is the functional $\varphi\mapsto\varphi(0)$ on smooth test functions, and $p_\varepsilon\to\delta$ in the sense of distributions. It is drawn as an arrow of height equal to its area.`,
      idea: String.raw`Since the area is $1$, $\int p_\varepsilon\varphi-\varphi(0)=\int p_\varepsilon(t)\,[\varphi(t)-\varphi(0)]\,dt$, and on the tiny support of $p_\varepsilon$ continuity makes $|\varphi(t)-\varphi(0)|$ small, so the error is small times $1$. This is an approximate identity (fa-6.31), and $\varphi\mapsto\varphi(0)$ is the point mass at $0$ seen as a distribution (fa-6.11). Taylor's theorem gives the rate: for smooth $\varphi$ and a symmetric pulse the first-order term cancels and the error is about $\tfrac12\varphi''(0)\int t^2p_\varepsilon$, of order $\varepsilon^2$; a one-sided pulse leaves an error of order $\varepsilon$. If $\varphi$ jumps at $0$ the limit depends on the pulse (the midpoint for symmetric ones), which is why $\delta$ is only applied to functions continuous there.`,
      caption: String.raw`Narrow the pulse with the width slider: it grows taller (its peak is printed when it leaves the panel) but its area stays exactly $1$. The gold area is $\int p_\varepsilon\varphi$; the right panel follows it as $\varepsilon$ shrinks and it settles on $\varphi(0)$ (green). Switch the right panel to the *error* view: on log–log axes the symmetric pulses fall with slope 2 and the one-sided pulse with slope 1. Choose the test function with a jump at $0$: the limit is no longer $\varphi(0)$, and it depends on the pulse.`,
      deps: ['sig-1.7', 'fa-6.11', 'fa-6.31'],
      refs: ['Oppenheim–Willsky §1.4', 'Lathi ch. 1'],
      tags: ['impulse', 'distributions'],
      credit: 'Dirac, 1927; Schwartz, 1945',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dirac_delta_function' },
      viz(v) {
        const M = v.M, YT = 4.6;
        const PUL = {
          rect: { label: 'rectangle', p: (t, e) => (Math.abs(t) <= e / 2 ? 1 / e : 0), sup: (e) => [-e / 2, e / 2], m2: (e) => (e * e) / 12, sym: true, poly: (e) => [[-e / 2, 0], [-e / 2, 1 / e], [e / 2, 1 / e], [e / 2, 0]] },
          tri: { label: 'triangle', p: (t, e) => Math.max(0, 1 - Math.abs(t) / e) / e, sup: (e) => [-e, e], m2: (e) => (e * e) / 6, sym: true, poly: (e) => [[-e, 0], [0, 1 / e], [e, 0]] },
          gauss: { label: 'Gaussian', p: (t, e) => Math.exp((-t * t) / (2 * e * e)) / (e * Math.sqrt(TAU)), sup: (e) => [-7 * e, 7 * e], m2: (e) => e * e, sym: true },
          one: { label: 'one-sided', p: (t, e) => (t >= 0 && t <= e ? 1 / e : 0), sup: (e) => [0, e], m1: (e) => e / 2, sym: false, poly: (e) => [[0, 0], [0, 1 / e], [e, 1 / e], [e, 0]] },
        };
        const TF = {
          bump: { label: 'smooth bump', f: (t) => Math.E * M.bump(t / 1.25) * (1 + 0.5 * t) },
          wave: { label: '$1.2\\cos 2.5t-0.4t$', f: (t) => 1.2 * Math.cos(2.5 * t) - 0.4 * t },
          jump: { label: 'jump at 0', f: (t) => (t >= 0 ? 1.3 : 0.5) * Math.exp(-t * t), jump: true },
        };
        const ps = v.select('pulse', Object.entries(PUL).map(([value, o]) => ({ value, label: o.label })), 'rect');
        const ts = v.select('test function $\\varphi$', Object.entries(TF).map(([value, o]) => ({ value, label: o.label })), 'bump');
        const eS = v.slider('width $\\varepsilon$', 0.005, 1, 0.3, { log: true, fmt: (x) => v.fmt(x, 3) });
        const view = v.select('right panel', [{ value: 'val', label: 'value' }, { value: 'err', label: 'error (log–log)' }], 'val');
        const sl = v.stage({ x: [-1.8, 1.8], y: [-0.35, YT], height: 300, axes: 'box', xlabel: 't', title: 'a unit-area pulse $p_\\varepsilon$, the test function $\\varphi$ and their product' });
        const sr = v.stage({ x: [0.004, 1.2], y: [0, 2], xlog: true, height: 300, axes: 'box', xlabel: 'ε', title: '$\\int p_\\varepsilon\\varphi\\,dt$ as the pulse narrows' });
        const se = v.stage({ x: [0.004, 1.2], y: [1e-7, 2], xlog: true, ylog: true, height: 300, axes: 'box', xlabel: 'ε', title: 'the error $|\\int p_\\varepsilon\\varphi\\,dt-\\varphi(0)|$ on log–log axes' });
        const pair = (P, f, e) => { const [a, b] = P.sup(e), g = (t) => P.p(t, e) * f(t); return a < 0 && b > 0 ? M.integrate(g, a, 0, 400) + M.integrate(g, 0, b, 400) : M.integrate(g, a, b, 800); };
        const EPS = M.range(90).map((i) => 0.004 * Math.pow(1.2 / 0.004, i / 89));
        let cacheKey = '', curve = null, info = null;
        v.render(() => {
          const P = PUL[ps.value], T = TF[ts.value], f = T.f, e = eS.value, ph0 = f(0);
          if (cacheKey !== ps.value + ts.value) { cacheKey = ps.value + ts.value; curve = EPS.map((x) => [x, pair(P, f, x)]); }
          const I = pair(P, f, e), [a, b] = P.sup(e), area = a < 0 && b > 0 ? M.integrate((t) => P.p(t, e), a, 0, 400) + M.integrate((t) => P.p(t, e), 0, b, 400) : M.integrate((t) => P.p(t, e), a, b, 800);
          const limit = T.jump ? (P.sym ? (0.5 + 1.3) / 2 : 1.3) : ph0;
          // ---- left panel
          sl.hline(0, { color: 'faint', width: 1 }); sl.vline(0, { color: 'faint', width: 1 });
          sl.clip(() => {
            if (P.poly) {
              sl.poly(P.poly(e), { fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 2 });
              const prod = []; const n = 160; for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n; prod.push([t, P.p(t, e) * f(t)]); }
              sl.poly([[a, 0], ...prod, [b, 0]], { fill: 'gold', fillAlpha: 0.55, stroke: false });
            } else {
              sl.fn((t) => P.p(t, e), { domain: [a, b], n: 500, color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.13 });
              sl.fn((t) => P.p(t, e) * f(t), { domain: [a, b], n: 500, fill: 'gold', fillAlpha: 0.55, stroke: false });
            }
            if (T.jump) { sl.fn(f, { domain: [-1.9, -1e-9], color: 'purple', width: 2.4, n: 500 }); sl.fn(f, { domain: [0, 1.9], color: 'purple', width: 2.4, n: 500 }); }
            else sl.fn(f, { color: 'purple', width: 2.4, n: 900 });
          });
          sl.dot(0, ph0, { color: 'green', r: 5.5 });
          if (T.jump) sl.dot(0, 0.5, { color: 'purple', r: 4.5, hollow: true });
          const peak = P.p(P.sym ? 0 : e / 2, e);
          if (peak > YT * 0.96) { sl.arrow(0, YT * 0.78, 0, YT * 0.97, { color: 'accent', width: 2, head: 8 }); sl.text(`peak ${v.fmt(peak, 3)}`, 0, YT * 0.86, { dx: 9, align: 'left', color: 'accent', size: 12.5, weight: 600 }); }
          sl.corner(`area of the pulse = ${v.fix(area, 4)}`, 'tl', { color: 'accent', weight: 600 });
          // ---- right panel: the pairing against ε, or its error on log–log axes
          const showVal = view.value === 'val';
          sr.el.style.display = showVal ? '' : 'none'; se.el.style.display = showVal ? 'none' : '';
          if (showVal) {
            sr.vline(e, { color: 'gold', width: 1.4, dash: [4, 3] });
            let lo = Math.min(limit, ph0, ...curve.map((p) => p[1])), hi = Math.max(limit, ph0, ...curve.map((p) => p[1]));
            const pad = Math.max(0.12, (hi - lo) * 0.18); sr.setView(null, [lo - pad, hi + pad]);
            sr.hline(ph0, { color: 'green', width: 1.6, dash: [6, 4] });
            sr.text('φ(0)', 1.15, ph0, { dy: -9, align: 'right', color: 'green', size: 12, weight: 600 });
            if (T.jump && Math.abs(limit - ph0) > 1e-9) { sr.hline(limit, { color: 'red', width: 1.4, dash: [3, 3] }); sr.text(`the actual limit ${v.fix(limit, 2)}`, 0.0045, limit, { dy: limit < ph0 ? 11 : -9, align: 'left', color: 'red', size: 12, weight: 600 }); }
            sr.path(curve, { color: 'accent', width: 2.4 });
            sr.dot(e, I, { color: 'gold', r: 6 });
          } else {
            se.vline(e, { color: 'gold', width: 1.4, dash: [4, 3] });
            const errs = curve.map(([x, y]) => [x, Math.max(Math.abs(y - ph0), 1e-12)]);
            const er = errs[Math.round(errs.length * 0.45)], c2 = (0.3 * er[1]) / er[0] ** 2, c1 = (0.3 * er[1]) / er[0];
            se.fn((x) => c2 * x * x, { color: 'muted', width: 1.2, dash: [5, 4] });
            se.fn((x) => c1 * x, { color: 'muted', width: 1.2, dash: [5, 4] });
            const xr = 0.75, y2 = c2 * xr * xr, y1 = c1 * xr;
            if (y2 < 1.5) se.text('slope 2', xr, y2, { dy: -10, align: 'center', color: 'muted', size: 11.5, weight: 600 });
            if (y1 > 2e-7) se.text('slope 1', xr, y1, { dy: 11, align: 'center', color: 'muted', size: 11.5, weight: 600 });
            se.path(errs, { color: 'accent', width: 2.4 });
            se.dot(e, Math.max(Math.abs(I - ph0), 1e-12), { color: 'gold', r: 6 });
          }
          info = { P, T, e, I, ph0, area, limit, peak };
        });
        v.legend([['accent', 'pulse $p_\\varepsilon$ (area 1)'], ['purple', 'test function $\\varphi$'], ['gold', '$p_\\varepsilon\\varphi$: its area is the pairing', { area: true }], ['green', '$\\varphi(0)$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { P, T, e, I, ph0, area, limit } = info, err = I - ph0;
          let pred;
          if (T.jump) pred = `$\\varphi$ jumps from 0.5 to 1.3 at $0$: ${P.sym ? 'a symmetric pulse averages the two sides and tends to 0.9' : 'a one-sided pulse only sees the right side and tends to 1.3'}, so the answer depends on the pulse and $\\delta$ cannot be paired with this $\\varphi$`;
          else if (P.sym) pred = `Taylor's prediction $\\tfrac12\\varphi''(0)\\int t^2p_\\varepsilon$ = ${v.fmt(0.5 * M.deriv2(T.f, 0) * P.m2(e), 3)}: of order $\\varepsilon^2$`;
          else pred = `Taylor's prediction $\\varphi'(0)\\int t\\,p_\\varepsilon$ = ${v.fmt(M.deriv(T.f, 0) * P.m1(e), 3)}: of order $\\varepsilon$`;
          return `$\\varepsilon$ = ${v.fmt(e, 3)}: $\\int p_\\varepsilon\\,dt$ = ${v.fix(area, 4)}, peak height ${v.fmt(info.peak, 3)} · $\\int p_\\varepsilon\\varphi\\,dt$ = ${v.fix(I, 5)}, $\\varphi(0)$ = ${v.fix(ph0, 5)}, error ${v.fmt(err, 3)} · ${pred}${T.jump ? '' : ` · limit as $\\varepsilon\\to0$: ${v.fix(limit, 4)}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Proposition',
      name: 'Sifting property of the impulse',
      statement: String.raw`If $x$ is continuous at $t_0$, then
$$\int_{-\infty}^{\infty}x(t)\,\delta(t-t_0)\,dt=x(t_0),\qquad\text{and}\qquad x(t)\,\delta(t-t_0)=x(t_0)\,\delta(t-t_0).$$
Integrating against a shifted impulse **sifts out** the value of the signal at the impulse. Letting $t_0$ range over all times gives
$$x(t)=\int_{-\infty}^{\infty}x(\tau)\,\delta(t-\tau)\,d\tau ,$$
a representation of any continuous signal as a continuum of weighted, shifted impulses (the discrete version is $x[n]=\sum_k x[k]\,\delta[n-k]$). Where $x$ jumps, the left side is not defined by continuity; approximating $\delta$ by symmetric pulses gives the midpoint $\tfrac12[x(t_0^-)+x(t_0^+)]$.`,
      idea: String.raw`Replace $\delta(t-t_0)$ by a unit-area rectangle of width $\varepsilon$ centred at $t_0$: the integral becomes the **average of $x$ over $[t_0-\varepsilon/2,\,t_0+\varepsilon/2]$**, which tends to $x(t_0)$ as $\varepsilon\to0$ when $x$ is continuous there (the definition 1.8, with the change of variable $t\mapsto t-t_0$). Rudin's version of the same idea is integration against a unit step jump, which samples $f$ at the jump (pma-6.15). As a function of $t_0$, the average is a smoothed copy of $x$ (the convolution $x*p_\varepsilon$), and it converges to $x$ itself: convolving with $\delta$ changes nothing, which is why the impulse response of a system will determine its response to every input (chapter 3).`,
      caption: String.raw`Draw any signal in the top panel (the default one jumps at $t=1$). The orange pulse is a unit-area rectangle of width $\varepsilon$ centred at $t_0$; the gold area under $x(t)p_\varepsilon(t-t_0)$ equals the average of $x$ over the pulse (green bar). Drag the handle along the green curve in the lower panel to slide $t_0$: that curve records the integral for every $t_0$, a blurred copy of $x$. Shrink $\varepsilon$ and it locks onto $x$ (dashed), except exactly at the jump, where it passes through the midpoint.`,
      deps: ['sig-1.8', 'pma-6.15'],
      refs: ['Oppenheim–Willsky §1.4'],
      tags: ['impulse', 'sifting'],
      viz(v) {
        const M = v.M, A = -3, B = 3, YT = 2.5;
        const def = (t) => (t < 1 ? 0.55 + 0.45 * Math.sin(1.6 * t + 0.4) : -0.35 + 0.25 * Math.cos(2.5 * t));
        const eS = v.slider('pulse width $\\varepsilon$', 0.01, 1.5, 0.4, { log: true, fmt: (x) => v.fmt(x, 3) });
        const top = v.stage({ x: [A, B], y: [-1.45, YT], height: 230, axes: 'box', yticks: [-1, 0, 1, 2], xlabel: 't', full: true, title: 'the signal $x(t)$ (drag to draw) and a unit-area pulse at $t_0$' });
        const bot = v.stage({ x: [A, B], y: [-1.3, 1.6], height: 210, axes: 'box', yticks: [-1, 0, 1], xlabel: 't₀', full: true, title: '$\\int x(t)\\,p_\\varepsilon(t-t_0)\\,dt$ for every $t_0$' });
        const sig = drawable(top, A - 0.6, B + 0.6, 720, def, [-1.3, 1.5]);
        v.button('Reset the signal', () => sig.set(def));
        const avg = (t0, e) => (sig.F(t0 + e / 2) - sig.F(t0 - e / 2)) / e;
        const h0 = bot.handle(0.4, avg(0.4, 0.4), { color: 'green', label: '$t_0$', constrain: (x) => { const t = M.clamp(x, A + 0.05, B - 0.05); return [t, avg(t, eS.value)]; } });
        let st = null;
        v.render(() => {
          const e = eS.value, t0 = h0.x, x0 = sig.f(t0), y0 = avg(t0, e);
          h0.y = y0;
          const a = t0 - e / 2, b = t0 + e / 2, H = 1 / e;
          // ---- top
          top.hline(0, { color: 'faint', width: 1 });
          top.clip(() => {
            const prod = []; for (let i = 0; i <= 120; i++) { const t = a + ((b - a) * i) / 120; prod.push([t, sig.f(t) * H]); }
            top.poly([[a, 0], ...prod, [b, 0]], { fill: 'gold', fillAlpha: 0.5, stroke: false });
            top.poly([[a, 0], [a, H], [b, H], [b, 0]], { fill: 'orange', fillAlpha: 0.08, color: 'orange', width: 1.8 });
          });
          if (H > YT) { top.arrow(t0, YT - 0.55, t0, YT - 0.06, { color: 'orange', width: 2, head: 7 }); top.text(`height 1/ε = ${v.fmt(H, 3)}`, t0, YT - 0.3, { dx: t0 > 1.6 ? -9 : 9, align: t0 > 1.6 ? 'right' : 'left', color: 'orange', size: 12, weight: 600 }); }
          top.fn(sig.f, { color: 'accent', width: 2.4, n: 1200 });
          top.line(a, y0, b, y0, { color: 'green', width: 3.4 });
          top.dot(t0, x0, { color: 'accent', r: 5 });
          // ---- bottom
          bot.hline(0, { color: 'faint', width: 1 });
          bot.fn(sig.f, { color: 'accent', width: 1.6, dash: [5, 4], alpha: 0.8, n: 1200 });
          bot.fn((t) => avg(t, e), { color: 'green', width: 2.6, n: 1200 });
          bot.vline(t0, { color: 'green', width: 1, dash: [3, 4], alpha: 0.7 });
          bot.dot(t0, x0, { color: 'accent', r: 4.5 });
          // jumps of the drawn signal (steep segments) near t0
          let jump = null;
          for (let i = 0; i < sig.N; i++) { const d = sig.ys[i + 1] - sig.ys[i]; if (Math.abs(d) > 0.3) { const tj = sig.a + (i + 0.5) * sig.h; if (Math.abs(tj - t0) <= e / 2 + sig.h && (!jump || Math.abs(tj - t0) < Math.abs(jump.t - t0))) jump = { t: tj, mid: (sig.ys[i] + sig.ys[i + 1]) / 2 }; } }
          st = { e, t0, x0, y0, jump };
        });
        v.legend([['accent', 'signal $x(t)$'], ['orange', 'unit-area pulse $p_\\varepsilon(t-t_0)$'], ['gold', '$x(t)\\,p_\\varepsilon(t-t_0)$', { area: true }], ['green', 'its integral = the average of $x$ over the pulse']]);
        v.readout(() => {
          if (!st) return '';
          const { e, t0, x0, y0, jump } = st;
          const jt = jump ? ` · the pulse straddles the jump at $t\\approx$ ${v.fix(jump.t, 2)}: as $\\varepsilon\\to0$ there the integral tends to the midpoint ${v.fix(jump.mid, 3)}, not to a one-sided value` : ' · as $\\varepsilon\\to0$ the difference tends to 0, because $x$ is continuous at $t_0$';
          return `$t_0$ = ${v.fix(t0, 2)}, $\\varepsilon$ = ${v.fmt(e, 3)}: $\\int x(t)\\,p_\\varepsilon(t-t_0)\\,dt$ = average of $x$ over $[t_0-\\varepsilon/2,\\,t_0+\\varepsilon/2]$ = ${v.fix(y0, 4)} · $x(t_0)$ = ${v.fix(x0, 4)} · difference ${v.fmt(y0 - x0, 3)}${jt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Proposition',
      name: 'The derivative of the step is the delta',
      statement: String.raw`In the sense of distributions,
$$\frac{d}{dt}u(t)=\delta(t),\qquad u(t)=\int_{-\infty}^{t}\delta(\tau)\,d\tau ,$$
meaning that for every smooth test function $\varphi$ vanishing outside a bounded interval, $-\int u(t)\,\varphi'(t)\,dt=\varphi(0)$. Equivalently: the ramps $u_\varepsilon$ that climb from $0$ to $1$ over $[-\varepsilon/2,\varepsilon/2]$ converge to $u$, and their derivatives, rectangles of width $\varepsilon$ and height $1/\varepsilon$, converge to $\delta$. More generally, a signal that is smooth except for jumps of sizes $J_k$ at times $t_k$ has the generalised derivative
$$x'(t)=x'_{\text{ord}}(t)+\sum_k J_k\,\delta(t-t_k),$$
its ordinary derivative plus an impulse of area $J_k$ at every jump.`,
      idea: String.raw`The distributional derivative is defined by moving the derivative onto the test function (fa-6.12): $\langle u',\varphi\rangle=-\langle u,\varphi'\rangle=-\int_0^\infty\varphi'(t)\,dt=\varphi(0)-\varphi(\infty)=\varphi(0)$, by the fundamental theorem of calculus, and $\varphi\mapsto\varphi(0)$ is $\delta$ (1.8). Concretely, average $x$ over a window of width $\varepsilon$: the derivative of that smoothed signal is exactly the difference quotient $[x(t+\varepsilon/2)-x(t-\varepsilon/2)]/\varepsilon$. Away from jumps it tends to $x'$; across a jump it is a spike of width about $\varepsilon$ whose area is the jump $J$, which is a narrowing unit-area pulse scaled by $J$.`,
      caption: String.raw`Pick a signal with jumps. Top: the signal (blue) and its smoothed version $x_\varepsilon$, the average of $x$ over a window of width $\varepsilon$ (orange). Bottom: the derivative of $x_\varepsilon$ (orange) next to the limit the proposition predicts, the ordinary derivative (blue) plus an impulse of area $J$ at each jump (green arrows). Shrink $\varepsilon$: the spikes get narrower and taller with their area pinned at $J$. The readout pairs both sides with the test function $\varphi$ (dotted purple).`,
      deps: ['sig-1.8', 'fa-6.12', 'pma-6.21'],
      refs: ['Oppenheim–Willsky §1.4', 'Oppenheim–Willsky §2.5'],
      tags: ['impulse', 'distributions'],
      viz(v) {
        const M = v.M, XL = -2.6, XR = 2.6, YB = [-2.5, 2.9];
        const SIG = {
          step: { label: '$u(t)$', x: (t) => (t >= 0 ? 1 : 0), X: (t) => Math.max(t, 0), d: () => 0, J: [[0, 1]] },
          exp: { label: '$e^{-t}u(t)$', x: (t) => (t >= 0 ? Math.exp(-t) : 0), X: (t) => (t > 0 ? 1 - Math.exp(-t) : 0), d: (t) => (t > 0 ? -Math.exp(-t) : 0), J: [[0, 1]] },
          pulse: { label: '$u(t+1)-u(t-1)$', x: (t) => (t >= -1 && t < 1 ? 1 : 0), X: (t) => M.clamp(t, -1, 1) + 1, d: () => 0, J: [[-1, 1], [1, -1]] },
          saw: { label: 'sawtooth', x: (t) => t - Math.floor(t), X: (t) => Math.floor(t) / 2 + (t - Math.floor(t)) ** 2 / 2, d: () => 1, J: [[-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1]] },
        };
        const which = v.select('signal', Object.entries(SIG).map(([value, o]) => ({ value, label: o.label })), 'step');
        const eS = v.slider('smoothing width $\\varepsilon$', 0.01, 1, 0.35, { log: true, fmt: (x) => v.fmt(x, 3) });
        const top = v.stage({ x: [XL, XR], y: [-0.35, 1.45], height: 185, axes: 'box', yticks: [0, 1], full: true, title: 'the signal $x$ and its smoothed version $x_\\varepsilon(t)=\\frac1\\varepsilon\\int_{t-\\varepsilon/2}^{t+\\varepsilon/2}x$' });
        const bot = v.stage({ x: [XL, XR], y: YB, height: 250, axes: 'box', yticks: [-2, -1, 0, 1, 2], xlabel: 't', full: true, title: '$x_\\varepsilon\'$ and the predicted limit $x\'_{\\rm ord}+\\sum_k J_k\\,\\delta(t-t_k)$' });
        const phi = (t) => Math.exp(-((t - 0.25) ** 2) / 0.7), dphi = (t) => (-2 * (t - 0.25) / 0.7) * phi(t);
        let st = null;
        v.render(() => {
          const S = SIG[which.value], e = eS.value, J = S.J, tj = J.map((p) => p[0]);
          const xe = (t) => (S.X(t + e / 2) - S.X(t - e / 2)) / e, dxe = (t) => (S.x(t + e / 2) - S.x(t - e / 2)) / e;
          // ---- top
          top.hline(0, { color: 'faint', width: 1 });
          const cuts = [XL, ...tj.filter((t) => t > XL && t < XR), XR];
          for (let i = 0; i + 1 < cuts.length; i++) top.fn(S.x, { domain: [cuts[i] + 1e-9, cuts[i + 1] - 1e-9], color: 'accent', width: 2.6, n: 300 });
          for (const [t, Jk] of J) if (t > XL && t < XR) { top.dot(t, S.x(t - 1e-9), { r: 4.5, hollow: true, color: 'accent' }); top.dot(t, S.x(t - 1e-9) + Jk, { r: 4.5, color: 'accent' }); }
          top.fn(xe, { color: 'orange', width: 2.2, n: 1400 });
          // ---- bottom
          bot.hline(0, { color: 'faint', width: 1 });
          bot.fn(phi, { color: 'purple', width: 1.6, dash: [2, 4] });
          for (let i = 0; i + 1 < cuts.length; i++) bot.fn(S.d, { domain: [cuts[i] + 1e-9, cuts[i + 1] - 1e-9], color: 'accent', width: 2.4, n: 200 });
          bot.clip(() => bot.fn(dxe, { color: 'orange', width: 2, n: 3200, connect: true, fill: 'orange', fillAlpha: 0.14 }));
          for (const [t, Jk] of J) if (t > XL && t < XR) {
            impulse(bot, t, Jk, 'green', which.value === 'saw' && t !== 0 ? null : `${Jk > 0 ? '' : '−'}δ(t${t === 0 ? '' : t > 0 ? ' − ' + t : ' + ' + -t})`);
            if (1 / e > YB[1]) bot.text(`↑ ${v.fmt(1 / e, 3)}`, t + e / 2, Jk > 0 ? YB[1] : YB[0], { dx: 4, dy: Jk > 0 ? 9 : -9, align: 'left', color: 'orange', size: 11.5, weight: 600 });
          }
          // spike area around the first jump, and the pairings with φ
          const [t1, J1] = J.find((p) => p[0] === 0) || J[0];
          const spike = xe(t1 + e) - xe(t1 - e);
          const brk = [...tj.flatMap((t) => [t - e / 2, t + e / 2])];
          const Aeps = integrateSplit(M, (t) => dxe(t) * phi(t), -4, 4, brk, 120);
          const Bdist = -integrateSplit(M, (t) => S.x(t) * dphi(t), -4, 4, tj, 200);
          const Cpred = integrateSplit(M, (t) => S.d(t) * phi(t), -4, 4, tj, 200) + J.reduce((s, [t, Jk]) => s + Jk * phi(t), 0);
          st = { e, t1, J1, spike, Aeps, Bdist, Cpred };
        });
        v.legend([['accent', '$x$ and its ordinary derivative'], ['orange', '$x_\\varepsilon$ and $x_\\varepsilon\'$'], ['green', 'impulses $J_k\\,\\delta(t-t_k)$ at the jumps'], ['purple', 'test function $\\varphi$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { e, t1, J1, spike, Aeps, Bdist, Cpred } = st;
          return `$\\varepsilon$ = ${v.fmt(e, 3)}: the spike of $x_\\varepsilon'$ at $t$ = ${t1} has width $\\varepsilon$, height up to $|J|/\\varepsilon$ = ${v.fmt(Math.abs(J1) / e, 3)} and area $x_\\varepsilon(t+\\varepsilon)-x_\\varepsilon(t-\\varepsilon)$ = ${v.fix(spike, 4)} (jump $J$ = ${J1}) · pairing with $\\varphi$: $\\int x_\\varepsilon'\\varphi\\,dt$ = ${v.fix(Aeps, 4)} $\\to$ $-\\int x\\varphi'\\,dt$ = ${v.fix(Bdist, 4)} $=\\int x'_{\\rm ord}\\varphi\\,dt+\\sum_k J_k\\varphi(t_k)$ = ${v.fix(Cpred, 4)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Energy and power signals',
      statement: String.raw`The **energy** and **average power** of a continuous-time signal are
$$E_\infty=\lim_{T\to\infty}\int_{-T}^{T}|x(t)|^2\,dt,\qquad P_\infty=\lim_{T\to\infty}\frac{1}{2T}\int_{-T}^{T}|x(t)|^2\,dt ,$$
and for a discrete-time signal $E_\infty=\sum_n|x[n]|^2$ and $P_\infty=\lim_{N\to\infty}\frac{1}{2N+1}\sum_{n=-N}^{N}|x[n]|^2$. The names come from circuits: if $x$ is the voltage across a $1\ \Omega$ resistor, $|x(t)|^2$ is the power it dissipates (in watts) and $E_\infty$ the total energy (in joules). An **energy signal** has $0<E_\infty<\infty$, and then $P_\infty=0$; a **power signal** has $0<P_\infty<\infty$, and then $E_\infty=\infty$. Periodic signals (other than $0$) are power signals, with $P_\infty$ the average of $|x|^2$ over one period. Some signals are neither, such as $t\,u(t)$ (infinite energy and power) or $1/\sqrt{1+|t|}$ (infinite energy, zero power).`,
      idea: String.raw`If $E_T=\int_{-T}^T|x|^2$ converges to a finite $E_\infty$, then $P_T=E_T/2T\le E_\infty/2T\to0$, so a finite-energy signal has zero average power. Conversely if $P_T\to P_\infty>0$ then $E_T\approx2TP_\infty$ grows without bound. The classes are therefore disjoint, and log–log plots of $E_T$ and $P_T$ against $T$ make the verdict visible: a horizontal asymptote in the energy plot means an energy signal, one in the power plot means a power signal, and a curve that keeps rising (or falls to zero) in both means neither. The energy is the squared length $\|x\|^2$ that turns signals into vectors (1.12).`,
      caption: String.raw`Pick a signal and drag the window half-width $T$ (log scale, up to 1000 s). Top: $|x(t)|^2$ (gold) with the window shaded; the gold area is $E_T$ and the green dashed line its average height $P_T=E_T/2T$. Press play: a cursor sweeps the window while the schematic shows $x(t)$ as a voltage across $1\ \Omega$ (wire colour = voltage, dots = current). Bottom: $E_T$ and $P_T$ against $T$ on log–log axes. The pulse's energy levels off at $A^2\tau/2$ while its power dies like $1/T$; the tone's power levels off at $A^2/2$ while its energy grows like $T$.`,
      deps: ['sig-1.1'],
      refs: ['Oppenheim–Willsky §1.1', 'Lathi ch. 1'],
      tags: ['energy', 'power'],
      viz(v) {
        const M = v.M, T0 = 0.1, T1 = 1000, NG = 241;
        const SIG = {
          pulse: { label: 'pulse $Ae^{-t/\\tau}u(t)$', x: (t) => (t >= 0 ? Math.exp(-t) : 0), f: 0 },
          tone: { label: 'tone $A\\cos\\pi t$', x: (t) => Math.cos(Math.PI * t), f: 0.5 },
          ramp: { label: 'ramp $A\\,t\\,u(t)$', x: (t) => (t > 0 ? t : 0), f: 0 },
          slow: { label: '$A/\\sqrt{1+|t|}$', x: (t) => 1 / Math.sqrt(1 + Math.abs(t)), f: 0 },
        };
        const which = v.select('signal', Object.entries(SIG).map(([value, o]) => ({ value, label: o.label })), 'pulse');
        const TS = v.slider('window half-width $T$', T0, T1, 4, { log: true, fmt: (x) => M.si(x, 's', 3) });
        const AS = v.slider('amplitude $A$', 0.5, 2, 1, { step: 0.05, fmt: (x) => v.fix(x, 2) + ' V' });
        const top = v.stage({ x: [-5, 5], y: [-1.2, 1.2], height: 230, axes: 'box', xlabel: 't (s)', weight: 1.7, minWidth: 300, title: '$|x(t)|^2$ over the window $[-T,T]$' });
        const sc = v.stage({ x: [-1.2, 3.5], y: [-0.85, 2.85], equal: true, height: 230, axes: false, weight: 0.8, minWidth: 230, title: '$x(t)$ across $1\\ \\Omega$' });
        const sE = v.stage({ x: [T0, T1], y: [1e-3, 10], xlog: true, ylog: true, height: 220, axes: 'box', xlabel: 'T (s)', minWidth: 390, title: 'energy $E_T=\\int_{-T}^{T}|x|^2dt$ (J)' });
        const sP = v.stage({ x: [T0, T1], y: [1e-3, 10], xlog: true, ylog: true, height: 220, axes: 'box', xlabel: 'T (s)', minWidth: 390, title: 'average power $P_T=E_T/2T$ (W)' });
        let tc = 0;
        const xNow = (t) => AS.value * SIG[which.value].x(t);
        const C = v.circuit(sc, { names: false, parts: [
          { type: 'V', id: 'V', value: 0, wave: (t) => xNow(t), at: [0, 2, 0, 0], label: '' },
          { type: 'W', at: [0, 2, 2.2, 2] },
          { type: 'R', id: 'R', value: 1, at: [2.2, 2, 2.2, 0], label: 'R = 1 Ω' },
          { type: 'W', at: [2.2, 0, 0, 0] },
          { type: 'GND', at: [1.1, 0] },
          { type: 'label', at: [1.1, 2], text: '$x(t)$', dx: -14, dy: -8 },
        ] });
        // cumulative energy on a log grid of T (at A = 1), integrating x(t)² + x(−t)² segment by segment
        const TG = M.range(NG).map((i) => T0 * Math.pow(T1 / T0, i / (NG - 1)));
        const cache = {};
        const grid = (key) => {
          if (cache[key]) return cache[key];
          const S = SIG[key], g = (t) => S.x(t) ** 2 + S.x(-t) ** 2, E = [];
          let acc = M.integrate((t) => S.x(t) ** 2, -T0, 0, 200) + M.integrate((t) => S.x(t) ** 2, 0, T0, 200);
          E.push(acc);
          for (let i = 1; i < NG; i++) { const a = TG[i - 1], b = TG[i], n = Math.max(16, 2 * Math.ceil((b - a) * (S.f * 12 + 2))); acc += M.integrate(g, a, b, n); E.push(acc); }
          return (cache[key] = E);
        };
        const at = (E, T) => { const u = (Math.log(T / T0) / Math.log(T1 / T0)) * (NG - 1), i = Math.min(NG - 2, Math.max(0, Math.floor(u))), w = u - i; return Math.exp(Math.log(E[i]) * (1 - w) + Math.log(E[i + 1]) * w); };
        let st = null;
        v.animate((t) => {
          const key = which.value, S = SIG[key], A = AS.value, A2 = A * A, T = TS.value, E = grid(key);
          const ET = A2 * at(E, T), PT = ET / (2 * T);
          tc = -T + 2 * T * ((t % 6) / 6);
          // ---- top: |x|² over the window
          const L = Math.max(1.6, 1.12 * T);
          let ymax = 0, ymin = 0; for (let i = 0; i <= 400; i++) { const u = -L + (2 * L * i) / 400, xv = A * S.x(u); ymax = Math.max(ymax, xv * xv, xv); ymin = Math.min(ymin, xv); }
          top.setView([-L, L], [ymin * 1.15 - 0.15 * ymax, ymax * 1.18]);
          top.vband(-T, T, { color: 'accent', alpha: 0.06 });
          top.vline(-T, { color: 'accent', width: 1, dash: [4, 3] }); top.vline(T, { color: 'accent', width: 1, dash: [4, 3] });
          top.hline(0, { color: 'faint', width: 1 });
          const n = Math.min(4000, Math.max(800, Math.ceil(2 * L * S.f * 30)));
          top.fn((u) => (u >= -T && u <= T ? A2 * S.x(u) ** 2 : NaN), { color: 'gold', width: 1.4, n, fill: 'gold', fillAlpha: 0.32 });
          top.fn((u) => (u >= -T && u <= tc ? A2 * S.x(u) ** 2 : NaN), { color: 'gold', width: 0.01, n, fill: 'gold', fillAlpha: 0.35 });
          top.fn((u) => A * S.x(u), { color: 'accent', width: 1.4, n, alpha: 0.75 });
          top.line(-T, PT, T, PT, { color: 'green', width: 2, dash: [6, 4] });
          top.vline(tc, { color: 'red', width: 1.3 });
          top.dot(tc, A2 * S.x(tc) ** 2, { color: 'red', r: 4.5 });
          // ---- circuit
          const xmax = Math.max(1e-9, A * Math.max(...M.range(201).map((i) => Math.abs(S.x(-T + (2 * T * i) / 200)))));
          C.draw({ result: C.dc({ t: tc }), t, vmax: xmax, imax: xmax });
          const xv = xNow(tc);
          sc.text(`p = x²/R = ${M.si(xv * xv, 'W', 3)}`, 1.1, -0.7, { align: 'center', color: 'gold', size: 12, weight: 600 });
          // ---- E_T and P_T
          const Es = E.map((y, i) => [TG[i], A2 * y]), Ps = E.map((y, i) => [TG[i], (A2 * y) / (2 * TG[i])]);
          const span = (pts) => { const ys = pts.map((p) => p[1]).filter((y) => y > 0); const lo = Math.min(...ys), hi = Math.max(...ys); return [Math.max(1e-6, lo / 3), hi * 3]; };
          sE.setView(null, span(Es)); sP.setView(null, span(Ps));
          if (key === 'pulse') { sE.hline(A2 / 2, { color: 'green', width: 1.6, dash: [6, 4] }); sE.text('A²τ/2', T1 * 0.8, A2 / 2, { dy: -9, align: 'right', color: 'green', size: 12, weight: 600 }); }
          if (key === 'tone') { sP.hline(A2 / 2, { color: 'green', width: 1.6, dash: [6, 4] }); sP.text('A²/2', T1 * 0.8, A2 / 2, { dy: -9, align: 'right', color: 'green', size: 12, weight: 600 }); }
          sE.path(Es, { color: 'accent', width: 2.4 }); sP.path(Ps, { color: 'purple', width: 2.4 });
          sE.vline(T, { color: 'gold', width: 1.2, dash: [4, 3] }); sP.vline(T, { color: 'gold', width: 1.2, dash: [4, 3] });
          sE.dot(T, ET, { color: 'gold', r: 5.5 }); sP.dot(T, PT, { color: 'gold', r: 5.5 });
          st = { key, A2, T, ET, PT };
        }, { period: 6, still: 5.2 });
        v.legend([['gold', 'instantaneous power $|x(t)|^2$; area = $E_T$', { area: true }], ['accent', '$x(t)$ (V)'], ['green', 'average height $P_T$; limits $E_\\infty$, $P_\\infty$', { dash: true }], ['red', 'cursor']]);
        v.readout(() => {
          if (!st) return '';
          const { key, A2, T, ET, PT } = st;
          const nums = `$T$ = ${M.si(T, 's')}: $E_T$ = ${M.si(ET, 'J')}, $P_T=E_T/2T$ = ${M.si(PT, 'W')}`;
          const verdict = {
            pulse: `**energy signal**: $E_T\\to A^2\\tau/2$ = ${M.si(A2 / 2, 'J')} ($\\tau$ = 1 s), so $P_T\\le E_\\infty/2T\\to0$`,
            tone: `**power signal**: $P_T\\to A^2/2$ = ${M.si(A2 / 2, 'W')} (the mean of $\\cos^2$ is $\\tfrac12$), so $E_T\\approx A^2T\\to\\infty$`,
            ramp: `**neither**: $E_T=A^2T^3/3$ and $P_T=A^2T^2/6$ both grow without bound`,
            slow: `**neither**: $E_T=2A^2\\ln(1+T)$ grows without bound (slowly) while $P_T\\to0$`,
          }[key];
          return `${nums} · ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Concept',
      name: 'Signals as vectors: inner product, norm and orthogonality',
      statement: String.raw`Finite-energy signals on an interval $[0,T]$ form a vector space with the **inner product**
$$\langle x,y\rangle=\int_0^T x(t)\,\overline{y(t)}\,dt ,$$
the **norm** $\|x\|=\sqrt{\langle x,x\rangle}$ (the square root of the energy) and the **angle** $\theta$ given by $\cos\theta=\Re\langle x,y\rangle/(\|x\|\,\|y\|)$; $x$ and $y$ are **orthogonal** when $\langle x,y\rangle=0$. Plane geometry then holds verbatim: the Cauchy–Schwarz inequality $|\langle x,y\rangle|\le\|x\|\,\|y\|$, the law of cosines $\|x+y\|^2=\|x\|^2+\|y\|^2+2\Re\langle x,y\rangle$ (Pythagoras when $x\perp y$), and the best approximation of $y$ by a multiple of $x$ is the projection $\frac{\langle y,x\rangle}{\|x\|^2}\,x$. Sinusoids with whole numbers of cycles in $[0,T]$ are mutually orthogonal: $\int_0^T\cos(2\pi kt/T)\cos(2\pi mt/T)\,dt=0$ for whole numbers $k\ne m$, and $\cos$ and $\sin$ of the same harmonic are orthogonal.`,
      idea: String.raw`The integral is linear in each slot and $\langle x,x\rangle=\int|x|^2\ge0$, so it is an inner product (rca-4.1) and everything proved for inner product spaces applies, Schwarz's inequality (rca-4.2) included. Any two signals span a plane, and Gram–Schmidt places them in it isometrically: $x$ along an axis at length $\|x\|$, $y$ at angle $\theta$ with length $\|y\|$. Orthogonality of harmonics is the identity $\cos a\cos b=\tfrac12[\cos(a-b)+\cos(a+b)]$: both terms complete whole cycles and integrate to $0$ unless $k=m$. Fourier series (chapter 4) will expand signals in this orthogonal family, with coefficients that are projections.`,
      caption: String.raw`Left: two signals on $[0,1]$ s, $x(t)=\cos 2\pi kt$ (blue) and $y(t)=A\cos(2\pi ft+\phi)$ (orange). Below, their product: green area counts positive, red negative, and the net area is $\langle x,y\rangle$. Right: the same two signals as arrows, with lengths $\|x\|,\|y\|$ and the angle from the inner product, plus the projection of $y$ onto $x$ (dashed) and the sum $x+y$. Make $f$ a different whole number, or set $\phi=90^\circ$ with $f=k$, and the arrows become perpendicular; give $f$ a fractional value and orthogonality is lost.`,
      deps: ['sig-1.11', 'rca-4.1', 'rca-4.2'],
      refs: ['Lathi ch. 6'],
      tags: ['inner product', 'orthogonality'],
      viz(v) {
        const M = v.M, NI = 2000;
        const kS = v.slider('harmonic $k$ of $x$', 1, 5, 1, { int: true });
        const fS = v.slider('frequency $f$ of $y$ (Hz)', 0, 6, 1, { step: 0.05 });
        const pS = v.slider('phase $\\phi$ of $y$', 0, 360, 50, { step: 1, fmt: (x) => Math.round(x) + '°' });
        const aS = v.slider('amplitude $A$ of $y$', 0.3, 1.5, 1, { step: 0.05 });
        const s1 = v.stage({ x: [-0.035, 1], y: [-1.65, 1.65], height: 200, axes: 'box', yticks: [-1, 0, 1], weight: 1.35, title: 'the signals $x(t)$ and $y(t)$ on $[0,1]$ s, and the projection of $y$ on $x$' });
        const s3 = v.stage({ x: [-1.5, 2.4], y: [-0.25, 1.5], equal: true, height: 200, axes: false, weight: 1, title: 'the same two signals as vectors' });
        const s2 = v.stage({ x: [-0.02, 1], y: [-1.65, 1.65], height: 175, axes: 'box', yticks: [-1, 0, 1], xlabel: 't (s)', full: true, title: 'the product $x(t)\\,y(t)$: its net area is $\\langle x,y\\rangle$' });
        let st = null;
        v.render(() => {
          const k = kS.value, f = fS.value, ph = (pS.value * Math.PI) / 180, A = aS.value;
          const x = (t) => Math.cos(TAU * k * t), y = (t) => A * Math.cos(TAU * f * t + ph), p = (t) => x(t) * y(t);
          const xy = M.integrate(p, 0, 1, NI), xx = M.integrate((t) => x(t) ** 2, 0, 1, NI), yy = M.integrate((t) => y(t) ** 2, 0, 1, NI), ss = M.integrate((t) => (x(t) + y(t)) ** 2, 0, 1, NI);
          const nx = Math.sqrt(xx), ny = Math.sqrt(yy), c = xy / (nx * ny), cl = M.clamp(c, -1, 1), th = Math.acos(cl), proj = xy / xx;
          // ---- signals
          s1.hline(0, { color: 'faint', width: 1 });
          s1.fn((t) => proj * x(t), { color: 'accent', width: 1.6, dash: [5, 4] });
          s1.fn(x, { color: 'accent', width: 2.4 }); s1.fn(y, { color: 'orange', width: 2.4 });
          // ---- product
          s2.hline(0, { color: 'faint', width: 1 });
          s2.fn((t) => Math.max(0, p(t)), { color: 'green', width: 0.01, fill: 'green', fillAlpha: 0.3 });
          s2.fn((t) => Math.min(0, p(t)), { color: 'red', width: 0.01, fill: 'red', fillAlpha: 0.3 });
          s2.fn(p, { color: 'ink', width: 1.6 });
          s2.corner(`net area ⟨x, y⟩ = ${v.fix(Math.abs(xy) < 5e-12 ? 0 : xy, 4)}`, 'tr', { color: Math.abs(xy) < 1e-6 ? 'green' : 'ink', weight: 600 });
          // ---- vectors (Gram–Schmidt coordinates: x on the axis, y at angle θ)
          const S = 1.2, X = [nx * S, 0], Y = [ny * S * cl, ny * S * Math.sin(th)];
          s3.line(-1.45, 0, 2.35, 0, { color: 'faint', width: 1 });
          s3.poly([[0, 0], X, [X[0] + Y[0], X[1] + Y[1]], Y], { fill: 'muted', fillAlpha: 0.06, color: 'faint', width: 1, dash: [3, 4] });
          s3.arrow(0, 0, X[0] + Y[0], X[1] + Y[1], { color: 'muted', width: 1.6 });
          s3.line(Y[0], Y[1], proj * X[0], 0, { color: 'accent', width: 1.2, dash: [4, 3] });
          if (Math.abs(c) < 1e-6) { const q = 0.09; s3.path([[q, 0], [q, q], [0, q]], { color: 'green', width: 1.6 }); }
          else if (Y[1] > 0.02) s3.curve((u) => [0.22 * Math.cos(u), 0.22 * Math.sin(u)], 0, th, { color: 'ink', width: 1.4, n: 50 });
          s3.dot(proj * X[0], 0, { r: 3.5, color: 'accent' });
          s3.arrow(0, 0, X[0], X[1], { color: 'accent', width: 3 }); s3.arrow(0, 0, Y[0], Y[1], { color: 'orange', width: 3 });
          s3.text('x', X[0], X[1], { dy: 13, align: 'center', math: true, color: 'accent', size: 17 });
          s3.text('y', Y[0], Y[1], { dx: Y[0] < 0 ? -9 : 9, dy: -6, align: Y[0] < 0 ? 'right' : 'left', math: true, color: 'orange', size: 17 });
          s3.text('x + y', X[0] + Y[0], X[1] + Y[1], { dx: 8, dy: -6, align: 'left', math: true, color: 'muted', size: 15 });
          s3.corner(`θ = ${v.fix((th * 180) / Math.PI, 1)}°`, 'tl', { color: Math.abs(c) < 1e-6 ? 'green' : 'ink', weight: 600, size: 13 });
          st = { xy, nx, ny, c, th, ss, proj, k, f };
        });
        v.legend([['accent', '$x(t)=\\cos 2\\pi kt$'], ['orange', '$y(t)=A\\cos(2\\pi ft+\\phi)$'], ['accent', 'projection of $y$ on $x$', { dash: true }], ['green', 'positive area', { area: true }], ['red', 'negative area', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { xy, nx, ny, c, th, ss, proj, k, f } = st, zero = Math.abs(xy) < 1e-6;
          const why = zero ? (Math.abs(f - k) > 1e-9 ? ` — different whole numbers of cycles, so orthogonal` : ' — cosine against sine of the same harmonic, so orthogonal') : Math.abs(f - Math.round(f)) > 1e-9 ? ' — $f$ is not a whole number, so $y$ does not complete its cycles in $[0,1]$' : Math.abs(f - k) < 1e-9 ? ' — the same harmonic, so $\\cos\\theta=\\cos\\phi$: the angle between the vectors is the phase difference' : '';
          return `$\\langle x,y\\rangle=\\int_0^1xy\\,dt$ = ${v.fix(zero ? 0 : xy, 4)}${why} · $\\|x\\|$ = ${v.fix(nx, 4)}, $\\|y\\|$ = ${v.fix(ny, 4)}, $\\cos\\theta$ = ${v.fix(zero ? 0 : c, 4)}, $\\theta$ = ${v.fix((th * 180) / Math.PI, 2)}° · Cauchy–Schwarz: ${v.fix(Math.abs(xy), 4)} $\\le$ ${v.fix(nx * ny, 4)} · $\\|x+y\\|^2$ = ${v.fix(ss, 4)} $=\\|x\\|^2+\\|y\\|^2+2\\langle x,y\\rangle$ = ${v.fix(nx * nx + ny * ny + 2 * xy, 4)} · best multiple of $x$ approximating $y$: ${v.fix(zero ? 0 : proj, 4)}$\\,x$`;
        });
      },
    },
  ],
};
