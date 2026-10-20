// Geography & Cartography — Chapter 5 (part b): general perspective, conic projections
import { D2R, R2D, R_MEAN, comma, clamp, PI, ellipse, shoelace, conic, conicBase, conicFrame, conicIndicatrix, landFrame, azMap, azBase } from './ch05.shared.js';

import { conicRange } from './geog-source-audit-world.shared.js';

const secd = (d) => 1 / Math.cos(d * D2R);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

/** Rough bounding boxes of regions of interest (degrees; NOT borders — the atlas has coastlines only). */
const REG = {
  us: { label: 'contiguous US', lat: [24.5, 49.4], lon: [-124.8, -66.9] },
  fr: { label: 'France', lat: [41.3, 51.1], lon: [-5.1, 9.6] },
  eu: { label: 'Europe', lat: [35, 71], lon: [-10, 40] },
  jp: { label: 'Japan', lat: [24, 46], lon: [123, 154] },
};
const regOpts = Object.keys(REG).map((k) => ({ value: k, label: REG[k].label }));
const lon0Of = (R) => Math.round((R.lon[0] + R.lon[1]) / 2);
/** Largest |k - 1| of conic kind over latitudes [fs, fn] (degrees) for standard parallels a, b (degrees). */
function errMax(kind, a, b, fs, fn) {
  const C = conic(kind, a * D2R, b * D2R, a * D2R); let m = 0;
  for (let i = 0; i <= 24; i++) { const f = (fs + ((fn - fs) * i) / 24) * D2R; m = Math.max(m, Math.abs(C.k(f) - 1)); }
  return m;
}
/** Standard parallels (degrees, step 0.5) that minimise the largest scale error over [fs, fn]. */
function minimax(kind, fs, fn) {
  let best = [fs, fn, Infinity];
  for (let a = fs; a <= fn + 1e-9; a += 0.5) for (let b = a; b <= fn + 1e-9; b += 0.5) { const e = errMax(kind, a, b, fs, fn); if (e < best[2]) best = [a, b, e]; }
  return best;
}
/** Bounding box of a lat/lon box under conic C (degrees, central meridian lon0), padded by `pad`. */
function boxView(C, R, lon0, pad = 0.3) {
  const pts = [];
  for (let l = R.lon[0]; l <= R.lon[1] + 1e-9; l += 1) { pts.push(C.fwd((l - lon0) * D2R, R.lat[0] * D2R), C.fwd((l - lon0) * D2R, R.lat[1] * D2R)); }
  for (let f = R.lat[0]; f <= R.lat[1] + 1e-9; f += 1) { pts.push(C.fwd((R.lon[0] - lon0) * D2R, f * D2R), C.fwd((R.lon[1] - lon0) * D2R, f * D2R)); }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = x1 - x0, h = y1 - y0, m = Math.max(w, h) * pad;
  return { x: [x0 - m, x1 + m], y: [y0 - m, y1 + m], size: Math.max(w, h) };
}
const boxPath = (C, R, lon0) => {
  const p = [];
  for (let l = R.lon[0]; l <= R.lon[1]; l += 1) p.push(C.fwd((l - lon0) * D2R, R.lat[0] * D2R));
  for (let f = R.lat[0]; f <= R.lat[1]; f += 1) p.push(C.fwd((R.lon[1] - lon0) * D2R, f * D2R));
  for (let l = R.lon[1]; l >= R.lon[0]; l -= 1) p.push(C.fwd((l - lon0) * D2R, R.lat[1] * D2R));
  for (let f = R.lat[1]; f >= R.lat[0]; f -= 1) p.push(C.fwd((R.lon[0] - lon0) * D2R, f * D2R));
  return p;
};

