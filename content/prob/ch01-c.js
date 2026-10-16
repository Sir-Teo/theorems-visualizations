// Probability: Theory and Examples (Durrett) — Chapter 1, part C: integration and its properties (§§1.4–1.5)

// ---------- helpers ----------
const SETCOL = ['accent', 'orange', 'green', 'purple'];
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
/** Composite midpoint rule on [a, b]. */
function midpoint(f, a, b, n = 2000) { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
/** Piecewise-linear interpolation through (xs[i], ys[i]), extended linearly beyond the end nodes. */
function pwl(xs, ys, x) {
  const n = xs.length; let k = 0;
  if (x <= xs[0]) k = 0; else if (x >= xs[n - 1]) k = n - 2; else while (x > xs[k + 1]) k++;
  return ys[k] + ((ys[k + 1] - ys[k]) * (x - xs[k])) / (xs[k + 1] - xs[k]);
}
/** Exact integral of the piecewise-linear interpolant over [a, b] (trapezoids between breakpoints). */
function pwlIntegral(xs, ys, a, b) {
  const pts = [a, ...xs.filter((x) => x > a && x < b), b]; let s = 0;
  for (let i = 0; i + 1 < pts.length; i++) s += 0.5 * (pwl(xs, ys, pts[i]) + pwl(xs, ys, pts[i + 1])) * (pts[i + 1] - pts[i]);
  return s;
}
/** A law on the line from weighted points: sorted values with cumulative weights. G(c) = μ{f ≤ c}. */
function weightedLaw(vals, wts) {
  const idx = Array.from(vals, (_, i) => i).sort((i, j) => vals[i] - vals[j]);
  const xs = new Float64Array(idx.length), cum = new Float64Array(idx.length); let s = 0, m = 0;
  idx.forEach((i, k) => { xs[k] = vals[i]; s += wts[i]; cum[k] = s; m += vals[i] * wts[i]; });
  const G = (c) => { let lo = 0, hi = xs.length; while (lo < hi) { const md = (lo + hi) >> 1; if (xs[md] <= c) lo = md + 1; else hi = md; } return lo ? cum[lo - 1] : 0; };
  return { G, total: s, mean: m, absMean: Array.from(vals).reduce((t, v, i) => t + Math.abs(v) * wts[i], 0) };
}
/** Status text pinned to a corner of the data area (inside the gutter, unlike s.corner which uses the canvas corner). */
function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}
const fmtTerm = (v, a, m) => `${a < 0 ? `(${v.fix(a, 2)})` : v.fix(a, 2)}\\cdot ${v.fix(m, 2)}`;

