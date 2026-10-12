// Rudin, Principles of Mathematical Analysis — Chapter 2 (part): metric spaces, 2.15–2.22

// ℓ^p length of (dx, dy); p = 1, 2 or Infinity.
function pnorm(dx, dy, p) {
  if (p === 1) return Math.abs(dx) + Math.abs(dy);
  if (p === Infinity) return Math.max(Math.abs(dx), Math.abs(dy));
  return Math.hypot(dx, dy);
}
// Scale (dx, dy) so that its ℓ^p length is at most m.
function clampNorm(dx, dy, p, m) {
  const n = pnorm(dx, dy, p);
  return n > m && n > 0 ? [(dx * m) / n, (dy * m) / n] : [dx, dy];
}
const yes = (b) => (b ? '✓' : '✗');

export default {
  book: 'pma',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Definition',
      name: 'Metric space',
      statement: String.raw`A set $X$, whose elements are called points, is a **metric space** if to every pair $p,q\in X$ there is assigned a real number $d(p,q)$, the distance from $p$ to $q$, such that
(a) $d(p,q)>0$ when $p\ne q$, and $d(p,p)=0$;
(b) $d(p,q)=d(q,p)$;
(c) $d(p,q)\le d(p,r)+d(r,q)$ for every $r\in X$ (the triangle inequality).
Any function $d$ with these three properties is called a **distance function**, or **metric**.`,
      idea: String.raw`The axioms isolate exactly what later proofs use: (a) separates points, (b) makes "near" symmetric, and the triangle inequality (c) is what makes neighbourhoods open (2.19) and limits unique. The basic example is $\R^k$ with $d(x,y)=|x-y|$, whose triangle inequality is 1.37; the same set carries many other metrics, and any subset of a metric space is a metric space with the restricted $d$.`,
      caption: String.raw`Drag $p$, $q$ and the intermediate point $r$, and switch the distance. The shaded region is the ball $\{x: d(p,x)<d(p,q)\}$, which has $q$ on its rim; for the taxicab metric the coloured paths are shortest grid routes. The last option, $|p-q|^2$, is *not* a metric: put $r$ near the midpoint of $pq$ and the triangle inequality fails.`,
      deps: [],
      see: ['pma-1.37'],
      tags: ['metric spaces'],
      viz(v) {
        const MET = {
          e: { label: '$\\ell^2$ (euclidean)', d: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) },
          t: { label: '$\\ell^1$ (taxicab)', d: (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) },
          m: { label: '$\\ell^\\infty$ (max)', d: (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) },
          disc: { label: 'discrete', d: (a, b) => (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9 ? 0 : 1) },
          sq: { label: '$|p-q|^2$ (not a metric)', d: (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 },
        };
        const which = v.select('$d$', Object.entries(MET).map(([value, o]) => ({ value, label: o.label })), 'e');
        const showBall = v.toggle('ball $\\{d(p,\\cdot)<d(p,q)\\}$', true);
        const S = v.stage({ x: [-3.6, 3.6], y: [-2.1, 2.1], equal: true, height: 360, grid: true, axes: false });
        const P = S.handle(-1.9, -0.6, { color: 'blue', label: 'p' });
        const Q = S.handle(1.8, -0.3, { color: 'blue', label: 'q' });
        const R = S.handle(-0.1, 1.2, { color: 'gold', label: 'r' });
        let st = {};
        const ballRGB = v.rgb('blue');
        v.render(() => {
          const D = MET[which.value].d, w = which.value;
          const p = [P.x, P.y], q = [Q.x, Q.y], r = [R.x, R.y];
          const dpq = D(p, q), dpr = D(p, r), drq = D(r, q);
          if (showBall.value) {
            S.raster((x, y) => (D(p, [x, y]) < dpq ? [ballRGB[0], ballRGB[1], ballRGB[2], 34] : null), { res: 2, key: `${w}|${p}|${dpq}` });
          }
          // edges: the straight triangle, plus taxicab routes
          const edge = (a, b, col, lab, width) => {
            if (w === 't') S.path([a, [b[0], a[1]], b], { color: col, width });
            else S.line(a[0], a[1], b[0], b[1], { color: col, width, dash: w === 'disc' ? [6, 5] : null });
            const cx = (p[0] + q[0] + r[0]) / 3, cy = (p[1] + q[1] + r[1]) / 3;
            const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
            const ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1;
            S.text(lab, mx + (ox / ol) * 0.32, my + (oy / ol) * 0.32, { align: 'center', color: col, size: 13, weight: 600 });
          };
          if (w === 't') { S.line(p[0], p[1], q[0], q[1], { color: 'faint', width: 1, dash: [3, 4] }); S.line(p[0], p[1], r[0], r[1], { color: 'faint', width: 1, dash: [3, 4] }); S.line(r[0], r[1], q[0], q[1], { color: 'faint', width: 1, dash: [3, 4] }); }
          edge(p, r, 'orange', v.fmt(dpr, 3), 2.2);
          edge(r, q, 'orange', v.fmt(drq, 3), 2.2);
          edge(p, q, 'blue', v.fmt(dpq, 3), 2.8);
          const ok = dpq <= dpr + drq + 1e-12;
          S.corner(ok ? 'd(p,q) ≤ d(p,r) + d(r,q)  ✓' : 'd(p,q) > d(p,r) + d(r,q): triangle inequality fails', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { dpq, dpr, drq, ok, w };
        });
        v.legend([['blue', '$d(p,q)$'], ['orange', '$d(p,r)$ and $d(r,q)$'], ['blue', 'ball about $p$ through $q$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.dpq == null) return '';
          const rel = s.ok ? '\\le' : '>';
          return `$d(p,q) = ${v.fix(s.dpq, 3)} \\;${rel}\\; d(p,r)+d(r,q) = ${v.fix(s.dpr, 3)} + ${v.fix(s.drq, 3)} = ${v.fix(s.dpr + s.drq, 3)}$` + (s.ok ? (s.w === 'sq' ? ' — this time; now move $r$ toward the midpoint of $pq$.' : '.') : ' — so $|p-q|^2$ violates axiom (c).');
        });
      },
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Definition',
      name: 'Segments, intervals, k-cells, balls and convex sets',
      statement: String.raw`(a) For real $a<b$, the **segment** $(a,b)$ is the set of $x$ with $a<x<b$, and the **interval** $[a,b]$ the set of $x$ with $a\le x\le b$; the half-open $[a,b)$ and $(a,b]$ are defined in the same way.
(b) If $a_i<b_i$ for $i=1,\dots,k$, the set of $x=(x_1,\dots,x_k)\in\R^k$ with $a_i\le x_i\le b_i$ for every $i$ is a **$k$-cell**.
(c) For $x\in\R^k$ and $r>0$, the **open ball** with centre $x$ and radius $r$ is $\{y\in\R^k:|y-x|<r\}$, and the **closed ball** is $\{y:|y-x|\le r\}$.
(d) $E\subset\R^k$ is **convex** if $\lambda x+(1-\lambda)y\in E$ whenever $x,y\in E$ and $0<\lambda<1$. Balls and $k$-cells are convex.`,
      idea: String.raw`For an open ball with centre $x$: if $|y-x|<r$ and $|z-x|<r$, then
$$|\lambda y+(1-\lambda)z-x|=|\lambda(y-x)+(1-\lambda)(z-x)|\le\lambda|y-x|+(1-\lambda)|z-x|<r,$$
by the triangle inequality; closed balls work the same way. For a $k$-cell, each coordinate of $\lambda y+(1-\lambda)z$ lies between the corresponding coordinates of $y$ and $z$, hence in $[a_i,b_i]$.`,
      caption: String.raw`Drag $y$ and $z$ and move $\lambda$. The segment from $z$ ($\lambda=0$) to $y$ ($\lambda=1$) is green where it stays inside $E$ and red where it leaves. For the ball the readout checks the triangle-inequality estimate; the crescent is not convex, so its segment can poke out.`,
      deps: ['pma-1.37'],
      see: ['fa-3.4'],
      tags: ['convexity', 'euclidean space'],
      viz(v) {
        const SH = {
          ball: { label: 'open ball', inE: (x, y) => Math.hypot(x, y) < 1.6 },
          cell: { label: '2-cell', inE: (x, y) => x >= -2.4 && x <= 1.9 && y >= -1.2 && y <= 1.4 },
          cres: { label: 'crescent (not convex)', inE: (x, y) => Math.hypot(x, y) < 1.7 && Math.hypot(x - 1.0, y - 0.25) >= 1.15 },
        };
        const which = v.select('$E$', Object.entries(SH).map(([value, o]) => ({ value, label: o.label })), 'ball');
        const lam = v.slider('$\\lambda$', 0, 1, 0.4, { step: 0.01 });
        const S = v.stage({ x: [-3.4, 3.4], y: [-2.0, 2.0], equal: true, height: 350, axes: false });
        const Y = S.handle(-1.1, 0.75, { color: 'blue', label: 'y' });
        const Z = S.handle(0.6, -1.2, { color: 'blue', label: 'z' });
        let last = 'ball', st = {};
        const C = v.rgb('blue');
        v.render(() => {
          const w = which.value, E = SH[w];
          if (last !== w) { last = w; if (w === 'cres') { Y.set(-0.6, 1.45); Z.set(-0.6, -1.45); } else { Y.set(-1.1, 0.75); Z.set(0.6, -1.2); } }
          S.raster((x, y) => (E.inE(x, y) ? [C[0], C[1], C[2], 46] : null), { res: 2, key: w });
          if (w === 'ball') {
            S.circle(0, 0, 1.6, { color: 'blue', width: 1.6, dash: [6, 5] });
            for (const h of [Y, Z]) S.line(0, 0, h.x, h.y, { color: 'muted', width: 1.1, dash: [3, 3] });
            S.dot(0, 0, { r: 3, color: 'ink', label: 'x', labelPos: 'sw' });
          }
          else if (w === 'cell') { S.rect(-2.4, -1.2, 1.9, 1.4, { color: 'blue', width: 1.8 }); S.text('[a₁,b₁] × [a₂,b₂]', 1.85, -1.42, { align: 'right', size: 11.5, color: 'blue' }); }
          else { S.curve((t) => [1.7 * Math.cos(t), 1.7 * Math.sin(t)], 0, 2 * Math.PI, { color: 'blue', width: 1.2, alpha: 0.5 }); }
          // segment λy + (1-λ)z, coloured by membership
          const n = 300; let out = 0; let run = [], runIn = null;
          const flush = () => { if (run.length > 1) S.path(run, { color: runIn ? 'green' : 'red', width: 3.4 }); };
          for (let i = 0; i <= n; i++) {
            const t = i / n, x = t * Y.x + (1 - t) * Z.x, y = t * Y.y + (1 - t) * Z.y, inside = E.inE(x, y);
            if (!inside) out++;
            if (runIn !== null && inside !== runIn) { run.push([x, y]); flush(); run = [[x, y]]; } else run.push([x, y]);
            runIn = inside;
          }
          flush();
          const l = lam.value, wx = l * Y.x + (1 - l) * Z.x, wy = l * Y.y + (1 - l) * Z.y;
          if (w === 'ball') S.line(0, 0, wx, wy, { color: 'gold', width: 1.4, dash: [3, 3] });
          S.dot(wx, wy, { r: 6, color: 'gold', label: 'λy + (1−λ)z', labelPos: 'e', labelColor: 'ink' });
          const yIn = E.inE(Y.x, Y.y), zIn = E.inE(Z.x, Z.y);
          if (!yIn || !zIn) S.corner('move both endpoints into E', 'tl', { color: 'muted' });
          else S.corner(out ? 'the segment leaves E: E is not convex' : 'the whole segment lies in E', 'tl', { color: out ? 'red' : 'green', weight: 600 });
          st = { w, l, yIn, zIn, out, wx, wy };
        });
        v.legend([['blue', '$E$', { area: true }], ['green', 'segment inside $E$'], ['red', 'segment outside $E$'], ['gold', '$\\lambda y+(1-\\lambda)z$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'ball') {
            const dy = Math.hypot(Y.x, Y.y), dz = Math.hypot(Z.x, Z.y), dw = Math.hypot(s.wx, s.wy);
            return `$|\\lambda y+(1-\\lambda)z-x| = ${v.fix(dw, 3)} \\le \\lambda|y-x|+(1-\\lambda)|z-x| = ${v.fix(s.l * dy + (1 - s.l) * dz, 3)}$` + (s.yIn && s.zIn ? ' $< r = 1.6$' : ' (endpoints not both in $E$)');
          }
          if (s.w === 'cell') return `coordinates of the gold point: $${v.fix(s.wx, 2)}$ lies between $${v.fix(Z.x, 2)}$ and $${v.fix(Y.x, 2)}$, $\\;${v.fix(s.wy, 2)}$ between $${v.fix(Z.y, 2)}$ and $${v.fix(Y.y, 2)}$ — so it stays in the cell.`;
          return s.out ? `${Math.round((100 * s.out) / 301)}% of the segment lies outside $E$: the crescent is not convex.` : 'This particular segment stays inside, but others do not — try $y$ and $z$ on the two horns.';
        });
      },
    },
    // ------------------------------------------------------------------ 2.18
    {
      num: '2.18',
      kind: 'Definition',
      name: 'Neighbourhoods, limit points, open and closed sets',
      statement: String.raw`Let $X$ be a metric space; all points and sets below lie in $X$.
(a) A **neighbourhood** of $p$ is a set $N_r(p)=\{q: d(p,q)<r\}$ with $r>0$, its radius.
(b) $p$ is a **limit point** of $E$ if every neighbourhood of $p$ contains a point $q\ne p$ with $q\in E$.
(c) A point of $E$ that is not a limit point of $E$ is an **isolated point** of $E$.
(d) $E$ is **closed** if every limit point of $E$ belongs to $E$.
(e) $p$ is an **interior point** of $E$ if some neighbourhood of $p$ is contained in $E$.
(f) $E$ is **open** if every point of $E$ is an interior point of $E$.
(g) The **complement** $E^c$ is the set of all $p\in X$ with $p\notin E$.
(h) $E$ is **perfect** if $E$ is closed and every point of $E$ is a limit point of $E$.
(i) $E$ is **bounded** if there are a real $M$ and a point $q\in X$ with $d(p,q)<M$ for all $p\in E$.
(j) $E$ is **dense** in $X$ if every point of $X$ is a limit point of $E$, or a point of $E$, or both.`,
      idea: String.raw`Everything is phrased through neighbourhoods, that is, through the metric alone. Rudin's examples in $\R^2$ (2.21) show that the properties are independent: the open disc is open but not closed; the closed disc is closed and perfect; a finite set and $\Z$ are closed without limit points; $\{1/n\}$ has the limit point $0$ but is neither open nor closed; a segment of the real axis is not open in $\R^2$; and $\R^2$ is both open and closed.`,
      caption: String.raw`Pick one of the example sets in the plane, drag $p$ (it snaps to special points such as $0$, the rim of the disc and the points of discrete sets) and change the radius. Gold marks $E\cap N_r(p)$ minus $p$. The readout classifies $p$; the box lists the properties of $E$.`,
      deps: ['pma-2.15'],
      see: ['rca-1.2'],
      tags: ['topology', 'open sets', 'closed sets'],
      viz(v) {
        const eq = (a, b) => Math.abs(a - b) < 1e-9;
        const F5 = [[-2.2, 0.9], [-1.1, -0.6], [0.3, 1.1], [1.4, -0.9], [2.4, 0.5]];
        const recip = Array.from({ length: 400 }, (_, i) => 1 / (i + 1));
        const EX = {
          a: { label: '$|z|<1$', inE: (x, y) => Math.hypot(x, y) < 1 - 1e-12, lim: (x, y) => Math.hypot(x, y) <= 1 + 1e-9, int: (x, y) => Math.hypot(x, y) < 1 - 1e-9, props: [0, 1, 0, 1], region: true },
          b: { label: '$|z|\\le1$', inE: (x, y) => Math.hypot(x, y) <= 1 + 1e-9, lim: (x, y) => Math.hypot(x, y) <= 1 + 1e-9, int: (x, y) => Math.hypot(x, y) < 1 - 1e-9, props: [1, 0, 1, 1], region: true },
          c: { label: 'finite set', pts: F5, inE: (x, y) => F5.some((q) => eq(q[0], x) && eq(q[1], y)), lim: () => false, int: () => false, props: [1, 0, 0, 1] },
          d: { label: '$\\Z$', pts: Array.from({ length: 9 }, (_, i) => [i - 4, 0]), inE: (x, y) => eq(y, 0) && eq(x, Math.round(x)), lim: () => false, int: () => false, props: [1, 0, 0, 0] },
          e: { label: '$\\{1/n\\}$', pts: recip.map((x) => [x, 0]), inE: (x, y) => eq(y, 0) && x > 0 && eq(1 / x, Math.round(1 / x)), lim: (x, y) => eq(x, 0) && eq(y, 0), int: () => false, props: [0, 0, 0, 1] },
          f: { label: '$\\R^2$', inE: () => true, lim: () => true, int: () => true, props: [1, 1, 1, 0], region: true },
          g: { label: 'segment $(-\\frac32,\\frac32)$', inE: (x, y) => eq(y, 0) && Math.abs(x) < 1.5 - 1e-12, lim: (x, y) => eq(y, 0) && Math.abs(x) <= 1.5 + 1e-9, int: () => false, props: [0, 0, 0, 1] },
        };
        const which = v.select('$E$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'a');
        const rad = v.slider('radius $r$', 0.02, 1.5, 0.42, { log: true, decimals: 3 });
        const S = v.stage({ x: [-3.4, 3.4], y: [-1.75, 1.75], equal: true, height: 360, axes: true, yticks: [], xticks: [-3, -2, -1, 1, 2, 3] });
        const snap = (x, y) => {
          const tol = 11 / S.scale, w = which.value, E = EX[w];
          const cands = [[0, 0]];
          if (E.pts) cands.push(...E.pts.slice(0, 60));
          if (w === 'g') cands.push([-1.5, 0], [1.5, 0]);
          for (const c of cands) if (Math.hypot(c[0] - x, c[1] - y) < tol) return c.slice();
          if ((w === 'a' || w === 'b') && Math.abs(Math.hypot(x, y) - 1) < tol) { const n = Math.hypot(x, y); return [x / n, y / n]; }
          if ((w === 'g' || w === 'd' || w === 'e') && Math.abs(y) < tol) return [x, 0];
          return [x, y];
        };
        const P = S.handle(0.55, 0.45, { color: 'ink', label: 'p', constrain: snap });
        const G = v.rgb('gold'), B = v.rgb('blue'), O = v.rgb('orange');
        let last = 'a', st = {};
        v.render(() => {
          const w = which.value, E = EX[w], r = rad.value;
          if (last !== w) { last = w; const start = { a: [0.55, 0.45], b: [0.6, 0.8], c: [0.3, 1.1], d: [1, 0], e: [0, 0], f: [0.5, 0.5], g: [0.6, 0] }[w]; P.x = start[0]; P.y = start[1]; }
          const px = P.x, py = P.y;
          // the set E
          if (E.region) {
            S.raster((x, y) => { const inN = Math.hypot(x - px, y - py) < r, inE = E.inE(x, y); if (inN && inE) return [G[0], G[1], G[2], 120]; if (inN) return [O[0], O[1], O[2], 40]; return inE ? [B[0], B[1], B[2], 45] : null; }, { res: 2, key: `${w}|${px}|${py}|${r}` });
            if (w !== 'f') S.circle(0, 0, 1, { color: 'blue', width: 2.2, dash: w === 'a' ? [6, 5] : null });
          } else S.circle(px, py, r, { fill: 'orange', fillAlpha: 0.12, stroke: false });
          S.circle(px, py, r, { color: 'orange', width: 1.6, dash: [5, 4] });
          let count = 0;
          if (E.pts) {
            for (const q of E.pts) {
              const inside = Math.hypot(q[0] - px, q[1] - py) < r && !(eq(q[0], px) && eq(q[1], py));
              if (inside) count++;
              S.dot(q[0], q[1], { r: w === 'e' ? 2.6 : 4.2, color: inside ? 'gold' : 'blue', ring: w !== 'e' });
            }
          }
          if (w === 'g') {
            S.line(-1.5, 0, 1.5, 0, { color: 'blue', width: 4 });
            S.dot(-1.5, 0, { hollow: true, color: 'blue', r: 5 }); S.dot(1.5, 0, { hollow: true, color: 'blue', r: 5 });
            if (Math.abs(py) < r) { const hw = Math.sqrt(r * r - py * py); const a = Math.max(-1.5, px - hw), b = Math.min(1.5, px + hw); if (b > a) S.line(a, 0, b, 0, { color: 'gold', width: 5 }); }
          }
          // property box
          const names = ['closed', 'open', 'perfect', 'bounded'];
          names.forEach((nm, i) => S.textPx(`${nm} ${E.props[i] ? '✓' : '✗'}`, S.width - 12, 16 + i * 17, { align: 'right', size: 12, color: E.props[i] ? 'green' : 'muted', weight: 600 }));
          const inE = E.inE(px, py), lim = E.lim(px, py), int = E.int(px, py);
          if (w === 'e') {
            // exact count of n with |1/n - p| < r (the list above is truncated at n = 400)
            count = 0;
            if (Math.abs(py) < r) {
              const s0 = Math.sqrt(r * r - py * py), a = px - s0, b = px + s0;
              if (b > 0) {
                if (a <= 0) count = Infinity;
                else { const lo = b > 1 ? 1 : Math.floor(1 / b) + 1, hi = Math.ceil(1 / a) - 1; count = Math.max(0, hi - lo + 1) - (E.inE(px, py) ? 1 : 0); }
              }
            }
          }
          const msg = E.pts ? (count ? `N_r(p) holds ${count === Infinity ? 'infinitely many' : count} point${count === 1 ? '' : 's'} of E other than p` : 'N_r(p) holds no point of E other than p') : '';
          if (msg) S.corner(msg, 'bl', { color: count ? 'gold' : 'muted', weight: 600 });
          st = { inE, lim, int, iso: inE && !lim, w };
        });
        v.legend([['blue', '$E$', { area: true }], ['orange', '$N_r(p)$', { dash: true }], ['gold', '$E\\cap N_r(p)$, other than $p$', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s.w) return '';
          return `$p\\in E$: ${yes(s.inE)} $\\quad$ interior point of $E$: ${yes(s.int)} $\\quad$ limit point of $E$: ${yes(s.lim)} $\\quad$ isolated point of $E$: ${yes(s.iso)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.19
    {
      num: '2.19',
      kind: 'Theorem',
      name: 'Every neighbourhood is an open set',
      statement: String.raw`In a metric space, every neighbourhood $N_r(p)$ is an open set.`,
      idea: String.raw`Let $q\in N_r(p)$ and put $h=r-d(p,q)>0$. If $d(q,s)<h$, the triangle inequality gives $d(p,s)\le d(p,q)+d(q,s)<d(p,q)+h=r$, so $N_h(q)\subset N_r(p)$ and $q$ is an interior point. Only axiom (c) of a metric is used, which is why the picture survives any change of metric.`,
      caption: String.raw`Drag $q$ inside $N_r(p)$ and $s$ inside the small neighbourhood $N_h(q)$, where $h=r-d(p,q)$. Changing the metric changes the shape of the balls, but $N_h(q)$ always stays inside $N_r(p)$. Switch to the closed ball and push $q$ onto its rim: then $h=0$ and no neighbourhood of $q$ fits — closed balls are not open.`,
      deps: ['pma-2.18', 'pma-2.15'],
      tags: ['open sets', 'metric spaces'],
      viz(v) {
        const NORMS = { 2: '$\\ell^2$', 1: '$\\ell^1$', inf: '$\\ell^\\infty$' };
        const which = v.select('metric', Object.entries(NORMS).map(([value, label]) => ({ value, label })), '2');
        const closed = v.toggle('closed ball $\\{d(p,\\cdot)\\le r\\}$', false);
        const R = 1.5;
        const S = v.stage({ x: [-2.9, 2.9], y: [-1.85, 1.85], equal: true, height: 360, axes: false });
        const pOf = () => (which.value === 'inf' ? Infinity : +which.value);
        const P = { x: -0.3, y: 0 };
        let u = [-0.05, -0.24];
        const Q = S.handle(0.55, 0.45, {
          color: 'blue', label: 'q',
          constrain: (x, y) => {
            const p = pOf(); let [dx, dy] = clampNorm(x - P.x, y - P.y, p, R);
            const n = pnorm(dx, dy, p);
            if (R - n < 9 / S.scale) [dx, dy] = [(dx * R) / n, (dy * R) / n]; // snap onto the rim
            return [P.x + dx, P.y + dy];
          },
        });
        const Sh = S.handle(0.5, 0.21, {
          color: 'gold', label: 's', r: 6,
          constrain: (x, y) => {
            const p = pOf(), h = R - pnorm(Q.x - P.x, Q.y - P.y, p);
            const [dx, dy] = clampNorm(x - Q.x, y - Q.y, p, Math.max(0, h * 0.995));
            u = [dx, dy];
            return [Q.x + dx, Q.y + dy];
          },
        });
        Sh.labelPos = 'se';
        let st = {};
        v.render(() => {
          const p = pOf();
          const dpq = pnorm(Q.x - P.x, Q.y - P.y, p), h = Math.max(0, R - dpq);
          const onRim = h < 1e-9;
          // keep s inside N_h(q)
          u = clampNorm(u[0], u[1], p, h * 0.995); Sh.x = Q.x + u[0]; Sh.y = Q.y + u[1];
          Sh.visible = !onRim;
          S.ball(P.x, P.y, R, { p, fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 2, dash: closed.value ? null : [7, 5] });
          S.dot(P.x, P.y, { r: 4, color: 'ink', label: 'p', labelPos: 'sw' });
          S.measure(P.x, P.y, P.x, P.y - R, 'r', { color: 'blue', offset: -12 });
          S.line(P.x, P.y, Q.x, Q.y, { color: 'muted', width: 1.2, dash: [3, 3] });
          if (!onRim) {
            S.ball(Q.x, Q.y, h, { p, fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.8 });
            if (h * S.scale > 22) S.measure(Q.x, Q.y, Q.x + h, Q.y, 'h', { color: 'orange', offset: -11 });
            S.line(P.x, P.y, Sh.x, Sh.y, { color: 'gold', width: 1.2, dash: [2, 3] });
          } else {
            for (const rr of [0.08, 0.16, 0.26]) S.ball(Q.x, Q.y, rr, { p, color: 'red', width: 1.4, dash: [3, 3] });
          }
          if (onRim) S.corner(closed.value ? 'q is on the rim: every neighbourhood of q pokes out of the closed ball' : 'the rim is not part of the open ball N_r(p)', 'tl', { color: 'red', weight: 600 });
          else S.corner('N_h(q) ⊂ N_r(p): q is an interior point', 'tl', { color: 'green', weight: 600 });
          st = { dpq, h, onRim, dqs: pnorm(Sh.x - Q.x, Sh.y - Q.y, p), dps: pnorm(Sh.x - P.x, Sh.y - P.y, p) };
        });
        v.legend([['blue', '$N_r(p)$', { area: true }], ['orange', '$N_h(q)$, $h=r-d(p,q)$', { area: true }], ['gold', 'a point $s$ of $N_h(q)$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (s.h == null) return '';
          if (s.onRim) return closed.value ? `$d(p,q) = r = ${R}$, so $h = 0$: $q$ belongs to the closed ball but is not an interior point.` : `$d(p,q)=r$: $q\\notin N_r(p)$, so there is nothing to prove at $q$.`;
          return `$h = r - d(p,q) = ${R} - ${v.fix(s.dpq, 3)} = ${v.fix(s.h, 3)}$; $\\;d(p,s) = ${v.fix(s.dps, 3)} \\le d(p,q)+d(q,s) = ${v.fix(s.dpq, 3)} + ${v.fix(s.dqs, 3)} < r$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.20
    {
      num: '2.20',
      kind: 'Theorem',
      name: 'Neighbourhoods of a limit point hold infinitely many points',
      statement: String.raw`If $p$ is a limit point of a set $E$ in a metric space, then every neighbourhood of $p$ contains infinitely many points of $E$.`,
      idea: String.raw`Suppose some neighbourhood $N$ of $p$ contained only finitely many points of $E$; let $q_1,\dots,q_n$ be those different from $p$ and $r=\min_m d(p,q_m)$. A minimum of finitely many positive numbers is positive, and $N_r(p)$ contains no point of $E$ other than $p$ — so $p$ is not a limit point, a contradiction.`,
      caption: String.raw`$E$ is a sequence spiralling into $p$. Shrink $r$: the right panel magnifies $N_r(p)$ and keeps finding points of $E$ in it — every term from some index on. Switch to the finite set of the first $12$ terms: now $r'=\min d(p,q_m)$ is positive, the red disc $N_{r'}(p)$ is empty, and $p$ is no longer a limit point.`,
      deps: ['pma-2.18'],
      see: ['pma-3.2'],
      tags: ['limit points'],
      viz(v) {
        const c = 1.5, th = 2.39996;
        const pt = (n) => [(c / n) * Math.cos(n * th), (c / n) * Math.sin(n * th)];
        const mode = v.select('$E$', [{ value: 'inf', label: 'all terms $q_n$' }, { value: 'fin', label: 'first 12 terms only' }], 'inf');
        const rad = v.slider('radius $r$', 0.003, 1.6, 0.25, { log: true, decimals: 3 });
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 340, axes: false, title: 'the set $E$ and $N_r(p)$' });
        const Z = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 340, axes: false, title: 'magnified: $N_r(p)$ fills the panel' });
        let st = {};
        v.render(() => {
          const fin = mode.value === 'fin', r = rad.value, M = fin ? 12 : 60000;
          const rp = fin ? Math.min(...Array.from({ length: 12 }, (_, i) => c / (i + 1))) : 0;
          // overview
          L.circle(0, 0, r, { fill: 'orange', fillAlpha: 0.13, color: 'orange', width: 1.8, dash: [5, 4] });
          if (fin) L.circle(0, 0, rp, { color: 'red', width: 1.8, fill: 'red', fillAlpha: 0.08 });
          const lim = fin ? 12 : 3000;
          const far = [], near = [];
          for (let n = 40; n <= lim; n++) { const q = pt(n); (c / n < r ? near : far).push(q); }
          L.dots(far, { r: 1.7, color: 'blue' }); L.dots(near, { r: 1.7, color: 'gold' });
          for (let n = 1; n < Math.min(40, lim + 1); n++) { const [x, y] = pt(n); L.dot(x, y, { r: 3.6, color: c / n < r ? 'gold' : 'blue' }); }
          for (let n = 1; n <= 6; n++) { const [x, y] = pt(n); L.text(`q${'₀₁₂₃₄₅₆₇₈₉'[n]}`, x, y, { dy: -11, align: 'center', size: 12, color: 'blue', math: true }); }
          L.dot(0, 0, { r: 4.5, color: 'ink', label: 'p', labelPos: 'se' });
          // zoom window: radius 1.35 r about p
          const sc = 1 / (1.35 * r);
          Z.circle(0, 0, r * sc, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 2, dash: [5, 4] });
          if (fin && rp < 1.35 * r) Z.circle(0, 0, rp * sc, { color: 'red', width: 2, fill: 'red', fillAlpha: 0.08 });
          const n0 = Math.max(1, Math.ceil(c / (1.9 * r)));
          let count = 0, first = 0;
          const zIn = [], zOut = [];
          for (let n = n0; n <= Math.min(M, n0 + 6000); n++) {
            const [x, y] = pt(n); const inside = c / n < r;
            if (inside) { count++; if (!first) first = n; }
            if (n < n0 + 40) Z.dot(x * sc, y * sc, { r: 3.6, color: inside ? 'gold' : 'blue' });
            else (inside ? zIn : zOut).push([x * sc, y * sc]);
            if (inside && n < first + 4) Z.text(`n = ${n}`, x * sc, y * sc, { dy: -12, align: 'center', size: 11, color: 'gold', weight: 600 });
          }
          Z.dots(zIn, { r: 1.6, color: 'gold' }); Z.dots(zOut, { r: 1.6, color: 'blue' });
          Z.dot(0, 0, { r: 4.5, color: 'ink', label: 'p', labelPos: 'se' });
          Z.corner(`magnification ×${v.fmt(sc * 1.75, 3)}`, 'br');
          if (fin) {
            const empty = r <= rp;
            Z.corner(empty ? 'N_r(p) ∩ E = ∅' : `${count} point${count === 1 ? '' : 's'} of E in N_r(p)`, 'bl', { color: empty ? 'red' : 'gold', weight: 600 });
          } else Z.corner(`all q_n with n ≥ ${Math.floor(c / r) + 1} lie in N_r(p)`, 'bl', { color: 'gold', weight: 600 });
          st = { fin, r, rp, N: Math.floor(c / r) + 1, count };
        });
        v.legend([['blue', 'points $q_n$ of $E$', { dot: true }], ['gold', 'points of $E$ in $N_r(p)$', { dot: true }], ['orange', '$N_r(p)$', { dash: true }], ['red', "$N_{r'}(p)$ (finite case)", { area: true }]]);
        v.readout(() => {
          const s = st; if (s.r == null) return '';
          if (!s.fin) return `$d(p,q_n) = 1.5/n < r$ exactly when $n \\ge ${s.N}$: infinitely many points of $E$ in $N_r(p)$, for every $r>0$. So $p$ is a limit point, as 2.20 requires.`;
          return `$E$ is finite: $r' = \\min_m d(p,q_m) = 1.5/12 = ${v.fix(s.rp, 3)} > 0$. ` + (s.r <= s.rp ? `Here $r \\le r'$ and $N_r(p)$ meets $E$ in no point other than $p$, so $p$ is not a limit point.` : `Shrink $r$ below $r'$ and $N_r(p)$ empties out.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.20a
    {
      num: '2.20a',
      kind: 'Corollary',
      name: 'A finite set has no limit points',
      statement: String.raw`A finite set of points in a metric space has no limit points.`,
      idea: String.raw`By 2.20 a limit point of $E$ would need infinitely many points of $E$ in each of its neighbourhoods, which a finite set cannot supply. Concretely: for any $p$, the smallest distance $r$ from $p$ to the finitely many points of $E\setminus\{p\}$ is positive, and $N_r(p)$ contains no point of $E$ except possibly $p$ itself.`,
      caption: String.raw`Drag the points of the finite set $E$ and the test point $p$ (it snaps onto points of $E$). The orange disc is $N_r(p)$ with $r=\min\{d(p,q): q\in E,\ q\ne p\}$; it never contains a point of $E$ other than $p$. Add points: the radius can shrink, but it stays positive.`,
      deps: ['pma-2.20', 'pma-2.18'],
      tags: ['limit points'],
      viz(v) {
        const S = v.stage({ x: [-3.2, 3.2], y: [-1.8, 1.8], equal: true, height: 350, axes: false, grid: true });
        const init = [[-2.1, 0.8], [-0.9, -1.0], [0.4, 1.1], [1.6, -0.4], [2.5, 1.0]];
        const pts = [];
        const add = (x, y) => pts.push(S.handle(x, y, { color: 'blue', r: 6 }));
        init.forEach(([x, y]) => add(x, y));
        const rnd = v.rng(7);
        v.button('Add a point', () => { if (pts.length < 14) add(rnd.uniform(-2.8, 2.8), rnd.uniform(-1.5, 1.5)); });
        v.button('Remove a point', () => { if (pts.length > 1) pts.pop().visible = false; });
        const P = S.handle(0.2, -0.2, {
          color: 'gold', label: 'p',
          constrain: (x, y) => { const tol = 12 / S.scale; for (const q of pts) if (Math.hypot(q.x - x, q.y - y) < tol) return [q.x, q.y]; return [x, y]; },
        });
        let st = {};
        v.render(() => {
          let best = Infinity, bq = null, self = false;
          for (const q of pts) {
            const d = Math.hypot(q.x - P.x, q.y - P.y);
            if (d < 1e-9) { self = true; continue; }
            if (d < best) { best = d; bq = q; }
          }
          for (const q of pts) { const d = Math.hypot(q.x - P.x, q.y - P.y); if (d > 1e-9 && q !== bq) S.line(P.x, P.y, q.x, q.y, { color: 'faint', width: 1, dash: [3, 4] }); }
          if (bq) {
            S.circle(P.x, P.y, best, { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 1.8, dash: [6, 4] });
            S.line(P.x, P.y, bq.x, bq.y, { color: 'green', width: 2 });
            S.text(`r = ${v.fmt(best, 3)}`, (P.x + bq.x) / 2, (P.y + bq.y) / 2, { dy: -10, align: 'center', color: 'green', size: 12.5, weight: 600 });
          }
          S.corner(self ? 'p ∈ E is an isolated point of E' : 'p ∉ E, and N_r(p) ∩ E = ∅', 'tl', { color: 'orange', weight: 600 });
          st = { best, self, n: pts.length };
        });
        v.legend([['blue', 'the finite set $E$', { dot: true }], ['gold', 'test point $p$', { dot: true }], ['orange', '$N_r(p)$', { area: true }], ['green', 'nearest other point of $E$']]);
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          if (!isFinite(s.best)) return 'With one point there is nothing else to approach $p$.';
          return `$|E| = ${s.n}$, $\\;r = \\min_{q\\in E,\\,q\\ne p} d(p,q) = ${v.fix(s.best, 3)} > 0$, and $N_r(p)\\cap E ${s.self ? '= \\{p\\}' : '= \\emptyset'}$ — so $p$ is not a limit point of $E$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.22
    {
      num: '2.22',
      kind: 'Theorem',
      name: "De Morgan's law for complements",
      statement: String.raw`For any collection $\{E_\alpha\}$ of sets, finite or infinite,
$$\Big(\bigcup_\alpha E_\alpha\Big)^c=\bigcap_\alpha\,(E_\alpha^c).$$`,
      idea: String.raw`Both sides describe the same points: $x$ lies outside the union exactly when it lies outside every $E_\alpha$, i.e. in every complement $E_\alpha^c$. Each inclusion is one line, and nothing about the number of sets is used, which is why the identity holds for infinite families — the key to turning statements about open sets into statements about closed sets (2.23, 2.24).`,
      caption: String.raw`Left: the union of the discs $E_\alpha$ (blue) and its complement (red). Right: the complements are intersected one at a time; each $E_\alpha$ carves its disc out of the red region. When all are used the two red regions agree. Drag the test point $x$ (and, for three sets, the centres), or try an infinite family.`,
      deps: [],
      tags: ['sets'],
      viz(v) {
        const fam = v.select('family', [{ value: 'three', label: 'three discs' }, { value: 'inf', label: 'infinitely many discs $E_n$' }], 'three', { onChange: () => v.restart() });
        const L = v.stage({ x: [-3, 3], y: [-1.9, 1.9], equal: true, height: 300, axes: false, title: '$\\big(\\bigcup_\\alpha E_\\alpha\\big)^c$' });
        const R = v.stage({ x: [-3, 3], y: [-1.9, 1.9], equal: true, height: 300, axes: false, title: '$\\bigcap_{\\alpha\\le k} E_\\alpha^c$' });
        const C = [L.handle(-1.0, 0.3, { color: 'blue', r: 6 }), L.handle(0.6, 0.6, { color: 'blue', r: 6 }), L.handle(0.0, -0.7, { color: 'blue', r: 6 })];
        const X = L.handle(2.1, -1.2, { color: 'gold', label: 'x' });
        const radii = [1.0, 0.85, 0.75];
        const infDiscs = Array.from({ length: 80 }, (_, i) => { const n = i + 1; return [-2.4 + 4.6 * (1 - 1 / n), 0.9 * Math.sin(1.7 * n) / Math.sqrt(n), 0.75 / Math.sqrt(n)]; });
        const Bl = v.rgb('blue'), Rd = v.rgb('red');
        let st = {};
        v.animate((t) => {
          const inf = fam.value === 'inf';
          C.forEach((h) => { h.visible = !inf; });
          const discs = inf ? infDiscs : C.map((h, i) => [h.x, h.y, radii[i]]);
          const K = discs.length;
          const k = inf ? Math.min(K, Math.floor(Math.pow(t / 6, 2) * K) + 1) : Math.min(K, Math.floor(t / 1.2) + 1);
          const key = discs.map((d) => d.join(',')).join(';');
          const inDisc = (d, x, y) => (x - d[0]) ** 2 + (y - d[1]) ** 2 < d[2] * d[2];
          L.raster((x, y) => { for (const d of discs) if (inDisc(d, x, y)) return [Bl[0], Bl[1], Bl[2], 70]; return [Rd[0], Rd[1], Rd[2], 55]; }, { res: 2, key });
          R.raster((x, y) => { for (let i = 0; i < k; i++) if (inDisc(discs[i], x, y)) return [Bl[0], Bl[1], Bl[2], i === k - 1 ? 60 : 22]; return [Rd[0], Rd[1], Rd[2], 55]; }, { res: 2, key: key + '|' + k });
          discs.forEach((d, i) => {
            L.circle(d[0], d[1], d[2], { color: 'blue', width: inf ? 1 : 1.6, alpha: 0.8 });
            if (i < k) R.circle(d[0], d[1], d[2], { color: 'blue', width: inf ? 0.8 : 1.4, alpha: i === k - 1 ? 1 : 0.45, dash: [4, 3] });
            if (!inf) { L.tex(`E_{${i + 1}}`, d[0], d[1] + d[2] * 0.45, { color: 'blue', size: 15 }); if (i < k) R.tex(`E_{${i + 1}}`, d[0], d[1] + d[2] * 0.45, { color: 'blue', size: 15, alpha: 0.6 }); }
          });
          R.dot(X.x, X.y, { r: 6, color: 'gold', label: 'x' });
          const inside = discs.map((d) => inDisc(d, X.x, X.y));
          const anyIn = inside.indexOf(true);
          R.corner(`k = ${k}${k === K ? (inf ? ' (all 80 drawn)' : ' — all sets used') : ''}`, 'tl', { color: k === K ? 'green' : 'muted', weight: 600 });
          st = { anyIn, k, K, inf };
        }, { period: 10 });
        v.legend([['blue', 'the sets $E_\\alpha$', { area: true }], ['red', 'complement region', { area: true }], ['gold', 'test point $x$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (s.k == null) return '';
          if (s.anyIn < 0) return '$x$ lies in no $E_\\alpha$: so $x\\in(\\bigcup E_\\alpha)^c$, and $x\\in E_\\alpha^c$ for every $\\alpha$, i.e. $x\\in\\bigcap E_\\alpha^c$.';
          return `$x\\in E_{${s.anyIn + 1}}$: so $x\\notin(\\bigcup E_\\alpha)^c$, and $x\\notin E_{${s.anyIn + 1}}^c$, hence $x\\notin\\bigcap E_\\alpha^c$. Both sides exclude $x$.`;
        });
      },
    },
  ],
};
