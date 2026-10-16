// Manifolds & Riemannian Geometry — Chapter 1: Smooth manifolds (items 1.1–1.6; 1.7–1.11 in ch01-b.js)
import { TAU, clamp, wrap, minus, stN, stS, stNinv, stSinv, torusPt, dfd } from './ch01.shared.js';

const PI = Math.PI;
const nrm3 = (p) => { const r = Math.hypot(...p) || 1; return p.map((c) => c / r); };
/** true when the angle th is within 1e-6 of the angle c (mod 2π) */
const near = (th, c) => Math.abs(wrap(th - c + PI) - PI) < 1e-6;

export default {
  collection: 'mfd',
  chapter: 1,
  title: 'Smooth manifolds',
  summary: String.raw`A smooth manifold is a space covered by coordinate charts whose transition maps are smooth, so calculus can be done locally and the answers do not depend on the chart. Spheres, projective spaces, Grassmannians, tori and matrix groups are the standard examples. Bump functions and partitions of unity, available because smoothness is so flexible, are the tool that patches local constructions into global ones.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Charts, atlases and transition maps',
      statement: String.raw`Let $M$ be a topological space (Hausdorff, second countable) that is locally Euclidean of dimension $n$. A **chart** is a pair $(U,\varphi)$ of an open set $U\subset M$ and a homeomorphism $\varphi\colon U\to\varphi(U)$ onto an open subset of $\R^n$. Two charts $(U,\varphi)$, $(V,\psi)$ are **smoothly compatible** if the **transition map** $\psi\circ\varphi^{-1}\colon\varphi(U\cap V)\to\psi(U\cap V)$ and its inverse $\varphi\circ\psi^{-1}$ are smooth ($C^\infty$) — automatic if $U\cap V=\varnothing$. A **smooth atlas** is a family of pairwise compatible charts whose domains cover $M$.`,
      idea: String.raw`A chart is a coordinate system on part of $M$, and calculus only makes sense in coordinates. If a point lies in two charts, its two coordinate vectors are related by the transition map, and the definition demands that this relation be a diffeomorphism between open subsets of $\R^n$: then "smooth" means the same thing in every chart of the atlas. On the circle a single angle chart cannot exist (a circle is not homeomorphic to an interval), but two angle charts, each missing one point, do the job — and their transition map is $t\mapsto t$ on one arc of the overlap and $t\mapsto t-2\pi$ on the other: smooth on each piece, with the 2π jump living *between* the pieces of the disconnected overlap, which is perfectly allowed.`,
      caption: String.raw`Drag $p$ around the circle. Chart $A$ (blue arc) uses the angle $t\in(0,2\pi)$ and misses $\theta=0$; chart $B$ (orange) uses $s\in(c-2\pi,c)$ and misses $\theta=c$ — move the cut $c$ with the slider. The overlap is drawn on the circle in green and orange, one colour per arc, and the same colours plot the transition map $s=\psi(t)$ on the right, with the moving point $(t(p),s(p))$. Switch to the four **graph charts** (coordinate $x$ on the upper and lower semicircles, $y$ on the right and left ones) to see transition maps like $y=\sqrt{1-x^2}$, and an empty overlap for top → bottom.`,
      deps: ['top-2.19', 'pma-9.20'],
      refs: ['Lee SM Ch. 1'],
      credit: 'Hermann Weyl, 1913 (first abstract definition for surfaces); Hassler Whitney, 1936 (general atlas definition)',
      tags: ['chart', 'atlas', 'transition map'],
      viz(v) {
        const atlas = v.select('atlas', [{ value: 'ang', label: 'two angle charts' }, { value: 'graph', label: 'four graph charts' }], 'ang');
        const cut = v.slider('cut $c$ of chart $B$', 0.5, 5.8, PI, { step: 0.01 });
        const pair = v.select('transition', [{ value: '0', label: 'top → right' }, { value: '1', label: 'top → left' }, { value: '2', label: 'top → bottom' }, { value: '3', label: 'right → top' }], '0');
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, axes: false, height: 380, title: 'the circle and its chart domains' });
        const R = v.stage({ x: [0, TAU], y: [-TAU, TAU], axes: 'box', gutter: true, height: 380, xlabel: 'coordinate in chart 1', ylabel: 'coordinate in chart 2', title: 'transition map', weight: 1.1 });
        const P = L.handle(Math.cos(1.0), Math.sin(1.0), { color: 'gold', label: 'p', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const GR = [
          { name: 'top', nm: 'x', dom: (th) => Math.sin(th) > 1e-9, co: (th) => Math.cos(th) },
          { name: 'right', nm: 'y', dom: (th) => Math.cos(th) > 1e-9, co: (th) => Math.sin(th) },
          { name: 'left', nm: 'y', dom: (th) => Math.cos(th) < -1e-9, co: (th) => Math.sin(th) },
          { name: 'bottom', nm: 'x', dom: (th) => Math.sin(th) < -1e-9, co: (th) => Math.cos(th) },
        ];
        const setup = () => {
          if (atlas.value === 'ang') {
            const c = cut.value;
            return { cs: [{ name: 'A', nm: 't', dom: (th) => !near(th, 0), co: (th) => wrap(th), lo: 0, hi: TAU }, { name: 'B', nm: 's', dom: (th) => !near(th, c), co: (th) => c - TAU + wrap(th - c), lo: c - TAU, hi: c }], i: 0, j: 1 };
          }
          const [i, j] = [[0, 1], [0, 2], [0, 3], [1, 0]][+pair.value];
          return { cs: GR.map((g) => ({ ...g, lo: -1, hi: 1 })), i, j };
        };
        const N = 720, pieceCol = ['green', 'orange', 'purple', 'pink'];
        let info = null;
        v.render(() => {
          cut.el.hidden = atlas.value !== 'ang'; pair.el.hidden = atlas.value === 'ang';
          const { cs, i, j } = setup(), ci = cs[i], cj = cs[j];
          const th = (k) => ((k + 0.5) / N) * TAU;
          // domains of the two charts as arcs outside the circle
          L.circle(0, 0, 1, { color: 'faint', width: 1.2 });
          [[ci, 1.13, 'accent'], [cj, 1.27, 'orange']].forEach(([c, r, col]) => {
            let seg = [];
            const flush = (end) => { if (seg.length > 1) L.path(seg, { color: col, width: 5, alpha: 0.9 }); seg = []; };
            for (let k = 0; k < N; k++) { const t = th(k); if (c.dom(t)) seg.push([r * Math.cos(t), r * Math.sin(t)]); else flush(); }
            flush();
            for (let k = 0; k < N; k++) { const a = c.dom(th(k)), b = c.dom(th((k + 1) % N)); if (a !== b) { const t = a ? th(k) + 0.5 * TAU / N : th(k) + 0.5 * TAU / N; L.dot(r * Math.cos(t), r * Math.sin(t), { r: 4.5, hollow: true, color: col }); } }
            const mid = c === ci ? PI * 0.5 + 0.7 : -PI * 0.5 - 0.5;
            L.text(c.name.length === 1 ? 'chart ' + c.name : c.name, 1.5 * Math.cos(c === ci ? 2.5 : -0.9), 1.5 * Math.sin(c === ci ? 2.5 : -0.9), { size: 12.5, color: col, align: 'center', weight: 600 });
          });
          // overlap pieces
          const ov = (t) => ci.dom(t) && cj.dom(t);
          let pcs = [], cur = null;
          for (let k = 0; k < N; k++) {
            const t = th(k);
            if (ov(t)) { const a = ci.co(t), b = cj.co(t); if (cur && Math.abs(a - cur[cur.length - 1].a) < 0.35 && Math.abs(b - cur[cur.length - 1].b) < 0.35) cur.push({ t, a, b }); else { cur = [{ t, a, b }]; pcs.push(cur); } } else cur = null;
          }
          // merge wrap-around (last piece continuing the first)
          if (pcs.length > 1 && ov(th(0)) && ov(th(N - 1))) { const first = pcs[0], last = pcs[pcs.length - 1]; if (Math.abs(first[0].a - last[last.length - 1].a) < 0.35 && Math.abs(first[0].b - last[last.length - 1].b) < 0.35) { last.push(...first); pcs.shift(); } }
          pcs.forEach((pc, q) => {
            const col = pieceCol[q % 4];
            L.path(pc.map((o) => [Math.cos(o.t), Math.sin(o.t)]), { color: col, width: 6, alpha: 0.85 });
            R.path(pc.map((o) => [o.a, o.b]), { color: col, width: 3.2 });
            [pc[0], pc[pc.length - 1]].forEach((o) => R.dot(o.a, o.b, { r: 4, hollow: true, color: col }));
          });
          // view of the transition plot
          const pad = atlas.value === 'ang' ? 0.25 : 0.12;
          R.setView([ci.lo - pad, ci.hi + pad], [cj.lo - pad, cj.hi + pad]);
          if (atlas.value === 'ang') R.setTicks([[0, '0'], [PI, 'π'], [TAU, '2π']], [[-PI, '−π'], [0, '0'], [PI, 'π'], [TAU, '2π']].filter(([y]) => y >= cj.lo - 0.01 && y <= cj.hi + 0.01)); else R.setTicks(null, null);
          R.setLabels(`${ci.nm} (chart ${ci.name})`, `${cj.nm} (chart ${cj.name})`);
          if (atlas.value === 'ang') R.line(0, 0, TAU, TAU, { color: 'faint', width: 1, dash: [4, 4] });
          // the moving point
          const tp = Math.atan2(P.y, P.x), inO = ov(tp);
          if (inO) {
            const a = ci.co(tp), b = cj.co(tp);
            R.hline(b, { color: 'gold', width: 1, dash: [3, 3], alpha: 0.6 }); R.vline(a, { color: 'gold', width: 1, dash: [3, 3], alpha: 0.6 });
            R.dot(a, b, { r: 7, color: 'gold' });
          }
          // where is p relative to the cuts
          const h = 1e-5;
          const d = inO ? (cj.co(tp + h) - cj.co(tp - h)) / (ci.co(tp + h) - ci.co(tp - h)) : NaN;
          const shifts = pcs.map((pc) => { const m = pc[Math.floor(pc.length / 2)]; return m.b - m.a; });
          info = { ci, cj, tp, inO, a: ci.dom(tp) ? ci.co(tp) : NaN, b: cj.dom(tp) ? cj.co(tp) : NaN, d, np: pcs.length, shifts };
        });
        v.legend([['accent', 'domain of the first chart'], ['orange', 'domain of the second chart'], ['green', 'overlap arcs and their transition pieces'], ['gold', '$p$', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { ci, cj, a, b, d, np, shifts, inO } = info;
          const f = (x) => (Number.isFinite(x) ? minus(v.fix(x, 4)) : '—');
          let s = `$\\theta=${minus(v.fix(wrap(info.tp), 3))}$: $${ci.nm}=${f(a)}$ in chart ${ci.name}, $${cj.nm}=${f(b)}$ in chart ${cj.name}`;
          s += inO ? `, derivative of the transition map $=${f(d)}$ (finite difference).` : ci.dom(info.tp) && cj.dom(info.tp) ? '.' : ' — $p$ is outside at least one of the two charts.';
          s += `\nThe overlap has **${np}** arc${np === 1 ? '' : 's'}${np === 0 ? ' — the transition map is empty (vacuously smooth)' : ''}`;
          if (atlas.value === 'ang' && np === 2) s += `; the transition map is $t\\mapsto t$ on one and $t\\mapsto t-2\\pi$ on the other (shifts ${shifts.map((x) => minus(v.fix(x / TAU, 0)) + '\\cdot2\\pi').map((x) => '$' + x + '$').join(', ')}): smooth on each, jump $2\\pi$ between.`;
          else s += '.';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Smooth structures and smooth manifolds',
      statement: String.raw`A **smooth structure** on a topological $n$-manifold $M$ is a *maximal* smooth atlas: one containing every chart that is smoothly compatible with all of its charts. Every smooth atlas lies in a unique maximal one, so it suffices to give any atlas. A **smooth manifold** is a topological manifold together with a smooth structure. Different atlases may generate the same structure or different ones: on $\R$ the atlas $\{x\}$ and the atlas $\{x^3\}$ each consist of one global chart, hence are smooth, but they are **not** compatible, so they define two different smooth structures. (They are diffeomorphic: $p\mapsto p^3$ is a diffeomorphism between them.)`,
      idea: String.raw`The word "smooth" has no meaning on a bare topological space; it is *created* by the atlas. Two atlases are compatible when their union is still an atlas, i.e. all the cross transition maps are smooth. For $\{x\}$ and $\{x^3\}$ the cross transition maps are $w\mapsto w^{1/3}$ and $u\mapsto u^3$; the second is smooth but the first has a vertical tangent at $0$, so the union is not a smooth atlas. The consequence is concrete: the function $p\mapsto p$ is smooth for the structure of $\{x\}$ but not for that of $\{x^3\}$, because in the chart $w=p^3$ it reads $w^{1/3}$. Yet nothing is lost: the map $F(p)=p^3$ from $(\R,\{x^3\})$ to $(\R,\{x\})$ is the identity in coordinates, so the two structures are diffeomorphic. (In dimension $n\ne4$ every $\R^n$ has a unique smooth structure up to diffeomorphism; $\R^4$ has uncountably many.)`,
      caption: String.raw`Drag $p$ on the line: the top row shows the grid of the standard chart $u=p$ above the axis and of the cube chart $w=p^3$ below it — the second is not uniform. Middle: the two transition maps and the difference quotient of each at $0$ as the step $h$ shrinks (log–log): for $w\mapsto w^{1/3}$ it blows up like $h^{-2/3}$, for $u\mapsto u^3$ it tends to $0$. Choose a test function $f$ to see its representatives in the two charts and whether each is differentiable at $0$.`,
      deps: ['mfd-1.1'],
      refs: ['Lee SM Ch. 1'],
      credit: 'Hassler Whitney, 1936 (maximal atlas); Clifford Taubes, 1987 (uncountably many smooth structures on ℝ⁴)',
      tags: ['smooth structure', 'atlas'],
      viz(v) {
        const fsel = v.select('test function $f$', [{ value: 'p', label: '$f=p$' }, { value: 'p2', label: '$f=p^2$' }, { value: 'p3', label: '$f=p^3$' }, { value: 'cr', label: '$f=\\sqrt[3]{p}$' }], 'p');
        const hsl = v.slider('step $h$', 1e-8, 1, 0.01, { log: true, sig: 2 });
        const A = v.stage({ x: [-2.1, 2.1], y: [-0.55, 0.55], axes: false, height: 190, full: true, title: 'the manifold $\\mathbb R$ with two coordinate grids' });
        const T = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 300, title: 'transition maps', weight: 1, minWidth: 220 });
        const Q = v.stage({ x: [1e-8, 1], y: [1e-17, 1e6], xlog: true, ylog: true, axes: 'box', gutter: true, height: 300, title: 'difference quotient at 0', xlabel: 'h', ylabel: '|ψ(h) − ψ(0)| / h', weight: 1, minWidth: 220 });
        const Fu = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 300, title: '$f$ in the chart $u$', weight: 1, minWidth: 220 });
        const Fw = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 300, title: '$f$ in the chart $w=p^3$', weight: 1, minWidth: 220 });
        const P = A.handle(0.7, 0, { color: 'gold', label: 'p', constrain: (x) => [clamp(x, -2.0, 2.0), 0] });
        const FN = { p: (x) => x, p2: (x) => x * x, p3: (x) => x * x * x, cr: (x) => Math.cbrt(x) };
        const dq = (f, h) => Math.abs(f(h) - f(0)) / h; // one-sided at 0
        let st = null;
        v.render(() => {
          const p = P.x, f = FN[fsel.value];
          // coordinate grids on the line
          A.line(-2.1, 0, 2.1, 0, { color: 'ink', width: 2 });
          for (let k = -8; k <= 8; k += 0.5) { const x = k / 4; A.line(x, 0, x, 0.1, { color: 'accent', width: Math.abs(k % 2) < 1e-9 ? 2 : 1 }); if (Math.abs((k * 2) % 4) < 1e-9 || Math.abs(k) === 8) A.text(minus(String(x)), x, 0.2, { size: 11, color: 'accent', align: 'center' }); }
          for (let w = -8; w <= 8; w++) { const x = Math.cbrt(w); A.line(x, 0, x, -0.1, { color: 'orange', width: w % 4 === 0 ? 2 : 1 }); if (w % 4 === 0 || Math.abs(w) === 1 || Math.abs(w) === 2) A.text(minus(String(w)), x, -0.22, { size: 11, color: 'orange', align: 'center' }); }
          A.text('u = p', -2.05, 0.38, { size: 12, color: 'accent', align: 'left', weight: 600 }); A.text('w = p³', -2.05, -0.38, { size: 12, color: 'orange', align: 'left', weight: 600 });
          A.dot(p, 0, { r: 7, color: 'gold' });
          // transition maps
          T.line(-2, -2, 2, 2, { color: 'faint', width: 1, dash: [3, 4] });
          T.fn(Math.cbrt, { color: 'red', width: 2.8 });
          T.fn((x) => x * x * x, { color: 'green', width: 2.8 });
          T.text('w ↦ ∛w', 1.0, 1.45, { size: 12, color: 'red', weight: 600, plate: true }); T.text('u ↦ u³', 1.25, -1.2, { size: 12, color: 'green', weight: 600, plate: true });
          T.dot(p * p * p, p, { r: 6, color: 'red' }); T.dot(p, p * p * p, { r: 6, color: 'green' });
          // difference quotients
          const hs = []; for (let k = 0; k <= 160; k++) hs.push(Math.pow(10, -8 + (8 * k) / 160));
          Q.path(hs.map((h) => [h, dq(Math.cbrt, h)]), { color: 'red', width: 2.8 });
          Q.path(hs.map((h) => [h, dq((x) => x * x * x, h)]), { color: 'green', width: 2.8 });
          Q.vline(hsl.value, { color: 'gold', width: 1.5 });
          Q.dot(hsl.value, dq(Math.cbrt, hsl.value), { r: 5, color: 'red' }); Q.dot(hsl.value, dq((x) => x * x * x, hsl.value), { r: 5, color: 'green' });
          Q.tex('h^{-2/3}', 1e-5, 1e5, { color: 'red', size: 14 }); Q.tex('h^{2}', 1e-4, 1e-8, { color: 'green', size: 14 });
          // f in both charts
          const fu = f, fw = (w) => f(Math.cbrt(w));
          Fu.fn(fu, { color: 'accent', width: 2.8 }); Fw.fn(fw, { color: 'orange', width: 2.8 });
          Fu.dot(p, fu(p), { r: 6, color: 'gold' }); Fw.dot(p * p * p, fw(p * p * p), { r: 6, color: 'gold' });
          const bad = (g) => { const q1 = dq(g, 1e-4), q2 = dq(g, 1e-8); return q2 > 3 * q1 + 1e-9; };
          st = { bu: bad(fu), bw: bad(fw), q1: dq(Math.cbrt, hsl.value), q2: dq((x) => x * x * x, hsl.value) };
        });
        v.legend([['accent', 'standard chart $u$'], ['orange', 'cube chart $w=p^3$'], ['red', 'transition $w\\mapsto u$ (not smooth)'], ['green', 'transition $u\\mapsto w$ (smooth)'], ['gold', '$p$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => v.fmt(x, 3);
          return `At $h=${v.sci(hsl.value, 2)}$: quotient of $w\\mapsto w^{1/3}$ is $${f(st.q1)}$ (diverges as $h\\to0$), of $u\\mapsto u^3$ is $${f(st.q2)}$ (tends to $0$). So the union of the two atlases is **not** a smooth atlas: they are different smooth structures.\nThe test function is ${st.bu ? '**not differentiable at 0**' : 'differentiable at 0'} in the chart $u$ and ${st.bw ? '**not differentiable at 0**' : 'differentiable at 0'} in the chart $w$ — so it is ${!st.bu && !st.bw ? 'smooth for both structures' : !st.bu ? 'smooth for $\\{x\\}$ only' : st.bw ? 'smooth for neither' : 'smooth for $\\{x^3\\}$ only'} (difference-quotient test at $h=10^{-4},10^{-8}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Proposition',
      name: 'Spheres as smooth manifolds',
      statement: String.raw`For $n\ge1$ the unit sphere $S^n\subset\R^{n+1}$ is a smooth $n$-manifold. An atlas is given by the two **stereographic charts** $\sigma_N\colon S^n\setminus\{N\}\to\R^n$, $\sigma_N(x,z)=x/(1-z)$, and $\sigma_S\colon S^n\setminus\{S\}\to\R^n$, $\sigma_S(x,z)=x/(1+z)$, where $N=(0,1)$, $S=(0,-1)$. Their transition map on the overlap $\R^n\setminus\{0\}$ is the **inversion** $\sigma_S\circ\sigma_N^{-1}(u)=u/|u|^2$, which is smooth and is its own inverse.`,
      idea: String.raw`Draw the line from $N$ through $u\in\R^n\times\{0\}$: it meets the sphere in a second point $\sigma_N^{-1}(u)=\big(2u,\ |u|^2-1\big)/(|u|^2+1)$. Feeding this into $\sigma_S$ gives $u/|u|^2$: the point of the equatorial plane seen from the south pole is the inversion of the one seen from the north pole. Each chart is a homeomorphism onto $\R^n$ (explicit formulas, continuous both ways), they cover the sphere since each misses only one pole, and the transition map is a rational function with non-vanishing denominator on $\R^n\setminus\{0\}$, hence smooth with smooth inverse (itself).`,
      caption: String.raw`Drag $u$ in the first panel (chart $N$); the sphere shows the point $p=\sigma_N^{-1}(u)$ and the two projection lines, from $N$ (blue) and from $S$ (orange). The middle panel is chart $S$ with the images of the same polar grid: circles go to circles ($|u|\mapsto1/|u|$), rays stay rays. The readout computes $\sigma_S(p)$ through the sphere, compares it with $u/|u|^2$ (the error is round-off), and checks that the Jacobian of the transition map has determinant $-1/|u|^4$. Put $u$ at the origin: $p=S$ is not in chart $S$.`,
      deps: ['mfd-1.2', 'top-2.5'],
      refs: ['Lee SM Ch. 1'],
      tags: ['sphere', 'stereographic projection'],
      viz(v) {
        const CN = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 340, title: 'chart $N$ (from the north pole)' });
        const CS = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 340, title: 'chart $S$ (from the south pole)' });
        const S3 = v.stage3d({ range: 1.5, height: 400, yaw: -0.7, pitch: 0.4, axes: false, full: true });
        const H = CN.handle(0.9, 0.55, { color: 'gold', label: 'u', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 2.5 ? [(2.5 * x) / r, (2.5 * y) / r] : [x, y]; } });
        const rings = [0.35, 0.6, 1, 1.6, 2.4], rays = 16;
        const ringCol = ['purple', 'teal', 'green', 'orange', 'red'];
        let st = null;
        v.render(() => {
          const u = [H.x, H.y], r = Math.hypot(...u);
          const toS = (q) => stS(stNinv(q)); // composite through the sphere
          // chart N: polar grid
          rings.forEach((R, k) => CN.circle(0, 0, R, { color: ringCol[k], width: R === 1 ? 2.2 : 1.2, alpha: 0.85 }));
          for (let k = 0; k < rays; k++) { const a = (TAU * k) / rays; CN.line(0.05 * Math.cos(a), 0.05 * Math.sin(a), 2.6 * Math.cos(a), 2.6 * Math.sin(a), { color: 'muted', width: 0.8, alpha: 0.55 }); }
          CN.dot(0, 0, { r: 4, hollow: true, color: 'ink' });
          // chart S: the same grid pushed through the sphere
          rings.forEach((R, k) => { const pts = []; for (let i = 0; i <= 160; i++) { const a = (TAU * i) / 160; pts.push(toS([R * Math.cos(a), R * Math.sin(a)])); } CS.path(pts, { color: ringCol[k], width: R === 1 ? 2.2 : 1.2, alpha: 0.85 }); });
          for (let k = 0; k < rays; k++) { const a = (TAU * k) / rays, pts = []; for (let i = 1; i <= 120; i++) { const rr = 0.02 + (i / 120) * 4.0; pts.push(toS([rr * Math.cos(a), rr * Math.sin(a)])); } CS.path(pts, { color: 'muted', width: 0.8, alpha: 0.55 }); }
          // sphere
          S3.surface((a, b) => [Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a), Math.cos(b)], [0, TAU], [0.001, PI - 0.001], { nu: 48, nv: 26, alpha: 0.5, colorFn: (a, b, p) => (p[2] < 0 ? 'teal' : 'gold') });
          rings.forEach((R, k) => S3.curve((a) => stNinv([R * Math.cos(a), R * Math.sin(a)]).map((c) => c * 1.004), 0, TAU, { n: 120, color: ringCol[k], width: R === 1 ? 2.4 : 1.4 }));
          for (let k = 0; k < rays; k++) { const a = (TAU * k) / rays; S3.curve((t) => stNinv([t * Math.cos(a), t * Math.sin(a)]).map((c) => c * 1.004), 0, 12, { n: 60, color: 'muted', width: 0.8, alpha: 0.6 }); }
          // equatorial plane square and projection lines
          S3.poly([[-1.45, -1.45, 0], [1.45, -1.45, 0], [1.45, 1.45, 0], [-1.45, 1.45, 0]], { fill: 'muted', fillAlpha: 0.06, color: 'faint', width: 0.8 });
          const p = stNinv(u), N = [0, 0, 1], Sp = [0, 0, -1];
          S3.dot(N, { r: 5, color: 'accent', label: 'N' }); S3.dot(Sp, { r: 5, color: 'orange', label: 'S' });
          const clipP = (q) => { const m = Math.max(Math.abs(q[0]), Math.abs(q[1]), 1); return [q[0] / m * 1.44, q[1] / m * 1.44, 0]; };
          S3.line(N, clipP([u[0], u[1]]), { color: 'accent', width: 1.8 });
          const us = r > 1e-9 ? [u[0] / (r * r), u[1] / (r * r)] : null;
          if (us) S3.line(Sp, clipP(us), { color: 'orange', width: 1.8 });
          S3.dot(p, { r: 7, color: 'gold', label: 'p' });
          // handle images
          if (us && Math.hypot(...us) < 2.6) CS.dot(us[0], us[1], { r: 7, color: 'gold' });
          else if (us) { const q = Math.hypot(...us); CS.arrow(0, 0, (us[0] / q) * 2.4, (us[1] / q) * 2.4, { color: 'gold', width: 2 }); }
          // checks
          let err = NaN, det = NaN, jdet = NaN;
          if (r > 1e-6) {
            const q = toS(u); err = Math.hypot(q[0] - us[0], q[1] - us[1]);
            const hh = 1e-6 * Math.max(1, r), a1 = toS([u[0] + hh, u[1]]), a2 = toS([u[0] - hh, u[1]]), b1 = toS([u[0], u[1] + hh]), b2 = toS([u[0], u[1] - hh]);
            const J = [[(a1[0] - a2[0]) / (2 * hh), (b1[0] - b2[0]) / (2 * hh)], [(a1[1] - a2[1]) / (2 * hh), (b1[1] - b2[1]) / (2 * hh)]];
            det = J[0][0] * J[1][1] - J[0][1] * J[1][0]; jdet = -1 / Math.pow(r, 4);
          }
          st = { u, r, us, err, det, jdet, p };
        });
        v.legend([['accent', 'projection from $N$'], ['orange', 'projection from $S$'], ['gold', '$p$ and its images', { dot: true }], ['teal', 'southern hemisphere = $|u|<1$ in chart $N$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x, d = 4) => minus(v.fix(x, d));
          if (!st.us) return `$u=0$: $p=S$ is the south pole, which is **not** in chart $S$ — the transition map is only defined on $\\R^2\\setminus\\{0\\}$.`;
          return `$u=(${f(st.u[0])},${f(st.u[1])})$, $|u|=${f(st.r)}$; $p=(${st.p.map((c) => f(c, 3)).join(',')})$ on $S^2$. Chart $S$ of $p$: $(${f(st.us[0])},${f(st.us[1])})=u/|u|^2$; computed through the sphere the two agree to $${v.sci(st.err, 1)}$.\n$\\det D(\\sigma_S\\circ\\sigma_N^{-1})=${f(st.det, 5)}$ against $-1/|u|^4=${f(st.jdet, 5)}$: smooth, orientation-reversing, conformal.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Proposition',
      name: 'Projective spaces as smooth manifolds',
      statement: String.raw`Real projective space $\R P^n$ (the set of lines through $0$ in $\R^{n+1}$, with homogeneous coordinates $[x_0:\dots:x_n]$) is a compact smooth $n$-manifold. The sets $U_i=\{x_i\ne0\}$ with charts $\varphi_i[x]=(x_0/x_i,\dots,\widehat{x_i/x_i},\dots,x_n/x_i)\in\R^n$ form a smooth atlas; the transition maps are rational with non-vanishing denominators. For $\R P^2$ the transition from chart $z$, $(a,b)=(x/z,y/z)$, to chart $x$ is $(a,b)\mapsto(b/a,\,1/a)$ on $a\ne0$.`,
      idea: String.raw`Dividing a vector by one of its coordinates picks the representative of the line lying in the affine hyperplane $x_i=1$, and every line not parallel to that hyperplane meets it exactly once — that is the chart. Two such hyperplanes give two representatives of the same line, and passing from one to the other is a rescaling by the ratio of coordinates, which is a rational function. In $\R P^2$ the missing set of chart $z$ is the "line at infinity" $z=0$ and the missing sets of the three charts have empty common intersection (a nonzero vector has some nonzero coordinate), so three charts cover.`,
      caption: String.raw`Drag $q$ in the disc: it is the point of $\R P^2$ whose line passes through $(q,\sqrt{1-|q|^2})$ (the disc is the upper hemisphere seen from above; antipodal points of the rim are the same line — near the rim the twin $-q$ appears). The 3D picture shows the line and where it meets the planes $x=1$, $y=1$, $z=1$; the three small panels are the affine charts. Each chart misses one line of $\R P^2$ (dashed, in the chart's colour): approach it and the coordinates run off to infinity. The readout checks the transition $z\to x$ against the formula.`,
      deps: ['mfd-1.2', 'top-2.17'],
      refs: ['Lee SM Ch. 1'],
      tags: ['projective space', 'atlas'],
      viz(v) {
        const D = v.stage({ x: [-1.28, 1.28], y: [-1.28, 1.28], equal: true, axes: false, height: 330, title: 'the projective plane: disc with antipodal rim', weight: 1, minWidth: 420 });
        const S = v.stage3d({ range: 1.7, height: 330, yaw: -0.8, pitch: 0.35, axes: false, weight: 1.2, minWidth: 420, title: 'a line through the origin' });
        const cx = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 250, title: 'chart $x$: $(y/x,\\ z/x)$', weight: 0.8, minWidth: 220 });
        const cy = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 250, title: 'chart $y$: $(x/y,\\ z/y)$', weight: 0.8, minWidth: 220 });
        const cz = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 250, title: 'chart $z$: $(x/z,\\ y/z)$', weight: 0.8, minWidth: 220 });
        const H = D.handle(0.5, 0.3, { color: 'gold', label: 'q', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 1 ? [x / r, y / r] : [x, y]; } });
        const col = ['accent', 'orange', 'green'];
        let st = null;
        v.render(() => {
          const qx = H.x, qy = H.y, z = Math.sqrt(Math.max(0, 1 - qx * qx - qy * qy)), p = [qx, qy, z];
          // disc
          D.circle(0, 0, 1, { color: 'ink', width: 1.6, fill: 'muted', fillAlpha: 0.05 });
          D.line(0, -1, 0, 1, { color: col[0], width: 2, dash: [5, 4] }); D.line(-1, 0, 1, 0, { color: col[1], width: 2, dash: [5, 4] });
          D.circle(0, 0, 1.045, { color: col[2], width: 2, dash: [5, 4] });
          D.text('x = 0', 0.02, 1.14, { size: 11, color: col[0], align: 'center' }); D.text('y = 0', 1.0, 0.07, { size: 11, color: col[1], align: 'center', dx: 12 }); D.text('z = 0 (rim)', -0.85, -1.18, { size: 11, color: col[2], align: 'center' });
          const rq = Math.hypot(qx, qy);
          if (rq > 0.93) D.dot(-qx / rq, -qy / rq, { r: 6, hollow: true, color: 'gold' });
          // 3D
          S.surface((a, b) => [Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a), Math.cos(b)], [0, TAU], [0.001, PI - 0.001], { nu: 36, nv: 18, alpha: 0.18 });
          const pl = [[[1, -1.6, -1.6], [1, 1.6, -1.6], [1, 1.6, 1.6], [1, -1.6, 1.6]], [[-1.6, 1, -1.6], [1.6, 1, -1.6], [1.6, 1, 1.6], [-1.6, 1, 1.6]], [[-1.6, -1.6, 1], [1.6, -1.6, 1], [1.6, 1.6, 1], [-1.6, 1.6, 1]]];
          pl.forEach((q, i) => S.poly(q, { fill: col[i], fillAlpha: 0.1, color: col[i], width: 1 }));
          S.line(p.map((c) => -1.8 * c), p.map((c) => 1.8 * c), { color: 'ink', width: 2.6 });
          S.dot(p, { r: 5, color: 'gold' });
          const inside = (q) => q.every((c) => Math.abs(c) <= 1.62);
          for (let i = 0; i < 3; i++) if (Math.abs(p[i]) > 1e-9) { const q = p.map((c) => c / p[i]); if (inside(q)) S.dot(q, { r: 5.5, color: col[i] }); }
          // charts
          const stages = [cx, cy, cz], idx = [[1, 2], [0, 2], [0, 1]];
          const coords = [];
          stages.forEach((s, i) => {
            const w = p[i];
            s.dot(0, 0, { r: 2.5, color: 'faint' });
            if (Math.abs(w) < 1e-9) { coords.push(null); s.text('not in this chart', 0, 0.6, { size: 12, color: 'red', align: 'center' }); return; }
            const c = [p[idx[i][0]] / w, p[idx[i][1]] / w]; coords.push(c);
            const out = Math.max(Math.abs(c[0]), Math.abs(c[1])) > 2.6;
            if (out) { const m = Math.hypot(...c); s.arrow(0, 0, (c[0] / m) * 2.5, (c[1] / m) * 2.5, { color: 'red', width: 2 }); s.text('→ ∞', (c[0] / m) * 2.1, (c[1] / m) * 2.1 + 0.3, { size: 12, color: 'red', align: 'center' }); }
            else s.dot(c[0], c[1], { r: 7, color: col[i] });
          });
          // transition z -> x:  (a,b) -> (b/a, 1/a)
          let err = NaN;
          if (coords[2] && coords[0]) { const [a, b] = coords[2]; const f = [b / a, 1 / a]; err = Math.hypot(f[0] - coords[0][0], f[1] - coords[0][1]); }
          st = { p, coords, err };
        });
        v.legend([['accent', 'chart $x$ (misses $x=0$)'], ['orange', 'chart $y$'], ['green', 'chart $z$ (misses the rim)'], ['gold', 'the point $[x:y:z]$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          const { p, coords, err } = st;
          let s = `$[x:y:z]=[${f(p[0])}:${f(p[1])}:${f(p[2])}]$. `;
          s += ['x', 'y', 'z'].map((n, i) => (coords[i] ? `chart $${n}$: $(${f(coords[i][0])},${f(coords[i][1])})$` : `chart $${n}$: undefined ($${n}=0$)`)).join('; ') + '.';
          s += Number.isFinite(err) ? `\nTransition $z\\to x$: $(a,b)\\mapsto(b/a,\\,1/a)$ reproduces the chart-$x$ coordinates ${err < 1e-12 ? 'to round-off ($<10^{-12}$)' : `to $${v.sci(err, 1)}$`}.` : '\nThe point lies outside chart $x$ or chart $z$, so that transition is not defined here.';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Proposition',
      name: 'Grassmannians',
      statement: String.raw`The set $G_k(\R^n)$ of $k$-dimensional linear subspaces of $\R^n$ is a smooth manifold of dimension $k(n-k)$. For a choice $I$ of $k$ coordinate directions, the subspaces $W$ that are graphs over the coordinate $k$-plane $\R^I$, i.e. $W=\{(x,Ax)\}$ for a unique linear map $A\colon\R^I\to\R^{I^c}$, form a chart domain $U_I$ with chart $W\mapsto A\in\R^{k(n-k)}$ (a $(n-k)\times k$ matrix); these charts are smoothly compatible. For $G_2(\R^3)$ the chart over the $xy$-plane is $z=ax+by$, $(a,b)\in\R^2$, and the transition to the chart over the $yz$-plane, $x=cy+dz$, is $(c,d)=(-b/a,\ 1/a)$.`,
      idea: String.raw`A subspace that is not "vertical" with respect to the chosen coordinate plane is a graph over it, and the matrix of that graph is a perfectly good coordinate. A subspace is a graph over $\R^I$ exactly when it meets the complement $\R^{I^c}$ only in $0$ — an open condition. Changing the coordinate plane means re-solving the equations of the subspace for different unknowns: Cramer's rule, so rational with non-vanishing denominators. For $G_2(\R^3)$ a plane is determined by its normal line, so $G_2(\R^3)\cong\R P^2$, and the three graph charts are the three charts of 1.4 in disguise: plane $\{n\cdot x=0\}$, chart $xy$ is defined iff $n_z\ne0$.`,
      caption: String.raw`Drag the tip of the normal $n$ (gold) on the unit sphere; the plane $n^\perp$ tilts. Its chart coordinates in the three graph charts appear in the panels below: $(a,b)$ with $z=ax+by$, etc. Choose which chart's graph patch to draw in 3D (the green square over the coordinate plane): it lies in the plane as long as the chart is defined, and tilts away to infinity as the plane approaches a position containing the chart's missing axis — then a second chart is needed.`,
      deps: ['mfd-1.2'],
      refs: ['Lee SM Ch. 1'],
      tags: ['Grassmannian', 'atlas'],
      viz(v) {
        const M = v.M;
        const chartSel = v.select('graph patch over', [{ value: '2', label: '$xy$-plane (chart $z$)' }, { value: '0', label: '$yz$-plane (chart $x$)' }, { value: '1', label: '$xz$-plane (chart $y$)' }], '2');
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.3, 1.3], equal: true, axes: false, height: 400, full: true });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.32, axis: 1.25, lim: 1.3, labels: ['x', 'y', 'z'] });
        const cs = [0, 1, 2].map((i) => v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 230, minWidth: 220, weight: 0.8, title: ['chart over $yz$: $x=cy+dz$', 'chart over $xz$: $y=ex+fz$', 'chart over $xy$: $z=ax+by$'][i] }));
        const Hn = sc.handle(M.normalize([0.35, 0.3, 0.85]), { color: 'gold', label: 'n', snap: (q) => M.normalize(q), lim: 1.3 });
        const col = ['accent', 'orange', 'green'];
        let st = null;
        v.render(() => {
          const n = Hn.p, k = +chartSel.value;
          const e = Math.abs(n[0]) < 0.6 ? [1, 0, 0] : [0, 1, 0];
          const a = M.normalize(M.cross3(n, e)), b = M.cross3(n, a);
          sc.begin();
          sc.disc(a, b, 1.25, { fill: 'purple', fillAlpha: 0.14, grid: true });
          // chart plane patch: the graph over the coordinate plane omitting axis k, over the square [-1,1]^2
          const ids = [0, 1, 2].filter((i) => i !== k);
          if (Math.abs(n[k]) > 1e-3) {
            const coef = ids.map((i) => -n[i] / n[k]);
            const pt = (s, t) => { const q = [0, 0, 0]; q[ids[0]] = s; q[ids[1]] = t; q[k] = coef[0] * s + coef[1] * t; return q; };
            const sq = [pt(-0.9, -0.9), pt(0.9, -0.9), pt(0.9, 0.9), pt(-0.9, 0.9)];
            if (sq.every((q) => Math.hypot(...q) < 3.2)) sc.poly(sq, { fill: col[k], fillAlpha: 0.22, color: col[k], width: 1.4 });
            // the base square in the coordinate plane
            const base = [pt(-0.9, -0.9), pt(0.9, -0.9), pt(0.9, 0.9), pt(-0.9, 0.9)].map((q) => { const r = q.slice(); r[k] = 0; return r; });
            sc.poly(base, { fill: 'muted', fillAlpha: 0.06, color: 'faint', width: 0.8 });
            sq.forEach((q, i) => sc.line(q, base[i], { color: col[k], width: 0.8, alpha: 0.5 }));
          }
          sc.arrow([0, 0, 0], n, { color: 'gold', width: 2.2 });
          sc.flush();
          // chart coordinates
          const co = [0, 1, 2].map((kk) => (Math.abs(n[kk]) < 1e-9 ? null : [0, 1, 2].filter((i) => i !== kk).map((i) => -n[i] / n[kk])));
          cs.forEach((s, i) => {
            const c = co[i];
            if (!c) { s.text('plane contains this axis:', 0, 0.9, { size: 12, color: 'red', align: 'center' }); s.text('not in this chart', 0, 0.4, { size: 12, color: 'red', align: 'center' }); return; }
            const out = Math.max(Math.abs(c[0]), Math.abs(c[1])) > 2.6;
            if (out) { const m = Math.hypot(...c); s.arrow(0, 0, (c[0] / m) * 2.5, (c[1] / m) * 2.5, { color: 'red', width: 2 }); s.text('→ ∞', (c[0] / m) * 2.1, (c[1] / m) * 2.1 + 0.35, { size: 12, color: 'red', align: 'center' }); }
            else s.dot(c[0], c[1], { r: 7, color: col[i] });
          });
          // transition: chart over xy (a,b) -> chart over yz (c,d) = (-b/a, 1/a)
          let err = NaN;
          if (co[2] && co[0]) { const [A, B] = co[2]; err = Math.hypot(-B / A - co[0][0], 1 / A - co[0][1]); }
          // check the graph really is the plane
          let res = NaN;
          if (co[2]) { const [A, B] = co[2]; const q = [0.7, -0.4, A * 0.7 + B * -0.4]; res = Math.abs(M.dot(n, q)); }
          st = { co, err, res };
        });
        v.legend([['gold', 'normal $n$ (a point of $G_2(\\mathbb R^3)\\cong\\mathbb RP^2$)'], ['purple', 'the plane $W=n^\\perp$', { area: true }], ['green', 'graph patch of the chosen chart', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          const names = ['(c,d)', '(e,f)', '(a,b)'];
          const parts = [2, 0, 1].map((i) => (st.co[i] ? `$${names[i]}=(${f(st.co[i][0])},${f(st.co[i][1])})$` : `$${names[i]}$ undefined`));
          let s = `Chart coordinates of $W$ — over $xy$: ${parts[0]}; over $yz$: ${parts[1]}; over $xz$: ${parts[2]}.`;
          if (Number.isFinite(st.err)) s += `\nTransition $(a,b)\\mapsto(-b/a,\\,1/a)$ matches the $yz$-chart coordinates ${st.err < 1e-12 ? 'to round-off ($<10^{-12}$)' : `to $${v.sci(st.err, 1)}$`}; the graph $z=ax+by$ lies in $W$ (residual ${st.res < 1e-12 ? '$<10^{-12}$' : `$${v.sci(st.res, 1)}$`}).`;
          else s += '\nThe plane contains the $z$-axis (or the $x$-axis): one of the two charts is undefined here.';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Product manifolds and the n-torus',
      statement: String.raw`If $M$ and $N$ are smooth manifolds of dimensions $m,n$, the product $M\times N$ is a smooth $(m+n)$-manifold with the **product charts** $(U\times V,\ \varphi\times\psi)$, $(U,\varphi)$ and $(V,\psi)$ charts of the atlases. Transition maps of the product atlas are products of the transition maps of the factors: $(\psi'\circ\psi^{-1})\times(\chi'\circ\chi^{-1})$. The **$n$-torus** is $T^n=S^1\times\dots\times S^1$ ($n$ factors), a compact smooth $n$-manifold; with the two angle charts on each factor it has $2^n$ product charts.`,
      idea: String.raw`A product of homeomorphisms onto open sets is a homeomorphism onto an open set, so product charts are charts; and the transition map between two product charts acts coordinatewise, so it is smooth exactly because each factor's transition map is. The overlap of two product charts is the product of the overlaps — for the torus with the angle charts of 1.1 this is a union of $2^n$ boxes, on each of which the transition map is a translation by a vector with entries in $\{0,-2\pi\}$. Smoothness of the product structure costs nothing.`,
      caption: String.raw`Drag the point in the square $(t_1,t_2)\in(0,2\pi)^2$ (chart $A\times A$); it appears on the torus. Pick another product chart: its two cut circles (red) are drawn on the torus and cut the square into rectangles, each labelled with the translation that is the transition map there, and each given its own colour on the surface. The grid on the torus is the coordinate grid of the chosen chart.`,
      deps: ['mfd-1.2'],
      refs: ['Lee SM Ch. 1'],
      tags: ['product manifold', 'torus'],
      viz(v) {
        const sel = v.select('product chart', [{ value: 'AA', label: '$A\\times A$' }, { value: 'AB', label: '$A\\times B$' }, { value: 'BA', label: '$B\\times A$' }, { value: 'BB', label: '$B\\times B$' }], 'BB');
        const Q = v.stage({ x: [0, TAU], y: [0, TAU], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 't₁ (chart A of the first circle)', ylabel: 't₂', title: 'the overlap with the chart $A\\times A$', weight: 1,
          xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], yticks: [[0, '0'], [PI, 'π'], [TAU, '2π']] });
        const T = v.stage3d({ range: 1.75, height: 380, yaw: -0.8, pitch: 0.7, axes: false, weight: 1.15 });
        const H = Q.handle(1.1, 2.3, { color: 'gold', label: 'p', constrain: (x, y) => [clamp(x, 0.05, TAU - 0.05), clamp(y, 0.05, TAU - 0.05)] });
        const cutOf = (c) => (c === 'A' ? 0 : PI); // B misses θ = π
        const palette = ['green', 'orange', 'purple', 'pink'];
        const coord = (c, th) => (c === 'A' ? wrap(th) : wrap(th + PI) - PI);
        v.render(() => {
          const [c1, c2] = sel.value.split('');
          const k1 = cutOf(c1), k2 = cutOf(c2);
          // squares: pieces of the overlap in (t1, t2) coordinates
          const cuts1 = c1 === 'A' ? [0, TAU] : [0, PI, TAU], cuts2 = c2 === 'A' ? [0, TAU] : [0, PI, TAU];
          let q = 0; const pieceOf = (t1, t2) => (c1 === 'B' && t1 > PI ? 1 : 0) + (c2 === 'B' && t2 > PI ? 2 : 0);
          for (let i = 0; i + 1 < cuts1.length; i++) for (let j = 0; j + 1 < cuts2.length; j++) {
            const x0 = cuts1[i], x1 = cuts1[i + 1], y0 = cuts2[j], y1 = cuts2[j + 1], pc = pieceOf((x0 + x1) / 2, (y0 + y1) / 2);
            Q.rect(x0, y0, x1, y1, { fill: palette[pc], fillAlpha: 0.22, color: palette[pc], width: 1 });
            const s1 = c1 === 'B' && x0 >= PI ? '−2π' : '', s2 = c2 === 'B' && y0 >= PI ? '−2π' : '';
            Q.text(`(t₁${s1 ? ' ' + s1 : ''}, t₂${s2 ? ' ' + s2 : ''})`, x0 + 0.12, y1 - 0.3, { size: 12, color: 'ink', align: 'left', plate: true });
          }
          if (c1 === 'B') Q.vline(PI, { color: 'red', width: 2, dash: [5, 4] });
          if (c2 === 'B') Q.hline(PI, { color: 'red', width: 2, dash: [5, 4] });
          [0, TAU].forEach((e) => { Q.vline(e, { color: 'red', width: 2, dash: [5, 4] }); Q.hline(e, { color: 'red', width: 2, dash: [5, 4] }); });
          // torus coloured by piece; chart grid
          const R = 1, r = 0.45;
          T.surface((a, b) => torusPt(a, b, R, r), [0, TAU], [0, TAU], { nu: 72, nv: 36, alpha: 0.96, wire: false,
            colorFn: (a, b) => v.rgb(palette[pieceOf(wrap(a), wrap(b))]).slice(0, 3).map((x) => x) });
          for (let k = 1; k < 12; k++) {
            const t = (TAU * k) / 12;
            const th1 = c1 === 'A' ? t : t - PI, th2 = c2 === 'A' ? t : t - PI; // coordinate value → angle
            T.curve((b) => torusPt(th1, b, R, r * 1.01), 0, TAU, { n: 60, color: 'ink', width: 0.9, alpha: 0.55 });
            T.curve((a) => torusPt(a, th2, R, r * 1.01), 0, TAU, { n: 90, color: 'ink', width: 0.9, alpha: 0.55 });
          }
          [[k1, null], [null, k2]].forEach(([a, b]) => {
            if (a !== null) T.curve((t) => torusPt(a, t, R, r * 1.02), 0, TAU, { n: 60, color: 'red', width: 3.2 });
            if (b !== null) T.curve((t) => torusPt(t, b, R, r * 1.02), 0, TAU, { n: 90, color: 'red', width: 3.2 });
          });
          T.dot(torusPt(H.x, H.y, R, r * 1.04), { r: 7, color: 'gold', label: 'p' });
        });
        v.legend([['green', 'piece with shift $(0,0)$', { area: true }], ['orange', 'shift $(-2\\pi,0)$', { area: true }], ['purple', 'shift $(0,-2\\pi)$', { area: true }], ['pink', 'shift $(-2\\pi,-2\\pi)$', { area: true }], ['red', 'cut circles of the chosen chart']]);
        v.readout(() => {
          const [c1, c2] = sel.value.split(''), t1 = H.x, t2 = H.y;
          const s1 = coord(c1, t1), s2 = coord(c2, t2);
          const f = (x) => minus(v.fix(Math.abs(x) < 5e-4 ? 0 : x, 3));
          return `$p=(t_1,t_2)=(${f(t1)},${f(t2)})$ in $A\\times A$ and $(${f(s1)},${f(s2)})$ in $${c1}\\times ${c2}$: the transition map is a translation by $(${f(s1 - t1)},${f(s2 - t2)})$ on this piece, its Jacobian is the identity matrix.\nThe $n$-torus $T^n$ has dimension $n$ and $2^n$ product charts (here $n=2$: 4); every transition map is a coordinatewise product of circle transition maps, hence smooth.`;
        });
      },
    },
  ],
};
