// Topology — Chapter 3 (part c): items 3.15–3.21 — totally disconnected spaces, the box topology on ℝ^ω,
// fixed points of interval maps, antipodal temperatures, GL(n,ℝ), homogeneity of manifolds, the ordered square
import { cantorLevel, snapCantor, cantorSplit } from './ch03.shared.js';

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrap = (d) => d - Math.round(d); // representative in [-1/2, 1/2]
const mod1 = (x) => ((x % 1) + 1) % 1;

/** The 2×2 path in GL from I (or F = diag(1,−1) when det < 0) to A, as a function of s ∈ [0,1] (Gram–Schmidt): Rot(sφ)·R_s·F. */
function qrPath(A) {
  const neg = A[0][0] * A[1][1] - A[0][1] * A[1][0] < 0;
  const B = neg ? [[A[0][0], -A[0][1]], [A[1][0], -A[1][1]]] : A; // A·F
  const phi = Math.atan2(B[1][0], B[0][0]), c = Math.cos(phi), s = Math.sin(phi);
  const R = [[c * B[0][0] + s * B[1][0], c * B[0][1] + s * B[1][1]], [-s * B[0][0] + c * B[1][0], -s * B[0][1] + c * B[1][1]]]; // Rot(−φ)·B, upper triangular
  return (u) => {
    const Rs = [[1 + u * (R[0][0] - 1), u * R[0][1]], [0, 1 + u * (R[1][1] - 1)]], cu = Math.cos(u * phi), su = Math.sin(u * phi);
    const M = [[cu * Rs[0][0], cu * Rs[0][1] - su * Rs[1][1]], [su * Rs[0][0], su * Rs[0][1] + cu * Rs[1][1]]];
    return neg ? [[M[0][0], -M[0][1]], [M[1][0], -M[1][1]]] : M;
  };
}
const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
const lerpM = (A, B, t) => [[A[0][0] + t * (B[0][0] - A[0][0]), A[0][1] + t * (B[0][1] - A[0][1])], [A[1][0] + t * (B[1][0] - A[1][0]), A[1][1] + t * (B[1][1] - A[1][1])]];

/** Radial homeomorphism of the closed disc B(c, ρ) fixing the boundary and carrying a to b (a, b interior). Points are in the plane. */
function discMove(x, c, rho, a, b) {
  const d = [x[0] - c[0], x[1] - c[1]], dn = Math.hypot(d[0], d[1]);
  if (dn >= rho) return x;
  const A = [a[0] - c[0], a[1] - c[1]], Bq = [b[0] - c[0], b[1] - c[1]];
  const w = [d[0] - A[0], d[1] - A[1]], wl = Math.hypot(w[0], w[1]);
  if (wl < 1e-12) return [c[0] + Bq[0], c[1] + Bq[1]];
  const u = [w[0] / wl, w[1] / wl], au = A[0] * u[0] + A[1] * u[1];
  const lam = -au + Math.sqrt(Math.max(0, au * au - (A[0] * A[0] + A[1] * A[1]) + rho * rho)); // boundary at A + lam·u
  const z = [A[0] + lam * u[0], A[1] + lam * u[1]], sg = wl / lam;
  return [c[0] + Bq[0] + sg * (z[0] - Bq[0]), c[1] + Bq[1] + sg * (z[1] - Bq[1])];
}

