// Rudin, Principles of Mathematical Analysis — Chapter 2: Basic Topology (part b1: compact sets, 2.31–2.37)

// ---------------------------------------------------------------- shared helpers
/** Sample a region given by inside(x,y) on a grid of spacing h inside the box [x0,x1]×[y0,y1]. */
function gridSample(inside, [x0, x1], [y0, y1], h) {
  const pts = [];
  for (let x = x0 + h / 2; x < x1; x += h) for (let y = y0 + h / 2; y < y1; y += h) if (inside(x, y)) pts.push([x, y]);
  return pts;
}

/**
 * Greedy finite subcover of a sampled set by balls B(q, rad(q)) centred at sample points.
 * Points are visited in the order given; a ball is added at every point not yet covered.
 * `slack` shrinks the radius used for the covering test so that the balls also cover the
 * continuum between neighbouring sample points.
 */
function greedyBalls(pts, rad, slack = 0) {
  const covered = new Uint8Array(pts.length); const centres = [];
  for (let i = 0; i < pts.length; i++) {
    if (covered[i]) continue;
    const q = pts[i], r = rad(q); centres.push({ q, r });
    covered[i] = 1;
    const rr = Math.max(0, r - slack);
    for (let j = 0; j < pts.length; j++) if (!covered[j] && Math.hypot(pts[j][0] - q[0], pts[j][1] - q[1]) < rr) covered[j] = 1;
  }
  return centres;
}

/** A number as TeX: plain decimals when moderate, a×10^k otherwise. */
function sci(x, d = 3) {
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const e = Math.floor(Math.log10(a)), m = x / 10 ** e;
  return `${Number(m.toPrecision(d))}\\times10^{${e}}`;
}

/** Draw an open (hollow ends) or closed bar [a,b] at height y; ends outside the view are left plain. */
function bar(s, a, b, y, st = {}) {
  const [x0, x1] = s.bounds.x; const col = st.color || 'orange';
  const A = Math.max(a, x0 - 1), B = Math.min(b, x1 + 1);
  if (!(B > A)) return;
  s.line(A, y, B, y, { color: col, width: st.width ?? 4.5, cap: 'butt', alpha: st.alpha });
  const [lo, ro] = st.open || [true, true];
  if (a >= x0 && st.ends !== false) s.dot(a, y, { color: col, hollow: lo, r: st.r ?? 3.6, alpha: st.alpha });
  if (b <= x1 && st.ends !== false) s.dot(b, y, { color: col, hollow: ro, r: st.r ?? 3.6, alpha: st.alpha });
}

/** Runs of consecutive sample indices where pred holds → list of [x_start, x_end] (refined by bisection). */
function runs(f, pred, a, b, n = 1600) {
  const out = []; let start = null; const h = (b - a) / n;
  const edge = (u, w) => { let lo = u, hi = w; const pu = pred(f(u)); for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (pred(f(m)) === pu) lo = m; else hi = m; } return (lo + hi) / 2; };
  for (let i = 0; i <= n; i++) {
    const x = a + i * h, ok = pred(f(x));
    if (ok && start === null) start = i === 0 ? a : edge(x - h, x);
    if (!ok && start !== null) { out.push([start, edge(x - h, x)]); start = null; }
  }
  if (start !== null) out.push([start, b]);
  return out;
}

