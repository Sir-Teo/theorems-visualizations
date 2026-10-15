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
      caption: String.raw`The sliders set what each firm adds; the diagram shows the resulting sales. In the bars below, colour shows whose work a euro pays for: the **sum of all sales** repeats the farmer's teal three times, while **value added** and **final sales** have each slice once and always have the same length. Everything right of the green GDP line is double counting. Switch on **the baker buys the mill**: the sum of sales shrinks, GDP does not.`,
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
          const chunk = (x, parts, y, name) => {
            let p = x; for (const [col, w] of parts) { hseg(B, p, w, y, hh, col, w >= 8 ? eur(w) : ''); p += w; }
            if (name && B.X(p) - B.X(x) > 46) B.text(name, (x + p) / 2, y - hh - 0.14, { align: 'center', color: 'muted', size: 10 });
            B.line(p, y - hh - 0.02, p, y + hh + 0.02, { color: 'panel', width: 3 }); return p;
          };
          let x = 0;
          x = chunk(x, [['teal', A]], rows[0], 'wheat');
          if (!mg) x = chunk(x, [['teal', (1 - H) * A], ['purple', (1 - H) * M]], rows[0], 'flour to baker');
          if (Fh > 0.5) x = chunk(x, [['teal', H * A], ['purple', H * M]], rows[0], 'flour to hh');
          x = chunk(x, [['teal', (1 - H) * A], ['purple', (1 - H) * M], ['orange', K]], rows[0], 'bread');
          hatch(v, B, gdp, rows[0] - hh, sales, rows[0] + hh, 'red', 0.75, 6);
          B.rect(gdp, rows[0] - hh, sales, rows[0] + hh, { color: 'red', width: 1.6 });
          x = 0; x = chunk(x, [['teal', A]], rows[1], 'farmer'); x = chunk(x, [['purple', M]], rows[1], 'miller'); x = chunk(x, [['orange', K]], rows[1], 'baker');
          x = 0; if (Fh > 0.5) x = chunk(x, [['teal', H * A], ['purple', H * M]], rows[2], 'flour'); chunk(x, [['teal', (1 - H) * A], ['purple', (1 - H) * M], ['orange', K]], rows[2], 'bread');
          [[rows[0], sales, 'red'], [rows[1], gdp, 'ink'], [rows[2], fin, 'ink']].forEach(([y, tot, col]) => B.text(`= ${eur(tot)}`, tot, y, { dx: 8, color: col, size: 12.5, weight: 700 }));
          B.line(gdp, 0.08, gdp, 3.42, { color: 'green', width: 2, dash: [6, 4] });
          B.text(`GDP ${eur(gdp)}`, gdp, 3.42, { dx: 6, dy: 2, color: 'green', size: 11.5, weight: 700, baseline: 'top' });
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
        const Ts = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: false, weight: 2.4, minWidth: 440 });
        const Ms = v.stage({ x: [0, 3.6], y: [0, 330], height: 340, axes: 'box', weight: 1, minWidth: 230, xticks: [[0.6, 'production'], [1.8, 'spending'], [3, 'income']], yticks: [0, 100, 200, 300] });
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
          const w = 0.34, stack = (xc, parts) => { let y = 0; for (const [col, h, lab] of parts) { if (h > 0) { Ms.rect(xc - w, y, xc + w, y + h, { fill: col, fillAlpha: 0.5, color: 'panel', width: 1.2 }); if (Ms.Y(y) - Ms.Y(y + h) > 15) Ms.text(lab, xc, y + h / 2, { align: 'center', size: 10.5, weight: 600 }); } y += Math.max(0, h); } return y; };
          stack(0.6, [['green', prod[0], `Farms ${num(prod[0])}`], ['orange', prod[1], `Fact. ${num(prod[1])}`], ['purple', prod[2], `Serv. ${num(prod[2])}`]]);
          const top = stack(1.8, [['blue', C, `C ${num(C)}`], ['gold', I, `I ${num(I)}`], ['pink', G, `G ${num(G)}`], ['teal', X, `X ${num(X)}`]]);
          hatch(v, Ms, 1.8 - w, top - A.M, 1.8 + w, top, 'red', 0.9, 5);
          Ms.rect(1.8 - w, top - A.M, 1.8 + w, top, { color: 'red', width: 1.4 });
          if (Ms.Y(top - A.M) - Ms.Y(top) > 14) Ms.text(`−M ${num(A.M)}`, 1.8, top - A.M / 2, { align: 'center', color: 'red', size: 10.5, weight: 700 });
          stack(3, [['teal', Wt, `wages ${num(Wt)}`], ['gold', Pr, `profits ${num(Pr)}`]]);
          const agree = Math.abs(P - Ex) < 1e-9 && Math.abs(P - Inc) < 1e-9;
          for (const [xc, lev] of [[0.6, P], [1.8, Ex], [3, Inc]]) Ms.line(xc - w - 0.06, lev, xc + w + 0.06, lev, { color: agree ? 'green' : Math.abs(lev - Ex) < 1e-9 && miss.value === 'firm' || Math.abs(lev - P) < 1e-9 && miss.value === 'hh' ? 'ink' : 'red', width: 2.6 });
          if (agree) { Ms.line(0.1, P, 3.5, P, { color: 'green', width: 1.2, dash: [5, 4] }); Ms.text(`GDP ${num(P)} ✓`, 1.8, Math.max(top, P) + 8, { align: 'center', color: 'green', size: 12, weight: 700, baseline: 'bottom' }); }
          else { const lo = Math.min(P, Ex), hi = Math.max(P, Ex); Ms.measure(2.3, lo, 2.3, hi, null, { color: 'red' }); Ms.text(`gap ${num(hi - lo)}`, 2.36, (lo + hi) / 2, { color: 'red', size: 11, weight: 700 }); Ms.text('statistical discrepancy', 1.8, Math.max(top, P) + 8, { align: 'center', color: 'red', size: 11.5, weight: 700, baseline: 'bottom' }); }
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
          const tg = target(), dt = lastT == null ? 0 : t - lastT; lastT = t;
          if (!disp || dt <= 0 || dt > 0.5) disp = { ...tg }; else for (const k in tg) disp[k] += (tg[k] - disp[k]) * Math.min(1, dt * 5);
          const d = disp, k = 0.21 * s.height / 66 * 0.9; // px per unit of flow
          const W = (x) => Math.abs(x) * k;
          // flows
          const flows = [
            ['C', bz([11, 40], [11, 64], [89, 64], [89, 40]), d.C, 'blue', [50, 60.6], `consumption C ${Math.round(tg.C)}`],
            ['Y', bz([90, 24], [90, -2], [10, -2], [10, 24]), d.Y, 'teal', [50, 4.6], `factor incomes Y ${Math.round(tg.Y)}`],
            ['T', bz([20, 37], [29, 37], [29, 49], [38, 49]), d.T, 'gold', [27.5, 46], `taxes T ${Math.round(tg.T)}`],
            ['G', bz([58, 49], [70, 49], [74, 37], [82, 37]), d.G, 'pink', [70, 47.6], `purchases G ${Math.round(tg.G)}`],
            ['S', bz([20, 27], [29, 27], [29, 13], [38, 13]), d.Sp, 'purple', [24.5, 15.2], `private saving ${Math.round(tg.Sp)}`],
            ['I', bz([58, 13], [72, 13], [74, 27], [82, 27]), d.Ir, 'orange', [72.5, 15.2], un.value === 'inv' ? `I ${Math.round(tg.I)} + inventories ${Math.round(tg.U)}` : `investment I ${Math.round(tg.Ir)}`],
            ['X', [[72.3, 34.4], [81.7, 34.4]], d.X, 'green', [77, 37.4], `X ${Math.round(tg.X)}`],
            ['M', [[81.7, 29.6], [72.3, 29.6]], d.M, 'red', [77, 26.4], `M ${Math.round(tg.M)}`],
          ];
          const sg = d.Sg >= 0 ? [[46, 43.6], [46, 18.4]] : [[46, 18.4], [46, 43.6]];
          flows.push(['Sg', sg, d.Sg, 'purple', [46.8, 31], tg.Sg >= 0 ? `public saving ${Math.round(tg.Sg)}` : `government borrows ${Math.round(-tg.Sg)}`]);
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
          const { C, I, G, T, X, M, U, Y, Sp, Sg, N, Ir, bal } = st, r = Math.round;
          if (C == null) return '';
          const keys = { H: 'households', F: 'firms', G: 'government', K: 'financial markets', R: 'rest of world' };
          const bad = Object.keys(bal).filter((k) => Math.abs(bal[k][0] - bal[k][1]) > 1e-9);
          const id = `$Y = C + I + G + X - M$: ${r(Y)} = ${r(C)} + ${r(Ir)} + ${r(G)} + ${r(X)} − ${r(M)}${bad.length ? ` + ${r(U)} unsold` : ''}. Saving: private ${r(Sp)} + public ${r(Sg)} = ${r(Sp + Sg)}; investment + net lending abroad = ${r(Ir)} + ${r(N)} = ${r(Ir + N)}.`;
          if (!bad.length) return `Every box balances. ${id}${U ? ' The unsold goods are recorded as inventory investment, so firms in effect buy them from themselves.' : ''}`;
          return `${id} Unsold output of ${r(U)} not counted anywhere: **${bad.map((k) => keys[k]).join(' and ')}** are out of balance by ${r(U)} — incomes were paid for goods nobody bought, and saving finds no matching investment. Counting inventories restores every identity.`;
        });
      },
    },
  ],
};
