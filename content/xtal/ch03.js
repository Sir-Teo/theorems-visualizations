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
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'The thirty-two crystallographic point groups',
      statement: String.raw`A **crystallographic point group** is a finite group of orthogonal $3\times3$ matrices (rotations, reflections, the inversion and their products) that maps some lattice onto itself. There are exactly **32** of them up to a change of axes: 2 triclinic, 3 monoclinic, 3 orthorhombic, 7 tetragonal, 5 trigonal, 7 hexagonal and 5 cubic. All rotation axes are 1-, 2-, 3-, 4- or 6-fold (by the crystallographic restriction), and every crystallographic point group is a subgroup of the point group of some lattice, i.e. of one of the seven holohedries; since each of these is contained in the cubic group $m\bar3m$ (order 48) or the hexagonal group $6/mmm$ (order 24), the 32 groups are found among the subgroups of those two. Eleven of the 32 contain the inversion (the centrosymmetric or Laue-type groups), eleven contain only rotations (the chiral groups).`,
      idea: String.raw`The restriction theorem (2.2) leaves rotations of order 1, 2, 3, 4, 6. A point group is generated by a few such rotations, mirrors and the inversion, and the possible combinations are limited because two rotation axes generate further ones (the product of two 2-fold rotations about axes at angle $\theta$ is a rotation by $2\theta$), so only the polyhedral and dihedral patterns survive. Instead of arguing case by case one can simply list all subgroups of the two big groups $m\bar3m$ and $6/mmm$ and sort them by their type: the program does exactly this and finds 32 types. Gadolin (1860s), using the stereographic projection, and, earlier but largely unnoticed, Hessel (1830) derived the list geometrically.`,
      caption: String.raw`Click a group on the board (rows are the crystal systems): the **stereogram** shows the great circles of its mirror planes, the symbols of its rotation axes (lens $=2$, triangle $=3$, square $=4$, hexagon $=6$; hollow for rotoinversion axes) and the orbit of a general pole, which you can drag: dots are poles on the upper hemisphere, circles on the lower one, and the number of images equals the order of the group. *Search all subgroups* lists every subgroup of the cubic group $m\bar3m$ and the hexagonal group $6/mmm$ and counts the different types. Switch on *forbidden axis* to try a rotation through $360^\circ/n$ with $n=5,7,8,\dots$: the pattern looks fine on the sphere but the trace $1+2\cos(2\pi/n)$ is not an integer.`,
      deps: ['xtal-3.1', 'qchem-8.2'],
      refs: ['Hammond ch. 4', 'Giacovazzo ch. 1'],
      credit: 'J. F. C. Hessel, 1830 (largely unnoticed); A. V. Gadolin, 1860s (independently, by stereographic projection)',
      tags: ['point groups', 'stereogram', 'symmetry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Crystallographic_point_group' },
      viz(v) {
        let sel = 14;
        const forb = v.toggle('forbidden axis', false);
        const nS = v.slider('rotation order $n$', 2, 12, 5, { int: true });
        const searchBtn = v.button('Search all subgroups of the cubic and hexagonal groups', () => { enumRes = enumerate(); });
        let enumRes = null;
        const P = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 430, weight: 1.05, title: 'stereogram (drag the gold pole)' });
        const T = v.stage({ x: [-2.4, 7.3], y: [-0.5, 7.1], axes: false, height: 430, weight: 1, title: 'the 32 point groups (click one)' });
        const pole = P.handle(0.38, 0.22, { color: 'gold', r: 8, constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.97 ? [(0.97 * x) / r, (0.97 * y) / r] : [x, y]; } });
        T.onClick((x, y) => { const i = pgTileAt(x, y); if (i >= 0) { sel = i; forb.value = false; } v.invalidate(); });
        const key = (A) => A.flat().map((x) => Math.round(x * 1e4)).join(',');
        const sig = (ops) => { const m = {}; for (const R of ops) { const k = (det3(R) > 0 ? '+' : '−') + Math.round(tr3(R)); m[k] = (m[k] || 0) + 1; } return Object.keys(m).sort().map((k) => k + '×' + m[k]).join(' '); };
        function subgroups(parent) {
          const seen = new Map(), triv = { gens: [], ops: closure(parent, []) };
          seen.set(triv.ops.map(key).sort().join('|'), triv);
          let frontier = [triv];
          while (frontier.length) {
            const nf = [];
            for (const H of frontier) {
              const inH = new Set(H.ops.map(key));
              for (const g of parent) {
                if (inH.has(key(g))) continue;
                const gens = [...H.gens, g], ops = closure(parent, gens), k = ops.map(key).sort().join('|');
                if (!seen.has(k)) { const e = { gens, ops }; seen.set(k, e); nf.push(e); }
              }
            }
            frontier = nf;
          }
          return [...seen.values()];
        }
        function closure(parent, gens) {
          const out = [I3], seen = new Set([key(I3)]);
          for (let i = 0; i < out.length; i++) for (const g of gens) { const c = mm3(g, out[i]), k = key(c); if (!seen.has(k)) { seen.add(k); out.push(c); } }
          return out;
        }
        function enumerate() {
          const A = subgroups(pointGroup(31).ops), B = subgroups(pointGroup(26).ops), types = new Map();
          for (const H of [...A, ...B]) { const k = sig(H.ops); if (!types.has(k)) types.set(k, { order: H.ops.length, ex: H.ops }); }
          return { nA: A.length, nB: B.length, types: types.size };
        }
        const proj = (p) => (p[2] >= -1e-9 ? [p[0] / (1 + p[2]), p[1] / (1 + p[2])] : [p[0] / (1 - p[2]), p[1] / (1 - p[2])]);
        const poly = (n, r, rot = 0) => Array.from({ length: n }, (_, k) => [r * Math.cos(rot + (TAU * k) / n), r * Math.sin(rot + (TAU * k) / n)]);
        const symbol = (c, n, improper, col) => {
          const [cx, cy] = c, r = 0.052;
          const pts = n === 2 ? Array.from({ length: 24 }, (_, k) => [0.062 * Math.cos((TAU * k) / 24), 0.024 * Math.sin((TAU * k) / 24)]) : poly(n, r, n === 4 ? Math.PI / 4 : Math.PI / 2);
          P.poly(pts.map(([x, y]) => [cx + x, cy + y]), { fill: improper ? 'panel' : col, fillAlpha: improper ? 0.9 : 0.95, color: col, width: 1.6 });
        };
        let info = null;
        v.render(() => {
          nS.el.hidden = !forb.value; searchBtn.hidden = forb.value;
          // ----- the board
          for (let i = 0; i < 32; i++) {
            const g = pointGroup(i), { x, y } = pgTilePos(i), on = !forb.value && i === sel;
            T.rect(x + 0.04, y + 0.06, x + 0.96, y + 0.94, { fill: on ? 'accent' : g.centro ? 'muted' : 'panel', fillAlpha: on ? 0.28 : g.centro ? 0.12 : 0.55, color: on ? 'accent' : 'faint', width: on ? 2.2 : 1 });
            T.text('$' + hmMath(g.hm) + '$', x + 0.5, y + 0.55, { size: g.hm.length > 4 ? 9.5 : 11.5, align: 'center', baseline: 'middle' });
            T.text(g.sf + ' · ' + g.order, x + 0.5, y + 0.2, { size: 9.5, color: 'muted', align: 'center', baseline: 'middle' });
          }
          SYSTEMS.forEach((sy, k) => T.text(sy, -0.12, 6.5 - k, { size: 12, align: 'right', color: 'muted', baseline: 'middle' }));
          T.text('grey tiles contain the inversion', 3.5, -0.28, { size: 11, color: 'muted', align: 'center' });
          // ----- the stereogram
          let ops, label, sym = null;
          if (forb.value) { const n = nS.value; ops = Array.from({ length: n }, (_, k) => rotM([0, 0, 1], (360 * k) / n)); label = `C${n}`; }
          else { const g = pointGroup(sel); ops = g.ops; label = `${g.hm} (${g.sf})`; sym = g; }
          P.circle(0, 0, 1, { color: 'ink', width: 2.2 }); P.hline(0, { color: 'faint', alpha: 0.5 }); P.vline(0, { color: 'faint', alpha: 0.5 });
          // symmetry elements
          const axes = [];
          let mirrors = 0, rots = {}, roto = {}, inv = false;
          for (const R of ops) {
            const f = opInfo(R);
            if (f.kind === 'E') continue;
            if (f.kind === 'inv') { inv = true; continue; }
            if (f.kind === 'mirror') {
              mirrors++;
              const nm = f.axis, t = Math.abs(nm[2]) > 0.999 ? [1, 0, 0] : unit(cross(nm, [0, 0, 1])), e2 = cross(nm, t);
              if (Math.abs(nm[2]) > 0.999) { P.circle(0, 0, 1, { color: 'accent', width: 4, alpha: 0.9 }); continue; }
              const pts = [];
              for (let k = 0; k <= 90; k++) { const a = (Math.PI * k) / 45, p = add(mul(Math.cos(a), t), mul(Math.sin(a), e2)); pts.push(p[2] >= -1e-9 ? [p[0] / (1 + p[2]), p[1] / (1 + p[2])] : null); }
              P.path(pts, { color: 'accent', width: 2 });
              continue;
            }
            const dedupe = axes.find((a) => Math.hypot(...cross(a.u, f.axis)) < 1e-6 && a.imp === (f.kind === 'rotoinv'));
            if (f.kind === 'rot') rots[f.n] = (rots[f.n] || 0) + 1; else roto[f.n] = (roto[f.n] || 0) + 1;
            if (dedupe) dedupe.n = Math.max(dedupe.n, f.n); else axes.push({ u: f.axis, n: f.n, imp: f.kind === 'rotoinv' });
          }
          for (const a of axes) {
            if (a.imp && axes.some((b) => !b.imp && Math.hypot(...cross(a.u, b.u)) < 1e-6)) continue;
            const ends = Math.abs(a.u[2]) < 1e-6 ? [a.u, mul(-1, a.u)] : [a.u[2] > 0 ? a.u : mul(-1, a.u)];
            for (const e of ends) symbol(proj(e), a.n, a.imp, a.imp ? 'accent' : 'ink');
          }
          if (inv) P.dot(0, 0, { r: 4.5, color: 'accent', hollow: true });
          // the general pole and its images
          const r2 = pole.x ** 2 + pole.y ** 2, n0 = [(2 * pole.x) / (1 + r2), (2 * pole.y) / (1 + r2), (1 - r2) / (1 + r2)];
          const imgs = [];
          for (const R of ops) { const q = mv3(R, n0); if (!imgs.some((p) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-6)) imgs.push(q); }
          for (const q of imgs) { const [x, y] = proj(q); P.dot(x, y, { r: 6, color: q[2] >= 0 ? 'gold' : 'orange', hollow: q[2] < -1e-9, alpha: 0.95 }); }
          P.corner(label, 'tl', { size: 15, weight: 700, plate: true });
          info = { ops, label, imgs: imgs.length, mirrors, rots, roto, inv, sym, forb: forb.value, n: nS.value };
        });
        v.readout(() => {
          const { ops, label, imgs, mirrors, rots, roto, inv, sym, forb: fb, n } = info;
          if (fb) {
            const t = 1 + 2 * Math.cos((2 * Math.PI) / n), ok = Math.abs(t - Math.round(t)) < 1e-9;
            return `Rotation by $360^\\circ/${n}$ about $z$: the pole has ${imgs} images, but the trace of the $3\\times3$ matrix is $1+2\\cos(2\\pi/${n})=${v.fix(t, 4)}$. In a lattice basis the matrix must be an **integer** matrix, so its trace is an integer: ${ok ? `here it is, so $n=${n}$ is allowed ✓ (it is one of 1, 2, 3, 4, 6).` : `it is not, so no lattice has a ${n}-fold axis ✗.`}`;
          }
          const rt = Object.entries(rots).map(([k, c]) => `${c}×${k}`).join(', ') || 'none', ro = Object.entries(roto).map(([k, c]) => `${c}×$\\bar{${k}}$`).join(', ');
          const cnt = enumRes ? `\nSubgroup search: ${enumRes.nA} subgroups of $m\\bar3m$ and ${enumRes.nB} of $6/mmm$ fall into **${enumRes.types}** types (sorted by the number of elements of each determinant and trace) — the 32 crystallographic point groups.` : '';
          return `${'$'}${hmMath(sym.hm)}$ ($${sym.sf}$), ${sym.sys} system, order $${ops.length}$: the general pole has **${imgs}** images ${imgs === ops.length ? '= the order ✓' : '✗'}. Mirror planes: ${mirrors}; rotations: ${rt}${ro ? '; rotoinversions: ' + ro : ''}; inversion centre: ${inv ? 'yes' : 'no'}; ${sym.centro ? 'centrosymmetric' : 'non-centrosymmetric'}, ${ops.every((R) => det3(R) > 0) ? 'chiral (rotations only)' : 'achiral'}.${cnt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Hermann–Mauguin notation',
      statement: String.raw`The **Hermann–Mauguin (international) symbol** of a point group lists symmetry elements along up to three prescribed directions of the crystal system, in a fixed order: for each direction, the highest-order rotation axis $n$ (or rotoinversion axis $\bar n$) along it and, if present, the mirror plane perpendicular to it, written $n/m$ (or just $m$ when no axis is present). The directions are: orthorhombic $\mathbf a,\mathbf b,\mathbf c$; tetragonal $\mathbf c$, $\langle100\rangle$, $\langle110\rangle$; trigonal $\mathbf c$, $\langle100\rangle$; hexagonal $\mathbf c$, $\langle100\rangle$, $\langle210\rangle$; cubic $\langle100\rangle$, $\langle111\rangle$, $\langle110\rangle$; monoclinic: the unique axis; triclinic: none. In the short symbol, $2/m$ is shortened to $m$ when other positions follow, and trailing positions without symmetry are dropped. Example: $4/m\;2/m\;2/m$ is written $4/mmm$, and $4/m\;\bar3\;2/m$ is written $m\bar3m$. The older **Schoenflies** symbols ($C_{4h}$, $D_{4h}$, $O_h$, …) name the same groups by their structure instead of their directions.`,
      idea: String.raw`The notation is a recipe for reading a group off its elements, and the recipe can be run mechanically: for each prescribed direction find the highest proper rotation about it and the improper operations that reverse it (a mirror perpendicular to the direction is $-C_2$, a rotoinversion $\bar n$ is $-C_n$). Because the symmetry elements of a group in one crystal system lie along very few distinct directions, three positions are enough, and the mirror–axis pairing $n/m$ is what makes the symbol short. Hermann (1928) and Mauguin (1931) introduced the symbol, replacing the Schoenflies notation (1891), which describes the group but not the orientation of its elements relative to the lattice; it became the standard of the International Tables in 1935.`,
      caption: String.raw`Click any of the 32 groups (or type a symbol, such as *4/mmm* or *-43m*). The 3D model shows the group's symmetry elements along the three symbol positions in three colours — axes as lines, mirrors as discs perpendicular to the direction — and the symbol below is **derived from the group's matrices**, one position at a time, with the family of directions each position stands for. Use *highlight* to look at one position only; the readout shows the derivation and checks it against the symbol of the group.`,
      deps: ['xtal-3.4'],
      refs: ['Hammond ch. 4'],
      credit: 'C. Hermann, 1928; C.-V. Mauguin, 1931 (adopted for the International Tables, 1935); A. Schoenflies, 1891',
      tags: ['Hermann–Mauguin', 'point groups', 'notation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hermann%E2%80%93Mauguin_notation' },
      viz(v) {
        let sel = 14;
        const hi = v.select('highlight', [{ value: 0, label: 'all' }, { value: 1, label: '1st' }, { value: 2, label: '2nd' }, { value: 3, label: '3rd' }], 0);
        let typed = '4/mmm', err = '';
        const norm = (t) => t.replace(/[−–]/g, '-').replace(/\s+/g, '');
        v.input('type a symbol', typed, { width: 120, onChange: (t) => {
          const q = norm(t); typed = t; err = '';
          const i = pointGroups().findIndex((g) => { const d = deriveHM(g); return g.hm === q || d.short === q || d.full.join('') === q.replace(/\s/g, '') || d.full.join(' ').replace(/\s/g, '') === q; });
          if (i >= 0) sel = i; else err = `"${t}" is not one of the 32 symbols`;
        } });
        const S = v.stage({ x: [-2.1, 2.1], y: [-1.9, 1.9], equal: true, axes: false, height: 400, weight: 1.15, title: 'symmetry elements by position (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.62, pitch: 0.34, axes: false });
        const T = v.stage({ x: [-2.4, 7.3], y: [-0.5, 7.1], axes: false, height: 400, weight: 1, title: 'the 32 point groups (click one)' });
        const Rd = v.stage({ x: [0, 100], y: [0, 10], axes: false, height: 130, full: true, title: 'reading the symbol' });
        T.onClick((x, y) => { const i = pgTileAt(x, y); if (i >= 0) { sel = i; err = ''; } v.invalidate(); });
        const COL = ['accent', 'orange', 'green'];
        let info = null;
        v.render(() => {
          const g = pointGroup(sel), pos = HM_POSITIONS[g.sys], d = deriveHM(g);
          // board
          for (let i = 0; i < 32; i++) {
            const h = pointGroup(i), { x, y } = pgTilePos(i), on = i === sel;
            T.rect(x + 0.04, y + 0.06, x + 0.96, y + 0.94, { fill: on ? 'accent' : h.centro ? 'muted' : 'panel', fillAlpha: on ? 0.28 : h.centro ? 0.12 : 0.55, color: on ? 'accent' : 'faint', width: on ? 2.2 : 1 });
            T.text('$' + hmMath(h.hm) + '$', x + 0.5, y + 0.55, { size: h.hm.length > 4 ? 9.5 : 11.5, align: 'center', baseline: 'middle' });
            T.text(h.sf, x + 0.5, y + 0.2, { size: 9.5, color: 'muted', align: 'center', baseline: 'middle' });
          }
          SYSTEMS.forEach((sy, k) => T.text(sy, -0.12, 6.5 - k, { size: 12, align: 'right', color: 'muted', baseline: 'middle' }));
          // 3D
          sc.begin();
          const hexy = g.sys === 'trigonal' || g.sys === 'hexagonal', H = 1.0;
          if (hexy) {
            const ring = (z) => Array.from({ length: 6 }, (_, k) => [1.05 * Math.cos((Math.PI * k) / 3), 1.05 * Math.sin((Math.PI * k) / 3), z]);
            for (const z of [-H, H]) sc.path([...ring(z), ring(z)[0]], { color: 'faint', width: 1.2 });
            for (let k = 0; k < 6; k++) sc.line(ring(-H)[k], ring(H)[k], { color: 'faint', width: 1.2 }, 1);
          } else {
            const w = g.sys === 'tetragonal' ? [1, 1, 1.15] : g.sys === 'cubic' ? [1, 1, 1] : [1, 1.2, 1.4];
            drawCell(sc, [[2 * w[0], 0, 0], [0, 2 * w[1], 0], [0, 0, 2 * w[2]]], [-w[0], -w[1], -w[2]], { color: 'faint', width: 1.2, alpha: 0.9 });
          }
          pos.forEach((P, pi) => {
            const on = !hi.value || hi.value === pi + 1, col = COL[pi], al = on ? 1 : 0.12;
            for (const dir of P.dirs) {
              const a = alongDirection(g.ops, dir), u = unit(dir), L = 1.3;
              const hasAxis = a.p >= 2, hasRoto = (a.q.has(4) && a.p === 2) || a.q.has(6) || (a.q.has(3) && a.p === 3);
              if (hasAxis || hasRoto) {
                sc.line(mul(-L, u), mul(L, u), { color: col, width: on ? 3 : 1.4, alpha: al }, 1);
                const lab = hasRoto && !hasAxis ? 'bar' : '';
                const nlab = a.q.has(6) ? 6 : a.q.has(4) && a.p === 2 ? 4 : a.p;
                for (const sgn of [1, -1]) sc.dot(mul(sgn * L, u), { r: on ? 5 : 3, color: col, top: false, alpha: al, hollow: hasRoto && !hasAxis });
                if (on) sc.tex(lab === 'bar' ? `\\bar{${nlab}}` : String(nlab), mul(L + 0.17, u), { color: col, size: 15 });
              }
              if (a.q.has(2)) {
                const t = Math.abs(u[2]) > 0.9 ? [1, 0, 0] : unit(cross(u, [0, 0, 1])), e2 = cross(u, t);
                sc.disc(t, e2, 0.9, { fill: col, fillAlpha: on ? 0.1 : 0.03, color: col, width: on ? 1.5 : 0.6, alpha: al });
              }
            }
          });
          if (g.centro) sc.dot([0, 0, 0], { r: 5, color: 'ink', hollow: true, top: false });
          sc.flush();
          // symbol reading
          const comps = d.full, nW = Math.max(comps.length, 1);
          Rd.text('full symbol', 3, 8.2, { size: 12, color: 'muted', align: 'left' });
          comps.forEach((c, i) => {
            const x = 22 + i * 17;
            Rd.text('$' + hmMath(c).replace(/\\mathrm\{([^}]*)\}/, '$1') + '$', x, 7, { size: 25, color: COL[i], align: 'center', baseline: 'middle' });
            Rd.text(pos[i].name, x, 4.4, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          });
          Rd.text('short symbol', 62, 8.2, { size: 12, color: 'muted', align: 'left' });
          Rd.text('$' + hmMath(d.short) + '$', 70, 6.6, { size: 28, align: 'left', baseline: 'middle' });
          Rd.text('Schoenflies: $' + g.sf.replace(/^([A-Z])(\d?)(.*)$/, '$1_{$2$3}').replace('_{}', '') + '$', 62, 3.2, { size: 14, align: 'left', color: 'muted' });
          info = { g, d, pos };
        });
        v.readout(() => {
          const { g, d, pos } = info;
          const lines = pos.map((P, i) => { const a = alongDirection(g.ops, P.dirs[0]), q = [...a.q].sort(); return `position ${i + 1} (${P.name}): highest rotation about it ${a.p}${a.q.has(2) ? ', mirror perpendicular' : ''}${q.filter((n) => n > 2).length ? ', rotoinversion $\\bar{' + Math.max(...q.filter((n) => n > 2)) + '}$' : ''} → $${hmMath(d.full[i] || '1').replace(/\\mathrm\{([^}]*)\}/, '$1')}$`; });
          return `${err ? err + '. ' : ''}$${hmMath(g.hm)}$ — derived symbol $${hmMath(d.short)}$ ${d.short === g.hm ? '= the symbol of the group ✓' : '≠ the group’s symbol ✗'}.\n${lines.join(';  ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Screw axes and glide planes',
      statement: String.raw`A **screw axis** $n_m$ ($n=2,3,4,6$; $0<m<n$) is the combination of a rotation through $2\pi/n$ about an axis with a translation by $\tfrac mn$ of the lattice vector $\mathbf t$ along that axis; applying it $n$ times gives a pure lattice translation $m\mathbf t$. A **glide plane** is a reflection in a plane combined with a translation by half a lattice vector (or a quarter, for $d$) *parallel to the plane*: $a$, $b$, $c$ glide by $\tfrac12$ of the corresponding axis, $n$ by half of a face diagonal, $d$ (diamond glide) by a quarter of a face or body diagonal. Applying a glide twice gives a lattice translation (a centring translation for $d$). Unlike rotations and reflections, neither has a fixed point: they exist only in infinite crystals. The screw axes $n_m$ and $n_{n-m}$ have opposite handedness: $3_1$ and $4_1$ are right-handed, $3_2$ and $4_3$ left-handed, while $2_1$, $4_2$ and $6_3$ are equal to their mirror images.`,
      idea: String.raw`In the plane, glide reflections (item 2.5) already combine a reflection with a translation along its line; in three dimensions the same idea is applied to a mirror plane, and in addition a rotation can be combined with a translation along its axis. A translation component perpendicular to the plane (or axis) could be absorbed by moving the plane (or axis), so only the parallel component is intrinsic: for a glide it is half a lattice vector because the square of the operation must be a lattice translation; for a screw axis the component $m\mathbf t/n$ is fixed the same way, because the $n$-th power is a rotation by $2\pi$ plus a translation $m\mathbf t$. Reversing the sense of rotation turns $n_m$ into $n_{n-m}$, which is why the pairs $4_1$/$4_3$ and $3_1$/$3_2$ are mirror images (quartz occurs in two enantiomorphic forms with space groups $P3_121$ and $P3_221$). These operations were introduced by Fedorov, Schoenflies and Barlow when they derived the 230 space groups.`,
      caption: String.raw`Choose a screw axis (slider) or a glide plane and apply the operation $k$ times to the gold atom: the images spiral up the axis (screw) or hop across the plane and slide (glide). The drawn pitch is the smaller of $m/n$ and $1-m/n$ (the same set of points modulo $\mathbf c$), so $4_3$ is seen as a left-handed spiral; the readout checks that $n$ applications of the screw give a lattice translation, finds the handedness from $m/n$, and **verifies by computation** that the mirror image of the point set of $n_m$ is the point set of $n_{n-m}$. For the glides it checks whether twice the glide vector is a lattice vector — the $d$ glide fails, which is why it appears only in centred lattices.`,
      deps: ['xtal-3.4', 'xtal-2.5'],
      refs: ['Hammond ch. 4'],
      credit: 'E. S. Fedorov, A. Schoenflies, 1891; W. Barlow, 1894 (the 230 space groups)',
      tags: ['screw axis', 'glide plane', 'space group'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Screw_axis' },
      viz(v) {
        const SCREWS = [[2, 1], [3, 1], [3, 2], [4, 1], [4, 2], [4, 3], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5]], SUBD = '₀₁₂₃₄₅';
        const nm = (n, m) => `${n}${SUBD[m]}`;
        const mode = v.select('operation', [{ value: 'screw', label: 'screw axis' }, { value: 'glide', label: 'glide plane' }], 'screw');
        const sIdx = v.slider('screw axis', 0, 10, 3, { int: true, fmt: (x) => nm(...SCREWS[Math.round(x)]) });
        const gSel = v.select('glide', [{ value: 'm', label: 'm (mirror)' }, { value: 'a', label: 'a' }, { value: 'c', label: 'c' }, { value: 'n', label: 'n' }, { value: 'd', label: 'd' }], 'a');
        const kS = v.slider('applications $k$', 0, 12, 8, { int: true });
        const GV = { m: [0, 0, 0], a: [0.5, 0, 0], c: [0, 0, 0.5], n: [0.5, 0, 0.5], d: [0.25, 0, 0.25] };
        const A = v.stage({ x: [-2, 2], y: [-1.9, 1.9], equal: true, axes: false, height: 400, weight: 1.15, title: 'the operation applied repeatedly (drag to rotate)' });
        const scA = v.scene3(A, { yaw: -0.5, pitch: 0.42, axes: false });
        const B = v.stage({ x: [-2, 2], y: [-1.9, 1.9], equal: true, axes: false, height: 400, weight: 1, title: 'its partner, the mirror-image axis' });
        const scB = v.scene3(B, { yaw: -0.5, pitch: 0.42, axes: false });
        const Cp = v.stage({ x: [-0.75, 0.75], y: [-0.75, 0.75], equal: true, axes: false, height: 400, weight: 0.9, title: 'projection along the axis, heights in units of c' });
        const frac = (z) => { const t = z - Math.floor(z + 1e-9); for (const [x, s] of [[0, '0'], [1 / 12, '1/12'], [1 / 6, '⅙'], [1 / 4, '¼'], [1 / 3, '⅓'], [5 / 12, '5/12'], [1 / 2, '½'], [7 / 12, '7/12'], [2 / 3, '⅔'], [3 / 4, '¾'], [5 / 6, '⅚'], [11 / 12, '11/12']]) if (Math.abs(t - x) < 1e-6) return s; return t.toFixed(2); };
        const p0 = [0.3, 0.0, 0.0];
        // images of the point p0 under n_m; z0 is the starting height. For display (disp) the step is taken as m/n or m/n - 1 (the smaller pitch): same point set modulo c
        const imgsScrew = (n, m, K, disp = false, z0 = 0) => { const dz = disp && m / n > 0.5 ? m / n - 1 : m / n, out = []; for (let k = 0; k <= K; k++) { const a = (2 * Math.PI * k) / n; out.push([p0[0] * Math.cos(a) - p0[1] * Math.sin(a), p0[0] * Math.sin(a) + p0[1] * Math.cos(a), z0 + k * dz]); } return out; };
        const W = (p, z0 = 0) => [1.6 * p[0], 1.6 * p[1], 1.6 * (p[2] - 1) + z0];
        const cellFrames = (sc, nCells) => { for (let i = 0; i < nCells; i++) drawCell(sc, [[1.6, 0, 0], [0, 1.6, 0], [0, 0, 1.6]], [-0.8, -0.8, -1.6 + 1.6 * i], { color: 'faint', width: 1.1, alpha: 0.9 }); };
        const drawScrew = (sc, n, m, K, col) => {
          sc.line([0, 0, -1.7], [0, 0, 1.7], { color: 'faint', width: 2.4, alpha: 0.8 }, 1);
          cellFrames(sc, 2);
          const dz = m / n > 0.5 ? m / n - 1 : m / n, z0 = dz >= 0 ? 0.08 : 1.92, imgs = imgsScrew(n, m, K, true, z0).filter((p) => p[2] > -0.01 && p[2] < 2.01);
          // the continuous helix through the images (the screw is the discrete version of it)
          const H = []; for (let t = 0; t <= imgs.length - 1 + 1e-9; t += 0.05) H.push(W([p0[0] * Math.cos((2 * Math.PI * t) / n), p0[0] * Math.sin((2 * Math.PI * t) / n), z0 + t * dz]));
          if (imgs.length > 1) sc.path(H, { color: col, width: 1.2, alpha: 0.45 });
          imgs.forEach((p, k) => sc.dot(W(p), { r: k === 0 ? 7 : 6, color: k === 0 ? 'gold' : col, top: false }));
          for (let k = 0; k < imgs.length - 1; k++) sc.arrow(W(imgs[k]), W(imgs[k + 1]), { color: col, width: 1.8, head: 7, alpha: 0.85 });
        };
        let info = null;
        const hid = (st, h) => { st.el.style.display = h ? 'none' : ''; };
        v.render(() => {
          const gl = mode.value === 'glide';
          sIdx.el.hidden = gl; gSel.el.hidden = !gl; hid(B, gl); hid(Cp, gl);
          if (!gl) {
            const [n, m] = SCREWS[Math.round(sIdx.value)], K = kS.value, pn = SCREWS.find(([a, b]) => a === n && b === (n - m) % n) ? [n, n - m] : [n, m];
            const partner = m === n / 2 ? [n, m] : pn;
            scA.begin(); drawScrew(scA, n, m, K, 'accent'); scA.flush();
            scB.begin(); drawScrew(scB, partner[0], partner[1], K, 'orange'); scB.flush();
            // projection
            Cp.circle(0, 0, 0.1, { color: 'faint', alpha: 0 });
            const base = imgsScrew(n, m, n - 1).map((p) => [p[0], p[1], p[2] - Math.floor(p[2] + 1e-9)]);
            Cp.dot(0, 0, { r: 4, color: 'ink' });
            Cp.circle(0, 0, p0[0], { color: 'faint', dash: true, width: 1 });
            base.forEach((p, k) => {
              Cp.dot(p[0], p[1], { r: 8, color: 'accent', alpha: 0.9 });
              Cp.text(frac(imgsScrew(n, m, n - 1)[k][2]), p[0] * 1.3 + (p[0] >= 0 ? 0.04 : -0.04), p[1] * 1.3, { size: 12, align: p[0] >= 0 ? 'left' : 'right', baseline: 'middle' });
            });
            Cp.corner(`${nm(n, m)} · ${n} points per cell`, 'tl', { size: 13, weight: 700, plate: true });
            // checks
            const set = (arr) => arr.map((p) => [Math.round(((p[0] + 1) % 1) * 1000), Math.round(((p[1] + 1) % 1) * 1000), Math.round(((p[2] - Math.floor(p[2] + 1e-9)) % 1) * 1000) % 1000].join()).sort().join('|');
            const S1 = imgsScrew(n, m, n - 1), S2 = imgsScrew(partner[0], partner[1], n - 1).map((p) => p), mirrored = S1.map((p) => [p[0], -p[1], p[2]]);
            const L0 = imgsScrew(n, m, n)[n], Lrt = [L0[0] - p0[0], L0[1] - p0[1], L0[2]];
            info = { n, m, partner, tr: Lrt, same: set(mirrored) === set(S2), glide: false };
          } else {
            const g = gSel.value, t = GV[g], K = Math.min(kS.value, 6);
            // plane y = 0; atom at (0.15, 0.3, 0.1); operation (x, y, z) -> (x + t_x, -y, z + t_z); the plane has normal y
            const q0 = [0.15, 0.3, 0.1], pts = [q0];
            for (let k = 0; k < K; k++) { const p = pts[k]; pts.push([p[0] + t[0], -p[1], p[2] + t[2]]); }
            const w = (p) => [1.2 * (p[0] - 0.5), 1.2 * p[1] * 1.8, 1.2 * (p[2] - 0.5)];
            scA.begin();
            const pl = [[-0.55, 0, -0.1], [2.1, 0, -0.1], [2.1, 0, 1.1], [-0.55, 0, 1.1]].map(w);
            scA.poly(pl, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4 });
            for (const x0 of [0, 1]) drawCell(scA, [[1.2, 0, 0], [0, 1.2 * 1.8, 0], [0, 0, 1.2]], [1.2 * (x0 - 0.5), -0.5 * 1.2 * 1.8, -0.6], { color: 'faint', width: 1, alpha: 0.8 });
            pts.forEach((p, k) => {
              scA.dot(w(p), { r: k === 0 ? 7 : 6, color: k === 0 ? 'gold' : p[1] > 0 ? 'accent' : 'orange', top: false });
              if (k) scA.arrow(w(pts[k - 1]), w(p), { color: 'muted', width: 1.4, head: 6, alpha: 0.8 });
              scA.line(w(p), w([p[0], 0, p[2]]), { color: 'faint', width: 0.9, alpha: 0.7 }, 1);
            });
            scA.flush();
            const twice = [2 * t[0], 0, 2 * t[2]], lat = twice.every((x) => Math.abs(x - Math.round(x)) < 1e-9);
            info = { glide: true, g, t, twice, lat, K };
          }
        });
        v.readout(() => {
          if (!info.glide) {
            const { n, m, partner, tr, same } = info, r = m / n;
            const hand = Math.abs(r - 0.5) < 1e-9 ? 'achiral: equal to its own mirror image' : r < 0.5 ? 'right-handed' : 'left-handed';
            return `**${nm(n, m)}**: rotation by $360^\\circ/${n}$ with translation $\\tfrac{${m}}{${n}}\\mathbf c$. After $n=${n}$ applications the atom has moved by $(${v.fix(tr[0], 2)},${v.fix(tr[1], 2)},${v.fix(tr[2], 2)})$ = $${m}\\mathbf c$, a lattice translation ✓. Handedness from $m/n=${v.fix(r, 3)}$: ${hand}.\nMirror image of the $${n}$ points of ${nm(n, m)} (in one cell) equals the point set of ${nm(partner[0], partner[1])}: ${same ? 'yes ✓' : 'no ✗'}.`;
          }
          const { g, t, twice, lat, K } = info;
          return `**${g === 'm' ? 'mirror' : g + '-glide'}**: reflection in the plane $y=0$ followed by the translation $(${v.fix(t[0], 2)},0,${v.fix(t[2], 2)})$ in the plane. After ${K} application${K === 1 ? '' : 's'} the atom is at height $y=\\pm0.3$ again alternately, having slid ${v.fix(K * Math.hypot(t[0], t[2]), 2)} cell units. Twice the operation is the translation $(${v.fix(twice[0], 2)},0,${v.fix(twice[2], 2)})$: ${lat ? 'a lattice translation ✓ (primitive lattice allowed)' : 'not a lattice translation of a primitive lattice ✗ — it exists only if $(\\tfrac12,0,\\tfrac12)$ is a centring translation (I or F lattices), as for the diamond glide'}.`;
        });
      },
    },
  ],
};
