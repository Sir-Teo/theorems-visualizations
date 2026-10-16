// Macroeconomics — Chapter 2: The long run: production, labour markets and saving (items 2.1–2.7; 2.8–2.14 are in ch02-b.js)
import { clamp, pc, fx, ols, rbox, pairs, rows, LABSHARE_PWT, LABSHARE_BLS, FLOWS_US, NAIRU_US, BEV_US } from './ch02.shared.js';

const BLS = pairs(LABSHARE_BLS), PWT = pairs(LABSHARE_PWT);

export default {
  collection: 'macro',
  chapter: 2,
  title: 'The long run: production, labour markets and saving',
  summary: String.raw`In the long run output is set by capital, labour and technology, and competitive factor markets divide it among them: with Cobb–Douglas technology each factor's share is a constant, as the shares roughly were in the data for most of the twentieth century. The loanable-funds market ties the interest rate to saving and investment, so government borrowing crowds out private capital. The labour market settles at a natural rate of unemployment determined by job flows (the steady state $u = s/(s+f)$), search frictions and wage setting. On the household side, people smooth consumption over time, which links saving to interest rates and to expected lifetime income; the consumption Euler equation, Hall's random-walk result and the evidence of excess sensitivity say how well that works. The chapter ends with the paper that started the aggregate production function: Cobb and Douglas (1928).`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Model', name: 'The Cobb–Douglas aggregate production function',
      statement: String.raw`The economy's output is produced from the aggregate capital stock $K$ and labour input $L$ by
$$Y = A\,K^{\alpha}L^{1-\alpha},\qquad 0<\alpha<1,$$
where $A$ is total factor productivity. Two properties do the work. **Constant returns to scale:** $F(\lambda K,\lambda L)=\lambda F(K,L)$ — replicate the whole economy and output replicates. **Diminishing marginal products:** $\partial F/\partial K=\alpha Y/K$ falls as $K$ rises with $L$ held fixed, and likewise for labour; the elasticity of output with respect to capital is the constant $\alpha$.

Scope: a model of the whole economy as one good produced by two homogeneous inputs, with a fixed elasticity of substitution equal to $1$. It is a useful approximation, not a law: other forms (CES) allow substitution to differ from one.`,
      idea: String.raw`The exponents add to one, so $F(\lambda K,\lambda L)=(\lambda K)^{\alpha}(\lambda L)^{1-\alpha}=\lambda K^{\alpha}L^{1-\alpha}$: scaling both inputs scales output exactly, a replication argument that is the economic reason to expect constant returns. Holding $L$ fixed, $Y\propto K^{\alpha}$ with $\alpha<1$ is concave, so each extra unit of capital adds less than the last (the firm-level cost-minimisation and production theory of micro-7.1 and micro-7.5 supply the notions of marginal product and returns to scale). The two facts together are why capital accumulation alone cannot sustain growth (chapter 3).`,
      caption: String.raw`**Left:** the production surface over capital $K$ and labour $L$; drag to rotate. Pick an experiment — double both inputs, or only capital, or only labour — and drag the **scale factor** $\lambda$ (right panel). **Right:** output relative to the starting point. Doubling both inputs lies on the straight line $Y=\lambda$ (constant returns); doubling capital alone follows the concave curve $\lambda^{\alpha}$. Move $\alpha$ to change the curvature, and use the **returns to scale** slider to break the hypothesis: with $\gamma\ne 1$ the replication line bends.`,
      deps: ['micro-7.1', 'micro-7.5'], refs: ['Mankiw ch. 3', 'Romer ch. 1'], tags: ['production', 'growth'],
      credit: 'Cobb & Douglas, 1928',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cobb%E2%80%93Douglas_production_function' },
      viz(v) {
        const al = v.slider('capital exponent $\\alpha$', 0.1, 0.9, 0.35, { step: 0.01 });
        const gam = v.slider('returns to scale $\\gamma$ (1 = constant)', 0.7, 1.3, 1, { step: 0.01 });
        const K0 = v.slider('starting capital $K$', 0.5, 2, 1, { step: 0.05 });
        const L0 = v.slider('starting labour $L$', 0.5, 2, 1, { step: 0.05 });
        const ex = v.select('experiment', [{ value: 'both', label: 'scale $K$ and $L$' }, { value: 'K', label: 'scale $K$ only' }, { value: 'L', label: 'scale $L$ only' }], 'both');
        const S3 = v.stage3d({ range: 2.5, height: 400, yaw: -0.72, pitch: 0.32, axes: false, weight: 1.15, title: 'the production surface (drag to rotate)' });
        const R = v.stage({ x: [1, 4], y: [0, 4.6], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'scale factor λ applied to the chosen input(s)', ylabel: 'output relative to start  Y(λ) / Y(1)' });
        const hl = R.handle(2, 2, { color: 'gold', label: 'λ', constrain: (x) => [clamp(x, 1, 4), 0] });
        let st = {};
        v.render(() => {
          const a = al.value, g = gam.value, k0 = K0.value, l0 = L0.value, mode = ex.value;
          const Y = (K, L) => Math.pow(K ** a * L ** (1 - a), g);
          const lam = clamp(hl.x, 1, 4);
          const kk = (l) => (mode === 'L' ? k0 : k0 * l), ll = (l) => (mode === 'K' ? l0 : l0 * l);
          const ymax = Math.pow(4, g), P = (K, L) => [(K - 2) * 0.85, (L - 2) * 0.85, (Y(K, L) / ymax - 0.5) * 3.4 * 0.5];
          // axes along the box edges
          const o = [-1.7, -1.7, -0.85], ax = (p, q, c) => S3.line(p, q, { color: c, width: 1.4, alpha: 0.7 });
          ax(o, [1.7, -1.7, -0.85], 'muted'); ax(o, [-1.7, 1.7, -0.85], 'muted'); ax(o, [-1.7, -1.7, 0.85], 'muted');
          S3.text('K', [1.78, -1.7, -0.85], { color: 'muted', size: 13 }); S3.text('L', [-1.7, 1.78, -0.85], { color: 'muted', size: 13 }); S3.text('Y', [-1.7, -1.7, 0.95], { color: 'muted', size: 13 });
          S3.surface((K, L) => P(K, L), [0.02, 4], [0.02, 4], { nu: 22, nv: 22, color: 'accent', alpha: 0.5, wire: true, colorFn: (K, L, p) => v.ramp(Y(K, L) / ymax * 0.9 + 0.05, 'accent', 'panel') });
          S3.curve((l) => P(kk(l), ll(l)), 1, lam, { color: 'gold', width: 3.5 });
          S3.line(P(k0, l0), [P(k0, l0)[0], P(k0, l0)[1], -0.85], { color: 'muted', width: 1 });
          S3.line(P(kk(lam), ll(lam)), [P(kk(lam), ll(lam))[0], P(kk(lam), ll(lam))[1], -0.85], { color: 'muted', width: 1 });
          S3.dot(P(k0, l0), { color: 'ink', r: 5, label: 'start' });
          S3.dot(P(kk(lam), ll(lam)), { color: 'gold', r: 6, label: 'after' });
          // right panel: ratio curves
          const r = (l, m) => Y(m === 'L' ? k0 : k0 * l, m === 'K' ? l0 : l0 * l) / Y(k0, l0);
          R.fn((l) => l, { color: 'faint', dash: [4, 4], width: 1.4 });
          R.text('Y = λ (dashed)', 1.15, 3.9, { color: 'faint', size: 11 });
          const defs = [['both', 'accent', 'both'], ['K', 'orange', 'capital only'], ['L', 'purple', 'labour only']];
          for (const [m, c, lab] of defs) {
            R.fn((l) => r(l, m), { color: c, width: m === mode ? 3.2 : 1.8, alpha: m === mode ? 1 : 0.55, domain: [1, 4] });
            R.text(lab, 4, r(4, m), { align: 'right', dy: m === 'both' ? -9 : m === 'K' ? 10 : 10, color: c, size: 11.5, weight: m === mode ? 700 : 500 });
          }
          hl.set(lam, r(lam, mode));
          const y0 = Y(k0, l0), y1 = Y(kk(lam), ll(lam));
          st = { a, g, lam, y0, y1, mode, ratio: y1 / y0 };
        });
        v.readout(() => {
          const { a, g, lam, y0, y1, mode, ratio } = st;
          const what = mode === 'both' ? `$K$ and $L$ both ×${fx(lam, 2)}` : mode === 'K' ? `$K$ ×${fx(lam, 2)}` : `$L$ ×${fx(lam, 2)}`;
          const exp = mode === 'both' ? g : mode === 'K' ? a * g : (1 - a) * g;
          return `${what}: $Y$ goes from ${fx(y0, 3)} to ${fx(y1, 3)}, a factor **${fx(ratio, 3)}** = $\\lambda^{${fx(exp, 2)}}$ = ${fx(lam ** exp, 3)} ✓.\n` +
            (Math.abs(g - 1) < 0.005 ? (mode === 'both' ? 'Constant returns: output scales one-for-one with the inputs.' : `Diminishing returns: a factor ${fx(lam, 2)} of one input alone gives only ×${fx(ratio, 2)}.`) : `With $\\gamma=${fx(g, 2)}$ doubling both inputs multiplies output by $2^{\\gamma}=${fx(2 ** g, 3)}$ — ${g > 1 ? 'increasing' : 'decreasing'} returns, not the Cobb–Douglas of the theory.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Theorem', name: 'Factor shares are constant under Cobb–Douglas',
      statement: String.raw`Let $Y=AK^{\alpha}L^{1-\alpha}$ and let competitive firms hire labour at the real wage $w$ and capital at the real rental rate $r$ equal to the marginal products, $w=\partial Y/\partial L$ and $r=\partial Y/\partial K$. Then
$$wL=(1-\alpha)\,Y,\qquad rK=\alpha\,Y\qquad\text{for every }K,L,A,$$
so labour's and capital's shares of income are the constants $1-\alpha$ and $\alpha$, and the payments exhaust output (no pure profit). More generally, under *any* constant-returns technology $wL+rK=Y$ (Euler's theorem), but the split is constant only when the elasticity of substitution between capital and labour is one.

Scope: competitive factor markets and a one-sector technology; for a CES technology with elasticity $\sigma\neq1$ the labour share varies with the capital–labour ratio.`,
      idea: String.raw`Differentiate: $\partial Y/\partial L=(1-\alpha)AK^{\alpha}L^{-\alpha}=(1-\alpha)Y/L$, so $wL=(1-\alpha)Y$, and similarly $rK=\alpha Y$ — the factor-share exponents *are* the shares, because the exponent of a power function is the elasticity of the output. The two payments add to $Y$ because the exponents add to one (the Cobb–Douglas form of constant returns, macro-2.1). The U.S. data show a share near 0.6–0.65 for decades and a fall after about 2000, which is why Cobb–Douglas is a good first model but not the final word.`,
      caption: String.raw`**Left:** the labour share as a function of the capital–labour ratio $K/L$ (log axis). With $\sigma=1$ it is the flat green line at $1-\alpha$ whatever $K$ and $L$ are; move **$\sigma$** away from 1 (a CES technology) and the share tilts with the capital–labour ratio, so constancy fails. The dot is the economy at the chosen $K$ and $L$. **Middle:** how the pie is cut under marginal-product pay. **Right:** the U.S. labour share of GDP from the Penn World Table, with the horizontal line at $1-\alpha$.`,
      deps: ['macro-2.1'], refs: ['Mankiw ch. 3'], tags: ['distribution', 'production'],
      credit: 'Cobb & Douglas, 1928; Douglas, 1934 and 1976 (stable labour share)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Labor_share' },
      viz(v) {
        const al = v.slider('capital weight $\\alpha$', 0.15, 0.6, 0.35, { step: 0.01 });
        const sg = v.slider('elasticity of substitution $\\sigma$', 0.3, 3, 1, { log: true, sig: 2 });
        const Ks = v.slider('capital $K$', 0.2, 5, 1.5, { step: 0.05 });
        const Ls = v.slider('labour $L$', 0.5, 2, 1, { step: 0.05 });
        const A = v.stage({ x: [0.1, 10], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'capital–labour ratio  K / L (log scale)', ylabel: 'labour share  wL / Y', yticks: [0, 0.2, 0.4, 0.6, 0.8, 1].map((y) => [y, `${100 * y}%`]) });
        const B = v.stage({ x: [0, 1.7], y: [0, 1], axes: false, height: 330, weight: 0.8, minWidth: 230, title: 'output (100%) paid at marginal products' });
        const C = v.stage({ x: [1950, 2024], y: [0.4, 0.8], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'year', ylabel: 'labour share of GDP', yticks: [0.4, 0.5, 0.6, 0.7, 0.8].map((y) => [y, `${100 * y}%`], 0) });
        v.legend([['green', 'competitive pay, σ = 1 (Cobb–Douglas)'], ['accent', 'this technology'], ['ink', 'U.S. labour share (PWT)'], ['muted', 'BLS nonfarm business, rescaled', { dash: true }]]);
        let st = {};
        const tech = (a, s) => {
          const rho = Math.abs(s - 1) < 1e-3 ? 0 : (s - 1) / s;
          const Yf = (K, L) => (rho === 0 ? K ** a * L ** (1 - a) : (a * K ** rho + (1 - a) * L ** rho) ** (1 / rho));
          const shL = (k) => (rho === 0 ? 1 - a : (1 - a) / (a * k ** rho + (1 - a)));
          return { rho, Yf, shL };
        };
        v.render(() => {
          const a = al.value, s = sg.value, K = Ks.value, L = Ls.value, k = K / L, T = tech(a, s), Y = T.Yf(K, L);
          const dK = (T.Yf(K * (1 + 1e-6), L) - T.Yf(K * (1 - 1e-6), L)) / (2e-6 * K), dL = (T.Yf(K, L * (1 + 1e-6)) - T.Yf(K, L * (1 - 1e-6))) / (2e-6 * L);
          const wL = dL * L, rK = dK * K;
          A.hline(1 - a, { color: 'green', width: 2.4 });
          A.fn((x) => T.shL(x), { color: 'accent', width: 2.8, domain: [0.1, 10], n: 160 });
          A.dot(k, T.shL(k), { color: 'gold', r: 7, label: `K/L = ${fx(k, 2)}`, labelPos: 'ne' });
          A.text('Cobb–Douglas: 1 − α', 0.12, 1 - a, { dy: -9, color: 'green', size: 11.5, weight: 600 });
          // pie as stacked bar
          const share = wL / Y;
          B.rect(0.1, 0, 0.5, share, { fill: 'accent', fillAlpha: 0.55, color: 'panel', width: 1.5 });
          B.rect(0.1, share, 0.5, 1, { fill: 'orange', fillAlpha: 0.6, color: 'panel', width: 1.5 });
          B.text(`labour ${pc(wL / Y, 1)}`, 0.55, share / 2, { color: 'accent', size: 12, weight: 650 });
          B.text(`capital ${pc(rK / Y, 1)}`, 0.55, share + (1 - share) / 2, { color: 'orange', size: 12, weight: 650 });
          
          // data
          C.fn((x) => 1 - a, { color: 'green', width: 2.2, domain: [1950, 2024] });
          const i17 = BLS.find(([y]) => y === 2017)[1], p17 = PWT.find(([y]) => y === 2017)[1];
          C.path(BLS.filter(([y]) => y >= 1950).map(([y, x]) => [y, (x / i17) * p17]), { color: 'muted', width: 1.6, dash: [5, 4] });
          C.path(PWT, { color: 'ink', width: 2.6 });
          const mean = PWT.reduce((q, [, x]) => q + x, 0) / PWT.length;
          st = { a, s, k, wL, rK, Y, mean, last: PWT[PWT.length - 1], peak: PWT.reduce((m, p) => (p[1] > m[1] ? p : m)) };
        });
        v.readout(() => {
          const { a, s, k, wL, rK, Y, mean, last, peak } = st;
          return `$wL = ${fx(wL, 3)}$, $rK = ${fx(rK, 3)}$, sum $= ${fx(wL + rK, 3)}$ vs $Y = ${fx(Y, 3)}$ ✓ (exhaustion). Labour share $= ${pc(wL / Y, 1)}$ ${Math.abs(s - 1) < 0.02 ? `= $1-\\alpha = ${pc(1 - a, 1)}$ for every $K/L$.` : `at $K/L=${fx(k, 2)}$, versus $1-\\alpha = ${pc(1 - a, 1)}$: with $\\sigma=${fx(s, 2)}$ the share is not constant.`}\n` +
            `U.S. data (PWT): mean ${pc(mean, 1)}, high ${pc(peak[1], 1)} in ${peak[0]}, ${pc(last[1], 1)} in ${last[0]}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Model', name: 'The loanable-funds market',
      statement: String.raw`In the long run output $Y$ is fixed by the factors of production, and the real interest rate $r$ adjusts to equate **national saving** $S(r)=Y-C-G$ — the supply of loanable funds — with **investment demand** $I(r)$, which falls as $r$ rises because fewer projects pay their cost of capital. In equilibrium
$$S(r^*)=I(r^*),$$
and comparative statics follow: a rise in government purchases $G$ (financed by borrowing, with taxes unchanged) lowers national saving, shifts the supply curve left, raises $r^*$ and **crowds out** investment by exactly the fall in $I$ along the demand curve; a rise in investment demand (a tax credit, better prospects) raises $r^*$ and, if saving responds to the interest rate, also raises $S$.

Scope: closed economy, output at its full-employment level, one real interest rate. In a small open economy $r$ is the world rate, and $S-I$ is net capital outflow instead.`,
      idea: String.raw`This is the accounting identity $S=I$ (macro-1.5) turned into a market. A deficit means the government is a bigger borrower at every rate, so the interest rate must rise until private borrowers withdraw by the amount the government took. How much the rate has to rise depends on the slopes: steep investment demand means a large rate rise for a given crowding out; interest-sensitive saving means part of the burden is met by more saving rather than less investment. Opening the economy replaces the clearing rate by $r^*_{\text{world}}$ and the crowding out by an inflow of foreign saving (macro-1.5, twin deficits).`,
      caption: String.raw`Drag the sliders for **government purchases** $\Delta G$ (percent of GDP), an **investment-demand shift** and the **interest-sensitivity of saving**. Dashed lines are the starting equilibrium; the hatched strip is crowding out $=I_0-I$. Switch to **open economy** and the interest rate is pinned at the world rate: the shortfall of saving is met by capital inflow, and domestic investment does not change.`,
      deps: ['macro-1.5'], refs: ['Mankiw ch. 3'], tags: ['saving', 'interest rate', 'fiscal policy'],
      viz(v) {
        const dG = v.slider('government purchases $\\Delta G$ (% of GDP)', -5, 6, 3, { step: 0.1 });
        const dI = v.slider('investment-demand shift (% of GDP)', -5, 5, 0, { step: 0.1 });
        const es = v.slider('interest-sensitivity of saving', 0, 3, 1, { step: 0.05 });
        const op = v.toggle('open economy (world rate fixed)', false);
        const rw = v.slider('world interest rate (%)', 2, 9, 5, { step: 0.1 });
        const S = v.stage({ x: [4, 32], y: [0, 12], axes: 'box', gutter: true, height: 380, weight: 1.2, xlabel: 'loanable funds, % of GDP', ylabel: 'real interest rate (%)' });
        const B = 2; // slope of investment demand: I = 28 + shift − B r
        let st = {};
        v.render(() => {
          const g = dG.value, sh = dI.value, e = es.value, open = op.value, rworld = rw.value;
          const Sf = (r, gg) => 12 - gg + e * r, If = (r, s2) => 28 + s2 - B * r;
          rw.el.hidden = !open;
          const r0 = open ? rworld : 16 / (B + e);
          const r1 = open ? rworld : (16 + sh + g) / (B + e);
          const I0 = If(r0, 0), I1 = If(r1, sh), S1 = Sf(r1, g);
          // start (dashed)
          S.line(Sf(0, 0), 0, Sf(12, 0), 12, { color: 'faint', dash: [5, 4], width: 1.6 });
          S.line(If(0, 0), 0, If(12, 0), 12, { color: 'faint', dash: [5, 4], width: 1.6 });
          // crowding-out strip between investment at r0 and at r1 (along the new investment curve)
          if (!open && Math.abs(I1 - I0) > 0.02) { S.rect(Math.min(I0, I1), r0, Math.max(I0, I1), r1, { fill: 'red', fillAlpha: 0.12, hatch: 'red', stroke: false }); }
          S.line(Sf(0, g), 0, Sf(12, g), 12, { color: 'green', width: 3 });
          S.line(If(0, sh), 0, If(12, sh), 12, { color: 'orange', width: 3 });
          S.text('S (supply of funds)', Sf(11.3, g), 11.3, { color: 'green', size: 12, weight: 650, dx: -6, align: 'right' });
          S.text('I (investment demand)', If(10, sh), 10, { color: 'orange', size: 12, weight: 650, dx: 8 });
          if (open) {
            S.hline(rworld, { color: 'blue', width: 2.2, dash: [7, 4] }); S.text('world rate', 31.5, rworld, { align: 'right', dy: -8, color: 'blue', size: 11.5 });
            S.dot(S1, rworld, { color: 'green', r: 6 }); S.dot(I1, rworld, { color: 'orange', r: 6 });
            if (Math.abs(S1 - I1) > 0.05) S.measure(Math.min(S1, I1), rworld - 0.9, Math.max(S1, I1), rworld - 0.9, S1 > I1 ? `net outflow ${fx(S1 - I1, 1)}` : `net inflow ${fx(I1 - S1, 1)}`);
          } else {
            S.dot(I0, r0, { color: 'faint', r: 5, hollow: true }); S.dot(I1, r1, { color: 'gold', r: 8, label: `r* = ${fx(r1, 2)}%`, labelPos: 'ne' });
          }
          st = { r0, r1, I0, I1, S1, g, open, sh };
        });
        v.readout(() => {
          const { r0, r1, I0, I1, S1, g, open } = st;
          return open
            ? `World rate ${fx(r1, 1)}% fixed. Saving $S=${fx(S1, 1)}$, investment $I=${fx(I1, 1)}$ (unchanged by $\\Delta G$ unless demand shifts); net capital outflow $S-I=${fx(S1 - I1, 1)}$ — the deficit is financed from abroad.`
            : `Equilibrium: $r^*=${fx(r1, 2)}\\%$ (was ${fx(r0, 2)}%), $S=I=${fx(I1, 1)}$ (was ${fx(I0, 1)}). ${g > 0 ? `Crowding out: investment falls by ${fx(I0 - I1, 1)} of GDP against a ${fx(g, 1)} rise in government purchases.` : ''} Check: $S(r^*)-I(r^*)=${fx(S1 - I1, 6)}$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Theorem', name: 'Steady-state unemployment u = s/(s + f)',
      statement: String.raw`Let a fraction $s$ of employed workers lose their job each period (the separation rate) and a fraction $f$ of unemployed workers find one (the job-finding rate), with a fixed labour force. The unemployment rate $u_t$ follows
$$u_{t+1}=u_t+s(1-u_t)-f\,u_t=(1-s-f)\,u_t+s ,$$
and for $0<s+f<2$ it converges from any starting point to the steady state
$$u^*=\frac{s}{s+f},\qquad u_t-u^*=(1-s-f)^t\,(u_0-u^*).$$
The deviation from $u^*$ shrinks by the factor $1-s-f$ each period, so the speed of adjustment is set by $s+f$.

Scope: constant rates, a closed labour force, and flows only between employment and unemployment (no entry or exit).`,
      idea: String.raw`In a steady state the number of people leaving employment equals the number leaving unemployment, $s(1-u)=f\,u$, which solves to $u=s/(s+f)$. For the dynamics, write the one-line recursion as an affine map $u\mapsto(1-s-f)u+s$ with slope $\lvert 1-s-f\rvert<1$; it is a contraction (its iterates are partial sums of a geometric series, pma-3.26), so iterates converge to its unique fixed point at the geometric rate $(1-s-f)^t$. Because the monthly job-finding rate in the U.S. is of the order of a third and separations of the order of 1–2%, convergence takes a few months, so actual unemployment tracks $s/(s+f)$ closely.`,
      caption: String.raw`**Left:** drag the **separation** and **job-finding** rates and the starting unemployment rate. The expectation path (blue) converges to the dotted line $s/(s+f)$, and the gold path is a simulation of 400 workers who move between the two states at random (switch it off for the exact expectation). Scrub the month with the handle. **Middle:** the two pools and the flows between them at that month; in the steady state the arrows are equal. **Right:** U.S. annual averages of unemployment and of $s/(s+f)$ computed from the flows measured in the data.`,
      deps: ['macro-1.8', 'pma-3.26'], refs: ['Mankiw ch. 7'], tags: ['unemployment', 'labour flows'],
      viz(v) {
        const sS = v.slider('separation rate $s$ (% of employed per month)', 0.3, 5, 1.5, { step: 0.05 });
        const fS = v.slider('job-finding rate $f$ (% of unemployed per month)', 5, 80, 30, { step: 0.5 });
        const u0 = v.slider('starting unemployment $u_0$ (%)', 0, 25, 12, { step: 0.5 });
        const sim = v.toggle('simulate 400 individual workers', true);
        const T = 48;
        const A = v.stage({ x: [0, T], y: [0, 26], axes: 'box', gutter: true, height: 330, weight: 1.3, xlabel: 'months', ylabel: 'unemployment rate (%)' });
        const hT = A.handle(0, 0, { color: 'gold', label: 't', constrain: (x) => [clamp(Math.round(x), 0, T), 0] });
        const B = v.stage({ x: [0, 100], y: [0, 60], axes: false, height: 330, weight: 0.8, minWidth: 250, title: 'the two pools' });
        const C = v.stage({ x: [1948, 2026], y: [0, 11], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'year', ylabel: 'unemployment rate (%)' });
        v.legend([['accent', 'expected path'], ['gold', 'simulated workers'], ['green', 'steady state s/(s+f)', { dash: true }]]);
        const US = rows(FLOWS_US, 4).map(([y, f, s, u]) => ({ y, f, s, u, ustar: (100 * (s / 100)) / (s / 100 + f) }));
        const dr = (US.reduce((q, d) => q + (d.u - d.ustar) ** 2, 0) / US.length) ** 0.5, cor = ols(US.map((d) => d.ustar), US.map((d) => d.u));
        let st = {};
        v.render(() => {
          const s = sS.value / 100, f = fS.value / 100, ui = u0.value / 100, us = s / (s + f), lam = 1 - s - f;
          const expect = (t) => us + lam ** t * (ui - us);
          const path = []; for (let t = 0; t <= T; t++) path.push([t, 100 * expect(t)]);
          A.hline(100 * us, { color: 'green', dash: [6, 4], width: 2 });
          A.path(path, { color: 'accent', width: 2.8 });
          const NW = 400;
          let simu = null;
          if (sim.value) {
            const r = v.rng(11), un = new Uint8Array(NW); let nu = Math.round(ui * NW); for (let i = 0; i < nu; i++) un[i] = 1;
            simu = [[0, (100 * nu) / NW]];
            for (let t = 1; t <= T; t++) { for (let i = 0; i < NW; i++) { if (un[i]) { if (r() < f) { un[i] = 0; nu--; } } else if (r() < s) { un[i] = 1; nu++; } } simu.push([t, (100 * nu) / NW]); }
            A.path(simu, { color: 'gold', width: 2.2 });
          }
          const t = hT.x, ut = expect(t);
          hT.set(t, 100 * ut);
          A.text(`u* = ${fx(100 * us, 1)}%`, T, 100 * us, { align: 'right', dy: -9, color: 'green', size: 12, weight: 650 });
          if (Math.abs(lam) > 0.02 && lam > 0) A.text(`half-life ${fx(Math.log(2) / -Math.log(lam), 1)} months`, T * 0.55, 24.3, { color: 'muted', size: 11.5 });
          // pools
          const E = 1 - ut, sep = s * E, hire = f * ut, scale = 260;
          rbox(v, B, 4, 6, 40, 40, { fill: 'blue', fillAlpha: 0.14, color: 'blue' }); rbox(v, B, 60, 6, 96, 40, { fill: 'red', fillAlpha: 0.14, color: 'red' });
          B.text('employed', 22, 31, { align: 'center', color: 'blue', size: 13, weight: 650 }); B.text(`${fx(100 * E, 1)}%`, 22, 21, { align: 'center', color: 'ink', size: 18, weight: 700 });
          B.text('unemployed', 78, 31, { align: 'center', color: 'red', size: 13, weight: 650 }); B.text(`${fx(100 * ut, 1)}%`, 78, 21, { align: 'center', color: 'ink', size: 18, weight: 700 });
          const wsep = clamp(sep * scale, 2, 24), whire = clamp(hire * scale, 2, 24);
          B.arrow(41, 34, 59, 34, { color: 'red', width: wsep * 0.35 + 1.5, head: 8 }); B.text(`separations  s·E = ${fx(100 * sep, 2)}%`, 50, 45, { align: 'center', color: 'red', size: 11 });
          B.arrow(59, 12, 41, 12, { color: 'green', width: whire * 0.35 + 1.5, head: 8 }); B.text(`hires  f·u = ${fx(100 * hire, 2)}%`, 50, 2.5, { align: 'center', color: 'green', size: 11 });
          B.text(`month ${Math.round(t)}`, 50, 55, { align: 'center', color: 'muted', size: 12 });
          // data
          C.path(US.map((d) => [d.y + 0.5, d.u]), { color: 'ink', width: 2.6 }); C.path(US.map((d) => [d.y + 0.5, d.ustar]), { color: 'green', width: 2, dash: [5, 4] });
          C.text('actual unemployment (annual mean)', 1972, 10.4, { color: 'ink', size: 11.5, weight: 600 }); C.text('s/(s+f) from measured flows', 1998.5, 2.0, { color: 'green', size: 11.5, weight: 600 });
          st = { us, lam, t, ut, sep, hire };
        });
        v.readout(() => {
          const { us, lam, t, ut, sep, hire } = st;
          return `$u^*=s/(s+f)=${fx(100 * us, 2)}\\%$; at month ${Math.round(t)}: $u_t=${fx(100 * ut, 2)}\\%$, separations ${fx(100 * sep, 2)}% vs hires ${fx(100 * hire, 2)}% of the labour force (equal at $u^*$). Speed $|1-s-f|=${fx(Math.abs(lam), 3)}$ per month.\n` +
            `U.S. 1948–2025 (flows by the Shimer method from CPS stocks): actual $u$ vs $s/(s+f)$: root-mean-square gap ${fx(dr, 2)} points, correlation ${fx(Math.sqrt(cor.r2), 3)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Model', name: 'Search and matching and the Beveridge curve',
      statement: String.raw`Unemployed workers and vacancies meet through a **matching function** $m=A\,u^{\eta}v^{1-\eta}$ giving hires per period as a share of the labour force, where $u$ is the unemployment rate, $v$ the vacancy rate, $A$ the matching efficiency and $\eta\in(0,1)$ an elasticity. The job-finding rate is $f=m/u=A\theta^{1-\eta}$ with **tightness** $\theta=v/u$. With separation rate $s$ the flows balance when $s(1-u)=m$, which defines the **Beveridge curve**
$$v=\Bigl[\frac{s\,(1-u)}{A\,u^{\eta}}\Bigr]^{1/(1-\eta)},$$
a downward-sloping, convex relation between unemployment and vacancies. Booms and slumps move the economy *along* the curve; a change in $s$ or $A$ shifts it.

Scope: random matching in a single labour market with constant $s,A,\eta$; empirical Beveridge curves show shifts and loops that this steady-state picture treats only as shifts of $A$ or $s$.`,
      idea: String.raw`Set the flow into unemployment, $s(1-u)$, equal to the flow out, $A u^{\eta}v^{1-\eta}$, and solve for $v$ (the steady state of macro-2.4 with $f$ now depending on tightness). More vacancies make jobs easier to find for any $u$, so unemployment and vacancies move in opposite directions along the curve. A less efficient matching process (mismatch, geographic or skill gaps) needs more of both to generate the same hires: the curve moves out, as it did after 2009 and again after 2021.`,
      caption: String.raw`**Left:** the model curve for the sliders $s$, $A$, $\eta$; drag the dot along it (a stronger or weaker economy) and read tightness and the job-finding rate. A line from the origin through the dot has slope $\theta$. Press **matching efficiency −20 %** for an outward shift. **Right:** U.S. monthly unemployment and job-openings rates, December 2000 – 2026 (JOLTS), coloured from early (grey) to late (blue), with the same model curve dashed.`,
      deps: ['macro-2.4'], refs: ['Romer ch. 11'], tags: ['unemployment', 'search', 'vacancies'],
      credit: 'Pissarides, 1985; Mortensen & Pissarides, 1994 (matching function framework)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beveridge_curve' },
      viz(v) {
        const sS = v.slider('separation rate $s$ (% per month)', 0.6, 3, 1.4, { step: 0.05 });
        const aS = v.slider('matching efficiency $A$', 0.12, 0.6, 0.32, { step: 0.005 });
        const eS = v.slider('matching elasticity $\\eta$', 0.3, 0.8, 0.5, { step: 0.01 });
        v.button('matching efficiency −20 %', () => aS.set(aS.value * 0.8));
        v.button('reset', () => { sS.set(1.4); aS.set(0.32); eS.set(0.5); });
        const M = v.stage({ x: [2, 12], y: [0, 9], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'unemployment rate u (%)', ylabel: 'vacancy rate v (%)', title: 'the Beveridge curve of the model' });
        const D = v.stage({ x: [3, 11], y: [1.5, 8], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'unemployment rate (%)', ylabel: 'job-openings rate (%)', title: 'U.S. 2000–2026 (JOLTS)' });
        const hu = M.handle(4.3, 4.2, { color: 'gold', label: 'economy', labelPos: 'ne' });
        const curveV = (u, s, a, e) => 100 * Math.pow((s * (1 - u)) / (a * Math.pow(u, e)), 1 / (1 - e));
        hu.constrain = (x) => [clamp(x, 2.2, 11.9), curveV(clamp(x, 2.2, 11.9) / 100, sS.value / 100, aS.value, eS.value)];
        const pts = rows(BEV_US, 3);
        let st = {};
        v.render(() => {
          const s = sS.value / 100, a = aS.value, e = eS.value;
          const cv = (u) => curveV(u / 100, s, a, e);
          M.fn(cv, { color: 'accent', width: 3, domain: [2.2, 12] });
          const ux = clamp(hu.x, 2.2, 11.9); hu.set(ux, cv(ux));
          const vv = cv(ux), th = vv / ux;
          M.line(0, 0, 12, 12 * th, { color: 'orange', width: 1.6, dash: [5, 4] });
          M.text(`slope θ = ${fx(th, 2)}`, 11.9, Math.min(8.6, 12 * th * 0.97), { align: 'right', color: 'orange', size: 11.5, dy: -8 });
          D.fn(cv, { color: 'accent', width: 2.4, dash: [6, 4], domain: [3, 11] });
          for (let i = 1; i < pts.length; i++) { if (pts[i][1] > 11 || pts[i - 1][1] > 11) continue; const t = i / pts.length; D.path([[pts[i - 1][1], pts[i - 1][2]], [pts[i][1], pts[i][2]]], { color: t < 0.5 ? 'muted' : 'accent', width: 1.8, alpha: 0.35 + 0.65 * t }); }
          D.dots(pts.map((p) => [p[1], p[2]]), { r: 1.6, color: 'ink' });
          for (const [yr, lab] of [[2009.75, 'Oct 2009'], [2019.9, 'Dec 2019'], [2022.5, 'Mar 2022'], [2026.6, '2026']]) {
            const p = pts.reduce((m, q) => (Math.abs(q[0] - yr) < Math.abs(m[0] - yr) ? q : m)); D.dot(p[1], p[2], { color: 'gold', r: 4, label: lab, labelPos: yr > 2022 ? 'se' : yr === 2019.9 ? 'ne' : yr < 2010 ? 'nw' : 'ne' });
          }
          st = { ux, vv, th, f: a * Math.pow(th, 1 - e), s, a, e };
        });
        v.readout(() => {
          const { ux, vv, th, f, s } = st, u = ux / 100;
          return `At $u=${fx(ux, 2)}\\%$ and $v=${fx(vv, 2)}\\%$: tightness $\\theta=${fx(th, 2)}$, job-finding rate $f=A\\theta^{1-\\eta}=${fx(100 * f, 1)}\\%$ a month. Steady state check: $s/(s+f)=${fx((100 * s) / (s + f), 2)}\\%$ ${Math.abs(100 * s / (s + f) - ux) < 0.02 ? '= $u$ ✓' : '≠ u'}. Hires $m=${fx(100 * f * u, 2)}\\%$ of the labour force = separations $s(1-u)=${fx(100 * s * (1 - u), 2)}\\%$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Model', name: 'Wage-setting and price-setting (WS–PS) equilibrium',
      statement: String.raw`Firms set prices as a markup $\mu$ over labour cost, so the **price-setting** (PS) real wage they can afford is $w^{PS}=\lambda/(1+\mu)$ for labour productivity $\lambda$ — a horizontal line in the (employment, real wage) plane. Workers' wages are set above their reservation level $b$ (the value of unemployment, which includes benefits) by an amount that must motivate effort or reflect bargaining power, and that amount is larger the lower unemployment is: the **wage-setting** (WS) real wage $w^{WS}(u)$ is increasing in employment. The labour-market equilibrium is where they cross,
$$w^{WS}(u^*)=\frac{\lambda}{1+\mu}\qquad\text{at the equilibrium unemployment rate }u^*.$$
For the form $w^{WS}=b+a/(u+u_0)$ used in the picture, $u^*=a/\bigl(\lambda/(1+\mu)-b\bigr)-u_0$.

Scope: a stylised model of a labour market with unemployment as a discipline device or a bargaining outcome; the specific WS form is illustrative.`,
      idea: String.raw`At any real wage above the WS curve, workers would be willing to work for less, but firms cannot cut their wage without losing effort or workers (the efficiency-wage logic of micro-13.11). At any wage above the PS line firms would lose money. The only wage that satisfies both is at the intersection; the unemployment rate there is the one that makes workers just willing to accept a wage that leaves firms their markup. Higher markups, more generous benefits or stronger bargaining power each push the equilibrium unemployment up.`,
      caption: String.raw`**Left:** the wage-setting curve (blue) and price-setting line (red) against the employment rate; the dot is the equilibrium and the dashed ghost lines are the starting point. Drag **markup**, **benefit** and **wage pressure** to move them. **Right:** equilibrium unemployment as a function of the markup for three benefit levels; the dot is your current setting. Past a point there is no intersection (the PS wage falls below what workers will accept at any unemployment) and the model has no equilibrium.`,
      deps: ['micro-13.11'], refs: ['CORE Macro U1'], tags: ['unemployment', 'wage setting'],
      viz(v) {
        const mu = v.slider('firms’ markup $\\mu$', 0, 0.9, 0.25, { step: 0.01 });
        const bS = v.slider('benefit / reservation wage $b$', 0.15, 0.7, 0.45, { step: 0.01 });
        const aS = v.slider('wage pressure $a$', 0.01, 0.06, 0.0245, { step: 0.0005 });
        const u0 = 0.02, A0 = 1;
        const W = v.stage({ x: [0.8, 1], y: [0.3, 1.3], axes: 'box', gutter: true, height: 370, weight: 1.15, xlabel: 'employment rate N / labour force', ylabel: 'real wage (units of productivity)', xticks: [0.8, 0.85, 0.9, 0.95, 1].map((x) => [x, `${Math.round(100 * x)}%`]) });
        const U = v.stage({ x: [0, 0.9], y: [0, 20], axes: 'box', gutter: true, height: 370, weight: 0.85, xlabel: 'markup μ', ylabel: 'equilibrium unemployment (%)', title: 'u* as a function of the markup' });
        let st = {};
        const ustar = (m, b, a) => { const wp = A0 / (1 + m); return wp > b ? a / (wp - b) - u0 : Infinity; };
        const base = { m: 0.25, b: 0.45, a: 0.0245 };
        v.render(() => {
          const m = mu.value, b = bS.value, a = aS.value, wp = A0 / (1 + m), us = ustar(m, b, a);
          const ws = (N, bb, aa) => bb + aa / (1 - N + u0);
          W.fn((N) => ws(N, base.b, base.a), { color: 'blue', dash: [5, 4], width: 1.4, alpha: 0.5, domain: [0.8, 0.998] });
          W.hline(A0 / (1 + base.m), { color: 'red', dash: [5, 4], width: 1.4, alpha: 0.5 });
          W.fn((N) => ws(N, b, a), { color: 'blue', width: 3, domain: [0.8, 0.998] });
          W.hline(wp, { color: 'red', width: 3 });
          W.hline(b, { color: 'muted', dash: [2, 4], width: 1.5 });
          W.text('WS: wage-setting', 0.805, ws(0.81, b, a), { dy: 14, color: 'blue', size: 12, weight: 650 }); W.text('PS: price-setting', 0.805, wp, { dy: -9, color: 'red', size: 12, weight: 650 }); W.text('reservation wage b', 0.805, b, { dy: -8, color: 'muted', size: 11 });
          if (us < 0.2 && us > -u0 + 0.0005 && 1 - us >= 0.8) { const N = 1 - us; W.vband(Math.min(N, 0.8), 0.8, { color: 'orange', alpha: 0.1 }); W.vline(N, { color: 'green', dash: [5, 4], width: 1.6 }); W.dot(N, wp, { color: 'gold', r: 8, label: `u* = ${fx(100 * us, 1)}%`, labelPos: 'nw' }); }
          else W.text(us === Infinity ? 'no equilibrium: PS wage ≤ reservation wage' : `u* = ${fx(100 * us, 1)}% (off the left edge)`, 0.9, 1.22, { align: 'center', color: 'red', size: 12.5, weight: 650 });
          for (const [bb, c] of [[0.3, 'teal'], [0.45, 'accent'], [0.6, 'purple']]) {
            U.path(Array.from({ length: 91 }, (_, i) => i / 100).map((mm) => [mm, 100 * ustar(mm, bb, a)]).filter(([, y]) => y < 21), { color: c, width: Math.abs(bb - b) < 1e-9 ? 3 : 2 });
            { let xm = 0.88; while (xm > 0.02 && 100 * ustar(xm, bb, a) > 17) xm -= 0.01; U.text(`b = ${bb}`, xm, 100 * ustar(xm, bb, a), { align: 'right', dx: -8, color: c, size: 11, weight: 600 }); }
          }
          if (us < 21) U.dot(m, 100 * us, { color: 'gold', r: 7 });
          st = { m, b, wp, us, a };
        });
        v.readout(() => {
          const { m, b, wp, us, a } = st;
          return us === Infinity ? `PS wage $\\lambda/(1+\\mu)=${fx(wp, 3)}\\le b=${fx(b, 2)}$: firms cannot pay what workers would accept at any unemployment rate.` : `$w^{PS}=1/(1+\\mu)=${fx(wp, 3)}$; $w^{WS}(u^*)=b+a/(u^*+u_0)=${fx(b + a / (us + u0), 3)}$ ✓ at $u^*=${fx(100 * us, 2)}\\%$ (start: ${fx(100 * ustar(0.25, 0.45, 0.0245), 1)}%). Raising $\\mu$ by 0.1 from here changes $u^*$ by ${fx(100 * (ustar(m + 0.1, b, a) - us), 1)} points.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Concept', name: 'The natural rate of unemployment',
      statement: String.raw`The **natural rate of unemployment** is the rate around which actual unemployment fluctuates and to which it returns when output is at its normal level: the rate at which job separations and job findings balance, $u_n=s/(s+f)$, given the economy's search frictions and wage-setting institutions. It is the sum of **frictional** unemployment (the time it takes to match workers with jobs) and **structural** unemployment (a mismatch of skills or places with jobs, or wages held above the market-clearing level); the remainder, actual minus natural, is **cyclical** unemployment. It is not a constant: it moves with demographics, benefits, labour-market institutions and with the matching efficiency of macro-2.5, and it is not directly observed but estimated.

Scope: a concept for the medium run; the estimates shown are the U.S. Congressional Budget Office's, which come from a model of the Phillips curve and are themselves uncertain.`,
      idea: String.raw`Two approaches meet. Flow accounting (macro-2.4) says that, because unemployment adjusts within months, the steady state $s/(s+f)$ computed from month-to-month flows simply tracks actual unemployment, but computed from their long-run average it is a benchmark. The wage–price approach (macro-2.6) says that the equilibrium unemployment of the WS–PS model is the rate at which inflation neither rises nor falls. Statistical agencies estimate this rate from the Phillips curve; the two estimates broadly agree in the data, though neither can be read off directly.`,
      caption: String.raw`Actual U.S. unemployment (black) and the CBO's long-term estimate of the natural rate (green), with the long-term rate drawn as a shaded floor; the gap between them is cyclical unemployment, red above (slack), blue below (overheating). Choose the **window**, show the CBO's **short-term** rate (which includes temporary rises from large shocks) or the rate implied by **trend flows** $s/(s+f)$ (measured separation and finding rates averaged over eleven years, so cyclical swings wash out), and drag the date marker for a readout. **Right:** each year's trend-flow rate against the CBO natural rate.`,
      deps: ['macro-2.4', 'macro-2.6'], refs: ['Mankiw ch. 7'], tags: ['unemployment', 'natural rate'],
      credit: 'Friedman, 1968; Phelps, 1967',
      viz(v) {
        const win = v.select('window', [{ value: '1949', label: '1949–' }, { value: '1980', label: '1980–' }, { value: '2000', label: '2000–' }], '1949');
        const sh = v.toggle('short-term natural rate (CBO)', false);
        const fl = v.toggle('rate implied by trend flows s/(s+f)', true);
        const P = NAIRU_US.length / 4, Q = rows(NAIRU_US, 4);
        const FR = rows(FLOWS_US, 4).map(([y, f, s]) => ({ y, f, s: s / 100 }));
        const US = FR.map((d) => { const w = FR.filter((e) => Math.abs(e.y - d.y) <= 5), f = w.reduce((q, e) => q + e.f, 0) / w.length, s = w.reduce((q, e) => q + e.s, 0) / w.length; return { y: d.y, ustar: (100 * s) / (s + f) }; });
        const S = v.stage({ x: [1949, 2027], y: [0, 15], axes: 'box', gutter: true, height: 340, weight: 1.6, xlabel: 'year', ylabel: 'unemployment rate (%)' });
        const hd = S.handle(2019.9, 3.5, { color: 'gold', label: 'date', constrain: (x) => [clamp(x, 1949, 2026.5), 0] });
        const Cm = v.stage({ x: [3, 9], y: [3, 9], axes: 'box', gutter: true, height: 340, weight: 0.7, minWidth: 230, xlabel: 'CBO natural rate (%)', ylabel: 's/(s+f), 11-yr average flows (%)', title: 'two estimates of the natural rate' });
        // annual mean of the CBO long-term rate for each year
        const ann = {}; for (const [t, , n] of Q) { const y = Math.floor(t + 1e-9); (ann[y] ||= []).push(n); }
        const pairsY = US.filter((d) => ann[d.y] && ann[d.y].length === 4).map((d) => [ann[d.y].reduce((a, b) => a + b, 0) / 4, d.ustar]);
        const corr = ols(pairsY.map((p) => p[0]), pairsY.map((p) => p[1]));
        v.legend([['ink', 'unemployment rate'], ['green', 'natural rate (CBO long-term)'], ['red', 'cyclical gap above', { area: true }], ['blue', 'overheating', { area: true }], ['orange', 's/(s+f) from 11-year average flows', { dash: true }]]);
        let st = {};
        v.render(() => {
          const w = Number(win.value), lo = w, hi = 2027;
          S.setView([lo, hi], [0, w === 1949 ? 15 : w === 1980 ? 11 : 15]);
          const pts = Q.filter(([t]) => t >= lo - 0.3);
          S.path([[pts[0][0], 0], ...pts.map(([t, , n]) => [t, n]), [pts[pts.length - 1][0], 0]], { fill: 'green', fillAlpha: 0.1, color: false, close: true, stroke: false });
          // cyclical gap bands
          for (let i = 1; i < pts.length; i++) {
            const [t0, u0, n0] = pts[i - 1], [t1, u1, n1] = pts[i], g0 = u0 - n0, g1 = u1 - n1;
            S.path([[t0, n0], [t0, u0], [t1, u1], [t1, n1]], { fill: (g0 + g1) / 2 >= 0 ? 'red' : 'blue', fillAlpha: 0.28, stroke: false, close: true });
          }
          S.path(pts.map(([t, , n]) => [t, n]), { color: 'green', width: 2.6 });
          if (sh.value) S.path(pts.map(([t, , , m]) => [t, m]), { color: 'green', width: 1.6, dash: [5, 4] });
          if (fl.value) S.path(US.filter((d) => d.y + 0.5 >= lo).map((d) => [d.y + 0.5, d.ustar]), { color: 'orange', width: 2, dash: [6, 4] });
          S.path(pts.map(([t, u]) => [t, u]), { color: 'ink', width: 2 });
          const t = clamp(hd.x, Math.max(lo, 1949), 2026.5), pt = Q.reduce((m, q) => (Math.abs(q[0] - t) < Math.abs(m[0] - t) ? q : m));
          hd.set(pt[0], pt[1]);
          S.vline(pt[0], { color: 'gold', width: 1.2, dash: [3, 4] });
          // comparison panel
          Cm.line(3, 3, 9, 9, { color: 'faint', dash: [5, 4] });
          Cm.dots(pairsY, { r: 3.4, color: 'orange' });
          Cm.text(`slope ${fx(corr.slope, 2)}, R² = ${fx(corr.r2, 2)}`, 3.2, 8.5, { color: 'muted', size: 11.5 });
          st = { t: pt[0], u: pt[1], n: pt[2], m: pt[3], fi: US.find((d) => d.y === Math.floor(pt[0])) };
        });
        v.readout(() => {
          const { t, u, n, m, fi } = st, yr = Math.floor(t), q = Math.floor((t - yr) * 4) + 1;
          return `${yr} Q${q}: unemployment ${fx(u, 1)}%, natural rate ${fx(n, 1)}% (short-term ${fx(m, 1)}%) → cyclical unemployment **${u - n >= 0 ? '+' : '−'}${fx(Math.abs(u - n), 1)} points**${fi ? `; trend-flow rate that year ${fx(fi.ustar, 1)}%` : ''}.\n` +
            `Natural rate = frictional + structural (not separately observed); cyclical = the gap. Over the sample the two natural-rate estimates correlate with R² = ${fx(corr.r2, 2)}.`;
        });
      },
    },
  ],
};