export default {
  collection: 'prob',
  chapter: 1,
  items: [
    // ======================================================================== §1.4 Integration
    {
      num: '1.4.1a',
      kind: 'Definition',
      name: 'Simple functions and their integral',
      verify: true,
      statement: String.raw`Let $(\Omega,\mathcal F,\mu)$ be a $\sigma$-finite measure space. A **simple function** is a finite sum
$$\varphi=\sum_{i=1}^n a_i\,1_{A_i}$$
with real numbers $a_i$ and pairwise disjoint sets $A_i\in\mathcal F$ of finite measure. Its integral is
$$\int\varphi\,d\mu=\sum_{i=1}^n a_i\,\mu(A_i).$$
The representation is not unique (the $a_i$ need not be distinct, and a set may be cut into pieces carrying the same value), but every representation gives the same number. When $\mu=P$ is a probability measure, a simple function is a random variable with finitely many values, and its integral is the average of those values weighted by their probabilities.`,
      idea: String.raw`Cutting $A_i$ into disjoint pieces that carry the same value leaves $a_i\mu(A_i)$ unchanged, by finite additivity. Two representations of one $\varphi$ have a common refinement, the sets $A_i\cap B_j$, on which both give the same value, so both sums equal the sum over the refinement. Read probabilistically, the integral is the centre of mass of the law of $\varphi$: the values $a_i$ carrying the masses $\mu(A_i)$. Integration is built up from this case in three more steps (bounded, nonnegative, general functions).`,
      caption: String.raw`$\Omega=[0,1)$ with $P$ = length. Drag the coloured handles to set the four values $a_i$, and the grey handles on the strip to move the cuts. Each set $A_i$ is a union of two intervals. Right: the law of $\varphi$, a bar of length $P(A_i)$ at height $a_i$; the green line at height $\int\varphi\,dP$ is its balance point. Switch on *split* to integrate the same $\varphi$ written with eight sets instead of four.`,
      deps: ['prob-1.1.1a', 'prob-1.3.1'],
      see: ['rca-1.16', 'rca-1.23'],
      tags: ['integration'],
      viz(v) {
        const PAT = [0, 1, 2, 1, 3, 0, 2, 3]; // interval j belongs to the set A_{PAT[j]}
        const L = v.stage({ x: [-0.03, 1.03], y: [-1.75, 3.1], height: 330, weight: 1.6, axes: 'box', gutter: true, xlabel: '$\\omega$', title: 'a simple random variable $\\varphi$ on $\\Omega=[0,1)$' });
        const R = v.stage({ x: [0, 1.0], y: [-1.75, 3.1], height: 330, axes: 'box', gutter: true, xlabel: 'mass', title: 'its law: mass $P(A_i)$ at value $a_i$' });
        const split = v.toggle('split each $A_i$ into its two intervals', false);
        const cuts = [];
        [0.1, 0.22, 0.38, 0.5, 0.63, 0.78, 0.9].forEach((c, k) => cuts.push(L.handle(c, -1.35, {
          color: 'muted', r: 5.5,
          constrain: (x) => [clampN(x, k ? cuts[k - 1].x + 0.025 : 0.025, k < 6 ? cuts[k + 1].x - 0.025 : 0.975), -1.35],
        })));
        const bnds = () => [0, ...cuts.map((h) => h.x), 1];
        const firstMid = (b, i) => { const j = PAT.indexOf(i); return (b[j] + b[j + 1]) / 2; };
        const vals = [1.6, -0.8, 2.4, 0.7].map((a, i) => L.handle(firstMid(bnds(), i), a, { color: SETCOL[i], constrain: (x, y) => [firstMid(bnds(), i), clampN(y, -1.0, 2.9)] }));
        let st = null;
        v.render(() => {
          const b = bnds(), a = vals.map((h) => h.y), mass = [0, 0, 0, 0];
          for (let j = 0; j < 8; j++) mass[PAT[j]] += b[j + 1] - b[j];
          const I = a.reduce((s, ai, i) => s + ai * mass[i], 0);
          st = { a, mass, I, b };
          vals.forEach((h, i) => { h.x = firstMid(b, i); });
          L.hline(0, { color: 'muted', width: 1 });
          for (let j = 0; j < 8; j++) {
            const i = PAT[j];
            L.rect(b[j], 0, b[j + 1], a[i], { fill: SETCOL[i], fillAlpha: 0.3, color: SETCOL[i], width: 1.5 });
            L.rect(b[j], -1.5, b[j + 1], -1.2, { fill: SETCOL[i], fillAlpha: 0.7, stroke: false });
            if (split.value) L.vline(b[j], { color: 'faint', dash: [3, 3], width: 1 });
          }
          L.text('sets $A_i$', 0.0, -1.03, { size: 11, color: 'muted' });
          L.hline(I, { color: 'green', width: 2, dash: [7, 4] });
          L.tex(`\\textstyle\\int\\varphi\\,dP=${v.fix(I, 2)}`, 1.02, I, { align: 'right', baseline: 'bottom', color: 'green', size: 14, dy: -3 });
          // law panel: horizontal bars, stacked when values coincide
          const pieces = [];
          if (split.value) for (let j = 0; j < 8; j++) pieces.push({ i: PAT[j], val: a[PAT[j]], m: b[j + 1] - b[j] });
          else for (let i = 0; i < 4; i++) pieces.push({ i, val: a[i], m: mass[i] });
          const off = [];
          pieces.forEach((p, k) => {
            const x0 = pieces.slice(0, k).filter((q) => Math.abs(q.val - p.val) < 0.06).reduce((s, q) => s + q.m, 0);
            off.push(x0);
            R.rect(x0, p.val - 0.08, x0 + p.m, p.val + 0.08, { fill: SETCOL[p.i], fillAlpha: 0.75, color: 'panel', width: 1 });
          });
          if (!split.value) for (let i = 0; i < 4; i++) R.tex(`a_${i + 1}`, off[i] + mass[i] + 0.012, a[i], { align: 'left', color: SETCOL[i], size: 13 });
          R.hline(I, { color: 'green', width: 2, dash: [7, 4] });
          R.poly([[0, I], [0.04, I + 0.13], [0.04, I - 0.13]], { fill: 'green', fillAlpha: 0.9, stroke: false });
          cornerIn(R, split.value ? '8 sets' : '4 sets', 'tr', { color: 'muted' });
          v.legend(SETCOL.map((c, i) => [c, `$A_${i + 1}$, value $a_${i + 1}$`, { area: true }]).concat([['green', 'balance point $\\int\\varphi\\,dP$', { dash: true }]]));
        });
        v.readout(() => {
          if (!st) return '';
          const { a, mass, I, b } = st;
          if (split.value) {
            const terms = PAT.map((i, j) => a[i] * (b[j + 1] - b[j]));
            return `Eight-set representation: $\\sum_{j=1}^{8} a_{(j)}\\,|I_j| = ${v.fix(terms.reduce((s, t) => s + t, 0), 4)}$, four-set representation: $${v.fix(I, 4)}$ — the same number.`;
          }
          return `$\\int\\varphi\\,dP=\\sum_i a_i\\,P(A_i) = ${a.map((ai, i) => fmtTerm(v, ai, mass[i])).join(' + ')} = ${v.fix(I, 3)}$`;
        });
      },
    },
    {
      num: '1.4.1',
      kind: 'Lemma',
      name: 'Simple-function integral: positivity, scaling, additivity',
      statement: String.raw`Let $\varphi$ and $\psi$ be simple functions.

(i) If $\varphi\ge0$ a.e., then $\int\varphi\,d\mu\ge0$.
(ii) For every $a\in\R$, $\int a\varphi\,d\mu=a\int\varphi\,d\mu$.
(iii) $\int(\varphi+\psi)\,d\mu=\int\varphi\,d\mu+\int\psi\,d\mu$.`,
      idea: String.raw`(i) and (ii) are read off the definition. For (iii), write $\varphi=\sum a_i1_{A_i}$ and $\psi=\sum b_j1_{B_j}$, padding each with a zero-valued set so both cover the same region. Then $\varphi+\psi=\sum_{i,j}(a_i+b_j)1_{A_i\cap B_j}$ is simple, and $\sum_{i,j}(a_i+b_j)\mu(A_i\cap B_j)$ splits into two sums. Summing the table $\mu(A_i\cap B_j)$ along $j$ gives $\mu(A_i)$ and along $i$ gives $\mu(B_j)$. In probability language: the cells form the joint law of $(\varphi,\psi)$, and the mean of a sum is read off the centre of mass of the joint law.`,
      caption: String.raw`Drag the blue handles (values of $\varphi$ on three intervals) and the orange ones (values of $\psi$; its first set is $[0,0.2)\cup[0.9,1)$), and slide $a$; the dashed lines are the cuts of the common refinement. Right: each cell $A_i\cap B_j$ becomes a disc at $(a\,a_i,\,b_j)$ with area proportional to its probability. Its centre of mass (gold) has coordinates $(a\int\varphi,\int\psi)$, and the green diagonal through it is the level $x+y=\int(a\varphi+\psi)$.`,
      deps: ['prob-1.4.1a'],
      see: ['rca-1.25'],
      tags: ['integration'],
      viz(v) {
        const A = [0, 0.3, 0.75, 1];
        const Bof = (x) => (x < 0.2 || x >= 0.9 ? 0 : x < 0.55 ? 1 : 2);
        const CUTS = [0, 0.2, 0.3, 0.55, 0.75, 0.9, 1];
        const Aof = (x) => (x < 0.3 ? 0 : x < 0.75 ? 1 : 2);
        const L = v.stage({ x: [-0.03, 1.03], y: [-3.7, 4.3], height: 340, weight: 1.3, axes: 'box', gutter: true, xlabel: '$\\omega$', title: '$\\varphi$, $\\psi$ and $a\\varphi+\\psi$ on $\\Omega=[0,1)$' });
        const R = v.stage({ x: [-2.8, 2.8], y: [-1.4, 2.0], height: 340, axes: 'box', gutter: true, xlabel: '$a\\varphi$', ylabel: '$\\psi$', title: 'joint law of $(a\\varphi,\\psi)$' });
        const aS = v.slider('$a$', -1.5, 1.5, 1, { step: 0.05 });
        const ph = [0.9, -0.6, 1.4].map((y, i) => L.handle((A[i] + A[i + 1]) / 2, y, { color: 'accent', constrain: (x, yy) => [(A[i] + A[i + 1]) / 2, clampN(yy, -1, 1.6)] }));
        const ps = [[0.95, 0.5], [0.375, 1.2], [0.725, -0.7]].map(([x, y]) => L.handle(x, y, { color: 'orange', constrain: (xx, yy) => [x, clampN(yy, -1, 1.6)] }));
        let st = null;
        v.render(() => {
          const a = aS.value, av = ph.map((h) => h.y), bv = ps.map((h) => h.y);
          const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          for (let k = 0; k + 1 < CUTS.length; k++) { const c = (CUTS[k] + CUTS[k + 1]) / 2; m[Aof(c)][Bof(c)] += CUTS[k + 1] - CUTS[k]; }
          const Iphi = av.reduce((s, x, i) => s + x * (A[i + 1] - A[i]), 0), Ipsi = bv[0] * 0.3 + bv[1] * 0.35 + bv[2] * 0.35;
          let Isum = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) Isum += (a * av[i] + bv[j]) * m[i][j];
          st = { a, Iphi, Ipsi, Isum };
          L.hline(0, { color: 'muted', width: 1 });
          for (const c of CUTS.slice(1, -1)) L.vline(c, { color: 'faint', dash: [3, 3], width: 1 });
          const phi = (x) => av[Aof(Math.min(x, 0.9999))], psi = (x) => bv[Bof(Math.min(x, 0.9999))];
          L.fn(phi, { domain: [0, 1], color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.12 });
          L.fn(psi, { domain: [0, 1], color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.12 });
          L.fn((x) => a * phi(x) + psi(x), { domain: [0, 1], color: 'green', width: 3 });
          // joint law
          for (let t = -6; t <= 6; t += 0.5) R.line(t + 3, -3, t - 3, 3, { color: 'grid', width: 1 });
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (m[i][j] > 1e-9) {
            R.dot(a * av[i], bv[j], { r: 4 + 30 * Math.sqrt(m[i][j]), color: 'teal', alpha: 0.45 });
            R.text(v.fix(m[i][j], 2), a * av[i], bv[j], { size: 10.5, align: 'center', color: 'ink' });
          }
          const cx = a * Iphi, cy = Ipsi;
          R.line(cx + 3, cy - 3, cx - 3, cy + 3, { color: 'green', width: 2, dash: [7, 4] });
          R.line(cx, -1.4, cx, cy, { color: 'gold', dash: [3, 3], width: 1.2 });
          R.line(-2.8, cy, cx, cy, { color: 'gold', dash: [3, 3], width: 1.2 });
          R.dot(cx, cy, { r: 7, color: 'gold' });
          v.legend([['accent', '$\\varphi$'], ['orange', '$\\psi$'], ['green', '$a\\varphi+\\psi$'], ['teal', 'cell $A_i\\cap B_j$', { dot: true }], ['gold', 'centre of mass', { dot: true }]]);
        });
        v.readout(() => st && `$\\int(a\\varphi+\\psi)\\,dP=\\sum_{i,j}(a\\,a_i+b_j)P(A_i\\cap B_j)=${v.fix(st.Isum, 4)}$ and $a\\int\\varphi\\,dP+\\int\\psi\\,dP=${v.fix(st.a, 2)}\\cdot${v.fix(st.Iphi, 3)}+${v.fix(st.Ipsi, 3)}=${v.fix(st.a * st.Iphi + st.Ipsi, 4)}$.` + (Math.min(...ph.map((h) => h.y)) >= 0 ? ` (i): $\\varphi\\ge0$ and $\\int\\varphi\\,dP=${v.fix(st.Iphi, 3)}\\ge0$.` : ''));
      },
    },
    {
      num: '1.4.2',
      kind: 'Lemma',
      name: 'Monotonicity and a.e. equality for simple integrals',
      statement: String.raw`Suppose an integral of simple functions satisfies (i) and (iii) of Lemma 1.4.1. Then

(iv) if $\varphi\le\psi$ a.e., then $\int\varphi\,d\mu\le\int\psi\,d\mu$;
(v) if $\varphi=\psi$ a.e., then $\int\varphi\,d\mu=\int\psi\,d\mu$.

If (ii) also holds for $a=-1$, then
(vi) $\left|\int\varphi\,d\mu\right|\le\int|\varphi|\,d\mu$.`,
      idea: String.raw`By (iii), $\int\psi=\int\varphi+\int(\psi-\varphi)$, and the last integral is $\ge0$ by (i) because $\psi-\varphi\ge0$ a.e.; this is (iv). Equality a.e. gives $\le$ both ways, so (v) follows. For (vi), $\varphi\le|\varphi|$ and $-\varphi\le|\varphi|$, so (iv) and (ii) bound both $\int\varphi$ and $-\int\varphi$ by $\int|\varphi|$. Durrett proves these three once and reuses the argument at every stage of the construction.`,
      caption: String.raw`$\varphi$ (black) is fixed; $\psi$ (gold) is $\varphi$ plus $h$ on a set $N$. Drag the gold handle to change $h$ (and, for the interval, its position). On finitely many points, or on the uncountable Cantor set, $P(N)=0$ and the integral does not move: for the Cantor set the readout squeezes $\int\psi$ between $\int\varphi$ and $\int\varphi+h(2/3)^n$. On an interval of positive length, the integral shifts by exactly $h\cdot P(N)$. Dashed: $|\varphi|$, for (vi).`,
      deps: ['prob-1.4.1'],
      see: ['rca-1.24', 'pma-11.24a'],
      tags: ['integration'],
      viz(v) {
        const VAL = [0.8, -0.6, 1.4, 0.3], phi = (x) => VAL[Math.min(3, Math.floor(x * 4))];
        const Iphi = VAL.reduce((s, a) => s + a / 4, 0), Iabs = VAL.reduce((s, a) => s + Math.abs(a) / 4, 0);
        const mode = v.select('$N$ =', [{ value: 'pts', label: 'finitely many points' }, { value: 'cantor', label: 'the Cantor set' }, { value: 'int', label: 'an interval' }], 'pts');
        const kS = v.slider('points', 1, 9, 4, { int: true });
        const nS = v.slider('Cantor level $n$', 0, 7, 3, { int: true });
        const lS = v.slider('length $\\ell$', 0.02, 0.4, 0.15, { step: 0.01 });
        const S = v.stage({ x: [-0.03, 1.03], y: [-1.6, 3.6], height: 330, axes: 'box', gutter: true, xlabel: '$\\omega$', title: '$\\psi=\\varphi+h\\,1_N$ on $\\Omega=[0,1)$, $P$ = length' });
        const H = S.handle(0.6, phi(0.6) + 1.3, {
          color: 'gold', label: 'h',
          constrain: (x, y) => { const xx = mode.value === 'int' ? clampN(x, 0.02, 0.98 - lS.value) : mode.value === 'cantor' ? 2 / 3 : clampN(x, 0.06, 0.94); return [xx, clampN(y, phi(xx) - 2, phi(xx) + 2.2)]; },
        });
        const cantor = (n) => { let I = [[0, 1]]; for (let k = 0; k < n; k++) I = I.flatMap(([a, b]) => { const t = (b - a) / 3; return [[a, a + t], [b - t, b]]; }); return I; };
        let st = null;
        v.render(() => {
          const md = mode.value; kS.el.hidden = md !== 'pts'; nS.el.hidden = md !== 'cantor'; lS.el.hidden = md !== 'int';
          if (md === 'cantor') H.x = 2 / 3;
          const h = H.y - phi(H.x);
          S.hline(0, { color: 'muted', width: 1 });
          S.fn((x) => Math.abs(phi(Math.min(x, 0.9999))), { domain: [0, 1], color: 'muted', width: 1.4, dash: [5, 4] });
          S.fn((x) => phi(Math.min(x, 0.9999)), { domain: [0, 1], color: 'ink', width: 2.6, fill: 'ink', fillAlpha: 0.07 });
          let Ipsi, note;
          if (md === 'pts') {
            const k = kS.value, xs = Array.from({ length: k }, (_, j) => clampN(H.x + (j - Math.floor((k - 1) / 2)) * 0.055, 0.01, 0.99));
            for (const x of xs) { S.line(x, phi(x), x, phi(x) + h, { color: 'gold', width: 1.6 }); S.dot(x, phi(x) + h, { color: 'gold', r: 4 }); S.dot(x, phi(x), { hollow: true, color: 'ink', r: 3.5 }); }
            Ipsi = Iphi; note = `$N$ = ${k} point${k > 1 ? 's' : ''}, $P(N)=0$`;
          } else if (md === 'cantor') {
            const n = nS.value, I = cantor(n);
            for (const [a, b] of I) {
              const cuts = [a, ...[0.25, 0.5, 0.75].filter((c) => c > a && c < b), b];
              for (let j = 0; j + 1 < cuts.length; j++) { const y0 = phi(Math.min((cuts[j] + cuts[j + 1]) / 2, 0.9999)); S.rect(cuts[j], y0, cuts[j + 1], y0 + h, { fill: 'gold', fillAlpha: 0.3, stroke: false }); }
              S.rect(a, -1.45, b, -1.3, { fill: 'gold', fillAlpha: 0.85, stroke: false });
            }
            S.text(`$C_${n}$: ${2 ** n} intervals, total length $(2/3)^{${n}}$`, 0.02, -1.15, { size: 11, color: 'muted' });
            Ipsi = Iphi; note = `$\\int\\varphi \\le \\int\\psi \\le \\int\\varphi + h(2/3)^{${n}}$`;
            st = { md, h, n, Ipsi };
          } else {
            const a = H.x, b = a + lS.value;
            S.rect(a, phi(Math.min(a, 0.9999)), b, phi(Math.min(a, 0.9999)) + h, { fill: 'gold', fillAlpha: 0.35, stroke: false });
            S.fn((x) => phi(x) + h, { domain: [a, b], color: 'gold', width: 2.6 });
            S.rect(a, -1.45, b, -1.3, { fill: 'gold', fillAlpha: 0.85, stroke: false });
            Ipsi = (() => { const cuts = [a, 0.25, 0.5, 0.75, b].filter((c) => c >= a && c <= b).sort((p, q) => p - q); let s = 0; for (let i = 0; i + 1 < cuts.length; i++) s += h * (cuts[i + 1] - cuts[i]); return Iphi + s; })();
            note = `$P(N)=${v.fix(lS.value, 2)}$`;
          }
          cornerIn(S, note, 'tl', { color: 'muted' });
          st = { md, h, Ipsi, n: nS.value };
          v.legend([['ink', '$\\varphi$'], ['gold', '$\\psi$ where it differs from $\\varphi$', { area: true }], ['muted', '$|\\varphi|$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const tail = ` (vi): $|\\int\\varphi| = ${v.fix(Math.abs(Iphi), 3)}\\le \\int|\\varphi| = ${v.fix(Iabs, 3)}$.`;
          if (st.md === 'cantor') return `$${v.fix(Iphi, 4)}\\le\\int\\psi\\le ${v.fix(Iphi, 4)} + ${v.fix(st.h, 2)}\\cdot(2/3)^{${st.n}} = ${v.fix(Iphi + Math.max(0, st.h) * (2 / 3) ** st.n, 4)}$ for every $n$, so $\\int\\psi=\\int\\varphi$ (for $h<0$ the inequalities flip).` + tail;
          if (st.md === 'pts') return `$\\int\\psi\\,dP = \\int\\varphi\\,dP = ${v.fix(Iphi, 4)}$: changing $\\varphi$ on a null set changes nothing (v).` + tail;
          return `$\\int\\psi - \\int\\varphi = h\\,P(N) = ${v.fix(st.Ipsi - Iphi, 4)}$` + (st.h >= 0 ? ' $\\ge 0$, as (iv) demands for $\\psi\\ge\\varphi$.' : ' $\\le 0$, since now $\\psi\\le\\varphi$.') + tail;
        });
      },
    },
    {
      num: '1.4.3',
      kind: 'Lemma',
      name: 'Integral of bounded functions on sets of finite measure',
      statement: String.raw`Let $\mu(E)<\infty$ and let $f$ be bounded and vanish off $E$. Taking simple functions that vanish off $E$, the lower and upper integrals agree:
$$\sup_{\varphi\le f}\int\varphi\,d\mu=\inf_{\psi\ge f}\int\psi\,d\mu,$$
and $\int f\,d\mu$ is defined as this common value. For bounded $f,g$ vanishing off $E$:

(i) if $f\ge0$ a.e., then $\int f\ge0$;
(ii) $\int af=a\int f$ for every $a\in\R$;
(iii) $\int(f+g)=\int f+\int g$;
(iv) if $g\le f$ a.e., then $\int g\le\int f$;
(v) if $g=f$ a.e., then $\int g=\int f$;
(vi) $\left|\int f\right|\le\int|f|$.`,
      idea: String.raw`If $|f|\le M$, slice the **range** into levels $kM/n$ and let $E_k=\{x\in E:(k-1)M/n<f(x)\le kM/n\}$. The simple functions $\psi_n=\sum\frac{kM}{n}1_{E_k}$ and $\varphi_n=\psi_n-\frac Mn1_E$ trap $f$, and their integrals differ by exactly $M\mu(E)/n$, so sup and inf agree. For (ii) with $a<0$, multiplying by $a$ swaps lower and upper functions; (iii) follows from $\psi_1+\psi_2\ge f+g$, then applying it to $-f,-g$; (iv)–(vi) come from Lemma 1.4.2.`,
      caption: String.raw`The range is cut into $2n$ levels (orange lines). Blue $\varphi_n$ and orange $\psi_n$ trap $f$ in a band of height $M/n$, whatever $f$ does in the $\omega$ direction; $\sin(1/\omega)$ oscillates infinitely often near $0$, so slicing by $\omega$ would fail there. Drag the gold handle to pick a level band: its preimage $E_k$, a union of infinitely many intervals, is marked on the strip. Right: lower and upper integrals for every $n$, always exactly $M\mu(E)/n$ apart.`,
      deps: ['prob-1.4.2'],
      see: ['pma-11.21'],
      tags: ['integration'],
      viz(v) {
        const R0 = v.rng(11), C = Array.from({ length: 10 }, (_, k) => [R0.normal() / (k + 1), R0.uniform(0, 6.283)]);
        const pathRaw = (x) => C.reduce((s, [c, th], k) => s + c * Math.sin(2 * Math.PI * (k + 1) * x + th), 0);
        let pmax = 0; for (let i = 0; i <= 2000; i++) pmax = Math.max(pmax, Math.abs(pathRaw(i / 2000)));
        const FN = {
          sin: { label: '$\\sin(1/\\omega)$', f: (x) => (x <= 0 ? 0 : Math.sin(1 / x)) },
          path: { label: 'a random path', f: (x) => (0.95 * (pathRaw(x) + 0.35 * pmax)) / (1.35 * pmax) },
        };
        const laws = {};
        const lawFor = (k) => {
          if (laws[k]) return laws[k];
          let vals = [], wts = [];
          if (k === 'sin') { // substitute t = 1/ω: weight dt/t² on [1, T], plus the tail (1/T) spread by the arcsine law
            const T = 400, dt = 0.004;
            for (let t = 1 + dt / 2; t < T; t += dt) { vals.push(Math.sin(t)); wts.push(dt / (t * t)); }
            for (let j = 0; j < 1000; j++) { vals.push(Math.sin((2 * Math.PI * (j + 0.5)) / 1000)); wts.push(1 / T / 1000); }
          } else { const N = 20000; for (let i = 0; i < N; i++) { vals.push(FN.path.f((i + 0.5) / N)); wts.push(1 / N); } }
          return (laws[k] = weightedLaw(vals, wts));
        };
        const which = v.select('$f$ =', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const nS = v.slider('$n$ (levels $kM/n$)', 1, 12, 4, { int: true });
        const L = v.stage({ x: [-0.02, 1.04], y: [-1.45, 1.15], height: 330, weight: 1.6, axes: 'box', gutter: true, xlabel: '$\\omega$', title: '$\\varphi_n\\le f\\le\\psi_n$ on $E=[0,1]$, $M=1$' });
        const Rt = v.stage({ x: [0, 12.8], y: [-1.1, 1.3], height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: 'lower and upper integrals' });
        const band = L.handle(1.02, 0.55, { color: 'gold', constrain: (x, y) => [1.02, clampN(y, -0.999, 0.999)] });
        let st = null;
        v.render(() => {
          const F = FN[which.value], law = lawFor(which.value), n = nS.value, M = 1, d = M / n;
          const psi = (x) => d * Math.ceil(F.f(x) / d - 1e-12), phi = (x) => psi(x) - d;
          const k = Math.ceil(band.y / d - 1e-12), lo = (k - 1) * d, hi = k * d;
          const muEk = law.G(hi) - law.G(lo);
          for (let j = -n; j <= n; j++) L.hline(j * d, { color: 'orange', alpha: 0.35, width: 1 });
          L.hband(lo, hi, { color: 'gold', alpha: 0.16 });
          L.fn(psi, { domain: [0.0005, 1], color: 'orange', width: 1.6, n: 3000 });
          L.fn(phi, { domain: [0.0005, 1], color: 'accent', width: 1.6, n: 3000 });
          L.fn(F.f, { domain: [0.0005, 1], color: 'ink', width: 1.4, n: 3000 });
          // the preimage E_k on the strip, from a fine grid
          const N = 4000; let run = null;
          for (let i = 0; i <= N; i++) {
            const x = (i + 0.5) / N, inside = i < N && F.f(x) > lo && F.f(x) <= hi;
            if (inside && run == null) run = i / N;
            if (!inside && run != null) { L.rect(run, -1.38, i / N, -1.22, { fill: 'gold', fillAlpha: 0.85, stroke: false }); run = null; }
          }
          L.text(`$E_k$: $\\mu(E_k)=${v.fix(muEk, 3)}$`, 0.62, -1.08, { size: 11, color: 'muted' });
          // lower / upper integrals for every n
          const ups = [], lows = [];
          for (let m = 1; m <= 12; m++) {
            const dm = M / m; let up = 0;
            for (let j = -m + 1; j <= m; j++) up += j * dm * (law.G(j * dm) - law.G((j - 1) * dm));
            up += -m * dm * law.G(-M); // values exactly at −M (measure zero here)
            ups.push([m, up]); lows.push([m, up - dm]);
          }
          Rt.setView(null, [Math.min(...lows.map((p) => p[1])) - 0.12, Math.max(...ups.map((p) => p[1])) + 0.18]);
          Rt.hline(law.mean, { color: 'green', dash: [6, 4], width: 1.8 });
          for (let m = 0; m < 12; m++) Rt.line(ups[m][0], lows[m][1], ups[m][0], ups[m][1], { color: m + 1 === n ? 'gold' : 'faint', width: m + 1 === n ? 3 : 2 });
          Rt.dots(ups, { color: 'orange', r: 3.5 }); Rt.dots(lows, { color: 'accent', r: 3.5 });
          cornerIn(Rt, `$\\int f=${v.fix(law.mean, 4)}$`, 'tr', { color: 'green', size: 13 });
          st = { up: ups[n - 1][1], low: lows[n - 1][1], I: law.mean, abs: law.absMean, n, muEk, k };
          v.legend([['ink', '$f$'], ['accent', '$\\varphi_n$ and $\\int\\varphi_n$'], ['orange', '$\\psi_n$ and $\\int\\psi_n$'], ['gold', 'chosen band and its preimage $E_k$', { area: true }]]);
        });
        v.readout(() => st && `$n=${st.n}$: $\\int\\varphi_n = ${v.fix(st.low, 4)} \\le \\int f = ${v.fix(st.I, 4)} \\le \\int\\psi_n = ${v.fix(st.up, 4)}$, gap $M\\mu(E)/n = ${v.fix(1 / st.n, 4)}$. (vi): $|\\int f| = ${v.fix(Math.abs(st.I), 4)} \\le \\int|f| = ${v.fix(st.abs, 4)}$.`);
      },
    },
    {
      num: '1.4.4',
      kind: 'Lemma',
      name: 'Truncations approximate the integral of f ≥ 0',
      statement: String.raw`For measurable $f\ge0$ define
$$\int f\,d\mu=\sup\Big\{\int h\,d\mu:\ 0\le h\le f,\ h\text{ bounded},\ \mu(\{h>0\})<\infty\Big\},$$
which may be $+\infty$. If $E_n\uparrow\Omega$ with $\mu(E_n)<\infty$, then
$$\int_{E_n} f\wedge n\,d\mu\ \uparrow\ \int f\,d\mu\qquad(n\to\infty).$$`,
      idea: String.raw`Each $(f\wedge n)1_{E_n}$ belongs to the class in the supremum, so the left side increases and stays below $\int f$. Conversely, take an $h$ from the class with $h\le M$. For $n\ge M$, $\int_{E_n}f\wedge n\ge\int h-\int_{E_n^c}h$, and $\int_{E_n^c}h\le M\mu(E_n^c\cap\{h>0\})\to0$ by continuity of measure, since $\{h>0\}$ has finite measure. So the limit is at least $\int h$ for every admissible $h$. Truncation fights both kinds of infinity at once: tall values (cut at height $n$) and infinite measure (cut to $E_n$).`,
      caption: String.raw`Both axes are logarithmic, so a tall spike near $0$ and a long tail to $\infty$ fit on one picture. The shaded region is the truncation $f\wedge n$ on $E_n=(0,n]$: the orange lines are the height cap $n$ and the cut at $x=n$. Slide $n$; on the right, $\int_{E_n}f\wedge n$ climbs to $\int f$, which is finite for the first two densities and infinite for the last two.`,
      deps: ['prob-1.4.3'],
      see: ['rca-1.17'],
      tags: ['integration'],
      viz(v) {
        const M = v.M;
        const FN = {
          gam: { label: 'Gamma(½) density', f: (x) => Math.exp(-x) / Math.sqrt(Math.PI * x), lim: 1, ymax: 1.12 },
          sq: { label: '$x^{-1/2}1_{(0,1]}$', f: (x) => (x <= 1 ? x ** -0.5 : 0), lim: 2, ymax: 2.25 },
          tail: { label: '$1/(1+x)$', f: (x) => 1 / (1 + x), lim: Infinity, ymax: 7.6 },
          inv: { label: '$x^{-1}1_{(0,1]}$', f: (x) => (x <= 1 ? 1 / x : 0), lim: Infinity, ymax: 8.6 },
        };
        const I = (k, n) => {
          if (k === 'sq') return 2 - 1 / n;
          if (k === 'tail') return Math.log1p(n);
          if (k === 'inv') return 1 + Math.log(n);
          let lo = -60, hi = 2; // log x* with f(x*) = n
          for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (FN.gam.f(Math.exp(m)) > n) lo = m; else hi = m; }
          const xs = Math.exp(hi); return n * xs + (M.gammaP(0.5, n) - M.gammaP(0.5, xs));
        };
        const which = v.select('$f$ =', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'gam');
        const nS = v.slider('$n$', 1, 1000, 6, { log: true });
        const L = v.stage({ x: [1e-4, 2e3], y: [1e-3, 3e3], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: '$f$ and its truncation $f\\wedge n$ on $E_n=(0,n]$ (log–log)' });
        const R = v.stage({ x: [1, 1000], y: [0, 1.12], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\int_{E_n} f\\wedge n\\,dx$' });
        let st = null;
        v.render(() => {
          const k = which.value, F = FN[k], n = nS.value;
          const cap = (x) => (x <= n ? Math.min(F.f(x), n) : NaN);
          L.fn(cap, { domain: [1e-4, n], fill: 'accent', fillAlpha: 0.22, base: 1e-3, color: 'accent', width: 2.4 });
          L.fn(F.f, { color: 'ink', width: 1.6 });
          L.hline(n, { color: 'orange', dash: [6, 4], width: 1.6 }); L.vline(n, { color: 'orange', dash: [6, 4], width: 1.6 });
          L.tex('n', 1.4e-4, n, { color: 'orange', align: 'left', baseline: 'bottom', dy: -3 });
          L.tex('x=n', n, 1.5e-3, { color: 'orange', align: 'left', baseline: 'bottom', dx: 5 });
          R.setView(null, [0, F.ymax]);
          if (isFinite(F.lim)) { R.hline(F.lim, { color: 'green', dash: [6, 4], width: 1.8 }); R.tex(`\\textstyle\\int f=${F.lim}`, 1.3, F.lim, { align: 'left', baseline: 'bottom', color: 'green', dy: -3 }); }
          else cornerIn(R, '$\\int f=\\infty$: the climb never stops', 'tl', { color: 'red' });
          R.fn((m) => I(k, m), { color: 'accent', width: 2.4 });
          const In = I(k, n); R.dot(n, In, { color: 'gold', r: 5.5 });
          st = { In, lim: F.lim, n };
          v.legend([['ink', '$f$'], ['accent', '$f\\wedge n$ on $E_n$', { area: true }], ['orange', 'cap $n$ and cut $x=n$', { dash: true }]]);
        });
        v.readout(() => st && `$n=${v.fmt(st.n, 3)}$: $\\int_{E_n} f\\wedge n\\,dx = ${v.fix(st.In, 4)}$, ` + (isFinite(st.lim) ? `short of $\\int f = ${st.lim}$ by $${v.fix(st.lim - st.In, 4)}$.` : 'still growing (like $\\log n$): $\\int f=\\infty$.'));
      },
    },
    {
      num: '1.4.5',
      kind: 'Lemma',
      name: 'Properties of the integral of nonnegative functions',
      statement: String.raw`For measurable $f,g\ge0$ (integrals may be $+\infty$):

(i) $\int f\,d\mu\ge0$;
(ii) $\int af\,d\mu=a\int f\,d\mu$ for $a>0$;
(iii) $\int(f+g)\,d\mu=\int f\,d\mu+\int g\,d\mu$;
(iv) if $0\le g\le f$ a.e., then $\int g\le\int f$;
(v) if $0\le g=f$ a.e., then $\int g=\int f$.`,
      idea: String.raw`(i) and (ii) are immediate from the supremum definition. For (iii), $\ge$ holds because $h\le f$ and $k\le g$ give $h+k\le f+g$. For $\le$, use $(a+b)\wedge n\le a\wedge n+b\wedge n$: integrating over $E_n$ (Lemma 1.4.3(iv)) and letting $n\to\infty$ with Lemma 1.4.4 turns the truncated inequality into $\int(f+g)\le\int f+\int g$. (iv) and (v) follow as in Lemma 1.4.2.`,
      caption: String.raw`$f=\tfrac12x^{-1/2}$ (blue, $\int f=1$) and $g=\tfrac14|x-\tfrac12|^{-\alpha}$ (orange, stacked on top), both unbounded. The black line is the cap $n$. Red hatching marks where $f\wedge n+g\wedge n$ exceeds $(f+g)\wedge n$, the slack in the key inequality. Right: both truncated integrals against $n$; they squeeze together onto $\int f+\int g$. Push $\alpha$ past $1$ and both sides become infinite together.`,
      deps: ['prob-1.4.3', 'prob-1.4.4'],
      see: ['pma-11.29', 'rca-1.24'],
      tags: ['integration'],
      viz(v) {
        const c = 0.25;
        const f = (x) => 0.5 / Math.sqrt(x), Ifn = (n) => (n >= 0.5 ? 1 - 1 / (4 * n) : n);
        const aS = v.slider('$\\alpha$', 0.2, 1.3, 0.6, { step: 0.01 });
        const nS = v.slider('cap $n$', 1, 300, 4, { log: true });
        const L = v.stage({ x: [0, 1], y: [0, 9], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$x$', title: '$f$ and $g$ stacked, with the cap $n$' });
        const R = v.stage({ x: [1, 300], y: [0, 3], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'truncated integrals' });
        let cache = null;
        const curves = (al) => {
          if (cache && cache.al === al) return cache;
          const g = (x) => c * Math.abs(x - 0.5) ** -al;
          const Ign = (n) => { const ts = (c / n) ** (1 / al), t = Math.min(ts, 0.5); const tailI = ts < 0.5 ? (Math.abs(al - 1) < 1e-9 ? c * Math.log(0.5 / ts) : (c * (0.5 ** (1 - al) - ts ** (1 - al))) / (1 - al)) : 0; return 2 * (n * t + tailI); };
          const N = 40000, Ian = (n) => { let s = 0; for (let i = 0; i < N; i++) { const x = (i + 0.5) / N; s += Math.min(f(x) + g(x), n); } return s / N; };
          const ns = Array.from({ length: 41 }, (_, i) => 300 ** (i / 40));
          return (cache = { al, g, Ign, Ian, A: ns.map((n) => [n, Ian(n)]), B: ns.map((n) => [n, Ifn(n) + Ign(n)]), Ig: al < 1 ? (2 * c * 0.5 ** (1 - al)) / (1 - al) : Infinity });
        };
        let st = null;
        v.render(() => {
          const al = aS.value, n = nS.value, C = curves(al), g = C.g;
          L.clip(() => {
            L.fn(f, { domain: [1e-4, 1], fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.6 });
            L.between((x) => f(x) + g(x), f, 1e-4, 1, { fill: 'orange', fillAlpha: 0.3, n: 800 });
            L.fn((x) => f(x) + g(x), { domain: [1e-4, 1], color: 'orange', width: 1.8, n: 1200 });
            const top = (x) => Math.min(f(x), n) + Math.min(g(x), n);
            L.between((x) => Math.max(n, top(x)), () => n, 1e-4, 1, { fill: 'red', fillAlpha: 0.12, hatch: 'red', n: 1200 });
          });
          if (n <= 9) { L.hline(n, { color: 'ink', width: 1.8 }); L.tex('n', 0.985, n, { align: 'right', baseline: 'bottom', dy: -3 }); }
          else cornerIn(L, `cap $n=${v.fmt(n, 3)}$ is above the panel`, 'tr', { color: 'muted' });
          const lim = 1 + C.Ig, ymax = isFinite(lim) ? Math.max(2.4, lim * 1.15) : 6.5;
          R.setView(null, [0, ymax]);
          if (isFinite(lim)) { R.hline(lim, { color: 'green', dash: [6, 4], width: 1.8 }); R.tex(`\\textstyle\\int f+\\int g = ${v.fix(lim, 3)}`, 1.2, lim, { align: 'left', baseline: 'bottom', color: 'green', dy: -3 }); }
          else cornerIn(R, '$\\int g=\\infty$: both sides diverge', 'tl', { color: 'red' });
          R.path(C.B, { color: 'purple', width: 2.4 });
          R.path(C.A, { color: 'teal', width: 2.4, dash: [6, 4] });
          const a = C.Ian(n), b = Ifn(n) + C.Ign(n);
          R.vline(n, { color: 'gold', width: 1.2, alpha: 0.7 }); R.dot(n, a, { color: 'teal', r: 4.5 }); R.dot(n, b, { color: 'purple', r: 4.5 });
          st = { a, b, lim, n };
          v.legend([['accent', '$f$', { area: true }], ['orange', '$g$ (stacked)', { area: true }], ['red', 'slack $f\\wedge n+g\\wedge n-(f+g)\\wedge n$', { area: true }], ['teal', '$\\int(f+g)\\wedge n$', { dash: true }], ['purple', '$\\int f\\wedge n+\\int g\\wedge n$']]);
        });
        v.readout(() => st && `$n=${v.fmt(st.n, 3)}$: $\\int_0^1(f+g)\\wedge n = ${v.fix(st.a, 4)} \\le \\int_0^1 f\\wedge n+\\int_0^1 g\\wedge n = ${v.fix(st.b, 4)}$` + (isFinite(st.lim) ? `; both tend to $\\int f+\\int g = ${v.fix(st.lim, 4)}$.` : '; both tend to $\\infty$.'));
      },
    },
    {
      num: '1.4.6',
      kind: 'Lemma',
      name: 'Integral of a difference of nonnegative functions',
      statement: String.raw`Call $f$ integrable when $\int|f|\,d\mu<\infty$, and set $\int f\,d\mu=\int f^+\,d\mu-\int f^-\,d\mu$, where $f^+=f\vee0$ and $f^-=(-f)\vee0$. If $f=f_1-f_2$ with $f_1,f_2\ge0$ and $\int f_i\,d\mu<\infty$, then
$$\int f\,d\mu=\int f_1\,d\mu-\int f_2\,d\mu.$$`,
      idea: String.raw`From $f_1-f_2=f^+-f^-$ we get $f_1+f^-=f_2+f^+$, an identity between sums of nonnegative functions. Additivity for nonnegative functions (Lemma 1.4.5(iii)) gives $\int f_1+\int f^-=\int f_2+\int f^+$. Every term is finite, so it can be rearranged into the claim. The finiteness is essential: with $\int f_1=\int f_2=\infty$ the right side would read $\infty-\infty$.`,
      caption: String.raw`The black function $f$ is written as $f_1-f_2$ with $f_1=f^++h$ (green) and $f_2=f^-+h$ (red), where $h$ is the gold bump. Drag its peak to move and scale it. Right: the ledger. $\int f_1$ and $\int f_2$ both grow with $h$, but their difference stays equal to $\int f^+-\int f^-$. Switch the bump to $h\propto|x-c|^{-1}$: now $\int f_i=\infty$, and the difference is undefined.`,
      deps: ['prob-1.4.5'],
      see: ['rca-1.15', 'pma-11.22'],
      tags: ['integration'],
      viz(v) {
        const f = (x) => 1.1 * Math.sin(2 * Math.PI * x) + 0.45 * Math.sin(6 * Math.PI * x) + 0.2;
        const N = 8000, grid = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
        const Ip = grid.reduce((s, x) => s + Math.max(0, f(x)), 0) / N, Im = grid.reduce((s, x) => s + Math.max(0, -f(x)), 0) / N;
        const bad = v.toggle('non-integrable bump $h\\propto 1/|x-c|$', false);
        const L = v.stage({ x: [-0.02, 1.02], y: [-1.9, 4.2], height: 330, weight: 1.5, axes: 'box', gutter: true, xlabel: '$x$', title: '$f=f_1-f_2$ with $f_1=f^++h$, $f_2=f^-+h$' });
        const R = v.stage({ x: [0.2, 7.3], y: [-0.38, 2.4], height: 330, axes: 'box', gutter: true, xticks: [], title: 'the ledger' });
        const H = L.handle(0.62, 1.4, { color: 'gold', label: 'h', constrain: (x, y) => [clampN(x, 0.08, 0.92), clampN(y, 0.05, 3.8)] });
        const w = 0.07;
        let st = null;
        v.render(() => {
          const c = H.x, A = H.y;
          const h = bad.value ? (x) => Math.min(9, (0.04 * A) / Math.abs(x - c)) : (x) => A * Math.exp(-((x - c) ** 2) / (2 * w * w));
          const Ih = bad.value ? Infinity : grid.reduce((s, x) => s + h(x), 0) / N;
          const f1 = (x) => Math.max(0, f(x)) + h(x), f2 = (x) => Math.max(0, -f(x)) + h(x);
          L.hline(0, { color: 'muted', width: 1 });
          L.clip(() => {
            L.fn(f1, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.12, n: 1200, connect: true });
            L.fn((x) => -f2(x), { color: 'red', width: 2, fill: 'red', fillAlpha: 0.12, n: 1200, connect: true });
            L.fn(h, { color: 'gold', width: 1.6, dash: [5, 4], n: 1200, connect: true });
            L.fn(f, { color: 'ink', width: 2.6 });
          });
          cornerIn(L, '$-f_2$ drawn below the axis', 'bl', { color: 'muted' });
          const bars = [[1, Ip + Ih, 'green', '\\int f_1'], [2, Im + Ih, 'red', '\\int f_2'], [3, Ip - Im, 'ink', '\\text{diff}'], [4.6, Ip, 'green', '\\int f^+'], [5.6, Im, 'red', '\\int f^-'], [6.6, Ip - Im, 'ink', '\\text{diff}']];
          for (const [x, val, col, lab] of bars) {
            const undefinedDiff = !isFinite(Ih) && x === 3;
            const top = isFinite(val) ? Math.min(val, 2.3) : 2.3;
            if (!undefinedDiff) R.rect(x - 0.35, 0, x + 0.35, top, { fill: col, fillAlpha: col === 'ink' ? 0.25 : 0.55, stroke: false });
            if (!isFinite(val) && !undefinedDiff) R.arrow(x, 2.0, x, 2.38, { color: col, width: 2 });
            R.tex(lab, x, -0.2, { size: 13, color: col === 'ink' ? 'ink' : col });
            R.text(undefinedDiff ? '∞ − ∞ ?' : isFinite(val) ? v.fix(val, 3) : '∞', x, isFinite(val) && !undefinedDiff ? top + 0.1 : 1.2, { size: 11.5, align: 'center', color: undefinedDiff ? 'red' : 'ink' });
          }
          R.line(3.8, -0.33, 3.8, 2.35, { color: 'grid', width: 1 });
          if (isFinite(Ih)) R.line(2.6, Ip - Im, 7.0, Ip - Im, { color: 'gold', dash: [4, 3], width: 1.4 });
          st = { Ih, Ip, Im };
          v.legend([['ink', '$f$'], ['green', '$f_1=f^++h$', { area: true }], ['red', '$f_2=f^-+h$ (drawn as $-f_2$)', { area: true }], ['gold', 'bump $h$', { dash: true }]]);
        });
        v.readout(() => st && (isFinite(st.Ih) ? `$\\int f_1-\\int f_2 = (${v.fix(st.Ip + st.Ih, 3)}) - (${v.fix(st.Im + st.Ih, 3)}) = ${v.fix(st.Ip - st.Im, 4)} = \\int f^+ - \\int f^-$, for any bump with $\\int h = ${v.fix(st.Ih, 3)} < \\infty$.` : `$\\int h=\\infty$, so $\\int f_1=\\int f_2=\\infty$ and $\\int f_1-\\int f_2$ means nothing; yet $\\int f = \\int f^+-\\int f^- = ${v.fix(st.Ip - st.Im, 4)}$ is still well defined.`));
      },
    },
    {
      num: '1.4.7',
      kind: 'Theorem',
      name: 'Linearity and monotonicity of the integral',
      statement: String.raw`Let $f$ and $g$ be integrable. Then

(i) if $f\ge0$ a.e., then $\int f\,d\mu\ge0$;
(ii) $\int af\,d\mu=a\int f\,d\mu$ for every $a\in\R$;
(iii) $\int(f+g)\,d\mu=\int f\,d\mu+\int g\,d\mu$;
(iv) if $g\le f$ a.e., then $\int g\,d\mu\le\int f\,d\mu$;
(v) if $g=f$ a.e., then $\int g\,d\mu=\int f\,d\mu$;
(vi) $\left|\int f\,d\mu\right|\le\int|f|\,d\mu$.

Special cases of notation: $\int f(x)\,dx$ for Lebesgue measure, $\int f(x)\,dG(x)$ for the Stieltjes measure of $G$, and $\sum_{i\in\Omega}f(i)$ for counting measure on a countable set, so every statement about integrals is also a statement about absolutely convergent sums.`,
      idea: String.raw`For (ii), $(af)^+=af^+$ when $a>0$ and $(af)^+=|a|f^-$ when $a<0$. For (iii), write $f+g=(f^++g^+)-(f^-+g^-)$, a difference of integrable nonnegative functions. Lemma 1.4.6 evaluates its integral, and additivity for nonnegative functions (Lemma 1.4.5) splits each part. (iv)–(vi) follow from (i)–(iii) by Lemma 1.4.2.`,
      caption: String.raw`Slide $a$ and $b$. Left: $h=af+bg$ with its positive part (green) and negative part (red). Right: a waterfall. The first four steps add $\int(af)^\pm$ and $\int(bg)^\pm$; the last two add $\int h^+$ and subtract $\int h^-$ directly. Both columns land on the same level, $\int h=a\int f+b\int g$. Choose counting measure to see the same theorem as a statement about absolutely convergent series.`,
      deps: ['prob-1.4.6', 'prob-1.4.5'],
      see: ['rca-1.32'],
      tags: ['integration'],
      viz(v) {
        const MEAS = { leb: { label: 'Lebesgue measure on $\\R$' }, cnt: { label: 'counting measure on $\\{0,1,2,\\dots\\}$' } };
        const fL = (x) => 1.2 * Math.exp(-((x + 1.3) ** 2)) - 0.9 * Math.exp(-2 * (x - 1.4) ** 2);
        const gL = (x) => 0.8 * Math.sin(2 * x) * Math.exp(-(x * x) / 4) + 0.5 * Math.exp(-((x - 2.2) ** 2));
        const fC = (i) => (-0.8) ** i, gC = (i) => (1.5 * (i % 2 ? -1 : 1)) / (i + 1) ** 2;
        const meas = v.select('', Object.entries(MEAS).map(([value, o]) => ({ value, label: o.label })), 'leb');
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.05 }), bS = v.slider('$b$', -2, 2, 0.8, { step: 0.05 });
        const L = v.stage({ x: [-5, 5], y: [-3.2, 3.2], height: 320, weight: 1.3, axes: 'box', gutter: true, title: '$h=af+bg$' });
        const R = v.stage({ x: [0.4, 8.3], y: [-2, 2], height: 320, axes: 'box', gutter: true, xticks: [[1, '∫(af)⁺'], [2, '∫(af)⁻'], [3, '∫(bg)⁺'], [4, '∫(bg)⁻'], [5, 'sum'], [6.2, '∫h⁺'], [7, '∫h⁻'], [7.9, '∫h']], title: 'waterfall of integrals' });
        const integ = (F) => {
          if (meas.value === 'leb') { const N = 6000, a = -9, b = 9, hh = (b - a) / N; let p = 0, m = 0; for (let i = 0; i < N; i++) { const y = F(a + (i + 0.5) * hh); if (y > 0) p += y; else m -= y; } return [p * hh, m * hh]; }
          let p = 0, m = 0; for (let i = 0; i < 20000; i++) { const y = F(i); if (y > 0) p += y; else m -= y; } return [p, m];
        };
        let st = null;
        v.render(() => {
          const a = aS.value, b = bS.value, cnt = meas.value === 'cnt';
          const f = cnt ? fC : fL, g = cnt ? gC : gL, h = (x) => a * f(x) + b * g(x);
          L.setView(cnt ? [-0.6, 15.6] : [-5, 5], null); L.setLabels(cnt ? '$i$' : '$x$');
          L.hline(0, { color: 'muted', width: 1 });
          if (cnt) {
            for (let i = 0; i <= 15; i++) { const y = h(i); L.line(i, 0, i, y, { color: y >= 0 ? 'green' : 'red', width: 3 }); L.dot(i, y, { color: y >= 0 ? 'green' : 'red', r: 4 }); L.dot(i + 0.18, a * f(i), { color: 'accent', r: 2.5 }); L.dot(i - 0.18, b * g(i), { color: 'orange', r: 2.5 }); }
          } else {
            L.fn((x) => Math.max(0, h(x)), { color: 'green', width: 0.01, fill: 'green', fillAlpha: 0.25 });
            L.fn((x) => Math.min(0, h(x)), { color: 'red', width: 0.01, fill: 'red', fillAlpha: 0.25 });
            L.fn((x) => a * f(x), { color: 'accent', width: 1.4, dash: [5, 4] });
            L.fn((x) => b * g(x), { color: 'orange', width: 1.4, dash: [5, 4] });
            L.fn(h, { color: 'ink', width: 2.4 });
          }
          const [afp, afm] = integ((x) => a * f(x)), [bgp, bgm] = integ((x) => b * g(x)), [hp, hm] = integ(h);
          const steps = [[1, afp, 'green', '(af)^+'], [2, -afm, 'red', '(af)^-'], [3, bgp, 'green', '(bg)^+'], [4, -bgm, 'red', '(bg)^-']];
          const levels = [0]; steps.forEach(([, d]) => levels.push(levels[levels.length - 1] + d));
          const lv2 = [0, hp, hp - hm];
          const all = [...levels, ...lv2], lo = Math.min(0, ...all), hi = Math.max(0, ...all), pad = 0.1 * (hi - lo || 1);
          R.setView(null, [lo - pad, hi + pad]);
          R.hline(0, { color: 'muted', width: 1 });
          steps.forEach(([x, d, col, lab], k) => {
            R.rect(x - 0.32, levels[k], x + 0.32, levels[k + 1], { fill: col, fillAlpha: 0.55, stroke: false });
            if (k < 3) R.line(x + 0.32, levels[k + 1], x + 0.68, levels[k + 1], { color: 'muted', width: 1, dash: [2, 2] });
          });
          R.rect(5 - 0.32, 0, 5 + 0.32, levels[4], { fill: 'gold', fillAlpha: 0.6, stroke: false });
          R.line(5.6, lo - pad, 5.6, hi + pad, { color: 'grid', width: 1 });
          R.rect(6.2 - 0.32, 0, 6.2 + 0.32, hp, { fill: 'green', fillAlpha: 0.55, stroke: false });
          R.rect(7.0 - 0.32, hp, 7.0 + 0.32, hp - hm, { fill: 'red', fillAlpha: 0.55, stroke: false });
          R.line(6.52, hp, 6.68, hp, { color: 'muted', width: 1, dash: [2, 2] });
          R.rect(7.9 - 0.32, 0, 7.9 + 0.32, hp - hm, { fill: 'gold', fillAlpha: 0.6, stroke: false });
          R.line(4.6, levels[4], 8.25, levels[4], { color: 'gold', width: 1.6, dash: [5, 3] });
          st = { lhs: hp - hm, rhs: levels[4], abs: hp + hm, a, b, If: integ(f), Ig: integ(g) };
          v.legend([['ink', '$h=af+bg$'], ['accent', '$af$', cnt ? { dot: true } : { dash: true }], ['orange', '$bg$', cnt ? { dot: true } : { dash: true }], ['green', 'positive parts', { area: true }], ['red', 'negative parts', { area: true }], ['gold', 'totals', { area: true }]]);
        });
        v.readout(() => st && `$\\int h = ${v.fix(st.lhs, 4)}$, $\\ a\\int f+b\\int g = ${fmtTerm(v, st.a, st.If[0] - st.If[1]).replace(/\\cdot\s*(\S+)$/, '\\cdot($1)')} + ${fmtTerm(v, st.b, st.Ig[0] - st.Ig[1]).replace(/\\cdot\s*(\S+)$/, '\\cdot($1)')} = ${v.fix(st.rhs, 4)}$. (vi): $|\\int h| = ${v.fix(Math.abs(st.lhs), 3)} \\le \\int|h| = ${v.fix(st.abs, 3)}$.`);
      },
    },
    // ======================================================================== §1.5 Properties of the integral
    {
      num: '1.5.1',
      kind: 'Theorem',
      name: 'Jensen’s inequality',
      credit: 'Jensen, 1906',
      statement: String.raw`Let $\varphi:\R\to\R$ be convex, that is, $\lambda\varphi(x)+(1-\lambda)\varphi(y)\ge\varphi(\lambda x+(1-\lambda)y)$ for all $x,y\in\R$ and $\lambda\in(0,1)$. If $\mu$ is a probability measure and $f$ and $\varphi(f)$ are integrable, then
$$\varphi\Big(\int f\,d\mu\Big)\le\int\varphi(f)\,d\mu.$$`,
      idea: String.raw`Put $c=\int f\,d\mu$. Convexity makes the one-sided difference quotients of $\varphi$ monotone, so both one-sided derivatives exist at $c$, the left one at most the right one. Any slope $a$ between them gives a **supporting line** $\ell(x)=\varphi(c)+a(x-c)$ that touches $\varphi$ at $c$ and stays below it. Monotonicity and linearity of the integral (Theorem 1.4.7) then give $\int\varphi(f)\ge\int\ell(f)=\ell(c)=\varphi(c)$, using $\mu(\Omega)=1$.`,
      caption: String.raw`Drag the six blue nodes to shape a piecewise-linear $\varphi$; when a node bends the wrong way it turns red and $\varphi$ is no longer convex. The gold handles are the atoms $x_1,x_2$ of $X$ (or the ends of a uniform law). The gold point $(EX,E\varphi(X))$ lies on the chord, the blue point $(EX,\varphi(EX))$ on the graph. The orange wedge holds every supporting line at $EX$: a single line on a straight piece, a fan at a kink. Make $\varphi$ non-convex and put $EX$ under the bump to see the inequality fail.`,
      deps: ['prob-1.4.7'],
      see: ['rca-3.3', 'opt-3.4'],
      tags: ['inequalities', 'convexity'],
      viz(v) {
        const NX = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
        const S = v.stage({ x: [-3, 3], y: [-0.7, 4.6], height: 380, xlabel: '$x$' });
        const law = v.select('law of $X$', [{ value: 'two', label: 'two-point' }, { value: 'unif', label: 'uniform on $[x_1,x_2]$' }], 'two');
        const lam = v.slider('$P(X=x_1)$', 0, 1, 0.4, { step: 0.01 });
        const nodes = [3.3, 1.7, 0.7, 0.45, 1.2, 2.9].map((y, i) => S.handle(NX[i], y, { color: 'accent', r: 6, constrain: (x, yy) => [NX[i], clampN(yy, -0.5, 4.4)] }));
        const x1 = S.handle(-1.6, 0, { color: 'gold', label: '$x_1$', labelPos: 's', constrain: (x) => [clampN(x, -2.9, 2.9), 0] });
        const x2 = S.handle(1.9, 0, { color: 'gold', label: '$x_2$', labelPos: 's', constrain: (x) => [clampN(x, -2.9, 2.9), 0] });
        let st = null;
        v.render(() => {
          lam.el.hidden = law.value !== 'two';
          const ys = nodes.map((h) => h.y), phi = (x) => pwl(NX, ys, x);
          const slopes = ys.slice(1).map((y, k) => y - ys[k]);
          const badNode = []; for (let k = 0; k + 1 < slopes.length; k++) if (slopes[k + 1] < slopes[k] - 1e-9) badNode.push(k + 1);
          nodes.forEach((h, k) => { h.color = badNode.includes(k) ? 'red' : 'accent'; });
          const a = Math.min(x1.x, x2.x), b = Math.max(x1.x, x2.x);
          let EX, Ephi;
          if (law.value === 'two') { EX = lam.value * x1.x + (1 - lam.value) * x2.x; Ephi = lam.value * phi(x1.x) + (1 - lam.value) * phi(x2.x); }
          else { EX = (a + b) / 2; Ephi = b - a > 1e-9 ? pwlIntegral(NX, ys, a, b) / (b - a) : phi(a); }
          const c = EX, pc = phi(c);
          // one-sided derivatives at c
          const segAt = (x, side) => { let k = 0; while (k < 4 && (side < 0 ? x > NX[k + 1] + 1e-9 : x >= NX[k + 1] - 1e-9)) k++; return slopes[k]; };
          const dm = segAt(c, -1), dp = segAt(c, +1);
          const lo = Math.min(dm, dp), hi = Math.max(dm, dp);
          S.poly([[c, pc], [c + 4, pc + 4 * hi], [c + 4, pc + 4 * lo]], { fill: 'orange', fillAlpha: 0.12, stroke: false });
          S.poly([[c, pc], [c - 4, pc - 4 * lo], [c - 4, pc - 4 * hi]], { fill: 'orange', fillAlpha: 0.12, stroke: false });
          S.line(c - 4, pc - 4 * dm, c + 4, pc + 4 * dm, { color: 'orange', width: 1.4 });
          if (Math.abs(dp - dm) > 1e-9) S.line(c - 4, pc - 4 * dp, c + 4, pc + 4 * dp, { color: 'orange', width: 1.4 });
          if (law.value === 'unif') {
            S.fn(phi, { domain: [a, b], fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 0.01 });
            S.line(a, Ephi, b, Ephi, { color: 'gold', dash: [5, 4], width: 1.6 });
            S.rect(a, -0.06, b, 0.06, { fill: 'gold', fillAlpha: 0.6, stroke: false });
          } else {
            S.line(x1.x, phi(x1.x), x2.x, phi(x2.x), { color: 'gold', dash: [5, 4], width: 1.6 });
            S.dot(x1.x, phi(x1.x), { color: 'gold', r: 3.5 }); S.dot(x2.x, phi(x2.x), { color: 'gold', r: 3.5 });
            S.text(v.fix(lam.value, 2), x1.x, 0.3, { size: 11, align: 'center', color: 'muted' }); S.text(v.fix(1 - lam.value, 2), x2.x, 0.3, { size: 11, align: 'center', color: 'muted' });
          }
          S.fn(phi, { color: 'accent', width: 2.6 });
          const ok = Ephi >= pc - 1e-9;
          S.line(c, pc, c, Ephi, { color: ok ? 'green' : 'red', width: 3 });
          S.vline(c, { color: 'muted', dash: [2, 3], width: 1 });
          S.dot(c, Ephi, { color: 'gold', r: 6, label: '$E\\varphi(X)$', labelPos: ok ? 'nw' : 'sw' });
          S.dot(c, pc, { color: 'accent', r: 6, label: '$\\varphi(EX)$', labelPos: ok ? 'se' : 'ne' });
          S.tex('EX', c, -0.42, { size: 13, color: 'muted' });
          st = { EX, Ephi, pc, ok, convex: !badNode.length, fan: hi - lo > 1e-9 };
          v.legend([['accent', '$\\varphi$'], ['orange', 'supporting lines at $EX$', { area: true }], ['gold', '$(EX, E\\varphi(X))$', { dot: true }], ['green', 'Jensen gap']]);
        });
        v.readout(() => st && `$EX = ${v.fix(st.EX, 3)}$, $\\ \\varphi(EX) = ${v.fix(st.pc, 3)}$, $\\ E\\varphi(X) = ${v.fix(st.Ephi, 3)}$, gap $${v.fix(st.Ephi - st.pc, 3)}$` + (st.convex ? (st.fan ? ' $\\ge 0$. At a kink there is a whole fan of supporting lines.' : ' $\\ge 0$.') : st.ok ? '. $\\varphi$ is **not convex** (red node), so the inequality is no longer guaranteed; move $EX$ under the bad node.' : ' $< 0$: with a non-convex $\\varphi$, Jensen fails.'));
      },
    },
    {
      num: '1.5.2',
      kind: 'Theorem',
      name: 'Hölder’s inequality',
      credit: 'Rogers, 1888; Hölder, 1889',
      statement: String.raw`Let $p,q\in(1,\infty)$ with $\frac1p+\frac1q=1$, and write $\|f\|_p=\left(\int|f|^p\,d\mu\right)^{1/p}$. Then
$$\int|fg|\,d\mu\le\|f\|_p\,\|g\|_q.$$
The case $p=q=2$ is the Cauchy–Schwarz inequality.`,
      idea: String.raw`If either norm is $0$ then $fg=0$ a.e., so assume both are positive and, after scaling, equal to $1$. For fixed $y\ge0$, $\varphi(x)=x^p/p+y^q/q-xy$ has its minimum at $x_0=y^{1/(p-1)}$ (where $x_0^p=y^q$), and there $\varphi(x_0)=0$. This gives Young's inequality $xy\le x^p/p+y^q/q$. Put $x=|f|$, $y=|g|$ and integrate: $\int|fg|\le\frac1p+\frac1q=1$. Equality forces $|f|^p=|g|^q$ a.e. after normalisation.`,
      caption: String.raw`Left, the $(p,q)$ plane on log axes: the green curve is the conjugate curve $\frac1p+\frac1q=1$. Colour shows $\int|fg|/(\|f\|_p\|g\|_q)$ for the chosen pair, blue below $1$ and red above; the black contour is the level $1$. Drag the gold point along the curve and the ratio never exceeds $1$. It touches $1$ only where $|f|^p/\|f\|_p^p$ (blue) and $|g|^q/\|g\|_q^q$ (orange) coincide, drawn on the right. Free the point to leave the curve. Here $\mu$ is Lebesgue measure on $(0,1)$; blank regions have an infinite norm.`,
      deps: ['prob-1.4.7'],
      see: ['rca-3.5', 'rca-3.8'],
      tags: ['inequalities', 'lp'],
      viz(v) {
        const M = v.M;
        const PAIRS = {
          al: { label: '$\\omega^{-1/3},\\ \\omega^{-1/4}$', E: 2.4, nf: (p) => (p < 3 ? (1 - p / 3) ** (-1 / p) : Infinity), ng: (q) => (q < 4 ? (1 - q / 4) ** (-1 / q) : Infinity), F: (x, p) => (1 - p / 3) * x ** (-p / 3), G: (x, q) => (1 - q / 4) * x ** (-q / 4), eq: 'equality at $p=7/4,\\ q=7/3$' },
          op: { label: '$\\omega^{-1/3},\\ (1-\\omega)^{-1/3}$', E: Math.exp(2 * M.lgamma(2 / 3) - M.lgamma(4 / 3)), nf: (p) => (p < 3 ? (1 - p / 3) ** (-1 / p) : Infinity), ng: (q) => (q < 3 ? (1 - q / 3) ** (-1 / q) : Infinity), F: (x, p) => (1 - p / 3) * x ** (-p / 3), G: (x, q) => (1 - q / 3) * (1 - x) ** (-q / 3), eq: 'no equality case' },
          ind: { label: '$1_A,\\ 1_A$ with $P(A)=0.2$', E: 0.2, nf: (p) => 0.2 ** (1 / p), ng: (q) => 0.2 ** (1 / q), F: (x) => (x < 0.2 ? 5 : 0), G: (x) => (x < 0.2 ? 5 : 0), eq: 'equality for every conjugate pair' },
        };
        const pair = v.select('$(f,g)$ =', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'al');
        const free = v.toggle('free $(p,q)$', false);
        const S = v.stage({ x: [1, 8], y: [1, 8], xlog: true, ylog: true, height: 380, axes: 'box', gutter: true, xlabel: '$p$', ylabel: '$q$', title: 'the $(p,q)$ plane, log axes' });
        const R = v.stage({ x: [0, 1], y: [0.03, 60], ylog: true, height: 380, axes: 'box', gutter: true, xlabel: '$\\omega$', title: 'normalised $|f|^p$ and $|g|^q$' });
        const H = S.handle(2, 2, { color: 'gold', constrain: (x, y) => { if (free.value) return [clampN(x, 1.02, 7.9), clampN(y, 1.02, 7.9)]; const p = clampN(x, 8 / 7, 8); return [p, p / (p - 1)]; } });
        const ratio = (P, p, q) => { const d = P.nf(p) * P.ng(q); return isFinite(d) ? P.E / d : 0; };
        let st = null;
        v.render(() => {
          const P = PAIRS[pair.value];
          if (!free.value) H.y = H.x / (H.x - 1);
          const p = H.x, q = H.y;
          S.heat((x, y) => { const r = ratio(P, x, y); return r > 0 ? Math.log2(r) : NaN; }, { range: [-0.45, 0.45], cmap: 'theme-diverging', neg: 'blue', pos: 'red', key: pair.value, res: 3 });
          S.contour((x, y) => { const r = ratio(P, x, y); return r > 0 ? Math.log(r) : -5; }, [0], { color: 'ink', width: 1.6, res: 140 });
          S.fn((x) => x / (x - 1), { domain: [8 / 7, 8], color: 'green', width: 3 });
          S.tex('\\tfrac1p+\\tfrac1q=1', 5.2, 1.55, { color: 'green', size: 13, plate: true });
          const r = ratio(P, p, q);
          if (isFinite(P.nf(p))) R.fn((x) => P.F(x, p), { domain: [0.0005, 0.9995], color: 'accent', width: 2.4, n: 800 });
          if (isFinite(P.ng(q))) R.fn((x) => P.G(x, q), { domain: [0.0005, 0.9995], color: 'orange', width: 2.2, dash: [7, 4], n: 800 });
          if (!isFinite(P.nf(p))) cornerIn(R, '$\\|f\\|_p=\\infty$', 'tl', { color: 'red' });
          if (!isFinite(P.ng(q))) cornerIn(R, '$\\|g\\|_q=\\infty$', 'tr', { color: 'red' });
          st = { p, q, r, E: P.E, B: P.nf(p) * P.ng(q), eq: P.eq };
          v.legend([['green', 'conjugate curve'], ['ink', 'ratio $=1$'], ['accent', '$|f|^p/\\|f\\|_p^p$'], ['orange', '$|g|^q/\\|g\\|_q^q$', { dash: true }]]);
        });
        v.readout(() => st && `$p=${v.fix(st.p, 3)}$, $q=${v.fix(st.q, 3)}$, $\\frac1p+\\frac1q=${v.fix(1 / st.p + 1 / st.q, 3)}$: $\\ \\int|fg| = ${v.fix(st.E, 4)}$, $\\ \\|f\\|_p\\|g\\|_q = ${isFinite(st.B) ? v.fix(st.B, 4) : '\\infty'}$, ratio $${v.fix(st.r, 4)}$` + (st.r > 1 + 1e-9 ? ' $>1$: off the curve, the inequality can fail.' : ' $\\le 1$.') + ` (${st.eq}.)`);
      },
    },
    {
      num: '1.5.3',
      kind: 'Theorem',
      name: 'Bounded convergence theorem',
      credit: 'Lebesgue, 1902',
      statement: String.raw`Say $f_n\to f$ **in measure** if $\mu(\{x:|f_n(x)-f(x)|>\eps\})\to0$ for every $\eps>0$. Let $\mu(E)<\infty$, and suppose each $f_n$ vanishes off $E$, $|f_n|\le M$ for all $n$, and $f_n\to f$ in measure. Then
$$\int f\,d\mu=\lim_{n\to\infty}\int f_n\,d\mu.$$
The finiteness of $\mu(E)$ cannot be dropped: on $\R$ with Lebesgue measure, $f_n=\frac1n1_{[0,n]}$ tends to $0$ uniformly while $\int f_n=1$.`,
      idea: String.raw`Fix $\eps>0$ and split $E$ into the good set $G_n=\{|f_n-f|\le\eps\}$ and the bad set $B_n=E\setminus G_n$. On $G_n$ the integrand $|f-f_n|$ is at most $\eps$, and on $B_n$ it is at most $2M$. So $\left|\int f-\int f_n\right|\le\eps\,\mu(E)+2M\mu(B_n)$, by Theorem 1.4.7(iii),(vi). Convergence in measure sends $\mu(B_n)\to0$, and $\eps$ is arbitrary. Each hypothesis appears in the bound: $\mu(E)<\infty$ in the first term, the uniform bound $M$ in the second.`,
      caption: String.raw`Slide $n$ and $\eps$. Top: $f_n$ (blue), the limit $f=0$ (green) with its $\eps$-band, and the bad set $B_n$ in red. Bottom: the error $|\int f_n-\int f|$ for every $n$ (dots) under the proof's bound $\eps\mu(E)+2M\mu(B_n)$ (orange). The *typewriter* sequence converges in measure but at no point at all, and the theorem still holds. The last two choices break a hypothesis: no uniform bound $M$, or $\mu(E)=\infty$.`,
      deps: ['prob-1.4.3', 'prob-1.4.7'],
      see: ['pma-11.32a'],
      tags: ['convergence theorems'],
      viz(v) {
        const SEQ = {
          tw: { label: 'typewriter', M: 1, muE: 1 },
          pow: { label: '$x^n$', M: 1, muE: 1 },
          unb: { label: '$n\\,1_{(0,1/n)}$ (no bound)', M: Infinity, muE: 1 },
          inf: { label: '$\\frac1n 1_{[0,n]}$ on $\\R$', M: 1, muE: Infinity },
        };
        const tw = (n) => { const j = Math.floor(Math.log2(n)), i = n - 2 ** j; return [i / 2 ** j, (i + 1) / 2 ** j]; };
        const fn = {
          tw: (n) => { const [a, b] = tw(n); return (x) => (x >= a && x < b ? 1 : 0); },
          pow: (n) => (x) => (x >= 0 && x <= 1 ? x ** n : 0),
          unb: (n) => (x) => (x > 0 && x < 1 / n ? n : 0),
          inf: (n) => (x) => (x >= 0 && x <= n ? 1 / n : 0),
        };
        const integral = { tw: (n) => 2 ** -Math.floor(Math.log2(n)), pow: (n) => 1 / (n + 1), unb: () => 1, inf: () => 1 };
        const bad = { // μ(B_n(ε)) and the set itself
          tw: (n, e) => (e < 1 ? [tw(n)] : []),
          pow: (n, e) => (e < 1 ? [[e ** (1 / n), 1]] : []),
          unb: (n, e) => (e < n ? [[0, 1 / n]] : []),
          inf: (n, e) => (e < 1 / n ? [[0, n]] : []),
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'tw');
        const nS = v.slider('$n$', 1, 48, 5, { int: true }), eS = v.slider('$\\varepsilon$', 0.02, 0.6, 0.2, { step: 0.01 });
        const T = v.stage({ x: [-0.03, 1.03], y: [-0.25, 1.25], height: 230, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: '$f_n$, the $\\varepsilon$-band around $f=0$, and the bad set $B_n$' });
        const B = v.stage({ x: [0, 49], y: [0, 1.1], height: 210, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: 'error $|\\int f_n-\\int f|$ and the bound $\\varepsilon\\mu(E)+2M\\mu(B_n)$' });
        let st = null;
        v.render(() => {
          const k = which.value, Sq = SEQ[k], n = nS.value, e = eS.value;
          const X1 = k === 'inf' ? Math.max(10, n + 2) : 1.03, Y1 = k === 'unb' ? n * 1.12 + 1 : 1.25;
          T.setView([k === 'inf' ? -0.3 : -0.03, X1], [-0.06 * Y1 - 0.12, Y1]);
          const Bs = bad[k](n, e), muB = Bs.reduce((s, [a, b]) => s + b - a, 0);
          T.hband(-e, e, { color: 'accent', alpha: 0.13, edges: true });
          for (const [a, b] of Bs) { T.vband(a, b, { color: 'red', alpha: 0.08 }); T.rect(a, -0.05 * Y1 - 0.1, b, -0.02 * Y1 - 0.05, { fill: 'red', fillAlpha: 0.85, stroke: false }); }
          T.hline(0, { color: 'green', width: 2, dash: [6, 4] });
          T.fn(fn[k](n), { domain: [0, k === 'inf' ? X1 : 1], color: 'accent', width: 2.6, n: 2400 });
          cornerIn(T, `$\\mu(B_n)=${v.fix(muB, 4)}$`, 'tr', { color: 'red', plate: true });
          // bottom: errors and bound
          const errs = [], bnd = [];
          for (let m = 1; m <= 48; m++) {
            errs.push([m, integral[k](m)]);
            const mb = bad[k](m, e).reduce((s, [a, b]) => s + b - a, 0), Mm = k === 'unb' ? m : Sq.M;
            bnd.push([m, isFinite(Sq.muE) ? e * Sq.muE + 2 * Mm * mb : NaN]);
          }
          const ymax = k === 'unb' ? 2.6 : k === 'inf' ? 1.45 : 1.15;
          B.setView(null, [0, ymax]);
          if (isFinite(Sq.muE)) B.path(bnd, { color: 'orange', width: 2.2 }); else cornerIn(B, '$\\varepsilon\\,\\mu(E)=\\infty$: the bound is useless', 'tr', { color: 'red' });
          B.dots(errs, { color: 'accent', r: 3 });
          B.dot(n, integral[k](n), { color: 'gold', r: 6 });
          if (k === 'unb') cornerIn(B, 'no uniform $M$: the bound uses $M=n$ and stays $\\ge 2$', 'tr', { color: 'red' });
          st = { k, n, e, I: integral[k](n), muB, bound: isFinite(Sq.muE) ? e * Sq.muE + 2 * (k === 'unb' ? n : Sq.M) * muB : Infinity };
          v.legend([['accent', '$f_n$ and $|\\int f_n - \\int f|$'], ['green', '$f=0$', { dash: true }], ['red', 'bad set $B_n$', { area: true }], ['orange', 'bound']]);
        });
        v.readout(() => st && `$\\int f_n = ${v.fix(st.I, 4)}$, $\\int f = 0$; bound $\\varepsilon\\mu(E)+2M\\mu(B_n) = ${isFinite(st.bound) ? v.fix(st.bound, 4) : '\\infty'}$.` + ({ tw: ' Every $x$ is covered infinitely often, so $f_n(x)\\not\\to0$ anywhere; convergence in measure is enough.', pow: ' Here $f_n\\to0$ except at $x=1$.', unb: ' No uniform bound: $\\int f_n=1\\not\\to0$.', inf: ' $f_n\\to0$ uniformly, yet $\\int f_n=1$: $\\mu(E)=\\infty$ (Example 1.5.4).' })[st.k]);
      },
    },
    {
      num: '1.5.5',
      kind: 'Theorem',
      name: 'Fatou’s lemma',
      credit: 'Fatou, 1906',
      statement: String.raw`If $f_n\ge0$, then
$$\liminf_{n\to\infty}\int f_n\,d\mu\ \ge\ \int\Big(\liminf_{n\to\infty}f_n\Big)\,d\mu.$$
The inequality can be strict, even on a space of finite measure: on $(0,1)$ with Lebesgue measure, $f_n=n\,1_{(0,1/n]}$ has $\int f_n=1$ but $f_n\to0$ (Example 1.5.6).`,
      idea: String.raw`Let $g_n=\inf_{m\ge n}f_m$. Then $f_n\ge g_n$, and $g_n\uparrow g=\liminf f_n$. Take sets $E_m\uparrow\Omega$ of finite measure. For fixed $m$, $(g_n\wedge m)1_{E_m}\to(g\wedge m)1_{E_m}$ and is bounded on a set of finite measure, so the bounded convergence theorem gives $\liminf\int g_n\ge\int_{E_m}g\wedge m$. Letting $m\to\infty$ (Lemma 1.4.4) finishes. Mass can be lost in the limit, never created.`,
      caption: String.raw`Pick a sequence and slide $n$. Top: $f_n$ (blue) and the pointwise limit $\liminf f_n$ (green). Bottom left: $\int f_k$ for each $k$ against $\int\liminf f_n$ (dashed); the red bracket is the mass that disappears. Bottom right: the cumulative mass $x\mapsto\int_0^xf_n$ shows where it goes. It piles up at a point (*squeeze*), runs off to infinity (*drift*), thins out (*spread*), or keeps changing places (*alternate*). For an increasing sequence nothing is lost.`,
      deps: ['prob-1.5.3', 'prob-1.4.4'],
      see: ['rca-1.28', 'pma-11.31'],
      tags: ['convergence theorems'],
      viz(v) {
        const SEQ = {
          sq: { label: 'squeeze $n1_{(0,1/n]}$', X: [0, 1], Y: [0, 22], I: () => 1, Ilim: 0, f: (n) => (x) => (x > 0 && x <= 1 / n ? n : 0), lim: () => 0, cum: (n, x) => Math.min(n * x, 1), cumLim: () => 0 },
          dr: { label: 'drift $1_{[n,n+1)}$', X: [0, 22], Y: [0, 1.4], I: () => 1, Ilim: 0, f: (n) => (x) => (x >= n && x < n + 1 ? 1 : 0), lim: () => 0, cum: (n, x) => clampN(x - n, 0, 1), cumLim: () => 0 },
          sp: { label: 'spread $\\frac1n1_{[0,n]}$', X: [0, 21], Y: [0, 1.25], I: () => 1, Ilim: 0, f: (n) => (x) => (x >= 0 && x <= n ? 1 / n : 0), lim: () => 0, cum: (n, x) => Math.min(x, n) / n, cumLim: () => 0 },
          al: { label: 'alternate', X: [0, 1], Y: [0, 1.4], I: () => 0.5, Ilim: 0, f: (n) => (x) => ((n % 2 ? x < 0.5 : x >= 0.5) && x >= 0 && x <= 1 ? 1 : 0), lim: () => 0, cum: (n, x) => (n % 2 ? Math.min(x, 0.5) : Math.max(0, x - 0.5)), cumLim: () => 0 },
          up: { label: 'increasing $x^{-1/2}\\wedge n$', X: [0, 1], Y: [0, 22], I: (n) => 2 - 1 / n, Ilim: 2, f: (n) => (x) => (x > 0 && x <= 1 ? Math.min(x ** -0.5, n) : 0), lim: (x) => (x > 0 && x <= 1 ? x ** -0.5 : 0), cum: (n, x) => (x <= 1 / (n * n) ? n * x : 2 * Math.sqrt(Math.min(x, 1)) - 1 / n), cumLim: (x) => 2 * Math.sqrt(Math.min(x, 1)) },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const nS = v.slider('$n$', 1, 20, 4, { int: true });
        const T = v.stage({ x: [0, 1], y: [0, 22], height: 220, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: '$f_n$ and $\\liminf f_n$' });
        const B1 = v.stage({ x: [0, 21], y: [0, 2.3], height: 220, axes: 'box', gutter: true, xlabel: '$k$', title: '$\\int f_k$ against $\\int\\liminf f_n$' });
        const B2 = v.stage({ x: [0, 1], y: [0, 2.2], height: 220, axes: 'box', gutter: true, xlabel: '$x$', title: 'cumulative mass $\\int_0^x f_n$' });
        let st = null;
        v.render(() => {
          const Sq = SEQ[which.value], n = nS.value;
          T.setView(Sq.X, [-0.05 * Sq.Y[1], Sq.Y[1]]); B2.setView(Sq.X, [-0.07, which.value === 'up' ? 2.3 : 1.25]); B1.setView(null, [-0.15, 2.3]);
          T.fn(Sq.f(n), { domain: Sq.X, color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.2, n: 2400 });
          if (which.value === 'up') T.fn(Sq.lim, { domain: [0.002, 1], color: 'green', width: 2, dash: [6, 4] });
          else T.hline(0, { color: 'green', width: 3, dash: [6, 4] });
          cornerIn(T, `$\\int f_n = ${v.fix(Sq.I(n), 3)}$`, 'tr', { color: 'accent', plate: true });
          const pts = Array.from({ length: 20 }, (_, i) => [i + 1, Sq.I(i + 1)]);
          B1.hline(Sq.Ilim, { color: 'green', width: 2, dash: [6, 4] });
          B1.dots(pts, { color: 'accent', r: 3.2 }); B1.dot(n, Sq.I(n), { color: 'gold', r: 6 });
          const liminfI = Math.min(...pts.slice(-6).map((p) => p[1]));
          if (liminfI - Sq.Ilim > 1e-6) { B1.measure(20.4, Sq.Ilim, 20.4, liminfI, '', { color: 'red' }); B1.text('lost', 19.9, (Sq.Ilim + liminfI) / 2, { color: 'red', size: 12, align: 'right' }); }
          B2.fn((x) => Sq.cum(n, x), { domain: Sq.X, color: 'accent', width: 2.4, n: 1200 });
          B2.fn((x) => Sq.cumLim(x), { domain: Sq.X, color: 'green', width: 2, dash: [6, 4], n: 600 });
          st = { n, I: Sq.I(n), Ilim: Sq.Ilim, k: which.value };
          v.legend([['accent', '$f_n$, $\\int f_k$, mass of $f_n$'], ['green', '$\\liminf f_n$ and its integral', { dash: true }]]);
        });
        v.readout(() => st && `$\\liminf_n\\int f_n = ${v.fix(st.k === 'up' ? 2 : st.k === 'al' ? 0.5 : 1, 3)} \\ \\ge\\ \\int\\liminf_n f_n = ${v.fix(st.Ilim, 3)}$` + (st.k === 'up' ? ': equality, since an increasing sequence loses nothing.' : `: mass ${st.k === 'al' ? '½' : '1'} is lost — ${({ sq: 'it concentrates at the point 0', dr: 'it escapes to infinity', sp: 'it spreads ever thinner over an infinite set', al: 'it keeps switching halves, so every point is 0 infinitely often' })[st.k]}.`));
      },
    },
    {
      num: '1.5.7',
      kind: 'Theorem',
      name: 'Monotone convergence theorem',
      credit: 'B. Levi, 1906',
      statement: String.raw`If $f_n\ge0$ and $f_n\uparrow f$ pointwise, then $\int f_n\,d\mu\uparrow\int f\,d\mu$ (the value $+\infty$ allowed).`,
      idea: String.raw`Fatou's lemma gives $\liminf\int f_n\ge\int f$. Conversely $f_n\le f$, so $\limsup\int f_n\le\int f$ by monotonicity. Both hypotheses matter. Without $f_n\ge0$ (or at least $\int f_1^-<\infty$) the integrals can stay at $-\infty$; without monotonicity mass can escape as in Fatou's examples. Durrett later uses the dyadic approximants $f_n=([2^nf]/2^n)\wedge n$ with this theorem to pass identities from simple functions to all $f\ge0$ (Theorems 1.6.9 and 1.7.2).`,
      caption: String.raw`Choose a sequence and slide $n$. In the first, the dyadic approximants $([2^nf]/2^n)\wedge n$ of $f=x^{-\alpha}$ fill in from below (blue; dashed: $f_{n-1}$). Their integrals (below) climb to $\int f=1/(1-\alpha)$, or without bound once $\alpha\ge1$. The other three each drop one hypothesis: the functions are negative with $\int f_1^-=\infty$, the sequence decreases, or it is not monotone at all.`,
      deps: ['prob-1.5.5'],
      see: ['rca-1.26', 'pma-11.28'],
      tags: ['convergence theorems'],
      viz(v) {
        const which = v.select('', [{ value: 'up', label: 'dyadic $\\uparrow x^{-\\alpha}$' }, { value: 'neg', label: '$-x^{-1}1_{(0,1/n)}\\uparrow 0$' }, { value: 'down', label: '$1_{[n,\\infty)}\\downarrow 0$' }, { value: 'bump', label: 'not monotone' }], 'up');
        const aS = v.slider('$\\alpha$', 0.2, 1.4, 0.6, { step: 0.01 });
        const nS = v.slider('$n$', 1, 12, 3, { int: true });
        const T = v.stage({ x: [0, 1], y: [0, 13], height: 240, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: '$f_n$ (blue), $f_{n-1}$ (dashed) and the limit $f$ (green)' });
        const B = v.stage({ x: [0.5, 12.5], y: [0, 3], height: 200, full: true, axes: 'box', gutter: true, xlabel: '$k$', title: '$\\int f_k$ against $\\int f$' });
        const dy = (al, n) => (x) => (x > 0 && x <= 1 ? Math.min(Math.floor(2 ** n * x ** -al) / 2 ** n, n) : 0);
        let cache = null;
        const dyInts = (al) => {
          if (cache && cache.al === al) return cache.v;
          const out = [];
          for (let n = 1; n <= 12; n++) { const d = 2 ** -n; let s = 0; for (let k = 1; k <= n * 2 ** n; k++) s += d * Math.min(1, (k * d) ** (-1 / al)); out.push(s); }
          cache = { al, v: out }; return out;
        };
        let st = null;
        v.render(() => {
          const k = which.value, n = nS.value, al = aS.value; aS.el.hidden = k !== 'up';
          let f, fn, fprev, ints, lim, X = [0, 1], Y = [0, 13];
          if (k === 'up') { fn = dy(al, n); fprev = n > 1 ? dy(al, n - 1) : () => 0; f = (x) => (x > 0 ? x ** -al : NaN); ints = dyInts(al); lim = al < 1 ? 1 / (1 - al) : Infinity; }
          else if (k === 'neg') { fn = (x) => (x > 0 && x < 1 / n ? -1 / x : 0); fprev = (x) => (x > 0 && x < 1 / Math.max(1, n - 1) ? -1 / x : 0); f = () => 0; ints = Array(12).fill(-Infinity); lim = 0; Y = [-13, 2]; }
          else if (k === 'down') { fn = (x) => (x >= n ? 1 : 0); fprev = (x) => (x >= n - 1 ? 1 : 0); f = () => 0; ints = Array(12).fill(Infinity); lim = 0; X = [0, 16]; Y = [0, 1.4]; }
          else { fn = (x) => (x > 0 && x <= 1 / n ? n : 0); fprev = (x) => (x > 0 && x <= 1 / Math.max(1, n - 1) ? Math.max(1, n - 1) : 0); f = () => 0; ints = Array(12).fill(1); lim = 0; }
          T.setView(X, Y);
          T.fn(fn, { domain: X, color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.22, n: 2400 });
          if (n > 1) T.fn(fprev, { domain: X, color: 'muted', width: 1.4, dash: [5, 4], n: 2400 });
          T.fn(f, { domain: [k === 'up' ? 0.0005 : X[0], X[1]], color: 'green', width: 2.2, dash: [6, 4], n: 1200 });
          // integrals
          const fin = ints.filter(isFinite), top = Math.max(isFinite(lim) ? lim : 0, ...fin, 1) * 1.18;
          const lo = k === 'neg' ? -2 : 0;
          B.setView(null, [lo, k === 'neg' || k === 'down' ? 2 : top]);
          if (isFinite(lim)) { B.hline(lim, { color: 'green', width: 2, dash: [6, 4] }); B.tex(`\\textstyle\\int f=${v.fix(lim, 3)}`, 12.4, lim, { align: 'right', baseline: 'bottom', color: 'green', dy: -3 }); }
          else cornerIn(B, '$\\int f=\\infty$', 'tl', { color: 'green' });
          ints.forEach((I, i) => {
            const x = i + 1, col = x === n ? 'gold' : 'accent';
            if (isFinite(I)) B.dot(x, I, { color: col, r: x === n ? 6 : 3.5 });
            else B.arrow(x, I > 0 ? 1.2 : -0.6, x, I > 0 ? 1.9 : -1.9, { color: col, width: 2 });
          });
          if (!isFinite(ints[0])) cornerIn(B, ints[0] > 0 ? 'every $\\int f_k=+\\infty$' : 'every $\\int f_k=-\\infty$', 'tr', { color: 'red' });
          st = { k, I: ints[n - 1], lim };
          v.legend([['accent', '$f_n$', { area: true }], ['muted', '$f_{n-1}$', { dash: true }], ['green', 'limit $f$', { dash: true }]]);
        });
        v.readout(() => {
          if (!st) return '';
          const I = isFinite(st.I) ? v.fix(st.I, 4) : st.I > 0 ? '+\\infty' : '-\\infty';
          return `$\\int f_n = ${I}$, $\\int f = ${isFinite(st.lim) ? v.fix(st.lim, 4) : '\\infty'}$. ` + ({ up: 'Increasing and $\\ge0$: the theorem applies.', neg: 'Increasing to $0$, but $f_n\\not\\ge0$ and $\\int f_1^-=\\infty$: the integrals never leave $-\\infty$.', down: 'Decreasing to $0$ with $\\int f_n=\\infty$: monotone the wrong way.', bump: 'Not monotone: $\\int f_n=1$ while $f_n\\to0$ (Fatou is all that survives).' })[st.k];
        });
      },
    },
    {
      num: '1.5.8',
      kind: 'Theorem',
      name: 'Dominated convergence theorem',
      credit: 'Lebesgue, 1908',
      statement: String.raw`If $f_n\to f$ a.e., $|f_n|\le g$ for all $n$, and $g$ is integrable, then $\int f_n\,d\mu\to\int f\,d\mu$.`,
      idea: String.raw`Since $f_n+g\ge0$, Fatou's lemma gives $\liminf\int(f_n+g)\ge\int(f+g)$; subtracting the finite number $\int g$ gives $\liminf\int f_n\ge\int f$. The same argument applied to $g-f_n\ge0$ gives $\limsup\int f_n\le\int f$. The smallest candidate for $g$ is the envelope $\sup_n|f_n|$, so the theorem applies exactly when some integrable function lies above that envelope. Applied to $|f_n-f|\le2g$ it also gives $\int|f_n-f|\to0$.`,
      caption: String.raw`Slide $n$. Top: $f_n$ (blue), the limit $f$ (green) and a dominating function (orange). Bottom: $\int|f_k-f|$ for every $k$. The Student $t_n$ densities converge to the normal density and all sit under $0.4/(1+x^2/2)$, which is integrable, so the errors go to $0$. In the other two examples the least majorant $\sup_k f_k$ (dashed) has infinite integral, and the error stays at $1$.`,
      deps: ['prob-1.5.5'],
      see: ['rca-1.34', 'pma-11.32'],
      tags: ['convergence theorems'],
      viz(v) {
        const M = v.M, phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
        const which = v.select('', [{ value: 't', label: 'Student $t_n\\to$ normal' }, { value: 'bump', label: '$n1_{(1/n,2/n)}$' }, { value: 'drift', label: '$1_{[n,n+1)}$' }], 't');
        const nS = v.slider('$n$', 1, 40, 3, { int: true });
        const T = v.stage({ x: [-5, 5], y: [0, 0.45], height: 250, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: '$f_n$, limit $f$ and majorant' });
        const B = v.stage({ x: [0, 41], y: [0, 1.15], height: 190, full: true, axes: 'box', gutter: true, xlabel: '$k$', title: '$\\int|f_k-f|$' });
        let tErr = null;
        const tErrors = () => {
          if (tErr) return tErr;
          tErr = [];
          for (let k = 1; k <= 40; k++) { const D = M.dist.studentT(k); tErr.push(2 * M.integrate((x) => Math.abs(D.pdf(x) - phi(x)), 0, 60, 6000)); }
          return tErr;
        };
        let st = null;
        v.render(() => {
          const k = which.value, n = nS.value;
          let errs, envI;
          if (k === 't') {
            T.setView([-5, 5], [0, 0.45]);
            const g = (x) => 0.4 / (1 + x * x / 2), D = M.dist.studentT(n);
            T.fn(g, { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.1 });
            T.fn(phi, { color: 'green', width: 2.2, dash: [6, 4] });
            T.fn(D.pdf, { color: 'accent', width: 2.6 });
            errs = tErrors(); envI = 0.4 * Math.PI * Math.SQRT2;
            cornerIn(T, '$g(x)=0.4/(1+x^2/2)$, $\\int g = 0.4\\pi\\sqrt2\\approx1.78$', 'tr', { color: 'orange', plate: true });
          } else if (k === 'bump') {
            T.setView([0, 1], [0, 42]);
            const env = (x) => { if (x <= 0 || x >= 2) return 0; const m = Math.ceil(2 / x) - 1; return m > 1 / x && m >= 1 ? m : 0; };
            T.fn((x) => Math.min(env(x), 41), { domain: [0.02, 1], color: 'orange', width: 1.8, dash: [5, 4], fill: 'orange', fillAlpha: 0.08, n: 3000 });
            T.fn((x) => (x > 1 / n && x < 2 / n ? n : 0), { domain: [0, 1], color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.25, n: 3000 });
            T.hline(0, { color: 'green', width: 3, dash: [6, 4] });
            errs = Array(40).fill(1); envI = Infinity;
            cornerIn(T, 'least majorant $\\sup_k f_k\\approx 2/x$: $\\int=\\infty$', 'tr', { color: 'orange', plate: true });
          } else {
            T.setView([0, 42], [0, 1.4]);
            T.fn((x) => (x >= 1 ? 1 : 0), { domain: [0, 42], color: 'orange', width: 1.8, dash: [5, 4], fill: 'orange', fillAlpha: 0.08, n: 3000 });
            T.fn((x) => (x >= n && x < n + 1 ? 1 : 0), { domain: [0, 42], color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.25, n: 3000 });
            T.hline(0, { color: 'green', width: 3, dash: [6, 4] });
            errs = Array(40).fill(1); envI = Infinity;
            cornerIn(T, 'least majorant $1_{[1,\\infty)}$: $\\int=\\infty$', 'tr', { color: 'orange', plate: true });
          }
          B.setView(null, k === 't' ? [-0.04 * Math.max(...errs), Math.max(...errs) * 1.15] : [-0.05, 1.15]);
          B.hline(0, { color: 'green', width: 2, dash: [6, 4] });
          B.dots(errs.map((e, i) => [i + 1, e]), { color: 'accent', r: 3.2 });
          B.dot(n, errs[n - 1], { color: 'gold', r: 6 });
          st = { k, n, err: errs[n - 1], envI };
          v.legend([['accent', '$f_n$'], ['green', 'limit $f$', { dash: true }], ['orange', k === 't' ? 'majorant $g$' : 'least majorant $\\sup_k f_k$', k === 't' ? { area: true } : { dash: true }]]);
        });
        v.readout(() => st && `$\\int|f_n-f| = ${v.fix(st.err, 4)}$; ` + (st.k === 't' ? `the majorant has $\\int g = ${v.fix(st.envI, 3)}<\\infty$.` : 'even the least majorant has infinite integral.') + (st.k === 't' ? ' Dominated, so $\\int f_n\\mathbf 1_A\\to\\int f\\mathbf 1_A$ for every set $A$.' : ' No integrable majorant: $\\int f_n=1\\not\\to\\int f=0$.'));
      },
    },
  ],
};
