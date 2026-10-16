// Aerospace Engineering — Chapter 2: Airfoils
//
// Sources and what is from memory (Oct 2026):
//   2.1 NACA 4-digit thickness and camber formulae (Abbott & von Doenhoff form; the coefficients 0.2969, -0.1260, -0.3516, 0.2843, -0.1036
//       and the camber parabolas are the standard published ones, as coded in ch01.shared.js). Leading-edge radius 1.1019 t^2 follows from the
//       sqrt(x) term (5 t 0.2969 = 1.4845 t, 1.4845^2/2 = 1.1019), recomputed here. Attribution to NACA Report 460 (1933) is from memory.
//   2.2 NACA 0012 data: Critzos, Heyson & Boswinkle, NACA TN 3361 (1955), read off the figure (ch01.shared.js CRITZOS_18 / CRITZOS_05, +-0.03 in c_l).
//       The Kirchhoff trailing-edge-separation curve c_l = a (alpha - alpha_L0)((1 + sqrt f)/2)^2 with f = 1 - 0.3 exp((alpha - A1)/S1) (attached side) and
//       0.04 + 0.66 exp((A1 - alpha)/S2) (separated side) is the form used in dynamic-stall models (Leishman-Beddoes); its form is from memory, its four
//       parameters were fitted by eye to the Critzos table by this chapter (ch02.shared.js KIRCH). It is a model, not a measurement.
//   2.3 Hess-Smith panel method (ch01.shared.js); thin-airfoil zero-lift angle from Glauert's integral.
//   2.4 The aerodynamic centre at x/c = 1/4 of a thin airfoil is a thin-airfoil-theory result; the panel method recovers it numerically (printed in the readout).
//   2.5 Exact solution: Karman-Trefftz map z = n c (1 + W)/(1 - W), W = ((zeta - c)/(zeta + c))^n (Joukowski for n = 2), circulation Gamma = 4 pi a U sin(alpha + beta)
//       from the Kutta condition; both recomputed and checked against the panel solution. The map's form is from memory.
//   2.6 Flap effect on zero-lift angle by Glauert's thin-airfoil integral (computed numerically), reduced by an empirical viscous factor (default 0.7, from memory of
//       typical flap-effectiveness corrections); the slat's stall-angle gain (default 7 deg) is illustrative, not data. Sea-level density 1.225 kg/m3.
//   2.7 Boundary layer: Thwaites laminar method (White's curve fits), Michel transition criterion, Head's entrainment method with Ludwieg-Tillmann friction,
//       Squire-Young drag (evaluated at x/c = 0.95), all formulae from memory and coded here; the NACA 0012 data of Critzos et al. is the check. Flat-plate laminar
//       2*1.328/sqrt(Re) (Blasius) and turbulent 2*0.455/(log10 Re)^2.58 (Schlichting) are the reference curves.

import {
  clamp, DEG, RHO0, FT, KT, CRITZOS_18, CRITZOS_05, clTab, cdTab, naca4, nacaT, nacaCamber, camberLine, panelModel, panelSolve, panelForces,
  thinAirfoil, nacaSlope, kirchCl, kirchF, KIRCH, karmanTrefftz, boundaryLayer,
} from './ch02.shared.js';

