// Computational Geometry & Graphics — Chapter 2: Convex hulls (§§2.1–2.7; §§2.8–2.12 in ch02-b.js)
import { cross, d2, hull2, inConvex, polyArea, genPts, jarvis, grahamTrace } from './ch02.shared.js';

const f2 = (x) => v2(x);
const v2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
const SET = ['blue', 'orange', 'red', 'teal', 'purple', 'pink'];
const gstage = (v, o = {}) => v.stage({ x: [0, 10], y: [0, 7], equal: true, axes: false, height: 340, ...o });
/** Draw the hull (point list in CCW order) of a small group: dot, segment or filled polygon. */
function drawGroup(s, pts, color, o = {}) {
  if (pts.length === 1) s.dot(pts[0][0], pts[0][1], { color, r: o.r || 5 });
  else if (pts.length === 2) s.segment(pts[0], pts[1], { color, width: o.width || 3 });
  else if (pts.length > 2) s.poly(pts, { color, fill: color, fillAlpha: o.fillAlpha ?? 0.18, width: o.width || 2.5 });
}

export default {
  collection: 'cg',
  chapter: 2,
  title: 'Convex hulls',
  summary: String.raw`The convex hull of a point set is the smallest convex set containing it, and computing it is the first problem of the field. Classical theorems of convex geometry — Carathéodory, Radon, Helly — describe hulls combinatorially. Gift wrapping, Graham’s scan and divide and conquer compute planar hulls, sorting shows that $n\log n$ is optimal, and output-sensitive algorithms do better when the hull is small. In three dimensions, randomized incremental construction builds hulls whose complexity Euler’s formula keeps linear.`,
  items: [
    // ================================================================== 2.1
    {
      num: '2.1', kind: 'Definition', name: 'Convex sets and convex hulls',
      statement: String.raw`A set $C\subseteq\R^d$ is **convex** if it contains the whole segment $[p,q]$ whenever it contains $p$ and $q$. The **convex hull** $\operatorname{conv}(S)$ of a set $S$ is the smallest convex set containing $S$. Three equivalent descriptions hold for a finite set $S=\{p_1,\dots,p_n\}$: it is the intersection of all convex sets (equivalently, all closed half-planes) containing $S$; it is the set of all **convex combinations** $\sum_i\lambda_ip_i$ with $\lambda_i\ge0$, $\sum_i\lambda_i=1$; and it is the region enclosed by an elastic band stretched around $S$ — a convex polygon whose vertices are some of the $p_i$.`,
      idea: String.raw`Any intersection of convex sets is convex, so the intersection of all convex sets containing $S$ exists and is the smallest. The set of convex combinations contains $S$ and is convex (a convex combination of two convex combinations is one again), so it contains the intersection; conversely every convex set containing $S$ contains all convex combinations, by induction on the number of terms using the definition of convexity (this is the affine-combination calculus of 1.1 with non-negative weights). A polygon is the intersection of the half-planes bounded by its edges, which is why the half-plane view works: a point is in the hull exactly when it is on the inner side of every supporting line, and each such sidedness test is the orientation predicate 1.2.`,
      caption: String.raw`Drag the points (and the gold query point $q$). **Rubber band** shows the hull as the band around the points; **half-planes** shades the outer side of each edge's line, so the unshaded region is the intersection; **convex combinations** scatters random weighted averages of the points, all of which stay inside, and writes $q$ as a convex combination of three hull vertices when it is inside. Use the point slider to see that interior points never matter.`,
      deps: ['pma-2.17', 'fa-3.19', 'cg-1.2'], refs: ['de Berg §1.1'], tags: ['convexity', 'hull'],
      viz(v) {
        const s = gstage(v);
        const mode = v.select('view', [{ value: 'band', label: 'rubber band' }, { value: 'half', label: 'half-planes' }, { value: 'comb', label: 'convex combinations' }], 'band');
        const cnt = v.slider('points', 3, 10, 8, { int: true });
        const init = [[2, 1.4], [7.6, 1.2], [8.6, 4.2], [5.4, 6], [1.6, 4.4], [4.4, 3.4], [6, 2.8], [3.4, 2.2], [5.4, 4.6], [2.8, 5.4]];
        const H = init.map(([x, y], i) => s.handle(x, y, { color: 'accent', r: 6, label: 'p' + (i + 1), labelPos: 'n' }));
        const q = s.handle(4.2, 4.0, { color: 'gold', r: 7, label: 'q', labelPos: 'ne' });
        const rng = v.rng(7), W = Array.from({ length: 420 }, () => Array.from({ length: 10 }, () => -Math.log(1 - rng())));
        let info = {};
        v.render(() => {
          H.forEach((h, i) => { h.visible = i < cnt.value; });
          const pts = H.slice(0, cnt.value).map((h) => [h.x, h.y]), hi = hull2(pts), hp = hi.map((i) => pts[i]);
          const on = new Set(hi);
          const Q = [q.x, q.y];
          if (mode.value === 'half') {
            const L = 40;
            for (let k = 0; k < hp.length; k++) {
              const a = hp[k], b = hp[(k + 1) % hp.length], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, ox = dy / n, oy = -dx / n;
              s.poly([[a[0] - L * dx / n, a[1] - L * dy / n], [a[0] + L * dx / n, a[1] + L * dy / n], [a[0] + L * dx / n + L * ox, a[1] + L * dy / n + L * oy], [a[0] - L * dx / n + L * ox, a[1] - L * dy / n + L * oy]], { fill: 'orange', fillAlpha: 0.1, stroke: false });
              s.segment([a[0] - L * dx / n, a[1] - L * dy / n], [a[0] + L * dx / n, a[1] + L * dy / n], { color: 'orange', width: 1, alpha: 0.7 });
            }
          }
          if (hp.length >= 3) s.poly(hp, { color: 'accent', fill: 'accent', fillAlpha: mode.value === 'half' ? 0.0 : 0.12, width: mode.value === 'band' ? 3.5 : 2.5 });
          if (mode.value === 'comb') {
            const ctx = s.ctx; ctx.fillStyle = v.color('teal', 0.55);
            for (const w of W) {
              let sw = 0, x = 0, y = 0;
              for (let i = 0; i < cnt.value; i++) { sw += w[i]; x += w[i] * pts[i][0]; y += w[i] * pts[i][1]; }
              x /= sw; y /= sw; ctx.fillRect(s.X(x) - 1.5, s.Y(y) - 1.5, 3, 3);
            }
          }
          // query point: edge test and convex-combination (fan triangle) test
          const inside = inConvex(hp, Q);
          let comb = null;
          if (hp.length >= 3) {
            for (let k = 1; k < hp.length - 1 && !comb; k++) {
              const A = hp[0], B = hp[k], C = hp[k + 1], T = cross(A, B, C);
              const l1 = cross(Q, B, C) / T, l2 = cross(A, Q, C) / T, l3 = cross(A, B, Q) / T;
              if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) comb = { w: [l1, l2, l3], tri: [A, B, C], ids: [hi[0], hi[k], hi[k + 1]] };
            }
            if (comb && mode.value === 'comb') {
              s.poly(comb.tri, { color: 'green', fill: 'green', fillAlpha: 0.18, width: 1.5 });
              comb.tri.forEach((P) => s.segment(P, Q, { color: 'green', width: 1.5, dash: true }));
            }
          }
          pts.forEach((p, i) => s.dot(p[0], p[1], { r: on.has(i) ? 5 : 3.5, color: on.has(i) ? 'accent' : 'muted', hollow: !on.has(i) }));
          info = { n: pts.length, h: hp.length, area: polyArea(hp), inside, comb };
        });
        v.readout(() => `hull: **${info.h}** of ${info.n} points are vertices; area $=${f2(info.area)}$.\n$q$ ${info.inside ? 'is **inside**' : 'is **outside**'} the hull (left of every edge)` + (info.comb ? ` — and $q=${info.comb.w.map((w, i) => `${f2(w)}\\,p_{${info.comb.ids[i] + 1}}`).join('+')}$, weights $\\ge0$ summing to $${f2(info.comb.w[0] + info.comb.w[1] + info.comb.w[2])}$.` : info.inside ? '.' : ' — no convex combination of the points equals it.'));
      },
    },
    // ================================================================== 2.3
    {
      num: '2.3', kind: 'Theorem', name: 'Radon’s theorem',
      statement: String.raw`Any set of $d+2$ points in $\R^d$ can be split into two disjoint groups whose convex hulls intersect. In the plane: any four points $p_1,\dots,p_4$ admit a partition $\{1,2,3,4\}=I\sqcup J$ with $\operatorname{conv}\{p_i:i\in I\}\cap\operatorname{conv}\{p_j:j\in J\}\neq\emptyset$; a common point is called a **Radon point**. Three points (only $d+1$) can fail to admit such a partition.`,
      idea: String.raw`The $d+2$ vectors $(p_i,1)\in\R^{d+1}$ must be linearly dependent: $\sum\lambda_ip_i=0$ and $\sum\lambda_i=0$ with $\lambda\neq0$ (a null vector of a $(d+1)\times(d+2)$ matrix). Put $I=\{\lambda_i>0\}$, $J=\{\lambda_i<0\}$ and $\Lambda=\sum_{i\in I}\lambda_i=\sum_{j\in J}|\lambda_j|>0$. Then $\sum_{I}\frac{\lambda_i}{\Lambda}p_i=\sum_J\frac{|\lambda_j|}{\Lambda}p_j$ is a convex combination on both sides, hence a point of both hulls (convex combinations are the hull, 2.1). With only $d+1$ affinely independent points no non-trivial dependence exists.

The nonzero coefficient vector comes from LADR 3.26: the augmented coordinate matrix has $d+1$ equations but $d+2$ unknown coefficients, so its homogeneous system has a nonzero solution. The last row forces their sum to zero, hence there must be both positive and negative coefficients. Normalizing each sign class by the same positive total gives the two convex combinations above; indices with zero coefficient can be assigned to either class without changing the common point.`,
      caption: String.raw`Drag the points. The blue and red groups come from the signs of the affine dependence $\lambda$; their hulls (point, segment or triangle) always share the gold Radon point. Four points in convex position pair up as two crossing diagonals; if one point is inside the triangle of the other three it forms a group alone. With 5 or 6 points the dependence is one of several, so one of many partitions is shown. With 3 points there is nothing to find.`,
      credit: 'J. Radon, 1921',
      deps: ['cg-2.1', 'ladr-3.26'], refs: ['de Berg ch. 11'], tags: ['convexity', 'radon'],
      viz(v) {
        const s = gstage(v, { height: 360 });
        const M = v.M;
        const nn = v.select('points', [{ value: 3, label: '3' }, { value: 4, label: '4' }, { value: 5, label: '5' }, { value: 6, label: '6' }], 4);
        const init = [[2, 1.5], [7.8, 1.6], [6.6, 5.6], [2.6, 5.2], [4.8, 3.2], [5.6, 1.2]];
        const H = init.map(([x, y], i) => s.handle(x, y, { color: 'accent', r: 6, label: String(i + 1), labelPos: i % 2 ? 'ne' : 'nw' }));
        let info = {};
        v.render(() => {
          const n = +nn.value; H.forEach((h, i) => { h.visible = i < n; });
          const pts = H.slice(0, n).map((h) => [h.x, h.y]);
          const A = [pts.map((p) => p[0]), pts.map((p) => p[1]), pts.map(() => 1)];
          const ns = M.nullspace(A, 1e-9);
          s.poly(hull2(pts).map((i) => pts[i]), { color: 'faint', width: 1, dash: true });
          if (!ns.length) {
            info = { none: true, n };
            pts.forEach((p, i) => s.dot(p[0], p[1], { r: 5, color: 'accent' }));
            return;
          }
          let lam = ns[0].slice();
          const big = lam.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0);
          lam = lam.map((x) => (Math.abs(x) < 1e-9 ? 0 : x)); if (lam.every((x) => x === 0)) lam = ns[0];
          const I = [], J = [];
          lam.forEach((x, i) => { if (x > 0) I.push(i); else if (x < 0) J.push(i); });
          if (!I.length || !J.length) { info = { none: true, n }; return; }
          let L = 0; I.forEach((i) => { L += lam[i]; });
          const rx = I.reduce((a, i) => a + (lam[i] * pts[i][0]) / L, 0), ry = I.reduce((a, i) => a + (lam[i] * pts[i][1]) / L, 0);
          const sx = J.reduce((a, j) => a + (lam[j] * pts[j][0]) / -L, 0), sy = J.reduce((a, j) => a + (lam[j] * pts[j][1]) / -L, 0);
          const hi = (G) => { const g = G.map((i) => pts[i]); return hull2(g).map((k) => g[k]); };
          const hI = hi(I), hJ = hi(J);
          drawGroup(s, hI, 'blue'); drawGroup(s, hJ, 'red');
          pts.forEach((p, i) => s.dot(p[0], p[1], { r: 5, color: lam[i] > 0 ? 'blue' : lam[i] < 0 ? 'red' : 'muted' }));
          s.dot(rx, ry, { r: 8, color: 'gold', label: 'Radon point', labelPos: 'e' });
          info = { I, J, lam, big, inI: inConvex(hI, [rx, ry], 1e-7), inJ: inConvex(hJ, [rx, ry], 1e-7), gap: Math.hypot(rx - sx, ry - sy), rx, ry, n,
            res: Math.hypot(...[0, 1].map((c) => pts.reduce((a, p, i) => a + lam[i] * p[c], 0))), sum: lam.reduce((a, b) => a + b, 0) };
        });
        v.readout(() => info.none ? `$${info.n}$ points = only $d+1$ in the plane: the vectors $(p_i,1)$ are independent, no affine dependence exists, and no partition has intersecting hulls (move the points anywhere — the three hulls $\\{p_i\\}$ and $\\operatorname{conv}\\{p_j,p_k\\}$ stay apart unless collinear).`
          : `partition $\\{${info.I.map((i) => i + 1)}\\}\\ |\\ \\{${info.J.map((i) => i + 1)}\\}$ from $\\lambda=(${info.lam.map((x) => f2(x / Math.abs(info.big))).join(',\\,')})$ \n$\\sum\\lambda_i p_i$ has norm $${v.sci(info.res, 2)}$, $\\sum\\lambda_i=${v.sci(Math.abs(info.sum), 2)}$; Radon point $=(${f2(info.rx)},${f2(info.ry)})$ lies in both hulls: ${info.inI && info.inJ ? '**yes**' : 'no'} (the two expressions agree to $${v.sci(info.gap, 1)}$).`);
      },
    },
    // ================================================================== 2.4
    {
      num: '2.4', kind: 'Theorem', name: 'Helly’s theorem',
      statement: String.raw`Let $C_1,\dots,C_m$ be convex sets in $\R^d$, $m\ge d+1$ (finitely many, or compact if infinitely many). If every $d+1$ of them have a common point, then all of them have a common point. In the plane ($d=2$) pairs do not suffice, but every **three** sets meeting does. The convexity hypothesis cannot be dropped.`,
      idea: String.raw`Induct on $m$, the case $m=d+1$ being trivial. For $m\ge d+2$ the induction hypothesis gives, for each $i$, a point $x_i$ lying in all sets except possibly $C_i$. The $m\ge d+2$ points $x_i$ have a Radon partition (2.3), $\{1..m\}=I\sqcup J$ with a point $x\in\operatorname{conv}\{x_i\}_I\cap\operatorname{conv}\{x_j\}_J$. Each $x_i$ with $i\in I$ lies in every $C_j$, $j\in J$, so by convexity $x$ lies in every $C_j$, $j\in J$; symmetrically $x\in C_i$ for $i\in I$. Hence $x\in\bigcap C_k$.

The induction proves the finite-family theorem. For the stated infinite compact-family version, apply that finite theorem to every finite subfamily (smaller subfamilies can be enlarged to $d+1$ members). They therefore have the finite intersection property. PMA 2.36 then gives a common point of the entire family of compact sets. Compactness is the extra step here: the finite induction alone does not prove the infinite conclusion.`,
      caption: String.raw`**Convex blobs**: drag the six ellipses (and shrink them with the size slider); the green region is their common intersection. As long as every triple meets, a green region exists; once a single triple stops meeting, the readout names it and the intersection is gone. **Non-convex**: set $C_i$ is the union of the three discs around the points $v_j$, $j\neq i$. Every three of the four sets share a disc, yet no point lies in all four — drag the points or grow the radius until the discs overlap and convexity (hypothesis) is replaced by accident. Sampled on a grid of cell $0.09$.`,
      credit: 'E. Helly, 1913 (published 1923)',
      deps: ['cg-2.3', 'pma-2.36'], refs: ['de Berg ch. 11'], tags: ['convexity', 'helly'],
      viz(v) {
        const s = gstage(v, { height: 360 });
        const fam = v.select('family', [{ value: 'convex', label: 'convex blobs' }, { value: 'union', label: 'non-convex (unions)' }], 'convex', { onChange: () => sync() });
        const cnt = v.slider('sets', 3, 6, 6, { int: true });
        const size = v.slider('size', 0.5, 1.6, 1, { step: 0.02 });
        const rad = v.slider('disc radius', 0.4, 2.4, 0.85, { step: 0.02 });
        // convex family: ellipses
        const E = [[3.9, 3.4, 5.2, 3.0, 0.5], [5.2, 4.4, 4.6, 2.8, -0.6], [6.2, 3.4, 5.0, 3.0, 0.2], [5.0, 2.6, 5.2, 2.6, 0.0], [4.4, 3.8, 4.0, 3.8, 0], [5.8, 3.8, 3.6, 2.6, 1.2]];
        const EH = E.map(([x, y], i) => s.handle(x, y, { color: SET[i], r: 6, label: 'C' + (i + 1), labelPos: 'n' }));
        const VH = [[2.2, 1.3], [7.8, 1.5], [7.4, 5.6], [2.6, 5.4]].map(([x, y], i) => s.handle(x, y, { color: 'accent', r: 6, label: 'v' + (i + 1), labelPos: 'n' }));
        const sync = () => { const c = fam.value === 'convex'; cnt.el.hidden = !c; size.el.hidden = !c; rad.el.hidden = c; EH.forEach((h) => { h.visible = c; }); VH.forEach((h) => { h.visible = !c; }); };
        sync();
        const mem = (x, y) => {
          let m = 0;
          if (fam.value === 'convex') {
            for (let i = 0; i < cnt.value; i++) {
              const [, , a, b, th] = E[i], dx = x - EH[i].x, dy = y - EH[i].y, c = Math.cos(th), sn = Math.sin(th);
              const u = (dx * c + dy * sn) / (a * size.value * 0.5), w = (-dx * sn + dy * c) / (b * 0.5 * size.value);
              if (u * u + w * w <= 1) m |= 1 << i;
            }
          } else {
            const r2 = rad.value ** 2, near = VH.map((h) => (x - h.x) ** 2 + (y - h.y) ** 2 <= r2);
            for (let i = 0; i < 4; i++) { let ok = false; for (let j = 0; j < 4; j++) if (j !== i && near[j]) ok = true; if (ok) m |= 1 << i; }
          }
          return m;
        };
        let stat = {}, tick = 0;
        v.render(() => {
          tick++;
          const n = fam.value === 'convex' ? cnt.value : 4, full = (1 << n) - 1;
          v.legend(SET.slice(0, n).map((c, i) => [c, 'C' + (i + 1)]));
          const tri = [], pr = [];
          for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { pr.push([1 << a | 1 << b, [a, b]]); for (let c = b + 1; c < n; c++) tri.push([1 << a | 1 << b | 1 << c, [a, b, c]]); }
          const tOK = new Uint8Array(tri.length), pOK = new Uint8Array(pr.length); let all = false, cxs = 0, cys = 0, cn = 0;
          const GX = 110, GY = 77;
          for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
            const x = (gx + 0.5) * (10 / GX), y = (gy + 0.5) * (7 / GY), m = mem(x, y);
            if (!m) continue;
            if (m === full) { all = true; cxs += x; cys += y; cn++; }
            for (let t = 0; t < tri.length; t++) if ((m & tri[t][0]) === tri[t][0]) tOK[t] = 1;
            for (let t = 0; t < pr.length; t++) if ((m & pr[t][0]) === pr[t][0]) pOK[t] = 1;
          }
          // draw
          if (fam.value === 'convex') {
            for (let i = 0; i < n; i++) {
              const [, , a, b, th] = E[i];
              s.curve((t) => { const u = 0.5 * a * size.value * Math.cos(t), w = 0.5 * b * size.value * Math.sin(t); return [EH[i].x + u * Math.cos(th) - w * Math.sin(th), EH[i].y + u * Math.sin(th) + w * Math.cos(th)]; }, 0, 2 * Math.PI, { n: 72, color: SET[i], fill: SET[i], fillAlpha: 0.1, width: 2 });
            }
          } else {
            for (let j = 0; j < 4; j++) s.circle(VH[j].x, VH[j].y, rad.value, { color: 'ink', alpha: 0.35, width: 1 });
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (j !== i) s.circle(VH[j].x, VH[j].y, rad.value, { color: SET[i], fill: SET[i], fillAlpha: 0.14, stroke: false });
            for (let j = 0; j < 4; j++) s.text('in ' + [0, 1, 2, 3].filter((i) => i !== j).map((i) => 'C' + (i + 1)).join(', '), VH[j].x, VH[j].y, { size: 11, dy: 22, align: 'center', color: 'ink' });
          }
          s.raster((x, y) => (mem(x, y) === full ? [...v.rgb('green').slice(0, 3), 0.7] : null), { res: 3, key: 'c' + tick });
          if (all) s.dot(cxs / cn, cys / cn, { r: 5, color: 'gold' });
          const bad = tri.findIndex((_, t) => !tOK[t]);
          stat = { n, T: tri.length, P: pr.length, tOK: tOK.reduce((a, b) => a + b, 0), pOK: pOK.reduce((a, b) => a + b, 0), all, bad: bad >= 0 ? tri[bad][1] : null, area: cn * (10 / GX) * (7 / GY) };
        });
        v.readout(() => `pairs meeting: **${stat.pOK}/${stat.P}**; triples meeting: **${stat.tOK}/${stat.T}**; all ${stat.n} sets share a point: **${stat.all ? 'yes' : 'no'}**` + (stat.all ? ` (area $\\approx${f2(stat.area)}$)` : '') + '.\n' +
          (stat.tOK === stat.T ? (stat.all ? 'Every triple meets and so does the whole family — Helly\'s conclusion.' : '**Every triple meets but the family has no common point: the sets are not all convex — Helly fails.**') : `Triple $\\{${(stat.bad || []).map((i) => i + 1)}\\}$ has no common point, so the hypothesis does not hold${stat.all ? ' (!)' : ' and nothing is promised'}.`));
      },
    },
    // ================================================================== 2.5
    {
      num: '2.5', kind: 'Algorithm', name: 'Gift wrapping (Jarvis march)',
      statement: String.raw`Start at the leftmost point $p_0$ of $S$, a vertex of the hull. Given the current hull vertex $p$, the next vertex is the point $q$ such that no other point of $S$ lies to the right of the directed line $p\to q$ (among collinear candidates, the farthest); find it by one scan, keeping a candidate $q$ and replacing it by $r$ whenever $r$ lies to the right of $p\to q$. Stop on returning to $p_0$. For $n$ points with $h$ hull vertices the algorithm makes $(n-2)h$ orientation tests and runs in $O(nh)$ time — worst case $O(n^2)$ when all points are vertices.`,
      idea: String.raw`The scan is a maximum search under the "to the right of" order seen from $p$, which is a total order on the points once $p$ is a hull vertex (all other points lie in a half-plane through $p$, so angles around $p$ are comparable); each comparison is the orientation predicate of 1.2. The maximal point has all others on its left, so it is the next hull edge. One scan costs $n-2$ tests and there is one scan per hull vertex.`,
      caption: String.raw`Step through the first wrapping step comparison by comparison (the orange line is the point being tried, the green line the best candidate so far), then through the rest one hull vertex at a time. Change the distribution: random points in a disc have few hull vertices, points on a circle all of them, and the right-hand log–log plot shows the number of tests always lands on the diagonal at $n\cdot h$.`,
      credit: 'R. A. Jarvis, 1973',
      deps: ['cg-2.1', 'cg-1.2'], refs: ['de Berg §1.1'], tags: ['hull', 'algorithm'],
      viz(v) {
        const s = gstage(v, { x: [-1.3, 1.3], y: [-1.2, 1.2], height: 380, minWidth: 340 });
        const dist = v.select('points', [{ value: 'disc', label: 'in a disc' }, { value: 'square', label: 'in a square' }, { value: 'circle', label: 'on a circle' }], 'disc', { onChange: () => regen() });
        const nsl = v.slider('$n$', 6, 60, 24, { int: true, onChange: () => regen() });
        let seed = 3, P = [], S;
        const regen = () => { P = genPts(v.rng(seed), dist.value, nsl.value, 0, 0, 1); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        s.onClick((x, y, mod) => {
          if (mod.shift) { let b = -1, bd = 0.01; P.forEach((p, i) => { const d = d2(p, [x, y]); if (d < bd) { bd = d; b = i; } }); if (b >= 0 && P.length > 3) P.splice(b, 1); } else P.push([x, y]);
          S.reset();
        });
        P = genPts(v.rng(seed), dist.value, nsl.value, 0, 0, 1);
        const build = () => {
          const J = jarvis(P), fr = []; let tests = 0;
          const hull = [J.hull[0]];
          fr.push({ hull: hull.slice(), cur: J.hull[0], line: 1, tests, note: String.raw`Start at the leftmost point $p_0$ — certainly a hull vertex.`, vars: { tests, h: 1 } });
          J.steps.forEach((st, k) => {
            if (k === 0) {
              st.scan.forEach(([r, cand], t) => {
                tests++;
                fr.push({ hull: hull.slice(), cur: st.cur, probe: r, cand, line: 4, tests, note: t === 0 ? `Compare each point with the current candidate: is it to the right of the line from $p$ to the candidate?` : `Test ${tests}: point ${r + 1} ${cand === r ? 'is to the right — it becomes the candidate' : 'is on the left — keep the candidate'}.`, vars: { tests, h: hull.length } });
              });
            } else tests += st.scan.length;
            if (st.next !== J.hull[0]) hull.push(st.next);
            fr.push({ hull: hull.slice(), cur: st.next, from: st.cur, cand: st.next, all: true, line: 5, closed: st.next === J.hull[0], tests, note: st.next === J.hull[0] ? 'Back at $p_0$: the hull is closed.' : `All ${P.length - 2} other points are on the left of this edge, so it is a hull edge. Wrap on from the new vertex.`, vars: { tests, h: hull.length } });
          });
          return fr;
        };
        S = v.steps({ frames: build, code: ['p ← leftmost point', 'repeat', '  q ← any point other than p', '  for each other point r', '    if r is right of p→q:  q ← r', '  output edge p→q;  p ← q', 'until p is the starting point'], codeTitle: 'Gift wrapping', speed: 3, still: 12 });
        // cost scatter
        const C = v.stage({ x: [10, 1e5], y: [10, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'n · h', ylabel: 'orientation tests', title: 'cost = (n−2)·h on every input', height: 380, minWidth: 260 });
        const cloud = [];
        ['disc', 'square', 'circle'].forEach((d, di) => [8, 12, 20, 32, 50, 80, 125, 200, 300].forEach((n, ni) => { const J = jarvis(genPts(v.rng(40 + di * 10 + ni), d, n, 0, 0, 1)); cloud.push({ d, n, h: J.hull.length, tests: J.tests }); }));
        v.render(() => {
          const f = S.frame, hull = f.hull || [];
          P.forEach((p, i) => s.dot(p[0], p[1], { r: 3.5, color: 'muted' }));
          if (f.all && f.from != null) P.forEach((p, i) => { if (i !== f.from) s.segment(P[f.from], p, { color: 'faint', width: 1, alpha: 0.7 }); });
          if (hull.length > 1) s.path([...hull.map((i) => P[i]), ...(f.closed ? [P[hull[0]]] : [])], { color: 'accent', width: 3 });
          if (f.probe != null) { s.segment(P[f.cur], P[f.probe], { color: 'orange', width: 2 }); s.dot(P[f.probe][0], P[f.probe][1], { r: 6, color: 'orange' }); }
          if (f.cand != null && !f.all) { s.segment(P[f.cur], P[f.cand], { color: 'green', width: 2.5 }); s.dot(P[f.cand][0], P[f.cand][1], { r: 6, color: 'green' }); }
          if (f.all && f.cand != null && !f.closed) s.dot(P[f.cand][0], P[f.cand][1], { r: 6, color: 'green' });
          hull.forEach((i) => s.dot(P[i][0], P[i][1], { r: 5.5, color: 'accent' }));
          if (f.cur != null) s.dot(P[f.cur][0], P[f.cur][1], { r: 8, color: 'gold', hollow: true });
          s.corner(`n = ${P.length}`, 'bl');
          C.path([[10, 10], [1e5, 1e5]], { color: 'faint', dash: true });
          cloud.forEach((c) => C.dot(c.n * c.h, c.tests, { r: 4, color: c.d === 'circle' ? 'red' : c.d === 'disc' ? 'blue' : 'teal' }));
          const J = jarvis(P);
          C.dot(Math.max(10, P.length * J.hull.length), Math.max(10, J.tests), { r: 8, color: 'gold' });
        });
        v.legend([['blue', 'disc'], ['teal', 'square'], ['red', 'circle'], ['gold', 'your points']]);
        v.readout(() => { const J = jarvis(P); return `$n=${P.length}$ points, hull $h=${J.hull.length}$: total cost $(n-2)h=${(P.length - 2) * J.hull.length}$ tests (counted: $${J.tests}$); so far ${S.frame.tests ?? 0} tests.\nClick the left picture to add a point, shift-click to remove one.`; });
      },
    },
    // ================================================================== 2.6
    {
      num: '2.6', kind: 'Algorithm', name: 'Graham scan',
      statement: String.raw`Let $p_0$ be the lowest point of $S$ (leftmost among ties). Sort the other points by the angle of the ray from $p_0$ (nearer first on ties). Keep a stack, starting with $p_0,p_1$; for each next point $p_k$, pop the stack while its top two elements and $p_k$ do not make a left turn, then push $p_k$. At the end the stack holds the hull vertices in counter-clockwise order. The scan makes at most $n$ pushes and hence at most $n$ pops, so the total time is $O(n\log n)$, dominated by the sort.`,
      idea: String.raw`Sorted by angle the points form a star-shaped polygon around $p_0$, and the scan is a repair of its reflex vertices: the top of the stack $b$ is a hull vertex of the points seen so far unless $a\to b\to p_k$ turns right (orientation, 1.2), in which case $b$ lies inside triangle $p_0ap_k$ and is discarded for ever. Each point is pushed once and popped at most once, so the loop is linear after sorting. The stack invariant is that it holds the hull of $p_0,\dots,p_k$.`,
      caption: String.raw`Step through. Faint numbers give the angular order about the pivot; the dashed edge from the stack top to the new point is green for a left turn (accept) and red for a right turn (pop). Popped points turn grey and never return. The graph at right records the stack size over time: the push and pop counters never exceed $n$ and $n-3$.`,
      credit: 'R. L. Graham, 1972',
      deps: ['cg-2.5'], refs: ['de Berg §1.1'], tags: ['hull', 'algorithm'],
      viz(v) {
        const s = gstage(v, { x: [-1.3, 1.3], y: [-1.2, 1.2], height: 380, minWidth: 340 });
        const dist = v.select('points', [{ value: 'disc', label: 'in a disc' }, { value: 'square', label: 'in a square' }, { value: 'gauss', label: 'Gaussian' }], 'disc', { onChange: () => regen() });
        const nsl = v.slider('$n$', 6, 36, 20, { int: true, onChange: () => regen() });
        let seed = 5, P = [], S, T;
        const regen = () => { P = genPts(v.rng(seed), dist.value, nsl.value, 0, 0, 1); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        s.onClick((x, y, mod) => {
          if (mod.shift) { let b = -1, bd = 0.01; P.forEach((p, i) => { const d = d2(p, [x, y]); if (d < bd) { bd = d; b = i; } }); if (b >= 0 && P.length > 3) P.splice(b, 1); } else P.push([x, y]);
          S.reset();
        });
        P = genPts(v.rng(seed), dist.value, nsl.value, 0, 0, 1);
        const build = () => {
          T = grahamTrace(P);
          return T.frames.map((f, i) => ({ ...f, i,
            line: f.kind === 'sorted' ? 1 : f.kind === 'test' ? 3 : f.kind === 'pop' ? 4 : f.kind === 'push' ? 5 : 6,
            note: f.kind === 'sorted' ? 'Sort by angle about the lowest point $p_0$; push $p_0$ and $p_1$.' : f.kind === 'test' ? `Point ${T.rank.get(f.cand)}: does ${T.rank.get(f.tri[0])}→${T.rank.get(f.tri[1])}→${T.rank.get(f.tri[2])} turn left? ${f.turn > 0 ? 'Yes — keep the top.' : 'No — the top is inside the hull of the points so far.'}`
              : f.kind === 'pop' ? `Pop point ${T.rank.get(f.popped)}; it can never be a hull vertex.` : f.kind === 'push' ? `Push point ${T.rank.get(f.cand)}.` : 'Done: the stack is the hull, counter-clockwise.',
            vars: { pushes: f.pushes, pops: f.pops, stack: f.stack.length } }));
        };
        S = v.steps({ frames: build, code: ['sort the points by angle about p₀', 'push p₀, p₁', 'for k ← 2 … n−1', '  while (next-to-top, top, pₖ) is not a left turn', '    pop', '  push pₖ', 'return the stack'], codeTitle: 'Graham scan', speed: 3, still: 20 });
        const G = v.stage({ x: [0, 60], y: [0, 40], axes: 'box', gutter: true, xlabel: 'step', ylabel: 'stack size', title: 'stack size over time', height: 380, minWidth: 260 });
        v.render(() => {
          const f = S.frame, st = new Set(f.stack || []), gone = new Set(f.gone || []);
          if (!T) return;
          T.order.forEach((p, k) => { if (k > 0) s.segment(P[T.order[0]], P[p], { color: 'faint', width: 0.8, alpha: 0.5 }); });
          const stk = (f.stack || []).map((i) => P[i]);
          if (stk.length > 1) s.path(stk, { color: 'accent', width: 3 });
          if (f.kind === 'test') { const top = P[f.tri[1]], c = P[f.cand]; s.segment(top, c, { color: f.turn > 0 ? 'green' : 'red', width: 2.5, dash: true }); }
          if (f.kind === 'pop') s.dot(P[f.popped][0], P[f.popped][1], { r: 9, color: 'red', hollow: true });
          if (f.kind === 'done' && stk.length > 2) s.poly(stk, { color: 'green', fill: 'green', fillAlpha: 0.1, width: 3 });
          T.order.forEach((p, k) => {
            const col = st.has(p) ? 'accent' : gone.has(p) ? 'muted' : 'ink';
            s.dot(P[p][0], P[p][1], { r: st.has(p) ? 5.5 : 4, color: col, hollow: !st.has(p) && !gone.has(p), alpha: gone.has(p) ? 0.6 : 1 });
            s.text(String(k), P[p][0], P[p][1], { size: 10, dx: 8, dy: -8, color: gone.has(p) ? 'faint' : 'muted' });
          });
          if (f.cand != null && f.kind !== 'done') s.dot(P[f.cand][0], P[f.cand][1], { r: 8, color: 'gold', hollow: true });
          // stack-size graph
          const N = T.frames.length; G.setView([0, N], [0, Math.max(6, P.length + 1)]);
          G.path(T.frames.map((fr, i) => [i, fr.stack.length]), { color: 'accent', width: 2 });
          G.hline(P.length, { color: 'red', dash: true, width: 1 });
          G.dot(S.i, (T.frames[S.i] || T.frames[0]).stack.length, { r: 6, color: 'gold' });
          G.text('n', 0.02 * N, P.length, { dy: -8, color: 'red', size: 11 });
        });
        v.readout(() => { const f = S.frame; return `$n=${P.length}$ points; pushes **${f.pushes ?? 0}** $\\le n$, pops **${f.pops ?? 0}** $\\le n-3$, stack **${(f.stack || []).length}**.` + (f.kind === 'done' ? `\nHull has ${f.stack.length} vertices; it agrees with the monotone-chain hull: ${hull2(P).length === f.stack.length && hull2(P).every((i) => f.stack.includes(i)) ? '**yes**' : 'no'}.` : '\nClick the left picture to add a point (shift-click removes one).'); });
      },
    },
    // ================================================================== 2.7
    {
      num: '2.7', kind: 'Algorithm', name: 'Divide and conquer and Quickhull',
      statement: String.raw`Two recursive hull algorithms. **Quickhull**: take the leftmost point $a$ and the rightmost $b$; for the points on one side of $ab$, find the point $f$ farthest from the line, discard everything inside triangle $afb$, and recurse on the points outside $af$ and outside $fb$; do the same on the other side. **Divide and conquer**: sort by $x$, split into halves, compute their hulls recursively and merge them by finding the upper and lower common tangents (the bridges) in linear time. Divide and conquer runs in $\Theta(n\log n)$; Quickhull in $O(n\log n)$ expected on random points but $\Theta(n^2)$ in the worst case.`,
      idea: String.raw`The farthest point $f$ from line $ab$ is a hull vertex (a supporting line parallel to $ab$ touches it), and the triangle $afb$ lies in the hull, so its interior points are discarded — the recursion partitions like quicksort, and like quicksort an unlucky pivot gives unbalanced splits. For divide and conquer, merging two hulls separated by a vertical line needs only the two bridges, found by walking the tangents, so $T(n)=2T(n/2)+O(n)$. Both rely on the orientation predicate (1.2) and the hull definition (2.1).`,
      caption: String.raw`Choose the algorithm and the input, then step. In Quickhull the gold point is the farthest point from the chord, the shaded triangle is discarded, and the right panel draws the recursion tree with the subset sizes. On the **adversarial arc** (points at angles $\pi 2^{-k}$ on a circle) every farthest point leaves all the others on one side: the tree degenerates into a path and the work grows like $n^2/2$. Divide and conquer draws a perfect tree whatever the input.`,
      credit: 'Quickhull: W. Eddy, A. Bykat, 1977–78; divide and conquer: F. Preparata & S. J. Hong, 1977',
      deps: ['cg-2.5'], refs: ['de Berg §1.4'], tags: ['hull', 'algorithm', 'recursion'],
      viz(v) {
        const s = gstage(v, { x: [-1.3, 1.3], y: [-1.15, 1.15], height: 390, minWidth: 340 });
        const alg = v.select('algorithm', [{ value: 'qh', label: 'Quickhull' }, { value: 'dc', label: 'divide & conquer' }], 'qh', { onChange: () => regen() });
        const dist = v.select('points', [{ value: 'disc', label: 'random in a disc' }, { value: 'arc', label: 'adversarial arc' }], 'disc', { onChange: () => regen() });
        const nsl = v.slider('$n$', 8, 28, 20, { int: true, onChange: () => regen() });
        let seed = 11, P = [], S, tree, TR = null;
        const mkPts = () => {
          const n = nsl.value;
          if (dist.value === 'arc') { const A = [[1, 0], [-1, 0]]; for (let k = 1; k <= n - 2; k++) A.push([Math.cos(Math.PI * 2 ** -k), Math.sin(Math.PI * 2 ** -k)]); return A.map(([x, y]) => [x, y * 0.95 - 0.35]); }
          return genPts(v.rng(seed), 'disc', n, 0, 0, 1);
        };
        const regen = () => { P = mkPts(); if (S) S.reset(); };
        v.button('resample', () => { seed++; regen(); });
        // ---------- Quickhull trace
        function quickhull(P) {
          const n = P.length; let a = 0, b = 0;
          for (let i = 1; i < n; i++) { if (P[i][0] < P[a][0]) a = i; if (P[i][0] > P[b][0]) b = i; }
          const status = new Uint8Array(n); status[a] = status[b] = 1;
          const nodes = [], frames = []; let work = 0;
          const rec = (A, B, Sset, depth, parent) => {
            const id = nodes.length, node = { id, size: Sset.length, kids: [], depth, parent, a: A, b: B };
            nodes.push(node);
            if (!Sset.length) return id;
            let f = Sset[0], fd = cross(P[A], P[B], P[f]);
            for (const q of Sset) { const c = cross(P[A], P[B], P[q]); if (c > fd) { fd = c; f = q; } }
            work += Sset.length;
            const S1 = Sset.filter((q) => q !== f && cross(P[A], P[f], P[q]) > 0), S2 = Sset.filter((q) => q !== f && cross(P[f], P[B], P[q]) > 0);
            const keep = new Set([f, ...S1, ...S2]);
            const disc = Sset.filter((q) => !keep.has(q));
            status[f] = 1; disc.forEach((q) => { status[q] = 2; });
            node.f = f; node.S = Sset; node.work = work;
            frames.push({ nid: id, A, B, f, S: Sset, S1, S2, status: status.slice(), work, kind: 'qh', note: `Chord $${A + 1}\\to${B + 1}$ with ${Sset.length} points outside: the farthest one (point ${f + 1}) is a hull vertex; ${disc.length} point${disc.length === 1 ? ' falls' : 's fall'} inside the triangle and ${disc.length === 1 ? 'is' : 'are'} discarded. Recurse on ${S1.length} and ${S2.length}.`, vars: { work, '|S|': Sset.length } });
            const k1 = rec(A, f, S1, depth + 1, id), k2 = rec(f, B, S2, depth + 1, id);
            node.kids = [k1, k2].filter((k) => nodes[k].size > 0);
            return id;
          };
          const up = [], lo = [];
          for (let i = 0; i < n; i++) { if (i === a || i === b) continue; const c = cross(P[a], P[b], P[i]); if (c > 0) up.push(i); else if (c < 0) lo.push(i); }
          const root = { id: -1 };
          nodes.push({ id: 0, size: n - 2, kids: [], depth: 0, parent: -1, root: true });
          const u = rec(a, b, up, 1, 0), l = rec(b, a, lo, 1, 0);
          nodes[0].kids = [u, l].filter((k) => nodes[k].size > 0);
          frames.push({ nid: -1, status: status.slice(), work, kind: 'end', note: `Done: ${status.reduce((c, x) => c + (x === 1), 0)} hull vertices, total work $\\sum|S|=${work}$.`, vars: { work } });
          frames.unshift({ nid: -1, status: (() => { const z = new Uint8Array(n); z[a] = z[b] = 1; return z; })(), work: 0, kind: 'start', note: `The leftmost point ${a + 1} and rightmost point ${b + 1} are hull vertices. Quickhull handles the points above and below the line separately.`, vars: { work: 0 } });
          return { nodes, frames, work, a, b };
        }
        // ---------- divide and conquer trace
        function dandc(P) {
          const n = P.length, ord = P.map((_, i) => i).sort((i, j) => P[i][0] - P[j][0] || P[i][1] - P[j][1]);
          const nodes = [], frames = [], done = []; let work = 0;
          const rec = (lo, hi, depth, parent) => {
            const id = nodes.length, node = { id, size: hi - lo, kids: [], depth, parent }; nodes.push(node);
            if (hi - lo <= 2) {
              const h = hull2(ord.slice(lo, hi).map((i) => P[i])).map((k) => ord[lo + k]); done.push(h); work += hi - lo;
              frames.push({ nid: id, hulls: done.map((h2) => h2.slice()), merge: null, work, kind: 'dc', note: `Base case: ${hi - lo} point${hi - lo === 1 ? '' : 's'} — its hull is trivial.`, vars: { work } });
              return id;
            }
            const mid = (lo + hi) >> 1, k1 = rec(lo, mid, depth + 1, id), k2 = rec(mid, hi, depth + 1, id); node.kids = [k1, k2];
            const R = done.pop(), L = done.pop(), all = L.concat(R), mh = hull2(all.map((i) => P[i])).map((k) => all[k]);
            const Ls = new Set(L), bridges = [];
            for (let k = 0; k < mh.length; k++) { const x = mh[k], y = mh[(k + 1) % mh.length]; if (Ls.has(x) !== Ls.has(y)) bridges.push([x, y]); }
            done.push(mh); work += L.length + R.length;
            frames.push({ nid: id, hulls: done.map((h2) => h2.slice()), merge: { L, R, M: mh, bridges }, work, kind: 'dc', note: `Merge the hulls of ${L.length} and ${R.length} vertices: two common tangents (gold bridges) join them, costing time linear in $${L.length}+${R.length}$. The result has ${mh.length} vertices.`, vars: { work, merged: mh.length } });
            return id;
          };
          rec(0, n, 0, -1);
          return { nodes, frames, work };
        }
        P = mkPts();
        const build = () => { TR = alg.value === 'qh' ? quickhull(P) : dandc(P); return TR.frames; };
        const codeQ = ['a, b ← leftmost, rightmost point', 'QUICKHULL(a, b, S):', '  if S is empty:  return', '  f ← point of S farthest from line ab', '  discard the points inside triangle afb', '  QUICKHULL(a, f, points right of af)', '  QUICKHULL(f, b, points right of fb)'];
        const codeD = ['sort the points by x', 'HULL(P):', '  if |P| ≤ 2:  return P', '  L ← HULL(left half);  R ← HULL(right half)', '  find the upper and lower bridges of L and R', '  return the merged hull (walk the tangents)'];
        S = v.steps({ frames: build, code: alg.value === 'qh' ? codeQ : codeD, codeTitle: 'Hull', speed: 2.5, still: 4 });
        const prevAlg = { v: alg.value };
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, minWidth: 260, title: 'recursion tree (node = number of points in the subproblem)' });
        const NC = ['blue', 'orange', 'teal', 'purple', 'pink', 'red'];
        v.render(() => {
          if (prevAlg.v !== alg.value) { prevAlg.v = alg.value; S.setCode(alg.value === 'qh' ? codeQ : codeD, alg.value === 'qh' ? 'Quickhull' : 'Divide and conquer'); }
          const f = S.frame; if (!TR) return;
          // ---- left panel
          if (alg.value === 'qh') {
            const st = f.status || new Uint8Array(P.length);
            if (f.f != null) {
              s.poly([P[f.A], P[f.f], P[f.B]], { color: 'orange', fill: 'orange', fillAlpha: 0.2, width: 1.5 });
              s.segment(P[f.A], P[f.B], { color: 'ink', width: 2 });
              f.S.forEach((q) => s.dot(P[q][0], P[q][1], { r: 4.5, color: 'blue' }));
            }
            // hull edges known: chain of vertices
            const hv = P.map((_, i) => i).filter((i) => st[i] === 1);
            if (hv.length > 2) { const hh = hull2(hv.map((i) => P[i])).map((k) => hv[k]); s.path([...hh, hh[0]].map((i) => P[i]), { color: 'accent', width: 2.5 }); }
            P.forEach((p, i) => s.dot(p[0], p[1], { r: st[i] === 1 ? 5.5 : 3.5, color: st[i] === 1 ? 'accent' : st[i] === 2 ? 'muted' : 'ink', alpha: st[i] === 2 ? 0.5 : 1, hollow: st[i] === 0 }));
            if (f.f != null) s.dot(P[f.f][0], P[f.f][1], { r: 8, color: 'gold' });
          } else {
            P.forEach((p) => s.dot(p[0], p[1], { r: 3.5, color: 'muted' }));
            (f.hulls || []).forEach((h, k) => { const pts = h.map((i) => P[i]); drawGroup(s, pts, NC[k % NC.length], { fillAlpha: 0.1, width: 2 }); });
            if (f.merge) {
              const m = f.merge.M.map((i) => P[i]); if (m.length > 2) s.poly(m, { color: 'accent', width: 3, fill: 'accent', fillAlpha: 0.08 }); else drawGroup(s, m, 'accent');
              f.merge.bridges.forEach(([x, y]) => s.segment(P[x], P[y], { color: 'gold', width: 4.5 }));
              s.poly(f.merge.L.map((i) => P[i]).length > 2 ? f.merge.L.map((i) => P[i]) : [], { color: 'blue', width: 1.5, dash: true });
            }
            // split lines
            P.forEach((p, i) => s.dot(p[0], p[1], { r: 3.5, color: 'ink' }));
          }
          // ---- tree
          const nodes = TR.nodes, pos = new Map(); let leaf = 0, maxd = 0;
          const lay = (id) => { const nd = nodes[id]; maxd = Math.max(maxd, nd.depth); if (!nd.kids.length) { pos.set(id, leaf++); return; } nd.kids.forEach(lay); pos.set(id, nd.kids.reduce((a, k) => a + pos.get(k), 0) / nd.kids.length); };
          lay(0);
          const nl = Math.max(leaf, 1), X = (id) => (pos.get(id) + 0.5) / nl, Y = (id) => 1 - (nodes[id].depth + 0.5) / (maxd + 1);
          const seen = new Set(); (TR.frames || []).forEach((fr, i) => { if (i <= S.i && fr.nid >= 0) seen.add(fr.nid); });
          const r = Math.max(7, Math.min(15, 150 / (maxd + 2), 260 / nl));
          nodes.forEach((nd) => { if (!pos.has(nd.id)) return; nd.kids.forEach((k) => T.segment([X(nd.id), Y(nd.id)], [X(k), Y(k)], { color: 'faint', width: 1.2 })); });
          nodes.forEach((nd) => {
            if (!pos.has(nd.id)) return;
            const cur = f.nid === nd.id;
            T.dot(X(nd.id), Y(nd.id), { r, color: cur ? 'gold' : seen.has(nd.id) ? 'accent' : 'muted', hollow: true });
            T.text(String(nd.size), X(nd.id), Y(nd.id), { size: Math.max(8, Math.min(12, r)), align: 'center', baseline: 'middle', color: 'ink' });
          });
        });
        v.readout(() => { const n = P.length, lg = Math.log2(n); return `$n=${n}$; work so far $=${S.frame.work ?? 0}$ of a final $${TR ? TR.work : 0}$   (reference: $n\\log_2n=${Math.round(n * lg)}$, $n^2/2=${Math.round(n * n / 2)}$).` + (alg.value === 'qh' && dist.value === 'arc' ? '\nAdversarial arc: one hull vertex peeled off per level, depth $\\approx n$.' : ''); });
      },
    },
  ],
};
