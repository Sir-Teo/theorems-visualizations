// Rudin, Real and Complex Analysis — Chapter 2: Positive Borel Measures
// Part 1: vector spaces, linear functionals, topological preliminaries (2.1–2.7).

// ---------------------------------------------------------------- helpers
function segDist2(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = a[0] + t * dx - p[0], ey = a[1] + t * dy - p[1];
  return [ex * ex + ey * ey, a[0] + t * dx, a[1] + t * dy];
}
/** distance from p to the boundary of a polygon */
function polyDist(p, poly) {
  let d = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const e = segDist2(p, poly[j], poly[i])[0]; if (e < d) d = e; }
  return Math.sqrt(d);
}
function closestOnPoly(p, poly) {
  let d = Infinity, best = poly[0];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [e, x, y] = segDist2(p, poly[j], poly[i]); if (e < d) { d = e; best = [x, y]; } }
  return best;
}
function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** grid points (spacing h) inside a polygon, plus its vertices */
function polySamples(poly, h) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const out = poly.map((p) => p.slice());
  for (let x = x0 + h / 2; x < x1; x += h) for (let y = y0 + h / 2; y < y1; y += h) if (inPoly([x, y], poly)) out.push([x, y]);
  return out;
}
/** Greedy finite subcover: repeatedly take the uncovered sample with the largest admissible radius. */
function greedyCover(pts, rad, slack, cap = 700) {
  const n = pts.length, R = pts.map(rad), cov = new Uint8Array(n), out = [];
  for (;;) {
    let bi = -1, br = -1;
    for (let i = 0; i < n; i++) if (!cov[i] && R[i] > br) { br = R[i]; bi = i; }
    if (bi < 0 || out.length >= cap) break;
    const q = pts[bi], r = R[bi], rr = Math.max(0, r - slack);
    cov[bi] = 1;
    for (let i = 0; i < n; i++) if (!cov[i]) { const dx = pts[i][0] - q[0], dy = pts[i][1] - q[1]; if (dx * dx + dy * dy < rr * rr) cov[i] = 1; }
    out.push({ q, r });
  }
  return out;
}
/** number as TeX, using \times 10^{k} for tiny/huge values */
function tnum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const k = Math.floor(Math.log10(a)), m = x / Math.pow(10, k);
  return `${Number(m.toPrecision(d))}\\times 10^{${k}}`;
}
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
const circlePts = (cx, cy, r, n = 56) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n), cy + r * Math.sin(2 * Math.PI * i / n)]);
function centroid(poly) { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; }
/** clip subsequent drawing on stage S to the disc |z - c| < r (data units) */
function withDiscClip(S, cx, cy, r, draw) {
  const c = S.ctx; c.save(); c.beginPath(); c.arc(S.X(cx), S.Y(cy), Math.abs(r * S.scale), 0, 2 * Math.PI); c.clip(); draw(); c.restore();
}

