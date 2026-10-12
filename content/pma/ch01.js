// Rudin, Principles of Mathematical Analysis — Chapter 1: The Real and Complex Number Systems

// ---------- helpers shared by several items of this chapter ----------
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
/** Nearest fraction m/n (reduced) to x with 1 ≤ n ≤ maxDen. */
function nearestFrac(x, maxDen) {
  let best = [Math.round(x), 1], bd = Math.abs(x - Math.round(x));
  for (let n = 2; n <= maxDen; n++) { const m = Math.round(x * n); const e = Math.abs(x - m / n); if (e < bd - 1e-12) { bd = e; best = [m, n]; } }
  const g = gcd(best[0], best[1]); return [best[0] / g, best[1] / g];
}
/** A horizontal number line at height y with ticks every `step`. */
function numberLine(s, y, o = {}) {
  const [a, b] = s.bounds.x, step = o.step ?? 1, k = (s.bounds.y[1] - s.bounds.y[0]) / s.height;
  s.line(a, y, b, y, { color: o.color || 'faint', width: 1.3 });
  if (o.ticks === false) return;
  for (let t = Math.ceil((a + 1e-9) / step) * step; t <= b - 1e-9; t += step) {
    s.line(t, y - 4 * k, t, y + 4 * k, { color: 'faint', width: 1.2 });
    if (o.labels !== false) s.text(v_fix(t), t, y, { dy: 13, align: 'center', color: 'muted', size: 11 });
  }
}
function v_fix(t) { const r = Math.round(t * 100) / 100; return String(r).replace('-', '−'); }

