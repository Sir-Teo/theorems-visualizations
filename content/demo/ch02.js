// Demography — Chapter 2: The life table (part a: 2.1–2.7)
import { sum, clamp, fx, int, AGE18, WPP, lAt, SILER, siler, integ, hazardKnots, pwl } from './ch02.shared.js';

const ERAS = [{ value: 'y1750', label: '≈1750' }, { value: 'y1900', label: '≈1900' }, { value: 'y1950', label: '≈1950' }, { value: 'y2020', label: '≈2020' }];
/** log10 of the tick label 10^k with unicode superscripts. */
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const p10 = (k) => '10' + String(k).split('').map((c) => SUP[c]).join('');

export default {
  collection: 'demo',
  chapter: 2,
  title: 'The life table',
  summary: String.raw`A life table follows a hypothetical cohort through a fixed schedule of death rates and summarizes it by survivorship, deaths, person-years and life expectancy. Life expectancy is simply the area under the survival curve, which is why infant deaths weigh so heavily on it. Multiple-decrement tables split deaths by cause and answer questions such as how much life expectancy would rise if a cause were eliminated.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Age-specific death rate mₓ and probability qₓ',
      statement: String.raw`For the age interval $[x, x+n)$ in a given period, the **age-specific death rate** is
$$ {}_nm_x = \frac{{}_nD_x}{{}_nPY_x},$$
deaths in the interval divided by the person-years lived in it, and the **probability of dying** is
$$ {}_nq_x = \frac{{}_nD_x}{\ell_x},$$
deaths divided by the number *entering* the interval alive. The rate has the dimension 1/time and can exceed 1; the probability is a pure number in $[0,1]$. They agree to first order when mortality is low and diverge as it grows (for a constant hazard $\mu$ over one year, $m = \mu$ but $q = 1 - e^{-\mu}$).`,
      idea: String.raw`Both numbers have the same numerator, the deaths. The denominators differ: a person who dies half way through the year contributes only half a person-year to the rate's denominator but one full person to the probability's. The more deaths there are, the more person-years are lost compared with persons entering, so $q < m$ and the gap widens. Person-years and occurrence–exposure rates come from the previous chapter; the constant-hazard case is the exponential waiting time from the renewal setting of \texttt{mathbio}.`,
      caption: String.raw`Left: the next year of life for 48 people, each with a seeded random waiting time; a red dot marks a death. Move the hazard slider and watch deaths, person-years, $m$ and $q$ update. Right: the exact curve $q = 1 - e^{-m}$ against the line $q = m$, with the theory point (blue) and the sample (gold). Raise the hazard and the two measures separate.`,
      deps: ['demo-1.2', 'mathbio-4.1'],
      refs: ['PHG ch. 2'],
      tags: ['rates', 'probability'],
      scope: String.raw`The curve $q = 1 - e^{-m}$ assumes a hazard that is constant within the interval; real hazards vary, which is the subject of 2.2.`,
      viz(v) {
        const N = 48, r = v.rng(11), U = Array.from({ length: N }, () => r()).sort((a, b) => a - b);
        const s = v.stage({ x: [0, 1], y: [0, N + 1], axes: 'box', gutter: true, xlabel: 'time within the year', ylabel: 'person', height: 360, title: 'The next year, person by person' });
        const t = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, xlabel: 'rate m (deaths per person-year)', ylabel: 'probability q', height: 360, title: '$q = 1 - e^{-m}$ against $q = m$' });
        const mu = v.slider('hazard $\\mu$ (per year)', 0.005, 3, 0.4, { log: true, sig: 2 });
        let D = 0, PY = 0;
        v.render(() => {
          D = 0; PY = 0;
          U.forEach((u, i) => {
            const T = -Math.log(1 - u) / mu.value, dead = T < 1, end = dead ? T : 1;
            D += dead ? 1 : 0; PY += end;
            s.line(0, i + 1, end, i + 1, { color: dead ? 'red' : 'green', width: 2, alpha: 0.8 });
            if (dead) s.dot(end, i + 1, { r: 3.5, color: 'red' }); else s.dot(1, i + 1, { r: 3, hollow: true, color: 'green' });
          });
          s.vline(1, { color: 'muted', dash: true });
          t.fn((m) => 1 - Math.exp(-m), { color: 'accent', width: 2.5 });
          t.fn((m) => Math.min(1, m), { color: 'muted', dash: true });
          t.dot(mu.value, 1 - Math.exp(-mu.value), { r: 6, color: 'accent', label: 'theory', labelPos: 'se' });
          t.dot(D / PY, D / N, { r: 5, color: 'gold' });
        });
        v.legend([['accent', '$q = 1 - e^{-m}$'], ['muted', '$q = m$', { dash: true }], ['gold', 'this sample']]);
        v.readout(() => `deaths $D = ${D}$, entering $N = ${N}$, person-years $= ${v.fix(PY, 1)}$\n$m = D/PY = ${v.fix(D / PY, 3)}$, $\\;q = D/N = ${v.fix(D / N, 3)}$; theory: $m = ${v.fix(mu.value, 3)}$, $q = ${v.fix(1 - Math.exp(-mu.value), 3)}$, ratio $q/m = ${v.fix((1 - Math.exp(-mu.value)) / mu.value, 3)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Method',
      name: 'From rates to probabilities: the aₓ assumption',
      statement: String.raw`A published table gives rates $_nm_x$; the life table needs probabilities. Let $_na_x$ be the average number of years lived within $[x, x+n)$ by those who die in it. Then person-years are $PY = n\,\ell_{x+n} + {}_na_x\,d_x$ and
$$ {}_nq_x = \frac{n\,{}_nm_x}{1 + (n - {}_na_x)\,{}_nm_x}.$$
The conversion is exact when $a_x$ is the true mean; the usual default $a_x = n/2$ (deaths uniformly spread) is accurate for single years in adult life but poor for infants, where deaths cluster in the first days ($a_0 \approx 0.1$ at high mortality) and for wide intervals.`,
      idea: String.raw`Write $PY$ as the survivors' full interval plus the part-intervals of those who died, substitute into $m = d/PY$, and solve for $q = d/\ell_x$. Everything hinges on the single unknown $a_x$, which depends on how the hazard varies inside the interval: a steeply falling infant hazard puts most deaths early, a rising adult hazard puts them slightly late. This method builds on the definition of rates and probabilities in 2.1.`,
      caption: String.raw`Pick an age interval and a period schedule. The orange line is your assumed $a$ (slider, as a fraction of the interval); green is the true mean time of death within the interval, computed from the hazard; the dashed line is the midpoint. The bars show the error of $q$ for $a = n/2$ and for your $a$; the button sets $a$ to the truth, where the error vanishes.`,
      deps: ['demo-2.1'],
      refs: ['PHG ch. 3'],
      tags: ['life table', 'assumptions'],
      scope: String.raw`Schedules here are illustrative Siler-type hazards (a childhood decline, a constant and an exponential rise), not data.`,
      viz(v) {
        const era = v.select('schedule', ERAS, 'y1750');
        const iv = v.select('interval', [{ value: '0', label: 'infants 0–1' }, { value: '1', label: 'ages 1–5' }, { value: '2', label: 'ages 30–35' }, { value: '3', label: 'ages 70–75' }], '0');
        const IV = [[0, 1], [1, 5], [30, 35], [70, 75]];
        const al = v.slider('assumed $a/n$', 0, 1, 0.5, { step: 0.01 });
        let truth = 0.5;
        v.button('set $a$ to the truth', () => al.set(Math.round(truth * 100) / 100));
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'time within the interval (years)', ylabel: 'density of deaths', height: 320, title: 'When in the interval do deaths happen?' });
        const e = v.stage({ x: [0, 3], y: [-10, 10], axes: 'box', gutter: true, xlabel: '', ylabel: 'error in q (%)', height: 320, title: 'Error of the conversion', xticks: [[1, 'a = n/2'], [2, 'your a']] });
        let R = null;
        v.render(() => {
          const si = siler(SILER[era.value]), [x0, x1] = IV[+iv.value], n = x1 - x0, l0 = si.S(x0);
          const D = (l0 - si.S(x1)) / l0, PY = integ(si.S, x0, x1, 200) / l0, m = D / PY;
          const f = (u) => (si.mu(x0 + u) * si.S(x0 + u)) / l0 / D;
          const aT = integ((u) => u * f(u), 0, n, 200);
          const qOf = (a) => (n * m) / (1 + (n - a) * m);
          const aS = al.value * n, q0 = qOf(n / 2), q1 = qOf(aS);
          truth = aT / n;
          R = { n, m, D, aT, aS, q0, q1 };
          let top = 0; for (let k = 0; k <= 40; k++) top = Math.max(top, f((k / 40) * n));
          s.setView([0, n], [0, top * 1.2]);
          s.fn(f, { domain: [0, n], fill: true, color: 'accent', fillAlpha: 0.2 });
          s.vline(n / 2, { color: 'muted', dash: true });
          s.vline(aT, { color: 'green', width: 2.5 });
          s.vline(aS, { color: 'orange', width: 2.5 });
          const err = [100 * (q0 - D) / D, 100 * (q1 - D) / D], mx = Math.max(5, ...err.map(Math.abs)) * 1.2;
          e.setView([0, 3], [-mx, mx]);
          e.bars(err, { x0: 1, dx: 1, color: (val) => (Math.abs(val) < 0.05 ? 'green' : 'red') });
          e.hline(0, { color: 'muted' });
        });
        v.legend([['accent', 'density of deaths'], ['green', 'true mean time of death'], ['orange', 'assumed a'], ['muted', 'n/2', { dash: true }]]);
        v.readout(() => `interval length $n = ${R.n}$, $m = ${v.fix(R.m, 4)}$, true $q = ${v.fix(R.D, 4)}$\ntrue $a = ${v.fix(R.aT, 3)}$ yr ($a/n = ${v.fix(R.aT / R.n, 2)}$); $a = n/2$ gives $q = ${v.fix(R.q0, 4)}$ (${fx(100 * (R.q0 - R.D) / R.D, 1)}%); your $a = ${v.fix(R.aS, 3)}$ gives $q = ${v.fix(R.q1, 4)}$ (${fx(100 * (R.q1 - R.D) / R.D, 1)}%)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Life-table columns: lₓ, dₓ, Lₓ, Tₓ, eₓ',
      statement: String.raw`Given rates $_nm_x$ and a radix $\ell_0$ (usually $100\,000$), the **life table** of a synthetic cohort has columns
$$\ell_{x+n} = \ell_x - d_x,\quad d_x = \ell_x\,{}_nq_x,\quad {}_nL_x = n\,\ell_{x+n} + {}_na_x\,d_x,\quad T_x = \sum_{y \ge x} {}_nL_y,\quad e_x = \frac{T_x}{\ell_x},$$
where $\ell_x$ are survivors to exact age $x$, $d_x$ deaths in the interval, $L_x$ person-years lived in it, $T_x$ person-years lived beyond $x$ and $e_x$ the **expected remaining years** at age $x$. For the open last group $L = \ell/m$. Life expectancy at birth $e_0$ is the average length of life of the cohort that experiences the rates $m_x$ throughout.`,
      idea: String.raw`Each column is a simple accounting of the cohort, in the order: convert rates to probabilities (2.2), peel off deaths, count person-years, then cumulate from the oldest age down. Nothing is estimated beyond the $a_x$; the table is a deterministic transformation of the rate schedule, which is why life expectancy is *period-synthetic* (see 2.7).`,
      caption: String.raw`Choose a real schedule (UN estimates, 18 age groups) or drag the blue points, which are $\log_{10} m_x$ for each age group. The table recomputes at once: watch $\ell_x$ and $d_x$ in the two small plots and $e_0$ in the readout. Raise one group's rate and see which columns change below and above it.`,
      deps: ['demo-2.2'],
      refs: ['PHG ch. 3'],
      tags: ['life table'],
      credit: 'life tables: John Graunt, 1662; Edmond Halley, 1693',
      viz(v) {
        const KEYS = [{ value: 'SWE2019', label: 'Sweden 2019' }, { value: 'MEX2019', label: 'Mexico 2019' }, { value: 'USA1950', label: 'USA 1950' }, { value: 'CHN1990', label: 'China 1990' }];
        const R = 100000, K = 18, ns = Array.from({ length: K }, (_, i) => (i === K - 1 ? Infinity : 5));
        let mm = WPP.SWE2019.m.slice();
        const s1 = v.stage({ x: [-0.6, 17.6], y: [-4.5, 0.3], axes: 'box', gutter: true, xlabel: 'age group (5-year)', ylabel: 'log₁₀ mₓ', height: 330, title: 'Drag the death rates', xticks: AGE18.map((l, i) => [i, i % 3 === 0 ? l : '']) });
        const s2 = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'ℓₓ (% of cohort alive)', height: 330, title: 'Survivors $\\ell_x$' });
        const s3 = v.stage({ x: [0, 100], y: [0, 30], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'dₓ (% of all deaths)', height: 330, title: 'Deaths $d_x$ by age group' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 600, full: true });
        const T = v.table(tb, { rows: K, cols: 8, square: false, cellAspect: 2.4, maxCell: 60, size: 13, rowLabels: AGE18, colLabels: ['$m_x$ per 1000', '$q_x$', '$\\ell_x$', '$d_x$', '$L_x$', '$T_x$', '$e_x$', '$a_x$'], cornerLabel: 'age' });
        const H = Array.from({ length: K }, (_, i) => s1.handle(i, Math.log10(mm[i]), { color: 'accent', r: 6, constrain: (x, y) => [i, clamp(y, -4.5, 0.3)] }));
        H.forEach((h, i) => { h.onDrag = () => { mm[i] = Math.pow(10, h.y); }; });
        const load = (k) => { mm = WPP[k].m.slice(); H.forEach((h, i) => h.set(i, Math.log10(mm[i]))); };
        const sel = v.select('schedule', KEYS, 'SWE2019', { onChange: () => load(sel.value) });
        let lt = null;
        v.render(() => {
          lt = lifeTable2(mm, ns, R);
          s1.path(mm.map((m, i) => [i, Math.log10(m)]), { color: 'accent', width: 1.5 });
          s2.fn((a) => (lAt(lt, a) / R) * 100, { domain: [0, 100], fill: true, color: 'accent', fillAlpha: 0.18 });
          s3.setView([0, 100], [0, Math.max(...lt.d) / R * 115]);
          lt.x.forEach((x, i) => { const w = i === K - 1 ? 15 : 5; s3.rect(x, 0, x + w - 0.4, (100 * lt.d[i]) / R, { fill: 'red', color: 'red', fillAlpha: 0.35 }); });
          const fm = (x, d) => fx(x, d);
          T.draw({
            value: (i, j) => [fm(mm[i] * 1000, mm[i] < 0.01 ? 2 : 1), lt.q[i].toFixed(4), int(lt.l[i]), int(lt.d[i]), int(lt.L[i]), int(lt.T[i]), fm(lt.e[i], 1), (i === K - 1 ? '—' : fm(lt.a[i], 1))][j],
            heat: (i, j) => (j === 2 ? lt.l[i] / R : null), cmap: 'viridis', fill: (i, j) => (j === 6 ? ['green', 0.18] : null), highlight: [[0, 6, 'green']],
          });
        });
        v.readout(() => `$e_0 = T_0/\\ell_0 = ${v.fix(lt.e[0], 2)}$ years; $\\sum d_x = ${int(sum(lt.d))}$ $=\\ell_0$; $T_0 = \\sum L_x = ${int(lt.T[0])}$; $e_{65} = ${v.fix(lt.e[13], 1)}$ (65 = row 65–69)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Life expectancy is the area under the survival curve',
      statement: String.raw`Let $T \ge 0$ be the age at death of a newborn with survival function $S(x) = P(T > x)$ and $S(0)=1$. If $E\,T < \infty$, then
$$ e_0 = E\,T = \int_0^\infty S(x)\,dx .$$
In life-table language: the mean age at death $\sum d_x\,(\text{mean age in interval})/\ell_0$ equals the person-years $T_0/\ell_0$. More generally $e_x = \frac{1}{S(x)}\int_x^\infty S(y)\,dy$.`,
      idea: String.raw`Write $T = \int_0^\infty \mathbf 1\{T > x\}\,dx$ and take expectations (Tonelli, as in the integral-of-survival identity from real analysis): $E\,T = \int_0^\infty P(T>x)\,dx$. Equivalently, integrate by parts $\int x\,f(x)\,dx$ with $f = -S'$. In the table the same statement is that $\sum L_x$ counts every person-year once, as a rectangle under $\ell_x$.`,
      caption: String.raw`The survival curve is piecewise linear through the draggable points (age 1 to 100; the curve starts at 1 and ends at 0 at age 110). The right panel is the distribution of age at death implied by the drops of the curve. Drag any point or load a schedule: the area on the left and the mean age at death on the right are always the same number, computed by two different sums.`,
      deps: ['demo-2.3', 'rca-8.16'],
      refs: ['PHG ch. 3'],
      tags: ['life expectancy', 'survival'],
      viz(v) {
        const ks = [0, 1, 5, 15, 30, 45, 60, 70, 80, 90, 100, 110];
        const K = ks.length;
        const fromSiler = (key) => { const si = siler(SILER[key]); return ks.map((a, i) => (i === K - 1 ? 0 : si.S(a))); };
        let ls = fromSiler('y1900');
        const s = v.stage({ x: [0, 110], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'survival l(x)/l(0)', height: 340, title: 'Survival curve and its area' });
        const d = v.stage({ x: [0, 110], y: [0, 0.03], axes: 'box', gutter: true, xlabel: 'age at death', ylabel: 'deaths per year of age', height: 340, title: 'Distribution of age at death' });
        const H = [];
        for (let i = 1; i < K - 1; i++) {
          const h = s.handle(ks[i], ls[i], { color: 'accent', r: 6, constrain: (x, y) => [ks[i], clamp(y, ls[i + 1], ls[i - 1])] });
          h.onDrag = () => { ls[i] = h.y; };
          H.push(h);
        }
        const sel = v.select('schedule', ERAS, 'y1900', { onChange: () => { ls = fromSiler(sel.value); H.forEach((h, k) => h.set(ks[k + 1], ls[k + 1])); } });
        let P = null;
        v.render(() => {
          P = pwl(ks, ls);
          s.fn((x) => P.val(x), { domain: [0, 110], fill: true, color: 'accent', fillAlpha: 0.2, width: 2 });
          let top = 0.005;
          for (let i = 0; i < K - 1; i++) top = Math.max(top, (ls[i] - ls[i + 1]) / (ks[i + 1] - ks[i]));
          d.setView([0, 110], [0, top * 1.25]);
          for (let i = 0; i < K - 1; i++) d.rect(ks[i], 0, ks[i + 1], (ls[i] - ls[i + 1]) / (ks[i + 1] - ks[i]), { fill: 'red', color: 'red', fillAlpha: 0.3 });
          d.vline(P.mean, { color: 'green', width: 2.5 });
          d.text('mean ' + v.fix(P.mean, 1), P.mean + 1.5, top * 1.12, { color: 'green', align: 'left' });
        });
        v.readout(() => `area under the curve $= \\int_0^{110} \\ell(x)\\,dx = ${v.fix(P.area, 3)}$ years\nmean age at death $= \\sum (\\text{drop})\\times(\\text{midpoint age}) = ${v.fix(P.mean, 3)}$ years — equal (difference ${v.fix(Math.abs(P.area - P.mean), 6)}); deaths accounted for: ${v.fix(100 * P.mass, 1)}%`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Force of mortality (hazard) μ(x)',
      statement: String.raw`For a lifetime $T$ with density $f$ and survival $S$, the **force of mortality** (hazard rate) is
$$\mu(x) = \lim_{h\downarrow 0}\frac{P(x < T \le x+h \mid T > x)}{h} = \frac{f(x)}{S(x)} = -\frac{d}{dx}\ln S(x).$$
It is an instantaneous rate of dying among those still alive at $x$. The age-specific rate $m_x$ of a life table is a weighted average of $\mu$ over the interval, and in turn the hazard is the limit of $m$ as the interval shrinks.`,
      idea: String.raw`Conditioning on survival divides the density by $S$, so the hazard is the death density *per survivor*; since $S' = -f$, this is $-(\ln S)'$. The derivative that defines it exists wherever $S$ is differentiable (2.1's rate with the width of the interval tending to zero, and the derivative from real analysis).`,
      caption: String.raw`Left: the hazard on a log scale, a curve through the draggable points (log-linear between them); load a historical schedule or draw your own. Right: the survival curve it implies, with the death density (red). Slide the age marker: the tangent to $\ln S$ has slope $-\mu$, and the survival curve falls fastest where the hazard is high *and* many are still alive.`,
      deps: ['demo-2.1', 'pma-5.1'],
      refs: ['PHG ch. 3'],
      tags: ['hazard', 'survival'],
      viz(v) {
        const xs = [0, 1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const toLog = (key) => { const si = siler(SILER[key]); return xs.map((a) => Math.log10(si.mu(a))); };
        let lg = toLog('y1900');
        const s = v.stage({ x: [-2, 104], y: [-4.8, 0.3], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'hazard μ(x), per year', height: 340, title: 'Hazard (log scale)', yticks: [-4, -3, -2, -1, 0].map((k) => [k, p10(k)]) });
        const t = v.stage({ x: [0, 105], y: [0, 1.02], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'survival S(x)', height: 340, title: 'Survival implied by the hazard' });
        const H = xs.map((a, i) => { const h = s.handle(a, lg[i], { color: 'accent', r: 6, constrain: (x, y) => [a, clamp(y, -4.6, 0.2)] }); h.onDrag = () => { lg[i] = h.y; }; return h; });
        const sel = v.select('schedule', ERAS, 'y1900', { onChange: () => { lg = toLog(sel.value); H.forEach((h, i) => h.set(xs[i], lg[i])); } });
        const ag = v.slider('age marker $x$', 0, 100, 60, { step: 0.5 });
        let info = null;
        v.render(() => {
          const hz = hazardKnots(xs, lg.map((l) => Math.pow(10, l))), S = (x) => Math.exp(-hz.H(x));
          s.fn((x) => Math.log10(hz.mu(x)), { domain: [0, 104], color: 'accent', width: 2.5 });
          s.vline(ag.value, { color: 'gold', dash: true });
          t.fn(S, { domain: [0, 105], color: 'accent', width: 2.5, fill: true, fillAlpha: 0.12 });
          const sc = 0.9 / Math.max(...Array.from({ length: 211 }, (_, i) => hz.mu(i / 2) * S(i / 2)));
          t.fn((x) => hz.mu(x) * S(x) * sc, { domain: [0, 105], color: 'red', width: 1.5, alpha: 0.8 });
          const x = ag.value, h = 0.01, Sx = S(x), slope = (Math.log(S(x + h)) - Math.log(S(x - h))) / (2 * h);
          t.dot(x, Sx, { r: 6, color: 'gold' });
          { const xa = Math.max(0, x - 12), xb = Math.min(105, x + 12); t.line(xa, Sx - hz.mu(x) * Sx * (xa - x), xb, Sx - hz.mu(x) * Sx * (xb - x), { color: 'gold', width: 2 }); }
          info = { x, mu: hz.mu(x), Sx, slope };
        });
        v.legend([['accent', 'survival S(x)'], ['red', 'death density f(x) (rescaled)'], ['gold', 'tangent at x']]);
        v.readout(() => `at $x = ${v.fix(info.x, 1)}$: $\\mu(x) = ${v.sci(info.mu, 3)}$, $S(x) = ${v.fix(info.Sx, 4)}$, and the numerical slope of $\\ln S$ is $${v.sci(info.slope, 3)}$ — equal to $-\\mu(x)$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Survival is the exponential of minus the cumulative hazard',
      statement: String.raw`If a lifetime has a continuous hazard $\mu$ on $[0,\infty)$, then its survival function is
$$S(x) = \exp\!\Big(-\int_0^x \mu(a)\,da\Big) = e^{-H(x)},$$
where $H(x)$ is the **cumulative hazard**. Conversely every non-negative integrable $\mu$ with $\int_0^\infty\mu=\infty$ defines a lifetime distribution. A life table built from one-year rates reproduces $S$ at whole ages up to the error of its $a_x$ assumption.`,
      idea: String.raw`From 2.5, $(\ln S)' = -\mu$ with $S(0) = 1$; integrate, using the fundamental theorem of calculus, and exponentiate. In the life table the same fact is the product $\ell_x/\ell_0 = \prod (1 - q_y)$: each factor is the conditional survival over a year, and the exponentials of successive hazard areas multiply because the areas add.`,
      caption: String.raw`Draw the hazard (top: handles on a linear scale) and drag the gold age marker on the survival curve. The blue area under the hazard up to $x$ is $H(x)$; the readout compares $e^{-H}$ with $\ell_x$ from a one-year life table built by $a=\tfrac12$. They agree to four digits for ordinary schedules; push the mortality multiplier up and the table's approximation starts to drift.`,
      deps: ['demo-2.5', 'pma-6.21', 'pma-8.6'],
      refs: ['PHG ch. 3'],
      tags: ['hazard', 'life table'],
      viz(v) {
        const xs = [0, 2, 10, 25, 40, 55, 65, 75, 85, 95, 105];
        const toVal = (key) => { const si = siler(SILER[key]); return xs.map((a) => clamp(si.mu(a), 0.0004, 0.5)); };
        let val = toVal('y1900');
        const s = v.stage({ x: [0, 105], y: [0, 0.5], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'hazard μ(x)', height: 330, title: 'Hazard and its cumulative area' });
        const t = v.stage({ x: [0, 105], y: [0, 1.02], axes: 'box', gutter: true, xlabel: 'age x', ylabel: 'S(x) = exp(−H(x))', height: 330, title: 'Survival' });
        const H = xs.map((a, i) => { const h = s.handle(a, val[i], { color: 'accent', r: 6, constrain: (x, y) => [a, clamp(y, 0.0004, 0.5)] }); h.onDrag = () => { val[i] = h.y; }; return h; });
        const sel = v.select('schedule', ERAS, 'y1900', { onChange: () => { val = toVal(sel.value); H.forEach((h, i) => h.set(xs[i], val[i])); } });
        const mult = v.slider('mortality multiplier', 0.3, 8, 1, { log: true, sig: 2 });
        const mk = t.handle(60, 0.5, { color: 'gold', r: 7, constrain: (x) => [clamp(Math.round(x), 1, 104), 0] });
        let info = null;
        v.render(() => {
          const hz = hazardKnots(xs, val.map((a) => a * mult.value)), mu = (x) => hz.mu(x), S = (x) => Math.exp(-hz.H(x));
          const x = Math.round(mk.x);
          mk.set(x, S(x));
          s.fn((a) => mu(a), { domain: [0, 105], color: 'accent', width: 2.5 });
          s.fn((a) => mu(a), { domain: [0, x], fill: true, color: 'accent', fillAlpha: 0.3, width: 0 });
          t.fn(S, { domain: [0, 105], color: 'accent', width: 2.5, fill: true, fillAlpha: 0.1 });
          // one-year life table: central rate m_y = d / person-years, a = 1/2, q = m/(1 + m/2), chained
          let l = 1;
          for (let y = 0; y < x; y++) { const d = S(y) - S(y + 1), PY = integ(S, y, y + 1, 8), m = d / PY; l *= 1 - m / (1 + m / 2); }
          const Hx = integ(mu, 0, x, Math.max(8, x * 8));
          info = { x, Hx, ex: Math.exp(-Hx), l, Hexact: hz.H(x), Sx: S(x) };
        });
        v.readout(() => `age $x = ${info.x}$: area under the hazard $H(x) = ${v.fix(info.Hx, 4)}$ (closed form ${v.fix(info.Hexact, 4)})\n$e^{-H(x)} = ${v.fix(info.ex, 5)}$; life table $\\ell_x/\\ell_0 = ${v.fix(info.l, 5)}$ (difference $${v.sci(Math.abs(info.ex - info.l), 2)}$)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Concept',
      name: 'Period versus cohort life expectancy',
      statement: String.raw`The **period** life expectancy for year $t$ applies the death rates of that year at every age to a synthetic cohort: $e^{\text{per}}_0(t) = \int_0^\infty \exp(-\int_0^x \mu(a, t)\,da)\,dx$. The **cohort** life expectancy of the birth year $c$ follows the real diagonal of the Lexis diagram: $e^{\text{coh}}_0(c) = \int_0^\infty \exp(-\int_0^x \mu(a, c + a)\,da)\,dx$. If mortality at each age is falling over time, then $e^{\text{coh}}_0(c) > e^{\text{per}}_0(c)$: the cohort meets the better future rates of later years. They coincide when mortality is stationary.`,
      idea: String.raw`The two integrals differ only in which cells of the Lexis surface of death rates the hazard is read from: a vertical line (one calendar year) or a diagonal (one birth cohort). With age-wise declining rates every diagonal cell is lower than the corresponding vertical cell, so survival, and hence its area (2.4), is larger. Cohort figures for recent births need forecasts of future rates, which is why agencies publish period tables.`,
      caption: String.raw`The colour map is $\log_{10}$ of the death rate by calendar year (across) and age (up), for a toy world whose rates fall exponentially, children's faster than adults'. Drag the blue handle along the bottom: the white line is the period table of that year, the dashed diagonal the cohort born then. Right: both expectancies against year; the gap is the benefit of future improvement. Set the improvement to zero and the lines merge.`,
      deps: ['demo-2.3', 'demo-1.5'],
      refs: ['PHG ch. 3'],
      tags: ['period', 'cohort'],
      scope: String.raw`Toy model: a 1900-like Siler schedule falling at rate $\rho$ per year for adults and $2.5\rho$ faster for the young, extended unchanged after 2020 (stated assumption, not a forecast).`,
      viz(v) {
        const base = siler(SILER.y1900);
        const rho = v.slider('adult improvement (% per year)', 0, 3, 0.8, { step: 0.05 });
        const s = v.stage({ x: [1900, 2110], y: [0, 110], axes: 'box', gutter: true, xlabel: 'calendar year', ylabel: 'age', height: 380, title: 'Lexis surface of log₁₀ death rates' });
        const u = v.stage({ x: [1900, 2010], y: [40, 100], axes: 'box', gutter: true, xlabel: 'year (of the period, or of birth)', ylabel: 'e₀ (years)', height: 380, title: 'Period and cohort life expectancy' });
        const mu = (a, t) => base.mu(a) * Math.exp(-(rho.value / 100) * (1 + 2.5 * Math.exp(-a / 10)) * (t - 1900));
        const eper = (t) => { let S = 1, sm = 0.5; const h = 0.5; let H = 0; for (let a = 0; a < 110; a += h) { const m0 = mu(a, t), m1 = mu(a + h, t); H += ((m0 + m1) / 2) * h; S = Math.exp(-H); sm += S; } return sm * h - 0.5 * h; };
        const ecoh = (c) => { let sm = 0.5, H = 0; const h = 0.5; for (let a = 0; a < 110; a += h) { H += ((mu(a, c + a) + mu(a + h, c + a + h)) / 2) * h; sm += Math.exp(-H); } return sm * h - 0.5 * h; };
        const cs = Array.from({ length: 56 }, (_, i) => 1900 + 2 * i);
        let P = [], C = [], key = 0;
        const mk = s.handle(1960, 3, { color: 'accent', r: 8, constrain: (x) => [clamp(x, 1900, 2010), 3] });
        v.render(() => {
          key = Math.round(rho.value * 100);
          P = cs.map(eper); C = cs.map(ecoh);
          s.heat((t, a) => Math.log10(mu(a, t)), { range: [-5, 0], cmap: 'magma', res: 4, key: 'h' + key });
          const c = mk.x;
          s.line(c, 0, c, 110, { color: 'ink', width: 2.5 });
          s.line(c, 0, c + 110, 110, { color: 'ink', width: 2.5, dash: true });
          u.path(cs.map((t, i) => [t, P[i]]), { color: 'orange', width: 2.5 });
          u.path(cs.map((t, i) => [t, C[i]]), { color: 'green', width: 2.5 });
          u.vline(c, { color: 'muted', dash: true });
        });
        v.legend([['orange', 'period e₀(t)'], ['green', 'cohort e₀(c)']]);
        v.readout(() => `year $${Math.round(mk.x)}$: period $e_0 = ${v.fix(eper(mk.x), 1)}$ years; cohort born then $e_0 = ${v.fix(ecoh(mk.x), 1)}$ years; gap $${v.fix(ecoh(mk.x) - eper(mk.x), 1)}$ years`);
      },
    },
  ],
};

/** Abridged life table (see ch02.shared.js lifeTable) with a_x = 1 for 0–4 and n/2 elsewhere. */
function lifeTable2(m, ns, radix) {
  const K = m.length, a = ns.map((n, i) => (i === 0 ? 1 : n / 2));
  const x = [0], l = [radix], q = [], d = [], L = [], T = new Array(K), e = new Array(K);
  for (let i = 0; i < K; i++) {
    const open = !isFinite(ns[i]);
    q[i] = open ? 1 : Math.min(1, (ns[i] * m[i]) / (1 + (ns[i] - a[i]) * m[i]));
    d[i] = l[i] * q[i];
    L[i] = open ? l[i] / m[i] : ns[i] * (l[i] - d[i]) + a[i] * d[i];
    if (i < K - 1) { l[i + 1] = l[i] - d[i]; x[i + 1] = x[i] + ns[i]; }
  }
  let t = 0; for (let i = K - 1; i >= 0; i--) { t += L[i]; T[i] = t; e[i] = T[i] / l[i]; }
  return { x, n: ns, a, m, q, l, d, L, T, e, e0: e[0] };
}
