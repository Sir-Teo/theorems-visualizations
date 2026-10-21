// Big History & Quantitative History — Chapter 1: Deep time and how we measure it
//
// Sources checked (Oct 2026):
//   Ages of events: universe 13.79 Gyr (Planck 2018 VI); CAI / Solar System 4.567 Ga (Connelly et al. 2012, Science
//     338: 651); Jack Hills zircon 4.40 Ga (Wilde et al. 2001, Nature 409: 175); Dresser Fm stromatolites 3.48 Ga;
//     Phanerozoic boundaries from the ICS chart v2024/12; Jebel Irhoud H. sapiens ~300 ka (Hublin et al. 2017);
//     Sulawesi cave art ≥ 51.2 ka (Oktaviana et al. 2024, Nature 631: 814). Ages are measured from 2025.
//   Cosmic calendar: Sagan, The Dragons of Eden (1977) used a 15-billion-year universe; the calendar here is recomputed.
//   1.3 half-lives from NUBASE2020 (Kondev et al. 2021, Chinese Phys. C 45: 030001), read from the IAEA AMDC table
//     nubase_4.mas20: 14C 5.70(3) kyr; 40K 1.248(3) Gyr with 10.72% EC/β+ to 40Ar and 89.28% β− to 40Ca;
//     235U 704(1) Myr; 238U 4.463(3) Gyr; 87Rb 49.7(3) Gyr (IUPAC-IUGS recommends 49.61 ± 0.16 Gyr, Villa et al. 2015,
//     GCA 164: 382). Geochronologists also use the conventional Jaffey (1971) and Steiger–Jäger (1977) constants.
//   1.5 tree rings: ITRDB chronology CA533 (Campito Mountain bristlecone pine, Graybill & LaMarche, 1983), NOAA NCEI
//     paleo/treering/chronologies/northamerica/usa/ca533.crn, standard ring-width index 1700–1983. Baillie & Pilcher
//     (1973, Tree-Ring Bulletin 33: 7) for the t-value test and the t ≥ 3.5 convention. Hohenheim oak–pine chronology:
//     12,460 years (Friedrich et al. 2004, Radiocarbon 46: 1111). GICC05 layer counting to 60 ka, GI-17 onset at
//     59.4 ± 1.3 ka b2k (Svensson et al. 2008, Clim. Past 4: 47).
//     Ice cores: EPICA Dome C / Antarctic CO2 composite (Bereiter et al. 2015, GRL 42: 542; NOAA file
//     antarctica2015co2composite.txt) and EDC deuterium temperature on EDC3 (Jouzel et al. 2007, Science 317: 793;
//     NOAA file edc3deuttemp2007.txt), both averaged here in 2-kyr bins (gaps interpolated; the 0–2 ka bin excludes ages
//     younger than 1750); the depth–age table is every 100 m from the same file. Mauna Loa 2024 annual mean 424.61 ppm
//     (NOAA GML).
//   1.6 Christian's thresholds (TED 2011; Origin Story 2018) and Spier's critique: F. Spier, "Thresholds of increasing
//     complexity in big history: a critical review", J. Big History 5(1): 48–58 (2022).
//   1.7 energy rate densities: E. J. Chaisson, "The natural science underlying big history", Sci. World J. 2014: 384912
//     (values quoted from its summaries: galaxies 0.1, Sun 2, Earth's climasphere 75, plants 10³–2×10⁴, animals
//     3×10³–9×10⁴, human body 2×10⁴, human brain 1.5×10⁵, agriculturists 10⁵, industrialists 3×10⁵, world 5×10⁵,
//     technologists 2×10⁶, engines and aircraft 4×10⁴–2.7×10⁷ erg s⁻¹ g⁻¹). Human-made mass 1.1 Tt in 2020
//     (Elhacham et al. 2020, Nature 588: 442); world primary energy ≈ 620 EJ/yr (Energy Institute, 2024).
//   1.8 Kurzweil, The Singularity Is Near (2005), "Countdown to Singularity" from 15 lists, 13 of them compiled by
//     T. Modis (2002, TFSC 69: 377); Modis's 2006 reply on data quality and the lists' independence.

const PRESENT = 2025;
const LN2 = Math.LN2;

// Milestones [label, years before 2025, priority]. Sorted oldest first.
const MILESTONES = [
  ['Big Bang', 13.79e9, 1], ['first stars', 13.6e9, 0], ['Sun & Earth', 4.567e9, 1], ['oldest zircons', 4.4e9, 0],
  ['first fossils', 3.48e9, 1], ['oxygen rises', 2.4e9, 0], ['eukaryotes', 1.6e9, 0], ['Snowball Earth', 7.2e8, 0],
  ['Cambrian explosion', 5.388e8, 1], ['land plants', 4.7e8, 0], ['tetrapods', 3.75e8, 0], ['end-Permian extinction', 2.519e8, 0],
  ['dinosaurs', 2.33e8, 0], ['flowers', 1.3e8, 0], ['K–Pg extinction', 6.6e7, 1], ['hominins', 7e6, 0],
  ['stone tools', 3.3e6, 0], ['Homo erectus', 1.9e6, 0], ['Homo sapiens', 3.0e5, 1], ['cave art', 5.12e4, 0],
  ['farming', 1.15e4, 0], ['writing', 5225, 1], ['printing press', 575, 0], ['Columbus', 533, 0],
  ['steam engine', 313, 0], ['Moon landing', 56, 0], ['World Wide Web', 34, 0],
];

/** Years → '13.8 billion years', '66 million years', '5,225 years' (plain text). */
function yrs(a, d = 3) {
  const x = Math.abs(a);
  if (x >= 1e9) return `${+(a / 1e9).toPrecision(d)} billion years`;
  if (x >= 1e6) return `${+(a / 1e6).toPrecision(d)} million years`;
  if (x >= 1e4) return `${Math.round(a).toLocaleString('en-US')} years`;
  if (x >= 10) return `${Math.round(a).toLocaleString('en-US')} years`;
  return `${+a.toPrecision(2)} years`;
}
/** Short form: 13.8 Gyr, 66 Myr, 300 kyr, 5,225 yr. */
function yrShort(a, d = 3) {
  const x = Math.abs(a);
  if (x >= 1e9) return `${+(a / 1e9).toPrecision(d)} Gyr`;
  if (x >= 1e6) return `${+(a / 1e6).toPrecision(d)} Myr`;
  if (x >= 1e5) return `${+(a / 1e3).toPrecision(d)} kyr`;
  if (x >= 1) return `${Math.round(a).toLocaleString('en-US')} yr`;
  return `${+a.toPrecision(2)} yr`;
}
const pearson = (a, b) => {
  const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; sab += x * y; saa += x * x; sbb += y * y; }
  return sab / Math.sqrt(saa * sbb);
};
/** Spearman rank correlation. */
function spearman(a, b) {
  const rank = (x) => { const idx = x.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(x.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2; i = j + 1; } return r; };
  return pearson(rank(a), rank(b));
}
/** Text width in px for canvas text at a given size/weight. */
function textW(s, str, size = 12, weight = 500) { const c = s.ctx; c.save(); c.font = `${weight} ${size}px Inter, system-ui, sans-serif`; const w = c.measureText(str).width; c.restore(); return w; }
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
/** 150000 → '1.5×10⁵' (plain text); small numbers stay decimal. */
function sci(x, d = 2) {
  if (x === 0 || !isFinite(x)) return String(x);
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return String(+x.toPrecision(d));
  const m = +(x / 10 ** e).toPrecision(d);
  return `${m === 1 ? '' : m + '×'}10${String(e).split('').map((ch) => SUP[ch]).join('')}`;
}
/**
 * Greedy label placement: each label tries positions around its point (right, left, diagonals, above, below, then
 * further out with a leader line) and takes the first that stays inside the data area and clears the points and the
 * labels already placed. items: [{x, y, text, color, size, weight, r, prefer: [cx, cy]}] in data coordinates.
 */
function placeLabels(v, s, items, o = {}) {
  const b = s.bounds, X0 = s.X(b.x[0]), X1 = s.X(b.x[1]), Y0 = s.Y(b.y[0]), Y1 = s.Y(b.y[1]);
  const xl = Math.min(X0, X1), xr = Math.max(X0, X1), yt = Math.min(Y0, Y1), yb = Math.max(Y0, Y1);
  const pts = items.map((it) => [s.X(it.x), s.Y(it.y), (it.r ?? 5) + 1.5]).concat(o.points || []);
  const boxes = [...(o.avoid || [])];
  const hit = (bx) => boxes.some((q) => bx[0] < q[2] && bx[2] > q[0] && bx[1] < q[3] && bx[3] > q[1])
    || pts.some(([cx, cy, r]) => { const nx = Math.max(bx[0], Math.min(cx, bx[2])), ny = Math.max(bx[1], Math.min(cy, bx[3])); return Math.hypot(nx - cx, ny - cy) < r; });
  const C = [[1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1], [0, -1], [0, 1], [1, -2], [-1, -2], [1, 2], [-1, 2], [0, -2], [0, 2], [2, -2], [-2, -2], [2, 2], [-2, 2], [0, -3], [0, 3]];
  items.forEach((it, i) => {
    const size = it.size ?? 11, wt = it.weight ?? 500, w = textW(s, it.text, size, wt), h = size + 4, [px, py] = pts[i];
    let pick = null, first = null;
    for (const [cx, cy] of it.prefer ? [it.prefer, ...C] : C) {
      const far = Math.abs(cx) > 1 || Math.abs(cy) > 1, gx = far ? 22 : 7, gy = (Math.abs(cy) > 1 ? 1.5 * Math.abs(cy) - 1 : 0.85) * h;
      const x0 = cx > 0 ? px + gx : cx < 0 ? px - gx - w : px - w / 2, yc = py + Math.sign(cy) * gy;
      const bx = [x0 - 2, yc - h / 2, x0 + w + 2, yc + h / 2];
      if (bx[0] < xl + 2 || bx[2] > xr - 2 || bx[1] < yt + 1 || bx[3] > yb - 1) continue;
      first ||= { bx, x0, yc, far };
      if (!hit(bx)) { pick = { bx, x0, yc, far }; break; }
    }
    pick ||= first; if (!pick) return;
    boxes.push(pick.bx);
    if (pick.far) { const nx = Math.max(pick.bx[0], Math.min(px, pick.bx[2])), ny = Math.max(pick.bx[1], Math.min(py, pick.bx[3])); const c = s.ctx; c.save(); c.strokeStyle = v.color(it.color || 'muted', 0.55); c.lineWidth = 1; c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke(); c.restore(); }
    s.textPx(it.text, pick.x0, pick.yc, { size, weight: wt, color: it.color || 'ink', align: 'left' });
  });
}


