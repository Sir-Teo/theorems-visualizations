// Probability: Theory and Examples (Durrett) — Chapter 2: Laws of Large Numbers. Part A: §2.1 Independence
import { clampN, cornerIn, simpson, PHI, PhiN, sampleExp, runningMeans, logInts, convolveGrid, densityOn, linEdges, popcount, setName, hasseLayout, piViolation, lambdaViolation, lambdaRounds, sigmaGen } from './ch02.shared.js';

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
            L.dot(i + 1, j + 1, { r: 3 + 40 * Math.sqrt(P[i][j]) / 2, color: Math.abs(dev) < 1e-12 ? 'green' : dev > 0 ? 'red' : 'blue', alpha: 0.75 });
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
          v.legend([['red', 'cell above product', { dot: true }], ['blue', 'below', { dot: true }], ['green', 'equal', { dot: true }], ['purple', 'random $C\\times D$']]);
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
    {
      num: '2.1.10',
      kind: 'Theorem',
      name: 'Functions of disjoint blocks are independent',
      statement: String.raw`Let $X_{i,j}$, $1\le i\le n$, $1\le j\le m(i)$, be independent random variables and let $f_i:\R^{m(i)}\to\R$ be measurable. Then the variables
$$Y_i=f_i(X_{i,1},\dots,X_{i,m(i)}),\qquad 1\le i\le n,$$
are independent. For example, if $X_1,\dots,X_n$ are independent then $X_1$ and $X_2\cdots X_n$ are independent, and $S_n-S_m$ is independent of every event determined by $X_1,\dots,X_m$.`,
      idea: String.raw`Put $\mathcal F_{i,j}=\sigma(X_{i,j})$ and $\mathcal G_i=\sigma\bigl(\bigcup_j\mathcal F_{i,j}\bigr)$. Each $Y_i$ is $\mathcal G_i$-measurable, and Theorem 2.1.9 makes the $\mathcal G_i$ independent. Variables measurable with respect to independent σ-fields are independent (the $n$-variable form of Theorem 2.1.1(ii)). Disjointness of the blocks is essential: a shared coordinate links the two functions, sometimes in a way that correlation cannot detect.`,
      caption: String.raw`Four independent uniforms on $(0,1)$. Left: $2000$ seeded pairs $\bigl(f(X_1,X_2),g(\cdot,\cdot)\bigr)$. Right: the histogram of $g$ given that $f$ lies in its lowest third (teal) and in its highest third (orange). For disjoint blocks the two conditional histograms agree up to noise: the value of $f$ tells nothing about $g$. Let $g$ share $X_2$, or both coordinates, and they separate. With $f=X_1+X_2$, $g=X_1-X_2$ ("share both") the correlation is $0$, yet the cloud is a diamond and the conditional laws are plainly different.`,
      deps: ['prob-2.1.9', 'prob-1.3.5'],
      tags: ['independence'],
      viz(v) {
        const M = v.M;
        const FF = { sum: { label: '$X_1+X_2$', f: (a, b) => a + b, r: [0, 2] }, max: { label: '$\\max(X_1,X_2)$', f: Math.max, r: [0, 1] }, prod: { label: '$X_1X_2$', f: (a, b) => a * b, r: [0, 1] } };
        const GG = { diff: { label: '$X_3-X_4$', f: (a, b) => a - b, r: [-1, 1] }, min: { label: '$\\min(X_3,X_4)$', f: Math.min, r: [0, 1] }, dist: { label: '$|X_3-X_4|$', f: (a, b) => Math.abs(a - b), r: [0, 1] } };
        const fs = v.select('$f=$', Object.entries(FF).map(([value, o]) => ({ value, label: o.label })), 'sum');
        const gs = v.select('$g=$', Object.entries(GG).map(([value, o]) => ({ value, label: o.label })), 'diff');
        const sh = v.select('$g$ reads', [{ value: 0, label: '$X_3,X_4$ (disjoint)' }, { value: 1, label: '$X_2,X_4$' }, { value: 2, label: '$X_1,X_2$' }], 0);
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 2], y: [-1, 1], height: 320, axes: 'box', gutter: true, xlabel: '$f$', ylabel: '$g$', title: 'pairs $(f,g)$' });
        const R = v.stage({ x: [-1, 1], y: [0, 2], height: 320, axes: 'box', gutter: true, xlabel: '$g$', title: 'law of $g$ given $f$ low / high' });
        let cache = null, st = null;
        v.render(() => {
          const N = 2000;
          if (!cache || cache.seed !== seed) { const r = v.rng(seed * 101 + 9); cache = { seed, U: Array.from({ length: N }, () => [r(), r(), r(), r()]) }; }
          const F = FF[fs.value], G = GG[gs.value], mode = +sh.value;
          const pts = cache.U.map((u) => { const fv = F.f(u[0], u[1]); const gv = mode === 0 ? G.f(u[2], u[3]) : mode === 1 ? G.f(u[1], u[3]) : G.f(u[0], u[1]); return [fv, gv]; });
          L.setView(F.r, G.r); R.setView(G.r, null);
          const fsrt = pts.map((p) => p[0]).sort((a, b) => a - b), q1 = fsrt[Math.floor(N / 3)], q2 = fsrt[Math.floor((2 * N) / 3)];
          L.vband(F.r[0], q1, { color: 'teal', alpha: 0.1 }); L.vband(q2, F.r[1], { color: 'orange', alpha: 0.1 });
          L.dots(pts, { r: 1.6, color: 'accent', alpha: 0.45 });
          const lo = pts.filter((p) => p[0] <= q1).map((p) => p[1]), hi = pts.filter((p) => p[0] >= q2).map((p) => p[1]);
          const E = linEdges(G.r[0], G.r[1], 16), Hl = densityOn(lo, E), Hh = densityOn(hi, E);
          const ym = Math.max(...Hl.density, ...Hh.density) * 1.2; R.setView(null, [0, ym]);
          R.hist(Hl, { density: true, color: 'teal', fillAlpha: 0.25 }); R.hist(Hh, { density: true, color: 'orange', fillAlpha: 0.2 });
          // two-sample Kolmogorov–Smirnov distance
          const a = lo.slice().sort((x, y) => x - y), b = hi.slice().sort((x, y) => x - y); let i = 0, j = 0, D = 0;
          while (i < a.length && j < b.length) { if (a[i] <= b[j]) i++; else j++; D = Math.max(D, Math.abs(i / a.length - j / b.length)); }
          const crit = 1.36 * Math.sqrt((a.length + b.length) / (a.length * b.length));
          st = { r: M.linreg(pts.map((p) => p[0]), pts.map((p) => p[1])).r, D, crit, mode };
          v.legend([['accent', 'pairs', { dot: true }], ['teal', '$g$ given $f$ in lowest third', { area: true }], ['orange', '$g$ given $f$ in highest third', { area: true }]]);
        });
        v.readout(() => st && `Sample correlation $${fr(st.r, 3)}$. Distance between the two conditional laws (Kolmogorov–Smirnov) $D=${fr(st.D, 3)}$; noise alone exceeds $${fr(st.crit, 3)}$ only $5\\%$ of the time.` + (st.D > st.crit ? ' **Dependent**' + (Math.abs(st.r) < 0.05 ? ', even though uncorrelated.' : '.') : ' Consistent with independence.'));
      },
    },
    {
      num: '2.1.11',
      kind: 'Theorem',
      name: 'Independence means the joint law is a product measure',
      statement: String.raw`If $X_1,\dots,X_n$ are independent and $X_i$ has distribution $\mu_i$, then the random vector $(X_1,\dots,X_n)$ has distribution $\mu_1\times\dots\times\mu_n$. Conversely, a vector whose law is a product measure has independent coordinates.`,
      idea: String.raw`On a box, $P\bigl((X_1,\dots,X_n)\in A_1\times\dots\times A_n\bigr)=\prod_iP(X_i\in A_i)=\prod_i\mu_i(A_i)$, which is the product measure of the box. Boxes form a π-system generating $\mathcal R^n$, so the π–λ theorem (Theorem 2.1.6) forces two probability measures that agree on boxes to agree everywhere. The converse reads the same identity backwards.`,
      caption: String.raw`Seeded samples of $(X,Y)$ binned on a $12\times12$ grid. Left: the joint histogram. Middle: the outer product of the two marginal histograms, which is what the product measure predicts. Right: standardized residuals $(\text{observed}-\text{expected})/\sqrt{\text{expected}}$. For the independent pair the residuals are pure noise at every sample size, and the $\chi^2$ statistic stays near its degrees of freedom. With the Gaussian copula, or with $Y=0.8X^2+\text{noise}$ (uncorrelated with $X$), a pattern grows with $n$ and $\chi^2$ explodes.`,
      deps: ['prob-2.1.6', 'prob-1.7.1'],
      tags: ['independence', 'product measure'],
      viz(v) {
        const M = v.M;
        const law = v.select('law', [{ value: 'ind', label: 'independent' }, { value: 'cop', label: 'Gaussian copula $\\rho$' }, { value: 'sq', label: '$Y=0.8X^2+$noise' }], 'sq');
        const rho = v.slider('$\\rho$', -0.9, 0.9, 0.4, { step: 0.05 });
        const nS = v.slider('$n$', 200, 50000, 5000, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const opt = (t) => ({ x: [-3, 3], y: [0, 4.8], height: 290, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: t, minWidth: 220 });
        const A = v.stage(opt('joint histogram')), B = v.stage(opt('product of marginals')), C = v.stage(opt('standardized residual'));
        const K = 12, ex = linEdges(-3, 3, K), ey = linEdges(0, 4.8, K);
        let cache = null, st = null;
        v.render(() => {
          rho.el.hidden = law.value !== 'cop';
          const key = `${law.value}|${rho.value}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 7 + 2), p = rho.value, q = Math.sqrt(1 - p * p), pts = [];
            for (let i = 0; i < 50000; i++) {
              const z1 = r.normal(), z2 = r.normal();
              if (law.value === 'ind') pts.push([z1, sampleExp(r)]);
              else if (law.value === 'cop') pts.push([z1, -Math.log(Math.max(1e-300, 1 - PhiN(M, p * z1 + q * z2)))]);
              else pts.push([z1, 0.8 * z1 * z1 + 0.4 * sampleExp(r)]);
            }
            cache = { key, pts };
          }
          const n = Math.round(nS.value), O = Array.from({ length: K }, () => new Array(K).fill(0)); let tot = 0;
          for (let k = 0; k < n; k++) { const [x, y] = cache.pts[k]; const i = Math.floor(((x + 3) / 6) * K), j = Math.floor((y / 4.8) * K); if (i >= 0 && i < K && j >= 0 && j < K) { O[i][j]++; tot++; } }
          const rs = O.map((row) => row.reduce((a, b) => a + b, 0)), cs = O[0].map((_, j) => O.reduce((a, row) => a + row[j], 0));
          const Ex = (i, j) => (rs[i] * cs[j]) / tot;
          let mx = 0; for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) mx = Math.max(mx, O[i][j], Ex(i, j));
          let chi = 0, df = 0;
          for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
            const e = Ex(i, j), z = e > 0 ? (O[i][j] - e) / Math.sqrt(e) : 0;
            A.rect(ex[i], ey[j], ex[i + 1], ey[j + 1], { fill: v.ramp(Math.sqrt(O[i][j] / mx), 'accent'), fillAlpha: 1, stroke: false });
            B.rect(ex[i], ey[j], ex[i + 1], ey[j + 1], { fill: v.ramp(Math.sqrt(e / mx), 'accent'), fillAlpha: 1, stroke: false });
            if (e > 0) C.rect(ex[i], ey[j], ex[i + 1], ey[j + 1], { fill: v.diverge(clampN(z / 4, -1, 1), 'blue', 'red'), fillAlpha: 1, stroke: false });
            if (e >= 1) { chi += (O[i][j] - e) ** 2 / e; df++; }
          }
          const dof = Math.max(1, (rs.filter((x) => x > 0).length - 1) * (cs.filter((x) => x > 0).length - 1));
          const pval = M.gammaQ(dof / 2, chi / 2);
          st = { chi, dof, pval, tot, n };
          v.legend([['accent', 'counts (darker = more)', { area: true }], ['red', 'more than the product predicts', { area: true }], ['blue', 'fewer', { area: true }]]);
        });
        v.readout(() => st && `$n=${st.n}$ ($${st.tot}$ in the window): $\\chi^2=${fr(st.chi, 1)}$ on $${st.dof}$ degrees of freedom, p-value $${st.pval < 1e-300 ? '<10^{-300}' : st.pval < 1e-4 ? v.sci(st.pval, 2) : fr(st.pval, 3)}$` + (st.pval < 0.01 ? ' — the joint law is **not** the product of its marginals.' : ' — consistent with a product measure.'));
      },
    },
    {
      num: '2.1.12',
      kind: 'Theorem',
      name: 'Expectation of h(X, Y) for independent X, Y',
      statement: String.raw`Let $X$ and $Y$ be independent with distributions $\mu$ and $\nu$. If $h:\R^2\to\R$ is measurable and either $h\ge0$ or $E|h(X,Y)|<\infty$, then
$$Eh(X,Y)=\iint h(x,y)\,\mu(dx)\,\nu(dy).$$
In particular, if $f,g$ are measurable with $f,g\ge0$, or with $E|f(X)|,E|g(Y)|<\infty$, then $E\,f(X)g(Y)=Ef(X)\cdot Eg(Y)$.`,
      idea: String.raw`By Theorem 2.1.11 the law of $(X,Y)$ is $\mu\times\nu$. The change-of-variables formula (Theorem 1.6.9) turns $Eh(X,Y)$ into $\int h\,d(\mu\times\nu)$, and Fubini's theorem (Theorem 1.7.2) evaluates that as an iterated integral, in either order. For $h=f(x)g(y)$ the inner integral is $g(y)\,Ef(X)$, which leaves $Ef(X)\,Eg(Y)$. The integrable case follows by applying the nonnegative case to $|f|$ and $|g|$.`,
      caption: String.raw`$X$ is exponential with mean $1$ and $Y$ is uniform on $(0,2)$. Left: the function $h$ as a heat map, with $300$ seeded pairs. The gold handle picks a horizontal slice $y$. Right: the inner integral $y\mapsto\int h(x,y)\,\mu(dx)$; averaging it over $\nu$ (the shaded area divided by $2$) gives $Eh(X,Y)$. The readout compares both iterated integrals with a Monte Carlo mean of $20000$ pairs. Turn on "dependent": $Y=2(1-e^{-X})$ is still uniform on $(0,2)$, but the Monte Carlo mean moves away from the iterated integral, which knows only the marginals.`,
      deps: ['prob-2.1.11', 'prob-1.7.2', 'prob-1.6.9'],
      tags: ['independence', 'expectation'],
      viz(v) {
        const HS = {
          ind: { label: '$1\\{x+y\\le2\\}$', h: (x, y) => (x + y <= 2 ? 1 : 0) },
          absd: { label: '$|x-y|$', h: (x, y) => Math.abs(x - y) },
          max: { label: '$\\max(x,y)$', h: Math.max },
          cos: { label: '$\\cos(2x+y)$', h: (x, y) => Math.cos(2 * x + y) },
        };
        const hs = v.select('$h=$', Object.entries(HS).map(([value, o]) => ({ value, label: o.label })), 'absd');
        const dep = v.toggle('dependent: $Y=2(1-e^{-X})$', false);
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 5], y: [0, 2], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: '$h(x,y)$ and seeded pairs' });
        const R = v.stage({ x: [0, 2], y: [0, 2], height: 320, axes: 'box', gutter: true, xlabel: '$y$', title: 'inner integral $\\int h(x,y)\\,e^{-x}dx$' });
        const hy = L.handle(4.85, 0.7, { color: 'gold', constrain: (x, y) => [4.85, clampN(y, 0.01, 1.99)] });
        const cache = {}; let st = null, mc = null;
        const inner = (h, y) => { let s = 0; const n = 3000, H = 30 / n; for (let i = 0; i < n; i++) { const x = (i + 0.5) * H; s += h(x, y) * Math.exp(-x) * H; } return s; };
        v.render(() => {
          const H = HS[hs.value].h;
          if (!cache[hs.value]) {
            const ys = Array.from({ length: 101 }, (_, i) => (2 * i) / 100), g = ys.map((y) => inner(H, y));
            let I1 = 0; for (let i = 0; i < 400; i++) I1 += inner(H, ((i + 0.5) * 2) / 400) / 400; // ∫∫ dx then dy (ν has density 1/2)
            let I2 = 0; const nx = 1500; for (let i = 0; i < nx; i++) { const x = ((i + 0.5) * 25) / nx; let k = 0; for (let j = 0; j < 200; j++) k += H(x, ((j + 0.5) * 2) / 200) / 200; I2 += k * Math.exp(-x) * (25 / nx); }
            let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 50; i++) for (let j = 0; j <= 20; j++) { const z = H(i / 10, j / 10); lo = Math.min(lo, z); hi = Math.max(hi, z); }
            cache[hs.value] = { ys, g, I1, I2, lo, hi };
          }
          const c = cache[hs.value];
          const mkey = `${hs.value}|${dep.value}|${seed}`;
          if (!mc || mc.key !== mkey) {
            const r = v.rng(seed * 19 + 4); let s = 0, s2 = 0; const pts = [];
            for (let i = 0; i < 20000; i++) { const x = sampleExp(r), y = dep.value ? 2 * (1 - Math.exp(-x)) : 2 * r(); const z = H(x, y); s += z; s2 += z * z; if (i < 300) pts.push([x, y]); }
            const m = s / 20000; mc = { key: mkey, m, se: Math.sqrt((s2 / 20000 - m * m) / 20000), pts };
          }
          L.raster((x, y) => v.ramp(0.15 + 0.7 * (H(x, y) - c.lo) / (c.hi - c.lo || 1), 'teal'), { key: hs.value, res: 3 });
          L.hline(hy.y, { color: 'gold', width: 2, dash: [6, 4] });
          L.dots(mc.pts, { r: 2.2, color: dep.value ? 'red' : 'ink', alpha: 0.7 });
          const gmin = Math.min(0, ...c.g), gmax = Math.max(...c.g, 0.1);
          R.setView(null, [gmin - 0.08 * (gmax - gmin), gmax + 0.12 * (gmax - gmin)]);
          R.between((y) => c.g[Math.round(y * 50)], () => 0, 0, 2, { fill: 'green', fillAlpha: 0.2, n: 100 });
          R.path(c.ys.map((y, i) => [y, c.g[i]]), { color: 'green', width: 2.4 });
          R.hline(c.I1, { color: 'accent', dash: [6, 4], width: 1.6 });
          R.text('average = Eh', 1.98, c.I1 + 0.04 * (gmax - gmin), { align: 'right', size: 11, color: 'accent', baseline: 'bottom' });
          const gy = inner(H, hy.y); R.dot(hy.y, gy, { r: 5.5, color: 'gold' });
          st = { I1: c.I1, I2: c.I2, m: mc.m, se: mc.se, y: hy.y, gy, dep: dep.value };
          v.legend([['teal', '$h$ (darker = larger)', { area: true }], [dep.value ? 'red' : 'ink', 'seeded pairs', { dot: true }], ['green', 'inner integral'], ['accent', 'its $\\nu$-average', { dash: true }]]);
        });
        v.readout(() => st && `$\\int\\!\\bigl(\\int h\\,d\\mu\\bigr)d\\nu=${fr(st.I1, 4)}$, $\\ \\int\\!\\bigl(\\int h\\,d\\nu\\bigr)d\\mu=${fr(st.I2, 4)}$; Monte Carlo $Eh(X,Y)\\approx${fr(st.m, 4)}\\pm${fr(2 * st.se, 4)}$` + (st.dep ? ' — off, because the pairs are not independent.' : (Math.abs(st.m - st.I1) < 3 * st.se + 2e-3 ? ' — agreement.' : '.')) + ` Slice $y=${fr(st.y, 2)}$: inner integral $${fr(st.gy, 4)}$.`);
      },
    },
    {
      num: '2.1.13',
      kind: 'Theorem',
      name: 'Expectations of independent products factor',
      statement: String.raw`If $X_1,\dots,X_n$ are independent and either (a) $X_i\ge0$ for all $i$, or (b) $E|X_i|<\infty$ for all $i$, then the expectation of the product exists and
$$E\Bigl(\prod_{i=1}^nX_i\Bigr)=\prod_{i=1}^nEX_i.$$
The converse fails: $E(XY)=EX\,EY$ (uncorrelated variables) does not imply independence.`,
      idea: String.raw`By Theorem 2.1.10, $X_1$ and $X_2\cdots X_n$ are independent. Theorem 2.1.12 with $f=g=|\cdot|$ gives $E|X_1\cdots X_n|=E|X_1|\,E|X_2\cdots X_n|$, and induction shows this is $\prod_iE|X_i|<\infty$. Then Theorem 2.1.12 with $f(x)=x$, $g(y)=y$ splits off one factor at a time. For the converse, a symmetric table with $XY\equiv0$ has $E(XY)=0=EX\,EY$ but $P(X=1,Y=1)=0<P(X=1)P(Y=1)$.`,
      caption: String.raw`Left: running averages of $X_1X_2X_3$ along 10 seeded paths. The $X_i$ are normal with means $1,2,1.5$ and standard deviations $1,1.5,1$, so $EX_1\,EX_2\,EX_3=3$ (green). The slider $c$ mixes a **shared** normal factor into all three. At $c=0$ the paths settle on $3$. For $c>0$ they settle on the true $E(X_1X_2X_3)$ (red), which is larger: dependence breaks the identity. Right: Durrett's Example 2.1.14. Drag $a$ and $b$. Since $XY\equiv0$, $E(XY)=0=EX\,EY$, yet the corner cell is $0$ while the product of its marginals is $ab$.`,
      deps: ['prob-2.1.12', 'prob-2.1.10'],
      tags: ['independence', 'expectation'],
      viz(v) {
        const cS = v.slider('shared factor $c$', 0, 0.9, 0.5, { step: 0.05 });
        const aS = v.slider('$a$', 0.02, 0.24, 0.12, { step: 0.01 }), bS = v.slider('$b$', 0.02, 0.24, 0.2, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [10, 20000], xlog: true, y: [0, 6], height: 320, weight: 1.35, axes: 'box', gutter: true, xlabel: '$n$', title: 'running average of $X_1X_2X_3$' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, title: 'uncorrelated, not independent' });
        const T = v.table(R, { rows: 3, cols: 3, maxCell: 62, size: 14, rowLabels: ['X=1', 'X=0', 'X=−1'], colLabels: ['Y=1', 'Y=0', 'Y=−1'], cornerLabel: '' });
        const m = [1, 2, 1.5], s = [1, 1.5, 1];
        let cache = null, st = null;
        v.render(() => {
          const c = cS.value, key = `${c}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 23 + 1), paths = [], sc = Math.sqrt(c), sq = Math.sqrt(1 - c);
            for (let p = 0; p < 10; p++) { const xs = new Float64Array(20000); for (let k = 0; k < 20000; k++) { const z0 = r.normal(); let pr = 1; for (let i = 0; i < 3; i++) pr *= m[i] + s[i] * (sc * z0 + sq * r.normal()); xs[k] = pr; } paths.push(runningMeans(xs)); }
            cache = { key, paths };
          }
          const truth = m[0] * m[1] * m[2] + c * (m[0] * s[1] * s[2] + m[1] * s[0] * s[2] + m[2] * s[0] * s[1]);
          L.setView(null, [0, Math.max(6, truth + 2.5)]);
          L.hline(3, { color: 'green', width: 2.2, dash: [7, 4] });
          if (c > 0) L.hline(truth, { color: 'red', width: 2.2, dash: [3, 3] });
          cache.paths.forEach((P, i) => L.path(P, { color: i % 2 ? 'accent' : 'teal', width: 1.3, alpha: 0.75 }));
          const a = aS.value, b = bS.value, cc = 1 - 2 * a - 2 * b;
          const P = [[0, a, 0], [b, cc, b], [0, a, 0]], px = P.map((rw) => rw[0] + rw[1] + rw[2]), py = [0, 1, 2].map((j) => P[0][j] + P[1][j] + P[2][j]);
          T.draw({ value: (i, j) => P[i][j].toFixed(2), sub: (i, j) => (px[i] * py[j]).toFixed(3), fill: (i, j) => (Math.abs(P[i][j] - px[i] * py[j]) < 1e-12 ? ['green', 0.25] : ['red', 0.25]), highlight: [[0, 0, 'red']] });
          const ends = cache.paths.map((P) => P[P.length - 1][1]);
          st = { truth, c, mean: ends.reduce((u, w) => u + w, 0) / ends.length, a, b };
          v.legend([['green', '$EX_1\\,EX_2\\,EX_3=3$', { dash: true }], ['red', 'true $E(X_1X_2X_3)$', { dash: true }], ['accent', 'running averages']]);
        });
        v.readout(() => st && `Average of the 10 paths at $n=20000$: $${fr(st.mean, 3)}$; $E(X_1X_2X_3)=${fr(st.truth, 3)}$` + (st.c === 0 ? ' $=EX_1EX_2EX_3$.' : ` $\\ne EX_1EX_2EX_3=3$.`) + ` Table: $E(XY)=0=EX\\cdot EY$, but $P(X=1,Y=1)=0\\ne ab=${fr(st.a * st.b, 4)}$ (small numbers: products of marginals).`);
      },
    },
    {
      num: '2.1.15',
      kind: 'Theorem',
      name: 'The law of a sum is a convolution',
      statement: String.raw`If $X$ and $Y$ are independent with distribution functions $F(x)=P(X\le x)$ and $G(y)=P(Y\le y)$, then
$$P(X+Y\le z)=\int F(z-y)\,dG(y),$$
where $dG(y)$ means integration against the law of $Y$. The right-hand side is the **convolution** $F*G(z)$.`,
      idea: String.raw`Apply Theorem 2.1.12 to $h(x,y)=1\{x+y\le z\}$. For fixed $y$ the inner integral is $\mu\bigl((-\infty,z-y]\bigr)=F(z-y)$, and integrating over $y$ against $\nu$ gives the formula. The half-plane $\{x+y\le z\}$ is sliced into vertical-in-$x$ pieces, one for each value of $Y$.`,
      caption: String.raw`Watch $z$ sweep, or pause and drag the gold point. Left: the integrand as a function of $y$. The black curve is $F(z-y)$; the orange curve (or stems, for an atomic $Y$) is the law $dG$ of $Y$; the green shading is their product. Its total, $\int F(z-y)\,dG(y)$, is one point of the curve on the right. Right: that convolution (blue) against the empirical distribution function of $4000$ seeded sums $X+Y$ (gold steps). Atoms of $Y$ show up as kinks that move with $z$.`,
      deps: ['prob-2.1.12'],
      see: ['rca-8.13'],
      tags: ['independence', 'convolution'],
      viz(v) {
        const M = v.M;
        const FX = {
          exp: { label: 'exponential', F: (x) => (x <= 0 ? 0 : 1 - Math.exp(-x)), s: (r) => sampleExp(r) },
          norm: { label: 'normal', F: (x) => PhiN(M, x / 0.6), s: (r) => 0.6 * r.normal() },
          unif: { label: 'uniform', F: (x) => clampN(x, 0, 1), s: (r) => r() },
        };
        const GY = {
          unif: { label: 'uniform(0,2)', dens: (y) => (y >= 0 && y <= 2 ? 0.5 : 0), sup: [0, 2], s: (r) => 2 * r() },
          atoms: { label: 'atoms 0, 1, 2.5', atoms: [[0, 0.5], [1, 0.3], [2.5, 0.2]], s: (r) => { const u = r(); return u < 0.5 ? 0 : u < 0.8 ? 1 : 2.5; } },
          exp: { label: 'exponential(2)', dens: (y) => (y >= 0 ? 2 * Math.exp(-2 * y) : 0), sup: [0, 9], s: (r) => sampleExp(r, 2) },
        };
        const fx = v.select('$X$', Object.entries(FX).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const gy = v.select('$Y$', Object.entries(GY).map(([value, o]) => ({ value, label: o.label })), 'atoms');
        const L = v.stage({ x: [-1, 4], y: [0, 1.15], height: 320, axes: 'box', gutter: true, xlabel: '$y$', title: 'integrand: $F(z-y)$ against $dG(y)$' });
        const R = v.stage({ x: [-1.5, 6], y: [0, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$z$', title: '$P(X+Y\\le z)=F*G(z)$' });
        let curve = null, emp = null, zc = 1.6;
        const conv = (F, G, z) => (G.atoms ? G.atoms.reduce((s, [y, p]) => s + p * F(z - y), 0) : simpson((y) => F(z - y) * G.dens(y), G.sup[0], G.sup[1], 600));
        const hz = R.handle(1.6, 0.5, { color: 'gold', constrain: (x) => { const z = clampN(x, -1.4, 5.9); return [z, curve ? conv(FX[fx.value].F, GY[gy.value], z) : 0.5]; } });
        hz.onDrag = () => { v.pause(); };
        let st = null;
        v.animate((t) => {
          const F = FX[fx.value], G = GY[gy.value], key = fx.value + gy.value;
          if (!curve || curve.key !== key) {
            curve = { key, pts: Array.from({ length: 241 }, (_, i) => { const z = -1.5 + (7.5 * i) / 240; return [z, conv(F.F, G, z)]; }) };
            const r = v.rng(11), xs = Array.from({ length: 4000 }, () => F.s(r) + G.s(r)).sort((a, b) => a - b);
            emp = []; xs.forEach((x, i) => { emp.push([x, i / 4000], [x, (i + 1) / 4000]); });
          }
          if (v.playing) { zc = -0.5 + 6 * (((t + 2.5) % 9) / 9); hz.set(zc, conv(F.F, G, zc)); } else zc = hz.x;
          const z = zc, Fz = (y) => F.F(z - y);
          if (G.atoms) {
            for (const [y, p] of G.atoms) { L.line(y, 0, y, p, { color: 'orange', width: 3 }); L.dot(y, p, { r: 4.5, color: 'orange' }); L.line(y, 0, y, p * Fz(y), { color: 'green', width: 9, alpha: 0.6 }); }
          } else {
            const gm = Math.max(...Array.from({ length: 50 }, (_, i) => G.dens(G.sup[0] + (i / 49) * (Math.min(G.sup[1], 4) - G.sup[0]))));
            const sc = 1 / gm;
            L.between((y) => G.dens(y) * sc * Fz(y), () => 0, -1, 4, { fill: 'green', fillAlpha: 0.35, n: 400 });
            L.fn((y) => G.dens(y) * sc, { color: 'orange', width: 2.2, n: 400 });
            L.text(`density × ${fr(sc, 1)}`, 3.95, 1.1, { align: 'right', size: 10.5, color: 'orange' });
          }
          L.fn(Fz, { color: 'ink', width: 2.2, n: 400 });
          L.vline(z, { color: 'gold', dash: [4, 4], width: 1.4 });
          L.text('y = z', z + 0.05, 1.1, { size: 10.5, color: 'gold' });
          R.path(emp, { color: 'gold', width: 1.6 });
          R.path(curve.pts, { color: 'accent', width: 2.4 });
          const val = conv(F.F, G, z);
          R.line(z, 0, z, val, { color: 'green', width: 2, dash: [4, 3] });
          let e = 0; for (const [x, q] of emp) if (x <= z) e = q;
          st = { z, val, e };
          v.legend([['ink', '$F(z-y)$'], ['orange', '$dG(y)$'], ['green', 'product', { area: true }], ['accent', '$F*G$'], ['gold', 'empirical, 4000 sums']]);
        }, { period: 9, still: 3.8 });
        v.readout(() => st && `$z=${fr(st.z, 2)}$: $\\int F(z-y)\\,dG(y)=${fr(st.val, 4)}$; fraction of the $4000$ seeded sums $\\le z$: $${fr(st.e, 4)}$.`);
      },
    },
    {
      num: '2.1.16',
      kind: 'Theorem',
      name: 'Convolution with a density gives a density',
      statement: String.raw`Suppose $X$ has density $f$, $Y$ has distribution function $G$, and $X,Y$ are independent. Then $X+Y$ has density
$$h(x)=\int f(x-y)\,dG(y).$$
When $Y$ also has a density $g$ this reads $h(x)=\int f(x-y)\,g(y)\,dy$.`,
      idea: String.raw`Write $F(z-y)=\int_{-\infty}^zf(x-y)\,dx$ inside Theorem 2.1.15 and swap the two integrals by Fubini's theorem (everything is nonnegative). This gives $P(X+Y\le z)=\int_{-\infty}^z\bigl(\int f(x-y)\,dG(y)\bigr)dx$. Smoothness belongs to the sum as soon as one summand has it: adding an independent continuous variable spreads every atom of $Y$ into a copy of $f$.`,
      caption: String.raw`Left: $Y$ is a discrete law with three atoms. Drag their tops to move them and change their weights (normalized to total $1$). Right: the density $h(x)=\sum_kP(Y=y_k)\,f(x-y_k)$ of $X+Y$ (blue), its three pieces (dashed) and the histogram of $5000$ seeded sums. $Y$ has no density at all, yet $X+Y$ has one. Narrow the width of $f$ and the pieces separate, but the sum never has an atom.`,
      deps: ['prob-2.1.15', 'prob-1.7.2'],
      see: ['rca-8.14'],
      tags: ['convolution'],
      viz(v) {
        const FS = {
          unif: { label: 'uniform', f: (x, w) => (Math.abs(x) <= w / 2 ? 1 / w : 0), s: (r, w) => w * (r() - 0.5) },
          tri: { label: 'triangular', f: (x, w) => Math.max(0, (1 - Math.abs(x) / w) / w), s: (r, w) => w * (r() - r()) },
          norm: { label: 'normal', f: (x, w) => PHI(x / (w / 2)) / (w / 2), s: (r, w) => (w / 2) * r.normal() },
        };
        const fsel = v.select('$f$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'unif');
        const wS = v.slider('width of $f$', 0.2, 3, 1.4, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-1, 5], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: '$y$', title: 'law of $Y$: drag the atoms' });
        const R = v.stage({ x: [-2.5, 6.5], y: [0, 0.8], height: 300, weight: 1.4, axes: 'box', gutter: true, xlabel: '$x$', title: 'density of $X+Y$' });
        const H = [[0, 0.5], [1.6, 0.3], [3.4, 0.6]].map(([x, y], k) => L.handle(x, y, { color: ['accent', 'purple', 'teal'][k], constrain: (a, b) => [clampN(a, -0.8, 4.8), clampN(b, 0.05, 0.95)] }));
        let st = null;
        v.render(() => {
          const F = FS[fsel.value], w = wS.value, tot = H.reduce((s, h) => s + h.y, 0), at = H.map((h) => [h.x, h.y / tot]);
          at.forEach(([y, p], k) => { const col = ['accent', 'purple', 'teal'][k]; L.line(y, 0, y, H[k].y, { color: col, width: 3 }); L.text(fr(p, 2), y, H[k].y + 0.06, { align: 'center', size: 11, color: col }); });
          const h = (x) => at.reduce((s, [y, p]) => s + p * F.f(x - y, w), 0);
          const r = v.rng(seed * 41 + 3), cum = [at[0][1], at[0][1] + at[1][1]];
          const xs = Array.from({ length: 5000 }, () => { const u = r(); const k = u < cum[0] ? 0 : u < cum[1] ? 1 : 2; return at[k][0] + F.s(r, w); });
          const Hs = densityOn(xs, linEdges(-2.5, 6.5, 72));
          let peak = 0; for (let i = 0; i <= 300; i++) peak = Math.max(peak, h(-2.5 + (9 * i) / 300));
          R.setView(null, [0, Math.max(peak, ...Hs.density) * 1.15]);
          R.hist(Hs, { density: true, color: 'gold', fillAlpha: 0.3 });
          at.forEach(([y, p], k) => R.fn((x) => p * F.f(x - y, w), { color: ['accent', 'purple', 'teal'][k], dash: [5, 4], width: 1.4, n: 500 }));
          R.fn(h, { color: 'accent', width: 2.6, n: 900 });
          const integral = simpson(h, -8, 12, 4000);
          let l1 = 0; Hs.density.forEach((d, i) => { const c = (Hs.edges[i] + Hs.edges[i + 1]) / 2; l1 += Math.abs(d - h(c)) * (Hs.edges[1] - Hs.edges[0]); });
          st = { integral, l1, p: at.map((a) => a[1]) };
          v.legend([['accent', '$h=\\int f(\\cdot-y)\\,dG(y)$'], ['gold', '5000 seeded sums', { area: true }]]);
        });
        v.readout(() => st && `$\\int h=${fr(st.integral, 4)}$; histogram vs $h$: $L^1$ distance $${fr(st.l1, 3)}$ (sampling noise). $P(Y=y_k)=${st.p.map((p) => fr(p, 2)).join(', ')}$, but $P(X+Y=x)=0$ for every $x$.`);
      },
    },
    {
      num: '2.1.18',
      kind: 'Theorem',
      name: 'Sums of independent gammas are gamma',
      statement: String.raw`Let the gamma$(\alpha,\lambda)$ law have density $\lambda^\alpha x^{\alpha-1}e^{-\lambda x}/\Gamma(\alpha)$ on $x\ge0$. If $X$ is gamma$(\alpha,\lambda)$ and $Y$ is gamma$(\beta,\lambda)$, independent, then $X+Y$ is gamma$(\alpha+\beta,\lambda)$. In particular the sum of $n$ independent exponential$(\lambda)$ variables is gamma$(n,\lambda)$.`,
      idea: String.raw`By Theorem 2.1.16 the density of $X+Y$ is $\frac{\lambda^{\alpha+\beta}e^{-\lambda x}}{\Gamma(\alpha)\Gamma(\beta)}\int_0^x(x-y)^{\alpha-1}y^{\beta-1}dy$, and the substitution $y=xu$ turns the integral into $x^{\alpha+\beta-1}B(\alpha,\beta)$. So the density has the gamma$(\alpha+\beta,\lambda)$ shape. Only one constant makes it integrate to $1$, which forces $B(\alpha,\beta)=\Gamma(\alpha)\Gamma(\beta)/\Gamma(\alpha+\beta)$. An exponential$(\lambda)$ is gamma$(1,\lambda)$, and induction gives the second statement.`,
      caption: String.raw`"Add exponentials": slide $n$ to add one more exponential$(\lambda)$. The previous sum's density (grey) is convolved **numerically** with the exponential density (thin orange). The result (blue) lies on the gamma$(n,\lambda)$ formula (green dashed) and on the histogram of $6000$ seeded sums. "Two gammas": choose $\alpha$ and $\beta$; the two summand densities are drawn thin. The readout reports the largest gap between the numerical convolution and the formula.`,
      deps: ['prob-2.1.16'],
      tags: ['convolution', 'distributions'],
      viz(v) {
        const M = v.M;
        const mode = v.select('mode', [{ value: 'exp', label: 'add exponentials' }, { value: 'gam', label: 'two gammas' }], 'exp');
        const nS = v.slider('$n$', 1, 12, 4, { int: true });
        const aS = v.slider('$\\alpha$', 0.5, 6, 1.5, { step: 0.1 }), bS = v.slider('$\\beta$', 0.5, 6, 2.5, { step: 0.1 });
        const lS = v.slider('$\\lambda$', 0.5, 3, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [0, 10], y: [0, 0.6], height: 330, axes: 'box', gutter: true, xlabel: '$x$', title: 'density of the sum' });
        const dx = 0.02, NG = 2000; // grid in units of 1/λ
        const cellMass = (a) => Float64Array.from({ length: NG }, (_, i) => M.gammaP(a, (i + 1) * dx) - M.gammaP(a, i * dx));
        const E1 = cellMass(1), chain = [null, { m: E1, off: 0.5 }];
        const getChain = (n) => { while (chain.length <= n) { const prev = chain[chain.length - 1], c = convolveGrid(prev.m, E1, 1); chain.push({ m: c.ys.slice(0, NG), off: prev.off + 0.5 }); } return chain[n]; };
        const gpdf = (a, x) => (x <= 0 ? 0 : Math.exp((a - 1) * Math.log(x) - x - M.lgamma(a)));
        let gcache = null, st = null;
        v.render(() => {
          const ex = mode.value === 'exp', lam = lS.value;
          nS.el.hidden = !ex; aS.el.hidden = ex; bS.el.hidden = ex;
          let num, k, parts;
          if (ex) { const n = nS.value; const c = getChain(n); num = { m: c.m, off: c.off }; k = n; parts = n > 1 ? [{ m: getChain(n - 1).m, off: getChain(n - 1).off, col: 'muted', dash: true }] : []; }
          else {
            const a = aS.value, b = bS.value, key = `${a}|${b}`;
            if (!gcache || gcache.key !== key) { const A = cellMass(a), B = cellMass(b), c = convolveGrid(A, B, 1); gcache = { key, A, B, m: c.ys.slice(0, NG) }; }
            num = { m: gcache.m, off: 1 }; k = a + b; parts = [{ m: gcache.A, off: 0.5, col: 'teal' }, { m: gcache.B, off: 0.5, col: 'purple' }];
          }
          const xmax = (k + 4.5 * Math.sqrt(k) + 2) / lam;
          const toPts = (P) => { const out = []; for (let i = 0; i < NG; i++) { const x = (i + P.off) * dx / lam; if (x > xmax) break; out.push([x, (P.m[i] / dx) * lam]); } return out; };
          const numPts = toPts(num);
          const r = v.rng(seed * 3 + 5), smp = [];
          const GA = M.dist.gamma(aS.value, 1 / lam), GB = M.dist.gamma(bS.value, 1 / lam);
          for (let j = 0; j < 6000; j++) { if (ex) { let s = 0; for (let i = 0; i < k; i++) s += sampleExp(r, lam); smp.push(s); } else smp.push(GA.sample(r) + GB.sample(r)); }
          const Hs = densityOn(smp, linEdges(0, xmax, 60));
          let peak = 0; for (const p of numPts) peak = Math.max(peak, p[1]);
          let ppk = 0; for (const P of parts) for (const q of toPts(P)) if (q[0] > 0.3 / lam) ppk = Math.max(ppk, q[1]);
          const ymax = Math.max(peak, ppk, ...Hs.density) * 1.12;
          S.setView([0, xmax], [0, ymax]);
          S.hist(Hs, { density: true, color: 'gold', fillAlpha: 0.28 });
          for (const P of parts) S.path(toPts(P), { color: P.col, width: 1.4, dash: P.dash ? [4, 4] : null });
          if (ex) S.fn((x) => lam * Math.exp(-lam * x), { color: 'orange', width: 1.2, alpha: 0.7 });
          S.path(numPts, { color: 'accent', width: 3 });
          S.fn((x) => lam * gpdf(k, lam * x), { color: 'green', width: 2, dash: [7, 4], n: 500 });
          let sup = 0; for (const [x, y] of numPts) if (x > 0.05 / lam) sup = Math.max(sup, Math.abs(y - lam * gpdf(k, lam * x)));
          st = { sup, k, lam, peak, ex };
          v.legend(ex ? [['muted', 'previous sum', { dash: true }], ['orange', 'exponential$(\\lambda)$'], ['accent', 'numerical convolution'], ['green', `gamma$(${k},\\lambda)$ formula`, { dash: true }], ['gold', '6000 seeded sums', { area: true }]]
            : [['teal', 'gamma$(\\alpha,\\lambda)$'], ['purple', 'gamma$(\\beta,\\lambda)$'], ['accent', 'numerical convolution'], ['green', 'gamma$(\\alpha+\\beta,\\lambda)$', { dash: true }], ['gold', '6000 seeded sums', { area: true }]]);
        });
        v.readout(() => st && `Largest gap between the numerical convolution and the gamma$(${fr(st.k, 1)},${fr(st.lam, 2)})$ density: $${st.sup < 1e-4 ? v.sci(st.sup, 2) : fr(st.sup, 4)}$ (peak height $${fr(st.peak, 3)}$; grid step $0.02/\\lambda$). Mean $${fr(st.k / st.lam, 3)}$, variance $${fr(st.k / st.lam / st.lam, 3)}$.`);
      },
    },
    {
      num: '2.1.20',
      kind: 'Theorem',
      name: 'Sums of independent normals are normal',
      statement: String.raw`Write normal$(\mu,a)$ for the normal law with mean $\mu$ and **variance** $a$, density $(2\pi a)^{-1/2}e^{-(x-\mu)^2/2a}$. If $X$ is normal$(\mu,a)$ and $Y$ is normal$(\nu,b)$, independent, then $X+Y$ is normal$(\mu+\nu,a+b)$.`,
      idea: String.raw`Shift to $\mu=\nu=0$ and use Theorem 2.1.16: $f_{X+Y}(z)\propto\int e^{-x^2/2a}e^{-(z-x)^2/2b}\,dx$. Completing the square in $x$ shows the integrand is a Gaussian bump in $x$ with centre $az/(a+b)$ and variance $ab/(a+b)$, times $e^{-z^2/2(a+b)}$. The bump integrates to $\sqrt{2\pi ab/(a+b)}$, which leaves exactly the normal$(0,a+b)$ density. Geometrically, slicing a product of Gaussians along the line $x+y=z$ gives a Gaussian slice whose area is Gaussian in $z$.`,
      caption: String.raw`Left: contours of the joint density of $(X,Y)$ and the line $x+y=z$; drag $z$ on the right-hand panel. Middle: the joint density along that line, as a function of $x$ (shaded). The dashed curve is the Gaussian from the completed square: centre $\mu+a(z-\mu-\nu)/(a+b)$, variance $ab/(a+b)$, scaled to total mass normal$(\mu+\nu,a+b)$ at $z$. It covers the slice exactly. Right: the slice areas (blue) on the normal$(\mu+\nu,a+b)$ density (green dashed). Make $X,Y$ correlated: the slices stay Gaussian, but their areas follow variance $a+b+2\rho\sqrt{ab}$, not $a+b$.`,
      deps: ['prob-2.1.16', 'prob-1.2.5'],
      tags: ['convolution', 'normal'],
      viz(v) {
        const mu = v.slider('$\\mu$', -2, 2, -0.5, { step: 0.1 }), aS = v.slider('$a$', 0.2, 4, 1.5, { step: 0.05 });
        const nu = v.slider('$\\nu$', -2, 2, 1, { step: 0.1 }), bS = v.slider('$b$', 0.2, 4, 0.6, { step: 0.05 });
        const rho = v.slider('correlation $\\rho$ (0 = independent)', -0.8, 0.8, 0, { step: 0.05 });
        const P1 = v.stage({ x: [-5, 5], y: [-5, 5], equal: true, height: 300, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: 'joint density, line $x+y=z$', minWidth: 230 });
        const P2 = v.stage({ x: [-5, 5], y: [0, 0.2], height: 300, axes: 'box', gutter: true, xlabel: '$x$', title: 'slice $x\\mapsto f(x,z-x)$', minWidth: 230 });
        const P3 = v.stage({ x: [-6, 6], y: [0, 0.4], height: 300, axes: 'box', gutter: true, xlabel: '$z$', title: 'density of $X+Y$', minWidth: 230 });
        const hz = P3.handle(1.3, 0, { color: 'gold', label: 'z', constrain: (x) => [clampN(x, -5.8, 5.8), P3.yr[0]] });
        let st = null;
        v.render(() => {
          const m1 = mu.value, m2 = nu.value, a = aS.value, b = bS.value, r = rho.value, c = r * Math.sqrt(a * b), det = a * b - c * c;
          const f = (x, y) => { const u = x - m1, w = y - m2; return Math.exp(-(b * u * u - 2 * c * u * w + a * w * w) / (2 * det)) / (2 * Math.PI * Math.sqrt(det)); };
          const z = hz.x;
          const pk = f(m1, m2);
          P1.contour(f, [0.1, 0.3, 0.55, 0.8].map((t) => t * pk), { color: 'accent', width: 1.6 });
          P1.line(z + 5, -5, z - 5, 5, { color: 'gold', width: 2.4 });
          P1.dot(m1, m2, { r: 3, color: 'accent' });
          const slice = (x) => f(x, z - x), area = simpson(slice, -15, 15, 600);
          const nd = (x, m, s2) => Math.exp(-((x - m) ** 2) / (2 * s2)) / Math.sqrt(2 * Math.PI * s2);
          const ms = m1 + (a * (z - m1 - m2)) / (a + b), vs = (a * b) / (a + b), hz0 = nd(z, m1 + m2, a + b);
          let smax = 0; for (let i = 0; i <= 200; i++) smax = Math.max(smax, slice(-5 + i / 20), r === 0 ? hz0 * nd(-5 + i / 20, ms, vs) : 0);
          P2.setView(null, [0, Math.max(0.02, smax * 1.2)]);
          P2.fn(slice, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.2, n: 400 });
          if (r === 0) P2.fn((x) => hz0 * nd(x, ms, vs), { color: 'green', width: 2, dash: [6, 4], n: 400 });
          P2.vline(ms, { color: 'muted', dash: [3, 3], width: 1 });
          const zs = Array.from({ length: 121 }, (_, i) => -6 + i / 10), hs = zs.map((zz) => simpson((x) => f(x, zz - x), -15, 15, 300));
          const ymax = Math.max(...hs, nd(m1 + m2, m1 + m2, a + b)) * 1.15; P3.setView(null, [0, ymax]); hz.y = 0;
          P3.fn((x) => nd(x, m1 + m2, a + b), { color: 'green', width: 2.2, dash: [7, 4], n: 400 });
          P3.path(zs.map((zz, i) => [zz, hs[i]]), { color: 'accent', width: 2.4 });
          P3.line(z, 0, z, area, { color: 'gold', width: 1.6, dash: [4, 3] }); P3.dot(z, area, { r: 5, color: 'gold' });
          let gap = 0; zs.forEach((zz, i) => { gap = Math.max(gap, Math.abs(hs[i] - nd(zz, m1 + m2, a + b))); });
          st = { area, hz0, ms, vs, gap, r, vtrue: a + b + 2 * c };
          v.legend([['accent', 'slice / slice areas'], ['green', 'completed square; normal$(\\mu+\\nu,a+b)$', { dash: true }], ['gold', '$z$']]);
        });
        v.readout(() => st && `At $z$: slice area $${fr(st.area, 4)}$ vs normal$(\\mu+\\nu,a+b)$ density $${fr(st.hz0, 4)}$` + (st.r === 0 ? `; slice centre $${fr(st.ms, 3)}$, variance $ab/(a+b)=${fr(st.vs, 3)}$. Largest gap over $z$: $${v.sci(st.gap, 2)}$.` : `. With $\\rho=${fr(st.r, 2)}$ the sum is normal with variance $${fr(st.vtrue, 3)}$, so the gap reaches $${fr(st.gap, 4)}$.`));
      },
    },
    {
      num: '2.1.21',
      kind: 'Theorem',
      name: 'Kolmogorov’s extension theorem',
      credit: 'Kolmogorov, 1933',
      statement: String.raw`Let $\mu_n$ be probability measures on $(\R^n,\mathcal R^n)$ that are **consistent**:
$$\mu_{n+1}\bigl((a_1,b_1]\times\dots\times(a_n,b_n]\times\R\bigr)=\mu_n\bigl((a_1,b_1]\times\dots\times(a_n,b_n]\bigr).$$
Then there is a unique probability measure $P$ on the sequence space $(\R^\N,\mathcal R^\N)$, with its product σ-field, such that $P(\omega:\omega_i\in(a_i,b_i],\,1\le i\le n)=\mu_n\bigl((a_1,b_1]\times\dots\times(a_n,b_n]\bigr)$ for all $n$ and all $a_i<b_i$. In particular an infinite sequence of independent variables with any prescribed laws exists.`,
      idea: String.raw`Consistency makes the finite-dimensional sets carry a well-defined, finitely additive set function. The work is countable additivity, which is proved by approximating each finite-dimensional set from inside by compact sets and using a diagonal argument (Theorem A.3.1). Carathéodory's extension (Theorem 1.1.11) then produces $P$, and the π–λ theorem gives uniqueness. For independent variables take $\mu_n=\mu_1\times\dots\times\mu_n$, which is consistent.`,
      caption: String.raw`A family $\mu_n$ on binary strings of length $n$. Row $n$ cuts $[0,1]$ into $2^n$ pieces, in dictionary order, with widths $\mu_n(\text{string})$; the colour is the last digit (blue $0$, orange $1$). Consistency says each piece of row $n$ splits exactly into its two children in row $n+1$, so all the boundaries line up. Then the rows are the distribution function of $\sum\omega_i2^{-i}$ at finer and finer resolution, and the limit law exists (right: its distribution function, with $2000$ seeded sequences drawn digit by digit). The "even parity" family is inconsistent. Its boundaries tear apart (red), and no $P$ exists.`,
      deps: ['prob-1.1.11'],
      see: ['prob-10.3.1'],
      tags: ['construction', 'product measure'],
      viz(v) {
        const M = v.M;
        const FAM = {
          iid: { label: 'i.i.d. Bernoulli($p$)', mu: (w, p) => w.reduce((s, b) => s * (b ? p : 1 - p), 1) },
          mk: { label: 'Markov (stay $p$)', mu: (w, p) => w.reduce((s, b, i) => (i ? s * (b === w[i - 1] ? p : 1 - p) : 0.5), 1) },
          pol: { label: 'Pólya urn', mu: (w) => { const o = w.reduce((s, b) => s + b, 0), z = w.length - o; return Math.exp(M.lgamma(o + 1) + M.lgamma(z + 1) - M.lgamma(w.length + 2)); } },
          bad: { label: 'even parity (inconsistent)', mu: (w) => (w.reduce((s, b) => s + b, 0) % 2 ? 0 : 2 ** -(w.length - 1)) },
        };
        const fam = v.select('family', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'pol');
        const pS = v.slider('$p$', 0.05, 0.95, 0.7, { step: 0.01 });
        const dS = v.slider('rows', 2, 9, 7, { int: true });
        const L = v.stage({ x: [-0.1, 1], y: [0, 7], height: 330, weight: 1.5, axes: false, title: 'row $n$: $[0,1]$ cut into widths $\\mu_n(\\omega_1\\cdots\\omega_n)$' });
        const R = v.stage({ x: [0, 1], y: [0, 1.05], height: 330, axes: 'box', gutter: true, xlabel: '$\\sum\\omega_i2^{-i}$', title: 'the extension $P$' });
        let st = null;
        v.render(() => {
          const F = FAM[fam.value], p = pS.value, n = dS.value;
          pS.el.hidden = fam.value === 'pol' || fam.value === 'bad';
          L.setView(null, [0, n + 0.3]);
          const rows = [];
          for (let k = 1; k <= n; k++) { const ms = []; for (let c = 0; c < 2 ** k; c++) { const w = []; for (let i = k - 1; i >= 0; i--) w.push((c >> i) & 1); ms.push(F.mu(w, p)); } rows.push(ms); }
          let firstBad = 0, err = 0;
          rows.forEach((ms, k) => {
            const y = n - k - 0.35; let x = 0; const W = ms.length;
            L.text(`n=${k + 1}`, -0.012, y + 0.3, { align: 'right', size: 11, color: 'muted' });
            ms.forEach((m, c) => { if (m > 0) L.rect(x, y, x + m, y + 0.62, { fill: c & 1 ? 'orange' : 'accent', fillAlpha: (c >> 1) & 1 ? 0.42 : 0.68, stroke: L.X(x + m) - L.X(x) > 3, color: 'panel', width: 1 }); x += m; });
            if (k < rows.length - 1) {
              const ch = rows[k + 1]; let xa = 0, xb = 0;
              for (let c = 0; c < W; c++) {
                xa += ms[c]; xb += ch[2 * c] + ch[2 * c + 1];
                const e = Math.abs(xa - xb); err = Math.max(err, Math.abs(ms[c] - ch[2 * c] - ch[2 * c + 1]));
                if (e > 1e-9) { L.line(xa, y, xb, y - 0.38, { color: 'red', width: 1.8 }); if (!firstBad) firstBad = k + 1; }
              }
            }
          });
          // right panel: the limit law through its CDF at the finest row, and seeded sequences
          if (!firstBad) {
            const fin = rows[rows.length - 1], pts = [[0, 0]]; let cdf = 0; fin.forEach((m, c) => { cdf += m; pts.push([(c + 1) / fin.length, cdf]); });
            const r = v.rng(7 + n), xs = [];
            for (let j = 0; j < 2000; j++) {
              const w = []; let val = 0;
              for (let i = 0; i < 24; i++) { const m0 = i ? F.mu(w, p) : 1; w.push(1); const m1 = F.mu(w, p); w.pop(); const b = r() < (m0 > 0 ? m1 / m0 : 0.5) ? 1 : 0; w.push(b); val += b * 2 ** -(i + 1); }
              xs.push(val);
            }
            xs.sort((a, b) => a - b); const emp = xs.map((x, i) => [x, (i + 1) / 2000]);
            R.path(emp, { color: 'gold', width: 3, alpha: 0.6 });
            R.path(pts, { color: 'green', width: 1.8 });
            st = { ok: true, err, n };
          } else {
            cornerIn(R, `no extension: row ${firstBad + 1} does not project onto row ${firstBad}`, 'tl', { color: 'red' });
            st = { ok: false, err, firstBad };
          }
          v.legend([['accent', 'last digit 0', { area: true }], ['orange', 'last digit 1', { area: true }], ['red', 'torn boundary'], ['green', 'distribution function from row $n$'], ['gold', '2000 seeded sequences']]);
        });
        v.readout(() => st && (st.ok ? `Consistent: $\\max|\\mu_{k+1}(w0)+\\mu_{k+1}(w1)-\\mu_k(w)|=${fr(st.err, 12)}$ over all rows, so the sequence measure $P$ exists. The empirical law of $2000$ sequences drawn digit by digit follows its distribution function.` : `Inconsistent: the children of a string carry total mass different from the string (largest discrepancy $${fr(st.err, 4)}$, first at row ${st.firstBad}). No measure on sequences has these marginals.`));
      },
    },
    {
      num: '2.1.22',
      kind: 'Theorem',
      name: 'Borel subsets of complete separable metric spaces are nice',
      statement: String.raw`A measurable space $(S,\mathcal S)$ is **nice** if there is a one-to-one map $\varphi:S\to\R$ such that $\varphi$ and $\varphi^{-1}$ are both measurable. If $S$ is a Borel subset of a complete separable metric space and $\mathcal S$ is the collection of its Borel subsets, then $(S,\mathcal S)$ is nice. Kolmogorov's extension theorem therefore holds for sequences with values in such spaces.`,
      idea: String.raw`First take $S=[0,1)^\N$. Expand every coordinate in binary and **interleave** the digits along anti-diagonals into a single binary expansion, $\varphi_0(x)=.x_{11}x_{12}x_{21}x_{13}x_{22}x_{31}\dots$. Each digit of the output is a measurable function of the input and conversely. For a general space, make the metric bounded by $1$, pick a countable dense set $q_1,q_2,\dots$, and embed $x\mapsto(d(x,q_1),d(x,q_2),\dots)\in[0,1)^\N$, which is continuous and one-to-one. Then compose. The map is far from continuous, but measurability is all the theorem needs.`,
      caption: String.raw`The two-dimensional case: $\varphi(x,y)=.x_1y_1x_2y_2x_3y_3\dots$ maps the square one-to-one into $[0,1]$. Left: a seeded cloud, coloured by its image $\varphi$ (the colour bar runs along $[0,1]$). The orange path visits the dyadic cells in the order $\varphi$ gives them; it is the level-$k$ Z-order curve. Drag the gold point and read its binary digits below. Right: the image law on $[0,1]$. Every point is decoded back by splitting the digits again, and the readout gives the largest recovery error. Neighbours in the square can land far apart.`,
      deps: ['prob-2.1.21'],
      tags: ['construction'],
      viz(v) {
        const M = v.M;
        const shp = v.select('cloud', [{ value: 'blob', label: 'blob' }, { value: 'ring', label: 'ring' }, { value: 'unif', label: 'uniform' }], 'ring');
        const kS = v.slider('Z-curve level $k$', 1, 5, 3, { int: true });
        const L = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: 'the square, coloured by $\\varphi$' });
        const R = v.stage({ x: [0, 1], y: [0, 4], height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$\\varphi(x,y)$', title: 'image law on $[0,1]$' });
        const hp = L.handle(0.62, 0.37, { color: 'gold', constrain: (x, y) => [clampN(x, 0, 0.9999), clampN(y, 0, 0.9999)] });
        const B = 26, S2 = 2 ** B, S4 = 2 ** (2 * B);
        const enc = (x, y) => { const X = Math.floor(x * S2), Y = Math.floor(y * S2); let z = 0; for (let i = B - 1; i >= 0; i--) z = z * 4 + 2 * ((X >>> i) & 1) + ((Y >>> i) & 1); return z / S4; };
        const dec = (f) => { let Z = Math.round(f * S4), X = 0, Y = 0, pw = 1; for (let i = 0; i < B; i++) { const d = Z % 4; Z = (Z - d) / 4; X += (d >> 1) * pw; Y += (d & 1) * pw; pw *= 2; } return [X / S2, Y / S2]; };
        const bits = (x, k) => { let s = '.'; for (let i = 0; i < k; i++) { x *= 2; const b = Math.floor(x); s += b; x -= b; } return s; };
        let st = null;
        v.render(() => {
          const r = v.rng(31), pts = [];
          for (let i = 0; i < 700; i++) {
            if (shp.value === 'blob') pts.push([clampN(0.35 + 0.1 * r.normal(), 0, 0.9999), clampN(0.6 + 0.1 * r.normal(), 0, 0.9999)]);
            else if (shp.value === 'ring') { const t = 2 * Math.PI * r(), rr = 0.32 + 0.03 * r.normal(); pts.push([0.5 + rr * Math.cos(t), 0.5 + rr * Math.sin(t)]); }
            else pts.push([r(), r()]);
          }
          const k = kS.value, nC = 2 ** k, path = [];
          for (let z = 0; z < nC * nC; z++) { let X = 0, Y = 0; for (let i = 0; i < k; i++) { const d = (z >> (2 * (k - 1 - i))) & 3; X = 2 * X + (d >> 1); Y = 2 * Y + (d & 1); } path.push([(X + 0.5) / nC, (Y + 0.5) / nC]); }
          for (let i = 1; i < nC; i++) { L.vline(i / nC, { color: 'grid', width: 1 }); L.hline(i / nC, { color: 'grid', width: 1 }); }
          L.path(path, { color: 'orange', width: 1.6, alpha: 0.8 });
          let err = 0; const phis = [];
          for (const [x, y] of pts) { const f = enc(x, y); phis.push(f); const [a, b] = dec(f); err = Math.max(err, Math.abs(a - x), Math.abs(b - y)); L.dot(x, y, { r: 2.6, color: M.cmap(f, 'viridis') }); }
          const Hs = densityOn(phis, linEdges(0, 1, 64));
          R.setView(null, [0, Math.max(...Hs.density) * 1.15]);
          for (let i = 0; i < 64; i++) R.rect(i / 64, 0, (i + 1) / 64, Hs.density[i], { fill: M.cmap((i + 0.5) / 64, 'viridis'), fillAlpha: 0.85, stroke: false });
          const fp = enc(hp.x, hp.y);
          R.vline(fp, { color: 'gold', width: 2.4 }); R.dot(fp, 0, { r: 5, color: 'gold' });
          L.dot(hp.x, hp.y, { r: 5, color: 'gold' });
          st = { err, x: hp.x, y: hp.y, fp, bx: bits(hp.x, 8), by: bits(hp.y, 8), bf: bits(fp, 16) };
          v.legend([['orange', `Z-order curve, level ${k}`], ['gold', 'your point and its image']]);
        });
        v.readout(() => st && `$x=${st.bx}\\ldots_2$, $y=${st.by}\\ldots_2$ $\\Rightarrow$ $\\varphi=${st.bf.replace(/(\d\d)/g, '$1\\,')}\\ldots_2$ (digits taken alternately). Decoding all $700$ points: largest error $${v.sci(st.err, 2)}$ $\\le2^{-26}$ (the $26$ binary digits kept per coordinate).`);
      },
    },
  ],
};
