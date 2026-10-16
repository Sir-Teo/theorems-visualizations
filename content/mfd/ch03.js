// Manifolds & Riemannian Geometry — Chapter 3: Submersions, immersions and submanifolds (items 3.1–3.7; 3.8–3.14 in ch03-b.js)
import {
  PI, TAU, clamp, wrap, minus, jac, pmat, sv2, torusPt, torusN, dot3, sc3, runs, project0,
} from './ch03.shared.js';

// ---- 3.1: constant-rank maps R^2 -> R^2 of rank one, F = (h, g2(h)), and the fold
const CR = {
  sine: { label: 'rank 1: $F=(h,\\ \\tfrac12\\sin 1.5h)$, $h=x+0.35y^2$', h: (x, y) => x + 0.35 * y * y, xOf: (c, y) => c - 0.35 * y * y, g2: (a) => 0.5 * Math.sin(1.5 * a), hr: [-2, 3.4] },
  par: { label: 'rank 1: $F=(h,\\ \\tfrac14h^2-1)$, $h=x+0.3\\sin 1.7y$', h: (x, y) => x + 0.3 * Math.sin(1.7 * y), xOf: (c, y) => c - 0.3 * Math.sin(1.7 * y), g2: (a) => 0.25 * a * a - 1, hr: [-2.3, 2.3] },
  fold: { label: 'fold $(x,\\ y^2-1)$: not constant rank' },
};

// ---- 3.2: parametrized curves in the plane
const GER = (u) => [1.7 * Math.cos(u), 0.85 * Math.sin(2 * u)];
const IMM = {
  eight: { label: 'figure-eight, $S^1\\to\\mathbb R^2$', cyc: true, t0: 0, t1: TAU, f: GER, cross: 0.25 },
  six: { label: 'injective immersion of an interval', cyc: false, t0: PI + 0.5, t1: 2.5 * PI, f: GER, cross: 0 },
  circle: { label: 'embedding, $S^1\\to\\mathbb R^2$', cyc: true, t0: 0, t1: TAU, f: (u) => [1.7 * Math.cos(u), 0.95 * Math.sin(u) * (1 + 0.25 * Math.cos(u))], cross: 0.25 },
};
IMM.six.cross = (1.5 * PI - IMM.six.t0) / (IMM.six.t1 - IMM.six.t0);
const NS = 1600;
const immCache = {};
function immPts(key) {
  if (!immCache[key]) {
    const C = IMM[key], ts = [], P = [];
    for (let i = 0; i < NS; i++) { const t = C.cyc ? C.t0 + ((C.t1 - C.t0) * i) / NS : C.t0 + ((C.t1 - C.t0) * (i + 0.5)) / NS; ts.push(t); P.push(C.f(t)); }
    immCache[key] = { ts, P };
  }
  return immCache[key];
}

// ---- 3.4: Cassini ovals (x^2+y^2)^2 - 2(x^2-y^2) + 1 - b^4 = 0, a = 1
const cassiniG = (b) => (x, y) => { const r2 = x * x + y * y; return r2 * r2 - 2 * (x * x - y * y) + 1 - b * b * b * b; };
const cassiniGrad = (x, y) => { const r2 = x * x + y * y; return [4 * x * (r2 - 1), 4 * y * (r2 + 1)]; };
function cassini(b) {
  const b4 = b ** 4, out = [], n = 220;
  if (b > 1.0000001) {
    const pts = [];
    for (let i = 0; i < 4 * n; i++) { const th = (TAU * i) / (4 * n), c = Math.cos(2 * th), r = Math.sqrt(c + Math.sqrt(c * c + b4 - 1)); pts.push([r * Math.cos(th), r * Math.sin(th)]); }
    return [pts];
  }
  const s0 = Math.sqrt(Math.max(0, 1 - b4)), th0 = 0.5 * Math.acos(s0);
  for (const c0 of [0, PI]) {
    const outer = [], inner = [];
    for (let i = 0; i <= n; i++) {
      const th = c0 + th0 * Math.sin(-PI / 2 + (PI * i) / n), c = Math.cos(2 * th), d = Math.sqrt(Math.max(0, c * c - s0 * s0));
      outer.push([Math.sqrt(Math.max(0, c + d)) * Math.cos(th), Math.sqrt(Math.max(0, c + d)) * Math.sin(th)]);
      inner.push([Math.sqrt(Math.max(0, c - d)) * Math.cos(th), Math.sqrt(Math.max(0, c - d)) * Math.sin(th)]);
    }
    out.push(outer.concat(inner.reverse()));
  }
  return out;
}

// ---- 3.5: functions on the plane with their critical points
const LV = {
  cubic: {
    label: '$y^2-x^3+x$', f: (x, y) => y * y - x * x * x + x, gr: (x, y) => [1 - 3 * x * x, 2 * y], win: 2.2, range: [-1.6, 1.6],
    crit: () => [[1 / Math.sqrt(3), 0], [-1 / Math.sqrt(3), 0]], note: 'a node at one critical value and an isolated point at the other',
  },
  cusp: {
    label: '$y^2-x^3$', f: (x, y) => y * y - x * x * x, gr: (x, y) => [-3 * x * x, 2 * y], win: 2, range: [-1.6, 1.6],
    crit: () => [[0, 0]], note: 'a cusp',
  },
  egg: {
    label: '$\\sin x\\,\\sin y$', f: (x, y) => Math.sin(x) * Math.sin(y), gr: (x, y) => [Math.cos(x) * Math.sin(y), Math.sin(x) * Math.cos(y)], win: 3.3, range: [-1, 1],
    crit: () => { const o = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { o.push([PI / 2 + i * PI, PI / 2 + j * PI]); o.push([i * PI, j * PI]); } return o.filter(([x, y]) => Math.abs(x) < 3.3 && Math.abs(y) < 3.3); }, note: 'isolated extrema at $\\pm1$ and a crossing at $0$',
  },
};

// ---- 3.6: SL_2(R) as a quadric in the (p,q,r,s) coordinates a=p+q, d=p-q, b=r+s, c=r-s
const matFromPQRS = (p, q, r, s) => [[p + q, r + s], [r - s, p - q]];

// ---- 3.7: slopes of lines on the torus
const SLOPES = {
  gold: { label: 'golden $\\tfrac{\\sqrt5-1}{2}$', a: (Math.sqrt(5) - 1) / 2, q: 0 },
  sqrt2: { label: '$\\sqrt2-1$', a: Math.SQRT2 - 1, q: 0 },
  pi: { label: '$\\pi-3$', a: PI - 3, q: 0 },
  r35: { label: 'rational $3/5$', a: 3 / 5, q: 5 },
  r2134: { label: 'rational $21/34$', a: 21 / 34, q: 34 },
};

