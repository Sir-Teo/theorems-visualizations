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
// @@NEXT@@
  ],
};
