// Microeconomics — Chapter 4 (part b): utility, marginal utility and the MRS (items 4.7–4.12)
import { clamp, bisect, prefs, onRay, rayLevel, icurve, drawLevel, tangent } from './ch04.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [3, 3] };
/** A square floor frame for a 3D utility plot: corners (±1, ±1) at height z, with axis names along two edges. */
function floor3(S3, z, [lx, ly] = ['x₁', 'x₂']) {
  const c = [[-1, -1, z], [1, -1, z], [1, 1, z], [-1, 1, z]];
  for (let i = 0; i < 4; i++) S3.line(c[i], c[(i + 1) % 4], { color: 'faint', width: 1 });
  S3.text(lx, [0, -1.2, z], { color: 'muted', math: true }); S3.text(ly, [-1.2, 0, z], { color: 'muted', math: true });
}
/** Log-spaced samples of [a, b]. */
function logspace(a, b, n) { const out = []; for (let i = 0; i <= n; i++) out.push(a * (b / a) ** (i / n)); return out; }

export default {
  collection: 'micro',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Definition', name: 'Utility function (ordinal utility)',
      statement: String.raw`A **utility function** $u : X \to \R$ **represents** the preference $\succsim$ if for all bundles $x, y$,
$$x \succsim y \iff u(x) \ge u(y).$$
Indifference curves are then the level sets $\{u = c\}$, and the preferred set of $a$ is $\{u \ge u(a)\}$. Utility in this sense is **ordinal**: if $u$ represents $\succsim$ and $g$ is strictly increasing on the range of $u$, then $g \circ u$ represents $\succsim$ too, and any two representations are related in this way. Only the ranking is meaningful, not the size of utility differences or ratios. A preference that has a utility representation is necessarily complete and transitive.`,
      idea: String.raw`If $g$ is strictly increasing then $u(x) \ge u(y) \iff g(u(x)) \ge g(u(y))$, so the transformed function ranks every pair the same way and has the same level sets, merely with new labels $g(c)$. Conversely, if $u$ and $w$ both represent $\succsim$, then $u(x) = u(y)$ exactly when $w(x) = w(y)$, so $g = w \circ u^{-1}$ is well defined on the range of $u$, and it is increasing because both functions order bundles alike. Completeness and transitivity are inherited from the order of the real numbers, which is why they are necessary (4.3). Whether they are sufficient is the question answered in 4.8.`,
      caption: String.raw`The left panel is the surface $z = g(u(x_1, x_2))$ for $u = \sqrt{x_1x_2}$ (drag to rotate), with its contour lines on the surface and projected onto the floor; the right panel is the indifference map with each curve labelled by its value of $g(u)$. Switch the transform $g$: the surface warps and the labels change, but the curves stay exactly where they are. Drag $P$, $Q$ and $R$ and compare their rankings under $u$ and under $g(u)$; the non-monotone $(u - 2.5)^2$ merges curves and breaks the ranking.`,
      deps: ['micro-4.3', 'micro-4.4'], refs: ['Varian Ch. 4'], tags: ['utility'],
      credit: 'Vilfredo Pareto, 1906; John Hicks & Roy Allen, 1934',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ordinal_utility' },
      viz(v) {
        const G = {
          id: { label: '$u$', tex: 'u', g: (u) => u },
          ln: { label: '$\\ln u$', tex: '\\ln u', g: (u) => Math.log(u) },
          cube: { label: '$u^3$', tex: 'u^3', g: (u) => u ** 3 },
          sqrt: { label: '$\\sqrt{u}$', tex: '\\sqrt{u}', g: (u) => Math.sqrt(u) },
          fold: { label: '$(u - 2.5)^2$', tex: '(u-2.5)^2', g: (u) => (u - 2.5) ** 2, bad: true },
        };
        const which = v.select('transform $g$', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'ln');
        const lo = 0.25, hi = 5, U = (x, y) => Math.sqrt(Math.max(x, 0) * Math.max(y, 0)), LV = [1, 1.5, 2, 2.5, 3, 3.5, 4];
        const S3 = v.stage3d({ range: 1.45, height: 380, yaw: -0.62, pitch: 0.42, axes: false, title: 'the surface $z = g(u)$', weight: 1.05 });
        const s = v.stage({ x: [0, 5.2], y: [0, 5.2], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', title: 'the indifference map, labelled by $g(u)$' });
        const box = (x, y) => [clamp(x, lo, hi), clamp(y, lo, hi)];
        const H = [['P', s.handle(1.2, 1.6, { color: 'gold', label: 'P', constrain: box })], ['Q', s.handle(3.4, 1.3, { color: 'teal', label: 'Q', constrain: box })], ['R', s.handle(2.6, 3.7, { color: 'pink', label: 'R', constrain: box })]];
        const X3 = (x) => (x - (lo + hi) / 2) / ((hi - lo) / 2), Z0 = -0.62;
        v.legend([['purple', 'indifference curves = contour lines'], ['gold', 'P', { dot: true }], ['teal', 'Q', { dot: true }], ['pink', 'R', { dot: true }]]);
        let st = {};
        v.render(() => {
          const o = G[which.value], g = o.g;
          let gmin = Infinity, gmax = -Infinity; for (let i = 0; i <= 200; i++) { const w = g(lo + ((hi - lo) * i) / 200); gmin = Math.min(gmin, w); gmax = Math.max(gmax, w); }
          const T = (w) => (g(w) - gmin) / (gmax - gmin), Z = (w) => Z0 + 0.1 + 1.25 * T(w);
          floor3(S3, Z0);
          S3.surface((x, y) => [X3(x), X3(y), Z(U(x, y))], [lo, hi], [lo, hi], { n: 26, colorFn: (x, y) => v.M.cmap(0.1 + 0.85 * T(U(x, y)), 'viridis'), alpha: 0.86 });
          for (const L of LV) {
            const xs = logspace(Math.max(lo, (L * L) / hi), Math.min(hi, (L * L) / lo), 40), up = [], dn = [];
            for (const x of xs) { const y = (L * L) / x; up.push([X3(x), X3(y), Z(L) + 0.012]); dn.push([X3(x), X3(y), Z0]); }
            S3.path(up, { color: 'purple', width: 2.2, bias: -0.04 }); S3.path(dn, { color: 'purple', width: 1.2, alpha: 0.55 });
          }
          for (const [n, h] of H) { const w = U(h.x, h.y), col = n === 'P' ? 'gold' : n === 'Q' ? 'teal' : 'pink'; S3.line([X3(h.x), X3(h.y), Z0], [X3(h.x), X3(h.y), Z(w)], { color: col, width: 1.5, dash: true, bias: -0.06 }); S3.dot([X3(h.x), X3(h.y), Z(w)], { r: 5.5, color: col, bias: -0.08 }); }
          // the map: the same curves whatever g is; only the labels change
          for (const L of LV) {
            const pair = o.bad && LV.some((M) => M !== L && Math.abs(g(M) - g(L)) < 1e-9);
            s.fn((x) => (L * L) / x, { domain: [(L * L) / 5.2, 5.2], color: 'purple', width: pair ? 2.6 : 1.8 });
            s.text(v.fix(g(L), 2), L, L, { dx: 5, dy: -9, color: pair ? 'red' : 'purple', size: 11.5, weight: 700, align: 'left' });
          }
          if (o.bad) s.corner('red labels: two different curves, one number', 'tr', { color: 'red', weight: 600 });
          const pts = H.map(([n, h]) => ({ n, u: U(h.x, h.y) })); pts.forEach((p) => { p.g = g(p.u); });
          st = { o, pts };
        });
        v.readout(() => {
          const { o, pts } = st, f = (x) => v.fix(x, 2);
          const byU = [...pts].sort((a, b) => a.u - b.u), byG = [...pts].sort((a, b) => a.g - b.g);
          const fmt = (arr, key) => arr.map((p) => `${p.n} (${f(p[key])})`).join(' < ');
          const same = pts.every((p) => pts.every((q) => Math.sign(p.u - q.u) === Math.sign(Math.round((p.g - q.g) * 1e9) / 1e9)));
          const verdict = same ? `**Same ranking**: $g$ is strictly increasing on $[${lo}, ${hi}]$, so $g\\circ u$ represents the same preferences with the same indifference curves; only the numbers on them changed.` : `**Ranking changed**: $(u - 2.5)^2$ is not increasing, so it gives the curves $u = 2$ and $u = 3$ (and other pairs) the same number and reverses the order below $u = 2.5$. It represents different preferences.`;
          return `By $u$: ${fmt(byU, 'u')}. By $g(u) = ${o.tex}$: ${fmt(byG, 'g')}. ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Theorem', name: 'Existence of a continuous utility function (Debreu)',
      statement: String.raw`Let $\succsim$ be a complete and transitive preference on $X = \R^n_+$ that is **continuous**: for every $a \in X$ the sets $\{x : x \succsim a\}$ and $\{x : a \succsim x\}$ are closed. Then $\succsim$ is represented by a continuous utility function $u : X \to \R$. (Debreu proved this for any connected, second-countable space of alternatives.) Continuity cannot be dropped: the **lexicographic** preference on $\R^2_+$, which compares good 1 first and consults good 2 only to break ties, is complete and transitive but has no utility representation at all, continuous or not.`,
      idea: String.raw`For monotone preferences there is a short proof. Each bundle $x$ is compared with the points $(t, \dots, t)$ of the diagonal. The sets $\{t : (t,\dots,t) \succsim x\}$ and $\{t : x \succsim (t,\dots,t)\}$ are closed by continuity, cover $[0, \infty)$ by completeness, and are both nonempty by monotonicity, so by connectedness (Rudin 2.47; equivalently the intermediate value theorem, 4.23) they meet. Monotonicity makes the meeting point $t(x)$ unique, and $u(x) = t(x)$ is a utility function: each indifference curve is labelled by where it crosses the diagonal. For lexicographic preferences every indifference class is a single point, so a utility function would have to assign to each vertical line $\{c\} \times \R_+$ its own interval $(u(c, 0), u(c, 1))$ of numbers, with disjoint intervals for different $c$; each such interval contains a rational (Rudin 1.20), giving an injection from the uncountable set of $c$'s into $\mathbb{Q}$, which is impossible.`,
      caption: String.raw`Drag the bundle $X$. For a continuous preference its indifference curve meets the diagonal at one point $(t, t)$, and $t$ is its utility; the faint curves are labelled the same way. On the right, the diagonal points at least as good as $X$ (green) and those no better than $X$ (red) form two closed intervals that cover the line and meet exactly at $t$. Switch to **lexicographic**: the indifference class of $X$ shrinks to $X$ itself, the green set loses an endpoint, and the two sets no longer meet. The gold bundles $Y_n$ are all better than $X$, yet their limit is worse, so the preferred set is not closed.`,
      deps: ['micro-4.6', 'micro-4.7', 'pma-4.23', 'pma-2.47', 'pma-1.20'], refs: ['Varian Ch. 4'], tags: ['utility', 'existence'],
      credit: 'Gérard Debreu, 1954',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lexicographic_preferences' },
      viz(v) {
        const FAM = { cd: { label: 'Cobb–Douglas', F: prefs('cd') }, comp: { label: 'perfect complements', F: prefs('comp') }, ql: { label: 'quasilinear', F: prefs('ql', { a: 2 }) }, lex: { label: 'lexicographic' } };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 390, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15 });
        const r = v.stage({ x: [-0.6, 10.6], y: [0, 4.6], height: 390, axes: false, title: 'points $(t, t)$ of the diagonal, compared with $X$' });
        const X = s.handle(6.5, 3, { color: 'accent', label: 'X', labelPos: 'ne', constrain: (x, y) => [clamp(x, 0.3, 9.6), clamp(y, 1.2, 9.6)] });
        v.legend([['green', 'at least as good as X'], ['red', 'no better than X'], ['purple', 'indifference set of X'], ['gold', 'Yₙ → Y', { dot: true }]]);
        const tStar = (F, x, y) => { const w = F.u(x, y); return bisect((t) => F.u(t, t) - w, 1e-6, 60); };
        let st = {};
        v.render(() => {
          const k = fam.value, lex = k === 'lex', x1 = X.x, x2 = X.y;
          s.line(0, 0, 10, 10, { color: 'faint', width: 1.4 });
          let t = null, top = null, bot = null;
          if (!lex) {
            const F = FAM[k].F; t = tStar(F, x1, x2);
            for (const tt of [2, 4, 6, 8]) { drawLevel(s, F, F.u(tt, tt), { color: v.color('purple', 0.3), width: 1.1 }); s.text(`u = ${tt}`, tt, tt, { dx: 7, dy: 9, color: 'purple', size: 10.5, align: 'left', alpha: 0.75 }); }
            drawLevel(s, F, F.u(x1, x2), { color: 'purple', width: 2.8 });
            s.line(0, 0, t, t, { color: 'red', width: 5, alpha: 0.7, cap: 'butt' }); s.line(t, t, 10, 10, { color: 'green', width: 5, alpha: 0.7, cap: 'butt' });
            s.dot(t, t, { r: 6.5, color: 'green' }); s.text(`(t, t),  t = ${v.fix(t, 2)} = u(X)`, t, t, { dx: -10, dy: -12, color: 'green', size: 12, weight: 700, align: 'right' });
            top = { a: t, b: 10, open: [false, false] }; bot = { a: 0, b: t, open: [false, false] };
          } else {
            s.rect(x1, 0, 10, 10, { fill: 'green', fillAlpha: 0.1, stroke: false }); s.rect(0, 0, x1, 10, { fill: 'red', fillAlpha: 0.07, stroke: false });
            s.line(x1, x2, x1, 10, { color: 'green', width: 3.2 }); s.line(x1, 0, x1, x2, { color: 'red', width: 2, dash: [5, 4] });
            const dRel = x1 > x2 ? 1 : x1 < x2 ? -1 : 0; // how (x1, x1) compares with X
            s.line(0, 0, x1, x1, { color: 'red', width: 5, alpha: 0.7, cap: 'butt' }); s.line(x1, x1, 10, 10, { color: 'green', width: 5, alpha: 0.7, cap: 'butt' });
            s.dot(x1, x1, { r: 5.5, color: dRel > 0 ? 'green' : dRel < 0 ? 'red' : 'purple' });
            s.dot(x1, x2, { r: 13, hollow: true, color: 'purple', width: 2.4 });
            s.text('indifference set = {X}', x1, x2, { dx: -18, dy: -16, color: 'purple', size: 11.5, weight: 700, align: 'right' });
            const ys = Math.max(0.45, x2 - 1.1);
            for (let n = 1; n <= 7; n++) s.dot(x1 + 2.6 / n, ys, { r: 6 - 0.45 * n, color: 'gold' });
            s.dot(x1, ys, { r: 5.5, hollow: true, color: 'red', width: 2.2 });
            s.text('Yₙ ≻ X', x1 + 2.6, ys, { dx: 9, color: 'gold', size: 12, weight: 700, align: 'left' });
            s.text('lim Yₙ ≺ X', x1, ys, { dx: -10, dy: 2, color: 'red', size: 12, weight: 700, align: 'right' });
            top = { a: x1, b: 10, open: [dRel < 0, false] }; bot = { a: 0, b: x1, open: [false, dRel > 0] };
          }
          // right: the two sets of t, on the number line
          r.line(0, 0.75, 10, 0.75, { color: 'faint', width: 1.2 });
          for (let i = 0; i <= 10; i += 2) { r.line(i, 0.68, i, 0.82, { color: 'muted', width: 1 }); r.text(String(i), i, 0.75, { dy: 14, align: 'center', color: 'muted', size: 10.5 }); }
          r.text('t', 10.4, 0.75, { color: 'muted', size: 14, math: true, align: 'left', dx: -4, dy: -10 });
          r.interval(top.a, top.b, 3.1, { color: 'green', width: 7, r: 5.5, open: top.open });
          r.text('{ t : (t, t) ≿ X }', 0, 3.1, { dy: -22, color: 'green', size: 12.5, weight: 700, align: 'left' });
          r.interval(bot.a, bot.b, 1.9, { color: 'red', width: 7, r: 5.5, open: bot.open });
          r.text('{ t : X ≿ (t, t) }', 0, 1.9, { dy: -22, color: 'red', size: 12.5, weight: 700, align: 'left' });
          if (!lex) { r.line(t, 0.6, t, 3.6, { color: 'green', width: 1.4, dash: [4, 3] }); r.text(`they meet only at t = ${v.fix(t, 2)}`, clamp(t, 2.4, 7.6), 4.15, { color: 'green', size: 12, weight: 700, align: 'center' }); }
          else { r.line(x1, 0.6, x1, 3.6, { color: 'red', width: 1.4, dash: [4, 3] }); r.text(x1 === x2 ? 'X lies on the diagonal' : 'one endpoint is missing: no meeting point', clamp(x1, 3.4, 6.6), 4.15, { color: 'red', size: 12, weight: 700, align: 'center' }); }
          st = { lex, t, x1, x2 };
        });
        v.readout(() => {
          const { lex, t, x1, x2 } = st, f = (x) => v.fix(x, 2);
          if (!lex) return `$X = (${f(x1)}, ${f(x2)}) \\sim (t, t)$ with $t = ${f(t)}$, so $u(X) = ${f(t)}$. The sets $\\{t : (t,t) \\succsim X\\} = [${f(t)}, \\infty)$ and $\\{t : X \\succsim (t,t)\\} = [0, ${f(t)}]$ are closed (continuity), cover the diagonal (completeness) and therefore meet (connectedness); monotonicity makes the meeting point unique. Doing this for every bundle defines a continuous utility function.`;
          const up = x1 > x2 ? `[${f(x1)}, \\infty)` : `(${f(x1)}, \\infty)`, dn = x1 > x2 ? `[0, ${f(x1)})` : `[0, ${f(x1)}]`;
          return `Lexicographic: $(t, t) \\succsim X$ iff $t > x_1$, or $t = x_1$ and $t \\ge x_2$. So the sets are $${up}$ and $${dn}$: one of them is not closed, and no point of the diagonal is indifferent to $X = (${f(x1)}, ${f(x2)})$. Worse, *no* utility function exists: it would map each vertical line to its own interval of values, uncountably many disjoint intervals each containing a rational number.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Definition', name: 'Marginal utility',
      statement: String.raw`For a differentiable utility function $u(x_1, x_2)$ the **marginal utility** of good $i$ is the partial derivative
$$MU_i(x) = \frac{\partial u}{\partial x_i}(x) = \lim_{\Delta \to 0} \frac{u(x + \Delta e_i) - u(x)}{\Delta},$$
the rate at which utility rises as the consumer gets more of good $i$ alone; for a small step, $\Delta u \approx MU_i\,\Delta x_i$. Marginal utility is **diminishing** in good $i$ when $\partial^2 u/\partial x_i^2 < 0$. Because utility is ordinal, the size of a marginal utility, and even whether it diminishes, depends on which representation is used: under $g \circ u$ it becomes $g'(u)\,MU_i$. The ratio $MU_1/MU_2$, however, is the same for every representation.`,
      idea: String.raw`Holding $x_2$ fixed slices the utility surface along a line; the slice is a function of one variable and $MU_1$ is its slope (Rudin 5.1), so one more unit of good 1 adds $\Delta u = \int_{x_1}^{x_1 + \Delta} MU_1 \approx MU_1\,\Delta$. For $\sqrt{x_1x_2}$ the slice is concave and the slope falls; for $x_1 + 2x_2$ the slice is a straight line and the slope is constant. The function $x_1x_2 = (\sqrt{x_1x_2})^2$ describes exactly the same preferences, yet its slices are straight lines: diminishing marginal utility is a property of the numbers, not of the preferences. What survives every increasing transformation is the ratio, since $g'(u)$ cancels in $g'(u)MU_1 / g'(u)MU_2$; that ratio is the marginal rate of substitution (4.11).`,
      caption: String.raw`Set the bundle with the sliders. In 3D the orange line slices the utility surface at the current $x_2$ (drag to rotate). The middle panel is that slice: its tangent slope is $MU_1$, and the gold step shows what $\Delta x_1$ more units actually add. Below, $MU_1$ is plotted along the slice; the gold area under it over the step equals the gold rise $\Delta u$. Compare $\sqrt{x_1x_2}$ with $x_1x_2$, which has the same indifference curves.`,
      deps: ['micro-4.7', 'pma-5.1'], refs: ['Varian Ch. 4'], tags: ['utility', 'marginal analysis'],
      credit: 'Hermann Heinrich Gossen, 1854; William Stanley Jevons, 1871',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_utility' },
      viz(v) {
        const FAM = {
          cd: { label: '$\\sqrt{x_1x_2}$', u: (x, y) => Math.sqrt(x * y), m1: (x, y) => 0.5 * Math.sqrt(y / x), m2: (x, y) => 0.5 * Math.sqrt(x / y), d2: (x, y) => -0.25 * Math.sqrt(y) * x ** -1.5, ymax: 2.2 },
          prod: { label: '$x_1x_2$', u: (x, y) => x * y, m1: (x, y) => y, m2: (x) => x, d2: () => 0, ymax: 11 },
          subs: { label: '$x_1 + 2x_2$', u: (x, y) => x + 2 * y, m1: () => 1, m2: () => 2, d2: () => 0, ymax: 2.4 },
          ql: { label: '$4\\ln x_1 + x_2$', u: (x, y) => 4 * Math.log(x) + y, m1: (x) => 4 / x, m2: () => 1, d2: (x) => -4 / (x * x), ymax: 6 },
        };
        const fam = v.select('utility $u$', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const x1 = v.slider('$x_1$', 0.5, 8.5, 3, { step: 0.05 });
        const x2 = v.slider('$x_2$', 0.5, 9.5, 6, { step: 0.05 });
        const dx = v.slider('step $\\Delta x_1$', 0.1, 1.5, 1, { step: 0.05 });
        const lo = 0.3, hi = 10;
        const S3 = v.stage3d({ range: 1.45, height: 330, yaw: -0.85, pitch: 0.38, axes: false, title: 'the surface and the slice $x_2 = \\bar x_2$' });
        const sl = v.stage({ x: [0, 10], y: [0, 1], height: 330, axes: 'box', xlabel: 'x₁', ylabel: 'u(x₁, x̄₂)', title: 'the slice: slope $= MU_1$' });
        const mu = v.stage({ x: [0, 10], y: [0, 2.2], height: 190, axes: 'box', xlabel: 'x₁', ylabel: 'MU₁', full: true, title: 'marginal utility along the slice; area under it $= \\Delta u$' });
        v.legend([['orange', 'slice / utility of good 1 alone'], ['green', 'tangent, slope MU₁'], ['gold', 'one step Δx₁ and its Δu'], ['blue', 'MU₁ along the slice']]);
        let rng = {}, st = {};
        v.render(() => {
          const k = fam.value, o = FAM[k], u = o.u, a = x1.value, b = x2.value, h = dx.value;
          if (rng.k !== k) { let mn = Infinity, mx = -Infinity; for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const w = u(lo + ((hi - lo) * i) / 30, lo + ((hi - lo) * j) / 30); mn = Math.min(mn, w); mx = Math.max(mx, w); } rng = { k, mn, mx }; }
          const { mn, mx } = rng, X3 = (x) => x / 5 - 1, Z = (w) => -0.62 + (1.3 * (w - mn)) / (mx - mn);
          const u0 = u(a, b), m1 = o.m1(a, b), u1 = u(a + h, b);
          // 3D
          floor3(S3, -0.7);
          S3.surface((x, y) => [X3(x), X3(y), Z(u(x, y))], [lo, hi], [lo, hi], { n: 22, colorFn: (x, y) => v.M.cmap(0.12 + 0.8 * (u(x, y) - mn) / (mx - mn), 'viridis'), alpha: 0.72 });
          const pts = []; for (let i = 0; i <= 60; i++) { const x = lo + ((hi - lo) * i) / 60; pts.push([X3(x), X3(b), Z(u(x, b)) + 0.01]); }
          S3.path(pts, { color: 'orange', width: 3.2, bias: -0.05 });
          S3.line([X3(lo), X3(b), -0.7], [X3(hi), X3(b), -0.7], { color: 'orange', width: 1.4, dash: true });
          const tl = 1.6; S3.line([X3(a - tl), X3(b), Z(u0 - m1 * tl)], [X3(a + tl), X3(b), Z(u0 + m1 * tl)], { color: 'green', width: 2.6, bias: -0.07 });
          S3.dot([X3(a), X3(b), Z(u0)], { r: 5.5, color: 'accent', bias: -0.09 });
          // the slice
          sl.setView([0, 10], [mn, mn + (mx - mn) * 1.04]);
          sl.fn((x) => u(x, b), { domain: [lo, hi], color: 'orange', width: 2.8 });
          sl.clip(() => sl.line(a - 2.4, u0 - m1 * 2.4, a + 2.4, u0 + m1 * 2.4, { color: 'green', width: 2.2 }));
          sl.line(a, u0, a + h, u0, { color: 'ink', width: 1.4 }); sl.line(a + h, u0, a + h, u1, { color: 'gold', width: 3 });
          sl.dot(a + h, u1, { r: 4.5, color: 'gold' }); sl.dot(a, u0, { r: 5.5, color: 'accent' });
          sl.text('Δu', a + h, (u0 + u1) / 2, { dx: 6, color: 'gold', size: 12, weight: 700, align: 'left' });
          sl.text('Δx₁', a + h / 2, u0, { dy: 11, color: 'ink', size: 11.5, align: 'center' });
          // marginal utility along the slice
          mu.setView([0, 10], [0, o.ymax]);
          const f1 = (x) => o.m1(x, b);
          mu.between(f1, () => 0, a, Math.min(a + h, hi), { fill: 'gold', fillAlpha: 0.45 });
          mu.clip(() => mu.fn(f1, { domain: [lo, hi], color: 'blue', width: 2.6 }));
          mu.dot(a, f1(a), { r: 5.5, color: 'accent', label: `MU₁ = ${v.fix(f1(a), 3)}`, labelPos: 'ne', math: false });
          st = { k, o, a, b, h, u0, u1, m1, m2: o.m2(a, b), d2: o.d2(a, b) };
        });
        v.readout(() => {
          const { k, a, b, h, u0, u1, m1, m2, d2 } = st, f = (x) => v.fix(x, 3);
          const dim = d2 < -1e-12 ? `**diminishing**: $\\partial^2u/\\partial x_1^2 = ${f(d2)} < 0$, so each further unit adds less` : '**constant** along the slice: $\\partial^2u/\\partial x_1^2 = 0$';
          let extra = '';
          if (k === 'prod') extra = ` Yet $x_1x_2 = (\\sqrt{x_1x_2})^2$ has the same indifference curves as $\\sqrt{x_1x_2}$, whose marginal utility diminishes: diminishing marginal utility is not a property of preferences. The ratio $MU_1/MU_2 = x_2/x_1 = ${f(b / a)}$ is the same for both.`;
          if (k === 'cd') extra = ` The ratio $MU_1/MU_2 = x_2/x_1 = ${f(m1 / m2)}$; compare $x_1x_2$.`;
          return `At $(x_1, x_2) = (${v.fix(a, 2)}, ${v.fix(b, 2)})$: $MU_1 = ${f(m1)}$ and $MU_2 = ${f(m2)}$. One more step $\\Delta x_1 = ${v.fix(h, 2)}$ raises $u$ from ${f(u0)} to ${f(u1)}, i.e. $\\Delta u/\\Delta x_1 = ${f((u1 - u0) / h)}$ against the slope ${f(m1)}. Marginal utility of good 1 is ${dim}.${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Paradox', name: 'Diamond–water paradox',
      statement: String.raw`Water is essential to life and diamonds are not, yet water is cheap and diamonds are dear: the things with the greatest value in use often have little value in exchange, and conversely. Adam Smith posed the puzzle in 1776. Marginalism resolves it: prices reflect **marginal** utility, the value of one more unit at the quantity actually consumed, not **total** utility. Water is so abundant that its marginal utility is tiny although its total utility is enormous; diamonds are scarce, so their marginal utility is high although their total contribution to welfare is modest.`,
      scope: String.raw`The curves are stylized and measured in money (willingness to pay), which presumes that the marginal utility of money is roughly constant over the amounts involved. A consumer buying both goods equates marginal utility per unit of money spent, so relative prices equal ratios of marginal utilities.`,
      idea: String.raw`Total utility is the integral of marginal utility, $TU(q) = \int_0^q MU$ (Rudin 6.20), so it is the whole area under the marginal-utility curve, while the price at which the consumer stops buying is the height of that curve at the last unit. With diminishing marginal utility (4.9), a good consumed in large quantities has a large area but a tiny height at the margin. Market expenditure is price times quantity, a thin rectangle for water and nearly the whole area for diamonds. Scarcity reverses the comparison: in a drought the marginal litre of water is worth more than the marginal carat of diamonds.`,
      caption: String.raw`Set the quantities of water and diamonds. Top: total value, with the tangent at the current quantity, whose slope is the marginal value. Bottom: marginal value, with the area under it (total value) shaded lightly and the expenditure rectangle, price $\times$ quantity with price equal to marginal value, shaded gold. Try **drought** and **diamond glut**.`,
      deps: ['micro-4.9', 'pma-6.20'], refs: ['Varian Ch. 4'], tags: ['utility', 'value'],
      credit: 'Adam Smith, 1776; resolved by Jevons, Menger and Walras, 1871–74',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Paradox_of_value' },
      viz(v) {
        const MUw = (q) => 40 * Math.exp(-q / 10), TUw = (q) => 400 * (1 - Math.exp(-q / 10));
        const MUd = (q) => 400 * Math.exp(-2 * q), TUd = (q) => 200 * (1 - Math.exp(-2 * q));
        const qw = v.slider('water per day (litres)', 1, 100, 80, { step: 0.5 });
        const qd = v.slider('diamonds (carats)', 0.02, 1.5, 0.1, { step: 0.01 });
        v.button('drought: 3 litres', () => qw.set(3));
        v.button('diamond glut: 1.5 ct', () => qd.set(1.5));
        v.button('back to normal', () => { qw.set(80); qd.set(0.1); });
        const tw = v.stage({ x: [0, 100], y: [0, 440], height: 220, axes: 'box', xlabel: 'litres', ylabel: 'value', title: 'water: total value $TU(q)$' });
        const td = v.stage({ x: [0, 1.5], y: [0, 440], height: 220, axes: 'box', xlabel: 'carats', ylabel: 'value', title: 'diamonds: total value $TU(q)$' });
        const mw = v.stage({ x: [0, 100], y: [0, 44], height: 220, axes: 'box', xlabel: 'litres', ylabel: 'per litre', title: 'water: marginal value $MU(q)$' });
        const md = v.stage({ x: [0, 1.5], y: [0, 440], height: 220, axes: 'box', xlabel: 'carats', ylabel: 'per carat', title: 'diamonds: marginal value $MU(q)$' });
        v.legend([['teal', 'water'], ['purple', 'diamonds'], ['green', 'tangent: slope = marginal value'], ['gold', 'spending = price × quantity', { area: true }]]);
        const panel = (T, Mg, TU, MU, q, col, X, unit) => {
          T.fn(TU, { domain: [0, X], color: col, width: 2.6 });
          const t = TU(q), m = MU(q), w = 0.22 * X;
          T.clip(() => T.line(q - w, t - m * w, q + w, t + m * w, { color: 'green', width: 2.4 }));
          T.line(q, 0, q, t, GUIDE); T.dot(q, t, { r: 5.5, color: col });
          T.text(`TU = ${v.fix(t, 1)}`, q, t, { dx: q > 0.6 * X ? -10 : 10, dy: t > 380 ? 16 : -14, color: col, size: 12, weight: 700, align: q > 0.6 * X ? 'right' : 'left' });
          Mg.between(MU, () => 0, 0, q, { fill: col, fillAlpha: 0.16 });
          Mg.rect(0, 0, q, m, { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1 });
          Mg.fn(MU, { domain: [0, X], color: col, width: 2.6 });
          Mg.line(q, 0, q, m, GUIDE); Mg.dot(q, m, { r: 5.5, color: col });
          const ymax = Mg.bounds.y[1], small = m < 0.04 * ymax;
          Mg.text(small ? `price ≈ MU = ${v.fix(m, 3)} ${unit} (too small to see)` : `price ≈ MU = ${v.fix(m, m < 10 ? 2 : 0)} ${unit}`, q, m, { dx: q > 0.55 * X ? -8 : 8, dy: small ? -22 : -12, color: col, size: 11.5, weight: 700, align: q > 0.55 * X ? 'right' : 'left' });
        };
        v.render(() => {
          panel(tw, mw, TUw, MUw, qw.value, 'teal', 100, 'per litre');
          panel(td, md, TUd, MUd, qd.value, 'purple', 1.5, 'per carat');
        });
        v.readout(() => {
          const a = qw.value, b = qd.value, f = (x) => v.fix(x, 1);
          const Tw = TUw(a), Td = TUd(b), Mw = MUw(a), Md = MUd(b), Ew = a * Mw, Ed = b * Md;
          const which = Mw * 1 > Md * 0.01 ? ' In this drought one litre is worth more than a hundredth of a carat.' : '';
          return `Total value: water ${f(Tw)} ${Tw > Td ? '≫' : '<'} diamonds ${f(Td)}. Marginal value: water ${v.fix(Mw, Mw < 1 ? 3 : 1)} per litre, diamonds ${f(Md)} per carat, so if prices track marginal values a carat costs ${v.fix(Md / Mw, 0)} times as much as a litre. Spending at those prices: water ${v.fix(Ew, 2)}, which is ${v.fix((100 * Ew) / Tw, 1)}% of its total value; diamonds ${f(Ed)}, ${v.fix((100 * Ed) / Td, 0)}% of theirs.${which}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11', kind: 'Definition', name: 'Marginal rate of substitution',
      statement: String.raw`The **marginal rate of substitution** of good 2 for good 1 at a bundle $x$ is the rate at which the consumer is willing to give up good 2 for one more unit of good 1 while staying indifferent: the magnitude of the slope of the indifference curve through $x$. If $u$ is continuously differentiable with $MU_2(x) \ne 0$, then near $x$ the indifference curve is the graph of a differentiable function $x_2 = \phi(x_1)$, and
$$\mathrm{MRS}_{12}(x) = -\phi'(x_1) = \frac{MU_1(x)}{MU_2(x)}.$$
The MRS does not depend on which utility function represents the preferences. Preferences have a **diminishing MRS** when it falls as $x_1$ rises along an indifference curve, which for monotone preferences is the case exactly when the curves are convex.`,
      idea: String.raw`Along an indifference curve $u(x_1, \phi(x_1)) = c$; differentiating gives $MU_1 + MU_2\,\phi' = 0$, and the implicit function theorem (Rudin 9.28) guarantees that $\phi$ exists and is differentiable when $MU_2 \neq 0$. Geometrically the gradient $(MU_1, MU_2)$ is perpendicular to the curve, and the tangent's slope is $-MU_1/MU_2$. A finite trade, giving up $\Delta x_2$ for $\Delta x_1$ along the curve, has the chord slope $\Delta x_2/\Delta x_1$, which tends to the MRS as the step shrinks. Under a transformation $g \circ u$ both marginal utilities are multiplied by $g'(u)$, which cancels: the MRS is a property of the preferences.`,
      caption: String.raw`Drag $P$ along its indifference curve; the slider picks the curve. The green tangent has slope $-\mathrm{MRS}$, and the orange gradient $(MU_1, MU_2)$ is perpendicular to it (both panels use equal scales). The gold chord is a real trade of $\Delta x_1$ for $\Delta x_2$ along the curve; shrink the step to watch its slope approach the MRS. On the right the MRS is plotted along the whole curve: falling for convex preferences, constant for perfect substitutes, rising for concave curves.`,
      deps: ['micro-4.4', 'micro-4.9', 'pma-9.28'], refs: ['Varian Ch. 4', 'CORE Unit 3'], tags: ['preferences', 'marginal analysis'],
      see: ['vcalc-2.15', 'vcalc-2.8'],
      credit: 'John Hicks & Roy Allen, 1934',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_rate_of_substitution' },
      viz(v) {
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd'), tex: '\\mathrm{MRS} = x_2/x_1' },
          ces: { label: 'CES, $\\rho = -1$', F: prefs('ces', { a: 0.5, r: -1 }), tex: '\\mathrm{MRS} = (x_2/x_1)^2' },
          subs: { label: 'perfect substitutes', F: prefs('subs', { a: 2, b: 3 }), tex: '\\mathrm{MRS} = 2/3' },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 4 }), tex: '\\mathrm{MRS} = 4/x_1' },
          concave: { label: 'concave curves', F: prefs('concave'), tex: '\\mathrm{MRS} = x_1/x_2' },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const lvl = v.slider('curve through $(t, t)$', 2, 7, 4, { step: 0.05 });
        const step = v.slider('step $\\Delta x_1$', 0.05, 2.5, 1.5, { step: 0.05 });
        const s = v.stage({ x: [0, 10], y: [0, 10], aspect: 1, axes: 'box', xlabel: 'x₁', ylabel: 'x₂' });
        const r = v.stage({ x: [0, 10], y: [0, 5], aspect: 1, axes: 'box', xlabel: 'x₁', ylabel: 'MRS', title: 'the MRS along this indifference curve' });
        const curL = () => { const F = FAM[fam.value].F; return F.u(lvl.value, lvl.value); };
        const P = s.handle(2.2, 6, { color: 'accent', label: 'P', labelPos: 'sw', constrain: (x, y) => onRay(FAM[fam.value].F, curL(), clamp(x, 0.2, 9.8), clamp(y, 0.2, 9.8)) || [x, y] });
        v.legend([['purple', 'indifference curve'], ['green', 'tangent, slope −MRS'], ['orange', 'gradient (MU₁, MU₂)'], ['gold', 'a finite trade along the curve']]);
        let st = {};
        v.render(() => {
          const o = FAM[fam.value], F = o.F, L = curL(), h = step.value;
          let p = onRay(F, L, P.x, P.y); if (p && (p[0] > 9.8 || p[1] > 9.8)) p = onRay(F, L, 3, 3); if (p) { P.x = p[0]; P.y = p[1]; }
          s.setTitle(`the indifference curve through $P$; ${'$' + o.tex + '$'}`);
          for (const t of [2, 3, 5, 6, 7, 8]) if (Math.abs(t - lvl.value) > 0.3) drawLevel(s, F, F.u(t, t), { color: v.color('purple', 0.25), width: 1 });
          drawLevel(s, F, L, { color: 'purple', width: 2.8 });
          const [g1, g2] = F.grad(P.x, P.y), mrs = g1 / g2;
          // tangent and gradient (equal scales, so the right angle shows)
          s.clip(() => s.line(P.x - 3, P.y + 3 * mrs, P.x + 3, P.y - 3 * mrs, { color: 'green', width: 2.2 }));
          const gl = Math.hypot(g1, g2), ex = (1.7 * g1) / gl, ey = (1.7 * g2) / gl;
          s.arrow(P.x, P.y, P.x + ex, P.y + ey, { color: 'orange', width: 2.4, head: 9 });
          s.text('(MU₁, MU₂)', P.x + ex, P.y + ey, { dx: 6, dy: -6, color: 'orange', size: 11.5, weight: 600, align: 'left' });
          const c = 0.32, tx = 1 / Math.hypot(1, mrs), ty = -mrs * tx, nx = g1 / gl, ny = g2 / gl;
          s.path([[P.x + c * tx, P.y + c * ty], [P.x + c * (tx + nx), P.y + c * (ty + ny)], [P.x + c * nx, P.y + c * ny]], { color: 'muted', width: 1.2 });
          // a finite trade along the curve
          const x2 = P.x + h, y2 = bisect((y) => F.u(x2, y) - L, 1e-9, P.y + 1e-9);
          let chord = null;
          if (y2 != null && x2 < 10) {
            chord = (P.y - y2) / h;
            s.line(P.x, P.y, x2, P.y, { color: 'ink', width: 1.4 }); s.line(x2, P.y, x2, y2, { color: 'red', width: 2.4 });
            s.line(P.x, P.y, x2, y2, { color: 'gold', width: 2.4, dash: [5, 4] }); s.dot(x2, y2, { r: 4.5, color: 'gold' });
            s.text(`+${v.fix(h, 2)}`, P.x + h / 2, P.y, { dy: -9, align: 'center', size: 11.5 });
            if ((P.y - y2) * s.scale > 16) s.text(`−${v.fix(P.y - y2, 2)}`, x2, (P.y + y2) / 2, { dx: 6, color: 'red', size: 11.5, align: 'left' });
          }
          // the MRS along the whole curve
          const pts = icurve(F, L, 10, 10, 260).filter((q) => q && q[0] <= 10 && q[1] <= 10 && q[0] > 0.05).sort((a, b) => a[0] - b[0]);
          const prof = pts.map(([x, y]) => { const [a1, a2] = F.grad(x, y); return [x, Math.min(a1 / a2, 6)]; });
          r.clip(() => r.path(prof, { color: 'purple', width: 2.6 }));
          r.line(P.x, 0, P.x, Math.min(mrs, 5), GUIDE);
          if (mrs <= 5) r.dot(P.x, mrs, { r: 6, color: 'accent', label: 'P', labelPos: 'ne' }); else r.arrow(P.x, 4.4, P.x, 4.95, { color: 'accent', width: 2.2 });
          if (chord != null && chord <= 5) r.dot(P.x + h / 2, chord, { r: 4.5, color: 'gold' });
          const n = prof.length, d = n > 4 ? prof[n - 1][1] - prof[0][1] : 0, flat = Math.abs(d) < 1e-6;
          r.corner(flat ? 'constant MRS' : d < 0 ? 'diminishing MRS: convex curve' : 'rising MRS: not convex', 'tr', { color: flat ? 'muted' : d < 0 ? 'green' : 'red', weight: 600 });
          st = { o, mrs, chord, g1, g2, h };
        });
        v.readout(() => {
          const { mrs, chord, g1, g2, h } = st, f = (x) => v.fix(x, 3);
          const ch = chord != null ? ` The trade of $\\Delta x_1 = ${v.fix(h, 2)}$ along the curve costs $\\Delta x_2 = ${f(chord * h)}$: a chord slope of ${f(chord)}, which approaches ${f(mrs)} as the step shrinks.` : '';
          return `At $P = (${v.fix(P.x, 2)}, ${v.fix(P.y, 2)})$: $MU_1 = ${f(g1)}$, $MU_2 = ${f(g2)}$, so $\\mathrm{MRS} = MU_1/MU_2 = ${f(mrs)}$: to stay indifferent the consumer gives up ${f(mrs)} units of good 2 per extra unit of good 1, at the margin.${ch}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12', kind: 'Definition', name: 'Substitutes, complements, Cobb–Douglas, quasilinear',
      statement: String.raw`Four standard families of preferences on $\R^2_+$, each with its utility function and MRS:
(a) **perfect substitutes**, $u = a x_1 + x_2$: straight indifference lines and a constant MRS of $a$;
(b) **perfect complements**, $u = \min(a x_1, x_2)$: L-shaped curves with corners on the ray $x_2 = a x_1$, MRS $\infty$ above that ray and $0$ below it;
(c) **Cobb–Douglas**, $u = x_1^{\alpha}x_2^{1-\alpha}$ with $0 < \alpha < 1$: smooth convex curves with $\mathrm{MRS} = \frac{\alpha}{1-\alpha}\frac{x_2}{x_1}$;
(d) **quasilinear**, $u = v(x_1) + x_2$ with $v$ increasing and concave (here $v = a\ln x_1$): $\mathrm{MRS} = v'(x_1)$.
Preferences are **homothetic** if the MRS is constant along every ray from the origin, so the curves are radial blow-ups of one another (a, b, c, and the CES family $u = (\tfrac12 x_1^{\rho} + \tfrac12 x_2^{\rho})^{1/\rho}$ that contains them as limits), and **quasilinear** in good 2 if the MRS is constant along every vertical line, so the curves are vertical shifts of one another (a, d).`,
      idea: String.raw`The formulas follow from $\mathrm{MRS} = MU_1/MU_2$ (4.11). If $u$ is homogeneous of degree $k$ then $MU_1$ and $MU_2$ are homogeneous of degree $k-1$ and their ratio depends only on $x_2/x_1$, the slope of the ray; that is homotheticity, shared by substitutes, complements, Cobb–Douglas and CES. If $u = v(x_1) + x_2$ then $MU_2 = 1$ and the MRS depends on $x_1$ alone, so shifting a curve vertically gives another indifference curve. Perfect substitutes are both. CES with elasticity of substitution $1/(1-\rho)$ slides from complements ($\rho \to -\infty$) through Cobb–Douglas ($\rho \to 0$) to substitutes ($\rho = 1$).`,
      caption: String.raw`Pick a family and move its parameter. Drag the teal handle to turn the ray and the orange handle to move the vertical line; short tangents are drawn where each meets the indifference curves. On the right the MRS is plotted along the ray (teal) and along the vertical line (orange) against the height $x_2$: a flat teal line means homothetic, a flat orange line means quasilinear.`,
      deps: ['micro-4.7', 'micro-4.11', 'micro-4.6'], refs: ['Varian Ch. 3', 'Varian Ch. 4'], tags: ['preferences'],
      credit: 'Charles Cobb & Paul Douglas, 1928',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quasilinear_utility' },
      viz(v) {
        const fam = v.select('family', [{ value: 'subs', label: 'perfect substitutes' }, { value: 'comp', label: 'perfect complements' }, { value: 'cd', label: 'Cobb–Douglas' }, { value: 'ql', label: 'quasilinear' }, { value: 'ces', label: 'CES' }], 'cd');
        const a = v.slider('weight $a$', 0.25, 3, 1.5, { step: 0.05 });
        const al = v.slider('exponent $\\alpha$', 0.1, 0.9, 0.5, { step: 0.01 });
        const rho = v.slider('$\\rho$', -4, 0.9, -1, { step: 0.05 });
        const make = (k) => (k === 'subs' ? prefs('subs', { a: a.value, b: 1 }) : k === 'comp' ? prefs('comp', { a: a.value, b: 1 }) : k === 'cd' ? prefs('cd', { a: al.value }) : k === 'ql' ? prefs('ql', { a: a.value }) : prefs('ces', { a: 0.5, r: Math.abs(rho.value) < 0.02 ? 0.02 : rho.value }));
        const TEX = {
          subs: () => `u = ${v.fix(a.value, 2)}\\,x_1 + x_2,\\ \\mathrm{MRS} = ${v.fix(a.value, 2)}`,
          comp: () => `u = \\min(${v.fix(a.value, 2)}\\,x_1,\\, x_2)`,
          cd: () => `u = x_1^{${v.fix(al.value, 2)}}x_2^{${v.fix(1 - al.value, 2)}},\\ \\mathrm{MRS} = ${v.fix(al.value / (1 - al.value), 2)}\\,x_2/x_1`,
          ql: () => `u = ${v.fix(a.value, 2)}\\ln x_1 + x_2,\\ \\mathrm{MRS} = ${v.fix(a.value, 2)}/x_1`,
          ces: () => `\\mathrm{MRS} = (x_2/x_1)^{${v.fix(1 - rho.value, 2)}}`,
        };
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.2 });
        const r = v.stage({ x: [0, 10], y: [0, 4.2], height: 380, axes: 'box', xlabel: 'height x₂ on the line', ylabel: 'MRS', title: 'MRS along the ray and along the vertical line' });
        const R = s.handle(7, 5.2, { color: 'teal', label: 'ray', labelPos: 'e', constrain: (x, y) => [clamp(x, 0.8, 9.8), clamp(y, 0.8, 9.8)] });
        const V = s.handle(3, 9.4, { color: 'orange', constrain: (x) => [clamp(x, 0.5, 9.5), 9.4] });
        v.legend([['purple', 'indifference curves'], ['teal', 'along the ray'], ['orange', 'along the vertical line']]);
        let st = {};
        v.render(() => {
          const k = fam.value, F = make(k);
          a.el.hidden = !(k === 'subs' || k === 'comp' || k === 'ql'); al.el.hidden = k !== 'cd'; rho.el.hidden = k !== 'ces';
          s.setTitle(`$${TEX[k]()}$`);
          const levels = [1.5, 3, 4.5, 6, 7.5].map((t) => F.u(t, t));
          for (const L of levels) drawLevel(s, F, L, { color: 'purple', width: 1.8, n: 260 });
          const th = Math.atan2(R.y, R.x), cs = Math.cos(th), sn = Math.sin(th), rEdge = Math.min(10 / Math.max(cs, 1e-9), 10 / Math.max(sn, 1e-9));
          s.line(0, 0, rEdge * cs, rEdge * sn, { color: 'teal', width: 2, alpha: 0.85 });
          s.line(V.x, 0, V.x, 10, { color: 'orange', width: 2, alpha: 0.85 });
          const mrsAt = (x, y) => { const [g1, g2] = F.grad(x, y); return g1 / g2; };
          const mark = (x, y, col) => {
            const m = mrsAt(x, y);
            if (!isFinite(m) && !Number.isNaN(m)) tangent(s, x, y, Infinity, 15, { color: col, width: 3.2 });
            else if (Number.isNaN(m)) s.dot(x, y, { r: 4.5, hollow: true, color: col, width: 2 });
            else tangent(s, x, y, -m, 15, { color: col, width: 3.2 });
          };
          for (const L of levels) {
            const rr = rayLevel(F.u, L, th, 60); if (rr != null && rr < rEdge) mark(rr * cs, rr * sn, 'teal');
            const yv = bisect((y) => F.u(V.x, y) - L, 1e-9, 40); if (yv != null && yv < 10) mark(V.x, yv, 'orange');
          }
          // right panel: MRS against the height on each line
          const top = 4.2, ys = []; for (let i = 1; i <= 160; i++) ys.push((10 * i) / 160);
          const clampM = (m) => (Number.isNaN(m) ? null : Math.min(m, top * 1.5));
          const onRayAt = (y) => [y * (cs / Math.max(sn, 1e-9)), y];
          const prR = ys.map((y) => { const [x] = onRayAt(y); const m = clampM(mrsAt(x, y)); return m == null ? null : [y, m]; });
          const prV = ys.map((y) => { const m = clampM(mrsAt(V.x, y)); return m == null ? null : [y, m]; });
          r.hline(top, { color: 'faint', width: 1, dash: [3, 3] }); r.text('∞ / off the chart', 0.2, top, { dy: -9, color: 'muted', size: 10.5, align: 'left' });
          r.clip(() => { r.path(prV, { color: 'orange', width: 2.6 }); r.path(prR, { color: 'teal', width: 2.6, dash: k === 'subs' ? [7, 5] : null }); });
          const vals = (pr) => pr.filter(Boolean).map((p) => p[1]);
          const spread = (arr) => { if (!arr.length) return 0; const mn = Math.min(...arr), mx = Math.max(...arr); return mx === mn ? 0 : (mx - mn) / Math.max(Math.abs(mx), 1e-12); };
          const homo = spread(vals(prR)) < 1e-6, quasi = spread(vals(prV)) < 1e-6;
          r.corner(`${homo ? '✓' : '✗'} homothetic`, 'tr', { color: homo ? 'green' : 'red', weight: 700 });
          r.corner(`${quasi ? '✓' : '✗'} quasilinear`, 'br', { color: quasi ? 'green' : 'red', weight: 700 });
          const rv = vals(prR), vv = vals(prV);
          st = { k, homo, quasi, rmin: Math.min(...rv), rmax: Math.max(...rv), vmin: Math.min(...vv), vmax: Math.max(...vv), slope: sn / cs };
        });
        v.readout(() => {
          const { k, homo, quasi, rmin, rmax, vmin, vmax, slope } = st, f = (x) => (x >= 6 ? '∞' : v.fix(x, 2));
          const desc = { subs: 'Perfect substitutes: only the weighted total matters.', comp: 'Perfect complements: the goods are wanted in the fixed ratio $x_2 = a x_1$; any excess of one is worthless.', cd: 'Cobb–Douglas: smooth convex curves; the exponent is the weight of good 1.', ql: 'Quasilinear: good 2 acts like money, with constant marginal utility.', ces: 'CES: lower $\\rho$ makes the goods poorer substitutes; $\\rho \\to 0$ is Cobb–Douglas, $\\rho = 1$ perfect substitutes.' }[k];
          const rr = homo ? `MRS constant at ${f(rmin)} along the ray of slope ${v.fix(slope, 2)}: **homothetic**` : `MRS varies from ${f(rmin)} to ${f(rmax)} along the ray: **not homothetic**`;
          const vq = quasi ? `constant at ${f(vmin)} along $x_1 = ${v.fix(V.x, 2)}$: **quasilinear**` : `varies from ${f(vmin)} to ${f(vmax)} along $x_1 = ${v.fix(V.x, 2)}$: **not quasilinear**`;
          return `${desc} ${rr}; ${vq}.`;
        });
      },
    },
  ],
};
