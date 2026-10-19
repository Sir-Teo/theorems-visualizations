// Vector Calculus — Chapter 1: Vectors, curves and the geometry of space
// Part 1 (1.1–1.6): vectors, dot and cross products, triple product, lines and planes, curvilinear coordinates.
// Part 2 (1.7–1.11) is ch01-b.js; 1.10 (Frenet–Serret) lives in the dg collection.
import {
  tn, tf, colv, tup, add3, sub3, mul3, dot3, cross3, norm3, unit3, lerp3, angle3, planeBasis,
  patch, planePatch, sample, arc3, tiny,
} from './ch01.shared.js';

const DEG = Math.PI / 180;
/** Clip the line A + tD to the box |coordinate| ≤ b: returns [p, q] or null. */
function clipLine(A, D, b) {
  let lo = -1e9, hi = 1e9;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(D[i]) < 1e-12) { if (Math.abs(A[i]) > b) return null; continue; }
    const t1 = (-b - A[i]) / D[i], t2 = (b - A[i]) / D[i];
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
  }
  return lo < hi ? [add3(A, mul3(D, lo)), add3(A, mul3(D, hi))] : null;
}

export default {
  collection: 'vcalc',
  chapter: 1,
  title: 'Vectors, curves and the geometry of space',
  summary: String.raw`Vectors in the plane and in space carry length and direction; the dot product measures angles and projections, the cross product measures oriented area and produces normals. With these we write lines and planes, and then let a point move: a parametrized curve has a velocity, a speed, an arc length and a curvature, and the Frenet frame rides along with it.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Vectors in ℝ³ and their algebra',
      statement: String.raw`A **vector** in $\R^3$ is an ordered triple $\mathbf u=(u_1,u_2,u_3)$, pictured as an arrow with a length $|\mathbf u|=\sqrt{u_1^2+u_2^2+u_3^2}$ and a direction. Vectors are added and scaled **componentwise**: $\mathbf u+\mathbf v=(u_1+v_1,\,u_2+v_2,\,u_3+v_3)$ and $c\mathbf u=(cu_1,cu_2,cu_3)$ for $c\in\R$. Geometrically, $\mathbf u+\mathbf v$ is the arrow from the start of $\mathbf u$ to the end of $\mathbf v$ when $\mathbf v$ is slid so that it starts where $\mathbf u$ ends. Addition is commutative and associative, and the length obeys the triangle inequality $\bigl||\mathbf u|-|\mathbf v|\bigr|\le|\mathbf u+\mathbf v|\le|\mathbf u|+|\mathbf v|$.`,
      idea: String.raw`The algebra is that of $\R^3$ as a real vector space, so commutativity is inherited from $u_i+v_i=v_i+u_i$ for real numbers. The picture explains it: going along $\mathbf u$ then $\mathbf v$ and going along $\mathbf v$ then $\mathbf u$ are the two routes round a parallelogram, and they end at the same point. The triangle inequality says that one side of this triangle cannot be longer than the other two (it is the Cauchy–Schwarz inequality of 1.2 in disguise).`,
      caption: String.raw`Drag the tips of $\mathbf u$ and $\mathbf v$ (drag the background to rotate the view). The green arrow is the result; the dashed copies show the *other* route round the parallelogram, which always lands on the same point. Choose $\mathbf u-\mathbf v$ to see the difference as the arrow joining the two tips, or $c\mathbf u+\mathbf v$ and use the slider. The panel on the right lists the coordinates and stacks them as bars: in each component the two terms add (blue, then orange on top) to the green bar.`,
      deps: ['pma-1.36'],
      refs: ['Marsden–Tromba §1.1'],
      tags: ['vectors', 'geometry'],
      viz(v) {
        const op = v.select('show', [{ value: 'sum', label: '$\\mathbf u+\\mathbf v$' }, { value: 'diff', label: '$\\mathbf u-\\mathbf v$' }, { value: 'comb', label: '$c\\mathbf u+\\mathbf v$' }], 'sum');
        const c = v.slider('$c$', -2, 2, 1.5, { step: 0.05 });
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.75, 1.75], equal: true, axes: false, height: 400, weight: 1.45 });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.32, axis: 1.45, lim: 1.4 });
        const Q = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 0.75, minWidth: 230, title: 'coordinates, and component by component' });
        const hu = sc.handle([1.1, 0.3, 0.5], { color: 'accent' });
        const hv = sc.handle([-0.3, 1.0, 0.4], { color: 'orange' });
        let st = null;
        v.render(() => {
          const o = [0, 0, 0];
          const a = op.value === 'comb' ? mul3(hu.p, c.value) : hu.p.slice();
          const b = op.value === 'diff' ? mul3(hv.p, -1) : hv.p.slice();
          const w = add3(a, b);
          sc.begin();
          sc.poly([o, a, w, b], { fill: 'green', fillAlpha: 0.09, edge: false });
          sc.line(o, b, { color: 'orange', width: 1.6, dash: [5, 4], alpha: 0.8 });
          sc.line(b, w, { color: 'accent', width: 1.6, dash: [5, 4], alpha: 0.8 });
          sc.arrow(o, a, { color: 'accent' });
          sc.arrow(a, w, { color: 'orange' });
          sc.arrow(o, w, { color: 'green', width: 3.2 });
          if (op.value === 'diff') sc.arrow(hv.p, hu.p, { color: 'red', width: 1.8, top: true });
          const lab = op.value === 'comb' ? 'c\\mathbf u' : '\\mathbf u', lab2 = op.value === 'diff' ? '-\\mathbf v' : '\\mathbf v';
          sc.tex(lab, mul3(a, 0.5), { color: 'accent', dx: -10, dy: 12 });
          sc.tex(lab2, add3(a, mul3(b, 0.5)), { color: 'orange', dx: 14, dy: 8 });
          sc.tex(op.value === 'sum' ? '\\mathbf u+\\mathbf v' : op.value === 'diff' ? '\\mathbf u-\\mathbf v' : 'c\\mathbf u+\\mathbf v', w, { color: 'green', dx: 22, dy: -14 });
          sc.flush();
          const rows = [['\\mathbf u', hu.p, 'accent'], ['\\mathbf v', hv.p, 'orange']];
          if (op.value === 'comb') rows.push(['c\\mathbf u', a, 'accent']);
          const nm = op.value === 'sum' ? '\\mathbf u+\\mathbf v' : op.value === 'diff' ? '\\mathbf u-\\mathbf v' : 'c\\mathbf u+\\mathbf v';
          rows.push([nm, w, 'green']);
          rows.forEach(([n, p, col], i) => Q.tex(`${n}=${tup(p)}`, 0.5, 0.93 - i * 0.085, { color: col, size: 14, align: 'center' }));
          // component waterfall: first term, then second term stacked on it, then the result
          const y0 = 0.3, k = 0.075;
          Q.line(0.04, y0, 0.96, y0, { color: 'faint' });
          ['x', 'y', 'z'].forEach((nmc, i) => {
            const cx = 0.2 + 0.3 * i, ai = a[i], bi = b[i], wi = w[i];
            Q.rect(cx - 0.11, y0, cx - 0.05, y0 + k * ai, { fill: 'accent', fillAlpha: 0.6, stroke: false });
            Q.rect(cx - 0.03, y0 + k * ai, cx + 0.03, y0 + k * wi, { fill: 'orange', fillAlpha: 0.6, stroke: false });
            Q.rect(cx + 0.05, y0, cx + 0.11, y0 + k * wi, { fill: 'green', fillAlpha: 0.7, stroke: false });
            Q.line(cx - 0.05, y0 + k * ai, cx - 0.03, y0 + k * ai, { color: 'faint' });
            Q.line(cx + 0.03, y0 + k * wi, cx + 0.05, y0 + k * wi, { color: 'faint' });
            Q.text(nmc, cx, 0.03, { size: 13, color: 'muted', align: 'center', math: true });
          });
          st = { a, b, w, la: norm3(a), lb: norm3(b), lw: norm3(w) };
        });
        v.readout(() => {
          const { la, lb, lw } = st;
          return `$|\\mathbf u|=${tf(norm3(hu.p))},\\ |\\mathbf v|=${tf(norm3(hv.p))}$ and the result has length $${tf(lw)}$, which lies between $\\bigl||${tf(la)}|-|${tf(lb)}|\\bigr|=${tf(Math.abs(la - lb))}$ and $${tf(la)}+${tf(lb)}=${tf(la + lb)}$ (triangle inequality). Law of cosines check: $|\\mathbf w|^2=${tf(lw * lw, 4)}$ and $|\\mathbf a|^2+|\\mathbf b|^2+2\\,\\mathbf a\\cdot\\mathbf b=${tf(la * la + lb * lb + 2 * dot3(st.a, st.b), 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Dot product, angle and projection',
      statement: String.raw`The **dot product** of $\mathbf u,\mathbf v\in\R^3$ is $\mathbf u\cdot\mathbf v=u_1v_1+u_2v_2+u_3v_3$. It satisfies $\mathbf u\cdot\mathbf v=|\mathbf u||\mathbf v|\cos\theta$, where $\theta\in[0,\pi]$ is the angle between the two arrows, so $|\mathbf u\cdot\mathbf v|\le|\mathbf u||\mathbf v|$ (Cauchy–Schwarz). For $\mathbf u\neq 0$ the **(scalar) projection** of $\mathbf v$ on $\mathbf u$ is $\mathbf v\cdot\mathbf u/|\mathbf u|=|\mathbf v|\cos\theta$, and the **vector projection** is $\dfrac{\mathbf u\cdot\mathbf v}{|\mathbf u|^2}\mathbf u$. Two vectors are perpendicular exactly when their dot product is $0$.`,
      idea: String.raw`Take the componentwise formula as the definition. The law of cosines on the triangle with sides $\mathbf u$, $\mathbf v$, $\mathbf v-\mathbf u$ reads $|\mathbf v-\mathbf u|^2=|\mathbf u|^2+|\mathbf v|^2-2|\mathbf u||\mathbf v|\cos\theta$, while expanding $|\mathbf v-\mathbf u|^2=(\mathbf v-\mathbf u)\cdot(\mathbf v-\mathbf u)$ gives $|\mathbf u|^2+|\mathbf v|^2-2\,\mathbf u\cdot\mathbf v$. Comparing the two identifies $\mathbf u\cdot\mathbf v$ with $|\mathbf u||\mathbf v|\cos\theta$; the shadow of $\mathbf v$ on the line of $\mathbf u$ has signed length $|\mathbf v|\cos\theta$.`,
      caption: String.raw`Drag $\mathbf v$ (and $\mathbf u$); rotate the view to see the plane they span. The green arrow is the shadow of $\mathbf v$ on the line of $\mathbf u$: it shrinks to a point at $90^\circ$ and flips to the red, negative side beyond it. The right panel plots $\cos\theta$, which is the normalised dot product. The two numbers in the readout are computed independently: from components, and from the angle measured with $\operatorname{atan2}$ of $|\mathbf u\times\mathbf v|$ and $\mathbf u\cdot\mathbf v$ — they agree. **Make $\mathbf v\perp\mathbf u$** projects $\mathbf v$ onto the plane perpendicular to $\mathbf u$.`,
      deps: ['vcalc-1.1', 'pma-1.35'],
      refs: ['Marsden–Tromba §1.2'],
      tags: ['dot product', 'angle', 'projection'],
      viz(v) {
        const S = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, axes: false, height: 390, weight: 1.4 });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.55, axis: 1.45, lim: 1.4 });
        const G = v.stage({ x: [0, Math.PI], y: [-1.15, 1.15], axes: 'box', gutter: true, height: 390, weight: 0.9, xlabel: 'angle θ', ylabel: 'cos θ', xticks: [[0, '0'], [Math.PI / 2, '90°'], [Math.PI, '180°']], yticks: [-1, 0, 1], title: 'normalised dot product' });
        const hu = sc.handle([1.3, 0.2, 0.1], { color: 'accent', label: 'u' });
        const hv = sc.handle([0.5, 1.1, 0.4], { color: 'orange', label: 'v' });
        v.button('make v ⟂ u', () => { const u = unit3(hu.p), p = dot3(hv.p, u); hv.set(sub3(hv.p, mul3(u, p))); });
        let st = null;
        v.render(() => {
          const u = hu.p, w = hv.p, lu = norm3(u), lw = norm3(w);
          const uh = unit3(u), pr = dot3(w, uh), foot = mul3(uh, pr), th = angle3(u, w);
          sc.begin();
          const vperp = sub3(w, foot), e2 = unit3(vperp);
          sc.poly([[0, 0, 0], u, add3(u, w), w], { fill: 'muted', fillAlpha: 0.07, edge: false });
          sc.line(mul3(uh, -2), mul3(uh, 2.2), { color: 'faint', width: 1, dash: [4, 4] });
          if (norm3(e2) > 1e-9) { sc.path(arc3([0, 0, 0], uh, e2, 0.45, 0, th), { color: 'gold', width: 2 }); }
          sc.line(w, foot, { color: 'muted', width: 1.4, dash: [4, 3] });
          sc.arrow([0, 0, 0], u, { color: 'accent' });
          sc.arrow([0, 0, 0], w, { color: 'orange' });
          if (Math.abs(pr) > 0.02) sc.arrow([0, 0, 0], foot, { color: pr >= 0 ? 'green' : 'red', width: 3.6, top: true });
          sc.flush();
          const a1 = dot3(u, w), a2 = lu * lw * Math.cos(th);
          G.fn((t) => Math.cos(t), { color: 'muted', width: 1.6 });
          G.hline(0, { color: 'faint' });
          G.dot(th, Math.cos(th), { color: pr >= 0 ? 'green' : 'red', r: 7 });
          G.vline(th, { color: 'faint', dash: true });
          G.text(`θ = ${v.fix(th / DEG, 1)}°`, Math.min(th + 0.08, 2.2), -0.9, { size: 13, color: 'gold' });
          st = { a1, a2, th, pr, lu, lw };
        });
        v.legend([['accent', '$\\mathbf u$'], ['orange', '$\\mathbf v$'], ['green', 'projection of $\\mathbf v$ on $\\mathbf u$'], ['red', 'projection pointing backwards', { dash: true }]]);
        v.readout(() => `From components: $\\mathbf u\\cdot\\mathbf v=${tf(st.a1, 4)}$. From lengths and angle: $|\\mathbf u||\\mathbf v|\\cos\\theta=${tf(st.lu, 3)}\\cdot${tf(st.lw, 3)}\\cdot\\cos(${v.fix(st.th / DEG, 1)}^\\circ)=${tf(st.a2, 4)}$. Projection of $\\mathbf v$ on $\\mathbf u$: $${tf(st.pr, 3)}$ — ${Math.abs(st.a1) < 0.01 ? '**perpendicular**' : st.a1 > 0 ? 'acute angle, positive' : 'obtuse angle, negative'}.`);
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Cross product as oriented area',
      statement: String.raw`For $\mathbf u,\mathbf v\in\R^3$ the **cross product** is $\mathbf u\times\mathbf v=(u_2v_3-u_3v_2,\;u_3v_1-u_1v_3,\;u_1v_2-u_2v_1)$. It is perpendicular to both $\mathbf u$ and $\mathbf v$ and, when nonzero, points in the direction given by the right-hand rule. For nonzero input vectors with angle $\theta$ its length is $|\mathbf u\times\mathbf v|=|\mathbf u||\mathbf v|\sin\theta$, the area of their parallelogram; if either vector is zero, the component formula gives zero. It is bilinear and **anti-commutative**, $\mathbf v\times\mathbf u=-\,\mathbf u\times\mathbf v$, and vanishes exactly when $\mathbf u,\mathbf v$ are linearly dependent (including when either is zero).`,
      idea: String.raw`Perpendicularity is a direct computation: $(\mathbf u\times\mathbf v)\cdot\mathbf u=0$ because the terms cancel in pairs. For the length, Lagrange's identity $|\mathbf u\times\mathbf v|^2=|\mathbf u|^2|\mathbf v|^2-(\mathbf u\cdot\mathbf v)^2$ together with $\mathbf u\cdot\mathbf v=|\mathbf u||\mathbf v|\cos\theta$ gives $|\mathbf u|^2|\mathbf v|^2\sin^2\theta$. And $|\mathbf v|\sin\theta$ is the height of the parallelogram over the base $\mathbf u$, so the length is base times height. Swapping the factors swaps the sign of every component.`,
      caption: String.raw`Drag the tips of $\mathbf u$ and $\mathbf v$ and rotate the view: the shaded parallelogram is spanned by the two edges and the purple arrow stands on it at a right angle, with length equal to the area. Flip **swap order** and the arrow reverses. Squash the parallelogram (make the vectors nearly parallel) and the arrow shrinks to zero. The readout computes the area three ways: the length of the cross product, base times height, and Lagrange's formula.`,
      deps: ['vcalc-1.1', 'pma-9.33'],
      refs: ['Marsden–Tromba §1.3'],
      tags: ['cross product', 'area', 'orientation'],
      credit: 'Gibbs (private print 1881–84) and Wilson, Vector Analysis, 1901',
      viz(v) {
        const swap = v.toggle('swap order: $\\mathbf v\\times\\mathbf u$', false);
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, axes: false, height: 420, weight: 1.5 });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.4, axis: 1.5, lim: 1.4 });
        const hu = sc.handle([1.4, 0.1, 0], { color: 'accent' });
        const hv = sc.handle([0.4, 1.2, 0.2], { color: 'orange' });
        let st = null;
        v.render(() => {
          const A = swap.value ? hv.p : hu.p, B = swap.value ? hu.p : hv.p, o = [0, 0, 0];
          const X = cross3(A, B), area = norm3(X), th = angle3(A, B);
          const e1 = unit3(A), perp = sub3(B, mul3(e1, dot3(B, e1))), hgt = norm3(perp), base = norm3(A);
          sc.begin();
          sc.poly([o, A, add3(A, B), B], { fill: 'accent', fillAlpha: 0.2, color: 'accent' });
          if (area > 1e-9) {
            const n = unit3(X);
            sc.path(arc3(o, e1, unit3(perp), 0.4, 0, th), { color: 'gold', width: 1.8 });
            sc.line(B, add3(mul3(e1, dot3(B, e1)), o), { color: 'muted', width: 1.2, dash: [4, 3] });
            // little square marking the right angle with the plane
            sc.arrow(o, X, { color: 'purple', width: 3.4 });
            sc.tex(swap.value ? '\\mathbf v\\times\\mathbf u' : '\\mathbf u\\times\\mathbf v', X, { color: 'purple', dx: 34, dy: -4 });
          }
          sc.arrow(o, A, { color: swap.value ? 'orange' : 'accent', width: 2.4 });
          sc.arrow(o, B, { color: swap.value ? 'accent' : 'orange', width: 2.4 });
          sc.flush();
          S.corner(`area = |u × v| = ${tf(area, 2)}`, 'tl', { size: 14, color: 'ink', plate: true });
          st = { X, area, th, base, hgt, A, B };
        });
        v.readout(() => `$${swap.value ? '\\mathbf v\\times\\mathbf u' : '\\mathbf u\\times\\mathbf v'}=${tup(st.X, 3)}$, length $${tf(st.area, 4)}$. Base $\\times$ height $=${tf(st.base, 3)}\\cdot${tf(st.hgt, 3)}=${tf(st.base * st.hgt, 4)}$; Lagrange: $\\sqrt{|\\mathbf u|^2|\\mathbf v|^2-(\\mathbf u\\cdot\\mathbf v)^2}=${tf(Math.sqrt(Math.max(0, dot3(st.A, st.A) * dot3(st.B, st.B) - dot3(st.A, st.B) ** 2)), 4)}$. Dot products with the factors: $${tiny(Math.abs(dot3(st.X, st.A)))}$ and $${tiny(Math.abs(dot3(st.X, st.B)))}$ (both $0$).`);
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Proposition',
      name: 'Triple product as signed volume',
      statement: String.raw`For $\mathbf u,\mathbf v,\mathbf w\in\R^3$ the **scalar triple product** $\mathbf u\cdot(\mathbf v\times\mathbf w)$ equals the determinant of the matrix with rows $\mathbf u,\mathbf v,\mathbf w$. Its absolute value is the volume of the parallelepiped with edges $\mathbf u,\mathbf v,\mathbf w$; its sign is $+$ when $(\mathbf u,\mathbf v,\mathbf w)$ is a right-handed triple. It is unchanged by cyclic permutations, changes sign under a swap of two vectors, and is $0$ exactly when the three vectors lie in one plane.`,
      idea: String.raw`The parallelepiped is a prism over the parallelogram spanned by $\mathbf v,\mathbf w$, whose area is $|\mathbf v\times\mathbf w|$ (1.3), so its volume is that area times the height of $\mathbf u$ above the base plane. That height is the length of the projection of $\mathbf u$ on the normal $\mathbf v\times\mathbf w$ (1.2), namely $|\mathbf u\cdot(\mathbf v\times\mathbf w)|/|\mathbf v\times\mathbf w|$. Multiplying gives $|\mathbf u\cdot(\mathbf v\times\mathbf w)|$, and the sign records on which side of the base the third edge sits. Expanding along the first row shows it is the determinant.`,
      caption: String.raw`$\mathbf u$ and $\mathbf v$ are held in the horizontal plane (drag their tips), and $\mathbf w$ is free: drag it up and down through the plane. The box is green while the volume is positive and turns red when $\mathbf w$ crosses to the other side; at the crossing the box is flat and the volume reads $0$. Switch the **order** to $(\mathbf u,\mathbf w,\mathbf v)$ to see the sign flip, or press **drop $\mathbf w$ into the plane**.`,
      deps: ['vcalc-1.2', 'vcalc-1.3'],
      refs: ['Marsden–Tromba §1.3'],
      tags: ['triple product', 'volume', 'determinant'],
      viz(v) {
        const M = v.M;
        const ord = v.select('order', [{ value: 'uvw', label: '$(\\mathbf u,\\mathbf v,\\mathbf w)$' }, { value: 'uwv', label: '$(\\mathbf u,\\mathbf w,\\mathbf v)$' }], 'uvw');
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.0, 2.0], equal: true, axes: false, height: 420, weight: 1.5 });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.36, axis: 1.5, lim: 1.4 });
        const hu = sc.handle([1.2, 0, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'accent', label: 'u' });
        const hv = sc.handle([0.15, 1.2, 0], { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], color: 'orange', label: 'v' });
        const hw = sc.handle([0.4, 0.3, 1.1], { color: 'teal', label: 'w' });
        v.button('drop w into the plane', () => hw.set([hw.p[0], hw.p[1], 0]));
        let st = null;
        v.render(() => {
          const A = hu.p, B = ord.value === 'uvw' ? hv.p : hw.p, C = ord.value === 'uvw' ? hw.p : hv.p;
          const V = dot3(A, cross3(B, C)), det = M.det([A, B, C]);
          const col = Math.abs(V) < 0.02 ? 'gold' : V > 0 ? 'green' : 'red', o = [0, 0, 0];
          const ab = add3(A, B), ac = add3(A, C), bc = add3(B, C), abc = add3(ab, C);
          sc.begin();
          sc.poly([o, A, ab, B], { fill: col, fillAlpha: 0.14, color: col });
          sc.poly([C, ac, abc, bc], { fill: col, fillAlpha: 0.1, color: col });
          sc.poly([o, A, ac, C], { fill: col, fillAlpha: 0.1, color: col });
          sc.poly([B, ab, abc, bc], { fill: col, fillAlpha: 0.1, color: col });
          sc.poly([o, B, bc, C], { fill: col, fillAlpha: 0.1, color: col });
          sc.poly([A, ab, abc, ac], { fill: col, fillAlpha: 0.1, color: col });
          const X = cross3(B, C);
          const nh = unit3(cross3(A, B));
          sc.arrow(o, A, { color: 'accent' });
          sc.arrow(o, hv.p, { color: 'orange' });
          sc.arrow(o, hw.p, { color: 'teal' });
          sc.flush();
          const h = dot3(A, unit3(X));
          st = { V, det, area: norm3(X), h, col, nh };
        });
        v.readout(() => `$${ord.value === 'uvw' ? '\\mathbf u\\cdot(\\mathbf v\\times\\mathbf w)' : '\\mathbf u\\cdot(\\mathbf w\\times\\mathbf v)'}=${tf(st.V, 4)}$; the determinant gives $${tf(st.det, 4)}$ and (area of the base)$\\times$(signed height) $=${tf(st.area, 3)}\\cdot${tf(st.h, 3)}=${tf(st.area * st.h, 4)}$. ${Math.abs(st.V) < 0.02 ? '**Flat box: the three vectors are coplanar.**' : st.V > 0 ? 'Right-handed triple (green).' : 'Left-handed triple (red).'}`);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Lines and planes in space',
      statement: String.raw`A **line** through the point $\mathbf a$ with direction $\mathbf d\neq 0$ is $\{\mathbf a+t\mathbf d:t\in\R\}$. A **plane** through $\mathbf p_0$ with normal $\mathbf n\neq 0$ is $\{\mathbf x:\mathbf n\cdot(\mathbf x-\mathbf p_0)=0\}$, i.e. $n_1x+n_2y+n_3z=\mathbf n\cdot\mathbf p_0$. If $\mathbf n\cdot\mathbf d\neq 0$ the line meets the plane in exactly one point, at $t=\mathbf n\cdot(\mathbf p_0-\mathbf a)/(\mathbf n\cdot\mathbf d)$, and the angle $\varphi$ between line and plane satisfies $\sin\varphi=|\mathbf n\cdot\mathbf d|/(|\mathbf n||\mathbf d|)$. If $\mathbf n\cdot\mathbf d=0$ the line is parallel to the plane: it either misses it or lies in it.`,
      idea: String.raw`A point $\mathbf x$ is on the plane when the arrow $\mathbf x-\mathbf p_0$ lies in the plane, i.e. is perpendicular to $\mathbf n$ (1.2). Substituting $\mathbf x=\mathbf a+t\mathbf d$ gives one linear equation in $t$, $t\,(\mathbf n\cdot\mathbf d)=\mathbf n\cdot(\mathbf p_0-\mathbf a)$, with a unique solution unless the coefficient $\mathbf n\cdot\mathbf d$ vanishes. The line makes angle $\varphi$ with the plane when it makes angle $90^\circ-\varphi$ with the normal, which converts $\cos(90^\circ-\varphi)$ into $\sin\varphi$.`,
      caption: String.raw`Drag the orange point to slide the plane and the orange tip of the normal to tilt it; drag the two teal points to move the line (the line runs through both). The gold point is the intersection, and its coordinates satisfy the plane equation to rounding error. Press **make the line parallel** and the intersection disappears: the equation for $t$ has no solution (the line misses the plane) or every $t$ (the line lies in it).`,
      deps: ['vcalc-1.2'],
      refs: ['Marsden–Tromba §1.3'],
      tags: ['lines', 'planes', 'normal vector'],
      viz(v) {
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.9, 1.9], equal: true, axes: false, height: 420, weight: 1.5 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.38, axis: 1.6, lim: 1.5 });
        let nv = [0.35, 0.3, 1];
        const hp = sc.handle([0.1, 0, 0.1], { color: 'orange', label: 'p₀', onDrag: () => hn.set(add3(hp.p, nv)) });
        const hn = sc.handle(add3([0.1, 0, 0.1], nv), { color: 'red', label: 'n', lim: 3.5, onDrag: () => { nv = sub3(hn.p, hp.p); } });
        const ha = sc.handle([-1.1, -0.6, -0.9], { color: 'teal', label: 'a' });
        const hb = sc.handle([0.7, 0.8, 1.0], { color: 'teal', label: 'b' });
        v.button('make the line parallel', () => { const n = unit3(nv), D = sub3(hb.p, ha.p); hb.set(add3(ha.p, sub3(D, mul3(n, dot3(D, n))))); });
        let st = null;
        v.render(() => {
          const P0 = hp.p, n = nv, A = ha.p, D = sub3(hb.p, ha.p), nn = unit3(n);
          const dN = dot3(n, D), d = dot3(n, P0);
          sc.begin();
          planePatch(sc, P0, n, 1.35, { fill: 'orange', fillAlpha: 0.14 }, 6);
          sc.arrow(P0, add3(P0, mul3(nn, 0.9)), { color: 'red', width: 2.6 });
          sc.dot(P0, { r: 4, color: 'orange' });
          const cl = norm3(D) > 1e-6 ? clipLine(A, D, 1.6) : null;
          if (cl) sc.line(cl[0], cl[1], { color: 'teal', width: 2.2 }, 24);
          let X = null, t = null;
          if (Math.abs(dN) > 1e-9 * (norm3(n) * norm3(D))) { t = dot3(n, sub3(P0, A)) / dN; X = add3(A, mul3(D, t)); }
          if (X && Math.max(...X.map(Math.abs)) < 2.4) { sc.dot(X, { r: 6.5, color: 'gold', top: true }); }
          sc.flush();
          const sinphi = Math.abs(dN) / (norm3(n) * norm3(D) || 1);
          st = { X, t, d, n, D, phi: Math.asin(Math.min(1, sinphi)) / DEG, res: X ? dot3(n, X) - d : null, para: Math.abs(dN) < 1e-9 * norm3(n) * norm3(D), side: dot3(n, sub3(A, P0)) };
        });
        v.legend([['orange', 'plane', { area: true }], ['red', 'normal $\\mathbf n$'], ['teal', 'line'], ['gold', 'intersection']]);
        v.readout(() => {
          const { X, t, d, n } = st;
          const eq = `${tf(n[0])}x${n[1] < 0 ? '-' : '+'}${tf(Math.abs(n[1]))}y${n[2] < 0 ? '-' : '+'}${tf(Math.abs(n[2]))}z=${tf(d)}`;
          if (st.para) return `Plane: $${eq}$. The line direction satisfies $\\mathbf n\\cdot\\mathbf d=0$ — **parallel to the plane**, ${Math.abs(st.side) < 1e-6 ? 'and lying in it (every $t$ solves the equation)' : 'at distance $' + tf(Math.abs(st.side) / norm3(n), 3) + '$ from it, so no intersection'}.`;
          return `Plane: $${eq}$. The line meets it at $t=${tf(t, 3)}$, the point $${tup(X, 3)}$, where $\\mathbf n\\cdot\\mathbf x-d=${tiny(Math.abs(st.res))}$. Angle between line and plane: $${v.fix(st.phi, 1)}^\\circ$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Cylindrical and spherical coordinates',
      statement: String.raw`**Cylindrical coordinates** $(\rho,\varphi,z)$ with $\rho\ge0$ describe a point by $x=\rho\cos\varphi$, $y=\rho\sin\varphi$, $z=z$; **spherical coordinates** $(r,\theta,\varphi)$ with $r\ge 0$, $0\le\theta\le\pi$ (polar angle from the $z$-axis) use $x=r\sin\theta\cos\varphi$, $y=r\sin\theta\sin\varphi$, $z=r\cos\theta$. In each system the three **coordinate surfaces** (one coordinate held constant) are: a cylinder $\rho=c$, a half-plane $\varphi=c$ and a plane $z=c$; or a sphere $r=c$, a cone $\theta=c$ and a half-plane $\varphi=c$. They meet at right angles. On the axis the angle $\varphi$ (and at the origin also $\theta$) is undefined.`,
      idea: String.raw`Polar coordinates $(\rho,\varphi)$ in the $xy$-plane are carried along the $z$-axis, which gives the cylindrical system. For spherical coordinates, $r$ is the distance from the origin and $\theta$ the angle to the $z$-axis, so the point sits at height $r\cos\theta$ above the plane and at horizontal distance $\rho=r\sin\theta$ from the axis; then $\varphi$ is the cylindrical angle. The two angles are separated by the ordering of the steps, which is why the coordinate surfaces are the simple ones above. (Mathematics texts often swap the names of $\theta$ and $\varphi$; we follow the physics convention of ISO 80000-2.)`,
      caption: String.raw`Pick a system and move the three sliders. The three coordinate surfaces through the gold point are drawn in blue, orange and green, and the dotted lines are the coordinate curves along which only one coordinate varies. Rotate the view. Set $\rho=0$ (cylindrical) or $\theta=0$ (spherical) and the angle $\varphi$ stops mattering — the singularity of the system. The readout converts to Cartesian coordinates and back.`,
      deps: ['vcalc-1.1'],
      refs: ['Marsden–Tromba §1.4'],
      tags: ['coordinates', 'cylindrical', 'spherical'],
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI;
        const show = () => { const c = sys.value === 'cyl'; [cr, cp, cz].forEach((k) => { k.el.hidden = !c; }); [sr, st_, sp].forEach((k) => { k.el.hidden = c; }); };
        const sys = v.select('system', [{ value: 'cyl', label: 'cylindrical $(\\rho,\\varphi,z)$' }, { value: 'sph', label: 'spherical $(r,\\theta,\\varphi)$' }], 'cyl', { onChange: () => show() });
        const cr = v.slider('$\\rho$', 0, 1.5, 1.0, { step: 0.01 });
        const cp = v.slider('$\\varphi$ (°)', 0, 360, 50, { step: 1 });
        const cz = v.slider('$z$', -1.2, 1.2, 0.7, { step: 0.01 });
        const sr = v.slider('$r$', 0, 1.6, 1.2, { step: 0.01 });
        const st_ = v.slider('$\\theta$ (°)', 0, 180, 55, { step: 1 });
        const sp = v.slider('$\\varphi$ (°)', 0, 360, 40, { step: 1 });
        show();
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.1], equal: true, axes: false, height: 440, weight: 1 });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.35, axis: 1.7, lim: 1.7 });
        let st = null;
        v.render(() => {
          let P, coords;
          const cyl = sys.value === 'cyl';
          const a = cyl ? cr.value : sr.value, b = (cyl ? cp.value : st_.value) * DEG;
          let c3;
          if (cyl) { c3 = cz.value; P = [a * Math.cos(b), a * Math.sin(b), c3]; coords = { rho: a, phi: b, z: c3 }; }
          else { c3 = sp.value * DEG; const th = Math.min(Math.PI, b); P = [a * Math.sin(th) * Math.cos(c3), a * Math.sin(th) * Math.sin(c3), a * Math.cos(th)]; coords = { r: a, th, phi: c3 }; }
          v.legend(cyl ? [['blue', 'cylinder $\\rho=$ const', { area: true }], ['orange', 'half-plane $\\varphi=$ const', { area: true }], ['green', 'plane $z=$ const', { area: true }]] : [['blue', 'sphere $r=$ const', { area: true }], ['green', 'cone $\\theta=$ const', { area: true }], ['orange', 'half-plane $\\varphi=$ const', { area: true }]]);
          sc.begin();
          if (cyl) {
            patch(sc, (p, z) => [a * Math.cos(p), a * Math.sin(p), z], [0, TAU], [-1.4, 1.4], 36, 2, { fill: 'blue', fillAlpha: 0.1 });
            patch(sc, (r, z) => [r * Math.cos(b), r * Math.sin(b), z], [0, 1.8], [-1.4, 1.4], 2, 2, { fill: 'orange', fillAlpha: 0.16 });
            patch(sc, (r, p) => [r * Math.cos(p), r * Math.sin(p), c3], [0, 1.8], [0, TAU], 3, 36, { fill: 'green', fillAlpha: 0.1 });
            sc.path(sample((p) => [a * Math.cos(p), a * Math.sin(p), c3], 0, TAU, 60), { color: 'blue', width: 1.6, dash: [3, 3] });
            sc.line([0, 0, c3], P, { color: 'green', width: 1.8, dash: [3, 3] });
            sc.line([P[0], P[1], -1.4], [P[0], P[1], 1.4], { color: 'orange', width: 1.2, dash: [3, 3] });
          } else {
            const th = coords.th;
            patch(sc, (t, p) => [a * Math.sin(t) * Math.cos(p), a * Math.sin(t) * Math.sin(p), a * Math.cos(t)], [0, Math.PI], [0, TAU], 14, 28, { fill: 'blue', fillAlpha: 0.07 });
            patch(sc, (r, p) => [r * Math.sin(th) * Math.cos(p), r * Math.sin(th) * Math.sin(p), r * Math.cos(th)], [0, 1.8], [0, TAU], 3, 36, { fill: 'green', fillAlpha: 0.09 });
            patch(sc, (r, t) => [r * Math.sin(t) * Math.cos(c3), r * Math.sin(t) * Math.sin(c3), r * Math.cos(t)], [0, 1.8], [0, Math.PI], 3, 14, { fill: 'orange', fillAlpha: 0.15 });
            sc.path(sample((t) => [a * Math.sin(t) * Math.cos(c3), a * Math.sin(t) * Math.sin(c3), a * Math.cos(t)], 0, Math.PI, 40), { color: 'orange', width: 1.6, dash: [3, 3] });
            sc.path(sample((p) => [a * Math.sin(th) * Math.cos(p), a * Math.sin(th) * Math.sin(p), a * Math.cos(th)], 0, TAU, 60), { color: 'green', width: 1.6, dash: [3, 3] });
            sc.line([0, 0, 0], P, { color: 'blue', width: 1.8, dash: [3, 3] });
          }
          sc.line([0, 0, 0], [P[0], P[1], 0], { color: 'muted', width: 1.2, dash: [2, 3] });
          sc.line([P[0], P[1], 0], P, { color: 'muted', width: 1.2, dash: [2, 3] });
          sc.dot(P, { r: 7, color: 'gold', top: true });
          sc.flush();
          // convert back
          const rho = Math.hypot(P[0], P[1]), ph = M.mod(Math.atan2(P[1], P[0]), TAU);
          st = { P, cyl, rho, ph, r: norm3(P), th: Math.atan2(rho, P[2]), coords };
        });
        v.readout(() => {
          const { P, cyl, coords } = st;
          const axis = cyl ? coords.rho < 1e-6 : st.rho < 1e-6;
          const back = cyl ? `(\\rho,\\varphi,z)=(${tf(st.rho, 3)},\\,${v.fix(st.ph / DEG, 1)}^\\circ,\\,${tf(P[2], 3)})` : `(r,\\theta,\\varphi)=(${tf(st.r, 3)},\\,${v.fix(st.th / DEG, 1)}^\\circ,\\,${v.fix(st.ph / DEG, 1)}^\\circ)`;
          return `Cartesian: $(x,y,z)=${tup(P, 3)}$. Converting back gives $${back}$.${axis ? ' **On the axis: $\\varphi$ is undefined here** (the formula returns an arbitrary value).' : ''}`;
        });
      },
    },
  ],
};
