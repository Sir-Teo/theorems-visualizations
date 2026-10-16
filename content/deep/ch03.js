// Deep Learning Theory — Chapter 3: Backpropagation and automatic differentiation (items 3.1–3.6; 3.7–3.11 in ch03-b.js)
//
// Every derivative on screen is computed by the automatic differentiation in ch03.shared.js (a formula parser that
// builds the computational graph, dual-number forward mode, reverse mode node by node, and a Wengert tape), and checked
// against central finite differences. Operation counts are counted while the code runs, not taken from formulas.
import {
  clamp, memo, mnus, tsci, f3, rand, hashStr, softmax,
  parseGraph, graphValues, graphPartials, graphForward, graphReverse, graphEval, graphSpec, nodeSym, Tape,
} from './ch03.shared.js';

const VARS = ['x', 'y'];
/** Example formulas for the graph items (value = text typed into the field). */
const PRESETS = [
  { value: 'x*y + sin(x)', label: '$xy+\\sin x$' },
  { value: 'log(x) + x*y - sin(y)', label: '$\\ln x+xy-\\sin y$' },
  { value: 'tanh(x*y + sin(x*y))', label: '$\\tanh(xy+\\sin xy)$' },
  { value: 'exp(-(x^2 + y^2)/2) * cos(3x)', label: '$e^{-r^2/2}\\cos 3x$' },
];
/** Depth (longest path from an input) of every node. */
function depths(P) { const d = new Array(P.nodes.length).fill(0); for (const n of P.nodes) if (n.args.length) d[n.i] = 1 + Math.max(...n.args.map((a) => d[a])); return d; }
const opCount = (P) => P.nodes.filter((n) => n.op !== 'var').length;
/** A v.graph that re-lays itself out (layered, left to right) whenever the parsed graph changes. */
function graphView(v, s) {
  const G = v.graph(s, { directed: true, shape: 'box', layout: 'none', r: 11, fontSize: 12, nodes: [], edges: [] });
  let key = null;
  return {
    G,
    sync(P, k, label) { k += '|' + Math.round(s.width) + 'x' + Math.round(s.height); if (k !== key) { key = k; G.set(graphSpec(P, label)); G.layout('layered', { rankdir: 'right' }); } },
    /** Data position of node i. */
    pos(i) { const n = G.node(i); return n ? [n.x, n.y] : [0, 0]; },
  };
}
/** Draw an arrow from node a to node b along the straight line, trimmed to the middle part (adjoint flow overlay). */
function midArrow(s, A, B, st = {}) {
  const [x0, y0] = A, [x1, y1] = B, X0 = s.X(x0), Y0 = s.Y(y0), X1 = s.X(x1), Y1 = s.Y(y1), L = Math.hypot(X1 - X0, Y1 - Y0) || 1;
  const nx = -(Y1 - Y0) / L, ny = (X1 - X0) / L, off = st.off ?? 9, t0 = st.t0 ?? 0.3, t1 = st.t1 ?? 0.72;
  const P = (t) => [s.invX(X0 + (X1 - X0) * t + nx * off), s.invY(Y0 + (Y1 - Y0) * t + ny * off)];
  const [ax, ay] = P(t0), [bx, by] = P(t1); s.arrow(ax, ay, bx, by, { color: st.color || 'orange', width: st.width || 2.6, head: 8 });
}
/** Central difference of the graph's output in variable name. */
function fdGraph(P, env, name, h = 1e-5) { const a = { ...env, [name]: env[name] + h }, b = { ...env, [name]: env[name] - h }; return (graphEval(P, a) - graphEval(P, b)) / (2 * h); }
const errMsg = (s, msg) => s.text('⚠ ' + msg, 0.5, 0.5, { align: 'center', color: 'red', size: 13 });

