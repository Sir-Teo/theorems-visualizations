// Topology — Chapter 2 (part c): items 2.16–2.22 — attaching, projective space, non-Hausdorff quotients, manifolds,
// topological groups, orbit spaces and the uniform limit theorem
import { folded, squarePaint } from './ch02.shared.js';

const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mod = (x, m) => ((x % m) + m) % m;
/** Theme colour cycling with the angle (four palette colours blended), as [r, g, b]. */
function wheel(v) {
  const C = ['blue', 'teal', 'gold', 'pink'].map((c) => v.rgb(c));
  return (a) => { const x = mod(a / TAU, 1) * 4, k = Math.floor(x), f = x - k, p = C[k % 4], q = C[(k + 1) % 4]; return [0, 1, 2].map((i) => p[i] + f * (q[i] - p[i])); };
}
const rgbStr = (c) => `rgb(${c.map((x) => Math.round(x)).join(',')})`;
/** Marching squares of F on a small sphere about p (radius r): link segments, grouped into connected components. */
function linkOf(F, p, r, NT = 36, NP = 72) {
  const S = (i, j) => { const th = (Math.PI * i) / NT, ph = (TAU * j) / NP; return [p[0] + r * Math.sin(th) * Math.cos(ph), p[1] + r * Math.sin(th) * Math.sin(ph), p[2] + r * Math.cos(th)]; };
  const val = []; for (let i = 0; i <= NT; i++) { val.push([]); for (let j = 0; j < NP; j++) val[i].push(F(S(i, j))); }
  const V = (i, j) => val[i][mod(j, NP)], P = (i, j) => S(i, mod(j, NP));
  const cross = (a, b, pa, pb) => { const t = a / (a - b); return pa.map((c, k) => c + t * (pb[k] - c)); };
  const segs = [];
  for (let i = 0; i < NT; i++) for (let j = 0; j < NP; j++) {
    const c = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], v = c.map(([a, b]) => V(a, b));
    const ids = [`v${i},${mod(j, NP)}`, `h${i + 1},${mod(j, NP)}`, `v${i},${mod(j + 1, NP)}`, `h${i},${mod(j, NP)}`];
    const hits = [];
    for (let e = 0; e < 4; e++) { const a = v[e], b = v[(e + 1) % 4]; if ((a < 0) !== (b < 0)) hits.push({ id: (i === 0 && e === 3) ? 'pole0' : (i + 1 === NT && e === 1) ? 'pole1' : ids[e], p: cross(a, b, P(...c[e]), P(...c[(e + 1) % 4])) }); }
    if (hits.length === 2) segs.push([hits[0], hits[1]]);
    else if (hits.length === 4) { const m = v.reduce((s, x) => s + x, 0) / 4; if ((m < 0) === (v[0] < 0)) { segs.push([hits[0], hits[1]]); segs.push([hits[2], hits[3]]); } else { segs.push([hits[0], hits[3]]); segs.push([hits[1], hits[2]]); } }
  }
  const par = new Map(), find = (x) => { while (par.get(x) !== x) { par.set(x, par.get(par.get(x))); x = par.get(x); } return x; };
  for (const [a, b] of segs) { for (const h of [a, b]) if (!par.has(h.id)) par.set(h.id, h.id); par.set(find(a.id), find(b.id)); }
  const comps = new Map();
  for (const s of segs) { const k = find(s[0].id); if (!comps.has(k)) comps.set(k, []); comps.get(k).push(s); }
  return [...comps.values()].filter((c) => c.length >= 3);
}

