// Geology & Geophysics — Chapter 1: Rocks, strata and geologic time (part b: 1.6–1.10)
//
// Sources checked (Oct 2026):
//   1.6  denudation ≈ 54 m/Myr (Wittmann et al. 2020); Whewell coined "uniformitarianism" (1832) reviewing Lyell's
//        Principles of Geology (1830–33).
//   1.7  Walther, Einleitung in die Geologie als historische Wissenschaft (1893–94), as translated by Middleton (1973).
//   1.8  Kelvin, On the secular cooling of the earth, read 28 April 1862, Trans. R. Soc. Edinb. 23 (1864): rocks melt at
//        ≈ 7000 °F, gradient 1 °F per 50 ft (observed 1/110 to 1/15 °F per ft), consolidation ≈ 98 Myr ago, not less than
//        20 nor more than 400 Myr. England, Molnar & Richter (2007), GSA Today 17(1): 4–9: κ ≈ 1.2·10⁻⁶ m²/s gives 96 Myr;
//        modern inputs (T0 = 1300 °C, K = 3 W/m/K, κ = 10⁻⁶ m²/s, heat flux 40–80 mW/m²) give 24–96 Myr; Perry (1895)
//        Nature 51: 224–227, 341–342: a conducting lid over a well-stirred interior (time constant RL/3κ ≈ 6 Gyr for
//        L = 100 km) or an interior ~100× more conductive reconciles the heat flux with Gyr ages; radiogenic heat
//        ≈ 2·10¹³ W, spread through the mantle (A ≈ 0.02 µW/m³), changes Kelvin's result by only a few mW/m².
//   1.9  International Chronostratigraphic Chart v2024/12 (ICS): base ages of eons, eras and periods below; period names
//        from their original authors (Sedgwick 1835, Murchison 1835, 1841, Sedgwick & Murchison 1839, Conybeare &
//        Phillips 1822, Alberti 1834, Humboldt 1795 / Brongniart 1829, d'Omalius d'Halloy 1822, Lapworth 1879, Naumann
//        1866, Hörnes 1853, Desnoyers 1829).
//   1.10 Hutton (1788), Trans. R. Soc. Edinb. 1(2): 209–304, read 7 March (by Joseph Black) and 4 April 1785; Siccar Point
//        visited by boat in 1788 with John Playfair and Sir James Hall: near-vertical early Silurian (Llandovery)
//        greywackes, c. 435 Ma, under Upper Old Red Sandstone (late Devonian, c. 370 Ma) dipping about 15° seaward;
//        gap ≈ 60–65 Myr (BGS excursion guide; Wikipedia, Siccar Point).

import { TAU, clamp, LITH, rgbMix, lithPoly, classify, surfaceAt, drawSection, FOSSILS, fossil, fmtYr } from './ch01.shared.js';

/** Shade the erosion surface of event k (where rock younger than k lies on rock older than k) as a contour. */
function uncLine(s, E, k, st = {}) {
  s.contour((x, z) => { const c = classify(E, x, z); return c ? (c.k > k ? 1 : 0) : NaN; }, [0.5], { color: 'red', width: 2.6, res: st.res ?? 200 });
}
/** Mean thickness (data units) of rock above the erosion surface of event k just before it acts, over x in [x0, x1]. */
function erodedThickness(E, k, x0, x1, zTop) {
  const pre = E.slice(0, k).map((e) => ({ ...e, p: 1 })), e = E[k]; let sum = 0, n = 0;
  for (let x = x0 + 0.1; x < x1; x += 0.2) {
    const s = surfaceAt(pre, x, zTop, -2, 0.04), lv = e.level + (e.slope || 0) * (x - (e.sx ?? 0)) + (e.amp || 0) * Math.sin((TAU * x) / (e.wl || 4) + (e.ph || 0));
    sum += Math.max(0, s - lv); n++;
  }
  return sum / n;
}

// ── 1.6 unconformities ─────────────────────────────────────────────────────
const KM = 0.2; // km per section unit in 1.6
const lowerBeds = (tops, liths, from = 0) => tops.map((top, i) => ({ type: 'dep', lith: liths[i % liths.length], top, from: i ? tops[i - 1] : from, phase: 'dep1' }));
const upperBeds = (tops, liths, from) => tops.map((top, i) => ({ type: 'dep', lith: liths[i % liths.length], top, from: i ? tops[i - 1] : from, phase: 'dep2' }));
const UNC = {
  angular: {
    label: 'angular', name: 'angular unconformity', what: 'tilted (or folded) older beds truncated and overlain by flat younger beds',
    E: () => [
      { type: 'base', lith: 'gneiss', top: 0 },
      ...lowerBeds([0.55, 1.1, 1.65, 2.2, 2.75, 3.3], ['sand', 'shale', 'lime']),
      { type: 'tilt', ang: (24 * Math.PI) / 180, cx: 6, cz: 0, phase: 'deform' },
      { type: 'uplift', dz: 0.7, phase: 'deform' },
      { type: 'erode', level: 2.3, amp: 0.09, wl: 2.9, phase: 'erode', from: 7 },
      ...upperBeds([2.75, 3.3, 3.85, 4.4], ['cong', 'sand', 'shale', 'lime'], 2.15),
    ],
  },
  dis: {
    label: 'disconformity', name: 'disconformity', what: 'parallel beds above and below an irregular erosion surface with channels',
    E: () => [
      { type: 'base', lith: 'gneiss', top: 0 },
      ...lowerBeds([0.55, 1.1, 1.65, 2.2, 2.75, 3.3], ['lime', 'shale', 'sand']),
      { type: 'uplift', dz: 0.6, phase: 'deform' },
      { type: 'erode', level: 2.95, amp: 0.32, wl: 2.6, phase: 'erode', from: 7 },
      ...upperBeds([3.5, 4.0, 4.5, 5.0], ['cong', 'sand', 'shale', 'lime'], 2.6),
    ],
  },
  non: {
    label: 'nonconformity', name: 'nonconformity', what: 'sedimentary beds resting on eroded igneous or metamorphic rock',
    E: () => [
      { type: 'base', lith: 'schist', top: 4.2, phase: 'dep1' },
      { type: 'pluton', lith: 'granite', cx: 5.6, cz: 1.0, rx: 3.6, rz: 2.4, phase: 'dep1' },
      { type: 'uplift', dz: 0.9, phase: 'deform' },
      { type: 'erode', level: 2.3, amp: 0.12, wl: 3.3, phase: 'erode', from: 7 },
      ...upperBeds([2.8, 3.35, 3.9, 4.45], ['cong', 'sand', 'shale', 'lime'], 2.15),
    ],
  },
  para: {
    label: 'paraconformity', name: 'paraconformity', what: 'parallel beds with a plain bedding plane between them: the gap shows only in the fossils',
    E: () => [
      { type: 'base', lith: 'gneiss', top: 0 },
      ...lowerBeds([0.55, 1.1, 1.65, 2.2], ['shale', 'lime']),
      { type: 'erode', level: 2.2, amp: 0, phase: 'erode', from: 2.2 },
      ...upperBeds([2.75, 3.3, 3.85, 4.4], ['shale', 'lime'], 2.2),
    ],
  },
};
const PHASES = [['dep1', 0, 0.32, 'deposition in the sea'], ['deform', 0.32, 0.46, 'tilting and uplift'], ['erode', 0.46, 0.63, 'erosion on land'], ['dep2', 0.63, 0.92, 'subsidence and new deposition'], ['hold', 0.92, 1, 'today']];

// ── 1.7 Walther ─────────────────────────────────────────────────────────────
const WF = [{ name: 'beach sand', lith: 'sand' }, { name: 'offshore mud', lith: 'shale' }, { name: 'shelf limestone', lith: 'lime' }];
const W_NX = 120, W_NT = 90;
const W_MODES = {
  trans: { label: 'transgression', s: (u) => 96 - 82 * u },
  reg: { label: 'regression', s: (u) => 14 + 82 * u },
  both: { label: 'in and out', s: (u) => 58 + 40 * Math.cos(TAU * u) },
  jump: { label: 'sudden fall', s: (u) => (u < 0.5 ? 96 - 84 * (u / 0.5) : 112 - 50 * ((u - 0.5) / 0.5)), fall: 0.5 },
};
const faciesAt = (d) => (d < 0 ? -1 : d < 16 ? 0 : d < 40 ? 1 : 2);
/** Deposit the basin: columns of segments {f, t, h, eroded (top was eroded before it was laid)}. */
function waltherBasin(mode) {
  const M = W_MODES[mode], cols = Array.from({ length: W_NX }, () => []), tops = [];
  for (let t = 0; t < W_NT; t++) {
    const u = t / (W_NT - 1), s = M.s(u);
    if (M.fall && t === Math.round(M.fall * (W_NT - 1)) + 1) { // forced regression: exposed sediment is eroded
      for (let i = 0; i < W_NX; i++) {
        const x = i + 0.5; if (x > s) continue; let rem = 4; const c = cols[i];
        while (rem > 0 && c.length) { const top = c[c.length - 1]; if (top.h <= rem) { rem -= top.h; c.pop(); } else { top.h -= rem; rem = 0; } }
        c.cut = true;
      }
    }
    for (let i = 0; i < W_NX; i++) {
      const f = faciesAt(i + 0.5 - s); if (f < 0) continue; const c = cols[i];
      const seg = { f, t, h: 1, eroded: !!c.cut }; c.cut = false; c.push(seg);
    }
    tops.push(s);
  }
  return { cols, s: tops };
}

