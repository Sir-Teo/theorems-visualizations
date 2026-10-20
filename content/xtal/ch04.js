// Crystallography (Hammond; Giacovazzo) — Chapter 4: Planes and directions: Miller indices
// Part 1 (this file): direction indices, Miller indices, Miller–Bravais indices, interplanar spacing (4.1–4.4).
// Part 2 (ch04-b.js): the Weiss zone law, families of planes and multiplicity, angles between planes and directions (4.5–4.7).
import {
  clamp, rad, deg, add, sub, mul, dot, norm, cross, unit, cellVectors, drawCell, fmt, fitScale, comb, mv3,
  gram, latticeSymmetry, recipBasis, gramOf, inv3, quad, planeSection, intOrbit, indexHandle, CELLS, gcd2, gcd3, lcm2, reduceIdx, idxTex, barTex, rint, invD2,
} from './ch04.shared.js';

import { planeStatus, basalTrace } from './source-audit-symmetry-indices.shared.js';

export default {
  collection: 'xtal',
  chapter: 4,
  title: 'Planes and directions: Miller indices',
  summary: String.raw`Crystallographers name directions by lattice-vector components and planes by the reciprocals of their axis intercepts — the Miller indices. Simple formulas give the spacing between planes and the angles between them, and the Weiss zone law tells which planes share a common direction. Hexagonal crystals use a four-index variant that makes symmetry visible.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Direction indices [uvw]',
      statement: String.raw`Let $\mathbf a,\mathbf b,\mathbf c$ be the edges of a chosen unit cell. A lattice vector is $\mathbf r=U\mathbf a+V\mathbf b+W\mathbf c$ with integers $U,V,W$. Its **direction indices** are the components divided by their greatest common divisor, $[uvw]=[U,V,W]/\gcd(U,V,W)$: the smallest integers with the same ratios. A bar over an index marks a negative sign. The whole parallel family is one symbol $[uvw]$, and the symbols of all directions that the crystal's symmetry carries into one another are bundled as $\langle uvw\rangle$.`,
      idea: String.raw`Directions are only defined up to a positive multiple, so the integers are scaled until they have no common factor; this picks the first lattice point met along the ray, i.e. the shortest lattice vector in that direction. The indices depend on the cell chosen but not on its origin. In a cubic cell $[100],[010],[001]$ are related by the 3-fold axes and form $\langle100\rangle$; in a tetragonal or monoclinic cell the same three symbols fall into different families because the symmetry no longer exchanges the axes.

Bézout's gcd identity (alg 2.10), applied successively to the nonzero entries, gives an integer combination of a primitive index triple equal to one. If a real multiple $t(u,v,w)$ has all integer entries, that combination shows $t$ is an integer. Hence there is no lattice point strictly between the origin and the primitive triple on its ray. Zero components are omitted when applying the two-nonzero-integer theorem; a single nonzero component reduces directly to $\pm1$.`,
      caption: String.raw`Drag the gold handle (it snaps to lattice points; rotate the scene to move it in depth) or use the sliders for the components of $\mathbf r$. The long arrow is the lattice vector, the green one the shortest vector on its line, and the orange arrows are the other members of $\langle uvw\rangle$ under the symmetry of the chosen cell. Switch the cell to see $\langle100\rangle$ split.`,
      deps: ['xtal-1.2', 'alg-2.10'],
      refs: ['Hammond ch. 5'],
      tags: ['direction indices', 'unit cell', 'lattice vectors'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Miller_index#Case_of_cubic_structures' },
      viz(v) {
        let V, A, Ms, P;
        const setCell = (k) => { P = k === 'monoclinic' ? [1, 1.15, 1.3, 90, 105, 90] : CELLS[k]; V = cellVectors(P); A = recipBasis(V); Ms = latticeSymmetry(gramOf(V)); };
        setCell('cubic');
        const s = v.stage({ x: [-2.6, 2.6], y: [-2.3, 2.3], equal: true, axes: false, height: 440, title: 'a lattice vector and its direction indices (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.32, axes: false });
        const cellSel = v.select('cell', ['cubic', 'tetragonal', 'monoclinic'], 'cubic', { onChange: (k) => { setCell(k); ih.refresh(); } });
        const ih = indexHandle(v, sc, { names: ['$U$', '$V$', '$W$'], init: [2, 2, 0], range: 2, color: 'gold', label: 'r', toPos: (i) => comb(i, V), toIdx: (p) => A.map((b) => dot(b, p)) });
        v.button('double it', () => ih.set(ih.get().map((x) => clamp(2 * x, -2, 2))));
        v.button('negate', () => ih.set(ih.get().map((x) => (x === 0 ? 0 : -x))));
        let info = null;
        v.render(() => {
          const idx = ih.get(), g = gcd3(idx), red = g ? idx.map((x) => x / g) : [0, 0, 0], r = comb(idx, V), rr = comb(red, V);
          sc.begin();
          drawCell(sc, V, [0, 0, 0], { color: 'accent', width: 1.6, alpha: 0.9 });
          const pts = [];
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) pts.push(comb([i, j, k], V));
          sc.dots(pts, { r: 2.2, color: 'muted', alpha: 0.5, top: false });
          sc.dot([0, 0, 0], { r: 4, color: 'ink' });
          sc.tex('\\mathbf a', add(mul(0.55, V[0]), mul(-0.14, unit(V[1]))), { size: 15, color: 'muted' });
          sc.tex('\\mathbf b', add(mul(0.55, V[1]), mul(-0.14, unit(V[0]))), { size: 15, color: 'muted' });
          sc.tex('\\mathbf c', add(mul(0.55, V[2]), mul(-0.14, unit(V[0]))), { size: 15, color: 'muted' });
          let fam = [];
          if (g) {
            fam = intOrbit(Ms, red);
            for (const m of fam) if (m.join() !== red.join()) sc.arrow([0, 0, 0], comb(m, V), { color: 'orange', width: 1.6, alpha: 0.65, head: 7 });
            if (g > 1) sc.arrow([0, 0, 0], r, { color: 'accent', width: 2.2 });
            for (let k = 1; k <= g; k++) sc.dot(mul(k, rr), { r: 3.6, color: 'gold' });
            sc.arrow([0, 0, 0], rr, { color: 'green', width: 3.2 });
            sc.tex(`${idxTex(red, '[', ']')}`, add(add(rr, mul(0.12, unit(rr))), [0, 0, 0.22]), { size: 16, color: 'green' });
          }
          sc.flush();
          info = { idx, g, red, fam, len: norm(r), lenRed: norm(rr), P };
        });
        v.readout(() => {
          const { idx, g, red, fam, len, lenRed } = info, [a, b, c] = info.P;
          if (!g) return 'The zero vector has no direction: choose a nonzero $\\mathbf r$.';
          const famTex = idxTex(red, '\\langle', '\\rangle');
          return `$\\mathbf r=${idx[0]}\\mathbf a+${idx[1]}\\mathbf b+${idx[2]}\\mathbf c$ has components $(U,V,W)=(${idx.join(',\\,')})$ with $\\gcd=${g}$, so its direction is $${idxTex(red, '[', ']')}$ and it contains $${g}$ lattice step${g > 1 ? 's' : ''} of length $|${idxTex(red, '[', ']')}|=${fmt(lenRed, 3)}$ (cell edges $a,b,c=${fmt(a, 2)},\\,${fmt(b, 2)},\\,${fmt(c, 2)}$).\nUnder the symmetry of this cell the family $${famTex}$ has **${fam.length}** member${fam.length > 1 ? 's' : ''} (the orange arrows plus the green one).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Miller indices (hkl)',
      statement: String.raw`Take a family of parallel lattice planes and the plane of the family nearest the origin (but not through it). If it cuts the cell axes $\mathbf a,\mathbf b,\mathbf c$ at $\mathbf a/h,\ \mathbf b/k,\ \mathbf c/l$ with $h,k,l$ integers without common factor, the plane is labelled by the **Miller indices** $(hkl)$. Equivalently the intercepts, measured in units of the cell edges, are $p,q,r$; the indices are $1/p,\,1/q,\,1/r$ multiplied by the smallest number that clears all fractions and then reduced to coprime integers. A plane parallel to an axis meets it "at infinity" and receives the index $0$. The symbol $(hkl)$ names the whole stack of planes $hx+ky+lz=m$, $m\in\mathbb Z$ (with $x,y,z$ in cell coordinates); a bar marks a negative index, and $\{hkl\}$ denotes all planes equivalent by symmetry.`,
      idea: String.raw`A lattice plane contains lattice points, so it meets the axes at rational multiples of the edges (Haüy's law of rational indices). Writing the plane as $x/p+y/q+z/r=1$ and clearing denominators gives integer coefficients $(h,k,l)$; reciprocals are used because they stay finite for planes parallel to an axis, where intercepts blow up, and because the stack of planes $hx+ky+lz=m$ is then exactly the set of lattice planes of that orientation. The indices refer to the cell axes, so the same symbol is a different physical plane in a different cell. The notation was popularized by W. H. Miller's *Treatise on Crystallography* (1839), building on Weiss's intercept parameters and Whewell's reciprocal form.`,
      caption: String.raw`Set where the plane cuts each axis (gold dots; "$\infty$" means it never does). The orange plane is the one you chose; the indices below are the reciprocals cleared of fractions. The faint planes are the rest of the stack $(hkl)$ inside the cell: the plane you drew need not be the nearest one to the origin, and the stack is what the symbol labels.`,
      deps: ['xtal-1.4', 'xtal-4.1'],
      refs: ['Hammond ch. 5'],
      tags: ['Miller indices', 'lattice planes', 'intercepts'],
      credit: 'W. H. Miller, A Treatise on Crystallography, 1839 (reciprocal-intercept notation; after Weiss and Whewell)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Miller_index', iucr: 'https://dictionary.iucr.org/Miller_indices' },
      viz(v) {
        const IC = [['−2', -2, 1], ['−1', -1, 1], ['−1/2', -1, 2], ['∞', 0, 1], ['1/3', 1, 3], ['1/2', 1, 2], ['2/3', 2, 3], ['1', 1, 1], ['3/2', 3, 2], ['2', 2, 1]];
        const CE = { cubic: CELLS.cubic, monoclinic: [1, 1.2, 1.1, 90, 110, 90], triclinic: CELLS.triclinic };
        let V = cellVectors(CE.cubic);
        const cellSel = v.select('cell', ['cubic', 'monoclinic', 'triclinic'], 'cubic', { onChange: (k) => { V = cellVectors(CE[k]); } });
        const mk = (lab, init) => v.slider(lab, 0, IC.length - 1, init, { int: true, fmt: (i) => IC[Math.round(i)][0] });
        const sa = mk('cut on $\\mathbf a$ at', 5), sb = mk('cut on $\\mathbf b$ at', 7), sc3 = mk('cut on $\\mathbf c$ at', 3);
        const s = v.stage({ x: [-2.5, 2.5], y: [-2.3, 2.3], equal: true, axes: false, height: 440, title: 'intercepts, reciprocals, indices (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.7, pitch: 0.3, axes: false });
        let info = null;
        v.render(() => {
          const ics = [sa, sb, sc3].map((q) => IC[Math.round(q.value)]);
          const recip = ics.map(([, n, d]) => (n === 0 ? [0, 1] : [d, n])); // [num, den] of 1/p, den may be negative
          const nrm = recip.map(([n, d]) => (d < 0 ? [-n, -d] : [n, d]));
          const L = nrm.reduce((a, [, d]) => lcm2(a, d), 1), ints = nrm.map(([n, d]) => (n * L) / d), g = gcd3(ints) || 1, hkl = ints.map((x) => x / g);
          const nReal = nrm.map(([n, d]) => n / d);
          sc.begin();
          const o = mul(-0.5, add(add(V[0], V[1]), V[2])), sh = (p) => add(p, o);
          drawCell(sc, V, o, { color: 'accent', width: 1.5, alpha: 0.9 });
          [0, 1, 2].forEach((i) => {
            sc.line(sh(mul(-1.1, V[i])), sh(mul(2.2, V[i])), { color: 'faint', width: 1.2 }, 6);
            sc.tex(['\\mathbf a', '\\mathbf b', '\\mathbf c'][i], sh(mul(2.35, V[i])), { size: 15, color: 'muted' });
            for (const t of [-1, 1, 2]) sc.dot(sh(mul(t, V[i])), { r: 2, color: 'muted', top: false });
          });
          sc.dot(sh([0, 0, 0]), { r: 3.5, color: 'ink' });
          let ok = hkl.some((x) => x);
          let ms = [];
          if (ok) {
            // the rest of the stack inside the cell
            const cs = [0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k) => dot(hkl, [i, j, k]))));
            const m0 = Math.min(...cs), m1 = Math.max(...cs);
            for (let m = Math.ceil(m0); m <= m1; m++) {
              const poly = planeSection(V, hkl, m, 0, 1);
              if (poly) { ms.push(m); sc.poly(poly.map(sh), { fill: 'muted', fillAlpha: m === 1 ? 0.0 : 0.07, color: m === 1 ? 'green' : 'muted', width: m === 1 ? 1.8 : 0.8, alpha: m === 1 ? 0.9 : 0.5 }); }
            }
            const big = planeSection(V, nReal, 1, -1.2, 2.2);
            if (big) sc.poly(big.map(sh), { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.8, alpha: 0.95 });
            ics.forEach(([, n, d], i) => { if (n) sc.dot(sh(mul(n / d, V[i])), { r: 5.5, color: 'gold' }); });
          }
          sc.flush();
          info = { ics, recip, L, ints, g, hkl, ok, mdrawn: ok ? L / g : 0 };
        });
        v.readout(() => {
          const { ics, L, ints, g, hkl, ok, mdrawn } = info;
          const f = (i) => (ics[i][1] === 0 ? '\\infty' : ics[i][2] === 1 ? `${ics[i][1]}` : `${ics[i][1] < 0 ? '-' : ''}\\tfrac{${Math.abs(ics[i][1])}}{${ics[i][2]}}`);
          const rec = (i) => (ics[i][1] === 0 ? '0' : ics[i][1] === 1 ? `${ics[i][2]}` : ics[i][1] === -1 ? `-${ics[i][2]}` : `${ics[i][2] / 1}/${ics[i][1]}`.replace('/-', '/-'));
          if (!ok) return 'The plane never meets any axis: it is at infinity and has no indices. Cut at least one axis.';
          return `Intercepts $(${f(0)},\\,${f(1)},\\,${f(2)})$ → reciprocals $(${rec(0)},\\,${rec(1)},\\,${rec(2)})$ → times ${L} → $(${ints.map(barTex).join('\\,')})$${g > 1 ? ` → divide by common factor ${g}` : ''} → **Miller indices $${idxTex(hkl)}$**.\nThe plane you drew is number $m=${mdrawn}$ of the stack $hx+ky+lz=m$; the nearest one to the origin ($m=1$, outlined in green) cuts the axes at $1/h,\\,1/k,\\,1/l$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Miller–Bravais indices for hexagonal crystals',
      statement: String.raw`For a hexagonal (or trigonal, hexagonal-axes) cell use three coplanar axes $\mathbf a_1,\mathbf a_2,\mathbf a_3$ at $120^\circ$ with $\mathbf a_3=-(\mathbf a_1+\mathbf a_2)$, plus $\mathbf c$. A plane is labelled $(hkil)$ with $h,k,l$ the ordinary Miller indices with respect to $\mathbf a_1,\mathbf a_2,\mathbf c$, and the **redundant third index fixed by**
$$i=-(h+k),\qquad\text{i.e. } h+k+i=0 .$$
The index $i$ is the reciprocal of the intercept on $\mathbf a_3$. A $120^\circ$ rotation cyclically permutes $h,k,i$; a $60^\circ$ rotation additionally changes signs. Which resulting planes are crystal-symmetry equivalent depends on the actual point group, and the six faces of the first-order hexagonal prism are $\{10\bar10\}$.`,
      idea: String.raw`The three axes in the basal plane are dependent, so any plane's trace on the basal plane, $hx_1+kx_2=1$ in coordinates along $\mathbf a_1,\mathbf a_2$, also meets the $\mathbf a_3$ axis. Putting $\mathbf a_3=-\mathbf a_1-\mathbf a_2$, i.e. $(x_1,x_2)=(-t,-t)$, gives $-(h+k)t=1$, so the intercept is $1/i$ with $i=-(h+k)$. The extra index carries no new information, but it makes the sixfold symmetry visible: rotating by $60^\circ$ shifts $(h,k,i)$ one step cyclically (with sign changes), whereas the three-index labels $(100),(010),(\bar110),\dots$ of equivalent faces look unrelated. The zero quadruple is not a plane. These are plane indices; four-axis direction indices obey a different conversion.`,
      caption: String.raw`Choose $h,k,l$ (or press *next prism face*). The blue line is the trace of the plane $(hk\cdot l)$ on the basal plane; gold dots are its intercepts on the three axes. With the lock on they are always collinear, because $i=-(h+k)$; unlock it and set $i$ by hand to see the third intercept leave the line. The table lists the six prism faces in both notations.`,
      deps: ['xtal-4.2'],
      refs: ['Nespolo2018, The rise and fall of Weber indices, complete §§2–3 pp1222 and plane/direction distinction in§4', 'IUCr Online Dictionary, Bravais-Miller indices'],
      tags: ['Miller–Bravais indices', 'hexagonal', 'symmetry'],
      links: { iucr: 'https://dictionary.iucr.org/Bravais-Miller_indices', wikipedia: 'https://en.wikipedia.org/wiki/Miller_index#Case_of_hexagonal_and_rhombohedral_structures' },
      viz(v) {
        const A1 = [1, 0], A2 = [-0.5, Math.sqrt(3) / 2], A3 = [-0.5, -Math.sqrt(3) / 2];
        const FACES = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
        const sh = v.slider('$h$', -2, 2, 1, { int: true }), sk = v.slider('$k$', -2, 2, 0, { int: true }), sl = v.slider('$l$', -2, 2, 0, { int: true });
        const lock = v.toggle('lock $i=-(h+k)$', true, { onChange: (b) => { si.el.hidden = b; } });
        const si = v.slider('$i$ (free)', -3, 3, -1, { int: true }); si.el.hidden = true;
        let fi = 0;
        v.button('next prism face', () => { fi = (fi + 1) % 6; sh.set(FACES[fi][0]); sk.set(FACES[fi][1]); sl.set(0); });
        const s = v.stage({ x: [-2.35, 2.35], y: [-2.0, 2.0], equal: true, axes: false, height: 400, title: 'basal plane: axes $\\mathbf a_1,\\mathbf a_2,\\mathbf a_3$ and the trace of the plane' });
        const T = v.stage({ x: [0, 100], y: [0, 7.9], axes: false, height: 290, full: true, title: 'the six faces of the first-order prism' });
        const P = (a, t) => [a[0] * t, a[1] * t];
        let info = null;
        v.render(() => {
          const h = sh.value, k = sk.value, l = sl.value, i = lock.value ? -(h + k) : si.value, ax = [A1, A2, A3];
          // hexagon (prism cross-section)
          const hx = [0, 1, 2, 3, 4, 5].map((j) => [Math.cos(rad(60 * j)), Math.sin(rad(60 * j))]);
          s.poly(hx, { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.4 });
          ax.forEach((a, j) => { s.arrow(0, 0, a[0] * 1.65, a[1] * 1.65, { color: 'ink', width: 1.4, head: 8, alpha: 0.8 }); s.tex(`\\mathbf a_${j + 1}`, a[0] * 1.82, a[1] * 1.82 - 0.04, { size: 15 }); });
          FACES.forEach(([fh, fk]) => {
            const g = [fh * 1, fh * 0.57735 + fk * 1.1547], L = Math.hypot(...g), u = [g[0] / L, g[1] / L];
            s.tex(`(${[fh, fk, -(fh + fk), 0].map(barTex).join('')})`, u[0] * 1.2, u[1] * 1.2 - 0.0, { size: 12.5, color: 'muted' });
          });
          // trace of the plane  h x1 + k x2 = 1  (coordinates along a1, a2)
          let trace = null;
          if (h || k) {
            const seg=basalTrace(h,k);if(seg.length)s.path(seg,{color:'blue',width:2.6});
            trace = true;
          }
          const ints = [h, k, i].map((x, j) => (x ? P(ax[j], 1 / x) : null));
          ints.forEach((p, j) => { if (p) s.dot(p[0], p[1], { r: 6, color: j === 2 && !lock.value && h + k + i !== 0 ? 'red' : 'gold' }); });
          // offset of the a3 intercept from the line through the a1 and a2 intercepts
          let off = null;
          if (h && k && i) {
            const p1 = ints[0], p2 = ints[1], p3 = ints[2], d = [p2[0] - p1[0], p2[1] - p1[1]], L = Math.hypot(...d);
            off = Math.abs(d[0] * (p3[1] - p1[1]) - d[1] * (p3[0] - p1[0])) / L;
          }
          // table
          const cols = [3, 18, 40, 66];
          ['face', 'three-index', 'four-index', 'cyclic pattern of $(h\\,k\\,i)$'].forEach((t, j) => T.text(t, cols[j], 7.35, { size: 12, color: 'muted', align: 'left' }));
          FACES.forEach(([fh, fk], j) => {
            const y = 6.2 - j, hit = fh === h && fk === k && i === -(h + k) && l === 0;
            if (hit) T.rect(0, y - 0.45, 100, y + 0.45, { fill: 'green', fillAlpha: 0.16, stroke: false });
            T.text(`${j + 1}`, cols[0], y, { size: 13, color: 'ink', align: 'left', baseline: 'middle' });
            T.tex(`(${[fh, fk, 0].map(barTex).join('')})`, cols[1], y, { size: 15, align: 'left' });
            T.tex(`(${[fh, fk, -(fh + fk), 0].map(barTex).join('')})`, cols[2], y, { size: 15, align: 'left' });
            T.tex(`h,k,i = ${[fh, fk, -(fh + fk)].map(barTex).join(',\\,')}`, cols[3], y, { size: 14, align: 'left', color: 'muted' });
          });
          info = { h, k, i, l, off, locked: lock.value, trace };
        });
        v.readout(() => {
          const { h, k, i, l, off, locked } = info;
          const status=planeStatus(h,k,i,l);if(status==='inconsistent') return `Inconsistent indices: $h+k+i=${h+k+i}\\ne0$. No plane has this quadruple, including when an intercept is at infinity.`;
          if(status==='zero')return 'The zero quadruple (0000) does not define a plane.';
          if (!h && !k) return `$(hkil)=(${[h, k, i, l].map(barTex).join('')})$: with $h=k=0$ the plane is parallel to the basal plane and its trace is at infinity (this is the plane $(000l)$, perpendicular to $\\mathbf c$).`;
          const sum = h + k + i;
          return `Plane $(hkil)=${idxTex([h, k, i, l])}$ with $h+k+i=${sum}$${locked ? ' (forced to 0 by $i=-(h+k)$)' : ''}.\n${off === null ? 'An intercept is at infinity; consistency is determined by $h+k+i=0$, not a three-finite-point test.' : sum === 0 ? `The three intercepts lie on one line (distance of the $\\mathbf a_3$ intercept from the line through the other two: ${fmt(off, 3)}).` : `With $h+k+i\\ne0$ the $\\mathbf a_3$ intercept (red) is ${fmt(off, 3)} off the line through the other two: no plane has these four indices.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Proposition',
      name: 'Interplanar spacing formulas',
      statement: String.raw`The perpendicular distance $d_{hkl}$ between neighbouring planes of the family $(hkl)$ satisfies
$$\begin{gathered}\frac1{d_{hkl}^2}=\mathbf h^{\mathsf T}G^{-1}\mathbf h,\\\mathbf h=(h,k,l)^{\mathsf T},\\G_{ij}=\mathbf a_i\!\cdot\!\mathbf a_j,\end{gathered}$$
which gives, for the common cells,
(a) cubic: $d=a/\sqrt{h^2+k^2+l^2}$;
(b) tetragonal: $1/d^2=(h^2+k^2)/a^2+l^2/c^2$;
(c) orthorhombic: $1/d^2=h^2/a^2+k^2/b^2+l^2/c^2$;
(d) hexagonal: $1/d^2=\tfrac43\,(h^2+hk+k^2)/a^2+l^2/c^2$;
(e) monoclinic (unique axis $\mathbf c$, angle $\gamma$): $1/d^2=\dfrac{1}{\sin^2\gamma}\Big(\dfrac{h^2}{a^2}+\dfrac{k^2}{b^2}-\dfrac{2hk\cos\gamma}{ab}\Big)+\dfrac{l^2}{c^2}$.
If $h,k,l$ have a common factor $n$, the formula gives $d_{hkl}=d_{hkl/n}/n$.`,
      idea: String.raw`The planes $hx+ky+lz=m$ are the level sets of the linear function $\mathbf h\cdot\mathbf f$ of the fractional coordinates $\mathbf f$; two neighbouring ones differ by $1$ in that function. The gradient of $\mathbf h\cdot\mathbf f$ in Cartesian space is the reciprocal vector $\mathbf g=h\mathbf a^*+k\mathbf b^*+l\mathbf c^*$ (here $\mathbf a_i\cdot\mathbf a^*_j=\delta_{ij}$), so the spacing is $1/|\mathbf g|$ and $|\mathbf g|^2=\mathbf h^{\mathsf T}G^{-1}\mathbf h$ because the Gram matrix of the reciprocal basis is $G^{-1}$. Each special form is this expression for the corresponding Gram matrix.

The reciprocal vectors represent the dual basis functionals (ladr 3.112): $\mathbf a_j^*\cdot\mathbf a_i=\delta_{ij}$ extracts fractional coordinate $j$. Therefore the Cartesian gradient of the plane functional is $\mathbf g=\sum h_j\mathbf a_j^*$. The level-set normal theorem (vcalc 2.8) applies because the cell is nonsingular and the index triple is nonzero. Here the functional is linear, so its constant gradient makes the neighbouring-level distance exactly $1/|\mathbf g|$, rather than just a local approximation.`,
      caption: String.raw`Choose a crystal system and $(hkl)$ and adjust the cell edges. The faint polygons are the planes of the stack inside the cell; the gold arrow is the **measured** spacing, found geometrically as the distance from the plane through the origin to the next plane (using two lattice vectors in the plane and a cross product, no formula). The readout compares it with the formula. Try $(200)$: the spacing halves.`,
      deps: ['xtal-4.2', 'ladr-3.112', 'vcalc-2.8'],
      refs: ['Hammond ch. 5'],
      tags: ['interplanar spacing', 'metric tensor', 'reciprocal lattice'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Miller_index#Crystallographic_planes_and_directions' },
      viz(v) {
        const SYS = ['cubic', 'tetragonal', 'orthorhombic', 'hexagonal', 'monoclinic'];
        const sys = v.select('system', SYS, 'tetragonal', { onChange: () => vis() });
        const sa = v.slider('$a$', 0.6, 1.6, 1, { step: 0.01 }), sb = v.slider('$b$', 0.6, 1.8, 1.25, { step: 0.01 }), sc_ = v.slider('$c$', 0.6, 2, 1.45, { step: 0.01 });
        const sg = v.slider('$\\gamma$ (°)', 70, 110, 105, { step: 0.5 });
        function vis() { const k = sys.value; sb.el.hidden = !(k === 'orthorhombic' || k === 'monoclinic'); sc_.el.hidden = k === 'cubic'; sg.el.hidden = k !== 'monoclinic'; }
        const sh = v.slider('$h$', -3, 3, 1, { int: true }), sk = v.slider('$k$', -3, 3, 1, { int: true }), sl = v.slider('$l$', -3, 3, 0, { int: true });
        vis();
        const s = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 420, title: 'the stack of planes $(hkl)$ in the cell (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.65, pitch: 0.3, axes: false });
        const cellP = () => {
          const k = sys.value, a = sa.value, b = sb.value, c = sc_.value;
          return k === 'cubic' ? [a, a, a, 90, 90, 90] : k === 'tetragonal' ? [a, a, c, 90, 90, 90] : k === 'orthorhombic' ? [a, b, c, 90, 90, 90] : k === 'hexagonal' ? [a, a, c, 90, 90, 120] : [a, b, c, 90, 90, sg.value];
        };
        const formula = (k, [a, b, c, , , ga], [h, kk, l]) => {
          const inv = k === 'cubic' ? (h * h + kk * kk + l * l) / (a * a) : k === 'tetragonal' ? (h * h + kk * kk) / (a * a) + (l * l) / (c * c)
            : k === 'orthorhombic' ? (h * h) / (a * a) + (kk * kk) / (b * b) + (l * l) / (c * c) : k === 'hexagonal' ? (4 / 3) * (h * h + h * kk + kk * kk) / (a * a) + (l * l) / (c * c)
              : ((h * h) / (a * a) + (kk * kk) / (b * b) - (2 * h * kk * Math.cos(rad(ga))) / (a * b)) / Math.sin(rad(ga)) ** 2 + (l * l) / (c * c);
          return 1 / Math.sqrt(inv);
        };
        const FTEX = {
          cubic: 'd=a/\\sqrt{h^2+k^2+l^2}', tetragonal: '\\dfrac1{d^2}=\\dfrac{h^2+k^2}{a^2}+\\dfrac{l^2}{c^2}', orthorhombic: '\\dfrac1{d^2}=\\dfrac{h^2}{a^2}+\\dfrac{k^2}{b^2}+\\dfrac{l^2}{c^2}',
          hexagonal: '\\dfrac1{d^2}=\\dfrac43\\dfrac{h^2+hk+k^2}{a^2}+\\dfrac{l^2}{c^2}', monoclinic: '\\dfrac1{d^2}=\\dfrac{1}{\\sin^2\\gamma}\\Big(\\dfrac{h^2}{a^2}+\\dfrac{k^2}{b^2}-\\dfrac{2hk\\cos\\gamma}{ab}\\Big)+\\dfrac{l^2}{c^2}',
        };
        let info = null;
        v.render(() => {
          const P = cellP(), V = cellVectors(P), hkl = [sh.value, sk.value, sl.value];
          sc.begin();
          const kk = fitScale(V, 1.9), ctr = mul(0.5, add(add(V[0], V[1]), V[2])), S = (p) => mul(kk, sub(p, ctr));
          drawCell(sc, V.map((r) => mul(kk, r)), mul(-kk, ctr), { color: 'accent', width: 1.6, alpha: 0.9 });
          let geo = null, ok = hkl.some((x) => x);
          if (ok) {
            const cs = [0, 1].flatMap((i) => [0, 1].flatMap((j) => [0, 1].map((k2) => dot(hkl, [i, j, k2]))));
            for (let m = Math.ceil(Math.min(...cs)); m <= Math.max(...cs); m++) {
              const poly = planeSection(V, hkl, m, 0, 1);
              if (poly) sc.poly(poly.map(S), { fill: m === 0 ? 'blue' : 'orange', fillAlpha: m === 0 ? 0.18 : 0.13, color: m === 0 ? 'blue' : 'orange', width: 1, alpha: 0.7 });
            }
            // geometric measurement: two independent lattice vectors in the plane h.f = 0, and a point on h.f = 1
            const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], inpl = [];
            for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { const w = E[i].map((x, t) => x * hkl[j] - E[j][t] * hkl[i]); if (w.some((x) => x)) inpl.push(comb(w, V)); }
            let nvec = null;
            for (let i = 0; i < inpl.length && !nvec; i++) for (let j = i + 1; j < inpl.length && !nvec; j++) { const c = cross(inpl[i], inpl[j]); if (norm(c) > 1e-9) nvec = unit(c); }
            const jn = hkl.findIndex((x) => x), p1 = comb(E[jn].map((x) => x / hkl[jn]), V);
            if (nvec) {
              const sgn = Math.sign(dot(p1, nvec)) || 1, dd = Math.abs(dot(p1, nvec)), foot = mul(sgn * dd, nvec);
              geo = dd;
              const o0 = [0, 0, 0];
              sc.arrow(S(o0), S(foot), { color: 'gold', width: 3.2 });
              sc.tex(`d_{${hkl.map(barTex).join('')}}`, S(mul(0.5, foot)), { size: 15, color: 'gold' });
            }
          }
          sc.flush();
          info = { P, hkl, ok, geo, form: ok ? formula(sys.value, P, hkl) : NaN, gen: ok ? 1 / Math.sqrt(invD2(V, hkl)) : NaN, k: sys.value };
        });
        v.readout(() => {
          const { P, hkl, ok, geo, form, gen, k } = info;
          if (!ok) return 'Choose a nonzero $(hkl)$.';
          const g = gcd3(hkl);
          return `$${FTEX[k]}$ ⇒ $d_{${hkl.map(barTex).join('')}}=${fmt(form, 4)}$ (cell $a,b,c=${fmt(P[0], 2)},\\,${fmt(P[1], 2)},\\,${fmt(P[2], 2)}$, $\\gamma=${fmt(P[5], 1)}^\\circ$).\nMeasured geometrically: $${fmt(geo, 4)}$; general metric formula $1/\\sqrt{\\mathbf h^{\\mathsf T}G^{-1}\\mathbf h}$: $${fmt(gen, 4)}$; difference ${Math.abs(geo - form).toExponential(1)}.${g > 1 ? `\nThe indices share the factor ${g}: this is the ${g}th order of $(${reduceIdx(hkl).map(barTex).join('')})$ and $d$ is ${g} times smaller.` : ''}`;
        });
      },
    },
  ],
};