const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
const sci = (x, d = 2) => { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${m.toFixed(d)}\\times10^{${e}}`; };
const cache = new Map();
function foil(m, p, t, n = 70) { // NACA 4-digit section and its panel model, cached
  const k = `${m}|${p}|${t}|${n}`; let o = cache.get(k);
  if (!o) { const pts = naca4(m, p, t, n); o = { pts, model: panelModel(pts), n }; cache.set(k, o); if (cache.size > 60) cache.delete(cache.keys().next().value); }
  return o;
}
/** Rotate (x, y) nose-up by alpha about the quarter chord (body frame -> wind frame with the stream horizontal). */
const rotA = (x, y, a, cx = 0.25) => [cx + (x - cx) * Math.cos(a) + y * Math.sin(a), -(x - cx) * Math.sin(a) + y * Math.cos(a)];
function interp(xs, ys, x) { // xs increasing
  if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
  return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
}
/** Upper and lower surface arrays (x increasing) of a field defined per panel. */
function surfaces(model, arr) {
  const { N, cx } = model, n = N / 2, up = { x: [], y: [] }, lo = { x: [], y: [] };
  for (let i = n; i < N; i++) { up.x.push(cx[i]); up.y.push(arr[i]); }
  for (let i = n - 1; i >= 0; i--) { lo.x.push(cx[i]); lo.y.push(arr[i]); }
  return { up, lo };
}
const nacaName = (m, p, t) => {
  const ok = [m, p / 10, t].every((q) => Math.abs(q - Math.round(q)) < 0.05);
  return `${ok ? '' : '≈ '}NACA ${Math.round(m)}${Math.round(p / 10)}${String(Math.round(t)).padStart(2, '0')}`;
};

export default {
  collection: 'aero',
  chapter: 2,
  title: 'Airfoils',
  summary: String.raw`An airfoil's job is to turn the oncoming flow and so produce lift with little drag. Its lift grows almost linearly with angle of attack at a rate close to $2\pi$ per radian until the flow separates and the wing stalls. The aerodynamic centre, where the pitching moment stays constant, organises the moment data; pressure distributions, panel methods and high-lift devices show how designers predict and shape the flow.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Airfoil geometry: camber, thickness and angle of attack',
      statement: String.raw`An **airfoil** is the cross-section of a wing cut by a plane parallel to the flow. Its geometry is described by
(a) the **chord line**, the straight line from the leading edge to the trailing edge, of length $c$;
(b) the **mean camber line**, the locus of points halfway between the upper and lower surfaces, with **camber** $y_c(x)$ measured from the chord line;
(c) the **thickness distribution** $y_t(x)$, the half-thickness laid off perpendicular to the camber line;
(d) the **angle of attack** $\alpha$, the angle between the chord line and the relative wind $V_\infty$.
The four-digit NACA family builds a section from one camber parabola pair and one thickness formula, specified by three numbers: maximum camber $m$, its position $p$, and maximum thickness $t$ (all fractions of $c$), written NACA $m\,p\,tt$ with $m$ in percent, $p$ in tenths and $t$ in percent.`,
      idea: String.raw`Splitting the shape into a camber line and a symmetric thickness distribution is useful because the two do different jobs. In thin-airfoil theory (later in this chapter) the lift at angle $\alpha$ depends only on the camber line, through the zero-lift angle $\alpha_{L0}$, while thickness mostly sets the leading-edge radius, the pressure peaks and the structural depth. The surface points are $x_{U,L} = x \mp y_t\sin\theta$, $y_{U,L} = y_c \pm y_t\cos\theta$ with $\tan\theta = \mathrm{d}y_c/\mathrm{d}x$, which is exactly the construction drawn in the picture.`,
      caption: String.raw`Drag the orange handle to move the position and height of maximum camber, or use the sliders for thickness and angle of attack. Turn on the construction: each cross-stroke is a thickness laid off perpendicular to the camber line, and the dashed circle is the leading-edge circle. Note that the angle of attack rotates the relative wind, not the airfoil, and that the zero-lift angle (readout) moves as soon as there is camber.`,
      deps: ['aero-1.3'],
      refs: ['Anderson ch. 5'],
      tags: ['airfoil', 'geometry'],
      scope: String.raw`The thin-airfoil numbers in the readout assume small $\alpha$ and a thin section; the leading-edge radius $1.1019\,t^2$ is specific to the NACA four-digit thickness formula.`,
      credit: 'NACA four-digit series: Jacobs, Ward & Pinkerton, NACA Report 460, 1933',
      viz(v) {
        const m = v.slider('max camber m (% of chord)', 0, 9, 2, { step: 0.1 });
        const p = v.slider('position of max camber p (% of chord)', 10, 90, 40, { step: 1 });
        const t = v.slider('max thickness t (% of chord)', 3, 24, 12, { step: 0.5 });
        const al = v.slider('angle of attack α (°)', -6, 16, 6, { step: 0.1 });
        const con = v.toggle('show the construction', true);
        const A = v.stage({ x: [-0.2, 1.2], y: [-0.3, 0.3], equal: true, axes: false, height: 330, full: true });
        const B = v.stage({ x: [0, 1], y: [-0.02, 0.2], axes: 'box', gutter: true, height: 240, minWidth: 270, xlabel: 'x/c', ylabel: 'y/c', title: 'camber and half-thickness' });
        const C = v.stage({ x: [0, 1], y: [-0.35, 0.35], axes: 'box', gutter: true, height: 240, minWidth: 270, xlabel: 'x/c', ylabel: 'dy_c/dx', title: 'camber-line slope' });
        const h = A.handle(0.4, 0.02, { color: 'orange', r: 7, label: 'max camber', labelPos: 'n', constrain: { x: [0.1, 0.9], y: [0, 0.09] } });
        h.onDrag = () => { p.set(Math.round(h.x * 100)); m.set(Math.round(h.y * 1000) / 10); };
        let last = {};
        v.render(() => {
          const M = m.value / 100, P = p.value / 100, T = t.value / 100, a = al.value * DEG;
          h.set(P, M);
          const pts = naca4(M, P, T, 80), d = [Math.cos(a), -Math.sin(a)], nrm = [Math.sin(a), Math.cos(a)];
          for (let k = -2; k <= 2; k++) { const cx = -0.1 + 0.11 * k * nrm[0], cy = 0.11 * k * nrm[1] + 0.0; A.arrow(cx - 0.11 * d[0], cy - 0.11 * d[1], cx + 0.11 * d[0], cy + 0.11 * d[1], { color: 'gold', width: 1.6, head: 6 }); }
          A.tex(String.raw`V_\infty`, -0.1, 0.27, { color: 'muted', size: 15, align: 'center' });
          A.line(-0.2, 0, 1.08, 0, { color: 'muted', dash: true, width: 1.2 });
          A.line(0, 0, -0.2 * d[0], -0.2 * d[1], { color: 'gold', dash: true, width: 1.2 });
          const arc = []; for (let k = 0; k <= 24; k++) { const th = Math.PI - a * k / 24; arc.push([0.13 * Math.cos(th), 0.13 * Math.sin(th)]); }
          A.path(arc, { color: 'gold', width: 2 });
          A.tex(String.raw`\alpha`, -0.185, 0.045 + (a > 0 ? 0 : -0.09), { color: 'gold', size: 15 });
          A.poly(pts, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          const cam = camberLine(M, P, 80);
          A.path(cam, { color: 'orange', width: 2.2 });
          if (con.value) {
            for (const xs of [0.04, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.96]) {
              const [yc, dy] = nacaCamber(xs, M, P), th = Math.atan(dy), yt = nacaT(xs, T);
              A.line(xs + yt * Math.sin(th), yc - yt * Math.cos(th), xs - yt * Math.sin(th), yc + yt * Math.cos(th), { color: 'ink', alpha: 0.5, width: 1 });
              A.dot(xs, yc, { r: 2.2, color: 'orange' });
            }
            const r = 1.1019 * T * T; A.circle(r, 0, r, { color: 'muted', dash: true, width: 1.2 });
            A.dot(r, 0, { r: 2.5, color: 'muted' });
          }
          A.tex(String.raw`c`, 0.5, -0.045, { color: 'muted', size: 14, align: 'center' });
          A.tex(String.raw`\text{chord line}`, 1.1, 0.03, { color: 'muted', size: 12, align: 'center' });
          A.tex(String.raw`\text{mean camber line}`, 0.62, nacaCamber(0.62, M, P)[0] + 0.012, { color: 'orange', size: 12, align: 'center', baseline: 'bottom' });
          B.fn((x) => nacaT(x, T), { color: 'accent', width: 2.2 });
          B.fn((x) => nacaCamber(x, M, P)[0], { color: 'orange', width: 2.2 });
          B.vline(0.3, { color: 'faint', dash: true }); B.dot(0.3, nacaT(0.3, T), { color: 'accent', r: 4, label: 'max thickness at 0.3c', labelPos: 'ne' });
          if (M > 0) B.dot(P, M, { color: 'orange', r: 4, label: 'max camber', labelPos: 'ne' });
          C.hline(0, { color: 'muted' });
          C.fn((x) => nacaCamber(x, M, P)[1], { color: 'orange', width: 2.2 });
          last = thinAirfoil(nacaSlope(M, P));
        });
        v.legend([['ink', 'section'], ['muted', 'chord line', { dash: true }], ['orange', 'mean camber line'], ['gold', 'relative wind']]);
        v.readout(() => {
          const T = t.value / 100, aL = last.alphaL0 / DEG, cl = 2 * Math.PI * (al.value * DEG - last.alphaL0);
          return `${nacaName(m.value, p.value, t.value)} · leading-edge radius $1.1019\\,t^2 = ${fx(1.1019 * T * T, 4)}\\,c$ · maximum thickness at $0.3c$\n`
            + `Thin-airfoil theory: zero-lift angle $\\alpha_{L0} = ${fx(aL, 2)}^\\circ$, $c_{m,c/4} = ${fx(last.cm, 3)}$, and at $\\alpha = ${fx(al.value, 1)}^\\circ$ the lift coefficient is $2\\pi(\\alpha-\\alpha_{L0}) = ${fx(cl, 2)}$. Thickness does not appear in these numbers.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Phenomenon',
      name: 'The lift curve and stall',
      statement: String.raw`At low and moderate angles of attack the section lift coefficient of an airfoil in attached flow grows linearly with $\alpha$,
$$c_l = a_0\,(\alpha - \alpha_{L0}),\qquad a_0 \approx 2\pi\ \text{per radian}\ (\approx 0.11\ \text{per degree}),$$
where the zero-lift angle $\alpha_{L0}$ is zero for a symmetric section and negative for positive camber. At an angle of the order of $12^\circ$–$18^\circ$ for conventional sections the boundary layer separates, the separation point moves forward from the trailing edge, the curve bends over, $c_l$ reaches a maximum $c_{l,\max}$ and then falls: the airfoil **stalls**. The sharpness of the stall and the value of $c_{l,\max}$ depend on thickness, camber, Reynolds number and surface condition.`,
      idea: String.raw`The linear part is thin-airfoil theory ($a_0 = 2\pi$ by the Kutta condition, from the previous results on the flat plate) corrected a little by thickness and by the boundary layer. The bend comes from the boundary layer: with rising $\alpha$ the adverse pressure gradient behind the suction peak thickens the layer, separation starts at the trailing edge and moves forward, and the separated region carries almost no suction, so lift is lost. Kirchhoff's picture captures this: if the flow is attached up to a fraction $f$ of the chord, $c_l \approx a_0(\alpha-\alpha_{L0})\big(\tfrac{1+\sqrt f}{2}\big)^2$.`,
      caption: String.raw`Drag the handle on the lift curve (or the slider) to change $\alpha$. The dots are measured lift coefficients of a NACA 0012 section; the solid curve is a separation model with the separation point $f$ shown on the airfoil and in the right panel. The dashed line is thin-airfoil theory, the dotted line an attached-flow panel-method result. Add camber and the whole curve shifts left, so that lift appears at $\alpha = 0$; switch to the lower Reynolds number and the maximum arrives earlier and lower.`,
      deps: ['aero-2.1', 'fluid-5.7', 'fluid-8.7'],
      refs: ['Anderson ch. 5'],
      tags: ['lift', 'stall'],
      scope: String.raw`The measured data are for a smooth NACA 0012 section at $M \le 0.15$ and $Re = 1.8\times10^6$ and $0.5\times10^6$. The cambered curves are a model: camber is assumed only to shift the curve by $\alpha_{L0}$, while real cambered sections also change $c_{l,\max}$ and the stall character. Pressure and shear from a three-dimensional wing are a different matter (chapter 3).`,
      credit: 'NACA 0012 data: Critzos, Heyson & Boswinkle, NACA TN 3361, 1955',
      viz(v) {
        const reSel = v.select('Reynolds number', [{ value: 'r18', label: '1.8×10⁶' }, { value: 'r05', label: '0.5×10⁶' }], 'r18');
        const cam = v.slider('camber m (% of chord, p = 40 %)', 0, 6, 0, { step: 0.1 });
        const al = v.slider('angle of attack α (°)', -4, 26, 8, { step: 0.1 });
        const A = v.stage({ x: [-4, 26], y: [-0.6, 1.9], axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'α (°)', ylabel: 'c_l', title: 'lift curve' });
        const B = v.stage({ x: [-0.25, 1.25], y: [-0.38, 0.38], equal: true, axes: false, height: 340, minWidth: 280, title: 'the flow over the section' });
        const C = v.stage({ x: [-4, 26], y: [0, 1.05], axes: 'box', gutter: true, height: 220, minWidth: 300, xlabel: 'α (°)', ylabel: 'f', title: 'attached fraction of the chord' });
        const hnd = A.handle(8, 0.9, { color: 'gold', r: 8, constrain: (x) => [clamp(x, -4, 26), 0] });
        let sync = false;
        hnd.onDrag = () => { if (sync) return; sync = true; al.set(Math.round(clamp(hnd.x, -4, 26) * 10) / 10); sync = false; };
        const par = (aL) => ({ ...KIRCH[reSel.value], aL0: aL });
        const model = () => foil(cam.value / 100, 0.4, 0.12, 60);
        let info = {};
        v.render(() => {
          const M = cam.value / 100, th = thinAirfoil(nacaSlope(M, 0.4)), aL = th.alphaL0 / DEG, P = par(aL), T = reSel.value === 'r18' ? CRITZOS_18 : CRITZOS_05;
          const fo = model(), nacaPts = fo.pts;
          const sol = (a) => panelSolve(fo.model, a * DEG).cl;
          // data
          A.hline(0, { color: 'grid' }); A.vline(0, { color: 'grid' });
          A.dots(T.filter((r) => r[0] <= 26).map((r) => [r[0], r[1]]), { r: 3.5, color: 'muted' });
          A.line(-4, 2 * Math.PI * (-4 * DEG - th.alphaL0), 14, 2 * Math.PI * (14 * DEG - th.alphaL0), { color: 'faint', dash: true, width: 1.4 });
          A.path([[-4, sol(-4)], [14, sol(14)]], { color: 'purple', dash: [2, 3], width: 1.4 });
          A.fn((x) => kirchCl(x, P).cl, { color: 'accent', width: 2.6, domain: [-4, 26] });
          const cur = kirchCl(al.value, P);
          sync = true; hnd.set(al.value, cur.cl); sync = false;
          A.dot(al.value, cur.cl, { r: 4, color: 'gold' });
          // clmax of the model
          let best = [-1, 0]; for (let a = 0; a <= 26; a += 0.05) { const c = kirchCl(a, P).cl; if (c > best[0]) best = [c, a]; }
          A.dot(best[1], best[0], { r: 4.5, color: 'red', hollow: true, label: `stall ${fx(best[1], 1)}°`, labelPos: 'n' });
          // picture
          const a = al.value * DEG, cp = nacaPts.map(([x, y]) => rotA(x, y, a));
          for (const y of [-0.28, -0.18, -0.08, 0.02, 0.12, 0.22, 0.32]) B.arrow(-0.23, y, -0.1, y, { color: 'faint', width: 1.2, head: 5 });
          B.poly(cp, { fill: 'ink', fillAlpha: 0.2, color: 'ink', width: 1.8 });
          const f = cur.f;
          if (f < 0.995) {
            const n = fo.n, up = []; for (let k = 0; k <= n; k++) up.push(nacaPts[n + k]); // LE -> TE upper
            const seg = up.filter(([x]) => x >= f);
            const top = seg.map(([x, y]) => { const u = (x - f) / Math.max(1 - f, 1e-3); return [x, y + 0.16 * Math.pow(1 - f, 0.8) * Math.sqrt(u) * (1 - 0.35 * u)]; });
            B.poly([...seg, ...top.slice().reverse()].map(([x, y]) => rotA(x, y, a)), { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.2 });
            const [qx, qy] = rotA(0.5 * (f + 1), interp(up.map((q) => q[0]), up.map((q) => q[1]), 0.5 * (f + 1)) + 0.03 * (1 - f), a);
            B.arrow(qx + 0.07, qy, qx - 0.04, qy, { color: 'red', width: 1.6, head: 5 });
            const [sx, sy] = rotA(f, interp(up.map((q) => q[0]), up.map((q) => q[1]), f), a);
            B.dot(sx, sy, { r: 4.5, color: 'red' });
            B.text(`separation at x/c = ${fx(f, 2)}`, 0.6, 0.31, { color: 'red', size: 11.5, align: 'center' });
          } else B.text('attached flow', 0.5, 0.31, { color: 'green', size: 11.5, align: 'center' });
          // f(alpha)
          C.hline(1, { color: 'grid' });
          C.fn((x) => kirchF(x - P.aL0, P), { color: 'red', width: 2.2, domain: [-4, 26] });
          C.dot(al.value, f, { r: 4.5, color: 'gold' });
          info = { cur, best, aL, aSlope: 0, T, P, panel0: (sol(10) - sol(0)) / (10 * DEG) };
        });
        v.legend([['muted', 'measured, NACA 0012', { dot: true }], ['accent', 'separation model'], ['faint', 'thin-airfoil theory', { dash: true }], ['purple', 'panel method (attached)', { dash: true }]]);
        v.readout(() => {
          const { cur, best, aL, T, panel0 } = info, meas = clTab(T, al.value), tmax = T.reduce((q, r) => (r[1] > q[1] ? r : q), [0, 0]);
          return `At $\\alpha = ${fx(al.value, 1)}^\\circ$: model $c_l = ${fx(cur.cl, 2)}$ with the flow attached over ${fx(cur.f * 100, 0)}\\% of the chord; measured symmetric section $c_l = ${fx(meas, 2)}$ (read off the figure, $\\pm0.03$). Thin-airfoil theory: $2\\pi(\\alpha-\\alpha_{L0}) = ${fx(2 * Math.PI * (al.value - aL) * DEG, 2)}$ with $\\alpha_{L0} = ${fx(aL, 2)}^\\circ$.\n`
            + `Model maximum $c_{l,\\max} = ${fx(best[0], 2)}$ at $\\alpha = ${fx(best[1], 1)}^\\circ$; measured maximum ${fx(tmax[1], 2)} at ${fx(tmax[0], 1)}$°. Slope: $2\\pi = 6.28$ per radian, attached panel method (12 % thick) ${fx(panel0, 2)} per radian, fitted real-flow slope ${fx(KIRCH.r18.a, 1)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Pressure coefficient distribution',
      statement: String.raw`The **pressure coefficient** at a point of the surface is the surface pressure measured against the free stream and made dimensionless with the dynamic pressure,
$$C_p = \frac{p - p_\infty}{\tfrac12\rho_\infty V_\infty^2}.$$
In incompressible flow Bernoulli's theorem gives $C_p = 1 - (V/V_\infty)^2$ with $V$ the local surface speed, so $C_p = 1$ at a stagnation point and $C_p < 0$ where the flow is faster than the free stream. Plotted against $x/c$ for the upper and lower surfaces (with $-C_p$ conventionally up), the **area between the two curves** is the section lift coefficient to small angles,
$$c_l \approx \int_0^1 \big(C_{p,l} - C_{p,u}\big)\,\mathrm{d}\!\left(\frac{x}{c}\right).$$`,
      idea: String.raw`Bernoulli's theorem along a streamline connects pressure to speed, and the pressure on the surface is the force per area normal to it; integrating the vertical component of this force over the surface gives the lift, which for small angles is the integral of the pressure difference across the chord. A sharper suction peak near the leading edge appears when the oncoming flow must turn quickly around the nose, which happens as $\alpha$ rises or the nose gets thinner.`,
      caption: String.raw`Change the angle of attack, camber and thickness (Hess–Smith panel solution, inviscid) and watch the suction peak grow while the stagnation point slides under the nose. Drag the handle along the upper curve to read the local speed and check $C_p = 1-(V/V_\infty)^2$. The lower panel plots the peak suction against $\alpha$ for the chosen shape. The shading of the section outline shows suction (blue) and pressure (red).`,
      deps: ['aero-2.1', 'fluid-2.9'],
      refs: ['Anderson ch. 5'],
      tags: ['pressure', 'lift'],
      scope: String.raw`Inviscid, incompressible, attached flow. Real sections have a boundary layer that thins the suction peak at high $\alpha$ and a separated wake beyond stall.`,
      viz(v) {
        const al = v.slider('angle of attack α (°)', -4, 14, 6, { step: 0.1 });
        const m = v.slider('camber m (% of chord)', 0, 6, 2, { step: 0.1 });
        const t = v.slider('thickness t (% of chord)', 6, 24, 12, { step: 0.5 });
        const A = v.stage({ x: [0, 1], y: [-1.5, 4], axes: 'box', gutter: true, height: 330, minWidth: 320, xlabel: 'x/c', ylabel: '−C_p', title: 'pressure coefficient (suction up)' });
        const B = v.stage({ x: [-0.15, 1.15], y: [-0.3, 0.3], equal: true, axes: false, height: 330, minWidth: 280, title: 'surface pressure' });
        const D = v.stage({ x: [-4, 14], y: [0, 4], axes: 'box', gutter: true, height: 210, minWidth: 320, xlabel: 'α (°)', ylabel: '−C_p,min', title: 'peak suction against angle of attack' });
        const probe = A.handle(0.3, 0, { color: 'gold', r: 7, constrain: (x) => [clamp(x, 0.004, 0.996), 0] });
        let info = {};
        v.render(() => {
          const fo = foil(m.value / 100, 0.4, t.value / 100), md = fo.model, sol = panelSolve(md, al.value * DEG), { up, lo } = surfaces(md, sol.cp);
          const U = up.x.map((x, i) => [x, -up.y[i]]), Lw = lo.x.map((x, i) => [x, -lo.y[i]]);
          const ymax = Math.max(1.2, ...U.map((q) => q[1]), ...Lw.map((q) => q[1])) + 0.3, ymin = Math.min(-1.2, ...U.map((q) => q[1]), ...Lw.map((q) => q[1])) - 0.15;
          A.setView([0, 1], [ymin, ymax]);
          A.hline(0, { color: 'muted', width: 1 });
          A.poly(U.concat(Lw.slice().reverse()), { fill: 'accent', fillAlpha: 0.16, stroke: false });
          A.path(U, { color: 'accent', width: 2.4 }); A.path(Lw, { color: 'orange', width: 2.4 });
          const px = probe.x, cu = interp(up.x, up.y, px), cl_ = interp(lo.x, lo.y, px);
          probe.set(px, -cu);
          A.dot(px, -cl_, { r: 4.5, color: 'orange' });
          // stagnation point: where cp is max
          let is = 0; for (let i = 0; i < md.N; i++) if (sol.cp[i] > sol.cp[is]) is = i;
          A.dot(md.cx[is], -sol.cp[is], { r: 4.5, color: 'red', label: 'stagnation C_p = 1', labelPos: 'e' });
          // coloured section
          const a = 0, pts = fo.pts;
          B.poly(pts, { fill: 'ink', fillAlpha: 0.08, stroke: false });
          for (let i = 0; i < md.N; i++) {
            const c = sol.cp[i], tt = clamp(c / 1.4, -1, 1), col = v.diverge(Math.sign(tt) * (0.18 + 0.82 * Math.abs(tt)), 'blue', 'red');
            B.path([pts[i], pts[i + 1]], { color: col, width: 6 });
            if (i % 5 === 0 && Math.abs(c) > 0.15) {
              const len = Math.min(0.22, 0.07 * Math.abs(c)), nx = md.nx[i], ny = md.ny[i], [qx, qy] = [md.cx[i], md.cy[i]];
              if (c > 0) B.arrow(qx + nx * len, qy + ny * len, qx, qy, { color: 'red', width: 1.3, head: 4 }); else B.arrow(qx, qy, qx + nx * len, qy + ny * len, { color: 'accent', width: 1.3, head: 4 });
            }
          }
          B.dot(px, interp(up.x, pts.slice(md.N / 2, md.N).map((q) => q[1]), px), { r: 5, color: 'gold' });
          B.tex(String.raw`V_\infty`, -0.1, 0.12, { color: 'muted', size: 14 }); B.arrow(-0.14, 0.04, -0.03, 0.04 - 0.11 * Math.tan(al.value * DEG) * 0, { color: 'muted', width: 1.4, head: 5 });
          // peak suction vs alpha
          const pk = (a2) => { const s2 = panelSolve(md, a2 * DEG); return -Math.min(...s2.cp); };
          D.fn((x) => pk(x), { color: 'accent', width: 2.2, n: 60 });
          D.dot(al.value, -Math.min(...sol.cp), { r: 4.5, color: 'gold' });
          info = { sol, up, lo, cu, cl_, px, is, md, area: 0 };
          let ar = 0; for (let i = 0; i < md.N; i++) ar += -sol.cp[i] * md.ny[i] * md.L[i];
          info.area = ar;
        });
        v.readout(() => {
          const { sol, cu, cl_, px, md, area, is } = info, Vu = Math.sqrt(Math.max(0, 1 - cu)), Vl = Math.sqrt(Math.max(0, 1 - cl_));
          const th = thinAirfoil(nacaSlope(m.value / 100, 0.4));
          return `Probe at $x/c = ${fx(px, 2)}$: upper $V/V_\\infty = ${fx(Vu, 3)}$, $C_p = 1-(V/V_\\infty)^2 = ${fx(cu, 3)}$; lower $V/V_\\infty = ${fx(Vl, 3)}$, $C_p = ${fx(cl_, 3)}$ · peak suction $C_{p,\\min} = ${fx(Math.min(...sol.cp), 2)}$ · stagnation point at $x/c = ${fx(md.cx[is], 3)}$ ($C_p = ${fx(sol.cp[is], 3)}$)\n`
            + `Lift from the area between the curves: $\\oint -C_p\\,\\mathrm{d}x = ${fx(area, 3)}$; from the full pressure integral $c_l = ${fx(sol.cl, 3)}$; thin-airfoil theory $2\\pi(\\alpha-\\alpha_{L0}) = ${fx(2 * Math.PI * (al.value * DEG - th.alphaL0), 3)}$ (thickness raises the slope a few percent).`
            + (al.value > 12 ? '\nBeyond about 12° a real section of this thickness stalls; this attached-flow solution no longer applies.' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Centre of pressure and aerodynamic centre',
      statement: String.raw`The **centre of pressure** is the point of the chord about which the aerodynamic moment is zero; the whole force can be applied there. With $c_{m,c/4}$ the pitching-moment coefficient (nose up positive) about the quarter-chord point, it lies at
$$\frac{x_{cp}}{c} = \frac14 - \frac{c_{m,c/4}}{c_l},$$
and moves along the chord as the angle of attack changes, running off to infinity as $c_l \to 0$. The **aerodynamic centre** is the point about which the moment coefficient does not change with $\alpha$ (below stall). For thin airfoils in subsonic flow it is at $x/c \approx 1/4$, so that $c_{m,ac}$ is a constant of the section, and moments about any other point $x_0$ are $c_{m,x_0} = c_{m,ac} - (x_0/c - \tfrac14)\,c_l$.`,
      idea: String.raw`Moving the reference point by a distance $\Delta x$ changes the moment by $-N\,\Delta x$, with $N\approx L$ the normal force. Since in thin-airfoil theory the lift acts at $c/4$ for the $\alpha$-dependent part of the loading (the vortex sheet of a flat plate at angle of attack has its centroid at $c/4$) and the camber part of the loading is independent of $\alpha$, the moment about $c/4$ is independent of $\alpha$: $c_{m,c/4}=\pi(A_2-A_1)/4$ depends only on the camber line. The centre of pressure is then forced to move as the lift changes.`,
      caption: String.raw`Change the angle of attack (and the camber). The red dot is the centre of pressure, drifting along the chord and running far behind or ahead as $c_l \to 0$; the green dot at the quarter chord is the aerodynamic centre. Drag the reference point $x_0$ on the airfoil: only when it sits at the aerodynamic centre does the moment curve $c_{m,x_0}(\alpha)$ become flat, and its slope $-(x_0/c-\tfrac14)\,\mathrm{d}c_l/\mathrm{d}\alpha$ vanishes. Panel-method numbers throughout.`,
      deps: ['aero-2.2', 'fluid-5.7'],
      refs: ['Anderson ch. 5'],
      tags: ['moment', 'aerodynamic centre'],
      scope: String.raw`Inviscid, attached, subsonic flow over a thin section. The aerodynamic centre moves aft toward $x/c\approx 1/2$ in supersonic flow (chapter 4), and in the stalled regime no point has constant moment.`,
      viz(v) {
        const m = v.slider('camber m (% of chord)', 0, 6, 3, { step: 0.1 });
        const al = v.slider('angle of attack α (°)', -3, 12, 4, { step: 0.1 });
        const A = v.stage({ x: [-0.15, 1.2], y: [-0.28, 0.4], equal: true, axes: false, height: 320, minWidth: 320, title: 'force, centre of pressure, aerodynamic centre' });
        const B = v.stage({ x: [-3, 12], y: [-0.4, 0.4], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'α (°)', ylabel: 'c_m about x₀', title: 'moment about different points' });
        const C = v.stage({ x: [-3, 12], y: [-0.5, 1.5], axes: 'box', gutter: true, height: 230, minWidth: 300, xlabel: 'α (°)', ylabel: 'x_cp / c', title: 'centre of pressure' });
        const ref = A.handle(0.5, 0, { color: 'gold', r: 8, label: 'x₀', labelPos: 's', constrain: (x) => [clamp(x, 0, 1), 0] });
        let info = {};
        v.render(() => {
          const fo = foil(m.value / 100, 0.4, 0.12), md = fo.model, a = al.value * DEG;
          const row = (aa) => { const s = panelSolve(md, aa * DEG); return { cl: s.cl, cm: s.cm, N: s.Fy, a: aa }; };
          const cur = row(al.value);
          const x0 = ref.x, cmx = (r, x) => r.cm - (x - 0.25) * r.N;
          const xcp = 0.25 - cur.cm / cur.cl;
          // airfoil in the wind frame
          const pts = fo.pts.map(([x, y]) => rotA(x, y, a));
          for (const y of [-0.2, -0.1, 0, 0.1]) A.arrow(-0.14, y, -0.04, y, { color: 'faint', width: 1.2, head: 5 });
          A.poly(pts, { fill: 'ink', fillAlpha: 0.2, color: 'ink', width: 1.8 });
          const [qx, qy] = rotA(0.25, 0, a), [rx, ry] = rotA(clamp(xcp, -0.1, 1.1), 0, a), [sx, sy] = rotA(x0, 0, a);
          ref.set(x0, 0);
          A.dot(qx, qy, { r: 6, color: 'green', label: 'aerodynamic centre', labelPos: 's' });
          if (Math.abs(cur.cl) > 0.02 && xcp > -0.1 && xcp < 1.1) {
            A.dot(rx, ry, { r: 5.5, color: 'red', label: 'centre of pressure', labelPos: 'n' });
            const L = 0.3 * cur.cl; A.arrow(rx, ry, rx, ry + L, { color: 'green', width: 3, head: 8 });
          } else A.text(Math.abs(cur.cl) <= 0.02 ? 'c_l ≈ 0: the centre of pressure is far away' : `centre of pressure off the chord: x_cp/c = ${fx(xcp, 2)}`, 0.5, 0.33, { color: 'red', size: 11.5, align: 'center' });
          // moment curves
          const rows = []; for (let k = 0; k <= 30; k++) rows.push(row(-3 + k * 0.5));
          B.hline(0, { color: 'grid' });
          B.path(rows.map((r) => [r.a, cmx(r, 0)]), { color: 'purple', width: 1.8 });
          B.path(rows.map((r) => [r.a, cmx(r, 0.5)]), { color: 'teal', width: 1.8 });
          B.path(rows.map((r) => [r.a, cmx(r, 0.25)]), { color: 'green', width: 2.6 });
          B.path(rows.map((r) => [r.a, cmx(r, x0)]), { color: 'gold', width: 2.6, dash: true });
          B.dot(al.value, cmx(cur, x0), { r: 4.5, color: 'gold' });
          C.hline(0.25, { color: 'green', dash: true, width: 1 });
          const pc = rows.filter((r) => Math.abs(r.cl) > 0.12).map((r) => [r.a, 0.25 - r.cm / r.cl]);
          const segs = []; let cur2 = []; for (const q of pc) { if (cur2.length && Math.abs(q[0] - cur2[cur2.length - 1][0]) > 0.75) { segs.push(cur2); cur2 = []; } cur2.push(q); } if (cur2.length) segs.push(cur2);
          for (const sg of segs) C.path(sg, { color: 'red', width: 2.2 });
          if (xcp > -0.5 && xcp < 1.5) C.dot(al.value, xcp, { r: 4.5, color: 'gold' });
          // slopes
          const r0 = row(0), r6 = row(6), slope = (x) => (cmx(r6, x) - cmx(r0, x)) / 6, clA = (r6.cl - r0.cl) / 6;
          info = { cur, xcp, x0, slope: slope(x0), slopeAc: slope(0.25), cmac: r0.cm, clA, xac: 0.25 - (r6.cm - r0.cm) / (r6.N - r0.N) , th: thinAirfoil(nacaSlope(m.value / 100, 0.4)) };
        });
        v.legend([['purple', 'about the leading edge'], ['green', 'about c/4'], ['teal', 'about c/2'], ['gold', 'about x₀ (handle)', { dash: true }], ['red', 'centre of pressure']]);
        v.readout(() => {
          const { cur, xcp, x0, slope, slopeAc, cmac, clA, xac, th } = info;
          return `$c_l = ${fx(cur.cl, 3)}$, $c_{m,c/4} = ${fx(cur.cm, 3)}$ (thin-airfoil theory: ${fx(th.cm, 3)}) → $x_{cp}/c = 1/4 - c_{m,c/4}/c_l = ${fx(xcp, 3)}$\n`
            + `$\\mathrm{d}c_m/\\mathrm{d}\\alpha$ about $x_0 = ${fx(x0, 2)}$: $${fx(slope, 4)}$ per degree${Math.abs(x0 - 0.25) < 0.02 ? ' — flat: this is the aerodynamic centre' : ''}; about $c/4$: $${fx(slopeAc, 4)}$ per degree against $\\mathrm{d}c_l/\\mathrm{d}\\alpha = ${fx(clA, 3)}$. The panel method's own aerodynamic centre is at $x/c = ${fx(xac, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Method',
      name: 'Panel methods',
      statement: String.raw`A **panel method** computes the incompressible potential flow past an arbitrary body by replacing its surface with $N$ straight panels carrying singularities of unknown strength: a constant source density $q_j$ on panel $j$ and a vortex density $\gamma$. The unknowns are fixed by requiring the flow to be tangent to the surface at each panel's midpoint ($N$ equations) and by the Kutta condition that the flow leaves the trailing edge smoothly (one equation, e.g. equal speeds on the two panels at the trailing edge). The velocity and $C_p=1-(V/V_\infty)^2$ on the surface, and so the lift, follow from the solution; the circulation gives lift by the Kutta–Joukowski theorem $L=\rho V_\infty\Gamma$. As $N\to\infty$ the panel solution converges to the exact potential-flow solution.`,
      idea: String.raw`Source, vortex and uniform flow solve Laplace's equation, so any superposition does; only the boundary condition needs to be imposed, and that is a linear system $A\,[q;\gamma]=b$ of size $N+1$. A single vortex density with the Kutta condition fixes the circulation that otherwise would be arbitrary. The error comes from the piecewise-constant approximations of the surface and the strengths, so it falls roughly in proportion to the panel length, which is checked here against the exact Karman–Trefftz (Joukowski-type) airfoil, whose surface velocity is known from conformal mapping of the flow past a circle.`,
      caption: String.raw`The exact flow past a conformally mapped airfoil is the reference. Change the number of panels: the dots (panel $C_p$) approach the exact curve, and the convergence panel shows the lift-coefficient error shrinking as the panel count grows. Change thickness, camber and trailing-edge angle: with the sharp cusp (Joukowski) convergence is slower, because the two last panels nearly coincide.`,
      deps: ['fluid-4.5', 'fluid-5.3'],
      refs: ['Anderson ch. 5'],
      tags: ['panel method', 'potential flow'],
      scope: String.raw`Incompressible, irrotational, steady, attached flow; the model has no wake or boundary layer. Higher-order or vortex-panel versions converge faster than this constant-strength method.`,
      credit: 'Hess & Smith, 1967 (constant-source panels with a vortex); exact solution by conformal mapping: Joukowski 1910, Kármán & Trefftz 1918',
      viz(v) {
        const Np = v.slider('number of panels N', 8, 200, 24, { int: true, log: true });
        const al = v.slider('angle of attack α (°)', -4, 12, 5, { step: 0.1 });
        const eps = v.slider('thickness ε', 0.03, 0.2, 0.1, { step: 0.005 });
        const mu = v.slider('camber μ', 0, 0.12, 0.05, { step: 0.005 });
        const nsel = v.select('trailing edge', [{ value: '2', label: 'cusp (Joukowski)' }, { value: '1.9', label: 'angle 18°' }, { value: '1.8', label: 'angle 36°' }], '1.9');
        const A = v.stage({ x: [-0.1, 1.1], y: [-0.28, 0.28], equal: true, axes: false, height: 300, minWidth: 300, title: 'panels on the section' });
        const B = v.stage({ x: [0, 1], y: [-1.5, 3], axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'x/c', ylabel: '−C_p', title: 'surface pressure' });
        const C = v.stage({ x: [8, 256], y: [1e-4, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 240, minWidth: 300, xlabel: 'number of panels N', ylabel: '|Δc_l|/c_l', title: 'convergence of the lift coefficient' });
        const store = new Map();
        const getExact = (e, c, n) => { const k = `${e}|${c}|${n}`; let o = store.get(k); if (!o) { o = { J: karmanTrefftz(e, c, n, 200), models: new Map() }; o.surf = o.J.surface(900); store.set(k, o); if (store.size > 12) store.delete(store.keys().next().value); } return o; };
        const modelN = (o, N) => { let md = o.models.get(N); if (!md) { md = panelModel(karmanTrefftz(o.e, o.c, o.n, N).pts); o.models.set(N, md); } return md; };
        let info = {};
        v.render(() => {
          const e = eps.value, c = mu.value, n = Number(nsel.value), a = al.value * DEG, N = 2 * Math.round(Np.value / 2);
          const k = `${e}|${c}|${n}`; const o = getExact(e, c, n); o.e = e; o.c = c; o.n = n;
          const ex = o.J.exact(a), J = karmanTrefftz(e, c, n, N), md = panelModel(J.pts), sol = panelSolve(md, a);
          // exact curve
          const upper = [], lower = []; // the surface is sampled TE -> lower -> LE -> upper -> TE
          const half = o.surf.length >> 1;
          let iLE = 0; o.surf.forEach((q, i) => { if (q.p[0] < o.surf[iLE].p[0]) iLE = i; });
          const cpEx = o.surf.map((q) => [q.p[0], -(1 - ex.speedAt(q.th) ** 2)]);
          B.path(cpEx.slice(iLE), { color: 'accent', width: 2 }); B.path(cpEx.slice(0, iLE + 1), { color: 'orange', width: 2 });
          const dots = []; for (let i = 0; i < md.N; i++) dots.push([md.cx[i], -sol.cp[i]]);
          B.dots(dots, { r: 3, color: 'ink' });
          const ymax = Math.max(1.3, ...cpEx.map((q) => q[1])) + 0.3, ymin = Math.min(-1.2, ...cpEx.map((q) => q[1])) - 0.2; B.setView([0, 1], [ymin, ymax]);
          // panels
          A.poly(J.pts.slice(0, -1), { fill: 'ink', fillAlpha: 0.06, stroke: false });
          for (let i = 0; i < md.N; i++) { A.path([J.pts[i], J.pts[i + 1]], { color: i % 2 ? 'accent' : 'orange', width: 2.4 }); A.dot(md.cx[i], md.cy[i], { r: md.N > 60 ? 1.2 : 2.4, color: 'ink' }); }
          if (md.N <= 60) for (let i = 0; i < md.N; i += 1) A.arrow(md.cx[i], md.cy[i], md.cx[i] + 0.025 * md.nx[i], md.cy[i] + 0.025 * md.ny[i], { color: 'muted', width: 0.8, head: 2.5 });
          A.text(`${md.N} panels`, 0.5, 0.22, { color: 'muted', size: 11.5, align: 'center' });
          // convergence
          const Ns = [8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256], errs = [];
          for (const NN of Ns) { const mm = modelN(o, NN); errs.push([NN, Math.max(1e-4, Math.abs(panelSolve(mm, a).cl - ex.cl) / Math.abs(ex.cl))]); }
          C.path(errs, { color: 'accent', width: 2.2 }); C.dots(errs, { r: 3.5, color: 'accent' });
          C.path([[8, errs[0][1]], [256, errs[0][1] * 8 / 256]], { color: 'faint', dash: true, width: 1.2 });
          C.text('slope −1', 70, errs[0][1] * 8 / 70 * 1.7, { color: 'muted', size: 11 });
          const eN = Math.max(1e-4, Math.abs(sol.cl - ex.cl) / Math.abs(ex.cl)); C.dot(md.N, eN, { r: 5.5, color: 'gold' });
          info = { sol, ex, md, kj: sol.kj, errs, eN };
        });
        v.legend([['accent', 'exact, upper surface'], ['orange', 'exact, lower surface'], ['ink', 'panel method', { dot: true }]]);
        v.readout(() => {
          const { sol, ex, md, eN, errs } = info;
          const slope = Math.log(errs[errs.length - 3][1] / errs[errs.length - 1][1]) / Math.log(errs[errs.length - 1][0] / errs[errs.length - 3][0]);
          return `$N = ${md.N}$ panels: panel $c_l = ${fx(sol.cl, 4)}$ (from the pressure integral), exact $c_l = 2\\Gamma/(V_\\infty c) = ${fx(ex.cl, 4)}$ → relative error $${fx(eN * 100, 2)}\\,\\%$; vortex-sheet strength check $-2\\gamma\\,\\textstyle\\sum\\ell/(V_\\infty c) = ${fx(sol.kj, 4)}$\n`
            + `Over the last doublings of $N$ the error falls like $N^{-${fx(slope, 2)}}$ (first-order convergence would be 1).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Method',
      name: 'High-lift devices: flaps and slats',
      statement: String.raw`A wing sized for efficient cruise has too little lift at the low speeds of take-off and landing, since the stall speed is $V_s = \sqrt{2W/(\rho S\,C_{L,\max})}$. **Trailing-edge flaps** deflected by $\delta_f$ increase the camber: by thin-airfoil theory the zero-lift angle changes by $\Delta\alpha_{L0}=-\tfrac1\pi\!\int(\mathrm{d}y_c/\mathrm{d}x)(\cos\theta-1)\,\mathrm{d}\theta$ over the flap, so the whole lift curve shifts up by $\Delta c_l = a_0\,\tau\,\delta_f$ ($\tau<1$ depending on the flap chord fraction), at the price of a lower stall angle. **Leading-edge slats** open a slot that energises the boundary layer on the upper surface and delay stall to a higher angle, extending the lift curve. **Fowler flaps** also move aft and add wing area. Together these raise $C_{L,\max}$ substantially and cut the minimum speed.`,
      idea: String.raw`A deflected flap bends the camber line down behind the hinge, and Glauert's thin-airfoil integral turns that slope into a shift of the zero-lift angle. Real flaps give less than the inviscid value because the flap boundary layer thickens, so an empirical effectiveness factor is applied. A slat does nothing to the inviscid lift at a given angle but lowers the suction peak's risk of separation at the nose, moving the stall to a larger angle: the lift curve is the same line, run further. The lift curve is drawn here with the separation model of the previous results, in which the flap lowers $\alpha_{L0}$ and the slat raises the stall angle.`,
      caption: String.raw`Deflect the flap, add a slat, extend a Fowler flap, and watch the lift curve (middle) move from the clean curve (grey) to the configured one: it shifts up with the flap, extends with the slat. The right panel gives the stall speed against wing loading for each configuration; move the wing-loading slider to see the approach speed fall. The flap and slat effects are partly modelled, see the scope.`,
      deps: ['aero-2.2'],
      refs: ['Anderson ch. 5'],
      tags: ['flaps', 'slats', 'lift'],
      scope: String.raw`Flap effect: Glauert thin-airfoil value for a plain flap multiplied by the effectiveness factor $\eta$ (default 0.7, empirical and typical of the range 0.5–0.9); the slat benefit (default $+7^\circ$ in stall angle) and the model of stall are illustrative, not measurements of any aircraft. Section values are used as if for an unswept wing of infinite span; slotted and multi-element flaps do better than a plain flap.`,
      viz(v) {
        const d = v.slider('flap deflection δ_f (°)', 0, 45, 25, { step: 1 });
        const cf = v.slider('flap chord fraction c_f/c', 0.1, 0.4, 0.25, { step: 0.01 });
        const slat = v.toggle('leading-edge slat', true);
        const fow = v.slider('Fowler extension (fraction of chord)', 0, 0.3, 0, { step: 0.01 });
        const eta = v.slider('flap effectiveness η', 0.4, 1, 0.7, { step: 0.05 });
        const wl = v.slider('wing loading W/S (N/m²)', 500, 7000, 3000, { step: 50, log: true });
        const al = v.slider('angle of attack α (°)', -6, 28, 10, { step: 0.1 });
        const A = v.stage({ x: [-0.15, 1.45], y: [-0.28, 0.2], equal: true, axes: false, height: 290, full: true });
        const B = v.stage({ x: [-8, 28], y: [-0.6, 3.4], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'α (°)', ylabel: 'c_l', title: 'lift curve' });
        const C = v.stage({ x: [500, 7000], y: [0, 100], xlog: true, axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'wing loading W/S (N/m²)', ylabel: 'stall speed (m/s)', title: 'stall speed' });
        const hnd = B.handle(10, 1, { color: 'gold', r: 8, constrain: (x) => [clamp(x, -6, 28), 0] });
        let sync = false; hnd.onDrag = () => { if (sync) return; sync = true; al.set(Math.round(clamp(hnd.x, -6, 28) * 10) / 10); sync = false; };
        const SLAT = 7;
        const conf = (dd, ff, sl, fw, et) => {
          const slope = (x) => (x > 1 - ff ? -dd * DEG : 0), aL = thinAirfoil(slope).alphaL0 / DEG * et;
          const P = { ...KIRCH.r18, aL0: aL, A1: KIRCH.r18.A1 + (sl ? SLAT : 0) };
          const cl = (a) => kirchCl(a, P).cl * (1 + fw);
          let best = [-9, 0]; for (let a = -6; a <= 40; a += 0.05) { const c = cl(a); if (c > best[0]) best = [c, a]; }
          return { P, cl, aL, best, f: (a) => kirchCl(a, P).f };
        };
        const foilDraw = (dd, ff, sl, fw) => {
          const pts = naca4(0, 0, 0.12, 70), xh = 1 - ff, n = 70, rot = (x, y, a) => [xh + (x - xh) * Math.cos(a) + y * Math.sin(a), -(x - xh) * Math.sin(a) + y * Math.cos(a)];
          const yU = (x) => nacaT(x, 0.12), a = -dd * DEG, shift = fw;
          const fl = []; const flapUp = []; for (let k = 0; k <= 30; k++) { const x = xh + (1 - xh) * k / 30; flapUp.push([x, yU(x)]); }
          const flapLo = flapUp.map(([x, y]) => [x, -y]).reverse();
          const flap = [[xh, yU(xh)], ...flapUp, ...flapLo, [xh, -yU(xh)]].map(([x, y]) => { const [rx, ry] = rot(x, y, a); return [rx + shift, ry - 0.0 - 0.01 * (dd > 0 ? Math.sin(Math.min(1, fw * 6) * Math.PI / 2) : 0)]; });
          const mainUp = []; const mainLo = [];
          for (let k = 0; k <= 60; k++) { const x = xh * k / 60 * 0 + (0.5 * (1 - Math.cos(Math.PI * k / 60))) * xh; mainUp.push([x, yU(x)]); mainLo.push([x, -yU(x)]); }
          const main = [...mainLo, ...mainUp.slice().reverse()];
          let slatPts = null;
          if (sl) { const sU = [], sL = []; for (let k = 0; k <= 16; k++) { const x = 0.11 * (1 - Math.cos(Math.PI * k / 16)) / 2 * 2; sU.push([x, yU(x)]); sL.push([x, -yU(x)]); }
            slatPts = [...sL.slice().reverse(), ...sU].map(([x, y]) => [x * 0.7 - 0.065 + 0.0 * y, y * 0.6 - 0.018 - 0.0 * x + 0.0]); }
          return { main, flap, slatPts, mainTrue: pts };
        };
        let info = {};
        v.render(() => {
          const clean = conf(0, cf.value, false, 0, eta.value), cfg = conf(d.value, cf.value, slat.value, fow.value, eta.value);
          const G = foilDraw(d.value, cf.value, slat.value, fow.value), a = al.value * DEG;
          // picture: rotate whole assembly nose-up about the quarter chord for the angle of attack
          const R = (p) => rotA(p[0], p[1], a);
          for (const y of [-0.22, -0.12, -0.02, 0.08, 0.17]) A.arrow(-0.13, y, -0.03, y, { color: 'faint', width: 1.2, head: 5 });
          A.poly(G.main.map(R), { fill: 'ink', fillAlpha: 0.2, color: 'ink', width: 1.8 });
          A.poly(G.flap.map(R), { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.8 });
          if (G.slatPts) A.poly(G.slatPts.map(R), { fill: 'teal', fillAlpha: 0.3, color: 'teal', width: 1.8 });
          A.text(`flap ${fx(d.value, 0)}°` + (slat.value ? ' · slat' : '') + (fow.value > 0 ? ` · Fowler +${fx(fow.value * 100, 0)}%` : ''), 1.02, 0.15, { color: 'muted', size: 11.5, align: 'center' });
          // lift curves
          B.hline(0, { color: 'grid' });
          B.fn((x) => clean.cl(x), { color: 'muted', width: 2, domain: [-8, 28] });
          B.fn((x) => cfg.cl(x), { color: 'accent', width: 2.6, domain: [-8, 28] });
          B.dot(clean.best[1], clean.best[0], { r: 4, color: 'muted', hollow: true, label: `${fx(clean.best[0], 2)}`, labelPos: 'n' });
          B.dot(cfg.best[1], cfg.best[0], { r: 4.5, color: 'red', hollow: true, label: `${fx(cfg.best[0], 2)}`, labelPos: 'n' });
          const cc = cfg.cl(al.value); sync = true; hnd.set(al.value, cc); sync = false; B.dot(al.value, cc, { r: 4, color: 'gold' });
          // stall speed
          const Vs = (W, cl) => Math.sqrt(2 * W / (RHO0 * cl));
          C.setView([500, 7000], [0, Math.max(60, Vs(7000, clean.best[0]) * 1.05)]);
          C.fn((W) => Vs(W, clean.best[0]), { color: 'muted', width: 2 });
          C.fn((W) => Vs(W, cfg.best[0]), { color: 'accent', width: 2.6 });
          C.vline(wl.value, { color: 'gold', dash: true });
          C.dot(wl.value, Vs(wl.value, clean.best[0]), { r: 4.5, color: 'muted' }); C.dot(wl.value, Vs(wl.value, cfg.best[0]), { r: 4.5, color: 'accent' });
          info = { clean, cfg, Vc: Vs(wl.value, clean.best[0]), Vf: Vs(wl.value, cfg.best[0]) };
        });
        v.legend([['muted', 'clean wing'], ['accent', 'with devices'], ['red', 'maximum', { dot: true }]]);
        v.readout(() => {
          const { clean, cfg, Vc, Vf } = info;
          return `Flap alone shifts the zero-lift angle to $\\alpha_{L0} = ${fx(cfg.aL, 1)}^\\circ$ (Glauert integral × η) and lifts $c_l$ at fixed $\\alpha$ by $${fx(cfg.cl(0) - clean.cl(0), 2)}$; the stall angle becomes $${fx(cfg.best[1], 1)}^\\circ$ (clean $${fx(clean.best[1], 1)}^\\circ$).\n`
            + `$C_{L,\\max}$: ${fx(clean.best[0], 2)} → ${fx(cfg.best[0], 2)}. At $W/S = ${fx(wl.value, 0)}$ N/m²: $V_s = \\sqrt{2(W/S)/(\\rho\\,C_{L,\\max})}$ drops from ${fx(Vc, 1)} m/s (${fx(Vc / KT, 0)} kt) to ${fx(Vf, 1)} m/s (${fx(Vf / KT, 0)} kt); an approach at $1.3\\,V_s$ is ${fx(1.3 * Vf, 1)} m/s.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'Airfoil drag: friction and pressure drag',
      statement: String.raw`In potential flow the drag on a section is zero (d'Alembert). In real flow the section drag coefficient is the sum of **skin-friction drag**, the streamwise component of the wall shear, and **pressure (form) drag**, the net pressure force that remains because the boundary layer displaces the flow and, when it separates, because the pressure behind the separation point does not recover. The friction part falls with Reynolds number, $c_f\propto Re^{-1/2}$ in laminar and $\propto Re^{-1/5}$ in turbulent flow, and jumps up when transition moves forward and the layer becomes turbulent; the pressure part grows with thickness and angle of attack and rises steeply when the flow separates. For a smooth, moderately thick section at small $\alpha$ the total is about $c_d\approx0.005$–$0.01$.`,
      idea: String.raw`The boundary layer is computed from the inviscid surface speed: Thwaites' integral method for the laminar layer, Michel's criterion (or a trip location) to switch to turbulence, and Head's entrainment method for the turbulent layer, whose shape factor $H$ rises in an adverse pressure gradient (separation near $H\approx2.4$). At the trailing edge the momentum thickness $\theta$ is the momentum lost from the stream, and the Squire–Young formula $c_d = 2\theta\,(U_{TE}/V_\infty)^{(H+5)/2}$ turns it into the total drag; subtracting the integral of the wall shear leaves the pressure drag.`,
      caption: String.raw`Slide the Reynolds number and the transition behaviour. In the left panel the drag falls along the laminar and turbulent flat-plate lines and steps up between them as the transition point moves; the pressure part (red) grows with angle of attack and thickness. The middle panel colours the surface by boundary-layer state (laminar, turbulent, separated) and the right panel plots the wall shear, which jumps up at transition. Squares are measured drag coefficients of a NACA 0012 at this angle of attack (read off the figure).`,
      deps: ['fluid-8.1', 'fluid-8.6', 'aero-1.4'],
      refs: ['Anderson ch. 4', 'Anderson ch. 5'],
      tags: ['drag', 'boundary layer'],
      scope: String.raw`An uncoupled boundary-layer calculation on the inviscid pressure distribution: it ignores the displacement effect of the layer on the outer flow and is not reliable beyond the onset of strong separation (around the stall angle) or for laminar separation bubbles, which are treated as an immediate transition. Squire–Young is evaluated at $x/c = 0.95$.`,
      credit: 'NACA 0012 data: Critzos, Heyson & Boswinkle, NACA TN 3361, 1955',
      viz(v) {
        const re = v.slider('Reynolds number Re', 1e5, 1e8, 3e6, { log: true, sig: 2 });
        const tr = v.select('transition', [{ value: 'nat', label: 'natural' }, { value: 'trip', label: 'tripped at 5 %' }, { value: 'mid', label: 'at 50 %' }, { value: 'lam', label: 'delayed' }], 'nat');
        const al = v.slider('angle of attack α (°)', -2, 14, 2, { step: 0.1 });
        const t = v.slider('thickness t (% of chord)', 6, 24, 12, { step: 0.5 });
        const A = v.stage({ x: [1e5, 1e8], y: [1e-3, 5e-2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, minWidth: 320, xlabel: 'Reynolds number', ylabel: 'c_d', title: 'section drag against Reynolds number' });
        const B = v.stage({ x: [-0.1, 1.1], y: [-0.25, 0.25], equal: true, axes: false, height: 330, minWidth: 280, title: 'state of the boundary layer' });
        const C = v.stage({ x: [0, 1], y: [0, 12], axes: 'box', gutter: true, height: 230, minWidth: 320, xlabel: 'x/c', ylabel: '1000·τ_w/q', title: 'wall shear, upper (solid) and lower (dashed)' });
        const xtrOf = (k) => (k === 'nat' ? null : k === 'trip' ? 0.05 : k === 'mid' ? 0.5 : 1.01);
        let info = {};
        v.render(() => {
          const fo = foil(0, 0.4, t.value / 100), md = fo.model, a = al.value * DEG, sol = panelSolve(md, a), x0 = xtrOf(tr.value);
          const run = (Re) => boundaryLayer(md, sol.Vt, Re, x0, a);
          const cur = run(re.value);
          // sweep
          const R = [], tot = [], fr = [], pr = [];
          for (let k = 0; k <= 36; k++) { const Re = 10 ** (5 + 3 * k / 36), b = run(Re); R.push(Re); tot.push([Re, b.cd]); fr.push([Re, b.cdf]); pr.push([Re, Math.max(b.cdp, 1e-5)]); }
          A.fn((x) => 2 * 1.328 / Math.sqrt(x), { color: 'faint', width: 1.3, dash: true });
          A.fn((x) => 2 * 0.455 / Math.log10(x) ** 2.58, { color: 'faint', width: 1.3, dash: true });
          A.text('flat plate, laminar', 2.2e5, 2 * 1.328 / Math.sqrt(2.2e5) * 1.2, { color: 'muted', size: 10.5, align: 'left' });
          A.text('flat plate, turbulent', 2e7, 2 * 0.455 / Math.log10(2e7) ** 2.58 * 1.25, { color: 'muted', size: 10.5, align: 'left' });
          A.path(fr, { color: 'orange', width: 2 }); A.path(pr, { color: 'red', width: 2 }); A.path(tot, { color: 'accent', width: 2.8 });
          const T = [[1.8e6, CRITZOS_18], [0.5e6, CRITZOS_05]];
          for (const [Re, tab] of T) if (al.value <= 12) A.dot(Re, cdTab(tab, al.value), { r: 4.5, color: 'ink', hollow: true });
          A.vline(re.value, { color: 'gold', dash: true });
          A.dot(re.value, cur.cd, { r: 4.5, color: 'gold' });
          // picture
          const { state } = cur;
          B.poly(fo.pts, { fill: 'ink', fillAlpha: 0.15, color: 'ink', width: 1.2 });
          const cols = ['teal', 'orange', 'red'];
          for (let i = 0; i < md.N; i++) {
            const [px, py] = [md.cx[i], md.cy[i]], off = 0.018 + 6 * Math.abs(cur.delta[i]) * 0 + 0;
            B.path([[fo.pts[i][0] + md.nx[i] * off, fo.pts[i][1] + md.ny[i] * off], [fo.pts[i + 1][0] + md.nx[i] * off, fo.pts[i + 1][1] + md.ny[i] * off]], { color: cols[state[i]], width: 5 });
          }
          for (const sd of cur.sides) { /* nothing */ }
          const up = cur.sides[1] || {}, lw = cur.sides[0] || {};
          if (up.xT !== null && up.xT !== undefined) B.text('transition', up.xT, 0.14 * 0 + nacaT(up.xT, t.value / 100) + 0.05, { color: 'muted', size: 10.5, align: 'center' });
          if (up.xS) B.text('separation', Math.min(up.xS, 0.9), nacaT(Math.min(up.xS, 0.9), t.value / 100) + 0.09, { color: 'red', size: 10.5, align: 'center' });
          B.arrow(-0.09, 0.0, 0.0, 0.0 - 0.0, { color: 'faint', width: 1.4, head: 5 });
          // friction
          const sh = surfaces(md, cur.tau);
          const U = sh.up.x.map((x, i) => [x, Math.abs(sh.up.y[i]) * 1000]), Lw = sh.lo.x.map((x, i) => [x, Math.abs(sh.lo.y[i]) * 1000]);
          const ym = Math.max(4, ...U.map((q) => q[1]), ...Lw.map((q) => q[1])) * 1.1; C.setView([0, 1], [0, ym]);
          C.path(U.filter((q) => q[1] > 0), { color: 'orange', width: 2.2 }); C.path(Lw.filter((q) => q[1] > 0), { color: 'orange', width: 2.2, dash: true });
          info = { cur, sol };
        });
        v.legend([['accent', 'total'], ['orange', 'friction'], ['red', 'pressure'], ['ink', 'measured NACA 0012', { dot: true }], ['teal', 'laminar'], ['orange', 'turbulent'], ['red', 'separated']]);
        v.readout(() => {
          const { cur, sol } = info, up = cur.sides[1], lw = cur.sides[0];
          const f = (s) => (s ? (s.xT === null ? 'laminar to the trailing edge' : `transition at $x/c=${fx(s.xT, 2)}$`) + (s.xS ? `, separates at $${fx(s.xS, 2)}$` : '') : '—');
          return `$Re = ${sci(re.value, 1)}$: $c_d = ${fx(cur.cd, 4)}$ = friction $${fx(cur.cdf, 4)}$ + pressure $${fx(cur.cdp, 4)}$ (${fx(100 * cur.cdp / cur.cd, 0)} % form drag); $c_l = ${fx(sol.cl, 2)}$ (inviscid), $L/D = ${fx(sol.cl / cur.cd, 0)}$\n`
            + `Upper surface: ${f(up)}. Lower surface: ${f(lw)}. Measured smooth NACA 0012 at $\\alpha = ${fx(al.value, 1)}^\\circ$: $c_d = ${fx(cdTab(CRITZOS_18, al.value), 4)}$ ($Re = 1.8\\times10^6$) and $${fx(cdTab(CRITZOS_05, al.value), 4)}$ ($0.5\\times10^6$), read off the figure.`;
        });
      },
    },
  ],
};
