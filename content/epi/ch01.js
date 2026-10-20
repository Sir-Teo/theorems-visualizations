// Epidemiology & Evidence — Chapter 1: Measuring disease in populations

// ---------- shared helpers ----------
const TAU = 2 * Math.PI;
/** Exponential waiting time with the given rate, from a fixed uniform u ∈ (0, 1] (Infinity when the rate is 0). */
const waitU = (u, rate) => (rate > 0 ? -Math.log(u) / rate : Infinity);
/** n fixed uniforms in (0, 1] from a seed: a simulated population keeps its "luck" while sliders move, so it changes smoothly. */
function uniforms(M, seed, n) { const r = M.rng(seed), a = new Float64Array(n); for (let i = 0; i < n; i++) a[i] = 1 - r(); return a; }
/** One-slot cache: f() is recomputed only when the key changes. */
function memo() { let key = {}, val; return (k, f) => (k === key ? val : ((key = k), (val = f()))); }
/** Exact (Garwood) confidence interval for a Poisson count k. */
function poisCI(M, k, level = 0.95) { const a = (1 - level) / 2; return [k > 0 ? M.dist.gamma(k, 1).quantile(a) : 0, M.dist.gamma(k + 1, 1).quantile(1 - a)]; }
/** Integer with thin spaces between thousands (plain text, not TeX). */
const int = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/** Percentage with d decimals (plain text). */
const pc = (x, d = 1) => `${(100 * x).toFixed(d)}%`;
/** People as an icon array: person i sits in column i % cols, row ⌊i / cols⌋ counted from the top of a stage spanning
 *  [0, cols] × [0, rows]. styleOf(i) → null or {color, alpha, r, ring (colour of an extra ring), hollow}. Batched by style. */
function iconArray(s, n, cols, styleOf) {
  const rows = Math.ceil(n / cols), groups = new Map(), rings = [], hollow = [];
  for (let i = 0; i < n; i++) {
    const st = styleOf(i); if (!st) continue;
    const x = (i % cols) + 0.5, y = rows - Math.floor(i / cols) - 0.5;
    if (st.hollow) hollow.push([x, y, st]);
    else { const k = `${st.color}|${st.alpha ?? 1}|${st.r ?? 3}`; if (!groups.has(k)) groups.set(k, { st, pts: [] }); groups.get(k).pts.push([x, y]); }
    if (st.ring) rings.push([x, y, st]);
  }
  for (const { st, pts } of groups.values()) s.dots(pts, { r: st.r ?? 3, color: st.color, alpha: st.alpha });
  for (const [x, y, st] of hollow) s.dot(x, y, { r: st.r ?? 3, color: st.color, hollow: true, width: 1.4 });
  for (const [x, y, st] of rings) s.circle(x, y, 0.47, { color: st.ring, width: 1.6 });
}
/** Tick list [[y, '5%'], …] for a prevalence axis from 0 to top (y = map(p), default identity). */
function pctTicks(top, map = (p) => p) { const step = top <= 0.13 ? 0.02 : top <= 0.32 ? 0.05 : top <= 0.65 ? 0.1 : 0.2, out = []; for (let q = 0; q <= top + 1e-9; q += step) out.push([map(q), `${Math.round(q * 100)}%`]); return out; }
/** Calendar date of t years after 1 January 2021 (plain text, e.g. "14 Feb 2022"). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dateOf(t) { const y = Math.floor(t), d = (t - y) * 365, ml = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let m = 0, r = d; while (m < 11 && r >= ml[m]) { r -= ml[m]; m++; } return `${Math.floor(r) + 1} ${MONTHS[m]} ${2021 + y}`; }
/** Life table from yearly death rates m_0 … m_ω → {l, d, L, T, e} (constant hazard within each year). */
function lifeTable(m) {
  const n = m.length, l = new Float64Array(n + 1), L = new Float64Array(n), T = new Float64Array(n + 1), e = new Float64Array(n);
  l[0] = 1;
  for (let x = 0; x < n; x++) { const mx = Math.max(m[x], 1e-12), s = Math.exp(-mx); l[x + 1] = l[x] * s; L[x] = l[x] * (mx < 1e-6 ? 1 - mx / 2 : (1 - s) / mx); }
  L[n - 1] = l[n - 1] / Math.max(m[n - 1], 1e-12); l[n] = 0; // open-ended last age group
  for (let x = n - 1; x >= 0; x--) T[x] = T[x + 1] + L[x];
  for (let x = 0; x < n; x++) e[x] = l[x] > 1e-300 ? T[x] / l[x] : 0;
  return { l, L, T, e, n };
}
/** Yearly death rates m_0 … m_110 from infant mortality q0 and the death rate at 60 (both per 1 000): an infant/child
 *  component, a background level and a Gompertz rise (doubling every ~7.7 years). */
function deathRates(q0, m60, amax = 110) { const m0 = -Math.log(1 - q0 / 1000), g = m60 / 1000; return Array.from({ length: amax + 1 }, (_, x) => (x === 0 ? m0 : m0 * 0.07 * Math.exp(-0.55 * (x - 1)) + 0.12 * g + g * Math.exp(0.09 * (x - 60)))); }
/** Survivorship l(a) at a fractional age, using the constant hazard within each year. */
function lAt(lt, m, a) { const x = Math.max(0, Math.min(lt.n - 1, Math.floor(a))); return lt.l[x] * Math.exp(-m[x] * (a - x)); }
/** Remaining life expectancy at a fractional age a: ∫_a^∞ l / l(a). */
function eAt(lt, m, a) {
  const x = Math.max(0, Math.min(lt.n - 1, Math.floor(a))), f = a - x, mx = Math.max(m[x], 1e-12), la = lAt(lt, m, a);
  const rest = lt.l[x] * (Math.exp(-mx * f) - Math.exp(-mx)) / mx; // rest of year x
  return la > 0 ? (rest + lt.T[x + 1]) / la : 0;
}

