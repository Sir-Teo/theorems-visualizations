// Combinatorics — Chapter 4: Generating functions (items 4.1–4.9; 4.10–4.18 are in ch04-b.js)
//
// House style, as in chapters 1–3: every number in a readout comes from the objects themselves (all tilings, all
// words, all subsets) or from the series arithmetic of ch04.shared.js, and is compared with the closed form the
// theorem claims. Colours: blue = the sequence / series, orange = its second description (closed form, transfer
// matrix, EGF), green = agreement, gold = the item currently selected.
import {
  CAT, pen, binom, fact, range, commas,
  sMul, sInv, sCompose, sExp, ratCoeffs, numStr, fracTex, fibBig, circlePts,
} from './ch04.shared.js';

const PHI = (1 + Math.sqrt(5)) / 2;
const sgnStr = (x) => (x < 0 ? '−' : '+');

/** Evaluate sum of coefficient list as TeX "1 + 2x + 3x^2 + …" (first `m` nonzero terms). */
function serTex(a, m = 6) {
  const out = [];
  for (let i = 0; i < a.length && out.length < m; i++) {
    if (Math.abs(a[i]) < 1e-12) continue;
    const c = fracTex(a[i]); const abs = c.startsWith('-') ? c.slice(1) : c; const neg = c.startsWith('-');
    const body = (abs === '1' && i > 0 ? '' : abs) + (i === 0 ? '' : i === 1 ? 'x' : `x^{${i}}`);
    out.push((out.length ? (neg ? ' - ' : ' + ') : neg ? '-' : '') + body);
  }
  return (out.join('') || '0') + (a.length > 6 ? '+\\cdots' : '');
}

