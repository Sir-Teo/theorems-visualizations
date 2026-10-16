// Demography — Chapter 2 (part b: 2.8–2.14)
import { sum, clamp, fx, int, AGE18, WPP, lifeTable, lAt, SILER, siler, integ, hazardKnots, pwl, CAUSES, OMEGA } from './ch02.shared.js';

const SHORT = ['perinatal', 'external', 'cancer', 'circulatory', 'other'];
const ERAS = [{ value: 'y1750', label: '≈1750' }, { value: 'y1900', label: '≈1900' }, { value: 'y1950', label: '≈1950' }, { value: 'y2020', label: '≈2020' }];

/** Grid 0…110 in steps of 0.5: survival S, density f and tail integrals for a hazard function mu. */
function grid(mu, h = 0.5) {
  const n = Math.round(OMEGA / h), x = [], S = [1], f = [];
  for (let i = 0; i <= n; i++) x.push(i * h);
  let H = 0;
  for (let i = 1; i <= n; i++) { H += ((mu(x[i - 1]) + mu(x[i])) / 2) * h; S.push(Math.exp(-H)); }
  for (let i = 0; i <= n; i++) f.push(mu(x[i]) * S[i]);
  return { x, S, f, h, n };
}
const trap = (a, h) => { let s = 0; for (let i = 0; i < a.length - 1; i++) s += ((a[i] + a[i + 1]) / 2) * h; return s; };
/** 18-group table from a Siler schedule (illustrative): m = deaths / person-years in each 5-year group. */
function silerGroups(p) {
  const si = siler(p), m = [];
  for (let i = 0; i < 18; i++) {
    const x0 = i * 5;
    if (i === 17) m.push(si.S(85) / integ(si.S, 85, 130, 400));
    else m.push((si.S(x0) - si.S(x0 + 5)) / integ(si.S, x0, x0 + 5, 40));
  }
  return m;
}
const NS18 = Array.from({ length: 18 }, (_, i) => (i === 17 ? Infinity : 5));
const tab18 = (m) => lifeTable(m, NS18, [1]);