export default {
  collection: 'mfd',
  chapter: 3,
  title: 'Submersions, immersions and submanifolds',
  summary: String.raw`Maps of constant rank look locally like linear projections or inclusions, which explains immersions, embeddings and submersions all at once. Regular level sets are embedded submanifolds, and Sard’s theorem says almost every value is regular. Whitney’s theorems embed every manifold in Euclidean space and approximate continuous maps by smooth ones, transversality is generic, and the mod 2 degree and Morse functions give the first topological invariants extracted by smooth methods.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Constant rank theorem',
      statement: String.raw`Let $F\colon M\to N$ be a smooth map between manifolds of dimensions $m$ and $n$ whose differential has the same rank $r$ at every point of $M$. Then for each $p\in M$ there are charts $(U,\varphi)$ of $M$ centred at $p$ and $(V,\psi)$ of $N$ centred at $F(p)$, with $F(U)\subset V$, in which $F$ is the linear map
$$\psi\circ F\circ\varphi^{-1}(x^1,\dots,x^m)=(x^1,\dots,x^r,0,\dots,0).$$
In particular a map of constant rank $m$ (an immersion) is locally an inclusion, and a map of constant rank $n$ (a submersion) is locally a coordinate projection.`,
      idea: String.raw`This is the rank theorem of $\R^n$ (pma 9.32) transported by charts, which is legitimate because the hypothesis "rank $r$ everywhere" does not depend on the charts. In the model proof one first uses the inverse function theorem (2.8) to make the first $r$ coordinates of $F$ into the first $r$ coordinates of $M$. Constant rank then forces the remaining coordinates of $F$ to be functions of those first $r$ only: otherwise the Jacobian would have rank above $r$. A second use of the inverse function theorem, in the target, subtracts these functions off and leaves exactly $(x^1,\dots,x^r,0,\dots,0)$. Without constant rank the conclusion fails: the fold $(x,y^2)$ has rank $2$ off the axis and $1$ on it.`,
      caption: String.raw`Choose a rank-one map $F\colon\R^2\to\R^2$ of the form $F=(h,g(h))$ and drag $p$. Top row: the original coordinates, with the level curves $h=\text{const}$ (blue, the fibres of $F$) in the domain, and the image curve in the target. Bottom row: the new coordinates $(\xi,\eta)=\Phi(x,y)=(h(x,y),y)$ and $(a,b')=\Psi(a,b)=(a,\,b-g(a))$: the fibres become vertical lines and the image lies on the axis, $\Psi\circ F\circ\Phi^{-1}(\xi,\eta)=(\xi,0)$. Switch to the **fold**: no pair of charts straightens it, and the rank readout drops from $2$ to $1$ at $y=0$.`,
      deps: ['mfd-2.8', 'pma-9.32'],
      refs: ['Lee SM Ch. 4'],
      tags: ['rank', 'normal form'],
      viz(v) {
        const kind = v.select('map $F$', Object.entries(CR).map(([value, o]) => ({ value, label: o.label })), 'sine');
        const D = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 400, xlabel: 'x', ylabel: 'y', title: 'domain, original coordinates' });
        const T = v.stage({ x: [-2.8, 3.8], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 400, xlabel: 'a', ylabel: 'b', title: 'target, original coordinates' });
        const D2 = v.stage({ x: [-2.8, 3.8], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 400, xlabel: 'ξ', ylabel: 'η', title: 'domain in the coordinates $(\\xi,\\eta)=\\Phi(x,y)$' });
        const T2 = v.stage({ x: [-2.8, 3.8], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 400, xlabel: 'a', ylabel: "b'", title: "target in the coordinates $(a,b')=\\Psi(a,b)$" });
        const p = D.handle(0.7, 0.8, { color: 'gold', label: 'p', constrain: { x: [-1.9, 1.9], y: [-1.9, 1.9] } });
        let info = null;
        v.render(() => {
          const fold = kind.value === 'fold';
          D2.el.style.display = fold ? 'none' : ''; T2.el.style.display = fold ? 'none' : '';
          if (fold) {
            const F = (x, y) => [x, y * y - 1];
            T.setView([-2.8, 3.8], [-2.2, 3.2]);
            for (let c = -2; c <= 2.001; c += 0.5) {
              D.line(c, -2, c, 2, { color: 'accent', width: 1, alpha: 0.5 });
              D.line(-2, c, 2, c, { color: 'orange', width: 1, alpha: 0.5 });
              T.line(c, -1, c, 3, { color: 'accent', width: 1, alpha: 0.5 });
              T.line(-2, c * c - 1, 2, c * c - 1, { color: 'orange', width: 1, alpha: 0.5 });
            }
            D.hline(0, { color: 'red', width: 2.2 }); T.hline(-1, { color: 'red', width: 2.2 });
            const q = F(p.x, p.y);
            D.dot(p.x, p.y, { r: 5, color: 'gold' }); T.dot(q[0], q[1], { r: 5, color: 'gold' });
            D.setTitle('domain: lines $x=c$ (blue), $y=c$ (orange); the fold line $y=0$ (red)'); T.setTitle('image: $y$ and $-y$ land on the same line');
            const J = jac(F, p.x, p.y);
            info = { fold, J, s: sv2(J) };
            return;
          }
          const C = CR[kind.value];
          T.setView([-2.8, 3.8], [-2.2, 2.2]); D.setTitle('domain, original coordinates'); T.setTitle('target, original coordinates');
          const F = (x, y) => { const h = C.h(x, y); return [h, C.g2(h)]; };
          for (let c = Math.ceil(C.hr[0] * 2.5) / 2.5; c <= C.hr[1]; c += 0.4) {
            D.clip(() => D.curve((y) => [C.xOf(c, y), y], -2, 2, { color: 'accent', width: 1.2, alpha: 0.55, n: 80 }), [-2, 2], [-2, 2]);
            D2.vline(c, { color: 'accent', width: 1.2, alpha: 0.55 });
            T.vline(c, { color: 'faint', width: 1, alpha: 0.5 });
          }
          for (let k = -2; k <= 2.001; k += 0.5) {
            D.hline(k, { color: 'orange', width: 1, alpha: 0.35 }); D2.hline(k, { color: 'orange', width: 1, alpha: 0.35 });
          }
          for (let k = -1.6; k <= 1.61; k += 0.4) {
            T.curve((a) => [a, C.g2(a) + k], C.hr[0], C.hr[1], { color: 'orange', width: 1, alpha: 0.35 });
            T2.hline(k, { color: 'orange', width: 1, alpha: 0.35 });
          }
          const hp = C.h(p.x, p.y);
          D.clip(() => D.curve((y) => [C.xOf(hp, y), y], -2, 2, { color: 'green', width: 3, n: 80 }), [-2, 2], [-2, 2]);
          D2.vline(hp, { color: 'green', width: 3 });
          T.curve((a) => [a, C.g2(a)], C.hr[0], C.hr[1], { color: 'accent', width: 3 });
          T2.hline(0, { color: 'accent', width: 3 });
          const q = F(p.x, p.y);
          D.dot(p.x, p.y, { r: 5, color: 'gold' });
          T.dot(q[0], q[1], { r: 5, color: 'gold', label: 'F(p)', labelPos: 'ne' });
          D2.dot(hp, p.y, { r: 5, color: 'gold', label: '(ξ,η)', labelPos: 'ne' });
          const b2 = q[1] - C.g2(q[0]);
          T2.dot(q[0], b2, { r: 5, color: 'gold', label: '(ξ,0)', labelPos: 'ne' });
          const J = jac(F, p.x, p.y);
          info = { fold, J, s: sv2(J), res: b2, xi: hp, eta: p.y };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => minus(v.fix(x, 3));
          if (info.fold) return `$DF_p=${pmat(info.J, 2)}$, singular values $${f(info.s[0])},\\ ${f(info.s[1])}$: rank $${info.s[1] > 1e-6 ? 2 : 1}$ at $p$, but rank $1$ on the line $y=0$ and rank $2$ elsewhere. The rank is not constant, so the theorem does not apply: the image is the half-plane $b\\ge-1$ and the line $y=0$ is folded.`;
          return `$DF_p=${pmat(info.J, 3)}$, singular values $${f(info.s[0])},\\ ${f(info.s[1])}$: rank $1$ (and $\\det DF=0$ at every point).\nIn the new coordinates $p=(\\xi,\\eta)=(${f(info.xi)},${f(info.eta)})$ and $\\Psi(F(p))=(\\xi,\\,${minus(v.sci(Math.abs(info.res) < 1e-12 ? 0 : info.res, 2))})$: the second coordinate vanishes, so $F$ reads $(\\xi,\\eta)\\mapsto(\\xi,0)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Immersions and embeddings',
      statement: String.raw`A smooth map $F\colon M\to N$ is an **immersion** if $dF_p\colon T_pM\to T_{F(p)}N$ is injective at every $p$ (so $\dim M\le\dim N$). It is a **smooth embedding** if it is an immersion and also a topological embedding, that is, a homeomorphism of $M$ onto its image $F(M)$ with the subspace topology. Every immersion is locally an embedding (by the constant rank theorem), and an injective immersion of a compact manifold is an embedding; but an injective immersion need not be an embedding.`,
      idea: String.raw`Injectivity of the differential is a first-order, pointwise condition, so it controls the map only near each point: by 3.1 a small piece of $M$ goes in as a coordinate plane. What it cannot see is where far-away parts of $M$ land. Two failures are possible. Either two parameter values hit the same point (non-injective, like the crossing of the figure eight), or far-away parameters accumulate onto a point of the image (an injective immersion whose image has the wrong topology). The embedding condition says that, for small $r$, the part of the image inside a ball of radius $r$ about $F(p)$ is the image of one small parameter neighbourhood of $p$ and nothing else.`,
      caption: String.raw`Pick a curve and drag $s$ along its parameter interval; the circle is a ball of radius $r$ about $f(t_0)$. Green marks the parameters near $t_0$ whose image lies in the ball, red any *other* arc of parameters that also lands in it; the right panel shows the same arcs in the parameter space. For the **circle** there is always one arc. For the **figure eight** two arcs appear at the crossing (use the button). For the **injective interval** (a 6-shaped curve) the image is injective, yet at the junction a second arc appears for every $r$, however small: the open end of the interval accumulates onto the curve.`,
      deps: ['mfd-3.1', 'top-2.7'],
      refs: ['Lee SM Ch. 4'],
      tags: ['immersion', 'embedding'],
      viz(v) {
        const kind = v.select('curve', Object.entries(IMM).map(([value, o]) => ({ value, label: o.label })), 'six');
        const sl = v.slider('position $s$ of $t_0$', 0, 1, IMM.six.cross, { step: 0.001, decimals: 3 });
        const rad = v.slider('ball radius $r$', 0.04, 0.9, 0.3, { step: 0.01 });
        v.button('jump to the crossing / junction', () => sl.set(IMM[kind.value].cross));
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.5, 1.5], equal: true, axes: false, height: 330, weight: 1.3, minWidth: 280, title: 'image in the plane' });
        const Pm = v.stage({ x: [0, 1], y: [-1, 1], axes: false, height: 330, weight: 1, minWidth: 250, title: 'parameter space' });
        let info = null;
        v.render(() => {
          const C = IMM[kind.value], { ts, P } = immPts(kind.value);
          const i0 = clamp(Math.round(sl.value * (NS - 1)), 0, NS - 1), c0 = P[i0], r = rad.value;
          const inside = P.map((q) => Math.hypot(q[0] - c0[0], q[1] - c0[1]) < r);
          // arcs: maximal runs, cyclic for closed curves
          const arcs = [];
          let start = -1;
          const n = NS;
          for (let i = 0; i < n; i++) {
            if (inside[i] && start < 0) start = i;
            if ((!inside[i] || i === n - 1) && start >= 0) { arcs.push([start, inside[i] ? i : i - 1]); start = -1; }
          }
          if (C.cyc && arcs.length > 1 && inside[0] && inside[n - 1]) { const a = arcs.pop(); arcs[0] = [a[0], arcs[0][1] + n]; }
          const mine = arcs.findIndex(([a, b]) => { for (let k = a; k <= b; k++) if (k % n === i0) return true; return false; });
          S.path(P.concat(C.cyc ? [P[0]] : []), { color: 'muted', width: 2 });
          if (!C.cyc) {
            S.dot(P[0][0], P[0][1], { r: 4, hollow: true, color: 'muted' }); S.dot(P[n - 1][0], P[n - 1][1], { r: 4, hollow: true, color: 'muted' });
          }
          S.circle(c0[0], c0[1], r, { color: 'orange', fill: 'orange', fillAlpha: 0.08, width: 1.6 });
          arcs.forEach(([a, b], k) => {
            const pts = []; for (let i = a; i <= (C.cyc ? b + 1 : b) && i < a + n; i++) pts.push(P[i % n]);
            S.path(pts, { color: k === mine ? 'green' : 'red', width: 4 });
          });
          S.dot(c0[0], c0[1], { r: 5.5, color: 'gold', label: 'f(t₀)', labelPos: 'ne' });
          // parameter panel
          Pm.setView([C.t0 - 0.05, C.t1 + 0.05], [-1, 1]);
          Pm.line(C.t0, 0, C.t1, 0, { color: 'muted', width: 2 });
          if (!C.cyc) { Pm.dot(C.t0, 0, { r: 4, hollow: true, color: 'muted' }); Pm.dot(C.t1, 0, { r: 4, hollow: true, color: 'muted' }); }
          arcs.forEach(([a, b], k) => {
            const ta = ts[a % n], tb = ts[Math.min(b, a + n - 1) % n] + (b >= n ? C.t1 - C.t0 : 0);
            Pm.line(ta, 0, Math.min(tb, C.t1 + (C.t1 - C.t0)), 0, { color: k === mine ? 'green' : 'red', width: 7 });
          });
          Pm.dot(ts[i0], 0, { r: 6, color: 'gold' });
          Pm.text('$t_0$', ts[i0], 0.28, { align: 'center' });
          // speed and nearest far-away parameter
          const df = 1e-5, a = C.f(ts[i0] + df), b = C.f(ts[i0] - df), sp = Math.hypot(a[0] - b[0], a[1] - b[1]) / (2 * df);
          let dmin = Infinity;
          const wpar = 0.6, T = C.t1 - C.t0;
          for (let i = 0; i < n; i++) {
            let dt = Math.abs(ts[i] - ts[i0]); if (C.cyc) dt = Math.min(dt, T - dt);
            if (dt > wpar) dmin = Math.min(dmin, Math.hypot(P[i][0] - c0[0], P[i][1] - c0[1]));
          }
          info = { sp, k: arcs.length, dmin, key: kind.value, extra: arcs.length - 1 };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => v.fix(x, 3);
          const verdict = { eight: 'Not injective: $f(\\pi/2)=f(3\\pi/2)$, so $f$ is an immersion (speed never $0$) but not an embedding.', six: 'Injective immersion of an open interval, but the image is not homeomorphic to it: near the junction the image contains points of an arc that is far away in the parameter.', circle: 'Immersion, injective, and a homeomorphism onto its image: an embedding.' }[info.key];
          return `speed $|f'(t_0)|=${f(info.sp)}>0$ (immersion). Parameters whose image lies in the ball: $${info.k}$ arc${info.k === 1 ? '' : 's'}${info.extra > 0 ? ' — **an extra arc** is present' : ''}. Distance from $f(t_0)$ to the image of parameters farther than $0.6$ away: $${f(info.dmin)}$.\n${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Submersions',
      statement: String.raw`A smooth map $F\colon M\to N$ is a **submersion** if $dF_p\colon T_pM\to T_{F(p)}N$ is surjective at every $p\in M$ (so $\dim M\ge\dim N$). A point $p$ where $dF_p$ is not surjective is **critical**, its image a **critical value**; $q\in N$ is a **regular value** if it is not a critical value (in particular every $q\notin F(M)$ is regular). A submersion is locally a coordinate projection, hence an open map, and has smooth local sections through every point.`,
      idea: String.raw`Surjectivity of $dF_p$ is an open condition that holds on all of $M$ for a submersion, so $F$ has constant rank $\dim N$ and the constant rank theorem (3.1) gives the coordinate form $(x^1,\dots,x^m)\mapsto(x^1,\dots,x^n)$. Projections of products are the model case. For a smooth function $h\colon M\to\R$ the condition is simply $dh_p\ne0$, so the critical points are the places where all partial derivatives vanish: tops, bottoms, saddles, or whole curves of them.`,
      caption: String.raw`The torus $T^2\subset\R^3$ is projected onto a line in the direction $w$ (the tilt of $w$ from the axis of the torus is the slider). The surface is coloured by the size of $dh=\langle w,\cdot\rangle|_{TM}$, red where it vanishes; the chart on the right is the $(a,b)$ parameter square with the level curves of $h$ and the same colouring. Drag $p$ in the chart to read $dh_p$ in coordinates. For a generic tilt there are exactly four critical points; at tilt $0$ the criticality spreads to two whole circles. The orange plane/curve is a level $c$; regular levels are smooth circles.`,
      deps: ['mfd-3.1'],
      refs: ['Lee SM Ch. 4'],
      tags: ['submersion', 'critical point'],
      viz(v) {
        const tl = v.slider('tilt of the projection direction (degrees)', 0, 90, 40, { step: 1 });
        const lev = v.slider('level $c$', -1.8, 1.8, 0.35, { step: 0.005 });
        const S3 = v.stage3d({ range: 2.1, height: 360, yaw: -0.55, pitch: 0.5, axes: false, weight: 1, minWidth: 280, title: 'torus coloured by $|dh|$' });
        const C = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 280, xlabel: 'a', ylabel: 'b', xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], yticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], title: 'parameter square: level curves of $h$' });
        const p = C.handle(1.2, 0.9, { color: 'gold', label: 'p', constrain: { x: [0, TAU], y: [0, TAU] } });
        let info = null;
        v.render(() => {
          const tau = (tl.value * PI) / 180, w = [Math.sin(tau), 0, Math.cos(tau)];
          const h = (a, b) => dot3(w, torusPt(a, b)), g = (a, b) => Math.sqrt(Math.max(0, 1 - dot3(w, torusN(a, b)) ** 2));
          S3.surface((a, b) => torusPt(a, b), [0, TAU], [0, TAU], { nu: 64, nv: 32, alpha: 0.97, colorFn: (a, b) => { const gg = g(a, b); return gg < 0.1 ? 'red' : v.ramp(gg, 'accent'); } });
          S3.arrow(sc3(w, -2), sc3(w, 2), { color: 'ink', width: 2 });
          S3.tex('w', sc3(w, 2.08), { color: 'ink' });
          const c = lev.value, u = [Math.cos(tau), 0, -Math.sin(tau)], v2 = [0, 1, 0], O = sc3(w, c);
          const corner = (s, t) => [O[0] + 1.9 * (s * u[0] + t * v2[0]), O[1] + 1.9 * (s * u[1] + t * v2[1]), O[2] + 1.9 * (s * u[2] + t * v2[2])];
          S3.poly([corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)], { fill: 'orange', fillAlpha: 0.14, color: 'orange' });
          const beta = PI / 2 - tau, crit = tau < 0.035 ? [] : [[0, beta], [PI, PI - beta], [PI, -beta], [0, beta - PI]].map(([a, b]) => [a, wrap(b)]);
          for (const [a, b] of crit) S3.dot(torusPt(a, b), { r: 5, color: 'red' });
          C.heat(g, { range: [0, 1], cmap: 'theme', res: 3, key: 'g' + tl.value });
          const lv = []; for (let k = -8; k <= 8; k++) lv.push(k * 0.2);
          C.contour(h, lv, { color: 'ink', width: 1, alpha: 0.3, res: 110 });
          C.contour(h, [c], { color: 'orange', width: 3, res: 160 });
          for (const [a, b] of crit) C.dot(a, b, { r: 5, color: 'red' });
          C.dot(p.x, p.y, { r: 6, color: 'gold' });
          const Pa = [-(1.25 + 0.5 * Math.cos(p.y)) * Math.sin(p.x), (1.25 + 0.5 * Math.cos(p.y)) * Math.cos(p.x), 0];
          const Pb = [-0.5 * Math.sin(p.y) * Math.cos(p.x), -0.5 * Math.sin(p.y) * Math.sin(p.x), 0.5 * Math.cos(p.y)];
          info = { tau, da: dot3(w, Pa), db: dot3(w, Pb), crit, vals: crit.map(([a, b]) => h(a, b)), c, hmax: 1.25 + 0.5 };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => minus(v.fix(x, 3));
          const nz = Math.hypot(info.da, info.db) > 1e-3;
          let t = `At $p$: $dh_p=(${f(info.da)},\\ ${f(info.db)})$ in the coordinates $(a,b)$ — ${nz ? 'nonzero, so $dh_p$ is **onto** $\\mathbb R$ (rank $1$): $p$ is a regular point.' : 'zero: **$p$ is critical**, rank $0$.'}\n`;
          if (info.crit.length === 0) t += 'Tilt $0$: $h$ is the height along the axis, and $dh=0$ along the **whole top circle and bottom circle**: critical points are not isolated here.';
          else {
            const reg = info.vals.every((x) => Math.abs(x - info.c) > 0.012);
            t += `Four critical points, critical values $${info.vals.map((x) => f(x)).sort((a, b) => a - b).join(',\\ ')}$. The level $c=${f(info.c)}$ is ${reg ? 'a **regular value**: the fibre is a smooth submanifold.' : 'a **critical value**: the fibre has a singular point.'}`;
          }
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Embedded submanifolds and slice charts',
      statement: String.raw`A subset $S\subset M$ of a smooth $n$-manifold is an **embedded $k$-submanifold** if it is the image of a smooth embedding of a $k$-manifold (with the subspace topology). The **local $k$-slice condition** says that every $p\in S$ lies in a chart $(U,\varphi)$ of $M$ with $\varphi(U\cap S)=\varphi(U)\cap(\R^k\times\{0\})$. A subset is an embedded $k$-submanifold exactly when it satisfies the local $k$-slice condition; the slice charts then make $S$ a smooth manifold, with the smooth structure for which the inclusion is an embedding.`,
      idea: String.raw`If $S$ is the image of an embedding $\iota$, the constant rank theorem (3.1) gives a chart in which $\iota$ is the inclusion of $\R^k\times\{0\}$; because $\iota$ is a homeomorphism onto $S$ with the subspace topology, a small enough neighbourhood $U$ of $p$ meets $S$ in this single sheet and nothing else, which is the slice. Conversely a slice chart restricts to a chart of $S$, and the transition maps are restrictions of smooth maps, hence smooth. The topological half of the embedding condition is precisely what rules out the accumulating tails of 3.2.`,
      caption: String.raw`The curve is a Cassini oval $g=(x^2+y^2)^2-2(x^2-y^2)+1-b^4=0$. Drag $p$ along it; the slice chart is $(u,w)=(x,g)$ (or $(y,g)$ where $g_y$ vanishes): the level curves $g=w_j$ in the box of half-width $\rho$ around $p$ on the left become the horizontal lines on the right, and the curve itself the axis $w=0$. Increase $\rho$ and watch the box meet the curve in **two** arcs: the chart is then no longer a slice chart, and its size is limited by the geometry. Press the button for $b=1$, the figure-eight (lemniscate): at the crossing $\nabla g=0$ and no slice chart exists, in agreement with 3.2.`,
      deps: ['mfd-3.2'],
      refs: ['Lee SM Ch. 5'],
      tags: ['submanifold', 'slice chart'],
      viz(v) {
        const bs = v.slider('Cassini parameter $b$', 0.8, 1.3, 1.12, { step: 0.005, decimals: 3 });
        const rho = v.slider('box half-width $\\rho$', 0.05, 1.4, 0.35, { step: 0.01 });
        v.button('lemniscate $b=1$', () => bs.set(1));
        const kap = 0.4;
        const L = v.stage({ x: [-2, 2], y: [-1.3, 1.3], equal: true, axes: false, height: 320, weight: 1.3, minWidth: 280, title: 'the plane: curve $g=0$ and its neighbours' });
        const R = v.stage({ x: [-1, 1], y: [-0.6, 0.6], axes: false, height: 320, weight: 1, minWidth: 250, title: 'slice chart' });
        const p = L.handle(1.4, 0, { color: 'gold', label: 'p', constrain: (x, y) => { const q = project0(cassiniG(bs.value), x, y); return [q[0], q[1]]; } });
        let info = null;
        v.render(() => {
          const b = bs.value, g = cassiniG(b), q = project0(g, p.x, p.y);
          p.set(q[0], q[1]);
          const px = p.x, py = p.y, gr = cassiniGrad(px, py), useX = Math.abs(gr[1]) >= Math.abs(gr[0]), up = useX ? px : py, rh = rho.value;
          const lines = cassini(b), curves = lines;
          const strip = ([x, y]) => Math.abs(x - px) < rh && Math.abs(y - py) < rh;
          // arcs of the curve inside the strip
          let arcs = 0; const marks = [];
          for (const poly of curves) { const fl = poly.map(strip); arcs += runs(fl, true); marks.push(fl); }
          const ok = arcs === 1;
          for (const poly of curves) L.path(poly, { close: true, color: 'ink', width: 2.2 });
          L.rect(px - rh, py - rh, px + rh, py + rh, { color: 'orange', fill: 'orange', fillAlpha: 0.1 });
          const lev = [-3, -2, -1, 1, 2, 3].map((j) => (j * kap) / 3);
          const box = [[px - rh, px + rh], [py - rh, py + rh]];
          L.clip(() => L.contour(g, lev, { color: 'accent', width: 1.1, alpha: 0.6, res: 150 }), box[0], box[1]);
          curves.forEach((poly, ci) => {
            const fl = marks[ci]; let cur = [];
            const flush = () => { if (cur.length > 1) L.path(cur, { color: ok ? 'green' : 'red', width: 4.2 }); cur = []; };
            for (let i = 0; i < poly.length; i++) { if (fl[i]) cur.push(poly[i]); else flush(); }
            flush();
          });
          const n = Math.hypot(gr[0], gr[1]);
          if (n > 1e-9) L.arrow(px, py, px + (0.45 * gr[0]) / n, py + (0.45 * gr[1]) / n, { color: 'purple', width: 2 });
          L.dot(px, py, { r: 5.5, color: 'gold' });
          // chart
          R.setView([-rh * 1.15, rh * 1.15], [-kap * 1.3, kap * 1.3]);
          R.rect(-rh, -kap, rh, kap, { color: 'orange', fill: 'orange', fillAlpha: 0.07 });
          for (const w of lev) R.hline(w, { color: 'accent', width: 1.1, alpha: 0.6 });
          for (let k = -4; k <= 4; k++) R.vline((k * rh) / 4, { color: 'faint', width: 1, alpha: 0.6 });
          R.line(-rh, 0, rh, 0, { color: ok ? 'green' : 'red', width: 4.2 });
          R.dot(0, 0, { r: 5.5, color: 'gold' });
          R.setTitle(useX ? 'slice chart $(u,w)=(x,\\,g)$' : 'slice chart $(u,w)=(y,\\,g)$');
          info = { n, useX, arcs, ok };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => v.fix(x, 3);
          if (info.n < 1e-3) return `$|\\nabla g(p)|=${f(info.n)}$: the differential of $g$ vanishes, $g_x=g_y=0$, so neither $(x,g)$ nor $(y,g)$ is a chart at this point; and the curve meets every small box around $p$ in **${info.arcs} arcs** (a crossing): no slice chart exists.`;
          return `$|\\nabla g(p)|=${f(info.n)}\\neq0$: $(u,w)=(${info.useX ? 'x' : 'y'},g)$ has invertible Jacobian at $p$. The curve meets the box $|x-x_p|,|y-y_p|<\\rho$ in **${info.arcs} arc${info.arcs === 1 ? '' : 's'}**: ${info.ok ? 'in this box the curve is exactly the slice $\\{w=0\\}$ — a slice chart.' : 'too wide: the curve comes back into the box, so $w=0$ is not the whole slice. Shrink $\\rho$.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Regular level sets are submanifolds',
      statement: String.raw`Let $F\colon M\to N$ be a smooth map between manifolds of dimensions $m$ and $n$, and let $q\in N$ be a regular value of $F$ (that is, $dF_p$ is onto at every $p\in F^{-1}(q)$). Then $F^{-1}(q)$, if non-empty, is a closed embedded submanifold of $M$ of dimension $m-n$, and $T_p F^{-1}(q)=\ker dF_p$ for each of its points. More generally, if $F$ has constant rank $r$ then every level set is a closed embedded submanifold of dimension $m-r$.`,
      idea: String.raw`Near a point of the level set $F$ is a submersion (surjectivity of $dF$ is an open condition), so by 3.3 and 3.1 there are coordinates in which $F$ is the projection $(x^1,\dots,x^m)\mapsto(x^1,\dots,x^n)$. In these coordinates the level set is the coordinate plane $\{x^1=\dots=x^n=0\}$ — a slice chart (3.4). Closedness comes from continuity of $F$. The tangent space is the kernel because $F$ is constant on the level set, so $dF$ kills tangent vectors, and the dimensions agree. This is the manifold version of the implicit function theorem; compare the regular surfaces of dg 4.3.`,
      caption: String.raw`Choose a function $f$ on the plane and slide the level $c$; $p$ is snapped to the level set $\{f=c\}$ (drag it along) and the arrow shows $\nabla f$, perpendicular to the tangent line $\ker df_p$. The critical points are the red dots; the button jumps to the next critical value. At a regular value the level set is a smooth curve everywhere; at a critical value it acquires a crossing, an isolated point, or a cusp. The readout gives the smallest $|\nabla f|$ found on the level set.`,
      deps: ['mfd-3.3', 'dg-4.3'],
      refs: ['Lee SM Ch. 5'],
      tags: ['level set', 'implicit function'],
      viz(v) {
        const fs = v.select('function $f$', Object.entries(LV).map(([value, o]) => ({ value, label: o.label })), 'cubic');
        const lev = v.slider('level $c$', -1.6, 1.6, 0.2, { step: 0.002, decimals: 3 });
        let ci = 0;
        v.button('next critical value', () => {
          const F = LV[fs.value], vals = [...new Set(F.crit().map(([x, y]) => +F.f(x, y).toFixed(9)))].sort((a, b) => a - b);
          ci = (ci + 1) % vals.length; lev.set(vals[ci]);
        });
        const S = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 300, xlabel: 'x', ylabel: 'y' });
        const p = S.handle(0, 0, { color: 'gold', label: 'p', constrain: (x, y) => { const F = LV[fs.value], q = project0((X, Y) => F.f(X, Y) - lev.value, x, y); return [q[0], q[1]]; } });
        const cache = {};
        const minGrad = (key, c) => {
          const F = LV[key], k = key + c.toFixed(4);
          if (cache[k] !== undefined) return cache[k];
          const G = 130, W = F.win, h = (2 * W) / G, val = [];
          for (let i = 0; i <= G; i++) { val.push([]); for (let j = 0; j <= G; j++) val[i].push(F.f(-W + i * h, -W + j * h)); }
          let m = Infinity;
          for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
            const q = [val[i][j], val[i + 1][j], val[i][j + 1], val[i + 1][j + 1]];
            if (Math.min(...q) <= c && Math.max(...q) >= c) for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const g = F.gr(-W + (i + di) * h, -W + (j + dj) * h); m = Math.min(m, Math.hypot(g[0], g[1])); }
          }
          return (cache[k] = m);
        };
        let info = null, lastKey = '';
        v.render(() => {
          const F = LV[fs.value], W = F.win, c = lev.value;
          if (lastKey !== fs.value) { lastKey = fs.value; S.setView([-W, W], [-W, W]); lev.set(clamp(lev.value, F.range[0], F.range[1])); }
          const gfun = (x, y) => F.f(x, y) - c;
          S.heat((x, y) => Math.tanh(F.f(x, y) / F.range[1] / 1.1), { range: [-1, 1], cmap: 'theme-diverging', res: 4, key: fs.value, rect: [-W, -W, W, W] });
          const lv = []; for (let k = -6; k <= 6; k++) lv.push((k * F.range[1]) / 6.5);
          S.clip(() => { S.contour(F.f, lv, { color: 'ink', width: 0.8, alpha: 0.25, res: 130 }); S.contour(F.f, [c], { color: 'ink', width: 3.2, res: 240 }); }, [-W, W], [-W, W]);
          const crit = F.crit();
          for (const [x, y] of crit) S.dot(x, y, { r: 4.5, color: 'red' });
          const q = project0(gfun, p.x, p.y);
          p.set(q[0], q[1]);
          const g = F.gr(p.x, p.y), n = Math.hypot(g[0], g[1]) || 1;
          if (Math.hypot(g[0], g[1]) > 1e-8) {
            S.line(p.x - (0.9 * -g[1]) / n, p.y - (0.9 * g[0]) / n, p.x + (0.9 * -g[1]) / n, p.y + (0.9 * g[0]) / n, { color: 'green', width: 2, dash: [5, 4] });
            S.arrow(p.x, p.y, p.x + (0.55 * g[0]) / n, p.y + (0.55 * g[1]) / n, { color: 'purple', width: 2.4 });
          }
          const cv = [...new Set(crit.map(([x, y]) => +F.f(x, y).toFixed(9)))];
          const isCrit = cv.some((x) => Math.abs(x - c) < 1e-7);
          info = { g: Math.hypot(g[0], g[1]), c, isCrit, vals: cv.sort((a, b) => a - b), mg: minGrad(fs.value, c), note: F.note };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => minus(v.fix(x, 3));
          return `$c=${f(info.c)}$; $|\\nabla f(p)|=${f(info.g)}$, smallest $|\\nabla f|$ found on the level set: $${f(info.mg)}$. Critical values of $f$ in the window: $${info.vals.map(f).join(',\\ ')}$.\n${info.isCrit ? `**$c$ is a critical value**: the level set contains a critical point (${info.note}), and is not a manifold there.` : '$c$ is a **regular value**: $df\\ne0$ along the whole level set, which is a smooth embedded curve (a $1$-dimensional submanifold) with tangent line $\\ker df_p$.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Proposition',
      name: 'O(n) and SL(n) as submanifolds',
      statement: String.raw`In the space $M_n(\R)\cong\R^{n^2}$: (a) $SL(n,\R)=\det^{-1}(1)$ is a closed embedded submanifold of dimension $n^2-1$, with $T_ISL(n,\R)=\{H:\operatorname{tr}H=0\}$. (b) $O(n)=\{A:A^{\mathsf T}A=I\}$ is a compact embedded submanifold of dimension $n(n-1)/2$, with $T_IO(n)=\{H:H^{\mathsf T}=-H\}$. In both cases the identity matrix, and indeed the whole level set, consists of regular points of the defining map.`,
      idea: String.raw`Both are regular level sets (3.5). For the determinant, $d\det_A(H)=\operatorname{tr}(\operatorname{adj}(A)H)$, a nonzero linear form whenever $A\ne0$, so $1$ is a regular value ($0$ is not: the zero matrix is critical). For $\Phi(A)=A^{\mathsf T}A$ with values in the symmetric matrices, $d\Phi_A(H)=A^{\mathsf T}H+H^{\mathsf T}A$, and at an orthogonal $A$ the choice $H=\tfrac12AS$ hits any symmetric $S$: so $\Phi$ is a submersion along $\Phi^{-1}(I)$ and the dimension is $n^2-n(n+1)/2$. Compactness of $O(n)$: it is closed and bounded.`,
      caption: String.raw`Case $SL_2(\R)$. Write $A=\begin{pmatrix}a&b\\c&d\end{pmatrix}$ with $a=p+q$, $d=p-q$, $b=r+s$, $c=r-s$, so $\det A=p^2-q^2-r^2+s^2=k$. A 3D slice through the identity sets one coordinate to $0$; move the point with $w,\theta$ and change the level $k$: for $k=1$ you see a two-sheeted or one-sheeted hyperboloid, for $k=0$ the cone, singular at the zero matrix where $d\det$ vanishes. Case $O(2)$: the two circles of rotations (in the $(p,s)$-plane) and reflections (in the $(q,r)$-plane); the readout shows the $3\times4$ matrix of $d\Phi_A$ and its rank.`,
      deps: ['mfd-3.5'],
      refs: ['Lee SM Ch. 5', 'Lee SM Ch. 7'],
      tags: ['matrix groups', 'level set'],
      viz(v) {
        const mode = v.select('group', [{ value: 'sl', label: '$SL_2(\\mathbb R)$, $\\det=k$' }, { value: 'o', label: '$O(2)$, $A^{\\mathsf T}A=I$' }], 'sl');
        const slice = v.select('slice through $I$', [{ value: 'A', label: 'drop $s$: $(p,q,r)$' }, { value: 'B', label: 'drop $r$: $(q,p,s)$' }], 'B');
        const kk = v.slider('level $k=\\det A$', -1, 1.5, 1, { step: 0.01 });
        const ww = v.slider('$w$ along the surface', -1.5, 1.5, 0.6, { step: 0.01 });
        const th = v.slider('angle $\\theta$', 0, 360, 40, { step: 1 });
        const sheet = v.select('sheet', [{ value: 1, label: 'upper' }, { value: -1, label: 'lower' }], 1);
        const tt = v.slider('angle $t$', 0, 360, 50, { step: 1 });
        const comp = v.select('component', [{ value: 'rot', label: 'rotations $SO(2)$' }, { value: 'ref', label: 'reflections' }], 'rot');
        const S3 = v.stage3d({ range: 2.6, height: 360, yaw: -0.6, pitch: 0.35, axes: true, labels: ['', '', ''], weight: 1, minWidth: 290, title: 'slice of $\\{\\det=k\\}$' });
        const C1 = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: true, height: 300, weight: 1, minWidth: 250, title: '$SO(2)$ in the $(p,s)$-plane' });
        const C2 = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: true, height: 300, weight: 1, minWidth: 250, title: 'reflections in the $(q,r)$-plane' });
        let info = null;
        v.render(() => {
          const O = mode.value === 'o';
          S3.el.style.display = O ? 'none' : ''; C1.el.style.display = O ? '' : 'none'; C2.el.style.display = O ? '' : 'none';
          kk.el.hidden = O; ww.el.hidden = O; th.el.hidden = O; if (O) sheet.el.hidden = true; slice.el.hidden = O; tt.el.hidden = !O; comp.el.hidden = !O;
          if (!O) {
            const k = kk.value, typeA = slice.value === 'A', Kp = typeA ? k : -k, a0 = Math.sqrt(Math.abs(Kp));
            sheet.el.hidden = !(Kp > 1e-9);
            const par = (w, s) => { // returns [axis, rho] for axis^2 - rho^2 = Kp
              if (Kp > 1e-9) return [s * a0 * Math.cosh(w), a0 * Math.sinh(w)];
              if (Kp < -1e-9) return [a0 * Math.sinh(w), a0 * Math.cosh(w)];
              return [s * w, Math.abs(w)];
            };
            const plot = (w, t, s) => { const [ax, rh] = par(w, s); return typeA ? [ax, rh * Math.cos(t), rh * Math.sin(t)] : [ax, rh * Math.cos(t), rh * Math.sin(t)]; };
            const sheets = Kp > 1e-9 ? [1, -1] : [1];
            for (const s of sheets) S3.surface((w, t) => plot(w, t, s), [Kp > 1e-9 ? -1.4 : Kp < -1e-9 ? -1.4 : 0, 1.4], [0, TAU], { nu: 36, nv: 40, alpha: 0.55, color: Kp > -1e-9 && Kp < 1e-9 ? 'purple' : 'accent', wire: true });
            if (Math.abs(Kp) < 1e-9) S3.surface((w, t) => plot(w, t, -1), [0, 1.4], [0, TAU], { nu: 20, nv: 40, alpha: 0.55, color: 'purple', wire: true });
            const sg = Kp > 1e-9 ? sheet.value : 1, [ax, rh] = par(ww.value, sg), t = (th.value * PI) / 180;
            const X = ax, Y = rh * Math.cos(t), Z = rh * Math.sin(t);
            const [pp, qq, rr, ss] = typeA ? [X, Y, Z, 0] : [Y, X, 0, Z];
            S3.dot([X, Y, Z], { r: 6, color: 'gold' });
            S3.dot(typeA ? [1, 0, 0] : [0, 1, 0], { r: 4, color: 'green', label: 'I' });
            if (!typeA && Math.abs(k - 1) < 1e-9) S3.curve((u) => [0, Math.cos(u), Math.sin(u)], 0, TAU, { color: 'green', width: 3 });
            S3.tex(typeA ? 'p' : 'q', [2.8, 0, 0], { color: 'muted' }); S3.tex(typeA ? 'q' : 'p', [0, 2.8, 0], { color: 'muted' }); S3.tex(typeA ? 'r' : 's', [0, 0, 2.8], { color: 'muted' });
            const A = matFromPQRS(pp, qq, rr, ss);
            info = { O, A, k, det: A[0][0] * A[1][1] - A[0][1] * A[1][0], grad: [A[1][1], -A[1][0], -A[0][1], A[0][0]] };
          } else {
            const t = (tt.value * PI) / 180, rot = comp.value === 'rot';
            const A = rot ? [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]] : [[Math.cos(t), Math.sin(t)], [Math.sin(t), -Math.cos(t)]];
            C1.circle(0, 0, 1, { color: rot ? 'accent' : 'muted', width: rot ? 3 : 1.5 }); C2.circle(0, 0, 1, { color: rot ? 'muted' : 'accent', width: rot ? 1.5 : 3 });
            C1.text('p', 1.4, -0.12, { color: 'muted' }); C1.text('s', 0.1, 1.38, { color: 'muted' }); C2.text('q', 1.4, -0.12, { color: 'muted' }); C2.text('r', 0.1, 1.38, { color: 'muted' });
            if (rot) C1.dot(Math.cos(t), -Math.sin(t), { r: 6, color: 'gold' }); else C2.dot(Math.cos(t), Math.sin(t), { r: 6, color: 'gold' });
            // d Phi_A(H) = A^T H + H^T A in the coordinates (S11, S12, S22); columns for H = E11, E12, E21, E22
            const J = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            const E = [[[1, 0], [0, 0]], [[0, 1], [0, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]]];
            E.forEach((H, j) => {
              const S = [[0, 0], [0, 0]];
              for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { let s = 0; for (let m = 0; m < 2; m++) s += A[m][a] * H[m][b] + H[m][a] * A[m][b]; S[a][b] = s; }
              J[0][j] = S[0][0]; J[1][j] = S[0][1]; J[2][j] = S[1][1];
            });
            const rk = v.M.rank(J, 1e-9);
            const AtA = [[0, 0], [0, 0]]; for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let m = 0; m < 2; m++) AtA[a][b] += A[m][a] * A[m][b];
            info = { O, A, J, rk, AtA };
          }
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => minus(v.fix(Math.abs(x) < 5e-4 ? 0 : x, 3));
          const mat = (M, rows) => `\\begin{pmatrix}${M.map((r) => r.map(f).join('&')).join('\\\\')}\\end{pmatrix}`;
          if (!info.O) {
            const nrm = Math.hypot(...info.grad);
            return `$A=${mat(info.A)}$, $\\det A=${f(info.det)}$ (level $k=${f(info.k)}$). $\\nabla\\det A=(d,-c,-b,a)=(${info.grad.map(f).join(',\\ ')})$ has length $|A|_F=${f(nrm)}$.\n${nrm < 1e-6 ? '**$A=0$: $d\\det_A=0$ is not onto.** The level $\\det=0$ is a cone singular at the zero matrix, so $0$ is not a regular value.' : '$d\\det_A\\neq0$, hence onto $\\mathbb R$: $A$ is a regular point, and near it $\\{\\det=k\\}$ is a $3$-dimensional submanifold of $\\mathbb R^4$.'}`;
          }
          return `$A=${mat(info.A)}$, $A^{\\mathsf T}A=${mat(info.AtA)}$. $d\\Phi_A(H)=A^{\\mathsf T}H+H^{\\mathsf T}A$ has matrix $${mat(info.J)}$ (rows $S_{11},S_{12},S_{22}$; columns $H=E_{11},E_{12},E_{21},E_{22}$) of rank $${info.rk}$: onto the $3$-dimensional space of symmetric matrices, so $O(2)$ is a $4-3=1$-dimensional submanifold: two circles.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Immersed submanifolds and the dense winding of the torus',
      statement: String.raw`An **immersed submanifold** of $M$ is a subset $S\subset M$ endowed with a topology and smooth structure, not necessarily the subspace ones, for which the inclusion $S\hookrightarrow M$ is a smooth immersion; equivalently, the image of an injective immersion. Embedded submanifolds are the immersed ones whose topology is the subspace topology. Example: for $\alpha\in\R\setminus\mathbb Q$ the map $\gamma\colon\R\to T^2=\R^2/\mathbb Z^2$, $t\mapsto(t,\alpha t)\bmod1$, is an injective immersion whose image is **dense** in $T^2$ yet has empty interior. It is therefore an immersed but not an embedded submanifold (an embedded submanifold is locally closed). For rational $\alpha$ the image is a closed embedded circle.`,
      idea: String.raw`The map $\gamma$ is an immersion since $\gamma'=(1,\alpha)\ne0$, and injective because $\gamma(s)=\gamma(t)$ would force $t-s$ and $\alpha(t-s)$ to be integers, which needs $\alpha$ rational (or $s=t$). Density is Kronecker's observation: the fractional parts $\{n\alpha\}$ are dense in $[0,1)$ when $\alpha$ is irrational, and these are the heights at which the line crosses the circle $x\equiv0$. Because the image accumulates on itself, its subspace topology (every small ball meets it in infinitely many strands) differs from that of $\R$, exactly the failure of 3.2.`,
      caption: String.raw`Choose the slope and drag the length $S$ (number of times the line goes around in the $x$-direction). Left: the flat torus $[0,1]^2$ with opposite sides identified, drawn together with the same curve on the 3D torus. The readout gives the **largest vertical gap** between neighbouring strands on the circle $x=0$ and how many distinct gap sizes there are (never more than three). For an irrational slope the gap shrinks towards $0$: the strands fill the torus. For $3/5$ the line closes after $5$ turns and the gap stays at $1/5$; for $21/34$ it looks dense for a while and then closes.`,
      deps: ['mfd-3.2'],
      refs: ['Lee SM Ch. 5'],
      tags: ['immersed submanifold', 'torus'],
      viz(v) {
        const sl = v.select('slope $\\alpha$', Object.entries(SLOPES).map(([value, o]) => ({ value, label: o.label })), 'gold');
        const Sx = v.slider('length $S$ (windings)', 1, 300, 12, { log: true, int: true, sig: 3 });
        const F = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 280, xlabel: 'x', ylabel: 'y', title: 'flat torus $\\mathbb R^2/\\mathbb Z^2$' });
        const T3 = v.stage3d({ range: 2.0, height: 380, yaw: -0.5, pitch: 0.55, axes: false, weight: 1, minWidth: 280, title: 'the same curve on $T^2\\subset\\mathbb R^3$' });
        let info = null;
        v.render(() => {
          const o = SLOPES[sl.value], al = o.a;
          let len = Sx.value;
          if (o.q) len = Math.min(len, o.q);
          const pts = [], ns = Math.max(2, Math.ceil(len * 40));
          let seg = [];
          let prev = null;
          for (let i = 0; i <= ns; i++) {
            const t = (len * i) / ns, x = t - Math.floor(t), y = al * t - Math.floor(al * t);
            if (prev && (Math.abs(x - prev[0]) > 0.5 || Math.abs(y - prev[1]) > 0.5)) { pts.push(seg); seg = []; }
            seg.push([x, y]); prev = [x, y];
          }
          pts.push(seg);
          for (const sg of pts) if (sg.length > 1) F.path(sg, { color: 'accent', width: len > 60 ? 1 : 1.8 });
          F.dot(0, 0, { r: 4, color: 'gold' });
          // 3D: sample at most 2500 points
          const m3 = Math.min(2500, Math.max(60, Math.ceil(len * 40)));
          const c3 = [];
          for (let i = 0; i <= m3; i++) { const t = (len * i) / m3, p = torusPt(TAU * t, TAU * al * t, 1.25, 0.5); c3.push(sc3(p, 1)); }
          T3.surface((a, b) => torusPt(a, b), [0, TAU], [0, TAU], { nu: 40, nv: 20, alpha: 0.3, color: 'muted', wire: false });
          T3.path(c3.map((q, i) => { const t = (len * i) / m3, n = torusN(TAU * t, TAU * al * t); return [q[0] + 0.012 * n[0], q[1] + 0.012 * n[1], q[2] + 0.012 * n[2]]; }), { color: 'accent', width: 1.4 });
          // gaps on the circle x = 0
          const K = Math.floor(len), ys = [];
          for (let k = 0; k <= K; k++) ys.push(al * k - Math.floor(al * k));
          ys.sort((a, b) => a - b);
          const gaps = []; for (let i = 0; i < ys.length; i++) gaps.push(i + 1 < ys.length ? ys[i + 1] - ys[i] : ys[0] + 1 - ys[i]);
          const distinct = []; for (const g of gaps.filter((g) => g > 1e-9)) if (!distinct.some((d) => Math.abs(d - g) < 1e-9)) distinct.push(g);
          info = { len, K, maxgap: Math.max(...gaps), n: ys.length, distinct: distinct.length, rat: o.q, o };
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => v.fix(x, 4);
          return `The line has gone around ${info.K + 1} time${info.K ? 's' : ''} and met the circle $x=0$ in $${new Set(Array.from({ length: info.K + 1 }, (_, k) => +((info.o.a * k) % 1).toFixed(9))).size}$ different points. **Largest gap** between neighbouring crossings: $${f(info.maxgap)}$ (${info.distinct} distinct gap size${info.distinct === 1 ? '' : 's'}).\n` + (info.rat ? `Rational slope: the curve closes up after $${info.rat}$ windings into an embedded circle, and the gap cannot go below $1/${info.rat}$.` : 'Irrational slope: the crossings never repeat and the gap keeps shrinking: the image is dense in $T^2$, but the immersion is injective.');
        });
      },
    },
  ],
};
