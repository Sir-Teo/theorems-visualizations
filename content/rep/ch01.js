// Representation Theory — Chapter 1: Representations
// Part 1 (this file): 1.1–1.5 — linear representations, permutation and regular representations, one-dimensional
// representations of cyclic groups, intertwiners, invariant subspaces. Part 2 (ch01-b.js): 1.6–1.10.
// Shared machinery (groups as multiplication tables, matrices, verification): ch01.shared.js.
import { TAU, EC, ecol, nm, nmc, matT, matN, mm, mv, tp, eye, msub, madd, msc, fro, dot, len, unit, vsc, vadd, vsub, cross, inv, rot2, vec, unvec, polygon, permMat, dihedral, homCheck, drawMoved, F_SHAPE } from './ch01.shared.js';

export default {
  collection: 'rep',
  chapter: 1,
  title: 'Representations',
  summary: String.raw`A representation lets a group act by invertible matrices, so that symmetry becomes linear algebra. Permutation and regular representations come for free from any action, and the familiar operations of linear algebra — subspaces, direct sums, tensor products, duals — all have equivariant versions. Irreducible representations, those with no invariant subspaces, are the atoms from which the rest are built.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Linear representations',
      statement: String.raw`A **(linear) representation** of a group $G$ on a vector space $V$ over a field $k$ is a homomorphism $\rho\colon G\to GL(V)$ into the group of invertible linear maps of $V$. Concretely, to each $g\in G$ is attached an invertible matrix $\rho(g)$ (after choosing a basis; $n=\dim V$ is the **degree**) such that $\rho(gh)=\rho(g)\,\rho(h)$ for all $g,h\in G$. This forces $\rho(e)=I$ and $\rho(g^{-1})=\rho(g)^{-1}$. The representation is **faithful** when $\rho$ is injective.`,
      idea: String.raw`Matrices multiply by composing linear maps, and a group multiplies by composing symmetries; a representation is a dictionary that respects the two multiplications. For the symmetries of a polygon the dictionary is geometric: $\rho(g)$ is the linear map of the plane that carries the polygon to itself exactly as $g$ does, so $\rho(gh)=\rho(g)\rho(h)$ holds because "do $h$, then $g$" is the same motion as $gh$. Nothing about the other direction is automatic: an assignment of matrices to elements is a representation only if all $|G|^2$ products pass the test.`,
      caption: String.raw`Pick the symmetry group of the triangle or the square, then click any cell of the multiplication table: the dashed figure is moved by $\rho(h)$ (orange), then by $\rho(g)$ (blue); the green outline is $\rho(gh)$. Green cells are products where $\rho(gh)=\rho(g)\rho(h)$ holds numerically. Now turn the "tamper" slider: it rotates the single matrix $\rho(s)$ off the symmetry it should be, and every product that involves $s$ turns red.`,
      deps: ['pma-9.4', 'ladr-3.1'],
      refs: ['Serre §1.1', 'Fulton–Harris §1.1'],
      tags: ['representation', 'homomorphism'],
      credit: 'Frobenius, 1896–97 (group characters and representations); Burnside and Schur independently, 1897–1905',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Group_representation' },
      viz(v) {
        const GS = { D3: dihedral(3), D4: dihedral(4) };
        let sel = [1, 3];
        const gsel = v.select('symmetries of', [{ value: 'D3', label: 'triangle ($S_3$)' }, { value: 'D4', label: 'square ($D_4$)' }], 'D3', { onChange: () => { sel = gsel.value === 'D3' ? [1, 3] : [1, 4]; } });
        const tamper = v.slider('tamper with $\\rho(s)$ (degrees)', -90, 90, 0, { step: 1 });
        const sA = v.stage({ x: [-1.45, 1.45], y: [-1.38, 1.38], equal: true, axes: false, height: 380, weight: 1 });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.05 });
        const T = v.table(sB, { rows: 6, cols: 6, maxCell: 58, size: 13.5, margin: 6 });
        sB.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const mats = () => {
          const G = GS[gsel.value], M = G.mat.map((A) => A.map((r) => r.slice()));
          if (tamper.value) M[G.m] = mm(rot2((tamper.value * Math.PI) / 180), M[G.m]);
          return { G, M };
        };
        v.render(() => {
          const { G, M } = mats(), [g, h] = sel, gh = G.mul[g][h], n = G.n, chk = homCheck(G, M);
          const names = 'ABCDEFGH'.slice(0, G.m).split('');
          drawMoved(sA, eye(2), G.pos, { col: 'muted', dash: true, fill: false, F: true, fa: 0.04 });
          drawMoved(sA, M[h], G.pos, { col: 'orange', a: 0.06, fa: 0.2, width: 1.8 });
          drawMoved(sA, mm(M[g], M[h]), G.pos, { col: 'accent', names, a: 0.1, fa: 0.3 });
          drawMoved(sA, M[gh], G.pos, { col: 'green', fill: false, F: false, width: 3.2, dash: [7, 5] });
          sA.corner(`$g=${G.L[g]},\\ h=${G.L[h]},\\ gh=${G.L[gh]}$`, 'tl', { plate: true });
          T.draw({
            rows: n, cols: n, rowLabels: (i) => `$${G.L[i]}$`, colLabels: (j) => `$${G.L[j]}$`, cornerLabel: '$g\\backslash h$', size: 13.5, labelSize: 13,
            value: (i, j) => `$${G.L[G.mul[i][j]]}$`,
            fill: (i, j) => (chk.err[i][j] <= 1e-9 ? ['green', 0.22] : ['red', 0.5]),
            highlight: [[g, h, 'accent']],
          });
          sB.corner(`row $g$, column $h$: entry $gh$`, 'tl', { size: 11 });
        });
        v.legend([['muted', 'figure at rest', { dash: true }], ['orange', '$\\rho(h)$ applied'], ['accent', '$\\rho(g)\\rho(h)$ applied'], ['green', '$\\rho(gh)$', { dash: true }]]);
        v.readout(() => {
          const { G, M } = mats(), [g, h] = sel, gh = G.mul[g][h], chk = homCheck(G, M);
          const verdict = chk.bad === 0 && chk.idErr < 1e-9
            ? `**All ${chk.pairs} products pass:** $\\max\\|\\rho(gh)-\\rho(g)\\rho(h)\\|=${nm(chk.max, 1) === '0' ? '0' : v.sci(chk.max, 1)}$ — this is a representation of degree 2.`
            : `**${chk.bad} of ${chk.pairs} products fail** (red cells), $\\max\\|\\rho(gh)-\\rho(g)\\rho(h)\\|=${nm(chk.max, 2)}$ — these matrices are *not* a representation.`;
          return `$\\rho(${G.L[g]})=${matN(M[g])},\\ \\rho(${G.L[h]})=${matN(M[h])},\\ \\rho(${G.L[g]})\\rho(${G.L[h]})=${matN(mm(M[g], M[h]))}$ versus $\\rho(${G.L[gh]})=${matN(M[gh])}$\n${verdict}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Permutation and regular representations',
      statement: String.raw`Let a finite group $G$ act on a finite set $X$. The **permutation representation** on $V=k^{X}$ (basis $e_x$, $x\in X$) is $\rho(g)e_x=e_{g\cdot x}$; its matrices are permutation matrices, and $\rho(g)$ has trace equal to the number of points of $X$ fixed by $g$. Taking $X=G$ with $G$ acting on itself by left multiplication gives the **regular representation** $\rho_{\mathrm{reg}}$, of degree $|G|$, with basis $(e_s)_{s\in G}$ and $\rho(g)e_s=e_{gs}$.`,
      idea: String.raw`The formula $\rho(g)e_x=e_{g\cdot x}$ is a homomorphism because $(gh)\cdot x=g\cdot(h\cdot x)$ is exactly the axiom of an action: both sides of $\rho(gh)=\rho(g)\rho(h)$ send $e_x$ to the same basis vector. The convention matters. Letting $G$ act on itself from the right, $s\mapsto sg$, reverses products and gives an anti-homomorphism; the repair is $s\mapsto sg^{-1}$, which is isomorphic to the left action. Every finite group is therefore a group of permutation matrices (Cayley), and the regular representation will turn out to contain every irreducible one.`,
      caption: String.raw`Choose an action and click an element $g$: the beads slide along the arrows to their new slots and the permutation matrix on the right lights up one $1$ per column. The trace is the number of beads that stay put. For the regular representation, switch the convention to "right" and watch the pairs that do not commute fail $P(gh)=P(g)P(h)$ — then fix it with $x\mapsto xg^{-1}$.`,
      deps: ['rep-1.1'],
      refs: ['Serre §1.2'],
      tags: ['permutation representation', 'regular representation'],
      viz(v) {
        const D3 = dihedral(3), D4 = dihedral(4);
        const tri = polygon(3), sq = polygon(4);
        const P3 = [...tri.map((p) => vsc(p, 0.5)), ...tri.map((p) => vsc(p, 1.05))];
        const ACT = {
          beads: { G: D3, X: 3, pos: tri.map((p) => vsc(p, 0.9)), nm: ['1', '2', '3'], act: (g, x) => D3.perms[g][x], tex: 'S_3 on three beads' },
          reg: { G: D3, X: 6, pos: P3, nm: D3.L.map((l) => `$${l}$`), act: (g, x) => D3.mul[g][x], tex: 'S_3 on itself', regular: true },
          cos: { G: D3, X: 2, pos: [[-0.55, 0], [0.55, 0]], nm: ['$C_3$', '$sC_3$'], act: (g, x) => x ^ (D3.isRef(g) ? 1 : 0), tex: 'S_3 on the cosets of $C_3$' },
          vert: { G: D4, X: 4, pos: sq.map((p) => vsc(p, 0.9)), nm: ['1', '2', '3', '4'], act: (g, x) => D4.perms[g][x], tex: 'D_4 on four corners' },
          diag: { G: D4, X: 2, pos: [[-0.55, 0], [0.55, 0]], nm: ['AC', 'BD'], act: (g, x) => D4.perms[g][x] % 2, tex: 'D_4 on the two diagonals' },
        };
        const key = v.select('action', [{ value: 'beads', label: '$S_3$ on 3 beads' }, { value: 'reg', label: '$S_3$ on itself (regular)' }, { value: 'cos', label: '$S_3$ on 2 cosets' }, { value: 'vert', label: '$D_4$ on 4 corners' }, { value: 'diag', label: '$D_4$ on 2 diagonals' }], 'beads', { onChange: () => sync() });
        const g3 = v.select('element $g$', D3.L.map((l, i) => ({ value: i, label: `$${l}$` })), 1);
        const g4 = v.select('element $g$', D4.L.map((l, i) => ({ value: i, label: `$${l}$` })), 1);
        const conv = v.select('convention', [{ value: 'L', label: '$x\\mapsto gx$' }, { value: 'R', label: '$x\\mapsto xg$ (wrong)' }, { value: 'Ri', label: '$x\\mapsto xg^{-1}$' }], 'L');
        const sync = () => { const a = ACT[key.value]; g3.el.hidden = a.G !== D3; g4.el.hidden = a.G !== D4; conv.el.hidden = !a.regular; };
        sync();
        const sA = v.stage({ x: [-1.4, 1.4], y: [-1.3, 1.3], equal: true, axes: false, height: 380, weight: 1 });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1 });
        const T = v.table(sB, { rows: 3, cols: 3, maxCell: 62, size: 16, margin: 8 });
        const cur = () => {
          const a = ACT[key.value], G = a.G, g = a.G === D3 ? g3.value : g4.value;
          const act = a.regular && conv.value !== 'L' ? (gg, x) => (conv.value === 'R' ? G.mul[x][gg] : G.mul[x][G.inv[gg]]) : a.act;
          const mats = G.perms.map((_, gg) => Array.from({ length: a.X }, (_, i) => Array.from({ length: a.X }, (_, j) => +(act(gg, j) === i))));
          return { a, G, g, act, mats };
        };
        v.render(() => {
          const { a, G, g, act, mats } = cur(), X = a.X, N = a.nm;
          const lab = (x) => N[x];
          for (let x = 0; x < X; x++) sA.dot(...a.pos[x], { r: X > 4 ? 14 : 20, hollow: true, color: 'faint' });
          for (let x = 0; x < X; x++) {
            const y = act(g, x), p = a.pos[x], q = a.pos[y];
            if (y === x) { sA.circle(p[0], p[1] + 0.0, X > 4 ? 0.21 : 0.3, { color: ecol(x), width: 1.4, alpha: 0.55 }); continue; }
            const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d) || 1, nrm = [-d[1] / L, d[0] / L], off = 0.07, r0 = X > 4 ? 0.17 : 0.24;
            sA.arrow(p[0] + (d[0] / L) * r0 + nrm[0] * off, p[1] + (d[1] / L) * r0 + nrm[1] * off, q[0] - (d[0] / L) * r0 + nrm[0] * off, q[1] - (d[1] / L) * r0 + nrm[1] * off, { color: ecol(x), width: 2, head: 8 });
          }
          for (let x = 0; x < X; x++) {
            const q = a.pos[act(g, x)];
            sA.dot(q[0], q[1], { r: X > 4 ? 12 : 17, color: ecol(x), fill: ecol(x) });
            sA.text(lab(x), q[0], q[1], { align: 'center', baseline: 'middle', size: X > 4 ? 11 : 15, weight: 700, color: 'panel' });
          }
          sA.corner(`$g=${G.L[g]}$ sends the bead in slot $x$ to slot $g\\cdot x$`, 'tl', { plate: true, size: 12 });
          T.draw({
            rows: X, cols: X, rowLabels: (i) => N[i], colLabels: (j) => N[j], cornerLabel: '', size: 16,
            value: (i, j) => (mats[g][i][j] ? '1' : null), fill: (i, j) => (mats[g][i][j] ? [ecol(j), 0.4] : null), textColor: () => 'ink', labelSize: X > 4 ? 11 : 13,
          });
          sB.corner(`matrix $P(${G.L[g]})$: column $x$ has its $1$ in row $g\\cdot x$`, 'tl', { size: 12 });
        });
        v.legend([['muted', 'slots (the set $X$)', { dot: true }], ['accent', 'bead $x$ moves to slot $g\\cdot x$']]);
        v.readout(() => {
          const { a, G, g, mats } = cur(), chk = homCheck(G, mats);
          const fixed = mats[g].reduce((s, r, i) => s + r[i], 0);
          const verdict = chk.bad === 0
            ? `**Homomorphism:** $P(gh)=P(g)P(h)$ for all ${chk.pairs} pairs.`
            : `**Not a homomorphism:** $P(gh)\\ne P(g)P(h)$ for ${chk.bad} of ${chk.pairs} pairs (it reverses products: an anti-homomorphism).`;
          return `$\\operatorname{tr}P(${G.L[g]})=${fixed}$ fixed point${fixed === 1 ? '' : 's'} · degree $|X|=${a.X}$ · $P(e)=I$: ${chk.idErr < 1e-9 ? 'yes' : 'no'}\n${verdict}${a.regular ? ` Total of the regular representation's degree: $|G|=${G.n}$.` : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'One-dimensional representations of cyclic groups',
      statement: String.raw`Let $G=\langle g\rangle$ be cyclic of order $n$. A one-dimensional representation over $\mathbb C$ is a homomorphism $\rho\colon G\to\mathbb C^{\times}$, and it is determined by $z=\rho(g)$, which must satisfy $z^{n}=1$. Conversely each $n$-th root of unity $z=\zeta^{k}$, $\zeta=e^{2\pi i/n}$, gives one: $\rho_k(g^{j})=\zeta^{kj}$. So $\mathbb Z/n$ has exactly $n$ one-dimensional representations $\rho_0,\dots,\rho_{n-1}$; $\rho_k$ is faithful iff $\gcd(k,n)=1$, and its kernel has $\gcd(k,n)$ elements.`,
      idea: String.raw`A homomorphism out of a cyclic group is free on the generator, up to the one relation $g^{n}=e$: that relation must be respected, which says $\rho(g)^{n}=\rho(e)=1$. There is no other constraint, and the solutions of $z^{n}=1$ are the $n$ points $\zeta^{k}$ spaced evenly on the unit circle. The powers $z^{j}$ then march round the circle in steps of $2\pi k/n$, visiting a regular polygon or star, and return to $1$ after $n/\gcd(k,n)$ steps.`,
      caption: String.raw`Choose $n$ and $k$, or drag $z=\rho(g)$ yourself (with "snap" on it jumps between the $n$-th roots of unity). The gold polygon is the orbit of $\rho(g^{j})=z^{j}$. Switch snapping off and pull $z$ off the circle or between roots: the powers spiral past $1$, $z^{n}\ne 1$, and the readout shows $\rho$ is no longer a homomorphism. On the right, the table of all $n$ characters: entry $(k,j)$ is the phase $\zeta^{kj}$.`,
      deps: ['rep-1.1'],
      refs: ['Serre §1.2', 'Serre §5.1'],
      tags: ['cyclic group', 'roots of unity'],
      viz(v) {
        const N = v.slider('$n$', 2, 12, 6, { int: true, onChange: () => place() });
        const K = v.slider('$k$', 0, 11, 1, { int: true, onChange: () => place() });
        const snap = v.toggle('snap to roots of unity', true, { onChange: () => place() });
        const s = v.stage({ x: [-1.55, 1.55], y: [-1.5, 1.5], equal: true, axes: false, height: 360, weight: 1 });
        const t = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1 });
        const T = v.table(t, { rows: 6, cols: 6, maxCell: 34, size: 11, margin: 8 });
        const kk = () => Math.min(K.value, N.value - 1);
        const root = (k, n) => [Math.cos((TAU * k) / n), Math.sin((TAU * k) / n)];
        const snapTo = (x, y) => { const n = N.value; const k = ((Math.round((Math.atan2(y, x) / TAU) * n) % n) + n) % n; return root(k, n); };
        const hz = s.handle(...root(1, 6), { color: 'gold', r: 8, label: 'z', constrain: (x, y) => (snap.value ? snapTo(x, y) : (() => { const r = Math.hypot(x, y); return r > 1.35 ? [(x * 1.35) / r, (y * 1.35) / r] : [x, y]; })()) });
        function place() { hz.set(...root(kk(), N.value)); }
        t.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0) { K.set(c.i); place(); } });
        const cpow = (z, j) => { const r = Math.hypot(...z), a = Math.atan2(z[1], z[0]); return [r ** j * Math.cos(a * j), r ** j * Math.sin(a * j)]; };
        const cmulz = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
        const state = () => {
          const n = N.value, z = [hz.x, hz.y], pw = Array.from({ length: n + 1 }, (_, j) => cpow(z, j));
          let max = 0;
          for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { const l = pw[(a + b) % n], r = cmulz(pw[a], pw[b]); max = Math.max(max, Math.hypot(l[0] - r[0], l[1] - r[1])); }
          return { n, z, pw, max, ok: max < 1e-9 };
        };
        v.render(() => {
          const { n, z, pw, ok } = state();
          s.circle(0, 0, 1, { color: 'grid', width: 1.5 });
          for (let k = 0; k < n; k++) { const [x, y] = root(k, n); s.dot(x, y, { r: 5, hollow: true, color: 'muted' }); }
          s.dot(1, 0, { r: 6, color: 'green' }); s.text('1', 1.12, -0.12, { size: 12, color: 'green', weight: 700 });
          s.path(pw.slice(0, ok ? n + 1 : n + 1), { color: 'gold', width: 2, alpha: 0.85 });
          pw.slice(0, n).forEach((p, j) => { s.dot(p[0], p[1], { r: 4.5, color: ecol(j) }); if (j >= 2 && n <= 8) s.tex(`z^{${j}}`, p[0] * 1.18 + (j === 0 ? 0 : 0), p[1] * 1.18, { size: 12, color: 'muted' }); });
          if (!ok) { const p = pw[n]; s.dot(p[0], p[1], { r: 6, color: 'red', hollow: true }); s.tex(`z^{${n}}`, p[0] + 0.12, p[1] - 0.14, { color: 'red', size: 13 }); }
          s.corner(snap.value ? '$z=\\zeta^{k}$' : 'free $z$', 'tl', { plate: true });
          T.draw({
            rows: n, cols: n, rowLabels: (i) => String(i), colLabels: (j) => String(j), cornerLabel: '$k\\backslash j$', size: 10.5, labelSize: 11.5,
            value: (i, j) => String((i * j) % n),
            fill: (i, j) => v.M.hsl2rgb(((i * j) % n) / n, 0.62, 0.62),
            activeRow: kk(), highlight: [],
          });
          t.corner('entry $(k,j)$: exponent $kj \\bmod n$ of $\\zeta$, coloured by phase', 'tl', { size: 11 });
        });
        v.legend([['gold', 'orbit $z^{j}$'], ['muted', '$n$-th roots of unity', { dot: true }]]);
        v.readout(() => {
          const { n, z, pw, max, ok } = state(), k = kk();
          const gc = (a, b) => (b ? gc(b, a % b) : a);
          if (ok) {
            const ord = n / gc(k, n) | 0;
            return `$\\rho(g)=z=e^{2\\pi i\\,${k}/${n}}$: ${snap.value ? '' : '(close to a root) '}checked all $${n}^2$ products $\\rho(g^{a+b})=\\rho(g^a)\\rho(g^b)$, max error $${nm(max, 1) === '0' ? '0' : v.sci(max, 1)}$ · $z$ has order $${ord}$, kernel of size $\\gcd(${k},${n})=${gc(k, n) || n}$, ${gc(k, n) === 1 ? '**faithful**' : 'not faithful'}.\nThere are exactly $n=${n}$ such homomorphisms (the table's ${n} rows).`;
          }
          const zn = pw[n];
          return `**Not a homomorphism.** $z^{${n}}=${nm(zn[0], 3)}${zn[1] < 0 ? '-' : '+'}${nm(Math.abs(zn[1]), 3)}i\\ne 1=\\rho(g^{${n}})$, so $\\rho(g^{a+b})\\ne\\rho(g^a)\\rho(g^b)$ whenever $a+b\\ge n$ (max error $${nm(max, 3)}$). A homomorphism from $\\mathbb Z/${n}$ needs $z^{${n}}=1$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Intertwiners and isomorphic representations',
      statement: String.raw`Let $\rho\colon G\to GL(V)$ and $\sigma\colon G\to GL(W)$ be representations. A linear map $T\colon V\to W$ is **$G$-equivariant** (an **intertwiner**, a morphism of representations) if $T\rho(g)=\sigma(g)T$ for all $g\in G$. The intertwiners form a vector space $\operatorname{Hom}_G(V,W)$. The representations are **isomorphic**, $\rho\cong\sigma$, if some intertwiner is invertible; in matrices this says $\sigma(g)=T\rho(g)T^{-1}$ for all $g$, i.e. the two families differ by one change of basis.`,
      idea: String.raw`Equivariance is the statement that the square $V\to V\to W$ and $V\to W\to W$ commutes for every $g$: transporting a vector along $T$ and then acting is the same as acting and then transporting. It is a system of linear equations in the entries of $T$, so $\operatorname{Hom}_G(V,W)$ is the null space of a matrix and can be computed. Isomorphic representations are the same representation seen in different bases, which is why characters, not matrices, will be the right invariants.`,
      caption: String.raw`$\rho$ is the rotation of the plane by $120^\circ$ ($\mathbb Z/3$). Choose a second representation $\sigma$; for "skewed copy" drag the two basis vectors $b_1,b_2$ of the target. The solver finds all $T$ with $T\rho=\sigma T$ (the readout gives their dimension). Drag the gold handle $w=T(e_1)$ and $T$ follows; the blue and orange dots in the target coincide, which is the commuting square. Add noise with the slider and they separate.`,
      deps: ['rep-1.1'],
      refs: ['Fulton–Harris §1.1'],
      tags: ['intertwiner', 'isomorphism'],
      viz(v) {
        const R = rot2((2 * Math.PI) / 3), rhoPow = (j) => (j === 0 ? eye(2) : j === 1 ? R : mm(R, R));
        const which = v.select('$\\sigma$', [{ value: 'skew', label: 'skewed copy of $\\rho$' }, { value: 'conj', label: 'rotation the other way' }, { value: 'triv', label: 'trivial $\\oplus$ trivial' }], 'skew');
        const gsel = v.select('element', [{ value: 0, label: '$e$' }, { value: 1, label: '$g$' }, { value: 2, label: '$g^2$' }], 1);
        const eps = v.slider('noise added to $T$', 0, 1, 0, { step: 0.01 });
        const sA = v.stage({ x: [-1.9, 1.9], y: [-1.75, 1.75], equal: true, axes: false, height: 350, weight: 1, title: 'V with $\\rho$' });
        const sB = v.stage({ x: [-2.4, 2.4], y: [-2.2, 2.2], equal: true, axes: false, height: 350, weight: 1, title: 'W with $\\sigma$' });
        const x0 = sA.handle(1.1, 0.35, { color: 'gold', label: 'x' });
        const b1 = sB.handle(1.0, 0.3, { color: 'purple', label: 'b₁' }), b2 = sB.handle(-0.35, 0.9, { color: 'purple', label: 'b₂' });
        const w = sB.handle(1.5, 0.6, { color: 'gold', r: 8, label: 'w' });
        let lastB = [[1, -0.35], [0.3, 0.9]];
        const sigma = () => {
          if (which.value === 'conj') return [0, 1, 2].map((j) => rhoPow((3 - j) % 3));
          if (which.value === 'triv') return [0, 1, 2].map(() => eye(2));
          let B = [[b1.x, b2.x], [b1.y, b2.y]], Bi = inv(B);
          if (!Bi || Math.abs(B[0][0] * B[1][1] - B[0][1] * B[1][0]) < 0.12) B = lastB; else lastB = B;
          const Bj = inv(B); return [0, 1, 2].map((j) => mm(mm(B, rhoPow(j)), Bj));
        };
        const solve = () => {
          const S = sigma(), rows = [];
          for (let j = 1; j < 3; j++) { // (I⊗ρᵀ − σ⊗I) t = 0 for row-major vec(T)
            const A1 = tp(rhoPow(j)), S1 = S[j], K = Array.from({ length: 4 }, () => Array(4).fill(0));
            for (let i = 0; i < 2; i++) for (let b = 0; b < 2; b++) for (let a = 0; a < 2; a++) for (let k = 0; k < 2; k++) {
              K[i * 2 + b][a * 2 + k] = (a === i ? A1[b][k] : 0) - (k === b ? S1[i][a] : 0);
            }
            rows.push(...K);
          }
          const N = v.M.nullspace(rows, 1e-9).map((t) => unvec(t, 2, 2));
          let T = [[0, 0], [0, 0]];
          if (N.length === 2) {
            const c = v.M.solve([[N[0][0][0], N[1][0][0]], [N[0][1][0], N[1][1][0]]], [w.x, w.y]);
            T = madd(msc(N[0], c[0]), msc(N[1], c[1]));
          }
          return { S, d: N.length, T };
        };
        v.render(() => {
          const { S, d, T } = solve(), g = gsel.value, skew = which.value === 'skew';
          b1.visible = skew; b2.visible = skew; w.visible = d === 2;
          const Tn = madd(T, msc([[0, 1], [1, 0.4]], eps.value));
          // domain
          sA.circle(0, 0, 1.2, { color: 'grid', width: 1, dash: true });
          const x = [x0.x, x0.y], rx = mv(rhoPow(g), x);
          [0, 1, 2].forEach((j) => { const p = mv(rhoPow(j), x); sA.dot(p[0], p[1], { r: 4, color: 'faint' }); });
          sA.poly(F_SHAPE.map((p) => mv(rhoPow(g), vsc(p, 0.5))), { color: 'accent', fill: 'accent', fillAlpha: 0.12, width: 1.6 });
          sA.arrow(0, 0, x[0], x[1], { color: 'gold', width: 2.2 }); sA.arrow(0, 0, rx[0], rx[1], { color: 'accent', width: 2.2 });
          sA.tex('\\rho(g)x', rx[0] * 1.15 + 0.05, rx[1] * 1.15 + 0.05, { color: 'accent', size: 13 });
          // target
          if (skew) { sB.poly([[0, 0], [b1.x, b1.y], [b1.x + b2.x, b1.y + b2.y], [b2.x, b2.y]], { color: 'purple', fill: 'purple', fillAlpha: 0.07, width: 1.2 }); }
          const Tx = mv(Tn, x), TRx = mv(Tn, rx), STx = mv(S[g], Tx);
          [0, 1, 2].forEach((j) => { const p = mv(S[j], Tx); sB.dot(p[0], p[1], { r: 4, color: 'faint' }); });
          sB.poly(F_SHAPE.map((p) => mv(mm(S[g], Tn), vsc(p, 0.5))), { color: 'orange', fill: 'orange', fillAlpha: 0.1, width: 1.6, dash: [5, 4] });
          sB.poly(F_SHAPE.map((p) => mv(mm(Tn, rhoPow(g)), vsc(p, 0.5))), { color: 'accent', fill: 'accent', fillAlpha: 0.12, width: 1.6 });
          sB.arrow(0, 0, Tx[0], Tx[1], { color: 'gold', width: 2.2 });
          sB.dot(TRx[0], TRx[1], { r: 7, color: 'accent' }); sB.dot(STx[0], STx[1], { r: 11, hollow: true, color: 'orange' });
          sB.tex('T\\rho(g)x', TRx[0] + 0.15, TRx[1] + 0.2, { color: 'accent', size: 13 }); sB.tex('\\sigma(g)Tx', STx[0] + 0.15, STx[1] - 0.25, { color: 'orange', size: 13 });
        });
        v.legend([['gold', '$x$ and $Tx$'], ['accent', '$\\rho(g)$ then $T$'], ['orange', '$T$ then $\\sigma(g)$', { dot: true }]]);
        v.readout(() => {
          const { S, d, T } = solve(), Tn = madd(T, msc([[0, 1], [1, 0.4]], eps.value));
          let e = 0; for (let j = 0; j < 3; j++) e = Math.max(e, fro(msub(mm(Tn, rhoPow(j)), mm(S[j], Tn))));
          const det = Tn[0][0] * Tn[1][1] - Tn[0][1] * Tn[1][0];
          const pre = `$\\dim\\operatorname{Hom}_G(V,W)=${d}$ (null space of $T\\rho(g)-\\sigma(g)T=0$). `;
          if (d === 0) return `${pre}Only $T=0$ is equivariant: no non-zero intertwiner exists, so $\\rho\\not\\cong\\sigma$ (the images of $x$ collapse to the origin).`;
          return `${pre}$\\max_g\\|T\\rho(g)-\\sigma(g)T\\|=${e < 1e-9 ? '0' : nm(e, 3)}$ over all 3 elements · $\\det T=${nm(det, 3)}$ ${e < 1e-9 && Math.abs(det) > 1e-6 ? '$\\ne0$: **invertible intertwiner, so $\\rho\\cong\\sigma$**' : e >= 1e-9 ? '— with noise $T$ is not equivariant' : ''}${det < -1e-6 && e < 1e-9 ? ' ($\\det<0$: the isomorphism flips orientation)' : ''}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Subrepresentations and invariant subspaces',
      statement: String.raw`Let $\rho\colon G\to GL(V)$ be a representation. A subspace $W\subseteq V$ is **$G$-invariant** (stable) if $\rho(g)W\subseteq W$ for all $g\in G$. Then $\rho$ restricts to a representation $\rho_W\colon G\to GL(W)$, a **subrepresentation**, and also acts on the quotient $V/W$. In matrix terms, in a basis starting with a basis of $W$, all the matrices $\rho(g)$ are block upper-triangular.`,
      idea: String.raw`Invariance is a closure condition: the image of $W$ under each of finitely many matrices must land back inside $W$. For $S_3$ permuting the coordinates of $\mathbb R^3$, the line spanned by $(1,1,1)$ is fixed pointwise, and the plane $x+y+z=0$ is carried to itself because a permutation does not change the sum of the coordinates. A random subspace has no reason to survive and is moved by some permutation. Because these matrices are orthogonal, the orthogonal complement of an invariant subspace is again invariant, which is why the plane and the line appear together.`,
      caption: String.raw`$S_3$ permutes the coordinates of $\mathbb R^3$ (the triangle $e_1e_2e_3$ is permuted). Drag the orange handle to choose a line, or switch to planes (the handle is then the plane's normal). The coloured arrows are the six images of the candidate under the group; the bars show how far each image is from $W$. Only two choices — the line through $(1,1,1)$ and the plane $x+y+z=0$ — make all six bars vanish. The buttons snap to them.`,
      deps: ['rep-1.1'],
      refs: ['Serre §1.3'],
      tags: ['invariant subspace', 'subrepresentation'],
      viz(v) {
        const G = dihedral(3), mats = G.perms.map(permMat), names = ['e', 'r', 'r²', 's', 'sr', 'sr²'];
        const kind = v.select('candidate $W$', [{ value: 'line', label: 'a line' }, { value: 'plane', label: 'a plane (via normal)' }], 'line');
        const ref = v.toggle('show the invariant ones', true);
        const S = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 400, weight: 1.4 });
        const sc = v.scene3(S, { yaw: -0.75, pitch: 0.38, axis: 1.45, lim: 1.4, labels: ['x', 'y', 'z'] });
        const B = v.stage({ x: [0.35, 6.65], y: [0, 1.05], axes: 'box', gutter: true, height: 400, weight: 0.8, ylabel: 'distance of $gW$ from $W$', xticks: names.map((n, i) => [i + 1, n]), title: 'defect of each $g\\in S_3$' });
        const norm = (p) => vsc(unit(p), 1.15);
        const H = sc.handle(norm([0.9, 0.35, -0.55]), { color: 'orange', r: 8, label: 'd', snap: norm });
        const snapTo = (p) => { H.set(vsc(unit(p), 1.15)); };
        v.button('snap to $(1,1,1)$', () => snapTo([1, 1, 1]));
        v.button('snap to $x+y+z=0$', () => { kind.set('plane'); snapTo([1, 1, 1]); });
        v.button('generic', () => snapTo([0.9, 0.35, -0.55]));
        const basisOf = (n) => { const a = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0], b1 = unit(cross(n, a)), b2 = cross(n, b1); return [b1, b2]; };
        const defects = () => {
          const d = unit(H.p);
          return G.perms.map((_, g) => {
            const M = mats[g];
            if (kind.value === 'line') { const w = mv(M, d), c = Math.abs(dot(w, d)) / len(w); return Math.sqrt(Math.max(0, 1 - Math.min(1, c * c))); }
            const [b1, b2] = basisOf(d); let m = 0;
            for (const b of [b1, b2]) { const w = mv(M, b); m = Math.max(m, Math.abs(dot(w, d))); }
            return m;
          });
        };
        v.render(() => {
          const d = unit(H.p), df = defects(), ok = Math.max(...df) < 1e-6;
          sc.begin();
          const e = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], u = (p, s = 1) => vsc(p, s);
          sc.poly(e, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 1.4 });
          e.forEach((p, i) => { sc.dot(p, { r: 4, color: 'blue' }); sc.tex(`e_${i + 1}`, vadd(vsc(p, 1.12), [0.08, 0.08, 0.1]), { color: 'blue', size: 13 }); });
          if (ref.value) {
            sc.disc(unit([1, -1, 0]), unit([1, 1, -2]), 1.15, { fill: 'green', fillAlpha: 0.09, color: 'green', width: 1.2 });
            sc.line(u([1, 1, 1], -0.75), u([1, 1, 1], 0.75), { color: 'green', width: 2.2 }, 6);
          }
          if (kind.value === 'line') {
            sc.line(u(d, -1.25), u(d, 1.25), { color: 'orange', width: 2.8 }, 6);
            G.perms.forEach((p, g) => sc.arrow([0, 0, 0], vsc(mv(mats[g], d), 1.0), { color: ecol(g), width: 1.8, head: 7 }));
          } else {
            const [b1, b2] = basisOf(d);
            sc.disc(b1, b2, 1.0, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 2 });
            G.perms.forEach((p, g) => { const n2 = mv(mats[g], d); sc.arrow([0, 0, 0], vsc(n2, 1.0), { color: ecol(g), width: 1.8, head: 7 }); if (g) { const [c1, c2] = basisOf(n2); sc.disc(c1, c2, 0.9, { fill: ecol(g), fillAlpha: 0.04, color: ecol(g), width: 1 }); } });
          }
          sc.arrow([0, 0, 0], vsc(d, 1.15), { color: 'orange', width: 3 });
          sc.flush();
          B.bars(df, { x0: 1, color: (val, i) => (val < 1e-6 ? 'green' : ecol(i)) });
          B.hline(0, { color: 'faint' });
          B.corner(ok ? 'all zero: invariant' : `largest ${nm(Math.max(...df), 2)}`, 'tr', { size: 12, color: ok ? 'green' : 'red', weight: 700 });
        });
        v.legend([['orange', 'candidate $W$'], ['green', 'invariant line / plane'], ['blue', 'permuted triangle']]);
        v.readout(() => {
          const d = unit(H.p), df = defects(), mx = Math.max(...df), ok = mx < 1e-6;
          const what = kind.value === 'line' ? `line $\\mathbb R\\,(${d.map((x) => nm(x, 2)).join(',\\,')})$` : `plane with normal $(${d.map((x) => nm(x, 2)).join(',\\,')})$`;
          return `The ${what}: $\\max_{g}\\operatorname{dist}(\\rho(g)W,W)=${ok ? '0' : nm(mx, 3)}$ over the 6 elements → ${ok ? '**invariant**: $\\rho(g)W\\subseteq W$ for all $g$, so $W$ is a subrepresentation.' : `**not invariant**: $${G.L[df.indexOf(mx)]}$ moves $W$ out of itself.`}`;
        });
      },
    },
  ],
};
