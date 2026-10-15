// Rudin, Principles of Mathematical Analysis — Chapter 3, part 3: upper limits, special sequences,
// series and the Cauchy criterion (3.17–3.22).

const lg = Math.log10;
const LOGTICKS = [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴'], [5, '10⁵']];
/** TeX scientific notation. */
function sci(x, d = 2) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 4) return String(Number(x.toPrecision(d + 1)));
  return `${(x / Math.pow(10, e)).toFixed(d - 1)}\\times10^{${e}}`;
}

export default {
  collection: 'pma',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Theorem',
      name: 'Characterization of the upper limit',
      statement: String.raw`Let $\{s_n\}$ be a sequence of real numbers, and let $E$ and $s^*$ be as in 3.16. Then
(a) $s^*\in E$;
(b) if $x>s^*$, there is an integer $N$ such that $s_n<x$ for every $n\ge N$.
Moreover, $s^*$ is the only extended real number with both properties. The corresponding statement holds for $s_*$.`,
      idea: String.raw`(a) If $s^*=+\infty$, the sequence is unbounded above and some subsequence tends to $+\infty$. If $s^*$ is real, $E$ is bounded above and nonempty, and it is closed by 3.7, so it contains its supremum (2.28). If $s^*=-\infty$, $E=\{-\infty\}$ and $s_n\to-\infty$. (b) If $s_n\ge x$ for infinitely many $n$, those terms would have a subsequential limit $y\ge x>s^*$ in $E$. Uniqueness: two numbers $p<q$ with both properties are separated by some $x$; (b) for $p$ keeps the late terms below $x$, so nothing in $E$ can equal $q$.`,
      caption: String.raw`Drag the level $x$ (orange handle). Terms at or above it are red. The right panel plots $N(x)$, the first index after which every term stays below $x$ (vertical axis logarithmic). For $x>s^*$ it is finite, but it blows up as $x\downarrow s^*$; for $x\le s^*$ infinitely many terms reach $x$ and no $N$ exists — that is property (a) seen from the other side.`,
      deps: ['pma-3.16', 'pma-3.7', 'pma-2.28'],
      tags: ['limsup'],
      viz(v) {
        const NM = 200000;
        const SEQ = {
          alt: { label: '$(-1)^n+3/n$', f: (n) => (n % 2 ? -1 : 1) + 3 / n, sup: 1, inf: -1, y: [-1.6, 2.8], x: [0.4, 2.6] },
          sin: { label: '$\\sin n+2/\\sqrt n$', f: (n) => Math.sin(n) + 2 / Math.sqrt(n), sup: 1, inf: -1, y: [-1.6, 2.9], x: [0.4, 2.6] },
          below: { label: '$1-1/n$', f: (n) => 1 - 1 / n, sup: 1, inf: 1, y: [-0.1, 1.6], x: [0.3, 1.5] },
        };
        const cache = {};
        function data(key) {
          if (cache[key]) return cache[key];
          const f = SEQ[key].f, s = new Float64Array(NM + 2), sm = new Float64Array(NM + 2);
          for (let n = 1; n <= NM; n++) s[n] = f(n);
          sm[NM + 1] = -Infinity; for (let n = NM; n >= 1; n--) sm[n] = Math.max(s[n], sm[n + 1]);
          return (cache[key] = { s, sm });
        }
        // N(x) = first n with sup_{k>=n} s_k < x (binary search on the non-increasing suffix max)
        function Nof(D, x) {
          if (D.sm[1] < x) return 1;
          if (D.sm[NM] >= x) return Infinity;
          let lo = 1, hi = NM; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (D.sm[mid] < x) hi = mid; else lo = mid; }
          return hi;
        }
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const L = v.stage({ x: [0, 121], y: [-1.6, 2.8], height: 340, axes: 'box', title: 'terms $s_n$ against $n$' });
        const R = v.stage({ x: [0.4, 2.6], y: [-0.2, 5.6], height: 340, axes: 'box', yticks: LOGTICKS.map(([a, b]) => [a, b]), title: '$N(x)$ against the level $x$' });
        const X = L.handle(120, 1.25, { color: 'orange', constrain: (x, y) => [120, y] });
        let last = null, st = {};
        v.render(() => {
          const key = which.value, S = SEQ[key], D = data(key);
          if (key !== last) { last = key; L.setView(null, S.y); R.setView(S.x, null); X.y = S.sup + (key === 'below' ? 0.2 : 0.25); }
          const x = X.y, N = Nof(D, x);
          // left
          L.hline(S.sup, { color: 'green', dash: [6, 4], width: 1.5 });
          L.tex('s^*', 100, S.sup, { color: 'green', align: 'left', baseline: 'top', dy: 3, size: 14 });
          if (S.inf !== S.sup) { L.hline(S.inf, { color: 'green', dash: [2, 4], width: 1.2, alpha: 0.7 }); L.tex('s_*', 100, S.inf, { color: 'green', align: 'left', baseline: 'top', dy: 3, size: 14 }); }
          L.hband(x, L.bounds.y[1], { color: 'red', alpha: 0.06 });
          L.hline(x, { color: 'orange', width: 1.6 });
          L.tex('x', 120, x, { color: 'orange', align: 'right', dx: -12, dy: -11, size: 15 });
          const lo = [], hi = [];
          for (let n = 1; n <= 120; n++) (D.s[n] >= x ? hi : lo).push([n, D.s[n]]);
          L.dots(lo, { color: 'accent', r: 2.6 }); L.dots(hi, { color: 'red', r: 3.4 });
          if (isFinite(N) && N > 1 && N <= 120) { L.dot(N - 1, D.s[N - 1], { color: 'orange', r: 7, hollow: true, width: 2 }); L.vline(N, { color: 'orange', dash: [3, 3] }); L.tex(`N(x)=${N}`, N, L.bounds.y[1], { color: 'orange', align: 'left', baseline: 'top', dx: 5, dy: 5, size: 13 }); }
          // right: N(x) curve
          const [x0, x1] = S.x;
          R.vband(x0, S.sup, { color: 'red', alpha: 0.1 });
          R.vline(S.sup, { color: 'green', dash: [6, 4], width: 1.5 });
          R.tex('s^*', S.sup, 5.4, { color: 'green', align: 'left', dx: 5, size: 14 });
          R.text('N(x) = ∞', (x0 + S.sup) / 2 + 0.06, 2.6, { color: 'red', align: 'center', math: true, size: 14 });
          const curve = []; for (let i = 0; i <= 400; i++) { const xx = S.sup + 1e-4 + (x1 - S.sup) * Math.pow(i / 400, 2); const n = Nof(D, xx); curve.push(isFinite(n) ? [xx, lg(n)] : null); }
          R.path(curve, { color: 'orange', width: 2.2 });
          if (isFinite(N)) R.dot(x, lg(N), { color: 'orange', r: 5.5 });
          else R.dot(x, 5.45, { color: 'red', r: 5.5, hollow: true, width: 2 });
          v.legend([['accent', 'terms below $x$', { dot: true }], ['red', 'terms $\\ge x$', { dot: true }], ['orange', 'level $x$ and $N(x)$'], ['green', '$s^*=\\limsup s_n$', { dash: true }]]);
          st = { x, N, S, cnt: hi.length };
        });
        v.readout(() => {
          const s = st; if (!s.S) return '';
          if (isFinite(s.N)) return `$x=${v.fix(s.x, 3)}>s^*=${s.S.sup}$: every term with $n\\ge N(x)=${s.N}$ is below $x$ — property (b).`;
          return `$x=${v.fix(s.x, 3)}\\le s^*$: terms keep reaching $x$ (checked to $n=200\\,000$), so no $N$ exists; a subsequence converges to $s^*\\ge x$ — property (a).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19',
      kind: 'Theorem',
      name: 'Upper and lower limits respect inequalities',
      statement: String.raw`If $s_n\le t_n$ for all $n\ge N$, where $N$ is fixed, then
$$\liminf_{n\to\infty}s_n\le\liminf_{n\to\infty}t_n\qquad\text{and}\qquad\limsup_{n\to\infty}s_n\le\limsup_{n\to\infty}t_n .$$`,
      idea: String.raw`Suppose $t^*=\limsup t_n<\limsup s_n=s^*$ and choose $x$ strictly between. By 3.17(b) eventually $t_n<x$, hence $s_n\le t_n<x$ for all large $n$; but by 3.17(a) some subsequence of $\{s_n\}$ tends to $s^*>x$ — a contradiction. The lower limits are handled the same way. Finitely many exceptions to $s_n\le t_n$ are harmless, since upper and lower limits only see tails.`,
      caption: String.raw`Here $s_n=0.8\sin(1.3n)+1.2/n$ and $t_n=s_n+c+0.3\,(1+\sin(en/3))-2.5/n$. Red ticks mark the indices where $t_n<s_n$. For $c>0$ these stop after some $N$, and both inequalities hold (green). For $c\le0$ violations recur forever, the hypothesis fails, and the lower limits come out in the wrong order. The four limits on the right are exact (the angles are equidistributed).`,
      deps: ['pma-3.16', 'pma-3.17'],
      see: ['rca-1.28'],
      tags: ['limsup', 'inequalities'],
      viz(v) {
        const cS = v.slider('$c$', -0.4, 0.4, 0.12, { step: 0.01 });
        const NM = 150, NBIG = 200000;
        const sn = (n) => 0.8 * Math.sin(1.3 * n) + 1.2 / n;
        const dn = (n, c) => c + 0.3 * (1 + Math.sin(Math.E / 3 * n)) - 2.5 / n;
        const S = v.stage({ x: [0, 190], y: [-1.75, 2.15], height: 380, axes: 'box', full: true, xticks: [0, 25, 50, 75, 100, 125, 150], title: '$s_n$ and $t_n$ against $n$; on the right, their upper and lower limits' });
        let st = {};
        v.render(() => {
          const c = cS.value;
          let lastBad = 0; for (let n = 1; n <= NBIG; n++) if (dn(n, c) < 0) lastBad = n;
          const recurring = lastBad > NBIG * 0.5;
          const N = lastBad + 1;
          const sp = [], tp = [], bad = [];
          for (let n = 1; n <= NM; n++) { const s = sn(n), t = s + dn(n, c); sp.push([n, s]); tp.push([n, t]); if (t < s) bad.push(n); }
          if (!recurring && N <= NM) S.vband(N - 0.5, NM + 0.5, { color: 'green', alpha: 0.06 });
          for (const n of bad) S.line(n, -1.45, n, -1.28, { color: 'red', width: 2 });
          S.path(sp, { color: 'blue', width: 1, alpha: 0.35 }); S.path(tp, { color: 'purple', width: 1, alpha: 0.35 });
          S.dots(sp, { color: 'blue', r: 2.4 }); S.dots(tp, { color: 'purple', r: 2.4 });
          // side strip with the four limits
          S.rect(156, -1.75, 190, 2.15, { fill: 'panel', fillAlpha: 1, stroke: false });
          S.line(156, -1.75, 156, 2.15, { color: 'faint', width: 1 });
          const lim = { ss: 0.8, si: -0.8, ts: 1.4 + c, ti: -0.8 + c };
          const okS = lim.ss <= lim.ts + 1e-12, okI = lim.si <= lim.ti + 1e-12;
          S.line(163, lim.ss, 170, lim.ss, { color: 'blue', width: 3 }); S.line(163, lim.si, 170, lim.si, { color: 'blue', width: 3 });
          S.line(176, lim.ts, 183, lim.ts, { color: 'purple', width: 3 }); S.line(176, lim.ti, 183, lim.ti, { color: 'purple', width: 3 });
          S.tex('\\limsup s_n', 166.5, lim.ss, { color: 'blue', baseline: 'bottom', dy: -4, size: 12 });
          S.tex('\\liminf s_n', 166.5, lim.si, { color: 'blue', baseline: 'top', dy: 4, size: 12 });
          S.tex('\\limsup t_n', 179.5, lim.ts, { color: 'purple', baseline: 'bottom', dy: -4, size: 12 });
          S.tex('\\liminf t_n', 179.5, lim.ti, { color: 'purple', baseline: 'top', dy: 4, size: 12 });
          S.arrow(170.5, lim.ss, 175.5, lim.ts, { color: okS ? 'green' : 'red', width: 1.6, head: 7 });
          S.arrow(170.5, lim.si, 175.5, lim.ti, { color: okI ? 'green' : 'red', width: 1.6, head: 7 });
          S.corner(recurring ? 'violations recur forever: the hypothesis fails' : `no violation after n = ${N - 1}: the hypothesis holds`, 'tl', { color: recurring ? 'red' : 'green', weight: 600 });
          v.legend([['blue', '$s_n$', { dot: true }], ['purple', '$t_n$', { dot: true }], ['red', 'indices with $t_n<s_n$'], ['green', 'arrow: inequality holds (red: fails)']]);
          st = { c, N, recurring, lim, okS, okI, nbad: bad.length };
        });
        v.readout(() => {
          const s = st; if (!s.lim) return '';
          const f = (x) => v.fix(x, 2);
          const ineq = `$\\liminf s_n=${f(s.lim.si)}\\ ${s.okI ? '\\le' : '>'}\\ ${f(s.lim.ti)}=\\liminf t_n$, $\\ \\limsup s_n=${f(s.lim.ss)}\\ ${s.okS ? '\\le' : '>'}\\ ${f(s.lim.ts)}=\\limsup t_n$`;
          return (s.recurring ? 'The hypothesis fails. ' : `Hypothesis holds from $N=${s.N}$. `) + ineq + (s.recurring && !s.okI ? ' — the conclusion breaks too.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Some special sequences',
      statement: String.raw`(a) If $p>0$, then $\lim_{n\to\infty}\dfrac{1}{n^p}=0$.
(b) If $p>0$, then $\lim_{n\to\infty}\sqrt[n]{p}=1$.
(c) $\lim_{n\to\infty}\sqrt[n]{n}=1$.
(d) If $p>0$ and $\alpha$ is real, then $\lim_{n\to\infty}\dfrac{n^\alpha}{(1+p)^n}=0$.
(e) If $|x|<1$, then $\lim_{n\to\infty}x^n=0$.`,
      idea: String.raw`(a) Take $n>(1/\eps)^{1/p}$, possible by the archimedean property (1.20). (b) For $p>1$ write $\sqrt[n]p=1+x_n$; the binomial theorem gives $1+nx_n\le(1+x_n)^n=p$, so $0<x_n\le(p-1)/n$; for $p<1$ take reciprocals. (c) With $\sqrt[n]n=1+x_n$, keep the quadratic binomial term: $n\ge\binom n2x_n^2$, so $0\le x_n\le\sqrt{2/(n-1)}$. (d) Pick an integer $k>\max(\alpha,0)$; for $n>2k$, $(1+p)^n>\binom nk p^k>\frac{n^kp^k}{2^kk!}$, hence $0<\frac{n^\alpha}{(1+p)^n}<\frac{2^kk!}{p^k}\,n^{\alpha-k}\to0$ by (a). (e) is (d) with $\alpha=0$ and $|x|=1/(1+p)$.`,
      caption: String.raw`Choose a part and its parameters; the horizontal axis is $\log_{10}n$. Blue dots are the sequence, the dashed gold curve is the explicit bound from the proof, and the green line is the limit. In (d) the vertical axis is logarithmic: with a large $\alpha$ the sequence first climbs enormously before the exponential wins. In (e), push $|x|$ to $1$ or beyond to break the hypothesis.`,
      deps: ['pma-3.1', 'pma-1.20', 'pma-1.21', 'pma-3.3'],
      tags: ['sequences', 'limits'],
      viz(v) {
        const PARTS = [
          { value: 'a', label: '$n^{-p}$' }, { value: 'b', label: '$\\sqrt[n]{p}$' }, { value: 'c', label: '$\\sqrt[n]{n}$' },
          { value: 'd', label: '$n^\\alpha/(1+p)^n$' }, { value: 'e', label: '$x^n$' },
        ];
        const part = v.select('part', PARTS, 'd');
        const pS = v.slider('$p$', 0.05, 4, 0.25, { log: true, fmt: (x) => x.toFixed(2) });
        const aS = v.slider('$\\alpha$', -1, 6, 3, { step: 0.1 });
        const xS = v.slider('$x$', -1.15, 1.15, 0.93, { step: 0.01 });
        const NMAX = 10000, EPS = 0.05;
        const G = v.stage({ x: [-0.05, 4.05], y: [0, 1.2], height: 380, axes: 'box', full: true, xticks: LOGTICKS.slice(0, 5), title: 'the sequence against $n$ (log scale)' });
        let st = {};
        v.render(() => {
          const P = part.value, p = pS.value, al = aS.value, x = xS.value;
          let f, bound = null, lim = 0, logY = false, ok = true, label = '', bnote = '';
          if (P === 'a') { f = (n) => Math.pow(n, -p); label = `n^{-${v.fix(p, 2)}}`; bnote = `N>(1/\\varepsilon)^{1/p}=${v.fmt(Math.pow(1 / EPS, 1 / p), 3)}`; }
          else if (P === 'b') { f = (n) => Math.pow(p, 1 / n); lim = 1; label = `\\sqrt[n]{${v.fix(p, 2)}}`; bound = p >= 1 ? (n) => 1 + (p - 1) / n : (n) => 1 / (1 + (1 / p - 1) / n); bnote = p >= 1 ? '1+\\frac{p-1}{n}' : '\\left(1+\\frac{1/p-1}{n}\\right)^{-1}'; }
          else if (P === 'c') { f = (n) => Math.pow(n, 1 / n); lim = 1; label = '\\sqrt[n]{n}'; bound = (n) => (n > 1 ? 1 + Math.sqrt(2 / (n - 1)) : NaN); bnote = '1+\\sqrt{2/(n-1)}'; }
          else if (P === 'd') {
            logY = true; const k = Math.max(1, Math.floor(Math.max(al, 0)) + 1);
            f = (n) => Math.exp(al * Math.log(n) - n * Math.log1p(p)); label = `n^{${v.fix(al, 1)}}/(1+${v.fix(p, 2)})^n`;
            const C = Math.pow(2, k) * v.M.factorial(k) / Math.pow(p, k);
            bound = (n) => (n > 2 * k ? C * Math.pow(n, al - k) : NaN); bnote = `\\frac{2^k k!}{p^k}n^{\\alpha-k},\\ k=${k}`;
          } else { f = (n) => Math.pow(x, n); label = `(${v.fix(x, 2)})^n`; ok = Math.abs(x) < 1; const q = 1 / Math.abs(x) - 1; if (ok && q > 0) { bound = (n) => 2 / (q * n); bnote = '\\frac{2}{p\\,n},\\ |x|=\\frac{1}{1+p}'; } }
          // values
          const ns = []; for (let n = 1; n <= NMAX; n = n < 120 ? n + 1 : Math.ceil(n * 1.02)) ns.push(n);
          const tr = (y) => (logY ? (y > 0 ? lg(y) : NaN) : y);
          let lo = Infinity, hi = -Infinity; for (const n of ns) { const y = tr(f(n)); if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
          if (P === 'e' && !ok) { lo = Math.max(lo, -4); hi = Math.min(hi, 4); }
          if (logY) { lo = Math.max(lo, -12); hi = Math.max(hi, 0.5); }
          lo = Math.min(lo, logY ? lg(EPS) - 0.5 : lim - 0.08); hi = Math.max(hi, logY ? lg(EPS) : lim + 0.08);
          const pad = (hi - lo) * 0.08;
          G.setView(null, [lo - pad, hi + pad]);
          // N(eps)
          let lastOut = 0; for (let n = 1; n <= 200000 && n <= (P === 'e' && !ok ? 2000 : 200000); n++) { const y = f(n); if (!(Math.abs(y - lim) < EPS)) lastOut = n; }
          const none = (P === 'e' && !ok) || lastOut > 150000;
          const N = lastOut + 1;
          if (!logY) G.hband(lim - EPS, lim + EPS, { color: 'green', alpha: 0.1 });
          if (!logY) G.hline(lim, { color: 'green', width: 1.6, dash: [6, 4] });
          else { G.hline(lg(EPS), { color: 'green', width: 1.4, dash: [6, 4] }); G.tex('\\varepsilon=0.05', 4.0, lg(EPS), { color: 'green', align: 'right', baseline: 'top', dy: 3, size: 13 }); }
          if (!none && N <= NMAX) { G.vline(lg(N), { color: 'green', dash: [3, 3] }); G.tex(`N=${N}`, lg(N), G.bounds.y[1], { color: 'green', align: 'left', baseline: 'top', dx: 5, dy: 6, size: 13 }); }
          if (bound) { const bp = []; for (const n of ns) { const b = bound(n); bp.push(isFinite(b) && b > 0 ? [lg(n), tr(b)] : null); } G.path(bp, { color: 'gold', width: 2, dash: [7, 4] }); }
          const pts = ns.map((n) => [lg(n), tr(f(n))]);
          G.path(pts, { color: 'accent', width: 1.2, alpha: 0.5 });
          G.dots(pts.filter((_, i) => ns[i] <= 120 || i % 2 === 0), { color: none ? 'red' : 'accent', r: 2.6 });
          G.setTitle(logY ? `$\\log_{10}$ of $${label}$ against $n$ (both axes logarithmic)` : `$${label}$ against $n$ (log scale in $n$)`);
          if (P === 'e' && !ok) G.corner(Math.abs(x) === 1 ? '|x| = 1: the powers do not tend to 0' : '|x| > 1: the powers are unbounded', 'tl', { color: 'red', weight: 600 });
          v.legend([['accent', 'the sequence', { dot: true }], ...(bound ? [['gold', `bound from the proof: $${bnote}$`, { dash: true }]] : []), ['green', logY ? 'level $\\varepsilon$' : `limit $${lim}$ and band $\\pm\\varepsilon$`, logY ? { dash: true } : { area: true }]]);
          st = { P, N, none, bnote, p, al, x, ok };
        });
        v.readout(() => {
          const s = st; if (!s.P) return '';
          if (s.none) return s.P === 'e' ? `$|x|\\ge1$: the hypothesis of (e) fails and $x^n$ does not converge to $0$.` : 'Convergence is too slow to certify within the computed range.';
          const extra = { a: `(the proof's choice: ${s.bnote ? `$${s.bnote}$` : ''})`, b: 'The binomial bound squeezes $\\sqrt[n]p$ onto $1$.', c: 'The quadratic binomial term gives the bound $\\sqrt{2/(n-1)}$.', d: 'The polynomial bound eventually decays because $k>\\alpha$.', e: 'Rudin derives (e) from (d) with $\\alpha=0$.' }[s.P];
          return `Within $\\varepsilon=0.05$ of the limit from $n=N=${s.N}$ on. ${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.21
    {
      num: '3.21',
      kind: 'Definition',
      name: 'Series and partial sums',
      statement: String.raw`Given a sequence $\{a_n\}$, write $\sum_{n=p}^{q}a_n=a_p+a_{p+1}+\dots+a_q$ for $p\le q$. The sequence of *partial sums* of $\{a_n\}$ is $s_n=\sum_{k=1}^{n}a_k$, and the formal expression $a_1+a_2+a_3+\cdots$, written $\sum_{n=1}^\infty a_n$, is an *(infinite) series*. If $s_n\to s$, the series *converges* and we write $\sum_{n=1}^\infty a_n=s$; the number $s$ is called the *sum* of the series. If $\{s_n\}$ diverges, the series is said to diverge. Series may also start at $n=0$ or any other index.`,
      idea: String.raw`The "sum" of a series is a limit of partial sums, not the result of infinitely many additions; every statement about series is a statement about the sequence $\{s_n\}$. Conversely every sequence is the sequence of partial sums of a series, with $a_1=s_1$ and $a_n=s_n-s_{n-1}$.`,
      deps: ['pma-3.1'],
      tags: ['series'],
    },
    // ------------------------------------------------------------------ 3.22
    {
      num: '3.22',
      kind: 'Theorem',
      name: 'Cauchy criterion for series',
      statement: String.raw`$\sum a_n$ converges if and only if for every $\eps>0$ there is an integer $N$ such that
$$\Big|\sum_{k=n}^{m}a_k\Big|\le\eps\qquad\text{whenever } m\ge n\ge N .$$`,
      idea: String.raw`A block sum is a difference of partial sums: $\sum_{k=n}^m a_k=s_m-s_{n-1}$. So the condition says exactly that $\{s_n\}$ is a Cauchy sequence, and Cauchy sequences of real or complex numbers converge (3.11(c)).`,
      caption: String.raw`Drag the two gold handles to choose a block $n\le k\le m$. The gold path is the running block sum $\sum_{j=n}^k a_j$, which must stay inside the band $\pm\eps$. The lower panel shows, for each $N$, the worst block that starts at or after $N$; the criterion holds when this falls to $\eps$ or below. For the harmonic series every block $\frac1{n+1}+\dots+\frac1{2n}$ exceeds $\tfrac12$.`,
      deps: ['pma-3.21', 'pma-3.11'],
      see: ['pma-7.8'],
      tags: ['series', 'Cauchy sequences'],
      viz(v) {
        const K = 60, PI2 = Math.PI * Math.PI / 6;
        const sq = new Float64Array(100001); for (let k = 1; k <= 100000; k++) sq[k] = sq[k - 1] + 1 / (k * k);
        const SER = {
          alt: { label: '$\\sum(-1)^{k+1}/k$', a: (k) => (k % 2 ? 1 : -1) / k, worst: (N) => 1 / N },
          sq: { label: '$\\sum 1/k^2$', a: (k) => 1 / (k * k), worst: null },
          harm: { label: '$\\sum 1/k$', a: (k) => 1 / k, worst: () => Infinity },
          osc: { label: '$\\sum(-1)^{k+1}$', a: (k) => (k % 2 ? 1 : -1), worst: () => 1 },
        };
        const which = v.select('', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const eps = v.slider('$\\varepsilon$', 0.01, 0.6, 0.1, { step: 0.005 });
        const T = v.stage({ x: [0, K + 1], y: [-1.1, 1.1], height: 300, axes: 'box', full: true, title: 'terms $a_k$ (bars) and the running block sum (gold) against $k$' });
        const W = v.stage({ x: [0, K + 1], y: [0, 1.2], height: 170, axes: 'box', full: true, title: 'worst block from $N$ on: $\\sup_{m\\ge n\\ge N}\\big|\\sum_{k=n}^m a_k\\big|$ against $N$' });
        const hn = T.handle(12, -1, { color: 'gold', label: 'n', constrain: (x) => [Math.max(1, Math.min(K, Math.round(x))), T.bounds.y[0] + 0.07 * (T.bounds.y[1] - T.bounds.y[0])] });
        const hm = T.handle(31, -1, { color: 'gold', label: 'm', constrain: (x) => [Math.max(1, Math.min(K, Math.round(x))), T.bounds.y[0] + 0.07 * (T.bounds.y[1] - T.bounds.y[0])] });
        let st = {}, last = null;
        v.render(() => {
          const S = SER[which.value], e = eps.value;
          const a = []; for (let k = 1; k <= K; k++) a.push(S.a(k));
          const worst = (N) => (S.worst ? S.worst(N) : PI2 - sq[Math.min(N - 1, 100000)]);
          const ys = a.map(Math.abs); const top = Math.max(1.05, ...ys) * 1.1;
          T.setView(null, [-top, top]);
          if (last !== which.value) { last = which.value; }
          hn.y = hm.y = T.bounds.y[0] + 0.07 * (T.bounds.y[1] - T.bounds.y[0]);
          const n = Math.min(hn.x, hm.x), m = Math.max(hn.x, hm.x);
          T.vband(n - 0.5, m + 0.5, { color: 'gold', alpha: 0.1 });
          T.hband(-e, e, { color: 'accent', alpha: 0.12, edges: true });
          T.bars(a, { color: (x) => (x >= 0 ? 'accent' : 'pink'), fillAlpha: 0.6, barWidth: 0.6 });
          const run = [[n - 0.5, 0]]; let B = 0; for (let k = n; k <= m; k++) { B += a[k - 1]; run.push([k, B]); }
          T.path(run, { color: 'gold', width: 2.4 });
          T.dot(m, B, { color: Math.abs(B) <= e ? 'green' : 'red', r: 5.5 });
          T.tex(`\\textstyle\\sum_{${n}}^{${m}}=${v.fix(B, 3)}`, m, B, { color: Math.abs(B) <= e ? 'green' : 'red', align: 'left', baseline: B >= 0 ? 'bottom' : 'top', dx: 8, dy: B >= 0 ? -4 : 4, size: 13 });
          // worst-block panel
          const ws = []; for (let N = 1; N <= K; N++) ws.push(worst(N));
          const fin = ws.filter(isFinite), wtop = Math.max(e * 1.5, ...(fin.length ? fin : [1])) * 1.12;
          W.setView(null, [0, wtop]);
          let Ne = null; for (let N = 1; N <= 100000; N++) { if (worst(N) <= e) { Ne = N; break; } if (!isFinite(worst(N)) || (S.worst && S.worst(N) === S.worst(N + 1000) && N > 5)) break; }
          W.bars(ws.map((w) => (isFinite(w) ? w : wtop * 0.95)), { color: (w, i) => (!isFinite(ws[i]) ? 'red' : ws[i] <= e ? 'green' : 'orange'), fillAlpha: 0.55, barWidth: 0.7 });
          W.hline(e, { color: 'accent', dash: [6, 4], width: 1.5 });
          W.tex('\\varepsilon', K + 0.8, e, { color: 'accent', align: 'right', baseline: 'bottom', dy: -2 });
          if (!isFinite(ws[0])) W.text('∞ for every N', K / 2, wtop * 0.8, { color: 'red', align: 'center', weight: 600 });
          if (Ne && Ne <= K) { W.vline(Ne - 0.5, { color: 'green', dash: [3, 3] }); W.tex(`N=${Ne}`, Ne - 0.5, wtop, { color: 'green', align: 'left', baseline: 'top', dx: 4, dy: 4, size: 13 }); }
          T.corner(Math.abs(B) <= e ? 'this block is within ε' : 'this block exceeds ε', 'tr', { color: Math.abs(B) <= e ? 'green' : 'red', weight: 600 });
          v.legend([['accent', '$a_k>0$', { area: true }], ['pink', '$a_k<0$', { area: true }], ['gold', 'running block sum from $n$ to $m$'], ['accent', 'band $\\pm\\varepsilon$', { dash: true }]]);
          st = { n, m, B, e, Ne, inf: !isFinite(ws[0]), key: which.value };
        });
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          const head = `$\\sum_{k=${s.n}}^{${s.m}}a_k=s_{${s.m}}-s_{${s.n - 1}}=${v.fix(s.B, 4)}$. `;
          if (s.inf) return head + 'No $N$ works: blocks of any length can be found after any $N$ whose sum exceeds $\\tfrac12$, so the series diverges.';
          if (!s.Ne) return head + 'Single terms already have size $1$: the criterion fails for every $\\varepsilon<1$.';
          return head + `Every block starting at $n\\ge N=${s.Ne}$ has sum at most $\\varepsilon=${v.fix(s.e, 3)}$ — the series converges.`;
        });
      },
    },
  ],
};
