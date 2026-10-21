// Algorithms — Chapter 11: Network flow, matching and linear programming (items 11.21–11.25; 11.1–11.6 in ch11.js, 11.7–11.13 in ch11-b.js, 11.14–11.19 in ch11-c.js)
import { K, ids, plural, clamp, rngOf, sumOf, NETS, num, flowValue, cutCap, minCutBrute, resArcs, reachSet, findPath, pushPath, fordFulkerson, arcsOf, zeros, netStage, mkNet, loadNet, netIds, drawFlow, simplex, vertices, detOf, combos, clipHalf, R, TX } from './ch11.shared.js';
import {kmLP, POLY_CONS, polygon, ellipsoidRun, barrierPath, barrierPoint, matchingPolytope, PLANAR_NET, planarChainRun, undirectedCuts} from './lp-source-audit.shared.js';

const NET_SELECT = [{ value: 'A', label: 'network A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }];
const EDITW = { editWeight: true, minWeight: 1, maxWeight: 20, addNode: false, addEdge: false, deleteNode: false, deleteEdge: false, moveNode: true };

/** The max-flow LP and its dual (potentials d, edge variables y) solved by the simplex method. */
function flowLPs(ids, arcs, s, t) {
  const m = arcs.length, mid = ids.filter((x) => x !== s && x !== t), n = mid.length;
  const obj = arcs.map(([u, v]) => (u === s ? 1 : 0) - (v === s ? 1 : 0));
  const rows = arcs.map((_, i) => ({ a: arcs.map((__, j) => (i === j ? 1 : 0)), op: '<=', b: arcs[i][2] }));
  for (const x of mid) rows.push({ a: arcs.map(([u, v]) => (v === x ? 1 : 0) - (u === x ? 1 : 0)), op: '=', b: 0 });
  const P = simplex(obj, rows);
  // dual: min sum c_e y_e, y_e + d_u - d_v >= 0 with d_s = 0, d_t = 1, 0 <= d <= 1
  const idx = (x) => m + mid.indexOf(x), drows = [];
  arcs.forEach(([u, v], e) => {
    const a = Array(m + n).fill(0); a[e] = 1; let rhs = 0;
    if (u === t) rhs -= 1; else if (u !== s) a[idx(u)] += 1;
    if (v === t) rhs += 1; else if (v !== s) a[idx(v)] -= 1;
    drows.push({ a, op: '>=', b: rhs });
  });
  mid.forEach((x, k) => { const a = Array(m + n).fill(0); a[m + k] = 1; drows.push({ a, op: '<=', b: 1 }); });
  const D = simplex([...arcs.map(([, , c]) => -c), ...Array(n).fill(0)], drows);
  return { P, D, mid, m, f: P.status === 'optimal' ? P.x : null, y: D.status === 'optimal' ? D.x.slice(0,m) : null, d: D.status === 'optimal' ? Object.fromEntries([[s, 0], [t, 1], ...mid.map((x, k) => [x, D.x[m + k]])]) : null, pv: P.status === 'optimal' ? P.value : null, dv: D.status === 'optimal' ? -D.value : null };
}

// ---------------------------------------------------------------- Klee–Minty data
const kmRun = (n, rule) => { const { c, rows } = kmLP(n); return simplex(c, rows, { rule }); };
const KM_RULES = [{ value: 'dantzig', label: 'largest coefficient', col: 'red' }, { value: 'bland', label: 'smallest index (Bland)', col: 'orange' }, { value: 'greatest', label: 'greatest increase', col: 'green' }];

export default {
  collection: 'algo',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ 11.21
    {
      num: '11.21',
      kind: 'Theorem',
      name: 'Max-flow min-cut as LP duality',
      statement: String.raw`The maximum-flow problem is the linear program
$$\max\ \sum_{(s,v)}f_{sv}-\sum_{(u,s)}f_{us}\quad\text{s.t.}\quad f_e\le c_e\ (e\in E),\qquad \sum_{(u,v)}f_{uv}-\sum_{(v,w)}f_{vw}=0\ (v\ne s,t),\qquad f\ge0.$$
Its dual is
$$\min\ \sum_{e}c_e\,y_e\quad\text{s.t.}\quad y_{uv}\ge d_v-d_u\ \ (uv\in E),\qquad d_s=0,\ d_t=1,\qquad y\ge0,$$
with one variable $y_e$ per capacity constraint and one potential $d_v$ per conservation constraint. The constraint matrix is totally unimodular, so the dual has an optimal solution with $d\in\{0,1\}^V$; it is the cut $S=\{v:d_v=0\}$ with $y_e=1$ exactly on the edges leaving $S$. Hence LP duality gives max-flow $=$ min-cut, and **complementary slackness** says that at optimal flows and cuts every edge leaving $S$ is saturated and every edge entering $S$ is empty.`,
      idea: String.raw`Dualising the flow LP produces the potential form of the dual directly; any feasible $(y,d)$ is a "fractional cut": the potentials say how far along the way from $s$ ($d=0$) to $t$ ($d=1$) each vertex sits, and an edge pays $y_e$ for the climb it makes. Rounding the potentials at a random threshold $\theta\in(0,1)$ gives a genuine cut whose expected capacity is at most the dual objective, so some cut is at most as expensive as the fractional one (this also shows that an optimal dual vertex can be taken integral). Weak duality is 11.3; strong duality (11.19) then reproves 11.6 without augmenting paths.`,
      caption: String.raw`The flow LP and the cut LP are both solved here with a simplex method on the network you see. Left: the LP's optimal flow (labels flow/capacity), each vertex tagged with the potential $d_v$ the dual LP found, and the edges with $y_e=1$ in red: they form a cut. Right: the four numbers that must agree. Edit capacities by clicking them; the table recomputes.`,
      deps: ['algo-11.19', 'algo-11.6'],
      refs: ['Erickson notes: Linear Programming', 'CLRS 4e §29.3'],
      tags: ['linear programming', 'flow'],
      viz(v) {
        const s1 = netStage(v, { x: [-0.7, 10.2], weight: 1.5, height: 330 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, title: 'Four ways to the same number' });
        const G = mkNet(v, s1, 'A', { editable: EDITW });
        v.select('network', NET_SELECT, 'A', { onChange: (k) => loadNet(G, k) });
        const T = v.table(s2, { rows: 4, cols: 1, square: false, cellAspect: 1.6, maxCell: 50, size: 14, colLabels: ['value'], rowLabels: ['flow LP (simplex)', 'Ford–Fulkerson', 'cut LP (simplex)', 'all cuts, exhaustive'], labelWidth: 1.8 });
        const cache = new Map();
        const solve = () => {
          const arcs = arcsOf(G), I = netIds(G), key = arcs.map((a) => a.join('/')).join(';');
          if (!cache.has(key)) { if (cache.size > 40) cache.clear(); const L = flowLPs(I, arcs, 's', 't'), ff = fordFulkerson(I, arcs, 's', 't', 'bfs'), mc = minCutBrute(I, arcs, 's', 't'); cache.set(key, { L, ff, mc, arcs }); }
          return cache.get(key);
        };
        v.render(() => {
          const { L, ff, mc, arcs } = solve(), f = L.f || zeros(arcs.length), y = L.y || zeros(arcs.length);
          drawFlow(G, f.map((x) => Math.round(x * 1e6) / 1e6), (fl, idx) => ({
            edgeColor: (e) => (y[idx.get(e)] > 0.5 ? 'red' : fl(e) > 1e-9 ? 'accent' : 'faint'), edgeWidth: (e) => (y[idx.get(e)] > 0.5 ? 4.4 : 1.5 + 0.45 * Math.min(fl(e), 14)),
            nodeNote: (id) => (L.d ? `d=${num(L.d[String(id)], 2)}` : null), noteColor: 'muted',
            nodeColor: (id) => (L.d && L.d[String(id)] < 0.5 ? 'blue' : L.d ? 'orange' : null),
          }));
          const vals = [L.pv, ff.value, L.dv, mc.cap], ok = L.P.status === 'optimal' && L.D.status === 'optimal' && vals.every((x) => Math.abs(x - vals[0]) < 1e-6);
          T.draw({ value: (i) => vals[i] === null ? 'unverified' : num(vals[i], 3), fill: () => (ok ? ['green', 0.3] : ['red', 0.3]), rows: 4, cols: 1 });
        });
        v.legend([['red', 'edges with $y_e=1$: the cut'], ['blue', 'potential $d_v=0$ (source side)', { dot: true }], ['orange', '$d_v=1$ (sink side)', { dot: true }]]);
        v.readout(() => {
          const { L, ff, mc, arcs } = solve(), f = L.f, y = L.y, I = netIds(G), d = L.d;
          if (!f || !y) return `No optimal LP certificate: primal ${L.P.status}; dual ${L.D.status}. A solver limit is not a proof of unboundedness.`;
          const integral = I.every((x) => Math.abs(d[x] - Math.round(d[x])) < 1e-6), S = new Set(I.filter((x) => d[x] < 0.5));
          const sat = arcs.every(([u, w, c], i) => !(S.has(u) && !S.has(w)) || Math.abs(f[i] - c) < 1e-6), emp = arcs.every(([u, w], i) => !(!S.has(u) && S.has(w)) || Math.abs(f[i]) < 1e-6);
          return `Flow LP $=${num(L.pv, 3)}$, cut LP $=${num(L.dv, 3)}$ — equal ✓ · dual optimum is a 0/1 cut: **${integral ? 'yes' : 'no'}**, $S=\\{${[...S].join(',')}\\}$ of capacity $${num(cutCap(arcs, S), 3)}$\ncomplementary slackness: edges leaving $S$ saturated **${sat ? 'yes' : 'no'}**, edges entering $S$ empty **${emp ? 'yes' : 'no'}** · exhaustive min cut $${num(mc.cap, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.22
    {
      num: '11.22',
      kind: 'Proposition',
      name: 'Simplex can take exponentially many pivots (Klee–Minty)',
      statement: String.raw`For every $n$ there is a linear program in $n$ variables and $n$ constraints (plus $x\ge0$), a "squashed $n$-cube", for which the simplex method with the **largest-coefficient** pivot rule, started at the origin, visits all $2^n$ vertices and so makes $2^n-1$ pivots. One such family is
$$\max\ \sum_{j=1}^n10^{\,n-j}x_j\quad\text{s.t.}\quad 2\sum_{j<i}10^{\,i-j}x_j+x_i\le 100^{\,i-1}\ (i=1,\dots,n),\ x\ge0.$$
So no bound polynomial in $n$ holds for this pivot rule. This family is solved in one pivot by the greatest-immediate-objective-increase rule, so the example indicts a *rule*, not the LP.`,
      idea: String.raw`Encode a vertex by bits $b_i$: zero chooses $x_i=0$, one chooses the $i$th upper constraint tight. Every such choice is feasible: recursively the upper bound for $x_i$ is positive (at least $0.8\cdot100^{i-1}$ for $i\ge2$). Eliminating basic variables gives reduced cost $(-1)^{b_j+\cdots+b_n}10^{n-j}$ for the nonbasic variable $x_j$ or its slack. Thus Dantzig chooses the smallest $j$ whose suffix sum is even and flips $b_j$. These flips form the reflected Gray-code order on all $2^n$ bit vectors. Its recurrence is $T(n)=2T(n-1)+1$, $T(1)=1$, hence $T(n)=2^n-1$. At the origin the greatest-increase rule instead chooses $x_n$, immediately reaching the optimum $100^{n-1}$.`,
      caption: String.raw`Left: the Klee–Minty polytope for $n=3$ (each axis rescaled to $[0,1]$ so the squashed cube is visible), with the simplex path in the order of the pivots; step through it and drag to rotate. Right: pivot counts for $n=1,\dots,7$ under three rules, computed by actually running the simplex method; the dashed line is $2^n-1$. Largest-coefficient hits it on the nose; greatest-increase finishes in one pivot. Choose the rule for the path on the left.`,
      deps: ['opt-6.3'],
      refs: ['Klee–Minty (1972), §7 pp.170–174, especially recurrence (29)', 'Stacho, IEOR4004 notes, printed p.114 / PDF p.118 (displayed numeric family)'],
      tags: ['linear programming', 'counterexample'],
      scope: String.raw`Dantzig selects the largest positive reduced objective coefficient in the stated original variable/slack units. Axis rescaling is for drawing only; changing variable units can change this rule. The other rules' counts concern this particular family, not their general complexity. No cycling occurs in these strictly improving, nondegenerate examples.`,
      credit: 'V. Klee & G. J. Minty, 1972 (“How good is the simplex algorithm?”)',
      viz(v) {
        const s = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 380, weight: 1.1 });
        const bars = v.stage({ x: [0.3, 7.7], y: [0.7, 400], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'dimension $n$', ylabel: 'pivots', xticks: [1, 2, 3, 4, 5, 6, 7] });
        const sc = v.scene3(s, { yaw: -0.75, pitch: 0.38, axes: false, hint: true });
        const rule = v.select('pivot rule', KM_RULES.map(({ value, label }) => ({ value, label })), 'dantzig', { onChange: () => { frames = mkFrames(); S.reset({ at: 'start' }); } });
        const N = 3, { c, rows } = kmLP(N), G = rows.map((r) => r.a).concat(Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? -1 : 0)))), h = rows.map((r) => r.b).concat(Array(N).fill(0));
        const verts = vertices(G, h, N), mx = Array.from({ length: N }, (_, j) => Math.max(...verts.map((q) => q.x[j])));
        const pos = (x) => x.map((xj, j) => (xj / mx[j] - 0.5) * 1.6), edges = [];
        verts.forEach((a, i) => verts.forEach((b, j) => { if (j > i && a.tight.filter((t) => b.tight.includes(t)).length >= N - 1) edges.push([i, j]); }));
        const names = (k) => (k < N ? `x${k + 1}` : `s${k - N + 1}`);
        const mkFrames = () => {
          const r = simplex(c, rows, { rule: rule.value }), path = [[0, 0, 0], ...r.pivots.map((p) => p.x)];
          const F = [{ k: 0, at: path[0], value: 0, note: 'Start at the origin, a feasible vertex: all slack variables are basic.' }];
          r.pivots.forEach((p, k) => F.push({ k: k + 1, at: p.x, value: p.value, note: `Pivot ${k + 1}: ${names(p.enter)} enters the basis, ${names(p.leave)} leaves. Objective ${num(p.value, 0)}.` }));
          if(r.status !== 'optimal') F[F.length-1].note += ` Solver status: ${r.status}; this trace is incomplete.`;
          F.forEach((q) => { q.path = path.slice(0, q.k + 1); }); return F;
        };
        let frames = mkFrames();
        const S = v.steps({ frames: () => frames, speed: 1.2, still: 4 });
        const cnt = (n, rl) => { const r=kmRun(n,rl); return r.status==='optimal'?r.pivots.length:null; }, table = [1, 2, 3, 4, 5, 6, 7].map((n) => KM_RULES.map((r) => cnt(n, r.value)));
        v.render(() => {
          sc.begin();
          const P0 = pos([0, 0, 0]);
          [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((e, i) => { sc.arrow(P0, P0.map((c0, j) => c0 + e[j] * 2.0), { color: 'faint', width: 1.2, head: 7 }); sc.tex(`x_${i + 1}`, P0.map((c0, j) => c0 + e[j] * 2.12), { color: 'muted', size: 15 }); });
          edges.forEach(([i, j]) => sc.line(pos(verts[i].x), pos(verts[j].x), { color: 'muted', width: 1.2, alpha: 0.55 }, 1));
          const fr = S.frame, pts = fr.path.map(pos);
          for (let k = 0; k + 1 < pts.length; k++) sc.line(pts[k], pts[k + 1], { color: 'orange', width: 3.4, top: true }, 1);
          fr.path.forEach((p, k) => sc.dot(pos(p), { r: k === fr.path.length - 1 ? 7 : 4.5, color: k === fr.path.length - 1 ? 'gold' : 'orange' }));
          sc.flush();
          for (let n = 1; n <= 7; n++) KM_RULES.forEach((r, k) => { const x0 = n - 0.36 + k * 0.24, hgt = Math.max(table[n - 1][k] ?? 1, 1); if(table[n - 1][k] !== null) bars.rect(x0, 0.7, x0 + 0.21, hgt, { fill: r.col, fillAlpha: 0.7, color: r.col, width: 1 }); });
          bars.path(Array.from({ length: 7 }, (_, i) => [i + 1, 2 ** (i + 1) - 1]), { color: 'ink', dash: true, width: 1.4 });
        });
        v.legend([['red', 'largest coefficient', { area: true }], ['orange', 'smallest index (Bland)', { area: true }], ['green', 'greatest increase', { area: true }], ['ink', '$2^n-1$', { dash: true }]]);
        v.readout(() => {
          const rl = KM_RULES.findIndex((r) => r.value === rule.value), fr = S.frame;
          return `$n=3$, ${KM_RULES[rl].label}: pivot ${fr.k} of ${S.n - 1} (vertices visited: ${fr.k + 1} of ${verts.length}) · objective $${num(fr.value, 0)}$\npivots for $n=1..7$ with largest coefficient: ${table.map((r) => r[0]).join(', ')} = $2^n-1$: **${table.every((r, i) => r[0] === 2 ** (i + 1) - 1) ? 'yes' : 'no'}** · greatest increase: ${table.map((r) => r[2]).join(', ')} · Bland: ${table.map((r) => r[1]).join(', ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.23
    {
      num: '11.23',
      kind: 'Theorem',
      name: 'Linear programs are solvable in polynomial time (statement)',
      statement: String.raw`For a finite LP with rational input encoded in binary, algorithms can distinguish infeasibility, unbounded objective and a finite attained optimum, and return an optimal rational solution in polynomial **bit complexity**. The ellipsoid method gives such algorithms; polynomial interior-point variants also exist. A central cut in dimension $n\ge2$ has a minimum-volume enclosing ellipsoid with volume ratio
$$\left(\frac{n^2}{n^2-1}\right)^{n/2}\sqrt{\frac{n-1}{n+1}}\ \le\ e^{-1/(2(n+1))}.$$
For a bounded full-dimensional polytope with interior, the log-barrier central point maximizes $\mu c^\top x+\sum_{i=1}^m\log(b_i-a_i^\top x)$. At an **exact** central point its duality gap is $m/\mu$, so its objective error is at most $m/\mu$. As $\mu\to\infty$ it approaches the optimal face, which need not be a single vertex.`,
      idea: String.raw`A violated constraint gives a center cut preserving every feasible optimum; a feasible center gives an objective cut preserving an optimal point. The volume decrease alone is insufficient for arbitrary LPs: rational bit-length bounds, bounded reformulation, separation between zero and positive infeasibility, and controlled arithmetic handle unbounded and lower-dimensional regions. Nemirovski's proof makes these reductions explicit. For the barrier, stationarity gives $\sum_i a_i/(\mu(b_i-a_i^\top x))=c$; the nonnegative dual weights $y_i=1/(\mu(b_i-a_i^\top x))$ then satisfy $b^\top y-c^\top x=m/\mu$. Polynomial path-following algorithms also control centering and bit precision. This floating-point picture demonstrates neither polynomial runtime nor an exact rational solver.`,
      caption: String.raw`A fixed polygon and adjustable objective. Left: central-cut ellipsoids and feasible incumbent values; the view fits the current ellipse and polygon (optionally all previous ellipses). Their planar area ratio is $4/(3\sqrt3)\approx0.7698$. Right: numerically centered log-barrier points; the gold point is solved at the actual displayed $\mu$. The readout separates actual objective error, the exact-central-point benchmark $m/\mu$, and numerical stationarity residual/status. At horizontal or vertical objective directions the optimum is an edge, so one selected optimal vertex is only a reference marker. Such directions can produce very long, flat ellipses; fitting them compresses the polygon in the full view.`,
      deps: ['algo-11.15', 'algo-11.22'],
      refs: ['Nemirovski, Optimization I (2024), slides 6.39–6.43 and 6.51–6.59', 'Boyd–Vandenberghe §11.2, Eqs.11.7–11.10', 'Karmarkar (1984), §§2–5'],
      tags: ['linear programming'],
      credit: 'Khachiyan, 1979 publication (ellipsoid); Karmarkar, 1984 (polynomial interior-point algorithm)',
      scope: String.raw`Bit-polynomial solvability is distinct from a strongly polynomial bound in dimensions alone; general strongly polynomial LP remains an open question in Végh's current ScaleOpt project description. The toy is bounded, full-dimensional and strictly feasible. Its capped Newton and ellipsoid calculations use ordinary floating point, not the precision/rounding machinery of those complexity proofs.`,
      links: { doi: 'https://doi.org/10.1007/BF02579150' },
      viz(v) {
        const sE=v.stage({x:[0,8],y:[0,6.5],equal:true,axes:'box',gutter:true,height:340,weight:1,title:'central-cut ellipsoid',xlabel:'$x$',ylabel:'$y$'}),sB=v.stage({x:[0,8],y:[0,6.5],equal:true,axes:'box',gutter:true,height:340,weight:1,title:'numerical central path',xlabel:'$x$',ylabel:'$y$'});
        const th=v.slider('objective direction (degrees)',0,90,40,{step:1,onChange:()=>{E=null;B=null;}}),k=v.slider('ellipsoid step $k$',0,40,6,{int:true}),lm=v.slider('barrier weight $\\log_{10}\\mu$',-1.5,3.5,0,{step:.05}),history=v.toggle('show previous ellipsoids',false);let E=null,B=null,info=null;
        const poly=polygon(),cobj=()=>[Math.cos(th.value*Math.PI/180),Math.sin(th.value*Math.PI/180)],ensure=()=>{if(!E){E=ellipsoidRun(POLY_CONS,cobj(),60);B=barrierPath(POLY_CONS,cobj());}},ellipse=e=>{const [[l11],[l21,l22]]=e.B;return q=>[e.c[0]+l11*Math.cos(q),e.c[1]+l21*Math.cos(q)+l22*Math.sin(q)];};
        v.render(()=>{
          ensure();const kk=Math.min(k.value,E.length-1),e=E[kk],c=cobj(),es=history.value?E.slice(0,kk+1):[e],xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);for(const q of es){xs.push(q.c[0]-Math.sqrt(q.Q[0][0]),q.c[0]+Math.sqrt(q.Q[0][0]));ys.push(q.c[1]-Math.sqrt(q.Q[1][1]),q.c[1]+Math.sqrt(q.Q[1][1]));}const lo=[Math.min(...xs),Math.min(...ys)],hi=[Math.max(...xs),Math.max(...ys)];sE.setView(...lo.map((x,j)=>[x-.08*(hi[j]-x),hi[j]+.08*(hi[j]-x)]));
          for(const stage of[sE,sB])stage.poly(poly,{fill:'accent',fillAlpha:.12,color:'accent',width:2});if(history.value)for(let i=0;i<kk;i++)sE.curve(ellipse(E[i]),0,2*Math.PI,{color:'muted',width:1,alpha:.35});sE.curve(ellipse(e),0,2*Math.PI,{color:'blue',width:2.6});
          const a=e.cut,nrm=Math.hypot(...a);sE.clip(()=>sE.line(e.c[0]-30*-a[1]/nrm,e.c[1]-30*a[0]/nrm,e.c[0]+30*-a[1]/nrm,e.c[1]+30*a[0]/nrm,{color:e.feas?'green':'red',width:2.2,dash:true}));sE.arrow(...e.c,e.c[0]-.8*a[0]/nrm,e.c[1]-.8*a[1]/nrm,{color:e.feas?'green':'red',width:2});sE.dot(...e.c,{r:5,color:e.feas?'green':'red'});
          const opt=poly.reduce((b,p)=>c[0]*p[0]+c[1]*p[1]>c[0]*b[0]+c[1]*b[1]?p:b,poly[0]);for(const stage of[sE,sB])stage.dot(...opt,{r:8,hollow:true,color:'green'});
          const t=10**lm.value,start=B.reduce((b,q)=>Math.abs(Math.log10(q.t)-lm.value)<Math.abs(Math.log10(b.t)-lm.value)?q:b,B[0]),cur=barrierPoint(POLY_CONS,c,t,start.x);sB.path(B.map(q=>q.x),{color:'purple',width:2.4});sB.dot(...cur.x,{r:7,color:'gold'});sB.arrow(...cur.x,cur.x[0]+c[0]*.6,cur.x[1]+c[1]*.6,{color:'orange',width:1.8});info={kk,e,p:kk?E[kk-1]:null,c,cur,opt:e.opt};
        });
        v.legend([['blue','current ellipse'],['muted','optional earlier ellipses'],['purple','numerically centered path'],['gold','current numerical point',{dot:true}],['green','one selected optimal vertex',{dot:true}]]);
        v.readout(()=>info&&`Ellipsoid ${info.kk}: area $${num(info.e.area,4)}$${info.p?`, ratio $${num(info.e.area/info.p.area,5)}$ (theoretical $4/(3\\sqrt3)$)`:''}; best feasible objective ${info.e.best===null?'none yet':num(info.e.best,5)}.`+`\n`+`Barrier $\\mu=${num(info.cur.t,4)}$, $x=(${num(info.cur.x[0],5)},${num(info.cur.x[1],5)})$; actual objective error $${num(info.opt-info.c[0]*info.cur.x[0]-info.c[1]*info.cur.x[1],6)}$; exact-center benchmark $m/\\mu=${num(6/info.cur.t,6)}$. Newton: ${info.cur.status}; stationarity residual $${v.sci(info.cur.residual,2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 11.24
    {
      num: '11.24',
      kind: 'Theorem',
      name: 'Totally unimodular LPs have integral vertices',
      statement: String.raw`A matrix is **totally unimodular** (TU) if every square submatrix has determinant $0$, $1$ or $-1$. If $A$ is TU and $b$ is an integer vector, every vertex of $\{x:Ax\le b,\ x\ge0\}$ is an integer vector. The **unsigned** vertex-edge incidence matrix of a finite simple undirected graph is TU **if and only if the graph is bipartite**; therefore for a bipartite graph every vertex of the polytope $\{x\ge0:\ \sum_{e\ni v}x_e\le1\ \forall v\}$ is a $0/1$ vector, that is, a matching, and so linear programming finds maximum matchings (and, by duality, minimum vertex covers: König's theorem). For a graph with an odd cycle the polytope has fractional vertices: on a triangle, $x=(\tfrac12,\tfrac12,\tfrac12)$.`,
      idea: String.raw`Append the nonnegativity rows $-I$ to $A$, preserving TU by determinant expansion. At a vertex, choose $n$ linearly independent tight rows of this augmented matrix: $Bx=d$. Cramer's rule has integer numerator and $\det B=\pm1$, so every coordinate is integral. For a bipartite incidence matrix, expand a square submatrix along a column with at most one $1$ (a zero column gives determinant zero; one entry reduces to a smaller minor). If every column has two $1$s, the signed sum of left rows minus right rows is zero, so that minor is singular. An odd cycle contributes a $k\times k$ submatrix with determinant $\pm2$ (the cycle's rows and edges), which breaks TU and creates the half-integral vertex.

The Cramer step uses two determinant facts. Alternating multilinearity in columns (ladr-9.45) gives $\det B_j(d)=x_j\det B$ when $d=Bx$: expanding the replaced column cancels every term with a repeated column except the $j$th. The permutation formula (ladr-9.46) makes $\det B_j(d)$ an integer when $B,d$ have integer entries. Since the chosen tight-row matrix is nonsingular and TU, its determinant is $1$ or $-1$, and division leaves each coordinate integral.`,
      caption: String.raw`Click a vertex and then another to add or remove an edge (up to 9 edges). The matrix is the incidence matrix; the first square submatrix with determinant of absolute value $\ge2$, if any, is shaded red. Every vertex of the matching polytope is found exhaustively; fractional ones are shown on the graph with half-weight edges. Bipartite: all vertices are 0/1. Press **Add an odd cycle** to ensure the triangle L1–L2–R1, including after Clear; other edges are retained up to the nine-edge cap.`,
      deps: ['algo-11.16', 'algo-11.10', 'ladr-9.45', 'ladr-9.46'],
      refs: ['Hoffman–Kruskal (1956), Theorem 2 and §3 proof; 2010 reprint PDF pp.7,12–13', 'Erickson, Linear Programming Algorithms, Exercise 9(a)–(d), PDF p.15'],
      credit: 'A. J. Hoffman & J. B. Kruskal, 1956; checked against the original paper reprinted with author commentary in 2010',
      tags: ['linear programming', 'matching'],
      scope: String.raw`Unsigned incidence matrices here are for loop-free undirected simple graphs. Determinants of integer minors are computed exactly with BigInt Bareiss elimination; matching-polytope vertices use finite floating-point linear solves. The empty-edge polytope has one vertex, the empty matching.`,
      viz(v) {
        const POS = [['l0', 2.2, 5.0], ['l1', 2.2, 3.0], ['l2', 2.2, 1.0], ['r0', 6.8, 5.0], ['r1', 6.8, 3.0], ['r2', 6.8, 1.0]];
        const s = v.stage({ x: [0, 9], y: [0, 6], axes: false, equal: true, height: 330, weight: 1.2 });
        const sm = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'Incidence matrix' });
        let E = [[0, 3], [0, 4], [1, 3], [1, 5], [2, 4], [2, 5], [1, 4]], pick = null, vsel = 0;
        const nodes = POS.map(([id, x, y], i) => ({ id, x, y, label: i < 3 ? `L${i + 1}` : `R${i - 2}` }));
        const G = v.graph(s, { layout: 'none', nodes, edges: [], draggable: false, onClick: ({ node, id }) => {
          if (!node) return false; const k = String(id), i = POS.findIndex((p) => p[0] === k);
          if (pick == null) { pick = i; return true; }
          if (pick === i) { pick = null; return true; }
          const a = Math.min(pick, i), b = Math.max(pick, i), at = E.findIndex(([p, q]) => p === a && q === b);
          if (at >= 0) E.splice(at, 1); else if (E.length < 9) E.push([a, b]); pick = null; return true;
        } });
        const T = v.table(sm, { square: false, cellAspect: 0.9, maxCell: 40, size: 14 });
        v.button('Bipartite example', () => { E = [[0, 3], [0, 4], [1, 3], [1, 5], [2, 4], [2, 5], [1, 4]]; pick = null; });
        v.button('Add an odd cycle',()=>{const triangle=[[0,1],[0,3],[1,3]];E=[...triangle,...E.filter(([a,b])=>!triangle.some(([u,w])=>a===u&&b===w))].slice(0,9);pick=null;});
        v.button('Clear', () => { E = []; pick = null; });
        const cache = new Map();
        const analyse = () => {
          const key = JSON.stringify(E); if (cache.has(key)) return cache.get(key);
          const out=matchingPolytope(E);if(cache.size>64)cache.clear();cache.set(key,out);return out;
        };
        const nxt = v.button('Next fractional vertex', () => { vsel++; });
        v.render(() => {
          const A = analyse(), fv = A.frac.length ? A.frac[vsel % A.frac.length] : null;
          G.edges = E.map(([a, b], i) => ({ from: POS[a][0], to: POS[b][0], x: fv ? fv.x[i] : 0 }));
          G.draw({ edgeColor: (e) => (fv && e.x > 1e-7 ? 'purple' : 'faint'), edgeWidth: (e) => (fv ? 1.6 + 5 * e.x : 2), edgeLabel: (e) => (fv && e.x > 1e-7 ? num(e.x, 2) : null), nodeColor: (id) => (POS.findIndex((p) => p[0] === String(id)) === pick ? 'gold' : null), nodeRing: (id) => (POS.findIndex((p) => p[0] === String(id)) === pick ? 'gold' : null) });
          T.draw({ rows: 6, cols: Math.max(A.m, 1), value: (i, j) => A.m ? A.M[i]?.[j] ?? 0 : '—', rowLabels: ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'], colLabels: E.length ? E.map(([a, b]) => `${POS[a][0].toUpperCase()}${POS[b][0].toUpperCase()}`.replace(/L(\d)/, (_, d) => `L${+d + 1}`).replace(/R(\d)/, (_, d) => `R${+d + 1}`)) : ['no edges'], size: 14,
            fill: (i, j) => (A.bad && A.bad.R0.includes(i) && A.bad.C0.includes(j) ? ['red', 0.3] : A.M[i][j] ? ['blue', 0.15] : null), textColor: (i, j) => (A.M[i][j] ? 'ink' : 'faint') });
        });
        v.legend([['purple', 'fractional vertex: edge weight $x_e$', {}], ['red', 'square submatrix with $|\\det|\\ge2$', { area: true }]]);
        v.readout(() => {
          const A = analyse();
          return `${A.m} edges · graph is **${A.bip ? 'bipartite' : 'not bipartite'}** · incidence matrix **${A.bad ? 'not TU' : 'TU'}**${A.bad ? ` (a ${A.bad.R0.length}×${A.bad.R0.length} submatrix has $\\det=${A.bad.d}$)` : ` (${A.checked} exact square-minor determinants checked)`}\npolytope $\\{x\\ge0: \\sum_{e\\ni v}x_e\\le1\\}$ has **${A.V.length}** vertices, **${A.frac.length}** fractional${A.frac.length ? `: e.g. $x=(${A.frac[vsel % A.frac.length].x.map((q) => num(q, 2)).join(', ')})$` : ' — every vertex is a matching'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 11.25
    {
      num: '11.25',
      kind: 'Paper',
      name: 'Maximal Flow Through a Network',
      paper: { authors: 'L. R. Ford, Jr. and D. R. Fulkerson', year: 1956, title: 'Maximal Flow Through a Network', venue: 'Canadian Journal of Mathematics 8: 399–404', doi: '10.4153/CJM-1956-045-5' },
      introduces: ['algo-11.6', 'graph-6.2.2'],
      statement: String.raw`The original paper models a finite **undirected** network with positive real link capacities. A flow is a nonnegative amount on each simple source–sink **chain**, with total chain usage of each link at most its capacity. **Theorem 1** states that the maximum flow value equals the least capacity of a disconnecting set. The proof in §1 is **nonconstructive**. In §2, for a network planar even after adding a source–sink link, **Theorem 2** shows that a topmost or bottommost boundary chain meets every inclusion-minimal cut exactly once. Subtract its bottleneck capacity along the chain, delete saturated links and repeat. This special planar procedure terminates after at most one round per original link, even for real capacities.`,
      idea: String.raw`Theorem 1 first establishes existence using the compact polytope of chain-flow amounts. Averaging maximal flows shows that the links saturated in every maximal flow disconnect source and sink (Lemma 1). A refined set of oriented left links also disconnects them (Lemma 2), and each positive chain flow crosses it once (Lemma 3); summing capacities therefore counts the maximum value exactly. For the planar algorithm, the corollary to Theorem 1 says subtracting $k$ from a chain meeting every cut once reduces network capacity by $k$. Theorem 2 supplies that chain, and every subtraction deletes at least one link. §3 relates shortest chains to cuts in the planar dual. The later general residual-labeling algorithm is not what this six-page 1956 article presents.`,
      caption: String.raw`A new fixed **source–sink planar undirected ladder**, not a reproduction of the paper's figures. Step through the paper's topmost-chain subtraction: orange marks the chosen boundary chain, labels give accumulated chain usage/original capacity, and saturated links are dashed. Chain amounts are nonnegative and no backward residual augmentation is used. On completion, a minimum cut is obtained **independently by exhaustive enumeration** for comparison with the constructed flow. Edit capacities (integers 1–20); positions stay fixed to preserve the planar embedding.`,
      deps: ['algo-11.1', 'algo-11.2'],
      refs: ['Ford–Fulkerson (1956), §1 Theorem 1 and Lemmas 1–3 pp.399–402; §2 Theorem 2 pp.402–404; §3 p.404'],
      tags: ['flow', 'duality'],
      scope: String.raw`The original general theorem uses finite positive real capacities and chain flows. Its planar computing procedure is distinct from later general augmenting-path methods. The displayed cut comes from exhaustive search rather than from the planar deletion procedure. Integer chain amounts follow for the displayed integer capacities.`,
      links: {doi:'https://doi.org/10.4153/CJM-1956-045-5'},
      viz(v) {
        const s=v.stage({x:[-.2,10],y:[0,6],axes:false,equal:true,height:340,weight:1.6}),bars=v.stage({x:[0,3],y:[0,24],axes:'box',gutter:true,height:340,weight:.6,xticks:[[.75,'chain flow'],[2.25,'min cut']],ylabel:'value'});
        const G=v.graph(s,{directed:false,weights:true,layout:'none',nodes:Object.entries(PLANAR_NET.pos).map(([id,[x,y]])=>({id,x,y})),edges:PLANAR_NET.arcs.map(e=>e.slice()),draggable:false,editable:{editWeight:true,minWeight:1,maxWeight:20,addNode:false,addEdge:false,deleteNode:false,deleteEdge:false,moveNode:false},onChange:()=>S.reset({at:'start'})});
        const arcs=()=>G.edges.map(e=>[String(e.from),String(e.to),e.w]),S=v.steps({frames:()=>planarChainRun(PLANAR_NET.pos,arcs()).frames,speed:1.3,still:3});
        v.button('Reset capacities',()=>{G.set({nodes:Object.entries(PLANAR_NET.pos).map(([id,[x,y]])=>({id,x,y})),edges:PLANAR_NET.arcs.map(e=>e.slice())});S.reset({at:'start'});});
        v.render(()=>{
          const fr=S.frame,E=arcs(),path=new Set(fr.path?.edges||[]),idx=new Map(G.edges.map((e,i)=>[e,i])),mc=Math.min(...undirectedCuts(Object.keys(PLANAR_NET.pos),E).map(q=>q.cap));
          G.draw({edgeColor:e=>fr.S&&fr.S.has(String(e.from))!==fr.S.has(String(e.to))?'red':path.has(idx.get(e))?'orange':fr.remaining[idx.get(e)]<=1e-12?'muted':'accent',edgeDash:e=>fr.remaining[idx.get(e)]<=1e-12,edgeWidth:e=>path.has(idx.get(e))?3.6:1.8,edgeLabel:e=>`${num(fr.used[idx.get(e)],2)}/${e.w}`,nodeFill:fr.S?id=>fr.S.has(String(id))?'teal':null:null});
          bars.setView([0,3],[0,Math.max(1,mc,fr.value)*1.2]);bars.rect(.3,0,1.2,fr.value,{fill:'accent',fillAlpha:.7,color:'accent'});if(fr.type==='stop')bars.rect(1.8,0,2.7,fr.cap,{fill:'red',fillAlpha:.6,color:'red'});bars.hline(mc,{color:'green',dash:true});
        });
        v.legend([['orange','topmost boundary chain'],['muted','saturated/deleted link',{dash:true}],['accent','accumulated nonnegative chain flows'],['red','independently enumerated minimum cut']]);
        v.readout(()=>{const fr=S.frame;return `${fr.chains.length} chain flows, total **${num(fr.value,2)}**${fr.amount?` · current bottleneck ${num(fr.amount,2)}`:''}.`+`\n`+(fr.type==='stop'?`Exhaustive undirected minimum cut: **${num(fr.cap,2)}**; computed equality ${Math.abs(fr.value-fr.cap)<1e-9?'holds':'FAILED (numerical/implementation mismatch)'}. This finite computation illustrates the paper's theorem.`:'The 1956 planar method subtracts capacities; the general theorem is proved separately.');});
      },
    },
  ],
};
