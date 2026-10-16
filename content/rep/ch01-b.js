// Representation Theory — Chapter 1: Representations
// Part 2 (this file): 1.6–1.10 — irreducible representations, direct sums, tensor products / duals / Hom,
// symmetric and alternating squares, dihedral groups acting on functions on a polygon.
import { TAU, EC, ecol, nm, nmc, matT, matN, mm, mv, tp, eye, msub, madd, msc, fro, trace, dot, len, unit, vsc, vadd, vsub, cross, inv, rot2, kron, vec, unvec, polygon, permMat, dihedral, homCheck, s3reps, dualMats, tensorMats, F_SHAPE } from './ch01.shared.js';

export default {
  collection: 'rep',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Irreducible representations',
      statement: String.raw`A nonzero representation $V$ of $G$ is **irreducible** (simple) if its only $G$-invariant subspaces are $0$ and $V$; otherwise it is **reducible**. Every one-dimensional representation is irreducible. Irreducibility depends on the field: a real representation may be irreducible over $\mathbb R$ yet split over $\mathbb C$. Irreducible representations are the building blocks: every finite-dimensional representation has a composition series whose factors are irreducible.`,
      idea: String.raw`Testing irreducibility means searching all subspaces for invariant ones. For a plane representation the candidates are lines, a one-parameter family: a line is invariant iff it is an eigenvector line of every $\rho(g)$ simultaneously, so for $S_3$ acting on the plane by symmetries of a triangle the rotations by $120^\circ$ already have no real eigenvector. In $\mathbb R^3$ the candidates are lines and planes; a plane is invariant iff its normal line is invariant under the dual action $\rho(g)^{-\mathsf T}$, so one search through directions handles both. For the permutation representation exactly one direction, $(1,1,1)$, survives.`,
      caption: String.raw`Pick a representation. For a plane, drag the handle around the circle: the orange line is the candidate and the coloured segments are its images under the group; the curve shows the largest defect (the sine of the angle by which some image misses the line) for every direction. A representation is reducible exactly when the curve touches $0$. For $3$-dimensional ones the whole sphere of directions is a heat map: dark means nearly invariant. Switch between searching lines and planes.`,
      deps: ['rep-1.5'],
      refs: ['Serre §1.4'],
      tags: ['irreducible', 'invariant subspace'],
      viz(v) {
        const D3 = dihedral(3), D4 = dihedral(4), c120 = rot2(TAU / 3);
        const RE = {
          std: { name: 'S₃ on the plane of the triangle', dim: 2, mats: D3.mat },
          d4: { name: 'D₄ on the plane of the square', dim: 2, mats: D4.mat },
          rot4: { name: 'ℤ/4 by quarter turns', dim: 2, mats: [0, 1, 2, 3].map((k) => rot2((k * TAU) / 4)) },
          klein: { name: 'sign changes of x and y', dim: 2, mats: [[[1, 0], [0, 1]], [[-1, 0], [0, 1]], [[1, 0], [0, -1]], [[-1, 0], [0, -1]]] },
          perm: { name: 'S₃ permuting coordinates of ℝ³', dim: 3, mats: D3.perms.map(permMat) },
          spin: { name: 'ℤ/3 turning ℝ³ about the z-axis', dim: 3, mats: [0, 1, 2].map((k) => { const R = rot2((k * TAU) / 3); return [[R[0][0], R[0][1], 0], [R[1][0], R[1][1], 0], [0, 0, 1]]; }) },
        };
        for (const r of Object.values(RE)) r.dual = r.mats.map((M) => tp(inv(M)));
        const sel = v.select('representation', [{ value: 'std', label: '$S_3$, plane' }, { value: 'd4', label: '$D_4$, plane' }, { value: 'rot4', label: '$\\mathbb Z/4$ quarter turns' }, { value: 'klein', label: 'sign changes' }, { value: 'perm', label: '$S_3$ on $\\mathbb R^3$' }, { value: 'spin', label: '$\\mathbb Z/3$ on $\\mathbb R^3$' }], 'std');
        const what = v.select('search for invariant', [{ value: 'lines', label: 'lines' }, { value: 'planes', label: 'planes (normal lines)' }], 'lines');
        const sA = v.stage({ x: [-1.35, 1.35], y: [-1.3, 1.3], equal: true, axes: false, height: 380, weight: 1 });
        const sB = v.stage({ x: [0, Math.PI], y: [0, 1.02], axes: 'box', gutter: true, height: 380, weight: 1 });
        const sinAng = (M, d) => { const w = mv(M, d), c = Math.abs(dot(w, d)) / (len(w) * len(d)); return Math.sqrt(Math.max(0, 1 - Math.min(1, c * c))); };
        const defect = (mats, d) => Math.max(...mats.map((M) => sinAng(M, d)));
        const dirOf = (rep, x, y) => (rep.dim === 2 ? [x, y] : [x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))]);
        // exact-ish minimum: grid search then local refinement
        const search = {};
        const minOf = (rep, mats) => {
          let best = { d: 9, at: null };
          if (rep.dim === 2) { for (let i = 0; i < 720; i++) { const th = (Math.PI * i) / 720, d = defect(mats, [Math.cos(th), Math.sin(th)]); if (d < best.d) best = { d, at: th }; } }
          else { for (let i = -60; i <= 60; i++) for (let j = -60; j <= 60; j++) { const x = i / 60, y = j / 60; if (x * x + y * y > 1) continue; const d = defect(mats, dirOf(rep, x, y)); if (d < best.d) best = { d, at: [x, y] }; } }
          let step = rep.dim === 2 ? 0.003 : 0.012;
          for (let it = 0; it < 60; it++) {
            let moved = false;
            const cand = rep.dim === 2 ? [[best.at + step], [best.at - step]] : [[best.at[0] + step, best.at[1]], [best.at[0] - step, best.at[1]], [best.at[0], best.at[1] + step], [best.at[0], best.at[1] - step]];
            for (const c of cand) { const d = rep.dim === 2 ? defect(mats, [Math.cos(c[0]), Math.sin(c[0])]) : (c[0] * c[0] + c[1] * c[1] > 1 ? 9 : defect(mats, dirOf(rep, c[0], c[1]))); if (d < best.d - 1e-15) { best = { d, at: rep.dim === 2 ? c[0] : c }; moved = true; } }
            if (!moved) step /= 2;
          }
          return best;
        };
        const info = (k) => (search[k] ||= (() => { const r = RE[k]; return { lines: minOf(r, r.mats), planes: r.dim === 3 ? minOf(r, r.dual) : null }; })());
        const h2 = sA.handle(Math.cos(0.5), Math.sin(0.5), { color: 'orange', r: 8, label: 'ℓ', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const h3 = sA.handle(0.3, 0.45, { color: 'orange', r: 8, label: 'd', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.999 ? [(x * 0.999) / r, (y * 0.999) / r] : [x, y]; } });
        const cur = () => { const rep = RE[sel.value]; return { rep, mats: what.value === 'planes' && rep.dim === 3 ? rep.dual : rep.mats }; };
        v.render(() => {
          const { rep, mats } = cur(), inf = info(sel.value);
          what.el.hidden = rep.dim === 2;
          h2.visible = rep.dim === 2; h3.visible = rep.dim === 3;
          if (rep.dim === 2) {
            sB.setView([0, Math.PI], [0, 1.02]); sB.setLabels('direction angle $\\theta$ of the line', 'defect'); sB.setTicks([[0, '0'], [Math.PI / 4, 'π/4'], [Math.PI / 2, 'π/2'], [(3 * Math.PI) / 4, '3π/4'], [Math.PI, 'π']], null);
            sA.circle(0, 0, 1, { color: 'grid', width: 1.4 });
            const th = ((Math.atan2(h2.y, h2.x) % Math.PI) + Math.PI) % Math.PI, u = [Math.cos(th), Math.sin(th)];
            mats.forEach((M, g) => { const w = unit(mv(M, u)); sA.line(-w[0] * 1.2, -w[1] * 1.2, w[0] * 1.2, w[1] * 1.2, { color: ecol(g), width: 2.2, alpha: 0.75 }); });
            sA.line(-u[0] * 1.25, -u[1] * 1.25, u[0] * 1.25, u[1] * 1.25, { color: 'orange', width: 3.2 });
            sA.dot(u[0], u[1], { r: 0.1, color: 'orange' });
            sB.fn((t) => defect(mats, [Math.cos(t), Math.sin(t)]), { domain: [0, Math.PI], n: 360, color: 'accent', width: 2.4 });
            sB.hline(0, { color: 'faint' });
            sB.dot(th, defect(mats, u), { r: 6.5, color: 'orange' });
            if (inf.lines.d < 1e-6) { for (const t of zerosOf(mats)) { sB.dot(t, 0, { r: 6, color: 'green' }); sA.dot(Math.cos(t), Math.sin(t), { r: 6, color: 'green' }); sA.dot(-Math.cos(t), -Math.sin(t), { r: 6, color: 'green' }); } }
            sB.corner(`defect at $\\theta$: ${nm(defect(mats, u), 3)}`, 'tr', { size: 12, plate: true });
          } else {
            sB.setView([0.35, mats.length + 0.65], [0, 1.02]); sB.setLabels(null, 'defect'); sB.setTicks(mats.map((_, g) => [g + 1, String(g + 1)]), null);
            const key = `${sel.value}${what.value}`;
            sA.heat((x, y) => (x * x + y * y > 1 ? NaN : defect(mats, dirOf(rep, x, y))), { range: [0, 1], cmap: 'viridis', res: 130, key });
            sA.circle(0, 0, 1, { color: 'ink', width: 1.4, alpha: 0.5 });
            [['x', 1, 0], ['y', 0, 1]].forEach(([l, x, y]) => { sA.dot(x, y, { r: 3, color: 'ink' }); sA.text(l, x * 1.12, y * 1.12, { math: true, size: 14, color: 'muted', align: 'center', baseline: 'middle' }); });
            sA.text('z', 0.07, -0.07, { math: true, size: 13, color: 'panel' }); sA.dot(0, 0, { r: 2.5, color: 'panel' });
            const best = (what.value === 'planes' && rep.dim === 3 ? inf.planes : inf.lines);
            if (best.d < 1e-6) { sA.dot(best.at[0], best.at[1], { r: 9, hollow: true, color: 'green', width: 3 }); sA.text('invariant', best.at[0] - 0.05, best.at[1] + 0.17, { size: 12, color: 'green', weight: 700, align: 'center' }); }
            const d = dirOf(rep, h3.x, h3.y);
            sB.bars(mats.map((M) => sinAng(M, d)), { x0: 1, color: (val, i) => (val < 1e-6 ? 'green' : ecol(i)) });
            sB.hline(0, { color: 'faint' }); sB.corner('defect of each $\\rho(g)$ at the handle', 'tr', { size: 11.5 });
          }
          sA.corner(rep.dim === 2 ? 'lines through 0 in $\\mathbb R^2$' : 'directions in $\\mathbb R^3$ (upper hemisphere, seen from above)', 'tl', { size: 11.5, plate: true });
        });
        function zerosOf(mats) {
          const out = [];
          for (let i = 0; i < 720; i++) { const t = (Math.PI * i) / 720; if (defect(mats, [Math.cos(t), Math.sin(t)]) < 1e-3) { const last = out[out.length - 1]; if (last == null || t - last > 0.05) out.push(t); } }
          return out;
        }
        v.legend([['orange', 'candidate (line / direction)'], ['green', 'invariant']]);
        v.readout(() => {
          const rep = RE[sel.value], inf = info(sel.value), n = rep.mats.length;
          const hdr = `${rep.name}: $|G|=${n}$ matrices of size ${rep.dim}.`;
          if (rep.dim === 2) {
            return `${hdr} Smallest defect over all lines: $${nm(inf.lines.d, 4)}$${inf.lines.d < 1e-6 ? ` at $\\theta=${nm((inf.lines.at * 180) / Math.PI, 1)}^\\circ$ → **an invariant line exists: reducible**` : ' > 0 → **no invariant line: irreducible over $\\mathbb R$**'}.${sel.value === 'rot4' ? ' (Over $\\mathbb C$ the vectors $(1,\\pm i)$ span invariant lines: irreducibility depends on the field.)' : ''}`;
          }
          const pl = inf.planes, red = inf.lines.d < 1e-6 || pl.d < 1e-6;
          return `${hdr} Smallest defect over lines: $${nm(inf.lines.d, 4)}$; over planes: $${nm(pl.d, 4)}$ → ${red ? `**reducible**: there is an invariant ${inf.lines.d < 1e-6 ? 'line' : ''}${inf.lines.d < 1e-6 && pl.d < 1e-6 ? ' and an invariant ' : ''}${pl.d < 1e-6 ? 'plane' : ''} (green rings: switch lines/planes).` : '**irreducible**: no invariant line or plane.'} Dimensions of proper subspaces: 1 and 2.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Direct sums',
      statement: String.raw`Given representations $\rho_1\colon G\to GL(V_1)$ and $\rho_2\colon G\to GL(V_2)$, the **direct sum** is the representation on $V_1\oplus V_2$ with $\rho(g)(v_1,v_2)=(\rho_1(g)v_1,\rho_2(g)v_2)$; its matrices are block diagonal, $\rho(g)=\begin{pmatrix}\rho_1(g)&0\\0&\rho_2(g)\end{pmatrix}$, and its degree is $\dim V_1+\dim V_2$. Conversely, if $V=W_1\oplus W_2$ as vector spaces with both summands invariant, then $V$ is the direct sum of the restrictions.`,
      idea: String.raw`The two summands do not interact: a vector splits uniquely as $v=v_1+v_2$, each part is moved only by its own block, and the sum of the moved parts is the moved vector. The block form is a property of a *basis adapted to the splitting*; in another basis the same representation has dense matrices. What is intrinsic is the pair of invariant subspaces, one for each summand.`,
      caption: String.raw`The rotations of a triangular prism (or all its symmetries fixing the vertical axis) act on $\mathbb R^3=V\oplus W$: $V$ the horizontal plane, $W$ the axis. Drag the vector $v$; its two components (blue, in the plane; green, on the axis) move independently under the chosen $g$ and re-add to $\rho(g)v$. The table shows $\rho(g)$ in the adapted basis; tilt the basis and the blocks dissolve although the splitting is unchanged.`,
      deps: ['rep-1.5'],
      refs: ['Fulton–Harris §1.1'],
      tags: ['direct sum', 'block diagonal'],
      viz(v) {
        const G = dihedral(3), R = s3reps(G);
        const wsel = v.select('axis $W$ carries', [{ value: 'sign', label: 'sign (prism rotations)' }, { value: 'triv', label: 'trivial (mirror symmetries)' }], 'sign');
        const gsel = v.select('element $g$', G.L.map((l, i) => ({ value: i, label: `$${l}$` })), 1);
        const tilt = v.slider('tilt the basis (degrees)', 0, 90, 0, { step: 1 });
        const S = v.stage({ x: [-2.0, 2.0], y: [-1.75, 1.85], equal: true, axes: false, height: 400, weight: 1.35 });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.4, axis: 1.4, lim: 1.35, labels: ['x', 'y', 'z'] });
        const hv = sc.handle([0.9, 0.5, 0.7], { color: 'ink', r: 7, label: 'v' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 0.8 });
        const T = v.table(tb, { rows: 3, cols: 3, maxCell: 70, size: 14, margin: 6 });
        const big = (g) => { const A = R.std.mats[g], w = (wsel.value === 'sign' ? R.sign : R.triv).mats[g][0][0]; return [[A[0][0], A[0][1], 0], [A[1][0], A[1][1], 0], [0, 0, w]]; };
        const rotY = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
        const top = G.pos.map((p) => [p[0] * 0.95, p[1] * 0.95, 0.55]), bot = top.map((p) => [p[0], p[1], -0.55]);
        v.render(() => {
          const g = gsel.value, M = big(g), p = hv.p, comp = [[p[0], p[1], 0], [0, 0, p[2]]];
          const mp = mv(M, p), mc = comp.map((c) => mv(M, c));
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 1.3, { fill: 'blue', fillAlpha: 0.05, color: 'blue', width: 1, grid: true });
          sc.line([0, 0, -1.3], [0, 0, 1.3], { color: 'green', width: 2, alpha: 0.7 }, 6);
          const prism = (Mx, col, dash, label, fa) => {
            const t2 = top.map((q) => mv(Mx, q)), b2 = bot.map((q) => mv(Mx, q));
            sc.poly(t2, { fill: col, fillAlpha: fa, color: col, width: 1.8 }); sc.poly(b2, { fill: col, fillAlpha: fa * 0.5, color: col, width: 1.2 });
            t2.forEach((q, k) => sc.line(q, b2[k], { color: col, width: 1.2, alpha: 0.7, dash }, 1));
            if (label) t2.forEach((q, k) => sc.tex(`\\mathrm{${'ABC'[k]}}`, vadd(q, [0.08, 0.1, 0.12]), { color: col, size: 14 }));
          };
          prism(eye(3), 'muted', true, false, 0.03);
          prism(M, 'accent', false, true, 0.09);
          // components of v and of g·v
          sc.line(comp[0], p, { color: 'faint', width: 1, dash: true }, 1); sc.line(comp[1], p, { color: 'faint', width: 1, dash: true }, 1);
          sc.arrow([0, 0, 0], comp[0], { color: 'blue', width: 2.4 }); sc.arrow([0, 0, 0], comp[1], { color: 'green', width: 2.4 });
          sc.arrow([0, 0, 0], mc[0], { color: 'blue', width: 2, dash: true, alpha: 0.7 }); sc.arrow([0, 0, 0], mc[1], { color: 'green', width: 2, alpha: 0.7 });
          sc.arrow([0, 0, 0], mp, { color: 'gold', width: 3.2 });
          sc.arrow([0, 0, 0], p, { color: 'ink', width: 2.6 });
          sc.tex('\\rho(g)v', vadd(mp, [0.06, 0.06, 0.14]), { color: 'gold', size: 14 });
          sc.flush();
          const Q = rotY((tilt.value * Math.PI) / 180), B = mm(tp(Q), mm(M, Q));
          const inBlock = (i, j) => (i < 2) === (j < 2);
          T.draw({
            rows: 3, cols: 3, size: 13, format: 2, labelSize: 12, rowLabels: ['1', '2', '3'], colLabels: ['1', '2', '3'],
            value: (i, j) => (Math.abs(B[i][j]) < 1e-9 ? '0' : nmc(B[i][j], 2)),
            heat: (i, j) => 0.5 + 0.5 * B[i][j], cmap: 'diverging',
            textColor: (i, j) => (Math.abs(B[i][j]) < 1e-9 ? 'faint' : 'ink'),
            fill: (i, j) => (Math.abs(B[i][j]) < 1e-9 ? ['faint', 0.07] : null),
          });
          if (tilt.value === 0) { T.box(0, 0, 1, 1, { color: 'blue', width: 2.5 }); T.box(2, 2, 2, 2, { color: 'green', width: 2.5 }); }
          tb.corner(tilt.value === 0 ? `$\\rho(${G.L[g]})$ in the adapted basis: blocks $\\rho_V\\oplus\\rho_W$` : `same $\\rho(${G.L[g]})$ in a tilted basis`, 'tl', { size: 11.5 });
        });
        v.legend([['blue', '$v_V$ and $\\rho(g)v_V$ in $V$ (dashed)'], ['green', '$v_W$ in $W$'], ['gold', '$\\rho(g)v$'], ['accent', 'prism moved by $g$']]);
        v.readout(() => {
          const g = gsel.value, M = big(g), p = hv.p;
          const comp = [[p[0], p[1], 0], [0, 0, p[2]]], lhs = mv(M, p), rhs = vadd(mv(M, comp[0]), mv(M, comp[1]));
          const e1 = len(vsub(lhs, rhs)), off = Math.max(...[0, 1, 2].flatMap((i) => [0, 1, 2].filter((j) => (i < 2) !== (j < 2)).map((j) => Math.abs(M[i][j]))));
          const mats = G.perms.map((_, k) => big(k)), chk = homCheck(G, mats);
          const inV = Math.abs(mv(M, comp[0])[2]), inW = Math.hypot(mv(M, comp[1])[0], mv(M, comp[1])[1]);
          return `$\\rho(g)v=\\rho_V(g)v_V+\\rho_W(g)v_W$: error $${e1 < 1e-9 ? '0' : nm(e1, 3)}$ · $V$ stays in $V$ (leak $${inV < 1e-9 ? '0' : nm(inV, 3)}$), $W$ stays in $W$ (leak $${inW < 1e-9 ? '0' : nm(inW, 3)}$) · off-block entries: $${off < 1e-9 ? '0' : nm(off, 3)}$\n$\\rho$ is a representation of degree $3=2+1$ (all ${chk.pairs} products ${chk.bad === 0 ? 'pass' : 'fail'}); $\\rho_V$ = standard, $\\rho_W$ = ${wsel.value === 'sign' ? 'sign: $-1$ on reflections' : 'trivial'}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Tensor products, duals and Hom',
      statement: String.raw`For representations $\rho$ on $V$ and $\sigma$ on $W$: the **tensor product** $V\otimes W$ carries $(\rho\otimes\sigma)(g)=\rho(g)\otimes\sigma(g)$, which on arrays (the matrix $X=(x_{ij})$ standing for $\sum x_{ij}\,e_i\otimes f_j$) is $X\mapsto\rho(g)\,X\,\sigma(g)^{\mathsf T}$; the **dual** $V^{*}$ carries $\rho^{*}(g)=\rho(g^{-1})^{\mathsf T}$; and $\operatorname{Hom}(V,W)\cong V^{*}\otimes W$ carries $X\mapsto\sigma(g)\,X\,\rho(g)^{-1}$. The vectors of $\operatorname{Hom}(V,W)$ fixed by every $g$ are exactly the intertwiners $\operatorname{Hom}_G(V,W)$.`,
      idea: String.raw`Each construction is the unique way to make the linear-algebra operation commute with the group: the Kronecker matrix $\rho(g)\otimes\sigma(g)$ is a homomorphism because $(A\otimes B)(A'\otimes B')=AA'\otimes BB'$, and the transpose-inverse in the dual is what restores $\rho^{*}(gh)=\rho^{*}(g)\rho^{*}(h)$ (transposing alone would reverse products). A map $X\colon V\to W$ is moved by conjugating with the two actions, and it is unmoved precisely when $\sigma(g)X=X\rho(g)$ — the equivariance condition of 1.4.`,
      caption: String.raw`Click cells of the left array $X$ to change its entries (shift-click lowers); pick $\rho$, $\sigma$, an element $g$ and a construction. The middle array is $\rho(g)X\sigma(g)^{\mathsf T}$ computed with ordinary matrix products; the right grid is the Kronecker matrix applied to $X$ written as a long vector — the two results agree entry by entry. The readout verifies the homomorphism property on all products and counts the arrays fixed by everything (for $\operatorname{Hom}$: the intertwiners).`,
      deps: ['rep-1.7', 'ladr-9.71'],
      refs: ['Serre §1.5', 'Fulton–Harris §1.1'],
      tags: ['tensor product', 'dual representation', 'Hom'],
      viz(v) {
        const G = dihedral(3), R = s3reps(G), NM = { triv: 'trivial', sign: 'sign', std: 'standard' };
        const opts = (l) => ['triv', 'sign', 'std'].map((k) => ({ value: k, label: k === 'triv' ? '$\\mathbf 1$' : k === 'sign' ? '$\\varepsilon$' : '$V_{\\mathrm{std}}$' }));
        const rs = v.select('$\\rho$ on $V$', opts(), 'std', { onChange: () => reset() });
        const ss = v.select('$\\sigma$ on $W$', opts(), 'std', { onChange: () => reset() });
        const cs = v.select('construction', [{ value: 'tensor', label: '$V\\otimes W$' }, { value: 'dual', label: '$V^{*}$' }, { value: 'hom', label: '$\\operatorname{Hom}(V,W)$' }], 'tensor', { onChange: () => reset() });
        const gs = v.select('element $g$', G.L.map((l, i) => ({ value: i, label: `$${l}$` })), 1);
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: '$X$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1, title: 'the moved array' });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.15, title: 'matrix of $g$ on the long vector' });
        const dims = () => { const p = R[rs.value].dim, q = R[ss.value].dim; return cs.value === 'tensor' ? [p, q] : cs.value === 'dual' ? [p, 1] : [q, p]; };
        let X = [];
        const reset = () => { const [m, n] = dims(); X = Array.from({ length: m }, (_, i) => Array.from({ length: n }, (_, j) => ((i * 2 + j * 3 + 1) % 5) - 2)); };
        reset();
        const maps = () => {
          const rho = R[rs.value].mats, sig = R[ss.value].mats, [m, n] = dims();
          let act, K;
          if (cs.value === 'tensor') { act = (g, Y) => mm(mm(rho[g], Y), tp(sig[g])); K = tensorMats(rho, sig); }
          else if (cs.value === 'dual') { const d = dualMats(G, rho); act = (g, Y) => mm(d[g], Y); K = d; }
          else { act = (g, Y) => mm(mm(sig[g], Y), inv(rho[g])); K = sig.map((s, g) => kron(s, tp(inv(rho[g])))); }
          return { act, K, m, n };
        };
        const TA = v.table(A, { rows: 2, cols: 2, maxCell: 62, size: 15, margin: 14 }), TB = v.table(B, { rows: 2, cols: 2, maxCell: 62, size: 15, margin: 14 }), TC = v.table(C, { rows: 4, cols: 4, maxCell: 50, size: 12, margin: 12 });
        A.onClick((x, y, mod) => { const c = TA.hit(x, y); if (c && c.i >= 0 && c.j >= 0) { const [m, n] = dims(); if (c.i < m && c.j < n) { X[c.i][c.j] = ((X[c.i][c.j] + 2 + (mod && mod.shift ? -1 : 1) + 5) % 5) - 2; v.invalidate(); } } });
        const heatv = (x) => 0.5 + 0.5 * Math.max(-1, Math.min(1, x / 3));
        v.render(() => {
          const { act, K, m, n } = maps(), g = gs.value, Y = act(g, X), kx = unvec(mv(K[g], vec(X)), m, n);
          TA.draw({ rows: m, cols: n, value: (i, j) => X[i][j], heat: (i, j) => heatv(X[i][j]), cmap: 'diverging', format: 2 });
          TB.draw({ rows: m, cols: n, value: (i, j) => (Math.abs(Y[i][j]) < 1e-9 ? 0 : Y[i][j]), heat: (i, j) => heatv(Y[i][j]), cmap: 'diverging', format: 2 });
          const N = m * n;
          TC.draw({ rows: N, cols: N, value: (i, j) => (Math.abs(K[g][i][j]) < 1e-9 ? '0' : nmc(K[g][i][j], 2)), size: N > 2 ? 11.5 : 14, heat: (i, j) => heatv(K[g][i][j] * 2), cmap: 'diverging', textColor: (i, j) => (Math.abs(K[g][i][j]) < 1e-9 ? 'faint' : 'ink') });
          A.corner(`${m}×${n} array — click a cell to edit`, 'bl', { size: 11 });
          B.corner(cs.value === 'tensor' ? '$\\rho(g)\\,X\\,\\sigma(g)^{\\mathsf T}$' : cs.value === 'dual' ? '$\\rho(g^{-1})^{\\mathsf T}X$' : '$\\sigma(g)\\,X\\,\\rho(g)^{-1}$', 'bl', { size: 12 });
          C.corner(cs.value === 'tensor' ? '$\\rho(g)\\otimes\\sigma(g)$' : cs.value === 'dual' ? '$\\rho^{*}(g)$' : '$\\sigma(g)\\otimes\\rho^{*}(g)$', 'bl', { size: 12 });
        });
        v.readout(() => {
          const { act, K, m, n } = maps(), g = gs.value, Y = act(g, X), kx = unvec(mv(K[g], vec(X)), m, n);
          const agree = fro(msub(Y, kx));
          const chk = homCheck(G, K);
          let allAgree = 0; for (let h = 0; h < G.n; h++) allAgree = Math.max(allAgree, fro(msub(act(h, X), unvec(mv(K[h], vec(X)), m, n))));
          // dimension of the space of fixed arrays
          const rows = K.flatMap((Kg) => msub(Kg, eye(m * n)));
          const fixed = v.M.nullspace(rows, 1e-9).length;
          const label = cs.value === 'tensor' ? `$\\dim(V\\otimes W)=${R[rs.value].dim}\\cdot${R[ss.value].dim}=${m * n}$` : cs.value === 'dual' ? `$\\dim V^{*}=${m}$` : `$\\dim\\operatorname{Hom}(V,W)=${m * n}$`;
          return `${label} · array action vs Kronecker matrix: max difference $${agree < 1e-9 ? '0' : nm(agree, 3)}$ (over all 6 elements: $${allAgree < 1e-9 ? '0' : nm(allAgree, 3)}$)\nHomomorphism check on all ${chk.pairs} products: ${chk.bad === 0 ? '**passes**' : '**fails**'} · arrays fixed by every $g$: $\\dim=${fixed}$${cs.value === 'hom' ? ` $=\\dim\\operatorname{Hom}_G(V,W)$` : cs.value === 'dual' ? ' (invariant functionals)' : ' (invariants in $V\\otimes W$)'}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Symmetric and alternating squares',
      statement: String.raw`For a representation $V$ of dimension $n$, the tensor square $V\otimes V$ splits as $V\otimes V=\operatorname{Sym}^2V\oplus\Lambda^2V$, where $\operatorname{Sym}^2V$ consists of the tensors fixed by the swap $v\otimes w\mapsto w\otimes v$ (symmetric arrays $X=X^{\mathsf T}$) and $\Lambda^2V$ of those it negates (antisymmetric arrays, $X=-X^{\mathsf T}$). Both are $G$-invariant subrepresentations, of dimensions $\tfrac{n(n+1)}2$ and $\tfrac{n(n-1)}2$ (in characteristic $\ne2$).`,
      idea: String.raw`The action $X\mapsto\rho(g)X\rho(g)^{\mathsf T}$ commutes with transposition, since $(\rho X\rho^{\mathsf T})^{\mathsf T}=\rho X^{\mathsf T}\rho^{\mathsf T}$; so it preserves the symmetric and the antisymmetric arrays, and every array is the sum $X=\tfrac12(X+X^{\mathsf T})+\tfrac12(X-X^{\mathsf T})$ of one of each. Counting free entries gives the dimensions. In a basis adapted to the splitting, the $n^2\times n^2$ matrix of $\rho\otimes\rho$ is block diagonal with blocks of sizes $\tfrac{n(n+1)}2$ and $\tfrac{n(n-1)}2$.`,
      caption: String.raw`Click cells of $X$ to edit it. The top row splits $X$ into its symmetric part $S$ and antisymmetric part $A$; the bottom row applies $\rho(g)\,\cdot\,\rho(g)^{\mathsf T}$ to each: the symmetric part stays symmetric, the antisymmetric part stays antisymmetric. The big grid is $\rho(g)\otimes\rho(g)$ in the adapted basis, with its two diagonal blocks outlined and zeros off them. Switch the representation to see $n=2$ ($3+1$) and $n=3$ ($6+3$).`,
      deps: ['rep-1.8'],
      refs: ['Serre §1.6'],
      see: ['ladr-9.17'],
      tags: ['symmetric square', 'alternating square'],
      viz(v) {
        const D3 = dihedral(3), D4 = dihedral(4), R3 = s3reps(D3);
        const REP = {
          std: { G: D3, n: 2, mats: R3.std.mats, tex: 'S_3 \\text{ on the plane}' },
          perm: { G: D3, n: 3, mats: R3.perm.mats, tex: 'S_3 \\text{ permuting }\\mathbb R^3' },
          d4: { G: D4, n: 2, mats: D4.mat, tex: 'D_4 \\text{ on the plane}' },
        };
        const rs = v.select('$V$', [{ value: 'std', label: '$S_3$ plane ($n=2$)' }, { value: 'perm', label: '$S_3$ on $\\mathbb R^3$ ($n=3$)' }, { value: 'd4', label: '$D_4$ plane ($n=2$)' }], 'std', { onChange: () => reset() });
        const g3 = v.select('element $g$', D3.L.map((l, i) => ({ value: i, label: `$${l}$` })), 1);
        const g4 = v.select('element $g$', D4.L.map((l, i) => ({ value: i, label: `$${l}$` })), 1);
        let X = [];
        const reset = () => { const n = REP[rs.value].n; X = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => ((i * 3 + j * 2 + (i > j ? 2 : 0)) % 5) - 2)); const r = REP[rs.value]; g3.el.hidden = r.G !== D3; g4.el.hidden = r.G !== D4; };
        reset();
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.35 });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1 });
        const TS = [0, 1, 2, 3, 4, 5].map((k) => v.table(A, { rows: 2, cols: 2, maxCell: 54, size: 13, margin: 2, region: [0.04 + (k % 3) * 0.32, k < 3 ? 0.52 : 0.04, 0.32 + (k % 3) * 0.32, k < 3 ? 0.9 : 0.42] }));
        const TQ = v.table(B, { rows: 4, cols: 4, maxCell: 50, size: 12, margin: 10 });
        A.onClick((x, y, mod) => { const c = TS[0].hit(x, y); if (c && c.i >= 0 && c.j >= 0 && c.i < X.length && c.j < X.length) { X[c.i][c.j] = ((X[c.i][c.j] + 2 + (mod && mod.shift ? -1 : 1) + 5) % 5) - 2; v.invalidate(); } });
        const heatv = (x) => 0.5 + 0.5 * Math.max(-1, Math.min(1, x / 3));
        const adapted = (n) => {
          const cols = [], r2 = Math.SQRT1_2;
          const E = (i, j, s = 1) => { const M = Array.from({ length: n }, () => Array(n).fill(0)); M[i][j] += s; return M; };
          for (let i = 0; i < n; i++) cols.push(vec(E(i, i)));
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) cols.push(vec(madd(msc(E(i, j), r2), msc(E(j, i), r2))));
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) cols.push(vec(madd(msc(E(i, j), r2), msc(E(j, i), -r2))));
          return tp(cols); // columns = basis vectors
        };
        const compute = () => {
          const r = REP[rs.value], n = r.n, g = r.G === D3 ? g3.value : g4.value, M = r.mats[g];
          const S = msc(madd(X, tp(X)), 0.5), Al = msc(msub(X, tp(X)), 0.5), act = (Y) => mm(mm(M, Y), tp(M));
          const K = kron(M, M), Q = adapted(n), Kd = mm(tp(Q), mm(K, Q));
          const ns = (n * (n + 1)) / 2;
          return { r, n, g, M, S, Al, gX: act(X), gS: act(S), gA: act(Al), Kd, ns };
        };
        v.render(() => {
          const { n, g, S, Al, gX, gS, gA, Kd, ns, r } = compute();
          const arrs = [X, S, Al, gX, gS, gA];
          TS.forEach((T, k) => { const Y = arrs[k]; T.draw({ rows: n, cols: n, value: (i, j) => (Math.abs(Y[i][j]) < 1e-9 ? 0 : Y[i][j]), heat: (i, j) => heatv(Y[i][j]), cmap: 'diverging', format: 2, size: n > 2 ? 12 : 14, maxCell: 54 }); });
          const lab = ['$X$', '$S=\\tfrac12(X+X^{\\mathsf T})$', '$A=\\tfrac12(X-X^{\\mathsf T})$', '$\\rho X\\rho^{\\mathsf T}$', '$\\rho S\\rho^{\\mathsf T}$', '$\\rho A\\rho^{\\mathsf T}$'];
          lab.forEach((l, k) => A.tex(l, 0.18 + (k % 3) * 0.32, k < 3 ? 0.95 : 0.47, { size: 13, align: 'center' }));
          A.text('=', 0.34, 0.71, { size: 20, align: 'center', baseline: 'middle', color: 'muted' }); A.text('+', 0.66, 0.71, { size: 20, align: 'center', baseline: 'middle', color: 'muted' });
          A.text('=', 0.34, 0.23, { size: 20, align: 'center', baseline: 'middle', color: 'muted' }); A.text('+', 0.66, 0.23, { size: 20, align: 'center', baseline: 'middle', color: 'muted' });
          A.corner(`click a cell of $X$ · $g=${r.G.L[g]}$ acts below`, 'bl', { size: 11 });
          const N = n * n;
          TQ.draw({ rows: N, cols: N, value: (i, j) => (Math.abs(Kd[i][j]) < 1e-9 ? '0' : nmc(Kd[i][j], 1)), size: N > 4 ? 10 : 12, heat: (i, j) => heatv(Kd[i][j] * 2), cmap: 'diverging', textColor: (i, j) => (Math.abs(Kd[i][j]) < 1e-9 ? 'faint' : 'ink'), rowLabels: (i) => (i < ns ? 'S' : 'A'), colLabels: (j) => (j < ns ? 'S' : 'A'), labelSize: 11 });
          TQ.box(0, 0, ns - 1, ns - 1, { color: 'blue', width: 2.6 }); TQ.box(ns, ns, N - 1, N - 1, { color: 'green', width: 2.6 });
          B.corner(`$\\rho(${r.G.L[g]})\\otimes\\rho(${r.G.L[g]})$ in the basis (symmetric | alternating)`, 'tl', { size: 11 });
        });
        v.readout(() => {
          const { n, S, Al, gS, gA, Kd, ns } = compute();
          const sym = fro(msub(gS, tp(gS))), alt = fro(madd(gA, tp(gA))), split = fro(msub(madd(S, Al), X));
          let off = 0; for (let i = 0; i < n * n; i++) for (let j = 0; j < n * n; j++) if ((i < ns) !== (j < ns)) off = Math.max(off, Math.abs(Kd[i][j]));
          const z = (x) => (x < 1e-9 ? '0' : nm(x, 3));
          return `$n=${n}$: $\\dim\\operatorname{Sym}^2V=\\tfrac{n(n+1)}2=${ns}$, $\\dim\\Lambda^2V=\\tfrac{n(n-1)}2=${(n * (n - 1)) / 2}$, total $${n * n}=n^2$ · $X=S+A$ error $${z(split)}$\n$\\rho S\\rho^{\\mathsf T}$ is symmetric (asymmetry $${z(sym)}$), $\\rho A\\rho^{\\mathsf T}$ is antisymmetric ($${z(alt)}$) · off-block entries of $\\rho\\otimes\\rho$: $${z(off)}$ → both parts are invariant subspaces.`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Proposition',
      name: 'Dihedral groups acting on functions on a polygon',
      statement: String.raw`Let $D_n$ act on the vertices $0,1,\dots,n-1$ of a regular $n$-gon, and let it act on the space $\mathbb C^{n}$ of functions on the vertices by $(g\cdot f)(x)=f(g^{-1}x)$. Writing $\zeta=e^{2\pi i/n}$ and $\chi_j(x)=\zeta^{jx}$, the space splits into $D_n$-invariant subspaces $U_0=\langle\chi_0\rangle$, $U_{n/2}=\langle\chi_{n/2}\rangle$ ($n$ even), and $U_j=\langle\chi_j,\chi_{-j}\rangle$ for $0<j<n/2$, spanned (over $\mathbb R$) by the discrete cosines $\cos\tfrac{2\pi jx}n$ and sines $\sin\tfrac{2\pi jx}n$. On $U_j$ the rotation $r$ acts by the angle $2\pi j/n$ and the reflection by a reflection matrix.`,
      idea: String.raw`A rotation by one step multiplies $\chi_j$ by the scalar $\zeta^{-j}$, so each $\chi_j$ is an eigenvector of the whole rotation subgroup with its own character; the reflection sends $\chi_j\mapsto\chi_{-j}$ because it reverses the direction of travel. Hence the frequency $\pm j$ pair is mapped to itself and no finer, and the distinct eigenvalue pairs $\zeta^{\pm j}$ of the rotation separate the pieces. This is the discrete Fourier transform on $\mathbb Z/n$ with the reflection added; the pieces are the plane representations $\rho_j$ of $D_n$ that will fill its character table.`,
      caption: String.raw`Drag the bar tips on the polygon to edit the function $f$. The coloured spectrum shows how much of $f$ lies in each frequency piece; click a bar to see that piece $P_jf$ drawn on the second polygon. Slide the rotation and flip the reflection: the moved piece $g\cdot P_jf$ (outline) equals $P_j(g\cdot f)$ — pieces are carried to themselves, never mixed. The readout prints the $2\times2$ matrix by which $g$ acts on the piece.`,
      deps: ['rep-1.2'],
      refs: ['Serre §5.3'],
      tags: ['dihedral group', 'discrete Fourier'],
      viz(v) {
        const N = v.slider('$n$ (vertices)', 3, 12, 6, { int: true, onChange: () => resetN() });
        const rk = v.slider('rotate by $k$ steps', 0, 11, 1, { int: true });
        const fl = v.toggle('then reflect', false);
        let J = 1;
        const sA = v.stage({ x: [-1.75, 1.75], y: [-1.7, 1.7], equal: true, axes: false, height: 330, weight: 1, title: '$f$ and $g\\cdot f$' });
        const sB = v.stage({ x: [-1.75, 1.75], y: [-1.7, 1.7], equal: true, axes: false, height: 330, weight: 1, title: 'the piece $P_jf$ and its image' });
        const sC = v.stage({ x: [-0.6, 6.6], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.85, title: 'energy $\\|P_jf\\|^2/\\|f\\|^2$ per frequency $j$', xlabel: 'frequency $j$' });
        const R0 = 1.05, C = 0.5;
        const hs = Array.from({ length: 12 }, (_, k) => sA.handle(R0, 0, { color: 'accent', r: 6, constrain: (x, y) => { const u = dirs[k]; if (!u) return [x, y]; const t = Math.max(R0 - C, Math.min(R0 + C, x * u[0] + y * u[1])); return [t * u[0], t * u[1]]; } }));
        let dirs = [];
        const dir = (k, n) => { const a = Math.PI / 2 - (TAU * k) / n; return [Math.cos(a), Math.sin(a)]; }; // vertex k clockwise from the top
        function resetN() {
          const n = N.value; dirs = Array.from({ length: n }, (_, k) => dir(k, n));
          hs.forEach((h, k) => { h.visible = k < n; if (k < n) { const f = 0.55 * Math.cos((TAU * k) / n) + 0.35 * Math.sin((TAU * 2 * k) / n) + 0.25 * (k % 3 === 0 ? 1 : -0.4); const t = R0 + C * f; h.set(t * dirs[k][0], t * dirs[k][1]); } });
          J = Math.min(J, Math.floor(n / 2));
        }
        resetN();
        sC.onClick((x) => { const j = Math.round(x); if (j >= 0 && j <= Math.floor(N.value / 2)) { J = j; v.invalidate(); } });
        const fval = (n) => Array.from({ length: n }, (_, k) => ((hs[k].x * dirs[k][0] + hs[k].y * dirs[k][1]) - R0) / C);
        // group element g: vertex permutation p; (g·f)[p[x]] = f[x]
        const gperm = (n) => { const a = ((rk.value % n) + n) % n; return fl.value ? Array.from({ length: n }, (_, k) => (((-(k + a)) % n) + n) % n) : Array.from({ length: n }, (_, k) => (k + a) % n); };
        const act = (p, f) => { const out = Array(f.length); p.forEach((px, x) => { out[px] = f[x]; }); return out; };
        const proj = (f, j, n) => {
          if (j === 0) return Array(n).fill(f.reduce((s, x) => s + x, 0) / n);
          const out = Array(n).fill(0);
          const pairs = j * 2 === n ? [1] : [0, 1];
          const c = (t) => Math.cos((TAU * j * t) / n), s = (t) => Math.sin((TAU * j * t) / n);
          const ac = (2 / n) * f.reduce((sum, x, t) => sum + x * c(t), 0), as = (2 / n) * f.reduce((sum, x, t) => sum + x * s(t), 0);
          for (let t = 0; t < n; t++) out[t] = j * 2 === n ? (1 / n) * f.reduce((sum, x, u) => sum + x * Math.cos(Math.PI * u), 0) * Math.cos(Math.PI * t) : ac * c(t) + as * s(t);
          return out;
        };
        const drawBars = (s, f, n, o) => {
          s.poly(dirs.map((u) => [u[0] * R0, u[1] * R0]), { color: 'faint', width: 1.2, fill: false });
          s.circle(0, 0, R0, { color: 'grid', width: 1, alpha: 0.5 });
          f.forEach((val, k) => {
            const u = dirs[k], t = R0 + C * Math.max(-1.2, Math.min(1.2, val));
            if (o.bars) { s.line(u[0] * R0, u[1] * R0, u[0] * t, u[1] * t, { color: o.col, width: o.w || 6, alpha: o.alpha ?? 0.6 }); }
            else { const a = [u[0] * R0, u[1] * R0], b = [u[0] * t, u[1] * t]; s.line(a[0], a[1], b[0], b[1], { color: o.col, width: o.w || 2 }); s.dot(b[0], b[1], { r: 4, color: o.col, hollow: true }); }
            if (o.label) s.text(String(k), u[0] * (R0 + 0.36 + (val < 0 ? 0 : C * Math.max(0, val) * 0)) * 1.0, u[1] * (R0 + 0.36), { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          });
        };
        const stats = () => {
          const n = N.value, f = fval(n), p = gperm(n), gf = act(p, f);
          const nj = Math.floor(n / 2), energies = [], parts = [];
          const tot = f.reduce((s, x) => s + x * x, 0) || 1;
          for (let j = 0; j <= nj; j++) { const pj = proj(f, j, n); parts.push(pj); energies.push(pj.reduce((s, x) => s + x * x, 0) / tot); }
          return { n, f, p, gf, nj, energies, parts };
        };
        v.render(() => {
          const { n, f, p, gf, nj, energies, parts } = stats();
          J = Math.min(J, nj);
          drawBars(sA, f, n, { col: 'accent', bars: true, w: 5, alpha: 0.35, label: true });
          drawBars(sA, gf, n, { col: 'orange', w: 2.4 });
          sA.corner('bars: $f$ (drag the tips) · orange: $g\\cdot f$', 'tl', { size: 11, plate: true });
          const pj = parts[J], gpj = act(p, pj);
          drawBars(sB, pj, n, { col: ecol(J), bars: true, w: 7, alpha: 0.5, label: true });
          drawBars(sB, gpj, n, { col: 'ink', w: 2.2 });
          sB.corner(`piece $j=${J}$ (${J === 0 || J * 2 === n ? 'dimension 1' : 'dimension 2'}) · outline: $g\\cdot P_jf$`, 'tl', { size: 11, plate: true });
          sC.setView([-0.6, nj + 0.6], [0, 1.02]); sC.setTicks(Array.from({ length: nj + 1 }, (_, j) => [j, String(j)]), null);
          sC.bars(energies, { x0: 0, color: (val, j) => ecol(j), alpha: 0.85 });
          sC.rect(J - 0.45, 0, J + 0.45, Math.max(energies[J], 0.02), { color: 'ink', width: 2.4, fill: false });
          sC.hline(0, { color: 'faint' });
        });
        v.readout(() => {
          const { n, f, p, gf, nj, parts } = stats();
          let inv = 0; for (let j = 0; j <= nj; j++) inv = Math.max(inv, Math.hypot(...vsub(proj(gf, j, n), act(p, parts[j]))));
          const sum = Math.hypot(...vsub(parts.reduce((a, q) => vadd(a, q), Array(n).fill(0)), f));
          // matrix of g on piece J in the basis (cos, sin)
          const c = Array.from({ length: n }, (_, t) => Math.cos((TAU * J * t) / n)), s = Array.from({ length: n }, (_, t) => Math.sin((TAU * J * t) / n));
          const coords = (h) => { const nc = c.reduce((q, x) => q + x * x, 0), ns = s.reduce((q, x) => q + x * x, 0); return [h.reduce((q, x, t) => q + x * c[t], 0) / nc, h.reduce((q, x, t) => q + x * s[t], 0) / ns]; };
          const dim1 = J === 0 || J * 2 === n, z = (x) => (x < 1e-9 ? '0' : nm(x, 3));
          let mat;
          if (dim1) { const [a] = coords(act(p, J === 0 ? Array(n).fill(1) : Array.from({ length: n }, (_, t) => Math.cos(Math.PI * t)))); mat = J === 0 ? '1' : nm(act(p, Array.from({ length: n }, (_, t) => Math.cos(Math.PI * t)))[1] / Math.cos(Math.PI), 0); mat = `\\left(${mat}\\right)`; }
          else { const a = coords(act(p, c)), b = coords(act(p, s)); mat = matN([[a[0], b[0]], [a[1], b[1]]], 2); }
          const dimsTxt = Array.from({ length: nj + 1 }, (_, j) => (j === 0 || j * 2 === n ? 1 : 2)).join('+');
          return `$\\mathbb R^{${n}}$ splits into ${nj + 1} pieces of dimensions $${dimsTxt}=${n}$ · $\\sum_jP_jf=f$ (error $${z(sum)}$) · $P_j(g\\cdot f)=g\\cdot P_jf$ for every piece (max error $${z(inv)}$)\n$g$ acts on piece $j=${J}$ in the basis $(\\cos,\\sin)$ by $${mat}$ — ${dim1 ? 'a sign, so a one-dimensional representation' : `a rotation by $2\\pi\\cdot${J}/${n}$ composed with a reflection when $g$ reflects`}.`;
        });
      },
    },
  ],
};
