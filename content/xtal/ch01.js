// Crystallography (Hammond; Giacovazzo) — Chapter 1: Crystals, lattices and structures
// Part 1 (this file): lattice and basis, unit cells, Steno's and Haüy's laws, close packing, coordination and packing fraction (1.1–1.6).
// Part 2 (ch01-b.js): interstitial holes, density from the cell, common structure types, Pauling's rules, the Wigner–Seitz cell (1.7–1.11).
import {
  clamp, rad, deg, add, sub, mul, dot, norm, cross, unit, angleDeg, cellVectors, triple, volumeFormula, dot2, len2, det2, reduce2, classify2, conventional2, latticePoints2,
  clip2, polyhedron, polyVolume, uniqueVerts, STRUCT, speciesColor, atomsIn, neighbours, shell, cellVolume, atomsPerCell, ppu, cellEdges, drawCell, ball, fmt, fitScale, TAU,
} from './ch01.shared.js';

const CROSS = (s, x, y, r, col, alpha = 0.7) => { s.line(x - r, y, x + r, y, { color: col, width: 1.1, alpha }); s.line(x, y - r, x, y + r, { color: col, width: 1.1, alpha }); };

export default {
  collection: 'xtal',
  chapter: 1,
  title: 'Crystals, lattices and structures',
  summary: String.raw`A crystal is a motif repeated on a lattice. Long before X-rays, the constancy of interfacial angles and the rationality of face indices hinted at this hidden periodicity. Packing spheres efficiently gives the face-centred cubic and hexagonal close-packed structures, the holes between them host smaller ions, and a handful of structure types — rock salt, caesium chloride, diamond, wurtzite, perovskite — cover a vast range of materials.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Lattice, basis and crystal structure',
      statement: String.raw`A **lattice** is the set of all points $n_1\mathbf a_1+n_2\mathbf a_2+n_3\mathbf a_3$ with integer $n_i$, for three independent vectors $\mathbf a_i$ (two in the plane). A **basis** (motif) is a finite group of atoms with fixed positions relative to a lattice point. A **crystal structure** is the lattice with a copy of the basis attached to every lattice point: lattice $+$ basis $=$ structure. The lattice records only the translational symmetry; the basis says what is repeated. Different bases on the same lattice give different structures with the same translations.`,
      idea: String.raw`If $\mathbf t$ is a lattice vector, shifting the whole pattern by $\mathbf t$ lands every atom on an atom of the same kind, so $\mathbf t$ is a symmetry. Conversely any translation that maps the structure to itself must carry the origin atom to some atom of that kind, and the set of all such translations is closed under addition, hence a lattice. The choice of basis vectors is not unique (the same lattice has infinitely many bases) and an atom need not sit on a lattice point; what is fixed is the lattice itself. If the basis happens to repeat inside the cell — two identical atoms offset by half a cell vector — the true lattice is finer than the one first drawn.`,
      caption: String.raw`Drag $\mathbf a_1,\mathbf a_2$ to reshape the lattice (its Bravais type is named live) and the white handle inside the cell to move the second atom; the whole crystal follows. Drag the gold translation $\mathbf t$: the hollow rings show the crystal shifted by $\mathbf t$, and the readout counts how many atoms of the basis land on an atom of the same kind. Only lattice vectors give a perfect match — unless you switch *make all atoms identical*, when the half-cell translation also works and the lattice you drew is no longer the true one.`,
      deps: ['ladr-2.26'],
      refs: ['Hammond ch. 1', 'Giacovazzo ch. 1'],
      tags: ['lattice', 'basis'],
      viz(v) {
        const mot = v.select('motif', [{ value: 'one', label: 'one atom' }, { value: 'two', label: 'two atoms' }, { value: 'three', label: 'three atoms' }], 'two');
        const same = v.toggle('make all atoms identical', false);
        const showL = v.toggle('show lattice points', true);
        const s = v.stage({ x: [-2.4, 6.6], y: [-2.0, 4.4], equal: true, axes: false, height: 430 });
        const A1 = s.handle(1.7, 0.25, { color: 'accent', label: 'a₁' });
        const A2 = s.handle(0.55, 1.45, { color: 'orange', label: 'a₂' });
        const MH = s.handle(0.6, 1.2, { color: 'ink', r: 6, label: 'm' });
        const TT = s.handle(3.1, 1.2, { color: 'gold', r: 7, label: 't' });
        let fm = [0.3, 0.62]; // fractional position of the second atom
        let ft = [1.5, 0.5]; // fractional coordinates of t
        const toFrac = (x, y) => { const d = det2([A1.x, A1.y], [A2.x, A2.y]); return [(x * A2.y - y * A2.x) / d, (A1.x * y - A1.y * x) / d]; };
        const fromFrac = (f) => [f[0] * A1.x + f[1] * A2.x, f[0] * A1.y + f[1] * A2.y];
        MH.onDrag = () => { if (Math.abs(det2([A1.x, A1.y], [A2.x, A2.y])) > 0.2) fm = toFrac(MH.x, MH.y); };
        TT.onDrag = () => { if (Math.abs(det2([A1.x, A1.y], [A2.x, A2.y])) > 0.2) ft = toFrac(TT.x, TT.y); };
        const motif = () => {
          const k = mot.value, id = same.value;
          const m = [{ f: [0, 0], sp: 0 }];
          if (k !== 'one') m.push({ f: fm, sp: id ? 0 : 1 });
          if (k === 'three') m.push({ f: [fm[0] + 0.2, fm[1] - 0.17], sp: id ? 0 : 2 });
          return m;
        };
        const COL = ['blue', 'orange', 'green'], RAD = [8, 6.5, 5.5];
        let info = null;
        v.render(() => {
          const a1 = [A1.x, A1.y], a2 = [A2.x, A2.y], det = det2(a1, a2);
          if (Math.abs(det) < 0.2) { s.text('vectors nearly parallel: not a lattice', 2, 1.2, { align: 'center', size: 14, color: 'red' }); info = { bad: true }; return; }
          if (!MH.dragging) { const p = fromFrac(fm); MH.set(p[0], p[1]); }
          if (!TT.dragging) { const p = fromFrac(ft); TT.set(p[0], p[1]); }
          const L = classify2(a1, a2), M = motif();
          const W = [[-2.4, 6.6], [-2.0, 4.4]];
          const pts = latticePoints2(a1, a2, W[0], W[1], 1.6);
          // primitive cell at the origin
          s.poly([[0, 0], a1, [a1[0] + a2[0], a1[1] + a2[1]], a2], { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4 });
          const cen = (px, py) => px > W[0][0] - 0.3 && px < W[0][1] + 0.3 && py > W[1][0] - 0.3 && py < W[1][1] + 0.3;
          // ghost atoms shifted by t
          const tv = fromFrac(ft);
          for (const [x, y] of pts) for (const m of M) {
            const o = fromFrac(m.f), px = x + o[0], py = y + o[1];
            if (cen(px, py)) s.dot(px, py, { r: RAD[m.sp] + 3.5, hollow: true, color: 'gold', alpha: 0.7 });
          }
          if (showL.value) for (const [x, y] of pts) if (cen(x, y)) CROSS(s, x, y, 0.09, 'muted', 0.7);
          for (const [x, y] of pts) for (const m of M) {
            const o = fromFrac(m.f), px = x + o[0], py = y + o[1];
            if (cen(px, py)) s.dot(px, py, { r: RAD[m.sp], color: COL[m.sp] });
          }
          s.arrow(0, 0, a1[0], a1[1], { color: 'accent', width: 2.4 });
          s.arrow(0, 0, a2[0], a2[1], { color: 'orange', width: 2.4 });
          s.arrow(0, 0, tv[0], tv[1], { color: 'gold', width: 2.4 });
          MH.visible = mot.value !== 'one';
          // check: does the shift by t map every atom of the basis onto an atom of the same kind?
          const res = M.map((m) => M.some((q) => {
            if (q.sp !== m.sp) return false;
            const r = [m.f[0] + ft[0] - q.f[0], m.f[1] + ft[1] - q.f[1]].map((z) => z - Math.round(z));
            const c = fromFrac(r); return Math.hypot(c[0], c[1]) < 0.07;
          }));
          const matched = res.filter(Boolean).length;
          const rt = ft.map((z) => z - Math.round(z)), isLat = Math.hypot(...fromFrac(rt)) < 0.07;
          info = { L, M, matched, isLat, n: M.length, ft, bad: false };
        });
        v.readout(() => {
          if (!info || info.bad) return 'Make $\\mathbf a_1,\\mathbf a_2$ independent to form a lattice.';
          const { L, matched, isLat, n, ft: f } = info, ok = matched === n;
          const nice = (z) => v.fix(z, 2);
          let tail;
          if (isLat && ok) tail = 'a lattice vector, and it maps every atom of the basis onto an atom of the same kind ✓';
          else if (!isLat && ok) tail = 'NOT one of your lattice vectors, yet it maps the whole crystal onto itself — the atoms repeat at this shorter translation, so the true lattice is finer (centred) than the one drawn';
          else tail = `${isLat ? 'a lattice vector — but only' : 'not a lattice vector; only'} ${matched} of ${n} atoms of the basis land on an atom of the same kind ✗`;
          return `Lattice type (reduced basis): **${L.name}** (${L.sym}), primitive cell area $${v.fix(L.area, 3)}$, ${n} atom${n > 1 ? 's' : ''} per lattice point.\n$\\mathbf t = ${nice(f[0])}\\,\\mathbf a_1 + ${nice(f[1])}\\,\\mathbf a_2$ is ${tail}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Unit cell and lattice parameters',
      statement: String.raw`A **unit cell** is a parallelepiped (a parallelogram in the plane) that tiles space by lattice translations. It is described by six **lattice parameters**: the edge lengths $a,b,c$ and the angles $\alpha=\angle(\mathbf b,\mathbf c)$, $\beta=\angle(\mathbf a,\mathbf c)$, $\gamma=\angle(\mathbf a,\mathbf b)$. Its volume is $V=abc\sqrt{1+2\cos\alpha\cos\beta\cos\gamma-\cos^2\alpha-\cos^2\beta-\cos^2\gamma}$. A cell with lattice points only at its corners is **primitive** and contains exactly one lattice point; a **non-primitive** cell contains $k>1$ points and has $k$ times the volume. The choice of primitive cell is not unique, but the volume per lattice point is.`,
      idea: String.raw`Write the three edge vectors as rows of a matrix; the cell volume is the absolute triple product $\mathbf a\cdot(\mathbf b\times\mathbf c)=\sqrt{\det G}$ of the Gram matrix of dot products, which expands into the cosine formula. Changing to another basis $\mathbf a'_i=\sum M_{ij}\mathbf a_j$ with an integer matrix of determinant $\pm1$ gives the same lattice, because $M$ is invertible over the integers; the new cell has volume $|\det M|\,V$, so only $|\det M|=1$ is primitive. Counting lattice points in a half-open cell therefore returns $|\det M|$.`,
      caption: String.raw`Left: drag the six parameters; the cell and its 2×2×2 block of copies are redrawn, and the volume is computed twice, as a triple product of the edge vectors and from the cosine formula. Impossible angle sets (three angles that cannot meet at a corner) are rejected. Right: the $\mathbf a$–$\mathbf b$ face as a plane lattice with several choices of cell: every primitive choice has a different shape but the same area, and the number of lattice points counted inside each (gold) times the primitive area equals its area.`,
      deps: ['xtal-1.1', 'vcalc-1.4'],
      refs: ['Hammond ch. 1'],
      tags: ['unit cell', 'lattice parameters'],
      viz(v) {
        const A = v.slider('$a$', 0.6, 2, 1, { step: 0.05 }), B = v.slider('$b$', 0.6, 2, 1.25, { step: 0.05 }), C = v.slider('$c$', 0.6, 2, 1.55, { step: 0.05 });
        const AL = v.slider('$\\alpha$ (°)', 50, 130, 90, { step: 1 }), BE = v.slider('$\\beta$ (°)', 50, 130, 105, { step: 1 }), GA = v.slider('$\\gamma$ (°)', 50, 130, 90, { step: 1 });
        const choices = {
          ab: { M: [[1, 0], [0, 1]], label: 'a, b' }, ap: { M: [[1, 0], [1, 1]], label: 'a, a+b' }, sk: { M: [[1, 0], [3, 1]], label: 'a, 3a+b' },
          two: { M: [[2, 0], [0, 1]], label: '2a, b' }, four: { M: [[2, 0], [1, 2]], label: '2a, a+2b' },
        };
        const pick = v.select('2D cell on the ab face', Object.entries(choices).map(([k, c]) => ({ value: k, label: c.label })), 'ap');
        const s = v.stage({ x: [-2.4, 2.4], y: [-2.1, 2.1], equal: true, axes: false, height: 400, weight: 1.15, title: '3D cell (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.7, pitch: 0.38, axes: false });
        const t = v.stage({ x: [-1.4, 4.6], y: [-1.4, 3.2], equal: true, axes: false, height: 400, weight: 1, title: 'plane lattice of the a–b face' });
        let ok = true, vol = [0, 0];
        const system = () => {
          const eqL = (x, y) => Math.abs(x - y) < 1e-6, a = A.value, b = B.value, c = C.value, al = AL.value, be = BE.value, ga = GA.value;
          const r90 = (x) => x === 90;
          if (eqL(a, b) && eqL(b, c) && al === 90 && be === 90 && ga === 90) return 'cubic metric';
          if (r90(al) && r90(be) && r90(ga)) return eqL(a, b) ? 'tetragonal metric' : 'orthorhombic metric';
          if (al === be && be === ga && eqL(a, b) && eqL(b, c)) return 'rhombohedral metric';
          if (r90(al) && r90(ga) && !r90(be)) return 'monoclinic metric';
          return 'triclinic (no special relations)';
        };
        v.render(() => {
          const P = [A.value, B.value, C.value, AL.value, BE.value, GA.value], V = cellVectors(P);
          ok = !!V;
          if (V) {
            const k = fitScale(V, 1.15), o = [-1, -1, -1];
            const pos = (f) => [0, 1, 2].map((q) => (f[0] - 1) * V[0][q] * k + (f[1] - 1) * V[1][q] * k + (f[2] - 1) * V[2][q] * k);
            sc.begin();
            for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) {
              sc.line(pos([i, j, 0]), pos([i, j, 2]), { color: 'faint', width: 1, alpha: 0.6 }, 1);
              sc.line(pos([i, 0, j]), pos([i, 2, j]), { color: 'faint', width: 1, alpha: 0.6 }, 1);
              sc.line(pos([0, i, j]), pos([2, i, j]), { color: 'faint', width: 1, alpha: 0.6 }, 1);
            }
            const F = (c) => pos(c);
            const faces = [[[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]];
            for (const f of faces) sc.poly(f.map(F), { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6, alpha: 0.9 });
            for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) for (let l = 0; l <= 2; l++) sc.dot(pos([i, j, l]), { r: i + j + l === 0 ? 5 : 3.6, color: i < 2 && j < 2 && l < 2 && (i + j + l) >= 0 && i <= 1 && j <= 1 && l <= 1 ? 'blue' : 'muted', top: false });
            const o0 = F([0, 0, 0]);
            sc.arrow(o0, F([1, 0, 0]), { color: 'accent', width: 3 }); sc.arrow(o0, F([0, 1, 0]), { color: 'orange', width: 3 }); sc.arrow(o0, F([0, 0, 1]), { color: 'green', width: 3 });
            sc.tex('\\mathbf a', add(F([0.55, 0, 0]), mul(0.12, unit(sub(F([0.5, 0, 0]), F([1, 1, 1]))))), { color: 'accent', size: 17 });
            sc.tex('\\mathbf b', add(F([0, 0.55, 0]), mul(0.12, unit(sub(F([0, 0.5, 0]), F([1, 1, 1]))))), { color: 'orange', size: 17 });
            sc.tex('\\mathbf c', add(F([0, 0, 0.55]), mul(0.12, unit(sub(F([0, 0, 0.5]), F([1, 1, 1]))))), { color: 'green', size: 17 });
            sc.flush();
            vol = [Math.abs(triple(V)), volumeFormula(P)];
          } else { s.text('these three angles cannot meet at a corner', 0, 0, { align: 'center', size: 14, color: 'red' }); }
          // 2D face lattice
          const g = GA.value, u = [A.value, 0], w = [B.value * Math.cos(rad(g)), B.value * Math.sin(rad(g))];
          const Mx = choices[pick.value].M;
          const cu = [Mx[0][0] * u[0] + Mx[0][1] * w[0], Mx[0][0] * u[1] + Mx[0][1] * w[1]], cv = [Mx[1][0] * u[0] + Mx[1][1] * w[0], Mx[1][0] * u[1] + Mx[1][1] * w[1]];
          // lattice points (i, j) in units of u, w
          const inv = (() => { const d = Mx[0][0] * Mx[1][1] - Mx[0][1] * Mx[1][0]; return [[Mx[1][1] / d, -Mx[0][1] / d], [-Mx[1][0] / d, Mx[0][0] / d]]; })();
          let cnt = 0;
          const inside = [];
          for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) {
            const x = i * u[0] + j * w[0], y = i * u[1] + j * w[1];
            // cell coordinates (p, q) with (i, j) = p·M[0] + q·M[1]
            const p = i * inv[0][0] + j * inv[1][0], q = i * inv[0][1] + j * inv[1][1];
            const isIn = p >= -1e-9 && p < 1 - 1e-9 && q >= -1e-9 && q < 1 - 1e-9;
            if (isIn) { cnt++; inside.push([x, y]); }
          }
          const area = Math.abs(det2(cu, cv)), area0 = Math.abs(det2(u, w));
          t.poly([[0, 0], u, add(u, w), w], { fill: 'muted', fillAlpha: 0.05, color: 'muted', width: 1, dash: true });
          t.poly([[0, 0], cu, add(cu, cv), cv], { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 2 });
          for (let i = -4; i <= 7; i++) for (let j = -4; j <= 7; j++) {
            const x = i * u[0] + j * w[0], y = i * u[1] + j * w[1];
            if (x > -1.4 && x < 4.6 && y > -1.4 && y < 3.2) t.dot(x, y, { r: 3.4, color: 'blue' });
          }
          for (const [x, y] of inside) if (x > -1.4 && x < 4.6 && y > -1.4 && y < 3.2) t.dot(x, y, { r: 6, color: 'gold' });
          t.arrow(0, 0, cu[0], cu[1], { color: 'orange', width: 2.2 }); t.arrow(0, 0, cv[0], cv[1], { color: 'orange', width: 2.2 });
          t.corner(`${cnt} point${cnt > 1 ? 's' : ''} · area ${v.fix(area, 2)} · area/point ${v.fix(area / cnt, 3)}`, 'tl', { size: 12, weight: 700, plate: true });
          t.corner(`primitive a–b cell area ${v.fix(area0, 3)}`, 'bl', { size: 11.5, color: 'muted', plate: true });
          t._cnt = [cnt, area, area0];
        });
        v.readout(() => {
          const [cnt, area, area0] = t._cnt || [1, 1, 1];
          if (!ok) return 'No parallelepiped has these angles: any two must exceed the third, and the three must sum to less than $360^\\circ$.';
          return `$V=\\mathbf a\\cdot(\\mathbf b\\times\\mathbf c)=${v.fix(vol[0], 4)}$ and $abc\\sqrt{1+2\\cos\\alpha\\cos\\beta\\cos\\gamma-\\cdots}=${v.fix(vol[1], 4)}$ — they agree ${Math.abs(vol[0] - vol[1]) < 1e-9 ? '✓' : '✗'}. Cell shape: ${system()}.\nChosen face cell: ${cnt} lattice point${cnt > 1 ? 's' : ''} inside, area $=${v.fix(area / area0, 2)}\\times$ primitive area, so area per point $=${v.fix(area / cnt / area0, 3)}$ of the primitive area ${Math.abs(area / cnt / area0 - 1) < 1e-9 ? '✓ (always one)' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Law',
      name: 'Steno’s law of constant interfacial angles',
      statement: String.raw`In all specimens of the same crystalline substance, the angle between corresponding faces is the same, however differently the specimens have grown. Faces may be large or small, a form may be missing altogether, and the habit may range from stubby to needle-like or plate-like; the **interfacial angles** — measured between face normals, with a contact goniometer — do not change (at fixed temperature and pressure).`,
      idea: String.raw`The faces of a crystal are the planes along which it grows slowest, and a given family of lattice planes always has the same orientation relative to the others because it is fixed by the lattice. A crystal bounded by planes $\mathbf n_i\cdot\mathbf x\le d_i$ changes shape when the distances $d_i$ (growth rates $\times$ time) change, but the normals $\mathbf n_i$ are properties of the lattice. The angle between two faces is therefore a function of $\mathbf n_i,\mathbf n_j$ only, and independent of every $d$. Steno (1669) saw this in quartz; Romé de l'Isle (1783) generalised it; the explanation, in the periodic lattice, came with Haüy (1.4).`,
      caption: String.raw`The crystal is the convex region $\mathbf n_i\cdot\mathbf x\le d_i$ for cube $\{100\}$ (blue), octahedron $\{111\}$ (orange) and rhombic-dodecahedron $\{110\}$ (green) faces. Slide the face-growth distances, or press *Random habit* to give every individual face its own distance: the shape swings between cube, octahedron, needle and plate, faces appear and vanish. The right plot gives the angle at every edge, **computed from the vertex coordinates of the polyhedron**: each class of face pair stays on its horizontal line.`,
      deps: ['xtal-1.1', 'vcalc-1.2'],
      refs: ['Hammond ch. 1'],
      credit: 'N. Steno, 1669 (quartz); J.-B. Romé de l’Isle, 1783',
      tags: ['crystal morphology', 'interfacial angle'],
      viz(v) {
        const H100 = v.slider('side faces {100}', 0.3, 2.4, 0.8, { step: 0.02 }), HZ = v.slider('top/bottom faces (001)', 0.3, 2.4, 1.4, { step: 0.02 });
        const H111 = v.slider('octahedral {111}', 0.3, 2.6, 1.45, { step: 0.02 }), H110 = v.slider('dodecahedral {110}', 0.3, 3, 2.2, { step: 0.02 });
        let seed = 0, jit = null;
        const rnd = () => { const r = v.rng(++seed); jit = Array.from({ length: 26 }, () => 0.55 + 0.9 * r()); };
        v.button('Random habit', rnd);
        v.button('Reset', () => { jit = null; });
        const s = v.stage({ x: [-2.5, 2.5], y: [-2.3, 2.3], equal: true, axes: false, height: 420, weight: 1.2 });
        const sc = v.scene3(s, { yaw: -0.9, pitch: 0.55, axes: false });
        const g = v.stage({ x: [-0.5, 5.5], y: [25, 100], axes: 'box', gutter: true, height: 420, weight: 1, ylabel: 'angle between face normals (°)', xticks: [[0, '100:100'], [1, '100:110'], [2, '100:111'], [3, '110:110'], [4, '110:111'], [5, '111:111']] });
        const dirs = [];
        for (const sgn of [1, -1]) { dirs.push({ n: [sgn, 0, 0], fam: 0, xy: true }, { n: [0, sgn, 0], fam: 0, xy: true }, { n: [0, 0, sgn], fam: 0, z: true }); }
        for (const a of [1, -1]) for (const b of [1, -1]) for (const c of [1, -1]) dirs.push({ n: [a, b, c], fam: 1 });
        for (const a of [1, -1]) for (const b of [1, -1]) { dirs.push({ n: [a, b, 0], fam: 2 }, { n: [a, 0, b], fam: 2 }, { n: [0, a, b], fam: 2 }); }
        const FAM = ['accent', 'orange', 'green'];
        let data = null;
        const CLASS = { '00': 0, '02': 1, '01': 2, '22': 3, '12': 4, '11': 5 };
        v.render(() => {
          const planes = dirs.map((d, i) => {
            const base = d.fam === 0 ? (d.z ? HZ.value : H100.value) : d.fam === 1 ? H111.value : H110.value;
            return { n: d.n, d: base * norm(d.n) * 1 * (jit ? jit[i] : 1) / (d.fam === 0 ? 1 : 1), tag: d.fam };
          });
          // distances are measured along the unit normal: plane  n̂·x = h
          const pl = planes.map((p) => ({ n: unit(p.n), d: p.d / norm(p.n), tag: p.tag }));
          const faces = polyhedron(pl);
          const k = 1.05;
          sc.begin();
          faces.forEach((f) => {
            sc.poly(f.verts.map((p) => mul(k, p)), { fill: FAM[f.tag], fillAlpha: 0.38, color: 'ink', width: 1.4, alpha: 0.95 });
          });
          sc.flush();
          // measured normals from the vertices, adjacent pairs from shared vertices
          const cen = faces.map((f) => mul(1 / f.verts.length, f.verts.reduce(add, [0, 0, 0])));
          const nrm = faces.map((f, i) => { let n = [0, 0, 0]; for (let j = 1; j + 1 < f.verts.length; j++) n = add(n, cross(sub(f.verts[j], f.verts[0]), sub(f.verts[j + 1], f.verts[0]))); n = unit(n); return dot(n, cen[i]) < 0 ? mul(-1, n) : n; });
          const pts = [];
          for (let i = 0; i < faces.length; i++) for (let j = i + 1; j < faces.length; j++) {
            let sh = 0; for (const p of faces[i].verts) if (faces[j].verts.some((q) => norm(sub(p, q)) < 1e-7)) sh++;
            if (sh >= 2) { const a = Math.min(faces[i].tag, faces[j].tag), b = Math.max(faces[i].tag, faces[j].tag); const key = `${a}${b}`; pts.push({ cls: CLASS[key], ang: angleDeg(nrm[i], nrm[j]) }); }
          }
          data = { faces, pts };
          for (const [c, y] of [[0, 90], [1, 45], [2, 54.7356], [3, 60], [4, 35.2644], [5, 70.5288]]) g.line(c - 0.35, y, c + 0.35, y, { color: 'faint', width: 1, dash: true });
          const cnt = {};
          for (const p of pts) { const n = (cnt[p.cls] = (cnt[p.cls] || 0) + 1); g.dot(p.cls + ((n % 5) - 2) * 0.12, p.ang, { r: 4, color: ['accent', 'purple', 'orange', 'green', 'teal', 'red'][p.cls], alpha: 0.85 }); }
          g.text('dashed: angle between ideal normals', 2.5, 28, { align: 'center', size: 11, color: 'muted' });
        });
        v.readout(() => {
          if (!data) return '';
          const { faces, pts } = data, fc = [0, 0, 0]; faces.forEach((f) => { fc[f.tag]++; });
          const by = {}; for (const p of pts) (by[p.cls] ||= []).push(p.ang);
          const names = ['{100}∧{100}', '{100}∧{110}', '{100}∧{111}', '{110}∧{110}', '{110}∧{111}', '{111}∧{111}'];
          const parts = Object.keys(by).sort().map((c) => `${names[c]} ${v.fix(Math.min(...by[c]), 2)}°–${v.fix(Math.max(...by[c]), 2)}° (${by[c].length} edges)`);
          return `Faces present: ${faces.length} (${fc[0]} cube, ${fc[1]} octahedron, ${fc[2]} dodecahedron), ${uniqueVerts(faces).length} vertices.\nMeasured spread of the angle at each class of edge: ${parts.join(' · ')}. The shape changes; the angles do not.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Law',
      name: 'Haüy’s law of rational indices',
      statement: String.raw`Haüy's empirical law describes the rational orientations commonly found among macroscopic facets of periodic crystals. In fractional lattice coordinates $(X,Y,Z)$, a plane parallel to a two-dimensional lattice net has an equation
$$hX+kY+lZ=d,$$
with integers $h,k,l$, not all zero: its **Miller indices**. For $d\ne0$ its finite intercepts are $d/h$, $d/k$, $d/l$, so their ratios are rational. A zero index means the plane is parallel to that axis, with infinite intercept. Low-index facets are common, but high-index faces are possible; this is not a prohibition of every other surface orientation.`,
      idea: String.raw`Three **noncollinear** lattice points give two independent integer-coordinate displacement vectors. The cross product of those coordinate triples supplies nonzero integer coefficients $(h,k,l)$ for the plane equation, which proves the rational-index statement for that lattice plane and its parallel translates. A plane without a two-dimensional lattice net may still contain a whole lattice line: for example $X+\sqrt2Y=0$ contains the $Z$ axis. In the two-dimensional brick section, a rational slope $p/q$ gives a staircase that repeats after $q$ columns and $p$ rows; its individual terraces need not all have the same width. Simple broken-bond models help explain why some low-index faces are common, but actual facet energies and growth rates also depend on crystal chemistry and conditions.`,
      caption: String.raw`Drag the cut through the finite brick stack and change the axial ratio $c/a$. The remaining bricks form a staircase. The right plot gives the best numerator $p$ for each denominator $q=1,\dots,12$; errors at or below $10^{-12}$ are shown at the display floor. Try $2/3$: its periodic staircase has both one- and two-column terraces. The golden-ratio and $\sqrt2-1$ presets represent known irrational numbers by floating-point approximations. A finite plot or a small approximation error cannot certify rationality or irrationality.`,
      scope: String.raw`Periodic-crystal lattice geometry and an illustrative finite two-dimensional brick section. The model does not predict surface energies, growth kinetics, rough surfaces or quasicrystal facets. Displayed approximation errors use floating-point arithmetic.`,
      deps: ['xtal-1.3', 'vcalc-1.3'],
      refs: ['Hammond ch. 5'],
      credit: 'R. J. Haüy, 1784 (Essai d’une théorie sur la structure des crystaux)',
      tags: ['morphology', 'rational indices'],
      viz(v) {
        const R = v.slider('axial ratio $c/a$', 0.5, 1.6, 1, { step: 0.05 });
        const N = 16;
        const s = v.stage({ x: [-0.6, N + 0.6], y: [-0.5, 11], equal: false, axes: false, height: 420, weight: 1.55, title: 'brick stack and the cut face' });
        const hnd = s.handle(10, 6.2, { color: 'gold', r: 8, label: 'cut' });
        const q = v.stage({ x: [0.5, 12.5], y: [-12.5, 0.3], axes: 'box', gutter: true, height: 420, weight: 1, xlabel: 'denominator q', ylabel: 'log₁₀ |slope − p/q|', xticks: [2, 4, 6, 8, 10, 12], title: 'best rational approximations' });
        // The view expands with the brick stack; clipping y would change the
        // promised fractional slope (notably 2/3 when c/a is 1.6).
        const setSlope = (m) => { hnd.set(10, 10 * m * R.value); };
        v.button('golden 1/φ', () => setSlope((Math.sqrt(5) - 1) / 2));
        v.button('2/3', () => setSlope(2 / 3));
        v.button('√2 − 1', () => setSlope(Math.SQRT2 - 1));
        v.button('1/3', () => setSlope(1 / 3));
        let info = null;
        // Best numerator for each fixed denominator.
        const bestFor = (m, qd) => { const p = Math.round(m * qd); return [p, qd, Math.abs(m - p / qd)]; };
        v.render(() => {
          const r = R.value, hx = Math.max(hnd.x, 2), hy = Math.max(hnd.y, 0.3);
          hnd.set(hx, hy);
          const m = hy / hx / r; // rows (in brick heights) climbed per column
          // staircase: column i has height floor(m·(i+1/2) + 1/2) bricks (centres below the cut)
          const hts = [];
          for (let i = 0; i < N; i++) hts.push(Math.max(0, Math.floor((m * (i + 0.5)) / 1 + 0.5 - 1e-9)));
          s.setView([-0.6, N + 0.6], [-0.5, Math.max(6, hts[N - 1] * r + 1.6, 11)]);
          for (let i = 0; i < N; i++) for (let j = 0; j < hts[i]; j++) s.rect(i + 0.02, j * r + 0.02 * r, i + 0.98, (j + 1) * r - 0.02 * r, { fill: 'accent', fillAlpha: 0.24, color: 'accent', width: 0.9 });
          // risers and treads
          const tread = [];
          let runs = [], cur = 0;
          for (let i = 0; i < N; i++) {
            if (i > 0 && hts[i] !== hts[i - 1]) { runs.push(cur); cur = 0; s.line(i, hts[i - 1] * r, i, hts[i] * r, { color: 'orange', width: 2.4 }); }
            cur++;
            s.line(i, hts[i] * r, i + 1, hts[i] * r, { color: 'orange', width: 2.4 });
          }
          tread.push(...runs.slice(1)); // skip the (cut-off) first run
          const widths = [...new Set(tread)].sort((a, b) => a - b);
          // the exact cut
          s.line(0, 0, N, N * m * r, { color: 'gold', width: 2, dash: [7, 5] });
          // the best rational approximation within q <= qmax
          let best = null;
          for (let qd = 1; qd <= 12; qd++) { const [p, qq, e] = bestFor(m, qd); if (!best || e < best.e - 1e-12) best = { p, q: qq, e }; }
          s.line(0, 0, N, N * (best.p / best.q) * r, { color: 'green', width: 2 });
          s.dot(0, 0, { r: 4, color: 'ink' });
          s.text('origin', 0.1, -0.35, { size: 11, color: 'muted', align: 'left' });
          s.corner(`slope = ${v.fix(m, 4)} rows per column`, 'tl', { size: 12.5, weight: 700, plate: true });
          // error plot
          for (let qd = 1; qd <= 12; qd++) { const [, , e] = bestFor(m, qd); const y = e <= 1e-12 ? -12 : Math.log10(e); q.dot(qd, Math.max(-12, y), { r: 5, color: e <= 1e-12 ? 'green' : 'accent' }); }
          q.hline(-12, { color: 'faint' });
          q.text('≤10⁻¹² (display floor)', 12.4, -11.55, { align: 'right', size: 10.5, color: 'green' });
          info = { m, best, widths, steps: runs.length - 1 };
        });
        v.readout(() => {
          if (!info) return '';
          const { m, best, widths, steps } = info;
          return `Cut slope = ${v.fix(m, 4)} rows per column. Best approximation with $q\\le12$: $p/q=${best.p}/${best.q}$, numerical error $${v.sci(best.e, 2)}$.\nTerrace widths observed in this finite window (${steps} complete steps): ${widths.length ? widths.join(', ') : '—'} bricks. A rational slope can have different terrace widths; small errors here do not certify rationality.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Close packing: fcc versus hcp',
      statement: String.raw`Equal spheres are packed most densely in a plane in a hexagonal layer, each touching six others. A second such layer sits in the hollows of the first, over one of two equivalent sets of hollows; calling the layer positions A, B, C, a close-packed crystal is any stacking in which successive layers differ ($AB$, $BC$ or $CA$ but never $AA$). The stacking $ABAB\dots$ is **hexagonal close packing** (hcp), $ABCABC\dots$ is **cubic close packing**, i.e. the face-centred cubic lattice (fcc, with the layers perpendicular to a body diagonal). Every such stacking has coordination number 12 and packing fraction $\pi/\sqrt{18}=0.7405$, which is the largest density of any packing of equal spheres (Kepler's conjecture, proved by Hales in 2005).`,
      idea: String.raw`A sphere in layer $B$ rests on three spheres of $A$; its centre is above a triangle of side $d$ (the sphere diameter) at horizontal distance $d/\sqrt3$ from each, so the layers are $h=\sqrt{d^2-d^2/3}=\sqrt{2/3}\,d$ apart whichever hollows are used. Every sphere touches six in its layer, three above and three below: $12$, whatever the sequence. The density depends only on $h$ and on the layer density, so every sequence of A, B, C packs equally well, and the ordered ones with the shortest repeat — $AB$ and $ABC$ — are hcp and fcc. The first is not a lattice with one atom per point (it has a two-atom basis); the second is.`,
      caption: String.raw`Build a stacking with the buttons (a layer cannot repeat the previous one) or take a preset: hcp $ABAB$, fcc $ABC$, the double-hexagonal $ABAC$. Drag the side view to rotate it. Layer colours are A blue, B orange, C green; the top view shows the hollows underneath. The readout labels each inner layer h (neighbours above and below equal: hexagonal environment) or c (cubic), counts nearest neighbours directly from the coordinates, and computes the packing fraction from the sphere volume and the slab volume.`,
      deps: ['xtal-1.1'],
      refs: ['Hammond ch. 1'],
      credit: 'J. Kepler, 1611; T. C. Hales, 2005 (proof; formal proof 2017)',
      tags: ['close packing', 'stacking'],
      viz(v) {
        let seq = [0, 1, 0, 1, 0, 1];
        const NAME = ['A', 'B', 'C'], COL = ['blue', 'orange', 'green'];
        const set = (str) => { seq = [...str].map((c) => 'ABC'.indexOf(c)); };
        const add1 = (k) => { if (seq.length < 9 && seq[seq.length - 1] !== k) seq.push(k); };
        v.button('+ A', () => add1(0)); v.button('+ B', () => add1(1)); v.button('+ C', () => add1(2));
        v.button('undo', () => { if (seq.length > 1) seq.pop(); });
        v.button('hcp ABAB…', () => set('ABABABAB')); v.button('fcc ABC…', () => set('ABCABCAB')); v.button('dhcp ABAC…', () => set('ABACABAC'));
        const s = v.stage({ x: [-3.6, 3.6], y: [-3.5, 3.5], equal: true, axes: false, height: 440, weight: 1.35, title: 'stacking (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.5, pitch: 0.3, axes: false });
        const top = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 440, weight: 0.9, title: 'seen from above' });
        const t1 = [1, 0], t2 = [0.5, Math.sqrt(3) / 2], off = [[0, 0], [(t1[0] + t2[0]) / 3, (t1[1] + t2[1]) / 3], [(2 * (t1[0] + t2[0])) / 3, (2 * (t1[1] + t2[1])) / 3]];
        const H = Math.sqrt(2 / 3);
        const layerPts = (L, R = 2) => { const out = []; for (let i = -R - 2; i <= R + 2; i++) for (let j = -R - 2; j <= R + 2; j++) { const x = i * t1[0] + j * t2[0] + off[L][0], y = i * t1[1] + j * t2[1] + off[L][1]; out.push([x, y]); } return out; };
        let info = null;
        v.render(() => {
          const n = seq.length, z0 = ((n - 1) * H) / 2;
          // spheres: hexagon patch of lattice points of radius R around the centre of the A layer
          const RR = 1.15;
          const centreOf = (L) => [off[L][0] * 0, off[L][1] * 0];
          sc.begin();
          const ppx = ppu(s);
          seq.forEach((L, li) => {
            for (const [x, y] of layerPts(L)) {
              if (Math.hypot(x - 0.5, y - 0.3) > RR + 0.1) continue;
              const p = [x - 0.5, y - 0.3, li * H - z0];
              sc.dot(p, { r: 0.5 * ppx * 0.9, color: COL[L], alpha: 0.82, top: false });
            }
          });
          sc.flush();
          // top view: layers bottom to top
          seq.forEach((L, li) => {
            for (const [x, y] of layerPts(L, 3)) {
              if (Math.hypot(x - 0.5, y - 0.3) > 2.6) continue;
              top.circle(x - 0.5, y - 0.3, 0.5, { fill: COL[L], fillAlpha: li === n - 1 ? 0.55 : 0.12, color: COL[L], alpha: li === n - 1 ? 0.95 : 0.3, width: li === n - 1 ? 1.5 : 0.8 });
            }
          });
          // coordination count from coordinates for a sphere in the middle layer
          const mid = Math.floor((n - 1) / 2), all = [];
          seq.forEach((L, li) => { for (const [x, y] of layerPts(L, 3)) all.push([x, y, li * H]); });
          const c0 = [off[seq[mid]][0], off[seq[mid]][1], mid * H];
          const nn = all.filter((p) => { const d = norm(sub(p, c0)); return d > 1e-6 && d < 1.0001; }).length;
          const types = [];
          for (let i = 1; i < n - 1; i++) types.push(seq[i - 1] === seq[i + 1] ? 'h' : 'c');
          // packing fraction: sphere volume per lattice site over (site area × layer spacing)
          const siteArea = Math.abs(det2(t1, t2)), spacing = Math.sqrt(1 - (1 / Math.sqrt(3)) ** 2);
          const pf = ((4 / 3) * Math.PI * 0.5 ** 3) / (siteArea * spacing);
          info = { n, types, nn, pf, spacing };
        });
        v.readout(() => {
          const { n, types, nn, pf, spacing } = info;
          const str = seq.map((k) => NAME[k]).join('');
          let kind = 'a mixed polytype';
          if (types.length) { if (types.every((x) => x === 'h')) kind = 'hexagonal close packing (hcp)'; else if (types.every((x) => x === 'c')) kind = 'cubic close packing (fcc)'; else if (n >= 5 && /^(hchc)+h?c?$|^(chch)+/.test(types.join(''))) kind = 'double hexagonal (dhcp, as in La, Nd)'; }
          else kind = 'too few layers to classify';
          return `Stacking **${str}**: inner layers ${types.length ? types.join(' ') : '—'} → ${kind}.\nSpheres touching a sphere of layer ${Math.floor((n - 1) / 2) + 1}: **${nn}** (counted from coordinates). Layer spacing $h=${v.fix(spacing, 4)}\\,d$ ($\\sqrt{2/3}=${v.fix(Math.sqrt(2 / 3), 4)}$). Packing fraction $=\\dfrac{\\frac43\\pi(d/2)^3}{(\\sqrt3/2)\\,d^2\\,h}=${v.fix(pf, 4)}$, and $\\pi/\\sqrt{18}=${v.fix(Math.PI / Math.sqrt(18), 4)}$ — the same for every stacking ✓.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Coordination number and packing fraction',
      statement: String.raw`The **coordination number** of an atom is the number of nearest neighbours it has (atoms at the shortest distance from it). The **packing fraction** (atomic packing factor) of a structure of identical touching spheres is the fraction of space the spheres fill:
$$\eta=\frac{N\cdot\frac43\pi r^3}{V_{\text{cell}}},\qquad r=\tfrac12 d_{\min},$$
with $N$ atoms per cell. For simple cubic, body-centred cubic, face-centred cubic, diamond and ideal hexagonal close-packed structures: coordination $6,8,12,4,12$ and $\eta=\pi/6=0.524,\ \pi\sqrt3/8=0.680,\ \pi/\sqrt{18}=0.740,\ \pi\sqrt3/16=0.340,\ 0.740$.`,
      idea: String.raw`Find the nearest-neighbour distance $d_{\min}$ in the structure (along an edge for sc, half a body diagonal for bcc, half a face diagonal for fcc, a quarter of a body diagonal for diamond) and set the sphere radius to $d_{\min}/2$, so that nearest spheres just touch. Count the atoms per cell with the sharing rule (corner $\tfrac18$, edge $\tfrac14$, face $\tfrac12$, inside 1). The ratio of sphere volume to cell volume then gives the closed forms. Open structures such as diamond are held together by directional bonds, not by close packing.`,
      caption: String.raw`Pick a structure and grow the spheres with the slider (1.00 = touching). The program finds the nearest neighbours from the coordinates (gold bonds), counts the atoms per cell by corner/edge/face sharing, and computes the packing fraction, compared with the exact value; push past 1.00 and the spheres overlap (red). For hcp, change $c/a$: the coordination 12 splits into $6+6$ as soon as the ideal $\sqrt{8/3}$ is lost, and the packing fraction falls away from its maximum.`,
      deps: ['xtal-1.5', 'vcalc-4.7'],
      refs: ['Hammond ch. 1'],
      tags: ['coordination number', 'packing fraction'],
      viz(v) {
        const kinds = ['sc', 'bcc', 'fcc', 'diamond', 'hcp'];
        const sel = v.select('structure', [{ value: 'sc', label: 'simple cubic' }, { value: 'bcc', label: 'bcc' }, { value: 'fcc', label: 'fcc' }, { value: 'diamond', label: 'diamond' }, { value: 'hcp', label: 'hcp' }], 'fcc');
        const grow = v.slider('sphere radius / touching radius', 0.25, 1.15, 0.5, { step: 0.01 });
        const ca = v.slider('hcp: $c/a$', 1.3, 2.0, Math.sqrt(8 / 3), { step: 0.01 });
        const exact = { sc: Math.PI / 6, bcc: (Math.PI * Math.sqrt(3)) / 8, fcc: Math.PI / Math.sqrt(18), diamond: (Math.PI * Math.sqrt(3)) / 16, hcp: Math.PI / Math.sqrt(18) };
        const CN = { sc: 6, bcc: 8, fcc: 12, diamond: 4, hcp: 12 };
        const structOf = (k) => (k === 'hcp' ? STRUCT.hcp(ca.value) : STRUCT[k]);
        const analyse = (k) => {
          const S = structOf(k), sh = shell(S, 0, { tol: 0.01 }), N = atomsPerCell(S), r = sh.d / 2, eta = (N * (4 / 3) * Math.PI * r ** 3) / cellVolume(S);
          const nb = neighbours(S, 0, sh.d * 1.5), d2 = nb.find((t) => t.d > sh.d * 1.01), cn2 = d2 ? nb.filter((t) => Math.abs(t.d - d2.d) < 0.01 * d2.d).length : 0;
          return { S, sh, N, r, eta, cn: sh.list.length, cn2, d2: d2 ? d2.d : NaN };
        };
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.1, 2.1], equal: true, axes: false, height: 430, weight: 1.3, title: 'conventional cell (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.6, pitch: 0.32, axes: false });
        const b = v.stage({ x: [-0.5, 4.5], y: [0, 0.85], axes: 'box', gutter: true, height: 430, weight: 0.85, ylabel: 'packing fraction η', xticks: kinds.map((k, i) => [i, k === 'diamond' ? 'diam.' : k]), title: 'computed vs exact' });
        let cur = null;
        v.render(() => {
          const k = sel.value; ca.el.hidden = k !== 'hcp';
          const A = analyse(k), S = A.S, V = cellVectors(S.cell), kk = fitScale(V, 1.7);
          // centre of the cell
          const cc = mul(0.5, add(add(V[0], V[1]), V[2]));
          const P = (r) => mul(kk, sub(r, cc));
          sc.begin();
          drawCell(sc, V.map((e) => mul(kk, e)), mul(-1, mul(kk, cc)), {});
          const atoms = atomsIn(S, 0, 1, V);
          // centre atom for the coordination star: the basis atom nearest to the cell centre
          const c0 = atoms.reduce((best, a) => (norm(sub(a.r, cc)) < norm(sub(best.r, cc)) ? a : best), atoms[0]);
          const R = A.r * kk * grow.value, px = ppu(s);
          const bonds = neighbours(S, c0.basis, A.sh.d * 1.01, V).filter((t) => t.d < A.sh.d * 1.01);
          for (const t of bonds) {
            const q = add(c0.r, t.rel);
            sc.line(P(c0.r), P(q), { color: 'gold', width: 3, alpha: 0.95 }, 1);
            if (atoms.every((a) => norm(sub(a.r, q)) > 1e-6)) sc.dot(P(q), { r: Math.max(2.5, R * px * 0.9), color: 'gold', alpha: 0.4, top: false });
          }
          for (const a of atoms) {
            const overlap = grow.value > 1.0001;
            ball(sc, s, P(a.r), R, a === c0 ? 'gold' : 'accent', { alpha: a === c0 ? 0.95 : 0.78, ring: true });
            void overlap;
          }
          sc.flush();
          if (grow.value > 1.0001) s.corner('spheres overlap: not a valid packing', 'tr', { color: 'red', weight: 700, size: 12.5, plate: true });
          // bar chart of computed packing fractions (cached per hcp c/a)
          kinds.forEach((q, i) => {
            const aa = q === k ? A : analyse(q), c = q === k ? 'accent' : 'muted';
            b.rect(i - 0.34, 0, i + 0.34, aa.eta, { fill: c, fillAlpha: q === k ? 0.55 : 0.25, color: c, width: q === k ? 2 : 1 });
            b.line(i - 0.42, exact[q], i + 0.42, exact[q], { color: 'green', width: 2 });
            b.text(`CN ${aa.cn}`, i, aa.eta + 0.04, { align: 'center', size: 11, color: q === k ? 'ink' : 'muted', weight: q === k ? 700 : 500 });
          });
          b.corner('green line: exact value', 'tl', { size: 11, color: 'green' });
          cur = { k, A };
        });
        v.readout(() => {
          const { k, A } = cur, ex = exact[k];
          const names = { sc: '\\pi/6', bcc: '\\pi\\sqrt3/8', fcc: '\\pi/\\sqrt{18}', diamond: '\\pi\\sqrt3/16', hcp: '\\pi/\\sqrt{18}' };
          const coord = k === 'hcp' && A.cn !== 12 ? `${A.cn} nearest + ${A.cn2} at $${v.fix(A.d2 / A.sh.d, 3)}\\,d_{\\min}$` : `**${A.cn}**`;
          const fill = ((4 / 3) * Math.PI * (A.r * grow.value) ** 3 * A.N) / cellVolume(A.S);
          return `${A.S.name}: coordination ${coord} (exact ${CN[k]}); atoms per cell $N=${v.fix(A.N, 2)}$; $d_{\\min}=${v.fix(A.sh.d, 4)}\\,a$.\nPacking fraction at touching radius $\\eta=${v.fix(A.eta, 4)}$ versus the exact $${names[k]}=${v.fix(ex, 4)}$ ${Math.abs(A.eta - ex) < 5e-4 ? '✓' : '(differs: non-ideal $c/a$)'}; with the current radius the spheres fill ${v.fix(fill, 3)} of the cell.`;
        });
      },
    },
  ],
};
