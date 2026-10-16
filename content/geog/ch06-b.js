// Geography & Cartography — Chapter 6 (part b): scoring world maps, interrupted and polyhedral maps, choosing a projection
import { PI, D2R, R2D, comma, enu, vec, dot3, clamp, conic, landFrame, landMask, isLand, azLines, PROJ, GOODE_LOBES, GOODE_PHI0, interrupted, clipRect, densify, icosa, distort, jacEllipse, mapErrors, sphereGrid, worldBase, wrapRel } from './ch06.shared.js';

const fixd = (x, d = 1) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
function fitView(s, ring, pad = 0.06) {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), m = Math.max(x1 - x0, y1 - y0) * pad;
  s.setView([x0 - m, x1 + m], [y0 - m, y1 + m]);
}
const laea = (l, f) => { const k = Math.sqrt(2 / Math.max(1e-9, 1 + Math.cos(f) * Math.cos(l))); return [k * Math.cos(f) * Math.sin(l), k * Math.sin(f)]; };

export default {
  collection: 'geog',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4',
      kind: 'Method',
      name: 'Measuring global distortion (Goldberg–Gott scores)',
      credit: 'D. M. Goldberg and J. R. Gott III, 2007',
      statement: String.raw`To compare world maps quantitatively, average a distortion measure over the whole sphere. Goldberg and Gott (*Cartographica* 42(4), 2007) tabulated six measures for many projections: the **flexion** and **skewness** of the indicatrix (how fast its size and shape drift), **area** and **isotropy** (shape) errors, a **distance** error over pairs of points, and the length of **boundary cuts**, each normalised and summed into a score where lower is better. They found the Winkel tripel to have low distortion on most measures and the best overall quality among the projections they scored.
This item implements four simpler measures in the same spirit: with $J$ the Jacobian of the map at a point of an equal-area sample of the sphere, area error $=$ rms of $\ln(\det J/\text{geometric mean})$, shape error $=$ mean $\omega=2\arcsin\frac{a-b}{a+b}$, distance error $=$ rms of $\ln\frac{\text{map distance}}{c\cdot\text{great-circle distance}}$ over 900 random pairs ($c$ the best single scale), and cut length (in units of $\pi$, the pole-to-pole antimeridian, which is $0$ for a disc that cuts only at the antipode).`,
      idea: String.raw`No map has all errors zero (geog-3.7), so a score chooses which trade-off to prefer. Each measure is an average of a pointwise quantity from the Tissot indicatrix (geog-3.4), the singular values $a\ge b$ of the Jacobian, which are exactly what the Jacobian's determinant and eccentricity measure. A weighted sum of normalised measures turns the comparison into a one-dimensional ranking, whose winner depends on the weights: area-minded weights favour equal-area maps, shape-minded weights favour near-conformal ones, and a high price on cuts favours maps that fit the whole world in one piece or a disc.`,
      caption: String.raw`Move the four weight sliders to say what you care about (area, shape, distance, cuts) and watch the ranking bars reorder; each measure is divided by the equirectangular map's value so that weights are comparable. The lower map shows where one map's error sits on the globe, in longitude–latitude coordinates: pick the map and the quantity (shape or area). The readout names the winner.`,
      deps: ['geog-3.4', 'geog-6.3'],
      see: ['geog-3.7', 'geog-6.5'],
      refs: ['Snyder §6'],
      tags: ['map projections', 'distortion', 'error measures'],
      scope: String.raw`The paper's citation was checked against Crossref (doi 10.3138/carto.42.4.297); the Winkel-tripel result was checked in the authors' arXiv abstract and in a later paper by the same group. The four measures computed here are this atlas's reconstruction (no flexion or skewness, own normalisation) and their numbers are not the published scores.`,
      links: { doi: 'https://doi.org/10.3138/carto.42.4.297', arxiv: 'https://arxiv.org/abs/astro-ph/0608501' },
      viz(v) {
        const MAPS = [
          { k: 'equirect', label: 'Equirectangular', short: 'plate', fwd: PROJ.equirect.fwd, cut: 1 },
          { k: 'sinu', label: 'Sinusoidal', short: 'sinus', fwd: PROJ.sinu.fwd, cut: 1 },
          { k: 'moll', label: 'Mollweide', short: 'Moll', fwd: PROJ.moll.fwd, cut: 1 },
          { k: 'robinson', label: 'Robinson', short: 'Robin', fwd: PROJ.robinson.fwd, cut: 1 },
          { k: 'winkel', label: 'Winkel tripel', short: 'Winkel', fwd: PROJ.winkel.fwd, cut: 1 },
          { k: 'vdg', label: 'Van der Grinten', short: 'vdG', fwd: PROJ.vdg.fwd, cut: 1 },
          { k: 'laea', label: 'Lambert azimuthal disc', short: 'LAEA', fwd: laea, cut: 0 },
        ];
        const grid = sphereGrid(), E = {};
        for (const m of MAPS) E[m.k] = mapErrors(m.fwd, grid);
        const R = { area: E.equirect.area, shape: E.equirect.shape, dist: E.equirect.dist, cut: 1 };
        const wA = v.slider('area weight', 0, 3, 1, { step: 0.1 }), wS = v.slider('shape weight', 0, 3, 1, { step: 0.1 });
        const wD = v.slider('distance weight', 0, 3, 1, { step: 0.1 }), wC = v.slider('cut weight', 0, 3, 1, { step: 0.1 });
        const pick = v.select('show error of', MAPS.map((m) => ({ value: m.k, label: m.short })), 'winkel');
        const what = v.select('quantity', [{ value: 'shape', label: 'shape ω' }, { value: 'area', label: 'area error' }], 'shape');
        const sA = v.stage({ x: [0.4, 7.6], y: [0, 3], axes: 'box', gutter: true, height: 300, weight: 1.2, ylabel: 'weighted score (lower is better)' });
        const sB = v.stage({ x: [-180, 180], y: [-90, 90], equal: true, axes: false, height: 300, weight: 1.3 });
        // gridded error fields on a 5-degree lattice, cached per map
        const field = {};
        const cells = (m) => field[m.k] ||= (() => {
          const out = [];
          for (let i = 0; i < 36; i++) for (let j = 0; j < 72; j++) {
            const J = distort(m.fwd, (-177.5 + 5 * j) * D2R, (-87.5 + 5 * i) * D2R); out.push(J ? { om: J.omega, ln: Math.log(J.area) } : null);
          }
          const ls = out.filter(Boolean).map((c) => c.ln), mean = ls.reduce((a, b) => a + b, 0) / ls.length;
          out.forEach((c) => { if (c) c.la = c.ln - mean; });
          return out;
        })();
        let info = null;
        v.render(() => {
          const sc = MAPS.map((m) => {
            const e = E[m.k];
            return { m, s: wA.value * (e.area / R.area) + wS.value * (e.shape / R.shape) + wD.value * (e.dist / R.dist) + wC.value * (m.cut / R.cut) };
          }).sort((p, q) => p.s - q.s);
          const tot = wA.value + wS.value + wD.value + wC.value || 1;
          sA.setView([0.4, 7.6], [0, Math.max(1.2, sc[sc.length - 1].s / tot * 1.15)]);
          sA.setTicks(sc.map((x, i) => [i + 1, x.m.short]), null);
          sA.bars(sc.map((x) => x.s / tot), { color: (val, i) => (i === 0 ? 'green' : sc[i].m.k === pick.value ? 'accent' : 'faint') });
          // error field
          const m = MAPS.find((q) => q.k === pick.value), C = cells(m), key = `${m.k}|${what.value}`;
          sB.raster((x, y) => {
            const j = Math.floor((x + 180) / 5), i = Math.floor((y + 90) / 5); if (i < 0 || i > 35 || j < 0 || j > 71) return null;
            const c = C[i * 72 + j]; if (!c) return null;
            const col = what.value === 'shape' ? v.ramp(Math.min(1, c.om / 70), 'red', 'panel') : v.diverge(clamp(c.la / 1.5, -1, 1), 'blue', 'red');
            return [col[0], col[1], col[2], 0.9];
          }, { res: 3, key });
          const F = landFrame(v, 0), out = [];
          for (const pl of F.lines) { for (const p of pl) out.push([p[0] * R2D, p[1] * R2D]); out.push(null); }
          sB.path(out, { color: 'ink', width: 0.7, alpha: 0.7 });
          sB.corner(`${m.label}: ${what.value === 'shape' ? 'ω (stronger red = larger)' : 'area error (blue small, red inflated)'}`, 'tl', { color: 'muted', weight: 600, plate: true });
          info = { best: sc[0], m, e: E[m.k], second: sc[1] };
        });
        v.readout(() => {
          const I = info; if (!I) return '';
          return `Best under these weights: **${I.best.m.label}** (score ${(I.best.s / (wA.value + wS.value + wD.value + wC.value || 1)).toFixed(2)}, ahead of ${I.second.m.label}). ${I.m.label}: area error ${(I.e.area * 100).toFixed(0)} % (rms of $\\ln$ area ratio), mean $\\omega=${I.e.shape.toFixed(1)}^\\circ$, distance error ${(I.e.dist * 100).toFixed(0)} %, cuts ${I.m.cut}$\\pi$. Values are relative to the equirectangular map, so its own bar is the weighted mean of ones.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5',
      kind: 'Method',
      name: 'Interrupted and polyhedral maps',
      credit: 'J. P. Goode, 1923; R. B. Fuller, 1943 (Dymaxion)',
      statement: String.raw`Cutting the sphere before flattening it lowers distortion, because only the pieces, not the whole, must be developed onto the plane.
- An **interrupted** map splits the world into lobes, each drawn with its own central meridian. In the **Goode homolosine** (1923) each lobe uses the sinusoidal projection between latitudes $\pm\varphi_0$, $\varphi_0\approx40^\circ44'$, and the Mollweide projection poleward, joined where their parallels have equal length; both are equal-area, so the whole is, and in an ocean-interrupted layout the cuts run mostly through oceans.
- A **polyhedral** map projects the globe onto the faces of an inscribed solid and unfolds them. Fuller's Dymaxion map uses an icosahedron; the version here applies the plain central (gnomonic) projection to each of its 20 triangles and unfolds them in a strip.
The price is the cuts: the interrupted maps tear the globe along meridians and the icosahedral net along 11 edges, of total length $11\arctan 2\approx3.9\pi$ on the unit sphere.`,
      idea: String.raw`A lobe is a smaller region of the sphere, so its distortion obeys the same growth law as in geog-6.1: the sinusoidal shear grows with distance from the lobe's own central meridian, and lobes of 60° to 150° width keep it small. A face of the icosahedron spans only about 63°, and the gnomonic map of a small cap (geog-5.1) is nearly isometric, which is why the net's shape error is only a few degrees. Both constructions get their accuracy by paying in the Goldberg–Gott boundary-cut term (geog-6.4), as the scatter plot shows.`,
      caption: String.raw`Switch among the interrupted Goode homolosine, the uninterrupted one, an interrupted sinusoidal with the same lobes, and the icosahedral net. Red marks where the globe was cut. The ellipses are Tissot indicatrices: their shape tells the shear, their size the area error. The scatter plot puts each map at (length of cuts, mean angular distortion): more cuts, less shear. The readout also measures what share of each cut runs over land.`,
      deps: ['geog-6.1', 'geog-5.1'],
      see: ['geog-6.4', 'geog-6.3'],
      refs: ['Snyder §6'],
      tags: ['map projections', 'interrupted', 'polyhedral'],
      scope: String.raw`The Goode lobe boundaries used here (north: −180, −40, 180; south: −180, −100, −20, 80, 180, with central meridians −100, 30 and −160, −60, 20, 140) are a standard ocean-interrupted layout recalled from software documentation and were not checked against Goode's atlas. The icosahedral net is plain gnomonic on each face and is **not** Fuller's own Dymaxion mapping, which is not gnomonic and uses different face geometry. Dates (Goode 1923; Dymaxion 1943 in Life magazine, icosahedral version 1954) are from Wikipedia.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Goode_homolosine_projection', dymaxion: 'https://en.wikipedia.org/wiki/Dymaxion_map' },
      viz(v) {
        const I = icosa(), mask = landMask(v);
        const GI = interrupted(GOODE_LOBES, PROJ.goode.fwd), SI = interrupted(GOODE_LOBES, PROJ.sinu.fwd);
        const MAPS = {
          goodeInt: { label: 'Goode homolosine, interrupted', short: 'Goode (int.)', F: (l, f) => GI(l * R2D, f), eq: true, base: PROJ.goode.fwd, lobes: true },
          goode: { label: 'Goode homolosine, one piece', short: 'Goode', F: PROJ.goode.fwd, eq: true },
          sinuInt: { label: 'Sinusoidal, interrupted', short: 'Sinus. (int.)', F: (l, f) => SI(l * R2D, f), eq: true, base: PROJ.sinu.fwd, lobes: true },
          icosa: { label: 'Icosahedral net (gnomonic)', short: 'Icosahedron', F: (l, f) => I.fwd(l * R2D, f * R2D), eq: false, net: true },
        };
        const sel = v.select('map', Object.keys(MAPS).map((k) => ({ value: k, label: MAPS[k].short })), 'goodeInt');
        const ind = v.toggle('indicatrices', true);
        const s = v.stage({ height: 360, equal: true, axes: false, full: true, x: [-3.4, 3.4], y: [-1.8, 1.8] });
        const sB = v.stage({ x: [0, 4.4], y: [0, 40], axes: 'box', gutter: true, height: 280, weight: 1, xlabel: 'length of cuts (units of π)', ylabel: 'mean ω (°)' });
        // ---- cut lengths and the share of each cut that runs over land
        const arcLand = (pts) => { let n = 0; for (const p of pts) if (isLand(mask, p[0], p[1])) n++; return n / pts.length; };
        const meridian = (lon, f0, f1) => { const o = []; for (let f = f0; f <= f1; f += 1) o.push([lon, f]); return o; };
        const slerp = (a, b, n = 60) => { const w = Math.acos(clamp(dot3(a, b), -1, 1)), o = []; for (let i = 0; i <= n; i++) { const t = i / n, p = [0, 1, 2].map((k) => (Math.sin((1 - t) * w) * a[k] + Math.sin(t * w) * b[k]) / Math.sin(w)); o.push([Math.atan2(p[1], p[0]) * R2D, Math.asin(p[2]) * R2D]); } return o; };
        const cutInfo = {};
        const lobeCuts = [[180, 0, 90], [-40, 0, 90], [180, -90, 0], [-100, -90, 0], [-20, -90, 0], [80, -90, 0]];
        { const pts = lobeCuts.flatMap(([L, a, b]) => meridian(L, a, b)); cutInfo.goodeInt = { len: lobeCuts.length * 0.5, land: arcLand(pts) }; cutInfo.sinuInt = cutInfo.goodeInt; }
        cutInfo.goode = { len: 1, land: arcLand(meridian(180, -90, 90)) };
        { const arcs = I.outline.map((e) => slerp(e[2], e[3])); cutInfo.icosa = { len: (I.outline.length / 2 * I.edgeAngle) / PI, land: arcLand(arcs.flat()) }; }
        const E = {}; for (const k of Object.keys(MAPS)) E[k] = mapErrors(MAPS[k].F);
        const REF = [['Winkel tripel', PROJ.winkel.fwd, 'orange'], ['Mollweide', PROJ.moll.fwd, 'green'], ['plate carrée', PROJ.equirect.fwd, 'orange']].map(([n, f, c]) => ({ n, c, w: mapErrors(f).shape }));
        // ---- land and outlines per lobe
        const lobeData = {};
        const lobes = (key) => lobeData[key] ||= (() => {
          const base = MAPS[key].base, F = landFrame(v, 0), res = [];
          for (const b of GOODE_LOBES) {
            const north = b[3] > 0, f0 = north ? 0 : -PI / 2, f1 = north ? PI / 2 : 0, P = (l, f) => { const p = base((l - b[2] * D2R), f); return [p[0] + b[2] * D2R, p[1]]; };
            const fills = F.fills.map((r) => clipRect(r, b[0] * D2R, b[1] * D2R, f0, f1)).filter((r) => r.length > 2).map((r) => densify(r).map((p) => P(p[0], clamp(p[1], f0 + 1e-9, f1 - 1e-9))));
            const out = []; for (let f = 0; f <= 90; f += 2) out.push(P(b[0] * D2R, (north ? f : -f) * D2R)); for (let f = 90; f >= 0; f -= 2) out.push(P(b[1] * D2R, (north ? f : -f) * D2R));
            const gr = [];
            for (let L = Math.ceil((b[0] + 1) / 30) * 30; L < b[1]; L += 30) { for (let f = 0; f <= 90; f += 3) gr.push(P(L * D2R, (north ? f : -f) * D2R)); gr.push(null); }
            for (let f = 30; f < 90; f += 30) { for (let L = b[0]; L <= b[1]; L += 3) gr.push(P(L * D2R, (north ? f : -f) * D2R)); gr.push(null); }
            const eq = []; for (let L = b[0]; L <= b[1]; L += 3) eq.push(P(L * D2R, 0)); gr.push(...eq, null);
            res.push({ fills, out, gr });
          }
          return res;
        })();
        let info = null;
        v.render(() => {
          const k = sel.value, M = MAPS[k];
          let box = [];
          if (M.lobes) {
            for (const d of lobes(k)) { s.poly(d.out, { fill: 'blue', fillAlpha: 0.07, stroke: false }); s.rings(d.fills, { fill: 'gold', fillAlpha: 0.3, stroke: false }); s.path(d.gr, { color: 'muted', width: 0.7, alpha: 0.38 }); s.poly(d.out, { color: 'red', width: 1.4, alpha: 0.75, fill: false }); box = box.concat(d.out); }
          } else if (M.net) {
            const g = ((c) => [c[0], c[1], c[2], 0.3])(v.rgb('gold')), b = v.rgb('blue');
            s.raster((x, y) => { const w = I.inv(x, y); if (!w) return null; return isLand(mask, w[0], w[1]) ? g : [b[0], b[1], b[2], 0.08]; }, { res: 2, key: 'ico' });
            const gr = [];
            for (let L = -180; L < 180; L += 30) { const m = []; for (let f = -90; f <= 90; f += 2) m.push([L, f]); for (const pl of azLines({ fwd: (l, f) => I.fwd(l, f) }, m, 0.8)) gr.push(...pl, null); }
            for (let f = -60; f <= 60; f += 30) { const m = []; for (let L = -180; L <= 180; L += 2) m.push([L, f]); for (const pl of azLines({ fwd: (l, f2) => I.fwd(l, f2) }, m, 0.8)) gr.push(...pl, null); }
            s.path(gr, { color: 'muted', width: 0.7, alpha: 0.38 });
            for (const F of I.faces) s.poly(F.P, { color: 'faint', width: 0.6, fill: false, alpha: 0.6 });
            const o = []; for (const e of I.outline) { o.push(e[0], e[1], null); box.push(e[0], e[1]); } s.path(o, { color: 'red', width: 1.5, alpha: 0.8 });
          } else {
            const ring = worldBase(s, v, M.F, { lon0: 0 }); box = ring; s.poly(ring, { color: 'red', width: 1.4, alpha: 0.75, fill: false });
          }
          fitView(s, box);
          if (ind.value) for (let f = -60; f <= 60; f += 30) for (let L = -165; L <= 165; L += 30) {
            const J = distort(M.F, L * D2R, f * D2R); if (!J) continue;
            const p = M.F(L * D2R, f * D2R); jacEllipse(s, p[0], p[1], J, 0.2, M.eq ? 'green' : 'orange');
          }
          // scatter
          const drawPt = (x, y, col, lab, big, pos = 'ne') => sB.dot(x, y, { color: col, r: big ? 6 : 4, hollow: !big, label: lab, labelPos: pos });
          for (const q of REF) drawPt(1, q.w, q.c, q.n, false);
          for (const kk of Object.keys(MAPS)) drawPt(cutInfo[kk].len, E[kk].shape, kk === k ? 'red' : MAPS[kk].eq ? 'green' : 'orange', MAPS[kk].short, kk === k, kk === 'sinuInt' ? 'se' : 'ne');
          sB.corner('green = equal-area, orange = not', 'br', { color: 'muted' });
          info = { k, M, e: E[k], c: cutInfo[k] };
        });
        v.readout(() => {
          const I2 = info; if (!I2) return '';
          return `${I2.M.label}: mean angular distortion **${I2.e.shape.toFixed(1)}°**, area error ${(I2.e.area * 100).toFixed(0)} %${I2.M.eq ? ' (equal-area up to numerical error)' : ''}, distance error ${(I2.e.dist * 100).toFixed(0)} % over random pairs (pairs split by a cut count against it). Cuts of total length **${I2.c.len.toFixed(2)}$\\pi$**, of which **${(I2.c.land * 100).toFixed(0)} %** runs over land. ${I2.M.lobes || I2.M.base || I2.k === 'goode' ? `Goode's join latitude between sinusoidal and Mollweide: ${(GOODE_PHI0 * R2D).toFixed(2)}°.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6',
      kind: 'Principle',
      name: 'Choosing a projection by region shape',
      statement: String.raw`For a map of a **region** rather than the world, choose the family whose zero-distortion set best follows the region, and fit it to the region.
- A region roughly as wide as it is tall: an **azimuthal** projection centred on it (the stereographic if conformality matters, Lambert's if area does), whose distortion grows with distance $c$ from the centre.
- A belt that is long in the east–west direction at middle latitudes: a **conic** projection with standard parallels inside the belt (Lambert conformal conic, or Albers for equal areas), whose scale depends on latitude only.
- A strip that is long north–south: a **transverse cylindrical** projection (transverse Mercator) with the central meridian down its middle.
- An equatorial belt: the ordinary **Mercator** (or its equal-area analogue), whose scale depends on latitude only and is nearly 1 near the equator.
For conformal maps the quality of a choice is the spread $k_{\max}/k_{\min}$ of the point scale over the region after rescaling, and the best family is the one with the smallest spread.`,
      idea: String.raw`A projection has some set where scale is exactly right: a point (azimuthal), a pair of parallels (conic), a meridian (transverse cylindrical) or the equator (Mercator), and the scale error grows away from that set (geog-5.8, geog-4.7, geog-5.5). A region's best projection is the one whose accurate set passes through the region's long dimension: the comparison of these spreads over a grid of points in the region is exactly what this item computes, as Chebyshev's theorem (geog-3.8) says the optimum equalises the error around the boundary.`,
      caption: String.raw`Drag the two corner handles on the world map (or pick a preset such as the contiguous US, Chile, Indonesia or Greenland) to define a region. The bars give the scale spread $k_{\max}/k_{\min}-1$ of four conformal candidates (stereographic, Lambert conformal conic with best parallels, transverse Mercator, Mercator); the smallest bar is highlighted and its map of the region is drawn, with small circles that show scale. Choose another candidate to see how the same region distorts.`,
      deps: ['geog-5.8', 'geog-4.7', 'geog-5.5'],
      see: ['geog-3.8'],
      refs: ['Snyder §6'],
      tags: ['map projections', 'choosing', 'regions'],
      scope: String.raw`Only conformal candidates are compared, by the spread of point scale over a 13 by 13 grid of the region on the sphere (not the ellipsoid); the rule of thumb printed in the readout (aspect ratio of the region) is the classical guideline, the winner is computed. Regions are boxes in longitude and latitude, not true outlines, so the preset names are rough extents.`,
      viz(v) {
        const PRE = { us: ['contiguous US', -125, 24.5, -67, 49.5], chile: ['Chile', -76, -56, -66, -17], rus: ['Siberian belt', 60, 50, 150, 70], indo: ['Indonesia', 95, -11, 141, 6], gl: ['Greenland', -73, 59.5, -11, 83.7], afr: ['Africa', -18, -35, 52, 37] };
        const NAMES = { stereo: 'stereographic', lcc: 'Lambert conformal conic', tm: 'transverse Mercator', merc: 'Mercator' };
        const sW = v.stage({ x: [-PI, PI], y: [-PI / 2, PI / 2], equal: true, axes: false, height: 230, weight: 1.2 });
        const sBar = v.stage({ x: [0.4, 4.6], y: [0, 100], axes: 'box', gutter: true, height: 230, weight: 1, ylabel: 'scale spread (%, clipped at 100)', xticks: [[1, 'stereo'], [2, 'conic'], [3, 'transv.'], [4, 'Mercator']] });
        const sR = v.stage({ height: 340, equal: true, axes: false, full: true, x: [-1, 1], y: [-1, 1] });
        const SW = sW.handle(-2.18, 0.43, { color: 'accent', label: 'SW', r: 6, constrain: (x, y) => [clamp(x, -PI, NE.x - 0.08), clamp(y, -1.45, NE.y - 0.08)] });
        const NE = sW.handle(-1.17, 0.87, { color: 'orange', label: 'NE', r: 6, constrain: (x, y) => [clamp(x, SW.x + 0.08, PI), clamp(y, SW.y + 0.08, 1.45)] });
        const pre = v.select('preset', [{ value: 'custom', label: 'drag corners' }, ...Object.keys(PRE).map((k) => ({ value: k, label: PRE[k][0] }))], 'us', {
          onChange: (val) => { const p = PRE[val]; if (!p) return; SW.set(-PI, -1.45); NE.set(PI, 1.45); SW.set(p[1] * D2R, p[2] * D2R); NE.set(p[3] * D2R, p[4] * D2R); },
        });
        const show = v.select('show map in', [{ value: 'best', label: 'best' }, ...Object.keys(NAMES).map((k) => ({ value: k, label: { stereo: 'stereo', lcc: 'conic', tm: 'transverse', merc: 'Mercator' }[k] }))], 'best');
        // preset fires only on user change: apply the default region now
        SW.set(PRE.us[1] * D2R, PRE.us[2] * D2R); NE.set(PRE.us[3] * D2R, PRE.us[4] * D2R);
        const atanh = (x) => 0.5 * Math.log((1 + x) / (1 - x));
        let info = null;
        v.render(() => {
          const W = SW.x * R2D, S = SW.y * R2D, Ea = NE.x * R2D, N = NE.y * R2D, lon0 = (W + Ea) / 2, latc = (S + N) / 2;
          sW.poly([[SW.x, SW.y], [NE.x, SW.y], [NE.x, NE.y], [SW.x, NE.y]], { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1.6 });
          // world context
          const wf = (l, f) => [l, f]; const ring = worldBase(sW, v, wf, { lon0: 0, step: 30 }); void ring;
          sW.poly([[SW.x, SW.y], [NE.x, SW.y], [NE.x, NE.y], [SW.x, NE.y]], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1.8 });
          // sample grid and scale spreads
          const pts = []; for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) pts.push([W + ((Ea - W) * j) / 12, S + ((N - S) * i) / 12]);
          const spread = (kf) => { let a = Infinity, b = 0; for (const p of pts) { const k = kf(p[0], p[1]); if (!isFinite(k)) return Infinity; a = Math.min(a, k); b = Math.max(b, k); } return b / a - 1; };
          const u0 = enu([lon0, latc]);
          const err = {};
          err.stereo = spread((L, f) => 2 / (1 + dot3(u0.u, vec([L, f]))));
          err.tm = spread((L, f) => { const B = Math.cos(f * D2R) * Math.sin(wrapRel(L, lon0) * D2R); return 1 / Math.sqrt(Math.max(1e-6, 1 - B * B)); });
          err.merc = spread((L, f) => 1 / Math.cos(f * D2R));
          let bestL = [S, N, Infinity];
          if (!(S < 0 && N > 0)) {
            for (let a = S; a <= N + 1e-9; a += 1) for (let b = a; b <= N + 1e-9; b += 1) {
              const C = conic('lcc', a * D2R, b * D2R, a * D2R); if (!isFinite(C.n) || Math.abs(C.n) < 0.02) continue;
              let lo = Infinity, hi = 0; for (let t = 0; t <= 12; t++) { const k = C.k((S + ((N - S) * t) / 12) * D2R); lo = Math.min(lo, k); hi = Math.max(hi, k); }
              if (hi / lo - 1 < bestL[2]) bestL = [a, b, hi / lo - 1];
            }
          }
          err.lcc = bestL[2];
          const order = ['stereo', 'lcc', 'tm', 'merc'], best = order.reduce((a, k) => (err[k] < err[a] ? k : a), 'stereo');
          sBar.bars(order.map((k) => Math.min(100, err[k] * 100)), { color: (x, i) => (order[i] === best ? 'green' : 'faint') });
          order.forEach((k, i) => sBar.text(isFinite(err[k]) ? (err[k] * 100 < 1000 ? (err[k] * 100).toFixed(err[k] < 0.1 ? 1 : 0) + '%' : '>999%') : 'n/a', i + 1, Math.min(96, err[k] * 100 + 6), { size: 12, color: 'ink', align: 'center' }));
          // the chosen map of the region
          const k = show.value === 'best' ? best : show.value;
          const C = conic('lcc', bestL[0] * D2R, bestL[1] * D2R, (bestL[0] + bestL[1]) / 2 * D2R);
          const y0 = { tm: Math.atan2(Math.tan(latc * D2R), 1), merc: Math.log(Math.tan(PI / 4 + (latc * D2R) / 2)) };
          const F = (L, f) => {
            const l = wrapRel(L, lon0) * D2R, fr = f * D2R;
            if (k === 'stereo') { const p = vec([L, f]), q = 2 / (1 + dot3(u0.u, p)); return [q * dot3(u0.e, p), q * dot3(u0.n, p)]; }
            if (k === 'lcc') return C.fwd(l, fr);
            if (k === 'tm') { const B = clamp(Math.cos(fr) * Math.sin(l), -0.9999, 0.9999); return [atanh(B), Math.atan2(Math.tan(fr), Math.cos(l)) - y0.tm]; }
            return [l, Math.log(Math.tan(PI / 4 + fr / 2)) - y0.merc];
          };
          const edge = []; for (let t = 0; t <= 24; t++) edge.push(F(W + ((Ea - W) * t) / 24, S)); for (let t = 0; t <= 24; t++) edge.push(F(Ea, S + ((N - S) * t) / 24)); for (let t = 0; t <= 24; t++) edge.push(F(Ea - ((Ea - W) * t) / 24, N)); for (let t = 0; t <= 24; t++) edge.push(F(W, N - ((N - S) * t) / 24));
          if (edge.every((p) => isFinite(p[0]) && isFinite(p[1]))) {
            fitView(sR, edge, 0.08);
            sR.poly(edge, { fill: 'blue', fillAlpha: 0.07, stroke: false });
            const st = Math.max(Ea - W, N - S) > 60 ? 10 : 5, gr = [];
            for (let L = Math.ceil(W / st) * st; L <= Ea; L += st) { for (let t = 0; t <= 30; t++) gr.push(F(L, S + ((N - S) * t) / 30)); gr.push(null); }
            for (let f = Math.ceil(S / st) * st; f <= N; f += st) { for (let t = 0; t <= 30; t++) gr.push(F(W + ((Ea - W) * t) / 30, f)); gr.push(null); }
            sR.path(gr, { color: 'muted', width: 0.7, alpha: 0.4 });
            const LF = landFrame(v, lon0), fills = LF.fills.map((r) => clipRect(r, (W - lon0) * D2R, (Ea - lon0) * D2R, S * D2R, N * D2R)).filter((r) => r.length > 2).map((r) => densify(r).map((p) => F(p[0] * R2D + lon0, p[1] * R2D)));
            sR.rings(fills, { fill: 'gold', fillAlpha: 0.3, stroke: false });
            const co = []; for (const pl of LF.lines) { let run = []; for (const p of pl) { const LL = p[0] * R2D + lon0, ff = p[1] * R2D; if (LL >= W && LL <= Ea && ff >= S && ff <= N) run.push(F(LL, ff)); else { if (run.length > 1) co.push(...run, null); run = []; } } if (run.length > 1) co.push(...run, null); }
            sR.path(co, { color: 'gold', width: 0.9, alpha: 0.8 });
            sR.poly(edge, { color: 'faint', width: 1.2, fill: false });
            // small circles
            const r = Math.min(Ea - W, N - S) * 0.06 * D2R;
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
              const L = W + ((j + 0.5) / 4) * (Ea - W), f = S + ((i + 0.5) / 4) * (N - S), e = enu([L, f]), ring2 = [];
              for (let t = 0; t <= 24; t++) { const th = (2 * PI * t) / 24, d = [0, 1, 2].map((q) => Math.cos(r) * e.u[q] + Math.sin(r) * (Math.cos(th) * e.n[q] + Math.sin(th) * e.e[q])); ring2.push(F(Math.atan2(d[1], d[0]) * R2D, Math.asin(d[2]) * R2D)); }
              sR.path(ring2, { close: true, fill: 'green', fillAlpha: 0.3, color: 'green', width: 0.9 });
            }
            sR.corner(NAMES[k], 'tl', { color: 'muted', weight: 600, plate: true });
          }
          const ew = (Ea - W) * Math.cos(latc * D2R), ns = N - S;
          const rule = Math.abs(latc) < 15 && ew > ns ? 'Mercator (equatorial belt)' : ew > 1.6 * ns ? 'conic (east–west belt)' : ns > 1.6 * ew ? 'transverse Mercator (north–south strip)' : 'azimuthal (round region)';
          info = { best, err, rule, W, Ea, S, N, k, par: bestL };
        });
        v.readout(() => {
          const I = info; if (!I) return '';
          const f = (x) => (isFinite(x) ? (x * 100 < 1000 ? (x * 100).toFixed(x < 0.1 ? 2 : 1) + ' %' : '>999 %') : 'n/a');
          return `Region ${fixd(I.S)}° to ${fixd(I.N)}° latitude, ${fixd(I.W)}° to ${fixd(I.Ea)}° longitude (${fixd(I.Ea - I.W, 0)}° by ${fixd(I.N - I.S, 0)}°). Scale spread: stereographic ${f(I.err.stereo)}, conic ${f(I.err.lcc)}${isFinite(I.par[2]) ? ` (parallels ${fixd(I.par[0])}°, ${fixd(I.par[1])}°)` : ''}, transverse Mercator ${f(I.err.tm)}, Mercator ${f(I.err.merc)}. Smallest: **${NAMES[I.best]}**; the shape rule of thumb says ${I.rule}.`;
        });
      },
    },
  ],
};
