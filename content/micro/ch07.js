// Microeconomics — Chapter 7: Technology and costs (items 7.1–7.8; 7.9–7.15 in ch07-b.js)
import { clamp, GUIDE, LBL, sgn, fx, showStage, argmax, argmin, dif, trimArrow, plateText, slopeLine, scaleFn, tech, mpNum, rayLevel, isoq, drawIsoq, isocost, cminNum, sigmaNum, sample } from './ch07.shared.js';

/** Floor frame for a 3D production surface (L along x, K along y). */
function floor3(S3, z) {
  const c = [[-1, -1, z], [1, -1, z], [1, 1, z], [-1, 1, z]];
  for (let i = 0; i < 4; i++) S3.line(c[i], c[(i + 1) % 4], { color: 'faint', width: 1 });
  S3.text('L', [0, -1.22, z], { color: 'muted', math: true }); S3.text('K', [1.24, 0, z], { color: 'muted', math: true });
}
/** Vertical bar with a label above it. */
function bar(s, x, w, y0, y1, col, st = {}) { s.rect(x - w / 2, y0, x + w / 2, y1, { fill: col, fillAlpha: st.fillAlpha ?? 0.75, color: col, width: 1.2, ...st }); }

export default {
  collection: 'micro',
  chapter: 7,
  title: 'Technology and costs',
  summary: String.raw`A firm turns inputs into output according to a production function, described by its marginal products, its isoquants and its returns to scale; the elasticity of substitution measures how bent the isoquants are, from the right angles of fixed proportions to the straight lines of perfect substitutes. Minimizing the cost of each output level, where an isocost line is tangent to an isoquant, yields the conditional factor demands and the cost function, and from it the whole family of total, average and marginal cost curves, with marginal cost crossing average cost at its minimum and mirroring the marginal product of the variable input. The envelope theorem, introduced here as a general tool, gives Shephard's lemma and explains why the long-run average cost curve wraps around the short-run curves; sunk costs, by contrast, never enter a forward-looking decision.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1', kind: 'Definition', name: 'Production function and marginal product',
      statement: String.raw`A **production function** $y = f(L, K)$ gives the largest output a firm can obtain from $L$ units of labour and $K$ units of capital with the best available technique. It is usually assumed nondecreasing in each input, with $f(0, 0) = 0$. The **marginal product** of an input is the extra output from a small increase in that input alone,
$$MP_L(L, K) = \frac{\partial f}{\partial L}(L, K), \qquad MP_K(L, K) = \frac{\partial f}{\partial K}(L, K),$$
and the **average product** of labour is $AP_L = f(L, K)/L$. Holding capital fixed at $\bar K$, the graph of $L \mapsto f(L, \bar K)$ is the **total-product curve**: $MP_L$ is the slope of its tangent and $AP_L$ the slope of the ray from the origin to the point. Since $\frac{d}{dL}AP_L = (MP_L - AP_L)/L$, the average product rises while the marginal product lies above it, falls while it lies below, and $MP_L = AP_L$ wherever $AP_L$ has an interior maximum.`,
      idea: String.raw`A production function compresses an engineering frontier into one number per input bundle, so everything later in the chapter is calculus on it. A partial derivative (Rudin 9.15 for the general setting) freezes the other input; geometrically it is the slope of a slice of the production surface. The relation between marginal and average is the quotient rule: $AP_L' = (L f_L - f)/L^2 = (MP_L - AP_L)/L$. So a marginal value above the average pulls the average up, exactly like a grade above your average raising it, and at the peak of $AP_L$ the ray from the origin is tangent to the total-product curve.`,
      caption: String.raw`Left: the production surface $y = f(L, K)$, with the slice at the chosen capital $\bar K$ in blue. Middle: that slice, the total-product curve. **Drag the gold point** along it: the orange tangent has slope $MP_L$ and the teal ray from the origin has slope $AP_L$. Below, both are traced against $L$; they cross exactly where $AP_L$ peaks (green), which is also where the ray is tangent to the curve. Move $\bar K$ and the whole slice shifts; switch to **Cobb–Douglas** and the average product falls from the start, so there is no interior peak.`,
      deps: [], refs: ['Varian Ch. 19', 'Mankiw Ch. 13'], tags: ['production'],
      see: ['micro-4.9', 'macro-2.14'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Production_function' },
      viz(v) {
        const FAM = {
          s: { label: 'S-shaped (variable returns)', T: tech('hom', { S: scaleFn('U', { e1: 0.22, ys: 9 }), a: 0.5 }) },
          cd: { label: 'Cobb–Douglas $\\sqrt{LK}$', T: tech('cd', { A: 1, a: 0.5, b: 0.5 }) },
        };
        const fam = v.select('technology', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 's');
        const Kb = v.slider('capital $\\bar K$', 2, 12, 6, { step: 0.1 });
        const LM = 14, KM = 12, YM = 11;
        const S3 = v.stage3d({ range: 1.45, height: 330, yaw: -0.75, pitch: 0.42, axes: false, title: 'the production surface $y = f(L, K)$', weight: 0.9 });
        const tp = v.stage({ x: [0, LM], y: [0, YM], height: 330, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'output y', title: 'total product $f(L, \\bar K)$', weight: 1.1 });
        const mp = v.stage({ x: [0, LM], y: [0, 2.6], height: 210, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'output per worker', full: true, title: 'marginal product (tangent slope) and average product (ray slope)' });
        v.legend([['accent', 'total product'], ['orange', 'marginal product $MP_L$'], ['teal', 'average product $AP_L$'], ['green', 'peak of $AP_L$: $MP_L = AP_L$']]);
        const h = tp.handle(4, 4, { color: 'gold', r: 7, constrain: (x) => { const L = clamp(x, 0.15, LM - 0.2); return [L, FAM[fam.value].T.f(L, Kb.value)]; } });
        let st = {};
        v.render(() => {
          const T = FAM[fam.value].T, K = Kb.value, f = (L) => T.f(L, K), L = h.x, y = f(L);
          h.set(L, y);
          const MP = T.mp(L, K)[0], AP = y / L;
          const pk = fam.value === 's' ? argmax((x) => f(x) / x, 0.05, LM, 200) : null;
          // 3D surface
          const ZM = T.zm || (T.zm = T.f(LM, KM)), X3 = (x) => (2 * x) / LM - 1, Y3 = (k) => (2 * k) / KM - 1, Z = (q) => -0.7 + (1.45 * q) / ZM, Z0 = -0.7;
          floor3(S3, Z0);
          S3.surface((a, b) => [X3(a), Y3(b), Z(T.f(a, b))], [0.05, LM], [0.05, KM], { n: 22, colorFn: (a, b) => v.M.cmap(0.12 + (0.8 * T.f(a, b)) / ZM, 'viridis'), alpha: 0.7 });
          const sl = []; for (let i = 0; i <= 70; i++) { const a = 0.05 + ((LM - 0.05) * i) / 70; sl.push([X3(a), Y3(K), Z(f(a)) + 0.012]); }
          S3.path(sl, { color: 'accent', width: 3.4, bias: -3 });
          S3.line([X3(0), Y3(K), Z0], [X3(LM), Y3(K), Z0], { color: 'accent', width: 1.3, dash: true });
          S3.line([X3(L), Y3(K), Z0], [X3(L), Y3(K), Z(y)], { color: 'gold', width: 1.3, dash: true });
          S3.dot([X3(L), Y3(K), Z(y)], { r: 5.5, color: 'gold', bias: -3.4 });
          // total product slice
          tp.fn(f, { domain: [0.001, LM], color: 'accent', width: 2.8 });
          if (pk) { tp.clip(() => tp.line(0, 0, LM, (LM * pk.f), { color: 'green', width: 1.2, dash: [5, 4], alpha: 0.8 })); tp.dot(pk.x, f(pk.x), { r: 4.5, color: 'green', hollow: true }); }
          tp.clip(() => tp.line(0, 0, LM, AP * LM, { color: 'teal', width: 2.2 }));
          slopeLine(tp, L, y, MP, 70, { color: 'orange', width: 2.6 });
          tp.line(L, 0, L, y, GUIDE);
          tp.corner(`tangent slope $MP_L = ${v.fix(MP, 3)}$,  ray slope $AP_L = ${v.fix(AP, 3)}$`, 'tl');
          // MP and AP
          const top = fam.value === 's' ? 2.6 : 2.6;
          mp.setView([0, LM], [0, top]);
          mp.fn((x) => T.mp(x, K)[0], { domain: [0.02, LM], color: 'orange', width: 2.6 });
          mp.fn((x) => f(x) / x, { domain: [0.02, LM], color: 'teal', width: 2.6 });
          if (pk) { mp.line(pk.x, 0, pk.x, pk.f, { color: 'green', width: 1.2, dash: [4, 3] }); mp.dot(pk.x, pk.f, { r: 6, color: 'green', label: `AP peak, L = ${v.fix(pk.x, 2)}`, labelPos: 'nw', math: false }); }
          mp.line(L, 0, L, top, GUIDE);
          mp.dot(L, Math.min(MP, top), { r: 5, color: 'orange' }); mp.dot(L, AP, { r: 5, color: 'teal' });
          st = { T, K, L, y, MP, AP, pk, num: (f(L + 1e-4) - f(L - 1e-4)) / 2e-4 };
        });
        v.readout(() => {
          const { L, y, MP, AP, pk, num, K } = st, f3 = (q) => v.fix(q, 3);
          const rel = Math.abs(MP - AP) < 2e-3 ? 'equal, so $AP_L$ is at its peak' : MP > AP ? '$MP_L > AP_L$, so the average product is **rising**' : '$MP_L < AP_L$, so the average product is **falling**';
          const pkTxt = pk ? ` The peak of $AP_L$ is at $L = ${v.fix(pk.x, 2)}$, where $MP_L = ${f3(st.T.mp(pk.x, K)[0])}$ and $AP_L = ${f3(pk.f)}$.` : ' For Cobb–Douglas $MP_L = \\tfrac12 AP_L$ everywhere, so $AP_L$ only falls.';
          return `At $L = ${v.fix(L, 2)}$, $\\bar K = ${v.fix(K, 1)}$: output $y = ${f3(y)}$, $MP_L = ${f3(MP)}$ (difference quotient ${f3(num)}), $AP_L = y/L = ${f3(AP)}$: ${rel}.${pkTxt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2', kind: 'Principle', name: 'Diminishing marginal returns',
      statement: String.raw`If one input is increased while the others are held fixed, its marginal product eventually declines: beyond some point each additional unit of the variable input adds less output than the one before. Formally, for each fixed $\bar K$ there is an $L_0$ with $\partial^2 f/\partial L^2 (L, \bar K) < 0$ for $L > L_0$. The marginal product may rise at first (specialization while the fixed input is under-used), but the decline sets in once the variable input crowds the fixed one.`,
      scope: String.raw`An empirical regularity about the **short run**, not a theorem: it requires at least one input to be held fixed and the technique to be unchanged. It says nothing about scaling all inputs together (that is returns to scale, 7.4); when the "fixed" input grows in proportion, the decline can disappear entirely.`,
      idea: String.raw`With the equipment fixed, each extra worker has less of it to work with: the ratio $\bar K/L$ falls, and output per unit of the scarce input cannot rise without bound. The first workers may be more than proportionally productive because they can divide tasks, which gives the S-shaped total-product curve of 7.1. The law is about **proportions**: with a constant-returns technology $f(L, K) = K\,g(L/K)$, the marginal product of labour depends only on $L/K$, so scaling the kitchen with the staff keeps every cook as productive as the last.`,
      caption: String.raw`A kitchen with a fixed number of **stations**. Each bar is the extra meals per hour contributed by one more cook; bars are green while they grow and orange once they shrink, and faint bars preview the cooks not yet hired. Enlarge the kitchen and the decline is postponed to a later cook. Then switch to **kitchen grows with the staff**: with equipment proportional to the number of cooks every bar has the same height, because the law needs a fixed input.`,
      deps: ['micro-7.1'], refs: ['Mankiw Ch. 13', 'Varian Ch. 19'], tags: ['production'],
      credit: 'Anne-Robert-Jacques Turgot, 1767; David Ricardo and Thomas Malthus, 1815',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Diminishing_returns' },
      viz(v) {
        const M = 30, c = 4, p = 3, NMAX = 14;
        const f = (L, K) => (L <= 0 ? 0 : (M * K * (L / K) ** p) / (c + (L / K) ** p));
        const mode = v.select('equipment', [{ value: 'fixed', label: 'kitchen fixed' }, { value: 'grow', label: 'kitchen grows with the staff' }], 'fixed');
        const Ks = v.slider('stations in the kitchen', 1, 5, 2, { step: 0.5 });
        const n = v.slider('cooks hired', 1, NMAX, 6, { int: true });
        const s = v.stage({ x: [0.3, NMAX + 0.7], y: [0, 26], height: 300, axes: 'box', gutter: true, xlabel: 'cook number', ylabel: 'extra meals/hour', xticks: [...Array(NMAX).keys()].map((i) => i + 1), title: 'what each additional cook adds (marginal product)', weight: 1.25 });
        const t = v.stage({ x: [0, NMAX + 0.5], y: [0, 160], height: 300, axes: 'box', gutter: true, xlabel: 'cooks', ylabel: 'meals/hour', title: 'total output', weight: 0.9 });
        v.legend([['green', 'marginal product rising', { area: true }], ['orange', 'marginal product falling', { area: true }], ['faint', 'cooks not yet hired', { area: true }], ['accent', 'total output']]);
        let st = {};
        v.render(() => {
          const grow = mode.value === 'grow', K0 = Ks.value, N = n.value;
          const Kof = (i) => (grow ? (K0 * i) / 4 : K0);
          const out = (i) => (i <= 0 ? 0 : f(i, Kof(i)));
          const mp = []; for (let i = 1; i <= NMAX; i++) mp.push(out(i) - out(i - 1));
          let peak = 0; for (let i = 1; i < NMAX; i++) if (mp[i] < mp[i - 1] - 1e-9) { peak = i; break; }
          const top = Math.max(26, Math.ceil(Math.max(...mp) / 4) * 4 + 4);
          s.setView([0.3, NMAX + 0.7], [0, top]);
          mp.forEach((m, i) => {
            const k = i + 1, hired = k <= N, falling = !grow && peak && k > peak, col = grow ? 'accent' : falling ? 'orange' : 'green';
            bar(s, k, 0.72, 0, m, hired ? col : 'faint', { fillAlpha: hired ? 0.78 : 0.35, alpha: hired ? 1 : 0.5 });
            if (hired && m * (s.height / top) > 16) s.text(v.fix(m, 1), k, m, { dy: -9, size: 10.5, color: 'ink', align: 'center' });
          });
          if (!grow && peak) { s.vline(peak + 0.5, { color: 'orange', width: 1.2, dash: [5, 4] }); plateText(s, `diminishing returns from cook ${peak + 1}`, peak + 0.6, top * 0.92, { color: 'orange', align: 'left' }); }
          if (grow) plateText(s, `every cook adds ${v.fix(mp[0], 2)} meals/hour`, NMAX / 2 + 0.5, top * 0.92, { color: 'accent', align: 'center' });
          // total output
          const tot = []; for (let i = 0; i <= NMAX; i++) tot.push([i, out(i)]);
          const tmax = Math.ceil((Math.max(out(NMAX), grow ? 0 : M * K0) * 1.18) / 10) * 10;
          t.setView([0, NMAX + 0.5], [0, tmax]);
          t.path(tot, { color: v.color('accent', 0.35), width: 1.5 });
          for (let i = 1; i <= N; i++) {
            const col = !grow && peak && i > peak ? 'orange' : grow ? 'accent' : 'green';
            t.rect(i - 1, out(i - 1), i, out(i), { fill: col, fillAlpha: 0.3, stroke: false });
            t.line(i, out(i - 1), i, out(i), { color: col, width: 4 });
            t.line(i - 1, out(i - 1), i, out(i - 1), { color: 'muted', width: 1, dash: [3, 3] });
          }
          t.path(tot.slice(0, N + 1), { color: 'accent', width: 2.6 });
          t.dots(tot.slice(1, N + 1), { r: 3.5, color: 'accent' });
          if (!grow) t.hline(M * K0, { color: 'muted', width: 1, dash: [4, 4] });
          if (!grow) t.text(`capacity ${M * K0} meals/hour`, 0.3, M * K0, { dy: -8, size: 11, color: 'muted', align: 'left' });
          st = { grow, K0, N, mp, peak, total: out(N) };
        });
        v.readout(() => {
          const { grow, K0, N, mp, peak, total } = st, f1 = (q) => v.fix(q, 1);
          if (grow) return `Equipment grows with the staff (${v.fix(K0 / 4, 3)} stations per cook): output is $f(n, \\kappa n) = n\\,f(1, \\kappa)$, so cook ${N} adds ${f1(mp[N - 1])} meals/hour, exactly as much as cook 1 (${f1(mp[0])}). Total ${f1(total)} meals/hour. No input is fixed, so the law has nothing to say.`;
          const last = mp[N - 1], prev = N > 1 ? mp[N - 2] : 0;
          return `With ${v.fix(K0, 1)} stations, cook ${N} adds ${f1(last)} meals/hour${N > 1 ? ` (cook ${N - 1} added ${f1(prev)}: ${last < prev ? '**less**' : 'more'} than before)` : ''}; total ${f1(total)} meals/hour. Marginal product rises up to cook ${peak} and falls for every cook after that. Each station has ${v.fix(N / K0, 2)} cooks: the more crowded the fixed equipment, the less each newcomer adds.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3', kind: 'Definition', name: 'Isoquants and the technical rate of substitution',
      statement: String.raw`The **isoquant** of level $y$ is the set of input bundles that produce exactly $y$: $\{(L, K) : f(L, K) = y\}$. Where $f$ is differentiable with $f_K \neq 0$, the implicit function theorem makes the isoquant locally a graph $K = K(L)$ with slope
$$\frac{dK}{dL} = -\frac{MP_L}{MP_K} = -TRS(L, K),$$
and the **technical rate of substitution** $TRS$ is the amount of capital that can be released when one more unit of labour is used, output unchanged. The **elasticity of substitution** $\sigma = \dfrac{d\ln(K/L)}{d\ln TRS}$ measures how fast the input ratio changes as one moves along an isoquant. Standard cases: **fixed proportions** (Leontief) $\min(L/a, K/b)$, L-shaped isoquants, $\sigma = 0$; **Cobb–Douglas** $L^aK^b$, $\sigma = 1$; **perfect substitutes** $aL + bK$, straight isoquants, $\sigma = \infty$; and the **CES** family $(\alpha L^\rho + (1-\alpha)K^\rho)^{1/\rho}$ with constant $\sigma = 1/(1-\rho)$, which contains all three as limits.`,
      idea: String.raw`Differentiate $f(L, K(L)) = y$ with the chain rule: $f_L + f_K\,K'(L) = 0$, which is the implicit function theorem (Rudin 9.28) in two variables. The isoquant map of a production function is formally like an indifference map (4.12), but output is cardinal, so the spacing of the curves carries information (returns to scale, 7.4). For CES the ratio of marginal products is $TRS = \frac{\alpha}{1-\alpha}(K/L)^{1-\rho}$, so $\ln(K/L)$ is a linear function of $\ln TRS$ with slope $1/(1-\rho)$: a constant elasticity, which is what the family is named for.`,
      caption: String.raw`**Drag the gold bundle.** The isoquant through it is drawn bold, and the orange line is its tangent, with slope $-TRS = -MP_L/MP_K$ computed from the marginal products; the readout compares it with the slope measured along the traced curve. Choose **CES** and sweep $\sigma$: from nearly right-angled isoquants ($\sigma \to 0$, Leontief) through Cobb–Douglas ($\sigma = 1$) to almost straight lines ($\sigma \to \infty$). The right panel plots $\ln(K/L)$ against $\ln TRS$ along the isoquant: a straight line whose slope is $\sigma$.`,
      deps: ['micro-7.1', 'pma-9.28'], refs: ['Varian Ch. 19'], tags: ['production'],
      see: ['micro-4.12', 'micro-5.2'],
      credit: 'CES family: Arrow, Chenery, Minhas and Solow, 1961; elasticity of substitution: Hicks, 1932',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Isoquant' },
      viz(v) {
        const al = 0.4;
        const fam = v.select('technology', [{ value: 'leon', label: 'Leontief' }, { value: 'ces', label: 'CES' }, { value: 'cd', label: 'Cobb–Douglas' }, { value: 'lin', label: 'linear' }], 'ces');
        const sg = v.slider('elasticity of substitution $\\sigma$', 0.1, 8, 0.5, { log: true, sig: 3 });
        const make = () => {
          switch (fam.value) {
            case 'leon': return tech('leon', { a: 1, b: 1.5 });
            case 'cd': return tech('cd', { a: al, b: 1 - al });
            case 'lin': return tech('lin', { a: al, b: 1 - al });
            default: return tech('ces', { al, s: sg.value });
          }
        };
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'isoquant map: levels $y = 1, 2, \\dots, 9$', weight: 1.2 });
        const e = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], height: 380, axes: 'box', gutter: true, xlabel: 'ln TRS', ylabel: 'ln(K/L)', title: 'along the bold isoquant: slope $= \\sigma$' });
        v.legend([['purple', 'isoquants'], ['orange', 'tangent: slope $-TRS$'], ['gold', 'input bundle'], ['teal', '$\\ln(K/L)$ against $\\ln TRS$']]);
        const H = s.handle(3.5, 5, { color: 'gold', r: 7, label: 'x', constrain: (x, y) => [clamp(x, 0.3, 9.7), clamp(y, 0.3, 9.7)] });
        let st = {};
        v.render(() => {
          sg.el.hidden = fam.value !== 'ces';
          const T = make(), L = H.x, K = H.y, y = T.f(L, K);
          for (let q = 1; q <= 9; q++) drawIsoq(s, T, q, { color: v.color('purple', 0.42), width: 1.3 });
          const pts = isoq(T, y, 10, 10, 260);
          s.clip(() => s.path(pts, { color: 'purple', width: 2.8 }));
          const m = T.mp(L, K), trs = m[0] / m[1];
          const kink = fam.value === 'leon' && !isFinite(trs);
          if (!kink) slopeLine(s, L, K, -trs, 95, { color: 'orange', width: 2.6 });
          // slope measured on the curve: neighbouring points of the traced isoquant around the bundle
          const th = Math.atan2(K, L), R = 80, dth = 1e-3;
          const P = (t) => { const r = rayLevel(T.f, y, t, R, 70); return r == null ? null : [r * Math.cos(t), r * Math.sin(t)]; };
          const A = P(th - dth), B = P(th + dth), slope = A && B && Math.abs(B[0] - A[0]) > 1e-12 ? (B[1] - A[1]) / (B[0] - A[0]) : NaN;
          s.text(`y = ${v.fix(y, 2)}`, L, K, { dx: 12, dy: -14, ...LBL, color: 'purple', align: 'left' });
          // ln(K/L) vs ln TRS
          const sig = T.sigma;
          if (fam.value === 'leon') {
            e.hline(Math.log(1.5), { color: 'teal', width: 2.6 });
            e.text('K/L fixed at b/a whatever the TRS: σ = 0', 0, Math.log(1.5), { dy: -12, color: 'teal', ...LBL, align: 'center', plate: true });
          } else if (fam.value === 'lin') {
            e.vline(Math.log(al / (1 - al)), { color: 'teal', width: 2.6 });
            e.text('TRS = a/b at every ratio: σ = ∞', Math.log(al / (1 - al)), 1.9, { dx: 8, color: 'teal', ...LBL, align: 'left', plate: true });
          } else {
            const cv = []; for (let i = 1; i < 120; i++) { const q = P((Math.PI / 2) * (i / 120)); if (!q) continue; const mm = T.mp(q[0], q[1]); cv.push([Math.log(mm[0] / mm[1]), Math.log(q[1] / q[0])]); }
            e.clip(() => e.path(cv, { color: 'teal', width: 2.6 }));
          }
          const lt = Math.log(trs), lr = Math.log(K / L);
          if (isFinite(lt)) e.dot(clamp(lt, -2.5, 2.5), clamp(lr, -2.5, 2.5), { r: 6, color: 'gold' });
          const sn = fam.value === 'ces' || fam.value === 'cd' ? sigmaNum(T, L, K) : sig;
          st = { T, L, K, y, trs, slope, kink, sig, sn, m };
        });
        v.readout(() => {
          const { L, K, y, trs, slope, kink, sig, sn, m } = st, f3 = (q) => v.fix(q, 3);
          const head = `Bundle $(L, K) = (${v.fix(L, 2)}, ${v.fix(K, 2)})$ makes $y = ${f3(y)}$.`;
          if (kink) return head + ' It sits exactly at the corner of a Leontief isoquant, where the marginal products are not defined and the TRS jumps from $\\infty$ to 0.';
          const side = fam.value === 'leon' ? (m[0] === 0 ? ' Extra labour is useless here (surplus labour), so $MP_L = 0$: the isoquant is horizontal.' : ' Extra capital is useless here, so $MP_K = 0$: the isoquant is vertical.') : '';
          if (fam.value === 'leon') return head + side;
          const sigTxt = fam.value === 'lin' ? 'σ = ∞: the TRS is the same everywhere' : `$\\sigma$ measured on the isoquant: ${f3(sn)} (formula ${sig === 1 ? '1' : f3(sig)})`;
          return `${head} $MP_L = ${f3(m[0])}$, $MP_K = ${f3(m[1])}$, so $-MP_L/MP_K = ${fx(-trs, 4)}$; slope of the traced isoquant: ${fx(slope, 4)}. ${sigTxt}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4', kind: 'Definition', name: 'Returns to scale',
      statement: String.raw`A technology has **constant**, **increasing** or **decreasing returns to scale** if scaling every input by a factor $t > 1$ multiplies output by exactly $t$, by more than $t$, or by less than $t$:
$$f(tL, tK) = t\,f(L, K), \qquad f(tL, tK) > t\,f(L, K), \qquad f(tL, tK) < t\,f(L, K).$$
If $f$ is homogeneous of degree $k$, $f(tL, tK) = t^k f(L, K)$, returns are constant, increasing or decreasing as $k = 1$, $k > 1$ or $k < 1$; for Cobb–Douglas $AL^aK^b$, $k = a + b$. In general returns to scale can vary with the scale of operation; the local measure is the **elasticity of scale** $e(L, K) = \frac{d\ln f(tL, tK)}{d\ln t}\big|_{t=1}$.`,
      idea: String.raw`Returns to scale are about moving along a ray from the origin, keeping input proportions fixed, while diminishing marginal returns (7.2) are about moving parallel to an axis; the two are independent, and a technology can have diminishing marginal products and increasing returns to scale at once ($L^{0.7}K^{0.7}$). Because output is cardinal, returns to scale are visible on the isoquant map: along a ray the isoquants for $1, 2, 3, \dots$ units get closer together under increasing returns (each extra unit needs a smaller step) and further apart under decreasing returns. Replication arguments suggest constant returns as a benchmark: a firm can always build a second identical plant.`,
      caption: String.raw`Drag the gold bundle $x$ and the scale factor $t$: the bundle $t\,x$ (green) lies on the ray through $x$. Ticks on the ray mark where it crosses the isoquants $y = 1, 2, 3, \dots$; watch them **bunch together** as you raise the degree $k$ above 1 and **spread apart** below 1. The right panel plots output along the ray, $f(t\,x)$, against the dashed proportional line $t\,f(x)$. Choose **variable returns** for a technology whose returns are increasing at small scale and decreasing at large scale.`,
      deps: ['micro-7.3'], refs: ['Varian Ch. 19'], tags: ['production', 'scale'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Returns_to_scale' },
      viz(v) {
        const fam = v.select('technology', [{ value: 'cd', label: 'homogeneous $L^{k/2}K^{k/2}$' }, { value: 'var', label: 'variable returns' }], 'cd');
        const kS = v.slider('degree $k$', 0.4, 1.8, 1.4, { step: 0.05 });
        const tS = v.slider('scale factor $t$', 0.25, 3, 2, { step: 0.01 });
        const VAR = tech('hom', { S: scaleFn('U', { ys: 4.5, e1: 0.3 }), a: 0.5 });
        const s = v.stage({ x: [0, 12], y: [0, 12], height: 380, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'isoquants $y = 1, 2, 3, \\dots$ and a ray', weight: 1.15 });
        const g = v.stage({ x: [0, 3], y: [0, 10], height: 380, axes: 'box', gutter: true, xlabel: 'scale factor t', ylabel: 'output', title: 'output along the ray' });
        v.legend([['purple', 'isoquants'], ['gold', 'bundle x'], ['green', 'bundle t·x and its output'], ['muted', 'proportional output t·f(x)', { dash: true }]]);
        const H = s.handle(2.2, 1.8, { color: 'gold', r: 7, label: 'x', constrain: (x, y) => [clamp(x, 0.4, 6), clamp(y, 0.4, 6)] });
        let st = {};
        v.render(() => {
          kS.el.hidden = fam.value !== 'cd';
          const T = fam.value === 'cd' ? tech('cd', { a: kS.value / 2, b: kS.value / 2 }) : VAR;
          const L = H.x, K = H.y, t = tS.value, y0 = T.f(L, K), yt = T.f(t * L, t * K);
          const lv = []; for (let q = 1; q <= 12; q++) lv.push(q);
          for (const q of lv) drawIsoq(s, T, q, { color: v.color('purple', 0.5), width: 1.3 });
          // ray and crossings
          const th = Math.atan2(K, L), rr = Math.hypot(L, K);
          s.clip(() => s.line(0, 0, 20 * Math.cos(th), 20 * Math.sin(th), { color: 'muted', width: 1.2 }));
          const cross = [];
          for (const q of lv) { const r = rayLevel(T.f, q, th, 40, 60); if (r != null) cross.push([q, r]); }
          for (const [q, r] of cross) {
            const px = r * Math.cos(th), py = r * Math.sin(th);
            if (px > 12 || py > 12) continue;
            s.dot(px, py, { r: 3.2, color: 'purple' });
            if (q <= 6) s.text(String(q), px, py, { dx: 7, dy: 8, size: 10.5, color: 'purple', align: 'left' });
          }
          s.dot(t * L, t * K, { r: 6.5, color: 'green', label: 't·x', labelPos: 'se', math: false });
          // gaps along the ray (in units of distance)
          const gaps = []; for (let i = 1; i < cross.length; i++) gaps.push(cross[i][1] - cross[i - 1][1]);
          // output along the ray
          const tmax = 3, ytop = Math.max(10, Math.min(40, Math.ceil(T.f(tmax * L, tmax * K) * 1.08)));
          g.setView([0, tmax], [0, Math.max(ytop, y0 * tmax * 1.08)]);
          g.between((u) => T.f(u * L, u * K), (u) => u * y0, 1, Math.max(1, t), { fill: yt > t * y0 ? 'green' : 'red', fillAlpha: 0.14 });
          g.between((u) => T.f(u * L, u * K), (u) => u * y0, Math.min(1, t), 1, { fill: yt > t * y0 ? 'green' : 'red', fillAlpha: 0.14 });
          g.fn((u) => u * y0, { color: 'muted', width: 1.6, dash: [6, 4] });
          g.fn((u) => T.f(u * L, u * K), { domain: [0.001, tmax], color: 'purple', width: 2.8 });
          g.dot(1, y0, { r: 5.5, color: 'gold', label: 'f(x)', labelPos: 'nw', math: false });
          g.dot(t, yt, { r: 6, color: 'green' }); g.dot(t, t * y0, { r: 4, color: 'muted', hollow: true });
          g.line(t, 0, t, Math.max(yt, t * y0), GUIDE);
          const e = (L * T.mp(L, K)[0] + K * T.mp(L, K)[1]) / y0;
          st = { T, L, K, t, y0, yt, gaps, e, k: fam.value === 'cd' ? kS.value : null, rr };
        });
        v.readout(() => {
          const { t, y0, yt, gaps, e, k } = st, f3 = (q) => v.fix(q, 3);
          const ratio = yt / (t * y0);
          const kind = Math.abs(ratio - 1) < 1e-3 ? 'constant' : (ratio > 1) === (t > 1) ? 'increasing' : 'decreasing';
          const gp = gaps.slice(0, 4).map((z) => v.fix(z, 2)).join(', ');
          const hom = k != null ? ` Homogeneous of degree $k = ${v.fix(k, 2)}$: $t^k f(x) = ${f3(t ** k * y0)}$.` : ` Elasticity of scale at $x$: ${f3(e)} (${e > 1.0005 ? 'increasing' : e < 0.9995 ? 'decreasing' : 'constant'} returns here).`;
          return `$f(x) = ${f3(y0)}$ and $f(t\\,x) = ${f3(yt)}$ against $t\\,f(x) = ${f3(t * y0)}$: ratio ${f3(ratio)}, **${kind} returns** over this stretch.${hom} Distances along the ray between successive isoquants: ${gp}${gaps.length > 4 ? ', …' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5', kind: 'Theorem', name: 'Euler’s theorem and product exhaustion',
      statement: String.raw`Let $f$ be differentiable on the positive quadrant and homogeneous of degree $k$: $f(tL, tK) = t^k f(L, K)$ for all $t > 0$. Then at every bundle
$$L\,\frac{\partial f}{\partial L} + K\,\frac{\partial f}{\partial K} = k\,f(L, K).$$
In particular, with constant returns ($k = 1$), paying each input its marginal product in units of output, $w/p = MP_L$ and $r/p = MP_K$, distributes **exactly** the whole output (product exhaustion). With increasing returns ($k > 1$) such payments would exceed the output; with decreasing returns ($k < 1$) a residual is left over.`,
      idea: String.raw`Differentiate the identity $f(tL, tK) = t^k f(L, K)$ with respect to $t$ by the chain rule (Rudin 9.15): the left side gives $L f_L(tL, tK) + K f_K(tL, tK)$, the right side $k t^{k-1} f(L, K)$; set $t = 1$. The economic reading settled a 19th-century debate (Wicksteed 1894, Flux 1894): under constant returns, competitive factor payments according to marginal productivity leave neither a surplus nor a deficit, so the "adding-up problem" disappears. Conversely, the identity with a constant $k$ at all bundles characterizes homogeneous functions.`,
      caption: String.raw`Drag the gold bundle on the isoquant map and set the degree $k$ and labour's exponent share. The bars show $L\cdot MP_L$ (blue) and $K\cdot MP_K$ (orange), computed by numerical differentiation, stacked against output $y$ and $k\,y$: the stack always equals $k\,y$. At $k = 1$ it equals output; at $k > 1$ it overshoots (red), at $k < 1$ it leaves a residual (green). Choose the **non-homogeneous** technology and drag: the ratio of the stack to output changes from bundle to bundle, so no single $k$ works.`,
      deps: ['micro-7.4', 'pma-9.15'], refs: ['Varian Ch. 19'], tags: ['production', 'distribution'],
      credit: 'Leonhard Euler, 1755; Philip Wicksteed and A. W. Flux, 1894',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Homogeneous_function#Euler%27s_theorem' },
      viz(v) {
        const fam = v.select('technology', [{ value: 'hom', label: 'homogeneous: Cobb–Douglas' }, { value: 'non', label: 'non-homogeneous' }], 'hom');
        const kS = v.slider('degree $k = a + b$', 0.5, 1.5, 1, { step: 0.01 });
        const shS = v.slider('labour share of the exponents $a/k$', 0.15, 0.85, 0.6, { step: 0.01 });
        const NON = tech('hom', { S: scaleFn('U', { ys: 4, e1: 0.4 }), a: 0.6 });
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 360, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'isoquants and the bundle', weight: 1.1 });
        const b = v.stage({ x: [0, 4], y: [0, 10], height: 360, axes: 'box', gutter: true, ylabel: 'units of output', xticks: [[1, 'L·MP_L + K·MP_K'], [2.2, 'output y'], [3.3, 'k·y']], title: 'paying each input its marginal product' });
        v.legend([['blue', '$L\\cdot MP_L$', { area: true }], ['orange', '$K\\cdot MP_K$', { area: true }], ['purple', 'output $y$', { area: true }], ['green', 'residual left over', { area: true }], ['red', 'shortfall', { area: true }]]);
        const H = s.handle(4, 3, { color: 'gold', r: 7, label: 'x', constrain: (x, y) => [clamp(x, 0.4, 9.6), clamp(y, 0.4, 9.6)] });
        let st = {};
        v.render(() => {
          const homo = fam.value === 'hom';
          kS.el.hidden = !homo; shS.el.hidden = !homo;
          const k = kS.value, a = k * shS.value, bb = k - a;
          const T = homo ? tech('cd', { A: 1, a, b: bb }) : NON;
          const L = H.x, K = H.y, y = T.f(L, K), m = mpNum(T, L, K, 1e-5), pL = L * m[0], pK = K * m[1], sum = pL + pK;
          const levels = [0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8];
          for (const q of levels) drawIsoq(s, T, q, { color: v.color('purple', 0.45), width: 1.2 });
          drawIsoq(s, T, y, { color: 'purple', width: 2.6 });
          s.clip(() => s.line(0, 0, 10 * L, 10 * K, { color: 'muted', width: 1, dash: [4, 4] }));
          s.text(`y = ${v.fix(y, 2)}`, L, K, { dx: 10, dy: -14, ...LBL, color: 'purple', align: 'left' });
          // bars
          const top = Math.max(sum, y, homo ? k * y : sum) * 1.22 + 0.2;
          b.setView([0, 4], [0, top]);
          bar(b, 1, 0.8, 0, pL, 'blue'); bar(b, 1, 0.8, pL, sum, 'orange');
          if (b.Y(0) - b.Y(pL) > 18) b.text(v.fix(pL, 2), 1, pL / 2, { color: 'ink', size: 11, align: 'center', baseline: 'middle', plate: true });
          if (b.Y(pL) - b.Y(sum) > 18) b.text(v.fix(pK, 2), 1, pL + pK / 2, { color: 'ink', size: 11, align: 'center', baseline: 'middle', plate: true });
          bar(b, 2.2, 0.8, 0, y, 'purple', { fillAlpha: 0.55 });
          if (sum < y - 1e-6) bar(b, 1, 0.8, sum, y, 'green', { fillAlpha: 0.25, hatch: 'green' });
          if (sum > y + 1e-6) b.rect(2.2 - 0.4, y, 2.2 + 0.4, sum, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 1.2, hatch: 'red' });
          b.hline(sum, { color: 'muted', width: 1, dash: [4, 4] });
          b.text(`${v.fix(sum, 3)}`, 1, sum, { dy: -9, size: 11, color: 'ink', align: 'center', weight: 700 });
          b.text(`${v.fix(y, 3)}`, 2.2, Math.max(y, sum), { dy: -9, size: 11, color: 'purple', align: 'center', weight: 700 });
          if (homo) { bar(b, 3.3, 0.6, 0, k * y, 'muted', { fillAlpha: 0.35 }); b.text(`${v.fix(k * y, 3)}`, 3.3, k * y, { dy: -9, size: 11, color: 'muted', align: 'center', weight: 700 }); }
          st = { homo, k, y, pL, pK, sum, L, K };
        });
        v.readout(() => {
          const { homo, k, y, pL, pK, sum } = st, f3 = (q) => v.fix(q, 4);
          const cmp = Math.abs(sum - y) < 1e-4 ? 'exactly exhausts the output' : sum > y ? `exceeds output by ${f3(sum - y)}: marginal-product pay is **not feasible**` : `leaves a residual of ${f3(y - sum)}`;
          if (!homo) return `$L\\,MP_L + K\\,MP_K = ${f3(pL)} + ${f3(pK)} = ${f3(sum)}$ and $y = ${f3(y)}$: ratio ${v.fix(sum / y, 4)}. This technology is not homogeneous: drag the bundle along a ray and the ratio (the elasticity of scale) changes, from above 1 near the origin to below 1 far out, so Euler's identity holds with no constant $k$, and the stack ${cmp}.`;
          return `$L\\,MP_L + K\\,MP_K = ${f3(pL)} + ${f3(pK)} = ${f3(sum)}$; $k\\,y = ${v.fix(k, 2)} \\times ${f3(y)} = ${f3(k * y)}$ (difference ${v.sci(Math.abs(sum - k * y) || 0, 2)}). Paying marginal products ${cmp}. Labour's share of output is $a/k \\cdot k = ${v.fix(pL / y, 3)}$ = its exponent.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6', kind: 'Concept', name: 'Short run and long run',
      statement: String.raw`The **short run** is a period too short to change some inputs (typically plant and equipment, $K = \bar K$), so output can be varied only through the variable inputs; the **long run** is long enough to vary every input. Short-run cost is $c_s(y; \bar K) = w\,L_s(y; \bar K) + r\bar K$ where $L_s$ solves $f(L, \bar K) = y$; long-run cost is $c(y) = \min_{L, K}\{wL + rK : f(L, K) \ge y\}$. Because the long-run problem has more freedom,
$$c(y) \le c_s(y; \bar K) \quad\text{for all } y \text{ and } \bar K,$$
with equality at the output $y$ for which $\bar K$ is exactly the long-run cost-minimizing amount of capital.`,
      idea: String.raw`Minimizing over a larger set can only lower the minimum: the short-run choice is one of the bundles available in the long run. In input space the short-run firm slides along the horizontal line $K = \bar K$, while the long-run firm moves along its expansion path, the locus of tangencies between isoquants and isocost lines (7.7). The two paths cross once, at the output for which the fixed plant happens to be right; elsewhere the short-run bundle lies on a higher isocost line. In cost space this makes the long-run cost curve the lower envelope of the short-run curves (7.14).`,
      caption: String.raw`Set the output $y$ and the plant size $\bar K$. On the input map the orange dashed line is the short-run path $K = \bar K$, and the green curve is the long-run expansion path; the two bundles for $y$ sit on the same purple isoquant, each with its isocost line. **Toggle** which run the firm is in. Right: the short-run and long-run total cost curves; the short-run curve touches the long-run one at a single output and lies above it everywhere else. The technology is not homothetic, so the expansion path bends toward labour as output grows.`,
      deps: ['micro-7.1'], refs: ['Varian Ch. 19', 'Mankiw Ch. 13'], tags: ['costs'],
      credit: 'Alfred Marshall, 1890',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Long_run_and_short_run' },
      viz(v) {
        const w = 10, r = 10;
        const f = (L, K) => (L <= 0 || K <= 0 ? 0 : 1.1 * L ** 0.35 * K ** 0.45 + 0.3 * L);
        const T = { f, kinks: [], mp: (L, K) => mpNum({ f }, L, K) };
        const run = v.select('the firm is in the', [{ value: 'short', label: 'short run: K fixed' }, { value: 'long', label: 'long run: K adjustable' }], 'short');
        const yS = v.slider('output $y$', 0.5, 9.5, 6.5, { step: 0.05 });
        const KS = v.slider('plant size $\\bar K$', 1, 10, 3, { step: 0.05 });
        const s = v.stage({ x: [0, 16], y: [0, 12], height: 360, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'input space ($w = r = 10$)', weight: 1.1 });
        const c = v.stage({ x: [0, 10], y: [0, 260], height: 360, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'total cost', title: 'short-run and long-run total cost' });
        v.legend([['purple', 'isoquant for y'], ['orange', 'short run: K = K̄', { dash: true }], ['green', 'long run: expansion path'], ['ink', 'long-run cost c(y)'], ['orange', 'short-run cost c_s(y; K̄)', { dash: true }]]);
        const lr = {}; const LR = (y) => { const k = y.toFixed(3); return lr[k] || (lr[k] = cminNum(T, w, r, y)); };
        const Ls = (y, K) => { let hi = 1; while (f(hi, K) < y && hi < 1e6) hi *= 2; let lo = 0; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m, K) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
        const tab = []; for (let i = 1; i <= 120; i++) { const y = (12 * i) / 120, q = cminNum(T, w, r, y); tab.push({ y, x: q.x, c: q.c }); }
        const path = tab.map((q) => q.x), lcost = [[0, 0], ...tab.map((q) => [q.y, q.c])];
        /** output at which the long-run capital equals K (interpolated in the table) */
        const yOfK = (K) => { if (K <= tab[0].x[1]) return tab[0].y * (K / tab[0].x[1]); for (let i = 1; i < tab.length; i++) if (tab[i].x[1] >= K) { const a = tab[i - 1], b = tab[i]; return a.y + ((K - a.x[1]) / (b.x[1] - a.x[1])) * (b.y - a.y); } return tab[tab.length - 1].y; };
        let st = {};
        v.render(() => {
          const y = yS.value, Kb = KS.value, sr = run.value === 'short';
          const B = LR(y), Ld = Ls(y, Kb), cs = w * Ld + r * Kb;
          const yT = yOfK(Kb);
          const aS = sr ? 1 : 0.4, aL = sr ? 0.4 : 1;
          // input space
          drawIsoq(s, T, y, { color: 'purple', width: 2.6 });
          isocost(s, w, r, B.c, { color: 'green', width: 1.8, alpha: aL });
          isocost(s, w, r, cs, { color: 'orange', width: 1.8, dash: [6, 4], alpha: aS });
          s.hline(Kb, { color: v.color('orange', aS), width: 2.2, dash: [7, 5] });
          s.clip(() => s.path([[0, 0], ...path], { color: v.color('green', aL), width: 2.8 }));
          s.dot(B.x[0], B.x[1], { r: sr ? 5 : 7, color: 'green', label: 'long run', labelPos: 'nw', math: false });
          s.dot(Ld, Kb, { r: sr ? 7 : 5, color: 'orange', label: 'short run', labelPos: Ld > B.x[0] ? 'se' : 'sw', math: false });
          // cost curves
          const ymax = 10, cmax = 260;
          c.clip(() => c.path(lcost, { color: 'ink', width: 2.8 }));
          c.clip(() => c.fn((q) => w * Ls(q, Kb) + r * Kb, { domain: [0.001, ymax], color: 'orange', width: 2.4, dash: [7, 4], n: 160 }));
          c.line(y, 0, y, Math.max(cs, B.c), GUIDE);
          if (cs - B.c > 1) c.measure(y, B.c, y, Math.min(cs, cmax), null, { color: 'red' });
          c.dot(y, B.c, { r: sr ? 4.5 : 6.5, color: 'green' }); if (cs < cmax) c.dot(y, cs, { r: sr ? 6.5 : 4.5, color: 'orange' });
          const cT = LR(yT).c;
          c.dot(yT, cT, { r: 4.5, color: 'ink', hollow: true, label: 'touch', labelPos: 'nw', math: false });
          c.text(`fixed cost rK̄ = ${v.fix(r * Kb, 0)}`, 0.2, r * Kb, { dy: -8, size: 11, color: 'orange', align: 'left' });
          c.hline(r * Kb, { color: v.color('orange', 0.5), width: 1, dash: [3, 3] });
          st = { y, Kb, B, Ld, cs, yT, sr };
        });
        v.readout(() => {
          const { y, Kb, B, Ld, cs, yT, sr } = st, f1 = (q) => v.fix(q, 1), f2 = (q) => v.fix(q, 2);
          const gap = cs - B.c;
          const which = sr ? `In the short run the firm must use $\\bar K = ${f2(Kb)}$ and hires $L = ${f2(Ld)}$ to make $y = ${f2(y)}$, at cost ${f1(cs)}.` : `In the long run the firm picks $(L, K) = (${f2(B.x[0])}, ${f2(B.x[1])})$ for $y = ${f2(y)}$, at cost ${f1(B.c)}.`;
          return `${which} Short-run cost ${f1(cs)} ≥ long-run cost ${f1(B.c)} (gap ${v.fix(gap, 2)}). The plant $\\bar K = ${f2(Kb)}$ is exactly right at $y = ${f2(yT)}$, where the curves touch. Along the expansion path $K/L$ falls from ${f2(LR(1).x[1] / LR(1).x[0])} at $y = 1$ to ${f2(LR(9).x[1] / LR(9).x[0])} at $y = 9$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7', kind: 'Principle', name: 'Cost minimization: tangency of isoquant and isocost',
      statement: String.raw`To produce output $y$ at least cost at input prices $w$ (labour) and $r$ (capital), a firm solves $\min_{L, K \ge 0}\; wL + rK$ subject to $f(L, K) \ge y$. Lines $wL + rK = C$ are **isocost lines**, with slope $-w/r$. If $f$ is differentiable and quasi-concave (convex isoquants) and the solution uses both inputs, the cheapest isocost line touching the isoquant is tangent to it:
$$TRS = \frac{MP_L}{MP_K} = \frac{w}{r}, \qquad\text{equivalently}\qquad \frac{MP_L}{w} = \frac{MP_K}{r},$$
the last unit of money buys the same extra output in either input. With non-convex isoquants the tangency may be a maximum; with kinked (Leontief) isoquants the optimum sits at the kink, and with straight isoquants (perfect substitutes) it is a corner using only the cheaper input per unit of output.`,
      idea: String.raw`If $MP_L/w > MP_K/r$, shifting one unit of money from capital to labour raises output at no cost, so the bundle could not have been cheapest; this is the equimarginal argument of 5.3 and the first-order condition of Fermat's theorem (Rudin 5.8) applied to cost along the isoquant. Geometrically, slide the isocost line toward the origin: while it cuts the isoquant twice, the bundles between the crossings are cheaper, and the last position at which it still touches is the tangency. Convexity of the isoquant makes the first-order condition sufficient.`,
      caption: String.raw`**Drag the knob on the labour axis** to shift the isocost line (its intercept is $C/w$), or press **slide to the minimum**. While the line cuts the purple isoquant at two gold points, the stretch between them (shaded on the right) is cheaper than $C$; below the minimum it misses the isoquant altogether. The right panel plots the cost of each bundle on the isoquant: its minimum is the tangency, where $TRS = w/r$. Move the wage and rental to swing the optimum around the isoquant, and try **Leontief** and **linear** technologies, where the tangency rule gives way to a kink and a corner.`,
      deps: ['micro-7.3', 'pma-5.8'], refs: ['Varian Ch. 21'], tags: ['costs', 'optimization'],
      see: ['micro-5.2', 'micro-5.10'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Conditional_factor_demands' },
      viz(v) {
        const FAM = {
          cd: { label: 'Cobb–Douglas', T: tech('cd', { a: 0.5, b: 0.5 }) },
          ces: { label: 'CES, $\\sigma = 0.4$', T: tech('ces', { al: 0.5, s: 0.4 }) },
          leon: { label: 'Leontief', T: tech('leon', { a: 1, b: 1 }) },
          lin: { label: 'linear', T: tech('lin', { a: 0.5, b: 0.5 }) },
        };
        const fam = v.select('technology', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const wS = v.slider('wage $w$', 2, 20, 10, { step: 0.1 });
        const rS = v.slider('rental $r$', 2, 20, 6, { step: 0.1 });
        const yS = v.slider('target output $y$', 2, 6, 4, { step: 0.05 });
        const s = v.stage({ x: [0, 12], y: [0, 12], height: 380, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'isoquant and isocost lines', weight: 1.15 });
        const g = v.stage({ x: [0, 12], y: [0, 200], height: 380, axes: 'box', gutter: true, xlabel: 'labour L used (bundle on the isoquant)', ylabel: 'cost wL + rK', title: 'cost of each bundle on the isoquant' });
        v.legend([['purple', 'isoquant for y'], ['accent', 'isocost line, cost C'], ['gold', 'crossings: cost C'], ['green', 'cost-minimizing bundle']]);
        const knob = s.handle(10, 0, { color: 'accent', r: 7, label: 'C/w', constrain: (x) => [clamp(x, 0.3, 11.8), 0] });
        v.button('slide to the minimum', () => { const o = FAM[fam.value].T.cmin(wS.value, rS.value, yS.value); knob.set(o.c / wS.value, 0); });
        let st = {};
        v.render(() => {
          const T = FAM[fam.value].T, w = wS.value, r = rS.value, y = yS.value, C = knob.x * w;
          const opt = T.cmin(w, r, y), num = cminNum(T, w, r, y);
          const pts = isoq(T, y, 12, 12, 300).filter(Boolean);
          // cost along the isoquant
          const cost = pts.map((p) => [p[0], w * p[0] + r * p[1], p[1]]);
          const cmax = Math.max(200, Math.min(600, opt.c * 2.2));
          g.setView([0, 12], [0, cmax]);
          const cheap = cost.filter((q) => q[1] <= C);
          // crossings of the isocost line with the isoquant
          const X = []; for (let i = 1; i < cost.length; i++) { const a = cost[i - 1], b = cost[i]; if ((a[1] - C) * (b[1] - C) < 0) { const t = (C - a[1]) / (b[1] - a[1]); X.push([a[0] + t * (b[0] - a[0]), a[2] + t * (b[2] - a[2])]); } }
          if (cheap.length > 1) {
            s.clip(() => s.path(pts.filter((p) => w * p[0] + r * p[1] <= C), { color: 'gold', width: 6, alpha: 0.45 }));
            g.clip(() => g.path(cheap.map((q) => [q[0], q[1]]), { color: 'gold', width: 7, alpha: 0.45 }));
          }
          isocost(s, w, r, C, { fill: true, width: 2.6 });
          isocost(s, w, r, opt.c, { color: 'green', width: 1.4, dash: [5, 4] });
          drawIsoq(s, T, y, { color: 'purple', width: 2.8 });
          for (const q of X) s.dot(q[0], q[1], { r: 5.5, color: 'gold' });
          s.dot(opt.x[0], opt.x[1], { r: 7, color: 'green' });
          const m = T.mp(opt.x[0], opt.x[1]), trs = m[0] / m[1];
          const near = Math.abs(C - opt.c) / opt.c < 0.004;
          const status = near ? 'tangent: cheapest way to make y' : C > opt.c ? 'cuts the isoquant: slide further in' : 'cannot reach the isoquant';
          s.corner(`C = ${v.fix(C, 1)} · ${status}`, 'tr', { color: near ? 'green' : C > opt.c ? 'gold' : 'red', weight: 700 });
          // right panel
          g.clip(() => g.path(cost.map((q) => [q[0], q[1]]), { color: 'purple', width: 2.6 }));
          g.hline(C, { color: 'accent', width: 2, dash: [6, 4] });
          g.text(`C = ${v.fix(C, 1)}`, 11.8, C, { dy: -8, size: 11.5, color: 'accent', align: 'right', weight: 700 });
          g.dot(opt.x[0], opt.c, { r: 7, color: 'green', label: `min ${v.fix(opt.c, 2)}`, labelPos: 'n', math: false });
          for (const q of X) g.dot(q[0], C, { r: 5, color: 'gold' });
          st = { T, w, r, y, C, opt, num, trs, near, k: fam.value };
        });
        v.readout(() => {
          const { w, r, opt, num, trs, k, C } = st, f2 = (q) => v.fix(q, 2), f3 = (q) => v.fix(q, 3);
          const head = `Cheapest bundle $(L, K) = (${f2(opt.x[0])}, ${f2(opt.x[1])})$ at cost ${f2(opt.c)} (search along the isoquant: ${f2(num.c)}).`;
          if (k === 'leon') return `${head} Leontief: the optimum is the corner of the isoquant whatever $w/r = ${f3(w / r)}$; the TRS is not defined there, so no tangency condition can hold. Changing prices never changes the mix.`;
          if (k === 'lin') { const pick = w / 0.5 < r / 0.5 ? 'labour only' : w / 0.5 > r / 0.5 ? 'capital only' : 'any mix'; return `${head} Linear: the TRS is ${f3(0.5 / 0.5)} everywhere while $w/r = ${f3(w / r)}$, so there is no tangency; the optimum is a **corner**, ${pick}, using the input with the lower price per unit of output.`; }
          return `${head} There $TRS = MP_L/MP_K = ${f3(trs)}$ and $w/r = ${f3(w / r)}$: tangency. Current line: $C = ${f2(C)}$, ${C > opt.c + 0.01 ? `${f2(C - opt.c)} above the minimum` : C < opt.c - 0.01 ? `${f2(opt.c - C)} below the minimum, so output $y$ is out of reach` : 'at the minimum'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.8
    {
      num: '7.8', kind: 'Definition', name: 'Cost function and conditional factor demands',
      statement: String.raw`The solutions $L(w, r, y)$ and $K(w, r, y)$ of the cost-minimization problem 7.7 are the **conditional factor demands**: the cheapest inputs for producing $y$ at prices $(w, r)$. The **cost function** is the minimized cost
$$c(w, r, y) = w\,L(w, r, y) + r\,K(w, r, y) = \min\{wL + rK : f(L, K) \ge y\}.$$
It is nondecreasing in $y$ and in prices, homogeneous of degree 1 and concave in $(w, r)$, and conditional demands are homogeneous of degree 0 in prices. As $y$ varies the cost-minimizing bundles trace the **expansion path**. For Cobb–Douglas $AL^aK^b$ with $k = a + b$,
$$c(w, r, y) = k\left(\frac{y}{A}\right)^{1/k}\left(\frac{w}{a}\right)^{a/k}\left(\frac{r}{b}\right)^{b/k},$$
so cost rises like $y^{1/k}$: proportionally under constant returns, faster under decreasing returns, slower under increasing returns.`,
      idea: String.raw`Doubling both prices doubles the cost of every bundle without changing which is cheapest, so demands do not move and cost doubles. Concavity in prices holds because $c$ is a minimum of functions $wL + rK$ that are linear in $(w, r)$ (see 7.10). For a homothetic technology the expansion path is a ray and $c(w, r, y) = c(w, r, 1)\,\phi(y)$, separating prices from scale; returns to scale (7.4) then show up as the curvature of cost in $y$.`,
      caption: String.raw`Raise the output $y$: on the left the green bundles trace the expansion path while the isoquant and isocost line move out. Right, choose what to plot: **cost against output**, $c(w, r, y)$ with the current point (its shape follows the returns to scale chosen above), or **demands against the wage**, the conditional demands for labour and capital as $w$ varies with $y$ fixed. The readout checks the closed form against a numerical search and checks homogeneity in prices.`,
      deps: ['micro-7.7'], refs: ['Varian Ch. 21'], tags: ['costs'],
      see: ['micro-5.10', 'micro-5.12'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cost_curve' },
      viz(v) {
        const r = 6;
        const FAM = {
          crs: { label: 'CD, $k = 1$', T: tech('cd', { a: 0.5, b: 0.5 }) },
          drs: { label: 'CD, $k = 0.7$', T: tech('cd', { a: 0.35, b: 0.35 }) },
          irs: { label: 'CD, $k = 1.4$', T: tech('cd', { a: 0.7, b: 0.7 }) },
          ces: { label: 'CES, $\\sigma = 3$, $k = 1$', T: tech('ces', { al: 0.4, s: 3 }) },
        };
        const fam = v.select('technology', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'crs');
        const view = v.select('right panel', [{ value: 'cy', label: 'cost against output' }, { value: 'dw', label: 'demands against the wage' }], 'cy');
        const yS = v.slider('output $y$', 0.5, 8, 4, { step: 0.05 });
        const wS = v.slider('wage $w$ (rental $r = 6$)', 2, 20, 10, { step: 0.1 });
        const s = v.stage({ x: [0, 12], y: [0, 12], height: 360, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'the expansion path', weight: 1.1 });
        const g = v.stage({ x: [0, 8], y: [0, 120], height: 360, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'cost', title: 'the cost function' });
        v.legend([['purple', 'isoquant for y'], ['accent', 'cheapest isocost line'], ['green', 'expansion path / cost-minimizing bundle'], ['blue', 'conditional labour demand L(w, r, y)'], ['orange', 'conditional capital demand K(w, r, y)']]);
        let st = {};
        v.render(() => {
          const T = FAM[fam.value].T, y = yS.value, w = wS.value, o = T.cmin(w, r, y), num = cminNum(T, w, r, y);
          // expansion path up to y and beyond (faint)
          const pth = []; for (let i = 1; i <= 80; i++) pth.push(T.cmin(w, r, (10 * i) / 80).x);
          s.clip(() => s.path([[0, 0], ...pth], { color: v.color('green', 0.35), width: 2 }));
          const done = []; for (let i = 0; i <= 50; i++) done.push(T.cmin(w, r, Math.max(1e-4, (y * i) / 50)).x);
          s.clip(() => s.path([[0, 0], ...done], { color: 'green', width: 3 }));
          for (let q = 1; q < y; q += 1) { const b = T.cmin(w, r, q).x; s.dot(b[0], b[1], { r: 3.5, color: 'green' }); drawIsoq(s, T, q, { color: v.color('purple', 0.3), width: 1 }); }
          drawIsoq(s, T, y, { color: 'purple', width: 2.6 });
          isocost(s, w, r, o.c, { fill: true });
          s.dot(o.x[0], o.x[1], { r: 7, color: 'green' });
          s.text(`c = ${v.fix(o.c, 1)}`, o.x[0], o.x[1], { dx: 12, dy: -12, ...LBL, color: 'green', align: 'left', plate: true });
          if (view.value === 'cy') {
            const cmax = Math.max(60, Math.ceil(T.cmin(w, r, 8).c / 20) * 20 + 10);
            g.setView([0, 8], [0, cmax]); g.setLabels('output y', 'cost c(w, r, y)'); g.setTitle('the cost function against output');
            g.fn((q) => T.cmin(w, r, q).c, { domain: [0.001, 8], color: 'ink', width: 2.8 });
            g.fn((q) => (o.c / y) * q, { domain: [0, 8], color: 'muted', width: 1.2, dash: [5, 4] });
            g.line(y, 0, y, o.c, GUIDE);
            g.dot(y, o.c, { r: 6.5, color: 'green', label: `c = ${v.fix(o.c, 1)}`, labelPos: 'nw', math: false });
          } else {
            const dmax = Math.max(4, Math.ceil(Math.max(T.cmin(2, r, y).x[0], T.cmin(20, r, y).x[1]) * 1.15));
            g.setView([0, 20], [0, Math.min(dmax, 30)]); g.setLabels('wage w', 'input quantity'); g.setTitle(`conditional demands at $y = ${v.fix(y, 2)}$`);
            g.fn((q) => T.cmin(q, r, y).x[0], { domain: [0.5, 20], color: 'blue', width: 2.8 });
            g.fn((q) => T.cmin(q, r, y).x[1], { domain: [0.5, 20], color: 'orange', width: 2.8 });
            g.vline(w, GUIDE);
            g.dot(w, o.x[0], { r: 6, color: 'blue', label: 'L', labelPos: 'ne' }); g.dot(w, o.x[1], { r: 6, color: 'orange', label: 'K', labelPos: 'se' });
          }
          const o2 = T.cmin(2 * w, 2 * r, y);
          st = { T, y, w, o, num, o2, k: T.deg };
        });
        v.readout(() => {
          const { y, w, o, num, o2, k, T } = st, f2 = (q) => v.fix(q, 2), f3 = (q) => v.fix(q, 3);
          const sc = T.cmin(w, r, 2 * y).c / o.c;
          return `At $y = ${f2(y)}$, $w = ${f2(w)}$, $r = ${r}$: $L = ${f3(o.x[0])}$, $K = ${f3(o.x[1])}$, $c = ${f3(o.c)}$ (numerical search: ${f3(num.c)}). Doubling both prices: cost ${f3(o2.c)} $= 2 \\times ${f3(o.c)}$, demands unchanged (${f3(o2.x[0])}, ${f3(o2.x[1])}). Doubling output multiplies cost by ${f3(sc)} $= 2^{1/k}$ with $k = ${v.fix(k, 2)}$.`;
        });
      },
    },
  ],
};
