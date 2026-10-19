// Geography & Cartography — Chapter 6: World maps and choosing a projection
import { PI, D2R, R2D, comma, shoelace, PROJ, distort, jacEllipse, mapErrors, worldBase, worldRing, wrapRel, mollTheta, robX } from './ch06.shared.js';

import { newtonTrace, winkelPoleRatio } from './geog-source-audit-world.shared.js';

const fixd = (x, d = 3) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
/** Fit the stage window to a ring of map points (equal aspect, 6% margin). */
function fitView(s, ring, pad = 0.06) {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), m = Math.max(x1 - x0, y1 - y0) * pad;
  s.setView([x0 - m, x1 + m], [y0 - m, y1 + m]);
}
/** Invert a map by projecting a fine table of the whole globe: nearest-latitude solve along a parallel is not needed, a plain bisection on y then on x. */
function makeInverse(fwd) {
  return (x, y) => {
    let a = -PI / 2, b = PI / 2;
    for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (fwd(0, m)[1] < y) a = m; else b = m; }
    const f = (a + b) / 2, e = fwd(PI, f)[0];
    if (Math.abs(fwd(0, f)[1] - y) > 1e-3 || Math.abs(x) > e) return null;
    let lo = 0, hi = PI; const x1 = fwd(PI, f)[0]; if (x1 === 0) return [0, f];
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fwd(m, f)[0] < Math.abs(x)) lo = m; else hi = m; }
    return [Math.sign(x || 1) * (lo + hi) / 2, f];
  };
}
/** Draw a grid of indicatrices on a world map (central meridian lon0 deg). */
function indicatrices(s, fwd, lon0, r0, col, lats = [-60, -30, 0, 30, 60], step = 30) {
  for (const f of lats) for (let L = -150; L <= 150; L += step) {
    const l = wrapRel(L, lon0) * D2R; if (Math.abs(l) > PI - 0.2) continue;
    const J = distort(fwd, l, f * D2R); if (!J) continue;
    const p = fwd(l, f * D2R); jacEllipse(s, p[0], p[1], J, r0, col);
  }
}

