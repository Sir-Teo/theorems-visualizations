// Demography — Chapter 2 (The life table): helpers shared by ch02.js and ch02-b.js (plain functions, no runtime access).

export const sum = (a) => a.reduce((s, x) => s + x, 0);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const nums = (s) => s.split(',').map(Number);
/** Fixed decimals with a real minus sign. */
export function fx(x, d = 1) { const s = Math.abs(x).toFixed(d); return (x < 0 && +s !== 0 ? '−' : '') + s; }
/** Integer with thin spaces between thousands. */
export function int(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

// ───────────── real data: UN World Population Prospects 2024 ─────────────
// Mid-year population (thousands) and deaths (persons) in 18 age groups 0–4, 5–9, …, 80–84, 85+ (the same numbers as chapter 1).
const RAW = {
  SWE2019: { name: 'Sweden 2019', P: '603.1,621.8,602.4,564.2,592.6,740.5,703,645.4,633.6,662.7,682.8,609.5,566.7,544.7,562,414.6,267.2,262.2',
    D: '303,33,40,135,268,350,350,408,540,792,1379,2144,3415,5416,9223,11798,14162,38478' },
  USA1950: { name: 'USA 1950', P: '17184.4,13555.6,11346.6,10849.5,11770.5,12488.5,11940.9,11388.9,10431.9,9168.4,8322.2,7290.1,6168,4927.1,3420.6,2180.3,1141,628.2',
    D: '131522,8331,6583,11872,17432,20092,23762,32418,46061,62300,86767,113191,142713,163826,175752,172699,135489,129600' },
  SWE1950: { name: 'Sweden 1950', P: '618.9,571.2,445,418.1,463.7,545.3,533,548,536.9,485.9,431.5,376.1,328.2,267.1,207.6,133.2,68.6,38.2',
    D: '3226,343,219,297,557,676,768,1046,1413,2082,2857,3950,5570,7472,9972,10980,9684,9468' },
  JPN2019: { name: 'Japan 2019', P: '4778,5308.1,5582.3,5972.4,6038.1,6044.5,6665.2,7459.1,8878.9,9937.2,8453.6,7746.3,7563.2,8720.1,8999.4,7280.9,5357.4,5914.7',
    D: '2469,399,453,1222,2070,2092,3002,4495,7962,14583,19915,28216,42907,78180,128515,170229,225445,710249' },
  CHN1990: { name: 'China 1990', P: '127304,107304,97599,123330,127986,106513,85428,87734.2,63242.4,48117.3,44443.9,40372.5,32547.8,25358.1,17610.6,10935.5,5402.3,2354.3',
    D: '1405758,149735,101960,127743,179982,175026,159492,196553,211344,225917,340427,439273,620871,761932,847381,831273,678931,513233' },
  MEX2019: { name: 'Mexico 2019', P: '10633.9,11285.9,11214.7,11251.6,10813.4,10545.7,9679.9,8825.8,8162.1,7576.3,6609.3,5554.9,4385.1,3314.7,2423.4,1672.6,1053.1,760.4',
    D: '30576,2658,3466,10104,16638,20235,20464,21934,26265,34325,41810,52785,61057,65283,72712,80546,84404,123468' },};
export const AGE18 = ['0–4', '5–9', '10–14', '15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49', '50–54', '55–59', '60–64', '65–69', '70–74', '75–79', '80–84', '85+'];
/** Age-specific death rates mₓ (per person-year) of the 18 groups, for each country-year. */
export const WPP = Object.fromEntries(Object.entries(RAW).map(([k, o]) => { const P = nums(o.P), D = nums(o.D); return [k, { name: o.name, m: D.map((d, i) => d / (P[i] * 1000)) }]; }));
export const AGE18_START = Array.from({ length: 18 }, (_, i) => i * 5);

/**
 * Abridged life table from rates mₓ over groups of widths n (the last group is open).
 * a = average years lived in the group by those who die in it (default n/2). q = n m / (1 + (n − a) m).
 */
export function lifeTable(m, ns, as, radix = 1) {
  const K = m.length, x = [0], l = [radix], q = [], d = [], L = [], T = new Array(K), e = new Array(K);
  const a = ns.map((n, i) => (as && as[i] != null ? as[i] : n / 2));
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
/** The 18-group table (0–4, …, 85+) of a WPP country-year; a = 1 year for 0–4 (infant deaths early, 1–4 later), 2.5 otherwise, 85+ open. */
export function wppTable(key, radix = 1) {
  const ns = AGE18_START.map((_, i) => (i === 17 ? Infinity : 5));
  return lifeTable(WPP[key].m, ns, [1], radix);
}
/** Survivorship l(age)/radix from an abridged table: linear within a group (the standard picture), exponential in the open group. */
export function lAt(tb, age) {
  const K = tb.x.length;
  if (age <= 0) return tb.l[0];
  for (let i = 0; i < K; i++) {
    const hi = i === K - 1 ? Infinity : tb.x[i + 1];
    if (age < hi) {
      if (i === K - 1) return tb.l[i] * Math.exp(-tb.m[i] * (age - tb.x[i]));
      return tb.l[i] + ((tb.l[i + 1] - tb.l[i]) * (age - tb.x[i])) / tb.n[i];
    }
  }
  return 0;
}

// ───────────── Siler (competing-hazards) schedules: illustrative, not data ─────────────
// μ(x) = a₁e^{−b₁x} + a₂ + a₃e^{b₃x}: childhood decline, constant background, senescent rise (closed-form H and S).
export function siler(p) {
  const { a1, b1, a2, a3, b3 } = p;
  const H = (x) => (a1 / b1) * (1 - Math.exp(-b1 * x)) + a2 * x + (a3 / b3) * (Math.exp(b3 * x) - 1);
  return { p, mu: (x) => a1 * Math.exp(-b1 * x) + a2 + a3 * Math.exp(b3 * x), H, S: (x) => Math.exp(-H(x)) };
}
export const SILER = {
  y1750: { a1: 0.42, b1: 1.15, a2: 0.0085, a3: 0.00024, b3: 0.085 },
  y1900: { a1: 0.12, b1: 1.2, a2: 0.0035, a3: 0.00009, b3: 0.09 },
  y1950: { a1: 0.03, b1: 1.3, a2: 0.0012, a3: 0.00004, b3: 0.093 },
  y2020: { a1: 0.0045, b1: 1.5, a2: 0.00008, a3: 0.000012, b3: 0.105 },
};
/** ∫₀^ω f by composite Simpson with step h. */
export function integ(f, a, b, n = 880) {
  if (n % 2) n++;
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
export const OMEGA = 110;
/** Life expectancy at birth ∫ S(x) dx for a survival function. */
export const e0Of = (S, w = OMEGA) => integ(S, 0, w, 880);

/** Hazard that is log-linear between knots (xs ascending, mus > 0): exact μ(x) and cumulative hazard H(x); beyond the last knot the last slope continues. */
export function hazardKnots(xs, mus) {
  const K = xs.length, cum = [0];
  const seg = (i, x) => { // ∫ from xs[i] to x of the log-linear piece i
    const h = xs[i + 1] - xs[i], r = Math.log(mus[i + 1] / mus[i]), u = x - xs[i];
    return Math.abs(r) < 1e-9 ? mus[i] * u : (mus[i] * h * (Math.exp((r * u) / h) - 1)) / r;
  };
  for (let i = 0; i < K - 1; i++) cum[i + 1] = cum[i] + seg(i, xs[i + 1]);
  const idx = (x) => { let i = 0; while (i < K - 2 && x > xs[i + 1]) i++; return i; };
  return {
    mu(x) { const i = idx(x), h = xs[i + 1] - xs[i]; return mus[i] * Math.pow(mus[i + 1] / mus[i], (x - xs[i]) / h); },
    H(x) { if (x <= xs[0]) return mus[0] * (x - xs[0]); const i = idx(x); return cum[i] + seg(i, x); },
  };
}

/** Piecewise-linear survivorship through knots (ages ks, values ls): l, the death density −l′ (piecewise constant), exact area and mean age at death. */
export function pwl(ks, ls) {
  const val = (x) => { if (x <= ks[0]) return ls[0]; for (let i = 0; i < ks.length - 1; i++) if (x <= ks[i + 1]) return ls[i] + ((ls[i + 1] - ls[i]) * (x - ks[i])) / (ks[i + 1] - ks[i]); return ls[ls.length - 1]; };
  let area = 0, mean = 0;
  for (let i = 0; i < ks.length - 1; i++) { const w = ks[i + 1] - ks[i]; area += ((ls[i] + ls[i + 1]) / 2) * w; mean += (ls[i] - ls[i + 1]) * ((ks[i] + ks[i + 1]) / 2); }
  return { val, area, mean, mass: ls[0] - ls[ls.length - 1] };
}

// ───────────── causes of death (illustrative, shaped like a high-income country) ─────────────
export const CAUSES = [
  { key: 'early', name: 'Perinatal & infectious', color: 'orange', mu: (x) => 0.0036 * Math.exp(-1.6 * x) + 0.00004 + 0.00002 * Math.exp(0.045 * x) },
  { key: 'ext', name: 'External (accidents, violence)', color: 'red', mu: (x) => 0.00012 + 0.00085 * Math.exp(-(((x - 21) / 8) ** 2)) + 0.0000014 * Math.exp(0.06 * x) },
  { key: 'cancer', name: 'Cancer', color: 'purple', mu: (x) => 0.0000085 * Math.exp(0.085 * x) + 0.00003 },
  { key: 'circ', name: 'Circulatory', color: 'accent', mu: (x) => 0.0000028 * Math.exp(0.113 * x) },
  { key: 'other', name: 'Everything else', color: 'teal', mu: (x) => 0.0000075 * Math.exp(0.098 * x) + 0.00002 },
];
