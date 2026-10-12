// Rudin, Real and Complex Analysis — Chapter 1, part 2: limits of measurable functions,
// simple functions, positive measures.

/** Maximal intervals in [a,b] on which pred holds (sampled, endpoints refined by bisection). */
function intervalsWhere(pred, a, b, n = 1200) {
  const out = []; let prevX = a, prevIn = !!pred(a), start = prevIn ? a : null;
  for (let i = 1; i <= n; i++) {
    const x = a + (b - a) * i / n, inn = !!pred(x);
    if (inn !== prevIn) {
      let lo = prevX, hi = x;
      for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (!!pred(m) === prevIn) lo = m; else hi = m; }
      const t = (lo + hi) / 2;
      if (inn) start = t; else { out.push([start, t]); start = null; }
    }
    prevX = x; prevIn = inn;
  }
  if (start != null) out.push([start, b]);
  return out;
}
const totalLength = (ivs) => ivs.reduce((s, [a, b]) => s + (b - a), 0);
function drawRow(S, ivs, y0, y1, color, alpha = 0.8) {
  for (const [a, b] of ivs) S.rect(a, y0, b, y1, { fill: color, fillAlpha: alpha, stroke: false });
}

export default {
  book: 'rca',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Definition',
      name: 'Upper and lower limits',
      statement: String.raw`For a sequence $\{a_n\}$ in $[-\infty,\infty]$ put $b_k=\sup\{a_k,a_{k+1},\ldots\}$ and $\beta=\inf\{b_1,b_2,\ldots\}$. Then $\beta$ is the **upper limit** of $\{a_n\}$, written $\beta=\limsup_{n\to\infty}a_n$. The **lower limit** is $\liminf_{n\to\infty}a_n=-\limsup_{n\to\infty}(-a_n)$. If $\{a_n\}$ converges, both equal $\lim a_n$. For functions $f_n:X\to[-\infty,\infty]$, $\sup_n f_n$ and $\limsup_n f_n$ are defined pointwise.`,
      idea: String.raw`The tail suprema $b_k$ decrease as $k$ grows, so their infimum always exists in $[-\infty,\infty]$: it is the largest value that the sequence approaches infinitely often. No convergence is required, which is what makes $\limsup$ the right tool for limits of measurable functions.`,
      caption: String.raw`Slide $k$ to cut off the head of the sequence. The orange staircase is $b_k=\sup_{n\ge k}a_n$, which can only decrease, and its limit is $\limsup a_n$; the teal staircase $\inf_{n\ge k}a_n$ increases to $\liminf a_n$. Suprema are computed over $n\le 3000$.`,
      deps: [],
      tags: ['limits', 'definitions'],
      viz(v) {
        const M = v.M, NMAX = 3000, NV = 40;
        const SEQ = {
          alt: { label: '$(-1)^n+\\frac1n$', a: (n) => (n % 2 ? -1 : 1) + 1 / n, y: [-1.6, 2.1], ls: 1, li: -1 },
          sin: { label: '$\\sin n$', a: (n) => Math.sin(n), y: [-1.4, 1.4], ls: 1, li: -1 },
          conv: { label: '$1+\\frac{(-1)^n}{n}$', a: (n) => 1 + (n % 2 ? -1 : 1) / n, y: [-0.15, 2.15], ls: 1, li: 1 },
          unb: { label: '$\\frac{n}{8}\\,(1+(-1)^n)$', a: (n) => (n % 2 ? 0 : n / 4), y: [-0.6, 4.2], ls: Infinity, li: 0 },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const kS = v.slider('$k$', 1, 30, 6, { int: true });
        const S = v.stage({ x: [0, NV + 4.5], y: [-1.6, 2.1], height: 330, xlabel: 'n', axes: true });
        let st = null, cache = {};
        const tails = (key) => {
          if (cache[key]) return cache[key];
          const a = SEQ[key].a, sup = new Float64Array(NMAX + 2), inf = new Float64Array(NMAX + 2);
          sup[NMAX + 1] = -Infinity; inf[NMAX + 1] = Infinity;
          for (let n = NMAX; n >= 1; n--) { sup[n] = Math.max(sup[n + 1], a(n)); inf[n] = Math.min(inf[n + 1], a(n)); }
          if (key === 'unb') for (let n = 1; n <= NMAX; n++) sup[n] = Infinity;
          return (cache[key] = { sup, inf });
        };
        v.render(() => {
          const Q = SEQ[which.value], k = kS.value, { sup, inf } = tails(which.value);
          S.setView(null, Q.y);
          const top = S.bounds.y[1];
          const ls = Q.ls, li = Q.li;
          S.vband(k - 0.5, NV + 0.5, { color: 'orange', alpha: 0.06 });
          // staircases
          const stair = (arr, lim) => { const pts = []; for (let j = 1; j <= NV; j++) { const y = Math.min(arr[j], lim); pts.push([j - 0.5, y], [j + 0.5, y]); } return pts; };
          if (which.value === 'unb') {
            S.line(0.5, top - 0.12, NV + 0.5, top - 0.12, { color: 'orange', width: 2.4 });
            S.tex('b_k=+\\infty\\ \\text{for every } k', 1, top - 0.12, { color: 'orange', align: 'left', baseline: 'top', dy: 6, size: 14 });
          } else S.path(stair(sup, top), { color: 'orange', width: 2.4 });
          S.path(stair(inf, top), { color: 'teal', width: 2.4 });
          if (isFinite(ls)) S.hline(ls, { color: 'orange', dash: [6, 4], width: 1.4 });
          S.hline(li, { color: 'teal', dash: [6, 4], width: 1.4 });
          S.tex('\\limsup', NV + 1, isFinite(ls) ? ls : top - 0.12, { color: 'orange', align: 'left', size: 14, dy: isFinite(ls) && Math.abs(ls - li) < 0.2 ? -10 : 0 });
          S.tex('\\liminf', NV + 1, li, { color: 'teal', align: 'left', size: 14, dy: Math.abs(ls - li) < 0.2 ? 10 : 0 });
          // the sequence
          for (let n = 1; n <= NV; n++) {
            const y = Q.a(n);
            if (y > top) { S.arrow(n, top - 0.35, n, top - 0.02, { color: n >= k ? 'accent' : 'faint', head: 6, width: 1.4 }); continue; }
            S.dot(n, y, { color: n >= k ? 'accent' : 'faint', r: n >= k ? 3.6 : 3 });
          }
          if (isFinite(sup[k])) S.dot(k, Math.min(sup[k], top), { color: 'orange', r: 5.5, hollow: true, width: 2.2 });
          S.dot(k, inf[k], { color: 'teal', r: 5.5, hollow: true, width: 2.2 });
          S.vline(k - 0.5, { color: 'orange', width: 1.2, dash: [3, 3] });
          S.text('tail n ≥ k', k - 0.3, S.bounds.y[0], { color: 'orange', size: 11.5, dy: -10, align: 'left' });
          v.legend([['accent', 'terms $a_n$ in the tail', { dot: true }], ['orange', '$b_k=\\sup_{n\\ge k}a_n$'], ['teal', '$\\inf_{n\\ge k}a_n$']]);
          st = { k, b: sup[k], c: inf[k], ls, li };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const f = (x) => (isFinite(x) ? v.fix(x, 4) : '+\\infty');
          return `$k=${s.k}$: $\\;b_k=${f(s.b)}$, $\\;\\inf_{n\\ge k}a_n=${f(s.c)}$. $\\quad\\limsup a_n=\\inf_k b_k=${f(s.ls)}$, $\\;\\liminf a_n=${f(s.li)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Theorem',
      name: 'Suprema and upper limits of measurable functions',
      statement: String.raw`If $f_n:X\to[-\infty,\infty]$ is measurable for $n=1,2,3,\ldots$, then
$$g=\sup_{n\ge1}f_n\qquad\text{and}\qquad h=\limsup_{n\to\infty}f_n$$
are measurable.`,
      idea: String.raw`For every real $\alpha$, $g^{-1}((\alpha,\infty])=\bigcup_n f_n^{-1}((\alpha,\infty])$, a countable union of measurable sets, so $g$ is measurable by Theorem 1.12(c). The same holds for infima, since $\inf_n f_n=-\sup_n(-f_n)$. Finally $h=\inf_k g_k$ with $g_k=\sup_{i\ge k}f_i$.`,
      caption: String.raw`Here $f_n=(1+\frac1n)\,\psi_{n\bmod 3}$ for three phase-shifted waves $\psi_r$. Drag the level $\alpha$. In "sup" mode each row is a super-level set $\{f_n>\alpha\}$, and their union is exactly $\{g>\alpha\}$. In "lim sup" mode the rows are $\{g_k>\alpha\}$ for the tail suprema $g_k=\sup_{i\ge k}f_i$ ($k=1,2,4,\dots,128$), which decrease to $h=\limsup f_n$ (green).`,
      deps: ['rca-1.12', 'rca-1.13'],
      tags: ['measurability', 'limits'],
      viz(v) {
        const M = v.M, NR = 8;
        const psi = (r, x) => 0.5 + 0.4 * Math.cos(2 * Math.PI * (x - r / 3));
        const f = (n, x) => (1 + 1 / n) * psi(n % 3, x);
        const firstFrom = (k, r) => { let n = k; while (n % 3 !== r) n++; return n; };
        const gk = (k, x) => Math.max(f(firstFrom(k, 0), x), f(firstFrom(k, 1), x), f(firstFrom(k, 2), x));
        const h = (x) => Math.max(psi(0, x), psi(1, x), psi(2, x));
        const cols = ['purple', 'blue', 'orange'];
        const KS = [1, 2, 4, 8, 16, 32, 64, 128];
        const mode = v.select('', [{ value: 'sup', label: '$g=\\sup_n f_n$' }, { value: 'ls', label: '$h=\\limsup_n f_n$' }], 'sup', { onChange: (m) => ha.set(1.075, m === 'sup' ? 0.97 : 0.8) });
        const XR = [0, 1.13];
        const T = v.stage({ x: XR, y: [0, 1.95], height: 280, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1] });
        const B = v.stage({ x: XR, y: [0, NR + 1.2], height: 270, axes: false, full: true });
        const ha = T.handle(1.075, 0.97, { color: 'red', label: 'α', constrain: (x, y) => [1.075, M.clamp(y, 0.05, 1.9)] });
        ha.labelPos = 'n';
        let st = null;
        v.render(() => {
          const al = ha.y, sup = mode.value === 'sup';
          T.vband(1, XR[1], { color: 'grid', alpha: 0.5 });
          T.hline(al, { color: 'red', width: 1.4, dash: [6, 4] });
          for (let n = 9; n >= 1; n--) T.fn((x) => f(n, x), { domain: [0, 1], color: cols[n % 3], width: 1.3, alpha: sup ? 0.25 + 0.6 / n : 0.25 });
          if (sup) T.fn((x) => gk(1, x), { domain: [0, 1], color: 'ink', width: 3 });
          else {
            KS.forEach((k, i) => T.fn((x) => gk(k, x), { domain: [0, 1], color: 'accent', width: 1.4, alpha: 0.3 + 0.5 * (NR - i) / NR, dash: [4, 3] }));
            T.fn(h, { domain: [0, 1], color: 'green', width: 3 });
          }
          const rows = [];
          for (let i = 1; i <= NR; i++) {
            const k = KS[i - 1];
            if (sup) rows.push([`\\{f_{${i}}>\\alpha\\}`, cols[i % 3], intervalsWhere((x) => f(i, x) > al, 0, 1, 800)]);
            else rows.push([`\\{g_{${k}}>\\alpha\\}`, 'accent', intervalsWhere((x) => gk(k, x) > al, 0, 1, 800)]);
          }
          rows.push(sup ? ['\\{g>\\alpha\\}', 'ink', intervalsWhere((x) => gk(1, x) > al, 0, 1, 1200)] : ['\\{h>\\alpha\\}', 'green', intervalsWhere((x) => h(x) > al, 0, 1, 1200)]);
          rows.forEach(([lab, col, ivs], i) => {
            const y = NR + 0.75 - i - (i === NR ? 0.25 : 0);
            B.rect(0, y - 0.3, 1, y + 0.3, { fill: 'grid', fillAlpha: 0.7, stroke: false });
            drawRow(B, ivs, y - 0.3, y + 0.3, col, i === NR ? 0.85 : 0.7);
            B.tex(lab, 1.012, y, { color: col, align: 'left', size: 12.5 });
          });
          B.line(0, 0.98, 1, 0.98, { color: 'muted', width: 1, dash: [2, 3] });
          v.legend(sup
            ? [['blue', '$f_n$, $n\\equiv1$'], ['orange', '$f_n$, $n\\equiv2$'], ['purple', '$f_n$, $n\\equiv0 \\pmod 3$'], ['ink', '$g=\\sup_n f_n$'], ['red', 'level $\\alpha$', { dash: true }]]
            : [['accent', '$g_k=\\sup_{i\\ge k}f_i$ for $k=1,2,4,\\dots,128$', { dash: true }], ['green', '$h=\\inf_k g_k=\\limsup f_n$'], ['red', 'level $\\alpha$', { dash: true }]]);
          st = { sup, m: totalLength(rows[NR][2]), m128: totalLength(rows[NR - 1][2]), mu: totalLength(rows.slice(0, NR).flatMap((r) => r[2]).sort((a, b) => a[0] - b[0]).reduce((acc, iv) => { const last = acc[acc.length - 1]; if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]); else acc.push(iv.slice()); return acc; }, [])) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return s.sup ? `Length of $\\bigcup_{n\\le 8}\\{f_n>\\alpha\\}$: $${v.fix(s.mu, 4)}$ $=$ length of $\\{g>\\alpha\\}$: $${v.fix(s.m, 4)}$ (here $f_1,f_2,f_3$ already attain the supremum).`
            : `Length of $\\{g_{128}>\\alpha\\}$: $${v.fix(s.m128, 4)}$, decreasing to the length $${v.fix(s.m, 4)}$ of $\\{h>\\alpha\\}$. Each $g_k$ is measurable by the first part, and $h=\\inf_k g_k=-\\sup_k(-g_k)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14a
    {
      num: '1.14a',
      kind: 'Corollary',
      name: 'Limits, max, min, positive and negative parts',
      statement: String.raw`(a) The pointwise limit of a sequence of complex measurable functions, when it exists everywhere, is measurable.
(b) If $f,g:X\to[-\infty,\infty]$ are measurable, so are $\max\{f,g\}$ and $\min\{f,g\}$. In particular the **positive part** $f^+=\max\{f,0\}$ and the **negative part** $f^-=-\min\{f,0\}$ are measurable, and
$$f=f^+-f^-,\qquad |f|=f^++f^-.$$`,
      idea: String.raw`(a) For real sequences, $\lim f_n=\limsup f_n$ wherever the limit exists; apply Theorem 1.14 to real and imaginary parts and use 1.9. (b) A maximum is the supremum of the sequence $f,g,g,g,\dots$, and a minimum is $-\max\{-f,-g\}$; take $g=0$ for $f^\pm$.`,
      caption: String.raw`Part (a): the continuous functions $f_n(x)=\frac2\pi\arctan(n(x-\frac12))$ converge pointwise to a discontinuous step, which is still measurable; the lower panel shows the sequences $f_n(x)$ at three points (convergence is not uniform). Part (b): drag $g$; $\max\{f,g\}$ and $\min\{f,g\}$ are measurable, and with $g=0$ they give $f^+$ and $-f^-$.`,
      deps: ['rca-1.14', 'rca-1.9'],
      tags: ['measurability', 'limits'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'a', label: '(a) pointwise limits' }, { value: 'b', label: '(b) max, min, $f^{\\pm}$' }], 'a');
        const nS = v.slider('$n$', 1, 80, 6, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-1.5, 1.5], height: 280, axes: true, full: true, title: ' ' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-1.5, 1.5], height: 200, axes: true, full: true, title: ' ' });
        const hg = T.handle(0.85, 0.2, { color: 'orange', label: 'g', constrain: (x, y) => [0.85, M.clamp(y, -1.2, 1.2)] });
        const fa = (n, x) => (2 / Math.PI) * Math.atan(n * (x - 0.5));
        const lim = (x) => Math.sign(x - 0.5);
        const fb = (x) => 0.85 * Math.sin(2 * Math.PI * x * 1.3) + 0.25;
        const pts = [0.3, 0.47, 0.52];
        const pc = ['purple', 'teal', 'pink'];
        let st = null;
        v.render(() => {
          const A = mode.value === 'a', n = nS.value;
          hg.visible = !A;
          if (A) {
            T.setView([-0.02, 1.02], [-1.35, 1.35]); B.setView([0, 81], [-1.25, 1.25]);
            T.setTitle('$f_n\\to f$ pointwise; $f$ is discontinuous but measurable');
            B.setTitle('$f_n(x)$ as a sequence in $n$, at three points $x$');
            for (let j = 1; j < n; j += Math.max(1, Math.floor(n / 12))) T.fn((x) => fa(j, x), { color: 'accent', width: 1, alpha: 0.18 });
            T.fn((x) => fa(n, x), { color: 'accent', width: 2.6 });
            T.line(0, -1, 0.5, -1, { color: 'green', width: 3 }); T.line(0.5, 1, 1, 1, { color: 'green', width: 3 });
            T.dot(0.5, 0, { color: 'green', r: 4.5 }); T.dot(0.5, -1, { color: 'green', r: 4.5, hollow: true }); T.dot(0.5, 1, { color: 'green', r: 4.5, hollow: true });
            pts.forEach((p, i) => { T.vline(p, { color: pc[i], width: 1, dash: [3, 3] }); T.dot(p, fa(n, p), { color: pc[i], r: 4.5 }); });
            pts.forEach((p, i) => {
              const seq = []; for (let j = 1; j <= 80; j++) seq.push([j, fa(j, p)]);
              B.hline(lim(p), { color: pc[i], width: 1, dash: [5, 4], alpha: 0.7 });
              B.path(seq, { color: pc[i], width: 1.2, alpha: 0.5 });
              B.dots(seq.slice(0, n), { color: pc[i], r: 2.4 });
              B.tex(`x=${p}`, 80, seq[79][1], { color: pc[i], align: 'right', baseline: i === 2 ? 'top' : 'bottom', dy: i === 2 ? 4 : -4, size: 12.5 });
            });
            v.legend([['accent', '$f_n$'], ['green', '$f=\\lim f_n=\\limsup f_n$'], ['purple', '$f_n(0.3)\\to-1$'], ['teal', '$f_n(0.47)\\to-1$ (slowly)'], ['pink', '$f_n(0.52)\\to 1$']]);
            st = { A, n, gap: Math.max(...M.linspace(0, 1, 2001).map((x) => Math.abs(fa(n, x) - lim(x)))) };
          } else {
            T.setView([-0.02, 1.02], [-1.35, 1.35]); B.setView([-0.02, 1.02], [-0.3, 1.35]);
            T.setTitle('$\\max\\{f,g\\}$ and $\\min\\{f,g\\}$');
            B.setTitle('$f^+=\\max\\{f,0\\}$ and $f^-=-\\min\\{f,0\\}$, both $\\ge 0$');
            const c0 = hg.y - 0.35 * Math.cos(5 * 0.85), g = (x) => c0 + 0.35 * Math.cos(5 * x);
            T.between((x) => Math.max(fb(x), g(x)), (x) => Math.min(fb(x), g(x)), 0, 1, { fill: 'gray', fillAlpha: 0.1, n: 400 });
            T.fn(fb, { domain: [0, 1], color: 'accent', width: 1.3, dash: [5, 4] });
            T.fn(g, { domain: [0, 1], color: 'orange', width: 1.3, dash: [5, 4] });
            T.fn((x) => Math.max(fb(x), g(x)), { domain: [0, 1], color: 'green', width: 3 });
            T.fn((x) => Math.min(fb(x), g(x)), { domain: [0, 1], color: 'red', width: 3 });
            T.tex('f', 0.07, fb(0.07), { color: 'accent', dy: -14 });
            const xg = M.linspace(0, 1, 900);
            B.fn((x) => Math.max(fb(x), 0), { domain: [0, 1], stroke: false, fill: 'green', fillAlpha: 0.18 });
            B.fn((x) => Math.max(-fb(x), 0), { domain: [0, 1], stroke: false, fill: 'red', fillAlpha: 0.18 });
            B.path(xg.map((x) => (fb(x) >= 0 ? [x, fb(x)] : null)), { color: 'green', width: 2.6 });
            B.path(xg.map((x) => (fb(x) <= 0 ? [x, -fb(x)] : null)), { color: 'red', width: 2.6 });
            B.fn((x) => Math.abs(fb(x)), { domain: [0, 1], color: 'ink', width: 1.2, dash: [4, 3] });
            B.tex('f^+', 0.2, Math.max(fb(0.2), 0), { color: 'green', dy: -14 });
            B.tex('f^-', 0.58, Math.max(-fb(0.58), 0), { color: 'red', dy: -14 });
            v.legend([['accent', '$f$', { dash: true }], ['orange', '$g$', { dash: true }], ['green', '$\\max\\{f,g\\}$; below: $f^+$'], ['red', '$\\min\\{f,g\\}$; below: $f^-$'], ['ink', '$|f|=f^++f^-$', { dash: true }]]);
            const xs = M.linspace(0, 1, 2001);
            st = { A, err: Math.max(...xs.map((x) => Math.abs(Math.max(fb(x), 0) - Math.max(-fb(x), 0) - fb(x)))) };
          }
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.A) return `$n=${s.n}$: $\\sup_x|f_n(x)-f(x)|=${v.fix(s.gap, 3)}$ — no uniform convergence, yet $f=\\limsup f_n$ is measurable by 1.14.`;
          return `Check: $\\max_x|f^+-f^--f| = ${v.fix(s.err, 6)}$. Both $\\max\\{f,g\\}$ and $\\min\\{f,g\\}$ change with $g$; $f^\\pm$ do not.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Proposition',
      name: 'Minimality of the decomposition f = f⁺ − f⁻',
      statement: String.raw`If $f=g-h$ where $g\ge0$ and $h\ge0$, then $f^+\le g$ and $f^-\le h$.`,
      idea: String.raw`From $f\le g$ and $0\le g$ we get $\max\{f,0\}\le g$; likewise $-f\le h$ and $0\le h$ give $f^-\le h$. Equivalently, every decomposition of $f$ as a difference of nonnegative functions is $g=f^++p$, $h=f^-+p$ with the same $p\ge0$.`,
      caption: String.raw`Drag the three gold handles to shape an arbitrary $p\ge0$ (bottom). The middle panel shows the competing decomposition $g=f^++p$, $h=f^-+p$: always $g-h=f$, and the gold gap between $g$ and $f^+$ (or $h$ and $f^-$) is exactly $p$, never negative.`,
      deps: ['rca-1.14a'],
      tags: ['positive part'],
      verify: true,
      viz(v) {
        const M = v.M;
        const f = (x) => 0.9 * Math.sin(2 * Math.PI * x * 1.25 + 0.3) + 0.15;
        const fp = (x) => Math.max(f(x), 0), fm = (x) => Math.max(-f(x), 0);
        const T = v.stage({ x: [-0.02, 1.02], y: [-1.05, 1.25], height: 170, full: true, title: '$f=f^+-f^-$: $f^+$ drawn up, $f^-$ drawn down' });
        const Mid = v.stage({ x: [-0.02, 1.02], y: [-1.75, 1.95], height: 250, full: true, title: 'another decomposition $f=g-h$, $g,h\\ge0$: $g$ drawn up, $h$ drawn down' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-0.05, 0.95], height: 130, full: true, title: '$p=g-f^+=h-f^-$' });
        const H = [[0.2, 0.35], [0.55, 0.6], [0.85, 0.25]].map(([x, y]) => B.handle(x, y, { color: 'gold', constrain: (a, b) => [M.clamp(a, 0, 1), M.clamp(b, 0, 0.9)] }));
        const p = (x) => H.reduce((s, hd) => s + hd.y * Math.exp(-(((x - hd.x) / 0.09) ** 2)), 0);
        const xs = M.linspace(0, 1, 800);
        const where = (fn, test) => xs.map((x) => (test(x) ? [x, fn(x)] : null));
        let st = null;
        v.render(() => {
          T.fn(fp, { domain: [0, 1], stroke: false, fill: 'green', fillAlpha: 0.2 });
          T.fn((x) => -fm(x), { domain: [0, 1], stroke: false, fill: 'red', fillAlpha: 0.2 });
          T.path(where(fp, (x) => f(x) > 0), { color: 'green', width: 2.4 });
          T.path(where((x) => -fm(x), (x) => f(x) < 0), { color: 'red', width: 2.4 });
          const g = (x) => fp(x) + p(x), h = (x) => fm(x) + p(x);
          Mid.between(g, fp, 0, 1, { fill: 'gold', fillAlpha: 0.3 });
          Mid.between((x) => -fm(x), (x) => -h(x), 0, 1, { fill: 'gold', fillAlpha: 0.3 });
          Mid.fn(fp, { domain: [0, 1], color: 'green', width: 1.6, dash: [5, 4] });
          Mid.fn((x) => -fm(x), { domain: [0, 1], color: 'red', width: 1.6, dash: [5, 4] });
          Mid.fn(g, { domain: [0, 1], color: 'blue', width: 2.6 });
          Mid.fn((x) => -h(x), { domain: [0, 1], color: 'purple', width: 2.6 });
          Mid.tex('g', 0.03, g(0.03), { color: 'blue', dy: -14 });
          Mid.tex('-h', 0.5, -h(0.5), { color: 'purple', dy: 16 });
          B.fn(p, { domain: [0, 1], color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.25 });
          v.legend([['green', '$f^+$'], ['red', '$f^-$ (drawn as $-f^-$)'], ['blue', '$g=f^++p$'], ['purple', '$h=f^-+p$ (drawn as $-h$)'], ['gold', 'the gap $p\\ge0$', { area: true }]]);
          const I = (fn) => M.integrate(fn, 0, 1, 800);
          st = { ip: I(fp), im: I(fm), ig: I(g), ih: I(h), err: Math.max(...M.linspace(0, 1, 801).map((x) => Math.abs(g(x) - h(x) - f(x)))) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\int g=${v.fix(s.ig, 3)}\\ \\ge\\ \\int f^+=${v.fix(s.ip, 3)}$, $\\;\\int h=${v.fix(s.ih, 3)}\\ \\ge\\ \\int f^-=${v.fix(s.im, 3)}$; $\\;\\max|g-h-f|=${v.fix(s.err, 6)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16',
      kind: 'Definition',
      name: 'Simple functions',
      statement: String.raw`A complex function $s$ on a measurable space $X$ is **simple** if its range consists of finitely many points. If $\alpha_1,\dots,\alpha_n$ are the distinct values of $s$ and $A_i=\{x:s(x)=\alpha_i\}$, then
$$s=\sum_{i=1}^n\alpha_i\,\chi_{A_i},$$
and $s$ is measurable if and only if every $A_i$ is measurable. Simple functions with values in $[0,\infty)$ (the value $\infty$ is excluded) are the building blocks of the integral.`,
      idea: String.raw`The sets $A_i$ partition $X$, and the preimage of an open set under $s$ is the union of those $A_i$ whose value $\alpha_i$ it contains; so $s$ is measurable exactly when each $A_i=s^{-1}(\{\alpha_i\})$ is.`,
      deps: ['rca-1.3', 'rca-1.9'],
      tags: ['simple functions', 'definitions'],
    },
    // ------------------------------------------------------------------ 1.17
    {
      num: '1.17',
      kind: 'Theorem',
      name: 'Approximation by simple functions from below',
      statement: String.raw`Let $f:X\to[0,\infty]$ be measurable. There exist simple measurable functions $s_n$ on $X$ such that
(a) $0\le s_1\le s_2\le\cdots\le f$;
(b) $s_n(x)\to f(x)$ as $n\to\infty$, for every $x\in X$.`,
      idea: String.raw`Slice the *range*, not the domain: for $n\ge1$ and $1\le i\le n2^n$ let $E_{n,i}=f^{-1}\big([\tfrac{i-1}{2^n},\tfrac{i}{2^n})\big)$ and $F_n=f^{-1}([n,\infty])$ — measurable by 1.12(b) — and set $s_n=\sum_i\frac{i-1}{2^n}\chi_{E_{n,i}}+n\chi_{F_n}$. Halving the mesh only refines the levels, so $s_n\le s_{n+1}$; and $0\le f-s_n\le 2^{-n}$ wherever $f<n$, while $s_n=n\to\infty$ where $f=\infty$.`,
      caption: String.raw`Raise $n$: the blue staircase $s_n$ climbs toward $f$ from below (the dashed staircase is $s_{n-1}$). Orange lines are the dyadic levels $i/2^n$, capped at $n$. Drag the gold marker on the left to pick a level band; its preimage $E_{n,i}$ (gold, on the axis) is an arbitrary measurable set — not an interval — which is what makes this work on any measure space.`,
      deps: ['rca-1.16', 'rca-1.12'],
      see: ['pma-11.20'],
      tags: ['simple functions', 'approximation'],
      viz(v) {
        const M = v.M;
        const FN = {
          smooth: { label: 'smooth $f$', f: (x) => 1.5 + 0.95 * Math.sin(2 * Math.PI * x) + 0.35 * Math.sin(9 * x), ymax: 3.25 },
          jump: { label: 'discontinuous $f$', f: (x) => (x < 0.4 ? 0.35 + 3 * x * x : x < 0.7 ? 2.75 - x : 0.4 + 1.6 * Math.sin(11 * x) ** 2), ymax: 3.25 },
          unb: { label: '$f=0.45/\\sqrt{x}$ (unbounded)', f: (x) => (x > 0 ? 0.45 / Math.sqrt(x) : Infinity), ymax: 4.35, int: 0.9 },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const nS = v.slider('$n$', 1, 6, 2, { int: true });
        const S = v.stage({ x: [-0.075, 1.01], y: [-0.32, 3.25], height: 380, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1] });
        const hl = S.handle(-0.04, 1.3, { color: 'gold', constrain: (x, y) => [-0.04, M.clamp(y, 0, S.bounds.y[1] - 0.05)] });
        let st = null;
        v.render(() => {
          const F = FN[which.value], f = F.f, n = nS.value, q = 2 ** n;
          const ymax = which.value === 'unb' ? Math.max(F.ymax, n + 0.45) : F.ymax;
          S.setView(null, [-0.32, ymax]);
          const s = (m, x) => { const y = f(x); return y >= m ? m : Math.floor(y * 2 ** m) / 2 ** m; };
          // levels
          const px = S.scale * 0 + (S.height / (ymax + 0.32)) / q;
          for (let i = 1; i < n * q; i++) if (px >= 4 || i % q === 0) S.line(0, i / q, 1, i / q, { color: 'orange', width: i % q === 0 ? 1 : 0.7, alpha: i % q === 0 ? 0.55 : 0.35 });
          S.line(0, n, 1, n, { color: 'orange', width: 1.6, dash: [6, 4] });
          S.text(`n = ${n}`, 1, n, { color: 'orange', size: 11.5, align: 'right', dy: -8 });
          // the chosen level band
          const y0 = hl.y, top = y0 >= n;
          const i = top ? null : Math.floor(y0 * q) + 1;
          const lo = top ? n : (i - 1) / q, hi = top ? Infinity : i / q;
          S.rect(0, lo, 1, Math.min(hi, ymax), { fill: 'gold', fillAlpha: 0.16, stroke: false });
          const E = intervalsWhere((x) => { const y = f(x); return y >= lo && y < hi; }, 1e-9, 1, 3000);
          drawRow(S, E, -0.22, -0.08, 'gold', 0.9);
          S.tex(top ? 'F_n=f^{-1}([n,\\infty])' : `E_{${n},${i}}=f^{-1}\\big([\\tfrac{${i - 1}}{${q}},\\tfrac{${i}}{${q}})\\big)`, 0.005, -0.06, { color: 'gold', align: 'left', baseline: 'bottom', size: 13 });
          // s_{n-1}, s_n, f
          if (n > 1) S.fn((x) => s(n - 1, x), { domain: [1e-6, 1], color: 'muted', width: 1.4, dash: [4, 3], n: 2400 });
          S.fn((x) => s(n, x), { domain: [1e-6, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.2, n: 2400 });
          S.fn(f, { domain: [1e-6, 1], color: 'ink', width: 2 });
          S.path(M.linspace(1e-6, 1, 2400).map((x) => { const y = f(x); return y >= lo && y < hi ? [x, s(n, x)] : null; }), { color: 'gold', width: 4 });
          v.legend([['ink', '$f$'], ['accent', '$s_n$', { area: true }], ['muted', '$s_{n-1}$', { dash: true }], ['orange', 'levels $i/2^n$ and the cap $n$'], ['gold', 'a level band and its preimage', { area: true }]]);
          const xs = M.linspace(1e-6, 1, 4000);
          let err = 0; for (const x of xs) { const y = f(x); if (y < n) err = Math.max(err, y - s(n, x)); }
          st = { n, q, err, Is: M.integrate((x) => s(n, x), 1e-9, 1, 6000), If: F.int ?? M.integrate(f, 0, 1, 2000), E: totalLength(E) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$s_{${s.n}}$ takes $${s.n * s.q + 1}$ values; $\\;\\max_{\\{f<n\\}}(f-s_{${s.n}})=${v.fix(s.err, 4)}\\le 2^{-${s.n}}=${v.fix(1 / s.q, 4)}$; $\\;\\int s_{${s.n}}=${v.fix(s.Is, 4)}$ vs $\\int f=${v.fix(s.If, 4)}$; gold set length $${v.fix(s.E, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.18
    {
      num: '1.18',
      kind: 'Definition',
      name: 'Positive measure, measure space, complex measure',
      statement: String.raw`(a) A **positive measure** is a function $\mu$ on a σ-algebra $\mathfrak M$ with values in $[0,\infty]$ that is **countably additive**: if $\{A_i\}$ is a disjoint countable collection of members of $\mathfrak M$, then
$$\mu\Big(\bigcup_{i=1}^\infty A_i\Big)=\sum_{i=1}^\infty\mu(A_i).$$
To exclude trivialities, $\mu(A)<\infty$ for at least one $A\in\mathfrak M$.
(b) A **measure space** is a measurable space with a positive measure on its σ-algebra.
(c) A **complex measure** is a countably additive complex-valued function on a σ-algebra.`,
      idea: String.raw`Typical examples: length on the line, a density $w\,dx$, a unit mass $\delta_p$ at a point (Dirac measure), and counting measure ($\mu(E)=$ number of points of $E$, possibly $\infty$). Countable — not just finite — additivity is what powers every limit theorem of the chapter.`,
      caption: String.raw`Pick a measure on $X=[0,1]$ and drag the ends of $A=[a,b)$. $A$ is cut into infinitely many disjoint pieces $A_k$ (each half of what is left). The bars are $\mu(A_k)$ and the green dots their partial sums, which converge to $\mu(A)$ — countable additivity, for densities and point masses alike.`,
      deps: ['rca-1.3'],
      tags: ['measures', 'definitions'],
      viz(v) {
        const M = v.M, K = 12;
        const MU = {
          leb: { label: 'length', dens: () => 1, atoms: [] },
          dens: { label: 'density $w\\,dx$', dens: (x) => 1 + 0.85 * Math.sin(2 * Math.PI * x + 0.9), atoms: [] },
          dirac: { label: 'Dirac $\\delta_{0.62}$', dens: null, atoms: [[0.62, 1]] },
          mixed: { label: '$\\frac12dx+$ two atoms', dens: () => 0.5, atoms: [[0.3, 0.3], [0.74, 0.45]] },
          count: { label: 'counting on $\\{\\frac{k}{10}\\}$', dens: null, atoms: M.range(9, 1).map((k) => [k / 10, 1]) },
        };
        const which = v.select('$\\mu$', Object.entries(MU).map(([value, o]) => ({ value, label: o.label })), 'mixed');
        const T = v.stage({ x: [-0.03, 1.03], y: [-0.5, 2.05], height: 250, axes: 'box', full: true, title: 'the measure $\\mu$ on $X=[0,1]$ (density and point masses) and the set $A=\\bigcup_k A_k$' });
        const B = v.stage({ x: [0, K + 1.5], y: [0, 1], height: 200, axes: 'box', full: true, xticks: M.range(K, 1), title: '$\\mu(A_k)$ (bars) and $\\sum_{j\\le k}\\mu(A_j)$ (dots)' });
        const RY = -0.3;
        const ha = T.handle(0.12, RY, { color: 'accent', constrain: (x) => [M.clamp(x, 0, 1), RY] });
        const hb = T.handle(0.86, RY, { color: 'accent', constrain: (x) => [M.clamp(x, 0, 1), RY] });
        let st = null;
        const mu = (Q, u, w) => {
          if (w <= u) return 0;
          let m = Q.dens ? M.integrate(Q.dens, u, w, 200) : 0;
          for (const [p, c] of Q.atoms) if (p >= u && p < w) m += c;
          return m;
        };
        v.render(() => {
          const Q = MU[which.value];
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          if (Q.dens) T.fn(Q.dens, { domain: [0, 1], color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.14 });
          for (const [p, c] of Q.atoms) {
            const hh = Math.min(1.7, 1.4 * c + 0.2);
            T.line(p, 0, p, hh, { color: 'purple', width: 2.6 });
            T.dot(p, hh, { color: 'purple', r: 5 });
            if (Q.atoms.length < 4) T.text(`mass ${c}`, p, hh, { color: 'purple', size: 11.5, dy: -12, align: 'center' });
          }
          // pieces
          const cut = (k) => a + (b - a) * (1 - 2 ** -k);
          const pieces = M.range(K, 1).map((k) => [cut(k - 1), cut(k)]);
          pieces.forEach(([u, w], i) => T.rect(u, RY - 0.07, w, RY + 0.07, { fill: i % 2 ? 'gold' : 'orange', fillAlpha: 0.85, stroke: false }));
          T.tex('A_1', (pieces[0][0] + pieces[0][1]) / 2, RY, { color: 'orange', dy: -16, size: 13 });
          if (b - a > 0.2) T.tex('A_2', (pieces[1][0] + pieces[1][1]) / 2, RY, { color: 'gold', dy: -16, size: 13 });
          if (b - a > 0.35) T.tex('A_3\\,\\cdots', (pieces[2][0] + pieces[2][1]) / 2 + 0.02, RY, { color: 'orange', dy: -16, size: 13 });
          const vals = pieces.map(([u, w]) => mu(Q, u, w));
          const total = mu(Q, a, b);
          const sums = M.partialSums((k) => vals[k], K);
          const ymax = Math.max(0.2, total, ...vals) * 1.18;
          B.setView(null, [-0.13 * ymax, ymax]);
          B.bars(vals, { color: (val, i) => (i % 2 ? 'gold' : 'orange'), fillAlpha: 0.8 });
          B.hline(total, { color: 'green', width: 1.6, dash: [6, 4] });
          B.tex(`\\mu(A)=${v.fix(total, 3)}`, K + 1.45, total, { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          B.path(sums.map((y, i) => [i + 1, y]), { color: 'green', width: 1.4 });
          B.dots(sums.map((y, i) => [i + 1, y]), { color: 'green', r: 3.6 });
          v.legend([['accent', 'density part', { area: true }], ['purple', 'point masses', { dot: true }], ['orange', 'disjoint pieces $A_k$', { area: true }], ['green', 'partial sums $\\sum_{j\\le k}\\mu(A_j)$', { dot: true }]]);
          st = { total, sK: sums[K - 1], a, b };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$A=[${v.fix(s.a, 3)},${v.fix(s.b, 3)})$: $\\mu(A)=${v.fix(s.total, 4)}$, $\\;\\sum_{k\\le ${K}}\\mu(A_k)=${v.fix(s.sK, 4)}$ — the rest of the series accounts for the difference $${v.fix(s.total - s.sK, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.19
    {
      num: '1.19',
      kind: 'Theorem',
      name: 'Elementary properties of measures',
      statement: String.raw`Let $\mu$ be a positive measure on a σ-algebra $\mathfrak M$. Then
(a) $\mu(\emptyset)=0$;
(b) $\mu(A_1\cup\cdots\cup A_n)=\mu(A_1)+\cdots+\mu(A_n)$ for pairwise disjoint $A_1,\dots,A_n\in\mathfrak M$;
(c) $A\subset B$ implies $\mu(A)\le\mu(B)$;
(d) if $A_1\subset A_2\subset\cdots$ and $A=\bigcup_nA_n$, then $\mu(A_n)\to\mu(A)$;
(e) if $A_1\supset A_2\supset\cdots$, $A=\bigcap_nA_n$, and $\mu(A_1)<\infty$, then $\mu(A_n)\to\mu(A)$.`,
      idea: String.raw`(a) Take $A_1$ with $\mu(A_1)<\infty$ and all other $A_i=\emptyset$ in countable additivity. (b) Pad with empty sets. (c) $\mu(B)=\mu(A)+\mu(B-A)$. (d) Write $A$ as the disjoint union of the "rings" $B_n=A_n-A_{n-1}$; then $\mu(A_n)$ are partial sums of $\sum\mu(B_i)$. (e) Apply (d) to $C_n=A_1-A_n$, which increase to $A_1-A$, and subtract from the finite number $\mu(A_1)$. Without $\mu(A_1)<\infty$ the subtraction is meaningless, and (e) can fail.`,
      caption: String.raw`Slide $n$. In (d) the blobs $A_n$ grow and their areas increase to the area of the union; in (e) they shrink and the areas decrease to that of the intersection. The third case is Rudin's counterexample: counting measure on $\{1,2,3,\dots\}$ and $A_n=\{n,n+1,\dots\}$ — every $\mu(A_n)=\infty$, yet $\bigcap A_n=\emptyset$.`,
      deps: ['rca-1.18'],
      tags: ['measures', 'continuity'],
      viz(v) {
        const M = v.M, NB = 20;
        const base = M.blob(0, 0, 1, 5, 0.32, 200);
        const area0 = Math.abs(M.polyArea(base));
        const MODE = {
          inc: { label: '(d) $A_n\\uparrow A$', s: (n) => 1 - 0.8 / (n + 0.6), lim: 1 },
          dec: { label: '(e) $A_n\\downarrow A$, $\\mu(A_1)<\\infty$', s: (n) => 0.42 + 0.58 / n, lim: 0.42 },
          cnt: { label: '(e) fails: counting measure' },
        };
        const mode = v.select('', Object.entries(MODE).map(([value, o]) => ({ value, label: o.label })), 'inc');
        const nS = v.slider('$n$', 1, NB, 4, { int: true });
        const L = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 320 });
        const R = v.stage({ x: [0, NB + 1], y: [0, 4], axes: 'box', height: 320, xticks: [1, 5, 10, 15, 20], title: '$\\mu(A_n)$ for $n=1,\\dots,20$; dashed: $\\mu(A)$' });
        let st = null;
        v.render(() => {
          const md = mode.value, n = nS.value;
          if (md !== 'cnt') {
            const Q = MODE[md];
            const shape = (s) => base.map(([x, y]) => [s * x, s * y]);
            L.setView([-1.45, 1.45], [-1.3, 1.3]);
            for (let j = 1; j <= NB; j++) if (j !== n) L.poly(shape(Q.s(j)), { color: 'accent', width: 0.8, alpha: 0.3 });
            L.poly(shape(Q.lim), { color: 'green', width: 2.2, dash: [6, 4], fill: 'green', fillAlpha: md === 'dec' ? 0.15 : 0 });
            L.poly(shape(Q.s(n)), { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.22 });
            L.tex(`A_{${n}}`, 0, 0, { color: 'accent', size: 18 });
            L.tex(md === 'inc' ? 'A=\\bigcup A_n' : 'A=\\bigcap A_n', base[30][0] * Q.lim, base[30][1] * Q.lim, { color: 'green', align: 'left', dx: 8, dy: -10, size: 14 });
            const vals = M.range(NB, 1).map((j) => area0 * Q.s(j) ** 2), lim = area0 * Q.lim ** 2;
            R.setView(null, [-0.1 * Math.max(...vals, lim), Math.max(...vals, lim) * 1.12]);
            R.bars(vals, { color: (val, i) => (i + 1 === n ? 'accent' : 'faint'), fillAlpha: 0.8 });
            R.hline(lim, { color: 'green', width: 1.8, dash: [6, 4] });
            st = { md, n, val: vals[n - 1], lim };
          } else {
            L.setView([-0.3, 13.3], [-3, 3]);
            for (let j = 1; j <= 12; j++) {
              const on = j >= n;
              L.dot(j, 0, { color: on ? 'accent' : 'faint', r: on ? 6 : 4.5 });
              L.text(String(j), j, 0, { color: on ? 'ink' : 'muted', size: 11.5, dy: 18, align: 'center' });
            }
            L.text('…', 12.8, 0, { color: 'accent', size: 18, align: 'center' });
            if (n <= 12) L.rect(n - 0.45, -0.7, 13.2, 0.7, { color: 'accent', width: 1.6, dash: [5, 4] });
            L.tex(`A_{${n}}=\\{${n},${n + 1},${n + 2},\\dots\\}`, 6.5, 1.6, { color: 'accent', size: 16 });
            L.tex('\\textstyle\\bigcap_n A_n=\\emptyset,\\ \\ \\mu(\\emptyset)=0', 6.5, -1.9, { color: 'red', size: 15 });
            R.setView(null, [-0.4, 4]);
            for (let j = 1; j <= NB; j++) { R.rect(j - 0.35, 0, j + 0.35, 3.55, { fill: j === n ? 'accent' : 'faint', fillAlpha: 0.75, stroke: false }); R.arrow(j, 3.4, j, 3.95, { color: j === n ? 'accent' : 'faint', head: 6, width: 1.4 }); }
            R.text('∞', NB / 2 + 0.5, 3.6, { color: 'accent', size: 15, align: 'center', dy: -2 });
            R.dot(NB + 0.6, 0, { color: 'red', r: 5.5 });
            R.tex('\\mu(\\textstyle\\bigcap_n A_n)=0', NB + 0.6, 0, { color: 'red', align: 'right', baseline: 'bottom', dx: -4, dy: -8, size: 14 });
            st = { md, n };
          }
          v.legend(md === 'cnt' ? [['accent', '$A_n$ and $\\mu(A_n)=\\infty$'], ['red', 'the intersection']] : [['accent', '$A_n$ (current) and $\\mu(A_n)$', { area: true }], ['green', md === 'inc' ? 'the union $A$' : 'the intersection $A$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.md === 'cnt') return `$\\mu(A_${s.n})=\\infty$ for every $n$, but $\\mu(\\bigcap A_n)=0$: (e) needs $\\mu(A_1)<\\infty$.`;
          return `$\\mu(A_{${s.n}})=${v.fix(s.val, 4)}$, $\\;\\mu(A)=${v.fix(s.lim, 4)}$, $\\;|\\mu(A_{${s.n}})-\\mu(A)|=${v.fix(Math.abs(s.val - s.lim), 4)}$ (μ = area).`;
        });
      },
    },
  ],
};
