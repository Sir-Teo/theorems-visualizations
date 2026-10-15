// Rudin, Real and Complex Analysis — Chapter 1: Abstract Integration
// Part 1 (this file): topology vs. measurability, generated σ-algebras, Borel sets.
// Further parts: ch01-a2.js … ch01-a5.js.

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
/** Clip a convex polygon to the half-plane a*x + b*y <= c (Sutherland–Hodgman). */
function clipHalf(poly, a, b, c) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = a * P[0] + b * P[1] - c, fq = a * Q[0] + b * Q[1] - c;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** The part of the line a*x + b*y = c inside the unit square, as [[x,y],[x,y]] (or null). */
function lineInBox(a, b, c) {
  const P = [];
  for (const x of [0, 1]) if (Math.abs(b) > 1e-12) { const y = (c - a * x) / b; if (y >= 0 && y <= 1) P.push([x, y]); }
  for (const y of [0, 1]) if (Math.abs(a) > 1e-12) { const x = (c - b * y) / a; if (x >= 0 && x <= 1) P.push([x, y]); }
  if (P.length < 2) return null;
  P.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return [P[0], P[P.length - 1]];
}
const totalLength = (ivs) => ivs.reduce((s, [a, b]) => s + (b - a), 0);
/** Draw a subset of a line (list of intervals) as a bar in row [y0, y1]. */
function drawRow(S, ivs, y0, y1, color, alpha = 0.75) {
  for (const [a, b] of ivs) S.rect(a, y0, b, y1, { fill: color, fillAlpha: alpha, stroke: false });
}

