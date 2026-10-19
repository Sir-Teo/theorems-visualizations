// Optimization — Chapter 4: Convex optimization problems (items 4.1–4.7; 4.8–4.14 in ch04-b.js)
//
// House style: every optimum drawn is computed (polygon clipping for 2-D LPs, edge scans for QPs, grid search checked
// against the theory), and every claim "this problem is convex" is backed by a seeded chord test on the actual pieces.
import {
  clamp, chordTest, chordTest2, grad2, levelsOf, memo, rgbA, inPoly, boundaryClosest, polyhedron, boxPoly, hull,
  lp2, lpVertex, qp2, discPoly, f3, linspace, polyArea,
} from './ch04.shared.js';

export default {
  collection: 'opt',
  chapter: 4,
  title: 'Convex optimization problems',
  summary: String.raw`A convex problem minimizes a convex function over a convex set, so every local solution is global and optimality has a clean geometric test. A hierarchy of standard forms — linear, quadratic, second-order cone and semidefinite programs, plus geometric programs after a change of variables — covers a vast range of applications, from diets and portfolios to robust design. Reformulation tricks and modelling languages turn practical problems into these forms.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Convex optimization problems in standard form',
      statement: String.raw`An optimization problem in **standard form** is
$$\min_{x\in\R^n}\ f_0(x)\quad\text{subject to}\quad f_i(x)\le0\ (i=1,\dots,m),\qquad h_j(x)=0\ (j=1,\dots,p).$$
It is a **convex optimization problem** when the objective $f_0$ and all inequality functions $f_i$ are convex and the equality functions $h_j$ are affine, $h_j(x)=a_j^{\mathsf T}x-b_j$. Then the feasible set $\{x: f_i(x)\le 0,\ h_j(x)=0\}$ is convex (an intersection of sublevel sets of convex functions and affine subspaces, opt-2.5, opt-3.5), and the problem asks for the minimum of a convex function over a convex set. The *form* matters: the same feasible set can be written with a convex or a non-convex $f_i$, and only the convex description counts.`,
      idea: String.raw`Each sublevel set $\{f_i\le0\}$ of a convex function is convex (opt-3.5) and an affine equality cuts out an affine set, so the feasible set is an intersection of convex sets and is convex (opt-2.5). With a convex objective this is exactly the setting in which local minima are global (opt-3.11) and stationarity is sufficient. The definition is a syntactic contract: it is checked piece by piece on the functions that describe the problem, not on the shape of the feasible set alone, because a convex set can be described by a non-convex inequality (for example $x_1^2/(1+x_2^2)\le0$).`,
      caption: String.raw`Choose an objective and two inequality constraints $f_1,f_2\le0$. The shaded region is the feasible set; contours are those of $f_0$. Each piece is **tested**: a seeded chord test on $f_0$, $f_1$, $f_2$ over the window and on the feasible set itself. The problem is called convex only when every piece passes. Gold dots are the local minimizers found on a fine grid of the feasible set, green is the best of them. Switch to a non-convex objective or constraint and the feasible set loses convexity or extra local minima appear; the *hole* constraint $1-x_1^2-x_2^2\le0$ describes the outside of a disc, which is not convex.`,
      deps: ['opt-3.1', 'opt-1.1'],
      refs: ['Boyd–Vandenberghe §4.2'],
      tags: ['convex problem', 'standard form'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_optimization' },
      viz(v) {
        const OBJ = {
          bowl: { label: 'convex bowl', f: (x, y) => 0.5 * (x - 1.8) ** 2 + 0.35 * (y - 0.6) ** 2 + 0.2 * (x - 1.8) * (y - 0.6) },
          wave: { label: 'wavy', f: (x, y) => 0.18 * ((x - 0.8) ** 2 + (y - 0.2) ** 2) + 0.9 * Math.sin(1.7 * x) * Math.sin(1.7 * y) },
        };
        const G1 = {
          disc: { label: '$x_1^2+x_2^2\\le 9$', g: (x, y) => x * x + y * y - 9 },
          hole: { label: 'hole: $1-x_1^2-x_2^2\\le0$', g: (x, y) => 1 - x * x - y * y },
        };
        const G2 = {
          half: { label: '$x_1+x_2\\le 2.5$', g: (x, y) => x + y - 2.5 },
          cup: { label: '$x_1^2-x_2-1\\le0$', g: (x, y) => x * x - y - 1 },
          cap: { label: '$x_2-x_1^2+1\\le0$', g: (x, y) => y - x * x + 1 },
        };
        const so = v.select('objective $f_0$', Object.entries(OBJ).map(([k, o]) => ({ value: k, label: o.label })), 'bowl');
        const s1 = v.select('constraint $f_1\\le0$', Object.entries(G1).map(([k, o]) => ({ value: k, label: o.label })), 'disc');
        const s2 = v.select('constraint $f_2\\le0$', Object.entries(G2).map(([k, o]) => ({ value: k, label: o.label })), 'half');
        const W = [-4, -4, 4, 4];
        const S = v.stage({ x: [-4, 4], y: [-3.4, 3.4], equal: true, axes: 'box', gutter: true, height: 420, title: 'feasible set, contours of $f_0$ and local minimizers' });
        const mm = memo();
        let info = {};
        v.render(() => {
          const key = [so.value, s1.value, s2.value].join('|');
          const f0 = OBJ[so.value].f, g1 = G1[s1.value].g, g2 = G2[s2.value].g;
          const feas = (x, y) => g1(x, y) <= 0 && g2(x, y) <= 0;
          const R = mm(key, () => {
            const t0 = chordTest2(f0, W, { seed: 3 }), t1 = chordTest2(g1, W, { seed: 4 }), t2 = chordTest2(g2, W, { seed: 5 });
            const ts = chordTest(feas, W, { seed: 8 });
            // local minimizers on a grid of the feasible set
            const N = 90, X = (i) => -4 + (8 * i) / N, ok = new Uint8Array((N + 1) * (N + 1)), val = new Float64Array((N + 1) * (N + 1));
            for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const k = j * (N + 1) + i; ok[k] = feas(X(i), X(j)) ? 1 : 0; val[k] = f0(X(i), X(j)); }
            const loc = new Uint8Array(ok.length);
            for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
              const k = j * (N + 1) + i; if (!ok[k]) continue;
              let m = true;
              for (let dj = -1; dj <= 1 && m; dj++) for (let di = -1; di <= 1; di++) {
                if (!di && !dj) continue; const a = i + di, b = j + dj; if (a < 0 || b < 0 || a > N || b > N) continue;
                const k2 = b * (N + 1) + a; if (ok[k2] && val[k2] < val[k] - 1e-12) { m = false; break; }
              }
              loc[k] = m ? 1 : 0;
            }
            // cluster the flagged cells
            const seen = new Uint8Array(ok.length), mins = [];
            for (let k = 0; k < loc.length; k++) {
              if (!loc[k] || seen[k]) continue;
              const st = [k]; seen[k] = 1; let best = k;
              while (st.length) {
                const q = st.pop(), qi = q % (N + 1), qj = (q - qi) / (N + 1); if (val[q] < val[best]) best = q;
                for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
                  const a = qi + di, b = qj + dj; if (a < 0 || b < 0 || a > N || b > N) continue; const k2 = b * (N + 1) + a;
                  if (loc[k2] && !seen[k2]) { seen[k2] = 1; st.push(k2); }
                }
              }
              const bi = best % (N + 1), bj = (best - bi) / (N + 1); mins.push({ x: X(bi), y: X(bj), f: val[best] });
            }
            mins.sort((a, b) => a.f - b.f);
            return { t0, t1, t2, ts, mins };
          });
          S.raster((x, y) => (feas(x, y) ? rgbA(v, 'accent', 46) : null), { res: 3, key: 'F|' + key });
          S.clip(() => {
            S.contour(f0, levelsOf(f0, -4, 4, -3.4, 3.4, 14), { color: 'ink', alpha: 0.32, width: 1, res: 100 });
            S.contour(g1, [0], { color: 'blue', width: 2.4, res: 140 });
            S.contour(g2, [0], { color: 'orange', width: 2.4, res: 140 });
          });
          R.mins.forEach((m, i) => S.dot(m.x, m.y, { r: i === 0 ? 7 : 5, color: i === 0 ? 'green' : 'gold' }));
          const convex = R.t0.bad === 0 && R.t1.bad === 0 && R.t2.bad === 0;
          S.corner(convex ? 'convex problem' : 'not a convex problem', 'tl', { plate: true, color: convex ? 'green' : 'red' });
          info = { R, convex };
        });
        v.legend([['blue', '$f_1=0$'], ['orange', '$f_2=0$'], ['accent', 'feasible set', { area: true }], ['green', 'best local minimizer', { dot: true }], ['gold', 'other local minimizers', { dot: true }]]);
        v.readout(() => {
          const { R, convex } = info; const yn = (t) => (t.bad === 0 ? '✓ convex' : `✗ ${t.bad}/${t.tested} chords fail`);
          return `Chord tests: $f_0$ ${yn(R.t0)}; $f_1$ ${yn(R.t1)}; $f_2$ ${yn(R.t2)}; feasible set ${R.ts.m < 12 ? 'empty or tiny' : yn(R.ts)}.\nLocal minimizers of $f_0$ on the feasible set: **${R.mins.length}**${R.mins.length ? ` (best value $${f3(v, R.mins[0].f)}$)` : ''}. Standard-form convex problem: **${convex ? 'yes' : 'no'}**${convex && R.mins.length > 1 ? ' — but see the grid: several clusters here are the same minimizer on a plateau' : ''}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Optimality condition for convex problems',
      statement: String.raw`Let $f_0$ be convex and differentiable, and let $X$ be the feasible set of a convex problem. A feasible point $x$ is optimal **if and only if**
$$\nabla f_0(x)^{\mathsf T}(y-x)\ \ge\ 0\qquad\text{for all }y\in X .$$
Geometrically, $-\nabla f_0(x)$ makes an obtuse (or right) angle with every feasible direction $y-x$, so the hyperplane $\{y:\nabla f_0(x)^{\mathsf T}(y-x)=0\}$ supports $X$ at $x$. If $x$ is interior, the condition reads $\nabla f_0(x)=0$. For a non-convex $X$ the condition tested only on small feasible steps is merely necessary.`,
      idea: String.raw`If $\nabla f_0(x)^{\mathsf T}(y-x)<0$ for some feasible $y$, then moving from $x$ toward $y$ (which stays feasible by convexity of $X$) decreases $f_0$ to first order, so $x$ is not optimal. Conversely, if the inequality holds for all $y\in X$, the first-order underestimator (opt-3.2) gives $f_0(y)\ge f_0(x)+\nabla f_0(x)^{\mathsf T}(y-x)\ge f_0(x)$, so $x$ is a global minimizer. The supporting hyperplane theorem (opt-2.8) is the geometric content: the sublevel set of $f_0$ through $x$ and $X$ touch with a common supporting line.`,
      caption: String.raw`Drag the candidate $x$ (gold) around the feasible set and the unconstrained minimizer $m$ (grey) of $f_0(y)=\tfrac12(y-m)^{\mathsf T}Q(y-m)$ outside it. The green arrow is $-\nabla f_0(x)$; the red half-plane is the set of $y$ where $\nabla f_0(x)^{\mathsf T}(y-x)<0$, the *improving* directions. $x$ is optimal exactly when that red half-plane contains no point of the set. The readout reports the smallest value of $\nabla f_0(x)^{\mathsf T}(y-x)$ over the set. Choose the *dented* set (not convex) to see a point that passes the test for all nearby $y$ yet fails globally.`,
      deps: ['opt-4.1', 'opt-3.2'],
      refs: ['Boyd–Vandenberghe §4.2'],
      tags: ['optimality', 'supporting hyperplane'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Karush%E2%80%93Kuhn%E2%80%93Tucker_conditions' },
      viz(v) {
        const SETS = {
          pent: { label: 'pentagon', P: [[-2.2, -1.4], [0.4, -2.2], [2.5, -0.8], [2.2, 1.6], [-1.0, 2.0]] },
          disc: { label: 'disc', P: discPoly(0, 0, 2.1, 120) },
          dent: { label: 'dented (not convex)', P: [[-2.4, -2], [2.4, -2], [2.4, 2], [0.5, 2], [0.5, -0.2], [-0.5, -0.2], [-0.5, 2], [-2.4, 2]] },
        };
        const sel = v.select('feasible set', Object.entries(SETS).map(([k, o]) => ({ value: k, label: o.label })), 'pent');
        const kap = v.slider('conditioning of $Q$', 1, 8, 3, { step: 0.1 });
        const S = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, axes: 'box', gutter: true, height: 430, title: 'feasible set, $-\\nabla f_0(x)$ and the improving half-plane' });
        const M = S.handle(3.4, 2.0, { color: 'muted', label: 'm', labelPos: 'ne', constrain: { x: [-4.8, 4.8], y: [-3.4, 3.4] } });
        const proj = (x, y) => {
          const P = SETS[sel.value].P;
          if (inPoly(x, y, P)) return [x, y];
          return boundaryClosest([x, y], P).q;
        };
        const X = S.handle(1.2, 0.2, { color: 'gold', label: 'x', labelPos: 'sw', constrain: proj });
        const Qof = () => { const th = 0.45, c = Math.cos(th), s = Math.sin(th), k = kap.value; return [[c * c + k * s * s, (1 - k) * c * s], [(1 - k) * c * s, s * s + k * c * c]]; };
        v.button('jump to the optimum', () => { const o = qp2(Qof(), [M.x, M.y], SETS[sel.value].P); X.set(o.x[0], o.x[1]); });
        let info = {};
        v.render(() => {
          const P = SETS[sel.value].P, Q = Qof(), m = [M.x, M.y];
          const p = proj(X.x, X.y); X.set(p[0], p[1]);
          const f = (x, y) => 0.5 * ((x - m[0]) * (Q[0][0] * (x - m[0]) + Q[0][1] * (y - m[1])) + (y - m[1]) * (Q[0][1] * (x - m[0]) + Q[1][1] * (y - m[1])));
          const g = [Q[0][0] * (X.x - m[0]) + Q[0][1] * (X.y - m[1]), Q[0][1] * (X.x - m[0]) + Q[1][1] * (X.y - m[1])];
          const gn = Math.hypot(g[0], g[1]);
          // improving half-plane
          S.raster((x, y) => ((x - X.x) * g[0] + (y - X.y) * g[1] < -1e-9 ? rgbA(v, 'red', 40) : null), { res: 3, key: `H|${g[0].toFixed(3)}|${g[1].toFixed(3)}|${X.x.toFixed(3)}|${X.y.toFixed(3)}` });
          S.poly(P, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.4 });
          S.clip(() => {
            S.contour(f, [0.15, 0.5, 1.2, 2.5, 4.5, 7.5, 12], { color: 'ink', alpha: 0.28, width: 1, res: 100 });
            S.contour(f, [f(X.x, X.y)], { color: 'gold', width: 2, res: 120 });
            if (gn > 1e-9) { const L = 12; S.line(X.x - L * g[1] / gn, X.y + L * g[0] / gn, X.x + L * g[1] / gn, X.y - L * g[0] / gn, { color: 'red', width: 1.4, dash: true }); }
          });
          if (gn > 1e-9) S.arrow(X.x, X.y, X.x - 1.4 * g[0] / gn, X.y - 1.4 * g[1] / gn, { color: 'green', width: 3 });
          const opt = qp2(Q, m, P);
          S.dot(opt.x[0], opt.x[1], { r: 6, color: 'green', hollow: true, width: 2 });
          let mn = Infinity, mnLoc = Infinity;
          const smp = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; for (let k = 0; k < 40; k++) smp.push([a[0] + (b[0] - a[0]) * k / 40, a[1] + (b[1] - a[1]) * k / 40]); }
          for (const y of smp) {
            const d = g[0] * (y[0] - X.x) + g[1] * (y[1] - X.y); mn = Math.min(mn, d);
            if (Math.hypot(y[0] - X.x, y[1] - X.y) < 0.35) mnLoc = Math.min(mnLoc, d);
          }
          info = { mn, mnLoc, f: f(X.x, X.y), fstar: opt.f, convex: sel.value !== 'dent', gn };
        });
        v.legend([['green', '$-\\nabla f_0(x)$'], ['red', 'improving half-plane', { area: true }], ['gold', 'level set through $x$'], ['green', 'true optimum', { dot: true }]]);
        v.readout(() => {
          const { mn, mnLoc, f, fstar, convex, gn } = info;
          const glob = mn >= -1e-6;
          return `$\\min_{y\\in X}\\nabla f_0(x)^{\\mathsf T}(y-x)=${f3(v, mn)}$ (nearby steps only: $${f3(v, mnLoc === Infinity ? 0 : mnLoc)}$). Condition ${glob ? '**holds**: $x$ is optimal' : '**fails**: some feasible direction improves $f_0$'}.\n$f_0(x)=${f3(v, f)}$, optimal value $${f3(v, fstar)}$, gap $${f3(v, f - fstar)}$.${!convex && !glob && mnLoc >= -1e-6 ? ' The set is not convex: $x$ passes the local test but is not optimal.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Equivalent reformulations: epigraph form and slack variables',
      statement: String.raw`Two optimization problems are **equivalent** when a solution of one is readily obtained from a solution of the other. Two reformulations keep convexity:
(a) **Epigraph form.** $\min_x f_0(x)$ s.t. $f_i(x)\le0$ is equivalent to $\min_{x,t} t$ s.t. $f_0(x)\le t,\ f_i(x)\le0$. In particular $\min_x\max_k f_k(x)$ becomes $\min_{x,t}t$ s.t. $f_k(x)\le t$ for all $k$.
(b) **Slack variables.** $f_i(x)\le0$ is equivalent to $f_i(x)+s_i=0,\ s_i\ge0$. The new equality is affine only when $f_i$ is affine, so this reformulation preserves convexity only for affine inequalities.
Epigraph form moves all nonlinearity into the constraints and gives a linear objective, which is why it is the working form of conic solvers.`,
      idea: String.raw`For (a): at the optimum of the new problem $t=f_0(x)$, otherwise $t$ could be lowered; so optimal $x$ coincide and the values agree. The feasible set of the new problem is $\operatorname{epi}f_0$ intersected with the original constraints (opt-3.1), which is convex when $f_0$ is. For (b): the map $x\mapsto(x,-f_i(x))$ identifies the two feasible sets. If $f_i$ is convex but not affine, $\{(x,s):f_i(x)+s=0\}$ is the graph of $-f_i$, which is not an affine set, and the slack form is not a convex problem as written.`,
      caption: String.raw`**Left (epigraph):** the shaded region is $\{(x,t):t\ge\max_kf_k(x)\}$. Slide the level $t$: the horizontal line meets the epigraph in the green interval $\{x:\max_kf_k(x)\le t\}$, which is empty for $t<t^\star$ and shrinks to the single point $x^\star$ at $t=t^\star$, the optimal value of both problems. **Right (slack):** minimize $(x-2.2)^2$ subject to $x^2\le b$; the slack $s=b-x^2$ must be $\ge0$. Move $b$: the optimal $x$ is $\min(2.2,\sqrt b)$ whichever way it is computed.`,
      deps: ['opt-4.1'],
      refs: ['Boyd–Vandenberghe §4.1'],
      tags: ['epigraph form', 'slack variable', 'reformulation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mathematical_optimization#Epigraph_form' },
      viz(v) {
        const PR = {
          two: { label: 'two parabolas', fs: [(x) => 0.5 * (x + 1.2) ** 2 + 0.2, (x) => 0.8 * (x - 1.4) ** 2 + 0.5] },
          three: { label: 'three functions', fs: [(x) => 0.5 * (x + 1.6) ** 2, (x) => 0.9 * (x - 1.6) ** 2 + 0.3, (x) => Math.exp(0.8 * x) / 3 + 0.4 - 0.15 * x * x * 0 + 0.9] },
          pw: { label: 'piecewise linear', fs: [(x) => -1.1 * x + 0.2, (x) => 0.7 * x + 0.9, (x) => 0.15 * x + 1.6 + 0.0] },
        };
        const sel = v.select('problem', Object.entries(PR).map(([k, o]) => ({ value: k, label: o.label })), 'two');
        const tS = v.slider('level $t$', 0, 6, 3, { step: 0.01 });
        const bS = v.slider('budget $b$ in $x^2\\le b$', 0, 9, 2.5, { step: 0.01 });
        const L = v.stage({ x: [-3.2, 3.2], y: [-0.6, 6.4], axes: 'box', gutter: true, grid: true, height: 380, title: 'epigraph form of $\\min_x\\max_kf_k$', xlabel: '$x$', ylabel: '$t$' });
        const R = v.stage({ x: [-3.2, 3.2], y: [-2, 6.4], axes: 'box', gutter: true, grid: true, height: 380, title: 'slack form of $x^2\\le b$', xlabel: '$x$' });
        const XS = linspace(-3.2, 3.2, 3201);
        let info = {};
        v.render(() => {
          const fs = PR[sel.value].fs, F = (x) => Math.max(...fs.map((f) => f(x)));
          let tstar = Infinity, xstar = 0; for (const x of XS) { const y = F(x); if (y < tstar) { tstar = y; xstar = x; } }
          L.raster((x, t) => (t >= F(x) ? rgbA(v, 'accent', 44) : null), { res: 3, key: 'E|' + sel.value });
          const cols = ['blue', 'orange', 'purple'];
          fs.forEach((f, i) => L.fn(f, { color: cols[i], width: 1.6, alpha: 0.7, n: 300 }));
          L.fn(F, { color: 'accent', width: 3, n: 400 });
          const t = tS.value; L.hline(t, { color: 'ink', alpha: 0.6, width: 1.2 });
          const xs = XS.filter((x) => F(x) <= t);
          if (xs.length) { L.segment([xs[0], t], [xs[xs.length - 1], t], { color: 'green', width: 5 }); }
          L.dot(xstar, tstar, { r: 6, color: 'gold', label: '$(x^\\star,t^\\star)$', labelPos: 'se' });
          // slack panel
          const b = bS.value, f0 = (x) => (x - 2.2) ** 2, s = (x) => b - x * x;
          R.fn(f0, { color: 'accent', width: 2.4, n: 300 });
          R.fn(s, { color: 'orange', width: 2, n: 300 });
          R.hline(0, { color: 'ink', alpha: 0.5 });
          const r = Math.sqrt(b);
          R.hband(-0.15, 0.15, { color: 'green', alpha: 0.0 });
          R.segment([-r, 0], [r, 0], { color: 'green', width: 5 });
          const orig = XS.filter((x) => x * x <= b).reduce((bst, x) => (f0(x) < f0(bst) ? x : bst), 0);
          // slack form: minimize f0(x) over (x, s) with x^2 + s = b, s >= 0 : parametrize by x, then s is determined
          let slBest = null; for (const x of XS) { const sv = b - x * x; if (sv >= -1e-12 && (slBest === null || f0(x) < f0(slBest))) slBest = x; }
          R.dot(orig, f0(orig), { r: 6, color: 'gold' });
          R.dot(orig, s(orig), { r: 5, color: 'orange' });
          info = { tstar, xstar, t, feas: xs.length ? [xs[0], xs[xs.length - 1]] : null, orig, slBest, exact: Math.min(2.2, Math.sqrt(b)), sOpt: s(orig) };
        });
        v.legend([['accent', '$\\max_kf_k$'], ['green', 'feasible $x$ at the level / for the budget', {}], ['gold', 'optimum', { dot: true }], ['orange', 'slack $s=b-x^2$']]);
        v.readout(() => {
          const i = info;
          return `Epigraph: $t^\\star=${f3(v, i.tstar)}$ at $x^\\star=${f3(v, i.xstar)}$. At level $t=${f3(v, i.t, 2)}$ the feasible set is ${i.feas ? `$[${f3(v, i.feas[0], 2)},${f3(v, i.feas[1], 2)}]$` : 'empty (below $t^\\star$)'}.\nSlack: original optimum $x=${f3(v, i.orig)}$, slack-form optimum $x=${f3(v, i.slBest)}$, closed form $\\min(2.2,\\sqrt b)=${f3(v, i.exact)}$; slack there is $${f3(v, i.sOpt)}$ ($=0$ exactly when the constraint is active).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Linear programs',
      statement: String.raw`A **linear program** (LP) minimizes a linear function over a polyhedron:
$$\min_x\ c^{\mathsf T}x+d\quad\text{s.t.}\quad Gx\preceq h,\ \ Ax=b,$$
the special case of a convex problem with affine $f_0,f_i,h_j$. Its feasible set is a polyhedron (opt-2.3). Exactly one of the following holds: the LP is **infeasible** (empty polyhedron), **unbounded** (the objective decreases without limit along a ray), or has an **optimal solution**, in which case an optimal vertex exists whenever the polyhedron has one, and the optimal set is a face of the polyhedron. The **standard form** $\min c^{\mathsf T}x$ s.t. $Ax=b,\ x\succeq0$ and the **inequality form** are equivalent via slack variables (opt-4.3).`,
      idea: String.raw`The objective is constant on hyperplanes $c^{\mathsf T}x=\alpha$ and the polyhedron is a finite intersection of half-spaces, so decreasing $\alpha$ until the level hyperplane last touches the set (opt-2.12) makes it meet a face; if the set recedes to infinity in a direction of decrease the touching never happens (unbounded), and if it is empty there is nothing to touch. At a vertex $x^\star$ with active constraints $a_i^{\mathsf T}x=h_i$, optimality says $-c$ lies in the cone generated by the active normals — the optimality condition of opt-4.2 for a polyhedron.`,
      caption: String.raw`Each coloured dot is a point on one constraint line $a_i^{\mathsf T}x=h_i$, and dragging it slides that line (the normal direction stays fixed). Switch constraints on and off, and drag the gold cost handle $c$. The dashed lines are level sets of $c^{\mathsf T}x$ and the green dot the computed optimal vertex; its active constraints are highlighted and the multipliers with $-c=\sum\lambda_ia_i$ are printed, all $\ge0$. Turn off the constraints that stop the descent to see **unbounded**; push opposite constraints through each other to see **infeasible**.`,
      credit: 'Kantorovich; Dantzig',
      deps: ['opt-1.7', 'opt-4.1'],
      refs: ['Boyd–Vandenberghe §4.3'],
      tags: ['linear program', 'polyhedron'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Linear_programming' },
      viz(v) {
        const ANG = [0, 90, 180, 270, 35, 125];
        const P0 = [[3.6, 0], [0, 3.2], [-1.2, 0], [0, -1.0], [2.4, 1.9], [-0.6, 2.6]];
        const NAMES = ['$x_1\\le$', '$x_2\\le$', '$-x_1\\le$', '$-x_2\\le$', '$a_5$', '$a_6$'];
        const COL = ['blue', 'orange', 'purple', 'teal', 'pink', 'red'];
        const S = v.stage({ x: [-3.2, 5.4], y: [-2.6, 4.6], equal: true, axes: 'box', gutter: true, height: 420, title: 'LP: feasible polygon, level sets of $c^{\\mathsf T}x$' });
        const nrm = ANG.map((a) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]);
        const H = P0.map((p, i) => S.handle(p[0], p[1], { color: COL[i], r: 6, label: String(i + 1), labelPos: 'ne' }));
        const on = ANG.map((_, i) => v.toggle(`constraint ${i + 1}`, true));
        const C = S.handle(1.0, 0.8, { color: 'gold', label: '$c$', labelPos: 'ne', constrain: { x: [-3, 3], y: [-3, 3] } });
        let info = {};
        v.render(() => {
          const hs = [], idx = [];
          nrm.forEach((n, i) => { if (on[i].value) { hs.push({ nx: n[0], ny: n[1], c: n[0] * H[i].x + n[1] * H[i].y }); idx.push(i); } });
          const c = [C.x, C.y], R = 12, res = lp2(c, hs, R);
          nrm.forEach((n, i) => {
            const k = n[0] * H[i].x + n[1] * H[i].y, t = [-n[1], n[0]], q = [n[0] * k, n[1] * k];
            S.line(q[0] - 30 * t[0], q[1] - 30 * t[1], q[0] + 30 * t[0], q[1] + 30 * t[1], { color: COL[i], width: on[i].value ? 1.8 : 1, alpha: on[i].value ? 0.9 : 0.25, dash: on[i].value ? undefined : true });
            if (on[i].value) S.arrow(H[i].x, H[i].y, H[i].x - 0.6 * n[0], H[i].y - 0.6 * n[1], { color: COL[i], width: 1.4, alpha: 0.7 });
          });
          let lam = null;
          if (res.status !== 'infeasible') {
            S.poly(res.poly, { fill: 'green', fillAlpha: 0.16, color: 'green', width: 2.2 });
            const fl = res.f;
            for (let k = -4; k <= 3; k++) {
              const alpha = fl + k * 1.2 * Math.hypot(c[0], c[1]) * 0.4, nn = Math.hypot(c[0], c[1]) || 1, q = [(c[0] * alpha) / (nn * nn), (c[1] * alpha) / (nn * nn)], t = [-c[1] / nn, c[0] / nn];
              S.line(q[0] - 30 * t[0], q[1] - 30 * t[1], q[0] + 30 * t[0], q[1] + 30 * t[1], { color: 'gold', width: k === 0 ? 2.2 : 1, alpha: k === 0 ? 0.9 : 0.4, dash: k === 0 ? undefined : true });
            }
            if (res.status === 'optimal') {
              S.dot(res.x[0], res.x[1], { r: 7, color: 'green' });
              const act = res.active.map((j) => idx[j]);
              act.forEach((i) => S.dot(res.x[0], res.x[1], { r: 11, color: COL[i], hollow: true, width: 2 }));
              if (act.length === 2) {
                const [i, j] = act, d = nrm[i][0] * nrm[j][1] - nrm[i][1] * nrm[j][0];
                if (Math.abs(d) > 1e-9) lam = [i, j, (-c[0] * nrm[j][1] + c[1] * nrm[j][0]) / d, (-nrm[i][0] * c[1] + nrm[i][1] * c[0]) / d];
              } else if (act.length === 1) { const i = act[0]; lam = [i, -1, -(c[0] * nrm[i][0] + c[1] * nrm[i][1]), 0]; }
            }
          }
          S.arrow(0, 0, -c[0], -c[1], { color: 'gold', width: 3 });
          info = { res, act: res.status === 'optimal' ? res.active.map((j) => idx[j]) : [], lam, c };
        });
        v.legend([['gold', '$-c$ (descent direction) and level sets'], ['green', 'feasible polygon / optimal vertex']]);
        v.readout(() => {
          const { res, act, lam, c } = info;
          if (res.status === 'infeasible') return 'Status: **infeasible** — the half-planes have no common point.';
          if (res.status === 'unbounded') return `Status: **unbounded** — $c^{\\mathsf T}x$ decreases without limit along an unbounded edge of the feasible region (the polygon is cut off by the box $|x_i|\\le12$ only for drawing).`;
          const mult = lam ? `$-c=${lam[1] >= 0 ? `${f3(v, lam[2])}\\,a_{${lam[0] + 1}}+${f3(v, lam[3])}\\,a_{${lam[1] + 1}}` : `${f3(v, lam[2])}\\,a_{${lam[0] + 1}}`}$ with multipliers $\\ge0$ ${lam[2] >= -1e-7 && lam[3] >= -1e-7 ? '✓' : '✗'}` : act.length > 2 ? 'degenerate vertex (more than two active constraints)' : 'optimal edge: $c$ is parallel to a constraint normal';
          return `Status: **optimal**, $p^\\star=${f3(v, res.f)}$ at $x^\\star=(${f3(v, res.x[0], 2)},${f3(v, res.x[1], 2)})$; active constraints: ${act.map((i) => i + 1).join(', ') || 'none'}.\n${mult}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Model',
      name: 'The diet problem',
      statement: String.raw`Choose amounts $x_j\ge0$ of $n$ foods with unit prices $p_j$ and nutrient content $A_{ij}$ (amount of nutrient $i$ per unit of food $j$) to meet minimal requirements $r_i$ at least cost:
$$\min_x\ p^{\mathsf T}x\quad\text{s.t.}\quad Ax\succeq r,\ x\succeq0 .$$
Assume the requirements are feasible and prices are strictly positive. This is a linear program (opt-4.4). Its optimal value $C(p)=\min_x p^{\mathsf T}x$ is a **concave, piecewise-linear** function of the price vector (a minimum of linear functions of $p$), an optimal vertex diet can be chosen, and this choice can jump between vertices as prices cross thresholds. At a vertex, the number of positive food amounts is at most the rank of the binding nutrient constraints; tied optima may also be mixtures of optimal vertices.`,
      idea: String.raw`Feasibility does not depend on the prices, only the direction of the level sets $p^{\mathsf T}x=\alpha$ does; by opt-4.4 the optimum is attained at a vertex, and rotating $p$ (changing prices) moves the touching point along the boundary, jumping when the level lines become parallel to an edge. For fixed vertex $x^v$ the cost $p^{\mathsf T}x^v$ is linear in $p$, and $C(p)=\min_vp^{\mathsf T}x^v$ is a pointwise minimum of linear functions, hence concave.`,
      caption: String.raw`Pick two foods and drag the price sliders. **Left:** the feasible region of amounts (units of 100 g) of the two foods, with each nutrient requirement as a boundary line, the cost level lines and the cheapest feasible diet (green). Raise the price of one food and the solution jumps to another vertex. **Middle:** the nutrient totals of the optimal diet as a percentage of the requirement; binding nutrients sit at exactly 100%. **Right:** optimal cost against the price of the first food: concave and piecewise linear, with kinks where the optimal vertex changes. The nutrient values are rounded numbers of the size found in food tables and the prices are made up: this is a model, not Stigler's data.`,
      scope: String.raw`A model with rounded, illustrative nutrient values per 100 g and invented prices; real diet LPs use many more foods and nutrients and integer or palatability constraints.`,
      credit: 'Stigler',
      deps: ['opt-4.4'],
      refs: ['Boyd–Vandenberghe §4.3'],
      tags: ['diet problem', 'linear program', 'model'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stigler_diet' },
      viz(v) {
        // per 100 g: energy (kcal), protein (g), calcium (mg). Rounded illustrative values; prices invented.
        const FOODS = [
          { n: 'bread', a: [266, 8.9, 151], p: 0.3 },
          { n: 'milk', a: [61, 3.2, 113], p: 0.12 },
          { n: 'beans', a: [127, 8.7, 35], p: 0.2 },
          { n: 'orange', a: [47, 0.9, 40], p: 0.35 },
          { n: 'oats', a: [389, 16.9, 54, 0], p: 0.25 },
        ];
        const NUT = [{ n: 'energy', r: 2000, u: 'kcal' }, { n: 'protein', r: 56, u: 'g' }, { n: 'calcium', r: 1000, u: 'mg' }];
        const CAP = 8; // at most 800 g of any one food
        const opts = FOODS.map((f, i) => ({ value: String(i), label: f.n }));
        const sa = v.select('food 1 (horizontal)', opts, '0'), sb = v.select('food 2 (vertical)', opts, '2');
        const pa = v.slider('price of food 1 (\\$ per 100 g)', 0.02, 1.0, 0.55, { step: 0.005 });
        const pb = v.slider('price of food 2 (\\$ per 100 g)', 0.02, 1.0, FOODS[2].p, { step: 0.005 });
        let last = ['0', '2'];
        const sync = () => { if (sa.value !== last[0]) { pa.set(FOODS[+sa.value].p); last[0] = sa.value; } if (sb.value !== last[1]) { pb.set(FOODS[+sb.value].p); last[1] = sb.value; } };
        const S = v.stage({ x: [-0.3, 9], y: [-0.3, 9], equal: true, axes: 'box', gutter: true, height: 380, title: 'feasible amounts (100 g)', xlabel: 'food 1', ylabel: 'food 2' });
        const B = v.stage({ x: [0, 4], y: [0, 2.2], axes: 'box', gutter: true, height: 380, title: 'nutrients of the optimal diet / requirement', xticks: [[1, 'energy'], [2, 'protein'], [3, 'calcium']] });
        const Cv = v.stage({ x: [0, 1], y: [0, 4], axes: 'box', gutter: true, grid: true, height: 380, title: 'optimal cost vs price of food 1', xlabel: 'price of food 1 ($)', ylabel: 'daily cost ($)' });
        const build = (ia, ib) => NUT.map((nu, i) => ({ nx: -FOODS[ia].a[i], ny: -FOODS[ib].a[i], c: -nu.r })).concat([{ nx: -1, ny: 0, c: 0 }, { nx: 0, ny: -1, c: 0 }, { nx: 1, ny: 0, c: CAP }, { nx: 0, ny: 1, c: CAP }]);
        let info = {};
        v.render(() => {
          sync();
          const ia = +sa.value, ib = +sb.value, hs = build(ia, ib), R = 20;
          const res = lp2([pa.value, pb.value], hs, R);
          // the box [-R,R]^2 is far outside the window; unbounded polyhedra are fine (cost is positive)
          S.poly(res.poly, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1.8 });
          const cols = ['blue', 'orange', 'purple', 'teal'];
          NUT.forEach((nu, i) => {
            const a = FOODS[ia].a[i], b = FOODS[ib].a[i];
            if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) return;
            const pts = [];
            if (Math.abs(b) > 1e-9) { pts.push([-1, (nu.r - a * -1) / b], [40, (nu.r - a * 40) / b]); } else { pts.push([nu.r / a, -1], [nu.r / a, 40]); }
            S.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], { color: cols[i], width: 1.6, alpha: 0.9 });
          });
          if (res.status === 'infeasible') { S.corner('infeasible: these two foods cannot meet every requirement', 'tl', { plate: true, color: 'red' }); }
          else {
            const nn = Math.hypot(pa.value, pb.value);
            for (let k = 1; k <= 5; k++) { const al = res.f * k / 3; const q = [pa.value * al / (nn * nn), pb.value * al / (nn * nn)], t = [-pb.value / nn, pa.value / nn]; S.line(q[0] - 60 * t[0], q[1] - 60 * t[1], q[0] + 60 * t[0], q[1] + 60 * t[1], { color: 'gold', width: k === 3 ? 2.2 : 1, alpha: k === 3 ? 0.95 : 0.4, dash: k === 3 ? undefined : true }); }
            S.dot(res.x[0], res.x[1], { r: 7, color: 'green' });
            const tot = NUT.map((nu, i) => (FOODS[ia].a[i] * res.x[0] + FOODS[ib].a[i] * res.x[1]) / nu.r);
            B.setView([0, 4], [0, Math.max(1.3, 1.1 * Math.max(...tot))]);
            B.bars(tot, { x0: 1, dx: 1, color: (val) => (Math.abs(val - 1) < 1e-6 ? 'green' : 'accent') });
            B.hline(1, { color: 'red', width: 1.6, dash: true });
          }
          // cost curve
          const top = lp2([1, pb.value], hs, R); Cv.setView([0, 1], [0, top.status === 'infeasible' ? 1 : 1.1 * top.f]);
          const cs = [], ks = [];
          let prev = null;
          for (let i = 0; i <= 200; i++) {
            const p = (i / 200) * 1, r = lp2([p, pb.value], hs, R);
            if (r.status === 'infeasible') { cs.push(null); continue; }
            cs.push([p, r.f]);
            const key = r.x.map((z) => z.toFixed(3)).join(',');
            if (prev !== null && key !== prev) ks.push([p, r.f]);
            prev = key;
          }
          Cv.path(cs, { color: 'accent', width: 2.6 });
          ks.forEach((k) => Cv.dot(k[0], k[1], { r: 4, color: 'orange' }));
          if (res.status !== 'infeasible') Cv.dot(pa.value, res.f, { r: 6, color: 'green' });
          info = { res, ia, ib, ks };
        });
        v.readout(() => {
          const { res, ia, ib, ks } = info;
          if (res.status === 'infeasible') return `Foods ${FOODS[ia].n} and ${FOODS[ib].n} alone cannot supply every nutrient (a food missing from the pair may be the only source of a nutrient). Pick a different pair.`;
          const bind = NUT.filter((nu, i) => Math.abs(FOODS[ia].a[i] * res.x[0] + FOODS[ib].a[i] * res.x[1] - nu.r) < 1e-6 * nu.r).map((nu) => nu.n);
          return `Cheapest diet: **${f3(v, res.x[0] * 100, 0)} g** ${FOODS[ia].n} and **${f3(v, res.x[1] * 100, 0)} g** ${FOODS[ib].n}, cost **\\$${f3(v, res.f, 2)}** per day. Binding: ${bind.join(', ') || 'none (a food is at 0)'}. Kinks in the cost curve (vertex changes): ${ks.length}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Model',
      name: 'Chebyshev centre of a polyhedron',
      statement: String.raw`The **Chebyshev centre** of a polyhedron $\mathcal P=\{x:a_i^{\mathsf T}x\le b_i,\ i=1,\dots,m\}$ is the centre $x_c$ of the largest Euclidean ball $\{x_c+u:\norm{u}_2\le r\}$ contained in $\mathcal P$. Because the ball lies in the half-space $a_i^{\mathsf T}x\le b_i$ exactly when $a_i^{\mathsf T}x_c+r\norm{a_i}_2\le b_i$, it is the solution of the linear program
$$\max_{x_c,r}\ r\quad\text{s.t.}\quad a_i^{\mathsf T}x_c+r\norm{a_i}_2\le b_i\ (i=1,\dots,m).$$
The function $r(x)=\min_i(b_i-a_i^{\mathsf T}x)/\norm{a_i}_2$, the distance to the nearest facet, is concave; the centre need not be unique, and the optimal ball touches at least $n+1$ facets in generic position ($n=2$: three).`,
      idea: String.raw`A ball with centre $x_c$ and radius $r$ fits in the half-space $\{a^{\mathsf T}x\le b\}$ iff $\sup_{\norm u\le r}a^{\mathsf T}(x_c+u)=a^{\mathsf T}x_c+r\norm a\le b$ (Cauchy–Schwarz), which is linear in $(x_c,r)$. So the problem is an LP in $n+1$ variables, solved at a vertex (opt-4.4) where $n+1$ constraints are active — the facets the optimal ball touches. Equivalently one maximizes the concave function $r(x)$ over $\mathcal P$.`,
      caption: String.raw`Drag the six corners of the polygon (the polygon is the convex hull of the handles). The largest inscribed disc is found by solving the three-variable LP over all triples of constraints; the facets it touches are highlighted. **Right:** the concave function $r(x)$ as a heat map (distance to the nearest facet) with the centre at its peak, compared with the centroid of the polygon (white) and a brute-force search of $r(x)$ on a fine grid.`,
      deps: ['opt-4.4'],
      refs: ['Boyd–Vandenberghe §4.3'],
      tags: ['Chebyshev centre', 'inscribed ball', 'linear program'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chebyshev_center' },
      viz(v) {
        const S = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 400, title: 'largest inscribed disc' });
        const T = v.stage({ x: [-4, 4], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 400, title: 'distance to the nearest facet $r(x)$' });
        const V0 = [[-3.0, -1.3], [-0.8, -2.5], [2.6, -2.0], [3.3, 0.6], [1.0, 2.5], [-2.2, 1.8]];
        const H = V0.map((p, i) => S.handle(p[0], p[1], { color: 'blue', r: 6, label: String(i + 1), labelPos: 'ne', constrain: { x: [-3.9, 3.9], y: [-2.9, 2.9] } }));
        let info = {};
        v.render(() => {
          const P = hull(H.map((h) => [h.x, h.y])); // CCW
          const hs = P.map((p, i) => { const q = P[(i + 1) % P.length], e = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(e[0], e[1]) || 1; const nx = e[1] / L, ny = -e[0] / L; return { nx, ny, c: nx * p[0] + ny * p[1] }; }); // unit outward normals
          const A = hs.map((h) => [h.nx, h.ny, 1]).concat([[0, 0, -1], [0, 0, 1]]), b = hs.map((h) => h.c).concat([0, 20]);
          const sol = lpVertex([0, 0, -1], A, b);
          const rOf = (x, y) => Math.min(...hs.map((h) => h.c - h.nx * x - h.ny * y));
          // centroid
          let cx = 0, cy = 0, ar = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], w = p[0] * q[1] - q[0] * p[1]; ar += w; cx += (p[0] + q[0]) * w; cy += (p[1] + q[1]) * w; }
          ar /= 2; cx /= 6 * ar; cy /= 6 * ar;
          T.raster((x, y) => { const r = rOf(x, y); return r < 0 ? null : [...v.ramp(clamp(r / 1.6, 0, 1), 'green').map(Math.round), 220]; }, { res: 3, key: P.map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join('|') });
          S.poly(P, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2.4 });
          T.poly(P, { fill: false, color: 'ink', width: 1.6 });
          let bf = -1, bx = 0, by = 0;
          for (let i = 0; i <= 120; i++) for (let j = 0; j <= 90; j++) { const x = -4 + i / 15, y = -3 + j / 15, r = rOf(x, y); if (r > bf) { bf = r; bx = x; by = y; } }
          if (sol) {
            const [x, y, r] = sol.z;
            S.circle(x, y, r, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2.4 });
            S.dot(x, y, { r: 5, color: 'green' });
            const touch = sol.rows.filter((k) => k < hs.length);
            touch.forEach((k) => { const h = hs[k]; S.dot(x + r * h.nx, y + r * h.ny, { r: 5, color: 'red' }); S.segment([P[k][0], P[k][1]], [P[(k + 1) % P.length][0], P[(k + 1) % P.length][1]], { color: 'red', width: 3.5 }); });
            T.dot(x, y, { r: 7, color: 'gold' });
            info = { sol, bf, bx, by, rc: rOf(cx, cy), touch: touch.length };
          }
          T.dot(cx, cy, { r: 5, color: 'ink', hollow: true, width: 2 });
          T.dot(bx, by, { r: 3, color: 'red' });
        });
        v.legend([['green', 'largest inscribed disc / peak of $r$'], ['red', 'touched facets', {}], ['ink', 'centroid', { dot: true }]]);
        v.readout(() => {
          const { sol, bf, rc, touch } = info; if (!sol) return 'degenerate polygon';
          return `LP solution: radius $r^\\star=${f3(v, sol.z[2])}$, centre $(${f3(v, sol.z[0], 2)},${f3(v, sol.z[1], 2)})$, touching **${touch}** facets. Brute-force grid maximum of $r(x)$: $${f3(v, bf)}$ (agrees to the grid step). The centroid only gives $r=${f3(v, rc)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Definition',
      name: 'Quadratic programs',
      statement: String.raw`A **quadratic program** (QP) minimizes a convex quadratic function over a polyhedron:
$$\min_x\ \tfrac12x^{\mathsf T}Px+q^{\mathsf T}x+r\quad\text{s.t.}\quad Gx\preceq h,\ Ax=b,\qquad P\succeq0 .$$
With $P\succeq0$ the objective is convex (opt-3.3), so a QP is a convex problem and every local minimizer is global; it is strictly convex, with a unique solution, when $P\succ0$. LP is the case $P=0$. For $P\succ0$ the problem is the Euclidean (more precisely $P$-norm) **projection** of the unconstrained minimizer $m=-P^{-1}q$ onto the polyhedron, and the solution lies in the interior, on a face or at a vertex of the feasible set depending on where $m$ is.`,
      idea: String.raw`For $P\succ0$ complete the square: $\tfrac12x^{\mathsf T}Px+q^{\mathsf T}x=\tfrac12(x-m)^{\mathsf T}P(x-m)+\text{const}$, so the level sets are concentric ellipsoids around $m$. The minimizer over the feasible set is the first point at which the growing ellipsoid touches it (opt-4.2: the gradient is a normal of a supporting hyperplane there). A convex quadratic has the first-order underestimator of opt-3.2 and positive semidefinite Hessian $P$ (opt-3.3), which makes the problem convex; solutions are interior when $m$ is feasible, otherwise on the boundary.`,
      caption: String.raw`The ellipses are level sets of $\tfrac12(x-m)^{\mathsf T}Q(x-m)$ with $Q=P$; drag the unconstrained minimizer $m$ (grey) and choose the polygon. The computed optimum $x^\star$ (green) moves from the interior (when $m$ is inside) to an edge to a vertex. The highlighted ellipse is the sublevel set through $x^\star$: it touches the feasible set from outside with a common tangent, and $-\nabla f_0(x^\star)$ (green arrow) lies in the normal cone of the active constraints. Sliders change the shape (conditioning and tilt) of $P$; with ratio 1 the level sets are circles and $x^\star$ is the ordinary nearest point.`,
      deps: ['opt-4.1', 'opt-3.3'],
      refs: ['Boyd–Vandenberghe §4.4'],
      tags: ['quadratic program', 'projection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quadratic_programming' },
      viz(v) {
        const SETS = {
          quad: { label: 'quadrilateral', P: [[-2.4, -1.5], [2.0, -2.2], [3.0, 0.8], [-1.2, 2.2]] },
          tri: { label: 'triangle', P: [[-2.6, -1.8], [2.8, -1.2], [0.2, 2.6]] },
          hex: { label: 'hexagon', P: [[-1.0, -2.2], [1.4, -2.0], [2.7, 0.0], [1.5, 2.1], [-1.2, 2.2], [-2.6, 0.2]] },
        };
        const sel = v.select('polyhedron', Object.entries(SETS).map(([k, o]) => ({ value: k, label: o.label })), 'quad');
        const kap = v.slider('ratio of eigenvalues of $P$', 1, 10, 4, { step: 0.1 });
        const th = v.slider('tilt of the axes (degrees)', 0, 90, 30, { step: 1, int: true });
        const S = v.stage({ x: [-5.5, 5.5], y: [-3.8, 3.8], equal: true, axes: 'box', gutter: true, height: 440, title: 'QP: ellipses $\\tfrac12(x-m)^{\\mathsf T}P(x-m)$ and the polyhedron' });
        const M = S.handle(3.8, 2.6, { color: 'muted', label: 'm', labelPos: 'ne', constrain: { x: [-5.3, 5.3], y: [-3.6, 3.6] } });
        let info = {};
        v.render(() => {
          const P = SETS[sel.value].P, t = (th.value * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), k = kap.value;
          const Q = [[c * c + k * s * s, (1 - k) * c * s], [(1 - k) * c * s, s * s + k * c * c]];
          const m = [M.x, M.y], f = (x, y) => 0.5 * ((x - m[0]) * (Q[0][0] * (x - m[0]) + Q[0][1] * (y - m[1])) + (y - m[1]) * (Q[0][1] * (x - m[0]) + Q[1][1] * (y - m[1])));
          const o = qp2(Q, m, P);
          S.poly(P, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 2.4 });
          S.clip(() => {
            S.contour(f, [0.3, 0.9, 2, 3.6, 6, 9, 14, 20, 28], { color: 'ink', alpha: 0.28, width: 1, res: 110 });
            S.contour(f, [o.f], { color: 'gold', width: 2.6, res: 140 });
          });
          S.dot(m[0], m[1], { r: 4, color: 'muted' });
          S.dot(o.x[0], o.x[1], { r: 7, color: 'green' });
          const g = [Q[0][0] * (o.x[0] - m[0]) + Q[0][1] * (o.x[1] - m[1]), Q[0][1] * (o.x[0] - m[0]) + Q[1][1] * (o.x[1] - m[1])], gn = Math.hypot(g[0], g[1]);
          if (gn > 1e-9) S.arrow(o.x[0], o.x[1], o.x[0] - 1.3 * g[0] / gn, o.x[1] - 1.3 * g[1] / gn, { color: 'green', width: 2.6 });
          // brute-force check on a fine boundary + interior grid
          let best = Infinity; for (let i = 0; i <= 160; i++) for (let j = 0; j <= 120; j++) { const x = -5.5 + i / 14.5, y = -3.8 + j / 15.8; if (inPoly(x, y, P)) best = Math.min(best, f(x, y)); }
          info = { o, best };
        });
        v.legend([['gold', 'level set through $x^\\star$'], ['green', '$x^\\star$ and $-\\nabla f_0(x^\\star)$']]);
        v.readout(() => {
          const { o, best } = info;
          const kind = o.kind === 'interior' ? 'in the **interior** ($x^\\star=m$)' : o.kind === 'edge' ? 'on an **edge**' : 'at a **vertex**';
          return `Optimum ${kind}: $x^\\star=(${f3(v, o.x[0], 3)},${f3(v, o.x[1], 3)})$, $f_0(x^\\star)=${f3(v, o.f)}$. Fine-grid minimum over the polygon: $${f3(v, best)}$ (never below the computed value: ${best >= o.f - 1e-6 ? '✓' : '✗'}).`;
        });
      },
    },
  ],
};
