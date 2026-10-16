// Ecology — Chapter 2: Populations and life histories (items 2.1–2.7)
import { poisson, wilson } from './ch02.shared.js';

export default {
  collection: 'ecol',
  chapter: 2,
  title: 'Populations and life histories',
  summary: String.raw`Ecologists count populations with capture–recapture, follow cohorts with life tables and ask why some species breed once and others many times. Life-history theory explains clutch sizes and the r–K continuum; intraspecific competition produces self-thinning and constant final yield. Abundance varies in space and time with remarkably regular statistics, and chance — environmental and demographic — sets the risk of extinction that population viability analysis tries to estimate.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Method',
      name: 'Mark–recapture: the Lincoln–Petersen estimator',
      credit: 'C. G. J. Petersen, 1896 (plaice); F. C. Lincoln, 1930 (waterfowl); D. G. Chapman, 1951 (small-sample correction)',
      statement: String.raw`Catch and mark $M$ animals of a closed population of unknown size $N$, release them, and after they have mixed with the rest take a second sample of $n$ animals, of which $m$ carry marks. If marked and unmarked animals are equally likely to be caught, the marked fraction of the second sample estimates the marked fraction of the population, $m/n\approx M/N$, so $\hat N = Mn/m$. Chapman's version $\hat N=\frac{(M+1)(n+1)}{m+1}-1$ is nearly unbiased even when $m$ is small.`,
      scope: String.raw`Needs a **closed** population (no births, deaths, immigration or emigration between visits), marks that are neither lost nor overlooked, and equal catchability of every animal on both visits. Each failure biases $\hat N$ in a predictable direction.`,
      idea: String.raw`Given $M$ marked animals among $N$, the number of marked animals in a random sample of size $n$ is hypergeometric with mean $nM/N$. Solving $m = nM/N$ for $N$ gives the estimator. Because $N$ enters through $1/m$, the estimator is a ratio of a noisy count: it is biased upward for small $m$, and its spread shrinks only as the expected recapture count $nM/N$ grows — which is why the product $Mn$ must be several times $N$.`,
      caption: String.raw`The pond (left) shows one experiment: marked fish are orange, recaptures green, unmarked fish in the second catch are ringed. The histogram (right) repeats the whole experiment 300 times with fresh samples. Drag $M$ and $n$ to tighten the spread, then switch **assumption broken** on: tags that fall off, trap-happy or trap-shy marked fish, or fish that differ in catchability all shift the whole histogram off the true $N$ (green line), in a direction you can predict.`,
      deps: [],
      refs: ['Begon ch. 4'],
      tags: ['sampling', 'abundance', 'estimation'],
      viz(v) {
        const MAXN = 1500;
        const Ns = v.slider('true population $N$', 100, MAXN, 600, { step: 10, int: true });
        const Ms = v.slider('marked and released $M$', 10, 400, 100, { int: true });
        const ns = v.slider('second sample $n$', 10, 400, 100, { int: true });
        const bad = v.select('assumption broken', [
          { value: 'none', label: 'none' }, { value: 'loss', label: 'tags fall off' }, { value: 'happy', label: 'trap-happy' },
          { value: 'shy', label: 'trap-shy' }, { value: 'het', label: 'unequal catchability' },
        ], 'none');
        const est = v.select('estimator', [{ value: 'lp', label: 'Lincoln–Petersen' }, { value: 'ch', label: 'Chapman' }], 'lp');
        let seed = 11;
        v.button('New samples', () => { seed += 1; });
        const pr = v.rng(99), PX = [], PY = [];
        for (let i = 0; i < MAXN; i++) { PX.push(pr()); PY.push(pr()); }
        const qr = v.rng(5), Q = [];
        for (let i = 0; i < MAXN; i++) Q.push(Math.exp(1.1 * qr.normal()));
        // choose k of N without replacement, with optional weights, setting out[i] = 1
        function pick(r, N, k, w, out) {
          if (!w) {
            const idx = new Uint32Array(N);
            for (let i = 0; i < N; i++) idx[i] = i;
            for (let i = 0; i < k; i++) { const j = i + Math.floor(r() * (N - i)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; out[idx[i]] = 1; }
            return;
          }
          const keys = new Float64Array(N);
          for (let i = 0; i < N; i++) keys[i] = -Math.log(Math.max(r(), 1e-300)) / w[i];
          const thr = Float64Array.from(keys).sort()[k - 1];
          let c = 0;
          for (let i = 0; i < N && c < k; i++) if (keys[i] <= thr) { out[i] = 1; c++; }
        }
        function trial(r, N, M, n, mode, detail) {
          const het = mode === 'het';
          const marked = new Uint8Array(N);
          pick(r, N, M, het ? Q : null, marked);
          const w = new Float64Array(N);
          for (let i = 0; i < N; i++) w[i] = (het ? Q[i] : 1) * (marked[i] ? (mode === 'happy' ? 3 : mode === 'shy' ? 0.25 : 1) : 1);
          const caught = new Uint8Array(N);
          const uniform = !het && mode !== 'happy' && mode !== 'shy';
          pick(r, N, n, uniform ? null : w, caught);
          let m = 0;
          const seen = detail ? new Uint8Array(N) : null;
          for (let i = 0; i < N; i++) if (caught[i] && marked[i]) {
            if (mode === 'loss' && r() > 0.6) continue;
            m++; if (seen) seen[i] = 1;
          }
          return { m, marked, caught, seen };
        }
        const estimate = (M, n, m, kind) => (kind === 'ch' ? ((M + 1) * (n + 1)) / (m + 1) - 1 : m > 0 ? (M * n) / m : NaN);
        const A = v.stage({ x: [-0.03, 1.03], y: [-0.03, 1.03], axes: false, equal: true, height: 330, weight: 1, title: 'one experiment in the pond' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'estimate $\\hat N$', title: 'the same experiment repeated 300 times' });
        let info = null, cache = { key: '', vals: [] };
        v.render(() => {
          const N = Ns.value, M = Math.min(Ms.value, N), n = Math.min(ns.value, N), mode = bad.value, kind = est.value;
          const t = trial(v.rng(seed * 7919), N, M, n, mode, true);
          for (let i = 0; i < N; i++) {
            if (!t.marked[i] && !t.caught[i]) A.dot(PX[i], PY[i], { r: 2, color: 'accent', alpha: 0.35, ring: false });
          }
          for (let i = 0; i < N; i++) {
            const mk = t.marked[i], cg = t.caught[i];
            if (mk && !t.seen[i]) A.dot(PX[i], PY[i], { r: 3.2, color: 'orange', alpha: 0.9, ring: false });
            if (t.seen[i]) A.dot(PX[i], PY[i], { r: 4, color: 'green', ring: false });
            if (cg && !t.seen[i] && !mk) A.dot(PX[i], PY[i], { r: 2.4, color: 'accent', alpha: 0.9, ring: false });
            if (cg) A.dot(PX[i], PY[i], { r: 6.5, hollow: true, color: t.seen[i] ? 'green' : 'ink', width: 1.4, ring: false });
          }
          const Nhat = estimate(M, n, t.m, kind);
          // repeated experiments
          const key = [N, M, n, mode, kind, seed].join('|');
          if (cache.key !== key) {
            const reps = mode === 'none' || mode === 'loss' ? 300 : 200, r = v.rng(1234 + seed), vals = [];
            let none = 0;
            for (let k = 0; k < reps; k++) { const q = trial(r, N, M, n, mode, false); const e = estimate(M, n, q.m, kind); if (isFinite(e)) vals.push(e); else none++; }
            cache = { key, vals, none, reps };
          }
          const vals = cache.vals, hi = 3 * N;
          const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
          const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length - 1));
          B.setView([0, hi], [0, 1]);
          const cl = vals.map((x) => Math.min(x, hi * 0.999));
          const H = v.M.histogram(cl, { bins: 36, range: [0, hi] });
          const top = Math.max(...H.counts) / vals.length;
          B.setView([0, hi], [0, top * 1.12 || 1]);
          B.hist({ edges: H.edges, counts: H.counts.map((c) => c / vals.length) }, { color: 'accent', fillAlpha: 0.3 });
          B.vline(N, { color: 'green', width: 2.4 });
          B.vline(mean, { color: 'orange', width: 2, dash: [6, 4] });
          B.text('true $N$', N, top * 1.08, { color: 'green', dx: 5, align: 'left', size: 11, weight: 700 });
          B.text('mean', mean, top * 1.0, { color: 'orange', dx: mean > N ? 5 : -5, align: mean > N ? 'left' : 'right', size: 11, weight: 700 });
          B.setTitle(`the same experiment repeated ${cache.reps} times`);
          info = { N, M, n, m: t.m, Nhat, mean, sd, none: cache.none, reps: cache.reps, exp: (n * M) / N, mode };
        });
        v.legend([['orange', 'marked, not recaptured', { dot: true }], ['green', 'recaptured (mark seen)', { dot: true }], ['accent', 'unmarked', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          const bias = (100 * (i.mean - i.N)) / i.N;
          return String.raw`This sample: $M=${i.M}$ marked, $n=${i.n}$ caught, $m=${i.m}$ recaptured, so $\hat N = ${isFinite(i.Nhat) ? v.fix(i.Nhat, 0) : '\\text{undefined}'}$ (true $N=${i.N}$; expected recaptures $nM/N=${v.fix(i.exp, 1)}$)` +
            `\nOver ${i.reps} repeats: mean $\\hat N=${v.fix(i.mean, 0)}$ (**${bias >= 0 ? '+' : '−'}${v.fix(Math.abs(bias), 1)} %** off), standard deviation ${v.fix(i.sd, 0)}${i.none ? `, ${i.none} repeats with $m=0$ had no estimate` : ''}${i.mode !== 'none' ? ' — an assumption is broken, so the bias does not shrink as the samples grow' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Concept',
      name: 'Survivorship curves: types I, II and III',
      credit: 'R. Pearl, 1928; E. S. Deevey Jr., 1947',
      statement: String.raw`A survivorship curve plots $l_x$, the fraction of a cohort still alive at age $x$, against age, usually with $l_x$ on a logarithmic axis. If the age-specific mortality rate (hazard) is constant, $\ln l_x$ falls on a straight line (**type II**). If mortality is low early and rises steeply late, the curve is convex (**type I**, as in humans in rich countries and many large mammals). If mortality is very high early and low afterwards, the curve is concave (**type III**, as in oysters, many fish and trees that produce vast numbers of tiny offspring).`,
      scope: String.raw`The three types are idealized poles of a continuum; real species mix them (birds are close to type II only after the first year; humans have a type III kink at birth). Curves are compared on a relative age axis, so only their shape, not their time scale, is being classified.`,
      idea: String.raw`Survivorship and mortality are two descriptions of one thing: $l_x=\exp\!\big(-\int_0^x h(a)\,da\big)$, so the slope of $\ln l_x$ is minus the hazard. A flat hazard gives a straight line, a rising hazard bends it down, a falling hazard bends it up toward a plateau. The sliders use a Weibull hazard $h\propto x^{c-1}$ to move continuously through all three types: $c>1$, $c=1$, $c<1$.`,
      caption: String.raw`Drag the age probe (gold) along the curve or change the shape $c$; the buttons pick stylized examples. Left: survivors $l_x$, on a log axis (where type II is a straight line) or a linear one — flip the toggle. Right: the hazard, which is what really differs: rising for $c>1$, constant at $c=1$, falling for $c<1$. The three faint curves are the examples; all curves are drawn on a relative age axis (1 = maximum lifespan, where 0.1 % survive).`,
      deps: ['mathbio-4.1'],
      refs: ['Begon ch. 4'],
      tags: ['life tables', 'mortality', 'demography'],
      viz(v) {
        const M = v.M, LN = Math.log(1000);
        const P = { human: 4.2, songbird: 1, oyster: 0.28 };
        const c = v.slider('shape of mortality $c$', 0.2, 5, 1, { step: 0.02 });
        let internal = false;
        const pre = v.select('stylized example', [{ value: 'custom', label: 'your own' }, { value: 'human', label: 'human-like' }, { value: 'songbird', label: 'songbird-like' }, { value: 'oyster', label: 'oyster-like' }], 'songbird', {
          onChange: (val) => { if (val !== 'custom') { internal = true; c.set(P[val]); internal = false; } },
        });
        const lg = v.toggle('log scale for survivors', true);
        const l = (x, cc = c.value) => Math.exp(-LN * Math.pow(x, cc));
        const h = (x, cc = c.value) => LN * cc * Math.pow(x, cc - 1);
        const A = v.stage({ x: [0, 1], y: [1e-3, 1.1], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'relative age $x$', title: 'survivors $l_x$' });
        const B = v.stage({ x: [0, 1], y: [0.05, 100], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'relative age $x$', title: 'age-specific mortality (hazard) $h(x)$' });
        const probe = A.handle(0.5, l(0.5), { color: 'gold', constrain: (x) => { const xx = M.clamp(x, 0.01, 1); return [xx, l(xx)]; } });
        let info = null;
        v.render(() => {
          const cc = c.value;
          if (!internal) { const nearest = Object.entries(P).find(([, p]) => Math.abs(p - cc) < 0.015); const want = nearest ? nearest[0] : 'custom'; if (pre.value !== want) pre.value = want; }
          A.setScale({ ylog: lg.value, y: lg.value ? [1e-3, 1.1] : [0, 1.05] });
          for (const [k, p] of Object.entries(P)) {
            A.fn((x) => l(x, p), { color: 'faint', width: 1.6, domain: [0, 1] });
            const xx = k === 'human' ? 0.78 : k === 'songbird' ? 0.4 : 0.1;
            A.text(k === 'human' ? 'I' : k === 'songbird' ? 'II' : 'III', xx, l(xx, p), { color: 'muted', size: 12, weight: 700, dx: 8, dy: -8 });
            B.fn((x) => h(x, p), { color: 'faint', width: 1.6, domain: [0.01, 1] });
          }
          A.fn((x) => l(x, cc), { color: 'accent', width: 3.4, domain: [0, 1] });
          B.fn((x) => h(x, cc), { color: 'accent', width: 3.4, domain: [0.01, 1] });
          const xa = M.clamp(probe.x, 0.01, 1);
          probe.set(xa, l(xa, cc));
          B.dot(xa, h(xa, cc), { r: 6, color: 'gold' });
          B.vline(xa, { color: 'gold', width: 1.2, dash: [4, 4] });
          const mean = M.integrate((x) => l(x, cc), 0, 1, 200);
          info = { xa, lx: l(xa, cc), hx: h(xa, cc), mean, half: l(0.5, cc), type: cc > 1.35 ? 'type I (convex)' : cc < 0.75 ? 'type III (concave)' : 'type II (≈ straight)', trend: cc > 1.02 ? 'rising' : cc < 0.98 ? 'falling' : 'constant' };
        });
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `shape $c=${v.fix(c.value, 2)}$ → **${i.type}**; hazard ${i.trend} with age · at relative age ${v.fix(i.xa, 2)}: $l_x=${v.fix(100 * i.lx, 1)}\\,\\%$ of the cohort alive, hazard $h=${v.fix(i.hx, 2)}$ per unit age · ${v.fix(100 * i.half, 1)} % reach half the maximum lifespan; the average individual lives ${v.fix(100 * i.mean, 1)} % of it`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Concept',
      name: 'r- and K-selection',
      credit: 'R. H. MacArthur & E. O. Wilson, 1967; E. R. Pianka, 1970',
      statement: String.raw`In a habitat that is frequently cleared by disturbance, populations are repeatedly far below their carrying capacity, so selection favors genotypes with a high intrinsic growth rate $r$ (fast, many, small offspring): **r-selection**. In a stable habitat populations sit near the carrying capacity $K$, competition decides who leaves descendants, and selection favors the genotype that persists at the highest density (efficient, slow, few, large offspring): **K-selection**. Which strategy wins depends on how often the environment resets the population.`,
      scope: String.raw`A deliberately simple dichotomy: the model here has two genotypes competing for one resource with logistic (Lotka–Volterra, equal competition) dynamics. Real life histories vary along several axes and the r–K continuum has been criticized as too coarse (age-specific mortality matters more than density, for example).`,
      idea: String.raw`Two genotypes share one resource: $\dot N_i = r_iN_i\big(1-\tfrac{N_1+N_2}{K_i}\big)$. Without disturbance the genotype with the larger $K$ wins, because it can keep growing at a total density where the other already declines. If a disturbance repeatedly kills most individuals, the population restarts from small numbers, and the genotype that regrows faster (larger $r$) gains ground in every cycle before crowding sets in. The balance of these two effects fixes a critical interval between disturbances.`,
      caption: String.raw`Orange is the r-genotype ($r=1$, $K=100$), blue the K-genotype (slower, but able to reach a larger $K$). Dashed lines mark disturbances that kill all but a fraction $s$. Slide the interval $T$: for short intervals orange gains share each cycle, for long ones blue does. Right: the change in $\ln(N_r/N_K)$ per cycle, computed by integrating the equations over 10 cycles from equal numbers; it crosses zero at the critical interval $T^*$ (green).`,
      deps: ['mathbio-1.4'],
      refs: ['MacArthur–Wilson ch. 4', 'Begon ch. 4'],
      tags: ['life history', 'selection', 'disturbance'],
      viz(v) {
        const M = v.M;
        const Ts = v.slider('interval between disturbances $T$', 3, 60, 14, { step: 0.5 });
        const Ss = v.slider('fraction surviving a disturbance $s$', 0.001, 0.2, 0.02, { log: true, sig: 2 });
        const Kk = v.slider('K-genotype: carrying capacity $K$', 110, 300, 160, { step: 5, int: true });
        const rk = v.slider('K-genotype: growth rate $r$', 0.15, 0.9, 0.35, { step: 0.01 });
        const rr = 1.0, Kr = 100, dt = 0.05;
        function step(a, b, r2, K2) {
          const f = (x, y) => [rr * x * (1 - (x + y) / Kr), r2 * y * (1 - (x + y) / K2)];
          const k1 = f(a, b), k2 = f(a + (dt / 2) * k1[0], b + (dt / 2) * k1[1]), k3 = f(a + (dt / 2) * k2[0], b + (dt / 2) * k2[1]), k4 = f(a + dt * k3[0], b + dt * k3[1]);
          return [a + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), b + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
        }
        function cycles(T, s, K2, r2, nc, rec) {
          let a = 2, b = 2, t = 0;
          const out = rec ? [[0, a, b]] : null;
          const per = Math.round(T / dt);
          for (let c = 0; c < nc; c++) {
            for (let k = 0; k < per; k++) { [a, b] = step(a, b, r2, K2); t += dt; if (rec && k % 4 === 3) out.push([t, a, b]); }
            if (c < nc - 1) { a *= s; b *= s; if (rec) out.push([t, a, b]); }
          }
          return { a, b, out };
        }
        let cacheKey = '', delta = [], Tstar = null;
        function curve() {
          const key = [Ss.value, Kk.value, rk.value].join('|');
          if (key === cacheKey) return;
          cacheKey = key; delta = []; Tstar = null;
          for (let T = 3; T <= 60.01; T += 1) {
            // per-cycle change of ln(N_r/N_K) when disturbances strike every T (ratio unaffected by the kill)
            const per = Math.round(T / dt);
            let a = 2, b = 2;
            for (let c = 0; c < 10; c++) {
              for (let k = 0; k < per; k++) [a, b] = step(a, b, rk.value, Kk.value);
              a *= Ss.value; b *= Ss.value;
            }
            delta.push([T, Math.log(a / b) / 10]);
          }
          for (let i = 0; i + 1 < delta.length; i++) if (delta[i][1] > 0 && delta[i + 1][1] <= 0) { const [x0, y0] = delta[i], [x1, y1] = delta[i + 1]; Tstar = x0 + (y0 / (y0 - y1)) * (x1 - x0); break; }
        }
        const A = v.stage({ x: [0, 120], y: [0, 175], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'time', title: 'population densities' });
        const B = v.stage({ x: [3, 60], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'interval between disturbances $T$', title: 'advantage of the r-genotype per cycle' });
        let info = null;
        v.render(() => {
          curve();
          const T = Ts.value, nc = Math.ceil(120 / T) + 1;
          const { out } = cycles(T, Ss.value, Kk.value, rk.value, nc, true);
          const pa = [], pb = [];
          for (const [t, a, b] of out) if (t <= 120.001) { pa.push([t, a]); pb.push([t, b]); }
          for (let k = 1; k * T < 120; k++) A.vline(k * T, { color: 'red', alpha: 0.5, dash: [4, 4], width: 1.2 });
          A.hline(Kr, { color: 'orange', alpha: 0.4, dash: [2, 5] });
          A.hline(Kk.value, { color: 'accent', alpha: 0.4, dash: [2, 5] });
          A.path(pb, { color: 'accent', width: 2.6 });
          A.path(pa, { color: 'orange', width: 2.6 });
          const dmax = Math.max(...delta.map((d) => d[1])), dmin = Math.min(...delta.map((d) => d[1]));
          const ymax = Math.max(1, dmax * 1.3), ylo = Math.max(dmin * 1.1, -3 * ymax);
          B.setView([3, 60], [Math.min(ylo, -0.3 * ymax), ymax]);
          B.hline(0, { color: 'muted', width: 1 });
          B.path(delta, { color: 'ink', width: 2.6 });
          if (Tstar != null) { B.vline(Tstar, { color: 'green', width: 2, dash: [6, 4] }); B.text(`$T^*=${v.fix(Tstar, 1)}$`, Tstar, ymax * 0.82, { color: 'green', dx: 6, align: 'left', weight: 700 }); }
          const dn = delta.reduce((best, d) => (Math.abs(d[0] - T) < Math.abs(best[0] - T) ? d : best), delta[0]);
          B.dot(dn[0], dn[1], { r: 6, color: dn[1] > 0 ? 'orange' : 'accent' });
          B.text('r-genotype gains', 59, ymax * 0.9, { color: 'orange', align: 'right', size: 11 });
          B.text('K-genotype gains', 59, Math.min(ylo, -0.3 * ymax) * 0.9, { color: 'accent', align: 'right', size: 11 });
          info = { T, d: dn[1], Tstar };
        });
        v.legend([['orange', 'r-genotype'], ['accent', 'K-genotype'], ['red', 'disturbance', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `disturbance every $T=${v.fix(i.T, 1)}$ → per cycle, $\\ln(N_r/N_K)$ changes by **${i.d >= 0 ? '+' : '−'}${v.fix(Math.abs(i.d), 2)}**: the ${i.d > 0 ? 'r-genotype gains (r-selection)' : 'K-genotype gains (K-selection)'}` + (i.Tstar != null ? ` · crossover at $T^*\\approx${v.fix(i.Tstar, 1)}$ time units (about ${v.fix(i.Tstar / Math.LN2, 0)} doubling times of the r-genotype)` : ' · no crossover in this range: one genotype wins at every interval');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Paradox',
      name: 'Cole’s paradox',
      credit: 'L. C. Cole, 1954; resolved by E. L. Charnov & W. M. Schaffer, 1973',
      statement: String.raw`Compare an **annual** that breeds once and dies with a **perennial** that breeds every year for ever. If both survive from birth to first breeding with the same probability, the annual grows as fast as the perennial as soon as it produces just **one more** offspring per breeding attempt than the perennial produces per year. A single extra seed seems too small an advantage to explain why so many species are annuals — Cole's paradox. It disappears when survival is included: the annual's required advantage is the ratio of adult to juvenile survival, $b_{\rm annual}=b+s/\sigma$, which is far larger than one whenever juveniles die more often than adults.`,
      scope: String.raw`Needs a constant environment, no density dependence and discrete generations with reproduction at age 1. In the original formulation $s=\sigma=1$; Charnov and Schaffer allow $\sigma<1$ and $s<1$.`,
      idea: String.raw`The Euler–Lotka equation $\sum_x \lambda^{-x}\,l_x m_x=1$ fixes the growth rate $\lambda$ of any life history. For the annual, $l_1=\sigma$ and $m_1=b_a$, so $\sigma b_a/\lambda=1$. For the perennial, $l_x=\sigma s^{x-1}$ and $m_x=b$ for every $x\ge1$, a geometric series summing to $\sigma b/(\lambda-s)$, which gives $\lambda=s+\sigma b$. Equating the two growth rates gives $b_a=b+s/\sigma$: one offspring only when $s=\sigma$.`,
      caption: String.raw`Left: the sum $\sum_x \lambda^{-x}l_xm_x$ against $\lambda$ for the annual (orange) and the perennial (blue, summed numerically over 300 ages); each growth rate is where its curve crosses 1. Right: the fecundity the annual needs to match the perennial, $b+s/\sigma$, against juvenile survival $\sigma$, compared with Cole's constant $b+1$. Lower the juvenile survival and the paradox dissolves; press the button to give the annual exactly the extra offspring required.`,
      deps: ['ecol-2.2', 'mathbio-4.6'],
      refs: ['Begon ch. 4'],
      tags: ['life history', 'Euler–Lotka', 'semelparity'],
      viz(v) {
        const b = v.slider('perennial: offspring per year $b$', 0.5, 8, 2, { step: 0.1 });
        const s = v.slider('perennial: adult survival $s$', 0, 1, 1, { step: 0.01 });
        const sg = v.slider('juvenile survival $\\sigma$', 0.05, 1, 1, { step: 0.01 });
        const ba = v.slider('annual: offspring $b_a$', 0.5, 30, 3, { step: 0.1 });
        v.button('Cole: $b_a = b+1$', () => ba.set(Math.min(30, b.value + 1)));
        v.button('Charnov–Schaffer: match growth', () => ba.set(Math.min(30, b.value + s.value / sg.value)));
        const fAnn = (lam) => (sg.value * ba.value) / lam;
        const fPer = (lam) => { let t = 0, w = sg.value * b.value / lam, g = s.value / lam; for (let x = 1; x <= 300; x++) { t += w; w *= g; } return t; };
        const A = v.stage({ x: [0.3, 4], y: [0, 3], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'trial growth rate $\\lambda$', title: String.raw`$\sum_x \lambda^{-x} l_x m_x$` });
        const B = v.stage({ x: [0.05, 1], y: [0, 40], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'juvenile survival $\\sigma$', title: 'offspring the annual needs' });
        let info = null;
        v.render(() => {
          A.hline(1, { color: 'muted', dash: [5, 4], width: 1.2 });
          A.fn((lam) => Math.min(fAnn(lam), 50), { color: 'orange', width: 3, domain: [0.3, 4] });
          A.fn((lam) => Math.min(fPer(lam), 50), { color: 'accent', width: 3, domain: [0.3, 4] });
          const lamA = sg.value * ba.value, lamP = s.value + sg.value * b.value;
          if (lamA <= 4) A.dot(lamA, 1, { r: 5.5, color: 'orange' });
          if (lamP <= 4) A.dot(lamP, 1, { r: 5.5, color: 'accent' });
          const req = (x) => b.value + s.value / x;
          const ymax = Math.min(60, Math.max(8, req(0.05) * 1.05, ba.value * 1.1));
          B.setView([0.05, 1], [0, ymax]);
          B.fn(req, { color: 'accent', width: 3, domain: [0.05, 1] });
          B.hline(b.value + 1, { color: 'orange', width: 2, dash: [6, 4] });
          B.text('Cole: $b+1$', 0.12, b.value + 1, { color: 'orange', align: 'left', dy: 12, weight: 700, size: 11 });
          B.dot(sg.value, ba.value, { r: 6, color: 'gold' });
          B.text('your annual', sg.value, ba.value, { color: 'gold', dy: -14, dx: sg.value > 0.8 ? -8 : 0, align: sg.value > 0.8 ? 'right' : 'center', size: 11, weight: 700 });
          info = { lamA, lamP, need: s.value / sg.value, req: req(sg.value) };
        });
        v.legend([['orange', 'annual: $\\sigma b_a/\\lambda$'], ['accent', 'perennial: $\\sigma b/(\\lambda-s)$'], ['gold', 'your annual', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          const diff = i.lamA - i.lamP;
          return `growth rates: annual $\\lambda=${v.fix(i.lamA, 3)}$, perennial $\\lambda=s+\\sigma b=${v.fix(i.lamP, 3)}$ → the ${Math.abs(diff) < 0.005 ? '**two are equal**' : diff > 0 ? 'annual grows faster' : 'perennial grows faster'} · to match, the annual needs **${v.fix(i.need, 2)} extra offspring** ($b_a=${v.fix(i.req, 2)}$), where Cole's version assumed 1${i.need > 1.05 ? ' — an annual must be far more fecund than Cole thought' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Model',
      name: 'Lack’s optimal clutch size',
      credit: 'D. Lack, 1947 (Ibis 89); cost of reproduction after G. C. Williams, 1966',
      statement: String.raw`If each chick of a brood of $c$ survives with probability $S(c)$ that falls as the brood grows (parents cannot feed them all), the expected number of young fledged, $cS(c)$, rises and then falls with $c$ and peaks at an intermediate clutch size — Lack's prediction for the commonest clutch. If laying more eggs also lowers the parents' own survival or future breeding, selection maximizes the **lifetime** output $W(c)=cS(c)+P(c)V$ (young now plus the survival $P(c)$ times the value $V$ of the future), and the optimum lies **below** the clutch that fledges the most young this season.`,
      scope: String.raw`Illustrative functional forms: $S(c)=s_0e^{-c/c_0}$ and $P(c)=\max(0,\,0.7-\gamma c)$. Real birds show smaller clutches than the most productive one in some populations and not in others; food conditions, nest predation, and parental quality all vary and are ignored here.`,
      idea: String.raw`Differentiating $W(c)$ gives the optimum where the marginal gain in chicks, $\frac{d}{dc}[cS(c)]$, equals the marginal loss in future reproduction, $-V\,P'(c)$. With no cost of reproduction the second term vanishes and the optimum is the clutch that maximizes $cS(c)$, which for $S=s_0e^{-c/c_0}$ is $c_0$. A positive cost makes the left side balance at a smaller $c$.`,
      caption: String.raw`Left: young fledged $cS(c)$ (blue), parental future value $P(c)V$ (orange) and their sum (green), with their maxima marked at the best whole clutch. Raise the cost per egg $\gamma$ or the future value $V$ and the green optimum slides below the blue peak. Right: 400 simulated nests, each laying near the optimum and rearing a binomial number of chicks; points are the observed mean fledged per clutch size ($\pm$ one standard error) and faint bars are how many nests laid each size. Press **New nests** to resample.`,
      deps: ['pma-5.8'],
      refs: ['Begon ch. 4'],
      tags: ['life history', 'optimization', 'trade-offs'],
      viz(v) {
        const c0 = v.slider('brood the parents can feed $c_0$', 3, 10, 6, { step: 0.1 });
        const gam = v.slider('cost per egg to parent survival $\\gamma$', 0, 0.05, 0.02, { step: 0.001 });
        const V = v.slider('future reproductive value $V$', 0, 8, 3, { step: 0.1 });
        const s0 = 0.95, P0 = 0.7;
        let seed = 3;
        v.button('New nests', () => { seed += 1; });
        const S = (c) => s0 * Math.exp(-c / c0.value);
        const F = (c) => c * S(c);
        const Pc = (c) => Math.max(0, P0 - gam.value * c) * V.value;
        const W = (c) => F(c) + Pc(c);
        const A = v.stage({ x: [0, 16], y: [0, 6], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'clutch size $c$', title: 'fitness from one breeding attempt' });
        const B = v.stage({ x: [0, 17], y: [0, 6], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'clutch size laid', title: 'simulated nests: young fledged' });
        let info = null;
        v.render(() => {
          const argmax = (f) => { let bi = 1; for (let c = 1; c <= 16; c++) if (f(c) > f(bi)) bi = c; return bi; };
          const cF = argmax(F), cW = argmax(W);
          const ymax = Math.max(3, F(cF) * 1.15, W(cW) * 1.1);
          A.setView([0, 16], [0, ymax]); B.setView([0, 17], [0, Math.max(3, F(cF) * 1.2)]);
          A.fn(F, { color: 'accent', width: 3, domain: [0, 16] });
          A.fn(Pc, { color: 'orange', width: 2.4, domain: [0, 16] });
          A.fn(W, { color: 'green', width: 3.2, domain: [0, 16] });
          A.dot(cF, F(cF), { r: 6, color: 'accent' });
          A.dot(cW, W(cW), { r: 6.5, color: 'green' });
          A.vline(cW, { color: 'green', alpha: 0.5, dash: [4, 4], width: 1.2 });
          A.vline(cF, { color: 'accent', alpha: 0.5, dash: [4, 4], width: 1.2 });
          // nests
          const r = v.rng(seed * 101), cnt = new Array(18).fill(0), sum = new Array(18).fill(0), sq = new Array(18).fill(0);
          for (let i = 0; i < 400; i++) {
            const c = Math.max(1, Math.min(16, Math.round(cW + 1.8 * r.normal())));
            let k = 0; const p = S(c); for (let j = 0; j < c; j++) if (r() < p) k++;
            cnt[c]++; sum[c] += k; sq[c] += k * k;
          }
          const ctop = Math.max(...cnt), ytop = Math.max(3, F(cF) * 1.2);
          B.bars(cnt.slice(1, 17).map((n) => (0.3 * ytop * n) / ctop), { x0: 1, dx: 1, color: 'faint' });
          B.fn(F, { color: 'accent', width: 2.4, domain: [0, 16] });
          for (let c = 1; c <= 16; c++) if (cnt[c] > 1) {
            const m = sum[c] / cnt[c], sd = Math.sqrt(Math.max(0, sq[c] / cnt[c] - m * m)), se = sd / Math.sqrt(cnt[c]);
            B.line(c, m - se, c, m + se, { color: 'ink', width: 1.4 });
            B.dot(c, m, { r: 3.6, color: 'gold' });
          }
          info = { cF, cW, F: F(cF), Wopt: W(cW), Fw: F(cW) };
        });
        v.legend([['accent', 'young fledged $cS(c)$'], ['orange', 'future value $P(c)V$'], ['green', 'lifetime fitness $W$']]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `most productive clutch (Lack): **${i.cF}** eggs, ${v.fix(i.F, 2)} young · lifetime optimum: **${i.cW}** eggs (lifetime fitness ${v.fix(i.Wopt, 2)}, ${v.fix(i.Fw, 2)} young this season)${i.cW < i.cF ? ` — the cost of reproduction pulls the optimum ${i.cF - i.cW} egg${i.cF - i.cW > 1 ? 's' : ''} below the most productive clutch` : ' — no cost of reproduction at these settings: the optimum equals the most productive clutch'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Contest and scramble competition',
      credit: 'A. J. Nicholson, 1954',
      statement: String.raw`**Contest** competition divides a limited resource unequally: winners obtain all they need and losers get nothing, so the number of survivors (recruits) is capped at what the resource can support, however many compete. **Scramble** competition divides the resource equally: every individual gets a share $F/N$ that falls with density, and once the share is below what an individual needs, many or all of them fail. Contest yields a recruitment curve that rises and plateaus (compensation); scramble yields one that rises, peaks and then **falls** (overcompensation), which can destabilize the population into cycles or chaos.`,
      scope: String.raw`Single species, discrete generations, a fixed resource supply and recruitment $R(N)=N\min\{1,(K/N)^b\}$ with $b=1$ (contest) or steepness $b>1$ (scramble). The specific form is a modeling choice that exhibits the two limiting behaviors; real competition lies in between (Hassell's $\lambda N(1+aN)^{-b}$ interpolates the same way).`,
      idea: String.raw`With $K$ units of food and one unit needed per survivor, a contest lets exactly $K$ individuals eat well, so $R=\min(N,K)$ is flat above $K$. In a scramble each of $N$ individuals receives $K/N<1$ and succeeds with probability $(K/N)^b$, so $R=K^b N^{1-b}$ decreases for $N>K$. Iterating $N_{t+1}=\lambda R(N_t)$: the equilibrium of a scramble has slope $1-b$, which is stable if $b<2$ and unstable beyond, exactly like the compensating (Beverton–Holt) versus overcompensating (Ricker) maps.`,
      caption: String.raw`Left: the food share of each of $N$ individuals (green: gets what it needs, orange: partial or none) — contest gives some everything and others nothing; scramble gives everyone the same too-small share. Middle: recruits against density; the density slider sets the marker. Right: populations over generations under each rule from $N_0=5$. Raise the steepness $b$ above 2 and the scramble population starts to oscillate; the contest population always settles.`,
      deps: ['mathbio-2.10', 'mathbio-2.11'],
      refs: ['Begon ch. 5'],
      tags: ['density dependence', 'competition', 'stability'],
      viz(v) {
        const K = 30;
        const mode = v.select('competition', [{ value: 'contest', label: 'contest' }, { value: 'scramble', label: 'scramble' }], 'scramble');
        const Ns = v.slider('density $N$', 2, 120, 60, { int: true });
        const bs = v.slider('scramble steepness $b$', 1.2, 4, 3, { step: 0.05 });
        const lam = v.slider('growth between generations $\\lambda$', 1.5, 6, 3, { step: 0.05 });
        const R = (N, md) => (md === 'contest' ? Math.min(N, K) : N * Math.min(1, Math.pow(K / N, bs.value)));
        const A = v.stage({ x: [0, 121], y: [0, 1.25], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'individual (sorted)', title: 'food share (need = 1)' });
        const B = v.stage({ x: [0, 120], y: [0, 70], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'density $N$', title: 'recruits $R(N)$' });
        const C = v.stage({ x: [0, 30], y: [0, 160], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'generation', title: 'population over time' });
        let info = null;
        v.render(() => {
          const N = Ns.value, md = mode.value;
          const share = md === 'contest' ? (i) => (i < K ? 1 : 0) : () => Math.min(1, K / N);
          const vals = []; for (let i = 0; i < N; i++) vals.push(share(i));
          A.bars(vals, { x0: 1, dx: 1, color: (x) => (x >= 0.999 ? 'green' : 'orange') });
          A.hline(1, { color: 'muted', dash: [5, 4], width: 1.2 });
          A.text(md === 'contest' ? 'winners take all they need' : 'everyone gets $K/N$', 118, 1.15, { align: 'right', color: 'ink', size: 11.5 });
          B.fn((x) => R(x, 'contest'), { color: 'accent', width: md === 'contest' ? 3.4 : 1.8, alpha: md === 'contest' ? 1 : 0.55, domain: [0, 120] });
          B.fn((x) => R(x, 'scramble'), { color: 'orange', width: md === 'scramble' ? 3.4 : 1.8, alpha: md === 'scramble' ? 1 : 0.55, domain: [0, 120] });
          B.line(0, 0, 70, 70, { color: 'faint', dash: [3, 5], width: 1 });
          B.dot(N, R(N, md), { r: 6.5, color: 'gold' });
          B.vline(K, { color: 'faint', width: 1, dash: [3, 4] });
          // time series
          const series = (m) => { const out = [[0, 5]]; let n = 5; for (let t = 1; t <= 30; t++) { n = lam.value * R(n, m); out.push([t, n]); } return out; };
          const sc = series('contest'), ss = series('scramble');
          const top = Math.max(60, ...ss.map((p) => p[1]), ...sc.map((p) => p[1])) * 1.1;
          C.setView([0, 30], [0, Math.min(top, 400)]);
          C.path(sc, { color: 'accent', width: md === 'contest' ? 3 : 1.6, alpha: md === 'contest' ? 1 : 0.5 });
          C.path(ss, { color: 'orange', width: md === 'scramble' ? 3 : 1.6, alpha: md === 'scramble' ? 1 : 0.5 });
          const late = (arr) => arr.slice(-8).map((p) => p[1]);
          const spread = (arr) => { const l = late(arr); return Math.max(...l) - Math.min(...l); };
          info = { N, rec: R(N, md), nsucc: md === 'contest' ? Math.min(N, K) : N * Math.pow(Math.min(1, K / N), bs.value), spreadC: spread(sc), spreadS: spread(ss), slope: 1 - bs.value };
        });
        v.legend([['accent', 'contest'], ['orange', 'scramble'], ['faint', '$R=N$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `at $N=${i.N}$ (supply for $K=30$): ${mode.value === 'contest' ? 'exactly 30 individuals eat their fill' : `each gets ${v.fix(Math.min(1, 30 / i.N), 2)} of its need`} → **${v.fix(i.rec, 1)} recruits** · long-run fluctuation (last 8 generations): contest ${v.fix(i.spreadC, 1)}, scramble ${v.fix(i.spreadS, 1)} · scramble equilibrium slope $1-b=${v.fix(i.slope, 2)}$ → ${Math.abs(i.slope) < 1 ? 'stable' : 'unstable (cycles or chaos)'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'Law of constant final yield',
      credit: 'Kira, Ogawa & Sakazaki, 1953 (constant final yield); C. T. de Wit, 1960; Shinozaki & Kira, 1956 (reciprocal yield law)',
      statement: String.raw`For a crop of one species grown long enough under uniform conditions, the total biomass (yield) per unit area becomes independent of sowing density over a wide range of densities: yield $Y=\rho\bar w\to C$ as the growing time increases, even though the mean plant weight $\bar w$ falls in proportion to $1/\rho$ (the *reciprocal yield law*, $1/\bar w = (1+a\rho)/w_m$). At early harvests yield still increases with density; only later do the curves flatten onto the same ceiling.`,
      scope: String.raw`Even-aged stands of plants competing for the same resources, before density-dependent mortality sets in (extreme densities thin themselves, see 2.8). Some crops and conditions give parabolic yield–density curves that decline at high density instead (use the Bleasdale–Nelder exponent $b>1$).`,
      idea: String.raw`If each plant can claim only the area $1/\rho$ around it, its growth is capped at a weight proportional to $1/\rho$ because the area, not the plant, limits the final mass. In the logistic growth model below, $dw/dt=rw(1-w\rho/C)$, every plant approaches $w=C/\rho$, so $Y=\rho w\to C$ regardless of $\rho$. The sooner the cap bites (the higher the density), the sooner the yield saturates.`,
      caption: String.raw`Left: yield against sowing density (log–log) when the stand is harvested at the chosen time; faint curves show earlier harvests. Early on yield rises in proportion to the number of plants; as time passes every density reaches the same ceiling $C$. Right: mean plant weight, which keeps falling as $1/\rho$. Choose the Bleasdale–Nelder model and move the exponent $b$: at $b=1$ yield is constant at high density, for $b<1$ it keeps rising, for $b>1$ it falls (parabolic).`,
      deps: ['ecol-2.6'],
      refs: ['Begon ch. 5'],
      tags: ['plant competition', 'yield', 'density dependence'],
      viz(v) {
        const C = 1000, w0 = 0.02, rr = 0.12;
        const model = v.select('model', [{ value: 'grow', label: 'plants growing over time' }, { value: 'bn', label: 'Bleasdale–Nelder' }], 'grow');
        const ts = v.slider('harvest time $t$ (days)', 10, 160, 60, { step: 1 });
        const bs = v.slider('Bleasdale–Nelder exponent $b$', 0.5, 2, 1, { step: 0.01 });
        const wm = 20, aa = wm / C;
        const wOf = (rho, t) => { const Kc = C / rho; return Kc / (1 + (Kc / w0 - 1) * Math.exp(-rr * t)); };
        const wBN = (rho) => wm * Math.pow(1 + aa * rho, -bs.value);
        const A = v.stage({ x: [1, 1e4], y: [1, 3000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'sowing density $\\rho$ (plants m⁻²)', title: 'yield per area (g m⁻²)' });
        const B = v.stage({ x: [1, 1e4], y: [0.05, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'sowing density $\\rho$ (plants m⁻²)', title: 'mean plant weight (g)' });
        let info = null;
        v.render(() => {
          const bn = model.value === 'bn', t = ts.value;
          ts.el.hidden = bn; bs.el.hidden = !bn;
          const Y = bn ? (x) => x * wBN(x) : (x) => x * wOf(x, t);
          const W = bn ? wBN : (x) => wOf(x, t);
          if (!bn) for (const tt of [15, 30, 45]) if (tt < t - 3) { A.fn((x) => x * wOf(x, tt), { color: 'faint', width: 1.5, domain: [1, 1e4] }); B.fn((x) => wOf(x, tt), { color: 'faint', width: 1.5, domain: [1, 1e4] }); }
          A.hline(C, { color: 'green', dash: [6, 4], width: 1.4 });
          A.text('ceiling $C$', 1.3, C, { color: 'green', dy: -10, align: 'left', size: 11 });
          A.fn(Y, { color: 'accent', width: 3.4, domain: [1, 1e4] });
          B.fn((x) => C / x, { color: 'green', dash: [6, 4], width: 1.4, domain: [1, 1e4] });
          B.text('$C/\\rho$', 3, C / 3, { color: 'green', dx: 6, dy: -8, align: 'left', size: 11 });
          B.fn(W, { color: 'orange', width: 3.4, domain: [1, 1e4] });
          const ys = []; for (let k = 0; k <= 40; k++) ys.push(Y(Math.pow(10, k / 10)));
          const hiY = Y(1e4), midY = Y(1e3), hiS = Math.log(Y(1e4) / Y(3e3)) / Math.log(1e4 / 3e3);
          info = { bn, spread: Math.max(...ys.slice(20)) / Math.min(...ys.slice(20)), hiY, midY, hiS, lo: Y(1), t };
        });
        v.legend([['accent', 'yield'], ['orange', 'mean plant weight'], ['green', 'ceiling $C$ and $C/\\rho$', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `yield at $\\rho=1$: ${v.fix(i.lo, 1)}, at $10^3$: ${v.fix(i.midY, 0)}, at $10^4$: ${v.fix(i.hiY, 0)} g m⁻² · across $\\rho\\ge 10^2$ the yield varies by a factor ${v.fix(i.spread, 2)}; local slope of $\\log Y$ on $\\log\\rho$ at the highest densities: **${v.fix(i.hiS, 3)}**${Math.abs(i.hiS) < 0.03 ? ' — constant final yield' : i.hiS > 0.03 ? ' — still rising with density' : ' — falling with density (parabolic)'}`;
        });
      },
    },
  ],
};
