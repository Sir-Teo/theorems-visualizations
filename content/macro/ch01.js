// Macroeconomics — Chapter 1: Measuring the macroeconomy

// ---------- shared helpers ----------
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sum = (a) => a.reduce((s, x) => s + x, 0);
/** Number with thousands separators and a real minus sign. */
function num(x, d = 0) {
  const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return (x < 0 && Math.abs(x) >= 0.5 * 10 ** -d ? '−' : '') + s;
}
const pctx = (x, d = 1) => `${x < 0 ? '−' : ''}${Math.abs(100 * x).toFixed(d)}%`;
/** Rounded rectangle in data coordinates (st: fill, fillAlpha, color (false = no stroke), width, dash, r). */
function rbox(v, s, x0, y0, x1, y1, st = {}) {
  const c = s.ctx, X0 = s.X(Math.min(x0, x1)), X1 = s.X(Math.max(x0, x1)), Yt = s.Y(Math.max(y0, y1)), Yb = s.Y(Math.min(y0, y1));
  c.save(); c.beginPath();
  if (c.roundRect) c.roundRect(X0, Yt, X1 - X0, Yb - Yt, st.r ?? 9); else c.rect(X0, Yt, X1 - X0, Yb - Yt);
  if (st.fill) { c.fillStyle = v.color(st.fill, st.fillAlpha ?? 0.14); c.fill(); }
  if (st.color !== false) { c.lineWidth = st.width ?? 1.6; c.setLineDash(st.dash || []); c.strokeStyle = v.color(st.color || 'ink', st.alpha ?? 1); c.stroke(); }
  c.restore();
}
/** Diagonal hatching inside a data rectangle. */
function hatch(v, s, x0, y0, x1, y1, color, alpha = 0.85, gap = 6) {
  const c = s.ctx, X0 = s.X(Math.min(x0, x1)), X1 = s.X(Math.max(x0, x1)), Yt = s.Y(Math.max(y0, y1)), Yb = s.Y(Math.min(y0, y1));
  if (X1 - X0 < 0.5 || Yb - Yt < 0.5) return;
  c.save(); c.beginPath(); c.rect(X0, Yt, X1 - X0, Yb - Yt); c.clip();
  c.strokeStyle = v.color(color, alpha); c.lineWidth = 1.3; c.beginPath();
  for (let x = X0 - (Yb - Yt); x < X1; x += gap) { c.moveTo(x, Yb); c.lineTo(x + (Yb - Yt), Yt); }
  c.stroke(); c.restore();
}
/** Spread label positions (pixels) so neighbours are at least `gap` apart inside [lo, hi]; keeps the input order. */
function spread(ys, gap, lo, hi) {
  const idx = ys.map((y, i) => i).sort((a, b) => ys[a] - ys[b]), out = ys.slice();
  let prev = -Infinity; for (const i of idx) { out[i] = Math.max(out[i], prev + gap, lo); prev = out[i]; }
  let next = Infinity; for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k]; out[i] = Math.min(out[i], next - gap, hi); next = out[i]; }
  return out;
}
/** Cubic Bézier sampled as points. */
function bz(p0, p1, p2, p3, n = 40) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}
/** A flow drawn as a band of width w px along pts (data coords), with moving dots (animation time t) and an arrowhead. */
function flowBand(v, s, pts, w, color, t, alpha = 0.3) {
  if (!(w > 0.4)) return;
  const c = s.ctx, P = pts.map(([x, y]) => [s.X(x), s.Y(y)]), L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = L[L.length - 1], hl = Math.min(tot * 0.45, 6 + w * 0.6);
  let k = 1; while (k < P.length - 1 && L[k] < tot - hl) k++;
  const u = (tot - hl - L[k - 1]) / Math.max(1e-9, L[k] - L[k - 1]);
  const E = [P[k - 1][0] + u * (P[k][0] - P[k - 1][0]), P[k - 1][1] + u * (P[k][1] - P[k - 1][1])];
  const body = P.slice(0, k).concat([E]), end = P[P.length - 1];
  c.save(); c.lineJoin = 'round'; c.lineCap = 'butt';
  c.beginPath(); body.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.strokeStyle = v.color(color, alpha); c.lineWidth = w; c.stroke();
  c.setLineDash([0.01, 14]); c.lineCap = 'round'; c.lineDashOffset = -t * 30;
  c.strokeStyle = v.color(color, 0.95); c.lineWidth = clamp(w * 0.32, 2.4, 6.5); c.stroke();
  const dx = end[0] - E[0], dy = end[1] - E[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, hw = w / 2 + 4;
  c.setLineDash([]); c.beginPath(); c.moveTo(end[0], end[1]); c.lineTo(E[0] - uy * hw, E[1] + ux * hw); c.lineTo(E[0] + uy * hw, E[1] - ux * hw); c.closePath();
  c.fillStyle = v.color(color, 0.8); c.fill();
  c.restore();
}
/** Horizontal bar segment [x0, x0 + w] centred at height yc (half-height hh), labelled inside when wide enough. */
function hseg(s, x0, w, yc, hh, color, label, st = {}) {
  if (!(Math.abs(w) > 1e-9)) return;
  const a = Math.min(x0, x0 + w), b = Math.max(x0, x0 + w);
  s.rect(a, yc - hh, b, yc + hh, { fill: color, fillAlpha: st.alpha ?? 0.55, color: 'panel', width: 1.2 });
  if (label && Math.abs(s.X(b) - s.X(a)) > (st.min ?? 34)) s.text(label, (a + b) / 2, yc, { align: 'center', color: 'ink', size: st.size ?? 11.5, weight: 600 });
}

// U.S. expenditure-side GDP from the BEA national accounts (NIPA Table 1.1.5), annual, via FRED series
// PCECA, GPDIA, GCEA, EXPGSA, IMPGSA, GDPA (downloaded Oct 2026).
const BEA = [ // 1929–2025: C, I, G, X, M, GDP (billions of current dollars)
  [77.4,17.2,9.6,5.9,5.6,104.6],[70.1,11.4,10.3,4.4,4.1,92.2],[60.7,6.5,10.2,2.9,2.9,77.4],[48.7,1.8,8.9,2,1.9,59.5],[45.9,2.3,8.9,2,1.9,57.2],[51.5,4.3,10.7,2.6,2.2,66.8],[55.9,7.4,11.2,2.8,3,74.2],[62.2,9.4,13.4,3,3.2,84.8],
  [66.8,13,13.1,4,4,93],[64.3,7.9,14.2,3.8,2.8,87.4],[67.2,10.2,15.2,4,3.1,93.4],[71.3,14.6,15.6,4.9,3.4,102.9],[81.1,19.4,27.8,5.5,4.4,129.3],[89,11.8,65.4,4.4,4.6,166],[99.9,7.4,98,4,6.3,203.1],[108.6,9.2,108.6,4.9,6.9,224.4],
  [120,12.4,96.4,6.8,7.5,228],[144.2,33.1,43,14.2,7,227.5],[161.9,37.1,39.8,18.7,7.9,249.6],[174.9,50.3,43.8,15.5,10.1,274.5],[178.3,39.1,49.8,14.5,9.2,272.5],[192,56.5,50.5,12.3,11.6,299.8],[208.3,62.8,73.3,17.1,14.6,346.9],[219.3,57.3,89.6,16.5,15.3,367.3],
  [232.7,60.4,96.8,15.3,16,389.2],[239.6,58.1,92.5,15.8,15.4,390.5],[258.3,73.8,93,17.7,17.2,425.5],[271.1,77.7,98.2,21.3,18.9,449.4],[286.3,76.5,107.2,24,19.9,474],[295.6,70.9,114.1,20.6,20,481.2],[317.1,85.7,118.5,22.7,22.3,521.7],[331.2,86.5,120.5,27,22.8,542.4],
  [341.5,86.6,129.2,27.6,22.7,562.2],[362.6,97,140.3,29.1,25,603.9],[382,103.3,147.2,31.1,26.1,637.5],[410.6,112.2,154.8,35,28.1,684.5],[443,129.6,164.1,37.1,31.5,742.3],[479.9,144.2,185.4,40.9,37.1,813.4],[506.7,142.7,207,43.5,39.9,860],[556.9,156.9,225.5,47.9,46.6,940.7],
  [603.6,173.6,239,51.9,50.5,1017.6],[646.7,170,252.6,59.7,55.8,1073.3],[699.9,196.8,267.5,63,62.3,1164.8],[768.2,228.1,286.2,70.8,74.2,1279.1],[849.6,266.9,304.8,95.3,91.2,1425.4],[930.2,274.5,341.4,126.7,127.5,1545.2],[1030.5,257.3,381.1,138.7,122.7,1684.9],[1147.7,323.2,404.2,149.5,151.1,1873.4],
  [1274,396.6,434.3,159.3,182.4,2081.8],[1422.3,478.4,476.3,186.9,212.2,2351.6],[1585.4,539.7,524.8,230.1,252.7,2627.3],[1750.7,530.1,589.6,280.8,293.8,2857.3],[1934,631.2,654.4,305.2,317.8,3207],[2071.3,581,711.5,283.2,303.2,3343.8],[2281.6,637.5,766.6,277,328.6,3634],[2492.3,820.1,827.9,302.4,405.1,4037.6],
  [2712.8,829.6,910.5,303.2,417.2,4339],[2886.3,849.1,976.1,321,452.9,4579.6],[3076.3,892.2,1031.5,363.9,508.7,4855.2],[3330,937,1078.9,444.6,554,5236.4],[3576.8,999.7,1151.9,504.3,591,5641.6],[3809,993.4,1238.6,551.9,629.7,5963.1],[3943.4,944.3,1299,594.9,623.5,6158.1],[4197.6,1013,1344.5,633.1,667.8,6520.3],
  [4452,1106.8,1364.9,654.8,720,6858.6],[4721,1256.5,1402.3,720.9,813.4,7287.2],[4962.6,1317.5,1449.4,812.8,902.6,7639.7],[5244.6,1432.1,1492.8,867.6,964,8073.1],[5536.8,1595.6,1547.1,953.8,1055.8,8577.6],[5877.2,1736.7,1611.6,953,1115.7,9062.8],[6283.8,1887.1,1719.9,992.9,1252.5,9631.2],[6767.2,2038.4,1826.4,1096.1,1477.2,10251],
  [7073.8,1934.8,1950,1026.8,1403.6,10581.9],[7348.9,1930.4,2089.5,998,1437.7,10929.1],[7740.7,2027.1,2210.6,1035.2,1557.1,11456.5],[8232,2281.3,2338.1,1176.4,1810.5,12217.2],[8769.1,2534.7,2475.3,1301.6,2041.5,13039.2],[9277.2,2701,2623.8,1470.2,2256.6,13815.6],[9746.6,2673,2790.6,1659.3,2395.2,14474.2],[10050.1,2477.6,2983,1835.3,2576.2,14769.9],
  [9891.2,1929.7,3076.3,1582.8,2001.9,14478.1],[10260.3,2165.5,3155.6,1857.2,2389.6,15049],[10698.9,2332.6,3147.9,2115.9,2695.5,15599.7],[11047.4,2621.8,3136.5,2217.7,2769.3,16254],[11388.2,2838.3,3132.6,2287.9,2766.4,16880.7],[11874.5,3074,3168.6,2378.5,2887.4,17608.1],[12297.4,3288.5,3233.4,2270.6,2794.9,18295],[12726.8,3278.3,3303,2235.6,2738.8,18804.9],
  [13290.6,3467.7,3397.1,2388.3,2931.6,19612.1],[13934.4,3724.8,3590.4,2538.1,3131.2,20656.5],[14437.5,3893.7,3786,2539.4,3116.7,21540],[14231.4,3763.4,3999.1,2163.8,2782.4,21375.3],[16114.8,4248.5,4223.5,2568.5,3409.6,23745.8],[17670.8,4843.9,4463.4,3036.6,3955,26059.7],[18772.6,5026.4,4789.7,3078.4,3841.3,27825.9],[19822.5,5306.1,5133.9,3219.3,4100.7,29381],
  [20870.2,5557.2,5355.1,3341.1,4262.3,30861.3],
];

// Maddison Project Database 2023 (Bolt & van Zanden), GDP per head in 2011 international dollars, via Our World in Data;
// thinned to one point per 25 years before 1700, per decade to 1950 and every 5 years after (flat list: year, value, year, value, …).
const MPD = {
  uk: [1000,1151,1252,1320,1277,1222,1302,1199,1327,1222,1352,1574,1377,1539,1402,1742,1427,1668,1452,1663,1477,1541,1502,1689,1527,1713,1552,1528,1577,1630,1602,1751,1627,1733,1652,1720,1677,2029,1700,2412,1710,2066,1720,2715,1730,2538,1740,2526,1750,2702,1760,2915,1770,2952,1780,3049,1790,3072,1800,3343,1810,3478,1820,3306,1830,3550,1840,4018,1850,4332,1860,5086,1870,5829,1880,5997,1890,6845,1900,7594,1910,7718,1920,7017,1930,8673,1940,10928,1950,11061,1955,12541,1960,13780,1965,15545,1970,17162,1975,18884,1980,20612,1985,22579,1990,26189,1995,27861,2000,31946,2005,35624,2010,34754,2015,37101,2020,34651,2022,38407],
  nl: [1348,1405,1373,1927,1398,2138,1423,1921,1448,2160,1473,2358,1498,2327,1523,2895,1548,2615,1573,2258,1598,3957,1623,3940,1648,4202,1673,3171,1698,3612,1708,3880,1718,3778,1728,3776,1738,3490,1748,4393,1758,3888,1768,4307,1778,4497,1788,3726,1798,4725,1808,2632,1818,2942,1828,3319,1838,3590,1848,3602,1858,3800,1868,4152,1878,4637,1888,5231,1898,5431,1908,5628,1918,5343,1928,9118,1938,8368,1948,8751,1953,10429,1958,11926,1963,14078,1968,17365,1973,20851,1978,22992,1983,23086,1988,25574,1993,28880,1998,34689,2003,38804,2008,44841,2013,43783,2018,47529,2022,49670],
  it: [1451,2530,1501,2549,1551,2340,1601,2543,1651,2396,1701,2469,1751,2485,1801,2515,1811,2503,1821,2522,1831,2511,1841,2514,1851,2543,1861,2558,1871,2811,1881,2880,1891,3014,1901,3317,1911,3870,1921,3660,1931,4538,1941,4967,1950,5582,1955,7453,1960,9430,1965,12111,1970,15492,1975,17123,1980,20959,1985,22469,1990,26003,1995,28666,2000,32717,2005,34872,2010,34766,2015,33621,2020,32385,2022,36224],
  us: [1650,897,1720,1769,1775,2419,1800,2545,1810,2725,1820,2674,1830,3039,1840,3319,1850,3632,1860,4402,1870,4803,1880,6256,1890,6665,1900,8038,1910,9637,1920,10153,1930,10695,1940,12005,1950,15240,1955,17370,1960,18057,1965,21390,1970,23958,1975,25956,1980,29611,1985,33023,1990,36982,1995,39391,2000,45886,2005,49655,2010,49267,2015,52808,2020,54379,2022,58487],
  jp: [1000,1010,1150,927,1280,841,1450,867,1600,1061,1700,1073,1721,1073,1750,953,1800,1317,1820,1317,1846,1436,1870,1580,1885,1729,1895,2022,1905,2111,1915,2512,1925,3414,1935,3825,1945,3678,1950,3062,1955,4417,1960,6354,1965,9459,1970,15484,1975,18082,1980,21404,1985,24437,1990,29949,1995,31887,2000,33211,2005,34858,2010,35011,2015,37053,2020,36827,2022,38269],
  cn: [1000,1225,1090,1222,1150,1181,1400,1404,1430,1498,1460,1324,1490,1189,1520,1166,1550,1195,1580,1217,1610,1282,1661,1330,1690,1413,1700,1543,1710,1406,1720,1312,1730,1234,1740,1158,1750,1061,1760,1022,1770,998,1780,981,1790,955,1800,926,1810,901,1820,882,1830,846,1840,849,1850,858,1870,945,1887,912,1900,972,1911,905,1929,1003,1950,799,1955,1119,1960,1057,1965,1253,1970,1398,1975,1594,1980,1930,1985,2619,1990,2982,1995,4000,2000,4730,2005,6627,2010,9658,2015,13325,2020,17226,2022,19238],
  in: [1600,1264,1650,1189,1700,1162,1750,1068,1801,1033,1811,983,1821,937,1831,945,1841,944,1851,947,1861,896,1884,878,1894,944,1904,1050,1914,1130,1924,1111,1934,1111,1944,1089,1950,987,1955,1078,1960,1200,1965,1229,1970,1384,1975,1430,1980,1495,1985,1720,1990,2087,1995,2356,2000,2753,2005,3397,2010,4526,2015,5870,2020,6731,2022,7766],
  world: [1820,1128,1850,1301,1870,1543,1900,2265,1920,2493,1940,3413,1950,3360,1960,4404,1970,5971,1980,7239,1990,8211,2000,9904,2010,13122,2015,14713,2020,15461,2022,16677],
  weu: [1820,2171,1830,2315,1840,2528,1850,2670,1860,3029,1870,3288,1880,3585,1890,4079,1900,4724,1910,5121,1920,4869,1930,6390,1940,7161,1950,7240,1960,10929,1970,16097,1980,20870,1990,25367,2000,32593,2010,37420,2015,38740,2020,38163,2022,41323],
  wof: [1820,2513,1830,2887,1840,3168,1850,3474,1860,4214,1870,4647,1880,6019,1890,6481,1900,7741,1910,9355,1920,9741,1930,10297,1940,11621,1950,14773,1960,17472,1970,23210,1980,28787,1990,35619,2000,44321,2010,48083,2015,51453,2020,52618,2022,56568],
  eeu: [1820,1045,1850,1291,1870,1518,1890,1583,1900,2016,1910,2241,1920,1375,1930,2507,1940,3217,1950,4133,1960,5866,1970,8330,1980,9784,1990,10091,2000,8834,2010,16320,2015,18063,2020,19579,2022,20656],
  lat: [1820,957,1830,925,1840,1081,1850,1068,1860,1588,1870,1293,1880,1442,1890,1673,1900,1714,1910,2189,1920,2332,1930,2688,1940,2984,1950,3678,1960,4698,1970,6193,1980,8612,1990,8055,2000,10133,2010,13356,2015,14329,2020,12865,2022,14028],
  eas: [1820,911,1830,846,1840,849,1850,900,1870,994,1890,1049,1900,1086,1910,1056,1920,1216,1930,1296,1940,1496,1950,1109,1960,1726,1970,3031,1980,4191,1990,6090,2000,8153,2010,12862,2015,16298,2020,19750,2022,21729],
  mena: [1820,886,1870,1085,1930,1600,1940,2146,1950,2288,1960,3103,1970,4790,1980,6731,1990,6432,2000,9659,2010,16565,2015,18402,2020,18227,2022,19875],
  sas: [1820,919,1830,935,1840,939,1850,927,1860,889,1870,850,1880,1063,1890,957,1900,998,1910,1144,1920,1118,1930,1308,1940,1261,1950,1070,1960,1295,1970,1546,1980,1897,1990,2574,2000,3427,2010,5365,2015,6704,2020,7590,2022,8377],
  ssa: [1820,1188,1870,1286,1910,1688,1950,1327,1960,1578,1970,1968,1980,2037,1990,1813,2000,2009,2010,3205,2015,3524,2020,3336,2022,3437],
};

export default {
  collection: 'macro',
  chapter: 1,
  title: 'Measuring the macroeconomy',
  summary: String.raw`Gross domestic product counts the value of final goods and services produced in a country, and it can be measured three ways — by adding up value added in production, spending on final output, or the incomes earned in producing it — which must agree because every sale is somebody's income. The expenditure identity $Y = C + I + G + NX$ and its rearrangement into "saving equals investment" are accounting truths that every model must respect. Real GDP, price indices and the unemployment rate turn raw data into the quantities that macroeconomics explains, and each comes with known blind spots — what GDP leaves out, how fixed baskets overstate inflation — and with a long-run story: the hockey stick of world income.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Definition', name: 'GDP: the value of final output',
      statement: String.raw`**Gross domestic product** (GDP) is the market value of all **final** goods and services produced within a country's borders during a period (a quarter or a year). A good is *final* when it is bought by its end user — a household, a firm adding to its capital stock or inventories, the government, or a foreign buyer — and *intermediate* when it is used up in producing something else within the period. Equivalently, GDP is the sum over all producers of **value added**,
$$\text{value added} = \text{value of output} - \text{value of intermediate inputs bought from other producers}.$$
Sales of used goods and financial assets, and transfers such as pensions, are not production and are excluded; some output that is not sold, such as government services and owner-occupied housing, is included at estimated (imputed) values.`,
      idea: String.raw`Follow a loaf of bread: the farmer's wheat is sold to the miller, the miller's flour to the baker, the baker's bread to households. The price of the bread already contains the value of the flour, which contains the value of the wheat, so adding up *every* sale counts the wheat three times and the flour twice. Subtracting each producer's purchases leaves the value it added, and these slices stack exactly into the value of the final purchases. Adding all sales is not even a stable number: if the baker buys the mill, the flour sale disappears from the books while nothing real has changed — the value-added total does not move.`,
      caption: String.raw`The sliders set what each firm adds; the diagram shows the resulting sales. In the bars below, colour shows whose work a euro pays for: the **sum of all sales** repeats the farmer's teal three times, while **value added** and **final sales** have each slice once and always have the same length. The red-hatched slices are inputs bought from an earlier firm, counted a second (or third) time; strip them out and the sum of sales shrinks to GDP. Switch on **the baker buys the mill**: the sum of sales shrinks, GDP does not.`,
      deps: [], refs: ['Mankiw ch. 2', 'CORE Macro U3'], tags: ['national accounts', 'GDP'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gross_domestic_product' },
      viz(v) {
        const eur = (x) => `€${Math.round(x)}`;
        const a = v.slider('farmer’s value added (the wheat)', 5, 60, 30, { step: 1, fmt: eur });
        const b = v.slider('miller’s value added', 5, 60, 40, { step: 1, fmt: eur });
        const c = v.slider('baker’s value added', 5, 90, 70, { step: 1, fmt: eur });
        const h = v.slider('flour sold straight to households', 0, 0.8, 0.2, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const merge = v.toggle('the baker buys the mill (one firm)', false);
        const D = v.stage({ x: [0, 100], y: [0, 34], height: 210, axes: false, full: true });
        const B = v.stage({ x: [0, 400], y: [0, 3.55], height: 260, axes: 'box', full: true, yticks: [], xlabel: 'euros' });
        let st = {};
        v.legend([['teal', 'farmer’s value added', { area: true }], ['purple', 'miller’s value added', { area: true }], ['orange', 'baker’s value added', { area: true }], ['red', 'counted more than once', { area: true }], ['green', 'GDP']]);
        v.render(() => {
          const A = a.value, M = b.value, K = c.value, H = h.value, mg = merge.value;
          const F = A + M, Fh = H * F, Fb = (1 - H) * F, Br = Fb + K;
          const sales = A + (mg ? 0 : Fb) + Fh + Br, gdp = A + M + K, fin = Fh + Br;
          // ----- the production chain
          const nodes = [['farmer', 2, 17, 'teal'], ['miller', 28, 43, 'purple'], ['baker', 54, 69, 'orange'], ['households', 82, 98, 'blue']];
          if (mg) rbox(v, D, 25.5, 0.8, 71.5, 28.6, { color: 'muted', dash: [5, 4], width: 1.3, r: 12 });
          for (const [n, x0, x1, col] of nodes) { rbox(v, D, x0, 14, x1, 26, { fill: col, fillAlpha: 0.16, color: col }); D.text(n, (x0 + x1) / 2, 20, { align: 'center', color: 'ink', size: 13, weight: 650 }); }
          const arr = (x0, x1, lab, col, dash) => { D.arrow(x0, 20, x1, 20, { color: col, width: 2.2, head: 8, dash }); D.text(lab, (x0 + x1) / 2, 23.6, { align: 'center', color: col, size: 11.5, weight: 600 }); };
          arr(17.4, 27.6, `wheat ${eur(A)}`, 'teal');
          if (mg) { D.arrow(43.4, 20, 53.6, 20, { color: 'muted', width: 1.6, head: 7, dash: [4, 3] }); D.text('flour (no sale)', 48.5, 23.6, { align: 'center', color: 'muted', size: 10.5 }); }
          else arr(43.4, 53.6, `flour ${eur(Fb)}`, 'purple');
          arr(69.4, 81.6, `bread ${eur(Br)}`, 'orange');
          if (Fh > 0.5) {
            D.curve((t) => [35.5 + 54.5 * t, 26.3 + 13 * t * (1 - t)], 0, 0.96, { color: 'purple', width: 2, n: 60 });
            D.arrow(35.5 + 54.5 * 0.955, 26.3 + 13 * 0.955 * 0.045, 90, 26.3, { color: 'purple', width: 2, head: 8 });
            D.text(`flour to households ${eur(Fh)} (a final sale)`, 62.75, 32.2, { align: 'center', color: 'purple', size: 11, weight: 600 });
          }
          D.text(`value added ${eur(A)}`, 9.5, 10.2, { align: 'center', color: 'teal', size: 11.5, weight: 600 });
          D.text(`sales ${eur(A)} − purchases €0`, 9.5, 6.6, { align: 'center', color: 'muted', size: 10.5 });
          D.text(`value added ${eur(M)}`, 35.5, 10.2, { align: 'center', color: 'purple', size: 11.5, weight: 600 });
          D.text(`sales ${eur(F)} − wheat ${eur(A)}`, 35.5, 6.6, { align: 'center', color: 'muted', size: 10.5 });
          D.text(`value added ${eur(K)}`, 61.5, 10.2, { align: 'center', color: 'orange', size: 11.5, weight: 600 });
          D.text(`sales ${eur(Br)} − flour ${eur(Fb)}`, 61.5, 6.6, { align: 'center', color: 'muted', size: 10.5 });
          D.text(`final purchases ${eur(fin)}`, 90, 10.2, { align: 'center', color: 'blue', size: 11.5, weight: 600 });
          if (mg) D.text('mill + bakery = one firm', 48.5, 2.6, { align: 'center', color: 'muted', size: 10.5, weight: 600 });
          // ----- three ways of adding up
          const hh = 0.27, rows = [2.95, 1.8, 0.65];
          const head = (y, txt) => B.text(txt, 2, y + 0.44, { color: 'ink', size: 12, weight: 650 });
          head(rows[0], 'sum of all sales'); head(rows[1], 'sum of value added'); head(rows[2], 'sum of final sales');
          B.line(gdp, 0.08, gdp, 3.42, { color: 'green', width: 2, dash: [6, 4] });
          B.text(`GDP ${eur(gdp)}`, gdp, 3.42, { dx: 6, dy: 2, color: 'green', size: 11.5, weight: 700, baseline: 'top' });
          const chunk = (x, parts, y, name) => {
            let p = x;
            for (const [col, w, dbl] of parts) {
              hseg(B, p, w, y, hh, col, w >= 8 ? eur(w) : '');
              if (dbl && w > 0) { hatch(v, B, p, y - hh, p + w, y + hh, 'red', 0.7, 6); B.rect(p, y - hh, p + w, y + hh, { color: 'red', width: 1.4 }); }
              p += w;
            }
            if (name && B.X(p) - B.X(x) > 46) B.text(name, (x + p) / 2, y - hh - 0.14, { align: 'center', color: 'muted', size: 10 });
            B.line(p, y - hh - 0.02, p, y + hh + 0.02, { color: 'panel', width: 3 }); return p;
          };
          let x = 0;
          x = chunk(x, [['teal', A, false]], rows[0], 'wheat');
          if (!mg) x = chunk(x, [['teal', (1 - H) * A, true], ['purple', (1 - H) * M, false]], rows[0], 'flour to baker');
          if (Fh > 0.5) x = chunk(x, [['teal', H * A, true], ['purple', H * M, false]], rows[0], 'flour to hh');
          x = chunk(x, [['teal', (1 - H) * A, true], ['purple', (1 - H) * M, !mg], ['orange', K, false]], rows[0], 'bread');
          x = 0; x = chunk(x, [['teal', A]], rows[1], 'farmer'); x = chunk(x, [['purple', M]], rows[1], mg ? 'mill + bakery' : 'miller'); x = chunk(x, [['orange', K]], rows[1], mg ? '' : 'baker');
          x = 0; if (Fh > 0.5) x = chunk(x, [['teal', H * A], ['purple', H * M]], rows[2], 'flour'); chunk(x, [['teal', (1 - H) * A], ['purple', (1 - H) * M], ['orange', K]], rows[2], 'bread');
          [[rows[0], sales, 'red'], [rows[1], gdp, 'ink'], [rows[2], fin, 'ink']].forEach(([y, tot, col]) => B.text(`= ${eur(tot)}`, tot, y, { dx: 8, color: col, size: 12.5, weight: 700 }));
          st = { A, M, K, Fh, Fb, Br, sales, gdp, fin, mg };
        });
        v.readout(() => {
          const { A, M, K, Fh, Fb, Br, sales, gdp, fin, mg } = st, e = (x) => `€${Math.round(x)}`;
          const inter = sales - gdp;
          return `Value added ${e(A)} + ${e(M)} + ${e(K)} = **${e(gdp)}** = final sales ${Fh > 0.5 ? `${e(Fh)} + ` : ''}${e(Br)} = **${e(fin)}** ✓ — that is GDP. The sum of all sales is ${e(sales)}: it overstates GDP by ${e(inter)}, exactly the intermediate sales (wheat ${e(A)}${mg ? '' : ` + flour to the baker ${e(Fb)}`}) that are counted again inside later prices.${mg ? ' With mill and bakery merged the flour sale has vanished from the books, so the sum of sales fell — but no less bread exists, and GDP is unchanged.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Theorem', name: 'Production, expenditure and income measures agree',
      statement: String.raw`In a closed set of national accounts, three totals are equal:
- the **production** measure: the sum over all producers of value added (output minus intermediate inputs, including imported inputs);
- the **expenditure** measure: spending on final goods and services, $C + I + G + X - M$, where imports $M$ are subtracted because they are counted inside $C$, $I$, $G$ and $X$;
- the **income** measure: the factor incomes generated in production — compensation of employees plus operating surplus (profits, rent, interest), plus taxes on production net of subsidies and depreciation when GDP rather than net income is wanted.
Each equals GDP. In published statistics the three are built from different sources (business surveys, household and government spending data, tax records), and the gap between them is reported as a **statistical discrepancy**.`,
      idea: String.raw`Arrange all transactions in an input–output table: row $i$ lists what industry $i$ sells, column $j$ what industry $j$ buys and pays out. Profit is defined as the residual that makes each industry's column (costs plus profit) equal its row (sales). Summing value added over industries, the intermediate sales cancel between rows and columns, leaving final demand minus imports — the expenditure total; summing the same value added down the columns gives wages plus profits — the income total. The identity is pure bookkeeping (1.1): every euro spent on final output is a euro of somebody's income. It fails only when a transaction is recorded in one source and not in another.`,
      caption: String.raw`Click a cell of the transactions table to select it, then drag the cell up or down (or use the slider) to change a payment. Profits (gold row) are recomputed so each industry's costs plus profit equal its sales, and the three meters on the right move together. Then pick an **unrecorded payment**: a cash sale hidden from the firm's books, or a purchase the household survey misses, and a statistical discrepancy opens between the measures.`,
      deps: ['macro-1.1'], refs: ['Mankiw ch. 2', 'CORE Macro U3'], tags: ['national accounts', 'GDP'],
      credit: 'Simon Kuznets, 1934 (U.S. national income estimates); Wassily Leontief, 1936 (input–output tables)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gross_domestic_product#Determining_gross_domestic_product_(GDP)' },
      viz(v) {
        const Ts = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: false, weight: 2.4, minWidth: 440, title: 'who pays whom: the transactions table' });
        const Ms = v.stage({ x: [-0.5, 3.75], y: [-34, 330], height: 340, axes: 'box', weight: 1, minWidth: 230, xticks: [[0.5, 'production'], [1.7, 'spending'], [3.2, 'income']], yticks: [100, 200, 300], title: 'three measures of GDP' });
        const bk = { Z: [[5, 30, 5], [10, 20, 15], [5, 15, 10]], F: [[20, 0, 0, 10], [40, 30, 10, 25], [70, 5, 35, 5]], Mi: [5, 25, 5], Mf: [15, 10, 0], W: [15, 50, 60] };
        const editable = (i, j) => (i < 3 && j < 7) || (i === 3 && j < 6) || (i === 4 && j < 3);
        const get = (i, j) => (i < 3 ? (j < 3 ? bk.Z[i][j] : bk.F[i][j - 3]) : i === 3 ? (j < 3 ? bk.Mi[j] : bk.Mf[j - 3]) : bk.W[j]);
        const setv = (i, j, x) => { if (!editable(i, j)) return; if (i < 3) { if (j < 3) bk.Z[i][j] = x; else bk.F[i][j - 3] = x; } else if (i === 3) { if (j < 3) bk.Mi[j] = x; else bk.Mf[j - 3] = x; } else bk.W[j] = x; };
        let sel = [2, 3];
        const miss = v.select('unrecorded payment', [{ value: 'none', label: 'none' }, { value: 'firm', label: 'cash sale kept off the books' }, { value: 'hh', label: 'purchase missing from the survey' }], 'none');
        const Hs = v.slider('size of the unrecorded payment', 5, 40, 20, { step: 1 });
        const val = v.slider('selected payment', 0, 100, get(...sel), { step: 1, onChange: (x) => setv(sel[0], sel[1], x) });
        const acct = () => {
          const out = [0, 1, 2].map((i) => sum(bk.Z[i]) + sum(bk.F[i]));
          const inter = [0, 1, 2].map((j) => bk.Z[0][j] + bk.Z[1][j] + bk.Z[2][j]);
          const prof = [0, 1, 2].map((j) => out[j] - inter[j] - bk.Mi[j] - bk.W[j]);
          const fin = [0, 1, 2, 3].map((k) => bk.F[0][k] + bk.F[1][k] + bk.F[2][k] + (k < 3 ? bk.Mf[k] : 0));
          const M = sum(bk.Mi) + sum(bk.Mf), va = [0, 1, 2].map((j) => out[j] - inter[j] - bk.Mi[j]);
          return { out, inter, prof, fin, M, va };
        };
        const T = v.table(Ts, {
          rows: 7, cols: 8, square: false, cellAspect: 1.4, maxCell: 40, size: 13, labelSize: 12,
          rowLabels: ['Farms', 'Factories', 'Services', 'imports', 'wages', 'profits', 'total'],
          colLabels: ['Farms', 'Fact.', 'Serv.', '$C$', '$I$', '$G$', '$X$', 'total'], cornerLabel: 'from \\ to',
          rowLabelColor: (i) => (i === 5 ? 'gold' : i === 3 ? 'red' : 'ink'),
        });
        let drag = null;
        Ts.onDrag((x, y, ph) => {
          if (ph === 'start') { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0 && editable(c.i, c.j)) { sel = [c.i, c.j]; drag = { py: Ts.Y(y), v0: get(c.i, c.j) }; val.set(drag.v0); } else drag = null; return; }
          if (!drag) return;
          if (ph === 'move') { const nv = clamp(Math.round(drag.v0 + (drag.py - Ts.Y(y)) / 3), 0, 100); setv(sel[0], sel[1], nv); val.set(nv); }
          if (ph === 'end') drag = null;
        });
        let st = {};
        v.legend([['gray', 'sales between firms', { area: true }], ['blue', 'final demand', { area: true }], ['red', 'imports', { area: true }], ['teal', 'wages', { area: true }], ['gold', 'profits (residual)', { area: true }]]);
        v.render(() => {
          Hs.el.hidden = miss.value === 'none';
          const A = acct(), H = miss.value === 'none' ? 0 : Hs.value;
          T.draw({
            value: (i, j) => {
              if (i < 5 && j < 7) return editable(i, j) ? get(i, j) : (i === 3 && j === 6 ? null : null);
              if (i === 5) return j < 3 ? A.prof[j] : j === 7 ? sum(A.prof) : null;
              if (i === 6) return j < 3 ? A.out[j] : j < 7 ? A.fin[j - 3] : null;
              if (j === 7) return i < 3 ? A.out[i] : i === 3 ? A.M : i === 4 ? sum(bk.W) : null;
              return null;
            },
            fill: (i, j) => {
              if (i === 6 || j === 7) return (i === 6 && j === 7) ? null : ['muted', 0.1];
              if (i < 3) return j < 3 ? ['gray', 0.16] : ['blue', 0.14];
              if (i === 3) return j < 6 ? ['red', 0.12] : null;
              if (i === 4) return j < 3 ? ['teal', 0.16] : null;
              if (i === 5) return j < 3 ? ['gold', 0.26] : null;
              return null;
            },
            textColor: (i, j) => (i === 5 && j < 3 && A.prof[j] < 0 ? 'red' : 'ink'),
            weight: (i, j) => (i === 6 || j === 7 ? 700 : 500),
            sub: (i, j) => (miss.value === 'firm' && i === 2 && j === 3 ? `+${H} cash` : miss.value === 'hh' && i === 1 && j === 3 ? `−${H} survey` : null),
            subColor: 'red', subSize: 10,
            highlight: [[sel[0], sel[1]]],
          });
          // ----- three meters
          const prod = A.va, P = sum(prod);
          const C = A.fin[0] + (miss.value === 'firm' ? H : miss.value === 'hh' ? -H : 0), I = A.fin[1], G = A.fin[2], X = A.fin[3], Ex = C + I + G + X - A.M;
          const Wt = sum(bk.W), Pr = sum(A.prof), Inc = Wt + Pr;
          const pre = Math.abs(P - Ex) < 1e-9 && Math.abs(P - Inc) < 1e-9;
          if (pre) Ms.line(-0.1, P, 3.6, P, { color: 'green', width: 1.2, dash: [5, 4] });
          const w = 0.34, stack = (xc, parts) => { let y = 0; for (const [col, h, lab] of parts) { if (h > 0) { Ms.rect(xc - w, y, xc + w, y + h, { fill: col, fillAlpha: 0.5, color: 'panel', width: 1.2 }); if (Ms.Y(y) - Ms.Y(y + h) > 15) Ms.text(lab, xc, y + h / 2, { align: 'center', size: 10.5, weight: 600 }); } y += Math.max(0, h); } return y; };
          stack(0.5, [['green', prod[0], `Farms ${num(prod[0])}`], ['orange', prod[1], `Fact. ${num(prod[1])}`], ['purple', prod[2], `Serv. ${num(prod[2])}`]]);
          const top = stack(1.7, [['blue', C, `C ${num(C)}`], ['gold', I, `I ${num(I)}`], ['pink', G, `G ${num(G)}`], ['teal', X, `X ${num(X)}`]]);
          const mx = 1.7 + w + 0.04;
          hatch(v, Ms, mx, top - A.M, mx + 0.2, top, 'red', 0.9, 5);
          Ms.rect(mx, top - A.M, mx + 0.2, top, { color: 'red', width: 1.4 });
          Ms.arrow(mx + 0.1, top, mx + 0.1, top - A.M, { color: 'red', width: 1.6, head: 7 });
          Ms.text(`−M ${num(A.M)}`, mx + 0.1, top + 4, { align: 'center', color: 'red', size: 10.5, weight: 700, baseline: 'bottom' });
          stack(3.2, [['teal', Wt, `wages ${num(Wt)}`], ['gold', Pr, `profits ${num(Pr)}`]]);
          const agree = Math.abs(P - Ex) < 1e-9 && Math.abs(P - Inc) < 1e-9;
          if (agree) { Ms.text(`GDP ${num(P)} ✓`, 0.5, P + 6, { align: 'center', color: 'green', size: 12, weight: 700, baseline: 'bottom' }); }
          else { const lo = Math.min(P, Ex), hi = Math.max(P, Ex); Ms.rect(-0.1, lo, 3.6, hi, { fill: 'red', fillAlpha: 0.12, stroke: false }); Ms.text(`discrepancy ${num(hi - lo)}`, 0.5, hi + 6, { align: 'center', color: 'red', size: 11.5, weight: 700, baseline: 'bottom' }); }
          for (const [x0, x1, lev] of [[0.1, 0.9, P], [mx - 0.06, mx + 0.26, Ex], [2.8, 3.6, Inc]]) Ms.line(x0, lev, x1, lev, { color: agree ? 'green' : 'ink', width: 2.6 });
          st = { A, P, Ex, Inc, C, I, G, X, Wt, Pr, H, agree, prod };
        });
        v.readout(() => {
          const { A, P, Ex, Inc, C, I, G, X, Wt, Pr, H, prod } = st, n = (x) => num(x);
          const base = `**Production** (value added) ${n(prod[0])} + ${n(prod[1])} + ${n(prod[2])} = **${n(P)}** · **Spending** $C + I + G + X - M$ = ${n(C)} + ${n(I)} + ${n(G)} + ${n(X)} − ${n(A.M)} = **${n(Ex)}** · **Income** wages ${n(Wt)} + profits ${n(Pr)} = **${n(Inc)}**.`;
          if (miss.value === 'none') return `${base} Every industry's sales (row total) equal its purchases, wages and profit (column total), so the three totals agree whatever payments you edit — a loss-making industry just has a negative profit.`;
          if (miss.value === 'firm') return `${base} A cash sale of ${H} by the service firm reaches the household survey (in $C$) but not the firm's accounts or tax return, so production and income miss it: a **statistical discrepancy** of ${n(Ex - P)}.`;
          return `${base} The firms report a sale of ${H} to households that the household survey misses: spending falls short of production and income by ${n(P - Ex)} — the books still balance in reality, only the measurement does not.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Concept', name: 'The circular flow',
      statement: String.raw`The **circular flow** pictures an economy as sectors connected by flows of money (with goods, services and labour moving the opposite way). Firms pay households factor incomes $Y$ (wages, profits, rent); households spend $C$ on consumption, pay net taxes $T$ to the government and save the rest, $S_p = Y - T - C$; the government buys goods $G$ and saves $T - G$ (borrows when negative); financial markets channel saving into investment $I$ and net lending abroad; the rest of the world buys exports $X$ and sells imports $M$. Because every flow out of one sector is a flow into another, **each sector's inflows equal its outflows**, and the firms' balance is the expenditure identity $Y = C + I + G + X - M$.`,
      idea: String.raw`The balance at each node is accounting, not behaviour: households cannot spend, save or pay in taxes more than they receive, so their outflows sum to their income; firms pay out (as wages and profits) what they receive from selling final output, net of what they pass on to foreign suppliers. Goods produced but not sold are counted as inventory investment — as if the firm bought them from itself — which is what keeps the firms' and the financial markets' books balanced (1.2). Adding up the government, financial and foreign nodes gives saving = investment + net capital outflow (1.5).`,
      caption: String.raw`Set the spending flows with the sliders; band widths and the moving dots show the money flows, and each box shows whether its inflows equal its outflows. Income $Y$, private saving and the net flows between government, financial markets and the rest of the world follow from the identities. Then let firms produce goods they cannot sell: counted as **inventory investment** every box still balances; **not counted**, the firms and the financial markets go out of balance by exactly the unsold amount.`,
      deps: ['macro-1.2'], refs: ['Mankiw ch. 3', 'CORE Macro U3'], tags: ['national accounts', 'circular flow'],
      credit: 'François Quesnay, Tableau économique, 1758; Frank Knight, 1933',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Circular_flow_of_income' },
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 66], height: 430, axes: false, full: true });
        const Cs = v.slider('consumption $C$', 40, 80, 62, { step: 1 });
        const Is = v.slider('investment $I$', 4, 30, 18, { step: 1 });
        const Gs = v.slider('government purchases $G$', 4, 36, 20, { step: 1 });
        const Ts = v.slider('net taxes $T$', 4, 40, 18, { step: 1 });
        const Xs = v.slider('exports $X$', 0, 30, 12, { step: 1 });
        const Mm = v.slider('imports $M$', 0, 30, 14, { step: 1 });
        const un = v.select('goods produced but not sold', [{ value: 'none', label: 'none' }, { value: 'inv', label: 'counted as inventory investment' }, { value: 'lost', label: 'not counted' }], 'none');
        const Us = v.slider('unsold output', 2, 20, 10, { step: 1 });
        const NODE = { H: [2, 24, 20, 40, 'households'], F: [82, 24, 98, 40, 'firms'], G: [38, 44, 58, 54, 'government'], K: [38, 8, 58, 18, 'financial markets'], R: [61, 27, 72, 37, 'rest of world'] };
        let disp = null, lastT = null, st = {};
        const target = () => {
          const C = Cs.value, I = Is.value, G = Gs.value, T = Ts.value, X = Xs.value, M = Mm.value, U = un.value === 'none' ? 0 : Us.value;
          const Y = C + I + G + X - M + U, Sp = Y - T - C, Sg = T - G, N = X - M, Ir = I + (un.value === 'inv' ? U : 0);
          return { C, I, G, T, X, M, U, Y, Sp, Sg, N, Ir };
        };
        v.legend([['blue', 'spending'], ['teal', 'incomes'], ['gold', 'taxes'], ['purple', 'saving'], ['orange', 'investment'], ['green', 'exports'], ['red', 'imports'], ['gray', 'net capital flow']]);
        v.animate((t) => {
          Us.el.hidden = un.value === 'none';
          const tg = target(), dt = lastT == null ? 0 : t - lastT; lastT = t;
          if (!disp || dt <= 0 || dt > 0.5) disp = { ...tg }; else for (const k in tg) disp[k] += (tg[k] - disp[k]) * Math.min(1, dt * 5);
          const d = disp, k = 0.28 * s.width / 820; // px per unit of flow
          const W = (x) => Math.abs(x) * k;
          // flows
          const flows = [
            ['C', bz([11, 40], [11, 64], [89, 64], [89, 40]), d.C, 'blue', [50, 60.6], `consumption C ${Math.round(tg.C)}`],
            ['Y', bz([90, 24], [90, -2], [10, -2], [10, 24]), d.Y, 'teal', [50, 4.6], `factor incomes Y ${Math.round(tg.Y)}`],
            ['T', bz([20, 37], [29, 37], [29, 49], [38, 49]), d.T, 'gold', [27.5, 46], `taxes T ${Math.round(tg.T)}`],
            ['G', bz([58, 49], [72, 49], [85, 51], [85, 40.2]), d.G, 'pink', [70, 51.6], `purchases G ${Math.round(tg.G)}`],
            ['S', bz([20, 27], [29, 27], [29, 13], [38, 13]), d.Sp, 'purple', [24.5, 15.2], `private saving ${Math.round(tg.Sp)}`],
            ['I', bz([58, 13], [72, 13], [85, 11], [85, 23.8]), d.Ir, 'orange', [70, 15.6], un.value === 'inv' ? `I ${Math.round(tg.I)} + inventories ${Math.round(tg.U)}` : `investment I ${Math.round(tg.Ir)}`],
            ['X', [[72.3, 34.4], [81.7, 34.4]], d.X, 'green', [77, 37.4], `X ${Math.round(tg.X)}`],
            ['M', [[81.7, 29.6], [72.3, 29.6]], d.M, 'red', [77, 26.4], `M ${Math.round(tg.M)}`],
          ];
          const sg = d.Sg >= 0 ? [[46, 43.6], [46, 18.4]] : [[46, 18.4], [46, 43.6]];
          flows.push(['Sg', sg, d.Sg, 'purple', [37, 31], tg.Sg >= 0 ? `public saving ${Math.round(tg.Sg)}` : `government borrows ${Math.round(-tg.Sg)}`]);
          const nc = bz([55, 18.4], [58, 23], [62, 24], [64, 26.6]);
          flows.push(['N', d.N >= 0 ? nc : nc.slice().reverse(), d.N, 'gray', [62.5, 21.2], tg.N >= 0 ? `lending abroad ${Math.round(tg.N)}` : `borrowing from abroad ${Math.round(-tg.N)}`]);
          for (const [, pts, val, col] of flows) flowBand(v, s, pts, W(val), col, t);
          // balances
          const pos = (x) => Math.max(0, x), U = tg.U;
          const bal = {
            H: [tg.Y, tg.C + tg.T + tg.Sp], F: [tg.C + tg.G + tg.X + tg.Ir, tg.Y + tg.M], G: [tg.T + pos(-tg.Sg), tg.G + pos(tg.Sg)],
            K: [tg.Sp + pos(tg.Sg) + pos(-tg.N), tg.Ir + pos(-tg.Sg) + pos(tg.N)], R: [tg.M + pos(tg.N), tg.X + pos(-tg.N)],
          };
          for (const key in NODE) {
            const [x0, y0, x1, y1, name] = NODE[key], [i, o] = bal[key], ok = Math.abs(i - o) < 1e-9, col = ok ? 'ink' : 'red';
            rbox(v, s, x0, y0, x1, y1, { fill: ok ? 'panel' : 'red', fillAlpha: ok ? 0.92 : 0.12, color: ok ? 'muted' : 'red', width: ok ? 1.4 : 2.2 });
            const cx = (x0 + x1) / 2, small = key === 'R';
            s.text(name, cx, (y0 + y1) / 2 + (small ? 1.6 : 1.9), { align: 'center', color: col, size: small ? 11 : 13, weight: 700 });
            s.text(ok ? `in ${Math.round(i)} = out ${Math.round(o)}` : `in ${Math.round(i)} ≠ out ${Math.round(o)}`, cx, (y0 + y1) / 2 - (small ? 1.9 : 2.2), { align: 'center', color: ok ? 'green' : 'red', size: small ? 9.5 : 10.5, weight: 600 });
          }
          for (const [, , , col, at, lab] of flows) s.text(lab, at[0], at[1], { align: 'center', color: col, size: 11, weight: 650 });
          st = { ...tg, bal, U };
        }, { still: 2 });
        v.readout(() => {
          const { C, G, X, M, U, Y, Sp, Sg, N, Ir, bal } = st, r = (x) => num(x);
          if (C == null) return '';
          const keys = { H: 'households', F: 'firms', G: 'government', K: 'financial markets', R: 'rest of world' };
          const bad = Object.keys(bal).filter((k) => Math.abs(bal[k][0] - bal[k][1]) > 1e-9);
          const id = `$Y = C + I + G + X - M$: ${r(Y)} = ${r(C)} + ${r(Ir)} + ${r(G)} + ${r(X)} − ${r(M)}${bad.length ? ` + ${r(U)} unsold` : ''}. Saving: private ${r(Sp)} + public ${Sg < 0 ? `(${r(Sg)})` : r(Sg)} = ${r(Sp + Sg)} ${bad.length ? '≠' : '='} investment ${r(Ir)} + net lending abroad ${N < 0 ? `(${r(N)})` : r(N)} = ${r(Ir + N)}${bad.length ? '' : ' ✓'}.`;
          if (!bad.length) return `Every box balances. ${id}${U ? ' The unsold goods are recorded as inventory investment, so firms in effect buy them from themselves.' : ''}`;
          return `${id} Unsold output of ${r(U)} not counted anywhere: **${bad.map((k) => keys[k]).join(' and ')}** are out of balance by ${r(U)} — incomes were paid for goods nobody bought, and saving finds no matching investment. Counting inventories restores every identity.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Definition', name: 'The expenditure identity Y = C + I + G + NX',
      statement: String.raw`Splitting final spending by who buys gives the **expenditure identity**
$$Y = C + I + G + NX, \qquad NX = X - M,$$
where $Y$ is GDP; $C$ is household **consumption** of goods and services; $I$ is **investment** — business equipment and structures, new housing and the change in inventories; $G$ is **government purchases** of goods and services (transfers such as pensions are excluded); $X$ is exports and $M$ imports. Each of $C$, $I$, $G$ is measured *including* its imported content, so subtracting $M$ removes what was produced abroad. The identity holds for every period by construction, because unsold output is counted in $I$ as inventory investment.`,
      idea: String.raw`The identity is the expenditure measure of 1.2 with final demand grouped by buyer. It is an accounting definition, not a theory: it says nothing about what causes what, but every macroeconomic model must respect it. Its traps are classification ones: buying an imported car raises $C$ and $M$ by the same amount and leaves $Y$ unchanged; a pension raises no component until it is spent; a used car is not current production; an unsold car is investment.`,
      caption: String.raw`Top: U.S. spending as a share of GDP each year from the BEA national accounts — consumption, investment, government purchases and exports above the axis, imports below it; the black line is net exports. Click or drag on the chart to pick a year. Below: pick a single transaction and see which components it moves. Switch on **forget to subtract imports** to see how much a naive sum $C + I + G + X$ would overstate GDP.`,
      deps: ['macro-1.2'], refs: ['Mankiw ch. 2'], tags: ['national accounts', 'GDP'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gross_domestic_product#Expenditure_approach' },
      viz(v) {
        const T = v.stage({ x: [1927.6, 2026.4], y: [-30, 126], height: 310, axes: 'box', full: true, ylabel: '% of GDP', yticks: [-20, 0, 20, 40, 60, 80, 100, 120], title: 'U.S. GDP by type of spending, 1929–2025 (BEA national accounts) — click a year' });
        const B = v.stage({ x: [0.35, 6.65], y: [-38, 54], height: 210, axes: 'box', full: true, xticks: [[1, 'ΔC'], [2, 'ΔI'], [3, 'ΔG'], [4, 'ΔX'], [5, '−ΔM'], [6, 'ΔGDP']], yticks: [-30, 0, 30], ylabel: 'thousand dollars' });
        const naive = v.toggle('forget to subtract imports', false);
        const tx = v.select('one transaction of 30,000 dollars', [
          { value: 'car', label: 'home-made car' }, { value: 'imp', label: 'imported car' }, { value: 'mach', label: 'new machine' }, { value: 'inv', label: 'unsold cars' },
          { value: 'teach', label: 'teachers’ pay' }, { value: 'pens', label: 'pensions' }, { value: 'tour', label: 'foreign tourists' }, { value: 'used', label: 'used car' }], 'imp');
        const EFF = {
          car: [{ C: 30 }, 'A household buys a new car built at home: consumption and GDP rise by 30.'],
          imp: [{ C: 30, M: 30 }, 'A household buys an imported car: C rises by 30, but the car was produced abroad, so M rises by 30 too and GDP does not change.'],
          mach: [{ I: 30 }, 'A firm buys a machine built at home: business investment and GDP rise by 30.'],
          inv: [{ I: 30 }, 'Cars built this year sit unsold on the lot: they count as inventory investment, so GDP still records the production.'],
          teach: [{ G: 30 }, 'The government pays teachers for a year of teaching: government purchases rise by 30 (services valued at their cost).'],
          pens: [{}, 'The government pays pensions: a transfer, not a purchase of output — no component moves until the money is spent.'],
          tour: [{ X: 30 }, 'Foreign tourists spend 30 at hotels and restaurants here: an export of services.'],
          used: [{}, 'A household buys a used car from a neighbour: nothing new was produced, so GDP is unchanged (a dealer’s margin would count).'],
        };
        const Y = { x: 2025 };
        T.onDrag((x) => { Y.x = Math.round(clamp(x, 1929, 2025)); });
        const COLS = ['blue', 'gold', 'purple', 'teal', 'red'];
        let st = {};
        v.legend([['blue', '$C$ consumption', { area: true }], ['gold', '$I$ investment', { area: true }], ['purple', '$G$ government', { area: true }], ['teal', '$X$ exports', { area: true }], ['red', '$M$ imports (below 0)', { area: true }], ['ink', 'net exports $X - M$'], ['muted', '100% of GDP', { dash: true }]]);
        v.render(() => {
          const sel = Y.x, i0 = sel - 1929;
          T.vband(sel - 0.5, sel + 0.5, { color: 'accent', alpha: 0.12 });
          const nx = [], cigx = [];
          BEA.forEach((r, i) => {
            const yr = 1929 + i, g = r[5], sh = r.slice(0, 5).map((x) => (100 * x) / g); let y = 0;
            for (let k = 0; k < 4; k++) { T.rect(yr - 0.42, y, yr + 0.42, y + sh[k], { fill: COLS[k], fillAlpha: i === i0 ? 0.95 : 0.62, stroke: false }); y += sh[k]; }
            T.rect(yr - 0.42, -sh[4], yr + 0.42, 0, { fill: 'red', fillAlpha: i === i0 ? 0.95 : 0.55, stroke: false });
            nx.push([yr, sh[3] - sh[4]]); cigx.push([yr, sh[0] + sh[1] + sh[2] + sh[3]]);
          });
          T.hline(100, { color: 'muted', width: 1.4, dash: [5, 4] }); T.hline(0, { color: 'ink', width: 1 });
          T.path(nx, { color: 'ink', width: 1.8 });
          T.text('World War II', 1944, 104, { align: 'center', color: 'muted', size: 10.5, dy: -4 });
          if (naive.value) { T.path(cigx, { color: 'red', width: 2, dash: [5, 3] }); T.text('C + I + G + X', 2024, cigx[cigx.length - 1][1], { align: 'right', dy: -10, color: 'red', size: 11, weight: 700 }); }
          T.text(String(sel), sel, 121, { dx: sel > 2012 ? -8 : 8, align: sel > 2012 ? 'right' : 'left', color: 'accent', size: 11.5, weight: 700 });
          // ----- one transaction
          const [eff, note] = EFF[tx.value], d = { C: 0, I: 0, G: 0, X: 0, M: 0, ...eff };
          const dY = d.C + d.I + d.G + d.X - (naive.value ? 0 : d.M), wrong = naive.value && d.M > 0;
          const vals = [d.C, d.I, d.G, d.X, -d.M, dY], cols = [...COLS, wrong ? 'red' : 'green'];
          B.hline(0, { color: 'ink', width: 1 });
          vals.forEach((x, k) => {
            if (k === 4 && naive.value) { B.rect(k + 1 - 0.28, -30, k + 1 + 0.28, 0, { color: 'red', width: 1.2, dash: [4, 3] }); B.text('ignored', k + 1, -15, { align: 'center', color: 'red', size: 10.5 }); if (!d.M) return; }
            if (Math.abs(x) > 1e-9) { B.rect(k + 1 - 0.28, 0, k + 1 + 0.28, x, { fill: cols[k], fillAlpha: k === 4 && naive.value ? 0.15 : 0.7, color: cols[k], width: 1.2 }); B.text(`${x > 0 ? '+' : '−'}${Math.abs(x)}`, k + 1, x, { align: 'center', dy: x > 0 ? -10 : 10, color: cols[k], size: 12, weight: 700 }); }
            else if (!(k === 4 && naive.value)) B.text('0', k + 1, 0, { align: 'center', dy: -10, color: 'muted', size: 11 });
          });
          if (wrong) B.text('overstated: foreign production counted as ours', 6, 30, { align: 'right', dy: -14, color: 'red', size: 11, weight: 700 });
          st = { sel, r: BEA[i0], note, dY, wrong };
        });
        v.readout(() => {
          const { sel, r, note, dY, wrong } = st, [C, I, G, X, M, Yb] = r, sumv = C + I + G + X - M, f = (x) => num(x, 1), sh = (x) => pctx(x / Yb);
          const naiveTxt = naive.value ? ` Without subtracting imports the sum would be ${f(C + I + G + X)} — ${sh(M)} too high.` : '';
          return `**${sel}** (billions of dollars): $C$ ${f(C)} + $I$ ${f(I)} + $G$ ${f(G)} + $X$ ${f(X)} − $M$ ${f(M)} = **${f(sumv)}**; BEA's GDP: ${f(Yb)} (shares ${sh(C)}, ${sh(I)}, ${sh(G)}, net exports ${sh(X - M)}).${naiveTxt} — ${note} ΔGDP = ${dY > 0 ? '+' : ''}${dY}${wrong ? ' (wrong!)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Theorem', name: 'Saving equals investment (and twin deficits)',
      statement: String.raw`Let private saving be $S_p = Y - T - C$ (income after net taxes, not consumed) and public saving $S_g = T - G$ (the budget surplus). Then the expenditure identity $Y = C + I + G + NX$ (1.4) implies
$$S_p + S_g \;=\; I + NX,$$
national saving equals domestic investment plus net exports, i.e. **net capital outflow** (net lending to the rest of the world). In a closed economy $S = I$. Consequently, with output given, a rise in the budget deficit $G - T$ must be matched by a rise in private saving, a fall in investment ("crowding out"), a fall in net exports (a current-account deficit — the "twin deficits"), or some mix of these; the identity alone does not say which.`,
      idea: String.raw`Write output twice: as spending, $Y = C + I + G + NX$, and as the uses of income, $Y = C + T + S_p$. Both start with the same $C$, so the rests are equal: $I + G + NX = T + S_p$; moving $G$ across gives $S_p + (T - G) = I + NX$. It is an identity, not a theory of interest rates or exchange rates; which term adjusts depends on behaviour — the loanable-funds market (2.3) and the open-economy model decide that. The United States in the 1980s and 2000s had budget and trade deficits together, but in the late 1990s a budget surplus coexisted with a trade deficit, so "twin" is a tendency, not a law.`,
      caption: String.raw`Left: output drawn as spending (top bar) and as the uses of income (second bar); cancel the common $C$ and swap $G$ for $T$ to get the two lower bars, which always end at the same point. Raise government purchases (taxes fixed) and choose **what gives**: investment, net exports, consumption (so that private saving rises), or a mix. Right: every term against $G$ for that choice. Switch on **nothing gives** to break the identity: the bars no longer match, which is impossible when output is fixed.`,
      deps: ['macro-1.4'], refs: ['Mankiw ch. 3', 'Mankiw ch. 6'], tags: ['national accounts', 'saving'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Twin_deficits_hypothesis' },
      viz(v) {
        const L = v.stage({ x: [-16, 112], y: [0, 11.2], height: 350, axes: false, weight: 1.5, minWidth: 380 });
        const R = v.stage({ x: [10, 39.5], y: [-18, 30], height: 340, axes: 'box', weight: 1, minWidth: 260, xlabel: 'G', xticks: [10, 15, 20, 25, 30], title: 'each term as $G$ rises (output fixed at 100)' });
        const Gs = v.slider('government purchases $G$ (taxes $T = 18$)', 10, 34, 26, { step: 0.5 });
        const ch = v.select('what gives', [{ value: 'I', label: 'investment' }, { value: 'NX', label: 'net exports' }, { value: 'C', label: 'consumption (saving rises)' }, { value: 'mix', label: 'a mix' }], 'NX');
        const brk = v.toggle('nothing gives (break the identity)', false);
        const T0 = 18, Y0 = 100;
        const model = (G) => {
          const d = G - 20, k = brk.value ? null : ch.value; let C = 64, I = 18, NX = -2;
          if (k === 'I') I -= d; else if (k === 'NX') NX -= d; else if (k === 'C') C -= d; else if (k === 'mix') { I -= d / 3; NX -= d / 3; C -= d / 3; }
          const Sp = Y0 - T0 - C, Sg = T0 - G;
          return { C, I, G, NX, T: T0, Sp, Sg, spend: C + I + G + NX };
        };
        const COL = { C: 'gray', I: 'orange', G: 'pink', NX: 'teal', T: 'gold', Sp: 'blue', Sg: 'purple' };
        let st = {};
        v.legend([['gray', '$C$', { area: true }], ['orange', '$I$', { area: true }], ['pink', '$G$', { area: true }], ['teal', '$NX$', { area: true }], ['gold', '$T$', { area: true }], ['blue', '$S_p$ private saving', { area: true }], ['purple', '$S_g = T - G$', { area: true }], ['green', 'national saving']]);
        v.render(() => {
          const m = model(Gs.value), hh = 0.45;
          const lab = (key, w) => `${key === 'Sp' ? 'Sₚ' : key === 'Sg' ? 'T−G' : key} ${w < 0 ? '−' : ''}${num(Math.abs(w), w % 1 ? 1 : 0)}`;
          const row = (y, parts, title, k = 1) => {
            L.text(title, -15, y + hh + 0.36, { color: 'ink', size: 11.5, weight: 650 });
            let p = 0;
            for (const [key, w] of parts) {
              if (w >= 0) { hseg(L, p, k * w, y, hh, COL[key], k === 1 && w > 0.4 ? lab(key, w) : '', { min: 30 }); if (k !== 1 && w > 0.4) L.text(lab(key, w), p, y, { dx: 8, color: 'ink', size: 11.5, weight: 600 }); p += k * w; }
              else {
                const a = p + k * w, y0 = y - hh - 0.5, y1 = y - hh - 0.06;
                hatch(v, L, a, y0, p, y1, COL[key], 0.95, 5); L.rect(a, y0, p, y1, { color: COL[key], width: 1.6 });
                L.text(lab(key, w), a, (y0 + y1) / 2, { dx: -5, align: 'right', color: COL[key], size: 10.5, weight: 700 }); p = a;
              }
            }
            L.line(p, y - hh - 0.55, p, y + hh + 0.1, { color: 'ink', width: 2.4 });
            return p / k;
          };
          const e1 = row(9.55, [['C', m.C], ['I', m.I], ['G', m.G], ['NX', m.NX]], 'spending:  Y = C + I + G + NX');
          const e2 = row(7.05, [['C', m.C], ['T', m.T], ['Sp', m.Sp]], 'uses of income:  Y = C + T + Sₚ');
          L.line(Y0, 6.0, Y0, 10.75, { color: 'ink', width: 1, dash: [4, 3] }); L.text('Y = 100', Y0, 10.75, { dx: 4, color: 'ink', size: 11, weight: 600 });
          if (Math.abs(e1 - Y0) > 1e-9) { L.rect(Y0, 9.55 - hh, e1, 9.55 + hh, { color: 'red', width: 2, dash: [4, 3] }); L.text(`spending ${num(e1)} > Y`, Math.min(e1, 104), 9.55 + hh + 0.36, { align: 'right', color: 'red', size: 11, weight: 700 }); }
          L.text('cancel the common C, move G to the other side (bars below drawn 3× larger)', 48, 5.4, { align: 'center', color: 'muted', size: 11 });
          const e3 = row(3.65, [['Sp', m.Sp], ['Sg', m.Sg]], 'national saving:  Sₚ + (T − G)', 3);
          const e4 = row(1.15, [['I', m.I], ['NX', m.NX]], 'investment + net exports:  I + NX', 3);
          const ok = Math.abs(e3 - e4) < 1e-9;
          L.line(3 * e3, 0.2, 3 * e3, 4.6, { color: ok ? 'green' : 'red', width: 1.6, dash: [5, 3] });
          if (!ok) L.line(3 * e4, 0.2, 3 * e4, 4.6, { color: 'red', width: 1.6, dash: [5, 3] });
          L.text(ok ? `S = I + NX = ${num(e3, e3 % 1 ? 1 : 0)} ✓` : `${num(e3, 1)} ≠ ${num(e4, 1)}: impossible`, 3 * Math.max(e3, e4, m.Sp, m.I), 2.4, { dx: 10, color: ok ? 'green' : 'red', size: 12, weight: 700 });
          // ----- right: every term against G
          const Gx = []; for (let g = 10; g <= 34.0001; g += 0.5) Gx.push(g);
          const ser = (f) => Gx.map((g) => [g, f(model(g))]);
          R.hline(0, { color: 'ink', width: 1 });
          const lines = [['Sp', 'Sₚ', 'blue'], ['Sg', 'T−G', 'purple'], ['I', 'I', 'orange'], ['NX', 'NX', 'teal']];
          const labs = [];
          for (const [k, lab, col] of lines) { const pts = ser((q) => q[k]); R.path(pts, { color: col, width: 2.2 }); labs.push([pts[pts.length - 1][1], lab, col]); }
          const S = ser((q) => q.Sp + q.Sg), U = ser((q) => q.I + q.NX);
          R.path(S, { color: 'green', width: 3.2 }); R.path(U, { color: ok ? 'ink' : 'red', width: 1.6, dash: [6, 4] });
          labs.push([S[S.length - 1][1], ok ? 'S = I+NX' : 'S', 'green']); if (!ok) labs.push([U[U.length - 1][1], 'I+NX', 'red']);
          const pys = spread(labs.map((q) => R.Y(q[0])), 14, 10, R.height - 10);
          labs.forEach(([, lb, col], k) => R.textPx(lb, R.X(34) + 6, pys[k], { color: col, size: 11, weight: 700 }));
          R.vline(Gs.value, { color: 'accent', width: 1.2, dash: [4, 3] });
          for (const [k, , col] of lines) R.dot(Gs.value, m[k], { r: 4, color: col });
          R.dot(Gs.value, m.Sp + m.Sg, { r: 5, color: 'green' });
          st = { m, ok, e3, e4 };
        });
        v.readout(() => {
          const { m, ok } = st, f = (x) => num(x, x % 1 ? 1 : 0), p = (x) => (x < 0 ? `(${f(x)})` : f(x));
          const def = m.G - m.T, gives = { I: 'investment is crowded out one for one', NX: 'net exports fall one for one — a twin (budget and trade) deficit', C: 'consumption falls, so private saving rises one for one', mix: 'investment, net exports and consumption each absorb a third' }[ch.value];
          const head = `Budget deficit $G - T$ = ${f(def)}. $S_p + S_g$ = ${p(m.Sp)} + ${p(m.Sg)} = ${f(m.Sp + m.Sg)}; $I + NX$ = ${p(m.I)} + ${p(m.NX)} = ${f(m.I + m.NX)}`;
          if (!ok) return `${head}. With $C$, $I$ and $NX$ held fixed, spending would be ${f(m.spend)} — more than the output of 100 — and national saving no longer equals investment plus net exports. The identity rules this out: when the government buys more, some other use of output must give.`;
          return `${head} ✓. Relative to $G = 20$, ${gives}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Definition', name: 'Real versus nominal GDP and the deflator',
      statement: String.raw`**Nominal GDP** values each year's output at that year's prices, $\sum_i p_{i,t} q_{i,t}$. **Real GDP** values it at constant prices so that only quantities move: with a fixed base year $b$, $\sum_i p_{i,b}\, q_{i,t}$. The **GDP deflator** is the ratio $100 \times$ nominal / real. Real growth from $t-1$ to $t$ measured in base-year prices depends on the base year whenever relative prices change: base-year prices from the start of a comparison give a Laspeyres quantity index, from the end a Paasche index. **Chain-weighted** real GDP (used in the U.S. national accounts since 1996) instead multiplies year-to-year growth factors, each the geometric mean of the two (a Fisher index), so it no longer depends on the base year except for its level.`,
      idea: String.raw`With fixed prices, a good whose relative price falls fast — computers — is valued at its old, high price long after it became cheap; since its quantity also grows fast, early base years overstate real growth in later years and late base years understate it in earlier ones. Updating the weights every year removes most of this drift: the Fisher growth factor lies between the Laspeyres and Paasche ones and is exact for many preferences. A uniform inflation that scales every price leaves all real measures unchanged and shows up entirely in the deflator. If relative prices never change, all the indices coincide.`,
      caption: String.raw`A two-good economy, 2015–2025: computers get cheaper and more plentiful, haircuts do not. Left (log scale): nominal GDP (black) and real GDP (blue); the faint lines are real GDP for every other choice of base year, each meeting nominal GDP in its base year. Drag the **base** marker along the bottom. Right: real growth each year with this base (bars) against the chain-weighted index (green). Set the relative fall in computer prices to 0 and every method agrees; raise general inflation and only nominal GDP and the deflator move.`,
      deps: ['macro-1.1'], refs: ['Mankiw ch. 2'], tags: ['real GDP', 'index numbers'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Real_gross_domestic_product' },
      viz(v) {
        const pi = v.slider('general inflation', 0, 0.1, 0.04, { step: 0.005, fmt: (x) => `${(100 * x).toFixed(1)}%/yr` });
        const dl = v.slider('relative fall in computer prices', 0, 0.25, 0.12, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%/yr` });
        const meth = v.select('real GDP', [{ value: 'fixed', label: 'fixed base year' }, { value: 'chain', label: 'chain-weighted (Fisher)' }], 'fixed');
        const L = v.stage({ x: [2014.4, 2025.6], y: [480, 30000], ylog: true, height: 340, axes: 'box', xticks: [2015, 2017, 2019, 2021, 2023, 2025], title: 'GDP, dollars (log scale)' });
        const R = v.stage({ x: [2015.3, 2025.7], y: [-8, 26], height: 340, axes: 'box', xticks: [2016, 2018, 2020, 2022, 2024], title: 'real GDP growth, % per year' });
        const bh = L.handle(2015, 700, { color: 'blue', label: 'base', labelPos: 'e', constrain: (x) => [Math.round(clamp(x, 2015, 2025)), bh.y] });
        const yrs = Array.from({ length: 11 }, (_, t) => t);
        let st = {};
        v.legend([['ink', 'nominal GDP'], ['blue', 'real GDP (chosen method)'], ['muted', 'real GDP, other base years'], ['green', 'chain-weighted growth'], ['orange', 'deflator inflation']]);
        v.render(() => {
          const P = pi.value, D = dl.value;
          const p = (t) => [50 * (1 + P) ** t * (1 - D) ** t, 10 * (1 + P) ** t], q = (t) => [4 * (1.04 / (1 - D)) ** t, 80 * 1.02 ** t];
          const val = (pt, qt) => pt[0] * qt[0] + pt[1] * qt[1];
          const nom = yrs.map((t) => val(p(t), q(t)));
          const fixed = (b) => yrs.map((t) => val(p(b), q(t)));
          const fg = [1]; for (let t = 1; t <= 10; t++) { const La = val(p(t - 1), q(t)) / val(p(t - 1), q(t - 1)), Pa = val(p(t), q(t)) / val(p(t), q(t - 1)); fg.push(fg[t - 1] * Math.sqrt(La * Pa)); }
          const b = bh.x - 2015, chain = yrs.map((t) => (nom[b] * fg[t]) / fg[b]);
          let lo = Infinity, hi = 0; for (const sr of [nom, chain, fixed(0), fixed(10)]) for (const x of sr) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
          lo /= 1.25; hi *= 1.12; L.setView(null, [lo, hi]); bh.y = lo * (hi / lo) ** 0.07;
          const real = meth.value === 'chain' ? chain : fixed(b);
          if (meth.value === 'fixed') for (let bb = 0; bb <= 10; bb++) if (bb !== b) L.path(fixed(bb).map((y, t) => [2015 + t, y]), { color: 'muted', width: 1, alpha: 0.45 });
          L.path(nom.map((y, t) => [2015 + t, y]), { color: 'ink', width: 2.6 });
          L.path(real.map((y, t) => [2015 + t, y]), { color: 'blue', width: 2.8 });
          L.dots(nom.map((y, t) => [2015 + t, y]), { r: 2.6, color: 'ink' }); L.dots(real.map((y, t) => [2015 + t, y]), { r: 2.6, color: 'blue' });
          L.vline(2015 + b, { color: 'blue', width: 1, dash: [3, 3], alpha: 0.6 });
          L.dot(2015 + b, nom[b], { r: 5, color: 'blue', hollow: true });
          L.text('nominal', 2025, nom[10], { dx: -4, dy: 18, align: 'right', color: 'ink', size: 11.5, weight: 700 });
          L.text('real', 2025, real[10], { dx: -4, dy: -12, align: 'right', color: 'blue', size: 11.5, weight: 700 });
          // growth rates
          const gr = (s, t) => 100 * (s[t] / s[t - 1] - 1);
          { let lo = -2, hi = 8; for (const sr of [real, chain, nom.map((x, t) => x / real[t])]) for (let t = 1; t <= 10; t++) { const g = gr(sr, t); lo = Math.min(lo, g); hi = Math.max(hi, g); } R.setView(null, [Math.floor(lo - 1), Math.ceil(hi * 1.12 + 1)]); }
          R.hline(0, { color: 'ink', width: 1 });
          for (let t = 1; t <= 10; t++) {
            const g = gr(real, t); R.rect(2015 + t - 0.32, 0, 2015 + t + 0.32, g, { fill: 'blue', fillAlpha: 0.5, color: 'blue', width: 1 });
          }
          const cg = yrs.slice(1).map((t) => [2015 + t, 100 * (fg[t] / fg[t - 1] - 1)]);
          R.path(cg, { color: 'green', width: 2.4 }); R.dots(cg, { r: 3.4, color: 'green' });
          const defl = yrs.map((t) => nom[t] / real[t]), di = yrs.slice(1).map((t) => [2015 + t, 100 * (defl[t] / defl[t - 1] - 1)]);
          R.path(di, { color: 'orange', width: 2, dash: [5, 3] });
          const avg = (s) => 100 * ((s[10] / s[0]) ** 0.1 - 1);
          st = { b, a15: avg(fixed(0)), a25: avg(fixed(10)), ach: avg(chain), anom: avg(nom), adef: 100 * ((defl[10] / defl[0]) ** 0.1 - 1), D, method: meth.value };
        });
        v.readout(() => {
          const { b, a15, a25, ach, anom, adef, D, method } = st, f = (x) => `${x < 0 ? '−' : ''}${Math.abs(x).toFixed(2)}%`;
          const kind = method === 'chain' ? `chain-weighted, referenced to ${2015 + b}` : b === 0 ? 'base 2015: a Laspeyres quantity index' : b === 10 ? 'base 2025: a Paasche quantity index' : `base year ${2015 + b}`;
          const tail = D === 0 ? ' Relative prices never change, so every base year and the chain index give the same real growth.' : ` The answer depends on the base year by ${(a15 - a25).toFixed(1)} points a year because the relative price of computers changes.`;
          return `Average real growth 2015–2025: base 2015 **${f(a15)}**, base 2025 **${f(a25)}**, chain-weighted **${f(ach)}**; nominal GDP ${f(anom)}. Shown: ${kind}, with deflator inflation ${f(adef)}/yr.${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Definition', name: 'The consumer price index',
      statement: String.raw`The **consumer price index** (CPI) measures the cost of a fixed basket of goods and services bought by a typical household, relative to its cost in a base period:
$$\mathrm{CPI}_t = 100 \times \frac{\sum_i p_{i,t}\, q_{i,0}}{\sum_i p_{i,0}\, q_{i,0}},$$
a Laspeyres price index; its percentage change is the measured **inflation rate**. Because the basket is fixed, the CPI ignores that households substitute toward goods that have become relatively cheaper, and so **overstates** the rise in the cost of living (substitution bias; new goods and unmeasured quality change bias it the same way). It differs from the GDP deflator, a Paasche index over everything produced at home: the CPI includes imported consumer goods (petrol), excludes investment goods, and keeps its weights fixed.`,
      idea: String.raw`The true cost-of-living index asks how much money buys the base-period level of well-being at today's prices. The old basket is one way of reaching that level, so it costs at least as much as the cheapest way — the Laspeyres index is an upper bound (micro 6.7), with equality only when no substitution is possible. Chained indices that update the weights each period (a Törnqvist or Fisher chain, as in the U.S. chained CPI since 2002) track the cost of living closely. A rise in import prices raises the CPI but not the deflator; falling prices of machines lower the deflator but not the CPI.`,
      caption: String.raw`Beef gets dearer each year; chicken, petrol and rent rise slowly. Left: the base-year basket at year-$t$ prices (what the CPI prices) against the cheapest basket that leaves shoppers as well off (the true cost of living); the red-hatched gap is the substitution bias. Right: the four indices over ten years; click a year to show its baskets. Set **switching** $\sigma = 0$ (no substitution) and the CPI is exact; turn on the **oil shock** and watch the CPI jump while the GDP deflator does not.`,
      deps: ['macro-1.6', 'micro-6.7'], refs: ['Mankiw ch. 2', 'CORE Macro U4'], tags: ['inflation', 'index numbers'],
      credit: 'Étienne Laspeyres, 1871; Boskin Commission on CPI bias, 1996',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consumer_price_index' },
      viz(v) {
        const sg = v.slider('switching between beef and chicken $\\sigma$', 0, 3, 2, { step: 0.05 });
        const gb = v.slider('beef price inflation', 0, 0.15, 0.1, { step: 0.005, fmt: (x) => `${(100 * x).toFixed(1)}%/yr` });
        const oil = v.toggle('oil shock in 2020 (petrol +50%)', false);
        const L = v.stage({ x: [-2, 182], y: [0, 3.5], height: 330, axes: 'box', yticks: [], weight: 1.15, minWidth: 330, xticks: [0, 50, 100, 150], title: 'what each index prices' });
        const R = v.stage({ x: [2014.6, 2028.3], y: [90, 200], height: 330, axes: 'box', weight: 1, minWidth: 280, xticks: [2015, 2017, 2019, 2021, 2023, 2025], title: 'price indices, 2015 = 100 — click a year' });
        const yh = { x: 2021 };
        R.onDrag((x) => { yh.x = Math.round(clamp(x, 2015, 2025)); });
        const GOODS = ['beef', 'chicken', 'petrol', 'rent'], GC = ['pink', 'gold', 'gray', 'teal'], q0 = [20, 20, 15, 45];
        let st = {};
        v.legend([['red', 'CPI (fixed 2015 basket)'], ['green', 'true cost of living'], ['gold', 'chained CPI'], ['purple', 'GDP deflator']]);
        v.render(() => {
          const s = Math.abs(sg.value - 1) < 1e-4 ? 1 + 1e-4 : sg.value, g = gb.value;
          const price = (t) => [(1 + g) ** t, 1.01 ** t, 1.03 ** t * (oil.value && t >= 5 ? 1.5 : 1), 1.03 ** t, 0.97 ** t]; // beef, chicken, petrol, rent, machines
          const Pm = (p) => (0.5 * p[0] ** (1 - s) + 0.5 * p[1] ** (1 - s)) ** (1 / (1 - s));
          const col = (p) => Pm(p) ** 0.4 * p[2] ** 0.15 * p[3] ** 0.45;
          const qty = (p) => { const E = 100 * col(p), um = (0.4 * E) / Pm(p); return [um * 0.5 * (p[0] / Pm(p)) ** -s, um * 0.5 * (p[1] / Pm(p)) ** -s, (0.15 * E) / p[2], (0.45 * E) / p[3]]; };
          const T = Array.from({ length: 11 }, (_, t) => t), P = T.map(price), Q = P.map(qty);
          const cpi = P.map((p) => (100 * sum(q0.map((q, i) => q * p[i]))) / 100), cl = P.map((p) => 100 * col(p));
          const sh = (t) => { const e = Q[t].map((q, i) => q * P[t][i]), E = sum(e); return e.map((x) => x / E); };
          const ch = [100]; for (let t = 1; t <= 10; t++) { const a = sh(t - 1), b = sh(t); ch.push(ch[t - 1] * Math.exp(sum([0, 1, 2, 3].map((i) => 0.5 * (a[i] + b[i]) * Math.log(P[t][i] / P[t - 1][i]))))); }
          const mach = (t) => 25 * 1.04 ** t, dom = [0, 1, 3];
          const defl = T.map((t) => (100 * (sum(dom.map((i) => P[t][i] * Q[t][i])) + P[t][4] * mach(t))) / (sum(dom.map((i) => Q[t][i])) + mach(t)));
          const ser = [[cl, 'green', 'true cost'], [cpi, 'red', 'CPI'], [ch, 'gold', 'chained'], [defl, 'purple', 'deflator']];
          const t = yh.x - 2015;
          R.vline(yh.x, { color: 'accent', width: 1, dash: [4, 3] });
          R.hline(100, { color: 'muted', width: 1, dash: [3, 3] });
          if (oil.value) R.vband(2019.5, 2020.5, { color: 'gray', alpha: 0.12 });
          ser.forEach(([s0, c]) => { R.path(s0.map((y, k) => [2015 + k, y]), { color: c, width: c === 'green' ? 4.2 : c === 'gold' ? 1.8 : 2.4, dash: c === 'gold' ? [6, 4] : null }); R.dot(yh.x, s0[t], { r: c === 'green' ? 5.5 : 4, color: c }); });
          R.text(String(yh.x), yh.x, 196, { dx: 6, color: 'accent', size: 11.5, weight: 700, baseline: 'top' });
          const ends = ser.map(([s0, c, n]) => [s0[10], c, n]).sort((a, b) => b[0] - a[0]);
          const pys = spread(ends.map((e) => R.Y(e[0])), 13, 8, R.height - 8);
          ends.forEach(([, c, n], k) => R.textPx(n, R.X(2025) + 6, pys[k], { color: c, size: 10.5, weight: 700 }));
          // ----- baskets at year-t prices
          const rows = [[2.85, 'base year: 2015 basket at 2015 prices', P[0], q0], [1.75, `${yh.x}: the 2015 basket at ${yh.x} prices (CPI)`, P[t], q0], [0.65, `${yh.x}: cheapest basket as good as 2015's`, P[t], Q[t]]];
          for (const [y, lab, p, q] of rows) {
            L.text(lab, 0, y + 0.44, { color: 'ink', size: 11, weight: 650 });
            let x = 0; q.forEach((qq, i) => { const w = qq * p[i]; hseg(L, x, w, y, 0.26, GC[i], GOODS[i], { size: 10.5, min: 44 }); x += w; });
            L.text(num(x, 1), x, y, { dx: 6, color: 'ink', size: 12, weight: 700 });
          }
          hatch(v, L, cl[t], 1.75 - 0.26, cpi[t], 1.75 + 0.26, 'red', 0.8, 5);
          if (cpi[t] - cl[t] > 0.05) L.rect(cl[t], 1.75 - 0.26, cpi[t], 1.75 + 0.26, { color: 'red', width: 1.4 });
          L.vline(100, { color: 'muted', width: 1, dash: [3, 3] });
          st = { t, y: yh.x, cpi, cl, ch, defl, s: sg.value, rq: Q[t].map((x, i) => x / q0[i]) };
        });
        v.readout(() => {
          const { t, y, cpi, cl, ch, defl, s, rq } = st, f = (x) => x.toFixed(1), rate = (a) => (t > 0 ? `${(100 * (a[t] / a[t - 1] - 1)).toFixed(1)}%` : '—');
          const bias = cpi[t] - cl[t], perYr = t > 0 ? 100 * ((cpi[t] / cl[t]) ** (1 / t) - 1) : 0;
          return `**${y}**: CPI ${f(cpi[t])} (inflation this year ${rate(cpi)}), true cost of living ${f(cl[t])} (${rate(cl)}), chained CPI ${f(ch[t])}, GDP deflator ${f(defl[t])} (${rate(defl)}). The fixed basket overstates the cost of living by ${f(bias)} points — ${perYr.toFixed(2)} percentage points of inflation a year${s === 0 ? ': with $\\sigma = 0$ nobody switches, so there is no bias' : `, because shoppers switch from beef to chicken (they now buy ${rq[0].toFixed(2)}× as much beef and ${rq[1].toFixed(2)}× as much chicken as in 2015)`}.${oil.value && t >= 5 ? ' Petrol is imported: the oil shock is in the CPI but not in the deflator, which prices only domestic output (including machines, whose prices fall).' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Definition', name: 'Unemployment and labour-force flows',
      statement: String.raw`The adult population is divided into the **employed** $E$ (worked for pay in the reference week), the **unemployed** $U$ (without work, available, and actively searching), and those **not in the labour force** $N$ (students, retirees, carers, discouraged workers). The **labour force** is $L = E + U$, the **unemployment rate** is $u = U/L$ and the **participation rate** is $L/(E + U + N)$. Each month people move between the three states; if the monthly transition probabilities stay constant, the shares converge to a **steady state** — the stationary distribution of the three-state Markov chain — at which every stock's inflows equal its outflows. Ignoring moves in and out of the labour force, the steady-state rate is $u^* = s/(s + f)$, with $s$ the job-loss rate and $f$ the job-finding rate (2.4).`,
      idea: String.raw`The unemployment rate is a ratio of stocks fed by flows. A stock stops changing when what flows in equals what flows out — for unemployment, $sE + (\text{entrants from } N) = fU + (\text{exits to } N)$ — and solving the balance for all three stocks gives the stationary distribution (stoch 4.1). Because the gross flows are large (a quarter of the unemployed find a job in a typical U.S. month), the stocks approach the steady state within months. The definition has a blind spot: someone who stops searching leaves $U$ for $N$, so a wave of discouragement lowers the unemployment rate even though nobody found a job — which is why the participation rate is read alongside it.`,
      caption: String.raw`A simulated population of 1,000 adults, each dot a person; every month each person moves between the boxes with the probabilities on the arrows (the job-finding, job-loss and giving-up rates are sliders; the others are fixed). The economy starts in a slump with 10% unemployment; the charts show the unemployment and participation rates converging to their steady states (dashed). Press **half the unemployed give up searching**: the unemployment rate drops at once, though nobody found work.`,
      deps: ['stoch-4.1'], refs: ['Mankiw ch. 2', 'Mankiw ch. 7'], tags: ['unemployment', 'labour market'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Unemployment#Measurement' },
      viz(v) {
        const D = v.stage({ x: [0, 100], y: [0, 60], height: 330, axes: false, full: true });
        const Us = v.stage({ x: [0, 120], y: [0, 14], height: 190, axes: 'box', xticks: [0, 24, 48, 72, 96, 120], yticks: [0, 4, 8, 12], title: 'unemployment rate $U/(E+U)$, %', xlabel: 'month' });
        const Ps = v.stage({ x: [0, 120], y: [50, 70], height: 190, axes: 'box', xticks: [0, 24, 48, 72, 96, 120], yticks: [50, 55, 60, 65, 70], title: 'participation rate $(E+U)/\\text{population}$, %', xlabel: 'month' });
        const pm = (x) => `${(100 * x).toFixed(1)}%/mo`;
        const fS = v.slider('job-finding rate $f$ (U → E)', 0.05, 0.6, 0.25, { step: 0.01, fmt: pm });
        const sS = v.slider('job-loss rate $s$ (E → U)', 0.005, 0.05, 0.015, { step: 0.001, fmt: pm });
        const qS = v.slider('giving up searching (U → N)', 0, 0.4, 0.15, { step: 0.01, fmt: pm });
        const FIX = { EN: 0.025, NE: 0.04, NU: 0.025 }, POP = 1000, SPEED = 3, MONTHS = 120;
        let hist, rng, events, pending = false, lastT = -1;
        const reset = () => { hist = [{ E: 560, U: 62, N: 378 }]; rng = v.rng(2024); events = []; };
        reset();
        v.button('Half the unemployed give up searching', () => { pending = true; v.play(); });
        const rates = () => ({ EU: sS.value, EN: FIX.EN, UE: fS.value, UN: qS.value, NE: FIX.NE, NU: FIX.NU });
        const stepOnce = () => {
          const k = hist.length - 1, st = hist[k], R = rates(), F = { EU: 0, EN: 0, UE: 0, UN: 0, NE: 0, NU: 0 };
          const draw = (n, a, b, ka, kb) => { for (let i = 0; i < n; i++) { const x = rng(); if (x < R[ka]) F[ka]++; else if (x < R[ka] + R[kb]) F[kb]++; } };
          draw(st.E, 'E', 'U', 'EU', 'EN'); draw(st.U, 'U', 'E', 'UE', 'UN'); draw(st.N, 'N', 'E', 'NE', 'NU');
          st.F = F;
          hist.push({ E: st.E - F.EU - F.EN + F.UE + F.NE, U: st.U - F.UE - F.UN + F.EU + F.NU, N: st.N - F.NE - F.NU + F.EN + F.UN });
        };
        const steady = () => {
          const R = rates(), P = [[1 - R.EU - R.EN, R.EU, R.EN], [R.UE, 1 - R.UE - R.UN, R.UN], [R.NE, R.NU, 1 - R.NE - R.NU]];
          const A = [[P[0][0] - 1, P[1][0], P[2][0]], [P[0][1], P[1][1] - 1, P[2][1]], [1, 1, 1]];
          const [e, u, n] = v.M.solve(A, [0, 0, 1]); return { e, u, n, rate: u / (e + u), part: e + u };
        };
        const BOX = { E: [3, 4, 40, 55, 'employed'], U: [57, 35, 80, 55, 'unemployed'], N: [55, 4, 97, 27, 'not in the labour force'] };
        const COLS = { E: 'green', U: 'red', N: 'gray' };
        // slot positions (px) inside a box, filled bottom-up
        const slots = (key) => {
          const [x0, y0, x1, y1] = BOX[key], X0 = D.X(x0) + 7, X1 = D.X(x1) - 7, Yb = D.Y(y0) - 7, Yt = D.Y(y1) + 22, sp = 8.6, out = [];
          const nc = Math.max(1, Math.floor((X1 - X0) / sp)), nr = Math.max(1, Math.floor((Yb - Yt) / sp));
          for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) out.push([X0 + (c + 0.5) * ((X1 - X0) / nc), Yb - (r + 0.5) * sp]);
          return out;
        };
        const ARC = { EU: [[40, 49], [49, 57], [57, 50]], UE: [[57, 41], [49, 36], [40, 42]], EN: [[40, 19], [48, 24], [55, 20]], NE: [[55, 11], [48, 5], [40, 11]], UN: [[64, 35], [61, 31], [64, 27]], NU: [[73, 27], [76, 31], [73, 35]] };
        const LAB = { EU: [49, 56.3, 's'], UE: [49, 35.8, 'f'], EN: [47.5, 25.2, ''], NE: [47.5, 3.6, ''], UN: [59.3, 31, ''], NU: [78.2, 31, ''] };
        v.legend([['green', 'employed', { dot: true }], ['red', 'unemployed', { dot: true }], ['gray', 'not in the labour force', { dot: true }], ['ink', 'steady state', { dash: true }]]);
        let state = null;
        v.animate((t) => {
          if (t < lastT) reset(); lastT = t;
          const m = Math.min(t * SPEED, MONTHS - 1e-6), k = Math.floor(m), ph = m - k;
          while (hist.length <= k + 1) stepOnce();
          if (pending) { // discourage half the unemployed at the start of the current month
            pending = false; const st = hist[k], g = Math.floor(st.U / 2);
            hist.length = k + 1; hist[k] = { E: st.E, U: st.U - g, N: st.N + g }; events.push([k, st.U, g]); stepOnce();
          }
          const st = hist[k], F = st.F, R = rates(), ss = steady();
          // movers in flight: each flow's people leave during the first 60% of the month and take 40% of it to travel
          const prog = (i, n) => clamp((ph - (0.6 * i) / Math.max(1, n)) / 0.4, 0, 1);
          const gone = { E: 0, U: 0, N: 0 }, came = { E: 0, U: 0, N: 0 }, fly = [];
          for (const key in F) { const a = key[0], b = key[1], n = F[key]; for (let i = 0; i < n; i++) { const p = prog(i, n); if (p > 0) gone[a]++; if (p >= 1) came[b]++; else if (p > 0) fly.push([key, p, b]); } }
          // arrows with rates
          for (const key in ARC) {
            const [p0, c, p1] = ARC[key], pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * c[0] + u * u * p1[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * c[1] + u * u * p1[1]]); }
            const flow = R[key] * st[key[0]], w = clamp(flow * 0.32, 1.2, 9);
            D.path(pts, { color: COLS[key[1]], width: w, alpha: 0.28 });
            D.arrow(pts[20][0], pts[20][1], p1[0], p1[1], { color: COLS[key[1]], width: 1.4, head: 7, alpha: 0.7 });
            const [lx, ly, nm] = LAB[key]; D.text(`${nm ? nm + ' = ' : ''}${(100 * R[key]).toFixed(1)}%`, lx, ly, { align: 'center', color: COLS[key[1]], size: 10.5, weight: 650 });
          }
          // boxes and resident dots
          const pos = {};
          for (const key of ['E', 'U', 'N']) {
            const [x0, y0, x1, y1, name] = BOX[key];
            rbox(v, D, x0, y0, x1, y1, { fill: COLS[key], fillAlpha: 0.06, color: COLS[key], width: 1.4 });
            const n = st[key] - gone[key] + came[key], sl = slots(key); pos[key] = sl;
            const pts = []; for (let i = 0; i < n; i++) { const s0 = sl[i % sl.length]; pts.push(D.inv(s0[0], s0[1])); }
            D.dots(pts, { r: 2.7, color: COLS[key], alpha: 0.85 });
            D.text(`${name}  ${n}`, (x0 + x1) / 2, y1, { dy: 11, align: 'center', color: 'ink', size: 12, weight: 700 });
          }
          // people in flight
          for (const [key, p] of fly) {
            const [p0, c, p1] = ARC[key], e = p * p * (3 - 2 * p);
            D.dot((1 - e) ** 2 * p0[0] + 2 * e * (1 - e) * c[0] + e * e * p1[0], (1 - e) ** 2 * p0[1] + 2 * e * (1 - e) * c[1] + e * e * p1[1], { r: 3.4, color: COLS[key[1]] });
          }
          // time series
          const uS = [], pS = [];
          for (let i = 0; i <= k; i++) { const h = hist[i]; uS.push([i, (100 * h.U) / (h.E + h.U)]); pS.push([i, (100 * (h.E + h.U)) / POP]); }
          const now = { E: st.E - gone.E + came.E, U: st.U - gone.U + came.U, N: st.N - gone.N + came.N };
          uS.push([m, (100 * now.U) / (now.E + now.U)]); pS.push([m, (100 * (now.E + now.U)) / POP]);
          Us.hline(100 * ss.rate, { color: 'ink', width: 1.2, dash: [5, 4] }); Ps.hline(100 * ss.part, { color: 'ink', width: 1.2, dash: [5, 4] });
          Us.path(uS, { color: 'red', width: 2.2 }); Ps.path(pS, { color: 'blue', width: 2.2 });
          Us.dot(m, uS[uS.length - 1][1], { r: 4, color: 'red' }); Ps.dot(m, pS[pS.length - 1][1], { r: 4, color: 'blue' });
          Us.text(`steady state ${(100 * ss.rate).toFixed(1)}%`, 118, 100 * ss.rate, { dy: -9, align: 'right', color: 'ink', size: 10.5 });
          Ps.text(`steady state ${(100 * ss.part).toFixed(1)}%`, 118, 100 * ss.part, { dy: -9, align: 'right', color: 'ink', size: 10.5 });
          for (const [ek] of events) { Us.vline(ek, { color: 'gray', width: 1.2, dash: [3, 3] }); Ps.vline(ek, { color: 'gray', width: 1.2, dash: [3, 3] }); Us.text('give up', ek, 13.2, { dx: 4, color: 'gray', size: 10 }); }
          state = { k, now, ss, R };
        }, { period: MONTHS / SPEED + 2, still: 16 });
        v.readout(() => {
          if (!state) return '';
          const { k, now, ss, R } = state, L = now.E + now.U, f1 = (x) => (100 * x).toFixed(1);
          const ev = events.length ? ` Month ${events[events.length - 1][0]}: ${events[events.length - 1][2]} unemployed people stopped searching — they moved to "not in the labour force", so the unemployment rate fell although nobody found a job, and participation fell with it.` : '';
          return `Month ${k}: employed ${now.E}, unemployed ${now.U}, not in the labour force ${now.N}. Unemployment rate $U/L$ = ${now.U}/${L} = **${f1(now.U / L)}%**, participation ${f1(L / POP)}%. Steady state of the three-state chain: $u^*$ = **${f1(ss.rate)}%**, participation ${f1(ss.part)}% (ignoring the labour-force exits, $s/(s+f)$ = ${f1(R.EU / (R.EU + R.UE))}%).${ev}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Concept', name: 'What GDP leaves out',
      statement: String.raw`GDP measures market production, not well-being. It leaves out or misweights: **leisure** (a country that produces as much with fewer hours is better off); **home production** (cooking, childcare and cleaning count only when bought); the **distribution** of income (the same average can mean very different lives); the **depletion of natural resources** and environmental damage (selling oil from the ground counts as income although it runs down wealth); and depreciation, health and longevity, and the value of new goods. Adjusted measures — Nordhaus and Tobin's measure of economic welfare, net domestic product, genuine savings, the consumption-equivalent welfare of Jones and Klenow — add or subtract these items and can reorder countries substantially.`,
      idea: String.raw`GDP counts what passes through markets at market prices (1.1), so anything without a price is either imputed or ignored, and averages hide spread. Each adjustment needs a valuation: hours of leisure at the wage, home production at what it would cost to buy, depletion at the value of the resources used up, and inequality through a social welfare function — here Atkinson's equally distributed equivalent income $\bar y\,(1 - A_\varepsilon)$, which for log-normal incomes with Gini $G$ is $\bar y\, e^{-\varepsilon\sigma^2/2}$ with $\sigma = \sqrt2\,\Phi^{-1}\!\big(\tfrac{1+G}{2}\big)$. The ranking that results depends on these choices, which is why statistical offices publish GDP and leave welfare to dashboards.`,
      caption: String.raw`Six hypothetical countries with stylized numbers (not data). Left: ranked by GDP per head (left column) and by the adjusted measure (right column); click a country to see its adjustments as a waterfall on the right. Toggle each adjustment and watch the rankings cross: the oil exporter falls once depletion is subtracted, the short-hours and egalitarian countries rise once leisure and inequality count. The slider sets how much inequality is penalized ($\varepsilon = 0$: not at all).`,
      deps: ['macro-1.1'], refs: ['Mankiw ch. 2', 'CORE Macro U3'], tags: ['GDP', 'welfare'],
      credit: 'William Nordhaus and James Tobin, 1972; Charles Jones and Peter Klenow, 2016',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Measures_of_national_income_and_output#Criticism' },
      viz(v) {
        const S = v.stage({ x: [-1.05, 2.05], y: [0.35, 7.0], height: 360, axes: false, weight: 1.15, minWidth: 330, title: 'rank by GDP per head → rank by adjusted measure' });
        const W = v.stage({ x: [0.35, 6.65], y: [0, 100], height: 360, axes: 'box', weight: 1, minWidth: 290, xticks: [[1, 'GDP'], [2, 'leisure'], [3, 'home'], [4, 'depletion'], [5, 'inequality'], [6, 'adjusted']], yticks: [0, 20, 40, 60, 80], ylabel: 'thousand $ per head' });
        const tL = v.toggle('value leisure', true), tH = v.toggle('add home production', true), tD = v.toggle('subtract resource depletion', true), tI = v.toggle('penalize inequality', true);
        const eps = v.slider('inequality aversion $\\varepsilon$', 0, 3, 1, { step: 0.05 });
        const C = [
          { id: 'A', name: 'A · long hours', y: 68, H: 1790, h: 0.17, G: 0.39, d: 0.01, col: 'blue' },
          { id: 'B', name: 'B · short hours', y: 54, H: 1450, h: 0.22, G: 0.29, d: 0.006, col: 'orange' },
          { id: 'C', name: 'C · oil exporter', y: 74, H: 1680, h: 0.15, G: 0.37, d: 0.16, col: 'purple' },
          { id: 'D', name: 'D · egalitarian', y: 61, H: 1420, h: 0.18, G: 0.26, d: 0.02, col: 'teal' },
          { id: 'E', name: 'E · emerging', y: 31, H: 2150, h: 0.22, G: 0.45, d: 0.04, col: 'pink' },
          { id: 'F', name: 'F · home production', y: 26, H: 1880, h: 0.42, G: 0.33, d: 0.03, col: 'gold' },
        ];
        const N01 = v.M.dist.normal(0, 1);
        let sel = 2, st = {};
        const adj = (c) => {
          const lei = tL.value ? (0.6 * c.y * (1800 - c.H)) / c.H : 0, home = tH.value ? c.h * c.y : 0, dep = tD.value ? -c.d * c.y : 0;
          const sub = c.y + lei + home + dep, sig = Math.SQRT2 * N01.quantile((1 + c.G) / 2), A = tI.value ? 1 - Math.exp((-eps.value * sig * sig) / 2) : 0;
          return { lei, home, dep, ineq: -A * sub, total: sub * (1 - A), A };
        };
        const rankOf = (vals) => { const o = vals.map((x, i) => i).sort((a, b) => vals[b] - vals[a]), r = []; o.forEach((i, k) => (r[i] = k + 1)); return r; };
        S.onClick((x, y) => { let best = -1, bd = 1e9; C.forEach((c, i) => { for (const [cx, cy] of [[0, 7 - st.r0[i]], [1, 7 - st.r1[i]]]) { const d = Math.hypot(S.X(x) - S.X(cx), S.Y(y) - S.Y(cy)); if (d < bd) { bd = d; best = i; } } }); if (bd < 60) sel = best; });
        v.legend(C.map((c) => [c.col, c.name, { dot: true }]));
        v.render(() => {
          const A = C.map(adj), g = C.map((c) => c.y), a = A.map((q) => q.total), r0 = rankOf(g), r1 = rankOf(a);
          st = { A, r0, r1 };
          S.text('GDP per head', 0, 6.82, { align: 'center', color: 'muted', size: 11, weight: 650 }); S.text('adjusted', 1, 6.82, { align: 'center', color: 'muted', size: 11, weight: 650 });
          C.forEach((c, i) => {
            const on = i === sel, y0 = 7 - r0[i], y1 = 7 - r1[i];
            S.line(0, y0, 1, y1, { color: c.col, width: on ? 4 : 2, alpha: on ? 1 : 0.5 });
            S.dot(0, y0, { r: on ? 7 : 5.5, color: c.col }); S.dot(1, y1, { r: on ? 7 : 5.5, color: c.col });
            S.text(`${c.name}  ${num(c.y, 1)}`, 0, y0, { dx: -12, align: 'right', color: on ? 'ink' : 'muted', size: 11.5, weight: on ? 700 : 500 });
            S.text(`${num(a[i], 1)}  ${c.id}`, 1, y1, { dx: 12, color: on ? 'ink' : 'muted', size: 11.5, weight: on ? 700 : 500 });
          });
          // waterfall for the selected country
          const c = C[sel], q = A[sel], steps = [['GDP', c.y, 'blue', true], ['leisure', q.lei, null, tL.value], ['home', q.home, null, tH.value], ['depletion', q.dep, null, tD.value], ['inequality', q.ineq, null, tI.value]];
          let lev = 0;
          steps.forEach(([nm, val, col, on], k) => {
            const x = k + 1;
            if (!on) { W.text('off', x, lev, { align: 'center', dy: -10, color: 'muted', size: 11 }); W.line(x - 0.3, lev, x + 0.3, lev, { color: 'muted', width: 1, dash: [3, 3] }); return; }
            const a0 = k === 0 ? 0 : lev, a1 = k === 0 ? val : lev + val, cc = col || (val >= 0 ? 'green' : 'red');
            W.rect(x - 0.3, a0, x + 0.3, a1, { fill: cc, fillAlpha: 0.6, color: cc, width: 1.2 });
            W.text(`${k === 0 ? '' : val >= 0 ? '+' : '−'}${num(Math.abs(val), 1)}`, x, Math.max(a0, a1), { align: 'center', dy: -9, color: cc, size: 11, weight: 700 });
            if (k < 4) W.line(x + 0.3, a1, x + 0.7, a1, { color: 'muted', width: 1, dash: [2, 2] });
            lev = a1;
          });
          W.rect(6 - 0.3, 0, 6 + 0.3, q.total, { fill: c.col, fillAlpha: 0.75, color: c.col, width: 1.4 });
          W.text(num(q.total, 1), 6, q.total, { align: 'center', dy: -9, color: 'ink', size: 11.5, weight: 700 });
          W.setTitle(`${c.name}: from GDP to the adjusted measure`);
        });
        v.readout(() => {
          const { A, r0, r1 } = st, c = C[sel], q = A[sel], f = (x) => num(x, 1);
          const ord = (r) => C.map((cc, i) => [r[i], cc.id]).sort((x, y) => x[0] - y[0]).map((x) => x[1]).join(' > ');
          const d2 = sum(C.map((cc, i) => (r0[i] - r1[i]) ** 2)), rho = 1 - (6 * d2) / (6 * 35);
          return `Ranking by GDP per head: ${ord(r0)}; by the adjusted measure: ${ord(r1)} (Spearman rank correlation ${rho.toFixed(2)}). **${c.name}**: GDP ${f(c.y)}k; hours ${num(c.H)} a year → leisure ${q.lei >= 0 ? '+' : '−'}${f(Math.abs(q.lei))}; home production ${f(q.home)}; depletion ${f(q.dep)}; Gini ${c.G.toFixed(2)} → Atkinson index ${q.A.toFixed(3)} → inequality ${f(q.ineq)}; adjusted **${f(q.total)}k**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Phenomenon', name: 'The hockey stick of world income',
      statement: String.raw`For most of recorded history, GDP per head grew so slowly that it was nearly flat: estimates for the richest economies of 1500 are only two or three times those of the poorest, and average incomes in 1820 were not far above those of a millennium earlier. Beginning in Britain and its offshoots around 1800 and spreading to Western Europe, then to Japan, Latin America and, after 1950, to East and South Asia, income per head started to grow at 1–3% a year, compounding into a twenty-fold or larger rise by today. Plotted on a linear axis the series look like a hockey stick; on a log axis, where constant growth is a straight line, the timing of each country's take-off and the divergence between countries become visible.`,
      scope: String.raw`Before about 1850 the figures are reconstructions from wages, prices, output of key sectors and urbanization, with wide error bands; the earliest points cover only parts of today's countries (for example England, Holland, central-northern Italy). Purchasing-power comparisons across centuries are approximate.`,
      idea: String.raw`Under steady growth $g$, income is $y_0 e^{gt}$: at 0.1% a year it takes 700 years to double, at 2% only 35 (the rule of 70). A linear axis gives the latest doubling the same visual weight as all earlier history, hence the blade of the stick; a log axis shows growth rates as slopes (1.6 measures each point in constant prices). The Malthusian forces that kept income near subsistence and the escape from them are the subject of 4.6–4.7; the different take-off dates are the raw material for the growth theories of chapters 3–4.`,
      caption: String.raw`GDP per head in 2011 international dollars from the Maddison Project Database 2023 (Bolt and van Zanden), thinned to decades before 1950. Switch the vertical axis between **linear** and **log**, and between countries with long records and world regions (from 1820). Drag the two markers on the time axis to measure average growth between any two years; the map shows each series in the second marker's year (bubble area ∝ income). Hollow rings mark take-off: the year from which income stays above twice its 1700 level (1820 for regions).`,
      deps: ['macro-1.6', 'demo-1.4'], refs: ['CORE Macro U9'], tags: ['growth', 'economic history'],
      credit: 'Angus Maddison, 1995–2010; Maddison Project (Bolt and van Zanden), 2023 update',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Great_Divergence' },
      viz(v) {
        const T = v.stage({ x: [995, 2032], y: [0, 62000], height: 330, axes: 'box', full: true, ylabel: 'GDP per head (2011 int. $)', xticks: [1000, 1200, 1400, 1600, 1800, 2000], title: 'GDP per head, year 1000 to 2022' });
        const Mp = v.stage({ height: 270, full: true });
        const G = v.globe(Mp, { projection: 'robinson', center: [12, 0], graticule: 30, drag: false });
        const ax = v.select('vertical axis', ['linear', 'log'], 'linear', { onChange: (x) => T.setScale(x === 'log' ? { ylog: true, y: [380, 90000] } : { ylog: false, y: [0, 62000] }) });
        const set = v.select('series', [{ value: 'c', label: 'countries with long records' }, { value: 'r', label: 'world regions (from 1820)' }], 'c');
        const SER = {
          c: [['uk', 'Britain', 'blue', [-2, 53]], ['nl', 'Netherlands', 'orange', [5.3, 52.2]], ['it', 'Italy', 'teal', [12.5, 42.8]], ['us', 'United States', 'purple', [-98, 39]], ['jp', 'Japan', 'pink', [138, 36]], ['cn', 'China', 'red', [104, 34]], ['in', 'India', 'gold', [79, 22]]],
          r: [['world', 'World', 'ink', null], ['wof', 'Western offshoots', 'purple', [-100, 42]], ['weu', 'Western Europe', 'blue', [6, 48]], ['eeu', 'Eastern Europe', 'teal', [42, 54]], ['lat', 'Latin America', 'orange', [-60, -12]], ['mena', 'Middle East & N. Africa', 'gold', [22, 27]], ['eas', 'East Asia', 'red', [114, 33]], ['sas', 'South & SE Asia', 'pink', [88, 16]], ['ssa', 'Sub-Saharan Africa', 'green', [22, -2]]],
        };
        const pts = {}; for (const k in MPD) { const a = MPD[k], o = []; for (let i = 0; i < a.length; i += 2) o.push([a[i], a[i + 1]]); pts[k] = o; }
        const at = (k, yr) => { const p = pts[k]; if (yr < p[0][0] || yr > p[p.length - 1][0]) return null; let i = 1; while (i < p.length - 1 && p[i][0] < yr) i++; const [x0, y0] = p[i - 1], [x1, y1] = p[i]; const u = x1 === x0 ? 0 : (yr - x0) / (x1 - x0); return y0 * (y1 / y0) ** u; };
        const takeoff = (k, base) => { const b = at(k, base); if (b == null) return null; let last = base; for (let yr = base; yr <= 2022; yr++) { const y = at(k, yr); if (y != null && y < 2 * b) last = yr; } return last < 2022 ? last + 1 : null; };
        const yb = () => (T.ly ? T.bounds.y[0] * (T.bounds.y[1] / T.bounds.y[0]) ** 0.05 : T.bounds.y[1] * 0.035);
        const hA = T.handle(1820, 2000, { color: 'gray', label: 'from', labelPos: 'n', constrain: (x) => [Math.round(clamp(x, 1000, 2022)), yb()] });
        const hB = T.handle(2022, 2000, { color: 'accent', label: 'to', labelPos: 'n', constrain: (x) => [Math.round(clamp(x, 1000, 2022)), yb()] });
        let st = {};
        v.render(() => {
          hA.y = yb(); hB.y = yb();
          const list = SER[set.value], base = set.value === 'c' ? 1700 : 1820, a = Math.min(hA.x, hB.x), b = Math.max(hA.x, hB.x);
          v.legend(list.map(([, n, c]) => [c, n]));
          T.vband(1760, 1840, { color: 'gold', alpha: 0.1 });
          T.text('British industrial revolution', 1800, T.ly ? 70000 : 59000, { align: 'center', color: 'muted', size: 10.5 });
          T.vband(a, b, { color: 'accent', alpha: 0.06 });
          T.vline(hA.x, { color: 'gray', width: 1, dash: [3, 3] }); T.vline(hB.x, { color: 'accent', width: 1, dash: [3, 3] });
          const rows = [];
          for (const [k, name, col, ll] of list) {
            T.path(pts[k], { color: col, width: k === 'world' ? 3.2 : 2.2 });
            const to = takeoff(k, base); if (to) T.dot(to, at(k, to), { r: 5, color: col, hollow: true, width: 2.2 });
            const ya = at(k, a), ybv = at(k, b);
            if (ybv != null) T.dot(b, ybv, { r: 3.5, color: col });
            rows.push({ k, name, col, ll, to, g: ya != null && ybv != null && b > a ? Math.log(ybv / ya) / (b - a) : null, yb: ybv });
          }
          // end labels, spread apart
          const ends = list.map(([k, name, col]) => { const p = pts[k][pts[k].length - 1]; return [T.Y(p[1]), name, col]; });
          const ys = spread(ends.map((e) => e[0]), 12.5, 10, T.height - 24);
          ends.forEach(([, name, col], i) => T.textPx(name, T.X(2022) + 5, ys[i], { color: col, size: 10, weight: 650 }));
          // map
          Mp.setTitle(`GDP per head in ${b} (bubble area proportional to income)`);
          G.draw({ landColor: 'muted', coastColor: 'muted', ocean: 'blue' });
          const k0 = 0.115;
          for (const r of rows.slice().sort((p, q) => (q.yb || 0) - (p.yb || 0))) {
            if (!r.ll || r.yb == null) continue;
            G.dot(r.ll, { r: k0 * Math.sqrt(r.yb), color: r.col, alpha: 0.55 });
            const q = G.project(r.ll[0], r.ll[1]); if (q) Mp.text(r.name, q[0], q[1], { dy: k0 * Math.sqrt(r.yb) + 8, align: 'center', color: 'ink', size: 10, weight: 600 });
          }
          st = { rows, a, b };
        });
        v.readout(() => {
          const { rows, a, b } = st;
          const gr = rows.filter((r) => r.g != null).map((r) => `${r.name} ${(100 * r.g).toFixed(2)}%`).join(', ');
          const tk = rows.filter((r) => r.to).sort((p, q) => p.to - q.to).map((r) => `${r.name} ${r.to}`).join(', ');
          return `Average growth of GDP per head ${a}–${b}: ${gr || 'no data in this window'} a year. Take-off (income stays above twice its ${set.value === 'c' ? '1700' : '1820'} level from): ${tk}. On the log axis a steady growth rate is a straight line; 2% a year doubles income every 35 years, 0.1% every 700.`;
        });
      },
    },
  ],
};
