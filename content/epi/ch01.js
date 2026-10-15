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
/** Calendar date of t years after 1 January 2021 (plain text, e.g. "14 Feb 2022"). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function dateOf(t) { const y = Math.floor(t), d = (t - y) * 365, ml = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let m = 0, r = d; while (m < 11 && r >= ml[m]) { r -= ml[m]; m++; } return `${Math.floor(r) + 1} ${MONTHS[m]} ${2021 + y}`; }
/** Sum of the first-year-style life table: m = yearly death rates m_0 … m_ω → {l, d, L, T, e} (constant hazard within each year). */
function lifeTable(m) {
  const n = m.length, l = new Float64Array(n + 1), L = new Float64Array(n), T = new Float64Array(n + 1), e = new Float64Array(n);
  l[0] = 1;
  for (let x = 0; x < n; x++) { const mx = Math.max(m[x], 1e-12), s = Math.exp(-mx); l[x + 1] = l[x] * s; L[x] = l[x] * (mx < 1e-6 ? 1 - mx / 2 : (1 - s) / mx); }
  L[n - 1] = l[n - 1] / Math.max(m[n - 1], 1e-12); l[n] = 0; // open-ended last age group
  for (let x = n - 1; x >= 0; x--) T[x] = T[x + 1] + L[x];
  for (let x = 0; x < n; x++) e[x] = l[x] > 1e-300 ? T[x] / l[x] : 0;
  return { l, L, T, e, n };
}
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
          let s = `after $t = ${v.fix(tau, 1)}$ y: **${k}** of 1000 have fallen ill → cumulative incidence $${k}/1000 = ${f(k / N)}$ (model ${f(model)}) · the same rate gives a risk of ${f(r1)} over 1 year but **${f(rT)}** over $T = ${T}$ years`;
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
      idea: String.raw`Person-time puts people followed for a month and people followed for ten years on a common footing: ten people for one year and one person for ten years both give ten person-years. A person who becomes a case, dies or is lost simply stops contributing time, so nobody has to be followed to the end — which is exactly what the risk of 1.1 needed. With a constant hazard the number of cases is (approximately) Poisson with mean $\lambda\times$person-time, so cases ÷ person-time is the maximum-likelihood estimate of $\lambda$. By contrast "cases ÷ people enrolled" keeps rising as follow-up lengthens.`,
      caption: String.raw`Each line is one person's follow-up, from entry to the first of: disease (red), loss to follow-up (orange ring), death from another cause (grey) or the study end. Drag the gold study-end marker. The bar at the top lays all the follow-up end to end — its length is the person-time and its red ticks are the cases. Right: as the study runs longer, the rate per 100 person-years settles near the true $\lambda$ while "cases ÷ people" keeps climbing. Switch to *time since entry*: re-aligning the lines changes nothing.`,
      deps: ['epi-1.1'],
      see: ['demo-1.2'],
      refs: ['Rothman ch. 3'],
      tags: ['incidence', 'person-time', 'rates'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Incidence_(epidemiology)' },
      viz(v) {
        const M = v.M, NMAX = 1000, LOSS = 0.07, DIE = 0.015;
        const s = v.stage({ x: [1999.6, 2012.4], y: [0, 50], height: 410, axes: 'box', yticks: [], weight: 1.65 });
        const g = v.stage({ x: [2001, 2012], y: [0, 40], height: 410, axes: 'box', xlabel: 'study end', ylabel: 'per 100', weight: 1, minWidth: 230, title: 'as follow-up lengthens' });
        const lamS = v.slider('true rate $\\lambda$ (per 100 person-years)', 1, 25, 6, { step: 0.5 });
        const nSel = v.select('cohort', [{ value: 40, label: '40 people' }, { value: 200, label: '200' }, { value: 1000, label: '1 000' }], 40);
        const axis = v.select('time axis', [{ value: 'cal', label: 'calendar time' }, { value: 'fu', label: 'time since entry' }], 'cal');
        let seed = 3; v.button('New cohort', () => { seed++; });
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
          const rows = [];
          for (let i = 0; i < n; i++) { const f = follow(U, i, lam, E); if (f) rows.push(f); }
          rows.sort(cal ? (a, b) => a.entry - b.entry : (a, b) => (b.end - b.entry) - (a.end - a.entry));
          const w = n <= 40 ? 2.6 : n <= 200 ? 1.1 : 0.5, r = n <= 40 ? 4.6 : n <= 200 ? 2.3 : 1.3;
          if (cal) { s.vband(2000, 2006, { color: 'accent', alpha: 0.05 }); s.text('recruitment window', 2003, n + 0.4, { dy: -2, align: 'center', baseline: 'bottom', color: 'muted', size: 11 }); }
          else s.text('years since entry', 12.3, bot, { dy: -22, align: 'right', color: 'muted', size: 11.5 });
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
          s.text(`all follow-up laid end to end: Σ = ${v.fix(PT, 1)} person-years, ${cases} cases (red ticks)`, xa, yl, { dy: -17, align: 'left', color: 'ink', size: 11.5, weight: 600 });
          // ----- right: rate and naive proportion as the study end moves
          const C = curve(`${seed}|${n}|${lam}`, () => {
            const out = { rate: [], lo: [], hi: [], naive: [] };
            for (let k = 0; k <= 110; k++) {
              const e = 2001 + (11 * k) / 110; let pt = 0, c = 0, en = 0;
              for (let i = 0; i < n; i++) { const f = follow(U, i, lam, e); if (!f) continue; en++; pt += f.end - f.entry; if (f.why === 'case') c++; }
              const ci = poisCI(M, c);
              out.rate.push([e, pt > 0 ? (100 * c) / pt : NaN]); out.lo.push([e, pt > 0 ? (100 * ci[0]) / pt : NaN]); out.hi.push([e, pt > 0 ? (100 * ci[1]) / pt : NaN]); out.naive.push([e, en ? (100 * c) / en : NaN]);
            }
            return out;
          });
          const ymax = Math.max(12, 1.15 * Math.max(lamS.value * 1.9, ...C.naive.map((p) => p[1] || 0)));
          g.setView(null, [0, ymax]);
          g.clip(() => g.poly([...C.hi.filter((p) => isFinite(p[1])).map((p) => [p[0], Math.min(p[1], ymax * 2)]), ...C.lo.filter((p) => isFinite(p[1])).reverse()], { fill: 'accent', fillAlpha: 0.1, stroke: false }));
          g.hline(lamS.value, { color: 'green', dash: [6, 4], width: 1.6 });
          g.text('true λ', 2011.9, lamS.value, { dy: -9, align: 'right', color: 'green', size: 11.5, math: true });
          g.path(C.naive, { color: 'orange', width: 2.2 });
          g.path(C.rate, { color: 'accent', width: 2.4 });
          g.vline(E, { color: 'gold', width: 1.2, dash: [4, 4] });
          const at = (arr) => arr[Math.round(((E - 2001) / 11) * 110)][1];
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
        const s = v.stage({ x: [-0.05, 3.05], y: [0, 100], height: 330, axes: 'box', weight: 1.5, xticks: [[0, '2021'], [0.5, 'Jul'], [1, '2022'], [1.5, 'Jul'], [2, '2023'], [2.5, 'Jul'], [3, '2024']] });
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
          s.text('prevalence of the 400', 0.33, Y(top), { dy: -3, align: 'left', baseline: 'bottom', color: 'muted', size: 11 });
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
        const ts = v.stage({ x: [0, 25], y: [0, 0.3], height: 220, axes: 'box', full: true, xlabel: 'years', ylabel: 'prevalence', title: 'measured prevalence and the steady-state formula' });
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
        A.step(70);
        let st = null;
        v.render(() => {
          A.draw();
          const H = A.history, n = H.t.length, now = H.t[n - 1] * DT, P = A.stats.ill, I = inc.value, D = dur.value, ID = I * D, ex = ID / (1 + ID);
          const avg = (key, k = 26) => { let s = 0, c = 0; for (let j = Math.max(1, n - k); j < n; j++) { s += H[key][j]; c++; } return c ? s / c : H[key][n - 1]; };
          const Pm = avg('ill'), inflow = avg('inflow'), outflow = avg('outflow');
          // ----- bathtub: walls x 2.4…7.6, floor y = 1, top y = 8 ↔ prevalence 0…100%
          const Yp = (p) => 1 + 7 * p, x0 = 2.4, x1 = 7.6, sc = Math.max(I, 0.02), wIn = Math.min(30, 2 + (26 * inflow) / sc), wOut = Math.min(30, 2 + (26 * outflow) / sc);
          for (const q of [0, 0.25, 0.5, 0.75, 1]) { sb.line(x0 - 0.12, Yp(q), x0, Yp(q), { color: 'muted', width: 1 }); sb.text(pc(q, 0), x0 - 0.2, Yp(q), { align: 'right', color: 'muted', size: 10.5 }); }
          sb.line(0.3, 9.35, 3.35, 9.35, { color: 'gray', width: 9, cap: 'butt' }); sb.line(3.35, 9.35, 3.35, 8.75, { color: 'gray', width: 9, cap: 'butt' });
          sb.line(3.35, 8.7, 3.35, Yp(P), { color: 'red', width: wIn, alpha: 0.5, cap: 'butt' });
          sb.rect(x0, 1, x1, Yp(P), { fill: 'red', fillAlpha: 0.28, stroke: false });
          sb.line(x0, Yp(P), x1, Yp(P), { color: 'red', width: 2 });
          sb.path([[6.9, 1], [6.9, 0.42], [9.8, 0.42]], { color: 'teal', width: wOut, alpha: 0.55, cap: 'butt' });
          sb.path([[x0, 8.3], [x0, 1], [x1, 1], [x1, 8.3]], { color: 'ink', width: 2.6 });
          sb.line(x0, Yp(ex), x1, Yp(ex), { color: 'green', width: 2, dash: [6, 4] });
          sb.text('steady state', x1, Yp(ex), { dx: 5, align: 'left', color: 'green', size: 11, weight: 600 });
          if (ID <= 1.04) { sb.line(x0, Yp(ID), x1, Yp(ID), { color: 'orange', width: 2, dash: [3, 4] }); sb.text('I × D', x1, Yp(ID), { dx: 5, dy: Math.abs(ID - ex) < 0.04 ? -11 : 0, align: 'left', color: 'orange', size: 11, weight: 600 }); }
          else { sb.arrow(x1 - 0.5, 7.4, x1 - 0.5, 8.4, { color: 'orange', width: 2, head: 7 }); sb.text(`I × D = ${v.fix(ID, 2)} > 100%`, x1 - 0.8, 8.15, { align: 'right', color: 'orange', size: 11, weight: 600 }); }
          sb.text(`in: ${v.fix(inflow, 3)}/yr`, 3.55, 9.0, { align: 'left', color: 'red', size: 11, weight: 600 });
          sb.text('new cases I(1 − P)', 0.3, 9.85, { align: 'left', color: 'muted', size: 10.5 });
          sb.text(`out: ${v.fix(outflow, 3)}/yr`, 9.8, 0.42, { dy: -12, align: 'right', color: 'teal', size: 11, weight: 600 });
          sb.text('recoveries P/D', 9.8, 0.42, { dy: 12, align: 'right', color: 'muted', size: 10.5 });
          // ----- time series in years
          const t1 = Math.max(25, now), t0 = t1 - 25, pts = (key, cap) => { const out = []; for (let j = 0; j < n; j++) { const t = H.t[j] * DT; if (t >= t0) out.push([t, Math.min(H[key][j], cap)]); } return out; };
          let top = Math.max(ex, Math.min(ID, 1)); for (let j = 0; j < n; j++) if (H.t[j] * DT >= t0) top = Math.max(top, H.ill[j], H.exact[j], Math.min(H.ID[j], 1));
          top = Math.min(1.05, Math.max(0.08, top * 1.18));
          ts.setView([t0, t1], [0, top]);
          ts.path(pts('ID', top * 1.5), { color: 'orange', width: 1.8, dash: [3, 4] });
          ts.path(pts('exact', 2), { color: 'green', width: 2, dash: [6, 4] });
          ts.path(pts('ill', 2), { color: 'red', width: 2 });
          ts.dot(now, P, { r: 4.5, color: 'red' });
          const since = (A.model.t - (A.model.data.changed || 0)) * DT, relax = 1 / (I + 1 / D);
          st = { Pm, ID, ex, inflow, outflow, steady: since > 4 * relax, since, relax };
        });
        v.legend([['red', 'measured prevalence'], ['green', 'steady state $ID/(1+ID)$', { dash: true }], ['orange', 'rare-disease product $I\\times D$', { dash: true }], ['teal', 'outflow (recoveries)']]);
        v.readout(() => {
          if (!st) return '';
          const { Pm, ID, ex, inflow, outflow, steady, since, relax } = st;
          return `measured prevalence **${pc(Pm)}** (mean over the last year) · steady state $\\frac{ID}{1+ID} = ${pc(ex)}$ · product $I\\times D = ${v.fix(ID, 3)}$ (${ID > 0.1 ? `off by ${pc(ID / ex - 1, 0)}: not a rare condition` : 'close: a rare condition'}) · inflow ${v.fix(inflow, 3)} vs outflow ${v.fix(outflow, 3)} per person-year` +
            (steady ? ' → **steady state**: inflow = outflow' : ` → **not yet in steady state** (last change ${v.fix(since, 1)} y ago; it takes a few times $1/(I + 1/D) = ${v.fix(relax, 1)}$ y)`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Risk from a constant rate: R = 1 − e^{−λt}',
      statement: String.raw`In a closed cohort with no competing risks and no losses, suppose every disease-free person falls ill at the same constant rate $\lambda$. Then the risk over a period of length $t$ is
$$R(t) = 1 - e^{-\lambda t}.$$
For small $\lambda t$ this is $R(t) \approx \lambda t$ ("risk ≈ rate × time"), with relative error close to $\lambda t/2$. The approximation always overstates the risk and breaks down as $\lambda t$ approaches $1$, where it would even exceed $1$. For a rate that varies over time, $R(t) = 1 - \exp\bigl(-\int_0^t \lambda(s)\,ds\bigr)$.`,
      idea: String.raw`Let $S(t) = 1 - R(t)$ be the fraction still disease-free. In a short interval $dt$ a fraction $\lambda\,dt$ *of them* falls ill, so $S' = -\lambda S$ and $S(t) = e^{-\lambda t}$ (pma 8.6). Without calculus: cut $[0, t]$ into $n$ pieces; in each, a fraction $\lambda t/n$ of the people still at risk becomes a case, so $S = (1 - \lambda t/n)^n \to e^{-\lambda t}$. The rule $R = \lambda t$ is the crudest case $n = 1$: it applies the rate to the whole cohort for the whole period, ignoring that people who have already fallen ill are no longer at risk.`,
      caption: String.raw`Drag the point along the risk curve. Left: the exact risk $1 - e^{-\lambda t}$ (green), the approximation $\lambda t$ (orange dashed, with the error shaded) and the cumulative incidence of a simulated cohort of 2 000 people (gold steps). Right: the people still at risk when the period is cut into $n$ pieces, each removing a fraction $\lambda t/n$ of those left; raise $n$ and the staircase settles onto $e^{-\lambda s}$, while $n = 1$ is exactly the approximation.`,
      deps: ['epi-1.1', 'epi-1.2', 'pma-8.6'],
      refs: ['Rothman ch. 3'],
      tags: ['risk', 'rates'],
      scope: String.raw`Holds for a constant rate in a closed cohort without competing risks or losses (otherwise use the cumulative rate, or the competing-risk formulas of 1.1). The approximation $R \approx \lambda t$ is within $5\%$ only while $\lambda t \lesssim 0.1$.`,
      viz(v) {
        const M = v.M, N = 2000, TMAX = 10;
        const s = v.stage({ x: [0, TMAX], y: [0, 1.12], height: 330, axes: 'box', xlabel: 'years', ylabel: 'risk', weight: 1.15, title: 'risk over a period of length $t$' });
        const g = v.stage({ x: [0, 4], y: [0, 1], height: 330, axes: 'box', xlabel: 'years', ylabel: 'still at risk', weight: 1, title: 'cutting $[0, t]$ into $n$ pieces' });
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
          s.text('a risk can never exceed 1', 0.15, 1, { dy: -9, align: 'left', color: 'muted', size: 11 });
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
          g.setView([0, t], [0, 1.02]);
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
          { id: 'B', name: 'rare, deadly', color: 'purple', at: [1.5, 90] },
          { id: 'C', name: 'moderate', color: 'orange', at: [60, 4] },
        ];
        DIS.forEach((d, i) => { d.h = sL.handle(...d.at, { color: d.color, label: d.id, labelPos: 'ne' }); d.u = uniforms(M, 61 + i, 2); });
        const TB = v.table(sR, { rows: 3, cols: 4, square: false, cellAspect: 1.55, maxCell: 50, size: 12.5, region: [0, 0.56, 1, 1], colLabels: ['cases', 'deaths', 'per 100k', 'CFR'], rowLabels: ['A', 'B', 'C'], rowLabelColor: (i) => DIS[i].color, labelSize: 13 });
        /** A count with the given mean and variance from a fixed uniform: exact quantile for small means, normal otherwise. */
        const count = (mean, sd, u, exact) => (mean < 60 ? exact().quantile(u) : Math.max(0, Math.round(mean + sd * M.dist.normal(0, 1).quantile(u))));
        // outbreak: onset days and standardized delays (fixed), outcome draws fixed
        const ob = (() => { const r = M.rng(77), G = M.dist.gamma(5, 5), g4 = M.dist.gamma(4, 0.25); return Array.from({ length: NC }, () => ({ on: G.sample(r), u: r(), gd: g4.sample(r), gr: g4.sample(r) })); })();
        let st = null;
        v.render(() => {
          const cmp = mode.value === 'compare';
          cfrS.el.hidden = delS.el.hidden = cmp;
          DIS.forEach((d) => (d.h.visible = cmp));
          if (cmp) {
            Object.assign(sL.o, { xlog: true, ylog: true, xlabel: 'incidence per 100 000 per year', ylabel: 'case fatality %', axes: true });
            sL.setView([0.1, 1e5], [0.01, 100]); sL.setTitle('incidence × case fatality = mortality');
            Object.assign(sR.o, { axes: false }); sR.setView([0, 1], [0, 1]); sR.setTitle('one simulated year in a population of 1 000 000');
            for (const m of [0.001, 0.01, 0.1, 1, 10, 100, 1000]) {
              sL.fn((x) => (100 * m) / x, { color: 'gray', width: 1, alpha: 0.55 });
              const xl = (100 * m) / 45; if (xl > 0.15 && xl < 6e4) sL.text(m >= 1 ? String(m) : String(m), xl, 45, { dx: 4, align: 'left', color: 'muted', size: 10.5 });
            }
            sL.text('deaths per 100 000 per year along each diagonal:', 0.13, 80, { align: 'left', color: 'muted', size: 10.5 });
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
            sL.setView([0, DAYS], [0, ymax]); sL.setTitle('new cases and deaths per day');
            Object.assign(sR.o, { axes: 'box', xlabel: 'report day', ylabel: '' });
            sR.setView([0, DAYS], [0, Math.min(1, Math.max(0.3, 2.2 * cfr))]); sR.setTitle('case fatality as it would be reported');
            for (let d = 0; d <= DAYS; d++) { sL.rect(d + 0.1, 0, d + 0.9, cd[d], { fill: 'orange', fillAlpha: 0.45, stroke: false }); sL.rect(d + 0.25, 0, d + 0.75, dd[d], { fill: 'red', fillAlpha: 0.9, stroke: false }); }
            if (!st || !st.hd) st = { hd: sL.handle(25, 0, { color: 'gold', constrain: (x) => [M.clamp(Math.round(x), 3, DAYS), sL.bounds.y[0]] }) };
            const H = st.hd; H.visible = true; H.y = sL.bounds.y[0];
            const day = Math.round(H.x);
            sL.vline(day + 1, { color: 'gold', width: 1.4, dash: [4, 4] });
            const naive = [], res = [];
            for (let d = 3; d <= DAYS; d++) { if (CC[d] > 0) naive.push([d + 1, CD[d] / CC[d]]); if (CD[d] + CR[d] > 0) res.push([d + 1, CD[d] / (CD[d] + CR[d])]); }
            sR.hline(cfr, { color: 'green', width: 1.8, dash: [6, 4] });
            sR.text(`true ${pc(cfr, 0)}`, 2, cfr, { dy: -9, align: 'left', color: 'green', size: 11.5, weight: 600 });
            sR.path(res, { color: 'purple', width: 2.2 }); sR.path(naive, { color: 'red', width: 2.4 });
            sR.vline(day + 1, { color: 'gold', width: 1.4, dash: [4, 4] });
            const nv = CD[day] / Math.max(1, CC[day]), rv = CD[day] / Math.max(1, CD[day] + CR[day]);
            sR.dot(day + 1, nv, { r: 4.5, color: 'red' }); if (CD[day] + CR[day] > 0) sR.dot(day + 1, Math.min(rv, sR.bounds.y[1]), { r: 4.5, color: 'purple' });
            Object.assign(st, { cmp, day, cases: CC[day], deaths: CD[day], rec: CR[day], nv, rv, cfr, final: CD[DAYS] / CC[DAYS] });
          }
          if (st && st.hd) st.hd.visible = !cmp;
        });
        v.legend([['gray', 'equal mortality'], ['green', 'leader by mortality / true CFR'], ['red', 'leader by CFR / deaths ÷ cases so far'], ['purple', 'deaths ÷ resolved cases'], ['orange', 'new cases']]);
        v.readout(() => {
          if (!st) return '';
          if (st.cmp && st.rows) {
            const { rows, byM, byC } = st, nm = (k) => rows[k].id;
            const swap = byM.join() !== byC.join();
            return `mortality = incidence × case fatality: ${rows.map((r) => `${r.id} ${v.fix(r.inc, r.inc < 10 ? 1 : 0)} × ${pc(r.cfr, r.cfr < 0.01 ? 2 : 1)} = ${v.fix((r.inc * r.cfr), 2)} (simulated ${v.fix(r.mort, 2)})`).join(' · ')} per 100 000 · deadliest for the population: **${byM.map(nm).join(' > ')}**; for the patient: **${byC.map(nm).join(' > ')}**${swap ? ' — the two measures rank them differently' : ''}`;
          }
          const { day, cases, deaths, rec, nv, rv, cfr, final } = st;
          return `day ${day + 1}: ${int(cases)} cases, ${int(deaths)} deaths, ${int(rec)} recovered → deaths ÷ cases = **${pc(nv)}** (too low: recent cases have not had time to die) · deaths ÷ resolved cases = ${pc(rv)} · true case fatality ${pc(cfr, 0)}, reached only when every case has an outcome (day ${DAYS}: ${pc(final)})`;
        });
      },
    },
  ],
};
