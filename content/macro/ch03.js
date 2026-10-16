// Macroeconomics — Chapter 3: Growth I: the Solow model (items 3.1–3.7; 3.8–3.13 are in ch03-b.js, the Solow paper 3.14 in ch03-papers.js)
import { clamp, pc, fx, ols, sgn, rkPath, at, rows, US_PWT, XS_PWT } from './ch03.shared.js';

const US = rows(US_PWT, 6); // year, y, k, K/Y, labour share, irr
const XS = rows(XS_PWT.flat(), 9); // code, name, y60, y19, s, n, hc60, hc19, oecd

/** Cobb–Douglas steady state k* = (sA/(n+δ))^{1/(1−α)} of k' = sAk^α − (n+δ)k. */
const kStar = (s, A, a, nd) => (s * A / nd) ** (1 / (1 - a));

export default {
  collection: 'macro',
  chapter: 3,
  title: 'Growth I: the Solow model',
  summary: String.raw`Saving adds to the capital stock and depreciation wears it down, so with diminishing returns capital per worker converges to a steady state. Higher saving raises the level of income but not its long-run growth; only technological progress does that. The golden rule picks the saving rate that maximizes steady-state consumption, and the model predicts conditional convergence — poor countries with similar fundamentals should catch up — at a measurable speed.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Phenomenon', name: 'Kaldor’s stylized facts of growth',
      statement: String.raw`In 1961 Nicholas Kaldor summarized the long-run record of industrial economies in a short list of "stylized facts": output per worker and capital per worker grow steadily, without a tendency to slow; the **capital–output ratio** $K/Y$, the **rate of return** on capital and the **shares** of labour and capital in income are roughly constant over long periods; and growth rates differ appreciably across countries. The first two are growth; the rest are *great ratios* that do not trend. A growth model is expected to reproduce all of them at once, which is why they became the target of the Solow model.

Scope: broad tendencies, not laws. Within a single country the ratios drift (the data below show how much), and the list was drawn from a handful of rich economies.`,
      idea: String.raw`The facts are the signature of **balanced growth**: if technology raises the productivity of labour at a constant rate, output, capital and wages can all grow at that rate while $K/Y$, the return $r$ and the shares stand still. They are what makes the hockey stick of income (macro-1.10) look like exponential growth on a log scale. Kaldor offered them as a target for theory in place of a particular model; the Solow model and its extension with labour-augmenting progress (macro-3.7) reproduce them, and the Cobb–Douglas form (macro-2.1) holds the shares constant by construction.`,
      caption: String.raw`**Left:** U.S. output and capital per worker on a log axis (straight line = constant growth rate), with log-linear fits over the chosen window. **Right:** the three ratios, each divided by its value in the first year of the window so that "flat" means 1. Drag the **window** to see which facts hold in which period: ask whether $K/Y$, the return and labour's share are really trendless, and by how much they moved.`,
      deps: ['macro-1.10'], refs: ['Romer ch. 1'], tags: ['growth', 'stylized facts'],
      credit: 'Nicholas Kaldor, 1961',
      scope: String.raw`A description of the postwar rich-country record, not a law; PWT series for the United States 1950–2019 are used here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kaldor%27s_facts' },
      viz(v) {
        const w0 = v.slider('window start', 1950, 2005, 1950, { step: 1, int: true });
        const w1 = v.slider('window end', 1960, 2019, 2019, { step: 1, int: true });
        const A = v.stage({ x: [1950, 2019], y: [20, 700], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'year', ylabel: 'thousand 2017 USD per worker', title: 'output and capital per worker (log axis)' });
        const B = v.stage({ x: [1950, 2019], y: [0.6, 1.4], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'year', ylabel: 'relative to first year of window', title: 'the great ratios (first year of window = 1)' });
        let st = null;
        v.render(() => {
          const a = Math.min(w0.value, w1.value - 10), b = Math.max(w1.value, a + 10);
          const sel = US.filter((r) => r[0] >= a && r[0] <= b), yrs = sel.map((r) => r[0]);
          const fy = ols(yrs, sel.map((r) => Math.log(r[1]))), fk = ols(yrs, sel.map((r) => Math.log(r[2])));
          A.vband(a, b, { color: 'accent', alpha: 0.07 });
          A.path(US.map((r) => [r[0], r[1]]), { color: 'accent', width: 2.6 });
          A.path(US.map((r) => [r[0], r[2]]), { color: 'orange', width: 2.6 });
          A.path([[a, Math.exp(fy.intercept + fy.slope * a)], [b, Math.exp(fy.intercept + fy.slope * b)]], { color: 'ink', width: 1.4, dash: [5, 4] });
          A.path([[a, Math.exp(fk.intercept + fk.slope * a)], [b, Math.exp(fk.intercept + fk.slope * b)]], { color: 'ink', width: 1.4, dash: [5, 4] });
          A.text('capital per worker', 1986, 150, { color: 'orange', weight: 700, align: 'left', size: 12 });
          A.text('output per worker', 1986, 45, { color: 'accent', weight: 700, align: 'left', size: 12 });
          const r0 = US.find((r) => r[0] === a);
          const cols = [[3, 'purple', 'capital–output ratio'], [4, 'green', 'labour share'], [5, 'red', 'real return on capital']];
          B.vband(a, b, { color: 'accent', alpha: 0.07 });
          B.hline(1, { color: 'faint', dash: [4, 4] });
          const ends = [];
          for (const [j, c, lab] of cols) { B.path(US.filter((r) => r[0] >= a).map((r) => [r[0], r[j] / r0[j]]), { color: c, width: 2.4 }); ends.push([c, lab, US[US.length - 1][j] / r0[j]]); }
          const last = US[US.length - 1], lb = US.find((r) => r[0] === b);
          st = { a, b, gy: fy.slope, gk: fk.slope, ky: [r0[3], lb[3]], ls: [r0[4], lb[4]], irr: [r0[5], lb[5]] };
        });
        v.legend([['accent', 'output per worker'], ['orange', 'capital per worker'], ['purple', 'capital–output ratio K/Y'], ['green', 'labour share'], ['red', 'real internal rate of return']]);
        v.readout(() => {
          if (!st) return '';
          const { a, b, gy, gk, ky, ls, irr } = st;
          return `${a}–${b}: output per worker grows ${pc(Math.exp(gy) - 1)} a year, capital per worker ${pc(Math.exp(gk) - 1)} a year (log-linear fits). Over the same window $K/Y$ goes ${fx(ky[0], 2)} → ${fx(ky[1], 2)} (${pc(ky[1] / ky[0] - 1, 0)}), the labour share ${pc(ls[0])} → ${pc(ls[1])}, the return on capital ${pc(irr[0])} → ${pc(irr[1])}. Growth is steady; the ratios are flat only to a first approximation. Data: Penn World Table 10.x, U.S.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Model', name: 'The Solow–Swan model',
      statement: String.raw`A closed economy produces one good with $Y = F(K, L)$ under constant returns, so output per worker is $y = f(k)$ with $k = K/L$, where $f$ is increasing and concave. A fixed fraction $s$ of output is saved and invested, capital depreciates at rate $\delta$, and labour is constant (population growth enters in macro-3.6). Then capital per worker obeys
$$\dot k = s\,f(k) - \delta k .$$
Investment per worker $s f(k)$ adds to the stock, *break-even investment* $\delta k$ replaces what wears out; capital rises where the first exceeds the second and falls where it is smaller. With $f(k) = A k^{\alpha}$ the two curves cross once at $k^* = (sA/\delta)^{1/(1-\alpha)}$.

Scope: a one-good, closed, full-employment economy with a *fixed* saving rate; it explains the level of income, not why technology grows.`,
      idea: String.raw`Because $f$ is concave, $f(k)/k$ falls as $k$ rises, so investment per unit of capital, $s f(k)/k$, starts above $\delta$ and ends below it; capital accumulation therefore slows as the economy gets richer and stops where the two are equal. The one-variable differential equation $\dot k = g(k)$ is analysed exactly as an equilibrium of a one-dimensional flow (mathbio-1.5): the sign of $g$ gives the direction of motion and the slope $g'(k^*)<0$ makes the steady state stable. The aggregate production function is macro-2.1. The same equation appears in Solow's and Swan's 1956 papers, written independently.`,
      caption: String.raw`**Left:** the saving curve $s f(k)$ (green) and break-even line $\delta k$ (red); arrows show the direction of motion. Drag the **gold handle** to choose the starting capital per worker $k_0$ and change $s$, $\delta$, $\alpha$ or $A$. **Right:** the path $k(t)$, integrated from the differential equation, with the animated dot; notice how convergence is fast at first and slows near $k^*$.`,
      deps: ['macro-2.1', 'mathbio-1.5'], refs: ['Mankiw ch. 8', 'Romer ch. 1'], tags: ['growth', 'capital accumulation'],
      credit: 'Robert Solow and Trevor Swan, 1956',
      scope: String.raw`Closed economy, one good, constant returns, diminishing returns to capital, exogenous saving rate, constant labour force, no technological progress.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solow%E2%80%93Swan_model' },
      viz(v) {
        const sS = v.slider('saving rate $s$', 0.05, 0.6, 0.25, { step: 0.005 });
        const dS = v.slider('depreciation $\\delta$', 0.01, 0.15, 0.05, { step: 0.001 });
        const aS = v.slider('capital share $\\alpha$', 0.15, 0.6, 0.33, { step: 0.01 });
        const AS = v.slider('productivity $A$', 0.5, 2, 1, { step: 0.01 });
        const P = v.stage({ x: [0, 40], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1.05, minWidth: 270, xlabel: 'capital per worker k', ylabel: 'per worker per year', title: 'investment and break-even investment' });
        const T = v.stage({ x: [0, 100], y: [0, 40], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'years', ylabel: 'capital per worker k(t)', title: 'the path of capital per worker' });
        const h0 = P.handle(3, 0, { color: 'gold', label: 'k₀', constrain: (x) => [Math.max(0.05, x), 0] });
        let st = null;
        v.animate((t) => {
          const s = sS.value, d = dS.value, a = aS.value, A = AS.value, ks = kStar(s, A, a, d), kmax = 2.2 * ks, g = (k) => s * A * k ** a - d * k;
          P.setView([0, kmax], [0, Math.max(s * A * kmax ** a, d * kmax) * 1.05]);
          const k0 = clamp(h0.x, 0.02 * kmax, kmax); h0.set(k0, 0);
          P.fn((k) => s * A * k ** a, { color: 'green', width: 2.6, domain: [0, kmax], n: 300 });
          P.fn((k) => d * k, { color: 'red', width: 2.4, domain: [0, kmax] });
          P.between((k) => s * A * k ** a, (k) => d * k, 0, ks, { fill: 'green', fillAlpha: 0.1 });
          for (let i = 1; i < 14; i++) { const k = (kmax * i) / 14, gg = g(k); if (Math.abs(gg) < 1e-9 || Math.abs(k - ks) < 0.03 * kmax) continue; const dx = (Math.sign(gg) * kmax) / 40; P.arrow(k - dx / 2, 0.04 * s * A * kmax ** a, k + dx / 2, 0.04 * s * A * kmax ** a, { color: gg > 0 ? 'green' : 'red', width: 2, head: 7 }); }
          P.vline(ks, { color: 'faint', dash: [3, 3] });
          P.dot(ks, d * ks, { r: 6, color: 'gold' });
          P.text(`k* = ${fx(ks, 2)}`, ks, d * ks, { dx: 10, dy: 16, align: 'left', color: 'gold', weight: 700, size: 12 });
          P.text('s f(k)', 0.42 * kmax, s * A * (0.42 * kmax) ** a, { dy: -10, color: 'green', weight: 700, align: 'right' });
          P.text('δ k', 0.97 * kmax, d * 0.97 * kmax, { dy: 14, color: 'red', weight: 700, align: 'right' });
          const Tmax = Math.max(40, Math.min(300, 5 / ((1 - a) * d)));
          const path = rkPath(g, k0, Tmax, Tmax / 400);
          T.setView([0, Tmax], [0, Math.max(kmax, k0) * 1.02]);
          T.hline(ks, { color: 'gold', dash: [5, 4] });
          T.path(path, { color: 'accent', width: 2.6 });
          const tau = Math.min(Tmax, (t / 11) * Tmax), kk = at(path, tau);
          T.dot(tau, kk, { r: 6, color: 'gold' }); P.dot(kk, s * A * kk ** a, { r: 6, color: 'gold' }); P.dot(kk, d * kk, { r: 4, color: 'gold', hollow: true });
          st = { ks, k0, ys: A * ks ** a, cs: (1 - s) * A * ks ** a, kk, tau, half: path.find((p) => Math.abs(p[1] - ks) <= Math.abs(k0 - ks) / 2) };
        }, { period: 14, still: 11 });
        v.legend([['green', 'saving per worker s f(k)'], ['red', 'break-even investment δk'], ['gold', 'steady state / current k', { dot: true }], ['accent', 'path k(t)']]);
        v.readout(() => st && `steady state $k^* = (sA/\\delta)^{1/(1-\\alpha)}$ = ${fx(st.ks, 3)}, output per worker $y^* = ${fx(st.ys, 3)}$, consumption $c^* = ${fx(st.cs, 3)}$. Start $k_0 = ${fx(st.k0, 2)}$; at $t = ${fx(st.tau, 0)}$ years $k = ${fx(st.kk, 2)}$${st.half ? `; half the initial gap was closed after ${fx(st.half[0], 0)} years` : ''}. At $k^*$ saving per worker exactly replaces depreciation: ${fx(sS.value * st.ys, 4)} = ${fx(dS.value * st.ks, 4)}.`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Theorem', name: 'The steady state exists and is stable',
      statement: String.raw`Let $f$ be continuous, increasing and strictly concave on $[0,\infty)$ with $f(0)=0$ and the **Inada conditions** $f'(0)=\infty$ and $f'(\infty)=0$. For any $s\in(0,1)$ and $\delta>0$ the equation $\dot k = g(k) := s f(k) - \delta k$ has exactly one steady state $k^*>0$, and from every initial $k_0>0$ the solution converges monotonically to $k^*$: $g>0$ on $(0,k^*)$ and $g<0$ on $(k^*,\infty)$.

If an Inada condition fails the conclusion can fail: with $f'(\infty)>\delta/s$ capital grows forever (no steady state), and with $f'(0)\le\delta/s$ capital shrinks to zero.`,
      idea: String.raw`Divide by $k$: $g(k)/k = s f(k)/k - \delta$, which decreases strictly because $f$ is concave with $f(0)=0$. The Inada condition $f'(0)=\infty$ makes it larger than $0$ near $k=0$ (since $f(k)/k\to f'(0)$), and $f'(\infty)=0$ makes it negative for large $k$. By the intermediate value theorem (pma-4.23) it has a zero, and strict monotonicity makes the zero unique; the sign pattern of $g$ then forces monotone convergence, which is the local test of mathbio-1.5 made global in one dimension.`,
      caption: String.raw`**Left:** the growth of capital $\dot k = s f(k) - \delta k$ against $k$ for the production function you choose. The first (Cobb–Douglas) has the Inada properties; the others break one. Drag the gold handle to pick $k_0$; **right** shows the path. With the other technologies slide $A$ or $s$ up and down to see steady states vanish.`,
      deps: ['macro-3.2', 'pma-4.23'], refs: ['Romer ch. 1'], tags: ['growth', 'stability'],
      credit: 'Ken-Ichi Inada, 1963 (conditions)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inada_conditions' },
      viz(v) {
        const F = {
          cd: { label: 'Cobb–Douglas (Inada holds)', f: (k, A) => A * k ** 0.35 },
          sat: { label: '$f\'(0)$ finite: $Ak/(1+0.15k)$', f: (k, A) => (A * k) / (1 + 0.15 * k) },
          ces: { label: 'CES, $\\sigma=2$: $f\'(\\infty)>0$', f: (k, A) => A * (0.5 * Math.sqrt(k) + 0.5) ** 2 - A * 0.25 },
          ak: { label: '$f = Ak$ (no diminishing returns)', f: (k, A) => A * k },
        };
        const sel = v.select('production function', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const sS = v.slider('saving rate $s$', 0.05, 0.6, 0.25, { step: 0.005 });
        const dS = v.slider('depreciation $\\delta$', 0.01, 0.15, 0.05, { step: 0.001 });
        const AS = v.slider('productivity $A$', 0.2, 3, 1, { step: 0.01 });
        const P = v.stage({ x: [0, 40], y: [-0.3, 0.3], axes: 'box', gutter: true, height: 340, weight: 1.05, minWidth: 270, xlabel: 'capital per worker k', ylabel: 'growth of capital  k̇ = s f(k) − δk', title: 'the law of motion' });
        const T = v.stage({ x: [0, 100], y: [0, 40], axes: 'box', gutter: true, height: 340, weight: 0.95, minWidth: 250, xlabel: 'years', ylabel: 'k(t)', title: 'the path from k₀' });
        const h0 = P.handle(3, 0, { color: 'gold', label: 'k₀', constrain: (x) => [Math.max(0.05, x), 0] });
        let st = null;
        v.render(() => {
          const f = F[sel.value].f, s = sS.value, d = dS.value, A = AS.value, g = (k) => s * f(k, A) - d * k;
          const kmax = 50;
          const gv = []; for (let i = 1; i <= 2000; i++) gv.push(g((kmax * i) / 2000));
          let ks = null; for (let i = 1; i < 2000; i++) if (gv[i - 1] > 0 && gv[i] <= 0) { ks = v.M.bisect(g, (kmax * i) / 2000, (kmax * (i + 1)) / 2000); break; }
          const gmax = Math.max(...gv.map(Math.abs), 0.05), gmin = Math.min(...gv, -0.03);
          P.setView([0, kmax], [gmin * 1.1, Math.max(...gv, 0.03) * 1.15]);
          P.hline(0, { color: 'ink', width: 1.2 });
          P.fn(g, { color: 'accent', width: 2.8, domain: [0.01, kmax], n: 400 });
          for (let i = 1; i < 14; i++) { const k = (kmax * i) / 14, gg = g(k); if (ks && Math.abs(k - ks) < 0.04 * kmax) continue; const dx = (sgn(gg) * kmax) / 40; P.arrow(k - dx / 2, 0, k + dx / 2, 0, { color: gg > 0 ? 'green' : 'red', width: 2.4, head: 7 }); }
          if (ks) { P.dot(ks, 0, { r: 6.5, color: 'gold' }); P.text(`k* = ${fx(ks, 2)}`, ks, 0, { dy: -14, dx: 8, align: 'left', color: 'gold', weight: 700, size: 12 }); }
          const k0 = clamp(h0.x, 0.05, kmax); h0.set(k0, 0);
          const Tmax = 200, path = rkPath(g, k0, Tmax, 0.5);
          const top = Math.max(ks ? 1.5 * ks : 0, ...path.map((p) => p[1]), 5);
          T.setView([0, Tmax], [0, top * 1.05]);
          if (ks) T.hline(ks, { color: 'gold', dash: [5, 4] });
          T.path(path, { color: 'accent', width: 2.6 });
          // bracketing values for the intermediate value theorem: g(k)/k at a small and a large k
          const klo = 0.02, khi = kmax;
          st = { ks, k0, klo, khi, glo: g(klo) / klo, ghi: g(khi) / khi, kT: path[path.length - 1][1], f, A, s, d, key: sel.value };
        });
        v.legend([['accent', 'k̇ = s f(k) − δk'], ['green', 'capital rising', { dot: true }], ['red', 'capital falling', { dot: true }], ['gold', 'steady state', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ks, glo, ghi, kT, k0, key } = st;
          const br = `$g(k)/k$ = ${fx(glo, 3)} at $k=0.02$ and ${fx(ghi, 3)} at $k=50$`;
          if (ks) return `${br}: the sign change brackets a root (intermediate value theorem), and since $g/k$ is decreasing it is unique: $k^* = ${fx(ks, 3)}$. From $k_0 = ${fx(k0, 2)}$ the path reaches $k = ${fx(kT, 3)}$ after 200 years.`;
          return `${br}: ${glo < 0 ? 'investment never covers depreciation, so capital dies out (here $s f\'(0) \\le \\delta$)' : 'saving exceeds depreciation at every $k$, so capital grows without bound (here $s f\'(\\infty) > \\delta$)'}. No steady state: the theorem's hypotheses fail${key === 'cd' ? '' : ' (adjust $s$, $\\delta$, $A$ to bring one back)'}. After 200 years $k = ${fx(kT, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Theorem', name: 'The golden-rule saving rate',
      statement: String.raw`In the Solow model with $\dot k = s f(k) - \delta k$ and steady state $k^*(s)$, steady-state consumption per worker is $c^*(s) = f(k^*) - \delta k^*$. It is maximized at the saving rate $s_{\text{gold}}$ whose steady state satisfies the **golden rule**
$$f'(k_{\text{gold}}) = \delta ,$$
the marginal product of capital equals the depreciation rate. For Cobb–Douglas $f = Ak^{\alpha}$ this saving rate is $s_{\text{gold}} = \alpha$, the capital share: save exactly what capital earns.

Scope: comparison of *steady states* only; it says nothing about the transition (macro-3.5 turns to that). Without population growth or technological progress; with them $\delta$ becomes $\delta + n + g$.`,
      idea: String.raw`Raising $s$ raises $k^*$, which has two effects on $c^* = f(k^*)-\delta k^*$: more output $f'(k^*)\,dk$ but more capital to replace $\delta\,dk$. So $dc^*/dk^* = f'(k^*)-\delta$, positive while the marginal product exceeds depreciation and negative after. An interior maximum has zero derivative (pma-5.8), which gives the golden rule; with Cobb–Douglas, $f' = \alpha f/k$ and $s f(k^*) = \delta k^*$ together turn $f'=\delta$ into $s=\alpha$. Edmund Phelps named it in 1961 (a "fable for growthmen").`,
      caption: String.raw`**Left:** steady-state consumption $c^*(s)$ against the saving rate; drag the **gold handle** along the curve. The red mark is the numerically found peak; the dashed line is $s = \alpha$. **Right:** at your chosen $s$, the gap between output $f(k^*)$ and depreciation $\delta k^*$ is consumption (green bar); where the tangent to $f$ is parallel to $\delta k$ the gap is largest.`,
      deps: ['macro-3.3', 'pma-5.8'], refs: ['Mankiw ch. 8'], tags: ['growth', 'optimization'],
      credit: 'Edmund Phelps, 1961',
      scope: String.raw`Steady states of the Solow model with a fixed saving rate; no population growth or technical progress (replace $\delta$ by $\delta+n+g$ otherwise).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Golden_rule_savings_rate' },
      viz(v) {
        const aS = v.slider('capital share $\\alpha$', 0.15, 0.7, 0.35, { step: 0.01 });
        const dS = v.slider('depreciation $\\delta$', 0.02, 0.15, 0.06, { step: 0.001 });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'saving rate s', ylabel: 'steady-state consumption c*', title: 'consumption against saving' });
        const R = v.stage({ x: [0, 20], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'capital per worker k', ylabel: 'per worker', title: 'output, depreciation and consumption' });
        const hs = L.handle(0.2, 0, { color: 'gold', label: 's', constrain: (x) => [clamp(x, 0.02, 0.98), 0] });
        let st = null;
        v.render(() => {
          const a = aS.value, d = dS.value, A = 1;
          const c = (s) => (1 - s) * A * kStar(s, A, a, d) ** a;
          const grid = []; for (let i = 1; i < 400; i++) grid.push([i / 400, c(i / 400)]);
          const best = grid.reduce((m, p) => (p[1] > m[1] ? p : m));
          L.setView([0, 1], [0, best[1] * 1.15]);
          L.path(grid, { color: 'accent', width: 2.8 });
          L.vline(a, { color: 'green', dash: [5, 4] });
          L.text('s = α', a, best[1] * 1.08, { color: 'green', dx: 6, align: 'left', weight: 700, size: 12 });
          L.dot(best[0], best[1], { r: 6, color: 'red' });
          const s = clamp(hs.x, 0.02, 0.98); hs.set(s, c(s));
          hs.constrain = (x) => { const ss = clamp(x, 0.02, 0.98); return [ss, c(ss)]; };
          const ks = kStar(s, A, a, d), kg = kStar(best[0], A, a, d), kmax = 1.6 * Math.max(ks, kg);
          R.setView([0, kmax], [0, Math.max(kmax ** a, d * kmax) * 1.05]);
          R.fn((k) => A * k ** a, { color: 'accent', width: 2.6, domain: [0, kmax] });
          R.fn((k) => d * k, { color: 'red', width: 2.4, domain: [0, kmax] });
          R.line(ks, d * ks, ks, A * ks ** a, { color: 'green', width: 7, alpha: 0.75 });
          R.vline(ks, { color: 'faint', dash: [3, 3] });
          // tangent to f with slope δ at k_gold
          const kgold = (a * A / d) ** (1 / (1 - a));
          R.line(Math.max(0, kgold - kmax * 0.2), A * kgold ** a - d * 0.2 * kmax, Math.min(kmax, kgold + kmax * 0.2), A * kgold ** a + d * 0.2 * kmax, { color: 'orange', width: 1.6, dash: [5, 4] });
          R.dot(kgold, A * kgold ** a, { r: 5, color: 'red' });
          R.text('f(k)', 0.45 * kmax, A * (0.45 * kmax) ** a, { dy: -12, dx: -6, color: 'accent', weight: 700, align: 'right' });
          R.text('δk', 0.97 * kmax, d * 0.97 * kmax, { dy: 14, color: 'red', weight: 700, align: 'right' });
          R.text('consumption', ks, 0.5 * (d * ks + A * ks ** a), { dx: 10, align: 'left', color: 'green', weight: 700, size: 12 });
          st = { s, a, best, c: c(s), ks, mpk: a * A * ks ** (a - 1), d };
        });
        v.legend([['accent', 'c*(s) and f(k)'], ['red', 'depreciation δk / the maximum', { dot: true }], ['green', 'consumption gap c*'], ['orange', 'tangent of slope δ', { dash: true }]]);
        v.readout(() => st && `at $s = ${fx(st.s, 3)}$: $k^* = ${fx(st.ks, 2)}$, $c^* = ${fx(st.c, 4)}$, marginal product $f'(k^*) = ${fx(st.mpk, 4)}$ versus $\\delta = ${fx(st.d, 4)}$ (${st.mpk > st.d + 1e-6 ? 'above: saving more would raise $c^*$' : st.mpk < st.d - 1e-6 ? 'below: saving less would raise $c^*$' : 'equal: golden rule'}). Numerical peak of $c^*(s)$ at $s = ${fx(st.best[0], 3)}$; the formula gives $s_{\\text{gold}} = \\alpha = ${fx(st.a, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Concept', name: 'Dynamic inefficiency',
      statement: String.raw`An economy is **dynamically inefficient** if it saves so much that its steady-state capital stock exceeds the golden-rule level, $k^* > k_{\text{gold}}$, equivalently $f'(k^*) < \delta$ (without growth). Then the economy can lower its saving rate and *raise consumption in every period*, now and forever: an unambiguous Pareto improvement, since less saving means lower capital but also less spending on replacing it.

If $k^* < k_{\text{gold}}$, by contrast, a cut in saving buys higher consumption today at the cost of lower consumption later: a genuine trade-off between generations, not an inefficiency.

Scope: Solow model with a fixed saving rate and no uncertainty; with growth the test is $r < g$ (the interest rate below the growth rate). Empirically the U.S. appears to be dynamically efficient (Abel, Mankiw, Summers and Zeckhauser, 1989).`,
      idea: String.raw`In the steady state $c^* = f(k^*) - \delta k^*$. When $f'(k^*) < \delta$ the economy keeps replacing capital whose output hardly covers its replacement cost, so $c^*$ is decreasing in $k^*$ (macro-3.4). A cut in saving moves consumption in two steps: it jumps up at once (output unchanged, saving lower) and the capital stock then runs down along the transition, which lowers output but, above the golden rule, never so much as to erase the initial jump. Both results come from the same curve $c^*(s)$ that peaked at the golden rule.`,
      caption: String.raw`**Left:** consumption per worker over time. The economy sits in the steady state with saving $s_{\text{old}}$ until $t = 0$, when saving drops to $s_{\text{new}}$ (sliders). Green shading: consumption above the old level; red: below. **Right:** the hump $c^*(s)$ with the two saving rates and the golden rule marked. Start at $s_{\text{old}}$ to the right of the peak and cut: the path stays green; start to the left and the same cut turns red later.`,
      deps: ['macro-3.4'], refs: ['Mankiw ch. 8', 'Romer ch. 2'], tags: ['growth', 'efficiency'],
      credit: 'Edmund Phelps, 1961; Abel, Mankiw, Summers & Zeckhauser, 1989 (test)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dynamic_inefficiency' },
      viz(v) {
        const so = v.slider('old saving rate $s_{\\text{old}}$', 0.05, 0.75, 0.6, { step: 0.005 });
        const sn = v.slider('new saving rate $s_{\\text{new}}$', 0.05, 0.75, 0.35, { step: 0.005 });
        const aS = v.slider('capital share $\\alpha$', 0.2, 0.5, 0.35, { step: 0.01 });
        const dS = v.slider('depreciation $\\delta$', 0.02, 0.1, 0.06, { step: 0.001 });
        const L = v.stage({ x: [-10, 80], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 280, xlabel: 'years (saving cut at t = 0)', ylabel: 'consumption per worker', title: 'consumption after a cut in saving' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 250, xlabel: 'saving rate s', ylabel: 'steady-state consumption', title: 'the golden-rule hump' });
        let st = null;
        v.render(() => {
          const a = aS.value, d = dS.value, s0 = so.value, s1 = sn.value, A = 1;
          const f = (k) => A * k ** a, k0 = kStar(s0, A, a, d), c0 = (1 - s0) * f(k0);
          const g = (k) => s1 * f(k) - d * k, path = rkPath(g, k0, 80, 0.2);
          const cc = (t) => (t < 0 ? c0 : (1 - s1) * f(at(path, t)));
          const pts = []; for (let t = -10; t <= 80; t += 0.5) pts.push([t, cc(t)]);
          const cs = (s) => (1 - s) * f(kStar(s, A, a, d));
          const hi = Math.max(...pts.map((p) => p[1]), c0), lo = Math.min(...pts.map((p) => p[1]));
          L.setView([-10, 80], [Math.max(0, lo - 0.25 * (hi - lo + 0.02)), hi + 0.25 * (hi - lo + 0.02)]);
          L.between((t) => cc(t), () => c0, 0, 80, { fill: 'green', fillAlpha: 0.0 });
          // shade by sign
          for (let i = 0; i + 1 < pts.length; i++) { const [t, c] = pts[i]; if (t < 0) continue; L.rect(t, Math.min(c, c0), pts[i + 1][0], Math.max(c, c0), { fill: c >= c0 ? 'green' : 'red', fillAlpha: 0.28, stroke: false }); }
          L.hline(c0, { color: 'muted', dash: [5, 4] });
          L.path(pts, { color: 'accent', width: 2.8 });
          L.vline(0, { color: 'faint', dash: [3, 3] });
          const gold = a, grid = []; for (let i = 1; i < 300; i++) grid.push([i / 300, cs(i / 300)]);
          const top = Math.max(...grid.map((p) => p[1]));
          R.setView([0, 1], [0, top * 1.15]);
          R.path(grid, { color: 'accent', width: 2.6 });
          R.vline(gold, { color: 'green', dash: [5, 4] }); R.text('golden rule s = α', gold, top * 0.07, { color: 'green', dx: 6, align: 'left', size: 11.5, weight: 700 });
          R.dot(s0, cs(s0), { r: 7, color: 'red', label: 'old', labelPos: 'ne' }); R.dot(s1, cs(s1), { r: 7, color: 'gold', label: 'new', labelPos: 'nw' });
                    const cmin = Math.min(...pts.filter((p) => p[0] >= 0).map((p) => p[1]));
          st = { jump: (1 - s1) * f(k0) - c0, cmin: cmin - c0, clong: cs(s1) - c0, s0, s1, a };
        });
        v.legend([['accent', 'consumption c(t)'], ['muted', 'old steady-state consumption', { dash: true }], ['green', 'better than before', { area: true }], ['red', 'worse than before', { area: true }]]);
        v.readout(() => st && `at $t=0$ consumption jumps by ${fx(st.jump, 3)}; its lowest later value is ${st.cmin >= -1e-9 ? 'still above' : 'below'} the old level (${fx(st.cmin, 3)}); the new steady state is ${fx(st.clong, 3)} ${st.clong >= 0 ? 'above' : 'below'} the old. ${st.s0 > st.a && st.cmin >= -1e-9 ? '**Dynamically inefficient:** the old saving rate was above the golden rule $\\alpha$, and every generation gains.' : st.s0 <= st.a && st.s1 < st.s0 ? 'The old saving rate was at or below $\\alpha$: today’s gain is paid for by later generations.' : 'Try cutting saving from a rate above $\\alpha$.'}`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Model', name: 'Solow with population growth',
      statement: String.raw`Let the labour force grow at rate $n$. Capital per worker $k=K/L$ then obeys
$$\dot k = s f(k) - (n+\delta)k ,$$
because each year $nk$ of investment per worker is needed just to equip new workers, in addition to replacing $\delta k$. The steady state is lower the faster the population grows; for Cobb–Douglas
$$y^* = A^{\frac{1}{1-\alpha}}\Big(\frac{s}{n+\delta}\Big)^{\frac{\alpha}{1-\alpha}} .$$
In the steady state total output and capital grow at rate $n$ while output per worker is constant. The model predicts a *negative* relation between income per worker and population growth across countries with similar saving.

Scope: exogenous $n$ and $s$; the prediction concerns levels of income, and many other things differ between countries.`,
      idea: String.raw`Break-even investment is now $(n+\delta)k$: a steeper line, so the crossing with $s f(k)$ moves left. The algebra of macro-3.2 goes through with $\delta$ replaced by $n+\delta$. Population enters through the denominator inside a power $\alpha/(1-\alpha)$, so with $\alpha=1/3$ the elasticity of $y^*$ with respect to $n+\delta$ is only $-1/2$. Population growth itself is treated as exogenous here; demo-1.4 explains the doubling times behind typical values of $n$.`,
      caption: String.raw`**Left:** the Solow diagram with the break-even line $(n+\delta)k$; slide $n$ and the steady state moves. **Right:** log income per worker in 2019 against population growth 1960–2019 for 85 countries (Penn World Table), with the least-squares line (dashed) and the model's slope (green) for your $\alpha$. Click a country to label it; choose to remove the effect of saving rates first.`,
      deps: ['macro-3.2', 'demo-1.4'], refs: ['Mankiw ch. 9'], tags: ['growth', 'population'],
      scope: String.raw`The cross-country picture is a descriptive check of one prediction, not a test of the whole model: schooling, institutions and technology differ across countries and are correlated with population growth.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solow%E2%80%93Swan_model' },
      viz(v) {
        const nS = v.slider('population growth $n$', 0, 0.05, 0.01, { step: 0.001 });
        const sS = v.slider('saving rate $s$', 0.05, 0.5, 0.2, { step: 0.005 });
        const aS = v.slider('capital share $\\alpha$', 0.15, 0.6, 0.33, { step: 0.01 });
        const adj = v.select('cross-country picture', [{ value: 'raw', label: 'raw' }, { value: 'adj', label: 'saving removed' }], 'raw');
        const P = v.stage({ x: [0, 40], y: [0, 3], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'capital per worker k', ylabel: 'per worker per year', title: 'investment and break-even investment' });
        const S = v.stage({ x: [0, 4.5], y: [0, 5], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 280, xlabel: 'population growth 1960–2019 (% per year)', ylabel: 'ln income per worker 2019 (output side, 2017 USD)', title: 'income per worker and population growth' });
        let pick = 'USA';
        S.onClick((x, y) => { let best = null, bd = 1e9; for (const r of XS) { const px = S.X(r[5] * 100) - S.X(x), py = S.Y(Y(r)) - S.Y(y); const dd = px * px + py * py; if (dd < bd) { bd = dd; best = r[0]; } } pick = best; });
        let Y = (r) => Math.log(r[3] * 1000), st = null;
        v.render(() => {
          const n = nS.value, s = sS.value, a = aS.value, d = 0.05, A = 1;
          const nd = n + d, ks = kStar(s, A, a, nd), kmax = 2.2 * ks;
          P.setView([0, kmax], [0, Math.max(s * A * kmax ** a, nd * kmax) * 1.05]);
          P.fn((k) => s * A * k ** a, { color: 'green', width: 2.6, domain: [0, kmax] });
          P.fn((k) => nd * k, { color: 'red', width: 2.4, domain: [0, kmax] });
          P.fn((k) => d * k, { color: 'muted', width: 1.4, domain: [0, kmax], dash: [5, 4] });
          P.vline(ks, { color: 'faint', dash: [3, 3] });
          P.dot(ks, nd * ks, { r: 6, color: 'gold' });
          P.text(`k* = ${fx(ks, 2)}`, ks, nd * ks, { dx: 9, dy: 16, align: 'left', color: 'gold', weight: 700, size: 12 });
          P.text('(n+δ)k', 0.97 * kmax, nd * 0.97 * kmax, { dy: 14, color: 'red', weight: 700, align: 'right' });
          P.text('δk (n = 0)', 0.97 * kmax, d * 0.97 * kmax, { dy: -8, color: 'muted', align: 'right', size: 11 });
          const shift = adj.value === 'adj' ? (a / (1 - a)) : 0, sbar = XS.reduce((m, r) => m + Math.log(r[4]), 0) / XS.length;
          Y = (r) => Math.log(r[3] * 1000) - shift * (Math.log(r[4]) - sbar);
          const xs = XS.map((r) => r[5] * 100), ys = XS.map(Y), fit = ols(xs, ys);
          const lo = Math.min(...ys), hi = Math.max(...ys);
          S.setView([0, 4.5], [lo - 0.3, hi + 0.3]);
          for (const r of XS) S.dot(r[5] * 100, Y(r), { r: 4.2, color: r[8] ? 'accent' : 'orange', alpha: 0.8 });
          S.path([[0, fit.intercept], [4.5, fit.intercept + fit.slope * 4.5]], { color: 'ink', width: 1.8, dash: [6, 4] });
          const mx = xs.reduce((p, q) => p + q, 0) / xs.length, my = ys.reduce((p, q) => p + q, 0) / ys.length;
          const slopeModel = -(a / (1 - a)) / (mx / 100 + d) / 100;
          S.path([[0, my - slopeModel * (0 - mx)], [4.5, my + slopeModel * (4.5 - mx)]], { color: 'green', width: 2.2 });
          const r0 = XS.find((r) => r[0] === pick);
          if (r0) { S.dot(r0[5] * 100, Y(r0), { r: 7, color: 'gold' }); S.text(r0[1], r0[5] * 100, Y(r0), { dy: -12, color: 'gold', weight: 700, align: 'center', size: 12 }); }
          st = { ks, ys: A * ks ** a, fit, slopeModel, n: XS.length, pick: r0, need: (() => { const rho = -fit.slope * 100 * (mx / 100 + d); return rho / (1 + rho); })() };
        });
        v.legend([['accent', 'long-standing OECD members', { dot: true }], ['orange', 'other countries', { dot: true }], ['ink', 'least-squares line', { dash: true }], ['green', 'Solow slope (fixed α)']]);
        v.readout(() => st && `steady state: $y^* = ${fx(st.ys, 3)}$ at $n=${fx(nS.value * 100, 1)}\\%$; the exact formula gives ${fx((sS.value / (nS.value + 0.05)) ** (aS.value / (1 - aS.value)), 3)}. Across ${st.n} countries the fitted slope of ln income on $n$ is ${fx(st.fit.slope, 3)} per percentage point ($t = ${fx(st.fit.t, 1)}$, $R^2 = ${fx(st.fit.r2, 2)}$); the model's slope at the sample-mean $n$ with $\\delta+g = 0.05$ is ${fx(st.slopeModel, 3)}. The sign is the predicted one but the slope is ${fx(st.fit.slope / st.slopeModel, 0)} times steeper than the model with this $\\alpha$ allows: other things that vary with population growth (schooling, institutions, saving) are being picked up, and matching the slope by population alone would need $\\alpha \\approx ${fx(st.need, 2)}$${st.pick ? `; ${st.pick[1]}: $n = ${fx(st.pick[5] * 100, 2)}\\%$, income per worker ${fx(st.pick[3], 1)} thousand dollars` : ''}.`);
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Model', name: 'Labour-augmenting technical progress and balanced growth',
      statement: String.raw`Let technology improve the productivity of labour at rate $g$: $Y = F(K, AL)$ with $\dot A/A = g$, $\dot L/L = n$. In *effective-labour* units $\hat k = K/(AL)$ and $\hat y = Y/(AL) = f(\hat k)$,
$$\dot{\hat k} = s f(\hat k) - (n+g+\delta)\hat k ,$$
which has the same shape as macro-3.6 with $\delta$ replaced by $n+g+\delta$. So $\hat k\to\hat k^*$, and on the **balanced growth path** output per worker and capital per worker grow at rate $g$, output and capital at rate $n+g$, while $K/Y$, the return to capital and the factor shares are constant: Kaldor's facts (macro-3.1).

**Uzawa's theorem:** balanced growth with technical progress requires that progress be labour-augmenting (for Cobb–Douglas every kind is equivalent to it). Capital-augmenting progress with a CES function of elasticity below one does not generate balanced growth.

Scope: exogenous technology; $g$ is not explained.`,
      idea: String.raw`Writing the model in units of effective labour removes the trend: $\hat k$ converges by exactly the argument of macro-3.3, and since $k = A\hat k$ and $y = A\hat y$, per-worker variables grow like $A$. Saving cannot change this long-run growth rate; it only moves the level $\hat k^*$. Uzawa (1961) showed that only labour-augmenting progress is compatible with a constant capital-output ratio in the long run. With a CES technology of elasticity below one, capital-augmenting progress makes capital abundant in effective terms, the labour term becomes the bottleneck and growth peters out.`,
      caption: String.raw`Choose the kind of technical progress and the CES **elasticity of substitution** $\sigma$ ($\sigma=1$ is Cobb–Douglas). **Left:** logs of output and capital per worker; straight lines of slope $g$ mean balanced growth. **Right:** the growth rate of output per worker and the capital–output ratio. Labour-augmenting progress approaches $g$ and a constant $K/Y$ for every $\sigma$; capital-augmenting progress with $\sigma<1$ does not.`,
      deps: ['macro-3.6'], refs: ['Mankiw ch. 9', 'Romer ch. 1'], tags: ['growth', 'technology'],
      credit: 'Robert Solow, 1956; Hirofumi Uzawa, 1961',
      scope: String.raw`Closed economy, exogenous technical change; the CES comparison uses a capital weight $0.35$ and is an illustration of Uzawa's theorem, not a calibration.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solow%E2%80%93Swan_model' },
      viz(v) {
        const kind = v.select('technical progress', [{ value: 'lab', label: 'labour-augmenting' }, { value: 'cap', label: 'capital-augmenting' }], 'lab');
        const gS = v.slider('technology growth $g$', 0.005, 0.05, 0.02, { step: 0.001 });
        const nS = v.slider('population growth $n$', 0, 0.03, 0.01, { step: 0.001 });
        const sS = v.slider('saving rate $s$', 0.1, 0.5, 0.25, { step: 0.005 });
        const sig = v.slider('elasticity $\\sigma$', 0.3, 1.5, 0.6, { step: 0.01 });
        const T = 150;
        const L = v.stage({ x: [0, T], y: [0, 5], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 280, xlabel: 'years', ylabel: 'ln of per-worker variable (t = 0 → 0)', title: 'logs of output and capital per worker' });
        const R = v.stage({ x: [0, T], y: [0, 0.05], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'growth rate of y  /  K/Y ÷ 100', title: 'growth rate and capital–output ratio' });
        const h = L.handle(0, 0, { color: 'gold', label: 'k₀', constrain: (x, y) => [0, clamp(y, -1.5, 1.5)] });
        let st = null;
        v.render(() => {
          const g = gS.value, n = nS.value, s = sS.value, sg = sig.value, a = 0.35, d = 0.05;
          const rho = Math.abs(sg - 1) < 0.005 ? 0 : (sg - 1) / sg;
          const yf = (k, t) => { const A = kind.value === 'lab' ? Math.exp(g * t) : 1, B = kind.value === 'cap' ? Math.exp(g * t) : 1; return rho === 0 ? (B * k) ** a * A ** (1 - a) : (a * (B * k) ** rho + (1 - a) * A ** rho) ** (1 / rho); };
          // start from the balanced-growth-ish level times exp(h.y)
          const kInit = 3 * Math.exp(h.y), dt = 0.25, pts = []; let k = kInit, t = 0;
          for (let i = 0; i <= T / dt; i++) { pts.push([t, k, yf(k, t)]); const f = (kk, tt) => s * yf(kk, tt) - (n + d) * kk; const k1 = f(k, t), k2 = f(k + 0.5 * dt * k1, t + dt / 2), k3 = f(k + 0.5 * dt * k2, t + dt / 2), k4 = f(k + dt * k3, t + dt); k = Math.max(1e-9, k + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)); t += dt; }
          const ly = pts.map((p) => [p[0], Math.log(p[2] / pts[0][2])]), lk = pts.map((p) => [p[0], Math.log(p[1] / pts[0][1])]);
          const top = Math.max(...ly.map((p) => p[1]), ...lk.map((p) => p[1]), 1), bot = Math.min(...ly.map((p) => p[1]), ...lk.map((p) => p[1]), -0.2);
          L.setView([0, T], [bot - 0.1, top * 1.08]); h.set(0, clamp(h.y, -1.5, 1.5));
          L.path(lk, { color: 'orange', width: 2.4 }); L.path(ly, { color: 'accent', width: 2.8 });
          L.path([[0, 0], [T, g * T]], { color: 'green', width: 1.6, dash: [6, 4] });
          const gr = []; for (let i = 20; i < pts.length - 20; i += 4) { const j0 = i - 20, j1 = i + 20; gr.push([pts[i][0], (Math.log(pts[j1][2]) - Math.log(pts[j0][2])) / (pts[j1][0] - pts[j0][0])]); }
          const ky = pts.filter((_, i) => i % 4 === 0).map((p) => [p[0], p[1] / p[2] / 100]);
          R.setView([0, T], [0, Math.max(0.06, g * 1.6, ...gr.map((p) => p[1]), ...ky.map((p) => p[1]))]);
          R.hline(g, { color: 'green', dash: [6, 4] }); R.path(gr, { color: 'accent', width: 2.6 }); R.path(ky, { color: 'purple', width: 2.4 });
          R.text('g', 2, g, { dy: -9, color: 'green', weight: 700 });
          const last = gr[gr.length - 1], KY = pts[pts.length - 41][1] / pts[pts.length - 41][2], KY0 = pts[Math.floor(pts.length / 2)][1] / pts[Math.floor(pts.length / 2)][2];
          st = { gy: last[1], g, KY, KY0 };
        });
        v.legend([['accent', 'output per worker'], ['orange', 'capital per worker'], ['green', 'slope g (balanced growth)', { dash: true }], ['purple', 'K/Y ÷ 100']]);
        v.readout(() => st && `at the end of the window output per worker grows at ${pc(st.gy, 2)} a year against $g = ${pc(st.g, 2)}$; the capital–output ratio is ${fx(st.KY, 2)} (${fx(st.KY0, 2)} halfway). ${Math.abs(st.gy - st.g) < 0.0015 && Math.abs(st.KY / st.KY0 - 1) < 0.03 ? 'Balanced growth: growth at $g$ with constant $K/Y$.' : 'Not balanced growth: the growth rate and $K/Y$ are still drifting or have left $g$.'} Drag the gold handle to start from a different capital stock.`);
      },
    },
  ],
};
