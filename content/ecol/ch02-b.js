// Ecology — Chapter 2: Populations and life histories (items 2.8–2.13)
import { poisson, gammaDraw, wilson, ols } from './ch02.shared.js';

// ── self-thinning simulation (2.8) ──────────────────────────────────────────────────────────────────────────
// Plants sit on a unit torus; a plant of mass w has a crown of area KAPPA·w^{2/3} (isometric growth). It photosynthesizes
// in proportion to its crown area that is not overlapped by taller neighbours and pays maintenance proportional to w.
// A plant whose net growth is negative dies. All constants are illustrative.
const KAPPA = Math.PI * 2e-5, G_GROW = 0.1, M_MAINT = 0.0004, DT = 5, STEPS = 450, EVERY = 5;
function lens(d, r1, r2) {
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) { const r = Math.min(r1, r2); return Math.PI * r * r; }
  const a = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)), b = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  const c = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
  return a + b - c;
}
function standRun(rng, N0) {
  const x = new Float64Array(N0), y = new Float64Array(N0), w = new Float64Array(N0), alive = new Uint8Array(N0).fill(1);
  for (let i = 0; i < N0; i++) { x[i] = rng(); y[i] = rng(); w[i] = Math.exp(0.3 * rng.normal()); }
  const traj = [], frames = [];
  for (let s = 0; s <= STEPS; s++) {
    let n = 0, sum = 0;
    for (let i = 0; i < N0; i++) if (alive[i]) { n++; sum += w[i]; }
    traj.push([n, sum / Math.max(n, 1)]);
    if (s % EVERY === 0) { const f = new Float32Array(N0); for (let i = 0; i < N0; i++) f[i] = alive[i] ? w[i] : 0; frames.push(f); }
    if (s === STEPS) break;
    const rad = new Float64Array(N0);
    let mr = 0;
    for (let i = 0; i < N0; i++) if (alive[i]) { rad[i] = Math.sqrt((KAPPA * Math.pow(w[i], 2 / 3)) / Math.PI); if (rad[i] > mr) mr = rad[i]; }
    const G = Math.max(1, Math.min(64, Math.floor(1 / (2 * mr)))), cells = new Map();
    for (let i = 0; i < N0; i++) {
      if (!alive[i]) continue;
      const k = (Math.floor(x[i] * G) % G) * G + (Math.floor(y[i] * G) % G);
      let a = cells.get(k); if (!a) { a = []; cells.set(k, a); } a.push(i);
    }
    const shade = new Float64Array(N0);
    for (let i = 0; i < N0; i++) {
      if (!alive[i]) continue;
      const cx = Math.floor(x[i] * G), cy = Math.floor(y[i] * G);
      for (let ax = -1; ax <= 1; ax++) for (let ay = -1; ay <= 1; ay++) {
        const a = cells.get((((cx + ax) % G + G) % G) * G + (((cy + ay) % G + G) % G));
        if (!a) continue;
        for (const j of a) {
          if (j <= i) continue;
          let dx = Math.abs(x[i] - x[j]); dx = Math.min(dx, 1 - dx);
          let dy = Math.abs(y[i] - y[j]); dy = Math.min(dy, 1 - dy);
          const d = Math.hypot(dx, dy);
          if (d >= rad[i] + rad[j]) continue;
          const o = lens(d, rad[i], rad[j]);
          if (w[j] > w[i]) shade[i] += o; else shade[j] += o;
        }
      }
    }
    for (let i = 0; i < N0; i++) {
      if (!alive[i]) continue;
      const a = KAPPA * Math.pow(w[i], 2 / 3), f = Math.max(0, 1 - shade[i] / a);
      const net = G_GROW * f * Math.pow(w[i], 2 / 3) - M_MAINT * w[i];
      if (net < 0 && s > 5) { alive[i] = 0; continue; }
      w[i] += net * DT;
    }
  }
  return { x, y, traj, frames, N0 };
}

