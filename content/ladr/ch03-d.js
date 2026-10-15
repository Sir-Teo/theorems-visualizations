// Linear Algebra Done Right — Chapter 3: Linear Maps
// Part 4 (3.105–3.133): the dimension of a quotient and the induced map T̃; duality — linear functionals, the dual
// space, dual bases, dual maps, annihilators, null space and range of T′, the transpose, and column rank = row rank.
// Parts 1–3 are ch03.js, ch03-b.js and ch03-c.js.

// =====================================================================================================
// Shared helpers. A functional φ(x) = c·x on ℝ² is drawn as its family of level lines φ = k (alternate strips
// tinted, values printed along one edge); on ℝ³ as a stack of level planes. A functional on ℝ² is usually dragged
// by the foot of its level line φ = 1 (the point of that line nearest 0), so its coefficient vector is p/|p|².
// =====================================================================================================
const VC = ['blue', 'purple', 'teal'];
const ZERO = [0, 0, 0];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a) => { const l = len3(a); return l > 1e-12 ? mul3(a, 1 / l) : [0, 0, 0]; };
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
const tn = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
const vt = (p, d = 2) => `(${p.map((x) => tn(x, d)).join(',\\,')})`;
/** TeX for the linear form Σ c_i x_i. */
function linTeX(c, vars = ['x', 'y', 'z'], d = 2) {
  let s = '';
  c.forEach((a, i) => {
    if (Math.abs(a) < 0.5 * 10 ** -d) return;
    s += (s ? (a < 0 ? ' - ' : ' + ') : a < 0 ? '-' : '') + Math.abs(a).toFixed(d) + vars[i];
  });
  return s || '0';
}
/** Orthonormal basis of span(vs) in ℝ³ (Gram–Schmidt, twice); vectors already in the span are skipped. */
function orth(vs, tol = 1e-7) {
  const B = [];
  for (const x of vs) {
    let w = x.slice();
    for (let pass = 0; pass < 2; pass++) for (const e of B) w = sub3(w, mul3(e, dot3(w, e)));
    const l = len3(w); if (l > tol * Math.max(1, len3(x))) B.push(mul3(w, 1 / l));
  }
  return B;
}
const projOnto = (x, B) => B.reduce((s, e) => add3(s, mul3(e, dot3(x, e))), [0, 0, 0]);
/** Orthonormal basis of the orthogonal complement of span(B), B orthonormal. */
const compl = (B) => orth([...B, [1, 0, 0], [0, 1, 0], [0, 0, 1]]).slice(B.length);
/** An orthonormal pair spanning the plane perpendicular to n. */
function perp(n) {
  const u = unit3(n), e = Math.abs(u[0]) < 0.6 ? [1, 0, 0] : Math.abs(u[1]) < 0.6 ? [0, 1, 0] : [0, 0, 1];
  const a = unit3(cross(u, e)); return [a, cross(u, a)];
}
/** Snap p onto the line through 0 and d when it is within tol of it. */
const snapLine3 = (p, d, tol) => { const e = unit3(d); const q = mul3(e, dot3(p, e)); return len3(sub3(p, q)) < tol ? q : p; };
function snap2(p, d, tol) {
  const l = Math.hypot(d[0], d[1]); if (l < 1e-9) return p;
  const e = [d[0] / l, d[1] / l], t = dot2(p, e), q = [e[0] * t, e[1] * t];
  return Math.hypot(p[0] - q[0], p[1] - q[1]) < tol ? q : p;
}
const minLen2 = (x, y, r) => { const l = Math.hypot(x, y); return l >= r ? [x, y] : l < 1e-9 ? [r, 0] : [(x * r) / l, (y * r) / l]; };
const minLen3 = (p, r) => { const l = len3(p); return l >= r ? p : l < 1e-9 ? [r, 0, 0] : mul3(p, r / l); };
const kfmt = (x) => String(+x.toFixed(3)).replace('-', '−');
function niceStep(x) { const p = 10 ** Math.floor(Math.log10(x)); for (const m of [1, 2, 5, 10]) if (m * p >= x - 1e-12) return m * p; return 10 * p; }

// ---- 2D level lines
const box2 = (S) => { const B = S.bounds; return [[B.x[0], B.y[0]], [B.x[1], B.y[0]], [B.x[1], B.y[1]], [B.x[0], B.y[1]]]; };
/** Clip a convex polygon to the half-plane s·(c·p − k) ≥ 0. */
function clipHalf(poly, c, k, s) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = s * (dot2(c, P) - k), fq = s * (dot2(c, Q) - k);
    if (fp >= 0) out.push(P);
    if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** The piece of the line c·p = k inside the stage. */
function seg2(S, c, k) {
  const box = box2(S), pts = [];
  for (let i = 0; i < 4; i++) {
    const P = box[i], Q = box[(i + 1) % 4], fp = dot2(c, P) - k, fq = dot2(c, Q) - k;
    if (fp === 0) pts.push(P); else if (fp * fq < 0) { const t = fp / (fp - fq); pts.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return pts.length >= 2 ? [pts[0], pts[1]] : null;
}
const ppu = (S) => Math.abs(S.X(1) - S.X(0));
/**
 * Level lines φ = k·step of φ(p) = c·p. st: {color, step, strips, labels, width, alpha, dash, max, side, fillAlpha}.
 * Too dense a family is thinned (the step grows to a nice multiple). The line φ = 0 is drawn thicker.
 */
function levels(S, c, st = {}) {
  const n2 = dot2(c, c); if (n2 < 1e-14) return 0;
  const color = st.color || 'accent', box = box2(S), ph = box.map((p) => dot2(c, p));
  const lo = Math.min(...ph), hi = Math.max(...ph);
  let step = st.step || 1;
  const maxN = st.max || 22; if ((hi - lo) / step > maxN) step *= niceStep((hi - lo) / step / maxN);
  const k0 = Math.ceil(lo / step - 1e-9), k1 = Math.floor(hi / step + 1e-9);
  if (st.strips !== false) for (let k = k0 - 1; k <= k1; k++) if (((k % 2) + 2) % 2 === 0) {
    const P = clipHalf(clipHalf(box, c, k * step, 1), c, (k + 1) * step, -1);
    if (P.length > 2) S.poly(P, { fill: color, fillAlpha: st.fillAlpha ?? 0.07, stroke: false });
  }
  const sd = st.side || 1, d = [-c[1] * sd, c[0] * sd], u = ppu(S), w = st.width ?? 1.3;
  let last = null;
  for (let k = k0; k <= k1; k++) {
    const sg = seg2(S, c, k * step); if (!sg) continue;
    S.line(sg[0][0], sg[0][1], sg[1][0], sg[1][1], { color, width: k === 0 ? w * 1.9 : w, alpha: st.alpha ?? 0.8, dash: st.dash });
    if (st.labels === false) continue;
    const [p, q] = dot2(sg[0], d) >= dot2(sg[1], d) ? sg : [sg[1], sg[0]];
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]) * u; if (L < 40) continue;
    const t = (st.inset ?? 13) / L, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
    if (last && Math.hypot(x - last[0], y - last[1]) * u < 19) continue;
    last = [x, y];
    S.text(kfmt(k * step), x, y, { size: 11, color, align: 'center', baseline: 'middle' });
  }
  return step;
}
/** Arrow p → q with a TeX label just beyond the tip. */
function arr(S, p, q, color, label, st = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: st.width ?? 2.6, head: st.head ?? 10, alpha: st.alpha, dash: st.dash });
  if (!label) return;
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
  S.tex(label, q[0], q[1], { color, dx: (st.off ?? 14) * dx / l, dy: -(st.off ?? 14) * dy / l, align: 'center', baseline: 'middle', size: st.size });
}
/** Handle at the foot of the level line φ = 1 (kept at distance ≥ rmin from 0). */
const fHandle = (S, p, color, label, rmin = 0.3, snap) => S.handle(p[0], p[1], { color, label, constrain: (x, y) => { const q = minLen2(x, y, rmin); return snap ? snap(q) : q; } });
const coef = (h) => { const r2 = h.x * h.x + h.y * h.y; return [h.x / r2, h.y / r2]; };
const foot2 = (c) => { const n2 = dot2(c, c); return [c[0] / n2, c[1] / n2]; };
/** Coefficients of the dual basis of the basis b1, b2 of ℝ² (rows of [b1 b2]⁻¹), or null. */
function dual2(b1, b2) {
  const det = b1[0] * b2[1] - b1[1] * b2[0]; if (Math.abs(det) < 1e-9) return null;
  return [[b2[1] / det, -b2[0] / det], [-b1[1] / det, b1[0] / det]];
}
/** Parallelogram spanned by a and b (the image of the unit square). */
const cell2 = (S, a, b, color) => S.poly([[0, 0], a, [a[0] + b[0], a[1] + b[1]], b], { fill: color, fillAlpha: 0.1, color, width: 1, alpha: 0.5 });

// ---- 3D (on a v.scene3)
/** Level planes c·x = k·step as discs (thinned to at most 2·max + 1); labels at the right-hand rim. */
function planes3(sc, c, st = {}) {
  const n = len3(c); if (n < 1e-9) return;
  const [a, b] = perp(c), R = st.maxR ?? 1.5, r = st.r ?? 1.0, color = st.color || 'accent', mx = st.max ?? 2;
  let step = st.step ?? 1; if ((R * n) / step > mx) step *= niceStep((R * n) / step / mx);
  const K = Math.floor((R * n) / step + 1e-9);
  const pa = sc.P(a), pb = sc.P(b), th = Math.atan2(pb[0], pa[0]), rim = add3(mul3(a, r * Math.cos(th)), mul3(b, r * Math.sin(th)));
  for (let k = -K; k <= K; k++) {
    if (st.only0 && k) continue;
    const ctr = mul3(c, (k * step) / (n * n));
    sc.disc(a, b, r, { fill: color, color, fillAlpha: k ? st.fa ?? 0.05 : st.fa0 ?? 0.14, alpha: k ? 0.4 : 0.85, width: k ? 1 : 1.7, grid: !k && st.grid }, ctr);
    if (st.labels !== false) sc.tex(kfmt(k * step), add3(ctr, rim), { color, dx: 10, size: 12, align: 'left', baseline: 'middle' });
  }
}
const cubeEdges = (sc, st, s = 1) => { for (const a of [-s, s]) for (const b of [-s, s]) { sc.line([-s, a, b], [s, a, b], st, 4); sc.line([a, -s, b], [a, s, b], st, 4); sc.line([a, b, -s], [a, b, s], st, 4); } };
/** A line through 0 in direction d, drawn across the scene. */
const line3 = (sc, d, st, L = 1.7) => { const e = unit3(d); sc.line(mul3(e, -L), mul3(e, L), st, 12); };
/** Columns of the 3×3 matrix with columns a, b, c. */
const cols3 = (a, b, c) => [0, 1, 2].map((i) => [a[i], b[i], c[i]]);
/** Smallest eigenpair of the symmetric 2×2 matrix A·Aᵀ (A is 2×n): σ_min² and its unit eigenvector. */
function minDir(A) {
  const p = A[0].reduce((s, x) => s + x * x, 0), r = A[1].reduce((s, x) => s + x * x, 0), q = A[0].reduce((s, x, i) => s + x * A[1][i], 0);
  const lam = (p + r) / 2 - Math.sqrt(((p - r) / 2) ** 2 + q * q);
  let e = [q, lam - p]; if (Math.hypot(...e) < 1e-9) e = [lam - r, q]; if (Math.hypot(...e) < 1e-9) e = [1, 0];
  const l = Math.hypot(...e); return { s: Math.sqrt(Math.max(0, lam)), e: [e[0] / l, e[1] / l] };
}

