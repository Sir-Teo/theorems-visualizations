// Rudin, Principles of Mathematical Analysis — Chapter 3 (part 3 of the second half):
// addition and multiplication of series, Mertens' and Abel's product theorems, rearrangements
// and Riemann's theorem (3.47–3.55).

/** Sum of an alternating-type series sum_{n>=1} term(n), accelerated by repeated averaging. */
function accelSum(term, K = 4000, depth = 24) {
  let s = 0; for (let n = 1; n <= K; n++) s += term(n);
  let row = [s]; for (let j = 1; j <= depth; j++) { s += term(K + j); row.push(s); }
  while (row.length > 1) row = row.slice(1).map((x, i) => (x + row[i]) / 2);
  return row[0];
}
const cplx = (z, d = 3) => `${z.re.toFixed(d)} ${z.im < 0 ? '-' : '+'} ${Math.abs(z.im).toFixed(d)}\\,i`;
const FACT = [1];
for (let k = 1; k <= 40; k++) FACT.push(FACT[k - 1] * k);

/** Positions of a "p positives then q negatives" rearrangement of an alternating series a_n = (-1)^{n+1} m(n). Returns k_1..k_len (1-based original indices). */
function blockPattern(p, q, len) {
  const out = []; let nextPos = 1, nextNeg = 2;
  while (out.length < len) {
    for (let i = 0; i < p && out.length < len; i++) { out.push(nextPos); nextPos += 2; }
    for (let i = 0; i < q && out.length < len; i++) { out.push(nextNeg); nextNeg += 2; }
  }
  return out;
}

