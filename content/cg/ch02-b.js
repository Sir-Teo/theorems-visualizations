// Computational Geometry & Graphics — Chapter 2, part 2: lower bound, output-sensitive hulls, random hulls, 3D hulls (2.8–2.12)
import { clamp, cross, d2, hull2, genPts, jarvis, gen3, orient3, incHull3, surfaceCounts } from './ch02.shared.js';

const v2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
const SET = ['blue', 'orange', 'teal', 'purple', 'pink', 'red'];
const lg2fact = (n) => { let s = 0; for (let k = 2; k <= n; k++) s += Math.log2(k); return s; };
const rgba = (v, name, a) => [...v.rgb(name).slice(0, 3), a];

export default {
  collection: 'cg',
  chapter: 2,
  items: [
    // ================================================================== 2.8
    {
      num: '2.8', kind: 'Theorem', name: 'Ω(n log n) lower bound for convex hulls',
      statement: String.raw`In the algebraic decision-tree model (and in particular for every algorithm that works with comparisons and orientation tests), computing the convex hull of $n$ points in the plane — reported as the vertices in boundary order — takes $\Omega(n\log n)$ time, even if all the points are known to be vertices of the hull. Hence Graham's scan and divide and conquer are optimal for the worst case, in terms of $n$ alone.`,
      idea: String.raw`Sorting reduces to hulls. Given numbers $x_1,\dots,x_n$, lift them to $(x_i,x_i^2)$ on the parabola: every lifted point is a hull vertex, and listing the hull vertices in counter-clockwise order from the leftmost reads the numbers off in sorted order, in $O(n)$ extra time. A hull algorithm faster than $n\log n$ would therefore sort faster than $n\log n$, but any comparison tree that distinguishes the $n!$ orderings has $n!$ leaves and so depth at least $\log_2 n!=\Theta(n\log n)$ (Stirling); the algebraic version of the argument (Ben-Or) extends this to all algebraic tests.`,
      caption: String.raw`Drag the numbers (points on the curve, labelled by their position in the input list) and change $n$: the hull always lists them in increasing order. Switch the lift to a wiggly curve and the reduction breaks — interior points vanish from the hull and the output is no longer a sorted list of all inputs. The right panel compares $\log_2n!$, the comparison count that any sorter needs, with $n\log_2n$.`,
      scope: String.raw`The bound is for worst-case input in the comparison / algebraic-decision-tree model. It says nothing about output-sensitive running times (2.9) or about inputs with special structure, e.g. integer coordinates.`,
      credit: 'reduction from sorting: M. I. Shamos, 1978 (Yao, 1981, for the quadratic decision-tree model; Ben-Or, 1983, for algebraic computation trees)',
      deps: ['cg-2.6', 'cplx-10.14', 'algo-3.12'], refs: ['de Berg §1.4'], tags: ['lower bound', 'sorting', 'hull'],
      viz(v) {
        const s = v.stage({ x: [-2.7, 2.7], y: [-1.6, 7.4], axes: 'box', gutter: true, xlabel: 'x  (the numbers to sort)', ylabel: 'y', height: 390, minWidth: 340, title: 'numbers lifted to a curve' });
        const lift = v.select('lift to', [{ value: 'par', label: 'y = x²' }, { value: 'wig', label: 'y = x² + wiggle' }], 'par');
        const nsl = v.slider('$n$', 3, 14, 9, { int: true });
        const f = (x) => (lift.value === 'par' ? x * x : x * x + 1.5 * Math.sin(4 * x));
        let seed = 4;
        const gen = () => { const r = v.rng(seed), xs = Array.from({ length: 14 }, (_, i) => -2.3 + (4.6 * i) / 13 + r.uniform(-0.12, 0.12)); return r.shuffle(xs); };
        const H = gen().map((x, i) => s.handle(x, x * x, { color: 'accent', r: 6, constrain: (xx) => { const c = clamp(xx, -2.45, 2.45); return [c, f(c)]; } }));
        v.button('new input', () => { seed++; gen().forEach((x, i) => H[i].set(x, f(x))); });
        const B = v.stage({ x: [0, 32], y: [0, 175], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'comparisons', height: 390, minWidth: 260, title: 'what sorting needs' });
        let info = {};
        v.render(() => {
          const n = +nsl.value;
          H.forEach((h, i) => { h.visible = i < n; h.set(h.x, f(h.x)); });
          s.fn(f, { domain: [-2.55, 2.55], color: 'faint', width: 1.2 });
          const pts = H.slice(0, n).map((h) => [h.x, h.y]), hi = hull2(pts);
          const left = hi.reduce((a, i) => (pts[i][0] < pts[a][0] ? i : a), hi[0]);
          // hull ccw from leftmost: lower chain left -> right, then the upper chord back
          const k0 = hi.indexOf(left), hc = hi.slice(k0).concat(hi.slice(0, k0));
          let kr = 0; hc.forEach((i, k) => { if (pts[i][0] > pts[hc[kr]][0]) kr = k; });
          const lower = hc.slice(0, kr + 1);
          if (hc.length >= 3) s.poly(hc.map((i) => pts[i]), { color: 'accent', fill: 'accent', fillAlpha: 0.08, width: 2.5 });
          s.path(lower.map((i) => pts[i]), { color: 'green', width: 4 });
          pts.forEach((p, i) => {
            const onH = hi.includes(i);
            s.line(p[0], p[1], p[0], -1.6, { color: 'faint', width: 1, dash: true, alpha: 0.7 });
            s.dot(p[0], p[1], { r: onH ? 6 : 5, color: onH ? 'accent' : 'red', hollow: !onH, label: String(i + 1), labelPos: 'nw' });
          });
          const ranked = lower.map((i) => i + 1);
          lower.forEach((i, k) => s.text(String(k + 1), pts[i][0], -1.0, { size: 11, align: 'center', color: 'green' }));
          const ok = lower.length === n && lower.every((i, k) => k === 0 || pts[lower[k - 1]][0] < pts[i][0]);
          info = { n, ranked, ok, rec: lower.length };
          B.fn((x) => v.M.lgamma(x + 1) / Math.LN2, { domain: [1, 32], color: 'green', width: 2.5, n: 64 });
          B.fn((x) => x * Math.log2(x), { domain: [1, 32], color: 'orange', width: 2, dash: true });
          B.vline(n, { color: 'gold', width: 1.5 });
          B.dot(n, lg2fact(n), { r: 6, color: 'gold' });
          B.text('n log₂ n', 22, 150, { color: 'orange', size: 12 }); B.text('log₂ n!', 24, 110, { color: 'green', size: 12 });
        });
        v.readout(() => `input order → hull order (numbers $1..n$ below the axis give each point's rank): the lower chain visits inputs $${info.ranked.join('\\to')}$.\n` +
          (info.ok ? `All $${info.n}$ numbers come back **in sorted order** from the hull, so any hull algorithm sorts. A comparison sorter needs at least $\\lceil\\log_2 ${info.n}!\\rceil=${Math.ceil(lg2fact(info.n))}$ comparisons (and $n\\log_2n=${v2(info.n * Math.log2(info.n))}$ is the same order).` : `**Only ${info.rec} of the ${info.n} numbers appear on the hull** — the lift is not convex, so the hull no longer sorts them and the reduction fails.`));
      },
    },
    // ================================================================== 2.9
    {
      num: '2.9', kind: 'Algorithm', name: 'Chan’s output-sensitive algorithm',
      statement: String.raw`Chan's algorithm computes the hull of $n$ planar points with $h$ hull vertices in $O(n\log h)$ time. Guess $m\ge h$ (start with $m=4$ and square it each round: $m=2^{2^t}$). Split the points into $\lceil n/m\rceil$ groups of at most $m$ points and compute each group's hull by Graham's scan, $O(n\log m)$ in total. Then gift-wrap for at most $m$ steps, finding each next vertex as the best tangent point over all group hulls, each tangent found by binary search in $O(\log m)$; so a round costs $O\bigl((n/m)\,m\log m\bigr)=O(n\log m)$. If the wrap returns to its start within $m$ steps the hull is complete; otherwise $h>m$ and the next round begins.`,
      idea: String.raw`Gift wrapping (2.5) costs $O(n)$ per hull vertex, Graham's scan (2.6) $O(n\log n)$ overall; Chan runs Graham on small groups so that Jarvis's per-step cost drops from $n$ to $(n/m)\log m$ — the tangent from the current vertex to a convex polygon is a binary search. With a guess $m<h$ the wrap is cut off after $m$ steps, wasting only $O(n\log m)$. The guesses $2^{2^t}$ make round $t$ cost $O(n2^t)$, a geometric sum dominated by the last round with $2^{2^t}\ge h$, i.e. $2^t<2\log_2h$, giving $O(n\log h)$.`,
      caption: String.raw`Colours are groups with their small hulls. Each wrap step draws the best tangent from the current vertex (gold ring) to every group hull (thin coloured lines), and the winning one in green. A round that does not close within $m$ steps is aborted (red) and $m$ is squared. The log–log panel plots, for this $n$, the modelled cost of Jarvis, Graham and Chan against the hull size $h$ (the gold marker is the current input): Jarvis grows linearly in $h$, Graham ignores $h$, and Chan tracks the lower of the two up to a constant factor — about $n\log h$ — never much worse than either (with these constants it overtakes neither outright at small $n$; the point is the growth rate). The tangents are computed by a linear scan of each group hull, the cost model charges $\lceil\log_2|{\rm hull}|\rceil+1$ per tangent as binary search would.`,
      credit: 'T. M. Chan, 1996',
      deps: ['cg-2.5', 'cg-2.6', 'pma-3.26'], refs: ['de Berg §1.4'], tags: ['hull', 'output-sensitive', 'algorithm'],
      viz(v) {
        const s = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], equal: true, axes: false, height: 400, minWidth: 340 });
        const dist = v.select('points', [{ value: 'few', label: 'few vertices (h = 6)' }, { value: 'disc', label: 'in a disc' }, { value: 'circle', label: 'on a circle' }], 'disc', { onChange: () => regen() });
        const nsl = v.slider('$n$', 20, 300, 60, { int: true, onChange: () => regen() });
        let seed = 9, P = [], S, CH;
        const few = (r, n, h) => { const P = Array.from({ length: h }, (_, k) => [Math.cos((2 * Math.PI * k) / h), Math.sin((2 * Math.PI * k) / h)]); return P.concat(genPts(r, 'disc', n - h, 0, 0, 0.92 * Math.cos(Math.PI / h))); };
        const mk = () => (dist.value === 'few' ? few(v.rng(seed), nsl.value, 6) : genPts(v.rng(seed), dist.value, nsl.value, 0, 0, 1));
        const regen = () => { P = mk(); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        P = mk();
        function chan(P) {
          const n = P.length; let s0 = 0; for (let i = 1; i < n; i++) if (P[i][0] < P[s0][0]) s0 = i;
          const fr = []; let cost = 0, graham = n * Math.ceil(Math.log2(n)), J = jarvis(P);
          const lg = (k) => Math.ceil(Math.log2(Math.max(2, k)));
          const better = (cur, a, b) => { const c = cross(P[cur], P[a], P[b]); return c < 0 || (c === 0 && d2(P[cur], P[b]) > d2(P[cur], P[a])); };
          for (let t = 1; ; t++) {
            const m = Math.min(2 ** (2 ** t), n), groups = []; for (let i = 0; i < n; i += m) groups.push(Array.from({ length: Math.min(m, n - i) }, (_, k) => i + k));
            const gh = groups.map((g) => hull2(g.map((i) => P[i])).map((k) => g[k]));
            cost += groups.reduce((a, g) => a + g.length * lg(g.length), 0);
            fr.push({ kind: 'groups', t, m, groups, gh, hull: [], cur: null, cost, line: 2, note: `Round ${t}: guess $m=${m}$. Split into ${groups.length} group${groups.length > 1 ? 's' : ''} of at most ${m} points and compute each hull (Graham).`, vars: { m, groups: groups.length, cost } });
            let cur = s0; const hull = [s0]; let ok = false;
            for (let step = 1; step <= m; step++) {
              const cands = gh.map((H) => { let c = -1; for (const r of H) { if (r === cur) continue; if (c < 0 || better(cur, c, r)) c = r; } cost += lg(H.length) + 1; return c; });
              let best = -1; for (const c of cands) if (c >= 0 && (best < 0 || better(cur, best, c))) best = c;
              const closed = best === s0; if (!closed) hull.push(best);
              fr.push({ kind: 'wrap', t, m, groups, gh, cur, cands, next: best, hull: hull.slice(), closed, step, cost, line: 4, note: closed ? `Wrap step ${step}: the best tangent leads back to the start — the hull is complete with ${hull.length} vertices.` : `Wrap step ${step} of at most ${m}: best tangent from each group hull; the green one is the next hull vertex.`, vars: { m, step, cost } });
              if (closed) { ok = true; break; }
              cur = best;
            }
            if (ok) { fr[fr.length - 1].success = true; break; }
            fr.push({ kind: 'fail', t, m, groups, gh, cur: null, hull: hull.slice(), cost, line: 5, note: `After ${m} steps the wrap has not closed: $h>${m}$. Abort and square the guess to $m=${Math.min(2 ** (2 ** (t + 1)), n)}$.`, vars: { m, cost } });
          }
          return { fr, cost, graham, jarvis: J.tests, h: J.hull.length };
        }
        const build = () => { CH = chan(P); return CH.fr; };
        S = v.steps({ frames: build, code: ['m ← 4', 'repeat', '  split P into groups of m points; hull of each group (Graham)', '  p ← leftmost point', '  for step ← 1 … m:  p ← best tangent point over all group hulls', '  if p is back at the start:  return the hull', '  m ← m²   (guess was too small)'], codeTitle: 'Chan', speed: 2.5, still: 6 });
        const C = v.stage({ x: [3, 300], y: [100, 1e6], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'hull size h', ylabel: 'modelled cost', title: 'cost against h for this n (h points on a circle, the rest inside)', height: 400, minWidth: 260 });
        const curves = new Map();
        const curve = (n) => {
          if (curves.has(n)) return curves.get(n);
          const hs = [3, 4, 6, 9, 13, 20, 30, 45, 70, 100, 150, 220, 300].filter((h) => h <= n);
          const rows = hs.map((h) => { const Q = few(v.rng(77 + h), n, h); return { h, jar: jarvis(Q).tests, gra: n * Math.ceil(Math.log2(n)), chan: chan(Q).cost }; });
          curves.set(n, rows); return rows;
        };
        v.render(() => {
          const f = S.frame; if (!CH) return;
          const gi = new Map(); (f.groups || []).forEach((g, k) => g.forEach((i) => gi.set(i, k)));
          (f.gh || []).forEach((H, k) => { const pts = H.map((i) => P[i]); if (pts.length > 2) s.poly(pts, { color: SET[k % 6], fill: SET[k % 6], fillAlpha: 0.08, width: 1.5 }); else if (pts.length === 2) s.segment(pts[0], pts[1], { color: SET[k % 6], width: 2 }); });
          if (f.cands && f.cur != null) f.cands.forEach((c, k) => { if (c >= 0) s.segment(P[f.cur], P[c], { color: SET[k % 6], width: f.next === c ? 3 : 1.2, alpha: f.next === c ? 1 : 0.8 }); });
          if (f.next != null && f.next >= 0 && !f.closed) s.segment(P[f.cur], P[f.next], { color: 'green', width: 3.5 });
          if (f.hull && f.hull.length > 1) s.path([...f.hull, ...(f.closed ? [f.hull[0]] : [])].map((i) => P[i]), { color: f.kind === 'fail' ? 'red' : 'ink', width: 3 });
          P.forEach((p, i) => s.dot(p[0], p[1], { r: 3.5, color: gi.has(i) ? SET[gi.get(i) % 6] : 'muted' }));
          if (f.hull) f.hull.forEach((i) => s.dot(P[i][0], P[i][1], { r: 5.5, color: f.kind === 'fail' ? 'red' : 'ink' }));
          if (f.cur != null) s.dot(P[f.cur][0], P[f.cur][1], { r: 9, color: 'gold', hollow: true });
          s.corner(f.kind === 'fail' ? `m = ${f.m} too small` : f.kind === 'groups' ? `m = ${f.m}` : `m = ${f.m}, step ${f.step}`, 'bl', { color: f.kind === 'fail' ? 'red' : 'ink' });
          const rows = curve(P.length), n = P.length;
          C.setView([3, Math.max(8, n)], [Math.min(100, 2 * n), Math.max(...rows.map((r) => Math.max(r.jar, r.chan, r.gra))) * 1.4]);
          C.path(rows.map((r) => [r.h, r.jar]), { color: 'orange', width: 2.5 });
          C.path(rows.map((r) => [r.h, r.gra]), { color: 'purple', width: 2.5 });
          C.path(rows.map((r) => [r.h, r.chan]), { color: 'green', width: 2.5 });
          rows.forEach((r) => { C.dot(r.h, r.jar, { r: 3, color: 'orange' }); C.dot(r.h, r.chan, { r: 3, color: 'green' }); });
          C.vline(Math.max(3, CH.h), { color: 'gold', width: 1.5 });
          C.dot(Math.max(3, CH.h), CH.fr[CH.fr.length - 1].cost, { r: 7, color: 'gold' });
        });
        v.legend([['orange', 'Jarvis (n−2)h'], ['purple', 'Graham n⌈log₂ n⌉'], ['green', 'Chan (modelled)'], ['gold', 'this input']]);
        v.readout(() => `$n=${P.length}$, hull size $h=${CH ? CH.h : 0}$; rounds used: ${CH ? CH.fr[CH.fr.length - 1].t : 0} (final $m=${CH ? CH.fr[CH.fr.length - 1].m : 0}\\ge h$).\ncost so far ${S.frame.cost ?? 0}; totals — Jarvis $(n-2)h=${(P.length - 2) * (CH ? CH.h : 0)}$, Graham $n\\lceil\\log_2n\\rceil=${CH ? CH.graham : 0}$, Chan $=${CH ? CH.fr[CH.fr.length - 1].cost : 0}$ against $n\\log_2h\\approx${CH ? Math.round(P.length * Math.log2(Math.max(2, CH.h))) : 0}$.`);
      },
    },
    // ================================================================== 2.10
    {
      num: '2.10', kind: 'Theorem', name: 'Expected size of the hull of random points',
      statement: String.raw`Let $h_n$ be the number of vertices of the convex hull of $n$ independent uniform points in a planar convex region $K$. For a convex polygon $K$ with $r$ vertices, $\mathbb E\,h_n=\tfrac{2r}{3}\ln n+O(1)$ (so $\tfrac83\ln n$ in a square, $2\ln n$ in a triangle), whereas for a disc $\mathbb E\,h_n=\Theta(n^{1/3})$; for smooth bodies in general it grows like $n^{1/3}$. In every case the expected size is far below $n$, which is why hull algorithms behave well on random inputs.`,
      idea: String.raw`The hull misses a point of the boundary region only when a cap cut off by a tangent line contains no sample. Integrating the probability that a boundary point is a vertex over the boundary (Rényi–Sulanke), a polygon contributes a logarithmic term from each corner, where the "empty caps" scale gradually, while on a smooth curve a cap of area $a$ meets an arc of length $\propto a^{1/3}$ (the cap area grows like the cube of the arc length on a curve of non-zero curvature), so there are about $n^{1/3}$ points whose cap is empty. The picture estimates $\mathbb E\,h_n$ by averaging many samples and plots it against the predicted scale.`,
      caption: String.raw`Left: one random sample and its hull (resample, change $n$ or the shape). Right: the average hull size over many trials for $n=8,\dots,1024$ (error bars = standard errors) against a chosen horizontal scale. For the polygons the data fall on a straight line in $\ln n$ with slope near $\tfrac{2r}{3}$ (dashed); for the disc the line is straight in $n^{1/3}$. Switch the scale and watch the other curve bend.`,
      scope: String.raw`For $n$ independent uniform points in a fixed convex body; the constants stated are for polygons ($2r/3$ per $\ln n$); for the disc only the order $n^{1/3}$ is asserted. A heavy-tailed or clustered distribution behaves differently.`,
      credit: 'A. Rényi & R. Sulanke, 1963',
      deps: ['cg-2.1', 'prob-2.1.1a', 'prob-1.6.1'], refs: ['de Berg ch. 11'], tags: ['random hull', 'asymptotics'],
      viz(v) {
        const NS = [8, 16, 32, 64, 128, 256, 512, 1024];
        const shape = v.select('region', [{ value: 'square', label: 'square' }, { value: 'triangle', label: 'triangle' }, { value: 'disc', label: 'disc' }], 'square');
        const nsl = v.slider('$n$ in the sample', 8, 1024, 60, { int: true, log: true });
        const scale = v.select('horizontal scale', [{ value: 'ln', label: '$\\ln n$' }, { value: 'cbrt', label: '$n^{1/3}$' }], 'ln');
        const trials = v.select('trials per $n$', [{ value: 40, label: '40' }, { value: 200, label: '200' }], 40);
        let seed = 1;
        v.button('resample', () => { seed++; });
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], equal: true, axes: false, height: 360, minWidth: 300, title: 'one sample and its hull' });
        const G = v.stage({ x: [1.8, 7.2], y: [0, 30], axes: 'box', gutter: true, xlabel: 'ln n', ylabel: 'mean hull size E hₙ', height: 360, minWidth: 320, title: 'average hull size' });
        const cache = new Map();
        const data = (sh, T) => {
          const key = sh + T; if (cache.has(key)) return cache.get(key);
          const out = NS.map((n, k) => { const r = v.rng(500 + 31 * k + sh.length); let a = 0, b = 0; for (let t = 0; t < T; t++) { const h = hull2(genPts(r, sh, n, 0, 0, 1)).length; a += h; b += h * h; } const mean = a / T, vr = Math.max(0, b / T - mean * mean); return { n, mean, se: Math.sqrt(vr / T) }; });
          cache.set(key, out); return out;
        };
        const fit = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0, syy = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; }); const sl = sxy / sxx; return { slope: sl, ic: my - sl * mx, r2: (sxy * sxy) / (sxx * syy) }; };
        let info = {};
        v.render(() => {
          const sh = shape.value, n = +nsl.value, r = v.rng(900 + seed * 17 + n), P = genPts(r, sh, n, 0, 0, 1);
          const outline = sh === 'square' ? [[-1, -1], [1, -1], [1, 1], [-1, 1]] : sh === 'triangle' ? [[-1, -0.8], [1, -0.8], [0, 1]] : null;
          if (outline) s.poly(outline, { color: 'faint', width: 1.2 }); else s.circle(0, 0, 1, { color: 'faint', width: 1.2 });
          const hi = hull2(P), hp = hi.map((i) => P[i]); const on = new Set(hi);
          s.poly(hp, { color: 'accent', fill: 'accent', fillAlpha: 0.1, width: 2.5 });
          P.forEach((p, i) => { if (!on.has(i)) s.dot(p[0], p[1], { r: n > 300 ? 1.5 : 2.5, color: 'muted' }); });
          hp.forEach((p) => s.dot(p[0], p[1], { r: 5, color: 'accent' }));
          s.corner(`n = ${n}, hull = ${hp.length}`, 'tl');
          const D = data(sh, +trials.value), tf = (n) => (scale.value === 'ln' ? Math.log(n) : Math.cbrt(n));
          const xs = D.map((d) => tf(d.n)), ys = D.map((d) => d.mean), F = fit(xs, ys);
          const F2 = fit(D.map((d) => Math.log(d.n)), ys), F3 = fit(D.map((d) => Math.cbrt(d.n)), ys);
          const ymax = Math.max(...D.map((d) => d.mean + d.se)) * 1.1;
          G.setView([xs[0] - 0.2, xs[xs.length - 1] + 0.2], [0, ymax]);
          G.setLabels(scale.value === 'ln' ? 'n   (axis is ln n)' : 'n   (axis is n^{1/3})', 'mean hull size');
          G.setTicks((scale.value === 'ln' ? [8, 32, 128, 512] : [8, 64, 216, 512, 1000]).map((n) => [tf(n), String(n)]), null);
          G.path([[xs[0], F.ic + F.slope * xs[0]], [xs[xs.length - 1], F.ic + F.slope * xs[xs.length - 1]]], { color: 'faint', width: 1.5 });
          if (scale.value === 'ln' && sh !== 'disc') { const r = sh === 'square' ? 4 : 3, sl = (2 * r) / 3, x1 = xs[xs.length - 1], y1 = ys[ys.length - 1]; G.path([[xs[0], y1 + sl * (xs[0] - x1)], [x1, y1]], { color: 'orange', width: 2, dash: true }); }
          D.forEach((d, i) => { G.segment([xs[i], d.mean - d.se], [xs[i], d.mean + d.se], { color: 'accent', width: 1.5 }); G.dot(xs[i], d.mean, { r: 5, color: 'accent' }); });
          info = { F, F2, F3, sh, D };
        });
        v.legend([['accent', 'mean over trials ± SE'], ['faint', 'least-squares line'], ['orange', 'predicted slope 2r/3 (polygons)']]);
        v.readout(() => `Straight-line fits of the means: against $\\ln n$: $R^2=${v2(info.F2.r2 * 1000 / 1000)}$ (slope ${v2(info.F2.slope)}${info.sh === 'square' ? '; predicted 2.67' : info.sh === 'triangle' ? '; predicted 2.00' : ''}); against $n^{1/3}$: $R^2=${v2(info.F3.r2 * 1000 / 1000)}$ (slope ${v2(info.F3.slope)}).\nMean hull size at $n=1024$: **${v2(info.D[7].mean)}** (out of 1024 points).`);
      },
    },
    // ================================================================== 2.11
    {
      num: '2.11', kind: 'Algorithm', name: 'Randomized incremental 3D convex hull',
      statement: String.raw`To build the convex hull of $n$ points in $\R^3$ in general position, start with a tetrahedron on four of them and insert the remaining points in random order. To insert $p$: find the facets visible from $p$ (those whose plane has $p$ strictly on its outer side). If there are none, $p$ is inside the current hull and is discarded; otherwise delete the visible facets and join every edge of the **horizon** (the boundary of the visible region) to $p$ by a new triangular facet. A **conflict graph** records for each facet the not-yet-inserted points that see it (and vice versa), updated locally as new facets are made. The expected running time is $O(n\log n)$.`,
      idea: String.raw`The visible facets of a convex polytope seen from an outside point form a connected patch bounded by a simple cycle of horizon edges (a topological disc on the sphere), so removing them and coning the cycle to $p$ keeps a closed convex surface. A new facet on horizon edge $e$ can only be seen by points that saw one of the two old facets at $e$ (a point seeing neither stays on the inner side of both planes, hence of their common edge's new plane), so its conflict list is a sub-list of their union. Backwards analysis shows the expected number of new facets at step $r$ is at most $6$ (average facet degree below 6, 2.12), and each pending point is re-examined $O(1)$ times in expectation per level, summing to $O(n\log n)$.`,
      caption: String.raw`Step through the insertions (drag to rotate). Red facets are visible from the new gold point, gold edges are the horizon, green facets are the cone built over it. Points still waiting are hollow; the bar chart gives for each waiting point the number of current facets it sees, i.e. the size of its conflict list. A point inside the hull sees nothing and drops out.`,
      scope: String.raw`General position: no four points coplanar. The $O(n\log n)$ bound is in expectation over the random insertion order, for any input.`,
      credit: 'K. Clarkson & P. Shor, 1989 (with Mulmuley; Boissonnat et al.)',
      deps: ['cg-2.6', 'graph-4.2.10', 'prob-1.6.1'], refs: ['de Berg §11.2', 'de Berg §11.3'], tags: ['3D hull', 'randomized', 'conflict graph'],
      viz(v) {
        const dist = v.select('points', [{ value: 'ball', label: 'in a ball' }, { value: 'sphere', label: 'on a sphere' }], 'ball', { onChange: () => regen() });
        const nsl = v.slider('$n$', 8, 30, 16, { int: true, onChange: () => regen() });
        let seed = 21, P = [], S, R;
        const regen = () => { P = gen3(v.rng(seed), dist.value, nsl.value); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        P = gen3(v.rng(seed), dist.value, nsl.value);
        const build = () => {
          R = incHull3(P, P.map((_, i) => i));
          const n = P.length;
          return R.frames.map((f, i) => {
            const seen = f.pending.map((q) => f.facets.filter((fc) => orient3(P[fc.v[0]], P[fc.v[1]], P[fc.v[2]], P[q]) > 0).length);
            const vis = f.facets.filter((x) => x.t === 'visible').length;
            return { ...f, seen, i, line: f.tag === 'start' ? 1 : f.tag === 'inside' ? 4 : f.tag === 'locate' ? 3 : 5,
              note: f.tag === 'start' ? 'A tetrahedron on the first four points; every other point records which of its 4 facets it sees.' : f.tag === 'inside' ? `Point ${f.p + 1} sees no facet: it is inside the hull and is discarded.` : f.tag === 'locate' ? `Insert point ${f.p + 1}: it sees ${vis} facets (red), whose boundary is the horizon cycle of ${f.horizon.length} edges (gold). Its conflict list gave them directly.` : `Remove the red facets and join each horizon edge to point ${f.p + 1}: ${f.horizon.length} new facets (green), each with a conflict list drawn only from the lists of the two old facets at its edge.`,
              vars: { facets: f.facets.length, work: f.work } };
          });
        };
        S = v.steps({ frames: build, code: ['tetrahedron on 4 points + conflicts', 'for each remaining point p:', '  F ← facets visible from p', '  if F is empty:  discard p', '  delete F;  H ← horizon of F', '  for e in H:  add facet (e, p)'], codeTitle: 'Incremental hull', speed: 1.5, still: 7 });
        const A = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 420, minWidth: 340 });
        const sc = v.scene3(A, { yaw: -0.7, pitch: 0.4, axes: false });
        const B = v.stage({ x: [0, 31], y: [0, 14], axes: 'box', gutter: true, xlabel: 'waiting point', ylabel: 'facets it sees', height: 420, minWidth: 250, title: 'conflict list sizes' });
        v.render(() => {
          const f = S.frame; if (!R) return;
          sc.begin();
          const col = { old: 'accent', visible: 'red', new: 'green' };
          (f.facets || []).forEach((fc) => sc.poly(fc.v.map((i) => P[i]), { color: col[fc.t], fill: col[fc.t], fillAlpha: fc.t === 'old' ? 0.1 : 0.32, width: fc.t === 'old' ? 1 : 1.5 }));
          (f.horizon || []).forEach(([a, b]) => sc.line(P[a], P[b], { color: 'gold', width: 4 }));
          const pend = new Set(f.pending || []);
          P.forEach((p, i) => sc.dot(p, { color: i === f.p ? 'gold' : pend.has(i) ? 'muted' : 'accent', r: i === f.p ? 8 : 4.5, hollow: pend.has(i) && i !== f.p }));
          sc.flush();
          B.setView([0, P.length + 1], [0, Math.max(8, ...((f.seen || [0]).concat(14)))]);
          (f.pending || []).forEach((q, k) => { B.bars([f.seen[k]], { x0: q + 1, color: 'blue' }); B.text(String(q + 1), q + 1, 0, { dy: 12, size: 10, align: 'center' }); });
          if (f.p != null && f.tag !== 'start') { const vis = (f.facets || []).filter((x) => x.t === 'visible').length; if (f.tag === 'locate') { B.bars([vis], { x0: f.p + 1, color: 'gold' }); } }
        });
        v.readout(() => { const f = S.frame, n = P.length; return `facets now: **${(f.facets || []).length}**; hull vertices **${f.hullV ?? 4}**; conflict-list work so far **${f.work ?? 0}** (total ${R ? R.work : 0}; $n\\ln n=${Math.round(n * Math.log(n))}$).` + (R ? `\nFinal hull: ${R.facets.length} triangles on ${new Set(R.facets.flat()).size} of the ${n} points.` : ''); });
      },
    },
    // ================================================================== 2.12
    {
      num: '2.12', kind: 'Theorem', name: 'Convex polytopes in 3D have linear complexity',
      statement: String.raw`A convex polytope in $\R^3$ with $V$ vertices, $E$ edges and $F$ faces satisfies **Euler's relation** $V-E+F=2$ and hence $E\le 3V-6$ and $F\le 2V-4$ (for $V\ge3$). So the number of faces and edges is $O(V)$ — the complexity of the hull of $n$ points in space is $O(n)$, not $O(n^2)$ or worse. Equality holds exactly for simplicial polytopes (all faces triangles); and since every vertex has degree at least $3$, also $E\ge\tfrac32V$ and $F\ge\tfrac12V+2$.`,
      idea: String.raw`Euler's formula $V-E+F=2$ holds for any polyhedral surface homeomorphic to a sphere (top-10.9). Each face has at least 3 edges and each edge borders exactly two faces, so $2E\ge3F$; substituting $F\le\tfrac23E$ into Euler gives $E\le3V-6$ and then $F\le2V-4$. Each vertex lies on at least 3 edges and each edge has 2 ends, so $2E\ge3V$. Triangulating every face changes neither $V$ nor the validity of the formula, which is why the incremental algorithm (2.11) always creates only triangles.`,
      caption: String.raw`Pick a family and its size. Left: the polytope (drag to rotate); its counts $V,E,F$ are tallied from its actual faces, never assumed. Right: all convex polytopes live in the wedge $\tfrac32V\le E\le3V-6$ (or $\tfrac12V+2\le F\le2V-4$): random hulls (dots) sit on the upper line, prisms (orange dots) on the lower line, bipyramids on the upper again. The gold marker is the polytope on the left.`,
      scope: String.raw`Convex (more generally sphere-like) polyhedra. For polyhedra with holes (a torus) $V-E+F=0$, and the linear bounds can fail to be tight.`,
      credit: 'L. Euler, 1758',
      deps: ['cg-2.11', 'top-10.9', 'graph-4.2.9', 'graph-1.2.1a'], refs: ['de Berg §11.1'], tags: ['Euler formula', 'polytope', '3D'],
      viz(v) {
        const fam = v.select('polytope', [{ value: 'rand', label: 'hull of random points' }, { value: 'prism', label: 'prism' }, { value: 'bip', label: 'bipyramid' }], 'rand', { onChange: () => { dsel.el.hidden = fam.value !== 'rand'; } });
        const dsel = v.select('points', [{ value: 'ball', label: 'ball' }, { value: 'sphere', label: 'sphere' }, { value: 'cube', label: 'cube' }, { value: 'gauss', label: 'Gaussian' }], 'sphere');
        const nsl = v.slider('size ($n$ points, or $k$-gon)', 4, 40, 18, { int: true });
        let seed = 3;
        v.button('resample', () => { seed++; });
        const yq = v.select('plot', [{ value: 'E', label: 'edges E vs V' }, { value: 'F', label: 'faces F vs V' }], 'E');
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 400, minWidth: 320 });
        const sc = v.scene3(A, { yaw: -0.6, pitch: 0.35, axes: false });
        const W = v.stage({ x: [0, 82], y: [0, 250], axes: 'box', gutter: true, xlabel: 'vertices V', ylabel: 'edges E', height: 400, minWidth: 300, title: 'every convex polytope lies in this wedge' });
        const countPoly = (faces) => { const V = new Set(), E = new Set(); faces.forEach((f) => f.forEach((a, k) => { const b = f[(k + 1) % f.length]; V.add(a); E.add(a < b ? a + ',' + b : b + ',' + a); })); return { V: V.size, E: E.size, F: faces.length }; };
        const prism = (k) => { const pts = []; for (let i = 0; i < k; i++) { const a = (2 * Math.PI * i) / k; pts.push([Math.cos(a), Math.sin(a), -0.9]); } for (let i = 0; i < k; i++) { const a = (2 * Math.PI * i) / k; pts.push([Math.cos(a), Math.sin(a), 0.9]); } const faces = [Array.from({ length: k }, (_, i) => i), Array.from({ length: k }, (_, i) => k + i)]; for (let i = 0; i < k; i++) faces.push([i, (i + 1) % k, k + ((i + 1) % k), k + i]); return { pts, faces }; };
        const bip = (k) => { const pts = []; for (let i = 0; i < k; i++) { const a = (2 * Math.PI * i) / k; pts.push([Math.cos(a), Math.sin(a), 0]); } pts.push([0, 0, 1.3], [0, 0, -1.3]); const faces = []; for (let i = 0; i < k; i++) { faces.push([i, (i + 1) % k, k]); faces.push([(i + 1) % k, i, k + 1]); } return { pts, faces }; };
        // reference cloud
        const cloud = [];
        ['ball', 'sphere', 'cube', 'gauss'].forEach((d, di) => [5, 6, 8, 10, 14, 20, 28, 40, 60, 90].forEach((n, ni) => { const Q = gen3(v.rng(70 + di * 13 + ni), d, n), H = incHull3(Q, Q.map((_, i) => i), { frames: false }), c = surfaceCounts(H.facets); cloud.push(c); }));
        const fams = []; for (let k = 3; k <= 40; k += 1) { fams.push({ t: 'prism', ...countPoly(prism(k).faces) }); fams.push({ t: 'bip', ...countPoly(bip(k).faces) }); }
        const allEuler = cloud.concat(fams).every((c) => c.V - c.E + c.F === 2);
        let info = {};
        v.render(() => {
          dsel.el.hidden = fam.value !== 'rand';
          const k = +nsl.value; let pts, faces, hullPts;
          if (fam.value === 'rand') { const Q = gen3(v.rng(seed * 7 + k), dsel.value, k), H = incHull3(Q, Q.map((_, i) => i), { frames: false }); pts = Q; faces = H.facets; hullPts = new Set(H.facets.flat()); }
          else { const o = fam.value === 'prism' ? prism(Math.min(k, 24)) : bip(Math.min(k, 24)); pts = o.pts; faces = o.faces; hullPts = new Set(faces.flat()); }
          const cnt = countPoly(faces);
          const sx = fam.value === 'rand' ? 1.25 : 1.1;
          sc.begin();
          faces.forEach((f) => sc.poly(f.map((i) => pts[i].map((c) => c * sx * 0.85)), { color: 'accent', fill: 'accent', fillAlpha: 0.14, width: 1.4 }));
          pts.forEach((p, i) => sc.dot(p.map((c) => c * sx * 0.85), { r: hullPts.has(i) ? 4 : 2.5, color: hullPts.has(i) ? 'accent' : 'muted' }));
          sc.flush();
          const yv = yq.value === 'E' ? cnt.E : cnt.F, Y = yq.value;
          W.setLabels('vertices V', Y === 'E' ? 'edges E' : 'faces F');
          W.setView([0, 82], [0, Y === 'E' ? 250 : 170]);
          const up = Y === 'E' ? (V) => 3 * V - 6 : (V) => 2 * V - 4, lo = Y === 'E' ? (V) => 1.5 * V : (V) => V / 2 + 2;
          W.between(lo, up, 4, 82, { fill: 'green', fillAlpha: 0.1 });
          W.fn(up, { domain: [4, 82], color: 'green', width: 2.2 }); W.fn(lo, { domain: [4, 82], color: 'orange', width: 2.2 });
          W.text(Y === 'E' ? 'E = 3V − 6' : 'F = 2V − 4', 40, up(40), { dx: -8, dy: -26, color: 'green', size: 12, align: 'right' }); W.text(Y === 'E' ? 'E = 3V/2' : 'F = V/2 + 2', 70, lo(70), { dy: 26, color: 'orange', size: 12, align: 'right' });
          cloud.forEach((c) => W.dot(c.V, Y === 'E' ? c.E : c.F, { r: 3.5, color: 'blue', alpha: 0.8 }));
          fams.forEach((c) => W.dot(c.V, Y === 'E' ? c.E : c.F, { r: 3, color: c.t === 'prism' ? 'orange' : 'purple', alpha: 0.8 }));
          W.dot(cnt.V, yv, { r: 8, color: 'gold' });
          info = { cnt, up: Y === 'E' ? 3 * cnt.V - 6 : 2 * cnt.V - 4, Y };
        });
        v.legend([['blue', 'random hulls (simplicial)'], ['orange', 'prisms'], ['purple', 'bipyramids'], ['gold', 'this polytope']]);
        v.readout(() => `$V=${info.cnt.V}$, $E=${info.cnt.E}$, $F=${info.cnt.F}$: $V-E+F=${info.cnt.V - info.cnt.E + info.cnt.F}$.\n$E\\le3V-6=${3 * info.cnt.V - 6}$ ${info.cnt.E <= 3 * info.cnt.V - 6 ? '✓' : '✗'}, $F\\le2V-4=${2 * info.cnt.V - 4}$ ${info.cnt.F <= 2 * info.cnt.V - 4 ? '✓' : '✗'}; also $E\\ge\\tfrac32V=${v2(1.5 * info.cnt.V)}$ ${info.cnt.E >= 1.5 * info.cnt.V ? '✓' : '✗'}. All ${40 + 76} reference polytopes in the plot satisfy $V-E+F=2$: ${allEuler ? '**yes**' : 'no'}.`);
      },
    },
  ],
};
