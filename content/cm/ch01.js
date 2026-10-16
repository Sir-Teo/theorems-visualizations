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
            if (Math.abs(p[0]) > half || Math.abs(p[1]) > half) continue;
            (i < m ? occ : emp).push([p[0], d === 1 ? 0 : p[1]]);
          }
          sL.dots(emp, { r: Math.max(1.2, r * 0.55), color: 'faint' });
          sL.dots(occ, { r, color: 'accent' });
          if (d === 1) { sL.vline(rThy, { color: 'green', width: 1.8, dash: [5, 4] }); sL.vline(-rThy, { color: 'green', width: 1.8, dash: [5, 4] }); sL.hline(0, { color: 'grid' }); }
          else sL.circle(0, 0, rThy, { color: 'green', width: 1.8, dash: [5, 4] });
          sL.tex(String.raw`k_F`, rThy * 0.72, d === 1 ? 0.35 * half : rThy * 0.72 + 0.6, { color: 'green', size: 14 });
          // density of states from the grid
          const Emax = Math.min(2.4 * eF + 2, (RMAX[d] - 1) ** 2), nb = d === 1 ? 20 : 24, w = Emax / nb, cnt = new Array(nb).fill(0);
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
        v.legend([['accent', 'filled k points'], ['faint', 'empty'], ['green', 'Fermi radius from n', { dash: true }], ['ink', 'g ∝ E^{(d−2)/2}']]);
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
        const sZ = v.stage({ x: [-3, 3], y: [0, 1], height: 96, axes: false, full: true });
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
          sZ.text('G = 0', 0, 0.02, { align: 'center', size: 10.5, color: 'muted' }); sZ.text('G = 2 (2π/a)', 2, 0.02, { align: 'center', size: 10.5, color: 'muted' }); sZ.text('G = −2', -2, 0.02, { align: 'center', size: 10.5, color: 'muted' });
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
  ],
};
