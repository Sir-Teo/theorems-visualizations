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
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.5, lim: 1.4 });
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
        const sc = v.scene3(S3, { yaw: -0.5, pitch: 0.3, axis: 1.4, lim: 1.35 });
        const SW = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 380, minWidth: 250, title: '$W=\\mathbf R^2$: one point per translate' });
        const rSel = v.select('$T$', [{ value: '2', label: 'rank 2: null space a line' }, { value: '1', label: 'rank 1: null space a plane' }], '2');
        const slide = v.slider('slide along $v+\\operatorname{null}T$', -1.4, 1.4, 0.8, { step: 0.01 });
        const A2 = [[0.9, 0.5, -0.6], [-0.3, 0.8, 0.7]], A1 = [[0.9, 0.5, -0.6], [0.45, 0.25, -0.3]];
        const Vh = sc.handle([0.7, -0.6, 0.8], { color: 'gold', label: 'v' });
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
          SW.dot(Tv[0], Tv[1], { r: 7, color: 'gold' });
          SW.dot(Tq[0], Tq[1], { r: 11, hollow: true, color: 'pink', width: 2 });
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
        const F = fHandle(S, foot2(c), 'accent', 'φ', 0.25);
        F.onDrag = () => { c = coef(F); };
        const rdir = () => { const l1 = Math.hypot(...b1), l2 = Math.hypot(...b2), s = Math.sign(dot2(b1, b2)) || 1, l = Math.hypot(l1, l2); return [l1 / l, (s * l2) / l]; };
        const Qh = D.handle(abPrev[0], abPrev[1], {
          color: 'accent', label: 'φ',
          constrain: (x, y) => { if (!deg) return [x, y]; const r = rdir(), t = x * r[0] + y * r[1]; return [r[0] * t, r[1] * t]; },
        });
        Qh.onDrag = () => { if (!deg) { const nc = solve(b1, b2, [Qh.x, Qh.y]); if (nc) c = nc; } else c = [(b1[0] * Qh.x) / dot2(b1, b1), (b1[1] * Qh.x) / dot2(b1, b1)]; };
        v.legend([['accent', 'level lines of $\\varphi$'], ['blue', '$v_1$'], ['purple', '$v_2$']]);
        let st = null;
        v.render(() => {
          b1 = [B1.x, B1.y]; b2 = [B2.x, B2.y]; deg = !dual2(b1, b2);
          const ab = keepAB(); abPrev = ab;
          Qh.x = ab[0]; Qh.y = ab[1];
          const nz = dot2(c, c) > 1e-10, ft = nz ? foot2(c) : [99, 99];
          if (!F.dragging) { F.x = ft[0]; F.y = ft[1]; }
          F.visible = nz && Math.abs(ft[0]) < 2.9 && Math.abs(ft[1]) < 2.3;
          if (nz) levels(S, c, { color: 'accent' }); else S.corner('φ = 0', 'tl', { color: 'accent' });
          arr(S, [0, 0], b1, 'blue', null); arr(S, [0, 0], b2, 'purple', null);
          S.text(`φ(v₁) = ${kfmt(+ab[0].toFixed(2))}`, b1[0], b1[1], { color: 'blue', size: 12, dy: 18, align: 'center' });
          S.text(`φ(v₂) = ${kfmt(+ab[1].toFixed(2))}`, b2[0], b2[1], { color: 'purple', size: 12, dy: -18, align: 'center' });
          if (!deg) D.rect(-9, -9, 9, 9, { fill: 'green', fillAlpha: 0.06, stroke: false });
          else { const r = rdir(); D.line(-9 * r[0], -9 * r[1], 9 * r[0], 9 * r[1], { color: 'red', width: 2.5 }); }
          D.corner(deg ? 'only these pairs occur' : 'every pair occurs', 'tl', { color: deg ? 'red' : 'green' });
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
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.3, axis: 1.4, lim: 1.4 });
        const HB = [[1.1, 0.25, 0.05], [0.35, 1.0, -0.15], [0.25, 0.35, 0.95]].map((p, i) => sc.handle(p, { color: VC[i], label: ['v₁', 'v₂', 'v₃'][i] }));
        const X = sc.handle([0.95, 1.05, 0.75], { color: 'gold', label: 'v' });
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
          for (const Z of [S, R]) { arr(Z, [0, 0], b1, 'blue', '\\,v_1', { width: 2.6 }); arr(Z, [0, 0], b2, 'purple', '\\,v_2', { width: 2.6 }); Z.dot(0, 0, { r: 3, color: 'ink' }); }
          const ok = Math.hypot(...r) < 1e-9;
          if (!ok) levels(R, r, { color: 'red' });
          R.corner(ok ? 'ρ = 0: an exact match' : `ρ(v₁) = ${kfmt(+dot2(r, b1).toFixed(2))},  ρ(v₂) = ${kfmt(+dot2(r, b2).toFixed(2))}`, 'tl', { color: ok ? 'green' : 'red' });
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
    // @@PART2@@
  ],
};
