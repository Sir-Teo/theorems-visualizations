// Rudin, Principles of Mathematical Analysis — Chapter 4 (part 2): open sets, algebra of
// continuous functions, continuity and compactness.

// ---------- shared helpers ----------
/** Largest δ ≤ R such that |F(x) − c| < eps for all sampled x ∈ [a,b] with 0 < |x − p| < δ (0 if none). */
function admissible(F, p, c, eps, a, b, n = 1600) {
  const R = Math.max(p - a, b - p);
  const ds = [];
  for (let j = 34; j >= 1; j--) ds.push((R / n) * Math.pow(0.5, j));
  for (let k = 1; k <= n; k++) ds.push((R * k) / n);
  const bad = (d) => { for (const s of [1, -1]) { const x = p + s * d; if (x >= a && x <= b && !(Math.abs(F(x) - c) < eps)) return x; } return null; };
  for (let i = 0; i < ds.length; i++) {
    if (bad(ds[i]) == null) continue;
    if (ds[i] < R * 1e-6) return { d: 0, fail: bad(ds[i]) };
    let lo = i ? ds[i - 1] : 0, hi = ds[i]; // refine the first violation between two samples
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (bad(m) != null) hi = m; else lo = m; }
    return { d: hi, fail: bad(hi) };
  }
  return { d: R, fail: null };
}
/** Graph of f on [a,b] broken at the given points. */
function pieces(S, f, a, b, breaks, st) {
  const cuts = [a, ...breaks.filter((c) => c > a && c < b).sort((u, w) => u - w), b];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? 1e-9 : 0), hi = cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0);
    if (hi > lo) S.fn(f, { ...st, domain: [lo, hi] });
  }
}
/** Marching squares: segments of the level set {F = level} on a grid; returns a polyline list with null breaks. */
function contour(F, level, [x0, x1], [y0, y1], nx, ny) {
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, G = [];
  for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push(F(x0 + i * dx, y0 + j * dy) - level); G.push(row); }
  const out = [];
  const cut = (p, q, a, b) => { const t = a / (a - b); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const P = [[x0 + i * dx, y0 + j * dy], [x0 + (i + 1) * dx, y0 + j * dy], [x0 + (i + 1) * dx, y0 + (j + 1) * dy], [x0 + i * dx, y0 + (j + 1) * dy]];
    const V = [G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]];
    const pts = [];
    for (let k = 0; k < 4; k++) { const a = V[k], b = V[(k + 1) % 4]; if ((a < 0) !== (b < 0)) pts.push(cut(P[k], P[(k + 1) % 4], a, b)); }
    if (pts.length >= 2) out.push(pts[0], pts[1], null);
    if (pts.length === 4) out.push(pts[2], pts[3], null);
  }
  return out;
}
/** Maximal runs of a predicate over sampled x: [[lo, hi], ...] (endpoints refined by bisection). */
function runs(pred, a, b, n = 1200) {
  const out = []; let start = null, prevX = a, prevIn = false;
  const refine = (u, w, inU) => { for (let k = 0; k < 40; k++) { const m = (u + w) / 2; if (pred(m) === inU) u = m; else w = m; } return (u + w) / 2; };
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n, inn = pred(x);
    if (inn && !prevIn) start = i === 0 ? a : refine(prevX, x, false);
    if (!inn && prevIn) out.push([start, refine(prevX, x, true)]);
    prevX = x; prevIn = inn;
  }
  if (prevIn) out.push([start, b]);
  return out;
}
const CYCLE = ['blue', 'purple', 'teal', 'pink', 'orange', 'green', 'gold', 'red'];

