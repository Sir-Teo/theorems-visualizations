// Rudin, Principles of Mathematical Analysis — Chapter 10 (part 2: 10.8–10.11)
// Partitions of unity, change of variables, k-surfaces, differential forms.

function divRGB(v, pos = 'blue', neg = 'orange', gain = 0.85) {
  const P = v.rgb('panel'), A = v.rgb(pos), B = v.rgb(neg);
  return (t) => {
    if (!isFinite(t)) return null;
    const w = Math.pow(Math.min(1, Math.abs(t)), 0.75) * gain, C = t >= 0 ? A : B;
    return [P[0] + (C[0] - P[0]) * w, P[1] + (C[1] - P[1]) * w, P[2] + (C[2] - P[2]) * w];
  };
}
const themeKey = (v) => v.color('panel') + v.color('blue');

/**
 * Rudin's construction in 10.8 for discs V_a = {|y - c_a| < R_a} (any dimension 1 or 2):
 * pick points x_i of K greedily, balls B(x_i) ⊂ W(x_i) ⊂ V_{a(i)}, phi_i = 1 on B, 0 off W,
 * psi_1 = phi_1, psi_{i+1} = (1 - phi_1)...(1 - phi_i) phi_{i+1}.
 */
function buildPartition(samples, V, maxBalls = 70) {
  const cand = [];
  let uncovered = 0;
  for (const x of samples) {
    let best = -1, slack = 0;
    V.forEach((c, a) => { const s = c.R - Math.hypot(...x.map((xi, k) => xi - c.c[k])); if (s > slack) { slack = s; best = a; } });
    if (best < 0) { uncovered++; continue; }
    cand.push({ x, a: best, rW: 0.92 * slack, rB: 0.46 * slack });
  }
  cand.sort((p, q) => q.rW - p.rW);
  const balls = [];
  for (const c of cand) {
    if (balls.length >= maxBalls) break;
    if (!balls.some((b) => Math.hypot(...c.x.map((xi, k) => xi - b.x[k])) < b.rB)) balls.push(c);
  }
  return { balls, uncovered };
}
/** psi values grouped by cover index: returns array Psi[a] at point y, plus their sum. */
function psiAt(balls, nV, y) {
  const out = new Array(nV).fill(0); let prod = 1;
  for (const b of balls) {
    const d = Math.hypot(...y.map((yi, k) => yi - b.x[k]));
    if (d >= b.rW) continue;
    const phi = Math.min(1, (b.rW - d) / (b.rW - b.rB));
    out[b.a] += prod * phi; prod *= 1 - phi;
    if (prod === 0) break;
  }
  return { Psi: out, sum: 1 - prod };
}

