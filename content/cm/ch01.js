// Condensed Matter Physics — Chapter 1: Electrons in a periodic potential (items 1.1–1.6; 1.7–1.11 in ch01-b.js)
// Units of the 1D crystal models: k in π/a, energies in E₁ = ħ²π²/(2ma²) (see ch01.shared.js).
import { TAU, bandColor, BAND_COL, nfeSolve, nfeBands, nfePotential, blochAt, extK, kpBands, ringStates, lin } from './ch01.shared.js';

/** Free-electron densities n (10²² cm⁻³) of some metals, as tabulated by Ashcroft & Mermin (Table 2.1). */
const METALS = { Li: 4.70, Na: 2.65, K: 1.40, Cu: 8.47, Ag: 5.86, Au: 5.90, Al: 18.1 };

/** Integer lattice points n ∈ Z^d with |n| ≤ R, sorted by |n|² (stable). */
const SHELL_CACHE = {};
function shellStates(d, R) {
  const key = d + ':' + R; if (SHELL_CACHE[key]) return SHELL_CACHE[key];
  const out = [], r2 = R * R;
  if (d === 1) for (let a = -R; a <= R; a++) out.push([a, 0, 0, a * a]);
  else if (d === 2) { for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) if (a * a + b * b <= r2) out.push([a, b, 0, a * a + b * b]); }
  else for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (let c = -R; c <= R; c++) if (a * a + b * b + c * c <= r2) out.push([a, b, c, a * a + b * b + c * c]);
  out.sort((p, q) => p[3] - q[3] || Math.abs(q[0]) - Math.abs(p[0]) || q[1] - p[1]);
  return (SHELL_CACHE[key] = out);
}