export default {
  collection: 'top',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.16
    {
      num: '2.16',
      kind: 'Definition',
      name: 'Attaching spaces along maps',
      statement: String.raw`Let $X$ and $Y$ be spaces, $A\subset Y$ closed, and $f\colon A\to X$ continuous. The space obtained by **attaching $Y$ to $X$ along $f$** is
$$X\cup_f Y=(X\sqcup Y)/(a\sim f(a)\text{ for } a\in A).$$
Attaching an $n$-cell means $Y=D^n$, $A=\partial D^n=S^{n-1}$; cell complexes are built this way. For $X=S^1$ and $f_n(z)=z^n$ on $\partial D^2$: $n=\pm1$ gives the disc, $n=\pm2$ the projective plane, $n=0$ the wedge $S^2\vee S^1$, and general $n$ a space with $H_1\cong\Z/\abs n$.`,
      idea: String.raw`Points of $X$ and of $Y\setminus A$ survive unchanged; each point $a\in\partial Y$ is identified with its image, so the fibre of the quotient over $x\in X$ is $\{x\}\cup f^{-1}(x)$ — for $z\mapsto z^n$, the $\abs n$ points $e^{i(\theta+2\pi k)/n}$ of the boundary circle all land on $e^{i\theta}$. The cellular chain complex $\Z\xrightarrow{\ n\ }\Z\xrightarrow{\ 0\ }\Z$ (one cell in each dimension, the 2-cell's boundary running $n$ times around the 1-cell) gives $H_1=\Z/n$, and $H_2=\Z$ only when $n=0$; the degree $n$ is the winding number of the attaching map.`,
      caption: String.raw`Left: the 2-cell $D^2$, its boundary coloured by angle. Right: the circle $X=S^1$ with the boundary of the disc wound onto it by $z\mapsto z^n$ (drawn as a spiral that lands on the circle, $\abs n$ turns). Drag the point on the boundary of the disc: its image, and all the boundary points glued to the same point of $X$, are marked. Change $n$.`,
      deps: ['top-2.12'],
      refs: ['Hatcher Ch. 0'],
      tags: ['quotient', 'cell complexes'],
      viz(v) {
        const nn = v.slider('degree $n$', -3, 4, 2, { int: true });
        const L = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 340, title: 'the cell $D^2$' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: '$X=S^1$ and the attaching map $z\\mapsto z^n$' });
        const hp = L.handle(Math.cos(0.5), Math.sin(0.5), { color: 'ink', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        let st = null;
        v.render(() => {
          const n = nn.value, col = wheel(v), th = Math.atan2(hp.y, hp.x);
          // disc with angle-coloured boundary
          L.circle(0, 0, 1, { fill: 'faint', fillAlpha: 0.12, stroke: false });
          for (let k = 1; k < 4; k++) L.circle(0, 0, k / 4, { color: 'faint', width: 0.8 });
          for (let k = 0; k < 96; k++) { const a = (TAU * k) / 96, b = (TAU * (k + 1)) / 96; L.line(Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), { color: rgbStr(col(a)), width: 7, cap: 'butt' }); }
          // right: target circle, then the wound boundary as a spiral landing on it
          R.circle(0, 0, 1, { color: 'ink', width: 2.5 });
          const turns = Math.abs(n);
          if (n !== 0) {
            const N = 360 * turns;
            for (let k = 0; k < N; k++) {
              const a = (TAU * k) / N, b = (TAU * (k + 1)) / N; // source angle on ∂D²
              const ra = 1.12 + 0.13 * (a / TAU) * (turns > 1 ? 1 : 0), rb = 1.12 + 0.13 * (b / TAU) * (turns > 1 ? 1 : 0);
              const pa = n * a, pb = n * b;
              R.line(ra * Math.cos(pa), ra * Math.sin(pa), rb * Math.cos(pb), rb * Math.sin(pb), { color: rgbStr(col(a)), width: 5, cap: 'butt' });
            }
            // where the spiral lands: thin leaders from the wound boundary down to the circle
            for (let k = 0; k < 24 * turns; k++) { const a = (TAU * k) / (24 * turns), ra = 1.12 + 0.13 * (a / TAU) * (turns > 1 ? 1 : 0); R.line(ra * Math.cos(n * a), ra * Math.sin(n * a), Math.cos(n * a), Math.sin(n * a), { color: rgbStr(col(a)), width: 1.2, alpha: 0.8 }); }
          } else { R.dot(1, 0, { r: 7, color: rgbStr(col(0)) }); R.text('all of ∂D² ↦ 1', 1.05, 0.25, { size: 11.5, color: 'muted' }); }
          // the chosen point, its image and every boundary point with the same image
          const img = n * th;
          R.dot(Math.cos(img), Math.sin(img), { r: 6.5, color: 'ink', label: 'f(z)', labelPos: 'ne' });
          const pre = n === 0 ? [] : Array.from({ length: turns }, (_, k) => (img + TAU * k) / n);
          for (const a of pre) { L.line(0, 0, Math.cos(a), Math.sin(a), { color: 'ink', width: 1, dash: [3, 3], alpha: 0.6 }); L.dot(Math.cos(a), Math.sin(a), { r: 5.5, color: 'ink' }); }
          if (n === 0) L.circle(0, 0, 1, { color: 'ink', width: 2.5, dash: [5, 4] });
          // winding number of the attaching map, computed
          const curve = (s) => v.cx(Math.cos(TAU * n * s), Math.sin(TAU * n * s));
          const w = Math.round(v.M.winding(curve, v.cx(0, 0)));
          st = { n, w, pre: pre.length };
        });
        v.legend([['ink', 'a point of $X$ and its fibre on $\\partial D^2$', { dot: true }], ['teal', 'boundary of $D^2$, coloured by angle']]);
        v.readout(() => {
          if (!st) return '';
          const { n, w } = st, a = Math.abs(n);
          const name = a === 1 ? 'the disc $D^2$' : a === 2 ? 'the projective plane $\\R P^2$' : n === 0 ? 'the wedge $S^2\\vee S^1$' : `a pseudo-projective plane (Moore space $M(\\Z/${a},1)$)`;
          const H1 = n === 0 ? '\\Z' : a === 1 ? '0' : `\\Z/${a}`, H2 = n === 0 ? '\\Z' : '0';
          return `Winding number of the attaching map (computed): $${w}$. Each point of $X$ is glued to ${n === 0 ? '**the whole boundary circle**' : `**${a}** point${a === 1 ? '' : 's'} of $\\partial D^2$`}. Cellular chains $\\Z\\xrightarrow{\\,${n}\\,}\\Z\\xrightarrow{\\,0\\,}\\Z$: $H_1=${H1}$, $H_2=${H2}$, $\\chi=1-1+1=1$ — this is ${name}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17',
      kind: 'Definition',
      name: 'Real projective space ℝPⁿ',
      statement: String.raw`**Real projective $n$-space** $\R P^n$ is the space of lines through the origin in $\R^{n+1}$: the quotient of $\R^{n+1}\setminus\{0\}$ by $x\sim\lambda x$ ($\lambda\ne0$), equivalently of $S^n$ by the antipodal relation $x\sim-x$, equivalently of the closed upper hemisphere $D^n$ with antipodal points of its boundary $S^{n-1}$ identified. A point is written in homogeneous coordinates $[x_0:\dots:x_n]$. $\R P^n$ is a compact Hausdorff $n$-manifold, $\R P^1\cong S^1$, and $\R P^n$ is $\R P^{n-1}$ with one $n$-cell attached.`,
      idea: String.raw`Every line meets the unit sphere in two antipodal points, and if it is not horizontal exactly one of them lies in the open upper hemisphere — so the hemisphere, with only its rim doubled up, already contains every line once. The charts $U_i=\{x_i\ne0\}\to\R^n$, $[x]\mapsto(x_j/x_i)_{j\ne i}$, are homeomorphisms and show that $\R P^n$ is locally Euclidean; the horizontal lines form the "line at infinity" $\R P^{n-1}$, along which the affine coordinates blow up. The quotient map $S^n\to\R P^n$ is a 2-to-1 covering.`,
      caption: String.raw`Drag the point $p$ on the sphere: the line through $p$ and $-p$ is one point of $\R P^2$. Its representative in the upper hemisphere is green; the right panel shows it in the disc model (the hemisphere seen from above). Tip the line through the horizontal: the representative jumps to the opposite side of the rim — but those two rim points are identified, so the point of $\R P^2$ moves continuously. The readout gives the homogeneous coordinates and the affine chart $z=1$.`,
      deps: ['top-2.12'],
      refs: ['Hatcher Ch. 0'],
      tags: ['projective space', 'quotient'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.5, 1.5], equal: true, axes: false, height: 360, weight: 1.15 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.38, axes: false });
        const D = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 360, title: 'disc model: antipodal rim points glued' });
        const hp = sc.handle(M.normalize([0.55, -0.35, 0.5]), { color: 'gold', label: 'p', snap: (q) => M.normalize(q), lim: 1.2 });
        const trail = [];
        v.render(() => {
          sc.begin();
          // upper hemisphere shaded, sphere wireframe
          for (let i = 0; i < 6; i++) for (let j = 0; j < 24; j++) {
            const t0 = (Math.PI / 2) * (i / 6), t1 = (Math.PI / 2) * ((i + 1) / 6), p0 = (TAU * j) / 24, p1 = (TAU * (j + 1)) / 24;
            const P = (t, p) => [Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)];
            sc.poly([P(t0, p0), P(t1, p0), P(t1, p1), P(t0, p1)], { fill: 'green', fillAlpha: 0.07, edge: false });
          }
          for (let i = 1; i < 6; i++) { const ph = (Math.PI * i) / 6, z = Math.cos(ph), r = Math.sin(ph), c = []; for (let k = 0; k <= 64; k++) c.push([r * Math.cos((TAU * k) / 64), r * Math.sin((TAU * k) / 64), z]); sc.path(c, { color: i === 3 ? 'green' : 'muted', width: i === 3 ? 2 : 0.8, alpha: i === 3 ? 0.9 : 0.4 }); }
          for (let j = 0; j < 8; j++) { const a = (TAU * j) / 8, c = []; for (let k = 0; k <= 48; k++) { const ph = (Math.PI * k) / 48; c.push([Math.sin(ph) * Math.cos(a), Math.sin(ph) * Math.sin(a), Math.cos(ph)]); } sc.path(c, { color: 'muted', width: 0.8, alpha: 0.4 }); }
          const p = hp.p, q = p.map((c) => -c), rep = p[2] >= 0 ? p : q;
          sc.line(p.map((c) => 1.55 * c), q.map((c) => 1.55 * c), { color: 'accent', width: 2.4 }, 12);
          sc.dot(q, { r: 5.5, color: 'gold', label: '−p' });
          sc.dot(rep, { r: 11, hollow: true, color: 'green', width: 3 });
          sc.flush();
          // disc model
          D.circle(0, 0, 1, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.07 });
          for (let i = 1; i < 3; i++) D.circle(0, 0, Math.sin((Math.PI * i) / 6), { color: 'muted', width: 0.8, alpha: 0.5 });
          for (let j = 0; j < 4; j++) { const a = (Math.PI * j) / 4; D.line(Math.cos(a), Math.sin(a), -Math.cos(a), -Math.sin(a), { color: 'muted', width: 0.8, alpha: 0.4 }); }
          D.text('rim = horizontal lines = line at infinity', 0, -1.18, { size: 11, color: 'green', align: 'center' });
          trail.push([rep[0], rep[1]]); if (trail.length > 40) trail.shift();
          D.dots(trail, { r: 2, color: 'green', alpha: 0.35 });
          D.dot(rep[0], rep[1], { r: 7, color: 'green', label: '[p]', labelPos: 'ne' });
          const h = Math.hypot(rep[0], rep[1]);
          if (Math.abs(rep[2]) < 0.25 && h > 1e-6) { const u = [rep[0] / h, rep[1] / h]; D.dot(-u[0], -u[1], { r: 5.5, hollow: true, color: 'green' }); D.line(u[0], u[1], -u[0], -u[1], { color: 'green', width: 1, dash: [4, 4], alpha: 0.7 }); D.text('glued', -u[0] * 1.13, -u[1] * 1.13, { size: 11, color: 'green', align: 'center' }); }
          D.dot(0, 0, { r: 3, color: 'muted' });
        });
        v.legend([['accent', 'a line through $0$'], ['gold', '$\\pm p$ on $S^2$', { dot: true }], ['green', 'its representative in the closed upper hemisphere', { dot: true }]]);
        v.readout(() => {
          const p = hp.p, z = p[2];
          const s = Math.abs(z) > 1e-9 ? Math.sign(z) : 1, h = p.map((c) => c * s);
          const chart = Math.abs(z) > 0.02 ? `affine chart $z=1$: $(${v.fix(p[0] / z, 3)},\\ ${v.fix(p[1] / z, 3)})$` : 'the line is (almost) horizontal: it lies on the **line at infinity**, outside the chart $z\\ne0$ (coordinates blow up)';
          return `$[p]=[${v.fix(h[0], 3)}:${v.fix(h[1], 3)}:${v.fix(h[2], 3)}]=[${v.fix(-h[0], 3)}:${v.fix(-h[1], 3)}:${v.fix(-h[2], 3)}]$; ${chart}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.18
    {
      num: '2.18',
      kind: 'Proposition',
      name: 'The line with two origins',
      statement: String.raw`Let $X=\R\times\{1,2\}$ and identify $(x,1)\sim(x,2)$ for every $x\ne0$. The quotient $L$, the **line with two origins**, is locally homeomorphic to $\R$ and second countable, but it is not Hausdorff: the two origins $0_1,0_2$ cannot be separated by disjoint open sets, and the sequence $1/n$ converges to both.`,
      idea: String.raw`A saturated open set of $X$ containing $(0,1)$ contains some $(-\varepsilon,\varepsilon)\times\{1\}$, hence — by saturation — $\big((-\varepsilon,0)\cup(0,\varepsilon)\big)\times\{2\}$ too. So every neighbourhood of $0_1$ contains a punctured interval around $0$, and so does every neighbourhood of $0_2$: they always overlap in $(-m,0)\cup(0,m)$, $m=\min(\varepsilon_1,\varepsilon_2)$. Each copy $\R\times\{i\}$ maps homeomorphically onto an open subset, so $L$ is locally Euclidean — the Hausdorff axiom is a genuinely separate requirement in the definition of a manifold (2.19), and quotients of Hausdorff spaces need not be Hausdorff.`,
      caption: String.raw`Top: the two copies of $\R$, with every pair $(x,1),(x,2)$ for $x\ne0$ joined (glued). Bottom: the quotient, where the line splits only at $0$. Shrink the neighbourhoods of $0_1$ (blue) and $0_2$ (purple): their overlap (red) never disappears, and the gold terms $1/n$ lie in both. Switch on **glue the origins too** to get $\R$ back.`,
      deps: ['top-2.12', 'top-1.12'],
      refs: ['Munkres §22'],
      tags: ['quotient', 'Hausdorff', 'counterexample'],
      viz(v) {
        const e1 = v.slider('$\\varepsilon_1$', 0.02, 1.2, 0.55, { log: true });
        const e2 = v.slider('$\\varepsilon_2$', 0.02, 1.2, 0.3, { log: true });
        const glue0 = v.toggle('glue the origins too', false);
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.15, 1.6], height: 360, full: true, axes: false });
        let st = null;
        v.render(() => {
          const a = e1.value, b = e2.value, m = Math.min(a, b), G = glue0.value;
          // upstairs
          const Y1 = 1.25, Y2 = 0.75;
          for (let k = -15; k <= 15; k++) { const x = k / 10; if (k === 0 && !G) continue; S.line(x, Y1, x, Y2, { color: 'faint', width: 1, dash: [2, 3] }); }
          S.line(-1.55, Y1, 1.55, Y1, { color: 'accent', width: 2.5 }); S.line(-1.55, Y2, 1.55, Y2, { color: 'accent', width: 2.5 });
          // preimages of the two neighbourhoods (saturated, open in both copies)
          S.line(-a, Y1 + 0.06, a, Y1 + 0.06, { color: 'blue', width: 5, cap: 'butt' }); S.line(-a, Y2 + 0.06, a, Y2 + 0.06, { color: 'blue', width: 5, cap: 'butt' });
          S.line(-b, Y1 - 0.06, b, Y1 - 0.06, { color: 'purple', width: 5, cap: 'butt' }); S.line(-b, Y2 - 0.06, b, Y2 - 0.06, { color: 'purple', width: 5, cap: 'butt' });
          if (!G) { S.dot(0, Y2 + 0.06, { r: 4, hollow: true, color: 'blue' }); S.dot(0, Y1 - 0.06, { r: 4, hollow: true, color: 'purple' }); }
          S.text('ℝ × {1}', -1.58, Y1 + 0.17, { size: 11, color: 'muted' }); S.text('ℝ × {2}', -1.58, Y2 - 0.17, { size: 11, color: 'muted' });
          S.text('q⁻¹(U₁), q⁻¹(U₂): open and saturated upstairs', 1.55, Y1 + 0.22, { size: 11, color: 'muted', align: 'right' });
          // downstairs
          const Yq = -0.3;
          S.line(-1.55, Yq, -0.012, Yq, { color: 'accent', width: 3 }); S.line(0.012, Yq, 1.55, Yq, { color: 'accent', width: 3 });
          S.rect(-a, Yq, a, Yq + 0.32, { fill: 'blue', fillAlpha: 0.15, stroke: false });
          S.rect(-b, Yq - 0.32, b, Yq, { fill: 'purple', fillAlpha: 0.15, stroke: false });
          if (!G) {
            S.line(-m, Yq, m, Yq, { color: 'red', width: 7, cap: 'butt' });
            S.dot(0, Yq + 0.2, { r: 6, color: 'blue', label: '0₁', labelPos: 'n' }); S.dot(0, Yq - 0.2, { r: 6, color: 'purple', label: '0₂', labelPos: 's' });
            S.line(-0.06, Yq, 0, Yq + 0.2, { color: 'blue', width: 1.5 }); S.line(0.06, Yq, 0, Yq + 0.2, { color: 'blue', width: 1.5 });
            S.line(-0.06, Yq, 0, Yq - 0.2, { color: 'purple', width: 1.5 }); S.line(0.06, Yq, 0, Yq - 0.2, { color: 'purple', width: 1.5 });
            S.dot(0, Yq, { r: 3.5, hollow: true, color: 'accent' });
          } else S.dot(0, Yq, { r: 6, color: 'green', label: '0', labelPos: 'n' });
          // the sequence 1/n
          let out1 = 0, out2 = 0;
          for (let n = 1; n <= 40; n++) { const x = 1 / n; if (x >= a) out1++; if (x >= b) out2++; if (x < 1.55) S.dot(x, Yq, { r: n < 12 ? 3.5 : 2.2, color: 'gold' }); }
          S.text('1/n', 1.0, Yq + 0.13, { size: 11, color: 'gold' });
          S.text('U₁', -a, Yq + 0.42, { size: 12, color: 'blue', align: 'center' }); S.text('U₂', -b, Yq - 0.42, { size: 12, color: 'purple', align: 'center' });
          S.text(G ? 'the quotient is ℝ' : 'the quotient L', -1.58, Yq - 0.75, { size: 11, color: 'muted' });
          st = { a, b, m, G, out1, out2 };
        });
        v.legend([['blue', 'neighbourhood $U_1$ of $0_1$', { area: true }], ['purple', 'neighbourhood $U_2$ of $0_2$', { area: true }], ['red', '$U_1\\cap U_2$'], ['gold', '$1/n$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, G, out1, out2 } = st;
          if (G) return 'With the origins glued as well, the quotient is $\\R$ — Hausdorff, and $1/n$ has the single limit $0$.';
          return `$U_1\\cap U_2\\supset(-${v.fix(m, 3)},0)\\cup(0,${v.fix(m, 3)})\\ne\\varnothing$ for every choice of $\\varepsilon_1,\\varepsilon_2$: **$0_1$ and $0_2$ cannot be separated**. Only ${out1} term${out1 === 1 ? '' : 's'} of $1/n$ ${out1 === 1 ? 'lies' : 'lie'} outside $U_1$ and ${out2} outside $U_2$ — $1/n\\to0_1$ **and** $1/n\\to0_2$. Yet every point has a neighbourhood homeomorphic to $\\R$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.19
    {
      num: '2.19',
      kind: 'Definition',
      name: 'Topological manifold',
      statement: String.raw`A **topological $n$-manifold** is a second-countable Hausdorff space $M$ in which every point has an open neighbourhood homeomorphic to an open subset of $\R^n$ (equivalently, to $\R^n$ itself). Examples: $\R^n$, $S^n$, the torus, $\R P^n$, open subsets of manifolds, products of manifolds. The cone $\{z=\sqrt{x^2+y^2}\}$ is a 2-manifold — the tip has a disc neighbourhood, though no smooth one — while the double cone and two crossing planes are not manifolds at their singular points.`,
      idea: String.raw`Whether a point has a Euclidean neighbourhood can be read off its **link**: intersect the space with a small sphere around the point. For a surface in $\R^3$, a point has a disc neighbourhood (a cone on the link) when the link is a single circle. On a sphere or a single cone the link is one circle at every point; at the tip of the double cone it is two disjoint circles (removing the tip disconnects every small neighbourhood); on the crossing line of two planes it is two circles that meet — a figure that no small disc has. Hausdorff and second countable rule out pathologies like the line with two origins (2.18) and the long line.`,
      caption: String.raw`Choose a space and drag the point $p$ on it (it snaps to the surface); the radius sets the small sphere around $p$. The link — the surface cut by that sphere — is computed by marching squares, sheet by sheet, and drawn green when it is a single circle, red otherwise. Put $p$ on the tip of the cone, on the tip of the double cone, and on the line where the planes cross.`,
      deps: ['top-1.11', 'top-2.3'],
      refs: ['Munkres §36'],
      tags: ['manifold'],
      viz(v) {
        const M = v.M;
        const SP = {
          sphere: { label: 'sphere', sheets: [(q) => q[0] * q[0] + q[1] * q[1] + q[2] * q[2] - 1], snap: (q) => M.normalize(q), p0: [0.3, -0.5, 0.81] },
          cone: { label: 'cone', sheets: [(q) => q[2] - Math.hypot(q[0], q[1]) - 0.0], snap: (q) => { const r = Math.hypot(q[0], q[1]), t = Math.max(0, (r + q[2]) / 2), c = Math.min(t, 1.1); return r > 1e-9 ? [(q[0] / r) * c, (q[1] / r) * c, c] : [0, 0, c]; }, p0: [0, 0, 0] },
          dcone: { label: 'double cone', sheets: [(q) => q[2] - Math.hypot(q[0], q[1]), (q) => q[2] + Math.hypot(q[0], q[1])], snap: (q) => { const r = Math.hypot(q[0], q[1]), s = q[2] >= 0 ? 1 : -1, t = Math.max(0, (r + s * q[2]) / 2), c = Math.min(t, 1.1); return r > 1e-9 ? [(q[0] / r) * c, (q[1] / r) * c, s * c] : [0, 0, s * c]; }, p0: [0, 0, 0] },
          planes: { label: 'two planes', sheets: [(q) => q[2], (q) => q[0]], snap: (q) => { const c = q.map((x) => clamp(x, -1.1, 1.1)); return Math.abs(c[2]) < Math.abs(c[0]) ? [c[0], c[1], 0] : [0, c[1], c[2]]; }, p0: [0, 0.2, 0] },
        };
        const sp = v.select('space', Object.entries(SP).map(([value, o]) => ({ value, label: o.label })), 'dcone', { onChange: (k) => hp.set(SP[k].p0) });
        const rr = v.slider('radius of the small sphere', 0.12, 0.6, 0.35, { step: 0.01 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.55, 1.55], equal: true, axes: false, height: 400, full: true });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.35, axes: false });
        const hp = sc.handle([0, 0, 0], { color: 'ink', label: 'p', snap: (q) => SP[sp.value].snap(q), lim: 1.2 });
        let st = null;
        const quads = (F, [u0, u1], [w0, w1], nu, nw, st2) => {
          for (let i = 0; i < nu; i++) for (let j = 0; j < nw; j++) {
            const a = u0 + ((u1 - u0) * i) / nu, b = u0 + ((u1 - u0) * (i + 1)) / nu, c = w0 + ((w1 - w0) * j) / nw, d = w0 + ((w1 - w0) * (j + 1)) / nw;
            sc.poly([F(a, c), F(b, c), F(b, d), F(a, d)], st2);
          }
        };
        v.render(() => {
          const k = sp.value, p = hp.p, r = rr.value;
          sc.begin();
          const look = { fill: 'blue', fillAlpha: 0.13, color: 'blue', alpha: 0.16, width: 0.6 };
          if (k === 'sphere') quads((u, w) => [Math.sin(u) * Math.cos(w), Math.sin(u) * Math.sin(w), Math.cos(u)], [0, Math.PI], [0, TAU], 14, 28, look);
          if (k === 'cone' || k === 'dcone') { quads((u, w) => [u * Math.cos(w), u * Math.sin(w), u], [0, 1.1], [0, TAU], 8, 28, look); if (k === 'dcone') quads((u, w) => [u * Math.cos(w), u * Math.sin(w), -u], [0, 1.1], [0, TAU], 8, 28, { ...look, fill: 'purple', color: 'purple' }); }
          if (k === 'planes') { quads((u, w) => [u, w, 0], [-1.1, 1.1], [-1.1, 1.1], 10, 10, look); quads((u, w) => [0, w, u], [-1.1, 1.1], [-1.1, 1.1], 10, 10, { ...look, fill: 'purple', color: 'purple' }); sc.line([0, -1.1, 0], [0, 1.1, 0], { color: 'ink', width: 1.4, alpha: 0.6 }, 10); }
          // small sphere (wire) and the link, sheet by sheet
          for (let i = 1; i < 6; i++) { const ph = (Math.PI * i) / 6, c = []; for (let t = 0; t <= 40; t++) c.push([p[0] + r * Math.sin(ph) * Math.cos((TAU * t) / 40), p[1] + r * Math.sin(ph) * Math.sin((TAU * t) / 40), p[2] + r * Math.cos(ph)]); sc.path(c, { color: 'muted', width: 0.7, alpha: 0.35 }); }
          const links = SP[k].sheets.map((F) => linkOf(F, p, r));
          const comps = links.flat();
          // do links of different sheets touch? (closest pair of segment midpoints)
          let touch = false;
          if (links.length === 2 && links[0].length && links[1].length) {
            const A = links[0].flat().map((s) => s[0].p), B = links[1].flat().map((s) => s[0].p);
            let dmin = Infinity; for (const a of A) for (const b of B) dmin = Math.min(dmin, M.dist(a, b));
            touch = dmin < r * 0.12;
          }
          const circle = comps.length === 1 && !touch;
          for (const c of comps) for (const [a, b] of c) sc.line(a.p, b.p, { color: circle ? 'green' : 'red', width: 3.2, bias: -0.2 }, 1);
          sc.dot(p, { r: 5, color: 'ink' });
          sc.flush();
          st = { k, n: comps.length, touch, circle, p };
        });
        v.legend([['blue', 'the space', { area: true }], ['green', 'link = one circle: disc neighbourhood'], ['red', 'link is not a circle']]);
        v.readout(() => {
          if (!st) return '';
          const { n, touch, circle, p } = st;
          const where = `$p=(${p.map((c) => v.fix(c, 2)).join(',')})$`;
          if (n === 0) return `${where}: the small sphere misses the surface — make it smaller or move $p$ onto the surface.`;
          if (circle) return `${where}: the link is **one circle**, so a small neighbourhood of $p$ is a cone on a circle — a **disc**. ${st.k === 'cone' && Math.hypot(...p) < 0.02 ? 'Even at the tip of the cone: topologically the tip is not special.' : ''}`;
          if (touch) return `${where}: the link is **two circles crossing each other** — no disc has such a link, so $p$ has **no Euclidean neighbourhood**: the crossing line is where the union fails to be a manifold.`;
          return `${where}: the link has **${n} components**; a punctured neighbourhood of $p$ falls apart into ${n} pieces, which never happens in $\\R^2$ — **not a manifold** at $p$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.20
    {
      num: '2.20',
      kind: 'Definition',
      name: 'Topological groups',
      statement: String.raw`A **topological group** is a group $G$ with a topology in which one-point sets are closed and the map $G\times G\to G$, $(g,h)\mapsto gh^{-1}$, is continuous (equivalently, multiplication and inversion are both continuous). Examples: $(\R^n,+)$, the circle group $S^1\subset\C^\times$, $GL_n(\R)\subset\R^{n^2}$, $O(n)$, $SL_n(\R)$. Each translation $x\mapsto gx$ is a homeomorphism, so the neighbourhoods of any $g$ are exactly the translates $gU$ of neighbourhoods $U$ of $e$.`,
      idea: String.raw`In $S^1$, $gh^{-1}$ is a difference of angles; in $GL_n(\R)$ its entries are polynomials in the entries of $g$ and $h$ divided by $\det h$ (Cramer's rule), which is continuous where $\det h\ne0$. Homogeneity is the main structural consequence: the whole topology is determined by the neighbourhoods of the identity, carried around by translation. The picture tests continuity directly: perturbing $g$ and $h$ by at most $\delta$ moves $gh^{-1}$ by an amount that shrinks with $\delta$ — though near the boundary of $GL_2$ (where $\det h\to0$) the same $\delta$ moves it a lot.`,
      caption: String.raw`**Circle group**: drag $g$ and $h$; $gh^{-1}$ is green, the neighbourhood $U$ of $1$ (orange) is carried to $gU$ by translation. **$GL_2(\R)$**: each matrix is drawn as the image of the unit square (drag the columns of $g$ and $h$); $gh^{-1}$ is green. In both, the gold cloud shows $g'h'^{-1}$ for $200$ random perturbations of size $\le\delta$ — it shrinks with $\delta$. Squash $h$ toward a singular matrix and watch the cloud swell.`,
      deps: ['top-2.8', 'top-1.11'],
      refs: ['Munkres §22'],
      tags: ['topological groups'],
      viz(v) {
        const M = v.M;
        const grp = v.select('group', [{ value: 's1', label: 'circle group $S^1$' }, { value: 'gl', label: '$GL_2(\\R)$' }], 's1');
        const dl = v.slider('perturbation $\\delta$', 0.005, 0.25, 0.08, { log: true });
        const S = v.stage({ x: [-1.7, 1.7], y: [-1.45, 1.45], equal: true, axes: false, height: 380, full: true });
        const onC = (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; };
        const hg = S.handle(Math.cos(1.1), Math.sin(1.1), { color: 'blue', label: 'g', constrain: (x, y) => (grp.value === 's1' ? onC(x, y) : [x, y]) });
        const hh = S.handle(Math.cos(2.5), Math.sin(2.5), { color: 'orange', label: 'h', constrain: (x, y) => (grp.value === 's1' ? onC(x, y) : [x, y]) });
        // GL2: the columns of g and h
        const g1 = S.handle(1.25, 0.15, { color: 'blue', label: 'g e₁' }), g2 = S.handle(0.35, 1.05, { color: 'blue', label: 'g e₂' });
        const h1 = S.handle(0.95, 0.35, { color: 'orange', label: 'h e₁' }), h2 = S.handle(-0.45, 0.85, { color: 'orange', label: 'h e₂' });
        const rng = v.rng(7), noise = Array.from({ length: 200 }, () => Array.from({ length: 8 }, () => rng.uniform(-1, 1)));
        let st = null;
        const mat = (a, b) => [[a.x, b.x], [a.y, b.y]];
        const para = (A, col, alpha = 0.15, w = 2) => S.poly([[0, 0], [A[0][0], A[1][0]], [A[0][0] + A[0][1], A[1][0] + A[1][1]], [A[0][1], A[1][1]]], { fill: col, fillAlpha: alpha, color: col, width: w });
        v.render(() => {
          const s1 = grp.value === 's1', d = dl.value;
          hg.visible = hh.visible = s1; g1.visible = g2.visible = h1.visible = h2.visible = !s1;
          if (s1) {
            S.setView([-1.7, 1.7], [-1.45, 1.45]);
            const a = Math.atan2(hg.y, hg.x), b = Math.atan2(hh.y, hh.x), c = a - b;
            S.circle(0, 0, 1, { color: 'ink', width: 2 });
            const arc = (m, w, col, lw) => { const pts = []; for (let k = 0; k <= 40; k++) { const t = m - w + (2 * w * k) / 40; pts.push([Math.cos(t), Math.sin(t)]); } S.path(pts, { color: col, width: lw }); };
            arc(0, 0.35, 'orange', 8); arc(a, 0.35, 'orange', 8);
            S.dot(1, 0, { r: 5, color: 'ink', label: '1', labelPos: 'e' });
            S.text('U', 1.15, 0.32, { math: true, size: 15, color: 'orange' }); S.text('gU', 1.2 * Math.cos(a + 0.45), 1.2 * Math.sin(a + 0.45), { math: true, size: 15, color: 'orange', align: 'center' });
            // perturbation cloud
            let worst = 0; const cloud = [];
            for (const z of noise) { const cc = a + d * z[0] - (b + d * z[1]); cloud.push([Math.cos(cc), Math.sin(cc)]); worst = Math.max(worst, Math.abs(mod(cc - c + Math.PI, TAU) - Math.PI)); }
            S.dots(cloud.map(([x, y]) => [1.0 * x, 1.0 * y]), { r: 2.6, color: 'gold' });
            S.dot(Math.cos(c), Math.sin(c), { r: 7, color: 'green', label: 'gh⁻¹', labelPos: 'ne' });
            st = { s1, d, worst, c };
          } else {
            S.setView([-2.2, 2.2], [-1.25, 1.95]);
            for (let k = -4; k <= 4; k++) { S.line(k / 2, -3, k / 2, 3, { color: 'faint', width: k ? 0.6 : 1.1 }); S.line(-4, k / 2, 4, k / 2, { color: 'faint', width: k ? 0.6 : 1.1 }); }
            const G = mat(g1, g2), H = mat(h1, h2), dh = M.det(H);
            para(G, 'blue'); para(H, 'orange');
            let worst = 0, C = null;
            if (Math.abs(dh) > 1e-6) {
              C = M.matMul(G, M.inverse(H));
              const cloud = [];
              for (const z of noise) {
                const G2 = [[G[0][0] + d * z[0], G[0][1] + d * z[1]], [G[1][0] + d * z[2], G[1][1] + d * z[3]]], H2 = [[H[0][0] + d * z[4], H[0][1] + d * z[5]], [H[1][0] + d * z[6], H[1][1] + d * z[7]]];
                if (Math.abs(M.det(H2)) < 1e-9) continue;
                const C2 = M.matMul(G2, M.inverse(H2));
                cloud.push([C2[0][0], C2[1][0]], [C2[0][1], C2[1][1]]);
                worst = Math.max(worst, Math.hypot(C2[0][0] - C[0][0], C2[0][1] - C[0][1], C2[1][0] - C[1][0], C2[1][1] - C[1][1]));
              }
              para(C, 'green', 0.18, 2.6);
              S.dots(cloud, { r: 2, color: 'gold', alpha: 0.8 });
              S.dot(C[0][0], C[1][0], { r: 5, color: 'green', label: 'gh⁻¹e₁' }); S.dot(C[0][1], C[1][1], { r: 5, color: 'green', label: 'gh⁻¹e₂' });
            } else S.corner('det h = 0: h is not in GL₂', 'tl', { color: 'red', weight: 600 });
            S.dot(0, 0, { r: 3, color: 'ink' });
            st = { s1, d, worst, C, dh, dg: M.det(G) };
          }
        });
        v.legend([['blue', '$g$'], ['orange', '$h$ (and $U$, $gU$)'], ['green', '$gh^{-1}$'], ['gold', '$g\'h\'^{-1}$ for perturbed $g\', h\'$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.s1) return `$gh^{-1}=e^{i(${v.fix(st.c, 3)})}$. Perturbing $g,h$ by angles $\\le\\delta=${v.fix(st.d, 3)}$ moves $gh^{-1}$ by at most $${v.fix(st.worst, 3)}\\le2\\delta$ — **continuous**. Translation by $g$ is a rotation, a homeomorphism carrying $U$ to $gU$.`;
          if (!st.C) return `$\\det h=${v.fix(st.dh, 4)}$: $h$ is singular, so $h^{-1}$ does not exist — $GL_2(\\R)$ is the open set $\\det\\ne0$.`;
          const C = st.C, ent = `\\begin{pmatrix}${v.fix(C[0][0], 2)}&${v.fix(C[0][1], 2)}\\\\${v.fix(C[1][0], 2)}&${v.fix(C[1][1], 2)}\\end{pmatrix}`;
          return `$gh^{-1}=${ent}$, $\\det g=${v.fix(st.dg, 3)}$, $\\det h=${v.fix(st.dh, 3)}$. Entry perturbations $\\le\\delta=${v.fix(st.d, 3)}$ move $gh^{-1}$ by at most $${v.fix(st.worst, 3)}$ (ratio $${v.fix(st.worst / st.d, 1)}$)${Math.abs(st.dh) < 0.15 ? ' — large, because $h$ is close to singular' : ''}; the ratio stays bounded as $\\delta\\to0$: **continuous**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.21
    {
      num: '2.21',
      kind: 'Definition',
      name: 'Group actions and orbit spaces',
      statement: String.raw`A (continuous) **action** of a topological group $G$ on a space $X$ is a continuous map $G\times X\to X$, $(g,x)\mapsto g\cdot x$, with $e\cdot x=x$ and $g\cdot(h\cdot x)=(gh)\cdot x$. The **orbit space** $X/G$ is the quotient of $X$ by $x\sim g\cdot x$. For example $\R^2/\Z^2\cong T^2$ (translations), $\R/\Z\cong S^1$, $\R^2/\Z\cong S^1\times\R$, $S^n/\{\pm1\}=\R P^n$, and $\R^2/(\Z/n)$ (rotations by $2\pi/n$) is a cone, homeomorphic to $\R^2$.`,
      idea: String.raw`The quotient map $X\to X/G$ is open, because the saturation of an open $U$ is $\bigcup_g gU$, a union of open sets. A **fundamental domain** — a closed set meeting every orbit, and each interior orbit once — shows what the orbit space looks like: the unit square for $\Z^2$, with its edges identified exactly as in the torus (2.14), or a sector of angle $2\pi/n$ for rotations, whose two edges are glued into a cone. Any $G$-invariant function on $X$ descends to the orbit space (2.13), as the colouring shows.`,
      caption: String.raw`Drag the point $p$ in the plane: its orbit is gold, the fundamental domain is outlined, and the right panel shows the orbit space with $[p]$ marked. The plane is painted with a $G$-invariant pattern, so the paint descends to the quotient unchanged. For rotations, put $p$ at the origin: its stabilizer is all of $\Z/n$ and it becomes the cone point.`,
      deps: ['top-2.20', 'top-2.12'],
      refs: ['Munkres §22', 'Hatcher §1.3'],
      tags: ['group actions', 'quotient'],
      viz(v) {
        const act = v.select('action', [{ value: 'z2', label: '$\\Z^2$ by translations' }, { value: 'z', label: '$\\Z$ by translations' }, { value: 'rot', label: '$\\Z/n$ by rotations' }], 'z2');
        const nn = v.slider('$n$', 2, 8, 5, { int: true });
        const L = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 380, title: 'the plane and an orbit' });
        const S = v.stage3d({ range: 1.5, height: 380, yaw: -0.6, pitch: 0.5, axes: false, title: 'the orbit space' });
        const hp = L.handle(0.08, 0.3, { color: 'ink', label: 'p', constrain: (x, y) => { const r = Math.hypot(x, y); return act.value === 'rot' && r < 0.08 ? [0, 0] : [clamp(x, -2.1, 2.1), clamp(y, -2.1, 2.1)]; } });
        let st = null;
        v.render(() => {
          const A = act.value, n = nn.value, paint = squarePaint(v, 4), wh = wheel(v);
          nn.el.hidden = A !== 'rot';
          const H = 1.3; // the strip height shown for ℤ (the cylinder is cut to |y| ≤ H/2·… for display)
          // invariant paint on the plane
          const pat = A === 'rot'
            ? (x, y) => { const a = mod(Math.atan2(y, x), TAU / n) / (TAU / n), r = Math.hypot(x, y); return paint(a, mod(r / 1.6, 1)); }
            : A === 'z2' ? (x, y) => paint(mod(x, 1), mod(y, 1)) : (x, y) => (Math.abs(y) > H ? null : paint(mod(x, 1), (y + H) / (2 * H)));
          L.raster((x, y) => { const c = pat(x, y); return c ? [...c, 0.55] : null; }, { key: A + n, res: 3 });
          // fundamental domain
          if (A === 'z2') L.rect(0, 0, 1, 1, { color: 'ink', width: 2.5 });
          else if (A === 'z') { L.rect(0, -H, 1, H, { color: 'ink', width: 2.5 }); L.line(-2.2, H, 2.2, H, { color: 'muted', width: 1, dash: [4, 4] }); L.line(-2.2, -H, 2.2, -H, { color: 'muted', width: 1, dash: [4, 4] }); }
          else { const a = TAU / n; L.line(0, 0, 3.2, 0, { color: 'ink', width: 2.5 }); L.line(0, 0, 3.2 * Math.cos(a), 3.2 * Math.sin(a), { color: 'ink', width: 2.5 }); const arc = []; for (let k = 0; k <= 30; k++) arc.push([0.35 * Math.cos((a * k) / 30), 0.35 * Math.sin((a * k) / 30)]); L.path(arc, { color: 'ink', width: 1.5 }); for (let k = 1; k < n; k++) L.line(0, 0, 2.6 * Math.cos(k * a), 2.6 * Math.sin(k * a), { color: 'muted', width: 1, dash: [4, 4] }); }
          // orbit
          const orb = [];
          if (A === 'rot') { for (let k = 0; k < n; k++) { const a = (TAU * k) / n; orb.push([hp.x * Math.cos(a) - hp.y * Math.sin(a), hp.x * Math.sin(a) + hp.y * Math.cos(a)]); } }
          else for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { if (A === 'z' && j) continue; const q = [hp.x + i, hp.y + j]; if (Math.abs(q[0]) < 2.2 && Math.abs(q[1]) < 2.2) orb.push(q); }
          for (const q of orb) L.dot(q[0], q[1], { r: 5, color: 'gold' });
          // representative in the fundamental domain
          let rep, F, mark;
          if (A === 'z2') { rep = [mod(hp.x, 1), mod(hp.y, 1)]; F = folded('tor', 1); mark = F(rep[0], rep[1]); S.surface(F, [0, 1], [0, 1], { nu: 48, nv: 32, alpha: 0.92, colorFn: (u, w) => paint(u + 1 / 96, w + 1 / 64) }); }
          else if (A === 'z') { rep = [mod(hp.x, 1), clamp((hp.y + H) / (2 * H), 0, 1)]; F = folded('cyl', 1); mark = Math.abs(hp.y) <= H ? F(rep[0], rep[1]) : null; S.surface(F, [0, 1], [0, 1], { nu: 48, nv: 24, alpha: 0.92, colorFn: (u, w) => paint(u + 1 / 96, w + 1 / 48) }); }
          else {
            const a = TAU / n, sa = 1 / n, ca = Math.sqrt(1 - sa * sa);
            // the sector [0, a) rolled into a cone: slant distance ρ, cone angle with sin α = 1/n
            F = (rho, t) => { const ph = t * TAU; const s = rho * 1.6; return [s * sa * Math.cos(ph), s * sa * Math.sin(ph), 0.9 - s * ca]; };
            S.surface(F, [0, 1], [0, 1], { nu: 16, nv: 48, alpha: 0.92, colorFn: (rho, t) => paint(t + 1 / 96, mod(rho, 1)) });
            const r = Math.hypot(hp.x, hp.y), th = mod(Math.atan2(hp.y, hp.x), a);
            rep = [r, th / a];
            mark = r <= 1.6 ? F(r / 1.6, th / a) : null;
            if (r < 1e-9) mark = F(0, 0);
          }
          if (mark) S.dot(mark, { r: 6.5, color: 'gold', label: '[p]', bias: -0.4 });
          st = { A, n, orbit: orb.length, rep, fixed: A === 'rot' && Math.hypot(hp.x, hp.y) < 1e-9, out: !mark };
        });
        v.legend([['gold', 'the orbit $G\\cdot p$ (in view) and $[p]$', { dot: true }], ['ink', 'fundamental domain']]);
        v.readout(() => {
          if (!st) return '';
          const { A, n, orbit, rep, fixed, out } = st;
          if (A === 'rot') return fixed ? `$p=0$ is fixed by every rotation: stabilizer $\\Z/${n}$, orbit $\\{0\\}$ — the **cone point**. The orbit space is still homeomorphic to $\\R^2$, but the action is not free.` : `Orbit of $p$: ${n} points, stabilizer trivial. Representative in the sector of angle $2\\pi/${n}$: radius $${v.fix(rep[0], 3)}$, angle fraction $${v.fix(rep[1], 3)}$. The two edges of the sector are glued — a cone of angle $2\\pi/${n}$.${out ? ' (The cone is drawn up to radius 1.6.)' : ''}`;
          if (A === 'z2') return `${orbit} orbit points in view (the orbit is infinite, discrete, a translate of $\\Z^2$). Representative in the unit square: $(${v.fix(rep[0], 3)},${v.fix(rep[1], 3)})$. Free, properly discontinuous action: $\\R^2/\\Z^2$ is the **torus**.`;
          return `${orbit} orbit points in view. Representative $(${v.fix(rep[0], 3)},\\,y)$ in the strip $[0,1)\\times\\R$: $\\R^2/\\Z$ is the **cylinder** $S^1\\times\\R$ (drawn for $\\abs y\\le1.3$).${out ? ' $p$ is outside the drawn part.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.22
    {
      num: '2.22',
      kind: 'Theorem',
      name: 'Uniform limit theorem',
      statement: String.raw`Let $X$ be a topological space, $(Y,d)$ a metric space, and $f_n\colon X\to Y$ continuous. If $f_n\to f$ uniformly — $\sup_{x\in X}d(f_n(x),f(x))\to0$ — then $f$ is continuous. Pointwise convergence is not enough.`,
      idea: String.raw`The $\varepsilon/3$ argument: given $x_0$ and $\varepsilon$, choose $N$ with $d(f_N,f)<\varepsilon/3$ everywhere, then a neighbourhood $U$ of $x_0$ on which $d(f_N(x),f_N(x_0))<\varepsilon/3$; the triangle inequality gives $d(f(x),f(x_0))<\varepsilon$ on $U$. Uniformity is what lets one $N$ serve all $x$ at once. For $x^n$ on $[0,1]$ the limit jumps at $1$ and indeed $\sup\abs{x^n-f}=1$ for every $n$; for $nxe^{-nx}$ the limit $0$ is continuous although the convergence is not uniform — the theorem gives a sufficient condition, not a necessary one.`,
      caption: String.raw`Choose a sequence and slide $n$. The limit $f$ is blue with an $\varepsilon$-band around it; $f_n$ is gold, red wherever it leaves the band. The right panel plots $d_n=\sup\abs{f_n-f}$ (computed on a grid that crowds toward the trouble spot) for $n=1,\dots,60$: uniform convergence means the bars eventually stay under $\varepsilon$.`,
      deps: ['top-2.1', 'top-1.5'],
      see: ['pma-7.12'],
      refs: ['Munkres §21'],
      tags: ['uniform convergence', 'continuity'],
      viz(v) {
        const SEQ = {
          pow: { label: '$x^n$', f: (n, x) => x ** n, lim: (x) => (x < 1 ? 0 : 1), unif: false },
          sin: { label: '$x+\\frac{\\sin(6\\pi nx)}{n}$', f: (n, x) => x + Math.sin(6 * Math.PI * n * x) / n, lim: (x) => x, unif: true },
          bump: { label: '$nxe^{-nx}$', f: (n, x) => n * x * Math.exp(-n * x), lim: () => 0, unif: false },
          root: { label: '$\\sqrt{(x-\\frac12)^2+1/n^2}$', f: (n, x) => Math.sqrt((x - 0.5) ** 2 + 1 / (n * n)), lim: (x) => Math.abs(x - 0.5), unif: true },
        };
        const sq = v.select('$f_n$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const nn = v.slider('$n$', 1, 60, 6, { int: true });
        const ee = v.slider('$\\varepsilon$', 0.02, 0.5, 0.15, { step: 0.01 });
        const L = v.stage({ x: [0, 1], y: [-0.25, 1.25], height: 340, weight: 1.3, axes: 'box', gutter: true, xlabel: 'x', title: '$f_n$ and the $\\varepsilon$-band around $f$' });
        const R = v.stage({ x: [0, 61], y: [0, 1.1], height: 340, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'dₙ', title: '$d_n=\\sup\\abs{f_n-f}$' });
        // grid crowding toward x = 1 (where x^n misbehaves) and x = 0 (where nxe^{-nx} peaks): both ends, geometrically
        const grid = []; for (let i = 0; i <= 600; i++) grid.push(i / 600); for (let k = 1; k <= 60; k++) { grid.push(1 - 1.25 ** -k); grid.push(1.25 ** -k); }
        const supd = (S, n) => { let m = 0; for (const x of grid) { const d = Math.abs(S.f(n, x) - S.lim(x)); if (d > m) m = d; } return m; };
        let st = null;
        v.render(() => {
          const S = SEQ[sq.value], n = nn.value, e = ee.value;
          // limit and band (broken at the jump of x^n)
          const pts = []; for (let i = 0; i <= 500; i++) pts.push(i / 500);
          L.between((x) => S.lim(Math.min(x, 0.99999)) + e, (x) => S.lim(Math.min(x, 0.99999)) - e, 0, 1, { fill: 'accent', fillAlpha: 0.12 });
          L.fn((x) => S.lim(Math.min(x, 0.99999)), { color: 'accent', width: 2.6, domain: [0, 1] });
          if (sq.value === 'pow') { L.dot(1, 0, { r: 4.5, hollow: true, color: 'accent' }); L.dot(1, 1, { r: 4.5, color: 'accent' }); }
          // f_n, red outside the band
          let seg = [], out = [];
          const flush = (col) => { if (seg.length > 1) L.path(seg, { color: col, width: 2.4 }); };
          let prevOut = null;
          for (let i = 0; i <= 800; i++) {
            const x = i / 800, y = S.f(n, x), o = Math.abs(y - S.lim(x < 1 ? x : 0.99999)) >= e && x < 1;
            if (prevOut !== null && o !== prevOut) { seg.push([x, y]); flush(prevOut ? 'red' : 'gold'); seg = []; }
            seg.push([x, y]); prevOut = o; if (o) out.push(x);
          }
          flush(prevOut ? 'red' : 'gold');
          // sup distances
          const ds = []; for (let k = 1; k <= 60; k++) ds.push(supd(S, k));
          R.bars(ds, { x0: 1, dx: 1, color: (d, i) => (i + 1 === n ? 'gold' : d < e ? 'green' : 'red') });
          R.hline(e, { color: 'accent', width: 1.5, dash: [5, 4] });
          R.text('ε', 60.5, e + 0.05, { math: true, size: 14, color: 'accent', align: 'right' });
          const N = ds.findIndex((d, i) => ds.slice(i).every((x) => x < e));
          st = { S, n, e, d: ds[n - 1], N: N >= 0 ? N + 1 : null, outLo: out.length ? Math.min(...out) : null, outHi: out.length ? Math.max(...out) : null };
        });
        v.legend([['accent', 'limit $f$ and $\\varepsilon$-band', { area: true }], ['gold', '$f_n$ inside the band'], ['red', 'outside / $d_n\\ge\\varepsilon$'], ['green', '$d_n<\\varepsilon$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { S, n, e, d, N } = st;
          const conv = N ? `all $f_n$ with $n\\ge${N}$ stay in the band: **uniform convergence**, and the limit is continuous, as the theorem says.` : `no $N$ works: $d_n\\not\\to0$, the convergence is **only pointwise**${sq.value === 'pow' ? ' — and the limit jumps at $x=1$' : ' — yet this limit happens to be continuous: the theorem is not an "iff"'}.`;
          return `$d_{${n}}=\\sup_x\\abs{f_{${n}}(x)-f(x)}=${v.fix(d, 4)}$${sq.value === 'pow' ? ' (on the grid; the true supremum over $[0,1)$ is $1$, not attained)' : ''}${d >= e ? ' $\\ge\\varepsilon$' : ' $<\\varepsilon$'}. With $\\varepsilon=${v.fix(e, 2)}$: ${conv}`;
        });
      },
    },
  ],
};
