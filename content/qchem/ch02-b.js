// Quantum Chemistry & Spectroscopy — Chapter 2, part b: items 2.6–2.10 (2.1–2.5 are in ch02.js)
import { TAU, HARTREE_EV, RY_EV, A0_PM, Rnl, LETTER, radialLevels, zeros } from './ch02.shared.js';

const FAM = ['accent', 'orange', 'green', 'purple'];
const half = (j2) => (j2 % 2 ? `${j2}/2` : `${j2 / 2}`);

export default {
  collection: 'qchem',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Phenomenon',
      name: 'Accidental l-degeneracy of hydrogen',
      credit: 'Pauli, 1926 (Runge–Lenz symmetry); Fock, 1935 (SO(4))',
      statement: String.raw`In the pure Coulomb potential $-Z/r$ the energy $E_n=-Z^2/2n^2$ does not depend on $l$: the $2$s and $2$p levels coincide exactly, as do $3$s, $3$p, $3$d, and so on, giving the shell a degeneracy $n^2$ rather than the $2l+1$ that rotational symmetry alone guarantees. The extra degeneracy is called *accidental* because it has no origin in the rotation group; it comes from a hidden symmetry, the conservation of the Runge–Lenz vector, which exists only for a $1/r$ force. Any deviation of the potential from $-Z/r$ — core penetration, polarization of the core, a finite nuclear size — lifts it: levels with the same $n$ separate according to $l$, and in general the lower the $l$ the lower the energy.`,
      scope: String.raw`Exact for the non-relativistic point-nucleus hydrogen atom (and hydrogen-like ions); fine structure and the Lamb shift break it at the $10^{-5}$ eV level. The deformations used here are model potentials for a valence electron outside a core, not computed from a many-electron wave function.`,
      idea: String.raw`For the Kepler problem classical orbits of a given energy close (no precession), which is the classical trace of the extra constant of motion $\vec A=\vec p\times\vec L-m k\hat r$ (mech-12.9). Quantum mechanically $\vec L$ and $\vec A$ generate an $\mathrm{SO}(4)$ algebra whose irreducible representations have dimension $n^2$. Perturb the potential and $\vec A$ is no longer conserved: first-order perturbation theory gives $\Delta E_{nl}=\langle R_{nl}|\Delta V|R_{nl}\rangle$, which differs for different $l$ because low-$l$ orbitals have more probability near the nucleus (small $r$), where a screening or penetration term is large.`,
      caption: String.raw`Choose a **deformation** of the Coulomb potential and raise its strength $s$ from zero. Left: all levels with $n\le4$ arranged by $l$ (faint grey ticks: pure Coulomb). Middle: a zoom on one **shell** showing each level's shift from the hydrogen value in meV, with first-order perturbation theory as hollow circles. Right: the radial densities $r^2R^2$ of that shell (solid) against the unperturbed ones (dashed): the s state, which reaches into the core, is pulled down the most. At $s=0$ every difference vanishes to the accuracy of the solver (about $10^{-7}$ hartree), so the grouping of s before p in many-electron atoms (3.5) is visible here in miniature.`,
      deps: ['qchem-2.2', 'mech-12.9'],
      see: ['mech-12.9'],
      refs: ['McQuarrie ch. 7'],
      tags: ['accidental degeneracy', 'screening', 'Runge–Lenz vector'],
      viz(v) {
        const M = v.M;
        const type = v.select('deformation', [{ value: 'core', label: 'core penetration' }, { value: 'pol', label: 'polarizable core' }], 'core');
        const sS = v.slider('strength $s$', 0, 1, 0.08, { step: 0.005 });
        const rS = v.slider('range of the core $\\rho$ ($a_0$)', 0.3, 3, 1, { step: 0.01 });
        const shell = v.select('zoom on shell', [2, 3, 4].map((n) => ({ value: String(n), label: `$n=${n}$` })), '2');
        const sA = v.stage({ x: [-1.15, 3.7], y: [-14.5, 0.4], height: 340, axes: 'box', gutter: true, weight: 0.9, xticks: [[0, 's'], [1, 'p'], [2, 'd'], [3, 'f']], ylabel: 'E (eV)', title: 'levels $n\\le4$ in the deformed potential' });
        const sB = v.stage({ x: [-0.6, 3.6], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 0.9, xticks: [[0, 's'], [1, 'p'], [2, 'd'], [3, 'f']], ylabel: 'E − E(H) (meV)', title: 'zoom on the shell' });
        const sC = v.stage({ x: [0, 20], y: [0, 0.3], height: 340, axes: 'box', gutter: true, weight: 1.1, xlabel: 'r / a₀', ylabel: 'r²R²', title: 'radial distributions of the shell' });
        let cache = null, ckey = '', st = null;
        const potential = (kind, s, rho) => (kind === 'core'
          ? { V: (r) => -(1 + 1.5 * s * Math.exp(-r / rho)) / r, dV: (r) => -(1.5 * s * Math.exp(-r / rho)) / r }
          : { V: (r) => -1 / r - (4 * s) / (2 * (r * r + rho * rho) ** 2), dV: (r) => -(4 * s) / (2 * (r * r + rho * rho) ** 2) });
        v.render(() => {
          const kind = type.value, s = sS.value, rho = rS.value, N = +shell.value, key = `${kind},${s},${rho}`;
          if (key !== ckey) {
            ckey = key; const P = potential(kind, s, rho);
            cache = [0, 1, 2, 3].map((l) => radialLevels(M, P.V, l, 4 - l, { rmax: 80, h: 0.04 }));
          }
          const P = potential(kind, s, rho), En = (n) => -RY_EV / (n * n);
          const E = (n, l) => cache[l].E[n - l - 1] * HARTREE_EV;
          sA.setView([-1.15, 3.7], [Math.min(-14.5, E(1, 0) * 1.05 - 0.4), 0.4]);
          // panel A
          for (let n = 1; n <= 4; n++) for (let l = 0; l < n; l++) {
            sA.line(l - 0.34, En(n), l + 0.34, En(n), { color: 'faint', width: 3, alpha: 0.7 });
            sA.line(l - 0.3, E(n, l), l + 0.3, E(n, l), { color: n === N ? 'accent' : 'ink', width: n === N ? 3 : 2 });
          }
          for (let n = 1; n <= 4; n++) sA.text(`n=${n}`, -1.1, En(n), { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          // panel B
          const dE = []; let lo = 0, hi = 0;
          for (let l = 0; l < N; l++) {
            const d = (E(N, l) - En(N)) * 1e3, R = (r) => Rnl(N, l, r), top = N * N * 6 + 20;
            const first = M.integrate((r) => R(r) ** 2 * P.dV(r) * r * r, 1e-6, top, 3000) * HARTREE_EV * 1e3;
            dE.push({ l, d, first }); lo = Math.min(lo, d, first); hi = Math.max(hi, d, first);
          }
          const span = Math.max(hi - lo, 2), pad = 0.22 * span;
          sB.setView([-0.6, 3.6], [lo - pad, hi + pad]);
          sB.hline(0, { color: 'green', width: 1.5, dash: [5, 4] });
          dE.forEach(({ l, d, first }) => {
            sB.line(l - 0.3, d, l + 0.3, d, { color: FAM[l], width: 3.5 });
            sB.dot(l + 0.42, first, { r: 5, hollow: true, color: FAM[l] });
            sB.text(`${N}${LETTER[l]}`, l - 0.3, d, { size: 11, color: FAM[l], align: 'right', baseline: 'middle' });
          });
          // panel C
          const ext = 1.7 * N * N + 3; let ymax = 0;
          const ps = [];
          for (let l = 0; l < N; l++) {
            const u = cache[l].u[N - l - 1], h = cache[l].h, pts = [];
            for (let i = 0; i < u.length; i += 2) { const r = (i + 1) * h; if (r > ext) break; pts.push([r, u[i] * u[i]]); ymax = Math.max(ymax, u[i] * u[i]); }
            ps.push(pts);
          }
          for (let l = 0; l < N; l++) for (let i = 1; i < 400; i++) { const r = (ext * i) / 400; ymax = Math.max(ymax, r * r * Rnl(N, l, r) ** 2); }
          sC.setView([0, ext], [0, ymax * 1.12]);
          for (let l = 0; l < N; l++) {
            sC.fn((r) => r * r * Rnl(N, l, r) ** 2, { color: FAM[l], width: 1.4, dash: [5, 4], alpha: 0.7, n: 400 });
            sC.path(ps[l], { color: FAM[l], width: 2.5 });
            sC.text(`${N}${LETTER[l]}`, ps[l][ps[l].length - 1][0] * 0.0 + ext * 0.97, ymax * (1.02 - 0.09 * l), { size: 12, color: FAM[l], align: 'right' });
          }
          // checks
          const hyd = Math.max(...[1, 2, 3].map((n) => Math.max(...Array.from({ length: n }, (_, l) => Math.abs(E(n, l) - En(n))))));
          st = { N, dE, s, hyd, kind };
        });
        v.legend([['accent', 's'], ['orange', 'p'], ['green', 'd'], ['purple', 'f'], ['ink', 'dashed: pure Coulomb', { dash: true }], ['muted', 'hollow: first-order theory', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const e = (l) => st.dE[l], parts = st.dE.map(({ l, d, first }) => `$${st.N}${LETTER[l]}$: ${v.fix(d, 2)} meV (first order ${v.fix(first, 2)})`).join(' · ');
          return `Shell $n=${st.N}$, shifts from $E_n^{\\rm H}$: ${parts}.` + (st.N >= 2 ? `\n$E(${st.N}\\mathrm{s})-E(${st.N}\\mathrm{p})=${v.fix(e(0).d - e(1).d, 3)}$ meV${st.s === 0 ? ` — zero for the pure $1/r$ potential; largest numerical deviation of any level with $n\\le3$ from $-13.606/n^2$ eV: ${v.sci(Math.max(st.hyd, 1e-12), 1)}$ eV` : ' — s lies below p, as for the valence electron of an alkali atom'}.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Postulate',
      name: 'Electron spin',
      credit: 'Stern & Gerlach, 1922; Uhlenbeck & Goudsmit, 1925; Pauli, 1927',
      statement: String.raw`Besides its orbital motion an electron has an intrinsic angular momentum, **spin**, described by operators $\hat S_x,\hat S_y,\hat S_z$ with the same commutation relations as orbital angular momentum, $[\hat S_x,\hat S_y]=i\hbar\hat S_z$ and cyclic. For the electron $s=\tfrac12$: $\hat S^2$ has the single eigenvalue $\hbar^2s(s+1)=\tfrac34\hbar^2$ and the component along *any* chosen axis can be measured to be only $m_s\hbar=\pm\tfrac12\hbar$. The spin state is a two-component vector $\alpha\,\chi_+ +\beta\,\chi_-$, and a spin prepared along $z$ and measured along an axis tilted by $\vartheta$ gives $+\tfrac12$ with probability $\cos^2(\vartheta/2)$. A magnetic moment $\vec\mu=-g_s\mu_B\vec S/\hbar$ with $g_s\approx2$ accompanies it; the full wave function of an electron is a product of a space part and a spin part.`,
      scope: String.raw`Non-relativistic quantum mechanics takes spin as an additional postulate; it emerges automatically from the Dirac equation. The value $g_s=2.0023\ldots$ (not exactly 2) comes from quantum electrodynamics.`,
      idea: String.raw`Orbital angular momentum of quantum number $l$ would give $2l+1$ components, an odd number, so a beam of atoms with a *half-integer* number of projections — two, in the silver experiment, with the atom in an $l=0$ state — needs an angular momentum that is not an orbital one (qm-7.7, 1.9). The algebra $[S_x,S_y]=i\hbar S_z$ is satisfied by the Pauli matrices $\hat S_i=\tfrac\hbar2\sigma_i$, whose eigenvalues along every direction are $\pm\tfrac\hbar2$. Because the same two eigenvalues occur along every axis, the apparatus can show only two spots whichever way the field points; a tilted field just *resolves* the same state along a new axis, with Malus-like probabilities $\cos^2(\vartheta/2)$ and $\sin^2(\vartheta/2)$.`,
      caption: String.raw`A simulated Stern–Gerlach apparatus: atoms fly into the page and a field gradient along the orange axis $B$ (**drag its tip** or use the tilt slider) deflects each one in proportion to its moment's component along that axis. Choose the **kind of moment**: with classical magnets the hits form a smear, with **spin ½** exactly two spots appear, with angular momentum 1 (what an orbital $p$ state would give) three. Tilt the field: the two spots rotate with it but stay two. Prepare the beam *up along $z$*: the field now splits it unevenly, $\cos^2(\vartheta/2)$ against $\sin^2(\vartheta/2)$, whereas a classical beam would just move to a single shifted spot. Deflections are in units of the full deflection; spot widths are arbitrary.`,
      deps: ['qchem-1.9', 'qm-7.7'],
      refs: ['McQuarrie ch. 9'],
      tags: ['spin', 'Stern–Gerlach', 'angular momentum'],
      viz(v) {
        const M = v.M, NP = 1600, T = 7;
        const model = v.select('moments of the atoms', [{ value: 'cl', label: 'classical magnets' }, { value: 'half', label: 'spin ½' }, { value: 'one', label: 'angular momentum 1' }], 'half');
        const src = v.select('beam', [{ value: 'un', label: 'unpolarized' }, { value: 'up', label: 'prepared “up” along $z$' }], 'un');
        const thS = v.slider('tilt $\\vartheta$ of the field axis from $z$ (°)', 0, 180, 35, { step: 1 });
        const sA = v.stage({ x: [-2.5, 2.5], y: [-2.5, 2.5], equal: true, height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'x on the screen', ylabel: 'z on the screen', title: 'screen: where the atoms land' });
        const sB = v.stage({ x: [-1.8, 1.8], y: [0, 100], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'deflection along the field axis', ylabel: 'atoms per bin', title: 'projected deflection' });
        const hd = sA.handle(1.2, 1.7, { color: 'orange', r: 8, label: 'B', labelPos: 'ne', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(2.15 * x) / r, (2.15 * y) / r]; } });
        hd.onDrag = () => thS.set(M.clamp(Math.round((Math.abs(Math.atan2(hd.x, hd.y)) * 180) / Math.PI), 0, 180));
        const rg = v.rng(21), U1 = new Float64Array(NP), U2 = new Float64Array(NP), G1 = new Float64Array(NP), G2 = new Float64Array(NP);
        for (let k = 0; k < NP; k++) { U1[k] = rg(); U2[k] = rg(); G1[k] = rg.normal(); G2[k] = rg.normal(); }
        let st = null;
        v.animate((t) => {
          const kind = model.value, pre = src.value === 'up', th = (thS.value * Math.PI) / 180, e = [Math.sin(th), Math.cos(th)], sg = 0.09;
          hd.set(2.15 * e[0], 2.15 * e[1]);
          const N = M.clamp(Math.floor((NP * t) / T), 0, NP), c2 = Math.cos(th / 2) ** 2, s2 = Math.sin(th / 2) ** 2;
          const spots = kind === 'half' ? [[1, pre ? c2 : 0.5], [-1, pre ? s2 : 0.5]] : kind === 'one' ? [[1, pre ? c2 * c2 : 1 / 3], [0, pre ? 2 * s2 * c2 : 1 / 3], [-1, pre ? s2 * s2 : 1 / 3]] : null;
          const pts = [], proj = [], tally = spots ? spots.map(() => 0) : null; let stray = 0, mid = 0;
          for (let k = 0; k < N; k++) {
            let mu;
            if (kind === 'cl') mu = pre ? Math.cos(th) : 2 * U2[k] - 1;
            else { let acc = 0, idx = spots.length - 1; for (let q = 0; q < spots.length; q++) { acc += spots[q][1]; if (U1[k] < acc) { idx = q; break; } } mu = spots[idx][0]; }
            const x = mu * e[0] + sg * G1[k], y = mu * e[1] + sg * G2[k], s = x * e[0] + y * e[1];
            pts.push([x, y]); proj.push(s);
            if (spots) { let bi = 0, bd = 9; spots.forEach(([m0], q) => { if (Math.abs(s - m0) < bd) { bd = Math.abs(s - m0); bi = q; } }); if (bd < 0.4) tally[bi]++; else stray++; } else if (Math.abs(s) < 0.85) mid++;
          }
          // screen
          sA.rect(-2.3, -2.3, 2.3, 2.3, { color: 'faint', width: 1.2 });
          sA.line(-2.3 * e[0], -2.3 * e[1], 2.3 * e[0], 2.3 * e[1], { color: 'orange', width: 1, alpha: 0.5, dash: [4, 4] });
          if (spots) spots.forEach(([m0]) => sA.dot(m0 * e[0], m0 * e[1], { r: 11, hollow: true, color: 'green' }));
          else sA.segment([-e[0], -e[1]], [e[0], e[1]], { color: 'green', width: 5, alpha: 0.25 });
          sA.dots(pts.slice(0, Math.max(0, N - 25)), { r: 2.2, color: 'accent', alpha: 0.5 });
          sA.dots(pts.slice(Math.max(0, N - 25)), { r: 3, color: 'gold' });
          // histogram
          const hs = M.histogram(proj, { bins: 54, range: [-1.8, 1.8] }), cmax = Math.max(8, ...hs.counts);
          sB.setView([-1.8, 1.8], [0, cmax * 1.18]);
          if (N > 1) sB.hist({ edges: hs.edges, counts: hs.counts }, { color: 'accent', fillAlpha: 0.4 });
          if (spots) spots.forEach(([m0, p]) => { sB.vline(m0, { color: 'green', width: 1.2, dash: [4, 3] }); sB.text(`P = ${(100 * p).toFixed(1)} %`, m0, cmax * 1.1, { size: 11, color: 'green', align: 'center' }); });
          else { sB.vline(-1, { color: 'green', width: 1, dash: [4, 3] }); sB.vline(1, { color: 'green', width: 1, dash: [4, 3] }); sB.text(pre ? 'classical beam: one spot at cos ϑ' : 'classical: all deflections between −1 and +1', 0, cmax * 1.1, { size: 11, color: 'green', align: 'center' }); }
          st = { kind, pre, th, N, spots, tally, stray, mid };
        }, { period: T, still: 6.5 });
        v.legend([['accent', 'detected atoms', { dot: true }], ['gold', 'latest hits', { dot: true }], ['green', 'allowed deflections / predicted $P$', { dash: true }], ['orange', 'field axis']]);
        v.readout(() => {
          if (!st || !st.N) return 'Atoms are arriving…';
          const { kind, spots, tally, N } = st;
          if (kind === 'cl') return `${N} atoms · classical moments: deflection ${st.pre ? `$\\cos\\vartheta=${v.fix(Math.cos(st.th), 3)}$, one spot` : 'spread continuously'}; ${v.fix((100 * st.mid) / N, 0)} % of the atoms land strictly between the extreme positions $\\pm0.85$. No theory of classical moments gives separated spots.`;
          const nz = tally.filter((c) => c > 0.01 * N).length;
          return `${N} atoms · ` + spots.map(([m0, p], q) => `$m_s=${m0 === 1 ? (kind === 'half' ? '+\\tfrac12' : '+1') : m0 === 0 ? '0' : kind === 'half' ? '-\\tfrac12' : '-1'}$: ${v.fix((100 * tally[q]) / N, 1)} % (predicted ${v.fix(100 * p, 1)} %)`).join(', ') + ` · stray hits ${st.stray} · **${nz} spot${nz === 1 ? '' : 's'}**` + (kind === 'half' ? ` — for every tilt, still two.` : ` — three, which spin ½ would never give.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Phenomenon',
      name: 'Spin–orbit coupling and fine structure',
      credit: 'Sommerfeld, 1916; Dirac, 1928',
      statement: String.raw`An electron moving in the electric field of the nucleus sees a magnetic field proportional to its orbital angular momentum; it couples to the spin moment, adding to the Hamiltonian
$$\hat H_{SO}=\xi(r)\,\hat{\vec L}\cdot\hat{\vec S},\qquad \hat{\vec L}\cdot\hat{\vec S}=\tfrac12\big[\hat J^2-\hat L^2-\hat S^2\big]$$
with $\hat{\vec J}=\hat{\vec L}+\hat{\vec S}$. Levels with $l\ge1$ split into $j=l\pm\tfrac12$; for hydrogen-like atoms
$$E_{nj}\approx-\frac{Z^2}{2n^2}\Big[1+\frac{(Z\alpha)^2}{n^2}\Big(\frac{n}{j+\frac12}-\frac34\Big)\Big]\ \text{hartree},\qquad \Delta E_{\rm fs}(np)\approx\frac{\alpha^2Z^4\,\mathrm{Ry}}{2n^3},$$
so the splitting grows as $Z^4$ ($\alpha\approx1/137$ is the fine-structure constant). The exact Dirac energy is $E_{nj}=mc^2\big[1+(Z\alpha)^2/(n-\delta)^2\big]^{-1/2}-mc^2$ with $\delta=j+\frac12-\sqrt{(j+\frac12)^2-(Z\alpha)^2}$; it depends on $n$ and $j$ only, so $2\mathrm s_{1/2}$ and $2\mathrm p_{1/2}$ coincide (until QED's Lamb shift).`,
      scope: String.raw`Hydrogen-like ions with a point nucleus. In a many-electron atom the valence electron is screened (3.4), so the splittings follow $Z_{\rm eff}^4$ of the valence shell rather than $Z^4$ of the nucleus, but still reach chemically relevant sizes for the heavy elements (3.12).`,
      idea: String.raw`In the electron's rest frame the moving nucleus produces a magnetic field $\vec B\propto\vec L/r^3$, and the spin moment of 2.7 has energy $-\vec\mu\cdot\vec B\propto\vec L\cdot\vec S$ (with a factor $\tfrac12$ from Thomas precession). Since $\vec L\cdot\vec S$ commutes with $\hat J^2$ but not with $\hat L_z$ or $\hat S_z$, $j$ rather than $m_l,m_s$ labels the states. The expectation value $\langle r^{-3}\rangle\propto Z^3/n^3$ and the strength of the field $\propto Z$ together give $Z^4$; the numerical factor follows from $\langle L\cdot S\rangle=\tfrac12[j(j+1)-l(l+1)-\tfrac34]$.`,
      caption: String.raw`Left: the levels of one shell of a hydrogen-like ion with nuclear charge $Z$ (set by the slider) as the *shift from the non-relativistic energy*, computed from the exact Dirac formula; the two $j$ values of each $l$ are side by side, and the $2$s$_{1/2}$/$2$p$_{1/2}$ coincidence is visible. Middle: the $\mathrm{p}_{3/2}-\mathrm{p}_{1/2}$ splitting on log–log axes against the $\alpha^2Z^4$ law (dashed) — slope 4 until relativity bends it — with the green band marking bond energies. Right: the vector model: $\vec L$ and $\vec S$ combine into $\vec J$ either nearly parallel ($j=\tfrac32$, $\vec L\cdot\vec S=+\tfrac12\hbar^2$, higher) or nearly opposite ($j=\tfrac12$, $-\hbar^2$, lower).`,
      deps: ['qchem-2.7', 'qchem-2.3', 'qm-11.9'],
      refs: ['McQuarrie ch. 9'],
      tags: ['fine structure', 'spin–orbit coupling', 'Dirac equation'],
      viz(v) {
        const M = v.M, C = M.CONST, al = C.alpha, mc2 = (C.me * C.c * C.c) / C.eV;
        const Zs = v.slider('nuclear charge $Z$', 1, 92, 10, { int: true });
        const nS = v.select('shell', [2, 3, 4].map((n) => ({ value: String(n), label: `$n=${n}$` })), '2');
        const Ed = (n, j, Z) => { const za = Z * al, k = j + 0.5, d = k - Math.sqrt(k * k - za * za); return mc2 * (1 / Math.sqrt(1 + (za / (n - d)) ** 2) - 1); };
        const En = (n, Z) => -RY_EV * Z * Z / (n * n);
        const fs = (n, Z) => Ed(n, 1.5, Z) - Ed(n, 0.5, Z);
        const lead = (n, Z) => (al * al * Z ** 4 * RY_EV) / (2 * n ** 3);
        const sA = v.stage({ x: [-0.6, 3.6], y: [-1, 1], height: 340, axes: 'box', gutter: true, weight: 1, xticks: [[0, 's'], [1, 'p'], [2, 'd'], [3, 'f']], ylabel: 'E − E(NR) (eV)', title: 'levels of the shell: Dirac shift' });
        const sB = v.stage({ x: [1, 100], y: [1e-7, 1e5], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'nuclear charge Z', ylabel: 'p₃/₂ − p₁/₂ (eV)', title: 'fine-structure splitting against $Z$' });
        const sV = v.stage({ x: [-3.5, 3.5], y: [-1.75, 1.6], equal: true, height: 340, axes: false, weight: 0.9, title: 'vector model for $l=1$, $s=\\tfrac12$' });
        let st = null;
        v.render(() => {
          const Z = Zs.value, n = +nS.value;
          // panel A: levels (l, j)
          const levels = []; for (let l = 0; l < n; l++) for (const j2 of l === 0 ? [1] : [2 * l - 1, 2 * l + 1]) levels.push({ l, j: j2 / 2, d: Ed(n, j2 / 2, Z) - En(n, Z) });
          let lo = Math.min(...levels.map((q) => q.d)), hi = Math.max(...levels.map((q) => q.d)); const pad = 0.3 * (hi - lo || 1);
          sA.setView([-0.6, 3.6], [lo - pad, hi + pad]);
          levels.forEach((q) => {
            const dx = q.l === 0 ? 0 : q.j > q.l ? 0.19 : -0.19, w = q.l === 0 ? 0.3 : 0.17;
            sA.line(q.l + dx - w, q.d, q.l + dx + w, q.d, { color: q.j > q.l ? 'orange' : 'accent', width: 3.5 });
            sA.tex(`${n}\\mathrm{${LETTER[q.l]}}_{${half(Math.round(2 * q.j))}}`, q.l + dx, q.d, { size: 12, color: q.j > q.l ? 'orange' : 'accent', dy: q.j > q.l ? -13 : 13 });
          });
          // panel B
          sB.fn((z) => fs(n, z), { color: 'accent', width: 2.6, n: 300 });
          sB.fn((z) => lead(n, z), { color: 'orange', width: 1.8, dash: [6, 4], n: 300 });
          sB.hband(0.1, 10, { color: 'green', alpha: 0.12 }); sB.text('bond energies', 1.15, 3, { size: 11, color: 'green', align: 'left', baseline: 'middle' });
          sB.dot(Z, fs(n, Z), { r: 7, color: 'gold' });
          // panel C
          const l = Math.SQRT2, s = Math.sqrt(0.75);
          [[1.5, -1.9], [0.5, 1.9]].forEach(([j, cx]) => {
            const J = Math.sqrt(j * (j + 1)), tL = Math.acos((J * J + l * l - s * s) / (2 * J * l)), tS = Math.acos((J * J + s * s - l * l) / (2 * J * s)), cy = -0.55;
            const Lp = [cx - l * Math.sin(tL), cy + l * Math.cos(tL)], Sp = [cx + s * Math.sin(tS), cy + s * Math.cos(tS)];
            sV.arrow(cx, cy, Lp[0], Lp[1], { color: 'accent', width: 3 }); sV.arrow(cx, cy, Sp[0], Sp[1], { color: 'green', width: 3 });
            sV.arrow(cx, cy, cx, cy + J, { color: 'orange', width: 3.5 }); sV.line(Lp[0], Lp[1], cx, cy + J, { color: 'faint', dash: [3, 3] }); sV.line(Sp[0], Sp[1], cx, cy + J, { color: 'faint', dash: [3, 3] });
            sV.tex('\\vec L', Lp[0] - 0.12, Lp[1] + 0.12, { color: 'accent', size: 14 }); sV.tex('\\vec S', Sp[0] + 0.15, Sp[1] + 0.08, { color: 'green', size: 14 }); sV.tex('\\vec J', cx + 0.2, cy + J + 0.12, { color: 'orange', size: 14 });
            sV.text(`j = ${j === 1.5 ? '3/2' : '1/2'}`, cx, cy - 0.4, { size: 13, color: 'ink', align: 'center', math: true });
            sV.text(`L·S = ${j === 1.5 ? '+½' : '−1'} ħ²`, cx, cy - 0.78, { size: 12, color: 'ink', align: 'center' });
            sV.text(`angle(L, S) = ${v.fix(180 * Math.acos((J * J - l * l - s * s) / (2 * l * s)) / Math.PI, 1)}°`, cx, cy - 1.12, { size: 11, color: 'muted', align: 'center' });
          });
          st = { Z, n, ex: fs(n, Z), ld: lead(n, Z), E: Ed(n, 0.5, Z) - En(n, Z) };
        });
        v.legend([['accent', '$j=l-\\tfrac12$'], ['orange', '$j=l+\\tfrac12$'], ['ink', 'exact Dirac vs $\\alpha^2Z^4$ (dashed)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const ghz = (e) => (e * C.eV) / C.h / 1e9, cm = (e) => (e * C.eV) / (C.h * C.c * 100);
          return `$Z=${st.Z}$, $n=${st.n}$: $\\mathrm{p}_{3/2}-\\mathrm{p}_{1/2}$ splitting (Dirac) $=${v.sci(st.ex, 4)}$ eV $=${v.fix(cm(st.ex), 3)}$ cm$^{-1}$ $=${v.fix(ghz(st.ex), 2)}$ GHz; leading law $\\alpha^2Z^4\\mathrm{Ry}/2n^3=${v.sci(st.ld, 4)}$ eV (ratio ${v.fix(st.ex / st.ld, 4)}). Bare-nucleus ion: ` + (st.Z === 1 && st.n === 2 ? 'for hydrogen 2p this is the measured fine structure ≈ 10.97 GHz (recalled value; the Lamb shift of 2s, about 1.06 GHz, is not in the Dirac formula).' : st.ex > 0.1 ? 'the splitting is now of the size of chemical bond energies (0.1–10 eV).' : `a factor $10^{${Math.round(Math.log10(0.1 / st.ex))}}$ below bond energies.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Model',
      name: 'Hydrogen-like ions and Z scaling',
      statement: String.raw`Replacing the proton by a nucleus of charge $+Ze$ (with a single electron left: He$^+$, Li$^{2+}$, …) changes the potential from $-1/r$ to $-Z/r$ and the whole problem is rescaled: in atomic units
$$\psi_{nlm}^{(Z)}(\vec r)=Z^{3/2}\,\psi_{nlm}^{(1)}(Z\vec r),\qquad E_n^{(Z)}=Z^2E_n^{(1)}=-\frac{Z^2}{2n^2},\qquad \langle r\rangle_{nl}^{(Z)}=\frac1Z\langle r\rangle_{nl}^{(1)}.$$
Orbitals shrink as $1/Z$, energies deepen as $Z^2$: the ionization energy of the one-electron ion is $Z^2\times13.606$ eV (He$^+$: $54.4$ eV). The scaling is exact for the non-relativistic problem with infinite nuclear mass; relativistic corrections (2.8) and the reduced mass make the measured values deviate by parts in $10^3$ and more as $Z$ grows.`,
      idea: String.raw`Substitute $\vec r=\vec\rho/Z$ in $-\tfrac12\nabla^2-Z/r$: the Laplacian scales as $Z^2$ and the potential as $Z$, so $\hat H^{(Z)}=Z^2\big[-\tfrac12\nabla_\rho^2-1/\rho\big]$, the hydrogen Hamiltonian in the scaled variable $\rho=Zr$ times $Z^2$. Eigenfunctions are therefore the hydrogen ones evaluated at $\rho$ (with $Z^{3/2}$ for normalization) and eigenvalues are multiplied by $Z^2$ (2.1, 2.2). This is the dimensional-analysis root of the periodic trend that inner electrons of heavy atoms are tightly bound and compact, and is the zeroth approximation for the helium atom (3.3).`,
      caption: String.raw`Slide **$Z$** from 1 to 10 and choose an orbital. Left: $P(r)=r^2R^2$ against $r$ in units of $a_0$ (dashed: hydrogen): the cloud shrinks as $1/Z$. Switch on **scaled axes**: plotting $P/Z$ against $Zr$ makes every ion lie exactly on the hydrogen curve (the readout gives the largest difference). Middle: the ladder of levels deepening as $Z^2$. Right: the ionization energy of the one-electron ion against $Z$ on log–log axes: the $Z^2$ parabola has slope 2, and the gold points are measured values for $Z=1$–$6$ (recalled from tables, not re-measured).`,
      deps: ['qchem-2.2'],
      refs: ['McQuarrie ch. 7'],
      tags: ['hydrogen-like ions', 'scaling', 'ionization energy'],
      viz(v) {
        const M = v.M;
        const ION = ['H', 'He⁺', 'Li²⁺', 'Be³⁺', 'B⁴⁺', 'C⁵⁺', 'N⁶⁺', 'O⁷⁺', 'F⁸⁺', 'Ne⁹⁺'];
        const MEAS = [13.598434, 54.417765, 122.45429, 217.71865, 340.2258, 489.99334]; // eV, recalled NIST values
        const ORB = { '1s': [1, 0], '2s': [2, 0], '2p': [2, 1], '3d': [3, 2] };
        const Zs = v.slider('nuclear charge $Z$', 1, 10, 2, { int: true });
        const orb = v.select('orbital', Object.keys(ORB).map((k) => ({ value: k, label: k })), '1s');
        const scl = v.toggle('scaled axes ($Zr$ and $P/Z$)', false);
        const sP = v.stage({ x: [0, 8], y: [0, 1], height: 330, axes: 'box', gutter: true, weight: 1.1, xlabel: 'r / a₀', ylabel: 'P(r)', title: 'radial distribution' });
        const sE = v.stage({ x: [0, 5], y: [-14, 0.5], height: 330, axes: 'box', gutter: true, weight: 0.8, xticks: [], ylabel: 'E (eV)', title: 'levels $E_n=-13.606\\,Z^2/n^2$' });
        const sI = v.stage({ x: [0.8, 12], y: [8, 2000], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, weight: 0.9, xlabel: 'Z', ylabel: 'ionization energy (eV)', title: 'one-electron ions' });
        let st = null;
        v.render(() => {
          const Z = Zs.value, [n, l] = ORB[orb.value], ext = 1.7 * n * n + 3, P = (r, z) => r * r * Rnl(n, l, r, z) ** 2;
          // scaled view plots P_Z(ρ/Z)/Z against ρ = Zr
          const curve = scl.value ? (r) => P(r / Z, Z) / Z : (r) => P(r, Z);
          let ymax = 0; for (let i = 1; i <= 400; i++) { const r = (ext * i) / 400; ymax = Math.max(ymax, P(r, 1), curve(r)); }
          sP.setView([0, ext], [0, ymax * 1.1]); sP.setLabels(scl.value ? 'Z r / a₀' : 'r / a₀', scl.value ? 'P(r/Z)/Z' : 'P(r)');
          sP.fn((r) => P(r, 1), { color: 'muted', width: 1.6, dash: [6, 4], n: 400 });
          sP.fn(curve, { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.1, n: 500 });
          let dmax = 0; for (let i = 1; i <= 400; i++) { const r = (ext * i) / 400; dmax = Math.max(dmax, Math.abs(P(r / Z, Z) / Z - P(r, 1))); }
          // mean radius
          const mean = M.integrate((r) => r * P(r, Z), 0, (ext * 3) / Z, 3000);
          // ladder
          const top = RY_EV * Z * Z; sE.setView([0, 5], [-1.1 * top, 0.06 * top]);
          for (let m = 1; m <= 4; m++) { const e = -top / (m * m); sE.line(0.4, e, 3.2, e, { color: m === n ? 'accent' : 'ink', width: m === n ? 3 : 2 }); sE.text(`n = ${m}`, 3.35, e, { size: 11, color: 'muted', align: 'left', baseline: 'middle' }); }
          sE.arrow(1.8, -top, 1.8, 0, { color: 'orange', width: 2, head: 8 }); sE.text(`${ION[Z - 1]}: ${v.fix(top, 1)} eV`, 4.9, -0.5 * top, { size: 11, color: 'orange', align: 'right' });
          // IE vs Z
          sI.fn((z) => RY_EV * z * z, { color: 'accent', width: 2.4, n: 100 });
          MEAS.forEach((e, i) => sI.dot(i + 1, e, { r: 5, color: 'gold' }));
          sI.dot(Z, RY_EV * Z * Z, { r: 8, hollow: true, color: 'orange' });
          st = { Z, n, l, mean, dmax, ie: RY_EV * Z * Z, meas: Z <= 6 ? MEAS[Z - 1] : null, o: orb.value };
        });
        v.legend([['accent', '$Z$ ion'], ['muted', 'hydrogen ($Z=1$)', { dash: true }], ['gold', 'measured', { dot: true }]]);
        v.readout(() => st && `**${ION[st.Z - 1]}** ($Z=${st.Z}$), orbital ${st.o}: $\\langle r\\rangle=${v.fix(st.mean, 4)}\\,a_0$ (hydrogen value ${v.fix(0.5 * (3 * st.n * st.n - st.l * (st.l + 1)), 3)}, divided by $Z$: ${v.fix((0.5 * (3 * st.n * st.n - st.l * (st.l + 1))) / st.Z, 4)}) = ${v.fix((st.mean * A0_PM), 1)} pm. Ionization energy $Z^2\\cdot13.606=${v.fix(st.ie, 2)}$ eV` + (st.meas ? `; measured ${v.fix(st.meas, 2)} eV (difference ${v.fix((100 * (st.ie - st.meas)) / st.meas, 3)} %: reduced mass lowers it, relativity raises it)` : '; no measured value tabulated here') + `. Maximum of $|P_Z(r/Z)/Z-P_1(r)|$ over $r$ (scaling law): $${v.sci(Math.max(st.dmax, 1e-16), 1)}$.`);
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Zeeman effect',
      credit: 'Zeeman, 1896; Preston, 1898; Paschen & Back, 1912',
      statement: String.raw`In a magnetic field $B$ along $z$ an atom acquires the energy $\hat H_Z=\mu_B B\,(\hat L_z+g_s\hat S_z)/\hbar$ with $\mu_B=e\hbar/2m_e$ and $g_s\approx2$. Neglecting spin, a level with orbital quantum number $l$ splits into $2l+1$ equally spaced sublevels $E=m\mu_BB$, and a line between $l=1$ and $l=0$ splits into the **normal Zeeman triplet** with spacing $\mu_BB$ ($\Delta m=0,\pm1$). With spin and weak fields ($\mu_BB\ll$ fine-structure splitting) each $j$ level splits as $E=g_Jm_J\mu_BB$ with the Landé factor
$$g_J=1+\frac{J(J+1)+S(S+1)-L(L+1)}{2J(J+1)},$$
giving the **anomalous Zeeman** patterns (e.g. 6 and 4 components for the sodium D$_2$ and D$_1$ lines); in strong fields ($\mu_BB\gg$ fine structure; Paschen–Back regime) $L$ and $S$ decouple, $E=\mu_BB(m_l+2m_s)$, and the normal triplet returns.`,
      scope: String.raw`Linear Zeeman regime (diamagnetic $\propto B^2$ terms neglected); electric-dipole transitions with polarization selection rules $\Delta m_J=0$ ($\pi$) and $\pm1$ ($\sigma$). The simulation diagonalizes the exact $2\mathrm p$ Hamiltonian $\zeta\,\hat{\vec L}\!\cdot\!\hat{\vec S}+\mu_BB(\hat L_z+2\hat S_z)$ for a transition to the $2$s level (one-electron model).`,
      idea: String.raw`The field couples to $\hat L_z$ with $g=1$ and to $\hat S_z$ with $g=2$, so the magnetic moment is *not* parallel to $\vec J$; in the weak-field limit only its projection on $\vec J$ matters, which produces the Landé factor and different splittings for different $j$ (2.8). In a strong field $\hat H_Z$ dominates, $m_l$ and $m_s$ become good quantum numbers, and every line is displaced by $(m_l+2m_s)-2m_s'=\Delta m_l$ units of $\mu_BB$: the triplet. The $m_J$ quantum number is conserved at all fields, so levels of equal $m_J$ repel (avoided crossings) while those of different $m_J$ cross freely.`,
      caption: String.raw`Raise the **magnetic field**. Left: the $2$p sublevels (colour = $m_J$) and the $2$s levels (purple) as a function of $B$; the vertical gold line is the current field. Right: the resulting spectrum of the $2\mathrm p\to2\mathrm s$ line: stick height = relative intensity, blue = $\sigma$ (Δm = ±1) and red = $\pi$ light. Turn **electron spin off** to see the normal triplet (3 lines at $0,\pm\mu_BB$). With spin on, weak field gives the anomalous 10-line pattern and strong field returns to a triplet with fine structure. The spin–orbit constant is that of hydrogen $2$p ($\zeta=\alpha^2\,\mathrm{Ha}/48$, i.e. $\Delta E_{\rm fs}=3\zeta/2=4.5\times10^{-5}$ eV, so $B\sim1$ T is already intermediate); scale it with the slider.`,
      deps: ['qchem-2.3', 'qchem-2.7', 'qm-11.14'],
      refs: ['McQuarrie ch. 9'],
      tags: ['Zeeman effect', 'Landé factor', 'Paschen–Back effect'],
      viz(v) {
        const M = v.M, C = M.CONST, muB = C.muB / C.eV * 1e5, zeta0 = (C.alpha * C.alpha * HARTREE_EV * 1e5) / 48; // units of 1e-5 eV
        const spin = v.toggle('include electron spin', true);
        const BS = v.slider('magnetic field $B$ (T)', 0, 4, 0.8, { step: 0.01 });
        const kS = v.slider('spin–orbit strength (× hydrogen 2p)', 0.1, 10, 1, { log: true, sig: 2 });
        const sF = v.stage({ x: [0, 4], y: [-55, 55], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'B (T)', ylabel: 'energy (10⁻⁵ eV)', title: 'sublevels against field' });
        const sS = v.stage({ x: [-80, 80], y: [0, 1.15], height: 340, axes: 'box', gutter: true, weight: 1.2, xlabel: 'line position (10⁻⁵ eV)', ylabel: 'intensity', title: 'the 2p → 2s line' });
        const mjCol = { '1.5': 'red', '0.5': 'orange', '-0.5': 'green', '-1.5': 'accent', '1': 'red', '0': 'green', '-1': 'accent' };
        const levels = (B, zeta, sp) => {
          const out = [];
          if (!sp) { for (const ml of [1, 0, -1]) out.push({ E: ml * muB * B, mj: ml, c: { [`${ml},0`]: 1 } }); return out; }
          for (const mj of [1.5, 0.5, -0.5, -1.5]) {
            const basis = []; for (const ml of [1, 0, -1]) for (const ms of [0.5, -0.5]) if (Math.abs(ml + ms - mj) < 1e-9) basis.push([ml, ms]);
            const diag = basis.map(([ml, ms]) => zeta * ml * ms + muB * B * (ml + 2 * ms));
            if (basis.length === 1) { out.push({ E: diag[0], mj, c: { [basis[0].join(',')]: 1 } }); continue; }
            const a = diag[0], b = diag[1];
            const A = basis[0][1] > 0 ? 0 : 1, up = basis[A], cpl = (zeta / 2) * Math.sqrt(2 - up[0] * (up[0] + 1)), mean = (a + b) / 2, d = (a - b) / 2, rr = Math.hypot(d, cpl);
            for (const sgn of [-1, 1]) {
              const E = mean + sgn * rr; let x = cpl, y = E - a; // (a−E)x + cpl y = 0 → x = cpl, y = E − a
              if (Math.abs(x) + Math.abs(y) < 1e-12) { x = 1; y = 0; } const nrm = Math.hypot(x, y);
              out.push({ E, mj, c: { [basis[0].join(',')]: (x / nrm) ** 2, [basis[1].join(',')]: (y / nrm) ** 2 } });
            }
          }
          return out;
        };
        let st = null;
        v.render(() => {
          const sp = spin.value, B = BS.value, zeta = kS.value * zeta0;
          // fan diagram
          const NB = 80;
          const series = {}; for (let i = 0; i <= NB; i++) { const b = (4 * i) / NB; levels(b, zeta, sp).forEach((q, k) => { (series[k] ||= { mj: q.mj, pts: [] }).pts.push([b, q.E]); }); }
          Object.values(series).forEach((s) => sF.path(s.pts, { color: mjCol[String(s.mj)], width: 2.2 }));
          if (sp) { sF.line(0, 0, 4, muB * 4, { color: 'purple', width: 2.2, dash: [6, 4] }); sF.line(0, 0, 4, -muB * 4, { color: 'purple', width: 2.2, dash: [6, 4] }); sF.text('2s', 3.85, muB * 4 + 3, { size: 11, color: 'purple', align: 'right' }); }
          else sF.line(0, 0, 4, 0, { color: 'purple', width: 2.2, dash: [6, 4] });
          sF.vline(B, { color: 'gold', width: 2 });
          // spectrum
          const lv = levels(B, zeta, sp), lines = [];
          if (!sp) lv.forEach((q) => lines.push({ x: q.E, pi: q.mj === 0 ? 1 : 0, sg: q.mj === 0 ? 0 : 1 }));
          else lv.forEach((q) => { for (const ms of [0.5, -0.5]) { const pi = q.c[`0,${ms}`] || 0, sg = (q.c[`1,${ms}`] || 0) + (q.c[`-1,${ms}`] || 0); if (pi + sg > 1e-9) lines.push({ x: q.E - 2 * ms * muB * B, pi, sg }); } });
          const xm = Math.max(14, 1.3 * Math.max(...lines.map((q) => Math.abs(q.x)))); sS.setView([-xm, xm], [0, 1.15]);
          lines.forEach((q) => { const h = q.pi + q.sg; sS.line(q.x, 0, q.x, q.sg, { color: 'accent', width: 3.5 }); sS.line(q.x, q.sg, q.x, h, { color: 'red', width: 3.5 }); });
          if (!sp) sS.text('normal triplet', 0, 1.1, { size: 11, color: 'muted', align: 'center' });
          // Landé check
          let dev = 0; if (sp) {
            const g = { 1.5: 4 / 3, 0.5: 2 / 3 }, E0 = { 1.5: zeta / 2, 0.5: -zeta };
            const byMj = {}; lv.forEach((q) => (byMj[q.mj] ||= []).push(q.E));
            Object.entries(byMj).forEach(([mj, es]) => { es.sort((a, b) => a - b); const m = +mj; if (es.length === 1) { const j = Math.abs(m) === 1.5 ? 1.5 : 0.5; dev = Math.max(dev, Math.abs(es[0] - (E0[j] + g[j] * m * muB * B))); } else { dev = Math.max(dev, Math.abs(es[0] - (E0[0.5] + g[0.5] * m * muB * B)), Math.abs(es[1] - (E0[1.5] + g[1.5] * m * muB * B))); } });
          }
          const nl = lines.filter((q) => q.pi + q.sg > 0.005).length;
          st = { sp, B, nl, dev, mB: muB * B, zeta, ratio: (muB * B) / ((1.5 * zeta) || 1) };
        });
        v.legend([['red', '$m_J=\\tfrac32$ / $m_l=1$'], ['orange', '$\\tfrac12$'], ['green', '$-\\tfrac12$ / $0$'], ['accent', '$-\\tfrac32$ / $-1$'], ['purple', '2s', { dash: true }]]);
        v.readout(() => st && `$B=${v.fix(st.B, 2)}$ T: $\\mu_BB=${v.fix(st.mB, 2)}\\times10^{-5}$ eV (${v.fix(st.mB * 1e-5 * C.eV / (C.h * 1e9), 2)} GHz) → **${st.nl} lines**` + (st.sp ? `; spin–orbit gap $3\\zeta/2=${v.fix(1.5 * st.zeta, 2)}\\times10^{-5}$ eV, so $\\mu_BB/\\Delta E_{\\rm fs}=${v.fix(st.ratio, 2)}$ (${st.ratio < 0.15 ? 'weak field: Landé regime, anomalous pattern' : st.ratio > 2 ? 'strong field: Paschen–Back, triplet again' : 'intermediate'}). Largest deviation of the exact 2p levels from the Landé formula $g_Jm_J\\mu_BB$ ($g=\\tfrac43,\\tfrac23$): $${v.fix(st.dev, 3)}\\times10^{-5}$ eV.` : '; without spin every sublevel is at $m\\mu_BB$ and the line splits into the three components $\\Delta m=0,\\pm1$ — the normal Zeeman effect.'));
      },
    },
  ],
};
