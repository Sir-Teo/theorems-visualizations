// Macroeconomics — Chapter 3, landmark paper: Solow (1956).
//
// Data: none — the paper is theoretical, with worked examples that are reproduced here: the fundamental equation
// ṙ = s F(r, 1) − n r for capital per worker r; Harrod–Domar fixed proportions (a knife edge unless s/a = n, his
// Example 1); Cobb–Douglas Y = K^a L^{1−a} with r* = (s/n)^{1/(1−a)} (Example 2); and F = (a√K + √L)², which grows
// without bound when s a² > n (Example 3); his Figure 2/3-type case with several balanced paths is drawn with an
// illustrative S-shaped production function. Parameter values are illustrative.
// "Today": Mankiw, Romer & Weil (1992, QJE 107: 407–437): the basic Solow model with α ≈ 1/3 explains about 59% of
// cross-country variation in income per worker (1985), but implies a too-small capital share when fitted freely; with
// human capital added, about 78%. Estimated convergence speed about 2% per year (Barro & Sala-i-Martin 1992, JPE 100:
// 223–251; MRW 1992), against about 4% predicted by the basic model with a capital share of 1/3.

const PROD = {
  cd: { label: 'Cobb–Douglas', f: (r, a) => r ** a },
  hd: { label: 'Harrod–Domar (fixed proportions)', f: (r, a) => Math.min(r / 3, 1) },
  ces: { label: '(a√K + √L)²', f: (r, a) => (a * Math.sqrt(r) + 1) ** 2 },
  multi: { label: 'several balanced paths (illustrative)', f: (r) => 0.6 * Math.sqrt(r) + 4 / (1 + Math.exp(-(r - 15) * 0.8)) },
};

