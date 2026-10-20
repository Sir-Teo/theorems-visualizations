// Crystallography (Hammond; Giacovazzo) — Chapter 3: Lattices and symmetry in three dimensions
// Part 2 (this file): the 230 space groups, Wyckoff positions and site symmetry, stereographic projection, Neumann's principle,
// tensor properties and piezoelectricity (3.7–3.12). Part 1 (ch03.js) holds 3.1–3.6.
import {
  clamp, rad, deg, add, sub, mul, dot, norm, cross, unit, fmt, TAU, cellVectors, drawCell, fitScale,
  I3, mm3, mT, mv3, det3, tr3, rotM, reflM, opInfo, pointGroup, pointGroups, PG_FIRST, SYSTEMS, pgTilePos, pgTileAt, hmMath, SG, spaceGroupOps, applyOp, frac01, fracStr,
  stabilizer, orbit, snapSpecial, siteInfo, describeOp, intrinsic, dimSym2, dimPiezo, averageSym2, closure3,
} from './ch03.shared.js';

import { TOY_CRYSTALS, toyStrain, relaxNegativeSublattice, toyPolarization } from './source-audit-symmetry-indices.shared.js';

const SQ3 = Math.sqrt(3) / 2;
const isHexGroup = (n) => n >= 143 && n <= 194;
const sysOf = (n) => SG[n - 1].cs;
const FIRST = { triclinic: 1, monoclinic: 3, orthorhombic: 16, tetragonal: 75, trigonal: 143, hexagonal: 168, cubic: 195 };
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const xyMap = (hex) => (hex ? (x, y) => [x - 0.5 * y, y * SQ3] : (x, y) => [x, y]);
const xyInv = (hex) => (hex ? (X, Y) => { const y = Y / SQ3; return [X + 0.5 * y, y]; } : (X, Y) => [X, Y]);
const inv2 = (M) => { const d = M[0][0] * M[1][1] - M[0][1] * M[1][0]; return [[M[1][1] / d, -M[0][1] / d], [-M[1][0] / d, M[0][0] / d]]; };
const mv2 = (M, p) => [M[0][0] * p[0] + M[0][1] * p[1], M[1][0] * p[0] + M[1][1] * p[1]];
const near = (x, y, e = 1e-6) => Math.abs(x - y) < e;
const inCell = (p, e = 1e-6) => p[0] > -e && p[0] < 1 + e && p[1] > -e && p[1] < 1 + e;
const zero3 = (x) => Math.abs(x) < 1e-9;

/**
 * Symmetry elements of space group n seen in projection along c, in fractional (x, y): axes parallel to c (rotations, screws, rotoinversions),
 * planes parallel to c (mirrors and glides, as line segments clipped to the cell) and inversion centres. Computed from all operations: the location of each is
 * found by solving (W - I) x = t - w_loc for the integer translations t, the screw/glide part is the intrinsic translation of the operation.
 */
const elemCache = {};
function elementsOf(n) {
  if (elemCache[n]) return elemCache[n];
  const ops = spaceGroupOps(n), axes = [], lines = [], invs = [], PRI = { m: 0, a: 1, b: 1, c: 2, n: 3, d: 4, g: 5 };
  const push = (arr, item, same) => { if (!arr.some((q) => same(q, item))) arr.push(item); };
  for (const o of ops) {
    const W = o.W, vert = zero3(W[0][2]) && zero3(W[1][2]) && zero3(W[2][0]) && zero3(W[2][1]);
    const dt = Math.round(det3(W)), d = describeOp(o);
    if (dt === -1 && d.kind === 'inv') {
      for (const tx of [0, 0.5]) for (const ty of [0, 0.5]) { const c = [(-o.w[0]) / 2 + tx, (-o.w[1]) / 2 + ty].map(frac01); push(invs, c, (a, b) => near(a[0], b[0]) && near(a[1], b[1])); }
      continue;
    }
    if (!vert) continue;
    const W2 = [[W[0][0], W[0][1]], [W[1][0], W[1][1]]], g = intrinsic(o);
    if (dt === 1 && (d.kind === 'rot' || d.kind === 'screw') && near(W[2][2], 1)) {
      const M = [[1 - W2[0][0], -W2[0][1]], [-W2[1][0], 1 - W2[1][1]]], Mi = inv2(M);
      for (let tx = -1; tx <= 1; tx++) for (let ty = -1; ty <= 1; ty++) {
        const p = mv2(Mi, [o.w[0] - g[0] - tx, o.w[1] - g[1] - ty]);
        if (inCell(p, 0.5 / 1e3)) push(axes, { p, n: d.n, name: d.name, imp: false }, (a, b) => near(a.p[0], b.p[0], 1e-5) && near(a.p[1], b.p[1], 1e-5) && a.n === b.n && a.name === b.name);
      }
      continue;
    }
    if (dt === -1 && d.kind === 'rotoinv' && near(W[2][2], -1)) {
      const M = [[1 - W2[0][0], -W2[0][1]], [-W2[1][0], 1 - W2[1][1]]], Mi = inv2(M);
      for (let tx = -1; tx <= 1; tx++) for (let ty = -1; ty <= 1; ty++) {
        const p = mv2(Mi, [o.w[0] - tx, o.w[1] - ty]);
        if (inCell(p, 0.5 / 1e3)) push(axes, { p, n: d.n, name: d.name, imp: true }, (a, b) => near(a.p[0], b.p[0], 1e-5) && near(a.p[1], b.p[1], 1e-5) && a.n === b.n && a.imp === b.imp);
      }
      continue;
    }
    if (dt === -1 && d.kind !== 'rotoinv' && d.n === 2 && near(W[2][2], 1)) {
      // vertical mirror / glide: fixed lines of the in-plane reflection
      const A = [[W2[0][0] - 1, W2[0][1]], [W2[1][0], W2[1][1] - 1]], row = Math.abs(A[0][0]) + Math.abs(A[0][1]) > 0.5 ? 0 : 1;
      let e = [-A[row][1], A[row][0]];
      const gg = gcd(Math.round(Math.abs(e[0])), Math.round(Math.abs(e[1]))) || 1; e = e.map((x) => Math.round(x / gg));
      if (e[0] < 0 || (e[0] === 0 && e[1] < 0)) e = e.map((x) => -x);
      for (let tx = -2; tx <= 2; tx++) for (let ty = -2; ty <= 2; ty++) {
        const r = [tx - (o.w[0] - g[0]), ty - (o.w[1] - g[1])];
        // minimum-norm solution of A p = r (A has rank 1): p = A^T y with (A A^T) y = r restricted to the range
        // rank one: solve with the row of A that is not zero
        const k = row, a0 = A[k][0], a1 = A[k][1], nn = a0 * a0 + a1 * a1, p0 = [(a0 * r[k]) / nn, (a1 * r[k]) / nn];
        const res = [A[0][0] * p0[0] + A[0][1] * p0[1] - r[0], A[1][0] * p0[0] + A[1][1] * p0[1] - r[1]];
        if (Math.hypot(...res) > 1e-7) continue;
        const c = e[0] * p0[1] - e[1] * p0[0];
        // clip to the cell
        let s0 = -Infinity, s1 = Infinity;
        for (let q = 0; q < 2; q++) { if (zero3(e[q])) { if (p0[q] < -1e-9 || p0[q] > 1 + 1e-9) { s0 = Infinity; } } else { const a = (0 - p0[q]) / e[q], b = (1 - p0[q]) / e[q]; s0 = Math.max(s0, Math.min(a, b)); s1 = Math.min(s1, Math.max(a, b)); } }
        if (!(s0 < s1 - 1e-9)) continue;
        const type = d.name, st = { e, c, a: [p0[0] + s0 * e[0], p0[1] + s0 * e[1]], b: [p0[0] + s1 * e[0], p0[1] + s1 * e[1]], type, pri: PRI[type] ?? 5 };
        const dup = lines.find((q) => near(q.e[0], e[0]) && near(q.e[1], e[1]) && near(q.c, c, 1e-6));
        if (!dup) { st.c = c; lines.push(st); } else if (st.pri < dup.pri) Object.assign(dup, st, { c });
      }
    }
  }
  return (elemCache[n] = { axes, lines, invs });
}
const LINE_DASH = { m: null, a: [7, 4], b: [7, 4], c: [1.5, 4], n: [8, 3, 1.5, 3], d: [8, 3, 1.5, 3, 1.5, 3], g: [7, 4], e: [7, 4] };
/** Draw the symmetry elements of group n in the cell on stage s (positions through the map xy). */
function drawElements(s, n, xy, opts = {}) {
  const E = elementsOf(n), r = 0.034, poly = (c, k, rot) => Array.from({ length: k }, (_, i) => [c[0] + r * Math.cos(rot + (TAU * i) / k), c[1] + r * Math.sin(rot + (TAU * i) / k)]);
  for (const L of E.lines) s.line(...xy(...L.a), ...xy(...L.b), { color: L.type === 'm' ? 'accent' : 'green', width: L.type === 'm' ? 2.4 : 2, dash: LINE_DASH[L.type] || undefined, alpha: 0.85 });
  for (const a of E.axes) {
    const c = xy(...a.p);
    if (a.n === 2 && !a.imp) s.poly(Array.from({ length: 18 }, (_, i) => [c[0] + 1.25 * r * Math.cos((TAU * i) / 18), c[1] + 0.5 * r * Math.sin((TAU * i) / 18)]), { fill: 'ink', fillAlpha: 0.9, color: 'ink', width: 1 });
    else s.poly(poly(c, a.n, a.n === 4 ? Math.PI / 4 : Math.PI / 2), { fill: a.imp ? 'panel' : 'ink', fillAlpha: a.imp ? 0.9 : 0.9, color: 'ink', width: 1.3 });
    if (a.imp) s.dot(c[0], c[1], { r: 2.5, color: 'ink', hollow: true });
    if (opts.labels && a.name && /[₁₂₃₄₅]/.test(a.name)) s.text(a.name, c[0] + 1.2 * r, c[1] + 1.2 * r, { size: 9.5, color: 'muted', align: 'left' });
  }
  for (const c of E.invs) { const q = xy(...c); s.dot(q[0], q[1], { r: 3.6, color: 'ink', hollow: true }); }
}
const DIGITS = (n) => String(n);
const pgIndex = (pg) => pointGroups().findIndex((h) => h.hm === (pg === '-62m' ? '-6m2' : pg));

