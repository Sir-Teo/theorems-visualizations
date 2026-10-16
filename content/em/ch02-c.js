// Electromagnetism — Chapter 2, part c: items 2.13–2.17 (surface-charge boundary conditions, dipole potential, mean value, Earnshaw, Paul trap)
import { TAU, KV, EPS0, pot, fld, sgnCol, nC, drawCharge, arrowPx, quiver, heatPot, levels, eig2, hess3 } from './ch02.shared.js';

/** Field (V/cm) of a uniformly charged strip |x| ≤ L, y = 0 (infinite along z), charge σ nC/cm², at (x, y). */
function strip(sig, L, x, y) {
  const s = sig / (2 * Math.PI * EPS0);
  if (Math.abs(y) < 1e-9) y = 1e-9;
  return [(s / 2) * Math.log(((x + L) ** 2 + y * y) / ((x - L) ** 2 + y * y)), s * (Math.atan((x + L) / y) - Math.atan((x - L) / y))];
}

export default {
  collection: 'em',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Boundary conditions at a surface charge',
      statement: String.raw`Across a surface carrying charge density $\sigma$ with unit normal $\hat{\mathbf n}$ (pointing from side 1 to side 2) the electrostatic field satisfies
$$E^{\perp}_{2}-E^{\perp}_{1}=\frac{\sigma}{\varepsilon_0},\qquad \mathbf E^{\parallel}_{2}=\mathbf E^{\parallel}_{1},$$
that is, the normal component jumps by $\sigma/\varepsilon_0$ and the tangential component is continuous. Equivalently the potential $V$ is continuous across the surface while $\partial V/\partial n$ jumps by $-\sigma/\varepsilon_0$.`,
      idea: String.raw`Apply Gauss’s law (em-1.14) to a thin pillbox straddling the surface: its side walls shrink away with its thickness, leaving only the two faces, whose flux difference is the enclosed charge $\sigma A$ divided by $\varepsilon_0$. Apply $\oint\mathbf E\cdot d\mathbf l=0$ (em-2.2) to a thin rectangular loop across the surface: the short ends vanish with thickness and the two long sides must cancel, so the tangential components agree. Neither argument cares what *else* produces the field, since external sources are continuous across the surface and cancel in the differences.`,
      caption: String.raw`A uniformly charged sheet of width 6 cm (seen edge-on, with an external uniform field you can add). Slide **zoom** to magnify the neighbourhood of the point $x_0$ on the sheet: far out you see a finite strip with its fringing field; zoomed in it is a flat sheet with a field jump. The green rectangle is both a Gaussian pillbox and an Ampèrian-style loop: its flux is $\sigma b/\varepsilon_0$ (per cm of length) and its circulation is zero, for any thickness you choose, even though $E_\perp$ jumps. The right panel plots $E_y$ and $E_x$ along the vertical line through $x_0$: $E_y$ steps by $\sigma/\varepsilon_0$, $E_x$ is continuous, whatever external field is added. Move $x_0$ off the end of the sheet and the jump disappears.`,
      deps: ['em-1.14', 'em-2.2'],
      refs: ['Griffiths §2.3'],
      tags: ['boundary conditions', 'surface charge'],
      viz(v) {
        const L = 3;
        const s = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 340, axes: false, weight: 1.2, title: 'a charged sheet, edge-on' });
        const sp = v.stage({ x: [-3, 3], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: '$y$ across the sheet (as a fraction of the window)', ylabel: 'field (V/cm)', title: '$E_y$ and $E_x$ along the vertical through $x_0$' });
        const sg = v.slider('surface charge $\\sigma$', -2, 2, 1, { step: 0.1, fmt: (x) => `${x.toFixed(1)} nC/cm²` });
        const eY = v.slider('external $E_y$', -8000, 8000, 3000, { step: 250, fmt: (x) => `${x} V/cm` });
        const eX = v.slider('external $E_x$', -8000, 8000, 2000, { step: 250, fmt: (x) => `${x} V/cm` });
        const zoom = v.slider('zoom: window half-width', 0.05, 5, 3.5, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const x0 = v.slider('position $x_0$ on the sheet', -4, 4, 0.8, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const bS = v.slider('pillbox width $b$', 0.1, 0.9, 0.5, { step: 0.05, fmt: (x) => `${x.toFixed(2)} of window` });
        const hS = v.slider('pillbox half-thickness $h$', 0.01, 0.5, 0.15, { step: 0.01, fmt: (x) => `${x.toFixed(2)} of window` });
        const E = (x, y) => { const a = strip(sg.value, L, x, y); return [a[0] + eX.value, a[1] + eY.value]; };
        let info = {};
        v.render(() => {
          const w = zoom.value, xc = x0.value, ar = 3 / 4;
          s.setView([xc - w, xc + w], [-w * ar, w * ar]);
          const b = bS.value * w, h = hS.value * w * ar;
          quiver(s, E, { spacing: 34, alpha: 0.6 });
          s.line(-L, 0, L, 0, { color: sg.value >= 0 ? 'red' : 'blue', width: 5 });
          s.vline(xc, { color: 'faint', width: 1, dash: [3, 4] });
          // pillbox / loop rectangle
          const x1 = xc - b / 2, x2 = xc + b / 2;
          s.rect(x1, -h, x2, h, { color: 'green', width: 2.6, fill: 'green', fillAlpha: 0.08 });
          // numerical flux and circulation (per cm of length), midpoint rule
          const N = 400; let flux = 0, circ = 0;
          for (let k = 0; k < N; k++) {
            const t = (k + 0.5) / N, xb = x1 + b * t, yv = -h + 2 * h * t;
            const eb = E(xb, -h), et = E(xb, h), el = E(x1, yv), er = E(x2, yv);
            flux += (-eb[1] + et[1]) * (b / N) + (-el[0] + er[0]) * ((2 * h) / N);
            circ += (eb[0] - et[0]) * (b / N) + (er[1] - el[1]) * ((2 * h) / N);
          }
          // jump values on the vertical through x0
          const eps = 1e-6, up = E(xc, eps), dn = E(xc, -eps), onSheet = Math.abs(xc) <= L;
          info = { flux, circ, jump: up[1] - dn[1], dx: up[0] - dn[0], pred: onSheet ? sg.value / EPS0 : 0, q: onSheet ? sg.value * b * (x2 <= L && x1 >= -L ? 1 : NaN) : 0, b, full: x2 <= L && x1 >= -L && Math.abs(xc) <= L };
          // profile
          const lim = w * ar; const pts = [[], []]; let lo = Infinity, hi = -Infinity;
          for (let k = 0; k <= 400; k++) { const y = -lim + (2 * lim * k) / 400; if (Math.abs(y) < 1e-6) { pts[0].push(null); pts[1].push(null); } const e = E(xc, y); pts[0].push([y / lim * 3, e[1]]); pts[1].push([y / lim * 3, e[0]]); lo = Math.min(lo, e[0], e[1]); hi = Math.max(hi, e[0], e[1]); }
          const pad = 0.15 * (hi - lo || 1); sp.setView([-3, 3], [lo - pad, hi + pad]);
          sp.vline(0, { color: 'faint', width: 1.2, dash: [3, 3] }); sp.hline(0, { color: 'faint', width: 1 });
          sp.path(pts[0], { color: 'accent', width: 3 }); sp.path(pts[1], { color: 'orange', width: 3 });
          sp.vband(-3 * h / lim, 3 * h / lim, { color: 'green', alpha: 0.1 });
          s.corner(`window ${v.fix(2 * w, w < 0.5 ? 2 : 1)} × ${v.fix(2 * w * ar, w < 0.5 ? 2 : 1)} cm`, 'tl', { size: 11, plate: true });
        });
        v.legend([['accent', '$E_y$ (normal)'], ['orange', '$E_x$ (tangential)'], ['green', 'pillbox and loop']]);
        v.readout(() => `Jump across the sheet at $x_0$: $\\Delta E_\\perp=${v.fix(info.jump, 0)}$ V/cm, $\\sigma/\\varepsilon_0=${v.fix(info.pred, 0)}$ V/cm · $\\Delta E_\\parallel=${v.fix(info.dx, 3)}$ V/cm.\nRectangle: flux $\\oint\\mathbf E\\cdot\\hat{\\mathbf n}\\,ds=${v.fix(info.flux, 1)}$ V·cm ${info.full ? `$= \\sigma b/\\varepsilon_0=${v.fix(info.pred * info.b, 1)}$ V·cm` : '(part of the rectangle lies beyond the end of the sheet, so it encloses less than $\\sigma b$)'} · circulation $\\oint\\mathbf E\\cdot d\\mathbf l=${v.fix(info.circ, 3)}$ V.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Model',
      name: 'Potential of a dipole',
      statement: String.raw`Two charges $\pm q$ a distance $d$ apart, with dipole moment $\mathbf p=q\mathbf d$ pointing from $-q$ to $+q$, have at distances $r\gg d$ the potential
$$V(\mathbf r)\approx\frac{1}{4\pi\varepsilon_0}\frac{\mathbf p\cdot\hat{\mathbf r}}{r^2}=\frac{1}{4\pi\varepsilon_0}\frac{p\cos\theta}{r^2}.$$
It falls off as $1/r^2$, one power faster than the potential of a single charge, because the two monopole terms cancel; the first correction is relatively of order $(d/r)^2$.`,
      idea: String.raw`Write $V=\frac{q}{4\pi\varepsilon_0}\bigl(\tfrac{1}{r_+}-\tfrac1{r_-}\bigr)$ and use the law of cosines, $r_\pm^2=r^2\mp rd\cos\theta+d^2/4$. Expanding $1/r_\pm$ to first order in $d/r$ (the binomial series, pma-8.x) the leading terms cancel and $1/r_+-1/r_-\approx d\cos\theta/r^2$. By superposition (em-2.6) this is the potential of the pair; the field follows from $-\nabla V$ (em-1.11 gives the same field directly).`,
      caption: String.raw`The equipotentials of the exact $\pm q$ pair (red/blue) against those of the ideal dipole $p\cos\theta/r^2$ (green), at fixed dipole moment $p$ while you shrink the separation $d$: they merge at distance and differ only near the charges. Switch to the **error map** for the relative error of the ideal formula. The right panel is a cut along the axis on logarithmic axes: the exact potential has a spike at each charge and then falls like $1/r^2$ (dipole line) rather than $1/r$ (a single charge, dashed). Move the probe to read off the local slope.`,
      scope: String.raw`Far-field approximation, $r\gg d$; the exact pair is shown for comparison. The next terms of the expansion are the quadrupole ($1/r^3$) and higher multipoles.`,
      deps: ['em-2.6', 'em-1.11'],
      refs: ['Griffiths §3.4'],
      tags: ['dipole', 'multipole'],
      viz(v) {
        const P0 = 4; // nC·cm
        const s = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 360, axes: false, weight: 1.2, title: 'equipotentials' });
        const sp = v.stage({ x: [0.3, 30], y: [1, 1e6], xlog: true, ylog: true, height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'distance $r$ along the axis (cm)', ylabel: '$V$ (V)', title: 'potential on the axis, $\\theta=0$' });
        const dS = v.slider('separation $d$ (at fixed $p=qd$)', 0.1, 4, 2.4, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const rS = v.slider('probe distance $r$', 0.3, 30, 6, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const mode = v.select('show', [{ value: 'c', label: 'contours' }, { value: 'e', label: 'relative error map' }], 'c');
        const exact = (x, y, d) => { const q = P0 / d; return pot([{ x: d / 2, y: 0, q }, { x: -d / 2, y: 0, q: -q }], x, y); };
        const ideal = (x, y) => { const r2 = x * x + y * y; return r2 ? (KV * P0 * x) / (r2 * Math.sqrt(r2)) : 0; };
        let info = {};
        v.render(() => {
          const d = dS.value, q = P0 / d;
          if (mode.value === 'c') {
            const lv = levels(150, 12).filter((x) => x);
            s.contour((x, y) => exact(x, y, d), lv.filter((x) => x > 0), { color: 'red', alpha: 0.7, width: 1.1, res: 140 });
            s.contour((x, y) => exact(x, y, d), lv.filter((x) => x < 0), { color: 'blue', alpha: 0.7, width: 1.1, res: 140 });
            s.contour(ideal, lv, { color: 'green', alpha: 0.9, width: 2.2, res: 140 });
          } else {
            s.heat((x, y) => { const e = exact(x, y, d), i = ideal(x, y); return e ? Math.log10(Math.max(1e-6, Math.abs(i - e) / Math.abs(e))) : -6; }, { range: [-4, 0], cmap: 'theme', color: 'red', res: 3, key: 'err' + d });
            s.contour((x, y) => exact(x, y, d), levels(300, 6).filter((x) => x), { color: 'ink', alpha: 0.3, width: 1, res: 100 });
            s.corner('darker = larger relative error (10⁻⁴ … 1)', 'bl', { size: 11, plate: true });
          }
          s.dot(d / 2, 0, { r: 7, color: 'red' }); s.dot(-d / 2, 0, { r: 7, color: 'blue' });
          s.text('+', d / 2, 0, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false }); s.text('−', -d / 2, 0, { align: 'center', size: 11, weight: 700, color: 'panel', halo: false });
          s.arrow(-d / 2, 0, d / 2, 0, { color: 'ink', width: 1.5, head: 6, alpha: 0.7 });
          const r = rS.value; if (r < 4.6) s.dot(r, 0, { r: 5, color: 'gold' });
          // axis cut
          sp.fn((x) => Math.abs(exact(x, 0, d)), { color: 'accent', width: 2.8, n: 800 });
          sp.fn((x) => Math.abs(ideal(x, 0)), { color: 'green', width: 2.2, n: 200 });
          sp.fn((x) => (KV * q) / x, { color: 'muted', width: 1.6, n: 100, alpha: 0.7 });
          sp.vline(r, { color: 'gold', width: 1.4, dash: [4, 3] });
          const ex = exact(r, 0, d), id = ideal(r, 0), h = 1.001;
          const slope = (Math.log(Math.abs(exact(r * h, 0, d))) - Math.log(Math.abs(exact(r / h, 0, d)))) / (Math.log(h) * 2);
          sp.dot(r, Math.abs(ex), { r: 6, color: 'gold' });
          info = { ex, id, slope, rel: (id - ex) / ex, d };
        });
        v.legend([['accent', 'exact pair'], ['green', 'ideal dipole $p\\cos\\theta/r^2$'], ['muted', 'one charge $q/r$']]);
        v.readout(() => `Probe on the axis at $r=${v.fix(rS.value, 2)}$ cm ($r/d=${v.fix(rS.value / info.d, 1)}$): exact $V=${v.fix(info.ex, 1)}$ V, dipole formula $${v.fix(info.id, 1)}$ V — relative error $${v.fix(info.rel * 100, 2)}\\,\\%$ (expected $\\sim(d/r)^2$).\nLocal log–log slope of the exact potential: $${v.fix(info.slope, 2)}$ (a single charge would give $-1$, a dipole $-2$).`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Mean value property of the potential',
      statement: String.raw`If there is no charge inside or on a sphere of radius $R$ (a circle, for a potential independent of $z$), the value of $V$ at its centre is the average of $V$ over the sphere (circle):
$$V(\mathbf c)=\frac1{4\pi R^2}\oint_{|\mathbf r-\mathbf c|=R}V\,da .$$
If charge lies inside, the equality fails by an amount fixed by Gauss’s law; in the plane, for line charges $\lambda_i$ at distances $s_i<R$ from the centre, $\overline V(R)=V(\mathbf c)-\sum_i\dfrac{\lambda_i}{2\pi\varepsilon_0}\ln\dfrac R{s_i}$.`,
      idea: String.raw`Differentiate the average $\overline V(R)$ with respect to $R$: this is the average of the radial derivative $\partial V/\partial r=-E_r$ over the sphere, i.e. $-\frac1{4\pi R^2}\oint\mathbf E\cdot d\mathbf a=-Q_{\text{enc}}/(4\pi\varepsilon_0R^2)$ by Gauss’s law (em-1.14, em-1.15). With no enclosed charge the average does not change with $R$, and as $R\to0$ it tends to $V(\mathbf c)$ (continuity). The same computation in the plane gives the logarithm. It is the mean value property of harmonic functions (rca-11.13, pde-5.3) applied to em-2.8.`,
      caption: String.raw`The picture is the plane case: three **line charges** (drag them), potential $V=-\sum\frac{\lambda_i}{2\pi\varepsilon_0}\ln r_i$. Drag the centre of the circle and its rim to change the radius. The right panel plots the numerical average of $V$ over the circle against its radius $R$ (blue) with the value at the centre (grey): the curve is flat until the circle swallows a charge, then bends exactly as the Gauss-law formula (green, dashed) says. The readout compares the measured average with the prediction.`,
      scope: String.raw`Needs $\nabla^2V=0$ throughout the ball or disc. Shown for line charges (the two-dimensional Coulomb law); the three-dimensional statement for point charges and spheres is identical in form, with the average over the sphere.`,
      deps: ['em-2.8', 'rca-11.13', 'pde-5.3'],
      refs: ['Griffiths §3.1'],
      tags: ['mean value', 'harmonic'],
      viz(v) {
        const K2 = 1e-7 / (TAU * 8.8541878128e-12); // V per (nC/cm) per ln-unit
        const s = v.stage({ x: [-6, 6], y: [-4.5, 4.5], equal: true, height: 360, axes: false, weight: 1.25, title: 'line charges and a circle' });
        const sp = v.stage({ x: [0, 6.5], y: [-1, 1], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'radius $R$ of the circle (cm)', ylabel: 'average of $V$ over the circle (V)', title: 'mean of $V$ against radius' });
        const src = [{ x: -2.8, y: 1.0, q: 2 }, { x: 2.2, y: -1.2, q: -1.5 }, { x: 0.2, y: 2.6, q: 1 }];
        const hs = src.map((c) => s.handle(c.x, c.y, { color: sgnCol(c.q), r: 9, label: `${c.q > 0 ? '+' : '−'}${Math.abs(c.q)} nC/cm`, labelPos: 'ne' }));
        const C = s.handle(-0.4, -0.5, { color: 'gold', r: 7, label: 'centre', labelPos: 'sw' });
        const Rh = s.handle(2.4, -0.5, { color: 'orange', r: 7, label: '$R$', labelPos: 'ne' });
        const V = (x, y) => { let p = 0; for (const c of src) p -= K2 * c.q * Math.log((Math.hypot(x - c.x, y - c.y) + 1e-12) / 6); return p; };
        const mean = (cx, cy, R, n = 360) => { let a = 0; for (let k = 0; k < n; k++) { const t = ((k + 0.5) / n) * TAU; a += V(cx + R * Math.cos(t), cy + R * Math.sin(t)); } return a / n; };
        let info = {};
        v.render(() => {
          src.forEach((c, i) => { c.x = hs[i].x; c.y = hs[i].y; });
          const R = Math.max(0.05, Math.hypot(Rh.x - C.x, Rh.y - C.y));
          heatPot(s, V, 2200, src.map((c) => c.x.toFixed(2) + c.y.toFixed(2)).join(), { res: 3 });
          s.contour(V, levels(500, 10).filter((x) => x), { color: 'ink', alpha: 0.3, width: 1, res: 110 });
          s.circle(C.x, C.y, R, { color: 'gold', width: 2.6 });
          src.forEach((c) => drawCharge(s, c.x, c.y, c.q, 8));
          const Vc = V(C.x, C.y), M0 = mean(C.x, C.y, R);
          let pred = Vc; const inside = [];
          src.forEach((c) => { const sd = Math.hypot(c.x - C.x, c.y - C.y); if (sd < R) { pred -= K2 * c.q * Math.log(R / sd); inside.push(c); } });
          // curve
          const pts = [], pr = []; let lo = Vc, hi = Vc;
          for (let k = 1; k <= 130; k++) { const r = (k / 130) * 6.5, m = mean(C.x, C.y, r, 120); let pp = Vc; src.forEach((c) => { const sd = Math.hypot(c.x - C.x, c.y - C.y); if (sd < r) pp -= K2 * c.q * Math.log(r / sd); }); pts.push([r, m]); pr.push([r, pp]); lo = Math.min(lo, m); hi = Math.max(hi, m); }
          const pad = 0.15 * (hi - lo || 100); sp.setView([0, 6.5], [lo - pad, hi + pad]);
          sp.hline(Vc, { color: 'muted', width: 1.4 });
          sp.path(pr, { color: 'green', width: 2.4, dash: [6, 4] }); sp.path(pts, { color: 'accent', width: 2.8 });
          src.forEach((c) => { const sd = Math.hypot(c.x - C.x, c.y - C.y); if (sd < 6.5) sp.vline(sd, { color: sgnCol(c.q), width: 1.1, dash: [2, 4], alpha: 0.7 }); });
          sp.vline(R, { color: 'gold', width: 1.3, dash: [4, 3] }); sp.dot(R, M0, { r: 6, color: 'accent' });
          info = { R, Vc, M0, pred, n: inside.length };
        });
        v.legend([['accent', 'average of $V$ over the circle'], ['green', '$V(\\mathbf c)-\\sum\\frac{\\lambda_i}{2\\pi\\varepsilon_0}\\ln(R/s_i)$', { dash: true }], ['muted', '$V$ at the centre']]);
        v.readout(() => `Circle of radius $R=${v.fix(info.R, 2)}$ cm contains ${info.n} line charge${info.n === 1 ? '' : 's'}. $V(\\text{centre})=${v.fix(info.Vc, 1)}$ V, average over the circle $=${v.fix(info.M0, 1)}$ V, Gauss-law prediction $${v.fix(info.pred, 1)}$ V.\n${info.n === 0 ? 'Charge-free disc: the average equals the centre value to $' + v.sci(Math.abs(info.M0 - info.Vc) / (Math.abs(info.Vc) + 1), 1) + '$ relative.' : 'The difference ' + v.fix(info.M0 - info.Vc, 1) + ' V is accounted for by the enclosed charge.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.16
    {
      num: '2.16',
      kind: 'Theorem',
      name: 'Earnshaw’s theorem',
      statement: String.raw`A collection of point charges cannot be held in stable static equilibrium by electrostatic forces alone: if a test charge $q$ sits at a point where the field of the other (fixed) charges vanishes, then the potential energy $qV$ has no strict local minimum there — in some direction a small displacement lowers the energy and the charge moves away. More precisely, at an equilibrium point the second derivatives of $V$ satisfy $V_{xx}+V_{yy}+V_{zz}=0$, so they cannot all be positive (or all negative).`,
      idea: String.raw`Away from the other charges $V$ obeys Laplace’s equation (em-2.8) and has the mean value property (em-2.15). A strict minimum of $V$ at a point would make $V$ at the centre smaller than its average over every small sphere around it, contradicting em-2.15; equally the Hessian of $V$ is traceless, so a positive eigenvalue forces a negative one. A positive test charge sits on the potential energy surface $qV$, a negative one on $-qV$, and either way the equilibrium is at best a saddle.`,
      caption: String.raw`A ring of positive charges (drag them; choose how many) encloses a positive test charge, whose equilibrium point the program finds by Newton’s method. Top: $V$ in the plane of the ring has a **minimum** at the equilibrium (the test charge is held in the plane); bottom: $V$ in the vertical plane through it has a **maximum** along $z$, a saddle. The bars give the three curvatures $V_{xx},V_{yy},V_{zz}$ (the last measured by finite differences in $z$): they add up to zero. Set the **tilt** of the small kick out of the plane and release: kicked in the plane the charge oscillates; kicked at any angle out of it, it escapes. Make one charge negative to try to break the theorem — the curvatures still sum to zero.`,
      scope: String.raw`Point charges at fixed positions, electrostatics only: with moving charges, magnetic fields, or conductors that can polarize, stable levitation is possible (diamagnets, Paul traps, quantum mechanics).`,
      deps: ['em-2.15'],
      refs: ['Griffiths §3.1', 'Feynman II ch. 5'],
      tags: ['stability', 'saddle'],
      viz(v) {
        const Rr = 3, QF = 2;
        const sA = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 300, axes: false, weight: 1.15, title: 'top view: $V$ in the plane $z=0$' });
        const sB = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, height: 300, axes: false, weight: 1.15, title: 'side view: $V$ in the vertical plane through the test charge' });
        const sC = v.stage({ x: [0.4, 3.6], y: [-1, 1], height: 300, axes: 'box', gutter: true, weight: 0.8, minWidth: 220, xticks: [[1, 'xx'], [2, 'yy'], [3, 'zz']], ylabel: 'curvature $V_{ii}$ (V/cm²)', title: 'the three curvatures' });
        const nS = v.slider('number of charges in the ring', 3, 8, 6, { int: true });
        const neg = v.toggle('make charge 1 negative', false);
        const tilt = v.slider('kick direction: tilt out of the plane', 0, 90, 60, { step: 5, fmt: (x) => `${x}°` });
        const hs = Array.from({ length: 8 }, (_, k) => sA.handle(Rr * Math.cos((TAU * k) / 6), Rr * Math.sin((TAU * k) / 6) * 0.9, { color: 'red', r: 8 }));
        let ringN = 0;
        const place = () => { const n = nS.value; if (n !== ringN) { ringN = n; hs.forEach((h, k) => { if (k < n) h.set(Rr * Math.cos((TAU * k) / n + 0.3), Rr * Math.sin((TAU * k) / n + 0.3) * 0.9); }); } };
        const srcs = () => hs.slice(0, nS.value).map((h, k) => ({ x: h.x, y: h.y, q: neg.value && k === 0 ? -QF : QF }));
        const findEq = (src) => { // Newton on E = 0 in the plane from the centroid
          let x = src.reduce((a, c) => a + c.x, 0) / src.length, y = src.reduce((a, c) => a + c.y, 0) / src.length;
          for (let it = 0; it < 60; it++) {
            const E = fld(src, x, y), H = hess3(src, x, y, 0), a = -H[0][0], b = -H[0][1], d = -H[1][1], det = a * d - b * b; // E = −∇V ⇒ ∂E/∂x = −H
            if (Math.abs(det) < 1e-12) break; const dx = (d * E[0] - b * E[1]) / det, dy = (-b * E[0] + a * E[1]) / det; x -= dx; y -= dy; if (Math.hypot(dx, dy) < 1e-10) break;
          }
          return [x, y];
        };
        // kick simulation: acceleration = κ E (unit charge-to-mass), velocity Verlet, light damping
        let eq = [0, 0], Hn = null, kappa = 1, simKey = '';
        const sim = v.sim(() => ({ p: [0.03 * Math.cos((tilt.value * Math.PI) / 180) * Math.cos(0.4), 0.03 * Math.cos((tilt.value * Math.PI) / 180) * Math.sin(0.4), 0.03 * Math.sin((tilt.value * Math.PI) / 180)], vel: [0, 0, 0], tr: [] }), (S, dt) => {
          const src = srcs(), acc = (p) => { let ux = 0, uy = 0, uz = 0; for (const c of src) { const dx = eq[0] + p[0] - c.x, dy = eq[1] + p[1] - c.y, dz = p[2], r3 = Math.pow(dx * dx + dy * dy + dz * dz, 1.5); ux += (KV * c.q * dx) / r3; uy += (KV * c.q * dy) / r3; uz += (KV * c.q * dz) / r3; } return [kappa * ux, kappa * uy, kappa * uz]; };
          if (Math.hypot(...S.p) > 3.2) return;
          const a0 = acc(S.p); for (let c = 0; c < 3; c++) S.p[c] += S.vel[c] * dt + 0.5 * a0[c] * dt * dt;
          const a1 = acc(S.p); for (let c = 0; c < 3; c++) S.vel[c] += 0.5 * (a0[c] + a1[c]) * dt; S.tr.push([...S.p]);
        }, { dt: 0.01, maxSteps: 4000 });
        let info = {};
        v.animate((t) => {
          place();
          const src = srcs(), k0 = src.map((c) => c.x.toFixed(2) + c.y.toFixed(2) + c.q).join();
          eq = findEq(src); Hn = hess3(src, eq[0], eq[1], 0);
          const eg = eig2(Hn[0][0], Hn[0][1], Hn[1][1]);
          const lmax = Math.max(Math.abs(Hn[0][0]), Math.abs(Hn[1][1]), Math.abs(Hn[2][2]), 1e-6); kappa = 12 / lmax;
          const key = k0 + '|' + tilt.value; if (key !== simKey) { simKey = key; sim.reset(); }
          sim.advance(t);
          const S = sim.state;
          hs.forEach((h, k) => { h.visible = k < nS.value; h.color = sgnCol(src[k]?.q ?? 1); });
          // top view
          const Veq = pot(src, eq[0], eq[1]), sc = Math.max(60, 0.12 * Math.abs(Veq)), st = sc / 3;
          heatPot(sA, (x, y) => pot(src, x, y) - Veq, sc, 'a' + k0, { res: 3 });
          sA.contour((x, y) => pot(src, x, y) - Veq, levels(st, 12).filter((x) => x), { color: 'ink', alpha: 0.28, width: 1, res: 100 });
          sA.contour((x, y) => pot(src, x, y) - Veq, [0], { color: 'gold', width: 1.5, res: 100 });
          src.forEach((c) => drawCharge(sA, c.x, c.y, c.q, 8));
          sA.dot(eq[0], eq[1], { r: 4, hollow: true, color: 'gold' });
          // side view (x–z plane through the equilibrium point; view is centred on it)
          const x0 = eq[0], y0 = eq[1];
          heatPot(sB, (x, z) => pot(src, x0 + x * 0.4, y0, z * 0.4) - Veq, sc * 0.35, 'b' + k0, { res: 3 });
          sB.contour((x, z) => pot(src, x0 + x * 0.4, y0, z * 0.4) - Veq, levels(st * 0.35, 12).filter((x) => x), { color: 'ink', alpha: 0.3, width: 1, res: 100 });
          sB.contour((x, z) => pot(src, x0 + x * 0.4, y0, z * 0.4) - Veq, [0], { color: 'gold', width: 1.5, res: 100 });
          sB.dot(0, 0, { r: 5, hollow: true, color: 'gold' });
          sB.corner('window: ±2 cm, $x$ horizontal, $z$ vertical', 'bl', { size: 11, plate: true });
          // kick path (magnified view: positions in cm)
          const tr = S.tr; const ms = 1 / 0.4;
          if (tr.length > 1) { sA.path(tr.map((p) => [eq[0] + p[0], eq[1] + p[1]]), { color: 'gold', width: 2.2 }); sB.path(tr.map((p) => [p[0] * ms, p[2] * ms]), { color: 'gold', width: 2.2 }); }
          const pnow = S.p; sA.dot(eq[0] + pnow[0], eq[1] + pnow[1], { r: 5, color: 'gold' }); sB.dot(pnow[0] * ms, pnow[2] * ms, { r: 6, color: 'gold' });
          // curvature bars
          const hz = 0.05, Vzz = (pot(src, eq[0], eq[1], hz) + pot(src, eq[0], eq[1], -hz) - 2 * pot(src, eq[0], eq[1], 0)) / (hz * hz);
          const ev = [eg.l1, eg.l2, Vzz]; const m = Math.max(...ev.map(Math.abs), 1); sC.setView([0.4, 3.6], [-1.3 * m, 1.3 * m]);
          sC.hline(0, { color: 'faint', width: 1 });
          ev.forEach((e, i) => { sC.rect(i + 1 - 0.3, Math.min(0, e), i + 1 + 0.3, Math.max(0, e), { fill: e > 0 ? 'blue' : 'red', fillAlpha: 0.5, color: e > 0 ? 'blue' : 'red', width: 1.5 }); sC.text(v.fix(e, 1), i + 1, e > 0 ? e + 0.1 * m : e - 0.1 * m, { align: 'center', size: 11, color: 'ink' }); });
          info = {  l1: eg.l1, l2: eg.l2, Vzz, trace: Hn[0][0] + Hn[1][1] + Vzz, out: Math.hypot(...S.p), E: Math.hypot(...fld(src, eq[0], eq[1])) };
        }, { still: 7 });
        v.readout(() => `Equilibrium at $|\\mathbf E|=${v.sci(info.E, 1)}$ V/cm. Curvatures of $V$ there: in the plane $${v.fix(info.l1, 2)}$, $${v.fix(info.l2, 2)}$; along $z$ (finite differences) $${v.fix(info.Vzz, 2)}$ V/cm². Sum $=${v.fix(info.trace, 4)}$ — Laplace’s equation.\nA positive ${info.l1 > 0 && info.l2 > 0 ? 'test charge is held in the plane but pushed out along $z$' : 'saddle in the plane itself'}: kicked ${v.fix(info.out, 1)} cm from the equilibrium so far${info.out > 3 ? ' — it has escaped.' : '.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.17
    {
      num: '2.17',
      kind: 'Phenomenon',
      name: 'Paul trap: dynamic stabilization',
      statement: String.raw`A static saddle potential cannot trap a charge (em-2.16), but one that is **rocked** can. In an oscillating quadrupole potential $\Phi=\dfrac{V_1\cos\Omega t}{2r_0^2}(x^2-y^2)$ a charge $e$ of mass $m$ obeys $\ddot x=-\kappa\cos(\Omega t)\,x$, $\ddot y=+\kappa\cos(\Omega t)\,y$ with $\kappa=eV_1/mr_0^2$. In Mathieu form, with $\tau=\Omega t/2$ and $q=2\kappa/\Omega^2$, $x''+(-2q\cos2\tau)x=0$, the motion is bounded (trapped) for $q<0.908$, i.e. above the critical frequency $\Omega_c=\sqrt{2\kappa/0.908}$, and grows exponentially below it. Paul and Steinwedel realized the idea in 1953; the trapped ion jiggles at the drive frequency (micromotion) on top of a slow secular oscillation.`,
      idea: String.raw`On average the rocking field is a force toward the axis: the ion’s fast jiggle $\xi\approx(\kappa/\Omega^2)\cos(\Omega t)\,x$ puts it, on average, in a region where the field of the cycle is a little stronger on the restoring side, giving an effective harmonic potential of strength $\kappa^2/2\Omega^2$ (the ponderomotive pseudopotential). It is a stable solution of Hill’s equation with periodic coefficients, whose stability follows from the monodromy matrix (Floquet theory, mech-4.18): the trace of the one-period propagator must lie in $(-2,2)$. Beyond $q=0.908$ the drive is too slow, the ion has time to be thrown away within a single half-cycle.`,
      caption: String.raw`Left: the saddle potential rocks (red up, blue down along $x$; the ions feel the opposite along $y$) and an ion released at the gold handle, with a small initial velocity, moves under $\ddot x=-\kappa\cos\Omega t\,x$, $\ddot y=\kappa\cos\Omega t\,y$ — trapped above the critical frequency, thrown out below it. Right: the survival survey. Each dot is the fraction of 24 simulated ions (random starting positions and velocities) still inside the trap after 120 time units, at each drive frequency; the green band is where the exact Floquet analysis says the motion is bounded, and the dashed line is $\Omega_c$. Slide $\Omega$ across the line.`,
      scope: String.raw`Ideal linear quadrupole trap, no static voltage ($a=0$), no damping, no Coulomb interaction between ions, $\kappa=1$ in the chosen units; real traps add a static voltage (shifting the stability region in the $(a,q)$ plane) and use buffer gas cooling.`,
      credit: 'W. Paul and H. Steinwedel, 1953',
      deps: ['em-2.16', 'mech-4.18'],
      refs: ['Feynman II ch. 29'],
      tags: ['trap', 'floquet'],
      viz(v) {
        const KAPPA = 1, WALL = 3, TMAX = 120;
        const s = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, height: 340, axes: false, weight: 1.05, title: 'the rocking saddle and the ion (top view)' });
        const sp = v.stage({ x: [0.6, 4], y: [0, 1.1], xlog: true, height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'drive frequency $\\Omega$', ylabel: 'fraction still trapped at $t=120$', title: 'stability by repeated runs', xticks: [[0.6, '0.6'], [1, '1'], [1.5, '1.5'], [2, '2'], [3, '3'], [4, '4']] });
        const om = v.slider('drive frequency $\\Omega$', 0.7, 3.8, 0.9, { log: true, fmt: (x) => `${x.toPrecision(3)}` });
        const H = s.handle(0.5, 0.35, { color: 'gold', r: 8, label: 'start', labelPos: 'ne' });
        // Floquet: monodromy trace of x'' = −κ cos(Ωt) x over one period
        const trace = (W) => {
          const T = TAU / W, n = 600, dt = T / n; let a = [1, 0], b = [0, 1]; // columns (x, v) for initial (1,0) and (0,1)
          const f = (t, y) => [y[1], -KAPPA * Math.cos(W * t) * y[0]];
          const step = (y, t) => { const k1 = f(t, y), k2 = f(t + dt / 2, [y[0] + (dt / 2) * k1[0], y[1] + (dt / 2) * k1[1]]), k3 = f(t + dt / 2, [y[0] + (dt / 2) * k2[0], y[1] + (dt / 2) * k2[1]]), k4 = f(t + dt, [y[0] + dt * k3[0], y[1] + dt * k3[1]]); return [y[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; };
          for (let k = 0; k < n; k++) { a = step(a, k * dt); b = step(b, k * dt); }
          return a[0] + b[1];
        };
        const grid = []; for (let k = 0; k <= 160; k++) grid.push(Math.exp(Math.log(0.6) + (Math.log(4) - Math.log(0.6)) * (k / 160)));
        const stable = grid.map((W) => Math.abs(trace(W)) < 2);
        const Oc = Math.sqrt((2 * KAPPA) / 0.908);
        // survey: 24 ions per frequency, velocity Verlet on x'' = −κ cos Ωt x
        const survey = []; {
          const r = v.rng(11), ions = Array.from({ length: 24 }, () => [r.uniform(-0.5, 0.5), r.uniform(-0.3, 0.3)]);
          for (let k = 0; k <= 56; k++) {
            const W = Math.exp(Math.log(0.6) + (Math.log(4) - Math.log(0.6)) * (k / 56)), dt = TAU / W / 40; let alive = 0;
            for (const [x0, v0] of ions) {
              let x = x0, vx = v0, t = 0, ok = true; const nn = Math.ceil(TMAX / dt);
              for (let i = 0; i < nn && ok; i++) { const a0 = -KAPPA * Math.cos(W * t) * x; x += vx * dt + 0.5 * a0 * dt * dt; t += dt; const a1 = -KAPPA * Math.cos(W * t) * x; vx += 0.5 * (a0 + a1) * dt; if (Math.abs(x) > WALL) ok = false; }
              if (ok) alive++;
            }
            survey.push([W, alive / ions.length]);
          }
        }
        const sim = v.sim(() => ({ x: H.x, y: H.y, vx: 0.1, vy: -0.08, t: 0, tr: [[H.x, H.y]], lost: false }), (S, dt) => {
          if (S.lost) return; const W = om.value;
          const ax = (t, x) => -KAPPA * Math.cos(W * t) * x, ay = (t, y) => KAPPA * Math.cos(W * t) * y;
          const a0x = ax(S.t, S.x), a0y = ay(S.t, S.y);
          S.x += S.vx * dt + 0.5 * a0x * dt * dt; S.y += S.vy * dt + 0.5 * a0y * dt * dt; S.t += dt;
          S.vx += 0.5 * (a0x + ax(S.t, S.x)) * dt; S.vy += 0.5 * (a0y + ay(S.t, S.y)) * dt;
          S.tr.push([S.x, S.y]); if (S.tr.length > 900) S.tr.shift();
          if (Math.hypot(S.x, S.y) > WALL + 0.6) S.lost = true;
        }, { dt: 0.01, maxSteps: 6000 });
        let key = '', st = null;
        v.animate((t) => {
          const k = om.value + '|' + H.x.toFixed(2) + H.y.toFixed(2); if (k !== key) { key = k; sim.reset(); }
          sim.advance(t); st = sim.state;
          const W = om.value, ph = Math.cos(W * st.t);
          s.heat((x, y) => ph * (x * x - y * y) * 0.5, { range: [-1.2, 1.2], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 4 });
          s.circle(0, 0, WALL, { color: 'ink', width: 1.5, dash: [5, 4] });
          s.corner(`$\\cos\\Omega t=${v.fix(ph, 2)}$`, 'tl', { size: 12, plate: true });
          if (st.tr.length > 1) s.path(st.tr, { color: 'gold', width: 2 });
          s.dot(st.x, st.y, { r: 6, color: st.lost ? 'red' : 'gold' });
          // survey
          for (let i = 0; i < grid.length - 1; i++) if (stable[i]) sp.rect(grid[i], 0, grid[i + 1], 1.1, { fill: 'green', fillAlpha: 0.14, stroke: false });
          sp.vline(Oc, { color: 'green', width: 1.6, dash: [6, 4] });
          sp.vline(W, { color: 'gold', width: 1.6 });
          for (const [w, f] of survey) sp.dot(w, f, { r: 4, color: 'accent' });
        }, { still: 14 });
        v.legend([['accent', 'simulated survivors', { dot: true }], ['green', 'bounded by Floquet analysis', { area: true }], ['green', '$\\Omega_c=\\sqrt{2\\kappa/0.908}$', { dash: true }]]);
        v.readout(() => { const W = om.value, q = (2 * KAPPA) / (W * W), tr = trace(W); return `$q=2\\kappa/\\Omega^2=${v.fix(q, 3)}$ ($q_{\\max}=0.908$, $\\Omega_c=${v.fix(Oc, 3)}$) · monodromy trace $${v.fix(tr, 3)}$ — ${Math.abs(tr) < 2 ? 'inside $(-2,2)$: stable' : 'outside $(-2,2)$: unstable'}.\nThe ion ${st.lost ? 'has been thrown out of the trap' : 'is trapped so far'} (distance ${v.fix(Math.hypot(st.x, st.y), 2)} of ${WALL}).`; });
      },
    },
  ],
};
