// Computational Geometry & Graphics — Chapter 4: Linear programming and duality (§§4.1–4.5; §§4.6–4.9 in ch04-b.js)
import { hpABC, regionOf, lineEnds, lpBest, tightAt, randLP, seidel, welzlRun, genPts } from './ch04.shared.js';

const SC = ['blue', 'orange', 'teal', 'purple', 'pink', 'gold', 'accent', 'muted'];
const f2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
const d2r = Math.PI / 180;
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const harmonic = (n) => { let h = 0; for (let i = 1; i <= n; i++) h += 1 / i; return h; };
/** Does the line a·x + b·y = c carry an edge of the convex polygon P? */
const contributes = (P, [a, b, c]) => {
  const on = P.filter((p) => Math.abs(a * p[0] + b * p[1] - c) < 1e-6);
  return on.length >= 2 && dist(on[0], on[on.length - 1]) > 1e-6;
};

export default {
  collection: 'cg',
  chapter: 4,
  title: 'Linear programming and duality',
  summary: String.raw`Low-dimensional linear programs, such as deciding whether a mould can be removed from a cast, are solved in expected linear time by adding constraints in random order, an analysis that “backwards” reasoning makes simple. Duality exchanges points and lines, turning questions about points into questions about arrangements of lines, whose zone theorem bounds the work of building them; it also links supersampling to discrepancy and explains why some geometric problems inherit the conjectured hardness of 3SUM.`,
  items: [
    // ------------------------------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Algorithm', name: 'Half-plane intersection',
      statement: String.raw`Given $n$ closed half-planes $h_i=\{x: a_i\cdot x\le c_i\}$ in the plane, the **half-plane intersection** problem is to compute $\bigcap_i h_i$. The result is a convex region with at most $n$ edges: bounded or not, possibly a segment, a point, or empty. **Divide and conquer** does it in $O(n\log n)$ time: split the half-planes into two halves, intersect each recursively, then intersect the two convex regions by merging their boundaries in linear time, so $T(n)=2T(n/2)+O(n)$. (The same bound follows from duality, 4.6: the region is the lower envelope of $n$ dual points.) The bound is optimal, since sorting reduces to the problem. If the intersection is empty, there are always **three** half-planes whose intersection is already empty (Helly, 2.4).`,
      idea: String.raw`A convex region is an intersection of half-planes, and intersecting two convex regions only needs the merge of two sorted boundary chains, which is linear because both are convex. The recursion therefore costs $O(n)$ per level over $\log_2 n$ levels. Emptiness is the planar case of Helly's theorem: if every three half-planes (convex sets) had a common point, all of them would; so an empty intersection is always certified by a triple, which the picture finds by brute force over triples.`,
      caption: String.raw`Drag the endpoints of the lines: each half-plane is the side the small arrow points to (the left of the directed line $p\to q$), and the window edges are four extra half-planes that bound the answer. The region is shaded green; a line that contributes no edge is redundant and drawn dashed. Switch to **divide & conquer** to see the two recursive halves (blue and orange) and their overlap. **Break it** pushes line 1 to $x\ge3.8$: the intersection becomes empty and the readout names three half-planes that already have no common point.`,
      credit: 'M. I. Shamos & D. Hoey, 1976 (O(n log n) divide and conquer)',
      deps: ['cg-2.1', 'cg-2.4', 'opt-2.3'], refs: ['de Berg §4.2'], tags: ['half-planes', 'convexity', 'algorithm'],
      links: { doi: 'https://doi.org/10.1109/SFCS.1976.16' },
      viz(v) {
        const WX = 5, WY = 3.6;
        const s = v.stage({ x: [-WX, WX], y: [-WY, WY], equal: true, axes: false, height: 380, minWidth: 340 });
        const nsl = v.slider('half-planes $n$', 2, 8, 6, { int: true });
        const mode = v.select('view', [{ value: 'all', label: 'intersection' }, { value: 'dc', label: 'divide & conquer' }], 'all');
        const ANG = [0, 180, 90, 270, 45, 225, 135, 315], RHO = [1.6, 1.9, 1.5, 2.1, 1.7, 2.0, 1.4, 1.8];
        const home = (k) => {
          const th = (ANG[k] + 12) * d2r, cx = RHO[k] * Math.cos(th), cy = RHO[k] * Math.sin(th), dx = -Math.sin(th), dy = Math.cos(th);
          return [[cx - 1.4 * dx, cy - 1.4 * dy], [cx + 1.4 * dx, cy + 1.4 * dy]];
        };
        const hs = [];
        for (let k = 0; k < 8; k++) {
          const [p, q] = home(k);
          hs.push([s.handle(p[0], p[1], { color: SC[k], r: 6, label: String(k + 1) }), s.handle(q[0], q[1], { color: SC[k], r: 6 })]);
        }
        v.button('reset', () => hs.forEach(([a, b], k) => { const [p, q] = home(k); a.set(p[0], p[1]); b.set(q[0], q[1]); }));
        v.button('break it: line 1 → x ≥ 3.8', () => { hs[0][0].set(3.8, 1.5); hs[0][1].set(3.8, -1.5); });
        const W = [[1, 0, WX], [-1, 0, WX], [0, 1, WY], [0, -1, WY]];
        let info = '';
        v.render(() => {
          const n = nsl.value, cons = [];
          for (let k = 0; k < 8; k++) {
            const [a, b] = hs[k], vis = k < n;
            a.visible = vis; b.visible = vis;
            if (vis) cons.push(hpABC([a.x, a.y], [b.x, b.y]));
          }
          const all = [...W, ...cons], P = regionOf(all, 30);
          let witness = null;
          if (!P.length) {
            let best = Infinity;
            for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) for (let l = j + 1; l < all.length; l++) {
              if (regionOf([all[i], all[j], all[l]], 30).length) continue;
              const nb = [i, j, l].filter((t) => t < 4).length;
              if (nb < best) { best = nb; witness = [i, j, l]; }
            }
          }
          const h = Math.ceil(n / 2);
          if (mode.value === 'dc') {
            const A = regionOf([...W, ...cons.slice(0, h)], 30), B = regionOf([...W, ...cons.slice(h)], 30);
            if (A.length) s.poly(A, { fill: 'blue', fillAlpha: 0.13, color: 'blue', width: 2, dash: true });
            if (B.length) s.poly(B, { fill: 'orange', fillAlpha: 0.13, color: 'orange', width: 2, dash: true });
            s.corner(`lines 1–${h} (blue)   ·   lines ${h + 1}–${n} (orange)`, 'tl', { color: 'muted' });
          }
          if (P.length) s.poly(P, { fill: 'green', fillAlpha: mode.value === 'dc' ? 0.3 : 0.2, color: 'green', width: 3 });
          let red = 0;
          cons.forEach((c, k) => {
            const e = lineEnds(c[0], c[1], c[2], [-WX, WX], [-WY, WY]);
            if (!e) return;
            const used = P.length && contributes(P, c), wit = witness && witness.includes(k + 4);
            if (P.length && !used) red++;
            s.segment(e[0], e[1], { color: SC[k], width: wit ? 4.5 : 2.2, dash: P.length && !used ? [6, 5] : false, alpha: P.length && !used ? 0.6 : 1 });
            const mx = (e[0][0] + e[1][0]) / 2, my = (e[0][1] + e[1][1]) / 2;
            s.arrow(mx, my, mx - 0.45 * c[0], my - 0.45 * c[1], { color: SC[k], width: 1.8, head: 6 });
          });
          if (witness) {
            const nm = witness.map((t) => (t < 4 ? ['right', 'left', 'top', 'bottom'][t] + ' window edge' : 'line ' + (t - 3)));
            info = `**Empty.** Helly (2.4): some three half-planes already have no common point, here ${nm.join(', ')}.`;
            s.corner('empty intersection', 'br', { color: 'red', weight: 700 });
          } else {
            const ar = Math.abs(P.reduce((t, p, i) => t + (p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1]), 0)) / 2;
            info = `Intersection: ${P.length} vertices, area ${f2(ar)}; ${n - red} of the ${n} half-planes contribute an edge, ${red} ${red === 1 ? 'is' : 'are'} redundant (dashed). Merge work ≈ ${Math.ceil(n * Math.log2(Math.max(n, 2)))} steps = $n\\log_2 n$.`;
          }
        });
        v.readout(() => info);
      },
    },
    // ------------------------------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Theorem', name: 'Linear programs attain their optimum at a vertex',
      statement: String.raw`Let $P=\{x\in\R^d: Ax\le b\}$ be a nonempty polyhedron that contains **no line** (so it has vertices) and let $c\in\R^d$. If $\sup_{x\in P} c\cdot x$ is finite, it is attained, and it is attained at a **vertex** of $P$. The set of all optima is a face of $P$: a vertex, an edge, or (in the plane) an unbounded edge, when $c$ is perpendicular to it. If $P$ contains a line, then the supremum is $+\infty$ or the optimum is attained along entire lines, and there may be no vertex at all. In the plane this reduces the search to the vertices of the region of 4.1.`,
      idea: String.raw`Take an optimal $x$ and look at the constraints tight at $x$. If they leave a direction $d$ free (they all keep $a_i\cdot d=0$), then $c\cdot d=0$, otherwise one way along $d$ would improve the optimum; so moving along $\pm d$ keeps the value. Since $P$ contains no line, one of the two directions soon meets a new constraint, which becomes tight. Each such step adds an independent tight constraint, so after at most $d$ steps we stand on a vertex with the same value. This is the finite-dimensional case of “a linear functional attains its maximum at an extreme point” (fa-3.24), and it is what lets the simplex method and the incremental algorithm of 4.3 work with vertices alone.`,
      caption: String.raw`Rotate the objective $c$. The gold line is the level set $c\cdot x=$ const through the optimum; the optimum (green) hops from vertex to vertex as $c$ passes the normal of an edge, and sits on a whole edge exactly then. The right graph is the optimal value against the direction of $c$; it kinks at the dashed lines (edge normals). Switch the region: for the **open** region the optimum is unbounded for some $c$; for the **strip**, which contains lines, there are no vertices at all, and the optimum is either unbounded or an entire line.`,
      deps: ['cg-4.1', 'fa-3.24', 'algo-11.15'], refs: ['de Berg §4.3'], tags: ['linear programming', 'vertices'],
      viz(v) {
        const s = v.stage({ x: [-4.2, 4.2], y: [-3.1, 3.1], equal: true, axes: false, height: 380, minWidth: 340 });
        const G = v.stage({ x: [0, 360], y: [-4, 4], axes: 'box', gutter: true, xlabel: 'direction of c (degrees)', ylabel: 'optimal value', title: 'optimal value as c turns', height: 380, minWidth: 300 });
        const ring = (list) => list.map(([deg, rho]) => [Math.cos(deg * d2r), Math.sin(deg * d2r), rho]);
        const al = 20 * d2r;
        const DEFS = {
          bounded: ring([[20, 1.6], [90, 1.4], [160, 1.7], [230, 1.5], [300, 1.6]]),
          open: ring([[90, 1.4], [160, 1.7], [230, 1.5]]),
          strip: [[-Math.sin(al), Math.cos(al), 1.1], [Math.sin(al), -Math.cos(al), 1.1]],
        };
        const B = 40, isReal = (p) => Math.abs(p[0]) < B - 1e-6 && Math.abs(p[1]) < B - 1e-6;
        const solve = (R, th) => {
          const cx = Math.cos(th), cy = Math.sin(th), best = lpBest(R.poly, cx, cy), real = R.poly.filter(isReal);
          if (!real.length) {
            const ties = R.poly.filter((p) => cx * p[0] + cy * p[1] > best.v - 1e-7);
            return ties.length >= 2 ? { kind: 'line', pts: ties, val: best.v } : { kind: 'unb' };
          }
          const rv = Math.max(...real.map((p) => cx * p[0] + cy * p[1]));
          if (best.v > rv + 1e-7) return { kind: 'unb', from: real.reduce((m, p) => (cx * p[0] + cy * p[1] > cx * m[0] + cy * m[1] ? p : m), real[0]), to: best.p };
          const opt = R.poly.filter((p) => cx * p[0] + cy * p[1] > rv - 1e-7);
          const ro = opt.filter(isReal);
          return { kind: opt.length > ro.length ? 'ray' : ro.length > 1 ? 'edge' : 'vertex', pts: opt, val: rv };
        };
        const R = {};
        for (const key of Object.keys(DEFS)) {
          const cons = DEFS[key], poly = regionOf(cons, B), curve = [], vals = [];
          for (let d = 0; d <= 360; d++) {
            const r = solve({ poly }, d * d2r);
            if (r.kind === 'unb' || r.kind === 'line') curve.push(null); else { curve.push([d, r.val]); vals.push(r.val); }
          }
          const yr = vals.length ? [Math.min(...vals) - 0.4, Math.max(...vals) + 0.4] : [-1, 1];
          R[key] = { cons, poly, curve, yr, real: poly.filter(isReal), normals: cons.map((c) => ((Math.atan2(c[1], c[0]) / d2r) + 360) % 360) };
        }
        const reg = v.select('region', [{ value: 'bounded', label: 'bounded' }, { value: 'open', label: 'open' }, { value: 'strip', label: 'strip' }], 'bounded');
        const tsl = v.slider('direction of $c$ (°)', 0, 360, 40, { step: 1 });
        v.button('align with next edge', () => {
          const cur = reg.value, nx = R[cur].normals.slice().sort((a, b) => a - b), t = nx.find((a) => a > tsl.value + 0.5) ?? nx[0];
          tsl.set(Math.round(t));
        });
        let info = '';
        v.render(() => {
          const Rg = R[reg.value], th = tsl.value * d2r, cx = Math.cos(th), cy = Math.sin(th), sol = solve(Rg, th);
          s.poly(Rg.poly, { fill: 'blue', fillAlpha: 0.13, color: 'blue', width: 2.5 });
          Rg.cons.forEach((c, k) => { const e = lineEnds(c[0], c[1], c[2], [-4.2, 4.2], [-3.1, 3.1]); if (e) s.segment(e[0], e[1], { color: 'blue', width: 1, alpha: 0.5 }); });
          Rg.real.forEach((p) => s.dot(p[0], p[1], { r: 4, color: 'accent', hollow: true }));
          if (sol.val != null) {
            const e = lineEnds(cx, cy, sol.val, [-4.2, 4.2], [-3.1, 3.1]);
            if (e) s.segment(e[0], e[1], { color: 'gold', width: 2.5, dash: [7, 5] });
          }
          if (sol.kind === 'vertex') s.dot(sol.pts[0][0], sol.pts[0][1], { r: 8, color: 'green' });
          if (sol.kind === 'edge' || sol.kind === 'ray' || sol.kind === 'line') {
            s.segment(sol.pts[0], sol.pts[sol.pts.length - 1], { color: 'green', width: 6, alpha: 0.85 });
            if (sol.kind === 'edge') sol.pts.forEach((p) => s.dot(p[0], p[1], { r: 7, color: 'green' }));
          }
          if (sol.kind === 'unb' && sol.from) { s.arrow(sol.from[0], sol.from[1], sol.from[0] + (sol.to[0] - sol.from[0]) * 0.1, sol.from[1] + (sol.to[1] - sol.from[1]) * 0.1, { color: 'red', width: 3, head: 9 }); s.dot(sol.from[0], sol.from[1], { r: 7, color: 'red' }); }
          s.arrow(-3.5, -2.3, -3.5 + 0.9 * cx, -2.3 + 0.9 * cy, { color: 'gold', width: 3, head: 9 });
          s.tex('c', -3.5 + 1.15 * cx, -2.3 + 1.15 * cy, { color: 'gold' });
          G.setView([0, 360], Rg.yr);
          Rg.normals.forEach((a) => G.vline(a, { color: 'orange', dash: [4, 4], alpha: 0.7 }));
          G.path(Rg.curve, { color: 'accent', width: 2.5 });
          if (sol.val != null && sol.kind !== 'line') G.dot(tsl.value, sol.val, { r: 6, color: 'gold' });
          if (!Rg.curve.some((p) => p)) G.corner('no finite optimum except when c ⟂ strip', 'tr', { color: 'muted' });
          const nv = Rg.real.length;
          info = sol.kind === 'vertex' ? `Optimum $${v.fix(sol.val, 3)}$ at the vertex $(${f2(sol.pts[0][0])},\\,${f2(sol.pts[0][1])})$ — one of the ${nv} vertices of the region.`
            : sol.kind === 'edge' ? `$c$ is perpendicular to an edge: the optimum $${v.fix(sol.val, 3)}$ is attained on the whole edge, and at both of its endpoints, which are vertices.`
            : sol.kind === 'ray' ? `$c$ is perpendicular to an unbounded edge: optimum $${v.fix(sol.val, 3)}$ on a ray that starts at a vertex.`
            : sol.kind === 'line' ? `The strip contains lines, so it has **no vertex**; with $c$ perpendicular to the strip the optimum $${v.fix(sol.val, 3)}$ is attained along an entire line.`
            : (nv ? `$c$ points out of the open end of the region: the objective is **unbounded** (red ray), so there is no optimum.` : `A strip has no vertices, and for this $c$ the objective is unbounded.`);
        });
        v.readout(() => info);
      },
    },
    // ------------------------------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Algorithm', name: 'Randomized incremental linear programming',
      statement: String.raw`To maximize $c\cdot x$ subject to $n$ constraints $a_i\cdot x\le b_i$ in the plane, start from a large bounding box (so the optimum $v_0$ is a box corner) and insert the constraints $h_1,\dots,h_n$ in **random order**. Let $v_i$ be the optimum after $h_1,\dots,h_i$. If $v_{i-1}$ satisfies $h_i$ then $v_i=v_{i-1}$. Otherwise $v_i$ lies on the boundary line of $h_i$ and is found by a **one-dimensional** linear program over that line, restricted by $h_1,\dots,h_{i-1}$ and the box in $O(i)$ time; if that interval is empty the program is infeasible. The expected running time is $O(n)$ (in dimension $d$, $O(d!\,n)$), the average being over the random order only: any input is handled.`,
      idea: String.raw`Each step costs $O(1)$ when the old optimum survives and $O(i)$ when it does not. By 4.2 the optimum $v_i$ is determined by two constraints, and it differs from $v_{i-1}$ only if $h_i$ is one of those two. Because the order is random, the probability of that is at most $2/i$ (this is the backwards analysis of 4.4), so the expected cost of step $i$ is at most $\tfrac2i\cdot O(i)=O(1)$ and the total is $O(n)$. A deterministic order can be forced to be bad, a random order cannot.`,
      caption: String.raw`Step through the constraints in the order drawn at random (**new instance** and **reshuffle** change it). The blue region is the intersection of the constraints seen so far; the gold dashed line is the level set of $c$ through the current optimum. When the new line (orange) cuts off the optimum, the one-dimensional problem on that line is the thick orange stretch, and the optimum slides to its end (green dot, with an arrow from the old one). The graph counts the times the optimum changed: this run (blue), the average over 300 random orders (orange) and the bound $2H_i\approx2\ln i$ (dashed).`,
      credit: 'R. Seidel, 1991 (conference version 1990); deterministic linear time in fixed dimension earlier by N. Megiddo, 1983',
      deps: ['cg-4.2'], refs: ['de Berg §4.4'], tags: ['linear programming', 'randomization'],
      links: { doi: 'https://doi.org/10.1007/BF02574699' },
      viz(v) {
        const WX = 3.6, WY = 2.7;
        const s = v.stage({ x: [-WX, WX], y: [-WY, WY], equal: true, axes: false, height: 380, minWidth: 340 });
        const G = v.stage({ x: [0, 12], y: [0, 8], axes: 'box', gutter: true, xlabel: 'constraints inserted', ylabel: 'times the optimum changed', title: 'changes of the optimum', height: 380, minWidth: 280 });
        let seed = 3, inst, order, frames, avg, S;
        const nsl = v.slider('constraints $n$', 6, 24, 12, { int: true, onChange: () => rebuild() });
        const rebuild = () => {
          const n = nsl.value;
          inst = randLP(v.rng(seed * 31 + n), n);
          const ids = inst.cons.map((_, i) => i);
          order = v.rng(seed * 77 + 5).shuffle(ids);
          frames = seidel(inst.cons, order, inst.c);
          const rr = v.rng(900 + seed), acc = new Array(n + 1).fill(0), R = 300;
          for (let t = 0; t < R; t++) seidel(inst.cons, rr.shuffle(ids), inst.c).forEach((f, i) => { acc[i] += f.changes; });
          avg = acc.map((a) => a / R);
          G.setView([0, n], [0, Math.max(4, 2 * harmonic(n) * 1.25 + 0.5)]);
          if (S) S.reset();
        };
        v.button('new instance', () => { seed++; rebuild(); });
        v.button('reshuffle', () => { order = v.rng(Math.floor(Math.random() * 1e6)).shuffle(inst.cons.map((_, i) => i)); frames = seidel(inst.cons, order, inst.c); S.reset(); });
        rebuild();
        S = v.steps({
          frames: () => frames.map((f) => ({ ...f,
            line: f.i === 0 ? 1 : f.violated ? 4 : 3,
            note: f.i === 0 ? 'Start at the corner of the bounding box that is best for $c$ (off screen). Constraints now arrive in random order.'
              : f.violated ? `Constraint ${f.i} cuts off the optimum, so the new optimum lies on its line: a 1-D problem over ${f.i + 3} constraints (the box and the ${f.i - 1} before it) gives the next vertex.`
              : `Constraint ${f.i} is satisfied by the current optimum: nothing to do.`,
            vars: { changes: f.changes, work: f.work } })),
          code: ['v ← best corner of the bounding box', 'for i ← 1 … n   (random order)', '  if v satisfies hᵢ:  keep v', '  else  solve the 1-D LP on ∂hᵢ  ▷ O(i)', '        v ← its optimum', 'return v'],
          codeTitle: 'Seidel', speed: 1.5, still: 5,
        });
        v.legend([['blue', 'this run'], ['orange', 'mean of 300 orders'], ['muted', '2·Hᵢ bound', { dash: true }]]);
        v.render(() => {
          const f = S.frame, n = nsl.value, done = order.slice(0, f.i);
          const reg = regionOf(done.map((k) => inst.cons[k]), 8);
          if (reg.length && f.i > 0) s.poly(reg, { fill: 'blue', fillAlpha: 0.13, color: 'blue', width: 2 });
          order.forEach((k, idx) => {
            const c = inst.cons[k], e = lineEnds(c[0], c[1], c[2], [-WX, WX], [-WY, WY]);
            if (!e || idx + 1 === f.i) return;
            s.segment(e[0], e[1], { color: idx < f.i ? 'blue' : 'faint', width: idx < f.i ? 1.5 : 1, alpha: idx < f.i ? 0.7 : 0.35, dash: idx < f.i ? false : [3, 4] });
          });
          const lv = f.v;
          const lev = lineEnds(inst.c[0], inst.c[1], inst.c[0] * lv[0] + inst.c[1] * lv[1], [-WX, WX], [-WY, WY]);
          if (lev) s.segment(lev[0], lev[1], { color: 'gold', width: 2, dash: [7, 5] });
          if (f.i > 0) {
            const c = inst.cons[f.k], e = lineEnds(c[0], c[1], c[2], [-WX, WX], [-WY, WY]);
            if (e) s.segment(e[0], e[1], { color: 'orange', width: 3 });
            if (f.info) {
              s.segment(f.info.p1, f.info.p2, { color: 'orange', width: 7, alpha: 0.7 });
              s.arrow(f.vOld[0], f.vOld[1], f.v[0], f.v[1], { color: 'green', width: 2, head: 8 });
              if (Math.abs(f.vOld[0]) < WX && Math.abs(f.vOld[1]) < WY) s.dot(f.vOld[0], f.vOld[1], { r: 6, color: 'gold', hollow: true });
            }
          }
          if (Math.abs(lv[0]) < WX && Math.abs(lv[1]) < WY) s.dot(lv[0], lv[1], { r: 8, color: 'green' }); else s.corner('optimum at a bounding-box corner (off screen)', 'bl', { color: 'muted' });
          s.arrow(-3.0, 2.1, -3.0 + 0.8 * inst.c[0], 2.1 + 0.8 * inst.c[1], { color: 'gold', width: 3, head: 9 });
          s.tex('c', -3.0 + 1.05 * inst.c[0], 2.1 + 1.05 * inst.c[1], { color: 'gold' });
          G.fn((x) => 2 * harmonic(Math.floor(x)) + 2 * (x - Math.floor(x)) / Math.max(1, Math.floor(x) + 1), { domain: [0.001, n], color: 'muted', dash: true, width: 1.5 });
          G.path(avg.map((a, i) => [i, a]), { color: 'orange', width: 2.5 });
          G.path(frames.flatMap((q, i) => (i === 0 ? [[0, 0]] : [[i, frames[i - 1].changes], [i, q.changes]])), { color: 'blue', width: 1.5, alpha: 0.35 });
          G.path(frames.slice(0, f.i + 1).flatMap((q, i) => (i === 0 ? [[0, 0]] : [[i, frames[i - 1].changes], [i, q.changes]])), { color: 'blue', width: 3 });
          G.vline(f.i, { color: 'gold', width: 1.5, dash: true });
        });
        v.readout(() => {
          const f = S.frame, n = nsl.value;
          return `After ${f.i} of ${n} constraints: the optimum changed ${f.changes} times (bound $2H_{${f.i}}=${v.fix(2 * harmonic(Math.max(f.i, 0)), 2)}$; average over 300 orders ${v.fix(avg[Math.min(f.i, n)], 2)}); total 1-D work ${f.work} steps.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Method', name: 'Backwards analysis',
      statement: String.raw`**Backwards analysis** bounds the expected cost of a randomized incremental algorithm by running the last step in reverse. Fix the set $H_i=\{h_1,\dots,h_i\}$ of the first $i$ constraints, not their order: given the set, each of its $i$ members is equally likely to be the one inserted last. For the linear program of 4.3 with a unique optimum $v(H_i)$ determined by two constraints, the optimum changes at step $i$ only if the last constraint is one of those two, so $\Pr[v_i\ne v_{i-1}]\le 2/i$. Hence the expected number of one-dimensional programs is at most $\sum_{i}2/i=2H_n\approx2\ln n$, and the expected total work is $\sum_i\tfrac2i\,O(i)=O(n)$.`,
      idea: String.raw`The forward view (“what will the next random constraint do?”) depends on the unknown future set of constraints; the backward view conditions on the set seen so far and asks which of its $i$ members the algorithm just added. Removing a constraint $h$ from $H_i$ changes the optimum only when $h$ belongs to the basis, the two constraints that define the optimum (4.2: it is a vertex, the meeting of two lines). Two members out of $i$ gives $2/i$. If the optimum is still on the bounding box, fewer than two real constraints define it, and the true probability is even smaller, which the empirical curve shows for small $i$.`,
      caption: String.raw`Choose a prefix size $i$ of the constraints (in a fixed random order). The optimum (green) sits at the meeting of the two **defining** constraints (red). **Remove a random constraint** deletes one of the $i$ at random and shows where the optimum goes (orange); the tally compares how often it moved with $2/i$. The right graph is the measured probability that the $i$-th inserted constraint changed the optimum, over 4000 random orders of this instance (blue), against $2/i$ (orange).`,
      credit: 'Backwards-analysis principle and full basis-probability proof: E. Welzl, Smallest enclosing disks (balls and ellipsoids), §2, pp. 363–364; planar-LP specialization explained here',
      deps: ['cg-4.3', 'prob-1.6.1'], refs: ['Welzl (1991), §2, pp. 363–364, backwards-analysis proof; de Berg §4.4'], sourceUrl: 'https://people.inf.ethz.ch/emo/PublFiles/SmallEnclDisk_LNCS555_91.pdf', tags: ['randomization', 'analysis'],
      scope: String.raw`Uniform random insertion order; the two-dimensional LP has a fixed bounding box, remains feasible, and uses a fixed generic objective or consistent symbolic tie-breaking. Each prefix optimum has a basis of at most two inserted constraints (box constraints are fixed). Expectation is over insertion order, not an assumed input distribution.`,
      viz(v) {
        const M = 20, WX = 3.4, WY = 2.6;
        const s = v.stage({ x: [-WX, WX], y: [-WY, WY], equal: true, axes: false, height: 380, minWidth: 340 });
        const G = v.stage({ x: [2, M], y: [0, 0.85], axes: 'box', gutter: true, xlabel: 'step i', ylabel: 'probability the optimum changes', title: 'Pr[ step i changes the optimum ]', height: 380, minWidth: 280 });
        let seed = 2, inst, ord, emp, meanChanges, last = null, tally = [0, 0], trialR;
        const isl = v.slider('prefix size $i$', 3, M, 10, { int: true, onChange: () => { tally = [0, 0]; last = null; } });
        const build = () => {
          inst = randLP(v.rng(seed * 13 + 1), M);
          const ids = inst.cons.map((_, i) => i);
          ord = v.rng(seed * 5 + 2).shuffle(ids);
          const rr = v.rng(4000 + seed), cnt = new Array(M + 1).fill(0), R = 4000;
          let tot = 0;
          for (let t = 0; t < R; t++) { const fr = seidel(inst.cons, rr.shuffle(ids), inst.c); for (let i = 1; i <= M; i++) if (fr[i].violated) { cnt[i]++; tot++; } }
          emp = cnt.map((c) => c / R); meanChanges = tot / R;
          tally = [0, 0]; last = null; trialR = v.rng(seed * 101 + 7);
        };
        build();
        const optOf = (ids) => lpBest(regionOf(ids.map((k) => inst.cons[k]), 8), inst.c[0], inst.c[1]);
        const trials = (k) => {
          const i = isl.value, pre = ord.slice(0, i), full = optOf(pre);
          for (let t = 0; t < k; t++) {
            const j = trialR.int(0, i - 1), without = optOf(pre.filter((_, q) => q !== j));
            const moved = dist(full.p, without.p) > 1e-9;
            tally[0]++; if (moved) tally[1]++;
            last = { j: pre[j], p: without.p, moved, ids: pre.filter((_, q) => q !== j) };
          }
        };
        v.button('remove a random constraint', () => trials(1));
        v.button('× 200', () => trials(200));
        v.button('new instance', () => { seed++; build(); });
        v.legend([['blue', 'measured, 4000 orders'], ['orange', '2 / i', { dash: true }]]);
        v.render(() => {
          const i = isl.value, pre = ord.slice(0, i), cons = pre.map((k) => inst.cons[k]);
          const reg = regionOf(cons, 8), best = optOf(pre), basis = tightAt(cons, best.p);
          if (reg.length) s.poly(reg, { fill: 'blue', fillAlpha: 0.12, color: 'blue', width: 2 });
          cons.forEach((c, q) => {
            const e = lineEnds(c[0], c[1], c[2], [-WX, WX], [-WY, WY]);
            if (e) s.segment(e[0], e[1], { color: basis.includes(q) ? 'red' : 'blue', width: basis.includes(q) ? 4 : 1.4, alpha: basis.includes(q) ? 1 : 0.55 });
          });
          if (last) {
            const reg2 = regionOf(last.ids.map((k) => inst.cons[k]), 8), c = inst.cons[last.j], e = lineEnds(c[0], c[1], c[2], [-WX, WX], [-WY, WY]);
            if (reg2.length) s.poly(reg2, { color: 'orange', width: 2.5, dash: [6, 4] });
            if (e) s.segment(e[0], e[1], { color: 'gold', width: 3, dash: [6, 4] });
            if (last.moved) s.arrow(best.p[0], best.p[1], last.p[0], last.p[1], { color: 'orange', width: 2.5, head: 9 });
            s.dot(last.p[0], last.p[1], { r: 7, color: 'orange', hollow: true });
          }
          const lev = lineEnds(inst.c[0], inst.c[1], best.v, [-WX, WX], [-WY, WY]);
          if (lev) s.segment(lev[0], lev[1], { color: 'gold', width: 1.5, dash: [7, 5], alpha: 0.8 });
          s.dot(best.p[0], best.p[1], { r: 8, color: 'green' });
          s.arrow(-2.9, 2.0, -2.9 + 0.8 * inst.c[0], 2.0 + 0.8 * inst.c[1], { color: 'gold', width: 3, head: 9 });
          s.tex('c', -2.9 + 1.05 * inst.c[0], 2.0 + 1.05 * inst.c[1], { color: 'gold' });
          G.fn((x) => 2 / x, { domain: [2, M], color: 'orange', dash: true, width: 2 });
          G.path(emp.slice(2).map((p, k) => [k + 2, p]), { color: 'blue', width: 2.5 });
          G.dots(emp.slice(2).map((p, k) => [k + 2, p]), { r: 3.5, color: 'blue' });
          G.vline(i, { color: 'gold', width: 1.5, dash: true });
          G.dot(i, emp[i], { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const i = isl.value, basis = (() => { const cons = ord.slice(0, i).map((k) => inst.cons[k]); return tightAt(cons, optOf(ord.slice(0, i)).p).length; })();
          const sum = emp.slice(1).reduce((a, b) => a + b, 0);
          return `Prefix $i=${i}$: ${basis} constraints define the optimum, so a random one is hit with probability $${basis}/${i}=${v.fix(basis / i, 3)}$ (bound $2/i=${v.fix(2 / i, 3)}$). Removals: ${tally[0] ? `${tally[1]} of ${tally[0]} moved the optimum = ${v.fix(tally[1] / tally[0], 3)}` : 'none yet'}. Measured at step $i$: ${v.fix(emp[i], 3)}.\nExpected number of changes over all ${M} steps: measured ${v.fix(meanChanges, 2)} ≤ $2H_{${M}}=${v.fix(2 * harmonic(M), 2)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Algorithm', name: 'Smallest enclosing disc (Welzl)',
      statement: String.raw`Every **nonempty** finite set $S$ of points in the plane has a unique **smallest enclosing disc**, determined by at most three points of $S$ on its boundary (a singleton has radius zero). It is found in expected $O(n)$ time by the same randomized incremental scheme as in 4.3: insert the points $p_1,\dots,p_n$ in random order and keep the smallest enclosing disc $D_i$ of the first $i$. If $p_i\in D_{i-1}$ then $D_i=D_{i-1}$; otherwise $p_i$ lies **on the boundary** of $D_i$, and $D_i$ is the smallest disc of $p_1,\dots,p_{i-1}$ with $p_i$ on its boundary, computed by the same loop one level down (and a third level fixes a second boundary point). Welzl's recursive formulation is equivalent.`,
      idea: String.raw`Whether the disc has to be rebuilt depends only on whether $p_i$ is one of the at most three points defining $D_i$. By backwards analysis (4.4) that has probability at most $3/i$, and a rebuild costs $O(i)$, so each step costs $O(1)$ in expectation. The nested rebuilds are the same trick as the one-dimensional program of 4.3, because smallest enclosing disc is an LP-type problem. Without the shuffle nothing protects against bad orders: points arriving by growing distance from the centre rebuild at almost every step.`,
      caption: String.raw`Step through the points in the order drawn. Hollow grey points are still to come; the disc is rebuilt (the old one dashed) only when the new point (gold ring) falls outside, and then the new point and one or two older points (red) define it. The right graph counts containment tests per point for growing $n$: flat for a random order (orange) but growing roughly linearly in $n$ (quadratic total work) for the **increasing distance** order (red). Click the left panel to add a point, shift-click to remove one.`,
      credit: 'E. Welzl, 1991 (LNCS 555, pp. 359–370); linear-time deterministic algorithm by N. Megiddo, 1983',
      scope: String.raw`Expected linear work averages over a uniform random permutation for each fixed input; it is not a worst-case guarantee for an arbitrary insertion order. The nested-loop display is an iterative form, not the paper's move-to-front heuristic. Source evidence for the algorithm and its analysis is Welzl's complete original; the empty input is represented separately without claiming a unique geometric disc.`,
      deps: ['cg-4.4'], refs: ['Welzl (1991), Smallest enclosing disks (balls and ellipsoids), §2 pp. 360–363, Lemma 1 and Theorem 2; §3 one-permutation reduction pp. 365–367'], tags: ['randomization', 'enclosing disc'],
      links: { source: 'https://people.inf.ethz.ch/emo/PublFiles/SmallEnclDisk_LNCS555_91.pdf', doi: 'https://doi.org/10.1007/BFb0038202' },
      viz(v) {
        const s = v.stage({ x: [-1.75, 1.75], y: [-1.35, 1.35], equal: true, axes: false, height: 380, minWidth: 340 });
        const G = v.stage({ x: [8, 800], y: [1, 3000], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'number of points n', ylabel: 'containment tests per point', title: 'work per point', height: 380, minWidth: 280 });
        let seed = 5, P = [], S, ordered = [];
        const nsl = v.slider('points $n$', 5, 40, 14, { int: true, onChange: () => regen() });
        const mode = v.select('order', [{ value: 'random', label: 'random shuffle' }, { value: 'spiral', label: 'increasing distance' }], 'random', { onChange: () => { if (S) S.reset(); } });
        const regen = () => { P = genPts(v.rng(seed), 'disc', nsl.value, 0, 0, 1); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        const orderPts = () => {
          if (mode.value === 'random') return v.rng(seed * 3 + P.length).shuffle(P);
          const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
          return P.slice().sort((p, q) => dist(p, [cx, cy]) - dist(q, [cx, cy]));
        };
        s.onClick((x, y, mod) => {
          if (mod.shift) { let b = -1, bd = 0.02; P.forEach((p, i) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; b = i; } }); if (b >= 0 && P.length > 3) P.splice(b, 1); } else P.push([x, y]);
          S.reset();
        });
        regen();
        let run;
        S = v.steps({
          frames: () => {
            ordered = orderPts(); run = welzlRun(ordered);
            return run.frames.map((f, k) => ({ ...f, line: k === 0 ? 1 : f.reb ? 4 : 3,
              note: k === 0 ? 'Start with the smallest disc through $p_1$ and $p_2$ (their diameter).'
                : f.reb ? `Point ${f.i + 1} is outside, so it lies on the new boundary: the disc is rebuilt from the earlier points with ${f.i + 1} fixed (${f.tests} tests).`
                : `Point ${f.i + 1} is inside the disc: keep it (1 test).`,
              vars: { rebuilds: f.rebuilds, tests: f.total } }));
          },
          code: ['D ← smallest disc with p₁, p₂ on its boundary', 'for i ← 3 … n', '  if pᵢ ∈ D:  keep D', '  else  D ← MinDiscWithPoint(p₁…pᵢ₋₁, pᵢ)', '          ▷ same loop, pᵢ fixed on the boundary; O(i)', 'return D'],
          codeTitle: 'Smallest enclosing disc', speed: 1.5, still: 7,
        });
        // scaling experiment
        const sizes = [10, 20, 40, 80, 160, 320, 640], randS = [], spirS = [];
        sizes.forEach((n, ix) => {
          let acc = 0;
          for (let rep = 0; rep < 5; rep++) { const pts = genPts(v.rng(300 + ix * 10 + rep), 'disc', n, 0, 0, 1); acc += welzlRun(v.rng(77 + rep).shuffle(pts)).tests / n; }
          randS.push([n, acc / 5]);
          const pts = genPts(v.rng(300 + ix * 10), 'disc', n, 0, 0, 1);
          const cx = pts.reduce((a, p) => a + p[0], 0) / n, cy = pts.reduce((a, p) => a + p[1], 0) / n;
          spirS.push([n, welzlRun(pts.sort((p, q) => dist(p, [cx, cy]) - dist(q, [cx, cy]))).tests / n]);
        });
        v.legend([['orange', 'random order'], ['red', 'increasing distance'], ['gold', 'your instance', { dot: true }]]);
        v.render(() => {
          const f = S.frame, prev = S.prev;
          if (!run) return;
          const D = f.D;
          if (f.reb && prev && prev.D) s.circle(prev.D.x, prev.D.y, prev.D.r, { color: 'muted', width: 1.5, dash: [6, 5] });
          s.circle(D.x, D.y, D.r, { color: f.reb ? 'orange' : 'accent', fill: 'accent', fillAlpha: 0.08, width: 3 });
          ordered.forEach((p, k) => {
            const done = k <= f.i, bd = done && f.bnd.includes(k);
            s.dot(p[0], p[1], { r: bd ? 7 : 4.5, color: bd ? 'red' : done ? 'ink' : 'faint', hollow: !done });
            if (ordered.length <= 24) s.text(String(k + 1), p[0], p[1], { size: 10, dx: 8, dy: -8, color: done ? 'muted' : 'faint' });
          });
          if (f.i < ordered.length) s.dot(ordered[f.i][0], ordered[f.i][1], { r: 11, color: 'gold', hollow: true });
          G.path(randS, { color: 'orange', width: 2.5 }); G.dots(randS, { r: 4, color: 'orange' });
          G.path(spirS, { color: 'red', width: 2.5 }); G.dots(spirS, { r: 4, color: 'red' });
          const n = ordered.length;
          if (n >= 8 && n <= 800) G.dot(n, Math.max(1, run.tests / n), { r: 7, color: 'gold' });
        });
        v.readout(() => {
          const f = S.frame, i = f.i + 1;
          let bound = 0; for (let j = 3; j <= i; j++) bound += 3 / j;
          return `After ${i} points: radius $${v.fix(f.D.r, 3)}$, defined by ${f.bnd.length} points. Rebuilds so far ${f.rebuilds}; expected at most $\\sum_{j=3}^{${i}}3/j=${v.fix(bound, 2)}$. Containment tests so far: ${f.total}.`;
        });
      },
    },
  ],
};
