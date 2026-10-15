// Rudin, Principles of Mathematical Analysis — Chapter 4 (part 3): non-compact domains,
// continuity and connectedness, discontinuities.

// ---------- shared helpers ----------
/** Graph of f on [a,b] broken at the given points. */
function pieces(S, f, a, b, breaks, st) {
  const cuts = [a, ...breaks.filter((c) => c > a && c < b).sort((u, w) => u - w), b];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? 1e-9 : 0), hi = cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0);
    if (hi > lo) S.fn(f, { ...st, domain: [lo, hi] });
  }
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
/** Marching squares: segments [[p,q], ...] of the level set {F = 0}. */
function zeroSegments(F, [x0, x1], [y0, y1], nx, ny) {
  const dx = (x1 - x0) / nx, dy = (y1 - y0) / ny, G = [];
  for (let j = 0; j <= ny; j++) { const row = []; for (let i = 0; i <= nx; i++) row.push(F(x0 + i * dx, y0 + j * dy)); G.push(row); }
  const segs = [];
  const cut = (p, q, a, b) => { const t = a / (a - b); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const P = [[x0 + i * dx, y0 + j * dy], [x0 + (i + 1) * dx, y0 + j * dy], [x0 + (i + 1) * dx, y0 + (j + 1) * dy], [x0 + i * dx, y0 + (j + 1) * dy]];
    const V = [G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]];
    if (!V.every(isFinite)) continue;
    const pts = [];
    for (let k = 0; k < 4; k++) { const a = V[k], b = V[(k + 1) % 4]; if ((a < 0) !== (b < 0)) pts.push(cut(P[k], P[(k + 1) % 4], a, b)); }
    if (pts.length >= 2) segs.push([pts[0], pts[1]]);
    if (pts.length === 4) segs.push([pts[2], pts[3]]);
  }
  return segs;
}

