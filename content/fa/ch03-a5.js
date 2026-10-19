// Rudin, Functional Analysis — Chapter 3 (part 5): vector-valued integration and holomorphic functions, 3.26–3.32

const d2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Maximum-entropy probability weights on the points Q with barycentre y (Newton's method on the dual). */
function gibbs(Q, y, iters = 80) {
  let lam = [0, 0], w = Q.map(() => 1 / Q.length), err = Infinity;
  for (let it = 0; it < iters; it++) {
    const e = Q.map((q) => lam[0] * q[0] + lam[1] * q[1]), mx = Math.max(...e);
    w = e.map((z) => Math.exp(z - mx)); const Z = w.reduce((a, b) => a + b, 0); w = w.map((z) => z / Z);
    let m0 = 0, m1 = 0; Q.forEach((q, i) => { m0 += w[i] * q[0]; m1 += w[i] * q[1]; });
    let c00 = 0, c01 = 0, c11 = 0; Q.forEach((q, i) => { const a = q[0] - m0, b = q[1] - m1; c00 += w[i] * a * a; c01 += w[i] * a * b; c11 += w[i] * b * b; });
    const g = [m0 - y[0], m1 - y[1]]; err = Math.hypot(g[0], g[1]);
    if (err < 1e-11) break;
    const det = c00 * c11 - c01 * c01; if (det < 1e-16) break;
    let st = [(c11 * g[0] - c01 * g[1]) / det, (-c01 * g[0] + c00 * g[1]) / det];
    const L = Math.hypot(st[0], st[1]); if (L > 4) st = [st[0] * 4 / L, st[1] * 4 / L];
    lam = [lam[0] - st[0], lam[1] - st[1]];
  }
  return { w, lam, err };
}

export default {
  collection: 'fa',
  chapter: 3,
  items: [
    {
      num: '3.26',
      kind: 'Definition',
      name: 'Weak integral of a vector-valued function',
      statement: String.raw`Let $\mu$ be a measure on a measure space $Q$, let $X$ be a topological vector space on which $X^*$ separates points, and let $f:Q\to X$ be such that $\Lambda f$ is $\mu$-integrable for every $\Lambda\in X^*$. If there is $y\in X$ with
$$\Lambda y=\int_Q(\Lambda f)\,d\mu\qquad\text{for every }\Lambda\in X^*,$$
we write $y=\int_Qf\,d\mu$. Such a $y$ is unique, because $X^*$ separates points.`,
      idea: String.raw`The integral is defined by testing against all continuous functionals rather than by Riemann or Lebesgue sums in $X$. The question is then existence: 3.27 and 3.29 guarantee it when the closed convex hull of the range is compact, e.g. for continuous $f$ into a Fréchet space.`,
      caption: String.raw`$X=C[0,1]$ and $f(t)=$ the bump $s\mapsto e^{-((s-t)/w)^2}$ centred at $t\in Q=[0,1]$. The gold curves are some values $f(t)$ (fainter where $\mu$ has little mass); the blue curve is $y=\int f\,d\mu$, computed as a limit of Riemann sums in the sup norm. The readout tests $y$ against two functionals — the point evaluation $\delta_s$ (drag $s$) and $h\mapsto\int_0^1h(s)\sin(\pi s)\,ds$ — and checks $\Lambda y=\int\Lambda f\,d\mu$, integrating in the other order.`,
      deps: ['fa-3.4a'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §3.26, pp. 77–78'],
      tags: ['vector integration', 'weak integral'],
      viz(v) {
        const M = v.M;
        const MU = {
          leb: { label: 'Lebesgue', dens: () => 1 },
          lin: { label: 'density $2t$', dens: (t) => 2 * t },
          two: { label: '$\\tfrac12(\\delta_{0.25}+\\delta_{0.7})$', atoms: [[0.25, 0.5], [0.7, 0.5]] },
        };
        const mu = v.select('$\\mu=$', Object.entries(MU).map(([value, o]) => ({ value, label: o.label })), 'lin');
        const wS = v.slider('bump width $w$', 0.06, 0.4, 0.2, { step: 0.01 });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.12, 1.15], height: 280, full: true, axes: 'box', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [0, 0.5, 1], title: 'values in $X=C[0,1]$: some $f(t)$ (gold) and $y=\\int_Q f\\,d\\mu$ (blue)' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-0.25, 2.3], height: 110, full: true, axes: 'box', xticks: [0.2, 0.4, 0.6, 0.8, 1], yticks: [0, 1, 2], title: 'the measure $\\mu$ on $Q=[0,1]$' });
        const s = top.handle(0.45, 0, { color: 'green', constrain: (x) => [M.clamp(x, 0, 1), 0] });
        const g = (x) => Math.sin(Math.PI * x);
        let st = {};
        v.render(() => {
          const m = MU[mu.value], w = wS.value;
          const f = (t) => (x) => Math.exp(-(((x - t) / w) ** 2));
          // y via Riemann sums in X (on a grid of s-values), N = 400
          const xs = M.linspace(0, 1, 201);
          let y;
          if (m.atoms) y = xs.map((x) => M.sum(m.atoms, ([t, a]) => a * f(t)(x)));
          else { const N = 400; y = xs.map(() => 0); for (let k = 0; k < N; k++) { const t = (k + 0.5) / N, a = m.dens(t) / N; xs.forEach((x, i) => { y[i] += a * f(t)(x); }); } }
          const ts = m.atoms ? m.atoms.map((a) => a[0]) : M.range(10).map((k) => 0.05 + 0.1 * k);
          const dmax = m.atoms ? 1 : Math.max(...ts.map(m.dens));
          ts.forEach((t) => top.fn(f(t), { domain: [0, 1], color: 'gold', width: 1.3, alpha: 0.25 + 0.65 * (m.atoms ? 1 : m.dens(t) / dmax) }));
          top.path(xs.map((x, i) => [x, y[i]]), { color: 'blue', width: 3 });
          const yi = (x) => { const u = x * 200, i = Math.min(199, Math.floor(u)); return y[i] + (y[i + 1] - y[i]) * (u - i); };
          top.vline(s.x, { color: 'green', width: 1, dash: [3, 3] });
          top.dot(s.x, yi(s.x), { color: 'green', r: 5, label: 'y(s)', labelPos: 'ne' });
          // the measure
          if (m.atoms) m.atoms.forEach(([t, a]) => { bot.line(t, 0, t, 2 * a, { color: 'orange', width: 3 }); bot.dot(t, 2 * a, { color: 'orange', r: 4.5 }); });
          else bot.fn(m.dens, { domain: [0, 1], color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.2 });
          bot.hline(0, { color: 'faint', width: 1 });
          // the two tests, integrating in the other order
          const inner = (t) => M.integrate((x) => f(t)(x) * g(x), 0, 1, 200);
          const rhsS = m.atoms ? M.sum(m.atoms, ([t, a]) => a * f(t)(s.x)) : M.integrate((t) => m.dens(t) * f(t)(s.x), 0, 1, 400);
          const rhsG = m.atoms ? M.sum(m.atoms, ([t, a]) => a * inner(t)) : M.integrate((t) => m.dens(t) * inner(t), 0, 1, 120);
          const lhsG = M.integrate((x) => yi(x) * g(x), 0, 1, 200);
          st = { s: s.x, lhsS: yi(s.x), rhsS, lhsG, rhsG };
        });
        v.legend([['gold', 'values $f(t)$ (opacity $\\propto$ density of $\\mu$)'], ['blue', '$y=\\int f\\,d\\mu\\in C[0,1]$'], ['orange', '$\\mu$', { area: true }]]);
        v.readout(() => `$\\delta_s y = y(${v.fix(st.s, 2)}) = ${v.fix(st.lhsS, 4)}$ and $\\int\\delta_s f\\,d\\mu = ${v.fix(st.rhsS, 4)}$; $\\;\\Lambda_g y = \\int y\\,g = ${v.fix(st.lhsG, 4)}$ and $\\int\\Lambda_g f\\,d\\mu = ${v.fix(st.rhsG, 4)}$ (with $g(s)=\\sin\\pi s$).`);
      },
    },
    {
      num: '3.27',
      kind: 'Theorem',
      name: 'Existence of the weak integral in the closed convex hull',
      statement: String.raw`Let $X$ be a topological vector space on which $X^*$ separates points, and $\mu$ a Borel probability measure on a compact Hausdorff space $Q$. If $f:Q\to X$ is continuous and $\overline{\co}(f(Q))$ is compact, then $y=\int_Qf\,d\mu$ exists, and $y\in\overline{\co}(f(Q))$.`,
      idea: String.raw`Put $H=\overline{\co}(f(Q))$ and, for each finite set $L\subset X^*$, let $E_L=\{y\in H:\Lambda y=\int\Lambda f\,d\mu\ \forall\Lambda\in L\}$. Each $E_L$ is compact; it is nonempty because otherwise the vector $m=(\int\Lambda f\,d\mu)_{\Lambda\in L}$ would lie outside the compact convex set $T(H)\subset\R^n$ ($T=(\Lambda)_{\Lambda\in L}$), and a functional on $\R^n$ separating $m$ from $T(H)$ would give a combination $\Lambda'$ with $\int\Lambda'f\,d\mu>\max_H\Lambda'$, impossible for a probability measure. The $E_L$ have the finite intersection property, so they meet; any common point is the integral.`,
      caption: String.raw`$Q=[0,1]$, $f$ a curve in $X=\R^2$ (gold, thicker where $\mu$ has more mass), and its convex hull. The Riemann sums $y_N=\sum_k\mu(I_k)f(t_k)$ are convex combinations of points of $f(Q)$ (dots sized by weight) and converge to the integral $y$ (green). For the functional $\Lambda$ (direction slider), $\Lambda y=\int\Lambda f\,d\mu\le\max_{f(Q)}\Lambda$: the dashed level line through $y$ never leaves the hull — that inequality is why $y\in\overline{\co}(f(Q))$.`,
      deps: ['fa-3.26', 'fa-3.4', 'fa-3.19'],
      tags: ['vector integration', 'convexity'],
      viz(v) {
        const M = v.M;
        const CUR = {
          spiral: { label: 'spiral', f: (t) => { const r = 0.25 + 1.15 * t, a = 4 * Math.PI * t; return [r * Math.cos(a), r * Math.sin(a)]; } },
          eight: { label: 'figure eight', f: (t) => [1.5 * Math.sin(2 * Math.PI * t), 0.95 * Math.sin(4 * Math.PI * t)] },
          hook: { label: 'hook', f: (t) => [1.6 * Math.cos(1.6 * Math.PI * t) - 0.2, 1.1 * Math.sin(1.6 * Math.PI * t) - 0.2 + 0.6 * t] },
        };
        const MU = { uni: { label: 'uniform', d: () => 1 }, late: { label: '$3t^2$', d: (t) => 3 * t * t }, early: { label: '$3(1-t)^2$', d: (t) => 3 * (1 - t) ** 2 } };
        const cur = v.select('$f=$', Object.entries(CUR).map(([value, o]) => ({ value, label: o.label })), 'spiral');
        const mu = v.select('$d\\mu/dt=$', Object.entries(MU).map(([value, o]) => ({ value, label: o.label })), 'late');
        const NS = v.slider('Riemann sum $N$', 1, 30, 6, { int: true });
        const aS = v.slider('direction of $\\Lambda$', 0, 360, 35, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.55, 1.55], equal: true, height: 400, ticks: false });
        let st = {};
        v.render(() => {
          const f = CUR[cur.value].f, d = MU[mu.value].d, N = NS.value;
          const ts = M.linspace(0, 1, 401), P = ts.map(f), H = M.hull(P);
          const y = [M.integrate((t) => d(t) * f(t)[0], 0, 1, 800), M.integrate((t) => d(t) * f(t)[1], 0, 1, 800)];
          const riem = (n) => { let a = [0, 0]; const pts = []; for (let k = 0; k < n; k++) { const t0 = k / n, t1 = (k + 1) / n, wgt = M.integrate(d, t0, t1, 40), p = f((t0 + t1) / 2); a = [a[0] + wgt * p[0], a[1] + wgt * p[1]]; pts.push([p, wgt]); } return { a, pts }; };
          S.poly(H, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 1.4, dash: [5, 4] });
          const dm = Math.max(...ts.map(d));
          for (let i = 0; i + 1 < P.length; i++) S.line(P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], { color: 'gold', width: 1 + 4 * d(ts[i]) / dm });
          const trail = M.range(30, 1).map((n) => riem(n).a);
          S.path(trail, { color: 'green', width: 1.2, alpha: 0.6 });
          const R = riem(N);
          R.pts.forEach(([p, wgt]) => S.dot(p[0], p[1], { color: 'orange', r: 2.5 + 14 * Math.sqrt(wgt) }));
          S.dot(R.a[0], R.a[1], { color: 'orange', r: 4, label: `y${String(N).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('')}`, labelPos: 'sw' });
          const th = aS.value * Math.PI / 180, L = [Math.cos(th), Math.sin(th)], tg = [-L[1], L[0]];
          const Ly = d2(L, y), mx = Math.max(...P.map((p) => d2(L, p)));
          S.line(Ly * L[0] - 5 * tg[0], Ly * L[1] - 5 * tg[1], Ly * L[0] + 5 * tg[0], Ly * L[1] + 5 * tg[1], { color: 'green', width: 1.3, dash: [5, 4] });
          S.line(mx * L[0] - 5 * tg[0], mx * L[1] - 5 * tg[1], mx * L[0] + 5 * tg[0], mx * L[1] + 5 * tg[1], { color: 'muted', width: 1.2, dash: [2, 3] });
          S.arrow(y[0], y[1], y[0] + 0.45 * L[0], y[1] + 0.45 * L[1], { color: 'green', width: 1.8, head: 8 });
          S.dot(y[0], y[1], { color: 'green', r: 6.5, label: 'y', labelPos: 'ne' });
          const intL = M.integrate((t) => d(t) * d2(L, f(t)), 0, 1, 800);
          st = { Ly, intL, mx, err: M.dist(R.a, y), N, inH: M.pointInPoly(y, H) };
        });
        v.legend([['gold', '$f(Q)$, width $\\propto d\\mu/dt$'], ['blue', '$\\co f(Q)$', { dash: true }], ['orange', 'Riemann sum $y_N$ and its weights', { dot: true }], ['green', '$y=\\int f\\,d\\mu$; level line of $\\Lambda$ through $y$']]);
        v.readout(() => `$\\Lambda y = ${v.fix(st.Ly, 4)}$, $\\int\\Lambda f\\,d\\mu = ${v.fix(st.intL, 4)}$, $\\max_{f(Q)}\\Lambda = ${v.fix(st.mx, 3)}$; $\\;|y_{${st.N}}-y| = ${v.fix(st.err, 4)}$; $y\\in\\co f(Q)$: ${st.inH ? 'yes' : 'no'}.`);
      },
    },
    {
      num: '3.28',
      kind: 'Theorem',
      name: 'Points of the closed convex hull are barycentres',
      statement: String.raw`Let $X$ be a topological vector space on which $X^*$ separates points, $Q\subset X$ compact, and suppose $H=\overline{\co}(Q)$ is compact. Then $y\in H$ if and only if there is a regular Borel probability measure $\mu$ on $Q$ with
$$y=\int_Qx\,d\mu(x).$$`,
      idea: String.raw`If $y$ is such a barycentre, 3.27 (with $f$ the identity of $Q$) puts it in $H$. Conversely, points of $\co(Q)$ are barycentres of finitely supported measures; a general $y\in H$ is a limit of such points, the corresponding probability measures have a weak$^*$ cluster point $\mu$ in $C(Q)^*$ (Banach–Alaoglu plus the Riesz representation), and continuity of $\Lambda$ on $Q$ gives $\Lambda y=\int\Lambda\,d\mu$ for every $\Lambda\in X^*$.`,
      caption: String.raw`Drag $y$. Inside the hull of $Q$ the picture shows one representing measure — the maximum-entropy one, $\mu\propto e^{\langle\lambda,x\rangle}$, found by Newton's method — as dot sizes (seven points) or as a density around the circle. Outside the hull no measure works: the line shows a functional $\Lambda$ with $\Lambda y>\max_Q\Lambda\ge\int\Lambda\,d\mu$ for every probability measure $\mu$ on $Q$.`,
      deps: ['fa-3.27', 'fa-3.15', 'rca-2.14'],
      tags: ['vector integration', 'barycentres', 'convexity'],
      viz(v) {
        const M = v.M;
        const mode = v.select('$Q=$', [{ value: 'pts', label: 'seven points' }, { value: 'circ', label: 'a circle' }], 'pts');
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.6, 1.6], equal: true, height: 380, ticks: false, axes: false });
        const R = v.rng(5);
        const Qh = M.range(7).map((i) => { const t = M.TAU * i / 7 + R.uniform(-0.25, 0.25), r = R.uniform(0.95, 1.4); return S.handle(1.15 * r * Math.cos(t), r * Math.sin(t), { color: 'purple', r: 5.5 }); });
        const y = S.handle(0.35, 0.25, { color: 'green', label: 'y' });
        let st = {};
        v.render(() => {
          const circ = mode.value === 'circ';
          Qh.forEach((h) => { h.visible = !circ; });
          const Q = circ ? M.range(180).map((i) => [1.2 * Math.cos(M.TAU * i / 180), 1.2 * Math.sin(M.TAU * i / 180)]) : Qh.map((h) => [h.x, h.y]);
          const H = M.hull(Q), Y = [y.x, y.y];
          let edgeDist = Infinity; for (let i = 0; i < H.length; i++) edgeDist = Math.min(edgeDist, M.dist(Y, M.closestOnSegment(Y, H[i], H[(i + 1) % H.length])));
          const inside = M.pointInPoly(Y, H) && edgeDist > 1e-3;
          S.poly(H, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.3, dash: [5, 4] });
          if (inside) {
            const G = gibbs(Q, Y);
            if (circ) {
              const outer = Q.map((q, i) => { const k = 1 + Math.min(0.55, 25 * G.w[i]); return [q[0] * k, q[1] * k]; });
              S.rings([outer, Q.slice().reverse()], { fill: 'orange', fillAlpha: 0.35, stroke: false });
              S.path(outer.concat([outer[0]]), { color: 'orange', width: 1.6 });
              S.path(Q.concat([Q[0]]), { color: 'purple', width: 2.5 });
            } else {
              Q.forEach((q, i) => { S.line(Y[0], Y[1], q[0], q[1], { color: 'orange', width: 0.6 + 6 * G.w[i], alpha: 0.55 }); S.dot(q[0], q[1], { color: 'orange', r: 5 + 26 * Math.sqrt(G.w[i]), alpha: 0.55 }); S.text(v.fix(G.w[i], 2), q[0], q[1], { color: 'ink', size: 11.5, dy: -18, align: 'center' }); });
            }
            const bc = [M.sum(Q, (q, i) => G.w[i] * q[0]), M.sum(Q, (q, i) => G.w[i] * q[1])];
            st = { inside, err: M.dist(bc, Y), bc, circ };
          } else {
            if (circ) S.path(Q.concat([Q[0]]), { color: 'purple', width: 2.5 });
            const q = M.closestOnConvexPoly(Y, H), n = M.normalize([Y[0] - q[0], Y[1] - q[1]]), t = [-n[1], n[0]];
            const mx = Math.max(...Q.map((z) => d2(n, z)));
            S.line(mx * n[0] - 6 * t[0], mx * n[1] - 6 * t[1], mx * n[0] + 6 * t[0], mx * n[1] + 6 * t[1], { color: 'red', width: 2 });
            S.arrow(q[0], q[1], q[0] + 0.4 * n[0], q[1] + 0.4 * n[1], { color: 'red', width: 1.6, head: 8 });
            st = { inside, gap: d2(n, Y) - mx, circ };
          }
          S.corner(inside ? 'y is the barycentre of μ' : 'y ∉ co(Q): no representing measure', 'tl', { color: inside ? 'green' : 'red', weight: 600 });
        });
        v.legend([['purple', '$Q$'], ['blue', '$\\overline{\\co}(Q)$', { dash: true }], ['orange', 'a representing measure $\\mu$', { area: true }], ['red', 'separating functional (when $y\\notin H$)']]);
        v.readout(() => st.inside
          ? `$\\int_Q x\\,d\\mu(x) = (${v.fix(st.bc[0], 4)},\\,${v.fix(st.bc[1], 4)})$ $= y$ (error $${st.err < 1e-9 ? '<10^{-9}' : v.fmt(st.err, 2)}$); $\\mu$ is a probability measure on $Q$${st.circ ? ' (a von Mises density)' : ''}.`
          : `$\\Lambda y-\\max_Q\\Lambda = ${v.fix(st.gap, 3)}>0$, while $\\int\\Lambda\\,d\\mu\\le\\max_Q\\Lambda$ for every probability measure $\\mu$ on $Q$: $y$ is not a barycentre.`);
      },
    },
    {
      num: '3.29',
      kind: 'Theorem',
      name: 'Vector integrals in Fréchet and Banach spaces',
      statement: String.raw`Let $Q$ be a compact Hausdorff space, $X$ a Fréchet space, $f:Q\to X$ continuous, and $\mu$ a finite positive Borel measure on $Q$. Then $y=\int_Qf\,d\mu$ exists. If $X$ is a Banach space, moreover
$$\Big\|\int_Qf\,d\mu\Big\|\le\int_Q\|f\|\,d\mu .$$`,
      idea: String.raw`$f(Q)$ is compact, so by 3.20(c) its closed convex hull is compact in the Fréchet space $X$, and 3.27 (after normalising $\mu$) gives existence. For the estimate, Hahn–Banach provides $\Lambda\in X^*$ with $\|\Lambda\|\le1$ and $\Lambda y=\|y\|$; then $\|y\|=\Lambda y=\int\Lambda f\,d\mu\le\int\|f\|\,d\mu$.`,
      caption: String.raw`$X=(\R^2,\|\cdot\|_p)$ and $f:[0,1]\to X$ a looping curve (gold) with Lebesgue measure; the winding slider makes it cancel more. Left: $y=\int f$ (blue), the ball of radius $\|y\|$ (blue) with the norming functional's supporting line at $y$, and the ball of radius $\int\|f\|$ (green, dashed), which always contains $y$. Right: the proof — $\Lambda f(t)\le\|f(t)\|$ pointwise, and the areas under the two curves are $\|y\|$ and $\int\|f\|$.`,
      deps: ['fa-3.27', 'fa-3.20', 'fa-3.3'],
      refs: ['Rudin, Functional Analysis, 2nd ed., §3.29, pp. 81'],
      tags: ['vector integration', 'Banach spaces', 'norm inequality'],
      viz(v) {
        const M = v.M;
        const pS = v.select('norm', [{ value: 1, label: '$\\ell^1$' }, { value: 2, label: '$\\ell^2$' }, { value: Infinity, label: '$\\ell^\\infty$' }], 2);
        const wS = v.slider('winding $\\omega$', 0, 2.5, 0.45, { step: 0.01 });
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.6], equal: true, height: 340, ticks: false, title: 'the curve $f(t)$ and its integral $y$' });
        const Rt = v.stage({ x: [0, 1], y: [-1.6, 1.6], height: 340, axes: 'box', xticks: [0, 0.5, 1], xlabel: 't', title: '$\\Lambda f(t)$ (blue) $\\le\\|f(t)\\|$ (gold)' });
        let st = {};
        v.render(() => {
          const p = pS.value, om = wS.value;
          const f = (t) => { const r = 0.85 + 0.28 * Math.cos(6 * Math.PI * t), a = 2 * Math.PI * om * t + 0.4; return [0.2 + r * Math.cos(a), 0.08 + r * Math.sin(a)]; };
          const nf = (t) => M.norm(f(t), p);
          const y = [M.integrate((t) => f(t)[0], 0, 1, 800), M.integrate((t) => f(t)[1], 0, 1, 800)];
          const ny = M.norm(y, p), I = M.integrate(nf, 0, 1, 800);
          let Lam;
          if (p === 2) Lam = [y[0] / ny, y[1] / ny];
          else if (p === 1) Lam = [Math.sign(y[0]) || 1, Math.sign(y[1]) || 1];
          else Lam = Math.abs(y[0]) >= Math.abs(y[1]) ? [Math.sign(y[0]), 0] : [0, Math.sign(y[1])];
          L.ball(0, 0, I, { p, color: 'green', width: 1.6, dash: [6, 4], fill: 'green', fillAlpha: 0.05 });
          L.ball(0, 0, ny, { p, color: 'blue', width: 1.6, fill: 'blue', fillAlpha: 0.12 });
          L.curve(f, 0, 1, { color: 'gold', width: 2.4, n: 400 });
          for (const t of [0.15, 0.45, 0.75]) { const a = f(t), b = f(t + 0.01); L.arrow(a[0], a[1], b[0], b[1], { color: 'gold', head: 9, width: 2 }); }
          const tg = [-Lam[1], Lam[0]], nl = d2(Lam, Lam);
          const P0 = [Lam[0] * ny / nl, Lam[1] * ny / nl];
          L.line(P0[0] - 5 * tg[0], P0[1] - 5 * tg[1], P0[0] + 5 * tg[0], P0[1] + 5 * tg[1], { color: 'blue', width: 1.3, dash: [5, 4] });
          L.dot(y[0], y[1], { color: 'blue', r: 6, label: 'y', labelPos: 'ne' });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          Rt.setView(null, [Math.min(-0.3, ...M.linspace(0, 1, 100).map((t) => d2(Lam, f(t)))) - 0.15, Math.max(...M.linspace(0, 1, 100).map(nf)) + 0.25]);
          Rt.fn(nf, { domain: [0, 1], color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.15 });
          Rt.fn((t) => d2(Lam, f(t)), { domain: [0, 1], color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.15 });
          Rt.hline(0, { color: 'faint', width: 1 });
          st = { ny, I, Ly: d2(Lam, y), p };
        });
        v.legend([['gold', '$f$ and $\\|f(t)\\|$'], ['blue', '$y$, ball of radius $\\|y\\|$, norming $\\Lambda$'], ['green', 'ball of radius $\\int\\|f\\|$', { dash: true }]]);
        v.readout(() => `$\\|y\\|_{${st.p === Infinity ? '\\infty' : st.p}} = \\Lambda y = \\int\\Lambda f = ${v.fix(st.ny, 4)}\\ \\le\\ \\int_0^1\\|f(t)\\|\\,dt = ${v.fix(st.I, 4)}$ (ratio $${v.fix(st.ny / st.I, 3)}$; equality would need all $f(t)$ to point the same way).`);
      },
    },
    {
      num: '3.30',
      kind: 'Definition',
      name: 'Weakly and strongly holomorphic functions',
      statement: String.raw`Let $\Omega\subset\C$ be open and $X$ a complex topological vector space. A function $f:\Omega\to X$ is **weakly holomorphic** if $\Lambda f$ is holomorphic in $\Omega$ for every $\Lambda\in X^*$, and **strongly holomorphic** if for every $z\in\Omega$ the difference quotients $\dfrac{f(w)-f(z)}{w-z}$ converge in the topology of $X$ as $w\to z$. Strongly holomorphic functions are weakly holomorphic.`,
      idea: String.raw`Weak holomorphy only asks every scalar "measurement" of $f$ to be holomorphic; strong holomorphy asks for a derivative in $X$ itself. Theorem 3.31 shows the two notions agree when $X$ is a Fréchet space.`,
      caption: String.raw`$X=C[0,1]$ (complex-valued, sup norm) and $f(z)=\big(s\mapsto 1/(1-zs)\big)$ on the unit disc $\Omega$. Left: the phase portrait of the scalar function $\Lambda f(z)=1/(1-zs_0)$ for $\Lambda=\delta_{s_0}$ — holomorphic, with its pole at $1/s_0$ outside $\Omega$. Right: real parts of the difference quotient $(f(z+h)-f(z))/h$ (gold) and of $f'(z)=\big(s\mapsto s/(1-zs)^2\big)$ (green) as functions of $s$. Drag $z$ and shrink $h$: the sup-norm gap goes to $0$, so $f$ is strongly holomorphic.`,
      deps: [],
      tags: ['holomorphic functions', 'vector-valued functions'],
      viz(v) {
        const M = v.M, Cx = v.Cx;
        const sS = v.slider('$s_0$ in $\\Lambda=\\delta_{s_0}$', 0.3, 1, 0.75, { step: 0.01 });
        const hS = v.slider('$\\log_{10}|h|$', -4, -0.5, -1, { step: 0.05 });
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.45, 1.45], equal: true, height: 330, ticks: false, axes: false, title: 'phase portrait of $\\Lambda f(z)=1/(1-zs_0)$' });
        const R = v.stage({ x: [0, 1], y: [-1, 1], height: 330, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], xlabel: 's', title: '$\\Re$ of $(f(z+h)-f(z))/h$ and of $f\'(z)$ in $C[0,1]$' });
        const z = L.handle(0.45, 0.3, { color: 'ink', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.85 ? [0.85 * x / r, 0.85 * y / r] : [x, y]; } });
        const one = new Cx(1, 0);
        const F = (zz, s) => one.div(one.sub(zz.scale(s)));
        const dF = (zz, s) => { const q = one.sub(zz.scale(s)); return new Cx(s, 0).div(q.mul(q)); };
        let st = {};
        v.render(() => {
          const s0 = sS.value, zz = new Cx(z.x, z.y), h = Cx.polar(Math.pow(10, hS.value), 0.7);
          L.domain((w) => one.div(one.sub(w.scale(s0))), { key: `s${s0}`, res: 2 });
          L.circle(0, 0, 1, { color: 'panel', width: 4 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6, dash: [6, 4] });
          L.tex('\\Omega', -0.72, -0.72, { color: 'ink', size: 16 });
          const pole = 1 / s0;
          if (pole < 1.7) L.dot(pole, 0, { color: 'ink', r: 4.5, hollow: true, label: 'pole', labelPos: 'n' });
          const zh = zz.add(h);
          L.line(zz.re, zz.im, zh.re, zh.im, { color: 'gold', width: 2.2 });
          const xs = M.linspace(0, 1, 201);
          const Dh = xs.map((s) => F(zh, s).sub(F(zz, s)).div(h)), D = xs.map((s) => dF(zz, s));
          const all = D.map((q) => q.re).concat(Dh.map((q) => q.re)).concat(D.map((q) => q.im));
          const lo = Math.min(...all), hi = Math.max(...all), pad = 0.12 * (hi - lo + 0.2);
          R.setView(null, [lo - pad, hi + pad]);
          R.path(xs.map((s, i) => [s, D[i].im]), { color: 'green', width: 1.4, dash: [3, 3], alpha: 0.7 });
          R.path(xs.map((s, i) => [s, D[i].re]), { color: 'green', width: 3 });
          R.path(xs.map((s, i) => [s, Dh[i].re]), { color: 'gold', width: 2, dash: [7, 4] });
          R.vline(s0, { color: 'muted', width: 1, dash: [2, 3] });
          R.hline(0, { color: 'faint', width: 1 });
          const err = Math.max(...xs.map((s, i) => Dh[i].sub(D[i]).abs()));
          st = { err, h: Math.pow(10, hS.value), L0: F(zz, s0), dL: dF(zz, s0) };
        });
        v.legend([['green', '$\\Re f\'(z)$ (dotted: $\\Im$)'], ['gold', '$\\Re\\,(f(z+h)-f(z))/h$', { dash: true }], ['ink', '$\\partial\\Omega$', { dash: true }]]);
        v.readout(() => `$|h| = ${v.fmt(st.h, 2)}$: $\\;\\sup_{s}\\big|\\tfrac{f(z+h)-f(z)}{h}(s)-f'(z)(s)\\big| = ${v.fmt(st.err, 3)}$ $\\to0$ (strong derivative). At $s_0$: $\\Lambda f(z) = ${st.L0.toString(3).replace('i', '\\,i')}$, $(\\Lambda f)'(z) = ${st.dL.toString(3).replace('i', '\\,i')}$.`);
      },
    },
    {
      num: '3.31',
      kind: 'Theorem',
      name: 'Weakly holomorphic functions into Fréchet spaces',
      statement: String.raw`Let $\Omega\subset\C$ be open, $X$ a Fréchet space, and $f:\Omega\to X$ weakly holomorphic. Then:
(a) $f$ is strongly continuous in $\Omega$;
(b) Cauchy's theorem and formula hold for $f$: if $\Gamma$ is a closed path in $\Omega$ with $\Ind_\Gamma(w)=0$ for all $w\notin\Omega$, then $\int_\Gamma f(\zeta)\,d\zeta=0$ and $f(z)\Ind_\Gamma(z)=\frac1{2\pi i}\int_\Gamma\frac{f(\zeta)}{\zeta-z}\,d\zeta$ for $z\in\Omega\setminus\Gamma^*$;
(c) $f$ is strongly holomorphic in $\Omega$.`,
      idea: String.raw`(a) Near $z_0$ the scalar Cauchy formula bounds $\Lambda\big[(f(z)-f(z_0))/(z-z_0)\big]$ uniformly in $z$ for each $\Lambda$; so this set is weakly bounded, hence bounded (3.18), and $f(z)\to f(z_0)$. (b) By (a) and 3.29 the vector integrals exist; apply $\Lambda$ and use the scalar Cauchy theorem — the two sides have the same image under every $\Lambda\in X^*$. (c) Write the difference quotient with the vector Cauchy formula and let $w\to z$ under the integral.`,
      caption: String.raw`$X=C[0,1]$ and $f(z)=\big(s\mapsto 1/(1-zs)\big)$ on the unit disc. Left: the circle $\Gamma$ of radius $\rho$ and the $N$ nodes of the trapezoid rule. Right: the real part of $f(z)$ (ink) and of the vector-valued Cauchy integral $\frac1{2\pi i}\oint_\Gamma f(\zeta)\,\frac{d\zeta}{\zeta-z}$, computed with $N$ nodes (blue, dashed). Bottom: the sup-norm error over $s\in[0,1]$ for $N=2,\dots,40$ — geometric convergence. Drag $z$ outside $\Gamma$ and the integral becomes $0$, since $\Ind_\Gamma(z)=0$.`,
      deps: ['fa-3.30', 'fa-3.18', 'fa-3.29', 'rca-10.35'],
      see: ['rca-10.15'],
      tags: ['holomorphic functions', 'Cauchy formula', 'vector integration'],
      viz(v) {
        const M = v.M, Cx = v.Cx;
        const rS = v.slider('radius $\\rho$ of $\\Gamma$', 0.3, 0.95, 0.7, { step: 0.01 });
        const NS = v.slider('nodes $N$', 2, 40, 8, { int: true });
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.1, 1.1], equal: true, height: 300, ticks: false, title: 'the $z$-plane: $\\Omega$, $\\Gamma$ and the nodes' });
        const R = v.stage({ x: [0, 1], y: [-1, 2], height: 300, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], xlabel: 's', title: '$\\Re f(z)$ and $\\Re$ of the Cauchy integral' });
        const sup = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
        const E = v.stage({ x: [1, 41], y: [-16.5, 1], height: 150, full: true, axes: 'box', xticks: [10, 20, 30, 40], yticks: M.range(9).map((k) => [-2 * k, k ? `10⁻${sup(2 * k)}` : '1']), title: 'sup-norm error of the $N$-node Cauchy integral (log scale)' });
        const z = L.handle(0.3, 0.2, { color: 'accent', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.97 ? [0.97 * x / r, 0.97 * y / r] : [x, y]; } });
        const one = new Cx(1, 0);
        const F = (zz, s) => one.div(one.sub(zz.scale(s)));
        const xs = M.linspace(0, 1, 101);
        const cauchy = (zz, rho, N) => xs.map((s) => { let a = new Cx(0, 0); for (let k = 0; k < N; k++) { const zeta = Cx.polar(rho, M.TAU * k / N); a = a.add(F(zeta, s).mul(zeta).div(zeta.sub(zz))); } return a.scale(1 / N); });
        let st = {};
        v.render(() => {
          const rho = rS.value, N = NS.value, zz = new Cx(z.x, z.y), ind = zz.abs() < rho ? 1 : 0;
          L.circle(0, 0, 1, { fill: 'blue', fillAlpha: 0.06, color: 'blue', width: 1.2, dash: [5, 4] });
          L.circle(0, 0, rho, { color: 'ink', width: 2 });
          for (const a of [0.3, 2.4, 4.5]) { const p = Cx.polar(rho, a), q = Cx.polar(rho, a + 0.06); L.arrow(p.re, p.im, q.re, q.im, { color: 'ink', head: 9 }); }
          M.range(N).forEach((k) => { const p = Cx.polar(rho, M.TAU * k / N); L.dot(p.re, p.im, { color: 'gold', r: 4 }); });
          L.tex('\\Gamma', rho * 0.72 + 0.1, -rho * 0.72 - 0.1, { color: 'ink', size: 15 });
          L.tex('\\Omega', -0.8, 0.85, { color: 'blue', size: 15 });
          const exact = xs.map((s) => F(zz, s).scale(ind));
          const approx = cauchy(zz, rho, N);
          const all = exact.map((q) => q.re).concat(approx.map((q) => q.re));
          const lo = Math.min(...all), hi = Math.max(...all), pad = 0.15 * (hi - lo + 0.3);
          R.setView(null, [lo - pad, hi + pad]);
          R.path(xs.map((s, i) => [s, exact[i].re]), { color: 'ink', width: 3 });
          R.path(xs.map((s, i) => [s, approx[i].re]), { color: 'blue', width: 2, dash: [7, 4] });
          R.hline(0, { color: 'faint', width: 1 });
          const errs = M.range(39, 2).map((n) => { const ap = cauchy(zz, rho, n); return Math.max(...ap.map((q, i) => q.sub(exact[i]).abs())); });
          const lg = errs.map((e) => Math.log10(Math.max(e, 1e-16)));
          E.setView(null, [Math.min(...lg) - 0.8, 0.6]);
          E.bars(lg, { x0: 2, dx: 1, base: 1, color: (b, i) => (i + 2 === N ? 'blue' : 'faint'), barWidth: 0.6 });
          st = { err: errs[N - 2], ind, N };
        });
        v.legend([['ink', '$f(z)\\,\\Ind_\\Gamma(z)$'], ['blue', '$N$-node Cauchy integral', { dash: true }], ['gold', 'nodes on $\\Gamma$', { dot: true }]]);
        v.readout(() => `$\\Ind_\\Gamma(z) = ${st.ind}$; with $N=${st.N}$ nodes, $\\sup_{s\\in[0,1]}\\big|\\tfrac{1}{2\\pi i}\\oint_\\Gamma\\tfrac{f(\\zeta)(s)}{\\zeta-z}d\\zeta - f(z)(s)\\Ind_\\Gamma(z)\\big| \\approx ${v.fmt(Math.max(st.err, 1e-16), 2)}$ — the formula holds in the norm of $X$, not just after applying functionals.`);
      },
    },
    {
      num: '3.32',
      kind: 'Theorem',
      name: 'Vector-valued Liouville theorem',
      statement: String.raw`Let $X$ be a complex topological vector space whose continuous dual $X^*$ separates points. If $f:\C\to X$ is weakly holomorphic and $f(\C)$ is weakly bounded, then $f$ is constant. Here weak boundedness means $\sup_{z\in\C}|\Lambda f(z)|<\infty$ for each $\Lambda\in X^*$; the bound may depend on $\Lambda$.`,
      idea: String.raw`For every continuous linear functional $\Lambda$, the scalar function $\Lambda f$ is bounded and entire. Scalar Liouville gives $\Lambda f(z)=\Lambda f(0)$ for every $z$. Separation of points then forces $f(z)=f(0)$. This argument needs neither completeness nor local convexity, and does not use the stronger differentiability conclusion of 3.31.`,
      caption: String.raw`In $X=\C^2$, compare $f(z)=(1+az,1+az^2)$ with the constant case $a=0$. The selected functional is $\Lambda_\theta(x)=\cos\theta\,x_1+\sin\theta\,x_2$. Left: the image of $|z|=R$ under this scalar probe. Right: the Cauchy coefficient bounds $M_\theta(R)/R$ and $M_\theta(R)/R^2$, where the exact maximum on the circle is $M_\theta(R)=\cos\theta+\sin\theta+a\cos\theta R+a\sin\theta R^2$. Nonzero $a$ forces an unbounded scalar probe; choosing a functional that misses one coefficient does not make all probes bounded.`,
      deps: ['fa-3.30', 'rca-10.23'],
      refs: ['Rudin, Functional Analysis, 2nd ed., Theorem 3.32, pp. 84–85 (full statement and proof)'],
      tags: ['weak holomorphy', 'Liouville', 'separating dual'],
      scope: String.raw`The bound is over the whole complex plane, not just its real axis or a finite disc. The finite-dimensional polynomial family illustrates why nonconstant entire examples fail this hypothesis; it is not a proof for general spaces.`,
      viz(v) {
        const a=v.slider('nonconstant coefficient $a$',0,1,0,{step:.01});
        const th=v.slider('functional angle $\\theta$ (degrees)',0,90,35,{step:1});
        const r=v.slider('circle radius $R$',.2,20,2,{log:true});
        const L=v.stage({x:[-2,5],y:[-3.5,3.5],axes:'box',gutter:true,height:310,xlabel:'Re Λf',ylabel:'Im Λf',title:'one scalar probe of the entire vector function'});
        const B=v.stage({x:[.2,20],y:[0,10],axes:'box',gutter:true,height:310,xlabel:'R',ylabel:'Cauchy coefficient bound',title:'bounded on every disc versus bounded on all of ℂ'});
        let result={};
        v.render(()=>{
          const t=th.value*Math.PI/180,c=Math.cos(t),s=Math.sin(t),aa=a.value,R=r.value,base=c+s;
          const max=x=>base+aa*c*x+aa*s*x*x,M=max(R),span=Math.max(.5,M-base);
          L.setView([base-span*1.15,base+span*1.15],[-span*1.15,span*1.15]);
          L.path(Array.from({length:257},(_,k)=>{const u=2*Math.PI*k/256;return[base+aa*c*R*Math.cos(u)+aa*s*R*R*Math.cos(2*u),aa*c*R*Math.sin(u)+aa*s*R*R*Math.sin(2*u)]}),{color:'blue',width:2.5});
          L.dot(base,0,{color:'gold',r:5});
          const xs=Array.from({length:241},(_,k)=>.2+19.8*k/240);
          const y1=xs.map(x=>[x,max(x)/x]),y2=xs.map(x=>[x,max(x)/(x*x)]);
          B.setView(null,[0,Math.max(1,...y1.map(p=>p[1]),...y2.map(p=>p[1]))*1.05]);
          B.path(y1,{color:'blue',width:2.4});B.path(y2,{color:'green',width:2.4});
          B.hline(aa*c,{color:'blue',dash:[4,4]});B.hline(aa*s,{color:'green',dash:[4,4]});B.vline(R,{color:'gold',dash:[3,4]});
          result={M,b1:M/R,b2:M/(R*R),c1:aa*c,c2:aa*s};
        });
        v.legend([['blue','$M_\\theta(R)/R$; dashed $|c_1|$'],['green','$M_\\theta(R)/R^2$; dashed $|c_2|$'],['gold','chosen radius']]);
        v.readout(()=>`$M_\\theta(R)=${v.fix(result.M,3)}$, $|c_1|=${v.fix(result.c1,3)}\\le${v.fix(result.b1,3)}$, $|c_2|=${v.fix(result.c2,3)}\\le${v.fix(result.b2,3)}$. ${a.value===0?'Every scalar probe is bounded; the vector function is constant.':'This entire vector function is nonconstant and its image is not weakly bounded.'}`);
      },
    },
  ],
};
