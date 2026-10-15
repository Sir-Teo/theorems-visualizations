// Psychology & Perception — Chapter 1: Thresholds and the psychophysical methods (items 1.7–1.13)

// ---------- shared helpers (the same as in ch01.js; part files cannot import) ----------
const SQ2PI = Math.sqrt(2 * Math.PI);
/** Standard normal distribution function (M = v.M). */
const Phi = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);
/** Standard normal density. */
const phi = (z) => Math.exp(-0.5 * z * z) / SQ2PI;
/** Psychometric function ψ(x) = γ + (1 − γ − λ)·Φ((x − μ)/σ) of an observer or a fit f = {mu, sigma, g, l}. */
const psi = (M, f, x) => f.g + (1 - f.g - f.l) * Phi(M, (x - f.mu) / f.sigma);
/** Choices for the "who is the subject" control. */
const OBS = [{ value: 'sim', label: 'simulated observer' }, { value: 'you', label: 'you' }];
/** Trials [{x, r}] grouped by level → [{x, n, k}], sorted by x. */
function binTrials(trials) {
  const m = new Map();
  for (const t of trials) { const e = m.get(t.x) || { x: t.x, n: 0, k: 0 }; e.n++; if (t.r) e.k++; m.set(t.x, e); }
  return [...m.values()].sort((a, b) => a.x - b.x);
}
/** Wilson 95% interval for k successes in n trials. */
function wilson(k, n, z = 1.96) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
/** Nelder–Mead minimum of f(a, b), started at x0 with initial steps `step`. */
function nelder(f, x0, step, iters = 260) {
  const ev = (p) => ({ p, v: f(p[0], p[1]) });
  let S = [ev(x0), ev([x0[0] + step[0], x0[1]]), ev([x0[0], x0[1] + step[1]])];
  for (let it = 0; it < iters; it++) {
    S.sort((a, b) => a.v - b.v);
    const [B, G, W] = S;
    if (it > 30 && W.v - B.v < 1e-10) break;
    const c = [(B.p[0] + G.p[0]) / 2, (B.p[1] + G.p[1]) / 2], at = (t) => [c[0] + t * (W.p[0] - c[0]), c[1] + t * (W.p[1] - c[1])];
    const R = ev(at(-1));
    if (R.v < B.v) { const E = ev(at(-2)); S[2] = E.v < R.v ? E : R; }
    else if (R.v < G.v) S[2] = R;
    else {
      const K = ev(at(R.v < W.v ? -0.5 : 0.5));
      if (K.v < Math.min(R.v, W.v)) S[2] = K;
      else S = [B, ev([(G.p[0] + B.p[0]) / 2, (G.p[1] + B.p[1]) / 2]), ev([(W.p[0] + B.p[0]) / 2, (W.p[1] + B.p[1]) / 2])];
    }
  }
  S.sort((a, b) => a.v - b.v);
  return S[0];
}
/** Maximum-likelihood fit of g + (1 − g − l)Φ((x − μ)/σ) to binned data, with Wald covariance (see ch01.js). */
function fitPsy(M, data, o) {
  const g = o.g ?? 0, l = o.l ?? 0.01, lo = o.lo, hi = o.hi, Rg = hi - lo;
  const pts = data.filter((d) => d.n > 0), N = pts.reduce((s, d) => s + d.n, 0);
  if (pts.length < 2 || N < 6) return null;
  const sMin = Math.log(Rg / 400), sMax = Math.log(Rg * 2), mMin = lo - Rg, mMax = hi + Rg;
  const nll = (mu, ls) => {
    const s = Math.exp(ls); let L = 0;
    for (const d of pts) {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, g + (1 - g - l) * Phi(M, (d.x - mu) / s)));
      L -= d.k * Math.log(p) + (d.n - d.k) * Math.log(1 - p);
    }
    const e = Math.max(0, sMin - ls) + Math.max(0, ls - sMax) + (Math.max(0, mMin - mu) + Math.max(0, mu - mMax)) / Rg;
    return L + 1e3 * e * e;
  };
  let best = null;
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 10; j++) {
    const mu = lo + (Rg * i) / 20, ls = sMin + ((sMax - sMin) * j) / 10, val = nll(mu, ls);
    if (!best || val < best.v) best = { p: [mu, ls], v: val };
  }
  const opt = nelder(nll, best.p, [Rg / 20, 0.3]);
  const [mu, ls] = opt.p, f0 = opt.v, hm = Rg * 1e-3, hs = 1e-3;
  const fmm = (nll(mu + hm, ls) - 2 * f0 + nll(mu - hm, ls)) / (hm * hm);
  const fss = (nll(mu, ls + hs) - 2 * f0 + nll(mu, ls - hs)) / (hs * hs);
  const fms = (nll(mu + hm, ls + hs) - nll(mu + hm, ls - hs) - nll(mu - hm, ls + hs) + nll(mu - hm, ls - hs)) / (4 * hm * hs);
  const det = fmm * fss - fms * fms;
  const edge = ls < sMin + 0.05 || ls > sMax - 0.05 || mu < mMin + 1e-3 * Rg || mu > mMax - 1e-3 * Rg;
  let cov = det > 0 && fmm > 0 && !edge ? [fss / det, -fms / det, fmm / det] : null;
  if (cov && !(Math.sqrt(cov[0]) < Rg)) cov = null;
  return { mu, sigma: Math.exp(ls), ls, g, l, cov, ok: !!cov, nll: f0, N };
}
/** Level at which a fit reaches probability p, with its delta-method standard error. */
function thrOf(M, f, p) {
  const q = M.dist.normal(0, 1).quantile(Math.min(0.999, Math.max(0.001, (p - f.g) / (1 - f.g - f.l)))), x = f.mu + f.sigma * q;
  if (!f.cov) return { x, se: NaN };
  const a = f.sigma * q;
  return { x, se: Math.sqrt(Math.max(0, f.cov[0] + 2 * a * f.cov[1] + a * a * f.cov[2])) };
}
/** Draw a fitted psychometric curve over [a, b] with its pointwise 95% band; X maps the fit's x to plot x. */
function drawFit(s, M, f, a, b, o = {}) {
  const col = o.color || 'accent', n = 100, up = [], dn = [], mid = [], A = 1 - f.g - f.l, X = o.X || ((x) => x);
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n, z = (x - f.mu) / f.sigma;
    mid.push([X(x), f.g + A * Phi(M, z)]);
    if (f.cov) {
      const sd = Math.sqrt(Math.max(0, f.cov[0] / (f.sigma * f.sigma) + (2 * z * f.cov[1]) / f.sigma + z * z * f.cov[2]));
      up.push([X(x), f.g + A * Phi(M, z + 1.96 * sd)]); dn.push([X(x), f.g + A * Phi(M, z - 1.96 * sd)]);
    }
  }
  if (up.length && o.band !== false) s.poly([...up, ...dn.reverse()], { fill: col, fillAlpha: o.bandAlpha ?? 0.16, stroke: false });
  s.path(mid, { color: col, width: o.width ?? 2.6, dash: o.dash });
}
/** Proportions per level as dots (area ∝ trials) with Wilson 95% bars; X maps level to plot x. */
function drawData(s, data, o = {}) {
  const col = o.color || 'ink', nMax = Math.max(1, ...data.map((d) => d.n)), X = o.X || ((x) => x);
  for (const d of data) {
    const [a, b] = wilson(d.k, d.n);
    s.line(X(d.x), a, X(d.x), b, { color: col, width: 1.3, alpha: 0.5 });
    s.dot(X(d.x), d.k / d.n, { r: (o.r ?? 2.6) + 3.4 * Math.sqrt(d.n / nMax), color: col });
  }
}
/** setTimeout that redraws afterwards and dies with the viz; after.clear() cancels everything pending. */
function timers(v) {
  const ids = new Set();
  const after = (ms, fn) => { const id = setTimeout(() => { ids.delete(id); fn(); v.invalidate(); }, ms); ids.add(id); return id; };
  after.clear = () => { for (const id of ids) clearTimeout(id); ids.clear(); };
  v.onCleanup(after.clear);
  return after;
}
/** A playhead that follows a sound for `dur` seconds, redrawing about 25 times a second; ph.t = elapsed time or null. */
function playhead(v) {
  let t0 = 0, dur = 0, id = 0;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; v.invalidate(); };
  v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d) { if (id) clearInterval(id); t0 = performance.now(); dur = d; id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 60) stop(); else v.invalidate(); }, 40); v.invalidate(); },
    stop,
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
  };
}
/** sRGB encoding (0–255, not rounded) of a relative luminance in [0, 1]. */
const srgb = (L) => 255 * (L <= 0.0031308 ? 12.92 * L : 1.055 * Math.pow(L, 1 / 2.4) - 0.055);
/** Round a grey value up or down at random in proportion to its fraction (spatial dithering), as [g, g, g]. */
const dither = (val, r) => { const f = Math.floor(val), g = Math.max(0, Math.min(255, f + (r() < val - f ? 1 : 0))); return [g, g, g]; };
/** Percent with no decimals (one below 10%). */
const pc = (x) => (100 * x).toFixed(x < 0.1 ? 1 : 0) + '%';
/** Log-axis tick list [[log10 value, label]] for values between 10^a and 10^b (1, 2, 5 per decade). */
function logTicks(a, b) {
  const out = [];
  for (let e = Math.floor(a); e <= Math.ceil(b); e++) for (const m of [1, 2, 5]) { const u = e + Math.log10(m); if (u >= a - 1e-9 && u <= b + 1e-9) { const x = m * 10 ** e; out.push([u, x >= 1 ? String(Math.round(x)) : x.toPrecision(1)]); } }
  return out;
}

