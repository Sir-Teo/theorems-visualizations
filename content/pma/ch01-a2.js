// Rudin, Principles of Mathematical Analysis — Chapter 1 (part 2): ordered fields, the real field, roots, extended reals

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
function niceStep(span, n = 8) { const raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; }
function tickText(t, step) { const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9)); return (Math.abs(t) < step * 1e-6 ? 0 : t).toFixed(Math.min(d, 8)).replace('-', '−'); }
/** Horizontal number line at height y with ticks every `step` (auto if omitted). */
function numberLine(s, y, o = {}) {
  const [a, b] = s.bounds.x, step = o.step ?? niceStep(b - a, o.n ?? 8), k = (s.bounds.y[1] - s.bounds.y[0]) / s.height;
  s.line(a, y, b, y, { color: o.color || 'faint', width: 1.3 });
  for (let t = Math.ceil((a + 1e-12) / step) * step; t <= b - 1e-12; t += step) {
    s.line(t, y - 4 * k, t, y + 4 * k, { color: 'faint', width: 1.2 });
    if (o.labels !== false) s.text(tickText(t, step), t, y, { dy: o.below === false ? -12 : 13, align: 'center', color: 'muted', size: 10.5 });
  }
}

export default {
  collection: 'pma',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.17
    {
      num: '1.17',
      kind: 'Definition',
      name: 'Ordered field',
      statement: String.raw`An **ordered field** is a field $F$ that is also an ordered set, the two structures being linked by:
(i) if $y<z$, then $x+y<x+z$ for every $x\in F$;
(ii) if $x>0$ and $y>0$, then $xy>0$.
Elements with $x>0$ are called **positive**, those with $x<0$ **negative**.`,
      idea: String.raw`The order has to cooperate with the arithmetic: translating preserves order, and positive elements are closed under multiplication. $\Q$ is an ordered field; $\Z_p$ and $\C$ are fields that admit no such order — in $\C$, for instance, $i^2=-1$ would have to be positive by 1.18(d).`,
      deps: ['pma-1.12', 'pma-1.5'],
      tags: ['field', 'order'],
    },

    // ------------------------------------------------------------------ 1.18
    {
      num: '1.18',
      kind: 'Proposition',
      name: 'Rules for inequalities in an ordered field',
      statement: String.raw`In every ordered field:
(a) $x>0$ exactly when $-x<0$;
(b) if $x>0$ and $y<z$, then $xy<xz$;
(c) if $x<0$ and $y<z$, then $xy>xz$;
(d) if $x\neq0$, then $x^2>0$ — in particular $1>0$;
(e) if $0<x<y$, then $0<1/y<1/x$.`,
      idea: String.raw`(a) If $x>0$, adding $-x$ to both sides (axiom (i) of 1.17) gives $0>-x$; the converse is the same. (b) $z-y>0$, so $x(z-y)>0$ by axiom (ii), i.e. $xz>xy$. (c) Apply (b) to $-x>0$ and use $(-x)y=-(xy)$ from 1.16. (d) For $x>0$ use axiom (ii); for $x<0$ note $x^2=(-x)^2$ by 1.16(d). (e) A positive $y$ cannot have a reciprocal $\le0$, since then $y\cdot(1/y)\le0<1$; multiplying $x<y$ by the positive number $(1/x)(1/y)$ gives $1/y<1/x$.`,
      caption: String.raw`Each connector joins $t$ on the upper line to its image on the lower line; the green rays mark the positive elements. Drag $y<z$ and choose a map. Multiplying by $c>0$ never makes connectors cross — order is preserved (b); $c<0$ makes every pair cross (c). Negation swaps the two halves (a), squaring sends every $t\neq0$ into the green ray (d), and $t\mapsto1/t$ reverses order on the positives (e).`,
      deps: ['pma-1.17', 'pma-1.14', 'pma-1.16'],
      tags: ['order', 'inequalities'],
      viz(v) {
        const MAPS = {
          mul: { label: '$t\\mapsto ct$', f: (t, c) => c * t, dom: [-3, 3], img: (a) => `c${a}` },
          neg: { label: '$t\\mapsto -t$', f: (t) => -t, dom: [-3, 3], img: (a) => `-${a}` },
          sq: { label: '$t\\mapsto t^2$', f: (t) => t * t, dom: [-1.72, 1.72], img: (a) => `${a}^2` },
          rec: { label: '$t\\mapsto 1/t$, $t>0$', f: (t) => 1 / t, dom: [0.34, 3], img: (a) => `1/${a}` },
        };
        const which = v.select('map', Object.entries(MAPS).map(([value, m]) => ({ value, label: m.label })), 'mul');
        const cS = v.slider('$c$ (for $t\\mapsto ct$)', -2, 2, 1.5, { step: 0.05 });
        const s = v.stage({ x: [-3.3, 3.3], y: [-0.42, 1.42], height: 300, axes: false });
        const YT = 1, YB = 0;
        const cons = (x) => { const D = MAPS[which.value].dom; return [v.M.clamp(x, D[0], D[1]), YT]; };
        const h1 = s.handle(0.6, YT, { constrain: cons }), h2 = s.handle(1.7, YT, { constrain: cons });
        let st = {};
        v.render(() => {
          const F = MAPS[which.value], c = cS.value, f = (t) => F.f(t, c), [x0, x1] = s.bounds.x;
          for (const h of [h1, h2]) { const p = cons(h.x); h.x = p[0]; }
          // positive rays
          s.line(0, YT, x1, YT, { color: 'green', width: 6, alpha: 0.25, cap: 'butt' });
          s.line(0, YB, x1, YB, { color: 'green', width: 6, alpha: 0.25, cap: 'butt' });
          numberLine(s, YT, { step: 1, below: false }); numberLine(s, YB, { step: 1 });
          s.text('t', x0 + 0.08, YT, { dy: 16, math: true, color: 'muted' });
          s.text('image', x0 + 0.08, YB, { dy: -14, color: 'muted', size: 11 });
          // fan of connectors
          const [d0, d1] = F.dom;
          for (let i = 0; i <= 30; i++) { const t = d0 + (d1 - d0) * i / 30, u = f(t); if (Math.abs(u) < 8) s.line(t, YT, u, YB, { color: 'faint', width: 1, alpha: 0.7 }); }
          const [lo, hi] = h1.x <= h2.x ? [h1, h2] : [h2, h1];
          lo.color = 'accent'; hi.color = 'orange';
          const fy = f(lo.x), fz = f(hi.x);
          s.line(lo.x, YT, fy, YB, { color: 'accent', width: 2.6 });
          s.line(hi.x, YT, fz, YB, { color: 'orange', width: 2.6 });
          s.dot(fy, YB, { color: 'accent', r: 5 }); s.dot(fz, YB, { color: 'orange', r: 5 });
          s.tex('y', lo.x, YT, { dy: -34, color: 'accent' }); s.tex('z', hi.x, YT, { dy: -34, color: 'orange' });
          const close = Math.abs(fy - fz) < 0.45;
          s.tex(F.img('y'), fy, YB, { dy: 28, dx: close ? (fy <= fz ? -12 : 12) : 0, color: 'accent', size: 14 });
          s.tex(F.img('z'), fz, YB, { dy: 28, dx: close ? (fz < fy ? -12 : 12) : 0, color: 'orange', size: 14 });
          const sgn = Math.sign(fz - fy) * Math.sign(hi.x - lo.x);
          if (sgn < 0) { // crossing point of the two highlighted connectors
            const t = (lo.x - fy) / ((lo.x - fy) - (hi.x - fz)); s.dot(lo.x + (hi.x - lo.x) * t, YT + (YB - YT) * t, { color: 'red', r: 5 });
          }
          s.corner(sgn > 0 ? 'order preserved' : sgn < 0 ? 'order reversed' : 'images coincide', 'tr', { color: sgn > 0 ? 'green' : sgn < 0 ? 'red' : 'muted', weight: 600 });
          st = { y: lo.x, z: hi.x, fy, fz, sgn, c };
          v.legend([['green', 'positive elements', { area: true }], ['accent', '$y\\mapsto$ image'], ['orange', '$z\\mapsto$ image'], ['red', 'crossing = reversal', { dot: true }]]);
        });
        v.readout(() => {
          const { y, z, fy, fz, c } = st, f = (t) => v.fix(t, 2), w = which.value;
          const head = `$y = ${f(y)} < z = ${f(z)}$; images $${f(fy)}$ and $${f(fz)}$. `;
          if (w === 'mul') return head + (c > 0 ? `Since $c = ${f(c)} > 0$: $cy < cz$ — part (b).` : c < 0 ? `Since $c = ${f(c)} < 0$: $cy > cz$ — part (c).` : '$c = 0$ sends everything to $0$; that is why (b) and (c) need $c\\neq0$.');
          if (w === 'neg') return head + 'Negation reverses order and exchanges positives with negatives — part (a).';
          if (w === 'sq') return head + 'Every nonzero square lies in the positive ray — part (d); in particular $1 = 1^2 > 0$.';
          return head + 'On positive elements $t\\mapsto 1/t$ reverses order and stays positive: $0 < 1/z < 1/y$ — part (e).';
        });
      },
    },

    // ------------------------------------------------------------------ 1.19
    {
      num: '1.19',
      kind: 'Theorem',
      name: 'Existence of the real field',
      credit: 'Dedekind, 1872',
      statement: String.raw`There exists an ordered field $\R$ which has the least-upper-bound property. Moreover, $\R$ contains $\Q$ as a subfield. The elements of $\R$ are called **real numbers**.`,
      idea: String.raw`The appendix to Chapter 1 builds $\R$ out of **Dedekind cuts**: subsets $\alpha\subset\Q$ that are neither empty nor all of $\Q$, contain every rational smaller than one of their members, and have no largest member. Cuts are ordered by inclusion, and the least-upper-bound property comes almost for free: the union of a nonempty family of cuts that is bounded above is again a cut, and it is the least upper bound of the family. Addition is $\alpha+\beta=\{r+s: r\in\alpha,\ s\in\beta\}$, multiplication is defined first for positive cuts and then by sign rules, the field and order axioms are verified one by one, and $r\mapsto r^*=\{p\in\Q:p<r\}$ embeds $\Q$ as an ordered subfield.`,
      caption: String.raw`Each bar is a cut — all rationals left of its open right end. The family $A$ consists of the cuts of the decimal truncations of the target (the first few are drawn). Their union $\gamma$ (green) is again a cut, and it is $\sup A$. Drag the rational cut $\beta$: it is an upper bound of $A$ exactly when it contains $\gamma$. Magnify to watch the members of $A$ creep up on the target; for √2 the union has no rational endpoint — it is a new number.`,
      deps: ['pma-1.17', 'pma-1.10', 'pma-1.12'],
      tags: ['real numbers', 'completeness', 'Dedekind cuts'],
      viz(v) {
        const TGT = { r2: { label: '$\\sqrt2$', val: Math.SQRT2, tex: '\\sqrt2', rational: false }, third: { label: '$1/3$', val: 1 / 3, tex: '\\tfrac13', rational: true } };
        const which = v.select('target', Object.entries(TGT).map(([value, T]) => ({ value, label: T.label })), 'r2');
        const K = v.slider('cuts of $A$ shown', 1, 7, 4, { int: true });
        const zoom = v.slider('magnification', 1, 30000, 1, { log: true, fmt: (z) => `×${z < 10 ? z.toFixed(1) : Math.round(z)}` });
        const s = v.stage({ x: [0, 2.7], y: [-7, 1], height: 400, axes: false });
        let rowB = -5.4;
        const bH = s.handle(1.8, rowB, { color: 'red', constrain: (x) => [x, rowB] });
        let st = {}, lastView = '';
        v.render(() => {
          const T = TGT[which.value], k = K.value, Z = zoom.value;
          const w = 1.35 / Z, c = T.val;
          if (lastView !== which.value + '|' + Z) { lastView = which.value + '|' + Z; bH.x = c + 0.35 * w; }
          const rows = k, yG = -rows - 0.35; rowB = yG - 1.1; const yQ = rowB - 1.25;
          s.setView([c - w, c + w], [yQ - 0.6, 0.85]);
          const [x0, x1] = s.bounds.x;
          bH.y = rowB; bH.x = v.M.clamp(bH.x, x0 + 0.02 * w, x1 - 0.02 * w);
          const ds = v.M.range(k).map((i) => Math.floor(c * 10 ** i + 1e-9) / 10 ** i);
          const q = bH.x;
          let firstOut = -1;
          ds.forEach((d, i) => {
            const y = -i, inside = d <= q;
            if (!inside && firstOut < 0) firstOut = i;
            const col = inside ? 'accent' : 'red';
            if (d > x0) {
              s.line(x0, y, Math.min(d, x1), y, { color: col, width: 7, cap: 'butt', alpha: 0.85 });
              if (d < x1) { s.dot(d, y, { hollow: true, color: col, r: 5, width: 2 }); s.tex(`${d.toFixed(i)}^*`, d, y, { dx: 10, align: 'left', size: 13, color: col }); }
            } else s.text(`${d.toFixed(i)}* lies left of the window`, x0 + 0.02 * w, y, { color: 'muted', size: 11 });
          });
          // union γ
          s.line(x0, yG, c, yG, { color: 'green', width: 9, cap: 'butt' });
          s.dot(c, yG, { hollow: true, color: 'green', r: 6, width: 2.2 });
          s.tex(T.rational ? '\\gamma=\\bigcup A=(\\tfrac13)^*' : '\\gamma=\\bigcup A', c, yG, { dx: 11, align: 'left', size: 14, color: 'green' });
          s.vline(c, { color: 'green', width: 1, dash: [3, 4], alpha: 0.7 });
          // β = q*
          const ub = q >= c - 1e-15;
          s.line(x0, rowB, q, rowB, { color: ub ? 'teal' : 'red', width: 7, cap: 'butt', alpha: 0.85 });
          const lft = q > x1 - 0.25 * (x1 - x0);
          s.tex('\\beta=q^*', q, rowB, { dx: lft ? -12 : 12, dy: -12, align: lft ? 'right' : 'left', size: 13, color: ub ? 'teal' : 'red' });
          bH.color = ub ? 'teal' : 'red';
          // rational dots of γ
          const W = x1 - x0, D = Math.round(v.M.clamp(Math.sqrt(500 / W), 6, 2e5));
          const inG = [], out = [];
          for (let n = 1; n <= D && inG.length + out.length < 3000; n++) for (let m = Math.ceil(x0 * n); m <= Math.floor(x1 * n); m++) if (gcd(m, n) === 1) (m / n < c ? inG : out).push([m / n, yQ]);
          s.line(x0, yQ, x1, yQ, { color: 'faint', width: 1 });
          s.dots(out, { r: 2.2, color: 'faint' }); s.dots(inG, { r: 2.2, color: 'green' });
          s.text('ℚ', x0 + 0.01 * W, yQ, { dy: -12, color: 'muted', size: 12, weight: 600 });
          s.text('A', x0 + 0.01 * W, 0, { dy: -14, color: 'accent', size: 12, weight: 700 });
          s.corner(`window [${v.fmt(x0, 7)}, ${v.fmt(x1, 7)}]`, 'br', { size: 11 });
          st = { q, ub, firstOut, ds };
          v.legend([['accent', 'cuts in $A$ inside $\\beta$'], ['red', 'not contained in $\\beta$'], ['green', '$\\gamma=\\bigcup A=\\sup A$'], ['teal', '$\\beta$, an upper bound of $A$']]);
        });
        v.readout(() => {
          const T = TGT[which.value], { q, ub, firstOut, ds } = st;
          const head = `$\\beta = q^*$ with $q \\approx ${v.fmt(q, 8)}$: `;
          const tail = T.rational ? ' Here $\\gamma = (1/3)^*$ is a rational cut: the supremum already existed in $\\Q$.' : ' Here $\\gamma$ is not of the form $r^*$ for any rational $r$ — its "endpoint" $\\sqrt2$ is exactly the gap of Example 1.1.';
          if (ub) return head + 'every cut of $A$ is contained in $\\beta$, so $\\beta$ is an upper bound — and indeed $\\gamma\\subset\\beta$.' + tail;
          return head + (firstOut >= 0 ? `the cut $${ds[firstOut].toFixed(firstOut)}^*$ is not inside $\\beta$` : 'a later truncation (increase the number shown, or magnify) escapes $\\beta$') + ', so $\\beta$ is not an upper bound of $A$.' + tail;
        });
      },
    },

    // ------------------------------------------------------------------ 1.20
    {
      num: '1.20',
      kind: 'Theorem',
      name: 'Archimedean property; density of ℚ',
      credit: 'Archimedes, c. 225 BCE',
      statement: String.raw`(a) If $x,y\in\R$ and $x>0$, there is a positive integer $n$ with $nx>y$ (the **Archimedean property**).
(b) If $x,y\in\R$ and $x<y$, there is a $p\in\Q$ with $x<p<y$ ($\Q$ is **dense** in $\R$).`,
      idea: String.raw`(a) Otherwise $y$ bounds $A=\{nx: n=1,2,\dots\}$ from above, so $\alpha=\sup A$ exists by the least-upper-bound property. As $x>0$, $\alpha-x$ is not an upper bound: $\alpha-x<mx$ for some $m$. But then $\alpha<(m+1)x\in A$, which is absurd. (b) By (a) pick $n$ with $n(y-x)>1$; by (a) again there are integers below and above $nx$, so some integer $m$ has $m-1\le nx<m$. Then $nx<m\le 1+nx<ny$, and $p=m/n$ lies strictly between $x$ and $y$.`,
      caption: String.raw`Top (a): starting at $0$, jump by $x$ until you pass $y$ — however small the step, finitely many jumps suffice. Bottom (b): a zoom on a short interval $(x,y)$. The ticks are the multiples of $1/n$, with $n$ the first integer for which $n(y-x)>1$; their spacing is less than the gap, so the first tick past $x$, namely $p=m/n$ (green), falls inside.`,
      deps: ['pma-1.19', 'pma-1.8'],
      tags: ['real numbers', 'rationals'],
      viz(v) {
        const xS = v.slider('(a) step $x$', 0.02, 3, 0.7, { log: true, decimals: 3 });
        const yS = v.slider('(a) target $y$', 0.5, 10, 6.3, { step: 0.05 });
        const aS = v.slider('(b) left end $x$', 0, 2, 0.7071, { step: 0.0001, decimals: 4 });
        const gS = v.slider('(b) gap $y-x$', 0.0002, 0.5, 0.012, { log: true, decimals: 4 });
        const A = v.stage({ x: [0, 7], y: [-0.55, 1.05], height: 190, axes: false, full: true, title: '(a) multiples $x, 2x, 3x, \\dots$ eventually pass $y$' });
        const B = v.stage({ x: [0.6, 0.8], y: [-0.7, 0.9], height: 190, axes: false, full: true, title: '(b) the grid $\\tfrac1n\\Z$ cannot jump over $(x,y)$' });
        let st = {};
        v.render(() => {
          // ---------- (a)
          const x = xS.value, y = yS.value, n = Math.floor(y / x) + 1;
          const R = Math.max(y, n * x) * 1.06;
          A.setView([-R * 0.02, R], null);
          numberLine(A, 0);
          A.vline(y, { color: 'red', width: 1.5, dash: [5, 4] });
          A.tex('y', y, 0.95, { dx: 6, align: 'left', color: 'red' });
          const hgt = 0.6;
          if (n <= 1500) {
            for (let k = 1; k <= n; k++) {
              const last = k === n;
              A.curve((t) => [(k - 1 + t) * x, hgt * Math.sin(Math.PI * t)], 0, 1, { n: n > 200 ? 8 : 24, color: last ? 'green' : 'gold', width: last ? 2.4 : 1.4 });
            }
          }
          A.dot(n * x, 0, { color: 'green', r: 5.5 });
          A.tex(`${n}x`, n * x, 0, { dy: -14, dx: 4, align: 'left', color: 'green', size: 14 });
          A.dot(0, 0, { color: 'ink', r: 3.5 });
          // ---------- (b)
          const a = aS.value, g = gS.value, b = a + g;
          const nn = Math.floor(1 / g) + 1, m = Math.floor(nn * a) + 1, p = m / nn;
          B.setView([a - 1.3 * g, b + 1.3 * g], null);
          const [u0, u1] = B.bounds.x;
          B.line(u0, 0, u1, 0, { color: 'faint', width: 1.3 });
          B.rect(a, -0.22, b, 0.22, { fill: 'orange', fillAlpha: 0.16, stroke: false });
          B.line(a, 0, b, 0, { color: 'orange', width: 5, cap: 'butt' });
          B.dot(a, 0, { hollow: true, color: 'orange', r: 5, width: 2 }); B.dot(b, 0, { hollow: true, color: 'orange', r: 5, width: 2 });
          B.tex('x', a, 0, { dy: 22, color: 'orange' }); B.tex('y', b, 0, { dy: 22, color: 'orange' });
          for (let k = Math.ceil(u0 * nn); k <= Math.floor(u1 * nn); k++) {
            const t = k / nn, isP = k === m;
            B.line(t, -0.12, t, 0.42, { color: isP ? 'green' : 'muted', width: isP ? 2.4 : 1.2 });
            if (k === m - 1 || isP) B.tex(`\\tfrac{${k}}{${nn}}`, t, 0.42, { dy: -16, color: isP ? 'green' : 'muted', size: 13 });
          }
          B.dot(p, 0, { color: 'green', r: 6 });
          B.measure(m / nn - 1 / nn, -0.48, m / nn, -0.48, '1/n', { color: 'muted', offset: 12, size: 13 });
          st = { x, y, n, a, b, nn, m, p };
          v.legend([['gold', 'jumps of length $x$'], ['green', 'first multiple past $y$; the rational $p=m/n$'], ['orange', 'the interval $(x,y)$', { area: true }]]);
        });
        v.readout(() => {
          const { x, y, n, a, b, nn, m, p } = st;
          return `(a) $n = \\lfloor y/x\\rfloor + 1 = ${n}$: $\\;${n}\\cdot${v.fmt(x, 4)} = ${v.fmt(n * x, 5)} > ${v.fmt(y, 4)}$. $\\quad$ (b) $n = ${nn}$ gives $n(y-x) = ${v.fmt(nn * (b - a), 4)} > 1$; $m = ${m}$ satisfies $m-1\\le nx = ${v.fmt(nn * a, 6)} < m$, so $x = ${v.fmt(a, 6)} < p = \\tfrac{${m}}{${nn}} = ${v.fmt(p, 7)} < y = ${v.fmt(b, 6)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.21
    {
      num: '1.21',
      kind: 'Theorem',
      name: 'Existence and uniqueness of n-th roots',
      statement: String.raw`For every real $x>0$ and every integer $n>0$ there is exactly one positive real number $y$ with $y^n=x$. It is denoted $\sqrt[n]{x}$ or $x^{1/n}$.`,
      idea: String.raw`Uniqueness: $0<y_1<y_2$ forces $y_1^n<y_2^n$. Existence: $E=\{t>0: t^n<x\}$ is nonempty and bounded above (by $1+x$), so $y=\sup E$ exists. For $0<a<b$ the identity $b^n-a^n=(b-a)(b^{n-1}+b^{n-2}a+\dots+a^{n-1})$ gives $b^n-a^n<(b-a)\,n\,b^{n-1}$. If $y^n<x$, any $h$ with $0<h<1$ and $h<\frac{x-y^n}{n(y+1)^{n-1}}$ puts $y+h$ in $E$ — so $y$ was not an upper bound. If $y^n>x$, then $k=\frac{y^n-x}{n y^{n-1}}$ makes $y-k$ an upper bound of $E$ — so $y$ was not the least. Hence $y^n=x$.`,
      caption: String.raw`Drag the candidate $y$ along the $t$-axis. When $y^n<x$, Rudin's step $h$ (orange) still lands in $E$ (green), so $y$ is not an upper bound. When $y^n>x$, his $k$ produces a smaller upper bound $y-k$, so $y$ is not the least. Only at $y=\sup E$ do both escapes close, and there $y^n=x$.`,
      deps: ['pma-1.19', 'pma-1.18', 'pma-1.8'],
      tags: ['real numbers', 'supremum', 'roots'],
      viz(v) {
        const nS = v.slider('$n$', 1, 6, 3, { int: true });
        const xS = v.slider('$x$', 0.3, 6, 3, { step: 0.01 });
        const s = v.stage({ x: [-0.12, 2.5], y: [-0.5, 4], height: 380, xlabel: 't', ylabel: 'u' });
        const Y = s.handle(1.05, 0, {
          color: 'accent', label: 'y',
          constrain: (t) => { let tt = v.M.clamp(t, 0.08, 2.4); const r = Math.pow(xS.value, 1 / nS.value); if (Math.abs(tt - r) < 0.018) tt = r; return [tt, 0]; },
        });
        let st = {};
        v.render(() => {
          const n = nS.value, x = xS.value, r = Math.pow(x, 1 / n), y = Y.x, yn = y ** n;
          const top = Math.max(1.6, x * 1.45);
          s.setView(null, [-top * 0.12, top]);
          const f = (t) => t ** n;
          // E on the t-axis
          s.line(0, 0, r, 0, { color: 'green', width: 7, cap: 'butt', alpha: 0.75 });
          s.dot(0, 0, { hollow: true, color: 'green', r: 4.5 }); s.dot(r, 0, { hollow: true, color: 'green', r: 5, width: 2 });
          s.tex('E', 0.02, 0, { dy: 18, align: 'left', color: 'green' });
          s.hline(x, { color: 'accent', width: 1.4, dash: [6, 4] });
          s.tex('x', 2.45, x, { dy: -12, align: 'right', color: 'accent' });
          s.fn(f, { domain: [0, 2.5], color: 'ink', width: 2.3 });
          s.line(y, 0, y, yn, { color: 'accent', width: 1.2, dash: [3, 3] });
          s.line(0, yn, y, yn, { color: 'accent', width: 1.2, dash: [3, 3] });
          s.dot(y, yn, { color: 'accent', r: 4.5 });
          s.tex('y^n', 0, yn, { dx: 6, dy: -10, align: 'left', color: 'accent', size: 14 });
          let mode, h = 0, k = 0;
          if (Math.abs(yn - x) < 1e-12 || y === r) {
            mode = 'eq'; s.dot(y, x, { color: 'green', r: 11, hollow: true, width: 2.2 });
            s.corner('y = sup E and yⁿ = x', 'br', { color: 'green', weight: 600 });
          } else if (yn < x) {
            mode = 'lt'; h = 0.98 * Math.min(1, (x - yn) / (n * (y + 1) ** (n - 1)));
            const yh = y + h;
            s.measure(y, -top * 0.065, yh, -top * 0.065, 'h', { color: 'orange', offset: 11 });
            s.line(yh, 0, yh, f(yh), { color: 'orange', width: 1.2, dash: [3, 3] });
            s.dot(yh, f(yh), { color: 'orange', r: 5 }); s.dot(yh, 0, { color: 'orange', r: 4 });
            s.measure(y, yn, y, x, null, { color: 'muted' });
            s.tex('x-y^n', y, (x + yn) / 2, { dx: -6, align: 'right', size: 13, color: 'muted' });
            s.corner('yⁿ < x: y + h is still in E, so y is not an upper bound', 'br', { color: 'red', weight: 600 });
          } else {
            mode = 'gt'; k = (yn - x) / (n * y ** (n - 1));
            const yk = y - k;
            s.rect(yk, -top * 0.03, 2.5, top * 0.03, { fill: 'red', fillAlpha: 0.18, stroke: false });
            s.measure(yk, -top * 0.065, y, -top * 0.065, 'k', { color: 'orange', offset: 11 });
            s.line(yk, 0, yk, f(yk), { color: 'orange', width: 1.2, dash: [3, 3] });
            s.dot(yk, f(yk), { color: 'orange', r: 5 }); s.dot(yk, 0, { color: 'orange', r: 4 });
            s.corner('yⁿ > x: no t ≥ y − k lies in E, so y − k is a smaller upper bound', 'br', { color: 'red', weight: 600 });
          }
          st = { n, x, y, yn, r, mode, h, k };
          v.legend([['ink', '$u=t^n$'], ['green', '$E=\\{t>0:t^n<x\\}$'], ['orange', "Rudin's $h$ or $k$"], ['red', 'region free of $E$', { area: true }]]);
        });
        v.readout(() => {
          const { n, x, y, yn, r, mode, h, k } = st, f = (t) => v.fmt(t, 5);
          const head = `$y = ${f(y)}$, $y^${n} = ${f(yn)}$, $x = ${f(x)}$; $\\sup E = x^{1/${n}} = ${f(r)}$. `;
          if (mode === 'lt') return head + `$h = ${f(h)} < \\frac{x-y^n}{n(y+1)^{n-1}}$ gives $(y+h)^${n} = ${f((y + h) ** n)} < x$.`;
          if (mode === 'gt') return head + `$k = \\frac{y^n-x}{ny^{n-1}} = ${f(k)}$ and $(y-k)^${n} = ${f((y - k) ** n)} > x$, so every $t\\ge y-k$ has $t^n>x$.`;
          return head + 'Neither escape is available: $y$ is the least upper bound and $y^n = x$.';
        });
      },
    },

    // ------------------------------------------------------------------ 1.21a
    {
      num: '1.21a',
      kind: 'Corollary',
      name: 'Roots of a product',
      statement: String.raw`If $a$ and $b$ are positive real numbers and $n$ is a positive integer, then $(ab)^{1/n}=a^{1/n}\,b^{1/n}$.`,
      idea: String.raw`Write $\alpha=a^{1/n}$ and $\beta=b^{1/n}$. Because multiplication is commutative, $(\alpha\beta)^n=\alpha^n\beta^n=ab$. So $\alpha\beta$ is a positive $n$-th root of $ab$, and by the uniqueness part of Theorem 1.21 it is *the* $n$-th root.`,
      caption: String.raw`Choose $a$, $b$ and $n$. Every horizontal level meets the increasing curve $u=t^n$ exactly once — that is the uniqueness in 1.21 — and the product $\alpha\beta$ of the roots of $a$ and $b$ (gold) sits exactly below the level $ab$. Switch to sums for contrast: $\alpha+\beta$ overshoots $(a+b)^{1/n}$; roots respect products, not sums.`,
      deps: ['pma-1.21'],
      tags: ['roots'],
      viz(v) {
        const nS = v.slider('$n$', 2, 6, 3, { int: true });
        const aS = v.slider('$a$', 0.1, 4, 1.5, { step: 0.01 });
        const bS = v.slider('$b$', 0.1, 4, 3.2, { step: 0.01 });
        const op = v.select('', [{ value: 'mul', label: 'product $ab$' }, { value: 'add', label: 'sum $a+b$ (contrast)' }], 'mul');
        const s = v.stage({ x: [-0.1, 2.8], y: [-1, 10], height: 380, xlabel: 't', ylabel: 'u' });
        let st = {};
        v.render(() => {
          const n = nS.value, a = aS.value, b = bS.value, mul = op.value === 'mul';
          const c = mul ? a * b : a + b, al = a ** (1 / n), be = b ** (1 / n), ga = c ** (1 / n), cand = mul ? al * be : al + be;
          const R = Math.max(cand, ga, al, be) * 1.22, top = Math.max(c, a, b) * 1.16;
          s.setView([-R * 0.06, R], [-top * 0.13, top]);
          s.fn((t) => t ** n, { domain: [0, R * 1.02], color: 'ink', width: 2.3 });
          const level = (u, t, col, name, tname, below) => {
            s.line(0, u, t, u, { color: col, width: 1.4, dash: [6, 4] });
            s.line(t, u, t, 0, { color: col, width: 1.4, dash: [6, 4] });
            s.dot(t, u, { color: col, r: 4 });
            s.tex(name, 0, u, { dx: -6, align: 'right', color: col, size: 14 });
            s.tex(tname, t, 0, { dy: below ? 30 : 14, color: col, size: 14 });
          };
          level(a, al, 'accent', 'a', '\\alpha', false);
          level(b, be, 'orange', 'b', '\\beta', false);
          level(c, ga, 'green', mul ? 'ab' : 'a+b', mul ? '(ab)^{1/n}' : '(a+b)^{1/n}', true);
          s.dot(cand, 0, { color: 'gold', r: 7 });
          s.tex(mul ? '\\alpha\\beta' : '\\alpha+\\beta', cand, 0, { dy: -16, dx: mul ? 14 : 0, color: 'gold', size: 15 });
          if (!mul) {
            const hN = cand ** n, yTop = top * 0.97, clip = hN > yTop;
            s.line(cand, 0, cand, Math.min(hN, yTop), { color: 'red', width: 1.4, dash: [3, 3] });
            if (clip) { s.arrow(cand, yTop - top * 0.08, cand, yTop, { color: 'red', width: 1.6, head: 8 }); s.tex(`(\\alpha+\\beta)^n=${v.fmt(hN, 3)}\\ \\text{(off the chart)}`, cand, yTop, { dx: -8, dy: 6, align: 'right', baseline: 'top', color: 'red', size: 13 }); }
            else { s.dot(cand, hN, { color: 'red', r: 4.5 }); s.tex('(\\alpha+\\beta)^n', cand, hN, { dx: 8, align: 'left', color: 'red', size: 13 }); }
          }
          st = { n, a, b, c, al, be, ga, cand, mul };
          v.legend([['ink', '$u=t^n$'], ['gold', mul ? '$\\alpha\\beta=a^{1/n}b^{1/n}$' : '$\\alpha+\\beta$', { dot: true }], ['green', mul ? 'the root of $ab$' : 'the root of $a+b$']]);
        });
        v.readout(() => {
          const { n, al, be, ga, cand, mul } = st, f = (t) => v.fmt(t, 7);
          if (mul) return `$\\alpha = ${f(al)}$, $\\beta = ${f(be)}$, $\\alpha\\beta = ${f(cand)}$, $(ab)^{1/${n}} = ${f(ga)}$ — difference $${v.fmt(Math.abs(cand - ga), 2)}$ (rounding only), since $(\\alpha\\beta)^${n} = \\alpha^${n}\\beta^${n} = ab$.`;
          return `$\\alpha+\\beta = ${f(cand)}$ but $(a+b)^{1/${n}} = ${f(ga)}$: the $n$-th root is **not** additive — the corollary is special to products.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.23
    {
      num: '1.23',
      kind: 'Definition',
      name: 'The extended real number system',
      statement: String.raw`The **extended real number system** consists of $\R$ together with two symbols $+\infty$ and $-\infty$, ordered as in $\R$ and with $-\infty<x<+\infty$ for every $x\in\R$. In it, $+\infty$ is an upper bound of every subset, and a nonempty set $E$ that is not bounded above in $\R$ has $\sup E=+\infty$ (similarly for lower bounds). Partial arithmetic is agreed upon: for real $x$, $x+\infty=+\infty$, $x-\infty=-\infty$, $x/(\pm\infty)=0$; if $x>0$ then $x\cdot(+\infty)=+\infty$ and $x\cdot(-\infty)=-\infty$; if $x<0$ the signs are exchanged.`,
      idea: String.raw`Adjoining two endpoints makes every nonempty subset have a supremum and an infimum, which streamlines statements about limits later on (e.g. $\limsup$ in Chapter 3). The price is that $\infty-\infty$ and $0\cdot\infty$ stay undefined, so the extended reals do not form a field. Elements of $\R$ are then called *finite* to distinguish them from $\pm\infty$.`,
      caption: String.raw`The whole extended line, squeezed into a segment by $t\mapsto t/(1+|t|)$ so that $\pm\infty$ become endpoints. Choose a set $E$ and drag the candidate bound $M$: for a set that is unbounded above, no real $M$ works, and the supremum is the endpoint $+\infty$.`,
      deps: ['pma-1.19', 'pma-1.8'],
      tags: ['real numbers', 'supremum'],
      viz(v) {
        const phi = (t) => (t === Infinity ? 1 : t === -Infinity ? -1 : t / (1 + Math.abs(t)));
        const inv = (u) => u / (1 - Math.abs(u));
        const SETS = {
          N: { label: '$\\{1,2,3,\\dots\\}$', pts: v.M.range(400, 1), sup: Infinity, inf: 1 },
          neg: { label: '$\\{-n^2\\}$', pts: v.M.range(200, 1).map((n) => -n * n), sup: -1, inf: -Infinity },
          iv: { label: '$(-2,5]$', iv: [-2, 5], sup: 5, inf: -2 },
          R: { label: '$\\R$', iv: [-Infinity, Infinity], sup: Infinity, inf: -Infinity },
        };
        const which = v.select('$E$', Object.entries(SETS).map(([value, S]) => ({ value, label: S.label })), 'N');
        const s = v.stage({ x: [-1.12, 1.12], y: [-0.75, 0.75], height: 220, axes: false });
        const Mh = s.handle(phi(6.5), 0, { color: 'purple', label: 'M', constrain: (x) => [v.M.clamp(x, -0.985, 0.985), 0] });
        let st = {};
        v.render(() => {
          const E = SETS[which.value], M = inv(Mh.x);
          s.line(-1, 0, 1, 0, { color: 'faint', width: 1.4 });
          for (const k of [-100, -50, -20, -10, -5, -3, -2, -1, 0, 1, 2, 3, 5, 10, 20, 50, 100]) {
            const u = phi(k); s.line(u, -0.04, u, 0.04, { color: 'faint', width: 1.2 });
            if (Math.abs(k) <= 10) s.text(String(k).replace('-', '−'), u, 0, { dy: 14, align: 'center', size: 10.5, color: 'muted' });
          }
          for (const sgn of [-1, 1]) { s.dot(sgn, 0, { color: 'ink', r: 6 }); s.tex(sgn > 0 ? '+\\infty' : '-\\infty', sgn, 0, { dy: 22, size: 15 }); }
          if (E.iv) {
            s.line(phi(E.iv[0]), 0, phi(E.iv[1]), 0, { color: 'accent', width: 6, cap: 'butt' });
            if (isFinite(E.iv[0])) s.dot(phi(E.iv[0]), 0, { hollow: true, color: 'accent', r: 5 });
            if (isFinite(E.iv[1])) s.dot(phi(E.iv[1]), 0, { color: 'accent', r: 5 });
          } else s.dots(E.pts.map((p) => [phi(p), 0]), { r: 3.2, color: 'accent' });
          // sup and inf
          s.line(phi(E.sup), 0, phi(E.sup), 0.42, { color: 'green', width: 1.3, dash: [3, 3] });
          s.tex(`\\sup E=${isFinite(E.sup) ? E.sup : '+\\infty'}`, phi(E.sup), 0.42, { dy: -12, color: 'green', size: 14, align: E.sup === Infinity ? 'right' : 'center' });
          s.line(phi(E.inf), -0.13, phi(E.inf), -0.4, { color: 'orange', width: 1.3, dash: [3, 3] });
          s.tex(`\\inf E=${isFinite(E.inf) ? E.inf : '-\\infty'}`, phi(E.inf), -0.4, { dy: 14, color: 'orange', size: 14, align: E.inf === -Infinity ? 'left' : 'center' });
          // M test
          let beat = null;
          if (E.iv) { if (E.iv[1] > M) beat = isFinite(E.iv[1]) ? E.iv[1] : Math.max(M + 1, 2 * M + 1); }
          else { const big = E.pts.filter((p) => p > M); if (big.length) beat = Math.min(...big); }
          if (beat !== null) { s.dot(phi(beat), 0, { color: 'red', r: 8, hollow: true, width: 2 }); }
          st = { M, beat };
          v.legend([['accent', '$E$'], ['green', '$\\sup E$'], ['orange', '$\\inf E$'], ['purple', 'a real candidate bound $M$', { dot: true }]]);
        });
        v.readout(() => {
          const { M, beat } = st, E = SETS[which.value];
          const head = `$M = ${v.fix(M, 2)}$: `;
          if (beat === null) return head + `an upper bound of $E$ in $\\R$; the least one is $\\sup E = ${E.sup}$.`;
          return head + `not an upper bound — $${v.fmt(beat, 4)}\\in E$ exceeds it.` + (E.sup === Infinity ? ' This happens for every real $M$, so in the extended system $\\sup E = +\\infty$.' : '');
        });
      },
    },
  ],
};
