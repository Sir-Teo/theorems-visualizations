// Psychology & Perception — Chapter 1: Thresholds and the psychophysical methods

// ---------- shared helpers ----------
const SQ2PI = Math.sqrt(2 * Math.PI);
/** Standard normal distribution function (M = v.M). */
const Phi = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);
/** Standard normal density. */
const phi = (z) => Math.exp(-0.5 * z * z) / SQ2PI;
/** Psychometric function ψ(x) = γ + (1 − γ − λ)·Φ((x − μ)/σ) of an observer or a fit f = {mu, sigma, g, l}. */
const psi = (M, f, x) => f.g + (1 - f.g - f.l) * Phi(M, (x - f.mu) / f.sigma);
/** Choices for the "who is the subject" control. */
const OBS = [{ value: 'sim', label: 'simulated observer' }, { value: 'you', label: 'you' }];
/** Trials [{x, r}] grouped by level → [{x, n, k}] (k = number of "yes" or correct answers), sorted by x. */
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
/**
 * Maximum-likelihood fit of ψ(x) = g + (1 − g − l)Φ((x − μ)/σ) to binned data [{x, n, k}] with g, l fixed.
 * Works in (μ, log σ); the covariance [var μ, cov, var log σ] is the inverse of the observed information
 * (a numerical Hessian of the negative log-likelihood). o: {g, l, lo, hi}, [lo, hi] = plausible threshold range.
 * Returns null with too little data; ok = false when the likelihood has no interior maximum (e.g. all answers equal).
 */
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
/** Level at which a fit reaches probability p, with its delta-method standard error (NaN without a covariance). */
function thrOf(M, f, p) {
  const q = M.dist.normal(0, 1).quantile(Math.min(0.999, Math.max(0.001, (p - f.g) / (1 - f.g - f.l)))), x = f.mu + f.sigma * q;
  if (!f.cov) return { x, se: NaN };
  const a = f.sigma * q;
  return { x, se: Math.sqrt(Math.max(0, f.cov[0] + 2 * a * f.cov[1] + a * a * f.cov[2])) };
}
/** Draw a fitted psychometric curve over [a, b] with its pointwise 95% band (delta method in z = (x − μ)/σ). */
function drawFit(s, M, f, a, b, o = {}) {
  const col = o.color || 'accent', n = 100, up = [], dn = [], mid = [], A = 1 - f.g - f.l;
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n, z = (x - f.mu) / f.sigma;
    mid.push([x, f.g + A * Phi(M, z)]);
    if (f.cov) {
      const sd = Math.sqrt(Math.max(0, f.cov[0] / (f.sigma * f.sigma) + (2 * z * f.cov[1]) / f.sigma + z * z * f.cov[2]));
      up.push([x, f.g + A * Phi(M, z + 1.96 * sd)]); dn.push([x, f.g + A * Phi(M, z - 1.96 * sd)]);
    }
  }
  if (up.length && o.band !== false) s.poly([...up, ...dn.reverse()], { fill: col, fillAlpha: o.bandAlpha ?? 0.16, stroke: false });
  s.path(mid, { color: col, width: o.width ?? 2.6, dash: o.dash });
}
/** Proportions per level as dots (area ∝ number of trials) with Wilson 95% bars. */
function drawData(s, data, o = {}) {
  const col = o.color || 'ink', nMax = Math.max(1, ...data.map((d) => d.n));
  for (const d of data) {
    const [a, b] = wilson(d.k, d.n);
    s.line(d.x, a, d.x, b, { color: col, width: 1.3, alpha: 0.5 });
    s.dot(d.x, d.k / d.n, { r: 2.6 + 3.4 * Math.sqrt(d.n / nMax), color: col });
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
/** An endless block-randomised sequence of levels: every level once per block, in a fresh random order. */
function blockQueue(levels, r) { let q = []; return () => { if (!q.length) q = r.shuffle(levels); return q.pop(); }; }
/** Corner brackets marking where a target will appear on a stimulus screen (grey value gv). */
function brackets(s, q, d, gv) {
  for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) s.path([[a * q, b * (q - d)], [a * q, b * q], [a * (q - d), b * q]], { color: [gv, gv, gv], width: 2 });
}
/** Percent with one decimal. */
const pc = (x) => (100 * x).toFixed(x < 0.1 ? 1 : 0) + '%';

export default {
  collection: 'psych',
  chapter: 1,
  title: 'Thresholds and the psychophysical methods',
  summary: String.raw`Psychophysics begins with two questions: how much stimulus is needed to be noticed at all, and how much must be added before a change is noticed. Because responses are noisy, both thresholds are statistical: the probability of detection rises smoothly with intensity along the psychometric function, and the classical methods (limits, adjustment, constant stimuli), adaptive staircases and forced choice are different ways of sampling that curve efficiently and without bias. Weber found that the just-noticeable difference grows in proportion to the intensity it is added to, Fechner integrated that rule into a logarithmic scale of sensation, and the chapter ends with where the rule bends and how far it reaches — even into our sense of number.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Absolute threshold',
      statement: String.raw`The **absolute threshold** (stimulus threshold, or RL from the German *Reiz-Limen*) of a sense is the smallest stimulus intensity that can be detected. The same weak stimulus is detected on some presentations and missed on others, so the threshold is defined **statistically**: present stimuli of fixed intensities many times, record the proportion $P(x)$ of presentations of intensity $x$ on which the observer reports detecting it, and call the threshold the intensity detected on half of them,
$$P(x_{50}) = 0.5 .$$
The classical picture of a sharp barrier (never detected below $x_{50}$, always above) is never what one observes: $P(x)$ climbs smoothly over a range of intensities (the psychometric function, 1.3). A threshold therefore belongs to an observer **under stated conditions**: adaptation, stimulus size and duration, wavelength or frequency, the method and the observer's willingness to say “yes” all move it. Two classic values: a fully dark-adapted eye sees a brief, small flash when roughly 54–148 photons reach the cornea, of which only about 5–14 are absorbed by rods (Hecht, Shlaer & Pirenne, 1942); the ear at 1–4 kHz responds to pressure swings of about 20 µPa.`,
      idea: String.raw`Detection is noisy because both the stimulus (photon arrivals are random) and the nervous system (spontaneous firing) fluctuate from moment to moment. If the internal effect of a stimulus is its intensity plus random noise, and the observer says “yes” when that effect exceeds a fixed level, then the probability of “yes” is the chance that the noise does not drag the effect below that level: a smooth, rising function of $x$ that passes through $\tfrac12$ where the stimulus alone sits exactly at the criterion. Repeating each intensity turns yes/no answers into proportions, and a curve fitted through them by maximum likelihood locates the 50% point with a confidence interval that narrows as trials accumulate (1.4).`,
      caption: String.raw`The default subject is a simulated observer (seeded random numbers): 20 trials at each of seven intensities, including blank trials with no dot. Drag the **gold** handle along the curve to see what that intensity looks like on the screen. Switch to **you** and press *▶ Flash*: a patch of visual noise appears for a quarter of a second, sometimes with a faint dot at its centre; answer *Seen it* or *Nothing* and the next flash follows. (The visual noise stands in for the eye's own noise, so your threshold falls inside the range a screen can show.) Turn on **sharp threshold** to compare the classical step with what the data do.`,
      deps: [],
      refs: ['Gescheider ch. 2'],
      tags: ['threshold', 'detection'],
      credit: 'Herbart, 1824 (the idea); Fechner, 1860 (its measurement)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Absolute_threshold' },
      viz(v) {
        const M = v.M, after = timers(v);
        const LEV = [0, 2, 4, 6, 9, 13, 19], BG = 100, NS = 7, SB = 0.085, RP = 0.6, XMAX = 20.5;
        const OBSV = { mu: 7, sigma: 2.6, g: 0.03, l: 0.02 };
        let phase = 'idle', cur = null, trialId = 0, lastKey = '';
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; } });
        const sharp = v.toggle('sharp threshold', false);
        const bFlash = v.button('▶ Flash', () => flash());
        const bYes = v.button('Seen it', () => answer(true));
        const bNo = v.button('Nothing', () => answer(false));
        const bMore = v.button('35 more trials', () => simulate(35));
        v.button('Reset', () => { after.clear(); phase = 'idle'; if (who.value === 'sim') { Rs = v.rng(97); nextS = blockQueue(LEV, Rs); sim = []; simulate(140); } else you = []; });
        const st = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 310, weight: 0.8, title: 'the screen' });
        const pl = v.stage({ x: [-2.4, 21], y: [-0.14, 1.08], height: 310, axes: 'box', weight: 1.2, xlabel: 'dot intensity', ylabel: 'proportion “seen”', yticks: [0, 0.25, 0.5, 0.75, 1], title: 'detection: proportion of trials answered “seen”' });
        let fit = null;
        const probe = pl.handle(12, 0.4, { color: 'gold', constrain: (x) => { const xx = M.clamp(x, 0, 20); return [xx, fit ? psi(M, fit, xx) : 0.5]; } });
        let Rs = v.rng(97), nextS = blockQueue(LEV, Rs), sim = [], you = [];
        const Ry = v.rng(2024), nextY = blockQueue(LEV, Ry);
        const simulate = (n) => { for (let i = 0; i < n; i++) { const x = nextS(); sim.push({ x, r: Rs() < psi(M, OBSV, x) }); } };
        simulate(140);
        const flash = () => { if (who.value !== 'you' || phase !== 'idle') return; cur = nextY(); trialId++; phase = 'flash'; after(260, () => { phase = 'wait'; }); };
        const answer = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ x: cur, r }); phase = 'idle'; after(550, flash); };
        const analyse = () => {
          const data = binTrials(who.value === 'you' ? you : sim), b0 = data.find((d) => d.x === 0);
          const g = b0 && b0.n >= 3 ? Math.min(0.3, b0.k / b0.n) : 0.02;
          return { data, f: fitPsy(M, data, { g, l: 0.02, lo: 0, hi: 19 }) };
        };
        v.render(() => {
          const isYou = who.value === 'you';
          bFlash.hidden = bYes.hidden = bNo.hidden = !isYou; bMore.hidden = isYou; probe.visible = !isYou;
          const { data, f } = analyse(); fit = f;
          const key = isYou + '|' + sharp.value;
          if (key !== lastKey) {
            lastKey = key;
            v.legend([['ink', 'proportion “seen” at each intensity (95% bars)', { dot: true }], ['accent', 'fitted psychometric function, 95% band'], ...(isYou ? [] : [['muted', 'the simulated observer’s true curve', { dash: true }]]), ['orange', '50% threshold, 95% CI'], ...(sharp.value ? [['red', 'a sharp threshold at the same place']] : [])]);
          }
          // ---- the screen
          st.rect(-4, -4, 4, 4, { fill: [BG, BG, BG], fillAlpha: 1, stroke: false });
          const A = isYou ? (phase === 'flash' ? cur : null) : probe.x;
          if (A != null) {
            const Rn = v.rng(isYou ? 977 + trialId * 7919 : 5);
            st.raster((x, y) => {
              const r2 = x * x + y * y; if (r2 > RP * RP) return null;
              const gv = M.clamp(Math.round(BG + NS * Rn.normal() + A * Math.exp(-r2 / (2 * SB * SB))), 0, 255);
              return [gv, gv, gv];
            }, { res: 1, key: isYou ? 'y' + trialId : 'p' + A.toFixed(2), id: 'stim' });
          }
          brackets(st, 0.7, 0.13, BG + 55);
          const msg = isYou ? (phase === 'wait' ? 'Was there a dot?' : phase === 'flash' ? '' : 'press ▶ Flash') : `intensity ${A.toFixed(1)} grey levels`;
          if (msg) st.text(msg, 0, -0.86, { align: 'center', color: [228, 228, 228], halo: false, size: 13 });
          // ---- the data
          pl.hline(0.5, { color: 'faint', dash: [4, 4], width: 1 });
          if (!isYou) pl.fn((x) => psi(M, OBSV, x), { domain: [0, XMAX], color: 'muted', dash: [6, 5], width: 1.5 });
          if (f) {
            const t = thrOf(M, f, 0.5);
            if (sharp.value) pl.path([[0, f.g], [t.x, f.g], [t.x, 1 - f.l], [XMAX, 1 - f.l]], { color: 'red', width: 2.2 });
            drawFit(pl, M, f, 0, XMAX);
            if (isFinite(t.se)) pl.line(t.x - 1.96 * t.se, 0.5, t.x + 1.96 * t.se, 0.5, { color: 'orange', width: 7, alpha: 0.45, cap: 'butt' });
            pl.line(t.x, -0.14, t.x, 0.5, { color: 'orange', dash: [4, 3], width: 1.4 });
            pl.dot(t.x, 0.5, { r: 5, color: 'orange' });
            pl.text('threshold', t.x, 0.5, { dx: -10, dy: -12, align: 'right', color: 'orange', weight: 600, size: 12.5 });
          }
          drawData(pl, data);
          if (!isYou) { probe.y = f ? psi(M, f, probe.x) : 0.5; pl.line(probe.x, -0.14, probe.x, probe.y, { color: 'gold', dash: [2, 3], width: 1.2 }); }
          if (!data.length) pl.text('no trials yet — press ▶ Flash', 9.5, 0.72, { align: 'center', color: 'muted', size: 13 });
        });
        v.readout(() => {
          const { data, f } = analyse(), N = data.reduce((s, d) => s + d.n, 0);
          if (!N) return 'No trials yet. Press **▶ Flash**, look at the centre of the brackets, and answer honestly: guessing “seen” when unsure moves your threshold down, and saying “nothing” unless certain moves it up.';
          if (!f) return `${N} trial${N > 1 ? 's' : ''} so far: keep going (a curve needs at least two intensities and six trials).`;
          const t = thrOf(M, f, 0.5);
          const below = data.filter((d) => d.x > 0 && d.x < t.x), above = data.filter((d) => d.x > t.x);
          const pB = below.reduce((s, d) => s + d.k, 0) / Math.max(1, below.reduce((s, d) => s + d.n, 0));
          const pA = 1 - above.reduce((s, d) => s + d.k, 0) / Math.max(1, above.reduce((s, d) => s + d.n, 0));
          const tTrue = thrOf(M, OBSV, 0.5).x;
          const ci = isFinite(t.se) ? `, 95% CI [${v.fix(t.x - 1.96 * t.se, 2)}, ${v.fix(t.x + 1.96 * t.se, 2)}]` : ' (no confidence interval yet: the data do not pin the curve down)';
          return `${N} trials · 50% threshold $\\hat x_{50}$ = **${v.fix(t.x, 2)}** grey levels${ci}${who.value === 'sim' ? ` (true ${v.fix(tTrue, 2)})` : ''} · spread $\\hat\\sigma$ = ${v.fix(f.sigma, 2)} · “seen” on ${pc(pB)} of the dot trials below the threshold and “nothing” on ${pc(pA)} of those above it, so there is no sharp step · “seen” on blank trials (false alarms): ${pc(f.g)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Difference threshold and the just-noticeable difference',
      statement: String.raw`Fix a **standard** stimulus $S$ and present **comparison** stimuli $C$ near it, asking each time whether $C$ is greater or smaller than $S$ (higher, louder, brighter, heavier). The proportion $P(C)$ of “greater” answers rises smoothly from 0 to 1. Write $C_{25}, C_{50}, C_{75}$ for the comparisons judged greater on 25%, 50% and 75% of trials. Then:

- the **point of subjective equality** is $\mathrm{PSE}=C_{50}$, and the **constant error** is $\mathrm{CE}=\mathrm{PSE}-S$ (a systematic bias, such as the time-order error when $S$ always comes first);
- the **upper** and **lower difference thresholds** are $C_{75}-\mathrm{PSE}$ and $\mathrm{PSE}-C_{25}$, and the **interval of uncertainty** is $C_{75}-C_{25}$;
- the **difference threshold** or **just-noticeable difference** is half of it, $\mathrm{JND}=\tfrac12\,(C_{75}-C_{25})$ (DL, *Differenz-Limen*).

Like the absolute threshold (1.1), the JND is a statistical quantity defined by a criterion proportion, not a smallest quantum of sensation: smaller differences are noticed sometimes, larger ones are missed sometimes. For a cumulative-normal $P$ with spread $\sigma$, $\mathrm{JND}=0.674\,\sigma$.`,
      idea: String.raw`If each presentation of $C$ produces an internal impression $C+\varepsilon$ with Gaussian noise of spread $\sigma$, and the standard is remembered as $\mathrm{PSE}$, then $P(C)=\Phi\big((C-\mathrm{PSE})/\sigma\big)$: the 25% and 75% points lie $0.674\,\sigma$ either side of the PSE, so the JND measures the noise that limits discrimination, while the PSE measures bias. A difference of one JND is noticed on 75% of comparisons; three JNDs on about 98%. Weber's question (1.9) is how the JND changes with the standard.`,
      caption: String.raw`The standard is a 500 Hz tone, the comparison is up to 30 cents (hundredths of a semitone) above or below. The simulated observer has 45 trials at each of nine comparisons. Drag the **gold** handle along the curve and press *Listen* to hear that pair; *Hear one JND* warbles a sustained tone between 500 Hz and one JND above it, live. Switch to **you**, press *Play pair* and answer whether the second tone was higher or lower; the next pair follows, and your own curve, PSE and JND appear as you go (headphones help).`,
      deps: ['psych-1.1'],
      see: ['music-5.9'],
      refs: ['Gescheider ch. 1'],
      tags: ['JND', 'discrimination'],
      credit: 'Weber, 1834; Fechner, 1860',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Just-noticeable_difference' },
      viz(v) {
        const M = v.M, after = timers(v), ph = playhead(v), F0 = 500, LEV = [-30, -20, -12, -6, 0, 6, 12, 20, 30], XR = 34;
        const OBSV = { mu: -2.5, sigma: 9, g: 0.02, l: 0.02 };
        const fq = (c) => F0 * Math.pow(2, c / 1200);
        const VOICE = { harmonics: 4, rolloff: 1.3, gain: 0.22, attack: 0.02, release: 0.06, duration: 0.45 };
        let phase = 'idle', cur = null, last = null, pair = null;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { after.clear(); phase = 'idle'; v.sound().stop(); } });
        const play = (c) => { const snd = v.sound(); snd.stop(); snd.tone(F0, VOICE); snd.tone(fq(c), { ...VOICE, delay: 0.75 }); pair = c; ph.start(1.3); };
        const bListen = v.soundButton('Listen: standard, then gold', () => play(probe.x));
        const bPlay = v.soundButton('Play pair', () => next());
        const bHi = v.button('2nd higher', () => answer(true));
        const bLo = v.button('2nd lower', () => answer(false));
        v.soundButton('Hear one JND', (snd) => {
          const { f } = analyse(), J = f ? (thrOf(M, f, 0.75).x - thrOf(M, f, 0.25).x) / 2 : 6;
          const vc = snd.tone(F0, { ...VOICE, sustain: true, gain: 0.2 });
          for (let i = 1; i <= 10; i++) after(i * 360, () => vc.setFreq(i % 2 ? fq(J) : F0));
          after(11 * 360, () => vc.stop());
        });
        const bMore = v.button('45 more trials', () => simulate(45));
        v.button('Reset', () => { after.clear(); phase = 'idle'; if (who.value === 'sim') { Rs = v.rng(129); nextS = blockQueue(LEV, Rs); sim = []; simulate(405); } else { you = []; last = null; } });
        const roll = v.stage({ x: [-0.16, 1.42], y: [-40, 44], height: 300, axes: 'box', weight: 0.75, xlabel: 't (s)', ylabel: 'pitch (cents)', yticks: [-30, -20, -10, 0, 10, 20, 30], title: 'one trial: standard, then comparison' });
        const pl = v.stage({ x: [-XR - 6, XR + 1], y: [-0.14, 1.08], height: 300, axes: 'box', weight: 1.25, xlabel: 'comparison − standard (cents)', ylabel: 'P(“2nd higher”)', yticks: [0, 0.25, 0.5, 0.75, 1], title: 'comparison judgements' });
        let fit = null;
        const probe = pl.handle(12, 0.8, { color: 'gold', constrain: (x) => { const xx = M.clamp(x, -XR, XR); return [xx, fit ? psi(M, fit, xx) : 0.5]; } });
        let Rs = v.rng(129), nextS = blockQueue(LEV, Rs), sim = [], you = [];
        const nextY = blockQueue(LEV, v.rng(77));
        const simulate = (n) => { for (let i = 0; i < n; i++) { const x = nextS(); sim.push({ x, r: Rs() < psi(M, OBSV, x) }); } };
        simulate(405);
        const next = () => { if (who.value !== 'you' || phase === 'play') return; cur = nextY(); phase = 'play'; play(cur); after(1350, () => { phase = 'wait'; }); };
        const answer = (r) => { if (who.value !== 'you' || phase !== 'wait') return; you.push({ x: cur, r }); last = { c: cur, r }; phase = 'idle'; after(650, next); };
        const analyse = () => { const data = binTrials(who.value === 'you' ? you : sim); return { data, f: fitPsy(M, data, { g: 0.02, l: 0.02, lo: -30, hi: 30 }) }; };
        v.legend([['accent', 'standard (500 Hz)'], ['gold', 'comparison'], ['ink', 'proportion “2nd higher” (95% bars)', { dot: true }], ['green', '$C_{25}$, PSE, $C_{75}$'], ['purple', 'interval of uncertainty = 2 JND']]);
        v.render(() => {
          const isYou = who.value === 'you';
          bListen.hidden = bMore.hidden = isYou; bPlay.hidden = bHi.hidden = bLo.hidden = !isYou; probe.visible = !isYou;
          const { data, f } = analyse(); fit = f;
          // ---- the trial
          const t = ph.t, c = isYou ? (phase === 'idle' && last ? last.c : null) : probe.x;
          roll.hline(0, { color: 'faint', dash: [3, 4], width: 1 });
          roll.rect(0, -1.8, 0.45, 1.8, { fill: 'accent', fillAlpha: 0.9, stroke: false });
          roll.text(`${F0} Hz`, 0.225, 4.5, { align: 'center', color: 'accent', size: 12, weight: 600 });
          if (c != null) {
            roll.rect(0.75, c - 1.8, 1.2, c + 1.8, { fill: 'gold', fillAlpha: 0.95, stroke: false });
            roll.text(`${v.fix(fq(c), 1)} Hz`, 0.975, c + (c >= 0 ? 5.5 : -5.5), { align: 'center', color: 'gold', size: 12, weight: 600 });
            if (Math.abs(c) > 4) roll.arrow(0.62, 0, 0.62, c, { color: 'muted', width: 1.4, head: 6 });
            roll.text(`${c > 0 ? '+' : c < 0 ? '−' : '±'}${v.fix(Math.abs(c), 1)} ¢`, 0.6, c / 2, { align: 'right', dx: -6, color: 'muted', size: 11.5 });
          } else {
            roll.rect(0.75, -32, 1.2, 32, { fill: 'gray', fillAlpha: 0.12, color: 'faint', width: 1, dash: [4, 3] });
            roll.text('?', 0.975, 0, { align: 'center', color: 'muted', size: 30, weight: 600 });
          }
          if (t != null) roll.vline(Math.min(1.3, t), { color: 'red', width: 1.5 });
          if (isYou && last) roll.corner(`last pair: ${last.c > 0 ? '+' : last.c < 0 ? '−' : '±'}${Math.abs(last.c)} ¢, you said ${last.r ? 'higher' : 'lower'}${last.c ? (last.r === last.c > 0 ? ' ✓' : ' ✗') : ''}`, 'bl', { color: 'muted', size: 11.5 });
          // ---- the psychometric function
          pl.hline(0.5, { color: 'faint', dash: [4, 4], width: 1 });
          pl.vline(0, { color: 'faint', width: 1 });
          if (f) {
            drawFit(pl, M, f, -XR, XR);
            const q25 = thrOf(M, f, 0.25).x, q50 = thrOf(M, f, 0.5), q75 = thrOf(M, f, 0.75).x;
            for (const [x, p] of [[q25, 0.25], [q50.x, 0.5], [q75, 0.75]]) { pl.line(x, -0.14, x, p, { color: 'green', dash: [4, 3], width: 1.2 }); pl.dot(x, p, { r: 4.5, color: 'green' }); }
            pl.text('PSE', q50.x, 0.5, { dx: 8, dy: 10, color: 'green', weight: 600, size: 12 });
            pl.measure(q25, 0.93, q75, 0.93, 'interval of uncertainty', { color: 'purple', math: false, size: 11.5, offset: -10 });
            pl.text('JND', (q25 + q50.x) / 2, 0.25, { dy: 12, align: 'center', color: 'purple', weight: 600, size: 11.5 });
            pl.text('JND', (q50.x + q75) / 2, 0.75, { dy: -12, align: 'center', color: 'purple', weight: 600, size: 11.5 });
            pl.line(q25, 0.25, q50.x, 0.25, { color: 'purple', width: 2 }); pl.line(q50.x, 0.75, q75, 0.75, { color: 'purple', width: 2 });
          }
          drawData(pl, data);
          if (!isYou) { probe.y = f ? psi(M, f, probe.x) : 0.5; }
          if (!data.length) pl.text('no trials yet — press Play pair', 0, 0.68, { align: 'center', color: 'muted', size: 13 });
        });
        v.readout(() => {
          const { data, f } = analyse(), N = data.reduce((s, d) => s + d.n, 0);
          if (!N) return 'No trials yet. Press **Play pair**: you hear the 500 Hz standard, then a comparison. Answer *2nd higher* or *2nd lower* even when unsure — a guess is data too.';
          if (!f) return `${N} trial${N > 1 ? 's' : ''} so far: keep going.`;
          const q25 = thrOf(M, f, 0.25).x, q50 = thrOf(M, f, 0.5), q75 = thrOf(M, f, 0.75).x, J = (q75 - q25) / 2;
          const ci = isFinite(q50.se) ? ` ± ${v.fix(1.96 * q50.se, 1)}` : '';
          return `${N} trials · PSE = ${v.fix(q50.x, 1)}${ci} ¢, so the constant error is ${v.fix(q50.x, 1)} ¢${who.value === 'sim' ? ' (this observer hears the second tone as slightly higher: a time-order error)' : ''} · $C_{25}$ = ${v.fix(q25, 1)} ¢, $C_{75}$ = ${v.fix(q75, 1)} ¢ · upper DL ${v.fix(q75 - q50.x, 1)} ¢, lower DL ${v.fix(q50.x - q25, 1)} ¢ · **JND = ${v.fix(J, 1)} ¢** = ${v.fix(100 * (Math.pow(2, J / 1200) - 1), 2)}% of the frequency (${v.fix(fq(J) - F0, 2)} Hz at 500 Hz) · fitted spread $\\hat\\sigma$ = ${v.fix(f.sigma, 1)} ¢${who.value === 'sim' ? ' (true 9 ¢, JND 6.4 ¢)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'The psychometric function',
      statement: String.raw`The **psychometric function** $\psi(x)$ gives the probability of a particular response (“yes, I detect it”, “greater”, or “correct”) as a function of a stimulus variable $x$. It is usually written
$$\psi(x)=\gamma+(1-\gamma-\lambda)\,F\!\Big(\frac{x-\alpha}{\beta}\Big),$$
where $F$ is a sigmoid distribution function (cumulative normal, logistic or Weibull), $\alpha$ the **threshold** (location), $\beta$ the **spread** (the reciprocal of the slope), $\gamma$ the guess rate (the floor: 0 for yes/no detection, $1/m$ for $m$-alternative forced choice) and $\lambda$ the lapse rate (trials missed through inattention). In the simplest model the stimulus produces an internal response $R=x+\varepsilon$ with Gaussian noise $\varepsilon\sim N(0,\sigma^2)$ and the observer answers “yes” when $R$ exceeds a criterion $c$; then
$$\psi(x)=P(R>c)=\Phi\Big(\frac{x-c}{\sigma}\Big),$$
so the threshold is the criterion and the spread is the internal noise: the slope at threshold is $1/(\sigma\sqrt{2\pi})$, and as $\sigma\to0$ the curve becomes the classical step.`,
      idea: String.raw`$P(R>c)$ is the area of the noise distribution, centred at $x$, that lies beyond $c$. Sliding $x$ past $c$ sweeps that area from 0 to 1 along the normal distribution function (prob-1.2.5), and the width of the noise sets how gradual the sweep is. Fitting the curve to data inverts this: the maximum-likelihood fit (stat-3.5) treats the count at each level as binomial, and the curvature of the log-likelihood at its peak gives standard errors for $\alpha$ and $\beta$, hence a confidence band for the curve.`,
      caption: String.raw`Left, inside the observer: the gold bell is the distribution of internal responses to one stimulus level, and the green area beyond the red criterion is the probability of “yes”. Drag the **gold** handle along the curve on the right to change the level, and the **red** handle to move the criterion. Lower the **internal noise** and the curve steepens towards a step; raise the **trials per level** and the fitted curve (blue, with its 95% band) settles onto the true one (dashed). Turn on **lapses** to see the floor and ceiling pull away from 0 and 1.`,
      deps: ['psych-1.1', 'prob-1.2.5', 'stat-3.5'],
      refs: ['Gescheider ch. 3'],
      tags: ['psychometric function', 'noise'],
      credit: 'Fechner, 1860; Urban, 1908 (the name)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Psychometric_function' },
      viz(v) {
        const M = v.M, LEV = [1, 2, 3, 4, 5, 6, 7, 8, 9], NMAX = 400;
        const sg = v.slider('internal noise $\\sigma$', 0.03, 3, 1.2, { step: 0.01 });
        const nT = v.slider('trials per level', 4, NMAX, 25, { int: true });
        const lapse = v.toggle('lapses (4% of trials answered at random)', false);
        let seed = 3, U = null, Useed = -1;
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const ev = v.stage({ x: [-1.6, 11.6], y: [-0.24, 1.3], height: 300, axes: 'box', weight: 1, xlabel: 'internal response R', yticks: [], title: 'inside the observer: responses to one level' });
        const pl = v.stage({ x: [-0.9, 10.3], y: [-0.14, 1.08], height: 300, axes: 'box', weight: 1.1, xlabel: 'stimulus level x', ylabel: 'P(yes)', yticks: [0, 0.25, 0.5, 0.75, 1], title: 'the psychometric function' });
        const obs = () => ({ mu: crit.x, sigma: sg.value, g: lapse.value ? 0.02 : 0, l: lapse.value ? 0.02 : 0 });
        const crit = ev.handle(5, 1.19, { color: 'red', constrain: (x) => [M.clamp(x, 1.5, 8.5), 1.19] });
        const probe = pl.handle(4, 0.25, { color: 'gold', constrain: (x) => { const xx = M.clamp(x, 0, 10); return [xx, psi(M, obs(), xx)]; } });
        const sample = () => {
          if (Useed !== seed) { const R = v.rng(seed); U = LEV.map(() => M.range(NMAX).map(() => R())); Useed = seed; }
          const T = obs(), n = nT.value;
          return LEV.map((x, i) => { const p = psi(M, T, x); let k = 0; for (let j = 0; j < n; j++) if (U[i][j] < p) k++; return { x, n, k }; });
        };
        let st = null;
        v.legend([['gold', 'internal responses to the chosen level'], ['green', 'area beyond the criterion = P(yes)', { area: true }], ['muted', 'true $\\psi(x)=\\Phi((x-c)/\\sigma)$', { dash: true }], ['ink', 'simulated proportions', { dot: true }], ['accent', 'maximum-likelihood fit, 95% band'], ['purple', 'slope at threshold']]);
        v.render(() => {
          const T = obs(), s = T.sigma, xp = probe.x, c = crit.x;
          probe.y = psi(M, T, xp);
          // ---- inside the observer
          const bell = (m) => (R) => 0.92 * Math.exp(-0.5 * ((R - m) / s) ** 2);
          for (const x of LEV) ev.fn(bell(x), { domain: [x - 4.5 * s, x + 4.5 * s], color: 'muted', width: 1, alpha: 0.28, n: 120 });
          const b = bell(xp), lo = xp - 5 * s, hi = xp + 5 * s;
          if (c > lo) ev.between(b, () => 0, lo, Math.min(c, hi), { fill: 'red', fillAlpha: 0.12 });
          if (c < hi) ev.between(b, () => 0, Math.max(c, lo), hi, { fill: 'green', fillAlpha: 0.3 });
          ev.fn(b, { domain: [lo, hi], color: 'gold', width: 2.6, n: 240 });
          ev.vline(c, { color: 'red', width: 2 });
          ev.text('criterion c', c, 1.19, { dx: 12, align: 'left', color: 'red', weight: 600, size: 12 });
          ev.line(xp, 0, xp, 0.92, { color: 'gold', dash: [3, 3], width: 1.2 });
          ev.text('x', xp, 0.06, { dx: 5, align: 'left', color: 'gold', math: true, size: 15 });
          const pYes = M.integrate((R) => phi((R - xp) / s) / s, c, xp + 12 * s, 600);
          ev.text(`yes: ${v.fix(pYes, 3)}`, c, 1.03, { dx: 7, align: 'left', color: 'green', weight: 700, size: 12.5 });
          ev.text(`no: ${v.fix(1 - pYes, 3)}`, c, 1.03, { dx: -7, align: 'right', color: 'red', weight: 700, size: 12.5 });
          // ---- the psychometric function
          const data = sample(), f = fitPsy(M, data, { g: T.g, l: T.l, lo: 0, hi: 10 });
          pl.hline(0.5, { color: 'faint', dash: [4, 4], width: 1 });
          pl.fn((x) => psi(M, T, x), { domain: [0, 10], color: 'muted', dash: [6, 5], width: 1.6, n: 400 });
          if (f) {
            drawFit(pl, M, f, 0, 10);
            const t = thrOf(M, f, 0.5), slope = ((1 - f.g - f.l) * phi(0)) / f.sigma, d = Math.min(1.2, 0.32 / slope);
            pl.line(t.x - d, 0.5 - slope * d, t.x + d, 0.5 + slope * d, { color: 'purple', width: 2.2 });
            if (isFinite(t.se)) pl.line(t.x - 1.96 * t.se, 0.5, t.x + 1.96 * t.se, 0.5, { color: 'orange', width: 7, alpha: 0.45, cap: 'butt' });
            pl.dot(t.x, 0.5, { r: 4.5, color: 'orange' });
            pl.text('threshold', t.x, 0.5, { dx: 10, dy: 12, align: 'left', color: 'orange', weight: 600, size: 12 });
          }
          drawData(pl, data);
          pl.line(xp, -0.14, xp, probe.y, { color: 'gold', dash: [2, 3], width: 1.2 });
          st = { T, f, pYes, xp };
        });
        v.readout(() => {
          if (!st) return '';
          const { T, f, pYes, xp } = st, exact = psi(M, { ...T, g: 0, l: 0 }, xp);
          let fitTxt = 'no fit';
          if (f) {
            const t = thrOf(M, f, 0.5);
            fitTxt = f.ok ? `fit from ${f.N} trials: threshold $\\hat\\alpha$ = ${v.fix(t.x, 2)} ± ${v.fix(1.96 * t.se, 2)}, spread $\\hat\\sigma$ = ${v.fix(f.sigma, 2)} (95% range ×÷${v.fix(Math.exp(1.96 * Math.sqrt(f.cov[2])), 2)})` : `the data jump from almost no “yes” to almost all “yes” between two levels, so the slope cannot be estimated: the spread is smaller than the spacing of the levels and the curve is effectively the classical step`;
          }
          return `at level $x$ = ${v.fix(xp, 2)}: area beyond $c$ (numerical integral) = ${v.fix(pYes, 4)}, $\\Phi((x-c)/\\sigma)$ = ${v.fix(exact, 4)}${lapse.value ? `, so with lapses $\\psi(x)=0.02+0.96\\times$area = ${v.fix(0.02 + 0.96 * pYes, 4)}` : ''} · true threshold $c$ = ${v.fix(T.mu, 2)}, spread $\\sigma$ = ${v.fix(T.sigma, 2)}, slope at threshold $1/(\\sigma\\sqrt{2\\pi})$ = ${v.fix(phi(0) / T.sigma, 3)}${lapse.value ? ' (×0.96 with lapses)' : ''} per unit · ${fitTxt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Method',
      name: 'Method of constant stimuli',
      statement: String.raw`Choose a fixed set of $k$ stimulus levels (typically 5–9) that spans the region where responses change, from almost never detected to almost always. Present every level $n$ times in a **random order** (usually in shuffled blocks containing each level once), and record the proportion of “yes” (or correct) responses at each level. Fit a psychometric function (1.3) to the $k$ binomial proportions, by probit analysis or maximum likelihood, and read off the threshold (the 50% point, or 75% in two-alternative forced choice) and the slope, with standard errors.

The standard error of the threshold shrinks like $1/\sqrt{N}$ in the total number of trials $N=kn$, with a constant set by the **Fisher information** the chosen levels carry about the threshold. Randomising the order prevents the observer from anticipating the next stimulus (compare the method of limits, 1.5), and the whole curve is measured, not just one point. The price is inefficiency: levels far from the threshold carry little information, and levels placed entirely on one side of it leave the threshold undetermined.`,
      idea: String.raw`At a level where the observer says “yes” with probability $\psi$, one trial carries information $\psi'^2/(\psi(1-\psi))$ about the curve's position: a lot where the curve is steep, almost none where it is flat at 0 or 1. Summing over the design gives the information matrix of $(\mu,\log\sigma)$; by the asymptotic theory of maximum likelihood (stat-3.5, stat-5.5) the threshold estimate is approximately normal with variance equal to the corresponding entry of the inverse, divided by $N$. That is why the error bars shrink as $1/\sqrt N$, and why they explode when every level sits on the flat part of the curve.`,
      caption: String.raw`Press play: block-randomised trials stream in (the most recent is outlined in **gold**), each bar is the proportion of “yes” at one level, and the blue curve with its 95% band is refitted after every trial. The orange bar at 50% is the threshold's 95% confidence interval. Right: the standard error against the number of trials on log–log axes; the dots are the refitted fits, the green line the prediction from the Fisher information, falling with slope −½. Drag the two **orange** handles to move the lowest and highest of the seven levels: crowd them all above the threshold and watch the information vanish and the error bars blow up.`,
      deps: ['psych-1.3', 'stat-3.5', 'stat-5.5'],
      refs: ['Gescheider ch. 3'],
      tags: ['method', 'estimation'],
      credit: 'Fechner, 1860 (method of right and wrong cases)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Psychophysics#Classical_psychophysical_methods' },
      viz(v) {
        const M = v.M, OB = { mu: 5, sigma: 1.4, g: 0, l: 0.01 }, NMAX = 7 * 90, PER = 16, YH = -0.075;
        let seed = 41, trials = null, tSeed = -1, seCache = null, seKey = '', st = null;
        v.button('New random sample', () => { seed = 1 + ((Math.random() * 1e9) | 0); });
        const pl = v.stage({ x: [-0.9, 12.4], y: [-0.24, 1.1], height: 320, axes: 'box', weight: 1.3, xlabel: 'stimulus level', yticks: [0, 0.25, 0.5, 0.75, 1], title: 'proportion “yes” at seven fixed levels, presented in random order' });
        const se = v.stage({ x: [7, 900], y: [0.03, 30], xlog: true, ylog: true, height: 320, axes: 'box', weight: 0.85, xlabel: 'trials N', ylabel: 'SE of threshold', title: 'precision grows like √N' });
        const hLo = pl.handle(2.4, YH, { color: 'orange', constrain: (x) => [M.clamp(x, 0, hHi.x - 1.2), YH] });
        const hHi = pl.handle(8.4, YH, { color: 'orange', constrain: (x) => [M.clamp(x, hLo.x + 1.2, 12), YH] });
        const levels = () => M.range(7).map((i) => hLo.x + ((hHi.x - hLo.x) * i) / 6);
        const getTrials = () => {
          if (tSeed !== seed) {
            const R = v.rng(seed); trials = [];
            while (trials.length < NMAX) for (const i of R.shuffle([0, 1, 2, 3, 4, 5, 6])) trials.push({ i, u: R() });
            tSeed = seed;
          }
          return trials;
        };
        const binN = (L, N) => { const tr = getTrials(), d = L.map((x) => ({ x, n: 0, k: 0 })); for (let j = 0; j < N; j++) { const t = tr[j], e = d[t.i]; e.n++; if (t.u < psi(M, OB, e.x)) e.k++; } return d; };
        const fitN = (L, N) => fitPsy(M, binN(L, N), { g: 0, l: 0.01, lo: 0, hi: 12 });
        const Nof = (t) => Math.round(7 * Math.pow(NMAX / 7, Math.min(1, t / (PER - 1.5))));
        /** predicted SE(threshold) per √N from the Fisher information of the design (equal allocation, true parameters) */
        const predSE1 = (L) => {
          let a = 0, b = 0, c = 0;
          for (const x of L) {
            const z = (x - OB.mu) / OB.sigma, p = psi(M, OB, x), d = (1 - OB.g - OB.l) * phi(z), gm = -d / OB.sigma, gs = -d * z, w = 1 / (p * (1 - p));
            a += (w * gm * gm) / 7; b += (w * gm * gs) / 7; c += (w * gs * gs) / 7;
          }
          const det = a * c - b * b, q = M.dist.normal(0, 1).quantile(0.5 / 0.99), k = OB.sigma * q;
          return det > 1e-14 ? Math.sqrt((c - 2 * k * b + k * k * a) / det) : Infinity;
        };
        v.legend([['accent', 'proportion “yes” per level, fitted curve with 95% band', { area: true }], ['muted', 'true curve', { dash: true }], ['orange', 'threshold estimate, 95% CI'], ['gold', 'latest trial'], ['green', 'Fisher-information prediction $\\propto 1/\\sqrt N$']]);
        v.animate((t) => {
          const L = levels(), N = Nof(t), data = binN(L, N), f = fitPsy(M, data, { g: 0, l: 0.01, lo: 0, hi: 12 }), last = getTrials()[N - 1];
          // ---- left: bars, fit
          pl.hline(0.5, { color: 'faint', dash: [4, 4], width: 1 });
          pl.hline(0, { color: 'faint', width: 1 });
          pl.fn((x) => psi(M, OB, x), { domain: [0, 12.4], color: 'muted', dash: [6, 5], width: 1.5 });
          const w = Math.min(0.28, (L[1] - L[0]) * 0.33);
          data.forEach((d, i) => {
            const p = d.n ? d.k / d.n : 0, [a, b] = wilson(d.k, d.n);
            pl.rect(d.x - w, 0, d.x + w, p, { fill: 'accent', fillAlpha: 0.22, stroke: false });
            pl.line(d.x - w, p, d.x + w, p, { color: 'accent', width: 2 });
            if (d.n) pl.line(d.x, a, d.x, b, { color: 'ink', width: 1.2, alpha: 0.55 });
            if (i === last.i) pl.rect(d.x - w - 0.05, -0.012, d.x + w + 0.05, Math.max(0.03, p) + 0.012, { color: 'gold', width: 2 });
          });
          if (f) {
            drawFit(pl, M, f, 0, 12.4, { bandAlpha: 0.13 });
            const th = thrOf(M, f, 0.5);
            if (isFinite(th.se)) pl.line(M.clamp(th.x - 1.96 * th.se, -0.9, 12.4), 0.5, M.clamp(th.x + 1.96 * th.se, -0.9, 12.4), 0.5, { color: 'orange', width: 7, alpha: 0.55, cap: 'butt' });
            if (th.x > -0.9 && th.x < 12.4) pl.dot(th.x, 0.5, { r: 4.5, color: 'orange' });
          }
          const resp = last.u < psi(M, OB, L[last.i]);
          pl.text(resp ? 'yes' : 'no', L[last.i], 1.04, { align: 'center', color: 'gold', weight: 700, size: 12 });
          pl.corner(`N = ${N} trials, ${Math.floor(N / 7)}–${Math.ceil(N / 7)} per level`, 'tl', { color: 'ink', weight: 600 });
          // ---- right: SE against N
          const key = L.map((x) => x.toFixed(3)).join() + '|' + seed;
          if (key !== seKey) {
            seKey = key; seCache = [];
            for (let j = 0; j <= 24; j++) { const n = Math.round(21 * Math.pow(NMAX / 21, j / 24)), ff = fitN(L, n); if (ff && ff.ok) seCache.push([n, thrOf(M, ff, 0.5).se]); }
          }
          const p1 = predSE1(L);
          if (isFinite(p1)) se.fn((n) => p1 / Math.sqrt(n), { color: 'green', width: 2.4 });
          se.dots(seCache, { r: 3, color: 'accent' });
          const th = f && f.ok ? thrOf(M, f, 0.5) : null;
          if (th) se.dot(N, th.se, { r: 6, color: 'gold' });
          se.line(N, 0.03, N, 30, { color: 'gold', width: 1, alpha: 0.5 });
          if (isFinite(p1)) se.text(`slope −½`, 60, p1 / Math.sqrt(60), { dx: 8, dy: -12, align: 'left', color: 'green', size: 12, weight: 600 });
          st = { N, f, th, p1, L };
        }, { period: PER, still: 10.5 });
        v.readout(() => {
          if (!st) return '';
          const { N, f, th, p1, L } = st;
          const info = isFinite(p1) ? (1 / (p1 * p1)).toFixed(3) : '0';
          const lvl = `levels ${L.map((x) => v.fix(x, 1)).join(', ')}`;
          if (!th) return `${N} trials · ${lvl} · the fit cannot locate the threshold yet: ${!f ? 'not enough data' : !isFinite(p1) || p1 > 4 ? 'the levels all sit where the curve is flat, so every level gives nearly the same proportion and the likelihood hardly changes as the threshold moves' : 'with so few trials the answers jump from all “no” to all “yes” between neighbouring levels, so the likelihood has no peak in the slope'} · information per trial about the threshold: ${info}`;
          return `${N} trials · threshold estimate ${v.fix(th.x, 2)} ± ${v.fix(1.96 * th.se, 2)} (95% CI; true value 5.00) · its standard error ${v.fix(th.se, 3)}, predicted $1/\\sqrt{N I}$ = ${isFinite(p1) ? v.fix(p1 / Math.sqrt(N), 3) : '∞'} with information per trial $I$ = ${info} · ${lvl}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'Method of limits and its hysteresis',
      statement: String.raw`In the **method of limits** the experimenter changes the stimulus in small fixed steps in one direction and asks for a yes/no answer at each step. An **ascending** series starts clearly below threshold and stops at the first “yes”; a **descending** series starts clearly above and stops at the first “no”. The threshold estimate of a series is the midpoint between its last two levels, and the threshold is the mean over many series, alternating direction and varying the starting point.

Two expectation errors bias the series in opposite directions. With **habituation** (perseveration) the observer keeps giving the previous answer a little too long, so ascending series stop too high and descending series too low; with **anticipation** the observer expects the change and reports it too early, with the opposite effect. The gap between the ascending and descending means is a *hysteresis*; to first order the two biases are equal and opposite, so **averaging ascending and descending series cancels them**, while varying the starting points stops the observer from counting steps.`,
      idea: String.raw`Each step of a series is a draw from the psychometric function (1.3), so a series stops near the 50% point plus a bias that depends on the direction of approach. If the observer's tendency to repeat (or to switch) shifts the answer probabilities by the same amount in both directions, an ascending series is delayed by about as many dB as a descending series is prolonged, and the bias drops out of their average. The midpoint rule assumes the threshold was crossed somewhere inside the last step, so the step size limits precision; staircases (1.7) make the same idea adaptive.`,
      caption: String.raw`The data sheet: each column is one series, alternately ascending (A, orange) and descending (D, blue); green dots are “yes”, red rings “no”, and the bar marks the series' transition point. Right: the transition points by direction, their means, and their average (green) against the true 50% point (dashed). Drag the **expectation** slider towards habituation or anticipation: the two means split apart in opposite directions while their average stays put. Switch to **you** and run real series on a sustained 1 kHz tone whose level steps by 3 dB each time you answer (set a comfortable volume first and leave it alone).`,
      deps: ['psych-1.1'],
      refs: ['Gescheider ch. 3'],
      tags: ['method', 'bias'],
      credit: 'Fechner, 1860 (method of just noticeable differences)',
      viz(v) {
        const M = v.M, OB = { mu: -63, sigma: 2, g: 0.01, l: 0.01 }, STEP = 3, NS = 16;
        const who = v.select('subject', OBS, 'sim', { onChange: () => { stopTone(); } });
        const hab = v.slider('expectation', -0.6, 0.6, 0.45, { step: 0.01, fmt: (h) => (Math.abs(h) < 0.005 ? 'neutral' : h > 0 ? `habituation ${Math.round(100 * h)}%` : `anticipation ${Math.round(-100 * h)}%`) });
        const bStart = v.soundButton('Start next series', () => startSeries());
        const bYes = v.button('I hear it', () => respond(true));
        const bNo = v.button('I don’t', () => respond(false));
        v.button('Reset', () => { stopTone(); you = []; });
        const sheet = v.stage({ x: [-0.75, NS - 0.25], y: [-84, -38], height: 340, axes: 'box', weight: 1.6, xticks: M.range(NS).map((i) => [i, String(i + 1)]), xlabel: 'series', title: 'the data sheet: tone level in dB re full scale' });
        const sum = v.stage({ x: [0, 3.1], y: [-84, -38], height: 340, axes: 'box', weight: 0.6, minWidth: 170, xticks: [[0.75, 'A'], [1.55, 'D'], [2.4, 'mean']], title: 'transition points' });
        // simulated series: fixed starting points and uniforms, responses recomputed for any expectation bias
        const R = v.rng(31), SER = M.range(NS).map((s) => ({ dir: s % 2 ? 'D' : 'A', start: OB.mu + (s % 2 ? 1 : -1) * STEP * R.int(3, 6), u: M.range(40).map(() => R()) }));
        const runSim = (h) => SER.map((S) => {
          const steps = []; let L = S.start;
          for (let j = 0; j < 40; j++) {
            const p = psi(M, OB, L), asc = S.dir === 'A';
            const py = h >= 0 ? (1 - h) * p + (asc ? 0 : h) : asc ? p - h * (1 - p) : (1 + h) * p;
            const r = S.u[j] < py; steps.push({ L, r });
            if (asc ? r : !r) break;
            L += asc ? STEP : -STEP;
          }
          const n = steps.length;
          return { dir: S.dir, steps, trans: n > 1 ? (steps[n - 1].L + steps[n - 2].L) / 2 : steps[0].L + (S.dir === 'A' ? -STEP / 2 : STEP / 2) };
        });
        /** exact expected transition point of the simulated series, by direction (sum over the step at which a series stops) */
        const expect = (h) => {
          const acc = { A: [0, 0], D: [0, 0] };
          for (const S of SER) {
            const asc = S.dir === 'A'; let cont = 1, E = 0, L = S.start;
            for (let j = 0; j < 60 && cont > 1e-12; j++) {
              const p = psi(M, OB, L), py = h >= 0 ? (1 - h) * p + (asc ? 0 : h) : asc ? p - h * (1 - p) : (1 + h) * p, q = asc ? py : 1 - py;
              E += cont * q * (L + (asc ? -STEP / 2 : STEP / 2)); // stopping at L: the midpoint of the last two steps
              cont *= 1 - q; L += asc ? STEP : -STEP;
            }
            acc[S.dir][0] += E; acc[S.dir][1]++;
          }
          return { A: acc.A[0] / acc.A[1], D: acc.D[0] / acc.D[1] };
        };
        // the reader's series, on a live tone
        let you = [], cur = null, voice = null, L0 = 0;
        const Ry = v.rng(55);
        const stopTone = () => { if (voice) voice.stop(); voice = null; cur = null; };
        const startSeries = () => {
          if (who.value !== 'you') return;
          stopTone();
          const dir = you.length % 2 ? 'D' : 'A', done = you.map((s) => s.trans);
          const est = done.length ? STEP * Math.round(M.mean(done) / STEP) : -63;
          L0 = Math.min(-24, est + (dir === 'A' ? -1 : 1) * STEP * Ry.int(3, 6));
          cur = { dir, steps: [{ L: L0, r: null }], trans: null };
          voice = v.sound().tone(1000, { sustain: true, gain: Math.pow(10, L0 / 20), attack: 0.08 });
        };
        const respond = (heard) => {
          if (who.value !== 'you' || !cur) return;
          const s = cur.steps[cur.steps.length - 1]; s.r = heard;
          const asc = cur.dir === 'A', n = cur.steps.length;
          if ((asc ? heard : !heard) || n >= 30 || (!asc && s.L <= -110) || (asc && s.L >= -24)) {
            cur.trans = n > 1 ? (cur.steps[n - 1].L + cur.steps[n - 2].L) / 2 : s.L + (asc ? -STEP / 2 : STEP / 2);
            you.push(cur); const keep = voice; voice = null; cur = null; if (keep) keep.stop();
          } else {
            const L = s.L + (asc ? STEP : -STEP); cur.steps.push({ L, r: null });
            if (voice) voice.setGain(Math.pow(10, (L - L0) / 20));
          }
        };
        v.legend([['green', '“yes”', { dot: true }], ['red', '“no”', { dot: true }], ['orange', 'ascending series and mean'], ['blue', 'descending series and mean'], ['green', 'average of the two means'], ['muted', 'true 50% point', { dash: true }]]);
        let stats = null;
        v.render(() => {
          const isYou = who.value === 'you';
          hab.el.hidden = isYou; bStart.hidden = bYes.hidden = bNo.hidden = !isYou;
          const ser = isYou ? [...you, ...(cur ? [cur] : [])] : runSim(hab.value);
          // the visible level range
          let lo = -84, hi = -38;
          if (isYou && ser.length) { const all = ser.flatMap((s) => s.steps.map((q) => q.L)); lo = Math.min(-80, Math.min(...all) - 6); hi = Math.max(-42, Math.max(...all) + 7); }
          const ncol = Math.max(NS, ser.length + (isYou && !cur ? 1 : 0));
          sheet.setView([-0.75, ncol - 0.25], [lo, hi]); sum.setView(null, [lo, hi]);
          const yt = []; for (let y = 10 * Math.ceil((lo + 2) / 10); y <= hi - 5; y += 10) yt.push(y);
          sheet.setTicks(M.range(ncol).map((i) => [i, String(i + 1)]), yt); sum.setTicks(undefined, yt);
          for (let L = STEP * Math.ceil(lo / STEP); L <= hi - 4; L += STEP) sheet.hline(L, { color: 'grid', width: 1 });
          ser.forEach((S, i) => {
            const col = S.dir === 'A' ? 'orange' : 'blue';
            sheet.rect(i - 0.42, lo, i + 0.42, hi - 3.2, { fill: col, fillAlpha: 0.06, stroke: false });
            sheet.text(S.dir, i, hi - 1.6, { align: 'center', color: col, weight: 700, size: 13 });
            S.steps.forEach((q, j) => {
              if (q.r == null) sheet.dot(i, q.L, { r: 6.5, color: 'gold', hollow: true, width: 2.4 });
              else if (q.r) sheet.dot(i, q.L, { r: 4.6, color: 'green' });
              else sheet.dot(i, q.L, { r: 4.2, color: 'red', hollow: true, width: 1.8 });
              if (j) sheet.line(i, S.steps[j - 1].L, i, q.L, { color: col, width: 1, alpha: 0.35 });
            });
            if (S.trans != null) sheet.line(i - 0.38, S.trans, i + 0.38, S.trans, { color: col, width: 3.2 });
          });
          if (!isYou) sheet.hline(OB.mu, { color: 'muted', dash: [6, 5], width: 1.3 });
          if (isYou && !ser.length) sheet.text('press Start next series', (ncol - 1) / 2, (lo + hi) / 2, { align: 'center', color: 'muted', size: 13 });
          // ---- summary
          const A = ser.filter((s) => s.dir === 'A' && s.trans != null).map((s) => s.trans), D = ser.filter((s) => s.dir === 'D' && s.trans != null).map((s) => s.trans);
          A.forEach((y, i) => sum.dot(0.75 + ((i % 3) - 1) * 0.12, y, { r: 4, color: 'orange' }));
          D.forEach((y, i) => sum.dot(1.55 + ((i % 3) - 1) * 0.12, y, { r: 4, color: 'blue' }));
          const mA = A.length ? M.mean(A) : null, mD = D.length ? M.mean(D) : null;
          if (mA != null) sum.line(0.45, mA, 1.05, mA, { color: 'orange', width: 3 });
          if (mD != null) sum.line(1.25, mD, 1.85, mD, { color: 'blue', width: 3 });
          if (mA != null && mD != null) {
            const avg = (mA + mD) / 2;
            sum.line(2.05, avg, 2.75, avg, { color: 'green', width: 3.5 });
            sum.measure(2.4, mD, 2.4, mA, null, { color: 'muted' });
            sum.text(v.fix(avg, 1), 2.4, avg, { dy: -11, align: 'center', color: 'green', weight: 700, size: 12 });
          }
          if (!isYou) sum.hline(OB.mu, { color: 'muted', dash: [6, 5], width: 1.3 });
          stats = { mA, mD, nA: A.length, nD: D.length, isYou, playing: !!cur, curL: cur ? cur.steps[cur.steps.length - 1].L : null, ex: isYou ? null : expect(hab.value) };
        });
        v.readout(() => {
          if (!stats) return '';
          const { mA, mD, nA, nD, isYou, playing, curL, ex } = stats;
          const head = isYou && playing ? `tone on at ${curL} dB re full scale — answer whether you hear it · ` : '';
          if (mA == null || mD == null) return head + (isYou ? 'Run at least one ascending and one descending series. The first series ascends from silence; press *I hear it* the moment the tone appears.' : '');
          const avg = (mA + mD) / 2;
          const truth = isYou ? '' : ` · true 50% point ${v.fix(OB.mu, 1)} dB · exact expectations for this observer: ascending ${v.fix(ex.A, 1)}, descending ${v.fix(ex.D, 1)}, average ${v.fix((ex.A + ex.D) / 2, 1)} dB`;
          return `${head}ascending mean ${v.fix(mA, 1)} dB (${nA} series), descending mean ${v.fix(mD, 1)} dB (${nD}) · hysteresis A − D = ${v.fix(mA - mD, 1)} dB ${mA - mD > 0.5 ? '(habituation: each series ran on too long)' : mA - mD < -0.5 ? '(anticipation: each series stopped too early)' : ''} · threshold = average = **${v.fix(avg, 1)} dB**${truth}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Method',
      name: 'Method of adjustment',
      statement: String.raw`In the **method of adjustment** the observer controls the stimulus directly, turning a knob or dragging a slider until the comparison appears equal to a standard (or, for an absolute threshold, until it is just detectable). The setting is repeated many times, starting alternately from well above and well below, and:

- the **mean setting** estimates the point of subjective equality (PSE), and $\mathrm{CE}=\mathrm{PSE}-S$ is the constant error;
- the **spread** of the settings measures discrimination: if settings are normal with standard deviation $s$, the comparison that would be judged “greater” on 75% of trials lies $0.674\,s$ above the PSE, so $\mathrm{JND}\approx0.674\,s$ (Fechner's “method of average error” used the mean absolute deviation instead).

The method is quick and natural and is the standard way to measure matches, from colour matching to the size of a visual illusion. Its weaknesses come from handing the stimulus to the observer: settings depend on the starting point and on motor and strategic habits, so the procedure must vary starting points and directions.`,
      idea: String.raw`Each setting stops where the comparison first *looks* equal; if the internal impression of the comparison is its true value plus Gaussian noise, the stopping points scatter around the PSE with a spread proportional to that noise, the same noise that makes the psychometric function of comparison judgements (1.2) rise gradually. So one experiment yields both the bias (mean) and the precision (spread). An illusion shows up as a constant error: the Müller-Lyer fins make the standard look longer or shorter, and the observer's matches move with them while their spread stays the same.`,
      caption: String.raw`Drag the **accent** handle to make the lower line look as long as the upper one, then *Record match*; the next trial starts from a new length, alternately too short and too long. The histogram collects your settings as a percentage of the true length: its centre is the PSE, its spread gives the JND. Switch the **figure** to add Müller-Lyer fins to the standard and measure the illusion as a constant error. The default subject is a simulated observer (ten settings, ticks along the line), which you can extend with *10 more settings*.`,
      deps: ['psych-1.2'],
      refs: ['Gescheider ch. 3'],
      tags: ['method', 'illusion'],
      credit: 'Fechner, 1860 (method of average error); Müller-Lyer, 1889 (the illusion)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/M%C3%BCller-Lyer_illusion' },
      viz(v) {
        const M = v.M, S = 30, XS = 9, XC = 54, YS = 5.5, YC = -5.5, FIN = 5.5, ANG = (38 * Math.PI) / 180;
        const BIAS = { plain: 0, out: 0.14, in: -0.11 }, SDV = 0.035;
        const who = v.select('subject', OBS, 'sim', { onChange: () => newTrial() });
        const fig = v.select('figure', [{ value: 'plain', label: 'plain lines' }, { value: 'out', label: 'fins out >—<' }, { value: 'in', label: 'fins in <—>' }], 'plain', { onChange: () => newTrial() });
        const bRec = v.button('Record match', () => record());
        const bNew = v.button('New start', () => newTrial());
        const bMore = v.button('10 more settings', () => { nSim = Math.min(80, nSim + 10); });
        v.button('Reset', () => { if (who.value === 'sim') nSim = 10; else you[fig.value] = []; newTrial(); });
        const fs = v.stage({ x: [0, 100], y: [-11, 11], equal: true, axes: false, height: 180, full: true, title: 'make the lower line as long as the upper one' });
        const hs = v.stage({ x: [-32, 42], y: [0, 5], height: 220, axes: 'box', full: true, xlabel: 'setting − standard (% of the standard)', yticks: [], title: 'the settings' });
        const H = fs.handle(XC + S * 0.7, YC, { color: 'accent', constrain: (x) => [M.clamp(x, XC + 10, XC + 45), YC] });
        let nSim = 10, you = { plain: [], out: [], in: [] }, tr = 0;
        const Z = (() => { const R = v.rng(253); return M.range(80).map(() => R.normal()); })();
        const simSet = () => Z.slice(0, nSim).map((z) => 100 * (BIAS[fig.value] + SDV * z));
        const newTrial = () => { tr++; const f = tr % 2 ? 0.62 + 0.12 * ((tr * 0.618) % 1) : 1.3 + 0.15 * ((tr * 0.618) % 1); H.set(XC + S * f, YC); v.invalidate(); };
        const record = () => { if (who.value !== 'you') return; you[fig.value].push(100 * ((H.x - XC) / S - 1)); newTrial(); };
        newTrial();
        const fins = (x0, x1, y, kind, col) => {
          if (kind === 'plain') return;
          const dx = FIN * Math.cos(ANG), dy = FIN * Math.sin(ANG), o = kind === 'out' ? -1 : 1;
          for (const [x, sgn] of [[x0, 1], [x1, -1]]) for (const s of [1, -1]) fs.line(x, y, x + o * sgn * dx, y + s * dy, { color: col, width: 2.6 });
        };
        v.legend([['ink', 'standard (fixed)'], ['accent', 'your comparison'], ['gold', 'settings (simulated observer)', { dot: true }], ['green', 'PSE = mean setting'], ['purple', 'PSE ± JND, JND = 0.674 × SD']]);
        let stt = null;
        v.render(() => {
          const isYou = who.value === 'you';
          bRec.hidden = bNew.hidden = !isYou; bMore.hidden = isYou; H.visible = isYou;
          const sets = isYou ? you[fig.value] : simSet();
          const n = sets.length, mu = n ? M.mean(sets) : null, sd = n > 1 ? M.stdev(sets) : null;
          // ---- the figure
          fs.line(XS, YS, XS + S, YS, { color: 'ink', width: 3.2 });
          fins(XS, XS + S, YS, fig.value, 'ink');
          fs.text('standard', XS + S / 2, YS + 4.2, { align: 'center', color: 'muted', size: 12 });
          fs.text('comparison', XC + S / 2, YC + 4.2, { align: 'center', color: 'muted', size: 12 });
          const xEnd = isYou ? H.x : XC + S * (1 + (mu ?? 0) / 100);
          fs.line(XC, YC, xEnd, YC, { color: 'accent', width: 3.2 });
          fs.line(XC, YC - 1.6, XC, YC + 1.6, { color: 'accent', width: 2 });
          if (!isYou) {
            for (const s of sets) fs.line(XC + S * (1 + s / 100), YC - 2.3, XC + S * (1 + s / 100), YC + 2.3, { color: 'gold', width: 1.6, alpha: 0.85 });
            fs.text(`mean of ${n} settings`, (XC + xEnd) / 2, YC - 3.8, { align: 'center', color: 'gold', size: 11.5 });
          }
          // ---- histogram
          const counts = M.histogram(sets, { bins: M.range(31).map((i) => -32 + 2.5 * i), range: [-32, 45.5] });
          const ymax = Math.max(3, ...counts.counts) * 1.3, left = mu != null && mu > 0.5;
          hs.setView(null, [-0.3 * ymax, ymax]);
          hs.vline(0, { color: 'muted', width: 1.4 });
          hs.text('true length', 0, ymax * 0.92, { dx: left ? -6 : 6, align: left ? 'right' : 'left', color: 'muted', size: 11.5 });
          hs.hist(counts, { color: isYou ? 'accent' : 'gold', fillAlpha: 0.4 });
          if (mu != null && sd > 0) {
            const J = 0.674 * sd;
            hs.fn((x) => n * 2.5 * phi((x - mu) / sd) / sd, { domain: [mu - 4 * sd, mu + 4 * sd], color: 'ink', width: 1.6, alpha: 0.7 });
            hs.vband(mu - J, mu + J, { color: 'purple', alpha: 0.1, edges: true });
            hs.vline(mu, { color: 'green', width: 2.4 });
            hs.text('PSE', mu, ymax * 0.92, { dx: left ? 6 : -6, align: left ? 'left' : 'right', color: 'green', weight: 700, size: 12 });
            if (Math.abs(mu) > 3) hs.arrow(0, ymax * 0.78, mu, ymax * 0.78, { color: 'red', width: 1.8, head: 7 });
            if (Math.abs(mu) > 3) hs.text('constant error', mu / 2, ymax * 0.78, { dy: -10, align: 'center', color: 'red', size: 11.5, weight: 600 });
          } else if (!n) hs.text('no settings yet: drag the handle, then Record match', -15, ymax * 0.5, { align: 'center', color: 'muted', size: 13 });
          stt = { n, mu, sd };
        });
        v.readout(() => {
          if (!stt) return '';
          const { n, mu, sd } = stt, isYou = who.value === 'you';
          const sets = isYou ? you[fig.value] : [], now = isYou && sets.length ? `last setting ${v.fmt(sets[sets.length - 1], 3)}% · ` : '';
          if (!n) return now + 'No settings recorded for this figure yet.';
          if (n < 2) return `${now}1 setting: ${v.fix(mu, 1)}%. Record more to estimate the spread.`;
          const J = 0.674 * sd, seM = sd / Math.sqrt(n);
          const truth = isYou ? '' : ` (simulated observer: true PSE ${v.fix(100 * BIAS[fig.value], 1)}%, true SD ${v.fix(100 * SDV, 1)}%)`;
          return `${now}${n} settings · PSE = mean = **${mu >= 0 ? '+' : '−'}${v.fix(Math.abs(mu), 1)}%** ± ${v.fix(1.96 * seM, 1)}% of the standard: constant error ${v.fix(mu, 1)}%${fig.value !== 'plain' ? ' — the size of the illusion' : ''} · SD $s$ = ${v.fix(sd, 2)}% → JND ≈ $0.674\\,s$ = **${v.fix(J, 2)}%**, a Weber fraction for length of ${v.fix(J / 100, 3)}${truth}`;
        });
      },
    },
  ],
};