export default {
  collection: 'ladr',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.105
    {
      num: '3.105',
      kind: 'Theorem',
      name: 'Dimension of quotient space',
      statement: String.raw`Suppose $V$ is finite-dimensional and $U$ is a subspace of $V$. Then $V/U$ is finite-dimensional and $$\dim V/U=\dim V-\dim U.$$`,
      idea: String.raw`Use the quotient map $\pi\colon V\to V/U$, $\pi(v)=v+U$. It is linear by the way the operations on $V/U$ are defined (3.103), and it is surjective by construction. Its null space is exactly $U$, because $v+U=0+U$ holds precisely when $v\in U$ (3.101). The fundamental theorem of linear maps 3.21 applied to $\pi$ now reads $\dim V=\dim U+\dim V/U$.`,
      caption: String.raw`Choose the subspace $U$ of $\mathbf R^3$ (blue) and tilt it by dragging $u_1,u_2$; drag $v$ (gold) and drag the background to rotate. The elements of $V/U$ are the translates of $U$ (orange, and $v+U$ in gold). Each translate crosses the green complement $U^\perp$ in exactly one point, so the translates form a family with $3-\dim U$ free parameters: single points, a plane's worth of lines, a line's worth of planes, one translate. Drag $u_2$ onto the line of $u_1$ and $U$ is only a line — the count follows the true dimension.`,
      deps: ['ladr-3.101', 'ladr-3.103', 'ladr-3.21'],
      tags: ['quotients', 'dimension'],
      viz(v) {
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -2.25, pitch: 0.3, axis: 1.5, lim: 1.4 });
        const kSel = v.select('$U$', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: 'a line' }, { value: '2', label: 'a plane' }, { value: '3', label: '$\\mathbf R^3$' }], '1');
        const U1 = sc.handle([0.9, 0.45, 0.7], { color: 'blue', label: 'u₁' });
        const U2 = sc.handle([-0.6, 0.9, 0.25], { color: 'blue', label: 'u₂', snap: (p) => snapLine3(p, U1.p, 0.14) });
        const V = sc.handle([0.5, -0.9, 0.9], { color: 'gold', label: 'v' });
        v.legend([['blue', '$U$'], ['gold', 'the translate $v+U$'], ['orange', 'other translates'], ['green', '$U^\\perp$: one point per translate']]);
        let st = null;
        v.render(() => {
          const k = +kSel.value;
          U1.visible = k === 1 || k === 2; U2.visible = k === 2;
          sc.begin();
          const B = k === 3 ? orth([[1, 0, 0], [0, 1, 0], [0, 0, 1]]) : orth([U1.p, U2.p].slice(0, k));
          const W = compl(B), d = B.length, p = V.p, f = projOnto(p, W);
          if (k === 1 || k === 2) [U1, U2].slice(0, k).forEach((h) => sc.arrow(ZERO, h.p, { color: 'blue', width: 2.2, head: 9 }));
          if (d === 0) {
            const g = [-0.9, 0, 0.9], pts = [];
            for (const a of g) for (const b of g) for (const c of g) if (a || b || c) pts.push([a, b, c]);
            sc.dots(pts, { r: 3, color: 'orange' });
            sc.dot(ZERO, { r: 5.5, color: 'blue' });
          } else if (d === 1) {
            const e = B[0], [w1, w2] = W;
            sc.disc(w1, w2, 1.35, { fill: 'green', fillAlpha: 0.06, color: 'green', alpha: 0.5 });
            for (const s of [-0.85, 0, 0.85]) for (const t of [-0.85, 0, 0.85]) {
              if (!s && !t) continue;
              const g = add3(mul3(w1, s), mul3(w2, t));
              sc.line(add3(g, mul3(e, -1.45)), add3(g, mul3(e, 1.45)), { color: 'orange', width: 1.3, alpha: 0.6 });
              sc.dot(g, { r: 2.8, color: 'green', top: false });
            }
            sc.line(mul3(e, -1.7), mul3(e, 1.7), { color: 'blue', width: 3.4 }, 12);
            sc.line(add3(f, mul3(e, -1.7)), add3(f, mul3(e, 1.7)), { color: 'gold', width: 3.4 }, 12);
          } else if (d === 2) {
            const nrm = W[0];
            for (const t of [-0.95, 0.95]) sc.disc(B[0], B[1], 1.0, { fill: 'orange', fillAlpha: 0.05, color: 'orange', alpha: 0.5 }, mul3(nrm, t));
            sc.disc(B[0], B[1], 1.25, { fill: 'blue', fillAlpha: 0.1, color: 'blue', grid: true });
            sc.disc(B[0], B[1], 1.0, { fill: 'gold', fillAlpha: 0.16, color: 'gold', width: 2 }, f);
            sc.line(mul3(nrm, -1.7), mul3(nrm, 1.7), { color: 'green', width: 2.6 }, 12);
            for (const t of [-0.95, 0.95]) sc.dot(mul3(nrm, t), { r: 3.2, color: 'green' });
          } else {
            cubeEdges(sc, { color: 'gold', width: 1.4, alpha: 0.55 }, 1.1);
            sc.tex('v+U=V', [1.1, -1.1, 1.1], { color: 'gold', dy: -12 });
          }
          if (d >= 1) sc.dot(f, { r: 6.5, color: 'green' });
          if (d === 1 || d === 2) sc.line(p, f, { color: 'gold', width: 1.4, dash: [4, 4] });
          sc.flush();
          st = { k, d, f, W, dist: len3(sub3(p, projOnto(p, B))) };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, d, f, dist } = st;
          const what = ['the translates are single points — a three-parameter family', 'the translates are lines parallel to $U$, one through each point of the plane $U^\\perp$', 'the translates are planes parallel to $U$, one through each point of the line $U^\\perp$', 'there is just one translate, $V$ itself'][d];
          return (k === 2 && d === 1 ? '($u_2$ lies on the line of $u_1$, so $U$ is only a line.) ' : '') + `$\\dim U = ${d}$: ${what}, so $\\dim V/U = 3-${d} = ${3 - d}$.` +
            (d === 1 || d === 2 ? ` The gold translate meets $U^\\perp$ at $${vt(f)}$; $\\operatorname{dist}(v,U) = ${tn(dist)}$, ${dist < 5e-3 ? 'so $v\\in U$ and $v+U=U$ is the zero of $V/U$ — the null space of $\\pi$ is $U$.' : 'so $v+U\\ne U$: only vectors of $U$ are sent to $0$ by $\\pi$.'}` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.107
    {
      num: '3.107',
      kind: 'Theorem',
      name: 'Null space and range of the induced map T̃',
      statement: String.raw`Suppose $T\in\mathcal L(V,W)$, and let $\tilde T\colon V/(\operatorname{null}T)\to W$ be the induced map $\tilde T(v+\operatorname{null}T)=Tv$, which is well defined and linear. Then
(a) $\tilde T\circ\pi=T$, where $\pi$ is the quotient map of $V$ onto $V/(\operatorname{null}T)$;
(b) $\tilde T$ is injective;
(c) $\operatorname{range}\tilde T=\operatorname{range}T$;
(d) $V/(\operatorname{null}T)$ and $\operatorname{range}T$ are isomorphic vector spaces.`,
      idea: String.raw`If $v+\operatorname{null}T=w+\operatorname{null}T$ then $v-w\in\operatorname{null}T$ (3.101), so $Tv=Tw$: $T$ is constant on each translate of its null space, which is exactly what makes $\tilde T$ well defined; linearity comes from the operations of 3.103, and (a), (c) are the definition. For (b), $\tilde T(v+\operatorname{null}T)=0$ means $Tv=0$, i.e. $v\in\operatorname{null}T$, i.e. $v+\operatorname{null}T$ is the zero of the quotient. Regarded as a map onto $\operatorname{range}T$, $\tilde T$ is then injective and surjective — an isomorphism (3.69), which is (d).`,
      caption: String.raw`A map $T\colon\mathbf R^3\to\mathbf R^2$; its null space is red. Drag $v$ (gold): the slider slides a point along its translate $v+\operatorname{null}T$, and its image on the right never moves — $T$ is constant on translates. Drag $w$ on the right: the one translate sent to it is drawn green. Only $\operatorname{null}T$ itself lands on $0$. Switch to rank 1: the null space becomes a plane, the translates become planes, and the range shrinks to a line — still matched one to one.`,
      deps: ['ladr-3.103', 'ladr-3.101', 'ladr-3.69'],
      tags: ['quotients'],
      viz(v) {
        const M = v.M;
        const S3 = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, title: '$V=\\mathbf R^3$: translates of $\\operatorname{null}T$' });
        const sc = v.scene3(S3, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.35 });
        const SW = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 380, minWidth: 250, title: '$W=\\mathbf R^2$: one point per translate' });
        const rSel = v.select('$T$', [{ value: '2', label: 'rank 2: null space a line' }, { value: '1', label: 'rank 1: null space a plane' }], '2');
        const slide = v.slider('slide along $v+\\operatorname{null}T$', -1.4, 1.4, 0.8, { step: 0.01 });
        const A2 = [[0.9, 0.5, -0.6], [-0.3, 0.8, 0.7]], A1 = [[0.9, 0.5, -0.6], [0.45, 0.25, -0.3]];
        const Vh = sc.handle([-0.2, 0.9, 0.5], { color: 'gold', label: 'v' });
        const rdir = [0.9 / Math.hypot(0.9, 0.45), 0.45 / Math.hypot(0.9, 0.45)];
        const onRange = (x, y) => { if (rSel.value === '2') return [x, y]; const t = dot2([x, y], rdir); return [rdir[0] * t, rdir[1] * t]; };
        const Wh = SW.handle(-1.1, 1.0, { color: 'green', label: 'w', constrain: onRange });
        v.legend([['red', '$\\operatorname{null}T\\mapsto 0$'], ['gold', '$v+\\operatorname{null}T\\mapsto Tv$'], ['green', 'the translate sent to $w$'], ['orange', 'other translates']]);
        let st = null;
        v.render(() => {
          const A = rSel.value === '2' ? A2 : A1, N = M.nullspace(A), R = 3 - N.length, Cm = compl(orth(N));
          const w0 = onRange(Wh.x, Wh.y); Wh.x = w0[0]; Wh.y = w0[1];
          const p = Vh.p, Tv = M.matVec(A, p), q = add3(p, mul3(N[0], slide.value)), Tq = M.matVec(A, q);
          const x0 = M.matVec(M.pinv(A), w0);
          const foot = (x) => sub3(x, projOnto(x, N));
          const extras = [mul3(Cm[0], 1.0), mul3(Cm[0], -1.0)];
          sc.begin();
          const coset = (x, st2) => {
            const f = foot(x);
            if (N.length === 1) sc.line(add3(f, mul3(N[0], -1.6)), add3(f, mul3(N[0], 1.6)), st2, 12);
            else sc.disc(N[0], N[1], 1.0, { fill: st2.color, fillAlpha: st2.fa ?? 0.08, color: st2.color, alpha: 0.7, width: st2.width * 0.6, grid: st2.grid }, f);
          };
          extras.forEach((g) => coset(g, { color: 'orange', width: 1.6, alpha: 0.6, fa: 0.04 }));
          coset(ZERO, { color: 'red', width: 3.2, fa: 0.1, grid: true });
          coset(x0, { color: 'green', width: 3, fa: 0.09 });
          coset(p, { color: 'gold', width: 3.4, fa: 0.13 });
          sc.dot(q, { r: 6, color: 'pink' });
          sc.line(p, q, { color: 'pink', width: 2, dash: [3, 3] });
          sc.flush();
          if (R === 2) SW.rect(-9, -9, 9, 9, { fill: 'teal', fillAlpha: 0.05, stroke: false });
          else SW.line(-5 * rdir[0], -5 * rdir[1], 5 * rdir[0], 5 * rdir[1], { color: 'teal', width: 7, alpha: 0.22 });
          SW.corner(R === 2 ? 'range T = all of ℝ²' : 'range T = a line', 'tl', { color: 'teal' });
          extras.forEach((g) => { const y = M.matVec(A, g); SW.dot(y[0], y[1], { r: 5, color: 'orange' }); });
          SW.dot(0, 0, { r: 6, color: 'red' });
          SW.dot(Tq[0], Tq[1], { r: 12, hollow: true, color: 'pink', width: 2 });
          SW.dot(Tv[0], Tv[1], { r: 6.5, color: 'gold' });
          SW.tex('Tv', Tv[0], Tv[1], { color: 'gold', dx: 14, dy: 12, align: 'left' });
          st = { Tv, Tq, R, s: slide.value };
        });
        v.readout(() => {
          if (!st) return '';
          const { Tv, Tq, R } = st;
          return `$Tv = ${vt(Tv)}$ and $T(v+s\\,n) = ${vt(Tq)}$ for the pink point ($n\\in\\operatorname{null}T$): $T$ is constant on the translate, so $\\tilde T(v+\\operatorname{null}T)=Tv$ is well defined. Different translates go to different points, and only $\\operatorname{null}T$ goes to $0$ — $\\tilde T$ is injective onto $\\operatorname{range}T$, and $\\dim V/\\operatorname{null}T = 3-${3 - R} = ${R} = \\dim\\operatorname{range}T$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.110
    {
      num: '3.110',
      kind: 'Definition',
      name: 'Dual space V′',
      statement: String.raw`A **linear functional** on $V$ is a linear map from $V$ to $\mathbf F$. The **dual space** of $V$, written $V'$, is the vector space of all linear functionals on $V$: $$V'=\mathcal L(V,\mathbf F),$$ with $(\varphi+\psi)(v)=\varphi(v)+\psi(v)$ and $(\lambda\varphi)(v)=\lambda\,\varphi(v)$.`,
      idea: String.raw`Since $\mathcal L(V,W)$ is a vector space for every $W$ (3.6), taking $W=\mathbf F$ makes the functionals a vector space with no further work. On $\mathbf R^2$ every functional has the form $\varphi(x,y)=ax+by$, and it is best pictured by its level lines $\varphi=k$: a family of evenly spaced parallel lines (unless $\varphi=0$). Scaling $\varphi$ by $2$ halves the spacing; adding two functionals adds their values point by point, which produces a new family of parallel lines.`,
      caption: String.raw`Two functionals $\varphi$ (blue) and $\psi$ (orange) are shown by their level lines; drag the dot on the line of level $1$ of each to turn and space its lines. The sliders form $\chi=\lambda\varphi+\mu\psi$ (green, with its levels printed along the edge). Drag the test vector $v$: the readout checks $\chi(v)=\lambda\varphi(v)+\mu\psi(v)$. Set $\lambda=\mu=0$ for the zero functional — no level lines at all, since every vector sits on level $0$.`,
      deps: ['ladr-3.6'],
      see: ['fa-3.1'],
      tags: ['duality'],
      viz(v) {
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.3, 2.3], equal: true, height: 400 });
        const P = fHandle(S, [0.62, 0.22], 'blue', 'φ'), Q = fHandle(S, [-0.22, 0.6], 'orange', 'ψ');
        const lam = v.slider('$\\lambda$', -2, 2, 1, { step: 0.05 }), mu = v.slider('$\\mu$', -2, 2, 0.5, { step: 0.05 });
        const show = v.toggle('show $\\varphi$ and $\\psi$', true);
        const X = S.handle(1.7, 1.15, { color: 'gold', label: 'v' });
        v.legend([['blue', '$\\varphi$', { dash: true }], ['orange', '$\\psi$', { dash: true }], ['green', '$\\chi=\\lambda\\varphi+\\mu\\psi$'], ['gold', 'test vector $v$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const a = coef(P), b = coef(Q), l = lam.value, m = mu.value, c = [l * a[0] + m * b[0], l * a[1] + m * b[1]];
          P.visible = Q.visible = show.value;
          levels(S, c, { color: 'green', width: 1.5 });
          if (show.value) {
            levels(S, a, { color: 'blue', strips: false, labels: false, dash: [5, 4], width: 1.1, alpha: 0.65, max: 14 });
            levels(S, b, { color: 'orange', strips: false, labels: false, dash: [5, 4], width: 1.1, alpha: 0.65, max: 14 });
          }
          if (dot2(c, c) < 1e-12) S.corner('χ = 0: every vector lies on level 0', 'tl', { color: 'green' });
          arr(S, [0, 0], [X.x, X.y], 'gold', null, { width: 2.2 });
          S.dot(0, 0, { r: 3, color: 'ink' });
          st = { a, b, c, x: [X.x, X.y], l, m };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, c, x, l, m } = st, fa = dot2(a, x), fb = dot2(b, x), fc = dot2(c, x);
          return `$\\varphi(x,y) = ${linTeX(a)}$, $\\psi(x,y) = ${linTeX(b)}$, $\\chi(x,y) = ${linTeX(c)}$. At $v$: $\\chi(v) = ${tn(fc)}$ and $\\lambda\\varphi(v)+\\mu\\psi(v) = ${tn(l)}\\cdot${tn(fa)} + ${tn(m)}\\cdot${tn(fb)} = ${tn(l * fa + m * fb)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.111
    {
      num: '3.111',
      kind: 'Theorem',
      name: 'dim V′ = dim V',
      statement: String.raw`Suppose $V$ is finite-dimensional. Then $V'$ is also finite-dimensional and $\dim V'=\dim V$.`,
      idea: String.raw`By 3.72, $\dim\mathcal L(V,W)=(\dim V)(\dim W)$; with $W=\mathbf F$, of dimension $1$, this is $\dim V'=\dim V$. Concretely, for a basis $v_1,\dots,v_n$ the map $\varphi\mapsto(\varphi(v_1),\dots,\varphi(v_n))$ is an isomorphism $V'\to\mathbf F^n$: a functional is pinned down by its values on a basis, and any values whatever can be prescribed (the linear map lemma 3.4).`,
      caption: String.raw`Left: a basis $v_1,v_2$ of $\mathbf R^2$ and a functional $\varphi$ (drag the dot on its line of level $1$). Right: the pair $(\varphi(v_1),\varphi(v_2))$. Drag either side — every point on the right is one functional on the left, and back: two free numbers, so $\dim V'=2$. Drag $v_2$ onto the line of $v_1$: no longer a basis, and the pairs that occur collapse to a red line.`,
      deps: ['ladr-3.72', 'ladr-3.110', 'ladr-3.4'],
      tags: ['duality', 'dimension'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 380, weight: 1.4, title: '$V=\\mathbf R^2$: basis $v_1,v_2$ and $\\varphi$' });
        const D = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 380, minWidth: 240, title: 'the pair $(\\varphi(v_1),\\varphi(v_2))$' });
        let c = [0.55, 0.85], deg = false, b1 = [1.3, 0.3], b2 = [0.35, 1.2];
        const solve = (u1, u2, ab) => { const dd = dual2(u1, u2); return dd ? [dd[0][0] * ab[0] + dd[1][0] * ab[1], dd[0][1] * ab[0] + dd[1][1] * ab[1]] : null; };
        const keepAB = () => { const ab = [dot2(c, b1), dot2(c, b2)]; return ab; };
        let abPrev = keepAB();
        const B1 = S.handle(b1[0], b1[1], { color: 'blue', label: 'v₁', constrain: (x, y) => minLen2(x, y, 0.3) });
        const B2 = S.handle(b2[0], b2[1], { color: 'purple', label: 'v₂', constrain: (x, y) => snap2(minLen2(x, y, 0.3), [B1.x, B1.y], 0.12) });
        const onBasis = () => { const nb1 = [B1.x, B1.y], nb2 = [B2.x, B2.y]; const nc = solve(nb1, nb2, abPrev); if (nc) c = nc; };
        B1.onDrag = onBasis; B2.onDrag = onBasis;
        const F = fHandle(S, foot2(c), 'green', 'φ', 0.25);
        F.onDrag = () => { c = coef(F); };
        const rdir = () => { const l1 = Math.hypot(...b1), l2 = Math.hypot(...b2), s = Math.sign(dot2(b1, b2)) || 1, l = Math.hypot(l1, l2); return [l1 / l, (s * l2) / l]; };
        const Qh = D.handle(abPrev[0], abPrev[1], {
          color: 'green', label: 'φ',
          constrain: (x, y) => { if (!deg) return [x, y]; const r = rdir(), t = x * r[0] + y * r[1]; return [r[0] * t, r[1] * t]; },
        });
        Qh.onDrag = () => { if (!deg) { const nc = solve(b1, b2, [Qh.x, Qh.y]); if (nc) c = nc; } else c = [(b1[0] * Qh.x) / dot2(b1, b1), (b1[1] * Qh.x) / dot2(b1, b1)]; };
        v.legend([['green', 'level lines of $\\varphi$'], ['blue', '$v_1$'], ['purple', '$v_2$']]);
        let st = null;
        v.render(() => {
          b1 = [B1.x, B1.y]; b2 = [B2.x, B2.y]; deg = !dual2(b1, b2);
          const ab = keepAB(); abPrev = ab;
          Qh.x = ab[0]; Qh.y = ab[1];
          const nz = dot2(c, c) > 1e-10, ft = nz ? foot2(c) : [99, 99];
          if (!F.dragging) { F.x = ft[0]; F.y = ft[1]; }
          F.visible = nz && Math.abs(ft[0]) < 2.9 && Math.abs(ft[1]) < 2.3;
          if (nz) levels(S, c, { color: 'green' }); else S.corner('φ = 0', 'tl', { color: 'green' });
          arr(S, [0, 0], b1, 'blue', null); arr(S, [0, 0], b2, 'purple', null);
          if (!deg) D.rect(-9, -9, 9, 9, { fill: 'green', fillAlpha: 0.06, stroke: false });
          else { const r = rdir(); D.line(-9 * r[0], -9 * r[1], 9 * r[0], 9 * r[1], { color: 'red', width: 2.5 }); }
          D.corner(deg ? 'only these pairs occur' : 'every pair occurs', 'tl', { color: deg ? 'red' : 'green' });
          D.line(ab[0], ab[1], ab[0], 0, { color: 'blue', dash: [4, 4], width: 1.2 }); D.line(ab[0], ab[1], 0, ab[1], { color: 'purple', dash: [4, 4], width: 1.2 });
          D.dot(ab[0], 0, { r: 3.5, color: 'blue' }); D.dot(0, ab[1], { r: 3.5, color: 'purple' });
          D.dot(0, 0, { r: 4, color: 'ink' });
          D.text('0', 0, 0, { dx: -8, dy: 10, color: 'muted', size: 11 });
          D.text('φ(v₁)', 3.0, 0, { dy: -10, align: 'right', color: 'blue', size: 12 });
          D.text('φ(v₂)', 0, 3.0, { dx: 8, align: 'left', color: 'purple', size: 12 });
          st = { ab, c, deg };
        });
        v.readout(() => {
          if (!st) return '';
          const { ab, c, deg } = st;
          if (deg) return `$v_1,v_2$ is not a basis: $\\varphi(v_2)$ is forced by $\\varphi(v_1)$, the pairs fill only a line, and the two numbers no longer determine $\\varphi$.`;
          return `$\\varphi(v_1) = ${tn(ab[0])}$ and $\\varphi(v_2) = ${tn(ab[1])}$ determine $\\varphi(x,y) = ${linTeX(c)}$, and every pair arises from exactly one $\\varphi$. So $\\varphi\\mapsto(\\varphi(v_1),\\varphi(v_2))$ is an isomorphism $V'\\to\\mathbf F^2$: $\\dim V' = 2 = \\dim V$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.112
    {
      num: '3.112',
      kind: 'Definition',
      name: 'Dual basis',
      statement: String.raw`If $v_1,\dots,v_n$ is a basis of $V$, then the **dual basis** of $v_1,\dots,v_n$ is the list $\varphi_1,\dots,\varphi_n$ of elements of $V'$, where each $\varphi_j$ is the linear functional on $V$ with $$\varphi_j(v_k)=\begin{cases}1&\text{if }k=j,\\0&\text{if }k\ne j.\end{cases}$$`,
      idea: String.raw`Each $\varphi_j$ exists and is unique by the linear map lemma 3.4: a linear map may be given arbitrary values on a basis. In $\mathbf R^2$ the picture is rigid: $\varphi_1$ vanishes on $v_2$, so its level lines are parallel to $v_2$, and its line of level $1$ runs through the tip of $v_1$. In coordinates, $\varphi_j$ is the $j$-th row of the inverse of the matrix whose columns are $v_1,\dots,v_n$.`,
      caption: String.raw`Drag the basis vectors $v_1$ (blue) and $v_2$ (purple). The level lines of $\varphi_1$ run parallel to $v_2$, with level $1$ through the tip of $v_1$; those of $\varphi_2$ run parallel to $v_1$. Show both and they form the skew grid of the basis. The table evaluates $\varphi_j(v_k)$ live. Drag $v_2$ onto the line of $v_1$ and there is no dual basis: the lines of $\varphi_1$ would have to be parallel to $v_2$ and still cross it.`,
      deps: ['ladr-3.4', 'ladr-3.110'],
      tags: ['duality', 'bases'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, height: 390, weight: 1.6 });
        const TS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, minWidth: 210, title: 'the values $\\varphi_j(v_k)$' });
        const tab = v.table(TS, { rows: 2, cols: 2, maxCell: 62, size: 17, rowLabels: ['$\\varphi_1$', '$\\varphi_2$'], colLabels: ['$v_1$', '$v_2$'], region: [0, 0.36, 1, 1] });
        const sel = v.select('show', [{ value: '1', label: '$\\varphi_1$' }, { value: '2', label: '$\\varphi_2$' }, { value: 'b', label: 'both' }], '1');
        const H1 = S.handle(1.25, 0.35, { color: 'blue', label: 'v₁', constrain: (x, y) => minLen2(x, y, 0.3) });
        const H2 = S.handle(0.45, 1.15, { color: 'purple', label: 'v₂', constrain: (x, y) => snap2(minLen2(x, y, 0.3), [H1.x, H1.y], 0.1) });
        let st = null;
        v.render(() => {
          const b1 = [H1.x, H1.y], b2 = [H2.x, H2.y], D = dual2(b1, b2), s = sel.value;
          if (D) {
            if (s !== '2') levels(S, D[0], { color: 'blue', side: 1 });
            if (s !== '1') levels(S, D[1], { color: 'purple', side: -1 });
            if (s === '1') S.dot(b1[0], b1[1], { r: 11, hollow: true, color: 'blue', width: 2 });
            if (s === '2') S.dot(b2[0], b2[1], { r: 11, hollow: true, color: 'purple', width: 2 });
          } else S.corner('v₁, v₂ is not a basis — no dual basis', 'tl', { color: 'red' });
          arr(S, [0, 0], b1, 'blue', null, { width: 3 }); arr(S, [0, 0], b2, 'purple', null, { width: 3 });
          S.dot(0, 0, { r: 3, color: 'ink' });
          const val = (i, j) => (D ? +dot2(D[i], [b1, b2][j]).toFixed(3) : '—');
          tab.draw({ value: (i, j) => val(i, j), format: (x) => (typeof x === 'number' ? kfmt(x) : x), fill: (i, j) => (D ? (i === j ? ['green', 0.25] : null) : ['red', 0.12]) });
          if (D) {
            TS.tex(`\\varphi_1(x,y) = ${linTeX(D[0])}`, 0.5, 0.22, { color: 'blue', align: 'center', size: 14 });
            TS.tex(`\\varphi_2(x,y) = ${linTeX(D[1])}`, 0.5, 0.1, { color: 'purple', align: 'center', size: 14 });
          }
          st = { D };
        });
        v.readout(() => {
          if (!st) return '';
          if (!st.D) return '$v_1, v_2$ are parallel, so they are not a basis and the conditions $\\varphi_1(v_1)=1$, $\\varphi_1(v_2)=0$ contradict each other.';
          return `$\\varphi_1$ vanishes on $v_2$ and takes the value $1$ at $v_1$; $\\varphi_2$ vanishes on $v_1$ and takes the value $1$ at $v_2$ — the table is the identity. Each $\\varphi_j$ is a row of $[\\,v_1\\ v_2\\,]^{-1}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.114
    {
      num: '3.114',
      kind: 'Theorem',
      name: 'Dual basis gives coefficients for linear combination',
      statement: String.raw`Suppose $v_1,\dots,v_n$ is a basis of $V$ and $\varphi_1,\dots,\varphi_n$ is the dual basis. Then $$v=\varphi_1(v)v_1+\cdots+\varphi_n(v)v_n$$ for every $v\in V$.`,
      idea: String.raw`Write $v=c_1v_1+\cdots+c_nv_n$, possible because the $v_k$ form a basis. Applying $\varphi_j$ and using linearity together with $\varphi_j(v_k)=0$ for $k\ne j$ and $\varphi_j(v_j)=1$ (3.112) leaves $\varphi_j(v)=c_j$. So the dual basis functionals are exactly the coordinate functionals of the basis: $\varphi_j(v)$ tells which level plane of $\varphi_j$ the vector $v$ lies on.`,
      caption: String.raw`A skewed basis $v_1,v_2,v_3$ of $\mathbf R^3$ (drag the tips; drag the background to rotate) and a vector $v$ (gold). The three small discs through $v$ are the level planes of $\varphi_1,\varphi_2,\varphi_3$ on which $v$ lies; their levels, $\varphi_j(v)$, are the edge lengths of the box spanned by $\varphi_1(v)v_1$, $\varphi_2(v)v_2$, $\varphi_3(v)v_3$, and the coloured path walks along them from $0$ to $v$. Flatten the basis and the box degenerates — then no dual basis exists.`,
      deps: ['ladr-3.112'],
      tags: ['duality'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, axes: false, height: 430 });
        const sc = v.scene3(S, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const HB = [[1.1, 0.3, -0.1], [0.15, 1.1, 0.15], [-0.2, 0.25, 1.0]].map((p, i) => sc.handle(p, { color: VC[i], label: ['v₁', 'v₂', 'v₃'][i] }));
        const X = sc.handle([0.8, 1.2, 0.9], { color: 'gold', label: 'v' });
        const pl = v.toggle('level planes through $v$', true);
        v.legend([['blue', '$\\varphi_1(v)\\,v_1$'], ['purple', '$\\varphi_2(v)\\,v_2$'], ['teal', '$\\varphi_3(v)\\,v_3$'], ['gold', '$v$', { dot: true }]]);
        let st = null;
        v.render(() => {
          sc.begin();
          const B = HB.map((h) => h.p), Bm = cols3(B[0], B[1], B[2]), dt = M.det(Bm);
          B.forEach((b, i) => sc.arrow(ZERO, b, { color: VC[i], width: 2, head: 8, alpha: 0.75 }));
          if (Math.abs(dt) < 0.02) { sc.flush(); S.corner('v₁, v₂, v₃ nearly dependent — not a basis', 'tl', { color: 'red' }); st = { bad: true }; return; }
          const co = M.matVec(M.inverse(Bm), X.p), e = co.map((cj, j) => mul3(B[j], cj));
          const corner = (m) => [0, 1, 2].reduce((s, j) => ((m >> j) & 1 ? add3(s, e[j]) : s), ZERO);
          for (let m = 0; m < 8; m++) for (let j = 0; j < 3; j++) if (!((m >> j) & 1)) sc.line(corner(m), corner(m | (1 << j)), { color: 'muted', width: 1, alpha: 0.4, dash: [3, 4] });
          if (pl.value) for (let j = 0; j < 3; j++) { const [a, b] = orth([B[(j + 1) % 3], B[(j + 2) % 3]]); sc.disc(a, b, 0.42, { fill: VC[j], fillAlpha: 0.14, color: VC[j], alpha: 0.6 }, X.p); }
          let s = ZERO;
          co.forEach((cj, j) => { const n = add3(s, e[j]); sc.arrow(s, n, { color: VC[j], width: 3.4, head: 10 }); s = n; });
          sc.flush();
          st = { co, sum: s, err: len3(sub3(s, X.p)) };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.bad) return 'The three vectors are (nearly) linearly dependent; pull them apart to get a basis.';
          const { co, sum, err } = st;
          return `$\\varphi_1(v) = ${tn(co[0])}$, $\\varphi_2(v) = ${tn(co[1])}$, $\\varphi_3(v) = ${tn(co[2])}$, and $\\varphi_1(v)v_1+\\varphi_2(v)v_2+\\varphi_3(v)v_3 = ${vt(sum)}$ — which is $v$ (difference $${v.sci(err + 1e-17, 1)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.116
    {
      num: '3.116',
      kind: 'Theorem',
      name: 'Dual basis is a basis of the dual space',
      statement: String.raw`Suppose $V$ is finite-dimensional. Then the dual basis of a basis of $V$ is a basis of $V'$.`,
      idea: String.raw`Let $v_1,\dots,v_n$ be a basis with dual basis $\varphi_1,\dots,\varphi_n$. If $a_1\varphi_1+\cdots+a_n\varphi_n=0$, evaluating at $v_k$ gives $a_k=0$, so the list is linearly independent. It has length $n=\dim V'$ (3.111), so it is a basis by 2.38. Evaluating at the $v_k$ also identifies the coefficients: every $\psi\in V'$ equals $\psi(v_1)\varphi_1+\cdots+\psi(v_n)\varphi_n$, because both sides agree on a basis.`,
      caption: String.raw`An arbitrary functional $\psi$ (green; drag the dot on its line of level $1$) and a basis $v_1,v_2$. The sliders build $c_1\varphi_1+c_2\varphi_2$ from the dual basis (orange dashed lines); the right panel shows the residual $\rho=\psi-(c_1\varphi_1+c_2\varphi_2)$, with its values at $v_1,v_2$. Try to make the orange lines land on the green ones: it works exactly when $c_j=\psi(v_j)$ — press the button.`,
      deps: ['ladr-3.111', 'ladr-2.38', 'ladr-3.112'],
      tags: ['duality', 'bases'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, height: 380, weight: 1.5, title: '$\\psi$ and $c_1\\varphi_1+c_2\\varphi_2$' });
        const R = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 380, minWidth: 220, title: 'residual $\\rho=\\psi-(c_1\\varphi_1+c_2\\varphi_2)$' });
        const H1 = S.handle(1.3, -0.25, { color: 'blue', label: 'v₁', constrain: (x, y) => minLen2(x, y, 0.4) });
        const H2 = S.handle(0.55, 1.1, { color: 'purple', label: 'v₂', constrain: (x, y) => minLen2(x, y, 0.4) });
        const Ps = fHandle(S, [0.42, 0.48], 'green', 'ψ');
        let exact = false;
        const c1 = v.slider('$c_1$', -3, 3, 0.4, { step: 0.05, onChange: () => { exact = false; } });
        const c2 = v.slider('$c_2$', -3, 3, 1.6, { step: 0.05, onChange: () => { exact = false; } });
        let st = null;
        v.button('Set cⱼ = ψ(vⱼ)', () => { if (st) { c1.set(st.pv[0]); c2.set(st.pv[1]); exact = true; } });
        v.legend([['green', '$\\psi$'], ['orange', '$c_1\\varphi_1+c_2\\varphi_2$', { dash: true }], ['red', 'residual $\\rho$']]);
        v.render(() => {
          const b1 = [H1.x, H1.y], b2 = [H2.x, H2.y], D = dual2(b1, b2), p = coef(Ps);
          if (Ps.dragging || H1.dragging || H2.dragging) exact = false;
          const pv = [dot2(p, b1), dot2(p, b2)];
          if (!D) { S.corner('v₁, v₂ is not a basis', 'tl', { color: 'red' }); st = { pv, bad: true }; return; }
          const cc = exact ? pv : [c1.value, c2.value];
          const g = [cc[0] * D[0][0] + cc[1] * D[1][0], cc[0] * D[0][1] + cc[1] * D[1][1]], r = [p[0] - g[0], p[1] - g[1]];
          levels(S, p, { color: 'green' });
          levels(S, g, { color: 'orange', strips: false, dash: [6, 5], width: 1.6, side: -1 });
          for (const Z of [S, R]) { arr(Z, [0, 0], b1, 'blue', Z === R ? '\\,v_1' : null, { width: 2.6 }); arr(Z, [0, 0], b2, 'purple', Z === R ? '\\,v_2' : null, { width: 2.6 }); Z.dot(0, 0, { r: 3, color: 'ink' }); }
          const ok = Math.hypot(...r) < 1e-9;
          if (!ok) levels(R, r, { color: 'red' });
          R.corner(ok ? 'ρ = 0: an exact match' : `ρ(v₁) = ${kfmt(+dot2(r, b1).toFixed(2))},  ρ(v₂) = ${kfmt(+dot2(r, b2).toFixed(2))}`, 'bl', { color: ok ? 'green' : 'red' });
          st = { pv, cc, ok };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.bad) return 'Pull $v_1$ and $v_2$ apart: they must form a basis.';
          const { pv, cc, ok } = st;
          return `$\\psi(v_1) = ${tn(pv[0])}$, $\\psi(v_2) = ${tn(pv[1])}$; you chose $c_1 = ${tn(cc[0])}$, $c_2 = ${tn(cc[1])}$. ` + (ok ? `So $\\psi = \\psi(v_1)\\varphi_1+\\psi(v_2)\\varphi_2$ exactly: $\\varphi_1,\\varphi_2$ span $V'$ — and the coefficients were forced, which is their independence.` : `Since $\\rho(v_j) = \\psi(v_j)-c_j$, the residual vanishes only for $c_j=\\psi(v_j)$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.118
    {
      num: '3.118',
      kind: 'Definition',
      name: 'Dual map T′',
      statement: String.raw`Suppose $T\in\mathcal L(V,W)$. The **dual map** of $T$ is the linear map $T'\in\mathcal L(W',V')$ defined for each $\varphi\in W'$ by $$T'(\varphi)=\varphi\circ T.$$`,
      idea: String.raw`A composition of linear maps is linear, so $\varphi\circ T\colon V\to\mathbf F$ is a linear functional on $V$, an element of $V'$; and $T'$ itself is linear, because $(\varphi+\psi)\circ T=\varphi\circ T+\psi\circ T$ and $(\lambda\varphi)\circ T=\lambda(\varphi\circ T)$. Note the direction: $T$ goes from $V$ to $W$, but $T'$ goes from $W'$ back to $V'$ — a functional on $W$ is *pulled back* along $T$. Its level sets are preimages: $(T'\varphi)(v)=k$ exactly when $Tv$ lies on the level set $\varphi=k$.`,
      caption: String.raw`Right: the target $W=\mathbf R^2$ with a map $T$ given by $Te_1,Te_2$ (orange; the shaded cell is the image of the unit square) and a functional $\varphi$ (blue; drag the dot on its line of level $1$). Left: the pulled-back functional $T'\varphi=\varphi\circ T$ on $V$. Drag $v$: it lies on the same level on the left as $Tv$ does on the right. Drag $Te_2$ onto the line of $Te_1$ to make $T$ singular — the pulled-back lines all turn parallel to the null space (red), and disappear when $\varphi$ vanishes on the range.`,
      deps: ['ladr-3.110'],
      see: ['fa-4.10'],
      tags: ['duality'],
      viz(v) {
        const SV = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 370, title: "$V$: level lines of $T'\\varphi=\\varphi\\circ T$" });
        const SW = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 370, title: '$W$: level lines of $\\varphi$' });
        const X = SV.handle(1.1, 0.75, { color: 'gold', label: 'v' });
        const T1 = SW.handle(1.0, 0.3, { color: 'orange', label: 'Te₁', constrain: (x, y) => minLen2(x, y, 0.3) });
        const T2 = SW.handle(-0.4, 0.9, { color: 'orange', label: 'Te₂', constrain: (x, y) => snap2([x, y], [T1.x, T1.y], 0.1) });
        const F = fHandle(SW, [0.5, -0.3], 'blue', 'φ');
        v.legend([['blue', '$\\varphi$ on $W$'], ['green', "$T'\\varphi$ on $V$"], ['orange', '$T$: image of the unit square', { area: true }], ['gold', '$v$ and $Tv$']]);
        let st = null;
        v.render(() => {
          const t1 = [T1.x, T1.y], t2 = [T2.x, T2.y], c = coef(F), pull = [dot2(c, t1), dot2(c, t2)];
          const x = [X.x, X.y], Tx = [x[0] * t1[0] + x[1] * t2[0], x[0] * t1[1] + x[1] * t2[1]];
          levels(SW, c, { color: 'blue' });
          cell2(SW, t1, t2, 'orange');
          arr(SW, [0, 0], t1, 'orange', null); arr(SW, [0, 0], t2, 'orange', null);
          arr(SW, [0, 0], Tx, 'gold', 'Tv', { width: 2.4 });
          const zero = Math.hypot(...pull) < 1e-9;
          if (!zero) levels(SV, pull, { color: 'green' }); else SV.corner('T′φ = 0: φ vanishes on range T', 'tl', { color: 'red' });
          cell2(SV, [1, 0], [0, 1], 'muted');
          const sing = Math.abs(t1[0] * t2[1] - t1[1] * t2[0]) < 1e-9;
          if (sing) { const l = dot2(t2, t1) / dot2(t1, t1), n = [l, -1]; SV.line(-6 * n[0], -6 * n[1], 6 * n[0], 6 * n[1], { color: 'red', width: 2.5, alpha: 0.8 }); SV.corner('null T', 'br', { color: 'red' }); }
          arr(SV, [0, 0], x, 'gold', null, { width: 2.4 });
          SV.dot(0, 0, { r: 3, color: 'ink' }); SW.dot(0, 0, { r: 3, color: 'ink' });
          st = { pull, c, x, Tx, zero };
        });
        v.readout(() => {
          if (!st) return '';
          const { pull, c, x, Tx, zero } = st;
          return `$(T'\\varphi)(v) = ${tn(dot2(pull, x))}$ and $\\varphi(Tv) = ${tn(dot2(c, Tx))}$ — the same number. $T'\\varphi(x,y) = ${linTeX(pull)}$: its coefficients are $(\\varphi(Te_1),\\varphi(Te_2))$.` + (zero ? ' Here $\\varphi\\ne0$ but $T\'\\varphi=0$.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.120
    {
      num: '3.120',
      kind: 'Theorem',
      name: 'Algebraic properties of dual maps',
      statement: String.raw`(a) $(S+T)'=S'+T'$ for all $S,T\in\mathcal L(V,W)$.
(b) $(\lambda T)'=\lambda T'$ for all $\lambda\in\mathbf F$ and $T\in\mathcal L(V,W)$.
(c) $(ST)'=T'S'$ for all $T\in\mathcal L(U,V)$ and $S\in\mathcal L(V,W)$.`,
      idea: String.raw`All three come from unwinding the definition 3.118. For $\varphi\in W'$: $\varphi\circ(S+T)=\varphi\circ S+\varphi\circ T$ and $\varphi\circ(\lambda T)=\lambda(\varphi\circ T)$, because $\varphi$ is linear. For (c), composition is associative: $(ST)'(\varphi)=\varphi\circ(S\circ T)=(\varphi\circ S)\circ T=T'(S'(\varphi))$. The order reverses because the functional sits at the far end of the chain $U\to V\to W\to\mathbf F$: it must be pulled back through $S$ first, then through $T$.`,
      caption: String.raw`A chain $U\xrightarrow{T}V\xrightarrow{S}W$ of maps of $\mathbf R^2$ ($T$ by $Te_1,Te_2$ in the middle panel, $S$ by $Se_1,Se_2$ on the right) and $\varphi$ on $W$ (blue; drag the dot on its line of level $1$). The middle panel pulls $\varphi$ back through $S$; the left panel shows $(ST)'\varphi$ in green and, dashed, $T'(S'\varphi)$ — they coincide whatever you drag. Switch to the wrong order $S'(T'\varphi)$ (only computable here because all three spaces are $\mathbf R^2$): the dashed lines go red and wander off.`,
      deps: ['ladr-3.118'],
      tags: ['duality'],
      viz(v) {
        const M = v.M;
        const mk = (title) => v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 300, minWidth: 200, title });
        const SU = mk("$U$: $(ST)'\\varphi$ and $T'(S'\\varphi)$"), SV = mk("$V$: $S'\\varphi=\\varphi\\circ S$"), SW = mk('$W$: $\\varphi$');
        const mode = v.select('dashed', [{ value: 'r', label: "$T'(S'\\varphi)$" }, { value: 'w', label: "$S'(T'\\varphi)$ — wrong order" }], 'r');
        const T1 = SV.handle(1.0, 0.45, { color: 'orange', label: 'Te₁' }), T2 = SV.handle(-0.35, 0.85, { color: 'orange', label: 'Te₂' });
        const S1 = SW.handle(0.95, -0.35, { color: 'purple', label: 'Se₁' }), S2 = SW.handle(0.45, 1.0, { color: 'purple', label: 'Se₂' });
        const F = fHandle(SW, [-0.45, 0.5], 'blue', 'φ');
        v.legend([['blue', '$\\varphi$'], ['purple', "$S'\\varphi$"], ['green', "$(ST)'\\varphi$"], ['ink', 'dashed comparison', { dash: true }]]);
        let st = null;
        v.render(() => {
          const T = [[T1.x, T2.x], [T1.y, T2.y]], S = [[S1.x, S2.x], [S1.y, S2.y]], c = coef(F);
          const row = (r, A) => [r[0] * A[0][0] + r[1] * A[1][0], r[0] * A[0][1] + r[1] * A[1][1]];
          const sp = row(c, S), tsp = row(sp, T), stp = row(c, M.matMul(S, T)), wrong = row(row(c, T), S);
          const cmp = mode.value === 'r' ? tsp : wrong, match = Math.hypot(cmp[0] - stp[0], cmp[1] - stp[1]) < 1e-9;
          levels(SW, c, { color: 'blue' });
          cell2(SW, [S1.x, S1.y], [S2.x, S2.y], 'purple'); arr(SW, [0, 0], [S1.x, S1.y], 'purple', null, { width: 2.2 }); arr(SW, [0, 0], [S2.x, S2.y], 'purple', null, { width: 2.2 });
          levels(SV, sp, { color: 'purple' });
          cell2(SV, [T1.x, T1.y], [T2.x, T2.y], 'orange'); arr(SV, [0, 0], [T1.x, T1.y], 'orange', null, { width: 2.2 }); arr(SV, [0, 0], [T2.x, T2.y], 'orange', null, { width: 2.2 });
          levels(SU, stp, { color: 'green' });
          levels(SU, cmp, { color: match ? 'ink' : 'red', strips: false, labels: false, dash: [6, 5], width: 1.5, alpha: 0.9 });
          cell2(SU, [1, 0], [0, 1], 'muted');
          SU.corner(match ? 'dashed = green' : 'dashed ≠ green', 'bl', { color: match ? 'green' : 'red', size: 13 });
          st = { stp, tsp, wrong, match, sum: row(c, [[S[0][0] + T[0][0], S[0][1] + T[0][1]], [S[1][0] + T[1][0], S[1][1] + T[1][1]]]), sumR: [row(c, S)[0] + row(c, T)[0], row(c, S)[1] + row(c, T)[1]] };
        });
        v.readout(() => {
          if (!st) return '';
          const { stp, tsp, wrong, sum, sumR } = st;
          return `Coefficient rows: $(ST)'\\varphi = ${vt(stp)}$, $T'(S'\\varphi) = ${vt(tsp)}$ — equal; the wrong order gives $S'(T'\\varphi) = (TS)'\\varphi = ${vt(wrong)}$. For (a) with the same two matrices: $(S+T)'\\varphi = ${vt(sum)} = S'\\varphi+T'\\varphi = ${vt(sumR)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.121
    {
      num: '3.121',
      kind: 'Definition',
      name: 'Annihilator U⁰',
      statement: String.raw`For $U\subseteq V$, the **annihilator** of $U$, denoted $U^0$, is defined by $$U^0=\{\varphi\in V':\varphi(u)=0\text{ for all }u\in U\}.$$`,
      idea: String.raw`A functional belongs to $U^0$ exactly when $U\subseteq\operatorname{null}\varphi$. In $\mathbf R^3$ the null space of a nonzero functional is a plane (its level-$0$ plane), so $\varphi\in U^0$ means that this plane contains $U$ — equivalently, that every level plane of $\varphi$ is parallel to $U$. For a line $U$ these functionals form a two-parameter family (the planes through $U$, with any spacing); for a plane $U$, a one-parameter family.`,
      caption: String.raw`Choose a line or a plane $U$ in $\mathbf R^3$ (blue; drag $u_1,u_2$, and drag the background to rotate). The orange stack is a functional $\varphi$: drag the orange dot, which sits on its level plane $\varphi=1$. With "keep $\varphi\in U^0$" on, $\varphi$ can only turn so that its level planes stay parallel to $U$ — the faint purple fan shows the zero planes of several members of $U^0$. Switch it off and tilt $\varphi$: its level planes cut across $U$, and $\varphi(u_1)\ne0$.`,
      deps: ['ladr-3.110'],
      see: ['fa-4.6'],
      tags: ['duality'],
      viz(v) {
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 430 });
        const sc = v.scene3(S, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.35 });
        const kSel = v.select('$U$', [{ value: '1', label: 'a line' }, { value: '2', label: 'a plane' }], '1');
        const keep = v.toggle('keep $\\varphi\\in U^0$', true);
        const U1 = sc.handle([0.35, 0.95, 0.8], { color: 'blue', label: 'u₁' });
        const U2 = sc.handle([1.0, -0.35, 0.25], { color: 'blue', label: 'u₂' });
        const into = (p) => {
          if (!keep.value) return minLen3(p, 0.4);
          const B = orth([U1.p, U2.p].slice(0, +kSel.value)); let q = sub3(p, projOnto(p, B));
          if (len3(q) < 1e-6) q = mul3(compl(B)[0], 0.6);
          return minLen3(q, 0.4);
        };
        const Fh = sc.handle([0.6, -0.4, 0.35], { color: 'orange', label: 'φ', snap: into });
        v.legend([['blue', '$U$'], ['orange', 'level planes of $\\varphi$'], ['purple', 'zero planes of members of $U^0$', { area: true }]]);
        let st = null;
        v.render(() => {
          const k = +kSel.value; U2.visible = k === 2;
          Fh.p = into(Fh.p);
          sc.begin();
          const B = orth([U1.p, U2.p].slice(0, k)), W = compl(B), c = mul3(Fh.p, 1 / dot3(Fh.p, Fh.p));
          if (B.length === 1) {
            for (let i = 0; i < 6; i++) { const th = (i * Math.PI) / 6, n = add3(mul3(W[0], Math.cos(th)), mul3(W[1], Math.sin(th))); sc.disc(B[0], unit3(cross(n, B[0])), 1.25, { fill: 'purple', fillAlpha: 0.025, color: 'purple', alpha: 0.22, width: 0.8 }); }
            line3(sc, B[0], { color: 'blue', width: 3.4 });
          } else sc.disc(B[0], B[1], 1.3, { fill: 'blue', fillAlpha: 0.1, color: 'blue', grid: true });
          [U1, U2].slice(0, k).forEach((h) => sc.arrow(ZERO, h.p, { color: 'blue', width: 2.2, head: 9 }));
          planes3(sc, c, { color: 'orange', r: 0.95, max: 2 });
          sc.line(ZERO, Fh.p, { color: 'orange', width: 1.2, dash: [3, 3] });
          const vals = [U1, U2].slice(0, k).map((h) => dot3(c, h.p)), inU0 = vals.every((x) => Math.abs(x) < 1e-6);
          if (!inU0) [U1, U2].slice(0, k).forEach((h, j) => sc.tex(`\\varphi(u_${j + 1}) = ${tn(vals[j])}`, h.p, { color: 'red', dy: 18, size: 13, align: 'center' }));
          sc.flush();
          st = { k, vals, inU0, c };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, vals, inU0, c } = st;
          const v1 = vals.map((x, j) => `$\\varphi(u_${j + 1}) = ${tn(x)}$`).join(', ');
          return `$\\varphi(x) = ${linTeX(c)}$; ${v1}. ` + (inU0 ? `$\\varphi$ vanishes on $U$: its zero plane contains $U$, every level plane is parallel to $U$, and $\\varphi\\in U^0$. The members of $U^0$ form a ${3 - k}-parameter family.` : `$\\varphi$ does not vanish on $U$ — its level planes cut across $U$ — so $\\varphi\\notin U^0$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.124
    {
      num: '3.124',
      kind: 'Theorem',
      name: 'The annihilator is a subspace',
      statement: String.raw`Suppose $U\subseteq V$. Then $U^0$ is a subspace of $V'$.`,
      idea: String.raw`Run the subspace test 1.34. The zero functional vanishes everywhere, so $0\in U^0$. If $\varphi,\psi\in U^0$ and $u\in U$, then $(\varphi+\psi)(u)=\varphi(u)+\psi(u)=0$ and $(\lambda\varphi)(u)=\lambda\varphi(u)=0$. Nothing about $U$ was used: $U$ may be any subset, not necessarily a subspace. By contrast, a condition such as $\varphi(u)=1$ defines a set that misses $0$ and is not closed under addition.`,
      caption: String.raw`$U=\{u\}$ is a single vector of $\mathbf R^3$ (gold; drag it) — not a subspace. Right: functionals on $\mathbf R^3$ drawn as their coefficient vectors $(\varphi(e_1),\varphi(e_2),\varphi(e_3))$. The functionals with $\varphi(u)=0$ form the green plane through $0$; drag $\varphi,\psi$ within it and form $\chi=\lambda\varphi+\mu\psi$ with the sliders — it never leaves. Left: the zero planes of $\varphi,\psi,\chi$ all contain $u$. Switch to the condition $\varphi(u)=1$: that set is the red plane missing $0$, and $\chi$ escapes from it unless $\lambda+\mu=1$.`,
      deps: ['ladr-3.121', 'ladr-1.34'],
      tags: ['duality'],
      viz(v) {
        const SV = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, title: '$V=\\mathbf R^3$ and the set $U=\\{u\\}$' });
        const scV = v.scene3(SV, { yaw: -2.25, pitch: 0.3, axis: 1.3, lim: 1.3 });
        const SD = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, title: "$V'$: $\\varphi$ as $(\\varphi(e_1),\\varphi(e_2),\\varphi(e_3))$" });
        const scD = v.scene3(SD, { yaw: -2.25, pitch: 0.3, axis: 1.3, lim: 1.5, labels: ['c₁', 'c₂', 'c₃'] });
        const mode = v.select('the set', [{ value: '0', label: '$\\{\\varphi:\\varphi(u)=0\\}=U^0$' }, { value: '1', label: '$\\{\\varphi:\\varphi(u)=1\\}$' }], '0');
        const lam = v.slider('$\\lambda$', -2, 2, 0.8, { step: 0.05 }), mu = v.slider('$\\mu$', -2, 2, 0.7, { step: 0.05 });
        const Uh = scV.handle([0.5, 0.6, 0.9], { color: 'gold', label: 'u', snap: (p) => minLen3(p, 0.6) });
        const on = (p) => { const u = Uh.p, t = +mode.value; return sub3(p, mul3(u, (dot3(p, u) - t) / dot3(u, u))); };
        const Ph = scD.handle([0.9, -0.5, 0.1], { color: 'blue', label: 'φ', snap: on }), Qh = scD.handle([-0.6, 0.9, 0.4], { color: 'orange', label: 'ψ', snap: on });
        v.legend([['blue', '$\\varphi$'], ['orange', '$\\psi$'], ['green', '$\\chi=\\lambda\\varphi+\\mu\\psi$'], ['gold', '$u$']]);
        let st = null;
        v.render(() => {
          Ph.p = on(Ph.p); Qh.p = on(Qh.p);
          const u = Uh.p, t = +mode.value, a = Ph.p, b = Qh.p, l = lam.value, m = mu.value, ch = add3(mul3(a, l), mul3(b, m)), cu = dot3(ch, u), inSet = Math.abs(cu - t) < 1e-9;
          const setC = t ? 'red' : 'green', chC = inSet ? 'green' : 'red';
          scD.begin();
          const [pa, pb] = perp(u);
          scD.disc(pa, pb, 1.35, { fill: setC, fillAlpha: 0.08, color: setC, grid: true }, mul3(u, t / dot3(u, u)));
          scD.line(mul3(a, l), ch, { color: 'muted', width: 1, dash: [4, 4] }); scD.line(mul3(b, m), ch, { color: 'muted', width: 1, dash: [4, 4] });
          scD.arrow(ZERO, a, { color: 'blue', width: 2.2 }); scD.arrow(ZERO, b, { color: 'orange', width: 2.2 });
          scD.arrow(ZERO, ch, { color: chC, width: 3 });
          scD.tex('\\chi', ch, { color: chC, dx: 12, dy: -10 });
          scD.dot(ZERO, { r: 5, color: t ? 'red' : 'green' });
          scD.tex(t ? '0\\notin' : '0\\in', ZERO, { color: t ? 'red' : 'green', dx: -12, dy: 14, align: 'right' });
          scD.flush();
          scV.begin();
          const zp = (cv, color, lev, fa) => { if (len3(cv) < 1e-9) return; const [x1, x2] = perp(cv); scV.disc(x1, x2, 1.05, { fill: color, fillAlpha: fa, color, alpha: 0.7 }, mul3(cv, lev / dot3(cv, cv))); };
          zp(a, 'blue', t, 0.05); zp(b, 'orange', t, 0.05); zp(ch, chC, t, 0.1);
          if (!t) scV.line(mul3(unit3(u), -1.6), mul3(unit3(u), 1.6), { color: 'gold', width: 1.4, dash: [5, 4] });
          scV.arrow(ZERO, u, { color: 'gold', width: 2.2 });
          scV.flush();
          st = { a, b, u, cu, t, inSet, l, m, chZero: len3(ch) < 1e-9 };
        });
        v.readout(() => {
          if (!st) return '';
          const { a, b, u, cu, t, inSet, l, m } = st;
          if (!t) return `$\\varphi(u) = ${tn(dot3(a, u))}$, $\\psi(u) = ${tn(dot3(b, u))}$, so $\\chi(u) = \\lambda\\varphi(u)+\\mu\\psi(u) = ${tn(cu)}$: $\\chi\\in U^0$ for every $\\lambda,\\mu$, and the zero functional is in $U^0$ too. By 1.34 $U^0$ is a subspace — although $U=\\{u\\}$ is not.`;
          return `$\\varphi(u)=\\psi(u)=1$ but $\\chi(u) = \\lambda+\\mu = ${tn(l + m)}$` + (inSet ? ' (you found $\\lambda+\\mu=1$; any other choice escapes)' : ` $\\ne 1$: $\\chi$ left the set`) + `, and the zero functional has $0(u)=0\\ne1$. This set is not a subspace.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.125
    {
      num: '3.125',
      kind: 'Theorem',
      name: 'Dimension of the annihilator',
      statement: String.raw`Suppose $V$ is finite-dimensional and $U$ is a subspace of $V$. Then $$\dim U^0=\dim V-\dim U.$$`,
      idea: String.raw`Let $i\colon U\to V$ be the inclusion, so that $i'\colon V'\to U'$ restricts a functional to $U$. Its null space is exactly $U^0$, and it is surjective because every functional on $U$ extends to $V$ (extend a basis of $U$ to one of $V$ and use the linear map lemma). The fundamental theorem 3.21 for $i'$ gives $\dim V'=\dim U^0+\dim U'$, and 3.111 turns this into $\dim V=\dim U^0+\dim U$. Concretely: extend a basis $u_1,\dots,u_m$ of $U$ to a basis $u_1,\dots,u_n$ of $V$; the last $n-m$ functionals of its dual basis vanish on $U$ and form a basis of $U^0$.`,
      caption: String.raw`A basis $u_1,u_2,u_3$ of $\mathbf R^3$ (drag the tips; drag the background to rotate). Choose $U$ as the span of the first $k$ of them (orange). Each dual-basis functional $\varphi_j$ with $j>k$ vanishes on $U$: its zero plane (green) contains $U$, and these $3-k$ functionals form a basis of $U^0$. Grow $U$ from $\{0\}$ to $\mathbf R^3$ and watch the count on the right: $\dim U^0$ goes $3,2,1,0$ while $\dim U+\dim U^0$ stays $3$.`,
      deps: ['ladr-3.121', 'ladr-3.118', 'ladr-3.21', 'ladr-3.111'],
      tags: ['duality', 'dimension'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 410, weight: 1.7 });
        const sc = v.scene3(S, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.35 });
        const G = v.stage({ x: [0, 3], y: [-0.75, 3.5], axes: false, height: 410, minWidth: 190, title: 'the count' });
        const kSel = v.select('$U$', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: '$\\operatorname{span}(u_1)$' }, { value: '2', label: '$\\operatorname{span}(u_1,u_2)$' }, { value: '3', label: '$\\mathbf R^3$' }], '1');
        const HU = [[1.05, 0.25, 0.15], [0.2, 1.05, 0.2], [0.15, -0.2, 1.05]].map((p, i) => sc.handle(p, { color: VC[i], label: ['u₁', 'u₂', 'u₃'][i] }));
        v.legend([['orange', '$U$'], ['green', '$\\varphi_j=0$ for the $\\varphi_j$ in $U^0$', { area: true }]]);
        let st = null;
        v.render(() => {
          const k = +kSel.value, B = HU.map((h) => h.p), dt = M.det(cols3(B[0], B[1], B[2])), ok = Math.abs(dt) > 0.03;
          sc.begin();
          if (k === 1) line3(sc, B[0], { color: 'orange', width: 3.4 });
          else if (k === 2) { const [a, b] = orth([B[0], B[1]]); sc.disc(a, b, 1.3, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.6 }); }
          else if (k === 3) cubeEdges(sc, { color: 'orange', width: 1.3, alpha: 0.6 }, 1.1);
          else sc.dot(ZERO, { r: 6, color: 'orange' });
          if (ok) for (let j = k; j < 3; j++) {
            const [a, b] = orth([B[(j + 1) % 3], B[(j + 2) % 3]]), pa = sc.P(a), pb = sc.P(b), th = Math.atan2(pb[0], pa[0]);
            sc.disc(a, b, 1.15, { fill: 'green', fillAlpha: 0.07, color: 'green', alpha: 0.7 });
            sc.tex(`\\varphi_${j + 1}=0`, add3(mul3(a, 1.15 * Math.cos(th + 0.5 * (j - 1))), mul3(b, 1.15 * Math.sin(th + 0.5 * (j - 1)))), { color: 'green', dx: 8, size: 13, align: 'left' });
          }
          B.forEach((b, j) => sc.arrow(ZERO, b, { color: VC[j], width: j < k ? 3 : 1.8, alpha: j < k ? 1 : 0.55, dash: j < k ? undefined : [5, 4], head: 9 }));
          sc.flush();
          if (!ok) S.corner('u₁, u₂, u₃ must be a basis — pull them apart', 'tl', { color: 'red' });
          for (const y of [1, 2, 3]) G.line(0.1, y, 2.9, y, { color: 'grid', width: 1 });
          const bar = (x, y0, y1, color) => { if (y1 > y0) G.rect(x - 0.32, y0, x + 0.32, y1, { fill: color, fillAlpha: 0.45, color, width: 1.2 }); };
          bar(0.55, 0, k, 'orange'); bar(1.5, 0, 3 - k, 'green'); bar(2.45, 0, k, 'orange'); bar(2.45, k, 3, 'green');
          G.text(String(k), 0.55, k + 0.22, { color: 'orange', size: 15, align: 'center' });
          G.text(String(3 - k), 1.5, 3 - k + 0.22, { color: 'green', size: 15, align: 'center' });
          G.text('3', 2.45, 3.22, { color: 'ink', size: 15, align: 'center' });
          G.tex('\\dim U', 0.55, -0.3, { align: 'center', color: 'orange', size: 13 });
          G.tex('\\dim U^0', 1.5, -0.3, { align: 'center', color: 'green', size: 13 });
          G.tex('\\dim V', 2.45, -0.3, { align: 'center', size: 13 });
          st = { k, ok };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, ok } = st;
          if (!ok) return 'The three vectors are (nearly) dependent; the dual basis needs a basis.';
          const list = k < 3 ? `$U^0=\\operatorname{span}(${[1, 2, 3].slice(k).map((j) => `\\varphi_${j}`).join(',')})$` : '$U^0=\\{0\\}$';
          return `$\\dim U = ${k}$. The dual basis $\\varphi_1,\\varphi_2,\\varphi_3$ of $u_1,u_2,u_3$ has $\\varphi_j(u_i)=0$ for $i\\ne j$, so the $\\varphi_j$ with $j>${k} kill $U$: ${list}, and $\\dim U^0 = 3-${k} = ${3 - k}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.127
    {
      num: '3.127',
      kind: 'Theorem',
      name: 'When the annihilator is {0} or the whole dual',
      statement: String.raw`Suppose $V$ is finite-dimensional and $U$ is a subspace of $V$. Then
(a) $U^0=\{0\}\iff U=V$;
(b) $U^0=V'\iff U=\{0\}$.`,
      idea: String.raw`Both follow from the dimension count 3.125, $\dim U^0=\dim V-\dim U$. For (a), $U^0=\{0\}$ iff $\dim U^0=0$ iff $\dim U=\dim V$, which for a subspace means $U=V$ (2.39). For (b), $U^0=V'$ iff $\dim U^0=\dim V'=\dim V$ (3.111 and 2.39 again) iff $\dim U=0$, i.e. $U=\{0\}$.`,
      caption: String.raw`Left: a subspace $U$ of $\mathbf R^2$ (choose $\{0\}$, a line — drag $u$ — or everything) and a functional $\varphi\in U^0$ drawn by its level lines. Right: $V'$ as the plane of pairs $(\varphi(e_1),\varphi(e_2))$, with $U^0$ in green; drag $\varphi$ there — it is confined to $U^0$. For $U=\{0\}$ every functional is allowed; for a line, those whose level lines are parallel to it; for $U=\mathbf R^2$ only the zero functional is left.`,
      deps: ['ladr-3.125', 'ladr-2.39', 'ladr-3.111'],
      tags: ['duality'],
      viz(v) {
        const S = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 360, weight: 1.3, title: '$V=\\mathbf R^2$: $U$ and $\\varphi\\in U^0$' });
        const D = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 360, minWidth: 230, title: "$V'$: pairs $(\\varphi(e_1),\\varphi(e_2))$" });
        const kSel = v.select('$U$', [{ value: '0', label: '$\\{0\\}$' }, { value: '1', label: 'a line' }, { value: '2', label: '$\\mathbf R^2$' }], '1');
        const Uh = S.handle(1.5, 0.75, { color: 'blue', label: 'u', constrain: (x, y) => minLen2(x, y, 0.4) });
        const into = (p) => {
          const k = kSel.value; if (k === '0') return p; if (k === '2') return [0, 0];
          const l = Math.hypot(Uh.x, Uh.y), e = [-Uh.y / l, Uh.x / l], t = dot2(p, e); return [e[0] * t, e[1] * t];
        };
        let pref = [-0.7, 1.2];
        const Ph = D.handle(pref[0], pref[1], { color: 'green', label: 'φ', constrain: (x, y) => into([x, y]) });
        Ph.onDrag = () => { if (kSel.value !== '2') pref = [Ph.x, Ph.y]; };
        let st = null;
        v.render(() => {
          const k = +kSel.value; Uh.visible = k === 1;
          if (k === 1 && Math.hypot(...into(pref)) < 0.05) pref = [-Uh.y, Uh.x];
          const q = into(pref); Ph.x = q[0]; Ph.y = q[1];
          const u = [Uh.x, Uh.y], l = Math.hypot(...u), e = [u[0] / l, u[1] / l], nz = Math.hypot(...q) > 1e-9;
          if (nz) levels(S, q, { color: 'green' }); else S.corner('φ = 0', 'tr', { color: 'green', size: 14 });
          if (k === 0) S.dot(0, 0, { r: 6, color: 'blue' });
          else if (k === 1) { S.line(-6 * e[0], -6 * e[1], 6 * e[0], 6 * e[1], { color: 'blue', width: 7, alpha: 0.28 }); arr(S, [0, 0], u, 'blue', null); }
          else S.rect(-9, -9, 9, 9, { fill: 'blue', fillAlpha: 0.1, stroke: false });
          S.corner(['U = {0}', 'U = a line', 'U = V'][k], 'tl', { color: 'blue', size: 13 });
          if (k === 0) D.rect(-9, -9, 9, 9, { fill: 'green', fillAlpha: 0.08, stroke: false });
          else if (k === 1) D.line(6 * e[1], -6 * e[0], -6 * e[1], 6 * e[0], { color: 'green', width: 7, alpha: 0.3 });
          else D.dot(0, 0, { r: 9, color: 'green' });
          D.corner(['U⁰ = V′', 'U⁰ = a line', 'U⁰ = {0}'][k], 'tl', { color: 'green', size: 13 });
          D.dot(0, 0, { r: 3, color: 'ink' });
          st = { k, q };
        });
        v.readout(() => {
          if (!st) return '';
          const { k, q } = st;
          return `$\\dim U = ${k}$, $\\dim U^0 = 2-${k} = ${2 - k}$; here $\\varphi(x,y) = ${linTeX(q)}$. (a) $U^0=\\{0\\}$: **${k === 2 ? 'yes' : 'no'}**, and $U=V$: **${k === 2 ? 'yes' : 'no'}**. (b) $U^0=V'$: **${k === 0 ? 'yes' : 'no'}**, and $U=\\{0\\}$: **${k === 0 ? 'yes' : 'no'}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.128
    {
      num: '3.128',
      kind: 'Theorem',
      name: 'The null space of T′',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional and $T\in\mathcal L(V,W)$. Then
(a) $\operatorname{null}T'=(\operatorname{range}T)^0$;
(b) $\dim\operatorname{null}T'=\dim\operatorname{null}T+\dim W-\dim V$.`,
      idea: String.raw`(a) $T'\varphi=0$ means $\varphi(Tv)=0$ for every $v\in V$, which says exactly that $\varphi$ vanishes on $\operatorname{range}T$. (b) By (a) and 3.125, $\dim\operatorname{null}T'=\dim W-\dim\operatorname{range}T$, and the fundamental theorem 3.21 replaces $\dim\operatorname{range}T$ by $\dim V-\dim\operatorname{null}T$.`,
      caption: String.raw`$T\colon\mathbf R^2\to\mathbf R^3$ is given by $Te_1,Te_2$ (orange; their span, the range, is the orange plane). A functional $\varphi$ on $\mathbf R^3$ is the blue stack of level planes — drag the blue dot, which lies on the plane $\varphi=1$. Left: $T'\varphi=\varphi\circ T$ on $\mathbf R^2$. Tilt $\varphi$ until its level planes are parallel to the range (it snaps there, or press the button): then $T'\varphi=0$. Drag $Te_2$ onto the line of $Te_1$: the range becomes a line and $\operatorname{null}T'$ grows to dimension $2$.`,
      deps: ['ladr-3.125', 'ladr-3.21', 'ladr-3.118'],
      see: ['fa-4.12'],
      tags: ['duality'],
      viz(v) {
        const SV = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 380, minWidth: 250, title: "$V=\\mathbf R^2$: $T'\\varphi=\\varphi\\circ T$" });
        const SW = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, weight: 1.3, title: '$W=\\mathbf R^3$: $\\operatorname{range}T$ and $\\varphi$' });
        const sc = v.scene3(SW, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const T1 = sc.handle([1.1, 0.2, 0.25], { color: 'orange', label: 'Te₁' });
        const T2 = sc.handle([0.1, 1.05, -0.25], { color: 'orange', label: 'Te₂', snap: (p) => snapLine3(p, T1.p, 0.12) });
        const snapAnn = (p) => { const q = projOnto(p, orth([T1.p, T2.p])); return minLen3(len3(q) < 0.12 * len3(p) ? sub3(p, q) : p, 0.4); };
        const F = sc.handle([0.35, -0.45, 0.75], { color: 'blue', label: 'φ', snap: snapAnn });
        v.button('Put φ in (range T)⁰', () => { const B = orth([T1.p, T2.p]); F.set(mul3(compl(B)[B.length === 2 ? 0 : 1], 0.8)); });
        v.legend([['orange', '$\\operatorname{range}T$', { area: true }], ['blue', 'level planes of $\\varphi$'], ['green', "level lines of $T'\\varphi$"], ['red', '$\\operatorname{null}T$']]);
        let st = null;
        v.render(() => {
          sc.begin();
          const a = T1.p, b = T2.p, B = orth([a, b]), r = B.length, c = mul3(F.p, 1 / dot3(F.p, F.p)), pull = [dot3(c, a), dot3(c, b)];
          if (r === 2) sc.disc(B[0], B[1], 1.3, { fill: 'orange', fillAlpha: 0.1, color: 'orange', grid: true }); else line3(sc, B[0], { color: 'orange', width: 3 });
          sc.arrow(ZERO, a, { color: 'orange', width: 2.4 }); sc.arrow(ZERO, b, { color: 'orange', width: 2.4 });
          planes3(sc, c, { color: 'blue', r: 0.9, max: 2 });
          sc.flush();
          const zero = Math.hypot(...pull) < 1e-9;
          if (!zero) levels(SV, pull, { color: 'green' }); else SV.corner('T′φ = 0', 'tl', { color: 'red', size: 14 });
          if (r === 1) { const l = dot3(b, a) / dot3(a, a), n = [l, -1]; SV.line(-6 * n[0], -6 * n[1], 6 * n[0], 6 * n[1], { color: 'red', width: 2.5 }); }
          arr(SV, [0, 0], [1, 0], 'muted', 'e_1', { width: 2 }); arr(SV, [0, 0], [0, 1], 'muted', 'e_2', { width: 2 });
          st = { pull, zero, r };
        });
        v.readout(() => {
          if (!st) return '';
          const { pull, zero, r } = st;
          return `$T'\\varphi = (\\varphi(Te_1),\\varphi(Te_2)) = ${vt(pull)}$. ` + (zero ? '$\\varphi\\ne0$ vanishes on $\\operatorname{range}T$ and $T\'\\varphi=0$: $\\varphi\\in\\operatorname{null}T\'=(\\operatorname{range}T)^0$.' : '$\\varphi$ is not zero on $\\operatorname{range}T$, so $T\'\\varphi\\ne0$.') +
            ` With $\\operatorname{rank}T=${r}$: $\\dim\\operatorname{null}T' = \\dim\\operatorname{null}T+\\dim W-\\dim V = ${2 - r}+3-2 = ${3 - r} = \\dim(\\operatorname{range}T)^0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.129
    {
      num: '3.129',
      kind: 'Theorem',
      name: 'T surjective ⟺ T′ injective',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional and $T\in\mathcal L(V,W)$. Then $T$ is surjective if and only if $T'$ is injective.`,
      idea: String.raw`$T$ is surjective iff $\operatorname{range}T=W$, iff $(\operatorname{range}T)^0=\{0\}$ (3.127(a)), iff $\operatorname{null}T'=\{0\}$ (3.128(a)), i.e. iff $T'$ is injective. In words: a nonzero functional killed by $T'$ is exactly a nonzero functional vanishing on the range, and such a functional exists precisely when the range is not everything.`,
      caption: String.raw`$T\colon\mathbf R^3\to\mathbf R^2$; the orange hexagon is the image of the cube $[-1,1]^3$ and the orange arrows are $Te_1,Te_2,Te_3$. Drag $\psi$ (blue) on the left; the right shows $T'\psi=\psi\circ T$ as level planes in $\mathbf R^3$, all containing the red null space. Slide "collapse" to $1$: the range flattens to a line, and the $\psi$ whose level lines are parallel to it (it snaps, or press the button) is a nonzero functional with $T'\psi=0$. The readout tracks the smallest possible $|T'\psi|$, which reaches $0$ exactly then.`,
      deps: ['ladr-3.127', 'ladr-3.128'],
      see: ['fa-4.15'],
      tags: ['duality'],
      viz(v) {
        const M = v.M;
        const SW = v.stage({ x: [-2.8, 2.8], y: [-2.8, 2.8], equal: true, height: 380, minWidth: 250, title: '$W=\\mathbf R^2$: $\\operatorname{range}T$ and $\\psi$' });
        const SV = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, weight: 1.2, title: "$V=\\mathbf R^3$: $T'\\psi=\\psi\\circ T$" });
        const sc = v.scene3(SV, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const tS = v.slider('collapse $T$', 0, 1, 0.3, { step: 0.01 });
        const r1 = [0.8, 0.45, -0.35], r2 = [-0.25, 0.7, 0.6];
        const Amat = () => { const t = tS.value; return [r1, r2.map((x, i) => (1 - t) * x + t * 0.75 * r1[i])]; };
        const ann = [-0.6, 0.8];
        const F = fHandle(SW, [0.3, 0.65], 'blue', 'ψ', 0.4, (q) => { if (tS.value < 1) return q; const t = dot2(q, ann), p = [ann[0] * t, ann[1] * t]; return Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.15 ? p : q; });
        v.button('ψ = the most squashed direction', () => { const e = minDir(Amat()).e; F.set(e[0] / 1.3, e[1] / 1.3); });
        v.legend([['orange', 'image of the cube', { area: true }], ['blue', '$\\psi$'], ['green', "$T'\\psi$"], ['red', '$\\operatorname{null}T$']]);
        let st = null;
        v.render(() => {
          const A = Amat(), md = minDir(A), N = M.nullspace(A), rk = 3 - N.length, c = coef(F), g = [0, 1, 2].map((j) => c[0] * A[0][j] + c[1] * A[1][j]);
          const pts = []; for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) for (const s3 of [-1, 1]) pts.push(M.matVec(A, [s1, s2, s3]));
          SW.poly(M.hull(pts), { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1.2 });
          if (rk === 1) SW.line(-5 * 0.8, -5 * 0.6, 5 * 0.8, 5 * 0.6, { color: 'orange', width: 2, alpha: 0.6 });
          levels(SW, c, { color: 'blue' });
          for (let j = 0; j < 3; j++) arr(SW, [0, 0], [A[0][j], A[1][j]], 'orange', null, { width: 2.2, head: 8 });
          SW.dot(0, 0, { r: 3, color: 'ink' });
          sc.begin();
          if (N.length === 1) line3(sc, N[0], { color: 'red', width: 3.2 }); else sc.disc(N[0], N[1], 1.2, { fill: 'red', fillAlpha: 0.08, color: 'red', grid: true });
          const gz = len3(g) < 1e-9;
          if (!gz) planes3(sc, g, { color: 'green', r: 0.95, max: 2 });
          sc.flush();
          if (gz) SV.corner('T′ψ = 0 although ψ ≠ 0', 'tl', { color: 'red', size: 14 });
          st = { rk, s: md.s, g, gz };
        });
        v.readout(() => {
          if (!st) return '';
          const { rk, s, g, gz } = st;
          if (rk === 2) return `$\\operatorname{rank}T = 2$: $T$ is surjective. Over all $\\psi$ with coefficient vector of length $1$, the smallest $|T'\\psi|$ is $${tn(s, 3)} > 0$, so $T'\\psi=0$ only for $\\psi=0$: $T'$ is injective. Here $T'\\psi = ${vt(g)}$.`;
          return `$\\operatorname{rank}T = 1$: the range is a line and $T$ is not surjective. ` + (gz ? 'This $\\psi\\ne0$ vanishes on the range and $T\'\\psi = 0$: $T\'$ is **not** injective.' : `Turn $\\psi$ until its level lines are parallel to the range: then $T'\\psi=0$ with $\\psi\\ne0$ (now $T'\\psi = ${vt(g)}$).`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.130
    {
      num: '3.130',
      kind: 'Theorem',
      name: 'The range of T′',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional and $T\in\mathcal L(V,W)$. Then
(a) $\dim\operatorname{range}T'=\dim\operatorname{range}T$;
(b) $\operatorname{range}T'=(\operatorname{null}T)^0$.`,
      idea: String.raw`(a) By 3.21 for $T'$ and 3.111, $\dim\operatorname{range}T'=\dim W-\dim\operatorname{null}T'$, which by 3.128 and 3.125 equals $\dim W-(\dim W-\dim\operatorname{range}T)$. (b) If $\varphi=T'\psi$ then $\varphi(v)=\psi(Tv)=0$ for $v\in\operatorname{null}T$, so $\operatorname{range}T'\subseteq(\operatorname{null}T)^0$. By (a), 3.125 and 3.21 both sides have dimension $\dim V-\dim\operatorname{null}T$, so they are equal.`,
      caption: String.raw`$T\colon\mathbf R^3\to\mathbf R^2$ with null space the red line. A functional on $\mathbf R^3$ is drawn here as its coefficient vector $(\varphi(e_1),\varphi(e_2),\varphi(e_3))$, so $(\operatorname{null}T)^0$ is the green plane of vectors perpendicular to the red line. Drag $\psi$ on the left: the coefficient vector of $T'\psi$ (green dot) never leaves that plane. Drag the green dot anywhere in the plane: the $\psi$ that produces it appears on the left — every element of $(\operatorname{null}T)^0$ is reached. Rank 1 shrinks both to a line.`,
      deps: ['ladr-3.21', 'ladr-3.111', 'ladr-3.128', 'ladr-3.125'],
      see: ['fa-4.14'],
      tags: ['duality'],
      viz(v) {
        const M = v.M;
        const SW = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 380, minWidth: 250, title: '$W=\\mathbf R^2$: drag $\\psi$' });
        const SV = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 380, weight: 1.2, title: "coefficient vector of $T'\\psi$" });
        const sc = v.scene3(SV, { yaw: -2.25, pitch: 0.3, axis: 1.6, lim: 1.9, labels: ['c₁', 'c₂', 'c₃'] });
        const rSel = v.select('$T$', [{ value: '2', label: 'rank 2' }, { value: '1', label: 'rank 1' }], '2');
        const A2 = [[0.8, 0.45, -0.35], [-0.25, 0.7, 0.6]], A1 = [[0.8, 0.45, -0.35], [0.6, 0.3375, -0.2625]];
        const Am = () => (rSel.value === '2' ? A2 : A1);
        const Ps = fHandle(SW, [0.65, 0.55], 'blue', 'ψ', 0.6);
        const G = sc.handle([0.3, 0.5, 0.2], { color: 'green', label: "T′ψ", snap: (p) => minLen3(projOnto(p, orth(Am())), 0.25) });
        v.legend([['red', '$\\operatorname{null}T$'], ['green', "$(\\operatorname{null}T)^0$ and $T'\\psi$", { area: true }], ['blue', '$\\psi$']]);
        let st = null;
        v.render(() => {
          const A = Am(), R = orth(A), N = compl(R), At = M.transpose(A);
          if (G.h.dragging) { const cc = M.matVec(M.pinv(At), G.p); if (Math.hypot(...cc) > 1e-9) { const f = foot2(cc); Ps.x = f[0]; Ps.y = f[1]; } }
          const c = coef(Ps), g = M.matVec(At, c);
          if (!G.h.dragging) G.p = g;
          levels(SW, c, { color: 'blue' }); SW.dot(0, 0, { r: 3, color: 'ink' });
          sc.begin();
          if (N.length === 1) line3(sc, N[0], { color: 'red', width: 3.2 }, 1.9); else sc.disc(N[0], N[1], 1.3, { fill: 'red', fillAlpha: 0.07, color: 'red' });
          if (R.length === 2) sc.disc(R[0], R[1], 1.55, { fill: 'green', fillAlpha: 0.09, color: 'green', grid: true }); else line3(sc, R[0], { color: 'green', width: 3 }, 1.9);
          sc.arrow(ZERO, g, { color: 'green', width: 2.8 });
          sc.flush();
          st = { g, n: N.map((nv) => dot3(g, nv)), r: R.length, c };
        });
        v.readout(() => {
          if (!st) return '';
          const { g, n, r, c } = st;
          return `$\\psi(x,y) = ${linTeX(c)}$ gives $T'\\psi$ with coefficient vector $${vt(g)}$, and on $\\operatorname{null}T$ it gives ${n.map((x) => `$${tn(x)}$`).join(', ')}: every $T'\\psi$ vanishes on $\\operatorname{null}T$. The green ${r === 2 ? 'plane' : 'line'} is all of $(\\operatorname{null}T)^0$ and each of its points is some $T'\\psi$: $\\operatorname{range}T'=(\\operatorname{null}T)^0$, of dimension ${r} $= \\dim\\operatorname{range}T$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.131
    {
      num: '3.131',
      kind: 'Theorem',
      name: 'T injective ⟺ T′ surjective',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional and $T\in\mathcal L(V,W)$. Then $T$ is injective if and only if $T'$ is surjective.`,
      idea: String.raw`$T$ is injective iff $\operatorname{null}T=\{0\}$, iff $(\operatorname{null}T)^0=V'$ (3.127(b)), iff $\operatorname{range}T'=V'$ (3.130(b)), i.e. iff $T'$ is surjective. Concretely, a nonzero $n\in\operatorname{null}T$ is an obstruction: every $T'\psi=\psi\circ T$ vanishes at $n$, so no functional $\varphi$ with $\varphi(n)\ne0$ can be reached.`,
      caption: String.raw`$T\colon\mathbf R^2\to\mathbf R^3$ by $Te_1,Te_2$ (orange; their span is the range). Drag the target functional $\varphi$ on $\mathbf R^2$ (blue). The best $\psi$ on $\mathbf R^3$ (purple level planes) is computed, and $T'\psi$ is drawn as green dashed lines on the left. While $T$ is injective they land exactly on the blue lines. Slide "collapse" to $1$: now $T$ kills the red line, every $T'\psi$ has level lines parallel to it, and a $\varphi$ that is not — almost every $\varphi$ — is out of reach. (It snaps to the reachable ones.)`,
      deps: ['ladr-3.127', 'ladr-3.130'],
      see: ['fa-4.15'],
      tags: ['duality'],
      viz(v) {
        const M = v.M;
        const SV = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 380, minWidth: 250, title: "$V=\\mathbf R^2$: target $\\varphi$, best $T'\\psi$" });
        const SW = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 380, weight: 1.2, title: '$W=\\mathbf R^3$: $\\operatorname{range}T$ and $\\psi$' });
        const sc = v.scene3(SW, { yaw: -2.25, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const tS = v.slider('collapse $T$', 0, 1, 0.45, { step: 0.01 });
        const c1 = [0.95, 0.3, 0.3], c2 = [-0.2, 0.85, 0.5], nv = [0.8 / Math.hypot(0.8, 1), 1 / Math.hypot(0.8, 1)];
        const colsT = () => { const t = tS.value; return [c1, c2.map((x, i) => (1 - t) * x - t * 0.8 * c1[i])]; };
        const F = fHandle(SV, [0.45, 0.35], 'blue', 'φ', 0.35, (q) => { if (tS.value < 1) return q; const e = [-nv[1], nv[0]], t = dot2(q, e), p = [e[0] * t, e[1] * t]; return Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.15 ? minLen2(p[0], p[1], 0.35) : q; });
        v.legend([['blue', 'target $\\varphi$'], ['green', "best $T'\\psi$", { dash: true }], ['purple', '$\\psi$'], ['red', '$\\operatorname{null}T$']]);
        let st = null;
        v.render(() => {
          const [a, b] = colsT(), At = [a, b], f = coef(F), x = M.matVec(M.pinv(At), f), g = M.matVec(At, x), res = Math.hypot(f[0] - g[0], f[1] - g[1]);
          const r = orth([a, b]).length;
          levels(SV, f, { color: 'blue' });
          if (Math.hypot(...g) > 1e-9) levels(SV, g, { color: 'green', strips: false, labels: false, dash: [6, 5], width: 1.8 });
          if (r === 1) SV.line(-6 * nv[0], -6 * nv[1], 6 * nv[0], 6 * nv[1], { color: 'red', width: 2.6 });
          SV.dot(0, 0, { r: 3, color: 'ink' });
          sc.begin();
          if (r === 2) { const B = orth([a, b]); sc.disc(B[0], B[1], 1.3, { fill: 'orange', fillAlpha: 0.1, color: 'orange', grid: true }); } else line3(sc, a, { color: 'orange', width: 3 });
          sc.arrow(ZERO, a, { color: 'orange', width: 2.4 }); sc.arrow(ZERO, b, { color: 'orange', width: 2.4 });
          sc.tex('Te_1', a, { color: 'orange', dx: 10, dy: -10 }); sc.tex('Te_2', b, { color: 'orange', dx: 10, dy: -10 });
          if (len3(x) > 1e-9) planes3(sc, x, { color: 'purple', r: 0.85, max: 2 });
          sc.flush();
          st = { r, res, x, fn: dot2(f, nv) };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, res, x, fn } = st;
          if (r === 2) return `$T$ is injective, and $\\psi = ${linTeX(x)}$ solves $T'\\psi=\\varphi$ (miss $${tn(res, 3)}$). Every $\\varphi$ is reached: $T'$ is surjective. Near the collapse the needed $\\psi$ gets huge ($|\\psi| = ${tn(len3(x))}$).`;
          return `$T(0.8e_1+e_2)=0$, so every $T'\\psi$ vanishes at $n=(0.8,1)$. ` + (Math.abs(fn) < 1e-9 ? `This $\\varphi$ also has $\\varphi(n)=0$, and it is reached (miss $${tn(res, 3)}$): $\\operatorname{range}T'$ is the line of such $\\varphi$.` : `But $\\varphi(n)/|n| = ${tn(fn)}\\ne0$: no $\\psi$ works, the best one misses by $${tn(res)}$. $T'$ is not surjective.`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.132
    {
      num: '3.132',
      kind: 'Theorem',
      name: 'Matrix of T′ is the transpose of the matrix of T',
      statement: String.raw`Suppose $V$ and $W$ are finite-dimensional and $T\in\mathcal L(V,W)$. Fix bases of $V$ and $W$, and use the corresponding dual bases of $V'$ and $W'$ to form $\mathcal M(T')$. Then $$\mathcal M(T')=\bigl(\mathcal M(T)\bigr)^{\mathrm t}.$$`,
      idea: String.raw`Let $v_1,\dots,v_n$ and $w_1,\dots,w_m$ be the bases with dual bases $\varphi_1,\dots,\varphi_n$ and $\psi_1,\dots,\psi_m$, and $A=\mathcal M(T)$, so $Tv_j=\sum_k A_{k,j}w_k$. Column $k$ of $\mathcal M(T')$ holds the coordinates of $T'\psi_k$ in the basis $\varphi_1,\dots,\varphi_n$, and (as in 3.116) the coordinate on $\varphi_j$ of a functional is its value at $v_j$: $(T'\psi_k)(v_j)=\psi_k(Tv_j)=A_{k,j}$ by 3.114. So entry $(j,k)$ of $\mathcal M(T')$ is entry $(k,j)$ of $A$ (3.54).`,
      caption: String.raw`$T\colon\mathbf R^3\to\mathbf R^2$ is given by $Tv_1,Tv_2,Tv_3$ (orange, $v_j=e_j$); $W$ has the basis $w_1,w_2$ (drag everything). Pick $k$ (or click a row of $\mathcal M(T)$): the left panel draws $\psi_k$ of the dual basis, so its levels at the orange points are row $k$ of $\mathcal M(T)$. The right panel draws $T'\psi_k=\psi_k\circ T$ on $\mathbf R^3$ with its values at $v_1,v_2,v_3$ — which form column $k$ of $\mathcal M(T')$. Row $k$ becomes column $k$.`,
      deps: ['ladr-3.118', 'ladr-3.112', 'ladr-3.31', 'ladr-3.54', 'ladr-3.114'],
      tags: ['duality', 'matrices'],
      viz(v) {
        const M = v.M;
        const SW = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.3], equal: true, height: 350, title: '$W$: basis $w_1,w_2$, dual basis $\\psi_1,\\psi_2$' });
        const SV = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, title: "$V=\\mathbf R^3$: $T'\\psi_k$ at $v_1,v_2,v_3$" });
        const sc = v.scene3(SV, { yaw: -2.25, pitch: 0.3, axis: 1.3, lim: 1.3 });
        const TB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const kSel = v.select('$k$', [{ value: '0', label: "$k=1$: $T'\\psi_1$" }, { value: '1', label: "$k=2$: $T'\\psi_2$" }], '0');
        const W1 = SW.handle(1.2, 0.15, { color: 'blue', label: 'w₁', constrain: (x, y) => minLen2(x, y, 0.4) });
        const W2 = SW.handle(0.35, 1.0, { color: 'purple', label: 'w₂', constrain: (x, y) => minLen2(x, y, 0.4) });
        const TV = [[1.6, 0.9], [-0.8, 1.4], [0.9, -1.3]].map((p, i) => SW.handle(p[0], p[1], { color: 'orange', label: `Tv${'₁₂₃'[i]}` }));
        const o = { maxCell: 46, size: 14, square: false, cellAspect: 1.6 };
        const tA = v.table(TB, { rows: 2, cols: 3, region: [0.02, 0, 0.48, 1], rowLabels: ['$w_1$', '$w_2$'], colLabels: ['$v_1$', '$v_2$', '$v_3$'], cornerLabel: '$\\mathcal M(T)$', ...o });
        const tB = v.table(TB, { rows: 3, cols: 2, region: [0.52, 0, 0.98, 1], rowLabels: ['$\\varphi_1$', '$\\varphi_2$', '$\\varphi_3$'], colLabels: ['$\\psi_1$', '$\\psi_2$'], cornerLabel: "$\\mathcal M(T')$", ...o });
        TB.onClick((x, y) => { const h = tA.hit(x, y); if (h && h.i >= 0) kSel.set(String(h.i)); const g = tB.hit(x, y); if (g && g.j >= 0) kSel.set(String(g.j)); });
        const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        let st = null;
        v.render(() => {
          const w1 = [W1.x, W1.y], w2 = [W2.x, W2.y], D = dual2(w1, w2), k = +kSel.value, tv = TV.map((h) => [h.x, h.y]), col = VC[k];
          tv.forEach((t) => SW.line(0, 0, t[0], t[1], { color: 'orange', width: 1.2, alpha: 0.5, dash: [3, 3] }));
          arr(SW, [0, 0], w1, 'blue', null); arr(SW, [0, 0], w2, 'purple', null); SW.dot(0, 0, { r: 3, color: 'ink' });
          if (!D) {
            SW.corner('w₁, w₂ is not a basis', 'tl', { color: 'red' });
            tA.draw({ value: () => '—' }); tB.draw({ value: () => '—' }); sc.begin(); sc.flush(); st = null; return;
          }
          levels(SW, D[k], { color: col });
          const MT = [[], []];
          tv.forEach((t, j) => { const x = M.solve([[w1[0], w2[0]], [w1[1], w2[1]]], t); MT[0][j] = x[0]; MT[1][j] = x[1]; });
          const pulls = [0, 1].map((kk) => tv.map((t) => dot2(D[kk], t)));
          const MTp = [0, 1, 2].map((j) => [0, 1].map((kk) => dot3(pulls[kk], E[j])));
          sc.begin();
          planes3(sc, pulls[k], { color: col, r: 0.8, max: 2, labels: false });
          E.forEach((e, j) => { sc.arrow(ZERO, e, { color: 'ink', width: 2, head: 8 }); sc.tex(`v_${j + 1}`, e, { color: 'ink', dx: -12, dy: 12 }); sc.dot(e, { r: 5, color: col }); sc.tex(kfmt(+MTp[j][k].toFixed(2)), e, { color: col, dx: 12, dy: -12, size: 15 }); });
          sc.flush();
          const err = Math.max(...[0, 1, 2].flatMap((j) => [0, 1].map((kk) => Math.abs(MTp[j][kk] - MT[kk][j]))));
          tA.draw({ value: (i, j) => +MT[i][j].toFixed(2), activeRow: k, activeColor: col });
          tB.draw({ value: (i, j) => +MTp[i][j].toFixed(2), activeCol: k, activeColor: col });
          st = { k, row: MT[k], err };
        });
        v.readout(() => {
          if (!st) return 'Pull $w_1, w_2$ apart: they must form a basis.';
          const { k, row, err } = st;
          return `Column ${k + 1} of $\\mathcal M(T')$ lists the coordinates of $T'\\psi_${k + 1}$ in the dual basis $\\varphi_1,\\varphi_2,\\varphi_3$, i.e. its values $(T'\\psi_${k + 1})(v_j) = \\psi_${k + 1}(Tv_j) = ${vt(row)}$ — row ${k + 1} of $\\mathcal M(T)$. Largest entry of $|\\mathcal M(T')-\\mathcal M(T)^{\\mathrm t}|$: $${v.sci(err + 1e-17, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.133
    {
      num: '3.133',
      kind: 'Theorem',
      name: 'Column rank equals row rank, via duality',
      statement: String.raw`Suppose $A\in\mathbf F^{m,n}$. Then the column rank of $A$ equals the row rank of $A$.`,
      idea: String.raw`Let $T\colon\mathbf F^{n,1}\to\mathbf F^{m,1}$ be $Tx=Ax$, so $A=\mathcal M(T)$ for the standard bases. Then: column rank of $A=\dim\operatorname{range}T$ (3.78) $=\dim\operatorname{range}T'$ (3.130(a)) $=$ column rank of $\mathcal M(T')$ (3.78 again) $=$ column rank of $A^{\mathrm t}$ (3.132) $=$ row rank of $A$. This second proof needs no column–row factorization: duality does the work.`,
      caption: String.raw`Edit the $3\times3$ matrix $A$: click a cell (outlined, together with its mirror in $A^{\mathrm t}$) and set it with the slider, or pick a preset. Left: the columns of $A$ and their span, $\operatorname{range}T$. Right: the rows of $A$ — the coefficient vectors of the functionals $T'(e_i^*)$ — and their span, $\operatorname{range}T'$. Whatever you do, the two spans have the same dimension: both are lines, both planes, or both all of $\mathbf R^3$.`,
      deps: ['ladr-3.78', 'ladr-3.130', 'ladr-3.132'],
      tags: ['duality', 'rank'],
      viz(v) {
        const M = v.M;
        const PRE = { 3: [[1, 0.5, 0], [0, 1, -0.5], [0.5, 0, 1]], 2: [[1, 0.5, 1.5], [0, 1, 1], [1, -0.5, 0.5]], 1: [[1, -0.5, 1], [1.5, -0.75, 1.5], [-0.5, 0.25, -0.5]] };
        let A = PRE[2].map((r) => r.slice()), sel = [0, 2];
        const TB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 170, full: true });
        const o = { rows: 3, cols: 3, maxCell: 42, size: 14, square: false, cellAspect: 1.6 };
        const tA = v.table(TB, { ...o, region: [0.03, 0, 0.47, 1], rowLabels: ['$r_1$', '$r_2$', '$r_3$'], colLabels: ['$c_1$', '$c_2$', '$c_3$'], cornerLabel: '$A$' });
        const tT = v.table(TB, { ...o, region: [0.53, 0, 0.97, 1], rowLabels: ['$c_1$', '$c_2$', '$c_3$'], colLabels: ['$r_1$', '$r_2$', '$r_3$'], cornerLabel: '$A^{\\mathrm t}$' });
        const S1 = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 330, title: '$\\operatorname{range}T$ = span of the columns' });
        const S2 = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 330, title: "$\\operatorname{range}T'$ = span of the rows" });
        const sc1 = v.scene3(S1, { yaw: -2.25, pitch: 0.3, axis: 2 }), sc2 = v.scene3(S2, { yaw: -2.25, pitch: 0.3, axis: 2, labels: ['c₁', 'c₂', 'c₃'] });
        const entry = v.slider('selected entry', -2, 2, A[0][2], { step: 0.25, onChange: (x) => { A[sel[0]][sel[1]] = x; } });
        v.select('preset', [{ value: '3', label: 'rank 3' }, { value: '2', label: 'rank 2' }, { value: '1', label: 'rank 1' }], '2', { onChange: (val) => { A = PRE[val].map((r) => r.slice()); entry.set(A[sel[0]][sel[1]]); } });
        TB.onClick((x, y) => { const h = tA.hit(x, y); if (h && h.i >= 0 && h.j >= 0) { sel = [h.i, h.j]; entry.set(A[h.i][h.j]); } });
        const span = (sc, vs, color, names) => {
          const B = orth(vs);
          sc.begin();
          if (B.length === 1) line3(sc, B[0], { color, width: 6, alpha: 0.3 }, 2.6);
          else if (B.length === 2) sc.disc(B[0], B[1], 2.2, { fill: color, fillAlpha: 0.1, color, grid: true });
          else if (B.length === 3) cubeEdges(sc, { color, width: 1.2, alpha: 0.45 }, 1.6);
          vs.forEach((x, j) => { if (len3(x) > 1e-9) { sc.arrow(ZERO, x, { color, width: 2.6 }); sc.tex(names[j], x, { color, dx: 12, dy: -10 }); } });
          sc.flush();
          return B.length;
        };
        let st = null;
        v.render(() => {
          const cols = [0, 1, 2].map((j) => A.map((r) => r[j])), rows = A.map((r) => r.slice());
          const dc = span(sc1, cols, 'blue', ['c_1', 'c_2', 'c_3']), dr = span(sc2, rows, 'orange', ['r_1', 'r_2', 'r_3']);
          S1.corner(`dim = ${dc}`, 'tl', { color: 'blue', size: 14 }); S2.corner(`dim = ${dr}`, 'tl', { color: 'orange', size: 14 });
          tA.draw({ value: (i, j) => A[i][j], highlight: [[sel[0], sel[1], 'gold']] });
          tT.draw({ value: (i, j) => A[j][i], highlight: [[sel[1], sel[0], 'gold']] });
          st = { rc: M.rank(A), rr: M.rank(M.transpose(A)) };
        });
        v.readout(() => {
          if (!st) return '';
          const { rc, rr } = st;
          return `Column rank of $A$ $=\\dim\\operatorname{range}T = ${rc}$ (3.78) $=\\dim\\operatorname{range}T' = ${rr}$ (3.130) $=$ column rank of $\\mathcal M(T')=A^{\\mathrm t}$ (3.132) $=$ row rank of $A$.`;
        });
      },
    },
  ],
};