export default {
  book: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.8
    {
      num: '10.8',
      kind: 'Theorem',
      name: 'Partitions of unity',
      statement: String.raw`Let $K\subset\R^n$ be compact and let $\{V_\alpha\}$ be an open cover of $K$. Then there are finitely many functions $\psi_1,\dots,\psi_s\in\mathscr C(\R^n)$ such that
(a) $0\le\psi_i\le1$ for every $i$;
(b) the support of each $\psi_i$ lies in some $V_\alpha$;
(c) $\psi_1(\mathbf x)+\dots+\psi_s(\mathbf x)=1$ for every $\mathbf x\in K$.
Such $\{\psi_i\}$ is called a partition of unity on $K$ subordinate to the cover.`,
      idea: String.raw`Give each $\mathbf x\in K$ concentric balls $B(\mathbf x)\subset\overline{B(\mathbf x)}\subset W(\mathbf x)\subset\overline{W(\mathbf x)}\subset V_{\alpha(\mathbf x)}$; by compactness finitely many $B(\mathbf x_1),\dots,B(\mathbf x_s)$ cover $K$. Take continuous $\varphi_i$ with $\varphi_i=1$ on $\overline{B(\mathbf x_i)}$, $\varphi_i=0$ off $W(\mathbf x_i)$, $0\le\varphi_i\le1$, and telescope: $\psi_1=\varphi_1$, $\psi_{i+1}=(1-\varphi_1)\cdots(1-\varphi_i)\varphi_{i+1}$. Then $\sum\psi_i=1-\prod(1-\varphi_i)$, and on $K$ some factor $1-\varphi_i$ vanishes.`,
      caption: String.raw`$K$ is the outlined blob; drag the centres of the four open discs $V_\alpha$ or change their radius. Colour shows the partition built by Rudin's recipe (each $\psi_i$ is coloured by the disc containing its support, and colours mix where several are positive); it is fully saturated, i.e. $\sum\psi_i=1$, on all of $K$ and fades to $0$ outside. Drag the probe $\mathbf p$: the right panel stacks the $\psi_i$ along the horizontal line through $\mathbf p$. Pull a disc away so the $V_\alpha$ no longer cover $K$, and (c) fails on the uncovered part (red).`,
      deps: ['pma-2.32', 'pma-4.9'],
      see: ['rca-2.13', 'fa-6.20'],
      tags: ['partition of unity', 'compactness'],
      viz(v) {
        const M = v.M;
        const K = M.blob(0, 0, 1.3, 11, 0.32, 140);
        const COL = ['blue', 'orange', 'teal', 'purple'];
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.2, 2.2], equal: true, height: 360, title: '$K$, the cover $\\{V_\\alpha\\}$ and the partition $\\{\\psi_i\\}$' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-0.26, 1.18], height: 360, axes: 'box', xlabel: 'x₁', yticks: [0, 0.5, 1], title: 'the $\\psi_i$ stacked along the line through $\\mathbf p$' });
        const rad = v.slider('radius of each $V_\\alpha$', 0.6, 1.7, 1.2, { step: 0.01 });
        const showB = v.toggle('show the balls $B(\\mathbf x_i)\\subset W(\\mathbf x_i)$', false);
        const C = [[-0.75, 0.7], [0.8, 0.75], [0.75, -0.7], [-0.8, -0.65]].map((c, a) => L.handle(c[0], c[1], { color: COL[a], r: 6 }));
        const p = L.handle(0.15, 0.25, { color: 'ink', label: 'p' });
        let bb = [Infinity, -Infinity, Infinity, -Infinity]; for (const q of K) bb = [Math.min(bb[0], q[0]), Math.max(bb[1], q[0]), Math.min(bb[2], q[1]), Math.max(bb[3], q[1])];
        const samples = []; for (let x = bb[0]; x <= bb[1]; x += 0.06) for (let y = bb[2]; y <= bb[3]; y += 0.06) if (M.pointInPoly([x, y], K)) samples.push([x, y]);
        for (const q of K) samples.push(q);
        let st = {}, part = null, lastKey = null;
        v.legend([['ink', '$\\partial K$'], ...COL.map((c, a) => [c, `$\\psi_i$ with support in $V_${a + 1}$`, { area: true }]), ['red', 'uncovered points of $K$', { dot: true }]]);
        v.render(() => {
          const V = C.map((h) => ({ c: [h.x, h.y], R: rad.value }));
          const key = V.map((c) => c.c.map((z) => z.toFixed(3)).join(',')).join(';') + rad.value;
          if (key !== lastKey) { lastKey = key; part = buildPartition(samples, V); }
          const { balls, uncovered } = part;
          const P0 = v.rgb('panel'), CR = COL.map((c) => v.rgb(c));
          L.raster((x, y) => {
            const { Psi, sum } = psiAt(balls, 4, [x, y]); if (sum < 1e-4) return null;
            const out = [P0[0], P0[1], P0[2]];
            for (let a = 0; a < 4; a++) if (Psi[a] > 0) for (let k = 0; k < 3; k++) out[k] += (CR[a][k] - P0[k]) * Psi[a] * 0.62;
            return out;
          }, { key: key + themeKey(v), res: 3 });
          V.forEach((c, a) => L.circle(c.c[0], c.c[1], c.R, { color: COL[a], width: 1.6, dash: [6, 4] }));
          if (showB.value) for (const b of balls) { L.circle(b.x[0], b.x[1], b.rW, { color: 'muted', width: 0.7, alpha: 0.6 }); L.circle(b.x[0], b.x[1], b.rB, { color: COL[b.a], width: 0.9 }); }
          L.poly(K, { color: 'ink', width: 2.2 });
          // uncovered samples
          const bad = []; let minSum = 1;
          for (const q of samples) { const s = psiAt(balls, 4, q).sum; minSum = Math.min(minSum, s); if (s < 1 - 1e-9) bad.push(q); }
          if (bad.length) L.dots(bad, { color: 'red', r: 2.2 });
          L.hline(p.y, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 });
          // right panel: stacked psi along y = p.y
          const xs = M.linspace(-2.4, 2.4, 241), vals = xs.map((x) => psiAt(balls, 4, [x, p.y]));
          let base = xs.map(() => 0);
          for (let a = 0; a < 4; a++) {
            const top = base.map((b, i) => b + vals[i].Psi[a]);
            R.path(xs.map((x, i) => [x, top[i]]).concat(xs.map((x, i) => [x, base[i]]).reverse()), { fill: COL[a], fillAlpha: 0.55, stroke: false, close: true });
            base = top;
          }
          R.path(xs.map((x, i) => [x, vals[i].sum]), { color: 'ink', width: 2 });
          R.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
          // K ∩ line
          let run = null; const segs = [];
          xs.forEach((x, i) => { const ins = M.pointInPoly([x, p.y], K); if (ins && run == null) run = x; if ((!ins || i === xs.length - 1) && run != null) { segs.push([run, x]); run = null; } });
          for (const [a, b] of segs) R.line(a, -0.07, b, -0.07, { color: 'ink', width: 5, cap: 'butt' });
          if (segs.length) R.text('K ∩ line', segs[0][0], -0.07, { color: 'ink', size: 11.5, dx: -6, align: 'right' });
          R.vline(p.x, { color: 'ink', width: 1, dash: [3, 3] });
          const here = psiAt(balls, 4, [p.x, p.y]);
          R.dot(p.x, here.sum, { color: 'ink', r: 4 });
          L.corner(uncovered || bad.length ? 'the V_α do not cover K: (c) fails' : 'Σψᵢ = 1 on K', 'tl', { color: uncovered || bad.length ? 'red' : 'green', weight: 600 });
          st = { s: balls.length, here, minSum, inK: M.pointInPoly([p.x, p.y], K) };
        });
        v.readout(() => `$s=${st.s}$ functions. At $\\mathbf p$: ` + st.here.Psi.map((z, a) => `$\\Psi_${a + 1}=${v.fix(z, 3)}$`).join(', ') + `, sum $=${v.fix(st.here.sum, 4)}$ (${st.inK ? '$\\mathbf p\\in K$' : '$\\mathbf p\\notin K$'}). $\\;\\min_K\\sum\\psi_i=${v.fix(st.minSum, 4)}$. Here $\\Psi_\\alpha$ is the sum of the $\\psi_i$ assigned to $V_\\alpha$.`);
      },
    },
    // ------------------------------------------------------------------ 10.8a
    {
      num: '10.8a',
      kind: 'Corollary',
      name: 'Splitting a function into localized pieces',
      statement: String.raw`In the setting of 10.8, if $f\in\mathscr C(\R^n)$ has its support in $K$, then
$$f=\sum_{i=1}^s\psi_if,$$
and the support of each summand $\psi_if$ lies in some $V_\alpha$.`,
      idea: String.raw`Off $K$ both sides vanish, and on $K$ the $\psi_i$ add up to $1$. The support of $\psi_if$ is inside that of $\psi_i$. This is how 10.9 is localized: a statement that is linear in $f$ and known for functions supported in small sets (where $T$ factors into primitive maps, 10.7) extends to every $f$ by summing the pieces.`,
      caption: String.raw`Drag the endpoints of the open intervals $V_1,V_2,V_3$ (bottom bars). Top: $f$ (dashed) is rebuilt exactly as the stack of the pieces $\Psi_\alpha f$, where $\Psi_\alpha$ collects the $\psi_i$ supported in $V_\alpha$. Bottom: each piece on its own; its support (bracket) stays inside its interval. If the intervals stop covering the support of $f$, the stack falls short of $f$ (red).`,
      deps: ['pma-10.8'],
      see: ['rca-2.13'],
      tags: ['partition of unity'],
      viz(v) {
        const M = v.M;
        const bmp = (t) => (Math.abs(t) < 1 ? Math.E * M.bump(t) : 0);
        const f = (x) => 0.75 * bmp((x + 1.15) / 1.05) + 1.05 * bmp((x - 1.0) / 1.4);
        const K = [-2.2, 2.4];
        const COL = ['blue', 'orange', 'purple'];
        const T = v.stage({ x: [-3, 3.1], y: [-0.1, 1.25], height: 220, full: true, axes: 'box', title: '$f=\\sum_\\alpha\\Psi_\\alpha f$ (stacked)' });
        const B = v.stage({ x: [-3, 3.1], y: [-0.72, 1.12], height: 280, full: true, axes: true, xlabel: 'x', title: 'the pieces $\\Psi_\\alpha f$ and the open intervals $V_\\alpha$' });
        const Y = [-0.26, -0.42, -0.58];
        const init = [[-2.7, -0.2], [-1.0, 1.3], [0.55, 2.8]];
        const H = init.map(([a, b], k) => [B.handle(a, Y[k], { color: COL[k], r: 6, constrain: 'x' }), B.handle(b, Y[k], { color: COL[k], r: 6, constrain: 'x' })]);
        const samples = M.linspace(K[0], K[1], 221).map((x) => [x]);
        let st = {};
        v.legend([['ink', '$f$', { dash: true }], ...COL.map((c, k) => [c, `$\\Psi_${k + 1}f$, support in $V_${k + 1}$`, { area: true }])]);
        v.render(() => {
          const V = H.map(([a, b]) => { const l = Math.min(a.x, b.x), r = Math.max(a.x, b.x); return { c: [(l + r) / 2], R: (r - l) / 2, l, r }; });
          const { balls } = buildPartition(samples, V, 80);
          const xs = M.linspace(-3, 3.1, 611);
          const pieces = xs.map((x) => { const { Psi } = psiAt(balls, 3, [x]); const fx = f(x); return Psi.map((z) => z * fx); });
          let base = xs.map(() => 0);
          for (let k = 0; k < 3; k++) {
            const top = base.map((b, i) => b + pieces[i][k]);
            T.path(xs.map((x, i) => [x, top[i]]).concat(xs.map((x, i) => [x, base[i]]).reverse()), { fill: COL[k], fillAlpha: 0.5, stroke: false, close: true });
            base = top;
          }
          let err = 0, gap = [];
          xs.forEach((x, i) => { const e = Math.abs(f(x) - base[i]); err = Math.max(err, e); if (e > 1e-9) gap.push(i); });
          if (gap.length) T.path(xs.map((x, i) => [x, f(x)]).concat(xs.map((x, i) => [x, base[i]]).reverse()), { fill: 'red', fillAlpha: 0.35, stroke: false, close: true });
          T.fn(f, { color: 'ink', width: 2, dash: [6, 4] });
          T.corner(err < 1e-9 ? 'Σ Ψα f = f exactly' : 'cover misses supp f: Σ Ψα f ≠ f', 'tr', { color: err < 1e-9 ? 'green' : 'red', weight: 600 });
          // bottom: separate pieces + intervals
          const ints = [];
          for (let k = 0; k < 3; k++) {
            B.path(xs.map((x, i) => [x, pieces[i][k]]), { color: COL[k], width: 2, fill: COL[k], fillAlpha: 0.12 });
            const { l, r } = V[k];
            B.line(l, Y[k], r, Y[k], { color: COL[k], width: 7, alpha: 0.35, cap: 'butt' });
            B.dot(l, Y[k], { color: COL[k], r: 5, hollow: true }); B.dot(r, Y[k], { color: COL[k], r: 5, hollow: true });
            B.text(`V${'₁₂₃'[k]}`, r, Y[k], { color: COL[k], math: true, dx: 10, align: 'left' });
            const nz = xs.filter((x, i) => pieces[i][k] > 1e-12);
            if (nz.length) {
              const a = nz[0], b = nz[nz.length - 1], yb = Y[k] + 0.065;
              B.path([[a, yb + 0.04], [a, yb], [b, yb], [b, yb + 0.04]], { color: COL[k], width: 1.6 });
              ints.push(M.integrate((x) => psiAt(balls, 3, [x]).Psi[k] * f(x), a, b, 300));
            } else ints.push(0);
          }
          st = { err, ints, total: M.integrate(f, K[0], K[1], 600), s: balls.length };
        });
        v.readout(() => `$\\max|f-\\sum\\Psi_\\alpha f|=${st.err < 1e-12 ? '0' : v.fix(st.err, 4)}$ $\\;(s=${st.s})$. $\\;\\int f=${v.fix(st.total, 4)}$, $\\;\\sum_\\alpha\\int\\Psi_\\alpha f=` + st.ints.map((z) => v.fix(z, 4)).join('+') + `=${v.fix(st.ints.reduce((a, b) => a + b, 0), 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.9
    {
      num: '10.9',
      kind: 'Theorem',
      name: 'Change of variables in multiple integrals',
      statement: String.raw`Let $T$ be a one-to-one $\mathscr C'$-mapping of an open set $E\subset\R^k$ into $\R^k$ with $J_T(\mathbf x)\ne0$ for every $\mathbf x\in E$. If $f$ is continuous on $\R^k$ and its support is compact and contained in $T(E)$, then
$$\int_{\R^k}f(\mathbf y)\,d\mathbf y=\int_{\R^k}f(T(\mathbf x))\,|J_T(\mathbf x)|\,d\mathbf x .$$`,
      idea: String.raw`Both sides are linear in $f$, so by the partition of unity (10.8a) it suffices to treat $f$ supported in a small ball, where $T$ is a composition of primitive maps and flips (10.7, after translating). A flip just reorders the variables, which is harmless by 10.2. For a primitive $G$ that changes only $x_m$, integrate first in $x_m$: on each line the formula is the one-variable substitution rule (6.19) with $dy_m=|D_mg|\,dx_m=|J_G|\,dx_m$. Composing uses $J_{S\circ T}=J_S(T)\,J_T$ (chain rule and 9.35).`,
      caption: String.raw`Left: the domain $E$, divided into cells and shaded by the integrand $f(T(\mathbf x))|J_T(\mathbf x)|$. Right: the image $T(E)$ (outlined) with the images of the cells, and $f$ (a bump; drag its centre $\mathbf q$). Drag $\mathbf c$ to pick a cell: its image has area close to $|J_T|$ times the cell's area. The readout compares the two integrals. Move the bump partly outside $T(E)$, or choose the map that is not one-to-one, and they no longer agree.`,
      deps: ['pma-10.7', 'pma-10.8a', 'pma-10.2', 'pma-6.19', 'pma-9.24', 'pma-9.35'],
      see: ['rca-7.26', 'rca-2.23'],
      tags: ['change of variables', 'Jacobian'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          polar: {
            label: 'polar coordinates', E: [[0.35, 1.75], [0.15, 2.95]], xl: 'r', yl: 'θ',
            T: (r, t) => [r * Math.cos(t), r * Math.sin(t)], J: (r) => r, q: [-0.35, 0.95], view: [[-2, 2], [-0.6, 2]],
            inImage: (y) => { const r = Math.hypot(y[0], y[1]), t = Math.atan2(y[1], y[0]); return r > 0.35 && r < 1.75 && t > 0.15 && t < 2.95; },
          },
          twist: {
            label: 'a twist', E: [[-1.2, 1.2], [-1.2, 1.2]], xl: 'x₁', yl: 'x₂',
            T: (a, b) => [a + 0.35 * Math.sin(1.6 * b), b + 0.3 * a * a - 0.2], J: (a, b) => 1 - 0.336 * a * Math.cos(1.6 * b), q: [0.2, -0.05], view: [[-1.8, 1.8], [-1.6, 1.6]],
            inImage: null,
          },
          wrap: {
            label: 'polar, not 1-1', E: [[0.35, 1.75], [0.15, 2 * Math.PI + 1.4]], xl: 'r', yl: 'θ',
            T: (r, t) => [r * Math.cos(t), r * Math.sin(t)], J: (r) => r, q: [0.55, 0.8], view: [[-2, 2], [-2, 2]],
            inImage: (y) => { const r = Math.hypot(y[0], y[1]); return r > 0.35 && r < 1.75; },
          },
        };
        const which = v.select('$T$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'polar');
        const N = v.slider('cells per side', 3, 14, 7, { int: true });
        const rho = v.slider('radius of the bump', 0.15, 0.8, 0.5, { step: 0.01 });
        const Ls = v.stage({ x: [0.35, 1.75], y: [0.15, 2.95], height: 340, axes: 'box', title: 'domain $E$: integrand $f(T(\\mathbf x))\\,|J_T(\\mathbf x)|$' });
        const Rs = v.stage({ x: [-2, 2], y: [-0.6, 2], equal: true, height: 340, title: 'image $T(E)$: integrand $f(\\mathbf y)$' });
        const c = Ls.handle(1.2, 1.9, { color: 'orange', label: 'c' });
        const q = Rs.handle(-0.35, 0.95, { color: 'accent', label: 'q' });
        let last = null, st = {};
        v.legend([['teal', 'the integrands', { area: true }], ['orange', 'a cell and its image', { area: true }], ['muted', 'images of the cell walls']]);
        v.render(() => {
          const Mp = MAPS[which.value];
          if (last !== which.value) {
            last = which.value;
            const [[a0, a1], [b0, b1]] = Mp.E;
            Ls.setView([a0 - 0.04 * (a1 - a0), a1 + 0.04 * (a1 - a0)], [b0 - 0.04 * (b1 - b0), b1 + 0.04 * (b1 - b0)]);
            Rs.setView(...Mp.view);
            c.x = (a0 + a1) / 2 + 0.15; c.y = (b0 + b1) / 2 + 0.2; q.x = Mp.q[0]; q.y = Mp.q[1];
          }
          const [[a0, a1], [b0, b1]] = Mp.E, n = N.value, r = rho.value;
          c.x = M.clamp(c.x, a0, a1); c.y = M.clamp(c.y, b0, b1);
          const bmp = (t) => (t < 1 ? Math.E * M.bump(t) : 0);
          const f = (y0, y1) => bmp(Math.hypot(y0 - q.x, y1 - q.y) / r);
          const col = divRGB(v, 'teal', 'pink', 0.8);
          const key = [which.value, q.x.toFixed(3), q.y.toFixed(3), r, themeKey(v)].join('|');
          Ls.raster((x, y) => (x < a0 || x > a1 || y < b0 || y > b1 ? null : col(f(...Mp.T(x, y)) * Math.abs(Mp.J(x, y)) / 1.4)), { key, res: 2 });
          Rs.raster((x, y) => col(f(x, y) / 1.4), { key, res: 2 });
          Ls.axes();
          Ls.tex(Mp.xl === 'r' ? 'r' : 'x_1', Ls.bounds.x[1], Ls.bounds.y[0], { color: 'muted', align: 'right', baseline: 'bottom', dx: -6, dy: -18 });
          Ls.tex(Mp.yl === 'θ' ? '\\theta' : 'x_2', Ls.bounds.x[0], Ls.bounds.y[1], { color: 'muted', align: 'left', baseline: 'top', dx: 40, dy: 4 });
          // grid of cells
          const da = (a1 - a0) / n, db = (b1 - b0) / n;
          for (let i = 0; i <= n; i++) {
            const A = a0 + i * da, Bv = b0 + i * db;
            Ls.line(A, b0, A, b1, { color: 'muted', width: 1, alpha: 0.7 }); Ls.line(a0, Bv, a1, Bv, { color: 'muted', width: 1, alpha: 0.7 });
            Rs.curve((t) => Mp.T(A, b0 + (b1 - b0) * t), 0, 1, { color: 'muted', width: 1, alpha: 0.7, n: 80 });
            Rs.curve((t) => Mp.T(a0 + (a1 - a0) * t, Bv), 0, 1, { color: 'muted', width: 1, alpha: 0.7, n: 80 });
          }
          // outline of T(E)
          const bnd = [];
          for (let t = 0; t <= 1; t += 0.01) bnd.push(Mp.T(a0 + (a1 - a0) * t, b0));
          for (let t = 0; t <= 1; t += 0.01) bnd.push(Mp.T(a1, b0 + (b1 - b0) * t));
          for (let t = 0; t <= 1; t += 0.01) bnd.push(Mp.T(a1 - (a1 - a0) * t, b1));
          for (let t = 0; t <= 1; t += 0.01) bnd.push(Mp.T(a0, b1 - (b1 - b0) * t));
          Rs.path(bnd, { color: 'ink', width: 2, close: true });
          // selected cell
          const i = Math.min(n - 1, Math.floor((c.x - a0) / da)), j = Math.min(n - 1, Math.floor((c.y - b0) / db));
          const ca = a0 + i * da, cb = b0 + j * db;
          Ls.rect(ca, cb, ca + da, cb + db, { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.25 });
          const cell = [];
          for (let t = 0; t < 1; t += 0.05) cell.push(Mp.T(ca + da * t, cb));
          for (let t = 0; t < 1; t += 0.05) cell.push(Mp.T(ca + da, cb + db * t));
          for (let t = 0; t < 1; t += 0.05) cell.push(Mp.T(ca + da - da * t, cb + db));
          for (let t = 0; t < 1; t += 0.05) cell.push(Mp.T(ca, cb + db - db * t));
          Rs.poly(cell, { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.25 });
          const areaImg = Math.abs(M.polyArea(cell)), Jc = Math.abs(Mp.J(ca + da / 2, cb + db / 2));
          // support of f inside T(E)?
          let inside = true;
          for (let k = 0; k < 48; k++) { const t = 2 * Math.PI * k / 48, y = [q.x + r * Math.cos(t), q.y + r * Math.sin(t)]; if (Mp.inImage ? !Mp.inImage(y) : !M.pointInPoly(y, bnd)) { inside = false; break; } }
          Rs.circle(q.x, q.y, r, { color: inside ? 'green' : 'red', width: 1.6, dash: [5, 4] });
          // the two integrals (midpoint rule)
          let lhs = 0; const m1 = 140, hy = 2 * r / m1;
          for (let u = 0; u < m1; u++) for (let w = 0; w < m1; w++) lhs += f(q.x - r + (u + 0.5) * hy, q.y - r + (w + 0.5) * hy);
          lhs *= hy * hy;
          let rhs = 0; const m2 = 260, ha = (a1 - a0) / m2, hb = (b1 - b0) / m2;
          for (let u = 0; u < m2; u++) for (let w = 0; w < m2; w++) { const x = a0 + (u + 0.5) * ha, y = b0 + (w + 0.5) * hb, z = Mp.T(x, y); const fz = f(z[0], z[1]); if (fz) rhs += fz * Math.abs(Mp.J(x, y)); }
          rhs *= ha * hb;
          const ok = Math.abs(lhs - rhs) < 2e-3 * Math.max(1, Math.abs(lhs));
          Rs.corner(ok ? 'the two integrals agree' : which.value === 'wrap' && inside ? 'T is not 1-1: overlap counted twice' : 'supp f ⊄ T(E)', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { cellA: da * db, areaImg, Jc, lhs, rhs, ok };
        });
        v.readout(() => `Cell: area $${v.fix(st.cellA, 4)}$, image area $${v.fix(st.areaImg, 4)}$, $\\;|J_T(\\text{centre})|\\cdot\\text{area}=${v.fix(st.Jc * st.cellA, 4)}$. $\\quad\\int f(\\mathbf y)\\,d\\mathbf y=${v.fix(st.lhs, 4)}$, $\\;\\int f(T(\\mathbf x))|J_T(\\mathbf x)|\\,d\\mathbf x=${v.fix(st.rhs, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.10
    {
      num: '10.10',
      kind: 'Definition',
      name: 'k-surface',
      statement: String.raw`Let $E\subset\R^n$ be open. A **$k$-surface in $E$** is a $\mathscr C'$-mapping $\Phi$ of a compact set $D\subset\R^k$ into $E$; $D$ is its **parameter domain**, with points written $\mathbf u=(u_1,\dots,u_k)$. Rudin takes $D$ to be either a $k$-cell or the standard simplex $Q^k=\{\mathbf u: u_i\ge0,\ \sum u_i\le1\}$. A $k$-surface is the *map*, not its image: $\Phi$ need not be one-to-one, and $\Phi'$ need not have rank $k$. The $1$-surfaces are exactly the continuously differentiable curves of 6.26.`,
      idea: String.raw`Integrals of $k$-forms (10.11) are defined by pulling everything back to $D$, where the integral of 10.1 is available. Keeping the parametrization (rather than the image set) is what makes orientation, multiplicities and the boundary operator of later sections work.`,
      caption: String.raw`Left: the parameter domain $D$ (a square, the simplex $Q^2$, or an interval) with its grid; drag $\mathbf u$. Right: the $k$-surface in $\R^3$ (drag to rotate), with $\Phi(\mathbf u)$ and the tangent vectors $D_1\Phi$ (orange) and $D_2\Phi$ (purple). The cone example is a perfectly good $2$-surface although it is not one-to-one: the two green edges of $D$ go to the same segment, and the red edge $u_1=0$ is crushed to the apex, where $D_2\Phi=\mathbf 0$.`,
      deps: ['pma-9.20', 'pma-6.26'],
      tags: ['surfaces', 'parametrization'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        const EX = {
          torus: { label: 'torus patch', D: 'cell', P: (u, w) => { const a = 1.5 * Math.PI * u - 0.4, b = 1.6 * Math.PI * w; return [(0.9 + 0.38 * Math.cos(b)) * Math.cos(a), (0.9 + 0.38 * Math.cos(b)) * Math.sin(a), 0.38 * Math.sin(b)]; } },
          saddle: { label: 'saddle', D: 'cell', P: (u, w) => { const x = 2 * u - 1, y = 2 * w - 1; return [x, y, 0.55 * (x * x - y * y)]; } },
          cone: { label: 'cone (not 1-1)', D: 'cell', P: (u, w) => [u * Math.cos(TAU * w), u * Math.sin(TAU * w), 0.8 - u] },
          octant: { label: 'octant, $D=Q^2$', D: 'simplex', P: (u, w) => { const z = [u, w, 1 - u - w], n = Math.hypot(...z); return [1.2 * z[0] / n - 0.3, 1.2 * z[1] / n - 0.3, 1.2 * z[2] / n - 0.5]; } },
          helix: { label: 'helix, $k=1$', D: 'interval', P: (u) => [0.8 * Math.cos(3 * TAU * u * 0.5), 0.8 * Math.sin(3 * TAU * u * 0.5), 1.6 * u - 0.8] },
        };
        const which = v.select('$\\Phi$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'cone');
        const L = v.stage({ x: [-0.15, 1.15], y: [-0.15, 1.15], equal: true, height: 340, minWidth: 250, axes: true, xlabel: 'u₁', ylabel: 'u₂', title: 'parameter domain $D\\subset\\R^k$' });
        const S = v.stage3d({ range: 1.45, height: 340, yaw: -0.7, pitch: 0.42, weight: 1.4, title: 'the $k$-surface $\\Phi:D\\to\\R^3$' });
        const u = L.handle(0.3, 0.6, { color: 'gold', label: 'u', constrain: (x, y) => {
          const D = EX[which.value].D;
          if (D === 'interval') return [M.clamp(x, 0, 1), 0];
          if (D === 'simplex') { x = Math.max(0, x); y = Math.max(0, y); const s = x + y; return s > 1 ? [x / s, y / s] : [x, y]; }
          return [M.clamp(x, 0, 1), M.clamp(y, 0, 1)];
        } });
        let st = {};
        v.legend([['orange', '$D_1\\Phi(\\mathbf u)$ and lines $u_2=$ const'], ['purple', '$D_2\\Phi(\\mathbf u)$ and lines $u_1=$ const'], ['gold', '$\\mathbf u\\mapsto\\Phi(\\mathbf u)$', { dot: true }]]);
        v.render(() => {
          const E = EX[which.value], D = E.D;
          // constrain the handle when the domain type changes
          if (D === 'interval') u.y = 0; else if (D === 'simplex' && u.x + u.y > 1) { const s = u.x + u.y; u.x /= s; u.y /= s; }
          const P = E.P;
          const grid = M.linspace(0, 1, 9);
          if (D === 'interval') {
            L.line(0, 0, 1, 0, { color: 'orange', width: 5, cap: 'butt' });
            S.curve(P, 0, 1, { color: 'accent', width: 3, n: 200 });
            for (const t of grid) S.dot(P(t), { color: 'orange', r: 2.5 });
          } else {
            if (D === 'simplex') L.poly([[0, 0], [1, 0], [0, 1]], { fill: 'accent', fillAlpha: 0.1, color: 'ink', width: 1.6 });
            else L.rect(0, 0, 1, 1, { fill: 'accent', fillAlpha: 0.1, color: 'ink', width: 1.6 });
            for (const g of grid) {
              const top = D === 'simplex' ? 1 - g : 1;
              if (top <= 0) continue;
              L.line(g, 0, g, top, { color: 'purple', width: 1, alpha: 0.7 });
              L.line(0, g, top, g, { color: 'orange', width: 1, alpha: 0.7 });
            }
            const F = D === 'simplex' ? (s, w) => P(s * (1 - w), s * w) : P;
            S.surface(F, [0, 1], [0, 1], { nu: 22, nv: 22, color: 'accent', alpha: 0.5, shade: true });
            if (which.value === 'cone') {
              L.line(0, 0, 0, 1, { color: 'red', width: 4, cap: 'butt' });
              L.line(0, 0, 1, 0, { color: 'green', width: 4, cap: 'butt' }); L.line(0, 1, 1, 1, { color: 'green', width: 4, cap: 'butt' });
              S.curve((t) => P(t, 0), 0, 1, { color: 'green', width: 4, n: 20, bias: -0.2 });
              S.dot(P(0, 0.5), { color: 'red', r: 6, bias: -0.3 });
            }
            for (const g of grid) {
              const top = D === 'simplex' ? 1 - g : 1;
              if (top <= 1e-9) continue;
              S.curve((t) => P(g, t * top), 0, 1, { color: 'purple', width: 1.1, alpha: 0.8, n: 40 });
              S.curve((t) => P(t * top, g), 0, 1, { color: 'orange', width: 1.1, alpha: 0.8, n: 40 });
            }
          }
          const h = 1e-5, x = P(u.x, u.y);
          const d1 = M.vscale(M.vsub(P(u.x + h, u.y), P(u.x - h, u.y)), 1 / (2 * h));
          const d2 = D === 'interval' ? null : M.vscale(M.vsub(P(u.x, u.y + h), P(u.x, u.y - h)), 1 / (2 * h));
          S.arrow(x, M.vadd(x, M.vscale(d1, 0.35)), { color: 'orange', width: 3, head: 9, bias: -0.5 });
          if (d2 && M.norm(d2) > 1e-6) S.arrow(x, M.vadd(x, M.vscale(d2, 0.35)), { color: 'purple', width: 3, head: 9, bias: -0.5 });
          S.dot(x, { color: 'gold', r: 6, label: 'Φ(u)', bias: -0.6 });
          const area = d2 ? M.norm(M.cross3(d1, d2)) : M.norm(d1);
          st = { D, x, d1, d2, area, which: which.value, u: [u.x, u.y] };
        });
        v.readout(() => {
          const s = st, f = (p) => `(${p.map((t) => v.fix(t, 2)).join(',')})`;
          if (s.D === 'interval') return `$\\Phi(${v.fix(s.u[0], 2)})=${f(s.x)}$, $\\;\\Phi'(u)=${f(s.d1)}$: a $1$-surface is a $\\mathscr C'$ curve, parametrized by $D=[0,1]$.`;
          return `$\\Phi(\\mathbf u)=${f(s.x)}$, $\\;D_1\\Phi=${f(s.d1)}$, $\\;D_2\\Phi=${f(s.d2)}$, $\\;|D_1\\Phi\\times D_2\\Phi|=${v.fix(s.area, 3)}$` + (s.which === 'cone' ? (s.area < 1e-3 ? ' — rank $<2$ here: the whole edge $u_1=0$ goes to the apex.' : '. The edges $u_2=0$ and $u_2=1$ have the same image, so $\\Phi$ is not one-to-one.') : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.11
    {
      num: '10.11',
      kind: 'Definition',
      name: 'Differential forms and their integrals',
      statement: String.raw`Let $E\subset\R^n$ be open and $k\ge1$. A **$k$-form in $E$** is a function $\omega$, written symbolically as
$$\omega=\sum a_{i_1\cdots i_k}(\mathbf x)\,dx_{i_1}\wedge\cdots\wedge dx_{i_k}$$
(each index running independently over $1,\dots,n$, with real continuous coefficients $a_{i_1\cdots i_k}$ on $E$), which assigns to every $k$-surface $\Phi$ in $E$ with parameter domain $D$ the number
$$\int_\Phi\omega=\int_D\sum a_{i_1\cdots i_k}\big(\Phi(\mathbf u)\big)\,\frac{\partial(x_{i_1},\dots,x_{i_k})}{\partial(u_1,\dots,u_k)}\,d\mathbf u,$$
the Jacobian being that of $\mathbf u\mapsto(\phi_{i_1}(\mathbf u),\dots,\phi_{i_k}(\mathbf u))$, where $\phi_1,\dots,\phi_n$ are the components of $\Phi$. The form is of class $\mathscr C'$ or $\mathscr C''$ when its coefficients are. A $0$-form in $E$ is a continuous real function on $E$.`,
      idea: String.raw`The symbol $dx_{i_1}\wedge\cdots\wedge dx_{i_k}$ is defined only through what it does to surfaces: it integrates the Jacobian of the corresponding $k$ coordinates. For $k=1$ and a curve $\gamma$ this is the line integral $\int_0^1\sum_i a_i(\gamma(t))\gamma_i'(t)\,dt$ — the form eats the velocity vector. Example 10.12(a): for a closed curve, $\int_\gamma x\,dy$ is the signed area enclosed.`,
      caption: String.raw`The curve $\gamma$ is controlled by four handles; arrows show the coefficient field $(a_1,a_2)$ of $\omega=a_1\,dx+a_2\,dy$. Drag the gold point on the right (the parameter $t$): the integrand $\omega(\gamma'(t))=a_1\gamma_1'+a_2\gamma_2'$ is the dot product of the field with the velocity, and its signed area is $\int_\gamma\omega$. Reverse the orientation and the integral changes sign; close the curve with $\omega=x\,dy$ and it equals the enclosed area; for $\omega=df$ it only depends on the endpoints.`,
      deps: ['pma-10.10', 'pma-10.1', 'pma-9.33'],
      see: ['pma-6.27'],
      tags: ['differential forms', 'line integrals'],
      viz(v) {
        const M = v.M;
        const W = {
          xdy: { label: '$x\\,dy$', F: (x, y) => [0, x] },
          rot: { label: '$-y\\,dx+x\\,dy$', F: (x, y) => [-y, x] },
          df: { label: '$df,\\ f=\\sin x+\\tfrac12y^2$', F: (x, y) => [Math.cos(x), y], f: (x, y) => Math.sin(x) + 0.5 * y * y },
        };
        const which = v.select('$\\omega$', Object.entries(W).map(([value, o]) => ({ value, label: o.label })), 'xdy');
        const closed = v.toggle('closed curve', false);
        const rev = v.toggle('reverse orientation', false);
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.7, 1.7], equal: true, height: 340, title: 'the field $(a_1,a_2)$ of $\\omega$ and the curve $\\gamma$' });
        const R = v.stage({ x: [-0.03, 1.03], y: [-2, 2], height: 340, axes: true, xlabel: 't', title: 'integrand $\\omega(\\gamma\'(t))=\\sum_i a_i(\\gamma(t))\\,\\gamma_i\'(t)$' });
        const H = [[-1.7, -0.5], [-0.2, 1.9], [0.4, -1.9], [1.7, 0.6]].map((p, k) => L.handle(p[0], p[1], { color: 'ink', r: 6, label: ['p₀', 'p₁', 'p₂', 'p₃'][k] }));
        const th = R.handle(0.55, 0, { color: 'gold', constrain: (x) => [M.clamp(x, 0, 1), 0] });
        let st = {};
        v.legend([['muted', 'field $(a_1,a_2)$'], ['gold', 'traversed part $\\gamma([0,t])$'], ['blue', 'integrand $>0$', { area: true }], ['orange', 'integrand $<0$', { area: true }]]);
        v.render(() => {
          const O = W[which.value], P = H.map((h) => [h.x, h.y]);
          H.forEach((h, k) => { h.label = closed.value ? ['q₀', 'q₁', 'q₂', 'q₃'][k] : ['p₀', 'p₁', 'p₂', 'p₃'][k]; });
          const bez = (t) => { const s = 1 - t; return [0, 1].map((i) => s * s * s * P[0][i] + 3 * s * s * t * P[1][i] + 3 * s * t * t * P[2][i] + t * t * t * P[3][i]); };
          const cr = (t) => { // closed Catmull–Rom through the four handles
            const T = M.mod(t, 1) * 4, k = Math.floor(T) % 4, s = T - Math.floor(T);
            const p0 = P[(k + 3) % 4], p1 = P[k], p2 = P[(k + 1) % 4], p3 = P[(k + 2) % 4];
            return [0, 1].map((i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * s + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * s * s + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * s * s * s));
          };
          const g0 = closed.value ? cr : bez, g = rev.value ? (t) => g0(1 - t) : g0;
          const dg = (t) => { const h = 1e-5, a = g(Math.max(0, t - h)), b = g(Math.min(1, t + h)); const dt = Math.min(1, t + h) - Math.max(0, t - h); return [(b[0] - a[0]) / dt, (b[1] - a[1]) / dt]; };
          const integrand = (t) => { const p = g(t), F = O.F(p[0], p[1]), d = dg(t); return F[0] * d[0] + F[1] * d[1]; };
          L.field(O.F, { spacing: 34, color: 'muted', alpha: 0.55 });
          if (!closed.value) L.path([P[0], P[1], P[2], P[3]], { color: 'faint', width: 1, dash: [3, 4] });
          L.curve(g, 0, 1, { color: 'ink', width: 2.4, n: 300 });
          const t = th.x;
          L.curve(g, 0, t, { color: 'gold', width: 4.5, n: Math.max(2, Math.round(300 * t)) });
          for (const s of [0.2, 0.5, 0.8]) { const a = g(s), b = g(s + 0.01); L.arrow(a[0], a[1], b[0], b[1], { color: 'ink', head: 10, width: 0.1 }); }
          const pt = g(t), vel = dg(t), Fv = O.F(pt[0], pt[1]);
          const sc = 0.35 / Math.max(1e-9, Math.hypot(...vel)) * Math.min(2.5, Math.hypot(...vel));
          L.arrow(pt[0], pt[1], pt[0] + vel[0] * 0.25, pt[1] + vel[1] * 0.25, { color: 'gold', width: 2.4, head: 8 });
          L.arrow(pt[0], pt[1], pt[0] + Fv[0] * 0.5, pt[1] + Fv[1] * 0.5, { color: 'accent', width: 2.4, head: 8 });
          L.dot(pt[0], pt[1], { color: 'gold', r: 5.5, label: 'γ(t)', labelPos: 'sw' });
          void sc;
          // right panel
          const ts = M.linspace(0, 1, 401), ys = ts.map(integrand);
          const lo = Math.min(0, ...ys), hi = Math.max(0, ...ys), pad = 0.12 * (hi - lo || 1);
          R.setView(null, [lo - pad, hi + pad]);
          R.path(ts.map((s, i) => [s, Math.max(0, ys[i])]).concat([[1, 0], [0, 0]]), { fill: 'blue', fillAlpha: 0.2, stroke: false, close: true });
          R.path(ts.map((s, i) => [s, Math.min(0, ys[i])]).concat([[1, 0], [0, 0]]), { fill: 'orange', fillAlpha: 0.25, stroke: false, close: true });
          const k = Math.round(t * 400);
          R.path(ts.slice(0, k + 1).map((s, i) => [s, ys[i]]).concat([[t, 0], [0, 0]]), { fill: 'gold', fillAlpha: 0.28, stroke: false, close: true });
          R.path(ts.map((s, i) => [s, ys[i]]), { color: 'ink', width: 2 });
          R.line(t, 0, t, integrand(t), { color: 'gold', width: 2 });
          th.y = 0;
          const total = M.integrate(integrand, 0, 1, 800), part = t > 0 ? M.integrate(integrand, 0, t, 400) : 0;
          let extra = '';
          if (which.value === 'xdy' && closed.value) { const poly = ts.map(g); extra = `; enclosed signed area $=${v.fix(M.polyArea(poly), 4)}$`; }
          if (which.value === 'df') { const a = g(0), b = g(1); extra = `; $\\;f(\\gamma(1))-f(\\gamma(0))=${v.fix(O.f(...b) - O.f(...a), 4)}$`; }
          st = { total, part, t, extra };
        });
        v.readout(() => `$\\int_{\\gamma|[0,${v.fix(st.t, 2)}]}\\omega=${v.fix(st.part, 4)}$, $\\quad\\int_\\gamma\\omega=${v.fix(st.total, 4)}$${st.extra}.`);
      },
    },
  ],
};