// ── 1.8 Kelvin ──────────────────────────────────────────────────────────────
const YR = 3.156e7, R_E = 6.371e6, F2C = 5 / 9, FT = 0.3048;
const KELVIN = { T0: 7000 * F2C, G: ((1 / 50) * F2C) / FT * 1000, kappa: 1.18e-6 }; // 3889 °C, 36.5 °C/km, κ (m²/s)
function kgrid(Zmax, h1 = 50, r = 1.04) { const z = [0]; let h = h1; while (z[z.length - 1] < Zmax) { z.push(Math.min(Zmax, z[z.length - 1] + h)); h *= r; } return z; }
/**
 * Conductive cooling of a slab 0 < z < Zmax (R/3: the volume per unit area of a sphere), initially at T0, surface held at
 * 0 °C, insulated base, conductivity K(z), heat production A(z). Backward Euler on log-spaced times; the surface gradient
 * by a quadratic fit through the top three nodes. Returns {t (yr), G (°C/km), z (m), prof (temperature snapshots)}.
 */
function coolEarth({ T0, kappa, K = 3, Kfn, Afn, Zmax = R_E / 3, t0 = 1e3, t1 = 6.5e9, n = 640 }) {
  const z = kgrid(Zmax), N = z.length, rc = K / kappa;
  const T = new Float64Array(N).fill(T0); T[0] = 0;
  const Kf = new Float64Array(N), V = new Float64Array(N), A = new Float64Array(N);
  for (let i = 1; i < N; i++) { Kf[i] = Kfn ? Kfn(0.5 * (z[i] + z[i - 1])) : K; V[i] = 0.5 * ((z[i] - z[i - 1]) + (i + 1 < N ? z[i + 1] - z[i] : 0)); A[i] = Afn ? Afn(z[i]) : 0; }
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
  const ts = [], G = [], prof = []; let t = 0; const q = Math.pow(t1 / t0, 1 / n);
  for (let s = 0; s <= n; s++) {
    const tn = t0 * q ** s, dt = (tn - t) * YR; t = tn;
    for (let i = 1; i < N; i++) {
      const cl = Kf[i] / (z[i] - z[i - 1]), cr = i + 1 < N ? Kf[i + 1] / (z[i + 1] - z[i]) : 0, m = (rc * V[i]) / dt;
      a[i] = -cl; c[i] = -cr; b[i] = m + cl + cr; d[i] = m * T[i] + A[i] * V[i];
    }
    for (let i = 2; i < N; i++) { const w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; d[i] -= w * d[i - 1]; }
    T[N - 1] = d[N - 1] / b[N - 1]; for (let i = N - 2; i >= 1; i--) T[i] = (d[i] - c[i] * T[i + 1]) / b[i];
    const z1 = z[1], z2 = z[2];
    ts.push(t); G.push(((T[1] * z2 * z2 - T[2] * z1 * z1) / (z1 * z2 * (z2 - z1))) * 1000); prof.push(Float32Array.from(T));
  }
  return { t: ts, G, z, prof };
}
/** Times (yr) at which the decreasing-ish curve G(t) crosses level g (log interpolation). */
function crossings(R, g) { const out = []; for (let i = 1; i < R.t.length; i++) { const a = R.G[i - 1] - g, b = R.G[i] - g; if (a === 0 || a * b < 0) { const f = a / (a - b); out.push(Math.exp(Math.log(R.t[i - 1]) + f * (Math.log(R.t[i]) - Math.log(R.t[i - 1])))); } } return out; }

// ── 1.9 the time scale (ICS v2024/12, Ma) ──────────────────────────────────
const EONS = [['Hadean', 4567, 4031], ['Archean', 4031, 2500], ['Proterozoic', 2500, 538.8], ['Phanerozoic', 538.8, 0]];
const ERAS = [['Eoarchean', 4031, 3600], ['Paleoarchean', 3600, 3200], ['Mesoarchean', 3200, 2800], ['Neoarchean', 2800, 2500], ['Paleoproterozoic', 2500, 1600], ['Mesoproterozoic', 1600, 1000], ['Neoproterozoic', 1000, 538.8], ['Paleozoic', 538.8, 251.902], ['Mesozoic', 251.902, 66], ['Cenozoic', 66, 0]];
const PRE_P = [['Siderian', 2500, 2300], ['Rhyacian', 2300, 2050], ['Orosirian', 2050, 1800], ['Statherian', 1800, 1600], ['Calymmian', 1600, 1400], ['Ectasian', 1400, 1200], ['Stenian', 1200, 1000], ['Tonian', 1000, 720], ['Cryogenian', 720, 635], ['Ediacaran', 635, 538.8]];
const PHAN = [
  ['Cambrian', 538.8, 486.85, '±0.6', 'Cambria, the Latin name for Wales', 'Adam Sedgwick, 1835', 'trilobite', 'teal'],
  ['Ordovician', 486.85, 443.1, '±1.5', 'the Ordovices, a tribe of north Wales', 'Charles Lapworth, 1879', 'graptolite', 'green'],
  ['Silurian', 443.1, 419.62, '±0.9', 'the Silures, a tribe of south Wales', 'Roderick Murchison, 1835', 'coral', 'blue'],
  ['Devonian', 419.62, 358.86, '±1.36', 'the county of Devon', 'Sedgwick & Murchison, 1839', 'fishtooth', 'orange'],
  ['Carboniferous', 358.86, 298.9, '±0.19', 'the coal-bearing strata of Britain', 'Conybeare & Phillips, 1822', 'crinoid', 'teal'],
  ['Permian', 298.9, 251.902, '±0.15', 'the province of Perm in Russia', 'Roderick Murchison, 1841', 'brachiopod', 'red'],
  ['Triassic', 251.902, 201.4, '±0.024', 'the threefold division of the German Trias', 'Friedrich von Alberti, 1834', 'ammonite', 'purple'],
  ['Jurassic', 201.4, 143.1, '±0.2', 'the Jura Mountains', 'Alexander von Humboldt, 1795; Alexandre Brongniart, 1829', 'ammonite', 'blue'],
  ['Cretaceous', 143.1, 66.0, '±0.6', 'creta, Latin for chalk', "Jean d'Omalius d'Halloy, 1822", 'ammonite', 'green'],
  ['Paleogene', 66.0, 23.04, '', '“old-born”', 'Carl Naumann, 1866', 'gastropod', 'orange'],
  ['Neogene', 23.04, 2.58, '', '“new-born”', 'Moritz Hörnes, 1853', 'gastropod', 'gold'],
  ['Quaternary', 2.58, 0, '', 'the “fourth” division after Arduino’s Primary, Secondary and Tertiary', 'Jules Desnoyers, 1829', 'gastropod', 'pink'],
];
const EXTINCT = [['end-Ordovician', 445.2, 443.1], ['Late Devonian', 372.15, 372.15], ['end-Permian', 251.902, 251.902], ['end-Triassic', 201.4, 201.4], ['end-Cretaceous', 66.0, 66.0]];
const COL9 = { Hadean: 'pink', Archean: 'red', Proterozoic: 'orange', Phanerozoic: 'blue', Paleozoic: 'teal', Mesozoic: 'green', Cenozoic: 'gold' };

