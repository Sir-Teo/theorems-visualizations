// Crystallography (Hammond; Giacovazzo) — Chapter 3: Lattices and symmetry in three dimensions
// Part 1 (this file): crystal systems, Bravais lattices, primitive cells, the 32 point groups, Hermann–Mauguin symbols, screw axes and glide planes (3.1–3.6).
// Part 2 (ch03-b.js): the 230 space groups, Wyckoff positions, stereographic projection, Neumann's principle, tensors, piezoelectricity (3.7–3.12).
import {
  clamp, rad, deg, add, sub, mul, dot, norm, cross, unit, cellVectors, triple, drawCell, fmt, fitScale, comb, TAU,
  I3, mm3, mv3, det3, tr3, rotM, reflM, opInfo, pointGroup, pointGroups, PG_FIRST, SYSTEMS, HM_POSITIONS, deriveHM, alongDirection, hmComponent,
  gram, latticeSymmetry, latticeAxes, LATTICE_SYSTEM_BY_ORDER, CENTRING, primitiveBasis, bravaisType, pgTilePos, pgTileAt, hmMath, hmPlain, SG, spaceGroupOps,
} from './ch03.shared.js';

export default {
  collection: 'xtal',
  chapter: 3,
  title: 'Lattices and symmetry in three dimensions',
  summary: String.raw`In three dimensions the same reasoning yields seven crystal systems, fourteen Bravais lattices and thirty-two point groups. Adding translations to rotations produces screw axes and glide planes and, in all, 230 space groups. Neumann's principle then says a crystal's physical properties must be at least as symmetric as its point group — which decides, for example, which crystals can be piezoelectric.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'The seven crystal systems',
      statement: String.raw`The crystallographic point groups fall into seven **crystal systems**, each defined by the symmetry its crystals must have, not by the numbers in a cell:
(a) **triclinic** — no rotation axis (at most an inversion centre);
(b) **monoclinic** — one 2-fold axis (or mirror), conventionally $\mathbf b$, forcing $\alpha=\gamma=90^\circ$;
(c) **orthorhombic** — three perpendicular 2-fold axes (or mirrors), forcing $\alpha=\beta=\gamma=90^\circ$;
(d) **tetragonal** — one 4-fold axis $\mathbf c$, forcing $a=b$ and three right angles;
(e) **trigonal** — one 3-fold axis, forcing a hexagonal cell ($a=b$, $\gamma=120^\circ$, $\alpha=\beta=90^\circ$) or a rhombohedral cell ($a=b=c$, $\alpha=\beta=\gamma$);
(f) **hexagonal** — one 6-fold axis, forcing $a=b$, $\gamma=120^\circ$, $\alpha=\beta=90^\circ$;
(g) **cubic** — four 3-fold axes along the body diagonals, forcing $a=b=c$ and three right angles.
The conditions on $a,b,c,\alpha,\beta,\gamma$ are necessary, not sufficient: a monoclinic crystal may have $\beta=90^\circ$ by accident without becoming orthorhombic. The *lattice* of a crystal has its own, possibly higher, symmetry (its holohedry); there are seven lattice systems, which differ from the crystal systems only in that the trigonal and hexagonal crystal systems share the hexagonal lattice, and a rhombohedral lattice system carries the trigonal crystals with a rhombohedral lattice.`,
      idea: String.raw`A symmetry operation maps the lattice onto itself, so in the basis $\mathbf a_1,\mathbf a_2,\mathbf a_3$ it is an integer matrix $M$ with $M^{\mathsf T}GM=G$, where $G_{ij}=\mathbf a_i\cdot\mathbf a_j$ is the Gram matrix of the cell. Demanding a 2-fold axis along $\mathbf b$ puts $\mathbf b\cdot\mathbf a=\mathbf b\cdot\mathbf c=0$ (this is the crystallographic restriction theorem 2.2 in disguise: only 2-, 3-, 4- and 6-fold axes keep $M$ integral), and similarly for the other systems. Run backwards, counting the integer matrices with $M^{\mathsf T}GM=G$ for a given cell returns the order of the lattice's point group, which names its system: 2, 4, 8, 16, 12, 24, 48.`,
      caption: String.raw`Choose a starting point or drag the six cell parameters. With *snap* on, nearly special values (equal edges, $90^\circ$, $120^\circ$, equal angles) are made exact. The cell is drawn with the rotation axes that the **lattice** really has, found by an exhaustive search for integer matrices $M$ with $M^{\mathsf T}GM=G$ (2-fold orange, 3-fold green, 4-fold purple, 6-fold pink). The table lights the system with that symmetry order. Try $a=b$ with an oblique $\gamma$: the cell looks special, yet the search reveals an orthorhombic lattice in disguise (a centred one), because the system is a statement about symmetry.`,
      deps: ['xtal-1.2', 'xtal-2.2'],
      refs: ['Hammond ch. 3'],
      tags: ['crystal systems', 'cell metric', 'symmetry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Crystal_system' },
      viz(v) {
        const PRE = {
          triclinic: [1, 1.25, 1.55, 82, 96, 104], monoclinic: [1, 1.25, 1.55, 90, 108, 90], orthorhombic: [1, 1.25, 1.55, 90, 90, 90], tetragonal: [1.15, 1.15, 1.6, 90, 90, 90],
          trigonal: [1.3, 1.3, 1.3, 74, 74, 74], hexagonal: [1.1, 1.1, 1.65, 90, 90, 120], cubic: [1.4, 1.4, 1.4, 90, 90, 90],
        };
        const A = v.slider('$a$', 0.6, 2, 1, { step: 0.01 }), B = v.slider('$b$', 0.6, 2, 1.25, { step: 0.01 }), C = v.slider('$c$', 0.6, 2, 1.55, { step: 0.01 });
        const AL = v.slider('$\\alpha$ (°)', 55, 125, 90, { step: 0.5 }), BE = v.slider('$\\beta$ (°)', 55, 125, 108, { step: 0.5 }), GA = v.slider('$\\gamma$ (°)', 55, 125, 90, { step: 0.5 });
        const snap = v.toggle('snap to special values', true);
        const sliders = [A, B, C, AL, BE, GA];
        v.select('start from', SYSTEMS.map((k) => ({ value: k, label: k })), 'monoclinic', { onChange: (k) => PRE[k].forEach((x, i) => sliders[i].set(x)) });
        const s = v.stage({ x: [-2.1, 2.1], y: [-1.8, 1.8], equal: true, axes: false, height: 380, title: 'the cell and the rotation axes of its lattice (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.65, pitch: 0.34, axes: false });
        const T = v.stage({ x: [0, 100], y: [-0.4, 8.2], axes: false, height: 330, full: true, title: 'what each crystal system requires' });
        v.legend([['orange', '2-fold axis'], ['green', '3-fold axis'], ['purple', '4-fold axis'], ['pink', '6-fold axis']]);
        const ROWS = [
          ['triclinic', 'none (or only inversion)', 'a, b, c, α, β, γ all free', '2'],
          ['monoclinic', 'one 2-fold axis or mirror (b)', 'α = γ = 90°', '4'],
          ['orthorhombic', 'three ⟂ 2-fold axes or mirrors', 'α = β = γ = 90°', '8'],
          ['tetragonal', 'one 4-fold axis (c)', 'a = b, α = β = γ = 90°', '16'],
          ['trigonal', 'one 3-fold axis (c)', 'a = b, γ = 120°, α = β = 90°  or  a = b = c, α = β = γ', '12 / 24'],
          ['hexagonal', 'one 6-fold axis (c)', 'a = b, γ = 120°, α = β = 90°', '24'],
          ['cubic', 'four 3-fold axes (body diagonals)', 'a = b = c, α = β = γ = 90°', '48'],
        ];
        const AXCOL = { 2: 'orange', 3: 'green', 4: 'purple', 6: 'pink' };
        const effective = () => {
          let [a, b, c, al, be, ga] = sliders.map((q) => q.value);
          if (snap.value) {
            const close = (x, y) => Math.abs(x - y) < 0.04 * Math.max(x, y);
            if (close(a, b)) b = a;
            if (close(b, c)) c = b;
            if (close(a, c)) c = a;
            const ang = (x) => (Math.abs(x - 90) < 2.5 ? 90 : Math.abs(x - 120) < 2.5 ? 120 : x);
            al = ang(al); be = ang(be); ga = ang(ga);
            if (al !== 90 && Math.abs(al - be) < 2.5 && Math.abs(be - ga) < 2.5 && Math.abs(al - ga) < 2.5 && al !== 120) { const m = (al + be + ga) / 3; al = be = ga = m; }
          }
          return [a, b, c, al, be, ga];
        };
        let info = null;
        v.render(() => {
          const P = effective(), Vc = cellVectors(P);
          if (!Vc) { s.text('these angles cannot meet at a corner', 0, 0, { align: 'center', color: 'red', size: 14 }); info = null; return; }
          const k = fitScale(Vc, 1.55), V = Vc.map((r) => r.map((x) => x * k)), ctr = mul(0.5, add(add(V[0], V[1]), V[2])), o = mul(-1, ctr);
          const G = gram(Vc), Ms = latticeSymmetry(G), order = Ms.length, system = LATTICE_SYSTEM_BY_ORDER[order] || 'other';
          const axes = latticeAxes(Ms, V);
          sc.begin();
          drawCell(sc, V, o, { color: 'accent', width: 1.8, alpha: 0.95 });
          const corner = (i, j, l) => add(o, add(add(mul(i, V[0]), mul(j, V[1])), mul(l, V[2])));
          for (const [i, j, l] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]]) sc.dot(corner(i, j, l), { r: 4, color: 'blue', top: false });
          const o0 = corner(0, 0, 0);
          sc.arrow(o0, add(o0, mul(1, V[0])), { color: 'ink', width: 2 }); sc.arrow(o0, add(o0, V[1]), { color: 'ink', width: 2 }); sc.arrow(o0, add(o0, V[2]), { color: 'ink', width: 2 });
          sc.tex('\\mathbf a', add(add(o0, mul(0.55, V[0])), mul(-0.12, unit(V[1]))), { size: 16 });
          sc.tex('\\mathbf b', add(add(o0, mul(0.55, V[1])), mul(-0.12, unit(V[0]))), { size: 16 });
          sc.tex('\\mathbf c', add(add(o0, mul(0.55, V[2])), mul(-0.12, unit(V[0]))), { size: 16 });
          for (const ax of axes) {
            const L = ax.n === 3 && order !== 12 && order !== 24 ? 0.95 : 0.9 + 0.08 * ax.n / 2, p = add(ctr, mul(-L, ax.u)), q = add(ctr, mul(L, ax.u));
            sc.line(add(p, o), add(q, o), { color: AXCOL[ax.n], width: 2.4, alpha: 0.95 }, 1);
            sc.dot(add(add(ctr, o), mul(L, ax.u)), { r: 3.4, color: AXCOL[ax.n], top: false });
            sc.dot(add(add(ctr, o), mul(-L, ax.u)), { r: 3.4, color: AXCOL[ax.n], top: false });
          }
          sc.flush();
          // the table
          const hi = { triclinic: order === 2, monoclinic: order === 4, orthorhombic: order === 8, tetragonal: order === 16, trigonal: order === 12 || order === 24, hexagonal: order === 24, cubic: order === 48 };
          T.text('crystal system', 1.5, 7.6, { size: 12, color: 'muted', align: 'left' }); T.text('characteristic symmetry', 15, 7.6, { size: 12, color: 'muted', align: 'left' });
          T.text('conditions on the cell', 47, 7.6, { size: 12, color: 'muted', align: 'left' }); T.text('lattice order', 88, 7.6, { size: 12, color: 'muted', align: 'left' });
          ROWS.forEach((r, i) => {
            const y = 6.6 - i;
            if (hi[r[0]]) T.rect(0, y - 0.45, 100, y + 0.45, { fill: r[0] === 'trigonal' && order === 24 ? 'orange' : 'green', fillAlpha: r[0] === 'trigonal' && order === 24 ? 0.1 : 0.17, stroke: false });
            const col = hi[r[0]] ? 'ink' : 'muted';
            T.text(r[0], 1.5, y, { size: 13, color: col, align: 'left', baseline: 'middle' }); T.text(r[1], 15, y, { size: 12, color: col, align: 'left', baseline: 'middle' });
            T.text(r[2], 47, y, { size: 12, color: col, align: 'left', baseline: 'middle' }); T.text(r[3], 88, y, { size: 12.5, color: col, align: 'left', baseline: 'middle' });
          });
          info = { P, order, system, naeq: axes.length, volume: Math.abs(triple(Vc)) };
        });
        v.readout(() => {
          if (!info) return 'No parallelepiped has these angles: any two must exceed the third, and the three must sum to less than $360^\\circ$.';
          const { P, order, system } = info, [a, b, c, al, be, ga] = P;
          const nm = LATTICE_SYSTEM_BY_ORDER[order] ? `**${system}** lattice system` : 'a lattice not in the table';
          const eq = (x, y) => Math.abs(x - y) < 1e-6;
          const naive = eq(a, b) && eq(b, c) && al === 90 && be === 90 && ga === 90 ? 'cubic' : eq(a, b) && al === 90 && be === 90 && ga === 90 ? 'tetragonal' : al === 90 && be === 90 && ga === 90 ? 'orthorhombic'
            : eq(a, b) && al === 90 && be === 90 && ga === 120 ? 'hexagonal' : eq(a, b) && eq(b, c) && eq(al, be) && eq(be, ga) ? 'rhombohedral' : (al === 90 && ga === 90) || (al === 90 && be === 90) || (be === 90 && ga === 90) ? 'monoclinic' : 'triclinic';
          const note = naive !== system && !(naive === 'rhombohedral' && system === 'rhombohedral') && !(naive === 'monoclinic' && system === 'monoclinic')
            ? ` The cell parameters alone suggest *${naive}*, but the lattice has ${system === 'orthorhombic' || system === 'monoclinic' || system === 'tetragonal' ? 'a different' : 'its own'} symmetry: this primitive cell describes a ${system === 'orthorhombic' && naive === 'monoclinic' ? 'centred orthorhombic' : system === 'cubic' ? 'cubic' : 'differently centred'} lattice, so the conventional cell would be chosen differently.` : '';
          return `Cell $a,b,c=${fmt(a, 2)},\\,${fmt(b, 2)},\\,${fmt(c, 2)}$, $\\alpha,\\beta,\\gamma=${fmt(al, 1)}^\\circ,\\,${fmt(be, 1)}^\\circ,\\,${fmt(ga, 1)}^\\circ$.\nThe search finds $${order}$ integer matrices with $M^{\\mathsf T}GM=G$: the lattice has point-group order $${order}$, ${nm}.${note}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'The fourteen Bravais lattices',
      statement: String.raw`There are exactly **fourteen** types of three-dimensional lattice (Bravais lattices): primitive $P$ in every system, plus base-centred $C$ (monoclinic, orthorhombic), body-centred $I$ (orthorhombic, tetragonal, cubic), face-centred $F$ (orthorhombic, cubic) and the rhombohedral lattice $R$. Explicitly: triclinic $aP$; monoclinic $mP,mC$; orthorhombic $oP,oC,oI,oF$; tetragonal $tP,tI$; hexagonal $hP$; rhombohedral $hR$; cubic $cP,cI,cF$. Every other combination of a crystal system with a centring (for example tetragonal $C$, tetragonal $F$, cubic $C$, monoclinic $I$) describes a lattice that already appears in the list, with a different choice of cell.`,
      idea: String.raw`Two lattices have the same type when they have the same point symmetry and the same arrangement of centring. Start from the seven lattice systems (their point-group orders $2,4,8,16,12,24,48$ are those of 3.1) and add the translations $\tfrac12(\mathbf a+\mathbf b)$, $\tfrac12(\mathbf a+\mathbf b+\mathbf c)$, … to the primitive cell. If the new lattice has the same symmetry order as the old, it can be a new type; if the order changes, or if a smaller cell with the system's metric (orthogonal, equal edges) exists, it is an old type in disguise: a $C$-centred tetragonal lattice is a primitive tetragonal lattice with cell edges $a/\sqrt2$ and axes turned $45^\circ$, an $F$-centred tetragonal lattice is $I$-centred on the same terms, and a $C$-centred cube has lost its 3-fold axes. Bravais carried out this bookkeeping in 1848–1850 (Frankenheim's earlier list of 1842 had fifteen, one too many).`,
      caption: String.raw`Pick a crystal system and a centring: the conventional cell is drawn with its extra lattice points in gold. The program then **computes** the Bravais type of the resulting lattice: it reduces the lattice to a primitive cell, counts the integer matrices that preserve its metric (the point-group order), and searches the short lattice vectors for the smallest cell with the metric of that system. When this differs from your choice, the better cell is drawn in green. The table runs all 35 combinations: ✓ marks the combinations that are genuine, arrows show where the others end up, and the count of distinct results at the bottom comes out as 14.`,
      deps: ['xtal-3.1'],
      refs: ['Hammond ch. 3'],
      credit: 'A. Bravais, 1848–1850 (Frankenheim’s 1842 list had fifteen lattices)',
      tags: ['Bravais lattices', 'centring', 'lattice types'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bravais_lattice' },
      viz(v) {
        const DEF = {
          triclinic: [1, 1.25, 1.55, 82, 96, 104], monoclinic: [1, 1.2, 1.5, 90, 108, 90], orthorhombic: [1, 1.25, 1.6, 90, 90, 90], tetragonal: [1, 1, 1.45, 90, 90, 90],
          hexagonal: [1, 1, 1.6, 90, 90, 120], rhombohedral: [1.1, 1.1, 1.1, 72, 72, 72], cubic: [1, 1, 1, 90, 90, 90],
        };
        const SYS = Object.keys(DEF), CEN = ['P', 'C', 'I', 'F', 'R'];
        const PE = { triclinic: 'a', monoclinic: 'm', orthorhombic: 'o', tetragonal: 't', hexagonal: 'h', rhombohedral: 'h', cubic: 'c' };
        const cache = {};
        const solve = (sys, c) => {
          const k = sys + c;
          if (!cache[k]) { const V = cellVectors(DEF[sys]), pb = primitiveBasis(V, c); cache[k] = { V, pb, res: bravaisType(pb.B) }; }
          return cache[k];
        };
        const sysSel = v.select('crystal system', SYS.map((k) => ({ value: k, label: k })), 'tetragonal');
        const cenSel = v.select('centring', CEN.map((k) => ({ value: k, label: k })), 'C');
        const s = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 400, weight: 1.1, title: 'conventional cell and lattice points (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.3, axes: false });
        const T = v.stage({ x: [0, 11], y: [-1.1, 8.6], axes: false, height: 400, weight: 1, title: 'all 35 combinations' });
        let info = null;
        v.render(() => {
          const sys = sysSel.value, c = cenSel.value, { V, res } = solve(sys, c), k = fitScale(V, 1.6);
          const Vs = V.map((r) => r.map((x) => x * k)), o = mul(-0.5, add(add(Vs[0], Vs[1]), Vs[2]));
          const pt = (f, V2 = Vs, o2 = o) => add(o2, comb(f, V2));
          sc.begin();
          // a block of lattice points around the cell
          const cs = [[0, 0, 0], ...CENTRING[c]];
          for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) for (let l = -1; l <= 2; l++) for (const t of cs) {
            const f = [i + t[0], j + t[1], l + t[2]];
            if (f.some((x) => x < -0.51 || x > 1.51)) continue;
            const inside = f.every((x) => x > -1e-6 && x < 1 + 1e-6), isCentre = t.some((x) => x !== 0);
            sc.dot(pt(f), { r: inside ? (isCentre ? 6 : 5) : 2.6, color: isCentre ? 'gold' : 'blue', top: false, alpha: inside ? 1 : 0.45 });
          }
          drawCell(sc, Vs, o, { color: 'accent', width: 2 });
          const same = res.cell && res.pearson === PE[sys] + (sys === 'rhombohedral' ? 'R' : c) && sys !== 'rhombohedral' ? true : res.pearson === 'hR' && (sys === 'rhombohedral' || (sys === 'hexagonal' && c === 'R'));
          if (res.cell && !same) {
            const W = res.cell.map((r) => r.map((x) => x * k)), o2 = add(o, mul(0.0, W[0]));
            drawCell(sc, W, o, { color: 'green', width: 3, alpha: 0.95 });
            for (const [i, j, l] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1]]) sc.dot(pt([i, j, l], W, o2), { r: 3.6, color: 'green', top: false });
          }
          sc.flush();
          // table of all combinations
          CEN.forEach((cc, i) => T.text(cc, 4.1 + 1.55 * i, 8.0, { size: 13, color: 'muted', align: 'center' }));
          const found = new Set();
          SYS.forEach((sy, r) => {
            const y = 7 - r;
            T.text(sy, 0.05, y, { size: 11.5, color: 'muted', align: 'left', baseline: 'middle' });
            CEN.forEach((cc, i) => {
              const R = solve(sy, cc).res, own = R.pearson === PE[sy] + cc || (R.pearson === 'hR' && (sy === 'rhombohedral' && cc === 'P' || sy === 'hexagonal' && cc === 'R')) || (R.pearson === 'mC' && sy === 'monoclinic' && cc === 'C') || (R.pearson === 'aP' && sy === 'triclinic' && cc === 'P');
              found.add(R.pearson);
              const x = 4.1 + 1.55 * i, sel = sy === sys && cc === c;
              if (sel) T.rect(x - 0.74, y - 0.42, x + 0.74, y + 0.42, { fill: 'accent', fillAlpha: 0.18, color: 'accent' });
              T.text(own ? R.pearson + ' ✓' : '→ ' + R.pearson, x, y, { size: 11.5, color: own ? 'green' : 'muted', align: 'center', baseline: 'middle', weight: own ? 700 : 400 });
            });
          });
          T.text(`distinct lattice types found: ${found.size}`, 5.5, -0.7, { size: 13, align: 'center', color: found.size === 14 ? 'green' : 'red', weight: 700 });
          info = { sys, c, res, same, n: found.size };
        });
        v.readout(() => {
          const { sys, c, res, same, n } = info;
          if (!res.cell) return 'No conventional cell was found for this combination.';
          const p = res.params.map((x, i) => (i < 3 ? v.fix(x, 3) : v.fix(x, 1) + '^\\circ'));
                    const head = `${sys} lattice with ${c} centring: point-group order $${res.order}$ (${LATTICE_SYSTEM_BY_ORDER[res.order]}), Bravais type **${res.pearson}**; the smallest cell of that system holds ${res.index === 3 ? 3 : res.index} lattice point${res.index > 1 ? 's' : ''} (cell $a,b,c=${p[0]},${p[1]},${p[2]}$, $\\alpha,\\beta,\\gamma=${p[3]},${p[4]},${p[5]}$, edges in units of the input cell's $a$).`;
          return `${head}\n${same ? 'This combination is a genuine Bravais lattice: no cell of the same system with fewer points exists.' : `Not new: the green cell shows the same lattice as **${res.pearson}**.`} Over the 35 combinations the program finds **${n}** distinct types.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Primitive versus conventional cells',
      statement: String.raw`A **primitive cell** contains exactly one lattice point and has the smallest possible volume, $V_P$; a **conventional cell** is chosen to show the symmetry of the lattice (right angles, equal edges, a hexagonal prism), even if this requires extra lattice points at the face or body centres, so that it holds $k=2,3$ or $4$ points and has volume $kV_P$. For the cubic lattices: $P$ has $k=1$; $I$ has $k=2$ and a primitive rhombohedral cell with $a_P=\tfrac{\sqrt3}{2}a$ and $\alpha_P\approx109.47^\circ$; $F$ has $k=4$ and a primitive rhombohedral cell with $a_P=a/\sqrt2$ and $\alpha_P=60^\circ$. A primitive cell is far from unique (any basis related to another by an integer matrix of determinant $\pm1$ will do) but its volume is not: it is the volume per lattice point. Conventional cells are used in tables and descriptions of structures, primitive cells in band-structure calculations.`,
      idea: String.raw`The lattice is the same set of points whichever cell is drawn. Changing from basis $\mathbf a_i$ to $\mathbf a'_i=\sum_jM_{ij}\mathbf a_j$ multiplies the cell volume by $|\det M|$, so a cell with a smaller volume that still tiles space must have $\det M=\pm1$ relative to a primitive cell, and any larger cell has $|\det M|=k$ points. In the conventional cube of fcc, the face centres are lattice points: $k=4$ ($\tfrac18\cdot8+\tfrac12\cdot6$). The three vectors $\tfrac a2(0,1,1)$, $\tfrac a2(1,0,1)$, $\tfrac a2(1,1,0)$ from a corner to the three neighbouring face centres generate every point and have $60^\circ$ between them; the cell they span looks only rhombohedral (order 12 of its own shape), although the lattice has the full cubic symmetry (order 48).`,
      caption: String.raw`Pick a lattice ($F$, $I$, or a $C$-centred orthorhombic one) and one of three cells: the conventional cell, the standard primitive cell, or a skewed primitive cell that is just as good as a tiling. The lattice points that fall inside the (half-open) cell are counted and shown in gold; the volume is the triple product of the edge vectors. The last line compares the symmetry of the **cell as a shape** (signed permutations of its edges that preserve all lengths and angles) with the symmetry of the **lattice** (integer matrices preserving the metric): the primitive cell of fcc hides 36 of the 48 operations.`,
      deps: ['xtal-3.2'],
      refs: ['Hammond ch. 3'],
      tags: ['primitive cell', 'conventional cell', 'centring'],
      viz(v) {
        const LAT = {
          F: { V: cellVectors([1, 1, 1, 90, 90, 90]), c: 'F', name: 'face-centred cubic' },
          I: { V: cellVectors([1, 1, 1, 90, 90, 90]), c: 'I', name: 'body-centred cubic' },
          C: { V: cellVectors([1, 1.45, 1.1, 90, 90, 90]), c: 'C', name: 'C-centred orthorhombic' },
        };
        const STDPRIM = { F: [[0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]], I: [[-0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, -0.5]], C: [[0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0, 1]] };
        const latSel = v.select('lattice', [{ value: 'F', label: 'fcc (F)' }, { value: 'I', label: 'bcc (I)' }, { value: 'C', label: 'C-centred orthorhombic' }], 'F');
        const cellSel = v.select('cell', [{ value: 'conv', label: 'conventional' }, { value: 'prim', label: 'primitive (standard)' }, { value: 'skew', label: 'primitive (skewed)' }], 'prim');
        const s = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 440, title: 'the lattice and the chosen cell (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.3, axes: false });
        let info = null;
        const cache = {};
        const setup = (key) => {
          if (cache[key]) return cache[key];
          const L = LAT[key], B = STDPRIM[key].map((f) => comb(f, L.V));
          const prim = latticeSymmetry(gram(B), 2);
          // all lattice points in a block, as integer coordinates in the reduced primitive basis
          const pts = [];
          for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) for (let l = -4; l <= 4; l++) pts.push({ n: [i, j, l], r: comb([i, j, l], B) });
          return (cache[key] = { L, B, order: prim.length, pts, k: fitScale(L.V, 1.55) });
        };
        const inv3 = (M) => { const c = [cross(M[1], M[2]), cross(M[2], M[0]), cross(M[0], M[1])], d = dot(M[0], c[0]); return [0, 1, 2].map((i) => [0, 1, 2].map((j) => c[j][i] / d)); };
        const SP = [];
        [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].forEach((p) => { for (let m = 0; m < 8; m++) { const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let c = 0; c < 3; c++) S[p[c]][c] = (m >> c) & 1 ? -1 : 1; SP.push(S); } });
        v.render(() => {
          const D = setup(latSel.value), { L, B, k } = D;
          const U = cellSel.value === 'conv' ? L.V : cellSel.value === 'prim' ? B : [add(B[0], B[1]), B[1], add(B[2], B[0])];
          const Vc = L.V.map((r) => r.map((x) => x * k)), o = mul(-0.5, add(add(Vc[0], Vc[1]), Vc[2])), Us = U.map((r) => r.map((x) => x * k));
          const Ui = inv3(U), Vi = inv3(L.V);
          let count = 0;
          sc.begin();
          const inside = [];
          for (const p of D.pts) {
            const f = [0, 1, 2].map((q) => p.r[0] * Ui[0][q] + p.r[1] * Ui[1][q] + p.r[2] * Ui[2][q]);
            const inCell = f.every((x) => x > -1e-7 && x < 1 - 1e-7);
            if (inCell) { count++; inside.push(p); }
            const w = add(o, mul(k, p.r));
            const g = [0, 1, 2].map((q) => p.r[0] * Vi[0][q] + p.r[1] * Vi[1][q] + p.r[2] * Vi[2][q]);
            if (g.every((x) => x > -0.52 && x < 1.52)) sc.dot(w, { r: inCell ? 6.5 : 3, color: inCell ? 'gold' : 'blue', top: false, alpha: inCell ? 1 : 0.55 });
          }
          if (cellSel.value !== 'conv') drawCell(sc, Vc, o, { color: 'faint', width: 1.2, alpha: 0.7 });
          drawCell(sc, Us, o, { color: 'accent', width: 2.6 });
          const o0 = o;
          [0, 1, 2].forEach((q) => { sc.arrow(o0, add(o0, Us[q]), { color: ['accent', 'orange', 'green'][q], width: 3 }); });
          sc.flush();
          const [a, b, c] = U.map((r) => Math.hypot(...r)), ang = (p, q) => deg(Math.acos(clamp(dot(U[p], U[q]) / (norm(U[p]) * norm(U[q])), -1, 1)));
          const G = gram(U);
          const shapeOrder = SP.filter((S) => {
            // S acts on the edge vectors; it preserves the cell shape iff S^T G S = G
            const St = [0, 1, 2].map((i) => [0, 1, 2].map((j) => S[j][i])), M = mm3(mm3(St, G), S);
            return M.every((r, i) => r.every((x, j) => Math.abs(x - G[i][j]) < 1e-9));
          }).length;
          info = { U, a, b, c, al: ang(1, 2), be: ang(0, 2), ga: ang(0, 1), vol: Math.abs(triple(U)), V0: Math.abs(triple(L.V)), count, shapeOrder, order: D.order, name: L.name, cs: cellSel.value };
        });
        v.readout(() => {
          const { a, b, c, al, be, ga, vol, V0, count, shapeOrder, order, name, cs } = info, Vp = Math.abs(triple(STDPRIM[latSel.value].map((f) => comb(f, LAT[latSel.value].V))));
          return `${name}, ${cs === 'conv' ? 'conventional cell' : cs === 'prim' ? 'standard primitive cell' : 'skewed primitive cell'}: $a,b,c=${v.fix(a, 3)},\\,${v.fix(b, 3)},\\,${v.fix(c, 3)}$, $\\alpha,\\beta,\\gamma=${v.fix(al, 1)}^\\circ,\\,${v.fix(be, 1)}^\\circ,\\,${v.fix(ga, 1)}^\\circ$.\nVolume $\\mathbf a\\cdot(\\mathbf b\\times\\mathbf c)=${v.fix(vol, 4)}$ = ${v.fix(vol / V0, 3)} of the conventional cell = $${v.fix(vol / Vp, 0)}\\times$ the primitive volume; lattice points inside (counted): **${count}** ${count === Math.round(vol / Vp) ? '✓' : '✗'}.\nSymmetry of the cell as a shape: ${shapeOrder} operations; symmetry of the lattice: ${order}.${shapeOrder < order ? ` The cell hides ${order - shapeOrder} of them.` : ' The cell shows all of them.'}`;
        });
      },
    },
  ],
};
