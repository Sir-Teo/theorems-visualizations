// Vector Calculus — Chapter 4: Multiple integrals
// Part 2 (4.7–4.11): polar/cylindrical/spherical integrals, the Gaussian integral, mass and moments, Pappus, Lebesgue's 1902 memoir.
import {
  tn, tf, simpson, polyArea, polyCentroid, inPoly, logInts, patch, add3, mul3, DEG, TAU,
} from './ch04.shared.js';

const PI = Math.PI;

export default {
  collection: 'vcalc',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Method',
      name: 'Polar, cylindrical and spherical integrals',
      statement: String.raw`By the change of variables formula (4.6), with the Jacobians computed in 1.6:
- **Polar:** $x=r\cos\theta,\ y=r\sin\theta$, $dA=r\,dr\,d\theta$.
- **Cylindrical:** $(x,y,z)=(r\cos\theta,r\sin\theta,z)$, $dV=r\,dr\,d\theta\,dz$.
- **Spherical:** $(x,y,z)=(\rho\sin\varphi\cos\theta,\ \rho\sin\varphi\sin\theta,\ \rho\cos\varphi)$ with $\varphi\in[0,\pi]$ the polar angle from the $z$-axis, $dV=\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta$.

Choose the system in which the region's description is simplest. For the unit ball $B$ all three give $\operatorname{vol}B=\tfrac{4\pi}{3}$, and $\iiint_B(x^2+y^2)\,dV=\tfrac{8\pi}{15}$.`,
      idea: String.raw`Each coordinate system is a $C^1$ map from a box of parameters, one-to-one off a set of zero volume (the axis, the pole), and 4.6 applies with $|\det|=r$ or $\rho^2\sin\varphi$: the cells of a coordinate grid are curved boxes whose size is the product of side lengths $dr$, $r\,d\theta$, $dz$ (or $d\rho$, $\rho\,d\varphi$, $\rho\sin\varphi\,d\theta$). In coordinates adapted to the ball the limits are constants, so the integral is a product of three one-variable integrals; in Cartesian coordinates the curved boundary has to be approximated by cubes, which converges slowly.`,
      caption: String.raw`Left: a slice (the $xz$-plane) of the unit ball cut into cells by the chosen coordinates, with $N$ cells per variable; orange cells are the ones used in the midpoint sum. Right: the relative error of the midpoint sum for the volume (or the second integral) against $N$ on log axes, for all three systems. Cartesian cubes (counted by their centres) converge erratically at about the rate $1/N$; the adapted systems converge like $1/N^2$. For these integrands nothing depends on $\theta$, so the $\theta$-sum is done exactly ($2\pi$) and each adapted system uses $N^2$ cells.`,
      deps: ['vcalc-4.6', 'vcalc-1.6'],
      refs: ['Marsden–Tromba §6.2', 'Schey ch. II'],
      tags: ['polar', 'cylindrical', 'spherical'],
      viz(v) {
        const sel = v.select('picture', [{ value: 'cart', label: 'Cartesian cubes' }, { value: 'cyl', label: 'cylindrical' }, { value: 'sph', label: 'spherical' }], 'sph');
        const what = v.select('integral', [{ value: 'vol', label: 'volume $\\iiint dV$' }, { value: 'inertia', label: '$\\iiint (x^2+y^2)\\,dV$' }], 'vol');
        const nS = v.slider('cells per variable $N$', 2, 64, 8, { int: true });
        const S = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'x', ylabel: 'z', title: 'cells in the $xz$ slice of the ball' });
        const E = v.stage({ x: [2, 64], y: [1e-6, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 260, xlabel: 'N', title: 'relative error of the midpoint sum' });
        const exact = (w) => (w === 'vol' ? (4 * PI) / 3 : (8 * PI) / 15);
        // integrand g(x,y,z) = 1 or x^2+y^2
        const sum = (m, w, N) => {
          let s = 0;
          if (m === 'cart') {
            const h = 2 / N;
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
              const x = -1 + (i + 0.5) * h, y = -1 + (j + 0.5) * h, z = -1 + (k + 0.5) * h;
              if (x * x + y * y + z * z <= 1) s += (w === 'vol' ? 1 : x * x + y * y) * h * h * h;
            }
            return s;
          }
          if (m === 'cyl') {
            const dr = 1 / N;
            for (let i = 0; i < N; i++) {
              const r = (i + 0.5) * dr, hz = Math.sqrt(1 - r * r);
              // z midpoint cells on [-hz, hz]: the integrand does not depend on z (for 1 and r^2), so the sum over N cells is exact
              s += (w === 'vol' ? 1 : r * r) * 2 * hz * r * dr * TAU;
            }
            return s;
          }
          const dr = 1 / N, dp = PI / N;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const rho = (i + 0.5) * dr, ph = (j + 0.5) * dp, sp = Math.sin(ph);
            s += (w === 'vol' ? 1 : rho * rho * sp * sp) * rho * rho * sp * dr * dp * TAU;
          }
          return s;
        };
        const cache = {};
        const curve = (m, w) => {
          const k = m + w;
          return cache[k] || (cache[k] = logInts(64, 22).filter((n) => n >= 2).map((n) => [n, Math.abs(sum(m, w, n) - exact(w)) / exact(w)]));
        };
        let info = {};
        v.render(() => {
          const N = nS.value, m = sel.value, w = what.value;
          const lim = N > 24;
          if (m === 'cart') {
            const h = 2 / N;
            for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
              const x = -1 + (i + 0.5) * h, z = -1 + (k + 0.5) * h;
              if (x * x + z * z <= 1) S.rect(-1 + i * h, -1 + k * h, -1 + (i + 1) * h, -1 + (k + 1) * h, { fill: 'orange', fillAlpha: 0.3, stroke: !lim, color: 'orange', width: 1 });
            }
          } else if (m === 'cyl') {
            for (let i = 0; i < N; i++) for (const sgn of [1, -1]) {
              const r0 = i / N, r1 = (i + 1) / N, rm = (r0 + r1) / 2, hz = Math.sqrt(1 - rm * rm);
              S.rect(sgn * Math.min(r0, r1), -hz, sgn * Math.max(r0, r1), hz, { fill: 'orange', fillAlpha: 0.3, stroke: !lim, color: 'orange', width: 1 });
              if (!lim) for (let k = 1; k < N; k++) S.line(sgn * r0, -hz + (2 * hz * k) / N, sgn * r1, -hz + (2 * hz * k) / N, { color: 'orange', alpha: 0.5, width: 0.7 });
            }
          } else {
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
              const r0 = i / N, r1 = (i + 1) / N, p0 = (j * PI) / N, p1 = ((j + 1) * PI) / N, q = 6;
              for (const sgn of [1, -1]) {
                const cell = [];
                for (let t = 0; t <= q; t++) cell.push([sgn * r1 * Math.sin(p0 + ((p1 - p0) * t) / q), r1 * Math.cos(p0 + ((p1 - p0) * t) / q)]);
                for (let t = q; t >= 0; t--) cell.push([sgn * r0 * Math.sin(p0 + ((p1 - p0) * t) / q), r0 * Math.cos(p0 + ((p1 - p0) * t) / q)]);
                S.poly(cell, { fill: 'orange', fillAlpha: 0.3, stroke: !lim, color: 'orange', width: 1 });
              }
            }
          }
          S.circle(0, 0, 1, { color: 'ink', width: 1.8, fill: false });
          for (const [mm, col] of [['cart', 'red'], ['cyl', 'blue'], ['sph', 'green']]) {
            E.path(curve(mm, w).map(([n, e]) => [n, Math.max(e, 1e-7)]), { color: col, width: mm === m ? 3 : 1.4, alpha: mm === m ? 1 : 0.55 });
          }
          const guide = (p, c) => E.path([[2, c * 2 ** -p], [64, c * 64 ** -p]], { color: 'muted', dash: true, width: 1 });
          guide(1, 0.9); guide(2, 0.9);
          E.text('$1/N$', 40, 0.9 / 40 * 1.5, { color: 'muted', size: 12 }); E.text('$1/N^2$', 40, 0.9 / 1600 * 0.4, { color: 'muted', size: 12 });
          info = { s: sum(m, w, N), ex: exact(w), N, m };
        });
        v.legend([['red', 'Cartesian'], ['blue', 'cylindrical'], ['green', 'spherical']]);
        v.readout(() => `${info.m === 'cart' ? 'Cartesian' : info.m === 'cyl' ? 'cylindrical' : 'spherical'}, $N=${info.N}$: sum $=${tf(info.s, 5)}$ ; exact $=${tf(info.ex, 5)}$ ; relative error $=${v.sci(Math.abs(info.s - info.ex) / info.ex, 2)}$`);
      },
    },

    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Gaussian integral via polar coordinates',
      statement: String.raw`$$\int_{-\infty}^{\infty}e^{-x^2}\,dx=\sqrt\pi.$$
Equivalently, $\iint_{\R^2}e^{-(x^2+y^2)}\,dA=\pi$. Writing $I=\int_{-\infty}^\infty e^{-x^2}dx$ (finite, since $e^{-x^2}\le e^{1/4-|x|}$), Fubini gives $I^2=\iint_{\R^2}e^{-x^2-y^2}\,dA$ and polar coordinates evaluate the right-hand side as $\int_0^{2\pi}\!\int_0^\infty e^{-r^2}r\,dr\,d\theta=\pi$.`,
      idea: String.raw`The one-variable integral has no elementary antiderivative, but its square is a two-variable integral of the rotation-invariant function $e^{-r^2}$, which polar coordinates (4.7) make elementary because the Jacobian $r$ supplies exactly the factor needed: $\int_0^R e^{-r^2}r\,dr=\tfrac12(1-e^{-R^2})$. Improper integrals are handled by exhaustion: the integrand is positive, so the integral over the square $[-R,R]^2$ (a product, equal to $(\int_{-R}^Re^{-x^2}dx)^2$ by 4.2) is squeezed between the integrals over the discs of radius $R$ and $\sqrt2R$ (which contain/are contained in it), and both disc integrals tend to $\pi$.`,
      caption: String.raw`Drag $R$. Left: the surface $e^{-(x^2+y^2)}$ as a colour map, with the disc of radius $R$ (blue) and the square of half-side $R$ (orange). Right: the two integrals as functions of $R$. The square's value (orange) always lies between the disc of radius $R$ (blue) and the disc of radius $\sqrt2R$ (blue, dashed); both discs climb to $\pi$, so the square does as well, and $\sqrt{\text{square}}=\int_{-R}^Re^{-x^2}dx\to\sqrt\pi$. All values are computed by numerical integration (Simpson), not from the closed forms.`,
      deps: ['vcalc-4.7', 'vcalc-4.2'],
      refs: ['Marsden–Tromba §6.4'],
      credit: 'The value $\\sqrt\\pi$ goes back to Laplace and de Moivre’s era (18th century); the squaring-and-polar-coordinates evaluation is usually attributed to Poisson',
      verify: true,
      tags: ['Gaussian', 'polar coordinates', 'improper integral'],
      viz(v) {
        const R = v.slider('radius $R$', 0.1, 3.2, 1.0, { step: 0.01 });
        const S = v.stage({ x: [-3.3, 3.3], y: [-3.3, 3.3], equal: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'x', ylabel: 'y', title: '$e^{-(x^2+y^2)}$ with the disc and the square' });
        const G = v.stage({ x: [0, 3.2], y: [0, 3.6], axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 260, xlabel: 'R', title: 'integral over the disc and over the square' });
        const disc = (r) => TAU * simpson((t) => t * Math.exp(-t * t), 0, r, 200);
        const sqr = (r) => simpson((t) => Math.exp(-t * t), -r, r, 200) ** 2;
        const curves = (() => {
          const rs = Array.from({ length: 161 }, (_, i) => (3.2 * i) / 160);
          return { rs, d: rs.map(disc), d2: rs.map((r) => disc(Math.SQRT2 * r)), q: rs.map(sqr) };
        })();
        let info = {};
        v.render(() => {
          const r = R.value;
          S.heat((x, y) => Math.exp(-(x * x + y * y)), { range: [0, 1], cmap: 'theme', color: 'accent', res: 3, key: 'g' });
          S.circle(0, 0, r, { color: 'blue', width: 2.5, fill: false });
          S.rect(-r, -r, r, r, { color: 'orange', width: 2.5, fill: false });
          G.hline(PI, { color: 'green', width: 2 });
          G.path(curves.rs.map((x, i) => [x, curves.d[i]]), { color: 'blue', width: 2 });
          G.path(curves.rs.map((x, i) => [x, curves.d2[i]]), { color: 'blue', width: 1.5, dash: true });
          G.path(curves.rs.map((x, i) => [x, curves.q[i]]), { color: 'orange', width: 2.5 });
          G.vline(r, { color: 'gold', width: 1.2, dash: true });
          G.dot(r, disc(r), { color: 'blue', r: 4 }); G.dot(r, sqr(r), { color: 'orange', r: 5 }); G.dot(r, disc(Math.SQRT2 * r), { color: 'blue', r: 4, hollow: true });
          G.text('$\\pi$', 0.08, PI + 0.12, { color: 'green', size: 14 });
          info = { d: disc(r), q: sqr(r), d2: disc(Math.SQRT2 * r), line: simpson((t) => Math.exp(-t * t), -r, r, 200) };
        });
        v.legend([['blue', 'disc of radius $R$'], ['blue', 'disc of radius $\\sqrt2R$', { dash: true }], ['orange', 'square $[-R,R]^2$'], ['green', '$\\pi$']]);
        v.readout(() => `disc $=${tf(info.d, 5)}\\ \\le$ square $=${tf(info.q, 5)}\\ \\le$ disc$(\\sqrt2R)=${tf(info.d2, 5)}$ ; $\\pi=${tf(PI, 5)}$\n$\\int_{-R}^{R}e^{-x^2}dx=${tf(info.line, 5)}$ ; $\\sqrt\\pi=${tf(Math.sqrt(PI), 5)}$`);
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Mass, centre of mass and moments of inertia',
      statement: String.raw`A lamina occupying a region $D\subset\R^2$ with continuous mass density $\rho(x,y)\ge0$ has
- **mass** $M=\iint_D\rho\,dA$;
- **centre of mass** $(\bar x,\bar y)=\frac1M\bigl(\iint_D x\rho\,dA,\ \iint_D y\rho\,dA\bigr)$;
- **moment of inertia** about the axis $\ell$: $I_\ell=\iint_D \operatorname{dist}(p,\ell)^2\,\rho\,dA$ (for a line through a point $q$ with direction $(\cos\alpha,\sin\alpha)$ this is $\iint[(x-q_x)\sin\alpha-(y-q_y)\cos\alpha]^2\rho\,dA$).

Properties: the total torque of gravity about the centre of mass is zero (the lamina balances on a pin there), and for parallel axes $I_\ell=I_{\ell,\mathrm{cm}}+M\,d^2$ where $d$ is the distance between the axis $\ell$ and the parallel axis through the centre of mass (the **parallel-axis theorem**). The same definitions hold in $\R^3$ with $\iiint$.`,
      idea: String.raw`These are Riemann integrals (4.1) of the density weighted by $1$, by position and by squared distance, the continuum versions of $\sum m_i$, $\sum m_i\mathbf x_i/M$ and $\sum m_i r_i^2$. Because $\iint(\mathbf x-\bar{\mathbf x})\rho\,dA=0$ by definition of $\bar{\mathbf x}$, expanding $|\mathbf x-\mathbf q|^2=|\mathbf x-\bar{\mathbf x}|^2+2(\mathbf x-\bar{\mathbf x})\cdot(\bar{\mathbf x}-\mathbf q)+|\bar{\mathbf x}-\mathbf q|^2$ kills the cross term and gives the parallel-axis theorem (for the perpendicular distance to an axis this is the same computation in the direction normal to the axis). Torque about a pin at $q$ is $\iint (x-q_x)\rho\,g\,dA=Mg(\bar x-q_x)$.`,
      caption: String.raw`Choose a shape and a density (brightness is density). The green dot is the computed centre of mass; drag the gold pin anywhere. The dashed plumb line hangs from the pin: the lamina is balanced when it passes through the green dot (torque readout $0$). Turn the axis with the angle slider (axis through the pin, drawn in orange): the right panel plots the moment of inertia against the axis angle, once for axes through the pin (orange) and once for the parallel axes through the centre of mass (blue); their difference is $Md_\perp^2$ (parallel-axis theorem). All integrals are midpoint sums on a $160\times160$ grid.`,
      deps: ['vcalc-4.2'],
      refs: ['Marsden–Tromba §6.3'],
      tags: ['centre of mass', 'moment of inertia', 'density'],
      viz(v) {
        const SH = {
          disc: { label: 'disc', inD: (x, y) => x * x + y * y < 1 },
          L: { label: 'L-shape', inD: (x, y) => (x > -1 && x < 0.6 && y > -1 && y < -0.35) || (x > -1 && x < -0.35 && y > -1 && y < 1.1) },
          tri: { label: 'triangle', inD: (x, y) => inPoly([[-1, -0.8], [1.2, -0.8], [-0.2, 1.1]], x, y) },
        };
        const DN = {
          unif: { label: 'uniform', rho: () => 1 },
          ramp: { label: 'heavier to the right', rho: (x) => 0.35 + 0.65 * (x + 1) },
          blob: { label: 'dense blob', rho: (x, y) => 0.35 + 2.2 * Math.exp(-5 * ((x - 0.35) ** 2 + (y + 0.25) ** 2)) },
        };
        const shape = v.select('shape', Object.entries(SH).map(([k, o]) => ({ value: k, label: o.label })), 'L');
        const dens = v.select('density', Object.entries(DN).map(([k, o]) => ({ value: k, label: o.label })), 'unif');
        const ang = v.slider('axis angle $\\alpha$', 0, 180, 30, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const S = v.stage({ x: [-1.7, 1.7], y: [-1.4, 1.4], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.15, minWidth: 260, xlabel: 'x', ylabel: 'y', title: 'lamina, pin and axis' });
        const G = v.stage({ x: [0, 180], y: [0, 1], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'axis angle α (degrees)', title: 'moment of inertia $I(\\alpha)$' });
        const P = S.handle(0.45, 0.8, { color: 'gold', label: 'pin', constrain: { x: [-1.6, 1.6], y: [-1.3, 1.3] } });
        const cache = {};
        const grid = (sk, dk) => {
          const k = sk + dk;
          if (cache[k]) return cache[k];
          const N = 160, h = 3.4 / N, cells = [];
          let M = 0, Mx = 0, My = 0;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const x = -1.7 + (i + 0.5) * h, y = -1.4 + (j + 0.5) * (2.8 / N);
            if (SH[sk].inD(x, y)) { const m = DN[dk].rho(x, y) * h * (2.8 / N); cells.push([x, y, m]); M += m; Mx += m * x; My += m * y; }
          }
          return (cache[k] = { cells, M, cm: [Mx / M, My / M] });
        };
        const tensor = (cells, q) => {
          let a = 0, b = 0, c = 0;
          for (const [x, y, m] of cells) { const dx = x - q[0], dy = y - q[1]; a += m * dy * dy; b += m * dx * dx; c += m * dx * dy; }
          return { a, b, c };
        };
        const Ia = (T, al) => T.a * Math.cos(al) ** 2 + T.b * Math.sin(al) ** 2 - 2 * T.c * Math.sin(al) * Math.cos(al);
        let info = {};
        v.render(() => {
          const T = grid(shape.value, dens.value), C = SH[shape.value], D = DN[dens.value];
          const al = ang.value * DEG;
          const rmax = D.rho(0.35, -0.25);
          S.heat((x, y) => (C.inD(x, y) ? D.rho(x, y) : NaN), { range: [0, Math.max(1.2, rmax, 1.3)], cmap: 'theme', color: 'accent', res: 2, key: shape.value + dens.value });
          const q = [P.x, P.y], cm = T.cm;
          const L = 3;
          S.segment([q[0] - L * Math.cos(al), q[1] - L * Math.sin(al)], [q[0] + L * Math.cos(al), q[1] + L * Math.sin(al)], { color: 'orange', width: 2.5 });
          S.segment([cm[0] - L * Math.cos(al), cm[1] - L * Math.sin(al)], [cm[0] + L * Math.cos(al), cm[1] + L * Math.sin(al)], { color: 'blue', width: 1.5, dash: true });
          S.segment([q[0], q[1]], [q[0], q[1] - 3], { color: 'ink', dash: true, width: 1.5, alpha: 0.7 });
          S.dot(cm[0], cm[1], { color: 'green', r: 7, label: 'centre of mass', labelPos: 'ne' });
          const Tp = tensor(T.cells, q), Tc = tensor(T.cells, cm);
          const aa = Array.from({ length: 91 }, (_, i) => i * 2);
          const Ip = aa.map((d) => Ia(Tp, d * DEG)), Ic = aa.map((d) => Ia(Tc, d * DEG));
          const top = Math.max(...Ip, ...Ic) * 1.15;
          G.setView([0, 180], [0, top]);
          G.path(aa.map((d, i) => [d, Ip[i]]), { color: 'orange', width: 2.5 });
          G.path(aa.map((d, i) => [d, Ic[i]]), { color: 'blue', width: 2.5 });
          G.vline(ang.value, { color: 'gold', dash: true });
          const Ip0 = Ia(Tp, al), Ic0 = Ia(Tc, al);
          G.dot(ang.value, Ip0, { color: 'orange', r: 5 }); G.dot(ang.value, Ic0, { color: 'blue', r: 5 });
          const dperp = (q[0] - cm[0]) * Math.sin(al) - (q[1] - cm[1]) * Math.cos(al);
          info = { M: T.M, cm, tau: T.M * (cm[0] - q[0]), Ip0, Ic0, par: T.M * dperp * dperp, al: ang.value };
        });
        v.legend([['orange', 'axis through the pin'], ['blue', 'parallel axis through the centre of mass', { dash: true }]]);
        v.readout(() => `$M=${tf(info.M, 3)}$, centre of mass $(${tf(info.cm[0], 3)},\\,${tf(info.cm[1], 3)})$ ; torque of gravity about the pin $=Mg(\\bar x-p_x)=${tf(info.tau, 3)}\\,g$ ${Math.abs(info.tau) < 0.01 * info.M ? '(balanced)' : ''}\n$I_{\\text{pin}}(${Math.round(info.al)}^\\circ)=${tf(info.Ip0, 4)}$ ; $I_{\\text{cm}}+Md_\\perp^2=${tf(info.Ic0, 4)}+${tf(info.par, 4)}=${tf(info.Ic0 + info.par, 4)}$`);
      },
    },

    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Pappus’s centroid theorems',
      statement: String.raw`Let $D$ be a bounded plane region with area $A$ and centroid at distance $d$ from a line $\ell$ in its plane that does not cut the interior of $D$. Then the solid obtained by revolving $D$ once about $\ell$ has volume
$$V=2\pi d\,A.$$
Likewise, if a plane curve $\gamma$ of length $L$ and centroid (of its arc length) at distance $d$ from $\ell$ lies on one side of $\ell$, the surface of revolution it sweeps has area $S=2\pi d\,L$. The hypothesis that $\ell$ does not cut the region (resp. curve) cannot be dropped.`,
      idea: String.raw`Place $\ell$ as the line $x=a$ and use shells: a thin vertical strip of $D$ at distance $r=|x-a|$ sweeps a cylindrical shell of volume $2\pi r\,dA$, so $V=2\pi\iint_D|x-a|\,dA$. When $D$ lies on one side of $\ell$, $|x-a|=\pm(x-a)$ and the integral is $\pm2\pi\iint(x-a)\,dA=2\pi A(\bar x-a)$, by the definition of the centroid (4.9); that is $2\pi dA$. The curve version is the same computation with $\int\ldots\,ds$ in place of $\iint\ldots\,dA$. If $D$ straddles $\ell$ the two halves overlap after revolving and the signed integral no longer counts the volume of the solid.`,
      caption: String.raw`Drag the five corners of the pentagon (keep it a simple polygon) and move the axis with the slider. Left: the region, its centroid (green), the axis, and the distance $d$. Right: the solid of revolution (drag to rotate). The readout compares $2\pi dA$ with an independent number: for volume, a sum of annulus areas over horizontal slices of the actual solid; for surface, a line integral $\int 2\pi|x-a|\,ds$ over the boundary. They agree to about $0.5\%$ for any shape when the axis stays on one side, and disagree as soon as the axis cuts the region.`,
      deps: ['vcalc-4.9'],
      refs: ['Marsden–Tromba ch. 6'],
      credit: 'Pappus of Alexandria (about 4th century AD); rediscovered by P. Guldin, Centrobaryca, 1640',
      verify: true,
      tags: ['centroid', 'solids of revolution', 'history'],
      viz(v) {
        const mode = v.select('theorem', [{ value: 'vol', label: 'volume of the solid' }, { value: 'surf', label: 'area of the surface' }], 'vol');
        const aS = v.slider('axis position $a$', -1, 1.2, 0, { step: 0.01 });
        const S = v.stage({ x: [-1.6, 3.6], y: [-0.4, 2.6], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 260, xlabel: 'x', ylabel: 'y', title: 'the region and the axis $x=a$' });
        const S3 = v.stage({ x: [-2.3, 2.3], y: [-2, 2.3], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'solid of revolution' });
        const sc = v.scene3(S3, { yaw: -0.7, pitch: 0.28, axis: 0, lim: 2, hint: true, axes: false });
        const H = [[1.0, 0.2], [2.5, 0.5], [2.9, 1.6], [1.8, 2.1], [1.1, 1.2]].map((p, i) => S.handle(p[0], p[1], { color: 'accent', label: String(i + 1), constrain: { x: [-1.5, 3.5], y: [-0.3, 2.5] } }));
        const volNum = (P, a) => {
          // slices y = const: radial intervals |x-a| of the polygon, folded and united; annulus areas
          const ys = P.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), NY = 160, NX = 500;
          const xs = P.map((p) => p[0]), x0 = Math.min(...xs) - 0.01, x1 = Math.max(...xs) + 0.01;
          let V = 0;
          for (let j = 0; j < NY; j++) {
            const y = y0 + ((y1 - y0) * (j + 0.5)) / NY, bins = new Set();
            const rr = [];
            for (let i = 0; i < NX; i++) { const x = x0 + ((x1 - x0) * (i + 0.5)) / NX; if (inPoly(P, x, y)) rr.push(Math.abs(x - a)); }
            // area of the union of rings in rho^2: sort distinct rho (spacing dx) and merge
            const dx = (x1 - x0) / NX, iv = rr.map((r) => [Math.max(0, r - dx / 2), r + dx / 2]).sort((p, q) => p[0] - q[0]);
            let cur = null, area = 0;
            for (const [lo, hi] of iv) {
              if (cur && lo <= cur[1] + 1e-9) cur[1] = Math.max(cur[1], hi);
              else { if (cur) area += cur[1] ** 2 - cur[0] ** 2; cur = [lo, hi]; }
            }
            if (cur) area += cur[1] ** 2 - cur[0] ** 2;
            V += PI * area * ((y1 - y0) / NY);
          }
          return V;
        };
        const surfNum = (P, a) => {
          let s = 0;
          for (let i = 0; i < P.length; i++) {
            const p = P[i], q = P[(i + 1) % P.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]), m = 200;
            for (let k = 0; k < m; k++) { const t = (k + 0.5) / m; s += TAU * Math.abs(p[0] + t * (q[0] - p[0]) - a) * (len / m); }
          }
          return s;
        };
        let info = {};
        v.render(() => {
          const P = H.map((h) => [h.x, h.y]), a = aS.value;
          const A = Math.abs(polyArea(P)), cen = polyCentroid(P);
          let L = 0, cx = 0, cy = 0;
          for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]); L += len; cx += (len * (p[0] + q[0])) / 2; cy += (len * (p[1] + q[1])) / 2; }
          const ctr = [cx / L, cy / L];
          S.poly(P, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          S.vline(a, { color: 'red', width: 2.5 });
          const c = mode.value === 'vol' ? cen : ctr;
          S.dot(c[0], c[1], { color: 'green', r: 6, label: mode.value === 'vol' ? 'area centroid' : 'boundary centroid', labelPos: 'ne' });
          S.measure(a, c[1], c[0], c[1], 'd');
          // 3D
          sc.begin();
          const NP = 40, pt = (x, y, ph) => [0.7 * (x - a) * Math.cos(ph), 0.7 * (x - a) * Math.sin(ph), 0.7 * (y - 1.2)];
          for (let i = 0; i < P.length; i++) {
            const p = P[i], q = P[(i + 1) % P.length];
            patch(sc, (u, ph) => pt(p[0] + u * (q[0] - p[0]), p[1] + u * (q[1] - p[1]), ph), [0, 1], [0, TAU], 1, NP, { fill: 'accent', fillAlpha: 0.1 });
          }
          for (let i = 0; i < P.length; i++) sc.path(Array.from({ length: 61 }, (_, k) => pt(P[i][0], P[i][1], (TAU * k) / 60)), { color: 'accent', width: 1.2, alpha: 0.7 });
          sc.line([0, 0, -1.2], [0, 0, 1.2], { color: 'red', width: 2.5 });
          sc.path(P.concat([P[0]]).map((p) => pt(p[0], p[1], 0)), { color: 'orange', width: 2.5 });
          sc.flush();
          const dV = Math.abs(cen[0] - a), dS = Math.abs(ctr[0] - a);
          info = { A, L, dV, dS, Vp: TAU * dV * A, Sp: TAU * dS * L, Vn: volNum(P, a), Sn: surfNum(P, a), cut: P.some((p) => p[0] > a) && P.some((p) => p[0] < a) };
        });
        v.readout(() => (mode.value === 'vol'
          ? `$A=${tf(info.A, 3)}$, $d=${tf(info.dV, 3)}$ : $2\\pi dA=${tf(info.Vp, 3)}$ ; solid computed by slicing: $V=${tf(info.Vn, 3)}$ ; ratio $${tf(info.Vp / info.Vn, 3)}$`
          : `$L=${tf(info.L, 3)}$, $d=${tf(info.dS, 3)}$ : $2\\pi dL=${tf(info.Sp, 3)}$ ; line integral $\\int2\\pi|x-a|\\,ds=${tf(info.Sn, 3)}$ ; ratio $${tf(info.Sp / info.Sn, 3)}$`)
          + (info.cut ? '\n**the axis cuts the region: the hypothesis fails**' : ''));
      },
    },

    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Paper',
      name: 'Intégrale, longueur, aire',
      paper: { authors: 'H. Lebesgue', year: 1902, title: 'Intégrale, Longueur, Aire', venue: 'Annali di Matematica Pura ed Applicata (3) 7: 231–359', doi: '10.1007/BF02420592' },
      introduces: ['pma-11.21', 'rca-2.21', 'pma-11.32a'],
      credit: 'H. Lebesgue, 1902 (doctoral thesis, published in Annali di Matematica Pura ed Applicata (3) 7, pp. 231–359)',
      statement: String.raw`In this long memoir Lebesgue builds a theory of measure for sets of real numbers (and of $\R^n$) and, from it, a new integral. Instead of cutting the *domain* into small intervals as Riemann did, he cuts the *range* of a bounded function $f$ into bands $y_k\le f<y_{k+1}$ and adds $\sum_k y_k\,m(E_k)$, where $E_k=f^{-1}[y_k,y_{k+1})$ and $m$ is the measure. In modern terms the results include:

(a) every bounded measurable function is integrable in this sense, the integral agrees with Riemann's whenever the latter exists, and it is defined for functions such as the indicator of the rationals, which is $0$ almost everywhere, so that its integral is $0$ (while Riemann's upper and lower sums stay $1$ and $0$);

(b) if bounded measurable functions $f_n\to f$ pointwise with $|f_n|\le K$ on a set of finite measure, then $\int f_n\to\int f$ (the bounded convergence theorem);

(c) a bounded function is Riemann integrable exactly when its set of discontinuities has measure zero.

The memoir's later sections treat length of curves and area of surfaces by a similar limiting process.`,
      idea: String.raw`Before 1902 the Riemann integral was well suited to continuous and piecewise continuous functions, but limits of integrable functions could fail to be integrable, so $\lim\int f_n=\int\lim f_n$ was hard to justify. Lebesgue's observation was that the sum $\sum y_k\,m(E_k)$ only requires the sets $E_k$ to have a size, so a theory of measure (countably additive, with measure zero sets negligible) gives an integral that is stable under pointwise limits. The memoir introduces measurable sets and the Lebesgue integral for bounded functions (pma-11.21, rca-2.21) and the bounded convergence theorem (pma-11.32a); the part on length and area, relating them to limits of polygons and polyhedra, belongs to the same programme and treats Plateau-type problems.`,
      caption: String.raw`**Slicing.** Choose a function. Vertical slicing (Riemann) draws $m$ strips with sup/inf rectangles; horizontal slicing (Lebesgue) draws $m$ bands of the range and colours the points of the graph by band, with $m(E_k)$ read off from the sampling. The right panel shows how fast the upper-minus-lower gap closes against $m$: Lebesgue's gap is at most (range)$/m$ however wild $f$ is, Riemann's closes slowly for the oscillating $\sin(1/x)$. For the **rationals** the Riemann gap stays $1$ for every $m$ (exact: every interval contains rationals and irrationals) and the Lebesgue sums converge to $0$; only a model picture is possible, so the dots are the rationals $p/q$ with $q\le m$. In the **sequence** mode $f_n(x)=x^n$ on $[0,1]$: $f_n\to0$ except at $x=1$ and $0\le f_n\le1$, and $\int f_n=1/(n+1)\to0$. Functions are sampled at $20\,000$ points, so sums are accurate to about $10^{-3}$. This is an illustration of the memoir's ideas, not a reproduction of a figure from it (it has none of this kind).`,
      deps: ['pma-6.1', 'vcalc-4.1'],
      see: ['pma-11.21', 'rca-2.21'],
      refs: [],
      links: { doi: 'https://doi.org/10.1007/BF02420592', wikipedia: 'https://en.wikipedia.org/wiki/Lebesgue_integration' },
      verify: true,
      tags: ['Lebesgue integral', 'measure', 'history'],
      viz(v) {
        const NS = 20000;
        const FUN = {
          wavy: { label: 'smooth wave', f: (x) => 0.5 + 0.4 * Math.sin(6 * x) * Math.cos(2 * x) },
          chirp: { label: '$\\tfrac12(1+\\sin\\tfrac1x)$', f: (x) => 0.5 + 0.5 * Math.sin(1 / Math.max(x, 1e-6)) },
          rat: { label: 'indicator of the rationals', f: () => 0 },
          seq: { label: '$f_n=x^n$', f: (x) => x },
        };
        const sel = v.select('function', Object.entries(FUN).map(([k, o]) => ({ value: k, label: o.label })), 'wavy');
        const way = v.select('slice by', [{ value: 'dom', label: 'domain strips (Riemann)' }, { value: 'ran', label: 'range bands (Lebesgue)' }], 'ran');
        const mS = v.slider('pieces $m$', 1, 60, 8, { int: true });
        const nSeq = v.slider('exponent $n$ of $x^n$', 1, 60, 5, { int: true });
        const A = v.stage({ x: [0, 1], y: [-0.1, 1.15], axes: 'box', gutter: true, height: 380, weight: 1.15, minWidth: 260, xlabel: 'x', ylabel: 'y', title: 'graph of $f$ on $[0,1]$' });
        const B = v.stage({ x: [1, 60], y: [1e-3, 1.5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'm', title: 'upper sum minus lower sum' });
        const cache = {};
        const samples = (k) => {
          if (cache[k]) return cache[k];
          const f = FUN[k].f, ys = new Float64Array(NS);
          let mn = Infinity, mx = -Infinity, s = 0;
          for (let i = 0; i < NS; i++) { const y = f((i + 0.5) / NS); ys[i] = y; mn = Math.min(mn, y); mx = Math.max(mx, y); s += y; }
          return (cache[k] = { ys, mn, mx, I: s / NS });
        };
        const riemann = (k, m) => {
          const { ys } = samples(k); let lo = 0, up = 0;
          for (let j = 0; j < m; j++) {
            const a = Math.floor((j * NS) / m), b = Math.floor(((j + 1) * NS) / m);
            let mn = Infinity, mx = -Infinity;
            for (let i = a; i < b; i++) { if (ys[i] < mn) mn = ys[i]; if (ys[i] > mx) mx = ys[i]; }
            lo += mn / m; up += mx / m;
          }
          return { lo, up };
        };
        const lebesgue = (k, m) => {
          if (k === 'rat') return { lo: 0, up: 1 / m, cnt: [1] };
          const { ys, mn, mx } = samples(k), w = (mx - mn) / m || 1, cnt = new Array(m).fill(0);
          for (let i = 0; i < NS; i++) cnt[Math.min(m - 1, Math.floor((ys[i] - mn) / w))]++;
          let lo = 0, up = 0;
          for (let j = 0; j < m; j++) { lo += (mn + j * w) * cnt[j] / NS; up += (mn + (j + 1) * w) * cnt[j] / NS; }
          return { lo, up, cnt, mn, w };
        };
        const ms = logInts(60, 22);
        const bandColors = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        let info = {};
        v.render(() => {
          const k = sel.value, m = mS.value, isSeq = k === 'seq', isRat = k === 'rat', n = nSeq.value;
          mS.el.hidden = isSeq; nSeq.el.hidden = !isSeq; way.el.hidden = isSeq;
          if (isSeq) {
            A.fn((x) => x ** n, { domain: [0, 1], n: 400, color: 'accent', width: 2.5, fill: true, base: 0 });
            A.hline(0, { color: 'green', width: 2 });
            B.setView([1, 60], [1e-3, 1.5]);
            const ns = Array.from({ length: 60 }, (_, i) => i + 1);
            B.path(ns.map((q) => [q, 1 / (q + 1)]), { color: 'accent', width: 2 });
            B.dot(n, 1 / (n + 1), { color: 'gold', r: 6 });
            B.setTitle('$\\int_0^1 x^n\\,dx=\\frac1{n+1}\\to0$');
            info = { seq: true, n, val: 1 / (n + 1) };
            return;
          }
          B.setTitle('upper sum minus lower sum');
          const T = samples(k), Lb = lebesgue(k, m), Rm = isRat ? { lo: 0, up: 1 } : riemann(k, m);
          if (isRat) {
            A.hline(0, { color: 'accent', width: 2.5 }); A.hline(1, { color: 'accent', width: 1, dash: true, alpha: 0.5 });
            const pts = [];
            for (let q = 1; q <= m; q++) for (let p = 0; p <= q; p++) if (gcd(p, q) === 1) pts.push([p / q, 1]);
            A.dots(pts, { color: 'red', r: 3 });
            A.text('rationals $p/q$, $q\\le m$: value 1', 0.5, 0.8, { align: 'center', color: 'red', size: 12 });
            A.text('irrationals: value 0', 0.5, 0.12, { align: 'center', color: 'accent', size: 13 });
          } else {
            const f = FUN[k].f;
            if (way.value === 'dom') {
              for (let j = 0; j < m; j++) {
                const a = Math.floor((j * NS) / m), b = Math.floor(((j + 1) * NS) / m);
                let mn = Infinity, mx = -Infinity;
                for (let i = a; i < b; i++) { if (T.ys[i] < mn) mn = T.ys[i]; if (T.ys[i] > mx) mx = T.ys[i]; }
                A.rect(j / m, 0, (j + 1) / m, mx, { color: 'orange', width: 1, fill: 'orange', fillAlpha: 0.12 });
                A.rect(j / m, 0, (j + 1) / m, mn, { color: 'blue', width: 1, fill: 'blue', fillAlpha: 0.3 });
              }
            } else {
              for (let j = 0; j <= m; j++) A.hline(T.mn + (j * (T.mx - T.mn)) / m, { color: 'grid', width: 1 });
            }
            const NP = 1400;
            const pts = Array.from({ length: NP }, (_, i) => { const x = (i + 0.5) / NP, y = f(x); return [x, y]; });
            if (way.value === 'ran') {
              const w = (T.mx - T.mn) / m;
              for (let j = 0; j < m; j++) A.dots(pts.filter(([, y]) => Math.min(m - 1, Math.floor((y - T.mn) / w)) === j), { color: bandColors[j % bandColors.length], r: 1.6 });
            } else A.dots(pts, { color: 'ink', r: 1.4 });
          }
          const gR = (q) => (isRat ? 1 : riemann(k, q).up - riemann(k, q).lo), gL = (q) => { const l = lebesgue(k, q); return Math.max(l.up - l.lo, 1e-6); };
          B.setView([1, 60], [1e-3, 1.5]);
          B.path(ms.map((q) => [q, Math.max(gR(q), 1e-6)]), { color: 'orange', width: 2.5 });
          B.path(ms.map((q) => [q, gL(q)]), { color: 'blue', width: 2.5 });
          B.dot(m, Math.max(gR(m), 1e-6), { color: 'orange', r: 5 }); B.dot(m, gL(m), { color: 'blue', r: 5 });
          info = { m, Rm, Lb, I: isRat ? 0 : T.I, isRat, range: isRat ? 1 : T.mx - T.mn };
        });
        v.legend([['orange', 'Riemann: upper − lower (domain strips)'], ['blue', 'Lebesgue: upper − lower (range bands)']]);
        v.readout(() => (info.seq
          ? `$n=${info.n}$: $\\int_0^1 x^n\\,dx=${tf(info.val, 4)}$, and $x^n\\to0$ for every $x<1$ with $|x^n|\\le1$.`
          : `$m=${info.m}$ ; Riemann: $${tf(info.Rm.lo, 4)}\\le\\int f\\le${tf(info.Rm.up, 4)}$ (gap $${tf(info.Rm.up - info.Rm.lo, 4)}$) ; Lebesgue: $${tf(info.Lb.lo, 4)}\\le\\int f\\le${tf(info.Lb.up, 4)}$ (gap $\\le \\text{range}/m=${tf(info.range / info.m, 4)}$) ; $\\int f\\approx${tf(info.I, 4)}$`));
      },
    },
  ],
};

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
