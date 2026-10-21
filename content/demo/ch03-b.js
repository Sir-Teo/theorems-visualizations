// Demography — Chapter 3: Patterns of mortality (part b: 3.8–3.14)
import { sum, clamp, fx, int, CTRY, CNAME, LC_CTRY, LTY, SEXY, AGE22, NS22, MID22, mxOf, lxOf, lxSex, LxSex, e0Of2, lifeStats, areaTo100, arriaga, hazardsFromL, gompFit, line, leeCarter, drift, lt22, siler, SILER, e0Of, OMEGA, PRESTON, CAUSEDATA } from './ch03.shared.js';

const cOpts = (list) => list.map((c) => ({ value: c, label: CNAME[c] }));
const yFmt = (i) => String(LTY[Math.round(i)]);

export default {
  collection: 'demo',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Rectangularization of the survival curve',
      statement: String.raw`As mortality has fallen, the survival curve $\ell(x)$ of a population has become more **rectangular**: it stays near 1 to later ages and then drops more steeply. Deaths have shifted out of childhood and early adulthood into a peak at old ages (the **modal age at death**), which has risen, while the dispersion of ages at death, whether measured by the interquartile range or by the standard deviation of lifespans beyond a young age, has fallen. The phenomenon concerns the shape of the survival curve over the observed period; whether it will continue, or whether the rise of the mode now matters more than the compression of ages around it, is debated.`,
      idea: String.raw`Life expectancy is the area under the survival curve (2.4); a rise in it can come from lifting the curve at young ages, which squares it, or from shifting the whole old-age portion to the right, which changes its location but not its shape. Historically the first dominated, as infant and child mortality fell; later the modal age itself moved. The measures used here (mode, interquartile range, a standard deviation after age 10) separate the two effects, as in analyses of the variability of age at death.`,
      caption: String.raw`Pick a country and two years of UN estimates. Left: survivorship for every table in that country (faint) with your two years highlighted. Right: the density of deaths per year of age from age 1, as a histogram of the abridged table. Slide the comparison year back to 1950: deaths pile up at older ages in a narrower band. The readout gives the numbers (modal age from a parabola through the top three age groups).`,
      deps: ['demo-2.4'],
      refs: ['PHG ch. 3'],
      tags: ['survival curve', 'lifespan variation'],
      scope: String.raw`Computed from UN abridged life tables with five-year age groups, so the mode and spread are coarse (a few tenths of a year at best); ages 85 and over rest on smoothed extrapolations. Both sexes combined.`,
      links: { doi: 'https://doi.org/10.2307/2648085' },
      viz(v) {
        const co = v.select('country', cOpts(CTRY), 'JPN');
        const cur = v.slider('year', 0, LTY.length - 1, LTY.length - 1, { int: true, fmt: yFmt });
        const ref = v.slider('compare with', 0, LTY.length - 1, 0, { int: true, fmt: yFmt });
        const s = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'survivors / births', height: 360, title: 'Survival curves' });
        const t = v.stage({ x: [1, 100], y: [0, 0.1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'deaths per year of age', height: 360, title: 'Where deaths fall' });
        let R = null;
        const knots = (l) => AGE22.slice(0, 21).map((a, i) => [a, l[i] / l[0]]).concat([[100, l[20] / l[0] * 0 + l[21] / l[0]]]);
        const hist = (st) => { const pts = [[1, 0]]; for (let i = 1; i < 21; i++) { pts.push([AGE22[i], st.d[i]]); pts.push([AGE22[i] + NS22[i], st.d[i]]); } pts.push([100, 0]); return pts; };
        v.render(() => {
          const c = co.value, a = LTY[cur.value], b = LTY[ref.value];
          LTY.forEach((y, j) => { if (y !== a && y !== b) s.path(knots(lxOf(c, y)), { color: v.ramp(j / (LTY.length - 1), 'accent', 'panel'), width: 1, alpha: 0.5 }); });
          const lc = lxOf(c, a), lr = lxOf(c, b), sc = lifeStats(lc), sr = lifeStats(lr);
          s.path(knots(lr), { color: 'orange', width: 2.8 });
          s.path(knots(lc), { color: 'accent', width: 2.8 });
          s.vline(sr.mode, { color: 'orange', dash: true, alpha: 0.6 }); s.vline(sc.mode, { color: 'accent', dash: true, alpha: 0.6 });
          const top = Math.max(...sc.d.slice(1, 21), ...sr.d.slice(1, 21));
          t.setView([1, 100], [0, top * 1.25]);
          t.poly(hist(sr), { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 2 });
          t.poly(hist(sc), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          t.vline(sr.mode, { color: 'orange', dash: true }); t.vline(sc.mode, { color: 'accent', dash: true });
          R = { a, b, sc, sr, e0c: e0Of2(c, 'b')[a - 1950], e0r: e0Of2(c, 'b')[b - 1950] };
        });
        v.legend([['accent', 'year shown'], ['orange', 'comparison year'], ['accent', 'other tables', { dash: true }]]);
        v.readout(() => { const f = (x) => v.fix(x, 1); return `${CNAME[co.value]} ${R.b} → ${R.a}: $e_0$ ${f(R.e0r)} → ${f(R.e0c)}; modal age at death ${f(R.sr.mode)} → ${f(R.sc.mode)}\nSD of age at death above 10: ${f(R.sr.sd)} → ${f(R.sc.sd)}; interquartile range ${f(R.sr.q3 - R.sr.q1)} → ${f(R.sc.q3 - R.sc.q1)} (quartiles ${f(R.sc.q1)}, ${f(R.sc.q3)}); median age at death ${f(R.sr.med)} → ${f(R.sc.med)}`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Hypothesis',
      name: 'Compression of morbidity (contested)',
      statement: String.raw`When life expectancy rises, does the time spent in poor health shrink, grow, or stay the same? Fries (1980) proposed **compression of morbidity**: if the onset of chronic illness is postponed faster than death, and the lifespan has a limit, the unhealthy period before death is squeezed into fewer years. The opposite view (Gruenberg's "failures of success") expects **expansion**, as medicine keeps the sick alive longer, and Manton's **dynamic equilibrium** expects the extra years to be split, with disease more prevalent but milder. With a prevalence schedule $p(x)$ of poor health, the Sullivan decomposition gives $e_0=\int S(x)\,dx = \text{healthy years}+\text{unhealthy years}$ with $\text{unhealthy years}=\int S(x)p(x)\,dx$. The hypothesis is about how $p(x)$ moves as $S(x)$ does, and the empirical evidence is **mixed**.`,
      idea: String.raw`The Sullivan method of 2.12 turns any survival curve and prevalence schedule into healthy and unhealthy expected years; the hypotheses differ only in how the onset age of poor health moves when mortality falls (and the survival curve squares, 3.8). This picture uses a stylized logistic prevalence schedule and a delay of senescent mortality; it is a scenario generator, not a forecast, and it shows that the same gain in life expectancy is consistent with all three outcomes.`,
      caption: String.raw`Slide the delay of ageing: the senescent hazard of a 1950-type schedule is postponed by that many years, raising $e_0$ and squaring the curve. Then choose how far the onset of poor health moves per year of life expectancy gained (the onset slider), or pick a scenario. Red area: unhealthy years; green: healthy years. The bars compare the baseline (the 1950-type schedule itself) with the scenario.`,
      deps: ['demo-2.12', 'demo-3.8'],
      refs: ['PHG ch. 4'],
      tags: ['morbidity', 'healthy life expectancy', 'scenarios'],
      scope: String.raw`Scenario picture only: the mortality schedule is the illustrative Siler schedule of chapter 2, the prevalence of poor health is an assumed logistic curve (midpoint 68, width 7 at baseline), and no observed healthy-life-expectancy trends are drawn.`,
      credit: 'James F. Fries, 1980 (compression); Gruenberg, 1977 (expansion); Manton, 1982 (dynamic equilibrium)',
      links: { doi: 'https://doi.org/10.1056/NEJM198007173030304' },
      viz(v) {
        const P0 = SILER.y1950, X0 = 68, W = 7, sgn = (x) => (x >= 0 ? '+' : '') + v.fix(x, 1);
        const sh = v.slider('delay of ageing (years)', 0, 40, 20, { step: 1 });
        const th = v.slider('onset postponed per year of $e_0$ gained', 0, 3, 1, { step: 0.01 });
        let preset = null;
        const FAC = { exp: 0.5, eq: 1, comp: 1.3 };
        preset = v.select('scenario', [{ value: 'exp', label: 'expansion' }, { value: 'eq', label: 'unhealthy years constant' }, { value: 'comp', label: 'compression' }, { value: 'cus', label: 'custom' }], 'comp');
        th.onChange = () => { if (!applying) preset.value = 'cus'; };
        let applying = false;
        const s = v.stage({ x: [0, 110], y: [0, 1], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'survival $S(x)$', height: 360, title: 'Healthy and unhealthy years' });
        const b = v.stage({ x: [0, 3], y: [0, 100], axes: 'box', gutter: true, xlabel: '', ylabel: 'expected years', height: 360, title: 'Baseline and scenario', xticks: [[1, 'baseline'], [2, 'scenario']] });
        const sur = (d) => siler({ ...P0, a3: P0.a3 * Math.exp(-P0.b3 * d) });
        const prev = (x, xo) => 1 / (1 + Math.exp(-(x - xo) / W));
        const years = (d, theta, e0b) => {
          const S = sur(d).S, e0 = e0Of(S), xo = X0 + theta * (e0 - e0b);
          const U = (() => { let t = 0; const n = 440, h = OMEGA / n; for (let i = 0; i <= n; i++) { const x = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; t += w * S(x) * prev(x, xo); } return (t * h) / 3; })();
          return { e0, U, H: e0 - U, xo, S };
        };
        let R = null, eqCache = {};
        const thetaEq = (d) => {
          if (eqCache[d]) return eqCache[d];
          const e0b = e0Of(sur(0).S), U0 = years(0, 0, e0b).U; let lo = 0, hi = 6;
          for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (years(d, m, e0b).U > U0) lo = m; else hi = m; }
          return (eqCache[d] = (lo + hi) / 2);
        };
        v.render(() => {
          if (preset.value !== 'cus') { applying = true; th.set(Math.round(clamp(FAC[preset.value] * thetaEq(sh.value), 0, 3) * 100) / 100); applying = false; }
          const e0b = e0Of(sur(0).S), base = years(0, 0, e0b), now = years(sh.value, th.value, e0b);
          s.fn(base.S, { domain: [0, 110], color: 'muted', dash: true, width: 2 });
          s.between(() => 0, (x) => now.S(x) * (1 - prev(x, now.xo)), 0, 110, { fill: 'green', fillAlpha: 0.35 });
          s.between((x) => now.S(x) * (1 - prev(x, now.xo)), now.S, 0, 110, { fill: 'red', fillAlpha: 0.4 });
          s.fn(now.S, { domain: [0, 110], color: 'accent', width: 3 });
          s.vline(now.xo, { color: 'orange', dash: true });
          const stack = (x0, x1, st) => { b.rect(x0, 0, x1, st.H, { fill: 'green', fillAlpha: 0.5, color: 'green' }); b.rect(x0, st.H, x1, st.e0, { fill: 'red', fillAlpha: 0.55, color: 'red' }); };
          b.setView([0, 3], [0, Math.max(100, now.e0 * 1.1)]);
          stack(0.6, 1.4, base); stack(1.6, 2.4, now);
          R = { base, now };
        });
        v.legend([['green', 'healthy years'], ['red', 'unhealthy years'], ['muted', 'baseline survival', { dash: true }], ['orange', 'onset of poor health', { dash: true }]]);
        v.readout(() => { const { base, now } = R, f = (x) => v.fix(x, 1); return `$e_0$ ${f(base.e0)} → ${f(now.e0)} (+${f(now.e0 - base.e0)}); healthy years ${f(base.H)} → ${f(now.H)} (${sgn(now.H - base.H)}); unhealthy years ${f(base.U)} → ${f(now.U)} (${sgn(now.U - base.U)})\nonset of poor health (midpoint) ${f(X0)} → ${f(now.xo)}; share of life unhealthy ${f(100 * base.U / base.e0)}% → ${f(100 * now.U / now.e0)}%`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'The Preston curve',
      statement: String.raw`Plot life expectancy at birth against income per person for the countries of a given year: the points lie near a **concave curve**, rising steeply at low incomes and flattening above a few tens of thousands of dollars. Preston (1975) showed that the curve for later years lies above that for earlier years, so a country at a given income lives longer now than at the same income decades ago: the gain in life expectancy over time cannot be attributed to rising incomes alone, and he argued that diffusion of knowledge and public-health technology shifted the curve. A cross-section is not a causal law: the association also reflects health raising income, and shared causes.`,
      idea: String.raw`The curve is concave because the extra years bought by an additional dollar fall with income. Life expectancy is a summary of the survival curve (2.4), so a shift in the curve at fixed income reflects a lower mortality schedule for the same resources. Fitting a smooth saturating curve to each year (here constant + log income + a term in 1/income) lets one read off the vertical distance between years, which is the part of the gain not "explained by" income.`,
      caption: String.raw`Dots are countries (area grows with population): amber 1930, teal 1960, blue 2022; toggle years on and off. The curves are least-squares curves of the form $c_0 + c_1\log_{10} g + c_2/g$ (log income plus a saturation term), drawn over the range of each year's data. Drag the vertical line to an income and read the three curves' life expectancy there; hover to identify a country.`,
      deps: ['demo-2.4'],
      refs: ['PHG ch. 3'],
      tags: ['income', 'life expectancy', 'cross-section'],
      scope: String.raw`Data from Our World in Data (life expectancy: HMD, Zijdeman et al., UN WPP; GDP per person: Maddison Project Database 2023, in international dollars of 2011), for 34, 148 and 165 countries in 1930, 1960 and 2022. The 1930 sample is small and mostly rich. A descriptive cross-section, not a causal estimate.`,
      credit: 'Samuel H. Preston, 1975',
      links: { doi: 'https://doi.org/10.1080/00324728.1975.10410201' },
      viz(v) {
        const YR = [{ y: '1930', c: 'gold' }, { y: '1960', c: 'teal' }, { y: '2022', c: 'accent' }];
        const tg = YR.map((o) => v.toggle(o.y, true));
        const s = v.stage({ x: [500, 150000], y: [20, 90], xlog: true, axes: 'box', gutter: true, xlabel: 'GDP per person (international $, 2011 prices)', ylabel: 'life expectancy at birth', height: 420, title: 'Life expectancy and income', hover: true });
        const h = s.handle(8000, 25, { color: 'ink', r: 6, constrain: 'x', label: 'income' });
        const fits = YR.map((o) => {
          const pts = PRESTON[o.y], X = pts.map((r) => [1, Math.log10(r[1]), 1000 / r[1]]), Yv = pts.map((r) => r[2]);
          const b = v.M.lstsq(X, Yv), pred = (g) => b[0] + b[1] * Math.log10(g) + b[2] * (1000 / g);
          const res = pts.map((r) => r[2] - pred(r[1])), sd = Math.sqrt(sum(res.map((e) => e * e)) / (pts.length - 3));
          const gs = pts.map((r) => r[1]);
          return { pts, pred, sd, n: pts.length, lo: Math.min(...gs), hi: Math.max(...gs) };
        });
        let R = null;
        v.render(() => {
          let near = null, nd = 14;
          YR.forEach((o, k) => {
            if (!tg[k].value) return;
            const f = fits[k];
            s.fn(f.pred, { domain: [f.lo, f.hi], color: o.c, width: 3 });
            for (const r of f.pts) {
              const rad = clamp(2.2 + 0.32 * Math.sqrt(r[3]), 2.5, 11);
              s.dot(r[1], r[2], { r: rad, color: o.c, alpha: 0.55 });
              if (s.pointer && s.pointer.inside) { const d = Math.hypot(s.X(r[1]) - s.X(s.pointer.x), s.Y(r[2]) - s.Y(s.pointer.y)); if (d < Math.max(nd, rad + 3)) { nd = d; near = { r, o }; } }
            }
          });
          s.vline(h.x, { color: 'ink', dash: true, alpha: 0.6 });
          if (near) { s.dot(near.r[1], near.r[2], { r: 8, hollow: true, color: 'ink' }); s.text(`${near.r[0]} ${near.o.y}: ${near.r[2]} years, $${int(near.r[1])}`, near.r[1], near.r[2], { dy: -14, align: 'center', size: 12, color: 'ink' }); }
          h.set(clamp(h.x, 600, 140000), 25);
          R = { x: h.x, vals: YR.map((o, k) => fits[k].pred(h.x)), near };
        });
        v.legend(YR.map((o) => [o.c, o.y]));
        v.readout(() => `at \\$${int(R.x)} per person the fitted curves give: ${YR.map((o, k) => `${o.y}: ${v.fix(R.vals[k], 1)} years`).join(', ')}; 1930 → 2022 shift at this income: ${v.fix(R.vals[2] - R.vals[0], 1)} years\nspread of countries around each curve (residual SD): ${YR.map((o, k) => `${o.y}: ${v.fix(fits[k].sd, 1)} years (n = ${fits[k].n})`).join(', ')}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Epidemiological transition (Omran)',
      statement: String.raw`Omran (1971) described the shift in the pattern of death that accompanies modernization in three stages: an **age of pestilence and famine** (high, fluctuating mortality dominated by infections and malnutrition, life expectancy 20 to 40), an **age of receding pandemics** (infectious mortality falls, life expectancy rises steadily) and an **age of degenerative and man-made diseases** (chronic conditions such as cardiovascular disease and cancer dominate, life expectancy beyond 50 and rising). Across countries, as life expectancy rises, the share of deaths from infectious and early-life causes falls and the shares of circulatory disease and cancer rise. Later authors have added stages (a delayed-degenerative stage, re-emerging infections); the transition is a descriptive framework with exceptions, not a law.`,
      idea: String.raw`Mortality falls fastest at young ages, where infections kill, so the composition of the remaining deaths moves to old ages and chronic causes (the shapes of 3.8 and 2.10). The cause shares are therefore as much a consequence of the age structure of deaths as of epidemiology. The picture uses WHO cause-of-death shares since 1950 for ten countries, so it shows the second and third stages, not the first.`,
      caption: String.raw`Left: the shares of deaths by group of causes for the country you pick, with the year marked. Right: each country's path in the plane of life expectancy and the share of deaths from infectious and early-life causes (a falling curve for every country), with your country in colour and your year as the marker. Watch the ill-defined share, which is large early on, and the shares shifting from infectious to circulatory and cancer.`,
      deps: ['demo-3.10', 'demo-2.10'],
      refs: ['PHG ch. 4'],
      tags: ['causes of death', 'transition'],
      scope: String.raw`Cause-of-death shares come from the WHO Mortality Database as compiled by Our World in Data, grouped here as infectious (infectious and parasitic, respiratory infections, maternal, perinatal, nutritional), cancer, circulatory, injuries, ill-defined, and everything else. Coding revisions, ill-defined deaths in early years and differences in certification make comparisons across countries and years approximate. Life expectancy is the Our World in Data series.`,
      credit: 'Abdel R. Omran, 1971',
      links: { doi: 'https://doi.org/10.2307/3349375' },
      viz(v) {
        const CC = Object.keys(CAUSEDATA), NM = { Japan: 'Japan', Chile: 'Chile', Mexico: 'Mexico', Colombia: 'Colombia', Italy: 'Italy', Sweden: 'Sweden', 'United Kingdom': 'UK', 'United States': 'USA', Spain: 'Spain', Portugal: 'Portugal' };
        const co = v.select('country', CC.map((c) => ({ value: c, label: NM[c] })), 'Japan');
        const yr = v.slider('year', 1950, 2023, 1960, { int: true });
        const GR = [['inf', 'Infectious & early-life', 'orange', 0], ['cvd', 'Circulatory', 'accent', 2], ['can', 'Cancer', 'purple', 1], ['inj', 'Injuries', 'gold', 3], ['oth', 'Everything else', 'teal', 5], ['ill', 'Ill-defined', 'faint', 4]];
        const s = v.stage({ x: [1950, 2023], y: [0, 100], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'share of deaths (%)', height: 380, title: 'Causes of death' });
        const t = v.stage({ x: [45, 86], y: [0, 60], axes: 'box', gutter: true, xlabel: 'life expectancy at birth', ylabel: 'infectious & early-life share (%)', height: 380, title: 'Every country follows the same path' });
        let R = null;
        v.render(() => {
          const D = CAUSEDATA[co.value], n = D.ys.length;
          const cum = D.g.map((g) => { let a = 0; return GR.map((q) => (a += g[q[3]] / 10)); });
          GR.forEach((q, k) => {
            const top = D.ys.map((y, i) => [y, cum[i][k]]), bot = D.ys.map((y, i) => [y, k ? cum[i][k - 1] : 0]).reverse();
            s.poly(top.concat(bot), { fill: q[2], fillAlpha: 0.7, color: q[2], width: 1 });
          });
          const j = clamp(yr.value - D.y0, 0, n - 1), jj = D.ys.reduce((b, y, i) => (Math.abs(y - yr.value) < Math.abs(D.ys[b] - yr.value) ? i : b), 0);
          s.vline(D.ys[jj], { color: 'ink', dash: true, width: 1.5 });
          for (const c of CC) { const d = CAUSEDATA[c]; t.path(d.ys.map((y, i) => [d.e[i], d.g[i][0] / 10]), { color: c === co.value ? 'accent' : 'muted', width: c === co.value ? 3 : 1.2, alpha: c === co.value ? 1 : 0.5 }); }
          t.dot(D.e[jj], D.g[jj][0] / 10, { r: 6, color: 'gold', label: String(D.ys[jj]), labelPos: 'ne' });
          R = { y: D.ys[jj], e: D.e[jj], g: D.g[jj].map((x) => x / 10), first: D.ys[0], last: D.ys[n - 1], e1: D.e[0], e2: D.e[n - 1], g1: D.g[0][0] / 10, g2: D.g[n - 1][0] / 10 };
        });
        v.legend(GR.map((q) => [q[2], q[1], { area: true }]));
        v.readout(() => `${NM[co.value]} ${R.y}: life expectancy ${v.fix(R.e, 1)}; shares: ${GR.map((q) => `${q[1].toLowerCase()} ${v.fix(R.g[q[3]], 1)}%`).join(', ')}\n${R.first} → ${R.last}: life expectancy ${v.fix(R.e1, 1)} → ${v.fix(R.e2, 1)}, infectious & early-life share ${v.fix(R.g1, 1)}% → ${v.fix(R.g2, 1)}%`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Phenomenon',
      name: 'The sex gap in life expectancy',
      statement: String.raw`Women live longer than men in nearly every population today, by roughly 3 to 8 years in the countries shown here, but the size of the gap has changed. In many high-income countries it widened through the middle of the twentieth century, as male mortality from cardiovascular disease and smoking-related causes rose, and has narrowed since the 1980s or 1990s; other countries (for example Russia in the 1990s) show very large gaps from male adult mortality. The difference in life expectancy at birth can be split exactly into contributions of age groups (the Arriaga decomposition), which shows where in life the gap arises.`,
      idea: String.raw`Life expectancy is an area under the survival curve (2.4), so the difference between two tables is the area between their curves; the Arriaga method assigns each age group its direct effect (a different number of years lived in the group) plus an indirect effect (the different number of people reaching older ages and living there). The contributions of all groups sum to the gap exactly. Which causes drive the contributions needs cause-specific data; research attributes much of the widening and later narrowing to differences in smoking between men and women (see for example analyses of Canada and Austria by Trovato, 2005, and the summary at Our World in Data), but the decomposition here is by age only.`,
      caption: String.raw`Left: female and male life expectancy at birth for the country you pick, with the gap shaded. Choose a year of the decomposition; right: the contribution of each age group to the gap, in years of life expectancy (positive bars favour women). Compare Russia 1990 with Sweden 2023, or Japan 1950 with Japan 2023. The readout checks that the contributions add up to the gap.`,
      deps: ['demo-2.3'],
      refs: ['PHG ch. 3'],
      tags: ['sex differences', 'decomposition'],
      scope: String.raw`UN WPP 2024 estimates, 1950–2023, ten countries; the decomposition uses the UN abridged tables of selected years (1950, 1970, 1990, 2010, 2023) with the usual Arriaga formulas. It describes age patterns, not causes. Values for countries with weak vital statistics (India, Nigeria) are model-based estimates.`,
      links: { doi: 'https://doi.org/10.2307/2061029' },
      viz(v) {
        const co = v.select('country', cOpts(CTRY), 'RUS');
        const yr = v.select('decomposition year', SEXY.map((y) => ({ value: String(y), label: String(y) })), '1990');
        const s = v.stage({ x: [1950, 2023], y: [30, 90], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'life expectancy at birth', height: 360, title: 'Women and men' });
        const t = v.stage({ x: [-0.7, 21.7], y: [-1, 2], axes: 'box', gutter: true, xlabel: 'age group (start age)', ylabel: 'contribution to the gap (years)', height: 360, title: 'Where the gap comes from',
          xticks: AGE22.map((a, i) => (i % 2 === 0 ? [i, String(a)] : [i, ''])) });
        let R = null;
        v.render(() => {
          const c = co.value, y = +yr.value, ef = e0Of2(c, 'f'), em = e0Of2(c, 'm');
          const Y = (e) => e.map((x, i) => [1950 + i, x]);
          s.between((x) => em[Math.round(clamp(x, 1950, 2023)) - 1950], (x) => ef[Math.round(clamp(x, 1950, 2023)) - 1950], 1950, 2023, { fill: 'orange', fillAlpha: 0.18 });
          s.path(Y(ef), { color: 'orange', width: 2.8 }); s.path(Y(em), { color: 'accent', width: 2.8 });
          s.vline(y, { color: 'ink', dash: true });
          const ar = arriaga(lxSex(c, 'm', y), LxSex(c, 'm', y), lxSex(c, 'f', y), LxSex(c, 'f', y));
          const mx = Math.max(1, ...ar.map(Math.abs)) * 1.2;
          t.setView([-0.7, 21.7], [-mx, mx]);
          ar.forEach((a, i) => t.rect(i - 0.4, 0, i + 0.4, a, { fill: a >= 0 ? 'orange' : 'accent', fillAlpha: 0.6, color: a >= 0 ? 'orange' : 'accent' }));
          t.hline(0, { color: 'muted' });
          const grp = [[0, 3, 'under 15'], [3, 13, '15–64'], [13, 22, '65 and over']].map(([i0, i1, nm]) => [nm, sum(ar.slice(i0, i1))]);
          const gap = ef[y - 1950] - em[y - 1950];
          R = { y, gap, tot: sum(ar), grp, g50: ef[0] - em[0], g23: ef[73] - em[73], max: Math.max(...ef.map((e, i) => e - em[i])) };
        });
        v.legend([['orange', 'women'], ['accent', 'men']]);
        v.readout(() => `${CNAME[co.value]}: gap ${v.fix(R.g50, 1)} (1950) → ${v.fix(R.g23, 1)} years (2023), largest ${v.fix(R.max, 1)}\n${R.y}: gap ${v.fix(R.gap, 2)}; age-group contributions add to ${v.fix(R.tot, 2)}; by age: ${R.grp.map(([n, x]) => `${n} ${v.fix(x, 2)}`).join(', ')}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'The Function Expressive of the Law of Human Mortality',
      paper: { authors: 'Benjamin Gompertz', year: 1825, title: 'On the Nature of the Function Expressive of the Law of Human Mortality, and on a New Mode of Determining the Value of Life Contingencies', venue: 'Philosophical Transactions of the Royal Society of London 115: 513–583', doi: '10.1098/rstl.1825.0026' },
      introduces: ['demo-3.1'],
      statement: String.raw`Gompertz (1825) worked from the life tables of his day, among them those for Northampton and Carlisle, and argued that, over the adult ages, the force of mortality is well described by a function that grows in geometrical progression: equal increments of age multiply the death rate by the same factor. In modern notation, $\mu(x)=Bc^{x}$ with $c>1$; from this he derived the survivorship function and proposed how to value life contingencies (annuities and insurances) from a table's two constants instead of its full list of numbers. The paper does not claim the law holds at childhood or at all ages.`,
      idea: String.raw`Before the paper, tables were lists of numbers and annuity values were computed age by age. Gompertz noticed that, beyond the early years, the numbers of living at successive ages decline in a pattern consistent with a hazard that is a geometric progression, which let a whole table be summarized by two constants (the level $B$ and the factor $c$) and made calculations of contingencies tractable. The law is the Gompertz law (3.1); the idea of a **force of mortality** as a function of age is the hazard of 2.5. Makeham later added the constant term (3.2).`,
      caption: String.raw`A reconstruction with modern UN tables, not Gompertz's data. Left: the ratio of the death rate in each 5-year age group to the one before; a geometric progression means this ratio is constant (the line is $c^5$ from the fit). Right: the slope $\alpha=\ln c$ and the death rate at age 60 for every country and year of the UN tables used here (colour: year); the level of mortality changes more than tenfold while the slope changes much less, but the two are linked: lower mortality goes with a steeper slope. Pick a country and year.`,
      deps: ['demo-2.3', 'demo-2.5'],
      refs: [],
      tags: ['history', 'hazard', 'life contingencies'],
      scope: String.raw`The original Northampton and Carlisle tables and the paper's own figures are not reproduced; all numbers shown come from UN WPP 2024 abridged life tables (both sexes), with hazards computed from survivors as $-\ln(\ell_{x+5}/\ell_x)/5$.`,
      credit: 'Benjamin Gompertz, 1825',
      viz(v) {
        const co = v.select('country', cOpts(CTRY), 'SWE');
        const yi = v.slider('year', 0, LTY.length - 1, LTY.length - 1, { int: true, fmt: yFmt });
        const s = v.stage({ x: [30, 100], y: [1, 2.2], axes: 'box', gutter: true, xlabel: 'age', ylabel: 'ratio of successive death rates', height: 360, title: 'Is the progression geometric?' });
        const t = v.stage({ x: [0.05, 0.13], y: [3e-3, 1e-1], ylog: true, axes: 'box', gutter: true, xlabel: 'slope $\\alpha$ of $\\ln\\mu$ (per year)', ylabel: 'death rate at age 60', height: 360, title: 'Level versus slope, all tables' });
        const ALL = []; const info = (c, j) => { const h = hazardsFromL(lxOf(c, LTY[j]), 40, 90), g = gompFit(h); return { c, j, alpha: g.alpha, mu60: g.B * Math.exp(g.alpha * 60) }; };
        for (const c of CTRY) for (let j = 0; j < LTY.length; j++) ALL.push(info(c, j));
        let R = null;
        v.render(() => {
          const c = co.value, j = yi.value, hz = hazardsFromL(lxOf(c, LTY[j]), 30, 95);
          const g = gompFit(hz.filter((p) => p.x >= 40 && p.x <= 92.5)), c5 = Math.exp(5 * g.alpha);
          const rat = []; for (let i = 1; i < hz.length; i++) rat.push([hz[i].x, hz[i].mu / hz[i - 1].mu]);
          s.hline(1, { color: 'faint' });
          s.hline(c5, { color: 'orange', width: 2.8 });
          s.path(rat, { color: 'accent', width: 2 }); s.dots(rat, { r: 4, color: 'accent' });
          for (const a of ALL) t.dot(a.alpha, a.mu60, { r: 3, color: v.ramp(a.j / (LTY.length - 1), 'accent', 'panel'), alpha: a.c === c ? 0.15 : 0.55 });
          for (const a of ALL) if (a.c === c) t.dot(a.alpha, a.mu60, { r: a.j === j ? 7 : 3.5, color: a.j === j ? 'gold' : 'ink' });
          const al = ALL.map((a) => a.alpha), mu = ALL.map((a) => a.mu60);
          R = { g, c5, rat, amin: Math.min(...al), amax: Math.max(...al), mmin: Math.min(...mu), mmax: Math.max(...mu), cs: rat.filter((r) => r[0] >= 42 && r[0] <= 88).map((r) => r[1]) };
        });
        v.legend([['accent', 'successive ratios'], ['orange', '$c^5$ (fit)'], ['ink', 'this country, all years', { dot: true }], ['gold', 'chosen year', { dot: true }]]);
        v.readout(() => `${CNAME[co.value]} ${LTY[yi.value]}: fitted $\\alpha=${v.fix(R.g.alpha, 4)}$, $c=e^\\alpha=${v.fix(Math.exp(R.g.alpha), 4)}$, $c^5=${v.fix(R.c5, 3)}$; ratios between ages 42 and 88 range ${v.fix(Math.min(...R.cs), 2)}–${v.fix(Math.max(...R.cs), 2)}\nacross all ${ALL.length} tables: slope $\\alpha$ from ${v.fix(R.amin, 3)} to ${v.fix(R.amax, 3)} (doubling time ${v.fix(Math.log(2) / R.amax, 1)}–${v.fix(Math.log(2) / R.amin, 1)} years); death rate at 60 from ${v.fix(1000 * R.mmin, 1)} to ${v.fix(1000 * R.mmax, 1)} per 1000`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'Modeling and Forecasting U.S. Mortality',
      paper: { authors: 'Ronald D. Lee and Lawrence R. Carter', year: 1992, title: 'Modeling and Forecasting U.S. Mortality', venue: 'Journal of the American Statistical Association 87 (419): 659–671', doi: '10.1080/01621459.1992.10475265' },
      introduces: ['demo-3.6'],
      statement: String.raw`Lee and Carter (1992) modelled the matrix of U.S. age-specific death rates with a single time-varying index, $\ln m_{x,t}=a_x+b_xk_t+\varepsilon_{x,t}$, fitted by singular value decomposition, and forecast the index $k_t$ as a random walk with drift, with confidence intervals. In their abstract they report a central forecast of life expectancy at birth (sexes combined) of 86.05 years in 2065, a rise of 10.5 years, with a confidence band of $+3.9$ and $-5.6$ years that includes uncertainty about the trend. The paper's forecast starts from data to the late 1980s; its appeal was that a one-factor model fits nicely, forecasts in a few lines and gives probabilistic statements.`,
      idea: String.raw`Earlier forecasts had extrapolated life expectancy or projected rates age by age without a probability model. The paper reduced the problem to a single time series, $k_t$, whose steady decline made a random walk with drift adequate, and then mapped each projected index through the life table (2.3, 2.4) to life expectancy; because the decomposition of 3.6 is parsimonious, the intervals were easy to compute. Critics (for example a published comment by McNown) noted irregularities in the projected age profiles, and the method has since been extended widely. In the reconstruction, independent yearly innovations with common finite variance $\sigma^2$ give horizon variance $h\sigma^2$ by prob 2.2.1, hence the implemented standard deviation $\sigma\sqrt h$. The displayed normal-quantile bands additionally assume Gaussian innovations; variance addition alone does not imply Gaussian coverage. They omit drift and other parameter uncertainty, as the scope states.`,
      caption: String.raw`A **reconstruction with UN data, not the paper's data**: the model is refitted to UN WPP 2024 death rates (both sexes, 1950 onward) up to the year you choose (the paper's vintage is about 1989), then projected to 2065. Left: life expectancy from the data, the fitted/forecast curve and the 80% and 95% ranges of the random walk, with the paper's reported 2065 forecast and band as a gold marker. Right: the index and its drift. Move the last data year to see how the forecast would have changed, and compare with what happened.`,
      deps: ['demo-2.1', 'demo-2.4', 'demo-3.13', 'prob-2.2.1'],
      refs: [],
      tags: ['forecasting', 'history', 'time series'],
      scope: String.raw`The paper's own data (U.S. death rates from the National Center for Health Statistics) are not reproduced; the modelled data are the UN's, in 22 abridged age groups, and the life tables use $a_x=0.1$ for infants and $1.5$ for ages 1–4. Intervals include only the random-walk innovations of $k_t$ (no parameter uncertainty), so they are narrower than the paper's reported band. The 86.05 forecast and its band are quoted from the paper's abstract and refer to the U.S. sexes combined.`,
      credit: 'Ronald D. Lee and Lawrence R. Carter, 1992',
      viz(v) {
        const co = v.select('country', cOpts(LC_CTRY), 'USA');
        const last = v.slider('last year of data used', 1975, 2022, 1989, { int: true });
        const s = v.stage({ x: [1950, 2072], y: [60, 100], axes: 'box', gutter: true, xlabel: 'year', ylabel: 'life expectancy at birth', height: 380, title: 'Forecast and outcome' });
        const t = v.stage({ x: [1950, 2072], y: [-50, 40], axes: 'box', gutter: true, xlabel: 'year', ylabel: '$k_t$', height: 380, title: 'The mortality index' });
        const obsE = {}; const e0Obs = (c, y) => (obsE[c + y] = obsE[c + y] || lt22(mxOf(c, y)).e0);
        let R = null;
        v.render(() => {
          const c = co.value, T = last.value, Z = []; for (let y = 1950; y <= T; y++) Z.push(mxOf(c, y).map(Math.log));
          const lc = leeCarter(Z), dr = drift(lc.k), kT = lc.k[lc.k.length - 1], e0 = (k) => lt22(lc.a.map((a, i) => Math.exp(a + lc.b[i] * k))).e0, H = 2065 - T;
          const obs = []; for (let y = 1950; y <= 2023; y++) obs.push([y, e0Obs(c, y)]);
          const kc = (j, z) => kT + dr.mu * j + z * dr.sd * Math.sqrt(j);
          const cur = [], up95 = [], dn95 = [], up80 = [], dn80 = [];
          for (let j = 0; j <= H; j += 1) { const y = T + j; cur.push([y, e0(kc(j, 0))]); up95.push([y, e0(kc(j, -1.96))]); dn95.push([y, e0(kc(j, 1.96))]); up80.push([y, e0(kc(j, -1.2816))]); dn80.push([y, e0(kc(j, 1.2816))]); }
          s.poly(up95.concat(dn95.slice().reverse()), { fill: 'orange', fillAlpha: 0.13, stroke: false });
          s.poly(up80.concat(dn80.slice().reverse()), { fill: 'orange', fillAlpha: 0.22, stroke: false });
          s.path(obs, { color: 'accent', width: 2.8 });
          const fit = []; for (let y = 1950; y <= T; y++) fit.push([y, e0(lc.k[y - 1950])]);
          s.path(fit, { color: 'orange', width: 2, dash: true });
          s.path(cur, { color: 'orange', width: 3 });
          s.vline(T, { color: 'ink', dash: true, alpha: 0.6 });
          if (c === 'USA') { s.segment([2065, 86.05 - 5.6], [2065, 86.05 + 3.9], { color: 'gold', width: 4 }); s.dot(2065, 86.05, { r: 6, color: 'gold' }); }
          t.path(lc.k.map((k, i) => [1950 + i, k]), { color: 'accent', width: 2.8 });
          t.line(1950, kT - dr.mu * (lc.k.length - 1), 2065, kT + dr.mu * H, { color: 'orange', dash: true, width: 2 });
          const up = (z) => { const a = []; for (let j = 0; j <= H; j++) a.push([T + j, kc(j, z)]); return a; };
          t.poly(up(1.96).concat(up(-1.96).reverse()), { fill: 'orange', fillAlpha: 0.15, stroke: false });
          const f23 = e0(kc(2023 - T, 0)), o23 = e0Obs(c, 2023), f65 = e0(kc(H, 0));
          R = { c, T, f23, o23, f65, lo65: Math.min(e0(kc(H, 1.96)), e0(kc(H, -1.96))), hi65: Math.max(e0(kc(H, 1.96)), e0(kc(H, -1.96))), mu: dr.mu, sd: dr.sd, share: lc.share, e0T: e0Obs(c, T), n: lc.k.length };
        });
        v.legend([['accent', 'data'], ['orange', 'model and forecast'], ['gold', 'the paper\'s 2065 forecast and band (U.S.)', { dot: true }]]);
        v.readout(() => { const f = (x) => v.fix(x, 1); return `data ${R.n} years to ${R.T}: first component ${f(100 * R.share)}% of variance; drift of $k_t$ ${v.fix(R.mu, 3)} per year\nforecast for 2023: ${f(R.f23)} (data: ${f(R.o23)}, error ${v.fix(R.f23 - R.o23, 1)}); forecast for 2065: ${f(R.f65)}, 95% range ${f(R.lo65)}–${f(R.hi65)}${R.c === 'USA' ? '\nthe paper (abstract): 86.05 in 2065, band +3.9 / −5.6 years' : ''}`; });
      },
    },
  ],
};