export default {
  collection: 'deep',
  chapter: 3,
  title: 'Backpropagation and automatic differentiation',
  summary: String.raw`Training needs the gradient of one scalar loss with respect to millions of parameters, and reverse-mode automatic differentiation — backpropagation — delivers it for a small constant multiple of the cost of evaluating the loss. The chapter builds the computational graph of a formula, pushes tangents forward (forward mode, Jacobian–vector products) and adjoints backward (reverse mode, vector–Jacobian products), counts the operations both modes need, and checks every gradient against finite differences. It then unrolls recurrent networks through time, where repeated multiplication by the same Jacobian makes gradients vanish or explode, trades memory for recomputation with checkpoints, differentiates through fixed points with the implicit function theorem, and reruns the 1986 experiments that made backpropagation famous.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Computational graph',
      statement: String.raw`A **computational graph** (or *evaluation trace*) of a function $f:\R^n\to\R^m$ is a directed acyclic graph whose source nodes are the inputs $v_1=x_1,\dots,v_n=x_n$ and whose every other node $v_i$ holds the result of one **elementary operation** $\varphi_i$ — a sum, product, quotient, power, or a library function such as $\exp,\log,\sin,\tanh,\sigma,\mathrm{ReLU}$ — applied to earlier nodes:
$$v_i=\varphi_i\bigl(v_j\bigr)_{j\in\mathrm{pa}(i)},\qquad i=n+1,\dots,N,$$
with designated output nodes giving $f(x)$. Ordering the nodes topologically and evaluating them in order is the **forward pass**. A value used several times (a common subexpression, or a shared weight) is a single node with several outgoing edges, so the graph of a formula is in general a DAG, not the expression tree; a neural network (1.5) is the special case whose nodes are affine maps and activations.`,
      idea: String.raw`Every program that computes $f$ from its inputs by a fixed sequence of elementary operations defines such a graph, and the graph is all that differentiation needs: each node has a known local derivative $\partial\varphi_i/\partial v_j$, and the chain rule (pma-9.15) combines them along paths. Sharing common subexpressions changes the cost of evaluation (each node is computed once) but not the function; the expression tree recomputes them. The number of nodes $N$ is the cost of the forward pass, and it is the yardstick against which the cost of derivatives is measured (3.4).`,
      caption: String.raw`Type any formula in $x$ and $y$ (sums, products, powers, $\sin\cos\tan\exp\log\sqrt{}\tanh$, $\mathrm{sigmoid}$, $\mathrm{relu}$), or pick an example. It is parsed into its graph of elementary operations (right; inputs blue, output green), each box showing the operation and its current value. Drag the gold point in the input plane (left, shaded by $f$ with level lines) and watch the values flow through the graph. Switch off *share common subexpressions* to see the expression tree: repeated pieces such as $xy$ in $\tanh(xy+\sin xy)$ are then computed twice.`,
      deps: ['deep-1.5'],
      refs: ['Goodfellow §6.5'],
      tags: ['computational graph', 'automatic differentiation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Automatic_differentiation' },
      viz(v) {
        const fx = v.input('$f(x,y)=$', PRESETS[2].value, { width: 230 });
        v.select('examples', PRESETS, PRESETS[2].value, { onChange: (s) => fx.set(s) });
        const share = v.toggle('share common subexpressions (DAG)', true);
        const sP = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', weight: 0.72, minWidth: 250, title: 'input plane, shaded by $f$' });
        const sG = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.5, minWidth: 340, title: 'computational graph (values flow left → right)' });
        const H = sP.handle(0.8, 0.9, { color: 'gold', r: 7 });
        const CG = graphView(v, sG);
        const heatKey = memo();
        let info = null;
        v.render(() => {
          const P = parseGraph(fx.value, VARS, { share: share.value });
          if (P.error) { errMsg(sG, P.error); info = null; return; }
          const Pt = share.value ? parseGraph(fx.value, VARS, { share: false }) : P, Pd = share.value ? P : parseGraph(fx.value, VARS, { share: true });
          CG.sync(P, fx.value + '|' + share.value, (n) => nodeSym(n) + '\n−0.000');
          const env = { x: H.x, y: H.y }, val = graphValues(P, env), f = (x, y) => graphEval(P, { x, y });
          // heat map of f with level lines
          const R = heatKey(fx.value, () => { let M = 0; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { const z = f(-2.5 + i / 8, -2.5 + j / 8); if (isFinite(z)) M = Math.max(M, Math.abs(z)); } return M || 1; });
          sP.heat(f, { range: [-R, R], cmap: 'theme-diverging', res: 3, key: 'h' + fx.value });
          sP.contour(f, [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((t) => t * R), { color: 'ink', width: 0.8, alpha: 0.4, res: 90 });
          sP.text(`f = ${f3(val[P.out], 4)}`, H.x, H.y, { dy: -16, align: 'center', size: 12.5, weight: 600, plate: true });
          const d = depths(P);
          CG.G.draw({
            nodeLabel: (id) => nodeSym(P.nodes[id]) + '\n' + f3(val[id]),
            nodeColor: (id) => (P.nodes[id].op === 'var' ? 'accent' : id === P.out ? 'green' : null),
            nodeFill: (id) => (id === P.out ? 'green' : null),
            edgeColor: (e) => (P.nodes[e.from].op === 'var' ? 'accent' : null),
          });
          let direct = null;
          const C = v.M.compileExpr(fx.value, VARS); if (C.f) direct = C.f(H.x, H.y);
          info = { val: val[P.out], N: P.nodes.length, nIn: P.nodes.filter((n) => n.op === 'var').length, m: opCount(P), E: P.nodes.reduce((s, n) => s + n.args.length, 0), depth: Math.max(...d), mT: opCount(Pt), mD: opCount(Pd), direct, share: share.value,
            fan: P.nodes.filter((n) => P.nodes.filter((u) => u.args.includes(n.i)).length > 1 && n.op !== 'var').length };
        });
        v.legend([['accent', 'inputs'], ['green', 'output'], ['muted', 'elementary operations']]);
        v.readout(() => info && String.raw`$f(${mnus(H.x.toFixed(2))},${mnus(H.y.toFixed(2))})=${tsci(info.val, 4)}$` + (info.direct != null && isFinite(info.direct) ? ` (formula evaluated directly: $${tsci(info.direct, 4)}$ ${Math.abs(info.direct - info.val) < 1e-12 * (1 + Math.abs(info.val)) ? '✓' : '✗'})` : '') +
          ` · graph: **${info.N} nodes** (${info.nIn} ${info.share ? 'input nodes' : 'input leaves'} + ${info.m} operations), ${info.E} edges, depth ${info.depth}` +
          ` · the expression tree needs ${info.mT} operations, the DAG ${info.mD}` + (info.mT > info.mD ? ` — sharing saves ${info.mT - info.mD}` : '') + (info.share && info.fan ? ` · ${info.fan} intermediate value${info.fan === 1 ? ' is' : 's are'} used more than once` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Algorithm',
      name: 'Forward-mode automatic differentiation',
      statement: String.raw`**Input:** a computational graph for $f:\R^n\to\R^m$, a point $x$ and a tangent direction $\dot x\in\R^n$. **Output:** $f(x)$ and the directional derivative $Df(x)\,\dot x$ (a Jacobian–vector product). Every node carries a pair $(v_i,\dot v_i)$ — a **dual number** $v_i+\dot v_i\varepsilon$ with $\varepsilon^2=0$; the inputs start as $(x_k,\dot x_k)$ and each operation is evaluated together with its tangent,
$$v_i=\varphi_i\bigl(v_{\mathrm{pa}(i)}\bigr),\qquad \dot v_i=\sum_{j\in\mathrm{pa}(i)}\frac{\partial\varphi_i}{\partial v_j}\,\dot v_j ,$$
in topological order. One pass costs a small constant times the cost of evaluating $f$ and yields **one column-combination** of the Jacobian; the full gradient of a scalar $f$ needs $n$ passes (seeds $\dot x=e_1,\dots,e_n$), so forward mode suits functions with few inputs and many outputs. The result is exact up to rounding: no step size is involved.`,
      idea: String.raw`Write every node as a function of $t$ along the line $x+t\dot x$. The chain rule (pma-9.15) says $\frac{d}{dt}v_i=\sum_j\partial_j\varphi_i\,\frac{d}{dt}v_j$, which is exactly the tangent update; induction over the topological order gives $\dot v_{\text{out}}=\frac{d}{dt}f(x+t\dot x)|_{t=0}=Df(x)\dot x$. Algebraically, $\varphi(a+b\varepsilon)=\varphi(a)+\varphi'(a)b\,\varepsilon$ when $\varepsilon^2=0$, so running the program on dual numbers carries the first-order Taylor coefficient along. Nothing is stored: each tangent is used and discarded with its value.`,
      caption: String.raw`Choose a seed — $\partial/\partial x$, $\partial/\partial y$, or a free direction $u$ (drag the orange arrow tip) — and step through the forward pass: each node becomes a dual number *(value, tangent)*, the active one gold with its local partial derivatives on the incoming edges. Middle: the function along the line $t\mapsto f(p+tu)$; at the last step its tangent line appears with slope $\dot v_{\text{out}}$, and the readout compares it with a central finite difference. Drag the point $p$ at any time.`,
      deps: ['deep-3.1', 'pma-9.15'],
      refs: ['Goodfellow §6.5'],
      tags: ['automatic differentiation', 'forward mode', 'dual numbers'],
      credit: 'Wengert, 1964',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Automatic_differentiation#Forward_accumulation' },
      viz(v) {
        const fx = v.input('$f(x,y)=$', PRESETS[0].value, { width: 210, onChange: () => S.reset() });
        v.select('examples', PRESETS, PRESETS[0].value, { onChange: (s) => fx.set(s) });
        const seedS = v.select('seed', [{ value: 'x', label: '$\\partial/\\partial x$' }, { value: 'y', label: '$\\partial/\\partial y$' }, { value: 'u', label: 'direction $u$' }], 'u', { onChange: () => S.reset({ at: 'keep' }) });
        const sP = v.stage({ x: [-4, 4], y: [-2.5, 2.5], equal: true, height: 250, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', minWidth: 230, title: 'point $p$ and seed $u$ (shaded by $f$)' });
        const heatKey = memo();
        const sL = v.stage({ x: [-1.5, 1.5], y: [-2, 2], height: 250, axes: 'box', gutter: true, xlabel: '$t$', minWidth: 260, title: '$t\\mapsto f(p+tu)$ and its tangent' });
        const sG = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 270, full: true, title: 'dual numbers (value, tangent) flowing forward' });
        const Hp = sP.handle(0.8, 0.6, { color: 'gold', r: 7 });
        const Hu = sP.handle(1.6, 1.3, { color: 'orange', r: 6 });
        Hp.onDrag = () => S.reset({ at: 'keep' }); Hu.onDrag = () => S.reset({ at: 'keep' });
        const CG = graphView(v, sG);
        const cur = () => {
          const P = parseGraph(fx.value, VARS); if (P.error) return { P };
          const sd = seedS.value, du = [Hu.x - Hp.x, Hu.y - Hp.y], L = Math.hypot(du[0], du[1]) || 1;
          const u = sd === 'x' ? [1, 0] : sd === 'y' ? [0, 1] : [du[0] / L, du[1] / L];
          const env = { x: Hp.x, y: Hp.y }, R = graphForward(P, env, { x: u[0], y: u[1] });
          return { P, u, env, R };
        };
        const CODE = ['for each input $x_k$:  $(v_k,\\dot v_k)\\leftarrow(x_k,u_k)$', 'for $i$ in topological order:', '    $v_i\\leftarrow\\varphi_i(v_{\\mathrm{pa}(i)})$', '    $\\dot v_i\\leftarrow\\sum_j \\partial_j\\varphi_i\\,\\dot v_j$', 'return $v_{\\mathrm{out}},\\ \\dot v_{\\mathrm{out}}=Df(x)\\,u$'];
        const S = v.steps({
          codeTitle: 'forward mode (one pass)', code: CODE, codePos: 'below', speed: 1.2, still: 'end', start: 0,
          frames: () => {
            const P = parseGraph(fx.value, VARS); if (P.error) return [{ k: -1, note: 'Fix the formula.' }];
            const order = P.nodes.filter((n) => n.op !== 'var').map((n) => n.i), fr = [{ k: 0, active: null, line: 1, note: () => { const c = cur(); return c.R ? `Seed the inputs: $\\dot x=${mnus(c.u[0].toFixed(3))}$, $\\dot y=${mnus(c.u[1].toFixed(3))}$.` : ''; } }];
            order.forEach((i, t) => fr.push({ k: t + 1, active: i, line: [3, 4], note: () => { const c = cur(); if (!c.R) return ''; const n = c.P.nodes[i], p = graphPartials(c.P, c.R.val, n); return `Node **${nodeSym(n)}**: value $${tsci(c.R.val[i], 3)}$, tangent $${n.args.map((a, k) => `(${tsci(p[k], 3)})(${tsci(c.R.dot[a], 3)})`).join('+')}=${tsci(c.R.dot[i], 3)}$.`; } }));
            fr.push({ k: order.length + 1, active: null, line: 5, done: true, note: () => { const c = cur(); return c.R ? `Output: $f=${tsci(c.R.val[c.P.out], 4)}$ and $Df\\,u=${tsci(c.R.dot[c.P.out], 5)}$.` : ''; } });
            return fr;
          },
        });
        let info = null;
        v.render(() => {
          const c = cur(), P = c.P, F = S.frame;
          if (P.error) { errMsg(sG, P.error); info = null; return; }
          CG.sync(P, fx.value, (n) => nodeSym(n) + '\n(−0.000, −0.000)');
          const order = P.nodes.filter((n) => n.op !== 'var').map((n) => n.i), rank = new Map(order.map((i, t) => [i, t + 1]));
          const known = (i) => P.nodes[i].op === 'var' || (rank.get(i) ?? 1e9) <= (F.k ?? 0);
          const { val, dot } = c.R, act = F.active;
          const partials = act != null ? graphPartials(P, val, P.nodes[act]) : [];
          CG.G.draw({
            nodeLabel: (id) => nodeSym(P.nodes[id]) + (known(id) ? `\n(${f3(val[id])}, ${f3(dot[id])})` : '\n( · , · )'),
            nodeFill: (id) => (id === act ? 'gold' : F.done && id === P.out ? 'green' : null),
            nodeColor: (id) => (P.nodes[id].op === 'var' ? 'accent' : known(id) ? 'orange' : null),
            edgeColor: (e) => (e.to === act ? 'gold' : known(e.to) ? 'orange' : null),
            edgeWidth: (e) => (e.to === act ? 3 : null),
            edgeLabel: (e) => (e.to === act ? '∂ ' + f3(partials[e.k]) : null),
            dim: P.nodes.filter((n) => !known(n.i) && n.i !== act).map((n) => n.i),
          });
          // input plane
          const [u0, u1] = c.u;
          sP.line(Hp.x - 4 * u0, Hp.y - 4 * u1, Hp.x + 4 * u0, Hp.y + 4 * u1, { color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 });
          sP.arrow(Hp.x, Hp.y, Hp.x + u0, Hp.y + u1, { color: 'orange', width: 2.4 });
          Hu.visible = seedS.value === 'u';
          const fxy = (x, y) => graphEval(P, { x, y }), Rr = heatKey(fx.value, () => { let M = 0; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { const z = fxy(-4 + i / 5, -2.5 + j / 8); if (isFinite(z)) M = Math.max(M, Math.abs(z)); } return M || 1; });
          sP.heat(fxy, { range: [-1.6 * Rr, 1.6 * Rr], cmap: 'theme-diverging', res: 3, key: 'h' + fx.value });
          sP.contour(fxy, [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75].map((q) => q * Rr), { color: 'ink', width: 0.8, alpha: 0.35, res: 80 });
          // slice
          const g = (t) => graphEval(P, { x: Hp.x + t * u0, y: Hp.y + t * u1 });
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 60; i++) { const z = g(-1.5 + i / 20); if (isFinite(z)) { lo = Math.min(lo, z); hi = Math.max(hi, z); } }
          if (!isFinite(lo)) { lo = -1; hi = 1; } const pad = 0.12 * (hi - lo || 1); sL.setView([-1.5, 1.5], [lo - pad, hi + pad]);
          sL.fn(g, { color: 'accent', width: 2.4, n: 300 });
          const f0 = val[P.out], s0 = dot[P.out];
          if (F.done) sL.line(-1.5, f0 - 1.5 * s0, 1.5, f0 + 1.5 * s0, { color: 'orange', width: 2 });
          sL.dot(0, f0, { r: 5, color: 'gold' });
          const fd = (g(1e-5) - g(-1e-5)) / 2e-5;
          info = { f0, s0, fd, ops: c.R.ops, n: P.vars.length || 1, m: opCount(P), done: F.done };
        });
        v.legend([['orange', 'tangents known'], ['gold', 'node being computed'], ['accent', 'slice $f(p+tu)$']]);
        v.readout(() => info && String.raw`forward mode: $Df(p)\,u=${tsci(info.s0, 6)}$` + ` · central difference ($h=10^{-5}$): $${tsci(info.fd, 6)}$` + ` (gap $${tsci(Math.abs(info.fd - info.s0), 1)}$)` +
          ` · one dual pass: ${info.ops} arithmetic operations for ${info.m} graph operations · the full gradient needs **${info.n} passes**, one per input — for a loss with $10^6$ parameters, $10^6$ passes`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Algorithm',
      name: 'Reverse-mode differentiation (backpropagation)',
      statement: String.raw`**Input:** a computational graph for a scalar $f:\R^n\to\R$ and a point $x$. **Output:** $f(x)$ and the whole gradient $\nabla f(x)$. **Forward pass:** evaluate the nodes in topological order and *store* every value $v_i$. **Backward pass:** set the **adjoint** $\bar v_{\text{out}}=1$, all others $0$, and visit the nodes in reverse topological order; at node $i$ propagate to each parent $j$
$$\bar v_j\ \mathrel{+}=\ \bar v_i\,\frac{\partial\varphi_i}{\partial v_j}(v_{\mathrm{pa}(i)}),$$
so that when all users of $v_j$ have been visited, $\bar v_j=\partial f/\partial v_j$. At the end $\bar x_k=\partial f/\partial x_k$ for every input at once. The cost is a small constant times the cost of the forward pass, independent of $n$ (3.4); the price is memory for all stored intermediate values (3.9). For a layered network this is **backpropagation**: $\bar h^{(\ell-1)}=W^{(\ell)\top}\bigl(\bar h^{(\ell)}\odot\sigma'(z^{(\ell)})\bigr)$ and $\bar W^{(\ell)}=(\bar h^{(\ell)}\odot\sigma'(z^{(\ell)}))\,h^{(\ell-1)\top}$.`,
      idea: String.raw`$\partial f/\partial v_j$ is a sum over all paths from $v_j$ to the output of the product of local derivatives along the path (the multivariable chain rule, pma-9.15, applied along the graph). Reverse mode factors this sum: the paths through a user $i$ of $v_j$ contribute $\partial_j\varphi_i$ times the sum over paths from $v_i$ to the output, which is $\bar v_i$ — already complete because every user of $v_i$ comes later in the topological order. So each edge is used exactly once, and the accumulation $+=$ is where a value used twice (a shared weight, a common subexpression) collects contributions from both uses. It is forward mode run on the transposed linearised graph: one backward pass gives one row of the Jacobian (a vector–Jacobian product, 3.5).`,
      caption: String.raw`Step through: first the forward pass fills in and stores every value, then the backward pass starts with adjoint $1$ at the output and walks back; at each step the orange arrows carry $\bar v_i\times\partial\varphi_i/\partial v_j$ to the parents (the local derivative is written on the edge). Right: the gradient components accumulating, with the finite-difference values as hollow rings — they meet at the end. Try $\tanh(w\tanh(wx+b)+b)$, where $w$ and $b$ are used twice and collect two contributions. Change the inputs with the sliders.`,
      deps: ['deep-3.2', 'pma-9.17'],
      refs: ['Prince §7.4', 'Goodfellow §6.5'],
      tags: ['backpropagation', 'reverse mode', 'automatic differentiation'],
      credit: 'Linnainmaa, 1970; Werbos, 1974/1982; Rumelhart, Hinton & Williams, 1986',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Backpropagation' },
      viz(v) {
        const V4 = ['x', 'y', 'w', 'b'];
        const PRE = [
          { value: '(sigmoid(w*x + b) - y)^2', label: 'neuron loss $(\\sigma(wx+b)-y)^2$' },
          { value: 'tanh(w*tanh(w*x + b) + b)', label: '$\\tanh(w\\tanh(wx+b)+b)$' },
          { value: 'log(x) + x*y - sin(y)', label: '$\\ln x+xy-\\sin y$' },
        ];
        const fx = v.input('$f=$', PRE[0].value, { width: 210, onChange: () => S.reset() });
        v.select('examples', PRE, PRE[0].value, { onChange: (s) => fx.set(s) });
        const SL = { x: v.slider('$x$', -2, 2, 1.5, { step: 0.01 }), y: v.slider('$y$', -2, 2, 1, { step: 0.01 }), w: v.slider('$w$', -2, 2, 0.8, { step: 0.01 }), b: v.slider('$b$', -2, 2, -0.3, { step: 0.01 }) };
        const sG = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.6, minWidth: 340, title: 'forward values, then adjoints flowing back' });
        const sB = v.stage({ x: [0, 5], y: [-1, 1], height: 320, axes: 'box', gutter: true, weight: 0.6, minWidth: 200, title: 'gradient components' });
        const CG = graphView(v, sG);
        const cur = () => {
          const P = parseGraph(fx.value, V4); if (P.error) return { P };
          const env = {}; for (const k of V4) env[k] = SL[k].value;
          return { P, env, R: graphReverse(P, env) };
        };
        const CODE = ['for $i$ in topological order:  $v_i\\leftarrow\\varphi_i(v_{\\mathrm{pa}(i)})$   ▷ store $v_i$', '$\\bar v_{\\mathrm{out}}\\leftarrow 1$;  all other $\\bar v_j\\leftarrow 0$', 'for $i$ in reverse topological order:', '    for each parent $j$ of $i$:  $\\bar v_j \\mathrel{+}= \\bar v_i\\,\\partial\\varphi_i/\\partial v_j$', 'return $\\nabla f=(\\bar x_1,\\dots,\\bar x_n)$'];
        const S = v.steps({
          codeTitle: 'reverse mode', code: CODE, codePos: 'below', speed: 1.3, still: 'end',
          frames: () => {
            const P = parseGraph(fx.value, V4); if (P.error) return [{ ph: 'x', note: 'Fix the formula.' }];
            const order = P.nodes.filter((n) => n.op !== 'var').map((n) => n.i), fr = [{ ph: 'f', k: 0, line: 1, note: 'The inputs are known; nothing else yet.' }];
            order.forEach((i, t) => fr.push({ ph: 'f', k: t + 1, active: i, line: 1, note: () => { const c = cur(); return c.R ? `Forward: **${nodeSym(c.P.nodes[i])}** $=${tsci(c.R.val[i], 4)}$, stored.` : ''; } }));
            fr.push({ ph: 'b', j: 0, line: 2, note: 'Seed the output adjoint: $\\bar v_{\\mathrm{out}}=\\partial f/\\partial f=1$.' });
            order.slice().reverse().forEach((i, t) => fr.push({ ph: 'b', j: t + 1, active: i, line: 4, note: () => { const c = cur(); if (!c.R) return ''; const e = c.R.events[t]; return `Backward through **${nodeSym(c.P.nodes[i])}** (adjoint $${tsci(e.adj, 3)}$): ` + e.contrib.map((q) => `$${tsci(e.adj, 3)}\\times${tsci(q.partial, 3)}$ to **${nodeSym(c.P.nodes[q.from])}**`).join(', ') + '.'; } }));
            fr.push({ ph: 'done', j: order.length, line: 5, note: () => { const c = cur(); return c.R ? 'Done: ' + c.P.vars.map((nm) => `$\\partial f/\\partial ${nm}=${tsci(c.R.adj[c.P.nodes.find((n) => n.name === nm).i], 4)}$`).join(', ') : ''; } });
            return fr;
          },
        });
        for (const k of V4) SL[k].el.addEventListener('input', () => S.reset({ at: 'keep' }));
        let info = null;
        v.render(() => {
          const c = cur(), P = c.P, F = S.frame;
          for (const k of V4) SL[k].el.hidden = !!P.vars && !P.vars.includes(k);
          if (P.error) { errMsg(sG, P.error); info = null; return; }
          CG.sync(P, fx.value, (n) => nodeSym(n) + ' −0.000\nv̄ −0.000');
          const order = P.nodes.filter((n) => n.op !== 'var').map((n) => n.i), rank = new Map(order.map((i, t) => [i, t + 1]));
          const fwdK = F.ph === 'f' ? F.k : 1e9, known = (i) => P.nodes[i].op === 'var' || (rank.get(i) ?? 1e9) <= fwdK;
          // adjoints accumulated after F.j backward events
          const nb = F.ph === 'f' ? -1 : F.j, adj = new Float64Array(P.nodes.length), touched = new Set();
          if (nb >= 0) { adj[P.out] = 1; touched.add(P.out); for (let t = 0; t < nb; t++) for (const q of c.R.events[t].contrib) { adj[q.from] += q.contrib; touched.add(q.from); } }
          const act = F.active, ev = F.ph === 'b' && act != null ? c.R.events[F.j - 1] : null;
          CG.G.draw({
            nodeLabel: (id) => { const n = P.nodes[id]; const top = nodeSym(n) + (known(id) ? ' ' + f3(c.R.val[id]) : ''); return touched.has(id) ? top + '\nv̄ ' + f3(adj[id]) : top; },
            nodeFill: (id) => (id === act ? (F.ph === 'f' ? 'gold' : 'orange') : null),
            nodeColor: (id) => (touched.has(id) ? 'orange' : P.nodes[id].op === 'var' ? 'accent' : known(id) ? 'accent' : null),
            edgeColor: (e) => (ev && e.to === act ? 'orange' : F.ph === 'f' && e.to === act ? 'gold' : null),
            edgeWidth: (e) => (e.to === act ? 3 : null),
            edgeLabel: (e) => (ev && e.to === act ? '∂ ' + f3(ev.contrib[e.k].partial) : null),
            edgeLabelColor: () => 'orange',
            dim: F.ph === 'f' ? P.nodes.filter((n) => !known(n.i) && n.i !== act).map((n) => n.i) : [],
          });
          if (ev) for (const q of ev.contrib) midArrow(sG, CG.pos(act), CG.pos(q.from), { color: 'orange', off: P.nodes[act].args[0] === P.nodes[act].args[1] ? (q.k ? -14 : 14) : 10 });
          // gradient bars
          const names = P.vars, fd = names.map((nm) => fdGraph(P, c.env, nm)), g = names.map((nm) => adj[P.nodes.find((n) => n.name === nm && n.op === 'var').i]);
          const M = Math.max(0.2, ...fd.map(Math.abs)) * 1.25;
          sB.setView([0.4, names.length + 0.6], [-M, M]); sB.setTicks(names.map((nm, k) => [k + 1, nm]), null);
          sB.hline(0, { color: 'faint', width: 1 });
          names.forEach((nm, k) => {
            if (nb >= 0) sB.rect(k + 1 - 0.28, 0, k + 1 + 0.28, g[k], { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.4 });
            sB.dot(k + 1, fd[k], { r: 6.5, hollow: true, color: 'ink', width: 1.8 });
          });
          info = { names, g, fd, done: F.ph === 'done', fops: opCount(P), bops: c.R.ops - opCount(P), f: c.R.val[P.out] };
        });
        v.legend([['accent', 'value stored'], ['orange', 'adjoint $\\bar v=\\partial f/\\partial v$'], ['ink', 'finite difference', { dot: true }]]);
        v.readout(() => info && (info.done ? String.raw`$f=${tsci(info.f, 4)}$ · backprop gradient ` + info.names.map((nm, k) => `$\\partial_${nm}f=${tsci(info.g[k], 5)}$`).join(', ') + ` · central differences ` + info.names.map((nm, k) => `$${tsci(info.fd[k], 5)}$`).join(', ') + ` · max gap ${tsci(Math.max(...info.g.map((x, k) => Math.abs(x - info.fd[k]))), 1)}` +
          ` · cost: forward ${info.fops} operations, backward ${info.bops} — **all ${info.names.length} partials in one backward pass**` : 'Step to the end to see the full gradient. Forward values are stored because the backward pass needs them in the local derivatives.'));
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Cheap gradient principle',
      credit: 'Linnainmaa, 1976; Baur & Strassen, 1983; Griewank, 1989',
      statement: String.raw`Let $f:\R^n\to\R$ be computed by a straight-line program of elementary operations (each with at most two arguments and a local derivative computable in a bounded number of operations), with operation count $\mathrm{OPS}(f)$. Then reverse mode computes the whole gradient with
$$\mathrm{OPS}\bigl(f,\nabla f\bigr)\ \le\ c\cdot\mathrm{OPS}(f),$$
where $c$ is a small constant **independent of $n$** ($c\le 4$ in Griewank's standard operation count; Baur and Strassen proved $c=3$ for multiplications and divisions of rational functions). Memory grows with the length of the evaluation (every intermediate value is stored). By contrast, forward mode or finite differences need about $n$ evaluations of cost $\approx\mathrm{OPS}(f)$, i.e. $\Theta(n)\cdot\mathrm{OPS}(f)$.`,
      idea: String.raw`In the backward pass each elementary operation is visited once and, for each of its (at most two) arguments, contributes one local partial, one multiplication and one addition. So the backward pass costs a bounded multiple of the forward pass, whatever $n$ is; the counting is per operation, so it is the same for a function with ten parameters or a billion. Forward mode instead propagates one tangent direction per pass, and a gradient needs one pass per input direction (3.2). This asymmetry — gradients of scalar losses are cheap — is why training networks with millions of parameters by gradient descent is feasible at all.`,
      caption: String.raw`A tanh network with a squared-error loss; slide the parameter count from $10$ to $10^6$ (wide: one hidden layer; deep: six hidden layers). Every count is measured by running the code with an operation counter: the loss (grey), its full gradient by reverse mode (blue, the forward and backward pass together), forward mode (orange: one tangent pass, measured, times $n$ passes), and forward differences (red: one evaluation, measured, times $n+1$). On log–log axes, reverse mode runs parallel to the loss — a constant factor — while the other two climb twice as steeply (slope 2: cost $\propto n^2$). Right: the costs at the chosen size relative to one loss evaluation.`,
      deps: ['deep-3.3'],
      refs: ['Goodfellow §6.5'],
      tags: ['backpropagation', 'complexity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Automatic_differentiation#Reverse_accumulation' },
      viz(v) {
        const archS = v.select('network', [{ value: 'wide', label: 'wide (1 hidden layer)' }, { value: 'deep', label: 'deep (6 hidden layers)' }], 'wide');
        const nS = v.slider('parameters $n$', 10, 1e6, 3000, { log: true, int: true });
        const sC = v.stage({ x: [8, 2e6], y: [10, 1e14], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, xlabel: 'parameters $n$', ylabel: 'arithmetic operations', weight: 1.35, minWidth: 320, title: 'measured cost against the number of parameters' });
        const sR = v.stage({ x: [0.4, 4.6], y: [0.5, 3e6], ylog: true, height: 340, axes: 'box', gutter: true, weight: 0.75, minWidth: 220, xticks: [[1, 'f'], [2, 'reverse'], [3, 'fwd mode'], [4, 'fin. diff.']], title: 'cost ÷ cost of $f$' });
        const M_IN = 4;
        /** Layer sizes with about n parameters. */
        const sizes = (arch, n) => { if (arch === 'wide') { const h = Math.max(1, Math.round((n - 1) / (M_IN + 2))); return [M_IN, h, 1]; } const w = Math.max(1, Math.round((-11 + Math.sqrt(121 + 20 * Math.max(0, n - 1))) / 10)); return [M_IN, w, w, w, w, w, w, 1]; };
        /** Run the loss, its reverse-mode gradient, one forward-mode tangent pass; count every arithmetic operation. */
        const measure = (sz, check = false) => {
          const L = sz.length - 1, r = rand(hashStr('cg|' + sz.join(','))), W = [], b = [];
          for (let l = 0; l < L; l++) { const w = new Float64Array(sz[l] * sz[l + 1]), sd = 1 / Math.sqrt(sz[l]); for (let i = 0; i < w.length; i++) w[i] = r.normal() * sd; W.push(w); b.push(Float64Array.from({ length: sz[l + 1] }, () => 0.1 * r.normal())); }
          const x = Float64Array.from({ length: sz[0] }, () => r.normal()), y = 0.3;
          let n = 0; for (let l = 0; l < L; l++) n += W[l].length + b[l].length;
          const fwd = (WW, bb) => {
            let ops = 0; const A = [x];
            for (let l = 0; l < L; l++) {
              const nin = sz[l], nout = sz[l + 1], a = A[l], w = WW[l], z = new Float64Array(nout);
              for (let i = 0; i < nout; i++) { let s = bb[l][i]; const o = i * nin; for (let j = 0; j < nin; j++) s += w[o + j] * a[j]; z[i] = s; } ops += 2 * nin * nout;
              if (l < L - 1) { for (let i = 0; i < nout; i++) z[i] = Math.tanh(z[i]); ops += nout; }
              A.push(z);
            }
            const res = A[L][0] - y; ops += 3; return { loss: 0.5 * res * res, A, res, ops };
          };
          const F = fwd(W, b);
          // reverse mode
          let bops = 0; const gW = W.map((w) => new Float64Array(w.length)), gb = b.map((u) => new Float64Array(u.length));
          let d = Float64Array.of(F.res);
          for (let l = L - 1; l >= 0; l--) {
            const nin = sz[l], nout = sz[l + 1], a = F.A[l], w = W[l];
            for (let i = 0; i < nout; i++) { gb[l][i] = d[i]; const o = i * nin; for (let j = 0; j < nin; j++) gW[l][o + j] = d[i] * a[j]; } bops += nin * nout;
            if (l > 0) { const dp = new Float64Array(nin); for (let j = 0; j < nin; j++) { let s = 0; for (let i = 0; i < nout; i++) s += w[i * nin + j] * d[i]; dp[j] = s * (1 - a[j] * a[j]); } bops += 2 * nin * nout + 3 * nin; d = dp; }
          }
          // one forward-mode pass with a random tangent on every parameter
          let tops = 0; const tW = W.map((w) => Float64Array.from(w, () => r.normal())), tb = b.map((u) => Float64Array.from(u, () => r.normal()));
          let ad = new Float64Array(sz[0]);
          for (let l = 0; l < L; l++) {
            const nin = sz[l], nout = sz[l + 1], a = F.A[l], w = W[l], zd = new Float64Array(nout);
            for (let i = 0; i < nout; i++) { let s = tb[l][i]; const o = i * nin; for (let j = 0; j < nin; j++) { s += tW[l][o + j] * a[j]; if (l) s += w[o + j] * ad[j]; } zd[i] = s; }
            tops += (l ? 4 : 2) * nin * nout;
            if (l < L - 1) { const an = F.A[l + 1]; for (let i = 0; i < nout; i++) zd[i] *= 1 - an[i] * an[i]; tops += 3 * nout; }
            ad = zd;
          }
          tops += 1 + F.ops;                                   // L̇ = r·ż, plus the values carried along
          let chk = null;
          if (check) {
            // compare a few reverse-mode partials with central differences
            const rr = rand(7); chk = 0;
            for (let q = 0; q < 4; q++) { const l = rr.int(0, L - 1), k = rr.int(0, W[l].length - 1), h = 1e-6, w0 = W[l][k]; W[l][k] = w0 + h; const fp = fwd(W, b).loss; W[l][k] = w0 - h; const fm = fwd(W, b).loss; W[l][k] = w0; const fd = (fp - fm) / (2 * h), g = gW[l][k]; chk = Math.max(chk, Math.abs(fd - g) / Math.max(1e-8, Math.abs(fd) + Math.abs(g))); }
          }
          return { n, F: F.ops, R: F.ops + bops, T: tops, chk, sz };
        };
        const curve = memo(), point = memo();
        let info = null;
        v.render(() => {
          const arch = archS.value;
          const C = curve(arch, () => { const out = []; for (let k = 0; k <= 25; k++) { const n = 10 * 10 ** (5 * k / 25), sz = sizes(arch, n); if (out.length && out[out.length - 1].sz.join() === sz.join()) continue; out.push(measure(sz)); } return out; });
          const Pm = point(arch + '|' + nS.value, () => measure(sizes(arch, nS.value), true));
          const ser = [['muted', (q) => q.F], ['accent', (q) => q.R], ['orange', (q) => q.n * q.T], ['red', (q) => (q.n + 1) * q.F]];
          for (const [col, g] of ser) { sC.path(C.map((q) => [q.n, g(q)]), { color: col, width: 2.4 }); sC.dots(C.map((q) => [q.n, g(q)]), { r: 2.6, color: col }); }
          sC.vline(Pm.n, { color: 'gold', width: 1.4, dash: [4, 3] });
          for (const [col, g] of ser) sC.dot(Pm.n, g(Pm), { r: 5.5, color: col });
          sC.fn((n) => 300 * n, { color: 'faint', width: 1, dash: [3, 4] });
          sC.text('slope 1: ∝ n', 2e5, 300 * 2e5, { dy: 14, size: 11.5, color: 'muted' }); sC.text('slope 2: ∝ n²', 40, 2e10, { size: 11.5, color: 'muted' });
          const rel = [1, Pm.R / Pm.F, (Pm.n * Pm.T) / Pm.F, Pm.n + 1];
          ['muted', 'accent', 'orange', 'red'].forEach((col, k) => { sR.rect(k + 1 - 0.3, 0.5, k + 1 + 0.3, rel[k], { fill: col, fillAlpha: 0.55, color: col, width: 1.4 }); sR.text(rel[k] < 100 ? rel[k].toFixed(2) : Math.round(rel[k]).toLocaleString('en-US'), k + 1, rel[k], { dy: -9, align: 'center', size: 11.5, weight: 600 }); });
          info = { ...Pm, ratio: Pm.R / Pm.F, ratios: C.map((q) => q.R / q.F) };
        });
        v.legend([['muted', 'loss $f$'], ['accent', 'gradient by reverse mode'], ['orange', 'gradient by forward mode ($n$ passes)'], ['red', 'gradient by finite differences ($n+1$ evaluations)']]);
        v.readout(() => info && String.raw`layer sizes ${info.sz.join('–')}: $n=${info.n.toLocaleString('en-US').replace(/,/g, '{,}')}$ parameters · loss: ${info.F.toLocaleString('en-US')} operations · reverse-mode gradient: ${info.R.toLocaleString('en-US')} (**${info.ratio.toFixed(2)}×**; between ${Math.min(...info.ratios).toFixed(2)}× and ${Math.max(...info.ratios).toFixed(2)}× over the whole range) · forward mode $${tsci(info.n * info.T, 2)}$ · finite differences $${tsci((info.n + 1) * info.F, 2)}$ · reverse-mode partials agree with central differences to relative error $${tsci(info.chk, 1)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Jacobian–vector and vector–Jacobian products',
      statement: String.raw`For a differentiable $F:\R^n\to\R^m$ with Jacobian $J=DF(x)\in\R^{m\times n}$:
- the **Jacobian–vector product** (JVP, *pushforward*) $v\mapsto Jv$ maps a tangent vector at $x$ to a tangent vector at $F(x)$; forward mode computes it in one pass;
- the **vector–Jacobian product** (VJP, *pullback*) $u\mapsto J^{\top}u$ (equivalently $u^\top J$) maps a covector — a linear functional $w\mapsto\ip{u}{w}$ on the output space — to a covector on the input space; reverse mode computes it in one pass.

They are adjoint: $\ip{u}{Jv}=\ip{J^\top u}{v}$ for all $u\in\R^m$, $v\in\R^n$ (ladr-7.1). Building the full Jacobian takes $n$ JVPs (one per column) or $m$ VJPs (one per row), so forward mode is the cheaper choice when $n\ll m$ and reverse mode when $m\ll n$ — the case $m=1$ of a scalar loss being the extreme.`,
      idea: String.raw`The chain rule makes the Jacobian of a composition a product $J=J_L\cdots J_2J_1$ of the Jacobians of the elementary steps. A JVP evaluates $J_L(\cdots(J_2(J_1v)))$ from the right, in the order the program runs — forward mode; a VJP evaluates $((u^\top J_L)J_{L-1})\cdots J_1$ from the left, against the program order — reverse mode, which is why it must first run the program and store what the local Jacobians need. Neither ever forms a Jacobian matrix: each step only applies a local derivative to a vector. The identity $\ip{u}{Jv}=\ip{J^\top u}{v}$ is the definition of the transpose, and checking it numerically is a standard test of a hand-written VJP.`,
      caption: String.raw`Left: input space, with a small circle around the point $x$ and a tangent vector $v$ (drag both). Right: output space; the image of the circle is nearly the ellipse $F(x)+J(\text{circle}-x)$ (dashed). The orange arrow is the JVP $Jv$, computed by one forward sweep of the tape. Drag the covector $u$ (purple, right): its level lines $\ip{u}{w}=\text{const}$ are drawn, and the VJP $J^\top u$ — one backward sweep — appears on the left with the pulled-back level lines. The readout checks $\ip{u}{Jv}=\ip{J^\top u}{v}$. Pick another map with the selector.`,
      deps: ['deep-3.2', 'deep-3.3', 'ladr-7.1'],
      refs: ['Goodfellow §6.5'],
      tags: ['Jacobian', 'automatic differentiation'],
      viz(v) {
        const MAPS = {
          layer: { label: 'tanh layer', f: (A, x, y) => [A.tanh(A.add(A.add(A.mul(A.c(1.3), x), A.mul(A.c(-0.9), y)), A.c(0.2))), A.tanh(A.add(A.add(A.mul(A.c(0.7), x), A.mul(A.c(1.1), y)), A.c(-0.1)))], out: [[-1.3, 1.3], [-1.3, 1.3]] },
          square: { label: '$z\\mapsto z^2/2$', f: (A, x, y) => [A.mul(A.c(0.5), A.sub(A.mul(x, x), A.mul(y, y))), A.mul(x, y)], out: [[-2.2, 2.2], [-2.2, 2.2]] },
          swirl: { label: 'swirl', f: (A, x, y) => { const r = A.mul(A.c(0.6), A.add(A.mul(x, x), A.mul(y, y))), c = A.cos(r), s = A.sin(r); return [A.sub(A.mul(x, c), A.mul(y, s)), A.add(A.mul(x, s), A.mul(y, c))]; }, out: [[-2.4, 2.4], [-2.4, 2.4]] },
        };
        const mapS = v.select('map $F$', Object.entries(MAPS).map(([k, m]) => ({ value: k, label: m.label })), 'layer');
        const sI = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$x_1$', ylabel: '$x_2$', title: 'input space: $v$ and the pullback $J^\\top u$' });
        const sO = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$y_1$', ylabel: '$y_2$', title: 'output space: $Jv$ and the covector $u$' });
        const Hx = sI.handle(0.4, -0.3, { color: 'gold', r: 7, label: 'x', labelPos: 'sw' });
        const Hv = sI.handle(0.05, 0.55, { color: 'orange', r: 6, label: 'v' });
        const Hu = sO.handle(0.6, 0.5, { color: 'purple', r: 6, label: 'u' });
        let uRel = [0.55, 0.45];                         // u is stored relative to F(x)
        Hu.onDrag = () => { uRel = [Hu.x - Fx[0], Hu.y - Fx[1]]; };
        const NUM = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, tanh: Math.tanh, sin: Math.sin, cos: Math.cos, c: (k) => k };
        const tapeAlg = (T) => ({ add: (a, b) => T.add(a, b), sub: (a, b) => T.sub(a, b), mul: (a, b) => T.mul(a, b), tanh: (a) => T.tanh(a), sin: (a) => T.sin(a), cos: (a) => T.cos(a), c: (k) => T.input(k) });
        let Fx = [0, 0], info = null, lastMap = null;
        v.render(() => {
          const M = MAPS[mapS.value], f = (x, y) => M.f(NUM, x, y);
          if (lastMap !== mapS.value) { lastMap = mapS.value; sO.setView(M.out[0], M.out[1]); }
          Fx = f(Hx.x, Hx.y);
          const vv = [Hv.x - Hx.x, Hv.y - Hx.y];
          // record the program once on a tape: JVP = one tangent sweep, VJP = one backward sweep
          const T = new Tape(), xi = T.input(Hx.x), yi = T.input(Hx.y), [o1, o2] = M.f(tapeAlg(T), xi, yi);
          const dot = T.tangent(new Map([[xi, vv[0]], [yi, vv[1]]])), Jv = [dot[o1], dot[o2]];
          const u = uRel; Hu.set(Fx[0] + u[0], Fx[1] + u[1]);
          const adj = T.backward([[o1, u[0]], [o2, u[1]]]), JTu = [adj[xi], adj[yi]];
          // full Jacobian from two tangent sweeps (for the ellipse)
          const c1 = T.tangent(new Map([[xi, 1]])), c2 = T.tangent(new Map([[yi, 1]])), J = [[c1[o1], c2[o1]], [c1[o2], c2[o2]]];
          // input side: grid image is on the right; circle + its image
          const eps = 0.35;
          sI.circle(Hx.x, Hx.y, eps, { color: 'accent', width: 1.6, fill: 'accent', fillAlpha: 0.08 });
          // pulled-back level lines: perpendicular to J^T u, spaced so that <J^T u, dx> steps by the same amounts as in output space
          const nI = Math.hypot(JTu[0], JTu[1]), nO = Math.hypot(u[0], u[1]), step = 0.3 * nO;
          const levels = (s, c, nvec, nn, col) => { if (nn < 1e-9) return; const d = [-nvec[1] / nn, nvec[0] / nn]; for (let k = -6; k <= 6; k++) { const off = (k * step) / nn, p = [c[0] + (nvec[0] / nn) * off, c[1] + (nvec[1] / nn) * off]; s.line(p[0] - 9 * d[0], p[1] - 9 * d[1], p[0] + 9 * d[0], p[1] + 9 * d[1], { color: col, width: k === 0 ? 1.4 : 0.8, alpha: k === 0 ? 0.7 : 0.35 }); } };
          levels(sI, [Hx.x, Hx.y], JTu, nI, 'purple'); levels(sO, Fx, u, nO, 'purple');
          sI.arrow(Hx.x, Hx.y, Hv.x, Hv.y, { color: 'orange', width: 2.6 });
          if (nI > 1e-9) sI.arrow(Hx.x, Hx.y, Hx.x + JTu[0], Hx.y + JTu[1], { color: 'purple', width: 2.8 });
          sI.text('Jᵀu', Hx.x + JTu[0], Hx.y + JTu[1], { dx: 8, dy: -8, color: 'purple', size: 13, weight: 700, plate: true });
          // output side: image of the circle (exact) and of the linearisation (dashed)
          sO.curve((t) => f(Hx.x + eps * Math.cos(t), Hx.y + eps * Math.sin(t)), 0, 2 * Math.PI, { color: 'accent', width: 1.8, n: 200, fill: 'accent', fillAlpha: 0.08 });
          sO.curve((t) => { const dx = eps * Math.cos(t), dy = eps * Math.sin(t); return [Fx[0] + J[0][0] * dx + J[0][1] * dy, Fx[1] + J[1][0] * dx + J[1][1] * dy]; }, 0, 2 * Math.PI, { color: 'ink', width: 1.2, dash: [5, 4], n: 120 });
          sO.arrow(Fx[0], Fx[1], Fx[0] + Jv[0], Fx[1] + Jv[1], { color: 'orange', width: 2.8 });
          sO.text('Jv', Fx[0] + Jv[0], Fx[1] + Jv[1], { dx: 8, dy: 10, color: 'orange', size: 13, weight: 700, plate: true });
          sO.arrow(Fx[0], Fx[1], Fx[0] + u[0], Fx[1] + u[1], { color: 'purple', width: 2.2 });
          sO.dot(Fx[0], Fx[1], { r: 5, color: 'gold', label: 'F(x)', labelPos: 'sw' });
          info = { Jv, JTu, u, vv, J, lhs: u[0] * Jv[0] + u[1] * Jv[1], rhs: JTu[0] * vv[0] + JTu[1] * vv[1], fops: T.fops, tops: T.tops, bops: T.bops };
        });
        v.legend([['orange', 'tangent $v$ and its pushforward $Jv$ (JVP)'], ['purple', 'covector $u$ and its pullback $J^\\top u$ (VJP)'], ['accent', 'circle and its image'], ['ink', 'linearisation', { dash: true }]]);
        v.readout(() => info && String.raw`$J=\begin{pmatrix}${info.J[0].map((x) => x.toFixed(3)).join('&')}\\${info.J[1].map((x) => x.toFixed(3)).join('&')}\end{pmatrix}$ · $Jv=(${info.Jv.map((x) => x.toFixed(4)).join(',\\,')})$, $J^\top u=(${info.JTu.map((x) => x.toFixed(4)).join(',\\,')})$ · $\langle u,Jv\rangle=${info.lhs.toFixed(10)}$, $\langle J^\top u,v\rangle=${info.rhs.toFixed(10)}$ ${Math.abs(info.lhs - info.rhs) < 1e-12 ? '✓' : ''} · tape: ${info.fops} operations recorded; one JVP sweep ${info.tops}, one VJP sweep ${info.bops} operations`);
      },
    },
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Proposition',
      name: 'Gradient of softmax cross-entropy is p − y',
      statement: String.raw`Let $p=\operatorname{softmax}(z)\in\R^K$ for logits $z\in\R^K$ and let $y\in\R^K$ be a target distribution ($y_k\ge0$, $\sum_ky_k=1$; one-hot for a hard label). The cross-entropy $L(z)=-\sum_ky_k\log p_k=-\ip{y}{z}+\log\sum_je^{z_j}$ has gradient
$$\nabla_zL=p-y .$$
Hence the gradient is bounded ($\norm{p-y}_1\le2$), its components sum to zero, it vanishes exactly when $p=y$, and for a one-hot $y$ it tends to $0$ only as $z_y-\max_{k\neq y}z_k\to\infty$: a hard label can never be fitted exactly, and with label smoothing ($y=(1-\eps)e_c+\eps/K$) the minimum is attained at finite logits.`,
      idea: String.raw`Differentiate the log-sum-exp form: $\partial_{z_k}\log\sum_je^{z_j}=e^{z_k}/\sum_je^{z_j}=p_k$ and $\partial_{z_k}\ip{y}{z}=y_k$. Backpropagating through the two stages separately gives the same answer by a detour: $\partial L/\partial p_k=-y_k/p_k$, the softmax Jacobian is $\operatorname{diag}(p)-pp^\top$, and $(\operatorname{diag}(p)-pp^\top)(-y/p)=-y+p\sum_ky_k=p-y$ — the large factors $1/p_k$ cancel, which is why frameworks fuse the two operations for numerical stability. The same cancellation gives $\sigma(z)-y$ for the logistic loss (1.8).`,
      caption: String.raw`Left: drag the five logits. Middle: the probabilities $p$ (bars) and the target $y$ (outlined), with an arrow on every bar from $p_k$ to $y_k$ — the *negative* gradient $-(p_k-y_k)$, the direction gradient descent moves each logit. Below: the table compares $p-y$ with the gradient computed by generic reverse mode on a tape that knows only $\exp$, $\log$, sums and quotients. Press *descend* to take gradient steps: with a hard label the arrows shrink but never vanish; raise the label smoothing $\varepsilon$ and they reach zero.`,
      deps: ['deep-3.3', 'deep-1.9'],
      refs: ['Prince §5.5'],
      tags: ['softmax', 'cross-entropy', 'gradient'],
      viz(v) {
        const K = 5, CC = ['accent', 'orange', 'green', 'purple', 'teal'];
        const cS = v.select('true class $c$', [0, 1, 2, 3, 4].map((k) => ({ value: k, label: String(k + 1) })), 2);
        const eS = v.slider('label smoothing $\\varepsilon$', 0, 0.5, 0, { step: 0.01 });
        const sZ = v.stage({ x: [0.4, K + 0.6], y: [-5, 7], height: 280, axes: 'box', gutter: true, xticks: [1, 2, 3, 4, 5].map((k) => [k, 'z' + '₁₂₃₄₅'[k - 1]]), minWidth: 240, weight: 0.85, title: 'logits $z$ (drag)' });
        const sP = v.stage({ x: [0.4, K + 0.6], y: [0, 1.08], height: 280, axes: 'box', gutter: true, xticks: [1, 2, 3, 4, 5].map((k) => [k, String(k)]), minWidth: 260, weight: 1, title: 'probabilities $p$, target $y$, and $-(p-y)$' });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 215, full: true, title: 'the formula against reverse-mode autodiff' });
        const Z0 = [1.2, 0.4, 0.9, -0.6, 0.1];
        const H = Z0.map((z, k) => sZ.handle(k + 1, z, { color: CC[k], constrain: (px, py) => [k + 1, clamp(py, -4.9, 6.9)] }));
        const target = () => { const e = eS.value, c = cS.value; return Array.from({ length: K }, (_, k) => (k === c ? 1 - e : 0) + e / K); };
        const step = (n) => { for (let s = 0; s < n; s++) { const z = H.map((h) => h.y), p = softmax(z), y = target(); H.forEach((h, k) => h.set(h.x, clamp(z[k] - 1.0 * (p[k] - y[k]), -4.9, 6.9))); } };
        v.button('descend 1 step', () => step(1));
        v.button('20 steps', () => step(20));
        v.button('reset', () => H.forEach((h, k) => h.set(k + 1, Z0[k])));
        const TB = v.table(sT, { rows: K, cols: 6, square: false, cellAspect: 2.6, maxCell: 30, size: 12.5, colLabels: ['$z_k$', '$p_k$', '$y_k$', '$p_k-y_k$', '$\\partial L/\\partial z_k\\ \\text{(tape)}$', '$\\text{difference}$'], colWeights: [1, 1, 1, 1.15, 1.6, 1.15], rowLabels: (i) => `class ${i + 1}` });
        let info = null;
        v.render(() => {
          const z = H.map((h) => h.y), p = softmax(z), y = target(), c = cS.value;
          const L = -y.reduce((s, yk, k) => s + (yk > 0 ? yk * Math.log(p[k]) : 0), 0);
          // generic reverse mode: L = -Σ y_k log(exp(z_k) / Σ_j exp(z_j))  (no shift, no fused formula)
          const T = new Tape(), zi = z.map((u) => T.input(u)), ex = zi.map((i) => T.exp(i)), Ssum = T.sum(ex);
          const terms = ex.map((e, k) => T.mulc(T.log(T.div(e, Ssum)), -y[k])), Li = T.sum(terms), adj = T.backward(Li), gT = zi.map((i) => adj[i]);
          sZ.hline(0, { color: 'faint', width: 1 });
          z.forEach((u, k) => sZ.rect(k + 1 - 0.27, 0, k + 1 + 0.27, u, { fill: CC[k], fillAlpha: 0.3, color: CC[k], width: 1.3 }));
          sZ.text(`L = ${L.toFixed(4)}`, 3, 6.9, { align: 'center', size: 12.5, weight: 600, baseline: 'top', dy: 4 });
          p.forEach((q, k) => {
            sP.rect(k + 1 - 0.3, 0, k + 1 + 0.3, q, { fill: CC[k], fillAlpha: 0.55, stroke: false });
            sP.rect(k + 1 - 0.36, 0, k + 1 + 0.36, y[k], { color: 'ink', width: k === c ? 2.2 : 1.2, dash: k === c ? null : [3, 3] });
            const g = q - y[k];
            if (Math.abs(g) > 0.004) sP.arrow(k + 1, q, k + 1, y[k], { color: 'red', width: 2.6, head: 8 });
            sP.text((g >= 0 ? '+' : '−') + Math.abs(g).toFixed(3), k + 1 + 0.08, Math.max(q, y[k]) + 0.02, { align: 'center', size: 11, color: 'red', baseline: 'bottom', dy: -2 });
          });
          const fmt = (x) => mnus(x.toFixed(5));
          TB.draw({
            value: (i, j) => (j === 0 ? fmt(z[i]) : j === 1 ? fmt(p[i]) : j === 2 ? fmt(y[i]) : j === 3 ? fmt(p[i] - y[i]) : j === 4 ? fmt(gT[i]) : f3(Math.abs(gT[i] - (p[i] - y[i])), 2)),
            fill: (i, j) => (j === 3 || j === 4 ? ['red', Math.min(0.45, Math.abs(p[i] - y[i]) * 0.9)] : i === c ? ['gold', 0.12] : null),
            textColor: (i, j) => (j === 5 ? 'green' : 'ink'),
          });
          const gn = Math.sqrt(p.reduce((s, q, k) => s + (q - y[k]) ** 2, 0)), sorted = z.slice().sort((a, b) => b - a), margin = z[c] - Math.max(...z.filter((_, k) => k !== c));
          info = { L, gn, margin, sum: p.reduce((s, q, k) => s + q - y[k], 0), maxd: Math.max(...gT.map((g, k) => Math.abs(g - (p[k] - y[k])))), e: eS.value, Lmin: -y.reduce((s, yk) => s + (yk > 0 ? yk * Math.log(yk) : 0), 0), sorted };
        });
        v.legend([['red', 'descent direction $-(p-y)$ on each logit'], ['ink', 'target $y$ (outline)']]);
        v.readout(() => info && String.raw`loss $L=${info.L.toFixed(5)}$ (its minimum ${info.e > 0 ? `$H(y)=${info.Lmin.toFixed(5)}$, reached at $p=y$` : '$0$, never reached'}) · $\lVert p-y\rVert_2=${tsci(info.gn, 3)}$ · components sum to $${tsci(Math.abs(info.sum) < 1e-15 ? 0 : info.sum, 1)}$ · margin $z_c-\max_{k\ne c}z_k=${info.margin.toFixed(3)}$ · reverse mode and $p-y$ differ by at most $${info.maxd === 0 ? '0' : v.sci(info.maxd, 1)}$`);
      },
    },
  ],
};
