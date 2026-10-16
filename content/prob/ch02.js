// Probability: Theory and Examples (Durrett) — Chapter 2: Laws of Large Numbers. Part A: §2.1 Independence
import { clampN, cornerIn, simpson, PHI, PhiN, sampleExp, logInts, convolveGrid, densityOn, linEdges, popcount, setName, hasseLayout, piViolation, lambdaViolation, lambdaRounds, sigmaGen } from './ch02.shared.js';

// ---------- helpers local to §2.1 ----------
/** Ring of pixel radius r around a data point (dots only give filled/hollow markers of one width). */
function ringPx(v, S, x, y, r, color, width = 2, dash = null) {
  const c = S.ctx; c.save(); c.beginPath(); c.arc(S.X(x), S.Y(y), r, 0, 2 * Math.PI);
  c.strokeStyle = v.color(color); c.lineWidth = width; c.setLineDash(dash || []); c.stroke(); c.restore();
}
/** Hasse diagram of the subsets of {1,2,3,4}: fill(m) → colour | null, ring(m) → [colour, dash?] | null. */
function drawHasse(v, S, lay, o = {}) {
  for (const [a, b] of lay.edges) S.line(lay.pos[a][0], lay.pos[a][1], lay.pos[b][0], lay.pos[b][1], { color: 'grid', width: 1 });
  for (let m = 0; m < lay.N; m++) {
    const [x, y] = lay.pos[m], f = o.fill ? o.fill(m) : null, rg = o.ring ? o.ring(m) : null;
    if (f) S.dot(x, y, { r: 15, color: f }); else { S.dot(x, y, { r: 15, color: 'panel' }); ringPx(v, S, x, y, 15, 'faint', 1.4); }
    if (rg) ringPx(v, S, x, y, 20, rg[0], 2.4, rg[1] ? [4, 3] : null);
    S.text(setName(m), x, y, { align: 'center', size: m === 0 || m === 15 ? 13 : 11, color: f ? 'panel' : 'ink', halo: false, weight: 600 });
  }
}
/** Index of the Hasse node within 18 px of a click, or −1. */
function hitHasse(S, lay, x, y) {
  let best = -1, bd = 18;
  for (let m = 0; m < lay.N; m++) { const d = Math.hypot(S.X(lay.pos[m][0]) - S.X(x), S.Y(lay.pos[m][1]) - S.Y(y)); if (d < bd) { bd = d; best = m; } }
  return best;
}
/** Intervals {u ∈ [0,1] : inside(u)} from a grid scan, as [[a, b], …]. */
function scanIntervals(inside, n = 1200) {
  const out = []; let start = null;
  for (let i = 0; i <= n; i++) { const u = i / n, on = i < n && inside((i + 0.5) / n); if (on && start == null) start = u; if (!on && start != null) { out.push([start, u]); start = null; } }
  return out;
}
const fr = (x, d = 3) => (Math.abs(x) < 5e-13 ? '0' : x.toFixed(d).replace('-', '−'));
const signed = (x, d = 3) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d);

