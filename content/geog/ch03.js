// Geography & Cartography — Chapter 3: Why no map is perfect
import { D2R, R2D, R_MEAN, vec, lonlat, dot3, cross3, unit3, angle3, comma } from './ch01.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mod = (a, n) => ((a % n) + n) % n;
const AZ = new Set(['stereographic', 'lambert', 'azimuthalEquidistant', 'gnomonic', 'orthographic']);
const LABEL = {
  equirectangular: 'Plate carrée', mercator: 'Mercator', transverseMercator: 'Transverse Mercator', mollweide: 'Mollweide', robinson: 'Robinson',
  stereographic: 'Stereographic', lambert: 'Lambert azimuthal', azimuthalEquidistant: 'Azimuthal equidistant', gnomonic: 'Gnomonic', orthographic: 'Orthographic',
};
/**
 * Jacobian of a map projection at p = [lon, lat], by central differences of G.project (map units on the unit sphere).
 * E = image of a unit eastward step, N = of a unit northward step. SVD: a ≥ b, right singular directions v1, v2
 * (in (east, north) components) and their images u1 = J v1 / a, u2 = J v2 / b.
 */
function jacobian(project, p, hd = 1e-3) {
  const [l, f] = p, P = (a, b) => project(a, b);
  const c = P(l, f), e1 = P(l + hd, f), e0 = P(l - hd, f), n1 = P(l, f + hd), n0 = P(l, f - hd);
  if (![c, e1, e0, n1, n0].every((q) => q && isFinite(q[0]) && isFinite(q[1]))) return null;
  const ce = 2 * hd * D2R * Math.cos(f * D2R), cn = 2 * hd * D2R;
  const E = [(e1[0] - e0[0]) / ce, (e1[1] - e0[1]) / ce], N = [(n1[0] - n0[0]) / cn, (n1[1] - n0[1]) / cn];
  if (Math.hypot(e1[0] - e0[0], e1[1] - e0[1]) > 0.3 || Math.hypot(n1[0] - n0[0], n1[1] - n0[1]) > 0.3) return null;
  const ee = E[0] * E[0] + E[1] * E[1], nn = N[0] * N[0] + N[1] * N[1], en = E[0] * N[0] + E[1] * N[1];
  const tr = ee + nn, det = Math.abs(E[0] * N[1] - E[1] * N[0]), disc = Math.sqrt(Math.max(0, tr * tr / 4 - det * det));
  const a = Math.sqrt(tr / 2 + disc), b = det / a, t = 0.5 * Math.atan2(2 * en, ee - nn);
  const v1 = [Math.cos(t), Math.sin(t)], v2 = [-Math.sin(t), Math.cos(t)];
  const J = (w) => [E[0] * w[0] + N[0] * w[1], E[1] * w[0] + N[1] * w[1]];
  const j1 = J(v1), j2 = J(v2);
  return { c, E, N, h: Math.sqrt(nn), k: Math.sqrt(ee), a, b, area: det, v1, v2, u1: [j1[0] / a, j1[1] / a], u2: [j2[0] / b, j2[1] / b], omega: 2 * Math.asin(clamp((a - b) / (a + b), 0, 1)) * R2D, theta: Math.acos(clamp(en / Math.sqrt(ee * nn), -1, 1)) * R2D };
}
/** A lon/lat cell [l, l+dl] × [f, f+df] as a densified counter-clockwise ring. */
function cellRing(l, f, dl, df, n = 6) {
  const r = [];
  for (let i = 0; i < n; i++) r.push([l + (dl * i) / n, f]);
  for (let i = 0; i < n; i++) r.push([l + dl, f + (df * i) / n]);
  for (let i = 0; i < n; i++) r.push([l + dl - (dl * i) / n, f + df]);
  for (let i = 0; i < n; i++) r.push([l, f + df - (df * i) / n]);
  return r;
}
const meridian = (l, a = -89.9, b = 89.9) => { const out = []; for (let f = a; f <= b + 1e-9; f += 1) out.push([l, Math.min(f, b)]); return out; };
/** Rotate a set of rings so that the point c0 (unit vector) moves to target t (unit vector). */
function moveRings(rings, c0, t) {
  const ang = angle3(c0, t) * R2D; if (ang < 1e-6) return rings;
  const pole = lonlat(unit3(cross3(c0, t)));
  return rings.map((r) => r.map((p) => vecRot(p, pole, ang)));
}
function vecRot(p, pole, ang) { // Rodrigues rotation of [lon, lat] about pole by ang degrees (right-handed)
  const k = vec(pole), x = vec(p), a = ang * D2R, c = Math.cos(a), s = Math.sin(a), kx = cross3(k, x), d = dot3(k, x) * (1 - c);
  return lonlat([x[0] * c + kx[0] * s + k[0] * d, x[1] * c + kx[1] * s + k[1] * d, x[2] * c + kx[2] * s + k[2] * d]);
}
const ringCentroid = (ring) => unit3(ring.map(vec).reduce((s, q) => [s[0] + q[0], s[1] + q[1], s[2] + q[2]], [0, 0, 0]));
/** Map-plane area of a ring of [lon, lat] under project(), or null if a vertex is clipped or the ring jumps a seam. */
function mapArea(project, ring) {
  const pts = []; let prev = null;
  for (const p of ring) { const q = project(p[0], p[1]); if (!q) return null; if (prev && Math.hypot(q[0] - prev[0], q[1] - prev[1]) > 0.6) return null; pts.push(q); prev = q; }
  let s = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) s += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return Math.abs(s / 2);
}