export default {
  collection: 'xtal',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'The 230 space groups',
      statement: String.raw`A **space group** is the full symmetry group of a crystal pattern in three dimensions: a group of isometries $\mathbf x\mapsto W\mathbf x+\mathbf w$ whose translations form a lattice and whose linear parts $W$ form a crystallographic point group (3.4). Counting groups up to affine equivalence (a change of axes and origin, keeping the handedness of the axes), there are exactly **230** space groups; if mirror-image (enantiomorphic) pairs such as $P4_1$ and $P4_3$ are identified there are 219. Each contains one of the 14 Bravais lattices (3.2) and is described by the Hermann–Mauguin symbol of its lattice type and point group with screw axes and glide planes written in place of rotations and mirrors ($P2_1/c$, $Pnma$, $Fd\bar3m$, …). All the images of a point in general position under the operations of one cell are the **general position**, and their number is the order of the point group times the number of lattice points in the cell.`,
      idea: String.raw`Combine the 32 point groups (3.4) with the 14 lattices (3.2) in every compatible way, and then allow each rotation or reflection to be accompanied by a translation that is a *fraction* of a lattice vector, as in screw axes and glide planes (3.6). A fractional part can be removed by shifting the origin unless the operations disagree about where the origin should be; sorting out which choices of fractional parts give genuinely different, closed (associative) systems is a finite but long cohomological calculation, finished independently by Fedorov and Schoenflies in 1891 (after some errors that they corrected in correspondence) and by Barlow in 1894 by another method. Here nothing is assumed: each group is rebuilt by multiplying a few generating operations until nothing new appears, and the size of the result is compared with the tabulated order.

Matrix composition (ladr 3.43), in one fixed coordinate basis, supplies the linear part of multiplying affine operations. Applying $(W_2,\mathbf w_2)$ and then $(W_1,\mathbf w_1)$ gives linear part $W_1W_2$ and translation $W_1\mathbf w_2+\mathbf w_1$. The finite closure computation uses this rule, reducing translations modulo the cell lattice; it checks the supplied generators and does not itself replace the classification of all 230 groups.`,
      caption: String.raw`Pick a crystal system and a group number from 1 to 230 (or type a number or a symbol like *Pnma*, *Fd-3m*). The diagram is the projection along $\mathbf c$ of the unit cell in the style of the *International Tables*: one general position (drag the gold point, set its height with the slider) is carried by **every operation** of the group into the cell; blue circles have the same handedness as the original, orange ones are mirror images (left/right-handed), and the labels give the heights $z$ ($+$ for $z$, $-$ for $-z$, ½+ for $\tfrac12+z$). The symmetry elements parallel to $\mathbf c$ are overlaid: axes as polygons (lens $=2$, triangle, square, hexagon; hollow for rotoinversion), mirror lines as solid lines, glide planes as dashed ($a,b$), dotted ($c$) and dash-dotted ($n,d$) lines, inversion centres as small rings. The bars count all operations of the cell by type.`,
      deps: ['xtal-3.2', 'xtal-3.6', 'ladr-3.43'],
      refs: ['Hammond ch. 4', 'Giacovazzo ch. 1'],
      credit: 'E. S. Fedorov and A. Schoenflies, 1891; W. Barlow, 1894',
      tags: ['space groups', 'general position', 'symmetry elements'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Space_group' },
      verify: false,
      viz(v) {
        const gSl = v.slider('space group number', 1, 230, 62, { int: true });
        let typed = 'Pnma';
        const sysSel = v.select('crystal system', Object.keys(FIRST).map((k) => ({ value: k, label: k })), 'orthorhombic', { onChange: (k) => gSl.set(FIRST[k]) });
        v.input('or type a number / symbol', typed, { width: 110, onChange: (t) => {
          typed = t; const q = t.replace(/\s+/g, '').replace(/[−–]/g, '-').toLowerCase();
          const i = /^\d+$/.test(q) ? +q : SG.findIndex((g) => g.s.toLowerCase() === q) + 1;
          if (i >= 1 && i <= 230) gSl.set(i);
        } });
        const zS = v.slider('height $z$ of the point', 0.02, 0.48, 0.13, { step: 0.01 });
        const showEl = v.toggle('symmetry elements', true);
        const showLab = v.toggle('heights', true);
        const S = v.stage({ x: [-0.2, 1.2], y: [-0.2, 1.2], equal: true, axes: false, height: 460, weight: 1.35, title: 'general position and symmetry elements (projection along c)' });
        const T = v.stage({ x: [0, 10], y: [-0.7, 8], axes: false, height: 460, weight: 0.85, title: 'the operations of one cell' });
        const hP = S.handle(0.17, 0.11, { color: 'gold', r: 8 });
        let lastHex = null, info = null;
        v.render(() => {
          const n = gSl.value, sg = SG[n - 1], hex = isHexGroup(n), xy = xyMap(hex), inv = xyInv(hex);
          sysSel.set(sg.cs);
          if (hex !== lastHex) { lastHex = hex; if (hex) S.setView([-0.75, 1.25], [-0.2, 1.1]); else S.setView([-0.2, 1.2], [-0.2, 1.2]); }
          const ops = spaceGroupOps(n), [px, py] = inv(hP.x, hP.y), p = [px, py, zS.value];
          const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map((c) => xy(...c));
          S.poly(corners, { fill: 'accent', fillAlpha: 0.04, color: 'ink', width: 1.8 });
          S.arrow(...xy(0, 0), ...xy(0.22, 0), { color: 'ink', width: 2 }); S.arrow(...xy(0, 0), ...xy(0, 0.22), { color: 'ink', width: 2 });
          const la = xy(0.26, -0.04), lb = xy(-0.06, 0.26);
          S.text('a', la[0], la[1], { size: 13, math: true, align: 'center' }); S.text('b', lb[0], lb[1], { size: 13, math: true, align: 'center' });
          if (showEl.value) drawElements(S, n, xy, { labels: true });
          // the orbit
          const imgs = [];
          for (const o of ops) {
            const q = applyOp(o, p), f = q.map(frac01);
            if (!imgs.some((t) => t.f.every((x, i) => { const d = Math.abs(x - f[i]); return Math.min(d, 1 - d) < 1e-4; }))) imgs.push({ f, o, hand: det3(o.W) > 0 });
          }
          for (const t of imgs) {
            const c = xy(t.f[0], t.f[1]);
            S.dot(c[0], c[1], { r: 8, color: t.hand ? 'accent' : 'orange', hollow: false, alpha: 0.35 });
            S.dot(c[0], c[1], { r: 8, color: t.hand ? 'accent' : 'orange', hollow: true });
            if (!t.hand) S.text(',', c[0] + 0.0, c[1] - 0.012, { size: 17, color: 'orange', align: 'center', baseline: 'middle', weight: 700 });
            if (showLab.value) {
              const W = t.o.W, pure = zero3(W[2][0]) && zero3(W[2][1]), sgn = W[2][2] > 0 ? '+' : '−', tz = frac01(t.o.w[2]);
              const lab = pure ? (tz < 1e-6 ? sgn : fracStr(tz) + sgn) : fmt(t.f[2], 2);
              S.text(lab, c[0] + 0.03, c[1] + 0.03, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
            }
          }
          // census of the operations
          const cnt = {};
          for (const o of ops) { const d = describeOp(o); const k = d.kind === 'E' ? 'identity' : d.kind === 'centring' ? 'centring translations' : d.kind; cnt[k] = (cnt[k] || 0) + 1; }
          const ORDER = [['identity', 'identity'], ['centring translations', 'centring'], ['rot', 'rotations'], ['screw', 'screw axes'], ['mirror', 'mirrors'], ['glide', 'glides'], ['inv', 'inversion'], ['rotoinv', 'rotoinversions']];
          const maxc = Math.max(...Object.values(cnt));
          ORDER.forEach(([k, lab], i) => {
            const y = 7 - i, c = cnt[k] || 0;
            T.text(lab, 3.4, y, { size: 12, align: 'right', baseline: 'middle', color: c ? 'ink' : 'faint' });
            if (c) T.rect(3.7, y - 0.3, 3.7 + (6 * c) / maxc, y + 0.3, { fill: k === 'screw' || k === 'glide' ? 'green' : 'accent', fillAlpha: 0.5, color: k === 'screw' || k === 'glide' ? 'green' : 'accent' });
            T.text(String(c), 3.8 + (6 * c) / maxc, y, { size: 12, align: 'left', baseline: 'middle', weight: 700 });
          });
          T.text(`${ops.length} operations per cell`, 5, -0.3, { size: 13, align: 'center', weight: 700 });
          S.corner(`No. ${n}  ${sg.s}`, 'tl', { size: 15, weight: 700, plate: true });
          info = { n, sg, ops: ops.length, imgs: imgs.length, cnt, gens: sg.g.length };
        });
        v.readout(() => {
          const { n, sg, ops, imgs, gens } = info, cs = sg.cs, pg = sg.pg;
          return `**No. ${n}**, $${sg.s.replace(/(\d)(\d)(?![\d/])/g, '$1_$2')}$ — ${cs}, point group $${hmMath(pg)}$. Rebuilt by multiplying ${gens} generating operation${gens === 1 ? '' : 's'} (and the lattice translations): ${ops} operations per cell ${ops === sg.N ? '= the tabulated order ✓' : '✗'}.\nA point in general position has ${imgs} images in the cell ${imgs === ops ? '= the number of operations ✓' : '(fewer than the operations: it sits on a symmetry element)'}; the cell contains ${ops / pointGroup(pgIndex(pg)).order} lattice point${ops / pointGroup(pgIndex(pg)).order > 1 ? 's' : ''}, since the order is (points in the cell) × (order of the point group $${hmMath(pg)}$ = ${pointGroup(pgIndex(pg)).order}).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Definition',
      name: 'Wyckoff positions and site symmetry',
      statement: String.raw`Let $G$ be a space group. The **site symmetry group** of a point $\mathbf x$ is the subgroup of operations of $G$ that fix $\mathbf x$ (up to lattice translations). A point is in **general position** if its site symmetry is the identity alone; otherwise it is in a **special position**, and its images under $G$ coincide in groups, so the orbit has fewer points. The **multiplicity** of a position is the number of distinct points of its orbit in one cell, $|G/\text{lattice}|\,/\,|\text{site symmetry}|$. The special positions of a space group fall into finitely many families, the **Wyckoff positions**, labelled by multiplicity and a letter in alphabetical order from the highest-symmetry position (a) to the general position (the last letter), e.g. $4c$ with site symmetry $.m.$ in $Pnma$. A position may be a fixed point, a line or a plane, with one, two or three free coordinates; atoms of a crystal structure sit on whole orbits, so the atom count of a cell is a sum of multiplicities.`,
      idea: String.raw`The images of a point $\mathbf x$ under $G$ form an orbit, and orbit–stabiliser theory says that the orbit size is the group order divided by the order of the stabiliser, which here is the site symmetry. Only points on symmetry elements have a non-trivial stabiliser: a mirror plane fixes the points on it (site symmetry $m$, multiplicity half the general one), an axis fixes the points on it (site symmetry the cyclic group of the axis), an inversion centre fixes itself. Crossing several elements gives bigger stabilisers and smaller orbits. Wyckoff (1922) tabulated the special positions of all 230 groups; modern tables (International Tables A) list them with their coordinates and site symmetries.

Apply Lagrange's coset count (alg 6.10) to the finite group of operations modulo primitive lattice translations. For the stabilizer $H$ of a point modulo that lattice, the map $gH\mapsto g\mathbf x$ is well defined and bijective onto the orbit: two operations give the same point exactly when their quotient fixes it. Thus the multiplicity is $[G:H]=|G|/|H|$. In a larger conventional cell, the operation count and the distinct orbit points both include its centring copies.`,
      caption: String.raw`Drag the gold point around the cell (and set its height $z$): the circles are its images under every operation of the group, and the symmetry elements are overlaid. With *snap* on, the point is pulled onto any symmetry element it comes close to; its copies then merge in groups and the multiplicity drops. The program **computes** the site symmetry by counting the operations that fix the point, the multiplicity as order ÷ site-symmetry order, and the Wyckoff letter by matching the orbit against the tabulated positions; the table on the right lists all positions of the group. *Next Wyckoff position* jumps to a point of each position in turn.`,
      deps: ['xtal-3.7', 'alg-6.10'],
      refs: ['Giacovazzo ch. 1'],
      credit: 'R. W. G. Wyckoff, 1922 (tables of special positions); tabulated data here: PyXtal tables after International Tables A',
      tags: ['Wyckoff positions', 'site symmetry', 'multiplicity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wyckoff_positions' },
      viz(v) {
        const gSl = v.slider('space group number', 1, 230, 123, { int: true });
        v.select('example', [{ value: 62, label: 'Pnma' }, { value: 123, label: 'P4/mmm' }, { value: 166, label: 'R-3m' }, { value: 194, label: 'P6₃/mmc' }, { value: 225, label: 'Fm-3m' }], 123, { onChange: (k) => gSl.set(+k) });
        const zS = v.slider('height $z$', 0, 0.99, 0.13, { step: 0.005 });
        const snap = v.toggle('snap to special positions', true);
        let wIdx = -1, lastN = 0, lastHex = null;
        const S = v.stage({ x: [-0.2, 1.2], y: [-0.2, 1.2], equal: true, axes: false, height: 460, weight: 1.2, title: 'orbit of the gold point in one cell (projection along c)' });
        const T = v.stage({ x: [0, 12], y: [-0.6, 10], axes: false, height: 460, weight: 1, title: 'Wyckoff positions of the group' });
        const hP = S.handle(0.17, 0.11, { color: 'gold', r: 9 });
        const ops = () => spaceGroupOps(gSl.value);
        hP.onDrag = () => {
          if (!snap.value) return;
          const n = gSl.value, hex = isHexGroup(n), inv = xyInv(hex), xy = xyMap(hex), [x, y] = inv(hP.x, hP.y);
          const q = snapSpecial(ops(), [x, y, zS.value], 0.03), [X, Y] = xy(q[0], q[1]);
          hP.set(X, Y); zS.set(((q[2] % 1) + 1) % 1);
        };
        v.button('Next Wyckoff position ▶', () => {
          const n = gSl.value, W = SG[n - 1].w; wIdx = (wIdx + 1) % W.length;
          const t = (function parse(str) { const o = []; for (const comp of str.split(',')) { let val = 0; for (const tk of comp.match(/[+-]?[^+-]+/g) || []) { const sgn = tk[0] === '-' ? -1 : 1, b = tk.replace(/^[+-]/, ''), m = b.match(/^(\d+(?:\/\d+)?)?([xyz])?$/); const c = m[1] ? (m[1].includes('/') ? +m[1].split('/')[0] / +m[1].split('/')[1] : +m[1]) : 1; val += sgn * (m[2] ? c * { x: 0.17, y: 0.29, z: 0.13 }[m[2]] : c); } o.push(val); } return o; })(W[wIdx][3]);
          const hex = isHexGroup(n), [X, Y] = xyMap(hex)(frac01(t[0]), frac01(t[1]));
          hP.set(X, Y); zS.set(frac01(t[2]));
        });
        let info = null;
        v.render(() => {
          const n = gSl.value, sg = SG[n - 1], hex = isHexGroup(n), xy = xyMap(hex), inv = xyInv(hex);
          if (hex !== lastHex) { lastHex = hex; if (hex) S.setView([-0.75, 1.25], [-0.2, 1.1]); else S.setView([-0.2, 1.2], [-0.2, 1.2]); }
          if (n !== lastN) { lastN = n; wIdx = -1; }
          const O = ops(), [px, py] = inv(hP.x, hP.y), p = [px, py, zS.value];
          S.poly([[0, 0], [1, 0], [1, 1], [0, 1]].map((c) => xy(...c)), { fill: 'accent', fillAlpha: 0.04, color: 'ink', width: 1.8 });
          drawElements(S, n, xy, {});
          const si = siteInfo(n, p), orb = si.orbit;
          for (const q of orb) { const c = xy(q[0], q[1]); S.dot(c[0], c[1], { r: 8, color: 'gold', alpha: 0.9 }); S.text(fracStr(q[2]) === '0' ? '0' : fracStr(q[2]), c[0] + 0.03, c[1] + 0.03, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' }); }
          S.corner(`No. ${n}  ${sg.s}`, 'tl', { size: 15, weight: 700, plate: true });
          // table
          const W = sg.w, rows = W.length, dy = Math.min(0.85, 9.2 / rows), fs = clamp(dy * 15, 8.5, 13);
          T.text('mult. · letter', 0.2, 9.5, { size: 11, color: 'muted', align: 'left' }); T.text('site symm.', 3.9, 9.5, { size: 11, color: 'muted', align: 'left' }); T.text('coordinates', 6.6, 9.5, { size: 11, color: 'muted', align: 'left' });
          W.forEach((w, i) => {
            const y = 8.6 - dy * i, on = si.wyckoff && si.wyckoff.letter === w[0] && si.wyckoff.mult === w[1];
            if (on) T.rect(0, y - dy / 2, 12, y + dy / 2, { fill: 'accent', fillAlpha: 0.22, stroke: false });
            T.text(`${w[1]}${w[0]}`, 0.3, y, { size: fs, align: 'left', baseline: 'middle', weight: on ? 700 : 400 });
            T.text(w[2], 4.2, y, { size: fs, align: 'left', baseline: 'middle', color: on ? 'ink' : 'muted' });
            T.text(`(${w[3].replace(/\s/g, '')})`, 6.6, y, { size: fs, align: 'left', baseline: 'middle', color: on ? 'ink' : 'muted' });
          });
          info = { n, sg, si, p, N: O.length };
        });
        v.readout(() => {
          const { sg, si, p, N } = info, w = si.wyckoff;
          return `Point $(${v.fix(p[0], 3)},\\,${v.fix(p[1], 3)},\\,${v.fix(p[2], 3)})$ in $${sg.s}$ (order ${N}): **${si.order}** operation${si.order === 1 ? '' : 's'} fix${si.order === 1 ? 'es' : ''} it, so the site symmetry has order ${si.order} and the multiplicity is ${N}/${si.order} = **${si.mult}**; the orbit has ${si.orbit.length} distinct point${si.orbit.length === 1 ? '' : 's'} in the cell ${si.orbit.length === si.mult ? '✓' : '✗'}.\n${w ? `It lies on the Wyckoff position **${w.mult}${w.letter}** with site symmetry $${w.site.replace(/-(\d)/g, '\\bar{$1}')}$ (tabulated), $(${w.text})$.` : si.order === 1 ? 'General position.' : 'No tabulated position matched (move a little).'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Method',
      name: 'Stereographic projection',
      statement: String.raw`The **stereographic projection** maps a direction $(x,y,z)$ on the unit sphere with $z\ge0$ to the point $(X,Y)=\bigl(\tfrac{x}{1+z},\tfrac{y}{1+z}\bigr)$ of the equatorial plane, by projecting from the south pole; directions with $z<0$ are plotted at $\bigl(\tfrac{x}{1-z},\tfrac{y}{1-z}\bigr)$ as open circles. It has three properties that make it the standard picture of crystal symmetry: it **preserves angles** between curves on the sphere; it maps every **circle on the sphere to a circle** (or a line) in the plane, so the plane (zone) through two face normals appears as an arc; and the projection of the **poles** (normals) of the faces of a crystal is a pattern with the symmetry of its point group. The projection does not preserve areas. To measure the angle between two poles one turns a tracing of the stereogram about its centre until both lie on one meridian of the **Wulff net** (the projection of a grid of meridians and parallels whose polar axis lies in the plane) and counts the degrees along that meridian.`,
      idea: String.raw`With centre the south pole $S$ and radius $\sqrt2$, inversion maps the sphere onto the equatorial plane in exactly this way ($|SP|\,|SP'|=2$), and inversions are conformal and send circles to circles. So the images of the great circles through two poles $P,Q$ are the circles through $P'$, $Q'$ and the antipodal pair on the primitive circle, and the angle between two such circles at $P'$ equals the dihedral angle between the planes. The net works because a meridian of a sphere whose polar axis lies in the projection plane is a great circle and the latitudes along it are the angles measured on that great circle; rotating the sheet only turns the sphere about the viewing axis, which changes no angle. For crystals, the poles of the planes $(hkl)$ are the directions of $h\mathbf a^*+k\mathbf b^*+l\mathbf c^*$, so the angles of the pattern depend on the cell (for example $c/a$) only through the reciprocal lattice.

The conformality and circle-to-circle result is the stereographic theorem geog 5.2. That item uses a tangent plane; moving the image to the equatorial plane here divides both planar coordinates by two, and choosing the opposite pole only changes the viewing convention. A uniform planar scaling preserves angles and circles. Apply the theorem separately to the stated hemisphere charts; the open-circle convention for the lower hemisphere records which chart was used.`,
      caption: String.raw`The coloured dots are the poles of the crystal's faces (filled: upper hemisphere; hollow: lower), generated by applying the full point group of the crystal system to the poles of $\{100\}$, $\{110\}$, $\{111\}$, … Choose the crystal (for tetragonal and hexagonal crystals slide $c/a$ and watch the pyramid poles move) and drag the two gold poles $P$, $Q$ (they snap to crystal poles when close). The thick arc is the zone circle through $P$ and $Q$. Switch on *rotate the net*: the Wulff net turns until the arc is one of its meridians, and the angle is **read off** from the latitudes of $P$ and $Q$ on that meridian, compared with the dot-product value. The last line measures the angle between two zone circles in the plane and on the sphere: they agree (conformality).`,
      deps: ['xtal-3.4', 'geog-5.2'],
      refs: ['Hammond ch. 12'],
      tags: ['stereographic projection', 'Wulff net', 'zones'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stereographic_projection' },
      viz(v) {
        const xs = v.select('crystal', [{ value: 'cubic', label: 'cubic' }, { value: 'tetragonal', label: 'tetragonal' }, { value: 'hexagonal', label: 'hexagonal' }], 'cubic');
        const ca = v.slider('$c/a$', 0.5, 2, 1.3, { step: 0.01 });
        const net = v.toggle('Wulff net', true), rot = v.toggle('rotate the net to read the angle', true), snap = v.toggle('snap to crystal poles', true);
        const S = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 560, title: 'stereogram' });
        const lim = (x, y) => { const r = Math.hypot(x, y); return r > 0.995 ? [(0.995 * x) / r, (0.995 * y) / r] : [x, y]; };
        const hP = S.handle(0.42, 0.12, { color: 'gold', r: 9, label: 'P', labelPos: 'ne', constrain: lim }), hQ = S.handle(-0.2, 0.5, { color: 'gold', r: 9, label: 'Q', labelPos: 'ne', constrain: lim });
        const toSph = ([X, Y]) => { const r2 = X * X + Y * Y; return [(2 * X) / (1 + r2), (2 * Y) / (1 + r2), (1 - r2) / (1 + r2)]; };
        const proj = (p) => (p[2] >= -1e-9 ? [p[0] / (1 + p[2]), p[1] / (1 + p[2])] : [p[0] / (1 - p[2]), p[1] / (1 - p[2])]);
        const FAMS = { cubic: [[1, 0, 0], [1, 1, 0], [1, 1, 1]], tetragonal: [[0, 0, 1], [1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1]], hexagonal: [[0, 0, 1], [1, 0, 0], [1, 1, 0], [1, 0, 1], [1, 1, 1]] };
        const PGI = { cubic: 31, tetragonal: 14, hexagonal: 26 }, COLS = ['accent', 'green', 'orange', 'purple', 'pink'];
        const poles = () => {
          const k = xs.value, cell = k === 'cubic' ? [1, 1, 1, 90, 90, 90] : k === 'tetragonal' ? [1, 1, ca.value, 90, 90, 90] : [1, 1, ca.value, 90, 90, 120], V = cellVectors(cell);
          const c = cross, vol = dot(V[0], c(V[1], V[2])), rec = [mul(1 / vol, c(V[1], V[2])), mul(1 / vol, c(V[2], V[0])), mul(1 / vol, c(V[0], V[1]))];
          const G = pointGroup(PGI[k]).ops, out = [];
          FAMS[k].forEach((f, fi) => {
            const n0 = unit([0, 1, 2].map((q) => f[0] * rec[0][q] + f[1] * rec[1][q] + f[2] * rec[2][q])), fam = [];
            for (const R of G) { const n = mv3(R, n0); if (!fam.some((m) => Math.hypot(m[0] - n[0], m[1] - n[1], m[2] - n[2]) < 1e-6)) fam.push(n); }
            out.push({ f, fi, list: fam });
          });
          return out;
        };
        const nearestPole = (P, all, tol) => { let best = null; for (const F of all) for (const n of F.list) { const q = n[2] >= 0 ? n : mul(-1, n); const d = Math.hypot(...sub(proj(q), P)); if (d < tol && (!best || d < best.d)) best = { d, q }; } return best; };
        let all = poles(), snapping = false;
        const onDrag = (h) => { if (snapping || !snap.value) return; const b = nearestPole([h.x, h.y], all, 0.05); if (b) { snapping = true; const pq = proj(b.q); h.set(pq[0], pq[1]); snapping = false; } };
        hP.onDrag = () => onDrag(hP); hQ.onDrag = () => onDrag(hQ);
        const rz = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
        let info = null;
        v.render(() => {
          all = poles(); ca.el.hidden = xs.value === 'cubic';
          const P = toSph([hP.x, hP.y]), Q = toSph([hQ.x, hQ.y]), th = Math.acos(clamp(dot(P, Q), -1, 1)), nPl = unit(cross(P, Q));
          // net orientation
          const dTr = unit(cross(nPl, [0, 0, 1])), alpha = rot.value ? Math.atan2(-dTr[0], dTr[1]) : 0;
          S.circle(0, 0, 1, { color: 'ink', width: 2 });
          if (net.value) {
            for (let d = -80; d <= 80; d += 10) {
              const dl = (d * Math.PI) / 180, lam = (d * Math.PI) / 180;
              const mer = [], par = [];
              for (let k = 0; k <= 90; k++) {
                const t = (-90 + 2 * k) * (Math.PI / 180);
                mer.push(rz([Math.cos(t) * Math.sin(lam), Math.sin(t), Math.cos(t) * Math.cos(lam)], alpha));
                par.push(rz([Math.cos(dl) * Math.sin(t), Math.sin(dl), Math.cos(dl) * Math.cos(t)], alpha));
              }
              S.path(mer.map((p) => (p[2] >= -1e-9 ? proj(p) : null)), { color: 'faint', width: d % 30 === 0 ? 1.2 : 0.8, alpha: 0.55 });
              S.path(par.map((p) => (p[2] >= -1e-9 ? proj(p) : null)), { color: 'faint', width: d % 30 === 0 ? 1.2 : 0.8, alpha: 0.55 });
            }
            const pol = [rz([0, 1, 0], alpha), rz([0, -1, 0], alpha)].map(proj); S.dot(pol[0][0], pol[0][1], { r: 3, color: 'muted' }); S.dot(pol[1][0], pol[1][1], { r: 3, color: 'muted' });
          }
          S.hline(0, { color: 'faint', alpha: 0.35 }); S.vline(0, { color: 'faint', alpha: 0.35 });
          // crystal poles
          for (const up of [false, true]) for (const F of all) for (const n of F.list) { if ((n[2] >= -1e-9) !== up) continue; const q = proj(n); S.dot(q[0], q[1], { r: 5, color: COLS[F.fi], hollow: !up, alpha: 0.9 }); }
          // zone circle through P, Q
          const e1 = P, e2 = unit(sub(Q, mul(dot(P, Q), P))), full = [];
          for (let k = 0; k <= 180; k++) { const t = (k * Math.PI) / 90, p = add(mul(Math.cos(t), e1), mul(Math.sin(t), e2)); full.push(p[2] >= -1e-9 ? proj(p) : null); }
          S.path(full, { color: 'accent', width: 1.6, alpha: 0.7 });
          const arc = []; for (let k = 0; k <= 60; k++) { const t = (k / 60) * th, p = add(mul(Math.cos(t), e1), mul(Math.sin(t), e2)); arc.push(proj(p)); }
          S.path(arc, { color: 'gold', width: 4.5 });
          // second zone circle through P and the fixed pole R0 = (0,1,0): conformality check
          const R0 = [0, 1, 0], n2 = unit(cross(P, R0)), tangent = (n) => unit(cross(n, P));
          const tau1 = tangent(nPl), tau2 = tangent(n2);
          const pp = proj(P), step = 1e-5, d1 = sub(proj(unit(add(P, mul(step, tau1)))), pp), d2 = sub(proj(unit(add(P, mul(step, tau2)))), pp);
          const angPlane = (Math.acos(clamp((d1[0] * d2[0] + d1[1] * d2[1]) / (Math.hypot(...d1) * Math.hypot(...d2)), -1, 1)) * 180) / Math.PI, angSph = (Math.acos(clamp(dot(tau1, tau2), -1, 1)) * 180) / Math.PI;
          const arc2 = []; { const f1 = P, f2 = unit(sub(R0, mul(dot(P, R0), P))); for (let k = 0; k <= 180; k++) { const t = (k * Math.PI) / 90, p = add(mul(Math.cos(t), f1), mul(Math.sin(t), f2)); arc2.push(p[2] >= -1e-9 ? proj(p) : null); } }
          S.path(arc2, { color: 'orange', width: 1.4, dash: [5, 4], alpha: 0.85 });
          // reading on the rotated net
          const Pn = rz(P, -alpha), Qn = rz(Q, -alpha), dP = (Math.asin(clamp(Pn[1], -1, 1)) * 180) / Math.PI, dQ = (Math.asin(clamp(Qn[1], -1, 1)) * 180) / Math.PI;
          info = { th: (th * 180) / Math.PI, dP, dQ, read: Math.abs(dP - dQ), rot: rot.value, angPlane, angSph, alpha: (alpha * 180) / Math.PI };
        });
        v.readout(() => {
          const { th, dP, dQ, read, rot: r, angPlane, angSph, alpha } = info;
          const first = r ? `Net turned by ${v.fix(alpha, 1)}° so that $P,Q$ lie on one meridian: latitudes ${v.fix(dP, 1)}° and ${v.fix(dQ, 1)}°, **read angle $PQ=${v.fix(read, 1)}^\\circ$**.` : 'Switch on *rotate the net* to read the angle from a meridian.';
          return `${first} From the dot product: ${v.fix(th, 1)}° ${r ? (Math.abs(read - th) < 0.05 ? '✓' : '✗') : ''}\nAngle between the dashed and the thick zone circles at $P$: ${v.fix(angPlane, 2)}° measured in the plane, ${v.fix(angSph, 2)}° on the sphere ✓ (conformal).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Principle',
      name: 'Neumann’s principle',
      statement: String.raw`**Neumann's principle.** The symmetry group of any macroscopic physical property of a crystal contains the point group of the crystal: if $R$ is an operation of the crystal's point group, then the property is unchanged when the crystal is transformed by $R$. For a property described by a symmetric **polar** second-rank tensor $K$ (electrical or thermal conductivity, permittivity, thermal expansion, …) this means $K=RKR^{\mathsf T}$ for every matrix $R$ of the point group, which restricts the number of independent components: **1** for the cubic groups (the property is isotropic), **2** for tetragonal, trigonal and hexagonal crystals (uniaxial: $K_{\parallel}$ and $K_\perp$ may differ), **3** for orthorhombic, **4** for monoclinic and **6** for triclinic crystals. The principle limits the symmetry of a property from below: the property may be *more* symmetric than the crystal (every ordinary polar second-rank tensor is centrosymmetric, whatever the crystal), never less. It applies to properties of the crystal as a continuum, not to the positions of its atoms, and not to a crystal under a field that breaks its symmetry.`,
      idea: String.raw`A symmetry operation $R$ of the crystal maps the crystal onto itself, so a measurement made on the transformed crystal gives the same result as on the original; but the transformed crystal gives the transformed tensor, $RKR^{\mathsf T}$, so these two must be equal. Averaging over the group, $\bar K=\tfrac1{|G|}\sum_{R}RKR^{\mathsf T}$, produces a tensor that obeys the condition (the group property makes it invariant) and equals $K$ exactly when $K$ obeyed it already; hence the invariant tensors form the image of the averaging operator, whose dimension is $\tfrac1{|G|}\sum_R\tfrac12(\operatorname{tr}^2R+\operatorname{tr}R^2)$ (the average of a character).

Invariant averaging (rep 2.8) applies to the finite real representation on symmetric polar tensors, $K\mapsto RKR^{\mathsf T}$. It proves that the average is a projection onto precisely the symmetry-allowed tensors. The symmetric-square character formula (rep 3.3) gives its trace as $\tfrac12((\operatorname{tr}R)^2+\operatorname{tr}(R^2))$, so averaging that trace gives the dimension quoted above. This counts allowed components, not their measured values or positivity.`,
      caption: String.raw`Choose a point group on the board and set a trial $3\times3$ symmetric tensor with the sliders (the six independent entries): the blue surface is its **average over the group**, the tensor Neumann's principle allows, drawn with radius proportional to the **positive part** of $K(\mathbf n)=\mathbf n^{\mathsf T}K\mathbf n$ along every direction $\mathbf n$ (with $\mathbf c$ vertical); the section panel compares it with the raw tensor. Cubic groups give a sphere, tetragonal/trigonal/hexagonal groups a surface of revolution about $\mathbf c$, orthorhombic ones three different axes, monoclinic ones one axis fixed by symmetry. Switch on *use the raw tensor* to break the hypothesis: the readout then shows how far $RKR^{\mathsf T}$ is from $K$ for the group's operations.`,
      deps: ['xtal-3.4', 'rep-2.8', 'rep-3.3'],
      refs: ['Ervin Hartmann, IUCr Teaching Pamphlet18, §§3–5, Eqs.(4.1)–(4.11),(5.3)', 'Invariant tensor projection and dimension derivation in verification report'],
      scope: String.raw`Ordinary symmetric polar tensors and conventional nonmagnetic point groups, at a state respecting that symmetry. Axial/pseudotensors and magnetic time-reversal symmetries use different transformation laws. A radial plot of $\mathbf n^{\mathsf T}K\mathbf n$ is generally not an ellipsoid. Sliders can make a non-positive tensor; negative values are displayed as zero radius, and this limitation is explicit in the readout.`,
      tags: ['Neumann’s principle', 'tensors', 'anisotropy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Neumann%27s_principle' },
      viz(v) {
        let sel = 14;
        const K = [v.slider('$K_{11}$', 0.6, 3.6, 3.3, { step: 0.05 }), v.slider('$K_{22}$', 0.6, 3.6, 1.5, { step: 0.05 }), v.slider('$K_{33}$', 0.6, 3.6, 1.2, { step: 0.05 }),
          v.slider('$K_{12}$', -0.9, 0.9, 0.5, { step: 0.05 }), v.slider('$K_{13}$', -0.9, 0.9, 0.4, { step: 0.05 }), v.slider('$K_{23}$', -0.9, 0.9, -0.4, { step: 0.05 })];
        const raw = v.toggle('use the raw tensor (break the hypothesis)', false);
        const plane = v.select('section plane', [{ value: 'xz', label: 'xz (contains c)' }, { value: 'xy', label: 'xy (⟂ c)' }, { value: 'yz', label: 'yz' }], 'xz');
        const S = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 400, weight: 1.1, title: 'value K(n) of the allowed tensor (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axes: false });
        const C = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 400, weight: 1, title: 'section through the surface' });
        const B = v.stage({ x: [-2.4, 7.3], y: [-0.5, 7.1], axes: false, height: 380, full: true, title: 'point group (click one) and its number d of independent components' });
        B.onClick((x, y) => { const i = pgTileAt(x, y); if (i >= 0) sel = i; v.invalidate(); });
        const tens = () => [[K[0].value, K[3].value, K[4].value], [K[3].value, K[1].value, K[5].value], [K[4].value, K[5].value, K[2].value]];
        const val = (T, n) => dot(n, mv3(T, n));
        let info = null;
        v.render(() => {
          const g = pointGroup(sel), T0 = tens(), Ts = averageSym2(g.ops, T0), Tshow = raw.value ? T0 : Ts;
          for (let i = 0; i < 32; i++) {
            const h = pointGroup(i), { x, y } = pgTilePos(i), on = i === sel, d = Math.round(dimSym2(h.ops));
            B.rect(x + 0.04, y + 0.06, x + 0.96, y + 0.94, { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.3 : 0.04 + 0.03 * (6 - d), color: on ? 'accent' : 'faint', width: on ? 2.2 : 1 });
            B.text('$' + hmMath(h.hm) + '$', x + 0.5, y + 0.57, { size: h.hm.length > 4 ? 9.5 : 11.5, align: 'center', baseline: 'middle' });
            B.text('d = ' + d, x + 0.5, y + 0.2, { size: 9.5, color: 'muted', align: 'center', baseline: 'middle' });
          }
          SYSTEMS.forEach((sy, k) => B.text(sy, -0.12, 6.5 - k, { size: 12, align: 'right', color: 'muted', baseline: 'middle' }));
          // surface
          const ev = v.M.eigSym(Tshow).values, ev0 = v.M.eigSym(T0).values, vmax = Math.max(...ev.map(Math.abs), ...ev0.map(Math.abs)), sc0 = 1.5 / vmax, vmin = Math.min(...ev);
          const rr = (n) => Math.max(val(Tshow, n), 0) * sc0, N = 20, M = 10;
          sc.begin();
          const pt = (i, j) => { const lam = (TAU * i) / N, phi = -Math.PI / 2 + (Math.PI * j) / M, n = [Math.cos(phi) * Math.cos(lam), Math.cos(phi) * Math.sin(lam), Math.sin(phi)]; return mul(rr(n), [n[0], n[1], n[2]]); };
          for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) sc.poly([pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)], { fill: raw.value ? 'orange' : 'accent', fillAlpha: 0.3, color: raw.value ? 'orange' : 'accent', width: 0.6, alpha: 0.7 });
          [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']].forEach(([e, l]) => { sc.arrow([0, 0, 0], mul(1.75, e), { color: 'ink', width: 1.6, head: 6, alpha: 0.8 }); sc.tex(l === 'z' ? '\\mathbf c' : l, mul(1.95, e), { size: 14 }); });
          sc.flush();
          // section
          const pl = plane.value, emb = (t) => (pl === 'xz' ? [Math.cos(t), 0, Math.sin(t)] : pl === 'xy' ? [Math.cos(t), Math.sin(t), 0] : [0, Math.cos(t), Math.sin(t)]);
          C.circle(0, 0, 0.0001, { color: 'faint' });
          for (const f of [0.5, 1, 1.5]) C.circle(0, 0, f, { color: 'faint', width: 0.8, alpha: 0.5 });
          C.hline(0, { color: 'faint', alpha: 0.4 }); C.vline(0, { color: 'faint', alpha: 0.4 });
          const crv = (Tn) => Array.from({ length: 181 }, (_, k) => { const t = (k * Math.PI) / 90, n = emb(t), r = Math.max(val(Tn, n), 0) * sc0; return [r * Math.cos(t), r * Math.sin(t)]; });
          C.path(crv(T0), { color: 'orange', width: 1.6, dash: [5, 4] }); C.path(crv(Ts), { color: 'accent', width: 2.6 });
          C.text(pl === 'xy' ? 'x' : pl === 'xz' ? 'x' : 'y', 1.62, -0.08, { size: 12, color: 'muted', align: 'right' }); C.text(pl === 'xy' ? 'y' : 'c', 0.06, 1.6, { size: 12, color: 'muted' });
          // checks
          const viol = (Tn) => Math.max(...g.ops.map((R) => { const D = mm3(mm3(R, Tn), mT(R)); let m = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m = Math.max(m, Math.abs(D[i][j] - Tn[i][j])); return m; }));
          const basis = [[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]].map((b) => { const E = [[b[0], b[3], b[4]], [b[3], b[1], b[5]], [b[4], b[5], b[2]]], A = averageSym2(g.ops, E); return [A[0][0], A[1][1], A[2][2], A[0][1], A[0][2], A[1][2]]; });
          const rank = v.M.rank(basis, 1e-9), dim = dimSym2(g.ops);
          info = { g, T0, Ts, Tshow, ev: ev.slice().sort((a, b) => b - a), viol: viol(Tshow), viol0: viol(T0), rank, dim, vmin };
        });
        v.readout(() => {
          const { g, Ts, Tshow, ev, viol, viol0, rank, dim, vmin } = info, f = (x) => (Math.abs(x) < 1e-9 ? '0' : v.fix(x, 2));
          const mat = '\\begin{pmatrix}' + Tshow.map((r) => r.map(f).join('&')).join('\\\\') + '\\end{pmatrix}';
          const nd = ev.filter((x, i) => ev.findIndex((y) => Math.abs(y - x) < 1e-6) === i).length;
          const shape = nd === 1 ? 'a sphere: isotropic' : nd === 2 ? 'a surface of revolution' : 'a quadratic radial response with three principal values';
          return `$${hmMath(g.hm)}$: the allowed tensors form a space of dimension **${v.fix(dim, 0)}** (character formula) and the averaging operator has rank **${rank}** ${Math.abs(dim - rank) < 1e-9 ? '✓' : '✗'}. Shown: $K=${mat}$ — ${raw.value ? 'the raw tensor' : 'forced zeros and equalities are visible'}; the surface is ${shape}${vmin <= 0 ? ' (not positive definite: negative radial values are shown as zero)' : ''}.\nLargest deviation $\\max_R\\|RKR^{\\mathsf T}-K\\|$: ${raw.value ? `**$${v.sci(viol, 2)}$** for the raw tensor ${viol > 1e-9 ? '— it violates Neumann’s principle for this crystal ✗' : '(already allowed)'}` : `$${v.sci(viol, 2)}$ (zero to rounding) for the averaged tensor; the raw one has $${v.sci(viol0, 2)}$`}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Concept',
      name: 'Tensor properties of crystals',
      statement: String.raw`Many physical properties relate two vector or tensor quantities linearly, and in a crystal the coefficient is a **tensor**: the current density $\mathbf j=\sigma\mathbf E$ (conductivity, $j_i=\sigma_{ij}E_j$), the electric displacement $\mathbf D=\varepsilon\mathbf E$, the heat flux $\mathbf q=-\kappa\nabla T$, the thermal strain $\varepsilon_{ij}=\alpha_{ij}\Delta T$ (a rank-2 tensor), and the stress–strain, piezoelectric and electro-optic laws with tensors of rank 4, 3 and higher. For an anisotropic crystal the vector $\mathbf j$ is in general **not parallel** to $\mathbf E$. Equilibrium (Onsager) and energy arguments make the second-rank transport and dielectric tensors **symmetric**, $\sigma_{ij}=\sigma_{ji}$, and a symmetric real tensor has three real eigenvalues and mutually orthogonal **principal axes**: along a principal axis $\mathbf j\parallel\mathbf E$, and in the principal frame $\sigma=\operatorname{diag}(\sigma_1,\sigma_2,\sigma_3)$. By Neumann's principle (3.10) the crystal system fixes how many of these are independent and how the axes are tied to the crystal axes: cubic — $\sigma_1=\sigma_2=\sigma_3$; uniaxial — $\sigma_1=\sigma_2$, axis along $\mathbf c$; orthorhombic — three different values along the crystal axes; monoclinic — one axis along the 2-fold axis, the other two anywhere in the perpendicular plane; triclinic — three axes in no fixed relation to the cell.`,
      idea: String.raw`Writing $\mathbf j=\sigma\mathbf E$ in coordinates gives a matrix equation, and the real spectral theorem (item 7.29 of linear algebra) says a real symmetric matrix has an orthonormal basis of eigenvectors with real eigenvalues. In that basis the law decouples into three scalar laws $j_k=\sigma_kE_k$, so $\mathbf j$ is parallel to $\mathbf E$ exactly when $\mathbf E$ lies along an eigenvector (or in an eigenspace with equal eigenvalues). The set of $\mathbf j=\sigma\mathbf E$ for unit $\mathbf E$ is an ellipsoid with semi-axes $\sigma_k$ along the principal axes, and the dissipated power $\mathbf j\cdot\mathbf E=\mathbf E^{\mathsf T}\sigma\mathbf E$ is positive when all $\sigma_k>0$ (second law). Which directions the principal axes may point in is decided by the point group: a 2-fold axis or a mirror normal is always a principal axis, in cubic crystals every direction is. Tensor properties were put on a systematic footing for crystals by Voigt (1910).`,
      caption: String.raw`Choose the crystal class (the trial tensor is replaced by its group average, as in 3.10, so only the symmetry-allowed form survives), the plane in which the field lies, and drag the gold handle $\mathbf E$ around its circle. The ellipse is the set of all currents $\mathbf j=\sigma\mathbf E$ for $|\mathbf E|=1$; dashed lines are its principal axes, found by diagonalising the symmetric tensor; the right plot shows the angle $\delta$ between $\mathbf j$ and $\mathbf E$ for every field direction. For cubic crystals the ellipse is a circle (no preferred direction); for a monoclinic crystal in the plane perpendicular to the 2-fold axis the principal axes are tilted off the crystal axes; and for any class $\delta=0$ exactly along the principal axes.`,
      deps: ['xtal-3.10', 'ladr-7.29'],
      refs: ['Hammond ch. 14', 'Giacovazzo ch. 10'],
      credit: 'W. Voigt, Lehrbuch der Kristallphysik, 1910',
      tags: ['tensors', 'anisotropy', 'principal axes'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Anisotropy' },
      viz(v) {
        const CLS = { cubic: 31, tetragonal: 14, orthorhombic: 7, monoclinic: 4, triclinic: 1 };
        const cls = v.select('crystal class', [{ value: 'cubic', label: 'cubic m3̄m' }, { value: 'tetragonal', label: 'tetragonal 4/mmm' }, { value: 'orthorhombic', label: 'orthorhombic mmm' }, { value: 'monoclinic', label: 'monoclinic 2/m' }, { value: 'triclinic', label: 'triclinic 1̄' }], 'monoclinic');
        const plane = v.select('plane of the field', [{ value: 'xy', label: 'xy (⟂ c)' }, { value: 'xz', label: 'xz (contains c)' }], 'xy');
        const K = [v.slider('$\\sigma_{11}$', 0.6, 3.6, 3.2, { step: 0.05 }), v.slider('$\\sigma_{22}$', 0.6, 3.6, 1.4, { step: 0.05 }), v.slider('$\\sigma_{33}$', 0.6, 3.6, 2.2, { step: 0.05 }),
          v.slider('$\\sigma_{12}$', -1, 1, 0.8, { step: 0.05 }), v.slider('$\\sigma_{13}$', -1, 1, 0.5, { step: 0.05 }), v.slider('$\\sigma_{23}$', -1, 1, -0.4, { step: 0.05 })];
        const A = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, axes: false, height: 440, weight: 1.15, title: 'field E and current j in the chosen plane' });
        const Bst = v.stage({ x: [0, 360], y: [-60, 60], axes: 'box', gutter: true, xlabel: 'direction of E (°)', ylabel: 'angle δ between j and E (°)', height: 440, weight: 1, title: 'how far j is from E' });
        const h = A.handle(2.1, 1.2, { color: 'gold', r: 9, label: 'E', labelPos: 'ne', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(2.4 * x) / r, (2.4 * y) / r]; } });
        v.button('E → a principal axis', () => { const T = info.Ts, sub = info.sub, e = v.M.eigSym(sub).vecs[0]; h.set(2.4 * e[0], 2.4 * e[1]); });
        let info = null;
        const emb = (pl, u) => (pl === 'xy' ? [u[0], u[1], 0] : [u[0], 0, u[1]]), prj = (pl, p) => (pl === 'xy' ? [p[0], p[1]] : [p[0], p[2]]);
        v.render(() => {
          const pl = plane.value, g = pointGroup(CLS[cls.value]), T0 = [[K[0].value, K[3].value, K[4].value], [K[3].value, K[1].value, K[5].value], [K[4].value, K[5].value, K[2].value]];
          const Ts = averageSym2(g.ops, T0), s2 = [[prj(pl, Ts.map((r) => r[0]))[0] * 0, 0], [0, 0]];
          void s2;
          const idx = pl === 'xy' ? [0, 1] : [0, 2], sub = [[Ts[idx[0]][idx[0]], Ts[idx[0]][idx[1]]], [Ts[idx[1]][idx[0]], Ts[idx[1]][idx[1]]]], R = 2.4, sc = 0.9;
          for (const f of [1, 2, 3]) A.circle(0, 0, f, { color: 'faint', width: 0.7, alpha: 0.5 });
          A.arrow(-3.2, 0, 3.2, 0, { color: 'faint', width: 1, head: 6 }); A.arrow(0, -3.2, 0, 3.2, { color: 'faint', width: 1, head: 6 });
          A.text(pl === 'xy' ? 'a (x)' : 'a (x)', 3.15, -0.3, { size: 12, color: 'muted', align: 'right' }); A.text(pl === 'xy' ? 'b (y)' : 'c (z)', 0.15, 3.2, { size: 12, color: 'muted' });
          // ellipse of currents for unit E
          const ell = Array.from({ length: 181 }, (_, k) => { const t = (k * Math.PI) / 90, j = mv3(Ts, emb(pl, [Math.cos(t), Math.sin(t)])), q = prj(pl, j); return [q[0] * sc * R / 2.4 * 1, q[1] * sc * R / 2.4 * 1]; });
          A.poly(ell, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 2.2 });
          const ev = v.M.eigSym(sub);
          ev.vecs.forEach((e, i) => { A.line(-3 * e[0], -3 * e[1], 3 * e[0], 3 * e[1], { color: 'purple', width: 1.4, dash: [6, 4], alpha: 0.8 }); A.text(`σ${i + 1}=${v.fix(ev.values[i], 2)}`, 2.7 * e[0] + 0.05, 2.7 * e[1] + 0.05, { size: 11, color: 'purple', align: 'left' }); });
          const ex = h.x / R, ey = h.y / R, E3 = emb(pl, [ex, ey]), j3 = mv3(Ts, E3), j2 = prj(pl, j3), jout = pl === 'xy' ? j3[2] : j3[1];
          A.arrow(0, 0, ex * R, ey * R, { color: 'gold', width: 3.2, head: 10 });
          A.arrow(0, 0, j2[0] * sc * R / 2.4 * 1, j2[1] * sc * R / 2.4 * 1, { color: 'green', width: 3.2, head: 10 });
          A.text('j', j2[0] * sc * R / 2.4 + 0.12, j2[1] * sc * R / 2.4 + 0.12, { size: 14, color: 'green', math: true });
          const ang = (p, q) => Math.atan2(p[0] * q[1] - p[1] * q[0], p[0] * q[0] + p[1] * q[1]);
          const delta = (ang([ex, ey], j2) * 180) / Math.PI, power = dot(E3, j3);
          // delta(phi)
          const curve = [];
          for (let k = 0; k <= 360; k += 2) { const t = (k * Math.PI) / 180, e = [Math.cos(t), Math.sin(t)], j = prj(pl, mv3(Ts, emb(pl, e))); curve.push([k, (ang(e, j) * 180) / Math.PI]); }
          Bst.hline(0, { color: 'faint', alpha: 0.6 });
          Bst.path(curve, { color: 'green', width: 2.4 });
          const phi = (((Math.atan2(ey, ex) * 180) / Math.PI) + 360) % 360;
          Bst.vline(phi, { color: 'gold', width: 1.4, alpha: 0.8 }); Bst.dot(phi, delta, { r: 6, color: 'gold' });
          for (const e of ev.vecs) for (const k of [0, 180]) { const a = (((Math.atan2(e[1], e[0]) * 180) / Math.PI) + 360 + k) % 360; Bst.dot(a, 0, { r: 4, color: 'purple', hollow: true }); }
          info = { Ts, sub, delta, power, jout, jn: Math.hypot(...j3), ev, ev3: v.M.eigSym(Ts).values, g, phi, tilt: (Math.atan2(2 * sub[0][1], sub[0][0] - sub[1][1]) * 90) / Math.PI };
        });
        v.readout(() => {
          const { delta, power, jout, jn, ev3, g, phi, tilt, sub } = info;
          const iso = Math.abs(ev3[0] - ev3[2]) < 1e-9;
          return `$${hmMath(g.hm)}$: principal values of the 3D tensor $\\sigma_1,\\sigma_2,\\sigma_3=${ev3.map((x) => v.fix(x, 2)).join(',\\ ')}$${iso ? ' (all equal: isotropic)' : ''}. Field at ${v.fix(phi, 0)}°: $|\\mathbf j|=${v.fix(jn, 2)}$, angle between $\\mathbf j$ and $\\mathbf E$ in the plane **${v.fix(Math.abs(delta), 1)}°**${Math.abs(jout) > 1e-9 ? `, plus a component $${v.fix(jout, 2)}$ out of the plane` : ''}; power $\\mathbf j\\cdot\\mathbf E=${v.fix(power, 2)}>0$ ${power > 0 ? '✓' : '✗'}.\nThe in-plane principal axes of the block $\\begin{pmatrix}${v.fix(sub[0][0], 2)}&${v.fix(sub[0][1], 2)}\\\\${v.fix(sub[1][0], 2)}&${v.fix(sub[1][1], 2)}\\end{pmatrix}$ are turned by ${v.fix(Math.abs(tilt), 1)}° from the crystal axes${Math.abs(sub[0][1]) < 1e-9 ? ' (fixed by symmetry: 0°)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Phenomenon',
      name: 'Piezoelectricity requires a lack of inversion symmetry',
      statement: String.raw`In a **piezoelectric** crystal a mechanical stress produces an electric polarisation, $P_i=d_{ijk}\sigma_{jk}$ (direct effect; $d_{ijk}=d_{ikj}$, a polar third-rank tensor symmetric in its last two indices with at most 18 independent components), and conversely an applied field produces a strain (converse effect). A crystal can be piezoelectric only if its point group has **no centre of inversion**: of the 32 crystallographic point groups, 11 are centrosymmetric and all 11 have $d_{ijk}=0$; of the 21 non-centrosymmetric groups, 20 allow the effect and only the cubic group $432$ does not, because its rotations force every component to vanish. The effect is linear and **changes sign** when the stress changes sign (squeezing versus stretching); the symmetry allows coefficients but does not require that a particular allowed coefficient be nonzero. The number of independent coefficients depends on the group (for example 1 for $\bar6m2$ and $\bar43m$, 2 for $32$ and $\bar42m$, 18 for $1$).`,
      idea: String.raw`Under inversion $\mathbf x\mapsto-\mathbf x$ a polar vector changes sign, $P\to-P$, while a stress or strain (a second-rank tensor, two sign changes) does not. If the crystal has an inversion centre, the law $P_i=d_{ijk}\sigma_{jk}$ must hold in the inverted crystal, which is the same crystal, with $-P_i=d_{ijk}\sigma_{jk}$, so $P=-P=0$: the third-rank tensor is odd and Neumann's principle (3.10) kills it. For non-centrosymmetric groups the invariant tensors are the group average of $d_{ijk}$ over the matrices $R\otimes R\otimes R$ and the dimension is the average of $\operatorname{tr}R\cdot\tfrac12(\operatorname{tr}^2R+\operatorname{tr}R^2)$; the program computes it for all 32 groups. Physically the strain moves positive and negative ions relative to each other; without a centre of inversion their dipoles no longer cancel.

The last two indices are symmetric, so the coefficient space is $V\otimes\mathrm{Sym}^2V$ for the real polar-vector representation $V$. The tensor-product and symmetric-square character formulas (rep 3.3) give the product of traces used above. Averaging projects onto its invariant subspace (rep 2.8); under inversion this entire odd-rank space changes sign, so its invariant part is zero. A positive allowed dimension permits coefficients but does not force a nonzero material response.`,
      caption: String.raw`Left: the 32 point groups coloured by the computed number of independent piezoelectric coefficients (grey: centrosymmetric, so zero; green: allowed; the one non-centrosymmetric group with zero is $432$, in red). Right: a toy model of the mechanism, **not** a quartz calculation: two-dimensional ionic crystals of $+$ and $-$ point charges joined by springs. Choose a *honeycomb* crystal (like a boron nitride sheet, no inversion centre) or a *square checkerboard* (an inversion centre on every ion), set the direction and size of a uniaxial strain, and let the ions relax: the positive and negative sublattices shift against each other by the computed internal displacement. Honeycomb: a polarisation appears and reverses when stretching becomes squeezing; checkerboard: it is exactly zero. Switch on *inversion test* to see why.`,
      deps: ['xtal-3.10', 'rep-2.8', 'rep-3.3'],
      refs: ['Ervin Hartmann, IUCr Teaching Pamphlet18, §§3–4, Eq.(3.13), polar tensor invariance Eq.(4.10)', 'Explicit18-component invariant-space and toy spring-energy derivations in verification report'],
      scope: String.raw`Linear bulk response at a symmetry-preserving reference state, conventional nonmagnetic point groups. The board computes symmetry-allowed stress coefficients; the independent 2D spring toy computes a strain response, not a measured material coefficient. Its relative shift moves negative charges by $\mathbf u$, giving a dipole change $-q\mathbf u$ per cell. The affine baseline is chosen nonpolar; nonlinear strains, surfaces, field gradients and quantum polarization are outside this illustration.`,
      tags: ['piezoelectricity', 'inversion symmetry', 'tensors'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Piezoelectricity' },
      viz(v) {
        let sel = pointGroups().findIndex((g) => g.hm === '32');
        const XTAL = v.select('toy crystal', [{ value: 'hc', label: 'honeycomb (B⁺N⁻)' }, { value: 'sq', label: 'square checkerboard' }], 'hc');
        const th = v.slider('strain direction $\\theta$ (°)', 0, 180, 30, { step: 1 });
        const e0 = v.slider('uniaxial strain $\\varepsilon_0$ (%)', -6, 6, 4, { step: 0.1 });
        const ex = v.slider('exaggeration of the picture', 1, 12, 6, { step: 0.5 });
        const invT = v.toggle('inversion test', false);
        const Bd = v.stage({ x: [-2.4, 7.3], y: [-0.5, 7.1], axes: false, height: 400, weight: 1, title: 'the 32 point groups: independent piezoelectric coefficients' });
        const M = v.stage({ x: [-6, 6], y: [-4.4, 4.4], equal: true, axes: false, height: 400, weight: 1.15, title: 'toy model: ions relaxing under uniaxial strain' });
        const Cv = v.stage({ x: [0, 180], y: [-0.6, 0.6], axes: 'box', gutter: {l:85}, xlabel: 'strain direction θ (°)', ylabel: 'polarisation P (units q/ℓ)', height: 250, full: true, title: 'polarisation for a strain of the chosen size, all directions' });
        Bd.onClick((x, y) => { const i = pgTileAt(x, y); if (i >= 0) sel = i; v.invalidate(); });
        const MODEL=TOY_CRYSTALS, strain=toyStrain, relax=relaxNegativeSublattice;
        const polar=(md,t,e)=>toyPolarization(md,relax(md,strain(t,e)));
        // does the (undistorted) structure have a centre of inversion?  test every centre (r_i + r_j)/2 of two like ions
        const atoms = (md) => { const out = []; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const R = [i * md.a1[0] + j * md.a2[0], i * md.a1[1] + j * md.a2[1]]; if (md === MODEL.hc) { out.push({ r: R, q: 1 }); out.push({ r: [R[0] + md.bonds[0][0], R[1] + md.bonds[0][1]], q: -1 }); } else { out.push({ r: R, q: 1 }); out.push({ r: [R[0] + 1, R[1]], q: -1 }); } } return out; };
        // Analytic two-sublattice test: inversion about a positive site preserves
        // negative sites iff2delta belongs to the Bravais lattice. For the square
        // delta=(1,0),2delta=a1+a2; for honeycomb delta=(0,1), its a2 coefficient is4/3.
        const centreOf = { hc: null, sq: [0,0] };
        let info = null;
        v.render(() => {
          const key = XTAL.value, md = MODEL[key], t = (th.value * Math.PI) / 180, e = e0.value / 100, eps = strain(t, e), u = relax(md, eps), Pv = toyPolarization(md,u);
          // board
          const status = (g) => (g.centro ? 'c' : g.hm === '432' ? 'z' : 'p');
          for (let i = 0; i < 32; i++) {
            const g = pointGroup(i), { x, y } = pgTilePos(i), on = i === sel, st = status(g), d = Math.round(dimPiezo(g.ops));
            Bd.rect(x + 0.04, y + 0.06, x + 0.96, y + 0.94, { fill: st === 'p' ? 'green' : st === 'z' ? 'red' : 'muted', fillAlpha: st === 'p' ? 0.1 + 0.025 * d : st === 'z' ? 0.35 : 0.12, color: on ? 'accent' : 'faint', width: on ? 2.6 : 1 });
            Bd.text('$' + hmMath(g.hm) + '$', x + 0.5, y + 0.57, { size: g.hm.length > 4 ? 9.5 : 11.5, align: 'center', baseline: 'middle' });
            Bd.text(st === 'c' ? '0' : 'd = ' + d, x + 0.5, y + 0.2, { size: 9.5, color: 'muted', align: 'center', baseline: 'middle' });
          }
          SYSTEMS.forEach((sy, k) => Bd.text(sy, -0.12, 6.5 - k, { size: 12, align: 'right', color: 'muted', baseline: 'middle' }));
          // toy crystal, original (faint) and strained
          const Ie = [[1 + ex.value * eps[0][0], ex.value * eps[0][1]], [ex.value * eps[1][0], 1 + ex.value * eps[1][1]]], map = (r) => [Ie[0][0] * r[0] + Ie[0][1] * r[1], Ie[1][0] * r[0] + Ie[1][1] * r[1]];
          const at = atoms(md).filter((a) => Math.abs(a.r[0]) < 5.2 && Math.abs(a.r[1]) < 4.2);
          const posOf = (a, def) => { if (!def) return a.r; const m = map(a.r); return a.q < 0 ? [m[0] + ex.value * u[0], m[1] + ex.value * u[1]] : m; };
          const pos0 = at.filter((a) => a.q > 0);
          const extent=at.flatMap(a=>[a.r,posOf(a,true)]);
          for(const a of pos0)for(const b of md.bonds){const p=[a.r[0]+b[0],a.r[1]+b[1]],q=map(p);extent.push(p,[q[0]+ex.value*u[0],q[1]+ex.value*u[1]]);}
          extent.push([-5,-4.15],[-5+Pv[0]*(3.2/.014),-3.7+Pv[1]*(3.2/.014)]);
          const mx=Math.max(6,...extent.map(p=>Math.abs(p[0])))+.6,my=Math.max(4.4,...extent.map(p=>Math.abs(p[1])))+.6;M.setView([-mx,mx],[-my,my]);
          for (const a of pos0) for (const b of md.bonds) {
            const n0 = md === MODEL.hc ? [a.r[0] + b[0], a.r[1] + b[1]] : [a.r[0] + b[0], a.r[1] + b[1]];
            if (md === MODEL.hc) { M.segment(a.r, n0, { color: 'faint', width: 1, alpha: 0.55 }); }
            else M.segment(a.r, n0, { color: 'faint', width: 1, alpha: 0.55 });
            const p = posOf(a, true), qn = map(n0), q2 = [qn[0] + ex.value * u[0], qn[1] + ex.value * u[1]];
            M.segment(p, q2, { color: 'ink', width: 1.8, alpha: 0.7 });
          }
          for (const a of at) { const p = posOf(a, true); M.dot(p[0], p[1], { r: a.q > 0 ? 8 : 6.5, color: a.q > 0 ? 'accent' : 'orange', alpha: 0.95 }); }
          // inversion test: the structure inverted through the best centre
          if (invT.value) {
            const c = centreOf[key] || (key === 'hc' ? [0, 0.5 * 1] : [0, 0]), ok = !!centreOf[key], c2 = ok ? c : [md.bonds[0][0] / 2 * 0, 0.5];
            let mism = 0;
            for (const a of at) { const r = [2 * c2[0] - a.r[0], 2 * c2[1] - a.r[1]]; const same = atoms(md).some((b) => b.q === a.q && Math.hypot(b.r[0] - r[0], b.r[1] - r[1]) < 1e-6); if (!same) mism++; if (Math.abs(r[0]) < 5 && Math.abs(r[1]) < 4) M.dot(r[0], r[1], { r: a.q > 0 ? 12 : 10, color: a.q > 0 ? 'accent' : 'orange', hollow: true, alpha: same ? 0.5 : 1 }); }
            M.dot(c2[0], c2[1], { r: 6, color: 'ink', hollow: true }); M.text(ok ? 'inversion centre' : 'trial centre', c2[0] + 0.15, c2[1] + 0.2, { size: 11, color: 'muted', align: 'left' });
            M.corner(ok ? 'inverted crystal coincides with the original' : `inversion fails: ${mism}/${at.length} shown ions mismatch`, 'bl', { size: 11, color: ok ? 'green' : 'red', weight: 700, plate: true });
          }
          // polarisation arrow
          const kP = (3.2 / 0.014);
          M.arrow(-5, -3.7, -5 + Pv[0] * kP, -3.7 + Pv[1] * kP, { color: 'green', width: 4, head: 11 });
          M.text('P (scale: 3.2 = 0.014 q/ℓ)', -5, -4.15, { size: 11, color: 'green', align: 'left' });
          // curve of P versus theta
          const cx = [], cy = [];
          for (let k = 0; k <= 180; k += 2) { const p = polar(md, (k * Math.PI) / 180, e); cx.push([k, p[0]]); cy.push([k, p[1]]); }
          const pm = Math.max(1e-4, ...cx.map((q) => Math.abs(q[1])), ...cy.map((q) => Math.abs(q[1]))) * 1.35;
          Cv.setView([0, 180], [-pm, pm]);
          Cv.hline(0, { color: 'faint', alpha: 0.6 });
          Cv.path(cx, { color: 'accent', width: 2.2 }); Cv.path(cy, { color: 'orange', width: 2.2 });
          Cv.vline(th.value, { color: 'gold', alpha: 0.8 });
          Cv.text('P_x', 170, cx[85][1] + .12*pm, { size: 12, color: 'accent', align: 'right' }); Cv.text('P_y', 170, cy[85][1] - .12*pm, { size: 12, color: 'orange', align: 'right' });
          // response matrix of the model (P = d eps), from unit strains
          const unit = (i, j) => { const E = [[0, 0], [0, 0]]; E[i][j] = 1; if (i !== j) E[j][i] = 1; return E; };
          const resp = [unit(0, 0), unit(1, 1), unit(0, 1)].map((E) => { const uu = relax(md, E); return toyPolarization(md,uu); });
          const g = pointGroup(sel);
          info = { key, Pv, u, centre: centreOf[key], resp, g, e: e0.value, th: th.value, d: Math.round(dimPiezo(g.ops)) };
        });
        v.readout(() => {
          const { key, Pv, u, centre, resp, g, e, th: tt, d } = info, f = (x) => (Math.abs(x) < 1e-12 ? '0' : v.fix(x, 3));
          const st = g.centro ? `centrosymmetric: $d_{ijk}=0$` : g.hm === '432' ? 'non-centrosymmetric, yet all components vanish by the rotations of 432' : `$${d}$ independent coefficient${d === 1 ? '' : 's'}`;
          const quartz = g.hm === '32' ? ' Class 32 allows two independent stress-response coefficients; the 2D toy is a separate illustration.' : '';
          return `**Class $${hmMath(g.hm)}$**: ${st}.${quartz}\n**Toy ${key === 'hc' ? 'honeycomb' : 'checkerboard'}**, strain $\\varepsilon_0=${v.fix(e, 1)}\\%$ at $\\theta=${tt}^\\circ$: internal displacement $\\mathbf u=(${f(u[0])},${f(u[1])})\\,\\ell$, polarisation $\\mathbf P=-q\\mathbf u/A=(${f(Pv[0])},${f(Pv[1])})\\,q/\\ell$ ${Math.hypot(...Pv) < 1e-12 ? (e===0?'— zero imposed strain; this does not diagnose inversion symmetry':centre?'— zero response, as required by inversion symmetry':'— this input gives zero response; no inversion centre') : '— nonzero: no inversion centre' + (key === 'hc' ? ' ✓' : '')}. Reverse the strain and $\\mathbf P$ reverses.\nResponse to unit strains $(\\varepsilon_{xx},\\varepsilon_{yy},\\varepsilon_{xy})$: $P_x=(${f(resp[0][0])},${f(resp[1][0])},${f(resp[2][0])})$, $P_y=(${f(resp[0][1])},${f(resp[1][1])},${f(resp[2][1])})$ — ${key === 'hc' ? 'one coefficient in all, like the single $d$ of the point group $\\bar6m2$ of a flat honeycomb' : 'all zero'}.`;
        });
      },
    },
  ],
};