export default {
  collection: 'pma',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.31
    {
      num: '2.31',
      kind: 'Definition',
      name: 'Open cover',
      statement: String.raw`Let $E$ be a subset of a metric space $X$. An **open cover** of $E$ is a family $\{G_\alpha\}$ of open subsets of $X$ whose union contains $E$: $E\subset\bigcup_\alpha G_\alpha$. A **subcover** is a subfamily whose union still contains $E$.`,
      idea: String.raw`The family may be finite, countable or uncountable, and its members are open in the ambient space $X$. The typical example assigns to every point $x\in E$ a neighbourhood $N_{r(x)}(x)$; this is how covers arise in almost every proof that follows.`,
      deps: ['pma-2.18'],
      tags: ['compactness', 'open cover'],
    },

    // ------------------------------------------------------------------ 2.32
    {
      num: '2.32',
      kind: 'Definition',
      name: 'Compact set',
      statement: String.raw`A subset $K$ of a metric space $X$ is **compact** if every open cover of $K$ contains a finite subcover: whenever $\{G_\alpha\}$ is a family of open sets with $K\subset\bigcup_\alpha G_\alpha$, there are finitely many indices $\alpha_1,\dots,\alpha_n$ with
$$K\subset G_{\alpha_1}\cup\dots\cup G_{\alpha_n}.$$`,
      idea: String.raw`Every finite set is compact, and compactness is what lets "one neighbourhood per point" be traded for "finitely many neighbourhoods", the step behind uniform continuity (4.19) and the extreme value theorem (4.16). The cover $\{(x/2,\,3x/2): 0<x\le 1\}$ of $(0,1]$ shows how it fails: the neighbourhoods shrink as $x\to0$, and finitely many of them always leave a gap $(0,\min_k x_k/2]$.`,
      caption: String.raw`Each $x\in K$ carries the open interval $U_x=(x-r(x),\,x+r(x))$. Green bars are members picked one at a time, each containing the leftmost point not yet covered. On $[0,1]$ the radius at $0$ is $r_0/2>0$ and the chain stops after finitely many sets; on $(0,1]$ the radii are $x/2$ and the red gap at $0$ never closes. The lower panel follows the chain towards $0$ on a logarithmic axis.`,
      deps: ['pma-2.31'],
      see: ['rca-2.3', 'pma-4.14'],
      tags: ['compactness', 'open cover'],
      viz(v) {
        const which = v.select('', [{ value: 'closed', label: '$K=[0,1]$, $\\;r(x)=\\tfrac12(x+r_0)$' }, { value: 'half', label: '$K=(0,1]$, $\\;r(x)=\\tfrac12 x$' }], 'closed');
        const rho = v.slider('$r_0$', 0.0005, 0.3, 0.01, { log: true, fmt: (x) => v.fmt(x, 2) });
        const nMax = v.slider('sets picked $N$', 1, 14, 14, { int: true });
        const XR = [-0.08, 1.24];
        const top = v.stage({ x: XR, y: [-1.6, 8], height: 290, axes: false, full: true, title: 'the chosen sets $U_{x_1}, U_{x_2},\\dots$ (row $k$ = $k$-th pick)' });
        const LOG0 = -7;
        const bot = v.stage({ x: [LOG0 - 0.35, 0.3], y: [-1.6, 8], height: 210, axes: false, full: true, title: 'the same chain against $\\log_{10} x$, zooming in on $0$' });

        function chain(closed, r0, N) {
          const r = closed ? (x) => (x + r0) / 2 : (x) => x / 2;
          const picks = []; let cur = 1, done = false;
          for (let k = 0; k < N; k++) {
            // choose x so that the uncovered point `cur` sits 30% of a radius to the right of x
            let x = closed ? (cur - 0.3 * r0) / 1.3 : cur / 1.3;
            if (closed && (x <= 0 || cur < r0 / 2)) x = 0;
            const lo = x - r(x), hi = x + r(x);
            picks.push({ x, lo, hi });
            cur = lo;
            if (lo < 0) { done = true; break; }
          }
          return { picks, cur, done };
        }
        let st = null;
        v.render(() => {
          const closed = which.value === 'closed';
          const C = chain(closed, rho.value, nMax.value);
          st = { ...C, closed };
          const rows = C.picks.length, ytop = Math.max(5, rows) + 1;
          top.setView(null, [-1.7, ytop]); bot.setView(null, [-1.7, ytop + 1]);
          // ---- linear panel
          top.line(XR[0], 0, XR[1], 0, { color: 'faint', width: 1 });
          for (const t of [0, 0.25, 0.5, 0.75, 1]) { top.line(t, 0, t, -0.35, { color: 'muted', width: 1 }); top.text(String(t), t, -1.05, { color: 'muted', align: 'center', size: 11 }); }
          C.picks.forEach((P, k) => {
            const y = k + 1;
            top.line(P.x, y, P.x, 0, { color: 'ink', width: 0.8, alpha: 0.16 });
            bar(top, P.lo, P.hi, y, { color: 'green' });
            top.dot(P.x, y, { color: 'ink', r: 2.6 });
          });
          top.interval(0, 1, 0, { color: 'accent', width: 6, open: [!closed, false] });
          if (!C.done) { top.line(0, 0, C.cur, 0, { color: 'red', width: 6, cap: 'butt' }); top.dot(C.cur, 0, { color: 'red', r: 4 }); }
          top.tex('K', 1.1, -1.05, { color: 'accent', align: 'left' });
          top.corner(C.done ? `finite subcover: ${rows} sets` : closed ? `${rows} sets so far — keep picking` : `${rows} sets — a gap at 0 is left`, 'tr', { color: C.done ? 'green' : 'red', weight: 600 });
          // ---- log panel
          const L = (x) => (x > 0 ? Math.log10(x) : -Infinity);
          bot.line(LOG0 - 0.35, 0, 0.3, 0, { color: 'faint', width: 1 });
          for (let e = LOG0; e <= 0; e++) { bot.line(e, 0, e, -0.35, { color: 'muted', width: 1 }); bot.tex(e === 0 ? '1' : `10^{${e}}`, e, -1.05, { color: 'muted', size: 11 }); }
          C.picks.forEach((P, k) => {
            const y = k + 1, a = L(P.lo), b = L(P.hi);
            if (a > LOG0 - 0.35) bar(bot, a, b, y, { color: 'green' });
            else { bar(bot, LOG0 - 0.2, b, y, { color: 'green', open: [false, true], ends: true, r: 0.01 }); bot.arrow(LOG0 - 0.1, y, LOG0 - 0.33, y, { color: 'green', head: 8, width: 2.5 }); }
            if (P.x > 0) bot.dot(L(P.x), y, { color: 'ink', r: 2.6 });
          });
          bot.line(LOG0 - 0.35, 0, 0, 0, { color: 'accent', width: 6, cap: 'butt' });
          bot.dot(0, 0, { color: 'accent', r: 4.5 });
          if (!C.done) bot.line(LOG0 - 0.35, 0, L(C.cur), 0, { color: 'red', width: 6, cap: 'butt' });
          bot.corner(closed ? '← 0 ∈ K lies at −∞ on this axis' : '← 0 ∉ K: the chain marches left for ever', 'tl', { color: closed ? 'accent' : 'red' });
          v.legend([['accent', '$K$'], ['green', 'chosen open sets $U_{x_k}$ (hollow ends: open)'], ['ink', 'centre $x_k$', { dot: true }], ['red', 'not yet covered']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const n = s.picks.length;
          if (s.closed) return s.done
            ? `$U_{x_1},\\dots,U_{x_{${n}}}$ cover $[0,1]$ — a finite subcover with $${n}$ sets; the last one is $U_0=(-${sci(rho.value / 2)},\\,${sci(rho.value / 2)})$. Shrinking $r_0$ lengthens the chain, but it always ends.`
            : `After $${n}$ sets, $[0,\\,${sci(s.cur)}]$ is still uncovered — raise $N$.`;
          const mx = Math.min(...s.picks.map((P) => P.x));
          return `Every $U_x=(x/2,\\,3x/2)$ misses $(0,\\,x/2]$, so any $${n}$ of them miss $(0,\\,\\min_k x_k/2] = (0,\\,${sci(mx / 2)}]$: this cover of $(0,1]$ has **no** finite subcover.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.33
    {
      num: '2.33',
      kind: 'Theorem',
      name: 'Compactness does not depend on the ambient space',
      statement: String.raw`Suppose $K\subset Y\subset X$, where $X$ is a metric space and $Y$ carries the restricted metric. Then $K$ is compact relative to $X$ if and only if $K$ is compact relative to $Y$.`,
      idea: String.raw`By 2.30 the sets open relative to $Y$ are exactly the traces $V=Y\cap G$ of sets $G$ open in $X$. A cover of $K$ by relatively open $V_\alpha$ therefore comes from a cover by open $G_\alpha$ and vice versa, and since $K\subset Y$, finitely many $V_{\alpha_i}$ cover $K$ exactly when the corresponding $G_{\alpha_i}$ do. Openness depends on the ambient space; compactness does not.`,
      caption: String.raw`$X$ is the plane and $Y$ the unit circle; drag the ends of the closed arc $K$. Orange discs $G_i$ are open in $X$; their traces $V_i=Y\cap G_i$ (thick arcs, drawn just outside $Y$ for visibility) are open in $Y$ but not in $X$. Slide $d$: the discs change completely while the arcs, and the finite subcover they form, stay the same.`,
      deps: ['pma-2.30', 'pma-2.32'],
      tags: ['compactness', 'relative topology'],
      viz(v) {
        const M = v.M, TAU = M.TAU;
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.75, 1.75], equal: true, height: 400, axes: false });
        const w = v.slider('half-width of each arc $V_i$', 0.15, 0.7, 0.36, { step: 0.01 });
        const dd = v.slider('centre distance $d$ of the discs $G_i$', 0.2, 2.2, 1.25, { step: 0.01 });
        const onCircle = (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; };
        const h0 = S.handle(Math.cos(-2.2), Math.sin(-2.2), { color: 'accent', constrain: onCircle });
        const h1 = S.handle(Math.cos(1.1), Math.sin(1.1), { color: 'accent', constrain: onCircle });
        let st = null;
        v.render(() => {
          const t0 = Math.atan2(h0.y, h0.x);
          let span = M.mod(Math.atan2(h1.y, h1.x) - t0, TAU); if (span < 0.05) span = 0.05;
          const W = w.value, d = dd.value;
          // greedy chain of arcs (φ − W, φ + W) along K, first one containing t0
          const phis = []; let cur = t0;
          while (true) { const phi = cur + 0.6 * W; phis.push(phi); cur = phi + W; if (cur >= t0 + span || phis.length > 60) break; }
          const R = Math.sqrt(1 + d * d - 2 * d * Math.cos(W));
          const cols = ['orange', 'gold'];
          // discs G_i
          phis.forEach((phi, i) => { const c = [d * Math.cos(phi), d * Math.sin(phi)]; S.circle(c[0], c[1], R, { fill: cols[i % 2], fillAlpha: 0.07, color: cols[i % 2], width: 1.2, alpha: 0.75 }); });
          // the space Y
          S.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          // K
          S.curve((t) => [Math.cos(t), Math.sin(t)], t0, t0 + span, { color: 'accent', width: 6 });
          // traces V_i, offset radially for visibility
          phis.forEach((phi, i) => {
            const rr = 1 + (i % 2 ? 0.17 : 0.1);
            S.curve((t) => [rr * Math.cos(t), rr * Math.sin(t)], phi - W, phi + W, { color: cols[i % 2], width: 4, cap: 'butt' });
            for (const e of [phi - W, phi + W]) S.dot(rr * Math.cos(e), rr * Math.sin(e), { color: cols[i % 2], hollow: true, r: 3 });
            const lab = 1 + (i % 2 ? 0.33 : 0.27);
            if (phis.length <= 14) S.tex(`V_{${i + 1}}`, lab * Math.cos(phi), lab * Math.sin(phi), { color: cols[i % 2] === 'gold' ? 'gold' : 'orange', size: 12 });
          });
          // one disc labelled
          const c0 = [d * Math.cos(phis[0]), d * Math.sin(phis[0])], gl = d + R + 0.12;
          S.dot(c0[0], c0[1], { color: 'orange', r: 3 });
          S.tex('G_1', gl * Math.cos(phis[0]), gl * Math.sin(phis[0]), { color: 'orange', size: 14 });
          S.tex('Y', -0.72, -0.5, { color: 'ink', size: 17 });
          S.tex('K', 0.78 * Math.cos(t0 + span / 2), 0.78 * Math.sin(t0 + span / 2), { color: 'accent', size: 18 });
          S.corner('X = ℝ²', 'tl', { color: 'muted' });
          st = { n: phis.length, R, d };
        });
        v.legend([['ink', '$Y$ = unit circle'], ['accent', '$K$ (closed arc)'], ['orange', 'open discs $G_i\\subset X$', { area: true }], ['gold', 'traces $V_i = Y\\cap G_i$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$n=${s.n}$ arcs $V_i$ cover $K$ in $Y$, and the same $${s.n}$ discs $G_i$ (radius $${v.fix(s.R, 3)}$) cover $K$ in $X$. Changing $d$ changes every $G_i$ but no $V_i$ — the finite subcover is the same list of indices.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.34
    {
      num: '2.34',
      kind: 'Theorem',
      name: 'Compact subsets of metric spaces are closed',
      statement: String.raw`If $K$ is a compact subset of a metric space $X$, then $K$ is closed in $X$.`,
      idea: String.raw`Show that $K^c$ is open. Fix $p\notin K$. For each $q\in K$ the neighbourhoods $W_q$ of $q$ and $V_q$ of $p$ of radius $\tfrac12 d(p,q)$ are disjoint. The $W_q$ cover $K$, so finitely many $W_{q_1},\dots,W_{q_n}$ do; then $V=V_{q_1}\cap\dots\cap V_{q_n}$ is a neighbourhood of $p$ (the smallest of finitely many radii is positive) that misses every $W_{q_i}$, hence misses $K$. So $p$ is an interior point of $K^c$, and $K$ is closed by 2.23.`,
      caption: String.raw`Drag $p$ anywhere off $K$. Orange: finitely many balls $W_{q_i}$ of radius $\tfrac12 d(p,q_i)$ that cover $K$, picked greedily from the cover $\{W_q\}_{q\in K}$. Dashed purple circles: the smallest of the matching balls $V_{q_i}$ about $p$. Their intersection is the green ball $V$, whose radius is the smallest of finitely many positive numbers — and $V$ never touches $K$.`,
      deps: ['pma-2.32', 'pma-2.19', 'pma-2.23'],
      see: ['rca-2.5'],
      tags: ['compactness', 'closed sets'],
      viz(v) {
        const M = v.M;
        const blob = M.blob(0.1, 0, 1.15, 7, 0.32);
        const SH = {
          ring: { label: 'annulus', p0: [0.32, 0.12], inside: (x, y) => { const r = Math.hypot(x - 0.2, y); return r >= 0.6 && r <= 1.35; }, box: [[-1.2, 1.6], [-1.4, 1.4]] },
          blob: { label: 'blob', p0: [-1.75, 0.95], inside: (x, y) => M.pointInPoly([x, y], blob), box: [[-1.6, 1.8], [-1.6, 1.6]] },
          three: {
            label: 'three pieces', p0: [0.3, -0.62],
            inside: (x, y) => Math.hypot(x + 1.2, y - 0.55) <= 0.5 || (x >= 0.6 && x <= 1.6 && y >= -1.15 && y <= -0.35) || (y >= -0.2 && y <= 1.2 - 2.15 * Math.abs(x + 0.1)),
            box: [[-1.75, 1.6], [-1.2, 1.3]],
          },
        };
        const shape = v.select('$K$', Object.entries(SH).map(([value, o]) => ({ value, label: o.label })), 'ring', { onChange: (k) => p.set(...SH[k].p0) });
        const S = v.stage({ x: [-2.5, 2.5], y: [-1.65, 1.65], equal: true, height: 400, axes: false });
        const p = S.handle(0.32, 0.12, { color: 'purple', label: 'p' });
        const H = 0.035;
        const cache = {};
        const samplesOf = (key) => cache[key] ||= gridSample(SH[key].inside, ...SH[key].box, H);
        let st = null;
        v.render(() => {
          const key = shape.value, K = SH[key], pts = samplesOf(key);
          const P = [p.x, p.y];
          const A = v.rgb('accent'), O = v.rgb('orange'), theme = v.color('accent');
          if (K.inside(p.x, p.y)) {
            S.raster((x, y) => (K.inside(x, y) ? [A[0], A[1], A[2], 105] : null), { key: `${key}|${theme}`, id: 'K', res: 2 });
            st = { inK: true };
            S.corner('p ∈ K — drag p off the set', 'tl', { color: 'red', weight: 600 });
            return;
          }
          // greedy finite subcover by W_q = B(q, d(p,q)/2), largest balls first
          const order = pts.slice().sort((a, b) => M.dist(b, P) - M.dist(a, P));
          const W = greedyBalls(order, (q) => M.dist(q, P) / 2, H * 0.75);
          const iStar = M.argmin(W, (w) => w.r), ws = W[iStar], rmin = ws.r;
          const dK = Math.min(...pts.map((q) => M.dist(q, P)));
          // K in blue, the rest of W_1 ∪ … ∪ W_n in pale orange
          S.raster((x, y) => {
            if (K.inside(x, y)) return [A[0], A[1], A[2], 105];
            for (const w of W) if ((x - w.q[0]) ** 2 + (y - w.q[1]) ** 2 < w.r * w.r) return [O[0], O[1], O[2], 45];
            return null;
          }, { key: `${key}|${p.x.toFixed(4)}|${p.y.toFixed(4)}|${theme}`, id: 'KW', res: 2 });
          for (const w of W) S.circle(w.q[0], w.q[1], w.r, { color: 'orange', width: 1, alpha: 0.6 });
          W.slice().sort((a, b) => a.r - b.r).slice(0, 6).forEach((w) => S.circle(p.x, p.y, w.r, { color: 'purple', width: 1, alpha: 0.45, dash: [3, 3] }));
          S.dots(W.map((w) => w.q), { color: 'orange', r: 2.2 });
          // the closest chosen ball and the green V
          S.circle(ws.q[0], ws.q[1], ws.r, { color: 'orange', width: 2.4 });
          S.circle(p.x, p.y, rmin, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 2.2 });
          S.line(p.x, p.y, ws.q[0], ws.q[1], { color: 'ink', width: 1.1, dash: [3, 3] });
          S.dot(ws.q[0], ws.q[1], { color: 'orange', r: 4, label: 'q_*', labelPos: 'e', tex: true });
          S.tex('V', p.x - rmin * 0.75, p.y - rmin * 0.75, { color: 'green', align: 'right', baseline: 'top', size: 16 });
          S.tex('K', K.box[0][1] - 0.05, K.box[1][1] - 0.05, { color: 'accent', size: 18 });
          st = { inK: false, n: W.length, rmin, dK };
        });
        v.legend([['accent', '$K$ (compact)', { area: true }], ['orange', '$W_{q_1}\\cup\\dots\\cup W_{q_n}\\supset K$', { area: true }], ['purple', 'smallest balls $V_{q_i}$ about $p$', { dash: true }], ['green', '$V=\\bigcap_i V_{q_i}$', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.inK) return 'The argument is about points of $K^c$: move $p$ outside $K$.';
          return `$n=${s.n}$ balls $W_{q_i}$ cover $K$. $\\;V$ has radius $\\min_i \\tfrac12 d(p,q_i) = ${v.fix(s.rmin, 3)} > 0$, while $d(p,K) = ${v.fix(s.dK, 3)}$: so $V\\subset K^c$, and $p$ is an interior point of $K^c$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.35
    {
      num: '2.35',
      kind: 'Theorem',
      name: 'Closed subsets of compact sets are compact',
      statement: String.raw`Let $K$ be a compact subset of a metric space $X$ and let $F\subset K$ be closed in $X$. Then $F$ is compact.`,
      idea: String.raw`Take an open cover $\{V_\alpha\}$ of $F$. Because $F$ is closed, $F^c$ is open (2.23), so $\{V_\alpha\}\cup\{F^c\}$ is an open cover of $K$. Compactness of $K$ yields finitely many members covering $K$; throwing away $F^c$ (which contains no point of $F$) leaves finitely many $V_\alpha$ covering $F$.`,
      caption: String.raw`$K=[0,1]$ and $F=\{0\}\cup\{2^{-k}:k\ge0\}$. The orange intervals $V_k$ isolate the points $2^{-k}$, $V_\infty=(-\eps,\eps)$ covers $0$, and the red set $F^c$ is open. Green outlines mark the finite subcover of $K$; deleting $F^c$ leaves a finite subcover of $F$. Remove $0$ from $F$ and $F^c$ is no longer open at $0$ — the trick, and the conclusion, fail.`,
      deps: ['pma-2.32', 'pma-2.23'],
      see: ['rca-2.4'],
      tags: ['compactness', 'closed sets'],
      viz(v) {
        const mode = v.select('$F$', [{ value: 'closed', label: '$F=\\{0\\}\\cup\\{2^{-k}\\}$ (closed)' }, { value: 'open', label: '$F=\\{2^{-k}\\}$ (not closed)' }], 'closed');
        const eps = v.slider('$\\varepsilon$ (size of $V_\\infty$)', 0.02, 0.6, 0.15, { step: 0.005 });
        const XR = [-0.12, 1.62];
        const S = v.stage({ x: XR, y: [-1.1, 3.75], height: 330, axes: false, full: true });
        const KMAX = 16;
        const pts = Array.from({ length: KMAX }, (_, k) => 2 ** -k);
        const Vk = (k) => [pts[k] * 0.75, pts[k] * 1.25];
        let st = null;
        v.render(() => {
          const closed = mode.value === 'closed', e = eps.value;
          const kStar = closed ? pts.findIndex((x) => x < e) - 1 : KMAX - 1; // V_0..V_kStar are needed besides V_∞
          // rows: 0 = K and F, 1 = V_k, 2 = V_∞, 3 = F^c
          S.line(XR[0], 0, XR[1], 0, { color: 'faint', width: 1 });
          for (const t of [0, 0.25, 0.5, 0.75, 1]) S.text(String(t), t, -0.62, { color: 'muted', align: 'center', size: 11 });
          S.interval(0, 1, 0, { color: 'accent', width: 6 });
          S.tex('K=[0,1]', 1.39, 0.08, { color: 'accent', align: 'left', baseline: 'bottom', size: 14 });
          // F
          S.dots(pts.map((x) => [x, 0]), { color: 'ink', r: 3.4 });
          if (closed) S.dot(0, 0, { color: 'ink', r: 4.2 }); else S.dot(0, 0, { color: 'red', r: 4.6, hollow: true, width: 2 });
          // row 1: V_k
          for (let k = 0; k < KMAX; k++) {
            const [a, b] = Vk(k); const used = k <= kStar;
            bar(S, a, b, 1, { color: 'orange', alpha: used ? 1 : 0.3, width: 5, r: pts[k] > 0.03 ? 3.4 : 0.01 });
          }
          S.tex('V_k', 1.39, 1, { color: 'orange', align: 'left', size: 14 });
          for (let k = 0; k <= Math.min(kStar, 3); k++) S.tex(`V_${k}`, pts[k], 1.25, { color: 'orange', size: 12, baseline: 'bottom' });
          // row 2: V_∞
          if (closed) { bar(S, -e, e, 2, { color: 'orange', width: 5 }); S.tex('V_\\infty', 1.39, 2, { color: 'orange', align: 'left', size: 14 }); }
          // row 3: F^c (open gaps between the points of F)
          const gapEnds = [[-0.2, closed ? 0 : null]];
          if (!closed) gapEnds[0] = [-0.2, pts[KMAX - 1]];
          for (let k = KMAX - 1; k > 0; k--) gapEnds.push([pts[k], pts[k - 1]]);
          gapEnds.push([1, 1.34]);
          for (const [a, b] of gapEnds) { if (b == null) continue; bar(S, a, b, 3, { color: 'red', width: 5, alpha: 0.8, r: b - a > 0.03 ? 3.2 : 0.01 }); }
          if (closed) S.dot(0, 3, { color: 'red', hollow: true, r: 3.2 });
          S.tex('F^c', 1.39, 3, { color: 'red', align: 'left', size: 14 });
          // the finite subcover: outline members in green
          if (closed) {
            const hi = (y, a, b) => S.rect(Math.max(a, XR[0]), y - 0.22, Math.min(b, 1.345), y + 0.22, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.08 });
            hi(2, -e, e); for (let k = 0; k <= kStar; k++) hi(1, Vk(k)[0] - 0.006, Vk(k)[1] + 0.006); hi(3, XR[0], 1.345);
          } else {
            S.line(0, -0.15, 0, 3.3, { color: 'red', width: 1, dash: [3, 3] });
            S.text('0 ∈ Fᶜ, but every (−δ, δ) meets F: Fᶜ is not open', 0.02, 2.2, { color: 'red', size: 12 });
          }
          st = { closed, kStar, e };
        });
        v.legend([['accent', '$K$'], ['ink', '$F$', { dot: true }], ['orange', 'cover of $F$ (open intervals)'], ['red', '$F^c$'], ['green', 'finite subcover of $K$', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.closed) return `$V_\\infty$ swallows every $2^{-k}<\\varepsilon$, so $K\\subset V_\\infty\\cup V_0\\cup\\dots\\cup V_{${s.kStar}}\\cup F^c$: ${s.kStar + 3} sets. Dropping $F^c$ leaves ${s.kStar + 2} open intervals covering $F$ — a finite subcover.`;
          return 'Each $V_k$ contains exactly one point of $F$, so no finite subfamily of $\\{V_k\\}$ covers $F$: $F$ is not compact, although it sits inside the compact $K$. The proof breaks because $F^c$ is not open.';
        });
      },
    },

    // ------------------------------------------------------------------ 2.35a
    {
      num: '2.35a',
      kind: 'Corollary',
      name: 'Closed ∩ compact is compact',
      statement: String.raw`If $F$ is closed and $K$ is compact in a metric space $X$, then $F\cap K$ is compact.`,
      idea: String.raw`$K$ is closed by 2.34, so $F\cap K$ is an intersection of closed sets and is closed (2.24). It is a closed subset of the compact set $K$, hence compact by 2.35. Note that $F$ itself may be unbounded and far from compact.`,
      caption: String.raw`$F$ (purple) is the closed region above a wavy curve — unbounded, not compact. Drag the compact disc $K$; the green set $F\cap K$ is always closed and bounded. Switch to the open region (strict inequality): points $x_n\in F\cap K$ can now converge to a point $b$ of the curve that is not in $F\cap K$, so the intersection is no longer closed, hence not compact.`,
      deps: ['pma-2.34', 'pma-2.24', 'pma-2.35'],
      tags: ['compactness', 'closed sets'],
      viz(v) {
        const M = v.M;
        const mode = v.select('$F$', [{ value: 'closed', label: '$F=\\{y\\ge g(x)\\}$ closed' }, { value: 'open', label: '$\\{y> g(x)\\}$ open' }], 'closed');
        const S = v.stage({ x: [-2.8, 2.8], y: [-1.6, 1.8], equal: true, height: 380, axes: false });
        const g = (x) => 0.38 * Math.sin(2.1 * x + 0.4) - 0.15 + 0.05 * x;
        const k = S.handle(0.25, -0.35, { color: 'accent', label: 'K' });
        const RK = 1.05;
        let st = null;
        v.render(() => {
          const closed = mode.value === 'closed';
          const P = v.rgb('purple'), G = v.rgb('green'), theme = v.color('accent');
          S.raster((x, y) => {
            if (y < g(x)) return null;
            const inK = (x - k.x) ** 2 + (y - k.y) ** 2 <= RK * RK;
            return inK ? [G[0], G[1], G[2], 120] : [P[0], P[1], P[2], 40];
          }, { key: `${k.x.toFixed(4)}|${k.y.toFixed(4)}|${theme}`, res: 2 });
          S.fn(g, { color: 'purple', width: 2.2, dash: closed ? null : [7, 5] });
          S.circle(k.x, k.y, RK, { color: 'accent', width: 2.4 });
          S.tex('F', -2.45, 1.45, { color: 'purple', size: 18 });
          // a boundary point b of F inside K: the lowest point of the curve inside the disc
          let best = null;
          for (let x = k.x - RK; x <= k.x + RK; x += 0.004) { const y = g(x); if ((x - k.x) ** 2 + (y - k.y) ** 2 < RK * RK * 0.97 && (!best || y < best[1])) best = [x, y]; }
          if (best) {
            const [bx, by] = best;
            // x_n lies above the curve (in F) and inside K, and x_n → b
            const xs = M.range(18, 1).map((n) => { const xx = bx + 0.32 * Math.sin(1.7 * n) / n ** 0.8; return [xx, g(xx) + 0.6 / n ** 0.85]; }).filter(([x, y]) => (x - k.x) ** 2 + (y - k.y) ** 2 <= RK * RK);
            S.dots(xs, { color: 'gold', r: 3.3 });
            if (xs.length) S.tex('x_n', xs[0][0], xs[0][1] + 0.06, { color: 'gold', size: 13, baseline: 'bottom' });
            if (closed) S.dot(bx, by, { color: 'green', r: 5.5, label: 'b \\in F\\cap K', labelPos: 'sw', tex: true });
            else S.dot(bx, by, { color: 'red', r: 5.5, hollow: true, width: 2.2, label: 'b \\notin F\\cap K', labelPos: 'sw', tex: true });
          }
          st = { closed, has: !!best };
          S.corner(closed ? 'F ∩ K: closed and bounded ⇒ compact' : 'F ∩ K misses part of its boundary ⇒ not compact', 'tr', { color: closed ? 'green' : 'red', weight: 600 });
        });
        v.legend([['purple', '$F$', { area: true }], ['accent', '$K$ (closed disc)'], ['green', '$F\\cap K$', { area: true }], ['gold', 'points $x_n\\in F\\cap K$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.has) return 'Here $F\\cap K$ has no boundary point inside the disc; move $K$ onto the curve.';
          return s.closed ? '$x_n\\to b$ and $b\\in F\\cap K$: the intersection contains its limit points, it lies in $K$, and by 2.35 it is compact.'
            : '$x_n\\to b$ but $b\\notin F$: $F\\cap K$ is not closed, so by 2.34 it cannot be compact. The hypothesis "$F$ closed" is essential.';
        });
      },
    },

    // ------------------------------------------------------------------ 2.36
    {
      num: '2.36',
      kind: 'Theorem',
      name: 'Finite intersection property for compact sets',
      statement: String.raw`Let $\{K_\alpha\}$ be a family of compact subsets of a metric space $X$ such that every finite subfamily has nonempty intersection. Then $\bigcap_\alpha K_\alpha$ is nonempty.`,
      idea: String.raw`Fix one member $K_1$ and suppose no point of $K_1$ lies in every $K_\alpha$. Then the complements $K_\alpha^c$ — open, since compact sets are closed (2.34) — cover $K_1$. Compactness of $K_1$ gives finitely many $K_{\alpha_1}^c,\dots,K_{\alpha_n}^c$ covering $K_1$, which says exactly that $K_1\cap K_{\alpha_1}\cap\dots\cap K_{\alpha_n}=\emptyset$, contradicting the hypothesis.`,
      caption: String.raw`A fan of unit discs $K_n$ centred at $\rho e^{i\theta_n}$ with $\theta_n=\pi(1-\tfrac1n)$. Green: the running intersection $K_1\cap\dots\cap K_N$ (right: magnified near $0$). With $\rho=1$ and closed discs, every finite intersection is nonempty and so is the whole intersection — it is $\{0\}$. Make the discs open: the finite intersections survive but nothing lies in all of them. Push $\rho$ above $1$: the full intersection is empty, and the theorem forces some finite subfamily to be empty already.`,
      deps: ['pma-2.32', 'pma-2.34', 'pma-2.23'],
      see: ['rca-2.6'],
      tags: ['compactness', 'intersections'],
      viz(v) {
        const M = v.M;
        const kind = v.select('discs', [{ value: 'closed', label: 'closed (compact)' }, { value: 'open', label: 'open' }], 'closed');
        const rho = v.slider('$\\rho$', 0.8, 1.2, 1, { step: 0.01 });
        const nN = v.slider('$N$', 1, 30, 9, { int: true });
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.25, 2.25], equal: true, height: 360, axes: false, weight: 1.35, title: 'the discs $K_1,\\dots,K_N$ and their intersection' });
        const Z = 0.32;
        const R = v.stage({ x: [-Z, Z], y: [-Z * 0.4, Z * 1.6], equal: true, height: 360, axes: false, title: 'magnified near $0$', minWidth: 230 });
        const th = (n) => Math.PI * (1 - 1 / n);
        let st = null;
        v.render(() => {
          const closed = kind.value === 'closed', r0 = rho.value, N = nN.value, one = Math.abs(r0 - 1) < 1e-9;
          const C = M.range(N, 1).map((n) => [r0 * Math.cos(th(n)), r0 * Math.sin(th(n))]);
          const inAll = (x, y) => C.every(([a, b]) => { const d2 = (x - a) ** 2 + (y - b) ** 2; return closed ? d2 <= 1 + 1e-12 : d2 < 1 - 1e-12; });
          // the minimal enclosing circle of the centres has radius ρ sin(θ_N/2): the N discs meet iff it is ≤ 1 (< 1 for open discs)
          const mec = r0 * Math.sin(th(N) / 2);
          const finiteNonempty = closed ? mec <= 1 + 1e-12 : mec < 1 - 1e-12;
          let nStar = null;
          for (let n = 2; n <= 400; n++) { const m = r0 * Math.sin(th(n) / 2); if (closed ? m > 1 + 1e-12 : m >= 1 - 1e-12) { nStar = n; break; } }
          const allNonempty = closed ? r0 <= 1 + 1e-12 : r0 < 1 - 1e-12;
          const Gc = v.rgb('green'), theme = v.color('green');
          for (const S of [L, R]) {
            S.raster((x, y) => (inAll(x, y) ? [Gc[0], Gc[1], Gc[2], 150] : null), { key: `${closed}|${r0}|${N}|${theme}`, res: S === R ? 1 : 2 });
            S.circle(0, 0, r0, { color: 'faint', width: 1, dash: [2, 4] });
            C.forEach(([a, b], i) => S.circle(a, b, 1, { color: i === N - 1 ? 'accent' : 'accent', width: i === N - 1 ? 2.2 : 1.1, alpha: i === N - 1 ? 1 : 0.45, dash: closed ? null : [6, 4] }));
          }
          C.forEach(([a, b], i) => L.dot(a, b, { color: i === N - 1 ? 'accent' : 'gold', r: 3.2 }));
          L.dot(C[0][0], C[0][1], { color: 'gold', r: 3.2, label: 'c_1', labelPos: 'se', tex: true });
          if (N > 1) L.dot(C[N - 1][0], C[N - 1][1], { color: 'accent', r: 3.6, label: `c_{${N}}`, labelPos: 'w', tex: true });
          for (const S of [L, R]) {
            if (one && closed) S.dot(0, 0, { color: 'green', r: S === R ? 5 : 3.5 });
            else if (one) S.dot(0, 0, { color: 'red', r: S === R ? 5 : 3.5, hollow: true, width: 2 });
          }
          R.tex('0', 0.012, -0.012, { color: !one ? 'muted' : closed ? 'green' : 'red', align: 'left', baseline: 'top', size: 13 });
          if (!one) R.dot(0, 0, { color: 'muted', r: 2.5 });
          v.legend([['accent', `$K_1,\\dots,K_N$ (${closed ? 'closed' : 'open'} unit discs)`, { dash: !closed }], ['gold', 'centres $\\rho e^{i\\theta_n}$', { dot: true }], ['green', '$K_1\\cap\\dots\\cap K_N$', { area: true }]]);
          L.corner(`first ${N} discs: intersection ${finiteNonempty ? '≠ ∅' : '= ∅'}`, 'tl', { color: finiteNonempty ? 'green' : 'red', weight: 600 });
          st = { closed, r0, N, finiteNonempty, nStar, allNonempty, one, mec };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const rel = s.finiteNonempty ? (s.closed ? '\\le' : '<') : (s.closed ? '>' : '\\ge');
          const fin = `$K_1\\cap\\dots\\cap K_{${s.N}}$ is ${s.finiteNonempty ? 'nonempty' : 'empty'} (the centres fit in a circle of radius $${v.fix(s.mec, 3)} ${rel} 1$). `;
          if (s.allNonempty) return fin + (s.one ? 'Every finite intersection is nonempty, and the whole family meets in exactly one point, $0$.' : `The whole intersection contains the disc of radius $${v.fix(1 - s.r0, 2)}$ about $0$.`);
          if (s.one && !s.closed) return fin + '**Every** finite intersection is nonempty, yet $\\bigcap_n K_n=\\emptyset$: $0$ lies on every boundary. Open discs are not compact, and the theorem fails.';
          return fin + `Here $\\bigcap_n K_n=\\emptyset$, and as the theorem predicts a finite subfamily is already disjoint: $K_1\\cap\\dots\\cap K_{${s.nStar}}=\\emptyset$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.36a
    {
      num: '2.36a',
      kind: 'Corollary',
      name: 'Nested nonempty compact sets have nonempty intersection',
      statement: String.raw`If $K_1\supset K_2\supset K_3\supset\cdots$ is a decreasing sequence of nonempty compact sets in a metric space, then $\bigcap_{n=1}^\infty K_n$ is nonempty.`,
      idea: String.raw`Any finite subfamily $K_{n_1},\dots,K_{n_j}$ has intersection $K_{\max n_i}\neq\emptyset$, so the finite intersection property holds and 2.36 applies. Both halves of compactness matter: the closed sets $[n,\infty)$ and the bounded sets $(0,1/n)$ are nested and nonempty, yet their intersections are empty.`,
      caption: String.raw`The sets $K_n=\{x\in D: f(x)\le c_n\}$ are sublevel sets of $f$ for levels $c_n$ decreasing to $\inf f$ (top: dashed level line). Below, row $n$ shows $K_n$: they are nested. On a compact domain they close in on the minimisers (green); on $[0,\infty)$ they run off to infinity, and on $(0,2]$ they shrink into the missing endpoint.`,
      deps: ['pma-2.36'],
      see: ['pma-4.16'],
      tags: ['compactness', 'intersections'],
      viz(v) {
        const M = v.M;
        const DOM = {
          cpt: { label: '$D=[-2,2]$ compact', f: (x) => 0.5 * (x * x - 1) ** 2 + 0.15 * x, a: -2, b: 2, open: [false, false], view: [-2.3, 2.3], y: [-0.45, 2.3], c1: 1.7 },
          unb: { label: '$D=[0,\\infty)$ closed, unbounded', f: (x) => 2 / (1 + 0.6 * x), a: 0, b: 60, open: [false, false], view: [-0.6, 12.5], y: [-0.25, 2.3], c1: 1.2, inf: 0, level: (j) => 2 / (1 + 0.78 * j) },
          hol: { label: '$D=(0,2]$ bounded, not closed', f: (x) => x * (1.1 + Math.sin(5 * x)), a: 0, b: 2, open: [true, false], view: [-0.15, 2.25], y: [-0.3, 2.3], c1: 1.3, inf: 0 },
        };
        const which = v.select('', Object.entries(DOM).map(([value, o]) => ({ value, label: o.label })), 'cpt');
        const nN = v.slider('$n$', 1, 9, 6, { int: true });
        const top = v.stage({ x: [-2.3, 2.3], y: [-0.45, 2.3], height: 250, full: true, axes: 'box', title: 'the graph of $f$ over $D$ and the level $c_n$' });
        const bot = v.stage({ x: [-2.3, 2.3], y: [-9.6, -0.4], height: 230, axes: false, full: true, title: 'the nested sets $K_1\\supset K_2\\supset\\dots\\supset K_n$' });
        const minCache = {};
        function infOf(key) {
          const F = DOM[key]; if (F.inf != null) return { m: F.inf, xs: [] };
          if (minCache[key]) return minCache[key];
          const xs = M.linspace(F.a, F.b, 4001); const ys = xs.map(F.f); const i = M.argmin(ys);
          let lo = xs[Math.max(0, i - 1)], hi = xs[Math.min(xs.length - 1, i + 1)];
          for (let k = 0; k < 60; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (F.f(m1) < F.f(m2)) hi = m2; else lo = m1; }
          const xm = (lo + hi) / 2;
          return (minCache[key] = { m: F.f(xm), xs: [xm] });
        }
        let st = null;
        v.render(() => {
          const key = which.value, F = DOM[key], n = nN.value;
          top.setView(F.view, F.y); bot.setView(F.view, [-(n + 0.7), -0.35]);
          const { m, xs: argmin } = infOf(key);
          const level = F.level || ((j) => m + (F.c1 - m) * 0.5 ** (j - 1));
          const c = level(n);
          const bEnd = Math.min(F.b, F.view[1] + 1);
          // top: graph and level
          top.hline(c, { color: 'orange', dash: [6, 4], width: 1.5 });
          top.tex(`c_{${n}}`, F.view[1], c, { color: 'orange', align: 'right', baseline: 'bottom', dy: -3, dx: -4 });
          top.fn(F.f, { domain: [F.a + (F.open[0] ? 1e-6 : 0), bEnd], color: 'ink', width: 2 });
          const R = runs(F.f, (y) => y <= c, F.a + (F.open[0] ? 1e-9 : 0), F.b, 3000);
          for (const [a, b] of R) if (a < F.view[1]) top.fn(F.f, { domain: [a, Math.min(b, bEnd)], color: 'orange', width: 3.4 });
          top.line(F.a, 0, bEnd, 0, { color: 'accent', width: 3.5, alpha: 0.6 });
          if (F.open[0]) top.dot(F.a, 0, { color: 'accent', r: 4.5, hollow: true }); else top.dot(F.a, 0, { color: 'accent', r: 3.5 });
          if (F.b <= F.view[1]) top.dot(F.b, 0, { color: 'accent', r: 3.5 });
          for (const [a, b] of R) if (a < F.view[1]) top.line(a, 0, Math.min(b, F.view[1] + 1), 0, { color: 'orange', width: 5, cap: 'butt' });
          if (argmin.length) top.dot(argmin[0], m, { color: 'green', r: 5 });
          if (key === 'unb') top.hline(0, { color: 'red', width: 1, dash: [2, 3] });
          // bottom: ladder of K_j
          for (let j = 1; j <= n; j++) {
            const cj = level(j);
            const Rj = runs(F.f, (y) => y <= cj, F.a + (F.open[0] ? 1e-9 : 0), bEnd);
            for (const [a, b] of Rj) {
              const leftOpen = F.open[0] && a <= F.a + 1e-6;
              bar(bot, a, Math.min(b, F.view[1] + 0.5), -j, { color: j === n ? 'orange' : 'orange', alpha: j === n ? 1 : 0.55, open: [leftOpen, false], width: 6, r: 3.6 });
              if (b >= F.view[1]) bot.arrow(F.view[1] - 0.35, -j, F.view[1] + 0.05, -j, { color: 'orange', head: 8, alpha: j === n ? 1 : 0.55 });
            }
            bot.tex(`K_{${j}}`, F.view[0], -j, { color: 'muted', align: 'left', size: 12, dx: 4 });
          }
          if (argmin.length) bot.vline(argmin[0], { color: 'green', width: 2, dash: [4, 3] });
          if (key === 'hol') bot.vline(0, { color: 'red', width: 1.5, dash: [4, 3] });
          const Kn = R;
          st = { key, n, c, Kn, argmin, m };
        });
        v.legend([['ink', '$y=f(x)$'], ['orange', 'sublevel set $K_n=\\{f\\le c_n\\}$'], ['green', '$\\bigcap_n K_n$ (minimisers of $f$)', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const fmtSet = s.Kn.map(([a, b]) => `${s.key === 'hol' && a < 1e-6 ? '(0' : '[' + v.fix(a, 3)},\\,${b > 50 ? '\\infty)' : v.fix(b, 3) + ']'}`).join('\\cup ');
          if (s.key === 'cpt') return `$K_{${s.n}} = ${fmtSet}$ (level $c_{${s.n}}=${v.fix(s.c, 4)}$). The nested compact sets shrink onto $\\bigcap_n K_n = \\{${v.fix(s.argmin[0], 4)}\\}$, where $f$ attains its minimum $${v.fix(s.m, 4)}$.`;
          if (s.key === 'unb') return `$K_{${s.n}} = ${fmtSet}$ is closed and nonempty, but not bounded: each $K_n$ starts further right, and $\\bigcap_n K_n=\\emptyset$ — $\\inf f = 0$ is never attained.`;
          return `$K_{${s.n}} = ${fmtSet}$ is bounded and nonempty, but not closed: the sets crowd into the missing point $0$, and $\\bigcap_n K_n=\\emptyset$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.37
    {
      num: '2.37',
      kind: 'Theorem',
      name: 'Infinite subsets of compact sets have limit points',
      statement: String.raw`If $E$ is an infinite subset of a compact set $K$, then $E$ has a limit point in $K$.`,
      idea: String.raw`Suppose no point of $K$ is a limit point of $E$. Then every $q\in K$ has a neighbourhood $V_q$ containing at most one point of $E$ (namely $q$ itself, if $q\in E$). The $V_q$ cover $K\supset E$, but finitely many of them contain only finitely many points of $E$, so no finite subfamily can cover $E$ — let alone $K$. This contradicts compactness.`,
      caption: String.raw`The colour at $q$ is the largest radius $\rho(q)$ for which the ball $V_q=N_{\rho(q)}(q)$ holds at most one point of $E$ (dark = small). Drag $q$. On the closed disc $\rho$ drops to $0$ at the point $b\in K$ where $E$ accumulates; on the open disc that point is missing, $\rho>0$ on all of $K$, and the balls $V_q$ form an open cover with no finite subcover. In the plane, $E$ escapes to infinity.`,
      deps: ['pma-2.32', 'pma-2.18', 'pma-2.19'],
      see: ['pma-3.6'],
      tags: ['compactness', 'limit points'],
      viz(v) {
        const M = v.M;
        const NPTS = 260;
        const spiral = M.range(NPTS, 1).map((n) => { const r = 1 - 0.55 / n, b = 1.1 * Math.sin(1.7 * n) / Math.sqrt(n); return [r * Math.cos(b), r * Math.sin(b)]; });
        const escape = M.range(NPTS, 1).map((n) => [-2.2 + 0.42 * n, 0.55 * Math.sin(1.3 * n)]);
        const CASES = {
          closed: { label: '$K$ = closed disc', E: spiral, inK: (x, y) => x * x + y * y <= 1, bd: 'solid' },
          open: { label: '$K$ = open disc', E: spiral, inK: (x, y) => x * x + y * y < 1, bd: 'dashed' },
          plane: { label: '$K=\\mathbb{R}^2$', E: escape, inK: () => true, bd: null },
        };
        const which = v.select('', Object.entries(CASES).map(([value, o]) => ({ value, label: o.label })), 'closed');
        const S = v.stage({ x: [-1.25, 1.45], y: [-1.25, 1.25], equal: true, height: 380, axes: false, weight: 1.3, title: 'colour = $\\rho(q)$ on $K$' });
        const P = v.stage({ x: [-1.05, 1.1], y: [-0.03, 1], height: 380, axes: 'box', minWidth: 240, title: 'profile $\\rho(x,0)$ along the $x$-axis' });
        const q = S.handle(0.55, 0.42, { color: 'accent', label: 'q' });
        // ρ(q) = distance from q to the second-nearest point of E
        function rho(E, x, y) {
          let d1 = Infinity, d2 = Infinity;
          for (const p of E) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
          return Math.sqrt(d2);
        }
        let st = null;
        v.render(() => {
          const key = which.value, C = CASES[key];
          S.setView(key === 'plane' ? [-2.4, 2.6] : [-1.25, 1.45], key === 'plane' ? [-1.3, 1.3] : [-1.25, 1.25]);
          P.setView(key === 'plane' ? [-2.4, 2.6] : [-1.05, 1.1], null);
          S.heat((x, y) => (C.inK(x, y) ? Math.sqrt(Math.min(1, rho(C.E, x, y) / 1.1)) : NaN), { range: [0, 1], cmap: 'magma', res: 3, key: key + v.color('panel'), alpha: 0.8 });
          if (C.bd) S.circle(0, 0, 1, { color: 'ink', width: 2, dash: C.bd === 'dashed' ? [7, 5] : null });
          S.dots(C.E.filter((p) => p[0] < 2.5), { color: 'gold', r: 2.4 });
          const r = rho(C.E, q.x, q.y);
          const inside = C.E.filter((p) => Math.hypot(p[0] - q.x, p[1] - q.y) < r - 1e-12);
          S.circle(q.x, q.y, r, { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.1 });
          for (const p of inside) S.dot(p[0], p[1], { color: 'orange', r: 4.5 });
          if (key !== 'plane') {
            if (key === 'closed') S.dot(1, 0, { color: 'green', r: 5.5, label: 'b ∈ K', labelPos: 'e' });
            else S.dot(1, 0, { color: 'red', r: 5.5, hollow: true, width: 2.2, label: 'b ∉ K', labelPos: 'e' });
          } else S.arrow(1.9, -1.15, 2.45, -1.15, { color: 'red', head: 9 });
          // profile along y = 0
          const xa = key === 'plane' ? -2.4 : -1, xb = key === 'plane' ? 2.6 : 1;
          const prof = v.M.linspace(xa, xb, 500).map((x) => [x, rho(C.E, x, 0)]);
          const pmax = Math.max(...prof.map((p) => p[1])); P.setView(null, [-pmax * 0.1, pmax * 1.08]);
          P.path(prof, { color: 'orange', width: 2.2 });
          P.path(prof.concat([[xb, 0], [xa, 0]]), { fill: 'orange', fillAlpha: 0.12, stroke: false, close: true });
          if (key === 'closed') P.dot(1, prof[prof.length - 1][1], { color: 'green', r: 5, label: 'b', labelPos: 'n' });
          if (key === 'open') { P.dot(1, prof[prof.length - 1][1], { color: 'red', r: 5, hollow: true, width: 2, label: 'b', labelPos: 'n' }); }
          if (Math.abs(q.y) < 0.6) P.vline(q.x, { color: 'accent', width: 1, dash: [3, 3] });
          const inK = C.inK(q.x, q.y);
          st = { key, r, inK, nin: inside.length };
        });
        v.legend([['gold', 'points of $E$ (first 260 shown)', { dot: true }], ['orange', '$V_q$: largest ball about $q$ with $\\le 1$ point of $E$'], ['green', 'limit point in $K$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = s.inK ? `$\\rho(q) = ${v.fix(s.r, 4)}$, and $V_q$ contains ${s.nin} point${s.nin === 1 ? '' : 's'} of $E$. ` : '$q$ is outside $K$. ';
          if (s.key === 'closed') return head + 'Drag $q$ towards $b=(1,0)$: $\\rho(q)\\to 0$, so every neighbourhood of $b$ holds infinitely many points of $E$ — a limit point, and $b\\in K$.';
          if (s.key === 'open') return head + '$\\rho>0$ at every point of $K$; the balls $V_q$ cover $K$, each catches at most one point of the infinite set $E$, so no finite subfamily covers $K$. The open disc is not compact.';
          return head + '$E$ marches off to the right: $\\rho$ stays bounded below, $E$ has no limit point, and $\\mathbb{R}^2$ is not compact.';
        });
      },
    },
  ],
};
