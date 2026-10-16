// Representation Theory — Chapter 2: Complete reducibility and Schur’s lemma
import { TAU, EC, ecol, nm, nmc, matT, matN, mm, mv, tp, eye, msub, madd, msc, fro, dot, len, unit, vsc, vadd, vsub, cross, inv, rot2, dihedral, cyclic, permMat, homCheck, F_SHAPE, SKEW2, conj, avgConj, avgForm, formDefect, eig2, ellipse, sqrt2, qf, zero, dsum, kron } from './ch02.shared.js';

// The three groups of 2.1 and 2.10 as skewed (non-orthogonal) matrix representations of the plane.
function skewedGroups() {
  const C3 = cyclic(3), S3 = dihedral(3), D4 = dihedral(4);
  const rotMats = (n) => Array.from({ length: n }, (_, a) => rot2((TAU * a) / n));
  return {
    C3: { G: C3, tex: '\\mathbb Z/3', mats: conj(rotMats(3), SKEW2), plain: rotMats(3) },
    S3: { G: S3, tex: 'S_3', mats: conj(S3.mat, SKEW2), plain: S3.mat },
    D4: { G: D4, tex: 'D_4', mats: conj(D4.mat, SKEW2), plain: D4.mat },
  };
}

export default {
  collection: 'rep',
  chapter: 2,
  title: 'Complete reducibility and Schur’s lemma',
  summary: String.raw`Averaging over a finite group produces an invariant inner product, so every invariant subspace has an invariant complement and every representation splits into irreducibles (Maschke). The argument needs the group order to be invertible and the group to be finite, and fails instructively otherwise. Schur’s lemma — intertwiners between irreducibles are zero or isomorphisms, and scalars on one irreducible — is the engine of everything that follows.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: 'Averaging gives an invariant inner product',
      statement: String.raw`Let $\rho$ be a representation of a finite group $G$ on a real (resp. complex) vector space $V$, and let $\langle\cdot,\cdot\rangle_0$ be any inner product on $V$. Then
$$\langle x,y\rangle \;=\; \frac1{|G|}\sum_{g\in G}\big\langle \rho(g)x,\rho(g)y\big\rangle_0$$
is again an inner product, and it is **$G$-invariant**: $\langle\rho(h)x,\rho(h)y\rangle=\langle x,y\rangle$ for all $h\in G$. Equivalently, in a basis orthonormal for it every $\rho(h)$ is an orthogonal (unitary) matrix.`,
      idea: String.raw`Each term $x\mapsto\langle\rho(g)x,\rho(g)x\rangle_0$ is positive definite, and an average of positive definite forms is positive definite. Replacing $x,y$ by $\rho(h)x,\rho(h)y$ turns the term for $g$ into the term for $gh$, because $\rho(g)\rho(h)=\rho(gh)$; as $g$ runs over $G$ so does $gh$ (right translation is a bijection of the group), so the sum is unchanged. The finiteness of $G$ is what makes the sum, and the division by $|G|$, legitimate.`,
      caption: String.raw`The unit circle of a random inner product is the ellipse you shape with the two blue handles. The six (or three, or eight) faint ellipses are its images $\rho(g)E$ under the group, and their average is the thick green ellipse. Drag the gold point $x$: its orbit lies on one level ellipse of the averaged form, but on different levels of the original one. The right panel shows the same orbit after a change of basis that makes the averaged ellipse round. Tick "leave one element out" to average over a subset that is not a group and watch invariance fail.`,
      deps: ['rep-1.1', 'rca-4.1', 'ladr-6.2'],
      refs: ['Serre §1.3', 'Fulton–Harris §1.2'],
      tags: ['inner product', 'averaging'],
      credit: 'Averaging over a group goes back to Hurwitz (1897, invariant integration over SO(n) and SU(n)) and Maschke (1899, finite groups)',
      viz(v) {
        const GS = skewedGroups();
        const gs = v.select('group', [{ value: 'C3', label: '$\\mathbb Z/3$' }, { value: 'S3', label: '$S_3$' }, { value: 'D4', label: '$D_4$' }], 'S3');
        const omit = v.toggle('leave one element out of the average', false);
        const A = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.3], equal: true, axes: true, height: 420, weight: 1.25, title: 'the plane, original coordinates' });
        const B = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, axes: true, height: 420, weight: 1, title: 'after the change of basis' });
        const u = A.handle(1.0, 0.25, { color: 'blue', label: 'u' }), w = A.handle(-0.45, 0.7, { color: 'blue', label: 'w' });
        const x = A.handle(0.35, -1.05, { color: 'gold', label: 'x' });
        const state = () => {
          const { G, mats } = GS[gs.value];
          const Mx = [[u.x, w.x], [u.y, w.y]], det = Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0];
          if (Math.abs(det) < 0.05) return null;
          const Mi = inv(Mx), B0 = mm(tp(Mi), Mi);
          const idx = omit.value ? [...Array(G.n).keys()].filter((g) => g !== (G.n > 3 ? G.n - 1 : 1)) : null;
          const Bav = avgForm(G, mats, B0, idx);
          return { G, mats, B0, Bav, idx };
        };
        v.render(() => {
          const st = state();
          if (!st) { A.corner('the two handles must not be parallel', 'tl', { plate: true }); return; }
          const { G, mats, B0, Bav } = st, X = [x.x, x.y];
          // orbit images of the original ellipse
          G.mul.forEach((_, g) => {
            const Mi = inv(mats[g]); if (!Mi) return;
            A.path(ellipse(mm(tp(Mi), mm(B0, Mi)), 1), { color: 'orange', width: 1.2, alpha: 0.5 });
          });
          A.path(ellipse(B0, 1), { color: 'blue', width: 2.4 });
          A.path(ellipse(Bav, 1), { color: 'green', width: 3.2 });
          const c = Math.sqrt(qf(Bav, X));
          A.path(ellipse(Bav, c), { color: 'gold', width: 1.4, dash: [5, 4], alpha: 0.9 });
          G.mul.forEach((_, g) => { const p = mv(mats[g], X); A.dot(p[0], p[1], { r: 5, color: ecol(g), fill: ecol(g) }); });
          // right: coordinates in which Bav is the identity
          const { R } = sqrt2(Bav);
          B.circle(0, 0, 1, { color: 'green', width: 3, alpha: 0.9 });
          const cx = Math.sqrt(qf(Bav, X));
          B.circle(0, 0, cx, { color: 'gold', width: 1.4, dash: [5, 4] });
          const pts = G.mul.map((_, g) => mv(R, mv(mats[g], X)));
          if (G.n > 2) B.poly(pts.slice(0, G.n === 8 ? 4 : G.n === 6 ? 3 : G.n), { color: 'faint', width: 1, fill: false });
          pts.forEach((p, g) => B.dot(p[0], p[1], { r: 5.5, color: ecol(g), fill: ecol(g), label: `$${G.L[g]}$`, tex: true, labelPos: 'ne' }));
          const e0 = mv(R, [u.x, u.y]), e1 = mv(R, [w.x, w.y]);
          B.arrow(0, 0, e0[0], e0[1], { color: 'blue', width: 1.8 }); B.arrow(0, 0, e1[0], e1[1], { color: 'blue', width: 1.8 });
        });
        v.legend([['blue', 'original unit ball $\\langle\\cdot,\\cdot\\rangle_0$'], ['orange', 'its images $\\rho(g)E$'], ['green', 'averaged unit ball'], ['gold', 'level through the orbit of $x$', { dash: true }]]);
        v.readout(() => {
          const st = state();
          if (!st) return 'Move the handles apart: $u,w$ must span the plane.';
          const { G, mats, B0, Bav } = st, X = [x.x, x.y];
          const n0 = G.mul.map((_, g) => qf(B0, mv(mats[g], X))), n1 = G.mul.map((_, g) => qf(Bav, mv(mats[g], X)));
          const sp = (a) => Math.max(...a) - Math.min(...a);
          const d0 = formDefect(G, mats, B0), d1 = formDefect(G, mats, Bav);
          const { R, Ri } = sqrt2(Bav);
          const oth = G.mul.reduce((m, _, g) => { const O = mm(R, mm(mats[g], Ri)); return Math.max(m, fro(msub(mm(tp(O), O), eye(2)))); }, 0);
          return `Orbit of $x$ ($|G|=${G.n}$ points): $\\langle\\rho(g)x,\\rho(g)x\\rangle$ ranges over a window of width $${zero(sp(n0), v, 2).startsWith('0') ? '0' : nm(sp(n0), 3)}$ in the original form and $${sp(n1) < 1e-9 ? '0' : nm(sp(n1), 3)}$ in the average.\n$\\max_g\\|\\rho(g)^{\\mathsf T}B\\rho(g)-B\\|$: original $${nm(d0, 3)}$, averaged $${d1 < 1e-9 ? '0' : nm(d1, 3)}$. In the new basis $\\max_g\\|\\rho'(g)^{\\mathsf T}\\rho'(g)-I\\|=${oth < 1e-9 ? '0' : nm(oth, 3)}$${st.idx ? ' — **not a group sum, so invariance fails**' : ' — every matrix is orthogonal'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Maschke’s theorem',
      statement: String.raw`Let $G$ be a finite group and $V$ a finite-dimensional representation of $G$ over a field $k$ whose characteristic does not divide $|G|$ (for instance $\mathbb R$ or $\mathbb C$). If $W\subseteq V$ is an invariant subspace, then there is an invariant subspace $U$ with $V=W\oplus U$. Consequently every such representation is a direct sum of irreducible ones (**complete reducibility**).`,
      idea: String.raw`Pick any complement $U_0$ and let $\pi_0$ be the projection onto $W$ along $U_0$ — it need not commute with the group. Average it: $\pi=\frac1{|G|}\sum_g\rho(g)\,\pi_0\,\rho(g)^{-1}$, which needs $|G|$ to be invertible in $k$. Since $W$ is invariant, $\pi$ still maps $V$ onto $W$ and is the identity on $W$, so $\pi$ is a projection; the reindexing $g\mapsto gh$ of 2.1 shows $\pi\rho(h)=\rho(h)\pi$, so $\ker\pi$ is invariant. Induct on the dimension to split into irreducibles.`,
      caption: String.raw`$S_3$ permutes the coordinates of $\mathbb R^3$, but the basis is skewed, so the matrices are not orthogonal. Choose the invariant subspace $W$ (the line of constants, or the plane of sum zero) and drag the red handle to pick any complement $U_0$; the leak readout measures how far $U_0$ is moved out of itself by the six matrices. The naive Euclidean complement (the starting position) is not invariant. With "average" on, the green complement $\ker\pi$ is computed from the averaged projection; its leak is exactly $0$ wherever you put $U_0$.`,
      deps: ['rep-2.1', 'rep-1.5'],
      refs: ['Serre §1.4', 'Fulton–Harris §1.2'],
      tags: ['complete reducibility', 'projection', 'averaging'],
      credit: 'Maschke, 1899 (finite groups of complex matrices)',
      viz(v) {
        const G = dihedral(3), Pm = [[1, 0.5, 0.2], [0, 1, 0.4], [0.3, 0, 1]], Pi = inv(Pm);
        const mats = G.perms.map((p) => mm(Pm, mm(permMat(p), Pi)));
        const w = mv(Pm, [1, 1, 1]), m = mv(tp(Pi), [1, 1, 1]); // W-line direction, W-plane normal
        const nrm = (a) => vsc(a, 1 / len(a));
        const wsel = v.select('invariant subspace $W$', [{ value: 'line', label: 'line of constants' }, { value: 'plane', label: 'plane of sum 0' }], 'line', { onChange: () => reset() });
        const avg = v.toggle('average (Maschke)', true);
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.8, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.4, axis: 1.6, lim: 1.5, labels: ['x', 'y', 'z'] });
        const h = sc.handle(vadd(vsc(nrm(w), 1.0), [0.35, -0.5, 0.25]), { color: 'red', r: 8, label: 'h' });
        const reset = () => h.set(vadd(vsc(nrm(wsel.value === 'line' ? w : m), 1.0), [0.35, -0.5, 0.25]));
        const basisOf = (rows) => v.M.nullspace(rows, 1e-9); // orthonormal basis of {x : rows·x = 0}
        const dist = (y, Q) => len(vsub(y, Q.reduce((s, q) => vadd(s, vsc(q, dot(q, y))), [0, 0, 0])));
        const calc = () => {
          const line = wsel.value === 'line', d = h.p;
          let pi0;
          if (line) { const c = dot(d, w); if (Math.abs(c) < 0.05) return null; pi0 = w.map((wi) => d.map((di) => (wi * di) / c)); }
          else { const c = dot(m, d); if (Math.abs(c) < 0.05) return null; pi0 = eye(3).map((r, i) => r.map((x, j) => x - (d[i] * m[j]) / c)); }
          let pi = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
          G.perms.forEach((_, g) => { pi = madd(pi, mm(mats[g], mm(pi0, mats[G.inv[g]]))); });
          pi = msc(pi, 1 / G.n);
          const K0 = line ? basisOf([d]) : [nrm(d)], K = basisOf(pi);
          const Wb = line ? [nrm(w)] : basisOf([m]);
          const leak = (Q) => Math.max(...mats.flatMap((A) => Q.map((q) => dist(mv(A, q), Q))));
          let comm = 0; mats.forEach((A) => { comm = Math.max(comm, fro(msub(mm(pi, A), mm(A, pi)))); });
          return { line, d, pi, K0, K, Wb, l0: leak(K0), l1: leak(K), comm, idem: fro(msub(mm(pi, pi), pi)) };
        };
        const draw = (Q, col, fa, r) => {
          if (Q.length === 1) sc.line(vsc(Q[0], -r), vsc(Q[0], r), { color: col, width: 3.2 }, 6);
          else sc.disc(Q[0], Q[1], r, { fill: col, fillAlpha: fa, color: col, width: 1.6, grid: true });
        };
        v.render(() => {
          const c = calc();
          sc.begin();
          if (c) {
            draw(c.Wb, 'accent', 0.12, 1.45);
            draw(c.K0, 'red', 0.09, 1.3);
            if (avg.value) draw(c.K, 'green', 0.16, 1.2);
            sc.arrow([0, 0, 0], c.d, { color: 'red', width: 1.8, dash: true });
          } else sc.tex('\\text{choose } h \\text{ so that the splitting is transverse}', [0, 0, 0], { color: 'red' });
          sc.flush();
        });
        v.legend([['accent', '$W$ (invariant)'], ['red', '$U_0$: your complement'], ['green', '$U=\\ker\\pi$ (averaged)']]);
        v.readout(() => {
          const c = calc();
          if (!c) return 'The handle must not lie in $W$ (or its normal plane): then $U_0$ would not be a complement.';
          const f = (x) => (x < 1e-9 ? '0' : nm(x, 3));
          const dimU = c.line ? 2 : 1;
          return `$\\dim V=3=\\dim W+\\dim U$ with $\\dim U_0=${dimU}$. Leak of $U_0$ (largest distance of $\\rho(g)u$ from $U_0$, $|u|=1$): $${f(c.l0)}$ ${c.l0 < 1e-9 ? '— invariant by luck' : '— **not invariant**'}.\n${avg.value ? `Averaged $\\pi$: $\\|\\pi^2-\\pi\\|=${f(c.idem)}$, $\\max_g\\|\\pi\\rho(g)-\\rho(g)\\pi\\|=${f(c.comm)}$, leak of $U=\\ker\\pi$: $${f(c.l1)}$ — $V=W\\oplus U$ as representations.` : 'Switch on the average to compute $\\pi=\\frac1{|G|}\\sum\\rho(g)\\pi_0\\rho(g)^{-1}$.'}${c.line && avg.value ? ' The plane $U$ has no invariant line, so it is irreducible (1.6).' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Proposition',
      name: 'Maschke fails in characteristic p',
      statement: String.raw`Let $p$ be a prime and let $G=\mathbb Z/p$ act on $\mathbb F_p^{\,2}$ through the generator $\begin{pmatrix}1&1\\0&1\end{pmatrix}$ (a shear of order $p$). The line $W=\mathbb F_p e_1$ is invariant, but it has no invariant complement: of the $p+1$ lines through the origin it is the only one fixed by the generator. So the representation is reducible without being a direct sum of irreducibles, and Maschke's theorem fails when the characteristic divides $|G|$.`,
      idea: String.raw`The generator sends $(a,b)$ to $(a+b,b)$, so it fixes a line $\mathbb F_p(a,b)$ only when $b=0$. Therefore the other $p$ lines are permuted by it in one cycle, and none can serve as complement. The proof of 2.2 breaks at one point: averaging $\rho(g)\pi_0\rho(g)^{-1}$ over the $p$ elements gives $p\cdot\pi$ and one cannot divide by $|G|=p=0$. Computing the sum literally produces a nilpotent matrix, not a projection.`,
      caption: String.raw`Pick the prime $p$ (the group is $\mathbb Z/p$) and step the "line" slider through the $p+1$ lines of $\mathbb F_p^2$; each line's points have their own colour. In the left grid the selected line (ring) and its image under the shear (square) coincide only for the $x$-axis. On the right the lines are nodes and the generator's action is the arrow: one loop and one $p$-cycle. The readout computes $\sum_g\rho(g)\pi_0\rho(g)^{-1}$ modulo $p$ for the projection along your line.`,
      deps: ['rep-2.2'],
      refs: ['Fulton–Harris §1.2'],
      tags: ['characteristic p', 'modular representation'],
      scope: String.raw`Characteristic $p$ dividing $|G|$ (here $|G|=p$). Maschke's theorem still holds in characteristic $p$ for groups whose order is prime to $p$.`,
      viz(v) {
        const ps = v.select('prime $p$', [2, 3, 5, 7].map((p) => ({ value: p, label: String(p) })), 5, { onChange: () => {} });
        const ls = v.slider('line number', 0, 7, 1, { step: 1, int: true });
        const A = v.stage({ x: [-0.8, 7.0], y: [-0.8, 7.0], equal: true, axes: false, height: 400, weight: 1, title: '$\\mathbb F_p^{\\,2}$: points $(a,b)$, coloured by line' });
        const B = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 400, weight: 1, title: 'the $p+1$ lines and the shear' });
        const mod = (a, p) => ((a % p) + p) % p;
        const invp = (a, p) => { for (let k = 1; k < p; k++) if ((a * k) % p === 1) return k; return 0; };
        // line l < p: direction (1,l); l = p: direction (0,1)
        const lineOf = (a, b, p) => (a === 0 ? p : mod(b * invp(a, p), p));
        const shear = (a, b, p) => [mod(a + b, p), b];
        const dir = (l, p) => (l === p ? [0, 1] : [1, l]);
        v.render(() => {
          const p = ps.value, l = ls.value % (p + 1), gl = lineOf(...shear(...dir(l, p), p), p);
          A.setView([-0.7, p - 0.3 + 0.35], [-0.7, p - 0.3 + 0.35]);
          const lc = (k) => ['green', 'blue', 'orange', 'purple', 'red', 'teal', 'gold', 'pink'][k % 8];
          for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) {
            if (!a && !b) { A.dot(0, 0, { r: 5, color: 'ink' }); continue; }
            const k = lineOf(a, b, p), on = k === l, im = k === gl;
            A.dot(a, b, { r: on || im ? 7 : 5, color: lc(k), fill: lc(k) });
          }
          // draw selected line and its image
          const [da, db] = dir(l, p), [ga, gb] = shear(da, db, p);
          for (let c = 1; c < p; c++) {
            const x = (da * c) % p, y = (db * c) % p, X = (ga * c) % p, Y = (gb * c) % p;
            A.dot(x, y, { r: 11, hollow: true, color: 'ink', width: 2 });
            A.rect(X - 0.17, Y - 0.17, X + 0.17, Y + 0.17, { color: 'ink', width: 1.6, fill: false });
            A.arrow(x, y, X + (x === X && y === Y ? 0 : 0), Y, { color: 'faint', width: 1, head: 5 });
          }
          A.corner(l === gl ? 'the line is mapped to itself' : 'the line is moved to another line', 'tl', { plate: true });
          // right: the p+1 lines on a circle
          const pos = (k) => { const t = Math.PI / 2 - (TAU * k) / (p + 1); return [1.15 * Math.cos(t), 1.15 * Math.sin(t)]; };
          for (let k = 0; k <= p; k++) {
            const [x, y] = pos(k), tk = lineOf(...shear(...dir(k, p), p), p), [x2, y2] = pos(tk);
            if (tk === k) { B.circle(x * 1.2, y * 1.2, 0.17, { color: 'green', width: 2 }); }
            else { const d = [x2 - x, y2 - y], L = Math.hypot(...d); B.arrow(x + (d[0] / L) * 0.2, y + (d[1] / L) * 0.2, x2 - (d[0] / L) * 0.2, y2 - (d[1] / L) * 0.2, { color: k === l ? 'ink' : 'faint', width: k === l ? 2.4 : 1.4, head: 7 }); }
          }
          for (let k = 0; k <= p; k++) { const [x, y] = pos(k); B.dot(x, y, { r: k === l ? 15 : 12, color: lc(k), fill: lc(k) }); B.text(k === 0 ? 'x' : k === p ? 'y' : String(k), x, y, { align: 'center', baseline: 'middle', size: 11, weight: 700, color: 'panel' }); }
        });
        v.readout(() => {
          const p = ps.value, l = ls.value % (p + 1);
          let fixed = 0; for (let k = 0; k <= p; k++) if (lineOf(...shear(...dir(k, p), p), p) === k) fixed++;
          // projection onto the x-axis along line l (l != 0): pi0 = [[1, -1/l],[0,0]]
          let sum = [[0, 0], [0, 0]], pi0 = null;
          if (l !== 0) {
            const t = l === p ? 0 : mod(-invp(l, p), p); // along (1,l): (a,b) -> (a - b/l, 0); along (0,1): (a,b) -> (a, 0)
            pi0 = [[1, t], [0, 0]];
            for (let k = 0; k < p; k++) {
              const g = [[1, k], [0, 1]], gi = [[1, mod(-k, p)], [0, 1]];
              const T = mm(g, mm(pi0, gi)); sum = sum.map((r, i) => r.map((x, j) => x + T[i][j]));
            }
            sum = sum.map((r) => r.map((x) => mod(x, p)));
          }
          const msum = (A) => `\\begin{pmatrix}${A[0][0]}&${A[0][1]}\\\\${A[1][0]}&${A[1][1]}\\end{pmatrix}`;
          return `Invariant lines of the shear: **${fixed}** of the ${p + 1} (only the $x$-axis). A complement of $W=x$-axis would have to be a different invariant line, so none exists: $\\mathbb F_p^2$ is not $W\\oplus U$.\n${pi0 ? `Projection along line ${l === p ? '$y$' : l} (mod $${p}$): $\\pi_0=${msum(pi0)}$; the group sum $\\sum_g\\rho(g)\\pi_0\\rho(g)^{-1}=${msum(sum)}$ — on $W$ it is multiplication by $|G|=p\\equiv0$ (it sends $e_1$ to $(${sum[0][0]},${sum[1][0]})$), so dividing by $|G|$ to get a projection onto $W$ is impossible.` : 'Select a line other than the $x$-axis to see the failed averaging.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Proposition',
      name: 'Maschke fails for infinite groups',
      statement: String.raw`The additive group $\mathbb R$ acts on $\mathbb R^2$ by the shears $\rho(t)=\begin{pmatrix}1&t\\0&1\end{pmatrix}$. The $x$-axis is an invariant line, but it has no invariant complement: the only line fixed by every $\rho(t)$ (indeed by any $\rho(t)$ with $t\ne0$) is the $x$-axis itself. So complete reducibility fails for infinite groups, even for this abelian one. The averaging argument breaks because there is no invariant way to average over $\mathbb R$: an average over a window $[a,b]$ depends on where the window sits.`,
      idea: String.raw`Start from the projection $\pi_0$ onto the $x$-axis along a line of direction $(c,1)$, so $\pi_0=\begin{pmatrix}1&-c\\0&0\end{pmatrix}$. Conjugating gives $\rho(t)\pi_0\rho(-t)=\begin{pmatrix}1&-c-t\\0&0\end{pmatrix}$, so the averaging of 2.2 over $[a,b]$ returns the projection whose kernel has direction $(c+\tfrac{a+b}2,\,1)$. Moving the window moves the answer, and no window is distinguished; for a finite group, translating the index set by $h$ permutes the terms and nothing changes. Passing to $\lim$ over longer windows does not help either: the window centre can still be anywhere.`,
      caption: String.raw`Drag the red handle to choose a complement line to the green $x$-axis. The faint orange lines are its images under the shears $\rho(t)$, $t\in[a,b]$: none of them returns to the original. The blue line is the kernel of the projection averaged over the window $[a,b]$ (computed numerically); the dashed blue line is its image under the shear $s$. Slide the window and watch the blue line swing; the plot on the right shows its angle against the window centre, never reaching the invariant angle $0^\circ$.`,
      deps: ['rep-2.2'],
      refs: ['Fulton–Harris §1.2'],
      tags: ['infinite group', 'shear', 'averaging'],
      scope: String.raw`The group $\mathbb R$ (or $\mathbb Z$) is not finite; the same example works for $\mathbb Z\subset\mathbb R$. Maschke-type averaging still works for compact groups, where Haar measure provides an invariant average.`,
      viz(v) {
        const A = v.stage({ x: [-3.6, 3.6], y: [-2.6, 2.6], equal: true, axes: true, height: 400, weight: 1.2, title: 'the plane and the shears $\\rho(t)$' });
        const B = v.stage({ x: [-4, 4], y: [0, 180], axes: 'box', gutter: true, height: 400, weight: 0.9, xlabel: 'window centre $(a+b)/2$', ylabel: 'angle of $\\ker\\pi$ (degrees)', yticks: [[0, '0'], [45, '45'], [90, '90'], [135, '135'], [180, '180']], title: 'the averaged complement moves' });
        const ha = (-Math.PI) * 0 + 1.75;
        const hd = A.handle(Math.cos(ha), Math.sin(ha), { color: 'red', label: 'U₀', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, Math.abs(y / r) < 0.12 ? 0.12 * Math.sign(y || 1) : y / r].map((q, i, a) => q / Math.hypot(a[0], a[1])); } });
        const wa = v.slider('window left $a$', -3, 3, -1, { step: 0.05 });
        const wb = v.slider('window right $b$', -3, 3, 1, { step: 0.05 });
        const ss = v.slider('shear $s$', -3, 3, 1.2, { step: 0.05 });
        const avgKappa = (c, a, b) => { // Π = (1/N) Σ ρ(t) π0 ρ(-t), numerically; Π = [[1, κ],[0,0]]
          const N = 240; let S = [[0, 0], [0, 0]];
          for (let k = 0; k < N; k++) {
            const t = a + ((b - a) * (k + 0.5)) / N, P0 = [[1, -c], [0, 0]];
            S = madd(S, mm([[1, t], [0, 1]], mm(P0, [[1, -t], [0, 1]])));
          }
          S = msc(S, 1 / N); return S;
        };
        const dirAng = (K) => { const d = [-K[0][1], 1]; let a = (Math.atan2(d[1], d[0]) * 180) / Math.PI; if (a < 0) a += 180; return a; };
        const seg = (S, d, col, o = {}) => S.line(-4.5 * d[0], -4.5 * d[1], 4.5 * d[0], 4.5 * d[1], { color: col, ...o });
        v.render(() => {
          const d = [hd.x, hd.y], c = d[0] / d[1], a = Math.min(wa.value, wb.value), b = Math.max(wa.value, wb.value) + 1e-9;
          const K = avgKappa(c, a, b), kd = (() => { const q = [-K[0][1], 1], l = Math.hypot(...q); return [q[0] / l, q[1] / l]; })();
          for (let k = 0; k <= 12; k++) { const t = a + ((b - a) * k) / 12; seg(A, [d[0] + t * d[1], d[1]].map((q, _, z) => q / Math.hypot(...[d[0] + t * d[1], d[1]])), 'orange', { width: 1, alpha: 0.4 }); }
          A.line(-4.5, 0, 4.5, 0, { color: 'green', width: 3.5 });
          seg(A, d, 'red', { width: 2.4 });
          const s = ss.value, ks = [kd[0] + s * kd[1], kd[1]], l = Math.hypot(...ks);
          seg(A, [ks[0] / l, ks[1] / l], 'accent', { width: 2, dash: [6, 5], alpha: 0.9 });
          seg(A, kd, 'accent', { width: 3.2 });
          A.dot(d[0], d[1], { r: 0 });
          // plot: angle vs window centre, fixed half-width
          const hw = (b - a) / 2, pts = [];
          for (let m = -4; m <= 4.001; m += 0.1) pts.push([m, dirAng(avgKappa(c, m - hw, m + hw))]);
          B.hline(0, { color: 'green', width: 2.5 }); B.path(pts, { color: 'accent', width: 2.4 });
          B.dot((a + b) / 2, dirAng(K), { r: 7, color: 'accent', fill: 'accent' });
          B.text('invariant line (the $x$-axis)', 0.2, 12, { color: 'green', size: 12 });
        });
        v.legend([['green', '$x$-axis (invariant)'], ['red', '$U_0$'], ['orange', '$\\rho(t)U_0$, $t\\in[a,b]$'], ['accent', '$\\ker\\pi_{[a,b]}$ and its shear image', { }]]);
        v.readout(() => {
          const d = [hd.x, hd.y], c = d[0] / d[1], a = Math.min(wa.value, wb.value), b = Math.max(wa.value, wb.value) + 1e-9;
          const K = avgKappa(c, a, b), s = ss.value;
          const Ms = mm([[1, s], [0, 1]], mm(K, [[1, -s], [0, 1]])), defect = fro(msub(Ms, K));
          return `Window $[${nm(a, 2)},${nm(b, 2)}]$: $\\pi_{[a,b]}=\\begin{pmatrix}1&${nm(K[0][1], 3)}\\\\0&0\\end{pmatrix}$, predicted off-diagonal entry $-c-\\tfrac{a+b}2=${nm(-c - (a + b) / 2, 3)}$.\nInvariance defect $\\|\\rho(s)\\pi\\rho(-s)-\\pi\\|=${nm(defect, 3)}=|s|$ — zero only for $s=0$: no choice of window gives an equivariant projection, because the only fixed line is the $x$-axis.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Schur’s lemma',
      statement: String.raw`Let $V,W$ be irreducible representations of $G$ and $T\colon V\to W$ an intertwiner ($T\rho_V(g)=\rho_W(g)T$ for all $g$). Then $T=0$ or $T$ is an isomorphism. If moreover $V=W$ is finite-dimensional over an algebraically closed field (for instance $\mathbb C$), then $T=\lambda I$ is a scalar; hence $\dim\operatorname{Hom}_G(V,W)$ is $1$ if $V\cong W$ and $0$ otherwise. Over $\mathbb R$ the second statement can fail: $\operatorname{End}_G(V)$ is then a real division algebra.`,
      idea: String.raw`The kernel and the image of an intertwiner are invariant subspaces, because $\rho_W(g)Tv=T\rho_V(g)v$. Irreducibility leaves only $0$ or everything for each, so $T$ is zero or bijective. For $V=W$ over $\mathbb C$, $T$ has an eigenvalue $\lambda$; then $T-\lambda I$ is an intertwiner with a nonzero kernel, hence zero. The existence of an eigenvalue is exactly where algebraic closedness enters.`,
      caption: String.raw`Choose a representation of $S_3$ (or the rotation representation of $\mathbb Z/3$). The left table is a random matrix $X$; the right table is its average $\bar X=\frac1{|G|}\sum\rho(g)X\rho(g)^{-1}$, which always commutes with every $\rho(g)$. For the irreducible standard representation $\bar X$ is a multiple of the identity; for $V\oplus V$ it is block-scalar; for $1\oplus\varepsilon$ only diagonal matrices survive. The readout solves the equations $X\rho(g)=\rho(g)X$ exactly and reports the dimension of the solution space. The rotation representation shows what real scalars cannot do: its commutant has dimension $2$.`,
      deps: ['rep-1.6', 'rep-1.4', 'ladr-5.19'],
      refs: ['Serre §2.2', 'Fulton–Harris §1.2'],
      tags: ['Schur', 'intertwiner', 'commutant'],
      credit: 'Schur, 1905 (Neue Begründung der Theorie der Gruppencharaktere, 1905)',
      viz(v) {
        const D3 = dihedral(3), C3 = cyclic(3);
        const std = D3.mat, triv = D3.perms.map(() => [[1]]), sgn = D3.perms.map((_, g) => [[D3.isRef(g) ? -1 : 1]]);
        const sum = (...rs) => D3.perms.map((_, g) => rs.reduce((A, r) => (A ? dsum(A, r[g]) : r[g]), null));
        const REPS = {
          std: { G: D3, mats: std, blocks: [2], dim: 1, label: '$V_{\\mathrm{std}}$ (irreducible)' },
          rot: { G: C3, mats: Array.from({ length: 3 }, (_, a) => rot2((TAU * a) / 3)), blocks: [2], dim: 2, label: '$\\mathbb Z/3$ rotating $\\mathbb R^2$' },
          ts: { G: D3, mats: sum(triv, sgn), blocks: [1, 1], dim: 2, label: '$\\mathbf 1\\oplus\\varepsilon$' },
          st: { G: D3, mats: sum(std, triv), blocks: [2, 1], dim: 2, label: '$V_{\\mathrm{std}}\\oplus\\mathbf 1$' },
          ss: { G: D3, mats: sum(std, std), blocks: [2, 2], dim: 4, label: '$V_{\\mathrm{std}}\\oplus V_{\\mathrm{std}}$' },
        };
        const rs = v.select('representation', Object.entries(REPS).map(([k, r]) => ({ value: k, label: r.label })), 'std');
        let seed = 7;
        v.button('Resample $X$', () => { seed += 1; });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'a random matrix $X$' });
        const Bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'its average $\\bar X$ over the group' });
        const TA = v.table(A, { rows: 2, cols: 2, maxCell: 60, size: 12.5, margin: 8 }), TB = v.table(Bs, { rows: 2, cols: 2, maxCell: 84, size: 14, margin: 8 });
        const calc = () => {
          const R = REPS[rs.value], n = R.mats[0].length, rnd = v.rng(seed);
          const X = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.round((rnd() * 4 - 2) * 10) / 10));
          const Xb = avgConj(R.G, R.mats, X);
          const rows = [];
          R.mats.forEach((M) => { const K = msub(kron(M, eye(n)), kron(eye(n), tp(M))); rows.push(...K); });
          const dim = v.M.nullspace(rows, 1e-9).length;
          let comm = 0; R.mats.forEach((M) => { comm = Math.max(comm, fro(msub(mm(M, Xb), mm(Xb, M))), 0); });
          let comm0 = 0; R.mats.forEach((M) => { comm0 = Math.max(comm0, fro(msub(mm(M, X), mm(X, M)))); });
          return { R, n, X, Xb, dim, comm, comm0 };
        };
        const bounds = (blocks) => { const out = []; let i = 0; for (const b of blocks) { out.push([i, i + b - 1]); i += b; } return out; };
        v.render(() => {
          const { R, n, X, Xb } = calc();
          const draw = (T, M) => {
            T.draw({ rows: n, cols: n, value: (i, j) => (Math.abs(M[i][j]) < 5e-3 ? 0 : M[i][j]), format: 2, heat: (i, j) => 0.5 + 0.5 * Math.max(-1, Math.min(1, M[i][j] / 2)), cmap: 'diverging', size: 14, textColor: (i, j) => (Math.abs(M[i][j]) < 1e-9 ? 'faint' : 'ink') });
            const bb = bounds(R.blocks); bb.forEach(([i0, i1]) => bb.forEach(([j0, j1]) => T.box(i0, j0, i1, j1, { color: 'muted', width: 1.5 })));
          };
          draw(TA, X); draw(TB, Xb);
        });
        v.readout(() => {
          const { R, n, X, Xb, dim, comm, comm0 } = calc(), f = (x) => (x < 1e-9 ? '0' : nm(x, 3));
          const tr = X.reduce((s, r, i) => s + r[i], 0) / n;
          const irr = rs.value === 'std';
          return `Solving $X\\rho(g)=\\rho(g)X$ for all $g\\in G$: the solution space has dimension **${dim}**. Commutator defect of $X$: $${f(comm0)}$; of $\\bar X$: $${f(comm)}$.${irr ? `\nSchur: $\\bar X=\\lambda I$ with $\\lambda=\\operatorname{tr}X/${n}=${nm(tr, 3)}$ (diagonal entries of $\\bar X$: $${nm(Xb[0][0], 3)}$, $${nm(Xb[1][1], 3)}$; off-diagonal: $${nm(Xb[0][1], 3)}$, $${nm(Xb[1][0], 3)}$).` : rs.value === 'rot' ? '\nOver $\\mathbb R$ the commutant of this irreducible representation is $\\{aI+bJ\\}\\cong\\mathbb C$, of dimension 2: Schur gives only a division algebra. See 2.9.' : rs.value === 'ss' ? '\nThe commutant is $M_2(\\mathbb R)\\otimes I_2$: dimension $2^2=4$ (multiplicity squared).' : '\nThe commutant has dimension $\\sum m_i^2$ over the irreducible constituents.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Corollary',
      name: 'Irreducible representations of abelian groups are one-dimensional',
      statement: String.raw`Let $G$ be a finite abelian group. Every irreducible complex representation of $G$ has dimension $1$; so every complex representation of $G$ is a direct sum of one-dimensional ones, i.e. all the matrices $\rho(g)$ are simultaneously diagonalizable. (Over $\mathbb R$ this fails: the rotation group $\mathbb Z/3$ has a two-dimensional irreducible real representation, see 2.9.)`,
      idea: String.raw`For each $h\in G$, commutativity says $\rho(h)\rho(g)=\rho(g)\rho(h)$ for all $g$, so $\rho(h)$ is an intertwiner of the irreducible $V$ with itself. By Schur's lemma 2.5 (this is where $\mathbb C$ enters) $\rho(h)=\lambda(h)I$ is a scalar. Then every line in $V$ is invariant, and irreducibility forces $\dim V=1$. Equivalently, commuting diagonalizable matrices have a common eigenvector.`,
      caption: String.raw`The picture searches all lines through the origin of $\mathbb R^2$ for invariance. The curve on the right is $f(\theta)=\max_g|\sin\angle(v_\theta,\rho(g)v_\theta)|$, the worst turning of the line at angle $\theta$ by the group; its zeros are the common eigenlines. For the abelian group $\mathbb Z/2\times\mathbb Z/2$ (in a skewed basis, change the skew) there are two such lines, drawn in green; for the non-abelian $S_3$ and $D_4$ there are none. The group $C_3\subset S_3$ is abelian but its real representation has none either: only the complex numbers supply the eigenvectors (2.9).`,
      deps: ['rep-2.5', 'ladr-5.76'],
      refs: ['Serre §3.1', 'Fulton–Harris §1.3'],
      tags: ['abelian group', 'diagonalization'],
      viz(v) {
        const D3 = dihedral(3), D4 = dihedral(4);
        const sel = v.select('group', [{ value: 'v4', label: '$\\mathbb Z/2\\times\\mathbb Z/2$' }, { value: 'c3', label: '$C_3\\subset S_3$' }, { value: 's3', label: '$S_3$' }, { value: 'd4', label: '$D_4$' }], 'v4');
        const kk = v.slider('skew of the basis', 0, 1.5, 0.8, { step: 0.05 });
        const A = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: true, height: 380, weight: 1, title: 'a line $\\ell$ and its images $\\rho(g)\\ell$' });
        const B = v.stage({ x: [0, 180], y: [0, 1.08], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'direction of the line $\\theta$ (degrees)', ylabel: 'worst turning $f(\\theta)$', xticks: [0, 45, 90, 135, 180].map((x) => [x, String(x)]), title: 'which lines survive every $\\rho(g)$?' });
        const ang = 1.95, hd = A.handle(1.5 * Math.cos(ang), 1.5 * Math.sin(ang), { color: 'ink', label: 'ℓ', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(1.5 * x) / r, (1.5 * y) / r]; } });
        const mats = () => {
          const P = [[1, kk.value], [0, 1]];
          switch (sel.value) {
            case 'v4': return conj([eye(2), [[1, 0], [0, -1]], [[-1, 0], [0, 1]], [[-1, 0], [0, -1]]], P);
            case 'c3': return D3.mat.slice(0, 3);
            case 's3': return D3.mat;
            default: return D4.mat;
          }
        };
        const turn = (M, th) => { const x = [Math.cos(th), Math.sin(th)], y = mv(M, x); return Math.abs(x[0] * y[1] - x[1] * y[0]) / (Math.hypot(...y) || 1); };
        const f = (Ms, th) => Math.max(...Ms.map((M) => turn(M, th)));
        const zeros = (Ms) => {
          const N = 720, vals = Array.from({ length: N }, (_, k) => f(Ms, (Math.PI * k) / N)), out = [];
          for (let k = 0; k < N; k++) if (vals[k] <= vals[(k + N - 1) % N] && vals[k] <= vals[(k + 1) % N] && vals[k] < 0.05) {
            let lo = (Math.PI * (k - 1)) / N, hi = (Math.PI * (k + 1)) / N;
            for (let it = 0; it < 40; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(Ms, m1) < f(Ms, m2)) hi = m2; else lo = m1; }
            const th = (lo + hi) / 2; if (f(Ms, th) < 1e-6 && !out.some((o) => Math.abs(o - th) < 1e-3)) out.push(((th % Math.PI) + Math.PI) % Math.PI);
          }
          return out;
        };
        v.render(() => {
          const Ms = mats(), th0 = ((Math.atan2(hd.y, hd.x) % Math.PI) + Math.PI) % Math.PI, z = zeros(Ms);
          z.forEach((t) => A.line(-1.8 * Math.cos(t), -1.8 * Math.sin(t), 1.8 * Math.cos(t), 1.8 * Math.sin(t), { color: 'green', width: 5, alpha: 0.55 }));
          Ms.forEach((M, g) => { const x = [Math.cos(th0), Math.sin(th0)], y = mv(M, x), l = Math.hypot(...y); A.line(-1.7 * y[0] / l, -1.7 * y[1] / l, 1.7 * y[0] / l, 1.7 * y[1] / l, { color: ecol(g), width: 1.6, alpha: 0.75 }); });
          A.line(-1.7 * Math.cos(th0), -1.7 * Math.sin(th0), 1.7 * Math.cos(th0), 1.7 * Math.sin(th0), { color: 'ink', width: 2.6 });
          B.fn((x) => f(Ms, (x * Math.PI) / 180), { color: 'accent', width: 2.4, n: 360 });
          z.forEach((t) => B.dot((t * 180) / Math.PI, 0, { r: 7, color: 'green', fill: 'green' }));
          B.dot((th0 * 180) / Math.PI, f(Ms, th0), { r: 6, color: 'ink', fill: 'ink' });
        });
        v.readout(() => {
          const Ms = mats(), th0 = ((Math.atan2(hd.y, hd.x) % Math.PI) + Math.PI) % Math.PI, z = zeros(Ms);
          let comm = 0; Ms.forEach((M) => Ms.forEach((N) => { comm = Math.max(comm, fro(msub(mm(M, N), mm(N, M)))); }));
          const lab = { v4: 'Z/2×Z/2', c3: 'C₃', s3: 'S₃', d4: 'D₄' }[sel.value];
          return `$\\max\\|\\rho(g)\\rho(h)-\\rho(h)\\rho(g)\\|=${comm < 1e-9 ? '0' : nm(comm, 3)}$ — the group is ${comm < 1e-9 ? '**abelian**' : '**non-abelian**'}. Current line: worst turning $f(\\theta)=${nm(f(Ms, th0), 3)}$. Common invariant real lines found: **${z.length}**${z.length ? ` (at $${z.map((t) => nm((t * 180) / Math.PI, 1)).join('^\\circ,\\ ')}^\\circ$)` : ''}.\n${z.length === 2 ? 'Two lines, so $\\mathbb R^2=\\ell_1\\oplus\\ell_2$ splits into one-dimensional irreducibles.' : z.length === 0 && comm < 1e-9 ? 'No invariant real line although the group is abelian: the eigenvalues are not real. Over $\\mathbb C$ the commuting rotations share the eigenvectors $(1,\\pm i)$.' : z.length === 0 ? 'No invariant line at all: this representation is irreducible and two-dimensional, which is only possible because the group is non-abelian.' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Theorem',
      name: 'The isotypic decomposition is unique',
      statement: String.raw`Let $V$ be a finite-dimensional complex representation of a finite group $G$, and let $S_1,\dots,S_r$ be the distinct irreducible representations. Write $V\cong\bigoplus_i S_i^{\,m_i}$. The $i$-th **isotypic component** $V_i$, the sum of all subrepresentations of $V$ isomorphic to $S_i$, is a uniquely determined subspace, and $V=\bigoplus_iV_i$. The multiplicities $m_i$ are determined by $V$. The splitting of each $V_i$ into $m_i$ copies of $S_i$, however, is not unique when $m_i>1$.`,
      idea: String.raw`If $U\subseteq V$ is an irreducible subrepresentation, then composing the inclusion with the projection to the $j$-th summand $S_j^{m_j}$ is an intertwiner from $U$ to an irreducible, so by Schur's lemma (2.5) it is zero unless $U\cong S_j$; hence $U$ lies inside the sum of the summands of its own type. This proves that $V_i$ does not depend on the chosen splitting, and, with Maschke (2.2), that $V=\bigoplus V_i$. Inside $V_i\cong S_i\otimes k^{m_i}$ the copies of $S_i$ correspond to the lines of the multiplicity space $k^{m_i}$, and there are infinitely many choices when $m_i\ge 2$.`,
      caption: String.raw`The group $\mathbb Z/2$ acts on $\mathbb R^3$ by $\pm1$ on the coordinate axes (choose whether the plane carries the trivial or the sign representation). The blue and orange handles split the large isotypic plane into two invariant lines; the teal and purple handles give a second, different splitting. Every line in the plane is an irreducible subrepresentation, so there is an infinite choice, but the plane itself (shaded) and the green axis are the same in both splittings. Drag $x$: its two components are computed by the averaging operators $\tfrac12(1\pm g)$, and they agree with the coordinates computed from either splitting.`,
      deps: ['rep-2.2', 'rep-2.5'],
      refs: ['Serre §2.6', 'Fulton–Harris §1.2'],
      tags: ['isotypic component', 'uniqueness', 'multiplicity'],
      viz(v) {
        const pat = v.select('the plane carries', [{ value: 'triv', label: 'the trivial rep. ($g=\\mathrm{diag}(1,1,-1)$)' }, { value: 'sign', label: 'the sign rep. ($g=\\mathrm{diag}(-1,-1,1)$)' }], 'triv');
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.8, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.8, pitch: 0.42, axis: 1.5, lim: 1.4, labels: ['e₁', 'e₂', 'e₃'] });
        const pl = { mode: 'plane', a: [1, 0, 0], b: [0, 1, 0], r: 7 };
        const hA1 = sc.handle([1.0, 0.2, 0], { ...pl, color: 'blue', label: 'a₁' });
        const hA2 = sc.handle([0.1, 1.0, 0], { ...pl, color: 'orange', label: 'a₂' });
        const hB1 = sc.handle([0.7, -0.8, 0], { ...pl, color: 'teal', label: 'b₁' });
        const hB2 = sc.handle([-0.9, -0.4, 0], { ...pl, color: 'purple', label: 'b₂' });
        const hx = sc.handle([0.8, 0.5, 0.9], { color: 'ink', r: 7, label: 'x' });
        const sgn = () => (pat.value === 'triv' ? [1, 1, -1] : [-1, -1, 1]);
        const split = (x) => { const gx = x.map((t, i) => t * sgn()[i]); return { plus: x.map((t, i) => (t + gx[i]) / 2), minus: x.map((t, i) => (t - gx[i]) / 2) }; };
        const coords = (p, q, x) => {
          const M = [[p[0], q[0]], [p[1], q[1]]];
          if (Math.abs(M[0][0] * M[1][1] - M[0][1] * M[1][0]) < 1e-3) return null;
          return v.M.solve(M, [x[0], x[1]]);
        };
        const parts = () => { const pr = split(hx.p); return pat.value === 'triv' ? { plane: pr.plus, axis: pr.minus } : { plane: pr.minus, axis: pr.plus }; };
        v.render(() => {
          const X = hx.p, { plane, axis } = parts();
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 1.4, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4, grid: true });
          sc.line([0, 0, -1.45], [0, 0, 1.45], { color: 'green', width: 3.4 }, 6);
          const ray = (h, col, dash) => { const l = len(h.p) || 1; sc.line(vsc(h.p, -1.5 / l), vsc(h.p, 1.5 / l), { color: col, width: 2.4, dash }, 6); };
          ray(hA1, 'blue', false); ray(hA2, 'orange', false); ray(hB1, 'teal', true); ray(hB2, 'purple', true);
          sc.line(plane, X, { color: 'faint', width: 1, dash: true }, 1); sc.line(axis, X, { color: 'faint', width: 1, dash: true }, 1);
          sc.arrow([0, 0, 0], plane, { color: 'accent', width: 2.4 }); sc.arrow([0, 0, 0], axis, { color: 'green', width: 2.4 });
          sc.arrow([0, 0, 0], X, { color: 'ink', width: 2.6 });
          sc.flush();
        });
        v.legend([['accent', 'isotypic plane (the same for both)'], ['green', 'other isotypic line'], ['blue', 'splitting A: $a_1,a_2$'], ['teal', 'splitting B: $b_1,b_2$', { dash: true }]]);
        v.readout(() => {
          const { plane } = parts(), ca = coords(hA1.p, hA2.p, plane), cb = coords(hB1.p, hB2.p, plane);
          if (!ca || !cb) return 'The two handles of a splitting must not lie on one line.';
          const sg = (c) => (c < 0 ? '-' : '+') + nm(Math.abs(c), 2), off = 0, t = pat.value === 'triv';
          const inv = (h) => { const y = h.p.map((c, i) => c * sgn()[i]), s = dot(y, h.p) / dot(h.p, h.p); return len(vsub(y, vsc(h.p, s))); };
          const dI = Math.max(...[hA1, hA2, hB1, hB2].map(inv));
          return `$V=${t ? '\\mathbf 1^{\\,2}\\oplus\\varepsilon' : '\\varepsilon^{2}\\oplus\\mathbf 1'}$: multiplicity $2$ in the plane, $1$ on the axis. Each of the four lines is invariant ($\\max$ distance of $\\rho(g)h$ from $\\mathbb Rh$: $${dI < 1e-9 ? '0' : nm(dI, 3)}$).\nThe plane component of $x$ is $\\tfrac12(1${t ? '+' : '-'}\\rho(g))x=(${plane.slice(0, 2).map((c) => nm(c, 2)).join(',\\,')},0)$ $=${nm(ca[0], 2)}\\,a_1${sg(ca[1])}\\,a_2=${nm(cb[0], 2)}\\,b_1${sg(cb[1])}\\,b_2$: the same vector from both splittings, though the lines differ${off > 1e-9 ? '' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Proposition',
      name: 'Averaging projects onto the invariants',
      statement: String.raw`For a representation $\rho$ of a finite group $G$ on $V$ (over a field in which $|G|$ is invertible), the operator $P=\frac1{|G|}\sum_{g\in G}\rho(g)$ is a projection of $V$ onto the subspace $V^G=\{v:\rho(g)v=v\ \forall g\}$ of invariant vectors: $P^2=P$, $\operatorname{im}P=V^G$ and $P$ is the identity on $V^G$. It commutes with every $\rho(h)$, and if $\rho$ is orthogonal or unitary then $P$ is the orthogonal projection onto $V^G$. In particular $\dim V^G=\operatorname{tr}P=\frac1{|G|}\sum_g\operatorname{tr}\rho(g)$.`,
      idea: String.raw`For $h\in G$ the substitution $g\mapsto hg$ permutes the terms of the sum, so $\rho(h)P=P$: the image of $P$ is fixed by $G$. On a fixed vector each term equals $v$, so the average is $v$, whence $P|_{V^G}=\mathrm{id}$ and $P^2=P$. When the $\rho(g)$ are orthogonal, $P^{\mathsf T}=\frac1{|G|}\sum\rho(g^{-1})=P$, so the projection is orthogonal. A projection has trace equal to its rank, which gives the dimension formula (the first use of characters, chapter 3).`,
      caption: String.raw`Choose a group acting on $\mathbb R^3$ by rotations and reflections and drag the black point $x$. The coloured dots are its orbit $\{\rho(g)x\}$, the spokes meet at the centroid, and the gold arrow $Px$ is that centroid. It always lands on the green fixed subspace, and the segment from $x$ to $Px$ is perpendicular to it. For $\{\pm1\}$ the fixed space is $0$, so the centroid is the origin whatever $x$ is. The readout checks $P^2=P$ and compares $\operatorname{tr}P$ with $\dim V^G$.`,
      deps: ['rep-2.1'],
      refs: ['Fulton–Harris §2.2', 'Serre §2.6'],
      tags: ['invariants', 'projection', 'averaging'],
      links: {},
      viz(v) {
        const D3 = dihedral(3), D4 = dihedral(4);
        const R3 = (M) => [[M[0][0], M[0][1], 0], [M[1][0], M[1][1], 0], [0, 0, 1]];
        const CASES = {
          perm: { label: '$S_3$ permuting coordinates', G: D3, mats: D3.perms.map(permMat), L: D3.L },
          rot: { label: '$\\mathbb Z/4$ turning about $e_3$', G: cyclic(4), mats: Array.from({ length: 4 }, (_, a) => R3(rot2((TAU * a) / 4))), L: cyclic(4).L },
          d4: { label: '$D_4$ on the $e_1e_2$-plane', G: D4, mats: D4.mat.map(R3), L: D4.L },
          mir: { label: 'one mirror $x\\leftrightarrow y$', G: cyclic(2), mats: [eye(3), [[0, 1, 0], [1, 0, 0], [0, 0, 1]]], L: ['e', 's'] },
          neg: { label: '$\\{\\pm I\\}$', G: cyclic(2), mats: [eye(3), msc(eye(3), -1)], L: ['e', '-1'] },
        };
        const cs = v.select('group acting on $\\mathbb R^3$', Object.entries(CASES).map(([k, c]) => ({ value: k, label: c.label })), 'perm');
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.8, 1.9], equal: true, axes: false, height: 430 });
        const sc = v.scene3(S, { yaw: -0.65, pitch: 0.38, axis: 1.5, lim: 1.4, labels: ['e₁', 'e₂', 'e₃'] });
        const hx = sc.handle([0.9, -0.35, 0.8], { color: 'ink', r: 8, label: 'x' });
        const calc = () => {
          const c = CASES[cs.value];
          let P = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; c.mats.forEach((M) => { P = madd(P, M); }); P = msc(P, 1 / c.mats.length);
          const F = v.M.nullspace(msub(P, eye(3)), 1e-9), x = hx.p, px = mv(P, x);
          return { c, P, F, x, px };
        };
        v.render(() => {
          const { c, F, x, px } = calc();
          sc.begin();
          if (F.length === 1) sc.line(vsc(F[0], -1.5), vsc(F[0], 1.5), { color: 'green', width: 3.6 }, 6);
          else if (F.length === 2) sc.disc(F[0], F[1], 1.45, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1.6, grid: true });
          else if (F.length === 0) sc.dot([0, 0, 0], { r: 6, color: 'green' });
          const orb = c.mats.map((M) => mv(M, x));
          orb.forEach((p) => sc.line(p, px, { color: 'faint', width: 1, alpha: 0.7 }, 1));
          sc.line(x, px, { color: 'ink', width: 1.4, dash: true }, 1);
          orb.forEach((p, g) => sc.dot(p, { r: 5.5, color: ecol(g), fill: ecol(g) }));
          sc.arrow([0, 0, 0], x, { color: 'ink', width: 2 });
          sc.arrow([0, 0, 0], px, { color: 'gold', width: 3.4 });
          sc.flush();
        });
        v.legend([['green', 'fixed vectors $V^G$'], ['gold', '$Px$ = centroid of the orbit'], ['ink', '$x$']]);
        v.readout(() => {
          const { c, P, F, x, px } = calc(), f = (t) => (t < 1e-9 ? '0' : nm(t, 3));
          const perp = Math.max(0, ...F.map((q) => Math.abs(dot(vsub(x, px), q))));
          const fixErr = Math.max(0, ...c.mats.map((M) => len(vsub(mv(M, px), px))));
          const tr = P[0][0] + P[1][1] + P[2][2];
          return `$|G|=${c.mats.length}$ orbit points. $\\|P^2-P\\|=${f(fro(msub(mm(P, P), P)))}$ · $\\max_g\\|\\rho(g)Px-Px\\|=${f(fixErr)}$ (the centroid is fixed) · $(x-Px)\\perp V^G$: inner products $${f(perp)}$.\n$\\dim V^G=${F.length}$ and $\\operatorname{tr}P=\\frac1{|G|}\\sum_g\\operatorname{tr}\\rho(g)=${nm(tr, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Proposition',
      name: 'Irreducible over ℝ, reducible over ℂ',
      statement: String.raw`Let $n\ge3$ and let $\mathbb Z/n$ act on $\mathbb R^2$ by the rotation $\rho(k)$ through $2\pi k/n$. This real representation has no invariant line, hence is irreducible over $\mathbb R$. Viewed over $\mathbb C$ it splits as $\mathbb C^2=L_+\oplus L_-$, with $L_\pm=\mathbb C(1,\mp i)$ and the generator acting on $L_\pm$ by $e^{\pm2\pi i/n}$: two different one-dimensional characters, complex conjugate to each other. (For $n=2$ the rotation is $-I$ and every real line is invariant.) Irreducibility over a field is not preserved by extending the field.`,
      idea: String.raw`A rotation through $2\pi/n$ with $n\ge3$ turns every real direction to a different direction, so no line is invariant. Its characteristic polynomial $\lambda^2-2\cos(2\pi/n)\lambda+1$ has the non-real roots $e^{\pm2\pi i/n}$, so real eigenvectors do not exist, while over $\mathbb C$ the matrices commute and have the common eigenvectors $(1,\mp i)$ (2.6). Complex conjugation swaps the two lines, which is why they cannot be defined over $\mathbb R$; Schur's lemma needs an algebraically closed field (2.5).`,
      caption: String.raw`Slide $n$ and drag the line $\ell$: the coloured lines are its images under the $n$ rotations, and the bars on the right show the best possible invariance defect of any real line, which vanishes only for $n=2$. Switch the field to $\mathbb C$: the same matrices, written in the basis $(1,-i),(1,i)$, become diagonal, and the Argand plane shows the two characters $k\mapsto\omega^k$ (blue) and $k\mapsto\bar\omega^k$ (red).`,
      deps: ['rep-2.6'],
      refs: ['Fulton–Harris §3.5'],
      tags: ['real representation', 'field extension', 'rotation'],
      viz(v) {
        const nn = v.slider('order $n$ of the rotation group', 2, 12, 4, { step: 1, int: true });
        const fld = v.select('field', [{ value: 'R', label: '$\\mathbb R$' }, { value: 'C', label: '$\\mathbb C$' }], 'R');
        const A = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: true, height: 380, weight: 1, title: 'a real line $\\ell$ and its images' });
        const B = v.stage({ x: [0, 13], y: [0, 1.4], axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 'order $n$', ylabel: 'least invariance defect of a real line', xticks: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((x) => [x, String(x)]), title: 'invariant real lines?' });
        const ang = 0.6, hd = A.handle(1.5 * Math.cos(ang), 1.5 * Math.sin(ang), { color: 'ink', label: 'ℓ', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(1.5 * x) / r, (1.5 * y) / r]; } });
        const best = (n) => Math.max(...Array.from({ length: n }, (_, k) => Math.abs(Math.sin((TAU * k) / n)))); // same for every direction
        v.render(() => {
          const n = nn.value, th = Math.atan2(hd.y, hd.x);
          hd.visible = fld.value === 'R';
          if (fld.value === 'R') {
            for (let k = 0; k < n; k++) { const t = th + (TAU * k) / n; A.line(-1.7 * Math.cos(t), -1.7 * Math.sin(t), 1.7 * Math.cos(t), 1.7 * Math.sin(t), { color: ecol(k), width: k ? 1.8 : 2.8, alpha: k ? 0.8 : 1 }); }
            A.corner(n === 2 ? 'every line is invariant: $\\rho(1)=-I$' : 'no line is invariant', 'tl', { plate: true });
          } else {
            // complex picture: the Argand plane of the eigenvalues
            A.circle(0, 0, 1.45, { color: 'faint', width: 1, dash: true });
            for (let k = 0; k < n; k++) {
              const t = (TAU * k) / n;
              A.line(0, 0, 1.45 * Math.cos(t), 1.45 * Math.sin(t), { color: 'blue', width: 1, alpha: 0.35 });
              A.dot(1.45 * Math.cos(t), 1.45 * Math.sin(t), { r: 7, color: 'blue', fill: 'blue' });
              A.dot(1.45 * Math.cos(-t), 1.45 * Math.sin(-t), { r: 4, hollow: true, color: 'red' });
            }
            A.corner('eigenvalues $\\omega^k$ on $L_+$ (filled blue), $\\bar\\omega^{k}$ on $L_-$ (hollow red)', 'tl', { plate: true });
          }
          for (let m = 2; m <= 12; m++) B.rect(m - 0.35, 0, m + 0.35, best(m), { fill: m === n ? 'accent' : 'muted', fillAlpha: m === n ? 0.7 : 0.3, color: m === n ? 'accent' : 'muted' });
          B.corner(fld.value === 'C' ? 'over $\\mathbb C$ the lines $L_\\pm$ are invariant for every $n$ (defect $0$)' : 'over $\\mathbb R$: zero only at $n=2$', 'tl', { plate: true, size: 12 });
        });
        v.readout(() => {
          const n = nn.value, w = TAU / n, c = Math.cos(w);
          if (fld.value === 'R') {
            const th = Math.atan2(hd.y, hd.x), turn = Math.max(...Array.from({ length: n }, (_, k) => Math.abs(Math.sin((TAU * k) / n))));
            return `Generator $\\rho=\\begin{pmatrix}${nm(c, 3)}&${nm(-Math.sin(w), 3)}\\\\${nm(Math.sin(w), 3)}&${nm(c, 3)}\\end{pmatrix}$, eigenvalues $\\lambda^2-${nm(2 * c, 3)}\\lambda+1=0$: discriminant $${nm(4 * c * c - 4, 3)}$ ${n === 2 ? '$\\ge0$ — real eigenvalue $-1$ (twice); the representation is the direct sum of two copies of the sign character.' : '$<0$ — no real eigenvector.'}\nWorst turning of the line at $${nm((th * 180) / Math.PI, 1)}^\\circ$ by the group: $${nm(turn, 3)}$ ${n === 2 ? '(for $n=2$ the group is $\\{\\pm I\\}$, defect $0$)' : '(the same for every direction): **irreducible over $\\mathbb R$**'}.`;
          }
          return `Over $\\mathbb C$: $\\rho(k)(1,\\mp i)^{\\mathsf T}=e^{\\pm2\\pi ik/n}(1,\\mp i)^{\\mathsf T}$, so in the basis $\\{(1,-i),(1,i)\\}$ every $\\rho(k)=\\operatorname{diag}(\\omega^k,\\bar\\omega^k)$ with $\\omega=e^{2\\pi i/n}$ (here $\\omega=${nm(c, 3)}${Math.sin(w) < 0 ? '-' : '+'}${nm(Math.abs(Math.sin(w)), 3)}i$). Two one-dimensional representations, distinct for $n\\ge3$ and swapped by complex conjugation.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Corollary',
      name: 'Every representation of a finite group is unitary in some basis',
      statement: String.raw`Let $\rho\colon G\to GL_n(\mathbb C)$ be a representation of a finite group. There is an invertible matrix $T$ such that $T\rho(g)T^{-1}$ is unitary for every $g\in G$ (orthogonal, if everything is real). Equivalently, $\rho$ is equivalent to a representation into $U(n)$; so finite groups of matrices are, up to a change of basis, groups of rotations and reflections.`,
      idea: String.raw`Average the standard inner product (2.1) to a $G$-invariant one $\langle\cdot,\cdot\rangle_G$ with Gram matrix $B$, so $\rho(g)^*B\rho(g)=B$. Apply Gram–Schmidt for $\langle\cdot,\cdot\rangle_G$ to the standard basis: this gives a basis $F=(f_1,\dots,f_n)$ with $F^*BF=I$. In the basis $F$ the matrix of $\rho(g)$ is $F^{-1}\rho(g)F$, which preserves the standard inner product because $\rho(g)$ preserves $\langle\cdot,\cdot\rangle_G$; a matrix preserving the standard inner product is unitary.`,
      caption: String.raw`Choose a group in a skewed basis and drag the slider from the original coordinates ($t=0$) to the Gram–Schmidt coordinates of the averaged inner product ($t=1$). The coloured copies of the letter $F$ are the images of one $F$ under all the group matrices. At $t=1$ they form a symmetric rosette: every matrix is now a rotation or reflection, and the curve on the right, the largest deviation of $\rho(g)^{\mathsf T}\rho(g)$ from $I$, falls to $0$. The dashed ellipse is the averaged unit ball, which becomes round.`,
      deps: ['rep-2.1', 'ladr-6.32'],
      refs: ['Serre §1.3', 'Fulton–Harris §1.2'],
      tags: ['unitary', 'Gram–Schmidt', 'change of basis'],
      viz(v) {
        const GS = skewedGroups();
        const gs = v.select('group', [{ value: 'C3', label: '$\\mathbb Z/3$' }, { value: 'S3', label: '$S_3$' }, { value: 'D4', label: '$D_4$' }], 'S3');
        const kk = v.slider('skew of the given basis', 0, 1.6, 0.6, { step: 0.05 });
        const tt = v.slider('blend $t$: given basis → Gram–Schmidt basis', 0, 1, 0, { step: 0.01 });
        const A = v.stage({ x: [-2.5, 2.5], y: [-2.2, 2.2], equal: true, axes: true, height: 420, weight: 1.25, title: 'the group acting on one letter $F$' });
        const B = v.stage({ x: [0, 1], y: [0, 1.3], axes: 'box', gutter: true, height: 420, weight: 0.85, xlabel: 'blend $t$', ylabel: '$\\max_g\\|\\rho(g)^{\\mathsf T}\\rho(g)-I\\|$', title: 'distance from orthogonal' });
        const calc = (t) => {
          const { G, plain } = GS[gs.value], P = [[1, kk.value], [0.35 * kk.value, 1]], mats = conj(plain, P);
          const Bav = avgForm(G, mats, eye(2));
          // Gram–Schmidt of e1, e2 for the form Bav
          const ip = (a, b) => qf2(Bav, a, b), f1 = vsc([1, 0], 1 / Math.sqrt(ip([1, 0], [1, 0])));
          let f2 = vsub([0, 1], vsc(f1, ip(f1, [0, 1]))); f2 = vsc(f2, 1 / Math.sqrt(ip(f2, f2)));
          const Fm = [[f1[0], f2[0]], [f1[1], f2[1]]], Fi = inv(Fm);
          const T = madd(msc(eye(2), 1 - t), msc(Fi, t));
          const Ti = inv(T), rho = mats.map((M) => mm(T, mm(M, Ti)));
          return { G, mats, Bav, Fm, Fi, T, Ti, rho };
        };
        const qf2 = (B, a, b) => a[0] * (B[0][0] * b[0] + B[0][1] * b[1]) + a[1] * (B[1][0] * b[0] + B[1][1] * b[1]);
        const defect = (rho) => Math.max(...rho.map((M) => fro(msub(mm(tp(M), M), eye(2)))));
        const hc = A.handle(1.15, 0.2, { color: 'ink', label: 'c' });
        v.render(() => {
          const t = tt.value, { G, Bav, Fm, T, rho } = calc(t);
          A.path(ellipse(Bav, 1.0).map((p) => mv(T, p)), { color: 'green', width: 2.2, dash: [6, 4] });
          const c0 = [hc.x, hc.y], base = F_SHAPE.map((p) => vadd(vsc(p, 0.55), c0));
          rho.forEach((M, g) => A.poly(base.map((p) => mv(M, mv(T, p))), { color: ecol(g), fill: ecol(g), fillAlpha: 0.28, width: 1.4 }));
          const e1 = mv(T, [Fm[0][0], Fm[1][0]]), e2 = mv(T, [Fm[0][1], Fm[1][1]]);
          A.arrow(0, 0, e1[0], e1[1], { color: 'ink', width: 2.2 }); A.arrow(0, 0, e2[0], e2[1], { color: 'ink', width: 2.2 });
          A.tex('f_1', e1[0] + 0.1, e1[1] - 0.2, { size: 14 }); A.tex('f_2', e2[0] + 0.12, e2[1] + 0.05, { size: 14 });
          const pts = []; for (let k = 0; k <= 50; k++) { const s = k / 50; pts.push([s, defect(calc(s).rho)]); }
          B.setView([0, 1], [0, Math.max(1, pts[0][1] * 1.08)]); B.path(pts, { color: 'accent', width: 2.4 }); B.dot(t, defect(rho), { r: 7, color: 'accent', fill: 'accent' });
          B.hline(0, { color: 'green', width: 1.5 });
        });
        v.legend([['green', 'averaged unit ball', { dash: true }], ['ink', 'Gram–Schmidt basis $f_1,f_2$'], ['orange', 'copies of $F$ under $\\rho(g)$']]);
        v.readout(() => {
          const t = tt.value, { rho, mats } = calc(t), d0 = defect(mats), d = defect(rho), { G } = calc(t);
          const hom = homCheck(G, rho, 1e-8);
          const M1 = rho[1];
          return `$\\max_g\\|\\rho(g)^{\\mathsf T}\\rho(g)-I\\|$: given basis $${nm(d0, 3)}$, at blend $t=${nm(t, 2)}$: $${d < 1e-9 ? '0' : nm(d, 3)}$${d < 1e-9 ? ' — **all ' + G.n + ' matrices are orthogonal**' : ''}. Still a representation: $\\rho(gh)=\\rho(g)\\rho(h)$ on ${hom.pairs - hom.bad} of ${hom.pairs} pairs.\nExample: $\\rho(${G.L[1]})=${matN(M1, 3)}$ with $\\det=${nm(M1[0][0] * M1[1][1] - M1[0][1] * M1[1][0], 3)}$.`;
        });
      },
    },
// @@NEXT@@
  ],
};