export default {
  collection: 'geog',
  chapter: 6,
  title: 'World maps and choosing a projection',
  summary: String.raw`World maps trade off distortions. Pseudocylindrical projections such as the sinusoidal and Mollweide keep areas while curving the meridians, compromise projections like Robinson and Winkel tripel spread errors around, and interrupted or polyhedral maps cut the globe to reduce them. Quantitative error measures and the shape of the region decide which projection to use.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1',
      kind: 'Model',
      name: 'Sinusoidal projection',
      credit: 'Spherical sinusoidal formulas; technical source: Snyder (1987), §30',
      statement: String.raw`The **sinusoidal projection** of the sphere of radius $R$ with central meridian $\lambda_0$ is
$$x = R\,(\lambda-\lambda_0)\cos\varphi,\qquad y = R\,\varphi .$$
Parallels are straight horizontal lines at their true spacing and true length $2\pi R\cos\varphi$; the central meridian is a straight line of true length, and every other meridian is a sine curve $x = R(\lambda-\lambda_0)\cos(y/R)$. The scale along the parallels is $k=1$ and along the meridians $h=\sqrt{1+(\lambda-\lambda_0)^2\sin^2\varphi}$; the Jacobian determinant is $hk\sin\theta'=1$, so the map is **equal-area** everywhere. It is neither conformal nor equidistant: away from the central meridian and the equator the meridians and parallels meet at oblique angles and shapes are sheared, worst at the far corners.`,
      idea: String.raw`A band of the sphere between latitudes $\varphi$ and $\varphi+d\varphi$ has width $2\pi R\cos\varphi$ and height $R\,d\varphi$. Laying every parallel at its true length $2\pi R\cos\varphi$ and keeping the true spacing $R\,d\varphi$ makes the map band the same area as the spherical band, and equal-area (geog-3.6) follows band by band, in fact cell by cell because each parallel is stretched uniformly. The price is paid in shape: the meridian direction $(-\lambda\sin\varphi, 1)$ leans more and more as $\lambda\sin\varphi$ grows, so the indicatrix of unit area becomes a long thin ellipse far from the centre.`,
      caption: String.raw`Drag the red probe over the map: its parallel (true length) and meridian are highlighted, and the readout gives the scale factors, the area factor (always 1) and the angular distortion. The right panel plots the angular distortion $\omega$ against distance from the central meridian for several latitudes. Switch to the equirectangular map to see the same ellipses lose their equal areas, and slide the central meridian to move the shear away from the continents you care about.`,
      deps: ['geog-3.6'],
      see: ['geog-4.5', 'geog-4.1'],
      refs: ['Snyder (1987), §30, pp. 243–248, equations 30-1–30-7'],
      tags: ['map projections', 'equal-area', 'pseudocylindrical'],
      scope: String.raw`Unit-radius spherical formulas checked against Snyder §30, pp. 243–248, equations 30-1–30-7. Longitude is wrapped to ±180° relative to the central meridian. Meridians and parallels generally meet obliquely, so area uses hk sinθ′, not hk alone. The outline's numerical polygon area approximates the exact smooth equal-area map. No early-map priority is asserted.`,
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sinusoidal_projection' },
      viz(v) {
        const kind = v.select('map', [{ value: 'sinu', label: 'sinusoidal' }, { value: 'equirect', label: 'equirectangular (contrast)' }], 'sinu');
        const lon0 = v.slider('central meridian (°)', -180, 180, 0, { step: 5 });
        const ind = v.toggle('indicatrices', true);
        const s = v.stage({ height: 400, equal: true, axes: false, weight: 1.6, x: [-3.4, 3.4], y: [-1.75, 1.75] });
        const s2 = v.stage({ x: [0, 180], y: [0, 125], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'longitude from the central meridian (°)', ylabel: 'angular distortion ω (°)', xticks: [0, 30, 60, 90, 120, 150, 180] });
        const clampProbe = (x, y) => {
          const f = Math.max(-1.45, Math.min(1.45, y)), e = kind.value === 'sinu' ? PI * Math.cos(f) : PI;
          return [Math.max(-e + 0.02, Math.min(e - 0.02, x)), f];
        };
        const probe = s.handle(1.2, 0.7, { color: 'red', label: 'probe', r: 6, constrain: clampProbe });
        const LAT = [15, 30, 45, 60, 75], COL = ['green', 'teal', 'blue', 'orange', 'purple'];
        let info = null;
        v.render(() => {
          [probe.x,probe.y]=clampProbe(probe.x,probe.y);
          const fwd = PROJ[kind.value].fwd, L = lon0.value;
          const ring = worldBase(s, v, fwd, { lon0: L });
          fitView(s, ring);
          if (ind.value) indicatrices(s, fwd, L, 0.2, kind.value === 'sinu' ? 'green' : 'orange');
          const f = probe.y, l = kind.value === 'sinu' ? probe.x / Math.cos(f) : probe.x;
          const J = distort(fwd, l, f); if (!J) return;
          const e = fwd(PI, f)[0];
          s.segment([-e, f], [e, f], { color: 'red', width: 2 });
          const mer = []; for (let u = -90; u <= 90; u += 2) mer.push(fwd(l, u * D2R)); s.path(mer, { color: 'red', width: 2, alpha: 0.8 });
          jacEllipse(s, probe.x, probe.y, J, 0.36, 'red', 0.3);
          const area = Math.abs(shoelace(ring));
          info = { J, l, f, len: 2 * e, area: area / (4 * PI) };
          LAT.forEach((la, i) => s2.fn((x) => { const q = distort(fwd, x * D2R, la * D2R); return q ? q.omega : NaN; }, { domain: [0, 180], color: COL[i], width: 2 }));
          s2.dot(Math.abs(l * R2D), J.omega, { color: 'red', r: 5 });
          s2.corner(PROJ[kind.value].label, 'tl', { color: 'muted', weight: 600 });
          v.legend(LAT.map((la, i) => [COL[i], `${la}°`]));
        });
        v.readout(() => {
          const I = info; if (!I) return '';
          const tr = 2 * PI * Math.cos(I.f);
          return `Probe at $\\varphi=${fixd(I.f * R2D, 1)}^\\circ$, $\\lambda-\\lambda_0=${fixd(I.l * R2D, 1)}^\\circ$: parallel drawn with length ${I.len.toFixed(3)} against the true $2\\pi\\cos\\varphi=${tr.toFixed(3)}$ (ratio ${(I.len / tr).toFixed(3)}); $h=${I.J.h.toFixed(3)}$, $k=${I.J.k.toFixed(3)}$, area factor **${I.J.area.toFixed(3)}**, meridian–parallel angle ${I.J.theta.toFixed(1)}°, $\\omega=${I.J.omega.toFixed(1)}^\\circ$.\nWhole-map area = ${I.area.toFixed(3)} × the sphere's $4\\pi R^2$ ${kind.value === 'sinu' ? '(sampled outline area; the smooth projection is exactly equal-area)' : '(the plate carrée inflates the polar regions)'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2',
      kind: 'Model',
      name: 'Mollweide projection',
      credit: 'Spherical Mollweide formulas; technical source: Snyder (1987), §31',
      statement: String.raw`The **Mollweide projection** maps the sphere of radius $R$ to an ellipse of axes $4\sqrt2R$ by $2\sqrt2R$ (ratio 2:1) by
$$x=\frac{2\sqrt2}{\pi}R(\lambda-\lambda_0)\cos\theta,\qquad y=\sqrt2\,R\sin\theta,\qquad 2\theta+\sin2\theta=\pi\sin\varphi .$$
The auxiliary angle $\theta\in[-\pi/2,\pi/2]$ is defined implicitly in $\varphi$; the equation has a unique root, computed numerically; Newton's method is usually rapid from a suitable start, but may fail from an arbitrary one. Parallels are straight, parallel lines (unequally spaced), the central meridian is straight and the others are half-ellipses; the map is **equal-area**, not conformal, with the least shape distortion at the two points $\varphi=\pm40^\circ44'$ on the central meridian.`,
      idea: String.raw`Require parallels to be straight lines with $x=c\,\lambda\cos\theta$ and $y=\sqrt2R\sin\theta$ inside an ellipse; the area of the strip between two parallels must equal the sphere's, $2\pi R^2\,d(\sin\varphi)$. That gives $d(2\theta+\sin2\theta)=\pi\,d(\sin\varphi)$ and, with $\theta=0$ at $\varphi=0$, the stated equation (geog-3.6). Writing $t=2\theta$, solve $g(t)=t+\sin t-\pi\sin\varphi=0$: $g'(t)=1+\cos t>0$ except at $t=\pm\pi$ (the poles), so $g$ is strictly increasing on the interior and the root is unique. This does not guarantee convergence of unconstrained Newton iteration $t\mapsto t-g/g'$ from every starting point; the separate reference root uses the standard latitude-based iteration. The display reports convergence by the equation residual, not merely a small step.`,
      caption: String.raw`Drag the probe up and down the map: the lower panel shows $g(t)=t+\sin t-\pi\sin\varphi$ and the Newton iterates sliding down tangent lines to its root, which is $2\theta$. Change the starting guess to see Newton converge in a handful of steps from $t_0=2\varphi$ or fail from a bad start near the flat spot $t=\pm\pi$, and overlay the sinusoidal outline to compare the two equal-area maps.`,
      deps: ['geog-3.6', 'mech-8.9'],
      see: ['geog-6.1'],
      refs: ['Snyder (1987), §31, pp. 249–253, equations 31-1–31-7'],
      tags: ['map projections', 'equal-area', 'Newton iteration'],
      scope: String.raw`Spherical formulas and implicit root checked against Snyder §31. The green reference root and the chosen-start Newton trace are separate computations; a unique root does not imply arbitrary-start Newton convergence. The draggable display restricts |y|≤1.38, short of the polar singularity, and at most nine iterates are drawn within the graph. Whole-map area is exact analytically; local distortion is a finite-difference estimate.`,
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mollweide_projection' },
      viz(v) {
        const start = v.select('Newton start', [{ value: 'twophi', label: 't₀ = 2φ' }, { value: 'zero', label: 't₀ = 0' }, { value: 'edge', label: 't₀ ≈ ±π' }], 'twophi');
        const cmp = v.toggle('overlay sinusoidal outline', false);
        const ind = v.toggle('indicatrices', false);
        const s = v.stage({ height: 340, equal: true, axes: false, weight: 1.4, x: [-3.2, 3.2], y: [-1.7, 1.7] });
        const s2 = v.stage({ x: [-3.6, 3.6], y: [-7, 7], axes: true, height: 340, weight: 1, xlabel: 't', xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [-6, -3, 0, 3, 6] });
        const fwd = PROJ.moll.fwd, inv = makeInverse(fwd);
        const probe = s.handle(1.2, 1.1, { color: 'red', label: 'probe', r: 6, constrain: (x, y) => { const yy = Math.max(-1.38, Math.min(1.38, y)), th = Math.asin(yy / Math.SQRT2), e = 2 * Math.SQRT2 * Math.cos(th); return [Math.max(-e + 0.02, Math.min(e - 0.02, x)), yy]; } });
        let info = null;
        v.render(() => {
          const ring = worldBase(s, v, fwd, { lon0: 0 }); void ring;
          if (cmp.value) s.poly(worldRing(PROJ.sinu.fwd), { color: 'orange', width: 1.6, fill: false, dash: true });
          if (ind.value) indicatrices(s, fwd, 0, 0.2, 'green');
          const w = inv(probe.x, probe.y); if (!w) return;
          const [l, f] = w, K = PI * Math.sin(f), g = (t) => t + Math.sin(t) - K;
          const t0 = start.value === 'twophi' ? 2 * f : start.value === 'zero' ? 0 : (f >= 0 ? 1 : -1) * (PI - 0.05);
          // Newton iterates
          const {its,ok,reason,residual}=newtonTrace(f,t0);
          const root = mollTheta(f) * 2;
          s.segment([-2 * Math.SQRT2 * Math.cos(root / 2), Math.sin(root / 2) * Math.SQRT2], [2 * Math.SQRT2 * Math.cos(root / 2), Math.sin(root / 2) * Math.SQRT2], { color: 'red', width: 2 });
          s.dot(probe.x, probe.y, { color: 'red', r: 4 });
          s2.fn(g, { domain: [-PI, PI], color: 'blue', width: 2.4 });
          s2.hline(0, { color: 'faint', width: 1 });
          s2.vline(root, { color: 'green', width: 1.2, dash: true });
          its.slice(0, 9).forEach((tk, i) => {
            const gk = g(tk);
            if (Math.abs(gk) > 6.9 || Math.abs(tk) > 3.55) return;
            s2.segment([tk, 0], [tk, gk], { color: 'orange', width: 1, alpha: 0.7 });
            if (i + 1 < Math.min(9,its.length) && Math.abs(its[i+1])<=3.55) s2.segment([tk, gk], [its[i + 1], 0], { color: 'gold', width: 1.3, alpha: 0.9 });
            s2.dot(tk, 0, { color: 'orange', r: 3.5 });
          });
          s2.dot(root, 0, { color: 'green', r: 5, label: '2θ', labelPos: 'ne' });
          const J = distort(fwd, l, f);
          info = { f, l, its, ok, reason, residual, root, J, t0, area: PI * 2 * Math.SQRT2 * Math.SQRT2 / (4 * PI) };
          v.legend([['blue', '$g(t)=t+\\sin t-\\pi\\sin\\varphi$'], ['gold', 'Newton tangents'], ['green', 'root $2\\theta$'], ['orange', 'sinusoidal outline', { dash: true }]]);
        });
        v.readout(() => {
          const I = info; if (!I) return 'Drag the probe onto the map.';
          const n = I.its.length - 1;
          return `$\\varphi=${fixd(I.f * R2D, 1)}^\\circ$: root $2\\theta=${fixd(I.root, 6)}$ ($\\theta=${fixd(I.root * R2D / 2, 3)}^\\circ$); Newton from $t_0=${fixd(I.t0, 3)}$ took **${n}** step${n === 1 ? '' : 's'}${I.ok ? ' to reach equation residual below $10^{-10}$' : ' and did not converge: '+I.reason}; final equation residual |g| = **${Math.abs(I.residual).toExponential(1)}**.\nMap point $(x,y)=(${fixd(I.l * 2 * Math.SQRT2 / PI * Math.cos(I.root / 2), 3)},${fixd(Math.SQRT2 * Math.sin(I.root / 2), 3)})$; the ellipse has area $\\pi\\cdot2\\sqrt2\\cdot\\sqrt2=4\\pi$ = the sphere's. Area factor at the probe ${I.J ? I.J.area.toFixed(4) : '—'}, $\\omega=${I.J ? I.J.omega.toFixed(1) : '—'}^\\circ$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3',
      kind: 'Model',
      name: 'Compromise projections: Robinson and Winkel tripel',
      credit: 'Technical sources: Snyder (1987); Snyder & Voxland (1989)',
      statement: String.raw`A **compromise projection** is neither conformal nor equal-area; it is chosen to keep both kinds of error moderate over the whole world.
- **Robinson** (1963, for Rand McNally): not given by formulas but by a table of the length $X(\varphi)$ of each parallel (relative to the equator) and its distance $Y(\varphi)$ from the equator at 5° steps, interpolated: $x=0.8487\,R\,X(\varphi)\,(\lambda-\lambda_0)$, $y=1.3523\,R\,Y(\varphi)$. The poles are lines of length 0.5322 of the equator.
- **Winkel tripel** (1921): the average of the equirectangular and Aitoff maps, $x=\tfrac12\bigl(\lambda\cos\varphi_1+\frac{2\cos\varphi\sin(\lambda/2)}{\operatorname{sinc}\alpha}\bigr)$, $y=\tfrac12\bigl(\varphi+\frac{\sin\varphi}{\operatorname{sinc}\alpha}\bigr)$, $\cos\alpha=\cos\varphi\cos\frac\lambda2$, $\varphi_1=\arccos(2/\pi)$.
- **Van der Grinten**: a circular map, with parallels and meridians drawn as circular arcs.
These maps trade area and shape errors. None has uniformly modest distortion everywhere: polar lines and outer meridians have singular or large distortions, especially on Van der Grinten. Interior indicatrices alone do not establish a global bound.`,
      idea: String.raw`Equal-area maps (geog-3.6) must shear shapes, conformal maps (geog-3.5) must inflate areas, and no map manages both (geog-3.7). Compromise projections therefore sit between the two: averaging the equirectangular map, with its true meridian scale, and the Aitoff map, which evaluates the equatorial azimuthal equidistant map at half-longitude and then doubles its horizontal coordinate, gives Winkel's tripel (three kinds of error compromised: area, direction, distance); Robinson drew his shape by eye and tabulated it. Pseudocylindrical edges cut the poles into lines, which is where their shape errors concentrate (geog-4.1, geog-6.1).`,
      caption: String.raw`Choose a projection and read its indicatrices: ellipses neither all round nor all of equal area, with increasingly severe distortion near polar boundaries. The bar charts compute, over an equal-area sample of 2,312 equal-area cell centres on the sphere, the mean angular distortion $\omega$ and 100 times the rms centred logarithm of the area factor of each map, with the sinusoidal and equirectangular maps for reference. Winkel tripel and Robinson are middling on both; the sinusoidal wins on area and loses on shape.`,
      deps: ['geog-4.1', 'geog-6.1'],
      see: ['geog-3.7', 'geog-6.4'],
      refs: ['Snyder (1987), §29, pp. 239–242 (Van der Grinten)', 'Snyder & Voxland, An Album of Map Projections (1989), pp. 82–83, 164–165, 222–223, 232–233 (Robinson/Winkel)'],
      tags: ['map projections', 'compromise'],
      scope: String.raw`Robinson's 19 tabulated pairs and scale constants were checked against Snyder & Voxland (1989), printed 223, equations 67–68; the natural cubic spline here is this atlas's stated interpolation choice, not an assertion of Robinson's own algorithm. Winkel's spherical coordinates are the explicit average described there, with cosφ₁=2/π; its pole/equator width ratio is 2/(π+2), about 0.389. Metrics are the atlas's finite equal-area midpoint sample and 900 fixed pseudorandom pairs, centred to remove a global map scale. “100×RMS log” is a logarithmic spread, not a literal percentage error or the published Goldberg–Gott scores.`,
      verify: false,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robinson_projection' },
      viz(v) {
        const kind = v.select('map', [{ value: 'robinson', label: 'Robinson' }, { value: 'winkel', label: 'Winkel tripel' }, { value: 'vdg', label: 'Van der Grinten' }], 'robinson');
        const lon0 = v.slider('central meridian (°)', -180, 180, 0, { step: 5 });
        const ind = v.toggle('indicatrices', true);
        const s = v.stage({ height: 360, equal: true, axes: false, full: true, x: [-3.4, 3.4], y: [-1.8, 1.8] });
        const ORDER = ['equirect', 'sinu', 'robinson', 'winkel', 'vdg'], TICK = [[1, 'plate'], [2, 'sinus'], [3, 'Robin'], [4, 'Winkel'], [5, 'vdG']];
        const sA = v.stage({ x: [0.4, 5.6], y: [0, 40], axes: 'box', gutter: true, height: 260, weight: 1, ylabel: 'mean ω (°)', xticks: TICK, title: 'shape' });
        const sB = v.stage({ x: [0.4, 5.6], y: [0, 40], axes: 'box', gutter: true, height: 260, weight: 1, ylabel: '100 × RMS log area', xticks: TICK, title: 'area' });
        const E = {}; for (const k of ORDER) E[k] = mapErrors(PROJ[k].fwd);
        let info = null;
        v.render(() => {
          const fwd = PROJ[kind.value].fwd, L = lon0.value, ring = worldBase(s, v, fwd, { lon0: L });
          fitView(s, ring);
          if (ind.value) indicatrices(s, fwd, L, 0.2, 'green');
          s.corner(PROJ[kind.value].label, 'tl', { color: 'muted', weight: 600, plate: true });
          const col = (x, i) => (ORDER[i] === kind.value ? 'accent' : 'faint');
          sA.bars(ORDER.map((k) => E[k].shape), { color: col }); sB.bars(ORDER.map((k) => E[k].area * 100), { color: col });
          sA.setView([0.4, 5.6], [0, Math.max(40,...ORDER.map(k=>E[k].shape))*1.1]); sB.setView([0.4, 5.6], [0, Math.max(30, ...ORDER.map((k) => E[k].area * 100)) * 1.1]);
          info = E[kind.value];
        });
        v.readout(() => {
          const e = info, k = kind.value;
          const note = { robinson: 'Poles are lines 0.5322 as long as the equator; parallels are straight, meridians curve.', winkel: `Poles are lines ${winkelPoleRatio().toFixed(3)} as long as the equator; parallels bow slightly.`, vdg: 'The whole world sits in a circle; poles are points, high latitudes are badly exaggerated in area.' }[k];
          return `${PROJ[k].label}: mean angular distortion **${e.shape.toFixed(1)}°**, 100×RMS log-area scatter **${(e.area * 100).toFixed(1)}**, 100×RMS log-distance scatter ${(e.dist * 100).toFixed(1)} over random pairs. ${note}`;
        });
      },
    },
  ],
};
