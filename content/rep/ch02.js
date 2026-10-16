// Representation Theory — Chapter 2: Complete reducibility and Schur’s lemma
import { TAU, EC, ecol, nm, nmc, matT, matN, mm, mv, tp, eye, msub, madd, msc, fro, dot, len, unit, vsc, vadd, vsub, cross, inv, rot2, dihedral, cyclic, permMat, homCheck, F_SHAPE, SKEW2, conj, avgConj, avgForm, formDefect, eig2, ellipse, sqrt2, qf, zero, dsum } from './ch02.shared.js';

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
      credit: 'Hurwitz (1897) averaged over compact groups; the finite-group form is due to Maschke (1899) and Frobenius–Schur',
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
      credit: 'Maschke, 1899 (finite groups of matrices over $\\mathbb C$); the modular case $p\\nmid|G|$ is due to Dickson (1902) and Maschke',
      viz(v) {
        const G = dihedral(3), Pm = [[1, 0.5, 0.2], [0, 1, 0.4], [0.3, 0, 1]], Pi = inv(Pm);
        const mats = G.perms.map((p) => mm(Pm, mm(permMat(p), Pi)));
        const w = mv(Pm, [1, 1, 1]), m = mv(tp(Pi), [1, 1, 1]); // W-line direction, W-plane normal
        const nrm = (a) => vsc(a, 1 / len(a));
        const wsel = v.select('invariant subspace $W$', [{ value: 'line', label: 'line of constants' }, { value: 'plane', label: 'plane of sum 0' }], 'line', { onChange: () => reset() });
        const avg = v.toggle('average (Maschke)', true);
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.8, 1.9], equal: true, axes: false, height: 420 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.4, axis: 1.6, lim: 1.5, labels: ['x', 'y', 'z'] });
        const h = sc.handle(vsc(nrm(w), 1.1), { color: 'red', r: 8, label: 'h' });
        const reset = () => h.set(vsc(nrm(wsel.value === 'line' ? w : m), 1.1));
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
          const col = (k) => (k === 0 ? 'green' : EC[(k + 1) % 8 === 2 ? 3 : (k + 1) % 8]);
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
          B.text(`lines: $x$-axis (0), $y(1,\\ell)$ ...`, 0, 0, { color: 'panel', size: 1 });
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
          const sq = pi0 ? mm(sum, sum).map((r) => r.map((x) => mod(x, p))) : null;
          return `Invariant lines of the shear: **${fixed}** of the ${p + 1} (only the $x$-axis). A complement of $W=x$-axis would have to be a different invariant line, so none exists: $\\mathbb F_p^2$ is not $W\\oplus U$.\n${pi0 ? `Projection along line ${l === p ? '$y$' : l} (mod $${p}$): $\\pi_0=${msum(pi0)}$; the group sum $\\sum_g\\rho(g)\\pi_0\\rho(g)^{-1}=${msum(sum)}$ ${sum[0][0] === 0 ? '$=p\\cdot\\pi$ has a zero diagonal — dividing by $|G|=p\\equiv0$ is impossible, and the sum is not a projection onto $W$' : ''}.` : 'Select a line other than the $x$-axis to see the failed averaging.'}`;
        });
      },
    },
// @@NEXT@@
  ],
};
