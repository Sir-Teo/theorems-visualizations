// Representation Theory — Chapter 3: Characters
// Part 1 (this file): 3.1–3.8. Part 2 (ch03-b.js): 3.9–3.16. Shared machinery: ch03.shared.js.
import { TAU, ecol, nm, nmc, matN, mm, eye, trace, rot2, permMat, drawMoved, homCheck, cexp, cadd, csub, cmul, cconj, cabs, csc, ctex, ctext, cm, cI, cmm, ckron, ctr, cdsum, swapMat, cscale, tableOf, ip, gramRows, tableDefect, sqClass, invClass, multiplicities, cubeData, actOn, elOf, cyclic, averageIntertwiner } from './ch03.shared.js';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** Plain-text version of a group-element label (for tick labels). */
const plain = (L) => L.replace(/\^\{(\d+)\}/g, (_, d) => [...d].map((c) => SUP[c]).join('')).replace(/\\,/g, '');
/** Elements listed class by class. */
const byClass = (G) => G.classes.flatMap((c) => c.els);
const re = (z) => z[0];
const tolz = (x, t = 1e-9) => (Math.abs(x) < t ? 0 : x);
/** Mosaic of a product of two class functions: width |C|/|G|, height Re f(C)conj h(C); the signed area is Re ⟨f, h⟩. */
function mosaic(s, G, f, h, o = {}) {
  let x = 0, tot = 0;
  G.classes.forEach((c, i) => {
    const w = c.size / G.n, val = re(cmul(f[i], cconj(h[i])));
    s.rect(x, 0, x + w, val, { fill: val >= 0 ? 'green' : 'red', fillAlpha: 0.32, color: val >= 0 ? 'green' : 'red', width: 1.6 });
    s.text(plain(G.L[c.rep]), x + w / 2, val >= 0 ? -0.12 * (o.unit || 1) : 0.12 * (o.unit || 1), { align: 'center', baseline: val >= 0 ? 'top' : 'bottom', size: 11, color: ecol(i), weight: 700 });
    x += w; tot += w * val;
  });
  s.hline(0, { color: 'ink', width: 1 });
  return tot;
}
/** Representations of the dihedral group G (matrices complex) from the usual menu. */
function dihRep(G, kind) {
  if (kind === 'std') return { dim: 2, mats: G.mat.map(cm) };
  if (kind === 'perm') return { dim: G.m, mats: G.perms.map((p) => cm(permMat(p))) };
  if (kind === 'sign') return { dim: 1, mats: G.perms.map((_, g) => [[[G.isRef(g) ? -1 : 1, 0]]]) };
  return { dim: 1, mats: G.perms.map(() => [[[1, 0]]]) };
}

