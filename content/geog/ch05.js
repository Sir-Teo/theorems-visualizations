// Geography & Cartography — Chapter 5: Azimuthal and conic projections
import { D2R, R2D, R_MEAN, comma, clamp, wrap180, shoelace } from './ch05.shared.js';

import { stereoCircle, orthographicSlice, azimuthalScale } from './geog-source-audit-azimuthal.shared.js';

const PI = Math.PI;
const secd = (d) => 1 / Math.cos(d * D2R);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Distance of p from the line through a and b (plane). */
const offLine = (p, a, b) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / Math.max(1e-15,dist(a, b));
const mid = (a, b) => { const q = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return q; };

export default {
  collection: 'geog',
  chapter: 5,
  title: 'Azimuthal and conic projections',
  summary: String.raw`Projecting onto a plane that touches the globe at one point gives the azimuthal maps, which show true directions from that point and differ only in how they space the distance $c$ from it: the gnomonic puts $r = \tan c$ and so turns every great circle into a straight line, the stereographic ($2\tan\frac c2$) is conformal and sends circles to circles, the azimuthal equidistant ($r = c$) gets distances from the centre right, Lambert's ($2\sin\frac c2$, a chord) keeps areas, the orthographic ($\sin c$) is the view from infinity, and the general perspective projection runs through all of them as the viewpoint moves. Wrapping a cone around the globe instead gives a fan of straight meridians and circular parallels whose angle is set by the cone constant $n$; the conformal conic of Lambert and the equal-area conic of Albers are the standard maps of mid-latitude countries and continents.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Model',
      name: 'Gnomonic projection: great circles become straight lines',
      credit: 'Spherical geometry; modern source: Snyder (1987), §22',
      verify: false,
      statement: String.raw`The **gnomonic projection** projects the sphere of radius $R$ from its centre $O$ onto the plane tangent at the map centre $P_0$. A point at angular distance $c$ from $P_0$ lands at distance and in the direction
$$r = R\tan c,\qquad \text{azimuth preserved},\qquad \cos c = \sin\varphi_0\sin\varphi + \cos\varphi_0\cos\varphi\cos(\lambda-\lambda_0).$$
It shows only points with $c < 90^\circ$ (a hemisphere would need an infinite plane). **Every great circle is mapped to a straight line, and every straight line on the map is the image of a great circle arc**, so the shortest route between two points is the ruler line joining them. The scale is $h = \sec^2 c$ along the radius and $k = \sec c$ across it, so the area factor is $\sec^3 c$: the map is neither conformal nor equal-area, and shapes blow up away from the centre.`,
      idea: String.raw`A great circle is the intersection of the sphere with a plane through $O$ (geog-1.3). Projecting from $O$ sends each point of that circle along its own ray in that plane, so the image lies in the intersection of the plane with the tangent plane: a straight line. Conversely, a line in the tangent plane together with $O$ spans a plane through the centre, which cuts the sphere in a great circle. The equator is a great circle and is straight; every other parallel is a small circle and becomes a conic section (a cone with its vertex at $O$ cuts the tangent plane in a conic). The price is the radial law $r = R\tan c$: it diverges at $c = 90^\circ$, so the Tissot indicatrix (geog-3.4) stretches as $\sec^2 c$ radially.`,
      caption: String.raw`Drag the two airports (or choose a route) on the globe or on the map, and drag the map to move its centre. The orange band is the ruler line between the images of $A$ and $B$; the green great-circle arc lies on top of it. Switch on the rhumb line (red) and it curves away from the ruler. Meridians are straight too, the parallels are conic sections, and the red indicatrices swell with distance from the centre; points more than $70^\circ$ away are off the map.`,
      deps: ['geog-1.3', 'geog-3.1'],
      see: ['geog-2.2', 'geog-2.6'],
      refs: ['Snyder, Map Projections—A Working Manual (1987), §22, pp. 164–167'],
      tags: ['map projections', 'azimuthal', 'navigation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gnomonic_projection' },
      viz(v) {
        const ROUTES = {
          nylon: [[-74.0, 40.7], [-0.13, 51.5]], lontok: [[-0.13, 51.5], [139.7, 35.7]],
          lasyd: [[-118.4, 33.9], [151.2, -33.9]], sydjoh: [[151.2, -33.9], [28.0, -26.2]],
        };
        const route = v.select('route', [{ value: 'nylon', label: 'New York – London' }, { value: 'lontok', label: 'London – Tokyo' }, { value: 'lasyd', label: 'Los Angeles – Sydney' }, { value: 'sydjoh', label: 'Sydney – Johannesburg' }], 'nylon', {
          onChange: (k) => { const [a, b] = ROUTES[k]; A.set(a[0], a[1]); B.set(b[0], b[1]); const m = v.geo('interpolate', a, b, 2)[1]; G1.set({ center: m }); G2.set({ center: m }); },
        });
        const rh = v.toggle('also draw the rhumb line', false);
        const sA = v.stage({ height: 340, weight: 0.85 }), sB = v.stage({ height: 340, weight: 1.35 });
        const m0 = v.geo('interpolate', ROUTES.nylon[0], ROUTES.nylon[1], 2)[1];
        const G1 = v.globe(sA, { projection: 'orthographic', center: m0, graticule: 15 });
        const G2 = v.globe(sB, { projection: 'gnomonic', center: m0, clip: 70, graticule: 10 });
        const A = G1.handle(ROUTES.nylon[0][0], ROUTES.nylon[0][1], { label: 'A', color: 'accent' }), B = G1.handle(ROUTES.nylon[1][0], ROUTES.nylon[1][1], { label: 'B', color: 'orange' });
        G2.handle(A); G2.handle(B);
        let info = null;
        v.render(() => {
          G1.set({ center: G2.center });
          const a = [A.lon, A.lat], b = [B.lon, B.lat];
          G1.draw(); G2.draw();
          const pa = G2.project(a[0], a[1]), pb = G2.project(b[0], b[1]);
          if (pa && pb) sB.line(pa[0], pa[1], pb[0], pb[1], { color: 'orange', width: 7, alpha: 0.35 });
          for (const G of [G1, G2]) {
            G.greatCircle(a, b, { full: true });
            if (rh.value) G.rhumbLine(a, b);
          }
          for (const p of [a, b]) G2.indicatrix(p, { radius: 5, color: 'red', fillAlpha: 0.22 });
          sA.corner('the globe', 'tl', { color: 'muted', weight: 600 });
          sB.corner('gnomonic map: ruler line = great circle', 'tl', { color: 'muted', weight: 600, plate: true });
          // measurements
          const gcPts = v.geo('interpolate', a, b, 160), rl = v.geo('rhumb', a, b);
          const dev = (pts) => { if (!pa || !pb) return null; let m = 0; for (const p of pts) { const q = G2.project(p[0], p[1]); if (!q) return null; m = Math.max(m, offLine(q, pa, pb)); } return m; };
          info = { pa, pb, gc: dev(gcPts), rh: dev(rl.points), km: v.geo('haversine', a, b, R_MEAN), rhKm: rl.length * (R_MEAN / v.geo('EARTH_KM')), cA: v.geo('centralAngle', G2.center, a), cB: v.geo('centralAngle', G2.center, b), dA: G2.distortion(a), dB: G2.distortion(b) };
          v.legend([['green', 'great circle A→B'], ['orange', 'ruler line between the images', { area: true }], ['red', 'rhumb line (if shown)', { dash: true }], ['red', 'Tissot indicatrix (5° circle)', { area: true }]]);
        });
        v.readout(() => {
          const I = info; if (!I) return '';
          if (I.gc == null) return `A or B is more than 70° from the map centre (A: ${I.cA.toFixed(0)}°, B: ${I.cB.toFixed(0)}°), so one end is off the map — the gnomonic projection can never show a whole hemisphere. Drag the map or the points closer together.`;
          const ruler = dist(I.pa, I.pb) * R_MEAN;
          let t = `Great circle $A\\to B$: **${comma(I.km)} km**. Sample 160 points along it: the largest distance of any image point from the ruler line is **${I.gc.toExponential(1)}** of a radius, i.e. zero to machine precision — the great circle *is* the straight line.`;
          if (rh.value) t += I.rh==null ? ' The rhumb line leaves the displayed 70° cap; its maximum deviation is not measured here.' : ` The rhumb line (${comma(I.rhKm)} km) strays from the ruler by **${comma(I.rh * R_MEAN)} km**.`;
          t += ` But distance is not kept: the ruler line measures ${comma(ruler)} km at the nominal scale. At $A$ ($c = ${I.cA.toFixed(1)}^\\circ$) the radial scale is $h = ${I.dA.h.toFixed(2)}$ ($\\sec^2 c = ${secd(I.cA) ** 2 > 1e3 ? '∞' : (secd(I.cA) ** 2).toFixed(2)}$) and the cross scale $k = ${I.dA.k.toFixed(2)}$; at $B$ ($c = ${I.cB.toFixed(1)}^\\circ$) $h = ${I.dB.h.toFixed(2)}$, $k = ${I.dB.k.toFixed(2)}$.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Theorem',
      name: 'Stereographic projection: conformal, circles to circles',
      credit: 'Spherical geometry; modern source: Snyder (1987), §21',
      verify: false,
      statement: String.raw`The **stereographic projection** projects the sphere of radius $R$ from the point $N$ antipodal to the map centre $P_0$ onto the plane tangent at $P_0$. A point at angular distance $c$ from $P_0$ goes to
$$r = 2R\tan\frac c2,\qquad \text{azimuth preserved},$$
and the scale is the same in every direction, $h = k = \sec^2\frac c2$. Hence the projection is **conformal**, and:

(a) every circle on the sphere (a small circle of any radius, not only a parallel) maps to a **circle** in the plane, or to a **straight line** when the circle passes through $N$;

(b) its inverse sends the plane to the sphere minus $N$ bijectively, so the sphere with $N$ added is the plane with a point at infinity — the Riemann sphere (rca-13.1). The Euclidean centre of an image circle generally differs from the image of its spherical centre; concentric circles about the map centre are an exception.`,
      idea: String.raw`Projecting from $N$ onto the tangent plane at distance $2R$ is the restriction to the sphere of the **inversion** in the sphere of radius $2R$ about $N$ (a point $Q$ with $|NQ| = 2R\cos\alpha$ is sent to the point on the same ray at distance $2R/\cos\alpha$, which lies on the tangent plane). Inversions are conformal and map circles and spheres to circles and spheres, with circles through the centre of inversion going to lines; this is (a) and the conformality of geog-3.5 at once. By symmetry the image of a circle about a point $C$ is symmetric about the radial line through the map centre and $C$, its circle or line equation follows directly by substituting the inverse stereographic coordinates in the plane equation of the spherical circle. A circle enclosing the antipode still has a circular boundary; only one passing through the antipode maps to a line.`,
      caption: String.raw`Drag $C$ and set the angular radius $\rho$ of the circle on the globe. On the map, the blue image is traced point by point; the dashed black boundary is predicted from the exact spherical-circle plane equation. Only the portion within the 110° map cap is displayed. They coincide. Press the button to make the circle pass through $N$, the antipode of the map centre (the cross): its image straightens into a line. Enclosing the antipode does not make the boundary a line. The red indicatrices stay round but grow as $\sec^2\frac c2$ (right), and the circle's image is not centred at the image of $C$.`,
      deps: ['geog-3.5', 'rca-13.1'],
      see: ['geog-3.7'],
      refs: ['Snyder, Map Projections—A Working Manual (1987), §21, pp. 154–159'],
      tags: ['map projections', 'conformal maps', 'azimuthal'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stereographic_projection' },
      viz(v) {
        const rho = v.slider('circle radius $\\rho$', 3, 100, 35, { step: 1, fmt: (x) => x + '°' });
        const sA = v.stage({ height: 330, weight: 0.8 }), sB = v.stage({ height: 330, weight: 1.25 });
        const sC = v.stage({ x: [0, 150], y: [0, 16], axes: 'box', gutter: true, height: 330, weight: 0.8, xlabel: 'distance c from the map centre (°)', ylabel: 'scale factor k', xticks: [0, 30, 60, 90, 120, 150] });
        const G2 = v.globe(sB, { projection: 'stereographic', center: [10, 45], graticule: 30 });
        const G1 = v.globe(sA, { projection: 'orthographic', center: [10, 45], graticule: 30, drag: false });
        const C = G1.handle(-35, 25, { label: 'C', color: 'accent' }); G2.handle(C);
        v.button('Pass through the antipode N', () => {
          const c = G2.center, anti = [wrap180(c[0] + 180), -c[1]], p = v.geo('destination', anti, 40, rho.value); C.set(p[0], p[1]);
        });
        let info = null;
        function fit(pts) { // Kasa least-squares circle through points
          const n = pts.length; if (n < 3) return null;
          const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
          let Sxx = 0, Sxy = 0, Syy = 0, Sx = 0, Sy = 0, Sz = 0, Sxz = 0, Syz = 0;
          for (const p of pts) { const x = p[0] - mx, y = p[1] - my, z = x * x + y * y; Sxx += x * x; Sxy += x * y; Syy += y * y; Sx += x; Sy += y; Sz += z; Sxz += x * z; Syz += y * z; }
          const sol = v.M.solve([[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]], [-Sxz, -Syz, -Sz]);
          const cx = -sol[0] / 2, cy = -sol[1] / 2, R = Math.sqrt(Math.max(0, cx * cx + cy * cy - sol[2]));
          let res = 0; for (const p of pts) res = Math.max(res, Math.abs(Math.hypot(p[0] - mx - cx, p[1] - my - cy) - R));
          return { cx: cx + mx, cy: cy + my, R, res };
        }
        v.render(() => {
          G1.set({ center: G2.center });
          const ctr = G2.center, c = [C.lon, C.lat], rr = rho.value;
          for (const G of [G1, G2]) { G.draw(); G.smallCircle(c, rr, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.12 }); }
          const tis = G2.tissot({ step: 30, lat: [-60, 60], radius: 6, fillAlpha: 0.2 });
          G2.indicatrix(c, { radius: 6, color: 'accent', fill: 'accent', fillAlpha: 0.3, axes: true });
          const anti = [wrap180(ctr[0] + 180), -ctr[1]];
          G1.dot(anti, { r: 4, color: 'ink' }); G1.text('N', anti, { color: 'ink', size: 12, weight: 700, dx: 8, dy: -8 });
          // trace the image and fit a circle
          const ring = v.geo('smallCircle', c, rr, 240), img = ring.map((p) => G2.project(p[0], p[1])).filter(Boolean);
          const cA = v.geo('centralAngle', ctr, c), th = v.geo('bearing', ctr, c) * D2R, c1 = Math.abs(cA - rr), c2 = 180-Math.abs(180-(cA+rr));
          const pred = stereoCircle(cA*D2R,rr*D2R,th), line = pred.line, f = line ? null : fit(img);
          if (!line) {
            const pts = []; for (let i = 0; i <= 240; i++) { const t = (2 * PI * i) / 240; pts.push([pred.x + pred.R * Math.cos(t), pred.y + pred.R * Math.sin(t)]); }
            const cap=2*Math.tan(55*D2R);sB.path(pts.map(p=>Math.hypot(...p)<=cap?p:null), { color: 'ink', width: 1.4, dash: [5, 4] });
            if (Math.hypot(pred.x,pred.y)<=cap) sB.dot(pred.x, pred.y, { r: 3.5, color: 'ink', hollow: true });
          } else {
            const n=pred.normal, k=pred.offset, d=n[0]*n[0]+n[1]*n[1], x=k*n[0]/d,y=k*n[1]/d,L=20;
            const p=[];for(let i=0;i<=400;i++){const t=-L+2*L*i/400,q=[x+t*n[1],y-t*n[0]];p.push(Math.hypot(...q)<=2*Math.tan(55*D2R)?q:null);}sB.path(p,{color:'ink',dash:[5,4],width:1.4});
          }
          const dC = G2.distortion(c);
          info = { cA, c1, c2, line, f, pred, lineResidual: line ? Math.max(0,...img.map(p=>Math.abs(pred.normal[0]*p[0]+pred.normal[1]*p[1]-pred.offset))) : null, n: img.length, kC: dC ? dC.a : null, bC: dC ? dC.b : null, imgC: G2.project(c[0], c[1]) };
          sA.corner('the globe', 'tl', { color: 'muted', weight: 600 });
          sB.corner('stereographic map', 'tl', { color: 'muted', weight: 600, plate: true });
          // scale plot
          sC.fn((x) => secd(x / 2) ** 2, { domain: [0, 150], color: 'red', width: 2.6 });
          sC.vband(Math.max(0, c1), Math.min(150, c2), { color: 'accent', alpha: 0.12 });
          if(cA<=150){ sC.vline(cA, { color: 'accent', dash: [4, 4], width: 1.2 }); sC.dot(cA,secd(cA/2)**2,{r:5,color:'accent'}); }
          v.legend([['accent', 'circle on the globe and its image'], ['ink', 'exact spherical-circle equation', { dash: true }], ['red', 'indicatrix / scale $k = \\sec^2(c/2)$'], ['accent', 'range of $c$ along the circle', { area: true }]]);
          void tis;
        });
        v.readout(() => {
          const I = info; if (!I) return '';
          let t = `The circle on the globe has radius $\\rho = ${rho.value}^\\circ$ about $C$, which is $c = ${I.cA.toFixed(1)}^\\circ$ from the map centre. `;
          if (I.line) t += `The boundary passes through the antipode (within numerical tolerance $10^{-10}$ in its plane equation), so its image is a **straight line**. The ${I.n} visible samples have largest line-equation residual ${I.lineResidual.toExponential(1)}.`;
          else if (I.f) t += `The ${I.n} visible image points fit a circle of radius **${I.f.R.toFixed(4)}**, largest residual **${I.f.res.toExponential(1)}**; the exact plane-equation prediction has radius **${I.pred.R.toFixed(4)}**.${I.pred.enclosesAntipode ? ' The spherical disc encloses the antipode, but its boundary remains a circle.' : ''} The image-circle centre generally differs from the image of C.`;
          else t += 'Too little of the circle is within the 110° display cap to fit it; the mathematical circle/line classification still follows from its plane equation.';
          if(I.cA>150)t+=' C lies beyond the scale graph’s 150° horizontal limit; no clamped marker is drawn.';
          if (I.kC) t += ` At $C$ the indicatrix has semi-axes $a = ${I.kC.toFixed(3)}$, $b = ${I.bC.toFixed(3)}$ (equal: conformal), and $\\sec^2(c/2) = ${(secd(I.cA / 2) ** 2).toFixed(3)}$.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Model',
      name: 'Orthographic projection',
      credit: 'Spherical perspective geometry; modern source: Snyder (1987), §20',
      verify: false,
      statement: String.raw`The **orthographic projection** projects the sphere of radius $R$ along parallel rays perpendicular to the plane tangent at the map centre $P_0$ — the view of the globe from infinitely far away. A point at angular distance $c$ from $P_0$ (with $c \le 90^\circ$) goes to
$$x = R\cos\varphi\sin(\lambda-\lambda_0),\qquad y = R\big(\cos\varphi_0\sin\varphi - \sin\varphi_0\cos\varphi\cos(\lambda-\lambda_0)\big),\qquad r = R\sin c .$$
Only one hemisphere is shown. The scale is $h = \cos c$ along the radius and $k = 1$ across it, so the area factor is $\cos c$: the map is neither conformal nor equal-area, and the Tissot indicatrices flatten into thin ellipses, with their short axis radial, as $c \to 90^\circ$, where the radial differential scale vanishes; the limb itself remains a finite circle.`,
      idea: String.raw`Dropping a sphere point along rays parallel to the axis through $P_0$ onto a perpendicular plane keeps its transverse coordinates unchanged, so the distance from the map centre is $R\sin c$ and the direction is kept. Moving along a meridian by $dc$ moves the image by $R\cos c\,dc$, giving $h = \cos c$, while a circle of radius $R\sin c$ around the centre keeps its length, $k = 1$. The projection is the limit of the general perspective projection (geog-5.6) with the viewpoint at infinity, and its radial differential scale vanishes at the limb. It looks like a photograph of a planet because it is one, to good approximation.`,
      caption: String.raw`Left: a section through the sphere, seen from above. Equal $10^\circ$ arcs (alternating colours) drop vertically onto the line below; their shadows shrink from full size at the centre to nothing at the rim. Drag $P$ on the globe: the highlighted arc (up to $10^\circ$, clipped to the visible semicircle) at its angular distance $c$ and its shadow follow. The red indicatrices flatten toward the limb, and the plot compares the radial scale $\cos c$ with the cross scale 1.`,
      deps: ['geog-3.1'],
      see: ['geog-5.6'],
      refs: ['Snyder, Map Projections—A Working Manual (1987), §20, pp. 145–149'],
      tags: ['map projections', 'azimuthal'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Orthographic_map_projection' },
      viz(v) {
        const sA = v.stage({ x: [-1.45, 1.45], y: [-1.6, 1.3], equal: true, axes: false, height: 330, weight: 0.95 });
        const sB = v.stage({ height: 330, weight: 1.0 });
        const sC = v.stage({ x: [0, 90], y: [0, 1.15], axes: 'box', gutter: true, height: 330, weight: 0.8, xlabel: 'angular distance c (°)', ylabel: 'scale factor', xticks: [0, 15, 30, 45, 60, 75, 90] });
        const G = v.globe(sB, { projection: 'orthographic', center: [10, 25], graticule: 15 });
        const P = G.handle(52, 38, { label: 'P', color: 'accent' });
        const Yb = -1.3;
        v.render(() => {
          const c = Math.min(90, v.geo('centralAngle', G.center, [P.lon, P.lat])), cr = c * D2R;
          // section
          const arc = (a, b, n = 20) => { const p = []; for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n; p.push([Math.sin(t), Math.cos(t)]); } return p; };
          sA.path(arc(-PI / 2, PI / 2, 90), { color: 'ink', width: 1.6 });
          sA.path(arc(PI / 2, 3 * PI / 2, 90).map((q) => [q[0], q[1]]), { color: 'faint', width: 1.2, dash: [3, 4] });
          sA.line(-1.15, Yb, 1.15, Yb, { color: 'muted', width: 1.2 });
          for (let i = -9; i < 9; i++) {
            const a = i * 10 * D2R, b = (i + 1) * 10 * D2R, col = i % 2 ? 'teal' : 'accent';
            sA.path(arc(a, b, 6), { color: col, width: 4 });
            sA.line(Math.sin(a), Yb, Math.sin(b), Yb, { color: col, width: 5 });
            sA.line(Math.sin(a), Math.cos(a), Math.sin(a), Yb, { color: 'faint', width: 0.8, dash: [2, 3] });
          }
          sA.line(Math.sin(PI / 2), 0, 1, Yb, { color: 'faint', width: 0.8, dash: [2, 3] });
          // highlighted slice around c
          const a = Math.max(0, cr - 5 * D2R), b = Math.min(PI / 2, cr + 5 * D2R);
          sA.path(arc(a, b, 10), { color: 'red', width: 6 });
          sA.line(Math.sin(a), Yb - 0.09, Math.sin(b), Yb - 0.09, { color: 'red', width: 6 });
          for (const t of [a, b]) sA.line(Math.sin(t), Math.cos(t), Math.sin(t), Yb - 0.09, { color: 'red', width: 1.1, dash: [4, 3] });
          sA.dot(Math.sin(cr), Math.cos(cr), { r: 5, color: 'accent' });
          sA.dot(0, 1, { r: 3, color: 'ink' }); sA.text('map centre', 0, 1.14, { size: 11, color: 'muted' });
          sA.text(`c = ${c.toFixed(0)}°`, Math.sin(cr) + 0.07, Math.cos(cr) + 0.07, { size: 12, color: 'accent', weight: 700, align: 'left', plate: true });
          sA.text('parallel rays', 0, -1.52, { size: 11.5, color: 'muted', plate: true });
          for (const x of [-0.9, 0.9]) sA.arrow(x, 1.25, x, 0.55, { color: 'muted', width: 1, head: 5 });
          sA.corner('section through the axis', 'tl', { color: 'muted', weight: 600 });
          // map
          G.draw();
          G.tissot({ step: 30, lat: [-60, 60], radius: 6, fillAlpha: 0.2 });
          G.indicatrix([P.lon, P.lat], { radius: 6, color: 'accent', fill: 'accent', fillAlpha: 0.3, axes: true });
          // plot
          sC.fn((x) => Math.cos(x * D2R), { domain: [0, 90], color: 'red', width: 2.6 });
          sC.hline(1, { color: 'green', width: 2.2 });
          sC.vline(c, { color: 'muted', dash: [3, 3] });
          sC.dot(c, Math.cos(cr), { r: 5, color: 'red' }); sC.dot(c, 1, { r: 5, color: 'green' });
          v.legend([['red', 'radial scale $h = \\cos c$'], ['green', 'cross scale $k = 1$'], ['accent', '$10^\\circ$ arcs and their shadows'], ['red', 'the arc around $P$', { dash: true }]]);
        });
        v.readout(() => {
          const c = Math.min(90, v.geo('centralAngle', G.center, [P.lon, P.lat])), cr = c * D2R, d = G.distortion([P.lon, P.lat]);
          const share = (x) => (x * 100).toFixed(0);
          const slice = orthographicSlice(cr), w = slice.shadow;
          let t = `At $P$, $c = ${c.toFixed(1)}^\\circ$: $r = \\sin c = ${Math.sin(cr).toFixed(3)}$. The highlighted arc, clipped to the visible semicircle, has true length ${slice.length.toFixed(4)} and a shadow of ${w.toFixed(3)} — a ratio of ${(w / slice.length).toFixed(3)} against $\\cos c = ${Math.cos(cr).toFixed(3)}$.`;
          if (d) t += ` The indicatrix measured numerically from the Jacobian has semi-axes ${d.a.toFixed(3)} and ${d.b.toFixed(3)}: one is $k = 1$, the other $h = \\cos c$, and the area factor is ${d.area.toFixed(3)}.`;
          t += ` Out to $c = ${c.toFixed(0)}^\\circ$ the map disc has used ${share(Math.sin(cr) ** 2)}% of its area, while the cap holds ${share((1 - Math.cos(cr)))}% of the visible hemisphere: the outer rings are crowded.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4',
      kind: 'Model',
      name: 'Azimuthal equidistant projection',
      credit: 'Spherical distance geometry; modern source: Snyder (1987), §25',
      verify: false,
      statement: String.raw`The **azimuthal equidistant projection** centred at $P_0$ puts each point at its true distance and true direction from $P_0$:
$$r = R\,c,\qquad x = r\sin\theta,\ y = r\cos\theta\quad(\theta = \text{initial bearing from }P_0),$$
where $c$ is the central angle (geog-1.4) and $\theta$ the initial bearing of the great circle from $P_0$. Hence **distances and directions measured from the centre are exact**, and every great circle through $P_0$ is a straight line. The scale is $h = 1$ along the radius and $k = c/\sin c$ across it, so the map is neither conformal nor equal-area. Away from the antipode it maps the sphere into the open disc of radius $\pi R$, whose boundary circle represents approach to the single antipodal point along different bearings; that point has no unique bearing and is not mapped bijectively. The limiting cross scale is stretched by the factor $k \to \infty$.`,
      idea: String.raw`Choosing $r = Rc$ makes the radial scale $dr/(R\,dc) = 1$ by construction, and keeping the azimuth makes meridians-through-the-centre straight. A circle of radius $Rc$ about $P_0$ on the sphere has circumference $2\pi R\sin c$ but is drawn with length $2\pi Rc$, so $k = c/\sin c \ge 1$, growing without bound at the antipode. The indicatrix (geog-3.4) is therefore an ellipse stretched across the radius. Used with $P_0$ at a pole it makes the familiar polar map with parallels as concentric circles, the map of the emblem of the United Nations.`,
      caption: String.raw`Choose the centre (or drag the map to recentre it). The rings are 2,500 km apart: every point on a ring is the same great-circle distance from the centre. Drag $Q$ anywhere; the ruler line from the centre to $Q$ is the great circle, and its length and angle on the map equal the true distance and bearing. With the pole as centre, the dashed circle at $60^\circ$S marks the extent of the map in the UN emblem. The plot shows the cross-scale $k = c/\sin c$ exploding at the outer circle.`,
      deps: ['geog-1.4', 'geog-3.1'],
      see: ['geog-5.5'],
      refs: ['Snyder, Map Projections—A Working Manual (1987), §25, pp. 191–197'],
      tags: ['map projections', 'azimuthal', 'distance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Azimuthal_equidistant_projection', un: 'https://www.un.org/en/about-us/un-emblem-and-flag' },
      scope: String.raw`Spherical formulas and domain/scale statements were checked against Snyder §25. The antipode has no single projected bearing, and this display omits a marker whose true cross scale exceeds the graph’s upper limit. The emblem detail follows the United Nations' own description (a polar azimuthal equidistant map reaching $60^\circ$ south); sources disagree on the extent of the earlier 1945 design, and no attribution of the design is made here.`,
      viz(v) {
        const CITY = { london: [-0.13, 51.51], tokyo: [139.69, 35.69], sydney: [151.21, -33.87], mecca: [39.83, 21.42], pole: [0, 90], quito: [-78.5, -0.18] };
        const sel = v.select('centre', [{ value: 'london', label: 'London' }, { value: 'tokyo', label: 'Tokyo' }, { value: 'sydney', label: 'Sydney' }, { value: 'mecca', label: 'Mecca' }, { value: 'quito', label: 'Quito' }, { value: 'pole', label: 'North Pole' }], 'london', { onChange: (k) => G.set({ center: CITY[k] }) });
        const sA = v.stage({ height: 400, weight: 1.45 });
        const sB = v.stage({ x: [0, 180], y: [0.9, 60], ylog: true, axes: 'box', gutter: true, height: 400, weight: 0.75, xlabel: 'angular distance c (°)', ylabel: 'scale factor', xticks: [0, 30, 60, 90, 120, 150, 180] });
        const G = v.globe(sA, { projection: 'azimuthalEquidistant', center: CITY.london, graticule: 30 });
        const Q = G.handle(-74, 40.7, { label: 'Q', color: 'accent' });
        v.render(() => {
          const ctr = G.center, pole = ctr[1] > 89.9;
          G.draw();
          for (let km = 2500; km < 20000; km += 2500) {
            const ang = (km / R_MEAN) * R2D;
            G.smallCircle(ctr, ang, { color: 'muted', width: 0.9, alpha: 0.7 });
            sA.text(comma(km), 0, km / R_MEAN, { size: 10, color: 'muted', plate: true });
          }
          if (pole) { const p = []; for (let l = -180; l <= 180; l += 3) p.push([l, -60]); G.path(p, { geodesic: false, color: 'orange', width: 1.8, dash: [6, 4] }); G.text('60°S', [100, -60], { size: 11, color: 'orange', weight: 700, plate: true }); }
          const q = [Q.lon, Q.lat], pq = G.project(q[0], q[1]);
          sA.dot(0, 0, { r: 5, color: 'ink' }); sA.text('centre', 0, 0, { size: 11, color: 'ink', dy: 14, plate: true });
          if (pq) sA.line(0, 0, pq[0], pq[1], { color: 'green', width: 2.6 });
          G.indicatrix(q, { radius: 6, color: 'red', fillAlpha: 0.25, axes: true });
          sA.corner(pole ? 'azimuthal equidistant, polar aspect' : 'azimuthal equidistant', 'tl', { color: 'muted', weight: 600, plate: true });
          const cq = v.geo('centralAngle', ctr, q);
          sB.hline(1, { color: 'green', width: 2.2 });
          sB.fn((x) => x * D2R / Math.sin(x * D2R), { domain: [0.5, 179], color: 'red', width: 2.6 });
          sB.vline(cq, { color: 'muted', dash: [3, 3] });
          sB.dot(cq, 1, { r: 5, color: 'green' }); const kq=azimuthalScale('equidistant',cq*D2R).k;if(kq<=60)sB.dot(cq,kq,{r:5,color:'red'});
          v.legend([['green', 'ruler line from the centre to $Q$ (= great circle)'], ['red', 'indicatrix and cross scale $k = c/\\sin c$'], ['green', 'radial scale $h = 1$']]);
        });
        v.readout(() => {
          const ctr = G.center, q = [Q.lon, Q.lat], pq = G.project(q[0], q[1]);
          if (!pq) return 'Move $Q$ onto the map.';
          const cq = v.geo('centralAngle', ctr, q), brg = v.geo('bearing', ctr, q);
          const mapD = Math.hypot(pq[0], pq[1]) * R_MEAN, mapB = mod360(Math.atan2(pq[0], pq[1]) * R2D);
          return `Centre → $Q$: true great-circle distance **${comma(cq * D2R * R_MEAN)} km**, true initial bearing **${brg.toFixed(2)}°**. Measured on the map from the ruler line: **${comma(mapD)} km** at **${mapB.toFixed(2)}°**. The cross scale at $Q$ is $k = c/\\sin c = ${cq < 1e-6 ? '1.000' : ((cq * D2R) / Math.sin(cq * D2R)).toFixed(3)}$ ($c = ${cq.toFixed(1)}^\\circ$); distances between two points that are *not* the centre are not preserved.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Model',
      name: 'Lambert azimuthal equal-area projection',
      credit: 'J. H. Lambert, 1772',
      statement: String.raw`**Lambert's azimuthal equal-area projection** centred at $P_0$ places a point at central angle $c$ and bearing $\theta$ from $P_0$ at
$$\begin{gathered}r = 2R\sin\frac c2,\qquad\\ x = r\sin\theta,\ y = r\cos\theta,\end{gathered}$$
i.e. at the *chord* distance from $P_0$. The scales are $h = \cos\frac c2$ along the radius and $k = \sec\frac c2$ across it, so $hk = 1$: **areas are preserved exactly**, everywhere. The whole sphere maps to a disc of radius $2R$ (area $4\pi R^2$), whose rim is the antipode. Shapes are distorted (the indicatrix is an ellipse of unit area, stretched across the radius), increasingly towards the rim; the projection is neither conformal nor equidistant.`,
      idea: String.raw`On the sphere the area of the zone between central angles $c$ and $c+dc$ is $2\pi R^2\sin c\,dc$ (geog-4.5). On the map the annulus between $r$ and $r + dr$ has area $2\pi r\,dr$. Equal-area (geog-3.6) therefore means $r\,dr = R^2\sin c\,dc$, whose solution vanishing at $c = 0$ is $r^2 = 2R^2(1-\cos c) = 4R^2\sin^2\frac c2$. Geometrically $r$ is the length of the straight chord from $P_0$ to the point. Since $h = dr/(R\,dc) = \cos\frac c2$ and $k = r/(R\sin c) = \sec\frac c2$, the indicatrix area is $hk = 1$. Integrate the equal-area differential equation on $0\le c<\pi$ using the fundamental theorem (pma 6.21): the change in $r^2/2$ equals the integral of $R^2\sin c$. The condition $r(0)=0$ fixes the constant, leaving $r^2=2R^2(1-\cos c)$ and the nonnegative radial branch shown here.`,
      caption: String.raw`The dots are 6,000 points scattered uniformly over the sphere. Drag the red cookie-cutter (and set its radius): in Lambert's map it always captures about the same number of dots, the number its map area predicts. Switch the projection to stereographic, equidistant or orthographic and the same cutter catches too many or too few; the readout compares the count with the naive area-based expectation and gives the true area of the patch of Earth under the cutter. Show the indicatrices to see the shapes behind the equal areas.`,
      deps: ['geog-3.6', 'pma-6.21'],
      see: ['geog-4.5', 'geog-3.7'],
      refs: ['Snyder §24'],
      tags: ['map projections', 'equal-area', 'azimuthal'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lambert_azimuthal_equal-area_projection' },
      viz(v) {
        const NAME = { lambert: 'Lambert azimuthal equal-area', stereographic: 'stereographic', azimuthalEquidistant: 'azimuthal equidistant', orthographic: 'orthographic' };
        const pj = v.select('projection', Object.keys(NAME).map((k) => ({ value: k, label: { lambert: 'Lambert equal-area', stereographic: 'stereographic', azimuthalEquidistant: 'equidistant', orthographic: 'orthographic' }[k] })), 'lambert');
        const rc = v.slider('cutter radius (map units)', 0.15, 0.7, 0.4, { step: 0.01, fmt: (x) => x.toFixed(2) });
        const ind = v.toggle('show indicatrices', false);
        const sA = v.stage({ height: 400, weight: 1.5 });
        const sB = v.stage({ x: [0, 180], y: [0.2, 6], ylog: true, axes: 'box', gutter: true, height: 400, weight: 0.7, xlabel: 'angular distance c (°)', ylabel: 'area factor $hk$', xticks: [0, 30, 60, 90, 120, 150, 180] });
        const G = v.globe(sA, { projection: 'lambert', center: [10, 30], graticule: 30 });
        const K = sA.handle(0.8, 0.2, { color: 'red', label: 'cutter', r: 6 });
        const rng = v.rng(11), N = 6000, pts = [];
        for (let i = 0; i < N; i++) { const lon = rng.uniform(-180, 180), z = rng.uniform(-1, 1); pts.push([lon, Math.asin(z) * R2D]); }
        let info = null, last = 'lambert';
        v.render(() => {
          if (pj.value !== last) { last = pj.value; G.set({ projection: pj.value }); }
          G.draw({ land: false });
          const P = G.P, r = rc.value, q = [];
          let n = 0;
          for (const p of pts) { const m = P.forward(p[0], p[1]); if (!m) continue; q.push(m); if (Math.hypot(m[0] - K.x, m[1] - K.y) < r) n++; }
          sA.dots(q, { r: 1.1, color: 'ink', alpha: 0.5 });
          sA.circle(K.x, K.y, r, { fill: 'red', fillAlpha: 0.12, color: 'red', width: 2 });
          if (ind.value) G.tissot({ step: 30, lat: [-60, 60], radius: 8, fillAlpha: 0.22, color: 'green', fill: 'green' });
          // true area under the cutter
          let aMap = 0, aTrue = 0;
          for (let i = 0; i < 14; i++) for (let j = 0; j < 24; j++) {
            const rr = ((i + 0.5) / 14) * r, th = (2 * PI * (j + 0.5)) / 24, x = K.x + rr * Math.cos(th), y = K.y + rr * Math.sin(th), w = G.invert(x, y);
            if (!w) continue; const T = P.tissot(w[0], w[1]); if (!T) continue;
            const dA = (r / 14) * rr * ((2 * PI) / 24); aMap += dA; aTrue += dA / T.area;
          }
          info = { n, aMap, aTrue, exp: (N * aMap) / (4 * PI) };
          // area factor along the radius
          const f = { lambert: () => 1, stereographic: (x) => secd(x / 2) ** 4, azimuthalEquidistant: (x) => (x * D2R) / Math.sin(x * D2R), orthographic: (x) => Math.cos(x * D2R) }[pj.value];
          for (const [k, col] of [['lambert', 'green'], ['stereographic', 'red'], ['azimuthalEquidistant', 'orange'], ['orthographic', 'purple']]) {
            const g = { lambert: () => 1, stereographic: (x) => secd(x / 2) ** 4, azimuthalEquidistant: (x) => (x * D2R) / Math.sin(x * D2R), orthographic: (x) => Math.cos(x * D2R) }[k];
            sB.fn(g, { domain: k === 'orthographic' ? [0.5, 90] : [0.5, 179], color: col, width: k === pj.value ? 3.2 : 1.2, alpha: k === pj.value ? 1 : 0.5 });
          }
          void f;
          sB.hline(1, { color: 'faint', width: 1 });
          sA.corner(NAME[pj.value], 'tl', { color: 'muted', weight: 600, plate: true });
          v.legend([['green', 'Lambert: $hk = 1$'], ['red', 'stereographic $\\sec^4(c/2)$'], ['orange', 'equidistant $c/\\sin c$'], ['purple', 'orthographic $\\cos c$'], ['red', 'the cookie cutter', { area: true }]]);
        });
        v.readout(() => {
          const I = info; if (!I || I.aMap === 0) return 'Drag the cutter onto the map.';
          const naive = I.exp, sd = Math.sqrt(Math.max(1, I.aTrue * 6000 / (4 * PI)));
          return `Cutter of map area ${I.aMap.toFixed(3)} (units of $R^2$): it holds **${I.n}** dots. If the map were equal-area the patch would hold about ${naive.toFixed(0)} dots. The patch of Earth under it actually has area **${I.aTrue.toFixed(3)} $R^2$** = ${comma((I.aTrue * R_MEAN * R_MEAN) / 1e6, 2)} million km², i.e. ${(I.aTrue / I.aMap).toFixed(3)} times the map area — ${pj.value === 'lambert' ? 'exactly 1, as the theorem says, so the count tracks the prediction up to sampling noise (about ±' + sd.toFixed(0) + ')' : 'not 1, so the count is off by that factor'}.`;
        });
      },
    },
  ],
};

function mod360(x) { return ((x % 360) + 360) % 360; }
void clamp; void shoelace; void mid;
