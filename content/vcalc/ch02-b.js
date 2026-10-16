// Vector Calculus — Chapter 2: Differentiating scalar fields
// Part 2 (2.9–2.15): gradient ascent, mixed partials, Taylor, Hessian, second-derivative test, Lagrange multipliers, implicit functions.
import {
  tn, tf, tup, hills, grad2, hess2, eig2, surf3, onSurf, trail, levelSegs, bisect, critNewton, classify, DEG, TAU,
} from './ch02.shared.js';

export default {
  collection: 'vcalc',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Method',
      name: 'Gradient ascent on a landscape',
      credit: 'A.-L. Cauchy, 1847 (method of steepest descent)',
      statement: String.raw`**Gradient ascent** finds high points of a differentiable $f:\R^n\to\R$: from a start $\mathbf x_0$, repeat $\mathbf x_{k+1}=\mathbf x_k+\eta\,\nabla f(\mathbf x_k)$ with a small step $\eta>0$. As $\eta\to0$ the iterates follow the **gradient flow** $\dot{\mathbf x}=\nabla f(\mathbf x)$, a path that crosses every level set at a right angle, increases $f$ at the fastest possible rate, and (for bounded $f$) tends to a critical point, typically a local maximum. Descent, with a minus sign, finds minima.`,
      idea: String.raw`By 2.7 the direction of fastest increase is $\nabla f$, and by 2.8 it is perpendicular to the level curve, so each small step climbs to the neighbouring level as directly as possible. Along the flow, $\frac{d}{dt}f=|\nabla f|^2\ge0$ (chain rule, 2.6), so $f$ rises until the gradient vanishes. Which peak a hiker reaches depends on the start: the plane splits into basins separated by curves through the saddles. A step that is too large overshoots narrow ridges and the iteration zig-zags or diverges.`,
      caption: String.raw`Click the map to release hikers (or use the buttons) and press play. On the hills, a line of hikers across the saddle splits between the two peaks, and every path crosses the contours at right angles. On the ridge, raise the step $\eta$ until the paths zig-zag across it.`,
      scope: String.raw`For small enough steps relative to the curvature of $f$ (roughly $\eta<2/\lambda_{\max}$ of the Hessian); with larger steps the iteration need not increase $f$.`,
      deps: ['vcalc-2.8'],
      refs: ['Marsden–Tromba §2.6'],
      tags: ['gradient', 'optimization', 'flow'],
      viz(v) {
        const LAND = {
          hills: { label: 'two hills', f: hills, guess: [[0.45, 0.3], [-0.6, -0.4]], sad: [-0.05, -0.05] },
          ridge: { label: 'winding ridge', f: (x, y) => 0.9 * Math.exp(-14 * (y - 0.3 * Math.sin(2.4 * x)) ** 2) * (0.45 + 0.55 * Math.exp(-((x - 0.7) ** 2) / 0.6)), guess: [[0.7, 0.3 * Math.sin(1.68)]], sad: null },
        };
        for (const L of Object.values(LAND)) {
          L.peaks = L.guess.map((g) => critNewton(L.f, g[0], g[1]) || g);
          if (L.sad) L.sad = critNewton(L.f, L.sad[0], L.sad[1]) || L.sad;
        }
        const which = v.select('landscape', Object.entries(LAND).map(([value, L]) => ({ value, label: L.label })), 'hills', { onChange: () => { hikers = []; seed(); } });
        const eta = v.slider('step $\\eta$', 0.005, 1.5, 0.06, { log: true, sig: 2 });
        const S = v.stage({ x: [-1.3, 1.3], y: [-1.15, 1.15], equal: true, axes: 'box', gutter: true, height: 440, weight: 1, xlabel: 'x', ylabel: 'y', title: 'click to release a hiker' });
        const COL = ['accent', 'orange', 'purple'];
        const MAXS = 360;
        let hikers = [], paths = [], key = '', counter = 0;
        const L = () => LAND[which.value];
        function seed() {
          const l = L();
          if (which.value === 'hills' && l.sad) {
            const A = l.peaks[0], B = l.peaks[1], d = [B[0] - A[0], B[1] - A[1]], n = Math.hypot(...d), perp = [-d[1] / n, d[0] / n];
            for (let i = 0; i < 15; i++) { const t = -0.55 + (1.1 * i) / 14; hikers.push([l.sad[0] + t * perp[0] * 0.9, l.sad[1] + t * perp[1] * 0.9 + 0.0]); }
          } else {
            const r = v.rng(11); for (let i = 0; i < 14; i++) hikers.push([r.uniform(-1.2, 0.2), r.uniform(-1.0, 1.0)]);
          }
        }
        seed();
        v.button('line across the saddle', () => { hikers = []; which.set('hills'); seed(); });
        v.button('scatter 20', () => { const r = v.rng(100 + counter++); for (let i = 0; i < 20; i++) hikers.push([r.uniform(-1.2, 1.2), r.uniform(-1.05, 1.05)]); });
        v.button('clear', () => { hikers = []; });
        S.onClick((x, y) => { hikers.push([x, y]); v.invalidate(); });
        function climb(p0, f, h) {
          const P = [p0.slice()]; let x = p0[0], y = p0[1];
          for (let k = 0; k < MAXS; k++) {
            const g = grad2(f, x, y, 0.005);
            if (Math.hypot(g[0], g[1]) < 1e-4) break;
            x += h * g[0]; y += h * g[1];
            if (Math.abs(x) > 2.5 || Math.abs(y) > 2.5) break;
            P.push([x, y]);
          }
          return P;
        }
        let st = {};
        v.animate((t) => {
          const l = L(), f = l.f, h = eta.value;
          const k = `${which.value}|${h}|${hikers.length}`;
          if (k !== key) { key = k; paths = hikers.map((p0) => climb(p0, f, h)); }
          S.heat(f, { range: [-0.5, 1], cmap: 'theme', color: 'green', res: 3, key: which.value });
          S.contour(f, Array.from({ length: 14 }, (_, i) => -0.3 + 0.1 * i), { color: 'ink', alpha: 0.3, width: 1 });
          const cnt = [0, 0, 0, 0]; let mono = true;
          const frac = Math.min(1, t / 5), nShow = Math.floor(frac * MAXS);
          paths.forEach((P) => {
            const e = P[P.length - 1];
            let who = l.peaks.findIndex((q) => Math.hypot(q[0] - e[0], q[1] - e[1]) < 0.12);
            if (who < 0) who = 3;
            if (P.length >= MAXS && who === 3) who = 3;
            for (let i = 1; i < P.length; i++) if (f(P[i][0], P[i][1]) < f(P[i - 1][0], P[i - 1][1]) - 1e-12) { mono = false; break; }
            const col = who < 3 ? COL[who] : 'muted';
            const upto = Math.min(P.length - 1, nShow);
            S.path(P.slice(0, upto + 1), { color: col, width: 2, alpha: 0.9 });
            S.dot(P[0][0], P[0][1], { color: col, r: 3, hollow: true });
            S.dot(P[upto][0], P[upto][1], { color: 'gold', r: 4.5 });
            cnt[who]++;
          });
          l.peaks.forEach((q, i) => S.dot(q[0], q[1], { color: COL[i], r: 6, hollow: true, label: i ? undefined : undefined }));
          if (l.sad) S.dot(l.sad[0], l.sad[1], { color: 'red', r: 5, hollow: true });
          st = { cnt, mono, n: paths.length, peaks: l.peaks.length, big: h };
        }, { period: 7, still: 5.2 });
        v.legend([['accent', 'reaches peak 1'], ['orange', 'reaches peak 2'], ['muted', 'has not arrived (or oscillates)'], ['red', 'saddle', { dot: true }]]);
        v.readout(() => `${st.n} hikers (step $\\eta=${tf(st.big, 3)}$): ${st.cnt.slice(0, st.peaks).map((c, i) => `peak ${i + 1}: **${c}**`).join(', ')}${st.cnt[3] ? `, not at a peak (stuck on the dividing line at the saddle, or still climbing): **${st.cnt[3]}**` : ''}. $f$ increased at every step of every path: **${st.mono ? 'yes' : 'no — the step is too large, some steps overshoot and lose height'}**.`);
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Equality of mixed partials',
      credit: 'Clairaut, 1740; Schwarz, 1873',
      statement: String.raw`Let $f$ be defined on an open set containing $(a,b)$, and suppose $f_x$, $f_y$ and $f_{xy}$ exist near $(a,b)$ with $f_{xy}$ continuous at $(a,b)$. Then $f_{yx}(a,b)$ exists and $f_{yx}(a,b)=f_{xy}(a,b)$. In particular, if $f$ is $C^2$ then the order of differentiation does not matter. Without continuity of the second partials the two can differ, as for $f(x,y)=\dfrac{xy(x^2-y^2)}{x^2+y^2}$, $f(0,0)=0$, where $f_{xy}(0,0)=-1$ but $f_{yx}(0,0)=+1$ (here $f_{xy}=\partial_y\partial_x f$).`,
      idea: String.raw`Both iterated derivatives are limits of the same second difference $A(h,k)=\dfrac{f(a+h,b+k)-f(a+h,b)-f(a,b+k)+f(a,b)}{hk}$, one by letting $h\to0$ first, the other $k\to0$ first. Applying the mean value theorem twice (Rudin 5.10) writes $A(h,k)$ as a mixed second partial at an intermediate point of the small rectangle; continuity of that partial makes $A$ converge to a single number however $(h,k)\to0$, so both orders of limit agree. Where $A$ has no limit at $(0,0)$ the two iterated limits can differ.`,
      caption: String.raw`The map shows the second difference $A(h,k)$ for every small rectangle (red $>0$, blue $<0$). For the smooth function it is nearly constant, so any route to the origin gives the same limit. For the classical counterexample it depends only on the direction of approach, equal to $-1$ along the $k$-axis and $+1$ along the $h$-axis. Drag the point; the right panel plots $f_x(0,s)$ and $f_y(s,0)$, whose slopes at $0$ are the two mixed partials.`,
      deps: ['vcalc-2.2', 'pma-9.41'],
      refs: ['Marsden–Tromba §3.1'],
      tags: ['mixed partials', 'counterexample', 'symmetry'],
      viz(v) {
        const FN = {
          smooth: { label: 'smooth: $\\sin(xy)+x^3y^2$', f: (x, y) => Math.sin(x * y) + x ** 3 * y * y },
          bad: { label: 'counterexample: $\\dfrac{xy(x^2-y^2)}{x^2+y^2}$', f: (x, y) => (x === 0 && y === 0 ? 0 : (x * y * (x * x - y * y)) / (x * x + y * y)) },
        };
        const which = v.select('function', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bad');
        const Mp = v.stage({ x: [-0.6, 0.6], y: [-0.6, 0.6], equal: true, axes: 'box', gutter: true, height: 400, weight: 1.1, xlabel: 'h', ylabel: 'k', title: 'second difference $A(h,k)$' });
        const Pp = v.stage({ x: [-0.6, 0.6], y: [-0.8, 0.8], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 260, xlabel: 's', title: 'the two first derivatives, near $0$' });
        const P = Mp.handle(0.3, 0.2, { color: 'gold', constrain: { x: [-0.58, 0.58], y: [-0.58, 0.58] } });
        const A = (f, h, k) => (f(h, k) - f(h, 0) - f(0, k) + f(0, 0)) / (h * k);
        const eta = 1e-5;
        let st = {};
        v.render(() => {
          const f = FN[which.value].f;
          Mp.heat((h, k) => (Math.abs(h) < 1e-9 || Math.abs(k) < 1e-9 ? NaN : A(f, h, k)), { range: [-1.5, 1.5], cmap: 'theme-diverging', res: 3, key: which.value });
          Mp.hline(0, { color: 'ink', alpha: 0.5 }); Mp.vline(0, { color: 'ink', alpha: 0.5 });
          Mp.arrow(0.5, -0.35, 0.06, -0.35, { color: 'orange', width: 2.4 });
          Mp.arrow(-0.4, 0.5, -0.4, 0.06, { color: 'green', width: 2.4 });
          Mp.tex('h\\to0\\ \\text{first}', 0.28, -0.42, { color: 'orange', size: 13 });
          Mp.tex('k\\to0\\ \\text{first}', -0.4, 0.3, { color: 'green', size: 13, dx: 52 });
          Mp.dot(P.x, P.y, { color: 'gold', r: 6 });
          const phi = (s) => (f(eta, s) - f(-eta, s)) / (2 * eta); // f_x(0, s)
          const psi = (s) => (f(s, eta) - f(s, -eta)) / (2 * eta); // f_y(s, 0)
          Pp.hline(0, { color: 'faint' });
          Pp.fn(phi, { color: 'orange', width: 2.8, n: 200 });
          Pp.fn(psi, { color: 'green', width: 2.8, n: 200, dash: [7, 4] });
          const d = 1e-3;
          const fxy = (phi(d) - phi(-d)) / (2 * d), fyx = (psi(d) - psi(-d)) / (2 * d);
          Pp.dot(0, 0, { color: 'ink', r: 4 });
          st = { A: A(f, P.x, P.y), Ah: A(f, eta, P.y), Ak: A(f, P.x, eta), fxy, fyx, h: P.x, k: P.y };
        });
        v.legend([['orange', '$f_x(0,s)$: slope at $0$ is $f_{xy}$'], ['green', '$f_y(s,0)$: slope at $0$ is $f_{yx}$', { dash: true }]]);
        v.readout(() => `$A(${tf(st.h, 2)},${tf(st.k, 2)})=${tf(st.A, 4)}$. Letting $h\\to0$ first (at this $k$): $${tf(st.Ah, 4)}$; letting $k\\to0$ first (at this $h$): $${tf(st.Ak, 4)}$.\nMixed partials at the origin: $f_{xy}(0,0)=${tf(st.fxy, 3)}$, $f_{yx}(0,0)=${tf(st.fyx, 3)}$ — ${Math.abs(st.fxy - st.fyx) < 0.01 ? '**equal**' : '**different**: the second partials are not continuous at $0$'}.`);
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Second-order Taylor formula',
      credit: 'B. Taylor, 1715',
      statement: String.raw`Let $f$ be $C^2$ near $\mathbf a$. Then
$$f(\mathbf a+\mathbf h)=f(\mathbf a)+\nabla f(\mathbf a)\cdot\mathbf h+\tfrac12\,\mathbf h^{\mathsf T}H_f(\mathbf a)\,\mathbf h+R(\mathbf h),\qquad \frac{R(\mathbf h)}{|\mathbf h|^2}\to0,$$
where $H_f=(\partial_i\partial_jf)$ is the Hessian matrix. If $f$ is $C^3$, then $|R(\mathbf h)|\le C|\mathbf h|^3$ near $\mathbf a$. The tangent plane alone leaves an error of order $|\mathbf h|^2$.`,
      idea: String.raw`Restrict $f$ to the segment $t\mapsto\mathbf a+t\mathbf h$ and apply the one-variable Taylor theorem (Rudin 5.15) to $g(t)=f(\mathbf a+t\mathbf h)$. By the chain rule (2.6), $g'(0)=\nabla f\cdot\mathbf h$ and $g''(0)=\mathbf h^{\mathsf T}H\mathbf h$, where the symmetry of the Hessian (2.10) is what makes $H$ well defined. The remainder is $\tfrac12(g''(\xi)-g''(0))$, small by continuity of the second partials.`,
      caption: String.raw`Drag the base point on the floor and shrink the neighbourhood radius $\rho$. The picture is rescaled by $1/\rho$: the surface (blue) hugs the quadratic (green) much more tightly than its tangent plane (orange). The log–log panel shows the worst error on circles of radius $r$ for the two approximations; the slopes are $2$ and $3$.`,
      deps: ['vcalc-2.10', 'pma-5.15'],
      refs: ['Marsden–Tromba §3.2'],
      tags: ['taylor', 'hessian', 'approximation'],
      viz(v) {
        const f = hills;
        const rho = v.slider('neighbourhood radius $\\rho$', 0.02, 0.8, 0.5, { log: true, sig: 2 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.65, 1.7], equal: true, axes: false, height: 400, weight: 1.2 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.4, axis: 1.4, lim: 1.3 });
        const E = v.stage({ x: [0.01, 0.8], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 260, xlabel: 'r', title: 'worst error $|f-T|$ on the circle of radius $r$' });
        const P = sc.handle([0.15, 0.1, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'gold', lim: 0.95 });
        const dirs = Array.from({ length: 48 }, (_, i) => (i * TAU) / 48);
        const rs = Array.from({ length: 41 }, (_, i) => 0.01 * 80 ** (i / 40));
        let st = {};
        v.render(() => {
          const x0 = P.p[0], y0 = P.p[1], z0 = f(x0, y0), g = grad2(f, x0, y0), H = hess2(f, x0, y0), r0 = rho.value;
          const T1 = (hx, hy) => z0 + g[0] * hx + g[1] * hy;
          const T2 = (hx, hy) => T1(hx, hy) + 0.5 * (H[0][0] * hx * hx + 2 * H[0][1] * hx * hy + H[1][1] * hy * hy);
          const sk = (T) => (u, w) => (0.6 * (T(r0 * u, r0 * w) - z0)) / r0;
          sc.begin();
          surf3(sc, (u, w) => (0.6 * (f(x0 + r0 * u, y0 + r0 * w) - z0)) / r0, [-1, 1], [-1, 1], 14, { fill: 'accent', a0: 0.1, a1: 0.25, wire: 0.5, zmax: 1.4 });
          surf3(sc, sk(T1), [-1, 1], [-1, 1], 8, { fill: 'orange', a0: 0.1, a1: 0.12, wire: 0.45, zmax: 1.4, bias: -0.02 });
          surf3(sc, sk(T2), [-1, 1], [-1, 1], 14, { fill: 'green', a0: 0.05, a1: 0.12, wire: 0.5, zmax: 1.4, bias: -0.04 });
          sc.dot([0, 0, 0], { color: 'gold', r: 5 });
          sc.flush();
          const e1 = [], e2 = [];
          for (const r of rs) {
            let m1 = 0, m2 = 0;
            for (const th of dirs) { const hx = r * Math.cos(th), hy = r * Math.sin(th), fv = f(x0 + hx, y0 + hy); m1 = Math.max(m1, Math.abs(fv - T1(hx, hy))); m2 = Math.max(m2, Math.abs(fv - T2(hx, hy))); }
            e1.push([r, Math.max(m1, 1e-13)]); e2.push([r, Math.max(m2, 1e-13)]);
          }
          E.path(e1, { color: 'orange', width: 2.6 }); E.path(e2, { color: 'green', width: 2.6 });
          const c1 = e1[e1.length - 1][1] / 0.8 ** 2, c2 = e2[e2.length - 1][1] / 0.8 ** 3;
          E.path([[0.01, c1 * 1e-4 * 1.0], [0.8, c1 * 0.64]], { color: 'orange', width: 1, dash: true, alpha: 0.7 });
          E.path([[0.01, c2 * 1e-6], [0.8, c2 * 0.512]], { color: 'green', width: 1, dash: true, alpha: 0.7 });
          E.vline(r0, { color: 'faint', dash: true });
          const slope = (e) => Math.log(e[30][1] / e[10][1]) / Math.log(rs[30] / rs[10]);
          const i0 = rs.findIndex((r) => r >= r0);
          st = { s1: slope(e1), s2: slope(e2), a1: e1[Math.max(0, i0)][1], a2: e2[Math.max(0, i0)][1], H, g };
        });
        v.legend([['accent', '$f$'], ['orange', 'tangent plane $T_1$'], ['green', 'quadratic $T_2$'], ['muted', 'slopes 2 and 3 (dashed)']]);
        v.readout(() => `Hessian $H=\\begin{pmatrix}${tf(st.H[0][0], 2)}&${tf(st.H[0][1], 2)}\\\\${tf(st.H[0][1], 2)}&${tf(st.H[1][1], 2)}\\end{pmatrix}$. At $r\\approx\\rho$ the errors are $|f-T_1|=${v.sci(st.a1, 2)}$ and $|f-T_2|=${v.sci(st.a2, 2)}$. Fitted log–log slopes: $${tf(st.s1, 2)}$ for $T_1$ (order $r^2$), $${tf(st.s2, 2)}$ for $T_2$ (order $r^3$).`);
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Definition',
      name: 'Critical points and the Hessian',
      credit: 'Hesse, 1844 (the Hessian determinant)',
      statement: String.raw`A point $\mathbf a$ is a **critical point** of a differentiable $f$ if $\nabla f(\mathbf a)=\mathbf 0$. For $f$ of class $C^2$ the **Hessian** at $\mathbf a$ is the symmetric matrix $H_f(\mathbf a)=\bigl(\partial_i\partial_jf(\mathbf a)\bigr)$; its quadratic form $\mathbf h\mapsto\mathbf h^{\mathsf T}H_f\mathbf h$ is the second derivative of $f$ in the direction $\mathbf h$. Its eigenvalues are the **principal curvatures** (up to the factor $1+|\nabla f|^2$ away from critical points), and its eigenvectors are the perpendicular **principal directions**.`,
      idea: String.raw`At a critical point the Taylor formula (2.11) reads $f(\mathbf a+\mathbf h)\approx f(\mathbf a)+\tfrac12\mathbf h^{\mathsf T}H\mathbf h$, so the local shape of the landscape is that of a quadratic form. A real symmetric matrix has an orthonormal eigenbasis (Rudin 9.x, spectral theorem), and in those coordinates the form is $\tfrac12(\lambda_1s^2+\lambda_2t^2)$: a bowl if both eigenvalues are positive, a dome if both are negative, a saddle if they differ in sign.`,
      caption: String.raw`Drag the gold point (or snap it to the nearest critical point). The orange and green axes are the Hessian's eigen-directions; the curves around the point are the level sets of the quadratic approximation (blue: above $f(\mathbf a)$, red: below). On the right, $f$ along each eigen-axis (solid) against the parabola $\tfrac12\lambda t^2$ plus the linear term (dashed).`,
      deps: ['vcalc-2.11'],
      refs: ['Marsden–Tromba §3.3'],
      tags: ['critical points', 'hessian', 'curvature'],
      viz(v) {
        const f = (x, y) => 0.8 * Math.sin(1.7 * x + 0.3) * Math.cos(1.4 * y) + 0.12 * x * y;
        const crit = [];
        for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) {
          const q = critNewton(f, i * 0.5, j * 0.5);
          if (q && Math.abs(q[0]) < 2.4 && Math.abs(q[1]) < 1.8 && !crit.some((c) => Math.hypot(c[0] - q[0], c[1] - q[1]) < 1e-4)) crit.push(q);
        }
        const kind = (q) => classify(hess2(f, q[0], q[1]), 1e-3);
        const COL = { min: 'blue', max: 'red', saddle: 'purple', degenerate: 'gold' };
        const Mp = v.stage({ x: [-2.4, 2.4], y: [-1.8, 1.8], equal: true, axes: 'box', gutter: true, height: 400, weight: 1.35, xlabel: 'x', ylabel: 'y', title: 'contour map, critical points, Hessian axes' });
        const Sl = v.stage({ x: [-0.6, 0.6], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 400, weight: 0.8, minWidth: 240, xlabel: 't', title: '$f(\\mathbf a+t\\mathbf e_i)-f(\\mathbf a)$' });
        const p = Mp.handle(0.5, 0.4, { color: 'gold', constrain: { x: [-2.3, 2.3], y: [-1.7, 1.7] } });
        v.button('snap to nearest critical point', () => {
          const q = crit.slice().sort((a, b) => Math.hypot(a[0] - p.x, a[1] - p.y) - Math.hypot(b[0] - p.x, b[1] - p.y))[0];
          if (q) p.set(q[0], q[1]);
        });
        let st = {};
        v.render(() => {
          const H = hess2(f, p.x, p.y), E = eig2(H), g = grad2(f, p.x, p.y), f0 = f(p.x, p.y);
          Mp.heat(f, { range: [-1, 1], cmap: 'theme-diverging', res: 3, key: 'f' });
          Mp.contour(f, Array.from({ length: 21 }, (_, i) => -1 + 0.1 * i), { color: 'ink', alpha: 0.28, width: 1 });
          const q = (x, y) => { const hx = x - p.x, hy = y - p.y; return 0.5 * (H[0][0] * hx * hx + 2 * H[0][1] * hx * hy + H[1][1] * hy * hy); };
          Mp.clip(() => {
            Mp.contour(q, [0.015, 0.05], { color: 'blue', width: 2.2, res: 160 });
            Mp.contour(q, [-0.015, -0.05], { color: 'red', width: 2.2, res: 160 });
          });
          for (const [e, c, lam] of [[E.e1, 'orange', E.l1], [E.e2, 'green', E.l2]]) {
            Mp.line(p.x - 0.55 * e[0], p.y - 0.55 * e[1], p.x + 0.55 * e[0], p.y + 0.55 * e[1], { color: c, width: 2.6 });
          }
          for (const q0 of crit) Mp.dot(q0[0], q0[1], { color: COL[kind(q0)], r: 6, hollow: true });
          Mp.dot(p.x, p.y, { color: 'gold', r: 6 });
          Sl.hline(0, { color: 'faint' });
          for (const [e, c, lam] of [[E.e1, 'orange', E.l1], [E.e2, 'green', E.l2]]) {
            const lin = g[0] * e[0] + g[1] * e[1];
            Sl.fn((t) => f(p.x + t * e[0], p.y + t * e[1]) - f0, { color: c, width: 2.8 });
            Sl.fn((t) => lin * t + 0.5 * lam * t * t, { color: c, width: 1.4, dash: [5, 4] });
          }
          st = { H, E, gn: Math.hypot(g[0], g[1]), cls: classify(H, 1e-3) };
        });
        v.legend([['orange', 'eigen-axis 1 (larger $\\lambda$)'], ['green', 'eigen-axis 2'], ['blue', 'min', { dot: true }], ['red', 'max', { dot: true }], ['purple', 'saddle', { dot: true }]]);
        v.readout(() => `$|\\nabla f|=${tf(st.gn, 4)}$. $H=\\begin{pmatrix}${tf(st.H[0][0], 3)}&${tf(st.H[0][1], 3)}\\\\${tf(st.H[0][1], 3)}&${tf(st.H[1][1], 3)}\\end{pmatrix}$, eigenvalues $\\lambda_1=${tf(st.E.l1, 3)}$, $\\lambda_2=${tf(st.E.l2, 3)}$ (along $${tup(st.E.e1, 2)}$ and $${tup(st.E.e2, 2)}$).\n${st.gn < 0.02 ? `**Critical point**: the quadratic form is ${st.cls === 'min' ? 'positive definite (a bowl)' : st.cls === 'max' ? 'negative definite (a dome)' : st.cls === 'saddle' ? 'indefinite (a saddle)' : 'degenerate'}.` : 'Not a critical point ($\\nabla f\\ne0$): the Hessian still measures curvature, but the linear term dominates.'}`);
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Second-derivative test',
      statement: String.raw`Let $f$ be $C^2$ near a critical point $\mathbf a$, with Hessian $H$. If $H$ is positive definite, $\mathbf a$ is a strict local minimum; if negative definite, a strict local maximum; if $H$ has eigenvalues of both signs, $\mathbf a$ is a saddle (neither). For $n=2$, with $D=f_{xx}f_{yy}-f_{xy}^2=\det H$: $D>0,\ f_{xx}>0$ gives a minimum, $D>0,\ f_{xx}<0$ a maximum, $D<0$ a saddle; if $D=0$ the test is inconclusive (for example $x^2+y^4$ has a minimum, $x^2-y^4$ a saddle, with the same Hessian).`,
      idea: String.raw`By the Taylor formula (2.11) at a critical point, $f(\mathbf a+\mathbf h)-f(\mathbf a)=\tfrac12\mathbf h^{\mathsf T}H\mathbf h+o(|\mathbf h|^2)$. If $H$ is positive definite, $\mathbf h^{\mathsf T}H\mathbf h\ge\lambda_{\min}|\mathbf h|^2$ with $\lambda_{\min}>0$, which beats the $o(|\mathbf h|^2)$ remainder. Along an eigenvector with $\lambda>0$ and another with $\lambda<0$, $f$ rises and falls, giving a saddle. With a zero eigenvalue the quadratic term says nothing in that direction, and the higher-order terms decide.`,
      caption: String.raw`Choose the quadratic family and drag the point in the $(a,c)$ plane for $f=ax^2+bxy+cy^2$; the curve $ac=b^2/4$ separates bowls and domes from saddles (slide $b$ to move it). The other choices are degenerate: the Hessian has a zero eigenvalue and the test is silent although the surfaces are plainly different.`,
      deps: ['vcalc-2.12', 'pma-5.8'],
      refs: ['Marsden–Tromba §3.3'],
      tags: ['second derivative test', 'extrema', 'saddle'],
      viz(v) {
        const mode = v.select('function', [{ value: 'q', label: '$ax^2+bxy+cy^2$' }, { value: 'd1', label: '$x^2+y^4$' }, { value: 'd2', label: '$x^2-y^4$' }, { value: 'd3', label: '$x^4+y^4$' }], 'q');
        const bs = v.slider('$b$', -2, 2, 0.8, { step: 0.05 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, axes: false, height: 400, weight: 1.25 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.4, axis: 1.3, lim: 1.2 });
        const Cm = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: 'box', gutter: true, height: 400, weight: 0.8, minWidth: 220, xlabel: 'x', ylabel: 'y', title: 'level curves' });
        const Dg = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 400, weight: 0.85, minWidth: 230, xlabel: 'a', ylabel: 'c', title: 'type of the form, in the $(a,c)$ plane' });
        const hp = Dg.handle(1, -0.6, { color: 'gold', constrain: { x: [-1.95, 1.95], y: [-1.95, 1.95] } });
        const rgb = { blue: v.rgb('blue'), red: v.rgb('red'), purple: v.rgb('purple') };
        const FD = { d1: (x, y) => x * x + y ** 4, d2: (x, y) => x * x - y ** 4, d3: (x, y) => x ** 4 + y ** 4 };
        const TRUE = { d1: 'a strict minimum', d2: 'a saddle', d3: 'a strict minimum' };
        let st = {};
        v.render(() => {
          const m = mode.value, b = bs.value, a = hp.x, c = hp.y;
          const f = m === 'q' ? (x, y) => a * x * x + b * x * y + c * y * y : FD[m];
          const H = [[2 * (m === 'q' ? a : m === 'd3' ? 0 : 1), m === 'q' ? b : 0], [m === 'q' ? b : 0, m === 'q' ? 2 * c : 0]];
          const D = m === 'q' ? a * c - (b * b) / 4 : 0;
          const cls = m === 'q' ? (D > 1e-9 ? (a > 0 ? 'min' : 'max') : D < -1e-9 ? 'saddle' : 'degenerate') : 'degenerate';
          bs.el.hidden = m !== 'q'; Dg.el.style.display = m === 'q' ? '' : 'none';
          const zs = m === 'q' ? 0.4 : 0.7;
          const colr = cls === 'min' ? 'blue' : cls === 'max' ? 'red' : cls === 'saddle' ? 'purple' : 'gold';
          sc.begin();
          surf3(sc, (x, y) => zs * f(x, y), [-1, 1], [-1, 1], 22, { fill: colr, a1: 0.3, wire: 0.28, zmax: 1.45 });
          onSurf(sc, (x, y) => zs * f(x, y), trail((t) => [t, 0], -1, 1, 40), { color: 'ink', width: 2 });
          onSurf(sc, (x, y) => zs * f(x, y), trail((t) => [0, t], -1, 1, 40), { color: 'green', width: 2 });
          sc.dot([0, 0, 0], { color: 'gold', r: 5 });
          sc.flush();
          const sup = Math.max(1e-6, ...[[1, 1], [1, -1], [1, 0], [0, 1]].map(([x, y]) => Math.abs(f(x, y))));
          Cm.heat(f, { range: [-sup, sup], cmap: 'theme-diverging', res: 3, key: `${m}|${a}|${b}|${c}` });
          Cm.contour(f, Array.from({ length: 13 }, (_, i) => (-sup * 0.9) + (i * sup * 1.8) / 12).filter((x) => Math.abs(x) > 1e-9), { color: 'ink', alpha: 0.4, width: 1 });
          Cm.contour(f, 0, { color: 'ink', width: 2, res: 160 });
          if (m === 'q') {
            Dg.raster((x, y) => { const d = x * y - (b * b) / 4, col = d > 0 ? (x > 0 ? rgb.blue : rgb.red) : rgb.purple; return [col[0], col[1], col[2], 0.26]; }, { key: `D${b}`, res: 3 });
            Dg.fn((x) => (b * b) / (4 * x), { domain: [0.04, 2], color: 'ink', width: 1.8 }); Dg.fn((x) => (b * b) / (4 * x), { domain: [-2, -0.04], color: 'ink', width: 1.8 });
            Dg.text('min', 1.4, 1.7, { size: 13, color: 'blue', align: 'center' }); Dg.text('max', -1.4, -1.7, { size: 13, color: 'red', align: 'center' }); Dg.text('saddle', 1.25, -1.7, { size: 13, color: 'purple', align: 'center' }); Dg.text('saddle', -1.25, 1.7, { size: 13, color: 'purple', align: 'center' });
            Dg.dot(a, c, { color: 'gold', r: 6.5 });
          }
          st = { m, a, b, c, D, cls, H };
        });
        v.legend([['ink', 'slice $y=0$'], ['green', 'slice $x=0$']]);
        v.readout(() => st.m === 'q'
          ? `$f_{xx}=${tf(st.H[0][0], 2)}$, $f_{yy}=${tf(st.H[1][1], 2)}$, $f_{xy}=${tf(st.H[0][1], 2)}$, $D=f_{xx}f_{yy}-f_{xy}^2=${tf(4 * st.D, 3)}$ ($=4(ac-b^2/4)$). ${st.cls === 'min' ? '$D>0,\\ f_{xx}>0$: **minimum** (blue).' : st.cls === 'max' ? '$D>0,\\ f_{xx}<0$: **maximum** (red).' : st.cls === 'saddle' ? '$D<0$: **saddle** (purple).' : '$D=0$: **test inconclusive** (gold).'}`
          : `Here $D=0$ at the origin (the Hessian has a zero eigenvalue), so the **test is silent** (gold). The surface itself has ${TRUE[st.m]}: the quartic term decides, which the second-order test cannot see.`);
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Theorem',
      name: 'Lagrange multipliers',
      credit: 'J.-L. Lagrange, 1788',
      statement: String.raw`Let $f,g$ be $C^1$ near $\mathbf a$, with $\nabla g(\mathbf a)\neq\mathbf0$. If $\mathbf a$ is a local extremum of $f$ restricted to the level set $\{g=c\}$ (where $c=g(\mathbf a)$), then there is a real number $\lambda$ with
$$\nabla f(\mathbf a)=\lambda\,\nabla g(\mathbf a).$$
So the candidates are the solutions of $\nabla f=\lambda\nabla g,\ g=c$ ($n+1$ equations in the $n+1$ unknowns $\mathbf x,\lambda$); the multiplier $\lambda$ measures how fast the optimum changes as the constraint $c$ is relaxed.`,
      idea: String.raw`Any smooth curve $\mathbf c(t)$ in $\{g=c\}$ through $\mathbf a$ has $\nabla g\cdot\mathbf c'=0$ by 2.8, and, since $\mathbf a$ is an extremum along it, $\frac{d}{dt}f(\mathbf c(t))=\nabla f\cdot\mathbf c'=0$ by the chain rule (2.6). So $\nabla f$ is perpendicular to every tangent vector of the constraint, i.e. to the whole tangent space $\nabla g^\perp$; hence it is parallel to $\nabla g$. Geometrically, the level curve of $f$ touches the constraint tangentially at the optimum.`,
      caption: String.raw`Drag the point along the constraint curve (choose one). The two gradients are drawn at the point; their cross product $\nabla f\times\nabla g$ (orange, right panel) vanishes exactly where $f$ along the curve has a local maximum or minimum. The readout gives the multiplier $\lambda$ and how far $\nabla f$ is from $\lambda\nabla g$ ($0$ at the candidates).`,
      deps: ['vcalc-2.8', 'pma-9.28'],
      refs: ['Marsden–Tromba §3.4'],
      tags: ['lagrange multipliers', 'constrained optimization'],
      viz(v) {
        const f = (x, y) => x * y + 0.35 * x;
        const CON = {
          circle: { label: 'circle', R: () => 1, g: (x, y) => x * x + y * y - 1 },
          ellipse: { label: 'ellipse', R: (t) => 1 / Math.sqrt((Math.cos(t) / 1.3) ** 2 + (Math.sin(t) / 0.8) ** 2), g: (x, y) => (x / 1.3) ** 2 + (y / 0.8) ** 2 - 1 },
          flower: { label: 'flower', R: (t) => 0.85 + 0.2 * Math.cos(3 * t), g: (x, y) => Math.hypot(x, y) - (0.85 + 0.2 * Math.cos(3 * Math.atan2(y, x))) },
        };
        const which = v.select('constraint $g=c$', Object.entries(CON).map(([value, o]) => ({ value, label: o.label })), 'circle');
        const Mp = v.stage({ x: [-1.8, 1.8], y: [-1.35, 1.35], equal: true, axes: 'box', gutter: true, height: 400, weight: 1.15, xlabel: 'x', ylabel: 'y', title: 'level curves of $f=xy+0.35x$ and the constraint' });
        const Fp = v.stage({ x: [0, TAU], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 260, xlabel: 'position $\\tau$ along the constraint', xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π']], title: '$f$ along the curve' });
        const Pt = (o, t) => [o.R(t) * Math.cos(t), o.R(t) * Math.sin(t)];
        let tau = 0.7, crits = [], lastWhich = null;
        const h = Mp.handle(...Pt(CON.circle, 0.7), {
          color: 'gold',
          constrain: (x, y) => {
            const o = CON[which.value]; let best = 0, bd = 1e9;
            for (let i = 0; i < 720; i++) { const t = (TAU * i) / 720, q = Pt(o, t), d = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (d < bd) { bd = d; best = t; } }
            let lo = best - TAU / 720, hi = best + TAU / 720;
            for (let k = 0; k < 40; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3, q1 = Pt(o, m1), q2 = Pt(o, m2); if ((q1[0] - x) ** 2 + (q1[1] - y) ** 2 < (q2[0] - x) ** 2 + (q2[1] - y) ** 2) hi = m2; else lo = m1; }
            tau = ((lo + hi) / 2 + TAU) % TAU; return Pt(o, tau);
          },
        });
        const cross = (o, t) => { const [x, y] = Pt(o, t), a = grad2(f, x, y), b = grad2(o.g, x, y); return a[0] * b[1] - a[1] * b[0]; };
        function findCrits(o) {
          const out = []; const n = 1440; let prev = cross(o, 0);
          for (let i = 1; i <= n; i++) { const t = (TAU * i) / n, c = cross(o, t); if (prev * c < 0) out.push(bisect((s) => cross(o, s), (TAU * (i - 1)) / n, t)); prev = c; }
          return out;
        }
        let ci = 0;
        v.button('next candidate', () => { if (!crits.length) return; ci = (ci + 1) % crits.length; tau = crits[ci]; h.set(...Pt(CON[which.value], tau)); });
        let st = {};
        v.render(() => {
          const o = CON[which.value];
          if (lastWhich !== which.value) { lastWhich = which.value; crits = findCrits(o); tau = Math.min(tau, TAU); h.set(...Pt(o, tau)); }
          tau = ((tau % TAU) + TAU) % TAU;
          const [x, y] = Pt(o, tau), gf = grad2(f, x, y), gg = grad2(o.g, x, y), fc = f(x, y);
          Mp.heat(f, { range: [-1.6, 1.6], cmap: 'theme-diverging', res: 3, key: 'f' });
          Mp.contour(f, Array.from({ length: 17 }, (_, i) => -1.6 + 0.2 * i), { color: 'ink', alpha: 0.25, width: 1 });
          Mp.contour(f, fc, { color: 'gold', width: 2.2, res: 160 });
          Mp.curve((t) => Pt(o, t), 0, TAU, { color: 'ink', width: 3, n: 300 });
          for (const t of crits) { const q = Pt(o, t); Mp.dot(q[0], q[1], { color: 'green', r: 5, hollow: true }); }
          const ng = Math.hypot(gg[0], gg[1]) || 1;
          Mp.arrow(x, y, x + 0.45 * gf[0], y + 0.45 * gf[1], { color: 'accent', width: 3 });
          Mp.arrow(x, y, x + (0.45 * gg[0]) / ng * 1.2, y + (0.45 * gg[1]) / ng * 1.2, { color: 'orange', width: 3 });
          Mp.dot(x, y, { color: 'gold', r: 6.5 });
          Fp.hline(0, { color: 'faint' });
          Fp.fn((t) => f(...Pt(o, t)), { color: 'accent', width: 2.8, n: 400 });
          Fp.fn((t) => cross(o, t) / 2.5, { color: 'orange', width: 2, dash: [6, 4], n: 400 });
          for (const t of crits) Fp.dot(t, f(...Pt(o, t)), { color: 'green', r: 5, hollow: true });
          Fp.vline(tau, { color: 'faint', dash: true });
          Fp.dot(tau, fc, { color: 'gold', r: 6.5 });
          const lam = (gf[0] * gg[0] + gf[1] * gg[1]) / (ng * ng), mis = Math.hypot(gf[0] - lam * gg[0], gf[1] - lam * gg[1]);
          st = { gf, gg, lam, mis, fc, cr: gf[0] * gg[1] - gf[1] * gg[0], ng: crits.length };
        });
        v.legend([['accent', '$\\nabla f$ on the map; $f$ along the curve (right)'], ['orange', '$\\nabla g$ on the map; $\\nabla f\\times\\nabla g\\,/\\,2.5$ (right, dashed)'], ['gold', 'level curve of $f$ through the point'], ['green', 'candidates', { dot: true }]]);
        v.readout(() => `$f=${tf(st.fc, 3)}$, $\\nabla f=${tup(st.gf, 3)}$, $\\nabla g=${tup(st.gg, 3)}$; $\\nabla f\\times\\nabla g=${tf(st.cr, 4)}$. Best $\\lambda=\\dfrac{\\nabla f\\cdot\\nabla g}{|\\nabla g|^2}=${tf(st.lam, 3)}$ with $|\\nabla f-\\lambda\\nabla g|=${tf(st.mis, 4)}$. ${Math.abs(st.cr) < 0.02 ? '**Gradients parallel: a constrained critical point.**' : 'Not parallel: $f$ can still be increased by sliding along the curve.'} (${st.ng} candidates on this curve.)`);
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Theorem',
      name: 'Implicit function theorem (geometric view)',
      credit: 'Cauchy, 1830s; Dini, 1878 (modern form)',
      statement: String.raw`Let $F$ be $C^1$ near $(a,b)\in\R^2$ with $F(a,b)=0$ and $F_y(a,b)\neq0$. Then there are intervals $I\ni a$, $J\ni b$ such that $\{(x,y)\in I\times J:F(x,y)=0\}$ is the graph of a $C^1$ function $y=g(x)$, $g(a)=b$, and $g'(x)=-\dfrac{F_x(x,g(x))}{F_y(x,g(x))}$. Where $F_y=0$ (the tangent is vertical) the level curve need not be a graph over the $x$-axis, and where $\nabla F=\mathbf0$ it need not be a curve at all.`,
      idea: String.raw`If $F_y(a,b)>0$, continuity keeps $F_y>0$ on a small rectangle, so for each fixed $x$ the function $y\mapsto F(x,y)$ is strictly increasing there: it has at most one zero, and the intermediate value theorem (Rudin 4.23) provides one when the signs at the top and bottom of the rectangle are opposite. That gives $g$. Differentiating $F(x,g(x))=0$ with the chain rule (2.6) gives the slope formula. Rudin proves the general $\R^n$ version as 9.28 via the inverse function theorem.`,
      caption: String.raw`Drag the point along the curve $F=0$. The green strip is the widest $x$-interval around it on which the curve is still a single-valued graph (found by marching the solution of $F(x,y)=0$ outward with Newton's method), and the right panel redraws that piece with its tangent. The red dots mark $F_y=0$: as you approach one, the strip collapses and the slope $-F_x/F_y$ blows up. At the orange ring $\nabla F=\mathbf0$ and the theorem has nothing to say.`,
      deps: ['vcalc-2.8', 'pma-9.28'],
      refs: ['Marsden–Tromba §3.5'],
      tags: ['implicit function', 'level curves'],
      viz(v) {
        const FS = {
          circle: { label: 'circle', F: (x, y) => x * x + y * y - 1, Fx: (x, y) => 2 * x, Fy: (x, y) => 2 * y, p0: [0.75, Math.sqrt(1 - 0.5625)], sing: [], x: [-1.9, 1.9], y: [-1.45, 1.45] },
          cubic: { label: '$y^3-3y=x$', F: (x, y) => y ** 3 - 3 * y - x, Fx: () => -1, Fy: (x, y) => 3 * y * y - 3, p0: [0.5, 0.17], sing: [], x: [-3.2, 3.2], y: [-2.3, 2.3] },
          folium: { label: 'folium', F: (x, y) => x ** 3 + y ** 3 - 3 * x * y, Fx: (x, y) => 3 * x * x - 3 * y, Fy: (x, y) => 3 * y * y - 3 * x, p0: [1.2, 1.2], sing: [[0, 0]], x: [-2.4, 2.4], y: [-1.9, 1.9] },
          lemn: { label: 'lemniscate', F: (x, y) => (x * x + y * y) ** 2 - 2 * (x * x - y * y), Fx: (x, y) => 4 * x * (x * x + y * y) - 4 * x, Fy: (x, y) => 4 * y * (x * x + y * y) + 4 * y, p0: [1.228, 0.38], sing: [[0, 0]], x: [-1.9, 1.9], y: [-1.45, 1.45] },
        };
        const which = v.select('curve $F=0$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'circle');
        const Mp = v.stage({ x: [-1.9, 1.9], y: [-1.45, 1.45], equal: true, axes: true, height: 400, weight: 1.2, title: 'the curve $F(x,y)=0$' });
        const Lp = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 240, xlabel: '$x-x_0$', ylabel: '$y-y_0$', title: 'the local graph $y=g(x)$' });
        let cur = null, vfy = [], lastW = null;
        const proj = (o, x, y) => {
          for (let k = 0; k < 40; k++) { const F = o.F(x, y), gx = o.Fx(x, y), gy = o.Fy(x, y), n2 = gx * gx + gy * gy; if (n2 < 1e-12) break; x -= (F * gx) / n2; y -= (F * gy) / n2; if (Math.abs(F) < 1e-13) break; }
          return [x, y];
        };
        const h = Mp.handle(...FS.circle.p0, { color: 'gold', constrain: (x, y) => proj(FS[which.value], x, y) });
        const yAt = (o, x, y0, tol = 0.03) => {
          let y = y0;
          for (let k = 0; k < 40; k++) { const d = o.Fy(x, y); if (Math.abs(d) < 1e-9) return null; const dy = o.F(x, y) / d; y -= dy; if (Math.abs(dy) < 1e-13) break; }
          return Math.abs(o.F(x, y)) < 1e-9 && Math.abs(o.Fy(x, y)) > tol ? y : null;
        };
        function branch(o, x0, y0) {
          const out = { L: [], R: [] };
          for (const [key, sgn] of [['L', -1], ['R', 1]]) {
            let x = x0, y = y0;
            for (let k = 0; k < 900; k++) {
              const xn = x0 + sgn * (k + 1) * 0.005, yn = yAt(o, xn, y);
              if (yn == null || Math.abs(yn - y) > 0.08) break;
              out[key].push([xn, yn]); x = xn; y = yn;
            }
          }
          return out;
        }
        function foldPoints(o) {
          const segs = levelSegs(o.F, o.x, o.y, 0, 160), pts = [];
          for (const [p, q] of segs) {
            const a = o.Fy(...p), b = o.Fy(...q);
            if (a * b < 0) { const t = bisect((s) => o.Fy(p[0] + s * (q[0] - p[0]), p[1] + s * (q[1] - p[1])), 0, 1); const r = proj(o, p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])); if (!pts.some((z) => Math.hypot(z[0] - r[0], z[1] - r[1]) < 0.05)) pts.push(r); }
          }
          return pts;
        }
        let st = {};
        v.render(() => {
          const o = FS[which.value];
          if (lastW !== which.value) { lastW = which.value; Mp.setView(o.x, o.y); vfy = foldPoints(o); h.set(...proj(o, ...o.p0)); }
          const [x0, y0] = proj(o, h.x, h.y), Fx = o.Fx(x0, y0), Fy = o.Fy(x0, y0);
          Mp.contour(o.F, 0, { color: 'accent', width: 2.4, res: 240 });
          for (const q of vfy) Mp.dot(q[0], q[1], { color: 'red', r: 5.5 });
          for (const q of o.sing) Mp.dot(q[0], q[1], { color: 'orange', r: 7, hollow: true });
          const br = Math.abs(Fy) > 1e-6 ? branch(o, x0, y0) : { L: [], R: [] };
          const xl = br.L.length ? br.L[br.L.length - 1][0] : x0, xr = br.R.length ? br.R[br.R.length - 1][0] : x0;
          if (xr > xl) Mp.vband(xl, xr, { color: 'green', alpha: 0.12 });
          const gr = [...br.L.slice().reverse(), [x0, y0], ...br.R];
          Mp.path(gr, { color: 'green', width: 4 });
          if (Math.abs(Fy) > 1e-6) { const m = -Fx / Fy; Mp.line(x0 - 0.5, y0 - 0.5 * m, x0 + 0.5, y0 + 0.5 * m, { color: 'orange', width: 1.8, alpha: 0.9 }); }
          Mp.dot(x0, y0, { color: 'gold', r: 6.5 });
          // local graph panel
          const W = Math.max(xr - xl, 0.05) / 2, ys = gr.map((p) => p[1] - y0), Hh = Math.max(0.1, ...ys.map(Math.abs)) * 1.15, R = Math.max(W * 1.1, Hh, 0.06);
          Lp.setView([-R, R], [-R, R]);
          Lp.path(gr.map((p) => [p[0] - x0, p[1] - y0]), { color: 'green', width: 3.5 });
          if (Math.abs(Fy) > 1e-6) { const m = -Fx / Fy; Lp.line(-R, -R * m, R, R * m, { color: 'orange', width: 1.6, dash: [5, 4] }); }
          Lp.dot(0, 0, { color: 'gold', r: 6 });
          const e = 1e-4, yp = Math.abs(Fy) > 1e-6 ? yAt(o, x0 + e, y0, 0) : null, ym = Math.abs(Fy) > 1e-6 ? yAt(o, x0 - e, y0, 0) : null;
          st = { x0, y0, Fx, Fy, m: -Fx / Fy, fd: yp != null && ym != null ? (yp - ym) / (2 * e) : null, w: xr - xl, grad: Math.hypot(Fx, Fy) };
        });
        v.legend([['accent', '$F=0$'], ['green', 'local graph over the strip'], ['orange', 'tangent'], ['red', '$F_y=0$', { dot: true }]]);
        v.readout(() => st.grad < 1e-3 ? 'Here $\\nabla F=\\mathbf 0$: a singular point of the curve (a crossing); no function $y=g(x)$ describes it.'
          : Math.abs(st.Fy) < 1e-3 ? `$F_y=${tf(st.Fy, 4)}\\approx0$: a **vertical tangent**; the slope $-F_x/F_y$ is infinite and the curve is not a graph over any interval around this $x_0$.`
          : `At $(${tf(st.x0, 3)},${tf(st.y0, 3)})$: $F_x=${tf(st.Fx, 3)}$, $F_y=${tf(st.Fy, 3)}$, so $g'=-F_x/F_y=${tf(st.m, 4)}$. Slope found by re-solving $F(x,y)=0$ at $x_0\\pm10^{-4}$: $${st.fd == null ? '?' : tf(st.fd, 4)}$. The curve is a single-valued graph over a strip of width $${tf(st.w, 3)}$ around $x_0$.`);
      },
    },
  ],
};