export default {
  collection: 'rep',
  chapter: 3,
  title: 'Characters',
  summary: String.raw`The character of a representation — the trace of each matrix — is a function constant on conjugacy classes, and it determines the representation completely. Irreducible characters are orthonormal for a natural inner product, which turns decomposition into computing dot products. The regular representation contains every irreducible as often as its dimension, so the squares of the dimensions add to the group order, and the number of irreducibles equals the number of conjugacy classes.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Character of a representation',
      statement: String.raw`The **character** of a finite-dimensional representation $\rho\colon G\to GL(V)$ is the function $\chi_\rho\colon G\to\mathbb C$, $\chi_\rho(g)=\operatorname{tr}\rho(g)$. It does not depend on the choice of basis of $V$ (similar matrices have the same trace), so isomorphic representations have the same character. The value at the identity is the degree: $\chi_\rho(e)=\dim V$.`,
      idea: String.raw`The trace is the one scalar attached to a matrix that survives a change of basis, $\operatorname{tr}(PAP^{-1})=\operatorname{tr}A$, so it can be attached to a representation as a whole rather than to a particular choice of matrices. Replacing each $\rho(g)$ by $P\rho(g)P^{-1}$ changes every matrix but no trace. All that is lost in passing to the character is, a priori, information; that nothing is lost is the content of 3.7.`,
      caption: String.raw`Choose a symmetry group and a representation. The left panel shows the symmetry $g$ moving the polygon; the bars show $\chi(g)=\operatorname{tr}\rho(g)$ for every element, grouped and coloured by conjugacy class. Click a bar (or press the button) to select an element: the matrix $\rho(g)$ and its trace appear below. Elements of the same colour always receive the same number, and the first bar (the identity) always equals the degree of the representation.`,
      deps: ['rep-1.1'],
      refs: ['Serre §2.1'],
      tags: ['character', 'trace'],
      credit: 'Frobenius, 1896 (characters of finite groups, defined without matrices); Frobenius, 1897 (as traces of representations)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Character_theory' },
      viz(v) {
        const GS = { S3: tableOf('S3').G, D4: tableOf('D4').G, D5: tableOf('D5').G };
        const gsel = v.select('group', [{ value: 'S3', label: '$S_3$' }, { value: 'D4', label: '$D_4$' }, { value: 'D5', label: '$D_5$' }], 'S3', { onChange: () => { sel = 1; } });
        const rsel = v.select('representation', [{ value: 'std', label: 'plane (standard)' }, { value: 'perm', label: 'vertices (permutation)' }, { value: 'sign', label: 'sign' }, { value: 'triv', label: 'trivial' }], 'std');
        let sel = 1;
        v.button('next element', () => { sel = (sel + 1) % GS[gsel.value].n; });
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 340, weight: 0.8, title: 'the symmetry $g$' });
        const B = v.stage({ x: [-0.8, 9.8], y: [-1, 3], axes: 'box', gutter: true, height: 340, weight: 1.4, title: 'the character $\\chi(g)=\\operatorname{tr}\\rho(g)$', ylabel: '' });
        B.onClick((x) => { const G = GS[gsel.value], k = Math.round(x); if (k >= 0 && k < G.n) sel = byClass(G)[k]; });
        const state = () => {
          const G = GS[gsel.value], R = dihRep(G, rsel.value), order = byClass(G);
          const tr = R.mats.map((M) => ctr(M)[0]);
          return { G, R, order, tr };
        };
        v.render(() => {
          const { G, R, order, tr } = state();
          if (sel >= G.n) sel = 1;
          const names = 'ABCDEFGH'.slice(0, G.m).split('');
          drawMoved(A, eye(2), G.pos, { col: 'muted', dash: true, fill: false, F: true, fa: 0.04 });
          drawMoved(A, G.mat[sel], G.pos, { col: ecol(G.cls[sel]), names, a: 0.12, fa: 0.32 });
          A.corner(`$g=${G.L[sel]}$`, 'tl', { plate: true });
          const vals = order.map((g) => tr[g]), lo = Math.min(-1, ...vals) - 0.6, hi = Math.max(1, ...vals) + 0.8;
          B.setView([-0.8, G.n - 0.2], [lo, hi]);
          B.setTicks(order.map((g, k) => [k, plain(G.L[g])]), null);
          B.bars(vals, { x0: 0, dx: 1, color: (_, k) => ecol(G.cls[order[k]]) });
          B.hline(0, { color: 'ink', width: 1 });
          const k = order.indexOf(sel);
          B.dot(k, vals[k], { r: 7, color: 'gold', fill: 'gold' });
          B.hline(R.dim, { color: 'muted', dash: true });
          B.text('degree', G.n - 0.3, R.dim + 0.12, { align: 'right', baseline: 'bottom', size: 11, color: 'muted' });
        });
        v.readout(() => {
          const { G, R, tr } = state(), M = R.mats[sel].map((r) => r.map((z) => z[0]));
          const same = G.classes[G.cls[sel]].els, ok = same.every((g) => Math.abs(tr[g] - tr[sel]) < 1e-9);
          return `$\\rho(${G.L[sel]})=${matN(M)}$, so $\\chi(${G.L[sel]})=\\operatorname{tr}\\rho(${G.L[sel]})=${nm(tr[sel], 3)}$.\nConjugacy class of $${G.L[sel]}$: {$${same.map((g) => G.L[g]).join(',\\ ')}$} — all have trace ${ok ? 'equal to this one' : '**different**'}. $\\chi(e)=${nm(tr[0], 0)}=\\dim V$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Proposition',
      name: 'Characters are class functions',
      statement: String.raw`Let $\chi$ be the character of a representation $\rho$ of a finite group $G$ on $V$. Then (a) $\chi(hgh^{-1})=\chi(g)$ for all $g,h\in G$, i.e. $\chi$ is constant on conjugacy classes; (b) $\chi(e)=\dim V$; (c) $\chi(g^{-1})=\overline{\chi(g)}$ (for $V$ complex).`,
      idea: String.raw`(a) $\rho(hgh^{-1})=\rho(h)\rho(g)\rho(h)^{-1}$ is similar to $\rho(g)$, and similar matrices have equal traces. (b) $\rho(e)=I$. (c) By 2.1 we may choose a basis in which every $\rho(g)$ is unitary; then $\rho(g^{-1})=\rho(g)^{*}$, whose trace is the conjugate. Because $g$ has finite order, the eigenvalues of $\rho(g)$ are roots of unity, and $\overline{\lambda}=\lambda^{-1}$ for each.`,
      caption: String.raw`Left: the elements of the group on a circle, coloured by conjugacy class; the gold ring is $g$ (click to change it) and the orange chords join it to every conjugate $hgh^{-1}$. Middle: the value of a function at $hgh^{-1}$ as $h$ runs over the group. The trace is flat, because it is a class function; switch to a single matrix entry and it is not. Right: in $\mathbb Z/7$ with $\rho=\psi_1\oplus\psi_2\oplus\psi_2$ (degree 3), the characters at $g^a$ and $g^{-a}$ are mirror images in the real axis.`,
      deps: ['rep-3.1'],
      refs: ['Serre §2.1'],
      tags: ['class function', 'conjugacy'],
      credit: 'Frobenius, 1896',
      viz(v) {
        const GS = { S3: tableOf('S3').G, D4: tableOf('D4').G, D6: tableOf('D6').G };
        let sel = 1;
        const gsel = v.select('group', [{ value: 'S3', label: '$S_3$' }, { value: 'D4', label: '$D_4$' }, { value: 'D6', label: '$D_6$' }], 'S3', { onChange: () => { sel = 1; } });
        const fsel = v.select('function of $\\rho(g)$', [{ value: 'tr', label: 'trace' }, { value: 'entry', label: 'top-left entry' }], 'tr');
        const aSl = v.slider('power $a$ in $\\mathbb Z/7$', 0, 6, 1, { int: true });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 320, weight: 0.9, title: 'conjugates of $g$' });
        const B = v.stage({ x: [-0.5, 12], y: [-2.6, 2.6], axes: 'box', gutter: true, height: 320, weight: 1.1, title: '$f(hgh^{-1})$ for each $h$', xlabel: 'h (element index)' });
        const C = v.stage({ x: [-3.6, 3.6], y: [-3.4, 3.4], equal: true, axes: true, height: 320, weight: 0.9, title: '$\\chi(g^a)$ and $\\chi(g^{-a})$ in $\\mathbb C$' });
        A.onClick((x, y) => {
          const G = GS[gsel.value]; let best = 0, bd = 1e9;
          for (let k = 0; k < G.n; k++) { const a = (TAU * k) / G.n, d = Math.hypot(x - 1.15 * Math.sin(a), y - 1.15 * Math.cos(a)); if (d < bd) { bd = d; best = k; } }
          sel = best;
        });
        const pos = (G, k) => [1.15 * Math.sin((TAU * k) / G.n), 1.15 * Math.cos((TAU * k) / G.n)];
        const Z7 = cyclic(7), chi7 = (a) => { const t = (TAU * a) / 7; return cadd(cexp(t), csc(cexp(2 * t), 2)); };
        const fval = (G, g) => (fsel.value === 'tr' ? G.mat[g][0][0] + G.mat[g][1][1] : G.mat[g][0][0]);
        v.render(() => {
          const G = GS[gsel.value];
          const conj = G.perms.map((_, h) => G.mul[G.mul[h][sel]][G.inv[h]]);
          G.classes.forEach((c) => c.els.forEach((g, k) => { const a = pos(G, g), b = pos(G, c.els[(k + 1) % c.size]); if (c.size > 1) A.segment(a, b, { color: 'faint', width: 1, alpha: 0.5 }); }));
          new Set(conj).forEach((g) => { if (g !== sel) A.segment(pos(G, sel), pos(G, g), { color: 'orange', width: 2 }); });
          G.perms.forEach((_, g) => { const [x, y] = pos(G, g); A.dot(x, y, { r: 9, color: ecol(G.cls[g]), fill: ecol(G.cls[g]), label: `$${G.L[g]}$`, tex: true, labelPos: 'n' }); });
          const [gx, gy] = pos(G, sel); A.dot(gx, gy, { r: 14, hollow: true, color: 'gold' });
          // middle
          B.setView([-0.5, G.n - 0.5], [-2.6, 2.6]);
          B.hline(fval(G, sel), { color: 'muted', dash: true });
          conj.forEach((g, h) => B.dot(h, fval(G, g), { r: 6, color: fsel.value === 'tr' ? 'accent' : 'red', fill: fsel.value === 'tr' ? 'accent' : 'red' }));
          // right
          C.circle(0, 0, 1, { color: 'faint', width: 1 });
          for (let a = 0; a < 7; a++) { const z = chi7(a); C.dot(z[0], z[1], { r: 3.5, color: 'muted', fill: 'muted' }); }
          const z = chi7(aSl.value), zi = chi7((7 - aSl.value) % 7);
          C.line(z[0], z[1], zi[0], zi[1], { color: 'faint', dash: true });
          C.arrow(0, 0, z[0], z[1], { color: 'accent', width: 2.2 });
          C.arrow(0, 0, zi[0], zi[1], { color: 'orange', width: 2.2 });
          C.text(`$g^{${aSl.value}}$`, z[0] * 1.07, z[1] * 1.07 + 0.2, { color: 'accent', size: 13, align: 'center' });
          if (aSl.value % 7 !== 0) C.text(`$g^{-${aSl.value}}$`, zi[0] * 1.07, zi[1] * 1.07 - 0.25, { color: 'orange', size: 13, align: 'center' });
        });
        v.readout(() => {
          const G = GS[gsel.value], conj = G.perms.map((_, h) => G.mul[G.mul[h][sel]][G.inv[h]]);
          const vals = conj.map((g) => fval(G, g)), spread = Math.max(...vals) - Math.min(...vals), cl = G.classes[G.cls[sel]];
          const z = chi7(aSl.value), zi = chi7((7 - aSl.value) % 7);
          return `$g=${G.L[sel]}$ has ${cl.size} conjugate(s); over all $h$ the values of ${fsel.value === 'tr' ? '$\\operatorname{tr}\\rho(hgh^{-1})$' : '$\\rho(hgh^{-1})_{11}$'} spread over a window of width $${nm(spread, 3)}$ — ${spread < 1e-9 ? 'a class function' : '**not constant**, so this is not a class function'}.\n$\\chi(e)=${ctex(chi7(0))}=\\dim V$; $\\chi(g^{${aSl.value}})=${ctex(z, 3)}$ and $\\chi(g^{-${aSl.value}})=${ctex(zi, 3)}$, the conjugate: ${cabs(csub(zi, cconj(z))) < 1e-9 ? 'equal' : 'different'}.`;
        });
        void Z7;
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Proposition',
      name: 'Characters of sums, tensors, duals and squares',
      statement: String.raw`For representations $V,W$ of $G$ with characters $\chi_V,\chi_W$ and $g\in G$:
- $\chi_{V\oplus W}(g)=\chi_V(g)+\chi_W(g)$;
- $\chi_{V\otimes W}(g)=\chi_V(g)\,\chi_W(g)$;
- $\chi_{V^*}(g)=\overline{\chi_V(g)}$;
- $\chi_{\mathrm{Sym}^2V}(g)=\tfrac12\big(\chi_V(g)^2+\chi_V(g^2)\big)$ and $\chi_{\Lambda^2V}(g)=\tfrac12\big(\chi_V(g)^2-\chi_V(g^2)\big)$.`,
      idea: String.raw`Traces of block-diagonal matrices add, and $\operatorname{tr}(A\otimes B)=\operatorname{tr}A\operatorname{tr}B$ (the Kronecker product has diagonal blocks $a_{ii}B$). The dual has matrices $\rho(g^{-1})^{\mathsf T}$, whose trace is $\chi(g^{-1})=\overline{\chi(g)}$ by 3.2. The symmetric and alternating squares are the $\pm1$ eigenspaces of the swap $S$ on $V\otimes V$, with projections $\tfrac12(1\pm S)$; and $\operatorname{tr}\big(S\,(A\otimes A)\big)=\operatorname{tr}(A^2)$, which gives the correction term $\chi(g^2)$.`,
      caption: String.raw`Pick a group, representations $A$ and $B$ and an operation. Each row of the table is a conjugacy class; the "direct" column is computed from the actual matrices (block sum, Kronecker product, inverse transpose, trace of $\tfrac12(1\pm S)(A\otimes A)$), the "formula" column from the character values alone. Bars are the real parts of the direct values and the rings the formula values. Switch off the $\chi(g^2)$ correction and the symmetric and alternating squares fail to match.`,
      deps: ['rep-3.1', 'rep-1.8', 'rep-1.9'],
      refs: ['Serre §2.1'],
      tags: ['character', 'tensor product', 'dual'],
      credit: 'Frobenius, 1896–1899 (the operations on characters; the symmetric-square formula in this form is the standard textbook one)',
      viz(v) {
        const T3 = tableOf('S3'), T5 = tableOf('Z5');
        const s3 = (() => {
          const G = T3.G;
          return [
            { tex: '\\mathbf 1', mats: G.perms.map(() => cm([[1]])) },
            { tex: '\\varepsilon', mats: G.perms.map((_, g) => cm([[G.isRef(g) ? -1 : 1]])) },
            { tex: 'V', mats: G.mat.map(cm) },
            { tex: 'P', mats: G.perms.map((p) => cm(permMat(p))) },
          ];
        })();
        const z5 = (() => {
          const G = T5.G, psi = (k) => G.L.map((_, a) => [[cexp((TAU * k * a) / 5)]]);
          const sum = (a, b) => G.L.map((_, g) => cdsum(psi(a)[g], psi(b)[g]));
          return [{ tex: '\\psi_1', mats: psi(1) }, { tex: '\\psi_2', mats: psi(2) }, { tex: '\\psi_1\\oplus\\psi_3', mats: sum(1, 3) }];
        })();
        const REPS = { S3: s3, Z5: z5 };
        const gsel = v.select('group', [{ value: 'S3', label: '$S_3$' }, { value: 'Z5', label: '$\\mathbb Z/5$' }], 'S3', { onChange: () => syncSel() });
        const opts = (L) => L.map((r, i) => ({ value: i, label: `$${r.tex}$` }));
        const aS3 = v.select('$A$', opts(s3), 2), bS3 = v.select('$B$', opts(s3), 3);
        const aZ5 = v.select('$A$', opts(z5), 0), bZ5 = v.select('$B$', opts(z5), 1);
        const syncSel = () => { const s = gsel.value === 'S3'; aS3.el.hidden = bS3.el.hidden = !s; aZ5.el.hidden = bZ5.el.hidden = s; };
        syncSel();
        const op = v.select('operation', [{ value: 'sum', label: '$A\\oplus B$' }, { value: 'ten', label: '$A\\otimes B$' }, { value: 'dual', label: '$A^*$' }, { value: 'sym', label: '$\\mathrm{Sym}^2A$' }, { value: 'alt', label: '$\\Lambda^2A$' }], 'ten');
        const fix = v.toggle('include the $\\chi(g^2)$ correction', true);
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.35 });
        const Bs = v.stage({ x: [-0.6, 3], y: [-4, 10], axes: 'box', gutter: true, height: 300, weight: 1, title: 'real part, direct (bar) and formula (ring)', xlabel: 'class' });
        const T = v.table(S, { rows: 4, cols: 6, square: false, maxCell: 70, cellAspect: 1.55, size: 13.5, labelSize: 12.5, margin: 6 });
        const calc = () => {
          const G = (gsel.value === 'S3' ? T3 : T5).G, L = REPS[gsel.value];
          const A = L[(gsel.value === 'S3' ? aS3 : aZ5).value], B = L[(gsel.value === 'S3' ? bS3 : bZ5).value], o = op.value;
          const sq = sqClass(G), rows = G.classes.map((c, i) => {
            const g = c.rep, a = ctr(A.mats[g]), b = ctr(B.mats[g]), g2 = G.mul[g][g];
            let direct, form;
            if (o === 'sum') { direct = ctr(cdsum(A.mats[g], B.mats[g])); form = cadd(a, b); }
            else if (o === 'ten') { direct = ctr(ckron(A.mats[g], B.mats[g])); form = cmul(a, b); }
            else if (o === 'dual') { direct = ctr(A.mats[G.inv[g]][0].map((_, j) => A.mats[G.inv[g]].map((r) => r[j]))); form = cconj(a); }
            else {
              const d = A.mats[g].length, Sw = swapMat(d), n = d * d, sg = o === 'sym' ? 1 : -1;
              const P = cm(Sw.map((r, i2) => r.map((x, j) => ((i2 === j ? 1 : 0) + sg * x) / 2)));
              void n;
              direct = ctr(cmm(P, ckron(A.mats[g], A.mats[g])));
              const corr = fix.value ? ctr(A.mats[g2]) : [0, 0];
              form = csc(cadd(cmul(a, a), sg > 0 ? corr : csc(corr, -1)), 0.5);
            }
            void sq; void i;
            return { c, a, b, direct, form };
          });
          return { G, A, B, o, rows };
        };
        v.render(() => {
          const { G, A, B, o, rows } = calc(), bin = o === 'sum' || o === 'ten';
          const ok = (r) => cabs(csub(r.direct, r.form)) < 1e-9;
          T.draw({
            rows: rows.length, cols: 6, colLabels: ['class', '$\\chi_A$', bin ? '$\\chi_B$' : '', 'direct', 'formula', ''], rowLabels: (i) => `${rows[i].c.size}×`,
            value: (i, j) => { const r = rows[i]; return [`$${G.L[r.c.rep]}$`, `$${ctex(r.a)}$`, bin ? `$${ctex(r.b)}$` : '', `$${ctex(r.direct)}$`, `$${ctex(r.form)}$`, ok(r) ? '✓' : '✗'][j]; },
            fill: (i, j) => (j >= 3 ? [ok(rows[i]) ? 'green' : 'red', j === 5 ? 0.35 : 0.14] : null), size: 13.5,
          });
          const vals = rows.map((r) => r.direct[0]), forms = rows.map((r) => r.form[0]);
          const hi = Math.max(2, ...vals, ...forms) + 1, lo = Math.min(-1, ...vals, ...forms) - 1;
          Bs.setView([-0.6, rows.length - 0.4], [lo, hi]);
          Bs.setTicks(rows.map((r, i) => [i, plain(G.L[r.c.rep])]), null);
          Bs.bars(vals, { x0: 0, dx: 1, color: (_, i) => ecol(i) });
          forms.forEach((y, i) => Bs.dot(i, y, { r: 9, hollow: true, color: 'ink' }));
          Bs.hline(0, { color: 'ink', width: 1 });
        });
        v.readout(() => {
          const { A, B, o, rows } = calc(), bad = rows.filter((r) => cabs(csub(r.direct, r.form)) > 1e-9).length;
          const names = { sum: `A\\oplus B`, ten: 'A\\otimes B', dual: 'A^*', sym: '\\mathrm{Sym}^2A', alt: '\\Lambda^2A' };
          return `Computing $\\chi_{${names[o]}}$ with $A=${A.tex}$${o === 'sum' || o === 'ten' ? `, $B=${B.tex}$` : ''}: **${bad === 0 ? 'direct and formula agree on every class' : `${bad} class(es) disagree`}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Inner product of class functions',
      statement: String.raw`For a finite group $G$ and functions $\varphi,\psi\colon G\to\mathbb C$ put $\langle\varphi,\psi\rangle=\frac1{|G|}\sum_{g\in G}\varphi(g)\overline{\psi(g)}$. On the space of class functions (functions constant on conjugacy classes) this is a Hermitian inner product, and since a class function takes one value $\varphi(C)$ on each class $C$,
$$\langle\varphi,\psi\rangle=\sum_{C}\frac{|C|}{|G|}\,\varphi(C)\overline{\psi(C)} .$$
The space of class functions has dimension equal to the number of conjugacy classes.`,
      idea: String.raw`The formula is an average over the group, the same operation as in 2.1; grouping the terms by conjugacy class collects $|C|$ equal terms for each class, so a class function is a vector indexed by the classes and the inner product is an ordinary dot product with weights $|C|/|G|$ (which add to $1$). Positivity: $\langle\varphi,\varphi\rangle=\frac1{|G|}\sum|\varphi(g)|^2>0$ unless $\varphi=0$.`,
      caption: String.raw`The blue and orange handles set two real class functions $\varphi$ and $\psi$ on the classes of the chosen group. The right panel draws their product as rectangles whose width is the class weight $|C|/|G|$ and whose height is $\varphi(C)\psi(C)$: the signed area (green minus red) is $\langle\varphi,\psi\rangle$. The readout shows the class sum and, as a check, the element-by-element sum. "Next character" loads a row of the character table into $\varphi$ or $\psi$ (see 3.5).`,
      deps: ['rep-3.2'],
      refs: ['Serre §2.3'],
      links: { source: 'https://math.mit.edu/~etingof/reprbook.pdf' },
      tags: ['inner product', 'class function'],
      viz(v) {
        const KEYS = ['S3', 'D4', 'Q8', 'S4', 'D5'];
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3', { onChange: () => load(0, 0), });
        const A = v.stage({ x: [-0.7, 6.2], y: [-3.4, 3.4], axes: 'box', gutter: true, height: 340, weight: 1.1, title: 'two class functions', xlabel: 'class' });
        const B = v.stage({ x: [0, 1], y: [-2, 2], axes: 'box', gutter: true, height: 340, weight: 1, title: 'the product, weighted by $|C|/|G|$', xlabel: 'cumulative class weight' });
        const hf = [], hh = [];
        for (let i = 0; i < 5; i++) {
          hf.push(A.handle(i - 0.17, 1, { color: 'accent', r: 7, constrain: { x: [i - 0.17, i - 0.17], y: [-3, 3] } }));
          hh.push(A.handle(i + 0.17, 1, { color: 'orange', r: 7, constrain: { x: [i + 0.17, i + 0.17], y: [-3, 3] } }));
        }
        let kf = 0, kh = 0;
        const load = (a, b) => {
          const T = tableOf(gsel.value);
          kf = a % T.rows.length; kh = b % T.rows.length;
          T.rows[kf].vals.forEach((z, i) => hf[i].set(i - 0.17, z[0])); T.rows[kh].vals.forEach((z, i) => hh[i].set(i + 0.17, z[0]));
        };
        v.button('next character → φ', () => { load(kf + 1, kh); });
        v.button('next character → ψ', () => { load(kf, kh + 1); });
        v.button('random', () => { const r = v.rng(Math.floor(Math.random() * 1e6)), n = tableOf(gsel.value).G.classes.length; for (let i = 0; i < n; i++) { hf[i].set(i - 0.17, Math.round(r.uniform(-3, 3) * 2) / 2); hh[i].set(i + 0.17, Math.round(r.uniform(-3, 3) * 2) / 2); } });
        const vecs = () => {
          const G = tableOf(gsel.value).G, n = G.classes.length;
          return { G, f: hf.slice(0, n).map((h) => [h.y, 0]), h: hh.slice(0, n).map((h) => [h.y, 0]) };
        };
        v.render(() => {
          const { G, f, h } = vecs(), n = G.classes.length;
          hf.forEach((x, i) => { x.visible = i < n; }); hh.forEach((x, i) => { x.visible = i < n; });
          A.setView([-0.7, n - 0.3], [-3.4, 3.4]);
          A.setTicks(G.classes.map((c, i) => [i, `${plain(G.L[c.rep])} (${c.size})`]), null);
          f.forEach((z, i) => A.rect(i - 0.3, 0, i - 0.04, z[0], { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.4 }));
          h.forEach((z, i) => A.rect(i + 0.04, 0, i + 0.3, z[0], { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.4 }));
          A.hline(0, { color: 'ink', width: 1 });
          const prods = f.map((z, i) => z[0] * h[i][0]), m = Math.max(1, ...prods.map(Math.abs)) * 1.25;
          B.setView([0, 1], [-m, m]);
          mosaic(B, G, f, h, { unit: m / 4 });
        });
        v.legend([['accent', '$\\varphi$'], ['orange', '$\\psi$'], ['green', 'positive area'], ['red', 'negative area']]);
        v.readout(() => {
          const { G, f, h } = vecs(), terms = G.classes.map((c, i) => `${nm(c.size, 0)}\\cdot${nm(f[i][0], 2)}\\cdot${nm(h[i][0], 2)}`);
          const byCls = ip(G, f, h)[0];
          const byEl = G.cls.reduce((s, ci) => s + f[ci][0] * h[ci][0], 0) / G.n;
          const ff = ip(G, f, f)[0], hh2 = ip(G, h, h)[0];
          return `$\\langle\\varphi,\\psi\\rangle=\\frac1{${G.n}}\\big(${terms.join('+')}\\big)=${nm(byCls, 3)}$; element-by-element sum: $${nm(byEl, 3)}$. $\\langle\\varphi,\\varphi\\rangle=${nm(ff, 3)}\\ge0$, $\\langle\\psi,\\psi\\rangle=${nm(hh2, 3)}\\ge0$.`;
        });
        load(0, 1);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Orthogonality of irreducible characters',
      statement: String.raw`Let $G$ be a finite group and $\chi_1,\chi_2,\dots$ the characters of its pairwise non-isomorphic irreducible complex representations. Then
$$\langle\chi_i,\chi_j\rangle=\frac1{|G|}\sum_{g\in G}\chi_i(g)\overline{\chi_j(g)}=\delta_{ij}.$$
The irreducible characters form an orthonormal family in the space of class functions.`,
      idea: String.raw`Choose unitary bases (2.1). For any matrix $X$ the average $T=\frac1{|G|}\sum_g\rho_j(g)\,X\,\rho_i(g)^{-1}$ is an intertwiner, so by Schur's lemma (2.5, 2.7, 2.8) it is $0$ if $\rho_i\not\cong\rho_j$ and a scalar $\frac{\operatorname{tr}X}{\dim}\,I$ if they are equal. Reading off the entries gives the orthogonality of matrix coefficients (3.13); summing the diagonal entries gives the orthogonality of characters.`,
      caption: String.raw`The table is the Gram matrix $\langle\chi_i,\chi_j\rangle$ of the rows of the character table of the chosen group, computed with the class sizes as weights. Every diagonal entry is $1$ and every other entry $0$. Click a cell: the left panel draws the real part of $\chi_i\overline{\chi_j}$ as weighted rectangles, whose signed area is the entry. Then break the theorem: weight all classes equally, or drop the complex conjugate (visible on $A_4$, whose table is complex).`,
      deps: ['rep-3.4', 'rep-2.5'],
      refs: ['Serre §2.3, Theorems 3–5', 'Etingof et al. §4.5, Theorem 4.5.1'],
      links: { source: 'https://math.mit.edu/~etingof/reprbook.pdf' },
      tags: ['orthogonality', 'character table'],
      viz(v) {
        const KEYS = ['S3', 'D4', 'Q8', 'A4', 'S4', 'S5'];
        const gsel = v.select('group', KEYS.map((k) => ({ value: k, label: `$${tableOf(k).G.tex}$` })), 'S3', { onChange: () => { sel = [0, 1]; } });
        const wt = v.toggle('weight classes by size', true), cj = v.toggle('conjugate the second factor', true);
        let sel = [0, 1];
        const A = v.stage({ x: [0, 1], y: [-2, 2], axes: 'box', gutter: true, height: 340, weight: 1, title: 'the selected product', xlabel: 'cumulative class weight' });
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, title: 'Gram matrix of the character table' });
        const T = v.table(S, { rows: 3, cols: 3, maxCell: 62, size: 13, labelSize: 13, margin: 8 });
        S.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) sel = [c.i, c.j]; });
        const gram = () => {
          const { G, rows } = tableOf(gsel.value), k = G.classes.length;
          const M = rows.map((a) => rows.map((b) => {
            let s = [0, 0];
            G.classes.forEach((c, i) => { s = cadd(s, csc(cmul(a.vals[i], cj.value ? cconj(b.vals[i]) : b.vals[i]), wt.value ? c.size / G.n : 1 / k)); });
            return s;
          }));
          return { G, rows, M };
        };
        v.render(() => {
          const { G, rows, M } = gram();
          if (sel[0] >= rows.length || sel[1] >= rows.length) sel = [0, 1];
          const n = rows.length, id = (i, j) => (i === j ? 1 : 0);
          T.draw({
            rows: n, cols: n, rowLabels: (i) => `$${rows[i].tex}$`, colLabels: (j) => `$${rows[j].tex}$`, size: n > 5 ? 11.5 : 13,
            value: (i, j) => ctext(M[i][j]).replace(/^-0$/, '0'), fill: (i, j) => [cabs(csub(M[i][j], [id(i, j), 0])) < 1e-9 ? 'green' : 'red', 0.26], highlight: [[sel[0], sel[1], 'accent']],
          });
          const f = rows[sel[0]].vals, h = cj.value ? rows[sel[1]].vals : rows[sel[1]].vals.map(cconj);
          const ww = wt.value ? G.classes : G.classes.map(() => ({ size: G.n / G.classes.length }));
          const GG = { ...G, classes: ww.map((c, i) => ({ ...G.classes[i], size: c.size })) };
          const m = Math.max(1, ...f.map((z, i) => Math.abs(z[0] * h[i][0] + z[1] * h[i][1]))) * 1.3;
          A.setView([0, 1], [-m, m]);
          mosaic(A, GG, f, h, { unit: m / 5 });
        });
        v.readout(() => {
          const { rows, M } = gram(), n = rows.length;
          let dev = 0; M.forEach((r, i) => r.forEach((z, j) => { dev = Math.max(dev, cabs(csub(z, [i === j ? 1 : 0, 0]))); }));
          return `$\\langle\\chi_{${sel[0] + 1}},\\chi_{${sel[1] + 1}}\\rangle=${ctex(M[sel[0]][sel[1]], 3)}$ (rows ${sel[0] + 1}, ${sel[1] + 1} of ${n}). Largest deviation of the Gram matrix from the identity: ${dev < 1e-9 ? '**0** — the rows are orthonormal' : `**${nm(dev, 3)}** — not orthonormal`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Corollary',
      name: 'Multiplicities from inner products',
      statement: String.raw`Let $V$ be a complex representation of a finite group $G$ with character $\chi$, and let $W_1,\dots,W_r$ be the irreducible representations with characters $\chi_1,\dots,\chi_r$. Then $V\cong\bigoplus_i W_i^{\,m_i}$ with $m_i=\langle\chi,\chi_i\rangle$, so $\chi=\sum_i\langle\chi,\chi_i\rangle\chi_i$. In particular the multiplicity of the trivial representation is $\frac1{|G|}\sum_g\chi(g)$, and a permutation representation has $\chi(g)=\#\{\text{points fixed by }g\}$.`,
      idea: String.raw`By Maschke (2.2) $V$ is a direct sum of irreducibles, so $\chi=\sum m_i\chi_i$ by 3.3. Take the inner product with $\chi_j$ and use 3.5: only the term $i=j$ survives and gives $m_j$. For a permutation representation on a finite set $X$ the matrix of $g$ is a permutation matrix, whose diagonal entries are $1$ exactly at the fixed points.`,
      caption: String.raw`The rotation group of the cube is $S_4$ (it permutes the four body diagonals). Choose a set of geometric objects the cube rotations move: diagonals, faces, vertices, edges or the three face axes. Choose a class of rotation ($e$; $(1\,2)$, a half-turn about an edge axis; $(1\,2)(3\,4)$, a half-turn about a face axis; $(1\,2\,3)$, a third-turn about a body diagonal; $(1\,2\,3\,4)$, a quarter-turn about a face axis): the 3D picture shows which objects stay fixed (green) and which move (red), and the character of that class is their count. The bars on the right are the multiplicities $\langle\chi,\chi_i\rangle$ of the five irreducibles of $S_4$, computed by the weighted dot product; they are whole numbers, and the readout rebuilds $\chi$ from them.`,
      deps: ['rep-3.5'],
      refs: ['Serre §2.3'],
      links: { source: 'https://math.mit.edu/~etingof/reprbook.pdf' },
      tags: ['multiplicity', 'permutation representation'],
      viz(v) {
        const T = tableOf('S4'), cube = cubeData(), G = T.G;
        const pairsOfEdges = cube.sets.edges.pts.filter((p, i, a) => a.findIndex((q) => cube.same(q, p.map((t) => -t))) >= i); // 6 axes through opposite edge midpoints
        const axes3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const SETS = {
          diag: { name: '4 body diagonals', pts: cube.sets.diag.pts, line: true },
          faceAxes: { name: '3 face axes', pts: axes3, line: true },
          faces: { name: '6 faces', pts: cube.sets.faces.pts },
          edgeAxes: { name: '6 edge axes', pts: pairsOfEdges, line: true },
          verts: { name: '8 vertices', pts: cube.sets.verts.pts },
          edges: { name: '12 edges', pts: cube.sets.edges.pts },
        };
        const sameLine = (a, b) => cube.same(a, b) || cube.same(a, b.map((t) => -t));
        const act = (A, key) => { const S = SETS[key]; return S.pts.map((p) => { const q = cube.app(A, p); return S.pts.findIndex((r) => (S.line ? sameLine(r, q) : cube.same(r, q))); }); };
        const oset = v.select('objects', [{ value: 'diag', label: '4 diagonals' }, { value: 'faceAxes', label: '3 face axes' }, { value: 'faces', label: '6 faces' }, { value: 'edgeAxes', label: '6 edge axes' }, { value: 'verts', label: '8 vertices' }, { value: 'edges', label: '12 edges' }], 'faces');
        const csel = v.select('rotation', T.G.classes.map((c, i) => ({ value: i, label: `$${G.L[c.rep] === 'e' ? 'e' : G.L[c.rep]}$` })), 2);
        const Sx = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.1], equal: true, axes: false, height: 360, weight: 1.05 });
        const sc = v.scene3(Sx, { yaw: 0.6, pitch: 0.38, axis: 0, lim: 1.5, axes: false, hint: true });
        const Bs = v.stage({ x: [-0.6, 4.6], y: [-0.5, 5], axes: 'box', gutter: true, height: 360, weight: 0.95, title: 'multiplicities $m_i=\\langle\\chi,\\chi_i\\rangle$', xlabel: 'irreducible' });
        const chars = (key) => {
          const fixedAt = G.perms.map((_, g) => act(cube.rot[g], key).reduce((s, x, k) => s + (x === k ? 1 : 0), 0));
          const consistent = G.classes.every((c) => c.els.every((g) => fixedAt[g] === fixedAt[c.rep]));
          return { fixedAt, consistent, chi: G.classes.map((c) => [fixedAt[c.rep], 0]) };
        };
        const corners = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        const edgesC = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
        v.render(() => {
          const key = oset.value, S = SETS[key], g = G.classes[csel.value].rep, A = cube.rot[g], img = act(A, key);
          sc.begin();
          edgesC.forEach(([a, b]) => sc.line(corners[a], corners[b], { color: 'faint', width: 1.2 }));
          const sh = (p) => (S.line ? p.map((t) => t * 1.0) : S.pts === cube.sets.faces.pts ? p.map((t) => t * 1.0) : p);
          S.pts.forEach((p, k) => {
            const fixed = img[k] === k, col = fixed ? 'green' : 'red', q = cube.app(A, p);
            if (S.line) { sc.line(p.map((t) => -t * (key === 'faceAxes' ? 1.25 : 1)), p.map((t) => t * (key === 'faceAxes' ? 1.25 : 1)), { color: col, width: 3 }); sc.dot(p, { r: 5, color: col, fill: col }); }
            else { sc.dot(sh(p), { r: fixed ? 7 : 6, color: col, fill: col }); if (!fixed) sc.line(sh(p), sh(S.pts[img[k]]), { color: 'orange', width: 1, alpha: 0.6 }); }
            void q;
          });
          sc.flush();
          const { chi } = chars(key), m = multiplicities(G, T.rows, chi);
          Bs.setView([-0.6, T.rows.length - 0.4], [-0.5, Math.max(3, ...m.map((z) => z[0])) + 1]);
          Bs.setTicks(T.rows.map((r, i) => [i, ['trivial', 'sign', '2-dim', '3-dim', "3-dim′"][i]]), null);
          Bs.bars(m.map((z) => z[0]), { x0: 0, dx: 1, color: (_, i) => ecol(i) });
          m.forEach((z, i) => Bs.text(nm(z[0], 0), i, z[0] + 0.1, { align: 'center', baseline: 'bottom', size: 13, color: 'ink', weight: 700 }));
          Bs.hline(0, { color: 'ink', width: 1 });
        });
        v.readout(() => {
          const key = oset.value, { chi, consistent } = chars(key), m = multiplicities(G, T.rows, chi);
          const sizes = G.classes.map((c) => c.size), fixedTxt = chi.map((z, i) => `${nm(z[0], 0)}`).join(',\\ ');
          const rebuilt = G.classes.map((_, i) => T.rows.reduce((s, r, j) => s + m[j][0] * r.vals[i][0], 0));
          const err = Math.max(...rebuilt.map((x, i) => Math.abs(x - chi[i][0])));
          return `Fixed points on the classes $(${G.classes.map((c) => G.L[c.rep]).join(',\\ ')})$ of sizes $(${sizes.join(',\\ ')})$: $\\chi=(${fixedTxt})$${consistent ? '' : ' — **not constant on a class!**'}. $\\chi=${T.rows.map((r, j) => (m[j][0] > 1e-9 ? `${nm(m[j][0], 0) === '1' ? '' : nm(m[j][0], 0)}\\chi_{${r.d}${r.name.includes("'") ? "'" : r.name === 'e' ? '\\varepsilon' : ''}}` : null)).filter(Boolean).join('+')}$. Rebuilt character differs from the counted one by ${err < 1e-9 ? '0' : nm(err, 3)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'A representation is determined by its character',
      statement: String.raw`Two finite-dimensional complex representations $V,W$ of a finite group $G$ are isomorphic if and only if $\chi_V=\chi_W$.`,
      idea: String.raw`If $V\cong W$ the traces agree (3.1). Conversely, equal characters give equal multiplicities $\langle\chi_V,\chi_i\rangle=\langle\chi_W,\chi_i\rangle$ by 3.6, and by Maschke (2.2) a representation is determined up to isomorphism by those multiplicities. The isomorphism can be produced explicitly: for a generic matrix $X$, the average $T=\frac1{|G|}\sum_g\sigma(g)X\rho(g)^{-1}$ is an intertwiner. If the representations are isomorphic, an invertible average exists and generic $X$ gives one: averaging fixes every intertwiner, so its image contains an isomorphism. A particular average may still be zero or singular; it is a witness only when invertible. Non-isomorphic representations can have nonzero intertwiners if they share constituents.`,
      caption: String.raw`Left: the standard representation $\rho$ of $S_3$ moving the letter F. Right: another candidate $\sigma$ chosen from the menu. The characters of the two are printed class by class. For a generic random $X$, equal characters produce an invertible averaged intertwiner $T$: the image $T\rho(g)F$ of the moved letter coincides with $\sigma(g)$ applied to $TF$ (green outline on the right). For the unequal candidates in this menu the average is $0$, since they share no constituent with the irreducible $\rho$. Try **zero X**: equal characters still prove isomorphism, but this particular average supplies no witness. Drag the shear slider to disguise $\sigma$ further; the character does not change.`,
      deps: ['rep-3.6'],
      refs: ['Serre §2.3'],
      links: { source: 'https://math.mit.edu/~etingof/reprbook.pdf' },
      tags: ['character', 'isomorphism'],
      viz(v) {
        const T3 = tableOf('S3'), G = T3.G, rho = G.mat;
        const tsel = v.select('candidate $\\sigma$', [{ value: 'skew', label: 'standard, skewed basis' }, { value: 'rot', label: 'standard, rotated & scaled basis' }, { value: 'ge', label: '$\\mathbf 1\\oplus\\varepsilon$' }, { value: 'gg', label: '$\\mathbf 1\\oplus\\mathbf 1$' }], 'skew');
        const sh = v.slider('shear / scale', 0, 2.5, 1.2, { step: 0.05 });
        const gsl = v.select('element $g$', G.L.map((l, i) => ({ value: i, label: `$${l}$` })), 4);
        let seed = 3, zeroX = false;
        v.button('new random $X$', () => { seed += 1; zeroX = false; });
        v.button('zero X', () => { zeroX = true; });
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: true, height: 360, weight: 1, title: '$V$ with $\\rho$' });
        const B = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: true, height: 360, weight: 1, title: '$W$ with $\\sigma$' });
        const sigma = () => {
          const t = sh.value;
          let Q;
          if (tsel.value === 'skew') Q = [[1, t], [0, 1]]; else if (tsel.value === 'rot') Q = mm(rot2(0.7), [[1 + t, 0], [0, 1 / (1 + t / 2)]]); else Q = null;
          if (Q) { const Qi = (() => { const d = Q[0][0] * Q[1][1] - Q[0][1] * Q[1][0]; return [[Q[1][1] / d, -Q[0][1] / d], [-Q[1][0] / d, Q[0][0] / d]]; })(); return rho.map((M) => mm(Q, mm(M, Qi))); }
          if (tsel.value === 'ge') return G.perms.map((_, g) => [[1, 0], [0, G.isRef(g) ? -1 : 1]]);
          return G.perms.map(() => [[1, 0], [0, 1]]);
        };
        const calc = () => {
          const sg = sigma(), r = v.rng(seed), X = zeroX ? [[0,0],[0,0]] : [[r.normal(),r.normal()],[r.normal(),r.normal()]];
          const result = averageIntertwiner(rho,sg,X);
          const chS = G.classes.map(c => sg[c.rep][0][0]+sg[c.rep][1][1]), chR = G.classes.map(c => rho[c.rep][0][0]+rho[c.rep][1][1]);
          return {sg,Tm:result.T,chS,chR,det:result.det,inter:result.defect,invertible:result.invertible,same:chS.every((x,i)=>Math.abs(x-chR[i])<1e-9)};
        };
        const F = [[-0.3, -0.6], [-0.12, -0.6], [-0.12, -0.14], [0.14, -0.14], [0.14, 0.02], [-0.12, 0.02], [-0.12, 0.3], [0.3, 0.3], [0.3, 0.5], [-0.3, 0.5]].map(([x, y]) => [1.5 * x, 1.5 * y]);
        const ap = (M, P) => P.map(([x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y]);
        v.render(() => {
          const { sg, Tm, invertible, same } = calc(), g = gsl.value;
          const points = [...ap(Tm,F),...ap(Tm,ap(rho[g],F)),...ap(sg[g],ap(Tm,F))];
          const extent = 1.2 * Math.max(1,...points.flat().map(Math.abs));
          B.setView([-extent,extent],[-extent,extent]);
          A.poly(F, { color: 'muted', fill: 'muted', fillAlpha: 0.1, dash: true, width: 1.4 });
          A.poly(ap(rho[g], F), { color: 'accent', fill: 'accent', fillAlpha: 0.3, width: 2 });
          B.poly(ap(Tm, F), { color: 'muted', fill: 'muted', fillAlpha: 0.1, dash: true, width: 1.4 });
          B.poly(ap(Tm, ap(rho[g], F)), { color: 'accent', fill: 'accent', fillAlpha: 0.3, width: 2.2 });
          B.poly(ap(sg[g], ap(Tm, F)), { color: same ? 'green' : 'red', fill: false, width: 3.2, dash: [7, 5] });
          B.corner(invertible ? '$T$ is invertible' : 'this average gives no isomorphism witness', 'tl', { plate: true, color: invertible ? 'green' : 'red' });
        });
        v.legend([['muted', 'F, and $TF$', { dash: true }], ['accent', '$\\rho(g)F$, and $T\\rho(g)F$'], ['green', '$\\sigma(g)TF$ (equal when $T$ intertwines)', { dash: true }]]);
        v.readout(() => {
          const { chS, chR, det, inter, same, Tm, invertible } = calc(), cl = G.classes.map((c) => G.L[c.rep]);
          return `Characters on the classes $(${cl.join(',\\ ')})$: $\\chi_\\rho=(${chR.map((x) => nm(x, 2)).join(',\\ ')})$, $\\chi_\\sigma=(${chS.map((x) => nm(x, 2)).join(',\\ ')})$ — ${same ? '**equal**' : '**different**'}.\nAveraged $T$: $\\|T\\|=${nm(Math.hypot(...Tm.flat()), 3)}$, $\\det T=${nm(det, 3)}$, $\\max_g\\|\\sigma(g)T-T\\rho(g)\\|=${inter < 1e-9 ? '0' : nm(inter, 3)}$ — ${same ? (invertible ? 'an explicit isomorphism $\\rho\\cong\\sigma$' : 'equal characters prove isomorphism, but this average gives no invertible witness; try another X') : 'no isomorphism exists; these candidates share no constituent'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Irreducibility criterion ⟨χ, χ⟩ = 1',
      statement: String.raw`For a finite-dimensional complex representation $V\cong\bigoplus_iW_i^{\,m_i}$ of a finite group $G$ with character $\chi$, $\langle\chi,\chi\rangle=\sum_i m_i^2$. Consequently $\langle\chi,\chi\rangle$ is a nonnegative integer (positive when $V\ne0$), and $V$ is irreducible if and only if $\langle\chi,\chi\rangle=1$. More generally $\langle\chi,\chi\rangle=\dim\operatorname{End}_G(V)$.`,
      idea: String.raw`Write $\chi=\sum m_i\chi_i$ (3.6) and expand the inner product with the orthonormality 3.5: $\langle\chi,\chi\rangle=\sum_{i,j}m_im_j\langle\chi_i,\chi_j\rangle=\sum m_i^2$. A sum of squares of non-negative integers equals $1$ only if exactly one $m_i$ is $1$ and the rest vanish, which is irreducibility. The number $\sum m_i^2$ is also $\dim\operatorname{End}_G(V)$ by Schur’s lemma (2.5).`,
      caption: String.raw`The five irreducibles of $S_4$ are the sliders: choose how many copies of each to put into a representation. The coloured squares have side $m_i$, so their total area is $\langle\chi,\chi\rangle=\sum m_i^2$; the readout computes the same number directly from the character values with the class weights. Only a single unit square certifies irreducibility. The menu loads representations built from earlier items (permutation, tensor and regular representations); their multiplicities are then found by 3.6.`,
      deps: ['rep-3.6'],
      refs: ['Serre §2.3'],
      links: { source: 'https://math.mit.edu/~etingof/reprbook.pdf' },
      tags: ['irreducibility', 'character'],
      viz(v) {
        const T = tableOf('S4'), G = T.G, n = T.rows.length;
        const sl = T.rows.map((r, i) => v.slider(`multiplicity of $${r.tex}$`, 0, 5, i === 3 ? 1 : 0, { int: true }));
        const chi3 = T.rows[3].vals, sq = sqClass(G);
        const PRE = {
          perm4: { label: 'permutation on 4 points', chi: [[4, 0], [2, 0], [0, 0], [1, 0], [0, 0]] },
          vv: { label: '$\\chi_3\\otimes\\chi_3$', chi: chi3.map((z) => cmul(z, z)) },
          sym: { label: '$\\mathrm{Sym}^2\\chi_3$', chi: chi3.map((z, i) => csc(cadd(cmul(z, z), chi3[sq[i]]), 0.5)) },
          alt: { label: '$\\Lambda^2\\chi_3$', chi: chi3.map((z, i) => csc(csub(cmul(z, z), chi3[sq[i]]), 0.5)) },
          reg: { label: 'regular representation', chi: G.classes.map((c, i) => [i === 0 ? G.n : 0, 0]) },
          conj: { label: '$S_4$ acting on itself by conjugation', chi: G.classes.map((c) => [c.cent, 0]) },
        };
        const ps = v.select('load', [{ value: 'none', label: 'custom' }, ...Object.entries(PRE).map(([k, p]) => ({ value: k, label: p.label }))], 'none', {
          onChange: () => { const p = PRE[ps.value]; if (!p) return; multiplicities(G, T.rows, p.chi).forEach((m, i) => sl[i].set(Math.round(m[0]))); },
        });
        const A = v.stage({ x: [-0.3, 8], y: [-0.2, 6], equal: true, axes: false, height: 250, weight: 1.2, title: 'squares of side $m_i$' });
        const chiNow = () => G.classes.map((_, c) => T.rows.reduce((s, r, i) => cadd(s, csc(r.vals[c], sl[i].value)), [0, 0]));
        v.render(() => {
          const ms = sl.map((s) => s.value), tot = ms.reduce((s, m) => s + m * m, 0), width = ms.reduce((s, m) => s + m, 0) + 0.3 * n;
          A.setView([-0.3, Math.max(8, width + 0.3)], [-0.8, Math.max(3.2, ...ms) + 0.8]);
          let x = 0;
          ms.forEach((m, i) => {
            if (m > 0) {
              A.rect(x, 0, x + m, m, { fill: ecol(i), fillAlpha: 0.35, color: ecol(i), width: 2 });
              for (let k = 1; k < m; k++) { A.line(x + k, 0, x + k, m, { color: ecol(i), width: 0.8, alpha: 0.6 }); A.line(x, k, x + m, k, { color: ecol(i), width: 0.8, alpha: 0.6 }); }
              A.tex(`${m * m}`, x + m / 2, m / 2, { size: 15, color: 'ink' });
              A.tex(`\\chi_{${T.rows[i].tex.replace(/\\chi_/, '')}}`, x + m / 2, -0.35, { size: 12, color: ecol(i) });
            }
            x += m + 0.3;
          });
          if (tot === 1) A.corner('irreducible', 'tr', { color: 'green', plate: true }); else if (tot === 0) A.corner('the zero representation', 'tr', { color: 'muted', plate: true });
        });
        v.readout(() => {
          const ms = sl.map((s) => s.value), tot = ms.reduce((s, m) => s + m * m, 0), chi = chiNow(), direct = ip(G, chi, chi)[0], dim = chi[0][0];
          return `$\\chi=${ms.map((m, i) => (m ? `${m === 1 ? '' : m}\\chi_{${T.rows[i].tex.replace(/\\chi_/, '').replace(/^\\mathbf 1$/, '1').replace(/\\varepsilon/, 'ε')}}` : null)).filter(Boolean).join('+') || '0'}$, degree $${nm(dim, 0)}$. $\\sum m_i^2=${tot}$; directly, $\\langle\\chi,\\chi\\rangle=${nm(direct, 3)}$. ${tot === 1 ? '**Irreducible.**' : tot === 0 ? '' : `Not irreducible: it splits into ${ms.reduce((s, m) => s + m, 0)} irreducible piece(s).`}`;
        });
        void tolz; void nmc; void TAU; void cI; void trace; void homCheck; void gramRows; void tableDefect; void invClass; void actOn; void elOf; void cscale;
      },
    },
  ],
};
