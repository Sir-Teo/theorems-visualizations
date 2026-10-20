// Systems Biology — Chapter 2: Autoregulation (after U. Alon, An Introduction to Systems Biology)
//
// Units used in every picture: the promoter's half-repression (or half-activation) constant K = 1 and the removal rate alpha = 1,
// so protein level is measured in units of K and time in units of 1/alpha (a simple gene then has T_1/2 = ln 2 = 0.693).

const LN2 = Math.LN2;
const hRep = (p, n) => 1 / (1 + Math.pow(Math.max(p, 0), n));
const hAct = (p, n) => { const u = Math.pow(Math.max(p, 0), n); return u / (1 + u); };

/** Exact rise curve of the 1-D autonomous ODE p' = g(p): time as the integral of dp/g, on a grid in p from p0 to pEnd.
 *  Stops at the first p where g <= 0 (a fixed point blocks the rise): returns {pts: [[t, p]], blocked: p or null}. */
function risePath(g, p0, pEnd, N = 900) {
  const pts = [[0, p0]]; let t = 0, blocked = null;
  let gPrev = g(p0);
  if (!(gPrev > 0)) return { pts, blocked: p0 };
  const h = (pEnd - p0) / N;
  for (let i = 1; i <= N; i++) {
    const p = p0 + i * h, gp = g(p);
    if (!(gp > 0)) { blocked = p; break; }
    t += h * 0.5 * (1 / gPrev + 1 / gp); pts.push([t, p]); gPrev = gp;
  }
  return { pts, blocked };
}
/** Time to climb from 0 to level L under p' = g(p) (Simpson on 1/g); Infinity if g <= 0 anywhere on the way. */
function timeTo(g, L, N = 600) {
  const h = L / N; let sum = 0;
  for (let i = 0; i <= N; i++) {
    const gi = g(i * h); if (!(gi > 0)) return Infinity;
    sum += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) / gi;
  }
  return (sum * h) / 3;
}
/** Bisection for an increasing-to-decreasing sign change of f on [a, b] (f(a) > 0 > f(b) assumed). */
function root(f, a, b, it = 70) { for (let i = 0; i < it; i++) { const m = 0.5 * (a + b); if (f(m) > 0) a = m; else b = m; } return 0.5 * (a + b); }
/** Every sign change of f on a fine grid [a, b], refined by bisection (tests every grid point). */
function allRoots(f, a, b, N = 3000) {
  const out = []; let x0 = a, f0 = f(a);
  for (let i = 1; i <= N; i++) {
    const x1 = a + ((b - a) * i) / N, f1 = f(x1);
    if (f0 === 0) out.push(x0);
    else if (f0 * f1 < 0) { let lo = x0, hi = x1, flo = f0; for (let k = 0; k < 60; k++) { const m = 0.5 * (lo + hi), fm = f(m); if (fm * flo > 0) { lo = m; flo = fm; } else hi = m; } out.push(0.5 * (lo + hi)); }
    x0 = x1; f0 = f1;
  }
  return out;
}
const sd = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1)); };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export default {
  collection: 'sysbio',
  chapter: 2,
  title: 'Autoregulation',
  summary: String.raw`The commonest motif is a gene regulating itself. Negative autoregulation speeds responses, because a strong promoter can be used and then throttled at its own threshold, and it makes the steady state insensitive to fluctuations in production; positive autoregulation does the reverse, slowing the response and, when the feedback is cooperative enough, creating two stable expression states. These simple results already show circuit design trading speed, robustness and memory against each other.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Negative autoregulation',
      statement: String.raw`In a **negatively autoregulated** gene the protein $p$ is a repressor of its own promoter. With a Hill repression input function (1.3) and first-order removal at rate $\alpha$,
$$\frac{dp}{dt}=\frac{\beta}{1+(p/K)^n}-\alpha p .$$
The right side is positive for small $p$ and decreasing, so there is exactly one steady state $p_{\rm st}$, given by $\beta/\bigl(1+(p_{\rm st}/K)^n\bigr)=\alpha p_{\rm st}$, and every trajectory approaches it monotonically. If the promoter is strong ($\beta/\alpha\gg K$) the steady state sits just above the repression threshold, $p_{\rm st}\approx K\,(\beta/\alpha K)^{1/(n+1)}$, far below the level $\beta/\alpha$ that the same promoter would reach without the feedback.`,
      idea: String.raw`Without feedback the level climbs toward $\beta/\alpha$ at rate $\beta$. With feedback the production term is a decreasing function of $p$, so the gene produces at full strength only while $p\ll K$ and then shuts itself off: the level shoots up at roughly rate $\beta$ until it nears the threshold $K$, and then creeps the last part. The single crossing of the production curve and the line $\alpha p$ follows from the Hill function of 1.3 being monotone, and the monotone approach from the one-dimensional production–removal balance of 1.6. For large $\beta$, balance gives $p^{n+1}\approx \beta K^n/\alpha$, which is the formula above.

With positive beta, alpha and K, the continuous production-minus-removal function is positive at p=0 and negative at $p=\beta/\alpha$. The intermediate value theorem (pma 4.23) therefore gives an interior steady state. Its strict decrease for nonnegative p makes that crossing unique. The signs on either side supply the direction of motion in this scalar model; the crossing argument does not include delays, noise or a changing removal rate.`,
      caption: String.raw`Left: the autoregulated gene (green) against the same promoter unrepressed (dashed), with the threshold $K$ (orange) and the steady state (green line); time is in units of $1/\alpha$. Right: the rate-balance plot, production (blue) against removal (line), crossing once. Raise the promoter strength $\beta/\alpha K$ and watch the unrepressed gene run off to $\beta/\alpha$ while the autoregulated one stops just above $K$; set $n=1$ and compare how far above $K$ it stops.`,
      deps: ['sysbio-1.6', 'sysbio-1.3', 'pma-4.23'],
      refs: ['Alon: Autoregulation'],
      tags: ['autoregulation', 'feedback'],
      scope: String.raw`A deterministic, well-mixed model with a single repressor species acting as a Hill function, instantaneous binding, and constant removal $\alpha$. It ignores transcription and translation delays, which can make real autoregulatory circuits oscillate.`,
      credit: 'M. A. Savageau, 1974 (comparison of autogenous and classical regulation; Nature 252: 546–549)',
      viz(v) {
        const B = v.slider(String.raw`promoter strength $\beta/(\alpha K)$`, 1, 1000, 100, { log: true, sig: 2 });
        const N = v.slider('cooperativity $n$', 1, 4, 2, { int: true });
        const S1 = v.stage({ x: [0, 5], y: [0, 6], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 300, xlabel: 'time (units of 1/α)', ylabel: 'protein level p (units of K)' });
        const S2 = v.stage({ x: [0, 6], y: [0, 6], axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'protein level p (units of K)', ylabel: 'rate (K·α)' });
        let st = 0;
        v.render(() => {
          const b = B.value, n = N.value;
          const pst = root((p) => b * hRep(p, n) - p, 0, b);
          st = pst;
          const top = Math.max(1.8 * pst, 2);
          S1.setView([0, 5], [0, top]);
          S1.fn((t) => b * (1 - Math.exp(-t)), { color: 'muted', dash: true, width: 2 });
          S1.hline(1, { color: 'orange', dash: true });
          S1.text('K', 4.9, 1, { color: 'orange', align: 'right', dy: -10 });
          S1.hline(pst, { color: 'green', dash: true, width: 1.5 });
          const r = risePath((p) => b * hRep(p, n) - p, 0, 0.999 * pst, 1400);
          S1.path(r.pts, { color: 'green', width: 3 });
          S1.text('no feedback → β/α', 4.9, Math.min(b, top) * 0.93, { color: 'muted', align: 'right', size: 11 });
          const px = Math.max(1.8 * pst, 2);
          S2.setView([0, px], [0, px]);
          S2.fn((p) => p, { color: 'ink', width: 2 });
          S2.fn((p) => b * hRep(p, n), { color: 'accent', width: 3 });
          S2.hline(b, { color: 'muted', dash: true });
          S2.dot(pst, pst, { r: 7, color: 'green', label: 'p_st', labelPos: 'se' });
          S2.vline(1, { color: 'orange', dash: true });
          S2.text('removal αp', px * 0.98, px * 0.9, { color: 'ink', align: 'right', size: 11 });
          S2.text('production (β = ' + v.fmt(b, 3) + ' at p = 0)', px * 0.5, px * 0.08, { color: 'accent', align: 'center', size: 11 });
        });
        v.legend([['green', 'autoregulated gene'], ['muted', 'same promoter, no feedback', { dash: true }], ['orange', 'threshold K', { dash: true }], ['accent', 'production β/(1+pⁿ)']]);
        v.readout(() => `steady state $p_{\\rm st}=${v.fix(st, 2)}\\,K$ — a gene without feedback would head for $\\beta/\\alpha=${v.fmt(B.value, 3)}\\,K$, i.e. ${v.fix(B.value / st, 1)} times higher.\nStrong-promoter estimate $K(\\beta/\\alpha K)^{1/(n+1)}=${v.fix(Math.pow(B.value, 1 / (N.value + 1)), 2)}\\,K$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Negative autoregulation speeds the response',
      statement: String.raw`Compare a simply regulated gene, $\dot p=\beta_0-\alpha p$, with an autoregulated gene $\dot p=\beta/(1+(p/K)^n)-\alpha p$ whose parameters are chosen to have the **same steady state** $p_{\rm st}=sK$, so $\beta=\alpha p_{\rm st}(1+s^n)$. Both start from $p=0$ at $t=0$. The simple gene needs $T_{1/2}=\ln2/\alpha$ to reach half of $p_{\rm st}$. The autoregulated gene reaches it faster, and the speed-up factor $\ln 2/(\alpha T_{1/2})$ grows with the repression strength $s$ (the ratio $p_{\rm st}/K$) from $1$ at $s\to0$ toward the limit
$$\ln 2\,(n+1)\,2^{\,n+1}\qquad(s\to\infty),$$
about $5.5$ for $n=1$.`,
      idea: String.raw`Time to climb from $0$ to $p_{\rm st}/2$ is $\int_0^{p_{\rm st}/2}dp/\dot p$, computed from the rate law of 2.1. A strong promoter produces at rate $\approx\beta$ while $p<K$, and at matched steady state $\beta=\alpha p_{\rm st}(1+s^n)$ is much larger than the simple gene's $\alpha p_{\rm st}$, so $1/\dot p$ is small along the whole climb. For $s\gg1$ the integrand is $\approx(1+p^n)/\beta$, so $\alpha T_{1/2}\to\bigl[\tfrac s2+\tfrac{(s/2)^{n+1}}{n+1}\bigr]/\bigl[s(1+s^n)\bigr]\to\dfrac{1}{(n+1)2^{n+1}}$, which is the limit above. The theorem is the comparison of this integral with the simple gene's response time of 1.6.

On the interval from zero to half the positive steady state, the net production F(p) is continuous and strictly positive. The integral-as-upper-limit theorem (pma 6.20) therefore gives $T(q)=\int_0^q dp/F(p)$ with derivative $T\prime(q)=1/F(q)$. Along a solution, differentiation yields $dT(p(t))/dt=1$, making this integral the actual first-passage time to q. The full net rate, including removal, is required in the denominator; a production-only approximation needs its own error control.`,
      caption: String.raw`Left: both genes aim at the same level $s$ (units of $K$). Gold dots mark the half-way times; the blue dashed line is the simple gene's $\ln2$. Raise the repression strength $s$ and the green curve becomes almost vertical. Right: speed-up factor against $s$ for $n=1,\dots,4$ with the dashed saturation limits $\ln2\,(n+1)2^{n+1}$; the dot is your current setting. For small $s$ the repressor is hardly felt and the factor tends to $1$.`,
      deps: ['sysbio-2.1', 'pma-6.20'],
      refs: ['Alon: Autoregulation'],
      tags: ['autoregulation', 'response time'],
      credit: 'N. Rosenfeld, M. B. Elowitz & U. Alon, 2002 (synthetic TetR circuit; J. Mol. Biol. 323: 785–793)',
      scope: String.raw`Matched steady state, a single repressor with a Hill input function, first-order removal, production starting from an empty cell and a promoter that switches fully on at $t=0$. The factor saturates; it is not unbounded in the deterministic model. In a real cell a very strong promoter eventually runs into other limits (translation, burst noise), which are not modelled here.`,
      viz(v) {
        const S = v.slider(String.raw`repression strength $s=p_{\rm st}/K$`, 0.1, 30, 8, { log: true, sig: 2 });
        const N = v.slider('cooperativity $n$', 1, 4, 1, { int: true });
        const S1 = v.stage({ x: [0, 3], y: [0, 10], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 300, xlabel: 'time (units of 1/α)', ylabel: 'protein level p (units of K)' });
        const S2 = v.stage({ x: [0.1, 30], xlog: true, y: [1, 150], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'repression strength s = p_st / K', ylabel: 'speed-up of the half-rise time' });
        const COL = ['blue', 'teal', 'purple', 'pink'];
        const gN = (s, n) => { const b = s * (1 + Math.pow(s, n)); return (p) => b * hRep(p, n) - p; };
        const speed = (s, n) => LN2 / timeTo(gN(s, n), s / 2, 500);
        let cur = { sp: 1, T: LN2 };
        v.render(() => {
          const s = S.value, n = N.value;
          S1.setView([0, 3], [0, 1.1 * s]);
          S1.fn((t) => s * (1 - Math.exp(-t)), { color: 'accent', width: 3 });
          const r = risePath(gN(s, n), 0, 0.999 * s, 1500);
          S1.path(r.pts, { color: 'green', width: 3 });
          S1.hline(s, { color: 'faint', dash: true });
          S1.hline(s / 2, { color: 'muted', dash: true, width: 1 });
          const T = timeTo(gN(s, n), s / 2, 800);
          S1.vline(LN2, { color: 'accent', dash: [6, 3], width: 1.5 });
          S1.dot(LN2, s / 2, { r: 6, color: 'gold' });
          S1.dot(T, s / 2, { r: 6, color: 'gold' });
          cur = { sp: LN2 / T, T };
          for (let n2 = 1; n2 <= 4; n2++) {
            const pts = []; for (let j = 0; j <= 36; j++) { const ss = 0.1 * 300 ** (j / 36); pts.push([ss, speed(ss, n2)]); }
            S2.path(pts, { color: COL[n2 - 1], width: n2 === n ? 3.4 : 1.6, alpha: n2 === n ? 1 : 0.6 });
            S2.hline(LN2 * (n2 + 1) * 2 ** (n2 + 1), { color: COL[n2 - 1], dash: true, width: 1, alpha: 0.5 });
          }
          S2.dot(s, cur.sp, { r: 7, color: 'gold', label: v.fix(cur.sp, 1) + '×', labelPos: 'nw' });
        });
        v.legend([['accent', 'simple regulation'], ['green', 'negative autoregulation'], ['gold', 'half-way times']]);
        v.readout(() => `simple gene: $T_{1/2}=\\ln2/\\alpha=0.693/\\alpha$; autoregulated ($n=${N.value}$): $T_{1/2}=${v.fix(cur.T, 3)}/\\alpha$ — speed-up $\\times${v.fix(cur.sp, 2)}$.\nSaturation limit for this $n$: $\\ln2\\,(n+1)2^{n+1}=${v.fix(LN2 * (N.value + 1) * 2 ** (N.value + 1), 1)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Negative autoregulation buffers production-rate variation',
      statement: String.raw`At steady state, define the **logarithmic sensitivity** of the protein level to the production rate, $S=\dfrac{d\ln p_{\rm st}}{d\ln\beta}$. For a simple gene $S=1$. For a gene with Hill-type negative autoregulation, $\beta/(1+(p/K)^n)=\alpha p$, one finds
$$S=\frac{1}{1+n\,\dfrac{u}{1+u}},\qquad u=(p_{\rm st}/K)^n,$$
which decreases from $1$ (weak repression, $u\to0$) toward $1/(n+1)$ (strong repression, $u\to\infty$). So a given relative fluctuation in $\beta$ produces a relative fluctuation in $p_{\rm st}$ that is smaller by this factor: the steady state is buffered against cell-to-cell variation in production rate, at fixed mean level.`,
      idea: String.raw`Take logarithms of the balance $\beta\,h(p)=\alpha p$ with $h(p)=1/(1+(p/K)^n)$: $\ln\beta+\ln h(p)=\ln\alpha+\ln p$. Differentiating in $\ln\beta$ gives $1+\frac{d\ln h}{d\ln p}S=S$, and $d\ln h/d\ln p=-n u/(1+u)$ is the logarithmic sensitivity of the Hill function (1.3). Solving for $S$ gives the formula. This is exactly the effect of negative feedback on loop gain in control theory (ctrl-1.7): the closed-loop sensitivity is the open-loop sensitivity divided by one plus the loop gain, here $1+nu/(1+u)\to n+1$.

Apply the chain rule (pma 5.5) to the steady-state composition $\log h(p(\beta))$ for positive beta and p. The derivative with respect to log beta is $(d\log h/d\log p)(d\log p/d\log\beta)$, which is the product used above. The positive denominator $1+n u/(1+u)$ permits solving for the local sensitivity. This derivative concerns a smooth deterministic equilibrium branch, not the distribution of intrinsic molecular fluctuations.`,
      caption: String.raw`Left: steady-state level against production rate on log–log axes; the simple gene is a line of slope $1$, the autoregulated gene flattens toward slope $1/(n+1)$ near the operating point (dot). Right: 2000 cells whose $\beta$ varies log-normally with spread $\sigma$ (same median steady state for both designs). The autoregulated histogram (green) is much narrower than the simple one (blue). Lower the repression strength $s$ to $0.1$ and the advantage vanishes; make $\sigma$ large and the linear estimate $S$ starts to under-describe the spread.`,
      deps: ['sysbio-2.1', 'ctrl-1.7', 'pma-5.5'],
      refs: ['Alon: Autoregulation'],
      tags: ['autoregulation', 'robustness', 'sensitivity'],
      credit: 'A. Becskei & L. Serrano, 2000 (engineering stability by autoregulation in synthetic circuits; Nature 405: 590–593)',
      scope: String.raw`Steady-state, deterministic model in which the only varying parameter is the production rate $\beta$ (e.g. through plasmid or promoter copy number or the level of an upstream regulator); $\alpha$ and $K$ are assumed fixed. It says nothing about *intrinsic* fluctuations in the number of molecules (see the stochastic chapters), and it does not protect against variation in $K$ or $\alpha$.`,
      viz(v) {
        const S = v.slider(String.raw`repression strength $s=p_{\rm st}/K$ at the median`, 0.1, 100, 10, { log: true, sig: 2 });
        const N = v.slider('cooperativity $n$', 1, 4, 2, { int: true });
        const SG = v.slider(String.raw`spread of $\ln\beta$, $\sigma$`, 0.05, 1.2, 0.4, { step: 0.01 });
        let seed = 7;
        v.button('Resample cells', () => { seed++; });
        const S1 = v.stage({ x: [0.1, 10], xlog: true, y: [0.1, 10], ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 280, xlabel: 'production rate β / β_median', ylabel: 'steady state p / p_median' });
        const S2 = v.stage({ x: [0, 3], y: [0, 4], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 300, xlabel: 'steady-state level / median', ylabel: 'probability density' });
        let info = {};
        v.render(() => {
          const s = S.value, n = N.value, sg = SG.value;
          const bmed = s * (1 + Math.pow(s, n));
          S1.line(0.1, 0.1, 10, 10, { color: 'accent', width: 2.5 });
          const pts = [];
          for (let j = 0; j <= 160; j++) { const p = s * 10 ** (-2 + (4 * j) / 160); pts.push([(p * (1 + Math.pow(p, n))) / bmed, p / s]); }
          S1.path(pts, { color: 'green', width: 3 });
          S1.dot(1, 1, { r: 7, color: 'gold' });
          S1.vband(Math.exp(-sg), Math.exp(sg), { color: 'gold', alpha: 0.12 });
          const r = v.rng(seed); const cells = [];
          for (let i = 0; i < 2000; i++) cells.push(Math.exp(sg * r.normal()));
          const sr = cells;
          const nar = cells.map((c) => solveP(c * bmed, n) / s);
          S2.hist(sr, { bins: 60, range: [0, 3], density: true, color: 'accent', fillAlpha: 0.28 });
          S2.hist(nar, { bins: 60, range: [0, 3], density: true, color: 'green', fillAlpha: 0.38 });
          const u = Math.pow(s, n);
          info = { cvS: sd(sr) / mean(sr), cvN: sd(nar) / mean(nar), sens: 1 / (1 + (n * u) / (1 + u)), lim: 1 / (n + 1), sdS: sd(sr.map(Math.log)), sdN: sd(nar.map(Math.log)) };
        });
        v.legend([['accent', 'simple regulation'], ['green', 'negative autoregulation'], ['gold', 'median cell / ±σ band']]);
        v.readout(() => `log-sensitivity at the median: $S=${v.fix(info.sens, 3)}$ (strong-repression limit $1/(n+1)=${v.fix(info.lim, 3)}$).\nSpread of $\\ln p_{\\rm st}$ over the cells: simple ${v.fix(info.sdS, 3)}, autoregulated ${v.fix(info.sdN, 3)} (ratio ${v.fix(info.sdN / info.sdS, 3)}); coefficient of variation: ${v.fix(info.cvS, 3)} against ${v.fix(info.cvN, 3)}.`);
        function solveP(b, n) { let lo = 0, hi = b; for (let i = 0; i < 60; i++) { const m = 0.5 * (lo + hi); if (m * (1 + Math.pow(m, n)) < b) lo = m; else hi = m; } return 0.5 * (lo + hi); }
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Model',
      name: 'Positive autoregulation slows the response',
      statement: String.raw`A **positively autoregulated** gene is one whose protein activates its own promoter. With a small basal rate $\beta_0$ (without which an empty cell could never start),
$$\frac{dp}{dt}=\beta_0+\beta\,\frac{(p/K)^n}{1+(p/K)^n}-\alpha p .$$
Compare it with a simply regulated gene that has the same steady state $p_{\rm st}$. If the gene has a single, stable steady state, then at every level $p<p_{\rm st}$ the autoregulated gene produces **less** than the simple gene, so it takes longer to rise from zero: its half-rise time exceeds $\ln2/\alpha$, and the rise curve is sigmoidal, with a slow start. If the feedback is strong enough that $\dot p$ vanishes somewhere below $p_{\rm st}$, the gene does not reach $p_{\rm st}$ at all from low levels (see 2.5).`,
      idea: String.raw`At matched steady state the simple gene produces at the constant rate $\alpha p_{\rm st}$, while the activated promoter's rate $\beta_0+\beta h(p)$ is an increasing function of $p$ that only reaches $\alpha p_{\rm st}$ at $p_{\rm st}$. So at each intermediate $p$ the net rate is smaller, and the time $\int dp/\dot p$ is larger. When production depends on $p$ the early rise is slow because there is little activator to amplify (the basal rate must start it), then speeds up as $p$ builds, which gives the sigmoid; the effect is the mirror image of 2.2.

The scalar comparison principle (ode 2.13) formalizes the matched-state comparison. Below the chosen steady state, the increasing production function P(p) is smaller than $P(p_{\rm st})=\alpha p_{\rm st}$, so the simple-gene trajectory is a supersolution for $\dot p=P(p)-\alpha p$. The Hill field is locally Lipschitz on the nonnegative interval, and the trajectories start together; comparison keeps the autoregulated response below the simple response. Reaching the same half-level is therefore slower under the stipulated single-state assumptions; this ordering alone says nothing about the sign of the curve's second derivative.`,
      caption: String.raw`Left: rise from an empty cell of the activated gene (purple) against a simple gene with the same steady state (blue); the dashed line is the simple half-time $\ln 2$. Right: production against removal; the simple gene's flat production lies above the activated curve everywhere below $p_{\rm st}$. Increase the cooperativity $n$ or lower the leak: the delay grows, then the curve gets stuck below the steady state (a second, low fixed point appears) and the response never completes.`,
      deps: ['sysbio-1.6', 'ode-2.13'],
      refs: ['Alon: Autoregulation'],
      tags: ['autoregulation', 'response time'],
      scope: String.raw`Deterministic, well-mixed, single activator with a Hill input function, first-order removal, and a leak $\beta_0>0$. Matched steady state means $\beta_0+\beta h(p_{\rm st})=\alpha p_{\rm st}$. The statement "slower than simple regulation" requires a single fixed point on $[0,p_{\rm st}]$; otherwise the low state traps the system.`,
      viz(v) {
        const S = v.slider(String.raw`target steady state $s=p_{\rm st}/K$`, 0.3, 10, 3, { log: true, sig: 2 });
        const N = v.slider('cooperativity $n$', 1, 4, 2, { int: true });
        const F = v.slider(String.raw`leak fraction $\beta_0/\alpha p_{\rm st}$`, 0.005, 0.5, 0.05, { log: true, sig: 2 });
        const S1 = v.stage({ x: [0, 8], y: [0, 4], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 300, xlabel: 'time (units of 1/α)', ylabel: 'protein level p (units of K)' });
        const S2 = v.stage({ x: [0, 4], y: [0, 4], axes: 'box', gutter: true, height: 320, minWidth: 260, xlabel: 'protein level p (units of K)', ylabel: 'rate (K·α)' });
        let res = {};
        v.render(() => {
          const s = S.value, n = N.value, f = F.value;
          const b0 = f * s, b = (s - b0) * (1 + Math.pow(s, -n));
          const g = (p) => b0 + b * hAct(p, n) - p;
          const Th = timeTo(g, s / 2, 800);
          const xmax = Number.isFinite(Th) ? Math.min(40, Math.max(4, 2.6 * Th)) : 8;
          S1.setView([0, xmax], [0, 1.15 * s]);
          S1.fn((t) => s * (1 - Math.exp(-t)), { color: 'accent', width: 3 });
          const r = risePath(g, 0, 0.999 * s, 2000);
          S1.path(r.pts, { color: 'purple', width: 3 });
          S1.hline(s, { color: 'faint', dash: true });
          S1.hline(s / 2, { color: 'muted', dash: true, width: 1 });
          S1.vline(LN2, { color: 'accent', dash: [6, 3], width: 1.5 });
          S1.dot(LN2, s / 2, { r: 6, color: 'gold' });
          if (Number.isFinite(Th)) { S1.vline(Th, { color: 'purple', dash: [6, 3], width: 1.5 }); S1.dot(Th, s / 2, { r: 6, color: 'gold' }); }
          const px = 1.35 * s;
          S2.setView([0, px], [0, px]);
          S2.fn((p) => p, { color: 'ink', width: 2 });
          S2.hline(s, { color: 'accent', width: 3 });
          S2.fn((p) => b0 + b * hAct(p, n), { color: 'purple', width: 3 });
          const roots = allRoots((p) => g(p), 0, 1.5 * s);
          for (const x of roots) S2.dot(x, x, { r: 6, color: x < s * 0.999 ? 'red' : 'green' });
          S2.text('removal αp', px * 0.97, px * 0.92, { color: 'ink', align: 'right', size: 11 });
          res = { Th, blocked: r.blocked, roots };
        });
        v.legend([['accent', 'simple regulation (same p_st)'], ['purple', 'positive autoregulation'], ['gold', 'half-way times']]);
        v.readout(() => res.blocked !== null && res.blocked !== undefined ? `the activated gene is **stuck**: net rate vanishes at $p=${v.fix(res.roots[0], 3)}\\,K$, below the target — the response never completes (bistability, 2.5).` : `half-rise time ${v.fix(res.Th, 3)}$/\\alpha$ against $\\ln2=0.693$ for the simple gene: ${v.fix(res.Th / LN2, 2)} times slower. Fixed points at ${res.roots.map((x) => v.fix(x, 2)).join(', ')} (units of $K$).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Phenomenon',
      name: 'Bimodality from strong positive autoregulation',
      statement: String.raw`If a positively autoregulated gene has a steep (cooperative) input function and a low leak, the production curve $\beta_0+\beta h(p)$ can cross the removal line $\alpha p$ in **three** points: a low stable state, an unstable threshold, and a high stable state. The deterministic gene is then **bistable**, and which state a cell ends in depends on its history. In a population of cells that start near the threshold, molecular noise pushes each cell to one side, and the distribution of expression levels becomes **bimodal**, with a low peak and a high peak and few cells in between. With weak cooperativity there is one fixed point and the distribution is unimodal.`,
      idea: String.raw`Bistability needs the sigmoidal production curve of 2.4 to be steep enough that the line $\alpha p$ cuts it three times; the middle crossing has slope of production larger than $\alpha$, so a small excess of $p$ grows (positive feedback), while at the outer crossings the slope is smaller than $\alpha$ and they are stable. This is the one-dimensional picture of the bistable switch of mathbio-6.6. Noise matters in two ways: it kicks cells off the unstable point toward one basin, and, if strong enough, it occasionally throws a cell across the barrier, making the two peaks slowly exchange members.

At a positive fixed point, the smooth scalar field has derivative equal to the production-curve slope minus alpha. The one-dimensional linear stability theorem ode 1.8 therefore makes a crossing with negative derivative locally attracting and one with positive derivative repelling. At a fold, where the derivative is zero, that theorem is inconclusive and higher terms are needed. These deterministic classifications do not by themselves imply a bimodal stationary distribution for every noise strength or observation time.`,
      caption: String.raw`Left: production (purple) against removal; crossings are dotted (stable green, unstable red). Middle: 25 sample cells simulated with the chemical Langevin equation from a common starting level. Right: histogram of 600 cells at the chosen time. Increase the cooperativity $n$ across about $2.5$: the crossings go from one to three and the histogram splits into two peaks. Make the system size $\Omega$ small (very noisy) and the peaks blur and exchange cells; start from "all low" to see memory.`,
      deps: ['sysbio-2.4', 'mathbio-6.6', 'ode-1.8'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['autoregulation', 'bistability', 'noise'],
      credit: 'All-or-none induction: A. Novick & M. Weiner, 1957 (PNAS 43: 553–566); graded-to-binary conversion by positive feedback: Becskei, Séraphin & Serrano, 2001 (EMBO J. 20: 2528–2535)',
      scope: String.raw`Illustrative parameters ($\beta_0=0.1$, $\beta=3$, $K=\alpha=1$) and a chemical Langevin approximation with a system size $\Omega$ (molecules per unit of $K$); bistability here begins between $n=2$ and $n=3$ and would shift with other parameters. Real populations can also be bimodal for other reasons (cell-cycle stage, gene copy number).`,
      viz(v) {
        const N = v.slider('cooperativity $n$', 1, 6, 4, { step: 0.1 });
        const OM = v.slider(String.raw`system size $\Omega$ (molecules per $K$)`, 3, 300, 20, { log: true, sig: 2 });
        const T = v.slider('time $t$ (units of 1/α)', 0, 40, 40, { step: 0.5 });
        const INIT = v.select('start', [{ value: 'mid', label: 'all at p = 0.7' }, { value: 'low', label: 'all low (p = 0.1)' }], 'mid');
        let seed = 3;
        v.button('Resample', () => { seed++; });
        const B0 = 0.1, B = 3, DT = 0.02, NC = 600, NT = 2000, SNAP = 25, NTRAJ = 25;
        const S1 = v.stage({ x: [0, 4], y: [0, 4], axes: 'box', gutter: true, height: 300, minWidth: 240, xlabel: 'protein level p', ylabel: 'rate' });
        const S3 = v.stage({ x: [0, 40], y: [0, 5], axes: 'box', gutter: true, height: 300, minWidth: 260, xlabel: 'time', ylabel: 'p' });
        const S2 = v.stage({ x: [0, 5], y: [0, 2], axes: 'box', gutter: true, height: 300, minWidth: 260, xlabel: 'protein level p', ylabel: 'density' });
        let key = '', snaps = [], trajs = [], info = {};
        const simulate = () => {
          const n = N.value, om = OM.value, r = v.rng(seed * 101 + 5);
          const p0 = INIT.value === 'mid' ? 0.7 : 0.1;
          const prod = (p) => B0 + B * hAct(p, n);
          let p = new Float64Array(NC).fill(p0);
          snaps = [Array.from(p)]; trajs = []; for (let i = 0; i < NTRAJ; i++) trajs.push([[0, p0]]);
          const sq = Math.sqrt(DT);
          for (let k = 1; k <= NT; k++) {
            for (let i = 0; i < NC; i++) {
              const a = prod(p[i]), d = p[i];
              let x = d + (a - d) * DT + Math.sqrt((a + d) / om) * sq * r.normal();
              p[i] = Math.abs(x);
            }
            if (k % SNAP === 0) { snaps.push(Array.from(p)); for (let i = 0; i < NTRAJ; i++) trajs[i].push([k * DT, p[i]]); }
          }
        };
        v.render(() => {
          const n = N.value, om = OM.value;
          const kk = [n, om, INIT.value, seed].join('|');
          if (kk !== key) { key = kk; simulate(); }
          const g = (p) => B0 + B * hAct(p, n) - p;
          const roots = allRoots(g, 0, 5, 4000);
          const stab = roots.map((x) => { const e = 1e-4; return g(x + e) < 0 && g(x - e) > 0; });
          S1.fn((p) => p, { color: 'ink', width: 2 });
          S1.fn((p) => B0 + B * hAct(p, n), { color: 'purple', width: 3 });
          roots.forEach((x, i) => S1.dot(x, x, { r: 6, color: stab[i] ? 'green' : 'red' }));
          for (const tr of trajs) S3.path(tr, { color: 'accent', width: 1, alpha: 0.5 });
          S3.vline(T.value, { color: 'gold', width: 2 });
          roots.forEach((x, i) => S3.hline(x, { color: stab[i] ? 'green' : 'red', dash: true, width: 1, alpha: 0.6 }));
          const idx = Math.min(snaps.length - 1, Math.round(T.value / (SNAP * DT)));
          const cur = snaps[idx];
          const hm = v.M.histogram(cur, { bins: 50, range: [0, 5] }); S2.setView([0, 5], [0, 1.1 * Math.max(...hm.density, 0.5)]);
          S2.hist(cur, { bins: 50, range: [0, 5], density: true, color: 'accent', fillAlpha: 0.35 });
          roots.forEach((x, i) => S2.vline(x, { color: stab[i] ? 'green' : 'red', dash: true, width: 1.5 }));
          const thr = roots.length === 3 ? roots[1] : 1.2;
          const hi = cur.filter((x) => x > thr).length / cur.length;
          info = { roots, stab, hi };
        });
        v.legend([['purple', 'production β₀ + β·hill(p)'], ['green', 'stable fixed point'], ['red', 'unstable fixed point', { dash: true }], ['accent', 'cells']]);
        v.readout(() => `fixed points of the deterministic model: ${info.roots.map((x, i) => v.fix(x, 2) + (info.stab[i] ? ' (stable)' : ' (unstable)')).join(', ')}.\n${info.roots.length === 3 ? `Bistable: ${v.fix(100 * info.hi, 0)}% of the cells are in the high state at $t=${v.fix(T.value, 1)}$.` : `Monostable: the cells pile up around one level (${v.fix(100 * info.hi, 0)}% above $p=1.2$).`}`);
      },
    },
  ],
};
