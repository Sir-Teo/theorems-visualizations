// Ecology — Chapter 1: Organisms, energy and scaling (items 1.8–1.14)
import { mammals, bmrW, scatterGroups, groupLegend, hoverPick, find, logFit, fx, massTxt, birds, familySummary, BIRD_NAMES } from './ch01.shared.js';

// ── helpers for this file ─────────────────────────────────────────────────────────────────────────────────
const MIN_PER_MONTH = 43830; // 30.44 days
const MIN_PER_YEAR = 525960;
/** Stahl (1967) power laws for mammals, M in kg: heart rate 241 M^−0.25 per min, breathing rate 53.5 M^−0.26 per min. */
const heartRate = (kg) => 241 * kg ** -0.25;
const breathRate = (kg) => 53.5 * kg ** -0.26;
/** Pearson correlation and least-squares line of y on x. */
function lin(xs, ys) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const b = sxy / sxx; return { b, a: my - b * mx, r: sxy / Math.sqrt(sxx * syy), n };
}
/** Kleiber's Table 1 (Hilgardia 6: 317, 1932): group, mean weight W (kg), heat production (kcal per 24 h). */
const KLEIBER = [
  ['steer', 679, 8274], ['steer', 342, 6255], ['cow', 388, 6421], ['man', 64.1, 1632], ['woman', 56.5, 1349], ['sheep', 45.6, 1219.9],
  ['male dog', 15.5, 525], ['female dog', 11.6, 443], ['hen', 1.96, 106], ['pigeon', 0.3, 30.8], ['male rat', 0.226, 25.5], ['female rat', 0.173, 20.2], ['ring dove', 0.15, 19.5],
];
const RUMINANTS = new Set([0, 1, 2, 5]);
/** Kleiber's printed coefficients of variability (%) of heat production per W^n: [n, 13 groups, 9 groups]. */
const KLEIBER_CV = [[2 / 3, 23.9, 16.9], [0.7, 14.3, 9.1], [0.73, 7.9, 5.6], [0.74, 7.6, 6.5], [0.75, 8.1, 8.2], [0.76, 10.0, 10.0], [0.77, 12.5, 12.1], [0.8, 21.5, 19.4], [1, 80.2, 61.9]];
/** Coefficient of variability (sample SD / mean, %) of M/W^n over rows [name, W, M]. */
function cvOf(rows, n) {
  const r = rows.map(([, W, Mh]) => Mh / W ** n), mu = r.reduce((a, b) => a + b, 0) / r.length;
  const sd = Math.sqrt(r.reduce((a, b) => a + (b - mu) ** 2, 0) / (r.length - 1));
  return { cv: (100 * sd) / mu, mean: mu };
}
/** Lomolino (2005, Table 1a, b): Si = b0 + b1·log10(mainland mass, g); n, adjusted r², Sf (g), slope of log insular on log mainland mass. */
const LOMOLINO = {
  all: { lab: 'all mammals', n: 384, b0: 1.3554, b1: -0.11991, r2: 0.207, sf: 920, b1b: 0.94603, range: [0.7, 6.0] },
  rod: { lab: 'rodents', n: 240, b0: 1.54322, b1: -0.22316, r2: 0.184, sf: 272, b1b: 0.90682, range: [0.8, 4.0] },
  car: { lab: 'terrestrial carnivores', n: 44, b0: 1.59497, b1: -0.23092, r2: 0.44, sf: 377, b1b: 0.88024, range: [1.8, 5.5] },
  art: { lab: 'even-toed ungulates', n: 15, b0: 1.99569, b1: -0.25924, r2: 0.159, sf: 6931, b1b: 0.83747, range: [3.5, 6.0] },
  lep: { lab: 'rabbits and hares', n: 20, b0: 2.39105, b1: -0.41818, r2: 0.28, sf: 2120, b1b: 0.81202, range: [2.5, 3.8] },
  sor: { lab: 'shrews', n: 35, b0: 1.07714, b1: -0.05424, r2: 0, sf: 26, b1b: 0.98969, range: [0.4, 1.6] },
};
/** Draw a fox-like animal in side view (cm): ear = ear height, leg = leg length, tail = tail length; returns nothing. */
function drawAnimal(s, ear, leg, tail, col) {
  const body = []; for (let k = 0; k <= 60; k++) { const t = (2 * Math.PI * k) / 60; body.push([25 * Math.cos(t), 8 * Math.sin(t)]); }
  const tl = []; for (let k = 0; k <= 20; k++) { const u = k / 20; tl.push([-22 - 0.62 * tail * u, 1 - 0.45 * tail * u * u - 2 * u]); }
  s.path(tl, { color: col, width: 7, alpha: 0.9 });
  for (const x of [-17, -10, 14, 20]) s.rect(x - 1.8, -6 - leg, x + 1.8, -5.5, { fill: col, fillAlpha: 0.85, color: 'ink', width: 1 });
  s.poly(body, { fill: col, fillAlpha: 0.95, color: 'ink', width: 1.2 });
  const hx = 28, hy = 9;
  for (const dx of [-3.2, 1.6]) s.poly([[hx + dx - 1.9, hy + 4], [hx + dx + 1.9, hy + 4.6], [hx + dx - 0.2, hy + 4.3 + ear]], { fill: col, fillAlpha: 0.95, color: 'ink', width: 1 });
  s.circle(hx, hy, 6, { fill: col, fillAlpha: 0.95, color: 'ink', width: 1.2 });
  s.poly([[hx + 4, hy + 2.6], [hx + 11, hy - 1.2], [hx + 10.6, hy - 2.4], [hx + 3.5, hy - 3.4]], { fill: col, fillAlpha: 0.95, color: 'ink', width: 1 });
  s.dot(hx + 10.7, hy - 1.8, { r: 2, color: 'ink', ring: false });
  s.dot(hx + 2.8, hy + 1.6, { r: 1.8, color: 'ink', ring: false });
}
/** Surface (cm²) and volume (cm³) of the schematic animal: body cylinder, head sphere, 4 legs, tail, 2 thin ears. */
function animalSV(ear, leg, tail) {
  const P = Math.PI;
  const S = 2 * P * 8 * 50 + 4 * P * 36 + 4 * 2 * P * 1.7 * leg + 2 * P * 2.2 * tail + 2 * 2 * (0.5 * 3.8 * ear);
  const V = P * 64 * 50 + (4 / 3) * P * 216 + 4 * P * 1.7 ** 2 * leg + P * 2.2 ** 2 * tail + 2 * 0.5 * 3.8 * ear * 0.3;
  return { S, V };
}