// ── 1.5 data ──────────────────────────────────────────────────────────────────────────────────────────────────────────
// CA533 standard ring-width index × 1000, 1700–1983 (ITRDB).
const RING = [809,837,753,449,573,475,739,500,380,781,741,758,951,957,767,970,771,765,994,940,1111,1383,976,894,1048,1043,1046,1145,1218,1101,1170,994,1281,680,1145,775,1076,1178,1062,880,1182,1402,859,1246,1252,1171,1111,1349,1181,1166,1244,1530,965,608,713,979,649,671,1076,962,1574,1385,1264,838,916,1165,945,1301,1015,1224,1103,1315,1294,1190,990,1149,1184,767,1071,1173,1055,697,226,716,805,975,995,999,1134,1053,950,1037,1035,1016,881,549,936,1216,1095,1174,1262,1400,1141,1328,1358,1360,1044,920,1120,1302,777,1136,764,675,852,846,845,1188,980,947,652,942,792,994,765,994,1134,1101,971,731,929,1089,988,1000,1045,792,379,637,724,922,796,858,569,912,684,528,779,691,953,1026,981,940,1301,1204,1196,1182,543,381,354,699,996,758,961,793,1221,807,1239,1178,1196,1064,1163,1065,1276,1140,1161,1137,972,1338,1364,1117,712,781,1187,1163,1183,1135,1473,1267,1362,1439,1197,1355,1322,1202,987,1191,744,1068,1238,390,1238,1437,1375,1249,990,1341,1301,1625,1355,1429,1291,1556,1259,1079,1446,1428,1404,1281,1184,1485,1353,1265,1407,1178,1070,1388,1421,1591,1468,516,1469,1417,1481,1363,1467,1187,969,1511,1322,1438,1555,1147,1142,1284,1075,1276,1608,1641,926,1180,1182,1418,1279,1473,1371,1358,1307,1362,1315,1084,472,590,1258,1435,1445,1338,1103,1331,1465,1759,1194,1282,1128,1356,1069,961,1172,1646,1431,1331,1843,1607,1739,1680];
const RING_Y0 = 1700;
// Antarctic CO2 (ppm, Bereiter et al. 2015) and EDC temperature anomaly (°C, Jouzel et al. 2007): 2-kyr means, bin k = [2k, 2k+2) ka.
const CO2 = [279,275,269,261,262,262,244,232,204,189,190,189,184,189,191,189,196,200,207,205,200,203,211,212,203,209,220,215,215,226,212,200,202,204,205,227,234,243,233,228,232,245,236,223,225,232,235,244,243,243,245,239,247,242,242,252,261,273,274,273,275,277,278,275,274,244,225,212,201,196,196,196,196,194,199,202,199,196,189,187,188,204,196,189,190,198,197,197,190,208,213,208,200,203,221,226,218,223,226,242,251,243,236,229,239,248,247,244,248,243,215,208,206,218,231,232,238,245,246,244,259,280,251,225,215,200,202,195,202,204,208,212,228,206,190,199,188,194,196,203,213,224,230,229,231,224,207,210,213,221,234,238,244,247,227,232,240,255,257,239,252,257,260,265,269,270,275,289,278,246,234,225,205,208,220,221,216,209,201,193,186,186,201,204,206,202,200,215,225,230,228,227,240,243,246,252,259,267,272,277,283,279,278,283,280,283,275,271,272,274,271,268,269,261,245,220,219,209,208,200,202,202,199,201,206,201,203,198,195,205,199,193,205,206,203,212,237,240,235,236,221,225,231,232,240,247,243,239,237,232,230,232,233,236,238,235,239,240,245,245,246,242,236,231,224,221,210,193,200,206,212,204,209,210,204,213,222,225,244,236,231,239,250,254,252,251,248,251,252,251,233,211,219,228,245,243,229,236,218,225,232,238,245,252,259,258,257,253,253,248,245,242,236,217,202,200,196,195,195,189,190,191,196,191,195,191,189,197,193,186,191,191,185,174,182,194,198,211,220,225,230,221,223,222,230,238,241,239,239,240,235,232,235,236,233,226,224,226,203,197,217,214,212,211,210,211,210,215,210,189,186,188,188,189,189,192,199,201,210,223,223,216,227,229,224,233,243,240,247,254,254,256,259,265,247,229,218,207,198,200];
const DT = [-0.1,-0.1,-0.1,-0.8,-0.8,-0.6,-4.1,-4.5,-8.1,-9.4,-9.3,-9.3,-9.7,-9.3,-8.8,-9.0,-8.5,-8.2,-7.5,-7.4,-8.2,-7.7,-7.2,-6.3,-7.5,-6.8,-6.0,-6.9,-6.5,-5.8,-7.2,-8.4,-8.9,-8.9,-8.4,-6.5,-7.0,-5.8,-6.5,-5.6,-4.7,-3.4,-4.4,-6.0,-5.7,-5.6,-5.0,-4.6,-4.6,-4.7,-4.4,-5.7,-5.1,-4.8,-6.3,-5.2,-4.2,-2.3,-0.8,0.5,1.5,2.0,1.7,2.3,3.6,0.7,-3.4,-6.6,-8.2,-8.7,-8.7,-8.5,-8.4,-8.1,-7.8,-7.5,-7.9,-8.7,-9.0,-7.6,-7.7,-7.3,-8.6,-7.8,-7.0,-7.6,-7.5,-8.1,-7.1,-7.4,-8.5,-8.8,-8.4,-6.2,-6.1,-6.9,-6.1,-5.6,-3.8,-2.3,-2.4,-4.3,-3.7,-2.9,-2.1,-1.7,-2.2,-1.9,-3.7,-5.4,-7.0,-8.3,-7.5,-6.4,-7.3,-7.0,-5.6,-4.0,-2.6,-2.0,0.3,1.4,-3.1,-6.3,-6.4,-7.7,-8.1,-7.9,-7.3,-7.1,-7.7,-7.0,-7.3,-8.2,-8.7,-9.1,-9.2,-8.7,-8.5,-8.2,-6.9,-6.2,-5.7,-5.1,-4.8,-5.0,-6.8,-7.2,-6.7,-6.8,-6.4,-5.9,-4.9,-6.3,-5.8,-5.4,-4.1,-3.0,-2.9,-4.5,-3.0,-1.3,0.1,0.6,0.7,0.5,2.9,1.3,-2.7,-5.6,-8.5,-9.1,-8.6,-8.2,-7.7,-7.8,-7.7,-8.7,-8.8,-8.5,-8.0,-7.3,-7.7,-7.4,-7.5,-6.6,-5.8,-7.5,-6.6,-6.0,-4.7,-5.4,-5.0,-4.1,-6.0,-5.0,-3.4,-1.8,-0.5,0.1,1.3,2.0,2.2,2.5,1.9,1.4,0.5,0.3,0.5,-0.2,-0.9,-2.0,-0.9,-3.1,-6.0,-8.0,-8.3,-8.2,-9.3,-9.0,-8.8,-7.8,-7.6,-6.7,-7.2,-7.4,-7.1,-7.1,-8.6,-8.7,-8.0,-7.5,-8.3,-8.3,-7.1,-5.1,-5.8,-5.9,-4.3,-5.5,-4.8,-4.0,-3.4,-2.7,-2.2,-3.0,-3.5,-3.7,-3.8,-3.9,-4.4,-4.3,-4.8,-4.7,-5.7,-5.7,-5.4,-4.7,-4.0,-3.4,-3.5,-4.4,-4.6,-4.7,-4.7,-6.8,-7.5,-6.9,-6.7,-7.6,-7.4,-7.2,-8.0,-7.3,-6.8,-5.9,-6.0,-3.8,-4.9,-6.3,-4.9,-3.3,-2.2,-1.7,-1.5,-1.5,-1.6,-1.3,-1.9,-1.2,-3.1,-6.2,-5.8,-6.5,-4.3,-5.0,-5.0,-4.5,-6.5,-5.4,-4.8,-4.2,-3.6,-2.8,-1.6,-1.4,-1.2,-1.2,-1.9,-2.2,-2.2,-2.7,-2.4,-4.4,-7.8,-8.8,-8.2,-8.9,-8.4,-8.8,-8.9,-8.0,-7.7,-7.8,-7.3,-7.4,-7.8,-7.2,-7.0,-8.0,-8.5,-7.9,-8.8,-9.0,-8.1,-7.7,-8.0,-6.8,-6.7,-5.4,-6.8,-5.4,-4.8,-3.9,-3.4,-2.8,-2.0,-1.9,-1.9,-2.2,-2.2,-2.5,-3.2,-3.7,-3.8,-4.0,-4.1,-4.5,-5.7,-6.7,-7.9,-7.7,-5.3,-6.0,-5.8,-5.2,-4.0,-4.0,-4.4,-6.1,-8.2,-8.7,-8.5,-8.6,-8.5,-8.5,-8.2,-7.5,-5.5,-6.3,-7.1,-5.2,-5.1,-6.2,-4.6,-4.0,-4.2,-3.2,-2.7,-2.2,-2.3,-1.9,-1.3,-1.0,-2.7,-4.3,-6.0,-7.8,-8.6,-8.7];
// EPICA Dome C depth (m) → EDC3 age (yr BP), every 100 m.
const DEPTH = [[0,-50],[100,2463],[200,5967],[300,9614],[400,13383],[500,19746],[600,28658],[700,37697],[800,46504],[900,55074],[1000,64042],[1100,74414],[1200,83333],[1300,92734],[1400,102144],[1500,113531],[1600,122195],[1700,129224],[1800,141993],[1900,161330],[2000,182001],[2100,201950],[2200,219637],[2300,243250],[2400,275861],[2500,311542],[2600,340220],[2700,395057],[2800,446471],[2900,526935],[3000,584984],[3100,699317],[3189.4,801662]];
/** Piecewise-linear interpolation in a table of [x, y] rows (x increasing). */
function interp(T, x, ix = 0, iy = 1) {
  if (x <= T[0][ix]) return T[0][iy];
  for (let i = 1; i < T.length; i++) if (x <= T[i][ix]) { const a = T[i - 1], b = T[i]; return a[iy] + (b[iy] - a[iy]) * (x - a[ix]) / (b[ix] - a[ix]); }
  return T[T.length - 1][iy];
}