export default {
  collection: 'cm',
  chapter: 1,
  title: 'Electrons in a periodic potential',
  summary: String.raw`Sommerfeld’s free electrons fill a Fermi sphere; put them in a crystal and, by Bloch’s theorem (from quantum mechanics), the states are labelled by a crystal momentum in the Brillouin zone and a band index. A weak periodic potential opens gaps where free-electron energies meet Bragg planes, tight binding builds bands from atomic orbitals, and counting two states per cell per band sorts metals from insulators. The same machinery gives Fermi surfaces, van Hove singularities, Dirac cones in graphene, localized Wannier orbitals, topological edge states and, with disorder, Anderson localization.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Model',
      name: 'Sommerfeld model: the Fermi sphere of a metal',
      credit: 'Sommerfeld, 1928',
      statement: String.raw`Treat the conduction electrons of a metal as non-interacting fermions of mass $m$ and density $n$ in a box of side $L$ with periodic boundary conditions and no lattice. The allowed wave vectors are $\mathbf k=\tfrac{2\pi}{L}(n_1,\dots,n_d)$ with integers $n_i$, one per volume $(2\pi/L)^d$ of $k$-space, with energy $E=\hbar^2k^2/2m$ and room for two electrons (spin up and down) each. The ground state fills every $k$ below a **Fermi surface**, a sphere of radius $k_F$ in three dimensions:
$$n=\frac{k_F^3}{3\pi^2},\qquad E_F=\frac{\hbar^2k_F^2}{2m},\qquad v_F=\frac{\hbar k_F}{m},\qquad g(E)\propto E^{(d-2)/2}\ \ (d=1,2,3).$$
Only electrons within $\sim k_BT$ of $E_F$ matter for thermal and transport properties, and $E_F$ is several eV ($T_F\sim10^4$–$10^5$ K) for ordinary metals.`,
      idea: String.raw`Periodic boundary conditions make $e^{i\mathbf k\cdot\mathbf r}$ single-valued only for the grid of $\mathbf k$ above, so counting states is counting grid points; by the Pauli principle (qm-8.1) each grid point holds two electrons, and the ground state packs the lowest ones into the ball $|\mathbf k|<k_F$ whose volume holds $N/2$ points. The number of states below $E$ grows like $E^{d/2}$, so its derivative $g(E)\propto E^{(d-2)/2}$ is flat in 2D, falls as $E^{-1/2}$ in 1D and rises as $E^{1/2}$ in 3D. Because $E_F\gg k_BT$ the Fermi–Dirac step (thermo-8.4, thermo-8.9) is nearly sharp, which repairs Drude’s classical heat capacity (em-6.4).`,
      caption: String.raw`**Left:** the allowed $\mathbf k$ points of the box (a $k_z=0$ slice in 3D). Drag **electrons $N$**: the lowest $N/2$ points light up and the filled region rounds into a disc; the green circle is the radius $k_F$ predicted from the density. **Right:** the density of states counted from the grid (bars) against the law $E^{(d-2)/2}$ (curve), shaded up to $E_F$. Change the **dimension** to see the power law change. Pick a **metal** to read out $k_F$, $E_F$ and $v_F$ from its electron density.`,
      scope: String.raw`Good for the conduction electrons of simple metals (alkalis, Al): non-interacting electrons in a uniform background. It ignores the lattice potential and electron–electron interactions.`,
      deps: ['thermo-8.9', 'em-6.4', 'qm-8.1'],
      refs: ['Ashcroft–Mermin ch. 2', 'Kittel ch. 6'],
      tags: ['fermi sphere', 'free electrons', 'density of states'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Free_electron_model' },
      viz(v) {
        const M = v.M, C = M.CONST, RMAX = { 1: 400, 2: 24, 3: 12 }, VOL = { 1: 2, 2: Math.PI, 3: (4 * Math.PI) / 3 };
        const dimSel = v.select('dimension', [{ value: '1', label: '1D' }, { value: '2', label: '2D' }, { value: '3', label: '3D' }], '2');
        const nS = v.slider('electrons $N$', 2, 600, 120, { int: true });
        const metal = v.select('metal', Object.keys(METALS), 'Na');
        const sL = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, height: 340, axes: false, weight: 1, title: 'allowed $\\mathbf k$ points (units of $2\\pi/L$)' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'E / E₀', ylabel: 'g(E)', title: 'density of states $g(E)$ (both spins)' });
        let st = null;
        v.render(() => {
          const d = +dimSel.value, N = nS.value, S = shellStates(d, RMAX[d]), m = Math.ceil(N / 2);
          const eF = S[m - 1][3], rF = Math.sqrt(eF), rThy = Math.pow(N / 2 / VOL[d], 1 / d);
          const half = rF * 1.3 + 1.5, px = sL.width / (2 * half), r = M.clamp(0.3 * px, 1.4, 7);
          sL.setView([-half, half], [-half, half]);
          const occ = [], emp = [];
          for (let i = 0; i < S.length; i++) {
            const p = S[i]; if (d === 3 && p[2] !== 0) continue;
            if (Math.abs(p[0]) > half - 0.45 || Math.abs(p[1]) > half - 0.45) continue;
            (i < m ? occ : emp).push([p[0], d === 1 ? 0 : p[1]]);
          }
          sL.dots(emp, { r: Math.max(1.2, r * 0.55), color: 'faint' });
          sL.dots(occ, { r, color: 'accent' });
          if (d === 1) { sL.vline(rThy, { color: 'green', width: 1.8, dash: [5, 4] }); sL.vline(-rThy, { color: 'green', width: 1.8, dash: [5, 4] }); sL.hline(0, { color: 'grid' }); }
          else sL.circle(0, 0, rThy, { color: 'green', width: 1.8, dash: [5, 4] });
          sL.tex(String.raw`k_F`, rThy * 0.72, d === 1 ? 0.35 * half : rThy * 0.72 + 0.6, { color: 'green', size: 14 });
          // density of states from the grid
          const Emax = Math.min(2.4 * eF + 2, (RMAX[d] - 1) ** 2), nb = 10, w = Emax / nb, cnt = new Array(nb).fill(0);
          for (const p of S) { if (p[3] >= Emax) break; cnt[Math.floor(p[3] / w)]++; }
          const bars = cnt.map((c) => (2 * c) / w), thy = (E) => d * VOL[d] * Math.pow(E, d / 2 - 1);
          let top = 0; for (let i = 1; i < nb; i++) top = Math.max(top, bars[i], thy((i + 0.5) * w));
          sR.setView([0, Emax], [0, top * 1.18]);
          sR.hist({ edges: Array.from({ length: nb + 1 }, (_, i) => i * w), counts: bars }, { color: 'accent', fillAlpha: 0.28 });
          sR.fn(thy, { domain: [Emax * 0.004, eF], fill: true, base: 0, color: 'green', fillAlpha: 0.14, width: 0 });
          sR.fn(thy, { domain: [Emax * 0.004, Emax], color: 'ink', width: 2 });
          sR.vline(eF, { color: 'green', width: 1.8, dash: [5, 4] }); sR.tex('E_F', eF, top * 1.06, { color: 'green', dx: 8, size: 14 });
          st = { d, N, rF, rThy, eF };
        });
        v.legend([['accent', 'filled k points'], ['faint', 'empty'], ['green', 'Fermi radius from n', { dash: true }], ['ink', '$g\\propto E^{(d-2)/2}$']]);
        v.readout(() => {
          if (!st) return '';
          const n = METALS[metal.value] * 1e28, kF = Math.cbrt(3 * Math.PI ** 2 * n), EF = (C.hbar * kF) ** 2 / (2 * C.me), vF = (C.hbar * kF) / C.me;
          const rs = Math.cbrt(3 / (4 * Math.PI * n)) / C.a0;
          return `grid: filled out to $|\\mathbf n|=${v.fix(st.rF, 2)}$ vs ${st.d === 1 ? '$k_FL/2\\pi=N/4$' : 'the predicted'} **${v.fix(st.rThy, 2)}** (the sphere holds $N/2$ points) · density of states $\\propto E^{${st.d === 1 ? '-1/2' : st.d === 2 ? '0' : '1/2'}}$.\n`
            + `**${metal.value}** ($n=${v.fix(METALS[metal.value], 2)}\\times10^{22}\\,\\mathrm{cm^{-3}}$, $r_s/a_0=${v.fix(rs, 2)}$): $k_F=${v.fix(kF / 1e10, 2)}$ Å$^{-1}$, $E_F=${v.fix(EF / C.eV, 2)}$ eV ($T_F=${v.fix(EF / C.kB / 1e4, 2)}\\times10^4$ K), $v_F=${v.fix(vF / 1e6, 2)}\\times10^{6}$ m/s $\\approx ${v.fix(vF / C.c * 100, 2)}\\%$ of $c$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'Crystal momentum and zone schemes',
      credit: 'Bloch, 1929; Brillouin, 1930',
      statement: String.raw`In a lattice with translations $\mathbf R$, Bloch’s theorem (qm-9.7) labels eigenstates by a **crystal momentum** $\mathbf k$ through $\psi(\mathbf r+\mathbf R)=e^{i\mathbf k\cdot\mathbf R}\psi(\mathbf r)$, and by a **band index** $n$. The vector $\mathbf k$ is defined only up to a reciprocal-lattice vector $\mathbf G$: $\psi_{n,\mathbf k+\mathbf G}$ and $\psi_{n,\mathbf k}$ describe the same state, so $E_n(\mathbf k+\mathbf G)=E_n(\mathbf k)$. One may therefore draw the band structure in three equivalent ways: the **extended-zone scheme** (one single-valued branch $E(\mathbf k)$ over all of $k$-space, the $n$-th band living in the $n$-th Brillouin zone), the **reduced-zone scheme** (every band folded into the first zone by a suitable $\mathbf G$) and the **repeated-zone scheme** (all bands drawn periodically in $\mathbf k$). The quantity $\hbar\mathbf k$ is not the momentum of the electron: $\psi$ is not an eigenstate of $-i\hbar\nabla$.`,
      idea: String.raw`Translating by $\mathbf R$ multiplies $\psi_{\mathbf k}$ by $e^{i\mathbf k\cdot\mathbf R}$, and $e^{i\mathbf G\cdot\mathbf R}=1$ for every $\mathbf G$ in the reciprocal lattice (xtal-5.4), so $\mathbf k$ and $\mathbf k+\mathbf G$ give the same eigenvalue of every translation: the label carries no more information than its value modulo $\mathbf G$. The extended scheme restores uniqueness by ordering the states by energy and assigning band $n$ to zone $n$; folding by $\mathbf G$ is a relabelling, so nothing physical changes. For a periodic potential the Bloch function is a sum of plane waves $e^{i(\mathbf k+\mathbf G)\cdot\mathbf r}$ — the free-electron picture with all of them coupled.`,
      caption: String.raw`Bands of a periodic potential (a weak cosine, or the exact Kronig–Penney model). Drag **fold** from 0 to 1: every branch of the extended scheme slides by the reciprocal-lattice vector $G=2$ (arrows, lower strip) into the first zone — the curves never change, only their labels. The toggle draws the **repeated** scheme. The dots come from a different calculation entirely: a ring of four cells diagonalised in real space, whose crystal momentum is read off from the translation operator — they sit on the curves in every scheme.`,
      deps: ['qm-9.7', 'xtal-5.4'],
      refs: ['Ashcroft–Mermin ch. 8', 'Kittel ch. 7'],
      tags: ['crystal momentum', 'brillouin zone', 'band structure'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Crystal_momentum' },
      viz(v) {
        const M = v.M, NB = 3, BW = 0.25, ks = lin(0, 1, 81), NC = 4, PPC = 14;
        const model = v.select('potential', [{ value: 'nfe', label: 'weak cosine' }, { value: 'kp', label: 'Kronig–Penney' }], 'nfe', { onChange: () => { U.el.hidden = model.value !== 'nfe'; V0.el.hidden = model.value !== 'kp'; } });
        const U = v.slider('strength $U$', 0, 1.5, 0.6, { step: 0.01 });
        const V0 = v.slider('barrier height $V_0$ ($E_1$)', 2, 80, 25, { log: true }); V0.el.hidden = true;
        const fold = v.slider('fold into the first zone', 0, 1, 0, { step: 0.01 });
        const rep = v.toggle('repeated-zone scheme', false, { onChange: () => { fold.el.hidden = rep.value; } });
        const chk = v.toggle('real-space ring check', true);
        const sA = v.stage({ x: [-3, 3], y: [0, 10], height: 340, axes: 'box', gutter: true, full: true, xlabel: 'k  (units of π/a)', ylabel: 'E / E₁', xticks: [-3, -2, -1, 0, 1, 2, 3] });
        const sZ = v.stage({ x: [-3, 3], y: [-0.32, 1], height: 112, axes: false, full: true });
        let cacheK = '', cache = null, ringK = '', ring = null;
        const compute = () => {
          const key = model.value + U.value + V0.value; if (key === cacheK) return cache;
          const b = model.value === 'nfe' ? nfeBands(M, [U.value], ks, NB) : kpBands(V0.value, BW, ks, NB).bands;
          cacheK = key; return (cache = b);
        };
        const ringOf = (bands) => {
          const key = model.value + U.value + V0.value; if (key === ringK) return ring;
          const Vx = model.value === 'nfe' ? (x) => nfePotential([U.value], x) : (x) => (Math.abs(x - Math.round(x)) < BW / 2 ? V0.value : 0);
          const R = ringStates(M, Vx, NC, PPC, model.value === 'nfe' ? 1 : 8);
          for (const r of R) { let best = 0, bd = Infinity; const i = Math.round(r.k * 80); for (let n = 0; n < NB; n++) { const dd = Math.abs(bands[n][i] - r.E); if (dd < bd) { bd = dd; best = n; } } r.band = best + 1; r.dev = bd; }
          ringK = key; return (ring = R.filter((r) => r.band <= NB && r.dev < 0.3));
        };
        let info = null;
        v.render(() => {
          const bands = compute(), f = rep.value ? 1 : fold.value;
          let top = 0; for (let n = 0; n < NB; n++) top = Math.max(top, ...bands[n].filter(Number.isFinite));
          sA.setView([-3, 3], [0, Math.ceil(top + 0.6)]);
          // zone boundaries and the free-electron parabola
          for (const kb of [-3, -1, 1, 3]) sA.vline(kb, { color: 'grid', width: 1, dash: [3, 4] });
          if (model.value === 'nfe' && f < 0.02 && !rep.value) sA.fn((k) => k * k, { color: 'muted', width: 1.2, dash: [4, 4] });
          for (let n = 1; n <= NB; n++) {
            const col = bandColor(n - 1), E = bands[n - 1], sh = 2 * Math.floor(n / 2);
            if (rep.value) {
              for (let j = -1; j <= 1; j++) {
                const alpha = j === 0 ? 1 : 0.55, pr = [], pl = [];
                for (let i = 0; i < ks.length; i++) { pr.push([ks[i] + 2 * j, E[i]]); pl.push([-ks[i] + 2 * j, E[i]]); }
                sA.path(pr, { color: col, width: 2.4, alpha }); sA.path(pl, { color: col, width: 2.4, alpha });
              }
            } else {
              const pr = [], pl = [];
              for (let i = 0; i < ks.length; i++) { const x = extK(n, ks[i]) - f * sh; pr.push([x, E[i]]); pl.push([-x, E[i]]); }
              sA.path(pr, { color: col, width: 2.6 }); sA.path(pl, { color: col, width: 2.6 });
            }
          }
          let dev = 0, cntR = 0;
          if (chk.value) {
            const R = ringOf(bands);
            for (const r of R) {
              dev = Math.max(dev, r.dev); cntR++;
              const xs = rep.value ? [r.k, -r.k] : [extK(r.band, r.k) - f * 2 * Math.floor(r.band / 2)];
              const all = []; for (const x of xs) { if (rep.value) for (let j = -1; j <= 1; j++) all.push(x + 2 * j); else all.push(x, -x); }
              for (const x of all) sA.dot(x, r.E, { r: 4.6, color: 'ink', hollow: false, alpha: 0.95 });
            }
          }
          // strip of zones and reciprocal-lattice vectors
          sZ.rect(-1, 0.38, 1, 0.9, { fill: 'accent', fillAlpha: 0.16, color: 'accent' }); sZ.text('1st zone', 0, 0.64, { align: 'center', size: 11.5, color: 'accent' });
          for (const [a, b2, c2] of [[1, 2, 'orange'], [-2, -1, 'orange'], [2, 3, 'green'], [-3, -2, 'green']]) {
            sZ.rect(a, 0.38, b2, 0.9, { fill: c2, fillAlpha: 0.12, color: c2 }); sZ.text(Math.abs(a) === 1 || Math.abs(b2) === 1 ? '2nd zone' : '3rd zone', (a + b2) / 2, 0.64, { align: 'center', size: 11.5, color: c2 });
          }
          for (const g of [-2, 0, 2]) sZ.dot(g, 0.16, { r: 4, color: 'ink' });
          sZ.text('G = 0', 0, -0.12, { align: 'center', size: 10.5, color: 'muted' }); sZ.text('G = 2 (in π/a units)', 2, -0.12, { align: 'center', size: 10.5, color: 'muted' }); sZ.text('G = −2', -2, -0.12, { align: 'center', size: 10.5, color: 'muted' });
          if (!rep.value && f > 0.02) { sZ.arrow(1.5, 0.3, 1.5 - 2 * f, 0.3, { color: 'orange', width: 2 }); sZ.arrow(-1.5, 0.3, -1.5 + 2 * f, 0.3, { color: 'orange', width: 2 }); }
          // an example: band 2 at extended k = 1.5
          const i2 = 40, e2 = bands[1][i2]; // k_red = 0.5 → k_ext = 2 − 0.5 = 1.5
          info = { e2, dev, cntR, f, top };
        });
        v.legend([['accent', 'band 1'], ['orange', 'band 2'], ['green', 'band 3'], ['ink', 'ring of 4 cells, real space', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { e2, dev, cntR, f } = info;
          return `Band 2 at extended $k=1.5\\,\\pi/a$ has $E=${v.fix(e2, 3)}\\,E_1$; the same state sits at reduced $k=-0.5\\,\\pi/a$ after folding by $G=2\\pi/a$ (at fold = ${v.fix(f, 2)} it is drawn at $k=${v.fix(1.5 - 2 * f, 2)}\\,\\pi/a$).`
            + (chk.value ? `\nReal-space ring of ${4} cells: **${cntR}** states, each assigned $(k,n)$ from the translation operator; largest deviation from the band curve **${v.fix(dev, 3)}** $E_1$ (finite-difference error).` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Model',
      name: 'Nearly-free electron model',
      credit: 'Peierls and Brillouin, c. 1930',
      statement: String.raw`Let free electrons of energy $\varepsilon^0_{\mathbf k}=\hbar^2k^2/2m$ feel a weak periodic potential $V(\mathbf r)=\sum_{\mathbf G}U_{\mathbf G}e^{i\mathbf G\cdot\mathbf r}$ with $|U_{\mathbf G}|$ small compared with the spacing of the free levels. Away from Bragg planes the energies are shifted only at second order, so the bands stay close to the free parabola folded into the first zone. Near a Bragg plane $\mathbf k\approx\mathbf G/2$ the two plane waves $\mathbf k$ and $\mathbf k-\mathbf G$ are almost degenerate and mix:
$$E_\pm=\tfrac12\big(\varepsilon^0_{\mathbf k}+\varepsilon^0_{\mathbf k-\mathbf G}\big)\pm\sqrt{\Big(\tfrac12\big(\varepsilon^0_{\mathbf k}-\varepsilon^0_{\mathbf k-\mathbf G}\big)\Big)^2+|U_{\mathbf G}|^2},$$
so a **gap** $E_g=2|U_{\mathbf G}|$ opens exactly on the plane, and each Fourier component of the potential opens the gap at its own plane.`,
      idea: String.raw`Write $\psi_{\mathbf k}=\sum_{\mathbf G}c_{\mathbf G}\,e^{i(\mathbf k+\mathbf G)\cdot\mathbf r}$ (Bloch’s theorem, qm-9.7). Schrödinger’s equation becomes a matrix problem $(\varepsilon^0_{\mathbf k+\mathbf G}-E)c_{\mathbf G}+\sum_{\mathbf G'}U_{\mathbf G-\mathbf G'}c_{\mathbf G'}=0$. If only one $c$ is large, second-order perturbation theory moves the level by $\sim|U|^2/\Delta\varepsilon$; if two free energies lie within $|U|$ of one another, degenerate perturbation theory diagonalises the $2\times2$ block, giving the square root above. Planes are the Bragg planes of the reciprocal lattice (xtal-5.5).`,
      caption: String.raw`Bands computed by **diagonalising the plane-wave Hamiltonian** (13 waves) at each $k$, in the reduced zone; dashed: free-electron parabolas folded in. Raise $U_1$ and the first gap opens at the zone edge; raise $U_2$ and a second gap opens at the zone centre. Right: the numerical gap against the prediction $2|U_1|$ — they agree for small $U_1$ and part company once $U_1$ is no longer small compared with the free-level spacing.`,
      scope: String.raw`Weak potential: $|U_{\mathbf G}|\ll\varepsilon^0_{\mathbf G/2}$. Good for the sp metals (Na, Mg, Al) and the valence bands of some semiconductors; fails for tightly bound d and f electrons.`,
      deps: ['qm-9.7', 'xtal-5.5'],
      refs: ['Ashcroft–Mermin ch. 9', 'Kittel ch. 7'],
      tags: ['nearly free electrons', 'band gap', 'perturbation theory'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Nearly_free_electron_model' },
      viz(v) {
        const M = v.M, NB = 3, k0 = lin(0, 1, 61);
        const U1 = v.slider('first harmonic $U_1$', 0, 1.2, 0.4, { step: 0.01 });
        const U2 = v.slider('second harmonic $U_2$', 0, 0.8, 0.2, { step: 0.01 });
        const free = v.toggle('free-electron parabolas', true);
        const sA = v.stage({ x: [-1, 1], y: [0, 10], height: 360, axes: 'box', gutter: true, weight: 1.4, xlabel: 'k  (units of π/a)', ylabel: 'E / E₁', title: 'bands in the reduced zone', xticks: [-1, -0.5, 0, 0.5, 1] });
        const sB = v.stage({ x: [0, 1.2], y: [0, 2.6], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'U₁', ylabel: 'gap at k = π/a', title: 'first gap against $2|U_1|$' });
        let sweepKey = '', sweep = null;
        let st = null;
        v.render(() => {
          const B = nfeBands(M, [U1.value, U2.value], k0, NB);
          if (free.value) for (let m = -2; m <= 2; m++) sA.fn((k) => (k + 2 * m) ** 2, { domain: [-1, 1], color: 'muted', width: 1.2, dash: [4, 4] });
          const lo = [], hi = [];
          for (let n = 0; n < NB; n++) { lo.push(Math.min(...B[n])); hi.push(Math.max(...B[n])); }
          for (let n = 0; n < NB - 1; n++) { sA.rect(-1, hi[n], 1, lo[n + 1], { fill: 'red', fillAlpha: 0.13, stroke: false }); }
          for (let n = 0; n < NB; n++) {
            const r = [], l = []; for (let i = 0; i < k0.length; i++) { r.push([k0[i], B[n][i]]); l.push([-k0[i], B[n][i]]); }
            sA.path(r, { color: bandColor(n), width: 2.6 }); sA.path(l, { color: bandColor(n), width: 2.6 });
          }
          const g1 = lo[1] - hi[0], g2 = lo[2] - hi[1];
          if (g1 > 0.04) sA.tex(`E_g=${(g1).toFixed(2)}`, 0, (hi[0] + lo[1]) / 2, { color: 'red', align: 'center', size: 13 });
          if (g2 > 0.04) sA.tex(`E_g=${(g2).toFixed(2)}`, 0.5, (hi[1] + lo[2]) / 2 - 0.0, { color: 'red', align: 'center', size: 13 });
          // gap against U1
          const key = U2.value.toFixed(3);
          if (key !== sweepKey) { sweepKey = key; sweep = lin(0, 1.2, 49).map((u) => { const r = nfeSolve(M, [u, U2.value], 1); return [u, r.E[1] - r.E[0]]; }); }
          sB.line(0, 0, 1.2, 2.4, { color: 'ink', width: 1.6, dash: [5, 4] });
          sB.path(sweep, { color: 'green', width: 2.6 });
          sB.dot(U1.value, g1, { r: 6, color: 'gold' });
          sB.text('2|U₁|', 1.0, 2.5, { color: 'ink', size: 12, align: 'center' });
          st = { g1, g2 };
        });
        v.legend([['accent', 'band 1'], ['orange', 'band 2'], ['green', 'band 3  /  numerical gap'], ['red', 'forbidden energies', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const pred1 = 2 * U1.value, pred2 = 2 * U2.value;
          return `gap at $k=\\pi/a$: numerical **${v.fix(st.g1, 3)}** vs first-order $2|U_1|=${v.fix(pred1, 3)}$ (${pred1 > 0 ? v.fix((100 * st.g1) / pred1, 1) : '—'}% of it) · gap at $k=0$ between bands 2 and 3: **${v.fix(st.g2, 3)}** vs $2|U_2|=${v.fix(pred2, 3)}$ (all energies in $E_1=\\hbar^2\\pi^2/2ma^2$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'Band gaps at Bragg planes',
      credit: 'Bragg, 1913; Brillouin, 1930',
      statement: String.raw`A wave $e^{i\mathbf k\cdot\mathbf r}$ in a crystal is Bragg-reflected when $\mathbf k$ lies on a Bragg plane, $2\mathbf k\cdot\mathbf G=G^2$ (in 1D: $k=\pi/a$, wavelength $2a$). There the incident and reflected waves have equal weight and form **standing waves** $\psi_\pm\propto\cos(\pi x/a),\ \sin(\pi x/a)$ with zero group velocity. They pile electron density in different places relative to the ions, $|\psi_\pm|^2\propto 1\pm\cos(2\pi x/a)$, so their potential energies $\langle V\rangle=\pm U_1$ differ and the two states are split by $E_g=2|U_1|$: no travelling wave with an energy in the gap exists. For attractive ions the state that piles charge on the ions is the lower one.`,
      idea: String.raw`At a Bragg plane the free waves $e^{\pm i\pi x/a}$ are exactly degenerate and the periodic potential couples them through $U_{G}$ (here $G=2\pi/a$), so degenerate perturbation theory (cm-1.3) forces the eigenstates to be the symmetric and antisymmetric combinations, whatever the sign of $U_1$; the energies are then $\varepsilon_{\pi/a}\pm U_1$ with $\langle V\rangle$ evaluated in the two charge distributions. Away from the plane the waves are not degenerate, mixing is weaker, and the density is flatter: the standing wave is the limit where the reflected wave reaches full strength. Bragg’s law (xtal-6.2) is the same condition.`,
      caption: String.raw`**Left:** the charge density $|\psi|^2$ of the two states of the lower and upper band at crystal momentum $k$, computed by diagonalising the plane-wave Hamiltonian; the ions (red dots) sit on the potential $V(x)$ drawn at the top. At the zone edge ($k=\pi/a$, the default) one state piles on the ions and the other between them. **Drag $k$** to watch the standing waves dissolve into nearly uniform plane waves. **Right:** the extended-zone energies near the edge; the gap is $2|U|$. Flip the sign of the potential and the two states swap roles.`,
      deps: ['cm-1.3', 'xtal-6.2'],
      refs: ['Ashcroft–Mermin ch. 9', 'Kittel ch. 7'],
      tags: ['bragg reflection', 'standing waves', 'band gap'],
      viz(v) {
        const M = v.M, NX = 241;
        const U = v.slider('potential strength $|U_1|$', 0.02, 0.9, 0.35, { step: 0.01 });
        const kS = v.slider('crystal momentum $k$  ($\\pi/a$)', 0.05, 1, 1, { step: 0.01 });
        const rep = v.toggle('repulsive centres (flip the sign of $U_1$)', false);
        const sA = v.stage({ x: [-1.5, 1.5], y: [0, 3.3], height: 340, axes: 'box', gutter: true, weight: 1.3, xlabel: 'x / a', ylabel: '|ψ|²', title: 'charge density of the two states at $k$' });
        const sB = v.stage({ x: [0.2, 1.8], y: [0, 3.6], height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'k  (units of π/a, extended zone)', ylabel: 'E / E₁', title: 'energy near the zone boundary' });
        const kk = lin(0.2, 1, 41);
        let st = null;
        v.render(() => {
          const U1 = rep.value ? U.value : -U.value, k = kS.value, R = nfeSolve(M, [U1], k);
          const xs = lin(-1.5, 1.5, NX);
          const rho = [0, 1].map((j) => xs.map((x) => { const b = blochAt(R.C[j], R.N, k, x); return b.re * b.re + b.im * b.im; }));
          const Vv = xs.map((x) => nfePotential([U1], x)), ymax = 2 * 0.9;
          const yp = (V) => 2.75 + (0.5 * V) / ymax;
          // potential and ions
          sA.path(xs.map((x, i) => [x, yp(Vv[i])]), { color: 'green', width: 2 });
          sA.line(-1.5, 2.75, 1.5, 2.75, { color: 'grid', width: 1 });
          for (let n = -1; n <= 1; n++) sA.dot(n, yp(nfePotential([U1], n)), { r: 7, color: 'red' });
          sA.tex('V(x)', -1.4, 3.1, { color: 'green', size: 13 });
          sA.hline(1, { color: 'muted', width: 1.2, dash: [4, 4] });
          const cols = ['accent', 'orange'];
          for (const j of [0, 1]) {
            sA.path(xs.map((x, i) => [x, rho[j][i]]), { color: cols[j], width: 2.6 });
            sA.poly([[-1.5, 0], ...xs.map((x, i) => [x, rho[j][i]]), [1.5, 0]], { fill: cols[j], fillAlpha: 0.1, stroke: false });
          }
          // energies on the extended zone
          const E1 = [], E2 = [], F = [];
          for (const kq of kk) { const r = nfeSolve(M, [U1], kq); E1.push([kq, r.E[0]]); E2.push([2 - kq, r.E[1]]); }
          sB.fn((x) => x * x, { color: 'muted', width: 1.3, dash: [4, 4] });
          sB.path(E1, { color: 'accent', width: 2.8 }); sB.path(E2, { color: 'orange', width: 2.8 });
          const edge = nfeSolve(M, [U1], 1);
          sB.measure(1.0, edge.E[0], 1.0, edge.E[1], '2|U₁|');
          sB.dot(k, R.E[0], { r: 6.5, color: 'accent' }); sB.dot(2 - k, R.E[1], { r: 6.5, color: 'orange' });
          sB.vline(1, { color: 'grid', dash: [3, 4] });
          sB.text('λ = 2a at the edge', 1.0, 0.25, { size: 11.5, color: 'muted', align: 'center' });
          let dx = 3 / (NX - 1), Vexp = [0, 1].map((j) => { let s = 0, w = 0; for (let i = 0; i < NX; i++) if (xs[i] > -0.5 - 1e-9 && xs[i] <= 0.5 + 1e-9) { s += rho[j][i] * Vv[i]; w += 1; } return s / w; });
          st = { k, E: R.E.slice(0, 2), Vexp, gap: edge.E[1] - edge.E[0], U1 };
        });
        v.legend([['accent', 'lower state'], ['orange', 'upper state'], ['green', 'ionic potential V(x)'], ['muted', 'free wave, |ψ|² = 1', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `at $k=${v.fix(st.k, 2)}\\,\\pi/a$: $E_{\\rm lower}=${v.fix(st.E[0], 3)}$, $E_{\\rm upper}=${v.fix(st.E[1], 3)}$ · mean potential energy in the two charge distributions $\\langle V\\rangle=${v.fix(st.Vexp[0], 3)}$ and $${v.fix(st.Vexp[1], 3)}$ · gap at the zone edge **${v.fix(st.gap, 3)}** vs $2|U_1|=${v.fix(2 * Math.abs(st.U1), 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Graphene: tight-binding bands and Dirac cones',
      credit: 'Wallace, 1947',
      statement: String.raw`Graphene is a honeycomb lattice of carbon atoms with two atoms (sublattices $A$, $B$) per primitive cell. For the $\pi$ electrons, with one orbital per atom and a hopping amplitude $-t$ ($t\approx2.7$ eV) between nearest neighbours at distance $a$, Bloch’s theorem reduces the problem to a $2\times2$ matrix with off-diagonal element $-t f(\mathbf k)$, $f(\mathbf k)=\sum_{j=1}^3e^{i\mathbf k\cdot\boldsymbol\delta_j}$ and bands
$$E_\pm(\mathbf k)=\pm\,t\,|f(\mathbf k)|.$$
They touch, with $f=0$, only at the corners $K$ and $K'$ of the hexagonal Brillouin zone. At half filling, the Fermi level sits at that point, and nearby $E_\pm=\pm\hbar v_F|\mathbf q|$ with $v_F=3ta/2\hbar\approx10^6$ m/s: massless Dirac fermions. Giving the two sublattices different on-site energies $\pm\Delta$ opens a gap $2\Delta$.`,
      idea: String.raw`Each primitive cell has two orbitals, so $H(\mathbf k)$ is $2\times2$ with eigenvalues $\pm\sqrt{\Delta^2+t^2|f|^2}$; one band is filled by the one $\pi$ electron per atom. A degeneracy of the two bands needs $f=0$, a complex equation in two real unknowns, which the hexagonal symmetry solves at isolated points: the six corners, equivalent in two inequivalent groups $K$, $K'$. Expanding $f$ about $K$ gives a linear function of $\mathbf q$, hence a cone. A staggered potential adds $\Delta^2$ under the root and rounds the tip (xtal-1.1 supplies the honeycomb lattice and its zone; qm-9.9 the tight-binding method).`,
      caption: String.raw`The two bands as surfaces over the hexagonal Brillouin zone (drag to rotate), with the energy along $\Gamma\to K\to M\to\Gamma$ on the right. Choose **zoom on K** to see the cone. Raise the **sublattice offset $\Delta$** and the cone tip is rounded into a gap $2\Delta$; $t'$ (next-nearest hopping) tilts the whole picture without closing or opening anything. The readout measures the gap and the cone slope numerically.`,
      scope: String.raw`Nearest-neighbour tight binding on a single sheet. Real graphene adds longer hoppings and electron–electron interactions (which renormalise $v_F$ by tens of per cent); the Dirac points themselves are protected by symmetry.`,
      deps: ['qm-9.9', 'xtal-1.1'],
      refs: ['Ashcroft–Mermin ch. 10'],
      tags: ['graphene', 'dirac cone', 'tight binding'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Graphene' },
      viz(v) {
        const M = v.M, S3 = Math.sqrt(3), KK = (4 * Math.PI) / (3 * S3), MM = (2 * Math.PI) / 3;
        const D3 = [[0, 1], [S3 / 2, -0.5], [-S3 / 2, -0.5]];
        const t = v.slider('hopping $t$ (eV)', 1, 4, 2.7, { step: 0.05 });
        const D = v.slider('sublattice offset $\\Delta$ (eV)', 0, 1.5, 0, { step: 0.01 });
        const tp = v.slider("next-nearest hopping $t'$ (eV)", 0, 0.5, 0, { step: 0.01 });
        const view = v.select('view', [{ value: 'zone', label: 'whole zone' }, { value: 'cone', label: 'zoom on K' }], 'zone');
        const s3 = v.stage3d({ range: 2.2, height: 400, yaw: -0.75, pitch: 0.42, axes: false, weight: 1.25, title: '$E_\\pm(k_x,k_y)$' });
        const sP = v.stage({ x: [0, 3], y: [-9.5, 9.5], height: 400, axes: 'box', gutter: true, weight: 1, ylabel: 'E (eV)', title: 'along $\\Gamma\\to K\\to M\\to\\Gamma$', xticks: [[0, 'Γ'], [1, 'K'], [2, 'M'], [3, 'Γ']] });
        const hexR = (w) => { const a = ((w % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3); return MM / Math.cos(a - Math.PI / 6); };
        const bands = (kx, ky) => {
          let re = 0, im = 0; for (const [dx, dy] of D3) { const ph = kx * dx + ky * dy; re += Math.cos(ph); im += Math.sin(ph); }
          const f2 = re * re + im * im, e0 = -tp.value * (f2 - 3), w = Math.sqrt(D.value ** 2 + t.value ** 2 * f2);
          return [e0 - w, e0 + w, f2];
        };
        const lerp2 = (A, B, s) => [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s];
        const G = [0, 0], Kp = [KK, 0], Mp = [KK * 0.75, (KK * S3) / 4];
        const pathK = (s) => (s <= 1 ? lerp2(G, Kp, s) : s <= 2 ? lerp2(Kp, Mp, s - 1) : lerp2(Mp, G, s - 2));
        let st = null;
        v.render(() => {
          const zone = view.value === 'zone', ek = 0.55, ez = 0.2;
          const P = (u, w, sgn) => {
            let kx, ky, x, y;
            if (zone) { const r = u * hexR(w); kx = r * Math.cos(w); ky = r * Math.sin(w); x = kx * ek; y = ky * ek; }
            else { const qx = 0.5 * u * Math.cos(w), qy = 0.5 * u * Math.sin(w); kx = KK + qx; ky = qy; x = qx * 2.2; y = qy * 2.2; }
            const b = bands(kx, ky);
            return [x, y, (zone ? ez : 0.42) * b[sgn]];
          };
          s3.surface((u, w) => P(u, w, 1), [0, 1], [0, TAU], { nu: 16, nv: 72, color: 'accent', alpha: 0.82, wire: true });
          s3.surface((u, w) => P(u, w, 0), [0, 1], [0, TAU], { nu: 16, nv: 72, color: 'orange', alpha: 0.82, wire: true });
          if (zone) {
            const hex = []; for (let j = 0; j <= 6; j++) hex.push([KK * ek * Math.cos((j * Math.PI) / 3), KK * ek * Math.sin((j * Math.PI) / 3), 0]);
            s3.path(hex, { color: 'ink', width: 1.6 });
            for (let j = 0; j < 6; j++) { const a = (j * Math.PI) / 3, b = bands(KK * Math.cos(a), KK * Math.sin(a)); s3.dot([KK * ek * Math.cos(a), KK * ek * Math.sin(a), ez * (b[0] + b[1]) / 2], { r: 4.5, color: j % 2 ? 'purple' : 'green' }); }
          }
          // path
          const pu = [], pl = [];
          for (let i = 0; i <= 150; i++) { const s = (3 * i) / 150, k = pathK(s), b = bands(k[0], k[1]); pu.push([s, b[1]]); pl.push([s, b[0]]); }
          sP.path(pu, { color: 'accent', width: 2.6 }); sP.path(pl, { color: 'orange', width: 2.6 });
          sP.hline(3 * tp.value, { color: 'green', width: 1.3, dash: [5, 4] });
          for (const x of [1, 2]) sP.vline(x, { color: 'grid', dash: [3, 4] });
          sP.text('Fermi level of neutral graphene', 2.98, 3 * tp.value + 0.55, { size: 11, color: 'green', align: 'right' });
          // measurements
          const bK = bands(KK, 0), q = 0.02, bq = bands(KK + q, 0);
          let gap = Infinity; for (let i = -10; i <= 10; i++) for (let j = -10; j <= 10; j++) { const b = bands(KK + i * 0.004, j * 0.004); gap = Math.min(gap, b[1] - b[0]); }
          const wq = (bq[1] - bq[0]) / 2, w0 = Math.sqrt(D.value ** 2), slope = Math.sqrt(Math.max(0, wq * wq - w0 * w0)) / q;
          const a = 1.42e-10, vF = (slope * a * M.CONST.e) / M.CONST.hbar, vTh = (1.5 * t.value * a * M.CONST.e) / M.CONST.hbar;
          st = { gap: gap, vF, vTh, fK: bK[2] };
        });
        v.legend([['accent', 'conduction band $E_+$'], ['orange', 'valence band $E_-$'], ['green', 'K points', { dot: true }], ['purple', "K' points", { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$|f(K)|^2=${v.fix(st.fK, 4)}$ (the bands touch where $f=0$) · gap at $K$: **${v.fix(st.gap, 3)}** eV $\;(2\\Delta=${v.fix(2 * D.value, 3)})$ · cone slope measured on the surface $v_F=${v.fix(st.vF / 1e5, 2)}\\times10^5$ m/s vs $3ta/2\\hbar=${v.fix(st.vTh / 1e5, 2)}\\times10^5$ m/s (with $a=1.42$ Å) · bandwidth $6t=${v.fix(6 * t.value, 1)}$ eV.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Each band holds two electrons per primitive cell',
      statement: String.raw`Take a crystal of $N=N_1N_2N_3$ primitive cells with periodic boundary conditions. For each band index $n$ there are exactly $N$ distinct crystal momenta in the first Brillouin zone, $\mathbf k=\sum_i\frac{m_i}{N_i}\mathbf b_i$ ($m_i$ integers, $\mathbf b_i$ the reciprocal-lattice basis), so a band holds $N$ orbital states and, with spin, $2N$ electrons: **two per primitive cell**. Consequently, for independent electrons, a crystal with an odd number of electrons per primitive cell cannot have all its bands full or empty and is a **metal**; with an even number it is an **insulator** if the filled bands are separated from the empty ones by a gap, and otherwise (overlapping bands) a metal or semimetal.`,
      idea: String.raw`Periodic boundary conditions force $e^{i\mathbf k\cdot N_i\mathbf a_i}=1$ for each lattice direction, so $\mathbf k\cdot\mathbf a_i=2\pi m_i/N_i$: the allowed $\mathbf k$ are a grid with $N_i$ points per reciprocal direction inside one cell of the reciprocal lattice (xtal-5.4), because $\mathbf k$ and $\mathbf k+\mathbf b_i$ are identified (cm-1.2). That is $N$ points per band, independent of the potential. Electrons fill the lowest levels two to a state, so the electrons per cell equal twice the number of filled bands unless a band is partially filled; a partially filled band has empty states arbitrarily close in energy, which lets the electrons accelerate in a field, and a completely filled band carries no current.`,
      caption: String.raw`A ring of $N$ cells (drag **cells $N$**) in the nearly-free-electron model: the dots are the allowed $k=2\pi m/Na$, **$N$ of them in each band** (counted live). Choose the **electrons per cell $Z$**: states fill from the bottom, two per dot, the green line marks the Fermi level. For odd $Z$ a band is left half full — a metal for any potential strength; for even $Z$ the verdict depends on whether the filled bands are separated from the empty ones by a gap. Bars: how full each band is.`,
      scope: String.raw`Non-interacting electrons (or a mean-field band structure) with a lattice of $N$ cells. Strong repulsion can make an odd-$Z$ crystal an insulator (Mott, cm-5.5), but only by enlarging the cell or breaking the independent-electron picture.`,
      deps: ['cm-1.2'],
      refs: ['Ashcroft–Mermin ch. 8', 'Kittel ch. 7'],
      tags: ['band filling', 'metals and insulators', 'brillouin zone'],
      viz(v) {
        const M = v.M, NB = 4;
        const nS = v.slider('cells $N$', 2, 16, 6, { int: true });
        const zS = v.slider('electrons per cell $Z$', 1, 6, 2, { int: true });
        const U = v.slider('potential strength $U$', 0, 1.5, 0.5, { step: 0.01 });
        const extra = v.toggle('add one more electron', false);
        const sA = v.stage({ x: [-1.08, 1.08], y: [-0.5, 10.5], height: 360, axes: 'box', gutter: true, weight: 1.4, xlabel: 'k  (units of π/a)', ylabel: 'E / E₁', title: 'allowed $k$ of a ring of $N$ cells', xticks: [-1, -0.5, 0, 0.5, 1] });
        const sB = v.stage({ x: [0, 1], y: [0, NB + 0.4], height: 360, axes: false, weight: 0.8, title: 'how full is each band?' });
        const cacheE = new Map();
        const bandE = (k, u) => { const key = u.toFixed(3) + '|' + k.toFixed(5); if (!cacheE.has(key)) { if (cacheE.size > 3000) cacheE.clear(); cacheE.set(key, nfeSolve(M, [u], k).E.slice(0, NB)); } return cacheE.get(key); };
        let st = null;
        v.render(() => {
          const N = nS.value, Z = zS.value, u = U.value;
          const ms = []; for (let m = -Math.floor((N - 1) / 2); m <= Math.floor(N / 2); m++) ms.push(m);
          const states = [];
          for (let b = 0; b < NB; b++) for (const m of ms) { const k = (2 * m) / N; states.push({ b, m, k, E: bandE(Math.abs(k), u)[b] }); }
          states.sort((p, q) => p.E - q.E || p.b - q.b);
          let ne = Z * N + (extra.value ? 1 : 0); const total = ne;
          for (const s of states) { s.occ = Math.min(2, ne); ne -= s.occ; }
          const kr = lin(0, 1, 61), curves = Array.from({ length: NB }, () => []);
          for (const k of kr) { const e = bandE(k, u); for (let b = 0; b < NB; b++) curves[b].push(e[b]); }
          for (let b = 0; b < NB; b++) {
            const r = [], l = []; kr.forEach((k, i) => { r.push([k, curves[b][i]]); l.push([-k, curves[b][i]]); });
            sA.path(r, { color: bandColor(b), width: 1.8, alpha: 0.55 }); sA.path(l, { color: bandColor(b), width: 1.8, alpha: 0.55 });
          }
          let lastOcc = -1, firstEmp = -1; states.forEach((s, i) => { if (s.occ > 0) lastOcc = i; if (s.occ < 2 && firstEmp < 0) firstEmp = i; });
          const eTop = lastOcc >= 0 ? states[lastOcc].E : 0, eNext = firstEmp >= 0 ? states[firstEmp].E : eTop + 1;
          for (const s of states) {
            if (s.E > 11) continue;
            const col = s.occ === 2 ? 'green' : s.occ === 1 ? 'gold' : 'muted';
            sA.dot(s.k, s.E, { r: 5.4, color: col, hollow: s.occ === 0 });
          }
          const ef = (eTop + eNext) / 2;
          sA.hline(ef, { color: 'green', width: 1.5, dash: [5, 4] }); sA.tex('E_F', -1.0, ef + 0.4, { color: 'green', size: 13 });
          // counting
          const perBand = [], fill = [];
          for (let b = 0; b < NB; b++) { const sb = states.filter((s) => s.b === b); perBand.push(sb.length); fill.push(sb.reduce((a, s) => a + s.occ, 0)); }
          for (let b = 0; b < NB; b++) {
            const y0 = NB - 1 - b + 0.15;
            sB.rect(0.04, y0, 0.96, y0 + 0.62, { color: bandColor(b), fill: bandColor(b), fillAlpha: 0.08 });
            sB.rect(0.04, y0, 0.04 + 0.92 * fill[b] / (2 * N), y0 + 0.62, { color: bandColor(b), fill: bandColor(b), fillAlpha: 0.55 });
            sB.text(`band ${b + 1}: ${perBand[b]} k-points, ${fill[b]} of ${2 * perBand[b]} electrons`, 0.06, y0 + 0.31, { size: 11, color: 'ink', align: 'left', baseline: 'middle' });
          }
          const top = states[lastOcc].b, topFull = fill[top] === 2 * N;
          let gapAbove = Infinity; if (topFull && top + 1 < NB) gapAbove = Math.min(...states.filter((s) => s.b === top + 1).map((s) => s.E)) - Math.max(...states.filter((s) => s.b === top).map((s) => s.E));
          st = { N, Z, total, perBand, fill, top, topFull, gapAbove, ef };
        });
        v.legend([['green', 'doubly occupied', { dot: true }], ['gold', 'singly occupied', { dot: true }], ['muted', 'empty', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { N, total, perBand, top, topFull, gapAbove } = st;
          let verdict;
          if (!topFull) verdict = `band ${top + 1} is only partly full — **metal**`;
          else if (gapAbove > 1e-6) verdict = `${top === 0 ? 'band 1 is' : `bands 1–${top + 1} are`} exactly full and a gap of **${v.fix(gapAbove, 3)}** $E_1$ lies above — **insulator**`;
          else verdict = `${top === 0 ? 'band 1 is' : `bands 1–${top + 1} are`} full but the next band touches or overlaps them — **metal / semimetal**`;
          return `each band has $${perBand[0]}$ allowed $k$ (all bands: ${perBand.join(', ')}) $=N$ · capacity $2N=${2 * N}$ · ${total} electrons for ${N} cells: ${verdict}.`;
        });
      },
    },
  ],
};