export default {
  collection: 'pma',
  chapter: 4,
  items: [
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Continuity via preimages of open sets',
      statement: String.raw`A map $f$ of a metric space $X$ into a metric space $Y$ is continuous on $X$ if and only if $f^{-1}(V)$ is open in $X$ for every open set $V\subset Y$.`,
      idea: String.raw`If $f$ is continuous and $p\in f^{-1}(V)$, pick $\eps$ with $B(f(p),\eps)\subset V$; continuity supplies $\delta$ with $f(B(p,\delta))\subset B(f(p),\eps)$, so $B(p,\delta)\subset f^{-1}(V)$. Conversely, if preimages of open sets are open, apply this to the open ball $V=B(f(p),\eps)$ (2.19): $f^{-1}(V)$ is an open set containing $p$, so it contains some $B(p,\delta)$ — exactly the $\delta$ that continuity asks for.`,
      caption: String.raw`Left: the plane $X=\R^2$, shaded where $f$ takes values in the open interval $V=(a,b)$ — drag $a$ and $b$ on the vertical line $Y$ at the right. Drag $P$: when $f(P)\in V$, an $\eps$-interval about $f(P)$ fits in $V$ and continuity yields a whole disc about $P$ inside $f^{-1}(V)$. Switch on the jump along $x=0.6$ and drop $P$ on the red part of that line: $P\in f^{-1}(V)$, yet no disc fits — the preimage is not open.`,
      deps: ['pma-4.5', 'pma-2.18', 'pma-2.19'],
      see: ['rca-1.2'],
      tags: ['continuity', 'open sets'],
      viz(v) {
        const base = (x, y) => 0.55 * Math.sin(1.3 * x) + 0.45 * Math.cos(1.1 * y + 0.4) + 0.12 * x * y;
        const XJ = 0.6, JUMP = 0.75, XMAX = 3.4, YL = 4.35, K = 0.8; // the line Y is drawn at x = YL with y = K·t
        const jump = v.toggle('jump along $x=0.6$', false);
        const F = (x, y) => base(x, y) + (jump.value && x > XJ ? JUMP : 0);
        const S = v.stage({ x: [-3.3, 4.9], y: [-2.05, 2.05], equal: true, height: 410, axes: false, title: 'left: the plane $X=\\R^2$ with $f^{-1}(V)$ shaded; right: the line $Y=\\R$ with $V=(a,b)$' });
        const ha = S.handle(YL, -0.2 * K, { color: 'teal', label: 'a', constrain: (x, y) => [YL, v.M.clamp(y, -2.3 * K, 2.3 * K)] });
        const hb = S.handle(YL, 0.75 * K, { color: 'teal', label: 'b', constrain: (x, y) => [YL, v.M.clamp(y, -2.3 * K, 2.3 * K)] });
        const P = S.handle(-2.2, 0, { color: 'gold', label: 'P', constrain: (x, y) => { x = Math.min(x, XMAX - 0.05); return [jump.value && Math.abs(x - XJ) < 0.08 ? XJ : x, y]; } });
        function discRadius(px, py, fp, eps) {
          const rs = []; for (let j = 30; j >= 1; j--) rs.push(0.004 * 0.5 ** j); for (let k = 1; k <= 400; k++) rs.push(0.0075 * k);
          let prev = 0;
          for (const r of rs) {
            for (let k = 0; k < 64; k++) { const t = (2 * Math.PI * k) / 64; if (!(Math.abs(F(px + r * Math.cos(t), py + r * Math.sin(t)) - fp) < eps)) return prev < 1e-6 ? 0 : prev; }
            prev = r;
          }
          return prev;
        }
        let state = null;
        v.legend([['teal', '$V=(a,b)$ and $f^{-1}(V)$', { area: true }], ['accent', '$\\varepsilon$-interval about $f(P)$'], ['orange', 'disc about $P$ mapped into it', { area: true }]]);
        v.render(() => {
          const a = Math.min(ha.y, hb.y) / K, b = Math.max(ha.y, hb.y) / K;
          const inV = (t) => t > a && t < b;
          const tc = v.rgb('teal');
          S.raster((x, y) => (x < XMAX && inV(F(x, y)) ? [tc[0], tc[1], tc[2], 70] : null), { key: `${a}|${b}|${jump.value}|${tc}`, res: 2 });
          for (const lev of [a, b]) S.path(contour(F, lev, [-3.5, XMAX], [-2.2, 2.2], 150, 92), { color: 'teal', width: 1.4 });
          S.line(XMAX, -2.3, XMAX, 2.3, { color: 'faint', width: 1 });
          S.line(-3.5, 0, XMAX, 0, { color: 'faint', width: 1 }); S.line(0, -2.3, 0, 2.3, { color: 'faint', width: 1 });
          if (jump.value) {
            S.line(XJ, -2.3, XJ, 2.3, { color: 'muted', dash: [4, 4], width: 1 });
            const ys = v.M.linspace(-2.2, 2.2, 700);
            S.path(ys.map((y) => (inV(base(XJ, y)) && !inV(base(XJ, y) + JUMP) ? [XJ, y] : null)), { color: 'red', width: 4 });
          }
          const fp = F(P.x, P.y), inside = inV(fp);
          const eps = inside ? Math.min(fp - a, b - fp) : 0;
          const del = inside ? discRadius(P.x, P.y, fp, eps) : 0;
          if (del > 0) S.circle(P.x, P.y, del, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.8 });
          if (inside && del === 0) { S.circle(P.x, P.y, 0.22, { color: 'red', width: 2, dash: [3, 3] }); S.corner('P ∈ f⁻¹(V), but no disc about P stays inside', 'tl', { color: 'red', weight: 600 }); }
          else if (inside) S.corner('a disc about P lies in f⁻¹(V)', 'tl', { color: 'green', weight: 600 });
          else S.corner('f(P) ∉ V', 'tl', { color: 'muted', weight: 600 });
          // the line Y
          S.line(YL, -2.4 * K, YL, 2.4 * K, { color: 'faint', width: 2 });
          for (let k = -2; k <= 2; k++) { S.line(YL - 0.07, k * K, YL + 0.07, k * K, { color: 'muted', width: 1 }); S.text(String(k).replace('-', '−'), YL - 0.14, k * K, { align: 'right', color: 'muted', size: 11 }); }
          S.line(YL, a * K, YL, b * K, { color: 'teal', width: 8, alpha: 0.45, cap: 'butt' });
          if (inside) S.line(YL, (fp - eps) * K, YL, (fp + eps) * K, { color: 'accent', width: 4, cap: 'butt' });
          S.dot(YL, fp * K, { color: 'gold', r: 5, label: 'f(P)', labelPos: 'e' });
          S.tex('V', YL, ((a + b) / 2) * K, { color: 'teal', align: 'right', dx: -26 });
          state = { fp, inside, eps, del, a, b };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (!s.inside) return `$f(P) = ${v.fix(s.fp, 3)} \\notin V = (${v.fix(s.a, 2)}, ${v.fix(s.b, 2)})$, so $P$ lies outside $f^{-1}(V)$.`;
          if (s.del > 0) return `$f(P) = ${v.fix(s.fp, 3)} \\in V$; the interval of radius $\\varepsilon = ${v.fix(s.eps, 3)}$ about $f(P)$ lies in $V$, and the disc of radius $\\delta = ${v.fmt(s.del, 3)}$ about $P$ is mapped into it, so it lies in $f^{-1}(V)$.`;
          return `$f(P) = ${v.fix(s.fp, 3)} \\in V$ (on the line $x=0.6$ the value comes from the left piece), but points just to the right are mapped outside $V$: $P$ is not an interior point, so $f^{-1}(V)$ is not open — and indeed $f$ is not continuous at $P$.`;
        });
      },
    },
    {
      num: '4.8a',
      kind: 'Corollary',
      name: 'Continuity via preimages of closed sets',
      statement: String.raw`A map $f$ of a metric space $X$ into a metric space $Y$ is continuous if and only if $f^{-1}(C)$ is closed in $X$ for every closed set $C\subset Y$.`,
      idea: String.raw`A set is closed exactly when its complement is open (2.23), and preimages respect complements: $f^{-1}(Y\setminus C)=X\setminus f^{-1}(C)$. So the open-set criterion of 4.8 translates word for word into the closed-set criterion.`,
      caption: String.raw`Drag the ends of the closed interval $C$ (green bar at the left) and the gold marker on the bottom strip, which shows $f^{-1}(C)$ in green and its open complement $f^{-1}(Y\setminus C)$ in red. The gold points $x_n\in f^{-1}(C)$ converge to the nearest boundary point $b$; because $f(x_n)\in C$, $f$ is continuous and $C$ is closed, $f(b)\in C$ as well. Switch on the jump and look at $b=0.9$: the limit escapes.`,
      deps: ['pma-4.8', 'pma-2.23'],
      tags: ['continuity', 'closed sets'],
      viz(v) {
        const f0 = (x) => 0.9 * Math.sin(1.4 * x) + 0.2 * x;
        const XJ = 0.9, JUMP = 0.85;
        const jump = v.toggle('jump at $x = 0.9$', false);
        const F = (x) => f0(x) + (jump.value && x >= XJ ? JUMP : 0);
        const X = [-3.2, 3.2], yS = -2.15;
        const S = v.stage({ x: [-3.6, 3.35], y: [-2.5, 2.6], height: 360, xlabel: 'x', yticks: [-1, 1, 2] });
        const c1 = S.handle(-3.4, 0.55, { color: 'green', constrain: (x, y) => [-3.4, v.M.clamp(y, -1.8, 2.5)] });
        const c2 = S.handle(-3.4, 1.4, { color: 'green', constrain: (x, y) => [-3.4, v.M.clamp(y, -1.8, 2.5)] });
        const m = S.handle(0.75, yS, { color: 'gold', constrain: (x) => [v.M.clamp(x, X[0], X[1]), yS] });
        let state = null;
        v.legend([['green', '$C$ and $f^{-1}(C)$ (closed)'], ['red', '$f^{-1}(Y\\setminus C)$ (open)'], ['gold', '$x_n \\to b$', { dot: true }]]);
        v.render(() => {
          const lo = Math.min(c1.y, c2.y), hi = Math.max(c1.y, c2.y);
          const inC = (x) => { const y = F(x); return y >= lo && y <= hi; };
          S.hband(lo, hi, { color: 'green', alpha: 0.07 });
          S.line(-3.4, lo, -3.4, hi, { color: 'green', width: 6, cap: 'butt' });
          S.tex('C', -3.4, (lo + hi) / 2, { color: 'green', align: 'left', dx: 10 });
          // graph
          pieces(S, F, X[0], X[1], jump.value ? [XJ] : [], { color: 'ink', width: 2.2 });
          if (jump.value) { S.dot(XJ, f0(XJ), { hollow: true, r: 4, color: 'ink' }); S.dot(XJ, f0(XJ) + JUMP, { r: 4, color: 'ink' }); }
          // the strip: preimage of C and of its complement
          const R = runs(inC, X[0], X[1], 1600);
          S.line(X[0], yS, X[1], yS, { color: 'red', width: 4, alpha: 0.45, cap: 'butt' });
          const ends = [];
          for (const [l, r] of R) {
            S.line(l, yS, r, yS, { color: 'green', width: 6, cap: 'butt' });
            for (const [b, side] of [[l, 1], [r, -1]]) {
              if (b <= X[0] + 1e-9 || b >= X[1] - 1e-9) continue;
              const yb = F(b), incl = yb >= lo - 1e-6 && yb <= hi + 1e-6;
              ends.push({ b, side, incl, len: r - l });
              S.dot(b, yS, { r: 4, color: incl ? 'green' : 'red', hollow: !incl });
            }
          }
          S.text('f⁻¹(C)', X[0] + 0.05, yS + 0.22, { color: 'green', size: 11.5 });
          // nearest boundary point to the marker, and a sequence inside the preimage converging to it
          let E = null;
          for (const e of ends) if (!E || Math.abs(e.b - m.x) < Math.abs(E.b - m.x)) E = e;
          if (E) {
            const w = Math.min(0.6, E.len * 0.9);
            const xs = v.M.range(14, 1).map((n) => E.b + (E.side * w) / n ** 1.15);
            S.line(E.b, yS, E.b, F(E.b), { color: E.incl ? 'green' : 'red', width: 1.2, dash: [3, 3] });
            xs.forEach((x) => { S.dot(x, yS, { color: 'gold', r: 3 }); S.dot(x, F(x), { color: 'gold', r: 3.2 }); });
            S.dot(E.b, F(E.b), { r: 5.5, color: E.incl ? 'green' : 'red', label: 'f(b)', labelPos: E.side > 0 ? 'nw' : 'ne' });
            S.tex('b', E.b, yS, { color: E.incl ? 'green' : 'red', baseline: 'bottom', dy: -8, size: 14 });
          }
          state = { E, lo, hi };
        });
        v.readout(() => {
          const s = state; if (!s || !s.E) return 'Move $C$ so that $f^{-1}(C)$ has a boundary point inside the window.';
          const { E } = s;
          return E.incl
            ? `$x_n \\in f^{-1}(C)$, $x_n \\to b = ${v.fix(E.b, 3)}$, and $f(b) = ${v.fix(F(E.b), 3)} \\in C = [${v.fix(s.lo, 2)}, ${v.fix(s.hi, 2)}]$: the limit stays in $f^{-1}(C)$, as closedness requires.`
            : `$x_n \\in f^{-1}(C)$ and $x_n \\to b = ${v.fix(E.b, 3)}$, but $f(b) = ${v.fix(F(E.b), 3)} \\notin C$: $f^{-1}(C)$ misses one of its limit points, so it is not closed — $f$ is not continuous at $b$.`;
        });
      },
    },
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Sums, products and quotients of continuous functions',
      statement: String.raw`If $f$ and $g$ are continuous complex functions on a metric space $X$, then $f+g$, $fg$ and $f/g$ are continuous on $X$ — the quotient under the assumption that $g(x)\neq0$ for every $x\in X$.`,
      idea: String.raw`At an isolated point of $X$ there is nothing to prove. At a limit point $p$, continuity means $f(x)\to f(p)$ and $g(x)\to g(p)$ (4.6), so by the limit rules of 4.4 the combinations tend to $f(p)+g(p)$, $f(p)g(p)$ and $f(p)/g(p)$ — the last because $g(p)\neq0$ — and 4.6 turns this back into continuity.`,
      caption: String.raw`$f$ (blue) and $g$ (purple) are loops in $\C$ parametrised by $t\in X=[0,1]$; the green curve is $h=f+g$, $fg$ or $f/g$. Drag $t_0$ on the right: the orange window is the largest $\delta$ with $|h(t)-h(t_0)|<\eps$, and its image is the thick green arc inside the $\eps$-disc. Lower $c$ to $0.6$ and $g$ passes through $0$ — then $f/g$ blows up and the hypothesis $g\ne0$ fails.`,
      deps: ['pma-4.4', 'pma-4.6'],
      tags: ['continuity', 'algebra of functions'],
      viz(v) {
        const { Cx } = v.M, TAU = 2 * Math.PI;
        const op = v.select('$h=$', [{ value: 'sum', label: '$f+g$' }, { value: 'prod', label: '$fg$' }, { value: 'quot', label: '$f/g$' }], 'quot');
        const cS = v.slider('$c$', 0.2, 1.4, 0.95, { step: 0.01 });
        const eps = v.slider('$\\varepsilon$', 0.05, 1, 0.35, { step: 0.01 });
        const f = (t) => Cx.polar(0.9, TAU * t).add(0.3);
        const g = (t) => Cx.polar(0.6, -2 * TAU * t).add(cS.value);
        const h = (t) => { const a = f(t), b = g(t); if (op.value === 'sum') return a.add(b); if (op.value === 'prod') return a.mul(b); return b.abs() < 1e-9 ? new Cx(NaN, NaN) : a.div(b); };
        const SC = v.stage({ x: [-2.5, 2.5], y: [-2, 2], equal: true, height: 340, axes: true, ticks: false, title: 'values in $\\C$' });
        const ST = v.stage({ x: [0, 1], y: [-0.12, 2.6], height: 340, axes: 'box', xlabel: 't', title: 'distances $|f(t)-f(t_0)|$, $|g(t)-g(t_0)|$, $|h(t)-h(t_0)|$' });
        const T0 = ST.handle(0.12, -0.06, { color: 'gold', label: 't₀', constrain: (x) => [v.M.clamp(x, 0, 1), -0.06] });
        let state = null;
        v.legend([['blue', '$f(t)=0.3+0.9e^{2\\pi i t}$'], ['purple', '$g(t)=c+0.6e^{-4\\pi i t}$'], ['green', '$h$'], ['orange', '$\\delta$-window', { area: true }]]);
        v.render(() => {
          const t0 = T0.x, e = eps.value, o = op.value;
          const H0 = h(t0);
          const dist = (F, z0) => (t) => { const w = F(t); return Math.hypot(w.re - z0.re, w.im - z0.im); };
          const dh = dist(h, H0);
          const del = isFinite(H0.re) ? admissible(dh, t0, 0, e, 0, 1, 1200).d : 0;
          const minG = Math.min(...v.M.linspace(0, 1, 801).map((t) => g(t).abs()));
          // view for the complex panel
          const samp = v.M.linspace(0, 1, 400).map(h).filter((w) => isFinite(w.re) && w.abs() < 1e6);
          const xs = samp.map((w) => w.re).sort((a, b) => a - b), ys = samp.map((w) => w.im).sort((a, b) => a - b);
          const q = (arr, r) => arr[Math.floor((arr.length - 1) * r)];
          const xl = Math.min(-1.0, q(xs, 0.03)), xh = Math.max(2.4, q(xs, 0.97)), yl = Math.min(-1.3, q(ys, 0.03)), yh = Math.max(1.3, q(ys, 0.97));
          const pad = 0.12 * Math.max(xh - xl, yh - yl);
          SC.setView([xl - pad, xh + pad], [yl - pad, yh + pad]);
          SC.dot(0, 0, { color: 'muted', r: 3 }); SC.text('0', 0, 0, { color: 'muted', dx: -6, dy: 10, align: 'right', size: 11 });
          SC.curve(f, 0, 1, { color: 'blue', width: 1.3, alpha: 0.55 });
          SC.curve(g, 0, 1, { color: 'purple', width: 1.3, alpha: 0.55 });
          SC.curve(h, 0, 1, { color: 'green', width: 2.2, n: 1600 });
          if (isFinite(H0.re)) {
            SC.circle(H0.re, H0.im, e, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 1.4 });
            if (del > 0) SC.curve(h, Math.max(0, t0 - del), Math.min(1, t0 + del), { color: 'green', width: 4.5, n: 400 });
          }
          const F0 = f(t0), G0 = g(t0);
          SC.dot(F0.re, F0.im, { color: 'blue', r: 4, label: 'f(t₀)', labelPos: F0.re >= 0 ? 'e' : 'w', labelSize: 13 });
          SC.dot(G0.re, G0.im, { color: 'purple', r: 4, label: 'g(t₀)', labelPos: G0.im >= 0 ? 'ne' : 'se', labelSize: 13 });
          if (isFinite(H0.re)) SC.dot(H0.re, H0.im, { color: 'green', r: 5, label: 'h(t₀)', labelPos: H0.re >= 0.3 ? 'w' : 'e', labelSize: 14 });
          // distance panel
          if (del > 0) ST.vband(Math.max(0, t0 - del), Math.min(1, t0 + del), { color: 'orange', alpha: 0.14, edges: true });
          ST.hline(e, { color: 'accent', dash: [5, 4], width: 1.3 });
          ST.tex('\\varepsilon', 1, e, { color: 'accent', align: 'right', baseline: 'bottom', dx: -4, dy: -2 });
          ST.fn(dist(f, F0), { color: 'blue', width: 1.3, alpha: 0.8 });
          ST.fn(dist(g, G0), { color: 'purple', width: 1.3, alpha: 0.8 });
          if (isFinite(H0.re)) ST.fn((t) => Math.min(dh(t), 50), { color: 'green', width: 2.3, n: 1600 });
          ST.vline(t0, { color: 'gold', width: 1, dash: [2, 3] });
          const zeroG = o === 'quot' && minG < 0.004;
          if (zeroG) {
            for (const t of v.M.linspace(0, 1, 801)) if (g(t).abs() < 0.004) ST.vline(t, { color: 'red', width: 1.5 });
            SC.corner('g vanishes on X: f/g is not continuous (not even defined) there', 'tl', { color: 'red', weight: 600 });
          }
          state = { t0, del, minG, H0, zeroG };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const base = `$\\min_X |g| = ${v.fix(s.minG, 3)}$. `;
          if (!isFinite(s.H0.re)) return base + '$g(t_0)=0$: the quotient is undefined at $t_0$.';
          return base + `At $t_0 = ${v.fix(s.t0, 3)}$ the largest admissible $\\delta$ for $h$ is $${v.fmt(s.del, 3)}$` + (s.zeroG ? ' — but $g$ has zeros, so $f/g$ is not a continuous function on all of $X$.' : ' — positive, as the theorem predicts.');
        });
      },
    },
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Vector-valued maps are continuous componentwise',
      statement: String.raw`(a) Let $f_1,\dots,f_k$ be real functions on a metric space $X$ and define $\mathbf f:X\to\R^k$ by $\mathbf f(x)=(f_1(x),\dots,f_k(x))$. Then $\mathbf f$ is continuous if and only if every $f_j$ is continuous.
(b) If $\mathbf f$ and $\mathbf g$ are continuous maps of $X$ into $\R^k$, then $\mathbf f+\mathbf g$ and $\mathbf f\cdot\mathbf g$ are continuous on $X$.`,
      idea: String.raw`Everything rests on the elementary inequalities $|f_j(x)-f_j(y)|\le|\mathbf f(x)-\mathbf f(y)|\le\big(\sum_i|f_i(x)-f_i(y)|^2\big)^{1/2}$: the first gives continuity of each component, the second shows that if every component moves by less than $\eps/\sqrt k$ then $\mathbf f$ moves by less than $\eps$. Part (b) follows from (a) and 4.9, since the components of $\mathbf f+\mathbf g$ and $\mathbf f\cdot\mathbf g$ are sums and products of real continuous functions.`,
      caption: String.raw`Drag $\mathbf f(t_0)$ along the curve. Each component gets the band $\eps/\sqrt2$ (blue, lower panels) and its own $\delta_j$; the proof takes $\delta=\min(\delta_1,\delta_2)$ (orange). The image of that window (thick arc) stays in the square of half-side $\eps/\sqrt2$, hence in the $\eps$-disc. Make $f_2$ jump and drag the point across $t=3.6$: one bad component spoils $\mathbf f$.`,
      deps: ['pma-4.9', 'pma-4.5', 'pma-1.37'],
      tags: ['continuity', 'euclidean spaces'],
      viz(v) {
        const TAU = 2 * Math.PI, TJ = 3.6;
        const f1 = (t) => 1.6 * Math.sin(2 * t + 0.3);
        const f2b = (t) => 0.95 * Math.sin(3 * t);
        const jump = v.toggle('$f_2$ jumps at $t=3.6$', false);
        const eps = v.slider('$\\varepsilon$', 0.05, 0.8, 0.3, { step: 0.01 });
        const f2 = (t) => f2b(t) + (jump.value && t > TJ ? 0.5 : 0);
        const SP = v.stage({ x: [-2.3, 2.3], y: [-1.35, 1.6], equal: true, height: 290, full: true, title: 'the curve $\\mathbf f=(f_1,f_2):[0,2\\pi]\\to\\R^2$' });
        const S1 = v.stage({ x: [0, TAU], y: [-1.9, 1.9], height: 170, xlabel: 't', title: '$f_1(t)$' });
        const S2 = v.stage({ x: [0, TAU], y: [-1.2, 1.7], height: 170, xlabel: 't', title: '$f_2(t)$' });
        let t0 = 1.1;
        const TS = v.M.linspace(0, TAU, 1200);
        const H = SP.handle(f1(t0), f2(t0), {
          color: 'gold', label: 'f(t₀)',
          constrain: (x, y) => { let best = t0, bd = Infinity; for (const t of TS) { const d = (f1(t) - x) ** 2 + (f2(t) - y) ** 2; if (d < bd) { bd = d; best = t; } } t0 = best; return [f1(best), f2(best)]; },
        });
        let state = null;
        v.legend([['accent', '$\\varepsilon$-disc and $\\varepsilon/\\sqrt2$-bands', { area: true }], ['orange', '$\\delta=\\min(\\delta_1,\\delta_2)$', { area: true }], ['muted', '$\\delta_1$, $\\delta_2$', { dash: true }]]);
        v.render(() => {
          H.x = f1(t0); H.y = f2(t0);
          const e = eps.value, e2 = e / Math.SQRT2;
          const d1 = admissible(f1, t0, f1(t0), e2, 0, TAU).d, d2 = admissible(f2, t0, f2(t0), e2, 0, TAU).d;
          const del = Math.min(d1, d2);
          const dv = admissible((t) => Math.hypot(f1(t) - f1(t0), f2(t) - f2(t0)), t0, 0, e, 0, TAU).d;
          const P = [f1(t0), f2(t0)];
          SP.circle(P[0], P[1], e, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4 });
          SP.rect(P[0] - e2, P[1] - e2, P[0] + e2, P[1] + e2, { color: 'accent', width: 1.2, dash: [4, 3] });
          const br = jump.value ? [TJ] : [];
          const arc = (lo, hi, st) => { const cuts = [lo, ...br.filter((c) => c > lo && c < hi), hi]; for (let i = 0; i + 1 < cuts.length; i++) SP.curve((t) => [f1(t), f2(t)], cuts[i] + (i ? 1e-9 : 0), cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0), st); };
          arc(0, TAU, { color: 'ink', width: 1.8, n: 700 });
          if (del > 0) arc(Math.max(0, t0 - del), Math.min(TAU, t0 + del), { color: 'orange', width: 4.5, n: 300 });
          if (del === 0) SP.corner('a component has no δ: f is not continuous at t₀', 'tl', { color: 'red', weight: 600 });
          for (const [S, F, dj] of [[S1, f1, d1], [S2, f2, d2]]) {
            const y0 = F(t0);
            S.hband(y0 - e2, y0 + e2, { color: 'accent', alpha: 0.1, edges: true });
            if (del > 0) S.vband(t0 - del, t0 + del, { color: 'orange', alpha: 0.14 });
            if (dj > 0 && dj < TAU) { S.vline(t0 - dj, { color: 'muted', dash: [3, 3], width: 1.1 }); S.vline(t0 + dj, { color: 'muted', dash: [3, 3], width: 1.1 }); }
            pieces(S, F, 0, TAU, S === S2 ? br : [], { color: 'ink', width: 2 });
            if (del > 0) pieces(S, F, Math.max(0, t0 - del), Math.min(TAU, t0 + del), S === S2 ? br : [], { color: 'orange', width: 3.4 });
            S.dot(t0, y0, { color: 'gold', r: 4.5 });
          }
          if (jump.value) { S2.dot(TJ, f2b(TJ), { r: 3.5, color: 'ink' }); S2.dot(TJ, f2b(TJ) + 0.5, { r: 3.5, color: 'ink', hollow: true }); }
          state = { d1, d2, del, dv, e };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.del === 0) return `$t_0 = ${v.fix(t0, 3)}$: $\\delta_1 = ${v.fmt(s.d1, 3)}$ but $\\delta_2 = 0$ — $f_2$ jumps at $t_0$. Because $|\\mathbf f(t)-\\mathbf f(t_0)| \\ge |f_2(t)-f_2(t_0)|$, no $\\delta$ works for $\\mathbf f$ either: one discontinuous component makes $\\mathbf f$ discontinuous.`;
          return `$t_0 = ${v.fix(t0, 3)}$: $\\;\\delta_1 = ${v.fmt(s.d1, 3)}$, $\\delta_2 = ${v.fmt(s.d2, 3)}$ (each for $\\varepsilon/\\sqrt2 = ${v.fix(s.e / Math.SQRT2, 3)}$), so $\\delta = ${v.fmt(s.del, 3)}$. Since $|\\mathbf f(t)-\\mathbf f(t_0)|^2 = |f_1(t)-f_1(t_0)|^2+|f_2(t)-f_2(t_0)|^2 < \\varepsilon^2$ on that window, $\\delta$ works for $\\mathbf f$; the largest $\\delta$ for $\\mathbf f$ directly is $${v.fmt(s.dv, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ continuity and compactness
    {
      num: '4.13',
      kind: 'Definition',
      name: 'Bounded mapping',
      statement: String.raw`A map $\mathbf f$ of a set $E$ into $\R^k$ is *bounded* if there is a real number $M$ with $|\mathbf f(x)|\le M$ for every $x\in E$.`,
      idea: String.raw`Boundedness of $\mathbf f$ is boundedness of its range $\mathbf f(E)$ as a subset of $\R^k$: the range sits inside the closed ball of radius $M$ about the origin. Theorem 4.15 shows that continuity on a compact domain forces it.`,
      deps: ['pma-2.18'],
      tags: ['boundedness'],
    },
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Continuous images of compact sets are compact',
      statement: String.raw`If $f$ is a continuous map of a compact metric space $X$ into a metric space $Y$, then $f(X)$ is compact.`,
      idea: String.raw`Let $\{V_\alpha\}$ be an open cover of $f(X)$. By 4.8 each $f^{-1}(V_\alpha)$ is open, and together they cover $X$; compactness of $X$ leaves finitely many, $f^{-1}(V_{\alpha_1}),\dots,f^{-1}(V_{\alpha_n})$, that already cover $X$. Since $f(f^{-1}(V))\subset V$, the sets $V_{\alpha_1},\dots,V_{\alpha_n}$ cover $f(X)$.`,
      caption: String.raw`Drag the red point $y^*$ off the image $f(X)$ (thick bar on the left). Every $y\in f(X)$ gets the open interval $V_y$ of radius $\tfrac12|y-y^*|$; these cover $f(X)$, and the coloured bars show a finite subcover (left) and the preimages $f^{-1}(V_y)$, which cover $X$ (rows below). For the compact $X$ a finite subcover always exists; for $X=(0,1]$ or a discontinuous $f$, put $y^*$ on the missing point of $f(X)$: the intervals pile up forever.`,
      deps: ['pma-4.8', 'pma-2.32'],
      tags: ['compactness', 'continuity'],
      viz(v) {
        const K = 0.5;
        const EX = {
          comp: { label: '$X=[0,1]$', f: (x) => 0.55 + 0.3 * Math.sin(5.5 * x - 0.6) + 0.25 * x, parts: [[0, 1, false, false]], ys: 0.96 },
          open: { label: '$X=(0,1]$', f: (x) => 0.3 + 0.75 * x + 0.12 * x * Math.sin(9 * x), parts: [[0, 1, true, false]], ys: 0.3 },
          jump: { label: '$X=[0,1]$, $f$ jumps', f: (x) => (x < 0.5 ? 0.25 + 1.1 * x : 1.0 + 0.25 * (x - 0.5)), parts: [[0, 0.5, false, true], [0.5, 1, false, false]], ys: 0.8 },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'comp');
        const S = v.stage({ x: [-0.6, 1.1], y: [-0.74, 1.3], height: 360, axes: false });
        // image components [lo, hi, loOpen, hiOpen] computed from the pieces of X
        function image(E) {
          const out = [];
          for (const [a, b, ao, bo] of E.parts) {
            const xs = v.M.linspace(a, b, 2001); let lo = Infinity, hi = -Infinity, il = 0, ih = 0;
            xs.forEach((x, i) => {
              const xe = i === 0 && ao ? a + 1e-12 : i === xs.length - 1 && bo ? b - 1e-12 : x; // open ends: use the one-sided limit
              const y = E.f(xe); if (y < lo) { lo = y; il = i; } if (y > hi) { hi = y; ih = i; }
            });
            const openAt = (i) => (i === 0 && ao) || (i === xs.length - 1 && bo);
            out.push([lo, hi, openAt(il), openAt(ih)]);
          }
          out.sort((p, q) => p[0] - q[0]);
          const m = [];
          for (const c of out) { const last = m[m.length - 1]; if (last && c[0] <= last[1]) { if (c[1] > last[1]) { last[1] = c[1]; last[3] = c[3]; } } else m.push(c.slice()); }
          return m;
        }
        const missing = (E) => image(E).flatMap(([lo, hi, lo_o, hi_o]) => [...(lo_o ? [lo] : []), ...(hi_o ? [hi] : [])]);
        const YS = S.handle(-0.06, 1.2, {
          color: 'red', label: 'y*',
          constrain: (x, y) => { for (const mp of missing(EX[which.value])) if (Math.abs(y - mp) < 0.03) return [-0.06, mp]; return [-0.06, y]; },
        });
        // greedy finite subcover of one component by the intervals V_y, y in the component
        function coverPart([lo, hi, loO, hiO], ys) {
          if (hiO && Math.abs(ys - hi) < 1e-9) ys = hi; // y* sits on a missing endpoint
          if (loO && Math.abs(ys - lo) < 1e-9) ys = lo;
          const inside = (ys > lo && ys < hi) || (ys === lo && !loO) || (ys === hi && !hiO);
          if (inside) return { notCover: true, list: [] };
          const list = [];
          if (ys >= hi) {
            let c = lo;
            for (let k = 0; k < 200; k++) {
              const y = Math.min(hi - (hiO ? 1e-12 : 0), (c + K * ys) / (1 + K) - 1e-12), up = y + K * (ys - y);
              list.push([y, K * (ys - y)]);
              if (up > hi || (hiO && up >= hi)) return { list };
              if (up <= c + 1e-13) break;
              c = up;
            }
            return { list, infinite: true };
          }
          let c = hi;
          for (let k = 0; k < 200; k++) {
            const y = Math.max(lo + (loO ? 1e-12 : 0), (c + K * ys) / (1 + K) + 1e-12), down = y - K * (y - ys);
            list.push([y, K * (y - ys)]);
            if (down < lo || (loO && down <= lo)) return { list };
            if (down >= c - 1e-13) break;
            c = down;
          }
          return { list, infinite: true };
        }
        let last = null, state = null;
        v.legend([['ink', 'graph of $f$ and the image $f(X)$'], ['red', '$y^*$'], ['blue', 'chosen $V_y$ and $f^{-1}(V_y)$ (one colour each)']]);
        v.render(() => {
          const E = EX[which.value];
          if (last !== which.value) { last = which.value; YS.y = E.ys; for (const mp of missing(E)) if (Math.abs(YS.y - mp) < 0.03) YS.y = mp; }
          const ys = YS.y, img = image(E);
          // X axis and graph
          S.line(0, 0, 1, 0, { color: 'muted', width: 1.4 });
          for (const x of [0, 0.5, 1]) S.line(x, -0.02, x, 0.02, { color: 'muted', width: 1 });
          S.text('X', 1.05, 0, { math: true, color: 'muted' });
          for (const [a, b] of E.parts) S.fn(E.f, { domain: [a + 1e-9, b - 1e-9], color: 'ink', width: 2.4 });
          for (const [a, b, ao, bo] of E.parts) { S.dot(a, E.f(a), { r: 3.8, color: 'ink', hollow: ao }); S.dot(b, bo ? E.f(b - 1e-12) : E.f(b), { r: 3.8, color: 'ink', hollow: bo }); }
          // image bar
          for (const [lo, hi, loO, hiO] of img) {
            S.line(-0.06, lo, -0.06, hi, { color: 'ink', width: 5, cap: 'butt' });
            S.dot(-0.06, lo, { r: 3.6, color: 'ink', hollow: loO }); S.dot(-0.06, hi, { r: 3.6, color: 'ink', hollow: hiO });
          }
          S.tex('f(X)', -0.06, img[0][0], { color: 'ink', baseline: 'top', dy: 8, size: 13 });
          // cover
          let notCover = false, infinite = false; const chosen = [];
          for (const part of img) { const r = coverPart(part, ys); if (r.notCover) notCover = true; if (r.infinite) infinite = true; chosen.push(...r.list); }
          const shown = notCover ? [] : chosen.slice(0, 8);
          shown.forEach(([c, r], k) => {
            const col = CYCLE[k % CYCLE.length], xb = -0.15 - 0.055 * k;
            S.rect(xb, c - r, 1.0, c + r, { fill: col, fillAlpha: 0.07, stroke: false });
            S.line(xb, c - r, xb, c + r, { color: col, width: 4, alpha: 0.85, cap: 'butt' });
            S.dot(xb, c, { r: 2.2, color: col });
            const yRow = -0.1 - 0.075 * k;
            for (const [a, b] of E.parts) for (const [l, u] of runs((x) => { const y = E.f(x); return y > c - r && y < c + r; }, a + 1e-9, b - 1e-9, 500)) S.line(l, yRow, u, yRow, { color: col, width: 4, alpha: 0.85, cap: 'butt' });
          });
          if (shown.length) S.tex('f^{-1}(V_y)', -0.02, -0.1, { color: 'muted', align: 'right', size: 13 });
          const msg = notCover ? 'y* ∈ f(X): the V_y do not cover f(X) — move y* off the image' : infinite ? 'no finite subcover: the V_y pile up at y*' : `finite subcover: ${chosen.length} interval${chosen.length > 1 ? 's' : ''}`;
          S.corner(msg, 'tr', { color: notCover ? 'muted' : infinite ? 'red' : 'green', weight: 600 });
          state = { notCover, infinite, n: chosen.length, compact: which.value === 'comp' };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.notCover) return 'The point $y^*$ lies in $f(X)$, and no $V_y$ contains it; drag it to a point outside the image.';
          if (s.infinite) return 'The image $f(X)$ is not closed: $y^*$ is a limit point of $f(X)$ outside it. The cover $\\{V_y\\}$ has no finite subcover — consistent with 4.14, since here $X$ is not compact or $f$ is not continuous.';
          return `${s.n} of the intervals $V_y$ already cover $f(X)$, and their preimages cover $X$.` + (s.compact ? ' However close $y^*$ comes to $f(X)$, the count stays finite.' : '');
        });
      },
    },
    {
      num: '4.15',
      kind: 'Theorem',
      name: 'Continuous maps on compact spaces are bounded',
      statement: String.raw`If $\mathbf f$ is a continuous map of a compact metric space $X$ into $\R^k$, then $\mathbf f(X)$ is closed and bounded. In particular, $\mathbf f$ is bounded.`,
      idea: String.raw`By 4.14 the image $\mathbf f(X)$ is a compact subset of $\R^k$, and compact subsets of $\R^k$ are closed and bounded (2.41).`,
      caption: String.raw`Left: the unit disc $X$ with a polar grid; right: its image under $\mathbf f$. Drag $z$: the gold points $\mathbf f(r_n z/|z|)$ with $r_n\uparrow1$ converge to the image of the boundary point in the direction of $z$. On the closed disc that limit belongs to $\mathbf f(X)$ and $|\mathbf f|$ attains its maximum (green circle). On the open disc the same map has a bounded image that is not closed; the map $z/(1-|z|)$ is continuous there and unbounded.`,
      deps: ['pma-4.14', 'pma-2.41', 'pma-4.13'],
      tags: ['compactness', 'boundedness'],
      viz(v) {
        const { Cx } = v.M, TAU = 2 * Math.PI;
        const MAPS = {
          comp: { label: 'closed disc', F: (z) => z.add(z.mul(z).scale(0.35)), closed: true },
          open: { label: 'open disc, same map', F: (z) => z.add(z.mul(z).scale(0.35)), closed: false },
          blow: { label: 'open disc, $z/(1-|z|)$', F: (z) => z.scale(1 / (1 - z.abs())), closed: false, unbounded: true },
        };
        const which = v.select('', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'comp');
        const SD = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 320, axes: false, title: 'domain $X$' });
        const SI = v.stage({ x: [-1.7, 1.9], y: [-1.6, 1.6], equal: true, height: 320, axes: false, title: 'image $\\mathbf f(X)\\subset\\R^2$' });
        v.legend([['accent', 'the disc $X$ and its image', { area: true }], ['gold', '$z$, and $\\mathbf f(r_n z/|z|)$ with $r_n\\uparrow 1$', { dot: true }], ['green', '$\\max|\\mathbf f|$ (attained)'], ['red', 'limit not in $\\mathbf f(X)$', { dot: true }]]);
        const Z = SD.handle(0.55, 0.35, { color: 'gold', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y), R = MAPS[which.value].closed ? 1 : 0.97; return r > R ? [(x * R) / r, (y * R) / r] : [x, y]; } });
        let state = null;
        v.render(() => {
          const Mp = MAPS[which.value], F = Mp.F;
          const blow = !!Mp.unbounded;
          SI.setView(blow ? [-4.2, 4.2] : [-1.7, 1.9], blow ? [-3.6, 3.6] : [-1.6, 1.6]);
          // domain
          SD.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          const radii = blow ? [0.25, 0.5, 0.65, 0.75, 0.82, 0.88, 0.92] : [0.25, 0.5, 0.75];
          for (const r of radii) SD.circle(0, 0, r, { color: 'faint', width: 1 });
          for (let k = 0; k < 12; k++) { const t = (TAU * k) / 12; SD.line(0, 0, Math.cos(t), Math.sin(t), { color: 'faint', width: 1 }); }
          SD.circle(0, 0, 1, { color: 'accent', width: 2.2, dash: Mp.closed ? null : [6, 5] });
          // image grid
          const Fp = (x, y) => { const w = F(new Cx(x, y)); return [w.re, w.im]; };
          if (!blow) SI.poly(v.M.linspace(0, TAU, 361).map((t) => Fp(Math.cos(t), Math.sin(t))), { fill: 'accent', fillAlpha: 0.08, stroke: false });
          for (const r of radii) SI.curve((t) => Fp(r * Math.cos(t), r * Math.sin(t)), 0, TAU, { color: 'faint', width: 1, n: 240 });
          for (let k = 0; k < 12; k++) { const t = (TAU * k) / 12; SI.curve((s) => Fp(s * Math.cos(t), s * Math.sin(t)), 0, blow ? 0.96 : 1, { color: 'faint', width: 1, n: 120 }); }
          if (!blow) SI.curve((t) => Fp(Math.cos(t), Math.sin(t)), 0, TAU, { color: 'accent', width: 2.2, dash: Mp.closed ? null : [6, 5], n: 360 });
          // sup of |f|
          let M = 0, arg = 0;
          if (!blow) for (const t of v.M.linspace(0, TAU, 1441)) { const w = Fp(Math.cos(t), Math.sin(t)); const r = Math.hypot(...w); if (r > M) { M = r; arg = t; } }
          if (!blow) {
            SI.circle(0, 0, M, { color: Mp.closed ? 'green' : 'red', width: 1.6, dash: Mp.closed ? null : [4, 4] });
            const wm = Fp(Math.cos(arg), Math.sin(arg));
            SI.dot(wm[0], wm[1], { r: 5, color: Mp.closed ? 'green' : 'red', hollow: !Mp.closed, width: 2, label: Mp.closed ? 'max |f|' : 'sup |f|, not attained', labelPos: 'ne' });
          }
          SI.dot(0, 0, { r: 2.5, color: 'muted' });
          // sequence toward the boundary in the direction of z
          const r0 = Math.hypot(Z.x, Z.y) || 1, u = [Z.x / r0, Z.y / r0];
          const rs = v.M.range(12, 1).map((n) => 1 - 0.55 ** n);
          rs.forEach((r) => { SD.dot(r * u[0], r * u[1], { r: 2.8, color: 'gold' }); const w = Fp(r * u[0], r * u[1]); SI.dot(w[0], w[1], { r: 3.2, color: 'gold' }); });
          SD.dot(u[0], u[1], { r: 4.5, color: Mp.closed ? 'green' : 'red', hollow: !Mp.closed, width: 2 });
          if (!blow) { const wl = Fp(u[0], u[1]); SI.dot(wl[0], wl[1], { r: 5, color: Mp.closed ? 'green' : 'red', hollow: !Mp.closed, width: 2.2 }); }
          const wz = Fp(Z.x, Z.y);
          SI.dot(wz[0], wz[1], { r: 5, color: 'gold', label: 'f(z)', labelPos: 'sw' });
          if (blow) SI.corner('|f(z)| = |z|/(1−|z|) → ∞', 'tl', { color: 'red', weight: 600 });
          else SI.corner(Mp.closed ? 'closed and bounded' : 'bounded, but not closed', 'tl', { color: Mp.closed ? 'green' : 'red', weight: 600 });
          state = { M, blow, closed: Mp.closed, fz: Math.hypot(...wz) };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.blow) return `$|\\mathbf f(z)| = ${v.fmt(s.fz, 3)}$ here, and it grows without bound as $|z|\\to1$: the open disc is not compact, and continuity alone does not force boundedness.`;
          return `$|\\mathbf f(z)| = ${v.fix(s.fz, 3)} \\le ${v.fix(s.M, 3)}$` + (s.closed ? ' $= \\max_X |\\mathbf f|$, attained on the boundary circle; every limit of image points is again an image point.' : ' $= \\sup_X |\\mathbf f|$, never attained: the boundary circle is missing from $X$, so the gold limits fall outside $\\mathbf f(X)$.');
        });
      },
    },
    {
      num: '4.16',
      kind: 'Theorem',
      name: 'Extreme value theorem',
      statement: String.raw`Let $f$ be a continuous real function on a compact metric space $X$, and put $M=\sup_{p\in X}f(p)$, $m=\inf_{p\in X}f(p)$. Then there are points $p,q\in X$ with $f(p)=M$ and $f(q)=m$; that is, $f(q)\le f(x)\le f(p)$ for all $x\in X$.`,
      idea: String.raw`By 4.15 the set $f(X)\subset\R$ is closed and bounded, so its supremum and infimum exist and — being limit points of a closed set, or members of it — belong to $f(X)$ (2.28). Hence $M=f(p)$ and $m=f(q)$ for some $p,q\in X$.`,
      caption: String.raw`Shape $f$ with the purple handles and move the domain ends $a,b$ (orange). With $X=[a,b]$ the maximum and minimum are always attained (green). Open an end, or lower the value at the maximiser (a discontinuity), and the supremum can escape: it is still a limit of values, but no point attains it (red).`,
      deps: ['pma-4.15', 'pma-2.28'],
      tags: ['compactness', 'extrema'],
      viz(v) {
        const XS = [0, 0.8, 1.6, 2.4, 3.2, 4.0];
        const ends = v.select('$X=$', [{ value: 'cc', label: '$[a,b]$' }, { value: 'co', label: '$[a,b)$' }, { value: 'oc', label: '$(a,b]$' }, { value: 'oo', label: '$(a,b)$' }], 'cc');
        const punct = v.toggle('lower $f$ at its maximiser', false);
        const S = v.stage({ x: [-0.25, 4.25], y: [-0.55, 3.1], height: 360, xlabel: 'x' });
        const C = [1.0, 2.15, 1.25, 0.55, 1.75, 0.95].map((y, i) => S.handle(XS[i], y, { color: 'purple', r: 5.5, constrain: (x, yy) => [XS[i], v.M.clamp(yy, -0.3, 2.9)] }));
        const A = S.handle(0.45, 0, { color: 'orange', label: 'a', constrain: (x) => [v.M.clamp(x, 0, 4), 0] });
        const B = S.handle(3.6, 0, { color: 'orange', label: 'b', constrain: (x) => [v.M.clamp(x, 0, 4), 0] });
        const spline = (x) => {
          const Y = C.map((h) => h.y), i = v.M.clamp(Math.floor(x / 0.8), 0, 4), t = (x - i * 0.8) / 0.8;
          const p0 = Y[Math.max(0, i - 1)], p1 = Y[i], p2 = Y[i + 1], p3 = Y[Math.min(5, i + 2)];
          return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        };
        let state = null;
        v.render(() => {
          const a = Math.min(A.x, B.x), b = Math.max(A.x, B.x);
          const aO = ends.value[0] === 'o', bO = ends.value[1] === 'o';
          const xs = v.M.linspace(a, b, 1601);
          let xM = a, Mv = -Infinity, xm = a, mv = Infinity;
          for (const x of xs) { const y = spline(x); if (y > Mv) { Mv = y; xM = x; } if (y < mv) { mv = y; xm = x; } }
          const isEnd = (x) => (Math.abs(x - a) < 1e-9 && aO) || (Math.abs(x - b) < 1e-9 && bO);
          const pOn = punct.value && !isEnd(xM);
          const DROP = 0.9, pv = Mv - DROP;
          const supAtt = !isEnd(xM) && !pOn;
          let inf = mv, infAtt = !isEnd(xm) && !(pOn && Math.abs(xm - xM) < 1e-9), infX = xm;
          if (pOn && pv < mv) { inf = pv; infAtt = true; infX = xM; }
          // drawing
          S.vband(a, b, { color: 'orange', alpha: 0.05 });
          S.fn(spline, { domain: [0, 4], color: 'faint', width: 1.4, dash: [4, 4] });
          pieces(S, spline, a, b, pOn ? [xM] : [], { color: 'ink', width: 2.4 });
          S.dot(a, spline(a), { r: 4, color: 'ink', hollow: aO }); S.dot(b, spline(b), { r: 4, color: 'ink', hollow: bO });
          if (pOn) S.dot(xM, pv, { r: 4, color: 'ink' });
          S.hline(Mv, { color: supAtt ? 'green' : 'red', dash: [6, 4], width: 1.3 });
          S.hline(inf, { color: infAtt ? 'green' : 'red', dash: [6, 4], width: 1.3 });
          S.dot(xM, Mv, { r: 10, color: supAtt ? 'green' : 'red', hollow: true, width: 2.6 });
          S.dot(infX, inf, { r: 10, color: infAtt ? 'green' : 'red', hollow: true, width: 2.6 });
          if (supAtt) S.dot(xM, Mv, { r: 4, color: 'green' });
          if (infAtt) S.dot(infX, inf, { r: 4, color: 'green' });
          S.text(supAtt ? 'max M attained' : 'sup M not attained', 4.22, Mv, { align: 'right', dy: -10, color: supAtt ? 'green' : 'red', size: 11.5, weight: 600 });
          S.text(infAtt ? 'min m attained' : 'inf m not attained', 4.22, inf, { align: 'right', dy: 11, color: infAtt ? 'green' : 'red', size: 11.5, weight: 600 });
          S.interval(a, b, 0, { open: [aO, bO], color: 'orange', width: 3, r: 3 });
          state = { a, b, Mv, mv: inf, xM, supAtt, infAtt, infX, aO, bO, pOn };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const part = (name, val, att, x) => att ? `$${name} = ${v.fix(val, 3)} = f(${v.fix(x, 3)})$` : `$${name === 'M' ? '\\sup' : '\\inf'} f = ${v.fix(val, 3)}$ is not attained`;
          const why = !s.supAtt || !s.infAtt ? (s.pOn ? ' — $f$ is no longer continuous.' : ' — the domain is not compact.') : ' — both attained, as 4.16 guarantees.';
          return `${part('M', s.Mv, s.supAtt, s.xM)}, $\\;$ ${part('m', s.mv, s.infAtt, s.infX)}${why}`;
        });
      },
    },
    {
      num: '4.17',
      kind: 'Theorem',
      name: 'Inverse of a continuous bijection on a compact space',
      statement: String.raw`Let $f$ be a continuous one-to-one map of a compact metric space $X$ onto a metric space $Y$. Then the inverse map $f^{-1}:Y\to X$, defined by $f^{-1}(f(x))=x$, is continuous.`,
      idea: String.raw`By 4.8 applied to $f^{-1}$, it suffices that $f(V)$ is open in $Y$ for every open $V\subset X$. The complement $V^c$ is closed in the compact $X$, hence compact (2.35); its image $f(V^c)$ is compact (4.14), hence closed in $Y$ (2.34). As $f$ is a bijection, $f(V)$ is the complement of $f(V^c)$, so it is open. Rudin's example 4.21 — $t\mapsto(\cos t,\sin t)$ on $[0,2\pi)$ — shows that compactness cannot be dropped.`,
      caption: String.raw`$f(t)=(\cos t,\sin t)$ maps $X$ one-to-one onto $Y$. Drag $y$ around $Y$ and shrink $\eps$: the blue arc is the part of $Y$ within $\eps$ of $y$, and the bottom strip shows its preimage in $X$. For $X=[0,2\pi)$ and $y=(1,0)$ the preimage splits into pieces near $0$ and near $2\pi$ however small $\eps$ is: $f^{-1}$ jumps there (middle panel). On the compact arc this cannot happen. The purple toggle shows the key step of the proof: a closed $C\subset X$ whose image is not closed.`,
      deps: ['pma-4.8', 'pma-4.14', 'pma-2.35', 'pma-2.34'],
      tags: ['compactness', 'inverse maps'],
      viz(v) {
        const TAU = 2 * Math.PI;
        const MODES = { half: { label: '$X=[0,2\\pi)$', L: TAU, open: true }, arc: { label: '$X=[0,\\tfrac32\\pi]$', L: 1.5 * Math.PI, open: false } };
        const mode = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'half');
        const eps = v.slider('$\\varepsilon$', 0.04, 0.9, 0.35, { step: 0.01 });
        const showC = v.toggle('closed $C\\subset X$ and $f(C)$', false);
        const SY = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, height: 300, axes: false, weight: 1, title: '$Y=f(X)$ in the plane' });
        const SG = v.stage({ x: [-Math.PI, Math.PI], y: [-0.4, TAU + 0.4], height: 300, weight: 1, xlabel: 'θ', title: '$f^{-1}(e^{i\\theta})$ against the angle $\\theta\\in(-\\pi,\\pi]$', xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], yticks: [[Math.PI, 'π'], [TAU, '2π']] });
        const SX = v.stage({ x: [-0.3, TAU + 0.35], y: [-1, 1], height: 96, axes: false, full: true, title: 'the domain $X$ and the preimage $f^{-1}(\\{w\\in Y: |w-y|<\\varepsilon\\})$' });
        let phi = 0.0;
        const Yh = SY.handle(1, 0, {
          color: 'gold', label: 'y',
          constrain: (x, y) => { const M = MODES[mode.value]; let a = Math.atan2(y, x); if (a < 0) a += TAU; if (!M.open) { if (a > M.L) a = a - M.L < TAU - a ? M.L : 0; } else if (a >= TAU) a = 0; phi = a; return [Math.cos(a), Math.sin(a)]; },
        });
        let last = null, state = null;
        v.render(() => {
          const M = MODES[mode.value];
          if (last !== mode.value) { last = mode.value; phi = M.open ? 0 : 0.6 * M.L; Yh.x = Math.cos(phi); Yh.y = Math.sin(phi); }
          const e = eps.value, w = 2 * Math.asin(Math.min(1, e / 2));
          const inN = (t) => { let d = Math.abs(((t - phi) % TAU + TAU) % TAU); d = Math.min(d, TAU - d); return d < w; };
          const pre = runs(inN, 0, M.open ? TAU - 1e-9 : M.L, 2400);
          // Y
          SY.circle(0, 0, 1, { color: 'faint', width: 1, dash: [2, 4] });
          SY.curve((t) => [Math.cos(t), Math.sin(t)], 0, M.L, { color: 'ink', width: 2.6, n: 360 });
          if (M.open) SY.dot(1, 0, { r: 3, color: 'ink' }); else { SY.dot(1, 0, { r: 3.5, color: 'ink' }); SY.dot(Math.cos(M.L), Math.sin(M.L), { r: 3.5, color: 'ink' }); }
          for (const [l, u] of pre) SY.curve((t) => [Math.cos(t), Math.sin(t)], l, u, { color: 'accent', width: 6, alpha: 0.8 });
          SY.circle(Yh.x, Yh.y, e, { color: 'accent', width: 1, dash: [3, 3] });
          // C and f(C)
          const C = M.open ? [Math.PI, TAU] : [Math.PI, M.L];
          if (showC.value) {
            SY.curve((t) => [1.12 * Math.cos(t), 1.12 * Math.sin(t)], C[0], C[1], { color: 'purple', width: 3.5 });
            SY.dot(1.12 * Math.cos(C[0]), 1.12 * Math.sin(C[0]), { r: 4, color: 'purple' });
            SY.dot(1.12 * Math.cos(C[1]), 1.12 * Math.sin(C[1]), { r: 4, color: 'purple', hollow: M.open, width: 2 });
            SY.tex('f(C)', 1.25 * Math.cos(4.3), 1.25 * Math.sin(4.3), { color: 'purple', size: 14 });
          }
          // graph of f^{-1} in angle coordinates
          const inv = (th) => (th >= 0 ? th : th + TAU);
          const inY = (th) => M.open || inv(th) <= M.L + 1e-12;
          if (!M.open) SG.vband(M.L - TAU, 0, { color: 'faint', alpha: 0.35 });
          if (!M.open) SG.text('not in Y', (M.L - TAU) / 2, TAU + 0.15, { align: 'center', color: 'muted', size: 11 });
          const thy = phi > Math.PI ? phi - TAU : phi;
          SG.vband(thy - w, thy + w, { color: 'accent', alpha: 0.1 });
          SG.fn((th) => (inY(th) && th < 0 ? inv(th) : NaN), { domain: [-Math.PI, -1e-9], color: 'ink', width: 2.4 });
          SG.fn((th) => (th >= 0 && inY(th) ? th : NaN), { domain: [0, Math.PI], color: 'ink', width: 2.4 });
          if (M.open) { SG.dot(0, TAU, { r: 4, color: 'ink', hollow: true }); SG.dot(0, 0, { r: 4, color: 'ink' }); }
          for (const [l, u] of pre) { SG.hband(l, u, { color: 'accent', alpha: 0.13 }); }
          SG.dot(thy, phi, { r: 5, color: 'gold' });
          // X
          SX.line(0, 0, M.L, 0, { color: 'faint', width: 6, cap: 'butt' });
          SX.dot(0, 0, { r: 4, color: 'ink' }); SX.dot(M.L, 0, { r: 4, color: 'ink', hollow: M.open, width: 2 });
          SX.text('0', 0, 0, { dy: 18, align: 'center', color: 'muted', size: 11 }); SX.text(M.open ? '2π' : '3π/2', M.L, 0, { dy: 18, align: 'center', color: 'muted', size: 11 });
          for (const [l, u] of pre) SX.line(l, 0, u, 0, { color: 'accent', width: 6, cap: 'butt' });
          if (showC.value) { SX.line(C[0], 0.45, C[1], 0.45, { color: 'purple', width: 3.5, cap: 'butt' }); SX.dot(C[0], 0.45, { r: 3.5, color: 'purple' }); if (!M.open) SX.dot(C[1], 0.45, { r: 3.5, color: 'purple' }); SX.text('C', C[0] - 0.1, 0.45, { math: true, color: 'purple', align: 'right' }); }
          SX.dot(phi, 0, { r: 5, color: 'gold' });
          const lo = Math.min(...pre.map((p) => p[0])), hi = Math.max(...pre.map((p) => p[1]));
          const diam = pre.length ? hi - lo : 0;
          if (pre.length) SX.measure(lo, -0.55, hi, -0.55, 'diameter', { color: diam > 2.2 * w + 1e-6 ? 'red' : 'green', math: false, size: 11.5, offset: -11 });
          SX.corner(`diameter of the preimage: ${v.fmt(diam, 3)}`, 'tr', { color: diam > 2.2 * w + 1e-6 ? 'red' : 'green', weight: 600 });
          state = { diam, w, split: pre.length > 1, open: M.open };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.split) return `The $\\varepsilon$-neighbourhood of $y=(1,0)$ in $Y$ pulls back to two pieces of $X$, at $0$ and near $2\\pi$; its preimage has diameter $${v.fmt(s.diam, 3)}$ for every $\\varepsilon$, so $f^{-1}$ is not continuous at $y$. (A closed $C=[\\pi,2\\pi)\\subset X$ has the non-closed image shown in purple — exactly where the proof breaks.)`;
          return `The preimage of the $\\varepsilon$-neighbourhood is a single interval of length $${v.fmt(s.diam, 3)}$, which shrinks to $0$ with $\\varepsilon$: $f^{-1}$ is continuous at $y$.` + (s.open ? ' Only the point $(1,0)$ is bad.' : '');
        });
      },
    },
    {
      num: '4.18',
      kind: 'Definition',
      name: 'Uniform continuity',
      statement: String.raw`A map $f$ of a metric space $X$ into a metric space $Y$ is *uniformly continuous* on $X$ if for every $\eps>0$ there is a $\delta>0$ such that $d_Y(f(p),f(q))<\eps$ for all $p,q\in X$ with $d_X(p,q)<\delta$.`,
      idea: String.raw`In ordinary continuity $\delta$ may depend on the point $p$ as well as on $\eps$; here one $\delta$ must serve every point at once. Uniform continuity is a property of $f$ on a whole set, not at a point; it implies continuity, and on compact spaces the two coincide (4.19).`,
      caption: String.raw`The orange box has half-width $\delta$ and half-height $\eps$; slide it along the graph with the handle. Uniform continuity asks for one box size that never lets the graph escape through the top or bottom. The strip along the bottom marks the points $p$ where the current box fits (green) or fails (red). For $\sqrt x$ some $\delta$ always works; for $x^2/4$ and $\sin(x^2)$ on $[0,\infty)$ the red region reappears further out for every $\delta$.`,
      deps: ['pma-4.5'],
      tags: ['continuity', 'uniform continuity'],
      viz(v) {
        const EX = {
          sqrt: { label: '$\\sqrt x$ on $[0,4]$', f: Math.sqrt, a: 0, b: 4, y: [-0.62, 2.3], tail: false },
          sq: { label: '$x^2/4$ on $[0,\\infty)$', f: (x) => (x * x) / 4, a: 0, b: 7, y: [-3.2, 12.6], tail: true },
          sinsq: { label: '$\\sin(x^2)$ on $[0,\\infty)$', f: (x) => Math.sin(x * x), a: 0, b: 5, y: [-2.05, 1.5], tail: true },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'sqrt');
        const eps = v.slider('$\\varepsilon$', 0.05, 1, 0.4, { step: 0.01 });
        const del = v.slider('$\\delta$', 0.01, 1, 0.2, { step: 0.005 });
        const S = v.stage({ x: [-0.15, 4.15], y: EX.sqrt.y, height: 360, xlabel: 'x', full: true });
        const P = S.handle(1.5, 1.22, { color: 'accent', label: 'p', constrain: (x) => { const E = EX[which.value]; const xx = v.M.clamp(x, E.a, E.b); return [xx, E.f(xx)]; } });
        let last = null, cache = { key: null, ds: null }, state = null;
        v.render(() => {
          const E = EX[which.value], e = eps.value, d = del.value;
          if (last !== which.value) { last = which.value; const pad = (E.b - E.a) * 0.04; S.setView([E.a - pad, E.b + pad], E.y); P.x = E.a + (E.b - E.a) * 0.35; }
          P.y = E.f(P.x);
          const ps = v.M.linspace(E.a, E.b, 280);
          const key = `${which.value}|${e}`;
          if (cache.key !== key) { cache = { key, ds: ps.map((q) => admissible(E.f, q, E.f(q), e, E.a, E.b, 500).d) }; }
          const ds = cache.ds, dmin = Math.min(...ds);
          const fits = ds.map((x) => x >= d);
          // box at p
          const p = P.x, fp = P.y;
          const ok = admissible(E.f, p, fp, e, E.a, E.b, 800).d >= d;
          S.rect(p - d, fp - e, p + d, fp + e, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.6 });
          S.fn(E.f, { domain: [E.a, E.b], color: 'ink', width: 2.2, n: 1600 });
          const lo = Math.max(E.a, p - d), hi = Math.min(E.b, p + d);
          S.fn((x) => (Math.abs(E.f(x) - fp) < e ? E.f(x) : NaN), { domain: [lo, hi], color: 'accent', width: 3.6, n: 600 });
          S.fn((x) => (Math.abs(E.f(x) - fp) >= e ? E.f(x) : NaN), { domain: [lo, hi], color: 'red', width: 3.6, n: 600 });
          if (E.tail) S.corner('the domain continues to ∞ →', 'tr', { color: 'muted' });
          S.tex('\\varepsilon', p + d, fp + e, { color: 'orange', align: 'left', baseline: 'bottom', dx: 4, size: 14 });
          // strip along the bottom: where does the current box fit?
          const step = (E.b - E.a) / (ps.length - 1), y0 = S.invY(S.height - 12), y1 = S.invY(S.height - 26);
          ps.forEach((x, i) => S.rect(x - step / 2, y0, x + step / 2, y1, { fill: fits[i] ? 'green' : 'red', fillAlpha: 0.6, stroke: false }));
          S.line(p, S.invY(S.height - 6), p, S.invY(S.height - 32), { color: 'accent', width: 2.5 });
          S.text('box fits at p?', E.a, y1, { color: 'muted', size: 11, dy: -9 });
          state = { ok, dmin, all: fits.every(Boolean), tail: E.tail, e, d };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          let t = `At $p$ the box ${s.ok ? 'fits' : 'does not fit'}. The largest $\\delta$ that works at every point shown is $${v.fmt(s.dmin, 3)}$ for $\\varepsilon = ${v.fix(s.e, 2)}$`;
          t += s.tail ? ' — and it keeps shrinking as the domain extends further right, so no single $\\delta$ works on $[0,\\infty)$: not uniformly continuous.' : ' — a single $\\delta$ for the whole domain: uniformly continuous.';
          return t;
        });
      },
    },
  ],
};