export default {
  collection: 'rca',
  chapter: 1,
  title: 'Abstract Integration',
  summary: String.raw`Rudin builds the Lebesgue integral on an arbitrary measure space in one sweep. Measurable functions are defined exactly like continuous ones — by pulling back open sets, with a σ-algebra in place of a topology — and every nonnegative measurable function is an increasing limit of simple functions. A positive measure integrates nonnegative functions through suprema of integrals of simple functions; the monotone convergence theorem, Fatou's lemma and the dominated convergence theorem then control limits, and the chapter ends by showing how sets of measure zero may be ignored and how every measure can be completed.`,
  items: [
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Topological space and continuous map',
      statement: String.raw`A **topology** on a set $X$ is a family $\tau$ of subsets of $X$ such that
(i) $\emptyset\in\tau$ and $X\in\tau$;
(ii) the intersection of finitely many members of $\tau$ is in $\tau$;
(iii) the union of any family (finite, countable or not) of members of $\tau$ is in $\tau$.
The members of $\tau$ are the **open sets** and $X$ is a **topological space**. A map $f:X\to Y$ between topological spaces is **continuous** if $f^{-1}(V)$ is open in $X$ for every open set $V$ in $Y$.`,
      idea: String.raw`Rudin introduces topologies only to set up an analogy: a σ-algebra will play the part of the topology, measurable sets the part of open sets, and measurable functions the part of continuous functions — both notions are defined by pulling back open sets.`,
      deps: [],
      tags: ['topology', 'definitions'],
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'σ-algebra, measurable space, measurable function',
      statement: String.raw`A family $\mathfrak M$ of subsets of a set $X$ is a **σ-algebra** in $X$ if
(i) $X\in\mathfrak M$;
(ii) $A\in\mathfrak M$ implies $A^c\in\mathfrak M$;
(iii) whenever $A_1,A_2,\ldots\in\mathfrak M$, also $\bigcup_{n}A_n\in\mathfrak M$.
Then $X$ is a **measurable space** and the members of $\mathfrak M$ are its **measurable sets**. If $Y$ is a topological space, a map $f:X\to Y$ is **measurable** when $f^{-1}(V)\in\mathfrak M$ for every open set $V\subset Y$.

It follows at once that $\emptyset\in\mathfrak M$ and that $\mathfrak M$ is closed under finite unions, countable intersections and differences $A-B$.`,
      idea: String.raw`Measurability is continuity with the topology of the domain replaced by a σ-algebra. The simplest σ-algebras come from a partition of $X$ into finitely many *atoms*: all unions of atoms form a σ-algebra, and a function is measurable for it exactly when it is constant on each atom (otherwise some open $V$ separates two values taken inside one atom).`,
      caption: String.raw`$X$ is the square, cut into seven atoms $A_1,\dots,A_7$; $\mathfrak M$ consists of all $2^7=128$ unions of atoms. Drag the ends of the open interval $V$ on the target line: the vivid part of the square is $f^{-1}(V)$. For the step function it is always a union of whole atoms. Switch to the smooth $f$ and the preimage slices through atoms (red outlines), so this $f$ is not measurable for $\mathfrak M$.`,
      deps: ['rca-1.2'],
      tags: ['σ-algebra', 'measurability'],
      viz(v) {
        const M = v.M;
        const sites = [[0.17, 0.2], [0.53, 0.13], [0.87, 0.3], [0.3, 0.55], [0.67, 0.52], [0.14, 0.87], [0.73, 0.86]];
        const vals = [0.62, 0.18, 0.86, 0.4, 0.94, 0.27, 0.72];
        const cols = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold'];
        const atom = (x, y) => { let b = 0, bd = Infinity; for (let i = 0; i < sites.length; i++) { const d = (x - sites[i][0]) ** 2 + (y - sites[i][1]) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
        const FN = {
          step: { label: '$f$ constant on atoms', f: (x, y) => vals[atom(x, y)] },
          smooth: { label: '$f(x,y)=0.06+0.48x+0.4y$', f: (x, y) => 0.06 + 0.48 * x + 0.4 * y },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'step');
        const L = v.stage({ x: [-0.03, 1.03], y: [-0.03, 1.03], equal: true, axes: false, height: 360, title: 'the measurable space $(X,\\mathfrak M)$: seven atoms' });
        const R = v.stage({ x: [0, 1], y: [-0.06, 1.06], axes: false, height: 360, weight: 0.55, minWidth: 210, title: 'the target $Y=\\R$' });
        const LX = 0.3;
        const ha = R.handle(LX, 0.34, { color: 'accent', constrain: (x, y) => [LX, M.clamp(y, 0, 1)] });
        const hb = R.handle(LX, 0.68, { color: 'accent', constrain: (x, y) => [LX, M.clamp(y, 0, 1)] });
        let state = null;

        // exact Voronoi cells (clip the square by bisector half-planes)
        const cells = sites.map((p, i) => sites.reduce((poly, q, j) => (j === i ? poly
          : clipHalf(poly, 2 * (q[0] - p[0]), 2 * (q[1] - p[1]), q[0] ** 2 + q[1] ** 2 - p[0] ** 2 - p[1] ** 2)), [[0, 0], [1, 0], [1, 1], [0, 1]]));
        const areas = cells.map((c) => Math.abs(M.polyArea(c)));
        v.render(() => {
          const lo = Math.min(ha.y, hb.y), hi = Math.max(ha.y, hb.y);
          const inV = (t) => t > lo && t < hi;
          const step = which.value === 'step';
          let full, cut, empty;
          if (step) {
            full = vals.map(inV); empty = full.map((b) => !b); cut = full.map(() => false);
            cells.forEach((c, i) => L.poly(c, { fill: cols[i], fillAlpha: full[i] ? 0.62 : 0.1, stroke: false }));
          } else {
            // f = 0.06 + 0.48x + 0.4y, so {lo < f < hi} is a strip between two parallel lines
            const pre = cells.map((c) => clipHalf(clipHalf(c, -0.48, -0.4, 0.06 - lo), 0.48, 0.4, hi - 0.06));
            const fr = pre.map((c, i) => (c.length > 2 ? Math.abs(M.polyArea(c)) / areas[i] : 0));
            full = fr.map((t) => t > 1 - 1e-9); empty = fr.map((t) => t < 1e-9); cut = fr.map((t, i) => !full[i] && !empty[i]);
            cells.forEach((c, i) => L.poly(c, { fill: cols[i], fillAlpha: 0.1, stroke: false }));
            pre.forEach((c, i) => { if (c.length > 2) L.poly(c, { fill: cols[i], fillAlpha: 0.62, stroke: false }); });
            for (const t of [lo, hi]) { const seg = lineInBox(0.48, 0.4, t - 0.06); if (seg) L.segment(seg[0], seg[1], { color: 'accent', width: 1.3, dash: [5, 4] }); }
          }
          cells.forEach((c, i) => { if (!cut[i]) L.poly(c, { color: 'ink', width: 1.1, alpha: 0.55 }); });
          cells.forEach((c, i) => { if (cut[i]) L.poly(c, { color: 'red', width: 2.6 }); });
          L.rect(0, 0, 1, 1, { color: 'ink', width: 1.4, alpha: 0.7 });
          sites.forEach(([x, y], i) => L.tex(`A_{${i + 1}}`, x, y, { color: cut[i] ? 'red' : 'ink', size: 15 }));
          // right: the target line
          R.line(LX, 0, LX, 1, { color: 'ink', width: 1.6 });
          for (const t of [0, 0.25, 0.5, 0.75, 1]) { R.line(LX - 0.025, t, LX + 0.025, t, { color: 'muted', width: 1 }); R.text(String(t), LX - 0.06, t, { align: 'right', color: 'muted', size: 11 }); }
          R.rect(LX - 0.11, lo, LX + 0.11, hi, { fill: 'accent', fillAlpha: 0.13, stroke: false });
          R.line(LX, lo, LX, hi, { color: 'accent', width: 5, cap: 'butt' });
          R.tex('V', LX - 0.15, (lo + hi) / 2, { color: 'accent', size: 17, align: 'right' });
          if (step) {
            vals.forEach((t, i) => {
              const on = inV(t);
              R.dot(LX, t, { color: cols[i], r: on ? 5.5 : 4.5, hollow: !on, width: 2 });
              R.tex(`f(A_{${i + 1}})`, LX + 0.1, t, { color: on ? cols[i] : 'muted', size: 13.5, align: 'left' });
            });
          } else {
            R.line(LX + 0.07, 0.06, LX + 0.07, 0.94, { color: 'gray', width: 4, cap: 'butt', alpha: 0.7 });
            R.tex('f(X)', LX + 0.12, 0.5, { color: 'gray', size: 14, align: 'left' });
          }
          state = { full, cut, empty };
        });
        v.readout(() => {
          const s = state; if (!s) return '';
          const name = (i) => `A_{${i + 1}}`;
          const fl = s.full.map((b, i) => (b ? name(i) : null)).filter(Boolean);
          const ct = s.cut.map((b, i) => (b ? name(i) : null)).filter(Boolean);
          if (ct.length) return `$f^{-1}(V)$ splits $${ct.join(',\\ ')}$: it is not a union of atoms, so $f^{-1}(V)\\notin\\mathfrak M$ and $f$ is **not** measurable.`;
          return `$f^{-1}(V) = ${fl.length ? fl.join('\\cup ') : '\\emptyset'}\\in\\mathfrak M$ — a union of atoms, as it is for every open $V$: $f$ is measurable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Continuous functions of measurable functions',
      statement: String.raw`Let $Y$ and $Z$ be topological spaces and let $g:Y\to Z$ be continuous.
(a) If $X$ is a topological space and $f:X\to Y$ is continuous, then $h=g\circ f$ is continuous.
(b) If $X$ is a measurable space and $f:X\to Y$ is measurable, then $h=g\circ f:X\to Z$ is measurable.`,
      idea: String.raw`For an open $V\subset Z$ we have $h^{-1}(V)=f^{-1}\big(g^{-1}(V)\big)$. Continuity of $g$ makes $g^{-1}(V)$ open in $Y$, and the hypothesis on $f$ then makes its preimage open in case (a) and measurable in case (b). One argument proves both statements — which is exactly why Rudin sets up the two theories in parallel.`,
      caption: String.raw`Left: $f$ on $X=[0,1]$. Right: a continuous $g:Y\to Z$, drawn sideways so the two $Y$-axes line up. Drag the ends of the open interval $V\subset Z$ (bottom right). The orange bands are the open set $g^{-1}(V)\subset Y$; the green intervals are $h^{-1}(V)=f^{-1}(g^{-1}(V))$. For the step function, $X$ carries the σ-algebra generated by the five intervals $I_k$, and the preimage is always a union of whole $I_k$'s.`,
      deps: ['rca-1.2', 'rca-1.3'],
      tags: ['measurability', 'composition'],
      verify: true,
      viz(v) {
        const M = v.M;
        const br = [0, 0.18, 0.4, 0.57, 0.8, 1], sv = [0.95, -0.45, 1.4, -1.2, 0.25];
        const stepIdx = (x) => { let k = 0; while (k < 4 && x >= br[k + 1]) k++; return k; };
        const FX = {
          step: { label: 'measurable step $f$', f: (x) => sv[stepIdx(x)] },
          cont: { label: 'continuous $f$', f: (x) => 1.35 * Math.sin(5.2 * x - 0.5) },
        };
        const GZ = {
          sq: { label: '$g(y)=y^2$', g: (y) => y * y },
          sin: { label: '$g(y)=1+\\sin 3y$', g: (y) => 1 + Math.sin(3 * y) },
        };
        const wf = v.select('', Object.entries(FX).map(([value, o]) => ({ value, label: o.label })), 'step');
        const wg = v.select('', Object.entries(GZ).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const YR = [-2.0, 1.8];
        const A = v.stage({ x: [-0.03, 1.03], y: YR, axes: 'box', height: 360, title: '$f : X\\to Y$, with $X=[0,1]$' });
        const B = v.stage({ x: [-0.25, 3.0], y: YR, axes: 'box', height: 360, title: '$g : Y\\to Z$ (sideways), open $V\\subset Z$' });
        const VY = -1.62;
        const con = (x) => [M.clamp(x, -0.2, 2.95), VY];
        const ha = B.handle(0.15, VY, { color: 'accent', constrain: con });
        const hb = B.handle(1.6, VY, { color: 'accent', constrain: con });
        let st = null;
        v.render(() => {
          const f = FX[wf.value].f, g = GZ[wg.value].g;
          const lo = Math.min(ha.x, hb.x), hi = Math.max(ha.x, hb.x);
          const inV = (z) => z > lo && z < hi;
          const GV = intervalsWhere((y) => inV(g(y)), YR[0], YR[1], 1400);
          for (const [a, b] of GV) for (const S of [A, B]) S.hband(a, b, { color: 'orange', alpha: 0.13, edges: true });
          // right panel: g sideways, V on the bottom line
          B.vband(lo, hi, { color: 'accent', alpha: 0.06 });
          B.curve((y) => [g(y), y], YR[0], YR[1], { color: 'ink', width: 2 });
          B.path(M.linspace(YR[0], YR[1], 700).map((y) => (inV(g(y)) ? [g(y), y] : null)), { color: 'accent', width: 3.6 });
          B.line(lo, VY, hi, VY, { color: 'accent', width: 5, cap: 'butt' });
          B.tex('V', (lo + hi) / 2, VY, { color: 'accent', dy: -16, size: 16 });
          B.tex('g^{-1}(V)', 2.95, GV.length ? (GV[GV.length - 1][0] + GV[GV.length - 1][1]) / 2 : 0, { color: 'orange', align: 'right', size: 14 });
          // left panel: f, its partition, the preimage
          if (wf.value === 'step') {
            for (let k = 0; k < 5; k++) {
              if (k % 2 === 0) A.vband(br[k], br[k + 1], { color: 'gray', alpha: 0.07 });
              A.tex(`I_{${k + 1}}`, (br[k] + br[k + 1]) / 2, YR[1], { color: 'muted', baseline: 'top', dy: 4, size: 13 });
            }
            for (let k = 0; k < 5; k++) {
              const on = inV(g(sv[k]));
              A.line(br[k], sv[k], br[k + 1], sv[k], { color: on ? 'accent' : 'ink', width: on ? 3.6 : 2.2 });
            }
          } else {
            A.fn(f, { domain: [0, 1], color: 'ink', width: 2 });
            A.path(M.linspace(0, 1, 900).map((x) => (inV(g(f(x))) ? [x, f(x)] : null)), { color: 'accent', width: 3.6 });
          }
          const H = intervalsWhere((x) => inV(g(f(x))), 0, 1, 2000);
          A.line(0, VY, 1, VY, { color: 'faint', width: 1 });
          drawRow(A, H, VY - 0.08, VY + 0.08, 'green', 0.85);
          A.tex('h^{-1}(V)', 0.0, VY + 0.12, { color: 'green', align: 'left', baseline: 'bottom', size: 13.5, dx: 2 });
          v.legend([['ink', 'graphs of $f$ and $g$'], ['accent', 'the open set $V\\subset Z$ and what maps into it'], ['orange', '$g^{-1}(V)\\subset Y$ (open)', { area: true }], ['green', '$h^{-1}(V)\\subset X$', { area: true }]]);
          st = { GV, H, step: wf.value === 'step', atoms: sv.map((y, k) => (inV(g(y)) ? k : -1)).filter((k) => k >= 0) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$g^{-1}(V)$ is a union of ${s.GV.length} open interval${s.GV.length === 1 ? '' : 's'} in $Y$. `;
          if (s.step) return head + `$h^{-1}(V) = ${s.atoms.length ? s.atoms.map((k) => `I_{${k + 1}}`).join('\\cup ') : '\\emptyset'}$ — a member of the σ-algebra generated by the $I_k$.`;
          return head + `$h^{-1}(V)$ is open in $X$: ${s.H.length} interval${s.H.length === 1 ? '' : 's'}, total length $${v.fix(totalLength(s.H), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Continuous functions of two measurable functions',
      statement: String.raw`Let $u$ and $v$ be real measurable functions on a measurable space $X$, let $\Phi$ be a continuous map of the plane into a topological space $Y$, and define $h(x)=\Phi\big(u(x),v(x)\big)$ for $x\in X$. Then $h:X\to Y$ is measurable.`,
      idea: String.raw`Put $F(x)=(u(x),v(x))$. For an open rectangle $R=I\times J$ one has $F^{-1}(R)=u^{-1}(I)\cap v^{-1}(J)$, which is measurable. Every open set of the plane is a countable union of such rectangles, so $F^{-1}$ of every open set is measurable, i.e. $F$ is measurable. Then $h=\Phi\circ F$ is measurable by Theorem 1.7.`,
      caption: String.raw`Left: the plane, the open set $\Phi^{-1}(W)$ (shaded) for an open interval $W$, packed by dyadic squares $Q=I\times J$, and the curve $x\mapsto (u(x),v(x))$. Right: $u$ and $v$ on $X=[0,1]$. The gold set $\bigcup_Q u^{-1}(I)\cap v^{-1}(J)$ is built from preimages of intervals only; raise the dyadic level and it fills the green set $h^{-1}(W)$.`,
      deps: ['rca-1.3', 'rca-1.7'],
      tags: ['measurability'],
      verify: true,
      viz(v) {
        const M = v.M;
        const u = (x) => 1.05 * Math.cos(2 * Math.PI * x), w = (x) => 0.95 * Math.sin(4 * Math.PI * x + 0.3);
        const PHI = {
          prod: { label: '$\\Phi(s,t)=st$', F: (s, t) => s * t, W: [0.12, 0.7] },
          rad: { label: '$\\Phi(s,t)=s^2+t^2$', F: (s, t) => s * s + t * t, W: [0.35, 0.95] },
          sum: { label: '$\\Phi(s,t)=s+t$', F: (s, t) => s + t, W: [-0.5, 0.6] },
        };
        const w1 = v.slider('$w_1$', -1.5, 2, 0.12, { step: 0.01 });
        const w2 = v.slider('$w_2$', -1.5, 2, 0.7, { step: 0.01 });
        const which = v.select('', Object.entries(PHI).map(([value, o]) => ({ value, label: o.label })), 'prod', { onChange: (k) => { w1.set(PHI[k].W[0]); w2.set(PHI[k].W[1]); } });
        const lev = v.slider('dyadic level', 1, 7, 5, { int: true });
        const D = 1.6;
        const L = v.stage({ x: [-1.62, 1.62], y: [-1.62, 1.62], equal: true, height: 360, ticks: false, xlabel: 's', ylabel: 't', title: 'the plane: $\\Phi^{-1}(W)$ and $F(x)=(u(x),v(x))$' });
        const R = v.stage({ x: [-0.12, 1.03], y: [-2.05, 1.2], height: 360, axes: true, title: 'the measurable space $X=[0,1]$' });
        let st = null;
        v.render(() => {
          const P = PHI[which.value].F, a = Math.min(w1.value, w2.value), b = Math.max(w1.value, w2.value);
          const inW = (s, t) => { const z = P(s, t); return z > a && z < b; };
          const o = v.rgb('orange');
          L.raster((s, t) => (inW(s, t) ? [o[0], o[1], o[2], 46] : null), { key: `${which.value}|${a}|${b}|${v.color('orange')}`, res: 2 });
          // maximal dyadic squares contained in Φ^{-1}(W)
          const K = lev.value, sq = [], keys = new Set();
          const inside = (x0, y0, h) => { for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) if (!inW(x0 + h * i / 6, y0 + h * j / 6)) return false; return true; };
          const rec = (i, j, lv) => {
            const h = 2 * D / 2 ** lv, x0 = -D + i * h, y0 = -D + j * h;
            if (inside(x0, y0, h)) { sq.push([x0, y0, h]); keys.add(`${lv}:${i}:${j}`); return; }
            if (lv < K) for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) rec(2 * i + di, 2 * j + dj, lv + 1);
          };
          rec(0, 0, 0);
          for (const [x0, y0, h] of sq) L.rect(x0, y0, x0 + h, y0 + h, { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 0.9 });
          const inSq = (s, t) => {
            for (let lv = 0; lv <= K; lv++) { const h = 2 * D / 2 ** lv; const i = Math.floor((s + D) / h), j = Math.floor((t + D) / h); if (keys.has(`${lv}:${i}:${j}`)) return true; }
            return false;
          };
          L.curve((x) => [u(x), w(x)], 0, 1, { color: 'ink', width: 1.6, n: 500 });
          L.path(M.linspace(0, 1, 900).map((x) => (inW(u(x), w(x)) ? [u(x), w(x)] : null)), { color: 'green', width: 3.4 });
          // right: u, v and the two sets
          R.fn(u, { domain: [0, 1], color: 'blue', width: 2 });
          R.fn(w, { domain: [0, 1], color: 'purple', width: 2 });
          const Hs = intervalsWhere((x) => inW(u(x), w(x)), 0, 1, 2000);
          const Gs = intervalsWhere((x) => inSq(u(x), w(x)), 0, 1, 3000);
          drawRow(R, Hs, -1.52, -1.4, 'green', 0.85);
          drawRow(R, Gs, -1.94, -1.82, 'gold', 0.9);
          R.tex('h^{-1}(W)', 0, -1.38, { color: 'green', align: 'left', baseline: 'bottom', dy: -2, size: 13 });
          R.tex('\\textstyle\\bigcup_Q u^{-1}(I)\\cap v^{-1}(J)', 0, -1.8, { color: 'gold', align: 'left', baseline: 'bottom', dy: -2, size: 13 });
          R.tex('u', 0.5, u(0.5), { color: 'blue', dy: 16 });
          R.tex('v', 0.6, w(0.6), { color: 'purple', dy: -16 });
          v.legend([['blue', '$u$'], ['purple', '$v$'], ['orange', '$\\Phi^{-1}(W)$, dyadic squares $Q=I\\times J$', { area: true }], ['green', '$h^{-1}(W)$', { area: true }], ['gold', 'union of rectangle preimages', { area: true }]]);
          st = { mH: totalLength(Hs), mG: totalLength(Gs), n: sq.length, K };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `Length of $h^{-1}(W)$: $${v.fix(s.mH, 4)}$. Level ${s.K}: ${s.n} squares, their preimages cover length $${v.fix(s.mG, 4)}$ (missing $${v.fix(Math.max(0, s.mH - s.mG), 4)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Proposition',
      name: 'Real and imaginary parts, sums, products, polar form',
      statement: String.raw`Let $X$ be a measurable space.
(a) If $u$ and $v$ are real measurable functions on $X$, then $f=u+iv$ is a complex measurable function.
(b) If $f=u+iv$ is complex measurable, then $u$, $v$ and $|f|$ are real measurable.
(c) If $f$ and $g$ are complex measurable, so are $f+g$ and $fg$.
(d) If $E\subset X$ is measurable, its characteristic function $\chi_E$ is measurable.
(e) If $f$ is complex measurable, there is a complex measurable $\alpha$ on $X$ with $|\alpha|=1$ and $f=\alpha|f|$.`,
      idea: String.raw`(a) is Theorem 1.8 with $\Phi(s,t)=s+it$; (b) is Theorem 1.7 with $g=\Re,\ \Im,\ |\cdot|$; (c) follows from 1.8 with $\Phi(s,t)=s+t$ and $st$ for real functions, then from (a) and (b). For (d), $\chi_E^{-1}(V)$ is always one of $\emptyset, E, E^c, X$. For (e), let $E=\{f=0\}$ and $\varphi(z)=z/|z|$ on $\C\setminus\{0\}$; then $\alpha=\varphi(f+\chi_E)$ works — adding $\chi_E$ moves the zeros of $f$ to $1$, where $\varphi$ is continuous, so 1.7 applies.`,
      caption: String.raw`A complex function on $[0,1]$ that vanishes on an interval $E$ (red). Drag the point $x$ (bottom right). Left: $f(x)$, its modulus $|f(x)|$ rotated into place, and $\alpha(x)$ on the unit circle. Right: the real measurable functions $\Re f$, $\Im f$ and $|f|$ of (b). Inside $E$, Rudin's trick $\alpha=\varphi(f+\chi_E)$ gives $\alpha=1$. For a real $f$, $\alpha$ is just the sign of $f$.`,
      deps: ['rca-1.7', 'rca-1.8'],
      tags: ['measurability', 'complex functions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const FN = {
          spiral: { label: 'complex $f$, zero on $E$', f: (x) => { const r = 2.45 * Math.max(0, Math.abs(x - 0.525) - 0.075); const t = 5.5 * x + 0.3; return [r * Math.cos(t), r * Math.sin(t)]; }, E: [0.45, 0.6] },
          real: { label: 'real $f=\\cos 3\\pi x$', f: (x) => [Math.cos(3 * Math.PI * x), 0], E: null },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'spiral');
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.18, 1.18], equal: true, height: 340, ticks: false, title: 'values in $\\C$' });
        const R = v.stage({ x: [-0.11, 1.02], y: [-1.3, 1.2], height: 340, title: '$\\Re f$, $\\Im f$, $|f|$ on $X=[0,1]$' });
        const hx = R.handle(0.3, -1.15, { color: 'gold', label: 'x', constrain: (x) => [M.clamp(x, 0, 1), -1.15] });
        let st = null;
        v.render(() => {
          const F = FN[which.value];
          const f = F.f, x = hx.x;
          const [re, im] = f(x), r = Math.hypot(re, im);
          const inE = r < 1e-12;
          const al = inE ? [1, 0] : [re / r, im / r];
          // left
          L.circle(0, 0, 1, { color: 'faint', width: 1.2, dash: [4, 4] });
          L.curve((t) => f(t), 0, 1, { color: 'gray', width: 1.8, n: 600 });
          L.text('1', 1, 0, { color: 'muted', size: 11, dx: 4, dy: 9, align: 'left' });
          { const p0 = f(0), p1 = f(1); L.dot(p0[0], p0[1], { color: 'gray', r: 3 }); L.dot(p1[0], p1[1], { color: 'gray', r: 3 }); if (which.value === 'spiral') { L.text('x=0', p0[0], p0[1], { color: 'muted', size: 11, dx: 6, dy: -8, align: 'left' }); L.text('x=1', p1[0], p1[1], { color: 'muted', size: 11, dx: 6, dy: 8, align: 'left' }); } }
          if (!inE) {
            const th = Math.atan2(im, re);
            L.curve((s) => [r * Math.cos(th * s), r * Math.sin(th * s)], 0, 1, { color: 'accent', width: 1.2, dash: [3, 3], n: 80 });
            L.line(0, 0, r, 0, { color: 'accent', width: 3 });
            L.line(0, 0, al[0], al[1], { color: 'gold', width: 1.2, dash: [2, 3] });
            L.arrow(0, 0, re, im, { color: 'accent', width: 2.2 });
            L.tex('|f(x)|', r / 2, 0, { color: 'accent', dy: 12, size: 13 });
            L.dot(re, im, { color: 'accent', r: 5, label: 'f(x)', labelPos: re >= 0 ? 'e' : 'w' });
          } else L.dot(0, 0, { color: 'red', r: 5.5, label: 'f(x) = 0', labelPos: 'sw' });
          L.dot(al[0], al[1], { color: 'gold', r: 6, label: inE ? 'α(x) = φ(0+1) = 1' : 'α(x)', labelPos: inE ? 'ne' : (al[1] >= 0 ? 'n' : 's') });
          // right
          if (F.E) { R.vband(F.E[0], F.E[1], { color: 'red', alpha: 0.12 }); R.tex('E=\\{f=0\\}', (F.E[0] + F.E[1]) / 2, 1.2, { color: 'red', baseline: 'top', dy: 4, size: 13 }); }
          R.fn((t) => f(t)[0], { domain: [0, 1], color: 'teal', width: 2 });
          if (which.value !== 'real') R.fn((t) => f(t)[1], { domain: [0, 1], color: 'purple', width: 2 });
          R.fn((t) => Math.hypot(...f(t)), { domain: [0, 1], color: 'accent', width: 2.6 });
          R.vline(x, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(x, r, { color: 'accent', r: 4 });
          v.legend(which.value === 'real'
            ? [['teal', '$f=\\Re f$'], ['accent', '$|f|$'], ['gold', '$\\alpha=\\operatorname{sgn} f$ (with $\\alpha=1$ where $f=0$)', { dot: true }]]
            : [['teal', '$\\Re f$'], ['purple', '$\\Im f$'], ['accent', '$|f|$'], ['gold', '$\\alpha(x)$ on the unit circle', { dot: true }], ['red', '$E=\\{f=0\\}$', { area: true }]]);
          st = { x, re, im, r, al, inE };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const c = (a, b) => `${v.fix(a, 3)} ${b < 0 ? '-' : '+'} ${v.fix(Math.abs(b), 3)}\\,i`;
          if (s.inE) return `$x=${v.fix(s.x, 3)}\\in E$: $f(x)=0$, and $\\alpha(x)=\\varphi(f(x)+\\chi_E(x))=\\varphi(1)=1$, so still $f(x)=\\alpha(x)|f(x)|$.`;
          return `$x=${v.fix(s.x, 3)}$: $f(x)=${c(s.re, s.im)}$, $|f(x)|=${v.fix(s.r, 3)}$, $\\alpha(x)=${c(s.al[0], s.al[1])}$, and $\\alpha(x)|f(x)| = ${c(s.al[0] * s.r, s.al[1] * s.r)} = f(x)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'The σ-algebra generated by a family of sets',
      statement: String.raw`If $\mathscr F$ is any collection of subsets of a set $X$, there is a smallest σ-algebra $\mathfrak M^*$ in $X$ containing $\mathscr F$: that is, $\mathscr F\subset\mathfrak M^*$, and $\mathfrak M^*\subset\mathfrak M$ for every σ-algebra $\mathfrak M$ in $X$ with $\mathscr F\subset\mathfrak M$. It is called the σ-algebra **generated** by $\mathscr F$.`,
      idea: String.raw`At least one σ-algebra contains $\mathscr F$, namely the family of all subsets of $X$. Let $\mathfrak M^*$ be the intersection of all σ-algebras containing $\mathscr F$. Each of the properties (i)–(iii) in Definition 1.3 survives intersection, so $\mathfrak M^*$ is a σ-algebra; it contains $\mathscr F$ and lies inside every competitor by construction.`,
      caption: String.raw`Three discs $A,B,C$ generate $\mathfrak M^*$. Its atoms are the nonempty Venn cells such as $AB^cC=A\cap B^c\cap C$ (one colour each): every σ-algebra containing $A,B,C$ must contain them, and the unions of atoms already form a σ-algebra — so that is $\mathfrak M^*$. Drag the discs to create or destroy atoms, and click atoms to assemble a member $S$ of $\mathfrak M^*$.`,
      deps: ['rca-1.3'],
      tags: ['σ-algebra'],
      viz(v) {
        const M = v.M;
        const nGen = v.select('generators', [{ value: 1, label: '$\\{A\\}$' }, { value: 2, label: '$\\{A,B\\}$' }, { value: 3, label: '$\\{A,B,C\\}$' }], 3);
        const S = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 380, title: 'drag the discs, click atoms' });
        const R = v.stage({ x: [0, 1], y: [0, 8.4], axes: false, height: 380, weight: 0.62, minWidth: 220, title: 'the atoms of $\\mathfrak M^*$ ($\\checkmark$ = in $S$)' });
        const RAD = [0.235, 0.235, 0.225];
        const H = [S.handle(0.36, 0.6, { color: 'ink', r: 6 }), S.handle(0.64, 0.6, { color: 'ink', r: 6 }), S.handle(0.5, 0.36, { color: 'ink', r: 6 })];
        const names = ['A', 'B', 'C'];
        const cols = ['gray', 'blue', 'orange', 'purple', 'green', 'teal', 'pink', 'gold'];
        let sel = new Set([7, 2]);
        const sig = (x, y, k) => { let b = 0; for (let i = 0; i < k; i++) if ((x - H[i].x) ** 2 + (y - H[i].y) ** 2 < RAD[i] ** 2) b |= 1 << i; return b; };
        const atomTex = (b, k) => (k === 0 ? 'X' : names.slice(0, k).map((n, i) => (b >> i & 1 ? n : `${n}^c`)).join(''));
        S.onClick((x, y) => { if (x < 0 || x > 1 || y < 0 || y > 1) return; const b = sig(x, y, nGen.value); if (sel.has(b)) sel.delete(b); else sel.add(b); });
        let rowsShown = [];
        R.onClick((x, y) => { const i = Math.floor(8.2 - y); const b = rowsShown[i]; if (b == null) return; if (sel.has(b)) sel.delete(b); else sel.add(b); });
        let st = null;
        v.render(() => {
          const k = nGen.value;
          H.forEach((h, i) => { h.visible = i < k; });
          // atoms present + label positions (chamfer distance to other atoms)
          const N = 64, lab = new Int8Array(N * N), dist = new Float32Array(N * N);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) lab[j * N + i] = sig((i + 0.5) / N, (j + 0.5) / N, k);
          for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
            const p = j * N + i; let d = Math.min(i + 1, j + 1, N - i, N - j);
            if (i > 0) d = Math.min(d, lab[p - 1] !== lab[p] ? 1 : dist[p - 1] + 1);
            if (j > 0) d = Math.min(d, lab[p - N] !== lab[p] ? 1 : dist[p - N] + 1);
            dist[p] = d;
          }
          for (let j = N - 1; j >= 0; j--) for (let i = N - 1; i >= 0; i--) {
            const p = j * N + i; let d = dist[p];
            if (i < N - 1) d = Math.min(d, lab[p + 1] !== lab[p] ? 1 : dist[p + 1] + 1);
            if (j < N - 1) d = Math.min(d, lab[p + N] !== lab[p] ? 1 : dist[p + N] + 1);
            dist[p] = d;
          }
          const best = new Map();
          for (let p = 0; p < N * N; p++) { const b = lab[p]; const cur = best.get(b); if (!cur || dist[p] > cur.d) best.set(b, { d: dist[p], x: (p % N + 0.5) / N, y: (Math.floor(p / N) + 0.5) / N }); }
          for (const b of [...sel]) if (!best.has(b)) sel.delete(b);
          const pan = v.rgb('panel'); const base = cols.map((c) => v.rgb(c));
          const mixc = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
          S.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0 || y > 1) return null;
            const b = sig(x, y, k);
            return mixc(pan, base[b], sel.has(b) ? 0.6 : 0.14);
          }, { key: `${k}|${H.map((h) => h.x.toFixed(4) + ',' + h.y.toFixed(4)).join('|')}|${[...sel].sort().join(',')}|${v.color('panel')}`, res: 2 });
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          const cx = M.mean(H.slice(0, k).map((h) => h.x)), cy = M.mean(H.slice(0, k).map((h) => h.y));
          for (let i = 0; i < k; i++) {
            S.circle(H[i].x, H[i].y, RAD[i], { color: 'ink', width: 1.6 });
            let dx = H[i].x - cx, dy = H[i].y - cy; const L = Math.hypot(dx, dy); if (L < 1e-6) { dx = -0.7; dy = 0.7; } else { dx /= L; dy /= L; }
            S.tex(names[i], H[i].x + dx * (RAD[i] + 0.035), H[i].y + dy * (RAD[i] + 0.035), { color: 'ink', size: 19 });
          }
          // right: one row per atom
          const order = [...best.keys()].sort((a, b) => a - b);
          rowsShown = order;
          order.forEach((b, i) => {
            const y = 7.7 - i;
            const on = sel.has(b);
            R.rect(0.04, y - 0.36, 0.2, y + 0.36, { fill: cols[b], fillAlpha: on ? 0.62 : 0.14, color: cols[b], width: 1.2 });
            R.tex(atomTex(b, k), 0.27, y, { color: on ? 'ink' : 'muted', align: 'left', size: 15 });
            if (on) R.tex('\\checkmark', 0.92, y, { color: 'green', align: 'right', size: 16 });
          });
          R.tex(`${order.length}\\text{ atoms}\\;\\Rightarrow\\;2^{${order.length}}=${2 ** order.length}\\text{ members}`, 0.04, 7.7 - order.length + 0.2, { color: 'muted', size: 14, align: 'left', baseline: 'top' });
          for (const [b, p] of best) if (p.d >= 3) S.tex(atomTex(b, k), p.x, p.y, { color: sel.has(b) ? 'ink' : 'muted', size: 12.5 });
          st = { m: best.size, k, atoms: [...best.keys()] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const chosen = s.atoms.filter((b) => sel.has(b));
          const sTex = chosen.length ? chosen.map((b) => atomTex(b, s.k)).join('\\cup ') : '\\emptyset';
          return `${s.k} generator${s.k > 1 ? 's' : ''} → ${s.m} atoms, so $\\mathfrak M^*$ has $2^{${s.m}} = ${2 ** s.m}$ members. Selected: $S = ${sTex}\\in\\mathfrak M^*$ (and $S^c$ is the union of the other ${s.m - chosen.length} atoms).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Borel sets and Borel mappings',
      statement: String.raw`Let $X$ be a topological space. By Theorem 1.10 there is a smallest σ-algebra $\mathscr B$ in $X$ containing every open set; its members are the **Borel sets** of $X$. In particular closed sets, countable unions of closed sets ($F_\sigma$'s) and countable intersections of open sets ($G_\delta$'s) are Borel sets. Regarding $X$ as the measurable space $(X,\mathscr B)$, a map $f$ of $X$ into a topological space is a **Borel mapping** (Borel measurable) when $f^{-1}(V)\in\mathscr B$ for every open $V$; continuous maps are Borel mappings.`,
      idea: String.raw`The Borel σ-algebra is the bridge between the two parallel theories: once $X$ carries $\mathscr B$, every continuous map is measurable, and every measurable function can be composed with Borel maps (Theorem 1.12(d)).`,
      deps: ['rca-1.10', 'rca-1.2'],
      tags: ['Borel sets', 'definitions'],
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Preimages of Borel sets; measurability via rays',
      statement: String.raw`Let $\mathfrak M$ be a σ-algebra in $X$, let $Y$ be a topological space, and let $f:X\to Y$.
(a) The sets $E\subset Y$ with $f^{-1}(E)\in\mathfrak M$ form a σ-algebra $\Omega$ in $Y$.
(b) If $f$ is measurable and $E$ is a Borel set in $Y$, then $f^{-1}(E)\in\mathfrak M$.
(c) If $Y=[-\infty,\infty]$ and $f^{-1}\big((\alpha,\infty]\big)\in\mathfrak M$ for every real $\alpha$, then $f$ is measurable.
(d) If $f$ is measurable and $g:Y\to Z$ is a Borel mapping into a topological space $Z$, then $g\circ f$ is measurable.`,
      idea: String.raw`(a) Preimages commute with complements and countable unions. (b) If $f$ is measurable, $\Omega$ contains every open set, hence every Borel set (minimality, 1.10). (c) Now $\Omega$ contains every ray $(\alpha,\infty]$, hence $[-\infty,\beta)=\bigcup_n\big((\beta-\tfrac1n,\infty]\big)^c$ and every segment $(\alpha,\beta)$; since each open subset of $[-\infty,\infty]$ is a countable union of segments and rays, $\Omega$ contains all open sets. (d) $(g\circ f)^{-1}(V)=f^{-1}(g^{-1}(V))$ with $g^{-1}(V)$ Borel; apply (b).`,
      caption: String.raw`The proof of (c) on $X=[0,1]$, where only the super-level sets $\{f>\alpha\}$ are assumed measurable. Drag the levels $\alpha$ and $\beta$ (right edge) and raise $n$: the gold set $\{f>\alpha\}\cap\{f>\beta-\tfrac1n\}^c$ is built from rays alone, and as $n\to\infty$ it increases to $f^{-1}((\alpha,\beta))$ (green).`,
      deps: ['rca-1.10', 'rca-1.11', 'rca-1.3'],
      tags: ['measurability', 'Borel sets'],
      viz(v) {
        const M = v.M;
        const f = (x) => 1.3 + 0.72 * Math.sin(9 * x) + 0.33 * Math.sin(23 * x + 1);
        const T = v.stage({ x: [0, 1.11], y: [0, 2.7], axes: 'box', height: 270, full: true, title: '$f : X\\to[-\\infty,\\infty]$ on $X=[0,1]$', xticks: [0, 0.2, 0.4, 0.6, 0.8, 1] });
        const B = v.stage({ x: [0, 1.11], y: [0, 4.3], axes: false, height: 230, full: true });
        const HX = 1.065, con = (x, y) => [HX, M.clamp(y, 0.05, 2.65)];
        const ha = T.handle(HX, 0.95, { color: 'blue', label: 'α', constrain: con });
        const hb = T.handle(HX, 1.85, { color: 'green', label: 'β', constrain: con });
        ha.labelPos = 'n'; hb.labelPos = 'n';
        const nS = v.slider('$n$', 1, 60, 3, { int: true });
        let st = null;
        v.render(() => {
          const al = Math.min(ha.y, hb.y), be = Math.max(ha.y, hb.y), n = nS.value, bn = be - 1 / n;
          T.hband(al, be, { color: 'green', alpha: 0.07 });
          T.hline(al, { color: 'blue', dash: [5, 4], width: 1.4 });
          T.hline(be, { color: 'green', dash: [5, 4], width: 1.4 });
          T.hline(bn, { color: 'orange', dash: [2, 3], width: 1.4 });
          T.vband(1, 1.11, { color: 'grid', alpha: 0.5 });
          T.tex('\\beta-\\tfrac1n', 1.006, bn, { color: 'orange', align: 'left', baseline: 'top', dy: 2, size: 12.5 });
          T.fn(f, { domain: [0, 1], color: 'ink', width: 2 });
          const xs = M.linspace(0, 1, 1200);
          T.path(xs.map((x) => (f(x) > al && f(x) < be ? [x, f(x)] : null)), { color: 'green', width: 3.6 });
          T.path(xs.map((x) => (f(x) > al && f(x) <= bn ? [x, f(x)] : null)), { color: 'gold', width: 3.6 });
          const rows = [
            ['\\{f>\\alpha\\}', 'blue', intervalsWhere((x) => f(x) > al, 0, 1, 1500)],
            ['\\{f>\\beta-\\tfrac1n\\}^c', 'orange', intervalsWhere((x) => !(f(x) > bn), 0, 1, 1500)],
            ['\\{f>\\alpha\\}\\cap\\{f>\\beta-\\tfrac1n\\}^c', 'gold', intervalsWhere((x) => f(x) > al && !(f(x) > bn), 0, 1, 1500)],
            ['f^{-1}((\\alpha,\\beta))', 'green', intervalsWhere((x) => f(x) > al && f(x) < be, 0, 1, 1500)],
          ];
          rows.forEach(([lab, col, ivs], i) => {
            const y0 = 3.3 - i * 1.05;
            B.rect(0, y0, 1, y0 + 0.32, { fill: 'grid', fillAlpha: 0.7, stroke: false });
            drawRow(B, ivs, y0, y0 + 0.32, col, 0.85);
            B.tex(lab, 0.004, y0 + 0.36, { color: col, align: 'left', baseline: 'bottom', size: 13.5 });
          });
          st = { m3: totalLength(rows[2][2]), m4: totalLength(rows[3][2]), n };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$n=${s.n}$: the gold set has length $${v.fix(s.m3, 4)}$, increasing to the length $${v.fix(s.m4, 4)}$ of $f^{-1}((\\alpha,\\beta))$ — because $[-\\infty,\\beta)=\\bigcup_n\\big((\\beta-\\tfrac1n,\\infty]\\big)^c$.`;
        });
      },
    },
  ],
};