export default {
  collection: 'macro',
  chapter: 3,
  items: [
    {
      num: '3.14',
      kind: 'Paper',
      name: 'A Contribution to the Theory of Economic Growth',
      paper: { authors: 'Robert M. Solow', year: 1956, title: 'A Contribution to the Theory of Economic Growth', venue: 'Quarterly Journal of Economics 70 (1): 65–94', doi: '10.2307/1884513' },
      introduces: ['macro-3.2', 'macro-3.3'],
      statement: String.raw`With output $Y = F(K, L)$ under constant returns, a fixed saving rate $s$ and labour growing at rate $n$, capital per worker $r = K/L$ obeys the **fundamental equation**
$$\dot r = s\,F(r, 1) - n\,r .$$
When $F$ allows substitution between capital and labour with diminishing returns (e.g. Cobb–Douglas $F = K^a L^{1-a}$), the curve $sF(r,1)$ crosses the ray $nr$ once, at $r^* = (s/n)^{1/(1-a)}$, and from any starting point $r$ converges to $r^*$: the economy approaches a **balanced growth path** on which capital and output grow at the rate $n$ and output per worker is constant. A higher saving rate raises the level of output per worker, not its long-run growth rate.

Scope: a closed, one-good economy with exogenous saving, labour growth and (in the extension) technical progress; with fixed proportions (Harrod–Domar) or non-diminishing returns the result fails.`,
      idea: String.raw`Harrod (1939) and Domar (1946) had built growth models with a fixed capital–output ratio, which made balanced growth a "knife edge": unless the saving rate divided by the capital–output ratio happened to equal the labour growth rate, unemployment or idle capital would grow without limit (macro-3.12). Solow showed that the instability came from the assumption of fixed proportions: once the capital–labour ratio can adjust along a neoclassical production function (macro-2.1), the warranted and natural growth rates are reconciled automatically. His one-variable differential equation (macro-3.2) and its phase diagram (macro-3.3) became the workhorse of growth theory; his 1957 paper used it to attribute most of US growth to technical progress (the "Solow residual"). The model earned him the 1987 Nobel Prize and framed the later debates on convergence and endogenous growth.`,
      caption: String.raw`Solow's Figure 1: the saving curve $sF(r,1)$ (green) against the ray $nr$ (red), with arrows showing which way $r$ moves; balanced paths are where they cross. Drag the **saving rate** and **labour growth** and choose the **production function**: Cobb–Douglas (one stable crossing), Harrod–Domar (the curve is flat beyond full employment of labour: a knife edge), his Example 3 with $a\sqrt K$ (no crossing if $sa^2 > n$: growth forever) or an S-shaped function with several balanced paths. **Right**: paths $r(t)$ from several starting points, integrated from the fundamental equation; drag the gold start to try your own.`,
      deps: ['macro-3.12', 'macro-2.1'],
      refs: [],
      tags: ['growth', 'capital accumulation', 'history'],
      credit: 'Robert M. Solow, 1956',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solow%E2%80%93Swan_model' },
      viz(v) {
        const M = v.M;
        const prod = v.select('production function', Object.entries(PROD).map(([k, p]) => ({ value: k, label: p.label })), 'ces', { onChange: (k) => { if (k === 'multi') { sS.set(0.3); nS.set(0.06); } if (k === 'ces') aS.set(0.25); if (k === 'cd') aS.set(0.33); } });
        const sS = v.slider('saving rate s', 0.05, 0.6, 0.25, { step: 0.005 });
        const nS = v.slider('labour growth n', 0.005, 0.08, 0.03, { step: 0.001 });
        const aS = v.slider('a (capital exponent / weight)', 0.1, 0.9, 0.25, { step: 0.01 });
        const P = v.stage({ x: [0, 40], y: [0, 1.6], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 260, xlabel: 'capital per worker r', ylabel: 'per worker per year', title: 'Solow’s Figure 1' });
        const T = v.stage({ x: [0, 150], y: [0, 40], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'years', ylabel: 'capital per worker r(t)', title: 'convergence to balanced growth' });
        const h0 = T.handle(0, 3, { color: 'gold', constrain: (x, y) => [0, Math.max(0.2, y)] });
        let st = null;
        v.render(() => {
          const key = prod.value, F = PROD[key].f, s = sS.value, n = nS.value, a = aS.value;
          aS.el.hidden = key === 'hd' || key === 'multi';
          const g = (r) => s * F(r, a) - n * r;
          // crossings
          const xs = [];
          let rmax = 40;
          if (key === 'cd') rmax = Math.max(4, 2.2 * (s / n) ** (1 / (1 - a)));
          if (key === 'hd') rmax = Math.max(8, 3 * 3 * 1.6);
          if (key === 'ces') { const D = n - s * a * a; rmax = D > 0 ? 1.6 * ((2 * s * a + Math.sqrt(4 * s * s * a * a + 4 * s * D)) / (2 * D)) ** 2 : 60; }
          if (key === 'multi') rmax = 50;
          rmax = Math.min(rmax, 2000);
          for (let i = 1; i <= 2000; i++) { const r0 = (rmax * (i - 1)) / 2000, r1 = (rmax * i) / 2000; if (g(r0 + 1e-9) * g(r1) < 0) xs.push(M.bisect(g, r0 + 1e-9, r1)); }
          const ymax = Math.max(s * F(rmax, a), n * rmax) * 1.08;
          P.setView([0, rmax], [0, ymax]);
          P.fn((r) => s * F(r, a), { color: 'green', width: 2.6, domain: [0, rmax], n: 400 });
          P.fn((r) => n * r, { color: 'red', width: 2.2, domain: [0, rmax] });
          // arrows on the axis
          for (let k = 1; k < 12; k++) { const r = (rmax * k) / 12, d = g(r); if (Math.abs(d) < 1e-6) continue; const dx = (Math.sign(d) * rmax) / 40; P.arrow(r - dx / 2, ymax * 0.03, r + dx / 2, ymax * 0.03, { color: d > 0 ? 'green' : 'red', width: 2 }); }
          for (const r of xs) {
            const stable = g(r - 1e-3 * rmax) > 0 && g(r + 1e-3 * rmax) < 0;
            P.vline(r, { color: 'faint', width: 1, dash: [3, 3] });
            P.dot(r, n * r, { r: 6, color: stable ? 'gold' : 'ink', hollow: !stable });
            P.text(stable ? `r* = ${v.fix(r, 2)}` : `unstable ${v.fix(r, 2)}`, r, n * r, { dx: stable ? 8 : -8, dy: stable ? 14 : -12, align: stable ? 'left' : 'right', size: 11.5, color: stable ? 'gold' : 'muted', weight: 700 });
          }
          P.text('s F(r, 1)', rmax * 0.97, s * F(rmax * 0.97, a), { dy: -8, align: 'right', size: 12, color: 'green', weight: 700 });
          P.text('n r', rmax * 0.97, n * rmax * 0.97, { dy: 14, align: 'right', size: 12, color: 'red', weight: 700 });
          // time paths
          const starts = [0.15 * rmax, 0.5 * rmax, 0.95 * rmax, 0.03 * rmax];
          T.setView([0, 150], [0, rmax]);
          const path = (r0) => { const pts = [[0, r0]]; let r = r0; const dt = 0.25; for (let t = dt; t <= 150; t += dt) { const k1 = g(r), k2 = g(r + (dt / 2) * k1), k3 = g(r + (dt / 2) * k2), k4 = g(r + dt * k3); r = Math.max(0, r + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)); pts.push([t, r]); if (r > 5 * rmax) break; } return pts; };
          for (const r0 of starts) T.path(path(r0), { color: 'accent', width: 1.6, alpha: 0.7 });
          h0.set(0, M.clamp(h0.y, 0.01 * rmax, rmax));
          T.path(path(h0.y), { color: 'gold', width: 2.6 });
          for (const r of xs) { const stable = g(r - 1e-3 * rmax) > 0 && g(r + 1e-3 * rmax) < 0; T.hline(r, { color: stable ? 'gold' : 'muted', width: 1, dash: [5, 4] }); }
          // convergence speed at a stable crossing: λ = −g'(r*)
          const stab = xs.find((r) => g(r - 1e-3 * rmax) > 0 && g(r + 1e-3 * rmax) < 0);
          const lam = stab ? -M.deriv(g, stab) : null;
          st = { xs, stab, lam, key, s, n, a, grow: key === 'ces' && s * a * a > n };
        });
        v.legend([['green', 'saving per worker s F(r, 1)'], ['red', 'investment needed to equip new workers, n r'], ['gold', 'stable balanced path / your start', { dot: true }], ['accent', 'paths r(t)']]);
        v.readout(() => {
          if (!st) return '';
          const { xs, stab, lam, key, s, n, a, grow } = st;
          let txt = '';
          if (key === 'cd') txt = `Cobb–Douglas: $r^* = (s/n)^{1/(1-a)}$ = ${v.fix((s / n) ** (1 / (1 - a)), 3)} (numerically ${stab ? v.fix(stab, 3) : '—'}) · output per worker $r^{*a}$ = ${v.fix(((s / n) ** (1 / (1 - a))) ** a, 3)} · convergence speed $(1-a)n$ = ${v.fix(100 * lam, 2)}% per year (half-life ${v.fix(Math.log(2) / lam, 0)} years)`;
          else if (key === 'hd') txt = xs.length ? `fixed proportions: balanced only at r = ${v.fix(xs[0], 2)} with s/3 > n; beyond full employment of labour the extra capital lies idle — change s or n and the economy drifts to idle capital or to growing unemployment: Harrod–Domar’s knife edge` : `fixed proportions: no balanced path at these values (s/3 ${s / 3 > n ? '>' : '<'} n) — Harrod–Domar’s knife edge`;
          else if (key === 'ces') txt = grow ? `$s a^2 = ${v.fix(s * a * a, 4)} > n$: the saving curve stays above $nr$ for ever and capital per worker grows without bound (Solow’s Example 3)` : `$s a^2 = ${v.fix(s * a * a, 4)} < n$: a stable balanced path at r* = ${stab ? v.fix(stab, 2) : '—'}`;
          else txt = `${xs.length} balanced paths: ${xs.map((r) => v.fix(r, 1)).join(', ')} — the middle one is unstable, so where the economy ends up depends on where it starts (a poverty trap)`;
          return `${txt}. Today: the basic model explains roughly 60% of cross-country income differences (Mankiw, Romer & Weil 1992), but measured convergence is about 2% per year, half the speed this model implies with a capital share of 1/3.`;
        });
      },
    },
  ],
};