export default {
  collection: 'geog',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Model',
      name: 'General perspective projection',
      statement: String.raw`Look at the sphere of radius $R$ from a point $V$ on the axis through the map centre $P_0$, at distance $PR$ from the centre of the sphere ($P$ is a signed number), and project each point along its ray to $V$ onto the plane tangent at $P_0$. A point at central angle $c$ lands at
$$r = R\,\frac{(P-1)\sin c}{P-\cos c},\qquad \text{azimuth preserved.}$$
The visible part is the cap $\cos c > 1/P$ for $P>1$ (a viewpoint outside, whose horizon is at $\cos c_h = 1/P$, a fraction $\tfrac12(1-1/P)$ of the globe) and $\cos c > P$ for $-1 \le P < 1$ (a viewpoint inside). The family contains the earlier maps as special cases: $P = 0$ is the **gnomonic** projection ($r = R\tan c$), $P = -1$ is the **stereographic** ($r = 2R\tan\frac c2$), and $P \to \infty$ is the **orthographic** ($r = R\sin c$); between them lie the near-side views from satellites, such as a geostationary one at $P \approx 6.6$. The scale at the centre is always 1; the limb of an outside view is a circle of radius $R\sqrt{(P-1)/(P+1)}$. ($P = 1$, a viewpoint on the surface, is degenerate.)`,
      idea: String.raw`Put the sphere in coordinates with $P_0$ at height 1 on the axis, the tangent plane at height 1 and the viewpoint at height $P$. The ray from $(0,P)$ through the sphere point $(\sin c, \cos c)$ meets the plane at parameter $t = (1-P)/(\cos c - P)$ of the way, so its distance from the axis is $t\sin c$, which is the formula. Setting $P = 0$ gives $\tan c$, $P = -1$ gives $2\tan(c/2)$, and letting $P \to \infty$ the factor $(P-1)/(P-\cos c) \to 1$ leaves $\sin c$ (geog-5.3). The horizon is where the ray is tangent to the sphere, $\cos c_h = 1/P$. So gnomonic (geog-5.1), stereographic and orthographic are three positions of one moving eye.`,
      caption: String.raw`Choose a preset, or move the viewpoint: above the surface (altitude $h$, logarithmic), inside the globe ($P$ from $-1$ to $0.9$), or at infinity. Left: the section through the axis, with the rays from the eye through the surface points (every $15^\circ$) to the picture plane, and the horizon rays. Middle: the map computed from the same law $r(c)$; drag it to turn the globe. Right: $r(c)$ for the current eye (thick) and for the classical azimuthal maps; the current curve passes through them as the eye moves.`,
      deps: ['geog-5.3', 'geog-5.1'],
      see: ['geog-5.2'],
      refs: ['Snyder §23'],
      tags: ['map projections', 'azimuthal', 'perspective'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vertical_perspective_projection' },
      viz(v) {
        const PRE = { gnomonic: ['in', 0], stereographic: ['in', -1], iss: ['out', 420], geo: ['out', 35786], moon: ['out', 384400 - R_MEAN], ortho: ['inf', 0] };
        const preset = v.select('preset', [{ value: 'gnomonic', label: 'gnomonic' }, { value: 'stereographic', label: 'stereographic' }, { value: 'iss', label: 'low orbit (420 km)' }, { value: 'geo', label: 'geostationary' }, { value: 'moon', label: 'at the Moon' }, { value: 'ortho', label: 'orthographic' }], 'geo', {
          onChange: (k) => { const [rg, x] = PRE[k]; regime.set(rg); if (rg === 'in') pin.set(x); if (rg === 'out') alt.set(x); },
        });
        const regime = v.select('viewpoint', [{ value: 'out', label: 'above the surface' }, { value: 'inf', label: 'at infinity' }, { value: 'in', label: 'inside the globe' }], 'out');
        const alt = v.slider('altitude $h$ of the viewpoint', 100, 400000, 35786, { log: true, fmt: (x) => comma(x) + ' km' });
        const pin = v.slider('viewpoint position $P$', -1, 0.9, 0, { step: 0.01, fmt: (x) => x.toFixed(2) });
        const sA = v.stage({ x: [-1.9, 1.9], y: [-1.3, 2.5], equal: true, axes: false, height: 350, weight: 1.0 });
        const sB = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 350, weight: 1.1 });
        const sC = v.stage({ x: [0, 120], y: [0, 3.2], axes: 'box', gutter: true, height: 350, weight: 0.85, xlabel: 'angular distance c (°)', ylabel: 'map radius r / R', xticks: [0, 30, 60, 90, 120] });
        let ctr = [10, 35], start = null, st = null;
        sB.onDrag((x, y, phase) => {
          const px = sB.X(x), py = sB.Y(y);
          if (phase === 'start') { start = [px, py, ctr[0], ctr[1]]; return; }
          if (!start) return;
          ctr = [((start[2] - (px - start[0]) * 0.4 + 540) % 360) - 180, clamp(start[3] + (py - start[1]) * 0.4, -90, 90)];
          if (phase === 'end') start = null;
        });
        sB.canvas.style.cursor = 'grab';
        const getP = () => (regime.value === 'inf' ? Infinity : regime.value === 'in' ? pin.value : 1 + alt.value / R_MEAN);
        v.render(() => {
          alt.el.hidden = regime.value !== 'out'; pin.el.hidden = regime.value !== 'in';
          const P = getP(), rOf = P === Infinity ? (c) => Math.sin(c) : (c) => ((P - 1) * Math.sin(c)) / (P - Math.cos(c));
          const ch = P === Infinity ? PI / 2 : P > 1 ? Math.acos(1 / P) : Math.acos(P);
          let cMax = ch * 0.9995;
          if (P <= 1) for (let c = 0; c < cMax; c += 0.002) if (rOf(c) > 3) { cMax = c; break; }
          const M = azMap(ctr, rOf, cMax, 'P' + P), half = M.rMax * 1.07;
          sB.setView([-half, half], [-half, half]);
          azBase(sB, v, M, { step: 30 });
          sB.corner(P === Infinity ? 'view from infinity' : `view from P = ${P.toFixed(3)}`, 'tl', { color: 'muted', weight: 600, plate: true });
          // ---- section
          const arc = (a, b, n = 60) => { const p = []; for (let i = 0; i <= n; i++) { const t = a + ((b - a) * i) / n; p.push([Math.sin(t), Math.cos(t)]); } return p; };
          sA.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          for (const sg of [1, -1]) sA.path(arc(0, cMax).map((q) => [sg * q[0], q[1]]), { color: 'accent', width: 4 });
          sA.line(-1.85, 1, 1.85, 1, { color: 'muted', width: 1.3 });
          sA.text('picture plane', -1.85, 1.1, { size: 11, color: 'muted', align: 'left' });
          const Vp = P === Infinity ? null : [0, P], top = 2.4;
          const toward = (X) => { // from X towards the eye, clipped at the top of the panel
            if (!Vp) return [X[0], top];
            const t = Vp[1] > top ? (top - X[1]) / (Vp[1] - X[1]) : 1; return [X[0] + t * (Vp[0] - X[0]), X[1] + t * (Vp[1] - X[1])];
          };
          for (const sg of [1, -1]) for (let c = 15; c * D2R <= cMax; c += 15) {
            const Q = [sg * Math.sin(c * D2R), Math.cos(c * D2R)], X = [sg * rOf(c * D2R), 1], E = toward(X);
            sA.line(X[0], X[1], E[0], E[1], { color: 'muted', width: 0.8, alpha: 0.6 });
            sA.line(Q[0], Q[1], X[0], X[1], { color: 'orange', width: 1.5 });
            sA.dot(X[0], X[1], { r: 3, color: 'accent' });
          }
          if (P > 1 && P !== Infinity) for (const sg of [1, -1]) { const T = [sg * Math.sin(ch), Math.cos(ch)], E = toward(T); sA.line(T[0], T[1], E[0], E[1], { color: 'red', width: 1.2, dash: [5, 4] }); }
          if (P === Infinity) for (const sg of [1, -1]) sA.line(sg, 0, sg, top, { color: 'red', width: 1.2, dash: [5, 4] });
          if (P !== Infinity && P >= -1 && P <= top - 0.05) { sA.dot(0, P, { r: 6, color: 'red' }); sA.text('eye', 0.12, P, { size: 12, color: 'red', weight: 700, align: 'left', plate: true }); }
          else if (P > top) { sA.arrow(0, 2.1, 0, 2.45, { color: 'red', width: 2, head: 7 }); sA.text(`eye, ${comma((P - 1) * R_MEAN)} km up`, 0.1, 2.28, { size: 11.5, color: 'red', weight: 700, align: 'left', plate: true }); }
          else if (P === Infinity) sA.text('eye at infinity', 0.1, 2.28, { size: 11.5, color: 'red', weight: 700, align: 'left', plate: true });
          sA.line(-M.rMax, 1, M.rMax, 1, { color: 'accent', width: 5, alpha: 0.45 });
          sA.corner('section through the axis', 'tl', { color: 'muted', weight: 600 });
          // ---- r(c)
          const fam = [['green', (c) => Math.tan(c * D2R), [0, 75]], ['purple', (c) => 2 * Math.tan((c * D2R) / 2), [0, 119]], ['orange', (c) => c * D2R, [0, 120]], ['teal', (c) => 2 * Math.sin((c * D2R) / 2), [0, 120]], ['pink', (c) => Math.sin(c * D2R), [0, 90]]];
          for (const [col, f, dom] of fam) sC.fn(f, { domain: dom, color: col, width: 1.3, alpha: 0.7 });
          sC.fn((c) => rOf(c * D2R), { domain: [0, Math.min(120, M.cMax * R2D)], color: 'ink', width: 3 });
          sC.vline(ch * R2D, { color: 'red', dash: [4, 4], width: 1.2 });
          v.legend([['ink', 'current eye'], ['green', 'gnomonic $\\tan c$'], ['purple', 'stereographic'], ['orange', 'equidistant $c$'], ['teal', 'equal-area'], ['pink', 'orthographic $\\sin c$'], ['red', 'horizon', { dash: true }]]);
          const r30 = rOf(30 * D2R), d = 1e-4, h30 = (rOf(30 * D2R + d) - rOf(30 * D2R - d)) / (2 * d), k30 = r30 / Math.sin(30 * D2R);
          st = { P, ch, cMax, r30, h30, k30 };
        });
        v.readout(() => {
          const { P, ch, cMax, r30, h30, k30 } = st;
          const name = P === 0 ? ' — this is the **gnomonic** projection' : P === -1 ? ' — this is the **stereographic** projection' : P === Infinity ? ' — this is the **orthographic** projection' : '';
          let t = P === Infinity ? `Viewpoint at infinity$${''}$${name}. The horizon is the great circle $c = 90^\\circ$ and the limb has radius $1$. ` : `Viewpoint at $P = ${P.toFixed(3)}$ (${P > 1 ? 'altitude ' + comma((P - 1) * R_MEAN) + ' km' : 'inside the globe'})${name}. `;
          if (P > 1 || P === Infinity) t += `Horizon at $c_h = ${(ch * R2D).toFixed(2)}^\\circ$, ${comma(ch * R_MEAN)} km along the surface; the eye sees **${(((P === Infinity ? 1 : 1 - 1 / P) / 2) * 100).toFixed(1)}%** of the globe, within a limb of radius $${(P === Infinity ? 1 : Math.sqrt((P - 1) / (P + 1))).toFixed(3)}\\,R$. `;
          else t += `Visible cap $c < ${(ch * R2D).toFixed(1)}^\\circ$ (${(((1 - P) / 2) * 100).toFixed(1)}% of the globe); the map is cut at $r = 3$ (here $c = ${(cMax * R2D).toFixed(1)}^\\circ$). `;
          t += `At $c = 30^\\circ$: $r = ${r30.toFixed(4)}$, radial scale $h = ${h30.toFixed(3)}$, cross scale $k = ${k30.toFixed(3)}$ (gnomonic: $\\tan 30^\\circ = 0.5774$; orthographic: $\\sin 30^\\circ = 0.5$).`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Concept',
      name: 'Conic projections and the cone constant',
      credit: 'Spherical equidistant conic; technical source: Snyder (1987), §16',
      verify: false,
      statement: String.raw`A **conic projection** with central meridian $\lambda_0$ and cone constant $n \in (0,1)$ is a map
$$x = \rho(\varphi)\sin\theta,\qquad y = \rho_0 - \rho(\varphi)\cos\theta,\qquad \theta = n(\lambda-\lambda_0),$$
for a function $\rho(\varphi)$ that decreases with latitude. Meridians become straight rays from the apex, $\frac{\Delta\theta}{\Delta\lambda} = n$ apart, and parallels become concentric circular arcs; the fan covers the angle $360^\circ n$ for the full $360^\circ$ of longitude. The cone constant is the ratio of the unrolled cone's sector angle to $2\pi$: for a cone tangent along the parallel $\varphi_0$ it is $n = \sin\varphi_0$, which is $0$ for a cylinder ($\varphi_0 \to 0$) and $1$ for the plane over the pole. The scale along a parallel is $k = n\rho/(R\cos\varphi)$. The **equidistant conic** with standard parallels $\varphi_1 \neq \varphi_2$ takes $\rho = R(G - \varphi)$ (true distance along every meridian, $h = 1$) with
$$n = \frac{\cos\varphi_1 - \cos\varphi_2}{\varphi_2 - \varphi_1},\qquad G = \frac{\cos\varphi_1}{n} + \varphi_1,$$
so that $k = 1$ on both standard parallels ($n = \sin\varphi_1$ if $\varphi_1 = \varphi_2$).`,
      idea: String.raw`Roll a sheet of paper into a cone around the globe, touching along $\varphi_0$. The parallel $\varphi_0$ has length $2\pi R\cos\varphi_0$ and, as a slant circle of the cone, radius $R\cot\varphi_0$ from the apex, so unrolled it subtends $2\pi R\cos\varphi_0/(R\cot\varphi_0) = 2\pi\sin\varphi_0$: this is $n$. Cutting the cone along a meridian and flattening it gives straight meridians fanning out at angle $n\,\Delta\lambda$. A cone that cuts the globe along two parallels has a cone constant fixed by requiring both parallels to be drawn at true length, $n\rho_i = R\cos\varphi_i$; with equal meridian-distance spacing of parallels this gives the formula above (the section shows the chord version, which differs slightly). Away from the standard parallels the Tissot indicatrix (geog-3.4) is stretched along the parallels, $k \ne 1$, and distortion is smallest between and near them.`,
      caption: String.raw`Move the two standard parallels (set them equal for a tangent cone). Left: a section through the axis, with the cone through the two standard parallels meeting the axis at the apex. Middle: the unrolled equidistant conic map, a fan of angle $360^\circ n$; the indicatrices are green on the standard parallels, red where east–west lengths are stretched, blue where they are shrunk. Right: the parallel scale $k(\varphi)$. Try $\varphi_1 = \varphi_2 = 10^\circ$ (almost a cylinder, narrow fan) and $80^\circ$ (almost a polar plane).`,
      scope: String.raw`Northern conic case: the controls restrict both standard parallels to 10°–80°N, so 0<n<1. Southern conics require sign conventions; n=0 and n=1 are limiting cylindrical and polar cases with changed formulas. The left section is a physical secant cone; the middle uses the equidistant conic's arc-based cone constant. They coincide only in the tangent limit. Neither projection is generally obtained by a perspective ray construction onto that secant cone.`,
      deps: ['geog-3.4'],
      see: ['geog-4.1'],
      refs: ['Snyder, Map Projections—A Working Manual (1987), §16, pp. 111–114, equations 16-1–16-5'],
      tags: ['map projections', 'conic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equidistant_conic_projection' },
      viz(v) {
        const f1 = v.slider('standard parallel $\\varphi_1$', 10, 80, 20, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        const f2 = v.slider('standard parallel $\\varphi_2$', 10, 80, 60, { step: 0.5, fmt: (x) => x.toFixed(1) + '°' });
        const sA = v.stage({ x: [-2.1, 2.1], y: [-1.4, 3], equal: true, axes: false, height: 360, weight: 0.8 });
        const sB = v.stage({ height: 360, weight: 1.3, equal: true, axes: false });
        const sC = v.stage({ x: [-50, 85], y: [0.5, 3.5], axes: 'box', gutter: true, height: 360, weight: 0.8, xlabel: 'latitude φ (°)', ylabel: 'scale along the parallel k', xticks: [-45, -15, 15, 45, 75] });
        let st = null;
        v.render(() => {
          const a = Math.min(f1.value, f2.value), b = Math.max(f1.value, f2.value), lon0 = 10, fa = -50, fb = 85;
          const C = conic('eqdc', a * D2R, b * D2R, 'apex');
          // ---- section: the cone through the two standard parallels
          const Qa = [Math.cos(a * D2R), Math.sin(a * D2R)], Qb = [Math.cos(b * D2R), Math.sin(b * D2R)];
          const ya = b - a < 1e-6 ? 1 / Math.sin(a * D2R) : Qa[1] - (Qa[0] * (Qb[1] - Qa[1])) / (Qb[0] - Qa[0]);
          const nChord = Qa[0] / Math.hypot(Qa[0], Qa[1] - ya);
          sA.setView([-2.1, 2.1], [-1.4, Math.max(1.8, ya + 0.35)]);
          sA.circle(0, 0, 1, { color: 'ink', width: 1.5 });
          sA.line(0, -1.2, 0, ya + 0.2, { color: 'faint', width: 1, dash: [3, 3] });
          for (const sg of [1, -1]) {
            const dx = sg * Qa[0] - 0, dy = Qa[1] - ya, L = Math.hypot(dx, dy), ext = Math.min(1.5, (ya + 1.2) / Math.abs(dy)) ;
            sA.line(0, ya, dx * ext, ya + dy * ext, { color: 'orange', width: 2.2 });
            void L;
          }
          for (const [Q, col] of [[Qa, 'green'], [Qb, 'green']]) { sA.line(-Q[0], Q[1], Q[0], Q[1], { color: col, width: 2.6 }); sA.dot(Q[0], Q[1], { r: 4, color: col }); sA.dot(-Q[0], Q[1], { r: 4, color: col }); }
          sA.dot(0, ya, { r: 5, color: 'orange' }); sA.text('apex', 0.1, ya + 0.05, { size: 12, color: 'orange', weight: 700, align: 'left', plate: true });
          sA.text(`φ₁ = ${a.toFixed(1)}°`, Qa[0] + 0.08, Qa[1] - 0.12, { size: 11.5, color: 'green', weight: 700, align: 'left', plate: true });
          if (b - a > 0.5) sA.text(`φ₂ = ${b.toFixed(1)}°`, Qb[0] + 0.08, Qb[1] + 0.1, { size: 11.5, color: 'green', weight: 700, align: 'left', plate: true });
          sA.corner('cone through the standard parallels', 'tl', { color: 'muted', weight: 600, plate: true });
          // ---- fan map
          const fr = conicFrame(C, fa, fb), xs = [0,...fr.map((p) => p[0])], ys = [0,...fr.map((p) => p[1])];
          const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), mg = 0.04 * Math.max(x1 - x0, y1 - y0);
          sB.setView([x0 - mg, x1 + mg], [y0 - mg, y1 + mg]);
          conicBase(sB, v, C, lon0, fa, fb, { step: 30, pstep: 15 });
          sB.dot(0, 0, { r: 4, color: 'orange' });
          const r0 = 0.024 * Math.max(x1 - x0, y1 - y0);
          for (let f = -30; f <= 75; f += 15) for (let l = -150; l <= 150; l += 50) { const k = C.k(f * D2R); conicIndicatrix(sB, C, l * D2R, f * D2R, r0, Math.abs(k - 1) < 0.03 ? 'green' : k > 1 ? 'red' : 'blue', 0.28); }
          for (const f of [a, b]) { const p = []; for (let l = -180; l <= 180; l += 3) p.push(C.fwd(l * D2R, f * D2R)); sB.path(p, { color: 'green', width: 2, dash: [6, 4] }); }
          sB.corner(`equidistant conic, n = ${C.n.toFixed(3)}`, 'tl', { color: 'muted', weight: 600, plate: true });
          // ---- k(phi)
          sC.setView([-50,85],conicRange(C));
          sC.hline(1, { color: 'faint', width: 1 });
          sC.fn((f) => C.k(f * D2R), { domain: [-50, 84], color: 'red', width: 2.6 });
          for (const f of [a, b]) sC.vline(f, { color: 'green', dash: [4, 4], width: 1.2 });
          v.legend([['red', 'parallel scale $k$'], ['green', 'standard parallels', { dash: true }], ['orange', 'the cone and its apex'], ['blue', '$k<1$ (shrunk)', { area: true }]]);
          st = { a, b, n: C.n, nChord, ya, C };
        });
        v.readout(() => {
          const { a, b, n, nChord, ya, C } = st;
          const tangent = b - a < 1e-6;
          return `**Cone constant** $n = ${tangent ? '\\sin\\varphi_1' : '\\tfrac{\\cos\\varphi_1-\\cos\\varphi_2}{\\varphi_2-\\varphi_1}'} = ${n.toFixed(4)}$: the map fans out over $360^\\circ n = ${(360 * n).toFixed(1)}^\\circ$ and meridians $30^\\circ$ apart are ${(30 * n).toFixed(2)}° apart. The cone through the two parallels (chord version, section) has $n = ${nChord.toFixed(4)}$ and its apex is ${ya.toFixed(2)} $R$ above the centre; the equidistant conic uses the arc instead of the chord${tangent ? ', which coincide for a tangent cone' : ''}. Scales: $k(\\varphi_1) = ${C.k(a * D2R).toFixed(4)}$, $k(\\varphi_2) = ${C.k(b * D2R).toFixed(4)}$, $k(0^\\circ) = ${C.k(0).toFixed(3)}$, $k(60^\\circ) = ${C.k(60 * D2R).toFixed(3)}$; along every meridian $h = 1$. The pole is not a point but the arc of radius ${(Math.abs(C.rho(PI / 2))).toFixed(3)} (where $k \\to \\infty$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Model',
      name: 'Lambert conformal conic projection',
      credit: 'J. H. Lambert, 1772',
      statement: String.raw`The **Lambert conformal conic** projection with standard parallels $\varphi_1, \varphi_2$ is the conic map $x = \rho\sin n\Delta\lambda$, $y = \rho_0 - \rho\cos n\Delta\lambda$ with
$$n = \frac{\ln(\cos\varphi_1/\cos\varphi_2)}{\ln\big(\tan(\frac\pi4 + \frac{\varphi_2}2)/\tan(\frac\pi4 + \frac{\varphi_1}2)\big)},\qquad \rho = R\,F\,\tan^{-n}\Big(\frac\pi4 + \frac\varphi2\Big),\qquad F = \frac{\cos\varphi_1\tan^n(\frac\pi4 + \frac{\varphi_1}2)}{n}$$
($n = \sin\varphi_1$ if $\varphi_1 = \varphi_2$). It is **conformal**: the scale is the same in every direction, $h = k = n\rho/(R\cos\varphi)$, which equals 1 on the standard parallels, is below 1 between them and above 1 outside; meridians are straight lines, parallels circular arcs, and circles on the sphere stay (nearly) round. Given a country between latitudes $\varphi_S$ and $\varphi_N$, the worst scale error $\max|k-1|$ depends only on the choice of $\varphi_1, \varphi_2$, and can be made small by putting the standard parallels inside the country.`,
      idea: String.raw`On a conic map the meridians and parallels are orthogonal, so the map is conformal (geog-3.5) exactly when $h = k$. With $h = -d\rho/(R\,d\varphi)$ and $k = n\rho/(R\cos\varphi)$ this is the differential equation $d\rho/\rho = -n\sec\varphi\,d\varphi$, whose solution is $\rho = F\,e^{-n\psi}$ with $\psi = \ln\tan(\frac\pi4+\frac\varphi2)$ the isometric latitude of Mercator's map (geog-4.2). So Lambert's conic is Mercator's chart bent into a fan: $(\psi,\lambda)\mapsto(F e^{-n\psi}, n\lambda)$ in polar coordinates, the exponential map. The constants $n$ and $F$ are then chosen so that $k(\varphi_1) = k(\varphi_2) = 1$. Separation of variables (ode 1.3) solves the conformality equation on a chart where $\rho>0$ and $\cos\varphi>0$: integrating $d\rho/\rho=-n\sec\varphi\,d\varphi$ gives $\log\rho=-n\psi+\text{constant}$. Exponentiating yields the radial law; the standard-parallel conditions then determine its constants.`,
      caption: String.raw`Pick a region (its box is rough, not a border), then move the two standard parallels. Indicatrices are circles of radius $k\cdot r_0$, green where $|k-1| < 0.3\%$, red where stretched and blue where shrunk. Right: scale error $(k-1)$ in per cent against latitude, with the region's latitude band shaded. The buttons set the common "one-sixth" rule of thumb (parallels one sixth inside the north and south limits), the minimax choice found by search that minimises the worst error, and the 33°/45° pair that the Wikipedia article cites for US sectional charts.`,
      deps: ['geog-5.7', 'geog-3.5', 'ode-1.3'],
      see: ['geog-4.2', 'geog-5.9'],
      refs: ['Snyder §15'],
      tags: ['map projections', 'conformal maps', 'conic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lambert_conformal_conic_projection' },
      viz(v) {
        const reg = v.select('region', regOpts, 'us', { onChange: () => sixth() });
        const f1 = v.slider('standard parallel $\\varphi_1$', 5, 75, 30, { step: 0.25, fmt: (x) => x.toFixed(2) + '°' });
        const f2 = v.slider('standard parallel $\\varphi_2$', 5, 75, 45, { step: 0.25, fmt: (x) => x.toFixed(2) + '°' });
        const R0 = () => REG[reg.value];
        function sixth() { const [s, n] = R0().lat, d = (n - s) / 6; f1.set(s + d); f2.set(n - d); }
        v.button('one-sixth rule', sixth);
        v.button('minimax optimum', () => { const [s, n] = R0().lat, [a, b] = minimax('lcc', s, n); f1.set(a); f2.set(b); });
        v.button('33° and 45°', () => { f1.set(33); f2.set(45); });
        const sA = v.stage({ height: 380, weight: 1.35, equal: true, axes: false });
        const sB = v.stage({ x: [15, 60], y: [-3, 3], axes: 'box', gutter: true, height: 380, weight: 0.85, xlabel: 'latitude φ (°)', ylabel: 'scale error (k − 1) in %' });
        let st = null, cache = {};
        v.render(() => {
          const R = R0(), [ls, ln] = R.lat, a = Math.min(f1.value, f2.value), b = Math.max(f1.value, f2.value), lon0 = lon0Of(R), f0 = (ls + ln) / 2;
          const C = conic('lcc', a * D2R, b * D2R, f0 * D2R), V = boxView(C, R, lon0);
          sA.setView(V.x, V.y);
          sA.rect(V.x[0] - 5, V.y[0] - 5, V.x[1] + 5, V.y[1] + 5, { fill: 'blue', fillAlpha: 0.07, stroke: false });
          conicBase(sA, v, C, lon0, Math.max(-80, ls - 35), Math.min(84, ln + 35), { span: (R.lon[1] - R.lon[0]) / 2 + 22, frame: false, step: ln - ls > 30 ? 10 : 5 });
          sA.path(boxPath(C, R, lon0), { close: true, color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.07 });
          for (const f of [a, b]) { const p = []; for (let l = R.lon[0] - 12; l <= R.lon[1] + 12; l += 2) p.push(C.fwd((l - lon0) * D2R, f * D2R)); sA.path(p, { color: 'green', width: 1.8, dash: [6, 4] }); }
          const r0 = V.size * 0.028;
          for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
            const f = ls + ((i + 0.5) * (ln - ls)) / 4, l = R.lon[0] + ((j + 0.5) * (R.lon[1] - R.lon[0])) / 5, k = C.k(f * D2R);
            conicIndicatrix(sA, C, (l - lon0) * D2R, f * D2R, r0, Math.abs(k - 1) < 0.003 ? 'green' : k > 1 ? 'red' : 'blue', 0.32);
          }
          sA.corner(`Lambert conformal conic, n = ${C.n.toFixed(4)}`, 'tl', { color: 'muted', weight: 600, plate: true });
          // error plot
          const fs = ls - 8, fn = ln + 8, ek = (f) => (C.k(f * D2R) - 1) * 100;
          let emax = 1; for (let f = fs; f <= fn; f += 0.5) emax = Math.max(emax, Math.min(25, Math.abs(ek(f))));
          sB.setView([fs, fn], [-emax * 1.05, emax * 1.05]);
          sB.vband(ls, ln, { color: 'orange', alpha: 0.14 });
          sB.hline(0, { color: 'faint', width: 1 });
          sB.fn(ek, { domain: [fs, fn], color: 'red', width: 2.6 });
          for (const f of [a, b]) sB.vline(f, { color: 'green', dash: [4, 4], width: 1.2 });
          v.legend([['red', 'scale error $(k-1)$ in %'], ['orange', 'latitude band of the region', { area: true }], ['green', 'standard parallels', { dash: true }], ['accent', 'the region', { area: true }]]);
          const key = reg.value; if (!cache[key]) { const [m1, m2, me] = minimax('lcc', ls, ln); cache[key] = { m1, m2, me, six: errMax('lcc', ls + (ln - ls) / 6, ln - (ln - ls) / 6, ls, ln) }; }
          st = { C, n: C.n, err: errMax('lcc', a, b, ls, ln), a, b, R, opt: cache[key] };
        });
        v.readout(() => {
          const { n, err, a, b, R, opt } = st;
          return `Region ${R.label} (box ${R.lat[0]}°–${R.lat[1]}° N, ${Math.abs(R.lon[0])}°${R.lon[0] < 0 ? 'W' : 'E'}–${Math.abs(R.lon[1])}°${R.lon[1] < 0 ? 'W' : 'E'}). With $\\varphi_1 = ${a.toFixed(2)}^\\circ$, $\\varphi_2 = ${b.toFixed(2)}^\\circ$: $n = ${n.toFixed(4)}$, and the **worst scale error inside the region is ${(err * 100).toFixed(3)}%** (so areas are off by up to ${((Math.max(1 + err, 1 / (1 - err)) ** 2 - 1) * 100).toFixed(2)}%). The one-sixth rule gives ${(opt.six * 100).toFixed(3)}%; the minimax pair (${opt.m1.toFixed(1)}°, ${opt.m2.toFixed(1)}°) gives ${(opt.me * 100).toFixed(3)}%. The map is conformal: the indicatrices are circles, $h = k$ everywhere.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Model',
      name: 'Albers equal-area conic projection',
      credit: 'H. C. Albers, 1805',
      statement: String.raw`The **Albers equal-area conic** projection with standard parallels $\varphi_1, \varphi_2$ is the conic map $x = \rho\sin n\Delta\lambda$, $y = \rho_0 - \rho\cos n\Delta\lambda$ with
$$n = \frac{\sin\varphi_1 + \sin\varphi_2}{2},\qquad \rho = \frac Rn\sqrt{C - 2n\sin\varphi},\qquad C = \cos^2\varphi_1 + 2n\sin\varphi_1 .$$
Its scales are $k = n\rho/(R\cos\varphi)$ along the parallels and $h = 1/k$ along the meridians, so $hk = 1$: **it preserves areas exactly**, while shapes are distorted away from the standard parallels (where $k = h = 1$). Compared with the Lambert conformal conic on the same two parallels, the two maps agree closely on a mid-latitude region and differ in shape distortion at the edges by about as much as $k^2$ differs from 1.`,
      idea: String.raw`The area of the zone between latitudes $\varphi$ and $\varphi + d\varphi$ and longitudes $d\lambda$ is $R^2\cos\varphi\,d\varphi\,d\lambda$, while on a conic map the same patch is a sector of area $\rho\,|d\rho|\,d\theta = \rho\,|d\rho|\,n\,d\lambda$. Equal areas (geog-3.6) therefore require $\rho\,d\rho = -(R^2/n)\cos\varphi\,d\varphi$, so $\rho^2 = (2R^2/n)(C' - \sin\varphi)$ for a constant $C'$. Choosing $C' = C/(2n)$ with $C$ as above makes $\rho(\varphi_1) = R\cos\varphi_1/n$ and $\rho(\varphi_2) = R\cos\varphi_2/n$, that is $k = 1$ on both standard parallels (the identity $\cos^2\varphi_1 + \sin^2\varphi_1 - \sin^2\varphi_2 = \cos^2\varphi_2$ does the second). Then $h = 1/k$ follows from the area condition. The fundamental theorem (pma 6.21) integrates $\rho\,d\rho=-(R^2/n)\cos\varphi\,d\varphi$ to the stated affine relation between $\rho^2$ and $\sin\varphi$, for $n\ne0$ on the chosen conic chart. The standard-parallel conditions select the integration constant; the square root uses the chart's chosen radial branch.`,
      caption: String.raw`Albers (accent outlines, gold land) with Lambert conformal conic on the same parallels (red coastlines and dashed cells) for the same region. Each $5^\circ \times 5^\circ$ cell has its map area measured by the shoelace formula and compared with its true spherical area: right, Albers (green) sits on exactly 1 while the Lambert conic (red) follows $k^2$. Choose a wider region, or move the parallels away from the region, and the two maps separate. The defaults for the US are the pair $29.5^\circ, 45.5^\circ$ used for the USGS contiguous-US Albers map.`,
      deps: ['geog-5.7', 'geog-3.6', 'pma-6.21'],
      see: ['geog-5.8'],
      refs: ['Snyder §14'],
      tags: ['map projections', 'equal-area', 'conic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Albers_projection' },
      viz(v) {
        const reg = v.select('region', regOpts, 'us', { onChange: (k) => { if (k === 'us') { f1.set(29.5); f2.set(45.5); } else { const [s, n] = REG[k].lat, d = (n - s) / 6; f1.set(s + d); f2.set(n - d); } } });
        const f1 = v.slider('standard parallel $\\varphi_1$', 5, 75, 29.5, { step: 0.25, fmt: (x) => x.toFixed(2) + '°' });
        const f2 = v.slider('standard parallel $\\varphi_2$', 5, 75, 45.5, { step: 0.25, fmt: (x) => x.toFixed(2) + '°' });
        const sA = v.stage({ height: 400, weight: 1.35, equal: true, axes: false });
        const sB = v.stage({ x: [20, 55], y: [0.9, 1.1], axes: 'box', gutter: true, height: 400, weight: 0.85, xlabel: 'latitude of the cell (°)', ylabel: 'map area ÷ true area' });
        let st = null;
        v.render(() => {
          const R = REG[reg.value], [ls, ln] = R.lat, a = Math.min(f1.value, f2.value), b = Math.max(f1.value, f2.value), lon0 = lon0Of(R), f0 = (ls + ln) / 2;
          const CA = conic('albers', a * D2R, b * D2R, f0 * D2R), CL = conic('lcc', a * D2R, b * D2R, f0 * D2R), V = boxView(CA, R, lon0);
          sA.setView(V.x, V.y);
          sA.rect(V.x[0] - 5, V.y[0] - 5, V.x[1] + 5, V.y[1] + 5, { fill: 'blue', fillAlpha: 0.07, stroke: false });
          conicBase(sA, v, CA, lon0, Math.max(-80, ls - 35), Math.min(84, ln + 35), { span: (R.lon[1] - R.lon[0]) / 2 + 22, frame: false, step: ln - ls > 30 ? 10 : 5 });
          // Lambert conformal conic coastlines on top
          const L = landFrame(v, lon0), lines = [];
          for (const pl of L.lines) { for (const p of pl) { if (p[1] >= (ls - 35) * D2R && p[1] <= (ln + 35) * D2R) lines.push(CL.fwd(p[0], p[1])); else if (lines.length && lines[lines.length - 1]) lines.push(null); } lines.push(null); }
          sA.path(lines, { color: 'red', width: 0.9, alpha: 0.9 });
          // cells
          const cs = 5, lat0 = Math.floor(ls / cs) * cs, lat1 = Math.ceil(ln / cs) * cs, lonA = Math.floor(R.lon[0] / cs) * cs, lonB = Math.ceil(R.lon[1] / cs) * cs;
          const dots = [];
          let worstA = 0, worstL = 0;
          const edge = (C, l0, f0_, l1, f1_, out) => { for (let i = 0; i < 8; i++) { const t = i / 8; out.push(C.fwd((l0 + (l1 - l0) * t - lon0) * D2R, (f0_ + (f1_ - f0_) * t) * D2R)); } };
          for (let f = lat0; f < lat1; f += cs) for (let l = lonA; l < lonB; l += cs) {
            const poly = (C) => { const o = []; edge(C, l, f, l + cs, f, o); edge(C, l + cs, f, l + cs, f + cs, o); edge(C, l + cs, f + cs, l, f + cs, o); edge(C, l, f + cs, l, f, o); return o; };
            const pa = poly(CA), pl = poly(CL), tr = cs * D2R * (Math.sin((f + cs) * D2R) - Math.sin(f * D2R)), ra = shoelace(pa) / tr, rl = shoelace(pl) / tr;
            sA.path(pa, { close: true, color: 'accent', width: 0.9, alpha: 0.8 });
            sA.path(pl, { close: true, color: 'red', width: 0.9, alpha: 0.8, dash: [3, 3] });
            dots.push([f + cs / 2, ra, rl]); worstA = Math.max(worstA, Math.abs(ra - 1)); worstL = Math.max(worstL, Math.abs(rl - 1));
          }
          for (const f of [a, b]) { const p = []; for (let l = R.lon[0] - 12; l <= R.lon[1] + 12; l += 2) p.push(CA.fwd((l - lon0) * D2R, f * D2R)); sA.path(p, { color: 'green', width: 1.8, dash: [6, 4] }); }
          sA.path(boxPath(CA, R, lon0), { close: true, color: 'accent', width: 2.4 });
          sA.corner(`Albers equal-area conic, n = ${CA.n.toFixed(4)}`, 'tl', { color: 'muted', weight: 600, plate: true });
          // displacement between the two maps over the region
          let disp = 0, sc = 0;
          for (let f = ls; f <= ln; f += 1) for (let l = R.lon[0]; l <= R.lon[1]; l += 2) { const p = CA.fwd((l - lon0) * D2R, f * D2R), q = CL.fwd((l - lon0) * D2R, f * D2R); disp = Math.max(disp, Math.hypot(p[0] - q[0], p[1] - q[1])); }
          for (let f = ls; f <= ln; f += 0.5) sc = Math.max(sc, Math.abs(CL.k(f * D2R) ** 2 - 1));
          // plot
          const ymax = Math.max(0.02, ...dots.map((d) => Math.abs(d[2] - 1))) * 1.15;
          sB.setView([lat0, lat1], [1 - ymax, 1 + ymax]);
          sB.hline(1, { color: 'faint', width: 1 });
          sB.fn((f) => CL.k(f * D2R) ** 2, { domain: [lat0, lat1], color: 'red', width: 1.4, alpha: 0.6 });
          sB.dots(dots.map((d) => [d[0], d[2]]), { r: 3, color: 'red' });
          sB.dots(dots.map((d) => [d[0], d[1]]), { r: 3.5, color: 'green' });
          for (const f of [a, b]) sB.vline(f, { color: 'green', dash: [4, 4], width: 1.2 });
          v.legend([['green', 'Albers: cell area ratio'], ['red', 'Lambert conic: ratio (curve $k^2$)'], ['accent', 'Albers cells'], ['red', 'Lambert cells', { dash: true }]]);
          st = { worstA, worstL, disp, n: CA.n, nL: CL.n, a, b, R, cells: dots.length, sc };
        });
        v.readout(() => {
          const { worstA, worstL, disp, n, nL, a, b, R, cells, sc } = st;
          return `${R.label}, parallels ${a.toFixed(2)}° and ${b.toFixed(2)}°: **Albers** $n = ${n.toFixed(4)}$; over ${cells} cells of $5^\\circ\\times5^\\circ$ the map area differs from the true area by at most **${(worstA * 100).toFixed(3)}%** (the residue is the polygonal approximation of each cell's boundary). **Lambert conformal conic** ($n = ${nL.toFixed(4)}$) on the same parallels: cell areas are off by up to **${(worstL * 100).toFixed(2)}%** (area factor $k^2$, extreme ${(sc * 100).toFixed(2)}%). The two maps place points of the region at most ${comma(disp * R_MEAN)} km apart (in map units at the nominal scale, from a common origin).`;
        });
      },
    },
  ],
};
void secd; void mean; void ellipse;