export default {
  collection: 'prob',
  chapter: 2,
  title: 'Laws of Large Numbers',
  summary: String.raw`Independence is defined for σ-fields and checked on π-systems, which lets the chapter build independent sequences, compute the law of a sum by convolution and construct infinite product spaces. The weak laws come from second-moment estimates and truncation: Chebyshev's inequality gives the $L^2$ weak law and its triangular-array relatives (coupon collecting, random permutations, occupancy, the St. Petersburg game), and truncation extends the law to variables with only a finite mean. The Borel–Cantelli lemmas then turn summability into almost-sure statements and lead to Etemadi's strong law. The optional sections treat random series (Kolmogorov's 0-1 law, the maximal inequality, the three-series theorem), renewal theory and Cramér's large deviations.`,
  items: [
    // ======================================================================== §2.1 Independence
    {
      num: '2.1.1a',
      kind: 'Definition',
      name: 'Independence of events, variables and σ-fields',
      verify: true,
      statement: String.raw`Two events $A,B$ are **independent** if $P(A\cap B)=P(A)P(B)$. Two random variables $X,Y$ are independent if
$$P(X\in C,\ Y\in D)=P(X\in C)\,P(Y\in D)\quad\text{for all Borel sets } C,D,$$
that is, every event fixed by $X$ is independent of every event fixed by $Y$. Two σ-fields $\mathcal F,\mathcal G$ are independent if every $A\in\mathcal F$ is independent of every $B\in\mathcal G$.

For several objects the order is reversed, starting from σ-fields. $\mathcal F_1,\dots,\mathcal F_n$ are independent if $P(A_1\cap\dots\cap A_n)=\prod_iP(A_i)$ whenever $A_i\in\mathcal F_i$. Random variables $X_1,\dots,X_n$ are independent if $P(X_1\in B_1,\dots,X_n\in B_n)=\prod_iP(X_i\in B_i)$ for all Borel $B_i$. Events $A_1,\dots,A_n$ are independent if $P(\bigcap_{i\in I}A_i)=\prod_{i\in I}P(A_i)$ for **every** $I\subset\{1,\dots,n\}$. An infinite family is independent when each of its finite subfamilies is.`,
      idea: String.raw`All three definitions are the same product rule applied to more and more events: one pair of events, then all pairs $\{X\in C\},\{Y\in D\}$, then all pairs drawn from two σ-fields. Theorems 2.1.1 and 2.1.2 show that each is a special case of the next. For events the product must be checked over every subfamily $I$. A σ-field contains $\Omega$, so for σ-fields and variables leaving an index out of the product is automatic (put $A_i=\Omega$ or $B_i=\R$). A list of single events has no such slack.`,
      caption: String.raw`Two fair dice $X,Y$, coupled with strength $\theta$: with probability $1-\theta$ they are rolled independently, with probability $\theta$ the chosen coupling ties $Y$ to $X$. Both marginals stay uniform, so the product $P(X=i)P(Y=j)$ is $1/36$ in every cell. Each cell shows $36\,P(X=i,Y=j)$, shaded red above $1$ and blue below. Click row and column headers to choose Borel sets $C$ and $D$. The bars on the right compare the four joint probabilities of $A=\{X\in C\}$, $B=\{Y\in D\}$ with the products of their marginals. All of them agree for every choice only at $\theta=0$. Switch to 3600 seeded rolls to see the same table with sampling noise.`,
      deps: ['prob-1.3.1a', 'prob-1.1.1a'],
      see: ['stat-2.1'],
      tags: ['independence', 'foundations'],
      viz(v) {
        const COUP = {
          copy: { label: '$Y=X$', q: (i, j) => (i === j ? 1 / 6 : 0) },
          anti: { label: '$Y=7-X$', q: (i, j) => (i + j === 5 ? 1 / 6 : 0) },
          par: { label: 'same parity', q: (i, j) => ((i + j) % 2 === 0 ? 1 / 18 : 0) },
        };
        const cp = v.select('coupling', Object.entries(COUP).map(([value, o]) => ({ value, label: o.label })), 'copy');
        const th = v.slider('dependence $\\theta$', 0, 1, 0.3, { step: 0.01 });
        const view = v.select('cells', [{ value: 'law', label: 'exact law' }, { value: 'sample', label: '3600 rolls' }], 'law');
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.3, title: 'cells: $36\\,P(X=i,Y=j)$; click headers to choose $C$, $D$' });
        const R = v.stage({ x: [0.4, 4.6], y: [0, 0.6], height: 340, axes: 'box', gutter: true, xticks: [[1, 'A∩B'], [2, 'A∩Bᶜ'], [3, 'Aᶜ∩B'], [4, 'Aᶜ∩Bᶜ']], title: 'joint (bars) vs product (rings)' });
        const T = v.table(L, { rows: 6, cols: 6, rowLabels: (i) => `X=${i + 1}`, colLabels: (j) => `Y=${j + 1}`, maxCell: 44, size: 12, format: 2 });
        const C = new Set([0, 1]), D = new Set([0, 2, 4]);
        L.onClick((x, y) => {
          const h = T.hit(x, y); if (!h) return;
          if (h.header === 'row') { if (C.has(h.i)) C.delete(h.i); else C.add(h.i); }
          else if (h.header === 'col') { if (D.has(h.j)) D.delete(h.j); else D.add(h.j); }
          v.invalidate();
        });
        let cache = null, st = null;
        v.render(() => {
          const q = COUP[cp.value].q, t = th.value;
          const P = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (1 - t) / 36 + t * q(i, j)));
          const key = `${cp.value}|${t}|${seed}`;
          if (view.value === 'sample' && (!cache || cache.key !== key)) {
            const r = v.rng(seed * 31 + 7), flat = P.flat(), cum = []; let s = 0; for (const p of flat) cum.push((s += p));
            const cnt = new Array(36).fill(0);
            for (let k = 0; k < 3600; k++) { const u = r() * s; let m = 0; while (m < 35 && cum[m] < u) m++; cnt[m]++; }
            cache = { key, F: Array.from({ length: 6 }, (_, i) => cnt.slice(6 * i, 6 * i + 6).map((c) => c / 3600)) };
          }
          const Q = view.value === 'sample' ? cache.F : P;
          const px = Q.map((row) => row.reduce((a, b) => a + b, 0)), py = [0, 1, 2, 3, 4, 5].map((j) => Q.reduce((a, row) => a + row[j], 0));
          const hl = []; for (const i of C) for (const j of D) hl.push([i, j, 'gold']);
          T.draw({
            value: (i, j) => 36 * Q[i][j],
            fill: (i, j) => v.diverge(clampN((36 * Q[i][j] - 1) / 3, -1, 1), 'blue', 'red'),
            highlight: hl,
            rowLabelColor: (i) => (C.has(i) ? 'accent' : 'muted'),
            colLabelColor: (j) => (D.has(j) ? 'orange' : 'muted'),
          });
          let pA = 0, pB = 0, pAB = 0;
          for (const i of C) pA += px[i];
          for (const j of D) pB += py[j];
          for (const i of C) for (const j of D) pAB += Q[i][j];
          const joint = [pAB, pA - pAB, pB - pAB, 1 - pA - pB + pAB], prod = [pA * pB, pA * (1 - pB), (1 - pA) * pB, (1 - pA) * (1 - pB)];
          const ymax = Math.max(0.3, ...joint, ...prod) * 1.18; R.setView(null, [0, ymax]);
          joint.forEach((p, k) => {
            const ok = Math.abs(p - prod[k]) < 0.004;
            R.rect(k + 1 - 0.3, 0, k + 1 + 0.3, p, { fill: ok ? 'green' : 'red', fillAlpha: 0.45, color: ok ? 'green' : 'red', width: 1.2 });
            R.dot(k + 1, prod[k], { r: 6, hollow: true, color: 'ink' });
            R.text(fr(p), k + 1, p + ymax * 0.035, { align: 'center', size: 11, color: 'muted' });
          });
          let dev = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) dev = Math.max(dev, Math.abs(Q[i][j] - px[i] * py[j]));
          st = { pA, pB, pAB, dev, C: C.size, D: D.size, sample: view.value === 'sample' };
          v.legend([['red', 'cell above product', { area: true }], ['blue', 'cell below product', { area: true }], ['gold', '$C\\times D$'], ['ink', 'product of marginals', { dot: true }]]);
        });
        v.readout(() => st && `$P(A)=${fr(st.pA)}$, $P(B)=${fr(st.pB)}$: $\\ P(A\\cap B)=${fr(st.pAB)}$ vs $P(A)P(B)=${fr(st.pA * st.pB)}$. Largest cell gap $\\max_{i,j}|P(X=i,Y=j)-P(X=i)P(Y=j)|=${fr(st.dev, 4)}$` + (st.sample ? ' (sampling noise is about $0.003$ at $\\theta=0$).' : st.dev < 1e-12 ? ': independent.' : ': dependent, and some choice of $C,D$ exposes it.'));
      },
    },
    {
      num: '2.1.1',
      kind: 'Theorem',
      name: 'Independent variables have independent σ-fields',
      statement: String.raw`(i) If $X$ and $Y$ are independent random variables, then the σ-fields $\sigma(X)$ and $\sigma(Y)$ are independent.

(ii) Conversely, if $\mathcal F$ and $\mathcal G$ are independent σ-fields and $X\in\mathcal F$, $Y\in\mathcal G$ (that is, $X$ is $\mathcal F$-measurable and $Y$ is $\mathcal G$-measurable), then $X$ and $Y$ are independent.`,
      idea: String.raw`Every set in $\sigma(X)$ has the form $\{X\in C\}$ for a Borel set $C$, so (i) is the definition of independent variables, read again. For (ii), measurability puts $\{X\in C\}$ in $\mathcal F$ and $\{Y\in D\}$ in $\mathcal G$, and independence of the σ-fields gives the product rule. So "independent variables" means exactly "independent generated σ-fields", which is the form the rest of the chapter uses.`,
      caption: String.raw`The sample space is the unit square with area as probability. $X=f(\omega_1)$ depends only on the first coordinate, so every event in $\sigma(X)$ is a union of **vertical** strips. Left: drag the two gold handles to choose $C$; its preimage under $f$ (blue) can be several intervals. Right: $A=\{X\in C\}$ is blue, $B=\{Y>d\}$ is orange and $A\cap B$ is green. When $Y=\omega_2$, $B$ is a horizontal strip and the green area is exactly $P(A)P(B)$, whatever $C$ and $d$. Turn on "$Y$ also reads $\omega_1$" and $B$ becomes diagonal bands: the product rule breaks.`,
      deps: ['prob-2.1.1a', 'prob-1.3.1a'],
      tags: ['independence'],
      viz(v) {
        const FX = {
          sin: { label: '$\\sin 3\\pi u$', f: (u) => Math.sin(3 * Math.PI * u), r: [-1.15, 1.15] },
          sq: { label: '$u^2$', f: (u) => u * u, r: [-0.08, 1.08] },
          saw: { label: '$4u \\bmod 1$', f: (u) => (4 * u) % 1, r: [-0.08, 1.08] },
        };
        const fs = v.select('$X=f(\\omega_1)$, $f=$', Object.entries(FX).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const dS = v.slider('$d$', 0.05, 0.95, 0.45, { step: 0.01 });
        const mix = v.toggle('$Y$ also reads $\\omega_1$', false);
        const L = v.stage({ x: [0, 1], y: [-1.15, 1.15], height: 330, axes: 'box', gutter: true, xlabel: '$\\omega_1$', title: 'graph of $f$; $C$ between the handles' });
        const R = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$\\omega_1$', ylabel: '$\\omega_2$', title: '$\\Omega=[0,1]^2$: $A$, $B$, $A\\cap B$' });
        const h1 = L.handle(0.96, 0.35, { color: 'gold', constrain: (x, y) => [0.96, clampN(y, L.yr[0], L.yr[1])] });
        const h2 = L.handle(0.96, 0.9, { color: 'gold', constrain: (x, y) => [0.96, clampN(y, L.yr[0], L.yr[1])] });
        let last = 'sin', st = null;
        v.render(() => {
          const F = FX[fs.value];
          if (last !== fs.value) { last = fs.value; const [a, b] = F.r; h1.set(0.96, a + 0.35 * (b - a)); h2.set(0.96, a + 0.75 * (b - a)); }
          L.setView(null, F.r);
          const lo = Math.min(h1.y, h2.y), hi = Math.max(h1.y, h2.y), d = dS.value;
          const inA = (u) => { const x = F.f(u); return x >= lo && x <= hi; };
          const Y = mix.value ? (u, w) => (u + w) % 1 : (u, w) => w;
          const ints = scanIntervals(inA, 2000);
          L.hband(lo, hi, { color: 'gold', alpha: 0.12 });
          for (const [a, b] of ints) L.vband(a, b, { color: 'accent', alpha: 0.14 });
          L.fn(F.f, { color: 'ink', width: 1.6, n: 600 });
          L.fn((u) => (inA(u) ? F.f(u) : NaN), { color: 'accent', width: 3.2, n: 900 });
          for (const [a, b] of ints) L.line(a, L.yr[0], b, L.yr[0], { color: 'accent', width: 6 });
          // areas on a 500×500 grid (exact for strips up to the grid)
          const n = 500; let cA = 0, cB = 0, cAB = 0; const rowA = new Uint8Array(n);
          for (let i = 0; i < n; i++) rowA[i] = inA((i + 0.5) / n) ? 1 : 0;
          for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; for (let j = 0; j < n; j++) { const b = Y(u, (j + 0.5) / n) > d; if (rowA[i]) { cA++; if (b) cAB++; } if (b) cB++; } }
          const pA = cA / n / n, pB = cB / n / n, pAB = cAB / n / n;
          const cA_ = v.rgb('accent'), cB_ = v.rgb('orange'), cG = v.rgb('green');
          R.raster((u, w) => {
            if (u < 0 || u > 1 || w < 0 || w > 1) return null;
            const a = inA(u), b = Y(u, w) > d;
            if (a && b) return [cG[0], cG[1], cG[2], 0.75];
            if (a) return [cA_[0], cA_[1], cA_[2], 0.35];
            if (b) return [cB_[0], cB_[1], cB_[2], 0.35];
            return null;
          }, { key: `${fs.value}|${lo}|${hi}|${d}|${mix.value}`, res: 2 });
          st = { pA, pB, pAB };
          v.legend([['accent', '$A=\\{X\\in C\\}$', { area: true }], ['orange', '$B=\\{Y>d\\}$', { area: true }], ['green', '$A\\cap B$', { area: true }]]);
        });
        v.readout(() => st && `$P(A)=${fr(st.pA)}$, $P(B)=${fr(st.pB)}$, $\\ P(A\\cap B)=${fr(st.pAB)}$ vs $P(A)P(B)=${fr(st.pA * st.pB)}$ (areas on a $500\\times500$ grid)` + (Math.abs(st.pAB - st.pA * st.pB) < 2e-3 ? ': the product rule holds.' : ': it fails, since $Y$ is not $\\sigma(\\omega_2)$-measurable.'));
      },
    },
    {
      num: '2.1.2',
      kind: 'Theorem',
      name: 'Complements of independent events are independent',
      statement: String.raw`(i) If $A$ and $B$ are independent, then so are $A^c$ and $B$, $A$ and $B^c$, and $A^c$ and $B^c$.

(ii) Two events $A$ and $B$ are independent if and only if the indicator variables $1_A$ and $1_B$ are independent.`,
      idea: String.raw`Subtract $P(A\cap B)=P(A)P(B)$ from $P(B)=P(B)$ to get $P(A^c\cap B)=P(A^c)P(B)$; the other two cases follow by symmetry. For (ii), the sets $\{1_A\in C\}$ can only be $\emptyset,A,A^c,\Omega$. Pairs involving $\emptyset$ or $\Omega$ factor trivially, and (i) covers the other four. In the mosaic, the four cells all deviate from their products by the same amount $\pm P(A)P(A^c)\bigl(P(B\mid A)-P(B\mid A^c)\bigr)$, so one zero forces all four.`,
      caption: String.raw`A mosaic of the joint law of $(1_A,1_B)$. Column widths are $P(A)$ and $P(A^c)$ (drag the gold handle). Heights in each column are $P(B\mid A)$ and $P(B\mid A^c)$ (drag the blue handles). Each cell is labelled with its probability minus the product of its marginals. The dashed line is at height $P(B)$: $A$ and $B$ are independent exactly when both cuts lie on it, and then all four labels read $0$ at once. Away from it the four gaps are always $\pm$ one number.`,
      deps: ['prob-2.1.1a'],
      tags: ['independence'],
      viz(v) {
        const lock = v.toggle('keep $A,B$ independent', false, { onChange: (on) => { if (on) h2.y = h1.y; } });
        const S = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 360, weight: 1.25, axes: 'box', gutter: true, xticks: [0, 0.5, 1], yticks: [0, 0.5, 1], title: 'mosaic of $(1_A,1_B)$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'joint probability (product below)' });
        const T = v.table(R, { rows: 2, cols: 2, maxCell: 92, size: 16, rowLabels: ['$A$', '$A^c$'], colLabels: ['$B$', '$B^c$'], subSize: 12 });
        const hA = S.handle(0.42, 0, { color: 'gold', label: 'P(A)', labelPos: 'n', constrain: (x) => [clampN(x, 0.08, 0.92), 0] });
        const h1 = S.handle(0.21, 0.72, { color: 'accent', constrain: (x, y) => [hA.x / 2, clampN(y, 0.04, 0.96)] });
        const h2 = S.handle(0.71, 0.38, { color: 'accent', constrain: (x, y) => [(1 + hA.x) / 2, clampN(y, 0.04, 0.96)] });
        h1.onDrag = () => { if (lock.value) h2.y = h1.y; };
        h2.onDrag = () => { if (lock.value) h1.y = h2.y; };
        let st = null;
        v.render(() => {
          const a = hA.x; h1.x = a / 2; h2.x = (1 + a) / 2;
          const y1 = h1.y, y2 = h2.y, b = a * y1 + (1 - a) * y2;
          const cells = [
            { r: [0, 0, a, y1], p: a * y1, q: a * b, name: 'A∩B', c: 'green' },
            { r: [0, y1, a, 1], p: a * (1 - y1), q: a * (1 - b), name: 'A∩Bᶜ', c: 'accent' },
            { r: [a, 0, 1, y2], p: (1 - a) * y2, q: (1 - a) * b, name: 'Aᶜ∩B', c: 'orange' },
            { r: [a, y2, 1, 1], p: (1 - a) * (1 - y2), q: (1 - a) * (1 - b), name: 'Aᶜ∩Bᶜ', c: 'purple' },
          ];
          for (const C of cells) {
            S.rect(C.r[0], C.r[1], C.r[2], C.r[3], { fill: C.c, fillAlpha: 0.22, color: 'panel', width: 3 });
            const cx = (C.r[0] + C.r[2]) / 2, cy = (C.r[1] + C.r[3]) / 2, w = C.r[2] - C.r[0], hgt = C.r[3] - C.r[1];
            if (w > 0.1 && hgt > 0.09) {
              S.text(C.name, cx, cy + 0.035, { align: 'center', size: 13, color: C.c, weight: 700 });
              S.text(signed(C.p - C.q), cx, cy - 0.035, { align: 'center', size: 12.5, color: 'ink' });
            }
          }
          S.line(0, b, 1, b, { color: 'ink', dash: [6, 4], width: 1.6 });
          S.text('P(B)', 0.995, b + 0.025, { align: 'right', size: 11, color: 'muted' });
          const J = [[cells[0], cells[1]], [cells[2], cells[3]]];
          T.draw({ value: (i, j) => J[i][j].p.toFixed(3), sub: (i, j) => J[i][j].q.toFixed(3), fill: (i, j) => [J[i][j].c, Math.abs(J[i][j].p - J[i][j].q) < 5e-4 ? 0.35 : 0.12], textColor: (i, j) => (Math.abs(J[i][j].p - J[i][j].q) < 5e-4 ? 'green' : 'ink') });
          S.line(a, 0, a, 1, { color: 'gold', width: 2 });
          st = { a, b, y1, y2, d: a * (1 - a) * (y1 - y2) };
          v.legend([['ink', 'height $P(B)$', { dash: true }], ['gold', 'cut at $P(A)$']]);
        });
        v.readout(() => st && `$P(A)=${fr(st.a)}$, $P(B)=${fr(st.b)}$. The four gaps are $\\pm\\delta$ with $\\delta=P(A)P(A^c)\\,(P(B\\mid A)-P(B\\mid A^c))=${fr(st.d, 4)}$` + (Math.abs(st.d) < 5e-4 ? ': all four pairs are independent together.' : ': none of the four pairs is independent.'));
      },
    },
    {
      num: '2.1.3',
      kind: 'Theorem',
      name: 'Complements and indicators preserve independence',
      statement: String.raw`Let $A_1,\dots,A_n$ be independent events. Then (i) $A_1^c,A_2,\dots,A_n$ are independent, and (ii) the indicator variables $1_{A_1},\dots,1_{A_n}$ are independent.`,
      idea: String.raw`For (i), products over sets $I$ not containing $1$ are unchanged. If $1\in I$, subtract the identity for $I$ from the identity for $J=I\setminus\{1\}$. Applying (i) repeatedly lets any of the events be replaced by its complement. Then $P(\bigcap C_i)=\prod P(C_i)$ holds whenever each $C_i\in\{A_i,A_i^c,\Omega\}$, which covers every value of $\{1_{A_i}\in B_i\}$ except $\emptyset$, where the identity is trivial. That is (ii).`,
      caption: String.raw`Three events with probabilities $p_1,p_2,p_3$. The toggles replace any of them by its complement, giving $B_1,B_2,B_3$. Left: the probabilities of the eight atoms (bars; label $101$ means $B_1\cap B_2^c\cap B_3$) against the products of marginals (rings). Right: the gaps $P(C_1\cap C_2\cap C_3)-\prod P(C_i)$ over all $27$ choices $C_i\in\{B_i,B_i^c,\Omega\}$, which are the events of the indicators. Flipping complements never creates a gap. The parity twist $\eta$ adds $\pm\varepsilon$ to the atoms by parity. Every pair stays independent, but the 8 choices with no $\Omega$ now show gaps.`,
      deps: ['prob-2.1.2'],
      tags: ['independence'],
      viz(v) {
        const ps = [v.slider('$p_1$', 0.1, 0.9, 0.5, { step: 0.01 }), v.slider('$p_2$', 0.1, 0.9, 0.3, { step: 0.01 }), v.slider('$p_3$', 0.1, 0.9, 0.65, { step: 0.01 })];
        const eta = v.slider('parity twist $\\eta$', -1, 1, 0.6, { step: 0.02 });
        const fl = [v.toggle('$B_1=A_1^c$', false), v.toggle('$B_2=A_2^c$', true), v.toggle('$B_3=A_3^c$', false)];
        const L = v.stage({ x: [0.4, 8.6], y: [0, 0.5], height: 300, axes: 'box', gutter: true, xticks: [[1, '111'], [2, '110'], [3, '101'], [4, '100'], [5, '011'], [6, '010'], [7, '001'], [8, '000']], title: 'atoms of $B_1,B_2,B_3$ (1 = inside $B_i$)' });
        const R = v.stage({ x: [0, 28], y: [-0.06, 0.06], height: 300, weight: 1.15, axes: 'box', gutter: true, xticks: [], title: 'gaps for the 27 choices $C_i\\in\\{B_i,B_i^c,\\Omega\\}$' });
        let st = null;
        v.render(() => {
          const p = ps.map((s) => s.value), f = fl.map((t) => t.value);
          // atom probabilities in A-coordinates, then the twist
          const base = (s) => [0, 1, 2].reduce((acc, i) => acc * ((s >> i) & 1 ? p[i] : 1 - p[i]), 1);
          let emax = Infinity; for (let s = 0; s < 8; s++) emax = Math.min(emax, base(s));
          const eps = eta.value * emax;
          const qa = (s) => base(s) + eps * (popcount(s) % 2 ? -1 : 1);
          const fmask = (f[0] ? 1 : 0) | (f[1] ? 2 : 0) | (f[2] ? 4 : 0);
          const qb = (t) => qa(t ^ fmask); // atom t in B-coordinates
          const pb = [0, 1, 2].map((i) => (f[i] ? 1 - p[i] : p[i]));
          const prodB = (t) => [0, 1, 2].reduce((acc, i) => acc * ((t >> i) & 1 ? pb[i] : 1 - pb[i]), 1);
          const order = [7, 3, 5, 1, 6, 2, 4, 0]; // bits: t&1 = B1, t&2 = B2, t&4 = B3
          const ymax = Math.max(...order.map(qb), ...order.map(prodB)) * 1.22; L.setView(null, [0, ymax]);
          order.forEach((t, k) => {
            const x = k + 1, q = qb(t), pr = prodB(t), ok = Math.abs(q - pr) < 1e-9;
            L.rect(x - 0.32, 0, x + 0.32, q, { fill: ok ? 'green' : 'red', fillAlpha: 0.4, color: ok ? 'green' : 'red', width: 1.2 });
            L.dot(x, pr, { r: 5.5, hollow: true, color: 'ink' });
          });
          // 27 choices: digit 0 = B_i, 1 = B_i^c, 2 = Ω
          const gaps = []; let gmax = 0;
          for (let c = 0; c < 27; c++) {
            const dg = [c % 3, Math.floor(c / 3) % 3, Math.floor(c / 9)];
            let P = 0; for (let t = 0; t < 8; t++) if (dg.every((d, i) => d === 2 || ((t >> i) & 1) === (d === 0 ? 1 : 0))) P += qb(t);
            const pr = dg.reduce((acc, d, i) => acc * (d === 2 ? 1 : d === 0 ? pb[i] : 1 - pb[i]), 1);
            const nO = dg.filter((d) => d === 2).length;
            gaps.push({ g: P - pr, nO }); gmax = Math.max(gmax, Math.abs(P - pr));
          }
          const lim = Math.max(0.02, gmax * 1.3); R.setView(null, [-lim, lim]);
          R.hline(0, { color: 'muted', width: 1 });
          const COL = ['red', 'orange', 'teal', 'faint'];
          gaps.forEach((G, c) => { R.rect(c + 0.6, 0, c + 1.4, G.g, { fill: COL[G.nO], fillAlpha: 0.75, stroke: false }); R.dot(c + 1, G.g, { r: 2.5, color: COL[G.nO] }); });
          st = { gmax, eps, pairsOK: true };
          v.legend([['green', 'atom = product', { area: true }], ['red', 'atom ≠ product', { area: true }], ['ink', 'product of marginals', { dot: true }], ['red', 'no Ω'], ['orange', 'one Ω'], ['teal', 'two Ω']]);
        });
        v.readout(() => st && `Largest gap over the 27 choices: $${fr(st.gmax, 4)}$.` + (st.gmax < 1e-12 ? ' Independence survives every complement, so the indicators are independent.' : ` The twist $\\varepsilon=${fr(st.eps, 4)}$ cancels in every two-event marginal, so the events are still **pairwise** independent; only the choices with no $\\Omega$ fail.`));
      },
    },
    {
      num: '2.1.3a',
      kind: 'Definition',
      name: 'Pairwise independence',
      verify: true,
      statement: String.raw`Events $A_1,\dots,A_n$ are **pairwise independent** if $P(A_i\cap A_j)=P(A_i)P(A_j)$ for all $i\ne j$; random variables are pairwise independent if each pair is independent. Independent events are pairwise independent, but not conversely. For example, let $X_1,X_2,X_3$ be independent fair bits and put $A_1=\{X_2=X_3\}$, $A_2=\{X_3=X_1\}$, $A_3=\{X_1=X_2\}$. Each pair meets in $\{X_1=X_2=X_3\}$, of probability $1/4=P(A_i)P(A_j)$, yet $P(A_1\cap A_2\cap A_3)=1/4\ne1/8$.`,
      idea: String.raw`Pairwise independence only constrains the two-dimensional marginals, while independence fixes the whole joint law. A third variable that is a function of the first two (an XOR, an equality indicator, $X+nY \bmod K$ for a prime $K$) can have every pair look independent while the three together are completely determined. Pairwise independence is still enough for anything that only uses second moments, such as Theorem 2.2.1 and the $L^2$ weak law.`,
      caption: String.raw`Pick an example and a pair. Left: the seeded frequency table of that pair from $3000$ draws (exact probabilities in the corner of each cell); every cell sits at the product of the marginals. Right: the full triple table. Rows are the values of the chosen pair, columns the value of the third variable. Red cells are **impossible** even though their product of marginals is positive: given two of the variables, the third is determined.`,
      deps: ['prob-2.1.1a'],
      tags: ['independence'],
      viz(v) {
        const EX = {
          dur: { label: 'equalities of 3 bits', K: 2, outs: () => { const o = []; for (let s = 0; s < 8; s++) { const x = [s & 1, (s >> 1) & 1, (s >> 2) & 1]; o.push([+(x[1] === x[2]), +(x[2] === x[0]), +(x[0] === x[1])]); } return o; }, names: ['1_{A_1}', '1_{A_2}', '1_{A_3}'] },
          xor: { label: 'XOR of two coins', K: 2, outs: () => [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]], names: ['X', 'Y', 'X\\oplus Y'] },
          mod: { label: '$X+nY \\bmod 3$', K: 3, outs: () => { const o = []; for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) o.push([x, (x + y) % 3, (x + 2 * y) % 3]); return o; }, names: ['Z_0', 'Z_1', 'Z_2'] },
        };
        const ex = v.select('example', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'dur');
        const pr = v.select('pair', [{ value: '01', label: '1, 2' }, { value: '02', label: '1, 3' }, { value: '12', label: '2, 3' }], '01');
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'pair table: frequencies (exact in the corner)' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.1, title: 'triple table: pair values × third value' });
        const TL = v.table(L, { rows: 2, cols: 2, maxCell: 70, size: 13 });
        const TR = v.table(R, { rows: 4, cols: 2, maxCell: 50, size: 12, square: false, cellAspect: 1.8 });
        let cache = null, st = null;
        v.render(() => {
          const E = EX[ex.value], K = E.K, outs = E.outs(), N = 3000;
          const key = `${ex.value}|${seed}`;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 17 + 3); cache = { key, s: Array.from({ length: N }, () => outs[Math.floor(r() * outs.length)]) }; }
          const a = +pr.value[0], b = +pr.value[1], c = 3 - a - b;
          const ex2 = (i, j) => outs.filter((o) => o[a] === i && o[b] === j).length / outs.length;
          const fq2 = (i, j) => cache.s.filter((o) => o[a] === i && o[b] === j).length / N;
          const m1 = (k, i) => outs.filter((o) => o[k] === i).length / outs.length;
          TL.draw({ rows: K, cols: K, value: (i, j) => fq2(i, j).toFixed(3), sub: (i, j) => fr(ex2(i, j), 3), rowLabels: (i) => `$${E.names[a]}=${i}$`, colLabels: (j) => `$${E.names[b]}=${j}$`,
            fill: (i, j) => (Math.abs(ex2(i, j) - m1(a, i) * m1(b, j)) < 1e-12 ? ['green', 0.22] : ['red', 0.3]) });
          const ex3 = (r, k) => outs.filter((o) => o[a] === Math.floor(r / K) && o[b] === r % K && o[c] === k).length / outs.length;
          const fq3 = (r, k) => cache.s.filter((o) => o[a] === Math.floor(r / K) && o[b] === r % K && o[c] === k).length / N;
          const pr3 = (r, k) => m1(a, Math.floor(r / K)) * m1(b, r % K) * m1(c, k);
          TR.draw({ rows: K * K, cols: K, value: (r, k) => fq3(r, k).toFixed(3), rowLabels: (r) => `${Math.floor(r / K)}, ${r % K}`, colLabels: (k) => `$${E.names[c]}=${k}$`, cornerLabel: `${a + 1}, ${b + 1}`,
            fill: (r, k) => (ex3(r, k) === 0 ? ['red', 0.35] : ['green', 0.2]), sub: (r, k) => fr(pr3(r, k), 3), maxCell: K === 3 ? 30 : 50, size: K === 3 ? 11 : 12 });
          let d2 = 0, d3 = 0, s2 = 0;
          for (const [x, y] of [[0, 1], [0, 2], [1, 2]]) for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) d2 = Math.max(d2, Math.abs(outs.filter((o) => o[x] === i && o[y] === j).length / outs.length - m1(x, i) * m1(y, j)));
          for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) s2 = Math.max(s2, Math.abs(fq2(i, j) - m1(a, i) * m1(b, j)));
          for (let r = 0; r < K * K; r++) for (let k = 0; k < K; k++) d3 = Math.max(d3, Math.abs(ex3(r, k) - pr3(r, k)));
          st = { d2, d3, s2, K };
          v.legend([['green', 'possible / product holds', { area: true }], ['red', 'impossible cell', { area: true }]]);
        });
        v.readout(() => st && `Exact: every pair has $\\max|P(V_i=x,V_j=y)-P(V_i=x)P(V_j=y)|=${fr(st.d2, 4)}$ (sample, this pair: $${fr(st.s2, 3)}$). The triple has $\\max|P(V_1=x,V_2=y,V_3=z)-\\prod|=${fr(st.d3, 4)}$ (the small numbers in the right-hand table are the products): pairwise independent, not independent.`);
      },
    },
    {
      num: '2.1.5',
      kind: 'Lemma',
      name: 'Classes containing Ω: independence is a product rule',
      statement: String.raw`Collections of events $\mathcal A_1,\dots,\mathcal A_n\subset\mathcal F$ are **independent** if $P(\bigcap_{i\in I}A_i)=\prod_{i\in I}P(A_i)$ whenever $I\subset\{1,\dots,n\}$ and $A_i\in\mathcal A_i$. Adding $\Omega$ to each collection does not change this property. When every $\mathcal A_i$ contains $\Omega$, independence is equivalent to the single condition
$$P(A_1\cap\dots\cap A_n)=\prod_{i=1}^nP(A_i)\qquad\text{whenever } A_i\in\mathcal A_i,$$
since a subfamily $I$ is obtained by taking $A_i=\Omega$ for $i\notin I$.`,
      idea: String.raw`If each $A_i$ is either in $\mathcal A_i$ or equal to $\Omega$, then $\bigcap_iA_i=\bigcap_{i\in I}A_i$ where $I$ is the set of indices with $A_i\ne\Omega$. The factors $P(\Omega)=1$ drop out of the product. So putting $\Omega$ into the classes costs nothing, and once it is there, the full $n$-fold products already contain every partial one. Theorem 2.1.7 uses this to reduce to full intersections.`,
      caption: String.raw`$\Omega$ has eight equally likely points. Choose which event to edit, then click points to put them in or out of $A$ (blue), $B$ (orange) or $C$ (green). The table lists the four products with at least two real factors. With $\Omega$ added to each class, these are all full intersections $C_1\cap C_2\cap C_3$ with $C_i\in\{A_i,\Omega\}$, so the full-product condition checks them all. Without $\Omega$, only the first row is a full product. The preset "trap" passes it ($1/8=(1/2)^3$) but fails the second row.`,
      deps: ['prob-2.1.1a'],
      tags: ['independence'],
      viz(v) {
        const ed = v.select('edit', [{ value: 0, label: '$A$' }, { value: 1, label: '$B$' }, { value: 2, label: '$C$' }], 0);
        const om = v.toggle('add $\\Omega$ to each class', true);
        const sets = [0b00001111, 0b00001111, 0b01110001];
        v.button('preset: trap', () => { sets[0] = 0b00001111; sets[1] = 0b00001111; sets[2] = 0b01110001; });
        v.button('preset: three coins', () => { sets[0] = 0b01010101; sets[1] = 0b00110011; sets[2] = 0b00001111; });
        const L = v.stage({ x: [0, 4], y: [0, 2], equal: true, height: 300, axes: false, title: '$\\Omega=\\{1,\\dots,8\\}$, each point of mass $1/8$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15, title: 'product checks' });
        const T = v.table(R, { rows: 4, cols: 3, square: false, cellAspect: 1.6, maxCell: 46, size: 13, colLabels: ['P(∩)', '∏ P', ''], rowLabels: ['A∩B∩C', 'A∩B∩Ω', 'A∩Ω∩C', 'Ω∩B∩C'] });
        const cell = (k) => [k % 4, 1 - Math.floor(k / 4)];
        L.onClick((x, y) => { const c = Math.floor(x), r = Math.floor(y); if (c < 0 || c > 3 || r < 0 || r > 1) return; const k = (1 - r) * 4 + c; sets[ed.value] ^= 1 << k; v.invalidate(); });
        const COL = ['accent', 'orange', 'green'], NAME = ['A', 'B', 'C'];
        let st = null;
        v.render(() => {
          for (let k = 0; k < 8; k++) {
            const [c, r] = cell(k);
            L.rect(c + 0.06, r + 0.06, c + 0.94, r + 0.94, { fill: 'panel', color: 'faint', width: 1.2, radius: 6 });
            for (let e = 0; e < 3; e++) {
              const y0 = r + 0.12 + e * 0.22, inside = (sets[e] >> k) & 1;
              L.rect(c + 0.32, y0, c + 0.88, y0 + 0.17, { fill: COL[e], fillAlpha: inside ? 0.75 : 0.06, color: COL[e], width: inside ? 0 : 1, alpha: 0.5, radius: 3 });
              if (inside) L.text(NAME[e], c + 0.6, y0 + 0.085, { align: 'center', size: 11, color: 'panel', halo: false, weight: 700 });
            }
            L.text(String(k + 1), c + 0.18, r + 0.5, { align: 'center', size: 15, color: 'ink', weight: 600 });
          }
          const P = (m) => popcount(m) / 8, all = 255;
          const rows = [[sets[0], sets[1], sets[2]], [sets[0], sets[1], all], [sets[0], all, sets[2]], [all, sets[1], sets[2]]];
          const res = rows.map((rw) => { const pi = P(rw[0] & rw[1] & rw[2]), pp = P(rw[0]) * P(rw[1]) * P(rw[2]); return { pi, pp, ok: Math.abs(pi - pp) < 1e-12 }; });
          const checked = (i) => i === 0 || om.value;
          T.draw({
            value: (i, j) => (j === 0 ? `${Math.round(res[i].pi * 8)}/8` : j === 1 ? fr(res[i].pp, 4) : !checked(i) ? 'not required' : res[i].ok ? '✓' : '✗'),
            fill: (i, j) => (!checked(i) ? ['faint', 0.15] : j === 2 ? (res[i].ok ? ['green', 0.3] : ['red', 0.35]) : null),
            textColor: (i) => (checked(i) ? 'ink' : 'muted'),
          });
          const indep = res.every((r) => r.ok);
          st = { full: res[0].ok, indep, om: om.value, caught: om.value && !indep };
          v.legend([['accent', '$A$', { area: true }], ['orange', '$B$', { area: true }], ['green', '$C$', { area: true }]]);
        });
        v.readout(() => st && `Full product $P(A\\cap B\\cap C)=P(A)P(B)P(C)$: **${st.full ? 'holds' : 'fails'}**. Independent in Durrett's sense (every subfamily): **${st.indep ? 'yes' : 'no'}**. ` + (st.om ? 'With $\\Omega$ in the classes, the full-product condition over all choices is exactly that test.' : (st.full && !st.indep ? 'Without $\\Omega$, checking only full products would wrongly accept these events.' : 'Without $\\Omega$, the subfamily rows are not full products and must be checked separately.')));
      },
    },
    {
      num: '2.1.5a',
      kind: 'Definition',
      name: 'π-systems and λ-systems',
      verify: true,
      statement: String.raw`A collection $\mathcal A$ of subsets of $\Omega$ is a **π-system** if it is closed under intersection: $A,B\in\mathcal A$ implies $A\cap B\in\mathcal A$. A collection $\mathcal L$ is a **λ-system** if

(i) $\Omega\in\mathcal L$;
(ii) $A,B\in\mathcal L$ and $A\subset B$ imply $B-A\in\mathcal L$;
(iii) $A_n\in\mathcal L$ and $A_n\uparrow A$ imply $A\in\mathcal L$.

A collection that is both is a σ-field. The rays $\{(-\infty,x]:x\in\R\}$ form a π-system that generates the Borel sets.`,
      idea: String.raw`The two notions split the σ-field axioms into a part that is easy to check for a generating class (intersections of rays, of rectangles, of finite-dimensional cylinders) and a part that is easy to check for a class defined by an identity, like $\{A:P(A\cap F)=P(A)P(F)\}$. Differences and increasing limits pass through such identities by additivity and continuity of $P$; intersections do not. A λ-system closed under intersection is a σ-field, because $A\cup B=\Omega-\bigl((\Omega-A)\cap(\Omega-B)\bigr)$ and a countable union is an increasing limit of finite ones.`,
      caption: String.raw`Left: the 16 subsets of $\Omega=\{1,2,3,4\}$, ordered by inclusion. Click sets to put them in or out of the collection (filled). The readout tests both definitions and draws a red ring around a missing set that witnesses a failure. On a finite $\Omega$, axiom (iii) holds automatically. The even-size sets form a λ-system that is not a π-system. Right: drag $x$ and $y$; $(-\infty,x]\cap(-\infty,y]=(-\infty,x\wedge y]$ is again a ray, but $(-\infty,y]-(-\infty,x]$ is not.`,
      deps: ['prob-1.1.1a'],
      tags: ['sigma-fields'],
      viz(v) {
        const PRE = {
          rays: { label: 'rays', sets: [1, 3, 7, 15] },
          even: { label: 'even sizes', sets: [0, 3, 5, 6, 9, 10, 12, 15] },
          sig: { label: '$\\sigma(\\{1,2\\})$', sets: [0, 3, 12, 15] },
          sing: { label: 'singletons', sets: [1, 2, 4, 8] },
        };
        const lay = hasseLayout(4);
        let C = new Set(PRE.even.sets);
        const pre = v.select('preset', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'even', { onChange: (k) => { C = new Set(PRE[k].sets); } });
        const H = v.stage({ x: [-0.03, 1.03], y: [-0.12, 1.12], height: 340, weight: 1.8, axes: false, title: 'subsets of $\\{1,2,3,4\\}$ — click to edit the collection' });
        const Rr = v.stage({ x: [-3, 3], y: [0, 1], height: 340, axes: 'box', gutter: true, yticks: [], xlabel: '$t$', title: 'rays on $\\R$' });
        H.onClick((x, y) => { const m = hitHasse(H, lay, x, y); if (m < 0) return; if (C.has(m)) C.delete(m); else C.add(m); v.invalidate(); });
        const hx = Rr.handle(1.2, 0.78, { color: 'accent', label: 'x', constrain: (x) => [clampN(x, -2.8, 2.8), 0.78] });
        const hy = Rr.handle(-0.6, 0.55, { color: 'orange', label: 'y', constrain: (x) => [clampN(x, -2.8, 2.8), 0.55] });
        let st = null;
        v.render(() => {
          const pv = piViolation(C), lv = lambdaViolation(C, 15);
          const miss = new Map();
          if (pv) miss.set(pv[0] & pv[1], 'red');
          if (lv && lv.omega) miss.set(15, 'red'); else if (lv) miss.set(lv.B & ~lv.A, 'red');
          const witness = new Set(pv ? [pv[0], pv[1]] : lv && !lv.omega ? [lv.A, lv.B] : []);
          drawHasse(v, H, lay, { fill: (m) => (C.has(m) ? (witness.has(m) ? 'orange' : 'accent') : null), ring: (m) => (miss.has(m) ? ['red', true] : null) });
          // rays
          const x = hx.x, y = hy.x, m = Math.min(x, y);
          const ray = (b, h, col, w = 7) => { Rr.line(-3, h, b, h, { color: col, width: w, alpha: 0.75 }); Rr.dot(b, h, { r: 4.5, color: col }); };
          ray(x, 0.78, 'accent'); ray(y, 0.55, 'orange'); ray(m, 0.3, 'green');
          if (y > x) { Rr.line(x, 0.1, y, 0.1, { color: 'red', width: 7, alpha: 0.75 }); Rr.dot(x, 0.1, { r: 4.5, hollow: true, color: 'red' }); Rr.dot(y, 0.1, { r: 4.5, color: 'red' }); }
          Rr.text('(−∞, x]', -2.9, 0.86, { size: 11.5, color: 'accent' }); Rr.text('(−∞, y]', -2.9, 0.63, { size: 11.5, color: 'orange' }); Rr.text('(−∞, x∧y] = intersection', -2.9, 0.38, { size: 11.5, color: 'green' });
          if (y > x) Rr.text('(x, y] = difference: not a ray', -2.9, 0.18, { size: 11.5, color: 'red' });
          st = { pv, lv, n: C.size };
          v.legend([['accent', 'in the collection', { dot: true }], ['orange', 'witness of a failure', { dot: true }], ['red', 'missing set', { dot: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const nm = (m) => `\\{${setName(m, 4, false) === '∅' ? '' : setName(m, 4, false).split('').join(',')}\\}`;
          const piT = st.pv ? `not a π-system: $${nm(st.pv[0])}\\cap${nm(st.pv[1])}=${nm(st.pv[0] & st.pv[1])}$ is missing` : 'a **π-system**';
          const laT = !st.lv ? 'a **λ-system**' : st.lv.omega ? 'not a λ-system: $\\Omega$ is missing' : `not a λ-system: $${nm(st.lv.B)}-${nm(st.lv.A)}=${nm(st.lv.B & ~st.lv.A)}$ is missing`;
          return `${st.n} sets: ${piT}; ${laT}.` + (!st.pv && !st.lv ? ' Both, so it is a σ-field.' : '');
        });
      },
    },
    {
      num: '2.1.6',
      kind: 'Theorem',
      name: 'Dynkin’s π–λ theorem',
      credit: 'Dynkin, 1959',
      statement: String.raw`If $\mathcal P$ is a π-system and $\mathcal L$ is a λ-system with $\mathcal P\subset\mathcal L$, then $\sigma(\mathcal P)\subset\mathcal L$. Equivalently, the smallest λ-system containing a π-system is the σ-field it generates.`,
      idea: String.raw`Let $\ell(\mathcal P)$ be the smallest λ-system containing $\mathcal P$. It suffices to show $\ell(\mathcal P)$ is closed under intersection, since a λ-system that is a π-system is a σ-field. Fix $A$ and look at $\{B:A\cap B\in\ell(\mathcal P)\}$, which is a λ-system. Taking $A\in\mathcal P$ first and then $A\in\ell(\mathcal P)$ upgrades closure step by step (Section A.1). The π-hypothesis cannot be dropped: λ-operations alone never manufacture an intersection.`,
      caption: String.raw`Choose a starting collection $\mathcal P$ (gold rings), or click sets to edit it. Slide the number of rounds: each round adds $\Omega$ and every difference $B-A$ with $A\subset B$ already present (filled). Dashed green rings mark sets of $\sigma(\mathcal P)$ not reached yet. For a π-system the closure fills $\sigma(\mathcal P)$ exactly. For $\{\{1,2\},\{2,3\}\}$, which is not a π-system, it stops at 6 of the 16 sets: $\{2\}=\{1,2\}\cap\{2,3\}$ is never produced.`,
      deps: ['prob-2.1.5a'],
      see: ['prob-10.1.4', 'rca-8.3'],
      tags: ['sigma-fields'],
      viz(v) {
        const PRE = {
          a: { label: '$\\{12\\},\\{123\\}$', sets: [3, 7] },
          chain: { label: '$\\{1\\},\\{12\\},\\{123\\}$', sets: [1, 3, 7] },
          bad: { label: '$\\{12\\},\\{23\\}$ (not π)', sets: [3, 6] },
          b: { label: '$\\{12\\},\\{2\\},\\{23\\}$', sets: [3, 2, 6] },
        };
        const lay = hasseLayout(4);
        let P = new Set(PRE.bad.sets);
        const pre = v.select('start $\\mathcal P$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'bad', { onChange: (k) => { P = new Set(PRE[k].sets); } });
        const k = v.slider('rounds of λ-operations', 0, 4, 4, { int: true });
        const H = v.stage({ x: [-0.03, 1.03], y: [-0.12, 1.12], height: 360, axes: false, title: 'λ-closure of $\\mathcal P$ (filled) inside $\\sigma(\\mathcal P)$ (rings)' });
        H.onClick((x, y) => { const m = hitHasse(H, lay, x, y); if (m < 0 || m === 0 || m === 15) return; if (P.has(m)) P.delete(m); else P.add(m); v.invalidate(); });
        let st = null;
        v.render(() => {
          const rounds = lambdaRounds(P, 15), cur = rounds[Math.min(k.value, rounds.length - 1)], fin = rounds[rounds.length - 1];
          const sig = sigmaGen([...P], 4);
          drawHasse(v, H, lay, {
            fill: (m) => (cur.has(m) ? (P.has(m) ? 'gold' : 'accent') : null),
            ring: (m) => (P.has(m) ? ['gold', false] : sig.has(m) && !cur.has(m) ? ['green', true] : null),
          });
          st = { cur: cur.size, fin: fin.size, sig: sig.size, nr: rounds.length - 1, pi: !piViolation(P), k: Math.min(k.value, rounds.length - 1) };
          v.legend([['gold', '$\\mathcal P$', { dot: true }], ['accent', 'added by λ-operations', { dot: true }], ['green', 'in $\\sigma(\\mathcal P)$, not yet reached', { dash: true }]]);
        });
        v.readout(() => st && `After ${k.value} round(s): ${st.cur} sets; the λ-closure stabilises at **${st.fin}** sets after ${st.nr} round(s), while $\\sigma(\\mathcal P)$ has **${st.sig}**. $\\mathcal P$ is ${st.pi ? 'a π-system, so the theorem forces equality' : 'not a π-system, so nothing forces equality'}` + (st.fin === st.sig ? ' — and the two agree.' : ' — and the closure falls short.'));
      },
    },
    {
      num: '2.1.7',
      kind: 'Theorem',
      name: 'Independent π-systems generate independent σ-fields',
      statement: String.raw`Suppose $\mathcal A_1,\dots,\mathcal A_n$ are independent collections of events and each $\mathcal A_i$ is a π-system. Then $\sigma(\mathcal A_1),\dots,\sigma(\mathcal A_n)$ are independent.`,
      idea: String.raw`Fix $A_2\in\mathcal A_2,\dots,A_n\in\mathcal A_n$ with intersection $F$. The sets $A$ with $P(A\cap F)=P(A)P(F)$ form a λ-system: differences and increasing limits pass through the identity by Theorem 1.1.1. That λ-system contains the π-system $\mathcal A_1$, so by the π–λ theorem it contains $\sigma(\mathcal A_1)$. Lemma 2.1.5 then shows $\sigma(\mathcal A_1),\mathcal A_2,\dots,\mathcal A_n$ are independent. Repeating the argument for each index in turn finishes the proof.`,
      caption: String.raw`$X$ and $Y$ take values $1,\dots,5$. The left panel shows the joint law (dot area $\propto$ probability); the tilt $\tau$ changes it without changing either marginal. The table lists $P(X\le x,Y\le y)-P(X\le x)P(Y\le y)$ for all 36 rays ($\infty$ included), in thousandths. Drag the gold corner to pick a ray pair. "Random Borel events" draws random sets $C,D$, which are not rays, and outlines $C\times D$. The readout runs the check over **all** $32\times32$ events of $\sigma(X)\times\sigma(Y)$. It vanishes exactly when the ray table does.`,
      deps: ['prob-2.1.6', 'prob-2.1.5', 'prob-1.1.1'],
      tags: ['independence', 'sigma-fields'],
      viz(v) {
        const px = [0.1, 0.25, 0.3, 0.2, 0.15], py = [0.3, 0.1, 0.2, 0.25, 0.15], a = [1, -1, 0, -1, 1], b = [-1, 1, 1, -1, 0];
        let smax = Infinity; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (a[i] * b[j]) smax = Math.min(smax, px[i] * py[j]);
        const tau = v.slider('tilt $\\tau$', -1, 1, 0.6, { step: 0.02 });
        let ev = null, seed = 0;
        v.button('Random Borel events', () => { const r = v.rng(++seed * 97 + 5); const rnd = () => { let m = 0; while (!m || m === 31) m = Math.floor(r() * 32); return m; }; ev = [rnd(), rnd()]; });
        const L = v.stage({ x: [0.5, 5.5], y: [0.5, 5.5], equal: true, height: 330, axes: 'box', gutter: true, xticks: [1, 2, 3, 4, 5], yticks: [1, 2, 3, 4, 5], xlabel: '$X$', ylabel: '$Y$', title: 'joint law; ray $\\{X\\le x\\}\\cap\\{Y\\le y\\}$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.1, title: '$1000\\,[F(x,y)-F_X(x)F_Y(y)]$ on rays' });
        const T = v.table(R, { rows: 6, cols: 6, maxCell: 40, size: 12, rowLabels: (i) => (i < 5 ? `x=${i + 1}` : 'x=∞'), colLabels: (j) => (j < 5 ? `y=${j + 1}` : '∞'), format: 0 });
        const hc = L.handle(3.5, 2.5, { color: 'gold', constrain: (x, y) => [clampN(Math.round(x - 0.5) + 0.5, 1.5, 5.5), clampN(Math.round(y - 0.5) + 0.5, 1.5, 5.5)] });
        let st = null;
        v.render(() => {
          const t = tau.value * smax, P = px.map((p, i) => py.map((q, j) => p * q + t * a[i] * b[j]));
          const xr = Math.round(hc.x - 0.5), yr = Math.round(hc.y - 0.5); // ray cut: values ≤ xr
          L.rect(0.5, 0.5, xr + 0.5, yr + 0.5, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1.5, dash: [5, 4] });
          if (ev) for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((ev[0] >> i) & 1 && (ev[1] >> j) & 1) L.rect(i + 0.55, j + 0.55, i + 1.45, j + 1.45, { color: 'purple', width: 2, radius: 4 });
          for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
            const dev = P[i][j] - px[i] * py[j];
            L.dot(i + 1, j + 1, { r: 3 + 40 * Math.sqrt(P[i][j]) / 2, color: Math.abs(dev) < 1e-12 ? 'accent' : dev > 0 ? 'red' : 'blue', alpha: 0.75 });
          }
          const cdf = (x, y) => { let s = 0; for (let i = 0; i < Math.min(x, 5); i++) for (let j = 0; j < Math.min(y, 5); j++) s += P[i][j]; return s; };
          const Fx = (x) => px.slice(0, x).reduce((u, w) => u + w, 0), Fy = (y) => py.slice(0, y).reduce((u, w) => u + w, 0);
          const D = (i, j) => 1000 * (cdf(i + 1, j + 1) - Fx(i + 1) * Fy(j + 1));
          const sel = [Math.min(xr, 5) - 1, Math.min(yr, 5) - 1];
          T.draw({ value: (i, j) => Math.round(D(i, j)) || 0, fill: (i, j) => v.diverge(clampN(D(i, j) / 25, -1, 1), 'blue', 'red'), highlight: sel[0] >= 0 && sel[1] >= 0 ? [[sel[0], sel[1], 'gold']] : [] });
          // exhaustive check over σ(X) × σ(Y)
          let mx = 0; for (let C = 0; C < 32; C++) for (let Dm = 0; Dm < 32; Dm++) { let pc = 0, pd = 0, pcd = 0; for (let i = 0; i < 5; i++) { if ((C >> i) & 1) pc += px[i]; if ((Dm >> i) & 1) pd += py[i]; } for (let i = 0; i < 5; i++) if ((C >> i) & 1) for (let j = 0; j < 5; j++) if ((Dm >> j) & 1) pcd += P[i][j]; mx = Math.max(mx, Math.abs(pcd - pc * pd)); }
          let rmx = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) rmx = Math.max(rmx, Math.abs(D(i, j)) / 1000);
          let evd = null; if (ev) { let pc = 0, pd = 0, pcd = 0; for (let i = 0; i < 5; i++) { if ((ev[0] >> i) & 1) pc += px[i]; if ((ev[1] >> i) & 1) pd += py[i]; for (let j = 0; j < 5; j++) if ((ev[0] >> i) & 1 && (ev[1] >> j) & 1) pcd += P[i][j]; } evd = { C: ev[0], D: ev[1], g: pcd - pc * pd }; }
          st = { mx, rmx, evd, ray: D(sel[0], sel[1]) / 1000 };
          v.legend([['red', 'cell above product', { dot: true }], ['blue', 'below', { dot: true }], ['accent', 'equal', { dot: true }], ['purple', 'random $C\\times D$']]);
        });
        const set = (m) => `\\{${[1, 2, 3, 4, 5].filter((k) => (m >> (k - 1)) & 1).join(',')}\\}`;
        v.readout(() => st && `Largest ray gap: $${fr(st.rmx, 4)}$; largest gap over all $32\\times32$ pairs from $\\sigma(X)\\times\\sigma(Y)$: $${fr(st.mx, 4)}$.` + (st.evd ? ` Random events $C=${set(st.evd.C)}$, $D=${set(st.evd.D)}$: gap $${fr(st.evd.g, 4)}$.` : '') + (st.rmx < 1e-12 ? ' Rays pass, so everything passes.' : ''));
      },
    },
    {
      num: '2.1.8',
      kind: 'Theorem',
      name: 'Independence from the joint distribution function',
      statement: String.raw`Random variables $X_1,\dots,X_n$ are independent as soon as
$$P(X_1\le x_1,\dots,X_n\le x_n)=\prod_{i=1}^nP(X_i\le x_i)\qquad\text{for all } x_1,\dots,x_n\in(-\infty,\infty].$$
That is, the joint distribution function factors into the product of the marginal ones.`,
      idea: String.raw`For each $i$ the sets $\{X_i\le x\}$ with $x\in(-\infty,\infty]$ form a π-system, since $\{X_i\le x\}\cap\{X_i\le y\}=\{X_i\le x\wedge y\}$. Allowing $x=\infty$ puts $\Omega$ in it. It generates $\sigma(X_i)$. So the hypothesis says these π-systems are independent in the sense of Lemma 2.1.5, and Theorem 2.1.7 upgrades this to independence of $\sigma(X_1),\dots,\sigma(X_n)$.`,
      caption: String.raw`Left: the joint distribution function $F(x,y)$ as a surface, with the product $F_X(x)F_Y(y)$ as an orange wire mesh; drag to rotate. Right: the difference $F-F_XF_Y$ as a heat map. Drag the gold point to read it anywhere. Both marginals are standard normal. With the Gaussian copula and $\rho=0$ the surfaces coincide and the map is blank. Move $\rho$ and they separate. The second law, $Y=\pm X$ with a fair random sign, has $\operatorname{corr}(X,Y)=0$, yet its distribution function still differs from the product.`,
      deps: ['prob-2.1.7'],
      tags: ['independence'],
      viz(v) {
        const M = v.M, Phi = (z) => PhiN(M, z);
        const law = v.select('law', [{ value: 'g', label: 'Gaussian, correlation $\\rho$' }, { value: 'pm', label: '$Y=\\pm X$ (uncorrelated)' }], 'g');
        const rho = v.slider('$\\rho$', -0.95, 0.95, 0.6, { step: 0.05 });
        const S3 = v.stage3d({ range: 1.9, height: 340, yaw: -0.7, pitch: 0.45, labels: ['x', 'y', 'F'], title: '$F(x,y)$ and $F_X(x)F_Y(y)$ (wire)' });
        const H = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: '$F(x,y)-F_X(x)F_Y(y)$' });
        const hp = H.handle(0.5, -0.3, { color: 'gold', constrain: (x, y) => [clampN(x, -2.9, 2.9), clampN(y, -2.9, 2.9)] });
        const N = 31, xs = Array.from({ length: N }, (_, i) => -3 + (6 * i) / (N - 1));
        let cache = null, st = null;
        const Fg = (x, y, r) => { if (Math.abs(r) < 1e-9) return Phi(x) * Phi(y); const q = Math.sqrt(1 - r * r); return simpson((s) => PHI(s) * Phi((y - r * s) / q), -8, x, 120); };
        const Fpm = (x, y) => 0.5 * Phi(Math.min(x, y)) + 0.5 * Math.max(0, Phi(x) - Phi(-y));
        v.render(() => {
          const key = law.value === 'g' ? `g${rho.value}` : 'pm';
          rho.el.hidden = law.value !== 'g';
          if (!cache || cache.key !== key) {
            const F = (x, y) => (law.value === 'g' ? Fg(x, y, rho.value) : Fpm(x, y));
            cache = { key, G: xs.map((x) => xs.map((y) => F(x, y))), F };
          }
          const G = cache.G, look = (x, y) => { const u = clampN(((x + 3) / 6) * (N - 1), 0, N - 1.0001), w = clampN(((y + 3) / 6) * (N - 1), 0, N - 1.0001), i = Math.floor(u), j = Math.floor(w), fu = u - i, fw = w - j; return (1 - fu) * ((1 - fw) * G[i][j] + fw * G[i][j + 1]) + fu * ((1 - fw) * G[i + 1][j] + fw * G[i + 1][j + 1]); };
          const sc = 0.5;
          S3.surface((u, w) => [u * sc, w * sc, 1.6 * look(u, w)], [-3, 3], [-3, 3], { n: 26, alpha: 0.82, colorFn: (u, w, p) => v.mix('blue', 'green', p[2] / 1.6) });
          for (let k = 0; k <= 12; k++) {
            const t = -3 + k / 2;
            S3.path(xs.map((y) => [t * sc, y * sc, 1.6 * Phi(t) * Phi(y)]), { color: 'orange', width: 1.2 });
            S3.path(xs.map((x) => [x * sc, t * sc, 1.6 * Phi(x) * Phi(t)]), { color: 'orange', width: 1.2 });
          }
          let dm = 0; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) dm = Math.max(dm, Math.abs(G[i][j] - Phi(xs[i]) * Phi(xs[j])));
          const scl = Math.max(0.02, dm);
          H.raster((x, y) => v.diverge(clampN((look(x, y) - Phi(x) * Phi(y)) / scl, -1, 1), 'blue', 'red'), { key: key + '|h', res: 3 });
          H.contour((x, y) => look(x, y) - Phi(x) * Phi(y), [-0.1, -0.05, 0.05, 0.1], { color: 'ink', width: 1, alpha: 0.5 });
          const x = hp.x, y = hp.y, Fv = cache.F(x, y), Pv = Phi(x) * Phi(y);
          H.dot(x, y, { r: 4, color: 'gold' });
          st = { x, y, Fv, Pv, dm };
          v.legend([['blue', '$F<F_XF_Y$', { area: true }], ['red', '$F>F_XF_Y$', { area: true }], ['orange', 'product surface']]);
        });
        v.readout(() => st && `At $(x,y)=(${fr(st.x, 2)},${fr(st.y, 2)})$: $F=${fr(st.Fv, 4)}$, $F_X F_Y=${fr(st.Pv, 4)}$. Largest gap on the grid: $${fr(st.dm, 4)}$` + (st.dm < 1e-9 ? ': $F$ factors, so $X,Y$ are independent.' : ': $F$ does not factor.'));
      },
    },
    {
      num: '2.1.9',
      kind: 'Theorem',
      name: 'Grouping independent σ-fields preserves independence',
      statement: String.raw`Let $\mathcal F_{i,j}$, $1\le i\le n$, $1\le j\le m(i)$, be independent σ-fields, and let $\mathcal G_i=\sigma\bigl(\bigcup_j\mathcal F_{i,j}\bigr)$ be the σ-field generated by the $i$-th block. Then $\mathcal G_1,\dots,\mathcal G_n$ are independent.`,
      idea: String.raw`Let $\mathcal A_i$ be the sets $\bigcap_jA_{i,j}$ with $A_{i,j}\in\mathcal F_{i,j}$. Each $\mathcal A_i$ is a π-system, contains $\Omega$ and every $\mathcal F_{i,j}$, and generates $\mathcal G_i$. Independence of all the $\mathcal F_{i,j}$ says exactly that $\mathcal A_1,\dots,\mathcal A_n$ are independent, so Theorem 2.1.7 applies. Events that need a whole block, like "the block's coins are all heads", are not in any single $\mathcal F_{i,j}$, and that is why the π-λ step is needed.`,
      caption: String.raw`Six coins with $P(\text{heads})=p$, split into blocks. Each block defines one event, chosen by the selector: all heads, an odd number of heads, or at least one head. That event uses the whole block, so it lies in $\mathcal G_i$ but in no single $\sigma(X_j)$. Top: 18 seeded draws; a block is shaded green when its event occurs. Right: the exact product checks. "Link coins 3 and 4" makes coin 4 copy coin 3 with probability $0.7$. With the link inside a block every check still passes. Across blocks, the checks fail.`,
      deps: ['prob-2.1.7'],
      tags: ['independence'],
      viz(v) {
        const GR = { a: { label: '12 | 34 | 56', b: [[0, 1], [2, 3], [4, 5]] }, b: { label: '123 | 456', b: [[0, 1, 2], [3, 4, 5]] }, c: { label: '1 | 2345 | 6', b: [[0], [1, 2, 3, 4], [5]] }, d: { label: '13 | 245 | 6', b: [[0, 2], [1, 3, 4], [5]] } };
        const EV = { all: { label: 'all heads', f: (k, n) => k === n }, odd: { label: 'odd # heads', f: (k) => k % 2 === 1 }, one: { label: '≥ 1 head', f: (k) => k > 0 } };
        const gr = v.select('blocks', Object.entries(GR).map(([value, o]) => ({ value, label: o.label })), 'a');
        const evs = v.select('event per block', Object.entries(EV).map(([value, o]) => ({ value, label: o.label })), 'all');
        const pS = v.slider('$p$', 0.1, 0.9, 0.5, { step: 0.01 });
        const link = v.toggle('link coins 3 and 4', true);
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 7], y: [0, 20.2], height: 360, axes: false, title: 'coins in blocks, and 18 seeded draws' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1.05, title: 'product checks (exact)' });
        const T = v.table(R, { rows: 4, cols: 3, square: false, cellAspect: 1.7, maxCell: 44, size: 12.5, colLabels: ['P(∩)', '∏ P', ''] });
        const BC = ['accent', 'orange', 'purple'];
        let st = null;
        v.render(() => {
          const blocks = GR[gr.value].b, ef = EV[evs.value].f, p = pS.value, lam = 0.7;
          const prob = (w) => { let P = 1; for (let i = 0; i < 6; i++) { const x = (w >> i) & 1; if (i === 3 && link.value) { const x3 = (w >> 2) & 1; P *= lam * (x === x3 ? 1 : 0) + (1 - lam) * (x ? p : 1 - p); } else P *= x ? p : 1 - p; } return P; };
          const E = (w, b) => ef(b.reduce((k, i) => k + ((w >> i) & 1), 0), b.length);
          const PE = (set) => { let s = 0; for (let w = 0; w < 64; w++) if (set.every((b) => E(w, blocks[b]))) s += prob(w); return s; };
          const combos = blocks.length === 3 ? [[0, 1], [0, 2], [1, 2], [0, 1, 2]] : [[0, 1]];
          const res = combos.map((cb) => { const pi = PE(cb), pp = cb.reduce((acc, b) => acc * PE([b]), 1); return { cb, pi, pp, ok: Math.abs(pi - pp) < 1e-10 }; });
          const bi = (i) => blocks.findIndex((b) => b.includes(i));
          // coins and blocks
          blocks.forEach((b, k) => { const x0 = Math.min(...b) + 0.55, x1 = Math.max(...b) + 1.45; L.rect(x0, 18.3, x1, 19.8, { fill: BC[k], fillAlpha: 0.15, color: BC[k], width: 1.5, radius: 8 }); });
          for (let i = 0; i < 6; i++) { L.dot(i + 1, 19.05, { r: 10, color: BC[bi(i)], alpha: 0.85 }); L.text(String(i + 1), i + 1, 19.05, { align: 'center', size: 12, color: 'panel', halo: false, weight: 700 }); }
          if (link.value) { L.curve((t) => [3 + t, 18.75 - 0.75 * Math.sin(Math.PI * t)], 0, 1, { color: 'red', width: 2.4 }); L.text('link', 3.5, 17.65, { align: 'center', size: 10.5, color: 'red' }); }
          // seeded draws (exact sampling from the 64-point law)
          const r = v.rng(seed * 13 + 1), cum = []; let s = 0; for (let w = 0; w < 64; w++) cum.push((s += prob(w)));
          for (let row = 0; row < 18; row++) {
            const u = r() * s; let w = 0; while (w < 63 && cum[w] < u) w++;
            const y = 16.6 - row * 0.92;
            blocks.forEach((b) => { if (E(w, b)) L.rect(Math.min(...b) + 0.55, y - 0.42, Math.max(...b) + 1.45, y + 0.42, { fill: 'green', fillAlpha: 0.22, stroke: false, radius: 3 }); });
            for (let i = 0; i < 6; i++) { const hd = (w >> i) & 1; L.rect(i + 0.75, y - 0.3, i + 1.25, y + 0.3, { fill: hd ? 'gold' : 'panel', fillAlpha: hd ? 0.9 : 1, color: hd ? 'gold' : 'faint', width: 1, radius: 2 }); }
          }
          const nm = (cb) => cb.map((b) => `E${b + 1}`).join('∩');
          T.draw({ rows: res.length, rowLabels: res.map((x) => nm(x.cb)), value: (i, j) => (j === 0 ? fr(res[i].pi, 4) : j === 1 ? fr(res[i].pp, 4) : res[i].ok ? '✓' : '✗'), fill: (i, j) => (j === 2 ? (res[i].ok ? ['green', 0.3] : ['red', 0.35]) : null) });
          const cross = link.value && bi(2) !== bi(3);
          st = { ok: res.every((x) => x.ok), cross, link: link.value };
          v.legend([['gold', 'heads', { area: true }], ['green', 'block event occurs', { area: true }]]);
        });
        v.readout(() => st && (st.ok ? `All product checks pass: the block events are independent` + (!st.link ? '.' : st.cross ? ', although the link crosses blocks: for this event and $p$ the dependence happens to cancel. Try another event or $p$.' : ' (the link stays inside one block, so the block σ-fields $\\mathcal G_i$ are still independent).') : `A check fails: the link joins coins in **different** blocks, so the six coins are no longer independent and Theorem 2.1.9 does not apply.`));
      },
    },
  ],
};
