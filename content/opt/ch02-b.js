// Optimization — Chapter 2: Convex sets (items 2.8–2.13; 2.1–2.7 in ch02.js)
import {
  TAU, clamp, mulberry, inPoly, hull, segClosest, boundaryClosest, closestPoints, superellipse, inCone2, coneWidth,
  dualDirs, fanPoly, sub2, add2, dot2, len2, cross,
} from './ch02.shared.js';

const memo = () => { let k = null, val; return (key, f) => { if (key !== k) { val = f(); k = key; } return val; }; };
const rgbA = (v, name, a) => [...v.rgb(name).slice(0, 3), a];
const circlePoly = (cx, cy, r, n = 240) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((TAU * i) / n), cy + r * Math.sin((TAU * i) / n)]);

export default {
  collection: 'opt',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Supporting hyperplane theorem',
      statement: String.raw`Let $C\subseteq\R^n$ be convex and let $x_0$ be a boundary point of $C$ (a point of $\operatorname{cl}C\setminus\operatorname{int}C$). Then there is $a\ne0$ with $a^\top x\le a^\top x_0$ for all $x\in C$: the hyperplane $\{x:a^\top x=a^\top x_0\}$ **supports** $C$ at $x_0$. At a smooth boundary point the supporting hyperplane is the tangent hyperplane and $a$ is unique up to scaling; at a corner there is a whole cone of admissible normals $a$. Conversely, a closed set with nonempty interior that has a supporting hyperplane at every boundary point is convex.`,
      idea: String.raw`The point $x_0$ is not interior, so $\{x_0\}$ and the interior of $C$ are disjoint convex sets (when $\operatorname{int}C\neq\emptyset$; otherwise $C$ lies in a lower-dimensional affine set and any hyperplane containing that set supports it). The separating hyperplane theorem (opt-2.7) gives $a\ne0$ with $a^\top x\le a^\top x_0$ on $\operatorname{int}C$, and the inequality passes to $C\subseteq\operatorname{cl}(\operatorname{int}C)$. Supporting hyperplanes are the local linear models of the boundary of a convex set; their normals form the *normal cone* at $x_0$, a closed convex cone (opt-2.2) which is a ray at smooth points and wide at vertices.`,
      caption: String.raw`Choose a set and slide the point along its boundary (it snaps to the boundary). Every direction $a$ on the unit circle is tested against the whole boundary: the admissible ones are the green arc in the right panel, the normal cone at $x_0$. On the smooth body the arc is a single point (a tangent), on the polygon it is wide at vertices, and on the **dented** non-convex body it is empty at points in the dent: the theorem needs convexity. The dashed lines are the extreme supporting lines at a corner.`,
      credit: 'Minkowski, c. 1910',
      deps: ['opt-2.7'],
      refs: ['Boyd–Vandenberghe §2.5'],
      tags: ['supporting hyperplane', 'normal cone'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Supporting_hyperplane' },
      viz(v) {
        const kind = v.select('set', [{ value: 'smooth', label: 'smooth convex' }, { value: 'poly', label: 'polygon' }, { value: 'dent', label: 'dented (non-convex)' }], 'poly');
        const view = { x: [-4.4, 4.4], y: [-3.3, 3.3] };
        const L = v.stage({ ...view, equal: true, axes: false, grid: true, height: 400, title: 'a boundary point and its supporting lines' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 400, title: 'admissible normals $a$ (normal cone)' });
        const bodies = {
          smooth: superellipse(0, 0, 2.8, 1.9, 2.6, 360, 0.3),
          poly: hull([[-2.6, -1.2], [-1.2, 2.2], [1.6, 2.4], [2.9, 0.2], [1.2, -2.3], [-1.3, -2.2]]),
          dent: [[-2.8, -1.6], [-1.5, 2.2], [0.1, 0.0], [1.9, 2.4], [3.0, -1.2], [0.4, -2.4]],
        };
        const densify = (P, step = 0.04) => { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); } return out; };
        const dense = {}; for (const k of Object.keys(bodies)) dense[k] = densify(bodies[k], 0.05);
        const X0 = L.handle(2.9, 0.2, {
          color: 'gold', label: 'x₀', labelPos: 'ne',
          constrain: (x, y) => boundaryClosest([x, y], dense[kind.value]).q,
        });
        const snapDefault = { smooth: [2.55, 1.05], poly: [2.9, 0.2], dent: [0.1, 0.0] };
        let prevKind = null;
        let info = {};
        v.render(() => {
          const k = kind.value, B = bodies[k], Dn = dense[k];
          if (prevKind !== k) { prevKind = k; const q = boundaryClosest(snapDefault[k], Dn).q; X0.set(q[0], q[1]); }
          const x0 = [X0.x, X0.y], n = 1440, tol = 2.5e-3;
          L.poly(B, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 });
          const ok = [];
          for (let i = 0; i < n; i++) { const a = [Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)]; const b0 = dot2(a, x0); let good = true; for (const p of Dn) if (dot2(a, p) > b0 + tol) { good = false; break; } ok.push(good); }
          const idx = []; for (let i = 0; i < n; i++) if (ok[i]) idx.push(i);
          // circular run(s): take the run containing the circular mean
          let width = 0, mid = null;
          if (idx.length) {
            let sx = 0, sy = 0; idx.forEach((i) => { sx += Math.cos((TAU * i) / n); sy += Math.sin((TAU * i) / n); });
            mid = Math.atan2(sy, sx); width = (idx.length / n) * 360;
            const a0 = mid, na = [Math.cos(a0), Math.sin(a0)];
            L.clip(() => {
              L.line(x0[0] - 14 * na[1], x0[1] + 14 * na[0], x0[0] + 14 * na[1], x0[1] - 14 * na[0], { color: 'green', width: 2.6 });
              if (width > 1.5) {
                const half = (width / 2) * (Math.PI / 180);
                for (const sg of [-1, 1]) { const b = [Math.cos(a0 + sg * half), Math.sin(a0 + sg * half)]; L.line(x0[0] - 14 * b[1], x0[1] + 14 * b[0], x0[0] + 14 * b[1], x0[1] - 14 * b[0], { color: 'green', width: 1.3, dash: true }); }
              }
            });
            L.arrow(x0[0], x0[1], x0[0] + 0.9 * na[0], x0[1] + 0.9 * na[1], { color: 'orange', width: 2.4 });
            L.tex('a', x0[0] + 1.1 * na[0], x0[1] + 1.1 * na[1], { color: 'orange', size: 14 });
          }
          // right panel: unit circle with the admissible arc
          R.circle(0, 0, 1, { color: 'faint', width: 1.2, fill: false });
          const run = []; for (let i = 0; i < n; i++) if (ok[i]) run.push([1.0 * Math.cos((TAU * i) / n), 1.0 * Math.sin((TAU * i) / n)]);
          if (run.length) { R.dots(run, { r: 2.4, color: 'green' }); R.arrow(0, 0, Math.cos(mid), Math.sin(mid), { color: 'orange', width: 2.2 }); }
          else R.text('no admissible direction', 0, 0, { color: 'red', size: 15, align: 'center' });
          R.dot(0, 0, { r: 3, color: 'ink' });
          info = { count: idx.length, width, kind: k, mid };
        });
        v.readout(() => {
          const { count, width, kind: k, mid } = info;
          if (!count) return `At $x_0$ **no** direction $a$ has $a^\\top x\\le a^\\top x_0$ on the whole set: there is no supporting line here. The set is not convex (the point sits in a dent), so the theorem does not apply.`;
          return `Supporting lines exist: the normal cone at $x_0$ spans **${v.fix(width, 1)}°**${width < 4 ? ' (a single tangent: smooth point)' : ' (a corner: a fan of supporting lines)'}; central normal at ${v.fix((mid * 180) / Math.PI, 0)}°. Directions are tested against all ${(1440)} sampled boundary directions with tolerance $2.5\\cdot10^{-3}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Dual cones',
      statement: String.raw`The **dual cone** of a set $K\subseteq\R^n$ is
$$K^*=\{y\in\R^n:\ y^\top x\ge0\ \text{for all }x\in K\}.$$
$K^*$ is always a closed convex cone, even if $K$ is not. Moreover $K_1\subseteq K_2\Rightarrow K_2^*\subseteq K_1^*$, $K\subseteq K^{**}$, and $K^{**}$ is the closure of the convex cone generated by $K$; in particular $K^{**}=K$ exactly when $K$ is a closed convex cone. If $K$ is proper, so is $K^*$, and $x\preceq_{K}y$ can be tested by $\lambda^\top x\le\lambda^\top y$ for all $\lambda\in K^*$. Examples: $(\R^n_+)^*=\R^n_+$ and $(\mathbb S^n_+)^*=\mathbb S^n_+$ (self-dual cones).`,
      idea: String.raw`$K^*$ is an intersection of the closed halfspaces $\{y:y^\top x\ge0\}$ through the origin, one for each $x\in K$, which is why it is a closed convex cone and why enlarging $K$ shrinks $K^*$. The identity $K^{**}=\operatorname{cl}\operatorname{cone}K$ is the separating hyperplane theorem (opt-2.7) in disguise: a point outside a closed convex cone can be separated from it by a hyperplane through the origin, i.e. by some $y\in K^*$ with $y^\top x<0$. In the plane a wedge of opening $\varphi<\pi$ has a dual wedge of opening $\pi-\varphi$. For the matrix cone, $\operatorname{tr}(XY)\ge0$ for all $X\succeq0$ forces $v^\top Yv\ge0$ for every rank-one $X=vv^\top$, which is $Y\succeq0$.`,
      caption: String.raw`**Generators:** drag up to three generators of a cone $K$ (blue); its dual $K^*$ (green) is every direction making a non-obtuse angle with all of them, and the dashed orange outline is the double dual $K^{**}$, which lands on $K$ again. Make $K$ wider and $K^*$ narrows; spread the generators past a halfplane and $K^*$ collapses to $\{0\}$ while $K^{**}$ is the whole plane. Drag $y$ to test membership in $K^*$ by the inner products. **PSD cone:** a $2\times2$ matrix $Y$ with unit half-trace is a point of the disc $d^2+y^2\le1$; the curve is $v^\top Yv$ over unit vectors $v$, which stays above zero exactly when $Y$ is in the disc: the PSD cone is self-dual.`,
      deps: ['opt-2.6', 'opt-2.7'],
      refs: ['Boyd–Vandenberghe §2.6'],
      tags: ['dual cone', 'self-dual', 'bipolar'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dual_cone_and_polar_cone' },
      viz(v) {
        const mode = v.select('cone', [{ value: 'gen', label: 'generated by points' }, { value: 'psd', label: 'PSD cone (self-dual)' }], 'gen');
        const nG = v.slider('generators', 1, 3, 2, { step: 1, int: true });
        const S = v.stage({ x: [-4, 4], y: [-3.2, 3.2], equal: true, axes: false, grid: true, height: 400, title: 'K, its dual K* and K** (the double dual)' });
        const gpos = [[2.0, 0.5], [0.6, 2.2], [-2.0, 1.6]];
        const G = gpos.map((g, i) => S.handle(g[0], g[1], { color: 'orange', label: 'g' + (i + 1), labelPos: 'n' }));
        const Yh = S.handle(-0.5, 1.5, { color: 'purple', label: 'y', labelPos: 'ne' });
        const P = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, grid: true, height: 400, title: 'slice tr Y = 2: the matrices Y(d, y)' });
        const Q = v.stage({ x: [0, 180], y: [-1.2, 3.4], axes: 'box', gutter: true, height: 400, xlabel: 'direction of $v$ (degrees)', ylabel: '$v^\\top Yv$', title: 'tr(XY) over rank-one X = vv^T' });
        const Dh = P.handle(0.5, 0.45, { color: 'purple', label: 'Y', labelPos: 'ne' });
        let info = {};
        v.render(() => {
          const psd = mode.value === 'psd';
          S.el.style.display = psd ? 'none' : ''; P.el.style.display = psd ? '' : 'none'; Q.el.style.display = psd ? '' : 'none';
          nG.el.hidden = psd;
          if (!psd) {
            const k = nG.value; G.forEach((g, i) => { g.visible = i < k; });
            const gens = G.slice(0, k).map((g) => [g.x, g.y]), n = 1440;
            const Kf = [], Kdf = [];
            for (let i = 0; i < n; i++) Kf.push(inCone2(gens, [Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)], 1e-7));
            const Ks = dualDirs(gens, n, 1e-9);
            const dirsDual = []; for (let i = 0; i < n; i++) if (Ks[i]) dirsDual.push([Math.cos((TAU * i) / n), Math.sin((TAU * i) / n)]);
            for (let i = 0; i < n; i++) { const c = Math.cos((TAU * i) / n), s = Math.sin((TAU * i) / n); Kdf.push(dirsDual.every((y) => c * y[0] + s * y[1] >= -1e-9)); }
            const draw = (flags, col, a, lw, dash) => {
              const fp = fanPoly(flags, 14);
              if (fp.length) S.poly(fp, { fill: dash ? false : col, fillAlpha: a, color: col, width: lw, dash: dash || undefined, stroke: !!dash });
              if (!dash) for (let i = 0; i < n; i++) if (flags[i] !== flags[(i + 1) % n]) { const th = (TAU * (flags[i] ? i : i + 1)) / n; S.line(0, 0, 14 * Math.cos(th), 14 * Math.sin(th), { color: col, width: 2 }); }
            };
            draw(Kf, 'accent', 0.16, 2);
            draw(Ks, 'green', 0.14, 2);
            // K** outline: boundary rays drawn dashed
            for (let i = 0; i < n; i++) if (Kdf[i] !== Kdf[(i + 1) % n]) { const th = (TAU * (Kdf[i] ? i : i + 1)) / n; S.line(0, 0, 14 * Math.cos(th), 14 * Math.sin(th), { color: 'orange', width: 2.6, dash: true }); }
            gens.forEach((g) => S.arrow(0, 0, g[0], g[1], { color: 'orange', width: 2 }));
            S.dot(0, 0, { r: 4, color: 'ink' });
            S.tex('K', 1.9 * Math.cos(midAngle(Kf, n, 0)), 1.9 * Math.sin(midAngle(Kf, n, 0)), { color: 'accent', size: 16 });
            if (dirsDual.length) { const hw = (Ks.filter(Boolean).length / n) * Math.PI, am = midAngle(Ks, n, 0) - 0.82 * hw; S.tex('K^*', 3.0 * Math.cos(am), 3.0 * Math.sin(am), { color: 'green', size: 16 }); }
            const y = [Yh.x, Yh.y], ips = gens.map((g) => dot2(g, y)), inDual = ips.every((t) => t >= -1e-9);
            S.arrow(0, 0, y[0], y[1], { color: inDual ? 'green' : 'red', width: 2.2 });
            const wK = Kf.filter(Boolean).length / n * 360, wD = Ks.filter(Boolean).length / n * 360, wDD = Kdf.filter(Boolean).length / n * 360;
            info = { gen: true, wK, wD, wDD, ips, inDual, dirs: dirsDual.length };
          } else {
            const d = Dh.x, y = Dh.y, r = Math.hypot(d, y);
            P.circle(0, 0, 1, { fill: 'green', fillAlpha: 0.14, color: 'green', width: 2 });
            P.tex('Y\\succeq0', 0.0, -0.55, { color: 'green', size: 14 });
            P.line(-1.8, 0, 1.8, 0, { color: 'faint' }); P.line(0, -1.8, 0, 1.8, { color: 'faint' });
            P.arrow(0, 0, d, y, { color: r <= 1 ? 'green' : 'red', width: 2 });
            const fq = (th) => 1 + d * Math.cos(2 * th) + y * Math.sin(2 * th);
            let mn = Infinity, am = 0;
            for (let i = 0; i <= 360; i++) { const th = (Math.PI * i) / 360, q = fq(th); if (q < mn) { mn = q; am = th; } }
            Q.fn((deg) => fq((deg * Math.PI) / 180), { domain: [0, 180], color: 'purple', width: 2.4, n: 360 });
            Q.hline(0, { color: 'ink', width: 1.4 });
            Q.dot((am * 180) / Math.PI, mn, { r: 6, color: mn >= 0 ? 'green' : 'red' });
            P.line(0, 0, Math.cos(am), Math.sin(am), { color: 'gold', width: 0 });
            const ev = v.M.eigSym2([[1 + d, y], [y, 1 - d]]).values;
            info = { gen: false, mn, ev, psd: ev[1] >= -1e-9, d, y };
          }
        });
        function midAngle(flags, n) {
          let sx = 0, sy = 0; flags.forEach((f, i) => { if (f) { sx += Math.cos((TAU * i) / n); sy += Math.sin((TAU * i) / n); } });
          return Math.hypot(sx, sy) < 1e-6 ? Math.PI / 4 : Math.atan2(sy, sx);
        }
        v.readout(() => {
          const I = info;
          if (!I.gen) return `$Y=\\begin{pmatrix}${v.fix(1 + I.d, 2)}&${v.fix(I.y, 2)}\\\\${v.fix(I.y, 2)}&${v.fix(1 - I.d, 2)}\\end{pmatrix}$: $\\min_v v^\\top Yv=\\operatorname{tr}(XY)_{\\min}=${v.fix(I.mn, 3)}$ over rank-one $X$, eigenvalue $\\lambda_{\\min}(Y)=${v.fix(I.ev[1], 3)}$.\n$Y\\in(\\mathbb S^2_+)^*$ ${I.mn >= -1e-9 ? '✓' : '✗'} and $Y\\succeq0$ ${I.psd ? '✓' : '✗'}: the two tests agree, so $(\\mathbb S^2_+)^*=\\mathbb S^2_+$.`;
          return `Opening angles: $K$ ${v.fix(I.wK, 0)}°, $K^*$ ${v.fix(I.wD, 0)}°, $K^{**}$ ${v.fix(I.wDD, 0)}°${Math.abs(I.wDD - I.wK) < 1.5 ? ' ($K^{**}=K$)' : ''}${I.wK > 0 && I.wK < 179 ? `; $\\varphi+\\varphi^*=${v.fix(I.wK + I.wD, 0)}^\\circ$` : ''}.\n$y^\\top g_i=${I.ips.map((t) => v.fix(t, 2)).join(',\\ ')}$: $y\\in K^*$ is **${I.inDual ? 'true' : 'false'}**${I.dirs ? '' : ' ($K^*$ is $\\{0\\}$)'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Carathéodory’s theorem',
      statement: String.raw`Let $S\subseteq\R^n$ and $x\in\operatorname{conv}S$. Then $x$ is a convex combination of at most $n+1$ points of $S$. (Conic version: if $x$ is a conic combination of points of $S$, it is one of at most $n$ linearly independent points of $S$.) Consequently, in the plane every point of the hull of a finite set lies in a triangle spanned by three of the points, and the convex hull of a compact set is compact.`,
      idea: String.raw`Write $x=\sum_{i=1}^k\theta_ix_i$ with all $\theta_i>0$ and $k\ge n+2$. Then the vectors $(x_i,1)\in\R^{n+1}$ are linearly dependent, so there are $c_i$ not all $0$ with $\sum c_ix_i=0$ and $\sum c_i=0$ (an affine dependence). Some $c_i$ is positive; slide the weights to $\theta_i-tc_i$ with $t=\min_{c_i>0}\theta_i/c_i$: the point $x$ and the total weight do not change, all weights stay $\ge0$, and at least one becomes $0$. Repeat until at most $n+1$ points remain. The affine hull of a finite set is where this linear dependence comes from (opt-2.1, ladr-3.21).`,
      caption: String.raw`Drag the gold point $p$ inside the cloud's hull (resample the cloud, or change the number of points). The starting representation puts a positive weight on **every** point (dot area is proportional to the weight). *Reduce* applies one step of the proof to four of the weighted points: it finds the affine dependence, moves the weights along it until one hits zero, and removes that point, while the weighted average stays exactly at $p$. In the plane, $k-3$ steps leave only three points: their triangle and barycentric weights are shown together with the residual $\bigl\|\sum\theta_ix_i-p\bigr\|$.`,
      credit: 'Carathéodory, 1911',
      deps: ['opt-2.1', 'ladr-3.21'],
      refs: ['Boyd–Vandenberghe ch. 2'],
      tags: ['convex hull', 'affine dependence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carath%C3%A9odory%27s_theorem_(convex_hull)' },
      viz(v) {
        const nS = v.slider('points $k$', 5, 14, 10, { step: 1, int: true });
        let seed = 3;
        v.button('resample', () => { seed += 1; });
        const s = v.stage({ x: [-3.6, 3.6], y: [-2.9, 2.9], equal: true, axes: false, grid: true, height: 420, title: 'a point of the hull as a convex combination' });
        const Pt = s.handle(0.2, 0.15, { color: 'gold', r: 7, label: 'p', labelPos: 'ne' });
        let cloud = [], lam = [], key = '', steps = 0, hullIdx = [];
        const gen = () => {
          const r = mulberry(seed * 97 + nS.value * 13), n = nS.value, pts = [];
          for (let i = 0; i < n; i++) { const t = TAU * r(), rr = Math.sqrt(r()) * 2.6; pts.push([rr * Math.cos(t) * 1.2, rr * Math.sin(t) * 0.88]); }
          return pts;
        };
        const hullWithIdx = (pts) => { const idx = pts.map((_, i) => i).sort((a, b) => pts[a][0] - pts[b][0] || pts[a][1] - pts[b][1]); const cr = (o, a, b) => cross(pts[o], pts[a], pts[b]); const lo = [], up = []; for (const q of idx) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (const q of idx.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
        const init = (pts, p) => {
          const n = pts.length, hI = hullWithIdx(pts), hp = hI.map((i) => pts[i]);
          if (!inPoly(p[0], p[1], hp)) return null;
          const m = [pts.reduce((a, q) => a + q[0], 0) / n, pts.reduce((a, q) => a + q[1], 0) / n];
          const d = sub2(p, m), dl = len2(d);
          const lam0 = new Array(n).fill(1 / n);
          if (dl < 1e-9) return lam0;
          // ray from m through p hits the hull boundary at r on edge (a, b)
          let best = null;
          for (let i = 0; i < hp.length; i++) {
            const a = hp[i], b = hp[(i + 1) % hp.length], e = sub2(b, a), den = d[0] * e[1] - d[1] * e[0];
            if (Math.abs(den) < 1e-12) continue;
            const w = sub2(a, m), tt = (w[0] * e[1] - w[1] * e[0]) / den, uu = (w[0] * d[1] - w[1] * d[0]) / den;
            if (tt > 0 && uu >= -1e-9 && uu <= 1 + 1e-9 && (!best || tt < best.tt)) best = { tt, uu, i };
          }
          if (!best) return lam0;
          const t = Math.min(1, 1 / best.tt), a = hI[best.i], b = hI[(best.i + 1) % hI.length], al = 1 - best.uu;
          // p = (1-t) m + t r with r = (1-u) a + u b;   t = |p-m|/|r-m| = 1/tt (since r = m + tt d)
          const out = lam0.map((x) => x * (1 - t));
          out[a] += t * al; out[b] += t * (1 - al);
          return out;
        };
        const reduceOnce = () => {
          const S = lam.map((l, i) => (l > 1e-12 ? i : -1)).filter((i) => i >= 0);
          if (S.length <= 3) return false;
          const four = S.slice(0, 4);
          const A = [four.map((i) => cloud[i][0]), four.map((i) => cloud[i][1]), [1, 1, 1, 1]];
          const ns = v.M.nullspace(A); if (!ns.length) return false;
          let c = ns[0]; if (!c.some((t) => t > 1e-9)) c = c.map((t) => -t);
          let t = Infinity; four.forEach((i, j) => { if (c[j] > 1e-9) t = Math.min(t, lam[i] / c[j]); });
          four.forEach((i, j) => { lam[i] -= t * c[j]; if (Math.abs(lam[i]) < 1e-12) lam[i] = 0; });
          steps++; return true;
        };
        v.button('reduce one step', () => { reduceOnce(); });
        v.button('reduce to the end', () => { while (reduceOnce()); });
        v.button('reset weights', () => { key = ''; });
        let info = {};
        v.render(() => {
          const k = [seed, nS.value, Pt.x.toFixed(3), Pt.y.toFixed(3)].join('|');
          if (k !== key) { key = k; cloud = gen(); lam = init(cloud, [Pt.x, Pt.y]) || []; steps = 0; }
          const n = cloud.length, hp = hull(cloud);
          s.poly(hp, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6 });
          const p = [Pt.x, Pt.y];
          if (!lam.length) { cloud.forEach((q) => s.dot(q[0], q[1], { r: 5, color: 'muted' })); info = { out: true, n }; return; }
          const S = lam.map((l, i) => (l > 1e-12 ? i : -1)).filter((i) => i >= 0);
          if (S.length === 3) s.poly(S.map((i) => cloud[i]), { fill: 'green', fillAlpha: 0.2, color: 'green', width: 2.4 });
          else if (S.length === 4) s.poly(hull(S.map((i) => cloud[i])), { fill: false, color: 'orange', width: 1.4, dash: true });
          S.forEach((i) => s.segment(cloud[i], p, { color: 'orange', width: 0.8 + 6 * lam[i], alpha: 0.35 }));
          cloud.forEach((q, i) => { if (lam[i] > 1e-12) s.dot(q[0], q[1], { r: 3 + 22 * Math.sqrt(lam[i]), color: S.length <= 3 ? 'green' : 'orange', alpha: 0.5 }); s.dot(q[0], q[1], { r: 4, color: lam[i] > 1e-12 ? 'ink' : 'muted' }); });
          const rx = S.reduce((a, i) => a + lam[i] * cloud[i][0], 0), ry = S.reduce((a, i) => a + lam[i] * cloud[i][1], 0);
          info = { n, supp: S.length, res: Math.hypot(rx - p[0], ry - p[1]), sum: lam.reduce((a, b) => a + b, 0), steps, w: S.map((i) => lam[i]) };
        });
        v.readout(() => {
          const I = info;
          if (I.out) return `$p$ lies outside the convex hull of the ${I.n} points, so it has no convex-combination representation: drag it inside.`;
          return `${I.supp} point${I.supp === 1 ? '' : 's'} carry positive weight${I.supp <= 3 ? ' (**at most $n+1=3$**: the theorem)' : ` (still more than $n+1=3$: press *reduce*)`} after ${I.steps} step${I.steps === 1 ? '' : 's'}; $\\sum\\theta_i=${v.fix(I.sum, 6)}$, residual $\\|\\sum\\theta_ix_i-p\\|=${v.sci(I.res, 2)}$.${I.supp <= 3 ? `\nBarycentric weights: $${I.w.map((t) => v.fix(t, 3)).join(',\\ ')}$.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Projection onto a closed convex set',
      statement: String.raw`Let $C\subseteq\R^n$ be nonempty, closed and convex. For every $x\in\R^n$ there is a **unique** point $P_C(x)\in C$ with $\norm{x-P_C(x)}_2=\operatorname{dist}(x,C)$. A point $p\in C$ equals $P_C(x)$ if and only if
$$\ip{x-p}{\,y-p}\le0\qquad\text{for all }y\in C,$$
i.e. $x-p$ makes an obtuse (or right) angle with every direction into $C$, so that $\{z:\ip{x-p}{z-p}\le0\}$ supports $C$ at $p$. Moreover $P_C$ is nonexpansive: $\norm{P_C(x)-P_C(x')}\le\norm{x-x'}$. For a non-convex closed set the nearest point exists but need not be unique.`,
      idea: String.raw`Existence: the distance to $x$ is continuous and coercive, so it has a minimizer on the closed set $C$ (opt-1.2, rca-4.10 for Hilbert space). Uniqueness: if $p\neq q$ were both nearest, the midpoint is in $C$ by convexity and, by the parallelogram law, strictly nearer. Characterization: for $y\in C$ the points $p+t(y-p)$ stay in $C$ and $t\mapsto\norm{x-p-t(y-p)}^2$ has derivative $-2\ip{x-p}{y-p}$ at $t=0$, which must be $\ge0$ at a minimum — this is the first-order condition of opt-1.4 for a constrained minimum. Adding the two characterizations at $p=P_Cx$, $p'=P_Cx'$ gives $\norm{p-p'}^2\le\ip{x-x'}{p-p'}$ and Cauchy–Schwarz finishes.`,
      caption: String.raw`Choose a set; drag the point $x$ (purple) and the test point $y$ (teal; make it land in the set). The projection $P(x)$ is the green dot; the orange line through it perpendicular to $x-P(x)$ is the supporting line, and the angle at $P(x)$ between $x-P(x)$ and $y-P(x)$ is at least $90^\circ$ for every $y$ in a convex set. Move the second point $x'$: the distance between the projections never exceeds $\|x-x'\|$. On the **non-convex** sets (two discs, an L-shape) nearest points can tie (all shown in gold), an obtuse angle is no longer guaranteed, and the projection can *expand* distances.`,
      deps: ['opt-2.1', 'rca-4.10'],
      refs: ['Boyd–Vandenberghe §8.1'],
      tags: ['projection', 'nearest point'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Projection_onto_convex_sets' },
      viz(v) {
        const setSel = v.select('set $C$', [{ value: 'disc', label: 'disc' }, { value: 'ell', label: 'ellipse' }, { value: 'poly', label: 'polygon' }, { value: 'two', label: 'two discs' }, { value: 'L', label: 'L-shape' }], 'poly');
        const view = { x: [-4.6, 4.6], y: [-3.4, 3.4] };
        const s = v.stage({ ...view, equal: true, axes: false, grid: true, height: 420, title: 'nearest point of C' });
        const pieces = {
          disc: [circlePoly(0.2, 0.1, 1.8)],
          ell: [superellipse(0, 0, 2.5, 1.5, 2, 240, 0.5)],
          poly: [hull([[-2.2, -1.1], [-0.9, 1.9], [1.8, 1.6], [2.6, -0.5], [0.4, -1.9]])],
          two: [circlePoly(-1.7, 0.4, 1.4), circlePoly(1.8, -0.5, 1.3)],
          L: [[[-2.6, -1.8], [1.0, -1.8], [1.0, -0.4], [-2.6, -0.4]], [[-2.6, -0.4], [-1.2, -0.4], [-1.2, 2.2], [-2.6, 2.2]]],
        };
        const nonconv = (k) => k === 'two' || k === 'L';
        const X = s.handle(3.0, 1.9, { color: 'purple', label: 'x', labelPos: 'ne' });
        const Y = s.handle(0.6, -0.4, { color: 'teal', label: 'y', labelPos: 'sw' });
        const X2 = s.handle(-3.0, 2.0, { color: 'blue', label: "x'", labelPos: 'nw' });
        const projOnto = (p, k) => {
          let best = null;
          for (const pc of pieces[k]) {
            if (inPoly(p[0], p[1], pc)) return { d: 0, pts: [p.slice()] };
            const cs = closestPoints(p, pc, 1e-9); const c = cs[0];
            if (!best || c.d < best.d - 1e-9) best = { d: c.d, pts: [c.q] }; else if (Math.abs(c.d - best.d) <= 2e-3) best.pts.push(c.q);
          }
          const out = []; for (const q of best.pts) if (!out.some((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) < 0.06)) out.push(q);
          return { d: best.d, pts: out };
        };
        let info = {};
        v.render(() => {
          const k = setSel.value;
          pieces[k].forEach((pc) => s.poly(pc, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 }));
          const x = [X.x, X.y], pr = projOnto(x, k), p = pr.pts[0];
          const x2 = [X2.x, X2.y], pr2 = projOnto(x2, k), p2 = pr2.pts[0];
          pr.pts.forEach((q) => { s.segment(x, q, { color: 'green', width: 2.2 }); s.dot(q[0], q[1], { r: pr.pts.length > 1 ? 6 : 5.5, color: pr.pts.length > 1 ? 'gold' : 'green' }); });
          s.segment(x2, p2, { color: 'blue', width: 1.4, alpha: 0.7 }); s.dot(p2[0], p2[1], { r: 4.5, color: 'blue' });
          let inner = null, ang = null;
          if (pr.d > 1e-9) {
            const n = [(x[0] - p[0]) / pr.d, (x[1] - p[1]) / pr.d];
            s.clip(() => s.line(p[0] - 14 * n[1], p[1] + 14 * n[0], p[0] + 14 * n[1], p[1] - 14 * n[0], { color: 'orange', width: 1.8 }));
            const yv = sub2([Y.x, Y.y], p); inner = dot2(n, yv) * pr.d; const ly = len2(yv);
            ang = ly < 1e-9 ? null : (Math.acos(clamp(dot2(n, yv) / ly, -1, 1)) * 180) / Math.PI;
            s.segment(p, [Y.x, Y.y], { color: ang !== null && ang >= 90 - 1e-6 ? 'teal' : 'red', width: 1.8, dash: true });
          }
          const inY = pieces[k].some((pc) => inPoly(Y.x, Y.y, pc));
          const dxx = Math.hypot(x[0] - x2[0], x[1] - x2[1]), dpp = Math.hypot(p[0] - p2[0], p[1] - p2[1]);
          info = { k, d: pr.d, ties: pr.pts.length, inner, ang, inY, dxx, dpp };
        });
        v.readout(() => {
          const I = info;
          const head = I.d < 1e-9 ? '$x\\in C$: $P_C(x)=x$.' : `$\\operatorname{dist}(x,C)=${v.fix(I.d, 3)}$; ${I.ties > 1 ? `**${I.ties} nearest points tie** (not unique: $C$ is not convex)` : 'the nearest point is unique'}.`;
          const vi = I.d < 1e-9 ? '' : ` With $y${I.inY ? '\\in' : '\\notin'}\\,C$: $\\langle x-p,\\,y-p\\rangle=${v.fix(I.inner, 3)}$ (angle ${I.ang === null ? '—' : v.fix(I.ang, 0) + '°'})${I.inY ? (I.inner <= 1e-9 ? ' $\\le0$ ✓' : ' $>0$: **✗ the obtuse-angle property fails**') : ' (move $y$ into $C$ to test)'}.`;
          return `${head}${vi}\n$\\|P(x)-P(x')\\|=${v.fix(I.dpp, 3)}$ versus $\\|x-x'\\|=${v.fix(I.dxx, 3)}$: ratio ${v.fix(I.dpp / (I.dxx || 1), 3)} ${I.dpp <= I.dxx + 1e-9 ? '≤ 1 (nonexpansive)' : '**> 1: the projection expands distances**'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Linear functionals are maximized at extreme points',
      statement: String.raw`Let $C\subseteq\R^n$ be nonempty, convex and compact and let $c\in\R^n$. Then $\max_{x\in C}c^\top x$ is attained, and the set of maximizers is a nonempty compact convex face of $C$ that contains an extreme point of $C$; so the maximum is attained at an extreme point. If $C=\operatorname{conv}\{v_1,\dots,v_m\}$ is a polytope, then $\max_Cc^\top x=\max_ic^\top v_i$, and if several vertices are optimal, every point of their convex hull is optimal too. The same holds for a polyhedron without lines whenever the maximum is finite (it is attained at a vertex); without compactness the supremum may be $+\infty$ or not attained.`,
      idea: String.raw`A linear functional on a compact set attains its maximum $h$ (opt-1.2), and $F=C\cap\{c^\top x=h\}$ is compact and convex. A nonempty compact convex set is the convex hull of its extreme points (fa-3.24), and an extreme point of the face $F$ is an extreme point of $C$, because $F$ is cut out by a supporting hyperplane (opt-2.8): a segment in $C$ with its midpoint in $F$ must lie in $F$. For a polytope the computation is one line, $c^\top\sum\theta_iv_i=\sum\theta_ic^\top v_i\le\max_ic^\top v_i$. This is why the simplex method of linear programming can restrict attention to vertices.`,
      caption: String.raw`Drag the five vertices (or pick the disc or the unbounded polyhedron), and turn the objective direction $c$ with $\theta$. The gold line is the level set $c^\top x=h$ pushed outward until it last touches the set; it touches a vertex, jumping from vertex to vertex as $\theta$ turns, while the right panel plots the optimal value $h(\theta)=\max_C c^\top x$. Press *align with an edge* to make $c$ perpendicular to an edge: the whole edge becomes optimal. In the **unbounded** polyhedron the maximum is $+\infty$ for the directions shaded red: compactness is needed.`,
      deps: ['opt-2.1', 'fa-3.24'],
      refs: ['Boyd–Vandenberghe §4.3'],
      tags: ['extreme point', 'linear programming', 'support function'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Extreme_point' },
      viz(v) {
        const kind = v.select('set', [{ value: 'poly', label: 'polytope' }, { value: 'disc', label: 'disc' }, { value: 'unb', label: 'unbounded polyhedron' }], 'poly');
        const thS = v.slider('direction $\\theta$ (°)', 0, 360, 35, { step: 0.5 });
        const view = { x: [-4.2, 4.2], y: [-3.3, 3.3] };
        const s = v.stage({ ...view, equal: true, axes: false, grid: true, height: 400, title: 'maximize $c^\\top x$ over $C$' });
        const R = v.stage({ x: [0, 360], y: [-1, 5], axes: 'box', gutter: true, height: 400, xlabel: '$\\theta$ (degrees)', ylabel: '$h(\\theta)$', title: 'optimal value as the objective turns', xticks: [0, 90, 180, 270, 360] });
        const start = [[-2.4, -1.2], [-1.0, 1.9], [1.4, 2.0], [2.8, 0.2], [0.9, -1.8]];
        const H = start.map((p) => s.handle(p[0], p[1], { color: 'accent', r: 5.5 }));
        const UV = [[-2, 0.6], [-1.2, -0.9], [0.9, -1.2], [1.8, -0.6]], UR = [[-0.35, 1], [0.5, 1]];
        let edgeI = 0;
        v.button('align with an edge', () => {
          const k = kind.value;
          if (k === 'disc') return;
          const hp = k === 'poly' ? hull(H.map((h) => [h.x, h.y])) : null;
          const edges = k === 'poly' ? hp.map((p, i) => [p, hp[(i + 1) % hp.length]]) : [[UV[1], UV[2]], [UV[2], UV[3]], [UV[0], UV[1]]];
          const e = edges[edgeI++ % edges.length], d = sub2(e[1], e[0]);
          let th = (Math.atan2(d[0], -d[1]) * 180) / Math.PI; // outward normal of a ccw polygon edge: (dy, -dx)
          thS.set(((th % 360) + 360) % 360);
        });
        const memS = memo();
        let info = {};
        v.render(() => {
          const k = kind.value;
          H.forEach((h) => { h.visible = k === 'poly'; });
          const th = (thS.value * Math.PI) / 180, c = [Math.cos(th), Math.sin(th)];
          let verts, rays = [], hfun;
          if (k === 'poly') { verts = hull(H.map((h) => [h.x, h.y])); hfun = (a) => Math.max(...verts.map((q) => a[0] * q[0] + a[1] * q[1])); }
          else if (k === 'unb') { verts = UV; rays = UR; hfun = (a) => (rays.some((r) => a[0] * r[0] + a[1] * r[1] > 1e-12) ? Infinity : Math.max(...verts.map((q) => a[0] * q[0] + a[1] * q[1]))); }
          else { verts = null; hfun = (a) => 0.3 * a[0] + 0.1 * a[1] + 2.1; }
          // draw the set
          if (k === 'poly') s.poly(verts, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 });
          else if (k === 'disc') s.circle(0.3, 0.1, 2.1, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 });
          else {
            const Rr = 30, pts = [[UV[0][0] + Rr * UR[0][0], UV[0][1] + Rr * UR[0][1]], ...UV, [UV[3][0] + Rr * UR[1][0], UV[3][1] + Rr * UR[1][1]]];
            s.clip(() => s.poly(pts, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2.2 }));
          }
          const h = hfun(c);
          let opt = [];
          if (k === 'disc') { const q = [0.3 + 2.1 * c[0], 0.1 + 2.1 * c[1]]; opt = [q]; }
          else if (Number.isFinite(h)) opt = verts.filter((q) => c[0] * q[0] + c[1] * q[1] >= h - 1e-9);
          if (Number.isFinite(h)) {
            const o = k === 'disc' ? opt[0] : opt[0], t = [-c[1], c[0]];
            s.clip(() => s.line(o[0] - 14 * t[0], o[1] - 14 * t[1], o[0] + 14 * t[0], o[1] + 14 * t[1], { color: 'gold', width: 2.2 }));
            if (opt.length >= 2) s.segment(opt[0], opt[opt.length - 1], { color: 'green', width: 6 });
            opt.forEach((q) => s.dot(q[0], q[1], { r: 7, color: 'green' }));
          } else s.corner('unbounded: sup = +∞', 'tl', { color: 'red', plate: true });
          s.arrow(-3.4, -2.6, -3.4 + 1.1 * c[0], -2.6 + 1.1 * c[1], { color: 'orange', width: 3 }); s.tex('c', -3.4 + 1.4 * c[0], -2.6 + 1.4 * c[1], { color: 'orange', size: 16 });
          if (k !== 'disc') (k === 'poly' ? verts : UV).forEach((q) => s.dot(q[0], q[1], { r: 4, color: 'ink', alpha: 0.6 }));
          // right panel
          const key = k + '|' + (k === 'poly' ? verts.flat().map((x) => x.toFixed(3)).join(',') : '');
          const curve = memS(key, () => Array.from({ length: 361 }, (_, i) => hfun([Math.cos((i * Math.PI) / 180), Math.sin((i * Math.PI) / 180)])));
          const cap = 5;
          for (let i = 0; i < 360; i++) if (!Number.isFinite(curve[i])) R.vband(i, i + 1, { color: 'red', alpha: 0.12 });
          R.fn((x) => { const t = curve[Math.round(x)]; return Number.isFinite(t) ? t : NaN; }, { domain: [0, 360], n: 361, color: 'accent', width: 2.4 });
          if (Number.isFinite(h)) R.dot(thS.value, h, { r: 6, color: 'green' }); else R.vline(thS.value, { color: 'red', width: 2 });
          info = { k, h, nopt: opt.length, th: thS.value, opt, cap };
        });
        v.readout(() => {
          const { k, h, nopt, th, opt } = info;
          if (!Number.isFinite(h)) return `$\\theta=${v.fix(th, 1)}^\\circ$: $c$ makes an acute angle with a recession direction of $C$, so $\\sup_Cc^\\top x=+\\infty$ and **no maximizer exists** (the set is not compact).`;
          const what = k === 'disc' ? 'a single boundary point (every boundary point of a disc is extreme)' : nopt >= 2 ? `**the whole edge** between ${nopt} vertices (all optimal; both endpoints are extreme)` : 'a single vertex (an extreme point)';
          return `$\\theta=${v.fix(th, 1)}^\\circ$: $\\max_Cc^\\top x=${v.fix(h, 4)}$, attained at ${what}.${nopt === 2 ? ` Values at the two vertices: $${v.fix(dot2([Math.cos((th * Math.PI) / 180), Math.sin((th * Math.PI) / 180)], opt[0]), 6)}$, $${v.fix(dot2([Math.cos((th * Math.PI) / 180), Math.sin((th * Math.PI) / 180)], opt[1]), 6)}$.` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Helly’s theorem',
      statement: String.raw`Let $C_1,\dots,C_m\subseteq\R^n$ be convex sets with $m\ge n+1$. If every $n+1$ of them have a point in common, then all $m$ of them have a point in common. For an infinite family the same conclusion holds if the sets are closed and at least one is compact. The number $n+1$ cannot be lowered, and convexity cannot be dropped.`,
      idea: String.raw`Induct on $m$; the case $m=n+1$ is the hypothesis. For $m=n+2$ choose $x_i\in\bigcap_{j\ne i}C_j$. These $n+2$ points are affinely dependent, so (Radon) they split into two groups $I,J$ whose convex hulls share a point $z$. Every $C_k$ contains $z$: if $k\in I$, then all $x_j$ with $j\in J$ lie in $C_k$ (as $j\ne k$), hence so does their hull, which contains $z$, and symmetrically for $k\in J$. The affine dependence is the same linear algebra as in Carathéodory's theorem (opt-2.10). Larger $m$ reduces to this case by merging two sets into their intersection.`,
      caption: String.raw`Drag the centre and the radius handle of each disc (change how many with $m$). The readout counts how many pairs, triples and the whole family have a common point, computed on a fine grid; the green region is the common intersection. In the plane $n+1=3$: with $m=3$ discs placed around a triangle (*pairs are not enough*) every pair meets but there is no common point, so the number $n+1$ cannot be replaced by $n$. The **non-convex counterexample** replaces one disc by an annulus: all four triples meet, yet the four sets have no common point.`,
      credit: 'Helly, 1913 (published 1923)',
      deps: ['opt-2.10'],
      refs: ['Boyd–Vandenberghe ch. 2'],
      tags: ['Helly', 'intersection', 'Radon'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Helly%27s_theorem' },
      viz(v) {
        const mS = v.slider('sets $m$', 3, 5, 4, { step: 1, int: true });
        const ringT = v.toggle('set 1 is an annulus (not convex)', false);
        const view = { x: [-5, 5], y: [-3.7, 3.7] };
        const s = v.stage({ ...view, equal: true, axes: false, grid: true, height: 440, title: 'convex sets in the plane: do they have a common point?' });
        const start = [[-0.6, 0.4, 1.9], [0.5, 0.6, 1.8], [0.1, -0.5, 1.9], [0.7, -0.2, 1.7], [-0.3, -0.9, 1.6]];
        const cols = ['accent', 'orange', 'purple', 'teal', 'pink'];
        const D = start.map(([x, y, r], i) => {
          const d = { r, phi: 0.4 };
          d.c = s.handle(x, y, { color: cols[i], r: 6, label: String(i + 1), labelPos: 'n', onDrag: () => d.q.set(d.c.x + d.r * Math.cos(d.phi), d.c.y + d.r * Math.sin(d.phi)) });
          d.q = s.handle(x + r * Math.cos(d.phi), y + r * Math.sin(d.phi), { color: cols[i], r: 4.5, onDrag: () => { d.r = Math.max(0.2, Math.hypot(d.q.x - d.c.x, d.q.y - d.c.y)); d.phi = Math.atan2(d.q.y - d.c.y, d.q.x - d.c.x); } });
          return d;
        });
        const place = (i, x, y, r) => { D[i].r = r; D[i].c.set(x, y); D[i].q.set(x + r * Math.cos(D[i].phi), y + r * Math.sin(D[i].phi)); };
        v.button('pairs are not enough', () => { ringT.value = false; mS.set(3); const a = 1.15, r = 1.2; for (let i = 0; i < 3; i++) place(i, a * 1.7 * Math.cos(Math.PI / 2 + (TAU * i) / 3), a * 1.7 * Math.sin(Math.PI / 2 + (TAU * i) / 3) - 0.1, r); });
        v.button('non-convex counterexample', () => { ringT.value = true; mS.set(4); place(0, 0, 0, 2.2); for (let i = 0; i < 3; i++) place(i + 1, Math.cos(Math.PI / 2 + (TAU * i) / 3), Math.sin(Math.PI / 2 + (TAU * i) / 3), 1.6); });
        v.button('overlap them', () => { ringT.value = false; mS.set(4); [[-0.6, 0.4, 1.9], [0.5, 0.6, 1.8], [0.1, -0.5, 1.9], [0.7, -0.2, 1.7]].forEach((p, i) => place(i, p[0], p[1], p[2])); });
        const mem = memo();
        let info = {};
        const RING = 0.45;
        v.render(() => {
          const m = mS.value, ring = ringT.value;
          D.forEach((d, i) => { d.c.visible = d.q.visible = i < m; });
          const mem1 = (i, x, y) => { const d = D[i], r = Math.hypot(x - d.c.x, y - d.c.y); return i === 0 && ring ? r <= d.r && r >= RING * d.r : r <= d.r; };
          const key = [m, ring, ...D.slice(0, m).flatMap((d) => [d.c.x, d.c.y, d.r])].map((x) => (typeof x === 'number' ? x.toFixed(3) : x)).join('|');
          const res = mem(key, () => {
            const present = new Array(1 << m).fill(false), step = 0.045;
            for (let x = view.x[0]; x <= view.x[1]; x += step) for (let y = view.y[0]; y <= view.y[1]; y += step) {
              let mask = 0; for (let i = 0; i < m; i++) if (mem1(i, x, y)) mask |= 1 << i;
              present[mask] = true;
            }
            const meets = new Array(1 << m).fill(false);
            for (let a = 0; a < 1 << m; a++) if (present[a]) for (let sub = a; ; sub = (sub - 1) & a) { meets[sub] = true; if (!sub) break; }
            return meets;
          });
          const sets = []; for (let a = 1; a < 1 << m; a++) sets.push(a);
          const pc = (a) => { let c = 0; for (let i = 0; i < m; i++) if (a >> i & 1) c++; return c; };
          const pairs = sets.filter((a) => pc(a) === 2), triples = sets.filter((a) => pc(a) === 3), all = (1 << m) - 1;
          const pm = pairs.filter((a) => res[a]).length, tm = triples.filter((a) => res[a]).length;
          D.slice(0, m).forEach((d, i) => {
            const nm = cols[i];
            s.raster((x, y) => (mem1(i, x, y) ? rgbA(v, nm, 38) : null), { res: 3, key: 'set' + i + '|' + key });
          });
          s.raster((x, y) => { for (let i = 0; i < m; i++) if (!mem1(i, x, y)) return null; return rgbA(v, 'green', 190); }, { res: 3, key: 'all|' + key });
          D.slice(0, m).forEach((d, i) => {
            if (i === 0 && ring) { s.circle(d.c.x, d.c.y, d.r, { fill: false, color: cols[0], width: 2 }); s.circle(d.c.x, d.c.y, RING * d.r, { fill: false, color: cols[0], width: 2 }); }
            else s.circle(d.c.x, d.c.y, d.r, { fill: false, color: cols[i], width: 2 });
          });
          const bad = triples.filter((a) => !res[a]).map((a) => { const t = []; for (let i = 0; i < m; i++) if (a >> i & 1) t.push(i + 1); return t.join(''); });
          info = { m, pairs: pairs.length, pm, triples: triples.length, tm, allMeet: res[all], bad };
        });
        v.readout(() => {
          const { m, pairs, pm, triples, tm, allMeet, bad } = info;
          const concl = tm === triples ? (allMeet ? 'every triple meets, and so do all ' + m + ': **Helly ✓**' : 'every triple meets, yet the ' + m + ' sets have **no** common point: **Helly fails — a set is not convex**') : `some triples are empty (${bad.join(', ')}), so the hypothesis fails and nothing is claimed`;
          return `Pairs meeting: ${pm}/${pairs}; triples meeting: **${tm}/${triples}**; all ${m} together: ${allMeet ? '**yes**' : '**no**'}.\n${concl}.`;
        });
      },
    },
  ],
};
