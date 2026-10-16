// Topology — Chapter 1: Topological spaces (items 1.9–1.16; 1.1–1.8 are in ch01.js)
import { ALL, RAT, psFrom, psClos, psComp, psEq, psKey, psTex, drawPSet } from './ch01.shared.js';

/** Distance from p to the closed segment [a, b]. */
function segDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
/** Kuratowski orbit of A under closure k and complement c, breadth first: [{set, word}]. */
function orbit(A) {
  const seen = new Map([[psKey(A), { set: A, word: 'A' }]]), q = [A];
  while (q.length) {
    const X = q.shift(), w = seen.get(psKey(X)).word;
    for (const [op, f] of [['k', psClos], ['c', psComp]]) { const Y = f(X), key = psKey(Y); if (!seen.has(key)) { seen.set(key, { set: Y, word: op + w }); q.push(Y); } }
  }
  return [...seen.values()];
}

export default {
  collection: 'top',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Closure as A together with its limit points',
      statement: String.raw`Let $A$ be a subset of a topological space $X$. A point $x\in X$ is a **limit point** (accumulation point) of $A$ if every open set containing $x$ meets $A$ in some point other than $x$; write $A'$ for the set of limit points. Then
$$\overline A=A\cup A'.$$
In particular $A$ is closed if and only if it contains all its limit points. Points of $A\setminus A'$ are the **isolated points** of $A$.`,
      idea: String.raw`By 1.8, $x\in\overline A$ iff every open $U\ni x$ meets $A$. If $x\in A'$ each such $U$ meets $A\setminus\{x\}$, so $x\in\overline A$; and $A\subset\overline A$. Conversely, if $x\in\overline A$ but $x\notin A$, then each $U\ni x$ meets $A$ in a point that cannot be $x$ — so $x\in A'$. This is Rudin's 2.27 with metric balls replaced by open sets. In a metric space, a point is a limit point exactly when $d(x,A\setminus\{x\})=0$, which is what the probe measures.`,
      caption: String.raw`$A$ is a spiralling sequence $x_n$ (but not its centre $L$), an open segment, an open disc and some single points (click to add more). Drag the probe $p$ — it snaps to $L$, to the $x_n$, to the segment's ends and to the added points — and shrink the ball radius $\eps$: the gold points are $B(p,\eps)\cap(A\setminus\{p\})$. Switch on $A'$ to see the limit points (green) and the isolated points (red).`,
      deps: ['top-1.8', 'pma-2.27'],
      refs: ['Munkres §17'],
      tags: ['closure', 'limit points'],
      viz(v) {
        const L = [-1.35, 0.3], N = 3000;
        const xs = Array.from({ length: N }, (_, i) => { const n = i + 1, r = 1.25 / n ** 0.6; return [L[0] + r * Math.cos(0.9 * n), L[1] + r * Math.sin(0.9 * n)]; });
        const P0 = [0.45, -1.15], P1 = [2.05, 0.25], C = [1.55, 1.15], CR = 0.42;
        let pts = [[-2.35, -1.25], [2.45, -1.3]];
        const eps = v.slider('ball radius $\\varepsilon$', 0.002, 1, 0.3, { log: true });
        const showA = v.toggle("show $A'$ and isolated points", false);
        v.button('Remove added points', () => { pts = pts.slice(0, 2); });
        const s = v.stage({ x: [-2.8, 2.8], y: [-1.75, 1.85], equal: true, axes: false, height: 370 });
        const snap = (x, y) => {
          const cands = [L, P0, P1, ...xs.slice(0, 25), ...pts];
          for (const q of cands) if (Math.hypot(x - q[0], y - q[1]) < 0.07) return [q[0], q[1]];
          return [x, y];
        };
        const p = s.handle(L[0], L[1], { color: 'accent', label: '$p$', constrain: snap });
        s.onClick((x, y) => { if (Math.hypot(x - p.x, y - p.y) > 0.15) pts.push([x, y]); });
        const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-12 && Math.abs(a[1] - b[1]) < 1e-12;
        let st = null;
        v.render(() => {
          const P = [p.x, p.y], e = eps.value;
          // the set A
          s.circle(C[0], C[1], CR, { fill: 'blue', fillAlpha: 0.15, color: 'blue', width: 1.5, dash: [5, 4] });
          s.line(P0[0], P0[1], P1[0], P1[1], { color: 'blue', width: 3 });
          s.dot(P0[0], P0[1], { hollow: true, color: 'blue' }); s.dot(P1[0], P1[1], { hollow: true, color: 'blue' });
          s.dots(xs.slice(0, 400), { r: 2.4, color: 'blue' });
          for (const q of pts) s.dot(q[0], q[1], { r: 3.5, color: 'blue' });
          s.dot(L[0], L[1], { hollow: true, color: 'muted', r: 3.5, label: 'L', labelPos: 'nw' });
          if (showA.value) {
            s.circle(C[0], C[1], CR, { color: 'green', width: 2.2 });
            s.line(P0[0], P0[1], P1[0], P1[1], { color: 'green', width: 1.4 });
            for (const q of [L, P0, P1]) s.circle(q[0], q[1], 0.07, { color: 'green', width: 2.2 });
            for (const q of [...xs.slice(0, 16), ...pts]) s.circle(q[0], q[1], 0.065, { color: 'red', width: 1.8 });
          }
          // the probe and its ball
          s.circle(P[0], P[1], e, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.8 });
          const hits = [];
          for (const q of xs) if (!same(q, P) && Math.hypot(q[0] - P[0], q[1] - P[1]) < e) hits.push(q);
          for (const q of pts) if (!same(q, P) && Math.hypot(q[0] - P[0], q[1] - P[1]) < e) hits.push(q);
          s.dots(hits.slice(0, 600), { r: 2.8, color: 'gold' });
          // portion of the segment inside the ball
          const segPts = []; for (let i = 1; i < 400; i++) { const t = i / 400, q = [P0[0] + t * (P1[0] - P0[0]), P0[1] + t * (P1[1] - P0[1])]; segPts.push(Math.hypot(q[0] - P[0], q[1] - P[1]) < e && !same(q, P) ? q : null); }
          s.path(segPts, { color: 'gold', width: 5 });
          // distance from p to A \ {p}
          let dS = Math.hypot(P[0] - L[0], P[1] - L[1]);
          for (const q of xs) { if (same(q, P)) continue; const d = Math.hypot(q[0] - P[0], q[1] - P[1]); if (d < dS) dS = d; }
          const dE = segDist(P, P0, P1), dD = Math.max(0, Math.hypot(P[0] - C[0], P[1] - C[1]) - CR);
          let dQ = Infinity; for (const q of pts) if (!same(q, P)) dQ = Math.min(dQ, Math.hypot(q[0] - P[0], q[1] - P[1]));
          const delta = Math.min(dS, dE, dD, dQ);
          const onSeg = dE < 1e-9 && !same(P, P0) && !same(P, P1);
          const inA = xs.some((q) => same(q, P)) || onSeg || Math.hypot(P[0] - C[0], P[1] - C[1]) < CR || pts.some((q) => same(q, P));
          const lim = delta < 1e-9;
          s.corner(`d(p, A∖{p}) = ${lim ? '0' : v.fmt(delta, 4)}`, 'tl', { color: lim ? 'green' : 'ink', weight: 700, plate: true });
          st = { delta, lim, inA, nh: hits.length + segPts.filter(Boolean).length, e };
        });
        v.legend([['blue', '$A$', { dot: true }], ['gold', '$B(p,\\varepsilon)\\cap(A\\setminus\\{p\\})$', { dot: true }], ['green', "$A'$ (limit points)"], ['red', 'isolated points of $A$']]);
        v.readout(() => {
          if (!st) return '';
          const { delta, lim, inA, e } = st;
          const meets = delta < e;
          const cls = lim ? (inA ? '$p\\in A\\cap A\'$: a limit point that belongs to $A$.' : "$p\\in A'\\setminus A$: a limit point **not** in $A$ — it lies in $\\overline A$ only because it is a limit point.")
            : inA ? '$p\\in A\\setminus A\'$: an **isolated point** of $A$ — in $\\overline A$ because it is in $A$.' : '$p\\notin\\overline A$: a small ball misses $A$ entirely.';
          return `The ball ${meets ? '**meets**' : 'does **not** meet'} $A\\setminus\\{p\\}$ for $\\varepsilon=${v.fmt(e, 3)}$; it does so for every $\\varepsilon$ iff $d(p,A\\setminus\\{p\\})=0$. ${cls} Every point of $\\overline A$ is of one of the first three kinds: $\\overline A=A\\cup A'$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Kuratowski closure–complement problem',
      statement: String.raw`Let $X$ be a topological space and $A\subset X$. Applying the closure operator $k$ and the complement operator $c$ to $A$ repeatedly, in any order, produces at most **14** distinct sets. The bound is sharp: for $X=\R$ the set
$$A=(0,1)\cup(1,2)\cup\{3\}\cup\bigl(\Q\cap(4,5)\bigr)$$
yields exactly 14.`,
      idea: String.raw`Since $cc=\mathrm{id}$ and $kk=k$, every word reduces to an alternating one. The key identity is $kckckck=kck$. With $i=ckc$ the interior operator it reads $kiki=ki$ (applied to $cA$): $ki\,A$ is closed, so $iki\,A\subset ki\,A$ and hence $kiki\,A\subset ki\,A$; conversely $i\,A\subset iki\,A$ because $i\,A$ is open and inside $ki\,A$, so $ki\,A\subset kiki\,A$. Hence the alternating words starting with $k$ repeat from length 7 on, and there are at most 7 sets $A, kA, ckA, kckA, ckckA, kckckA, ckckckA$ plus their complements — 14 in all. The example needs each part to feed one step: a removed point $1$ (closure fills it), an isolated point $3$, and the rationals of $(4,5)$, whose closure is $[4,5]$ but whose interior is empty.`,
      caption: String.raw`Press **closure** and **complement** to walk from $A$; each set of the orbit is drawn on its own number line (bars: intervals; dots: rationals only; dashes: irrationals only; hollow ends excluded). Sets you have reached are bright; the readout counts them and checks $kckckck=kck$ on every set of the orbit. Other starting sets give fewer than 14.`,
      deps: ['top-1.8'],
      refs: ['Munkres §17'],
      tags: ['closure', 'combinatorics'],
      credit: 'Kuratowski, 1922',
      viz(v) {
        const STARTS = {
          k14: { label: '$(0,1)\\cup(1,2)\\cup\\{3\\}\\cup(\\Q\\cap(4,5))$', A: psFrom([[0, 1], [1, 2], [4, 5, RAT]], [3]) },
          int: { label: '$(0,1)$', A: psFrom([[0, 1]]) },
          gap: { label: '$(0,1)\\cup(1,2)$', A: psFrom([[0, 1], [1, 2]]) },
          rat: { label: '$\\Q\\cap(0,5)$', A: psFrom([[0, 5, RAT]]) },
        };
        let orb = null, cur = 0, seen = new Set([0]), path = 'A';
        const load = () => { orb = orbit(STARTS[start.value].A); cur = 0; seen = new Set([0]); path = 'A'; };
        const start = v.select('start', Object.entries(STARTS).map(([value, o]) => ({ value, label: o.label })), 'k14', { onChange: () => load() });
        const go = (f, ch) => { const Y = f(orb[cur].set), j = orb.findIndex((o) => psEq(o.set, Y)); cur = j; seen.add(j); path = ch + path; };
        v.button('closure k', () => go(psClos, 'k'));
        v.button('complement c', () => go(psComp, 'c'));
        v.button('Visit all', () => { orb.forEach((_, j) => seen.add(j)); });
        load();
        const s = v.stage({ x: [-1.25, 6.1], y: [-0.9, 14.3], axes: false, height: 470, full: true });
        s.onClick((x, y) => { const j = Math.round(13.6 - y); if (orb && j >= 0 && j < orb.length && seen.has(j)) cur = j; });
        v.render(() => {
          const n = orb.length;
          for (let x = -1; x <= 6; x++) { s.line(x, -0.35, x, 13.9, { color: 'grid', width: 0.8 }); s.text(String(x).replace('-', '−'), x, -0.6, { align: 'center', size: 10.5, color: 'muted' }); }
          orb.forEach((o, j) => {
            const y = 13.6 - j, on = seen.has(j);
            if (j === cur) s.rect(-1.22, y - 0.45, 6.08, y + 0.45, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.2, radius: 6 });
            s.text(o.word, -0.62, y, { align: 'right', size: 12, weight: 700, color: on ? (j === cur ? 'accent' : 'ink') : 'faint' });
            drawPSet(s, o.set, y, { color: j === cur ? 'accent' : on ? 'ink' : 'muted', alpha: on ? 1 : 0.42, width: 4.5, r: 3.6, labels: false, lo: -0.5 });
          });
          s.corner(`reached ${seen.size} of ${n}`, 'tr', { color: seen.size === n ? 'green' : 'muted', weight: 700, plate: true });
        });
        v.readout(() => {
          if (!orb) return '';
          const fmt = (x) => String(x).replace('-', '−');
          const kc = (X) => psClos(psComp(X)), ok = orb.every((o) => { const kA = psClos(o.set); return psEq(kc(kc(kc(kA))), kc(kA)); });
          return `Current set (${orb[cur].word}, reached by the word ${path.length > 18 ? '…' + path.slice(-17) : path}): $${psTex(orb[cur].set, fmt)}$. This start has **${orb.length}** distinct sets in its orbit; $kckckck=kck$ ${ok ? 'holds on all of them ✓' : 'fails ✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Hausdorff spaces',
      statement: String.raw`A topological space $X$ is **Hausdorff** if any two distinct points $x\ne y$ have disjoint neighbourhoods: open sets $U\ni x$ and $V\ni y$ with $U\cap V=\varnothing$.

Every metric space is Hausdorff; subspaces and products of Hausdorff spaces are Hausdorff; finite sets in a Hausdorff space are closed. An infinite set with the cofinite topology, the line with two origins and the Sierpiński space are not Hausdorff.`,
      idea: String.raw`In a metric space the balls of radius $\tfrac12 d(x,y)$ about $x$ and $y$ are disjoint by the triangle inequality. In the cofinite topology two nonempty open sets omit only finitely many points each, so on an infinite set they always share infinitely many points. The line with two origins looks like $\R$ near every point, yet every neighbourhood of one origin meets every neighbourhood of the other in a punctured interval. In the Sierpiński space the only open set containing $0$ is the whole space.`,
      caption: String.raw`Drag the points $x$ and $y$ and shrink their neighbourhoods with the slider ($U$ blue above the line, $V$ orange below, their intersection red on it). In the cofinite topology the slider instead deletes more and more points from each neighbourhood (×): the intersection stays infinite. With two origins, $x$ and $y$ are the two origins.`,
      deps: ['top-1.1', 'top-1.2'],
      see: ['rca-2.3'],
      refs: ['Munkres §17'],
      tags: ['separation', 'Hausdorff'],
      credit: 'Hausdorff, 1914',
      viz(v) {
        const mode = v.select('space', [{ value: 'R', label: '$\\R$' }, { value: 'cof', label: 'cofinite $\\R$' }, { value: 'two', label: 'two origins' }, { value: 'sier', label: 'Sierpiński' }], 'R');
        const r = v.slider('neighbourhood radius $r$', 0.05, 2, 0.9, { step: 0.01 });
        const k = v.slider('points deleted from each', 0, 14, 6, { int: true });
        const s = v.stage({ x: [-3.3, 3.3], y: [-1.05, 1.15], axes: false, height: 230, full: true });
        const hx = s.handle(-0.7, 0, { color: 'blue', label: '$x$', labelPos: 'n', constrain: (x) => [v.M.clamp(x, -3, 3), 0] });
        const hy = s.handle(0.6, 0, { color: 'orange', label: '$y$', labelPos: 's', constrain: (x) => [v.M.clamp(x, -3, 3), 0] });
        let st = null;
        v.render(() => {
          const m = mode.value;
          r.el.hidden = m === 'cof' || m === 'sier'; k.el.hidden = m !== 'cof';
          hx.visible = hy.visible = m === 'R' || m === 'cof';
          const UY = 0.45, VY = -0.45;
          if (m === 'sier') {
            for (const [x, lab] of [[-1.2, '0'], [1.2, '1']]) { s.dot(x, 0, { r: 7, color: 'ink' }); s.text(lab, x, -0.3, { align: 'center', size: 14, weight: 700 }); }
            s.rect(-1.7, UY - 0.12, 1.7, UY + 0.12, { fill: 'blue', fillAlpha: 0.35, stroke: false, radius: 6 });
            s.rect(0.8, VY - 0.12, 1.6, VY + 0.12, { fill: 'orange', fillAlpha: 0.45, stroke: false, radius: 6 });
            s.dot(1.2, 0, { r: 10, color: 'red', hollow: true, width: 2.5 });
            s.text('U = {0,1}: the only open set containing 0', -1.7, UY + 0.32, { size: 11.5, color: 'blue', weight: 600 });
            s.text('V = {1}', 0.8, VY - 0.32, { size: 11.5, color: 'orange', weight: 600 });
            st = { sep: false, m };
            return;
          }
          s.line(-3.2, 0, 3.2, 0, { color: 'ink', width: 1.6 });
          if (m === 'two') {
            const R = r.value;
            s.dot(0, 0.16, { r: 5, color: 'blue' }); s.dot(0, -0.16, { r: 5, color: 'orange' });
            s.dot(0, 0, { r: 4, color: 'panel', ring: false });
            s.text('0₁', 0.12, 0.3, { size: 12, color: 'blue', weight: 700 }); s.text('0₂', 0.12, -0.32, { size: 12, color: 'orange', weight: 700 });
            s.line(-R, UY, R, UY, { color: 'blue', width: 7, alpha: 0.5 }); s.dot(0, UY, { r: 5, color: 'panel' }); s.dot(0, UY, { r: 3, color: 'blue' });
            s.line(-R * 0.8, VY, R * 0.8, VY, { color: 'orange', width: 7, alpha: 0.5 }); s.dot(0, VY, { r: 5, color: 'panel' }); s.dot(0, VY, { r: 3, color: 'orange' });
            s.line(-R * 0.8, 0, -0.03, 0, { color: 'red', width: 5 }); s.line(0.03, 0, R * 0.8, 0, { color: 'red', width: 5 });
            s.text('U = (−r,0) ∪ {0₁} ∪ (0,r)', -R, UY + 0.3, { size: 11.5, color: 'blue', weight: 600 });
            s.text('V = (−r′,0) ∪ {0₂} ∪ (0,r′)', -R * 0.8, VY - 0.3, { size: 11.5, color: 'orange', weight: 600 });
            st = { sep: false, m, R };
            return;
          }
          const x = hx.x, y = hy.x;
          if (m === 'R') {
            const R = r.value;
            s.line(x - R, UY, x + R, UY, { color: 'blue', width: 7, alpha: 0.55 }); s.dot(x - R, UY, { hollow: true, color: 'blue' }); s.dot(x + R, UY, { hollow: true, color: 'blue' });
            s.line(y - R, VY, y + R, VY, { color: 'orange', width: 7, alpha: 0.55 }); s.dot(y - R, VY, { hollow: true, color: 'orange' }); s.dot(y + R, VY, { hollow: true, color: 'orange' });
            const lo = Math.max(x, y) - R, hi = Math.min(x, y) + R;
            if (lo < hi) s.line(lo, 0, hi, 0, { color: 'red', width: 5 });
            st = { sep: !(lo < hi), m, d: Math.abs(x - y), R };
            return;
          }
          // cofinite: U = R minus points near y, V = R minus points near x (the adversary deletes points to keep them apart)
          const FU = Array.from({ length: k.value }, (_, i) => y + (i - (k.value - 1) / 2) * 0.17).filter((t) => Math.abs(t - x) > 1e-9);
          const FV = Array.from({ length: k.value }, (_, i) => x + (i - (k.value - 1) / 2) * 0.17).filter((t) => Math.abs(t - y) > 1e-9);
          const gaps = (Y, F, col) => { s.line(-3.2, Y, 3.2, Y, { color: col, width: 6, alpha: 0.5 }); for (const t of F) { s.dot(t, Y, { r: 4.5, color: 'panel', ring: false }); s.text('×', t, Y, { align: 'center', size: 13, color: 'red', weight: 700 }); } };
          gaps(UY, FU, 'blue'); gaps(VY, FV, 'orange');
          s.line(-3.2, 0, 3.2, 0, { color: 'red', width: 4, alpha: 0.85 });
          for (const t of [...FU, ...FV]) s.dot(t, 0, { r: 4, color: 'panel', ring: false });
          s.text('U = ℝ ∖ (finite set)', -3.2, UY + 0.3, { size: 11.5, color: 'blue', weight: 600 });
          s.text('V = ℝ ∖ (finite set)', -3.2, VY - 0.3, { size: 11.5, color: 'orange', weight: 600 });
          st = { sep: false, m, nF: FU.length + FV.length };
        });
        v.legend([['blue', '$U\\ni x$', { area: true }], ['orange', '$V\\ni y$', { area: true }], ['red', '$U\\cap V$']]);
        v.readout(() => {
          if (!st) return '';
          const { sep, m } = st;
          if (m === 'R') return sep ? `$U\\cap V=\\varnothing$: separated ✓ — any $r\\le\\tfrac12|x-y|=${v.fix(st.d / 2, 3)}$ works. **$\\R$ is Hausdorff.**` : `The intervals overlap; shrink $r$ below $\\tfrac12|x-y|=${v.fix(st.d / 2, 3)}$ to separate the points.`;
          if (m === 'cof') return `Deleting ${st.nF} points in all still leaves $U\\cap V=\\R\\setminus(F_U\\cup F_V)$, an infinite set: two nonempty cofinite sets always meet. **Not Hausdorff.**`;
          if (m === 'two') return `However small $r$ and $r'$ are, $U\\cap V\\supset(-\\min(r,r'),0)\\cup(0,\\min(r,r'))\\ne\\varnothing$: the two origins cannot be separated, although every point has neighbourhoods homeomorphic to intervals. **Not Hausdorff.**`;
          return 'Every open set containing $0$ is $\\{0,1\\}$, which meets every open set containing $1$. **Not Hausdorff** (not even $T_1$).';
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'Limits are unique in Hausdorff spaces',
      statement: String.raw`In a Hausdorff space a sequence converges to at most one point: if $x_n\to x$ and $x_n\to y$, then $x=y$.`,
      idea: String.raw`If $x\ne y$, choose disjoint open $U\ni x$, $V\ni y$ (1.11). Convergence to $x$ puts all but finitely many terms in $U$, hence only finitely many in $V$, so $x_n\not\to y$. Without the Hausdorff property the argument has nothing to work with: in the cofinite topology a sequence of distinct points converges to every point, and on the line with two origins $1/n$ converges to both origins.`,
      caption: String.raw`Terms $x_n$ are plotted against $n$. Drag the candidate limit $L$ (it snaps to $0$) and shrink the neighbourhood: gold terms lie in it, red ones outside, and the green line marks where the tail enters for good. The readout lists *all* limits of the sequence in the chosen space and says whether the space is Hausdorff.`,
      deps: ['top-1.11'],
      refs: ['Munkres §17'],
      tags: ['convergence', 'Hausdorff'],
      viz(v) {
        const SP = { R: { label: '$\\R$', H: true }, sorg: { label: 'Sorgenfrey', H: true }, cof: { label: 'cofinite', H: false }, two: { label: 'two origins', H: false } };
        const SQ = { inv: { label: '$1/n$', f: (n) => 1 / n }, neg: { label: '$-1/n$', f: (n) => -1 / n }, alt: { label: '$(-1)^n/n$', f: (n) => (-1) ** n / n }, pm: { label: '$(-1)^n$', f: (n) => (-1) ** n } };
        const sp = v.select('space', Object.entries(SP).map(([value, o]) => ({ value, label: o.label })), 'two');
        const sq = v.select('$x_n$', Object.entries(SQ).map(([value, o]) => ({ value, label: o.label })), 'inv');
        const eps = v.slider('neighbourhood size $\\varepsilon$', 0.01, 0.8, 0.15, { log: true });
        const k = v.slider('terms excluded by $U$', 0, 12, 5, { int: true });
        const s = v.stage({ x: [-1.5, 31], y: [-1.25, 1.3], height: 320, full: true, axes: 'box', xlabel: 'n', yticks: [[-1, '−1'], [1, '1']] });
        const hL = s.handle(-0.5, 0, { color: 'accent', label: '$L$', labelPos: 'ne', constrain: (x, y) => [-0.5, Math.abs(y) < 0.05 ? 0 : v.M.clamp(y, -1.15, 1.15)] });
        let st = null;
        const limits = (S, Q) => {
          if (Q === 'pm') return 'none';
          if (S === 'R') return 'only $0$';
          if (S === 'sorg') return Q === 'inv' ? 'only $0$ (approached from the right)' : 'none';
          if (S === 'cof') return 'every real number';
          return 'both origins $0_1$ and $0_2$';
        };
        v.render(() => {
          const S = sp.value, f = SQ[sq.value].f, L = hL.y, e = eps.value, two = S === 'two';
          eps.el.hidden = S === 'cof'; k.el.hidden = S !== 'cof';
          let inU;
          if (S === 'cof') {
            const F = []; for (let n = 1; F.length < k.value && n < 100; n++) { const t = f(n); if (Math.abs(t - L) > 1e-12 && !F.includes(t)) F.push(t); }
            s.hband(-1.25, 1.3, { color: 'orange', alpha: 0.1 });
            for (const t of F) s.hline(t, { color: 'red', width: 1.4, dash: [4, 3] });
            inU = (t) => !F.some((u) => Math.abs(u - t) < 1e-12);
          } else if (S === 'sorg') { s.hband(L, L + e, { color: 'orange', alpha: 0.18 }); s.hline(L, { color: 'orange', width: 1.6 }); s.hline(L + e, { color: 'orange', width: 1, dash: [4, 3] }); inU = (t) => t >= L && t < L + e; }
          else {
            s.hband(L - e, L + e, { color: 'orange', alpha: 0.18, edges: true });
            inU = (t) => Math.abs(t - L) < e;
          }
          if (two && Math.abs(L) < 1e-12) { s.dot(-0.5, 0.05, { r: 4, color: 'blue' }); s.dot(-0.5, -0.05, { r: 4, color: 'purple' }); s.text('0₁ and 0₂: every neighbourhood of either contains this band minus 0', 0.6, -e - 0.08, { size: 11, color: 'muted', baseline: 'top' }); }
          let last = 0; for (let n = 1; n <= 2000; n++) if (!inU(f(n))) last = n;
          const finite = last < 1500;
          for (let n = 1; n <= 30; n++) { const t = f(n); s.dot(n, t, { r: 4, color: inU(t) ? 'gold' : 'red' }); }
          if (finite && last < 30) s.vline(last + 0.5, { color: 'green', width: 1.6, dash: [6, 4] });
          st = { S, Q: sq.value, finite, last };
        });
        v.legend([['orange', 'neighbourhood $U$ of $L$', { area: true }], ['gold', '$x_n\\in U$', { dot: true }], ['red', '$x_n\\notin U$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { S, Q, finite, last } = st;
          const here = finite ? `only ${last} term${last === 1 ? '' : 's'} lie outside this $U$` : 'infinitely many terms lie outside this $U$';
          return `For $L=${v.fix(hL.y, 3)}$: ${here}. **Limits of this sequence: ${limits(S, Q)}.** The space is ${SP[S].H ? '**Hausdorff**, so there is at most one limit' : '**not Hausdorff**, and limits need not be unique'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Definition',
      name: 'Nets and their convergence',
      statement: String.raw`A **directed set** is a set $D$ with a preorder $\preceq$ in which any two elements have a common upper bound. A **net** in a space $X$ is a function $\alpha\mapsto x_\alpha$ from a directed set $D$ to $X$. The net **converges** to $x$ if for every open $U\ni x$ there is $\alpha_0\in D$ with $x_\alpha\in U$ for all $\alpha\succeq\alpha_0$.

Sequences are the nets indexed by $\N$. Other standard index sets: the neighbourhoods of a point ordered by reverse inclusion, and the finite subsets of a set ordered by inclusion — the net of finite partial sums $F\mapsto\sum_{k\in F}a_k$ of a series converges exactly when the series converges unconditionally, i.e. (for real terms) when $\sum|a_k|<\infty$.`,
      idea: String.raw`Directedness is what makes "eventually" meaningful: two tail conditions $\alpha\succeq\alpha_1$ and $\alpha\succeq\alpha_2$ are both implied by $\alpha\succeq\alpha_3$ for a common upper bound. For the finite-subset net, the tail beyond $F_0=\{1,\dots,m\}$ is the set of all sums $S_m+\sum_{k\in G}a_k$ with $G$ a finite set of indices above $m$, which fills an interval from $S_m+$ (sum of the negative tail terms) to $S_m+$ (sum of the positive ones). That interval shrinks to a point exactly when $\sum|a_k|<\infty$; for $\sum(-1)^{k+1}/k$ it does not shrink at all, although the ordinary partial sums converge to $\log2$.`,
      caption: String.raw`The shaded band over each $m$ is the exact range of the net beyond $F_0=\{1,\dots,m\}$ (using indices up to $N$); gold points are sums over random finite sets $F\supseteq F_0$ (biased toward positive or negative terms, to explore the whole range), and blue is the ordinary sequence of partial sums $S_m$. Raise $N$: for an absolutely convergent series the band is unchanged and closes on the limit; for $\sum(-1)^{k+1}/k$ it widens without bound.`,
      deps: ['top-1.1'],
      refs: ['Munkres Ch. 3'],
      tags: ['nets', 'convergence'],
      credit: 'Moore and Smith, 1922',
      viz(v) {
        const SER = {
          sq: { label: '$\\sum(-1)^{k+1}/k^2$', a: (k) => (k % 2 ? 1 : -1) / (k * k), lim: Math.PI ** 2 / 12, abs: true, limTex: '\\pi^2/12' },
          geo: { label: '$\\sum(-1/2)^k$', a: (k) => (-0.5) ** k, lim: -1 / 3, abs: true, limTex: '-1/3' },
          alt: { label: '$\\sum(-1)^{k+1}/k$', a: (k) => (k % 2 ? 1 : -1) / k, lim: Math.log(2), abs: false, limTex: '\\log 2' },
        };
        const ser = v.select('series', Object.entries(SER).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const Nn = v.slider('indices used $N$', 40, 4000, 400, { log: true, int: true });
        const m0 = v.slider('stage $F_0=\\{1,\\dots,m\\}$', 1, 40, 12, { int: true });
        const s = v.stage({ x: [0, 41], y: [-2, 3], height: 340, full: true, axes: 'box', xlabel: 'm' });
        let st = null;
        v.render(() => {
          const S = SER[ser.value], N = Nn.value, M = 40;
          const a = Array.from({ length: N + 1 }, (_, k) => (k ? S.a(k) : 0));
          const part = [0]; for (let k = 1; k <= N; k++) part.push(part[k - 1] + a[k]);
          const pos = new Array(N + 2).fill(0), neg = new Array(N + 2).fill(0);
          for (let k = N; k >= 1; k--) { pos[k] = pos[k + 1] + Math.max(0, a[k]); neg[k] = neg[k + 1] + Math.min(0, a[k]); }
          const lo = [], hi = [];
          for (let m = 1; m <= M; m++) { lo.push([m, part[m] + neg[m + 1]]); hi.push([m, part[m] + pos[m + 1]]); }
          const yl = Math.min(...lo.map((p) => p[1]), -0.3), yh = Math.max(...hi.map((p) => p[1]), 1.2);
          s.setView([0, 41], [yl - 0.15 * (yh - yl), yh + 0.1 * (yh - yl)]);
          s.poly([...lo, ...hi.slice().reverse()], { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 1.2 });
          s.hline(S.lim, { color: 'green', width: 1.4, dash: [6, 4] });
          const r = v.rng(7);
          for (let m = 1; m <= M; m++) for (let j = 0; j < 7; j++) {
            const qq = [0.04, 0.2, 0.35, 0.5, 0.65, 0.8, 0.96][j]; let t = part[m]; for (let kk = m + 1; kk <= N; kk++) if (r() < (a[kk] > 0 ? qq : 1 - qq)) t += a[kk];
            s.dot(m, t, { r: 2.2, color: 'gold', ring: false, alpha: 0.85 });
          }
          s.path(Array.from({ length: M }, (_, i) => [i + 1, part[i + 1]]), { color: 'blue', width: 2 });
          s.dots(Array.from({ length: M }, (_, i) => [i + 1, part[i + 1]]), { r: 2.6, color: 'blue' });
          const m = m0.value; s.vline(m, { color: 'accent', width: 1.4, dash: [3, 3] });
          st = { S, w: hi[m - 1][1] - lo[m - 1][1], w40: hi[M - 1][1] - lo[M - 1][1], N, m };
        });
        v.legend([['orange', 'range of the net beyond $F_0$', { area: true }], ['gold', 'sums over random finite $F\\supseteq F_0$', { dot: true }], ['blue', 'partial sums $S_m$'], ['green', 'the sum', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { S, w, w40, N, m } = st;
          return `Beyond $F_0=\\{1,\\dots,${m}\\}$ the net takes values in an interval of width **${v.fmt(w, 4)}** (with indices up to $N=${N}$); at $m=40$ the width is ${v.fmt(w40, 4)}. ` + (S.abs ? `The widths do not depend on $N$ in any visible way and tend to $0$: $\\sum|a_k|<\\infty$, so **the net converges** to $${S.limTex}$, like the sequence.` : `The width is about $\\log(N/m)$ and grows with $N$: $\\sum|a_k|=\\infty$, so **the net does not converge**, although the sequence $S_m\\to${S.limTex}$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Theorem',
      name: 'Closure points are limits of nets',
      statement: String.raw`Let $A$ be a subset of a topological space $X$. Then $x\in\overline A$ if and only if some net in $A$ converges to $x$. Sequences do not suffice in general: they do when $x$ has a countable neighbourhood basis (for example in metric spaces), but in $\R$ with the co-countable topology $x$ lies in the closure of $\R\setminus\{x\}$ while no sequence of points of $\R\setminus\{x\}$ converges to $x$.`,
      idea: String.raw`Index by the directed set of open neighbourhoods of $x$, ordered by reverse inclusion, and pick $x_U\in U\cap A$ (possible because $x\in\overline A$, 1.8). Given any open $V\ni x$, every index $U\subseteq V$ has $x_U\in U\subseteq V$: the net converges. Conversely a net in $A$ converging to $x$ puts points of $A$ in every neighbourhood. In the co-countable topology a sequence $(y_n)$ is a countable set, so $V=\R\setminus\{y_n\}$ is an open neighbourhood of $x$ containing *no* term: no sequence avoiding $x$ can converge to it — yet every nonempty open set is uncountable and so meets $\R\setminus\{x\}$.`,
      caption: String.raw`Top row: a sequence $y_n\to x$ in the usual sense. In the co-countable topology the adversary deletes all its terms (red ×), leaving an open $V\ni x$ that contains none of them. Below: the net indexed by neighbourhoods $U_1\supseteq U_2\supseteq\dots$ inside $V$ (each deletes more points); the chosen point $x_U$ (green) always lies in $V$. Switch to the usual topology to see the sequence succeed too.`,
      deps: ['top-1.13', 'top-1.8'],
      refs: ['Munkres Ch. 3'],
      tags: ['nets', 'closure', 'sequences'],
      viz(v) {
        const top = v.select('topology on $\\R$', [{ value: 'cc', label: 'co-countable' }, { value: 'std', label: 'usual' }], 'cc');
        const SQ = { right: { label: '$x+1/n$', f: (n) => 1 + 0.9 / n }, alt: { label: '$x+(-1)^n/n$', f: (n) => 1 + (0.9 * (-1) ** n) / n }, rat: { label: 'rationals $\\to x$', f: (n) => 1 + Math.round(900 / n) / 1000 * (n % 2 ? -1 : 1) } };
        const sq = v.select('sequence', Object.entries(SQ).map(([value, o]) => ({ value, label: o.label })), 'right');
        const s = v.stage({ x: [-0.05, 2.05], y: [-0.45, 4.35], height: 400, axes: false, full: true });
        const X = 1, NJ = 6, rowY = (j) => 2.5 - 0.46 * j;
        let st = null;
        v.render(() => {
          const cc = top.value === 'cc', f = SQ[sq.value].f;
          const terms = Array.from({ length: 60 }, (_, i) => f(i + 1));
          // top row: the sequence and the adversary V
          const TY = 3.6;
          s.text('sequence', 0.0, TY + 0.4, { size: 12, weight: 700, color: 'muted' });
          let V, inV;
          if (cc) { V = 'ℝ ∖ {y₁, y₂, …}'; inV = (t) => !terms.some((u) => Math.abs(u - t) < 1e-12); s.line(0, TY, 2, TY, { color: 'orange', width: 6, alpha: 0.45 }); }
          else { const e = 0.12; V = `(x − ${e}, x + ${e})`; inV = (t) => Math.abs(t - X) < e; s.line(0, TY, 2, TY, { color: 'faint', width: 1.2 }); s.line(X - e, TY, X + e, TY, { color: 'orange', width: 6, alpha: 0.45 }); }
          let inside = 0;
          terms.forEach((t, i) => {
            const ok = inV(t); if (ok) inside++;
            if (cc) s.text('×', t, TY, { align: 'center', size: 11, color: 'red', weight: 700 });
            if (i < 14) s.dot(t, TY + 0.22 + 0.0 * i, { r: 3, color: ok ? 'gold' : 'red' });
          });
          s.dot(X, TY, { r: 5, color: 'accent', label: 'x', labelPos: 's' });
          s.text(`V = ${V}`, 2.0, TY + 0.4, { align: 'right', size: 12, color: 'orange', weight: 600 });
          // bottom rows: the net x_U over shrinking neighbourhoods U ⊆ V
          s.text('net indexed by neighbourhoods U ⊆ V', 0.0, 2.95, { size: 12, weight: 700, color: 'muted' });
          const r = v.rng(11); let removed = cc ? terms.slice() : [];
          let allIn = true;
          for (let j = 1; j <= NJ; j++) {
            const Y = rowY(j);
            let inU;
            if (cc) {
              for (let t = 0; t < 6; t++) removed.push(X + (r() - 0.5) * 1.6 / j);
              const rem = removed.slice();
              inU = (t) => !rem.some((u) => Math.abs(u - t) < 1e-12);
              s.line(0, Y, 2, Y, { color: 'teal', width: 4, alpha: 0.4 });
              for (const u of rem) if (u > 0 && u < 2) s.line(u, Y - 0.07, u, Y + 0.07, { color: 'red', width: 1, alpha: 0.7 });
            } else {
              const e = 0.6 / j; inU = (t) => Math.abs(t - X) < e;
              s.line(0, Y, 2, Y, { color: 'faint', width: 1 }); s.line(X - e, Y, X + e, Y, { color: 'teal', width: 4, alpha: 0.5 });
            }
            // choose x_U: the first point of U other than x along a fixed list approaching x
            let xu = null; for (let t = 1; t < 400 && xu == null; t++) { const c = X + (Math.SQRT2 * 0.37) / (j + t * 0.6); if (inU(c) && c !== X) xu = c; }
            const ok = xu != null && inV(xu); if (!ok) allIn = false;
            if (xu != null) s.dot(xu, Y, { r: 4.5, color: ok ? 'green' : 'red' });
            s.dot(X, Y, { r: 3, color: 'accent' });
            s.text(`U${'₁₂₃₄₅₆'[j - 1]}`, 0.0, Y + 0.17, { size: 11, color: 'teal', weight: 700 });
          }
          st = { cc, inside, allIn };
        });
        v.legend([['orange', 'open $V\\ni x$', { area: true }], ['gold', 'terms in $V$', { dot: true }], ['red', 'terms outside $V$ / deleted points', { dot: true }], ['green', 'net values $x_U\\in V$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { cc, inside, allIn } = st;
          return cc ? `The sequence has **${inside}** of its first 60 terms in $V$ — none — so $y_n\\not\\to x$ in the co-countable topology, for *every* sequence avoiding $x$. Yet $x\\in\\overline{\\R\\setminus\\{x\\}}$, and the net $(x_U)$ ${allIn ? 'stays in $V$ for every index $U\\subseteq V$ ✓' : 'fails'}: **nets detect closure where sequences cannot.**`
            : `In the usual topology ${inside} of the first 60 terms lie in $V$ — all but finitely many — so $y_n\\to x$: with countable neighbourhood bases, sequences suffice. The net converges as well${allIn ? ' ✓' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Definition',
      name: 'The Sorgenfrey line (lower-limit topology)',
      statement: String.raw`The **lower-limit topology** on $\R$ is generated by the half-open intervals $[a,b)$, $a<b$; the resulting space $\R_\ell$ is the **Sorgenfrey line**. It is strictly finer than the usual topology, since $(a,b)=\bigcup_n[a+1/n,b)$ while $[a,b)$ is not open in $\R$. A sequence converges to $x$ in $\R_\ell$ iff it converges to $x$ in $\R$ and eventually satisfies $x_n\ge x$. Each $[a,b)$ is both open and closed. The **Sorgenfrey plane** $\R_\ell\times\R_\ell$ has basic sets $[a,b)\times[c,d)$; in it the antidiagonal $\{(x,-x)\}$ is a closed discrete subspace.`,
      idea: String.raw`The intervals $[a,b)$ satisfy (B2) because the intersection of two of them is again one (or empty), so they form a basis (1.3), and the basis comparison of 1.4 shows the topology is finer than the usual one. A neighbourhood $[x,x+\eps)$ only reaches to the right, so terms approaching from the left are never inside it. The complement of $[a,b)$ is $\bigcup_k[a-k,a)\cup\bigcup_k[b,b+k)$, which is open: $[a,b)$ is clopen. In the plane, the box $[x,x+\eps)\times[-x,-x+\eps)$ meets the antidiagonal only in $(x,-x)$.`,
      caption: String.raw`Choose what to see. *Sequences:* terms climb with $n$; drag the candidate limit $L$ and shrink the basic neighbourhood $[L,L+\eps)$. *Clopen:* $[0,1)$ (blue) and its complement covered by basic sets (purple). *Plane:* drag $p$ along the antidiagonal; its basic box meets the line only at $p$. The **usual topology** toggle swaps in symmetric neighbourhoods and shows what changes.`,
      deps: ['top-1.3', 'top-1.4'],
      refs: ['Munkres §13'],
      tags: ['Sorgenfrey line', 'counterexamples'],
      credit: 'Sorgenfrey, 1947',
      viz(v) {
        const what = v.select('show', [{ value: 'seq', label: 'sequences' }, { value: 'clopen', label: '$[0,1)$ is clopen' }, { value: 'plane', label: 'Sorgenfrey plane' }], 'seq');
        const std = v.toggle('usual topology instead', false);
        const seq = v.select('$x_n$', [{ value: 'r', label: '$1/n$ (from the right)' }, { value: 'l', label: '$-1/n$ (from the left)' }], 'l');
        const eps = v.slider('$\\varepsilon$', 0.02, 0.6, 0.2, { log: true });
        const s = v.stage({ x: [-1.2, 1.2], y: [-0.5, 16], height: 340, full: true, axes: false });
        const hL = s.handle(0, 0, { color: 'accent', label: '$L$', labelPos: 's', constrain: (x) => [Math.abs(x) < 0.03 ? 0 : v.M.clamp(x, -1.1, 1.1), 0] });
        const hp = s.handle(0.4, -0.4, { color: 'accent', label: '$p$', constrain: (x) => { const t = v.M.clamp(x, -1.3, 1.3); return [t, -t]; } });
        let st = null;
        v.render(() => {
          const W = what.value, u = std.value, e = eps.value;
          seq.el.hidden = W !== 'seq'; eps.el.hidden = W === 'clopen';
          hL.visible = W === 'seq'; hp.visible = W === 'plane';
          if (W === 'seq') {
            s.setScale({ equal: false, x: [-1.2, 1.2], y: [-1.6, 16] });
            const f = seq.value === 'r' ? (n) => 1 / n : (n) => -1 / n, L = hL.x;
            const inU = u ? (t) => Math.abs(t - L) < e : (t) => t >= L && t < L + e;
            if (u) s.rect(L - e, 0.3, L + e, 15.8, { fill: 'orange', fillAlpha: 0.15, stroke: false });
            else { s.rect(L, 0.3, L + e, 15.8, { fill: 'orange', fillAlpha: 0.18, stroke: false }); s.line(L, 0.3, L, 15.8, { color: 'orange', width: 2 }); s.line(L + e, 0.3, L + e, 15.8, { color: 'orange', width: 1, dash: [4, 3] }); }
            s.line(-1.2, 0, 1.2, 0, { color: 'ink', width: 1.4 });
            for (const t of [-1, -0.5, 0, 0.5, 1]) s.text(String(t).replace('-', '−'), t, -1.0, { align: 'center', size: 10.5, color: 'muted' });
            let last = 0; for (let n = 1; n <= 3000; n++) if (!inU(f(n))) last = n;
            for (let n = 1; n <= 15; n++) s.dot(f(n), n, { r: 4, color: inU(f(n)) ? 'gold' : 'red' });
            s.text('n ↑', -1.15, 15, { size: 11, color: 'muted' });
            s.corner(u ? 'basic neighbourhood (L − ε, L + ε)' : 'basic neighbourhood [L, L + ε)', 'tr', { color: 'orange', weight: 600 });
            st = { W, finite: last < 2000, last, L, u, right: seq.value === 'r' };
          } else if (W === 'clopen') {
            s.setScale({ equal: false, x: [-3.2, 4.2], y: [-1.2, 2.2] });
            s.line(-3.2, 0, 4.2, 0, { color: 'ink', width: 1.2 });
            for (let t = -3; t <= 4; t++) s.text(String(t).replace('-', '−'), t, -0.45, { align: 'center', size: 10.5, color: 'muted' });
            s.line(0, 0.5, 1, 0.5, { color: 'blue', width: 7 }); s.dot(0, 0.5, { r: 4.5, color: 'blue' }); s.dot(1, 0.5, { r: 4.5, color: 'blue', hollow: true });
            s.text('[0, 1)', 0.5, 0.82, { align: 'center', color: 'blue', weight: 700, size: 12.5 });
            if (!u) {
              const pieces = [[-1, 0], [-2, 0], [-3.2, 0], [1, 2], [1, 3], [1, 4.2]];
              pieces.forEach(([a, b], i) => { const Y = 1.2 + 0.28 * (i % 3); s.line(a, Y, b, Y, { color: 'purple', width: 5, alpha: 0.7 }); s.dot(a, Y, { r: 3.5, color: 'purple' }); s.dot(b, Y, { r: 3.5, color: 'purple', hollow: true }); });
              s.text('complement = ⋃ [−k, 0) ∪ ⋃ [1, 1 + k): a union of basic sets', 0.5, -0.9, { align: 'center', color: 'purple', size: 12, weight: 600 });
            } else {
              s.circle(0, 0.5, 0.18, { color: 'red', width: 2, dash: [3, 3] });
              s.text('no interval (−δ, δ) around 0 fits inside [0, 1): not open', 0.5, -0.9, { align: 'center', color: 'red', size: 12, weight: 600 });
              s.circle(1, 0.5, 0.18, { color: 'red', width: 2, dash: [3, 3] });
            }
            st = { W, u };
          } else {
            s.setScale({ equal: true, x: [-1.5, 1.5], y: [-1.5, 1.5] });
            s.line(-1.6, 0, 1.6, 0, { color: 'faint', width: 1 }); s.line(0, -1.6, 0, 1.6, { color: 'faint', width: 1 });
            s.line(-1.6, 1.6, 1.6, -1.6, { color: 'blue', width: 2.2 });
            const x = hp.x, y = hp.y;
            if (u) s.rect(x - e, y - e, x + e, y + e, { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.5, dash: [4, 3] });
            else { s.rect(x, y, x + e, y + e, { fill: 'orange', fillAlpha: 0.25, stroke: false }); s.line(x, y, x + e, y, { color: 'orange', width: 2 }); s.line(x, y, x, y + e, { color: 'orange', width: 2 }); s.line(x + e, y, x + e, y + e, { color: 'orange', width: 1, dash: [3, 3] }); s.line(x, y + e, x + e, y + e, { color: 'orange', width: 1, dash: [3, 3] }); }
            if (u) s.line(x - e, y + e, x + e, y - e, { color: 'red', width: 4 });
            s.text('antidiagonal x + y = 0', -1.45, 1.35, { color: 'blue', size: 12, weight: 600 });
            st = { W, u };
          }
        });
        v.legend([['orange', 'basic neighbourhood', { area: true }], ['gold', 'terms inside', { dot: true }], ['red', 'terms outside / failure', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { W, u } = st;
          if (W === 'seq') {
            const { finite, last, right } = st;
            const lim = u ? 'only $0$' : right ? 'only $0$' : 'none';
            return `Here ${finite ? `only ${last} terms fall outside the neighbourhood` : 'infinitely many terms fall outside the neighbourhood'}. **Limits of this sequence in ${u ? '$\\R$' : '$\\R_\\ell$'}: ${lim}.** ${!u && !right ? 'Approaching from the left never enters $[0,\\eps)$: the finer topology has fewer convergent sequences.' : ''}`;
          }
          if (W === 'clopen') return u ? 'In the usual topology $[0,1)$ is neither open (no interval about $0$ fits) nor closed ($1$ is a limit point outside it).' : '$[0,1)$ is a basic open set, and its complement is a union of basic sets, hence open: **$[0,1)$ is clopen**, and so $\\R_\\ell$ is totally disconnected.';
          return u ? 'With the usual product topology every square about $p$ meets the antidiagonal in a whole segment (red): no point of it is isolated.' : 'The box $[x,x+\\eps)\\times[-x,-x+\\eps)$ meets the antidiagonal **only at $p$**: the antidiagonal is an uncountable closed discrete subspace of the Sorgenfrey plane.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16',
      kind: 'Definition',
      name: 'Zariski topology',
      statement: String.raw`On $\R^n$ (or $k^n$ for any field $k$) the **Zariski topology** declares closed the common zero sets
$$Z(S)=\{x: f(x)=0\ \text{for all } f\in S\}$$
of families $S$ of polynomials. On $\R$ the closed sets are $\R$ and the finite sets, so the Zariski topology on $\R$ is the cofinite topology (1.2). On $\R^2$ any two nonempty open sets meet, so the Zariski plane is not Hausdorff; it is coarser than the usual topology.`,
      idea: String.raw`The axioms hold because $Z(\{0\})=\R^n$, $Z(\{1\})=\varnothing$, $\bigcap_\alpha Z(S_\alpha)=Z(\bigcup_\alpha S_\alpha)$, and $Z(S)\cup Z(T)=Z(\{fg: f\in S, g\in T\})$ — a product vanishes iff a factor does. A nonzero polynomial cannot vanish on a nonempty open subset of $\R^n$, so its zero set has empty interior; the open sets $\R^2\setminus Z(f)$ and $\R^2\setminus Z(g)$ therefore intersect in $\R^2\setminus Z(fg)$, which is nonempty (indeed dense).`,
      caption: String.raw`Edit the polynomials $f$ and $g$: their zero sets (blue and orange) are Zariski-closed, and the open sets $U=\R^2\setminus Z(f)$, $V=\R^2\setminus Z(g)$ are everything else. Drag $p\in U$ and $q\in V$ as far apart as you like: the readout always finds a point of $U\cap V$, and the purple dots $Z(f)\cap Z(g)$ form another closed set.`,
      deps: ['top-1.2'],
      refs: ['Munkres §12'],
      tags: ['Zariski topology', 'algebraic geometry'],
      credit: 'Zariski, 1944',
      viz(v) {
        const fi = v.input('$f(x,y)=$', 'x^2 + y^2 - 2', { vars: ['x', 'y'], width: 180 });
        const gi = v.input('$g(x,y)=$', 'y - x^3 + x', { vars: ['x', 'y'], width: 180 });
        const s = v.stage({ x: [-2.6, 2.6], y: [-2, 2], equal: true, axes: true, height: 370, full: true });
        const p = s.handle(-2.1, 1.6, { color: 'blue', label: '$p$' }), q = s.handle(2.2, -1.5, { color: 'orange', label: '$q$' });
        let st = null;
        v.render(() => {
          const f = (x, y) => fi.fn(x, y), g = (x, y) => gi.fn(x, y);
          const px = (s.bounds.x[1] - s.bounds.x[0]) / s.width;
          const near = (F, x, y) => { const h = px * 0.5, v0 = F(x, y), gx = (F(x + h, y) - F(x - h, y)) / (2 * h), gy = (F(x, y + h) - F(x, y - h)) / (2 * h); return Math.abs(v0) / (Math.hypot(gx, gy) + 1e-12) < 1.3 * px; };
          const cB = v.rgb('blue'), cO = v.rgb('orange'), cG = v.rgb('green');
          s.raster((x, y) => { const a = near(f, x, y), b = near(g, x, y); if (a) return [cB[0], cB[1], cB[2], 255]; if (b) return [cO[0], cO[1], cO[2], 255]; return [cG[0], cG[1], cG[2], 22]; }, { res: 1, key: fi.value + '|' + gi.value });
          s.axes();
          // Z(f) ∩ Z(g) by Newton's method from a grid of seeds
          const sols = [];
          for (let i = 0; i <= 14; i++) for (let j = 0; j <= 10; j++) {
            let x = -2.6 + (5.2 * i) / 14, y = -2 + (4 * j) / 10;
            for (let it = 0; it < 30; it++) {
              const h = 1e-6, F = f(x, y), G = g(x, y);
              const a = (f(x + h, y) - F) / h, b = (f(x, y + h) - F) / h, c = (g(x + h, y) - G) / h, d = (g(x, y + h) - G) / h, D = a * d - b * c;
              if (!isFinite(D) || Math.abs(D) < 1e-12) break;
              x -= (d * F - b * G) / D; y -= (-c * F + a * G) / D;
            }
            if (isFinite(x) && Math.abs(f(x, y)) < 1e-8 && Math.abs(g(x, y)) < 1e-8 && Math.abs(x) < 2.6 && Math.abs(y) < 2 && !sols.some(([u, w]) => Math.hypot(u - x, w - y) < 1e-4)) sols.push([x, y]);
          }
          for (const [x, y] of sols) s.dot(x, y, { r: 5, color: 'purple' });
          // a witness of U ∩ V
          let w = null;
          for (let t = 0; t < 200 && !w; t++) { const a = 0.5 + 0.37 * Math.sin(t * 1.7), x = a * p.x + (1 - a) * q.x + 0.013 * t * Math.cos(t), y = a * p.y + (1 - a) * q.y + 0.011 * t * Math.sin(t * 1.3); if (Math.abs(f(x, y) * g(x, y)) > 1e-6) w = [x, y]; }
          if (w) { s.dot(w[0], w[1], { r: 5, color: 'green', label: 'r', labelPos: 'ne' }); s.line(p.x, p.y, w[0], w[1], { color: 'blue', width: 1, dash: [3, 3] }); s.line(q.x, q.y, w[0], w[1], { color: 'orange', width: 1, dash: [3, 3] }); }
          st = { sols, w, fp: f(p.x, p.y), gq: g(q.x, q.y) };
        });
        v.legend([['blue', '$Z(f)$'], ['orange', '$Z(g)$'], ['purple', '$Z(f)\\cap Z(g)=Z(f,g)$', { dot: true }], ['green', '$U\\cap V=\\R^2\\setminus Z(fg)$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { sols, w, fp, gq } = st;
          const pu = Math.abs(fp) > 1e-9 ? '$p\\in U$' : '$p\\in Z(f)$ — move it off the curve', qv = Math.abs(gq) > 1e-9 ? '$q\\in V$' : '$q\\in Z(g)$ — move it off the curve';
          return `${pu}, ${qv}. ` + (w ? `The point $r=(${v.fix(w[0], 3)}, ${v.fix(w[1], 3)})$ has $f(r)g(r)\\ne0$, so $r\\in U\\cap V$: **every two nonempty Zariski-open sets meet**, and $p,q$ cannot be separated. ` : '') + `$Z(f)\\cap Z(g)$ consists of ${sols.length} point${sols.length === 1 ? '' : 's'} in view; $Z(f)\\cup Z(g)=Z(fg)$.`;
        });
      },
    },
  ],
};