export default {
  collection: 'epi',
  chapter: 1,
  title: 'Measuring disease in populations',
  summary: String.raw`Epidemiology begins by counting. Incidence counts new cases — as a proportion of the people at risk (the risk) or per unit of person-time (the rate) — while prevalence counts the people who are ill now, and in a steady state the two are linked through the duration of illness. Crude death rates mislead when populations differ in age, so rates are standardized; life tables turn age-specific mortality into life expectancy, the Lexis diagram keeps age, period and cohort apart, and epidemic curves and attack rates show the shape and source of an outbreak. The craft goes back to Graunt’s Bills of Mortality in 1662.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Incidence proportion (risk)',
      statement: String.raw`Follow a **closed cohort**: a fixed group of $N$ people, all free of the disease at a common start $t = 0$ and all followed until the end of a period of length $T$. The **incidence proportion** — also called **cumulative incidence** or **risk** — over that period is
$$R(T) = \frac{\text{number of people who develop the disease during } (0, T]}{N\ \text{ (the people at risk at the start)}}.$$
It is a proportion between $0$ and $1$, has no units, and means nothing without its period: a risk of $8\%$ must say over what time (one year, five years, a lifetime). It estimates each person's probability of falling ill during the period. Two things change it: people who die of other causes first can no longer become cases (**competing risks** lower the risk itself), and people lost to follow-up may fall ill unseen, so that cases$/N$ *underestimates* the risk — then person-time methods (1.2) are needed.`,
      idea: String.raw`The numerator counts *new* cases (onsets), not people who are ill at some moment — that would be prevalence (1.3). The denominator is everyone who could have become a case at the start, so the ratio is a probability averaged over the cohort. Because the at-risk pool shrinks as people fall ill, the proportion rises ever more slowly and can never exceed $1$; for a constant rate $\lambda$ it equals $1 - e^{-\lambda T}$ (1.5). Every quantity in the definition presumes complete follow-up of a fixed group — break that and the simple ratio no longer measures the risk.`,
      caption: String.raw`Press play: a closed cohort of 1 000 healthy people is followed through the risk period, and each new case turns red as it occurs (gold ring = just now). Right: the cumulative proportion measured from the cohort (red steps) beside the model curve (dashed). Change the rate and the period. Then switch on deaths from other causes, or losses to follow-up, and compare the measured proportion with $1 - e^{-\lambda t}$.`,
      deps: [],
      refs: ['Rothman ch. 3', 'Gordis ch. 3'],
      tags: ['incidence', 'risk'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cumulative_incidence' },
      viz(v) {
        const M = v.M, N = 1000, COLS = 40, TMAX = 10, MU = 0.08, LOSS = 0.12;
        const sG = v.stage({ x: [0, COLS], y: [0, 25], equal: true, axes: false, height: 300, weight: 1.05, title: 'a closed cohort of 1 000 people' });
        const sC = v.stage({ x: [0, TMAX], y: [0, 1], height: 300, axes: 'box', xlabel: 'years', ylabel: 'proportion', title: 'cumulative incidence = cases so far ÷ 1 000' });
        const lam = v.slider('incidence rate $\\lambda$ (per person-year)', 0.02, 0.5, 0.12, { step: 0.01 });
        const per = v.slider('risk period $T$ (years)', 1, 10, 5, { step: 0.5, fmt: (x) => `${x} y` });
        const mode = v.select('follow-up', [{ value: 'full', label: 'complete' }, { value: 'compete', label: 'deaths from other causes' }, { value: 'lost', label: 'losses to follow-up' }], 'full');
        const U = [uniforms(M, 11, N), uniforms(M, 12, N), uniforms(M, 13, N)];
        let st = null;
        v.animate((t) => {
          const L = lam.value, T = per.value, md = mode.value, tau = T * Math.min(1, t / 6.5);
          const mu = md === 'compete' ? MU : 0, lo = md === 'lost' ? LOSS : 0;
          const cat = new Uint8Array(N), seen = []; let cases = 0, dead = 0, lost = 0, hidden = 0, latent = 0, by1 = 0;
          for (let i = 0; i < N; i++) {
            const on = waitU(U[0][i], L), de = waitU(U[1][i], mu), ls = waitU(U[2][i], lo), first = Math.min(on, de, ls);
            if (on <= T) latent++;                                      // would fall ill within T if followed and not dying first
            if (on === first && on <= T) { seen.push(on); if (on <= 1) by1++; }
            if (first > tau) continue;
            if (on === first) { cat[i] = tau - on < 0.04 * T + 0.05 ? 4 : 1; cases++; }
            else if (de === first) { cat[i] = 2; dead++; }
            else { cat[i] = 3; lost++; if (on <= tau) hidden++; }
          }
          seen.sort((a, b) => a - b);
          // ----- the cohort
          iconArray(sG, N, COLS, (i) => [
            { color: 'blue', alpha: 0.22, r: 3.2 }, { color: 'red', r: 3.6 }, { color: 'gray', r: 2.2 }, { color: 'orange', r: 3, hollow: true }, { color: 'red', r: 3.6, ring: 'gold' },
          ][cat[i]]);
          // ----- the curve
          const model = (s) => (md === 'full' ? 1 - Math.exp(-L * s) : (L / (L + (mu || lo))) * (1 - Math.exp(-(L + (mu || lo)) * s)));
          sC.vband(0, T, { color: 'accent', alpha: 0.05 });
          sC.vline(T, { color: 'muted', dash: [4, 4], width: 1 });
          sC.text(`T = ${T} y`, T, 0.97, { dx: -5, align: 'right', color: 'muted', size: 11.5 });
          if (md !== 'full') sC.fn((s) => 1 - Math.exp(-L * s), { color: 'green', width: 1.6, dash: [6, 4], alpha: 0.8 });
          sC.fn(model, { domain: [0, T], color: md === 'full' ? 'green' : 'purple', width: 2, dash: [6, 4] });
          sC.fn(model, { domain: [T, TMAX], color: md === 'full' ? 'green' : 'purple', width: 1.2, dash: [3, 4], alpha: 0.5 });
          const pts = [[0, 0]]; let k = 0;
          for (const x of seen) { if (x > tau) break; pts.push([x, k / N]); k++; pts.push([x, k / N]); }
          pts.push([tau, k / N]);
          sC.path(pts, { color: 'red', width: 2.4 });
          sC.vline(tau, { color: 'gold', width: 1.4 });
          sC.dot(tau, k / N, { r: 5, color: 'red' });
          st = { tau, k, T, md, L, dead, lost, hidden, rT: seen.length / N, r1: by1 / N, trueR: latent / N, cases, model: model(tau), done: tau >= T - 1e-9 };
        }, { period: 9, still: 8.6 });
        v.legend([['blue', 'disease-free, still followed', { dot: true }], ['red', 'new case', { dot: true }], ['gray', 'died of another cause', { dot: true }], ['orange', 'lost to follow-up', { dot: true }], ['green', '$1 - e^{-\\lambda t}$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { tau, k, T, md, L, dead, lost, hidden, rT, r1, trueR, model } = st, f = (x) => v.fix(x, 3);
          let s = `after $t = ${v.fix(tau, 1)}$ y: **${k}** of 1000 have fallen ill → cumulative incidence $${k}/1000 = ${f(k / N)}$ (model ${f(model)} ± ${f(Math.sqrt((model * (1 - model)) / N))} sampling sd) · the same rate gives a risk of ${f(r1)} over 1 year but **${f(rT)}** over $T = ${T}$ years`;
          if (md === 'compete') s += ` · ${dead} died of another cause first and can no longer become cases, so the risk is lower than $1 - e^{-\\lambda T} = ${f(1 - Math.exp(-L * T))}$ — it depends on the competing hazard too`;
          if (md === 'lost') s += ` · ${lost} were lost to follow-up, ${hidden} of whom fell ill unseen: the observed ${f(rT)} **underestimates** the true risk ${f(trueR)} (which the simulation knows but a study would not)`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Incidence rate and person-time',
      statement: String.raw`When people enter and leave observation at different times, each person contributes **person-time at risk**: the length of time from entering the study until the first of disease onset, death, loss to follow-up or the end of the study. The **incidence rate** (incidence density) is
$$I = \frac{\text{number of new cases}}{\text{total person-time at risk}},$$
measured in cases per person-year (often quoted per $100$ or $100\,000$ person-years). Its dimension is $1/\text{time}$; it ranges from $0$ to $\infty$ and is not a probability. If the underlying hazard $\lambda$ is constant and censoring is unrelated to disease, $I$ estimates $\lambda$ whatever the mix of follow-up lengths, and an approximate $95\%$ confidence interval comes from treating the case count as Poisson.`,
      idea: String.raw`Person-time puts people followed for a month and people followed for ten years on a common footing: ten people for one year and one person for ten years both give ten person-years. A person who becomes a case, dies or is lost simply stops contributing time, so nobody has to be followed to the end — which is exactly what the risk of 1.1 needed. With a constant hazard the number of cases is (approximately) Poisson with mean $\lambda\times$person-time, so cases ÷ person-time is the maximum-likelihood estimate of $\lambda$. By contrast "cases ÷ people enrolled" keeps rising as follow-up lengthens.

Within the stated Poisson count approximation, fix positive observed person-time $T$ and a count $d$. The maximum-likelihood criterion stat-3.5 uses $\ell(\lambda)=d\ln\lambda-\lambda T$ up to constants. For $d>0$ its score vanishes at $d/T$ and its second derivative is negative; for $d=0$ the maximum over $\lambda\ge0$ is the boundary value zero. This explains the estimator within that model, without making the count approximation exact for every follow-up or censoring design.`,
      caption: String.raw`Each line is one person's follow-up, from entry to the first of: disease (red), loss to follow-up (orange ring), death from another cause (grey) or the study end. Drag the gold study-end marker. The bar at the top lays all the follow-up end to end — its length is the person-time and its red ticks are the cases. Right: as the study runs longer, the rate per 100 person-years settles near the true $\lambda$ while "cases ÷ people" keeps climbing. Switch to *time since entry*: re-aligning the lines changes nothing.`,
      deps: ['epi-1.1', 'stat-3.5'],
      see: ['demo-1.2'],
      refs: ['Rothman ch. 3'],
      tags: ['incidence', 'person-time', 'rates'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Incidence_(epidemiology)' },
      viz(v) {
        const M = v.M, NMAX = 1000, LOSS = 0.07, DIE = 0.015;
        const s = v.stage({ x: [1999.6, 2012.4], y: [0, 50], height: 410, axes: 'box', yticks: [], weight: 1.65 });
        const g = v.stage({ x: [2002, 2012], y: [0, 40], height: 410, axes: 'box', xlabel: 'study end', ylabel: 'per 100', weight: 1, minWidth: 230, title: 'as follow-up lengthens' });
        const lamS = v.slider('true rate $\\lambda$ (per 100 person-years)', 1, 25, 6, { step: 0.5 });
        const nSel = v.select('cohort', [{ value: 40, label: '40 people' }, { value: 200, label: '200' }, { value: 1000, label: '1 000' }], 40);
        const axis = v.select('time axis', [{ value: 'cal', label: 'calendar time' }, { value: 'fu', label: 'time since entry' }], 'cal');
        let seed = 4; v.button('New cohort', () => { seed++; });
        let yH = -2;
        const H = s.handle(2010, yH, { color: 'gold', constrain: (x) => [M.clamp(x, 2001, 2012), yH] });
        const pop = memo(), curve = memo();
        const people = () => pop(seed, () => { const U = [0, 1, 2, 3].map((k) => uniforms(M, seed * 17 + k, NMAX)); return U; });
        /** Follow-up of person i with the study ending at E: null if not yet enrolled. */
        const follow = (U, i, lam, E) => {
          const entry = 2000 + 6 * (1 - U[0][i]); if (entry >= E) return null;
          const ev = entry + waitU(U[1][i], lam), ls = entry + waitU(U[2][i], LOSS), de = entry + waitU(U[3][i], DIE);
          const end = Math.min(ev, ls, de, E);
          return { entry, end, why: end === E ? 'end' : end === ev ? 'case' : end === ls ? 'lost' : 'died' };
        };
        let st = null;
        v.render(() => {
          const n = +nSel.value, lam = lamS.value / 100, E = H.x, U = people(), cal = axis.value === 'cal';
          // ----- layout: rows 0 … n−1, a ledger bar above, the handle below
          const top = n * 1.13 + 2.5, bot = -0.13 * n - 5; yH = -0.045 * n - 1.6; H.y = yH; H.visible = cal;
          s.setView(cal ? [1999.6, 2012.4] : [-0.4, 12.4], [bot, top + 0.11 * n + 3.6]);
          s.setTitle(cal ? 'each person’s follow-up on the calendar' : 'the same follow-up, aligned at entry (years since entry)');
          const rows = [];
          for (let i = 0; i < n; i++) { const f = follow(U, i, lam, E); if (f) rows.push(f); }
          rows.sort(cal ? (a, b) => a.entry - b.entry : (a, b) => (b.end - b.entry) - (a.end - a.entry));
          const w = n <= 40 ? 2.6 : n <= 200 ? 1.1 : 0.5, r = n <= 40 ? 4.6 : n <= 200 ? 2.3 : 1.3;
          if (cal) { s.vband(2000, 2006, { color: 'accent', alpha: 0.05 }); s.text('recruitment window', 2003, n + 0.4, { dy: -2, align: 'center', baseline: 'bottom', color: 'muted', size: 11 }); }
          let PT = 0, cases = 0;
          rows.forEach((p, k) => {
            const y = n - 1 - k, x0 = cal ? p.entry : 0, x1 = cal ? p.end : p.end - p.entry;
            PT += p.end - p.entry;
            s.line(x0, y, x1, y, { color: 'accent', width: w, alpha: n <= 200 ? 0.85 : 0.55 });
            if (p.why === 'case') { cases++; s.dot(x1, y, { r, color: 'red', ring: n <= 40 }); }
            else if (p.why === 'lost') s.dot(x1, y, n <= 40 ? { r: r - 0.6, color: 'orange', hollow: true } : { r: r * 0.8, color: 'orange', ring: false });
            else if (p.why === 'died') s.dot(x1, y, { r: r * 0.85, color: 'gray', ring: false });
            else if (n <= 40) s.line(x1, y - 0.35, x1, y + 0.35, { color: 'muted', width: 1.4 });
          });
          if (cal) { s.line(E, bot * 0.25, E, n + 0.5, { color: 'gold', width: 1.6, dash: [5, 4] }); s.text('study end', E, yH, { dx: 11, align: 'left', color: 'gold', size: 11.5, weight: 600 }); }
          // ----- ledger: all follow-up end to end
          const [xa, xb] = cal ? [2000, 2012] : [0, 12], scale = PT > 0 ? (xb - xa) / PT : 0, yl = top;
          let acc = 0; const ticks = [];
          rows.forEach((p, k) => { const d = p.end - p.entry, a = xa + acc * scale; acc += d; s.line(a, yl, xa + acc * scale, yl, { color: k % 2 ? 'accent' : 'blue', width: 7, alpha: k % 2 ? 0.75 : 0.4, cap: 'butt' }); if (p.why === 'case') ticks.push(xa + acc * scale); });
          for (const x of ticks) s.line(x, yl - 0.035 * n - 0.7, x, yl + 0.035 * n + 0.7, { color: 'red', width: n <= 200 ? 2 : 1.2 });
          s.text(`all follow-up laid end to end: Σ = ${v.fix(PT, 1)} person-years, ${cases} cases (red ticks)`, xa, yl, { dy: -22, align: 'left', color: 'ink', size: 11.5, weight: 600 });
          // ----- right: rate and naive proportion as the study end moves
          const C = curve(`${seed}|${n}|${lam}`, () => {
            const out = { rate: [], lo: [], hi: [], naive: [] };
            for (let k = 0; k <= 110; k++) {
              const e = 2002 + (10 * k) / 110; let pt = 0, c = 0, en = 0;
              for (let i = 0; i < n; i++) { const f = follow(U, i, lam, e); if (!f) continue; en++; pt += f.end - f.entry; if (f.why === 'case') c++; }
              const ci = poisCI(M, c);
              out.rate.push([e, pt > 0 ? (100 * c) / pt : NaN]); out.lo.push([e, pt > 0 ? (100 * ci[0]) / pt : NaN]); out.hi.push([e, pt > 0 ? (100 * ci[1]) / pt : NaN]); out.naive.push([e, en ? (100 * c) / en : NaN]);
            }
            return out;
          });
          const ymax = Math.max(12, 1.15 * Math.max(lamS.value * 1.9, ...C.naive.map((p) => p[1] || 0)));
          g.setView(null, [-0.05 * ymax, ymax]);
          g.clip(() => g.poly([...C.hi.filter((p) => isFinite(p[1])).map((p) => [p[0], Math.min(p[1], ymax * 2)]), ...C.lo.filter((p) => isFinite(p[1])).reverse()], { fill: 'accent', fillAlpha: 0.1, stroke: false }));
          g.hline(lamS.value, { color: 'green', dash: [6, 4], width: 1.6 });
          g.text('true λ', 2011.9, lamS.value, { dy: -9, align: 'right', color: 'green', size: 11.5, math: true });
          g.path(C.naive, { color: 'orange', width: 2.2 });
          g.path(C.rate, { color: 'accent', width: 2.4 });
          g.vline(E, { color: 'gold', width: 1.2, dash: [4, 4] });
          const at = (arr) => arr[Math.round(((M.clamp(E, 2002, 2012) - 2002) / 10) * 110)][1];
          g.dot(E, at(C.rate), { r: 4.5, color: 'accent' }); g.dot(E, at(C.naive), { r: 4.5, color: 'orange' });
          const ci = poisCI(M, cases);
          st = { E, n: rows.length, PT, cases, rate: PT > 0 ? (100 * cases) / PT : NaN, lo: PT > 0 ? (100 * ci[0]) / PT : NaN, hi: PT > 0 ? (100 * ci[1]) / PT : NaN, naive: rows.length ? (100 * cases) / rows.length : NaN, cal };
        });
        v.legend([['accent', 'incidence rate per 100 person-years (95% CI)'], ['orange', 'cases ÷ people enrolled, %'], ['red', 'case', { dot: true }], ['orange', 'lost', { dot: true }], ['gray', 'other death', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { E, n, PT, cases, rate, lo, hi, naive, cal } = st;
          return `study end ${v.fix(E, 1)}: ${n} people enrolled, **Σ person-time = ${v.fix(PT, 1)} person-years** · ${cases} cases → incidence rate $${cases}/${v.fix(PT, 1)} = ${v.fix(rate, 2)}$ per 100 person-years (95% CI ${v.fix(lo, 1)}–${v.fix(hi, 1)}; true $\\lambda = ${lamS.value}$) · naive "cases ÷ people" = ${v.fix(naive, 1)}%, which grows with the length of follow-up${cal ? '' : ' · aligned at entry: the same lines, the same total length'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Prevalence',
      statement: String.raw`The **point prevalence** of a condition at time $t$ is the proportion of a population that has it at that moment:
$$P(t) = \frac{\text{number of people with the condition at time } t}{\text{number of people in the population at time } t}.$$
The **period prevalence** over an interval $[a, b]$ is the proportion who have the condition at any time during it — those already ill at $a$ plus those whose illness begins in $(a, b]$. Prevalence counts existing cases, old and new alike; it is a proportion without units and changes over time as cases begin and end. It measures the burden of a condition (beds, drugs, care) rather than the speed at which it arises, which is incidence (1.1, 1.2).`,
      idea: String.raw`Picture every person's history as a line with illness episodes marked on it. A vertical cut at time $t$ meets the episodes in progress: their number divided by the population is $P(t)$. Sliding the cut traces the prevalence curve. Widening the cut into a window catches every episode that overlaps it, so period prevalence equals point prevalence at the start plus the onsets inside the window, and is never smaller than either point prevalence at its ends. Long episodes are hit by many cuts, short ones by few — the reason prevalence depends on duration as well as incidence (1.4).`,
      caption: String.raw`Drag the gold snapshot along the time axis. The right panel shows 20 people's histories (red = ill), the left panel the whole population of 400 at the snapshot, and the curve below is the prevalence of the 400 over three years. Switch to *period* prevalence and drag the second marker to widen the window: orange people were not ill at its start but fell ill inside it. Compare an acute winter illness with a long-lasting condition.`,
      deps: [],
      refs: ['Rothman ch. 3', 'Gordis ch. 3'],
      tags: ['prevalence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prevalence' },
      viz(v) {
        const M = v.M, N = 400, NL = 20, COLS = 20, YH = 47.5;
        const sI = v.stage({ x: [0, COLS], y: [-1.6, 20], equal: true, axes: false, height: 330, weight: 0.78, minWidth: 220, title: 'the population at the snapshot' });
        const s = v.stage({ x: [-0.3, 3.04], y: [0, 100], height: 330, axes: 'box', weight: 1.5, xticks: [[0, '2021'], [0.5, 'Jul'], [1, '2022'], [1.5, 'Jul'], [2, '2023'], [2.5, 'Jul'], [3, '2024']] });
        const cond = v.select('condition', [{ value: 'acute', label: 'acute winter illness' }, { value: 'chronic', label: 'long-lasting condition' }], 'acute');
        const kind = v.select('measure', [{ value: 'point', label: 'point prevalence' }, { value: 'period', label: 'period prevalence' }], 'point');
        const A = s.handle(1.12, YH, { color: 'gold', constrain: (x) => [M.clamp(x, 0, 2.98), YH] });
        const B = s.handle(1.29, YH, { color: 'orange', constrain: (x) => [M.clamp(x, A.x + 0.005, 3), YH] });
        const sims = memo();
        const sim = (c) => sims(c, () => {
          const r = M.rng(c === 'acute' ? 21 : 22), ac = c === 'acute', lam0 = ac ? 2.4 : 0.1, D = ac ? 0.045 : 2.5, t0 = ac ? -0.7 : -20;
          const lam = (t) => (ac ? lam0 * (1 + 0.85 * Math.cos(TAU * t)) : lam0), lmax = ac ? lam0 * 1.85 : lam0, G = M.dist.gamma(2, D / 2);
          const eps = [], ev = [];
          for (let i = 0; i < N; i++) {
            const mine = []; let t = t0;
            while (t < 3) { t += -Math.log(1 - r()) / lmax; if (t >= 3) break; if (r() * lmax > lam(t)) continue; const off = t + G.sample(r); if (off > 0) mine.push([t, off]); t = off; }
            eps.push(mine); for (const [a, b] of mine) { ev.push([Math.max(a, -1), 1], [b, -1]); }
          }
          ev.sort((p, q) => p[0] - q[0]);
          const curve = []; let k = 0, cnt = 0;
          for (let j = 0; j <= 900; j++) { const t = (3 * j) / 900; while (k < ev.length && ev[k][0] <= t) cnt += ev[k++][1]; curve.push([t, cnt / N]); }
          const pmax = Math.max(...curve.map((p) => p[1]));
          return { eps, curve, top: Math.max(0.1, Math.ceil(pmax * 20 + 0.4) / 20) };
        });
        let st = null;
        v.render(() => {
          const S = sim(cond.value), per = kind.value === 'period', a = A.x, b = per ? Math.max(B.x, a + 0.005) : a;
          B.visible = per; if (per && B.x <= a) B.x = Math.min(3, a + 0.08);
          const illAt = (E, t) => E.some(([p, q]) => p <= t && t < q), onsetIn = (E) => E.some(([p]) => p > a && p <= b);
          const status = S.eps.map((E) => (illAt(E, a) ? 1 : per && onsetIn(E) ? 2 : 0));
          // ----- icons
          iconArray(sI, N, COLS, (i) => [{ color: 'blue', alpha: 0.25, r: 4.2 }, { color: 'red', r: 4.8 }, { color: 'orange', r: 4.8 }][status[i]]);
          sI.rect(0.05, 19.05, COLS - 0.05, 19.95, { color: 'gold', width: 1.4 });
          sI.text('top row = the 20 histories on the right', COLS / 2, -0.8, { align: 'center', color: 'muted', size: 11 });
          // ----- histories (y 52 … 99) and the prevalence curve (y 0 … 43)
          const top = S.top, Y = (p) => 7 + (36 * p) / top, step = top > 0.3 ? 0.1 : 0.05, yt = [];
          for (let q = 0; q <= top + 1e-9; q += step) yt.push([Y(q), pc(q, 0)]);
          s.setTicks(undefined, yt);
          if (per) s.vband(a, b, { color: 'orange', alpha: 0.12 });
          for (let k = 0; k < NL; k++) {
            const y = 94.6 - 2.25 * k;
            s.line(0, y, 3, y, { color: 'faint', width: 1, alpha: 0.7 });
            for (const [p, q] of S.eps[k]) if (q > 0) s.line(Math.max(p, 0), y, Math.min(q, 3), y, { color: status[k] === 2 && p > a && p <= b ? 'orange' : 'red', width: 4.6, cap: 'butt' });
          }
          s.text('20 people’s histories', 0.02, 99.8, { align: 'left', baseline: 'top', color: 'muted', size: 11 });
          s.poly([[0, Y(0)], ...S.curve.map(([t, p]) => [t, Y(p)]), [3, Y(0)]], { fill: 'red', fillAlpha: 0.12, stroke: false });
          s.path(S.curve.map(([t, p]) => [t, Y(p)]), { color: 'red', width: 2 });
          s.line(a, 0, a, 100, { color: 'gold', width: 1.6 });
          if (per) s.line(b, 0, b, 100, { color: 'orange', width: 1.6 });
          const pa = S.curve[Math.round((a / 3) * 900)][1];
          s.dot(a, Y(pa), { r: 5, color: 'red' });
          s.text('prevalence of the 400', 3.0, Y(top), { dy: -3, align: 'right', baseline: 'bottom', color: 'muted', size: 11 });
          const nA = status.filter((x) => x === 1).length, nNew = status.filter((x) => x === 2).length;
          st = { a, b, per, nA, nNew, pa, days: Math.round((b - a) * 365) };
        });
        v.legend([['red', 'ill', { dot: true }], ['orange', 'fell ill during the window (period prevalence)', { dot: true }], ['blue', 'not ill', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, per, nA, nNew, days } = st;
          if (!per) return `snapshot **${dateOf(a)}**: ${nA} of 400 people are ill at this moment → point prevalence $${nA}/400 = ${pc(nA / N)}$ — a count of existing cases, however long ago they began`;
          return `window ${dateOf(a)} – ${dateOf(b)} (${days} days): ${nA} ill at its start + ${nNew} who fell ill inside it = ${nA + nNew} of 400 → **period prevalence ${pc((nA + nNew) / N)}**, never below the point prevalence at its start (${pc(nA / N)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Prevalence ≈ incidence rate × mean duration',
      credit: 'Freeman & Hutchison, 1980 (the epidemiological form of Little’s law, 1961)',
      statement: String.raw`Consider a population of constant size in a **steady state**: the incidence rate $I$ among people free of the condition and the distribution of episode durations, with mean $\bar D$, do not change over time. Then the prevalence $P$ satisfies
$$\frac{P}{1 - P} = I\,\bar D,$$
that is, the prevalence *odds* equal incidence rate times mean duration; equivalently $P = I\bar D/(1 + I\bar D)$. For a rare condition (prevalence below roughly $10\%$) this gives the familiar
$$P \approx I \times \bar D.$$
Only the mean duration matters, not the shape of the duration distribution. (If $I$ is measured per person-year of the whole population rather than of those at risk, then $P = I\bar D$ exactly.)`,
      idea: String.raw`Treat the prevalent cases as water in a bathtub. New cases flow in at rate $I(1 - P)N$ — the incidence rate of 1.2 times the people still free of the condition — and cases drain away by recovery or death at rate $PN/\bar D$, because each case contributes on average $\bar D$ units of time to the pool. In a steady state the level does not move, so inflow equals outflow: $I(1 - P) = P/\bar D$, which rearranges to the odds form. Since only the total "illness-time" per case enters, the shape of the duration distribution is irrelevant — the same reasoning as Little's law $L = \lambda W$ for queues. Out of steady state (a new epidemic, a new cure) the level lags behind the formula.`,
      caption: String.raw`2 500 simulated people fall ill at rate $I$ while healthy and stay ill for a time with mean $D$. The bathtub holds the prevalent cases, with new cases flowing in and recoveries draining out; the chart tracks measured prevalence against the steady state $I D/(1 + I D)$ (green) and the rare-disease product $I\times D$ (orange). Move a slider: the level drifts to a new steady state, and only then does the formula apply. Make the condition common ($I D \approx 1$) and $I\times D$ overshoots. Change the duration distribution: the steady level does not care.`,
      deps: ['epi-1.2', 'epi-1.3'],
      refs: ['Rothman ch. 3'],
      tags: ['prevalence', 'incidence', 'steady state'],
      scope: String.raw`Holds in a steady state: constant incidence, duration distribution and population size, with no net migration of cases. The product $I\times D$ needs a rare condition — at $10\%$ prevalence it overstates it by about $11\%$. After a change (an epidemic, a new treatment) prevalence takes a few mean durations to catch up with the formula.`,
      viz(v) {
        const M = v.M, DT = 1 / 26;
        const sg = v.stage({ height: 290, weight: 1, minWidth: 240, title: '2 500 people · red = ill now' });
        const sb = v.stage({ x: [0, 10], y: [0, 10], height: 290, axes: false, weight: 1.05, minWidth: 260, title: 'prevalence as a bathtub' });
        const ts = v.stage({ x: [0, 25], y: [0, 0.3], height: 220, axes: 'box', full: true, xlabel: 'years', ylabel: '', title: 'measured prevalence and the steady-state formula' });
        let A = null;
        const changed = () => { if (A) { A.model.data.changed = A.model.t; A.resume(); } };
        const inc = v.slider('incidence rate $I$ (per person-year, among the healthy)', 0.01, 0.6, 0.05, { log: true, fmt: (x) => x.toFixed(3), onChange: changed });
        const dur = v.slider('mean duration $D$ (years)', 0.1, 8, 2, { log: true, fmt: (x) => x.toFixed(2), onChange: changed });
        const kind = v.select('duration', [{ value: 'exp', label: 'exponential' }, { value: 'fixed', label: 'fixed' }, { value: 'skew', label: 'very skewed' }], 'exp', { onChange: changed });
        A = v.agents(sg, {
          size: 50, seed: 5, speed: 40,
          states: [{ name: 'healthy', color: 'blue', alpha: 0.16 }, { name: 'ill', color: 'red' }],
          setup: (m) => { m.grid.fill(0); m.data.timer = new Float32Array(m.N); m.data.changed = 0; m.data.on = 0; m.data.off = 0; },
          step: (m, r) => {
            const I = inc.value, D = dur.value, kd = kind.value, pOn = 1 - Math.exp(-I * DT), g = m.grid, T = m.data.timer, G = kd === 'skew' ? M.dist.gamma(0.25, D / 0.25) : null;
            let on = 0, off = 0;
            for (let k = 0; k < m.N; k++) {
              if (g[k] === 1) { T[k] -= DT; if (T[k] <= 0) { g[k] = 0; off++; } }
              else if (r() < pOn) { g[k] = 1; T[k] = (kd === 'fixed' ? D : kd === 'exp' ? -D * Math.log(1 - r()) : G.sample(r)) - DT / 2; on++; }
            }
            m.data.on = on; m.data.off = off;
          },
          stats: (m) => { const I = inc.value, D = dur.value; return { ID: I * D, exact: (I * D) / (1 + I * D), inflow: m.data.on / (m.N * DT), outflow: m.data.off / (m.N * DT) }; },
        });
        A.step(150);
        let st = null;
        v.render(() => {
          A.draw();
          const H = A.history, n = H.t.length, now = H.t[n - 1] * DT, P = A.stats.ill, I = inc.value, D = dur.value, ID = I * D, ex = ID / (1 + ID);
          const avg = (key, k = 26) => { let s = 0, c = 0; for (let j = Math.max(1, n - k); j < n; j++) { s += H[key][j]; c++; } return c ? s / c : H[key][n - 1]; };
          const Pm = avg('ill'), inflow = avg('inflow'), outflow = avg('outflow');
          // ----- bathtub: walls x 2.4…7.6, floor y = 1.7, rim y = 8.2 ↔ prevalence 0…cap (25%, 50% or 100%)
          const need = Math.max(P, ex, Math.min(ID, 1)), cap = need < 0.21 ? 0.25 : need < 0.43 ? 0.5 : 1;
          const Yp = (p) => 1.7 + (6.5 * Math.min(p, cap * 1.05)) / cap, x0 = 2.4, x1 = 7.6, sc = Math.max(I, 0.02), wIn = Math.min(24, 2 + (20 * inflow) / sc), wOut = Math.min(24, 2 + (20 * outflow) / sc);
          for (const [y, lab] of pctTicks(cap, Yp)) { sb.line(x0 - 0.12, y, x0, y, { color: 'muted', width: 1 }); sb.text(lab, x0 - 0.2, y, { align: 'right', color: 'muted', size: 10.5 }); }
          sb.line(0.3, 9.35, 3.35, 9.35, { color: 'gray', width: 9, cap: 'butt' }); sb.line(3.35, 9.35, 3.35, 8.75, { color: 'gray', width: 9, cap: 'butt' });
          sb.line(3.35, 8.7, 3.35, Yp(P), { color: 'red', width: wIn, alpha: 0.45, cap: 'butt' });
          sb.rect(x0, 1.7, x1, Yp(P), { fill: 'red', fillAlpha: 0.28, stroke: false });
          sb.line(x0, Yp(P), x1, Yp(P), { color: 'red', width: 2 });
          sb.path([[6.9, 1.7], [6.9, 1.0], [9.8, 1.0]], { color: 'teal', width: wOut, alpha: 0.55, cap: 'butt' });
          sb.path([[x0, 8.4], [x0, 1.7], [x1, 1.7], [x1, 8.4]], { color: 'ink', width: 2.6 });
          sb.line(x0, Yp(ex), x1, Yp(ex), { color: 'green', width: 2, dash: [6, 4] });
          sb.text('steady state', x1, Yp(ex), { dx: 5, align: 'left', color: 'green', size: 11, weight: 600 });
          if (ID <= cap * 1.02) { sb.line(x0, Yp(ID), x1, Yp(ID), { color: 'orange', width: 2, dash: [3, 4] }); sb.text('I × D', x1, Yp(ID), { dx: 5, dy: Math.abs(Yp(ID) - Yp(ex)) < 0.45 ? -11 : 0, align: 'left', color: 'orange', size: 11, weight: 600 }); }
          else { sb.arrow(x1 - 0.5, 7.6, x1 - 0.5, 8.6, { color: 'orange', width: 2, head: 7 }); sb.text(`I × D = ${ID > 1 ? v.fix(ID, 2) + ' > 100%' : pc(ID, 0)}`, x1 - 0.8, 8.35, { align: 'right', color: 'orange', size: 11, weight: 600 }); }
          sb.text(`in: ${v.fix(inflow, 3)}/yr`, 3.55 + wIn / 2 / sb.scale, 9.0, { dx: 3, align: 'left', color: 'red', size: 11, weight: 600 });
          sb.text('new cases I(1 − P)', 0.3, 9.85, { align: 'left', color: 'muted', size: 10.5 });
          sb.text(`out: ${v.fix(outflow, 3)}/yr`, 9.8, 1.0, { dy: -10 - wOut / 2, align: 'right', color: 'teal', size: 11, weight: 600 });
          sb.text('recoveries P/D', 9.8, 1.0, { dy: 8 + wOut / 2, align: 'right', color: 'muted', size: 10.5 });
          // ----- time series in years
          const t1 = Math.max(15, now), t0 = t1 - 15, pts = (key, cap) => { const out = []; for (let j = 0; j < n; j++) { const t = H.t[j] * DT; if (t >= t0) out.push([t, Math.min(H[key][j], cap)]); } return out; };
          let top = Math.max(ex, Math.min(ID, 1)); for (let j = 0; j < n; j++) if (H.t[j] * DT >= t0) top = Math.max(top, H.ill[j], H.exact[j], Math.min(H.ID[j], 1));
          top = Math.min(1.05, Math.max(0.08, top * 1.18));
          ts.setView([t0, t1], [-0.06 * top, top]); ts.setTicks(undefined, pctTicks(top));
          ts.path(pts('ID', top * 1.5), { color: 'orange', width: 1.8, dash: [3, 4] });
          ts.path(pts('exact', 2), { color: 'green', width: 2, dash: [6, 4] });
          ts.path(pts('ill', 2), { color: 'red', width: 2 });
          ts.dot(now, P, { r: 4.5, color: 'red' });
          const since = (A.model.t - (A.model.data.changed || 0)) * DT, relax = 1 / (I + 1 / D);
          st = { Pm, ID, ex, inflow, outflow, steady: since > 3 * relax, since, relax, fresh: !A.model.data.changed };
        });
        v.legend([['red', 'measured prevalence'], ['green', 'steady state $ID/(1+ID)$', { dash: true }], ['orange', 'rare-disease product $I\\times D$', { dash: true }], ['teal', 'outflow (recoveries)']]);
        v.readout(() => {
          if (!st) return '';
          const { Pm, ID, ex, inflow, outflow, steady, since, relax, fresh } = st;
          return `measured prevalence **${pc(Pm)}** (mean over the last year) · steady state $\\frac{ID}{1+ID} = ${pc(ex)}$ · product $I\\times D = ${v.fix(ID, 3)}$ (${ID > 0.1 ? `off by ${pc(ID / ex - 1, 0)}: not a rare condition` : 'close: a rare condition'}) · inflow ${v.fix(inflow, 3)} vs outflow ${v.fix(outflow, 3)} per person-year` +
            (steady ? ' → **steady state**: inflow = outflow' : ` → **not yet in steady state** (${fresh ? 'started' : 'last change'} ${v.fix(since, 1)} y ago; it takes a few times $1/(I + 1/D) = ${v.fix(relax, 1)}$ y)`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: String.raw`Risk from a constant rate: $R = 1 - e^{-\lambda t}$`,
      statement: String.raw`In a closed cohort with no competing risks and no losses, suppose every disease-free person falls ill at the same constant rate $\lambda$. Then the risk over a period of length $t$ is
$$R(t) = 1 - e^{-\lambda t}.$$
For small $\lambda t$ this is $R(t) \approx \lambda t$ ("risk ≈ rate × time"), with relative error close to $\lambda t/2$. The approximation always overstates the risk and breaks down as $\lambda t$ approaches $1$, where it would even exceed $1$. For a rate that varies over time, $R(t) = 1 - \exp\bigl(-\int_0^t \lambda(s)\,ds\bigr)$.`,
      idea: String.raw`Let $S(t) = 1 - R(t)$ be the fraction still disease-free. In a short interval $dt$ a fraction $\lambda\,dt$ *of them* falls ill, so $S' = -\lambda S$ and $S(t) = e^{-\lambda t}$ (pma 8.6). Without calculus: cut $[0, t]$ into $n$ pieces; in each, a fraction $\lambda t/n$ of the people still at risk becomes a case, so $S = (1 - \lambda t/n)^n \to e^{-\lambda t}$. The rule $R = \lambda t$ is the crudest case $n = 1$: it applies the rate to the whole cohort for the whole period, ignoring that people who have already fallen ill are no longer at risk.

Taylor's theorem pma-5.15 applied to $e^{-x}$ at $x=0$ gives $1-e^{-x}=x-x^2/2+O(x^3)$, so for small positive $x=\lambda t$ the relative overstatement is $x/2+O(x^2)$. Its second-order remainder also gives $x-(1-e^{-x})=e^{-\xi}x^2/2\ge0$ for some $0<\xi<x$. For a continuous time-varying hazard and positive survival, integrate $(\ln S)'=-\lambda$ from zero using the fundamental theorem pma-6.21 and $S(0)=1$. This yields the cumulative-hazard formula, under the same cohort and competing-risk assumptions.`,
      caption: String.raw`Drag the point along the risk curve. Left: the exact risk $1 - e^{-\lambda t}$ (green), the approximation $\lambda t$ (orange dashed, with the error shaded) and the cumulative incidence of a simulated cohort of 2 000 people (gold steps). Right: the people still at risk when the period is cut into $n$ pieces, each removing a fraction $\lambda t/n$ of those left; raise $n$ and the staircase settles onto $e^{-\lambda s}$, while $n = 1$ is exactly the approximation.`,
      deps: ['epi-1.1', 'epi-1.2', 'pma-8.6', 'pma-5.15', 'pma-6.21'],
      refs: ['Rothman ch. 3'],
      tags: ['risk', 'rates'],
      scope: String.raw`Holds for a constant rate in a closed cohort without competing risks or losses (otherwise use the cumulative rate, or the competing-risk formulas of 1.1). The approximation $R \approx \lambda t$ is within $5\%$ only while $\lambda t \lesssim 0.1$.`,
      viz(v) {
        const M = v.M, N = 2000, TMAX = 10;
        const s = v.stage({ x: [0, TMAX], y: [0, 1.12], height: 330, axes: 'box', xlabel: 'years', ylabel: 'risk', weight: 1.15, title: 'risk over a period of length $t$' });
        const g = v.stage({ x: [0, 4], y: [0, 1.1], height: 330, axes: 'box', xlabel: 'years', weight: 1, title: 'still at risk, cutting $[0, t]$ into $n$ pieces' });
        const lamS = v.slider('rate $\\lambda$ (per person-year)', 0.01, 1, 0.15, { log: true, fmt: (x) => x.toFixed(3) });
        const nS = v.slider('pieces $n$', 1, 40, 3, { int: true });
        const U = uniforms(M, 51, N);
        const R = (t) => 1 - Math.exp(-lamS.value * t);
        const P = s.handle(4, R(4), { color: 'accent', constrain: (x) => { const t = M.clamp(x, 0.1, TMAX); return [t, R(t)]; } });
        let st = null;
        v.render(() => {
          const lam = lamS.value, t = P.x, n = nS.value, lt = lam * t;
          P.y = R(t);
          // ----- left
          s.hline(1, { color: 'muted', dash: [3, 4], width: 1 });
          s.text('a risk can never exceed 1', 0, 1, { dx: 30, dy: -9, align: 'left', color: 'muted', size: 11 });
          s.between((x) => Math.min(lam * x, 1.12), R, 0, t, { fill: 'orange', fillAlpha: 0.22 });
          s.fn((x) => lam * x, { color: 'orange', width: 2, dash: [6, 4] });
          s.fn(R, { color: 'green', width: 2.6 });
          const on = Array.from(U, (u) => -Math.log(u) / lam).filter((x) => x <= TMAX).sort((a, b) => a - b);
          const pts = [[0, 0]]; on.forEach((x, k) => { pts.push([x, k / N], [x, (k + 1) / N]); }); pts.push([TMAX, on.length / N]);
          s.path(pts, { color: 'gold', width: 1.6 });
          let k = 0; while (k < on.length && on[k] <= t) k++;
          s.line(t, 0, t, Math.min(lt, 1.12), { color: 'muted', dash: [3, 3], width: 1 });
          if (lt <= 1.12) s.dot(t, lt, { r: 4.5, color: 'orange' });
          const lx = Math.min(TMAX * 0.97, 1.05 / lam);
          s.tex('\\lambda t', lx, Math.min(lam * lx, 1.08), { dx: -6, dy: -4, align: 'right', baseline: 'bottom', color: 'orange', size: 14 });
          s.tex('1 - e^{-\\lambda t}', TMAX * 0.97, R(TMAX * 0.97), { dy: 7, align: 'right', baseline: 'top', color: 'green', size: 14 });
          // ----- right: the n-piece staircase
          g.setView([0, t], [0, 1.1]);
          g.fn((x) => Math.exp(-lam * x), { color: 'blue', width: 2.4 });
          const stair = [[0, 1]]; let S = 1;
          for (let j = 0; j < n; j++) {
            const a = (j * t) / n, b = ((j + 1) * t) / n, S2 = S * (1 - lt / n);
            g.rect(a, Math.max(S2, 0), b, S, { fill: 'red', fillAlpha: 0.22, stroke: false });
            stair.push([b, S], [b, Math.max(S2, 0)]); S = S2;
          }
          g.path(stair, { color: 'red', width: 2 });
          if (S < 0) g.text('1 − λt < 0: more cases than people!', t * 0.5, 0.06, { align: 'center', color: 'red', size: 12, weight: 600 });
          g.dot(t, Math.exp(-lt), { r: 4.5, color: 'blue' });
          st = { lam, t, lt, R: R(t), k, n, Rn: 1 - Math.pow(1 - lt / n, n) };
        });
        v.legend([['green', 'exact risk $1 - e^{-\\lambda t}$'], ['orange', 'approximation $\\lambda t$', { dash: true }], ['gold', 'simulated cohort (2 000 people)'], ['blue', 'still at risk $e^{-\\lambda s}$'], ['red', 'cases per piece (staircase)']]);
        v.readout(() => {
          if (!st) return '';
          const { t, lt, R: r, k, n, Rn } = st, f = (x) => v.fix(x, 3);
          return `$t = ${v.fix(t, 2)}$ y, $\\lambda t = ${f(lt)}$ · exact risk $1 - e^{-\\lambda t} = ${f(r)}$ · simulated cohort: ${k} of 2000 ill → ${f(k / N)} · approximation $\\lambda t$ overstates the risk by **${pc(lt / r - 1, 1)}** (rule of thumb $\\lambda t/2 = ${pc(lt / 2, 1)}$) · with $n = ${n}$ pieces, $1 - (1 - \\lambda t/n)^n = ${f(Rn)}$ ${n === 1 ? '— exactly the approximation' : `→ ${f(r)} as $n \\to \\infty$`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Mortality and case-fatality rates',
      statement: String.raw`The **mortality rate** from a disease is the number of deaths it causes in a period divided by the person-time of the whole population (often per $100\,000$ person-years) — an incidence rate (1.2) whose event is death. The **case fatality** (case-fatality rate or ratio) is the proportion of people with the disease who die of it,
$$\text{CFR} = \frac{\text{deaths from the disease among the cases}}{\text{number of cases}},$$
counted once every case's outcome is known. When deaths follow onset within the period and the population is stable, mortality rate $\approx$ incidence rate $\times$ CFR. The two answer different questions: mortality measures a disease's toll on the population, case fatality its danger to the patient. The **proportionate mortality** — the share of all deaths due to the disease — is a third, different measure.`,
      idea: String.raw`A death from the disease requires first becoming a case and then dying of it, so deaths per person-year factor into cases per person-year times deaths per case. On log axes that product becomes a sum, and diseases with equal mortality lie on diagonal lines: a common mild illness and a rare deadly one can share a diagonal, or swap ranks depending on which measure is used. The CFR's denominator is the cases whose outcome is *known*: counted during an outbreak, recent cases have not yet had time to die, so deaths ÷ cases so far is biased low, while deaths ÷ resolved cases is biased high until the epidemic is over.`,
      caption: String.raw`*Compare diseases*: drag the three diseases on the plane of incidence against case fatality (both log scales). Grey diagonals join diseases with equal mortality. The table counts cases and deaths in a simulated population of one million for one year, and the slope chart ranks the diseases both ways — crossing lines mean the two measures disagree. *During an outbreak*: drag the report day and watch naive deaths ÷ cases creep up to the true case fatality.`,
      deps: ['epi-1.2', 'epi-1.1'],
      refs: ['Gordis ch. 4'],
      tags: ['mortality', 'case fatality'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Case_fatality_rate' },
      viz(v) {
        const M = v.M, POP = 1e6, DAYS = 90, NC = 2500;
        const sL = v.stage({ x: [0.1, 1e5], y: [0.01, 100], xlog: true, ylog: true, height: 360, weight: 1.15, xlabel: 'incidence per 100 000 per year', ylabel: 'case fatality %' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 360, axes: false, weight: 1, minWidth: 280 });
        const mode = v.select('', [{ value: 'compare', label: 'compare diseases' }, { value: 'outbreak', label: 'case fatality during an outbreak' }], 'compare');
        const cfrS = v.slider('true case fatality', 0.02, 0.4, 0.1, { step: 0.01, fmt: (x) => pc(x, 0) });
        const delS = v.slider('mean onset-to-death delay (days)', 5, 30, 16, { step: 1 });
        const DIS = [
          { id: 'A', name: 'mild, widespread', color: 'teal', at: [6000, 0.06] },
          { id: 'B', name: 'rare, deadly', color: 'purple', at: [5, 40], pos: 'e' },
          { id: 'C', name: 'moderate', color: 'orange', at: [60, 4] },
        ];
        DIS.forEach((d, i) => { d.h = sL.handle(...d.at, { color: d.color, label: d.id, labelPos: d.pos || 'ne' }); d.u = uniforms(M, 61 + i, 2); });
        const TB = v.table(sR, { rows: 3, cols: 4, square: false, cellAspect: 1.55, maxCell: 50, size: 12.5, region: [0, 0.56, 1, 1], colLabels: ['cases', 'deaths', 'per 100k', 'CFR'], rowLabels: ['A', 'B', 'C'], rowLabelColor: (i) => DIS[i].color, labelSize: 13 });
        /** A count with the given mean and variance from a fixed uniform: exact quantile for small means, normal otherwise. */
        const count = (mean, sd, u, exact) => (mean < 60 ? exact().quantile(u) : Math.max(0, Math.round(mean + sd * M.dist.normal(0, 1).quantile(u))));
        // outbreak: onset days and standardized delays (fixed), outcome draws fixed
        const ob = (() => { const r = M.rng(77), G = M.dist.gamma(5, 5), g4 = M.dist.gamma(4, 0.25); return Array.from({ length: NC }, () => ({ on: G.sample(r), u: r(), gd: g4.sample(r), gr: g4.sample(r) })); })();
        let st = null, lastMode = null;
        v.render(() => {
          const cmp = mode.value === 'compare';
          cfrS.el.hidden = delS.el.hidden = cmp;
          if (cmp !== lastMode) { lastMode = cmp; v.legend(cmp ? [['gray', 'equal mortality'], ['green', 'highest deaths per 100 000', { area: true }], ['red', 'highest case fatality', { area: true }]] : [['orange', 'new cases', { area: true }], ['red', 'deaths', { area: true }], ['red', 'deaths ÷ cases so far'], ['purple', 'deaths ÷ resolved cases'], ['green', 'true case fatality', { dash: true }]]); }
          DIS.forEach((d) => (d.h.visible = cmp));
          if (cmp) {
            Object.assign(sL.o, { xlog: true, ylog: true, xlabel: 'incidence per 100 000 per year', ylabel: 'case fatality %', axes: true });
            sL.setView([0.1, 1e5], [0.01, 100]); sL.setTitle('grey diagonals: equal deaths per 100 000 per year');
            Object.assign(sR.o, { axes: false }); sR.setTicks(undefined, null); sR.setView([0, 1], [0, 1]); sR.setTitle('one simulated year in a population of 1 000 000');
            for (const m of [0.001, 0.01, 0.1, 1, 10, 100, 1000]) {
              sL.fn((x) => (100 * m) / x, { color: 'gray', width: 1, alpha: 0.55 });
              const xl = (100 * m) / 45; if (xl > 0.15 && xl < 6e4) sL.text(m >= 1 ? String(m) : String(m), xl, 45, { dx: 4, align: 'left', color: 'muted', size: 10.5 });
            }
            const rows = DIS.map((d) => {
              const inc = d.h.x, cfr = d.h.y / 100, mu = (inc * POP) / 1e5;
              const cases = count(mu, Math.sqrt(mu), d.u[0], () => M.dist.poisson(mu));
              const deaths = count(cases * cfr, Math.sqrt(cases * cfr * (1 - cfr)), d.u[1], () => M.dist.binomial(cases, cfr));
              return { ...d, inc, cfr, cases, deaths, mort: (1e5 * deaths) / POP, cf: cases ? deaths / cases : 0 };
            });
            DIS.forEach((d, i) => sL.dot(d.h.x, d.h.y, { r: 3, color: d.color }));
            const rk = (key) => rows.map((r, i) => i).sort((a, b) => rows[b][key] - rows[a][key]);
            const byM = rk('mort'), byC = rk('cf');
            const fmtM = (x) => (x >= 10 ? v.fix(x, 0) : x >= 1 ? v.fix(x, 1) : v.fix(x, 2));
            TB.draw({
              value: (i, j) => { const r = rows[i]; return [int(r.cases), int(r.deaths), fmtM(r.mort), r.cf >= 0.1 ? pc(r.cf, 0) : r.cf >= 0.01 ? pc(r.cf, 1) : pc(r.cf, 2)][j]; },
              fill: (i, j) => (j === 2 && byM[0] === i ? ['green', 0.25] : j === 3 && byC[0] === i ? ['red', 0.22] : null),
            });
            // slope chart of the two rankings
            const yR = (k) => 0.4 - k * 0.15;
            sR.text('rank by deaths per 100 000', 0.22, 0.49, { align: 'center', color: 'green', size: 11, weight: 600 });
            sR.text('rank by case fatality', 0.78, 0.49, { align: 'center', color: 'red', size: 11, weight: 600 });
            rows.forEach((r, i) => {
              const a = byM.indexOf(i), b = byC.indexOf(i);
              sR.line(0.3, yR(a), 0.7, yR(b), { color: r.color, width: 2.6 });
              sR.dot(0.3, yR(a), { r: 5, color: r.color }); sR.dot(0.7, yR(b), { r: 5, color: r.color });
              sR.text(`${a + 1}. ${r.id}  ${fmtM(r.mort)}`, 0.27, yR(a), { align: 'right', color: r.color, size: 11.5, weight: 600 });
              sR.text(`${b + 1}. ${r.id}  ${pc(r.cf, r.cf < 0.01 ? 2 : 1)}`, 0.73, yR(b), { align: 'left', color: r.color, size: 11.5, weight: 600 });
            });
            st = { cmp, rows, byM, byC };
          } else {
            const cfr = cfrS.value, del = delS.value;
            const cd = new Float64Array(DAYS + 1), dd = new Float64Array(DAYS + 1), rd = new Float64Array(DAYS + 1);
            for (const c of ob) { const d0 = Math.floor(c.on); if (d0 <= DAYS) cd[d0]++; const dies = c.u < cfr, te = c.on + (dies ? del * c.gd : 20 * c.gr); const k = Math.floor(te); if (k <= DAYS) (dies ? dd : rd)[k]++; }
            const cum = (a) => { const o = new Float64Array(a.length); let s = 0; a.forEach((x, i) => { s += x; o[i] = s; }); return o; };
            const CC = cum(cd), CD = cum(dd), CR = cum(rd);
            const ymax = Math.max(...cd) * 1.15;
            Object.assign(sL.o, { xlog: false, ylog: false, xlabel: 'day', ylabel: 'per day', axes: 'box' });
            sL.setView([0, DAYS], [-0.07 * ymax, ymax]); sL.setTitle('new cases and deaths per day');
            Object.assign(sR.o, { axes: 'box', xlabel: 'report day', ylabel: '' });
            const rtop = Math.min(1, Math.max(0.3, 2.2 * cfr));
            sR.setView([0, DAYS], [-0.07 * rtop, rtop]); sR.setTicks(undefined, pctTicks(rtop)); sR.setTitle('case fatality as it would be reported');
            for (let d = 0; d <= DAYS; d++) { sL.rect(d + 0.1, 0, d + 0.9, cd[d], { fill: 'orange', fillAlpha: 0.45, stroke: false }); sL.rect(d + 0.25, 0, d + 0.75, dd[d], { fill: 'red', fillAlpha: 0.9, stroke: false }); }
            if (!st || !st.hd) st = { hd: sL.handle(25, 0, { color: 'gold', constrain: (x) => [M.clamp(Math.round(x), 3, DAYS - 1), sL.bounds.y[1] * 0.93] }) };
            const H = st.hd; H.visible = true; H.y = sL.bounds.y[1] * 0.93;
            sL.text('report day', H.x, H.y, { dx: 11, align: 'left', color: 'gold', size: 11.5, weight: 600 });
            const day = Math.round(H.x);
            sL.vline(day + 1, { color: 'gold', width: 1.4, dash: [4, 4] });
            const naive = [], res = [];
            for (let d = 3; d <= DAYS; d++) { if (CC[d] > 0) naive.push([d + 1, CD[d] / CC[d]]); if (CD[d] + CR[d] > 0) res.push([d + 1, CD[d] / (CD[d] + CR[d])]); }
            sR.hline(cfr, { color: 'green', width: 1.8, dash: [6, 4] });
            sR.text(`true ${pc(cfr, 0)}`, DAYS - 1, cfr, { dy: -9, align: 'right', color: 'green', size: 11.5, weight: 600 });
            sR.path(res, { color: 'purple', width: 2.2 }); sR.path(naive, { color: 'red', width: 2.4 });
            sR.vline(day + 1, { color: 'gold', width: 1.4, dash: [4, 4] });
            const nv = CD[day] / Math.max(1, CC[day]), rv = CD[day] / Math.max(1, CD[day] + CR[day]);
            sR.dot(day + 1, nv, { r: 4.5, color: 'red' }); if (CD[day] + CR[day] > 0) sR.dot(day + 1, Math.min(rv, sR.bounds.y[1]), { r: 4.5, color: 'purple' });
            Object.assign(st, { cmp, day, cases: CC[day], deaths: CD[day], rec: CR[day], nv, rv, cfr, final: CD[DAYS] / CC[DAYS] });
          }
          if (st && st.hd) st.hd.visible = !cmp;
        });
        v.readout(() => {
          if (!st) return '';
          if (st.cmp && st.rows) {
            const { rows, byM, byC } = st, nm = (k) => rows[k].id;
            const swap = byM.join() !== byC.join();
            return `mortality = incidence × case fatality: ${rows.map((r) => `${r.id} ${v.fix(r.inc, r.inc < 10 ? 1 : 0)} × ${pc(r.cfr, r.cfr < 0.01 ? 2 : 1)} = ${v.fix((r.inc * r.cfr), 2)} (simulated ${v.fix(r.mort, 2)})`).join(' · ')} per 100 000 · deadliest for the population: **${byM.map(nm).join(' > ')}**; for the patient: **${byC.map(nm).join(' > ')}**${swap ? ' — the two measures rank them differently' : ''} · proportionate mortality (if all causes kill 900 per 100 000 a year): ${rows.map((r) => `${r.id} ${pc(r.mort / 900, 2)}`).join(', ')} of all deaths`;
          }
          const { day, cases, deaths, rec, nv, rv, cfr, final } = st;
          return `day ${day + 1}: ${int(cases)} cases, ${int(deaths)} deaths, ${int(rec)} recovered → deaths ÷ cases = **${pc(nv)}** (too low: recent cases have not had time to die) · deaths ÷ resolved cases = ${pc(rv)} · true case fatality ${pc(cfr, 0)}, reached only when every case has an outcome (day ${DAYS}: ${pc(final)})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Indirect standardization and the SMR',
      statement: String.raw`To compare a study population with a reference population whose age-specific death rates $R_x$ are known, compute the **expected** number of deaths — the deaths the study population would have had at the reference rates, given its own age structure:
$$E = \sum_x n_x R_x,$$
where $n_x$ is the study population's person-time in age group $x$. The **standardized mortality ratio** is observed over expected,
$$\text{SMR} = \frac{O}{E}$$
(often quoted $\times 100$); SMR $> 1$ means more deaths than the reference rates predict for people of those ages. Only the total $O$ is needed, not the study group's own age-specific rates, so the method suits small groups; an exact $95\%$ interval treats $O$ as Poisson. **Direct** standardization (demo 1.7) instead applies each population's own rates to one common standard population. Because indirect standardization weights by each study group's *own* age structure, two SMRs are strictly comparable with each other only when the rate ratio is similar across ages.`,
      idea: String.raw`A crude death rate is an average of age-specific rates weighted by the age structure, so an old population has a high crude rate even if each of its age groups is healthy — age confounds the comparison. Both standardizations remove the weighting by age. Direct: fix the weights (a standard population) and average each population's own rates. Indirect: ask how many deaths the reference rates would produce in *this* age structure; any excess over that cannot be explained by age. If every age-specific rate of the study group is $\theta$ times the reference rate, then $O \approx \theta E$ and the SMR estimates $\theta$ exactly; the Poisson interval comes from the count $O$ (1.2).

The expected total uses linearity of expectation prob-1.6.1. If the reference-rate model assigns age-group count $D_x$ mean $n_xR_x$, then $E[\sum_xD_x]=\sum_x n_xR_x$, regardless of dependence between group counts. The person-times are treated as the specified exposures in this calculation. Linearity justifies adding expected counts; it does not by itself give a Poisson distribution, a confidence interval, or comparability of SMRs with different age weights.`,
      caption: String.raw`Seaside is an old town with low death rates at every age; Milltown is young with high ones. Left: their age pyramids (dashed: the national standard). Middle: their age-specific death rates (dots: observed deaths ÷ persons, with 95% intervals) against the national rates. Below: the expected-deaths table that defines the SMR, and the three comparisons. Slide Seaside younger, or change the death rates, and watch the crude rates flip which town "looks worse" while the standardized measures stay with the truth. Shrink the towns and the intervals widen.`,
      deps: ['demo-1.7', 'epi-1.2', 'prob-1.6.1'],
      see: ['causal-4.4', 'demo-1.8'],
      refs: ['Gordis ch. 4'],
      tags: ['standardization', 'mortality'],
      scope: String.raw`Valid as a comparison of each study group with the reference. Comparing two SMRs with each other assumes the ratio of study to reference rates is roughly constant across age groups (otherwise use direct standardization, which needs stable age-specific rates and hence larger groups).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Standardized_mortality_ratio' },
      viz(v) {
        const M = v.M, AG = ['0–14', '15–29', '30–44', '45–59', '60–74', '75+'], REF = [0.4, 0.6, 1.5, 5, 18, 80], STD = [0.17, 0.19, 0.2, 0.2, 0.15, 0.09], AGE_B = -0.5;
        const sP = v.stage({ x: [-56, 56], y: [-0.55, 6.6], height: 270, axes: false, weight: 1, minWidth: 250, title: 'age structure (% of each town)' });
        const sR = v.stage({ x: [-0.45, 5.45], y: [0.1, 400], ylog: true, height: 270, axes: 'box', weight: 1, minWidth: 250, title: 'deaths per 1 000 per year, by age', xticks: AG.map((a, i) => [i, a]) });
        const sT = v.stage({ x: [0, 100], y: [0, 10], height: 255, axes: false, full: true });
        const ageA = v.slider('Seaside: age structure (young ↔ old)', -0.8, 0.8, 0.55, { step: 0.01 });
        const thA = v.slider('Seaside: death rates × national', 0.5, 2, 0.85, { step: 0.01, fmt: (x) => `× ${x.toFixed(2)}` });
        const thB = v.slider('Milltown: death rates × national', 0.5, 2, 1.3, { step: 0.01, fmt: (x) => `× ${x.toFixed(2)}` });
        const size = v.slider('town size', 2000, 200000, 20000, { log: true, fmt: (x) => int(Math.round(x / 100) * 100) });
        let seed = 1; v.button('New draw of deaths', () => { seed++; });
        const share = (a) => { const w = STD.map((p, i) => p * Math.exp(a * (i - 2.5))), t = w.reduce((x, y) => x + y, 0); return w.map((x) => x / t); };
        const TB = v.table(sT, { rows: 7, cols: 6, square: false, cellAspect: 1.65, maxCell: 30, size: 11.5, labelSize: 11.5, region: [0, 0, 47, 8.35], rowLabels: [...AG, 'total'], colLabels: ['persons', '$E$', '$O$', 'persons', '$E$', '$O$'], cornerLabel: 'age' });
        const uni = memo();
        let st = null;
        v.render(() => {
          const N = Math.round(size.value / 100) * 100, U = uni(seed, () => uniforms(M, 300 + seed, 12));
          const town = (a, th, off, name, color) => {
            const sh = share(a), n = sh.map((p) => p * N), mean = n.map((x, i) => (x * th * REF[i]) / 1000);
            const O = mean.map((mu, i) => (mu < 60 ? M.dist.poisson(mu).quantile(U[off + i]) : Math.max(0, Math.round(mu + Math.sqrt(mu) * M.dist.normal(0, 1).quantile(U[off + i])))));
            const E = n.map((x, i) => (x * REF[i]) / 1000), Ot = O.reduce((x, y) => x + y, 0), Et = E.reduce((x, y) => x + y, 0);
            const crude = (1000 * Ot) / N, direct = 1000 * STD.reduce((s, w, i) => s + (w * O[i]) / n[i], 0), dse = 1000 * Math.sqrt(STD.reduce((s, w, i) => s + (w * w * O[i]) / (n[i] * n[i]), 0));
            const ci = poisCI(M, Ot), cse = (1000 * Math.sqrt(Ot)) / N;
            return { name, color, sh, n, O, E, Ot, Et, crude, cse, direct, dse, smr: Ot / Et, lo: ci[0] / Et, hi: ci[1] / Et, th };
          };
          const A = town(ageA.value, thA.value, 0, 'Seaside', 'purple'), B = town(AGE_B, thB.value, 6, 'Milltown', 'teal');
          // ----- pyramids
          const g = 6.5;
          AG.forEach((lab, i) => {
            sP.rect(-g, i - 0.36, -g - 100 * A.sh[i], i + 0.36, { fill: 'purple', fillAlpha: 0.55, stroke: false });
            sP.rect(g, i - 0.36, g + 100 * B.sh[i], i + 0.36, { fill: 'teal', fillAlpha: 0.55, stroke: false });
            sP.rect(-g, i - 0.36, -g - 100 * STD[i], i + 0.36, { color: 'muted', width: 1, dash: [3, 3] });
            sP.rect(g, i - 0.36, g + 100 * STD[i], i + 0.36, { color: 'muted', width: 1, dash: [3, 3] });
            sP.text(lab, 0, i, { align: 'center', color: 'ink', size: 11 });
            sP.text(`${Math.round(100 * A.sh[i])}%`, -g - 100 * A.sh[i], i, { dx: -4, align: 'right', color: 'purple', size: 10.5 });
            sP.text(`${Math.round(100 * B.sh[i])}%`, g + 100 * B.sh[i], i, { dx: 4, align: 'left', color: 'teal', size: 10.5 });
          });
          sP.text('Seaside', -g - 2, 6.15, { align: 'right', color: 'purple', size: 12.5, weight: 700 });
          sP.text('Milltown', g + 2, 6.15, { align: 'left', color: 'teal', size: 12.5, weight: 700 });
          // ----- age-specific rates (log)
          sR.path(REF.map((r, i) => [i, r]), { color: 'gray', width: 1.6, dash: [5, 4] });
          for (const T of [A, B]) {
            const dx = T === A ? -0.1 : 0.1;
            sR.path(REF.map((r, i) => [i + dx, r * T.th]), { color: T.color, width: 1.4, alpha: 0.6 });
            T.O.forEach((o, i) => { const c = poisCI(M, o), y = (1000 * o) / T.n[i]; sR.line(i + dx, Math.max(0.1, (1000 * c[0]) / T.n[i]), i + dx, (1000 * c[1]) / T.n[i], { color: T.color, width: 1.6 }); if (o > 0) sR.dot(i + dx, y, { r: 3.8, color: T.color }); });
          }
          sR.text('national', 1.1, REF[1], { dy: 14, align: 'left', color: 'muted', size: 11 });
          // ----- expected-deaths table
          const f1 = (x) => (x < 10 ? v.fix(x, 1) : int(x));
          TB.draw({
            value: (i, j) => { const T = j < 3 ? A : B, k = j % 3; if (i < 6) return [int(T.n[i]), f1(T.E[i]), String(T.O[i])][k]; return [int(N), f1(T.Et), String(T.Ot)][k]; },
            fill: (i, j) => (i === 6 ? [j < 3 ? 'purple' : 'teal', 0.18] : j % 3 === 1 ? ['gold', 0.1] : null),
            weight: (i) => (i === 6 ? 700 : 500),
          });
          const [xa] = TB.cellRect(0, 0), [, , xb] = TB.cellRect(0, 2), [xc] = TB.cellRect(0, 3), [, , xd] = TB.cellRect(0, 5);
          sT.text('Seaside', (xa + xb) / 2, 8.75, { align: 'center', color: 'purple', size: 12, weight: 700 });
          sT.text('Milltown', (xc + xd) / 2, 8.75, { align: 'center', color: 'teal', size: 12, weight: 700 });
          sT.line(xa + 0.4, 8.42, xb - 0.4, 8.42, { color: 'purple', width: 1.5 }); sT.line(xc + 0.4, 8.42, xd - 0.4, 8.42, { color: 'teal', width: 1.5 });
          sT.text('E = expected deaths = persons × national rate · O = observed deaths', (xa + xd) / 2, 9.55, { align: 'center', color: 'muted', size: 11 });
          // ----- three comparisons
          const X0 = 55, X1 = 82, rows = [
            { key: 'crude', title: 'crude death rate (per 1 000)', lo: 0, hi: 1.12 * Math.max(A.crude + 2 * A.cse, B.crude + 2 * B.cse, 1), get: (T) => [T.crude, T.crude - 1.96 * T.cse, T.crude + 1.96 * T.cse] },
            { key: 'direct', title: 'age-standardized rate, direct (per 1 000)', lo: 0, hi: 1.12 * Math.max(A.direct + 2 * A.dse, B.direct + 2 * B.dse, 1), get: (T) => [T.direct, T.direct - 1.96 * T.dse, T.direct + 1.96 * T.dse] },
            { key: 'smr', title: 'SMR = observed ÷ expected (indirect)', log: true, lo: 0.3, hi: 3.3, get: (T) => [T.smr, T.lo, T.hi] },
          ];
          const verdicts = {};
          rows.forEach((R, k) => {
            const y = 8.1 - k * 3.05, X = (val) => X0 + ((X1 - X0) * (R.log ? Math.log(Math.max(val, R.lo) / R.lo) / Math.log(R.hi / R.lo) : (Math.max(val, R.lo) - R.lo) / (R.hi - R.lo)));
            sT.text(R.title, X0, y + 1.05, { align: 'left', color: 'ink', size: 11.5, weight: 600 });
            sT.line(X0, y, X1, y, { color: 'faint', width: 1.2 });
            const tk = R.log ? [0.5, 1, 2] : [R.lo, (R.lo + R.hi) / 2, R.hi];
            for (const t of tk) { sT.line(X(t), y - 0.15, X(t), y + 0.15, { color: 'faint', width: 1 }); sT.text(R.log ? String(t) : v.fix(t, t < 10 ? 1 : 0), X(t), y - 0.25, { baseline: 'top', align: 'center', color: 'muted', size: 10 }); }
            if (R.log) sT.line(X(1), y - 0.45, X(1), y + 0.45, { color: 'muted', width: 1.2, dash: [2, 2] });
            [A, B].forEach((T, m) => { const [c, l, h] = R.get(T), yy = y + (m ? -0.32 : 0.32); sT.line(X(l), yy, X(h), yy, { color: T.color, width: 2 }); sT.dot(X(c), yy, { r: 4.5, color: T.color }); });
            const worse = R.get(A)[0] > R.get(B)[0] ? A : B; verdicts[R.key] = worse;
            sT.text(`${worse.name} looks worse`, X1 + 2, y, { align: 'left', color: worse.color, size: 12, weight: 700 });
          });
          st = { A, B, verdicts };
        });
        v.legend([['purple', 'Seaside (old)'], ['teal', 'Milltown (young)'], ['gray', 'national rates / standard population', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { A, B, verdicts: V } = st, r = (x) => v.fix(x, 1), s2 = (T) => `${v.fix(T.smr, 2)} (${v.fix(T.lo, 2)}–${v.fix(T.hi, 2)})`;
          const flip = V.crude !== V.smr;
          return `crude: Seaside ${r(A.crude)} vs Milltown ${r(B.crude)} per 1 000 → **${V.crude.name}** looks worse · age-standardized (direct): ${r(A.direct)} vs ${r(B.direct)} → **${V.direct.name}** · SMR: Seaside $${A.Ot}/${v.fix(A.Et, 1)}$ = ${s2(A)}, Milltown $${B.Ot}/${v.fix(B.Et, 1)}$ = ${s2(B)} → **${V.smr.name}** (true rate ratios ${v.fix(A.th, 2)} and ${v.fix(B.th, 2)})` + (flip ? ' · the crude ranking is reversed by age structure alone' : ' · here crude and standardized comparisons agree');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Period life tables and life expectancy',
      credit: 'Graunt, 1662; Halley, 1693',
      statement: String.raw`A **period life table** follows a hypothetical (synthetic) cohort of newborns through the age-specific death rates $m_x$ observed in one calendar period. From $m_x$ it derives the probability of dying within each year of age $q_x$, the survivors $l_x$ (with $l_0 = 1$), the deaths $d_x = l_x - l_{x+1}$, the person-years lived $L_x$ and their tail sums $T_x$. **Life expectancy** at age $x$ is
$$e_x = \frac{T_x}{l_x} = \frac{1}{l_x}\int_x^\infty l(a)\,da,$$
the area under the survivorship curve beyond $x$, per survivor. $e_0$ equals the mean age at death in the synthetic cohort. It summarizes current mortality; it is not a forecast for anyone born today, whose rates will change as they age.`,
      idea: String.raw`Each year of age converts a death rate into a probability of surviving the year ($e^{-m_x}$ for a constant rate, as in 1.5), and multiplying these gives $l_x$. A newborn lives $\int_0^\infty l$ years on average — every person counted in $l(a)$ contributes one person-year at age $a$ — so life expectancy is an area. Deaths in infancy remove almost a whole lifetime of area each, which is why historical life expectancies of 35–45 years coexisted with many people living to 70: lowering infant mortality raises $e_0$ a great deal and leaves $e_{20}$, which only counts those who already survived childhood, nearly unchanged.

The area identity is the tail-moment theorem prob-2.2.13 at power one. For synthetic age at death $A\ge0$, survivorship is $l(a)=P(A>a)$, so $E[A]=\int_0^\infty l(a)\,da$. Conditional on surviving to age $x$ with $l(x)>0$, remaining lifetime has tail $l(x+u)/l(x)$; integrating over $u\ge0$ gives $e_x=T_x/l_x$. The identity allows an infinite mean if the tail area diverges and remains a period-table calculation, not a forecast of future rates.`,
      caption: String.raw`Set infant mortality and the adult death rate. Left: the survivorship curve with its area shaded — the area *is* $e_0$; drag the point to any age $a$ to see the remaining area per survivor, $e_a$, and the expected age at death $a + e_a$. Right: the ages at death of 2 000 simulated newborns (bars) against the life table's $d_x$, or the death rates on a log scale. *Keep as baseline* freezes the current table (dashed) so you can compare: cut infant mortality from 150 to 10 per 1 000 and compare the gains in $e_0$ and $e_{20}$.`,
      deps: ['epi-1.6', 'mathbio-4.1', 'prob-2.2.13'],
      see: ['demo-2.3', 'demo-2.4'],
      refs: ['Gordis ch. 4'],
      tags: ['life table', 'life expectancy', 'mortality'],
      scope: String.raw`A period life table assumes today's age-specific rates hold throughout the synthetic cohort's life. With mortality falling, real cohorts live longer than the period $e_0$ suggests.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Life_table' },
      viz(v) {
        const M = v.M, AMAX = 110, NS = 2000;
        const sS = v.stage({ x: [0, 105], y: [0, 1.06], height: 330, axes: 'box', xlabel: 'age', weight: 1.2, title: 'survivorship $l(x)$ — its area is $e_0$' });
        const sD = v.stage({ x: [0, 105], y: [0, 0.05], height: 330, axes: 'box', xlabel: 'age', weight: 1, minWidth: 250 });
        const q0S = v.slider('infant mortality $q_0$ (per 1 000 births)', 2, 300, 150, { log: true, fmt: (x) => x.toFixed(0) });
        const m60S = v.slider('death rate at age 60 (per 1 000 per year)', 3, 50, 25, { log: true, fmt: (x) => x.toFixed(1) });
        const view = v.select('right panel', [{ value: 'deaths', label: 'ages at death' }, { value: 'rates', label: 'death rates (log)' }], 'deaths');
        const sched = () => deathRates(q0S.value, m60S.value, AMAX);
        let base = null; v.button('Keep as baseline', () => { base = sched(); });
        base = sched();
        const U = uniforms(M, 91, NS);
        const H = s0();
        function s0() { return sS.handle(20, 0.8, { color: 'accent', constrain: (x) => { const a = M.clamp(x, 0, 100); const m = sched(); return [a, lAt(lifeTable(m), m, a)]; } }); }
        let st = null;
        v.render(() => {
          const m = sched(), lt = lifeTable(m), bt = lifeTable(base), a = H.x, la = lAt(lt, m, a), ea = eAt(lt, m, a);
          H.y = la;
          const L = (x) => lAt(lt, m, x);
          // ----- left: survivorship and its area
          sS.fn(L, { domain: [0, 105], fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 0.01 });
          sS.fn(L, { domain: [a, 105], fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 0.01 });
          sS.fn((x) => lAt(bt, base, x), { domain: [0, 105], color: 'gray', width: 1.6, dash: [5, 4] });
          sS.fn(L, { domain: [0, 105], color: 'accent', width: 2.6 });
          sS.text(`area = e₀ = ${v.fix(lt.e[0], 1)} years`, 9, 0.22, { align: 'left', color: 'accent', size: 12.5, weight: 700 });
          sS.line(a, 0, a, la, { color: 'accent', width: 1, dash: [3, 3] });
          const ad = Math.min(104, a + ea);
          sS.arrow(a, 0.06, ad, 0.06, { color: 'gold', width: 2, head: 7 });
          sS.dot(ad, 0.06, { r: 4, color: 'gold' });
          sS.text(`a + eₐ = ${v.fix(a + ea, 1)}`, ad, 0.06, { dy: -12, align: ad > 80 ? 'right' : 'center', color: 'gold', size: 11.5, weight: 600 });
          sS.text(`e(${Math.round(a)}) = ${v.fix(ea, 1)} y`, a, la, { dx: 10, dy: -12, align: 'left', color: 'accent', size: 11.5, weight: 600 });
          // ----- right: ages at death, or rates
          const deaths = Array.from(U, (u) => { let k = 0; while (k < lt.n && lt.l[k + 1] > u) k++; return k >= lt.n ? AMAX : k + Math.log(lt.l[k] / u) / Math.max(m[k], 1e-9); });
          const mean = deaths.reduce((x, y) => x + y, 0) / NS;
          let mode = 10; for (let x = 10; x < AMAX; x++) if (lt.l[x] - lt.l[x + 1] > lt.l[mode] - lt.l[mode + 1]) mode = x;
          if (view.value === 'deaths') {
            Object.assign(sD.o, { ylog: false }); sD.setView([0, 105], [-0.003, 0.05]); sD.setTitle('ages at death: 2 000 simulated newborns vs $d_x$');
            const hs = M.histogram(deaths, { bins: 105, range: [0, 105] });
            sD.hist({ edges: hs.edges, counts: hs.counts.map((c) => Math.min(c / NS, 0.0495)) }, { color: 'red', fillAlpha: 0.3, width: 1 });
            sD.path(Array.from({ length: 105 }, (_, x) => [x + 0.5, Math.min(lt.l[x] - lt.l[x + 1], 0.0495)]), { color: 'ink', width: 1.8 });
            const d0 = lt.l[0] - lt.l[1];
            if (d0 > 0.05) sD.text(`infant deaths: ${Math.round(1000 * d0)} per 1 000 ↑`, 0, 0.0428, { dx: 36, align: 'left', color: 'red', size: 11.5, weight: 600 });
            sD.vline(lt.e[0], { color: 'accent', width: 1.6, dash: [5, 4] });
            sD.text(`mean = e₀`, lt.e[0], 0.034, { dx: lt.e[0] > 60 ? -5 : 5, align: lt.e[0] > 60 ? 'right' : 'left', color: 'accent', size: 11.5, weight: 600 });
            sD.dot(mode + 0.5, Math.min(lt.l[mode] - lt.l[mode + 1], 0.0495), { r: 4, color: 'ink' });
            sD.corner(`most common adult age at death: ${mode}`, 'tr', { color: 'ink', size: 11.5 });
          } else {
            Object.assign(sD.o, { ylog: true }); sD.setView([0, 105], [1e-4, 1]); sD.setTitle('death rates $m_x$ per year (log scale)');
            sD.path(base.slice(0, 106).map((y, x) => [x + 0.5, y]), { color: 'gray', width: 1.6, dash: [5, 4] });
            sD.path(m.slice(0, 106).map((y, x) => [x + 0.5, y]), { color: 'red', width: 2.4 });
          }
          st = { e0: lt.e[0], e20: eAt(lt, m, 20), b0: bt.e[0], b20: eAt(bt, base, 20), a, ea, mean, mode, l20: lAt(lt, m, 20) };
        });
        v.legend([['accent', 'survivorship $l(x)$, area = life expectancy'], ['gray', 'baseline', { dash: true }], ['red', 'simulated ages at death / death rates'], ['ink', 'life-table deaths $d_x$']]);
        v.readout(() => {
          if (!st) return '';
          const { e0, e20, b0, b20, a, ea, mean, mode, l20 } = st, d = (x) => `${x >= 0 ? '+' : '−'}${v.fix(Math.abs(x), 1)}`;
          return `$e_0 = ${v.fix(e0, 1)}$ years (2 000 simulated newborns: mean age at death ${v.fix(mean, 1)}) · ${pc(l20, 0)} reach 20, and then expect $e_{20} = ${v.fix(e20, 1)}$ more years · at age ${v.fix(a, 0)}: $e_a = ${v.fix(ea, 1)}$ → expected age at death ${v.fix(a + ea, 1)} · vs baseline: $e_0$ **${d(e0 - b0)}** y, $e_{20}$ **${d(e20 - b20)}** y · most common adult age at death ${mode}, whatever $e_0$ says`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Lexis diagram: age, period and cohort',
      credit: 'Wilhelm Lexis, 1875 (after Zeuner, 1869, and Becker, 1874)',
      statement: String.raw`A **Lexis diagram** plots calendar time horizontally and age vertically, on equal scales. Each person is a **lifeline** of slope $1$ that starts on the time axis at birth and ends at death or at the end of observation; events are points on lifelines and person-time is length along them. The same events and person-time can then be grouped three ways:
- an **age group** is a horizontal band,
- a **period** (calendar interval) is a vertical band,
- a **birth cohort** is a diagonal band between two lines of slope $1$.
The rate for any such region is the number of events in it divided by the person-time inside it (1.2). Because age $=$ period $-$ year of birth, the three time scales are tied together: an influence acting at a moment in history appears as a vertical stripe, one carried by a generation as a diagonal stripe.`,
      idea: String.raw`Every death has three coordinates — when it happened, how old the person was, and when they were born — but only two are free, which is exactly what a plane with diagonal lifelines encodes. Tabulating deaths and person-years in squares of the diagram gives an age-by-period table of rates; reading it along rows, columns or diagonals answers different questions (how risk varies with age in one year, how one age group's risk changed over history, how one generation fared as it aged). Distinguishing effects of age, period and cohort is possible only when a pattern clearly follows one direction; in general the three cannot be separated (the identification problem, demo 1.6).`,
      caption: String.raw`The background colours are death rates per 1 000 person-years in each 5-year × 5-year square, computed from a simulated population with 20 000 births in every year since 1800 (thin lines: a sample of individual lifelines, red dots = deaths). Add a 1918 pandemic or extra mortality in the generation born 1920–34 and look for a vertical or a diagonal stripe. Choose how to read the diagram and drag the gold point: the highlighted band's rates are plotted on the right, against the other bands of the same kind in grey.`,
      deps: ['epi-1.2'],
      see: ['demo-1.5', 'demo-1.6'],
      refs: ['Rothman ch. 3'],
      tags: ['lexis diagram', 'cohort', 'rates'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lexis_diagram' },
      viz(v) {
        const M = v.M, P0 = 1900, P1 = 2020, AMAX = 100, C = 5, NP = 24, NA = 20, B0 = 1800, NCB = 44, BIRTHS = 20000;
        const s = v.stage({ x: [1893, 2052], y: [0, AMAX], equal: true, height: 410, axes: 'box', weight: 1.55, ylabel: 'age', xticks: [1900, 1920, 1940, 1960, 1980, 2000, 2020], yticks: [0, 20, 40, 60, 80, 100] });
        const g = v.stage({ x: [P0, P1], y: [0.2, 600], ylog: true, height: 410, axes: 'box', weight: 1, minWidth: 250 });
        const eff = v.select('extra mortality', [{ value: 'none', label: 'none' }, { value: 'period', label: '1918 pandemic' }, { value: 'cohort', label: 'born 1920–34' }], 'cohort');
        const dir = v.select('read along', [{ value: 'age', label: 'an age band' }, { value: 'period', label: 'a period' }, { value: 'cohort', label: 'a birth cohort' }], 'age');
        const H = s.handle(1987, 67, { color: 'gold', constrain: (x, y) => [M.clamp(x, P0 + 0.5, P1 - 0.5), M.clamp(y, 0.5, AMAX - 0.5)] });
        const sims = memo();
        const sim = (e) => sims(e, () => {
          const r = M.rng(101), D = new Float64Array(NP * NA), PY = new Float64Array(NP * NA), CD = new Float64Array(NCB * NA), CPY = new Float64Array(NCB * NA), lines = [];
          const haz = (a, p, b) => {
            let h = 0.1 * Math.exp(-0.9 * a - 0.035 * (p - 1900)) + (0.0015 + 3e-5 * Math.exp(0.095 * a)) * Math.exp(-0.01 * (p - 1900));
            if (e === 'period' && p >= 1918 && p < 1919) h *= 1.5 + 8 * Math.exp(-(((a - 28) / 10) ** 2));
            if (e === 'cohort' && b >= 1920 && b < 1935 && a >= 20) h *= 2.4;
            return h;
          };
          // 20 000 births in every year since 1800, followed year of age by year of age with binomial deaths
          for (let y = B0; y < P1; y++) {
            let n = BIRTHS;
            for (let a = 0; a < AMAX && n > 0; a++) {
              const pm = y + a + 1, q = 1 - Math.exp(-haz(a + 0.5, pm, y + 0.5)); if (pm >= P1) break;
              let d = 0;
              if (n < 200) { for (let k = 0; k < n; k++) if (r() < q) d++; } else d = Math.max(0, Math.min(n, Math.round(n * q + Math.sqrt(n * q * (1 - q)) * r.normal())));
              if (pm >= P0) { const ai = Math.floor((a + 0.5) / C), k = Math.floor((pm - P0) / C) * NA + ai, kc = Math.floor((y - B0) / C) * NA + ai; PY[k] += n - d / 2; D[k] += d; CPY[kc] += n - d / 2; CD[kc] += d; }
              n -= d;
            }
          }
          // a sample of individual lives, for the lifelines
          for (let i = 0; i < 34; i++) {
            const b = 1812 + 6 * i + 4 * r(); let a = 0, dead = -1;
            while (b + a < P1 && a < AMAX) { if (r() < 1 - Math.exp(-haz(a + 0.5, b + a + 0.5, b))) { dead = a + r(); break; } a++; }
            const end = dead >= 0 ? b + dead : Math.min(P1, b + AMAX);
            if (end > P0) { const sp = Math.max(b, P0); lines.push({ p0: sp, a0: sp - b, p1: end, a1: end - b, died: dead >= 0 }); }
          }
          return { D, PY, CD, CPY, lines };
        });
        const rate = (d, py) => (py > 3000 ? (1000 * Math.max(d, 0.5)) / py : NaN);
        let st = null;
        v.render(() => {
          const S = sim(eff.value), mode = dir.value;
          // ----- heat map of rates in Lexis squares
          s.heat((x, y) => { if (x < P0 || x >= P1 || y < 0 || y >= AMAX) return NaN; const k = Math.floor((x - P0) / C) * NA + Math.floor(y / C); return Math.log10(rate(S.D[k], S.PY[k])); }, { range: [-0.6, 2.7], cmap: 'viridis', key: eff.value, res: 2, alpha: 0.82 });
          for (const L of S.lines) { s.line(L.p0, L.a0, L.p1, L.a1, { color: 'panel', width: 0.9, alpha: 0.5 }); if (L.died) s.dot(L.p1, L.a1, { r: 2.6, color: 'red', ring: true }); }
          s.colorbar([-0.6, 2.7], 'viridis', { pos: 'right', length: 0.55, ticks: [0, 1, 2], fmt: (t) => ['1', '10', '100'][t], label: 'per 1 000' });
          if (eff.value === 'period') s.text('1918', 1918.7, 102, { align: 'center', baseline: 'bottom', color: 'red', size: 11, weight: 600 });
          // ----- the selected band
          const ai = Math.min(NA - 1, Math.floor(H.y / C)), ci = Math.min(NP - 1, Math.floor((H.x - P0) / C)), cb = Math.floor((H.x - H.y - B0) / C), c0 = B0 + C * cb;
          let D = 0, PY = 0, label, xs, sel, others = [];
          if (mode === 'age') {
            s.rect(P0, C * ai, P1, C * ai + C, { color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.12 });
            for (let c = 0; c < NP; c++) { D += S.D[c * NA + ai]; PY += S.PY[c * NA + ai]; }
            label = `ages ${C * ai}–${C * ai + 4}`;
            xs = Array.from({ length: NP }, (_, c) => P0 + C * c + 2.5);
            sel = xs.map((x, c) => [x, rate(S.D[c * NA + ai], S.PY[c * NA + ai])]);
            for (let a = 0; a < NA; a++) if (a !== ai) others.push(xs.map((x, c) => [x, rate(S.D[c * NA + a], S.PY[c * NA + a])]));
            g.setView([P0, P1], [0.2, 600]); g.setTitle(`rates in the band ${label}, by period`);
          } else if (mode === 'period') {
            s.rect(P0 + C * ci, 0, P0 + C * ci + C, AMAX, { color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.12 });
            for (let a = 0; a < NA; a++) { D += S.D[ci * NA + a]; PY += S.PY[ci * NA + a]; }
            label = `years ${P0 + C * ci}–${P0 + C * ci + 4}`;
            xs = Array.from({ length: NA }, (_, a) => C * a + 2.5);
            sel = xs.map((x, a) => [x, rate(S.D[ci * NA + a], S.PY[ci * NA + a])]);
            for (let c = 0; c < NP; c++) if (c !== ci) others.push(xs.map((x, a) => [x, rate(S.D[c * NA + a], S.PY[c * NA + a])]));
            g.setView([0, AMAX], [0.2, 600]); g.setTitle(`rates in ${label}, by age`);
          } else {
            s.clip(() => s.poly([[c0, 0], [c0 + C, 0], [c0 + C + AMAX, AMAX], [c0 + AMAX, AMAX]], { color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.12 }), [P0, P1], [0, AMAX]);
            for (let a = 0; a < NA; a++) { D += S.CD[cb * NA + a]; PY += S.CPY[cb * NA + a]; }
            label = `the cohort born ${c0}–${c0 + 4}`;
            xs = Array.from({ length: NA }, (_, a) => C * a + 2.5);
            sel = xs.map((x, a) => [x, rate(S.CD[cb * NA + a], S.CPY[cb * NA + a])]);
            for (let k = 8; k < NCB; k += 1) if (k !== cb) others.push(xs.map((x, a) => [x, rate(S.CD[k * NA + a], S.CPY[k * NA + a])]));
            g.setView([0, AMAX], [0.2, 600]); g.setTitle(`rates of ${label}, by age`);
          }
          for (const o of others) g.path(o, { color: 'gray', width: 1, alpha: 0.35 });
          g.path(sel, { color: 'accent', width: 2.6 });
          g.dots(sel.filter((p) => isFinite(p[1])), { r: 3, color: 'accent' });
          g.text('per 1 000 person-years', g.bounds.x[0], 450, { dx: 30, align: 'left', color: 'muted', size: 11 });
          st = { D, PY, label, mode, e: eff.value };
        });
        v.legend([['panel', 'lifelines (sample)'], ['red', 'death', { dot: true }], ['gold', 'selected band', { area: true }], ['accent', 'rates along it'], ['gray', 'other bands of the same kind']]);
        v.readout(() => {
          if (!st) return '';
          const { D, PY, label, mode, e } = st;
          const hint = e === 'period' ? 'the pandemic is a **vertical** stripe: every age band shows it in the same column, every cohort at a different age' : e === 'cohort' ? 'the extra risk is a **diagonal** stripe: each age band meets it in a later period the older the band, and only one cohort carries it all its life' : 'without an extra effect, rates rise with age and fall steadily over the century';
          return `${label}: ${int(D)} deaths in ${int(PY)} person-years → **${v.fix((1000 * D) / Math.max(PY, 1), 2)} per 1 000 per year** (reading along ${mode === 'age' ? 'a row' : mode === 'period' ? 'a column' : 'a diagonal'}) · ${hint}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Concept',
      name: 'Epidemic curves and attack rates',
      credit: 'John Snow, 1854–55 (spot map, epidemic curve and attack rates by water supply)',
      statement: String.raw`An **epidemic curve** is a histogram of an outbreak's cases by date of onset. Its shape reflects how the outbreak spreads:
- a **point-source** outbreak, with everyone exposed at about the same time, gives a single sharp peak spread over about the range of the incubation period;
- a **continuing common source** gives a plateau that lasts as long as the exposure and ends about one incubation period after the source is removed;
- a **propagated** (person-to-person) outbreak gives successive, growing waves spaced by the serial interval.
The **attack rate** of a group is its incidence proportion (1.1) over the outbreak: cases divided by the people at risk. Comparing attack rates between people exposed and not exposed to each candidate source — a food, a well, a contact — points to the source: high among the exposed, low among the unexposed. A spot map of cases adds the third classic view, place, to time (the curve) and person (the attack rates).`,
      idea: String.raw`If everyone is infected at one moment, onsets are the incubation period's distribution shifted to that moment — hence one peak whose width is the incubation spread; removing the source after the peak changes nothing, because everyone exposed is already infected. A source that keeps infecting adds a new copy of that distribution every day, giving a plateau that stops one incubation period after the exposure ends. When cases infect others, each generation follows the last by roughly the incubation period, so the curve comes in waves, and the attack rate no longer depends on which source people used. Attack rates turn the map's visual cluster into a number — the ratio of attack rates in users and non-users of a source is a risk ratio — but a contagious disease clusters in space too, so neighbourhood and water must be separated: Snow's decisive cases were distant households that drank from the Broad Street pump and nearby institutions with wells of their own.`,
      caption: String.raw`A simulated town of about 1 500 people and five pumps; most households use the nearest pump (thin grey lines bound the pumps' areas). Press play and watch the days pass: each case is drawn as a bar at its house, as on Snow's map (gold = fell ill today), while the epidemic curve fills in. Click a pump to contaminate it (or, person to person, a house to place the first case), move the day the pump handle is removed, and compare the three kinds of outbreak. Below: the attack rate among each pump's users, and Snow's test — the pump's users who live elsewhere against its neighbours who fetch water from another pump. A little sporadic illness unrelated to the outbreak is mixed in, as in real data.`,
      deps: ['epi-1.1'],
      see: ['epi-4.4'],
      refs: ['Gordis ch. 2'],
      tags: ['outbreaks', 'attack rate'],
      viz(v) {
        const M = v.M, DAYS = 40, SX = [0.8, 3.3, 5.8, 8.3, 10.8], SY = [1.1, 3.0, 4.9, 6.8];
        const PUMPS = [[4.55, 4.9], [9.55, 4.9], [2.05, 1.1], [7.05, 1.1], [7.05, 6.8]];
        const sm = v.stage({ x: [0.25, 11.35], y: [0.45, 7.45], equal: true, axes: false, height: 330, weight: 1.2, title: 'spot map: a bar for each case at its house' });
        const se = v.stage({ x: [0, DAYS], y: [0, 10], height: 330, axes: 'box', weight: 1, minWidth: 250, title: 'epidemic curve: cases by day of onset' });
        const sa = v.stage({ x: [0, 100], y: [0, 10], height: 165, axes: false, full: true });
        const rem = v.slider('pump handle removed on day', 1, DAYS, 8, { step: 1 });
        const inc = v.slider('median incubation (days)', 1, 7, 2, { step: 0.5 });
        const type = v.select('outbreak', [{ value: 'point', label: 'point source' }, { value: 'cont', label: 'continuing source' }, { value: 'prop', label: 'person to person' }], 'point', { onChange: (t) => { inc.set(t === 'prop' ? 5 : 2); rem.set(t === 'cont' ? 20 : 8); } });
        let seed = 1, src = 0, idx = null; v.button('New outbreak', () => { seed++; });
        const town = (() => {
          const r = M.rng(5), houses = [], K = M.dist.poisson(2.6);
          const add = (x, y, nx, ny) => houses.push({ x, y, nx, ny, k: 1 + K.sample(r) });
          for (const y of SY) for (let x = 0.55; x < 11.1; x += 0.27) { if (SX.some((sx) => Math.abs(x - sx) < 0.3)) continue; add(x, y + 0.2, 0, 1); add(x, y - 0.2, 0, -1); }
          for (const x of SX) for (let y = 0.6; y < 7.3; y += 0.27) { if (SY.some((sy) => Math.abs(y - sy) < 0.3)) continue; add(x + 0.2, y, 1, 0); add(x - 0.2, y, -1, 0); }
          const res = [];
          houses.forEach((h, hi) => {
            const d = PUMPS.map(([px, py]) => Math.hypot(px - h.x, py - h.y)); h.near = d.indexOf(Math.min(...d)); h.res = [];
            for (let j = 0; j < h.k; j++) { h.res.push(res.length); res.push({ h: hi, pump: r() < 0.85 ? h.near : r.int(0, 4) }); }
          });
          houses.forEach((h) => { h.nb = []; houses.forEach((q, qi) => { if (Math.hypot(q.x - h.x, q.y - h.y) < 0.75) h.nb.push(qi); }); });
          return { houses, res };
        })();
        const users = PUMPS.map((_, p) => town.res.filter((q) => q.pump === p).length);
        let lastBg = null;
        const outbreaks = memo();
        const run = () => outbreaks(`${type.value}|${src}|${idx}|${rem.value}|${inc.value}|${seed}`, () => {
          const r = M.rng(1000 + seed * 31), { houses, res } = town, n = res.length, on = new Float64Array(n).fill(Infinity), bgFlag = (lastBg = new Uint8Array(n)), med = inc.value, R = rem.value, kind = type.value;
          const incub = (sd) => med * Math.exp(sd * r.normal());
          if (kind === 'point') { for (let i = 0; i < n; i++) if (res[i].pump === src && r() < 0.3) { const t = r() * Math.min(1, R); on[i] = t + incub(0.45); } }
          else if (kind === 'cont') { for (let i = 0; i < n; i++) if (res[i].pump === src) { const t = -Math.log(1 - r()) / 0.016; if (t < Math.min(R, DAYS)) on[i] = t + incub(0.45); } }
          else {
            const i0 = idx ?? houses[Math.floor(houses.length * 0.37)].res[0], inf = new Float64Array(n).fill(Infinity), heap = [[0, i0]]; inf[i0] = 0;
            const push = (it) => { heap.push(it); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
            const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, rr = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
            while (heap.length) {
              const [t, i] = pop(); if (t > inf[i] || t > DAYS) continue;
              const o = t + incub(0.25); on[i] = o; const hi = res[i].h;
              for (const qi of houses[hi].nb) for (const j of houses[qi].res) { if (j === i || inf[j] <= o) continue; if (r() < (qi === hi ? 0.3 : 0.028)) { const tj = o + 1.5 * r(); if (tj < inf[j]) { inf[j] = tj; push([tj, j]); } } }
            }
          }
          for (let i = 0; i < n; i++) if (r() < 0.006) { const t = DAYS * r(); if (t < on[i]) { on[i] = t; bgFlag[i] = 1; } }
          return on;
        });
        sm.onClick((x, y) => {
          if (type.value === 'prop') { let best = 0, bd = Infinity; town.houses.forEach((h, hi) => { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = hi; } }); idx = town.houses[best].res[0]; }
          else { const d = PUMPS.map(([px, py]) => Math.hypot(px - x, py - y)); src = d.indexOf(Math.min(...d)); }
        });
        const vorKey = () => `vor|${v.color('faint')}`;
        let st = null;
        v.animate((t) => {
          const on = run(), bg = lastBg, kind = type.value, R = rem.value, day = Math.min(DAYS, (DAYS * t) / 10.5), { houses, res } = town;
          // ----- map
          const fc = v.rgb('faint');
          sm.raster((x, y) => { const d = PUMPS.map(([px, py]) => Math.hypot(px - x, py - y)).sort((a, b) => a - b); return d[1] - d[0] < 0.035 ? [fc[0], fc[1], fc[2], 150] : null; }, { key: vorKey(), res: 1 });
          for (const y of SY) sm.line(0.3, y, 11.3, y, { color: 'gray', width: 8, alpha: 0.16, cap: 'butt' });
          for (const x of SX) sm.line(x, 0.5, x, 7.4, { color: 'gray', width: 8, alpha: 0.16, cap: 'butt' });
          sm.dots(houses.map((h) => [h.x, h.y]), { r: 1.2, color: 'faint' });
          let cases = 0; const daily = new Array(DAYS).fill(0), dailyAll = new Array(DAYS).fill(0), byPump = PUMPS.map(() => 0);
          for (let i = 0; i < res.length; i++) { const o = on[i]; if (o < DAYS) { dailyAll[Math.floor(o)]++; if (o <= day) { daily[Math.floor(o)]++; cases++; byPump[res[i].pump]++; } } }
          houses.forEach((h) => {
            let j = 0;
            const mine = h.res.map((i) => on[i]).filter((o) => o <= day).sort((a, b) => a - b);
            for (const o of mine) {
              if (j > 10) break; const d = 0.12 + 0.07 * j, cx = h.x + h.nx * d, cy = h.y + h.ny * d, tx = -h.ny * 0.1, ty = h.nx * 0.1;
              sm.line(cx - tx, cy - ty, cx + tx, cy + ty, { color: day - o < 1 ? 'gold' : 'red', width: 2.4, cap: 'butt' }); j++;
            }
          });
          PUMPS.forEach(([px, py], p) => {
            const isSrc = kind !== 'prop' && p === src, off = isSrc && day >= R;
            sm.dot(px, py, { r: 6, color: isSrc ? 'red' : 'blue', label: `P${p + 1}`, labelPos: 'ne' });
            if (off) { sm.line(px - 0.17, py - 0.17, px + 0.17, py + 0.17, { color: 'ink', width: 2.4 }); sm.line(px - 0.17, py + 0.17, px + 0.17, py - 0.17, { color: 'ink', width: 2.4 }); }
          });
          if (kind === 'prop') { const i0 = idx ?? houses[Math.floor(houses.length * 0.37)].res[0], h = houses[res[i0].h]; sm.circle(h.x, h.y, 0.22, { color: 'gold', width: 2.2 }); }
          sm.corner(`day ${Math.floor(day)}`, 'tl', { color: 'ink', size: 13, weight: 700 });
          // ----- epidemic curve
          const top = Math.max(4, Math.max(...dailyAll) * 1.18);
          se.setView([0, DAYS], [-0.07 * top, top]);
          for (let d = 0; d < DAYS; d++) if (daily[d]) se.rect(d + 0.08, 0, d + 0.92, daily[d], { fill: d === Math.floor(day) ? 'gold' : 'red', fillAlpha: 0.75, stroke: false });
          if (kind !== 'prop') { se.vline(R, { color: 'ink', width: 1.4, dash: [5, 4] }); se.text('handle removed', R, top * 0.93, { dx: 4, align: 'left', color: 'ink', size: 11 }); }
          se.vline(day, { color: 'gold', width: 1.4 });
          // ----- attack rates by pump used, and Snow's test for the pump with the highest attack rate
          const ARf = PUMPS.map((_, p) => res.filter((q, i) => q.pump === p && on[i] < DAYS).length / users[p]);
          const focus = kind === 'prop' ? ARf.indexOf(Math.max(...ARf)) : src;
          const grp = (f) => { let c = 0, n = 0, cf = 0; res.forEach((q, i) => { if (!f(q)) return; n++; if (on[i] <= day) c++; if (on[i] < DAYS) cf++; }); return { c, n, ar: n ? c / n : 0, arF: n ? cf / n : 0 }; };
          const far = grp((q) => q.pump === focus && houses[q.h].near !== focus), near = grp((q) => q.pump !== focus && houses[q.h].near === focus);
          const amax = Math.max(0.02, ...ARf, far.arF, near.arF) * 1.12, Hb = (ar) => (5.2 * ar) / amax, Y0 = 2.3;
          sa.text('attack rate among each pump’s users (cases so far ÷ users; dashed = by the end)', 1, 9.3, { align: 'left', color: 'ink', size: 12, weight: 600 });
          const bar = (x, w, ar, arF, col, lab, sub) => {
            sa.rect(x - w, Y0, x + w, Y0 + Hb(arF), { color: 'faint', width: 1, dash: [3, 3] });
            if (ar > 0) sa.rect(x - w, Y0, x + w, Y0 + Hb(ar), { fill: col, fillAlpha: 0.6, stroke: false });
            sa.text(pc(ar), x, Y0 + Math.max(Hb(ar), Hb(arF)), { dy: -3, align: 'center', baseline: 'bottom', color: 'ink', size: 11.5, weight: 600 });
            sa.text(lab, x, 1.55, { align: 'center', color: col, size: 11.5, weight: 700 });
            sa.text(sub, x, 0.6, { align: 'center', color: 'muted', size: 10.5 });
          };
          PUMPS.forEach((_, p) => { const isSrc = kind !== 'prop' && p === src; bar(5 + 11.5 * p, 3.2, byPump[p] / users[p], ARf[p], isSrc ? 'red' : 'blue', `P${p + 1}`, `${byPump[p]}/${users[p]}`); });
          sa.line(61, 0.4, 61, 9.6, { color: 'grid', width: 1.2 });
          sa.text(`Snow’s test for P${focus + 1}`, 63, 9.3, { align: 'left', color: 'ink', size: 12, weight: 600 });
          bar(72, 4, far.ar, far.arF, 'purple', `use P${focus + 1}, live elsewhere`, `${far.c}/${far.n}`);
          bar(90, 4, near.ar, near.arF, 'teal', `live near P${focus + 1}, other pump`, `${near.c}/${near.n}`);
          const sU = byPump[src], sN = users[src], oU = cases - sU, oN = res.length - sN;
          let first = Infinity, last = -Infinity, peak = 0; for (let i = 0; i < res.length; i++) if (on[i] < DAYS && !bg[i]) { first = Math.min(first, on[i]); last = Math.max(last, on[i]); }
          for (let d = 0; d < DAYS; d++) if (dailyAll[d] > dailyAll[peak]) peak = d;
          st = { day, cases, kind, R, src, focus, far, near, ar1: sU / sN, ar0: oN ? oU / oN : 0, sU, sN, oU, oN, first, last, peak, total: dailyAll.reduce((x, y) => x + y, 0), med: inc.value };
        }, { period: 13, still: 12.6 });
        v.legend([['red', 'case (bar at its house)'], ['gold', 'fell ill today'], ['blue', 'pump', { dot: true }], ['red', 'contaminated pump', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { day, cases, kind, R, src, ar1, ar0, sU, sN, oU, oN, first, last, peak, total, med } = st;
          const shape = kind === 'point' ? `one peak (day ${peak}); onsets span days ${v.fix(first, 1)}–${v.fix(last, 1)}, about the incubation range${R > peak + 1 ? ` — the handle came off on day ${R}, after the peak: the outbreak was already fading` : ''}`
            : kind === 'cont' ? `a plateau while the pump stays in use, ending about ${v.fix(med, 1)} days (one incubation period) after the handle is removed on day ${R}`
            : `growing waves about ${v.fix(med + 0.75, 1)} days apart (one serial interval) as each case infects others`;
          const snow = `Snow's test for P${st.focus + 1}: its users who live elsewhere ${pc(st.far.ar)} vs neighbours who use other pumps ${pc(st.near.ar)}`;
          if (kind === 'prop') return `day ${Math.floor(day)}: ${cases} of ${total} cases so far · ${shape} · P${st.focus + 1}'s users have the highest attack rate only because the chain began near it — ${snow}: the disease follows the neighbourhood, not the water`;
          const ar = `attack rate among users of P${src + 1}: ${sU}/${sN} = ${pc(ar1)} vs ${oU}/${oN} = ${pc(ar0, 2)} among everyone else` + (ar0 > 0 ? ` (ratio ${v.fix(ar1 / ar0, 1)})` : '');
          return `day ${Math.floor(day)}: ${cases} of ${total} cases so far · ${shape} · ${ar} · ${snow}: the disease follows the water`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Event',
      name: 'Graunt’s Bills of Mortality (1662)',
      credit: 'John Graunt, 1662',
      statement: String.raw`In *Natural and Political Observations … upon the Bills of Mortality* (London, 1662) the haberdasher John Graunt analysed decades of the weekly London **Bills of Mortality** — parish counts of christenings and burials, with causes of death reported by the "searchers" who viewed the bodies. He was the first to treat such tallies as data: more boys than girls are christened (about $14$ to $13$); London's burials exceed its christenings, so the city grows by migration from the country; several causes of death recur in strikingly stable proportions from year to year; and plague comes in distinct epidemic years. From the deaths due to diseases of childhood he estimated that about $36$ in $100$ children die before age $6$, and assuming a roughly constant chance of dying in each later decade he drew up the first **life table**: of $100$ born, $64$ are alive at $6$, $40$ at $16$, $25$ at $26$, $16$ at $36$, $10$ at $46$, $6$ at $56$, $3$ at $66$ and $1$ at $76$.`,
      idea: String.raw`Graunt had counts of deaths but no ages at death, so his table is an inference: a share of childhood deaths read off the causes that kill only children, then survival multiplied by about $5/8$ in each decade — a constant hazard, which gives a geometric decline, a straight line on a log scale. Crude as it is, it was the first summary of a population's mortality as survivorship by age (1.9) and implies a life expectancy at birth of about $18$ years, the area under his curve. Halley's Breslau table of 1693 replaced the guesswork with deaths by age, and William Farr's work at the General Register Office from 1839 turned vital statistics into routine public-health surveillance.`,
      caption: String.raw`Gold: Graunt's published survivors per 100 born. Dashed: his recipe — a share dying before 6, then the same fraction surviving each decade — which you can tune with the sliders. Green: a modern low-mortality life table (a model with $e_0 \approx 81$). The log-scale panel shows Graunt's constant-hazard assumption as a straight line, while real adult mortality accelerates with age. Below, a timeline of what followed; click an event to read about it, drag to pan.`,
      deps: ['epi-1.6', 'epi-1.9'],
      refs: ['Gordis ch. 1'],
      tags: ['history', 'life table', 'vital statistics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/John_Graunt' },
      viz(v) {
        const M = v.M, G = [[0, 100], [6, 64], [16, 40], [26, 25], [36, 16], [46, 10], [56, 6], [66, 3], [76, 1]];
        const sL = v.stage({ x: [-7, 92], y: [-5, 105], height: 300, axes: 'box', xlabel: 'age', weight: 1, title: 'survivors per 100 born' });
        const sG = v.stage({ x: [-7, 92], y: [0.4, 150], ylog: true, height: 300, axes: 'box', xlabel: 'age', weight: 1, title: 'the same on a log scale' });
        const sT = v.stage({ height: 190, full: true });
        const d6 = v.slider('dying before 6', 0.2, 0.6, 0.36, { step: 0.01, fmt: (x) => `${Math.round(100 * x)} in 100` });
        const sv = v.slider('surviving each later decade', 0.4, 0.85, 0.625, { step: 0.005, fmt: (x) => x.toFixed(3) });
        const T = v.timeline(sT, {
          scale: 'linear', range: [1585, 1875], zoom: true, fontSize: 11.5,
          events: [
            { id: 'bills', t: 1603, label: 'weekly Bills of Mortality', note: 'London’s parish clerks publish weekly counts of christenings and burials, with causes of death, continuously from 1603 (earlier only in plague years).' },
            { id: 'graunt', t: 1662, label: 'Graunt’s Observations', priority: 1, color: 'accent', note: 'Graunt turns twenty years of bills into tables: sex ratio at birth, urban growth by migration, stable cause-of-death proportions, plague years, and the first life table.' },
            { id: 'plague', t: 1665, label: 'Great Plague', color: 'red', note: 'The bills for 1665 record roughly 68 600 plague deaths in London out of about 97 000 burials.' },
            { id: 'dewitt', t: 1671, label: 'de Witt prices annuities', note: 'Johan de Witt uses mortality assumptions to price Dutch life annuities — actuarial science begins.' },
            { id: 'halley', t: 1693, label: 'Halley’s Breslau table', priority: 1, note: 'Edmond Halley builds a life table from Breslau’s records of deaths by age, and uses it to value annuities.' },
            { id: 'sus', t: 1741, label: 'Süssmilch’s Göttliche Ordnung', note: 'Johann Peter Süssmilch extends Graunt’s “political arithmetic” to the regularities of births, marriages and deaths across Europe.' },
            { id: 'gro', t: 1837, label: 'civil registration', note: 'England and Wales begin compulsory registration of births, marriages and deaths under the General Register Office.' },
            { id: 'farr', t: 1839, label: 'Farr at the GRO', priority: 1, note: 'William Farr becomes compiler of abstracts at the General Register Office, building cause-of-death classification, life tables and rates by occupation and district.' },
            { id: 'snow', t: 1854, label: 'Snow, Broad Street', note: 'John Snow uses the GRO’s weekly returns and his own house-to-house survey to link cholera to the Broad Street pump and to one water company.' },
          ],
          links: [['bills', 'graunt'], ['graunt', 'halley'], ['graunt', 'sus'], ['gro', 'farr'], ['farr', 'snow']],
        });
        T.selected = T.event('graunt');
        const m = deathRates(4, 6), lt = lifeTable(m), modern = (x) => 100 * lAt(lt, m, x);
        const areaOf = (pts) => { let a = 0; for (let i = 1; i < pts.length; i++) a += ((pts[i][1] + pts[i - 1][1]) / 2) * (pts[i][0] - pts[i - 1][0]); return a / 100; };
        let st = null;
        v.render(() => {
          const rec = [[0, 100], [6, 100 * (1 - d6.value)]]; for (let k = 1; k <= 8; k++) rec.push([6 + 10 * k, rec[1][1] * Math.pow(sv.value, k)]);
          const Gt = [...G, [86, 0]], recT = [...rec.filter((p) => p[0] <= 76), [86, 0]];
          for (const S of [sL, sG]) {
            const lg = S === sG;
            if (!lg) { S.fn(modern, { domain: [0, 92], fill: 'green', fillAlpha: 0.1, color: 'green', width: 0.01 }); S.poly([[0, 0], ...Gt, [86, 0]], { fill: 'gold', fillAlpha: 0.2, stroke: false }); }
            S.fn(modern, { domain: [0, 92], color: 'green', width: 2.4 });
            S.path(rec, { color: 'accent', width: 2, dash: [6, 4] });
            rec.forEach(([x, y]) => S.dot(x, y, { r: 3.2, color: 'accent', hollow: true }));
            S.path(G, { color: 'gold', width: 2 });
            G.forEach(([x, y]) => S.dot(x, y, { r: 4.6, color: 'gold' }));
          }
          sL.text(`Graunt: area = e₀ ≈ ${v.fix(areaOf(Gt), 1)} y`, 13, 54, { align: 'left', color: 'gold', size: 12, weight: 700 });
          sL.text(`modern: e₀ ≈ ${v.fix(lt.e[0], 0)} y`, 60, 92, { align: 'center', color: 'green', size: 12, weight: 700 });
          G.slice(1).forEach(([x, y]) => sL.text(String(y), x, y, { dx: 5, dy: -9, align: 'left', color: 'gold', size: 10.5 }));
          sG.text('constant hazard = straight line', 50, 3.2, { align: 'center', color: 'accent', size: 11 });
          T.draw();
          st = { eG: areaOf(Gt), eR: areaOf(recT), rec, e0: lt.e[0], m36: modern(36), sel: T.selected };
        });
        v.legend([['gold', 'Graunt’s table (1662)'], ['accent', 'his recipe with your numbers', { dash: true }], ['green', 'modern life table (model)']]);
        v.readout(() => {
          if (!st) return '';
          const { eG, eR, rec, e0, m36, sel } = st;
          const note = sel && sel.note ? ` · **${sel.label}** (${Math.round(sel.year ?? sel.t)}): ${sel.note}` : '';
          return `Graunt's table: e₀ = area under the curve ≈ **${v.fix(eG, 1)} years**; 16 of 100 reach 36 · your recipe: ${rec.slice(1, 6).map((p) => Math.round(p[1])).join(', ')} … → e₀ ≈ ${v.fix(eR, 1)} y · modern: ${v.fix(m36, 1)} of 100 reach 36, e₀ ≈ ${v.fix(e0, 1)} y${note}`;
        });
      },
    },
  ],
};