export default {
  collection: 'demo',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Paradox',
      name: 'Surviving raises your life expectancy',
      statement: String.raw`In a population with high mortality in infancy and childhood, life expectancy at birth can be *lower* than life expectancy at a later age: $e_5 > e_0$, even though five more years have been lived. More generally the expected age at death $x + e_x$ is non-decreasing in $x$, because it is the mean of a distribution (age at death given survival to $x$) that is truncated from below; $e_x$ itself may rise at first and then falls. This is no contradiction: $e_0$ averages over everyone including those who die as infants.`,
      idea: String.raw`By 2.4, $x + e_x = \frac{1}{S(x)}\int_x^\infty t\,f(t)\,dt$, a conditional mean of $T$ given $T>x$, and conditioning on a smaller set that always removes the lowest values can only raise it. Where early hazard is large, surviving the first years removes the bulk of the early deaths, so $e_x$ jumps. Where hazard is low and flat the rise in $x + e_x$ is slight and $e_x$ falls almost one-for-one with $x$.`,
      caption: String.raw`Pick a period schedule and drag the gold handle along the expected age at death $x + e_x$. Left: $e_x$ (orange) and $x + e_x$ (blue). Right: the age-at-death distribution of those still alive at $x$ and its mean. In the 1750-like schedule $e_x$ peaks in childhood well above $e_0$; in the 2020-like one the effect nearly vanishes.`,
      deps: ['demo-2.3'],
      refs: ['PHG ch. 3'],
      tags: ['life expectancy', 'selection'],
      scope: String.raw`Siler-model schedules (illustrative, not data); the effect needs a hazard that is higher at birth than later.`,
      viz(v) {
        const era = v.select('schedule', ERAS, 'y1750');
        const cache = {};
        const get = (k) => {
          if (cache[k]) return cache[k];
          const g = grid(siler(SILER[k]).mu, 0.25), n = g.n, I = new Array(n + 1);
          I[n] = 0; for (let i = n - 1; i >= 0; i--) I[i] = I[i + 1] + ((g.S[i] + g.S[i + 1]) / 2) * g.h;
          const e = g.S.map((s, i) => (s > 1e-9 ? I[i] / s : 0));
          return (cache[k] = { g, e, ex: (x) => { const t = clamp(x / g.h, 0, n - 1e-9), i = Math.floor(t); return e[i] + (e[i + 1] - e[i]) * (t - i); } });
        };
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'years', height: 340, title: 'Remaining life and expected age at death' });
        const d = v.stage({ x: [0, 110], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age at death', ylabel: 'density given alive at x', height: 340, title: 'Who is still alive at x' });
        let cur = get('y1750');
        const mk = s.handle(5, 40, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 100), cur.ex(clamp(x, 0, 100)) + clamp(x, 0, 100)] });
        let info = null;
        v.render(() => {
          cur = get(era.value);
          const x = clamp(mk.x, 0, 100), ex = cur.ex(x);
          mk.set(x, x + ex);
          s.setView([0, 100], [0, Math.max(100, ...cur.e.map((e, i) => e + i * cur.g.h))]);
          s.fn((a) => cur.ex(a), { domain: [0, 100], color: 'orange', width: 2.5 });
          s.fn((a) => a + cur.ex(a), { domain: [0, 100], color: 'accent', width: 2.5 });
          s.hline(cur.ex(0), { color: 'muted', dash: true });
          s.vline(x, { color: 'gold', dash: true });
          const g = cur.g, i0 = Math.round(x / g.h), Sx = g.S[i0];
          const dens = (t) => { const i = clamp(Math.round(t / g.h), 0, g.n); return t >= x ? g.f[i] / Sx : 0; };
          let top = 0; for (let i = i0; i <= g.n; i++) top = Math.max(top, g.f[i] / Sx);
          d.setView([0, 110], [0, top * 1.15]);
          d.fn(dens, { domain: [x, 110], fill: true, color: 'red', fillAlpha: 0.25, n: 400 });
          d.vline(x + ex, { color: 'accent', width: 2.5 });
          d.vline(cur.ex(0), { color: 'orange', dash: true });
          let best = 0, bi = 0; cur.e.forEach((e, i) => { if (e > best) { best = e; bi = i; } });
          info = { x, ex, e0: cur.ex(0), best, bx: bi * g.h };
        });
        v.legend([['orange', '$e_x$'], ['accent', '$x + e_x$'], ['muted', '$e_0$', { dash: true }]]);
        v.readout(() => `$e_0 = ${v.fix(info.e0, 1)}$; at $x = ${v.fix(info.x, 1)}$: $e_x = ${v.fix(info.ex, 1)}$, expected age at death $x + e_x = ${v.fix(info.x + info.ex, 1)}$\nlargest $e_x$ is $${v.fix(info.best, 1)}$ at age $${v.fix(info.bx, 1)}$ — ${info.best > info.e0 + 0.05 ? 'higher than $e_0$ (the paradox)' : 'no gain over $e_0$'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Infant mortality dominates historical life expectancy',
      statement: String.raw`Differences in $e_0$ between high-mortality and low-mortality populations are produced overwhelmingly by deaths in infancy and childhood, not by a lower age at death among adults. Historically (and in poor regions today) an $e_0$ near 30–40 meant a quarter to a third of births dying before age five, while those who reached adulthood could expect to live into their fifties or sixties. Replacing only the rates below age 5 of a high-mortality table by those of a modern one closes a large share of the gap in $e_0$ (about a third of it in the 1750-like model below).`,
      idea: String.raw`By 2.4, $e_0$ is the area under $\ell(x)$. A death at age 1 removes about 80 person-years relative to a death at 80, so a cohort-share $q_5$ of early deaths is worth $80\,q_5$ years of $e_0$, and $q_5$ was in the tens of percent. The decomposition below swaps the rates age group by age group rather than adding them up exactly, so the order of swapping matters a little; this is a transparent counterfactual, not Arriaga's exact decomposition.`,
      caption: String.raw`Choose a pair of tables (UN estimates, plus a 1750-like model). Slide the age: all death rates *below* it are replaced by the modern ones. The dashed curve is the resulting survival, and the right panel shows $e_0$ as a function of the cut-off age. Compare how much the first group (ages 0–4) alone closes with what the whole schedule of later ages adds.`,
      deps: ['demo-2.4'],
      refs: ['PHG ch. 3'],
      tags: ['infant mortality', 'life expectancy'],
      scope: String.raw`Tables computed here from 18 five-year groups with $a_{0\text{–}4} = 1$ year, so $e_0$ can differ from published values by a few tenths of a year; "1750-like" is the Siler model of 2.8, not a measured table.`,
      viz(v) {
        const rich = WPP.SWE2019.m;
        const PAIRS = {
          mod: { label: '1750-like model', m: silerGroups(SILER.y1750) }, chn: { label: 'China 1990', m: WPP.CHN1990.m },
          usa: { label: 'USA 1950', m: WPP.USA1950.m }, swe: { label: 'Sweden 1950', m: WPP.SWE1950.m },
        };
        const sel = v.select('population (vs Sweden 2019)', Object.entries(PAIRS).map(([k, o]) => ({ value: k, label: o.label })), 'mod');
        const cut = v.slider('replace rates below age', 0, 85, 5, { step: 5, int: true });
        const s = v.stage({ x: [0, 100], y: [0, 1.02], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'survival ℓ(x)/ℓ(0)', height: 340, title: 'Survival curves' });
        const g = v.stage({ x: [-2, 90], y: [0, 100], axes: 'box', gutter: true, xlabel: 'replace the rates below this age', ylabel: 'e₀ (years)', height: 340, title: 'Life expectancy when the young are swapped' });
        let info = null;
        v.render(() => {
          const P = PAIRS[sel.value], tp = tab18(P.m), tr = tab18(rich);
          const hyb = (k) => tab18(P.m.map((m, i) => (i < k / 5 ? rich[i] : m)));
          const th = hyb(cut.value);
          s.fn((a) => lAt(tp, a), { domain: [0, 100], color: 'red', width: 2.5 });
          s.fn((a) => lAt(tr, a), { domain: [0, 100], color: 'green', width: 2.5 });
          s.fn((a) => lAt(th, a), { domain: [0, 100], color: 'accent', width: 2.5, dash: true });
          const ks = Array.from({ length: 18 }, (_, i) => i * 5), es = ks.map((k) => hyb(k).e0);
          g.setView([-2, 90], [Math.floor(Math.min(tp.e0, tr.e0) / 5) * 5 - 5, Math.ceil(tr.e0 / 5) * 5 + 3]);
          g.path(ks.map((k, i) => [k, es[i]]), { color: 'accent', width: 2 });
          g.dots(ks.map((k, i) => [k, es[i]]), { r: 3.5, color: 'accent' });
          g.hline(tp.e0, { color: 'red', dash: true }); g.hline(tr.e0, { color: 'green', dash: true });
          g.dot(cut.value, th.e0, { r: 7, color: 'gold' });
          const gap = tr.e0 - tp.e0;
          info = { ep: tp.e0, er: tr.e0, eh: th.e0, share: gap > 0 ? (th.e0 - tp.e0) / gap : 0, q5: 1 - lAt(tp, 5), q5r: 1 - lAt(tr, 5), label: P.label, gap };
        });
        v.legend([['red', 'chosen population'], ['green', 'Sweden 2019'], ['accent', 'swapped below the age', { dash: true }]]);
        v.readout(() => `${info.label}: $e_0 = ${v.fix(info.ep, 1)}$ (probability of dying before 5: ${v.fix(100 * info.q5, 1)}%); Sweden 2019: $e_0 = ${v.fix(info.er, 1)}$ (${v.fix(100 * info.q5r, 2)}%)\nswapping the rates below age ${cut.value}: $e_0 = ${v.fix(info.eh, 1)}$ — closes ${v.fix(100 * info.share, 0)}% of the ${v.fix(info.gap, 1)}-year gap`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Multiple-decrement life tables',
      statement: String.raw`When deaths are classified into causes $c = 1,\dots,k$ with cause-specific hazards $\mu_c(x)$, the **multiple-decrement table** has total hazard $\mu = \sum_c \mu_c$, survival $\ell(x) = \exp(-\int_0^x \mu)$, and cause-specific deaths
$$ {}_nd^{(c)}_x = \int_x^{x+n}\mu_c(a)\,\ell(a)\,da,\qquad \sum_c d^{(c)}_x = d_x.$$
The cumulative deaths from cause $c$ before age $x$ are $D_c(x)=\int_0^x \mu_c\ell$, and $\ell(x) + \sum_c D_c(x) = 1$. The expected years of life lost to cause $c$ (relative to a limit age $\omega$) is $\int_0^\omega D_c(x)\,dx$.`,
      idea: String.raw`The causes share a single survivor function: a person can only die once, so each cause's deaths are drawn from the same $\ell(a)$. Splitting the density $\mu\ell$ in proportion to $\mu_c/\mu$ gives the cause-specific deaths, and the areas add up because $\int_0^\omega\ell = e_0$ (2.4) and $\omega = \int_0^\omega(\ell + \sum_c D_c)$.`,
      caption: String.raw`Cumulative deaths by cause stacked above the survival curve (green): the five bands fill the space from $\ell(x)$ up to 1. The bars on the right give the area of each band, years of life lost to that cause out of a possible 110, and the area under the survival curve, $e_0$; they add to 110. Scale the causes with the sliders (illustrative hazards shaped like a rich country, not data) and watch the bands trade places.`,
      deps: ['demo-2.3'],
      refs: ['PHG ch. 4'],
      tags: ['causes of death', 'competing risks'],
      scope: String.raw`The cause-specific hazards are illustrative curves of the right shape (infancy, injuries peaking in the early twenties, cancer and circulatory disease rising steeply), not data of any country.`,
      viz(v) {
        const mults = CAUSES.map((c) => v.slider(c.name, 0, 3, 1, { step: 0.05 }));
        const ag = v.slider('age marker', 5, 105, 70, { step: 1 });
        const s = v.stage({ x: [0, OMEGA], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'share of the birth cohort', height: 360, title: 'Survivors and cumulative deaths by cause' });
        const b = v.stage({ x: [0, 7], y: [0, 100], axes: 'box', gutter: true, xlabel: '', ylabel: 'years (of a possible 110)', height: 360, title: 'Where the 110 years go', xticks: [[1, 'e₀'], ...CAUSES.map((c, i) => [i + 2, ['perin.', 'external', 'cancer', 'circul.', 'other'][i]])] });
        let info = null;
        v.render(() => {
          const g = multi(mults.map((m) => m.value));
          const stackBase = g.S.slice(), edges = [stackBase];
          g.D.forEach((D) => { const prev = edges[edges.length - 1]; edges.push(prev.map((p, i) => p + D[i])); });
          const at = (arr) => (a) => arr[clamp(Math.round(a / g.h), 0, g.n)];
          s.between(() => 0, at(stackBase), 0, OMEGA, { fill: 'green', fillAlpha: 0.3 });
          for (let c = 0; c < CAUSES.length; c++) s.between(at(edges[c]), at(edges[c + 1]), 0, OMEGA, { fill: CAUSES[c].color, fillAlpha: 0.6 });
          s.vline(ag.value, { color: 'ink', dash: true });
          const lost = g.D.map((D) => trap(D, g.h)), e0 = trap(g.S, g.h);
          const vals = [e0, ...lost];
          b.bars(vals, { x0: 1, dx: 1, color: (val, i) => (i === 0 ? 'green' : CAUSES[i - 1].color) });
          const i0 = Math.round(ag.value / g.h);
          info = { e0, lost, tot: e0 + sum(lost), chk: g.S[i0] + sum(g.D.map((D) => D[i0])), shares: g.D.map((D) => D[i0]), x: ag.value, lx: g.S[i0] };
        });
        v.readout(() => `$e_0 = ${v.fix(info.e0, 1)}$; years lost: ${CAUSES.map((c, i) => `${SHORT[i]} ${v.fix(info.lost[i], 1)}`).join(', ')}; total $= ${v.fix(info.tot, 2)}$ (= 110)\nby age ${info.x}: ${v.fix(100 * info.lx, 1)}% alive, ${CAUSES.map((c, i) => `${v.fix(100 * info.shares[i], 1)}% died of ${SHORT[i]}`).join(', ')}; sum of all $= ${v.fix(100 * info.chk, 2)}$%`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Cause elimination and competing risks',
      statement: String.raw`Suppose causes act independently, so that removing cause $c$ leaves the other cause-specific hazards unchanged. Then the survival function of the *associated single-decrement table* is
$$\ell^{(-c)}(x) = \exp\!\Big(-\int_0^x \big(\mu(a) - \mu_c(a)\big)da\Big) \;\ge\; \ell(x),$$
and the gain in life expectancy is $e_0^{(-c)} - e_0 = \int_0^\infty (\ell^{(-c)} - \ell)\,dx$. The gain is smaller than the naive "years lost to $c$" because the people saved are exposed to the other causes. **Independence cannot be tested from the observed data**: with a shared frailty the hazards that appear in the table are those of survivors, and the independence-based calculation gives a different answer from the truth.`,
      idea: String.raw`With independence, the cumulative hazard splits additively, so dropping one component drops its area from the exponent (2.6); integrating the new survival (2.4) gives $e_0^{(-c)}$. The people who would have died of $c$ are not immortal: they die later of something else, which is why eliminating cancer buys only a few years. Tsiatis (1975) showed that any dependent competing-risks model can be matched by an independent one with the same observed cause-specific hazards, so independence is an untestable assumption. Here a shared gamma frailty shows how far it can mislead.`,
      caption: String.raw`Tick the causes to eliminate. Blue is the table-based answer (independence), grey the original survival, and orange the truth in a world where everyone's hazards share a frailty of variance $\sigma^2$ (set it to 0 and blue and orange agree). The bars compare the two gains in $e_0$. With frailty the observed hazards of survivors fall behind those of the population, and the naive calculation overstates (or understates) the gain.`,
      deps: ['demo-2.10', 'demo-2.6'],
      refs: ['PHG ch. 4'],
      tags: ['competing risks', 'cause elimination'],
      credit: 'A. A. Tsiatis, 1975 (non-identifiability of dependent competing risks)',
      scope: String.raw`Hazards illustrative (see 2.10). The frailty model is a gamma-distributed multiplier with mean 1 acting on all causes.`,
      viz(v) {
        const tg = CAUSES.map((c) => v.toggle('remove ' + SHORT[CAUSES.indexOf(c)], c.key === 'cancer'));
        const sg = v.slider('frailty variance $\\sigma^2$', 0, 2, 0.5, { step: 0.05 });
        const s = v.stage({ x: [0, OMEGA], y: [0, 1.02], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'survival', height: 340, title: 'Survival with causes removed' });
        const b = v.stage({ x: [0, 4], y: [0, 6], axes: 'box', gutter: true, xlabel: '', ylabel: 'gain in e₀ (years)', height: 340, title: 'Gain in life expectancy', xticks: [[1, 'table'], [2, 'truth']] });
        let info = null;
        v.render(() => {
          const rem = tg.map((t) => t.value), s2 = sg.value;
          const F = (H) => (s2 < 1e-6 ? Math.exp(-H) : Math.pow(1 + s2 * H, -1 / s2));
          const h = 0.5, n = Math.round(OMEGA / h);
          const Hnu = [0], Hrest = [0], naiveH = [0], obsH = [0];
          // individual-level hazards ν_c = CAUSES mu; observed hazard of cause c is ν_c / (1 + σ²H_ν)
          const nuAll = (a) => sum(CAUSES.map((c) => c.mu(a))), nuRest = (a) => sum(CAUSES.map((c, i) => (rem[i] ? 0 : c.mu(a))));
          for (let i = 1; i <= n; i++) {
            const a0 = (i - 1) * h, a1 = i * h;
            Hnu.push(Hnu[i - 1] + ((nuAll(a0) + nuAll(a1)) / 2) * h);
            Hrest.push(Hrest[i - 1] + ((nuRest(a0) + nuRest(a1)) / 2) * h);
          }
          // observed total hazard −d ln F(H)/dx; observed hazard share kept by remaining causes: nuRest/nuAll of it
          const Sobs = Hnu.map(F), Strue = Hrest.map(F);
          const obsMu = (i) => (nuAll(i * h) / (1 + s2 * Hnu[i]));
          const Snaive = [1]; let Hn = 0;
          for (let i = 1; i <= n; i++) { const share = (j) => (nuAll(j * h) > 0 ? nuRest(j * h) / nuAll(j * h) : 0); Hn += ((obsMu(i - 1) * share(i - 1) + obsMu(i) * share(i)) / 2) * h; Snaive.push(Math.exp(-Hn)); }
          const at = (arr) => (a) => arr[clamp(Math.round(a / h), 0, n)];
          s.fn(at(Sobs), { domain: [0, OMEGA], color: 'muted', width: 2.5, n: 220 });
          s.fn(at(Snaive), { domain: [0, OMEGA], color: 'accent', width: 2.5, n: 220 });
          s.fn(at(Strue), { domain: [0, OMEGA], color: 'orange', width: 2.5, dash: true, n: 220 });
          const e = (arr) => trap(arr, h), e0 = e(Sobs), gN = e(Snaive) - e0, gT = e(Strue) - e0;
          b.setView([0, 4], [0, Math.max(3, gN, gT) * 1.25]);
          b.bars([gN, gT], { x0: 1, dx: 1, color: (val, i) => (i === 0 ? 'accent' : 'orange') });
          info = { e0, gN, gT, any: rem.some(Boolean) };
        });
        v.legend([['muted', 'original (observed)'], ['accent', 'cause removed — table, independence'], ['orange', 'cause removed — truth with frailty', { dash: true }]]);
        v.readout(() => `$e_0 = ${v.fix(info.e0, 1)}$ years. ${info.any ? `Gain from eliminating the ticked causes: table (independence) $+${v.fix(info.gN, 2)}$ years, truth under frailty $+${v.fix(info.gT, 2)}$ years` : 'Tick a cause to eliminate.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Method',
      name: 'Healthy life expectancy (Sullivan method)',
      statement: String.raw`Let $L_x$ be the person-years of a life table in age group $x$ and $\pi_x$ the prevalence of a health problem (disability, poor self-rated health) there, from a survey. **Sullivan's method** gives the expected years free of the problem from age $x$:
$$\text{HLE}_x = \frac{1}{\ell_x}\sum_{y\ge x} L_y\,(1 - \pi_y),$$
and the expected unhealthy years $\text{LE}_x - \text{HLE}_x = \frac{1}{\ell_x}\sum_{y \ge x} L_y\,\pi_y$. It needs only a life table and a prevalence schedule, not longitudinal data.`,
      idea: String.raw`Period life expectancy is the sum of $L_y/\ell_x$; Sullivan splits each person-year by the fraction of the population in that age group who are unwell. The method inherits the stationary-population assumption of the life table (2.3), and measures prevalence, not incidence, so it blends the effect of mortality and of health changes.`,
      caption: String.raw`Each bar is the share of the cohort alive in a 5-year group, split into healthy (green) and unhealthy (red) years. Drag the blue prevalence points (the share unwell, left panel), or postpone the onset by some years. Life expectancy does not change but healthy life expectancy does; the readout gives both, from birth and from 65. Prevalences are illustrative.`,
      deps: ['demo-2.3'],
      refs: ['PHG ch. 4'],
      tags: ['health', 'life expectancy'],
      credit: 'Daniel F. Sullivan, 1971',
      scope: String.raw`Life tables are from UN data (18 groups); the prevalence schedule is an assumed logistic curve in age, not a survey.`,
      viz(v) {
        const KEYS = [{ value: 'SWE2019', label: 'Sweden 2019' }, { value: 'MEX2019', label: 'Mexico 2019' }, { value: 'USA1950', label: 'USA 1950' }, { value: 'CHN1990', label: 'China 1990' }];
        const sel = v.select('life table', KEYS, 'SWE2019');
        const sh = v.slider('postpone onset by (years)', 0, 15, 0, { step: 1, int: true });
        const mid = Array.from({ length: 18 }, (_, i) => i * 5 + 2.5);
        const pi = mid.map((a) => clamp(0.03 + 0.55 / (1 + Math.exp(-(a - 78) / 8)), 0, 1));
        const p = v.stage({ x: [-0.6, 17.6], y: [0, 0.9], axes: 'box', gutter: true, xlabel: 'age group', ylabel: 'prevalence πₓ unwell', height: 320, title: 'Prevalence of the problem', xticks: AGE18.map((l, i) => [i, i % 3 === 0 ? l : '']) });
        const s = v.stage({ x: [0, 100], y: [0, 1.02], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'share of cohort alive', height: 320, title: 'Years lived, healthy and unhealthy' });
        const H = pi.map((val, i) => { const h = p.handle(i, val, { color: 'accent', r: 6, constrain: (x, y) => [i, clamp(y, 0, 1)] }); h.onDrag = () => { pi[i] = h.y; }; return h; });
        let info = null;
        const eff = (a) => { // prevalence at age a after postponing onset
          const b = a - sh.value;
          if (b <= mid[0]) return pi[0];
          if (b >= mid[17]) return pi[17];
          const k = Math.floor((b - 2.5) / 5), t = (b - mid[k]) / 5;
          return pi[k] + (pi[k + 1] - pi[k]) * t;
        };
        v.render(() => {
          const tb = tab18(WPP[sel.value].m), R = tb.l[0];
          const pe = mid.map(eff);
          p.path(pe.map((q, i) => [i, q]), { color: 'orange', width: 2 });
          tb.x.forEach((x, i) => {
            const w = i === 17 ? 15 : 5, hgt = tb.L[i] / R / w;
            s.rect(x, 0, x + w, hgt * (1 - pe[i]), { fill: 'green', color: 'green', fillAlpha: 0.45 });
            s.rect(x, hgt * (1 - pe[i]), x + w, hgt, { fill: 'red', color: 'red', fillAlpha: 0.45 });
          });
          const from = (k) => { let h = 0, t = 0; for (let i = k; i < 18; i++) { h += tb.L[i] * (1 - pe[i]); t += tb.L[i]; } return [t / tb.l[k], h / tb.l[k]]; };
          const [le0, h0] = from(0), [le65, h65] = from(13);
          info = { le0, h0, le65, h65 };
        });
        v.legend([['green', 'healthy years'], ['red', 'unhealthy years'], ['orange', 'prevalence used', { }]]);
        v.readout(() => `from birth: life expectancy $${v.fix(info.le0, 1)}$, healthy $${v.fix(info.h0, 1)}$, unhealthy $${v.fix(info.le0 - info.h0, 1)}$ years (${v.fix(100 * info.h0 / info.le0, 0)}% healthy)\nfrom 65: life expectancy $${v.fix(info.le65, 1)}$, healthy $${v.fix(info.h65, 1)}$, unhealthy $${v.fix(info.le65 - info.h65, 1)}$ years`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Concept',
      name: 'Lifespan inequality and Keyfitz’s entropy',
      statement: String.raw`Two populations can have the same life expectancy but very different spreads of ages at death. Standard summaries are the standard deviation $\sigma_T$ of age at death and **Keyfitz's entropy**
$$H = \frac{e^\dagger}{e_0},\qquad e^\dagger = -\int_0^\infty \ell(x)\ln\ell(x)\,dx,$$
which lies between 0 (all deaths at one age: a rectangular survival curve) and 1 (a constant hazard). $H$ also has a sensitivity meaning: if every death rate is reduced by a small fraction $\varepsilon$, then $e_0$ rises by the fraction $\varepsilon H$, i.e. $\Delta e_0 \approx \varepsilon\,e^\dagger$.`,
      idea: String.raw`Reducing all hazards by $\varepsilon$ replaces $S$ by $S^{1-\varepsilon}$, so $\frac{d}{d\varepsilon}\int S^{1-\varepsilon}dx\,|_0 = -\int S\ln S\,dx = e^\dagger$ (differentiation under the integral, with $e_0 = \int S$ from 2.4). A rectangular survival curve has $\ell\ln\ell\approx 0$ except in a narrow band, so $H \approx 0$: further hazard reductions barely help. A flat hazard gives $H = 1$.`,
      caption: String.raw`Two Siler populations with the *same* life expectancy (equal areas under the two survival curves). Population B has more child mortality, and compensates with lower adult hazard. Raise B's child mortality: its survival curve is bowed outward in the middle, deaths are more spread out, and $\sigma_T$ and $H$ increase. The last line checks the sensitivity result by cutting all hazards by 1%.`,
      deps: ['demo-2.4'],
      refs: ['K&C: Understanding Population Characteristics'],
      tags: ['inequality', 'entropy'],
      credit: 'Nathan Keyfitz, 1977 (entropy of the survival curve)',
      viz(v) {
        const target = v.slider('common $e_0$ (years)', 45, 84, 70, { step: 0.5 });
        const cB = v.slider('B: child-mortality multiplier', 1, 30, 10, { log: true, sig: 2 });
        const s = v.stage({ x: [0, OMEGA], y: [0, 1.02], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'survival', height: 340, title: 'Same area, different shape' });
        const d = v.stage({ x: [0, OMEGA], y: [0, 0.05], axes: 'box', gutter: true, xlabel: 'age at death', ylabel: 'density of deaths', height: 340, title: 'Distribution of age at death' });
        const base = SILER.y2020;
        const mk = (c, e0t, scale = 1) => {
          const e = (a3) => { const si = siler({ ...base, a1: base.a1 * c, a2: base.a2 * c, a3 }); return integ(si.S, 0, OMEGA, 440); };
          let lo = 1e-9, hi = 0.05;
          if (e(lo) < e0t) return null;
          for (let i = 0; i < 40; i++) { const mid = Math.sqrt(lo * hi); if (e(mid) > e0t) lo = mid; else hi = mid; }
          return { ...base, a1: base.a1 * c, a2: base.a2 * c, a3: Math.sqrt(lo * hi) };
        };
        const stats = (p, k = 1) => {
          const si = siler(p), S = (x) => Math.exp(-k * si.H(x));
          const e0 = integ(S, 0, OMEGA, 660), m2 = integ((x) => 2 * x * S(x), 0, OMEGA, 660);
          const ed = integ((x) => { const q = S(x); return q > 1e-300 ? -q * Math.log(q) : 0; }, 0, OMEGA, 660);
          return { si, e0, sd: Math.sqrt(Math.max(0, m2 - e0 * e0)), H: ed / e0, ed };
        };
        let info = null;
        v.render(() => {
          const pA = mk(1, target.value), pB = mk(cB.value, target.value);
          if (!pA || !pB) { info = null; return; }
          const A = stats(pA), B = stats(pB);
          s.fn(A.si.S, { domain: [0, OMEGA], color: 'accent', width: 2.5, fill: true, fillAlpha: 0.1 });
          s.fn(B.si.S, { domain: [0, OMEGA], color: 'orange', width: 2.5 });
          const fA = (x) => A.si.mu(x) * A.si.S(x), fB = (x) => B.si.mu(x) * B.si.S(x);
          let top = 0; for (let x = 1; x < OMEGA; x += 1) top = Math.max(top, fA(x), fB(x));
          d.setView([0, OMEGA], [0, top * 1.15]);
          d.fn(fA, { domain: [1, OMEGA], color: 'accent', width: 2.5, n: 330 });
          d.fn(fB, { domain: [1, OMEGA], color: 'orange', width: 2.5, n: 330 });
          const A2 = stats(pA, 0.99), B2 = stats(pB, 0.99);
          info = { A, B, rA: (A2.e0 / A.e0 - 1) / 0.01, rB: (B2.e0 / B.e0 - 1) / 0.01 };
        });
        v.legend([['accent', 'A: low child mortality'], ['orange', 'B: more child mortality, lower adult hazard']]);
        v.readout(() => (info ? `A: $e_0 = ${v.fix(info.A.e0, 1)}$, $\\sigma_T = ${v.fix(info.A.sd, 1)}$ yr, $H = ${v.fix(info.A.H, 3)}$ ($e^\\dagger = ${v.fix(info.A.ed, 1)}$)\nB: $e_0 = ${v.fix(info.B.e0, 1)}$, $\\sigma_T = ${v.fix(info.B.sd, 1)}$ yr, $H = ${v.fix(info.B.H, 3)}$ ($e^\\dagger = ${v.fix(info.B.ed, 1)}$)\ncutting all hazards by 1% raises $e_0$ by $${v.fix(info.rA, 3)}$% in A and $${v.fix(info.rB, 3)}$% in B — matching $H$ ($${v.fix(info.A.H, 3)}$ and $${v.fix(info.B.H, 3)}$)` : 'A common $e_0$ this high is not reachable with this child mortality; lower it.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Paper',
      name: 'Observations upon the Bills of Mortality',
      paper: { authors: 'John Graunt', year: 1662, title: 'Natural and Political Observations Mentioned in a Following Index, and Made upon the Bills of Mortality', venue: 'London: Tho. Roycroft for John Martin, James Allestry and Tho. Dicas', url: 'https://archive.org/details/2356014R.nlm.nih.gov' },
      introduces: ['demo-2.3', 'demo-4.11'],
      statement: String.raw`Graunt tabulated the weekly London bills of christenings and burials and drew conclusions from the counts. Two are central. First, male christenings consistently exceeded female ones, in a ratio near 14 to 13, year after year. Second, since the bills gave no ages, he reasoned from the causes of death to a table of survivors of 100 births: 64 alive at age 6, 40 at 16, 25 at 26, 16 at 36, 10 at 46, 6 at 56, 3 at 66, 1 at 76 and none at 80. This is the first life table, and it is built from an assumption, not a census.`,
      idea: String.raw`Before this, mortality was anecdote and the weekly bills a plague alarm. Graunt treated them as data: he estimated the share of deaths from children's diseases, took the remainder to decline by a roughly constant fraction each decade, and read off the table. The sex-ratio regularity is an early example of statistical stability that chance alone cannot explain. The two introduced ideas, the life table (2.3) and a stable sex ratio at birth, anchor all later demography.`,
      caption: String.raw`Left: Graunt's survivors (gold points; the table is his own) against a modern low-mortality table (Sweden 2019 from UN data, standing in for London now) and a constant-hazard curve. Each decade after six he lets about 5/8 survive, which is a constant hazard of about 0.047 per year. Right: the christenings of each simulated year; drag the slider for the number per year. A fair coin would give male excess in half the years; the 14:13 ratio gives it in almost every year.`,
      deps: [],
      refs: [],
      tags: ['history', 'life table', 'sex ratio'],
      credit: 'John Graunt, 1662',
      links: { archive: 'https://archive.org/details/2356014R.nlm.nih.gov' },
      viz(v) {
        const ages = [0, 6, 16, 26, 36, 46, 56, 66, 76, 80], ls = [100, 64, 40, 25, 16, 10, 6, 3, 1, 0];
        const mod = tab18(WPP.SWE2019.m);
        const showMod = v.toggle('show a modern table (Sweden 2019)', true);
        const showExp = v.toggle('show a constant-hazard curve', true);
        const N = v.slider('christenings per year', 1000, 12000, 5000, { step: 500, int: true });
        const Y = v.slider('years', 5, 60, 30, { step: 1, int: true });
        let seed = 3;
        v.button('resample', () => { seed += 1; });
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'survivors out of 100 born', height: 340, title: 'Graunt’s table of survivors' });
        const t = v.stage({ x: [0, 61], y: [0.46, 0.57], axes: 'box', gutter: true, xlabel: 'year of the bills', ylabel: 'male share of christenings', height: 340, title: 'Males against females' });
        const P = pwl(ages, ls);
        const lam = -Math.log(ls[5] / ls[1]) / 40;   // constant hazard fitted to 6…46
        const Phi = v.M.dist.normal(0, 1).cdf;
        let info = null;
        v.render(() => {
          if (showMod.value) s.fn((a) => 100 * lAt(mod, a), { domain: [0, 100], color: 'green', width: 2.5 });
          if (showExp.value) s.fn((a) => 64 * Math.exp(-lam * (a - 6)), { domain: [6, 100], color: 'orange', width: 2, dash: true });
          s.path(ages.map((a, i) => [a, ls[i]]), { color: 'gold', width: 2.5 });
          s.dots(ages.map((a, i) => [a, ls[i]]), { r: 5, color: 'gold' });
          const r = v.rng(seed), n = N.value, p = 14 / 27, sd = Math.sqrt(p * (1 - p) / n);
          let up = 0; const pts = [], fair = [];
          for (let y = 1; y <= Y.value; y++) { const f = p + sd * r.normal(); pts.push([y, f]); if (f > 0.5) up++; }
          const sf = 0.5 / Math.sqrt(n);
          t.setView([0, Y.value + 1], [0.5 - 4.2 * sf, 0.5 + 4.2 * sf + 0.02]);
          t.hband(0.5 - 2 * sf, 0.5 + 2 * sf, { color: 'muted', alpha: 0.15 });
          t.hline(0.5, { color: 'muted', dash: true });
          t.hline(p, { color: 'accent', dash: true });
          t.path(pts, { color: 'accent', width: 1, alpha: 0.5 });
          t.dots(pts, { r: 4, color: 'accent' });
          const pyr = Phi((p - 0.5) / sd);
          info = { up, Y: Y.value, pyr, fairAll: Math.pow(0.5, Y.value), allM: Math.pow(pyr, Y.value), area: P.area / 100 };
        });
        v.legend([['gold', 'Graunt’s survivors'], ['green', 'Sweden 2019'], ['orange', 'constant hazard', { dash: true }], ['accent', 'male share, 14:13 simulation']]);
        v.readout(() => `Graunt’s table implies $e_0 \\approx ${v.fix(info.area, 1)}$ years (linear between his ages), against $${v.fix(mod.e0, 1)}$ for Sweden 2019 — the paper’s number vs today’s\ndecade survival ratios from 6: ${[1, 2, 3, 4, 5].map((i) => v.fix(ls[i + 1] / ls[i], 2)).join(', ')} (about 5/8, a hazard of ${v.fix(lam, 3)} per year)\nmale excess in ${info.up} of ${info.Y} simulated years; with a fair coin all ${info.Y} years would have male excess with probability $2^{-${info.Y}} = ${v.sci(info.fairAll, 2)}$; with 14:13 and this many births: ${v.fix(100 * info.pyr, 2)}% per year`);
      },
    },
  ],
};

/** Multiple-decrement computation: mult scales each cause's hazard. Returns survival S and cumulative deaths D[c] on a 0.5-year grid up to 110. */
function multi(mult) {
  const h = 0.5, n = Math.round(OMEGA / h);
  const mu = CAUSES.map((c, i) => (a) => c.mu(a) * mult[i]);
  const tot = (a) => sum(mu.map((f) => f(a)));
  const S = [1], D = CAUSES.map(() => [0]);
  for (let i = 1; i <= n; i++) {
    const a0 = (i - 1) * h, a1 = i * h;
    // exact on the step for a hazard that is constant over the step (mid value), so S + ΣD = 1 to rounding
    const tm = tot(a0 + h / 2), Sn = S[i - 1] * Math.exp(-tm * h), lost = S[i - 1] - Sn;
    S.push(Sn);
    CAUSES.forEach((c, k) => D[k].push(D[k][i - 1] + (tm > 0 ? (lost * mu[k](a0 + h / 2)) / tm : 0)));
  }
  return { S, D, h, n };
}