export default {
  collection: 'psych',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Method',
      name: 'Adaptive staircases (up–down methods)',
      statement: String.raw`In an **adaptive staircase** the stimulus level on each trial depends on the previous answers. In the **transformed up–down** rule “1-up–$n$-down” (Levitt, 1971) the level goes **down** one step after $n$ consecutive correct answers and **up** one step after every error. A *reversal* is a trial where the direction of change flips; the threshold estimate is the mean of the reversal levels (in log units, after discarding the first few).

The track hovers around the level $x_p$ at which a step down and a step up are equally likely. If $p=\psi(x)$ is the probability of a correct answer there, a step down needs $n$ correct answers in a row, so
$$p^{\,n}=\tfrac12\quad\Longrightarrow\quad p=2^{-1/n}:\qquad 50\%\ (n=1),\quad 70.7\%\ (n=2),\quad 79.4\%\ (n=3).$$
Staircases spend almost all trials near threshold, so they are far more efficient than constant stimuli (1.4). The target must lie above the guessing floor: in two-alternative forced choice (1.8) the 1-up–1-down rule aims at 50% correct, which is pure guessing, and the track sinks to the smallest level with no threshold to find.`,
      idea: String.raw`The level performs a random walk (a Markov chain on the grid of levels, stoch-1.1) whose drift is downward where $\psi^{\,n}>\tfrac12$ and upward where $\psi^{\,n}<\tfrac12$. Because $\psi$ increases, the drift changes sign exactly once, at $\psi(x)=2^{-1/n}$, and the walk keeps returning to that point; reversals happen where it turns around, on both sides of it, so their average estimates it. Steps that are equal in **log** units make the walk symmetric for stimuli whose discriminability depends on ratios. With a rule whose balance point is at chance, the drift is downward everywhere above zero and nothing stops the descent.`,
      caption: String.raw`Top: one run of a staircase on a simulated listener discriminating pitch: green dots correct, red wrong, gold rings the reversals, the gold line the estimate (mean of the reversals after the first two) and the green line the level the rule aims at. Bottom left: the listener's psychometric function and the three targets; bottom right: estimates from 300 independent runs, centred on the target. Change the **rule** (try 1-up–1-down), the **step factor** and the **trials per run**. Switch to **you**: *▶ Play trial* plays two tones, one of them higher by the staircase's current number of cents; say which, and the next trial follows at the level the rule picks.`,
      deps: ['psych-1.3', 'stoch-1.1'],
      refs: ['Gescheider ch. 3', 'M&C ch. 11'],
      tags: ['method', 'adaptive'],
      credit: 'Dixon & Mood, 1948; Levitt, 1971',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Psychophysics#Staircase_procedures' },
      viz(v) {
        const M = v.M, after = timers(v), F0 = 600, D1 = 10, LAPSE = 0.02, FLOOR = 0.3, CEIL = 200, START = 40, RUNS = 300;
        const pcorr = (d) => LAPSE / 2 + (1 - LAPSE) * Phi(M, d / D1 / Math.SQRT2);
        const xTarget = (p) => { if (p <= 0.5 + 1e-9) return null; let a = -3, b = 4; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (pcorr(10 ** m) < p) a = m; else b = m; } return 10 ** ((a + b) / 2); };
        let phase = 'idle', order = 1, seed = 7, cache = null, cKey = '';
        const rule = v.select('rule', [{ value: '1', label: '1-up–1-down' }, { value: '2', label: '1-up–2-down' }, { value: '3', label: '1-up–3-down' }], '2');
        const fS = v.slider('step factor', 1.12, 2, 1.41, { step: 0.01, fmt: (x) => '×' + x.toFixed(2) });
        const nS = v.slider('trials per run', 20, 120, 60, { int: true });
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; v.sound().stop(); } });
        const bNew = v.button('New random run', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const bPlay = v.soundButton('▶ Play trial', () => next());
        const b1 = v.button('1st higher', () => answer(1));
        const b2 = v.button('2nd higher', () => answer(2));
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; ys = fresh(); });
        const tr = v.stage({ x: [-1, 61], y: [FLOOR, CEIL], ylog: true, height: 250, axes: 'box', full: true, xlabel: 'trial', title: 'one staircase: pitch difference Δ in cents (log scale)' });
        const pf = v.stage({ x: [0.3, 150], y: [0.4, 1.04], xlog: true, height: 230, axes: 'box', weight: 1, xlabel: 'Δ (cents)', yticks: [0.5, 0.6, 0.707, 0.794, 0.9, 1], title: 'the simulated listener: P(correct)' });
        const hs = v.stage({ x: [FLOOR, CEIL], y: [0, 10], xlog: true, height: 230, axes: 'box', weight: 1, xlabel: 'estimate (cents)', yticks: [], title: `estimates from ${RUNS} runs` });
        const fresh = () => ({ L: START, run: 0, dir: 0, pts: [], rev: [] });
        const stepStair = (S, ok, n, f) => {
          S.pts.push({ t: S.pts.length, L: S.L, ok });
          let move = 0;
          if (ok) { if (++S.run >= n) { move = -1; S.run = 0; } } else { S.run = 0; move = 1; }
          if (move) { if (S.dir && move !== S.dir) S.rev.push({ t: S.pts.length - 1, L: S.L }); S.dir = move; S.L = M.clamp(move < 0 ? S.L / f : S.L * f, FLOOR, CEIL); }
        };
        const estimate = (rev) => { let r = rev.slice(2); if (r.length % 2) r = r.slice(1); return r.length >= 2 ? { x: 10 ** M.mean(r.map((q) => Math.log10(q.L))), used: r.length, from: rev.length - r.length } : null; };
        const simRun = (r, n, f, T) => { const S = fresh(); for (let t = 0; t < T; t++) stepStair(S, r() < pcorr(S.L), n, f); return S; };
        let ys = fresh();
        const Ry = v.rng(99);
        const next = () => {
          if (who.value !== 'you' || phase === 'play') return;
          const snd = v.sound(); snd.stop();
          order = Ry() < 0.5 ? 1 : 2;
          const hi = F0 * Math.pow(2, ys.L / 1200), voice = { harmonics: 4, rolloff: 1.3, gain: 0.22, attack: 0.02, release: 0.06, duration: 0.4 };
          snd.tone(order === 1 ? hi : F0, voice); snd.tone(order === 1 ? F0 : hi, { ...voice, delay: 0.7 });
          phase = 'play'; after(1150, () => { phase = 'wait'; });
        };
        const answer = (k) => { if (who.value !== 'you' || phase !== 'wait') return; stepStair(ys, k === order, +rule.value, fS.value); phase = 'idle'; after(700, next); };
        v.legend([['green', 'correct', { dot: true }], ['red', 'wrong', { dot: true }], ['gold', 'reversals and the estimate'], ['green', 'target level of the rule', { dash: true }]]);
        let st = null;
        v.render(() => {
          const isYou = who.value === 'you', n = +rule.value, f = fS.value, T = nS.value, p = 2 ** (-1 / n), xt = xTarget(p);
          bNew.hidden = isYou; nS.el.hidden = isYou; bPlay.hidden = b1.hidden = b2.hidden = bRes.hidden = !isYou;
          const S = isYou ? ys : simRun(v.rng(seed), n, f, T), est = estimate(S.rev);
          // ---- the track
          const tmax = Math.max(isYou ? 30 : T, S.pts.length + 1);
          tr.setView([-1, tmax + 1], null);
          if (xt) { tr.hline(xt, { color: 'green', dash: [7, 5], width: 1.6 }); tr.text(`target: ${(100 * p).toFixed(1)}% correct at ${v.fix(xt, 1)} ¢`, tmax, xt, { dy: -9, align: 'right', color: 'green', weight: 600, size: 12 }); }
          else tr.text('target 50% = guessing: no threshold to converge on', tmax, 120, { align: 'right', color: 'red', weight: 600, size: 12 });
          if (S.pts.length > 1) tr.path(S.pts.map((q) => [q.t, q.L]), { color: 'muted', width: 1.2 });
          if (isYou && phase !== 'idle' || isYou && S.pts.length) tr.dot(S.pts.length, S.L, { r: 4, color: 'gold', hollow: true });
          S.rev.forEach((q, i) => { tr.dot(q.t, q.L, { r: 7.5, color: 'gold', hollow: true, width: 2 }); if (i < 30) tr.text(String(i + 1), q.t, q.L, { dy: q.L > 1.2 * (xt || 1) ? -14 : 14, align: 'center', color: 'gold', size: 10, weight: 600 }); });
          for (const q of S.pts) tr.dot(q.t, q.L, { r: 3.4, color: q.ok ? 'green' : 'red' });
          if (est) {
            const t0 = S.rev[est.from].t;
            tr.line(t0, est.x, tmax + 1, est.x, { color: 'gold', width: 2.4 });
            tr.text(`estimate ${v.fix(est.x, 1)} ¢`, t0, est.x, { dy: est.x < (xt || 0) ? 14 : -11, dx: 2, align: 'left', color: 'gold', weight: 700, size: 12 });
          }
          if (isYou && !S.pts.length) tr.text('press ▶ Play trial: which of the two tones is higher?', tmax / 2, 90, { align: 'center', color: 'muted', size: 13 });
          // ---- the listener's psychometric function
          pf.fn(pcorr, { color: 'ink', width: 2.2 });
          for (const k of [1, 2, 3]) {
            const pk = 2 ** (-1 / k), xk = xTarget(pk), on = k === n;
            pf.hline(pk, { color: on ? 'green' : 'faint', dash: [4, 4], width: on ? 1.6 : 1 });
            if (xk) { pf.line(xk, 0.4, xk, pk, { color: on ? 'green' : 'faint', dash: [3, 3], width: on ? 1.6 : 1 }); pf.dot(xk, pk, { r: on ? 5 : 3.5, color: on ? 'green' : 'muted' }); }
          }
          pf.text('1-up–2-down', 0.4, 0.707, { dy: -8, align: 'left', color: n === 2 ? 'green' : 'muted', size: 11 });
          pf.text('1-up–3-down', 0.4, 0.794, { dy: -8, align: 'left', color: n === 3 ? 'green' : 'muted', size: 11 });
          pf.text('1-up–1-down: chance', 0.4, 0.5, { dy: -8, align: 'left', color: n === 1 ? 'red' : 'muted', size: 11 });
          // ---- many runs
          const key = [n, f, T, seed].join('|');
          if (key !== cKey) {
            cKey = key; const R = v.rng(seed * 31 + 5), xs = [];
            for (let i = 0; i < RUNS; i++) { const e = estimate(simRun(R, n, f, T).rev); if (e) xs.push(e.x); }
            const edges = M.range(41).map((i) => FLOOR * Math.pow(CEIL / FLOOR, i / 40)), H = M.histogram(xs, { bins: edges });
            const lg = xs.map(Math.log10);
            cache = { H, n: xs.length, gm: xs.length ? 10 ** M.mean(lg) : NaN, sd: xs.length > 1 ? M.stdev(lg) : NaN };
          }
          const ymax = Math.max(4, ...cache.H.counts) * 1.25;
          hs.setView(null, [-0.12 * ymax, ymax]);
          hs.hist(cache.H, { color: 'gold', fillAlpha: 0.45 });
          if (xt) { hs.vline(xt, { color: 'green', dash: [6, 4], width: 1.8 }); }
          if (isFinite(cache.gm)) { hs.vline(cache.gm, { color: 'gold', width: 2 }); hs.text(`mean ${v.fix(cache.gm, 1)} ¢`, cache.gm, ymax * 0.9, { dx: 6, align: 'left', color: 'gold', weight: 700, size: 11.5 }); }
          st = { n, p, xt, est, S, isYou };
        });
        v.readout(() => {
          if (!st) return '';
          const { n, p, xt, est, S, isYou } = st;
          const head = `rule 1-up–${n}-down: balance where $p^{${n}}=\\tfrac12$, i.e. $p$ = ${(100 * p).toFixed(1)}%`;
          const tgt = xt ? `, which this listener reaches at ${v.fix(xt, 2)} ¢` : ': in 2AFC that is chance, so there is no threshold to find';
          const run = est ? `${isYou ? 'your' : 'this'} run: ${S.pts.length} trials, ${S.rev.length} reversals, estimate ${v.fix(est.x, 2)} ¢ (mean of the last ${est.used})` : `${isYou ? 'your' : 'this'} run: ${S.pts.length} trials, ${S.rev.length} reversals${S.pts.length ? ' — not enough reversals for an estimate yet' : ''}`;
          const many = isFinite(cache.gm) ? ` · ${cache.n} simulated runs: geometric mean ${v.fix(cache.gm, 2)} ¢${xt ? ` (${cache.gm > xt ? '+' : '−'}${v.fix(Math.abs(100 * (cache.gm / xt - 1)), 0)}% from the target)` : ''}, run-to-run spread ×÷${v.fix(10 ** cache.sd, 2)}` : '';
          return `${head}${tgt} · ${run}${many}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Two-alternative forced choice (2AFC)',
      statement: String.raw`In **two-alternative forced choice** every trial contains two observation intervals (or two locations), exactly one of which holds the stimulus, in random order; the observer must say which. The proportion correct runs from $50\%$ (guessing) to $100\%$, and the threshold is conventionally the level giving $75\%$ correct, halfway between chance and perfection.

The point of the design is that the observer does not need a criterion. In a yes/no task the observer decides whether one observation is large enough to call “yes”, and a cautious observer says “yes” less often to the same stimulus, so the yes/no threshold moves with willingness. In 2AFC the observer only compares the two observations and picks the larger, which in the Gaussian model gives
$$P_c=\Phi\big(d'/\sqrt2\big),$$
a function of sensitivity $d'$ alone. 2AFC estimates are therefore nearly free of response bias (a residual bias toward one interval lowers $P_c$ only slightly); the cost is the guessing floor, which makes each trial carry less information than a yes/no trial near threshold.`,
      idea: String.raw`If the internal response to noise is $N(0,1)$ and to the signal $N(d',1)$, the difference between the signal interval and the noise interval is $N(d',2)$ (independent normals add, prob-2.1.20), and choosing the larger observation is correct exactly when that difference is positive: $P_c=\Phi(d'/\sqrt2)$. No criterion appears. In yes/no, the same observer with criterion $k$ has hit rate $\Phi(d'-k)$ and false-alarm rate $\Phi(-k)$, both of which move with $k$; the separation of sensitivity from bias is the subject of signal detection theory (chapter 2).`,
      caption: String.raw`The stimulus is a faint grating (vertical stripes) in visual noise. With the simulated observer, the two intervals are shown side by side, the grating at the contrast of the **gold** handle in interval 2. On the right, blue is 2AFC accuracy with its fitted curve and 75% threshold; orange is the same observer's yes/no hit rate, red its false-alarm rate. Drag the **criterion** slider: the yes/no curve and its threshold slide, the 2AFC curve does not move. Switch to **you**: *▶ Show the two intervals* flashes interval 1 and then interval 2 at the centre; say which one held the stripes.`,
      deps: ['psych-1.3', 'prob-2.1.20'],
      refs: ['M&C ch. 7'],
      tags: ['method', 'forced choice'],
      credit: 'Blackwell, 1953; Green & Swets, 1966',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Two-alternative_forced_choice' },
      viz(v) {
        const M = v.M, after = timers(v), BG = 128, NS = 9, LEV = [1.5, 3, 4.5, 6, 8, 11, 15], C0 = 5, BX = 1.5, NT = 40, LP = 0.02;
        const R = 0.46, SG = 0.15, FR = 4.2, XMAX = 16;
        const dp = (c) => Math.pow(Math.max(0, c) / C0, BX);
        const p2 = (c) => LP / 2 + (1 - LP) * Phi(M, dp(c) / Math.SQRT2);
        const pYes = (c, k) => LP / 2 + (1 - LP) * Phi(M, dp(c) - k);
        let phase = 'idle', cur = null, target = 1, tid = 0, seed = 17, U = null, uSeed = -1, last = null;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const kS = v.slider('yes/no criterion $k$', -0.3, 2.5, 1, { step: 0.01 });
        const bShow = v.button('▶ Show the two intervals', () => show());
        const bI1 = v.button('Interval 1', () => answer(1));
        const bI2 = v.button('Interval 2', () => answer(2));
        const bNew = v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; you = []; last = null; });
        const st = v.stage({ x: [-1.15, 1.15], y: [-0.82, 0.78], equal: true, axes: false, height: 290, weight: 0.85, title: 'the stimulus' });
        const pl = v.stage({ x: [-1.2, XMAX + 0.2], y: [-0.14, 1.08], height: 290, axes: 'box', weight: 1.15, xlabel: 'grating contrast (%)', yticks: [0, 0.25, 0.5, 0.75, 1], title: 'proportion correct (2AFC) and proportion “yes” (yes/no)' });
        let fit2 = null;
        const probe = pl.handle(5, 0.7, { color: 'gold', constrain: (x) => { const xx = M.clamp(x, 0.5, 15.5); return [xx, fit2 ? psi(M, fit2, xx) : p2(xx)]; } });
        let you = [];
        const Ry = v.rng(808), queue = [];
        const nextLevel = () => { if (!queue.length) queue.push(...Ry.shuffle(LEV)); return queue.pop(); };
        const show = () => {
          if (who.value !== 'you' || (phase !== 'idle' && phase !== 'wait')) return;
          if (phase === 'wait') return;
          cur = nextLevel(); target = Ry() < 0.5 ? 1 : 2; tid++;
          phase = 'i1'; after(320, () => { phase = 'gap'; after(480, () => { phase = 'i2'; after(320, () => { phase = 'wait'; }); }); });
        };
        const answer = (k) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ x: cur, r: k === target }); last = { c: cur, ok: k === target }; phase = 'idle'; after(600, show); };
        const sample = () => {
          if (uSeed !== seed) { const r = v.rng(seed); U = { a: LEV.map(() => M.range(NT).map(() => r())), y: LEV.map(() => M.range(NT).map(() => r())), b: M.range(2 * NT).map(() => r()) }; uSeed = seed; }
          const k = kS.value;
          const two = LEV.map((c, i) => ({ x: c, n: NT, k: U.a[i].filter((u) => u < p2(c)).length }));
          const yes = LEV.map((c, i) => ({ x: c, n: NT, k: U.y[i].filter((u) => u < pYes(c, k)).length }));
          const fa = U.b.filter((u) => u < pYes(0, k)).length / (2 * NT);
          return { two, yes, fa };
        };
        /** Gabor patches in noise centred at the given x positions (null contrast = noise only). */
        const patches = (list, key) => {
          const Rn = v.rng(7 + tid * 131 + (key.length * 17));
          st.raster((x, y) => {
            for (const [cx, c] of list) {
              const dx = x - cx, r2 = dx * dx + y * y;
              if (r2 > R * R) continue;
              const val = BG + NS * Rn.normal() + (c ? ((c * BG) / 100) * Math.cos(2 * Math.PI * FR * dx) * Math.exp(-r2 / (2 * SG * SG)) : 0);
              const g = M.clamp(Math.round(val), 0, 255); return [g, g, g];
            }
            return null;
          }, { res: 1, key, id: 'g' });
        };
        v.render(() => {
          const isYou = who.value === 'you';
          bShow.hidden = bI1.hidden = bI2.hidden = bRes.hidden = !isYou; kS.el.hidden = isYou; bNew.hidden = isYou; probe.visible = !isYou;
          const S = sample();
          const d2 = isYou ? binTrials(you) : S.two;
          fit2 = fitPsy(M, d2, { g: 0.5, l: 0.01, lo: 0, hi: XMAX });
          const fitY = isYou ? null : fitPsy(M, S.yes, { g: Math.min(0.6, S.fa), l: 0.01, lo: 0, hi: XMAX });
          v.legend(isYou ? [['accent', 'your proportion correct, fitted curve with 95% band'], ['accent', '75% threshold', { dot: true }]] : [['accent', '2AFC: proportion correct, fit, 75% threshold'], ['orange', 'yes/no: hit rate, fit, 50%-“yes” threshold'], ['red', 'yes/no: false-alarm rate (no grating)', { dash: true }], ['muted', 'chance in 2AFC', { dash: true }]]);
          // ---- stimulus
          st.rect(-3, -3, 3, 3, { fill: [BG, BG, BG], fillAlpha: 1, stroke: false });
          const lab = [228, 228, 228];
          if (!isYou) {
            patches([[-0.56, 0], [0.56, probe.x]], 'sim' + probe.x.toFixed(2));
            st.text('interval 1', -0.56, -0.62, { align: 'center', color: lab, halo: false, size: 12.5 });
            st.text('interval 2', 0.56, -0.62, { align: 'center', color: lab, halo: false, size: 12.5 });
            st.text(`grating in interval 2, contrast ${v.fix(probe.x, 1)}%`, 0, 0.64, { align: 'center', color: lab, halo: false, size: 12 });
          } else {
            if (phase === 'i1' || phase === 'i2') patches([[0, (phase === 'i1') === (target === 1) ? cur : 0]], `y${tid}${phase}`);
            for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) st.path([[a * 0.52, b * 0.4], [a * 0.52, b * 0.52], [a * 0.4, b * 0.52]], { color: [175, 175, 175], width: 2 });
            const msg = phase === 'i1' ? '1' : phase === 'i2' ? '2' : phase === 'gap' ? '' : phase === 'wait' ? 'Which interval held the stripes?' : 'press ▶ Show the two intervals';
            st.text(msg, 0, -0.66, { align: 'center', color: lab, halo: false, size: msg.length < 3 ? 20 : 12.5, weight: msg.length < 3 ? 700 : 500 });
            if (last && phase === 'idle') st.text(`last: ${v.fix(last.c, 1)}% contrast, ${last.ok ? 'correct' : 'wrong'}`, 0, 0.64, { align: 'center', color: lab, halo: false, size: 12 });
          }
          // ---- data
          pl.hline(0.5, { color: 'muted', dash: [4, 4], width: 1 });
          if (!isYou) {
            pl.hline(S.fa, { color: 'red', dash: [6, 4], width: 1.6 });
            pl.dot(0, S.fa, { r: 5, color: 'red' });
            pl.text('false alarms', XMAX, S.fa, { dy: -9, align: 'right', color: 'red', size: 11.5, weight: 600 });
            if (fitY) {
              drawFit(pl, M, fitY, 0, XMAX, { color: 'orange', bandAlpha: 0.12 });
              const ty = thrOf(M, fitY, 0.5);
              if (ty.x > 0 && ty.x < XMAX) { pl.line(ty.x, -0.14, ty.x, 0.5, { color: 'orange', dash: [4, 3], width: 1.4 }); pl.dot(ty.x, 0.5, { r: 5, color: 'orange' }); }
            }
            drawData(pl, S.yes, { color: 'orange', r: 2 });
          }
          if (fit2) {
            drawFit(pl, M, fit2, 0, XMAX);
            const t2 = thrOf(M, fit2, 0.75);
            if (t2.x > 0 && t2.x < XMAX) { pl.line(t2.x, -0.14, t2.x, 0.75, { color: 'accent', dash: [4, 3], width: 1.4 }); pl.dot(t2.x, 0.75, { r: 5, color: 'accent' }); }
          }
          drawData(pl, d2, { color: 'accent', r: 2 });
          if (!isYou) probe.y = fit2 ? psi(M, fit2, probe.x) : p2(probe.x);
          if (isYou && !you.length) pl.text('no trials yet', XMAX / 2, 0.3, { align: 'center', color: 'muted', size: 13 });
        });
        v.readout(() => {
          const isYou = who.value === 'you';
          if (isYou) {
            if (!you.length) return 'No trials yet. Press **▶ Show the two intervals**, watch the centre, and pick the interval with the stripes; when unsure, guess — guesses are part of the method.';
            const t = fit2 ? thrOf(M, fit2, 0.75) : null;
            return `${you.length} trials, ${pc(you.filter((q) => q.r).length / you.length)} correct overall${t ? ` · 75%-correct threshold ${v.fix(t.x, 2)}% contrast${isFinite(t.se) ? ` ± ${v.fix(1.96 * t.se, 2)}` : ''}` : ''}`;
          }
          const S = sample(), fY = fitPsy(M, S.yes, { g: Math.min(0.6, S.fa), l: 0.01, lo: 0, hi: XMAX });
          const t2 = fit2 ? thrOf(M, fit2, 0.75) : null, ty = fY ? thrOf(M, fY, 0.5) : null, k = kS.value;
          const true2 = C0 * Math.pow(Math.SQRT2 * M.dist.normal(0, 1).quantile((0.75 - LP / 2) / (1 - LP)), 1 / BX);
          return `criterion $k$ = ${v.fix(k, 2)}: yes/no false alarms ${pc(S.fa)} (model $\\Phi(-k)$ = ${pc(Phi(M, -k))}), 50%-“yes” threshold ${ty ? v.fix(ty.x, 2) + '%' : '—'} · 2AFC 75% threshold ${t2 ? v.fix(t2.x, 2) + '%' : '—'}${t2 && isFinite(t2.se) ? ` ± ${v.fix(1.96 * t2.se, 2)}` : ''} (true ${v.fix(true2, 2)}%), the same for every $k$: $P_c=\\Phi(d'/\\sqrt2)$ contains no criterion · at the gold contrast ${v.fix(probe.x, 1)}%: $d'$ = ${v.fix(dp(probe.x), 2)}, $P_c$ = ${pc(p2(probe.x))}, yes/no hit rate ${pc(pYes(probe.x, k))}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Law',
      name: 'Weber’s law',
      statement: String.raw`For a given kind of stimulus, the just-noticeable difference (1.2) is proportional to the intensity of the standard it is added to:
$$\Delta I = k\,I,\qquad\text{equivalently}\qquad \frac{\Delta I}{I}=k ,$$
where the constant $k$ is the **Weber fraction** of that sensory continuum. What can be noticed is a fixed *proportion*, not a fixed amount: one candle added to ten is obvious, one added to a hundred is not. Plotted against $I$, the JND falls on a **straight line through the origin** with slope $k$; on log–log axes, on a line of slope 1. Typical Weber fractions span two orders of magnitude, roughly: pitch of a mid-frequency tone 0.3%, lifted weight 2%, line length 3%, brightness of a large patch 1–2% (of a small brief flash nearer 8%), intensity of broadband noise 10%, taste and smell 10–20%.`,
      idea: String.raw`Weber's law is what one expects if the internal noise that limits discrimination grows in proportion to the signal (*multiplicative* noise), or equivalently if the senses represent intensity on a compressed, roughly logarithmic scale on which equal ratios are equal distances. Then the difference needed to reach a fixed discriminability (say 75% correct) is a fixed multiple of $I$. Testing the law needs a JND measured at several standards, each with its own psychometric function; the law predicts the intercept of the line to be zero and its slope to be the same at every standard. It fails near absolute threshold (1.10), and its form is the starting point of Fechner's law (1.11).`,
      caption: String.raw`The stimulus is a split disc on a background of luminance $I$: one half is brighter by $\Delta I$, and the task is to say which (luminances are rendered assuming a standard sRGB screen, with dithering for steps finer than one grey level). Each of five background levels runs its own 1-up–2-down staircase; the JND is the 75%-correct point of a psychometric function fitted to that level's trials, shown with its 95% interval. The green line is the best line *through the origin*, the dashed one a line with a free intercept. Drag the **gold** handle to see one JND at each background; switch **axes** to log–log (slope 1), change the simulated **Weber fraction**, or add a **dark light** to see the law begin to fail at the bottom. Switch to **you** to measure your own five JNDs (about 25 answers per level; a dim room helps).`,
      deps: ['psych-1.2'],
      refs: ['Gescheider ch. 1'],
      tags: ['Weber', 'discrimination'],
      credit: 'Weber, 1834',
      scope: String.raw`Holds over the middle of a sense's range (for vision, photopic luminances on a steady background; for hearing, broadband noise from about 30 dB above threshold). It fails at low intensities, where the JND levels off at a constant (1.10), and for pure-tone intensity, where $\Delta I/I$ falls slowly with level (the near miss).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law' },
      viz(v) {
        const M = v.M, after = timers(v), BASES = [0.03, 0.06, 0.12, 0.24, 0.48], NTR = 50, R0 = 0.3, FST = Math.pow(10, 0.1), RMIN = 0.003, I0D = 0.03, DR = 0.55;
        let seed = 23, phase = 'idle', cur = null, tid = 0, sel = 2;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; if (who.value === 'you' && !cur) newTrial(); } });
        const axes = v.select('axes', [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'log–log' }], 'lin');
        const kS = v.slider('simulated Weber fraction $k$', 0.01, 0.15, 0.04, { step: 0.005 });
        const dark = v.toggle('dark light $I_0$ (see 1.10)', false);
        const bL = v.button('Left half brighter', () => answer(0));
        const bR = v.button('Right half brighter', () => answer(1));
        const bNew = v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const bRes = v.button('Reset', () => { after.clear(); stairs = BASES.map(fresh); phase = 'idle'; newTrial(); });
        const st = v.stage({ x: [-1, 1], y: [-0.8, 0.8], equal: true, axes: false, height: 300, weight: 0.85, title: 'which half is brighter?' });
        const pl = v.stage({ x: [0, 0.55], y: [0, 0.05], height: 300, axes: 'box', weight: 1.15, title: 'JND against background: Weber’s line' });
        const fresh = () => ({ j: 0, run: 0, dir: 0, trials: [] });
        const ratio = (j) => R0 / Math.pow(FST, j), JMAX = Math.floor(Math.log(R0 / RMIN) / Math.log(FST));
        const step = (S, ok) => { S.trials.push({ x: Math.log10(ratio(S.j)), r: ok }); if (ok) { if (++S.run >= 2) { S.run = 0; S.j = Math.min(JMAX, S.j + 1); } } else { S.run = 0; S.j = Math.max(0, S.j - 1); } };
        const pcOf = (I, r) => { const d = (0.954 * r * I) / (kS.value * (I + (dark.value ? I0D : 0))); return 0.005 + 0.99 * Phi(M, d / Math.SQRT2); };
        const jndOf = (S, I) => {
          const f = fitPsy(M, binTrials(S.trials), { g: 0.5, l: 0.01, lo: Math.log10(RMIN), hi: Math.log10(0.6) });
          if (!f) return null;
          const t = thrOf(M, f, 0.75), d = I * 10 ** t.x;
          return { I, d, lo: isFinite(t.se) ? I * 10 ** (t.x - 1.96 * t.se) : null, hi: isFinite(t.se) ? I * 10 ** (t.x + 1.96 * t.se) : null, se: isFinite(t.se) ? d * Math.LN10 * t.se : null, n: S.trials.length };
        };
        const simulate = () => { const R = v.rng(seed); return BASES.map((I) => { const S = fresh(); for (let t = 0; t < NTR; t++) step(S, R() < pcOf(I, ratio(S.j))); return jndOf(S, I); }); };
        let stairs = BASES.map(fresh);
        const Ry = v.rng(4242);
        const newTrial = () => {
          const counts = stairs.map((s) => s.trials.length), mn = Math.min(...counts), cand = BASES.map((_, i) => i).filter((i) => counts[i] === mn);
          const b = cand[Math.floor(Ry() * cand.length)];
          cur = { b, side: Ry() < 0.5 ? 0 : 1, r: ratio(stairs[b].j) }; tid++; phase = 'show';
        };
        const answer = (side) => { if (who.value !== 'you' || phase !== 'show') return; step(stairs[cur.b], side === cur.side); phase = 'blank'; after(380, newTrial); };
        /** weighted least squares: line through the origin and a free line, weights 1/se² */
        const lines = (pts) => {
          const P = pts.filter((p) => p && p.se > 0);
          if (P.length < 2) return null;
          let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
          for (const p of P) { const w = 1 / (p.se * p.se); sw += w; sx += w * p.I; sy += w * p.d; sxx += w * p.I * p.I; sxy += w * p.I * p.d; }
          const k0 = sxy / sxx, seK0 = 1 / Math.sqrt(sxx), D = sw * sxx - sx * sx;
          const b = (sw * sxy - sx * sy) / D, a = (sy - b * sx) / sw, seA = Math.sqrt(sxx / D), seB = Math.sqrt(sw / D);
          return { k0, seK0, a, b, seA, seB };
        };
        let fitInfo = null;
        const probe = pl.handle(0.12, 0.005, { color: 'gold', constrain: (x, y) => { const pts = fitInfo || []; let best = null; pts.forEach((p, i) => { if (!p) return; const [X, Y] = P(p.I, p.d); const dd = Math.abs(pl.X(X) - pl.X(x)); if (!best || dd < best.dd) best = { dd, X, Y, i }; }); if (!best) return [x, y]; sel = best.i; return [best.X, best.Y]; } });
        const P = (I, d) => (axes.value === 'log' ? [Math.log10(I), Math.log10(d)] : [I, d]);
        v.render(() => {
          const isYou = who.value === 'you', log = axes.value === 'log';
          bL.hidden = bR.hidden = bRes.hidden = !isYou; bNew.hidden = kS.el.hidden = dark.el.hidden = isYou; probe.visible = !isYou;
          if (isYou && !cur) newTrial();
          const pts = isYou ? stairs.map((S, i) => (S.trials.length >= 8 ? jndOf(S, BASES[i]) : null)) : simulate();
          fitInfo = pts;
          const L = lines(pts);
          // ---- axes for the mode
          const good = pts.filter(Boolean), dmax = Math.max(0.004, ...good.map((p) => Math.min(p.hi ?? p.d, 3 * p.d)));
          if (!log) {
            pl.setView([-0.035, 0.53], [-0.17 * dmax * 1.15, dmax * 1.15]); pl.setTicks(null, null);
            pl.o.xlabel = 'background luminance I'; pl.o.ylabel = 'JND ΔI';
          } else {
            const dmin = Math.min(0.0005, ...good.map((p) => p.lo ?? p.d)), y0 = Math.log10(dmin) - 0.25, y1 = Math.log10(dmax) + 0.25;
            pl.setView([Math.log10(0.02) - 0.08, Math.log10(0.7)], [y0 - 0.12 * (y1 - y0), y1]);
            pl.setTicks(logTicks(Math.log10(0.02), Math.log10(0.7)), logTicks(y0, y1));
            pl.o.xlabel = 'I (log scale)'; pl.o.ylabel = 'ΔI (log scale)';
          }
          const [xa, xb] = pl.bounds.x;
          const lineFn = (fn, st) => { const pts2 = []; for (let i = 0; i <= 60; i++) { const I = log ? 10 ** (xa + ((xb - xa) * i) / 60) : Math.max(1e-6, xa + ((xb - xa) * i) / 60); const d = fn(I); if (d > 0) pts2.push(P(I, d)); } pl.path(pts2, st); };
          if (!isYou) lineFn((I) => kS.value * (I + (dark.value ? I0D : 0)), { color: 'muted', dash: [2, 4], width: 1.4 });
          if (L) {
            lineFn((I) => L.a + L.b * I, { color: 'muted', dash: [7, 5], width: 1.6 });
            lineFn((I) => L.k0 * I, { color: 'green', width: 2.6 });
          }
          for (const p of good) {
            const [X, Y] = P(p.I, p.d);
            if (p.lo != null) { const [, Ya] = P(p.I, p.lo), [, Yb] = P(p.I, Math.min(p.hi, 4 * p.d)); pl.line(X, Ya, X, Yb, { color: 'accent', width: 1.6, alpha: 0.7 }); }
            pl.dot(X, Y, { r: 5, color: 'accent' });
          }
          if (L) { const I = log ? 10 ** (xa + 0.12 * (xb - xa)) : 0.42; const [X, Y] = P(I, L.k0 * I); pl.text(`ΔI = ${v.fix(L.k0, 3)} · I`, X, Y, { dx: log ? 0 : -6, dy: -12, align: log ? 'left' : 'right', color: 'green', weight: 700, size: 12.5 }); }
          if (isYou && !good.length) pl.text('measuring… each background needs about 8 answers before its JND appears', (xa + xb) / 2, pl.bounds.y[1] * 0.5, { align: 'center', color: 'muted', size: 12 });
          // ---- stimulus
          let I, dI, side, txt;
          if (isYou) { I = cur ? BASES[cur.b] : BASES[0]; dI = phase === 'show' ? cur.r * I : 0; side = cur ? cur.side : 0; }
          else {
            const p = pts[sel]; I = BASES[sel]; dI = p ? p.d : 0; side = 1;
            if (p) [probe.x, probe.y] = P(p.I, p.d);
            txt = `I = ${I}, ΔI = ${v.fix(dI, 4)} (one JND, ${v.fix((100 * dI) / I, 1)}%)`;
          }
          const key = `${isYou ? 'y' + tid + phase : 's' + sel + dI.toFixed(6)}`;
          const Rn = v.rng(31 + tid);
          st.raster((x, y) => {
            const inDisc = x * x + y * y < DR * DR;
            let Lum = I;
            if (inDisc && dI) { const right = x > 0; if ((right ? 1 : 0) === side) Lum = I + dI; }
            return dither(srgb(Math.min(1, Lum)), Rn);
          }, { res: 1, key, id: 'w' });
          const gs = Math.round(srgb(I)), tc = gs < 120 ? Math.min(255, gs + 60) : gs - 60, tcol = [tc, tc, tc];
          st.line(0, DR + 0.04, 0, DR + 0.13, { color: tcol, width: 2 }); st.line(0, -DR - 0.04, 0, -DR - 0.13, { color: tcol, width: 2 });
          if (!isYou) { st.text(txt, 0, -0.72, { align: 'center', color: tcol, halo: false, size: 12 }); st.text('I', -0.28, DR + 0.1, { align: 'center', color: tcol, halo: false, size: 13, math: true }); st.text('I + ΔI', 0.28, DR + 0.1, { align: 'center', color: tcol, halo: false, size: 13, math: true }); }
          else st.text(phase === 'show' ? `background ${cur.b + 1} of 5 · trial ${stairs[cur.b].trials.length + 1}` : '', 0, -0.72, { align: 'center', color: tcol, halo: false, size: 12 });
        });
        v.legend([['accent', 'JND at each background, 95% interval', { dot: true }], ['green', 'best line through the origin: slope = Weber fraction'], ['muted', 'best line with a free intercept', { dash: true }], ['muted', 'the simulated observer’s true JNDs', { dash: [2, 4] }]]);
        v.readout(() => {
          const pts = fitInfo || [], L = lines(pts), good = pts.filter(Boolean);
          if (!good.length) return 'Press the button for the brighter half. The difference shrinks after two correct answers in a row and grows after a mistake, so each background homes in on your 70–75% point. Keep going until all five JNDs appear.';
          const wf = good.map((p) => `${v.fix((100 * p.d) / p.I, 1)}%`).join(', ');
          if (!L) return `JNDs as fractions of the background: ${wf} · need at least two backgrounds with confidence intervals for the line`;
          const zA = L.a / L.seA, through = Math.abs(zA) < 1.96;
          return `Weber fractions $\\Delta I/I$ at the five backgrounds: ${wf} · line through the origin: $k$ = **${v.fix(L.k0, 4)}** ± ${v.fix(1.96 * L.seK0, 4)}${who.value === 'sim' ? ` (true ${v.fix(kS.value, 3)})` : ''} · free line: intercept ${v.fix(L.a, 5)} ± ${v.fix(1.96 * L.seA, 5)}, ${through ? 'consistent with zero: the line passes through the origin, as Weber’s law says' : 'clearly above zero: the JND does not shrink in proportion at low backgrounds (see 1.10)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Where Weber’s law fails: low intensities and the near miss',
      statement: String.raw`Measured over the whole range of a sense, the Weber fraction $\Delta I/I$ is not constant.

- **Near threshold it rises steeply.** As $I$ falls toward the absolute threshold, $\Delta I$ stops shrinking in proportion and levels off. The data are described well by the *modified* Weber law $$\Delta I = k\,(I+I_0),$$ where $I_0$ acts like a constant internal noise (for vision, the “dark light” of spontaneous activity) added to every stimulus. On log–log axes the threshold-versus-intensity curve is flat at low $I$ and bends into Weber's line of slope 1 above $I\approx I_0$. Miller (1947) found exactly this for the intensity of broadband noise: $\Delta I/I\approx0.1$ (about 0.4 dB) from roughly 30 dB above threshold up, with a sharp rise below.
- **For pure tones it falls slowly: the near miss.** For the intensity of a sinusoid, $\Delta I/I$ keeps decreasing with level, roughly $\Delta I\propto I^{0.93}$, from about 1.5 dB near threshold to about 0.5 dB at 80 dB above it (McGill & Goldberg, 1968; Jesteadt, Wier & Green, 1977) — close to Weber's law but systematically not it, probably because louder tones recruit more auditory nerve fibres spread along the cochlea.`,
      idea: String.raw`If discrimination is limited by noise of two kinds, a part proportional to the stimulus (which gives Weber's law, 1.9) and a fixed part independent of it, the total noise is proportional to $I+I_0$ and so is the JND: at high intensities the proportional part wins and $\Delta I/I\to k$, at low intensities the fixed part wins and $\Delta I\to kI_0$, a constant. Dividing $\Delta I$ by $I+I_0$ instead of $I$ therefore makes the plot flat again, and the value of $I_0$ that does so is a measurement of the internal noise. No single $I_0$ can straighten the pure-tone data, whose slope on log–log axes is below 1 at every level: that residual is the near miss.`,
      caption: String.raw`Left: JNDs against intensity on log–log axes (intensities relative to the absolute threshold), with Weber's line (red, dashed), the modified law (green) and, for tones, the best power law (purple). Right: the Weber fraction $\Delta I/I$ (red) curls upward at low intensities; the green points divide by $I+I_0$ instead and lie flat when $I_0$ is right. Drag **lowest level tested** up to 30 dB and Weber's law looks perfect; bring it down to threshold and it fails. Adjust $I_0$ to straighten the green points; switch to **pure tone** for the near miss. Drag the **gold** handle to a level and press *Listen* to hear increments of 1 or 3 JNDs on a sustained sound at that level (relative to your volume setting).`,
      deps: ['psych-1.9', 'music-1.8'],
      refs: ['Gescheider ch. 1'],
      tags: ['Weber', 'hearing'],
      credit: 'Miller, 1947; McGill & Goldberg, 1968 (the near miss)',
      viz(v) {
        const M = v.M, after = timers(v), LEVELS = M.range(19).map((i) => 5 * i), K = 0.1, I0T = Math.pow(10, 0.6);
        const mod = v.select('stimulus', [{ value: 'noise', label: 'broadband noise' }, { value: 'tone', label: 'pure tone (1 kHz)' }], 'noise');
        const low = v.slider('lowest level tested', 0, 45, 0, { step: 5, fmt: (x) => `${x} dB above threshold` });
        const i0S = v.slider('$I_0$ in the model', -10, 25, 6, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} dB (${v.fmt(10 ** (x / 10), 3)}×)` });
        const model = (I, m) => (m === 'noise' ? K * (I + I0T) : 0.463 * Math.pow(I, -0.072) * I);
        const Z = (() => { const R = v.rng(5); return LEVELS.map(() => R.normal()); })();
        const data = (m) => LEVELS.map((L, i) => { const I = 10 ** (L / 10); return { L, I, d: model(I, m) * Math.exp(0.07 * Z[i]) }; });
        const tvi = v.stage({ x: [0.5, 3e9], y: [0.1, 3e9], xlog: true, ylog: true, height: 320, axes: 'box', weight: 1, xlabel: 'I (re threshold)', ylabel: 'ΔI', title: 'threshold versus intensity' });
        const wf = v.stage({ x: [0.5, 3e9], y: [-0.08, 0.62], xlog: true, height: 320, axes: 'box', weight: 1, xlabel: 'I (re threshold)', title: 'Weber fraction: ΔI/I (red) and ΔI/(I+I₀) (green)' });
        const hL = tvi.handle(1e4, model(1e4, 'noise'), { color: 'gold', constrain: (x) => { const I = M.clamp(x, 1, 1e9); return [I, model(I, mod.value)]; } });
        const listen = (mult) => (snd) => {
          const I = hL.x, L = 10 * Math.log10(I), dL = 10 * Math.log10(1 + (mult * model(I, mod.value)) / I), g = Math.pow(10, Math.min(-12, L - 100) / 20), up = Math.pow(10, dL / 20);
          const vc = mod.value === 'noise' ? snd.noise({ color: 'white', sustain: true, gain: g, attack: 0.05 }) : snd.tone(1000, { sustain: true, gain: g, attack: 0.05 });
          [[600, up], [1000, 1], [1500, up], [1900, 1], [2400, up], [2800, 1]].forEach(([ms, k]) => after(ms, () => vc.setGain(k)));
          after(3300, () => vc.stop(0.08));
        };
        v.soundButton('Listen: 1 JND', listen(1));
        v.soundButton('Listen: 3 JND', listen(3));
        let st = null;
        v.render(() => {
          const m = mod.value, D = data(m).filter((p) => p.L >= low.value), I0 = 10 ** (i0S.value / 10);
          hL.y = model(hL.x, m);
          tvi.setView(null, m === 'noise' ? [0.1, 3e9] : [0.1, 3e9]);
          wf.setView(null, m === 'noise' ? [-0.08, 0.62] : [-0.08, 0.62]);
          // fits
          const gm = (xs) => 10 ** M.mean(xs.map(Math.log10));
          const kW = gm(D.map((p) => p.d / p.I)), kM = gm(D.map((p) => p.d / (p.I + I0)));
          const rms = (f) => Math.sqrt(M.mean(D.map((p) => (Math.log10(p.d) - Math.log10(f(p.I))) ** 2)));
          const eW = rms((I) => kW * I), eM = rms((I) => kM * (I + I0));
          let best = { e: Infinity, x: 0 };
          for (let x = -20; x <= 30; x += 0.25) { const J = 10 ** (x / 10), kk = gm(D.map((p) => p.d / (p.I + J))), e = rms((I) => kk * (I + J)); if (e < best.e) best = { e, x }; }
          const hiD = D.filter((p) => p.L >= 20), lr = hiD.length > 2 ? M.linreg(hiD.map((p) => Math.log10(p.I)), hiD.map((p) => Math.log10(p.d))) : null;
          // ---- TVI
          if (low.value > 0) { tvi.rect(0.5, 0.1, 10 ** (low.value / 10), 3e9, { fill: 'gray', fillAlpha: 0.1, stroke: false }); wf.rect(0.5, -0.08, 10 ** (low.value / 10), 0.62, { fill: 'gray', fillAlpha: 0.1, stroke: false }); }
          tvi.fn((I) => kW * I, { color: 'red', dash: [7, 5], width: 1.8 });
          tvi.fn((I) => kM * (I + I0), { color: 'green', width: 2.4 });
          if (m === 'tone' && lr) tvi.fn((I) => 10 ** (lr.intercept + lr.slope * Math.log10(I)), { color: 'purple', width: 1.8, dash: [3, 3] });
          tvi.dots(D.map((p) => [p.I, p.d]), { r: 3.6, color: 'ink' });
          tvi.vline(I0, { color: 'green', dash: [2, 4], width: 1.2 });
          tvi.text('I₀', I0, 3e8, { dx: 5, align: 'left', color: 'green', weight: 700, size: 12 });
          tvi.text('Weber: slope 1', 3e7, kW * 3e7, { dx: 6, dy: 10, align: 'left', color: 'red', size: 11.5, weight: 600 });
          tvi.line(hL.x, 0.1, hL.x, hL.y, { color: 'gold', dash: [2, 3], width: 1.2 });
          // ---- Weber fraction
          wf.hline(kW, { color: 'red', dash: [7, 5], width: 1.4 });
          wf.hline(kM, { color: 'green', width: 1.4, alpha: 0.6 });
          wf.path(D.map((p) => [p.I, p.d / p.I]), { color: 'red', width: 1.2, alpha: 0.5 });
          wf.dots(D.map((p) => [p.I, p.d / p.I]), { r: 3.6, color: 'red' });
          wf.path(D.map((p) => [p.I, p.d / (p.I + I0)]), { color: 'green', width: 1.2, alpha: 0.5 });
          wf.dots(D.map((p) => [p.I, p.d / (p.I + I0)]), { r: 3.6, color: 'green' });
          wf.text('ΔI / I', 0.8, D.length ? D[0].d / D[0].I : 0.3, { dy: -12, align: 'left', color: 'red', weight: 700, size: 12 });
          wf.text('ΔI / (I + I₀)', 3e8, kM, { dy: -12, align: 'right', color: 'green', weight: 700, size: 12 });
          wf.vline(hL.x, { color: 'gold', dash: [2, 3], width: 1.2 });
          st = { m, kW, kM, eW, eM, best, lr, I0, n: D.length };
        });
        v.legend([['ink', 'measured JND (simulated data with 7% scatter)', { dot: true }], ['red', 'Weber: $\\Delta I = kI$', { dash: true }], ['green', 'modified Weber: $\\Delta I = k(I+I_0)$'], ['purple', 'power law fit (tones)', { dash: [3, 3] }], ['gold', 'level for Listen']]);
        v.readout(() => {
          if (!st) return '';
          const { m, kW, kM, eW, eM, best, lr, n } = st, L = 10 * Math.log10(hL.x), dL = 10 * Math.log10(1 + model(hL.x, m) / hL.x);
          const fits = `${n} levels from ${low.value} dB · Weber alone: $k$ = ${v.fix(kW, 3)}, rms error ${v.fix(eW, 3)} decades · modified, $I_0$ = ${v.fix(i0S.value, 1)} dB: $k$ = ${v.fix(kM, 3)}, rms error ${v.fix(eM, 3)} (best $I_0$ = ${v.fix(best.x, 1)} dB, error ${v.fix(best.e, 3)})`;
          const tail = m === 'noise' ? (low.value >= 30 ? ' · above 30 dB the data alone cannot tell the two models apart: Weber’s law looks exact' : ' · with $I_0$ added the Weber fraction is flat, so a constant internal noise explains the failure') : ` · power law above 20 dB: $\\Delta I\\propto I^{${lr ? v.fix(lr.slope, 3) : '—'}}$, an exponent just below 1 — the near miss, which no $I_0$ removes`;
          return `${fits}${tail} · at the gold level (${v.fix(L, 0)} dB above threshold) one JND is ${v.fix(dL, 2)} dB`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Law',
      name: 'Fechner’s law: sensation grows as a logarithm',
      statement: String.raw`Assume Weber's law, $\Delta I = kI$ (1.9), and **Fechner's postulate** that every JND is the same increment of sensation, whatever the intensity. Counting JNDs upward from the absolute threshold $I_0$, the $n$-th JND is reached at $I_n=I_0(1+k)^n$, so the sensation measured in JNDs is
$$S(I)=\frac{\ln(I/I_0)}{\ln(1+k)}\;\approx\;\frac1k\,\ln\frac{I}{I_0},$$
and in the continuous version $dS = c\,dI/I$ integrates to **Fechner's law** $S=c\ln(I/I_0)$: sensation grows as the logarithm of intensity, so equal stimulus *ratios* give equal sensation *differences*. Decibels and stellar magnitudes are logarithmic scales of this kind.

The law inherits Weber's range of validity (with the modified Weber law of 1.10 it becomes $S\propto\ln\frac{I+I_0'}{I_0+I_0'}$, nearly linear near threshold), and its postulate is an assumption, not a measurement. Asking observers to estimate magnitudes directly gives power functions instead, $S\propto I^{\beta}$ (Stevens' law, psych-3.2), and which scale is “right” is the subject of psych-3.5.`,
      idea: String.raw`Fechner's step was to treat the JND as a unit and add the units up. Weber's law says each step multiplies the intensity by the same factor $1+k$, so after $n$ steps $I=I_0(1+k)^n$ and $n$ is a logarithm (the inverse of the exponential, pma-8.6). Passing to the limit of small steps turns the sum into the integral $\int dI/(kI)$. The same integration applied to any other JND law gives a different scale: a constant JND gives a linear scale, and the modified Weber law gives a logarithm of $I+I_0'$. Fechner's law is therefore exactly as good as Weber's law and the equal-JND postulate behind it.`,
      caption: String.raw`The staircase stacks JNDs from threshold: each step is one JND wide and one unit of sensation high. Green is Fechner's integral $\int dI/\Delta I$, computed numerically for the chosen JND law; the gold point reads off the sensation at any intensity. Switch the **x-axis** to logarithmic and the Weber staircase becomes a straight line of equal steps. Change the **Weber fraction**, or the **JND law** to see what other rules integrate to; turn on **Stevens** for a power law with exponent 0.33 (scaled to agree at the top). Right: two ladders of eight intensities, equal ratios versus equal differences, placed at their predicted sensations; press the buttons to hear them and judge for yourself whether the first sounds evenly spaced.`,
      deps: ['psych-1.9', 'pma-8.6'],
      refs: ['Gescheider ch. 9'],
      tags: ['Fechner', 'scaling'],
      credit: 'Fechner, 1860',
      scope: String.raw`Holds where Weber's law holds and to the extent that JNDs are equal steps of sensation; it fails near threshold and is contradicted by direct magnitude estimation, which gives power laws (psych-3.2).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law' },
      viz(v) {
        const M = v.M, ph = playhead(v), IMAX = 100, I0M = 3, STEP = 0.55;
        const xs = v.select('x-axis', [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'logarithmic' }], 'lin');
        const law = v.select('JND law', [{ value: 'weber', label: 'Weber $\\Delta I=kI$' }, { value: 'mod', label: 'modified $\\Delta I=k(I+I_0)$' }, { value: 'const', label: 'constant $\\Delta I$' }], 'weber');
        const kS = v.slider('Weber fraction $k$', 0.03, 0.5, 0.25, { step: 0.01 });
        const stev = v.toggle('Stevens’ power law (ch. 3)', false);
        let playing = null;
        const mk = (which) => (snd) => {
          const Is = which === 'ratio' ? M.range(8).map((j) => Math.pow(IMAX, j / 7)) : M.range(8).map((j) => 1 + ((IMAX - 1) * j) / 7);
          Is.forEach((I, j) => snd.tone(440, { harmonics: 3, rolloff: 1.4, duration: 0.42, release: 0.08, gain: Math.pow(10, (-46 + 10 * Math.log10(I)) / 20), delay: j * STEP }));
          playing = which; ph.start(8 * STEP);
        };
        v.soundButton('Ladder: equal ratios', mk('ratio'));
        v.soundButton('Ladder: equal differences', mk('diff'));
        const s = v.stage({ x: [0, IMAX], y: [0, 25], height: 340, axes: 'box', weight: 1.55, ylabel: 'sensation (JNDs above threshold)', title: 'stacking JNDs from threshold' });
        const lad = v.stage({ x: [0, 2], y: [0, 25], height: 340, axes: 'box', weight: 0.55, minWidth: 180, xticks: [[0.5, 'ratios'], [1.5, 'differences']], yticks: [], title: 'two ladders' });
        const dI = (I) => { const k = kS.value; return law.value === 'weber' ? k * I : law.value === 'mod' ? k * (I + I0M) : k * 10; };
        const Sint = (I) => (I <= 1 ? 0 : M.integrate((u) => 1 / dI(u), 1, I, 400));
        let cache = null, cKey = '', Ih = 40;
        const hd = s.handle(40, 10, { color: 'gold', constrain: (x) => { Ih = xs.value === 'log' ? M.clamp(10 ** x, 1, IMAX) : M.clamp(x, 1, IMAX); return [xs.value === 'log' ? Math.log10(Ih) : Ih, Sint(Ih)]; } });
        v.render(() => {
          const log = xs.value === 'log', X = (I) => (log ? Math.log10(I) : I), key = [law.value, kS.value].join();
          if (key !== cKey) {
            cKey = key; const steps = [1]; while (steps.length < 2000 && steps[steps.length - 1] < IMAX) steps.push(steps[steps.length - 1] + dI(steps[steps.length - 1]));
            cache = { steps, smax: Sint(IMAX) };
          }
          const { steps, smax } = cache, nFull = steps.filter((I) => I <= IMAX).length - 1, ytop = Math.max(nFull, smax) * 1.12 + 1;
          s.setView(log ? [-0.12, 2.05] : [-3, IMAX + 2], [-0.1 * ytop, ytop]); lad.setView(null, [-0.1 * ytop, ytop]);
          s.setTicks(log ? [[0, '1'], [Math.log10(2), '2'], [Math.log10(5), '5'], [1, '10'], [Math.log10(20), '20'], [Math.log10(50), '50'], [2, '100']] : null, null);
          s.o.xlabel = log ? 'I / threshold (log scale)' : 'I / threshold';
          // staircase
          const pts = [[X(1), 0]];
          for (let n = 1; n < steps.length; n++) { const I = Math.min(steps[n], IMAX); pts.push([X(I), n - 1]); if (steps[n] > IMAX) break; pts.push([X(I), n]); }
          s.path(pts, { color: 'accent', width: 1.8 });
          if (steps.length < 140) for (let n = 1; n < steps.length && steps[n] <= IMAX; n++) s.dot(X(steps[n]), n, { r: 2.4, color: 'accent' });
          // Fechner's integral
          const cur = []; for (let i = 0; i <= 240; i++) { const I = log ? 10 ** ((2 * i) / 240) : 1 + ((IMAX - 1) * i) / 240; cur.push([X(I), Sint(I)]); }
          s.path(cur, { color: 'green', width: 2.6 });
          if (stev.value) { const b = 0.33, a = smax / (Math.pow(IMAX, b) - 1), sp = []; for (let i = 0; i <= 240; i++) { const I = log ? 10 ** ((2 * i) / 240) : 1 + ((IMAX - 1) * i) / 240; sp.push([X(I), a * (Math.pow(I, b) - 1)]); } s.path(sp, { color: 'purple', width: 2, dash: [7, 5] }); }
          hd.x = X(Ih); hd.y = Sint(Ih);
          s.line(hd.x, -0.1 * ytop, hd.x, hd.y, { color: 'gold', dash: [2, 3], width: 1.2 });
          s.line(log ? -0.12 : -3, hd.y, hd.x, hd.y, { color: 'gold', dash: [2, 3], width: 1.2 });
          const lab = law.value === 'weber' ? '(1/k) ln I' : law.value === 'mod' ? '(1/k) ln((I+I₀)/(1+I₀))' : '(I − 1)/ΔI';
          s.text(lab, X(IMAX * 0.97), Sint(IMAX * 0.97), { dy: 14, align: 'right', color: 'green', weight: 700, size: 12.5 });
          // ladders
          const Ir = M.range(8).map((j) => Math.pow(IMAX, j / 7)), Id = M.range(8).map((j) => 1 + ((IMAX - 1) * j) / 7);
          const t = ph.t, on = t != null ? Math.floor(t / STEP) : -1;
          for (const [col, Is, x0, name] of [['teal', Ir, 0.5, 'ratio'], ['orange', Id, 1.5, 'diff']]) {
            lad.line(x0, 0, x0, Sint(IMAX), { color: 'faint', width: 1 });
            Is.forEach((I, j) => { const y = Sint(I), hot = playing === name && j === on; lad.line(x0 - 0.3, y, x0 + 0.3, y, { color: hot ? 'gold' : col, width: hot ? 5 : 3 }); });
          }
          lad.text('×1.93 each', 0.5, -0.05 * ytop, { align: 'center', color: 'teal', size: 11 });
          lad.text('+14.1 each', 1.5, -0.05 * ytop, { align: 'center', color: 'orange', size: 11 });
        });
        v.legend([['accent', 'one JND per step'], ['green', 'Fechner’s integral $\\int dI/\\Delta I$'], ['purple', 'Stevens: $\\propto I^{0.33}$', { dash: true }], ['teal', 'equal-ratio ladder'], ['orange', 'equal-difference ladder']]);
        v.readout(() => {
          const k = kS.value, steps = cache ? cache.steps : [1];
          const n = steps.filter((I) => I <= Ih).length - 1, S = Sint(Ih);
          const exact = law.value === 'weber' ? ` = $\\ln I/\\ln(1+k)$ = ${v.fix(Math.log(Ih) / Math.log(1 + k), 2)} at the staircase corners; Fechner's integral $\\ln I/k$ = ${v.fix(Math.log(Ih) / k, 2)}` : '';
          const Sr = M.range(8).map((j) => Sint(Math.pow(IMAX, j / 7))), Sd = M.range(8).map((j) => Sint(1 + ((IMAX - 1) * j) / 7));
          const gaps = (a) => a.slice(1).map((y, i) => y - a[i]);
          const gr = gaps(Sr), gd = gaps(Sd);
          return `at $I$ = ${v.fix(Ih, 1)}× threshold: ${n} whole JNDs stacked${exact} · integral (numerical) ${v.fix(S, 2)} JNDs · ladder steps in JNDs: equal ratios ${v.fix(Math.min(...gr), 1)}–${v.fix(Math.max(...gr), 1)}, equal differences ${v.fix(Math.min(...gd), 1)}–${v.fix(Math.max(...gd), 1)}${law.value === 'weber' ? ' — Fechner predicts the first ladder evenly spaced and the second rushing up then crawling' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Model',
      name: 'High-threshold theory and the correction for guessing',
      statement: String.raw`**High-threshold theory** models detection as a two-state process. On a signal trial a detector is triggered with probability $p(x)$, which grows with intensity $x$; noise alone never triggers it (the threshold is *high*). When triggered the observer says “yes”; when not, the observer guesses “yes” with probability $g$. Hence
$$H = p + (1-p)\,g,\qquad F = g,$$
for the hit rate $H$ (yes on signal trials) and the false-alarm rate $F$ (yes on blank “catch” trials), and the true detection probability is recovered by the **correction for guessing**
$$p=\frac{H-F}{1-F}.$$
In $m$-alternative forced choice the same reasoning gives $P_c=p+(1-p)/m$, so $p=(P_c-1/m)/(1-1/m)$. The model predicts that the corrected curves of an observer measured with different guessing rates coincide, and that hits and false alarms trade off along a straight line ($H = p + (1-p)F$). Real observers violate both predictions: their ROC curves are curved, which favours the Gaussian detection model of chapter 2 (psych-2.9).`,
      idea: String.raw`Split the signal trials by the hidden state. A fraction $p$ are detected and answered “yes”; of the remaining $1-p$, a fraction $g$ are guessed “yes”. Blank trials are never detected, so they reveal $g$ directly as the false-alarm rate. Subtracting the guesses and renormalising by the trials on which guessing was possible gives $(H-F)/(1-F)=p$, independent of $g$. If instead the internal evidence is continuous and the observer applies a criterion (signal detection theory), a more lenient criterion raises $H$ and $F$ together along a curve, the correction no longer cancels $g$, and the corrected “detection probability” depends on how willing the observer was.`,
      caption: String.raw`Left: the trials as areas. In the signal column, green is detected, gold is undetected but guessed “yes”, grey is “no”; the blank column shows the guesses alone. Right: raw hit rates (orange), corrected values (green) and the false-alarm rate (red) of a simulated observer, against intensity; the dashed green curve is the true detection probability, and the faint green dashes the corrected values at a guessing rate of 5% for comparison. Raise the **guessing rate** $g$: the raw curve inflates, the corrected points stay on the true curve. Switch the **true observer** to a Gaussian (signal-detection) observer and the correction fails. Drag the **gold** handle to choose the intensity drawn on the left.`,
      deps: ['psych-1.3'],
      refs: ['Gescheider ch. 4'],
      tags: ['threshold theory', 'guessing'],
      credit: 'Abbott, 1925 (the formula); Blackwell, 1953 (high-threshold theory)',
      viz(v) {
        const M = v.M, LEV = [1, 2, 3, 4, 5, 6, 7, 8, 9], NT = 60, NB = 120, MU = 5, SG = 1.3, GREF = 0.05;
        const gS = v.slider('guessing rate $g$', 0, 0.6, 0.3, { step: 0.01 });
        const kind = v.select('true observer', [{ value: 'ht', label: 'high threshold' }, { value: 'sdt', label: 'Gaussian (signal detection)' }], 'ht');
        let seed = 13;
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const mo = v.stage({ x: [0, 2.4], y: [-0.2, 1.22], height: 310, axes: false, weight: 0.85, title: 'where the yes answers come from' });
        const pl = v.stage({ x: [-0.6, 10.2], y: [-0.14, 1.08], height: 310, axes: 'box', weight: 1.15, xlabel: 'intensity', yticks: [0, 0.25, 0.5, 0.75, 1], title: 'raw and corrected detection' });
        const pTrue = (x) => Phi(M, (x - MU) / SG);
        const dpr = (x) => Math.max(0, (2.6 * x) / MU);  // SDT observer: d′ grows linearly with intensity
        const HF = (x, g) => {
          if (kind.value === 'ht') { const p = pTrue(x); return { H: p + (1 - p) * g, F: g }; }
          const c = -M.dist.normal(0, 1).quantile(Math.min(0.999, Math.max(0.001, g)));  // criterion giving F = g
          return { H: Phi(M, dpr(x) - c), F: g };
        };
        const hd = pl.handle(4.4, 0.4, { color: 'gold', constrain: (x) => { const xx = M.clamp(x, 0.3, 9.7); return [xx, HF(xx, gS.value).H]; } });
        let U = null, uSeed = -1;
        const sample = (g) => {
          if (uSeed !== seed) { const R = v.rng(seed); U = { s: LEV.map(() => M.range(NT).map(() => R())), b: M.range(NB).map(() => R()) }; uSeed = seed; }
          const F = U.b.filter((u) => u < HF(0, g).F).length / NB;
          return { F, pts: LEV.map((x, i) => { const H = U.s[i].filter((u) => u < HF(x, g).H).length / NT; return { x, H, c: F < 1 ? (H - F) / (1 - F) : NaN }; }) };
        };
        v.legend([['orange', 'raw hit rate $H$', { dot: true }], ['green', 'corrected $(H-F)/(1-F)$', { dot: true }], ['red', 'false-alarm rate $F$', { dash: true }], ['green', 'true detection probability (high-threshold observer)', { dash: true }]]);
        let st = null;
        v.render(() => {
          const g = gS.value, S = sample(g), R5 = sample(GREF), x = hd.x, { H, F } = HF(x, g);
          hd.y = H;
          // ---- the mosaic
          const ht = kind.value === 'ht', p = ht ? pTrue(x) : NaN;
          const col = (x0, segs, title) => {
            let y = 0;
            for (const [h, c, lab] of segs) { if (h > 0) { mo.rect(x0, y, x0 + 0.9, y + h, { fill: c, fillAlpha: c === 'gray' ? 0.18 : 0.55, color: 'panel', width: 1.5 }); if (h > 0.075) mo.text(lab, x0 + 0.45, y + h / 2, { align: 'center', color: 'ink', size: 11.5, weight: 600 }); } y += h; }
            mo.rect(x0, 0, x0 + 0.9, 1, { color: 'muted', width: 1.2 });
            mo.text(title, x0 + 0.45, 1.08, { align: 'center', color: 'ink', size: 12.5, weight: 700 });
          };
          if (ht) col(0.15, [[p, 'green', `detected ${pc(p)}`], [(1 - p) * g, 'gold', 'guess yes'], [(1 - p) * (1 - g), 'gray', 'no']], 'signal trials');
          else col(0.15, [[H, 'orange', `yes ${pc(H)}`], [1 - H, 'gray', 'no']], 'signal trials');
          col(1.35, [[g, 'gold', `guess yes ${pc(g)}`], [1 - g, 'gray', 'no']], 'blank trials');
          mo.text(`H = ${v.fix(H, 3)}`, 0.6, -0.08, { align: 'center', color: 'orange', weight: 700, size: 12.5 });
          mo.text(`F = ${v.fix(F, 3)}`, 1.8, -0.08, { align: 'center', color: 'red', weight: 700, size: 12.5 });
          mo.text(`(H − F)/(1 − F) = ${v.fix((H - F) / (1 - F), 3)}${ht ? ` = p ✓` : ''}`, 1.2, -0.17, { align: 'center', color: 'green', weight: 700, size: 12.5 });
          // ---- the curves
          pl.hline(S.F, { color: 'red', dash: [6, 4], width: 1.6 });
          pl.text('false alarms F', 10, S.F, { dy: -9, align: 'right', color: 'red', size: 11.5, weight: 600 });
          if (ht) pl.fn(pTrue, { domain: [0, 10], color: 'green', dash: [7, 5], width: 1.8 });
          pl.fn((xx) => HF(xx, g).H, { domain: [0, 10], color: 'orange', width: 1.6, alpha: 0.6 });
          pl.fn((xx) => { const a = HF(xx, g); return (a.H - a.F) / (1 - a.F); }, { domain: [0, 10], color: 'green', width: 1.6, alpha: 0.6 });
          pl.fn((xx) => { const a = HF(xx, GREF); return (a.H - a.F) / (1 - a.F); }, { domain: [0, 10], color: 'green', width: 1.2, alpha: 0.45, dash: [2, 4] });
          for (const q of S.pts) { pl.line(q.x, q.H, q.x, q.c, { color: 'muted', width: 1, alpha: 0.5 }); pl.dot(q.x, q.H, { r: 4.2, color: 'orange' }); pl.dot(q.x, q.c, { r: 4.2, color: 'green' }); }
          pl.line(x, -0.14, x, H, { color: 'gold', dash: [2, 3], width: 1.2 });
          // discrepancy between corrected curves at g and at 5%
          const gap = Math.max(...S.pts.map((q, i) => { const a = HF(q.x, g), b = HF(q.x, GREF); return Math.abs((a.H - a.F) / (1 - a.F) - (b.H - b.F) / (1 - b.F)); }));
          st = { S, R5, gap, ht, g };
        });
        v.readout(() => {
          if (!st) return '';
          const { S, gap, ht, g } = st;
          const rmsTrue = ht ? Math.sqrt(M.mean(S.pts.map((q) => (q.c - pTrue(q.x)) ** 2))) : NaN;
          return `guessing rate $g$ = ${pc(g)}: measured false-alarm rate ${pc(S.F)} from ${NB} blank trials · ${ht ? `corrected points vs the true detection probability: rms difference ${v.fix(rmsTrue, 3)} (binomial noise only, ${NT} trials per level)` : 'there is no detection state to recover'} · model: the corrected curve at $g$ = ${pc(g)} and at 5% differ by at most ${v.fix(gap, 3)}${ht ? ' — they coincide, as the theory says' : ' — the correction depends on how willing the observer is, so for this observer it does not measure detection'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Phenomenon',
      name: 'Number sense obeys Weber’s law',
      statement: String.raw`When people compare the numbers of items in two arrays shown too briefly to count (a fraction of a second), their accuracy depends on the **ratio** of the two numbers, not on their difference: telling 10 dots from 12 is about as hard as telling 50 from 60, while 50 versus 52 is nearly impossible. This is Weber's law (1.9) for numerosity. A standard model of this *approximate number system* represents a number $n$ as a noisy magnitude with standard deviation proportional to $n$ (scalar variability), so
$$P(\text{correct})=\Phi\!\left(\frac{|n_1-n_2|}{w\sqrt{n_1^2+n_2^2}}\right),$$
a function of $n_2/n_1$ alone, where the **internal Weber fraction** $w$ is typically about 0.1–0.3 in adults and much larger in young children; six-month-old infants distinguish 8 from 16 dots but not 8 from 12 (Xu & Spelke, 2000). The same ratio signature appears in monkeys, birds and fish. Because more dots also means more ink or denser packing, experiments vary dot size and spacing so that no single visual cue predicts the answer; whether numerosity is perceived directly or computed from such cues is still debated.`,
      idea: String.raw`If the internal estimate of $n$ is normal with mean $n$ and standard deviation $wn$, the difference of the two estimates is normal with mean $n_2-n_1$ and standard deviation $w\sqrt{n_1^2+n_2^2}$ (independent normals add), and the observer is correct when its sign is right. Writing $n_2=rn_1$, the ratio of mean to spread is $(r-1)/(w\sqrt{1+r^2})$: $n_1$ cancels. So plotting accuracy against the difference spreads the data into separate curves for each base number, while plotting against the ratio collapses them onto one curve whose steepness measures $w$. Equivalently, number is represented on a compressed, roughly logarithmic scale (1.11).`,
      caption: String.raw`Two arrays of dots; half the trials keep the dot size fixed and half keep the total dot area fixed, so neither size nor ink gives the answer. The default subject is a simulated observer with $w$ = 0.18: 20 trials for each of five ratios at base numbers 10, 20 and 40. Middle: accuracy against the *difference* — three separate curves. Right: against the *ratio* — one curve, fitted by maximum likelihood with its 95% band. Drag the **gold** handle to show any condition on the left. Switch to **you**: *▶ Flash* shows two arrays for 0.3 s; answer which had more dots, and watch your own points collapse.`,
      deps: ['psych-1.9'],
      refs: ['Gescheider ch. 1'],
      tags: ['number', 'Weber'],
      credit: 'Moyer & Landauer, 1967; Halberda & Feigenson, 2008',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Approximate_number_system' },
      viz(v) {
        const M = v.M, after = timers(v), BASES = [10, 20, 40], RATIOS = [1.1, 1.2, 1.3, 1.5, 2], W = 0.18, LP = 0.02, NPER = 20, RAD = 0.82, CX = 1.08;
        const COLS = { 10: 'blue', 20: 'orange', 40: 'purple' };
        const pcN = (n1, n2, w) => LP / 2 + (1 - LP) * Phi(M, Math.abs(n2 - n1) / (w * Math.sqrt(n1 * n1 + n2 * n2)));
        let phase = 'idle', cur = null, tid = 0, last = null;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const bFl = v.button('▶ Flash', () => flash());
        const bL = v.button('Left had more', () => answer(0));
        const bR = v.button('Right had more', () => answer(1));
        const bRes = v.button('Reset', () => { after.clear(); phase = 'idle'; you = []; last = null; });
        const st = v.stage({ x: [-2.25, 2.25], y: [-0.95, 0.95], equal: true, axes: false, height: 230, full: true, title: 'which side has more dots?' });
        const pd = v.stage({ x: [-3, 42], y: [0.36, 1.04], height: 270, axes: 'box', weight: 1, xlabel: 'difference', yticks: [0.5, 0.6, 0.7, 0.8, 0.9, 1], title: 'accuracy against the difference' });
        const pr = v.stage({ x: [0.95, 2.08], y: [0.36, 1.04], height: 270, axes: 'box', weight: 1, xlabel: 'ratio larger/smaller', yticks: [0.5, 0.6, 0.7, 0.8, 0.9, 1], title: 'accuracy against the ratio' });
        // simulated trials
        const sim = (() => { const R = v.rng(61), out = []; for (const b of BASES) for (const r of RATIOS) for (let i = 0; i < NPER; i++) { const big = Math.round(b * r); out.push({ b, r, big, ok: R() < pcN(b, big, W) }); } return out; })();
        let you = [];
        const Ry = v.rng(314), conds = [];
        for (const b of BASES) for (const r of RATIOS) conds.push({ b, r });
        let queue = [];
        const flash = () => {
          if (who.value !== 'you' || phase !== 'idle') return;
          if (!queue.length) queue = Ry.shuffle(conds);
          const c = queue.pop(); cur = { ...c, big: Math.round(c.b * c.r), bigSide: Ry() < 0.5 ? 0 : 1, area: Ry() < 0.5 }; tid++;
          phase = 'flash'; after(300, () => { phase = 'wait'; });
        };
        const answer = (side) => { if (who.value !== 'you' || phase !== 'wait') return; const ok = side === cur.bigSide; you.push({ b: cur.b, r: cur.r, big: cur.big, ok }); last = { ...cur, ok }; phase = 'idle'; after(500, flash); };
        const agg = (tr) => { const m = new Map(); for (const t of tr) { const k = t.b + '|' + t.r; const e = m.get(k) || { b: t.b, r: t.r, big: t.big, n: 0, k: 0 }; e.n++; if (t.ok) e.k++; m.set(k, e); } return [...m.values()]; };
        const fitW = (cells) => {
          if (!cells.length) return null;
          const nll = (lw) => { const w = Math.exp(lw); let L = 0; for (const c of cells) { const p = Math.min(1 - 1e-9, pcN(c.b, c.big, w)); L -= c.k * Math.log(p) + (c.n - c.k) * Math.log(1 - p); } return L; };
          let a = Math.log(0.02), b = Math.log(3);
          for (let i = 0; i < 90; i++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (nll(m1) < nll(m2)) b = m2; else a = m1; }
          const lw = (a + b) / 2, h = 1e-3, d2 = (nll(lw + h) - 2 * nll(lw) + nll(lw - h)) / (h * h);
          const edge = lw < Math.log(0.025) || lw > Math.log(2.8);
          return { w: Math.exp(lw), se: d2 > 0 && !edge ? 1 / Math.sqrt(d2) : NaN };
        };
        /** dot positions in a disc (seeded, non-overlapping) */
        const dots = (n, rDot, seedD) => {
          const R = v.rng(seedD), out = [];
          for (let tries = 0; out.length < n && tries < 20000; tries++) {
            const a = R() * 2 * Math.PI, rr = (RAD - rDot) * Math.sqrt(R()), x = rr * Math.cos(a), y = rr * Math.sin(a);
            if (out.every(([u, w]) => (u - x) ** 2 + (w - y) ** 2 > (2.3 * rDot) ** 2)) out.push([x, y]);
          }
          return out;
        };
        const rFor = (n, area) => (area ? 0.036 * Math.sqrt(25 / n) : 0.034);
        const pick = { b: 20, r: 1.2 };
        const hd = pd.handle(4, 0.8, { color: 'gold', constrain: (x, y) => { const cells = agg(who.value === 'you' ? you : sim); let best = null; for (const c of cells) { const dx = pd.X(c.big - c.b) - pd.X(x), dy = pd.Y(c.k / c.n) - pd.Y(y), d = dx * dx + dy * dy; if (!best || d < best.d) best = { d, c }; } if (!best) return [x, y]; pick.b = best.c.b; pick.r = best.c.r; return [best.c.big - best.c.b, best.c.k / best.c.n]; } });
        v.render(() => {
          const isYou = who.value === 'you';
          bFl.hidden = bL.hidden = bR.hidden = bRes.hidden = !isYou; hd.visible = !isYou;
          const cells = agg(isYou ? you : sim), F = fitW(cells), w = F ? F.w : W;
          // ---- stimulus
          for (const sx of [-CX, CX]) st.circle(sx, 0, RAD, { color: 'faint', width: 1.2, dash: [3, 4] });
          let show = null;
          if (isYou) { if (phase === 'flash') show = cur; }
          else { const big = Math.round(pick.b * pick.r); show = { b: pick.b, r: pick.r, big, bigSide: 1, area: false }; }
          if (show) {
            const nL = show.bigSide === 0 ? show.big : show.b, nR = show.bigSide === 1 ? show.big : show.b;
            for (const [sx, n, sd] of [[-CX, nL, 11], [CX, nR, 29]]) { const rd = rFor(n, show.area); st.dots(dots(n, rd, tid * 97 + sd + n).map(([x, y]) => [sx + x, y]), { r: Math.max(1.5, rd * st.scale), color: 'ink' }); }
            if (!isYou) { st.text(`${nL}`, -CX, -0.9, { align: 'center', color: 'muted', size: 12, weight: 600 }); st.text(`${nR}`, CX, -0.9, { align: 'center', color: 'muted', size: 12, weight: 600 }); st.text(`ratio ${show.r}`, 0, 0, { align: 'center', color: 'gold', size: 12.5, weight: 700 }); }
          } else st.text(isYou ? (phase === 'wait' ? 'Which side had more?' : last ? `last: ${last.b} vs ${last.big}, ${last.ok ? 'correct' : 'wrong'} — press ▶ Flash` : 'press ▶ Flash') : '', 0, 0, { align: 'center', color: 'muted', size: 13 });
          // ---- accuracy against the difference
          for (const S of [pd, pr]) S.hline(0.5, { color: 'muted', dash: [4, 4], width: 1 });
          for (const b of BASES) {
            pd.fn((d) => pcN(b, b + d, w), { domain: [0.2, 41], color: COLS[b], width: 1.8, alpha: 0.8 });
          }
          for (const c of cells) { const [lo, hi] = wilson(c.k, c.n); pd.line(c.big - c.b, lo, c.big - c.b, hi, { color: COLS[c.b], width: 1.1, alpha: 0.45 }); pd.dot(c.big - c.b, c.k / c.n, { r: 4.3, color: COLS[c.b] }); }
          for (const b of BASES) { const x = Math.min(39, Math.round(b * 2) - b); pd.text(`${b} vs …`, x, pcN(b, b + x, w), { dy: 13, align: 'right', color: COLS[b], weight: 700, size: 11.5 }); }
          // ---- accuracy against the ratio
          if (F) {
            const fr = (r, ww) => pcN(1, r, ww);
            if (isFinite(F.se)) { const up = [], dn = []; for (let i = 0; i <= 60; i++) { const r = 1 + (1.05 * i) / 60; up.push([r, fr(r, w * Math.exp(-1.96 * F.se))]); dn.push([r, fr(r, w * Math.exp(1.96 * F.se))]); } pr.poly([...up, ...dn.reverse()], { fill: 'accent', fillAlpha: 0.15, stroke: false }); }
            pr.fn((r) => fr(r, w), { domain: [1, 2.05], color: 'accent', width: 2.6 });
          }
          for (const c of cells) { const [lo, hi] = wilson(c.k, c.n), x = c.r + (BASES.indexOf(c.b) - 1) * 0.012; pr.line(x, lo, x, hi, { color: COLS[c.b], width: 1.1, alpha: 0.45 }); pr.dot(x, c.k / c.n, { r: 4.3, color: COLS[c.b] }); }
          if (!cells.length) { pd.text('no trials yet', 20, 0.7, { align: 'center', color: 'muted', size: 13 }); }
        });
        v.legend([['blue', 'base 10', { dot: true }], ['orange', 'base 20', { dot: true }], ['purple', 'base 40', { dot: true }], ['accent', 'one curve for every base: fitted $w$, 95% band']]);
        v.readout(() => {
          const isYou = who.value === 'you', cells = agg(isYou ? you : sim), F = fitW(cells);
          if (!cells.length) return 'No trials yet. Press **▶ Flash**, don’t try to count, and answer by impression.';
          const acc = (b, r) => { const c = cells.find((q) => q.b === b && q.r === r); return c ? `${pc(c.k / c.n)} (${c.n})` : '—'; };
          const N = cells.reduce((s, c) => s + c.n, 0);
          return `${N} trials · fitted internal Weber fraction $\\hat w$ = **${F ? v.fix(F.w, 3) : '—'}**${F && isFinite(F.se) ? `, 95% CI ${v.fix(F.w * Math.exp(-1.96 * F.se), 3)}–${v.fix(F.w * Math.exp(1.96 * F.se), 3)}` : ''}${isYou ? '' : ` (true ${W})`} · ratio 1.2: 10 vs 12 ${acc(10, 1.2)}, 20 vs 24 ${acc(20, 1.2)}, 40 vs 48 ${acc(40, 1.2)} · the same difference of 4 dots: 20 vs 24 ${acc(20, 1.2)} but 40 vs 44 would sit at ratio 1.1: ${acc(40, 1.1)} · model accuracy at ratio 1.2: ${pc(pcN(1, 1.2, F ? F.w : W))} for every base`;
        });
      },
    },
  ],
};
