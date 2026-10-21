// Topology — Chapter 4: Compactness, part c (items 4.13–4.18)
import { cantorLevel, CYC, cantorAvoid, stereographicSphere, continuityLocalRadius, continuityUniformRadius, compactnessArrows, compactnessExamples, finiteBisection } from './ch04.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const TAU = 2 * Math.PI;

export default {
  collection: 'top',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Theorem',
      name: 'Uniform continuity theorem',
      statement: String.raw`Let $f\colon X\to Y$ be continuous, where $(X,d_X)$ is a compact metric space and $(Y,d_Y)$ is any metric space. Then $f$ is **uniformly continuous**: for every $\varepsilon>0$ there is one $\delta>0$ such that $d_X(x,x')<\delta$ implies $d_Y(f(x),f(x'))<\varepsilon$ for all $x,x'\in X$.`,
      idea: String.raw`Fix $\varepsilon$. By continuity each $x$ has a ball $B(x,\delta_x)$ mapped into the ball of radius $\varepsilon/2$ around $f(x)$; hence any two points of that ball have images less than $\varepsilon$ apart. These balls form an open cover of $X$, and a Lebesgue number $\delta$ of it (4.12) works for all pairs at once: two points closer than $\delta$ lie in a common ball $B(x,\delta_x)$. The Lebesgue number is obtained from the cover; it need not equal the infimum of arbitrarily chosen local radii.`,
      caption: String.raw`The bottom plot shows local admissible radii found from the exact level equations $|f(y)-f(x)|=\varepsilon$, capped at the domain width. Drag the graph point to see its neighborhood and $\varepsilon$-band. The dashed red line is a uniform guarantee: $\delta=\varepsilon/12$ works for $\sin(3x^2)$ on $[0,2]$ because $|f'|\le12$. For $1/x$ on $[a,1]$ the sharp uniform radius, capped at $1-a$, follows algebraically from the worst pair at $a$. It tends to zero with $a$. On $(0,1]$, the pairs $1/n$ and $1/(n+1)$ get arbitrarily close while their function values differ by $1$, proving failure of uniform continuity.`,
      deps: ['top-4.12'],
      see: ['pma-4.19'],
      refs: ['Munkres (2nd ed.), Theorem 27.6'],
      links: { source: 'https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf' },
      tags: ['compactness', 'uniform continuity'],
      viz(v) {
        const fs = v.select('function', [{ value: 'sin', label: '$\\sin(3x^2)$ on $[0,2]$' }, { value: 'inv', label: '$1/x$ on $[a,1]$' }], 'sin');
        const eps = v.slider('$\\varepsilon$', 0.05, 1.5, 0.4, { step: 0.01 });
        const aa = v.slider('left end $a$', 0.005, 0.5, 0.2, { log: true });
        const G = v.stage({ x: [-0.1, 2.1], y: [-1.4, 1.4], axes: 'box', gutter: true, height: 300, xlabel: '$x$', ylabel: '$f(x)$', full: true });
        const D = v.stage({ x: [-0.1, 2.1], y: [1e-4, 4], ylog: true, axes: 'box', gutter: true, height: 230, xlabel: '$x$', ylabel: '$\\delta(x)$', full: true });
        const f1 = (x) => Math.sin(3 * x * x), f2 = (x) => 1 / x;
        const h = G.handle(1, f1(1), { color: 'gold', r: 7, label: 'x', labelPos: 'n', constrain: (x) => { const [lo, hi] = dom(); const xx = clamp(x, lo, hi); return [xx, (fs.value === 'sin' ? f1 : f2)(xx)]; } });
        const dom = () => (fs.value === 'sin' ? [0, 2] : [aa.value, 1]);
        let cache = { key: '' };
        const compute = () => {
          const [lo, hi] = dom(), f = fs.value === 'sin' ? f1 : f2, N = 420, e = eps.value, key = fs.value + lo + e;
          if (cache.key === key) return cache;
          const P = Array.from({ length: N + 1 }, (_, i) => (fs.value === 'inv' ? lo * Math.pow(hi / lo, i / N) : lo + ((hi - lo) * i) / N)), W = hi - lo;
          const d=P.map(x=>continuityLocalRadius(fs.value,x,e,lo)),uniform=continuityUniformRadius(fs.value,e,lo);
          cache={key,P,d,uniform,lo,hi,f,W};
          return cache;
        };
        let info = null;
        v.render(() => {
          const inv = fs.value === 'inv'; aa.el.hidden = !inv;
          const C = compute(), { P, d, lo, hi, f } = C, e = eps.value;
          const top=inv?1/lo+e:1+e;
          G.setView([lo-.08*(hi-lo),hi+.08*(hi-lo)],inv?[Math.min(0,1-e)-.04*top,1.04*top]:[-top-.1,top+.1]);
          D.setView([lo-.08*(hi-lo),hi+.08*(hi-lo)],[Math.min(1e-3,.7*C.uniform),1.2*Math.max(hi-lo,...d)]);
          G.path(P.map(x=>[x,f(x)]),{color:'ink',width:2.6});
          const x0=clamp(h.x,lo,hi);h.set(x0,f(x0));
          const dx=continuityLocalRadius(fs.value,x0,e,lo);
          G.hband(f(x0) - e, f(x0) + e, { color: 'blue', alpha: 0.12, edges: true });
          G.vband(x0 - dx, x0 + dx, { color: 'orange', alpha: 0.18, edges: true });
          D.path(P.map((x, i) => [x, d[i]]), { color: 'accent', width: 2.8 });
          D.hline(C.uniform, { color: 'red', width: 1.6, dash: [6, 4] });
          D.dot(x0, dx, { r: 6, color: 'gold' });
          info = {dx,uniform:C.uniform,inv,lo};
        });
        v.legend([['blue', '$\\varepsilon$-band around $f(x)$'], ['orange', '$\\delta(x)$-neighbourhood of $x$'], ['red', 'guaranteed uniform radius']]);
        v.readout(() => {
          if (!info) return '';
          const {dx,uniform,inv,lo}=info;
          return `At the gold point the capped local radius is $\\delta(x)\\approx${v.sci(dx,3)}$; the uniform guarantee is $\\delta\\approx${v.sci(uniform,3)}$. ${inv?`For $[${v.fix(lo,3)},1]$, use $\\min(1-a,\\varepsilon a^2/(1-\\varepsilon a))$ when $\\varepsilon<1/a-1$; otherwise the capped radius is $1-a$. As $a\\to0$ with fixed $\\varepsilon$, it tends to zero. On $(0,1]$ the inverse function is not uniformly continuous.`:'The derivative bound gives $\\delta=\\varepsilon/12$ for every pair; it is a guaranteed choice, not a claim of optimality.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num: '4.14',
      kind: 'Theorem',
      name: 'Compact Hausdorff spaces without isolated points are uncountable',
      statement: String.raw`Let $X$ be a nonempty compact Hausdorff space with no isolated points. Then $X$ is uncountable. In particular $[0,1]$, the Cantor set and every nonempty compact subset of $\R$ without isolated points are uncountable.`,
      idea: String.raw`Given a sequence $x_1,x_2,\dots$ in $X$, put $U_0=X$. Choose $y_n\in U_{n-1}$ different from $x_n$; this is possible because $U_{n-1}$ is nonempty and there are no isolated points. Hausdorffness supplies disjoint open neighbourhoods $W_n$ of $y_n$ and $O_n$ of $x_n$. Set $U_n=U_{n-1}\cap W_n$. Then $\overline U_n$ is nonempty, avoids $x_n$ (it lies in the closed set $X\setminus O_n$), and the closures form a nested sequence. Compactness and the finite intersection property (4.9) give a point in $\bigcap_n\overline U_n$. It differs from every $x_n$, so no sequence lists $X$.`,
      caption: String.raw`The space is the Cantor set. A list $x_1,x_2,\dots$ of its points is given (random points, or the endpoints of the removed intervals in order). At step $n$ the current basic interval $I_{n-1}$ splits into two children; the one **not** containing $x_n$ becomes $I_n$. Raise $n$: the intervals nest, the left endpoint of $I_n$ is a Cantor point avoiding the first $n$ listed points. Its ternary prefix is shown; further stages determine the infinite limit. “New list” redraws the random list; the construction works for any list.`,
      deps: ['top-4.9', 'top-4.3'],
      see: ['pma-2.43'],
      refs: ['Munkres (2nd ed.), Theorem 27.7; §27, Exercise 6'],
      links: { source: 'https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf' },
      tags: ['compactness', 'uncountability', 'cantor set'],
      viz(v) {
        const lst = v.select('the list $x_1,x_2,\\dots$', [{ value: 'rand', label: 'random Cantor points' }, { value: 'end', label: 'endpoints of removed intervals' }], 'rand');
        const nn = v.slider('steps $n$', 1, 14, 5, { int: true });
        let seed = 4;
        v.button('New list', () => { seed++; });
        const A = v.stage({ x: [-0.03, 1.03], y: [-0.08, 1.02], axes: false, height: 250, title: 'nested intervals $I_1\\supset I_2\\supset\\cdots$ in the Cantor set' });
        const B = v.stage({ x: [0, 1], y: [-0.5, 1], axes: false, height: 200, title: 'zoom on $I_{n-1}$ and its two children' });
        const lvl = cantorLevel(4);
        const make = () => {
          const R = v.rng(seed), xs = [];
          if (lst.value === 'rand') for (let k = 0; k < 14; k++) { let x = 0; for (let j = 1; j <= 28; j++) x += (R() < 0.5 ? 0 : 2) / 3 ** j; xs.push(x); }
          else { for (let L = 0; L <= 4 && xs.length < 14; L++) for (const [a, b] of cantorLevel(L)) { { for (const e of [a, b]) if (!xs.some((q) => Math.abs(q - e) < 1e-12)) xs.push(e); } } }
          return xs.slice(0, 14);
        };
        let info = null;
        v.render(() => {
          const xs = make(), n = nn.value;
          lvl.forEach(([a, b]) => A.line(a, 0.95, b, 0.95, { color: 'muted', width: 5, cap: 'butt' }));
          const construction=cantorAvoid(xs,n),{lo,hi,bits,intervals:Is}=construction;
          const zoom=construction.steps[n-1];
          Is.forEach(([a, b], k) => { const y = 0.82 - 0.058 * k, col = CYC[k % CYC.length]; A.line(a, y, b, y, { color: col, width: 4, cap: 'butt' }); A.dot(xs[k], y, { r: 0 }); });
          xs.slice(0, n).forEach((x, k) => { const y = 0.82 - 0.058 * k; A.line(x - 0.008, y + 0.02, x + 0.008, y - 0.02, { color: 'red', width: 2 }); A.line(x - 0.008, y - 0.02, x + 0.008, y + 0.02, { color: 'red', width: 2 }); });
          // zoom
          const { lo: zl, hi: zh, left, right, pick, x } = zoom; const w = zh - zl;
          B.setView([zl - 0.04 * w, zh + 0.04 * w], [-0.5, 1]);
          B.line(left[0], 0.55, left[1], 0.55, { color: pick ? 'muted' : 'green', width: 7, cap: 'butt' });
          B.line(right[0], 0.55, right[1], 0.55, { color: pick ? 'green' : 'muted', width: 7, cap: 'butt' });
          B.text('middle third removed', (left[1] + right[0]) / 2, 0.55, { size: 11, color: 'muted', align: 'center', dy: -16 });
          B.text(`$I_{${n - 1}}$`, (zl + zh) / 2, 0.9, { size: 14, color: 'ink' });
          if (x >= zl - 0.04 * w && x <= zh + 0.04 * w) { B.dot(x, 0.55, { r: 6, color: 'red' }); B.text(`$x_{${n}}$`, x, 0.2, { size: 14, color: 'red' }); } else B.text(`$x_{${n}}$ is outside $I_{${n - 1}}$: either child works`, (zl + zh) / 2, 0.15, { size: 11, color: 'red', align: 'center' });
          const y = construction.candidate;
          info = { n, y, bits, miss: xs.slice(0, n).every((q) => Math.abs(q - y) > 1e-12), w: hi - lo };
        });
        v.legend([['muted', 'the Cantor set (level 4)'], ['red', 'the points $x_k$ of the list'], ['green', 'the child kept']]);
        v.readout(() => {
          if (!info) return '';
          return `After $n=${info.n}$ steps $I_n$ has length $3^{-${info.n}}=${v.sci(info.w, 2)}$. The left endpoint $y_n=0.${info.bits.join('')}000\\ldots_3\\approx${v.fix(info.y, 6)}$ is in the Cantor set and avoids $x_1,\\dots,x_{${info.n}}$. Digits $0$/$2$ record left/right. Continuing through every stage gives a limit in $C$ different from each $x_n$: the list is not complete.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.15
    {
      num: '4.15',
      kind: 'Definition',
      name: 'Limit point and sequential compactness',
      statement: String.raw`A space $X$ is **limit point compact** if every infinite subset of $X$ has a limit point in $X$. It is **sequentially compact** if every sequence in $X$ has a subsequence converging to a point of $X$. Compactness implies limit point compactness; in metric spaces all three notions agree (4.16).`,
      idea: String.raw`These are the “compactness by sequences” properties, the ones one uses in analysis: a sequence that wants to accumulate must be able to do so *inside* the space. They fail for three different reasons: the sequence can run off to infinity ($\R$), approach a missing boundary point ($(0,1)$), or simply have no convergent subsequence in the space at all. In $[0,1]$ the bisection argument extracts a convergent subsequence: one of the two halves holds infinitely many terms, keep halving.`,
      caption: String.raw`The picture shows only a finite prefix of each sequence. At each bisection it keeps the closed half containing more displayed terms; gold dots are those still in the current window. This finite majority is not a test for infinitely many terms, and the final window does not identify a subsequence limit. The infinite compact-interval proof instead retains a half with infinitely many terms at every stage. The readout distinguishes that theorem from the finite preview and from the known limits of $1/n$, $1/(n+1)$ and $n$.`,
      deps: ['top-4.1', 'top-1.9'],
      refs: ['Munkres §28'],
      tags: ['compactness', 'sequences'],
      viz(v) {
        const ex = v.select('space and sequence', [
          { value: 'a', label: '$[0,1]$, $x_n=\\tfrac{1+\\sin n}{2}$' },
          { value: 'b', label: '$[0,1]$, $x_n=\\tfrac1n$' },
          { value: 'c', label: '$(0,1)$, $x_n=\\tfrac1{n+1}$' },
          { value: 'd', label: '$\\R$, $x_n=n$' },
        ], 'a');
        const kk = v.slider('bisections $k$', 0, 12, 4, { int: true });
        const s = v.stage({ x: [-0.08, 1.08], y: [-0.2, 1.1], axes: false, height: 360 });
        const E = {
          a: { x: (n) => (1 + Math.sin(n)) / 2, lo: 0, hi: 1, closed: true, view: [-0.08, 1.08], N: 300 },
          b: { x: (n) => 1 / n, lo: 0, hi: 1, closed: true, view: [-0.08, 1.08], N: 300 },
          c: { x: (n) => 1 / (n + 1), lo: 0, hi: 1, closed: false, view: [-0.08, 1.08], N: 300 },
          d: { x: (n) => n, lo: -Infinity, hi: Infinity, closed: true, view: [-30, 560], N: 400, win: [0, 512] },
        };
        let info = null;
        v.render(() => {
          const e = E[ex.value], k = kk.value, N = e.N;
          s.setView(e.view, [-0.2, 1.1]);
          const win = e.win || [0, 1];
          const {I,a,b,wins}=finiteBisection(Array.from({length:N},(_,i)=>e.x(i+1)),k,win);
          s.line(e.win ? 0 : 0, 0, e.win ? e.view[1] : 1, 0, { color: 'ink', width: 4, cap: 'butt', alpha: 0.5 });
          if (!e.closed) s.dot(0, 0, { r: 5, hollow: true, color: 'ink' });
          for (let n = 1; n <= N; n++) { const x = e.x(n); if (x >= e.view[0] && x <= e.view[1]) s.dot(x, 0.12 + 0.5 * (((n * 7) % 23) / 23), { r: 2, color: 'muted', alpha: 0.5 }); }
          I.forEach((n, i) => { if (i < 60) { const x = e.x(n); s.dot(x, 0.12 + 0.5 * (((n * 7) % 23) / 23), { r: 3.4, color: 'gold' }); } });
          wins.forEach(([p, q], t) => { const y = 1.0 - 0.055 * t; s.line(p, y, q, y, { color: CYC[t % CYC.length], width: 4, cap: 'butt' }); });
          info = { cnt:I.length, id:ex.value, k, w:b-a };
        });
        v.legend([['muted', 'terms of the sequence', { dot: true }], ['gold', 'displayed terms in the current window', { dot: true }], ['accent', 'nested windows (one colour per halving)']]);
        v.readout(() => {
          if (!info) return '';
          const {cnt,id,k,w}=info;
          const lead=`After ${k} halvings, the displayed window (width $${v.sci(w,2)}$) contains ${cnt} of the finite prefix's terms. This does not certify an infinite subsequence or its limit.`;
          if(id==='d')return `${lead} Analytically, $x_n=n$ has no convergent subsequence in $\\R$; any bounded neighborhood contains only finitely many terms.`;
          if(id==='c')return `${lead} Analytically, $x_n=1/(n+1)\\to0$, and every subsequence has the same real limit. Since $0\\notin(0,1)$, none converges in this space.`;
          if(id==='b')return `${lead} Analytically, $x_n=1/n\\to0\\in[0,1]$, whether or not this finite search keeps windows near 0.`;
          return `${lead} Compactness of $[0,1]$ guarantees some convergent subsequence. Its proof chooses halves with infinitely many terms, not a majority of a finite sample.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Theorem',
      name: 'In metric spaces the compactness notions agree',
      statement: String.raw`For a metric space $X$ the following are equivalent: (a) $X$ is compact; (b) $X$ is limit point compact; (c) $X$ is sequentially compact. For general topological spaces, (a) implies (b), and (c) implies (b), but no other implication holds.`,
      idea: String.raw`Compactness implies limit point compactness: otherwise the open sets isolating an infinite set's points, together with its open complement, form a cover with no finite subcover. In a metric space, a limit point of an infinite set has infinitely many points in every ball; from an infinite sequence range choose successively larger indices in balls of radii $1/k$. A finite range instead gives a constant subsequence. Conversely, a sequence of distinct points from an infinite set has a convergent subsequence under sequential compactness, giving a limit point (this direction holds in every space). To prove sequential compactness implies compactness in a metric space, do not invoke 4.12: first derive the cover's Lebesgue number directly. If none exists, choose $A_n$ of diameter $<1/n$ lying in no cover member and $x_n\in A_n$. A convergent subsequence $x_{n_k}\to x$, together with an open cover member about $x$, eventually contains all of $A_{n_k}$, a contradiction. Next, failure of total boundedness yields a separated sequence with no convergent subsequence. Finitely many balls of radius $\delta/3$ therefore cover $X$; each has diameter $\le2\delta/3<\delta$ and lies in a cover member.`,
      caption: String.raw`Choose a space. The three boxes light up green or red according to the property; the arrows are the implications. Solid arrows hold in every space; dashed arrows need the space to be metrizable (the chip says whether it is). When an arrow has a true tail and a false head it turns red: that is a counterexample, and it can only occur outside metric spaces: the indiscrete-pair example is limit point compact but not sequentially compact; the ordinal space $[0,\omega_1)$ is limit point compact and sequentially compact but not compact, and $[0,1]^{[0,1]}$ is compact but not sequentially compact.`,
      deps: ['top-4.15', 'top-4.12'],
      see: ['pma-2.37'],
      refs: ['Munkres (2nd ed.), Theorems 28.1–28.2 and Examples 1–3; Theorem 37.3'],
      links: { source: 'https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf' },
      tags: ['compactness', 'metric spaces'],
      viz(v) {
        const EX=compactnessExamples;
        const sel = v.select('space', Object.entries(EX).map(([k, e]) => ({ value: k, label: e.name })), 'I');
        const s = v.stage({ x: [-3, 3], y: [-1.7, 1.7], equal: true, axes: false, height: 340 });
        const box = { LP: [0, 1.0], C: [-1.8, -0.9], S: [1.8, -0.9] };
        const full = { LP: 'limit point compact', C: 'compact', S: 'sequentially compact' };
        let info = null;
        v.render(() => {
          const e = EX[sel.value], val = { LP: e.l, C: e.c, S: e.q };
          for (const k of ['LP', 'C', 'S']) {
            const [x, y] = box[k], ok = val[k];
            s.rect(x - 0.95, y - 0.32, x + 0.95, y + 0.32, { fill: ok ? 'green' : 'red', fillAlpha: 0.22, color: ok ? 'green' : 'red', width: 2.2, radius: 8 });
            s.text(full[k] + (ok ? '  ✓' : '  ✗'), x, y, { size: 12.5, color: 'ink', align: 'center' });
          }
          const arrows=compactnessArrows;
          const bad = [];
          arrows.forEach(([f, t, always], i) => {
            const [x1, y1] = box[f], [x2, y2] = box[t], off = 0.22, side = 1;
            const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = (-dy / L) * off * side, ny = (dx / L) * off * side;
            const sx = x1 + dx * 0.34 + nx, sy = y1 + dy * 0.34 + ny, ex = x1 + dx * 0.66 + nx, ey = y1 + dy * 0.66 + ny;
            const violated = val[f] && !val[t];
            s.arrow(sx, sy, ex, ey, { color: violated ? 'red' : always || e.m ? 'ink' : 'muted', width: violated ? 3.4 : 2, dash: !always && !violated, alpha: always || e.m || violated ? 1 : 0.6 });
            if (violated) bad.push(`${full[f]} but not ${full[t]}`);
          });
          s.text(e.m ? 'metrizable: all three agree' : 'not metrizable', 0, -1.55, { size: 12.5, color: e.m ? 'green' : 'orange', align: 'center' });
          s.text('solid: true in every space · dashed: needs a metric', 0, 1.6, { size: 11, color: 'muted', align: 'center' });
          info = { e, bad };
        });
        v.readout(() => (info ? `${info.e.name}: ${info.e.why}${info.bad.length ? ` **Counterexample to a dashed arrow** (${info.bad.join('; ')}), possible only because the space is not metrizable.` : ''}` : ''));
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Definition',
      name: 'Local compactness',
      statement: String.raw`A space $X$ is **locally compact** if every point has a neighbourhood contained in a compact subset: for each $x$ there are an open $U\ni x$ and a compact $K$ with $U\subset K$. For Hausdorff spaces this is equivalent to: every point has a neighbourhood basis of open sets with compact closure.`,
      idea: String.raw`Compact spaces are locally compact, and so are $\R^n$ (closed balls), every discrete space and every manifold. Local compactness is not hereditary and not the same as compactness of balls: $\Q$ fails it, because a compact subset of $\Q$ is closed and bounded in $\R$ and so cannot contain a whole interval of rationals, which has irrational limit points. $\R^\omega$ fails it because a basic neighbourhood leaves all but finitely many coordinates free, so its closure projects onto all of $\R$ in some coordinate.`,
      caption: String.raw`Drag $p$ and choose the neighbourhood size $s$. In $\R$ the closed interval $[p-s,p+s]$ is compact and contains the neighbourhood. In $\Q$ any set containing the neighbourhood contains a sequence of rationals (gold, decimal truncations of an irrational $\alpha$) whose limit $\alpha$ is missing from $\Q$, so no compact set contains it. For $\R^\omega$ the picture shows the coordinates: a basic neighbourhood restricts the first $k$ coordinates to $(-r,r)$ and leaves the rest completely free.`,
      deps: ['top-4.1'],
      refs: ['Munkres §29'],
      tags: ['compactness', 'local'],
      viz(v) {
        const sp = v.select('space', [{ value: 'R', label: '$\\R$' }, { value: 'Q', label: '$\\Q$' }, { value: 'W', label: '$\\R^\\omega$' }], 'R');
        const ss = v.slider('neighbourhood size $s$', 0.1, 1.2, 0.5, { step: 0.05 });
        const nn = v.slider('terms $q_1,\\dots,q_n$', 1, 8, 4, { int: true });
        const kk = v.slider('restricted coordinates $k$', 1, 7, 3, { int: true });
        const L = v.stage({ x: [-3, 3], y: [-1.2, 1.2], axes: false, height: 260, title: 'the line' });
        const W = v.stage({ x: [0.3, 10.7], y: [-4, 3.5], axes: false, height: 320, title: 'coordinates of $\\R^\\omega$' });
        const hp = L.handle(0.5, 0, { color: 'gold', r: 7, label: 'p', labelPos: 'n', constrain: (x) => [Math.round(clamp(x, -2.2, 2.2) * 50) / 50, 0] });
        let info = null;
        v.render(() => {
          const m = sp.value, s = ss.value, p = hp.x;
          L.el.style.display = m === 'W' ? 'none' : ''; W.el.style.display = m === 'W' ? '' : 'none';
          nn.el.hidden = m !== 'Q'; kk.el.hidden = m !== 'W'; hp.visible = m !== 'W';
          if (m === 'R') {
            L.line(-3, 0, 3, 0, { color: 'muted', width: 2 });
            L.interval(p - s, p + s, 0, { color: 'blue', width: 10, r: 6, alpha: 0.5 });
            L.interval(p - s, p + s, 0.0, { color: 'accent', width: 4, r: 3, open: [true, true] });
            L.text('$K=[p-s,p+s]$ compact', p, -0.55, { size: 13, color: 'blue', align: 'center' });
            L.text('$U=(p-s,p+s)$', p, 0.5, { size: 13, color: 'accent', align: 'center' });
            info = { m };
          } else if (m === 'Q') {
            L.line(-3, 0, 3, 0, { color: 'faint', width: 1 });
            for (let q = 1; q <= 24; q++) for (let a = -q * 3; a <= q * 3; a++) if (Math.abs(a / q) <= 3 && q <= 18 && gcd(Math.abs(a), q) === 1 && q > 0 && q * 0 === 0) L.dot(a / q, 0, { r: 1.2, color: 'muted', alpha: 0.35 });
            const alpha = p + s * (Math.SQRT2 - 1);
            L.interval(p - s, p + s, 0, { color: 'accent', width: 3, r: 3, open: [true, true], alpha: 0.8 });
            const qs = []; for (let n = 1; n <= nn.value; n++) { const q = Math.round(alpha * 10 ** n) / 10 ** n; qs.push(q); L.dot(q, 0.2 + 0.1 * n, { r: 4.5, color: 'gold' }); L.line(q, 0.0, q, 0.2 + 0.1 * n, { color: 'gold', width: 1, alpha: 0.5 }); }
            L.dot(alpha, 0, { r: 7, hollow: true, color: 'red' });
            L.text('$\\alpha\\notin\\Q$', alpha, -0.55, { size: 14, color: 'red', align: 'center' });
            info = { m, alpha, q: qs[qs.length - 1], n: nn.value };
          } else {
            const k = kk.value, r = 1.2;
            for (let i = 1; i <= 10; i++) {
              if (i <= k) { W.line(i, -r, i, r, { color: 'blue', width: 10, cap: 'butt', alpha: 0.6 }); W.dot(i, -r, { r: 3, hollow: true, color: 'blue' }); W.dot(i, r, { r: 3, hollow: true, color: 'blue' }); }
              else { W.line(i, -3.1, i, 3.1, { color: 'orange', width: 10, cap: 'butt', alpha: 0.45 }); W.arrow(i, 2.7, i, 3.3, { color: 'orange', width: 2 }); W.arrow(i, -2.7, i, -3.3, { color: 'orange', width: 2 }); }
              W.text(`$x_{${i}}$`, i, -3.7, { size: 12, color: 'muted', align: 'center' });
            }
            W.text('· · ·', 10.45, 0, { size: 18, color: 'orange' });
            info = { m, k };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (info.m === 'R') return 'Every point of $\\R$ has such a neighbourhood: $U\\subset K$ with $K$ closed and bounded, hence compact. $\\R$ is **locally compact** (like every $\\R^n$, every manifold, every discrete space).';
          if (info.m === 'Q') return `$q_n$ = $\\alpha$ truncated to $n$ decimals, a rational in $U$; the last, $q_{${info.n}}=${v.fix(info.q, info.n)}$, is within $10^{-${info.n}}$ of the irrational $\\alpha=${v.fix(info.alpha, 5)}$. A compact $K\\supset U$ would contain a limit point of this sequence, but the only candidate is $\\alpha\\notin\\Q$. So no neighbourhood of any point of $\\Q$ lies in a compact set: $\\Q$ is **not locally compact**.`;
          return `A basic neighbourhood (blue) restricts the first ${info.k} coordinates to a bounded interval and leaves every later coordinate free (orange, all of $\\R$). Any $K\\supset U$ projects onto all of $\\R$ in coordinate $${info.k + 1}$, but a continuous image of a compact set is compact (4.4) and $\\R$ is not: $\\R^\\omega$ is **not locally compact**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Theorem',
      name: 'One-point compactification',
      statement: String.raw`Let $X$ be a locally compact Hausdorff space that is not compact. Adding one point $\infty$ and declaring the open sets to be the open sets of $X$ together with the sets $\{\infty\}\cup(X\setminus K)$, $K\subset X$ compact, gives a compact Hausdorff space $X^+$ containing $X$ as an open dense subspace. It is unique up to a homeomorphism restricting to the identity on $X$. For $X=\R^n$ with $n\ge1$ it is the sphere $S^n$, and $\C^+=\C\cup\{\infty\}$ is the Riemann sphere.`,
      idea: String.raw`A cover of $X^+$ contains a set $V\ni\infty$, whose complement $K$ in $X^+$ is a compact subset of $X$; finitely many other members cover $K$, so $X^+$ is compact. Local compactness is what makes the points of $X$ separable from $\infty$: a point $x$ has a neighbourhood with compact closure $\overline U$, and $U$ and $X^+\setminus\overline U$ are disjoint open neighbourhoods of $x$ and $\infty$. For the plane, stereographic projection (2.5) is exactly the homeomorphism of $\R^2{}^+$ with the sphere, sending $\infty$ to the north pole.`,
      caption: String.raw`The plane (left) is wrapped onto the sphere by stereographic projection; $\infty$ is the north pole. Choose a compact disc $K=\{|z|\le R\}$: the shaded green outside is a basic neighbourhood of $\infty$, which on the sphere is a cap around the pole. Increase the number of terms of a sequence that leaves every disc: its images creep up the sphere and converge to the pole. Drag the sphere to rotate it.`,
      deps: ['top-4.17', 'top-4.3'],
      see: ['rca-13.1'],
      refs: ['Munkres (2nd ed.), Theorems 29.1–29.2 and Example 4'],
      links: { source: 'https://raw.githubusercontent.com/enilsen16/The-Math-Group/master/Munkres-Topology.pdf' },
      tags: ['compactness', 'compactification'],
      viz(v) {
        const seq = v.select('sequence $z_n$', [{ value: 'out', label: '$z_n=\\tfrac n4e^{in}$ (leaves every disc)' }, { value: 'in', label: '$z_n=\\tfrac3n e^{in}$ (tends to $0$)' }], 'out');
        const R = v.slider('radius $R$ of the compact disc', 0.5, 4, 1.5, { step: 0.05 });
        const nn = v.slider('terms $n$', 1, 40, 18, { int: true });
        const P = v.stage({ x: [-4.5, 4.5], y: [-4.5, 4.5], equal: true, axes: true, height: 380, title: 'the plane $\\C$' });
        const S = v.stage3d({ range: 1.25, height: 380, yaw: 0.8, pitch: 0.3, axes: false, title: 'the sphere $\\C\\cup\\{\\infty\\}$', labels: ['', '', ''] });
        const sph = stereographicSphere;
        const z = (n) => (seq.value === 'out' ? [(n / 4) * Math.cos(n), (n / 4) * Math.sin(n)] : [(3 / n) * Math.cos(n), (3 / n) * Math.sin(n)]);
        let info = null;
        v.render(() => {
          const r = R.value, n = nn.value;
          const extent=Math.max(4.5,1.15*Math.max(r,seq.value==='out'?n/4:3));
          P.setView([-extent,extent],[-extent,extent]);
          P.rings([[[-12, -12], [12, -12], [12, 12], [-12, 12]], Array.from({ length: 80 }, (_, i) => [r * Math.cos((TAU * i) / 80), r * Math.sin((TAU * i) / 80)])], { evenodd: true, fill: 'green', fillAlpha: 0.14, stroke: false });
          P.circle(0, 0, r, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 2 });
          P.text('$K$', 0, 0.3 * r, { size: 16, color: 'blue' }); P.text('green: neighbourhood of $\\infty$', 0, -0.91*extent, { size: 12, color: 'green', align: 'center' });
          S.surface((u, w) => [Math.sin(u) * Math.cos(w), Math.sin(u) * Math.sin(w), Math.cos(u)], [0, Math.PI], [0, TAU], { n: 26, alpha: 0.2, color: 'accent', wire: true });
          S.surface((u,w)=>[Math.sin(u)*Math.cos(w),Math.sin(u)*Math.sin(w),Math.cos(u)],[0,2*Math.atan(1/r)],[0,TAU],{n:20,alpha:0.18,color:'green',wire:false});
          const ring = Array.from({ length: 90 }, (_, i) => sph(r * Math.cos((TAU * i) / 90), r * Math.sin((TAU * i) / 90)));
          S.path(ring, { color: 'green', width: 3, close: true });
          for (let i = 0; i < 12; i++) S.line(sph(r * Math.cos((TAU * i) / 12), r * Math.sin((TAU * i) / 12)), [0, 0, 1], { color: 'green', width: 1, alpha: 0.5 });
          S.dot([0, 0, 1], { r: 6, color: 'red', label: '∞' });
          let out = 0;
          for (let k = 1; k <= n; k++) {
            const [a, b] = z(k), q = Math.hypot(a, b), col = q > r ? 'orange' : 'blue';
            if (q > r) out++;
            S.dot(sph(a, b), { r: k === n ? 5 : 3, color: k === n ? 'gold' : col });
            P.dot(a, b, { r: k === n ? 6 : 3.5, color: k === n ? 'gold' : col });
          }
          const [a, b] = z(n), q = Math.hypot(a, b);
          info = { out, n, chord: 2 / Math.sqrt(1 + q * q), q };
        });
        v.legend([['blue', 'term inside $K$', { dot: true }], ['orange', 'term outside $K$', { dot: true }], ['green', 'neighbourhood of $\\infty$']]);
        v.readout(() => {
          if (!info) return '';
          const lead = `Terms outside the disc $|z|\\le R$: **${info.out}** of ${info.n}. The last term has $|z_n|=${v.fix(info.q, 2)}$ and Euclidean chord distance on the unit sphere $2/\\sqrt{1+|z|^2}=${v.fix(info.chord, 3)}$ from the pole.`;
          return seq.value === 'out' ? `${lead} Every compact disc contains only finitely many terms, so the sequence lies eventually in every neighbourhood of $\\infty$: $z_n\\to\\infty$ in $\\C^+$.` : `${lead} This sequence stays near $0$ and does not approach $\\infty$ at all.`;
        });
      },
    },
  ],
};

function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