// ── 1.10 Siccar Point ───────────────────────────────────────────────────────
const HKM = 0.25; // km per section unit in 1.10
function siccarEvents() {
  const E = [{ type: 'base', lith: 'grey', top: -6 }];
  let prev = -6; for (let z = -5.5; z <= 4.51; z += 0.5) { E.push({ type: 'dep', lith: Math.round((z + 6) / 0.5) % 2 ? 'grey' : 'shale', top: z, from: prev, step: 0 }); prev = z; }
  E.push({ type: 'fold', amp: 3.2, wl: 4.4, ph: 0.6, step: 1 });
  E.push({ type: 'uplift', dz: 1.2, step: 2 });
  E.push({ type: 'erode', level: 1.7, amp: 0.08, wl: 2.3, ph: 0.4, from: 9, step: 2 });
  E.push({ type: 'dep', lith: 'cong', top: 2.1, from: 1.55, step: 3 });
  prev = 2.1; for (const z of [2.65, 3.2, 3.75, 4.3, 4.85]) { E.push({ type: 'dep', lith: 'red', top: z, from: prev, step: 3 }); prev = z; }
  E.push({ type: 'tilt', ang: (14 * Math.PI) / 180, cx: 6, cz: 2, step: 4 });
  E.push({ type: 'uplift', dz: 0.4, step: 4 });
  E.push({ type: 'erode', level: 3.4, slope: 0.32, sx: 6, amp: 0.1, wl: 3.7, ph: 1.1, from: 9, step: 4 });
  return E;
}