export default {
  collection: 'ecol',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Phenomenon',
      name: 'Quarter-power scaling of biological times',
      statement: String.raw`Across mammals (and within other groups), biological times — lifespan, age at maturity, gestation and generation time, and the periods of the heartbeat and of breathing — increase roughly as the **quarter power** of body mass, $t\propto M^{1/4}$, so the corresponding rates (heart rate, breathing rate, rates of growth and reproduction) fall as $M^{-1/4}$. Because the exponents nearly match, ratios of times are almost independent of size: a mammal breathes about once every four to five heartbeats whatever its size, and the number of heartbeats in a lifetime is roughly the same, of the order of a billion, for a shrew and an elephant.`,
      scope: String.raw`An approximate, statistical regularity across species; real exponents scatter around $1/4$ (here between about 0.19 and 0.24), and whole groups depart from the line — bats and primates, including humans, live far longer than their size predicts. Maximum recorded lifespans are used because they are the most widely available, but they depend on sample size.`,
      idea: String.raw`If metabolic rate scales as $M^{3/4}$ (1.5), the metabolic rate per unit mass — the rate at which each gram turns over energy and materials — scales as $M^{-1/4}$. Any time set by turning over a fixed fraction of the body's mass or energy (growing to adult size, replacing tissues, pumping the blood volume once, which is proportional to $M$) then scales as $M/M^{3/4} = M^{1/4}$. Heart and breathing rates follow from the same argument applied to the circulatory and respiratory networks (1.6). Products of a rate and a time cancel the mass dependence, which is why "heartbeats per lifetime" is nearly invariant.`,
      caption: String.raw`Left: real data from PanTHERIA for maximum lifespan, age at maturity and gestation, against body mass, with the heartbeat and breath periods given by Stahl's (1967) allometric fits to 447 and 692 measurements; the vertical axis runs from a tenth of a second to a century. Each family of times is a band of slope near $1/4$ (fitted slopes at the right). Right: for each of the 1 000 species with a recorded lifespan, the lifetime number of heartbeats (or breaths) = maximum lifespan × Stahl's heart rate for its mass. The cloud is almost flat: its fitted slope, about −0.05, is far closer to 0 than any of the times' slopes, and slightly negative because maximum lifespans grow only as $M^{0.20}$. Hover over a point to identify the species; humans and bats stand out above the band.`,
      deps: ['ecol-1.5'],
      see: ['ecol-1.4'],
      refs: ['Brown et al. 2004'],
      tags: ['scaling', 'life history', 'data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Allometry' },
      viz(v) {
        const M = v.M, R = mammals();
        const prod = v.select('right panel', [{ value: 'heart', label: 'heartbeats per lifetime' }, { value: 'breath', label: 'breaths per lifetime' }], 'heart');
        const yr = 1, s1 = 1 / (365.25 * 86400);
        const A = v.stage({ x: [1e-3, 3e5], y: [3e-10, 400], xlog: true, ylog: true, height: 380, weight: 1.1, axes: 'box', xlabel: 'body mass (kg)', title: 'biological times',
          yticks: [[0.1 * s1, '0.1 s'], [s1, '1 s'], [60 * s1, '1 min'], [3600 * s1, '1 h'], [1 / 365.25, '1 day'], [1 / 12, '1 month'], [yr, '1 yr'], [10, '10 yr'], [100, '100 yr']] });
        const B = v.stage({ x: [1e-3, 3e5], y: [5e6, 2e10], xlog: true, ylog: true, height: 380, weight: 1, axes: 'box', hover: true, xlabel: 'body mass (kg)', title: 'heartbeats per lifetime' });
        const SER = [
          { key: 'L', lab: 'maximum lifespan', col: 'purple', f: (r) => r.L / 12 },
          { key: 'S', lab: 'age at maturity', col: 'orange', f: (r) => r.S / 365.25 },
          { key: 'G', lab: 'gestation', col: 'teal', f: (r) => r.G / 365.25 },
        ];
        const fits = SER.map((sr) => { const rs = R.filter((r) => r[sr.key]); return logFit(M, rs.map((r) => r.m / 1000), rs.map(sr.f)); });
        let info = null;
        v.render(() => {
          SER.forEach((sr, i) => {
            const rs = R.filter((r) => r[sr.key]);
            A.dots(rs.map((r) => [r.m / 1000, sr.f(r)]), { r: 1.9, color: sr.col, alpha: 0.45 });
            A.fn(fits[i].f, { color: sr.col, width: 2.6, domain: [2e-3, 2e5] });
            A.text(`slope ${fits[i].slope.toFixed(2)}`, 1.5e5, fits[i].f(1.5e5), { color: sr.col, align: 'right', dy: 12, size: 11, weight: 700 });
          });
          A.fn((m) => 1 / (heartRate(m) * MIN_PER_YEAR), { color: 'red', width: 2.6, domain: [2e-3, 2e5] });
          A.fn((m) => 1 / (breathRate(m) * MIN_PER_YEAR), { color: 'accent', width: 2.6, domain: [2e-3, 2e5] });
          A.text('heartbeat period, slope 0.25', 1, 1 / (heartRate(1) * MIN_PER_YEAR), { color: 'red', align: 'left', dy: 14, size: 11, weight: 700 });
          A.text('breath period, slope 0.26', 1.5e5, 1 / (breathRate(1.5e5) * MIN_PER_YEAR), { color: 'accent', align: 'right', dy: -12, size: 11, weight: 700 });
          // right panel: lifetime counts
          const heart = prod.value === 'heart', rate = heart ? heartRate : breathRate;
          B.setTitle(heart ? 'heartbeats per lifetime' : 'breaths per lifetime');
          B.setView(null, heart ? [5e7, 3e10] : [1e7, 6e9]);
          const rs = R.filter((r) => r.L), cnt = (r) => rate(r.m / 1000) * r.L * MIN_PER_MONTH;
          const hits = scatterGroups(B, rs, (r) => r.m / 1000, cnt, { r: 2.3, alpha: 0.6 });
          const F = logFit(M, rs.map((r) => r.m / 1000), rs.map(cnt));
          const sorted = rs.map(cnt).sort((a, b) => a - b), med = sorted[sorted.length >> 1];
          B.hline(med, { color: 'ink', dash: [5, 4], width: 1.3 });
          B.fn(F.f, { color: 'ink', width: 2.4, domain: [2e-3, 2e5] });
          B.text(`median ${v.fmt(med / 1e9, 2)} × 10⁹`, 2e5, med, { align: 'right', dy: -11, size: 11.5, weight: 600 });
          const hu = find(rs, 'Homo sapiens'); if (hu) B.dot(hu.m / 1000, cnt(hu), { r: 4, hollow: true, color: 'ink', label: 'human', labelPos: 'n', math: false, labelSize: 11 });
          const hv = hoverPick(B, hits);
          if (hv) { B.dot(hv.x, hv.y, { r: 6, hollow: true, color: 'ink', width: 2 }); B.textPx(`${hv.r.name} · ${massTxt(hv.r.m)} · ${(hv.r.L / 12).toFixed(1)} yr`, Math.min(hv.X + 10, B.W - 8), hv.Y - 12, { align: hv.X > B.W * 0.55 ? 'right' : 'left', size: 12, weight: 600 }); }
          info = { F, med, n: rs.length, heart, hv, lo: sorted[Math.floor(0.1 * sorted.length)], hi: sorted[Math.floor(0.9 * sorted.length)] };
        });
        v.legend([['purple', 'maximum lifespan'], ['orange', 'age at maturity'], ['teal', 'gestation'], ['red', 'heartbeat period (Stahl)'], ['accent', 'breath period (Stahl)'], ['ink', 'right: fit and median']]);
        v.readout(() => {
          if (!info) return '';
          const { F, med, n, heart, hv, lo, hi } = info, w = heart ? 'heartbeats' : 'breaths';
          let s = `fitted exponents of the times: lifespan ${fits[0].slope.toFixed(3)} (n = ${fits[0].n}), maturity ${fits[1].slope.toFixed(3)} (n = ${fits[1].n}), gestation ${fits[2].slope.toFixed(3)} (n = ${fits[2].n}); heart period 0.25, breath period 0.26 · ${w} per lifetime over ${n} species: median **${v.fmt(med / 1e9, 2)} billion**, middle 80 % between ${v.fmt(lo / 1e9, 2)} and ${v.fmt(hi / 1e9, 2)} billion, slope against mass ${fx(F.slope, 3)} (95 % CI ${fx(F.lo, 3)} to ${fx(F.hi, 3)}) · about ${(241 / 53.5).toFixed(1)} heartbeats per breath at every size`;
          if (hv) s += ` · **${hv.r.name}**: ${v.fmt(hv.y / 1e9, 2)} billion ${w}`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Damuth’s law and energetic equivalence',
      credit: 'John Damuth, 1981',
      statement: String.raw`Across species of mammals, average population density falls with body mass approximately as
$$D\propto M^{-3/4}$$
(Damuth 1981: $\log_{10}D = -0.75\log_{10}W + 4.23$ for 307 species of primary consumers, $D$ per km², $W$ in grams). Since individual metabolic rate rises as $M^{3/4}$ (1.5), the rate of energy use by a population per unit area, $D\cdot B \propto M^{-3/4}M^{3/4} = M^{0}$, is independent of body size: the **energetic equivalence rule** — small and large species of the same trophic level take, on average, the same share of energy per square kilometre.`,
      scope: String.raw`A statistical trend across species, with about two orders of magnitude of scatter at any one size. It holds within a trophic level and a region; carnivores live at lower densities than herbivores of the same size (less energy reaches them), and global compilations mix very different habitats.`,
      idea: String.raw`If a region supplies a fixed flux of usable energy to a guild and each individual needs energy at the rate $B\propto M^{3/4}$, then a population that uses its share of the supply can contain $N\propto M^{-3/4}$ individuals (Brown et al. 2004, their eq. 9). Damuth's empirical exponent matches the inverse of Kleiber's, which is why he interpreted it as energy equivalence. Equivalence is a statement about averages: it does not say that every species has the same energy use, only that body size does not bias it.`,
      caption: String.raw`Real data: population densities of 947 mammal species from PanTHERIA, coloured by trophic level. The blue line is the least-squares fit for the species selected; the dashed line is Damuth's (1981) published regression for primary consumers. Right: the energy each population uses per km² — density × basal metabolic rate, with the rate either taken from the Kleiber fit of 1.5 or measured (for the 303 species that have both numbers). Over all species the cloud is flat (slope about −0.02) and for herbivores nearly so, while the carnivores sit about ten times lower, as less energy reaches them. Equivalence is only a rough rule: within carnivores, and in the smaller set with measured metabolic rates, the slope is clearly negative (about −0.2), so large species use somewhat less energy per km² than small ones.`,
      deps: ['ecol-1.5'],
      see: ['ecol-1.4'],
      refs: ['Brown et al. 2004'],
      tags: ['population density', 'scaling', 'data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Damuth%27s_law' },
      viz(v) {
        const M = v.M, R = mammals().filter((r) => r.D);
        const grp = v.select('species', [{ value: 0, label: 'all' }, { value: 1, label: 'herbivores' }, { value: 2, label: 'omnivores' }, { value: 3, label: 'carnivores' }], 0);
        const src = v.select('metabolic rate from', [{ value: 'fit', label: 'Kleiber fit' }, { value: 'meas', label: 'measured' }], 'fit');
        const K = (() => { const rs = mammals().filter((r) => r.b && r.bm); return logFit(M, rs.map((r) => r.bm / 1000), rs.map(bmrW)); })();
        const TC = ['faint', 'green', 'gold', 'red'], TN = ['unknown', 'herbivore', 'omnivore', 'carnivore'];
        const A = v.stage({ x: [2e-3, 5e4], y: [2e-3, 5e4], xlog: true, ylog: true, height: 360, weight: 1, axes: 'box', hover: true, xlabel: 'body mass (kg)', title: 'population density (per km²)' });
        const Bst = v.stage({ x: [2e-3, 5e4], y: [0.2, 3e5], xlog: true, ylog: true, height: 360, weight: 1, axes: 'box', xlabel: 'body mass (kg)', title: 'energy used per km² (W/km²)' });
        const damuth = (kg) => 10 ** (4.23 - 0.75 * Math.log10(kg * 1000));
        let info = null;
        v.render(() => {
          const g = +grp.value, sel = R.filter((r) => !g || r.troph === g), meas = src.value === 'meas';
          const hits = [];
          for (let t = 0; t < 4; t++) {
            const rs = R.filter((r) => r.troph === t);
            const on = !g || g === t;
            A.dots(rs.map((r) => [r.m / 1000, r.D]), { r: on ? 2.6 : 1.8, color: on ? TC[t] : 'faint', alpha: on ? 0.75 : 0.35 });
            if (on) for (const r of rs) hits.push({ X: A.X(r.m / 1000), Y: A.Y(r.D), r, x: r.m / 1000, y: r.D });
          }
          const F = logFit(M, sel.map((r) => r.m / 1000), sel.map((r) => r.D));
          A.fn(damuth, { color: 'ink', dash: [6, 5], width: 1.6 });
          A.fn(F.f, { color: 'accent', width: 3, domain: [Math.min(...sel.map((r) => r.m / 1000)), Math.max(...sel.map((r) => r.m / 1000))] });
          A.text('Damuth 1981', 3e3, damuth(3e3), { dy: -12, size: 11, color: 'ink' });
          const hv = hoverPick(A, hits);
          if (hv) { A.dot(hv.x, hv.y, { r: 6, hollow: true, color: 'ink', width: 2 }); A.textPx(`${hv.r.name} · ${massTxt(hv.r.m)} · ${v.fmt(hv.r.D, 3)}/km²`, Math.min(hv.X + 10, A.W - 8), hv.Y - 12, { align: hv.X > A.W * 0.55 ? 'right' : 'left', size: 12, weight: 600 }); }
          // energy per area
          const E = sel.filter((r) => !meas || (r.b && r.bm)).map((r) => [r.m / 1000, r.D * (meas ? bmrW(r) : K.f(r.m / 1000)), r.troph]);
          for (let t = 0; t < 4; t++) Bst.dots(E.filter((e) => e[2] === t), { r: 2.5, color: TC[t], alpha: 0.7 });
          const FE = logFit(M, E.map((e) => e[0]), E.map((e) => e[1]));
          const xs = E.map((e) => e[0]);
          if (FE) {
            Bst.fn(FE.f, { color: 'accent', width: 3, domain: [Math.min(...xs), Math.max(...xs)] });
            Bst.text(`slope ${fx(FE.slope, 2)}`, Math.max(...xs), FE.f(Math.max(...xs)), { align: 'right', dy: -12, color: 'accent', weight: 700 });
          }
          const byT = [1, 3].map((t) => { const e = E.filter((x) => x[2] === t); return e.length > 3 ? 10 ** M.mean(e.map((x) => Math.log10(x[1]))) : null; });
          info = { F, FE, n: sel.length, nE: E.length, g, byT, hv };
        });
        v.legend([['green', 'herbivore', { dot: true }], ['gold', 'omnivore', { dot: true }], ['red', 'carnivore', { dot: true }], ['faint', 'unknown', { dot: true }], ['accent', 'least-squares fit'], ['ink', 'Damuth (1981)', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { F, FE, n, nE, byT, hv } = info;
          let s = String.raw`density: ${n} species, exponent ${fx(F.slope, 3)} (95 % CI ${fx(F.lo, 3)} to ${fx(F.hi, 3)}); Damuth's 1981 value −0.75 · energy use per km²: ${nE} species, exponent **${FE ? fx(FE.slope, 3) : '–'}** (95 % CI ${FE ? fx(FE.lo, 3) + ' to ' + fx(FE.hi, 3) : '–'}) — close to 0, as energetic equivalence predicts`;
          if (byT[0] && byT[1]) s += ` · typical energy use: herbivores ${v.fmt(byT[0], 3)} W/km², carnivores ${v.fmt(byT[1], 3)} W/km² (${(byT[0] / byT[1]).toFixed(0)}× less)`;
          if (hv) s += ` · **${hv.r.name}** (${TN[hv.r.troph]}): ${v.fmt(hv.r.D, 3)} per km²`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Principle',
      name: 'Bergmann’s rule',
      credit: 'Carl Bergmann, 1847',
      statement: String.raw`Within a broadly distributed group of warm-blooded animals — a species, or a set of closely related species — populations and species living in colder climates (usually at higher latitudes) tend to be **larger** than those in warmer climates. The classic explanation is thermal: a larger body has less surface per unit of heat-producing mass, so it loses heat more slowly relative to its production and can keep warm at lower air temperatures without spending extra energy.`,
      scope: String.raw`A tendency, not a law: in large comparative studies a majority, but far from all, of species and clades follow it (here 71 of 130 bird families). Much of the pattern may have causes other than heat conservation — resource seasonality and fasting endurance, starvation resistance, migration — and ectotherms follow it inconsistently.`,
      idea: String.raw`Heat production scales with mass and heat loss with surface. If production were proportional to volume, as Bergmann assumed, the ratio of production to surface would grow as $M^{1/3}$ and size would be a powerful insulator. With Kleiber's $M^{3/4}$ (1.5) and a body surface of about $0.11\,M^{0.65}$ m² (Stahl 1967), the ratio grows only as $M^{0.1}$: the lower critical temperature — the air temperature below which an animal must raise its metabolism to stay warm, $T_{lc} = T_b - B/(hA)$ — falls with size, but slowly, and insulation $h$ matters much more. This is why Bergmann's rule is a weak statistical trend rather than a strict rule.`,
      caption: String.raw`Left: the lower critical temperature of a model mammal (body temperature 38 °C, metabolic rate from the Kleiber fit of 1.5, surface area from Stahl's formula) against body mass, for the insulation set by the slider. Drag the animal (gold) along the curve and the air temperature (red line): below its critical temperature an animal must burn extra energy, shown in the readout. Switch heat production to Bergmann's "∝ volume" assumption to see how much stronger the effect would be. The black dot is the arctic fox's measured winter value (−7 °C), which this model matches with $h\approx 0.64$. Right: real data from AVONET — body mass against the latitude of the range centre for every species in a bird family. Penguins follow the rule (the emperor is the largest and the most southerly); tits and sandpipers run the other way.`,
      deps: ['ecol-1.4'],
      see: ['ecol-1.5', 'thermo-7.5', 'physio-9.14', 'arch-7.1'],
      refs: ['Begon ch. 2'],
      tags: ['ecogeographic rules', 'body size', 'data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bergmann%27s_rule' },
      viz(v) {
        const M = v.M, R = mammals().filter((r) => r.b && r.bm);
        const K = logFit(M, R.map((r) => r.bm / 1000), R.map(bmrW));
        const prodSel = v.select('heat production', [{ value: 'k', label: '∝ M^0.72 (Kleiber fit)' }, { value: 'v', label: '∝ volume (Bergmann)' }], 'k');
        const ins = v.slider(String.raw`insulation: conductance $h$ (W m⁻² K⁻¹)`, 0.3, 8, 1, { log: true, sig: 2 });
        const fam = v.select('bird family', ['Spheniscidae', 'Alcidae', 'Laridae', 'Podicipedidae', 'Paridae', 'Scolopacidae'].map((f) => ({ value: f, label: BIRD_NAMES[f] })), 'Spheniscidae');
        const A = v.stage({ x: [1e-3, 3e3], y: [-60, 42], xlog: true, axes: 'box', height: 360, weight: 1, xlabel: 'body mass (kg)', title: 'lower critical temperature (°C)' });
        const B = v.stage({ x: [-6, 80], y: [5, 6e4], ylog: true, axes: 'box', height: 360, weight: 1, hover: true, xlabel: '|latitude of range centre| (°)', title: 'body mass (g)' });
        const Tb = 38, area = (m) => 0.11 * m ** 0.65;
        const prod = (m) => (prodSel.value === 'k' ? K.f(m) : K.f(1) * m);
        const Tlc = (m) => Tb - prod(m) / (ins.value * area(m));
        const hm = A.handle(3.5, 0, { color: 'gold', constrain: (x) => { const m = M.clamp(x, 2e-3, 2e3); return [m, M.clamp(Tlc(m), -59, 41)]; } });
        const ha = A.handle(400, -20, { color: 'red', constrain: (x, y) => [400, M.clamp(y, -55, 38)] });
        const fams = familySummary();
        let info = null;
        v.render(() => {
          hm.set(hm.x, M.clamp(Tlc(hm.x), -59, 41));
          const Ta = ha.y;
          A.hline(Ta, { color: 'red', width: 1.6, dash: [6, 4] });
          A.text(`air ${fx(Ta, 0)} °C`, 400, Ta, { color: 'red', dx: -14, dy: -11, size: 11, weight: 600, align: 'right' });
          A.clip(() => {
            A.between((x) => Math.max(Tlc(x), Ta), () => Ta, 1e-3, 3e3, { fill: 'red', fillAlpha: 0.12, n: 160 });
            A.fn(Tlc, { color: 'accent', width: 3 });
          });
          A.text('red: air too cold for that size — extra heat needed', 1.3e-3, 40, { size: 10.5, color: 'muted', baseline: 'top' });
          A.dot(3.5, -7, { r: 5, color: 'ink', ring: false });
          A.text('arctic fox (winter)', 3.5, -7, { dx: 8, dy: 10, size: 10.5, color: 'ink' });
          A.text(massTxt(hm.x * 1000), hm.x, hm.y, { color: 'gold', dy: -16, align: 'center', weight: 700, size: 11.5 });
          const m = hm.x, need = Math.max(0, ins.value * area(m) * (Tlc(m) - Ta));
          const per10 = Tlc(m) - Tlc(m * 10);
          // birds
          const bs = birds().filter((b) => b.fam === fam.value);
          const L = lin(bs.map((b) => Math.abs(b.lat)), bs.map((b) => Math.log10(b.mass)));
          const hits = [];
          for (const b of bs) { B.dot(Math.abs(b.lat), b.mass, { r: 3.4, color: L.r > 0 ? 'accent' : 'red', alpha: 0.8, ring: false }); hits.push({ X: B.X(Math.abs(b.lat)), Y: B.Y(b.mass), r: b, x: Math.abs(b.lat), y: b.mass }); }
          B.fn((x) => 10 ** (L.a + L.b * x), { color: L.r > 0 ? 'accent' : 'red', width: 2.6, domain: [Math.min(...hits.map((h) => h.x)), Math.max(...hits.map((h) => h.x))] });
          const ys = bs.map((b) => b.mass); B.setView(null, [Math.min(...ys) / 2, Math.max(...ys) * 2.5]);
          if (fam.value === 'Spheniscidae') for (const [nm, lab, pos] of [['Aptenodytes forsteri', 'emperor', 'w'], ['Aptenodytes patagonicus', 'king', 'w'], ['Spheniscus mendiculus', 'Galápagos', 'e'], ['Eudyptula minor', 'little', 's']]) { const b = bs.find((x) => x.name === nm); if (b) B.dot(Math.abs(b.lat), b.mass, { r: 4.5, hollow: true, color: 'ink', label: lab, labelPos: pos, math: false, labelSize: 11 }); }
          const hv = hoverPick(B, hits);
          if (hv) { B.dot(hv.x, hv.y, { r: 6, hollow: true, color: 'ink', width: 2 }); B.textPx(`${hv.r.name} · ${massTxt(hv.r.mass)}`, Math.min(hv.X + 10, B.W - 8), hv.Y - 12, { align: hv.X > B.W * 0.55 ? 'right' : 'left', size: 12, weight: 600 }); }
          info = { m, T: Tlc(m), need, bmr: prod(m), per10, L, n: bs.length, Ta, hv, pos: fams.filter((f) => f.rB > 0).length, tot: fams.length };
        });
        v.legend([['accent', 'lower critical temperature / bird family following the rule'], ['red', 'air temperature / family against the rule'], ['gold', 'your animal', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          let s = `a ${massTxt(i.m * 1000)} mammal: metabolic rate ${v.fmt(i.bmr, 3)} W, lower critical temperature **${fx(i.T, 1)} °C**; a body 10× heavier is comfortable down to ${Math.abs(i.per10).toFixed(1)} °C lower · at ${fx(i.Ta, 0)} °C it ${i.need > 0 ? `must produce ${v.fmt(i.need, 3)} W extra (${Math.round((100 * i.need) / i.bmr)} % of its basal rate)` : 'needs no extra heat'}`;
          s += ` · ${BIRD_NAMES[fam.value]}: ${i.n} species, mass changes by ${fx(100 * (10 ** (i.L.b * 10) - 1), 0)} % per 10° of latitude, r = ${fx(i.L.r, 2)} · across all ${i.tot} bird families with ≥ 10 species, ${i.pos} have r > 0`;
          if (i.hv) s += ` · **${i.hv.r.name}**`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Principle',
      name: 'Allen’s rule',
      credit: 'Joel Asaph Allen, 1877',
      statement: String.raw`Among warm-blooded animals of the same group, those from colder climates tend to have **shorter appendages** — ears, limbs, tails, bills — relative to body size than those from warmer climates, so their surface-to-volume ratio is lower. The arctic fox's short, thick ears and the fennec's huge ears (9–10 cm on a head-and-body length of 35–40 cm) are the textbook pair.`,
      scope: String.raw`A statistical tendency within related groups, strongest for appendages that act as radiators (bird bills and mammal ears are richly supplied with blood vessels and can be flushed or shut down). Part of the pattern is developmental plasticity: mice reared in the cold grow shorter tails and ears.`,
      idea: String.raw`Appendages are thin, so they carry much surface and little volume: lengthening them raises the surface-to-volume ratio of the whole animal almost without adding heat-producing tissue. In the cold that surface is a liability; in the heat it is a radiator that sheds heat without evaporating water. Allen's rule is the shape counterpart of Bergmann's size rule (1.10). Bills of birds provide a modern test: Symonds and Tattersall (2010) found shorter bills in colder regions across 214 species in eight groups (toucans, parrots, gamebirds, penguins, gulls and terns among them), and the AVONET data used here show the same trend within most bird families.`,
      caption: String.raw`Left: a schematic mammal of fixed body size. Drag the ear and limb sliders, or pick a preset (illustrative proportions; the desert preset uses the fennec's ear-to-body ratio): surface area rises much faster than volume, and the readout shows how much more heat the animal loses at the same body–air temperature difference. Right: real data from AVONET — bill length corrected for body mass (the percentage by which a species' bill is longer or shorter than expected for its mass within its family) against the latitude of its range centre. In penguins, gulls and auks, high-latitude species have relatively shorter bills; across 130 families the negative trend wins most of the time.`,
      deps: ['ecol-1.10'],
      see: ['ecol-1.4'],
      refs: ['Begon ch. 2'],
      tags: ['ecogeographic rules', 'body shape', 'data'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Allen%27s_rule' },
      viz(v) {
        const M = v.M;
        const preset = v.select('preset', [{ value: 'arc', label: 'cold-adapted' }, { value: 'tem', label: 'temperate' }, { value: 'des', label: 'desert (fennec-like ears)' }], 'tem', {
          onChange: (p) => { const P = { arc: [8, 0.7], tem: [15, 1], des: [26, 1.15] }[p]; ear.set(P[0]); limb.set(P[1]); },
        });
        const ear = v.slider('ear length (% of body length)', 4, 32, 15, { step: 0.5 });
        const limb = v.slider('limb and tail length (× temperate)', 0.5, 1.5, 1, { step: 0.01 });
        const fam = v.select('bird family', ['Spheniscidae', 'Laridae', 'Alcidae', 'Phasianidae', 'Ramphastidae', 'Paridae'].map((f) => ({ value: f, label: BIRD_NAMES[f] })), 'Laridae');
        const A = v.stage({ x: [-52, 46], y: [-36, 34], equal: true, axes: false, height: 340, weight: 1, title: 'surface against volume' });
        const B = v.stage({ x: [-5, 80], y: [-40, 40], axes: 'box', height: 340, weight: 1, hover: true, xlabel: '|latitude of range centre| (°)', title: 'bill length vs expected for body mass (%)' });
        const ref = animalSV(8 / 100 * 50, 18 * 0.7, 30 * 0.7);
        let info = null;
        v.render(() => {
          const e = (ear.value / 100) * 50, lg = 18 * limb.value, tl = 30 * limb.value, sv = animalSV(e, lg, tl);
          const col = ear.value > 20 ? 'gold' : ear.value < 10 ? 'teal' : 'orange';
          drawAnimal(A, e, lg, tl, col);
          A.text(`S/V = ${(sv.S / sv.V).toFixed(3)} per cm`, -50, 30, { size: 12, weight: 600 });
          A.text(`ears ${e.toFixed(1)} cm · legs ${lg.toFixed(0)} cm · tail ${tl.toFixed(0)} cm`, -50, 24, { size: 11, color: 'muted' });
          // change in surface and volume relative to the cold-adapted preset (1 cm of bar per 1 %)
          const dS = 100 * (sv.S / ref.S - 1), dV = 100 * (sv.V / ref.V - 1);
          A.text('vs cold-adapted:', -50, 17.5, { size: 11, color: 'muted' });
          A.line(-28, 13.5, -28, 6.5, { color: 'muted', width: 1 });
          A.rect(-28, 11, -28 + dS, 13.5, { fill: 'red', fillAlpha: 0.75, stroke: false });
          A.rect(-28, 6.5, -28 + dV, 9, { fill: 'teal', fillAlpha: 0.75, stroke: false });
          A.text(`surface ${fx(dS, 1)} %`, -29, 12.25, { size: 10.5, align: 'right', color: 'red', weight: 600 });
          A.text(`volume ${fx(dV, 1)} %`, -29, 7.75, { size: 10.5, align: 'right', color: 'teal', weight: 600 });
          // birds: size-corrected bill length within the family
          const bs = birds().filter((b) => b.fam === fam.value);
          const F = lin(bs.map((b) => Math.log10(b.mass)), bs.map((b) => Math.log10(b.bill)));
          const res = bs.map((b) => 100 * (10 ** (Math.log10(b.bill) - (F.a + F.b * Math.log10(b.mass))) - 1));
          const lats = bs.map((b) => Math.abs(b.lat)), L = lin(lats, res.map((r) => Math.log10(1 + r / 100)));
          const sortedAbs = res.map(Math.abs).sort((p, q) => p - q), yr = Math.max(25, sortedAbs[Math.floor(0.97 * (sortedAbs.length - 1))] * 1.2); B.setView(null, [-yr, yr]);
          B.hline(0, { color: 'muted', width: 1 });
          const hits = [];
          bs.forEach((b, i) => { B.dot(lats[i], M.clamp(res[i], -yr * 0.98, yr * 0.98), { r: 3.4, color: L.r < 0 ? 'accent' : 'red', alpha: 0.8, ring: false }); hits.push({ X: B.X(lats[i]), Y: B.Y(res[i]), r: b, x: lats[i], y: res[i] }); });
          B.fn((x) => 100 * (10 ** (L.a + L.b * x) - 1), { color: L.r < 0 ? 'accent' : 'red', width: 2.6, domain: [Math.min(...lats), Math.max(...lats)] });
          const hv = hoverPick(B, hits);
          if (hv) { B.dot(hv.x, hv.y, { r: 6, hollow: true, color: 'ink', width: 2 }); B.textPx(`${hv.r.name} · bill ${hv.r.bill} mm · ${massTxt(hv.r.mass)}`, Math.min(hv.X + 10, B.W - 8), hv.Y - 12, { align: hv.X > B.W * 0.55 ? 'right' : 'left', size: 12, weight: 600 }); }
          const fs = familySummary();
          info = { sv, ref, L, n: bs.length, neg: fs.filter((f) => f.rA < 0).length, tot: fs.length, hv };
        });
        v.legend([['accent', 'family following the rule'], ['red', 'family against the rule']]);
        v.readout(() => {
          if (!info) return '';
          const { sv, ref, L, n, neg, tot, hv } = info;
          let s = `surface ${Math.round(sv.S)} cm², volume ${Math.round(sv.V)} cm³ · heat loss at the same temperature difference **${fx(100 * (sv.S / ref.S - 1), 1)} %** compared with the cold-adapted preset, while heat-producing volume changes by only ${fx(100 * (sv.V / ref.V - 1), 1)} %`;
          s += ` · ${BIRD_NAMES[fam.value]} (${n} species): relative bill length changes by ${fx(100 * (10 ** (L.b * 10) - 1), 1)} % per 10° of latitude, r = ${fx(L.r, 2)} · ${neg} of ${tot} bird families have relatively shorter bills toward the poles`;
          if (hv) s += ` · **${hv.r.name}**: ${fx(hv.y, 0)} %`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Phenomenon',
      name: 'Island rule: dwarfs and giants',
      credit: 'J. Bristol Foster, 1964; named by Leigh Van Valen, 1973',
      statement: String.raw`Isolated on islands, mammal species that are small on the mainland tend to evolve **larger** bodies (insular gigantism) and species that are large tend to evolve **smaller** ones (insular dwarfism): the relative size $S_i$ = insular mass ÷ mainland mass declines with mainland mass and crosses 1 at an intermediate size. For non-volant mammals Lomolino (2005) fitted $S_i = 1.355 - 0.120\log_{10}W$ ($W$ = mainland mass in grams, 384 island populations), which crosses $S_i = 1$ at about 920 g; the crossing differs between groups (about 270 g for rodents, about 7 kg for even-toed ungulates). Equivalently, the slope of log insular mass against log mainland mass is less than 1.`,
      scope: String.raw`A statistical trend with much scatter; it is strongest on small, remote islands and in some groups (rodents, carnivores, ungulates, lagomorphs) and weak or absent in others (shrews here). Extinct island dwarfs — elephants on Mediterranean islands, *Homo floresiensis* — and giant rodents are its spectacular extremes.`,
      idea: String.raw`Islands change the selective pressures that set body size. Small species escape predators and competitors and are released toward larger, more efficient sizes; large species face limited food and space and are selected toward smaller sizes that a small island can support; immigration favours some sizes (good dispersers) over others. Together these pull insular forms toward an intermediate optimum, so the regression of $S_i$ on mainland size slopes downward — the shape-and-size theme of Bergmann's rule (1.10) played out on an evolutionary time scale.`,
      caption: String.raw`A **synthetic** sample, not real populations: mainland masses are drawn across each group's typical range, and island sizes are generated from Lomolino's (2005) published regression for that group, with scatter matching his $r^2$ and the same number of populations. The blue line is refitted to the sample, so its slope and crossing can be compared with the published values in the readout. Points above the line $S_i = 1$ are giants, below it dwarfs. Switch to **insular vs mainland mass** to see the same pattern as a slope below 1 crossing the 1:1 line, and choose **shrews**, where the trend vanishes. New sample draws again.`,
      deps: ['ecol-1.10'],
      refs: ['MacArthur–Wilson ch. 7'],
      tags: ['ecogeographic rules', 'islands', 'evolution'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Island_gigantism' },
      viz(v) {
        const M = v.M;
        const grp = v.select('group', Object.entries(LOMOLINO).map(([k, g]) => ({ value: k, label: g.lab })), 'all');
        const view = v.select('view', [{ value: 'si', label: 'relative size Si' }, { value: 'mm', label: 'insular vs mainland mass' }], 'si');
        let seed = 9;
        v.button('new sample', () => { seed++; });
        const s = v.stage({ x: [1, 1e7], y: [0.15, 6], xlog: true, ylog: true, height: 380, full: true, axes: 'box', xlabel: 'mainland body mass (g)', title: 'insular ÷ mainland body mass, Si' });
        let info = null;
        v.render(() => {
          const g = LOMOLINO[grp.value], rng = v.rng(seed * 31 + grp.value.length), [x0, x1] = g.range;
          const varx = (x1 - x0) ** 2 / 12, r2 = Math.max(g.r2, 0.02);
          const sd = g.r2 > 0.02 ? Math.sqrt((g.b1 * g.b1 * varx * (1 - r2)) / r2) : 0.22;
          const pts = [];
          for (let i = 0; i < g.n; i++) {
            const lx = rng.uniform(x0, x1); let si = g.b0 + g.b1 * lx + sd * rng.normal();
            si = Math.max(0.12, si); pts.push([10 ** lx, si]);
          }
          const R = M.linreg(pts.map((p) => Math.log10(p[0])), pts.map((p) => p[1]));
          const RB = M.linreg(pts.map((p) => Math.log10(p[0])), pts.map((p) => Math.log10(p[0] * p[1])));
          const sf = 10 ** ((1 - R.intercept) / R.slope);
          const mm = view.value === 'mm';
          if (mm) {
            s.setView([10 ** (x0 - 0.4), 10 ** (x1 + 0.4)], [10 ** (x0 - 0.7), 10 ** (x1 + 0.7)]); s.setTitle('insular body mass (g), against mainland mass');
            s.fn((x) => x, { color: 'ink', dash: [6, 5], width: 1.5 });
            s.text('1 : 1', 10 ** (x1 + 0.25), 10 ** (x1 + 0.25), { dx: -6, dy: -10, align: 'right', size: 11 });
            s.dots(pts.filter((p) => p[1] >= 1).map((p) => [p[0], p[0] * p[1]]), { r: 3, color: 'orange', alpha: 0.75 });
            s.dots(pts.filter((p) => p[1] < 1).map((p) => [p[0], p[0] * p[1]]), { r: 3, color: 'teal', alpha: 0.75 });
            s.fn((x) => 10 ** (RB.intercept + RB.slope * Math.log10(x)), { color: 'accent', width: 3, domain: [10 ** x0, 10 ** x1] });
          } else {
            s.setView([10 ** (x0 - 0.4), 10 ** (x1 + 0.4)], [0.15, 6]); s.setTitle('insular ÷ mainland body mass, Si');
            s.hband(1, 6, { color: 'orange', alpha: 0.06 }); s.hband(0.15, 1, { color: 'teal', alpha: 0.06 });
            s.hline(1, { color: 'ink', width: 1.4 });
            s.text('giants', s.xr[0], 4.5, { dx: 40, color: 'orange', weight: 700, size: 13 });
            s.text('dwarfs', s.xr[0], 0.21, { dx: 40, color: 'teal', weight: 700, size: 13 });
            s.dots(pts.filter((p) => p[1] >= 1), { r: 3, color: 'orange', alpha: 0.75 });
            s.dots(pts.filter((p) => p[1] < 1), { r: 3, color: 'teal', alpha: 0.75 });
            s.clip(() => {
              s.fn((x) => g.b0 + g.b1 * Math.log10(x), { color: 'ink', dash: [6, 5], width: 1.5, domain: [10 ** x0, 10 ** x1] });
              s.fn((x) => R.intercept + R.slope * Math.log10(x), { color: 'accent', width: 3, domain: [10 ** x0, 10 ** x1] });
            });
            if (sf > s.xr[0] && sf < s.xr[1] && R.slope < 0) { s.dot(sf, 1, { r: 5.5, color: 'gold', label: `Si = 1 at ${massTxt(sf)}`, labelPos: 'ne', math: false, labelSize: 11.5, labelColor: 'ink' }); }
          }
          info = { g, R, RB, sf, n: pts.length, giants: pts.filter((p) => p[1] > 1).length };
        });
        v.legend([['orange', 'island giants (Si > 1)', { dot: true }], ['teal', 'island dwarfs (Si < 1)', { dot: true }], ['accent', 'least-squares fit to the sample'], ['ink', 'Lomolino (2005) published line / 1:1', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { g, R, RB, sf, n, giants } = info;
          const sfT = R.slope < 0 && sf > 0.1 && sf < 1e8 ? massTxt(sf) : 'no crossing';
          return String.raw`${g.lab}, ${n} synthetic island populations (${giants} giants): refitted $S_i = ${R.intercept.toFixed(3)} ${R.slope < 0 ? '-' : '+'} ${Math.abs(R.slope).toFixed(3)}\log_{10}W$, crossing $S_i = 1$ at ${sfT} · published: $S_i = ${g.b0.toFixed(3)} - ${Math.abs(g.b1).toFixed(3)}\log_{10}W$, crossing at ${massTxt(g.sf)} · slope of log insular on log mainland mass ${RB.slope.toFixed(3)} (published ${g.b1b.toFixed(3)}; 1 would mean no island effect)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Paper',
      name: 'Body Size and Metabolism',
      paper: { authors: 'Max Kleiber', year: 1932, title: 'Body size and metabolism', venue: 'Hilgardia 6 (11): 315–353', doi: '10.3733/hilg.v06n11p315' },
      introduces: ['ecol-1.5'],
      credit: 'Max Kleiber, 1932',
      statement: String.raw`Kleiber compiled the best available measurements of basal heat production for 13 groups of mature animals, from ring doves (0.15 kg) and rats to steers (679 kg), and asked which measure of size makes metabolism most nearly constant. Metabolism per square metre of body surface — the accepted "surface law" — still varied with a coefficient of variability of 34 % and rose systematically with size. Metabolism per unit of a power $W^n$ of body weight did much better: the variability was smallest for exponents near $n = 0.74$ (7.6 %), and on log–log axes the 13 groups fell on a straight line. Kleiber concluded that the $3/4$ power of body weight was the best-fitting unit for comparing the metabolism of animals of different size, and that any power between $2/3$ and $3/4$ was preferable to body surface, which is ill-defined and hard to measure.`,
      idea: String.raw`Since Sarrus and Rameaux (1839) and Rubner (1883), physiologists had explained the higher metabolism of small animals by Newtonian heat loss through their larger relative surface, and "Calories per square metre" was the standard unit (Voit's table gave about 1 000 kcal per m² per day for all animals). Kleiber, at Davis, replaced the physical argument by an empirical question and a statistical test — the coefficient of variability of $M/W^n$ as a function of $n$, and the "coefficient of tendency" measuring any remaining trend with size — and found the exponent that removes the size trend. His 1947 review in *Physiological Reviews* extended the comparison to more species and again found an exponent near 0.74, and in *The Fire of Life* (1961) he recommended $70\,W^{3/4}$ kcal per day as the standard basal metabolism of mammals. The rule became Kleiber's law (1.5) and, seventy years later, the starting point of the metabolic theory of ecology.`,
      caption: String.raw`Kleiber's own data (his Table 1). Left: the 13 groups on log–log axes, with the line of slope $n$ that fits them best; drag the gold point on the right to change $n$, and toggle the surface law's $2/3$ line. Drag the purple handle along the weight axis to predict the metabolism of any animal with Kleiber's unit. Right: the coefficient of variability of heat production per $W^n$, recomputed from the table, against $n$; Kleiber's printed values are the hollow circles and the dashed line is his variability per square metre of surface. Exclude the ruminants (steers, cow, sheep) to get his second row: the minimum moves to about 0.73.`,
      deps: ['ecol-1.4'],
      refs: [],
      tags: ['metabolism', 'scaling', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kleiber%27s_law' },
      viz(v) {
        const M = v.M;
        const excl = v.toggle('exclude ruminants (9 groups)', false);
        const surf = v.toggle('show the surface law (slope 2/3)', true);
        const A = v.stage({ x: [0.08, 1500], y: [7, 2e4], xlog: true, ylog: true, axes: 'box', height: 360, weight: 1.15, xlabel: 'body weight W (kg)', title: 'heat production (kcal per 24 h)' });
        const B = v.stage({ x: [0.6, 1.02], y: [0, 45], axes: 'box', height: 360, weight: 1, xlabel: 'exponent n', title: 'variability of heat production per Wⁿ (%)' });
        const rows = () => KLEIBER.filter((_, i) => !excl.value || !RUMINANTS.has(i));
        const hn = B.handle(0.75, 8, { color: 'gold', constrain: (x) => { const n = M.clamp(x, 0.62, 1.0); return [n, Math.min(44, cvOf(rows(), n).cv)]; } });
        const hw = A.handle(5, 9.5, { color: 'purple', constrain: (x) => [M.clamp(x, 0.1, 1200), 9.5] });
        let info = null;
        v.render(() => {
          const rs = rows(), n = hn.x, { mean } = cvOf(rs, n);
          hn.set(n, Math.min(44, cvOf(rs, n).cv));
          // left: data and lines
          KLEIBER.forEach(([, W, Mh], i) => { const on = !excl.value || !RUMINANTS.has(i); A.dot(W, Mh, { r: 4.5, color: on ? 'accent' : 'faint' }); });
          for (const [lab, W, Mh, al, faded] of [['steers, cow', 400, 6800, 'right', excl.value], ['man, woman, sheep', 55, 1450, 'right', false], ['dogs', 13.4, 480, 'right', false], ['hen', 1.96, 106, 'right', false], ['pigeon, rats, ring dove', 0.2, 23, 'left', false]])
            A.text(faded ? lab + ' (excluded)' : lab, W, Mh, { align: al, dx: al === 'right' ? -10 : 10, dy: al === 'right' ? -9 : 12, size: 11, color: faded ? 'muted' : 'ink' });
          const sl = M.linreg(rs.map((r) => Math.log10(r[1])), rs.map((r) => Math.log10(r[2])));
          A.fn((W) => mean * W ** n, { color: 'gold', width: 2.6 });
          if (surf.value) { const m23 = cvOf(rs, 2 / 3).mean; A.fn((W) => m23 * W ** (2 / 3), { color: 'orange', dash: [6, 5], width: 1.6 }); }
          const Wp = hw.x, Mp = mean * Wp ** n;
          A.line(Wp, 9.5, Wp, Mp, { color: 'purple', dash: [3, 4], width: 1.2 });
          A.dot(Wp, Mp, { r: 4.5, color: 'purple' });
          A.text(`${v.fmt(Mp, 3)} kcal/day`, Wp, Mp, { dx: 8, dy: 10, color: 'purple', size: 11.5, weight: 600 });
          // right: CV curve
          B.fn((x) => cvOf(rs, x).cv, { color: 'accent', width: 2.8, n: 200 });
          const surfCV = excl.value ? 16.0 : 33.7;
          B.hline(surfCV, { color: 'orange', dash: [6, 5], width: 1.5 });
          B.text(`per m² of body surface: ${surfCV} %`, 1.0, surfCV, { align: 'right', dy: -10, color: 'orange', size: 11 });
          for (const [kn, c13, c9] of KLEIBER_CV) { const c = excl.value ? c9 : c13; if (c <= 45) B.dot(kn, c, { r: 4.5, hollow: true, color: 'ink' }); }
          let best = [0, 1e9]; for (let x = 0.62; x <= 1; x += 0.0005) { const c = cvOf(rs, x).cv; if (c < best[1]) best = [x, c]; }
          B.vline(best[0], { color: 'green', dash: [3, 4], width: 1.2 });
          B.text(`minimum at n = ${best[0].toFixed(3)}`, best[0], 40, { dx: 6, color: 'green', size: 11, weight: 600 });
          info = { n, cv: cvOf(rs, n).cv, mean, best, sl, Wp, Mp, k: rs.length, printed: KLEIBER_CV.find((r) => Math.abs(r[0] - n) < 0.003) };
        });
        v.legend([['accent', 'Kleiber’s 13 groups', { dot: true }], ['gold', 'line of slope n'], ['orange', 'surface law', { dash: true }], ['ink', 'Kleiber’s printed variability', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info, se = i.sl.seSlope, t = M.dist.studentT(i.k - 2).quantile(0.975);
          let s = String.raw`$n = ${i.n.toFixed(3)}$: mean heat production per $W^n$ ${i.mean.toFixed(1)} kcal/day over ${i.k} groups, coefficient of variability **${i.cv.toFixed(1)} %**`;
          if (i.printed) s += ` (Kleiber printed ±${excl.value ? i.printed[2] : i.printed[1]} %)`;
          s += String.raw` · variability is smallest at $n = ${i.best[0].toFixed(3)}$ · least-squares slope of the log–log line ${i.sl.slope.toFixed(3)} (95 % CI ${(i.sl.slope - t * se).toFixed(3)}–${(i.sl.slope + t * se).toFixed(3)}) · a ${i.Wp < 1 ? (i.Wp * 1000).toFixed(0) + ' g' : i.Wp.toFixed(i.Wp < 10 ? 1 : 0) + ' kg'} animal: ${v.fmt(i.Mp, 3)} kcal/day · today: 572 mammals in PanTHERIA give an exponent of 0.72 (1.5), with real curvature`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Paper',
      name: 'Concluding Remarks',
      paper: { authors: 'G. E. Hutchinson', year: 1957, title: 'Concluding Remarks', venue: 'Cold Spring Harbor Symposia on Quantitative Biology 22: 415–427', doi: '10.1101/SQB.1957.022.01.039' },
      introduces: ['ecol-1.1', 'ecol-4.1'],
      credit: 'G. Evelyn Hutchinson, 1957',
      statement: String.raw`In his closing address to the 1957 Cold Spring Harbor symposium on population studies, Hutchinson defined the **fundamental niche** of a species as an $n$-dimensional hypervolume: the set of points in a space whose axes are environmental variables, each point a state of the environment that would let the species persist indefinitely. He then asked what happens when the fundamental niches of two species intersect. By the Volterra–Gause principle (competitive exclusion) the two cannot share the intersection at equilibrium: each point of the overlap is held by one species only, so each species' **realized niche** is its fundamental niche minus the part of the overlap it loses. If one niche lies entirely inside the other and its owner is the weaker competitor there, that species is excluded altogether. Habitat (the biotope) and niche are distinct: places map to points of niche space, and two species can share a habitat while their niches never overlap.`,
      idea: String.raw`Grinnell (1917) had used "niche" for the habitat requirements of a species and Elton (1927) for its role in the community. Hutchinson, at Yale, gave the word a precise set-theoretic meaning that could be measured, compared and intersected, and separated the potential (fundamental) niche from the part a species actually occupies under competition (realized). The address framed the questions of the next decades — limiting similarity, niche overlap, character displacement, coexistence theory (ecol-4.1–4.9) — and the hypervolume returned in the 2000s as the basis of species-distribution modelling. Two years later his "Homage to Santa Rosalia" asked why there are so many kinds of animals.`,
      caption: String.raw`A reconstruction of the argument of the paper (it contains no data to replot). Left: niche space with two axes, temperature and food size; drag the corners of the two fundamental niches (blue $N_1$, orange $N_2$). Choose who wins the overlap — species 1, species 2, or each where it is closer to its own optimum — and the filled regions show the realized niches. Right: a landscape (the biotope), whose temperature and food size vary from place to place; each place is coloured by the species that holds it. Slide $N_1$ inside $N_2$ and make species 1 the loser: it vanishes from the map entirely. Pull the niches apart and the realized niches equal the fundamental ones.`,
      deps: ['ecol-1.3', 'mathbio-3.17'],
      see: ['ecol-1.1', 'ecol-4.1'],
      refs: [],
      tags: ['niche', 'competition', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ecological_niche' },
      viz(v) {
        const M = v.M;
        const rule = v.select('the overlap goes to', [{ value: '1', label: 'species 1' }, { value: '2', label: 'species 2' }, { value: 'split', label: 'whichever is closer to its optimum' }], 'split');
        const A = v.stage({ x: [0, 30], y: [0, 10], axes: 'box', height: 340, weight: 1, title: 'niche space: temperature (°C) × food size (mm)' });
        const B = v.stage({ x: [0, 48], y: [0, 32], equal: true, axes: false, height: 340, weight: 1, title: 'the biotope: who holds each place' });
        const a1 = A.handle(4, 2, { color: 'accent' }), b1 = A.handle(17, 7, { color: 'accent' });
        const a2 = A.handle(12, 3.5, { color: 'orange' }), b2 = A.handle(26, 9, { color: 'orange' });
        // landscape: smooth fields of temperature and food size on a 48 × 32 grid
        const GW = 48, GH = 32, temp = [], food = [];
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
          temp.push(2 + 26 * (i / (GW - 1)) + 2.2 * Math.sin(i / 4.1 + j / 6.3) + 1.6 * Math.cos(j / 3.7));
          food.push(0.6 + 8.8 * (j / (GH - 1)) + 0.9 * Math.sin(i / 3.3 - j / 5.1) + 0.7 * Math.cos(i / 6.7));
        }
        const owner = (x, y, N1, N2) => {
          const in1 = x >= N1[0] && x <= N1[2] && y >= N1[1] && y <= N1[3], in2 = x >= N2[0] && x <= N2[2] && y >= N2[1] && y <= N2[3];
          if (in1 && !in2) return 1; if (in2 && !in1) return 2; if (!in1) return 0;
          if (rule.value === '1') return 1; if (rule.value === '2') return 2;
          const d = (N) => Math.max(Math.abs(x - (N[0] + N[2]) / 2) / ((N[2] - N[0]) / 2 || 1e-9), Math.abs(y - (N[1] + N[3]) / 2) / ((N[3] - N[1]) / 2 || 1e-9));
          return d(N1) <= d(N2) ? 1 : 2;
        };
        let info = null;
        v.render(() => {
          const N1 = [Math.min(a1.x, b1.x), Math.min(a1.y, b1.y), Math.max(a1.x, b1.x), Math.max(a1.y, b1.y)];
          const N2 = [Math.min(a2.x, b2.x), Math.min(a2.y, b2.y), Math.max(a2.x, b2.x), Math.max(a2.y, b2.y)];
          const key = [...N1, ...N2, rule.value].map((x) => (typeof x === 'number' ? x.toFixed(3) : x)).join(',');
          const c1 = v.rgb('accent'), c2 = v.rgb('orange');
          A.raster((x, y) => { const o = owner(x, y, N1, N2); return o === 1 ? [c1[0], c1[1], c1[2], 95] : o === 2 ? [c2[0], c2[1], c2[2], 95] : null; }, { res: 2, key });
          A.rect(N1[0], N1[1], N1[2], N1[3], { color: 'accent', width: 2, dash: [6, 4] });
          A.rect(N2[0], N2[1], N2[2], N2[3], { color: 'orange', width: 2, dash: [6, 4] });
          A.tex('N_1', N1[0], N1[3], { color: 'accent', dx: 12, dy: 12 });
          A.tex('N_2', N2[2], N2[3], { color: 'orange', dx: -14, dy: 12 });
          // areas (exact for rectangles; the split rule by sampling)
          const ar = (N) => (N[2] - N[0]) * (N[3] - N[1]);
          const ox = Math.max(0, Math.min(N1[2], N2[2]) - Math.max(N1[0], N2[0])), oy = Math.max(0, Math.min(N1[3], N2[3]) - Math.max(N1[1], N2[1])), ov = ox * oy;
          let w1 = 0, w2 = 0; const G = 80;
          if (ov > 0) for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
            const x = Math.max(N1[0], N2[0]) + ((i + 0.5) / G) * ox, y = Math.max(N1[1], N2[1]) + ((j + 0.5) / G) * oy;
            if (owner(x, y, N1, N2) === 1) w1++; else w2++;
          }
          const r1 = ar(N1) - ov + (ov * w1) / (G * G || 1), r2 = ar(N2) - ov + (ov * w2) / (G * G || 1);
          // biotope map
          let n1 = 0, n2 = 0, both = 0;
          for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
            const k = j * GW + i, x = temp[k], y = food[k], o = owner(x, y, N1, N2);
            const in1 = x >= N1[0] && x <= N1[2] && y >= N1[1] && y <= N1[3], in2 = x >= N2[0] && x <= N2[2] && y >= N2[1] && y <= N2[3];
            if (in1 && in2) both++;
            if (o === 1) n1++; if (o === 2) n2++;
            B.rect(i, GH - 1 - j, i + 1, GH - j, { fill: o === 1 ? 'accent' : o === 2 ? 'orange' : 'grid', fillAlpha: o ? (in1 && in2 ? 0.95 : 0.55) : 0.5, stroke: false });
          }
          B.text('warmer →', 47.5, -0.2, { align: 'right', baseline: 'top', size: 11, color: 'muted' });
          B.text('larger food ↑', 0.3, 32.3, { baseline: 'bottom', size: 11, color: 'muted' });
          info = { a1: ar(N1), a2: ar(N2), ov, r1, r2, n1, n2, both, tot: GW * GH };
        });
        v.legend([['accent', 'species 1: realized niche', { area: true }], ['orange', 'species 2: realized niche', { area: true }], ['muted', 'fundamental niches (dashed)', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info, pc = (x) => Math.round((100 * x) / i.tot);
          let s = `fundamental niches: ${i.a1.toFixed(0)} and ${i.a2.toFixed(0)} units, overlap ${i.ov.toFixed(0)} · realized niches: species 1 ${i.r1.toFixed(0)} (${Math.round((100 * i.r1) / i.a1)} % of its fundamental niche), species 2 ${i.r2.toFixed(0)} (${Math.round((100 * i.r2) / i.a2)} %) · biotope: species 1 holds ${pc(i.n1)} % of places, species 2 ${pc(i.n2)} %, and ${pc(i.both)} % (stronger colour) could be held by either but go to one`;
          if (i.r1 < 1e-6) s += ' · **species 1 is excluded altogether**';
          if (i.r2 < 1e-6) s += ' · **species 2 is excluded altogether**';
          if (i.ov === 0) s += ' · no overlap: realized = fundamental';
          return s;
        });
      },
    },
  ],
};
