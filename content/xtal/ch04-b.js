// Crystallography (Hammond; Giacovazzo) — Chapter 4, part 2: the Weiss zone law, families of planes and multiplicity, angles between planes and directions (4.5–4.7).
import {
  clamp, rad, deg, add, sub, mul, dot, norm, cross, unit, cellVectors, drawCell, fmt, comb, mv3,
  pointGroups, recipBasis, gramOf, inv3, quad, planeOrbit, indexHandle, CELLS, gcd3, reduceIdx, idxTex, barTex, rint, SYSTEMS,
} from './ch04.shared.js';

const MONO_B = [1, 1.15, 1.3, 90, 105, 90];
const mat = (G) => `\\begin{pmatrix}${G.map((r) => r.map((x) => fmt(Math.abs(x) < 5e-4 ? 0 : x, 3)).join('&')).join('\\\\')}\\end{pmatrix}`;

export default {
  collection: 'xtal',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Weiss zone law',
      statement: String.raw`A **zone** is the set of lattice planes that are all parallel to one lattice direction, the **zone axis** $[uvw]$. The plane $(hkl)$ belongs to the zone $[uvw]$ exactly when
$$hu+kv+lw=0 .$$
Consequently two non-parallel planes $(h_1k_1l_1)$ and $(h_2k_2l_2)$ determine the zone axis they share,
$$[uvw]=[\,k_1l_2-l_1k_2,\ \ l_1h_2-h_1l_2,\ \ h_1k_2-k_1h_2\,]/\gcd,$$
and every plane of that zone is an integer combination $m(h_1k_1l_1)+n(h_2k_2l_2)$ of the two. Dually, two directions $[u_1v_1w_1],[u_2v_2w_2]$ lie in the one plane $(hkl)$ whose indices are their cross product. The law holds in every cell, not only orthogonal ones.`,
      idea: String.raw`The plane $(hkl)$ is a level set of $hx+ky+lz$ in cell coordinates, so a lattice direction with components $(u,v,w)$ runs along it (does not leave the level set) if and only if the linear function does not change along $(u,v,w)$, i.e. $hu+kv+lw=0$. The set of planes $(hkl)$ satisfying this is the set of integer vectors $\mathbf h$ in the plane $\perp[uvw]$ of reciprocal space; that plane is spanned by any two non-parallel members, and the cross product is the normal to both. The cell metric never enters because the pairing between plane indices and direction indices is the natural pairing of a covector with a vector. Zones are the classical structuring device of crystal faces (Weiss, 1804, per the IUCr dictionary).`,
      caption: String.raw`The dots are the points $(hkl)$ of the plane-normal lattice (the reciprocal lattice, met formally in Chapter 5). Drag the blue and orange handles (or use the sliders) to choose two planes: the green line is their zone axis, and every plane satisfying $hu+kv+lw=0$ turns gold; they all lie in the gold sheet perpendicular to the axis. Change the cell to see that the sheet and the integer test agree even for oblique cells.`,
      deps: ['xtal-4.1', 'xtal-4.2'],
      refs: ['Hammond ch. 5'],
      tags: ['zone axis', 'Miller indices', 'cross product'],
      credit: 'C. S. Weiss, zone law, 1804 (date as stated by the IUCr Online Dictionary)',
      verify: true,
      scope: String.raw`Valid for lattice planes and lattice directions in any lattice; $[uvw]$ is a direction of the direct lattice and $(hkl)$ a plane family of the same lattice.`,
      links: { iucr: 'https://dictionary.iucr.org/Zone_axis', wikipedia: 'https://en.wikipedia.org/wiki/Zone_axis' },
      viz(v) {
        const CE = { cubic: CELLS.cubic, tetragonal: CELLS.tetragonal, monoclinic: MONO_B };
        let V = cellVectors(CE.cubic), A = recipBasis(V);
        v.select('cell', ['cubic', 'tetragonal', 'monoclinic'], 'cubic', { onChange: (k) => { V = cellVectors(CE[k]); A = recipBasis(V); H1.refresh(); H2.refresh(); } });
        const s = v.stage({ x: [-3.0, 3.0], y: [-2.6, 2.6], equal: true, axes: false, height: 450, title: 'plane normals (hkl) and the zone they share (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.3, axes: false });
        const toPos = (i) => comb(i, A), toIdx = (p) => V.map((a) => dot(a, p));
        const H1 = indexHandle(v, sc, { names: ['$h_1$', '$k_1$', '$l_1$'], init: [1, 1, 0], range: 2, color: 'accent', label: 'plane 1', toPos, toIdx });
        const H2 = indexHandle(v, sc, { names: ['$h_2$', '$k_2$', '$l_2$'], init: [0, 1, 1], range: 2, color: 'orange', label: 'plane 2', toPos, toIdx });
        let info = null;
        v.render(() => {
          const p = H1.get(), q = H2.get(), z = [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]], par = !z.some((x) => x);
          const red = par ? [0, 0, 0] : reduceIdx(z), r = comb(red, V);
          sc.begin();
          const mem = [], oth = [];
          let agree = true;
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let k = -2; k <= 2; k++) {
            if (!i && !j && !k) continue;
            const g = comb([i, j, k], A), inZ = !par && i * red[0] + j * red[1] + k * red[2] === 0;
            if (!par && inZ !== Math.abs(dot(g, r)) < 1e-9) agree = false;
            (inZ ? mem : oth).push({ idx: [i, j, k], g });
          }
          sc.dots(oth.map((m) => m.g), { r: 2.4, color: 'muted', alpha: 0.55, top: false });
          sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          if (!par) {
            const n = unit(r), t = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = unit(cross(n, t)), e2 = cross(n, e1);
            sc.disc(e1, e2, 2.0, { fill: 'gold', fillAlpha: 0.1, color: 'gold' });
            sc.dots(mem.map((m) => m.g), { r: 4.6, color: 'gold' });
            sc.line(mul(-2.3, n), mul(2.3, n), { color: 'green', width: 2.6 }, 8);
            sc.tex(idxTex(red, '[', ']'), mul(2.5, n), { size: 17, color: 'green' });
          }
          sc.arrow([0, 0, 0], comb(p, A), { color: 'accent', width: 2.4 });
          sc.arrow([0, 0, 0], comb(q, A), { color: 'orange', width: 2.4 });
          sc.flush();
          info = { p, q, z, red, par, mem, agree };
        });
        v.readout(() => {
          const { p, q, z, red, par, mem, agree } = info;
          if (par) return `$${idxTex(p)}$ and $${idxTex(q)}$ are the same orientation (parallel normals): the cross product vanishes and they do not fix a zone. Choose two different planes.`;
          const shown = mem.slice(0, 14).map((m) => idxTex(m.idx)).join('\\ ');
          const t1 = p[0] * red[0] + p[1] * red[1] + p[2] * red[2], t2 = q[0] * red[0] + q[1] * red[1] + q[2] * red[2];
          return `Cross product of $${idxTex(p)}$ and $${idxTex(q)}$: $(${z.map(barTex).join(',\\,')})$ → zone axis $${idxTex(red, '[', ']')}$. Check: $h_1u+k_1v+l_1w=${t1}$, $h_2u+k_2v+l_2w=${t2}$.\n**${mem.length}** planes with $|h|,|k|,|l|\\le2$ satisfy $hu+kv+lw=0$ (the gold dots), e.g. $${shown}$. The integer test and the geometric test "normal ⟂ axis" ${agree ? 'agree for all 124 candidate planes' : 'DISAGREE (a bug!)'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Families of planes and multiplicity',
      statement: String.raw`Let $\mathcal G$ be the point group of a crystal. The **family** $\{hkl\}$ is the set of distinct planes $(h'k'l')$ obtained from $(hkl)$ by the operations of $\mathcal G$, and its size $m_{hkl}$ is the **multiplicity** of the family. By the orbit–stabilizer theorem
$$m_{hkl}=\frac{|\mathcal G|}{|\mathrm{Stab}(hkl)|},$$
where the stabilizer consists of the operations that leave the normal vector of the plane unchanged. The multiplicity depends on the symmetry: for $m\bar3m$ the families $\{100\}$, $\{110\}$, $\{111\}$, $\{hk0\}$ and $\{hkl\}$ (general) have $6,12,8,24,48$ members, and lowering the symmetry splits families: in a tetragonal crystal (4/mmm) $(100)$ and $(001)$ are no longer equivalent.`,
      idea: String.raw`A symmetry operation maps lattice planes to lattice planes, so the point group acts on the set of planes by acting on their normal vectors (the reciprocal vectors $\mathbf g_{hkl}$). The family is the orbit of $\mathbf g_{hkl}$ under this action, and its size is $|\mathcal G|$ divided by the order of the subgroup fixing $\mathbf g$ (orbit–stabilizer). A normal along a high-symmetry axis is fixed by many operations and has a small orbit; a general normal is fixed only by the identity and has an orbit of size $|\mathcal G|$. Equivalent planes have the same spacing, so multiplicity counts the coincident lines of a powder diagram. Here opposite planes $(hkl)$ and $(\bar h\bar k\bar l)$ are counted as different when the group lacks an inversion.`,
      caption: String.raw`Pick a point group (the cell is chosen to match its crystal system) and a plane $(hkl)$. The arrows are the unit normals of all planes of $\{hkl\}$, generated by applying every matrix of the group to the normal of $(hkl)$. The bars give the multiplicity of the classical families in the chosen group; the gold bar is the family you selected. Compare $m\bar3m$ with $4/mmm$ and $2/m$.`,
      deps: ['xtal-4.2', 'xtal-3.4'],
      refs: ['Hammond ch. 5'],
      tags: ['multiplicity', 'point group', 'orbit-stabilizer'],
      viz(v) {
        const NAMES = ['m-3m', 'm-3', '432', '4/mmm', 'mmm', '6/mmm', '-3m', '2/m', '-1'];
        const PG = pointGroups();
        const CELLFOR = { cubic: CELLS.cubic, tetragonal: CELLS.tetragonal, orthorhombic: CELLS.orthorhombic, trigonal: CELLS.hexagonal, hexagonal: CELLS.hexagonal, monoclinic: CELLS.monoclinic, triclinic: CELLS.triclinic };
        const pgSel = v.select('point group', NAMES.map((n) => ({ value: n, label: `$${n.replace(/-(\d)/g, '\\bar{$1}')}$` })), 'm-3m');
        const sh = v.slider('$h$', -3, 3, 1, { int: true }), sk = v.slider('$k$', -3, 3, 0, { int: true }), sl = v.slider('$l$', -3, 3, 0, { int: true });
        const s = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, axes: false, height: 420, title: 'normals of the planes of $\\{hkl\\}$ (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.65, pitch: 0.3, axes: false });
        const B = v.stage({ x: [0.3, 7.7], y: [0, 52], axes: 'box', gutter: true, height: 300, xlabel: 'family', ylabel: 'multiplicity', title: 'multiplicities of some families in this group' });
        const FAM = [[1, 0, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [1, 1, 1], [2, 1, 0], [1, 2, 3]];
        B.setTicks(FAM.map((f, i) => [i + 1, f.join('')]), null);
        let info = null;
        v.render(() => {
          const g = PG.find((x) => x.hm === pgSel.value), V = cellVectors(CELLFOR[g.sys]), A = recipBasis(V), hkl = [sh.value, sk.value, sl.value];
          const ok = hkl.some((x) => x), orb = ok ? planeOrbit(g.ops, V, hkl) : [];
          sc.begin();
          drawCell(sc, V.map((r) => mul(0.8, r)), mul(-0.4, add(add(V[0], V[1]), V[2])), { color: 'muted', width: 1, alpha: 0.5 });
          sc.dot([0, 0, 0], { r: 3, color: 'ink' });
          const labelThem = orb.length <= 16;
          for (const q of orb) {
            const n = unit(comb(q, A)), tip = mul(1.35, n);
            sc.arrow([0, 0, 0], tip, { color: 'gold', width: 2, head: 8, alpha: 0.9 });
            sc.dot(tip, { r: 3.5, color: 'gold' });
            if (labelThem) sc.tex(idxTex(q), mul(1.55, n), { size: 12.5, color: 'ink' });
          }
          sc.flush();
          const R = g.ops.map((R_) => 1);
          void R;
          const mult = FAM.map((f) => planeOrbit(g.ops, V, f).length);
          const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
          const sel = ok ? FAM.findIndex((f) => planeOrbit(g.ops, V, f).some((q) => eq(q, hkl))) : -1;
          B.bars(mult, { x0: 1, color: (val, i) => (i === sel ? 'gold' : 'accent') });
          B.hline(g.order, { color: 'red', dash: true, alpha: 0.6 });
          B.text(`|G| = ${g.order}`, 7.6, g.order + 2.4, { size: 12, color: 'red', align: 'right' });
          const stab = ok ? g.ops.filter((M) => { const A2 = A; const gv = comb(hkl, A2), gv2 = mv3(M, gv); return norm(sub(gv, gv2)) < 1e-8; }).length : 0;
          info = { g, hkl, ok, orb, mult, stab, V };
        });
        v.readout(() => {
          const { g, hkl, ok, orb, mult, stab } = info;
          if (!ok) return 'Choose a nonzero $(hkl)$.';
          const lst = orb.slice(0, 24).map((q) => idxTex(q)).join('\\ ') + (orb.length > 24 ? '\\ \\dots' : '');
          return `Point group $${g.hm.replace(/-(\d)/g, '\\bar{$1}')}$ (${g.sys}), order $|\\mathcal G|=${g.order}$. The family of $${idxTex(hkl)}$ has **${orb.length}** members: $${lst}$.\nOrbit–stabilizer: the plane's normal is fixed by $${stab}$ operations and $${g.order}/${stab}=${g.order / (stab || 1)}$ ${g.order / (stab || 1) === orb.length ? '= the orbit size' : '≠ the orbit size (a bug!)'}. Multiplicities of $\\{100\\},\\{001\\},\\{110\\},\\{101\\},\\{111\\},\\{210\\},\\{123\\}$: ${mult.join(', ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Proposition',
      name: 'Angles between planes and directions',
      statement: String.raw`Let $G_{ij}=\mathbf a_i\cdot\mathbf a_j$ be the metric tensor of the cell and $G^{*}=G^{-1}$ the reciprocal metric tensor. For directions $[u_1v_1w_1],[u_2v_2w_2]$ (column vectors $\mathbf u_1,\mathbf u_2$) and planes $(h_1k_1l_1),(h_2k_2l_2)$ (vectors $\mathbf h_1,\mathbf h_2$):
$$\cos\varphi_{\text{dir}}=\frac{\mathbf u_1^{\mathsf T}G\,\mathbf u_2}{\sqrt{\mathbf u_1^{\mathsf T}G\mathbf u_1}\sqrt{\mathbf u_2^{\mathsf T}G\mathbf u_2}},\qquad
\cos\varphi_{\text{pl}}=\frac{\mathbf h_1^{\mathsf T}G^{*}\mathbf h_2}{\sqrt{\mathbf h_1^{\mathsf T}G^{*}\mathbf h_1}\sqrt{\mathbf h_2^{\mathsf T}G^{*}\mathbf h_2}},$$
where $\varphi_{\text{pl}}$ is the angle between the plane **normals**. The angle $\theta$ between a direction $[uvw]$ and a plane $(hkl)$ satisfies $\sin\theta=\dfrac{|hu+kv+lw|}{\sqrt{\mathbf h^{\mathsf T}G^{*}\mathbf h}\ \sqrt{\mathbf u^{\mathsf T}G\mathbf u}}$. In a cubic cell $G$ and $G^*$ are multiples of the identity and both reduce to the familiar $\cos\varphi=(h_1h_2+k_1k_2+l_1l_2)/(\ldots)$; in other cells that shortcut is wrong.`,
      idea: String.raw`A direction is the Cartesian vector $\mathbf r=\sum u_i\mathbf a_i$, so $\mathbf r_1\cdot\mathbf r_2=\sum u_{1i}u_{2j}\,\mathbf a_i\cdot\mathbf a_j=\mathbf u_1^{\mathsf T}G\,\mathbf u_2$: the metric tensor is the dot product written in cell coordinates. A plane's normal is the reciprocal vector $\mathbf g=\sum h_i\mathbf a_i^*$, and the Gram matrix of the reciprocal basis is $G^{-1}$ (Proposition 4.4), which gives the plane formula. Between a line and a plane, the line's angle to the normal is $90^\circ-\theta$, and $\mathbf g\cdot\mathbf r=hu+kv+lw$ is the pairing from the zone law (4.5), so $\theta=0$ exactly when the direction lies in the plane.`,
      caption: String.raw`Choose what to compare and a cell, then drag the two handles (or use the sliders): in the plane modes the handle sits at the plane's normal $\mathbf g_{hkl}$, in the direction modes at the lattice vector. The arc is the measured angle between the Cartesian vectors, and the readout compares it with the metric-tensor formula and with the cubic shortcut, which agrees only in a cubic cell (try monoclinic or triclinic).`,
      deps: ['xtal-4.4'],
      refs: ['Hammond ch. 5'],
      tags: ['metric tensor', 'interplanar angle', 'Miller indices'],
      viz(v) {
        const CE = { cubic: CELLS.cubic, tetragonal: CELLS.tetragonal, hexagonal: CELLS.hexagonal, monoclinic: MONO_B, triclinic: CELLS.triclinic };
        let V = cellVectors(CE.cubic), A = recipBasis(V), G = gramOf(V), Gs = inv3(G);
        let kinds = ['g', 'g'];
        const setMode = (m) => { kinds = m === 'planes' ? ['g', 'g'] : m === 'dirs' ? ['r', 'r'] : ['g', 'r']; H1 && H1.refresh(); H2 && H2.refresh(); };
        const modeSel = v.select('compare', [{ value: 'planes', label: 'two planes' }, { value: 'dirs', label: 'two directions' }, { value: 'pd', label: 'plane and direction' }], 'planes', { onChange: setMode });
        v.select('cell', Object.keys(CE), 'cubic', { onChange: (k) => { V = cellVectors(CE[k]); A = recipBasis(V); G = gramOf(V); Gs = inv3(G); H1.refresh(); H2.refresh(); } });
        const s = v.stage({ x: [-2.3, 2.3], y: [-1.9, 1.9], equal: true, axes: false, height: 400, title: 'vectors compared, and their angle (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.3, axes: false });
        const mk = (j) => ({ toPos: (i) => (kinds[j] === 'g' ? comb(i, A) : comb(i, V)), toIdx: (p) => (kinds[j] === 'g' ? V.map((a) => dot(a, p)) : A.map((b) => dot(b, p))) });
        let H1 = null, H2 = null;
        H1 = indexHandle(v, sc, { names: ['1st: $h$ or $u$', '1st: $k$ or $v$', '1st: $l$ or $w$'], init: [1, 1, 0], range: 2, color: 'accent', label: '1', ...mk(0) });
        H2 = indexHandle(v, sc, { names: ['2nd: $h$ or $u$', '2nd: $k$ or $v$', '2nd: $l$ or $w$'], init: [0, 1, 1], range: 2, color: 'orange', label: '2', ...mk(1) });
        let info = null;
        v.render(() => {
          const i1 = H1.get(), i2 = H2.get(), c1 = mk(0).toPos(i1), c2 = mk(1).toPos(i2);
          const n1 = norm(c1), n2 = norm(c2), ok = n1 > 1e-9 && n2 > 1e-9;
          sc.begin();
          drawCell(sc, V, [0, 0, 0], { color: 'muted', width: 1, alpha: 0.5 });
          sc.dot([0, 0, 0], { r: 3.5, color: 'ink' });
          [[c1, kinds[0], 'accent'], [c2, kinds[1], 'orange']].forEach(([c, kd, col]) => {
            sc.arrow([0, 0, 0], c, { color: col, width: 2.6 });
            if (kd === 'g' && norm(c) > 1e-9) {
              const n = unit(c), t = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = unit(cross(n, t)), e2 = cross(n, e1);
              sc.disc(e1, e2, 0.85, { fill: col, fillAlpha: 0.1, color: col }, mul(norm(c) > 0 ? 0 : 0, n));
            }
          });
          let phi = NaN;
          if (ok) {
            const u1 = unit(c1), u2 = unit(c2);
            phi = deg(Math.acos(clamp(dot(u1, u2), -1, 1)));
            const w = unit(sub(u2, mul(dot(u1, u2), u1))), arc = [];
            if (norm(sub(u2, mul(dot(u1, u2), u1))) > 1e-9) { for (let t = 0; t <= 24; t++) { const a = (rad(phi) * t) / 24; arc.push(add(mul(0.7 * Math.cos(a), u1), mul(0.7 * Math.sin(a), w))); } sc.path(arc, { color: 'green', width: 2.4 }); }
          }
          sc.flush();
          info = { i1, i2, ok, phi, k: kinds.join('') };
        });
        v.readout(() => {
          const { i1, i2, ok, phi, k } = info;
          if (!ok) return 'One of the vectors is zero: choose nonzero indices.';
          const name = (i, kd) => (kd === 'g' ? idxTex(i) : idxTex(i, '[', ']'));
          const naiveCos = dot(i1, i2) / (Math.hypot(...i1) * Math.hypot(...i2)), naive = deg(Math.acos(clamp(naiveCos, -1, 1)));
          let formula, Mx;
          if (k === 'gg') { formula = quad(Gs, i1, i2) / Math.sqrt(quad(Gs, i1, i1) * quad(Gs, i2, i2)); Mx = ['G^{*}=G^{-1}', Gs]; }
          else if (k === 'rr') { formula = quad(G, i1, i2) / Math.sqrt(quad(G, i1, i1) * quad(G, i2, i2)); Mx = ['G', G]; }
          else { formula = (i1[0] * i2[0] + i1[1] * i2[1] + i1[2] * i2[2]) / Math.sqrt(quad(Gs, i1, i1) * quad(G, i2, i2)); Mx = ['G^{*}\\text{ and }G', G]; }
          const ang = deg(Math.acos(clamp(formula, -1, 1))), th = 90 - ang;
          const what = k === 'gg' ? 'angle between the plane normals' : k === 'rr' ? 'angle between the directions' : 'angle between the plane normal and the direction';
          const tail = k === 'gr' ? `\nThe line makes the angle $\\theta=90^\\circ-${fmt(ang, 2)}^\\circ=${fmt(th, 2)}^\\circ$ with the plane${Math.abs(formula) < 1e-9 ? ' (it lies in the plane: $hu+kv+lw=0$)' : ''}.` : '';
          return `${name(i1, k[0])} and ${name(i2, k[1])}: ${what} measured from Cartesian vectors $${fmt(phi, 3)}^\\circ$; metric formula $${fmt(ang, 3)}^\\circ$; the cubic shortcut gives $${fmt(naive, 3)}^\\circ$${Math.abs(naive - phi) < 1e-3 ? ' (it happens to agree)' : ' (wrong in this cell)'}.${tail}\n$${Mx[0] === 'G' ? 'G' : Mx[0]}=${k === 'gr' ? mat(Gs) + ',\\ G=' + mat(G) : mat(Mx[1])}$`;
        });
      },
    },
  ],
};