export default {
  collection: 'pma',
  chapter: 4,
  items: [
    {
      num: '4.20',
      kind: 'Theorem',
      name: 'Non-compact sets in ℝ carry badly behaved functions',
      statement: String.raw`Let $E\subset\R$ be non-compact. Then
(a) there is a continuous function on $E$ that is not bounded;
(b) there is a continuous, bounded function on $E$ that has no maximum.
If, in addition, $E$ is bounded, then
(c) there is a continuous function on $E$ that is not uniformly continuous.`,
      idea: String.raw`If $E$ is bounded, it is not closed (Heine–Borel, 2.41), so it has a limit point $x_0\notin E$. Then $f(x)=1/(x-x_0)$ serves for (a) and (c) — it is unbounded near $x_0$, and points of $E$ close to $x_0$ are close to each other while their values are far apart — and $g(x)=1/(1+(x-x_0)^2)$ for (b): $g<1$ on $E$ but $\sup_E g=1$. If $E$ is unbounded, $f(x)=x$ gives (a) and $h(x)=x^2/(1+x^2)$ gives (b). Boundedness is needed in (c): every function on the integers is uniformly continuous.`,
      caption: String.raw`Choose a non-compact $E$ and a part of the theorem. In (a) drag the level $M$: some point of $E$ always rises above it. In (b) drag $p$ and there is always a point with a larger value, and the supremum $1$ (red) is never reached. In (c) drag $p$ toward $x_0$: the gold pair gets arbitrarily close while the values stay at least $1$ apart. For the unbounded sets, (c) is not claimed — and for $E=\N$ it is false.`,
      deps: ['pma-2.41', 'pma-4.13', 'pma-4.18'],
      tags: ['compactness', 'continuity'],
      viz(v) {
        const SETS = {
          half: { label: '$(0,1]$', bounded: true, pts: null, lo: 0, hi: 1 },
          seq: { label: '$\\{1/n\\}$', bounded: true, pts: v.M.range(90, 1).map((n) => 1 / n), lo: 0, hi: 1 },
          ray: { label: '$[0,\\infty)$', bounded: false, pts: null, lo: 0, hi: Infinity },
          nat: { label: '$\\N$', bounded: false, pts: v.M.range(60, 1), lo: 1, hi: Infinity },
        };
        const FN = {
          a: (E) => (E.bounded ? (x) => 1 / x : (x) => x),
          b: (E) => (E.bounded ? (x) => 1 / (1 + x * x) : (x) => (x * x) / (1 + x * x)),
          c: () => (x) => 1 / x,
        };
        const which = v.select('$E=$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'half');
        const part = v.select('part', [{ value: 'a', label: '(a) unbounded' }, { value: 'b', label: '(b) no maximum' }, { value: 'c', label: '(c) not uniformly continuous' }], 'a');
        const S = v.stage({ x: [-0.08, 1.1], y: [-0.6, 6], height: 340, xlabel: 'x' });
        const snapE = (E, x) => {
          if (E.pts) { let best = E.pts[0]; for (const p of E.pts) if (Math.abs(p - x) < Math.abs(best - x)) best = p; return best; }
          return v.M.clamp(x, E.bounded ? 0.004 : 0, E.bounded ? 1 : 1e9);
        };
        const HM = S.handle(-0.04, 4, { color: 'gold', label: 'M', constrain: (x, y) => [S.bounds.x[0] + 0.035 * (S.bounds.x[1] - S.bounds.x[0]), Math.max(0.6, y)] });
        const HP = S.handle(0.5, 0, { color: 'gold', label: 'p', constrain: (x) => { const E = SETS[which.value]; const xe = snapE(E, x); return [xe, FN[part.value](E)(xe)]; } });
        let key = null, state = null;
        v.render(() => {
          const E = SETS[which.value], pt = part.value, f = FN[pt](E);
          const k = which.value + pt;
          if (key !== k) {
            key = k;
            HM.y = E.bounded ? 4 : 6;
            HP.x = E.bounded ? (E.pts ? 1 / 3 : 0.45) : (E.pts ? 4 : 3);
          }
          HM.visible = pt === 'a'; HP.visible = pt !== 'a' && !(pt === 'c' && !E.bounded);
          HP.x = snapE(E, HP.x); HP.y = f(HP.x);
          // window
          const M = HM.y;
          let X = E.bounded ? [-0.08, 1.1] : [-0.6, 14], Y;
          if (pt === 'a') { const top = Math.max(E.bounded ? 6 : 10, M * 1.35); if (!E.bounded) X = [-0.6, Math.max(14, M * 1.4)]; Y = [-0.08 * top, top]; }
          else if (pt === 'b') Y = [-0.12, 1.22];
          else if (E.bounded) { const q = E.pts ? E.pts[E.pts.indexOf(HP.x) + 1] ?? HP.x / 2 : HP.x / 2; const top = Math.max(5, f(q) * 1.3); Y = [-0.08 * top, top]; }
          else Y = [-0.12, 1.2];
          S.setView(X, Y);
          HM.x = X[0] + 0.035 * (X[1] - X[0]);
          // the set E on the axis
          if (E.pts) S.dots(E.pts.filter((x) => x <= X[1]).map((x) => [x, 0]), { color: 'teal', r: 2.6 });
          else S.line(E.lo, 0, Math.min(E.hi, X[1] + 1), 0, { color: 'teal', width: 5, cap: 'butt', alpha: 0.75 });
          if (E.bounded) S.dot(0, 0, { r: 5, color: 'red', hollow: true, width: 2, label: 'x₀ ∉ E', labelPos: 'se' });
          if (!E.pts && !E.bounded) S.dot(0, 0, { r: 4, color: 'teal' });
          if (!E.pts && E.bounded) S.dot(1, 0, { r: 4, color: 'teal' });
          const canC = !(pt === 'c' && !E.bounded);
          // graph over E
          if (canC) {
            if (E.pts) { for (const x of E.pts) if (x <= X[1]) { const y = f(x); S.line(x, 0, x, Math.min(y, Y[1] * 2), { color: 'faint', width: 1 }); } S.dots(E.pts.filter((x) => x <= X[1]).map((x) => [x, Math.min(f(x), Y[1] * 2)]), { color: 'ink', r: 2.8 }); }
            else S.fn(f, { domain: [E.bounded ? 1e-4 : 0, Math.min(E.hi, X[1] + 1)], color: 'ink', width: 2.2, n: 2400 });
          }
          let info = {};
          if (pt === 'a') {
            S.hline(M, { color: 'gold', dash: [6, 4], width: 1.4 });
            let xs;
            if (E.pts) xs = E.bounded ? E.pts.find((x) => f(x) > M) : E.pts.find((x) => x > M);
            else xs = E.bounded ? 1 / (1.25 * M) : 1.25 * M;
            if (xs != null) { S.dot(xs, f(xs), { r: 6, color: 'gold', label: 'f > M', labelPos: E.bounded ? 'e' : 'nw' }); S.line(xs, 0, xs, f(xs), { color: 'gold', dash: [2, 3], width: 1.2 }); }
            info = { M, xs, fx: xs != null ? f(xs) : NaN };
          } else if (pt === 'b') {
            S.hline(1, { color: 'red', dash: [6, 4], width: 1.5 });
            S.text('sup = 1, never attained', X[1], 1, { align: 'right', dy: -10, color: 'red', size: 11.5, weight: 600 });
            let better;
            if (E.pts) better = E.bounded ? E.pts[E.pts.indexOf(HP.x) + 1] : E.pts[E.pts.indexOf(HP.x) + 1];
            else better = E.bounded ? HP.x / 2 : Math.min(13.8, HP.x + Math.max(1, HP.x * 0.5));
            if (better != null) { S.dot(better, f(better), { r: 5.5, color: 'green', label: 'larger', labelPos: E.bounded ? 'ne' : 'se' }); }
            info = { p: HP.x, fp: f(HP.x), q: better, fq: better != null ? f(better) : NaN };
          } else if (canC) {
            const p = HP.x, q = E.pts ? E.pts[E.pts.indexOf(p) + 1] ?? p / 2 : p / 2;
            S.dot(q, f(q), { r: 5.5, color: 'gold', label: 'q', labelPos: 'w' });
            S.measure(q, -0.04 * Y[1], p, -0.04 * Y[1], null, { color: 'orange' });
            S.measure(Math.max(p, q) + 0.03, f(p), Math.max(p, q) + 0.03, f(q), '≥ 1', { color: 'red', math: false, size: 11.5, offset: -16 });
            info = { p, q, dpq: Math.abs(p - q), dfq: Math.abs(f(p) - f(q)) };
          } else {
            S.corner(which.value === 'nat' ? 'every function on ℕ is uniformly continuous (take δ < 1)' : '(c) is only claimed for bounded E', 'tl', { color: 'red', weight: 600 });
          }
          state = { E, pt, info, canC };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { E, pt, info } = s;
          const fname = pt === 'a' ? (E.bounded ? 'f(x)=1/x' : 'f(x)=x') : pt === 'b' ? (E.bounded ? 'g(x)=1/(1+x^2)' : 'h(x)=x^2/(1+x^2)') : 'f(x)=1/x';
          if (pt === 'a') return `$${fname}$ is continuous on $E$, yet $f = ${v.fmt(info.fx, 3)} > M = ${v.fmt(info.M, 3)}$ at $x = ${v.fmt(info.xs, 3)}\\in E$ — and the same happens for every $M$.`;
          if (pt === 'b') return `$${fname}$ satisfies $0 < ${fname.split('=')[0]} < 1$ on $E$: at $p$ it is $${v.fix(info.fp, 4)}$, but the green point gives $${v.fix(info.fq, 4)}$. Its supremum $1$ is approached ${E.bounded ? 'near $x_0=0\\notin E$' : 'as $x\\to\\infty$'} and never attained.`;
          if (!s.canC) return E.pts ? 'On $E=\\N$ any two distinct points are at distance $\\ge 1$, so $\\delta = \\tfrac12$ works for every $\\varepsilon$: no function on $\\N$ fails uniform continuity. That is why (c) assumes $E$ bounded.' : 'For unbounded $E$ the theorem only asserts (a) and (b).';
          return `$|p-q| = ${v.fmt(info.dpq, 3)}$ but $|f(p)-f(q)| = ${v.fmt(info.dfq, 3)} \\ge 1$: no $\\delta$ can serve $\\varepsilon = 1$, so $f(x)=1/x$ is continuous but not uniformly continuous on $E$.`;
        });
      },
    },
    // ------------------------------------------------------------------ continuity and connectedness
    {
      num: '4.22',
      kind: 'Theorem',
      name: 'Continuous images of connected sets are connected',
      statement: String.raw`If $f$ is a continuous map of a metric space $X$ into a metric space $Y$ and $E\subset X$ is connected, then $f(E)$ is connected.`,
      idea: String.raw`Suppose $f(E)=A\cup B$ with $A,B$ nonempty and separated. Put $G=E\cap f^{-1}(A)$ and $H=E\cap f^{-1}(B)$: they are nonempty and $E=G\cup H$. Since $f^{-1}(\overline A)$ is closed (4.8a) and contains $G$, it contains $\overline G$, so $f(\overline G)\subset\overline A$, which misses $B=f(H)$; hence $\overline G\cap H=\emptyset$, and symmetrically $G\cap\overline H=\emptyset$. So $G,H$ separate $E$ — impossible when $E$ is connected (2.45).`,
      caption: String.raw`Left: a set $E$ in the plane, coloured by which side of the cut line its image $f(E)$ lands on ($f(z)=0.55z^2+0.3$). Right: $f(E)$ and the cut line — drag its two ends. For the connected $E$ every line through $f(E)$ meets it (gold), so the two parts $A$, $B$ touch and are never separated; correspondingly $G$ and $H$ touch along the gold curve in $E$. For two disjoint pieces, a line through the gap separates $f(E)$ — possible only because $E$ itself is disconnected.`,
      deps: ['pma-2.45', 'pma-4.8a'],
      tags: ['connectedness', 'continuity'],
      viz(v) {
        const f = (x, y) => [0.55 * (x * x - y * y) + 0.3, 1.1 * x * y];
        const SETS = {
          conn: { label: 'connected $E$', inE: (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x); return r > 0.55 && r < 1.3 && Math.abs(a) < 0.72 * Math.PI; } },
          two: { label: 'two pieces', inE: (x, y) => Math.hypot(x - 0.95, y - 0.8) < 0.38 || Math.hypot(x - 0.95, y + 0.8) < 0.38 },
        };
        const which = v.select('', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'conn');
        const SD = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, height: 330, axes: false, title: '$E\\subset X=\\R^2$: $G$ (blue) and $H$ (red)' });
        const SI = v.stage({ x: [-1.05, 1.65], y: [-1.6, 1.6], equal: true, height: 330, axes: false, title: '$f(E)$: $A$ (blue) and $B$ (red)' });
        const L1 = SI.handle(-0.9, 0.06, { color: 'ink', r: 6 });
        const L2 = SI.handle(1.5, 0.12, { color: 'ink', r: 6 });
        let gridKey = null, grid = [];
        let state = null;
        v.legend([['blue', '$G=E\\cap f^{-1}(A)$ and $A$', { area: true }], ['red', '$H=E\\cap f^{-1}(B)$ and $B$', { area: true }], ['gold', 'points on the cut and their preimages']]);
        v.render(() => {
          const E = SETS[which.value];
          const d = [L2.x - L1.x, L2.y - L1.y];
          const side = (w) => d[0] * (w[1] - L1.y) - d[1] * (w[0] - L1.x);
          const cb = v.rgb('blue'), cr = v.rgb('red');
          SD.raster((x, y) => { if (!E.inE(x, y)) return null; const c = side(f(x, y)) > 0 ? cb : cr; return [c[0], c[1], c[2], 120]; }, { key: `${which.value}|${L1.x},${L1.y},${L2.x},${L2.y}|${cb}|${cr}`, res: 1 });
          SD.dot(0, 0, { r: 2.5, color: 'muted' });
          // interface: points of E whose image lies on the cut
          const segs = zeroSegments((x, y) => (E.inE(x, y) ? side(f(x, y)) : NaN), [-1.45, 1.45], [-1.45, 1.45], 160, 160);
          const path = []; for (const [p, q] of segs) path.push(p, q, null);
          SD.path(path, { color: 'gold', width: 2.6 });
          // image as a cloud of points
          if (gridKey !== which.value) { gridKey = which.value; grid = []; for (let i = 0; i <= 120; i++) for (let j = 0; j <= 120; j++) { const x = -1.45 + (2.9 * i) / 120, y = -1.45 + (2.9 * j) / 120; if (E.inE(x, y)) grid.push(f(x, y)); } }
          const A = [], B = [];
          for (const w of grid) (side(w) > 0 ? A : B).push(w);
          SI.dots(A, { color: 'blue', r: 1.7, alpha: 0.55 }); SI.dots(B, { color: 'red', r: 1.7, alpha: 0.55 });
          const ipath = []; for (const [p, q] of segs) ipath.push(f(...p), f(...q), null);
          SI.path(ipath, { color: 'gold', width: 3 });
          const L = 6, n = Math.hypot(...d) || 1, u = [d[0] / n, d[1] / n];
          SI.line(L1.x - u[0] * L, L1.y - u[1] * L, L1.x + u[0] * L, L1.y + u[1] * L, { color: 'ink', width: 1.4, dash: [6, 4] });
          const meets = segs.length > 0, oneSide = A.length === 0 || B.length === 0;
          const msg = meets ? 'the cut meets f(E): A and B touch' : oneSide ? 'the cut misses f(E): one part is empty' : 'A and B are separated';
          SI.corner(msg, 'tl', { color: meets || oneSide ? 'muted' : 'red', weight: 600 });
          state = { meets, oneSide, conn: which.value === 'conn' };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          if (s.meets) return 'The cut line passes through $f(E)$: the gold points of $f(E)$ lie on it, so $\\overline A\\cap B\\neq\\emptyset$ (or $A\\cap\\overline B\\ne\\emptyset$) and $A$, $B$ do not separate $f(E)$. On the left, $G$ and $H$ touch along the gold preimage.' + (s.conn ? ' Wherever you put the line, this keeps happening: $f(E)$ is connected.' : '');
          if (s.oneSide) return 'The line misses $f(E)$ entirely, so one of $A$, $B$ is empty — not a separation.';
          return 'The line runs through a gap of $f(E)$: $A$ and $B$ are nonempty and separated, and so are $G$ and $H$ — the two pieces of $E$. This is possible only because $E$ is not connected.';
        });
      },
    },
    {
      num: '4.23',
      kind: 'Theorem',
      name: 'Intermediate value theorem',
      statement: String.raw`Let $f$ be a continuous real function on $[a,b]$. If $f(a)<f(b)$ and $f(a)<c<f(b)$, then $f(x)=c$ for some $x\in(a,b)$. (A similar statement holds if $f(a)>f(b)$.)`,
      idea: String.raw`The interval $[a,b]$ is connected (2.47), so $f([a,b])$ is a connected subset of $\R$ by 4.22, hence an interval (2.47 again); it contains $f(a)$ and $f(b)$, so it contains $c$. Concretely: if $c$ were not attained, $\{f<c\}$ and $\{f>c\}$ would be disjoint, relatively open, nonempty sets splitting $[a,b]$ — a separation of a connected set.`,
      caption: String.raw`Drag the level $c$. The axis is coloured by the two sets $\{f<c\}$ (blue) and $\{f>c\}$ (purple); wherever they meet there is a solution of $f(x)=c$ (green). The bar on the left is the image $f([a,b])$ — an interval. Switch on the jump: the image acquires a gap (red), and a level $c$ inside it is never attained even though $f(a)<c<f(b)$.`,
      deps: ['pma-4.22', 'pma-2.47'],
      see: ['pma-5.12'],
      tags: ['connectedness', 'intermediate values'],
      viz(v) {
        const f0 = (x) => 0.2 + 0.6 * x + 0.7 * Math.sin(2.2 * x);
        const XJ = 2, J = 1.0, a = 0, b = 4;
        const jump = v.toggle('jump at $x=2$', false);
        const F = (x) => f0(x) + (jump.value && x > XJ ? J : 0);
        const S = v.stage({ x: [-0.75, 4.2], y: [-0.55, 4.3], height: 360, xlabel: 'x' });
        const C = S.handle(-0.42, 1.2, { color: 'green', label: 'c', constrain: (x, y) => [-0.42, v.M.clamp(y, -0.3, 4.1)] });
        let state = null;
        v.legend([['blue', '$\\{x: f(x)<c\\}$'], ['purple', '$\\{x: f(x)>c\\}$'], ['green', 'solutions of $f(x)=c$', { dot: true }], ['ink', 'image $f([a,b])$']]);
        v.render(() => {
          const c = C.y, J0 = jump.value;
          // image of [a,b] as intervals
          const parts = J0 ? [[a, XJ, false, false], [XJ, b, true, false]] : [[a, b, false, false]];
          const img = parts.map(([l, r, lo]) => { let mn = Infinity, mx = -Infinity, mnOpen = false; for (let i = 0; i <= 1600; i++) { const x = l + ((r - l) * i) / 1600, xe = i === 0 && lo ? l + 1e-12 : x; const y = F(xe); if (y < mn) { mn = y; mnOpen = i === 0 && lo; } if (y > mx) mx = y; } return [mn, mx, mnOpen]; }).sort((p, q) => p[0] - q[0]);
          const merged = [];
          for (const iv of img) { const last = merged[merged.length - 1]; if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]); else merged.push(iv.slice()); }
          const xb = -0.2;
          for (const [lo, hi, lo_o] of merged) { S.line(xb, lo, xb, hi, { color: 'ink', width: 5, cap: 'butt' }); S.dot(xb, lo, { r: 3.4, color: 'ink', hollow: lo_o }); S.dot(xb, hi, { r: 3.4, color: 'ink' }); }
          for (let i = 0; i + 1 < merged.length; i++) S.line(xb, merged[i][1], xb, merged[i + 1][0], { color: 'red', width: 5, cap: 'butt' });
          const inGap = merged.some((iv, i) => i + 1 < merged.length && c > iv[1] && c < merged[i + 1][0]);
          S.hline(c, { color: 'green', dash: [6, 4], width: 1.3 });
          // the two sets on the axis
          for (const [l, r] of runs((x) => F(x) < c, a, b, 1600)) S.line(l, 0, r, 0, { color: 'blue', width: 6, cap: 'butt', alpha: 0.8 });
          for (const [l, r] of runs((x) => F(x) > c, a, b, 1600)) S.line(l, 0, r, 0, { color: 'purple', width: 6, cap: 'butt', alpha: 0.8 });
          // graph
          pieces(S, F, a, b, J0 ? [XJ] : [], { color: 'ink', width: 2.3 });
          if (J0) { S.dot(XJ, f0(XJ), { r: 4, color: 'ink' }); S.dot(XJ, f0(XJ) + J, { r: 4, color: 'ink', hollow: true }); }
          S.dot(a, F(a), { r: 4, color: 'ink', label: 'f(a)', labelPos: 'nw' }); S.dot(b, F(b), { r: 4, color: 'ink', label: 'f(b)', labelPos: 'ne' });
          // solutions
          const sols = [];
          const xs = v.M.linspace(a, b, 2001);
          for (let i = 1; i < xs.length; i++) {
            const u = F(xs[i - 1]) - c, w = F(xs[i]) - c;
            if (u === 0) sols.push(xs[i - 1]);
            else if (u * w < 0) { const r = v.M.bisect((x) => F(x) - c, xs[i - 1], xs[i]); if (Math.abs(F(r) - c) < 1e-6) sols.push(r); }
          }
          for (const x of sols) { S.line(x, 0, x, c, { color: 'green', width: 1.2, dash: [2, 3] }); S.dot(x, c, { r: 5, color: 'green' }); S.dot(x, 0, { r: 4, color: 'green' }); }
          const hyp = F(a) < c && c < F(b);
          state = { c, sols, inGap, hyp, fa: F(a), fb: F(b) };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const h = s.hyp ? `$f(a) = ${v.fix(s.fa, 2)} < c = ${v.fix(s.c, 2)} < f(b) = ${v.fix(s.fb, 2)}$` : `$c = ${v.fix(s.c, 2)}$ is not between $f(a)$ and $f(b)$`;
          if (s.sols.length) return `${h}: ${s.sols.length} solution${s.sols.length > 1 ? 's' : ''} of $f(x)=c$, at $x = ${s.sols.map((x) => v.fix(x, 3)).join(',\\,')}$ — the points where $\\{f<c\\}$ and $\\{f>c\\}$ meet.`;
          if (s.inGap) return `${h}, yet $c$ lies in the gap of $f([a,b])$: no solution. The jump lets $\\{f<c\\}=[a,2]$ and $\\{f>c\\}=(2,b]$ split the interval without a point in between — exactly what continuity forbids.`;
          return `${h}: no solution, and the theorem does not promise one.`;
        });
      },
    },
    // ------------------------------------------------------------------ discontinuities
    {
      num: '4.25',
      kind: 'Definition',
      name: 'One-sided limits',
      statement: String.raw`Let $f$ be defined on $(a,b)$. If $f$ is not continuous at a point $x$ of its domain, $f$ is *discontinuous* at $x$ (has a *discontinuity* there). For $a\le x<b$ we write $f(x+)=q$ if $f(t_n)\to q$ for every sequence $\{t_n\}$ in $(x,b)$ with $t_n\to x$; for $a<x\le b$, $f(x-)=q$ is defined in the same way with sequences in $(a,x)$.

For $a<x<b$, $\lim_{t\to x}f(t)$ exists if and only if $f(x+)=f(x-)$, and then all three coincide.`,
      idea: String.raw`These are the limits of 4.1 for the restrictions of $f$ to $(x,b)$ and to $(a,x)$, phrased through sequences as in 4.2. A two-sided limit exists exactly when both one-sided limits exist and agree, because a sequence approaching $x$ from both sides splits into a left and a right subsequence.`,
      deps: ['pma-4.1', 'pma-4.2'],
      tags: ['limits', 'discontinuities'],
    },
    {
      num: '4.26',
      kind: 'Definition',
      name: 'Discontinuities of the first and second kind',
      statement: String.raw`Let $f$ be defined on $(a,b)$ and discontinuous at $x$. If both $f(x+)$ and $f(x-)$ exist, the discontinuity is of the *first kind*, or *simple*; otherwise it is of the *second kind*.

A simple discontinuity occurs in one of two ways: either $f(x+)\neq f(x-)$ (and then the value $f(x)$ is irrelevant), or $f(x+)=f(x-)\neq f(x)$.`,
      idea: String.raw`The classification asks whether $f$ settles down on each side of $x$. A convenient test is the oscillation $\sup-\inf$ of $f$ over $(x-h,x)$ and over $(x,h+x)$: a one-sided limit exists exactly when the corresponding oscillation tends to $0$ as $h\to0$ (a Cauchy-criterion argument, using completeness of $\R$ as in 3.11). Rudin's examples 4.27 include the Dirichlet function, discontinuous of the second kind everywhere, and $\sin(1/x)$ at $0$.`,
      caption: String.raw`Pick a function and shrink $h$. The blue and purple boxes span $\inf$ to $\sup$ of $f$ over $(-h,0)$ and $(0,h)$; the lower panel tracks their heights as $h$ decreases (right to left). A one-sided limit exists exactly when its box flattens to a point: jumps and removable discontinuities are of the first kind, while $\sin(1/x)$ and the Dirichlet function keep a box of height $2$ or $1$ forever.`,
      deps: ['pma-4.25', 'pma-4.5'],
      see: ['pma-5.12a'],
      tags: ['discontinuities'],
      viz(v) {
        const EX = {
          jump: { label: 'jump', f: (x) => (x < 0 ? 0.5 + 0.5 * x + 0.3 * Math.sin(6 * x) : x > 0 ? 1.4 + 0.3 * x - 0.3 * Math.sin(5 * x) : 0.9), at0: 0.9, Lm: 0.5, Lp: 1.4, br: [0] },
          remov: { label: 'removable', f: (x) => (x === 0 ? 0.35 : 1 + 0.5 * Math.sin(3 * x)), at0: 0.35, Lm: 1, Lp: 1, br: [0] },
          half: { label: 'one side wild', f: (x) => (x < 0 ? 0.6 - 0.3 * x : x > 0 ? Math.sin(1 / x) : 0.6), at0: 0.6, Lm: 0.6, Lp: null, br: [0], wild: [false, true] },
          wild: { label: '$\\sin(1/x)$', f: (x) => (x === 0 ? 0 : Math.sin(1 / x)), at0: 0, Lm: null, Lp: null, br: [0], wild: [true, true] },
          dir: { label: 'Dirichlet', f: null, at0: 1, Lm: null, Lp: null, dir: true },
        };
        const which = v.select('', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'jump');
        const hS = v.slider('$h$', 0.002, 1, 0.35, { log: true, fmt: (x) => v.fmt(x, 3) });
        const S = v.stage({ x: [-1, 1], y: [-1.45, 2.15], height: 300, full: true, xlabel: 'x' });
        const B = v.stage({ x: [-2.75, 0.1], y: [0, 2.25], height: 165, full: true, axes: 'box', title: 'height of each box ($\\sup-\\inf$) against $h$, log scale', xticks: [[-2.699, '0.002'], [-2, '0.01'], [-1, '0.1'], [0, '1']] });
        function box(E, side, h) {
          if (E.dir) return [0, 1];
          if (E.wild && E.wild[side > 0 ? 1 : 0]) return [-1, 1];
          let lo = Infinity, hi = -Infinity;
          for (let i = 1; i <= 400; i++) { const x = (side * h * i) / 400; const y = E.f(x); if (y < lo) lo = y; if (y > hi) hi = y; }
          return [lo, hi];
        }
        let cacheKey = null, curves = null, state = null;
        v.legend([['blue', 'box over $(-h,0)$', { area: true }], ['purple', 'box over $(0,h)$', { area: true }], ['ink', '$f$; dot = $f(0)$, rings = one-sided limits']]);
        v.render(() => {
          const E = EX[which.value], h = hS.value;
          if (cacheKey !== which.value) {
            cacheKey = which.value;
            const ls = v.M.linspace(-2.75, 0, 140);
            curves = [-1, 1].map((sd) => ls.map((l) => { const [lo, hi] = box(E, sd, 10 ** l); return [l, hi - lo]; }));
          }
          const bl = box(E, -1, h), br = box(E, 1, h);
          S.rect(-h, bl[0], 0, bl[1], { fill: 'blue', fillAlpha: 0.15, color: 'blue', width: 1.4 });
          S.rect(0, br[0], h, br[1], { fill: 'purple', fillAlpha: 0.15, color: 'purple', width: 1.4 });
          if (E.dir) {
            S.line(-1, 1, 1, 1, { color: 'ink', width: 2.2, dash: [1.5, 3.5] });
            S.line(-1, 0, 1, 0, { color: 'ink', width: 2.2, dash: [1.5, 3.5] });
            S.text('f = 1 on ℚ', -0.98, 1, { dy: -11, color: 'ink', size: 11.5 });
            S.text('f = 0 off ℚ', -0.98, 0, { dy: 12, color: 'ink', size: 11.5 });
          } else {
            pieces(S, E.f, -1, 1, E.br, { color: 'ink', width: E.wild ? 1.4 : 2.3, n: E.wild ? 6000 : undefined });
            if (E.Lm != null && E.Lm !== E.at0) S.dot(0, E.Lm, { r: 5, hollow: true, color: 'blue', width: 2.2 });
            if (E.Lp != null && E.Lp !== E.at0 && E.Lp !== E.Lm) S.dot(0, E.Lp, { r: 5, hollow: true, color: 'purple', width: 2.2 });
            if (E.Lp != null && E.Lp === E.Lm && E.Lp !== E.at0) S.dot(0, E.Lp, { r: 5, hollow: true, color: 'ink', width: 2.2 });
          }
          S.dot(0, E.at0, { r: 4.5, color: 'ink' });
          const first = E.Lm != null && E.Lp != null;
          S.corner(first ? (E.Lm !== E.Lp ? 'first kind: f(0−) ≠ f(0+)' : 'first kind: f(0−) = f(0+) ≠ f(0)') : 'second kind', 'tl', { color: first ? 'green' : 'red', weight: 600 });
          // lower panel
          B.path(curves[0], { color: 'blue', width: 2.2 });
          B.path(curves[1], { color: 'purple', width: 2.2, dash: curves[0].every((p, i) => Math.abs(p[1] - curves[1][i][1]) < 1e-9) ? [6, 5] : null });
          const l = Math.log10(h);
          B.vline(l, { color: 'gold', dash: [3, 3], width: 1.3 });
          B.dot(l, bl[1] - bl[0], { r: 4.5, color: 'blue' }); B.dot(l, br[1] - br[0], { r: 4.5, color: 'purple' });
          state = { E, bl, br, h, first };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const { E } = s, om = (bx) => v.fix(bx[1] - bx[0], 3);
          const lim = (L) => (L == null ? '\\text{does not exist}' : v.fix(L, 2));
          return `On $(-h,0)$ the oscillation is $${om(s.bl)}$, on $(0,h)$ it is $${om(s.br)}$. $f(0-)$ ${E.Lm == null ? 'does not exist' : `$= ${lim(E.Lm)}$`}, $f(0+)$ ${E.Lp == null ? 'does not exist' : `$= ${lim(E.Lp)}$`}, $f(0) = ${v.fix(E.at0, 2)}$` + (s.first ? ' — a simple discontinuity.' : ' — a discontinuity of the second kind.') + (E.dir ? ' (The same happens at every point: Rudin\'s Example 4.27(a).)' : '');
        });
      },
    },
  ],
};