export default {
  book: 'pma',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.47
    {
      num: '3.47',
      kind: 'Theorem',
      name: 'Convergent series can be added and scaled',
      statement: String.raw`If $\sum a_n=A$ and $\sum b_n=B$, then $\sum(a_n+b_n)=A+B$, and $\sum c\,a_n=cA$ for every fixed number $c$.`,
      idea: String.raw`The partial sums of $\sum(a_n+c\,b_n)$ are exactly $A_n+c\,B_n$, so this is the statement that limits of sequences respect sums and scalar multiples (3.3). The converse fails: $\sum(a_n+b_n)$ may converge although neither $\sum a_n$ nor $\sum b_n$ does (take $a_n=1$, $b_n=-1$).`,
      caption: String.raw`Two convergent complex series: $\sum a_n$ (blue) and $\sum b_n$, scaled by $c$ (purple). Slide $c$ and $N$. The partial sums of $\sum(a_n+c\,b_n)$ (green) are the vertex-by-vertex sums $A_N+cB_N$ — the fourth corner of the parallelogram — so they converge to $A+cB$ (rings). Right: the distance of the green partial sum to $A+cB$ never exceeds $|A_N-A|+|c|\,|B_N-B|$ (dashed), which tends to $0$.`,
      deps: ['pma-3.3', 'pma-3.21'],
      tags: ['series', 'limits'],
      viz(v) {
        const { Cx } = v.M;
        const wa = Cx.polar(0.72, 1.15), wb = Cx.polar(0.78, -2.1);
        const one = new Cx(1, 0);
        const A = one.div(one.sub(wa)), B = one.div(one.sub(wb));
        const cS = v.slider('$c$', -2, 2, 1, { step: 0.05 });
        const NS = v.slider('$N$', 0, 40, 6, { int: true });
        const S = v.stage({ x: [-1, 2.5], y: [-1, 1.5], equal: true, height: 360, weight: 1.25, title: '$a_n=(0.72\\,e^{1.15i})^n$, $\\;b_n=(0.78\\,e^{-2.1i})^n$: partial sums in $\\mathbb C$' });
        const E = v.stage({ x: [-3.5, 44], y: [-6.2, 0.6], height: 360, axes: 'box', weight: 1, xlabel: 'N', xticks: [0, 10, 20, 30, 40], yticks: [[0, '1'], [-1, '10⁻¹'], [-2, '10⁻²'], [-3, '10⁻³'], [-4, '10⁻⁴'], [-5, '10⁻⁵'], [-6, '10⁻⁶']], title: 'distances to the limits (log scale)' });
        v.legend([['accent', '$A_n=\\sum_{k\\le n}a_k$'], ['purple', '$c\\,B_n$'], ['green', '$\\sum_{k\\le n}(a_k+c\\,b_k)=A_n+cB_n$'], ['ink', '$|A_N-A|+|c|\\,|B_N-B|$', { dash: true }], ['muted', 'parallelogram at $n=N$', { area: true }]]);
        let state = null;
        v.render(() => {
          const c = cS.value, N = NS.value;
          let SA = new Cx(0, 0), SB = new Cx(0, 0), za = new Cx(1, 0), zb = new Cx(1, 0);
          const pts = [];
          for (let n = 0; n <= 60; n++) {
            SA = SA.add(za); SB = SB.add(zb); za = za.mul(wa); zb = zb.mul(wb);
            pts.push([SA, SB.scale(c)]);
          }
          const cB = B.scale(c), T = A.add(cB);
          const paths = { accent: [[0, 0]], purple: [[0, 0]], green: [[0, 0]] };
          for (const [a, b] of pts) { paths.accent.push([a.re, a.im]); paths.purple.push([b.re, b.im]); const t = a.add(b); paths.green.push([t.re, t.im]); }
          // fit the view to everything that is drawn
          const all = paths.accent.concat(paths.purple, paths.green);
          const xs = all.map((q) => q[0]), ys = all.map((q) => q[1]);
          const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), pd = 0.12 * Math.max(x1 - x0, y1 - y0) + 0.15;
          S.setView([x0 - pd, x1 + pd], [y0 - pd, y1 + pd]);
          const [aN, cbN] = pts[N], sN = aN.add(cbN);
          S.poly([[0, 0], [aN.re, aN.im], [sN.re, sN.im], [cbN.re, cbN.im]], { color: 'muted', width: 1.2, dash: [4, 4], fill: 'muted', fillAlpha: 0.08 });
          for (const col of ['accent', 'purple', 'green']) {
            S.path(paths[col], { color: col, width: 1, alpha: 0.25 });
            const P = paths[col].slice(0, N + 2);
            S.path(P, { color: col, width: 2.2 });
            S.dots(P.slice(1), { color: col, r: 2.6 });
          }
          S.dot(A.re, A.im, { color: 'accent', r: 7, hollow: true, width: 2.2, label: 'A', labelPos: 'nw' });
          S.dot(cB.re, cB.im, { color: 'purple', r: 7, hollow: true, width: 2.2, label: 'cB', labelPos: 'sw' });
          S.dot(T.re, T.im, { color: 'green', r: 8, hollow: true, width: 2.6, label: 'A + cB', labelPos: 'ne' });
          S.dot(aN.re, aN.im, { color: 'accent', r: 5 }); S.dot(cbN.re, cbN.im, { color: 'purple', r: 5 }); S.dot(sN.re, sN.im, { color: 'green', r: 5.5 });
          S.dot(0, 0, { color: 'ink', r: 3 });
          // error panel
          const lg = (x) => Math.log10(Math.max(x, 1e-7));
          const eA = [], eB = [], eS = [], eT = [];
          for (let n = 0; n <= 40; n++) {
            const [a, b] = pts[n];
            const da = a.sub(A).abs(), db = b.sub(cB).abs();
            eA.push([n, lg(da)]); eB.push([n, lg(db)]); eS.push([n, lg(a.add(b).sub(T).abs())]); eT.push([n, lg(da + db)]);
          }
          E.path(eT, { color: 'ink', width: 1.2, dash: [4, 4] });
          E.path(eA, { color: 'accent', width: 1.6 }); E.path(eB, { color: 'purple', width: 1.6 });
          E.path(eS, { color: 'green', width: 2.2 }); E.dots(eS, { color: 'green', r: 2.4 });
          E.vline(N, { color: 'faint', width: 1.2 });
          state = { aN, cbN, sN, T, N, c };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$A_{${s.N}}+cB_{${s.N}}=${cplx(s.sN)}$ $\\;\\to\\;$ $A+cB=${cplx(s.T)}$ $\\;$ (distance $${v.fix(s.sN.sub(s.T).abs(), 4)}$).`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.48
    {
      num: '3.48',
      kind: 'Definition',
      name: 'Product (Cauchy product) of two series',
      statement: String.raw`Given $\sum_{n\ge0} a_n$ and $\sum_{n\ge0} b_n$, put $$c_n=\sum_{k=0}^{n}a_kb_{n-k}=a_0b_n+a_1b_{n-1}+\cdots+a_nb_0\qquad(n=0,1,2,\dots),$$ and call $\sum c_n$ the *product* of the two series.`,
      idea: String.raw`It is what you get by multiplying two power series and collecting powers of $z$: $\bigl(\sum a_nz^n\bigr)\bigl(\sum b_nz^n\bigr)=\sum c_nz^n$, at least formally; setting $z=1$ motivates the definition. Whether $\sum c_n$ converges, and to $AB$, is the subject of 3.49–3.51.`,
      caption: String.raw`Slide $n$. The sequence $b$ is flipped and shifted so that $b_{n-k}$ sits under $a_k$; the products $a_kb_{n-k}$ (bottom row) add up to $c_n$, highlighted on the right. Try the exponential pair: $c_n=\frac{2^n}{n!}$, the coefficients of $e^{z}\cdot e^{z}=e^{2z}$.`,
      deps: ['pma-3.21'],
      tags: ['series', 'Cauchy product'],
      viz(v) {
        const PAIRS = {
          exp: { label: '$a_k=b_k=\\frac1{k!}$', a: (k) => 1 / FACT[k], b: (k) => 1 / FACT[k], cf: (n) => 2 ** n / FACT[n], cl: 'c_n=\\frac{2^n}{n!}' },
          geo: { label: '$a_k=b_k=2^{-k}$', a: (k) => 2 ** -k, b: (k) => 2 ** -k, cf: (n) => (n + 1) / 2 ** n, cl: 'c_n=\\frac{n+1}{2^n}' },
          alt: { label: '$a_k=1,\\ b_k=(-1)^k$', a: () => 1, b: (k) => (k % 2 ? -1 : 1), cf: (n) => (n % 2 ? 0 : 1), cl: 'c_n=1,0,1,0,\\dots' },
        };
        const which = v.select('', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const nS = v.slider('$n$', 0, 10, 4, { int: true });
        const K = 10, SC = 1.5;
        const S = v.stage({ x: [-2.7, K + 0.8], y: [-2.1, 9.3], height: 400, axes: false, weight: 1.6, title: 'flip-and-slide: $a_k$, $\\;b_{n-k}$, and their products' });
        const C = v.stage({ x: [-0.8, K + 0.8], y: [-0.3, 2.3], height: 380, axes: 'box', weight: 1, xlabel: 'n', title: 'the product series $c_n$' });
        v.legend([['accent', '$a_k$', { area: true }], ['purple', '$b_{n-k}$ (flipped, shifted)', { area: true }], ['gold', '$a_k\\,b_{n-k}$', { area: true }], ['green', '$c_n=\\sum_k a_kb_{n-k}$', { area: true }]]);
        let state = null;
        v.render(() => {
          const P = PAIRS[which.value], n = nS.value;
          const rows = [{ y: 7.4, col: 'accent', lab: 'a_k', val: (k) => P.a(k) }, { y: 3.7, col: 'purple', lab: 'b_{n-k}', val: (k) => (k <= n ? P.b(n - k) : null) }, { y: 0, col: 'gold', lab: 'a_kb_{n-k}', val: (k) => (k <= n ? P.a(k) * P.b(n - k) : null) }];
          S.vband(-0.5, n + 0.5, { color: 'green', alpha: 0.06 });
          for (const r of rows) {
            S.line(-0.6, r.y, K + 0.6, r.y, { color: 'faint', width: 1 });
            S.tex(r.lab, -0.6, r.y + 0.5, { align: 'right', color: r.col, size: 14 });
            for (let k = 0; k <= K; k++) {
              const val = r.val(k);
              if (val == null) { S.rect(k - 0.3, r.y, k + 0.3, r.y + 0.05, { fill: 'faint', fillAlpha: 0.6, stroke: false }); continue; }
              S.rect(k - 0.32, r.y, k + 0.32, r.y + val * SC, { fill: r.col, fillAlpha: 0.75, stroke: false });
            }
          }
          for (let k = 0; k <= K; k++) S.text(String(k), k, -1.75, { align: 'center', baseline: 'top', size: 11, color: 'muted' });
          S.text('k', K + 0.7, -1.75, { align: 'center', baseline: 'top', size: 12, color: 'muted', math: true });
          // index labels on the b row
          for (let k = 0; k <= n; k++) S.text(`${n - k}`, k, 3.7, { dy: 6, align: 'center', baseline: 'top', size: 10, color: 'purple' });
          let cn = 0; for (let k = 0; k <= n; k++) cn += P.a(k) * P.b(n - k);
          const cs = Array.from({ length: K + 1 }, (_, m) => { let s = 0; for (let k = 0; k <= m; k++) s += P.a(k) * P.b(m - k); return s; });
          const top = Math.max(1.2, ...cs) * 1.15;
          C.setView(null, [Math.min(-0.25, Math.min(...cs) * 1.2), top]);
          C.bars(cs, { x0: 0, barWidth: 0.62, color: (_, m) => (m === n ? 'green' : 'faint'), fillAlpha: 0.85 });
          C.dot(n, cn, { color: 'green', r: 5, label: `c${n <= 9 ? String.fromCharCode(0x2080 + n) : 'ₙ'}`, labelPos: 'n' });
          C.path(Array.from({ length: K + 1 }, (_, m) => [m, P.cf(m)]), { color: 'ink', width: 1, dash: [3, 4] });
          state = { P, n, cn };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const terms = Array.from({ length: Math.min(s.n, 4) + 1 }, (_, k) => `a_{${k}}b_{${s.n - k}}`).join('+') + (s.n > 4 ? '+\\cdots' : '');
          return `$c_{${s.n}}=${terms}=${v.fix(s.cn, 5)}$, $\\;$ in closed form $${s.P.cl}$ (dashed).`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.50
    {
      num: '3.50',
      kind: 'Theorem',
      name: "Mertens' theorem on the Cauchy product",
      statement: String.raw`Suppose (a) $\sum_{n\ge0} a_n$ converges absolutely, (b) $\sum a_n=A$, (c) $\sum b_n=B$, and (d) $c_n=\sum_{k=0}^{n}a_kb_{n-k}$. Then $\sum c_n=AB$. In words: the product of two convergent series converges, to the product of their sums, provided at least one of them converges absolutely.`,
      idea: String.raw`With $\beta_n=B_n-B\to0$ one finds $C_n=A_nB+\sum_{k=0}^{n}a_{n-k}\beta_k$. The second term is a "smeared" version of $\beta$: split it into small $k$ (each $\beta_k$ weighted by tail terms $a_{n-k}\to0$) and large $k$ (where $|\beta_k|<\eps$, weighted by $\sum|a_j|<\infty$). Absolute convergence of $\sum a_n$ is what controls the weights. Without it the product can diverge (3.49).`,
      caption: String.raw`The grid shows every product $a_ib_j$ (blue $>0$, red $<0$). The Cauchy partial sum $C_N$ adds the green triangle $i+j\le N$; $A_NB_N$ adds the orange square. Slide $N$: with one series absolutely convergent the corner between them dies out and $C_N\to AB$. Bottom: the difference $A_NB_N-C_N$, i.e. the sum over that corner. Switch to Rudin's example 3.49 ($a_n=b_n=(-1)^n(n+1)^{-1/2}$, both only conditionally convergent): the anti-diagonals never shrink, $|c_n|\not\to0$, and $\sum c_n$ diverges.`,
      deps: ['pma-3.48', 'pma-3.45', 'pma-3.47', 'pma-3.3'],
      see: ['pma-3.51'],
      tags: ['series', 'Cauchy product'],
      viz(v) {
        const SER = {
          mert: { label: '$a_n=(-\\frac12)^n,\\ b_n=\\frac{(-1)^n}{n+1}$', a: (n) => (-0.5) ** n, b: (n) => (n % 2 ? -1 : 1) / (n + 1), A: 2 / 3, B: Math.LN2, ok: true },
          mert2: { label: '$a_n=\\frac{(-1)^n}{(n+1)^2},\\ b_n=\\frac{(-1)^n}{\\sqrt{n+1}}$', a: (n) => (n % 2 ? -1 : 1) / (n + 1) ** 2, b: (n) => (n % 2 ? -1 : 1) / Math.sqrt(n + 1), A: Math.PI ** 2 / 12, B: accelSum((n) => (n % 2 ? 1 : -1) / Math.sqrt(n)), ok: true },
          ex49: { label: 'Rudin 3.49: $a_n=b_n=\\frac{(-1)^n}{\\sqrt{n+1}}$', a: (n) => (n % 2 ? -1 : 1) / Math.sqrt(n + 1), b: (n) => (n % 2 ? -1 : 1) / Math.sqrt(n + 1), A: accelSum((n) => (n % 2 ? 1 : -1) / Math.sqrt(n)), B: accelSum((n) => (n % 2 ? 1 : -1) / Math.sqrt(n)), ok: false },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'mert');
        const G = 20, NMAX = 120;
        const nS = v.slider('$N$', 0, G, 9, { int: true });
        const L = v.stage({ x: [-1.2, G + 0.8], y: [-1.2, G + 0.8], equal: true, height: 380, axes: false, weight: 1, title: 'the products $a_ib_j$, $\\;0\\le i,j\\le 20$' });
        const R = v.stage({ x: [-6, NMAX + 6], y: [-1, 1], height: 380, axes: 'box', weight: 1.15, xlabel: 'N', title: 'partial sums of the product series' });
        const D = v.stage({ x: [-6, NMAX + 6], y: [-1, 1], height: 150, axes: 'box', full: true, xlabel: 'N', title: 'the corner: $A_NB_N-C_N=\\sum_{i,j\\le N,\\ i+j>N}a_ib_j$' });
        v.legend([['green', 'triangle $i+j\\le N$: $C_N$', { area: true }], ['orange', 'square $i,j\\le N$: $A_NB_N$', { area: true }], ['gold', '$C_N=\\sum_{n\\le N}c_n$ ($N$ even / odd)'], ['orange', '$A_NB_N$'], ['red', '$A_NB_N-C_N$'], ['green', '$AB$', { dash: true }]]);
        let cache = null;
        const data = () => {
          if (cache && cache.k === which.value) return cache;
          const Sx = SER[which.value];
          const a = Array.from({ length: NMAX + 1 }, (_, n) => Sx.a(n)), b = Array.from({ length: NMAX + 1 }, (_, n) => Sx.b(n));
          const C = [], AB = []; let Cn = 0, An = 0, Bn = 0;
          for (let n = 0; n <= NMAX; n++) { let c = 0; for (let k = 0; k <= n; k++) c += a[k] * b[n - k]; Cn += c; An += a[n]; Bn += b[n]; C.push([n, Cn]); AB.push([n, An * Bn]); }
          let mx = 0; for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) mx = Math.max(mx, Math.abs(a[i] * b[j]));
          cache = { k: which.value, Sx, a, b, C, AB, mx };
          return cache;
        };
        let state = null;
        v.render(() => {
          const d = data(), N = nS.value, Sx = d.Sx;
          for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
            const p = d.a[i] * d.b[j], t = Math.pow(Math.abs(p) / d.mx, 0.35);
            L.rect(i - 0.46, j - 0.46, i + 0.46, j + 0.46, { fill: p >= 0 ? 'blue' : 'red', fillAlpha: 0.06 + 0.8 * t, stroke: false });
          }
          L.poly([[-0.5, -0.5], [N + 0.5, -0.5], [N + 0.5, N + 0.5], [-0.5, N + 0.5]], { color: 'orange', width: 2.2 });
          L.poly([[-0.5, -0.5], [N + 0.5, -0.5], [N + 0.5, 0.5], ...Array.from({ length: N }, (_, m) => [[N - m - 0.5, m + 0.5], [N - m - 0.5, m + 1.5]]).flat(), [-0.5, N + 0.5]], { color: 'green', width: 2.6, fill: 'green', fillAlpha: 0.08 });
          for (let k = 0; k < G; k += 5) { L.text(String(k), k, -0.9, { align: 'center', size: 10.5, color: 'muted' }); L.text(String(k), -0.9, k, { align: 'center', size: 10.5, color: 'muted' }); }
          L.text('i', G, -0.9, { align: 'center', size: 13, color: 'muted', math: true }); L.text('j', -0.9, G, { align: 'center', size: 13, color: 'muted', math: true });
          // right panel
          const AB = Sx.A * Sx.B;
          const ys = d.C.map((p) => p[1]).concat(d.AB.map((p) => p[1]), [AB]);
          let lo = Math.min(...ys), hi = Math.max(...ys);
          if (!Sx.ok) { lo = Math.max(lo, AB - 2.2); hi = Math.min(hi, AB + 2.2); }
          const pad = (hi - lo) * 0.1 + 0.02;
          R.setView(null, [lo - pad, hi + pad]);
          R.hline(AB, { color: 'green', width: 1.6, dash: true });
          R.tex(`AB=${v.fix(AB, 4)}`, NMAX, AB, { align: 'right', baseline: 'top', dy: 4, color: 'green', size: 13 });
          // even and odd N drawn separately: both must close in on AB
          const ev = (arr) => arr.filter((q) => q[0] % 2 === 0), od = (arr) => arr.filter((q) => q[0] % 2 === 1);
          R.poly(ev(d.C).concat(od(d.C).reverse()), { fill: 'gold', fillAlpha: 0.1, stroke: false });
          R.path(ev(d.AB), { color: 'orange', width: 1.2 }); R.path(od(d.AB), { color: 'orange', width: 1.2, dash: [4, 4] });
          R.path(ev(d.C), { color: 'gold', width: 2.2 }); R.path(od(d.C), { color: 'gold', width: 2.2, dash: [6, 4] });
          // corner difference
          const diff = d.C.map(([n, c], i) => [n, d.AB[i][1] - c]);
          const dm = Math.max(0.05, ...diff.slice(3).map((q) => Math.abs(q[1]))) * 1.15;
          D.setView(null, [-dm, dm]);
          D.hline(0, { color: 'green', width: 1.4, dash: true });
          D.poly(ev(diff).concat(od(diff).reverse()), { fill: 'red', fillAlpha: 0.08, stroke: false });
          D.path(ev(diff), { color: 'red', width: 1.6 }); D.path(od(diff), { color: 'red', width: 1.6, dash: [6, 4] });
          D.vline(N, { color: 'faint', width: 1.2 });
          D.dot(N, diff[N][1], { color: 'red', r: 4 });
          R.vline(N, { color: 'faint', width: 1.2 });
          R.dot(N, d.C[N][1], { color: 'gold', r: 5 }); R.dot(N, d.AB[N][1], { color: 'orange', r: 4.5 });
          R.corner(Sx.ok ? 'Σ aₙ converges absolutely ⇒ C → AB' : '|cₙ| ≥ 1 for all n: Σ cₙ diverges', 'tl', { color: Sx.ok ? 'green' : 'red', weight: 600 });
          let cN = 0; for (let k = 0; k <= N; k++) cN += d.a[k] * d.b[N - k];
          state = { N, C: d.C[N][1], P: d.AB[N][1], AB, cN, ok: Sx.ok, CM: d.C[NMAX][1] };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$N=${s.N}$: $\\;C_N=${v.fix(s.C, 5)}$, $\\;A_NB_N=${v.fix(s.P, 5)}$, $\\;c_N=${v.fix(s.cN, 4)}$; $\\;AB=${v.fix(s.AB, 5)}$.` + (s.ok ? ` At $N=${NMAX}$: $C_N=${v.fix(s.CM, 5)}$.` : ' The terms $c_n$ do not tend to $0$, so $\\sum c_n$ cannot converge (3.23).');
        });
      },
    },

    // ------------------------------------------------------------------ 3.51
    {
      num: '3.51',
      kind: 'Theorem',
      name: "Abel's theorem on the product of series",
      statement: String.raw`If the series $\sum a_n$, $\sum b_n$ and $\sum c_n$ converge to $A$, $B$ and $C$, where $c_n=a_0b_n+a_1b_{n-1}+\cdots+a_nb_0$, then $C=AB$.`,
      idea: String.raw`No absolute convergence is assumed, so Mertens' argument is unavailable. Rudin defers the proof to 8.2: for $0\le x<1$ the power series $f(x)=\sum a_nx^n$, $g(x)=\sum b_nx^n$, $h(x)=\sum c_nx^n$ converge absolutely, so $h=fg$ there (3.50). Abel's theorem lets $x\to1^-$ in each series, giving $C=AB$. The theorem says nothing about *whether* $\sum c_n$ converges — only what it converges to.`,
      caption: String.raw`Here $a_n=b_n=\frac{(-1)^n}{(n+1)^s}$; slide $s$. Left: on $[0,1)$ the power series satisfy $h(x)=f(x)^2$ exactly, and Abel's limit $x\to1^-$ carries the identity to the sums. Right: the partial sums $C_N$ of the Cauchy product. For $s>\frac12$ all three series converge and $C_N\to AB$ even when $s\le1$ (no absolute convergence); for $s\le\frac12$ the terms $c_n$ stop shrinking — the case of 3.49 — and $\sum c_n$ diverges, so the theorem does not apply.`,
      deps: ['pma-3.48', 'pma-3.50'],
      see: ['pma-8.2'],
      verify: true,
      tags: ['series', 'Cauchy product'],
      viz(v) {
        const sS = v.slider('$s$', 0.3, 1.4, 0.75, { step: 0.05 });
        const NN = 1500;
        const L = v.stage({ x: [-0.04, 1.06], y: [0, 1.1], height: 340, axes: 'box', weight: 1, xlabel: 'x', title: '$f(x)=\\sum a_nx^n$, $\\;f(x)^2$, and $h(x)=\\sum c_nx^n$ on $[0,1)$' });
        const XM = Math.log10(NN);
        const R = v.stage({ x: [-0.12, XM + 0.12], y: [0, 1], height: 340, axes: 'box', weight: 1.1, xlabel: 'N', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], title: 'partial sums $C_N$ of $\\sum c_n$: even $N$ and odd $N$' });
        v.legend([['accent', '$f(x)=g(x)$'], ['green', '$f(x)^2$'], ['gold', '$h(x)$; $\\,C_N$ ($N$ even / odd)', { dash: true }], ['green', '$AB$', { dash: true }]]);
        let cache = null;
        const data = (s) => {
          if (cache && cache.s === s) return cache;
          const a = Array.from({ length: NN + 1 }, (_, n) => (n % 2 ? -1 : 1) / Math.pow(n + 1, s));
          const c = new Float64Array(NN + 1);
          for (let n = 0; n <= NN; n++) { let t = 0; for (let k = 0; k <= n; k++) t += a[k] * a[n - k]; c[n] = t; }
          const A = accelSum((n) => (n % 2 ? 1 : -1) / Math.pow(n, s));
          const ser = (co, x) => { let t = 0, p = 1; for (let n = 0; n <= NN; n++) { t += co[n] * p; p *= x; if (Math.abs(p) < 1e-17) break; } return t; };
          const xs = []; for (let i = 0; i <= 120; i++) xs.push(0.98 * i / 120);
          const fx = xs.map((x) => [x, ser(a, x)]), hx = xs.map((x) => [x, ser(c, x)]);
          const Cp = [], Pp = [], Ce = [], Co = []; let Cn = 0, An = 0;
          for (let n = 0; n <= NN; n++) {
            Cn += c[n]; An += a[n]; Cp.push([n, Cn]);
            const x = Math.log10(n + 1);
            if (n < 80 || n % 3 === 0) Pp.push([x, An * An]);
            (n % 2 ? Co : Ce).push([x, Cn]);
          }
          cache = { s, a, c, A, fx, hx, Cp, Pp, Ce, Co };
          return cache;
        };
        let state = null;
        v.render(() => {
          const s = sS.value, d = data(s), AB = d.A * d.A, conv = s > 0.5 + 1e-9;
          // left
          L.vline(1, { color: 'faint', width: 1, dash: [3, 3] });
          L.path(d.fx, { color: 'accent', width: 2.4 });
          L.path(d.fx.map(([x, y]) => [x, y * y]), { color: 'green', width: 4, alpha: 0.45 });
          L.path(d.hx, { color: 'gold', width: 2, dash: [6, 5] });
          L.dot(1, d.A, { color: 'accent', r: 6.5, hollow: true, width: 2.2 });
          L.tex(`A=B=${v.fix(d.A, 4)}`, 1, d.A, { align: 'right', baseline: 'top', dx: -12, dy: 8, color: 'accent', size: 13 });
          L.dot(1, AB, { color: conv ? 'green' : 'red', r: 6.5, hollow: true, width: 2.2 });
          L.tex(conv ? `C=AB=${v.fix(AB, 4)}` : `AB=${v.fix(AB, 4)}`, 1, AB, { align: 'right', baseline: 'top', dx: -10, dy: 6, color: conv ? 'green' : 'red', size: 13 });
          // right
          const ys = d.Cp.slice(6).map((p) => p[1]);
          let lo = Math.min(AB, ...ys), hi = Math.max(AB, ...ys);
          if (!conv) { lo = Math.max(lo, AB - 3); hi = Math.min(hi, AB + 3); }
          const pad = (hi - lo) * 0.1 + 0.03;
          R.setView(null, [lo - pad, hi + pad]);
          R.poly(d.Ce.concat(d.Co.slice().reverse()), { fill: 'gold', fillAlpha: 0.1, stroke: false });
          R.hline(AB, { color: 'green', width: 1.6, dash: true });
          R.tex(`AB=${v.fix(AB, 4)}`, XM + 0.1, AB, { align: 'right', baseline: 'bottom', dy: -3, color: 'green', size: 13 });
          R.path(d.Ce, { color: 'gold', width: 2 });
          R.path(d.Co, { color: 'gold', width: 2, dash: [5, 4] });
          R.corner(s > 1 + 1e-9 ? 'absolutely convergent: Mertens (3.50) already applies' : conv ? 'only conditionally convergent, yet C = AB' : 'cₙ ↛ 0: Σ cₙ diverges — hypothesis fails', 'tr', { color: conv ? 'green' : 'red', weight: 600 });
          state = { s, A: d.A, AB, C: d.Cp[NN][1], C1: d.Cp[NN - 1][1], cN: d.c[NN], conv };
        });
        v.readout(() => {
          const st = state; if (!st) return '';
          return `$s=${v.fix(st.s, 2)}$: $\\;A=B=\\sum\\frac{(-1)^n}{(n+1)^s}=${v.fix(st.A, 5)}$, $\\;AB=${v.fix(st.AB, 5)}$; $\\;C_{${NN - 1}}=${v.fix(st.C1, 4)}$, $\\;C_{${NN}}=${v.fix(st.C, 4)}$, $\\;c_{${NN}}=${v.fix(st.cN, 4)}$` + (st.conv ? '. The even and odd partial sums squeeze together, so $\\sum c_n$ converges — and Abel\'s theorem forces its sum to be $AB$.' : `. Here $|c_n|$ behaves like $n^{1-2s}$, which does not tend to $0$: no sum to speak of.`);
        });
      },
    },

    // ------------------------------------------------------------------ 3.52
    {
      num: '3.52',
      kind: 'Definition',
      name: 'Rearrangement of a series',
      statement: String.raw`Let $\{k_n\}_{n\ge1}$ be a sequence of positive integers in which every positive integer appears exactly once, i.e. $n\mapsto k_n$ is a bijection of $\{1,2,3,\dots\}$ onto itself. With $a'_n=a_{k_n}$, the series $\sum a'_n$ is called a *rearrangement* of $\sum a_n$.`,
      idea: String.raw`A rearrangement uses every term exactly once, only in a different order. For finite sums the order is irrelevant; for infinite series it can matter (3.53, 3.54) unless the series converges absolutely (3.55).`,
      caption: String.raw`Choose a bijection $n\mapsto k_n$. Each line joins a term $a_{k_n}$ of $\sum\frac{(-1)^{n+1}}{n}$ (top) to its new position $n$ (bottom). Right: partial sums before (blue) and after (gold) rearranging. Rudin's example 3.53 — two positive terms, then one negative — uses exactly the same terms but converges to $\frac32\log2$ instead of $\log 2$.`,
      deps: ['pma-3.21'],
      tags: ['series', 'rearrangement'],
      viz(v) {
        const M = 18, NP = 3000;
        const PERMS = {
          swap: { label: 'swap neighbours $2,1,4,3,\\dots$', k: (len) => Array.from({ length: len }, (_, i) => (i % 2 ? i : i + 2)), lim: Math.LN2 },
          rudin: { label: 'Rudin 3.53: $+,+,-$', k: (len) => blockPattern(2, 1, len), lim: 1.5 * Math.LN2 },
          rev: { label: 'reverse blocks of length $1,2,3,\\dots$', k: (len) => { const out = []; let start = 1, L = 1; while (out.length < len) { for (let j = start + L - 1; j >= start && out.length < len; j--) out.push(j); start += L; L++; } return out; }, lim: Math.LN2 },
        };
        const which = v.select('', Object.entries(PERMS).map(([value, o]) => ({ value, label: o.label })), 'rudin');
        const A = v.stage({ x: [-0.6, M + 0.6], y: [-2.65, 2.6], height: 340, axes: false, weight: 1.25, title: 'top: $a_k=\\frac{(-1)^{k+1}}{k}$ in order; bottom: $a\'_n=a_{k_n}$' });
        const P = v.stage({ x: [0, 3.6], y: [0.45, 1.2], height: 330, axes: 'box', weight: 1, xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], xlabel: 'n', title: 'partial sums (log scale in $n$)' });
        v.legend([['accent', '$\\sum a_n$', { area: true }], ['gold', 'rearranged $\\sum a\'_n$', { area: true }], ['green', '$\\log 2$', { dash: true }], ['orange', '$\\frac32\\log2$', { dash: true }]]);
        const a = (k) => (k % 2 ? 1 : -1) / k;
        let state = null;
        v.render(() => {
          const Pm = PERMS[which.value], ks = Pm.k(NP);
          const H = 0.8, YT = 1.35, YB = -1.75;
          for (let k = 1; k <= M; k++) {
            A.rect(k - 0.32, YT, k + 0.32, YT + a(k) * H, { fill: 'accent', fillAlpha: 0.75, stroke: false });
            A.text(String(k), k, 2.42, { align: 'center', size: 10, color: 'muted' });
          }
          A.line(0.5, YT, M + 0.5, YT, { color: 'faint', width: 1 }); A.line(0.5, YB, M + 0.5, YB, { color: 'faint', width: 1 });
          for (let n = 1; n <= M; n++) {
            const k = ks[n - 1];
            const val = a(k);
            A.rect(n - 0.32, YB, n + 0.32, YB + val * H, { fill: 'gold', fillAlpha: 0.8, stroke: false });
            A.text(String(n), n, -2.5, { align: 'center', size: 10, color: 'muted' });
            if (k <= M) A.line(k, 0.85, n, -0.85, { color: k % 2 ? 'accent' : 'red', width: 1.2, alpha: 0.6 });
            else A.line(n, -0.85, n + 0.45, -0.1, { color: 'muted', width: 1, dash: [2, 2] });
          }
          A.text('k', M + 0.5, 2.42, { align: 'center', size: 12, color: 'muted', math: true });
          A.text('n', M + 0.5, -2.5, { align: 'center', size: 12, color: 'muted', math: true });
          // partial sums
          const s1 = [], s2 = []; let t1 = 0, t2 = 0;
          for (let n = 1; n <= NP; n++) { t1 += a(n); t2 += a(ks[n - 1]); const x = Math.log10(n); s1.push([x, t1]); s2.push([x, t2]); }
          const yy = s1.concat(s2).map((q) => q[1]);
          P.setView(null, [Math.min(...yy) - 0.05, Math.max(...yy) + 0.05]);
          P.hline(Math.LN2, { color: 'green', width: 1.5, dash: true });
          P.hline(1.5 * Math.LN2, { color: 'orange', width: 1.5, dash: true });
          P.path(s1, { color: 'accent', width: 1.6 });
          P.path(s2, { color: 'gold', width: 1.9 });
          state = { ks, t1, t2, lim: Pm.lim };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          return `$k_1,k_2,\\dots = ${s.ks.slice(0, 14).join(',')},\\dots$ — every index exactly once. After ${NP} terms: $\\sum a_n\\approx${v.fix(s.t1, 4)}$, rearranged $\\approx${v.fix(s.t2, 4)}$ $\\;\\to ${v.fix(s.lim, 4)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.54
    {
      num: '3.54',
      kind: 'Theorem',
      name: 'Riemann rearrangement theorem',
      statement: String.raw`Let $\sum a_n$ be a series of real numbers that converges but not absolutely, and let $-\infty\le\alpha\le\beta\le+\infty$. Then there is a rearrangement $\sum a'_n$ with partial sums $s'_n$ such that $$\liminf_{n\to\infty}s'_n=\alpha,\qquad \limsup_{n\to\infty}s'_n=\beta .$$`,
      idea: String.raw`Split the terms into the positive ones $p_1,p_2,\dots$ and the negative ones $-q_1,-q_2,\dots$ (in their original order). Both $\sum p_k$ and $\sum q_k$ diverge — if one converged, so would the other (3.47), and $\sum|a_n|$ would converge — while $p_k,q_k\to0$ (3.23). Now be greedy: take just enough positive terms to climb above $\beta$, then just enough negative terms to drop below $\alpha$, and repeat. Divergence of each pile guarantees you can always get there; since the overshoot is at most the last term used, the peaks tend to $\beta$ and the troughs to $\alpha$ (using targets $\alpha_k\to\alpha$, $\beta_k\to\beta$ when they are infinite).`,
      caption: String.raw`Drag the targets $\alpha$ and $\beta$ (or switch to “converge to $L$” or “diverge to $+\infty$”). Top: the greedy rearrangement of the chosen series, plotted against $\log_{10}n$; peaks settle on $\beta$, troughs on $\alpha$. Bottom: the same process as a walk — right for each positive term used, up for each negative one; the walk must stay in the band between the lines $P-Q=\alpha$ and $P-Q=\beta$, and it can go on forever only because both piles are infinite. Pick the absolutely convergent $\sum\frac{(-1)^{n+1}}{n^2}$ and the walk is trapped in a finite box: the trick fails, as 3.55 says it must.`,
      deps: ['pma-3.52', 'pma-3.47', 'pma-3.23', 'pma-3.45'],
      see: ['pma-3.55'],
      tags: ['series', 'rearrangement'],
      viz(v) {
        const NMAX = 20000;
        const SER = {
          h: { label: '$\\frac{(-1)^{n+1}}{n}$', e: 1, abs: false },
          r: { label: '$\\frac{(-1)^{n+1}}{\\sqrt n}$', e: 0.5, abs: false },
          s: { label: '$\\frac{(-1)^{n+1}}{n^2}$ (absolute)', e: 2, abs: true },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'h');
        const mode = v.select('', [{ value: 'osc', label: 'oscillate: $\\liminf=\\alpha,\\ \\limsup=\\beta$' }, { value: 'conv', label: 'converge to $L$' }, { value: 'inf', label: 'diverge to $+\\infty$' }], 'osc');
        const XM = Math.log10(NMAX);
        const T = v.stage({ x: [-0.08, XM + 0.32], y: [-1.6, 2.6], height: 330, axes: 'box', full: true, xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴']], xlabel: 'n', title: 'partial sums $s\'_n$ of the greedy rearrangement' });
        const W = v.stage({ x: [-0.2, 6], y: [-0.2, 6], equal: true, height: 270, full: true, axes: false, title: 'the walk $(P_n, Q_n)$: positive terms used (→) against negative terms used (↑)' });
        const hA = T.handle(XM + 0.17, 0.25, { color: 'purple', label: 'α', constrain: (x, y) => [XM + 0.17, v.M.clamp(y, -1.5, mode.value === 'osc' && hB ? hB.y : 2.5)] });
        const hB = T.handle(XM + 0.17, 1.05, { color: 'teal', label: 'β', constrain: (x, y) => [XM + 0.17, v.M.clamp(y, hA.y, 2.5)] });
        v.legend([['gold', 'partial sums $s\'_n$'], ['purple', 'target $\\alpha$ / troughs', { dot: true }], ['teal', 'target $\\beta$ / peaks', { dot: true }], ['orange', 'band $\\alpha\\le P-Q\\le\\beta$', { area: true }]]);
        let state = null;
        v.render(() => {
          const S = SER[which.value], md = mode.value;
          hB.visible = md === 'osc'; hA.visible = md !== 'inf';
          if (md === 'osc' && hB.y < hA.y) hB.y = Math.min(2.5, hA.y);
          const al = hA.y, be = md === 'osc' ? hB.y : al;
          const pos = (j) => Math.pow(2 * j - 1, -S.e), neg = (j) => Math.pow(2 * j, -S.e);
          // greedy rearrangement
          let s = 0, P = 0, Q = 0, ip = 1, iq = 1, up = true, cycle = 1;
          const pts = [], walk = [[0, 0]], peaks = [], troughs = [];
          let posUsed = 0, negUsed = 0;
          for (let n = 1; n <= NMAX; n++) {
            const hi = md === 'inf' ? 0.6 * cycle : be, lo = md === 'inf' ? 0.6 * cycle - 0.8 : al;
            if (up && s > hi) { up = false; peaks.push([n - 1, s]); }
            else if (!up && s < lo) { up = true; troughs.push([n - 1, s]); cycle++; }
            if (up) { const t = pos(ip++); s += t; P += t; posUsed++; } else { const t = neg(iq++); s -= t; Q += t; negUsed++; }
            pts.push([Math.log10(n), s]);
            if (n < 400 || n % 5 === 0) walk.push([P, Q]);
          }
          walk.push([P, Q]);
          // top panel
          let lo = Math.min(-1.6, ...pts.map((p) => p[1])), hiY = Math.max(2.6, ...pts.map((p) => p[1]));
          if (md !== 'inf') { lo = -1.6; hiY = 2.6; }
          T.setView(null, [lo, hiY + 0.1]);
          if (md !== 'inf') {
            T.hline(al, { color: 'purple', width: 1.5, dash: true });
            if (md === 'osc') { T.hline(be, { color: 'teal', width: 1.5, dash: true }); T.hband(al, be, { color: 'orange', alpha: 0.07 }); }
          }
          T.path(pts, { color: 'gold', width: 1.4 });
          T.dots(peaks.map(([n, y]) => [Math.log10(Math.max(1, n)), y]), { color: 'teal', r: 3.2 });
          T.dots(troughs.map(([n, y]) => [Math.log10(Math.max(1, n)), y]), { color: 'purple', r: 3.2 });
          if (md === 'conv') T.tex('L', XM + 0.05, al, { align: 'right', baseline: 'bottom', dy: -3, color: 'purple', size: 15 });
          const stuck = S.abs && up && peaks.length === 0 && md !== 'conv' ? true : S.abs && negUsed < NMAX * 0.05 && md === 'osc';
          if (S.abs) T.corner(`Σ of all positive terms = π²/8 ≈ 1.234, of all negative = π²/24 ≈ 0.411`, 'tl', { color: 'red', weight: 600 });
          // walk panel
          const Wm = Math.max(1.2, P, Q) * 1.08;
          W.setView([-0.04 * Wm, Wm], [-0.04 * Wm, Wm]);
          W.line(0, 0, Wm, 0, { color: 'faint', width: 1 }); W.line(0, 0, 0, Wm, { color: 'faint', width: 1 });
          if (md !== 'inf') {
            const b1 = md === 'osc' ? be : al;
            const band = [[Math.max(0, al), Math.max(0, -al)], [Wm * 2, Wm * 2 - al], [Wm * 2, Wm * 2 - b1], [Math.max(0, b1), Math.max(0, -b1)]];
            if (al < 0 && b1 > 0) band.push([0, 0]);
            W.poly(band, { fill: 'orange', fillAlpha: 0.12, stroke: false });
            W.line(Math.max(0, al), Math.max(0, -al), Wm * 2, Wm * 2 - al, { color: 'purple', width: 1.4, dash: true });
            if (md === 'osc') W.line(Math.max(0, be), Math.max(0, -be), Wm * 2, Wm * 2 - be, { color: 'teal', width: 1.4, dash: true });
          }
          if (S.abs) W.rect(0, 0, Math.PI ** 2 / 8, Math.PI ** 2 / 24, { color: 'red', width: 1.6, dash: [5, 4], fill: 'red', fillAlpha: 0.05 });
          W.path(walk, { color: 'gold', width: 1.6 });
          W.dot(P, Q, { color: 'gold', r: 4.5 });
          W.text('P = positive terms used', Wm * 0.98, 0, { align: 'right', baseline: 'bottom', dy: -4, size: 11, color: 'muted' });
          W.text('Q = |negative terms| used', 0, Wm * 0.98, { align: 'left', baseline: 'top', dx: 6, size: 11, color: 'muted' });
          state = { S, md, al, be, peaks, troughs, s, posUsed, negUsed, cycle, P, Q, stuck };
        });
        v.readout(() => {
          const st = state; if (!st) return '';
          const last = (arr) => (arr.length ? v.fix(arr[arr.length - 1][1], 4) : '—');
          if (st.S.abs) return `Absolutely convergent: the positive pile is finite ($P\\le\\pi^2/8$), so the greedy walk cannot keep returning to the band. After ${NMAX} terms ($${st.posUsed}$ positive, $${st.negUsed}$ negative) $s'_n=${v.fix(st.s, 4)}$; every genuine rearrangement sums to $\\pi^2/12=${v.fix(Math.PI ** 2 / 12, 4)}$ (3.55).`;
          if (st.md === 'inf') return `Targets $\\beta_k=0.6k\\to\\infty$ (with $\\alpha_k=\\beta_k-0.8$): after ${NMAX} terms $s'_n=${v.fix(st.s, 3)}$, having used $${st.posUsed}$ positive and $${st.negUsed}$ negative terms; each new level costs exponentially many terms for $\\frac1n$.`;
          if (st.md === 'conv') return `Target $L=${v.fix(st.al, 3)}$: $s'_{${NMAX}}=${v.fix(st.s, 5)}$; the crossings of $L$ overshoot by at most the last term used, which tends to $0$.`;
          return `$\\alpha=${v.fix(st.al, 3)}$, $\\beta=${v.fix(st.be, 3)}$: ${st.peaks.length} peaks and ${st.troughs.length} troughs so far; latest peak $${last(st.peaks)}$, latest trough $${last(st.troughs)}$ — overshoots shrink because the terms tend to $0$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.55
    {
      num: '3.55',
      kind: 'Theorem',
      name: 'Rearranging an absolutely convergent series',
      statement: String.raw`If $\sum a_n$ is a series of complex numbers that converges absolutely, then every rearrangement of $\sum a_n$ converges, and all of them converge to the same sum.`,
      idea: String.raw`Given $\eps>0$, choose $N$ with $\sum_{n>N}|a_n|<\eps$ (Cauchy criterion for $\sum|a_n|$, 3.22). Choose $p_0$ so large that $a_1,\dots,a_N$ all occur among $a'_1,\dots,a'_{p_0}$. For $p\ge p_0$ the difference $s_p-s'_p$ involves only terms with index $>N$, so $|s_p-s'_p|\le\eps$. Hence $s'_p$ has the same limit as $s_p$.`,
      caption: String.raw`The rearrangement takes several positive terms, then one negative ($+,+,-$ or $+,+,+,+,-$). Choose $\eps$: it fixes $N$ with $\sum_{n>N}|a_n|<\eps$, and $p_0$ is the position by which all of $a_1,\dots,a_N$ have appeared (right: the permutation $n\mapsto k_n$; every dot below the line $k=N$ lies left of $p_0$). From $p_0$ on, the rearranged partial sums (gold) stay within $\eps$ of the original ones (blue). Switch to the conditionally convergent $\sum\frac{(-1)^{n+1}}{n}$: no finite $N$ exists, and the rearranged sum drifts to a different value.`,
      deps: ['pma-3.52', 'pma-3.22', 'pma-3.45'],
      see: ['pma-3.54'],
      tags: ['series', 'rearrangement', 'absolute convergence'],
      viz(v) {
        const NP = 400;
        const SER = {
          abs: { label: '$\\frac{(-1)^{n+1}}{n^2}$ (absolute)', a: (n) => (n % 2 ? 1 : -1) / (n * n), abs: true, sum: Math.PI ** 2 / 12 },
          cond: { label: '$\\frac{(-1)^{n+1}}{n}$ (conditional)', a: (n) => (n % 2 ? 1 : -1) / n, abs: false, sum: Math.LN2 },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'abs');
        const pat = v.select('pattern', [{ value: 2, label: '$+,+,-$' }, { value: 4, label: '$+,+,+,+,-$' }], 2);
        const eS = v.slider('$\\varepsilon$', 0.005, 0.2, 0.04, { log: true, decimals: 3 });
        const L = v.stage({ x: [-46, NP + 24], y: [0, 1], height: 290, axes: 'box', weight: 1.2, xlabel: 'p', title: 'partial sums $s_p$ and rearranged $s\'_p$' });
        const K = v.stage({ x: [-40, NP + 24], y: [-14, NP + 14], height: 290, axes: 'box', weight: 1, xlabel: 'n', title: 'the permutation: dots $(n, k_n)$' });
        const Dd = v.stage({ x: [-14, NP + 14], y: [-5, 0.5], height: 200, axes: 'box', full: true, xlabel: 'p', yticks: [[0, '1'], [-1, '10⁻¹'], [-2, '10⁻²'], [-3, '10⁻³'], [-4, '10⁻⁴'], [-5, '10⁻⁵']], title: 'the proof: $|s\'_p-s_p|$ (log scale) drops below $\\varepsilon$ once $p\\ge p_0$' });
        v.legend([['accent', '$s_p$'], ['gold', '$s\'_p$'], ['red', '$|s\'_p-s_p|$'], ['green', '$\\varepsilon$ and the region $p\\ge p_0$', { area: true }], ['orange', '$p_0$ and $k=N$', { dash: true }]]);
        let state = null;
        v.render(() => {
          const S = SER[which.value], eps = eS.value, ks = blockPattern(+pat.value, 1, NP);
          // N with tail of |a_n| below eps
          let N = Infinity;
          if (S.abs) { let tail = Math.PI ** 2 / 6; for (let n = 1; n <= 100000; n++) { tail -= 1 / (n * n); if (tail < eps) { N = n; break; } } }
          let p0 = Infinity;
          if (isFinite(N)) { const pos = new Map(ks.map((k, i) => [k, i + 1])); p0 = 0; for (let k = 1; k <= N; k++) p0 = Math.max(p0, pos.get(k) ?? Infinity); }
          const s1 = [], s2 = [], df = []; let t1 = 0, t2 = 0, worst = 0;
          for (let p = 1; p <= NP; p++) { t1 += S.a(p); t2 += S.a(ks[p - 1]); s1.push([p, t1]); s2.push([p, t2]); df.push([p, Math.log10(Math.max(1e-6, Math.abs(t1 - t2)))]); if (p >= p0) worst = Math.max(worst, Math.abs(t1 - t2)); }
          const lim2 = S.abs ? S.sum : Math.LN2 + 0.5 * Math.log(+pat.value);
          const allY = s1.slice(7).map((q) => q[1]).concat(s2.slice(7).map((q) => q[1]), [S.sum, lim2]);
          const lo = Math.min(...allY), hi = Math.max(...allY), pad = (hi - lo) * 0.15 + 0.01;
          L.setView(null, [lo - pad, hi + pad]);
          L.hline(S.sum, { color: 'accent', width: 1, dash: [2, 3] });
          if (!S.abs) L.hline(lim2, { color: 'gold', width: 1, dash: [2, 3] });
          if (isFinite(p0) && p0 <= NP) L.vline(p0, { color: 'orange', width: 1.6, dash: true });
          L.path(s1, { color: 'accent', width: 1.6 });
          L.path(s2, { color: 'gold', width: 1.8 });
          L.corner(S.abs ? 'same limit π²/12' : 'different limits: log 2 vs log 2 + ½ log ' + pat.value, 'tr', { color: S.abs ? 'green' : 'red', weight: 600 });
          // difference panel
          const le = Math.log10(eps);
          if (isFinite(p0) && p0 <= NP) Dd.rect(p0, -5, NP, le, { fill: 'green', fillAlpha: 0.12, stroke: false });
          Dd.hline(le, { color: 'green', width: 1.6, dash: true });
          Dd.tex('\\varepsilon', NP + 10, le, { align: 'right', baseline: 'bottom', dy: -2, color: 'green', size: 15 });
          if (isFinite(p0) && p0 <= NP) { Dd.vline(p0, { color: 'orange', width: 1.6, dash: true }); Dd.tex('p_0', p0, 0.45, { align: 'left', baseline: 'top', dx: 5, color: 'orange', size: 14 }); }
          Dd.path(df, { color: 'red', width: 1.3 });
          Dd.corner(S.abs ? (p0 <= NP ? `N = ${N}, p₀ = ${p0}: max over p ≥ p₀ of |s′ₚ − sₚ| = ${v.fix(worst, 4)} < ε` : `N = ${N}: p₀ = ${p0} lies beyond the window`) : 'Σ|aₙ| = ∞: no N exists, and the gap never closes', 'tr', { color: S.abs ? 'green' : 'red', weight: 600 });
          // permutation
          const kmax = Math.max(...ks);
          K.setView(null, [-0.035 * kmax, kmax * 1.035]);
          K.path([[0, 0], [NP, NP]], { color: 'faint', width: 1, dash: [3, 3] });
          if (isFinite(N)) { K.hline(N, { color: 'orange', width: 1.4, dash: true }); K.tex('k=N', NP, N, { align: 'right', baseline: 'bottom', dy: -3, color: 'orange', size: 13 }); }
          if (isFinite(p0) && p0 <= NP) K.vline(p0, { color: 'orange', width: 1.4, dash: true });
          const inN = [], rest = [];
          ks.forEach((k, i) => (k <= N ? inN : rest).push([i + 1, k]));
          K.dots(rest, { color: 'muted', r: 1.6, alpha: 0.7 });
          K.dots(inN, { color: 'accent', r: 2.2 });
          state = { S, N, p0, worst, t1, t2, eps, pat: +pat.value };
        });
        v.readout(() => {
          const st = state; if (!st) return '';
          if (!st.S.abs) return `Here $\\sum|a_n|=\\infty$, so no $N$ makes the tail small. After ${NP} terms: $s_{${NP}}=${v.fix(st.t1, 4)}\\to\\log2$, but $s'_{${NP}}=${v.fix(st.t2, 4)}\\to\\log2+\\frac12\\log ${st.pat}=${v.fix(Math.LN2 + 0.5 * Math.log(st.pat), 4)}$.`;
          return `$\\varepsilon=${v.fix(st.eps, 3)}$: $\\;N=${st.N}$ gives $\\sum_{n>N}|a_n|<\\varepsilon$; all of $a_1,\\dots,a_N$ appear by position $p_0=${st.p0}$, and for $p_0\\le p\\le ${NP}$: $\\max|s'_p-s_p|=${v.fix(st.worst, 5)}<\\varepsilon$. Both tend to $\\pi^2/12=${v.fix(st.S.sum, 5)}$.`;
        });
      },
    },
  ],
};
