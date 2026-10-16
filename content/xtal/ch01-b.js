// Crystallography (Hammond; Giacovazzo) — Chapter 1, part 2: interstitial holes, density from the cell, common structure types,
// Pauling's rules and the Wigner–Seitz cell (1.7–1.11).
import {
  clamp, rad, add, sub, mul, dot, norm, cross, unit, triple, dot2, len2, det2, reduce2, classify2, conventional2, latticePoints2, wignerSeitz2,
  polyhedron, polyVolume, uniqueVerts, hullFaces, polyName, STRUCT, SPECIES, speciesColor, atomsIn, neighbours, shell, cellVolume, atomsPerCell,
  cellVectors, cellEdges, drawCell, ball, ppu, comb, fitScale, fmt,
} from './ch01.shared.js';

// ------------------------------------------------------------------ helpers
const FCC_T = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
let HOLES = null;
/** Interstitial holes of an fcc packing of touching spheres (a = 1), found numerically: local maxima of the gap function
 *  g(p) = (distance to the nearest sphere centre) − r, by pattern search from a grid of starting points. */
function findHoles() {
  if (HOLES) return HOLES;
  const rHost = Math.SQRT2 / 4, hosts = atomsIn(STRUCT.fcc, -1, 2).map((a) => a.r);
  const gap = (p) => { let m = 1e9; for (const h of hosts) { const d = Math.hypot(p[0] - h[0], p[1] - h[1], p[2] - h[2]); if (d < m) m = d; } return m - rHost; };
  const dirs = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if (i || j || k) dirs.push(unit([i, j, k]));
  const found = new Map(), G = 8;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let k = 0; k < G; k++) {
    let p = [(i + 0.31) / G, (j + 0.27) / G, (k + 0.43) / G], g = gap(p), st = 0.06;
    while (st > 1e-6) {
      let improved = false;
      for (const d of dirs) { const q = add(p, mul(st, d)), gq = gap(q); if (gq > g + 1e-12) { p = q; g = gq; improved = true; break; } }
      if (!improved) st /= 2;
    }
    const f = p.map((x) => { const m = ((x % 1) + 1) % 1; return Math.round(m * 1000) / 1000 % 1; });
    found.set(f.join(','), { f, gap: g });
  }
  const out = [];
  for (const { f, gap: g } of found.values()) {
    const p = f, n = hosts.filter((h) => Math.hypot(p[0] - h[0], p[1] - h[1], p[2] - h[2]) < g + rHost + 1e-3).length;
    // keep genuine local maxima only: a hole has 4 or 6 nearest spheres
    if (g > 0.05 && (n === 4 || n === 6)) out.push({ f, gap: g / rHost, cn: n });
  }
  HOLES = { holes: out, rHost, hosts, gap: (p) => gap(p) / rHost };
  return HOLES;
}
function rotFromTo(a, b) {
  const v = cross(a, b), c = dot(a, b);
  if (norm(v) < 1e-9) {
    if (c > 0) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const t = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], ax = unit(cross(a, t));
    return [[2 * ax[0] * ax[0] - 1, 2 * ax[0] * ax[1], 2 * ax[0] * ax[2]], [2 * ax[1] * ax[0], 2 * ax[1] * ax[1] - 1, 2 * ax[1] * ax[2]], [2 * ax[2] * ax[0], 2 * ax[2] * ax[1], 2 * ax[2] * ax[2] - 1]];
  }
  const K = [[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]], f = 1 / (1 + c);
  const K2 = K.map((r) => [0, 1, 2].map((j) => r[0] * K[0][j] + r[1] * K[1][j] + r[2] * K[2][j]));
  return [0, 1, 2].map((i) => [0, 1, 2].map((j) => (i === j ? 1 : 0) + K[i][j] + f * K2[i][j]));
}
const mv = (R, p) => R.map((r) => dot(r, p));