export default {
  collection: 'bighist',
  chapter: 1,
  title: 'Deep time and how we measure it',
  summary: String.raw`The past is too long to picture on a linear scale: drawn to scale on a line 13.8 billion years long, all of recorded history is narrower than a pixel. Logarithmic axes and compressed calendars make it visible, and radioactive decay, tree rings and ice layers put dates on it. Big historians organise the story as a sequence of rising complexity, measured by thresholds or by energy flow per unit mass; both framings are useful, and both are disputed, as is the claim that history is accelerating.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Deep time on a logarithmic axis',
      statement: String.raw`On a **linear** time axis equal lengths mean equal durations. Drawn this way, the 13.8 billion years since the Big Bang squeeze everything recent into the right-hand edge: on a line one metre long, the 5,000 years of writing take up about $0.4$ micrometres, and Homo sapiens about $22$ micrometres.

On a **logarithmic** axis of *years before present*, equal lengths mean equal *factors*: a decade, a century, a millennium, … up to ten billion years each get the same width. The universe, the Earth, life, our species and the written record then all fit on one page. The price is that the axis has no zero: "now" sits infinitely far to the right, so the plot always stops at some recent cut-off, and spacing on it no longer shows durations directly.`,
      idea: String.raw`The map $t \mapsto \log_{10} t$ turns multiplication into addition (the functional equation of the logarithm, the inverse of the exponential in pma-8.6), so every factor of ten becomes the same step. With $t$ running from $10$ years to $1.38\times10^{10}$ years there are about $9.1$ decades to share out, roughly a ninth of the width each, whereas a linear axis gives the last $5{,}000$ years only $5000/1.38\times10^{10} \approx 4\times10^{-7}$ of it. Geologists cope with the same problem by naming intervals (eons, eras, periods, geol-1.9) whose lengths shrink towards the present.`,
      caption: String.raw`Drag the slider to shrink the **linear** window (top) from the whole age of the universe down to a century: each linear view can show only one scale, and everything older falls off the left edge. The **log** axis (bottom) always shows all of it, and the orange bar on it marks the window drawn above. The readout counts how many events share the last pixel of the linear axis. Hover over a dot for its date.`,
      deps: ['pma-8.6'],
      see: ['geol-1.9'],
      refs: ['Christian'],
      tags: ['deep time', 'scales'],
      viz(v) {
        const AGE = 13.79e9;
        const top = v.stage({ height: 222, full: true, title: 'linear axis: equal lengths are equal durations' });
        const bot = v.stage({ height: 262, full: true, title: 'logarithmic axis of years ago: equal lengths are equal factors' });
        const win = v.slider('linear window: the last', 100, AGE, AGE, { log: true, fmt: (x) => yrShort(x, 3) });
        const events = MILESTONES.map(([label, ago, p], i) => ({ id: 'e' + i, label, t: { ago }, priority: p, color: p ? 'accent' : 'blue' }));
        const TL = v.timeline(top, { scale: 'linear', range: [PRESENT - AGE, PRESENT], events, zoom: false, fontSize: 11.5, laneHeight: 16 });
        const eons = v.timelines('geologic', ['eon']).map((s) => ({ ...s, track: 1 }));
        const TG = v.timeline(bot, { scale: 'log', range: ['13.79 Ga', '10 yr ago'], minAgo: 10, events, zoom: false, fontSize: 11.5, laneHeight: 16, spans: eons });
        v.render(() => {
          const N = win.value, perPx = N / Math.max(1, top.width - 32);
          TL.view = [PRESENT - N, PRESENT];
          // events within the last 3 pixels cannot be told apart: draw them as one pile instead of a tower of labels
          const pile = events.filter((e) => e.t.ago < 3 * perPx), shown = events.filter((e) => e.t.ago >= 3 * perPx && e.t.ago <= N);
          // a span row below the axis is reserved for the note (a span far outside the view keeps the layout fixed)
          TL.set({ events: shown, spans: [pile.length ? { from: PRESENT - 3 * perPx, to: PRESENT, label: '', color: 'red', track: 0 } : { from: -1e13, to: -1e13 + 1, label: '', track: 0 }] });
          TG.set({ spans: [{ from: PRESENT - N, to: PRESENT, label: 'window shown above', color: 'orange', track: 0 }, ...eons] });
          TL.draw(); TG.draw();
          if (pile.length) {
            const txt = pile.length === 1 ? `${pile[0].label} is in the last 3 pixels →` : `${pile.length} events, from ${pile[0].label} to ${pile[pile.length - 1].label}, share the last 3 pixels →`;
            top.textPx(txt, top.width - 24, top.height - 21.5, { align: 'right', size: 12, weight: 650, color: 'red' });
          }
        });
        v.readout(() => {
          const W = Math.max(1, top.width - 32), N = win.value, perPx = N / W;
          const hist = 5225 / perPx, inLast = MILESTONES.filter(([, a]) => a < perPx).length;
          const dec = (bot.width - 32) / Math.log10(AGE / 10), histLog = (Math.log10(5225 / 10) / Math.log10(AGE / 10)) * 100;
          const histTxt = hist >= 1 ? `${v.fmt(hist, 3)} px` : `${v.fmt(hist, 2)} px (invisible)`;
          return `**Linear** (last ${yrShort(N)}): 1 pixel = ${yrShort(perPx, 2)}; recorded history (≈5,200 yr) is ${histTxt} wide; **${inLast} of ${MILESTONES.length}** events share the last pixel. · **Log**: every factor of 10 gets ${v.fmt(dec, 3)} px, and recorded history takes ${v.fix(histLog, 0)}% of the axis.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'The cosmic calendar',
      statement: String.raw`Map the age of the universe $T$ linearly onto one calendar year, with the Big Bang at midnight on 1 January and the present at midnight ending 31 December. An event $a$ years ago then falls at the fraction $1 - a/T$ of the year. With $T = 13.8$ billion years one cosmic day is $T/365 \approx 37.8$ million years and one cosmic second is $T/(365\times 86\,400) \approx 437$ years: the Sun forms in early September, the dinosaurs die on 30 December, our species appears about 11 minutes before midnight, and all of recorded history fits in the last 12 seconds.`,
      idea: String.raw`The calendar is the linear axis of 1.1 relabelled in familiar units, so it keeps the linear axis's honesty about durations while borrowing our intuition for how long a day or a second is. Because the map is linear, every date moves when $T$ changes: Carl Sagan's 1977 version assumed $T = 15$ billion years, which put writing about 11 seconds before midnight rather than 12. Zooming from the year to December to the last day to the last minute shows the same compression that a log axis shows in a single picture.`,
      caption: String.raw`Five nested zooms: the whole year, December, 31 December, the last minute and the last second; the shaded wedges show which part of each bar is magnified below. **Drag** along any bar to move the red cursor and read its date, time and real age. Switch the assumed age of the universe and watch every date shift.`,
      deps: ['bighist-1.1'],
      refs: ['Christian'],
      credit: 'Sagan, 1977',
      tags: ['deep time', 'scales'],
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 5], height: 540, axes: false, full: true });
        const age = v.select('age of the universe', [{ value: 13.79e9, label: '13.8 Gyr (Planck 2018)' }, { value: 15e9, label: '15 Gyr (Sagan 1977)' }], 13.79e9);
        const YEAR = 365 * 86400, DAY = 86400;
        const MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const pad2 = (n) => String(n).padStart(2, '0');
        const monthTicks = () => { const out = []; let d = 0; for (let m = 0; m < 12; m++) { out.push([d * DAY, null]); out.push([(d + MD[m] / 2) * DAY, MN[m], true]); d += MD[m]; } out.push([YEAR, null]); return out; };
        const BARS = [
          { name: 'the cosmic year', zoom: '1 day ≈ 37.8 Myr', a: 0, ticks: monthTicks },
          { name: 'December', zoom: '×12', a: 334 * DAY, ticks: () => [1, 5, 10, 15, 20, 25, 30].map((d) => [(333 + d) * DAY, `Dec ${d}`]).concat([[YEAR, '']]) },
          { name: '31 December', zoom: '×31', a: 364 * DAY, ticks: () => [0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => [364 * DAY + h * 3600, `${pad2(h)}:00`]) },
          { name: 'the last minute', zoom: '×1,440', a: YEAR - 60, ticks: () => [0, 10, 20, 30, 40, 50, 60].map((q) => [YEAR - 60 + q, q === 60 ? 'midnight' : `23:59:${pad2(q)}`]) },
          { name: 'the last second', zoom: '×60', a: YEAR - 1, ticks: () => [0, 0.2, 0.4, 0.6, 0.8, 1].map((q) => [YEAR - 1 + q, q === 1 ? 'midnight' : `:59.${Math.round(q * 10)}`]) },
        ];
        const X0 = 0.175, X1 = 0.985;
        const barY = (k) => 4 - k + 0.3;                     // bar centre (data units)
        const xOf = (k, tau) => X0 + (X1 - X0) * (tau - BARS[k].a) / (YEAR - BARS[k].a);
        let cursorAgo = 5225;                                  // anchored to a real age; default: writing
        const tauOf = (ago) => YEAR * (1 - ago / age.value);
        s.onDrag((x, y) => {
          const k = Math.max(0, Math.min(4, Math.floor(5 - y)));
          const f = Math.max(0, Math.min(1, (x - X0) / (X1 - X0))), tau = BARS[k].a + f * (YEAR - BARS[k].a);
          cursorAgo = Math.max(0, age.value * (1 - tau / YEAR));
        });
        function calDate(tau) {
          let day = tau / DAY, m = 0; while (m < 11 && day >= MD[m]) { day -= MD[m]; m++; }
          const sec = (day - Math.floor(day)) * DAY, hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = sec % 60;
          const last = tau >= YEAR - 60;
          return `${MN[m]} ${Math.floor(day) + 1}, ${pad2(hh)}:${pad2(mm)}${last ? ':' + (ss < 10 ? '0' : '') + ss.toFixed(ss > 59.9 || tau >= YEAR - 1 ? 2 : 1) : ''}`;
        }
        v.render(() => {
          const T = age.value, W = s.width;
          const ev = MILESTONES.map(([label, ago, p]) => ({ label, ago, p, tau: tauOf(ago) }));
          // zoom wedges first (behind everything)
          for (let k = 0; k < 4; k++) {
            const xa = xOf(k, BARS[k + 1].a), yb = barY(k) - 0.05, yt = barY(k + 1) + 0.05;
            s.poly([[xa, yb], [X1, yb], [X1, yt], [X0, yt]], { fill: 'accent', fillAlpha: 0.06, stroke: false });
            s.line(xa, yb, X0, yt, { color: 'accent', alpha: 0.35, width: 1, dash: [4, 4] });
            s.line(X1, yb, X1, yt, { color: 'accent', alpha: 0.35, width: 1, dash: [4, 4] });
          }
          for (let k = 0; k < 5; k++) {
            const B = BARS[k], y = barY(k), next = k < 4 ? BARS[k + 1].a : Infinity;
            // bar and its zoomed part
            s.rect(X0, y - 0.05, X1, y + 0.05, { fill: 'gray', fillAlpha: 0.16, color: 'muted', width: 1, radius: 3 });
            if (k < 4) s.rect(xOf(k, next), y - 0.05, X1, y + 0.05, { fill: 'accent', fillAlpha: 0.22, stroke: false });
            // title and zoom factor (left)
            s.text(B.name, X0 - 0.012, y + 0.06, { align: 'right', size: 12.5, weight: 650, color: 'ink' });
            s.text(k === 0 ? `1 day ≈ ${yrShort(T / 365, 3)}` : B.zoom, X0 - 0.012, y - 0.11, { align: 'right', size: 11, color: 'muted' });
            // ticks
            for (const [tau, lab, mid] of B.ticks()) {
              const x = xOf(k, tau);
              if (!mid) s.line(x, y - 0.05, x, y - 0.1, { color: 'muted', width: 1 });
              if (lab) s.text(lab, x, y - 0.16, { align: Math.abs(x - X0) < 1e-6 ? 'left' : Math.abs(x - X1) < 1e-6 ? 'right' : 'center', size: 10.5, color: 'muted', halo: false });
            }
            // events: own ones get labels, later ones are faint dots
            const own = ev.filter((e) => e.tau >= B.a && e.tau < next);
            for (const e of ev) if (e.tau >= next) s.dot(xOf(k, e.tau), y, { r: 2, color: 'blue', alpha: 0.35, ring: false });
            const boxes = own.map((e) => { const px = s.X(xOf(k, e.tau)), w = textW(s, e.label, 11.5, e.p ? 650 : 500); const right = px + 6 + w > s.X(X1) + 12; return { e, px, w, right, x0: right ? px - w - 6 : px - 2, x1: right ? px + 2 : px + w + 6, priority: e.p }; });
            const lane = v.timelines('lanes', boxes, 4, 5);
            boxes.forEach((b, i) => {
              const L = lane[i] < 0 ? 3 : lane[i], ly = y + 0.2 + 0.16 * L, x = xOf(k, b.e.tau);
              s.line(x, y + 0.05, x, ly - 0.04, { color: b.e.p ? 'accent' : 'blue', alpha: 0.45, width: 1 });
              s.text(b.e.label, x, ly, { align: b.right ? 'right' : 'left', dx: b.right ? -4 : 4, size: 11.5, weight: b.e.p ? 650 : 500, color: 'ink' });
            });
            for (const b of boxes) s.dot(xOf(k, b.e.tau), y, { r: b.e.p ? 4.5 : 3.6, color: b.e.p ? 'accent' : 'blue' });
          }
          // cursor on every bar that contains it
          const tc = tauOf(cursorAgo);
          for (let k = 0; k < 5; k++) if (tc >= BARS[k].a) {
            const x = xOf(k, tc), y = barY(k);
            s.line(x, y - 0.09, x, y + 0.09, { color: 'red', width: 2.2 });
            s.poly([[x, y + 0.09], [x - 0.006, y + 0.15], [x + 0.006, y + 0.15]], { fill: 'red', fillAlpha: 1, stroke: false });
          }
          void W; void T;
        });
        v.readout(() => {
          const T = age.value, sec = T / YEAR, tc = tauOf(cursorAgo);
          const near = MILESTONES.reduce((b, m) => (Math.abs(Math.log((m[1] + 1) / (cursorAgo + 1))) < Math.abs(Math.log((b[1] + 1) / (cursorAgo + 1))) ? m : b));
          const nearTxt = Math.abs(Math.log((near[1] + 1) / (cursorAgo + 1))) < 0.05 ? ` (${near[0]})` : '';
          return `cursor **${calDate(tc)}** = ${yrs(cursorAgo)} ago${nearTxt} · 1 cosmic day = ${yrShort(T / 365)} · 1 cosmic second = ${v.fmt(sec, 3)} yr · writing (5,225 yr ago) falls **${v.fix(5225 / sec, 1)} s** before midnight`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Method',
      name: 'Radiometric dating',
      statement: String.raw`A radioactive parent isotope decays to a daughter at a fixed rate $\lambda = \ln 2/t_{1/2}$ that heat, pressure and chemistry do not change measurably. In a mineral that has been a **closed system** since it formed, with no daughter at the start, the parent left is $P = P_0e^{-\lambda t}$ and the daughter made is $D = P_0 - P$, so
$$t = \frac{1}{\lambda}\ln\Bigl(1 + \frac{D}{P}\Bigr).$$
If some daughter was present initially, the **isochron** method recovers it: for minerals that formed together with the same daughter isotope ratio but different parent contents, $(D/S)_{\text{now}} = (D/S)_0 + (P/S)_{\text{now}}(e^{\lambda t} - 1)$, where $S$ is a stable isotope of the daughter element. The points lie on a line whose slope gives $t$ and whose intercept gives the initial ratio. A system is useful for ages from about a hundredth of a half-life to ten half-lives.`,
      idea: String.raw`Each nucleus decays at random with the same probability per unit time, so a large population shrinks exponentially (the decay law, geol-2.1, whose solution uses the exponential of pma-8.6); inverting the exponential turns a measured ratio into an age. Different isotopes cover different spans: ¹⁴C ($t_{1/2} = 5{,}700$ yr) dates the last 50,000 years, uranium and potassium date the Earth's rocks, and slow ⁸⁷Rb ($49.7$ Gyr) dates the oldest rocks and meteorites. The isochron needs no knowledge of the starting daughter, and a cloud of points off the line warns that the system was opened. Radiocarbon is the exception to the daughter rule: ¹⁴N is lost in the air, so the age comes from the known starting ratio instead (calibrated as in geol-2.6).`,
      caption: String.raw`Pick an isotope system and drag the **true age**. Left: 576 simulated atoms, each with its own random lifetime; blue = parent, orange = the daughter that is measured (for ⁴⁰K, grey = the 89% that become ⁴⁰Ca). Middle: the decay curve on a log time axis; the counted parent fraction (dashed) is read back through the curve to an age (green), with the counting error from 576 atoms. Bottom: a Rb–Sr isochron of six minerals at the same true age. Make the rock open (Sr re-mixed by metamorphism halfway through) or give the minerals unequal starting ratios, and the isochron dates the wrong event or scatters.`,
      deps: ['pma-8.6', 'geol-2.1'],
      see: ['geol-2.2', 'geol-2.3', 'geol-2.6'],
      refs: ['Christian App. 1'],
      credit: 'Rutherford & Soddy, 1902–1905; Boltwood, 1907',
      tags: ['dating', 'radioactivity'],
      viz(v) {
        const SYS = {
          c14: { label: '¹⁴C → ¹⁴N', P: '¹⁴C', D: '¹⁴N', half: 5700, br: 1, parentOnly: true, def: 12000 },
          k40: { label: '⁴⁰K → ⁴⁰Ar', P: '⁴⁰K', D: '⁴⁰Ar', half: 1.248e9, br: 0.1072, def: 1.0e8 },
          u235: { label: '²³⁵U → ²⁰⁷Pb', P: '²³⁵U', D: '²⁰⁷Pb', half: 7.04e8, br: 1, def: 1.1e9 },
          u238: { label: '²³⁸U → ²⁰⁶Pb', P: '²³⁸U', D: '²⁰⁶Pb', half: 4.463e9, br: 1, def: 2.7e9 },
          rb87: { label: '⁸⁷Rb → ⁸⁷Sr', P: '⁸⁷Rb', D: '⁸⁷Sr', half: 4.97e10, br: 1, def: 3.5e9 },
        };
        const LRB = LN2 / 4.97e10;
        const sys = v.select('', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'u235', { onChange: (k) => tAge.set(SYS[k].def) });
        const tAge = v.slider('true age', 10, 4.6e9, SYS.u235.def, { log: true, fmt: (x) => yrShort(x, 3) });
        const iso = v.select('isochron rock', [{ value: 'closed', label: 'closed system' }, { value: 'reset', label: 'Sr re-mixed at half the age' }, { value: 'uneq', label: 'unequal initial ⁸⁷Sr/⁸⁶Sr' }], 'closed');
        const A = v.stage({ x: [-0.4, 24.4], y: [-0.4, 24.4], equal: true, axes: false, height: 300, weight: 0.82, title: 'a sample of 576 atoms' });
        const B = v.stage({ x: [10, 1e11], y: [0, 1.08], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1.18, xlabel: 'age (years)', ylabel: 'fraction of parent left' });
        const C = v.stage({ x: [0, 3.3], y: [0.7, 0.9], axes: 'box', gutter: true, height: 270, full: true, xlabel: '⁸⁷Rb/⁸⁶Sr (now)', ylabel: '⁸⁷Sr/⁸⁶Sr (now)', title: 'Rb–Sr isochron of six minerals from one rock' });
        // atoms: exponential lifetimes in units of the mean life, and a branch draw
        const r = v.rng(7), N = 576, life = [], branch = [];
        for (let i = 0; i < N; i++) { life.push(-Math.log(1 - r())); branch.push(r()); }
        // isochron minerals
        const MIN = [['plagioclase', 0.05], ['apatite', 0.32], ['whole rock', 0.78], ['hornblende', 1.35], ['K-feldspar', 2.05], ['biotite', 3.0]];
        const r2 = v.rng(21), dInit = MIN.map(() => r2.uniform(-0.004, 0.004)), noise = MIN.map(() => r2.normal() * 2e-5), SR0 = 0.7040;
        const count = () => {
          const S = SYS[sys.value], lt = (LN2 / S.half) * tAge.value; let P = 0, D = 0, O = 0;
          for (let i = 0; i < N; i++) { if (life[i] > lt) P++; else if (branch[i] < S.br) D++; else O++; }
          return { P, D, O, lt };
        };
        const estimate = () => {
          const S = SYS[sys.value], lam = LN2 / S.half, { P, D } = count();
          if (S.parentOnly) { if (P === 0) return { t: NaN, lo: true }; if (P === N) return { t: NaN, hi: true }; const f = P / N; return { t: -Math.log(f) / lam, sd: Math.sqrt(f * (1 - f) / N) / (f * lam), f }; }
          if (P === 0) return { t: NaN, lo: true }; if (D === 0) return { t: NaN, hi: true };
          const t = Math.log(1 + D / (S.br * P)) / lam;
          // binomial error on the parent fraction, propagated through t(f) = −ln f / λ
          const f = Math.exp(-lam * t); return { t, sd: Math.sqrt(f * (1 - f) / N) / (f * lam), f };
        };
        const isoPts = () => {
          const t = tAge.value, mode = iso.value;
          return MIN.map(([name, x0], i) => {
            const x = x0 * Math.exp(-LRB * t), y0 = SR0 + (mode === 'uneq' ? dInit[i] : 0);
            let y;
            if (mode === 'reset') { const tm = t / 2, mean = SR0 + (MIN.reduce((a, m) => a + m[1], 0) / MIN.length) * (Math.exp(-LRB * tm) - Math.exp(-LRB * t)); y = mean + x * (Math.exp(LRB * tm) - 1); }
            else y = y0 + x * (Math.exp(LRB * t) - 1);
            return { name, x0, x, y: y + noise[i], y0 };
          });
        };
        v.render(() => {
          const S = SYS[sys.value], lam = LN2 / S.half, lt = lam * tAge.value;
          // ---- A: atoms
          for (let i = 0; i < N; i++) {
            const cx = (i % 24) + 0.5, cy = 23.5 - Math.floor(i / 24);
            if (life[i] > lt) A.dot(cx, cy, { r: 4.6, color: 'accent', ring: false });
            else if (branch[i] < S.br) A.dot(cx, cy, { r: 4.6, color: 'orange', ring: false });
            else A.dot(cx, cy, { r: 2.4, color: 'gray', alpha: 0.6, ring: false });
          }
          // ---- B: decay curves
          for (const [k, o] of Object.entries(SYS)) if (k !== sys.value) B.fn((t) => Math.exp(-(LN2 / o.half) * t), { color: 'gray', width: 1.2, alpha: 0.45, n: 300 });
          const lo = Math.max(10, 0.01 * S.half), hi = Math.min(1e11, 10 * S.half);
          B.vband(lo, hi, { color: 'green', alpha: 0.07 });
          B.text('usable range ≈ 0.01–10 half-lives', Math.sqrt(lo * hi), 1.045, { align: 'center', size: 10.5, color: 'green' });
          B.fn((t) => Math.exp(-lam * t), { color: 'accent', width: 2.6, n: 400 });
          B.fn((t) => S.br * (1 - Math.exp(-lam * t)), { color: 'orange', width: 2, dash: [6, 4], n: 400 });
          B.vline(tAge.value, { color: 'gold', width: 1.6 });
          const c = count(), fP = c.P / N, e = estimate();
          B.line(10, fP, isFinite(e.t) ? e.t : 1e11, fP, { color: 'accent', width: 1.2, dash: [3, 3] });
          if (isFinite(e.t)) { B.line(e.t, fP, e.t, 0, { color: 'green', width: 1.6, dash: [3, 3] }); B.dot(e.t, fP, { r: 5, color: 'green' }); }
          for (const [k, o] of Object.entries(SYS)) { const th = o.half; B.dot(th, 0.5, { r: k === sys.value ? 4 : 2.5, color: k === sys.value ? 'accent' : 'gray', alpha: k === sys.value ? 1 : 0.6, ring: false }); }
          B.text(`t½ = ${yrShort(S.half)}`, S.half, 0.5, { dx: 7, dy: -9, size: 11, color: 'accent', weight: 600 });
          // ---- C: isochron
          const pts = isoPts(), xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), fit = v.M.linreg(xs, ys);
          const yMax = Math.max(...ys, ...pts.map((p) => p.y0)), yMin = Math.min(...ys, ...pts.map((p) => p.y0)), span = Math.max(0.004, yMax - yMin);
          C.setView([0, 3.3], [yMin - span * 0.12, yMax + span * 0.18]);
          C.hline(SR0, { color: 'muted', dash: [5, 4], width: 1 });
          C.text(`initial ⁸⁷Sr/⁸⁶Sr = ${SR0.toFixed(4)}`, 2.55, SR0, { align: 'center', dy: 10, size: 11, color: 'muted' });
          if (iso.value === 'reset') { const tm = tAge.value / 2, yr = SR0 + (MIN.reduce((a, m) => a + m[1], 0) / MIN.length) * (Math.exp(-LRB * tm) - Math.exp(-LRB * tAge.value)); C.hline(yr, { color: 'orange', dash: [5, 4], width: 1.2 }); C.text('Sr re-mixed here at half the age', 2.55, yr, { align: 'center', dy: -9, size: 11, color: 'orange' }); }
          for (const p of pts) { C.arrow(p.x0, p.y0, p.x, p.y, { color: 'faint', width: 1.2, head: 6 }); C.dot(p.x0, p.y0, { r: 3, hollow: true, color: 'muted' }); }
          C.fn((x) => fit.predict(x), { color: 'green', width: 2.2 });
          pts.forEach((p) => C.dot(p.x, p.y, { r: 5, color: 'accent', label: p.name, labelPos: 'se', labelColor: 'ink', math: false, labelSize: 11 }));
          v.legend([['accent', `parent ${S.P}`, { dot: true }], ['orange', `daughter ${S.D}${S.parentOnly ? ' (not measurable)' : ''}`, { dot: true }], ['gold', 'true age'], ['green', 'age read back from the count']]);
        });
        v.readout(() => {
          const S = SYS[sys.value], c = count(), e = estimate();
          let est;
          if (e.lo) est = `all ${S.P} has decayed: only a **minimum** age (> ${yrShort(10 * S.half)}) — choose a slower clock`;
          else if (e.hi) est = `no decays yet: only a **maximum** age — choose a faster clock`;
          else est = `age = **${yrShort(e.t)} ± ${yrShort(e.sd, 2)}** (true ${yrShort(tAge.value)})`;
          const ratio = S.parentOnly ? `${S.P} left: ${c.P}/${N} of the starting amount` : `${S.D}/${S.P} = ${c.D}/${c.P} = ${c.P ? v.fix(c.D / c.P, 3) : '∞'}`;
          const pts = isoPts(), fit = v.M.linreg(pts.map((p) => p.x), pts.map((p) => p.y)), ti = fit.slope > -1 ? Math.log(1 + fit.slope) / LRB : NaN;
          const unresolved = Math.abs(fit.slope) < 3 * fit.seSlope;
          const isoTxt = unresolved ? ` — the slope is lost in the measurement noise (±${v.fix(fit.seSlope, 6)}): too young for Rb–Sr` : iso.value === 'reset' ? ' — this dates the **re-mixing** (half the true age), not the crystallisation' : iso.value === 'uneq' ? ` — scatter about the line, r² = ${v.fix(fit.r2, 4)}` : '';
          return `${S.label}, t½ = ${yrShort(S.half)}: ${ratio} → ${est}. · Isochron: slope ${v.fix(fit.slope, 5)} → age ln(1 + slope)/λ = **${isFinite(ti) ? yrShort(ti) : '—'}**, intercept ${v.fix(fit.intercept, 4)}${isoTxt}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'Tree rings, varves and ice cores',
      statement: String.raw`Some natural archives add one layer per year: a ring of wood under the bark of trees in seasonal climates, a light–dark couplet of sediment (a **varve**) in some lakes, and a layer of snow, with summer and winter chemistry, on ice sheets with enough snowfall. Counting layers gives calendar ages without any decay constant.

- **Dendrochronology** cross-dates timbers by matching their sequences of wide and narrow rings, which a shared climate imprints on every tree in a region. Overlapping timbers chain a chronology back beyond the oldest living tree: in central Europe the Hohenheim oak–pine chronology covers 12,460 years.
- **Varves** extend counting into lake sediments (De Geer's Swedish varve chronology, 1910; Lake Suigetsu, Japan).
- **Ice cores** are counted where snowfall is high (Greenland's GICC05 back to 60,000 years, with an uncertainty of about 1,300 years at 59,400 years). Deeper ice flows and thins, so its layers become too thin to count and ages come from ice-flow models tied to markers. Antarctica's EPICA Dome C core reaches 800,000 years; its trapped air records past CO₂ directly.

Errors accumulate with depth: a missed or doubled layer shifts every older date.`,
      idea: String.raw`Layer counting rests on superposition (geol-1.4): younger layers lie on older ones, one per year. Cross-dating works because ring widths share a regional climate signal. A sliding correlation between a timber and the master chronology peaks sharply at the true overlap and stays near noise level elsewhere, provided the overlap is long; a 20-ring fragment can match many places by chance. Dendrochronologists therefore filter out slow growth trends, demand a $t$-value above about 3.5, and replicate with many trees. Tree rings in turn calibrate radiocarbon (geol-2.6), and the CO₂ in Antarctic ice runs straight into the instrumental Keeling record (climate-7.10).

For each overlap with nonconstant ring sequences, centre both vectors and divide their inner product by the product of their norms. Cauchy–Schwarz (ladr-6.14) bounds this Pearson correlation between −1 and 1; equality means proportional centred patterns. A high correlation alone does not establish a unique date: searching many lags, autocorrelation and shared trends still require the replication and filtering described above.`,
      caption: String.raw`**Tree rings:** the ring-width series are real (bristlecone pine chronology CA533, California) with simulated tree-to-tree noise. Drag timbers **A** and **B** sideways: the lower panel scores every possible placement by the $t$-value of the correlation with the chronology built so far. A can be dated against the living trees; B overlaps only A, so date A first. Shorten B to 20 rings and watch false peaks beat the true one. **Ice core:** drag the cursor down the EPICA Dome C core: 10,000-year bands shrink from about 300 m near the top to under 15 m at the bottom, and the CO₂ and temperature records (2,000-year means) move together.`,
      deps: ['geol-1.4', 'ladr-6.14'],
      see: ['geol-2.6', 'climate-7.10', 'climate-8.6'],
      refs: ['Christian App. 1'],
      credit: 'Douglass, 1929 (tree rings); De Geer, 1910 (varves)',
      tags: ['dating', 'climate records'],
      viz(v) {
        const mode = v.select('', [{ value: 'tree', label: 'tree rings: cross-dating' }, { value: 'ice', label: 'ice core: layers and the 800,000-year record' }], 'tree', { onChange: () => vis() });
        // ---------------- tree rings
        const Y0 = 1690, Y1 = 1990;
        const T1 = v.stage({ x: [Y0, Y1], y: [0, 3.2], axes: false, height: 262, full: true, title: 'ring-width series on a calendar axis' });
        const T2 = v.stage({ x: [Y0, Y1], y: [-3, 14], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'calendar year of the timber’s outermost ring', ylabel: 't-value' });
        const lenB = v.slider('rings in timber B', 15, 141, 141, { int: true });
        const SIG = 0.15, SEED = 4;
        const sample = (y0, y1, seed) => { const r = v.rng(seed), out = []; for (let y = y0; y <= y1; y++) out.push((RING[y - RING_Y0] / 1000) * Math.exp(SIG * r.normal())); return out; };
        const series = {
          M: { name: 'living trees', y0: 1870, data: sample(1870, 1983, 10 + SEED), color: 'green', row: 2.55 },
          A: { name: 'timber A (barn beam)', true0: 1770, data: sample(1770, 1940, 20 + SEED), color: 'accent', row: 1.6 },
          B: { name: 'timber B (church roof)', true0: 1700, full: sample(1700, 1840, 30 + SEED), color: 'purple', row: 0.65 },
        };
        let posA = 1905, posB = 1975;                        // current outermost-ring years (A: true 1940, B: true 1840)
        const lenA = series.A.data.length;
        const bData = () => series.B.full.slice(series.B.full.length - lenB.value);
        // Baillie–Pilcher high-pass: ln(100 x_i / centred 5-yr mean)
        const bp = (x) => x.map((val, i) => (i < 2 || i > x.length - 3 ? null : Math.log((100 * val) / ((x[i - 2] + x[i - 1] + val + x[i + 1] + x[i + 2]) / 5))));
        const placed = () => [
          { y0: 1870, d: series.M.data, f: bp(series.M.data) },
          { y0: posA - lenA + 1, d: series.A.data, f: bp(series.A.data), key: 'A' },
          { y0: posB - bData().length + 1, d: bData(), f: bp(bData()), key: 'B' },
        ];
        /** t-value of series `f` (first ring year y0) against the mean of the other placed series. */
        function tval(f, y0, others) {
          const xs = [], ys = [];
          for (let k = 0; k < f.length; k++) {
            if (f[k] == null) continue; const yr = y0 + k; let s = 0, n = 0;
            for (const o of others) { const j = yr - o.y0; if (j >= 0 && j < o.f.length && o.f[j] != null) { s += o.f[j]; n++; } }
            if (n) { xs.push(f[k]); ys.push(s / n); }
          }
          if (xs.length < 12) return null;
          const rr = pearson(xs, ys); return { t: (rr * Math.sqrt(xs.length - 2)) / Math.sqrt(Math.max(1e-9, 1 - rr * rr)), n: xs.length, r: rr };
        }
        /** t-values of timber `me` at every possible end year against the reference set `ref`. */
        function scanAgainst(me, ref) {
          const out = [];
          for (let end = Y0 + 12; end <= Y1 - 2; end++) { const res = tval(me.f, end - me.d.length + 1, ref); out.push([end, res ? res.t : null, res]); }
          return out;
        }
        /** Build the chronology as a dendrochronologist would: a timber joins the master only when its current placement
         *  is significant (t >= 3.5) and the best of all placements against what is already dated. */
        function chron() {
          const P = placed(), M = [P[0]], acc = { A: false, B: false };
          for (let pass = 0; pass < 2; pass++) for (const k of ['A', 'B']) {
            if (acc[k]) continue;
            const me = P.find((p) => p.key === k), cur = tval(me.f, me.y0, M); if (!cur) continue;
            const best = Math.max(...scanAgainst(me, M).map((q) => q[1] ?? -Infinity));
            if (cur.t >= 3.5 && cur.t >= best - 1e-9) { acc[k] = true; M.push(me); }
          }
          return { P, M, acc };
        }
        function scan(key) { const { P, M } = chron(), me = P.find((p) => p.key === key); return scanAgainst(me, M.filter((p) => p !== me)); }
        let drag = null;
        T1.onDrag((x, y, phase) => {
          if (phase === 'start') { drag = Math.abs(y - series.A.row) < 0.45 ? { k: 'A', off: posA - x } : Math.abs(y - series.B.row) < 0.45 ? { k: 'B', off: posB - x } : null; }
          if (!drag) return;
          const p = Math.round(x + drag.off);
          if (drag.k === 'A') posA = Math.max(Y0 + lenA - 1 - 40, Math.min(Y1 + 40, p)); else posB = Math.max(Y0 + 10, Math.min(Y1 + 40, p));
          if (phase === 'end') drag = null;
        });
        const btnFit = v.button('cross-date (best placements)', () => {
          for (const k of ['A', 'B']) { const sc = scan(k).filter((q) => q[1] != null); const best = sc.reduce((b, q) => (q[1] > b[1] ? q : b)); if (k === 'A') posA = best[0]; else posB = best[0]; }
        });
        const btnScr = v.button('scramble', () => { posA = 1905; posB = 1975; });
        function drawSeries(s, d, y0, row, color, label) {
          const h = 0.6;
          s.rect(y0 - 0.5, row - 0.04, y0 + d.length - 0.5, row + h + 0.04, { fill: color, fillAlpha: 0.07, color, alpha: 0.5, width: 1, radius: 3 });
          for (let k = 0; k < d.length; k++) { const val = Math.min(2, d[k]) / 2; s.rect(y0 + k - 0.42, row, y0 + k + 0.42, row + h * val, { fill: color, fillAlpha: 0.85, stroke: false }); }
          s.text(label, y0 - 1.5, row + h * 0.55, { align: 'right', size: 11.5, weight: 600, color });
        }
        // ---------------- ice core
        const I1 = v.stage({ x: [0, 1], y: [-3260, 40], axes: false, height: 400, weight: 0.5, minWidth: 200, title: 'Dome C core, 10-kyr bands' });
        const I2 = v.stage({ x: [-872, 10], y: [-0.13, 2.02], axes: false, height: 400, weight: 1.5, title: 'CO₂ in trapped air and Antarctic temperature' });
        const depthOf = (age) => interp(DEPTH, age, 1, 0), ageOf = (z) => interp(DEPTH, z, 0, 1);
        const hz = I1.handle(0.5, -1500, { color: 'red', constrain: (x, y) => [0.5, Math.max(-3189, Math.min(0, y))] });
        const ha = I2.handle(-ageOf(1500) / 1000, 1.0, { color: 'red', constrain: (x) => [Math.max(-801, Math.min(0, x)), 1.0] });
        hz.onDrag = () => { ha.x = -ageOf(-hz.y) / 1000; };
        ha.onDrag = () => { hz.y = -depthOf(-ha.x * 1000); };
        const yCO2 = (c) => 1.06 + (0.92 * (c - 160)) / (440 - 160), yT = (t) => 0.06 + (0.86 * (t + 11)) / 16;
        function vis() {
          const tree = mode.value === 'tree';
          T1.el.hidden = T2.el.hidden = !tree; lenB.el.hidden = !tree;
          I1.el.hidden = I2.el.hidden = tree;
          btnFit.hidden = btnScr.hidden = !tree;
        }
        v.render(() => {
          if (mode.value === 'tree') {
            const { P, M, acc } = chron();
            for (let yr = 1700; yr <= 1980; yr += 20) { T1.line(yr, 0.25, yr, 3.05, { color: 'grid', width: 1 }); T1.text(String(yr), yr, 0.12, { align: 'center', size: 10.5, color: 'muted', halo: false }); }
            drawSeries(T1, series.M.data, 1870, series.M.row, 'green', 'living trees');
            drawSeries(T1, P[1].d, P[1].y0, series.A.row, 'accent', 'A');
            drawSeries(T1, P[2].d, P[2].y0, series.B.row, 'purple', 'B');
            const tA = tval(P[1].f, P[1].y0, M.filter((p) => p !== P[1])), tB = tval(P[2].f, P[2].y0, M.filter((p) => p !== P[2]));
            const okA = acc.A, okB = acc.B;
            T1.text(`A ends ${posA}${tA ? ` · t = ${v.fix(tA.t, 1)} (n = ${tA.n})` : ' · no overlap'}${okA ? ' ✓' : ''}`, Math.min(Y1 - 2, posA + 2), series.A.row + 0.75, { align: posA > 1900 ? 'right' : 'left', size: 11, color: okA ? 'green' : 'accent', weight: 600 });
            T1.text(`B ends ${posB}${tB ? ` · t = ${v.fix(tB.t, 1)} (n = ${tB.n})` : ' · no overlap'}${okB ? ' ✓' : ''}`, Math.min(Y1 - 2, posB + 2), series.B.row + 0.75, { align: posB > 1900 ? 'right' : 'left', size: 11, color: okB ? 'green' : 'purple', weight: 600 });
            // t-value scans
            T2.hband(-3, 3.5, { color: 'gray', alpha: 0.08 });
            T2.hline(3.5, { color: 'red', dash: [5, 4], width: 1.2 });
            T2.text('t = 3.5', Y0 + 2, 3.5, { dy: -8, size: 11, color: 'red' });
            for (const [k, col, pos] of [['A', 'accent', posA], ['B', 'purple', posB]]) {
              const sc = scan(k); T2.path(sc.map(([e, t]) => (t == null ? null : [e, t])), { color: col, width: 1.6 });
              const cur = sc.find((q) => q[0] === pos); if (cur && cur[1] != null) T2.dot(pos, cur[1], { r: 5, color: col });
            }
            T2.vline(1940, { color: 'accent', alpha: 0.35, dash: [2, 4], width: 1 }); T2.vline(1840, { color: 'purple', alpha: 0.35, dash: [2, 4], width: 1 });
            v.legend([['green', 'living-tree chronology (fixed)'], ['accent', 'timber A'], ['purple', 'timber B'], ['red', 'significance threshold t = 3.5', { dash: true }]]);
          } else {
            // core column with 10-kyr bands
            for (let a = 0; a < 800000; a += 10000) {
              const z0 = depthOf(a), z1 = depthOf(Math.min(801662, a + 10000)), k = a / 10000;
              const mT = DT.slice(5 * k, 5 * k + 5).reduce((u, w) => u + w, 0) / 5;
              I1.rect(0.28, -z1, 0.72, -z0, { fill: v.diverge(Math.max(-1, Math.min(1, (mT + 4) / 6))), fillAlpha: 0.95, stroke: false });
              I1.line(0.28, -z0, 0.72, -z0, { color: 'panel', width: a % 100000 === 0 ? 1.6 : 0.6, alpha: 0.9 });
              if (a % 100000 === 0) { I1.line(0.72, -z0, 0.8, -z0, { color: 'muted', width: 1 }); I1.text(`${a / 1000} ka`, 0.82, -z0, { size: 10.5, color: 'muted' }); }
            }
            I1.rect(0.28, -3189.4, 0.72, 0, { color: 'muted', width: 1 });
            for (const z of [0, 1000, 2000, 3000]) { I1.line(0.2, -z, 0.28, -z, { color: 'muted', width: 1 }); I1.text(`${z} m`, 0.18, -z, { align: 'right', size: 10.5, color: 'muted' }); }
            I1.line(0.22, hz.y, 0.78, hz.y, { color: 'red', width: 1.5 });
            // records
            const xs = CO2.map((_, k) => -(2 * k + 1));
            for (const c of [180, 220, 260, 300, 340, 380, 420]) { I2.line(-800, yCO2(c), 0, yCO2(c), { color: 'grid', width: 1 }); I2.text(`${c}`, -808, yCO2(c), { align: 'right', size: 10, color: 'muted', halo: false }); }
            for (const t of [-10, -5, 0, 5]) { I2.line(-800, yT(t), 0, yT(t), { color: 'grid', width: 1 }); I2.text(`${t > 0 ? '+' : ''}${t}°`, -808, yT(t), { align: 'right', size: 10, color: 'muted', halo: false }); }
            for (let a = 0; a <= 800; a += 100) I2.text(a === 800 ? '800 ka' : `${a}`, -a, -0.03, { align: 'center', baseline: 'top', size: 10, color: 'muted', halo: false });
            I2.path(xs.map((x, k) => [x, yCO2(CO2[k])]), { color: 'orange', width: 1.8 });
            I2.path(xs.map((x, k) => [x, yT(DT[k])]), { color: 'blue', width: 1.6 });
            I2.text('CO₂ (ppm)', -795, 1.96, { size: 11.5, weight: 650, color: 'orange' });
            I2.text('temperature vs last 1,000 yr (°C)', -795, 0.97, { size: 11.5, weight: 650, color: 'blue' });
            I2.hline(yCO2(300), { color: 'orange', dash: [3, 4], width: 1, alpha: 0.6 });
            I2.dot(0, yCO2(424.61), { r: 5, color: 'red', label: '2024: 425 ppm', labelPos: 'sw', labelColor: 'red', math: false });
            I2.text('pre-1750 maximum ≈ 300 ppm', -400, yCO2(300), { align: 'center', dy: -8, size: 10.5, color: 'orange' });
            I2.line(ha.x, 0.02, ha.x, 1.98, { color: 'red', width: 1.3, dash: [4, 3] });
            v.legend([['orange', 'Antarctic CO₂ (Bereiter et al. 2015)'], ['blue', 'EPICA Dome C temperature (Jouzel et al. 2007)'], ['red', 'cursor; Mauna Loa 2024', { dot: true }], ['red', 'core bands: warm', { area: true }], ['blue', 'cold', { area: true }]]);
          }
        });
        v.readout(() => {
          if (mode.value === 'tree') {
            const { P, acc } = chron(), oldest = Math.min(1870, ...['A', 'B'].filter((k) => acc[k]).map((k) => P.find((p) => p.key === k).y0));
            const wrong = ['A', 'B'].filter((k) => acc[k] && (k === 'A' ? posA !== 1940 : posB !== 1840));
            const state = wrong.length ? ` — but timber ${wrong.join(' and ')} was accepted at a **false match** (its true outermost ring is ${wrong[0] === 'A' ? 1940 : 1840}): short or noisy series can pass the test by chance.` : acc.A && acc.B ? ' — the timbers bridge the gap back to 1700, as Douglass bridged his with beam HH-39 in 1929.' : acc.A ? ' — A is dated; now date B against it.' : ' — date A first: only it overlaps the living trees.';
            return `Accepted chronology: **${oldest}–1983** (${1983 - oldest + 1} years)${state} A timber is accepted when its placement is the best one and t ≥ 3.5. B has ${lenB.value} rings${lenB.value < 40 ? ': a short fragment, so chance alignments compete with the true one.' : '.'}`;
          }
          const z = -hz.y, a = ageOf(z), dz = 20, layer = (2 * dz) / Math.max(1, ageOf(Math.min(3189, z + dz)) - ageOf(Math.max(0, z - dz)));
          const k = Math.min(399, Math.max(0, Math.floor(a / 2000)));
          return `depth **${v.fix(z, 0)} m** ↔ age **${yrShort(Math.max(0, a))}** (EDC3) · one year here ≈ **${layer >= 0.001 ? v.fix(layer * 1000, 1) + ' mm' : v.fix(layer * 1e6, 0) + ' µm'}** of ice (Dome C gets only a few cm of snow a year, too little and too wind-blown for countable layers; Greenland's GICC05 is counted to 60 ka) · CO₂ ${CO2[k]} ppm, ΔT ${v.fix(DT[k], 1)} °C · over 800 kyr r(CO₂, T) = ${v.fix(pearson(CO2, DT), 2)}; the highest value before 1750 is ${Math.max(...CO2)} ppm, against 425 ppm in 2024.`;
        });
        vis();
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Thresholds of increasing complexity (contested)',
      statement: String.raw`David Christian's framework, adopted by the Big History Project, tells the history of everything as eight **thresholds**, moments when new and more complex kinds of thing appeared:
(1) the Big Bang, (2) the first stars, (3) new chemical elements forged in dying stars, (4) the Sun, Earth and Solar System, (5) life, (6) humans and collective learning, (7) agriculture and (8) the modern, fossil-fuelled world. *Origin Story* (2018) recast threshold 8 as the Anthropocene and added a possible ninth, a sustainable world order.

**This framing is contested.** Fred Spier (2022) argues that the thresholds have no stated criteria. Thresholds 1–3 apply to the whole universe while 4–8 concern one planet. Thresholds 6–8, and the hoped-for ninth, all fall within human history, which is about 0.05% of the timeline. Equally important transitions, such as plate tectonics, photosynthesis, complex cells, life on land, fire and states, are left out, and the decline of complexity is ignored.`,
      idea: String.raw`Plotted on the log axis of 1.1, the thresholds seem to crowd towards the present, which suggests an accelerating rise of complexity. Two things make this hard to judge. A log axis crowds *any* recent events together, and the choice of which transitions count is made by the storyteller. The gaps between successive thresholds do not in fact shrink steadily: the 9-billion-year wait between the first heavy elements and the Solar System is the longest of all. Treated as a teaching device, the thresholds give a memorable narrative arc; treated as a finding, they need criteria that would let someone else draw up the same list.`,
      caption: String.raw`Choose Christian's 2011 list or the 2018 version, or **click** any event on the axis to add it to the list or remove it (faint dots are transitions Spier says could equally count). Arcs join consecutive thresholds, and the lower chart shows the gaps between them on a log scale: green where a gap is shorter than the one before, red where it is longer. The readout tests the "ever-shrinking gaps" story and counts how many thresholds fall in the last 0.05% of time.`,
      deps: ['bighist-1.1'],
      refs: ['Christian'],
      credit: 'Christian, 2004–2011; critique: Spier, 2022',
      tags: ['periodisation', 'complexity'],
      viz(v) {
        const TH = [
          ['bb', 'Big Bang', 13.79e9], ['stars', 'first stars', 13.6e9], ['elements', 'new elements', 13.59e9], ['solar', 'Solar System', 4.567e9],
          ['life', 'life', 3.8e9], ['humans', 'Homo sapiens', 3.0e5], ['agri', 'agriculture', 1.15e4], ['modern', 'modern revolution', 225], ['anthro', 'Anthropocene', 75],
        ];
        const CAND = [
          ['plates', 'plate tectonics?', 3.2e9], ['photo', 'photosynthesis', 3.4e9], ['euk', 'complex cells', 1.6e9], ['cambrian', 'complex animals', 5.388e8],
          ['land', 'life on land', 4.7e8], ['tools', 'stone tools', 3.3e6], ['fire', 'controlled fire', 1.0e6], ['states', 'first states', 5100],
          ['columbus', 'Columbian exchange', 533], ['internet', 'internet', 35],
        ];
        const SCHEMES = { bhp: ['bb', 'stars', 'elements', 'solar', 'life', 'humans', 'agri', 'modern'], os: ['bb', 'stars', 'elements', 'solar', 'life', 'humans', 'agri', 'anthro'] };
        let chosen = new Set(SCHEMES.bhp);
        const scheme = v.select('thresholds', [{ value: 'bhp', label: 'Christian / BHP (2011)' }, { value: 'os', label: 'Origin Story (2018)' }, { value: 'custom', label: 'your own list' }], 'bhp', { onChange: (k) => { if (SCHEMES[k]) chosen = new Set(SCHEMES[k]); } });
        const all = [...TH.map(([id, label, ago]) => ({ id, label, ago, th: true })), ...CAND.map(([id, label, ago]) => ({ id, label, ago, th: false }))];
        const s = v.stage({ height: 300, full: true });
        const g = v.stage({ x: [0.3, 9.7], y: [1, 3e11], ylog: true, axes: 'box', gutter: true, height: 230, xticks: [], full: true, ylabel: 'gap to the next threshold (years)', title: 'gaps between consecutive thresholds' });
        const T = v.timeline(s, { scale: 'log', range: ['13.79 Ga', '10 yr ago'], minAgo: 10, zoom: false, fontSize: 11.5, laneHeight: 16, linkBand: 46, events: [] });
        T.onSelect = (e) => {
          if (e && e.id != null && all.some((q) => q.id === e.id)) { if (chosen.has(e.id)) chosen.delete(e.id); else chosen.add(e.id); scheme.set('custom'); }
          T.selected = null;
        };
        const seq = () => all.filter((e) => chosen.has(e.id)).sort((a, b) => b.ago - a.ago);
        v.render(() => {
          const S = seq();
          T.set({
            events: all.map((e) => ({ id: e.id, label: chosen.has(e.id) ? `${S.indexOf(e) + 1} ${e.label}` : e.label, t: { ago: e.ago }, priority: chosen.has(e.id) ? 1 : 0, color: chosen.has(e.id) ? 'accent' : 'faint' })),
            links: S.slice(1).map((e, i) => [S[i].id, e.id]),
            spans: [{ from: PRESENT - 7e6, to: PRESENT, label: 'human history (last 7 Myr = 0.05%)', color: 'orange', track: 0 }],
          });
          T.draw();
          // gap bars
          const gaps = S.slice(1).map((e, i) => S[i].ago - e.ago);
          g.setView([0.3, Math.max(4, gaps.length) + 0.7], [1, 3e11]);
          gaps.forEach((gp, i) => {
            const shorter = i === 0 || gp < gaps[i - 1], col = i === 0 ? 'accent' : shorter ? 'green' : 'red';
            g.rect(i + 1 - 0.36, 1, i + 1 + 0.36, Math.max(1.01, gp), { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            g.text(yrShort(gp, 2), i + 1, Math.max(1.01, gp), { align: 'center', baseline: 'bottom', dy: -3, size: 10.5, color: 'ink' });
            g.text(`${i + 1}→${i + 2}`, i + 1, 1, { align: 'center', baseline: 'bottom', dy: -3, size: 10.5, color: 'panel', halo: false, weight: 600 });
          });
          v.legend([['accent', 'threshold in the list', { dot: true }], ['faint', 'candidate transition (click to add)', { dot: true }], ['green', 'gap shorter than the previous one', { area: true }], ['red', 'gap longer than the previous one', { area: true }]]);
        });
        v.readout(() => {
          const S = seq(), gaps = S.slice(1).map((e, i) => S[i].ago - e.ago);
          const down = gaps.slice(1).filter((gp, i) => gp < gaps[i]).length, human = S.filter((e) => e.ago <= 7e6).length;
          const longest = gaps.length ? gaps.indexOf(Math.max(...gaps)) : -1;
          return `**${S.length}** thresholds · gaps shrink at **${down} of ${Math.max(0, gaps.length - 1)}** steps${gaps.length > 1 && down === gaps.length - 1 ? ' (a steady acceleration)' : ' — not a steady acceleration'}${longest >= 0 ? `; longest gap ${longest + 1}→${longest + 2} (${yrShort(gaps[longest], 2)})` : ''} · **${human} of ${S.length}** fall in human history, the last 0.05% of the timeline.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Energy rate density (Chaisson)',
      statement: String.raw`Eric Chaisson's **energy rate density** is the power that flows through a system divided by its mass,
$$\Phi_m = \frac{\text{power}}{\text{mass}} \quad (\text{erg s}^{-1}\,\text{g}^{-1};\ 1\ \text{W/kg} = 10^4\ \text{erg s}^{-1}\,\text{g}^{-1}).$$
He proposes it as a single, physical measure of complexity. His estimates rise by about seven orders of magnitude through cosmic history: galaxies $\approx 0.1$, the Sun $\approx 2$, Earth's climate system $\approx 75$, plants $10^3$–$10^4$, animals $10^4$–$10^5$, the human brain $1.5\times10^5$, and modern society $5\times10^5$ (technologically advanced societies $\approx 2\times10^6$). Each value is a typical figure with a spread of an order of magnitude or more.

**Whether $\Phi_m$ measures complexity is contested.** The ranking depends on what is divided by what (society's power is divided by human body mass alone), outliers abound (birds in flight beat human brains; engines beat both), and simple devices such as a hair dryer score higher still.`,
      idea: String.raw`Ordered structures persist far from equilibrium only by passing energy through themselves and exporting entropy (compare entropy production, thermo-2.12). Chaisson argues that more intricate structures need denser flows, and he normalises by mass so that systems of very different sizes can be compared on one chart. The Sun's luminosity is enormous, but spread over $2\times10^{33}$ g it amounts to only about $2$ erg s⁻¹ g⁻¹, while each gram of a human brain dissipates about $1.5\times10^5$. Critics accept the physics of energy flow but doubt the single number. Changing the denominator from human bodies to everything humans have built drops society by more than three orders of magnitude, below plants.`,
      caption: String.raw`Points are Chaisson's own estimates (2014), placed at the time each kind of system appeared; faint bars show his stated spreads. **Click** a point for its numbers. Switch society's denominator from human bodies to bodies plus the 1.1 trillion tonnes of human-made mass, show or hide machines, and add your own system with the power and mass sliders (the presets include a hair dryer). The readout gives the rank correlation between Φm and time of emergence for the points shown.`,
      deps: ['bighist-1.6'],
      see: ['thermo-2.12'],
      refs: ['Christian'],
      credit: 'Chaisson, 2001–2014',
      tags: ['complexity', 'energy'],
      viz(v) {
        // [label, years ago at emergence, Φm (erg/s/g), category, lo, hi, note]
        const D = [
          ['Milky Way', 1.2e10, 0.1, 'phys', 0.01, 50, 'L ≈ 3×10¹⁰ L☉; 0.3 without dark matter'],
          ['Sun', 4.6e9, 2, 'phys', 1, 1e3, 'L = 3.8×10³³ erg/s, M = 2.0×10³³ g'],
          ['Earth’s climasphere', 4.4e9, 75, 'phys', 10, 75, 'absorbed sunlight ÷ (air + mixed ocean layer)'],
          ['algae (protists)', 5.0e8, 1e3, 'bio', null, null, '“more than 470 Myr ago”'],
          ['fish & amphibians', 4.35e8, 4e3, 'bio', null, null, '370–500 Myr ago'],
          ['gymnosperms', 3.5e8, 5e3, 'bio', null, null, ''],
          ['reptiles', 3.2e8, 3e3, 'bio', null, null, 'cold-blooded'],
          ['mammals', 2.0e8, 4e4, 'bio', 1e4, 1e5, 'three-quarters of mammals lie in 10⁴–10⁵'],
          ['angiosperms', 1.25e8, 7e3, 'bio', null, null, ''],
          ['birds in flight', 1.25e8, 9e4, 'bio', 3e4, 1e6, 'resting ≈ 3×10⁴; murres in flight ≈ 10⁶'],
          ['C4 plants', 3.0e7, 2e4, 'bio', null, null, 'maize, sugarcane'],
          ['human body', 3.0e5, 2e4, 'bio', 1.2e4, 2e4, '130 W ÷ 65 kg'],
          ['human brain', 2.5e5, 1.5e5, 'bio', null, null, '20 W ÷ 1.35 kg'],
          ['foragers with fire', 1.65e5, 4e4, 'cult', null, null, 'food plus fire, per 50-kg body'],
          ['agriculturists', 1.0e4, 1e5, 'cult', null, null, '≈ 12,000 kcal/day per person'],
          ['industrialists', 200, 3e5, 'cult', null, null, '≈ 1.6 kW per person'],
          ['world society', 40, 5e5, 'cult', null, null, '≈ 2.5 kW per person (world average)'],
          ['technologists', 25, 2e6, 'cult', null, null, 'highly developed countries'],
          ['Otto engine', 147, 4e4, 'mach', null, null, '1878'],
          ['Daimler engine', 126, 2.2e5, 'mach', null, null, '1899'],
          ['Wright engine', 122, 1e6, 'mach', null, null, '1903'],
          ['jet airliner', 66, 2.3e7, 'mach', null, null, 'Boeing 707, 1959; 747-400 ≈ 2.7×10⁷'],
        ];
        const CAT = { phys: ['blue', 'physical'], bio: ['green', 'biological'], cult: ['orange', 'cultural'], mach: ['purple', 'machines'] };
        const s = v.stage({ x: [-10.6, -0.6], y: [1e-3, 3e8], ylog: true, axes: 'box', gutter: true, height: 460, full: true, xlabel: 'time of emergence (years ago)', ylabel: 'Φm (erg s⁻¹ g⁻¹)',
          xticks: [[-10, '10 Gyr'], [-9, '1 Gyr'], [-8, '100 Myr'], [-7, '10 Myr'], [-6, '1 Myr'], [-5, '100 kyr'], [-4, '10 kyr'], [-3, '1 kyr'], [-2, '100 yr'], [-1, '10 yr']] });
        const den = v.select('society per', [{ value: 'body', label: 'human body mass (Chaisson)' }, { value: 'built', label: 'bodies + human-made mass' }], 'body');
        const mach = v.toggle('machines', true);
        const preset = v.select('your system', [{ value: 'none', label: 'none' }, { value: 'dryer', label: 'hair dryer' }, { value: 'laptop', label: 'laptop' }, { value: 'horse', label: 'draft horse' }, { value: 'custom', label: 'sliders' }], 'dryer', { onChange: (k) => { const p = PRE[k]; if (p) { pw.set(p[0]); ms.set(p[1]); } } });
        const PRE = { dryer: [1800, 0.6], laptop: [50, 1.8], horse: [745, 800] };
        const pw = v.slider('power (W)', 0.001, 1e9, 1800, { log: true, fmt: (x) => v.M.si(x, 'W', 3), onChange: () => preset.set('custom') });
        const ms = v.slider('mass (kg)', 0.001, 1e6, 0.6, { log: true, fmt: (x) => v.M.si(x * 1000, 'g', 3), onChange: () => preset.set('custom') });
        let sel = 'human brain';
        s.onClick((x, y) => {
          let best = null, bd = 18;
          for (const p of shown()) { const d = Math.hypot(s.X(-Math.log10(p[1])) - s.X(x), s.Y(p[2]) - s.Y(y)); if (d < bd) { bd = d; best = p; } }
          if (best) sel = best[0];
        });
        // human-made mass 1.1e15 kg (2020) plus 8e9 people × 50 kg; world primary power ≈ 620 EJ/yr ≈ 19.6 TW
        const WORLD_P = 620e18 / 3.156e7, BODIES = 8e9 * 50, BUILT = 1.1e15;
        const phiOf = (p) => (p[0] === 'world society' && den.value === 'built' ? (WORLD_P / (BODIES + BUILT)) * 1e4 : p[2]);
        const shown = () => D.filter((p) => mach.value || p[3] !== 'mach').map((p) => [p[0], p[1], phiOf(p), p[3], p[4], p[5], p[6]]);
        const userPhi = () => (pw.value / ms.value) * 1e4;
        v.render(() => {
          const P = shown();
          // category guide bands
          for (const p of P) if (p[4] != null) s.line(-Math.log10(p[1]), p[4], -Math.log10(p[1]), p[5], { color: CAT[p[3]][0], width: 7, alpha: 0.18, cap: 'round' });
          for (const p of P) s.dot(-Math.log10(p[1]), p[2], { r: p[0] === sel ? 6.5 : 4.8, color: CAT[p[3]][0] });
          const lab = P.map((p) => ({ x: -Math.log10(p[1]), y: p[2], text: p[0], r: p[0] === sel ? 6.5 : 4.8, size: p[0] === sel ? 12 : 10.5, weight: p[0] === sel ? 700 : 500, color: p[0] === sel ? CAT[p[3]][0] : 'ink' }));
          if (preset.value !== 'none') lab.push({ x: -0.75, y: userPhi(), text: 'your system', r: 6, size: 11, weight: 650, color: 'gold', prefer: [-1, 0] });
          lab.sort((p, q) => (q.text === sel) - (p.text === sel));
          placeLabels(v, s, lab);
          if (den.value === 'built') { const w = D.find((p) => p[0] === 'world society'); s.arrow(-Math.log10(w[1]), w[2] * 0.7, -Math.log10(w[1]), phiOf(w) * 1.6, { color: 'red', width: 1.6, head: 7 }); }
          if (preset.value !== 'none') s.dot(-0.75, userPhi(), { r: 6, color: 'gold' });
          v.legend([['blue', 'physical', { dot: true }], ['green', 'biological', { dot: true }], ['orange', 'cultural (per person)', { dot: true }], ['purple', 'machines', { dot: true }], ['gold', 'your system', { dot: true }]]);
        });
        v.readout(() => {
          const P = shown(), rho = spearman(P.map((p) => -Math.log10(p[1])), P.map((p) => Math.log10(p[2])));
          const p = P.find((q) => q[0] === sel) || P[0];
          const u = userPhi();
          return `Rank correlation of Φm with time of emergence: **ρ = ${v.fix(rho, 2)}** (${P.length} systems). · **${p[0]}**: Φm ≈ ${sci(p[2])} erg s⁻¹ g⁻¹ = ${sci(p[2] / 1e4)} W/kg${p[6] ? ` (${p[6]})` : ''}.${preset.value !== 'none' ? ` · Your system: ${v.M.si(pw.value, 'W', 3)} ÷ ${v.M.si(ms.value * 1000, 'g', 3)} = **${sci(u)}** erg s⁻¹ g⁻¹${u > 1.5e5 ? ', above the human brain' : ''}.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Hypothesis',
      name: 'Is history accelerating?',
      statement: String.raw`**Hypothesis (contested).** The intervals between major events in cosmic, biological and human history have been shrinking roughly in proportion to how long ago the events happened, so that history is accelerating towards the present. The evidence usually offered is a plot of each milestone's "time to the next event" against its "time before present" on log–log axes, where lists of milestones fall close to a straight line of slope about 1 (Kurzweil's "Countdown to Singularity", 2005, built from 15 lists, 13 of them compiled by Theodore Modis).

The plot cannot settle the question by itself. A list sampled roughly evenly within each factor-of-ten interval can produce a similar trend without any underlying acceleration; equal counts alone do not force exact collinearity or a particular fitted slope. Recent events are better recorded and seem more important to the people compiling the list, so such lists are the norm. Modis himself warned that the lists are neither independent nor checked for quality.`,
      idea: String.raw`For many independently sampled events with density proportional to $t^{-k}$ in time-before-present $t$, a local typical spacing is approximately reciprocal to the event density where that density varies little across a gap and endpoints are negligible. Thus $\Delta t$ has a local scale proportional to $t^k$, suggesting a log–log trend of slope near $k$, not an exact expected finite-sample regression slope. Sampling uniformly in log time has $k=1$ and equal expected counts in equal log intervals; uniform sampling in linear time has $k=0$. Finite lists, boundary gaps and clustering can change the fitted slope. The slope measures the compiler's sampling density as much as the rate of change. A real test needs a measure fixed in advance, such as population growth rates, energy use or the number of species, rather than a list of what seems important (for population, see bighist-6.11).

The random-event generator can be derived on its finite positive interval $[A,B]$. The fundamental theorem (pma-6.21) integrates $t^{-k}$: use $F(t)=(t^{1-k}-A^{1-k})/(B^{1-k}-A^{1-k})$ for $k\ne1$, and $F(t)=\ln(t/A)/\ln(B/A)$ for $k=1$. These strictly increasing CDFs map the endpoints to 0 and 1, so solving $F(t)=u$ for a uniform draw gives the displayed sampler. Separately, the fitted log–log line is the orthogonal projection of the vector $y_i=\log_{10}\Delta t_i$ onto the span of the constant vector and $x_i=\log_{10}t_i$ (ladr-6.61). With at least two distinct $x_i$, this gives the unique least-squares intercept and slope; it does not turn a selected milestone list into an unbiased historical test.`,
      caption: String.raw`The milestone list is the 27 events used throughout this chapter. Fit a line through log(time to next event) against log(time before present) and read its slope. Then switch to random events with sampling density ∝ t⁻ᵏ. For k = 1, equal log intervals have equal expected counts; the local typical-gap heuristic suggests a slope near 1. For k = 0 the density is uniform in linear time, suggesting locally constant gaps. The finite fitted slope can differ in either case. The lower panel shows the realized counts per decade; those counts alone do not determine the fitted slope.`,
      deps: ['bighist-1.1', 'pma-6.21', 'ladr-6.61'],
      see: ['bighist-6.11'],
      refs: ['Christian'],
      credit: 'Kurzweil, 2005; Modis, 2002',
      tags: ['acceleration', 'selection bias'],
      viz(v) {
        const data = v.select('events', [{ value: 'list', label: 'milestone list (27 events)' }, { value: 'rand', label: 'random events' }], 'list', { onChange: () => vis() });
        const kS = v.slider('sampling density $\\propto t^{-k}$, $k$', 0, 1.5, 1, { step: 0.05 });
        const nS = v.slider('number of events', 10, 200, 40, { int: true });
        let seed = 3;
        const rb = v.button('resample', () => { seed++; });
        const vis = () => { kS.el.hidden = nS.el.hidden = rb.hidden = data.value !== 'rand'; };
        const XT = [[-10, '10 Gyr'], [-9, '1 Gyr'], [-8, '100 Myr'], [-7, '10 Myr'], [-6, '1 Myr'], [-5, '100 kyr'], [-4, '10 kyr'], [-3, '1 kyr'], [-2, '100 yr'], [-1, '10 yr']];
        const L = v.stage({ x: [-10.4, -0.8], y: [1, 3e10], ylog: true, axes: 'box', gutter: { l: 52 }, height: 340, full: true, ylabel: 'time to the next event (years)', xticks: XT });
        const R = v.stage({ x: [-10.4, -0.8], y: [0, 10], axes: 'box', gutter: { l: 52 }, height: 150, full: true, xlabel: 'time before present', ylabel: 'events per decade', xticks: XT });
        const A = 10, Bmax = 1.38e10;
        function events() {
          if (data.value === 'list') return MILESTONES.map((m) => ({ t: m[1], label: m[0] }));
          const r = v.rng(seed * 101 + 7), k = kS.value, n = nS.value, out = [];
          for (let i = 0; i < n; i++) {
            const u = r();
            const t = Math.abs(k - 1) < 1e-6 ? A * Math.pow(Bmax / A, u) : Math.pow(Math.pow(A, 1 - k) + u * (Math.pow(Bmax, 1 - k) - Math.pow(A, 1 - k)), 1 / (1 - k));
            out.push({ t });
          }
          return out.sort((a, b) => b.t - a.t);
        }
        const pairs = (E) => E.slice(0, -1).map((e, i) => ({ t: e.t, dt: e.t - E[i + 1].t, label: e.label })).filter((p) => p.dt > 0);
        v.render(() => {
          const E = events(), P = pairs(E), fit = v.M.linreg(P.map((p) => Math.log10(p.t)), P.map((p) => Math.log10(p.dt)));
          // reference slope-1 line through the data mean
          L.fn((x) => Math.pow(10, fit.predict(-x)), { color: 'green', width: 2.2, domain: [-10.2, -1] });
          L.fn((x) => Math.pow(10, -x - 0.6), { color: 'gray', width: 1, dash: [4, 4], domain: [-10.2, -1] });
          for (const p of P) L.dot(-Math.log10(p.t), p.dt, { r: data.value === 'list' ? 4.5 : 3.2, color: data.value === 'list' ? 'accent' : 'gold' });
          if (data.value === 'list') placeLabels(v, L, P.filter((p) => ['Big Bang', 'Cambrian explosion', 'K–Pg extinction', 'Homo sapiens', 'writing', 'steam engine', 'Sun & Earth', 'farming', 'hominins'].includes(p.label)).map((p) => ({ x: -Math.log10(p.t), y: p.dt, text: p.label, size: 10.5 })), { points: P.map((p) => [L.X(-Math.log10(p.t)), L.Y(p.dt), 5]) });
          L.text('slope 1 (Δt ∝ t)', -5.6, Math.pow(10, 5.6 - 0.6), { dy: 16, size: 10.5, color: 'muted' });
          // per-decade histogram
          const cnt = new Array(10).fill(0); for (const e of E) { const d = Math.floor(Math.log10(e.t)); if (d >= 1 && d <= 10) cnt[d - 1]++; }
          const mx = Math.max(...cnt, 1); R.setView([-10.4, -0.8], [0, mx * 1.3]);
          const hc = data.value === 'list' ? 'accent' : 'gold';
          cnt.forEach((c, i) => { const d = i + 1; R.rect(-Math.min(10.14, d + 1), 0, -d, c, { fill: hc, fillAlpha: 0.5, color: hc, width: 1 }); if (c) R.text(String(c), -(d + Math.min(10.14, d + 1)) / 2, c, { align: 'center', baseline: 'bottom', dy: -2, size: 10.5, color: 'ink' }); });
          v.legend([[data.value === 'list' ? 'accent' : 'gold', data.value === 'list' ? 'milestones' : 'random events', { dot: true }], ['green', 'least-squares fit'], ['gray', 'slope 1', { dash: true }]]);
        });
        v.readout(() => {
          const E = events(), P = pairs(E), fit = v.M.linreg(P.map((p) => Math.log10(p.t)), P.map((p) => Math.log10(p.dt)));
          const tail = data.value === 'rand' ? ` · local density exponent $k$: **${v.fix(kS.value, 2)}**` : ' · the same slope as random events sampled evenly per decade (switch to see)';
          return `Fitted log–log slope **${v.fix(fit.slope, 2)} ± ${v.fix(fit.seSlope, 2)}**, R² = ${v.fix(fit.r2, 3)} (${P.length} intervals)${tail}.`;
        });
        vis();
      },
    },
  ],
};