export default {
  book: 'pma',
  chapter: 1,
  title: 'The Real and Complex Number Systems',
  summary: String.raw`The rational numbers have gaps — no rational squares to $2$ — and the chapter repairs them. After axiomatising ordered sets, suprema and fields, Rudin states that there is an ordered field $\R$ with the least-upper-bound property (constructed from Dedekind cuts in the appendix), and derives the Archimedean property, the density of $\Q$, and the existence of $n$-th roots. The complex field is then built as pairs of reals, with conjugation, absolute value and the Schwarz inequality, and the chapter closes with Euclidean space $\R^k$ and its norm.`,
  items: [
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Order on a set',
      statement: String.raw`An **order** on a set $S$ is a relation, written $<$, with two properties:
(i) for every $x,y\in S$ exactly one of the statements $x<y$, $x=y$, $y<x$ is true (trichotomy);
(ii) if $x<y$ and $y<z$, then $x<z$ (transitivity).
A set together with an order is an **ordered set** (1.6). One reads $x<y$ as "$x$ precedes $y$", writes $y>x$ for the same thing, and $x\le y$ when $x<y$ or $x=y$. The rationals, with $r<s$ meaning that $s-r$ is positive, form an ordered set.`,
      idea: String.raw`Trichotomy is the demanding half: any two elements must be comparable. That is what gives words like "largest element" and "least upper bound" (1.8) a definite meaning. Comparing points of the plane coordinatewise is transitive but leaves many pairs incomparable, so it is not an order in this sense; the dictionary (lexicographic) order on the plane is.`,
      caption: String.raw`Drag $x$ and $y$ (they snap to a half-unit grid). Green is the set of points that come after $x$, orange the points before it. For the dictionary order these two regions and $\{x\}$ fill the plane; for coordinatewise comparison two red quadrants are left over — pairs for which trichotomy fails.`,
      deps: [],
      tags: ['order'],
      viz(v) {
        const mode = v.select('relation on $\\R^2$', [{ value: 'lex', label: 'dictionary order' }, { value: 'prod', label: 'coordinatewise $\\le$' }], 'lex');
        const S = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, height: 330, grid: true });
        const snap = (x, y) => [Math.round(x * 2) / 2, Math.round(y * 2) / 2];
        const X = S.handle(-0.5, 0.5, { color: 'ink', label: 'x', constrain: snap });
        const Y = S.handle(1.5, -1, { color: 'accent', label: 'y', constrain: snap });
        // -1: a<b, 0: equal, 1: a>b, null: incomparable
        const cmp = (a, b, m) => {
          if (a[0] === b[0] && a[1] === b[1]) return 0;
          if (m === 'lex') return a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : (a[1] < b[1] ? -1 : 1);
          if (a[0] <= b[0] && a[1] <= b[1]) return -1;
          if (a[0] >= b[0] && a[1] >= b[1]) return 1;
          return null;
        };
        let rel = null;
        v.render(() => {
          const { x: [x0, x1], y: [y0, y1] } = S.bounds; const a = X.x, b = X.y;
          if (mode.value === 'lex') {
            S.rect(a, y0, x1, y1, { fill: 'green', fillAlpha: 0.12, stroke: false });
            S.rect(x0, y0, a, y1, { fill: 'orange', fillAlpha: 0.12, stroke: false });
            S.line(a, b, a, y1, { color: 'green', width: 4 });
            S.line(a, y0, a, b, { color: 'orange', width: 4 });
            S.text('after x', x1 - 0.12, y1 - 0.22, { align: 'right', color: 'green', weight: 600 });
            S.text('before x', x0 + 0.12, y1 - 0.22, { align: 'left', color: 'orange', weight: 600 });
          } else {
            S.rect(a, b, x1, y1, { fill: 'green', fillAlpha: 0.14, stroke: false });
            S.rect(x0, y0, a, b, { fill: 'orange', fillAlpha: 0.14, stroke: false });
            S.rect(x0, b, a, y1, { fill: 'red', fillAlpha: 0.08, stroke: false });
            S.rect(a, y0, x1, b, { fill: 'red', fillAlpha: 0.08, stroke: false });
            S.line(a, b, x1, b, { color: 'green', width: 2 }); S.line(a, b, a, y1, { color: 'green', width: 2 });
            S.line(x0, b, a, b, { color: 'orange', width: 2 }); S.line(a, y0, a, b, { color: 'orange', width: 2 });
            S.text('after x', x1 - 0.12, y1 - 0.22, { align: 'right', color: 'green', weight: 600 });
            S.text('before x', x0 + 0.12, y0 + 0.22, { align: 'left', color: 'orange', weight: 600 });
            S.text('incomparable', x0 + 0.12, y1 - 0.22, { align: 'left', color: 'red', weight: 600 });
            S.text('incomparable', x1 - 0.12, y0 + 0.22, { align: 'right', color: 'red', weight: 600 });
          }
          rel = cmp([X.x, X.y], [Y.x, Y.y], mode.value);
          if (rel === null) S.line(X.x, X.y, Y.x, Y.y, { color: 'red', width: 1.5, dash: [4, 4] });
          else if (rel !== 0) S.arrow(...(rel < 0 ? [X.x, X.y, Y.x, Y.y] : [Y.x, Y.y, X.x, X.y]), { color: 'muted', width: 1.4, head: 8 });
          v.legend([['green', 'points $y$ with $x<y$', { area: true }], ['orange', 'points $y$ with $y<x$', { area: true }], ['red', 'neither (trichotomy fails)', { area: true }]]);
        });
        v.readout(() => {
          const p = (h) => `(${v.fix(h.x, 1)},\\,${v.fix(h.y, 1)})`;
          const head = `$x=${p(X)}$, $y=${p(Y)}$: `;
          if (rel === 0) return head + '$x=y$.';
          if (rel === null) return head + 'neither $x<y$, nor $x=y$, nor $y<x$ — coordinatewise comparison is transitive but **not** an order.';
          return head + (rel < 0 ? '$x<y$' : '$y<x$') + (mode.value === 'lex' ? ' — first coordinates decide, ties are broken by the second. Exactly one of the three cases always holds.' : ' (this pair happens to be comparable).');
        });
      },
    },

    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Least upper bound (supremum) and infimum',
      statement: String.raw`Let $S$ be an ordered set and $E\subset S$. If some $\beta\in S$ satisfies $x\le\beta$ for every $x\in E$, then $E$ is **bounded above** and $\beta$ is an **upper bound** of $E$ (1.7). Suppose $E$ is bounded above and $\alpha\in S$ has two properties:
(i) $\alpha$ is an upper bound of $E$;
(ii) no $\gamma<\alpha$ is an upper bound of $E$.
Then $\alpha$ is the **least upper bound** or **supremum** of $E$, written $\alpha=\sup E$. Reversing every inequality defines lower bounds, sets bounded below, and the **greatest lower bound** or **infimum** $\inf E$.`,
      idea: String.raw`Condition (ii) says that $\alpha$ cannot be lowered: every $\gamma<\alpha$ is beaten by some element of $E$. Two elements satisfying (i) and (ii) would each have to be $\le$ the other, so the supremum, when it exists, is unique. It need not belong to $E$ (Examples 1.9): $\sup(-1,1)=1\notin(-1,1)$ while $\sup[-1,1]=1\in[-1,1]$.`,
      caption: String.raw`Choose a set $E$ (blue) and drag the test point $\beta$. Elements of $E$ beyond $\beta$ turn red. The green ray is the set of *all* upper bounds; it starts exactly at $\sup E$. The orange ray is the set of lower bounds, ending at $\inf E$. Drop $\beta$ onto $\sup E$: it is an upper bound that cannot be lowered.`,
      deps: ['pma-1.5'],
      tags: ['supremum', 'order'],
      viz(v) {
        const N = 70;
        const SETS = {
          open: { label: '$(-1,1)$', iv: [-1, 1, true, true], sup: 1, inf: -1 },
          closed: { label: '$[-1,1]$', iv: [-1, 1, false, false], sup: 1, inf: -1 },
          recip: { label: '$\\{1/n\\}$', pts: v.M.range(N, 1).map((n) => 1 / n), sup: 1, inf: 0 },
          up: { label: '$\\{1-1/n\\}$', pts: v.M.range(N, 1).map((n) => 1 - 1 / n), sup: 1, inf: 0 },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, F]) => ({ value, label: F.label })), 'up');
        const s = v.stage({ x: [-1.75, 2.25], y: [-1.05, 1.05], height: 250, axes: false });
        const YU = 0.62, YLo = -0.62;
        const inE = (F, t) => F.iv ? ((F.iv[2] ? t > F.iv[0] : t >= F.iv[0]) && (F.iv[3] ? t < F.iv[1] : t <= F.iv[1])) : F.pts.some((p) => Math.abs(p - t) < 1e-12);
        const beta = s.handle(1.55, 0, {
          color: 'accent', label: 'β',
          constrain: (x) => { const F = SETS[which.value]; let t = v.M.clamp(x, -1.7, 2.2); if (Math.abs(t - F.sup) < 0.045) t = F.sup; return [t, 0]; },
        });
        let st = {};
        v.render(() => {
          const F = SETS[which.value], b = beta.x, [x0, x1] = s.bounds.x;
          numberLine(s, 0, { step: 0.5 });
          // rows of upper and lower bounds
          s.line(x0, YU, x1, YU, { color: 'grid', width: 1 }); s.line(x0, YLo, x1, YLo, { color: 'grid', width: 1 });
          s.text('upper bounds of E', x0 + 0.04, YU, { dy: -15, color: 'green', size: 11.5, weight: 600 });
          s.text('lower bounds of E', x0 + 0.04, YLo, { dy: 15, color: 'orange', size: 11.5, weight: 600 });
          s.line(F.sup, YU, x1 - 0.02, YU, { color: 'green', width: 5, cap: 'butt' });
          s.arrow(x1 - 0.2, YU, x1 - 0.01, YU, { color: 'green', width: 5, head: 11 });
          s.dot(F.sup, YU, { color: 'green', r: 5 });
          s.line(x0 + 0.02, YLo, F.inf, YLo, { color: 'orange', width: 5, cap: 'butt' });
          s.arrow(x0 + 0.2, YLo, x0 + 0.01, YLo, { color: 'orange', width: 5, head: 11 });
          s.dot(F.inf, YLo, { color: 'orange', r: 5 });
          s.line(F.sup, YU, F.sup, 0, { color: 'green', width: 1, dash: [3, 3] });
          s.line(F.inf, YLo, F.inf, 0, { color: 'orange', width: 1, dash: [3, 3] });
          s.tex('\\sup E', F.sup, YU, { dy: -16, color: 'green' });
          s.tex('\\inf E', F.inf, YLo, { dy: 17, color: 'orange' });
          // the set E, with the part beyond β in red
          if (F.iv) {
            const [a, c, oa, oc] = F.iv;
            s.interval(a, c, 0, { open: [oa, oc], color: 'accent', width: 6 });
            if (b < c) s.line(Math.max(a, b), 0, c, 0, { color: 'red', width: 6, cap: 'butt' });
          } else {
            s.dots(F.pts.filter((p) => p <= b).map((p) => [p, 0]), { r: 3.3, color: 'accent' });
            s.dots(F.pts.filter((p) => p > b).map((p) => [p, 0]), { r: 3.3, color: 'red' });
            for (const t of [F.sup, F.inf]) if (!inE(F, t)) s.dot(t, 0, { r: 4.5, hollow: true, color: t === F.sup && b < F.sup ? 'red' : 'accent', width: 1.8 });
          }
          // judge β
          if (b < F.sup - 1e-12) {
            let w; if (F.iv) w = b < F.iv[0] ? (F.iv[0] + F.iv[1]) / 2 : (b + F.iv[1]) / 2; else w = F.pts.filter((p) => p > b).sort((p, q) => q - p)[0];
            s.dot(w, 0, { color: 'red', r: 7, hollow: true, width: 2 });
            s.tex('x', w, 0, { dy: -17, color: 'red' });
            st = { kind: 'below', w };
            s.corner('β is not an upper bound: some x ∈ E exceeds it', 'tr', { color: 'red', weight: 600 });
          } else if (b > F.sup + 1e-12) {
            const g = (F.sup + b) / 2;
            s.dot(g, 0, { color: 'green', r: 5.5, hollow: true, width: 2 });
            s.tex('\\gamma', g, 0, { dy: -16, color: 'green' });
            s.arrow(b, 0.2, g, 0.2, { color: 'green', width: 1.5, head: 7 });
            st = { kind: 'above', g };
            s.corner('β is an upper bound, but not the least one', 'tr', { color: 'muted', weight: 600 });
          } else {
            s.dot(b, 0, { color: 'green', r: 12, hollow: true, width: 2 });
            st = { kind: 'sup' };
            s.corner('β = sup E', 'tr', { color: 'green', weight: 600 });
          }
          v.legend([['accent', 'the set $E$', { dot: true }], ['green', 'upper bounds of $E$'], ['orange', 'lower bounds of $E$'], ['red', 'points of $E$ exceeding $\\beta$', { dot: true }]]);
        });
        v.readout(() => {
          const F = SETS[which.value];
          const tail = `$\\sup E = ${v.fmt(F.sup)} ${inE(F, F.sup) ? '\\in' : '\\notin'} E$, $\\;\\inf E = ${v.fmt(F.inf)} ${inE(F, F.inf) ? '\\in' : '\\notin'} E$.`;
          if (st.kind === 'below') return `$\\beta = ${v.fix(beta.x, 3)}$ fails (i): $x = ${v.fix(st.w, 3)}\\in E$ is larger. ` + tail;
          if (st.kind === 'above') return `$\\beta = ${v.fix(beta.x, 3)}$ satisfies (i) but not (ii): $\\gamma = ${v.fix(st.g, 3)} < \\beta$ is also an upper bound. ` + tail;
          return 'Both (i) and (ii) hold: every $\\gamma<\\beta$ is exceeded by points of $E$. ' + tail;
        });
      },
    },

    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Definition',
      name: 'The least-upper-bound property',
      statement: String.raw`An ordered set $S$ has the **least-upper-bound property** if every nonempty subset $E\subset S$ that is bounded above has a least upper bound in $S$, i.e. $\sup E$ exists as an element of $S$.

The rationals do **not** have it (Example 1.1): $A=\{p\in\Q: p>0,\ p^2<2\}$ is bounded above in $\Q$, yet has no supremum in $\Q$.`,
      idea: String.raw`Rudin's opening example: no rational $p$ satisfies $p^2=2$, and for positive rational $p$ the rational $q=p-\frac{p^2-2}{p+2}=\frac{2p+2}{p+2}$ satisfies $q^2-2=\frac{2(p^2-2)}{(p+2)^2}$. So $q$ lies on the same side of $\sqrt2$ as $p$ and strictly closer to it: $A$ has no largest element, and $B=\{p\in\Q:p>0,\ p^2>2\}$ has no smallest. Since the rational upper bounds of $A$ are exactly the elements of $B$, there is no least one. Theorem 1.19 provides an ordered field where this gap is closed.`,
      caption: String.raw`Positive rationals $m/n$ are drawn at height $1/n$: blue if $p^2<2$, red if $p^2>2$. Drag $p_0$ to a rational; the gold iterates $p\mapsto\frac{2p+2}{p+2}$ (exact fractions) creep toward √2 from the side they start on. The lower panel zooms in around √2 at the scale of $p_k$: at every magnification blue points crowd in from the left, red from the right, and no rational fills the gap.`,
      deps: ['pma-1.8'],
      see: ['pma-1.19'],
      tags: ['supremum', 'rationals', 'completeness'],
      viz(v) {
        const R2 = Math.SQRT2;
        const top = v.stage({ x: [0.3, 2.7], y: [-0.13, 1.12], height: 260, axes: false, full: true, title: 'positive rationals $m/n$ at height $1/n$' });
        const bot = v.stage({ x: [R2 - 0.1, R2 + 0.1], y: [-3, 0.3], height: 230, axes: 'box', xticks: [], yticks: [[0, '1'], [-1, '10'], [-2, '100'], [-3, '1000'], [-4, '10⁴'], [-5, '10⁵'], [-6, '10⁶']], full: true, title: 'zoom on $\\sqrt2$ — vertical: denominator (log scale)' });
        const kS = v.slider('zoom on iterate $k$', 0, 9, 3, { int: true });
        const p0 = top.handle(1, 1, { color: 'gold', constrain: (x) => { const [m, n] = nearestFrac(v.M.clamp(x, 0.4, 2.6), 6); return [m / n, 1 / n]; } });
        const iterate = (m, n, k) => { const out = [[m, n]]; for (let i = 0; i < k; i++) { const [a, b] = out[out.length - 1]; const A = 2 * a + 2 * b, B = a + 2 * b, g = gcd(A, B); out.push([A / g, B / g]); } return out; };
        const ratDots = []; for (let n = 1; n <= 16; n++) for (let m = 1; m <= 3 * n; m++) if (gcd(m, n) === 1) ratDots.push([m, n]);
        let st = null;
        v.render(() => {
          const [m0, n0] = nearestFrac(p0.x, 6);
          const k = kS.value; const its = iterate(m0, n0, Math.max(k + 1, 6));
          // ---- top panel
          top.line(0.3, 0, 2.7, 0, { color: 'faint', width: 1.2 });
          for (const t of [0.5, 1, 1.5, 2, 2.5]) top.text(String(t), t, 0, { dy: 11, align: 'center', size: 10.5, color: 'muted' });
          for (const [m, n] of ratDots) { const p = m / n; if (p < 0.3 || p > 2.7) continue; top.line(p, 0, p, 1 / n, { color: m * m < 2 * n * n ? 'accent' : 'red', width: 1, alpha: 0.25 }); top.dot(p, 1 / n, { r: Math.max(1.8, 4.2 - n * 0.18), color: m * m < 2 * n * n ? 'accent' : 'red', ring: false }); }
          top.vline(R2, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 });
          top.tex('\\sqrt2\\notin\\Q', R2, 1.07, { color: 'ink', size: 13, align: 'left', dx: 5 });
          const ptsI = its.slice(0, k + 2).map(([a, b]) => [a / b, 1 / b]);
          for (let i = 0; i + 1 < ptsI.length; i++) top.arrow(ptsI[i][0], ptsI[i][1], ptsI[i + 1][0], ptsI[i + 1][1], { color: 'gold', width: 1.8, head: 7 });
          ptsI.forEach(([x, y], i) => { if (i) top.dot(x, y, { color: 'gold', r: i === k ? 5.5 : 4 }); });
          its.slice(1, Math.min(3, k + 2)).forEach(([a, b]) => { const L = a * a < 2 * b * b; top.tex(`\\tfrac{${a}}{${b}}`, a / b, 1 / b, { dx: L ? -9 : 9, dy: -4, align: L ? 'right' : 'left', color: 'gold', size: 12.5 }); });
          top.tex(n0 === 1 ? `p_0=${m0}` : `p_0=\\tfrac{${m0}}{${n0}}`, p0.x, p0.y, { dx: 12, dy: -6, align: 'left', color: 'gold', size: 13 });
          top.text('A: p² < 2', 0.36, 0.9, { color: 'accent', weight: 600, align: 'left' });
          top.text('B: p² > 2', 2.64, 0.9, { color: 'red', weight: 600, align: 'right' });
          // ---- zoom panel around √2 at the scale of p_k
          const [ak, bk] = its[k], [a1, b1] = its[k + 1];
          const h = 1.9 * Math.max(Math.abs(ak / bk - R2), Math.abs(a1 / b1 - R2), 1e-13);
          const lo = R2 - h, hi = R2 + h, W = hi - lo;
          const D = Math.round(v.M.clamp(Math.sqrt(260 / W), 8, 4e5));
          const yMin = -Math.log10(D) - 0.35;
          bot.setView([lo, hi], [yMin, 0.35]);
          const blue = [], red = [];
          for (let n = 1; n <= D && blue.length + red.length < 4000; n++) {
            for (let m = Math.ceil(lo * n); m <= Math.floor(hi * n); m++) { if (gcd(m, n) !== 1) continue; (m * m < 2 * n * n ? blue : red).push([m / n, -Math.log10(n)]); }
          }
          bot.dots(blue, { r: 2.6, color: 'accent' }); bot.dots(red, { r: 2.6, color: 'red' });
          bot.vline(R2, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 });
          bot.tex('\\sqrt2', R2, 0.35, { baseline: 'top', dy: 4, dx: 6, align: 'left', size: 13 });
          const P = [ak / bk, -Math.log10(bk)], Q = [a1 / b1, -Math.log10(b1)];
          bot.arrow(P[0], P[1], Q[0], Q[1], { color: 'gold', width: 2, head: 9 });
          bot.dot(P[0], P[1], { color: 'gold', r: 6 }); bot.dot(Q[0], Q[1], { color: 'gold', r: 6 });
          const side = ak * ak < 2 * bk * bk ? -1 : 1;
          bot.tex(`p_{${k}}`, P[0], P[1], { dx: 10 * side, dy: -12, align: side < 0 ? 'right' : 'left', color: 'gold' });
          bot.tex(`p_{${k + 1}}`, Q[0], Q[1], { dx: 10 * side, dy: 12, align: side < 0 ? 'right' : 'left', color: 'gold' });
          bot.corner(`window width ${v.fmt(W, 2)} · denominators ≤ ${D}`, 'br', { size: 11 });
          st = { ak, bk, a1, b1 };
          v.legend([['accent', '$A$: rationals with $p^2<2$', { dot: true }], ['red', '$B$: rationals with $p^2>2$ (the rational upper bounds of $A$)', { dot: true }], ['gold', 'iterates $p\\mapsto \\frac{2p+2}{p+2}$', { dot: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const { ak, bk, a1, b1 } = st, k = kS.value, d = ak * ak - 2 * bk * bk, inA = d < 0;
          return `$p_{${k}} = \\frac{${ak}}{${bk}}$, $\\;p_{${k}}^2-2 = \\frac{${d}}{${bk * bk}}${inA ? '<' : '>'}0$, so $p_{${k}}\\in ${inA ? 'A' : 'B'}$; the next iterate $\\frac{${a1}}{${b1}}$ is ${inA ? 'larger and still in $A$' : 'smaller and still in $B$'}. Hence $A$ has no largest element, $B$ has no smallest, and $\\sup A$ does not exist in $\\Q$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Infima from suprema',
      statement: String.raw`Let $S$ be an ordered set with the least-upper-bound property, and let $B\subset S$ be nonempty and bounded below. Let $L$ be the set of all lower bounds of $B$. Then $\alpha=\sup L$ exists in $S$ and $\alpha=\inf B$. In particular, every nonempty subset of $S$ that is bounded below has an infimum in $S$.`,
      idea: String.raw`$L$ is nonempty because $B$ is bounded below, and every element of $B$ is an upper bound of $L$; so the least-upper-bound property gives $\alpha=\sup L$. If $\gamma<\alpha$, then $\gamma$ is not an upper bound of $L$, hence $\gamma\notin B$; thus $\alpha\le x$ for all $x\in B$, i.e. $\alpha\in L$. And no $\beta>\alpha$ lies in $L$, since $\alpha$ bounds $L$ from above. So $\alpha$ is the greatest lower bound of $B$.`,
      caption: String.raw`Choose a set $B$ (blue; in the "finite" option drag its points) and drag the test point $\gamma$. The orange ray is $L$; its supremum $\alpha$ (green) is exactly $\inf B$. Push $\gamma$ past $\alpha$ and some point of $B$ turns red — $\gamma$ is no longer a lower bound. The last option takes $S=\Q$: there $L$ has no supremum and $\inf B$ does not exist.`,
      deps: ['pma-1.10', 'pma-1.8'],
      tags: ['supremum', 'infimum'],
      viz(v) {
        const R2 = Math.SQRT2;
        const which = v.select('$B$', [
          { value: 'tail', label: '$\\{\\frac14+\\frac1n\\}$' },
          { value: 'iv', label: '$[-\\frac12,\\frac32)$' },
          { value: 'fin', label: 'finite (drag)' },
          { value: 'Q', label: '$S=\\Q$, $B=\\{p>0:p^2>2\\}$' },
        ], 'tail');
        const s = v.stage({ x: [-1.65, 2.65], y: [-0.85, 0.8], height: 240, axes: false });
        const YB = 0.45, YL = -0.42;
        const gam = s.handle(1.0, YL, { color: 'orange', label: 'γ', constrain: (x) => [v.M.clamp(x, -1.55, 2.55), YL] });
        const fin = [0.2, 0.75, 1.5, 2.2].map((x) => s.handle(x, YB, { color: 'accent', r: 6, constrain: (x) => [v.M.clamp(x, -1.55, 2.55), YB] }));
        const ratsQ = []; for (let n = 1; n <= 9; n++) for (let m = -15 * n; m <= 26 * n; m++) if (gcd(m, n) === 1) ratsQ.push(m / n);
        let st = {};
        v.render(() => {
          const w = which.value, [x0, x1] = s.bounds.x, g = gam.x;
          fin.forEach((h) => { h.visible = w === 'fin'; });
          // rows and tick labels
          s.line(x0, YB, x1, YB, { color: 'faint', width: 1 });
          numberLine(s, YL, { step: 0.5 });
          s.text('B', x0 + 0.05, YB, { dy: -14, color: 'accent', weight: 700, size: 13 });
          s.text('L = lower bounds of B', x0 + 0.05, YL, { dy: -16, color: 'orange', weight: 600, size: 11.5 });
          let alpha = null, below = [];
          if (w === 'Q') {
            const Bq = ratsQ.filter((p) => p > R2 && p < x1), Lq = ratsQ.filter((p) => p < R2 && p > x0);
            s.dots(Bq.map((p) => [p, YB]), { r: 2.4, color: g > R2 ? 'red' : 'accent' });
            s.dots(Bq.filter((p) => p < g).map((p) => [p, YB]), { r: 2.4, color: 'red' });
            s.dots(Lq.map((p) => [p, YL]), { r: 2.2, color: 'orange' });
            s.dot(R2, YL, { hollow: true, color: 'red', r: 6, width: 2 });
            s.dot(R2, YB, { hollow: true, color: 'red', r: 6, width: 2 });
            s.line(R2, YL, R2, YB, { color: 'red', width: 1, dash: [3, 3] });
            s.tex('\\sqrt2\\notin\\Q', R2, 0.0, { dx: 6, align: 'left', color: 'red', size: 13 });
            below = Bq.filter((p) => p < g);
            s.corner('L has no least upper bound in ℚ, so inf B does not exist in ℚ', 'tr', { color: 'red', weight: 600 });
          } else {
            let Bpts = null, iv = null;
            if (w === 'tail') Bpts = v.M.range(80, 1).map((n) => 0.25 + 1 / n);
            if (w === 'fin') Bpts = fin.map((h) => h.x);
            if (w === 'iv') iv = [-0.5, 1.5];
            alpha = Bpts ? (w === 'tail' ? 0.25 : Math.min(...Bpts)) : iv[0];
            // L = (-∞, α]
            s.line(x0 + 0.02, YL, alpha, YL, { color: 'orange', width: 6, cap: 'butt' });
            s.arrow(x0 + 0.22, YL, x0 + 0.01, YL, { color: 'orange', width: 6, head: 11 });
            // B
            if (Bpts) {
              s.dots(Bpts.filter((p) => p >= g).map((p) => [p, YB]), { r: 3.4, color: 'accent' });
              below = Bpts.filter((p) => p < g);
              s.dots(below.map((p) => [p, YB]), { r: 3.4, color: 'red' });
            } else {
              s.interval(iv[0], iv[1], YB, { open: [false, true], color: 'accent', width: 6 });
              if (g > iv[0]) { s.line(iv[0], YB, Math.min(g, iv[1]), YB, { color: 'red', width: 6, cap: 'butt' }); below = [iv[0]]; }
            }
            // α = sup L = inf B
            s.line(alpha, YL, alpha, YB, { color: 'green', width: 1.6, dash: [4, 3] });
            s.dot(alpha, YL, { color: 'green', r: 6 });
            const inB = w !== 'tail';
            if (!inB) s.dot(alpha, YB, { color: 'green', r: 5.5, hollow: true, width: 2 });
            s.tex('\\alpha=\\sup L=\\inf B', alpha, (YB + YL) / 2 + 0.06, { dx: 8, align: 'left', color: 'green', size: 14 });
          }
          if (below.length) s.line(g, YL, g, YB, { color: 'red', width: 1.2, dash: [2, 3] });
          st = { alpha, below, w };
          v.legend([['accent', '$B$'], ['orange', '$L$ = lower bounds of $B$'], ['green', '$\\alpha=\\sup L$', { dot: true }], ['red', 'points of $B$ below $\\gamma$', { dot: true }]]);
        });
        v.readout(() => {
          const { alpha, below, w } = st; const g = gam.x;
          if (w === 'Q') return `In $\\Q$ the lower bounds of $B$ are the rationals $p$ with $p\\le0$ or $p^2<2$ — the set $A$ of Example 1.1 together with the non-positive rationals — and it has no supremum in $\\Q$. The hypothesis "least-upper-bound property" is essential.` + (below.length ? ` ($\\gamma = ${v.fix(g, 3)}\\notin L$.)` : ` ($\\gamma = ${v.fix(g, 3)}\\in L$.)`);
          const head = `$\\alpha = \\sup L = ${v.fix(alpha, 3)} = \\inf B$` + (w === 'tail' ? ' (not attained in $B$)' : ' (attained in $B$)') + '. ';
          return head + (below.length ? `$\\gamma = ${v.fix(g, 3)} > \\alpha$ is not a lower bound: some $x\\in B$ satisfies $x<\\gamma$.` : `$\\gamma = ${v.fix(g, 3)} \\le \\alpha$, so $\\gamma\\in L$.`);
        });
      },
    },

    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Definition',
      name: 'Field',
      statement: String.raw`A **field** is a set $F$ with two operations, addition and multiplication, obeying the following axioms for all $x,y,z\in F$.
- **Addition (A1–A5):** $x+y\in F$; $x+y=y+x$; $(x+y)+z=x+(y+z)$; there is an element $0$ with $0+x=x$ for every $x$; every $x$ has an element $-x$ with $x+(-x)=0$.
- **Multiplication (M1–M5):** $xy\in F$; $xy=yx$; $(xy)z=x(yz)$; there is an element $1\neq0$ with $1x=x$ for every $x$; every $x\neq0$ has an element $1/x$ with $x\cdot(1/x)=1$.
- **Distributive law (D):** $x(y+z)=xy+xz$.`,
      idea: String.raw`These are the familiar rules of arithmetic in $\Q$, abstracted so that every consequence (Propositions 1.14–1.16) holds in every field at once — $\Q$, $\R$, $\C$, and also finite examples such as $\Z_p=\{0,1,\dots,p-1\}$ with arithmetic mod a prime $p$. For composite $n$, $\Z_n$ satisfies every axiom except the existence of reciprocals (M5).`,
      deps: [],
      tags: ['field', 'axioms'],
    },

    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Proposition',
      name: 'Consequences of the addition axioms',
      statement: String.raw`Let $x,y,z$ be elements of a field. Using only the addition axioms one gets:
(a) Cancellation: $x+y=x+z$ forces $y=z$.
(b) The only $y$ with $x+y=x$ is $y=0$.
(c) The only $y$ with $x+y=0$ is $y=-x$.
(d) Taking the negative twice gives back the element: $-(-x)=x$.`,
      idea: String.raw`For (a), add $-x$ on the left and regroup: $y=0+y=(-x+x)+y=-x+(x+y)=-x+(x+z)=(-x+x)+z=0+z=z$. Then (b) is (a) with $z=0$, (c) is (a) with $z=-x$, and (d) is (c) applied to $-x$, since $(-x)+x=0$. Put differently: translation by $x$ is a bijection, undone by translation by $-x$.`,
      caption: String.raw`The clock $\Z_n$ satisfies the addition axioms. Turn the gold hand to choose $x$; the grey chords show the rotation $t\mapsto x+t$. Drag $y$ and $z$: their images never coincide unless $y=z$, and the green chord is the unique $t=-x$ sent to $0$. Switch to *capped* addition, which has no inverses, and land $y$, $z$ on the same image.`,
      deps: ['pma-1.12'],
      tags: ['field', 'algebra'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('points $n$', 3, 12, 8, { int: true });
        const op = v.select('operation', [{ value: 'mod', label: 'clock addition mod $n$' }, { value: 'cap', label: 'capped: $\\min(x+t,\\,n-1)$' }], 'mod');
        const s = v.stage({ x: [-1.45, 1.45], y: [-1.42, 1.42], equal: true, height: 380, axes: false, title: 'the clock $\\Z_n$' });
        const Mp = v.stage({ x: [-0.55, 2.55], y: [-8.3, 1.1], height: 380, axes: false, weight: 0.75, minWidth: 220, title: 'translate by $x$, then by $-x$', aspect: 0.92 });
        const ang = (k, n) => Math.PI / 2 - M.TAU * k / n;
        const pos = (k, n, r = 1) => [r * Math.cos(ang(k, n)), r * Math.sin(ang(k, n))];
        const idxOf = (x, y, n) => M.mod(Math.round((Math.PI / 2 - Math.atan2(y, x)) / M.TAU * n), n);
        const snap = (r) => (x, y) => pos(idxOf(x, y, nS.value), nS.value, r);
        const RX = 0.42;
        const hx = s.handle(...pos(3, 8, RX), { color: 'gold', constrain: snap(RX) });
        const hy = s.handle(...pos(1, 8), { color: 'accent', constrain: snap(1) });
        const hz = s.handle(...pos(6, 8), { color: 'orange', constrain: snap(1) });
        let st = {};
        const chord = (a, b, n, st2) => {
          const P = pos(a, n, 0.97), Q = pos(b, n, 0.97);
          if (a === b) { const c = pos(a, n, 0.86); s.circle(c[0], c[1], 0.1, { color: st2.color, width: st2.width ?? 1.2, alpha: st2.alpha }); return; }
          s.arrow(P[0], P[1], Q[0], Q[1], { head: 9, ...st2 });
        };
        v.render(() => {
          const n = nS.value;
          for (const [h, r] of [[hx, RX], [hy, 1], [hz, 1]]) { const p = pos(idxOf(h.x, h.y, n), n, r); h.x = p[0]; h.y = p[1]; }
          const x = idxOf(hx.x, hx.y, n), y = idxOf(hy.x, hy.y, n), z = idxOf(hz.x, hz.y, n);
          const add = op.value === 'mod' ? (a, t) => (a + t) % n : (a, t) => Math.min(a + t, n - 1);
          s.circle(0, 0, 1, { color: 'faint', width: 1.2 });
          s.circle(0, 0, RX, { color: 'faint', width: 1, dash: [3, 4] });
          // all chords t -> x ⊕ t
          for (let t = 0; t < n; t++) if (t !== y && t !== z) chord(t, add(x, t), n, { color: 'faint', width: 1.3 });
          // inverse of x
          let inv = null; for (let t = 0; t < n; t++) if (add(x, t) === 0) inv = t;
          if (inv !== null && inv !== y && inv !== z) chord(inv, 0, n, { color: 'green', width: 2.4 });
          const xy = add(x, y), xz = add(x, z);
          chord(y, xy, n, { color: 'accent', width: 2.8 });
          chord(z, xz, n, { color: 'orange', width: 2.8 });
          const clash = xy === xz && y !== z;
          if (clash) { const p = pos(xy, n); s.circle(p[0], p[1], 0.13, { color: 'red', width: 2.5 }); }
          for (let k = 0; k < n; k++) {
            const p = pos(k, n), q = pos(k, n, 1.2);
            s.dot(p[0], p[1], { r: 4, color: 'ink' });
            s.text(String(k), q[0], q[1], { align: 'center', size: 13, weight: 600, color: k === inv ? 'green' : 'muted' });
          }
          if (inv !== null) { const q = pos(inv, n, 1.2); s.tex('-x', q[0], q[1], { dy: 15, color: 'green', size: 12 }); }
          s.arrow(0, 0, hx.x * 0.93, hx.y * 0.93, { color: 'gold', width: 3, head: 9 });
          { const q = pos(x, n, RX + 0.17); s.tex('x', q[0], q[1], { color: 'gold', size: 16 }); }
          { const q = pos(y, n, 0.8); s.tex('y', q[0], q[1], { color: 'accent', size: 16, dx: y === z ? -7 : 0 }); }
          { const q = pos(z, n, 0.8); s.tex('z', q[0], q[1], { color: 'orange', size: 16, dx: y === z ? 7 : 0 }); }
          s.dot(0, 0, { r: 3.5, color: 'gold' });
          if (clash) s.corner('x ⊕ y = x ⊕ z with y ≠ z: cancellation fails', 'tl', { color: 'red', weight: 600 });
          else if (op.value === 'cap' && inv === null) s.corner('no t with x ⊕ t = 0: axiom (A5) fails', 'tl', { color: 'red', weight: 600 });
          else s.corner(op.value === 'mod' ? 'rotation by x is a bijection' : 'capped addition', 'tl', { color: 'muted', weight: 600 });
          // mapping panel: t -> x ⊕ t -> (−x) + (x ⊕ t)
          Mp.setView([-0.55, 2.55], [-n - 0.3, 1.1]);
          const yy = (t) => -t - 0.5;
          const back = inv !== null ? (u) => add(inv, u) : null;
          const cols = back ? 3 : 2;
          for (let t = 0; t < n; t++) {
            const col = t === y ? 'accent' : t === z ? 'orange' : 'faint', w = t === y || t === z ? 2.6 : 1.3;
            Mp.line(0.08, yy(t), 0.92, yy(add(x, t)), { color: clash && add(x, t) === xy && (t === y || t === z) ? 'red' : col, width: w });
            if (back) Mp.line(1.08, yy(add(x, t)), 1.92, yy(back(add(x, t))), { color: col === 'faint' ? 'faint' : 'green', width: w, dash: col === 'faint' ? null : [5, 3] });
          }
          for (let c = 0; c < cols; c++) for (let t = 0; t < n; t++) { Mp.dot(c, yy(t), { r: 3.5, color: 'ink' }); if (c === 0) Mp.text(String(t), -0.1, yy(t), { align: 'right', size: 11, color: 'muted' }); if (c === cols - 1) Mp.text(String(t), c + 0.1, yy(t), { align: 'left', size: 11, color: 'muted' }); }
          Mp.tex('t', 0, 0.55, { size: 14, color: 'muted' });
          Mp.tex('x+t', 1, 0.55, { size: 14, color: 'muted' });
          if (back) Mp.tex('-x+(x+t)', 2, 0.55, { size: 13, color: 'green' });
          else Mp.text('no −x: cannot undo', 2.05, -n / 2, { color: 'red', weight: 600, size: 12, align: 'center' });
          st = { n, x, y, z, xy, xz, inv, clash };
          v.legend([['accent', '$y\\mapsto x+y$'], ['orange', '$z\\mapsto x+z$'], ['green', '$-x\\mapsto 0$'], ['faint', 'other values of $t\\mapsto x+t$']]);
        });
        v.readout(() => {
          const { n, x, y, z, xy, xz, inv, clash } = st;
          if (op.value === 'mod') return `In $\\Z_{${n}}$: $x+y = ${x}+${y} = ${xy}$ and $x+z = ${x}+${z} = ${xz}$` + (y === z ? ' (here $y=z$).' : ' — different, as (a) demands.') + ` Rotating back by $-x = ${inv}$ recovers $y$ and $z$; the unique solution of $x+t=0$ is $t=${inv}$, and of $x+t=x$ is $t=0$.`;
          if (clash) return `Capped addition: $x\\oplus y = x\\oplus z = ${xy}$ although $y=${y}\\neq z=${z}$. Without an inverse of $x$ the proof of (a) breaks down at its first step.`;
          return `Capped addition: $x\\oplus y = ${xy}$, $x\\oplus z = ${xz}$. ` + (inv === null ? `Nothing is sent to $0$, so $x=${x}$ has no negative. Drag $y$ and $z$ both into $\\{${n - 1 - x},\\dots,${n - 1}\\}$ to make them collide.` : 'With $x=0$ the map is the identity.');
        });
      },
    },

    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Proposition',
      name: 'Consequences of the multiplication axioms',
      statement: String.raw`Let $x,y,z$ be elements of a field with $x\neq0$. The multiplication axioms give:
(a) Cancellation: $xy=xz$ forces $y=z$.
(b) The only $y$ with $xy=x$ is $y=1$.
(c) The only $y$ with $xy=1$ is $y=1/x$.
(d) The reciprocal of $1/x$ is $x$ itself: $1/(1/x)=x$.`,
      idea: String.raw`The proof is that of 1.14 with multiplication in place of addition: multiply $xy=xz$ on the left by $1/x$ and regroup, $y=1\cdot y=((1/x)x)y=(1/x)(xy)=(1/x)(xz)=z$. The hypothesis $x\neq0$ is exactly what axiom (M5) needs to supply $1/x$. So for $x\neq0$ the map $y\mapsto xy$ is a bijection of the field, undone by $y\mapsto(1/x)y$.`,
      caption: String.raw`The multiplication table of $\Z_n$; click a cell to choose the row $x$ and column $y$. The right panel draws row $x$ as the map $y\mapsto xy$. For prime $n$ every nonzero row is a permutation with exactly one green cell, the reciprocal $1/x$. For composite $n$, the row of a zero divisor repeats values (red), so $xy=xz$ with $y\neq z$ — and $1/x$ does not exist.`,
      deps: ['pma-1.12'],
      tags: ['field', 'algebra'],
      viz(v) {
        const nSel = v.select('', [5, 7, 11, 6, 8, 12].map((n) => ({ value: n, label: `$\\Z_{${n}}$` + (n === 5 ? ' (field)' : n === 6 ? ' (not a field)' : '') })), 7);
        const T = v.stage({ x: [-1.2, 7.2], y: [-7.2, 1.2], equal: true, height: 400, axes: false, weight: 1.5, title: 'multiplication table $xy \\bmod n$' });
        const Mp = v.stage({ x: [-0.6, 2.6], y: [-7.2, 1.2], height: 400, aspect: 1.3, axes: false, weight: 0.7, minWidth: 200, title: 'row $x$ as the map $y\\mapsto xy$' });
        let X = 3, Yc = 5;
        T.onClick((x, y) => { const n = nSel.value; const j = Math.floor(x), i = Math.floor(-y); if (i >= 0 && i < n) X = i; if (j >= 0 && j < n) Yc = j; });
        let st = {};
        v.render(() => {
          const n = nSel.value; X = Math.min(X, n - 1); Yc = Math.min(Yc, n - 1);
          T.setView([-1.2, n + 0.2], [-n - 0.2, 1.2]);
          Mp.setView([-0.6, 2.6], [-n - 0.2, 1.2]);
          const row = v.M.range(n).map((j) => (X * j) % n);
          const count = new Map(); row.forEach((r) => count.set(r, (count.get(r) || 0) + 1));
          const fs = n > 9 ? 11.5 : 13.5;
          T.rect(0, -X - 1, n, -X, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          T.rect(Yc, -n, Yc + 1, 0, { fill: 'accent', fillAlpha: 0.06, stroke: false });
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const val = (i * j) % n;
            if (val === 0) T.rect(j, -i - 1, j + 1, -i, { fill: 'faint', fillAlpha: 0.16, stroke: false });
            if (i === X && val === 1) T.rect(j, -i - 1, j + 1, -i, { fill: 'green', fillAlpha: 0.4, stroke: false });
            T.text(String(val), j + 0.5, -i - 0.5, { align: 'center', size: fs, color: i === X ? 'ink' : 'muted', weight: i === X ? 600 : 400 });
          }
          if (X !== 0) row.forEach((r, j) => { if (count.get(r) > 1) T.rect(j + 0.06, -X - 0.94, j + 0.94, -X - 0.06, { color: 'red', width: 2 }); });
          for (let k = 0; k <= n; k++) { T.line(0, -k, n, -k, { color: 'grid', width: 1 }); T.line(k, 0, k, -n, { color: 'grid', width: 1 }); }
          T.rect(0, -n, n, 0, { color: 'faint', width: 1.2 });
          T.rect(Yc, -X - 1, Yc + 1, -X, { color: 'ink', width: 2.2 });
          for (let k = 0; k < n; k++) {
            T.text(String(k), k + 0.5, 0.5, { align: 'center', size: fs, weight: 700, color: k === Yc ? 'accent' : 'muted' });
            T.text(String(k), -0.5, -k - 0.5, { align: 'center', size: fs, weight: 700, color: k === X ? 'accent' : 'muted' });
          }
          T.text('y →', n * 0.5, 0.95, { align: 'center', size: 11, color: 'muted' });
          // the map y -> xy
          Mp.text('y', 0, 0.55, { align: 'center', math: true, color: 'muted' }); Mp.text('xy', 2, 0.55, { align: 'center', math: true, color: 'muted' });
          for (let j = 0; j < n; j++) {
            const r = row[j], bad = X !== 0 && count.get(r) > 1;
            Mp.line(0.15, -j - 0.5, 1.85, -r - 0.5, { color: bad ? 'red' : j === Yc ? 'accent' : 'faint', width: j === Yc ? 2.6 : 1.5 });
          }
          for (let j = 0; j < n; j++) {
            Mp.dot(0, -j - 0.5, { r: 4, color: j === Yc ? 'accent' : 'ink' }); Mp.text(String(j), -0.15, -j - 0.5, { align: 'right', size: 11.5, color: 'muted' });
            const hit = count.get(j) || 0;
            Mp.dot(2, -j - 0.5, { r: 4, color: hit === 0 ? 'faint' : hit > 1 && X !== 0 ? 'red' : j === 1 ? 'green' : 'ink', hollow: hit === 0 });
            Mp.text(String(j), 2.15, -j - 0.5, { align: 'left', size: 11.5, color: 'muted' });
          }
          let inv = null; row.forEach((r, j) => { if (r === 1) inv = j; });
          let pair = null; if (X !== 0) for (let a = 0; a < n && !pair; a++) for (let b = a + 1; b < n; b++) if (row[a] === row[b]) { pair = [a, b]; break; }
          st = { n, X, Yc, inv, pair, val: row[Yc] };
          v.legend([['green', 'the cell $x\\cdot(1/x) = 1$', { area: true }], ['red', 'repeated value in row $x$', { area: true }], ['faint', 'value $0$', { area: true }]]);
        });
        v.readout(() => {
          const { n, X, Yc, inv, pair, val } = st;
          const head = `$x=${X}$, $y=${Yc}$: $\\;xy = ${val}$ in $\\Z_{${n}}$. `;
          if (X === 0) return head + 'Row $0$ is excluded by the hypothesis $x\\neq0$: $0\\cdot y = 0$ for every $y$.';
          if (pair) return head + `Row ${X} repeats: $${X}\\cdot${pair[0]} = ${X}\\cdot${pair[1]} = ${(X * pair[0]) % n}$ with $${pair[0]}\\neq${pair[1]}$, so cancellation fails; there is no $1$ in the row, i.e. $1/${X}$ does not exist and $\\Z_{${n}}$ is not a field.`;
          return head + `Row ${X} is a permutation, so $${X}y = ${X}z$ forces $y=z$. The unique solution of $${X}y=1$ is $y = ${inv} = 1/${X}$, and row ${inv} has its $1$ in column ${X}: $1/(1/x) = x$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16',
      kind: 'Proposition',
      name: 'Zero and sign rules in a field',
      statement: String.raw`For all elements $x,y$ of a field:
(a) $0\cdot x=0$;
(b) a product of two nonzero elements is nonzero: $x\neq0$ and $y\neq0$ imply $xy\neq0$;
(c) $(-x)y=-(xy)=x(-y)$;
(d) $(-x)(-y)=xy$.`,
      idea: String.raw`The distributive law does the work, with 1.14 to finish. $0x=(0+0)x=0x+0x$, so $0x=0$ by 1.14(b). If $x,y\neq0$ but $xy=0$, then $1=(1/y)(1/x)xy=(1/y)(1/x)\cdot0=0$, which is absurd. Next $xy+(-x)y=(x+(-x))y=0\cdot y=0$, so $(-x)y=-(xy)$ by 1.14(c); likewise for $x(-y)$. Finally $(-x)(-y)=-[x(-y)]=-[-(xy)]=xy$ by (c) and 1.14(d).`,
      caption: String.raw`In $\R$ a product is a signed area. Drag the corner $(x,y)$: reflecting the rectangle across an axis flips the sign of its area, so the two upper rectangles cancel — that is $xy+(-x)y=(x+(-x))y=0\cdot y=0$, the heart of (c). Reflect twice and the sign comes back, (d). Drag onto an axis for (a) and (b).`,
      deps: ['pma-1.12', 'pma-1.14'],
      tags: ['field', 'algebra'],
      viz(v) {
        const L = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 360, title: 'products as signed areas' });
        const R = v.stage({ x: [0.3, 5.7], y: [-4, 4], height: 360, aspect: 0.92, axes: false, weight: 0.65, minWidth: 220, title: 'the four products, and $xy+(-x)y$' });
        const P = L.handle(1.6, 1.1, { color: 'ink', constrain: (x, y) => [Math.abs(x) < 0.06 ? 0 : x, Math.abs(y) < 0.06 ? 0 : y] });
        let st = {};
        v.render(() => {
          const x = P.x, y = P.y;
          const quads = [[1, 1, 'xy'], [-1, 1, '(-x)y'], [1, -1, 'x(-y)'], [-1, -1, '(-x)(-y)']];
          for (const [sx, sy, name] of quads) {
            const w = sx * x, h = sy * y, A = w * h, main = sx === 1 && sy === 1;
            const col = A > 0 ? 'blue' : A < 0 ? 'red' : 'faint';
            L.rect(0, 0, w, h, { fill: col, fillAlpha: main ? 0.3 : 0.15, color: col, width: main ? 2.2 : 1.4, dash: main ? null : [5, 4] });
            if (Math.abs(w) > 0.35 && Math.abs(h) > 0.3) L.tex(name, w / 2, h / 2, { color: col, size: 14 });
          }
          L.dot(-x, y, { r: 3, color: 'muted' }); L.dot(x, -y, { r: 3, color: 'muted' }); L.dot(-x, -y, { r: 3, color: 'muted' });
          L.tex('(x,y)', x, y, { dx: 10, dy: -12, align: 'left', size: 13 });
          // ledger
          const vals = [x * y, -x * y, -x * y, x * y];
          const m = Math.max(1, Math.abs(x * y)) * 1.7;
          R.setView([0.3, 5.7], [-m, m]);
          R.line(0.4, 0, 5.6, 0, { color: 'faint', width: 1 });
          vals.forEach((val, i) => R.rect(i + 1 - 0.32, 0, i + 1 + 0.32, val, { fill: val >= 0 ? 'blue' : 'red', fillAlpha: 0.55, stroke: false }));
          R.dot(5, 0, { r: 6, color: 'green' });
          R.line(4.55, -m, 4.55, m, { color: 'grid', width: 1 });
          const names = ['xy', '(-x)y', 'x(-y)', '(-x)(-y)', 'xy+(-x)y'];
          names.forEach((nm, i) => R.tex(nm, i + 1, i === 4 ? -m * 0.9 : m * 0.9, { size: 12, color: i === 4 ? 'green' : 'muted' }));
          vals.forEach((val, i) => R.text(v.fix(val, 2), i + 1, val, { dy: val >= 0 ? -10 : 10, align: 'center', size: 11, color: val >= 0 ? 'blue' : 'red' }));
          R.text('0', 5, 0, { dy: -14, align: 'center', size: 11, color: 'green', weight: 700 });
          st = { x, y };
          v.legend([['blue', 'positive product', { area: true }], ['red', 'negative product', { area: true }]]);
        });
        v.readout(() => {
          const { x, y } = st, f = (t) => v.fix(t, 2);
          let s = `$x = ${f(x)}$, $y = ${f(y)}$: $\\;xy = ${f(x * y)}$, $(-x)y = x(-y) = ${f(-x * y)}$, $(-x)(-y) = ${f(x * y)}$. $\\;xy + (-x)y = (x+(-x))\\,y = 0\\cdot y = 0$.`;
          if (x === 0 || y === 0) s += ' A side is $0$, so every product is $0$ — part (a).';
          else s += ' Both factors are nonzero, and so is the product — part (b).';
          return s;
        });
      },
    },
  ],
};
