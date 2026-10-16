// Crystallography (Hammond; Giacovazzo) — Chapter 3: Lattices and symmetry in three dimensions
// Part 2 (this file): the 230 space groups, Wyckoff positions and site symmetry, stereographic projection, Neumann's principle,
// tensor properties and piezoelectricity (3.7–3.12). Part 1 (ch03.js) holds 3.1–3.6.
import {
  clamp, rad, deg, add, sub, mul, dot, norm, cross, unit, fmt, TAU, cellVectors, drawCell, fitScale,
  I3, mm3, mT, mv3, det3, tr3, rotM, reflM, opInfo, pointGroup, pointGroups, PG_FIRST, SYSTEMS, pgTilePos, pgTileAt, hmMath, SG, spaceGroupOps, applyOp, frac01, fracStr,
  stabilizer, orbit, snapSpecial, siteInfo, describeOp, intrinsic, dimSym2, dimPiezo, averageSym2, closure3,
} from './ch03.shared.js';

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
      idea: String.raw`Combine the 32 point groups (3.4) with the 14 lattices (3.2) in every compatible way, and then allow each rotation or reflection to be accompanied by a translation that is a *fraction* of a lattice vector, as in screw axes and glide planes (3.6). A fractional part can be removed by shifting the origin unless the operations disagree about where the origin should be; sorting out which choices of fractional parts give genuinely different, closed (associative) systems is a finite but long cohomological calculation, finished independently by Fedorov and Schoenflies in 1891 (after some errors that they corrected in correspondence) and by Barlow in 1894 by another method. Here nothing is assumed: each group is rebuilt by multiplying a few generating operations until nothing new appears, and the size of the result is compared with the tabulated order.`,
      caption: String.raw`Pick a crystal system and a group number from 1 to 230 (or type a number or a symbol like *Pnma*, *Fd-3m*). The diagram is the projection along $\mathbf c$ of the unit cell in the style of the *International Tables*: one general position (drag the gold point, set its height with the slider) is carried by **every operation** of the group into the cell; blue circles have the same handedness as the original, orange ones are mirror images (left/right-handed), and the labels give the heights $z$ ($+$ for $z$, $-$ for $-z$, ½+ for $\tfrac12+z$). The symmetry elements parallel to $\mathbf c$ are overlaid: axes as polygons (lens $=2$, triangle, square, hexagon; hollow for rotoinversion), mirror lines as solid lines, glide planes as dashed ($a,b$), dotted ($c$) and dash-dotted ($n,d$) lines, inversion centres as small rings. The bars count all operations of the cell by type.`,
      deps: ['xtal-3.2', 'xtal-3.6'],
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
      idea: String.raw`The images of a point $\mathbf x$ under $G$ form an orbit, and orbit–stabiliser theory says that the orbit size is the group order divided by the order of the stabiliser, which here is the site symmetry. Only points on symmetry elements have a non-trivial stabiliser: a mirror plane fixes the points on it (site symmetry $m$, multiplicity half the general one), an axis fixes the points on it (site symmetry the cyclic group of the axis), an inversion centre fixes itself. Crossing several elements gives bigger stabilisers and smaller orbits. Wyckoff (1922) tabulated the special positions of all 230 groups; modern tables (International Tables A) list them with their coordinates and site symmetries.`,
      caption: String.raw`Drag the gold point around the cell (and set its height $z$): the circles are its images under every operation of the group, and the symmetry elements are overlaid. With *snap* on, the point is pulled onto any symmetry element it comes close to; its copies then merge in groups and the multiplicity drops. The program **computes** the site symmetry by counting the operations that fix the point, the multiplicity as order ÷ site-symmetry order, and the Wyckoff letter by matching the orbit against the tabulated positions; the table on the right lists all positions of the group. *Next Wyckoff position* jumps to a point of each position in turn.`,
      deps: ['xtal-3.7'],
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
      idea: String.raw`With centre the south pole $S$ and radius $\sqrt2$, inversion maps the sphere onto the equatorial plane in exactly this way ($|SP|\,|SP'|=2$), and inversions are conformal and send circles to circles. So the images of the great circles through two poles $P,Q$ are the circles through $P'$, $Q'$ and the antipodal pair on the primitive circle, and the angle between two such circles at $P'$ equals the dihedral angle between the planes. The net works because a meridian of a sphere whose polar axis lies in the projection plane is a great circle and the latitudes along it are the angles measured on that great circle; rotating the sheet only turns the sphere about the viewing axis, which changes no angle. For crystals, the poles of the planes $(hkl)$ are the directions of $h\mathbf a^*+k\mathbf b^*+l\mathbf c^*$, so the angles of the pattern depend on the cell (for example $c/a$) only through the reciprocal lattice.`,
      caption: String.raw`The coloured dots are the poles of the crystal's faces (filled: upper hemisphere; hollow: lower), generated by applying the full point group of the crystal system to the poles of $\{100\}$, $\{110\}$, $\{111\}$, … Choose the crystal (for tetragonal and hexagonal crystals slide $c/a$ and watch the pyramid poles move) and drag the two gold poles $P$, $Q$ (they snap to crystal poles when close). The thick arc is the zone circle through $P$ and $Q$. Switch on *rotate the net*: the Wulff net turns until the arc is one of its meridians, and the angle is **read off** from the latitudes of $P$ and $Q$ on that meridian, compared with the dot-product value. The last line measures the angle between two zone circles in the plane and on the sphere: they agree (conformality).`,
      deps: ['xtal-3.4'],
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
          all = poles();
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
          for (const F of all) for (const n of F.list) { const q = proj(n); S.dot(q[0], q[1], { r: 5, color: COLS[F.fi], hollow: n[2] < -1e-9, alpha: 0.9 }); }
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
        ca.el.hidden = false;
        v.readout(() => {
          const { th, dP, dQ, read, rot: r, angPlane, angSph, alpha } = info;
          const first = r ? `Net turned by ${v.fix(alpha, 1)}° so that $P,Q$ lie on one meridian: latitudes ${v.fix(dP, 1)}° and ${v.fix(dQ, 1)}°, **read angle $PQ=${v.fix(read, 1)}^\\circ$**.` : 'Switch on *rotate the net* to read the angle from a meridian.';
          return `${first} From the dot product: ${v.fix(th, 1)}° ${r ? (Math.abs(read - th) < 0.05 ? '✓' : '✗') : ''}\nAngle between the dashed and the thick zone circles at $P$: ${v.fix(angPlane, 2)}° measured in the plane, ${v.fix(angSph, 2)}° on the sphere ✓ (conformal).`;
        });
      },
    },
  ],
};