export default {
  collection: 'comb',
  chapter: 4,
  title: 'Generating functions',
  summary: String.raw`A generating function packages a whole sequence as one formal power series, so that recurrences become algebraic equations and combinatorial constructions become operations on series. Ordinary generating functions handle unlabelled structures and rational ones correspond exactly to linear recurrences; exponential generating functions handle labelled structures, with the exponential formula linking connected and arbitrary objects. Lagrange inversion solves functional equations for trees, and the nearest singularity reveals the growth rate.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Formal power series',
      statement: String.raw`A **formal power series** over $\Q$ (or $\C$) is an infinite sequence $A=(a_0,a_1,a_2,\dots)$, written $A(x)=\sum_{n\ge0}a_nx^n$; no value of $x$ is ever substituted. Sums and products are defined coefficientwise,
$$[x^n](A+B)=a_n+b_n,\qquad [x^n](AB)=\sum_{k=0}^n a_kb_{n-k}.$$
Each coefficient of a sum or product involves only **finitely many** coefficients of the inputs. Likewise $1/A$ exists exactly when $a_0\ne0$, and the composition $A(B(x))=\sum_k a_kB(x)^k$ exists whenever $b_0=0$, because $B^k$ has no terms below $x^k$.`,
      idea: String.raw`The point of the definition is that every operation is *locally finite*: coefficient $n$ of the result is a fixed polynomial in the first $n+1$ coefficients of the inputs (for the reciprocal, $b_n=-a_0^{-1}\sum_{k=1}^n a_kb_{n-k}$ is solved recursively). Equalities of series are therefore equalities of infinitely many finite identities, and convergence — analysis — never enters. Analytic meaning can be added later (4.16), but counting identities hold in this ring whatever the radius of convergence is, even zero.`,
      caption: String.raw`Choose two series $A$, $B$ and an operation. The three bar charts show the coefficients; drag the index $n$ and the coefficients that coefficient $n$ of the result *actually uses* turn gold. Change the truncation order $N$: the first coefficients of the result never change, because each depends only on finitely many inputs (the readout compares the result computed at order $N$ and at order $N+8$).`,
      deps: ['comb-1.1'],
      refs: ['Aigner ch. 2', 'Stanley EC1 §1.1'],
      tags: ['generating functions', 'formal series'],
      viz(v) {
        const PA = {
          geo: { tex: '1/(1-x)', f: () => 1 }, ex: { tex: 'e^x', f: (n) => 1 / fact(n) },
          fib: { tex: '1-x-x^2', f: (n) => (n === 0 ? 1 : n < 3 ? -1 : 0) }, lin: { tex: '1+x', f: (n) => (n < 2 ? 1 : 0) },
        };
        const PB = {
          x: { tex: 'x', f: (n) => (n === 1 ? 1 : 0) }, xx: { tex: 'x+x^2', f: (n) => (n === 1 || n === 2 ? 1 : 0) },
          xg: { tex: 'x/(1-x)', f: (n) => (n >= 1 ? 1 : 0) }, x2: { tex: 'x^2', f: (n) => (n === 2 ? 1 : 0) },
        };
        const aSel = v.select('$A(x)$', Object.keys(PA).map((k) => ({ value: k, label: `$${PA[k].tex}$` })), 'geo');
        const bSel = v.select('$B(x)$', Object.keys(PB).map((k) => ({ value: k, label: `$${PB[k].tex}$` })), 'x');
        const op = v.select('operation', [{ value: 'mul', label: '$A\\cdot B$' }, { value: 'inv', label: '$1/A$' }, { value: 'comp', label: '$A(B(x))$' }], 'mul');
        const nS = v.slider('truncation order $N$', 4, 12, 8, { int: true });
        const iS = v.slider('coefficient index $n$', 0, 11, 3, { int: true });
        const SA = v.stage({ x: [-0.6, 12.6], y: [-1, 1], axes: 'box', gutter: true, height: 230, xlabel: '$n$', title: '$A$: coefficients', minWidth: 200 });
        const SB = v.stage({ x: [-0.6, 12.6], y: [-1, 1], axes: 'box', gutter: true, height: 230, xlabel: '$n$', title: '$B$: coefficients', minWidth: 200 });
        const SR = v.stage({ x: [-0.6, 12.6], y: [-1, 1], axes: 'box', gutter: true, height: 230, xlabel: '$n$', title: 'result: coefficients', minWidth: 200 });
        const arr = (p, L) => Array.from({ length: L }, (_, n) => p(n));
        const run = (L) => {
          const a = arr(PA[aSel.value].f, L), b = arr(PB[bSel.value].f, L);
          const r = op.value === 'mul' ? sMul(a, b, L) : op.value === 'inv' ? sInv(a, L) : sCompose(a, b, L);
          return { a, b, r };
        };
        let info = {};
        v.render(() => {
          const N = nS.value; iS.set(Math.min(iS.value, N - 1)); const n = iS.value, o = op.value;
          const { a, b, r } = run(N), big = run(N + 8).r;
          const dev = Math.max(...range(N).map((i) => Math.abs(big[i] - r[i])));
          // which inputs does coefficient n use?
          const usesA = (i) => i <= n && (o !== 'comp' || true);
          const usesB = (i) => o === 'mul' ? i <= n : o === 'comp' ? i >= 1 && i <= n : false;
          const bar = (S, vals, use, hi) => {
            const m = Math.max(1, ...vals.map(Math.abs)) * 1.15;
            S.setView([-0.6, N - 0.4], [vals.some((x) => x < 0) ? -m : -0.05 * m, m]); S.setTicks(range(N), null);
            S.bars(vals, { x0: 0, color: (val, i) => (i === hi ? 'green' : use(i) ? 'gold' : 'accent') });
          };
          bar(SA, a, usesA, -1);
          bar(SB, b, (i) => usesB(i), -1);
          SB.el.style.opacity = o === 'inv' ? 0.35 : 1;
          bar(SR, r, () => false, n);
          info = { N, n, a, b, r, dev, o };
        });
        v.legend([['gold', 'inputs used by coefficient $n$', { dot: true }], ['green', 'coefficient $n$ of the result', { dot: true }]]);
        v.readout(() => {
          const { n, a, b, r, dev, o, N } = info;
          const opTex = o === 'mul' ? 'AB' : o === 'inv' ? '1/A' : 'A(B(x))';
          const lines = [String.raw`$${opTex}=${serTex(r)}$`];
          lines.push(o === 'mul' ? String.raw`$[x^{${n}}]AB=\sum_{k=0}^{${n}}a_kb_{${n}-k}=${numStr(r[n])}$ uses $a_0..a_{${n}}$ and $b_0..b_{${n}}$ only`
            : o === 'inv' ? String.raw`$[x^{${n}}](1/A)=${numStr(r[n])}$ is determined by $a_0,\dots,a_{${n}}$ (and $a_0=${numStr(a[0])}\ne0$)`
              : String.raw`$[x^{${n}}]A(B)=${numStr(r[n])}$ uses $a_0..a_{${n}}$ and $b_1..b_{${n}}$ ($b_0=0$, so $B^k$ starts at $x^k$)`);
          lines.push(`Order $N=${N}$ versus $N+8$: largest difference in the first ${N} coefficients $=${dev < 1e-12 ? '0' : v.sci(dev, 2)}$ ${dev < 1e-12 ? '✓ truncation never changes earlier coefficients' : '✗'}`);
          return lines.join('\n');
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'Solving recurrences with generating functions',
      statement: String.raw`Let $a_n=c_1a_{n-1}+c_2a_{n-2}$ for $n\ge2$ with given $a_0,a_1$ (the method works for any order). Multiply by $x^n$ and sum over $n\ge2$ to get the **rational** generating function
$$A(x)=\sum_{n\ge0}a_nx^n=\frac{a_0+(a_1-c_1a_0)x}{1-c_1x-c_2x^2}.$$
Factor the denominator as $(1-r_1x)(1-r_2x)$ ($r_i$ the roots of $r^2=c_1r+c_2$), split into partial fractions and expand each $\frac1{1-rx}=\sum r^nx^n$: for $r_1\ne r_2$, $a_n=\alpha r_1^n+\beta r_2^n$; for a double root $a_n=(\alpha+\beta n)r^n$.`,
      idea: String.raw`The recurrence says that $A(x)(1-c_1x-c_2x^2)$ is a polynomial: all terms of degree $\ge2$ cancel. Hence $A$ is a quotient of polynomials, and partial fractions (4.1's ring of series makes dividing by $1-rx$ legitimate, since its constant term is $1$) express it as a sum of geometric series $\sum r^nx^n$, whose coefficients are explicit. Complex roots give damped or growing oscillations $\rho^n\cos(n\theta+\varphi)$ — the same formula in real form.`,
      caption: String.raw`Choose the recurrence and initial values. Dots: the sequence from the recurrence; hollow rings: the closed form from the partial fractions; the readout also compares both with the coefficients of $P(x)/Q(x)$ computed by series division. The right panel shows the roots $r_i$ — inside the unit circle the terms decay, outside they grow; complex roots (discriminant $<0$) give oscillation. Vertical scale: signed $\log_{10}(1+|a_n|)$.`,
      deps: ['comb-4.1'],
      refs: ['Aigner ch. 3'],
      tags: ['generating functions', 'recurrences'],
      viz(v) {
        const c1S = v.slider('$c_1$', -3, 3, 1, { int: true }), c2S = v.slider('$c_2$', -3, 3, 1, { int: true });
        const a0S = v.slider('$a_0$', -3, 3, 0, { int: true }), a1S = v.slider('$a_1$', -3, 3, 1, { int: true });
        const S1 = v.stage({ x: [-0.6, 14.6], y: [-1, 1], axes: 'box', gutter: true, height: 320, weight: 1.6, xlabel: '$n$', ylabel: 'signed log$_{10}(1+|a_n|)$', title: '$a_n$: recurrence (dots) and closed form (rings)' });
        const S2 = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: true, height: 320, weight: 1, title: 'roots $r_i$ of $r^2=c_1r+c_2$' });
        const slog = (a) => Math.sign(a) * Math.log10(1 + Math.abs(a));
        let info = {};
        v.render(() => {
          const c1 = c1S.value, c2 = c2S.value, a0 = a0S.value, a1 = a1S.value, N = 15;
          const rec = [a0, a1]; for (let n = 2; n < N; n++) rec.push(c1 * rec[n - 1] + c2 * rec[n - 2]);
          const gf = ratCoeffs([a0, a1 - c1 * a0], [1, -c1, -c2], N);
          const d = c1 * c1 + 4 * c2; let closed, form, roots;
          if (d > 1e-9) {
            const s = Math.sqrt(d), r1 = (c1 + s) / 2, r2 = (c1 - s) / 2, A = (a1 - r2 * a0) / (r1 - r2), B = (a0 * r1 - a1) / (r1 - r2);
            closed = (n) => A * r1 ** n + B * r2 ** n; roots = [[r1, 0], [r2, 0]];
            form = String.raw`a_n=${numStr(A)}\cdot(${numStr(r1)})^n ${sgnStr(B)} ${numStr(Math.abs(B))}\cdot(${numStr(r2)})^n`;
          } else if (d > -1e-9) {
            const r = c1 / 2; roots = [[r, 0], [r, 0]];
            closed = Math.abs(r) < 1e-12 ? (n) => (n === 0 ? a0 : n === 1 ? a1 : 0) : (n) => (a0 + n * (a1 / r - a0)) * r ** n;
            form = Math.abs(r) < 1e-12 ? String.raw`a_n=0\ (n\ge2)` : String.raw`a_n=(${numStr(a0)}${sgnStr(a1 / r - a0)}${numStr(Math.abs(a1 / r - a0))}\,n)(${numStr(r)})^n`;
          } else {
            const rho = Math.sqrt(-c2), th = Math.atan2(Math.sqrt(-d) / 2, c1 / 2), K = (a1 / rho - a0 * Math.cos(th)) / Math.sin(th);
            closed = (n) => rho ** n * (a0 * Math.cos(n * th) + K * Math.sin(n * th)); roots = [[c1 / 2, Math.sqrt(-d) / 2], [c1 / 2, -Math.sqrt(-d) / 2]];
            form = String.raw`a_n=\rho^n(${numStr(a0)}\cos n\theta ${sgnStr(K)} ${numStr(Math.abs(K))}\sin n\theta),\ \rho=${numStr(rho)},\ \theta=${numStr(th * 180 / Math.PI)}^\circ`;
          }
          const cl = range(N).map(closed);
          const err = Math.max(...range(N).map((n) => Math.abs(cl[n] - rec[n]) / Math.max(1, Math.abs(rec[n]))));
          const errG = Math.max(...range(N).map((n) => Math.abs(gf[n] - rec[n])));
          const ys = rec.map(slog), m = Math.max(0.5, ...ys.map(Math.abs)) * 1.15;
          S1.setView([-0.6, N - 0.4], [Math.min(-0.2, Math.min(...ys) * 1.15), m]); S1.setTicks(range(N), null);
          S1.hline(0, { color: 'faint' });
          S1.path(ys.map((y, n) => [n, y]), { color: 'accent', width: 1.3, alpha: 0.5 });
          rec.forEach((a, n) => S1.dot(n, slog(a), { r: 4.5, color: 'accent' }));
          cl.forEach((a, n) => S1.dot(n, slog(a), { r: 8, hollow: true, color: 'green' }));
          S2.circle(0, 0, 1, { color: 'faint', width: 1.5, dash: true });
          roots.forEach(([x, y], i) => S2.dot(x, y, { r: 6, color: 'orange', label: `$r_${i + 1}$`, labelPos: i ? 'nw' : 'ne', tex: true }));
          S2.corner(d > 1e-9 ? 'real, distinct' : d > -1e-9 ? 'double root' : 'complex pair', 'tl', { plate: true });
          info = { c1, c2, a0, a1, rec, form, err, errG, d };
        });
        v.legend([['accent', 'recurrence', { dot: true }], ['green', 'closed form', { dot: true }], ['orange', 'roots', { dot: true }]]);
        v.readout(() => {
          const { c1, c2, a0, a1, rec, form, err, errG, d } = info;
          const den = `1${c1 ? ` ${sgnStr(-c1)} ${Math.abs(c1) === 1 ? '' : Math.abs(c1)}x` : ''}${c2 ? ` ${sgnStr(-c2)} ${Math.abs(c2) === 1 ? '' : Math.abs(c2)}x^2` : ''}`;
          const num = serTex([a0, a1 - c1 * a0], 3).replace('+\\cdots', '');
          return String.raw`$a_n=${c1}a_{n-1}${c2 < 0 ? '' : '+'}${c2}a_{n-2}$, $a_0=${a0}$, $a_1=${a1}$ gives $A(x)=\dfrac{${num}}{${den}}$ and $${form}$` + '\n' +
            String.raw`Terms: $${rec.slice(0, 9).map((x) => numStr(x)).join(', ')},\dots$. Closed form vs recurrence: largest relative gap $${err < 1e-9 ? '<10^{-9}' : v.sci(err, 2)}$ ${err < 1e-9 ? '✓' : '✗'}; series division of $P/Q$ vs recurrence: largest gap $${errG < 1e-9 ? '0' : v.sci(errG, 2)}$ ${errG < 1e-9 ? '✓' : '✗'}. Discriminant $c_1^2+4c_2=${d}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Fibonacci numbers and Binet’s formula',
      credit: 'Binet, 1843 (the closed form was known earlier, to de Moivre and D. Bernoulli)',
      verify: true,
      statement: String.raw`Let $F_0=0$, $F_1=1$, $F_{n}=F_{n-1}+F_{n-2}$. Then $\sum_{n\ge0}F_nx^n=\dfrac{x}{1-x-x^2}$ and
$$F_n=\frac{\varphi^n-\psi^n}{\sqrt5},\qquad \varphi=\frac{1+\sqrt5}{2},\ \ \psi=\frac{1-\sqrt5}{2}=-\frac1\varphi .$$
Consequently $F_n$ is the integer nearest to $\varphi^n/\sqrt5$, and $F_{n+1}/F_n\to\varphi$. Combinatorially, $F_{n+1}$ is the number of tilings of a $1\times n$ strip by squares ($1\times1$) and dominoes ($1\times2$).`,
      idea: String.raw`Tilings: look at the last tile — a square leaves a tiling of length $n-1$, a domino one of length $n-2$ — so $t_n=t_{n-1}+t_{n-2}$ with $t_0=1$, $t_1=1$; hence $t_n=F_{n+1}$. Generating function: summing the recurrence gives $F(x)=x/(1-x-x^2)$ (4.2). The roots of $r^2=r+1$ are $\varphi,\psi$, and partial fractions give $F_n=(\varphi^n-\psi^n)/\sqrt5$. Because $|\psi|<1$, the second term is below $\tfrac12$ in absolute value, which gives the rounding statement.`,
      caption: String.raw`Slide $n$ to see **every** tiling of the $1\times n$ strip (blue = square, orange = domino); the tilings ending in a domino number $F_{n-1}$ and those ending in a square $F_n$ — the recurrence. Right: the ratios $F_{n+1}/F_n$ zigzag around $\varphi$ with error $\approx\psi^n$-sized, the content of Binet's formula.`,
      deps: ['comb-4.2'],
      refs: ['Aigner ch. 3'],
      tags: ['Fibonacci', 'generating functions'],
      viz(v) {
        const nS = v.slider('strip length $n$', 1, 9, 6, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 360, weight: 1.5, title: 'all tilings by squares and dominoes' });
        const B = v.stage({ x: [0, 21], y: [0.9, 2.1], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: '$n$', ylabel: '$F_{n+1}/F_n$', title: 'ratios of consecutive terms' });
        const til = (n) => (n === 0 ? [[]] : [...til(n - 1).map((t) => [...t, 1]), ...(n >= 2 ? til(n - 2).map((t) => [...t, 2]) : [])]);
        const F = fibBig(40).map(Number);
        let info = {};
        v.render(() => {
          const n = nS.value, T = til(n), cnt = T.length, wI = n + 1, hI = 1.7;
          const cols = Math.max(1, Math.round(Math.sqrt(1.7 * cnt * wI * hI) / wI)), rows = Math.ceil(cnt / cols);
          A.setView([-0.3, cols * wI - 0.6], [-0.2, rows * hI]);
          T.forEach((t, i) => {
            const ox = (i % cols) * wI, oy = (rows - 1 - Math.floor(i / cols)) * hI; let x = ox;
            for (const len of t) { A.rect(x + 0.04, oy + 0.04, x + len - 0.04, oy + 0.96, { fill: len === 1 ? 'blue' : 'orange', fillAlpha: 0.75, color: len === 1 ? 'blue' : 'orange', width: 1 }); x += len; }
          });
          const lastDom = T.filter((t) => t[t.length - 1] === 2).length;
          B.hline(PHI, { color: 'green', dash: true, width: 2 });
          B.text('$\\varphi$', 20.8, PHI, { color: 'green', align: 'right', baseline: 'bottom', size: 13 });
          const pts = range(20).map((k) => [k + 1, F[k + 2] / F[k + 1]]);
          B.path(pts, { color: 'muted', width: 1.2, alpha: 0.6 });
          pts.forEach(([x, y]) => B.dot(x, y, { r: x === n ? 7 : 4, color: x === n ? 'gold' : 'accent' }));
          info = { n, cnt, lastDom, lastSq: cnt - lastDom };
        });
        v.legend([['blue', 'square', { dot: true }], ['orange', 'domino', { dot: true }], ['green', '$\\varphi$', { dash: true }]]);
        v.readout(() => {
          const { n, cnt, lastDom, lastSq } = info; const f = F[n + 1], bin = (PHI ** (n + 1) - (-1 / PHI) ** (n + 1)) / Math.sqrt(5), near = PHI ** (n + 1) / Math.sqrt(5);
          return String.raw`$n=${n}$: **${cnt}** tilings listed $=F_{${n + 1}}=${f}$ ${cnt === f ? '✓' : '✗'}; ending in a domino: ${lastDom} $=F_{${n - 1}}=${F[n - 1]}$, in a square: ${lastSq} $=F_{${n}}=${F[n]}$.` + '\n' +
            String.raw`Binet: $(\varphi^{${n + 1}}-\psi^{${n + 1}})/\sqrt5=${bin.toFixed(6)}$; rounding $\varphi^{${n + 1}}/\sqrt5=${near.toFixed(4)}$ gives $${Math.round(near)}$ ${Math.round(near) === f ? '✓' : '✗'}. Ratio $F_{${n + 1}}/F_{${n}}=${(F[n + 1] / F[n]).toFixed(5)}$ vs $\varphi=${PHI.toFixed(5)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Rational generating functions and linear recurrences',
      statement: String.raw`For a sequence $(a_n)$ of complex numbers and $d\ge1$ the following are equivalent:
(a) $\sum a_nx^n=P(x)/Q(x)$ with polynomials $P,Q$, $Q(0)=1$, $\deg Q\le d$, $\deg P<\deg Q$ (or any $P$ if one allows finitely many exceptional initial terms);
(b) $a_n$ satisfies a linear recurrence with constant coefficients of order $\le d$: $a_n+q_1a_{n-1}+\cdots+q_da_{n-d}=0$ for $n$ large;
(c) $a_n=\sum_i p_i(n)\gamma_i^n$ with polynomials $p_i$, where $Q(x)=\prod_i(1-\gamma_ix)^{m_i}$ and $\deg p_i<m_i$.
In particular the growth of $a_n$ is governed by the pole of $P/Q$ nearest to $0$: $|a_n|^{1/n}\to1/\rho$, where $\rho=\min|{\rm pole}|$ (if that pole contributes).`,
      idea: String.raw`(b)⇔(a): multiplying $\sum a_nx^n$ by $Q(x)=1+q_1x+\cdots$ produces a series whose coefficients are exactly the left sides of the recurrence, so they vanish beyond a point iff the product is a polynomial $P$. (a)⇒(c): partial fractions, and $\frac{1}{(1-\gamma x)^m}=\sum_n\binom{n+m-1}{m-1}\gamma^nx^n$ is a polynomial of degree $m-1$ in $n$ times $\gamma^n$. Since $|\gamma_i|=1/|{\rm pole}_i|$, the pole nearest to $0$ gives the largest exponential.`,
      caption: String.raw`The generating function is $1/\big((1-x/p)(1-x/\bar p)(1-x/q)\big)$. Drag the complex pole $p$ (its conjugate $\bar p$ is mirrored) and the real pole $q$ in the plane. Right: the coefficients $a_n$ rescaled by $\rho^n$, $\rho$ the radius of the green disc. When the nearest pole is a complex pair the rescaled sequence oscillates with frequency $\arg p$; when it is real, it settles to a constant. Poles are kept at modulus $\ge0.35$.`,
      deps: ['comb-4.2'],
      refs: ['Stanley EC1 §4.1'],
      tags: ['generating functions', 'poles'],
      viz(v) {
        const A = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: true, height: 340, weight: 1, title: 'poles of the generating function (the $x$-plane)' });
        const B = v.stage({ x: [-1, 42], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1.4, xlabel: '$n$', ylabel: '$\\rho^{\\,n}a_n$', title: 'coefficients rescaled by $\\rho^n$' });
        const clampMod = (x, y, lo, hi) => { const r = Math.hypot(x, y); if (r < 1e-9) return [lo, 0]; const s = Math.min(hi, Math.max(lo, r)) / r; return [x * s, y * s]; };
        const hp = A.handle(0.6, 0.7, { color: 'accent', label: 'p', r: 8, constrain: (x, y) => { const [a, b] = clampMod(x, Math.max(0.08, y), 0.35, 2.1); return [a, Math.max(0.05, b)]; } });
        const hq = A.handle(-1.1, 0, { color: 'orange', label: 'q', r: 8, constrain: (x) => [Math.abs(x) < 0.35 ? (x < 0 ? -0.35 : 0.35) : Math.max(-2.1, Math.min(2.1, x)), 0] });
        let info = {};
        v.render(() => {
          const px = hp.x, py = hp.y, q = hq.x, mod2 = px * px + py * py;
          const s = 2 * px / mod2, t = 1 / mod2;
          const Q = [1, -s - 1 / q, t + s / q, -t / q], N = 40;
          const a = ratCoeffs([1], Q, N), rho = Math.min(Math.sqrt(mod2), Math.abs(q));
          const b = a.map((x, n) => x * rho ** n);
          const m = Math.max(1e-9, ...b.map(Math.abs)) * 1.15;
          B.setView([-1, N], [-m, m]);
          B.hline(0, { color: 'faint' }); B.path(b.map((y, n) => [n, y]), { color: 'muted', width: 1, alpha: 0.5 });
          b.forEach((y, n) => B.dot(n, y, { r: 3.5, color: 'accent' }));
          A.circle(0, 0, rho, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 2 });
          A.dot(px, -py, { r: 6, color: 'red', label: '$\\bar p$', tex: true, labelPos: 'se' });
          A.text('$\\rho$', rho * 0.72, rho * 0.72 * 0, { color: 'green', size: 13, dy: -10 });
          const dom = Math.sqrt(mod2) < Math.abs(q) - 1e-9 ? 'complex pair' : Math.abs(q) < Math.sqrt(mod2) - 1e-9 ? 'real pole $q$' : 'tie';
          const nn = N - 1;
          info = { Q, a, rho, dom, root: Math.abs(a[nn]) ** (1 / nn), ang: Math.atan2(py, px) * 180 / Math.PI };
        });
        v.legend([['accent', '$p$', { dot: true }], ['orange', '$q$', { dot: true }], ['red', '$\\bar p$', { dot: true }], ['green', 'disc of radius $\\rho$', { area: true }]]);
        v.readout(() => {
          const { Q, a, rho, dom, root, ang } = info;
          return String.raw`$Q(x)=1${Q.slice(1).map((c, i) => `${sgnStr(c)}${numStr(Math.abs(c))}x^{${i + 1}}`).join('')}$, so $a_n=${numStr(-Q[1])}a_{n-1}${sgnStr(-Q[2])}${numStr(Math.abs(Q[2]))}a_{n-2}${sgnStr(-Q[3])}${numStr(Math.abs(Q[3]))}a_{n-3}$.` + '\n' +
            String.raw`Nearest pole: ${dom}, $\rho=${rho.toFixed(3)}$, so $1/\rho=${(1 / rho).toFixed(3)}$; measured $|a_{39}|^{1/39}=${root.toFixed(3)}$ (→ $1/\rho$ slowly, since $a_n\approx C\rho^{-n}$ has a constant factor). $a_{0..5}=${a.slice(0, 6).map((x) => numStr(x)).join(', ')}$. $\arg p=${ang.toFixed(0)}^\circ$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Making change: the denumerant is a quasipolynomial',
      statement: String.raw`Let $a_1,\dots,a_k$ be positive integers and $p(n)$ the number of ways to write $n=\sum c_ia_i$ with integers $c_i\ge0$ (the **denumerant**). Then $\sum_n p(n)x^n=\prod_{i}(1-x^{a_i})^{-1}$, and there is $L$ (one can take $L=\operatorname{lcm}(a_i)$) and polynomials $f_0,\dots,f_{L-1}$ of degree $\le k-1$ such that
$$p(n)=f_{\,n \bmod L}(n)\qquad\text{for all }n\ge0 .$$
If $\gcd(a_i)=1$ the leading term is the same for all classes: $p(n)\sim \dfrac{n^{k-1}}{(k-1)!\,a_1\cdots a_k}$.`,
      idea: String.raw`The generating function is a proper rational function whose poles are roots of unity ($x^{a_i}=1$) of multiplicity at most $k$ (4.4). By part (c) of 4.4 each pole $\zeta$ contributes $\zeta^{-n}\cdot$(polynomial of degree $<$ its multiplicity). All these $\zeta^{-n}$ are periodic in $n$ with period dividing $L$, which gives a polynomial in $n$ on each residue class mod $L$. Only $x=1$ has multiplicity $k$, which gives the leading term.`,
      caption: String.raw`Pick a coin set. Left: $p(n)$ for $n\le300$, coloured by residue class modulo the **period** $m$ (slider); with the toggle on, the polynomial fitted to the chosen (gold) class is subtracted, so that class sits on $0$ and the other residue classes fan out around it. Right: the class $n\equiv r \pmod m$ plotted against its index, with the polynomial of degree $k-1$ through the first $k$ of its points. When $m$ is a multiple of $\operatorname{lcm}(a_i)$ (the default) every later point lands exactly on the curve; for other periods the classes are *not* polynomial and the points drift off.`,
      scope: String.raw`Quasi-polynomial for all $n\ge0$ (the fraction is proper). The period $L=\operatorname{lcm}(a_i)$ works; the minimal period can be smaller.`,
      deps: ['comb-4.4'],
      refs: ['Stanley EC1 §4.4'],
      tags: ['partitions', 'quasipolynomials'],
      viz(v) {
        const SETS = { '1,2': [1, 2], '2,3': [2, 3], '1,2,5': [1, 2, 5], '3,4,5': [3, 4, 5], '1,5,10,25': [1, 5, 10, 25] };
        const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcmA = (a) => a.reduce((l, x) => (l * x) / gcd(l, x), 1);
        const NMAX = 300, cache = {};
        const den = (key) => cache[key] || (cache[key] = (() => { const p = Array(NMAX + 1).fill(0); p[0] = 1; for (const c of SETS[key]) for (let n = c; n <= NMAX; n++) p[n] += p[n - c]; return p; })());
        const setSel = v.select('coin values', Object.keys(SETS).map((k) => ({ value: k, label: `$\\{${k}\\}$` })), '1,2,5', { onChange: () => { mS.set(Math.min(60, lcmA(SETS[setSel.value]))); rS.set(0); } });
        const mS = v.slider('period $m$', 1, 60, 10, { int: true });
        const rS = v.slider('residue $r$', 0, 59, 0, { int: true });
        const dT = v.toggle('subtract the polynomial of the chosen class', true);
        const A = v.stage({ x: [-5, NMAX + 5], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.35, xlabel: '$n$', ylabel: '$p(n)$', title: 'ways to make $n$, coloured by $n \\bmod m$' });
        const B = v.stage({ x: [-0.5, 5], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'index $j$ in the class $n=r+jm$', ylabel: '$p(r+jm)$', title: 'one residue class vs the degree $k-1$ polynomial' });
        let info = {};
        v.render(() => {
          const coins = SETS[setSel.value], k = coins.length, p = den(setSel.value), m = mS.value, L = lcmA(coins);
          const r = Math.min(rS.value, m - 1); rS.set(r);
          const pts = []; for (let n = r; n <= NMAX; n += m) pts.push([(n - r) / m, p[n]]);
          const xs = pts.slice(0, k).map((q) => q[0]), ys = pts.slice(0, k).map((q) => q[1]);
          const poly = (x) => { let s = 0; for (let i = 0; i < k; i++) { let t = ys[i]; for (let j = 0; j < k; j++) if (j !== i) t *= (x - xs[j]) / (xs[i] - xs[j]); s += t; } return s; };
          const dev = Math.max(...pts.map(([j, y]) => Math.abs(poly(j) - y)));
          const yv = (n) => (dT.value ? p[n] - poly((n - r) / m) : p[n]);
          const vals = range(NMAX + 1).map(yv), lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo) * 0.08 || 1;
          A.setView([-5, NMAX + 5], [dT.value ? lo - pad : 0, hi + pad]); A.setLabels(undefined, dT.value ? '$p(n)-f_r(n)$' : '$p(n)$');
          if (dT.value) A.hline(0, { color: 'faint' });
          for (let n = 0; n <= NMAX; n++) A.dot(n, vals[n], { r: n % m === r ? 3.8 : 2.4, color: n % m === r ? 'gold' : CAT[(n % m) % CAT.length], alpha: n % m === r ? 1 : 0.8 });
          const J = pts.length - 1, ymax = Math.max(...pts.map((q) => q[1]), 1) * 1.1;
          B.setView([-0.5, J + 0.5], [0, ymax]);
          B.fn(poly, { domain: [0, J], color: 'orange', width: 2 });
          pts.forEach(([j, y], i) => B.dot(j, y, { r: i < k ? 7 : 4.5, color: Math.abs(poly(j) - y) < 1e-6 ? (i < k ? 'gold' : 'green') : 'red', hollow: false }));
          info = { coins, k, L, m, r, dev, ok: m % L === 0, nPts: pts.length, ratio: p[NMAX] / (NMAX ** (k - 1) / (fact(k - 1) * coins.reduce((a, b) => a * b, 1))) };
        });
        v.legend([['gold', 'fitting points', { dot: true }], ['green', 'on the polynomial', { dot: true }], ['red', 'off the polynomial', { dot: true }], ['orange', 'degree $k-1$ polynomial', {}]]);
        v.readout(() => {
          const { coins, k, L, m, r, dev, ok, nPts, ratio } = info;
          return String.raw`Coins $\{${coins.join(',')}\}$: $k=${k}$, $\operatorname{lcm}=${L}$. Class $n\equiv${r}\pmod{${m}}$ has ${nPts} points; the polynomial through the first $${k}$ misses the others by at most $${dev < 1e-6 ? '0' : numStr(dev)}$ ${dev < 1e-6 ? '**— a polynomial class ✓**' : '**— not a polynomial class**'}${ok ? ' (period is a multiple of the lcm, as the theorem requires)' : m % L ? ` ($m$ is not a multiple of ${L}: the theorem does not apply)` : ''}.` + '\n' +
            String.raw`Leading term: $p(300)\big/\big[n^{${k - 1}}/((${k - 1})!\prod a_i)\big]=${ratio.toFixed(3)}$ (→ 1).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Method',
      name: 'Transfer-matrix method',
      statement: String.raw`Let a finite automaton have states $1..m$, a start state $s$, and an $m\times m$ matrix $T$ with $T_{ij}$ = the number of letters leading from state $i$ to $j$; all states are accepting. Then the number of accepted words of length $n$ is
$$a_n=e_s^{\!\top}\,T^{\,n}\,\mathbf 1,\qquad \sum_{n\ge0}a_nx^n=e_s^{\!\top}(I-xT)^{-1}\mathbf 1=\frac{N(x)}{\det(I-xT)},$$
a rational function whose denominator has degree $\le m$ (Cramer's rule: $N$ is a polynomial of degree $<m$). So $(a_n)$ satisfies a linear recurrence of order $\le m$, with characteristic polynomial that of $T$.`,
      idea: String.raw`The $(i,j)$ entry of $T^n$ counts walks of length $n$ from $i$ to $j$ (expand the matrix product: one factor of $T$ per step), so $e_s^{\top}T^n\mathbf 1$ counts all walks from $s$, i.e. all allowed words. Summing the matrix geometric series $\sum x^nT^n=(I-xT)^{-1}$ is legitimate in the ring of formal series (4.1), and the inverse matrix is the adjugate divided by $\det(I-xT)$. By Cayley–Hamilton $T$ satisfies its characteristic polynomial, which is the recurrence.`,
      caption: String.raw`Choose a forbidden pattern; the automaton remembers just enough of the last letters. Slide the length $n$ and the index $k$: the $k$-th accepted word is spelled out and its path through the automaton is lit (gold). Right: $a_n$ from the matrix power (bars) versus a brute-force filter of all $2^n$ binary words (rings), and the rational generating function $N/D$ computed from $T$.`,
      deps: ['comb-4.4'],
      refs: ['Stanley EC1 §4.7'],
      tags: ['transfer matrix', 'automata'],
      viz(v) {
        const AUT = {
          no11: { name: 'no 11', n: 2, pos: [[2.2, 2], [7.8, 2]], lab: ['last 0', 'last 1'], E: [[0, 0, '0', 0], [0, 1, '1', -0.8], [1, 0, '0', -0.8]], bad: (w) => !w.includes('11') },
          no111: { name: 'no 111', n: 3, pos: [[1.8, 2], [5, 2], [8.2, 2]], lab: ['0 ones', '1 one', '2 ones'], E: [[0, 0, '0', 0], [0, 1, '1', 0], [1, 2, '1', 0], [1, 0, '0', -1.3], [2, 0, '0', -1.9]], bad: (w) => !w.includes('111') },
          no101: { name: 'no 101', n: 3, pos: [[1.8, 0.9], [5, 3.2], [8.2, 0.9]], lab: ['ε / 0', '1', '10'], E: [[0, 0, '0', 0], [0, 1, '1', 0], [1, 1, '1', 0], [1, 2, '0', 0], [2, 0, '0', 0]], bad: (w) => !w.includes('101') },
        };
        const sel = v.select('forbidden factor', Object.keys(AUT).map((k) => ({ value: k, label: AUT[k].name })), 'no11');
        const nS = v.slider('length $n$', 1, 12, 6, { int: true });
        const kS = v.slider('word index $k$', 1, 100, 1, { int: true });
        const A = v.stage({ x: [0, 10], y: [-0.5, 4.2], equal: true, axes: false, height: 300, weight: 1.2, title: 'the automaton (letters on the arrows)' });
        const B = v.stage({ x: [-0.6, 12.6], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'length $n$', ylabel: '$a_n$', title: 'words of length $n$ avoiding the factor' });
        const matOf = (a) => { const T = Array.from({ length: a.n }, () => Array(a.n).fill(0)); a.E.forEach(([f, t]) => { T[f][t]++; }); return T; };
        // det(xI - T) by Faddeev–LeVerrier -> ascending; denominator det(I - xT) is its reverse
        const charAsc = (T) => { const m = T.length; let M = T.map((r) => r.map(() => 0)), c = [1]; const I = T.map((_, i) => T.map((__, j) => (i === j ? 1 : 0))); let Mk = I; const co = [1];
          for (let k = 1; k <= m; k++) { const AM = T.map((r, i) => T[0].map((_, j) => r.reduce((s, _x, l) => s + T[i][l] * Mk[l][j], 0))); const ck = -AM.reduce((s, r, i) => s + r[i], 0) / k; co.push(ck); Mk = AM.map((r, i) => r.map((x, j) => x + (i === j ? ck : 0))); }
          return co; };
        const bezier = (p0, c, p1, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
        let info = {};
        v.render(() => {
          const au = AUT[sel.value], T = matOf(au), m = au.n, n = nS.value, R = 0.5;
          // counts a_n for n = 0..12
          let vec = Array(m).fill(0); vec[0] = 1; const cnt = [1];
          // a_n = e_0^T T^n 1 : propagate row vector
          for (let i = 1; i <= 12; i++) { const nx = Array(m).fill(0); for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) nx[b] += vec[a] * T[a][b]; vec = nx; cnt.push(vec.reduce((s, x) => s + x, 0)); }
          const words = (len) => { const out = []; const rec = (w, s) => { if (w.length === len) { out.push(w); return; } for (const e of au.E) if (e[0] === s) rec(w + e[2], e[1]); }; rec('', 0); return out.sort(); };
          const W = words(n); kS.set(Math.min(kS.value, W.length)); const kk = Math.min(kS.value, W.length), word = W[kk - 1];
          const brute = range(1 << n).map((x) => range(n).map((i) => (x >> (n - 1 - i)) & 1).join('')).filter(au.bad).length;
          // path states
          const used = new Set(); let s = 0; const stSeq = [0];
          for (const ch of word) { const ei = au.E.findIndex((e) => e[0] === s && e[2] === ch); used.add(ei); s = au.E[ei][1]; stSeq.push(s); }
          // draw automaton
          const Cn = [au.pos.reduce((a, p) => a + p[0], 0) / m, au.pos.reduce((a, p) => a + p[1], 0) / m];
          au.E.forEach(([f, t, l, bend], ei) => {
            const col = used.has(ei) ? 'gold' : 'muted', wd = used.has(ei) ? 3 : 1.6, p0 = au.pos[f], p1 = au.pos[t];
            if (f === t) {
              let dx = p0[0] - Cn[0], dy = p0[1] - Cn[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; if (m === 2) { dx = 0; dy = 1; }
              const cx = p0[0] + dx * (R + 0.42), cy = p0[1] + dy * (R + 0.42);
              A.curve((th) => [cx + 0.42 * Math.cos(th), cy + 0.42 * Math.sin(th)], 0, 2 * Math.PI, { n: 40, color: col, width: wd });
              { const a = Math.atan2(-dy, -dx) + 0.75, px = cx + 0.42 * Math.cos(a), py = cy + 0.42 * Math.sin(a); A.arrow(px + 0.1 * Math.sin(a), py - 0.1 * Math.cos(a), px, py, { color: col, width: wd, head: 9 }); }
              A.text(l, cx + dx * 0.78, cy + dy * 0.78, { size: 14, color: used.has(ei) ? 'ink' : 'muted', align: 'center', baseline: 'middle' });
              return;
            }
            const dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy), nx = -dy / d, ny = dx / d;
            const c = [(p0[0] + p1[0]) / 2 + nx * bend, (p0[1] + p1[1]) / 2 + ny * bend];
            let t0 = 0, t1 = 1;
            for (let t = 0; t <= 1; t += 0.01) { const q = bezier(p0, c, p1, t); if (Math.hypot(q[0] - p0[0], q[1] - p0[1]) < R + 0.04) t0 = t; if (Math.hypot(q[0] - p1[0], q[1] - p1[1]) > R + 0.1) t1 = t; }
            A.curve((t) => bezier(p0, c, p1, t0 + (t1 - t0) * t), 0, 1, { n: 30, color: col, width: wd });
            const e = bezier(p0, c, p1, t1 + 0.04), b0 = bezier(p0, c, p1, t1 - 0.02);
            A.arrow(b0[0], b0[1], e[0], e[1], { color: col, width: wd, head: 10 });
            const mid = bezier(p0, c, p1, 0.5); A.text(l, mid[0] + nx * 0.28 * Math.sign(bend || 1), mid[1] + ny * 0.28 * Math.sign(bend || 1), { size: 14, color: used.has(ei) ? 'ink' : 'muted', align: 'center', baseline: 'middle' });
          });
          au.pos.forEach(([x, y], i) => { A.circle(x, y, R, { fill: stSeq.includes(i) ? 'gold' : 'panel', fillAlpha: stSeq.includes(i) ? 0.35 : 1, color: i === 0 ? 'accent' : 'ink', width: i === 0 ? 3 : 1.6 }); A.text(String(i + 1), x, y, { size: 15, align: 'center', baseline: 'middle', color: 'ink' }); A.text(au.lab[i], x, y - R - 0.55 * (au.pos[i][1] > Cn[1] && m === 3 ? -1 : 1) * 0, { size: 11, color: 'muted', align: 'center', dy: 24 }); });
          A.corner(`word ${kk} of ${W.length}: ${word}`, 'tl', { plate: true });
          // right
          B.setView([-0.6, 12.6], [0, Math.max(...cnt) * 1.12]); B.setTicks(range(13), null);
          B.bars(cnt, { x0: 0, color: (val, i) => (i === n ? 'gold' : 'accent') });
          B.dots(range(13).map((i) => [i, range(1 << i).map((x) => range(i).map((j) => (x >> (i - 1 - j)) & 1).join('')).filter(au.bad).length]), { r: 7, hollow: true, color: 'green' });
          const D = charAsc(T), numFull = sMulTrunc(cnt, D, 13), num = numFull.slice(0, m);
          info = { au, T, n, cnt, count: W.length, brute, D, num, ok: cnt[n] === W.length && W.length === brute, numOk: numFull.slice(m).every((x) => x === 0) };
        });
        function sMulTrunc(a, b, N) { const r = Array(N).fill(0); for (let i = 0; i < N; i++) for (let j = 0; i + j < N; j++) r[i + j] += (a[i] || 0) * (b[j] || 0); return r; }
        v.legend([['accent', '$a_n=e^{\\top}T^n\\mathbf 1$', { dot: true }], ['green', 'brute force over $2^n$ words', { dot: true }], ['gold', 'selected length / word path', { dot: true }]]);
        v.readout(() => {
          const { au, T, n, cnt, count, brute, D, num, ok, numOk } = info;
          const poly = (c) => c.map((x, i) => (x ? `${i ? sgnStr(x) : x < 0 ? '−' : ''}${Math.abs(x) === 1 && i ? '' : Math.abs(x)}${i ? (i === 1 ? 'x' : `x^{${i}}`) : ''}` : '')).join('') || '0';
          return String.raw`$T=${'\\begin{pmatrix}' + T.map((r) => r.join('&')).join('\\\\') + '\\end{pmatrix}'}$, $\det(I-xT)=${poly(D)}$, numerator $N(x)=${poly(num)}$ (degree $<${au.n}$ ${numOk ? '✓ all higher coefficients of $N=D\\cdot\\sum a_nx^n$ vanish' : '✗'}), so $\sum a_nx^n=N/D$.` + '\n' +
            String.raw`Length $n=${n}$: matrix power $a_n=${cnt[n]}$; accepted words listed $=${count}$; brute-force filter of all $2^{${n}}$ words $=${brute}$ ${ok ? '✓' : '✗'}. First terms: $${cnt.slice(0, 10).join(', ')},\dots$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Domino tilings of strips by transfer matrices',
      statement: String.raw`Let $t_h(L)$ be the number of tilings of an $h\times L$ rectangle by $1\times2$ dominoes. Take as states the subsets $S\subseteq\{1..h\}$ of rows in which a horizontal domino protrudes across a vertical cut, and let $T_{S,S'}=1$ if the cells of one column not covered from the left (by $S$) and not protruding to the right (by $S'$) can be paired by vertical dominoes (and $S\cap S'=\emptyset$), else $0$. Then
$$t_h(L)=(T^{\,L})_{\emptyset,\emptyset}.$$
For $h=2$ this gives $t_2(L)=F_{L+1}$; for $h=3$, $t_3(L)=0$ for odd $L$ and $t_3(0),t_3(2),t_3(4),\dots=1,3,11,41,\dots$.`,
      idea: String.raw`Read a tiling column by column. What a column needs to know about the past is exactly which of its cells are already filled by horizontal dominoes coming from the left: the state $S$. Given $S$ and the choice $S'$ of cells that start horizontal dominoes to the right, the rest of the column is forced to be vertical dominoes (or the choice is impossible), so tilings are the same as walks $\emptyset=S_0\to S_1\to\dots\to S_L=\emptyset$ in the state graph. This is the transfer-matrix method (4.6) with $T$ a $0/1$ matrix, and the count is a matrix-power entry.`,
      caption: String.raw`Choose the height $h$ and length $L$, then step through the tilings with the index slider. The orange ticks on the vertical cuts show the **state** at each cut, which rows have a horizontal domino crossing it; this sequence of states is the walk counted by $T^L$. Right: the counts $(T^L)_{\emptyset\emptyset}$ (bars) against explicit enumeration of all tilings (rings). Note $h=3$: only even lengths are tileable.`,
      deps: ['comb-4.6'],
      refs: ['Stanley EC1 §4.7'],
      tags: ['tilings', 'transfer matrix'],
      viz(v) {
        const hS = v.select('height $h$', [2, 3, 4].map((h) => ({ value: h, label: String(h) })), 3);
        const LS = v.slider('length $L$', 1, 10, 4, { int: true });
        const kS = v.slider('tiling index', 1, 200, 1, { int: true });
        const A = v.stage({ x: [0, 4], y: [0, 3], equal: true, axes: false, height: 320, weight: 1.5, title: 'a tiling, with the transfer states on the cuts' });
        const B = v.stage({ x: [-0.6, 10.6], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'length $L$', ylabel: '$t_h(L)$', title: 'tilings of an $h\\times L$ board' });
        const trans = (h) => {
          const M = 1 << h, T = Array.from({ length: M }, () => Array(M).fill(0));
          for (let s = 0; s < M; s++) for (let t = 0; t < M; t++) {
            if (s & t) continue; const free = ((M - 1) & ~s) & ~t; let ok = true, run = 0;
            for (let r = 0; r <= h; r++) { if (r < h && (free >> r) & 1) run++; else { if (run % 2) ok = false; run = 0; } }
            T[s][t] = ok ? 1 : 0;
          }
          return T;
        };
        const enumT = (h, L, cap = 30000) => {
          const grid = Array.from({ length: L }, () => Array(h).fill(false)), cur = [], out = []; let count = 0;
          const rec = () => {
            let c = -1, r = -1;
            outer: for (let i = 0; i < L; i++) for (let j = 0; j < h; j++) if (!grid[i][j]) { c = i; r = j; break outer; }
            if (c < 0) { count++; if (out.length < cap) out.push(cur.map((d) => d.slice())); return; }
            grid[c][r] = true;
            if (c + 1 < L && !grid[c + 1][r]) { grid[c + 1][r] = true; cur.push([c, r, 1]); rec(); cur.pop(); grid[c + 1][r] = false; }
            if (r + 1 < h && !grid[c][r + 1]) { grid[c][r + 1] = true; cur.push([c, r, 0]); rec(); cur.pop(); grid[c][r + 1] = false; }
            grid[c][r] = false;
          };
          rec(); return { count, list: out };
        };
        const cache = new Map();
        const enumC = (h, L) => { const key = h + ':' + L; if (!cache.has(key)) cache.set(key, enumT(h, L)); return cache.get(key); };
        const matVec = (T, vec) => T[0].map((_, j) => vec.reduce((s, x, i) => s + x * T[i][j], 0));
        let info = {};
        v.render(() => {
          const h = +hS.value, L = LS.value, T = trans(h), E = enumC(h, L);
          kS.set(Math.min(kS.value, Math.max(1, E.list.length))); const k = Math.min(kS.value, Math.max(1, E.list.length));
          let vec = Array(1 << h).fill(0); vec[0] = 1; const cnt = [1];
          for (let i = 1; i <= 10; i++) { vec = matVec(T, vec); cnt.push(vec[0]); }
          const til = E.list[k - 1] || [];
          A.setView([-0.2, L + 0.2], [-0.2, h + 0.2]);
          A.rect(0, 0, L, h, { color: 'ink', width: 1.5 });
          til.forEach(([c, r, hor], i) => {
            const y = h - 1 - r; const x0 = c + 0.06, y0 = y + 0.06, x1 = hor ? c + 2 - 0.06 : c + 1 - 0.06, y1 = hor ? y + 1 - 0.06 : y - 1 + 1.94;
            A.rect(x0, hor ? y0 : y - 1 + 0.06, x1, hor ? y1 : y + 0.94, { fill: hor ? 'green' : 'blue', fillAlpha: 0.65, color: hor ? 'green' : 'blue', width: 1.3, radius: 5 });
          });
          // states on cuts
          const states = [];
          for (let c = 0; c <= L; c++) { let s = 0; til.forEach(([cc, r, hor]) => { if (hor && cc === c - 1) s |= 1 << r; }); states.push(s); if (c > 0 && c < L) for (let r = 0; r < h; r++) if ((s >> r) & 1) A.segment([c, h - 1 - r + 0.12], [c, h - 1 - r + 0.88], { color: 'orange', width: 4 });
          }
          B.setView([-0.6, 10.6], [0, Math.max(1, ...cnt) * 1.15]); B.setTicks(range(11), null);
          B.bars(cnt, { x0: 0, color: (val, i) => (i === L ? 'gold' : 'accent') });
          const enumCounts = range(11).map((l) => [l, enumT(h, l, 0).count]);
          B.dots(enumCounts, { r: 7, hollow: true, color: 'green' });
          A.corner(`tiling ${k} of ${E.count}`, 'tl', { plate: true });
          const nz = T.reduce((s, r) => s + r.reduce((a, b) => a + b, 0), 0);
          info = { h, L, T, cnt, E, nz, states, ok: cnt[L] === E.count };
        });
        v.legend([['blue', 'vertical domino', { dot: true }], ['green', 'horizontal domino', { dot: true }], ['orange', 'protruding rows = state', {}]]);
        v.readout(() => {
          const { h, L, T, cnt, E, nz, states, ok } = info;
          const Tt = h === 2 ? String.raw`$T=${'\\begin{pmatrix}' + T.map((r) => r.join('&')).join('\\\\') + '\\end{pmatrix}'}$ (states $\emptyset,\{1\},\{2\},\{1,2\}$ as bit patterns $00,01,10,11$). ` : String.raw`$T$ is a ${1 << h}$×${1 << h}$ matrix with ${nz} ones. `;
          return Tt + String.raw`Length $L=${L}$: $(T^{${L}})_{\emptyset\emptyset}=${cnt[L]}$; tilings enumerated: ${E.count} ${ok ? '✓' : '✗'}. State sequence on the cuts of this tiling: ${states.map((s) => (s ? s.toString(2).padStart(h, '0') : '∅')).join(' → ')}. Counts for $L=0..10$: ${cnt.join(', ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Exponential generating functions',
      statement: String.raw`The **ordinary** generating function of $(a_n)$ is $\sum a_nx^n$; its **exponential** generating function (EGF) is
$$\widehat A(x)=\sum_{n\ge0}a_n\frac{x^n}{n!}.$$
Both are formal series (4.1), and either can be recovered from the other by rescaling coefficients by $n!$, but they behave differently: for $a_n=n!$ the ordinary series has radius of convergence $0$ while the EGF is $1/(1-x)$; for $a_n=2^n$ the EGF is $e^{2x}$, entire, while the ordinary series $1/(1-2x)$ has radius $\tfrac12$. EGFs are the natural tool when $a_n$ counts structures on a **labelled** $n$-set.`,
      idea: String.raw`If $a_n$ counts structures built on the label set $[n]$, then re-labelling by any of the $n!$ permutations acts on them; the factor $1/n!$ in the EGF divides out this relabelling. The payoff (4.9) is that gluing structures on disjoint label sets multiplies EGFs exactly (binomial convolution), whereas ordinary series multiply with the convolution $\sum a_kb_{n-k}$ that fits *unlabelled* concatenation. Analytically, dividing by $n!$ typically turns a divergent series into a convergent one.`,
      caption: String.raw`Choose a sequence and an $x$. Left: the terms $|a_nx^n|$ (OGF, blue) and $|a_nx^n/n!|$ (EGF, orange) on a logarithmic scale. Right: the partial sums. Where the terms eventually fall the partial sums level off at the value (green line, closed form); where they grow, the series diverges. For $n!$ the ordinary terms *always* blow up; for $n^n$ the EGF has radius $1/e$.`,
      scope: String.raw`Closed forms: $\sum x^n=\frac1{1-x}$ ($n!$ EGF, $|x|<1$); $e^{2x}$ ($2^n$ EGF); $\frac1{1-T(x)}$ with $T=xe^{T}$ ($n^n$ EGF, $x<1/e$).`,
      deps: ['comb-4.1'],
      refs: ['Aigner ch. 2'],
      tags: ['generating functions', 'labelled structures'],
      viz(v) {
        const SEQ = {
          fact: { tex: 'n!', a: (n) => fact(n), rO: 0, rE: 1, closeE: (x) => 1 / (1 - x), closeO: null },
          pow: { tex: '2^n', a: (n) => 2 ** n, rO: 0.5, rE: Infinity, closeE: (x) => Math.exp(2 * x), closeO: (x) => 1 / (1 - 2 * x) },
          nn: { tex: 'n^n', a: (n) => (n === 0 ? 1 : n ** n), rO: 0, rE: 1 / Math.E, closeE: (x) => { let T = 0; for (let i = 0; i < 400; i++) T = x * Math.exp(T); return 1 / (1 - T); }, closeO: null },
        };
        const sel = v.select('sequence $a_n$', Object.keys(SEQ).map((k) => ({ value: k, label: `$${SEQ[k].tex}$` })), 'fact');
        const xS = v.slider('$x$', 0.05, 1.3, 0.4, { step: 0.01 });
        const A = v.stage({ x: [-1, 31], y: [1e-12, 1e12], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$n$', ylabel: 'term size', title: 'size of the $n$-th term' });
        const B = v.stage({ x: [-1, 31], y: [1e-3, 1e12], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'number of terms', ylabel: 'partial sum', title: 'partial sums' });
        let info = {};
        v.render(() => {
          const S = SEQ[sel.value], x = xS.value, N = 31;
          const to = range(N).map((n) => S.a(n) * x ** n), te = range(N).map((n) => (S.a(n) * x ** n) / fact(n));
          const cum = (t) => { let s = 0; return t.map((u) => (s += u)); };
          const po = cum(to), pe = cum(te);
          const dots = (st, ys, col) => { st.path(ys.map((y, n) => [n, Math.max(y, 1e-30)]), { color: col, width: 1.4, alpha: 0.6 }); ys.forEach((y, n) => st.dot(n, Math.max(y, 1e-30), { r: 3.5, color: col })); };
          dots(A, to, 'accent'); dots(A, te, 'orange'); dots(B, po, 'accent'); dots(B, pe, 'orange');
          A.hline(1, { color: 'faint' });
          const ce = x < S.rE ? S.closeE(x) : null, co = S.closeO && x < S.rO ? S.closeO(x) : null;
          if (ce) B.hline(ce, { color: 'green', dash: true, width: 2 });
          if (co && Math.abs(co - ce) > 1e-9) B.hline(co, { color: 'purple', dash: true, width: 2 });
          info = { S, x, ce, co, lastO: po[N - 1], lastE: pe[N - 1], tailO: to[N - 1], tailE: te[N - 1] };
        });
        v.legend([['accent', 'ordinary $\\sum a_nx^n$', { dot: true }], ['orange', 'exponential $\\sum a_nx^n/n!$', { dot: true }], ['green', 'EGF value', { dash: true }]]);
        v.readout(() => {
          const { S, x, ce, co, lastO, lastE, tailO, tailE } = info;
          const rad = (r) => (r === 0 ? '0' : r === Infinity ? '\\infty' : r.toFixed(3));
          return String.raw`$a_n=${S.tex}$: radius of convergence of the ordinary series $=${rad(S.rO)}$, of the exponential series $=${rad(S.rE)}$. At $x=${x.toFixed(2)}$:` + '\n' +
            String.raw`ordinary — last term $${v.sci(tailO, 2)}$, partial sum $${v.sci(lastO, 3)}$ ${x < S.rO ? '(converging' + (co ? `, limit $${co.toFixed(4)}$` : '') + ')' : '**(diverging)**'}; exponential — last term $${v.sci(tailE, 2)}$, partial sum $${lastE.toPrecision(6)}$ ${ce ? `(limit $${ce.toFixed(6)}$ ${Math.abs(lastE - ce) < 1e-4 * Math.max(1, ce) ? '✓' : '— still converging'})` : '**(diverging)**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Products of EGFs count labelled structures',
      statement: String.raw`Let $f(k)$ be the number of structures of type $\mathcal F$ on a $k$-element label set and $g(k)$ the number of type $\mathcal G$ (they depend only on the size). Let $h(n)$ be the number of ways to split $[n]$ into an ordered pair of disjoint sets $(S,S^c)$ and put an $\mathcal F$-structure on $S$ and a $\mathcal G$-structure on $S^c$. Then
$$h(n)=\sum_{k=0}^n\binom nk f(k)\,g(n-k),\qquad\text{i.e.}\qquad \widehat H(x)=\widehat F(x)\,\widehat G(x).$$`,
      idea: String.raw`There are $\binom nk$ choices for the $k$-element set $S$, then $f(k)$ and $g(n-k)$ independent choices of structures. And the Cauchy product of $\sum f(k)x^k/k!$ and $\sum g(j)x^j/j!$ has coefficient $\sum_k \frac{f(k)g(n-k)}{k!(n-k)!}=\frac1{n!}\sum_k\binom nk f(k)g(n-k)$. The binomial coefficient is precisely the number of ways to distribute labels, which is why the labelled world multiplies EGFs, not OGFs.`,
      caption: String.raw`Choose the types of structures and the number of labels $n$. Click labels to colour them red ($S$, structure $\mathcal F$) or blue ($S^c$, structure $\mathcal G$); the arcs show one random structure on each part (arrows = a linear order or a cycle, none for an unordered set; *Resample* draws another). Right: the bars $\binom nk f(k)g(n-k)$ for each size $k$ of the red part; the total is compared with $n!\,[x^n]\widehat F\widehat G$ computed by multiplying the series.`,
      deps: ['comb-4.8'],
      refs: ['Aigner ch. 3'],
      tags: ['labelled structures', 'generating functions'],
      viz(v) {
        const TY = { O: { nm: 'linear orders', f: (k) => fact(k) }, S: { nm: 'sets', f: () => 1 }, C: { nm: 'cycles', f: (k) => (k ? fact(k - 1) : 0) } };
        const PAIRS = { OO: ['O', 'O', (n) => fact(n + 1)], SS: ['S', 'S', (n) => 2 ** n], OS: ['O', 'S', null], CO: ['C', 'O', (n) => range(n).reduce((s, i) => s + fact(n) / (i + 1), 0)] };
        const pSel = v.select('types $(\\mathcal F,\\mathcal G)$', [{ value: 'OO', label: 'orders · orders' }, { value: 'SS', label: 'sets · sets' }, { value: 'OS', label: 'orders · sets' }, { value: 'CO', label: 'cycles · orders' }], 'OO');
        const nS = v.slider('labels $n$', 2, 9, 6, { int: true });
        let seed = 3, mask = 0b000111;
        v.button('Resample', () => { seed++; });
        v.button('Clear', () => { mask = 0; });
        const A = v.stage({ x: [0, 10], y: [-3, 3], axes: false, height: 300, weight: 1.5, title: 'click labels: red = $S$ (type $\\mathcal F$), blue = $S^c$ (type $\\mathcal G$)' });
        const B = v.stage({ x: [-0.6, 9.6], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: '$k=|S|$', ylabel: '$\\binom nk f(k)\\,g(n-k)$', title: 'pairs of structures by size of the red part' });
        let N = 6;
        const xOf = (i) => 0.8 + (i * 8.4) / Math.max(1, N - 1);
        A.onClick((x, y) => { let best = -1, bd = 0.6; for (let i = 0; i < N; i++) { const d = Math.abs(x - xOf(i)); if (d < bd) { bd = d; best = i; } } if (best >= 0) mask ^= 1 << best; });
        let info = {};
        v.render(() => {
          const [tf, tg, closed] = PAIRS[pSel.value], F = TY[tf], G = TY[tg]; N = nS.value; mask &= (1 << N) - 1;
          const P = pen(v, A), reds = range(N).filter((i) => (mask >> i) & 1), blues = range(N).filter((i) => !((mask >> i) & 1));
          const r = v.rng(seed * 101 + mask);
          const draw = (set, type, up, col) => {
            if (type === 'S' || set.length < 1) return;
            const ord = r.shuffle(set), links = ord.slice(0, -1).map((a, i) => [a, ord[i + 1]]); if (type === 'C' && ord.length > 1) links.push([ord[ord.length - 1], ord[0]]);
            if (type === 'C' && ord.length === 1) { const px = A.X(xOf(ord[0])), py = A.Y(0); P.arc(px, py + (up ? -26 : 26), 12, 0, 2 * Math.PI, { color: col, width: 2 }); return; }
            links.forEach(([a, b]) => { const x1 = A.X(xOf(a)), x2 = A.X(xOf(b)), y0 = A.Y(0) + (up ? -12 : 12), h = Math.min(90, 14 + Math.abs(x2 - x1) * 0.4) * (up ? -1 : 1); arrowQuad(P, x1, y0, (x1 + x2) / 2, y0 + 2 * h * 0.7, x2, y0, { color: col, width: 1.8, head: 8 }); });
          };
          draw(reds, tf, true, 'red'); draw(blues, tg, false, 'blue');
          for (let i = 0; i < N; i++) A.dot(xOf(i), 0, { r: 13, color: (mask >> i) & 1 ? 'red' : 'blue' });
          for (let i = 0; i < N; i++) A.text(String(i + 1), xOf(i), 0, { color: 'panel', size: 13, align: 'center', baseline: 'middle', weight: 700 });
          A.text(`${F.nm} on red`, 0.2, 2.5, { color: 'red', size: 13, align: 'left' }); A.text(`${G.nm} on blue`, 0.2, -2.5, { color: 'blue', size: 13, align: 'left' });
          const bars = range(N + 1).map((k) => binom(N, k) * F.f(k) * G.f(N - k));
          const hN = bars.reduce((a, b) => a + b, 0), kk = reds.length;
          // series product
          const ef = range(N + 1).map((k) => F.f(k) / fact(k)), eg = range(N + 1).map((k) => G.f(k) / fact(k));
          const prod = sMul(ef, eg, N + 1)[N] * fact(N);
          B.setView([-0.6, N + 0.6], [0, Math.max(1, ...bars) * 1.15]); B.setTicks(range(N + 1), null);
          B.bars(bars, { x0: 0, color: (val, i) => (i === kk ? 'gold' : 'accent') });
          info = { N, kk, hN, prod, bars, closed: closed ? closed(N) : null, here: bars[kk], f: F.f(kk), g: G.f(N - kk) };
        });
        v.legend([['red', 'red part $S$', { dot: true }], ['blue', 'blue part $S^c$', { dot: true }], ['gold', 'your split', { dot: true }]]);
        v.readout(() => {
          const { N, kk, hN, prod, closed, here, f, g } = info;
          return String.raw`Your split has $|S|=${kk}$: there are $\binom{${N}}{${kk}}=${binom(N, kk)}$ such sets, each with $f(${kk})\,g(${N - kk})=${f}\cdot${g}$ structure pairs — ${commas(here)} in all.` + '\n' +
            String.raw`Total $h(${N})=\sum_k\binom{${N}}{k}f(k)g(${N}-k)=${commas(hN)}$; $${N}!\,[x^{${N}}]\widehat F\widehat G=${commas(Math.round(prod))}$ ${Math.abs(prod - hN) < 1e-6 * Math.max(1, hN) ? '✓' : '✗'}${closed != null ? String.raw`; closed form $=${commas(closed)}$ ${Math.abs(closed - hN) < 1e-6 ? '✓' : '✗'}` : ''}.`;
        });
      },
    },
  ],
};

/** Quadratic arrow with a head at the end, in pixels (local copy so that the import list stays short). */
function arrowQuad(P, x1, y1, cx, cy, x2, y2, st = {}) {
  P.quad(x1, y1, cx, cy, x2, y2, st);
  let ux = x2 - cx, uy = y2 - cy; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L; const h = st.head ?? 6;
  P.path([[x2, y2], [x2 - ux * h - uy * h * 0.5, y2 - uy * h + ux * h * 0.5], [x2 - ux * h + uy * h * 0.5, y2 - uy * h - ux * h * 0.5]], { fill: st.color || 'ink', color: st.color || 'ink', width: 1, close: true });
}