export default {
  collection: 'top',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Proposition',
      name: 'Totally disconnected spaces: ℚ and the Cantor set',
      statement: String.raw`A space is **totally disconnected** if its only connected subsets are single points (and $\varnothing$), i.e. every component is a point. The rationals $\Q\subset\R$ and the Cantor set $C\subset[0,1]$ are totally disconnected: for any two points $a<b$ of the space there is a separation $U\cup V$ of the whole space with $a\in U$ and $b\in V$.`,
      idea: String.raw`For $\Q$ choose an irrational $c$ with $a<c<b$: the rationals below $c$ and above $c$ are open, disjoint, and cover $\Q$. For $C$, the points $a<b$ are separated at some stage of the construction: some middle third $(g_0,g_1)$ removed at stage $k$ lies between them, and then $C\cap[0,g_0]$ and $C\cap[g_1,1]$ are both closed, hence both open in $C$ (their complements in $C$ are each other). A connected subset containing $a$ and $b$ would be split by this separation (3.1), so every connected subset is a single point.`,
      credit: 'Smith, mid-1870s (first example); Cantor, 1883 (the set that bears his name)',
      caption: String.raw`Choose the space and drag the two points $a<b$ (they snap to rationals with denominator $20$, or to endpoints of the Cantor construction at stage 6). The tool finds the gap or cut that separates them and colours the two clopen halves. For the Cantor set the rows show the construction; the green band is the removed middle third that lies between $a$ and $b$ (found at the first stage at which they fall into different intervals).`,
      deps: ['top-3.10', 'pma-2.44'],
      refs: ['Munkres §23'],
      tags: ['connectedness', 'cantor set'],
      viz(v) {
        const sp = v.select('space', [{ value: 'Q', label: '$\\Q$' }, { value: 'C', label: 'Cantor set' }], 'C');
        const S = v.stage({ x: [-0.03, 1.03], y: [-1.45, 0.75], axes: false, height: 330 });
        const snap = (x) => (sp.value === 'Q' ? Math.round(clamp(x, 0, 1) * 20) / 20 : snapCantor(clamp(x, 0, 1), 6));
        const ha = S.handle(0.07, 0.35, { color: 'gold', label: 'a', constrain: (x) => [snap(x), 0.35] }), hb = S.handle(0.93, 0.35, { color: 'gold', label: 'b', constrain: (x) => [snap(x), 0.35] });
        let info = null;
        v.render(() => {
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x), Q = sp.value === 'Q';
          let cut = null, extra = '';
          if (a < b - 1e-9) {
            if (Q) cut = a + (b - a) / Math.SQRT2;
            else { const sp2 = cantorSplit(a, b); if (sp2) { cut = (sp2.g0 + sp2.g1) / 2; extra = sp2; } }
          }
          if (Q) {
            S.line(0, 0, 1, 0, { color: 'faint', width: 1 });
            for (let k = 0; k <= 400; k++) { const x = k / 400; S.dot(x, 0, { r: 1.4, color: cut === null ? 'muted' : x < cut ? 'blue' : 'red' }); }
            if (cut !== null) { S.vline(cut, { color: 'green', width: 1.8, dash: [5, 4] }); S.text('irrational cut', cut, -0.28, { align: 'center', size: 12, color: 'green' }); }
          } else {
            for (let L = 0; L <= 6; L++) for (const [lo, hi] of cantorLevel(L)) { const y = -0.12 * L; const col = cut === null || L === 0 ? 'muted' : hi <= cut ? 'blue' : 'red'; S.line(lo, y, hi, y, { color: col, width: L === 6 ? 7 : 5, cap: 'butt', alpha: L === 6 ? 1 : 0.55 }); }
            if (cut !== null) { S.rect(extra.g0, -0.12 * extra.level - 0.05, extra.g1, 0.06, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.2 }); S.vline(cut, { color: 'green', width: 1.4, dash: [4, 4] }); S.text('gap removed at stage ' + extra.level, cut, -0.12 * 6 - 0.25, { align: 'center', size: 12, color: 'green' }); }
          }
          info = { a, b, cut, Q, level: extra && extra.level };
        });
        v.legend([['blue', 'clopen piece containing $a$'], ['red', 'clopen piece containing $b$'], ['green', 'the cut (not a point of the space)']]);
        v.readout(() => {
          if (!info) return '';
          const { a, b, cut, Q, level } = info;
          if (cut === null) return 'Choose two different points $a<b$.';
          return Q ? `$a=${v.fix(a, 2)}$, $b=${v.fix(b, 2)}$: cut at the irrational $c=${v.fix(cut, 4)}\\ldots$ ($a+(b-a)/\\sqrt2$). $\\Q\\cap(-\\infty,c)$ and $\\Q\\cap(c,\\infty)$ are disjoint, open in $\\Q$ and cover it, with $a$ and $b$ on opposite sides: they lie in no common connected subset.` : `$a=${v.fix(a, 4)}$, $b=${v.fix(b, 4)}$ are already apart at stage **${level}**: the middle third removed there lies between them, so $C\\cap[0,g_0]$ and $C\\cap[g_1,1]$ are clopen in $C$ and split $a$ from $b$. Hence every component of $C$ is a point.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Proposition',
      name: 'ℝ^ω in the box topology is disconnected',
      statement: String.raw`Give $\R^\omega=\prod_{n\ge1}\R$ the **box topology** (basic open sets $\prod(a_n,b_n)$ with arbitrary intervals). Then the set $B$ of bounded sequences and the set $U$ of unbounded sequences are disjoint, open, nonempty and cover $\R^\omega$, so $\R^\omega$ is disconnected. In the product topology $\R^\omega$ is connected (it is a product of connected spaces; for infinite products this needs a separate argument), and in particular $B$ and $U$ are not open there.`,
      idea: String.raw`Take $a\in\R^\omega$ and the box $\prod_n(a_n-1,a_n+1)$. Every $b$ in it satisfies $|b_n-a_n|<1$ for all $n$, so $b$ is bounded iff $a$ is: the box lies inside $B$ or inside $U$. A product-topology neighbourhood restricts only finitely many coordinates, so it contains sequences that agree with $a$ at those places and are wildly different afterwards — bounded and unbounded points are mixed inside every neighbourhood, and neither $B$ nor $U$ is open.`,
      caption: String.raw`Blue bars: the first coordinates of a sequence $a$ (drag the 8 handles; the tail is bounded or grows, as you choose). Grey band: the neighbourhood of $a$ — in the box topology every coordinate is held within $\pm1$; in the product topology only the first $k$ are. Orange dots: the sequence $b_n=a_n+g\,n$. Raise the drift $g$: it leaves the box neighbourhood immediately (at $n>1/g$), but sits inside the product neighbourhood while $gk<1$ — and is unbounded.`,
      deps: ['top-3.1', 'top-2.10'],
      refs: ['Munkres §23'],
      tags: ['connectedness', 'box topology'],
      viz(v) {
        const topo = v.select('topology', [{ value: 'box', label: 'box' }, { value: 'prod', label: 'product' }], 'box');
        const tail = v.select('tail of $a$', [{ value: 'bdd', label: 'bounded ($2\\cos n$)' }, { value: 'unb', label: 'unbounded ($n-8$)' }], 'bdd');
        const drift = v.slider('drift $g$ of $b_n=a_n+gn$', 0, 0.4, 0.15, { step: 0.005 });
        const kk = v.slider('coordinates constrained $k$ (product)', 1, 20, 6, { int: true });
        const NN = 24;
        const S = v.stage({ x: [0.3, NN + 0.7], y: [-6, 18], axes: 'box', gutter: true, height: 340, xlabel: 'coordinate $n$', ylabel: 'value' });
        const H = Array.from({ length: 8 }, (_, i) => S.handle(i + 1, [1.5, -2, 3, 0.5, -1, 2.5, 1, -0.5][i], { color: 'accent', r: 6, constrain: (x, y) => [i + 1, clamp(y, -5, 8)] }));
        let info = null;
        v.render(() => {
          kk.el.hidden = topo.value === 'box';
          const a = (n) => (n <= 8 ? H[n - 1].y : tail.value === 'bdd' ? 2 * Math.cos(n) : n - 8);
          const g = drift.value, b = (n) => a(n) + g * n, box = topo.value === 'box', k = kk.value;
          for (let n = 1; n <= NN; n++) {
            const constrained = box || n <= k;
            if (constrained) S.rect(n - 0.32, a(n) - 1, n + 0.32, a(n) + 1, { fill: 'muted', fillAlpha: 0.2, stroke: false });
            else S.rect(n - 0.32, -6, n + 0.32, 18, { fill: 'muted', fillAlpha: 0.07, stroke: false });
            S.rect(n - 0.12, Math.min(0, a(n)), n + 0.12, Math.max(0, a(n)), { fill: 'accent', fillAlpha: 0.6, stroke: false });
            S.dot(n, b(n), { r: 3.8, color: 'orange' });
          }
          S.text('…', NN + 0.4, 0, { size: 18, color: 'muted' });
          let first = null; for (let n = 1; n <= 2000; n++) { const out = Math.abs(b(n) - a(n)) >= 1; if (out && (box || n <= k)) { first = n; break; } }
          const inside = first === null && true;
          const bBdd = g === 0 && tail.value === 'bdd', aBdd = tail.value === 'bdd';
          info = { box, k, g, first, inside, aBdd, bBdd, nExit: g > 0 ? Math.ceil(1 / g) : null };
        });
        v.legend([['accent', '$a$ (blue bars)', { area: true }], ['orange', '$b_n=a_n+gn$', { dot: true }], ['muted', 'the neighbourhood of $a$', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { box, k, g, first, aBdd, nExit } = info;
          const bIn = box ? (g === 0 || (g > 0 && false)) : g * k < 1;
          const membership = box ? (g === 0 ? '$b=a$ is in the box neighbourhood' : `$b\\notin$ the box neighbourhood: $|b_n-a_n|=g n\\ge1$ from $n=${nExit}$ on`) : (bIn ? `$b$ **is** in the product neighbourhood ($gk=${v.fix(g * k, 2)}<1$ constrains only $n\\le${k}$)` : `$b$ leaves the product neighbourhood already at $n=${first}\\le k$`);
          return `$a$ is **${aBdd ? 'bounded' : 'unbounded'}**. ${membership}. $b$ is **${g === 0 ? (aBdd ? 'bounded' : 'unbounded') : 'unbounded'}**. ${box ? 'Every member of a box neighbourhood has the same boundedness as $a$, so $B$ and $U$ are both open: a separation.' : (bIn && g > 0 && aBdd ? 'A bounded $a$ has an unbounded point inside each of its product neighbourhoods: $B$ is not open in the product topology.' : '')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Theorem',
      name: 'Every self-map of an interval has a fixed point',
      statement: String.raw`If $f\colon[0,1]\to[0,1]$ is continuous, there is $x\in[0,1]$ with $f(x)=x$. The same holds for any closed bounded interval, and fails for the interval with a point removed.`,
      idea: String.raw`Put $g(x)=f(x)-x$, continuous on $[0,1]$ with $g(0)=f(0)\ge0$ and $g(1)=f(1)-1\le0$. By the intermediate value theorem (3.4) $g$ has a zero (if $g(0)=0$ or $g(1)=0$ it is an endpoint). Geometrically the graph of $f$ is a connected curve joining the left side of the square to the right side, and the diagonal joins the bottom-left to the top-right corner; they must cross. Removing a point lets the graph avoid the diagonal: the domain is no longer connected, and 3.4 no longer applies.`,
      caption: String.raw`Drag the six gold nodes (the graph is a smooth interpolation between them, always inside the square): every crossing with the dashed diagonal is a fixed point, found by bisection on $g(x)=f(x)-x$ and marked in green. Switch on "remove the point $a$": the map on $[0,1]\setminus\{a\}$ drawn in red sends each piece into the other piece, is continuous, and has no fixed point.`,
      deps: ['top-3.4'],
      refs: ['Munkres §24'],
      tags: ['fixed points', 'intermediate value'],
      viz(v) {
        const punct = v.toggle('remove the point $a$ from the interval', false);
        const aa = v.slider('$a$', 0.1, 0.9, 0.5, { step: 0.01 });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 400, xlabel: 'x', ylabel: 'f(x)' });
        const XS = [0, 0.2, 0.4, 0.6, 0.8, 1];
        const H = XS.map((x, i) => S.handle(x, [0.3, 0.8, 0.6, 0.15, 0.45, 0.7][i], { color: 'gold', r: 6, constrain: (xx, y) => [x, clamp(y, 0, 1)] }));
        const f = (x) => { const i = Math.min(4, Math.floor(x / 0.2 + 1e-12)), w = clamp((x - XS[i]) / 0.2, 0, 1), s = (1 - Math.cos(Math.PI * w)) / 2; return H[i].y + (H[i + 1].y - H[i].y) * s; };
        const fp = (x, a) => (x < a ? 1 - ((1 - a) * x) / a : (a * (1 - x)) / (1 - a));
        let info = null;
        v.render(() => {
          const a = aa.value, pu = punct.value;
          aa.el.hidden = !pu; H.forEach((h) => { h.visible = !pu; });
          S.line(0, 0, 1, 1, { color: 'muted', width: 1.4, dash: [5, 4] });
          if (!pu) {
            S.fn(f, { domain: [0, 1], color: 'accent', width: 2.8 });
            const g = (x) => f(x) - x, N = 4000, roots = []; let px = 0, pg = g(0);
            if (Math.abs(pg) < 1e-12) roots.push(0);
            for (let i = 1; i <= N; i++) { const x = i / N, gx = g(x); if (Math.abs(gx) < 1e-12) { if (!roots.length || Math.abs(roots[roots.length - 1] - x) > 1e-6) roots.push(x); } else if (pg * gx < 0) { roots.push(v.M.bisect(g, px, x, 1e-12)); } px = x; pg = gx; }
            for (const r of roots) S.dot(r, f(r), { r: 6.5, color: 'green' });
            info = { pu, roots };
          } else {
            S.fn((x) => fp(x, a), { domain: [0, a - 1e-9], color: 'red', width: 2.8 }); S.fn((x) => fp(x, a), { domain: [a + 1e-9, 1], color: 'red', width: 2.8 });
            S.dot(a, 1, { r: 4.5, hollow: true, color: 'red' }); S.dot(a, 0, { r: 4.5, hollow: true, color: 'red' });
            S.vline(a, { color: 'faint', width: 1, dash: [3, 3] });
            let gap = 9; for (let i = 0; i <= 2000; i++) { const x = i / 2000; if (Math.abs(x - a) < 1e-3) continue; gap = Math.min(gap, Math.abs(fp(x, a) - x)); }
            info = { pu, gap };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (info.pu) return `$f$ is continuous on $[0,1]\\setminus\\{${v.fix(aa.value, 2)}\\}$ with values in the same set (it maps $[0,a)$ onto $(a,1]$ and $(a,1]$ onto $[0,a)$ ), and $\\min|f(x)-x|=${v.fix(info.gap, 3)}>0$: **no fixed point**. The domain is disconnected, so 3.4 cannot be used.`;
          const r = info.roots;
          return `$g(x)=f(x)-x$ has $g(0)=${v.fix(f(0), 2)}\\ge0$ and $g(1)=${v.fix(f(1) - 1, 2)}\\le0$. Fixed points found: **${r.length}** at $x=${r.map((x) => v.fix(x, 4)).join(',\\ ')}$ (always at least one; an odd number if every crossing is transversal).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Theorem',
      name: 'Antipodal points with equal temperature on a circle',
      statement: String.raw`If $T\colon S^1\to\R$ is continuous (the temperature around the equator), then there is a point $x\in S^1$ with $T(x)=T(-x)$. This is the one-dimensional case of the Borsuk–Ulam theorem.`,
      idea: String.raw`Let $g(\theta)=T(\theta+\pi)-T(\theta)$, continuous, with $g(\theta+\pi)=-g(\theta)$. So $g(0)$ and $g(\pi)$ have opposite signs (or vanish), and the intermediate value theorem (3.4) gives a zero in $[0,\pi]$. The zero set comes in antipodal pairs $\theta^*,\theta^*+\pi$, so the number of such pairs is at least one. Continuity is essential: a step function with one value on each half circle never takes equal values at antipodes.`,
      credit: 'Borsuk, 1933 (the theorem for every sphere $S^n$, in answer to a conjecture of Ulam); the circle case reduces to the intermediate value theorem',
      caption: String.raw`Drag the eight nodes on the graph to design a periodic temperature (cosine interpolation, so it is continuous). The orange curve is $T(\theta+\pi)$: wherever it crosses the blue one the antipodal temperatures agree; the green curve $g$ always crosses zero, and the chord on the circle joins such an antipodal pair. Press "step function" to see what happens without continuity.`,
      deps: ['top-3.4'],
      refs: ['Munkres §24'],
      tags: ['intermediate value', 'borsuk-ulam'],
      viz(v) {
        const step = v.toggle('replace $T$ by a step function (discontinuous)', false);
        const Ci = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330, title: 'the equator' });
        const G = v.stage({ x: [0, TAU], y: [-1, 11], axes: 'box', gutter: true, height: 330, xlabel: '$\\theta$', ylabel: '$T$', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [3 * Math.PI / 2, '3π/2'], [TAU, '2π']], title: '$T(\\theta)$ and $T(\\theta+\\pi)$' });
        const D = v.stage({ x: [0, TAU], y: [-9, 9], axes: 'box', gutter: true, height: 260, xlabel: '$\\theta$', ylabel: '$g$', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [3 * Math.PI / 2, '3π/2'], [TAU, '2π']], title: '$g(\\theta)=T(\\theta+\\pi)-T(\\theta)$' });
        const K = 8, th = (k) => (TAU * k) / K;
        const H = [3, 7, 8, 5, 2, 1, 4, 6].map((y, k) => G.handle(th(k), y, { color: 'blue', r: 6, constrain: (x, yy) => [th(k), clamp(yy, 0, 10)] }));
        const cp = Ci.handle(Math.cos(0.7), Math.sin(0.7), { color: 'gold', label: 'x', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const T = (t) => {
          t = ((t % TAU) + TAU) % TAU;
          if (step.value) return t < Math.PI ? 8 : 2;
          const u = (t / TAU) * K, k = Math.floor(u) % K, w = u - Math.floor(u), s = (1 - Math.cos(Math.PI * w)) / 2;
          return H[k].y + (H[(k + 1) % K].y - H[k].y) * s;
        };
        let info = null;
        v.render(() => {
          H.forEach((h) => { h.visible = !step.value; });
          const g = (t) => T(t + Math.PI) - T(t);
          G.fn(T, { domain: [0, TAU - 1e-9], color: 'blue', width: 2.6, n: 800 });
          G.fn((t) => T(t + Math.PI), { domain: [0, TAU - 1e-9], color: 'orange', width: 2.6, n: 800 });
          D.hline(0, { color: 'muted', width: 1 });
          D.fn(g, { domain: [0, TAU - 1e-9], color: 'green', width: 2.6, n: 800 });
          // temperature ring
          for (let i = 0; i < 180; i++) { const a0 = (TAU * i) / 180, a1 = (TAU * (i + 1)) / 180, t = T(a0) / 10; Ci.line(Math.cos(a0), Math.sin(a0), Math.cos(a1), Math.sin(a1), { color: v.mix('blue', 'red', clamp(t, 0, 1)), width: 9, cap: 'butt' }); }
          const roots = []; const N = 2400; let pg = g(0);
          for (let i = 1; i <= N; i++) { const x = (Math.PI * i) / N, gx = g(x); if (!step.value && pg * gx <= 0) roots.push(v.M.bisect(g, (Math.PI * (i - 1)) / N, x, 1e-12)); pg = gx; }
          for (const r of roots) { Ci.line(Math.cos(r), Math.sin(r), -Math.cos(r), -Math.sin(r), { color: 'green', width: 2.2 }); for (const rr of [r, r + Math.PI]) { Ci.dot(Math.cos(rr), Math.sin(rr), { r: 5.5, color: 'green' }); G.vline(rr, { color: 'green', width: 1, dash: [3, 3], alpha: 0.6 }); D.dot(rr, 0, { r: 5, color: 'green' }); } }
          const t0 = Math.atan2(cp.y, cp.x);
          Ci.line(Math.cos(t0), Math.sin(t0), -Math.cos(t0), -Math.sin(t0), { color: 'gold', width: 1.4, dash: [4, 3] });
          Ci.dot(-Math.cos(t0), -Math.sin(t0), { r: 5, color: 'gold', label: '−x', labelPos: 'sw' });
          info = { roots, t0, dx: T(t0), dm: T(t0 + Math.PI) };
        });
        v.readout(() => {
          if (!info) return '';
          const { roots, dx, dm } = info;
          return `At the gold chord: $T(x)=${v.fix(dx, 2)}$, $T(-x)=${v.fix(dm, 2)}$, $g=${v.fix(dm - dx, 2)}$.\n${step.value ? '**No antipodal pair has equal temperature**: $g=\\pm6$ everywhere (and $T$ jumps at $0$ and $\\pi$, so 3.4 does not apply).' : `Green: **${roots.length}** antipodal pair${roots.length > 1 ? 's' : ''} with $T(x)=T(-x)$ in $[0,\\pi)$, at $\\theta=${roots.map((r) => v.fix(r, 3)).join(',\\ ')}$ (and $\\theta+\\pi$).`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19',
      kind: 'Proposition',
      name: 'GL(n, ℝ) has two path components',
      statement: String.raw`The group $\mathrm{GL}(n,\R)$ of invertible real $n\times n$ matrices, as an open subset of $\R^{n^2}$, has exactly two path components (and two components): $\mathrm{GL}^+=\{\det>0\}$ and $\mathrm{GL}^-=\{\det<0\}$. They are exchanged by multiplying by a reflection, and $\mathrm{GL}^+(n,\R)$ is path-connected.`,
      idea: String.raw`The determinant is a continuous function $\mathrm{GL}(n,\R)\to\R\setminus\{0\}$ (it is invertible iff $\det\ne0$), so by 3.3 a path in $\mathrm{GL}$ keeps the sign of $\det$: no path joins $\mathrm{GL}^+$ and $\mathrm{GL}^-$. For $n=2$ and $\det A>0$, Gram–Schmidt writes $A=QR$ with $Q$ a rotation and $R$ upper triangular with positive diagonal; the path $s\mapsto Q_{s}R_s$ — rotate by $s\varphi$ and slide $R$ linearly to $I$ — has positive determinant at every moment and joins $I$ to $A$. For $\det A<0$ compose with a fixed reflection.`,
      caption: String.raw`Matrices are given by their columns: drag the tips of $Ae_1,Ae_2$ (blue) and $Be_1,Be_2$ (orange); the parallelogram is the image of the unit square. Choose the path $A\to B$ and slide $t$. The straight-line path crosses a singular matrix (flat parallelogram, $\det=0$) whenever it must; the "via $I$ or $F$" path (rotate and rescale along $QR$, then go to $B$ the same way) never does if $A$ and $B$ have the same sign of $\det$. If the signs differ no path works, and the readout says where $\det$ vanishes.`,
      deps: ['top-3.7', 'top-3.3', 'pma-9.36'],
      see: ['ladr-9.41'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'matrices'],
      viz(v) {
        const mode = v.select('path from $A$ to $B$', [{ value: 'lin', label: 'straight line' }, { value: 'qr', label: 'via $I$ or $F=\\mathrm{diag}(1,-1)$' }], 'lin');
        const tt = v.slider('$t$', 0, 1, 0.5, { step: 0.002 });
        const S = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: true, height: 360, title: 'columns of the matrix at time $t$' });
        const D = v.stage({ x: [0, 1], y: [-5, 5], axes: 'box', gutter: true, height: 360, xlabel: '$t$', ylabel: '$\\det$', title: '$\\det M(t)$ along the path' });
        const a1 = S.handle(1.2, 0.1, { color: 'blue', label: 'Ae₁' }), a2 = S.handle(-0.1, 1.2, { color: 'blue', label: 'Ae₂' });
        const b1 = S.handle(-0.6, 0.1, { color: 'orange', label: 'Be₁' }), b2 = S.handle(0.1, -2.4, { color: 'orange', label: 'Be₂' });
        const Mx = (h1, h2) => [[h1.x, h2.x], [h1.y, h2.y]];
        let info = null;
        v.render(() => {
          const A = Mx(a1, a2), B = Mx(b1, b2), dA = det2(A), dB = det2(B);
          const pA = qrPath(A), pB = qrPath(B);
          const EA = dA > 0 ? [[1, 0], [0, 1]] : [[1, 0], [0, -1]], EB = dB > 0 ? [[1, 0], [0, 1]] : [[1, 0], [0, -1]];
          const M = (t) => {
            if (mode.value === 'lin') return lerpM(A, B, t);
            if (t < 1 / 3) return pA(1 - 3 * t);
            if (t < 2 / 3) return lerpM(EA, EB, 3 * t - 1);
            return pB(3 * t - 2);
          };
          const N = 600; let zero = null, mind = Infinity; const pts = [];
          for (let i = 0; i <= N; i++) { const d = det2(M(i / N)); pts.push([i / N, d]); mind = Math.min(mind, Math.abs(d)); if (i && pts[i - 1][1] * d <= 0 && zero === null) zero = i / N; }
          D.hline(0, { color: 'red', width: 1.2 }); D.path(pts, { color: 'accent', width: 2.6 }); D.vline(tt.value, { color: 'gold', width: 1.4 });
          if (zero !== null) D.dot(zero, 0, { r: 6, color: 'red' });
          const Mt = M(tt.value), d = det2(Mt);
          const draw = (Mq, col, a, fa) => { const P = [[0, 0], [Mq[0][0], Mq[1][0]], [Mq[0][0] + Mq[0][1], Mq[1][0] + Mq[1][1]], [Mq[0][1], Mq[1][1]]]; S.poly(P, { fill: col, fillAlpha: fa, color: col, width: a }); };
          draw(A, 'blue', 1.2, 0.08); draw(B, 'orange', 1.2, 0.08);
          draw(Mt, d > 0 ? 'green' : d < 0 ? 'pink' : 'red', 2.6, 0.28);
          S.arrow(0, 0, Mt[0][0], Mt[1][0], { color: 'ink', width: 2 }); S.arrow(0, 0, Mt[0][1], Mt[1][1], { color: 'muted', width: 2 });
          // paint the sign of det by a coloured ring about the origin
          D.dot(tt.value, d, { r: 6, color: 'gold' });
          info = { dA, dB, d, zero, mind };
        });
        v.legend([['green', '$\\det>0$ (at time $t$)', { area: true }], ['pink', '$\\det<0$', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { dA, dB, d, zero, mind } = info;
          const same = dA * dB > 0;
          return `$\\det A=${v.fix(dA, 2)}$, $\\det B=${v.fix(dB, 2)}$, $\\det M(t)=${v.fix(d, 2)}$ — ${same ? '**same sign: $A$ and $B$ lie in one component**' : '**opposite signs: no path in $\\mathrm{GL}$ exists**'}.\n${zero === null ? `The path never leaves $\\mathrm{GL}$: $\\min|\\det|=${v.fix(mind, 3)}$.` : `$\\det$ vanishes near $t=${v.fix(zero, 3)}$: the path passes through a singular matrix${same ? ' — a bad path (try the other choice)' : ' — unavoidable, by 3.3 and the intermediate value theorem'}.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.20
    {
      num: '3.20',
      kind: 'Theorem',
      name: 'Connected manifolds are homogeneous',
      statement: String.raw`Let $M$ be a connected topological manifold and $p,q\in M$. Then there is a homeomorphism $h\colon M\to M$ with $h(p)=q$ (indeed one that is the identity outside a compact set, and isotopic to the identity). Thus every point of a connected manifold looks like every other.`,
      idea: String.raw`Inside a coordinate ball one can slide any point $a$ to any other point $b$ by a homeomorphism fixed on the boundary sphere: map each segment from a boundary point $z$ to $a$ linearly onto the segment from $z$ to $b$. Say $a\sim b$ if some homeomorphism carries one to the other. Each equivalence class is open, because every point has a chart ball in which it can be moved to every other point of the ball; the classes partition $M$ into open sets, so by connectedness (3.1) there is one class. Concretely, a chain of overlapping balls from $p$ to $q$ is crossed by composing the ball moves.`,
      caption: String.raw`The flat torus (a connected 2-manifold; opposite sides identified) with a grid. Drag $p$ and $q$ and the disc radius $\rho$. The chain of discs along the shortest segment from $p$ to $q$ is drawn; each disc carries one radial homeomorphism that fixes its boundary and moves $x_k$ to $x_{k+1}$. Slide "moves applied" and watch the grid being bent by the composite: $p$ travels to $q$ without any tearing. Switch to "two discs" (a disconnected manifold) and the chain stops at the gap.`,
      deps: ['top-3.12', 'top-2.19'],
      refs: ['Munkres §25'],
      tags: ['connectedness', 'manifolds'],
      viz(v) {
        const man = v.select('manifold $M$', [{ value: 'torus', label: 'flat torus' }, { value: 'two', label: 'two discs (disconnected)' }], 'torus');
        const rho = v.slider('disc radius $\\rho$', 0.12, 0.45, 0.2, { step: 0.01 });
        const kk = v.slider('moves applied $j$', 0, 12, 12, { int: true });
        const S = v.stage({ x: [-0.05, 1.05], y: [-0.05, 1.05], equal: true, axes: false, height: 420 });
        const hp = S.handle(0.25, 0.4, { color: 'blue', label: 'p', r: 7 }), hq = S.handle(0.75, 0.6, { color: 'orange', label: 'q', r: 7 });
        let info = null;
        v.render(() => {
          const torus = man.value === 'torus', ρ = rho.value;
          const CEN = [[0.2, 0.5], [0.8, 0.5]], RAD = 0.19;
          const inMan = (x) => (torus ? true : CEN.some((c) => Math.hypot(x[0] - c[0], x[1] - c[1]) < RAD));
          const P = [hp.x, hp.y]; let Q = [hq.x, hq.y];
          const dlt = torus ? [wrap(Q[0] - P[0]), wrap(Q[1] - P[1])] : [Q[0] - P[0], Q[1] - P[1]];
          const len = Math.hypot(dlt[0], dlt[1]), N = Math.max(1, Math.ceil(len / (1.8 * ρ * 0.9)));
          const X = Array.from({ length: N + 1 }, (_, k) => [P[0] + (dlt[0] * k) / N, P[1] + (dlt[1] * k) / N]);
          const compOf = (x) => (torus ? 0 : CEN.findIndex((c) => Math.hypot(x[0] - c[0], x[1] - c[1]) < RAD));
          // admissible moves: in the torus every step; for two discs only while the points stay in the same disc
          const moves = []; let blocked = null;
          for (let k = 0; k < N; k++) {
            const a = X[k], b = X[k + 1];
            if (!torus && (!inMan(a) || !inMan(b) || compOf(a) !== compOf(b))) { blocked = k; break; }
            const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            let r = ρ; if (!torus) { const ce = CEN[compOf(a)]; r = Math.min(ρ, RAD - Math.hypot(c[0] - ce[0], c[1] - ce[1]) - 1e-3); }
            moves.push({ c, r, a, b });
          }
          const J = Math.min(kk.value, moves.length);
          const dm = (x, mv) => { // a move acting on a point, with the torus wrap handled by lifting x to the disc's chart
            if (torus) { const y = [mv.c[0] + wrap(x[0] - mv.c[0]), mv.c[1] + wrap(x[1] - mv.c[1])]; const out = discMove(y, mv.c, mv.r, mv.a, mv.b); return [mod1(out[0]), mod1(out[1])]; }
            return discMove(x, mv.c, mv.r, mv.a, mv.b);
          };
          const F = (x) => { let y = x; for (let i = 0; i < J; i++) y = dm(y, moves[i]); return y; };
          // grid lines of the manifold, warped
          const L = 12, S0 = 90;
          const drawLine = (fn, col) => { let seg = []; let prev = null; for (let i = 0; i <= S0; i++) { const x = fn(i / S0); if (!torus && !inMan(x)) { if (seg.length > 1) S.path(seg, { color: col, width: 1.2, alpha: 0.85 }); seg = []; prev = null; continue; } const y = F(x); if (prev && Math.hypot(y[0] - prev[0], y[1] - prev[1]) > 0.3) { if (seg.length > 1) S.path(seg, { color: col, width: 1.2, alpha: 0.85 }); seg = []; } seg.push(y); prev = y; } if (seg.length > 1) S.path(seg, { color: col, width: 1.2, alpha: 0.85 }); };
          if (torus) S.rect(0, 0, 1, 1, { color: 'ink', width: 1.5 });
          else for (const c of CEN) S.circle(c[0], c[1], RAD, { color: 'ink', width: 1.5, fill: 'blue', fillAlpha: 0.05 });
          for (let i = 0; i <= L; i++) { const c = i / L; drawLine((s) => [Math.min(0.9999, s), Math.min(0.9999, c)], 'teal'); drawLine((s) => [Math.min(0.9999, c), Math.min(0.9999, s)], 'purple'); }
          // chain of discs (current one highlighted)
          moves.forEach((mv, i) => { S.circle(mv.c[0], mv.c[1], mv.r, { color: i === J - 1 ? 'gold' : 'faint', width: i === J - 1 ? 2.4 : 0.9, alpha: i === J - 1 ? 1 : 0.6 }); });
          S.path(X.slice(0, Math.min(X.length, (blocked ?? N) + 1)), { color: 'muted', width: 1.2, dash: [3, 3] });
          const img = F(P);
          S.dot(img[0], img[1], { r: 6, color: 'gold' });
          info = { N, J, moves: moves.length, blocked, err: Math.hypot(wrap(img[0] - Q[0]), wrap(img[1] - Q[1])), torus, comp: compOf(P) === compOf(Q), len };
        });
        v.legend([['blue', 'start $p$', { dot: true }], ['orange', 'target $q$', { dot: true }], ['gold', 'image of $p$ under the first $j$ moves', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { N, J, moves, blocked, err, torus } = info;
          if (!torus && blocked !== null) return `The chain runs out after **${moves}** moves: the next point of the segment is not in the same disc, so no chart ball of $M$ contains both the current point and the next. The reachable set is the left or right disc — the orbit of $p$ is open and closed in $M$, but $M$ is not connected.`;
          return `**${N}** disc moves along the shortest segment from $p$ to $q$ (length $${v.fix(info.len, 2)}$, $\\rho=${v.fix(rho.value, 2)}$). After $j=${J}$ of them the image of $p$ is ${J < N ? `still $${v.fix(err, 3)}$ from $q$` : `**at $q$** (error $${v.fix(err, 4)}$)`}. The composite is a homeomorphism of $M$, being a finite composition of homeomorphisms.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.21
    {
      num: '3.21',
      kind: 'Proposition',
      name: 'The ordered square: connected, not path-connected',
      statement: String.raw`Let $I_o^2=[0,1]\times[0,1]$ with the order topology from the dictionary order ($(x,y)<(x',y')$ if $x<x'$, or $x=x'$ and $y<y'$). It is a linear continuum, hence connected (3.2), but it is **not path-connected**: there is no path from $(0,0)$ to $(1,1)$ (indeed no path joining two points in different columns).`,
      idea: String.raw`Suppose $f\colon[0,1]\to I_o^2$ is a path from $(0,0)$ to $(1,1)$. Its image is connected, hence an interval in the order, hence the whole square. For each $x\in[0,1]$ the set $U_x=f^{-1}(\{x\}\times(0,1))$ is open in $[0,1]$ ($\{x\}\times(0,1)$ is an open interval of the order) and nonempty (the point $(x,\tfrac12)$ is in the image). The $U_x$ are pairwise disjoint, so each contains a rational that no other contains: an injection of $[0,1]$ into $\Q$, absurd.`,
      caption: String.raw`Left: the dictionary-ordered square with columns at the dyadic points $k/2^j$ (slide the level $j$); drag the gold handle to highlight one column. Right: the parameter interval $[0,1]$: a path would need a **separate open interval** $U_x$ (coloured to match its column), each holding its own rational dot. For finitely many columns there is room; the proof needs one for **every** real $x$ — uncountably many disjoint open intervals — which cannot fit. Switch to the usual topology: the straight path exists and meets each column in a single parameter, an isolated point, not an open set.`,
      deps: ['top-3.2', 'top-3.7'],
      refs: ['Munkres §24'],
      tags: ['connectedness', 'order topology'],
      viz(v) {
        const topo = v.select('topology', [{ value: 'ord', label: 'dictionary order' }, { value: 'std', label: 'usual (plane)' }], 'ord');
        const lvl = v.slider('level $j$ (columns $k/2^j$)', 0, 6, 3, { int: true });
        const S = v.stage({ x: [-0.06, 1.06], y: [-0.06, 1.06], equal: true, axes: false, height: 360, title: 'the square' });
        const B = v.stage({ x: [-0.02, 1.02], y: [-0.7, 0.9], axes: false, height: 360, title: 'parameter interval $[0,1]$' });
        const hx = S.handle(0.5, 0.5, { color: 'gold', label: 'x', r: 7, constrain: (x) => [clamp(x, 0, 1), 0.5] });
        const palette = ['blue', 'orange', 'green', 'pink', 'purple', 'teal', 'gold', 'red'];
        let info = null;
        v.render(() => {
          const j = lvl.value, M = 2 ** j, ord = topo.value === 'ord';
          S.rect(0, 0, 1, 1, { color: 'ink', width: 1.5 });
          for (let k = 0; k <= 32; k++) S.line(k / 32, 0, k / 32, 1, { color: 'faint', width: 0.6, alpha: 0.6 });
          const cols = Array.from({ length: M + 1 }, (_, k) => k / M);
          if (!ord) S.line(0, 0, 1, 1, { color: 'green', width: 3 });
          cols.forEach((x, k) => S.line(x, 0.02, x, 0.98, { color: palette[k % 8], width: 3, alpha: 0.9 }));
          S.line(hx.x, 0, hx.x, 1, { color: 'gold', width: 1.6, dash: [4, 3] });
          B.line(0, 0, 1, 0, { color: 'muted', width: 1.5 });
          const slot = 1 / (M + 1);
          let minW = 1;
          if (ord) {
            cols.forEach((x, k) => {
              const lo = k * slot + 0.1 * slot, hi = (k + 1) * slot - 0.1 * slot; minW = Math.min(minW, hi - lo);
              B.line(lo, 0, hi, 0, { color: palette[k % 8], width: 12, cap: 'butt' });
              B.dot((lo + hi) / 2, 0, { r: 3, color: 'ink' });
              if (M <= 16) B.line(lo, 0.12, hi, 0.12, { color: palette[k % 8], width: 1, alpha: 0.7 });
            });
            B.text('each column $x$ needs its own open set $U_x$', 0.5, 0.65, { align: 'center', size: 12, color: 'muted' });
          } else {
            cols.forEach((x, k) => { B.dot(x, 0, { r: 5.5, color: palette[k % 8] }); });
            B.text('$t\\mapsto(t,t)$ meets column $x$ only at $t=x$', 0.5, 0.65, { align: 'center', size: 12, color: 'muted' });
          }
          info = { M, ord, minW };
        });
        v.readout(() => {
          if (!info) return '';
          const { M, ord, minW } = info;
          return ord ? `Level $j=${lvl.value}$: **${M + 1}** columns need **${M + 1}** pairwise disjoint nonempty open subsets of $[0,1]$, each containing its own rational; the narrowest drawn interval has length $${v.fix(minW, 4)}$. That is possible for any finite number — but the proof needs one $U_x$ for **each** of the continuum many $x$, giving an injection $[0,1]\\to\\Q$. No path exists.` : `In the usual topology of the plane the path $t\\mapsto(t,t)$ exists: $f^{-1}(\\{x\\}\\times(0,1))=\\{x\\}$ is a point, not an open set, so the counting argument has nothing to count — the vertical segments are not open in the plane, but they are in the order topology.`;
        });
      },
    },
  ],
};