export default {
  collection: 'geog',
  chapter: 3,
  title: 'Why no map is perfect',
  summary: String.raw`A map projection is a function from the sphere to the plane, and Gauss's Theorema Egregium says it can never be an isometry: the sphere's curvature is intrinsic, so even a small cap cannot be laid flat without stretching or tearing. Tissot's indicatrix makes the distortion visible as the image of an infinitesimal circle — an ellipse whose semi-axes are the singular values of the projection's derivative. A map can keep every indicatrix a circle (conformal) or keep every indicatrix's area (equal-area), never both; and among conformal maps of a region, Chebyshev showed that the least distorted one has constant scale along the region's boundary.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Map projection',
      statement: String.raw`A **map projection** is a function $F$ from (part of) the sphere to the plane, written in latitude and longitude as
$$(\varphi, \lambda) \mapsto \big(x(\varphi, \lambda),\ y(\varphi, \lambda)\big),$$
usually continuous, injective and differentiable (pma-9.11) on its domain, so that it can be inverted and its local distortion measured. It need not be defined on the whole sphere: cylindrical maps are cut along a meridian (and Mercator's cannot reach the poles), azimuthal maps are centred on a point and the gnomonic covers less than a hemisphere. The *aspect* (where the map is centred) and a *scale* $R$ (map length per radian) complete the description; examples on the unit sphere are $x = \lambda,\ y = \ln\tan(\pi/4 + \varphi/2)$ (Mercator) and, centred on the North Pole, $x = r\sin\lambda,\ y = -r\cos\lambda$ with $r = 2\tan\tfrac{c}{2}$ (stereographic) where $c = 90^\circ - \varphi$.`,
      idea: String.raw`Every printed or digital map is such a function composed with a scale and a choice of centre. Many are defined geometrically — light projected from a point onto a plane, cylinder or cone — but most modern ones are simply formulas chosen for a property (angles, areas, distances from a centre, a pleasing look). The graticule of meridians and parallels is the quickest picture of a projection: it is the image of the coordinate grid. Where the function is not continuous (the seam) or not defined (a cut-off cap), the map tears the sphere; chapter 3.2 shows some tearing or stretching is unavoidable.`,
      caption: String.raw`Choose a projection and drag $P$ on the globe (or rotate the globe). The chequered patch around $P$ (6° cells) and its image show how the function carries a small region; the red seam or cap on the globe marks where this map is cut or undefined. The readout evaluates the projection's formula by hand and compares it with the map's own value. (On the whole-sphere azimuthal maps the South Pole becomes the rim, so Antarctica is left off.)`,
      deps: ['geog-1.2', 'pma-9.11'],
      refs: ['Snyder §1'],
      tags: ['map projections'],
      viz(v) {
        const NAMES = ['equirectangular', 'mercator', 'mollweide', 'robinson', 'stereographic', 'lambert', 'azimuthalEquidistant', 'gnomonic'];
        const pj = v.select('projection', NAMES.map((n) => ({ value: n, label: LABEL[n] })), 'mercator');
        const sA = v.stage({ height: 340 }), sB = v.stage({ height: 340 });
        const G1 = v.globe(sA, { projection: 'orthographic', center: [15, 30], graticule: 15 });
        const G2 = v.globe(sB, { projection: 'mercator', center: [0, 0], graticule: 15, drag: false });
        const P = G1.handle(28, 47, { label: 'P', color: 'accent' }); G2.handle(P);
        let last = '';
        const NOANT = [...new Set(v.geo('land').map((q) => q.name))].filter((n) => n !== 'Antarctica');
        const mollT = (f) => { let t = 2 * f; for (let i = 0; i < 50; i++) { const dt = (t + Math.sin(t) - Math.PI * Math.sin(f)) / (1 + Math.cos(t) + 1e-15); t -= dt; if (Math.abs(dt) < 1e-14) break; } return t / 2; };
        function mine(name, lon, lat) {
          const l = lon * D2R, f = lat * D2R, c = Math.PI / 2 - f;
          const pol = (r) => [r * Math.sin(l), -r * Math.cos(l)];
          switch (name) {
            case 'equirectangular': return { xy: [l, f], tex: String.raw`x = \lambda,\ y = \varphi` };
            case 'mercator': return { xy: [l, Math.log(Math.tan(Math.PI / 4 + f / 2))], tex: String.raw`x = \lambda,\ y = \ln\tan\left(\tfrac{\pi}{4} + \tfrac{\varphi}{2}\right)` };
            case 'mollweide': { const t = mollT(f); return { xy: [(2 * Math.SQRT2 / Math.PI) * l * Math.cos(t), Math.SQRT2 * Math.sin(t)], tex: String.raw`x = \tfrac{2\sqrt2}{\pi}\lambda\cos\theta,\ y = \sqrt2\sin\theta,\ 2\theta + \sin 2\theta = \pi\sin\varphi` }; }
            case 'robinson': return { xy: null, tex: String.raw`x = 0.8487\,X(\varphi)\,\lambda,\ y = 1.3523\,Y(\varphi)\ \text{(Robinson's table)}` };
            case 'stereographic': return { xy: c <= 110 * D2R ? pol(2 * Math.tan(c / 2)) : null, tex: String.raw`(x, y) = r(\sin\lambda, -\cos\lambda),\ r = 2\tan\tfrac{c}{2}` };
            case 'lambert': return { xy: pol(2 * Math.sin(c / 2)), tex: String.raw`(x, y) = r(\sin\lambda, -\cos\lambda),\ r = 2\sin\tfrac{c}{2}` };
            case 'azimuthalEquidistant': return { xy: pol(c), tex: String.raw`(x, y) = r(\sin\lambda, -\cos\lambda),\ r = c` };
            case 'gnomonic': return { xy: c <= 60 * D2R ? pol(Math.tan(c)) : null, tex: String.raw`(x, y) = r(\sin\lambda, -\cos\lambda),\ r = \tan c` };
          }
          return { xy: null, tex: '' };
        }
        v.render(() => {
          const name = pj.value;
          if (name !== last) { last = name; G2.set({ projection: name, center: AZ.has(name) ? [0, 90] : [0, 0] }); }
          const az = AZ.has(name), clip = { stereographic: 110, gnomonic: 60, lambert: 179.5, azimuthalEquidistant: 179.5 }[name];
          for (const G of [G1, G2]) {
            G.draw(G === G2 && az && clip > 179 ? { land: NOANT } : {});
            const d = 6, f0 = clamp(P.lat - 12, -84, 72);
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) G.polygon([cellRing(P.lon - 12 + i * d, f0 + j * d, d, d)], { fill: (i + j) % 2 ? 'orange' : 'accent', fillAlpha: 0.55, color: 'ink', width: 0.6, alpha: 0.6 });
          }
          // where this map is cut or undefined, drawn on the globe
          if (az) { if (clip < 179) G1.smallCircle([0, -90], 180 - clip, { fill: 'red', fillAlpha: 0.16, color: 'red', width: 1.5 }); G1.dot([0, 90], { r: 4, color: 'red' }); }
          else {
            G1.path(meridian(180), { geodesic: false, color: 'red', width: 2.6, dash: [6, 4] });
            if (name === 'mercator') for (const s of [1, -1]) G1.smallCircle([0, 90 * s], 5, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.5 });
          }
          sA.corner('the sphere', 'tl', { color: 'muted', weight: 600 });
          sB.corner(`${LABEL[name]}${az ? ' (centred on the North Pole)' : ''}`, 'tl', { color: 'muted', weight: 600, plate: true });
          v.legend([['red', az ? (clip < 179 ? 'not on this map' : 'centre of the map') : 'seam (cut)', az ? (clip < 179 ? { area: true } : { dot: true }) : { dash: true }], ['accent', 'patch of 6° cells around P', { area: true }]]);
        });
        v.readout(() => {
          const name = pj.value, M = mine(name, P.lon, P.lat), k = G2.project(P.lon, P.lat);
          const head = `$P = (\\varphi, \\lambda) = (${P.lat.toFixed(2)}^\\circ, ${P.lon.toFixed(2)}^\\circ)$. ${LABEL[name]}: $${M.tex}$.`;
          if (!k) return `${head} **$P$ is outside this map's domain.**`;
          const by = M.xy ? ` By hand: $(${M.xy[0].toFixed(4)}, ${M.xy[1].toFixed(4)})$; the map: $(${k[0].toFixed(4)}, ${k[1].toFixed(4)})$ (difference $${v.sci(Math.hypot(M.xy[0] - k[0], M.xy[1] - k[1]) + 1e-17, 1)}$).` : ` The map gives $(x, y) = (${k[0].toFixed(4)}, ${k[1].toFixed(4)})$.`;
          return `${head}${by} On a map of scale 1 : 50 million these are ${comma((k[0] * R_MEAN * 1e5) / 5e7, 1)} cm and ${comma((k[1] * R_MEAN * 1e5) / 5e7, 1)} cm from the origin.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'No map of a sphere preserves all distances',
      credit: 'Euler, 1775 (presented; published 1778); Gauss, Theorema Egregium, 1827',
      statement: String.raw`No map projection of any open region of a sphere, however small, is an isometry onto a region of the plane — not even up to a constant scale. Equivalently, for every projection $F$ and every cap there are points $p, q$ in it with
$$\frac{|F(p) - F(q)|}{d_{S^2}(p, q)} \ne \frac{|F(p') - F(q')|}{d_{S^2}(p', q')}$$
for some other pair $p', q'$. Concretely, a geodesic circle of radius $\rho$ on the unit sphere has circumference $2\pi\sin\rho < 2\pi\rho$, so a map that kept all distances from the centre would have to shrink the rim, and one that kept the rim would have to stretch the radii.`,
      idea: String.raw`An isometry (dg-5.4) preserves the first fundamental form, and by Gauss's *Theorema Egregium* (dg-8.3) the Gaussian curvature depends only on that form: the sphere has $K = 1/R^2$ and the plane $K = 0$, so no isometry (or similarity, which rescales $K$ by a positive factor) can exist. The elementary version is the circumference argument: in the plane a circle of radius $\rho$ has length $2\pi\rho$, on the sphere only $2\pi R\sin(\rho/R)$; flattening an orange-peel cap that keeps its radii leaves wedge-shaped gaps of total angle $2\pi(1 - \sin\rho/\rho)$. Euler gave a proof from the line element in 1775; Gauss's 1827 theorem explains it.`,
      caption: String.raw`Move the cap (drag $C$) and change its radius. Left: true lengths on the globe; middle: the cap on the chosen map (centred on $C$ and zoomed to fit), with the well-shaped triangle of sample points whose side ratios disagree most, its map lengths scaled as well as possible. Right: the cap cut into 12 gores and laid flat keeping every radius and every rim length — the red gaps cannot be closed. Below: for each azimuthal projection centred on the cap, the worst disagreement between distance ratios as the cap grows; every curve leaves 0, and the dashed line is the rim stretch $\rho/\sin\rho$ that keeping the radii forces.`,
      deps: ['geog-3.1', 'dg-8.3', 'dg-5.4'],
      see: ['geog-1.5'],
      refs: ['Snyder §1', 'Snyder §4'],
      tags: ['map projections', 'curvature'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theorema_Egregium' },
      viz(v) {
        const NAMES = ['azimuthalEquidistant', 'stereographic', 'lambert', 'gnomonic', 'orthographic'];
        const COLS = { azimuthalEquidistant: 'accent', stereographic: 'purple', lambert: 'teal', gnomonic: 'pink', orthographic: 'orange' };
        const pj = v.select('map', NAMES.map((n) => ({ value: n, label: LABEL[n] })), 'azimuthalEquidistant');
        const rho = v.slider('cap radius $\\rho$', 3, 80, 35, { step: 1, fmt: (x) => `${x.toFixed(0)}° (${comma(x * D2R * R_MEAN)} km)` });
        const sA = v.stage({ height: 300 }), sM = v.stage({ height: 300 });
        const sP = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 300 });
        const sQ = v.stage({ x: [0, 80], y: [0.01, 300], ylog: true, axes: 'box', gutter: true, height: 300, xlabel: 'cap radius ρ (°)', ylabel: 'worst ratio mismatch (%)' });
        const G = v.globe(sA, { projection: 'orthographic', center: [10, 35], graticule: 15 });
        const GM = v.globe(sM, { projection: 'azimuthalEquidistant', center: [15, 45], graticule: 15, drag: false });
        const C = G.handle(15, 45, { label: 'C', color: 'accent' });
        const NS = 30, GA = Math.PI * (3 - Math.sqrt(5));
        const samples = (c, r) => { const out = []; for (let i = 0; i < NS; i++) out.push(v.geo('destination', c, mod((i * GA) * R2D, 360), r * Math.sqrt((i + 0.5) / NS))); return out; };
        const centreOf = (name, c) => (AZ.has(name) ? c : [c[0], 0]);
        function pairStats(P, pts) {
          const V = pts.map(vec), Q = pts.map((p) => P.forward(p[0], p[1]));
          if (Q.some((q) => !q)) return null;
          const K = []; let lo = Infinity, hi = 0;
          for (let i = 0; i < NS; i++) { K.push([]); for (let j = 0; j < NS; j++) { if (j <= i) { K[i].push(j === i ? 1 : K[j][i]); continue; } const k = Math.hypot(Q[i][0] - Q[j][0], Q[i][1] - Q[j][1]) / angle3(V[i], V[j]); K[i].push(k); lo = Math.min(lo, k); hi = Math.max(hi, k); } }
          return { K, Q, lo, hi };
        }
        let curveKey = '', curves = {}, triKey = '', tri = null;
        function getCurves(c) {
          const kk = c.map((x) => x.toFixed(2)).join();
          if (kk === curveKey) return curves; curveKey = kk; curves = {};
          for (const n of NAMES) {
            const P = v.geo('projection', n, { center: centreOf(n, c) }), pts = [];
            for (let r = 2; r <= 80; r += 2) { const S = pairStats(P, samples(c, r)); if (!S) break; pts.push([r, Math.max(0.011, (S.hi / S.lo - 1) * 100)]); }
            curves[n] = pts;
          }
          return curves;
        }
        function getTri(c, r, n) {
          const kk = [c[0].toFixed(3), c[1].toFixed(3), r, n].join();
          if (kk === triKey) return tri; triKey = kk;
          const pts = samples(c, r), P = v.geo('projection', n, { center: centreOf(n, c) }), S = pairStats(P, pts);
          if (!S) return (tri = null);
          let best = null; const V = pts.map(vec), Dd = (i, j) => angle3(V[i], V[j]);
          for (let i = 0; i < NS; i++) for (let j = i + 1; j < NS; j++) for (let k = j + 1; k < NS; k++) {
            const s1 = Dd(i, j), s2 = Dd(j, k), s3 = Dd(i, k), mx = Math.max(s1, s2, s3), mn = Math.min(s1, s2, s3);
            if (mn < 0.5 * mx || s1 + s2 + s3 - 2 * mx < 0.25 * mx) continue; // keep well-shaped triangles
            const a = S.K[i][j], b = S.K[j][k], d = S.K[i][k], sp = Math.max(a, b, d) / Math.min(a, b, d);
            if (!best || sp > best.sp) best = { sp, ids: [i, j, k] };
          }
          return (tri = { pts, S, best, scale: Math.sqrt(S.lo * S.hi) });
        }
        let lastC = '';
        v.render(() => {
          const c = [C.lon, C.lat], r = rho.value, name = pj.value;
          const ck = name + centreOf(name, c).map((x) => x.toFixed(3)).join();
          const zk = ck + r;
          if (zk !== lastC) {
            lastC = zk;
            const P = v.geo('projection', name, { center: c }), e = P.forward(...v.geo('destination', c, 90, Math.min(r, (P.clip || 90) - 0.5)));
            GM.set({ projection: name, center: centreOf(name, c), zoom: e ? clamp(P.rMax / (1.35 * Math.hypot(e[0], e[1])), 1, 40) : 1 });
          }
          const T = getTri(c, r, name), cap = v.geo('smallCircle', c, r, 120);
          for (const g of [G, GM]) {
            g.draw();
            g.polygon([cap], { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.6 });
            if (T) {
              for (const p of T.pts) g.dot(p, { r: 2.2, color: 'muted', ring: false });
              const ids = T.best.ids, tp = ids.map((i) => T.pts[i]);
              g.path([...tp, tp[0]], { color: 'red', width: 2.2 });
              for (const p of tp) g.dot(p, { r: 4, color: 'red' });
            }
          }
          if (T) {
            const ids = T.best.ids, V = ids.map((i) => vec(T.pts[i]));
            for (let s = 0; s < 3; s++) {
              const i = ids[s], j = ids[(s + 1) % 3], mid = lonlat(unit3([V[s][0] + V[(s + 1) % 3][0], V[s][1] + V[(s + 1) % 3][1], V[s][2] + V[(s + 1) % 3][2]]));
              const km = angle3(V[s], V[(s + 1) % 3]) * R_MEAN, mkm = (km * T.S.K[i][j]) / T.scale;
              const g = unit3(V.reduce((acc, q) => [acc[0] + q[0], acc[1] + q[1], acc[2] + q[2]], [0, 0, 0])), mv = vec(mid);
              const out = lonlat(unit3([mv[0] + 0.45 * (mv[0] - g[0]), mv[1] + 0.45 * (mv[1] - g[1]), mv[2] + 0.45 * (mv[2] - g[2])]));
              G.text(comma(km), out, { size: 11, color: 'ink', weight: 600, plate: true, align: 'center', baseline: 'middle' });
              GM.text(comma(mkm), out, { size: 11, color: 'red', weight: 600, plate: true, align: 'center', baseline: 'middle' });
            }
          } else sM.corner('the cap does not fit on this map', 'bl', { color: 'red', plate: true });
          sA.corner('true lengths (km)', 'tl', { color: 'muted', weight: 600 });
          sM.corner(`${LABEL[name]}: map lengths (km)`, 'tl', { color: 'muted', weight: 600, plate: true });
          // ---- the peel: 12 gores keeping radii and rim lengths
          const rr = r * D2R, frac = Math.sin(rr) / rr, NG = 12, gore = (2 * Math.PI * frac) / NG, gap = (2 * Math.PI * (1 - frac)) / NG;
          for (let g = 0; g < NG; g++) {
            const a0 = Math.PI / 2 + g * (gore + gap), pts = [[0, 0]];
            for (let i = 0; i <= 16; i++) { const a = a0 + (gore * i) / 16; pts.push([Math.cos(a), Math.sin(a)]); }
            sP.poly(pts, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.2 });
            const gp = [[0, 0]]; for (let i = 0; i <= 8; i++) { const a = a0 + gore + (gap * i) / 8; gp.push([Math.cos(a), Math.sin(a)]); }
            sP.poly(gp, { fill: 'red', fillAlpha: 0.45, stroke: false });
          }
          for (const q of [0.33, 0.67]) sP.circle(0, 0, q, { color: 'muted', width: 0.7, alpha: 0.5, dash: [2, 3] });
          sP.corner(`gaps: ${(360 * (1 - frac)).toFixed(1)}° of 360°`, 'tl', { color: 'red', weight: 600, plate: true });
          sP.corner('orange peel laid flat', 'bl', { color: 'muted' });
          // ---- curves
          const CV = getCurves(c);
          sQ.fn((x) => (x * D2R / Math.sin(x * D2R) - 1) * 100, { domain: [1, 80], color: 'ink', width: 1.4, dash: [5, 4] });
          for (const n of NAMES) if (CV[n].length) sQ.path(CV[n], { color: COLS[n], width: n === name ? 3 : 1.5, alpha: n === name ? 1 : 0.75 });
          sQ.vline(r, { color: 'muted', dash: [3, 3] });
          if (T) sQ.dot(r, Math.max(0.011, (T.S.hi / T.S.lo - 1) * 100), { r: 5, color: COLS[name] });
          v.legend([...NAMES.map((n) => [COLS[n], LABEL[n]]), ['ink', String.raw`rim stretch $\rho/\sin\rho - 1$`, { dash: true }], ['red', 'worst triangle / gaps', { area: true }]]);
        });
        v.readout(() => {
          const c = [C.lon, C.lat], r = rho.value, T = getTri(c, r, pj.value);
          const frac = Math.sin(r * D2R) / (r * D2R);
          const gaps = `Flattening the cap keeping radii leaves gaps of $2\\pi(1 - \\sin\\rho/\\rho) = ${(360 * (1 - frac)).toFixed(2)}^\\circ$.`;
          if (!T) return `${gaps} This cap does not fit on the ${LABEL[pj.value]} map.`;
          return `${gaps} On the ${LABEL[pj.value]} map, distance ratios (map ÷ globe) over ${NS} sample points range over a factor **${(T.S.hi / T.S.lo).toFixed(4)}**; even a well-shaped triangle (red) has sides whose ratios disagree by a factor **${T.best.sp.toFixed(4)}**, however the map is scaled. An isometry would need 1.0000 — impossible for every projection and every $\\rho > 0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Scale factors along meridians and parallels',
      statement: String.raw`For a projection $(x, y)(\varphi, \lambda)$ of a sphere of radius $R$ drawn at nominal scale $R$, the **meridian scale factor** $h$ and the **parallel scale factor** $k$ at a point are the ratios of map length to true length for short steps along the meridian and along the parallel:
$$h = \frac{1}{R}\sqrt{x_\varphi^2 + y_\varphi^2},\qquad k = \frac{1}{R\cos\varphi}\sqrt{x_\lambda^2 + y_\lambda^2},$$
where subscripts are partial derivatives (pma-9.17). The angle $\theta'$ between the images of the meridian and the parallel is given by $\cos\theta' = (x_\varphi x_\lambda + y_\varphi y_\lambda)/(R^2 h k\cos\varphi)$. For example the plate carrée has $h = 1$, $k = \sec\varphi$; Mercator has $h = k = \sec\varphi$; the polar stereographic has $h = k = \sec^2(c/2)$ with $c = 90^\circ - \varphi$.`,
      idea: String.raw`A small step $R\,d\varphi$ north moves the map point by $(x_\varphi, y_\varphi)\,d\varphi$, and a small step $R\cos\varphi\,d\lambda$ east (the parallel has radius $R\cos\varphi$, 1.2) moves it by $(x_\lambda, y_\lambda)\,d\lambda$; dividing lengths gives $h$ and $k$. They are the lengths of the two columns of the derivative matrix in the orthonormal east–north frame. When $\theta' = 90^\circ$ — on all cylindrical, conic and polar azimuthal maps — $h$ and $k$ are the extreme scales at the point; otherwise (Mollweide, Robinson away from the central meridian) the extremes lie in other directions, which is what Tissot's indicatrix (3.4) captures.`,
      caption: String.raw`Choose a projection and drag the probe. At the probe, a 16° meridian arc (purple) and a 16° parallel arc (orange) are drawn on the map, next to a bar of true length 16° at the map's nominal scale (bottom left). The right panel plots $h$ and $k$ along the probe's meridian, computed by finite differences of the projection (solid) and from the closed formulas where they exist (dashed).`,
      deps: ['geog-3.1', 'pma-9.17'],
      refs: ['Snyder §4'],
      tags: ['map projections', 'distortion'],
      viz(v) {
        const NAMES = ['equirectangular', 'mercator', 'mollweide', 'robinson', 'stereographic', 'lambert', 'azimuthalEquidistant'];
        const pj = v.select('projection', NAMES.map((n) => ({ value: n, label: LABEL[n] })), 'mollweide');
        const sA = v.stage({ height: 350, weight: 1.25 });
        const sB = v.stage({ x: [-90, 90], y: [0, 4], axes: 'box', gutter: true, height: 350, xlabel: 'latitude φ (°) along the probe’s meridian', ylabel: 'scale factor' });
        const G = v.globe(sA, { projection: 'mollweide', center: [0, 0], graticule: 15, drag: false });
        const P = G.handle(95, 50, { label: 'probe', color: 'ink' });
        const ANALYTIC = {
          equirectangular: (f) => [1, 1 / Math.cos(f * D2R)],
          mercator: (f) => [1 / Math.cos(f * D2R), 1 / Math.cos(f * D2R)],
          stereographic: (f) => { const s = 2 / (1 + Math.sin(f * D2R)); return [s, s]; },
          lambert: (f) => { const c = (90 - f) * D2R / 2; return [Math.cos(c), 1 / Math.cos(c)]; },
          azimuthalEquidistant: (f) => { const c = (90 - f) * D2R; return [1, c / Math.sin(c)]; },
        };
        let last = '';
        const DEL = 8;
        v.render(() => {
          const name = pj.value;
          if (name !== last) { last = name; G.set({ projection: name, center: AZ.has(name) ? [0, 90] : [0, 0] }); }
          G.draw();
          const pr = (l, f) => G.project(l, f);
          const p = [P.lon, P.lat], J = jacobian(pr, p);
          const mer = [], par = [];
          for (let i = -20; i <= 20; i++) { mer.push([p[0], clamp(p[1] + (DEL * i) / 20, -89.9, 89.9)]); par.push([p[0] + (DEL * i) / 20 / Math.cos(p[1] * D2R), p[1]]); }
          G.path(mer, { geodesic: false, color: 'purple', width: 4.5 });
          G.path(par, { geodesic: false, color: 'orange', width: 4.5 });
          // reference bar of true length 2·DEL at nominal scale
          const [x0, x1] = sA.xr, [y0] = sA.yr, L = 2 * DEL * D2R, bx = x0 + (x1 - x0) * 0.05, by = y0 + (sA.yr[1] - y0) * 0.06;
          sA.line(bx, by, bx + L, by, { color: 'ink', width: 4 });
          sA.text('16° at true scale', bx + L + 0.04, by, { size: 11, color: 'ink', baseline: 'middle' });
          sA.corner(LABEL[name] + (AZ.has(name) ? ' (polar)' : ''), 'tl', { color: 'muted', weight: 600, plate: true });
          // h, k along the meridian
          const fLo = name === 'stereographic' ? -19 : AZ.has(name) ? -85 : -85, fHi = 85, H = [], K = [];
          for (let f = fLo; f <= fHi; f += 0.5) { const j = jacobian(pr, [p[0], f]); if (j) { H.push([f, j.h]); K.push([f, j.k]); } else { H.push(null); K.push(null); } }
          sB.hline(1, { color: 'green', width: 1, dash: [2, 3] });
          sB.path(K, { color: 'orange', width: 2.6 });
          sB.path(H, { color: 'purple', width: 2.6 });
          const A = ANALYTIC[name];
          if (A) { sB.fn((f) => (f >= fLo && f <= fHi ? A(f)[1] : NaN), { color: 'ink', width: 1.2, dash: [4, 4] }); sB.fn((f) => (f >= fLo && f <= fHi ? A(f)[0] : NaN), { color: 'ink', width: 1.2, dash: [4, 4] }); }
          if (J) { sB.vline(p[1], { color: 'muted', dash: [3, 3] }); sB.dot(p[1], Math.min(4, J.h), { r: 5, color: 'purple' }); sB.dot(p[1], Math.min(4, J.k), { r: 5, color: 'orange' }); }
          v.legend([['purple', 'meridian scale h'], ['orange', 'parallel scale k'], ['ink', 'closed formula', { dash: true }]]);
        });
        v.readout(() => {
          const name = pj.value, p = [P.lon, P.lat], J = jacobian((l, f) => G.project(l, f), p);
          if (!J) return 'The probe is outside the map.';
          const A = ANALYTIC[name], T = G.distortion(p);
          const fm = A ? ` Closed formula: $h = ${A(p[1])[0].toFixed(4)},\\ k = ${A(p[1])[1].toFixed(4)}$.` : '';
          return `At $\\varphi = ${p[1].toFixed(1)}^\\circ,\\ \\lambda = ${p[0].toFixed(1)}^\\circ$: **$h = ${J.h.toFixed(4)}$, $k = ${J.k.toFixed(4)}$** (finite differences).${fm} The images of meridian and parallel meet at $\\theta' = ${J.theta.toFixed(2)}^\\circ$${Math.abs(J.theta - 90) > 0.05 ? `, not 90°, so the extreme scales are not $h, k$ but $a = ${T.a.toFixed(4)},\\ b = ${T.b.toFixed(4)}$ (3.4).` : ' — a right angle, so $h$ and $k$ are the extreme scales here.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Tissot’s indicatrix',
      credit: 'Nicolas Auguste Tissot, 1859 and 1871',
      statement: String.raw`Let $F$ be a projection differentiable at a point $p$ with invertible derivative $DF_p$, a linear map from the tangent plane of the sphere to the plane. Then:
(a) the image of an infinitesimal circle of radius $\varepsilon$ about $p$ is, to first order in $\varepsilon$, an **ellipse** — Tissot's indicatrix — with semi-axes $a\varepsilon$ and $b\varepsilon$, where $a \ge b > 0$ are the singular values of $DF_p$ (ladr-7.70);
(b) there is a pair of **perpendicular** directions at $p$ whose images are still perpendicular, and they are the directions of greatest and least scale $a$ and $b$;
(c) the local area scale is $ab = |\det DF_p|$ and the largest change of angle is $\omega = 2\arcsin\frac{a - b}{a + b}$.`,
      idea: String.raw`Near $p$, $F$ is its derivative plus an error $o(\varepsilon)$ (pma-9.11), so the image of a small circle is the image of a circle under a linear map, up to that error. By the singular value decomposition, $DF_p = U\Sigma V^{\mathsf T}$: rotate the tangent plane by $V^{\mathsf T}$, stretch along perpendicular axes by $a$ and $b$, rotate by $U$. A circle survives the rotations and becomes an ellipse under the stretch; the columns of $V$ are the perpendicular directions that stay perpendicular. Computing $a, b$ from $h, k$ and the angle $\theta'$ (3.3) gives Tissot's formulas $a^2 + b^2 = h^2 + k^2$ and $ab = hk\sin\theta'$.`,
      caption: String.raw`Choose a projection; the grid shows indicatrices every 30°. Drag the probe and enlarge its circle: the red ellipse is the derivative's image of the circle, the dashed curve is the true image of the geodesic circle, and the readout measures how far apart they are — the gap vanishes as the circle shrinks. The right panel opens up the derivative: the perpendicular directions $v_1, v_2$ on the globe go to the ellipse's axes $a\,u_1, b\,u_2$.`,
      deps: ['geog-3.3', 'ladr-7.70'],
      refs: ['Snyder §4'],
      tags: ['map projections', 'distortion', 'singular values'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tissot%27s_indicatrix' },
      viz(v) {
        const NAMES = ['robinson', 'mollweide', 'mercator', 'equirectangular', 'lambert', 'stereographic', 'orthographic'];
        const pj = v.select('projection', NAMES.map((n) => ({ value: n, label: LABEL[n] })), 'robinson');
        const rad = v.slider('probe circle radius', 0.5, 25, 10, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        const sA = v.stage({ height: 340, weight: 1.35 });
        const sB = v.stage({ x: [-2.5, 2.5], y: [-1.35, 1.35], equal: true, axes: false, height: 340, title: 'the derivative at the probe' });
        const G = v.globe(sA, { projection: 'robinson', center: [0, 0], graticule: 30, drag: false });
        const P = G.handle(110, 52, { label: 'probe', color: 'ink' });
        let last = '';
        function deviation(p, J, r) { // true image of the geodesic circle vs the linear ellipse, relative to a·r
          let worst = 0;
          for (let i = 0; i < 72; i++) {
            const th = (360 * i) / 72, q = v.geo('destination', p, th, r), m = G.project(q[0], q[1]); if (!m) return null;
            const e = Math.sin(th * D2R) * r * D2R, n = Math.cos(th * D2R) * r * D2R, lin = [J.c[0] + J.E[0] * e + J.N[0] * n, J.c[1] + J.E[1] * e + J.N[1] * n];
            worst = Math.max(worst, Math.hypot(m[0] - lin[0], m[1] - lin[1]));
          }
          return worst / (J.a * r * D2R);
        }
        v.render(() => {
          const name = pj.value;
          if (name !== last) { last = name; G.set({ projection: name, center: [0, 0] }); }
          G.draw();
          G.tissot({ step: 30, lat: [-60, 60], radius: 4.5, fill: 'red', fillAlpha: 0.18, color: 'red', width: 0.9 });
          const p = [P.lon, P.lat], J = jacobian((l, f) => G.project(l, f), p);
          if (J) G.indicatrix(p, { radius: rad.value, axes: true, circle: true, fill: 'red', fillAlpha: 0.12, color: 'red', width: 2, circleColor: 'ink' });
          sA.corner(LABEL[name], 'tl', { color: 'muted', weight: 600, plate: true });
          // ---- the derivative: circle on the tangent plane → ellipse on the map
          const L = [-1.3, 0], R = [1.3, 0];
          sB.text('tangent plane at the probe', L[0], 1.24, { align: 'center', size: 11.5, weight: 600 });
          sB.text('its image on the map', R[0], 1.24, { align: 'center', size: 11.5, weight: 600 });
          sB.arrow(-0.12, 0, 0.12, 0, { color: 'muted', width: 1.4, head: 7 });
          sB.tex('DF_p', 0, 0.18, { size: 13, color: 'muted' });
          if (J) {
            const s = 0.95 / Math.max(1, J.a);
            sB.circle(L[0], L[1], s, { color: 'ink', width: 1.6, fill: 'muted', fillAlpha: 0.06 });
            sB.line(L[0], L[1] - s * 1.12, L[0], L[1] + s * 1.12, { color: 'muted', width: 0.7, dash: [2, 3] }); sB.text('N', L[0], L[1] + s * 1.15, { size: 10, color: 'muted', align: 'center', baseline: 'bottom' });
            sB.line(L[0] - s * 1.12, L[1], L[0] + s * 1.12, L[1], { color: 'muted', width: 0.7, dash: [2, 3] }); sB.text('E', L[0] + s * 1.15, L[1], { size: 10, color: 'muted', baseline: 'middle' });
            sB.arrow(L[0], L[1], L[0] + s * J.v1[0], L[1] + s * J.v1[1], { color: 'red', width: 2.2, head: 7 });
            sB.arrow(L[0], L[1], L[0] + s * J.v2[0], L[1] + s * J.v2[1], { color: 'blue', width: 2.2, head: 7 });
            sB.tex('v_1', L[0] + s * 1.18 * J.v1[0], L[1] + s * 1.18 * J.v1[1], { color: 'red', size: 13 });
            sB.tex('v_2', L[0] + s * 1.18 * J.v2[0], L[1] + s * 1.18 * J.v2[1], { color: 'blue', size: 13 });
            const ell = []; for (let i = 0; i <= 72; i++) { const t = (2 * Math.PI * i) / 72, w = [Math.cos(t), Math.sin(t)]; ell.push([R[0] + s * (J.E[0] * w[0] + J.N[0] * w[1]), R[1] + s * (J.E[1] * w[0] + J.N[1] * w[1])]); }
            sB.path(ell, { color: 'ink', width: 1.6, fill: 'red', fillAlpha: 0.1, close: true });
            sB.arrow(R[0], R[1], R[0] + s * J.a * J.u1[0], R[1] + s * J.a * J.u1[1], { color: 'red', width: 2.2, head: 7 });
            sB.arrow(R[0], R[1], R[0] + s * J.b * J.u2[0], R[1] + s * J.b * J.u2[1], { color: 'blue', width: 2.2, head: 7 });
            sB.tex('a\\,u_1', R[0] + s * (J.a + 0.22) * J.u1[0], R[1] + s * (J.a + 0.22) * J.u1[1], { color: 'red', size: 13 });
            sB.tex('b\\,u_2', R[0] + s * (J.b + 0.25) * J.u2[0], R[1] + s * (J.b + 0.25) * J.u2[1], { color: 'blue', size: 13 });
            sB.corner(`scale ×${s.toFixed(2)} for display`, 'bl', { color: 'muted' });
          }
          v.legend([['red', 'indicatrix (derivative image)', { area: true }], ['ink', 'true image of the circle', { dash: true }], ['red', String.raw`$v_1 \mapsto a\,u_1$`], ['blue', String.raw`$v_2 \mapsto b\,u_2$`]]);
        });
        v.readout(() => {
          const p = [P.lon, P.lat], J = jacobian((l, f) => G.project(l, f), p);
          if (!J) return 'The probe is outside the map.';
          const T = G.distortion(p), dev = deviation(p, J, rad.value);
          const d1 = J.v1[0] * J.v2[0] + J.v1[1] * J.v2[1], d2 = J.u1[0] * J.u2[0] + J.u1[1] * J.u2[1];
          return `Singular values **$a = ${J.a.toFixed(4)}$, $b = ${J.b.toFixed(4)}$** (the map's own Jacobian: ${T.a.toFixed(4)}, ${T.b.toFixed(4)}); area scale $ab = ${(J.a * J.b).toFixed(4)}$, max angle change $\\omega = ${J.omega.toFixed(2)}^\\circ$. $v_1 \\cdot v_2 = ${v.fix(d1, 6)}$ and $u_1 \\cdot u_2 = ${v.fix(d2, 6)}$: perpendicular before and after. ${dev == null ? 'The circle is cut by the map edge.' : `For a ${rad.value.toFixed(1)}° circle the true image strays **${(dev * 100).toFixed(2)}%** of $a\\varepsilon$ from the ellipse — shrink it and the gap shrinks in proportion.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Proposition',
      name: 'Conformal maps turn small circles into circles',
      statement: String.raw`A projection is **conformal** if it preserves the angle between any two curves at every point where it is differentiable with nonzero derivative. This holds if and only if every Tissot indicatrix is a circle, $a = b$ — equivalently $h = k$ and $\theta' = 90^\circ$ — so that the scale at a point is the same in all directions (though it may change from point to point). Mercator, stereographic, transverse Mercator and Lambert's conformal conic are conformal; the plate carrée, Lambert's equal-area maps, Mollweide's and the orthographic are not.`,
      idea: String.raw`At a point the projection acts on directions through its derivative $DF_p$ (3.4). A linear map preserves all angles exactly when it is a rotation times a positive scalar, i.e. when its singular values are equal; then it maps circles to circles. If $a > b$, the directions at $45^\circ$ to the axes of the indicatrix are bent toward the long axis and an angle can change by as much as $\omega = 2\arcsin\frac{a-b}{a+b}$. In terms of the scale factors, $a = b$ is equivalent to $h = k$ together with meridians and parallels crossing at right angles, the condition Mercator met by spacing his parallels at $\int \sec\varphi\,d\varphi$.`,
      caption: String.raw`Pick a map and drag the crossing $X$; set the bearing of the first road and the angle $\gamma$ between the roads on the globe. The readout compares $\gamma$ with the angle $\gamma'$ measured between the roads' images on the map. The right panel sweeps $\gamma$ from 0° to 180°: on conformal maps $\gamma' = \gamma$ (the diagonal) wherever $X$ is; on the others the curve sags away from it, by up to $\omega$.`,
      deps: ['geog-3.4'],
      see: ['geog-4.2', 'geog-5.2'],
      refs: ['Snyder §4'],
      tags: ['map projections', 'conformal maps'],
      viz(v) {
        const NAMES = ['mercator', 'stereographic', 'transverseMercator', 'equirectangular', 'lambert', 'mollweide', 'orthographic'];
        const CONF = new Set(['mercator', 'stereographic', 'transverseMercator']);
        const pj = v.select('projection', NAMES.map((n) => ({ value: n, label: LABEL[n] + (CONF.has(n) ? ' ✓' : '') })), 'equirectangular');
        const b1 = v.slider('first road bearing', 0, 180, 30, { step: 1, int: true, fmt: (x) => x + '°' });
        const gam = v.slider('angle between roads $\\gamma$', 5, 175, 60, { step: 1, int: true, fmt: (x) => x + '°' });
        const sA = v.stage({ height: 340, weight: 1.35 });
        const sB = v.stage({ x: [0, 180], y: [0, 180], axes: 'box', gutter: true, height: 340, xlabel: 'angle on the globe γ (°)', ylabel: 'angle on the map γ′ (°)', xticks: [0, 45, 90, 135, 180], yticks: [0, 45, 90, 135, 180] });
        const G = v.globe(sA, { projection: 'equirectangular', center: [0, 0], graticule: 15, drag: false });
        const X = G.handle(30, 58, { label: 'X', color: 'ink' });
        let last = '';
        const mapAngle = (p, ba, bb) => {
          const c = G.project(p[0], p[1]), qa = v.geo('destination', p, ba, 0.01), qb = v.geo('destination', p, bb, 0.01), A = G.project(qa[0], qa[1]), B = G.project(qb[0], qb[1]);
          if (!c || !A || !B) return null;
          const u = [A[0] - c[0], A[1] - c[1]], w = [B[0] - c[0], B[1] - c[1]];
          return Math.acos(clamp((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w)), -1, 1)) * R2D;
        };
        v.render(() => {
          const name = pj.value;
          if (name !== last) { last = name; G.set({ projection: name, center: name === 'orthographic' ? [20, 30] : [0, 0] }); }
          G.draw();
          G.tissot({ step: 30, lat: [-60, 60], radius: 4, fill: CONF.has(name) ? 'green' : 'red', fillAlpha: 0.2, color: CONF.has(name) ? 'green' : 'red', width: 0.8 });
          const p = [X.lon, X.lat];
          const road = (b, col) => G.path([v.geo('destination', p, b + 180, 22), p, v.geo('destination', p, b, 22)], { color: col, width: 3 });
          road(b1.value, 'accent'); road(b1.value + gam.value, 'orange');
          // the angle wedge on the map
          const arc = []; for (let i = 0; i <= 20; i++) arc.push(v.geo('destination', p, b1.value + (gam.value * i) / 20, 5));
          G.path(arc, { geodesic: false, color: 'ink', width: 1.6 });
          sA.corner(LABEL[name] + (CONF.has(name) ? ' — conformal' : ' — not conformal'), 'tl', { color: CONF.has(name) ? 'green' : 'red', weight: 600, plate: true });
          // sweep
          sB.line(0, 0, 180, 180, { color: 'green', width: 1.4, dash: [6, 4] });
          const sw = []; for (let g = 0; g <= 180; g += 2) { const m = mapAngle(p, b1.value, b1.value + g); sw.push(m == null ? null : [g, m]); }
          sB.path(sw, { color: CONF.has(name) ? 'green' : 'red', width: 2.6 });
          const m = mapAngle(p, b1.value, b1.value + gam.value);
          if (m != null) { sB.dot(gam.value, m, { r: 6, color: 'ink' }); sB.vline(gam.value, { color: 'muted', dash: [3, 3] }); }
          v.legend([['accent', 'first road'], ['orange', 'second road'], [CONF.has(name) ? 'green' : 'red', 'map angle γ′ against γ'], ['green', 'γ′ = γ (angles preserved)', { dash: true }]]);
        });
        v.readout(() => {
          const p = [X.lon, X.lat], m = mapAngle(p, b1.value, b1.value + gam.value), T = G.distortion(p);
          if (m == null || !T) return 'The crossing is outside the map.';
          return `On the globe the roads cross at **$\\gamma = ${gam.value}^\\circ$**; on the map at **$\\gamma' = ${m.toFixed(2)}^\\circ$** (error ${v.fix(m - gam.value, 2)}°). Indicatrix at $X$: $a = ${T.a.toFixed(4)},\\ b = ${T.b.toFixed(4)}$, $b/a = ${(T.b / T.a).toFixed(4)}$, so no angle here changes by more than $\\omega = ${T.omega.toFixed(2)}^\\circ$.${CONF.has(pj.value) ? ' Conformal: the circle stays a circle, only its size ' + T.a.toFixed(3) + ' varies.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Proposition',
      name: 'Equal-area maps keep the indicatrix area constant',
      statement: String.raw`A projection drawn at nominal scale is **equal-area** (equivalent, authalic) if every region of the sphere is mapped to a region of the same area. This holds if and only if every Tissot indicatrix has the area of the original circle: $ab = 1$ everywhere, equivalently $hk\sin\theta' = 1$. The indicatrices may be stretched into ellipses of any shape — a long thin one near the edge of a Mollweide map, a round one at its centre — but their areas agree. Lambert's azimuthal and cylindrical equal-area maps, Mollweide's and Albers's are equal-area; Mercator's, the plate carrée and Robinson's are not.`,
      idea: String.raw`Locally the projection multiplies areas by $|\det DF_p| = ab$, the product of the singular values (ladr-7.111); integrating, the map area of a region is $\int ab\,dA$ over the region on the sphere (the change-of-variables formula). If $ab \equiv 1$ every region keeps its area; conversely if $ab > 1$ at some point, a small enough region there is enlarged. So "equal-area" is a pointwise condition on the indicatrix, exactly as "conformal" is (3.5), but on its area instead of its shape.`,
      caption: String.raw`Pick a map. Indicatrices are green where their area is within 2% of the true circle's, red where enlarged and blue where shrunk. Drag the purple copy of Australia anywhere: the readout compares its area on the map (by the shoelace formula on the projected outline) with its true area on the sphere. The right panel plots the area factor $ab$ along the central meridian on a log scale, with Australia's measured ratio as a dot.`,
      deps: ['geog-3.4', 'ladr-7.111'],
      see: ['geog-4.5'],
      refs: ['Snyder §4'],
      tags: ['map projections', 'area'],
      viz(v) {
        const NAMES = ['lambert', 'mollweide', 'robinson', 'equirectangular', 'mercator', 'stereographic'];
        const EQ = new Set(['lambert', 'mollweide']);
        const pj = v.select('projection', NAMES.map((n) => ({ value: n, label: LABEL[n] + (EQ.has(n) ? ' ✓' : '') })), 'mollweide');
        const sA = v.stage({ height: 340, weight: 1.35 });
        const sB = v.stage({ x: [-85, 85], y: [0.2, 30], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'latitude (°) on the central meridian', ylabel: 'area factor ab' });
        const G = v.globe(sA, { projection: 'mollweide', center: [0, 0], graticule: 30, drag: false });
        const AUS = v.geo('landmass', 'Australia'), C0 = ringCentroid(AUS[0]);
        const H = G.handle(20, 52, { label: 'Australia (copy)', color: 'purple' });
        let last = '';
        function copy() { return moveRings(AUS, C0, vec([H.lon, H.lat])); }
        v.render(() => {
          const name = pj.value;
          if (name !== last) { last = name; G.set({ projection: name, center: [0, 0] }); }
          G.draw();
          for (let f = -60; f <= 60; f += 30) for (let l = -165; l < 180; l += 30) {
            const T = G.distortion([l, f]); if (!T) continue;
            const col = T.area > 1.02 ? 'red' : T.area < 0.98 ? 'blue' : 'green';
            G.indicatrix([l, f], { radius: 5, fill: col, fillAlpha: 0.32, color: col, width: 0.9 });
          }
          const R = copy();
          G.polygon(R, { fill: 'purple', fillAlpha: 0.35, color: 'purple', width: 1.6 });
          sA.corner(LABEL[name] + (EQ.has(name) ? ' — equal-area' : ' — not equal-area'), 'tl', { color: EQ.has(name) ? 'green' : 'red', weight: 600, plate: true });
          // area factor on the central meridian
          const pts = []; for (let f = -84; f <= 84; f += 1) { const T = G.distortion([0.0001, f]); pts.push(T ? [f, clamp(T.area, 0.21, 29)] : null); }
          sB.hline(1, { color: 'green', width: 1.4, dash: [6, 4] });
          sB.path(pts, { color: EQ.has(name) ? 'green' : 'red', width: 2.6 });
          const ma = mapArea((l, f) => G.project(l, f), R[0]), ta = Math.abs(v.geo('sphericalArea', R[0]));
          if (ma) sB.dot(H.lat, clamp(ma / ta, 0.21, 29), { r: 6, color: 'purple' });
          v.legend([['green', 'area kept (±2%)', { area: true }], ['red', 'enlarged', { area: true }], ['blue', 'shrunk', { area: true }], ['purple', "Australia's measured ratio", { dot: true }]]);
        });
        v.readout(() => {
          const R = copy(), ma = mapArea((l, f) => G.project(l, f), R[0]), ta = Math.abs(v.geo('sphericalArea', R[0])), T = G.distortion([H.lon, H.lat]);
          const km2 = ta * R_MEAN * R_MEAN;
          if (!ma) return `True area of the outline: ${comma(km2 / 1e6, 2)} million km². The copy is cut by the map's edge; move it.`;
          return `Australia's outline (Natural Earth 1:110m) covers **${comma(km2 / 1e6, 2)} million km²** on the sphere wherever it is moved; on this map it covers ${comma((ma * R_MEAN * R_MEAN) / 1e6, 2)} million km² at nominal scale, a ratio of **${(ma / ta).toFixed(3)}**${T ? ` (indicatrix at its centre: $ab = ${T.area.toFixed(3)}$, shape $b/a = ${(T.b / T.a).toFixed(3)}$)` : ''}.${EQ.has(pj.value) ? ' Equal-area: the ratio stays 1 everywhere while the shape distorts.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'No map is both conformal and equal-area',
      statement: String.raw`No projection of an open region of the sphere onto the plane is both conformal and equal-area (at any constant nominal scale). More precisely: if both held at every point of a region, the indicatrix would satisfy $a = b$ and $ab = s^2$ for a constant $s$, so $a = b = s$ everywhere and the map would be a similarity — impossible by 3.2. Every projection must therefore give up one of the two properties, or both, somewhere in every region.`,
      idea: String.raw`Conformal means the indicatrix is a circle, $a = b$ (3.5); equal-area means its area is fixed, $ab = 1$ (3.6). The only ellipse with both properties is the unit circle, so the derivative would be a rotation at every point and the map would preserve the length of every curve: a local isometry from a surface of curvature $1/R^2$ to one of curvature 0, which the Theorema Egregium forbids (3.2). On a log–log plot of the two scales $h$ and $k$ (for maps whose meridians and parallels stay perpendicular), conformal maps live on the diagonal $h = k$, equal-area maps on the anti-diagonal $hk = 1$, and the isometry is the single point where they cross.`,
      caption: String.raw`Choose a family of projections and slide $p$ from equal-area ($p = -1$) through equidistant ($p = 0$) to conformal ($p = 1$). The map is drawn from the family's own formula with its indicatrices. Right: each latitude contributes a point $(h, k)$ on log axes. Only at $p = \pm 1$ do the points stay on one of the two lines, and they reach the isometry point $(1, 1)$ only at the standard parallel or the pole.`,
      deps: ['geog-3.5', 'geog-3.6', 'geog-3.2'],
      refs: ['Snyder §4'],
      tags: ['map projections', 'impossibility'],
      viz(v) {
        const fam = v.select('family', [{ value: 'cyl', label: 'cylindrical: x = λ, y = g(φ)' }, { value: 'az', label: 'azimuthal (polar): r = r(c)' }], 'cyl');
        const pp = v.slider('$p$ (−1 equal-area, 0 equidistant, 1 conformal)', -1, 1, 0.5, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const sA = v.stage({ x: [-3.3, 3.3], y: [-2, 2], equal: true, axes: false, height: 340, weight: 1.3 });
        const sB = v.stage({ x: [0.2, 5], y: [0.2, 5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'meridian (radial) scale h', ylabel: 'parallel scale k' });
        const LANDS = v.geo('land');
        let tabKey = null, tab = null;
        function family() {
          const p = pp.value, f = fam.value;
          if (f === 'cyl') {
            const kk = 'c' + p;
            if (tabKey !== kk) { tabKey = kk; tab = [0]; for (let i = 1; i <= 356; i++) { const a = (i - 0.5) * 0.25 * D2R; tab.push(tab[i - 1] + Math.pow(1 / Math.cos(a), p) * 0.25 * D2R); } }
            const g = (lat) => { const x = Math.abs(lat) / 0.25, i = Math.min(355, Math.floor(x)), t = x - i; return Math.sign(lat) * (tab[i] + (tab[i + 1] - tab[i]) * t); };
            return { f, maxLat: 80, fwd: (l, lat) => (Math.abs(lat) > 80 ? null : [l * D2R, g(lat)]), hk: (lat) => [Math.pow(1 / Math.cos(lat * D2R), p), 1 / Math.cos(lat * D2R)], ext: () => [Math.PI, g(80)] };
          }
          const r = (c) => (c < 1e-9 ? c : p >= 0 ? Math.pow(c, 1 - p) * Math.pow(2 * Math.tan(c / 2), p) : Math.pow(c, 1 + p) * Math.pow(2 * Math.sin(c / 2), -p));
          const dr = (c) => (r(c + 1e-6) - r(Math.max(0, c - 1e-6))) / (c > 1e-6 ? 2e-6 : 1e-6 + c);
          const CMAX = 120 * D2R;
          return { f, minLat: -30, fwd: (l, lat) => { const c = (90 - lat) * D2R; if (c > CMAX + 1e-9) return null; const rr = r(c); return [rr * Math.sin(l * D2R), -rr * Math.cos(l * D2R)]; }, hk: (lat) => { const c = (90 - lat) * D2R; return [dr(c), c > 1e-6 ? r(c) / Math.sin(c) : 1]; }, ext: () => [r(CMAX), r(CMAX)] };
        }
        v.render(() => {
          const F = family(), [ex, ey] = F.ext();
          sA.setView([-ex * 1.04, ex * 1.04], [-ey * 1.06, ey * 1.06]);
          // graticule
          const lines = [];
          for (let l = -180; l <= 180; l += 15) { const m = []; for (let lat = F.f === 'cyl' ? -80 : -30; lat <= (F.f === 'cyl' ? 80 : 90); lat += 1) m.push(F.fwd(l, lat)); lines.push(m); }
          for (let lat = F.f === 'cyl' ? -75 : -30; lat < 90; lat += 15) { const m = []; for (let l = -180; l <= 180; l += 2) m.push(F.fwd(l, lat)); lines.push(m); }
          for (const L of lines) sA.path(L, { color: 'muted', width: 0.7, alpha: 0.45 });
          // land: fill rings that project whole, stroke the rest with breaks
          for (const poly of LANDS) for (const ring of poly.rings) {
            const pts = []; let ok = true, prev = null;
            for (const q of ring) { const m = F.fwd(q[0], q[1]); if (!m || (prev && Math.abs(q[0] - prev[0]) > 180)) { pts.push(null); ok = false; } if (m) pts.push(m); prev = q; }
            if (ok) sA.poly(pts, { fill: 'gold', fillAlpha: 0.26, color: 'gold', width: 0.9, alpha: 0.85 });
            else sA.path(pts, { color: 'gold', width: 0.9, alpha: 0.85 });
          }
          // indicatrices
          const r0 = 5 * D2R;
          for (let lat = F.f === 'cyl' ? -75 : -30; lat <= 75; lat += 15) for (let l = -165; l < 180; l += 30) {
            const c = F.fwd(l, lat); if (!c) continue; const [h, k] = F.hk(lat);
            const ux = F.f === 'cyl' ? [1, 0] : [Math.cos(l * D2R), Math.sin(l * D2R)], uy = F.f === 'cyl' ? [0, 1] : [-Math.sin(l * D2R), Math.cos(l * D2R)];
            const e = []; for (let i = 0; i <= 40; i++) { const t = (2 * Math.PI * i) / 40, a = k * r0 * Math.cos(t), b = h * r0 * Math.sin(t); e.push([c[0] + ux[0] * a + uy[0] * b, c[1] + ux[1] * a + uy[1] * b]); }
            const area = h * k, conf = Math.abs(h / k - 1) < 0.01;
            sA.path(e, { color: 'red', width: 0.9, fill: conf ? 'blue' : Math.abs(area - 1) < 0.01 ? 'orange' : 'red', fillAlpha: 0.3, close: true });
          }
          // (h, k) plane
          sB.path([[0.2, 0.2], [5, 5]], { color: 'blue', width: 2, dash: [6, 4] });
          sB.path([[0.2, 5], [5, 0.2]], { color: 'orange', width: 2, dash: [6, 4] });
          sB.text('conformal: h = k', 3.6, 3.6, { size: 11.5, color: 'blue', weight: 600, align: 'right', dy: -10 });
          sB.text('equal-area: hk = 1', 0.3, 3.4, { size: 11.5, color: 'orange', weight: 600, align: 'left' });
          const lo = F.f === 'cyl' ? 0 : -30, hi = F.f === 'cyl' ? 80 : 89.5, cur = [];
          for (let lat = lo; lat <= hi; lat += 0.5) cur.push(F.hk(lat));
          sB.path(cur, { color: 'red', width: 2.6 });
          for (let lat = Math.ceil(lo / 15) * 15; lat <= 75; lat += 15) { const q = F.hk(lat); sB.dot(q[0], q[1], { r: 4, color: 'red', label: `${lat}°`, labelPos: 'se', math: false, labelColor: 'muted' }); }
          sB.dot(1, 1, { r: 7, color: 'green', label: 'isometry', labelPos: 'nw', math: false, labelColor: 'green' });
          v.legend([['red', 'scales (h, k) along the latitudes'], ['blue', 'conformal', { dash: true }], ['orange', 'equal-area', { dash: true }], ['green', 'isometry (1, 1)', { dot: true }]]);
        });
        v.readout(() => {
          const F = family(), lo = F.f === 'cyl' ? 0 : -30, hi = 75;
          let wo = 0, amin = Infinity, amax = 0;
          for (let lat = lo; lat <= hi; lat += 0.5) { const [h, k] = F.hk(lat), a = Math.max(h, k), b = Math.min(h, k); wo = Math.max(wo, 2 * Math.asin((a - b) / (a + b)) * R2D); amin = Math.min(amin, h * k); amax = Math.max(amax, h * k); }
          const at = F.hk(60);
          return `$p = ${v.fix(pp.value, 2)}$, latitudes ${lo}° to ${hi}°: largest angle distortion **$\\omega = ${wo.toFixed(1)}^\\circ$**, area factor between **${amin.toFixed(3)} and ${amax.toFixed(3)}**. At 60°: $h = ${at[0].toFixed(3)},\\ k = ${at[1].toFixed(3)}$. ${Math.abs(pp.value - 1) < 1e-9 ? 'Conformal — so the areas must vary.' : Math.abs(pp.value + 1) < 1e-9 ? 'Equal-area — so the angles must vary.' : 'Neither property holds: both kinds of error are present.'} Both errors vanish only where the curve touches $(1, 1)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Chebyshev’s theorem on optimal conformal maps',
      credit: 'P. L. Chebyshev, 1856 (stated); D. A. Gravé, 1896 (proved)',
      statement: String.raw`Among all conformal maps of a simply connected region $\Omega$ of the sphere, the one that minimises the largest relative scale error — the spread $\max_\Omega \ln m - \min_\Omega \ln m$ of the logarithm of the point scale $m$ — is the one whose scale is **constant along the boundary** of $\Omega$. It is unique up to similarity, and its scale factor is determined by solving a Dirichlet problem for Laplace's equation in the region.`,
      idea: String.raw`Write any conformal map of $\Omega$ as stereographic projection (5.2) followed by a holomorphic map $f$ of the plane. Its log-scale is $\ln m = \ln m_{\rm st} + u$ with $u = \ln|f'|$ harmonic, and conversely every harmonic $u$ arises from some $f$ on a simply connected region. Since $\ln m_{\rm st}$ is subharmonic (the sphere's positive curvature) and $u$ is harmonic, $\ln m$ obeys the maximum principle: its maximum sits on the boundary. Choosing $u$ so that $\ln m$ is constant on $\partial\Omega$ makes that maximum as low as possible relative to the minimum; any other harmonic $u$ raises the boundary maximum somewhere (Darboux and Milnor gave later proofs).`,
      caption: String.raw`Pick a region (or drag its six corners on the globe). Middle: the scale error over the region, in percent after the best overall scale is chosen, for plain stereographic projection centred on the region or for Chebyshev's optimum (computed by solving Laplace's equation on a grid). Its contours hug the outline. Right: the error along the boundary — wavy for stereographic, flat for Chebyshev — with each map's full range. The readout compares the worst errors.`,
      deps: ['geog-3.5'],
      see: ['geog-5.2'],
      refs: ['Snyder §4'],
      tags: ['map projections', 'conformal maps', 'optimisation'],
      links: { arxiv: 'https://arxiv.org/abs/2607.29263' },
      viz(v) {
        const PRE = {
          strip: { label: 'long strip (Chile-like)', pts: [[-72, -18], [-68, -18], [-66, -36], [-70, -54], [-75, -52], [-73, -34]], c: [-70, -30] },
          compact: { label: 'compact (Europe-like)', pts: [[-10, 36], [28, 36], [42, 50], [30, 70], [5, 62], [-12, 50]], c: [12, 45] },
          L: { label: 'bent (an L)', pts: [[100, 10], [140, 10], [140, 22], [114, 22], [114, 52], [100, 52]], c: [118, 28] },
        };
        const pre = v.select('region', Object.entries(PRE).map(([k, r]) => ({ value: k, label: r.label })), 'compact', {
          onChange: (k) => { PRE[k].pts.forEach((q, i) => H[i].set(q[0], q[1])); G.set({ center: PRE[k].c }); },
        });
        const meth = v.select('map', [{ value: 'st', label: 'stereographic, best scale' }, { value: 'ch', label: 'Chebyshev optimum' }], 'ch');
        const sA = v.stage({ height: 320 });
        const sB = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 320 });
        const sC = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 320, xlabel: 'position along the boundary', ylabel: 'scale error (%)' });
        const G = v.globe(sA, { projection: 'orthographic', center: PRE.compact.c, graticule: 15 });
        const H = PRE.compact.pts.map((q, i) => G.handle(q[0], q[1], { label: String(i + 1), color: 'accent' }));
        let key = '', S = null;
        function solve() {
          const ring = H.map((h) => [h.lon, h.lat]);
          const kk = ring.map((q) => q[0].toFixed(3) + ',' + q[1].toFixed(3)).join(';');
          if (kk === key) return S; key = kk;
          const c = lonlat(unit3(ring.map(vec).reduce((s, q) => [s[0] + q[0], s[1] + q[1], s[2] + q[2]], [0, 0, 0])));
          const P = v.geo('projection', 'stereographic', { center: c });
          const dense = []; for (let i = 0; i < ring.length; i++) { const seg = v.geo('interpolate', ring[i], ring[(i + 1) % ring.length], 16); dense.push(...seg.slice(0, -1)); }
          const Q = dense.map((q) => P.forward(q[0], q[1]));
          if (Q.some((q) => !q)) return (S = null);
          const xs = Q.map((q) => q[0]), ys = Q.map((q) => q[1]);
          let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
          const pad = 0.04 * Math.max(x1 - x0, y1 - y0); x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
          const NMAX = 84, hh = Math.max(x1 - x0, y1 - y0) / NMAX, nx = Math.ceil((x1 - x0) / hh) + 1, ny = Math.ceil((y1 - y0) / hh) + 1;
          const lst = (x, y) => Math.log(1 + (x * x + y * y) / 4);
          const inside = new Uint8Array(nx * ny), u = new Float64Array(nx * ny), Lst = new Float64Array(nx * ny);
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = x0 + i * hh, y = y0 + j * hh, id = j * nx + i; Lst[id] = lst(x, y); u[id] = -Lst[id]; inside[id] = v.M.pointInPoly([x, y], Q) ? 1 : 0; }
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) inside[j * nx + i] = 0;
          const w = 1.9; let it = 0;
          for (; it < 3000; it++) {
            let dmax = 0;
            for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const id = j * nx + i; if (!inside[id]) continue; const nv = 0.25 * (u[id - 1] + u[id + 1] + u[id - nx] + u[id + nx]), d = w * (nv - u[id]); u[id] += d; dmax = Math.max(dmax, Math.abs(d)); }
            if (dmax < 1e-10) break;
          }
          const stat = (F) => { let lo = Infinity, hi = -Infinity; for (let id = 0; id < nx * ny; id++) if (inside[id]) { lo = Math.min(lo, F(id)); hi = Math.max(hi, F(id)); } return { lo, hi, mid: (lo + hi) / 2, err: (hi - lo) / 2 }; };
          // boundary values: stereographic exactly; Chebyshev's boundary value is 0 by construction of the Dirichlet data
          const bst = Q.map((q) => lst(q[0], q[1]));
          let lo = Math.min(...bst), hi = Math.max(...bst);
          const sst = stat((id) => Lst[id]); sst.lo = Math.min(sst.lo, lo); sst.hi = Math.max(sst.hi, hi); sst.mid = (sst.lo + sst.hi) / 2; sst.err = (sst.hi - sst.lo) / 2;
          const sch = stat((id) => Lst[id] + u[id]); sch.hi = Math.max(sch.hi, 0); sch.mid = (sch.lo + sch.hi) / 2; sch.err = (sch.hi - sch.lo) / 2;
          const cum = [0]; for (let i = 1; i <= Q.length; i++) cum.push(cum[i - 1] + Math.hypot(Q[i % Q.length][0] - Q[i - 1][0], Q[i % Q.length][1] - Q[i - 1][1]));
          return (S = { c, Q, x0, y0, hh, nx, ny, inside, u, Lst, sst, sch, bst, cum, it, ring });
        }
        const pct = (L) => (Math.exp(L) - 1) * 100;
        function field(x, y, which) {
          if (!S || !v.M.pointInPoly([x, y], S.Q)) return NaN;
          const fx = (x - S.x0) / S.hh, fy = (y - S.y0) / S.hh, i = clamp(Math.floor(fx), 0, S.nx - 2), j = clamp(Math.floor(fy), 0, S.ny - 2), tx = fx - i, ty = fy - j;
          const lst = Math.log(1 + (x * x + y * y) / 4);
          if (which === 'st') return pct(lst - S.sst.mid);
          const id = j * S.nx + i, U = (a) => (S.inside[a] ? S.u[a] : -S.Lst[a]);
          const uu = (1 - tx) * (1 - ty) * U(id) + tx * (1 - ty) * U(id + 1) + (1 - tx) * ty * U(id + S.nx) + tx * ty * U(id + S.nx + 1);
          const ue = clamp(uu, -1, 1);
          return pct(lst + ue - S.sch.mid);
        }
        v.render(() => {
          solve();
          G.draw();
          if (S) {
            const ring = S.ring.slice(); if (v.geo('sphericalArea', ring) < 0) ring.reverse();
            G.polygon([ring], { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2 });
          }
          if (!S) { sB.corner('region too large', 'tl', { color: 'red' }); return; }
          const xs = S.Q.map((q) => q[0]), ys = S.Q.map((q) => q[1]);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2, half = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.56;
          sB.setView([cx - half, cx + half], [cy - half, cy + half]);
          const which = meth.value, E = pct(S.sst.err) * 1.02;
          const key2 = key + which;
          sB.heat((x, y) => field(x, y, which), { range: [-E, E], cmap: 'theme-diverging', neg: 'blue', pos: 'red', key: key2, res: 3 });
          const e = which === 'st' ? pct(S.sst.err) : pct(S.sch.err), levels = []; for (let i = -3; i <= 3; i++) levels.push((e * i) / 3.5);
          sB.contour((x, y) => field(x, y, which), levels, { color: 'ink', alpha: 0.6, width: 1, res: 70 });
          sB.path([...S.Q, S.Q[0]], { color: 'ink', width: 2 });
          sB.corner(which === 'st' ? 'stereographic: contours are circles' : 'Chebyshev: contours follow the outline', 'tl', { color: 'muted', weight: 600, plate: true });
          sB.corner(`±${e.toFixed(2)}%`, 'br', { color: which === 'st' ? 'red' : 'green', weight: 700, plate: true });
          // boundary profile
          const T = S.cum[S.cum.length - 1], prof = S.bst.map((L, i) => [S.cum[i] / T, pct(L - S.sst.mid)]);
          const m = Math.max(pct(S.sst.err), 0.01) * 1.25;
          sC.setView([0, 1], [-m, m]);
          sC.hband(-pct(S.sst.err), pct(S.sst.err), { color: 'red', alpha: 0.07 });
          sC.hband(-pct(S.sch.err), pct(S.sch.err), { color: 'green', alpha: 0.12 });
          sC.hline(0, { color: 'muted', width: 0.8 });
          sC.path(prof, { color: 'red', width: 2.4 });
          sC.path([[0, pct(0 - S.sch.mid)], [1, pct(0 - S.sch.mid)]], { color: 'green', width: 2.6 });
          for (let i = 0; i < 6; i++) sC.vline(S.cum[i * 16] / T, { color: 'faint', width: 0.8 });
          v.legend([['red', 'stereographic (boundary; range shaded)'], ['green', 'Chebyshev optimum (boundary; range shaded)'], ['red', 'scale too large', { area: true }], ['blue', 'too small', { area: true }]]);
        });
        v.readout(() => {
          if (!S) return 'The region must fit inside a hemisphere; move its corners closer together.';
          const a = pct(S.sst.err), b = pct(S.sch.err);
          return `Worst scale error over the region: stereographic **±${a.toFixed(3)}%**, Chebyshev's optimum **±${b.toFixed(3)}%** — ${(100 * (1 - b / a)).toFixed(0)}% smaller. On the boundary the optimum's error is constant (${b.toFixed(3)}%), its maximum; the minimum −${b.toFixed(3)}% is inside. (Laplace solved by SOR on a ${S.nx} × ${S.ny} grid, ${S.it} sweeps.)`;
        });
      },
    },
  ],
};