export default {
  collection: 'rca',
  chapter: 2,
  title: 'Positive Borel Measures',
  summary: String.raw`The chapter turns integration around: instead of starting from a measure, it starts from a positive linear functional on $C_c(X)$, the continuous functions of compact support on a locally compact Hausdorff space. Urysohn's lemma and partitions of unity supply enough such functions to recover a unique regular Borel measure from the functional (the Riesz representation theorem). Rudin then studies regularity, builds Lebesgue measure on $\R^k$ from the Riemann integral (translation invariance, uniqueness, the effect of linear maps, nonmeasurable sets), and closes with two theorems saying measurable functions are nearly continuous: Lusin's theorem and the Vitali–Carathéodory theorem.`,
  items: [
    // ------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Vector spaces, linear maps and linear functionals',
      statement: String.raw`A *complex vector space* is a set $V$ equipped with an addition $V\times V\to V$ and a multiplication by complex scalars $\C\times V\to V$ satisfying the familiar algebraic laws: addition is commutative and associative, there is a zero vector, every vector has an additive inverse, $\alpha(x+y)=\alpha x+\alpha y$, $(\alpha+\beta)x=\alpha x+\beta x$, $\alpha(\beta x)=(\alpha\beta)x$ and $1x=x$. Replacing $\C$ by $\R$ gives a *real vector space*.

A map $\Lambda$ from a vector space $V$ into a vector space $V_1$ is *linear* if $\Lambda(\alpha x+\beta y)=\alpha\Lambda x+\beta\Lambda y$ for all $x,y\in V$ and all scalars $\alpha,\beta$. A *linear functional* is a linear map of $V$ into its field of scalars.`,
      idea: String.raw`Only the linear structure matters for what follows. Integration against a measure is the prototype of a linear functional on a space of functions, and the main question of the chapter is which linear functionals on $C_c(X)$ arise in this way.`,
      deps: [],
      tags: ['linear functional', 'vector space'],
    },
    // ------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Integration as a positive linear functional',
      statement: String.raw`If $\mu$ is a positive measure on a measurable space $X$, then $\Lambda f=\int_X f\,d\mu$ is a linear functional on $L^1(\mu)$ (Theorem 1.32), and it is *positive*: $\Lambda f\ge 0$ whenever $f$ takes only nonnegative real values. A linear functional on a vector space of complex functions with this property is called a *positive linear functional*. Positivity forces monotonicity: if $f\le g$ are real, then $\Lambda f\le\Lambda g$.`,
      idea: String.raw`Linearity of the integral is Theorem 1.32 and positivity is immediate from the definition of $\int f\,d\mu$ for $f\ge0$. The Riesz representation theorem (2.14) shows that on $C_c(X)$ the converse holds: every positive linear functional is integration against a measure.`,
      caption: String.raw`A concrete $\Lambda f=\int f\,d\mu$ on $[0,1]$, where $\mu$ (lower strip) is a density plus two point masses. Move $c$: the right panel shows that $c\mapsto\Lambda(f+cg)$ is a straight line — linearity — and that it is $\ge 0$ throughout the green range of $c$ where $f+cg\ge 0$ pointwise — positivity.`,
      deps: ['rca-2.1', 'rca-1.32'],
      see: ['rca-2.14'],
      tags: ['linear functional', 'integration'],
      verify: true,
      viz(v) {
        const M = v.M;
        const atoms = [[0.3, 0.22], [0.78, 0.14]];
        const w = (x) => 0.45 + 2.2 * x * (1 - x) * (0.6 + 0.4 * Math.cos(5 * x));
        const f = (x) => Math.cos(2 * Math.PI * x) * (1 - 0.35 * x);
        const g = (x) => 0.55 + 0.45 * Math.sin(Math.PI * x);
        const Lam = (h) => M.integrate((x) => h(x) * w(x), 0, 1, 600) + atoms.reduce((s, [a, m]) => s + m * h(a), 0);
        const Lf = Lam(f), Lg = Lam(g);
        let cstar = -Infinity;
        for (const x of M.linspace(0, 1, 2001)) cstar = Math.max(cstar, -f(x) / g(x));
        const c = v.slider('$c$', -1.5, 3, 0.3, { step: 0.01 });
        const A = v.stage({ x: [-0.04, 1.04], y: [-2.75, 3.4], height: 330, weight: 1.3, title: String.raw`$f+cg$ on $[0,1]$, and the measure $\mu$ (strip)` });
        const B = v.stage({ x: [-1.6, 3.1], y: [-1.2, 2.6], height: 330, title: String.raw`$c\mapsto\Lambda(f+cg)$`, xlabel: 'c' });
        const yS = -2.55; // baseline of the μ strip
        v.render(() => {
          const h = (x) => f(x) + c.value * g(x);
          // μ strip
          A.rect(-0.04, -2.75, 1.04, -1.35, { fill: 'panel', fillAlpha: 1, stroke: false });
          A.hline(-1.35, { color: 'faint', width: 1 });
          A.fn((x) => yS + 0.42 * w(x), { domain: [0, 1], color: 'orange', width: 1.6, fill: 'orange', fillAlpha: 0.22, base: yS });
          A.line(0, yS, 1, yS, { color: 'muted', width: 1 });
          for (const [a, m] of atoms) { A.line(a, yS, a, yS + 3.6 * m, { color: 'orange', width: 2.4 }); A.dot(a, yS + 3.6 * m, { color: 'orange', r: 4.5 }); A.tex(String.raw`${m}\,\delta_{${a}}`, a, yS + 3.6 * m, { color: 'orange', size: 12, align: 'left', dx: 7, dy: -2 }); }
          A.tex(String.raw`\mu`, 1.02, yS + 0.62, { color: 'orange', align: 'right', size: 14 });
          // the function
          A.hline(0, { color: 'faint', width: 1 });
          A.fn(h, { domain: [0, 1], color: 'accent', width: 2.6 });
          A.between((x) => Math.min(0, h(x)), () => 0, 0, 1, { fill: 'red', fillAlpha: 0.25 });
          A.between((x) => Math.max(0, h(x)), () => 0, 0, 1, { fill: 'accent', fillAlpha: 0.12 });
          A.fn(f, { domain: [0, 1], color: 'muted', width: 1.2, dash: [4, 4] });
          A.fn(g, { domain: [0, 1], color: 'teal', width: 1.2, dash: [4, 4] });
          // the line
          B.hline(0, { color: 'faint', width: 1 });
          B.vband(cstar, 3.2, { color: 'green', alpha: 0.12 });
          B.vline(cstar, { color: 'green', dash: [4, 4], width: 1.2 });
          B.tex(String.raw`f+cg\ge 0`, cstar, 2.45, { color: 'green', align: 'left', dx: 6, size: 13 });
          B.fn((t) => Lf + t * Lg, { color: 'accent', width: 2.4 });
          const c0 = -Lf / Lg;
          B.dot(c0, 0, { color: 'muted', r: 3.5 });
          const L = Lf + c.value * Lg;
          B.dot(c.value, L, { color: h(0) >= 0 && c.value >= cstar ? 'green' : 'gold', r: 6 });
          B.line(c.value, 0, c.value, L, { color: 'gold', width: 1.2, dash: [3, 3] });
        });
        v.legend([['accent', '$f+cg$'], ['muted', '$f$', { dash: true }], ['teal', '$g$', { dash: true }], ['orange', 'density and atoms of $\\mu$', { area: true }], ['red', 'negative part', { area: true }]]);
        v.readout(() => {
          const h = (x) => f(x) + c.value * g(x);
          let mn = Infinity; for (const x of M.linspace(0, 1, 801)) mn = Math.min(mn, h(x));
          const L = Lf + c.value * Lg;
          return `$\\Lambda f=${v.fix(Lf, 3)},\\ \\Lambda g=${v.fix(Lg, 3)},\\ \\Lambda(f+cg)=${v.fix(L, 3)}=\\Lambda f+c\\,\\Lambda g$. $\\;\\min(f+cg)=${v.fix(mn, 3)}$` + (mn >= -1e-9 ? ' — the function is $\\ge 0$, and so is $\\Lambda(f+cg)$.' : (L >= 0 ? ' — $f+cg$ dips below $0$, so positivity promises nothing; here $\\Lambda(f+cg)$ happens to be $\\ge 0$ anyway.' : ' — $f+cg$ dips below $0$, and here $\\Lambda(f+cg)<0$.'));
        });
      },
    },
    // ------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Closed, compact, Hausdorff, locally compact',
      statement: String.raw`Let $X$ be a topological space.
(a) $E\subset X$ is *closed* if $E^c$ is open.
(b) The *closure* $\overline E$ of $E$ is the smallest closed set containing $E$.
(c) $K\subset X$ is *compact* if every cover of $K$ by open sets has a finite subcover.
(d) A *neighbourhood* of a point $p$ is any open set containing $p$.
(e) $X$ is a *Hausdorff space* if distinct points $p\ne q$ have disjoint neighbourhoods.
(f) $X$ is *locally compact* if every point of $X$ has a neighbourhood whose closure is compact.`,
      idea: String.raw`Every metric space is Hausdorff, and $\R^k$ is locally compact (closed balls are compact by Heine–Borel). Locally compact Hausdorff spaces are exactly the setting in which there are enough continuous functions with compact support (Urysohn's lemma 2.12) to carry the Riesz representation theorem.`,
      deps: ['rca-1.2'],
      see: ['pma-2.32'],
      tags: ['topology', 'compactness'],
    },
    // ------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Closed subsets of compact sets are compact',
      statement: String.raw`Let $K$ be a compact subset of a topological space $X$, and let $F\subset K$ be closed in $X$. Then $F$ is compact.`,
      idea: String.raw`Given an open cover $\{V_\alpha\}$ of $F$, add the open set $F^c$: together they cover $K$, so finitely many of them do. Throwing $F^c$ away leaves finitely many $V_\alpha$, which still cover $F$. Closedness is what makes $F^c$ an admissible member of the cover.`,
      caption: String.raw`$K=[0,1]$ and $F=\{1/n\}$, covered by the isolating open intervals $I_n$ (arcs) and, if $0\in F$, by $I_0=(-\varepsilon,\varepsilon)$. With $0\in F$ the set $F^c$ (orange) is open and the green finite subfamily suffices for every $\varepsilon$. Switch $0$ off: $F$ is no longer closed, $F^c$ is not open at $0$, and no finite subfamily of the $I_n$ covers $F$.`,
      deps: ['rca-2.3'],
      see: ['pma-2.35'],
      tags: ['compactness', 'topology'],
      viz(v) {
        const closed = v.toggle(String.raw`$0\in F$ (so $F$ is closed)`, true);
        const eps = v.slider(String.raw`radius $\varepsilon$ of $I_0$`, 0.03, 0.5, 0.16, { step: 0.005 });
        const A = v.stage({ x: [-0.07, 1.07], y: [-0.62, 1.08], height: 250, axes: false, full: true, title: String.raw`$K=[0,1]$: the cover $\{I_n\}$ of $F$ (arcs) and the set $F^c$ (orange strip)` });
        const Z = v.stage({ x: [-0.007, 0.107], y: [-0.62, 1.08], height: 210, axes: false, full: true, title: String.raw`zoom $\times 10$ near $0$` });
        const N = 320;
        const rn = (n) => 0.42 / (n * (n + 1));
        const hn = (r) => 0.24 + 0.5 * Math.min(1, Math.sqrt(r / 0.21));
        const arc = (S, a, b, h, st) => S.curve((t) => [a + (b - a) * t, h * Math.sin(Math.PI * t)], 0, 1, { n: 36, ...st });
        v.render(() => {
          const cl = closed.value, e = eps.value, m = Math.floor(1 / e);
          for (const S of [A, Z]) {
            const px = 1 / S.scale;
            // F^c strip
            const yC = -0.34;
            let xr = 0; // below xr the holes of F^c are closer than the pixel grid
            for (let n = 2; n <= N; n++) { if (1 / (n - 1) - 1 / n < 3.5 * px) { xr = 1 / (n - 1); break; } }
            S.line(-0.07, yC, 0, yC, { color: 'orange', width: 7, alpha: 0.55, cap: 'butt' });
            S.line(0, yC, xr, yC, { color: 'orange', width: 7, alpha: 0.2, cap: 'butt' });
            S.line(xr, yC, 1.07, yC, { color: 'orange', width: 7, alpha: 0.55, cap: 'butt' });
            for (let n = 1; n <= N; n++) { const x = 1 / n; if (x < xr) break; S.dot(x, yC, { color: 'panel', r: 2.3, ring: false }); }
            if (cl) S.dot(0, yC, { color: 'panel', r: 2.3, ring: false });
            else S.dot(0, yC, { color: 'red', r: 6, hollow: true, width: 2 });
            // K
            S.line(-0.07, 0, 1.07, 0, { color: 'faint', width: 1 });
            S.line(0, 0, 1, 0, { color: 'ink', width: 2.2 });
            // arcs I_n
            for (let n = N; n >= 1; n--) {
              const x = 1 / n, r = rn(n); if (2 * r * S.scale < 0.8) continue;
              const chosen = cl && n <= m;
              arc(S, x - r, x + r, hn(r), { color: chosen ? 'green' : 'accent', width: chosen ? 2 : 1, alpha: chosen ? 0.95 : 0.45 });
            }
            if (cl) arc(S, -e, e, 0.98, { color: 'green', width: 2.6 });
            // points of F
            const pts = []; for (let n = 1; n <= N; n++) pts.push([1 / n, 0]);
            S.dots(pts, { color: 'accent', r: 2.6 });
            if (cl) S.dot(0, 0, { color: 'accent', r: 4 }); else S.dot(0, 0, { color: 'red', r: 4, hollow: true });
          }
          A.tex('K', 1.0, 0, { color: 'ink', align: 'left', dx: 8, size: 14 });
          A.tex('F^c', 1.03, -0.34, { color: 'orange', align: 'center', dy: 14, size: 13 });
          A.tex('I_1', 1, hn(rn(1)), { color: cl && m >= 1 ? 'green' : 'accent', dy: -10, size: 13 });
          A.tex('I_2', 0.5, hn(rn(2)), { color: cl && m >= 2 ? 'green' : 'accent', dy: -10, size: 13 });
          if (cl) Z.tex('I_0=(-\\varepsilon,\\varepsilon)', Math.min(e, 0.08), 0.98, { color: 'green', align: 'left', dx: 6, dy: -4, size: 13 });
          if (cl) A.corner(`Fᶜ ∪ I₀ ∪ I₁ ∪ … ∪ I${sub(m)} covers K`, 'bl', { color: 'green', weight: 600 });
          else { A.corner('F not closed: Fᶜ is not open at 0', 'bl', { color: 'red', weight: 600 }); Z.corner('every interval about 0 meets F', 'bl', { color: 'red', weight: 600 }); }
        });
        v.readout(() => {
          const m = Math.floor(1 / eps.value);
          return closed.value
            ? `$F^c\\cup I_0\\cup I_1\\cup\\dots\\cup I_{${m}}$ covers $K$, because every $1/n<\\varepsilon$ lies in $I_0$. Discarding $F^c$ leaves the finite subcover $\\{I_0,\\dots,I_{${m}}\\}$ of $F$ — ${m + 1} sets.`
            : `Without $0$, $F$ is not closed, so $F^c$ cannot join the cover. Each $I_n$ contains exactly one point of $F$, so no finite subfamily covers $F$: $F$ is not compact.`;
        });
      },
    },
    // ------------------------------------------------------------ 2.4a
    {
      num: '2.4a',
      kind: 'Corollary',
      name: 'Subsets of sets with compact closure',
      statement: String.raw`If $A\subset B$ and $B$ has compact closure, then $A$ has compact closure.`,
      idea: String.raw`$\overline A\subset\overline B$, and $\overline A$ is closed, so Theorem 2.4 applies inside the compact set $\overline B$.`,
      caption: String.raw`The ambient space is the *open* disc $X$ (its rim is not part of $X$), so closures are taken inside $X$. Drag the centres and rims of $A$ and $B$. While $\overline B$ stays off the rim it is compact, and every $A\subset B$ inherits a compact closure. Let $B$ touch the rim (red arc) and its closure in $X$ is no longer compact.`,
      deps: ['rca-2.4'],
      tags: ['compactness', 'closure'],
      viz(v) {
        const S = v.stage({ x: [-2.15, 2.15], y: [-1.78, 1.78], equal: true, height: 380, axes: false });
        const R = 1.62;
        const bC = S.handle(0.3, -0.15, { color: 'orange', label: 'B' });
        const bR = S.handle(1.25, -0.15, { color: 'orange', r: 5.5 });
        const aC = S.handle(0.15, 0.1, { color: 'accent', label: 'A' });
        const aR = S.handle(0.62, 0.1, { color: 'accent', r: 5.5 });
        bC.labelPos = 'sw'; aC.labelPos = 'nw';
        const glue = (c, rim) => { let prev = [c.x, c.y]; c.onDrag = () => { rim.x += c.x - prev[0]; rim.y += c.y - prev[1]; prev = [c.x, c.y]; }; rim.onDrag = () => { prev = [c.x, c.y]; }; };
        glue(bC, bR); glue(aC, aR);
        let st = {};
        const escape = (cx, cy, r) => { // arcs of the rim |z|=R lying in the closed disc
          const pts = []; const out = [];
          for (let i = 0; i <= 360; i++) { const t = 2 * Math.PI * i / 360, x = R * Math.cos(t), y = R * Math.sin(t); if (Math.hypot(x - cx, y - cy) <= r) pts.push([x, y]); else if (pts.length) { out.push(pts.splice(0)); } }
          if (pts.length) out.push(pts);
          return out;
        };
        v.render(() => {
          const rb = Math.hypot(bR.x - bC.x, bR.y - bC.y), ra = Math.hypot(aR.x - aC.x, aR.y - aC.y);
          const Bcpt = Math.hypot(bC.x, bC.y) + rb < R - 1e-6;
          const Acpt = Math.hypot(aC.x, aC.y) + ra < R - 1e-6;
          const AinB = Math.hypot(aC.x - bC.x, aC.y - bC.y) + ra <= rb + 1e-6;
          S.circle(0, 0, R, { fill: 'gray', fillAlpha: 0.07, stroke: false });
          S.circle(0, 0, R, { color: 'muted', width: 1.4, dash: [6, 5] });
          withDiscClip(S, 0, 0, R, () => {
            S.circle(bC.x, bC.y, rb, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 2.2 });
            S.circle(aC.x, aC.y, ra, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2.2 });
          });
          for (const arcPts of escape(bC.x, bC.y, rb)) S.path(arcPts, { color: 'red', width: 5, alpha: 0.85 });
          for (const arcPts of escape(aC.x, aC.y, ra)) S.path(arcPts, { color: 'purple', width: 2.5, alpha: 0.9 });
          S.tex(String.raw`X\ \text{(open disc; rim}\notin X)`, -R * 0.71, R * 0.71, { color: 'muted', align: 'right', dx: -16, dy: -10, size: 13 });
          const ok = AinB && Bcpt;
          S.corner(!AinB ? 'A ⊄ B: hypothesis fails' : Bcpt ? 'Ā ⊂ B̄, and B̄ is compact ⇒ Ā compact' : 'B̄ reaches the rim: not compact in X', 'tl', { color: !AinB ? 'muted' : ok ? 'green' : 'red', weight: 600 });
          st = { Bcpt, Acpt, AinB };
        });
        v.legend([['orange', '$B$ (closure taken in $X$)', { area: true }], ['accent', '$A$', { area: true }], ['red', 'points of $\\overline B$ missing from $X$']]);
        v.readout(() => `$A\\subset B$: ${st.AinB ? 'yes' : 'no'}$\\quad$ closure of $B$ in $X$ compact: ${st.Bcpt ? 'yes' : 'no'}$\\quad$ closure of $A$ in $X$ compact: ${st.Acpt ? 'yes' : 'no'}` + (st.AinB && st.Bcpt ? ' — as the corollary predicts.' : ''));
      },
    },
    // ------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Separating a point from a compact set',
      statement: String.raw`Let $X$ be a Hausdorff space, $K\subset X$ compact and $p\in X\setminus K$. Then there are disjoint open sets $U$ and $W$ with $p\in U$ and $K\subset W$.`,
      idea: String.raw`For each $q\in K$ the Hausdorff property gives disjoint neighbourhoods $U_q\ni p$ and $V_q\ni q$. The $V_q$ cover $K$; compactness picks finitely many $V_{q_1},\dots,V_{q_n}$. Then $W=\bigcup V_{q_i}$ and $U=\bigcap U_{q_i}$ work — the intersection is open only because it is finite.`,
      caption: String.raw`In the plane take $U_q,V_q$ to be the discs of radius $\tfrac12 d(p,q)$ about $p$ and $q$. Drag $p$: a finite family of orange discs $V_{q_i}$ covers $K$, and $U$ (green) is the smallest of the matching discs about $p$. Switch to the second mode, where $p$ sits on the edge of $K$ but is removed from it: the discs must shrink towards $p$ forever, and $\bigcap U_q=\{p\}$ is not open.`,
      deps: ['rca-2.3'],
      see: ['pma-2.34'],
      tags: ['Hausdorff', 'compactness'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.05, 2.05], equal: true, height: 400, axes: false });
        const mode = v.select('', [{ value: 'cpt', label: '$K$ compact, $p\\notin K$' }, { value: 'bad', label: '$K=\\overline{K_0}\\setminus\\{p\\}$, $p$ on the edge' }], 'cpt');
        const K = M.blob(0.75, -0.1, 1.2, 4, 0.22, 140);
        const C = centroid(K);
        const H = 0.075;
        const base = polySamples(K, H);
        const p = S.handle(-1.05, 0.95, {
          color: 'gold', label: 'p', constrain: (x, y) => {
            if (mode.value === 'bad') return closestOnPoly([x, y], K);
            if (inPoly([x, y], K) || polyDist([x, y], K) < 0.1) { const q = closestOnPoly([x, y], K); const d = [q[0] - C[0], q[1] - C[1]], L = Math.hypot(...d) || 1; return [q[0] + 0.12 * d[0] / L, q[1] + 0.12 * d[1] / L]; }
            return [x, y];
          },
        });
        let lastMode = 'cpt', cache = null, ckey = '';
        v.render(() => {
          if (mode.value !== lastMode) { lastMode = mode.value; const q = mode.value === 'bad' ? closestOnPoly([p.x, p.y], K) : [-1.05, 0.95]; p.x = q[0]; p.y = q[1]; }
          const bad = mode.value === 'bad';
          const key = `${mode.value}|${p.x.toFixed(4)}|${p.y.toFixed(4)}`;
          if (key !== ckey) {
            ckey = key;
            let pts = base;
            if (bad) {
              pts = base.filter((q) => Math.hypot(q[0] - p.x, q[1] - p.y) > 1e-6);
              for (let k = 1; k <= 16; k++) for (let j = 0; j < 24; j++) { const r = 0.6 * Math.pow(0.62, k), t = 2 * Math.PI * j / 24; const q = [p.x + r * Math.cos(t), p.y + r * Math.sin(t)]; if (inPoly(q, K)) pts.push(q); }
            }
            const cover = greedyCover(pts, (q) => Math.hypot(q[0] - p.x, q[1] - p.y) / 2, H * 0.75, 900);
            let best = cover[0];
            for (const c of cover) if (c.r < best.r) best = c;
            cache = { cover, best };
          }
          const { cover, best } = cache;
          S.rings(cover.map((c) => circlePts(c.q[0], c.q[1], c.r, 40)), { fill: 'orange', fillAlpha: 0.13, stroke: false });
          for (const c of cover) S.circle(c.q[0], c.q[1], c.r, { color: 'orange', width: 1, alpha: 0.55 });
          S.poly(K, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 2 });
          S.tex('K', C[0] + 0.2, C[1] + 0.1, { color: 'accent', size: 18 });
          if (bad) S.dot(p.x, p.y, { color: 'red', r: 9, hollow: true, width: 2 });
          S.circle(p.x, p.y, best.r, { fill: 'green', fillAlpha: 0.28, color: 'green', width: 2 });
          S.line(p.x, p.y, best.q[0], best.q[1], { color: 'muted', width: 1.1, dash: [3, 4] });
          S.dot(best.q[0], best.q[1], { color: 'orange', r: 3.5, label: 'q', labelPos: 's' });
          S.corner(`${cover.length}${bad && cover.length >= 900 ? '+' : ''} sets in the subcover`, 'tl', { color: 'orange', weight: 600 });
          if (bad) S.corner('radii → 0 near p: no finite subcover', 'bl', { color: 'red', weight: 600 });
          else S.corner('U ∩ W = ∅', 'bl', { color: 'green', weight: 600 });
        });
        v.legend([['accent', '$K$', { area: true }], ['orange', '$W=\\bigcup V_{q_i}$', { area: true }], ['green', '$U=\\bigcap U_{q_i}$', { area: true }]]);
        v.readout(() => {
          if (!cache) return '';
          const { cover, best } = cache;
          return mode.value === 'bad'
            ? `After ${cover.length} sets the common neighbourhood of $p$ has radius $${tnum(best.r)}$, and each refinement towards $p$ halves it again. Every point near $p$ needs its own tiny $V_q$, so no finite family covers $K$, and $\\bigcap_q U_q=\\{p\\}$ is not open.`
            : `$N=${cover.length}$ discs $V_{q_1},\\dots,V_{q_N}$ cover $K$. $U=\\bigcap U_{q_i}$ is the disc of radius $\\min_i\\tfrac12 d(p,q_i)=${v.fix(best.r, 3)}$ about $p$, and it misses $W=\\bigcup V_{q_i}$.`;
        });
      },
    },
    // ------------------------------------------------------------ 2.5a
    {
      num: '2.5a',
      kind: 'Corollary',
      name: 'Compact subsets of Hausdorff spaces are closed',
      statement: String.raw`In a Hausdorff space every compact set is closed.`,
      idea: String.raw`By Theorem 2.5 each $p\notin K$ has a neighbourhood $U_p$ that misses $K$. So $K^c=\bigcup_{p\notin K}U_p$ is open. Without the Hausdorff property this can fail.`,
      caption: String.raw`Left: in the plane, every point $p\notin K$ gets a disc $U_p$ missing $K$ (drag $p$, or watch the discs fill $K^c$). Right: the *line with two origins* $0_a,0_b$ is not Hausdorff. There $K=[-1,1]$ (built with $0_a$) is compact, but every neighbourhood of $0_b$ meets $K$, however small $r$ is. So $K$ is not closed.`,
      deps: ['rca-2.5'],
      see: ['pma-2.34'],
      tags: ['Hausdorff', 'compactness'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.75, 1.75], equal: true, height: 330, axes: false, title: 'Hausdorff: $K^c=\\bigcup_{p\\notin K}U_p$ is open' });
        const Rt = v.stage({ x: [-2.1, 2.1], y: [-1.15, 1.2], height: 330, axes: false, title: 'line with two origins: $0_b\\in\\overline K\\setminus K$' });
        const r = v.slider('radius $r$ of the neighbourhood of $0_b$', 0.05, 1.5, 0.6, { step: 0.01 });
        const K = M.blob(0.1, -0.05, 0.95, 12, 0.3, 120);
        const rnd = M.rng(5); const P = [];
        while (P.length < 260) { const q = [rnd.uniform(-2.3, 2.3), rnd.uniform(-1.75, 1.75)]; if (!inPoly(q, K)) P.push([q[0], q[1], polyDist(q, K) / 2]); }
        const p = L.handle(1.45, 0.95, { color: 'gold', label: 'p', constrain: (x, y) => { if (inPoly([x, y], K) || polyDist([x, y], K) < 0.06) { const q = closestOnPoly([x, y], K), c = centroid(K); const d = [q[0] - c[0], q[1] - c[1]], l = Math.hypot(...d) || 1; return [q[0] + 0.08 * d[0] / l, q[1] + 0.08 * d[1] / l]; } return [x, y]; } });
        v.animate((t) => {
          const n = Math.min(P.length, Math.floor(P.length * t / 7));
          for (let i = 0; i < n; i++) L.circle(P[i][0], P[i][1], P[i][2], { fill: 'green', fillAlpha: 0.07, color: 'green', width: 0.8, alpha: 0.35 });
          L.poly(K, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          L.tex('K', 0.1, -0.05, { color: 'accent', size: 18 });
          const d = polyDist([p.x, p.y], K) / 2;
          L.circle(p.x, p.y, d, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2.2 });
          L.tex('U_p', p.x, p.y - d, { color: 'green', dy: 12, size: 14 });
          L.corner(`${n} neighbourhoods drawn`, 'bl', { color: 'muted' });
          // line with two origins
          const rr = r.value;
          Rt.line(-2.05, 0, 2.05, 0, { color: 'ink', width: 1.6 });
          Rt.line(-1, 0, 1, 0, { color: 'accent', width: 7, alpha: 0.55, cap: 'butt' });
          Rt.line(-rr, 0, rr, 0, { color: 'orange', width: 3.2, alpha: 0.95 });
          Rt.line(-Math.min(rr, 1), 0, Math.min(rr, 1), 0, { color: 'red', width: 3.2, alpha: 0.9 });
          // the two origins
          Rt.line(-0.18, 0.04, 0, 0.5, { color: 'muted', width: 1, dash: [2, 3] });
          Rt.line(0.18, 0.04, 0, 0.5, { color: 'muted', width: 1, dash: [2, 3] });
          Rt.dot(0, 0, { color: 'accent', r: 5.5 });
          Rt.dot(0, 0.5, { color: 'orange', r: 6.5 });
          Rt.tex('0_a\\in K', 0, 0, { color: 'accent', dy: 22, size: 14 });
          Rt.tex('0_b\\notin K', 0, 0.5, { color: 'orange', dy: -20, size: 14 });
          Rt.tex('K=[-1,1]', -1, 0, { color: 'accent', dy: -18, align: 'left', size: 13 });
          Rt.tex('(-r,0)\\cup\\{0_b\\}\\cup(0,r)', 0, -0.62, { color: 'orange', size: 14 });
          Rt.corner('N(0_b) ∩ K ≠ ∅ for every r > 0', 'bl', { color: 'red', weight: 600 });
        }, { period: 9, once: true });
        v.legend([['accent', '$K$', { area: true }], ['green', 'neighbourhoods $U_p$ missing $K$', { area: true }], ['orange', 'neighbourhood of $0_b$'], ['red', 'its overlap with $K$']]);
        v.readout(() => `Plane: $d(p,K)=${v.fix(polyDist([p.x, p.y], K), 3)}>0$, so $U_p$ (radius $\\tfrac12 d(p,K)$) misses $K$. Two origins: the neighbourhood of radius $r=${v.fix(r.value, 2)}$ meets $K$ in a set of length $${v.fix(2 * Math.min(r.value, 1), 2)}>0$.`);
      },
    },
    // ------------------------------------------------------------ 2.5b
    {
      num: '2.5b',
      kind: 'Corollary',
      name: 'Closed ∩ compact is compact',
      statement: String.raw`If $F$ is closed and $K$ is compact in a Hausdorff space, then $F\cap K$ is compact.`,
      idea: String.raw`$K$ is closed by Corollary 2.5a, so $F\cap K$ is closed. It lies in the compact set $K$, so Theorem 2.4 makes it compact.`,
      caption: String.raw`$F$ is the unbounded region above a wavy curve: closed but not compact. $K$ is a closed disc (drag it). The green set $F\cap K$ is compact. Switch off "$F$ closed" (drop the curve itself): the gold points of $F\cap K$ then converge to a point of the curve that is no longer in $F\cap K$.`,
      deps: ['rca-2.5a', 'rca-2.4'],
      see: ['pma-2.35a'],
      tags: ['compactness', 'Hausdorff'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-1.95, 1.95], equal: true, height: 370, axes: false });
        const closedF = v.toggle('$F$ closed (curve included)', true);
        const lev = v.slider('height $c$ of the curve', -1.2, 1.2, 0.1, { step: 0.01 });
        const kc = S.handle(0.45, 0.2, { color: 'accent' });
        const rad = 1.1;
        const g = (x) => 0.55 * Math.sin(1.7 * x) + 0.18 * Math.sin(4.3 * x + 1) + lev.value;
        let st = {};
        v.render(() => {
          const top = 2.6;
          const [bx0, bx1] = S.bounds.x;
          S.between(() => top, g, bx0, bx1, { fill: 'orange', fillAlpha: 0.12, n: 300 });
          S.fn(g, { color: 'orange', width: closedF.value ? 2.4 : 1.6, dash: closedF.value ? null : [6, 5] });
          withDiscClip(S, kc.x, kc.y, rad, () => S.between(() => top, g, kc.x - rad - 0.05, kc.x + rad + 0.05, { fill: 'green', fillAlpha: 0.38, n: 200 }));
          S.circle(kc.x, kc.y, rad, { color: 'accent', width: 2.2 });
          // a point of the curve inside K, and a sequence of F∩K converging to it
          let xs = null, best = Infinity;
          for (let i = 0; i <= 400; i++) { const x = kc.x - rad + 2 * rad * i / 400; const d = Math.hypot(x - kc.x, g(x) - kc.y); if (d < rad * 0.92 && d < best) { best = d; xs = x; } }
          if (xs != null) {
            const ys = g(xs), pts = [];
            for (let n = 1; n <= 14; n++) { const y = ys + 0.55 / n; if (Math.hypot(xs - kc.x, y - kc.y) <= rad) pts.push([xs, y]); }
            S.dots(pts, { color: 'gold', r: 3.4 });
            S.dot(xs, ys, closedF.value ? { color: 'green', r: 5.5 } : { color: 'red', r: 5.5, hollow: true, width: 2.2 });
          }
          S.tex('F', bx0 + 0.35, 1.45, { color: 'orange', size: 20 });
          S.tex('K', kc.x + rad * 0.72, kc.y - rad * 0.72, { color: 'accent', size: 16, dx: 8, dy: 8 });
          S.text('F is unbounded — not compact', bx0 + 0.6, 1.47, { color: 'orange', size: 12 });
          st = { hit: xs != null };
          S.corner(!st.hit ? 'the curve misses K' : closedF.value ? 'F ∩ K closed in compact K ⇒ compact' : 'limit point not in F ∩ K ⇒ not compact', 'bl', { color: !st.hit ? 'muted' : closedF.value ? 'green' : 'red', weight: 600 });
        });
        v.legend([['orange', '$F=\\{y\\ge g(x)\\}$', { area: true }], ['accent', '$K$ (closed disc)'], ['green', '$F\\cap K$', { area: true }], ['gold', 'a sequence in $F\\cap K$', { dot: true }]]);
        v.readout(() => st.hit ? (closedF.value ? 'The sequence converges inside $F\\cap K$: the set is closed and contained in the compact disc, hence compact.' : 'Without its boundary curve $F$ is open; the sequence in $F\\cap K$ converges to a point outside $F\\cap K$, so $F\\cap K$ is not closed and cannot be compact.') : 'Move $K$ or the curve so that they overlap.');
      },
    },
    // ------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Compact sets with empty intersection',
      statement: String.raw`Let $\{K_\alpha\}$ be a collection of compact subsets of a Hausdorff space. If $\bigcap_\alpha K_\alpha=\emptyset$, then some finite subcollection also has empty intersection.`,
      idea: String.raw`Fix one member $K_1$. Each $K_\alpha$ is closed (2.5a), so the complements $K_\alpha^c$ are open, and since no point lies in every $K_\alpha$ they cover $K_1$. Compactness of $K_1$ gives finitely many $K_{\alpha_1}^c,\dots,K_{\alpha_n}^c$ covering it, and then $K_1\cap K_{\alpha_1}\cap\dots\cap K_{\alpha_n}=\emptyset$.`,
      caption: String.raw`Each row is one set of the family; the bottom row is the intersection of the rows above. In the compact family $K_t=[0,1]\setminus(t-r,t+r)$, drag $t_1$ in the top row and raise $m$: after a few rows the intersection is empty. The second family $F_t=(0,1]\setminus(\tfrac t2,\tfrac{3t}2)$, drawn on a log scale, also has empty total intersection, but its sets are not compact: the leftover piece near $0$ survives every finite choice.`,
      deps: ['rca-2.5a', 'rca-2.3'],
      see: ['pma-2.36'],
      tags: ['compactness', 'finite intersection'],
      viz(v) {
        const mode = v.select('', [{ value: 'cpt', label: '$K_t=[0,1]\\setminus(t-r,t+r)$' }, { value: 'bad', label: '$F_t=(0,1]\\setminus(\\tfrac t2,\\tfrac{3t}2)$' }], 'cpt');
        const m = v.slider('rows used $m$', 1, 13, 5, { int: true });
        const ROWS = 13, r = 0.075;
        const S = v.stage({ x: [-0.16, 1.04], y: [-1.9, ROWS + 0.6], height: 420, axes: false, full: true });
        const t1 = S.handle(0.47, ROWS - 1, { color: 'accent', label: 't₁', constrain: (x) => [Math.min(1, Math.max(0, x)), ROWS - 1] });
        const U0 = -7.2; // log10 of the left edge in log mode
        let st = {}, lastMode = 'cpt';
        const tval = () => mode.value === 'bad' ? Math.pow(10, U0 * (1 - t1.x)) : t1.x;
        const ts = () => {
          const t1v = tval();
          const out = [t1v];
          if (mode.value === 'cpt') {
            let x = 0;
            while (x <= 1 && out.length < 40) {
              if (x > t1v - r && x < t1v + r) { x = t1v + r; continue; }
              const t = x + 0.97 * r; out.push(t); x = t + 0.97 * r;
            }
          } else {
            let hi = 1; // cover [3t1/2, 1] from the right, then march towards 0
            const a = 1.5 * t1v;
            while (hi > a && out.length < 40) { const t = hi / 1.45; out.push(t); hi = t / 2 * 1.02; }
            let lo = t1v / 2;
            while (out.length < 40) { const t = lo / 1.45; out.push(t); lo = t / 2 * 1.02; }
          }
          return out;
        };
        v.render(() => {
          const bad = mode.value === 'bad';
          if (mode.value !== lastMode) { lastMode = mode.value; t1.x = bad ? (Math.log10(0.3) - U0) / -U0 : 0.47; }
          const T = ts().slice(0, m.value);
          // coordinates: linear in cpt mode, log10 in bad mode mapped to [0,1]
          const X = bad ? (x) => x <= 0 ? 0 : Math.max(0, (Math.log10(x) - U0) / -U0) : (x) => x;
          const gap = bad ? (t) => [t / 2, 1.5 * t] : (t) => [t - r, t + r];
          const removed = T.map(gap);
          for (let j = 0; j < ROWS; j++) {
            const y = ROWS - 1 - j;
            if (j >= T.length) { S.line(0, y, 1, y, { color: 'faint', width: 6, alpha: 0.35, cap: 'butt' }); continue; }
            const [a, b] = removed[j];
            S.line(0, y, X(Math.max(0, a)), y, { color: 'accent', width: 7, alpha: 0.75, cap: 'butt' });
            if (b < 1) S.line(X(b), y, 1, y, { color: 'accent', width: 7, alpha: 0.75, cap: 'butt' });
            S.line(X(Math.max(a, 0)), y, X(Math.min(b, 1)), y, { color: 'orange', width: 1.4, dash: [3, 3] });
            if (j > 0) S.dot(X(T[j]), y, { color: 'orange', r: 2.6 });
            S.text(`${bad ? 'F' : 'K'}${sub(j + 1)}`, -0.035, y, { align: 'right', color: j < m.value ? 'accent' : 'faint', math: true, size: 14 });
          }
          if (bad) S.dot(0, ROWS - 1, { color: 'red', r: 4, hollow: true });
          // intersection
          S.line(-0.15, -0.55, 1.03, -0.55, { color: 'faint', width: 1 });
          const yI = -1.25;
          let left = [[0, 1]];
          for (const [a, b] of removed) left = left.flatMap(([p, q]) => { const o = []; if (a > p) o.push([p, Math.min(q, a)]); if (b < q) o.push([Math.max(p, b), q]); return o.filter(([s, e]) => e > s + 1e-12); });
          if (bad) left = left.filter(([s]) => s >= 0);
          if (left.length) S.line(0, yI, 1, yI, { color: 'faint', width: 1 });
          for (const [s, e] of left) S.line(X(s), yI, Math.max(X(e), X(s) + 0.004), yI, { color: 'red', width: 7, cap: 'butt' });
          S.text('∩', -0.035, yI, { align: 'right', color: left.length ? 'red' : 'green', size: 18 });
          if (bad) { S.text('10⁻⁷', 0, yI - 0.42, { color: 'muted', size: 11, align: 'center' }); S.text('1', 1, yI - 0.42, { color: 'muted', size: 11, align: 'center' }); S.text('(log scale)', 0.5, yI - 0.42, { color: 'muted', size: 11, align: 'center' }); }
          else { S.text('0', 0, yI - 0.42, { color: 'muted', size: 11, align: 'center' }); S.text('1', 1, yI - 0.42, { color: 'muted', size: 11, align: 'center' }); }
          if (!left.length) S.text('∅  — the finite subfamily already has empty intersection', 0.5, yI, { color: 'green', weight: 600, size: 13, align: 'center' });
          st = { left, n: T.length, bad, need: bad ? Infinity : ts().length };
        });
        v.readout(() => {
          if (st.bad) { const s = st.left.length ? st.left[0][1] : 0; return `The ${st.n} sets chosen still share $(0,${tnum(s)}]$. Every finite subfamily leaves such a piece, although $\\bigcap_t F_t=\\emptyset$ — the $F_t$ are closed in $(0,1]$ but not compact.`; }
          return st.left.length ? `With $m=${st.n}$ rows the intersection is still nonempty; the complements of the later rows cover $K_1$ after ${st.need} rows.` : `$K_1\\cap\\dots\\cap K_{${st.n}}=\\emptyset$. The removed intervals (complements, dashed) cover $K_1$, so ${st.need} of the infinitely many $K_t$ suffice.`;
        });
      },
    },
    // ------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'Shrinking a neighbourhood of a compact set',
      statement: String.raw`Let $X$ be a locally compact Hausdorff space, $U\subset X$ open and $K\subset U$ compact. Then there is an open set $V$ with compact closure such that
$$K\subset V\subset\overline V\subset U.$$`,
      idea: String.raw`Local compactness covers $K$ by finitely many open sets with compact closures; their union $G$ has compact closure. If $U\ne X$, separate each point of $C=U^c$ from $K$ using 2.5, and use 2.6 to make finitely many of the separating sets cut $C\cap\overline G$ out of $\overline G$. What remains of $G$ is the required $V$.`,
      caption: String.raw`The space $X$ is the open rectangle (dashed edge not included). $U$ is the orange region and $K$ the blue blob — drag it and resize it. Each point of $K$ gets a ball of radius half its distance to $U^c$ and to the edge of $X$. Finitely many of them cover $K$, and their union $V$ (green) has compact closure inside $U$. Push $K$ out of $U$ and the construction breaks.`,
      deps: ['rca-2.5', 'rca-2.6', 'rca-2.3'],
      tags: ['locally compact', 'compactness'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.3, 3.3], y: [-2.15, 2.15], equal: true, height: 400, axes: false });
        const XR = [-3.1, -1.82, 3.1, 1.82];
        const U = M.blob(0.05, 0.0, 1.62, 9, 0.3, 150);
        const kc = S.handle(0.3, 0.05, { color: 'accent' });
        const sz = v.slider('size of $K$', 0.25, 1.3, 0.7, { step: 0.01 });
        let st = {}, ckey = '', cache = null;
        const edgeDist = (q) => Math.min(q[0] - XR[0], XR[2] - q[0], q[1] - XR[1], XR[3] - q[1]);
        v.render(() => {
          const K = M.blob(kc.x, kc.y, sz.value, 21, 0.32, 90);
          const key = `${kc.x.toFixed(4)}|${kc.y.toFixed(4)}|${sz.value}`;
          if (key !== ckey) {
            ckey = key;
            const pts = polySamples(K, 0.06);
            const outside = pts.filter((q) => !inPoly(q, U));
            const rho = (q) => 0.5 * Math.min(inPoly(q, U) ? polyDist(q, U) : 0, edgeDist(q));
            const cover = outside.length ? [] : greedyCover(pts, rho, 0.045);
            let gap = Infinity; for (const c of cover) gap = Math.min(gap, polyDist(c.q, U) - c.r);
            cache = { K, outside, cover, gap };
          }
          const { outside, cover, gap } = cache;
          S.rect(XR[0], XR[1], XR[2], XR[3], { fill: 'gray', fillAlpha: 0.05, color: 'muted', width: 1.3, dash: [6, 5] });
          S.poly(U, { fill: 'orange', fillAlpha: 0.1, color: 'orange', width: 1.8, dash: [7, 5] });
          if (cover.length) {
            S.rings(cover.map((c) => circlePts(c.q[0], c.q[1], c.r, 48)), { fill: 'green', fillAlpha: 0.25, stroke: false });
            for (const c of cover) S.circle(c.q[0], c.q[1], c.r, { color: 'green', width: 1, alpha: 0.6 });
          }
          S.poly(cache.K, { fill: outside.length ? 'red' : 'accent', fillAlpha: 0.3, color: outside.length ? 'red' : 'accent', width: 2 });
          if (outside.length) S.dots(outside, { color: 'red', r: 1.6 });
          S.tex('U', 1.55, 1.25, { color: 'orange', size: 18 });
          S.tex('X', XR[2] - 0.12, XR[3] - 0.12, { color: 'muted', size: 16, align: 'right', baseline: 'top' });
          if (cover.length) { const c0 = cover[0]; S.tex('V', c0.q[0] - c0.r * 0.62, c0.q[1] + c0.r * 0.62, { color: 'green', size: 17 }); S.tex('K', kc.x, kc.y, { color: 'accent', size: 17, dy: -18 }); }
          S.corner(outside.length ? 'K ⊄ U — no such V' : `${cover.length} balls: K ⊂ V ⊂ V̄ ⊂ U`, 'tl', { color: outside.length ? 'red' : 'green', weight: 600 });
          st = { n: cover.length, gap, bad: outside.length > 0 };
        });
        v.legend([['orange', 'open set $U$', { dash: true }], ['accent', 'compact $K$', { area: true }], ['green', '$V$ = finite union of balls', { area: true }]]);
        v.readout(() => st.bad ? 'Part of $K$ lies outside $U$; the hypothesis $K\\subset U$ fails and no $V$ can exist.'
          : `$V$ is a union of ${st.n} open balls; $\\overline V$ is the union of the closed balls, a compact set with $\\operatorname{dist}(\\overline V,U^c)\\ge ${v.fix(st.gap, 3)}>0$.`);
      },
    },
  ],
};