export default {
  collection: 'geol',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Principle',
      name: 'Uniformitarianism and unconformities',
      statement: String.raw`**Uniformitarianism**: the processes acting on the Earth today (erosion, transport, deposition, volcanism, uplift), working at rates of the kind we can measure, are sufficient to explain the rock record; "the present is the key to the past". Since those rates are slow (millimetres to centimetres per year at most, a few hundredths of a millimetre per year for long-term erosion), the record demands immense spans of time.

An **unconformity** is a buried surface of erosion or non-deposition separating younger rocks from older ones, and so a gap in the record. There are four kinds:

(a) **angular unconformity**: older beds were tilted or folded, eroded, and covered by younger beds at an angle to them;

(b) **disconformity**: beds above and below are parallel, but the surface between them is irregular and erosional;

(c) **nonconformity**: sedimentary rocks rest on eroded igneous or metamorphic rock;

(d) **paraconformity**: beds are parallel and the contact looks like an ordinary bedding plane; the gap is revealed only by missing fossil zones or dates.

The time an unconformity represents is at least the thickness removed divided by the erosion rate, plus any time of non-deposition.`,
      scope: String.raw`Uniformitarianism is a method, not a law: rates have varied (catastrophic floods, impacts and eruptions do happen, and the early Earth was hotter), but the physical and chemical laws are the same, and measured present-day rates bound how fast the past could have gone.`,
      idea: String.raw`An outcrop is a recording with pauses. Deposition writes layers at roughly measurable rates; when the land rises and erodes, recording stops and part of the tape is erased; when it subsides again, recording resumes on top of the erasure. The unconformity surface has no thickness, but dividing the missing rock by erosion rates of tens of metres per million years turns it into millions of years. Hutton (geol-1.10) recognized unconformities as the signature of repeated cycles of deposition, uplift and erosion; Lyell made uniformitarian reasoning the method of geology, and Steno's principles (geol-1.4) read the order of events.`,
      caption: String.raw`Pick the kind of unconformity and play the history: deposition in the sea, deformation and uplift, erosion on land, subsidence and new deposition. The right panel turns rock into time: the column of rock (thickness) beside the column of time at the chosen **deposition** and **erosion rates**; the thin red unconformity in the rock opens into the red **gap** in time. The default erosion rate is the modern global average (about 54 m per million years); slow it down and the gap swells.`,
      deps: ['geol-1.4'],
      see: ['geol-1.10', 'geol-1.5'],
      refs: ['Press–Siever'],
      tags: ['stratigraphy', 'deep time'],
      credit: 'James Hutton, 1788; Charles Lyell, 1830',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Unconformity' },
      viz(v) {
        const kind = v.select('kind', Object.entries(UNC).map(([value, U]) => ({ value, label: U.label })), 'angular', { onChange: () => v.restart() });
        const dep = v.slider('deposition rate (m/Myr)', 5, 500, 50, { log: true, sig: 2 });
        const ero = v.slider('erosion rate (m/Myr)', 5, 500, 54, { log: true, sig: 2 });
        const S = v.stage({ x: [0, 12], y: [-0.1, 5.6], axes: false, equal: true, height: 340, weight: 1.45 });
        const W = v.stage({ x: [0, 10], y: [-0.08, 1.12], axes: false, height: 340, weight: 0.75, minWidth: 250 });
        const cache = new Map();
        const geo = (key) => {
          if (cache.has(key)) return cache.get(key);
          const E = UNC[key].E(), kE = E.findIndex((e) => e.type === 'erode');
          const lower = E.filter((e) => e.phase === 'dep1' && e.type === 'dep'), upper = E.filter((e) => e.phase === 'dep2');
          const H1 = lower.length ? (lower[lower.length - 1].top - (E[0].top ?? 0)) * KM : 0, H2 = (upper[upper.length - 1].top - upper[0].from) * KM;
          const He = erodedThickness(E, kE, 0, 12, 9) * KM;
          const g = { E, kE, H1, H2, He }; cache.set(key, g); return g;
        };
        let st = null;
        v.animate((t) => {
          const key = kind.value, U = UNC[key], g = geo(key), u = (t % 14) / 14;
          const E = g.E.map((e) => ({ ...e })), ph = PHASES.find(([, a, b]) => u >= a && u < b) || PHASES[4];
          // progress of every event
          for (const [name, a, b] of PHASES) {
            const evs = E.filter((e) => (e.phase || 'dep1') === name), f = clamp((u - a) / (b - a), 0, 1);
            if (name === 'dep1' || name === 'dep2') evs.forEach((e, i) => { e.p = clamp(f * evs.length - i, 0, 1); });
            else evs.forEach((e) => { e.p = f; });
          }
          for (const e of E) if (e.type === 'base') e.p = 1;
          const marine = ph[0] === 'dep1' || ph[0] === 'dep2' || ph[0] === 'hold';
          if (marine) { S.rect(-5, -1, 17, 4.95, { fill: 'blue', fillAlpha: 0.07, stroke: false }); S.line(-5, 4.95, 17, 4.95, { color: 'blue', width: 1.2, alpha: 0.6 }); }
          drawSection(v, S, E, { key: `${key}|${u.toFixed(3)}`, res: 2, pale: 0.48 });
          if (u > PHASES[3][1]) uncLine(S, E, g.kE, { res: 160 });
          S.corner(`${PHASES.indexOf(ph) + 1}. ${ph[3]}`, 'tl', { size: 12.5, weight: 700, color: 'ink' });
          S.corner(U.name, 'tr', { size: 12, weight: 600, color: 'red' });
          S.line(0.35, 0.25, 0.35, 1.25, { color: 'ink', width: 2 }); S.line(0.2, 0.25, 0.5, 0.25, { color: 'ink', width: 2 }); S.line(0.2, 1.25, 0.5, 1.25, { color: 'ink', width: 2 }); S.text('200 m', 0.6, 0.75, { size: 11.5, weight: 700 });
          // rock column vs time column
          const D = dep.value, Er = ero.value;
          const t1 = (g.H1 * 1000) / D, t2 = (g.H2 * 1000) / D, te = (g.He * 1000) / Er, tn = key === 'para' ? 12 : 0, tg = te + tn, T = t1 + tg + t2;
          const H1d = g.H1 || 0.8 * g.H2, Hs = H1d + g.H2, yR = (h) => h / Hs, yT = (x) => x / T;
          const cx0 = 1.9, cx1 = 3.7, tx0 = 5.9, tx1 = 7.7;
          W.text('rock', (cx0 + cx1) / 2, 1.07, { align: 'center', size: 12.5, weight: 700 }); W.text('time', (tx0 + tx1) / 2, 1.07, { align: 'center', size: 12.5, weight: 700 });
          W.rect(cx0, 0, cx1, yR(H1d), { fill: g.H1 ? 'teal' : 'pink', fillAlpha: 0.35, color: g.H1 ? 'teal' : 'pink', width: 1 });
          W.rect(cx0, yR(H1d), cx1, 1, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1 });
          W.line(cx0 - 0.15, yR(H1d), cx1 + 0.15, yR(H1d), { color: 'red', width: 2.6 });
          W.rect(tx0, 0, tx1, yT(t1), { fill: 'teal', fillAlpha: 0.35, color: 'teal', width: 1 });
          W.rect(tx0, yT(t1), tx1, yT(t1 + tg), { fill: 'red', fillAlpha: 0.12, stroke: false, hatch: 'red', hatchAlpha: 0.45 });
          W.rect(tx0, yT(t1), tx1, yT(t1 + tg), { color: 'red', width: 1.6 });
          W.rect(tx0, yT(t1 + tg), tx1, 1, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1 });
          W.poly([[cx1, yR(H1d)], [tx0, yT(t1)], [tx0, yT(t1 + tg)]], { fill: 'red', fillAlpha: 0.1, stroke: false });
          W.line(cx1, yR(H1d), tx0, yT(t1), { color: 'red', width: 1, dash: [3, 3] }); W.line(cx1, yR(H1d), tx0, yT(t1 + tg), { color: 'red', width: 1, dash: [3, 3] });
          W.line(cx1, 0, tx0, 0, { color: 'faint', width: 1, dash: [3, 3] }); W.line(cx1, 1, tx0, 1, { color: 'faint', width: 1, dash: [3, 3] });
          W.text(g.H1 ? `${v.fix(g.H1 * 1000, 0)} m` : 'granite', cx0 - 0.1, yR(H1d) / 2, { align: 'right', size: 11 }); W.text(`${v.fix(g.H2 * 1000, 0)} m`, cx0 - 0.1, (1 + yR(H1d)) / 2, { align: 'right', size: 11 });
          if (t1 > 0) W.text(fmtYr(t1 * 1e6), tx1 + 0.12, yT(t1) / 2, { size: 11 }); W.text(fmtYr(t2 * 1e6), tx1 + 0.12, (1 + yT(t1 + tg)) / 2, { size: 11 });
          W.text(`gap ${fmtYr(tg * 1e6)}`, tx1 + 0.12, yT(t1 + tg / 2), { size: 11.5, weight: 700, color: 'red' });
          // time cursor
          const pf = (name) => { const P = PHASES.find((p) => p[0] === name); return clamp((u - P[1]) / (P[2] - P[1]), 0, 1); };
          const tNow = t1 * pf('dep1') + tg * ((pf('deform') + pf('erode')) / 2) + t2 * pf('dep2');
          W.arrow(tx0 - 0.55, yT(tNow), tx0 - 0.05, yT(tNow), { color: 'gold', width: 2.4, head: 8 });
          st = { U, g, t1, t2, te, tn, tg, T };
        }, { period: 14, still: 13.6 });
        v.legend([['red', 'unconformity / gap'], ['teal', 'older beds', { area: true }], ['orange', 'younger beds', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { U, g, t1, t2, te, tn, tg, T } = st;
          const gap = tn ? `no erosion here, but ${tn} Myr of fossil zones are missing (non-deposition): the contact looks like any bedding plane` : `${v.fix(g.He * 1000, 0)} m eroded on average at ${v.fix(ero.value, 0)} m/Myr = **${fmtYr(te * 1e6)}**`;
          const older = g.H1 ? `older beds ${v.fix(g.H1 * 1000, 0)} m at ${v.fix(dep.value, 0)} m/Myr = ${fmtYr(t1 * 1e6)}` : 'older rock: granite intruded into schist, crystallized at depth';
          return `**${U.name}**: ${U.what} · ${older} · gap: ${gap} · younger beds ${fmtYr(t2 * 1e6)} · the surface, a line in the rock, is **${v.fix((100 * tg) / T, 0)}%** of the ${fmtYr(T * 1e6)} this outcrop spans`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Law',
      name: 'Walther’s law of facies',
      statement: String.raw`In a conformable succession of sedimentary rocks, facies (rock bodies recording particular environments, such as beach sand, offshore mud, shelf limestone) can lie directly on top of one another only if their environments lay side by side at the time. As a coastline migrates, the belts of environments shift with it, so the **vertical** sequence of facies at one place repeats the **lateral** sequence of environments: a rising sea (transgression) stacks deeper-water facies on shallower ones (sand, then mud, then limestone upward), a falling sea (regression) the reverse.`,
      scope: String.raw`Only within a conformable succession. Across an unconformity or a sudden jump of the environments (an abrupt sea-level fall with erosion, a fault, a slide), facies that were never neighbours can be stacked, and the law does not apply.`,
      idea: String.raw`At any moment each point of the sea floor receives the sediment of its environment, set by water depth and distance from the shore. When the shoreline moves gradually, the point passes through neighbouring belts one after another, and its column records them in that order: time at one place stands in for distance at one time. The facies boundaries therefore cut across time lines (they are **diachronous**): the same beach sand is older seaward and younger landward, which is why rock type is a poor guide to age (geol-1.5).`,
      caption: String.raw`Press play: the shoreline moves with sea level, and each belt (sand near the shore, mud farther out, limestone on the open shelf) lays down its sediment; the thin lines are **time lines**, every tenth step. Drag the **well** along the coast: the panel on the right compares the vertical sequence in its core (bottom to top) with today's sequence of belts out from the shore. Choose a sea-level history; **sudden fall** drops sea level abruptly so that the exposed shelf is eroded, and the next transgression lays sand straight onto limestone.`,
      deps: ['geol-1.4'],
      see: ['geol-1.5', 'geol-1.6'],
      refs: ['Press–Siever'],
      tags: ['stratigraphy', 'sedimentology'],
      credit: 'Johannes Walther, 1894',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Walther%27s_law' },
      viz(v) {
        const mode = v.select('sea level', Object.entries(W_MODES).map(([value, M]) => ({ value, label: M.label })), 'trans', { onChange: () => v.restart() });
        const lines = v.toggle('time lines', true);
        const S = v.stage({ x: [0, W_NX], y: [-6, W_NT + 22], axes: false, height: 360, weight: 1.45 });
        const R = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 360, weight: 0.7, minWidth: 240 });
        const well = S.handle(64, W_NT + 14, { color: 'accent', label: 'well', constrain: (x) => [clamp(x, 2, W_NX - 2), W_NT + 14] });
        const cache = new Map(); const basin = (m) => { if (!cache.has(m)) cache.set(m, waltherBasin(m)); return cache.get(m); };
        let st = null;
        v.animate((t) => {
          const m = mode.value, B = basin(m), n = Math.min(W_NT, Math.floor((t / 12) * W_NT) + 1), s = B.s[n - 1];
          // rebuild the columns up to step n (erosion included)
          const cols = Array.from({ length: W_NX }, () => []);
          const M = W_MODES[m];
          for (let k = 0; k < n; k++) {
            const sk = B.s[k];
            if (M.fall && k === Math.round(M.fall * (W_NT - 1)) + 1) for (let i = 0; i < W_NX; i++) { if (i + 0.5 > sk) continue; let rem = 4; const c = cols[i]; while (rem > 0 && c.length) { const top = c[c.length - 1]; if (top.h <= rem) { rem -= top.h; c.pop(); } else { top.h -= rem; rem = 0; } } c.cut = true; }
            for (let i = 0; i < W_NX; i++) { const f = faciesAt(i + 0.5 - sk); if (f < 0) continue; const c = cols[i]; c.push({ f, t: k, h: 1, eroded: !!c.cut }); c.cut = false; }
          }
          // draw columns, merging runs of one facies (solid colours: no seams between columns)
          let hmax = 0; const fc = WF.map((F) => v.mix(LITH[F.lith].color, 'panel', 0.5));
          for (let i = 0; i < W_NX; i++) {
            let y = 0, run = null;
            for (const sgm of cols[i]) {
              if (run && run.f === sgm.f && !sgm.eroded) run.h += sgm.h; else { if (run) S.rect(i, run.y, i + 1.02, run.y + run.h, { fill: fc[run.f], fillAlpha: 1, stroke: false }); run = { f: sgm.f, y, h: sgm.h }; }
              y += sgm.h;
            }
            if (run) S.rect(i, run.y, i + 1.02, run.y + run.h, { fill: fc[run.f], fillAlpha: 1, stroke: false });
            cols[i].top = y; hmax = Math.max(hmax, y);
          }
          // time lines every 10 steps, erosion surfaces
          if (lines.value) for (let k = 9; k < n; k += 10) {
            const pts = [];
            for (let i = 0; i < W_NX; i++) { let y = 0, found = null; for (const sgm of cols[i]) { y += sgm.h; if (sgm.t === k) found = y; } pts.push(found == null ? null : [i + 0.5, found]); }
            S.path(pts, { color: 'ink', width: 0.9, alpha: 0.55 });
          }
          for (let i = 0; i < W_NX; i++) { let y = 0; for (const sgm of cols[i]) { if (sgm.eroded) S.line(i, y, i + 1, y, { color: 'red', width: 2.4 }); y += sgm.h; } }
          // sea, shore and belts at the current time
          const sea = W_NT + 4;
          S.rect(s, -6, W_NX, sea, { fill: 'blue', fillAlpha: 0.06, stroke: false }); S.line(s, sea, W_NX, sea, { color: 'blue', width: 1.5 });
          S.line(0, sea, s, sea, { color: 'orange', width: 3 }); S.text('land', Math.max(2, s / 2), sea + 3.5, { align: 'center', size: 11.5, color: 'orange', weight: 600 });
          for (let f = 0; f < 3; f++) { const a = s + [0, 16, 40][f], b = Math.min(W_NX, s + [16, 40, 999][f]); if (a >= W_NX) continue; S.rect(a, sea - 2.2, b, sea, { fill: LITH[WF[f].lith].color, fillAlpha: 0.9, stroke: false }); if (b - a > 9) S.text(WF[f].name, (a + b) / 2, sea + 3.5, { align: 'center', size: 11, color: LITH[WF[f].lith].color, weight: 700 }); }
          S.dot(s, sea, { r: 5, color: 'orange' });
          // the well
          const wi = clamp(Math.floor(well.x), 0, W_NX - 1);
          S.line(well.x, 0, well.x, well.y, { color: 'accent', width: 1.6, dash: [5, 4] });
          // core vs lateral
          const runs = []; let y = 0;
          for (const sgm of cols[wi]) { const last = runs[runs.length - 1]; if (last && last.f === sgm.f && !sgm.eroded) last.h += sgm.h; else runs.push({ f: sgm.f, h: sgm.h, y, cut: sgm.eroded }); y += sgm.h; }
          const tot = Math.max(y, 1), hcol = 7.6;
          R.text('core at the well', 2.2, 9.6, { align: 'center', size: 12, weight: 700 }); R.text('(bottom → top)', 2.2, 9.1, { align: 'center', size: 10.5, color: 'muted' });
          for (const r of runs) { const y0 = 1.1 + (r.y / tot) * hcol, y1 = 1.1 + ((r.y + r.h) / tot) * hcol; lithPoly(v, R, [[1.2, y0], [3.2, y0], [3.2, y1], [1.2, y1]], WF[r.f].lith, { fillAlpha: 0.5, outline: 'muted', width: 0.8, inkAlpha: 0.6 }); if (r.cut) R.line(0.9, y0, 3.5, y0, { color: 'red', width: 2.6 }); }
          if (!runs.length) R.text('no sediment yet', 2.2, 4, { align: 'center', size: 11, color: 'muted' });
          R.text('belts seaward', 7.3, 9.6, { align: 'center', size: 12, weight: 700 }); R.text('from the shore, today', 7.3, 9.1, { align: 'center', size: 10.5, color: 'muted' });
          WF.forEach((F, f) => { const y0 = 1.1 + (f * hcol) / 3, y1 = y0 + hcol / 3 - 0.25; lithPoly(v, R, [[6.3, y0], [8.3, y0], [8.3, y1], [6.3, y1]], F.lith, { fillAlpha: 0.5, outline: 'muted', width: 0.8, inkAlpha: 0.6 }); R.text(F.name, 7.3, (y0 + y1) / 2, { align: 'center', size: 11, weight: 700 }); });
          R.arrow(5.4, 1.2, 5.4, 8.6, { color: 'muted', width: 1.3, head: 7 });
          // Walther check
          const seq = runs.map((r) => r.f); let bad = null;
          for (let k = 1; k < runs.length; k++) if (Math.abs(runs[k].f - runs[k - 1].f) > 1) { bad = { a: runs[k - 1].f, b: runs[k].f, cut: runs[k].cut }; break; }
          const okAll = !bad;
          R.corner(runs.length > 1 ? (okAll ? '✓ only neighbouring belts are stacked' : '✗ non-neighbours stacked') : '', 'bl', { size: 11.5, weight: 700, color: okAll ? 'green' : 'red' });
          st = { seq, bad, s, n, x: well.x, cut: runs.some((r) => r.cut) };
        }, { period: 12, still: 11.9 });
        v.legend([['gold', 'beach sand', { area: true }], ['gray', 'offshore mud', { area: true }], ['blue', 'shelf limestone', { area: true }], ['ink', 'time lines'], ['red', 'erosion surface']]);
        v.readout(() => {
          if (!st) return '';
          const { seq, bad, x } = st;
          const names = seq.map((f) => WF[f].name.split(' ')[1]).join(' → ') || '—';
          const verdict = !seq.length ? 'no sediment at the well yet' : bad ? `✗ ${WF[bad.a].name} is overlain directly by ${WF[bad.b].name}, which never lay beside it${bad.cut ? ' — across the erosion surface: an unconformity, where Walther’s law does not apply' : ''}` : `✓ every vertical change is between belts that lie side by side, as Walther’s law requires`;
          return `well at ${v.fix(x, 0)} km · core, bottom to top: **${names}** · belts seaward from the shore: sand → mud → lime · ${verdict}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Paradox',
      name: 'Kelvin’s age of the Earth',
      statement: String.raw`In 1862 William Thomson (Lord Kelvin) treated the Earth as a rigid, conducting solid that solidified at a uniform temperature $T_0$ and has cooled since through a surface held at $0$ °C. Heat conduction in a half-space gives the temperature at depth $z$ after time $t$
$$T(z,t) = T_0\,\operatorname{erf}\!\Big(\frac{z}{2\sqrt{\kappa t}}\Big),\qquad \frac{\partial T}{\partial z}\Big|_{z=0} = \frac{T_0}{\sqrt{\pi\kappa t}},$$
so the measured surface gradient $G$ fixes the age $t = T_0^2/(\pi\kappa G^2)$. With $T_0\approx7000$ °F (≈ 3900 °C, the melting of rock), $G \approx 1$ °F per 50 ft (≈ 36 °C/km) and $\kappa\approx1.2\times10^{-6}$ m²/s, he found about **98 million years**, with limits of 20 and 400 million; later he narrowed it to 20–40 million. Geologists needed far more, and radiometric dating gives **4.54 billion years**. The paradox is resolved because the Earth is not a rigid conductor: the mantle **convects** (Perry, 1895), carrying heat from deep inside to a thin conducting lid, so the surface heat flow can stay near today's value for billions of years.`,
      scope: String.raw`Kelvin's mathematics is correct for a conducting half-space; it fails for the Earth because its interior transports heat by solid-state convection. Contrary to a popular story, radioactivity, discovered in 1896, does not by itself rescue the age: spread through the mantle as it actually is, it changes the surface gradient Kelvin's model predicts by only a few per cent (England, Molnar & Richter, 2007).`,
      idea: String.raw`Heat diffuses only about $\sqrt{\kappa t}$ in time $t$, some 60 km in 100 million years, so in Kelvin's Earth today's heat flow comes from cooling of the outermost hundred kilometres, which cannot sustain it for long: the gradient falls as $t^{-1/2}$ (the half-space solution of the heat equation, thermo-7.4, by reflection, pde-3.8). John Perry, Kelvin's former assistant, pointed out that a fluid or partly fluid interior would act as if it had huge conductivity, so heat from the whole mantle can reach the base of a thin lid; then the gradient decays on a time scale $RL/3\kappa$ of billions of years. Radiogenic heat matters only where it sits: in the outer tens of kilometres it adds a steady gradient, but spread through the mantle it hardly reaches the surface in a conducting Earth.`,
      caption: String.raw`**Left**: temperature against depth at the chosen **age**, computed by a numerical solution of the heat equation (solid), with Kelvin's erf formula dashed and the measured surface gradient in gold. **Right**: the surface gradient against time on log–log axes; where the curve meets the measured gradient is the age the model infers, and the green line marks 4.54 Gyr. Choose Kelvin's 1862 inputs or today's (heat flux 40–80 mW m⁻², shaded); add **radiogenic heat** (today's total, about 20 TW, spread through the mantle or crammed into the top 20 km), and switch on Perry's **convecting interior** (a conducting lid of thickness $L$ over an interior $f$ times more conductive) to watch the curve flatten across billions of years.`,
      deps: ['thermo-7.4', 'pde-3.8', 'thermo-7.3'],
      see: ['geol-4.3', 'geol-4.2', 'geol-4.7', 'geol-2.9', 'geol-1.6'],
      refs: ['Turcotte–Schubert ch. 4'],
      tags: ['heat flow', 'deep time', 'history'],
      credit: 'William Thomson (Kelvin), 1862; John Perry, 1895',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Age_of_Earth' },
      viz(v) {
        const preset = v.select('inputs', [{ value: 'kelvin', label: 'Kelvin 1862' }, { value: 'modern', label: 'today' }], 'kelvin', { onChange: () => { const k = preset.value === 'kelvin'; T0s.set(k ? Math.round(KELVIN.T0) : 1300); Gs.set(k ? +KELVIN.G.toFixed(1) : 20); } });
        const T0s = v.slider('initial temperature $T_0$ (°C)', 500, 6000, Math.round(KELVIN.T0), { step: 10 });
        const Gs = v.slider('measured surface gradient (°C/km)', 8, 60, +KELVIN.G.toFixed(1), { step: 0.1 });
        const age = v.slider('age shown', 1e6, 4.54e9, 9.8e7, { log: true, sig: 2, fmt: (x) => fmtYr(x) });
        const rad = v.select('radiogenic heat', [{ value: 'none', label: 'none' }, { value: 'mantle', label: 'spread through mantle' }, { value: 'crust', label: 'all in top 20 km' }], 'none');
        const perry = v.toggle('convecting interior (Perry)', false);
        const Ls = v.slider('conducting lid $L$ (km)', 25, 200, 100, { step: 5 });
        const fs = v.slider('interior conductivity ×$f$', 1, 1e4, 100, { log: true, sig: 2 });
        const P = v.stage({ x: [0, 4300], y: [-300, 0], axes: 'box', height: 360, weight: 0.85, minWidth: 260, xlabel: 'T (°C)', ylabel: 'depth (km)' });
        const Q = v.stage({ x: [1e6, 6.5e9], y: [2, 1000], xlog: true, ylog: true, axes: 'box', height: 360, weight: 1.15, xlabel: 'time since solidification (years)', ylabel: 'surface gradient (°C/km)' });
        const K = 3, cache = new Map();
        const model = () => {
          const kap = preset.value === 'kelvin' ? KELVIN.kappa : 1e-6, T0 = T0s.value, L = Ls.value * 1000, f = perry.value ? fs.value : 1;
          const A = rad.value === 'mantle' ? 2e13 / ((4 / 3) * Math.PI * (R_E ** 3 - 3.48e6 ** 3)) : rad.value === 'crust' ? 2e13 / (4 * Math.PI * R_E * R_E * 2e4) : 0;
          const key = [kap, T0, perry.value ? L : 0, f, rad.value].join('|');
          if (!cache.has(key)) { if (cache.size > 24) cache.clear(); cache.set(key, coolEarth({ T0, kappa: kap, K, Kfn: perry.value ? (z) => (z < L ? K : K * f) : null, Afn: A ? (rad.value === 'crust' ? (z) => (z < 2e4 ? A : 0) : () => A) : null })); }
          return { R: cache.get(key), kap, T0, A };
        };
        let st = null;
        v.render(() => {
          Ls.el.hidden = fs.el.hidden = !perry.value;
          const { R, kap, T0, A } = model(), G = Gs.value, mod = preset.value === 'modern';
          // gradient vs time
          if (mod) Q.hband(40 / K, 80 / K, { color: 'gold', alpha: 0.18, edges: true });
          Q.hline(G, { color: 'gold', width: 2.2 });
          Q.vline(4.54e9, { color: 'green', width: 2 }); Q.text('4.54 Gyr', 4.54e9, 600, { dx: -5, align: 'right', size: 11.5, color: 'green', weight: 700 });
          if (!perry.value && !A) Q.fn((t) => (T0 / Math.sqrt(Math.PI * kap * t * YR)) * 1000, { color: 'ink', width: 1.3, dash: [6, 4] });
          Q.path(R.t.map((t, i) => [t, R.G[i]]), { color: 'accent', width: 2.6 });
          const xs = crossings(R, G), tAge = xs.length ? xs[xs.length - 1] : null;
          if (tAge) { Q.dot(tAge, G, { r: 6, color: 'red' }); Q.text(fmtYr(tAge), tAge, G, { dx: 8, dy: -12, size: 12, weight: 700, color: 'red' }); }
          Q.vline(age.value, { color: 'muted', width: 1, dash: [4, 4] });
          // profile at the chosen age
          const i = clamp(Math.round(Math.log(age.value / R.t[0]) / Math.log(R.t[1] / R.t[0])), 0, R.t.length - 1), prof = R.prof[i];
          const zv = clamp(4.2 * Math.sqrt(kap * age.value * YR) / 1000, 60, 1400);
          P.setView([0, Math.max(T0, 600) * 1.08], [-zv, 0]);
          const step = [20, 50, 100, 200, 250, 500].find((q) => zv / q <= 6) || 500; const yt = []; for (let d = step; d < zv; d += step) yt.push([-d, String(d)]); P.setTicks(undefined, yt);
          const pts = []; for (let j = 0; j < R.z.length && R.z[j] <= zv * 1000 * 1.001; j++) pts.push([prof[j], -R.z[j] / 1000]);
          P.path(pts, { color: 'accent', width: 2.6 });
          if (!perry.value && !A) P.curve((u) => { const zm = u * zv * 1000; return [T0 * v.M.erf(zm / (2 * Math.sqrt(kap * R.t[i] * YR))), -u * zv]; }, 0, 1, { color: 'ink', width: 1.4, dash: [6, 4] });
          const zt = Math.min(zv, (0.9 * Math.max(T0, 600)) / G); P.line(0, 0, G * zt, -zt, { color: 'gold', width: 2 });
          if (perry.value) { P.hband(-Ls.value, 0, { color: 'orange', alpha: 0.08 }); P.text('conducting lid', Math.max(T0, 600) * 1.05, -Ls.value / 2, { align: 'right', size: 11, color: 'orange', weight: 600 }); }
          P.corner(`after ${fmtYr(R.t[i])}`, 'tr', { size: 13, weight: 700, color: 'ink' });
          const gan = (T0 / Math.sqrt(Math.PI * kap * (tAge || 1e8) * YR)) * 1000;
          st = { R, tAge, xs, G, mod, gan, kap, T0, A, i };
        });
        v.legend([['accent', 'numerical solution'], ['ink', 'Kelvin: erf profile, $T_0/\\sqrt{\\pi\\kappa t}$', { dash: true }], ['gold', 'measured gradient'], ['green', 'radiometric age 4.54 Gyr']]);
        v.readout(() => {
          if (!st) return '';
          const { R, tAge, G, mod, gan, A } = st;
          const G454 = R.G[R.t.findIndex((t) => t >= 4.54e9)];
          let s = tAge ? `the model's surface gradient equals the measured ${v.fix(G, 1)} °C/km at **${fmtYr(tAge)}**` : `the model's gradient never falls to ${v.fix(G, 1)} °C/km within 6.5 Gyr: no age can be read from it`;
          if (!perry.value && !A && tAge) s += ` (numerical solution vs $T_0/\\sqrt{\\pi\\kappa t}$: ${v.fix((100 * Math.abs(G - gan)) / gan, 2)}% apart)`;
          if (preset.value === 'kelvin' && !perry.value && !A) s += ' · Kelvin 1862: 98 Myr, limits 20–400 Myr';
          if (mod) { const lo = crossings(R, 80 / K), hi = crossings(R, 40 / K); s += ` · heat flux 40–80 mW m⁻² (K = 3 W/m/K) fits ages ${lo.length ? fmtYr(lo[lo.length - 1]) : '< 0.1 Myr'} – ${hi.length ? fmtYr(hi[hi.length - 1]) : '> 6.5 Gyr'}`; }
          s += ` · at 4.54 Gyr this Earth would have **${v.fix(G454, 1)} °C/km**`;
          if (A) s += ` · radiogenic heat ${v.fix(A * 1e6, rad.value === 'crust' ? 2 : 3)} µW m⁻³ (20 TW in all)`;
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'The relative geologic time scale',
      statement: String.raw`The geologic time scale divides Earth history into **eons** (Hadean, Archean, Proterozoic, Phanerozoic), **eras** and **periods**. Its Phanerozoic part was built in the nineteenth century as a purely **relative** scale: each period was defined by a type section of strata (the Cambrian in Wales, the Devonian in Devon, the Jurassic in the Jura, the Permian at Perm), placed in order by superposition and faunal succession, and recognized worldwide by its fossils. Many boundaries fall at mass extinctions, where the fossil assemblage changes abruptly. Numerical ages came only in the twentieth century from radiometric dating, which showed the periods to be very unequal and the Precambrian to fill almost nine-tenths of Earth's 4.5-billion-year history. Today each boundary is defined by a reference point in a rock section (a GSSP), and the International Commission on Stratigraphy publishes the best estimates of the ages.`,
      idea: String.raw`Order needs no clock. Superposition (geol-1.4) orders the strata of one region, faunal succession (geol-1.5) carries the order from region to region, and unconformities (geol-1.6) mark where pieces are missing; by 1879, when Lapworth slotted the Ordovician between the Cambrian and Silurian, the sequence of Phanerozoic periods was essentially complete. Only the Precambrian, nearly without fossils, resisted subdivision until isotopes could date it. Radiometric ages (geol-2.11) then stretched this ordinal scale onto a numerical one without changing the order.`,
      caption: String.raw`The left column is the relative scale, every period the same height because order is all it knows; the right column is the same sequence at its numerical ages from the ICS chart (v2024/12), with lines joining the boundaries. Switch the view to **all of Earth history** to see the Precambrian swallow the picture, and the scale to **log** to make room for both. Click a period for its name, author and age; red marks are the five great mass extinctions.`,
      deps: ['geol-1.5', 'geol-1.6', 'geol-1.4'],
      see: ['geol-2.11', 'bighist-1.1', 'bighist-3.8'],
      refs: ['Press–Siever'],
      tags: ['geologic time', 'stratigraphy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geologic_time_scale' },
      viz(v) {
        const view = v.select('view', [{ value: 'phan', label: 'Phanerozoic' }, { value: 'all', label: 'all of Earth history' }], 'phan');
        const scale = v.select('numerical scale', [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'log' }], 'lin');
        const S = v.stage({ x: [0, 10], y: [-0.04, 1.06], axes: false, height: 540 });
        let sel = 'Jurassic', boxes = [];
        S.onClick((x, y) => { const b = boxes.find((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1); if (b) sel = b.name; });
        let st = null;
        v.render(() => {
          const all = view.value === 'all', lg = scale.value === 'log', tMax = all ? 4567 : 538.8;
          const yN = (a) => (lg ? 1 - Math.log10(a + (all ? 1 : 0.3)) / Math.log10(tMax + (all ? 1 : 0.3)) : 1 - a / tMax);
          boxes = [];
          // relative column: equal heights
          const rel = all ? [['Precambrian', 4567, 538.8, 2], ...PHAN.map((p) => [p[0], p[1], p[2], 1])] : PHAN.map((p) => [p[0], p[1], p[2], 1]);
          const wTot = rel.reduce((s, r) => s + r[3], 0); let acc = 0; const relY = new Map();
          const rx0 = 1.45, rx1 = 3.75, nx0 = 4.85, nx1 = 6.85;
          S.text('relative scale: order only', (rx0 + rx1) / 2, 1.035, { align: 'center', size: 12.5, weight: 700 });
          S.text(`numerical ages (ICS), ${lg ? 'log' : 'linear'}`, 7.05, 1.035, { align: 'center', size: 12.5, weight: 700 });
          for (const [name, a, b, w] of rel) {
            const y0 = acc / wTot, y1 = (acc + w) / wTot; acc += w; relY.set(name, [y0, y1]);
            const P = PHAN.find((p) => p[0] === name), col = P ? P[7] : 'pink', on = sel === name || (name === 'Precambrian' && !P && ['Hadean', 'Archean', 'Proterozoic'].includes(sel));
            S.rect(rx0, y0, rx1, y1, { fill: col, fillAlpha: on ? 0.55 : 0.25, color: on ? 'ink' : col, width: on ? 2 : 1 });
            const hpx = Math.abs(S.Y(y1) - S.Y(y0));
            if (hpx > 13) S.text(name, rx0 + 0.12, (y0 + y1) / 2, { size: hpx > 22 ? 12 : 10.5, weight: on ? 700 : 500 });
            if (P && hpx > 18) fossil(v, S, P[6], S.X(rx1) - 16, S.Y((y0 + y1) / 2), Math.min(8, hpx * 0.32), P[7]);
            if (!P && hpx > 30) S.text('no index fossils: undivided', rx0 + 0.12, (y0 + y1) / 2, { dy: 14, size: 10, color: 'muted' });
            boxes.push({ name, x0: rx0, x1: rx1, y0, y1 });
          }
          // numerical columns: periods, eras, eons
          const drawCol = (list, x0, x1, labelMin, colorOf, small) => list.forEach(([name, a, b]) => {
            if (b >= tMax) return; const y0 = yN(Math.min(a, tMax)), y1 = yN(b); const P = PHAN.find((p) => p[0] === name), on = sel === name;
            const col = colorOf(name, P);
            S.rect(x0, y0, x1, y1, { fill: col, fillAlpha: on ? 0.6 : 0.28, color: on ? 'ink' : col, width: on ? 2 : 0.8 });
            const hpx = Math.abs(S.Y(y1) - S.Y(y0));
            if (hpx > labelMin) S.text(name, (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', size: small ? 10 : 11.5, weight: on ? 700 : 500 });
            boxes.push({ name, x0, x1, y0: Math.min(y0, y1), y1: Math.max(y0, y1) });
          });
          drawCol(all ? [...PRE_P.map((p) => [p[0], p[1], p[2]]), ...PHAN.map((p) => [p[0], p[1], p[2]])] : PHAN.map((p) => [p[0], p[1], p[2]]), nx0, nx1, 13, (n, P) => (P ? P[7] : PRE_P.findIndex((q) => q[0] === n) % 2 ? 'orange' : 'pink'));
          drawCol(ERAS, 6.95, 8.05, 26, (n) => COL9[n] || (n.includes('archean') ? 'red' : 'orange'), true);
          drawCol(EONS, 8.15, 9.25, 26, (n) => COL9[n], true);
          // age ticks
          const ticks = lg ? (all ? [1, 10, 100, 538.8, 1000, 2500, 4567] : [1, 2.58, 10, 23.04, 66, 143.1, 251.9, 538.8]) : all ? [0, 538.8, 1000, 1600, 2500, 3200, 4031, 4567] : [0, ...PHAN.map((p) => p[1]).filter((t) => t > 3)];
          for (const t of ticks) { if (t > tMax) continue; const y = yN(t); S.line(9.3, y, 9.42, y, { color: 'muted', width: 1 }); S.text(`${t === 0 ? 0 : v.fix(t, t < 10 ? 2 : 1).replace(/\.0$/, '')}`, 9.46, y, { size: 10, color: 'muted' }); }
          S.text('Ma', 9.46, yN(0) + 0.03, { size: 10, color: 'muted' });
          // connectors between the columns
          for (const [name, a, b] of rel) { const [y0, y1] = relY.get(name); S.line(rx1, y0, nx0, yN(Math.min(a, tMax)), { color: 'faint', width: 1 }); if (b === 0) S.line(rx1, y1, nx0, yN(0), { color: 'faint', width: 1 }); }
          // mass extinctions
          for (const [name, a, b] of EXTINCT) {
            if (a > tMax) continue;
            const yNum = yN(b); let yRel = null;
            for (const p of PHAN) { const r = relY.get(p[0]); if (!r) continue; if (b <= p[1] + 1e-9 && b >= p[2] - 1e-9) { const f = (p[1] - b) / (p[1] - p[2]); yRel = r[0] + f * (r[1] - r[0]); break; } }
            if (yRel != null) { S.line(rx0 - 0.25, yRel, rx1, yRel, { color: 'red', width: 2.2 }); S.text(name, rx0 - 0.28, yRel, { align: 'right', size: 9.5, color: 'red', weight: 600 }); }
            S.line(nx0, yNum, nx1, yNum, { color: 'red', width: 2.2 });
          }
          st = { all, lg };
        });
        v.legend([['red', 'mass extinction (the “big five”)']]);
        v.readout(() => {
          if (!st) return '';
          const P = PHAN.find((p) => p[0] === sel);
          if (P) {
            const d = P[1] - P[2], ex = EXTINCT.find((e) => Math.abs(e[2] - P[1]) < 1e-6);
            return `**${P[0]}**: ${v.fix(P[1], 2).replace(/\.?0+$/, '')}${P[3] ? ` ${P[3]}` : ''} – ${v.fix(P[2], 2).replace(/\.?0+$/, '')} Ma (ICS v2024/12) · ${v.fix(d, 1)} Myr, ${v.fix((100 * d) / 4567, 2)}% of Earth history · named for ${P[4]} by ${P[5]}${ex ? ` · begins after the ${ex[0]} mass extinction` : ''} · the twelve Phanerozoic periods were ordered by fossils by 1879; the first radiometric ages (Boltwood, 1907) came decades later`;
          }
          const L = [...EONS, ...ERAS, ...PRE_P].find((p) => p[0] === sel) || ['Precambrian', 4567, 538.8];
          const d = L[1] - L[2];
          return `**${L[0]}**: ${L[1]} – ${L[2]} Ma · ${v.fix(d, 0)} Myr, **${v.fix((100 * d) / 4567, 1)}%** of Earth history · ${L[1] > 538.8 || L[0] === 'Precambrian' ? 'without hard-shelled fossils this time could not be subdivided relatively; its divisions are defined by numerical ages' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Paper',
      name: 'Theory of the Earth',
      paper: { authors: 'James Hutton', year: 1788, title: 'Theory of the Earth; or an Investigation of the Laws observable in the Composition, Dissolution, and Restoration of Land upon the Globe', venue: 'Transactions of the Royal Society of Edinburgh 1 (2): 209–304', doi: '10.1017/S0080456800029227' },
      introduces: ['geol-1.6'],
      statement: String.raw`Hutton argued that the rocks of the continents are made of the debris of earlier land: worn down by rain, rivers and the sea, carried into the ocean, laid down in layers, consolidated by the Earth's internal heat (he also recognized granite as once molten and intruded), and raised again by that heat to form new land, which is then eroded in turn. Working through the same slow processes we see today, this cycle of **decay and renovation** has run many times, so the time involved is beyond reckoning: "we find no vestige of a beginning, — no prospect of an end." In modern terms the paper sets out the rock cycle (geol-1.2), plutonism and the principle that present processes explain the past (uniformitarianism, geol-1.6), and it requires deep time; it claims no number for the age of the Earth, and its picture of a steady, indefinitely old Earth was later corrected by thermodynamics and radiometric dating.`,
      idea: String.raw`The prevailing view in 1785 (Werner's Neptunism) held that rocks precipitated from a primeval ocean, in an Earth only thousands of years old on the biblical chronology. Hutton, a farmer and physician who had watched soil wash from his fields, reasoned like an engineer about a machine that maintains itself: erosion would level the continents unless something restored them, and that something was internal heat. Read to the Royal Society of Edinburgh in March and April 1785 and printed in 1788, the theory found its most famous evidence the same year, when Hutton, John Playfair and James Hall sailed to Siccar Point and saw near-vertical grey beds cut off and overlain by gently dipping red sandstone: two cycles, each of deposition, consolidation, uplift and erosion, in one cliff. "The mind seemed to grow giddy by looking so far into the abyss of time," Playfair wrote. Lyell built uniformitarian geology on Hutton's foundation; Kelvin's thermodynamics (geol-1.8) later showed that the Earth does have a history with a beginning.`,
      caption: String.raw`Step through a schematic Siccar Point (the unconformity drawing Hutton commissioned, of Jedburgh, appeared only in his 1795 book). Each step runs one of Hutton's processes: sea-floor deposition of the grey beds, folding until they stand on end, uplift and erosion to a plain, deposition of the breccia and red sandstone, tilting and erosion to today's cliff. Set the **deposition** and **erosion** rates to values measured today; the clock on the right adds up each step from the thicknesses in the picture (see the 500 m scale bar) and sets the total against Ussher's 6000 years and against radiometric dating, which puts the lower beds at about 435 Myr and the gap at about 65 Myr.`,
      deps: ['geol-1.4'],
      refs: [],
      tags: ['deep time', 'history', 'unconformity'],
      credit: 'James Hutton, 1788',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Siccar_Point' },
      viz(v) {
        const dep = v.slider('deposition rate (mm/yr)', 0.01, 1, 0.1, { log: true, sig: 2 });
        const ero = v.slider('erosion and uplift rate (mm/yr)', 0.005, 1, 0.054, { log: true, sig: 2 });
        const S = v.stage({ x: [0, 12], y: [-0.2, 6], axes: false, equal: true, height: 330, weight: 1.35 });
        const C = v.stage({ x: [1, 2e10], y: [-0.5, 8.6], xlog: true, axes: 'box', height: 330, weight: 1, minWidth: 260, xlabel: 'years (log scale)', yticks: [], title: 'Hutton’s clock at today’s rates' });
        const E0 = siccarEvents();
        const kE1 = E0.findIndex((e) => e.type === 'erode'), kE2 = E0.length - 1;
        // thicknesses (km) measured from the geometry
        const H1 = (4.5 - -6) * HKM, Hup = (4.85 - 1.55) * HKM, Hfold = 3.2 * HKM, He1 = erodedThickness(E0, kE1, 0, 12, 12) * HKM, He2 = erodedThickness(E0, kE2, 0, 12, 12) * HKM;
        const NOTES = [
          'The Silurian sea floor: sand and mud from the land settle layer on layer (these became the grey beds, about 435 Myr ago).',
          'Consolidated and squeezed: the layers are folded until they stand nearly on end.',
          'Raised into land and worn down: rivers and rain strip off the tops of the folds and plane them flat.',
          'Sinking again under rivers and lakes: breccia of broken grey rock, then red sand, is laid across the eroded edges (about 370 Myr ago).',
          'Tilted, raised and cut by the sea into the cliff Hutton saw from a boat in 1788.',
          '“No vestige of a beginning”: the grey beds are themselves made of grains from an older land, worn down in an earlier cycle.',
        ];
        const frames = NOTES.map((note, i) => ({ step: i, note }));
        const Sp = v.steps({ frames, transition: 1.6, start: 5, still: 5, speed: 0.45 });
        const yrs = (km, r) => (km * 1e6) / r; // thickness in km at a rate in mm/yr → years
        const dur = () => [yrs(H1, dep.value), yrs(Hfold, ero.value), yrs(He1, ero.value), yrs(Hup, dep.value), yrs(He2, ero.value)];
        let st = null;
        v.render(() => {
          const f = Sp.frame, k = f.step ?? 5, tw = Sp.tween;
          const E = E0.map((e) => ({ ...e, p: e.type === 'base' ? 1 : e.step < k ? 1 : e.step === k ? tw : 0 }));
          if (k === 5) E.forEach((e) => { e.p = 1; });
          if (k <= 1) S.rect(-5, -1, 17, 5.6, { fill: 'blue', fillAlpha: 0.07, stroke: false });
          if (k >= 4) S.rect(-5, -1, 17, 2.0, { fill: 'blue', fillAlpha: 0.14, stroke: false });
          drawSection(v, S, E, { key: `${k}|${tw.toFixed(3)}`, res: 2, pale: 0.45 });
          if (k >= 3 && (k > 3 || tw > 0.05)) uncLine(S, E, kE1, { res: 170 });
          if (k >= 4) S.text('North Sea', 0.3, 1.75, { size: 12, color: 'blue', weight: 600 });
          S.corner(`${k + 1}/6`, 'tr', { size: 12, weight: 700, color: 'muted' });
          S.line(0.4, 3.4, 0.4, 5.4, { color: 'ink', width: 2 }); S.line(0.25, 3.4, 0.55, 3.4, { color: 'ink', width: 2 }); S.line(0.25, 5.4, 0.55, 5.4, { color: 'ink', width: 2 }); S.text('500 m', 0.65, 4.4, { size: 11.5, weight: 700 });
          // the clock
          const d = dur(), labels = ['grey beds laid down', 'folding', 'erosion to a plain', 'red beds laid down', 'tilt, uplift, erosion'];
          const total = d.reduce((a, b) => a + b, 0), gap = d[1] + d[2];
          C.vline(6000, { color: 'purple', width: 2.4 }); C.text('Ussher: 6000 yr', 6000, 8.2, { dx: 5, size: 11, color: 'purple', weight: 700 });
          C.vline(4.54e9, { color: 'green', width: 1.6 }); C.text('Earth 4.54 Gyr', 4.54e9, 8.2, { dx: -5, align: 'right', size: 11, color: 'green', weight: 700 });
          d.forEach((t, i) => {
            const y = 7 - i * 1.15, on = i <= k - (k === 5 ? 1 : 0), col = i === 0 ? 'teal' : i === 3 ? 'red' : 'orange';
            C.rect(1, y - 0.35, Math.max(t, 1.01), y + 0.35, { fill: col, fillAlpha: on ? 0.55 : 0.15, color: col, width: on ? 1.4 : 0.8 });
            C.text(`${labels[i]}: ${fmtYr(t)}`, 1.5, y, { size: 11, weight: i === k ? 700 : 500, color: on ? 'ink' : 'muted' });
          });
          const yT = 7 - 5 * 1.15;
          C.rect(1, yT - 0.38, total, yT + 0.38, { fill: 'ink', fillAlpha: 0.16, stroke: false, hatch: 'ink', hatchAlpha: 0.35 }); C.rect(1, yT - 0.38, total, yT + 0.38, { color: 'ink', width: 1.4 });
          C.text(`total ${fmtYr(total)}`, 1.5, yT, { size: 11.5, weight: 700 });
          C.dot(4.35e8, yT, { r: 5, color: 'green' }); C.dot(6.5e7, 7 - 1.6 * 1.15, { r: 5, color: 'green', hollow: true });
          st = { d, total, gap, k };
        });
        v.legend([['green', 'radiometric: lower beds ≈ 435 Myr (dot), gap ≈ 65 Myr (ring)', { dot: true }], ['purple', 'Ussher (1650): creation in 4004 BC'], ['red', 'the unconformity']]);
        v.readout(() => {
          if (!st) return '';
          const { total, gap } = st;
          return `at ${v.fix(dep.value, 2)} mm/yr of deposition and ${v.fix(ero.value, 3)} mm/yr of erosion and uplift, this cliff needs **${fmtYr(total)}**, of which the hidden gap (folding plus erosion) is **${fmtYr(gap)}** · that is ${Math.round(total / 6000).toLocaleString('en-US').replace(/,/g, ' ')} times Ussher's 6000 years · Hutton gave no number ("no vestige of a beginning"); radiometric dating: the grey beds ≈ 435 Myr old, the gap ≈ 60–65 Myr, the Earth 4.54 Gyr`;
        });
      },
    },
  ],
};