export default {
  collection: 'ecol',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Phenomenon',
      name: 'The −3/2 self-thinning rule',
      credit: 'K. Yoda, T. Kira, H. Ogawa & K. Hozumi, 1963',
      statement: String.raw`In a crowded, even-aged stand of one plant species, competition kills the weaker plants while survivors grow. The mean plant mass $\bar w$ and the surviving density $\rho$ then move along a line on log–log axes, $\bar w = c\,\rho^{-3/2}$ — the self-thinning line. Stands sown at very different densities approach the same line and then slide down it together, losing roughly $\rho\propto \bar w^{-2/3}$ of their plants for every increase in size.`,
      scope: String.raw`Dense, fully stocked stands of a single species in uniform conditions, once mortality has begun. The slope $-3/2$ is an average: fitted slopes of real stands scatter around it, and some authors argue for $-4/3$ from metabolic scaling (Enquist, Brown & West, 1998). The intercept $c$ differs between species. Below the line a stand is not yet crowded and grows without thinning.`,
      idea: String.raw`Geometry gives the exponent. If plants grow isometrically, a plant of mass $w$ has linear size $\propto w^{1/3}$ and so occupies ground area $A\propto w^{2/3}$. A stand that fully covers its ground obeys $\rho A\approx$ const, hence $\rho\propto w^{-2/3}$, i.e. $\bar w\propto\rho^{-3/2}$. A stand cannot hold more plants of a given size than space allows: any excess dies, which is what pins all trajectories to the line.`,
      caption: String.raw`An individual-based stand on a periodic square: each plant has a crown whose area grows as $w^{2/3}$, is shaded by taller neighbours, and dies when its shaded growth cannot pay its maintenance. Left: the stand (crowns coloured by mass) at the time set by the slider. Right: mean mass against surviving density, log–log, for three sowing densities; the dashed line has slope exactly $-3/2$. All three runs bend onto the same line, and the free fit to the thinning part of the trajectories gives a slope near, but not exactly, $-3/2$. The model constants are illustrative, not from field data.`,
      deps: ['ecol-2.6'],
      refs: ['Begon ch. 5'],
      tags: ['plant competition', 'self-thinning', 'scaling'],
      viz(v) {
        const sizes = [400, 1200, 3000];
        const which = v.select('sown at', sizes.map((n) => ({ value: n, label: `${n} plants` })), 1200);
        const ts = v.slider('time', 0, STEPS / EVERY, 24, { int: true, fmt: (x) => `t = ${x * EVERY * DT}` });
        let runs = null;
        const ensure = () => {
          if (runs) return;
          runs = {};
          for (const n of sizes) runs[n] = standRun(v.rng(100 + n), n);
        };
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 360, weight: 1, title: 'the stand (periodic square)' });
        const B = v.stage({ x: [1, 5000], y: [0.8, 6e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'surviving density $\\rho$ (plants per unit area)', title: 'mean plant mass $\\bar w$' });
        const col = { 400: 'orange', 1200: 'accent', 3000: 'purple' };
        let info = null;
        const thin = (R, upto) => R.traj.slice(0, upto + 1).filter(([n]) => n <= 0.3 * R.N0 && n >= 10);
        v.render(() => {
          ensure();
          const R = runs[which.value], fi = ts.value, step = fi * EVERY;
          const fr = R.frames[fi];
          let mx = 1;
          for (let i = 0; i < R.N0; i++) if (fr[i] > mx) mx = fr[i];
          const order = []; for (let i = 0; i < R.N0; i++) if (fr[i] > 0) order.push(i);
          order.sort((a, b) => fr[a] - fr[b]);
          for (const i of order) {
            const r = Math.sqrt((KAPPA * Math.pow(fr[i], 2 / 3)) / Math.PI), t = Math.log(fr[i]) / Math.log(mx);
            for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const px = R.x[i] + ox, py = R.y[i] + oy;
              if (px < -r || px > 1 + r || py < -r || py > 1 + r) continue;
              A.circle(px, py, r, { fill: v.ramp(Math.max(0.05, t), 'green'), fillAlpha: 0.55, color: 'green', width: 0.8, stroke: true });
            }
          }
          // log-log trajectories
          const fitPts = [];
          for (const n of sizes) {
            const Rn = runs[n], upto = Math.min(step, STEPS);
            B.path(Rn.traj.slice(0, upto + 1).map(([N, w]) => (N > 0 ? [N, w] : null)), { color: col[n], width: n === +which.value ? 3 : 1.8, alpha: n === +which.value ? 1 : 0.6 });
            const cur = Rn.traj[upto];
            B.dot(cur[0], cur[1], { r: n === +which.value ? 6 : 4, color: col[n] });
            for (const [N, w] of thin(Rn, STEPS)) fitPts.push([Math.log(N), Math.log(w)]);
          }
          // reference line, slope −3/2, intercept from the thinning phases of the three runs
          const c = fitPts.reduce((a, [lx, ly]) => a + ly + 1.5 * lx, 0) / Math.max(1, fitPts.length);
          B.fn((x) => Math.exp(c - 1.5 * Math.log(x)), { color: 'green', dash: [7, 5], width: 2.2, domain: [1, 5000] });
          B.text('slope $-3/2$', 12, Math.exp(c - 1.5 * Math.log(12)), { color: 'green', dx: 8, dy: -10, align: 'left', weight: 700, size: 11.5 });
          const fit = ols(fitPts.map((p) => p[0]), fitPts.map((p) => p[1]));
          const mine = thin(R, step);
          const fitMine = mine.length > 8 ? ols(mine.map((p) => Math.log(p[0])), mine.map((p) => Math.log(p[1]))) : null;
          info = { n: R.traj[step][0], w: R.traj[step][1], fit, fitMine, np: fitPts.length };
        });
        v.legend([['orange', '400 sown', { dot: true }], ['accent', '1200 sown', { dot: true }], ['purple', '3000 sown', { dot: true }], ['green', 'slope $-3/2$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `now: **${i.n}** plants alive of ${which.value}, mean mass ${v.fix(i.w, 0)} · free fit to the thinning phase of all three runs (${i.np} points, density ≤ 30 % of the sown density and ≥ 10): slope **${v.fix(i.fit.b, 2)}** ± ${v.fix(1.96 * i.fit.se, 2)}, compared with −1.5${i.fitMine ? ` · the selected run so far: ${v.fix(i.fitMine.b, 2)}` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Method',
      name: 'Key-factor analysis',
      credit: 'G. C. Varley & G. R. Gradwell, 1960 (after R. F. Morris, 1959); regression form by Podoler & Rogers, 1975',
      statement: String.raw`Follow the same species through many generations and record how many individuals die in each life stage. Express each stage's mortality as a **k-value**, $k_i=\log_{10}(N_i/N_{i+1})$, so that the total generation mortality $K=\sum_i k_i$ is a plain sum. The **key factor** is the stage whose k-value tracks $K$ most closely from year to year, the one that causes most of the variation in total mortality: the stage with the largest regression slope $b_i=\mathrm{Cov}(k_i,K)/\mathrm{Var}(K)$. The slopes of all stages add up to exactly 1.`,
      scope: String.raw`A descriptive method: the key factor is the stage that varies most, not necessarily the one that **regulates** the population (that requires plotting $k_i$ against the density it acts on, which this picture also offers). Needs a long enough series of life tables (dozens of generations in practice) from a single population.`,
      idea: String.raw`Because $K=\sum k_i$, the variance of total mortality splits as $\mathrm{Var}(K)=\sum_i\mathrm{Cov}(k_i,K)$, and dividing by $\mathrm{Var}(K)$ shows that the regression slopes $b_i$ sum to 1: each is the share of the year-to-year variation in $K$ attributable to stage $i$. A stage with a large mean mortality but little variation, such as a steady loss every winter, therefore is not a key factor: it moves the whole line up without moving it around.`,
      caption: String.raw`A simulated 24-generation life table with five mortality stages (the means and spreads are made up for illustration). Top left: each $k_i$ and the total $K$ (black) by year. Top right: the regression slope $b_i$ of each stage on $K$ — the tallest bar is the key factor, and the bars add to 1. Bottom: $k_i$ against $K$ for the stage you pick. Drag the spread sliders: make a minor stage fluctuate wildly and it takes over as key factor, while the *biggest* mean mortality never matters unless it varies.`,
      deps: ['ecol-2.6', 'opt-1.6'],
      refs: ['Begon ch. 14'],
      tags: ['life tables', 'mortality', 'variance'],
      viz(v) {
        const NAMES = ['overwinter egg loss', 'larval dispersal', 'parasitism', 'pupal predation', 'disease'];
        const SHORT = ['egg', 'larva', 'parasite', 'pupa', 'disease'];
        const MU = [0.22, 0.55, 0.18, 0.40, 0.08], SD0 = [0.06, 0.2, 0.1, 0.05, 0.04];
        const COL = ['accent', 'orange', 'green', 'purple', 'teal'];
        const sd = SD0.map((s0, i) => v.slider(`spread of k${i + 1}: ${NAMES[i]}`, 0, 0.5, s0, { step: 0.005 }));
        const pick = v.select('scatter plot of', SHORT.map((s, i) => ({ value: i, label: s })), 1);
        let seed = 21;
        v.button('New 24 years', () => { seed += 1; });
        const Y = 24;
        const A = v.stage({ x: [1, Y], y: [0, 2], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'generation', title: 'k-values and total $K$' });
        const B = v.stage({ x: [0.4, 5.6], y: [-0.1, 1], axes: 'box', gutter: true, height: 300, weight: 0.9, xlabel: 'stage', title: 'slope $b_i$ of $k_i$ on $K$', xticks: [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']] });
        const Cc = v.stage({ x: [0, 2], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'total $K$', title: '$k_i$ against $K$' });
        let info = null;
        v.render(() => {
          const r = v.rng(seed * 313);
          const z = [0, 1, 2, 3, 4].map(() => Array.from({ length: Y }, () => r.normal()));
          const k = z.map((zi, i) => zi.map((e) => Math.max(0, MU[i] + sd[i].value * e)));
          const K = Array.from({ length: Y }, (_, t) => k.reduce((a, ki) => a + ki[t], 0));
          const kmax = Math.max(...K);
          A.setView([1, Y], [0, kmax * 1.08]);
          for (let i = 0; i < 5; i++) A.path(k[i].map((e, t) => [t + 1, e]), { color: COL[i], width: 1.8, alpha: 0.9 });
          A.path(K.map((e, t) => [t + 1, e]), { color: 'ink', width: 3.2 });
          const fits = k.map((ki) => ols(K, ki));
          const keyI = fits.reduce((b, f, i) => (f.b > fits[b].b ? i : b), 0);
          B.setView([0.4, 5.6], [-0.05, Math.max(1, ...fits.map((f) => f.b)) * 1.1]);
          B.bars(fits.map((f) => Math.max(0, f.b)), { x0: 1, dx: 0.7, color: (val, i) => COL[i] });
          B.text('key', keyI + 1, fits[keyI].b, { dy: -11, align: 'center', weight: 700, size: 12, color: 'ink' });
          const j = +pick.value;
          const kj = k[j];
          const ymax = Math.max(...kj) * 1.15 + 0.01;
          Cc.setView([Math.min(...K) * 0.95, Math.max(...K) * 1.03], [0, ymax]);
          Cc.dots(K.map((e, t) => [e, kj[t]]), { r: 4, color: COL[j], alpha: 0.9 });
          const f = fits[j];
          Cc.line(Math.min(...K), f.a + f.b * Math.min(...K), Math.max(...K), f.a + f.b * Math.max(...K), { color: 'ink', width: 2.2 });
          info = { fits, keyI, sumB: fits.reduce((a, f) => a + f.b, 0), j };
        });
        v.legend(SHORT.map((s, i) => [COL[i], `${i + 1} ${s}`]).concat([['ink', 'total $K$']]));
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `slopes $b_i$: ${i.fits.map((f, t) => `${t + 1}: ${v.fix(f.b, 2)}`).join(' · ')} → **key factor: ${NAMES[i.keyI]}** ($b=${v.fix(i.fits[i.keyI].b, 2)}$, $r^2=${v.fix(i.fits[i.keyI].r2, 2)}$) · slopes add to ${v.fix(i.sumB, 3)} · selected stage ${i.j + 1}: slope ${v.fix(i.fits[i.j].b, 2)}, $r^2=${v.fix(i.fits[i.j].r2, 2)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Law',
      name: 'Taylor’s power law of variance and mean',
      credit: 'L. R. Taylor, 1961',
      statement: String.raw`Across a set of samples of the abundance of one species — different sites, dates or sample sizes — the sample variance $s^2$ is a power function of the sample mean $m$: $s^2 = a\,m^b$, so that $\log s^2=\log a + b\log m$ is a straight line. For randomly scattered individuals (Poisson) $a=b=1$ and the variance equals the mean; for aggregated (clumped) populations $b>1$, with ecological populations typically having $1<b<2$ or somewhat above; $b<1$ signals a more regular-than-random pattern.`,
      scope: String.raw`An empirical regularity over a range of densities, not an exact law: it fails at very low and very high densities for some species, and the exponent depends on the sampling unit. Here the pictures are simulated from a gamma–Poisson (negative-binomial) model whose variance is set to $am^b$; the model cannot generate variance below the Poisson line, so $b<1$ is not offered.`,
      idea: String.raw`Why variance should be proportional to a power of the mean is still debated: patchy distributions with a size-independent clumping scale give $b=2$, a gradual transition from random to clumped with density gives intermediate values, and multiplicative population dynamics also produce power laws. Practically, $b$ is a summary of aggregation, and the law suggests a first-order delta-method variance stabilization at positive means: choose $g'(x)=x^{-b/2}$, giving $g(x)=x^{1-b/2}/(1-b/2)$ for $b\ne2$ and $g(x)=\ln x$ for $b=2$. Then $\operatorname{Var}(g(X))\approx g'(m)^2 a m^b=a$ when fluctuations are sufficiently small for linearization. This is an approximation, not an exact constant-variance law for arbitrary counts; zero counts need a separately justified treatment.`,
      caption: String.raw`Each dot is one simulated site (mean density $m$ drawn log-uniformly), with its sample mean and variance computed from the chosen number of quadrats. Set the true exponent $b$ and coefficient $a$: the fitted line (orange) recovers them with a visible sampling error, and the dashed Poisson line shows what random placement would give. Right: the distribution of counts at the density you select, against the Poisson distribution of the same mean — the clumped distribution has a long right tail and many empty quadrats.`,
      deps: ['prob-1.6.13', 'stat-1.3', 'stat-1.15'],
      refs: ['Begon ch. 14'],
      tags: ['aggregation', 'variance', 'sampling'],
      viz(v) {
        const bT = v.slider('true exponent $b$', 1, 2.6, 1.6, { step: 0.02 });
        const aT = v.slider('coefficient $a$', 0.5, 5, 1.5, { step: 0.05 });
        const nq = v.slider('quadrats per site', 8, 100, 25, { int: true });
        const mSel = v.slider('density to inspect $m$', 0.5, 200, 8, { log: true, sig: 2 });
        let seed = 5;
        v.button('Resample', () => { seed += 1; });
        const A = v.stage({ x: [0.1, 1000], y: [0.1, 3e6], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'sample mean $m$', title: 'sample variance $s^2$ (60 sites)' });
        const B = v.stage({ x: [0, 40], y: [0, 0.3], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'count per quadrat', title: 'distribution of counts at density $m$' });
        const V = (m) => Math.max(m, aT.value * Math.pow(m, bT.value));
        function draw(rr, m) {
          const ex = V(m) - m;
          if (ex < 1e-9) return poisson(rr, m);
          return poisson(rr, gammaDraw(rr, (m * m) / ex, ex / m));
        }
        let info = null;
        v.render(() => {
          const r = v.rng(seed * 4099), pts = [], lx = [], ly = [];
          for (let i = 0; i < 60; i++) {
            const m = Math.exp(Math.log(0.3) + (Math.log(300) - Math.log(0.3)) * r());
            const xs = Array.from({ length: nq.value }, () => draw(r, m));
            const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
            const va = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1);
            if (mean > 0 && va > 0) { pts.push([mean, va]); lx.push(Math.log(mean)); ly.push(Math.log(va)); }
          }
          A.fn((x) => x, { color: 'muted', dash: [6, 5], width: 1.6, domain: [0.1, 1000] });
          A.fn(V, { color: 'green', width: 2.4, domain: [0.1, 1000] });
          A.dots(pts, { r: 3.4, color: 'accent', alpha: 0.75 });
          const fit = ols(lx, ly);
          A.fn((x) => Math.exp(fit.a + fit.b * Math.log(x)), { color: 'orange', width: 3, domain: [0.1, 1000] });
          A.text('Poisson: $s^2=m$', 700, 700, { color: 'muted', align: 'right', dy: 14, size: 11 });
          A.vline(mSel.value, { color: 'gold', width: 1.4, dash: [4, 4] });
          // distribution at m
          const m = mSel.value, r2 = v.rng(seed * 17 + 3), cnt = [];
          for (let i = 0; i < 4000; i++) cnt.push(draw(r2, m));
          const hiX = Math.max(10, Math.ceil(Math.min(Math.max(...cnt), m + 6 * Math.sqrt(Math.max(V(m), m)))));
          const bw = Math.max(1, Math.ceil(hiX / 60));
          const nb = Math.ceil((hiX + 1) / bw), edges = Array.from({ length: nb + 1 }, (_, i) => i * bw - 0.5), counts = new Array(nb).fill(0);
          for (const c of cnt) { const bi = Math.min(nb - 1, Math.floor((c + 0.5) / bw)); counts[bi]++; }
          const dens = counts.map((c) => c / cnt.length / bw);
          const pm = v.M.dist.poisson(m);
          const pfun = (x) => pm.pdf(Math.round(x));
          const ytop = Math.max(...dens, ...Array.from({ length: nb }, (_, i) => pfun(i * bw))) * 1.15;
          B.setView([-0.5, hiX + 0.5], [0, ytop]);
          B.hist({ edges, counts: dens.map((d) => d * bw) }, { color: 'accent', fillAlpha: 0.35 });
          B.fn((x) => pfun(x) * bw, { color: 'muted', width: 2, dash: [5, 4], domain: [0, hiX] });
          const empty = cnt.filter((c) => c === 0).length / cnt.length;
          info = { fit, n: lx.length, m, v: V(m), empty, pEmpty: Math.exp(-m) };
        });
        v.legend([['green', 'true $am^b$'], ['orange', 'fitted line'], ['muted', 'Poisson', { dash: true }], ['accent', 'simulated counts']]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `fitted exponent **$\\hat b=${v.fix(i.fit.b, 2)}$** ± ${v.fix(1.96 * i.fit.se, 2)} (true ${v.fix(bT.value, 2)}), $r^2=${v.fix(i.fit.r2, 2)}$ from ${i.n} sites · at $m=${v.fix(i.m, 1)}$ the variance is ${v.fix(i.v, 1)} — ${v.fix(i.v / i.m, 1)}× the Poisson value; ${v.fix(100 * i.empty, 0)} % of quadrats are empty (Poisson would give ${v.fix(100 * i.pEmpty, 2)} %)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'Environmental stochasticity and bet hedging',
      credit: 'D. Cohen, 1966 (optimizing reproduction in a randomly varying environment); seed-germination application',
      statement: String.raw`When yearly growth factors $\lambda_t$ vary at random, a population's long-run growth rate is the **geometric** mean $\exp E[\ln\lambda_t]$, not the arithmetic mean $E[\lambda_t]$, and the geometric mean is always the smaller. A strategy can therefore be favoured by selection even though it lowers the average yearly output, if it lowers the variance enough. In an annual plant with a seed bank, germinating only a fraction $g<1$ of its seeds each year (the rest stay dormant, surviving with probability $s$) gives yearly growth $\lambda_t=(1-g)s+gY_t$, and $E\ln\lambda$ is maximized at an intermediate $g^*$ when bad years ($Y_t\approx0$) occur.`,
      scope: String.raw`Independent yearly environments with fixed probabilities, no density dependence, a single trait value per population (no mixed strategies within a plant, which can also hedge) and a bad-year yield that is not much greater than 0. The model has only an interior optimum when the geometric mean of the yearly factors is penalized, that is, when bad years bring $\lambda<1$ for fully germinating plants.`,
      idea: String.raw`A bad year multiplies the population by a small factor, and a logarithm punishes small factors heavily: $\ln\lambda$ is concave, so by Jensen's inequality $E\ln\lambda\le\ln E\lambda$, with the gap growing with the variance of $\lambda$. Dormancy cuts that variance: seeds that stay in the soil are protected from the bad year, but they also forgo the good year's large harvest. Setting the derivative of $E\ln\lambda$ in $g$ to zero balances these two. The arithmetic mean $E\lambda$ would instead be maximized by germinating everything.`,
      caption: String.raw`Drag the gold point along the green curve to choose the germination fraction $g$. Left: the long-run growth rate $E\ln\lambda$ (green) peaks at an intermediate $g^*$ (marked), while the arithmetic mean $\ln E\lambda$ (orange, dashed) keeps rising to $g=1$. Right: 40 simulated populations in the same random sequence of good and bad years: the thick line is the average path of $\ln N$, and its slope is $E\ln\lambda$ (dashed green). At $g=1$ the first bad year wipes the population out.`,
      deps: ['rca-3.3', 'mathbio-2.1', 'prob-1.6.2'],
      refs: ['Begon ch. 4'],
      tags: ['stochastic growth', 'bet hedging', 'seed bank'],
      viz(v) {
        const pb = v.slider('probability of a bad year $p$', 0.05, 0.7, 0.35, { step: 0.01 });
        const Yg = v.slider('seeds per plant in a good year $Y_g$', 2, 30, 8, { step: 0.5 });
        const Yb = v.slider('seeds per plant in a bad year $Y_b$', 0, 2, 0, { step: 0.05 });
        const ss = v.slider('seed survival in the soil $s$', 0.1, 0.95, 0.6, { step: 0.01 });
        let seed = 9;
        v.button('New years', () => { seed += 1; });
        const lam = (g, good) => (1 - g) * ss.value + g * (good ? Yg.value : Yb.value);
        const Elog = (g) => { const a = lam(g, true), b = lam(g, false); return (1 - pb.value) * Math.log(a) + pb.value * (b > 0 ? Math.log(b) : -Infinity); };
        const lnE = (g) => Math.log((1 - pb.value) * lam(g, true) + pb.value * lam(g, false));
        const A = v.stage({ x: [0, 1], y: [-1, 2], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'germination fraction $g$', title: 'yearly growth rate (per year, log)' });
        const B = v.stage({ x: [0, 60], y: [-20, 40], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'year', title: '$\\ln N_t$ for 40 populations' });
        const h = A.handle(0.5, 0, { color: 'gold', constrain: (x) => { const g = Math.min(1, Math.max(0, x)); const e = Elog(g); return [g, Number.isFinite(e) ? Math.max(e, -0.97) : -0.97]; } });
        h.set(0.3, 0);
        let info = null;
        v.render(() => {
          let gs = 0, best = -Infinity;
          for (let k = 0; k <= 1000; k++) { const g = k / 1000, e = Elog(g); if (e > best) { best = e; gs = g; } }
          const ymax = Math.max(0.2, lnE(1) * 1.05, best * 1.4);
          A.setView([0, 1], [-1, ymax]);
          A.hline(0, { color: 'muted', width: 1.2, dash: [4, 4] });
          A.text('decline below 0', 0.01, 0, { color: 'muted', align: 'left', dy: 12, size: 10.5 });
          A.fn(lnE, { color: 'orange', width: 2.4, dash: [6, 4], domain: [0, 1] });
          A.fn(Elog, { color: 'green', width: 3.4, domain: [0, 1] });
          A.dot(gs, best, { r: 6, color: 'green', hollow: true, width: 2.4 });
          A.text(`$g^*=${v.fix(gs, 2)}$`, gs, best, { color: 'green', dy: -14, align: 'center', weight: 700 });
          const g = Math.min(1, Math.max(0, h.x)), e = Elog(g);
          h.set(g, Number.isFinite(e) ? Math.max(e, -0.97) : -0.97);
          // simulated populations
          const T = 60, P = 40, paths = [];
          const rr = v.rng(seed * 8191);
          const bad = Array.from({ length: P }, () => Array.from({ length: T }, () => rr() < pb.value));
          let extinct = 0, sumFinal = 0, nAlive = 0, lo = 0, hi = 0;
          for (let p = 0; p < P; p++) {
            let ln = 0; const path = [[0, 0]]; let dead = false;
            for (let t = 0; t < T; t++) {
              const l = lam(g, !bad[p][t]);
              if (l <= 0) { dead = true; path.push([t + 1, null]); break; }
              ln += Math.log(l); path.push([t + 1, ln]);
            }
            if (dead) extinct++; else { sumFinal += ln; nAlive++; lo = Math.min(lo, ln); hi = Math.max(hi, ln); }
            paths.push({ path, dead });
          }
          const slope = nAlive ? sumFinal / nAlive / T : NaN;
          B.setView([0, T], [Math.min(-5, lo * 1.1 - 1), Math.max(10, hi * 1.1 + 1)]);
          for (const { path, dead } of paths) {
            B.path(path.filter((q) => q[1] != null), { color: dead ? 'red' : 'accent', width: 1.2, alpha: dead ? 0.45 : 0.4 });
            if (dead) { const q = path[path.length - 2]; B.dot(q[0], q[1], { r: 3.5, color: 'red', ring: false }); }
          }
          if (Number.isFinite(e)) B.line(0, 0, T, e * T, { color: 'green', width: 2.6, dash: [7, 5] });
          if (nAlive && !extinct) B.path(Array.from({ length: T + 1 }, (_, t) => [t, paths.reduce((a, q) => a + q.path[t][1], 0) / P]), { color: 'ink', width: 3 });
          info = { g, e, ln: lnE(g), gs, best, extinct, slope, P };
        });
        v.legend([['green', '$E\\ln\\lambda$'], ['orange', '$\\ln E\\lambda$', { dash: true }], ['red', 'extinct population', { dot: true }], ['ink', 'mean of $\\ln N_t$']]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `$g=${v.fix(i.g, 2)}$: long-run growth $E\\ln\\lambda=${Number.isFinite(i.e) ? v.fix(i.e, 3) : '-\\infty'}$ (arithmetic $\\ln E\\lambda=${v.fix(i.ln, 3)}$) · optimum $g^*=${v.fix(i.gs, 2)}$ with $E\\ln\\lambda=${v.fix(i.best, 3)}$${i.best < 0 ? ' — even the best fraction cannot prevent decline' : ''} · simulation: ${i.extinct} of ${i.P} populations extinct${Number.isFinite(i.slope) && i.extinct < i.P ? `, mean slope of $\\ln N$ among survivors ${v.fix(i.slope, 3)}` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Model',
      name: 'Demographic stochasticity and extinction risk',
      credit: 'M. S. Bartlett, stochastic population models (1960); R. Lande, 1993 (risks of population extinction from demographic and environmental stochasticity)',
      statement: String.raw`Even when every individual faces exactly the same constant chances, births and deaths happen at random times, so a small population can die out by chance although its expected size grows. For a linear birth–death process with per-capita birth rate $b$ and death rate $d$ and initial size $N_0$, the probability of eventual extinction is $(d/b)^{N_0}$ when $b>d$ and $1$ when $b\le d$. Hence it falls geometrically with population size, and the expected number $N_0e^{(b-d)t}$ grows exponentially at the same time that a large fraction of all runs has gone to zero.`,
      scope: String.raw`Independent individuals with constant per-capita rates (no density dependence, no environmental variation, no Allee effect); a closed population. The same average growth rate $r=b-d$ with faster turnover ($b$ and $d$ both larger) makes extinction more likely. Real populations add environmental stochasticity (2.11), which matters at all sizes.`,
      idea: String.raw`Look at the jump chain: from any size, the next event is a birth with probability $b/(b+d)$ and a death otherwise, so the size performs a biased random walk. By the gambler's-ruin argument, starting from one individual the probability $q$ of ever hitting zero solves $q=\tfrac{d}{b+d}+\tfrac{b}{b+d}q^2$, whose smaller root is $d/b$. The $N_0$ founders' lineages are independent, so all must fail: $q^{N_0}$.`,
      caption: String.raw`Left: 15 simulated populations from the same start (thin) and the mean over 300 runs (black) against the deterministic curve $N_0e^{rt}$ (green, dashed) — the mean follows the exponential although most single paths look nothing like it. Right: the fraction of simulated populations that go extinct against founder number $N_0$ (dots with 95 % intervals) and the formula $(d/b)^{N_0}$ (green). Hold $r$ fixed and raise the turnover $d$ to see extinction risk grow; set $r\le0$ and extinction is certain.`,
      deps: ['mathbio-11.2', 'mathbio-11.4', 'stoch-2.4'],
      refs: ['Begon ch. 7'],
      tags: ['extinction', 'birth–death process', 'stochasticity'],
      viz(v) {
        const rS = v.slider('expected growth rate $r=b-d$', -0.2, 1, 0.25, { step: 0.01 });
        const dS = v.slider('death (and turnover) rate $d$', 0.1, 3, 1, { step: 0.05 });
        const n0 = v.slider('founders $N_0$', 1, 20, 4, { int: true });
        let seed = 31;
        v.button('New runs', () => { seed += 1; });
        const CAP = 150;
        function extinctionProb(b, d, N0, runs, r) {
          let ext = 0;
          const up = b / (b + d);
          for (let k = 0; k < runs; k++) {
            let n = N0, steps = 0;
            while (n > 0 && n < CAP && steps < 30000) { n += r() < up ? 1 : -1; steps++; }
            if (n === 0) ext++;
          }
          return ext;
        }
        function path(b, d, N0, T, r) {
          let n = N0, t = 0; const ev = [[0, n]];
          while (n > 0 && t < T) {
            const tot = n * (b + d);
            t += -Math.log(Math.max(r(), 1e-300)) / tot;
            if (t >= T) break;
            n += r() < b / (b + d) ? 1 : -1;
            ev.push([t, n]);
            if (n > 20000) break;
          }
          ev.push([T, n]);
          return ev;
        }
        const at = (ev, t) => { let n = ev[0][1]; for (const [te, ne] of ev) { if (te > t) break; n = ne; } return n; };
        const A = v.stage({ x: [0, 10], y: [0, 50], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'time', title: 'population size' });
        const B = v.stage({ x: [0.5, 14.5], y: [1e-3, 1.3], ylog: true, axes: 'box', gutter: true, height: 340, weight: 0.9, xlabel: 'founders $N_0$', title: 'probability of extinction' });
        let cache = { key: '' }, info = null;
        v.render(() => {
          const d = dS.value, b = d + rS.value, N0 = n0.value;
          const T = rS.value > 0.05 ? Math.min(12, 3 / rS.value) : 8;
          const key = [d.toFixed(3), rS.value.toFixed(3), seed].join('|');
          if (cache.key !== key) {
            const r = v.rng(seed * 6007), ests = [];
            if (b > 0) for (let k = 1; k <= 14; k++) ests.push(extinctionProb(b, d, k, 400, r));
            cache = { key, ests };
          }
          const r = v.rng(seed * 733 + N0);
          const sims = Array.from({ length: 300 }, () => path(b, d, N0, T, r));
          const grid = Array.from({ length: 41 }, (_, i) => (T * i) / 40);
          const meanSim = grid.map((t) => [t, sims.reduce((a, ev) => a + at(ev, t), 0) / sims.length]);
          const det = (t) => N0 * Math.exp(rS.value * t);
          const top = Math.max(det(T) * 1.7, 3 * N0 * 2);
          A.setView([0, T], [0, Math.min(top, 2000)]);
          for (let k = 0; k < 15; k++) {
            const ev = sims[k], pts = [];
            for (let i = 0; i < ev.length; i++) { if (i > 0) pts.push([ev[i][0], ev[i - 1][1]]); pts.push(ev[i]); }
            const dead = ev[ev.length - 1][1] === 0;
            A.path(pts, { color: dead ? 'red' : 'accent', width: 1.2, alpha: 0.5 });
          }
          A.fn(det, { color: 'green', width: 2.6, dash: [7, 5], domain: [0, T] });
          A.path(meanSim, { color: 'ink', width: 3 });
          // extinction by founders
          const f = (k) => (b > d ? Math.pow(d / b, k) : 1);
          B.fn(f, { color: 'green', width: 2.8, domain: [0.5, 14.5] });
          cache.ests.forEach((e, i) => {
            const [lo, hi] = wilson(e, 400);
            B.line(i + 1, Math.max(lo, 1e-3), i + 1, Math.max(hi, 1e-3), { color: 'ink', width: 1.4 });
            B.dot(i + 1, Math.max(e / 400, 1e-3), { r: 3.8, color: 'accent' });
          });
          B.vline(N0, { color: 'gold', width: 1.4, dash: [4, 4] });
          const ext = sims.filter((ev) => ev[ev.length - 1][1] === 0).length;
          info = { b, d, N0, T, pForm: f(N0), pSim: cache.ests.length ? cache.ests[Math.min(13, N0 - 1)] / 400 : 1, ext, meanT: meanSim[meanSim.length - 1][1], detT: det(T) };
        });
        v.legend([['accent', 'one population'], ['red', 'went extinct'], ['ink', 'mean of 300 runs'], ['green', 'deterministic / formula', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `$b=${v.fix(i.b, 2)}$, $d=${v.fix(i.d, 2)}$, $N_0=${i.N0}$ · extinction probability: formula **${v.fix(i.pForm, 3)}**${i.N0 <= 14 ? `, simulated ${v.fix(i.pSim, 3)} (400 runs)` : ''} · at $t=${v.fix(i.T, 1)}$: ${i.ext} of 300 runs extinct, but the mean size ${v.fix(i.meanT, 1)} is close to the deterministic ${v.fix(i.detT, 1)}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Method',
      name: 'Population viability analysis',
      credit: 'M. L. Shaffer, 1981 (minimum viable populations); Gilpin & Soulé, 1986',
      statement: String.raw`Population viability analysis (PVA) projects a population forward many times with random year-to-year variation in vital rates (environmental stochasticity), random births and deaths of individuals (demographic stochasticity) and an upper limit set by the habitat, and reports the fraction of runs in which the population falls below a **quasi-extinction threshold** within a time horizon: the extinction-risk curve $P(\tau\le t)$. Comparing the curves with and without a management action estimates how much the action reduces risk.`,
      scope: String.raw`A risk estimate is only as good as its inputs: the mean growth, its year-to-year variance and the carrying capacity must be estimated from data, and uncertainty in them is often larger than the Monte-Carlo error shown here. The projections are most reliable for short horizons and for relative comparisons between actions rather than for absolute probabilities. The model is a single population with log-normal yearly growth, Poisson offspring and a hard ceiling $K$; no catastrophes or genetic effects.`,
      idea: String.raw`Each year the expected number of offspring is $N_t e^{x_t}$ with $x_t\sim\mathcal N(r,\sigma^2)$ (environmental variation, 2.11), and the actual count is Poisson with that mean (demographic variation, 2.12), truncated at $K$. A population can have a positive mean growth rate $r$ yet still hit the threshold, because bad years multiply and a small population is exposed to demographic noise. Repeating the projection thousands of times turns this into an estimate of how risk accumulates with the horizon.`,
      caption: String.raw`Left: the fan of 1,000 simulated futures: median (black) and the 10–90 % band, with a few single trajectories. Right: the extinction-risk curve, the fraction of runs that have dropped below the threshold by each year; red is the current situation, green the chosen management action, using the same random years in both. Move the horizon slider to read the risk (with a 95 % interval) at that horizon. Raise $\sigma$ or lower the threshold and see which action buys the most.`,
      deps: ['ecol-2.11', 'ecol-2.12', 'stat-1.4'],
      refs: ['Begon ch. 7'],
      tags: ['extinction risk', 'conservation', 'simulation'],
      viz(v) {
        const N0 = v.slider('current population $N_0$', 10, 200, 40, { int: true });
        const Ks = v.slider('carrying capacity $K$', 50, 800, 200, { step: 10, int: true });
        const rs = v.slider('mean log growth $r$', -0.05, 0.15, 0.03, { step: 0.005 });
        const sg = v.slider('year-to-year variation $\\sigma$', 0.05, 0.8, 0.3, { step: 0.01 });
        const th = v.slider('quasi-extinction threshold', 1, 40, 10, { int: true });
        const H = v.slider('horizon $H$ (years)', 5, 100, 50, { int: true });
        const act = v.select('management action', [
          { value: 'none', label: 'none' }, { value: 'r', label: 'higher growth ($r+0.04$)' }, { value: 'sg', label: 'less variation ($0.6\\sigma$)' },
          { value: 'K', label: 'more habitat ($2K$)' }, { value: 'N0', label: 'add founders ($N_0+20$)' },
        ], 'sg');
        let seed = 41;
        v.button('New futures', () => { seed += 1; });
        const T = 100, R = 1000;
        function project(N0v, Kv, rv, sv, thv, sd) {
          const Npath = new Float32Array(R * (T + 1)), tau = new Int16Array(R).fill(-1);
          for (let k = 0; k < R; k++) {
            const zr = v.rng(sd * 100003 + k), ur = v.rng(sd * 7919 + k * 31 + 1);
            let n = N0v; Npath[k * (T + 1)] = n;
            if (n < thv) tau[k] = 0;
            for (let t = 1; t <= T; t++) {
              const x = rv + sv * zr.normal();
              n = Math.min(Kv, poisson(ur, n * Math.exp(x)));
              Npath[k * (T + 1) + t] = n;
              if (tau[k] < 0 && n < thv) tau[k] = t;
            }
          }
          return { Npath, tau };
        }
        const risk = (P) => { const out = new Float64Array(T + 1); for (let k = 0; k < R; k++) if (P.tau[k] >= 0) out[P.tau[k]]++; let c = 0; for (let t = 0; t <= T; t++) { c += out[t]; out[t] = c / R; } return out; };
        let cacheKey = '', base = null, alt = null;
        const A = v.stage({ x: [0, T], y: [0, 250], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'year', title: 'population size: 1,000 projections' });
        const B = v.stage({ x: [0, T], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'time horizon (years)', title: 'probability of quasi-extinction by year $t$' });
        let info = null;
        v.render(() => {
          const a = act.value;
          const pa = { N0: N0.value + (a === 'N0' ? 20 : 0), K: Ks.value * (a === 'K' ? 2 : 1), r: rs.value + (a === 'r' ? 0.04 : 0), s: sg.value * (a === 'sg' ? 0.6 : 1) };
          const key = [N0.value, Ks.value, rs.value, sg.value, th.value, seed].join('|'), key2 = key + '|' + a;
          if (cacheKey !== key) { base = project(N0.value, Ks.value, rs.value, sg.value, th.value, seed); cacheKey = key; alt = { key: '' }; }
          if (alt.key !== key2) alt = { key: key2, P: a === 'none' ? null : project(pa.N0, pa.K, pa.r, pa.s, th.value, seed) };
          const rb = risk(base), ra = alt.P ? risk(alt.P) : null;
          // fan chart for baseline
          const med = [], lo = [], hi = [];
          for (let t = 0; t <= T; t++) {
            const col = new Float32Array(R); for (let k = 0; k < R; k++) col[k] = base.Npath[k * (T + 1) + t];
            col.sort();
            med.push([t, col[Math.floor(R * 0.5)]]); lo.push(col[Math.floor(R * 0.1)]); hi.push(col[Math.floor(R * 0.9)]);
          }
          A.setView([0, T], [0, Math.max(60, Ks.value * 1.15)]);
          A.between((x) => lo[Math.round(x)], (x) => hi[Math.round(x)], 0, T, { fill: 'accent', fillAlpha: 0.18, n: T + 1 });
          for (let k = 0; k < 6; k++) A.path(Array.from({ length: T + 1 }, (_, t) => [t, base.Npath[k * (T + 1) + t]]), { color: 'accent', width: 1, alpha: 0.5 });
          A.path(med, { color: 'ink', width: 3 });
          A.hline(th.value, { color: 'red', width: 1.8, dash: [6, 4] });
          A.text('threshold', T - 2, th.value, { color: 'red', align: 'right', dy: -10, size: 11, weight: 700 });
          A.vline(H.value, { color: 'gold', width: 1.4, dash: [4, 4] });
          B.path(Array.from({ length: T + 1 }, (_, t) => [t, rb[t]]), { color: 'red', width: 3.2 });
          if (ra) B.path(Array.from({ length: T + 1 }, (_, t) => [t, ra[t]]), { color: 'green', width: 3.2 });
          B.vline(H.value, { color: 'gold', width: 1.4, dash: [4, 4] });
          const h = H.value, pb = rb[h], [l1, u1] = wilson(Math.round(pb * R), R);
          B.line(h, l1, h, u1, { color: 'red', width: 3 });
          B.dot(h, pb, { r: 5.5, color: 'red' });
          let pa2 = null, l2 = 0, u2 = 0;
          if (ra) { pa2 = ra[h]; [l2, u2] = wilson(Math.round(pa2 * R), R); B.line(h + 1, l2, h + 1, u2, { color: 'green', width: 3 }); B.dot(h + 1, pa2, { r: 5.5, color: 'green' }); }
          info = { h, pb, l1, u1, pa: pa2, l2, u2, medH: med[h][1], actLabel: a };
        });
        v.legend([['red', 'current situation'], ['green', 'with management action'], ['accent', 'median and 10–90 % band'], ['gold', 'horizon', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `by year ${i.h}: risk **${v.fix(100 * i.pb, 1)} %** (95 % interval ${v.fix(100 * i.l1, 1)}–${v.fix(100 * i.u1, 1)} %)${i.pa != null ? ` → with the action **${v.fix(100 * i.pa, 1)} %** (${v.fix(100 * i.l2, 1)}–${v.fix(100 * i.u2, 1)} %): ${i.pa < i.pb ? `${v.fix(100 * (1 - i.pa / Math.max(i.pb, 1e-9)), 0)} % lower` : 'no clear benefit'}` : ''} · median population at year ${i.h}: ${v.fix(i.medH, 0)}`;
        });
      },
    },
  ],
};