export default {
  collection: 'xtal',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Interstitial sites: octahedral and tetrahedral holes',
      statement: String.raw`A close-packed array of spheres (fcc or hcp) of radius $r$ leaves two kinds of holes. An **octahedral hole** is surrounded by 6 spheres at the corners of an octahedron; the largest sphere that fits has radius $(\sqrt2-1)\,r=0.414\,r$. A **tetrahedral hole** is surrounded by 4 spheres; the largest sphere that fits has radius $(\sqrt{3/2}-1)\,r=0.225\,r$. For $N$ spheres there are $N$ octahedral and $2N$ tetrahedral holes. Filling the holes with a second kind of atom generates many structures: all octahedral holes of fcc give rock salt (NaCl), all tetrahedral holes give fluorite (CaF$_2$), half of the tetrahedral holes give zinc blende (ZnS).`,
      idea: String.raw`The centre of an octahedral hole in the fcc cell is the cell centre, at distance $a/2$ from the six spheres; the spheres touch along a face diagonal, $4r=a\sqrt2$, so the free radius is $a/2-r=r(\sqrt2-1)$. A tetrahedral hole sits at $(\tfrac14,\tfrac14,\tfrac14)$, at distance $a\sqrt3/4=r\sqrt{3/2}$ from its four neighbours, which leaves $r(\sqrt{3/2}-1)$. Counting holes with the sharing rule (centre of cell 1, edge midpoints $12\times\tfrac14$ for the octahedral; 8 interior points for the tetrahedral) gives $4$ and $8$ per $4$ spheres. The same numbers hold in hcp, whose holes have the same shape.`,
      caption: String.raw`Drag the green probe through the fcc packing (translucent spheres at the true size). Its sphere is green where it fits between the host spheres and red where it overlaps one; the readout gives the largest radius that fits at that point. The numerical search for local maxima of this ‘gap’ has found the holes (gold octahedral, purple tetrahedral) and their radii, compared with the exact values. Use the buttons to jump to the nearest hole, and *fill the holes* to build rock salt, fluorite or zinc blende.`,
      deps: ['xtal-1.5'],
      refs: ['Hammond ch. 1'],
      tags: ['interstitial sites', 'close packing'],
      viz(v) {
        const HD = findHoles(), HS = HD.holes, rHost = HD.rHost;
        const probe = v.slider('probe radius / host radius', 0.05, 0.6, 0.25, { step: 0.005 });
        const fillSel = v.select('fill the holes', [{ value: 'none', label: 'empty' }, { value: 'oct', label: 'all octahedral' }, { value: 'tet', label: 'all tetrahedral' }, { value: 'half', label: 'half the tetrahedral' }], 'none');
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.1, 2.1], equal: true, axes: false, height: 440, weight: 1.35, title: 'fcc packing (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.36, axes: false });
        const P = sc.handle([0.1, 0.05, 0.05], { color: 'green', r: 8, label: 'probe' });
        const toW = (f) => f.map((x) => 2 * (x - 0.5)), toF = (w) => w.map((x) => x / 2 + 0.5);
        // all hole sites inside the closed cell, with sharing weights
        const sites = [];
        for (const h of HS) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
          const f = [h.f[0] + i, h.f[1] + j, h.f[2] + k];
          if (f.every((x) => x > -1e-3 && x < 1 + 1e-3)) sites.push({ f, cn: h.cn, gap: h.gap, w: 1 / 2 ** f.filter((x) => Math.abs(x) < 1e-3 || Math.abs(x - 1) < 1e-3).length });
        }
        const inHalf = (f) => { const t = f.map((x) => ((((x - 0.25) % 1) + 1) % 1) * 2); const nint = t.map((x) => Math.round(x)); if (t.some((x, i) => Math.abs(x - nint[i]) > 0.05)) return false; return nint.filter((x) => x % 2 === 1).length % 2 === 0; };
        const hosts = atomsIn(STRUCT.fcc, 0, 1);
        const nearest = (cn) => { const f = toF(P.p); let best = null; for (const t of sites.filter((q) => q.cn === cn)) { const d = norm(sub(t.f, f)); if (!best || d < best.d) best = { d, t }; } return best.t; };
        v.button('→ nearest octahedral hole', () => P.set(toW(nearest(6).f)));
        v.button('→ nearest tetrahedral hole', () => P.set(toW(nearest(4).f)));
        let cur = null;
        v.render(() => {
          const f = toF(P.p), g = HD.gap(f), rp = probe.value, fits = g >= rp - 1e-9;
          sc.begin();
          drawCell(sc, [[2, 0, 0], [0, 2, 0], [0, 0, 2]], [-1, -1, -1], {});
          // host spheres: true size (world radius = 2·r)
          for (const a of hosts) ball(sc, s, toW(a.f), 2 * rHost, 'accent', { alpha: 0.13 });
          const mode = fillSel.value;
          for (const t of sites) {
            const showFill = (mode === 'oct' && t.cn === 6) || (mode === 'tet' && t.cn === 4) || (mode === 'half' && t.cn === 4 && inHalf(t.f));
            if (showFill) ball(sc, s, toW(t.f), 2 * rHost * t.gap * 0.98, t.cn === 6 ? 'gold' : 'purple', { alpha: 0.85 });
            else sc.dot(toW(t.f), { r: 3.2, color: t.cn === 6 ? 'gold' : 'purple', top: false, alpha: 0.85 });
          }
          // probe: a sphere of the chosen radius
          ball(sc, s, P.p, 2 * rHost * rp, fits ? 'green' : 'red', { alpha: 0.55 });
          sc.flush();
          const oct = HS.filter((h) => h.cn === 6), tet = HS.filter((h) => h.cn === 4);
          const wsum = (cn) => sites.filter((q) => q.cn === cn).reduce((s2, q) => s2 + q.w, 0);
          const used = mode === 'none' ? 0 : mode === 'oct' ? wsum(6) : mode === 'tet' ? wsum(4) : sites.filter((q) => q.cn === 4 && inHalf(q.f)).reduce((s2, q) => s2 + q.w, 0);
          cur = { g, fits, rp, oct, tet, wo: wsum(6), wt: wsum(4), used, mode };
        });
        v.readout(() => {
          const { g, fits, rp, oct, tet, wo, wt, used, mode } = cur;
          const ro = oct.length ? oct[0].gap : NaN, rt = tet.length ? tet[0].gap : NaN;
          const f = { none: '', oct: `Filled: 4 host + ${v.fix(used, 0)} guests per cell → 1:1, **rock salt** (NaCl).`, tet: `Filled: 4 host + ${v.fix(used, 0)} guests per cell → 1:2, **fluorite** CaF$_2$ (host = Ca; with the roles swapped, anti-fluorite Li$_2$O).`, half: `Filled: 4 host + ${v.fix(used, 0)} guests per cell → 1:1 with 4-fold coordination, **zinc blende** ZnS.` }[mode];
          return `At the probe the largest sphere that fits has radius $${v.fix(g, 3)}\\,r$; yours ($${v.fix(rp, 3)}\\,r$) ${fits ? 'fits ✓' : 'overlaps a host sphere ✗'}.\nSearch results: ${oct.length} distinct octahedral holes of radius $${v.fix(ro, 4)}\\,r$ (exact $\\sqrt2-1=${v.fix(Math.SQRT2 - 1, 4)}$), ${tet.length} tetrahedral of $${v.fix(rt, 4)}\\,r$ (exact $\\sqrt{3/2}-1=${v.fix(Math.sqrt(1.5) - 1, 4)}$); per cell (sharing rule) ${v.fix(wo, 2)} octahedral and ${v.fix(wt, 2)} tetrahedral for 4 spheres. ${f}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Method',
      name: 'Density from the unit cell',
      statement: String.raw`The density of a crystal follows from its unit cell: if the conventional cell holds $n$ atoms (counted with the sharing rule: corner $\tfrac18$, edge $\tfrac14$, face $\tfrac12$, interior 1), each of molar mass $M$, and has volume $V_{\text{cell}}$, then
$$\rho=\frac{n\,M}{N_A\,V_{\text{cell}}}.$$
For cubic cells $V=a^3$; for hexagonal cells $V=\tfrac{\sqrt3}{2}a^2c$. The method works backwards too: measured density and lattice parameter give the number of atoms per cell, and so identify the structure type.`,
      idea: String.raw`A cell is repeated without gaps, so the mass per cell divided by its volume is the mass per unit volume of the whole crystal. Mass per cell is $n\,M/N_A$; the only subtlety is the count $n$, which comes from noticing that an atom on a face, edge or corner belongs equally to the cells that meet there. Lattice parameters come from X-ray diffraction (Chapter 6) and measured densities from displacement; agreement to a fraction of a percent confirms the structure and shows how little of the volume is empty space or defects.`,
      caption: String.raw`Choose a metal: its conventional cell is drawn with atoms coloured by the share of each that lies inside (corners blue $\tfrac18$, edges teal $\tfrac14$, faces orange $\tfrac12$, inside red 1) and the count $n$ and density are computed. Each point of the plot is a metal, **calculated** versus **measured** density; the diagonal is perfect agreement. Switch on *wrong structure* to give every cubic metal the other cubic cell with the same $a$: the points scatter off the line by factors of 2, so the density identifies the structure. Data: room-temperature lattice parameters and densities from standard tables (CRC Handbook values).`,
      deps: ['xtal-1.2', 'xtal-1.6'],
      refs: ['Hammond ch. 1'],
      tags: ['density', 'unit cell'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Crystal_structure' },
      viz(v) {
        // a, c in Å (room temperature), molar mass in g/mol, measured density in g/cm³ (CRC / periodictable.com tables)
        const EL = [
          { sym: 'Al', M: 26.982, a: 4.0495, st: 'fcc', rho: 2.70 }, { sym: 'Ni', M: 58.693, a: 3.5240, st: 'fcc', rho: 8.908 }, { sym: 'Cu', M: 63.546, a: 3.6149, st: 'fcc', rho: 8.96 },
          { sym: 'Ag', M: 107.868, a: 4.0853, st: 'fcc', rho: 10.49 }, { sym: 'Au', M: 196.967, a: 4.0782, st: 'fcc', rho: 19.30 }, { sym: 'Pb', M: 207.2, a: 4.9508, st: 'fcc', rho: 11.34 },
          { sym: 'Fe', M: 55.845, a: 2.8665, st: 'bcc', rho: 7.874 }, { sym: 'Mo', M: 95.95, a: 3.147, st: 'bcc', rho: 10.28 }, { sym: 'W', M: 183.84, a: 3.1652, st: 'bcc', rho: 19.25 },
          { sym: 'Mg', M: 24.305, a: 3.2094, c: 5.2108, st: 'hcp', rho: 1.738 },
        ];
        const NA = v.M.CONST.NA;
        const sel = v.select('metal', EL.map((e) => e.sym), 'Cu');
        const wrong = v.toggle('wrong structure (swap fcc ↔ bcc)', false);
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.1, 2.1], equal: true, axes: false, height: 440, weight: 1.05, title: 'conventional cell (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.6, pitch: 0.34, axes: false });
        const g = v.stage({ x: [1.2, 25], y: [1.2, 25], xlog: true, ylog: true, axes: 'box', gutter: true, height: 440, weight: 1, xlabel: 'measured density (g/cm³)', ylabel: 'calculated density n·M/(N_A·V) (g/cm³)', title: 'calculated vs measured' });
        const structOf = (e, w) => { const k = w && e.st !== 'hcp' ? (e.st === 'fcc' ? 'bcc' : 'fcc') : e.st; return { k, S: k === 'hcp' ? { ...STRUCT.hcp(e.c / e.a), cell: [e.a, e.a, e.c, 90, 90, 120] } : { ...STRUCT[k], cell: [e.a, e.a, e.a, 90, 90, 90] } }; };
        const calc = (e, w) => { const { S } = structOf(e, w), n = atomsPerCell(S), Vc = cellVolume(S); return { n, V: Vc, rho: (n * e.M) / (NA * Vc * 1e-24) }; };
        const COLST = { fcc: 'blue', bcc: 'orange', hcp: 'green' };
        let cur = null;
        g.onClick((x, y) => { let best = null; EL.forEach((e) => { const c = calc(e, wrong.value), d = Math.hypot(Math.log(x / e.rho), Math.log(y / c.rho)); if (!best || d < best.d) best = { d, e }; }); if (best && best.d < 0.3) sel.set(best.e.sym, { fire: true }); });
        v.render(() => {
          const e = EL.find((q) => q.sym === sel.value), { k, S } = structOf(e, wrong.value), V = cellVectors(S.cell), kk = fitScale(V, 1.7);
          const cc = mul(0.5, add(add(V[0], V[1]), V[2])), Pp = (r) => mul(kk, sub(r, cc));
          sc.begin();
          drawCell(sc, V.map((q) => mul(kk, q)), mul(-1, mul(kk, cc)), {});
          const atoms = atomsIn(S, 0, 1, V), r0 = (Math.min(...[0, 1, 2].map((i) => norm(V[i]))) * 0.2) * kk;
          const cls = { 1: ['red', 'inside (1)'], 0.5: ['orange', 'face (1/2)'], 0.25: ['teal', 'edge (1/4)'], 0.125: ['blue', 'corner (1/8)'] };
          const groups = {};
          for (const a of atoms) { const c = cls[a.w] || cls[1]; ball(sc, s, Pp(a.r), r0, c[0], { alpha: 0.88 }); groups[a.w] = (groups[a.w] || 0) + 1; }
          sc.flush();
          const res = calc(e, wrong.value);
          // parity plot: reference band ±5 %
          g.path([[1.2, 1.2 * 0.95], [25, 25 * 0.95], [25, 25 * 1.05], [1.2, 1.2 * 1.05]], { close: true, fill: 'green', fillAlpha: 0.12, stroke: false });
          g.line(1.2, 1.2, 25, 25, { color: 'green', width: 1.6 });
          EL.forEach((q) => {
            const c = calc(q, wrong.value), on = q.sym === e.sym;
            g.dot(q.rho, c.rho, { r: on ? 8 : 5.5, color: COLST[q.st], hollow: wrong.value && q.st !== 'hcp' ? false : false });
            const ix = EL.indexOf(q); g.text(q.sym, q.rho, c.rho, { dx: ix % 2 ? -9 : 9, dy: ix % 2 ? 10 : -10, align: ix % 2 ? 'right' : 'left', size: on ? 13 : 11, weight: on ? 700 : 500, color: on ? 'ink' : 'muted' });
          });
          g.corner('blue fcc · orange bcc · green hcp', 'tl', { size: 11, color: 'muted', plate: true });
          cur = { e, k, res, groups, cls };
        });
        v.readout(() => {
          const { e, k, res, groups, cls } = cur;
          const parts = Object.keys(groups).map(Number).sort((a, b) => a - b).map((w) => `${groups[w]}×${w === 0.125 ? '1/8' : w === 0.25 ? '1/4' : w === 0.5 ? '1/2' : '1'}`);
          const dev = (res.rho / e.rho - 1) * 100;
          return `${e.sym}, ${k}${wrong.value && k !== e.st ? ' (wrong: real structure is ' + e.st + ')' : ''}, $a=${v.fix(e.a, 4)}$ Å${e.c ? `, $c=${v.fix(e.c, 4)}$ Å` : ''}: atoms in the cell $n=${parts.join(' + ')}=${v.fix(res.n, 2)}$, $V=${v.fix(res.V, 2)}$ Å$^3$.\n$\\rho=nM/(N_AV)=${v.fix(res.n, 0)}\\cdot${v.fix(e.M, 3)}/(6.022\\times10^{23}\\cdot${v.fix(res.V, 2)}\\times10^{-24}\\ \\text{cm}^3)=\\mathbf{${v.fix(res.rho, 3)}}$ g/cm³ against measured ${v.fix(e.rho, 3)}: ${v.fix(dev, 2)} %.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Common structure types',
      statement: String.raw`Many compounds share a few structure types, named after a prototype. **Rock salt** (NaCl): two interpenetrating fcc lattices displaced by $a/2$, coordination 6:6, octahedra. **Caesium chloride** (CsCl): simple cubic with a two-atom basis, 8:8, cubes. **Diamond**: fcc plus an atom at $(\tfrac14,\tfrac14,\tfrac14)$, 4-fold coordination by tetrahedra; with two kinds of atoms it is **zinc blende** (ZnS). **Wurtzite**: hexagonal analogue of zinc blende with stacking $ABAB$ instead of $ABCABC$, again 4:4. **Cubic perovskite** ABX$_3$ (SrTiO$_3$): A at the cube corners, B at the centre in octahedral coordination by X on the face centres, A has 12 neighbours. A first guess for the structure of an ionic compound $AX$ is made from the radius ratio $r_{\text{cation}}/r_{\text{anion}}$: below 0.414 tetrahedral (4), up to 0.732 octahedral (6), above that cubic (8).`,
      idea: String.raw`In an ionic crystal each cation wants as many anions around it as possible, but the anions must not overlap one another. Putting spheres of radius ratio $\rho$ in a cubic cage, the cage of 8 touches the cation as long as $\rho\ge\sqrt3-1=0.732$; for an octahedron the anions touch each other at $\rho=\sqrt2-1=0.414$, and for a tetrahedron at $\rho=0.225$. Below each threshold the next smaller cage is the one that works. The rule is only a first guess, because ions are not hard spheres and covalency and polarisation matter — the radius-ratio plot has failures, which is why Pauling's rules (1.10) and, for quantitative work, computation are needed.`,
      caption: String.raw`Choose a structure type, drag to rotate, and **click any atom** (or pick the species): its nearest unlike neighbours light up and the coordination polyhedron is built as the convex hull of their positions, named from the computed coordination number and number of faces. Right: the radius-ratio rule. The slider sets $\rho$ and shows the predicted type; the dots are real compounds (Shannon radii, six-coordinate) plotted at their actual structure type — green where the rule predicts it, red where it fails.`,
      deps: ['xtal-1.7'],
      refs: ['Hammond ch. 1', 'Giacovazzo ch. 7'],
      tags: ['structure types', 'radius ratio'],
      viz(v) {
        const keys = ['nacl', 'cscl', 'c', 'zns', 'zno', 'srtio3'];
        const sel = v.select('structure', [{ value: 'nacl', label: 'NaCl' }, { value: 'cscl', label: 'CsCl' }, { value: 'c', label: 'diamond' }, { value: 'zns', label: 'zinc blende' }, { value: 'zno', label: 'wurtzite' }, { value: 'srtio3', label: 'perovskite' }], 'nacl');
        const rho = v.slider('radius ratio $\\rho=r_+/r_-$', 0.1, 1.05, 0.56, { step: 0.005, onChange: (x) => { sel.set(x >= 0.732 ? 'cscl' : x >= 0.414 ? 'nacl' : 'zns', { fire: true }); pickBasis = null; } });
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.1, 2.1], equal: true, axes: false, height: 460, weight: 1.15, title: 'structure (drag to rotate, click an atom)' });
        const sc = v.scene3(s, { yaw: -0.62, pitch: 0.3, axes: false });
        // Shannon effective radii (pm), six-coordinate: Li+ 76, Na+ 102, K+ 138, Rb+ 152, Cs+ 167, Mg2+ 72, Ca2+ 100, Be2+ 45, Zn2+ 74, F- 133, Cl- 181, Br- 196, I- 220, O2- 140, S2- 184
        const SALTS = [
          ['LiF', 76, 133, 'r'], ['LiCl', 76, 181, 'r'], ['LiBr', 76, 196, 'r'], ['LiI', 76, 220, 'r'], ['NaF', 102, 133, 'r'], ['NaCl', 102, 181, 'r'], ['NaBr', 102, 196, 'r'], ['NaI', 102, 220, 'r'],
          ['KF', 133, 138, 'r'], ['KCl', 138, 181, 'r'], ['RbCl', 152, 181, 'r'], ['CsF', 133, 167, 'r'], ['CsCl', 167, 181, 'c'], ['CsBr', 167, 196, 'c'], ['CsI', 167, 220, 'c'],
          ['MgO', 72, 140, 'r'], ['CaO', 100, 140, 'r'], ['ZnS', 74, 184, 'z'], ['BeO', 45, 140, 'z'], ['ZnO', 74, 140, 'z'],
        ].map(([n, a, b, t]) => ({ n, ratio: Math.min(a, b) / Math.max(a, b), t })).sort((p, q) => p.ratio - q.ratio);
        const g = v.stage({ x: [0, 1.05], y: [0, 1], axes: 'box', gutter: true, height: 460, weight: 0.95, xlabel: 'radius ratio $r_{small}/r_{large}$', yticks: [[0.17, 'ZnS'], [0.5, 'NaCl'], [0.83, 'CsCl']], title: 'the radius-ratio rule against real compounds' });
        const ROWY = { z: 0.17, r: 0.5, c: 0.83 }, pred = (x) => (x >= 0.732 ? 'c' : x >= 0.414 ? 'r' : 'z');
        let pickBasis = null, atomsP = [], cur = null;
        s.onClick((x, y) => { let best = null; for (const a of atomsP) { const d = Math.hypot(a.px - x, a.py - y); if (!best || d < best.d) best = { d, a }; } if (best && best.d < 0.3) { pickBasis = best.a.basis; v.invalidate(); } });
        v.render(() => {
          const key = sel.value, S = STRUCT[key], V = cellVectors(S.cell), kk = fitScale(V, 1.5);
          const cc = mul(0.5, add(add(V[0], V[1]), V[2])), Pp = (r) => mul(kk, sub(r, cc));
          const atoms = atomsIn(S, 0, 1, V);
          const centreIdx = (() => { const tgt = atoms.reduce((b, a) => (norm(sub(a.r, cc)) < norm(sub(b.r, cc)) ? a : b), atoms[0]); return tgt.basis; })();
          const bi = pickBasis != null && pickBasis < S.basis.length ? pickBasis : centreIdx;
          const sh = shell(S, bi, { unlike: true }), centre = atoms.find((a) => a.basis === bi);
          const cpos = centre ? centre.r : comb(S.basis[bi].slice(1), V);
          sc.begin();
          drawCell(sc, V.map((q) => mul(kk, q)), mul(-1, mul(kk, cc)), {});
          // bonds to the nearest unlike neighbours and the hull of their positions
          const nbPos = sh.list.map((t) => add(cpos, t.rel));
          const hull = nbPos.length >= 4 ? hullFaces(nbPos.map((p) => sub(p, cpos))) : [];
          for (const f of hull) sc.poly(f.verts.map((p) => Pp(add(p, cpos))), { fill: 'gold', fillAlpha: 0.2, color: 'gold', width: 1.4, alpha: 0.9 });
          for (const p of nbPos) sc.line(Pp(cpos), Pp(p), { color: 'gold', width: 2.2 }, 1);
          atomsP = [];
          const R0 = 0.16 * kk * Math.min(...[0, 1, 2].map((i) => norm(V[i]))) * 0.9;
          const drawn = [];
          for (const a of atoms) { const rr = R0 * SPECIES[a.sp].r; ball(sc, s, Pp(a.r), rr, speciesColor(a.sp), { alpha: a.basis === bi && norm(sub(a.r, cpos)) < 1e-6 ? 1 : 0.85 }); const q = sc.P(Pp(a.r)); atomsP.push({ px: q[0], py: q[1], basis: a.basis }); drawn.push(a.r); }
          for (const t of sh.list) { const q = add(cpos, t.rel); if (!drawn.some((r) => norm(sub(r, q)) < 1e-5)) ball(sc, s, Pp(q), R0 * SPECIES[t.sp].r, speciesColor(t.sp), { alpha: 0.4 }); }
          sc.dot(Pp(cpos), { r: Math.max(3, R0 * ppu(s) * 0.4), color: 'gold', top: true });
          sc.flush();
          const sp0 = S.basis[bi][0];
          const names = [...new Set(S.basis.map((b) => b[0]))];
          s.corner(names.map((n) => n).join(' · '), 'tl', { size: 12, weight: 700, plate: true });
          const dists = sh.list.map((t) => t.d);
          cur = { S, key, sp0, cn: sh.list.length, nf: hull.length, d: sh.d, spread: dists.length ? Math.max(...dists) - Math.min(...dists) : 0 };
          // radius-ratio panel
          g.vband(0, 0.225, { color: 'faint', alpha: 0.1 }); g.vband(0.225, 0.414, { color: 'purple', alpha: 0.12 }); g.vband(0.414, 0.732, { color: 'blue', alpha: 0.12 }); g.vband(0.732, 1.05, { color: 'orange', alpha: 0.14 });
          g.text('CN 3', 0.19, 0.97, { size: 10.5, color: 'muted', align: 'center' }); g.text('CN 4', 0.32, 0.97, { size: 11, weight: 700, color: 'purple', align: 'center' }); g.text('CN 6', 0.57, 0.97, { size: 11, weight: 700, color: 'blue', align: 'center' }); g.text('CN 8', 0.89, 0.97, { size: 11, weight: 700, color: 'orange', align: 'center' });
          let hits = 0;
          const used = {};
          SALTS.forEach((q) => {
            const ok = pred(q.ratio) === q.t; if (ok) hits++;
            const row = ROWY[q.t], k2 = (used[q.t] = (used[q.t] || 0) + 1);
            g.dot(q.ratio, row, { r: 5, color: ok ? 'green' : 'red' });
            g.text(q.n, q.ratio, row, { dy: [-12, 14, -26, 28][(k2 - 1) % 4], align: 'center', size: 10, color: ok ? 'muted' : 'red' });
          });
          g.vline(rho.value, { color: 'ink', width: 2 });
          g.text(`ρ = ${v.fix(rho.value, 3)}`, rho.value, 0.06, { dx: 4, align: rho.value > 0.85 ? 'right' : 'left', size: 11.5, weight: 700 });
          cur.hits = hits; cur.pred = pred(rho.value);
        });
        v.readout(() => {
          const { S, sp0, cn, nf, d, spread, hits, pred: pr } = cur;
          const name = polyName(cn, nf);
          const pn = { z: 'tetrahedral, 4:4 (zinc blende / wurtzite)', r: 'octahedral, 6:6 (rock salt)', c: 'cubic, 8:8 (CsCl)' }[pr];
          return `**${S.name}** (${S.real}). Selected atom: ${sp0}, ${cn} nearest unlike neighbours at $${v.fix(d, 3)}$ Å${spread > 0.01 ? ` (spread $${v.fix(spread, 3)}$ Å)` : ''} forming a **${name}**.\nRadius ratio $\\rho=${v.fix(rho.value, 3)}$ predicts ${pn}. For the ${SALTS.length} compounds shown the rule gets ${hits} right and ${SALTS.length - hits} wrong (red) — a guide, not a law.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Principle',
      name: 'Pauling’s rules for ionic crystals',
      statement: String.raw`Pauling's rules (1929) summarise what makes ionic structures stable. (1) A coordination polyhedron of anions forms around each cation; the cation–anion distance is the sum of the radii and the coordination number follows from the radius ratio. (2) **Electrostatic valence rule**: the bond strength of a cation of charge $z$ and coordination $N$ is $s=z/N$, and in a stable structure the bond strengths reaching each anion sum to the anion's charge. (3) Sharing of edges and especially faces between polyhedra lowers stability, the more so for cations of high charge and low coordination. (4) In a crystal with several cations, those of high charge and small coordination tend not to share polyhedron elements with each other. (5) The number of essentially different constituents tends to be small (parsimony).`,
      idea: String.raw`Rule 2 is Gauss's law for a point anion: its charge must be neutralised by the bonds that reach it, each carrying the fraction of its cation's charge $z/N$. A cation that is highly charged and has few neighbours (Si$^{4+}$ with four) sends out strong bonds of strength 1, so each oxygen can belong to only two SiO$_4$ tetrahedra. Rules 3 and 4 come from geometry: two polyhedra sharing an edge or a face bring their centres closer than corner sharing (compute it below), and the Coulomb repulsion $14.4\,z_1z_2/d$ eV (with $d$ in Å) of two $4+$ cations grows enormously. These are heuristics with many exceptions, but they explain why silicate tetrahedra share only corners, in chains, sheets and frameworks.`,
      caption: String.raw`Left: two coordination polyhedra sharing a corner, an edge or a face (drag to rotate); their cation–cation distance $d$ is computed from the construction (the second polyhedron is the mirror image through the shared element, or turned about the shared oxygen for the corner by your Si–O–Si angle) and the repulsion energy $14.4\,z^2/d$ is listed for all three modes. Right: bond-strength sum at one oxygen: add bonds from different cations and watch the sum approach, or miss, $2$ (green = rule 2 satisfied). Presets are real structures: quartz, forsterite, spinel, rutile, periclase.`,
      deps: ['xtal-1.9'],
      refs: ['Giacovazzo ch. 7'],
      credit: 'L. Pauling, 1929 (J. Am. Chem. Soc. 51, 1010)',
      tags: ['ionic crystals', 'silicates'],
      viz(v) {
        // typical cation–oxygen distances (Å), illustrative round numbers from Shannon-type ionic radii sums
        const CAT = {
          Si: { z: 4, cn: 4, d: 1.62, label: 'Si⁴⁺', color: 'purple' }, Al: { z: 3, cn: 6, d: 1.91, label: 'Al³⁺', color: 'teal' }, Mg: { z: 2, cn: 6, d: 2.10, label: 'Mg²⁺', color: 'green' },
          Ti: { z: 4, cn: 6, d: 1.96, label: 'Ti⁴⁺', color: 'orange' }, Na: { z: 1, cn: 6, d: 2.42, label: 'Na⁺', color: 'gold' }, MgT: { z: 2, cn: 4, d: 1.95, label: 'Mg²⁺', color: 'pink' },
        };
        const cat = v.select('cation', [{ value: 'Si', label: 'Si⁴⁺ (CN 4)' }, { value: 'Ti', label: 'Ti⁴⁺ (CN 6)' }, { value: 'Al', label: 'Al³⁺ (CN 6)' }, { value: 'Mg', label: 'Mg²⁺ (CN 6)' }, { value: 'Na', label: 'Na⁺ (CN 6)' }], 'Si');
        const mode = v.select('polyhedra share', [{ value: 'corner', label: 'a corner' }, { value: 'edge', label: 'an edge' }, { value: 'face', label: 'a face' }], 'corner');
        const th = v.slider('Si–O–Si angle at the shared corner (°)', 120, 180, 144, { step: 1 });
        const s = v.stage({ x: [-2.3, 2.3], y: [-2.2, 2.2], equal: true, axes: false, height: 440, weight: 1.15, title: 'two polyhedra (drag to rotate)' });
        const sc = v.scene3(s, { yaw: -0.5, pitch: 0.28, axes: false });
        const TETRA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((p) => mul(1 / Math.sqrt(3), p));
        const OCTA = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        const SHARED = { tet: { corner: [0], edge: [0, 1], face: [0, 1, 2] }, oct: { corner: [0], edge: [0, 2], face: [0, 2, 4] } };
        // the second polyhedron (unit circumradius) for a sharing mode; returns {verts2, c2}
        const build = (kind, md, angDeg) => {
          const V1 = kind === 'tet' ? TETRA : OCTA, S = SHARED[kind][md];
          if (md === 'corner') {
            const O = V1[S[0]], m = mul(-1, unit(O)), t = Math.abs(m[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], ep = unit(cross(m, t)), a = rad(angDeg);
            const dir = add(mul(Math.cos(a), m), mul(Math.sin(a), ep)), c2 = add(O, dir), R = rotFromTo(unit(O), mul(-1, dir));
            return { V2: V1.map((p) => add(mv(R, p), c2)), c2 };
          }
          const M = mul(1 / S.length, S.map((i) => V1[i]).reduce(add, [0, 0, 0])), n = unit(M);
          const refl = (p) => sub(p, mul(2 * dot(sub(p, M), n), n));
          return { V2: V1.map(refl), c2: refl([0, 0, 0]) };
        };
        const kindOf = (c) => (CAT[c].cn === 4 ? 'tet' : 'oct');
        // oxygen bond-strength panel
        const BS = { Si: 'Si', Ti: 'Ti', Al: 'Al', Mg: 'Mg', Na: 'Na', MgT: 'MgT' };
        let bonds = ['Si', 'Si'];
        const PRESETS = { quartz: ['Si', 'Si'], forsterite: ['Si', 'Mg', 'Mg', 'Mg'], spinel: ['MgT', 'Al', 'Al', 'Al'], rutile: ['Ti', 'Ti', 'Ti'], periclase: ['Mg', 'Mg', 'Mg', 'Mg', 'Mg', 'Mg'], 'bad guess': ['Si', 'Si', 'Si'] };
        const pre = v.select('oxygen environment', Object.keys(PRESETS).map((k) => ({ value: k, label: k })), 'quartz', { onChange: (k) => { bonds = PRESETS[k].slice(); } });
        for (const k of ['Si', 'Al', 'Mg', 'Na']) v.button('+ ' + CAT[k].label, () => { if (bonds.length < 8) bonds.push(k); });
        v.button('clear', () => { bonds = []; });
        const w = v.stage({ x: [-2.6, 2.8], y: [-2.3, 2.3], equal: true, axes: false, height: 440, weight: 0.95, title: 'bond-strength sum at one oxygen (rule 2)' });
        let cur = null;
        v.render(() => {
          const c = cat.value, kind = kindOf(c), C = CAT[c], md = mode.value;
          th.el.hidden = md !== 'corner';
          const V1 = kind === 'tet' ? TETRA : OCTA, { V2, c2 } = build(kind, md, th.value);
          const SH = SHARED[kind][md], k0 = 1.2;
          sc.begin();
          const shared = (p) => SH.some((i) => norm(sub(p, V1[i])) < 1e-6);
          const f1 = hullFaces(V1), f2 = hullFaces(V2);
          for (const f of f1) sc.poly(f.verts.map((p) => mul(k0, sub(p, mul(0.5, c2)))), { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.3 });
          for (const f of f2) sc.poly(f.verts.map((p) => mul(k0, sub(p, mul(0.5, c2)))), { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.3 });
          const allV = [...V1, ...V2];
          allV.forEach((p, i) => { if (i >= V1.length && shared(p)) return; sc.dot(mul(k0, sub(p, mul(0.5, c2))), { r: shared(p) ? 8 : 5.5, color: shared(p) ? 'gold' : 'red', top: false }); });
          sc.dot(mul(k0, sub([0, 0, 0], mul(0.5, c2))), { r: 6.5, color: 'accent' }); sc.dot(mul(k0, sub(c2, mul(0.5, c2))), { r: 6.5, color: 'orange' });
          sc.line(mul(k0, sub([0, 0, 0], mul(0.5, c2))), mul(k0, sub(c2, mul(0.5, c2))), { color: 'ink', width: 2.2, dash: [5, 4] }, 1);
          sc.flush();
          // energies of all three modes
          const E = {};
          for (const m of ['corner', 'edge', 'face']) { const b = build(kind, m, th.value), d = norm(b.c2) * C.d; E[m] = { d, e: (14.3996 * C.z * C.z) / d }; }
          s.corner(`${C.label}–${C.label} distance ${v.fix(E[md].d, 2)} Å`, 'tl', { size: 12, weight: 700, plate: true });
          // oxygen panel
          const n = bonds.length, sum = bonds.reduce((a, b) => a + CAT[b].z / CAT[b].cn, 0);
          w.circle(-0.7, 0, 0.32, { fill: 'red', fillAlpha: 0.85, color: 'red' });
          w.text('O²⁻', -0.7, 0, { align: 'center', size: 12, weight: 700, color: 'panel', halo: false });
          bonds.forEach((b, i) => {
            const a = (i / Math.max(n, 1)) * Math.PI * 2 + 0.5, sS = CAT[b].z / CAT[b].cn, cx = -0.7 + 1.55 * Math.cos(a), cy = 1.55 * Math.sin(a);
            w.line(-0.7 + 0.32 * Math.cos(a), 0.32 * Math.sin(a), cx, cy, { color: CAT[b].color, width: 1 + 6 * sS });
            w.circle(cx, cy, 0.34, { fill: CAT[b].color, fillAlpha: 0.9, color: CAT[b].color });
            w.text(CAT[b].label, cx, cy, { align: 'center', size: 10, weight: 700, color: 'panel', halo: false });
            w.text(`s = ${CAT[b].z}/${CAT[b].cn}`, -0.7 + 0.95 * Math.cos(a), 0.95 * Math.sin(a), { align: 'center', size: 10, color: 'ink', dy: -9 });
          });
          // stacked bar of bond strengths at x ≈ 2.2
          const y0 = -2, sc2 = 0.95; let acc = 0;
          bonds.forEach((b) => { const sS = CAT[b].z / CAT[b].cn; w.rect(1.95, y0 + acc * sc2, 2.45, y0 + (acc + sS) * sc2, { fill: CAT[b].color, fillAlpha: 0.7, color: 'panel', width: 1.2 }); acc += sS; });
          w.line(1.8, y0 + 2 * sc2, 2.6, y0 + 2 * sc2, { color: 'green', width: 2.4 });
          w.text('2', 1.75, y0 + 2 * sc2, { align: 'right', size: 12, weight: 700, color: 'green' });
          w.text(`Σs = ${v.fix(sum, 2)}`, 2.2, y0 - 0.2, { align: 'center', size: 12, weight: 700, color: Math.abs(sum - 2) < 1e-6 ? 'green' : Math.abs(sum - 2) < 0.3 ? 'orange' : 'red' });
          cur = { E, md, sum, n, C, kind };
        });
        v.readout(() => {
          const { E, md, sum, n, C, kind } = cur;
          const row = (m, name) => `${name} ${v.fix(E[m].d, 2)} Å, ${v.fix(E[m].e, 1)} eV${m === md ? ' ◄' : ''}`;
          const verdict = Math.abs(sum - 2) < 1e-6 ? 'exactly 2 ✓ (rule 2 satisfied)' : `${v.fix(sum, 2)}, off by ${v.fix(sum - 2, 2)} ✗`;
          return `${C.label} ${kind === 'tet' ? 'tetrahedra' : 'octahedra'} (cation–O ${C.d} Å, illustrative): cation–cation repulsion — ${row('corner', 'corner')} · ${row('edge', 'edge')} · ${row('face', 'face')}.\nOxygen with ${n} bond${n === 1 ? '' : 's'}: electrostatic bond strengths add up to ${verdict}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Definition',
      name: 'Wigner–Seitz cell',
      statement: String.raw`The **Wigner–Seitz cell** of a lattice point is the set of points of space that are closer to it than to any other lattice point. It is bounded by the perpendicular bisector planes of the vectors to the nearest neighbours, and it is a primitive cell: it contains exactly one lattice point, has the volume of any primitive cell, tiles space by translations, and has the full point symmetry of the lattice. Examples: a square (square lattice), a regular hexagon (hexagonal lattice), a rectangle (rectangular), the cube (simple cubic), the truncated octahedron with 14 faces (bcc) and the rhombic dodecahedron with 12 faces (fcc). The same construction in reciprocal space gives the first Brillouin zone (5.4).`,
      idea: String.raw`A point $\mathbf x$ is closer to $0$ than to the lattice point $\mathbf t$ exactly when $|\mathbf x|^2\le|\mathbf x-\mathbf t|^2$, i.e. $\mathbf x\cdot\mathbf t\le\tfrac12|\mathbf t|^2$: a half-space bounded by the bisector of $0$ and $\mathbf t$. The cell is the intersection of these half-spaces over all $\mathbf t\neq0$ — convex, and only the nearest few matter. Translating it by every lattice vector gives cells that overlap only along their boundaries and cover everything (every point has a nearest lattice point), so its volume is that of a primitive cell. Unlike a parallelogram cell it is unique and keeps the lattice symmetry.`,
      caption: String.raw`Left: drag $\mathbf a_1,\mathbf a_2$ (or press a preset). The Wigner–Seitz cell of the origin (gold) is computed by clipping the plane with the bisector of every neighbour; its translates tile the plane. The lattice type is detected from the reduced basis, and for a centred rectangular lattice the dashed conventional cell with 2 points is drawn against the primitive one. Right: the 3D cells computed from the half-spaces for simple cubic, bcc and fcc: faces, vertices, edges (Euler's relation) and volume against the primitive cell.`,
      deps: ['xtal-1.1'],
      refs: ['Hammond ch. 6'],
      credit: 'E. Wigner & F. Seitz, 1933 (Phys. Rev. 43, 804)',
      tags: ['lattice', 'primitive cell'],
      viz(v) {
        const prim = v.toggle('show primitive cell', true), conv = v.toggle('show conventional cell (centred)', true), bis = v.toggle('show bisectors', true);
        const SIM = { sc: 'simple cubic', bcc: 'bcc', fcc: 'fcc' };
        const sel = v.select('3D lattice', Object.entries(SIM).map(([k, l]) => ({ value: k, label: l })), 'bcc');
        const s = v.stage({ x: [-4.6, 4.6], y: [-3.3, 3.3], equal: true, axes: false, height: 440, weight: 1.35, title: 'plane lattice' });
        const A1 = s.handle(1.8, 0.35, { color: 'accent', label: 'a₁' }), A2 = s.handle(0.7, 1.9, { color: 'orange', label: 'a₂' });
        const P = (a, b) => { A1.set(a[0], a[1]); A2.set(b[0], b[1]); };
        v.button('square', () => P([1.7, 0], [0, 1.7])); v.button('hexagonal', () => P([1.9, 0], [0.95, 1.645])); v.button('rectangular', () => P([1.5, 0], [0, 2.2]));
        v.button('centred rect.', () => P([1.3, 1.0], [1.3, -1.0])); v.button('oblique', () => P([1.8, 0.35], [0.7, 1.9]));
        const t = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, axes: false, height: 440, weight: 0.85, title: '3D cell (drag to rotate)' });
        const sc = v.scene3(t, { yaw: -0.6, pitch: 0.38, axes: false });
        const PRIM = { sc: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], bcc: [[-0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, -0.5]], fcc: [[0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]] };
        const ws3 = (k) => {
          const Vv = PRIM[k], planes = [], dists = [];
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (let l = -2; l <= 2; l++) {
            if (!i && !j && !l) continue;
            const tv = add(add(mul(i, Vv[0]), mul(j, Vv[1])), mul(l, Vv[2]));
            planes.push({ n: tv, d: dot(tv, tv) / 2, dist: norm(tv) });
          }
          const faces = polyhedron(planes.map((p) => ({ n: p.n, d: p.d })));
          const ds = [...new Set(planes.map((p) => Math.round(p.dist * 1000) / 1000))].sort((a, b) => a - b);
          return { faces: faces.map((f) => ({ ...f, dist: planes[f.idx].dist, cls: ds.indexOf(Math.round(planes[f.idx].dist * 1000) / 1000) })), Vv };
        };
        let cur = null;
        v.render(() => {
          const a = [A1.x, A1.y], b = [A2.x, A2.y];
          if (Math.abs(det2(a, b)) < 0.25) { s.text('vectors nearly parallel', 0, 0, { align: 'center', size: 14, color: 'red' }); cur = { bad: true }; return; }
          const L = classify2(a, b), W = wignerSeitz2(a, b);
          // clean polygon: dedupe vertices and drop collinear ones
          let poly = []; for (const p of W.poly) if (!poly.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6)) poly.push(p);
          poly = poly.filter((p, i) => { const q = poly[(i + poly.length - 1) % poly.length], r = poly[(i + 1) % poly.length]; return Math.abs(det2([p[0] - q[0], p[1] - q[1]], [r[0] - p[0], r[1] - p[1]])) > 1e-7; });
          const edges = poly.length;
          const lens = poly.map((p, i) => { const q = poly[(i + 1) % edges]; return Math.hypot(p[0] - q[0], p[1] - q[1]); });
          const regular = Math.max(...lens) - Math.min(...lens) < 0.01 * Math.max(...lens) && edges === 6;
          const pts = latticePoints2(a, b, [-4.6, 4.6], [-3.3, 3.3], 3.2);
          pts.forEach(([x, y]) => {
            const T = poly.map((p) => [p[0] + x, p[1] + y]), origin = Math.abs(x) + Math.abs(y) < 1e-9;
            s.poly(T, { fill: origin ? 'gold' : 'accent', fillAlpha: origin ? 0.32 : ((Math.round(x * 1000) + Math.round(y * 1000)) % 2 === 0 ? 0.05 : 0.09), color: origin ? 'gold' : 'muted', width: origin ? 2.6 : 1 });
          });
          const r1 = L.a, r2 = L.b;
          if (bis.value) for (const tvec of W.neighbours.slice(0, 8)) {
            const m = [tvec[0] / 2, tvec[1] / 2], n = unit3(tvec), h = 0.8 * Math.max(...lens);
            s.line(0, 0, tvec[0], tvec[1], { color: 'muted', width: 1, dash: true, alpha: 0.7 });
            s.line(m[0] - n[1] * h, m[1] + n[0] * h, m[0] + n[1] * h, m[1] - n[0] * h, { color: 'gold', width: 1.2, dash: true, alpha: 0.9 });
          }
          if (prim.value) s.poly([[0, 0], a, [a[0] + b[0], a[1] + b[1]], b], { fill: 'accent', fillAlpha: 0.0, color: 'accent', width: 2, dash: true });
          const cv = conventional2(L);
          if (conv.value && cv) s.poly([[0, 0], cv[0], [cv[0][0] + cv[1][0], cv[0][1] + cv[1][1]], cv[1]], { fill: 'green', fillAlpha: 0.0, color: 'green', width: 2.2, dash: [8, 4] });
          for (const [x, y] of pts) s.dot(x, y, { r: 3.6, color: 'ink' });
          s.arrow(0, 0, a[0], a[1], { color: 'accent', width: 2.4 }); s.arrow(0, 0, b[0], b[1], { color: 'orange', width: 2.4 });
          // 3D
          const K = sel.value, D = ws3(K), k = 2.0;
          sc.begin();
          D.faces.forEach((f) => sc.poly(f.verts.map((p) => mul(k, p)), { fill: ['accent', 'orange', 'green'][f.cls % 3], fillAlpha: 0.32, color: 'ink', width: 1.3, alpha: 0.9 }));
          sc.dot([0, 0, 0], { r: 5, color: 'gold' });
          sc.flush();
          const nV = uniqueVerts(D.faces).length, nF = D.faces.length;
          // edges: pairs of faces sharing two vertices
          let nE = 0; for (let i = 0; i < nF; i++) for (let j = i + 1; j < nF; j++) { let sh = 0; for (const p of D.faces[i].verts) if (D.faces[j].verts.some((q) => norm(sub(p, q)) < 1e-6)) sh++; if (sh >= 2) nE++; }
          const kinds = {}; D.faces.forEach((f) => { kinds[f.verts.length] = (kinds[f.verts.length] || 0) + 1; });
          cur = { L, W, edges, regular, areaWS: Math.abs(polyArea(poly)), areaP: Math.abs(det2(a, b)), nV, nF, nE, vol: polyVolume(D.faces), volP: Math.abs(triple(D.Vv)), kinds, conv: !!cv, K };
        });
        function unit3(t) { const n = Math.hypot(t[0], t[1]); return [t[0] / n, t[1] / n]; }
        function polyArea(P) { let q = 0; for (let i = 0; i < P.length; i++) { const p = P[i], r = P[(i + 1) % P.length]; q += p[0] * r[1] - p[1] * r[0]; } return q / 2; }
        v.readout(() => {
          if (!cur || cur.bad) return 'Make the two basis vectors independent.';
          const c = cur, shape = c.edges === 4 ? 'a quadrilateral (rectangle or square)' : c.edges === 6 ? (c.regular ? 'a regular hexagon' : 'a hexagon') : `a ${c.edges}-gon`;
          const kinds = Object.entries(c.kinds).map(([n, m]) => `${m} ${{ 3: 'triangles', 4: 'quadrilaterals', 5: 'pentagons', 6: 'hexagons' }[n] || n + '-gons'}`).join(' + ');
          return `Plane lattice (reduced basis): **${c.L.name}** (${c.L.sym}), point group ${c.L.group}${c.conv ? '; the conventional cell is centred and has 2 points, the primitive one 1' : ''}. Wigner–Seitz cell: ${shape}, area $${v.fix(c.areaWS, 3)}$ = primitive area $${v.fix(c.areaP, 3)}$ ${Math.abs(c.areaWS - c.areaP) < 1e-6 ? '✓' : '✗'}.\n3D ${SIM[c.K]}: ${c.nF} faces (${kinds}), ${c.nV} vertices, ${c.nE} edges ($V-E+F=${c.nV - c.nE + c.nF}$ ${c.nV - c.nE + c.nF === 2 ? '✓' : '✗'}); volume $${v.fix(c.vol, 4)}$ = primitive cell $${v.fix(c.volP, 4)}$ ${Math.abs(c.vol - c.volP) < 1e-6 ? '✓' : '✗'} (units of $a^3$).`;
        });
      },
    },
  ],
};
