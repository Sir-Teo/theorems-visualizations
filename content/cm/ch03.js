// Condensed Matter Physics — Chapter 3: Lattice vibrations, binding and defects (items 3.1–3.8; 3.9–3.16 in ch03-b.js; 3.7 is a cross-listing)
import { PI, bose, madelung, ljSums, ljEnergy, phononFreqs } from './ch03.shared.js';
import { crystalSummary, soundModel } from './cm-source-audit-lattice.js';

export default {
  collection: 'cm',
  chapter: 3,
  title: 'Lattice vibrations, binding and defects',
  summary: String.raw`Crystals are held together by electrostatics in ionic solids and by van der Waals forces in noble-gas solids. Their atoms vibrate in normal modes labelled by wave vectors in the Brillouin zone: acoustic branches become sound, and lattices with a basis add optical branches that couple to light (polaritons, the Lyddane–Sachs–Teller relation) and can soften into ferroelectric order. Quantized modes are phonons, measured by neutron scattering; anharmonicity gives thermal expansion and finite heat conduction, phonons limit the electrical resistance of metals, and dislocations explain why real crystals are weak.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Model',
      name: 'Ionic crystals and the Madelung constant',
      credit: 'Madelung, 1918; Evjen, 1932',
      statement: String.raw`Model an ionic crystal as point charges $\pm e$ on a lattice. For rock salt, with $r_0$ the nearest-neighbour distance, the electrostatic energy per ion pair is $-\alpha e^2/(4\pi\varepsilon_0 r_0)$ with the **Madelung constant**
$$\alpha=-\sum_{(j,k,l)\ne 0}\frac{(-1)^{j+k+l}}{\sqrt{j^2+k^2+l^2}}=1.747565\ldots$$
The series is only **conditionally convergent**: its value depends on how the sites are grouped, and a physically meaningful grouping uses neutral pieces (for instance Evjen's cubes whose faces, edges and corners carry weights $\tfrac12,\tfrac14,\tfrac18$). Adding the repulsive core, usually modelled as $B/r^n$, gives the equilibrium spacing and the cohesive energy $U_0=-N\alpha e^2(1-1/n)/(4\pi\varepsilon_0 r_0)$.`,
      idea: String.raw`Each shell of neighbours around one ion contributes terms of both signs, and the number of sites at distance $r$ grows like $r^2$ while the Coulomb term only falls as $1/r$, so the absolute series diverges. A cube (or sphere) of lattice sites that is not neutral carries a net charge $\pm e$ that sits on its surface at distance $\sim N$ and contributes an energy of order one, which is why the sharp-cube sums oscillate for ever. Giving the boundary sites their fractional weights makes every partial block exactly neutral and the sums converge very fast. The first term of the series, the six neighbours, already gives $-6$; the rest of the lattice reduces this to $-1.7476$.`,
      caption: String.raw`**Left:** the $z=0$ plane of the rock-salt lattice (blue $+$, red $-$) with the sites that are included in the sum at cutoff $N$ (faded outside; half-size on the boundary of the Evjen cube). **Right:** the partial sums for the three groupings against the cutoff $N$. Drag $N$: the sharp-cube and sphere sums keep wandering (the cube carries net charge $\pm e$ in the odd/even cases) while the Evjen sum is within $5\times10^{-4}$ of $1.747565$ by $N=3$ and stays there. (The picture shows the slice up to $|j|,|k|\le6$; the sums use the full three-dimensional blocks. The sphere sum jumps off scale: that is the real behaviour.)`,
      scope: String.raw`Rigid point charges on a perfect infinite lattice. Real ionic crystals add the repulsive core (Born–Mayer or power law), polarization and zero-point energy; the Madelung term is the bulk of the cohesive energy. Other lattices have other constants (CsCl $1.7627$, zinc blende $1.6381$ in units of their nearest-neighbour distance).`,
      deps: ['xtal-1.1', 'pma-3.54'],
      refs: ['Ashcroft–Mermin ch. 20', 'Kittel ch. 3'],
      tags: ['madelung', 'ionic', 'conditional convergence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Madelung_constant' },
      viz(v) {
        const NMAX = 30, D = madelung(NMAX);
        const Ns = v.slider('cutoff $N$', 1, NMAX, 4, { int: true });
        const mode = v.select('grouping', [{ value: 'cube', label: 'sharp cube' }, { value: 'sphere', label: 'sphere $r\\le N$' }, { value: 'evjen', label: 'Evjen cube' }], 'evjen');
        const sA = v.stage({ x: [-7, 7], y: [-7, 7], equal: true, axes: false, height: 340, title: 'plane $z=0$ of rock salt, sites included at cutoff $N$', weight: 1 });
        const sB = v.stage({ x: [0, NMAX + 1], y: [-2, 5], axes: 'box', gutter: true, height: 340, xlabel: 'cutoff $N$', ylabel: 'partial sum $\\alpha_N$', title: 'partial sums', weight: 1.1 });
        v.legend([['red', 'sharp cube'], ['orange', 'sphere $r\\le N$'], ['green', 'Evjen cube'], ['ink', '$1.747565$', { dash: true }]]);
        const al = (arr, n) => -arr[n];
        v.render(() => {
          const N = Ns.value, m = mode.value, R = Math.min(N, 6) + 0.5; sA.setView([-R - 1, R + 1], [-R - 1, R + 1]);
          for (let j = -Math.min(N, 6) - 1; j <= Math.min(N, 6) + 1; j++) for (let k = -Math.min(N, 6) - 1; k <= Math.min(N, 6) + 1; k++) {
            const q = (j + k) & 1 ? -1 : 1, mx = Math.max(Math.abs(j), Math.abs(k)); let w = 0;
            if (m === 'sphere') w = Math.hypot(j, k) <= N ? 1 : 0; else if (m === 'cube') w = mx <= N ? 1 : 0; else w = mx < N ? 1 : mx === N ? (Math.abs(j) === N && Math.abs(k) === N ? 0.25 : 0.5) : 0;
            if (j === 0 && k === 0) { sA.dot(0, 0, { r: 8, color: 'gold' }); continue; }
            sA.dot(j, k, { r: w === 0 ? 2.5 : 2 + 4.5 * Math.sqrt(w), color: q > 0 ? 'blue' : 'red', alpha: w === 0 ? 0.25 : 0.95 });
          }
          const sh = (arr, c, nm) => sB.path(Array.from({ length: NMAX }, (_, i) => [i + 1, al(arr, i + 1)]), { color: c, width: nm ? 2.4 : 1.6, alpha: nm ? 1 : 0.55 });
          sB.hline(1.747565, { color: 'ink', width: 1.4, dash: [5, 4] });
          sh(D.cube, 'red', m === 'cube'); sh(D.sphere, 'orange', m === 'sphere'); sh(D.evjen, 'green', m === 'evjen');
          const cur = m === 'cube' ? D.cube : m === 'sphere' ? D.sphere : D.evjen;
          sB.vline(N, { color: 'faint', width: 1 }); sB.dot(N, al(cur, N), { r: 6, color: 'gold' });
        });
        v.readout(() => {
          const N = Ns.value, m = mode.value, cur = m === 'cube' ? D.cube : m === 'sphere' ? D.sphere : D.evjen, a = al(cur, N);
          const q = m === 'cube' ? `net charge of the cube (central ion included) $=${(N & 1) ? '-' : '+'}e$` : m === 'evjen' ? 'cube exactly neutral' : 'sphere not neutral either';
          return `$\\alpha_N=${v.fix(a, 5)}$ · error against $1.747565$: $${v.fix(a - 1.747565, 5)}$ · ${q}\nfirst shell alone ($N=1$ cube): $\\alpha_1=${v.fix(al(D.cube, 1), 3)}$ · energy per pair with $n=9$: $-\\alpha(1-1/9)\\,e^2/4\\pi\\varepsilon_0 r_0=-${v.fix(a * 8 / 9, 3)}\\,e^2/4\\pi\\varepsilon_0r_0$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Model',
      name: 'Van der Waals solids: the Lennard-Jones crystal',
      credit: 'Lennard-Jones pair-potential model',
      statement: String.raw`Noble-gas atoms attract through fluctuating dipoles ($\propto -r^{-6}$) and repel at short range; the Lennard-Jones pair potential $\phi(r)=4\varepsilon[(\sigma/r)^{12}-(\sigma/r)^6]$ models both. Summed over a lattice with nearest-neighbour distance $r$, the energy per atom is
$$u(r)=2\varepsilon\left[S_{12}\left(\frac{\sigma}{r}\right)^{12}-S_{6}\left(\frac{\sigma}{r}\right)^{6}\right],\qquad S_n=\sum_{j\ne0}\left(\frac{r}{r_j}\right)^n,$$
For ideal lattices, $(S_6,S_{12})$ is approximately $(14.45392,12.13188)$ for fcc, $(14.45490,12.13229)$ for hcp and $(12.25367,9.11418)$ for bcc. The minimum is at $r_0=(2S_{12}/S_6)^{1/6}\sigma\approx1.09\,\sigma$, where $u=-\varepsilon S_6^2/(2S_{12})\approx-8.6\,\varepsilon$ for close-packed structures, which therefore beat bcc.`,
      idea: String.raw`The factor $1/2$ in the energy per atom avoids counting each pair twice. Differentiating the lattice energy gives $r_0$; with volume per atom $V=c r^3$, the bulk modulus at this minimum is $B=Vd^2u/dV^2=-8u_0/V_0$. For fcc this is about $75.2\,\varepsilon/\sigma^3$. The first two neighbour shells of fcc and ideal hcp agree, but subsequent shells differ, so their classical static energies differ slightly: approximately $-8.610\,\varepsilon$ and $-8.611\,\varepsilon$. This energy comparison is restricted to these lattice families and is not a proof of mechanical stability or a real-material phase diagram.`,
      caption: String.raw`Compare fcc, ideal hcp and bcc. Drag the gold handle along the selected energy curve. The bars show the first eight neighbour shells at that spacing; their labels give the atom counts, and the readout separately gives the contribution from all remaining shells. The energy uses a radius-11 lattice sum with a continuum $r^{-6}$ tail, so displayed values are numerical approximations, not exact infinite sums.`,
      scope: String.raw`Classical pair-potential lattice at $T=0$, with uniform dilation and fixed structure. Both zero-point motion and many-body forces are omitted. The curves and modulus are in model units: no experimental argon values or material fit are asserted. The continuum tail has a small discretization error; it is adequate for the displayed three-decimal energies but not for high-precision lattice constants.`,
      deps: ['xtal-1.5'],
      refs: ['Schwerdtfeger, Burrows & Smits, arXiv:2012.05413, Eqs. (3)–(6), (10)–(13), pp. 4–8'],
      tags: ['van der waals', 'lennard-jones', 'cohesion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lennard-Jones_potential' },
      verify: false,
      viz(v) {
        const ST = ['fcc', 'hcp', 'bcc'], COL = { fcc: 'accent', hcp: 'green', bcc: 'orange' };
        const sel = v.select('structure', [{ value: 'fcc', label: 'fcc' }, { value: 'hcp', label: 'hcp (ideal $c/a$)' }, { value: 'bcc', label: 'bcc' }], 'fcc');
        const sE = v.stage({ x: [0.95, 1.6], y: [-9.5, 3], axes: 'box', gutter: true, height: 340, xlabel: 'nearest-neighbour distance $r/\\sigma$', ylabel: 'energy per atom $u/\\varepsilon$', title: 'cohesive energy', weight: 1.2 });
        const sS = v.stage({ x: [0.3, 8.7], y: [-7, 5], axes: 'box', gutter: true, height: 340, xlabel: 'neighbour shell', ylabel: 'shell energy $/\\varepsilon$', title: 'energy by shell at the chosen $r$', weight: 0.9 });
        const h = sE.handle(1.09, -8.6, { color: 'gold', r: 7, constrain: (x) => [Math.max(0.97, Math.min(1.58, x)), ljEnergy(ljSums(sel.value), Math.max(0.97, Math.min(1.58, x)))] });
        v.legend([['accent', 'fcc'], ['green', 'hcp'], ['orange', 'bcc']]);
        v.render(() => {
          for (const s of ST) { const S = ljSums(s); sE.fn((r) => ljEnergy(S, r), { color: COL[s], width: sel.value === s ? 2.8 : 1.4, alpha: sel.value === s ? 1 : 0.6, domain: [0.97, 1.6] }); }
          sE.hline(0, { color: 'faint', width: 1 });
          const S = ljSums(sel.value), r = h.x; h.set(r, ljEnergy(S, r));
          sE.setView([0.95,1.6],[-9.8,Math.max(3,...ST.map(s=>ljEnergy(ljSums(s),0.97)*1.08))]);
          sE.vline(Math.pow((2 * S.s12) / S.s6, 1 / 6), { color: COL[sel.value], width: 1, dash: [4, 4], alpha: 0.7 });
          const sh = S.shells.slice(0, 8), vals=sh.map(q=>2*(q.n/q.r2**6/r**12-q.n/q.r2**3/r**6));
          sS.setView([0.3,8.7],[Math.min(-7,...vals.map(x=>x*1.15)),Math.max(5,...vals.map(x=>x*1.15))]);
          sS.bars(sh.map((q) => 2 * (q.n / q.r2 ** 6 / r ** 12 - q.n / q.r2 ** 3 / r ** 6)), { x0: 1, dx: 1, color: (val) => (val < 0 ? 'green' : 'red') });
          sh.forEach((q, i) => sS.text(`${q.n}`, i + 1, -6.3, { size: 10, color: 'muted', align: 'center' }));
          sS.hline(0, { color: 'faint', width: 1 });
        });
        v.readout(() => {
          const S=ljSums(sel.value), C=crystalSummary(S,h.x); const {r0,u0,B,remainder}=C;
          return `${sel.value}: $S_6\\approx${v.fix(S.s6,5)}$, $S_{12}\\approx${v.fix(S.s12,5)}$, ${S.nn} nearest neighbours · minimum $r_0=${v.fix(r0,4)}\\,\\sigma$, $u_0=${v.fix(u0,3)}\\,\\varepsilon$, $B=${v.fix(B,2)}\\,\\varepsilon/\\sigma^3$\nAt $r=${v.fix(h.x,3)}\\,\\sigma$: $u=${v.fix(C.u,3)}\\,\\varepsilon$; beyond the eight displayed shells, including the continuum tail: $${v.fix(remainder,4)}\\,\\varepsilon$ (numerical model).`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Diatomic chain: acoustic and optical branches',
      credit: 'Born & von Kármán, 1912',
      statement: String.raw`A chain of alternating masses $m$ and $M$ joined by identical springs $K$ (cell length $a$) has normal modes $u_n\propto e^{i(kna-\omega t)}$ whose frequencies solve
$$\omega^2=K\left(\frac1m+\frac1M\right)\pm K\sqrt{\left(\frac1m+\frac1M\right)^2-\frac{4\sin^2(ka/2)}{mM}},$$
two **branches** over the zone $|k|\le\pi/a$: the **acoustic** branch with $\omega\to0$ as $k\to0$ (neighbours move together) and the **optical** branch with $\omega(0)=\sqrt{2K(1/m+1/M)}$ (the two sublattices move against each other). At the zone edge the frequencies are $\sqrt{2K/M}$ and $\sqrt{2K/m}$, leaving a **gap** that closes when $m=M$.`,
      idea: String.raw`With two atoms per cell the Bloch ansatz gives a $2\times2$ eigenproblem for the amplitudes $(U,V)$ on the two sublattices (cm-2.1's band velocity idea applied to a mechanical band). Its two eigenvalues are the two branches; the off-diagonal coupling $2K\cos(ka/2)$ vanishes at the zone edge, where the sublattices decouple and each oscillates at its own frequency $\sqrt{2K/M}$ or $\sqrt{2K/m}$, which opens the gap. The monatomic chain is recovered at $m=M$, where the two branches join into one folded in half (the reduced zone, as in xtal-5.4).`,
      caption: String.raw`Drag the handle along the selected branch of the dispersion curve (left) and watch the chain (right; displacements drawn transverse and enlarged): on the acoustic branch the light and heavy atoms of a cell move in phase, on the optical branch in antiphase (equal momentum, so the heavy atom moves less). Raise the mass ratio $M/m$ to widen the gap; at $M/m=1$ the gap closes at the zone edge.`,
      scope: String.raw`Nearest-neighbour harmonic springs, one polarization (transverse and longitudinal displacements give the same curves with different $K$); real optical branches in ionic crystals are coupled to light, see cm-3.12.`,
      deps: ['mech-11.8', 'xtal-5.4'],
      refs: ['Ashcroft–Mermin ch. 22', 'Kittel ch. 4'],
      tags: ['phonons', 'dispersion', 'optical branch'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phonon#Lattice_dynamics' },
      viz(v) {
        const ratio = v.slider('mass ratio $M/m$', 1, 8, 2.5, { step: 0.05 });
        const br = v.select('branch', [{ value: 'ac', label: 'acoustic' }, { value: 'op', label: 'optical' }], 'ac');
        const branch = (k, sgn, M) => { const A = 1 + 1 / M, s = Math.sin(k / 2); return Math.sqrt(Math.max(0, A + sgn * Math.sqrt(Math.max(0, A * A - (4 * s * s) / M)))); };
        const sD = v.stage({ x: [-PI, PI], y: [0, 2.2], axes: 'box', gutter: true, height: 340, xlabel: 'wave vector $k$', ylabel: '$\\omega/\\sqrt{K/m}$', xticks: [[-PI, '−π/a'], [0, '0'], [PI, 'π/a']], title: 'dispersion', weight: 1 });
        const sC = v.stage({ x: [-0.3, 8.3], y: [-1.6, 1.6], axes: false, height: 340, title: 'the chain (8 cells)', weight: 1.1 });
        const hd = sD.handle(1.2, 0.9, { color: 'gold', r: 7, constrain: (x) => { const k = Math.max(-PI, Math.min(PI, x)); return [k, branch(k, br.value === 'ac' ? -1 : 1, ratio.value)]; } });
        v.legend([['accent', 'acoustic'], ['orange', 'optical'], ['gold', 'selected mode']]);
        const vec = (k, w, M) => { // null vector of [[2−w², −2c],[−2c, 2−Mw²]] (K = m = 1)
          const c = Math.cos(k / 2); let a = [2 * c, 2 - w * w], b = [2 - M * w * w, 2 * c]; const na = Math.hypot(...a), nb = Math.hypot(...b), x = na > nb ? a : b, n = Math.max(na, nb) || 1;
          return [x[0] / n, x[1] / n];
        };
        let wcur = 0, ucur = [1, 0];
        v.animate((t) => {
          const M = ratio.value, sg = br.value === 'ac' ? -1 : 1;
          sD.fn((k) => branch(k, -1, M), { color: 'accent', width: sg < 0 ? 3 : 1.6, alpha: sg < 0 ? 1 : 0.55 });
          sD.fn((k) => branch(k, 1, M), { color: 'orange', width: sg > 0 ? 3 : 1.6, alpha: sg > 0 ? 1 : 0.55 });
          const eg = Math.sqrt(2 / M), eh = Math.sqrt(2);
          sD.hline(eg, { color: 'faint', width: 1, dash: [3, 4] }); sD.hline(eh, { color: 'faint', width: 1, dash: [3, 4] });
          const k = Math.max(-PI, Math.min(PI, hd.x)); wcur = branch(k, sg, M); hd.set(k, wcur); ucur = vec(k, wcur, M);
          const ph = (n, off) => k * (n + off);
          const A = 0.5, tt = t * 1.6, pts = [];
          for (let n = 0; n < 8; n++) for (const [off, amp, mm] of [[0, ucur[0], 1], [0.5, ucur[1], M]]) {
            const x = n + off, y = A * amp * Math.cos(ph(n, off) - tt);
            pts.push({ x, y, mm, off });
          }
          for (let i = 0; i < pts.length - 1; i++) sC.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, { color: 'muted', width: 1.4 });
          for (const p of pts) sC.dot(p.x, p.y, { r: p.off ? 5 + 2.2 * Math.sqrt(M) : 6, color: p.off ? 'orange' : 'accent' });
          sC.hline(0, { color: 'faint', width: 1, dash: [3, 4] });
          sC.text('light $m$', 0.0, -1.35, { size: 11, color: 'accent' }); sC.text('heavy $M$', 1.2, -1.35, { size: 11, color: 'orange' });
        }, { period: (2 * PI) / 1.6, still: 0.7 });
        v.readout(() => {
          const M = ratio.value, k = hd.x;
          return `$\\omega(k)=${v.fix(wcur, 3)}\\sqrt{K/m}$ at $ka=${v.fix(k, 2)}$ · amplitude ratio $V/U=${Math.abs(ucur[0]) < 1e-6 ? '\\infty' : v.fix(ucur[1] / ucur[0], 2)}$ (${ucur[0] * ucur[1] > 0 ? 'same' : 'opposite'} directions)\n zone-edge frequencies $\\sqrt{2K/M}=${v.fix(Math.sqrt(2 / M), 3)}$ and $\\sqrt{2K/m}=${v.fix(Math.SQRT2, 3)}$ → gap $${v.fix(Math.SQRT2 - Math.sqrt(2 / M), 3)}$; optical $\\omega(0)=${v.fix(Math.sqrt(2 * (1 + 1 / M)), 3)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Counting phonon branches',
      statement: String.raw`A three-dimensional crystal with $p$ atoms per primitive cell has exactly $3p$ phonon branches $\omega_s(\mathbf k)$, $s=1,\dots,3p$. Because the crystal is invariant under uniform translation, three of them are **acoustic** ($\omega\to0$ as $\mathbf k\to0$) and the remaining $3(p-1)$ are **optical** ($\omega(0)>0$). A crystal of $N$ cells therefore has $3pN$ normal modes, one for each degree of freedom, and in the zone each branch has exactly $N$ allowed wave vectors.`,
      idea: String.raw`For each wave vector the equations of motion form a $3p\times3p$ Hermitian dynamical matrix $D(\mathbf k)$, so it has $3p$ real eigenvalues $\omega^2$ (positive for a stable crystal). At $\mathbf k=0$ a rigid translation of all atoms along $x$, $y$ or $z$ stretches no bond and so is a zero-frequency eigenvector: this is the acoustic sum rule, equivalent to $\sum_{j}\Phi_{ij}=0$ and responsible for three zero eigenvalues. Counting the allowed $\mathbf k$ (Born–von Kármán boundary conditions gives $N$ points in the zone, cm-1.6's counting) times $3p$ gives $3pN$.`,
      caption: String.raw`A model crystal on a cubic cell with $p$ atoms of unequal mass joined by springs with longitudinal and transverse stiffness (bond list from distance, not a fit to any material). **Left:** all $3p$ branches along $\Gamma\to X\to M\to R\to\Gamma$ from numerical diagonalisation. **Right:** a histogram of all $3pN$ frequencies of a $3\times3\times3$ crystal ($N=27$). Raise $p$ and count. Switch on **pin the atoms** (a spring to the substrate on every atom, which destroys translation invariance): the three acoustic branches acquire a gap and no mode has $\omega\to0$.`,
      scope: String.raw`Harmonic, stable crystals. The value $p$ is the number of atoms in the primitive cell; counts of the individual symmetry types of branch (transverse/longitudinal) require the crystal's point group.`,
      deps: ['cm-3.3', 'mech-11.4'],
      refs: ['Ashcroft–Mermin ch. 22', 'Kittel ch. 4'],
      tags: ['phonons', 'branches', 'counting'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phonon' },
      viz(v) {
        const M = v.M;
        const pS = v.slider('atoms per cell $p$', 1, 5, 2, { int: true });
        const pin = v.toggle('pin the atoms to a substrate', false);
        const PATH = [['Γ', [0, 0, 0]], ['X', [0.5, 0, 0]], ['M', [0.5, 0.5, 0]], ['R', [0.5, 0.5, 0.5]], ['Γ', [0, 0, 0]]];
        const npts = 12; let key = '', branchesData = [], allW = [], g0 = [];
        const sB = v.stage({ x: [0, 4], y: [0, 3], axes: 'box', gutter: true, height: 340, xlabel: 'wave vector path', ylabel: '$\\omega$ (arb.)', xticks: PATH.map((q, i) => [i, q[0]]), title: 'phonon branches', weight: 1.3 });
        const sH = v.stage({ x: [0, 3], y: [0, 40], axes: 'box', gutter: true, height: 340, xlabel: '$\\omega$', ylabel: 'number of modes', title: 'all $3pN$ modes, $N=27$', weight: 0.8 });
        v.render(() => {
          const p = pS.value, on = pin.value ? 0.12 : 0, kk = `${p}${on}`;
          if (kk !== key) {
            key = kk; branchesData = [];
            for (let s = 0; s < 3 * p; s++) branchesData.push([]);
            for (let seg = 0; seg < 4; seg++) for (let i = 0; i < npts; i++) {
              const a = PATH[seg][1], b = PATH[seg + 1][1], f = i / npts, w = phononFreqs(M.eigSym, p, [0, 1, 2].map((q) => a[q] + f * (b[q] - a[q])), { onsite: on });
              w.forEach((x, s) => branchesData[s].push([seg + f, x]));
            }
            const w = phononFreqs(M.eigSym, p, [0, 0, 0], { onsite: on }); branchesData.forEach((br, s) => br.push([4, w[s]]));
            allW = []; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) allW.push(...phononFreqs(M.eigSym, p, [a / 3, b / 3, c / 3], { onsite: on }));
            g0 = w;
          }
          const top = Math.max(...allW) * 1.08; sB.setView([0, 4], [0, top]);
          branchesData.forEach((br, s) => sB.path(br, { color: s < 3 ? 'accent' : 'orange', width: s < 3 ? 2.6 : 1.8 }));
          for (let i = 1; i < 4; i++) sB.vline(i, { color: 'faint', width: 1, dash: [3, 4] });
          const nb = 24, hi = top, counts = new Array(nb).fill(0); allW.forEach((w) => { counts[Math.min(nb - 1, Math.floor((w / hi) * nb))]++; });
          sH.setView([0, hi], [0, Math.max(...counts) * 1.15 + 1]);
          sH.hist({ edges: Array.from({ length: nb + 1 }, (_, i) => (i * hi) / nb), counts }, { color: 'accent', fillAlpha: 0.35 });
        });
        v.legend([['accent', 'acoustic (3)'], ['orange', 'optical ($3p-3$)']]);
        v.readout(() => {
          const p = pS.value, nz = g0.filter((w) => w < 1e-4).length;
          return `$p=${p}$: ${g0.length} branches counted by diagonalising $D(\\mathbf k)$; branches with $\\omega(\\Gamma)=0$: **${nz}** acoustic, **${g0.length - nz}** optical (theorem: 3 and $3(p-1)=${3 * p - 3}$)\ntotal modes found on the $27$-cell crystal: ${allW.length} $=3pN=${3 * p * 27}$ ✓ · lowest $\\omega(\\Gamma)$ among the branches $=${v.fix(g0[0], 3)}$ ${pin.value ? '(pinned: translation invariance broken, no zero mode)' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Phonons',
      statement: String.raw`Quantizing the normal modes of a crystal turns each mode $(\mathbf k,s)$ into a harmonic oscillator with energy levels $\hbar\omega_s(\mathbf k)\left(n+\tfrac12\right)$, $n=0,1,2,\dots$. A **phonon** is one quantum of such an oscillator: an excitation of energy $\hbar\omega$ and crystal momentum $\hbar\mathbf k$ (defined modulo $\hbar\mathbf G$). At temperature $T$ the phonons are bosons with mean occupation of each mode
$$\bar n_s(\mathbf k)=\frac{1}{e^{\hbar\omega_s(\mathbf k)/k_BT}-1},\qquad U=\sum_{\mathbf k,s}\hbar\omega_s(\mathbf k)\left(\bar n_s(\mathbf k)+\tfrac12\right),$$
and the number of phonons is not conserved.`,
      idea: String.raw`In the harmonic approximation the Hamiltonian is a sum of independent oscillators, one per normal mode (cm-3.4), so its eigenstates are products of oscillator number states and the canonical average over each ladder is a geometric series: $P(n)=(1-e^{-x})e^{-nx}$ with $x=\hbar\omega/k_BT$, whose mean is the Bose–Einstein function. A phonon carries crystal momentum only, since the lattice itself can absorb $\hbar\mathbf G$; this is why the "momentum" of a phonon is not conserved in Umklapp collisions. For a positive-frequency mode at positive temperature, put $q=e^{-\hbar\omega/k_BT}$, so $0<q<1$. The geometric-series theorem (pma 3.26) normalizes its occupation probabilities by $\sum_{n\ge0}q^n=1/(1-q)$. Summing the nonnegative tails gives the mean $\sum_{j\ge1}q^j=q/(1-q)$, the displayed Bose factor. A zero-frequency rigid translation is outside this oscillator normalization.`,
      caption: String.raw`**Left:** the mean occupation $\bar n$ of every mode of a square-lattice crystal over the Brillouin zone, with $\omega(\mathbf k)=\omega_m\sqrt{\sin^2(k_xa/2)+\sin^2(k_ya/2)}$ (a model acoustic band; brighter = more phonons). Drag the handle to pick a mode and read its energy ladder on the right: the bars give $P(n)$, and the vertical axis is the energy $\hbar\omega(n+\tfrac12)$. Raise $T$ and watch the long-wavelength modes fill first, then the whole zone.`,
      scope: String.raw`Harmonic approximation; anharmonic interactions give phonons a finite lifetime and make their number change in collisions (cm-3.9, cm-3.10). The 2D square-lattice model band is illustrative.`,
      deps: ['cm-3.4', 'qm-4.1', 'pma-3.26'],
      refs: ['Ashcroft–Mermin ch. 23', 'Kittel ch. 4'],
      tags: ['phonon', 'bose-einstein', 'quantization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phonon' },
      viz(v) {
        const T = v.slider('temperature $k_BT/\\hbar\\omega_m$', 0.02, 3, 0.4, { log: true, sig: 2 });
        const w = (kx, ky) => Math.sqrt(Math.sin(kx / 2) ** 2 + Math.sin(ky / 2) ** 2);
        const sK = v.stage({ x: [-PI, PI], y: [-PI, PI], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$k_x a$', ylabel: '$k_y a$', xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], title: 'mean phonon number $\\bar n(\\mathbf k)$', weight: 1 });
        const sL = v.stage({ x: [-0.6, 12.6], y: [0, 14], axes: 'box', gutter: true, height: 340, xlabel: 'phonon number $n$', ylabel: 'energy $E_n/\\hbar\\omega_m$', title: 'ladder of the selected mode', weight: 1 });
        const hk = sK.handle(1.0, 0.6, { color: 'gold', r: 7, constrain: { x: [-PI, PI], y: [-PI, PI] } });
        v.render(() => {
          const t = T.value, wm = w(hk.x, hk.y), x = Math.max(1e-6, wm / t);
          sK.heat((kx, ky) => { const e = w(kx, ky) / t; return Math.log10(1 + 1 / Math.expm1(Math.max(e, 1e-4))); }, { cmap: 'theme', color: 'accent', range: [0, Math.log10(1 + 1 / Math.expm1(0.12 / t))], res: 4, key: `T${t.toFixed(4)}` });
          sK.axes();
          sK.contour((kx, ky) => w(kx, ky), [0.25, 0.5, 0.75], { color: 'ink', width: 0.8, alpha: 0.35 });
          const NL = 12;
          for (let n = 0; n <= NL; n++) { const E = wm * (n + 0.5); if (E < 14) sL.hline(E, { color: 'faint', width: 1 }); }
          const pn = (n) => (1 - Math.exp(-x)) * Math.exp(-n * x);
          sL.bars(Array.from({ length: NL + 1 }, (_, n) => pn(n) * 12), { x0: 0, dx: 1, color: 'accent' });
          for (let n = 0; n <= NL; n++) { const E = wm * (n + 0.5); if (E < 14) sL.dot(n, E, { r: 4, color: 'orange' }); }
          sL.text('bar height: $12P(n)$', 4.6, 12.8, { size: 11, color: 'accent' });
        });
        v.readout(() => {
          const t = T.value, wm = w(hk.x, hk.y), x = wm / t, nb = bose(x);
          let U = 0, N = 0, cnt = 0; const G = 40; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const ww = w(-PI + ((i + 0.5) * 2 * PI) / G, -PI + ((j + 0.5) * 2 * PI) / G); if (ww < 1e-6) continue; const b = bose(ww / t); U += ww * b; N += b; cnt++; }
          return `selected mode: $\\hbar\\omega=${v.fix(wm, 3)}\\,\\hbar\\omega_m$, $\\bar n=${v.fix(nb, 3)}$, fluctuation $\\mathrm{var}\\,n=\\bar n(\\bar n+1)=${v.fix(nb * (nb + 1), 3)}$\nwhole zone: ${v.fix(N / cnt, 2)} phonons per mode, thermal energy per mode $=${v.fix(U / cnt / t, 3)}\\,k_BT$ (→ 1 at high $T$: Dulong–Petit; → 0 as $T\\to0$: modes frozen out)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Phenomenon',
      name: 'Speed of sound from the acoustic branch',
      statement: String.raw`At long wavelengths the acoustic branch is linear, $\omega=v_sk$, and the slope is the speed of sound. For a monatomic chain of mass $m$, spacing $a$ and spring constant $K$ the dispersion $\omega=2\sqrt{K/m}\,|\sin(ka/2)|$ gives $v_s=a\sqrt{K/m}$. In three dimensions $v_s^2=(\text{elastic modulus})/\rho$ for each polarization, so the "spring constant" can be read off from the measured sound speed: $K=mv_s^2/a^2$.`,
      idea: String.raw`Expanding $\sin(ka/2)\approx ka/2$ gives $\omega\approx a\sqrt{K/m}\,k$, i.e. a non-dispersive wave of velocity $a\sqrt{K/m}$. The group velocity $d\omega/dk=a\sqrt{K/m}\cos(ka/2)$ falls to zero at the zone edge, where the wave is a standing pattern of alternating displacements and carries no energy (Bragg reflection of the lattice wave, compare cm-1.4). A wave only behaves as sound when $ka\ll1$, i.e. when its wavelength spans many atoms.`,
      caption: String.raw`Set the mass $m$, spacing $a$ and spring constant $K$ in consistent model units: the readout gives $v_s=a\sqrt{K/m}$ and the zone-edge frequency. The plots use normalized axes, so these inputs change the dimensional scales without changing the universal curve. Zoom toward $ka=0$ to compare the acoustic branch with its tangent, and compare phase and group velocities.`,
      scope: String.raw`Monatomic nearest-neighbour harmonic chain. The model inputs are freely chosen and are not measured properties of aluminium, copper or iron. A real three-dimensional crystal has polarization- and direction-dependent sound speeds determined by its elastic tensor and density; a single fitted chain stiffness cannot reconstruct that tensor.`,
      deps: ['mech-11.8'],
      refs: ['David Tong, Applications of Quantum Mechanics, §4.1.1, Eqs. (4.1)–(4.4), pp. 103–105'],
      tags: ['sound', 'acoustic phonon', 'dispersion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Speed_of_sound' },
      verify: false,
      viz(v) {
        const mass=v.slider('mass $m$ (model units)',0.5,5,1,{step:0.1});
        const spacing=v.slider('spacing $a$ (model units)',0.5,3,1,{step:0.1});
        const spring=v.slider('spring constant $K$ (model units)',0.5,8,2,{step:0.1});
        const zoom = v.slider('zoom: range of $ka$ shown', 0.05, PI, PI, { log: true, sig: 2 });
        const sD = v.stage({ x: [0, PI], y: [0, 2.1], axes: 'box', gutter: true, height: 340, xlabel: 'wave number $ka$', ylabel: '$\\omega/\\sqrt{K/m}$', title: 'acoustic branch and its tangent', weight: 1.2 });
        const sV = v.stage({ x: [0, PI], y: [0, 1.1], axes: 'box', gutter: true, height: 340, xlabel: 'wave number $ka$', ylabel: 'velocity$/v_s$', title: 'phase and group velocity', weight: 0.9 });
        v.legend([['accent', '$\\omega(k)$'], ['muted', 'tangent $v_sk$', { dash: true }], ['green', 'group velocity'], ['orange', 'phase velocity']]);
        v.render(() => {
          const z = zoom.value; sD.setView([0, z], [0, 1.05 * z]); sV.setView([0, z], [Math.max(0, 1 - 1.3 * (1 - Math.cos(z / 2))) - 0.02, 1.05]);
          sD.fn((x) => 2 * Math.sin(x / 2), { color: 'accent', width: 2.6, domain: [0, z] });
          sD.fn((x) => x, { color: 'muted', width: 1.4, dash: [5, 4], domain: [0, z] });
          sV.fn((x) => Math.cos(x / 2), { color: 'green', width: 2.4, domain: [0, z] });
          sV.fn((x) => (x < 1e-6 ? 1 : (2 * Math.sin(x / 2)) / x), { color: 'orange', width: 2.4, domain: [0, z] });
          sV.hline(1, { color: 'faint', width: 1, dash: [3, 4] });
        });
        v.readout(() => {
          const A=soundModel(mass.value,spacing.value,spring.value,zoom.value), z=zoom.value;
          return `Model $m=${v.fix(mass.value,1)}$, $a=${v.fix(spacing.value,1)}$, $K=${v.fix(spring.value,1)}$: $v_s=a\\sqrt{K/m}=${v.fix(A.vs,3)}$ length/time · zone-edge angular frequency $2\\sqrt{K/m}=${v.fix(A.edgeOmega,3)}$ radians/time, cyclic frequency $f=${v.fix(A.edgeOmega/(2*PI),3)}$ cycles/time\nWindow $ka\\le${v.fix(z,3)}$: frequency ${v.fix(A.deviation*100,3)}% below tangent at the right edge; group speed $${v.fix(A.group,4)}\\,v_s$, phase speed $${v.fix(A.phase,4)}\\,v_s$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Method',
      name: 'Inelastic neutron scattering',
      credit: 'Brockhouse (Nobel Prize 1994 "for the development of neutron spectroscopy")',
      statement: String.raw`A neutron of wave vector $\mathbf k_i$ and energy $E_i=\hbar^2k_i^2/2m_n$ that creates (or absorbs) one phonon of the crystal and leaves with $\mathbf k_f$ must obey two conservation laws,
$$\hbar\omega=E_i-E_f,\qquad \mathbf Q=\mathbf k_i-\mathbf k_f=\mathbf G+\mathbf q,$$
with $\hbar\omega=\pm\hbar\omega_s(\mathbf q)$ for the phonon created (+) or absorbed (−). Measuring the outgoing neutron's energy and direction therefore reads off one point $(\mathbf q,\omega)$ of the dispersion relation per peak, and scanning the geometry traces out the branches.`,
      idea: String.raw`The crystal conserves energy exactly and crystal momentum up to a reciprocal-lattice vector (the neutron scatters from the periodic nuclei like the diffraction condition of xtal-6.4, with the lattice absorbing $\hbar\mathbf G$); the phonon of cm-3.5 supplies the remaining $\hbar\mathbf q$ and $\hbar\omega$. Thermal neutrons have wavelengths of order an ångström and energies of order tens of meV, the same as the lattice spacing and phonon energies, so a single collision changes the neutron's energy by a large fraction and both quantities can be measured.`,
      caption: String.raw`A model square-lattice crystal ($a=4$ Å, $\hbar\omega=\hbar\omega_m\sqrt{\sin^2(q_xa/2)+\sin^2(q_ya/2)}$ with $\hbar\omega_m=20$ meV) is probed by neutrons of energy $E_i$ along $x$ detected at scattering angle $\varphi$. **Left:** the map of the dispersion in $\mathbf Q$-space with the path that $\mathbf Q$ follows as the outgoing energy is scanned. **Right:** the energy transfer of the path (blue, vs $\omega$) against the phonon energy at that $\mathbf Q$ (orange): detected peaks sit at the crossings with the line $\hbar\omega=\hbar\omega_{\rm ph}$ (loss, $\omega>0$) or $\hbar\omega=-\hbar\omega_{\rm ph}$ (gain). Change $E_i$ and $\varphi$ to move the crossings.`,
      scope: String.raw`Single-phonon, coherent scattering from a single crystal at the nuclei; the dispersion shown is a model, not a measurement. Intensities (structure factors, $\propto Q^2\bar n$) and instrumental resolution are not modelled: peaks are given a fixed width.`,
      deps: ['cm-3.5', 'xtal-6.4'],
      refs: ['Ashcroft–Mermin ch. 24', 'Kittel ch. 4'],
      tags: ['neutron scattering', 'phonon dispersion', 'kinematics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inelastic_neutron_scattering' },
      viz(v) {
        const C = v.M.CONST, EC = (C.hbar * C.hbar) / (2 * C.mn) / (C.eV * 1e-3) * 1e20; // ħ²/2m_n in meV·Å²  (= 2.0721)
        const a = 4, Wm = 20, g = 2 * PI / a;
        const Ei = v.slider('incident energy $E_i$ (meV)', 8, 60, 30, { step: 0.5 });
        const phi = v.slider('scattering angle $\\varphi$ (°)', 5, 170, 60, { step: 1 });
        const wph = (qx, qy) => Wm * Math.sqrt(Math.sin((qx * a) / 2) ** 2 + Math.sin((qy * a) / 2) ** 2);
        const sQ = v.stage({ x: [-1.5, 4.5], y: [-3.2, 3.2], equal: true, axes: 'box', gutter: true, height: 380, xlabel: '$Q_x a/2\\pi$', ylabel: '$Q_y a/2\\pi$', title: '$\\hbar\\omega_{\\rm ph}$ over reciprocal space', weight: 1.1 });
        const sW = v.stage({ x: [-60, 60], y: [0, 70], axes: 'box', gutter: true, height: 380, xlabel: 'energy transfer $\\hbar\\omega=E_i-E_f$ (meV)', ylabel: 'meV', title: 'kinematic path versus phonon energy', weight: 1 });
        v.legend([['accent', '$|\\hbar\\omega|$'], ['orange', '$\\hbar\\omega_{\\rm ph}(\\mathbf Q(\\omega))$'], ['gold', 'allowed processes']]);
        let peaks = [];
        v.render(() => {
          const E0 = Ei.value, ki = Math.sqrt(E0 / EC), ph = (phi.value * PI) / 180, cs = Math.cos(ph), sn = Math.sin(ph);
          const Qof = (w) => { const kf = Math.sqrt(Math.max(0, (E0 - w) / EC)); return [ki - kf * cs, -kf * sn]; };
          sQ.heat((x, y) => wph((x * 2 * PI) / a, (y * 2 * PI) / a), { cmap: 'theme', color: 'accent', range: [0, Wm * 1.4], res: 4, key: 'wph' });
          sQ.axes();
          for (let i = -1; i <= 4; i++) for (let j = -3; j <= 3; j++) sQ.dot(i, j, { r: 3, color: 'ink', alpha: 0.6 });
          const pts = []; for (let w = -E0 * 0.9; w <= E0 * 0.999; w += E0 / 150) { const Q = Qof(w); pts.push([Q[0] / g, Q[1] / g]); }
          sQ.path(pts, { color: 'gold', width: 2.6 });
          const Q0 = Qof(0); sQ.arrow(0, 0, ki / g, 0, { color: 'accent', width: 1.5 }); sQ.dot(Q0[0] / g, Q0[1] / g, { r: 5, color: 'gold' });
          sQ.text('elastic point ($\\omega=0$)', Q0[0] / g + 0.1, Q0[1] / g - 0.3, { size: 10, color: 'ink' });
          sW.fn((w) => Math.abs(w), { color: 'accent', width: 1.8, domain: [-60, Math.min(60, E0)] });
          const lo = -Math.min(60, E0 * 0.9), hi = Math.min(60, E0 * 0.999), f = (w) => { const Q = Qof(w); return wph(Q[0], Q[1]); };
          sW.fn(f, { color: 'orange', width: 2.4, domain: [lo, hi], n: 600 });
          peaks = []; let pw = lo, pd = f(pw) - Math.abs(pw);
          for (let w = lo + 0.2; w <= hi; w += 0.2) { const d = f(w) - Math.abs(w); if (pd * d <= 0 && Math.abs(w) > 0.4) { let l = w - 0.2, r = w; for (let it = 0; it < 30; it++) { const m = (l + r) / 2; if ((f(l) - Math.abs(l)) * (f(m) - Math.abs(m)) <= 0) r = m; else l = m; } peaks.push((l + r) / 2); } pd = d; }
          peaks.forEach((w) => { sW.dot(w, Math.abs(w), { r: 6, color: 'gold' }); const Q = Qof(w); sQ.dot(Q[0] / g, Q[1] / g, { r: 6, color: 'red' }); });
          sW.vline(0, { color: 'faint', width: 1 });
        });
        v.readout(() => {
          const E0 = Ei.value, ki = Math.sqrt(E0 / EC);
          const txt = peaks.length ? peaks.map((w) => `${w > 0 ? 'creates' : 'absorbs'} a phonon of ${v.fix(Math.abs(w), 1)} meV`).join('; ') : 'no phonon can be created or absorbed at this geometry';
          return `$k_i=${v.fix(ki, 2)}$ Å⁻¹ ($\\lambda=${v.fix(2 * PI / ki, 2)}$ Å, $\\hbar^2/2m_n=${v.fix(EC, 4)}$ meV Å²) · ${peaks.length} detected peak${peaks.length === 1 ? '' : 's'}: ${txt}`;
        });
      },
    },
  ],
};
