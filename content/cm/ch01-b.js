// Condensed Matter Physics — Chapter 1: Electrons in a periodic potential (items 1.7–1.11; 1.1–1.6 in ch01.js)
import { TAU, bandColor, nfeSolve, blochAt, lin } from './ch01.shared.js';

const PI = Math.PI;

export default {
  collection: 'cm',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Fermi surfaces',
      credit: 'Luttinger, 1960',
      statement: String.raw`For independent electrons filling the lowest levels of a band structure $E_n(\mathbf k)$ at zero temperature, the **Fermi surface** is the set $E_n(\mathbf k)=\mu$ in the Brillouin zone, where $\mu$ is fixed by the electron density: the occupied region $\{E_n<\mu\}$ must contain $n/2$ of the zone per spin-degenerate band ($n$ electrons per cell). Its shape is a property of the lattice and the filling, not of a sphere: for a square lattice with nearest-neighbour hopping $t$, $E=-2t(\cos k_x+\cos k_y)-4t'\cos k_x\cos k_y$, the surface is a circle around $\Gamma$ at low filling, a square (the nesting diamond $|k_x|+|k_y|=\pi$) at half filling when $t'=0$, and a hole pocket around $M=(\pi,\pi)$ near full filling. Only states on this surface take part in low-energy transport.`,
      idea: String.raw`$\mu$ is the energy for which the occupied part of the zone has the right area: $\int_{E<\mu}\frac{d^2k}{(2\pi)^2}=n/2$, so the Fermi “sea” is the sublevel set of the band and its boundary the level curve of $E(\mathbf k)$. Near the bottom of the band $E\approx E_\Gamma+\frac{\hbar^2k^2}{2m^*}$ the level curves are circles (qm-9.9 supplies the band, cm-1.1 the free-electron circle). As $\mu$ rises, curves bend toward the zone edge; at the saddle point $X=(\pi,0)$ the topology changes — a closed electron orbit around $\Gamma$ turns into a hole orbit around $M$ — and the van Hove singularity (cm-1.8) sits at that energy.`,
      caption: String.raw`Drag the **filling $n$** (electrons per site, 0 to 2): the occupied region (blue) is computed from the energy on a $160\times160$ grid of the zone, with $\mu$ chosen so that it holds exactly $n/2$ of the cells; the orange line is the Fermi surface. Right: $\mu$ against $n$ with the saddle-point energy (dashed): crossing it turns electron-like surfaces into hole-like ones. Turn on **$t'$** to deform the diamond at half filling and shift the topological change away from $n=1$.`,
      scope: String.raw`Tight-binding band of a single orbital per site, spin-degenerate, non-interacting electrons. Real Fermi surfaces (copper, aluminium) are measured by quantum oscillations (cm-2.12) and photoemission.`,
      deps: ['qm-9.9', 'cm-1.1'],
      refs: ['Ashcroft–Mermin ch. 9', 'Kittel ch. 9'],
      tags: ['fermi surface', 'tight binding', 'filling'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermi_surface' },
      viz(v) {
        const M = v.M, NG = 160;
        const nS = v.slider('electrons per site $n$', 0.04, 1.96, 0.8, { step: 0.01 });
        const tpS = v.slider("diagonal hopping $t'/t$", -0.4, 0.4, 0, { step: 0.01 });
        const sA = v.stage({ x: [-PI, PI], y: [-PI, PI], equal: true, height: 400, axes: 'box', gutter: true, weight: 1, xlabel: '$k_x$', ylabel: '$k_y$', title: 'Brillouin zone: occupied states and Fermi surface', xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI, '−π'], [0, '0'], [PI, 'π']] });
        const sB = v.stage({ x: [0, 2], y: [-4.6, 4.6], height: 400, axes: 'box', gutter: true, weight: 1, xlabel: 'electrons per site n', ylabel: 'μ / t', title: 'chemical potential against filling' });
        const E = (kx, ky, tp) => -2 * (Math.cos(kx) + Math.cos(ky)) - 4 * tp * Math.cos(kx) * Math.cos(ky);
        let sortKey = '', sorted = null;
        const fine = (tp, mu) => { let c = 0; const N = 300; for (let i = 0; i < N; i++) { const kx = -PI + ((i + 0.5) * TAU) / N; for (let j = 0; j < N; j++) if (E(kx, -PI + ((j + 0.5) * TAU) / N, tp) < mu) c++; } return c / (N * N); };
        let st = null;
        v.render(() => {
          const tp = tpS.value, key = tp.toFixed(3);
          if (key !== sortKey) { sortKey = key; const a = new Float64Array(NG * NG); let q = 0; for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) a[q++] = E(-PI + ((i + 0.5) * TAU) / NG, -PI + ((j + 0.5) * TAU) / NG, tp); sorted = a.sort(); }
          const mu = sorted[Math.min(NG * NG - 1, Math.floor((nS.value / 2) * NG * NG))];
          const c = v.rgb('accent'), occ = [c[0], c[1], c[2], 0.32];
          sA.raster((x, y) => (E(x, y, tp) < mu ? occ : null), { res: 2, key: `${key}|${mu.toFixed(4)}`, id: 'occ' });
          sA.contour((x, y) => E(x, y, tp), 8, { color: 'muted', width: 1, alpha: 0.35, res: 100 });
          sA.contour((x, y) => E(x, y, tp), [mu], { color: 'orange', width: 3.4, res: 200 });
          const eG = E(0, 0, tp), eX = E(PI, 0, tp), eM = E(PI, PI, tp);
          sA.dot(0, 0, { r: 4, color: 'ink' }); sA.tex('\\Gamma', 0.18, 0.2, { size: 13, color: 'ink' });
          sA.dot(PI, 0, { r: 4, color: 'ink' }); sA.tex('X', PI - 0.35, 0.28, { size: 13, color: 'ink' });
          sA.dot(PI, PI, { r: 4, color: 'ink' }); sA.tex('M', PI - 0.35, PI - 0.3, { size: 13, color: 'ink' });
          // mu(n)
          const curve = []; for (let n = 0.02; n <= 1.98; n += 0.02) curve.push([n, sorted[Math.min(NG * NG - 1, Math.floor((n / 2) * NG * NG))]]);
          sB.path(curve, { color: 'accent', width: 2.6 });
          sB.hline(eX, { color: 'red', width: 1.5, dash: [5, 4] }); sB.text('saddle point X (van Hove)', 1.98, eX + 0.3, { size: 11.5, color: 'red', align: 'right' });
          sB.dot(nS.value, mu, { r: 6.5, color: 'gold' });
          const area = fine(tp, mu), type = mu < eX - 0.05 ? 'closed **electron** orbit around $\\Gamma$' : mu > eX + 0.05 ? 'closed **hole** orbit around $M$' : '**open / saddle** orbit — the topology is changing';
          st = { mu, area, type, eG, eX, eM };
        });
        v.legend([['accent', 'occupied $E<\\mu$', { area: true }], ['orange', 'Fermi surface $E=\\mu$'], ['muted', 'other constant-energy lines']]);
        v.readout(() => {
          if (!st) return '';
          return `$\\mu=${v.fix(st.mu, 3)}\\,t$ · occupied fraction of the zone measured on a finer grid **${v.fix(st.area, 4)}** vs $n/2=${v.fix(nS.value / 2, 4)}$ · band runs from $E_\\Gamma=${v.fix(st.eG, 2)}$ to $E_M=${v.fix(st.eM, 2)}$, saddle at $E_X=${v.fix(st.eX, 2)}$ · Fermi surface: ${st.type}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Density of states and van Hove singularities',
      credit: 'Van Hove, 1953',
      statement: String.raw`The **density of states** of a band per unit cell and per spin is $g(E)=\int_{\rm BZ}\frac{d^dk}{(2\pi)^d}\,\delta\big(E-E(\mathbf k)\big)=\oint_{E(\mathbf k)=E}\frac{dS}{(2\pi)^d\,|\nabla_{\mathbf k}E|}$: the number of states in $[E,E+dE]$. It is large where the band is flat. Because $E(\mathbf k)$ is periodic on a compact zone it has, in every dimension, at least a minimum, a maximum and (for $d\ge2$) saddle points, where $\nabla_{\mathbf k}E=0$; there $g(E)$ is non-analytic — **van Hove singularities**. For a nearest-neighbour chain $g=1/(\pi\sqrt{4t^2-E^2})$ diverges at the band edges; on a square lattice $g\propto K(\sqrt{1-E^2/16t^2})$ has a logarithmic peak at the saddle energy $E=0$; in 3D $g$ is finite with square-root kinks at the critical energies.`,
      idea: String.raw`Near a critical point $E\approx E_c+\sum_i\pm\tfrac12 m_i^{-1}q_i^2$, and the volume of $k$-space between $E$ and $E+dE$ scales as $|E-E_c|^{d/2-1}$ — divergent for a 1D edge, a step for a 2D extremum, a $\sqrt{\ }$ onset in 3D. A 2D saddle has hyperbolic level curves that approach a crossing, with $|\nabla E|\to0$ along an infinite length, giving $\ln|E-E_c|$. The counting is done numerically below: histogramming $E$ over a $k$-grid is exactly this integral (qm-9.9 supplies the tight-binding bands; cm-1.1 the free-electron $g\propto E^{(d-2)/2}$).`,
      caption: String.raw`Pick a **lattice** and a **resolution** $N$ of the $k$-grid: the bars histogram the band energies over all grid points; the curve is the exact $g(E)$ (analytic in 1D and in 2D with $t'=0$; otherwise a very fine, lightly smoothed grid). The orange **probe energy** moves the constant-energy contour on the left (the dispersion in 1D/3D) and the marker on the right — watch the 2D contour change from a circle through the cross at the saddle ($\nabla E=0$) to pockets exactly where $g$ peaks. Dashed lines: critical energies.`,
      deps: ['qm-9.9', 'cm-1.1'],
      refs: ['Ashcroft–Mermin ch. 8'],
      tags: ['density of states', 'van hove singularity', 'critical points'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Van_Hove_singularity' },
      viz(v) {
        const M = v.M, CHEAD = {};
        const model = v.select('lattice', [{ value: '1', label: '1D chain' }, { value: '2', label: '2D square' }, { value: '3', label: '3D cubic' }], '2', { onChange: sync });
        const tpS = v.slider("$t'/t$ (2D)", -0.4, 0.4, 0, { step: 0.01 });
        const resS = v.slider('$k$-grid resolution', 6, 300, 60, { int: true });
        const probe = v.slider('probe energy $E$', -6, 6, -1.5, { step: 0.02 });
        function sync() { tpS.el.hidden = model.value !== '2'; }
        sync();
        const sL = v.stage({ x: [-PI, PI], y: [-PI, PI], equal: true, height: 360, axes: 'box', gutter: true, weight: 1, xlabel: '$k_x$', ylabel: '$k_y$', title: 'band $E(\\mathbf k)$' });
        const sR = v.stage({ x: [-4, 4], y: [0, 0.4], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'E / t', ylabel: 'g(E)', title: 'density of states $g(E)$' });
        const NX = (d) => (d === 1 ? resS.value * 40 : d === 2 ? resS.value : Math.round(resS.value / 3) + 4);
        const energies = (d, N, tp) => {
          const c = new Float64Array(N); for (let i = 0; i < N; i++) c[i] = Math.cos(-PI + ((i + 0.5) * TAU) / N);
          if (d === 1) return Float64Array.from(c, (x) => -2 * x);
          const out = new Float64Array(d === 2 ? N * N : N * N * N); let q = 0;
          if (d === 2) { for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) out[q++] = -2 * (c[i] + c[j]) - 4 * tp * c[i] * c[j]; }
          else for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let l = 0; l < N; l++) out[q++] = -2 * (c[i] + c[j] + c[l]);
          return out;
        };
        const hist = (vals, lo, hi, nb) => { const cnt = new Float64Array(nb), w = (hi - lo) / nb; for (const e of vals) { const b = Math.min(nb - 1, Math.floor((e - lo) / w)); if (b >= 0) cnt[b]++; } return cnt.map((c) => c / (vals.length * w)); };
        let refKey = '', ref = null, refN = 240;
        const E2 = (kx, ky, tp) => -2 * (Math.cos(kx) + Math.cos(ky)) - 4 * tp * Math.cos(kx) * Math.cos(ky);
        let st = null;
        v.render(() => {
          const d = +model.value, tp = d === 2 ? tpS.value : 0, N = NX(d), vals = energies(d, N, tp);
          const lo = d === 1 ? -2 : d === 2 ? -4 - 4 * tp : -6, hi = d === 1 ? 2 : d === 2 ? 4 - 4 * tp : 6, nb = 64, w = (hi - lo) / nb;
          // exact / reference curve
          let g, crit;
          if (d === 1) { g = (E) => (Math.abs(E) < 2 ? 1 / (PI * Math.sqrt(4 - E * E)) : NaN); crit = [[-2, 'min'], [2, 'max']]; }
          else if (d === 2) {
            crit = [[E2(0, 0, tp), 'min Γ'], [E2(PI, 0, tp), 'saddle X'], [E2(PI, PI, tp), 'max M']];
            if (Math.abs(tp) < 1e-9) g = (E) => (Math.abs(E) < 4 ? M.ellipK(1 - (E / 4) ** 2) / (2 * PI * PI) : NaN);
          } else crit = [[-6, 'min Γ'], [-2, 'saddle X'], [2, 'saddle M'], [6, 'max R']];
          if (!g) {
            const key = d + '|' + tp.toFixed(3);
            if (refKey !== key) {
              refKey = key; const Nr = d === 2 ? 800 : 128, rv = energies(d, Nr, tp), nr = 240, hh = hist(rv, lo, hi, nr), sg = d === 2 ? 0.05 : 0.09, wr = (hi - lo) / nr;
              ref = Float64Array.from(hh, (_, i) => { let a = 0, z = 0; for (let j = Math.max(0, i - 30); j < Math.min(nr, i + 31); j++) { const q = Math.exp(-0.5 * (((j - i) * wr) / sg) ** 2); a += q * hh[j]; z += q; } return a / z; });
              refN = nr;
            }
            g = (E) => { const b = Math.floor(((E - lo) / (hi - lo)) * refN); return b >= 0 && b < refN ? ref[b] : NaN; };
          }
          const bars = hist(vals, lo, hi, nb);
          let top = 0; for (let b = 1; b < nb - 1; b++) top = Math.max(top, bars[b]); top = d === 1 ? 0.5 : Math.min(top * 1.12, d === 2 ? 0.45 : 0.2);
          sR.setView([lo - 0.2, hi + 0.2], [0, Math.max(top, 0.05)]);
          sR.hist({ edges: Array.from({ length: nb + 1 }, (_, i) => lo + i * w), counts: Array.from(bars) }, { color: 'accent', fillAlpha: 0.3 });
          if (d === 1 || Math.abs(tp) < 1e-9 && d === 2) sR.fn(g, { domain: [lo + 0.002, hi - 0.002], color: 'ink', width: 2, n: 600 });
          else sR.fn(g, { domain: [lo + 0.002, hi - 0.002], color: 'ink', width: 2, n: 400 });
          for (const [e, lab] of crit) { sR.vline(e, { color: 'red', width: 1.2, dash: [4, 4] }); sR.text(lab, e, top * 0.96, { size: 10.5, color: 'red', align: e <= lo + 1e-9 ? 'left' : e >= hi - 1e-9 ? 'right' : 'center', dx: e <= lo + 1e-9 ? 4 : e >= hi - 1e-9 ? -4 : 0 }); }
          const pe = M.clamp(probe.value, lo, hi);
          sR.vline(pe, { color: 'orange', width: 2.6 });
          // left panel
          if (d === 2) {
            sL.setScale({ equal: true }); sL.setView([-PI, PI], [-PI, PI]); sL.setLabels('$k_x$', '$k_y$'); sL.setTicks(null, null);
            sL.heat((x, y) => E2(x, y, tp), { cmap: 'theme', color: 'accent', range: [lo, hi], res: 3, key: 'e2|' + tp.toFixed(3) });
            sL.contour((x, y) => E2(x, y, tp), 10, { color: 'muted', width: 1, alpha: 0.3, res: 90 });
            sL.contour((x, y) => E2(x, y, tp), [pe], { color: 'orange', width: 3.4, res: 200 });
            for (const [x, y, t] of [[0, 0, '\\Gamma'], [PI, 0, 'X'], [0, PI, 'X'], [-PI, 0, 'X'], [0, -PI, 'X'], [PI, PI, 'M'], [-PI, -PI, 'M'], [PI, -PI, 'M'], [-PI, PI, 'M']]) sL.dot(x, y, { r: 4.5, color: 'red' });
            sL.setTitle('band $E(\\mathbf k)$: critical points $\\nabla E=0$ (red)');
          } else if (d === 1) {
            sL.setScale({ equal: false }); sL.setTicks(null, null); sL.setView([-PI, PI], [-2.4, 2.4]); sL.setLabels('$k$', '$E/t$');
            sL.fn((k) => -2 * Math.cos(k), { color: 'accent', width: 2.6 });
            sL.hline(pe, { color: 'orange', width: 2.4 });
            if (Math.abs(pe) < 2) { const k = Math.acos(-pe / 2); sL.dot(k, pe, { r: 6, color: 'orange' }); sL.dot(-k, pe, { r: 6, color: 'orange' }); }
            sL.setTitle('band $E(k)=-2t\\cos k$');
          } else {
            const pts = [[0, 0, 0], [PI, 0, 0], [PI, PI, 0], [PI, PI, PI], [0, 0, 0]], P = [];
            for (let s = 0; s < 4; s++) for (let i = 0; i < 40; i++) { const a = pts[s], b = pts[s + 1], u = i / 40, kx = a[0] + (b[0] - a[0]) * u, ky = a[1] + (b[1] - a[1]) * u, kz = a[2] + (b[2] - a[2]) * u; P.push([s + u, -2 * (Math.cos(kx) + Math.cos(ky) + Math.cos(kz))]); }
            P.push([4, -6]);
            sL.setScale({ equal: false }); sL.setView([0, 4], [-6.6, 6.6]); sL.setLabels('', '$E/t$'); sL.setTicks([[0, 'Γ'], [1, 'X'], [2, 'M'], [3, 'R'], [4, 'Γ']], null);
            sL.path(P, { color: 'accent', width: 2.6 }); sL.hline(pe, { color: 'orange', width: 2.4 });
            for (const x of [1, 2, 3]) sL.vline(x, { color: 'grid', dash: [3, 4] });
            sL.setTitle('band $E(\\mathbf k)$ along $\\Gamma X M R\\Gamma$');
          }
          // numbers
          const bin = Math.min(nb - 1, Math.max(0, Math.floor((pe - lo) / w)));
          let gradMax = 0;
          const grad = (kx, ky) => { const h = 1e-5; return Math.hypot((E2(kx + h, ky, tp) - E2(kx - h, ky, tp)) / (2 * h), (E2(kx, ky + h, tp) - E2(kx, ky - h, tp)) / (2 * h)); };
          if (d === 2) for (const [x, y] of [[0, 0], [PI, 0], [0, PI], [PI, PI]]) gradMax = Math.max(gradMax, grad(x, y));
          st = { d, N, gbin: bars[bin], gexact: g(pe), gradMax, count: vals.length };
        });
        v.legend([['accent', 'histogram of band energies', { area: true }], ['ink', 'exact $g(E)$ / fine-grid reference'], ['orange', 'probe energy'], ['red', 'critical points', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `${st.count.toLocaleString('en')} $k$-points ($N=${st.N}$ per axis) · at the probe energy: histogram $g=${v.fix(st.gbin, 4)}$, reference $g=${Number.isFinite(st.gexact) ? v.fix(st.gexact, 4) : '0'}$ (states per cell per spin per $t$)` + (st.d === 2 ? ` · $\\max|\\nabla E|$ at $\\Gamma,X,M$: $${st.gradMax < 1e-7 ? '<10^{-7}' : v.sci(st.gradMax, 1)}$ (zero, as a critical point needs).` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Wannier functions',
      credit: 'Wannier, 1937',
      statement: String.raw`Let $\psi_{n\mathbf k}$ be the Bloch functions of one isolated band of a crystal with $N$ cells. The **Wannier function** centred on the lattice vector $\mathbf R$ is
$$w_n(\mathbf r-\mathbf R)=\frac1N\sum_{\mathbf k\in\mathrm{BZ}}e^{-i\mathbf k\cdot\mathbf R}\,\psi_{n\mathbf k}(\mathbf r).$$
The functions $w_n(\mathbf r-\mathbf R)$ for all $\mathbf R$ are orthonormal, are translates of one another and span exactly the same space as the band’s Bloch states, so $\psi_{n\mathbf k}=\sum_{\mathbf R}e^{i\mathbf k\cdot\mathbf R}w_n(\mathbf r-\mathbf R)$ is recovered by the inverse transform. They are **not unique**: $\psi_{n\mathbf k}\to e^{i\theta(\mathbf k)}\psi_{n\mathbf k}$ is an allowed change of phase for each $\mathbf k$ and changes $w$. A smooth (analytic) $\theta(\mathbf k)$ chosen well gives a function localized on one cell, decaying exponentially for an isolated band in 1D; an erratic choice spreads $w$ over the whole crystal.`,
      idea: String.raw`The Bloch functions of a band are an orthonormal set labelled by $\mathbf k$ in the zone, and the formula is a discrete Fourier transform from the $\mathbf k$-label to the $\mathbf R$-label, which preserves orthonormality (Parseval/Plancherel, rca-4.26). Translation by $\mathbf R'$ multiplies $\psi_{\mathbf k}$ by $e^{i\mathbf k\cdot\mathbf R'}$, which shifts the Fourier variable and so translates $w$. How far $w$ spreads depends on how smoothly $\psi_{\mathbf k}$ varies with $\mathbf k$: Fourier coefficients decay fast exactly when the function is smooth (and periodic) in $\mathbf k$ — gauge choices that are rough in $\mathbf k$ give slowly decaying tails (qm-9.7, qm-9.9).`,
      caption: String.raw`Wannier function $w_0$ built by the Fourier sum above from the **lowest band of a cosine potential** on a ring of 21 cells (Bloch functions from the plane-wave diagonalisation). Choose the **phase gauge**: *smooth* (the $k+0$ component real and positive) gives one hump on cell 0 with small oscillating tails; *twisted* multiplies each Bloch function by $e^{i\alpha\sin\pi k}$, still smooth, and the tail grows with $\alpha$; *random* phases are legitimate Bloch functions too but the Wannier function smears over the entire ring. Dashed: the neighbouring $w_1$ — their overlap is zero in every gauge.`,
      scope: String.raw`An isolated band (a gap above and below); 1D, or a band with no topological obstruction in higher dimension. Bands with a nonzero Chern number admit no exponentially localized Wannier functions at all.`,
      deps: ['qm-9.7', 'qm-9.9', 'rca-4.26'],
      refs: ['Ashcroft–Mermin ch. 10'],
      tags: ['wannier functions', 'gauge', 'localization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wannier_function' },
      viz(v) {
        const M = v.M, NC = 21, PPC = 16, XS = lin(-NC / 2, NC / 2, NC * PPC + 1), ks = Array.from({ length: NC }, (_, j) => (2 * (j - (NC - 1) / 2)) / NC);
        const gauge = v.select('phase gauge', [{ value: 'smooth', label: 'smooth' }, { value: 'twist', label: 'twisted' }, { value: 'random', label: 'random phases' }], 'smooth', { onChange: () => { aS.el.hidden = gauge.value !== 'twist'; } });
        const aS = v.slider('twist $\\alpha$', 0, 8, 3, { step: 0.05 }); aS.el.hidden = true;
        const uS = v.slider('potential strength $U$', 0.2, 1.6, 0.8, { step: 0.01 });
        const rnd = v.rng(7), RPH = ks.map(() => rnd() * TAU);
        const sW = v.stage({ x: [-6, 6], y: [-0.4, 2.6], height: 340, axes: 'box', gutter: true, full: true, xlabel: 'x / a', ylabel: '$a^{1/2}w$', title: 'Wannier function $w_0(x)$ and its neighbour' });
        const sG = v.stage({ x: [-1, 1], y: [-PI, PI], height: 220, axes: 'box', gutter: true, weight: 1, xlabel: 'k  (π/a)', ylabel: 'θ(k)', title: 'phase gauge $\\theta(k)$ applied to $\\psi_k$', yticks: [[-PI, '−π'], [0, '0'], [PI, 'π']] });
        const sD = v.stage({ x: [-NC / 2, NC / 2], y: [0, 1], height: 220, axes: 'box', gutter: true, weight: 1, xlabel: 'x / a', ylabel: '$\\log_{10}|w|^2$', title: 'tails of $|w_0|^2$ on the whole ring', ylog: false });
        let cacheKey = '', data = null;
        const theta = (k, j) => (gauge.value === 'smooth' ? 0 : gauge.value === 'twist' ? aS.value * Math.sin(PI * k) : RPH[j]);
        const build = () => {
          const key = [gauge.value, aS.value.toFixed(2), uS.value.toFixed(3)].join('|'); if (key === cacheKey) return data;
          const bl = ks.map((k) => nfeSolve(M, [-uS.value], k).C[0]), N = 6, nx = XS.length;
          // gauge: component m = 0 real and positive (eigSym only fixes the largest component, which flips beyond |k| = 1/2 at the edge)
          bl.forEach((c, j) => { const s = c[N] < 0 ? -1 : 1; for (let m = 0; m < c.length; m++) c[m] *= s; });
          const psi = ks.map((k, j) => { const re = new Float64Array(nx), im = new Float64Array(nx), th = theta(k, j), cr = Math.cos(th), ci = Math.sin(th); for (let i = 0; i < nx; i++) { const b = blochAt(bl[j], N, k, XS[i]); re[i] = b.re * cr - b.im * ci; im[i] = b.re * ci + b.im * cr; } return { re, im }; });
          const W = (R) => { const re = new Float64Array(nx), im = new Float64Array(nx); ks.forEach((k, j) => { const ph = -PI * k * R, cr = Math.cos(ph), ci = Math.sin(ph); for (let i = 0; i < nx; i++) { re[i] += (psi[j].re[i] * cr - psi[j].im[i] * ci) / NC; im[i] += (psi[j].re[i] * ci + psi[j].im[i] * cr) / NC; } }); return { re, im }; };
          const w0 = W(0), w1 = W(1), dx = XS[1] - XS[0];
          const inner = (a, b) => { let re = 0, im = 0; for (let i = 0; i < nx - 1; i++) { re += (a.re[i] * b.re[i] + a.im[i] * b.im[i]) * dx; im += (a.re[i] * b.im[i] - a.im[i] * b.re[i]) * dx; } return Math.hypot(re, im); };
          let m1 = 0, m2 = 0, nn = 0; for (let i = 0; i < nx - 1; i++) { const p = w0.re[i] ** 2 + w0.im[i] ** 2; nn += p * dx; m1 += XS[i] * p * dx; m2 += XS[i] * XS[i] * p * dx; }
          return (data = { w0, w1, norm: nn, spread: Math.sqrt(Math.max(0, m2 / nn - (m1 / nn) ** 2)), ov: inner(w0, w1), self: inner(w0, w0), xs: XS });
        };
        let st = null;
        v.render(() => {
          const D = build(), nx = XS.length;
          const sc = 1 / Math.max(...Array.from(D.w0.re, (r, i) => Math.hypot(r, D.w0.im[i]))) * 0 + 1;
          const pk = Math.max(...Array.from(D.w0.re, (r, i) => Math.hypot(r, D.w0.im[i])));
          sW.setView([-6, 6], [-0.85 * pk, 1.15 * pk]);
          sW.hline(0, { color: 'grid' });
          sW.path(XS.map((x, i) => [x, D.w1.re[i]]), { color: 'orange', width: 1.8, dash: [5, 4] });
          sW.path(XS.map((x, i) => [x, D.w0.im[i]]), { color: 'purple', width: 1.3, alpha: 0.8 });
          sW.poly([[XS[0], 0], ...XS.map((x, i) => [x, Math.hypot(D.w0.re[i], D.w0.im[i])]), [XS[nx - 1], 0]], { fill: 'accent', fillAlpha: 0.14, stroke: false });
          sW.path(XS.map((x, i) => [x, D.w0.re[i]]), { color: 'accent', width: 2.6 });
          for (let n = -6; n <= 6; n++) sW.dot(n, -0.74 * pk, { r: 3.5, color: 'muted' });
          // gauge phases
          sG.path(lin(-1, 1, 201).map((k) => [k, gauge.value === 'smooth' ? 0 : gauge.value === 'twist' ? ((aS.value * Math.sin(PI * k) + PI) % TAU + TAU) % TAU - PI : NaN]), { color: 'purple', width: 2.4 });
          if (gauge.value === 'random') sG.dots(ks.map((k, j) => [k, RPH[j] - PI]), { r: 4, color: 'purple' });
          else sG.dots(ks.map((k) => [k, gauge.value === 'smooth' ? 0 : ((aS.value * Math.sin(PI * k) + PI) % TAU + TAU) % TAU - PI]), { r: 3.5, color: 'ink' });
          // tails on the whole ring (log)
          const tail = XS.map((x, i) => [x, Math.max(1e-9, D.w0.re[i] ** 2 + D.w0.im[i] ** 2)]);
          sD.setView([-NC / 2, NC / 2], [-9, 1]);
          sD.path(tail.map(([x, y]) => [x, Math.log10(y)]), { color: 'accent', width: 2 });
          sD.setTicks(null, [[-8, '10⁻⁸'], [-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '10⁻²'], [0, '1']]);
          st = D;
        });
        v.legend([['accent', 'Re $w_0$ (area: $|w_0|$)'], ['purple', 'Im $w_0$'], ['orange', 'Re $w_1$ (next cell)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$\\int|w_0|^2=${v.fix(st.self, 4)}$ · overlap with the neighbour $|\\langle w_0|w_1\\rangle|=${v.sci(Math.max(st.ov, 1e-17), 1)}$ · spread $\\sqrt{\\langle x^2\\rangle-\\langle x\\rangle^2}=$ **${v.fix(st.spread, 2)}** cells (a ring of 21 cells would give ${v.fix(NC / Math.sqrt(12), 2)} if completely spread out).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Topological edge states: the SSH chain',
      credit: 'Su, Schrieffer and Heeger, 1979',
      statement: String.raw`Take a chain with two sites ($A$, $B$) per cell, hopping amplitude $v$ inside a cell and $w$ between neighbouring cells. In a ring the bulk bands $E=\pm|v+we^{ik}|$ are separated by a gap unless $v=w$; the complex number $h(k)=v+we^{ik}$ traces a circle as $k$ goes round the zone, with **winding number** $0$ if $v>w$ and $1$ if $v<w$ about the origin. On an **open** chain, the winding number $1$ phase has two states with energy $\approx0$ in the middle of the gap, localized on the two ends (amplitude decaying as $(v/w)^j$ from the end, only on one sublattice), while the winding-0 phase has none. The number of edge states is fixed by the bulk winding number and cannot be removed without closing the gap.`,
      idea: String.raw`With a chain ending on a weak bond ($v<w$) the end site $A_1$ is attached only through $v$; the equation $H\psi=0$ is solved exactly on one sublattice: $-v\psi_{A,j}-w\psi_{A,j+1}=0$ gives $\psi_{A,j}\propto(-v/w)^{j}$, normalizable only when $v<w$. The bulk Bloch Hamiltonian $\begin{pmatrix}0&h(k)\\h^*(k)&0\end{pmatrix}$ has the chiral symmetry (sublattice) and a topological invariant, the winding of $\arg h$; the bulk–boundary correspondence says a nonzero invariant forces zero modes on the boundary (qm-9.9 for the chain, cm-1.9 for localized orbitals). For the semi-infinite zero-mode solution, the squared amplitudes have ratio $r^2=(v/w)^2$. The geometric-series theorem (pma 3.26) gives squared norm proportional to $1/(1-r^2)$ for $0\le r<1$, and divergence for $r\ge1$. This proves normalizability at this termination, not exact zero energy for a finite chain whose two ends can hybridize.`,
      caption: String.raw`An open chain of $N$ cells, diagonalised exactly. **Left:** its energy levels (dots) against the bulk bands (shaded); the two levels in the gap are highlighted. **Middle:** the bulk $h(k)=v+we^{ik}$ in the complex plane — when the circle encloses the origin the readout winding number is 1. **Bottom:** the densities of the two end states (sublattice colours), computed from the eigenvectors. Make $w>v$: two states appear from nowhere in the gap; make $v>w$ and they disappear into the bands.`,
      scope: String.raw`Free fermions with chiral (sublattice) symmetry; the zero-energy states are exact only for a semi-infinite chain, and on a finite chain split by an energy $\sim v(v/w)^N$. Disorder preserving the symmetry does not remove them. Real polyacetylene adds electron–phonon coupling, which produces the dimerization itself.`,
      deps: ['qm-9.9', 'pma-3.26'],
      refs: ['Ashcroft–Mermin ch. 10'],
      tags: ['topological insulator', 'edge states', 'winding number'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Su%E2%80%93Schrieffer%E2%80%93Heeger_model' },
      viz(v) {
        const M = v.M;
        const vS = v.slider('intracell hopping $v$', 0.1, 2, 0.5, { step: 0.01 });
        const wS = v.slider('intercell hopping $w$', 0.1, 2, 1.1, { step: 0.01 });
        const nS = v.slider('cells $N$', 4, 24, 12, { int: true });
        const sE = v.stage({ x: [0, 1], y: [-3.4, 3.4], height: 330, axes: 'box', gutter: true, weight: 1, xlabel: 'level index', ylabel: 'E', title: 'levels of the open chain' });
        const sC = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, axes: true, weight: 0.85, title: 'bulk $h(k)=v+we^{ik}$ in the complex plane' });
        const sP = v.stage({ x: [0, 1], y: [0, 1], height: 230, axes: 'box', gutter: true, full: true, xlabel: 'site j', ylabel: '$|\\psi_j|^2$', title: 'the two states closest to $E=0$ (end-localized combinations)' });
        let st = null;
        v.render(() => {
          const vv = vS.value, ww = wS.value, N = nS.value, L = 2 * N, H = Array.from({ length: L }, () => new Array(L).fill(0));
          for (let i = 0; i < L - 1; i++) { const h = i % 2 === 0 ? vv : ww; H[i][i + 1] = H[i + 1][i] = -h; }
          const e = M.eigSym(H), idx = e.values.map((_, i) => i).sort((a, b) => e.values[a] - e.values[b]), En = idx.map((i) => e.values[i]);
          const gapBulk = Math.abs(vv - ww), top = vv + ww;
          sE.setView([-0.5, L - 0.5], [-1.15 * top, 1.15 * top]); sE.setLabels('level index', 'E');
          sE.rect(-0.5, gapBulk, L - 0.5, top, { fill: 'accent', fillAlpha: 0.12, stroke: false }); sE.rect(-0.5, -top, L - 0.5, -gapBulk, { fill: 'accent', fillAlpha: 0.12, stroke: false });
          sE.hline(0, { color: 'grid' });
          const mid = idx.map((_, j) => j).sort((a, b) => Math.abs(En[a]) - Math.abs(En[b])).slice(0, 2);
          En.forEach((E, j) => sE.dot(j, E, { r: mid.includes(j) && Math.abs(E) < gapBulk * 0.5 && gapBulk > 1e-6 ? 6 : 3.6, color: mid.includes(j) && Math.abs(E) < gapBulk * 0.5 ? 'gold' : 'accent' }));
          sE.text('bulk bands (shaded)', 0, top * 1.07, { size: 11, color: 'muted', align: 'left' });
          // winding
          const pts = lin(0, TAU, 181).map((k) => [vv + ww * Math.cos(k), ww * Math.sin(k)]);
          let tot = 0; for (let i = 0; i < pts.length - 1; i++) { let d = Math.atan2(pts[i + 1][1], pts[i + 1][0]) - Math.atan2(pts[i][1], pts[i][0]); while (d > PI) d -= TAU; while (d < -PI) d += TAU; tot += d; }
          const W = Math.round(tot / TAU);
          sC.path(pts, { color: W ? 'green' : 'red', width: 2.8 }); sC.dot(0, 0, { r: 6, color: 'ink' }); sC.tex('0', 0.2, -0.3, { size: 12, color: 'ink' });
          sC.dot(vv + ww, 0, { r: 4.5, color: 'gold' }); sC.text('k = 0', vv + ww + 0.1, 0.25, { size: 10.5, color: 'muted' });
          // edge combinations
          const u1 = e.vecs[idx[mid[0]]], u2 = e.vecs[idx[mid[1]]];
          const a = u1.map((x, i) => (x + u2[i]) / Math.SQRT2), b = u1.map((x, i) => (x - u2[i]) / Math.SQRT2);
          const sub = (c) => c.map((x, i) => (i % 2 === 0 ? x : 0)), subB = (c) => c.map((x, i) => (i % 2 === 1 ? x : 0));
          const leftA = a.reduce((s, x, i) => s + (i % 2 ? 0 : x * x), 0) > a.reduce((s, x, i) => s + (i % 2 ? x * x : 0), 0);
          const pA = leftA ? a : b, pB = leftA ? b : a;
          sP.setView([-0.5, L - 0.5], [0, Math.max(...pA.map((x) => x * x), ...pB.map((x) => x * x), 0.05) * 1.2]);
          for (let i = 0; i < L; i++) {
            const A = pA[i] ** 2, B = pB[i] ** 2;
            sP.rect(i - 0.38, 0, i, A, { fill: 'accent', fillAlpha: 0.7, color: 'accent' });
            sP.rect(i, 0, i + 0.38, B, { fill: 'orange', fillAlpha: 0.7, color: 'orange' });
          }
          for (let c = 0; c < N; c++) sP.rect(2 * c - 0.45, -0.0, 2 * c + 1.45, 0.0, { color: 'grid' });
          const edge = En[mid[0]], edge2 = En[mid[1]];
          st = { W, gapBulk, E1: edge, E2: edge2, nEdge: En.filter((E) => Math.abs(E) < gapBulk * 0.5).length };
        });
        v.legend([['accent', 'combination $(\\psi_1+\\psi_2)/\\sqrt2$ or its mirror'], ['orange', 'the other combination'], ['green', 'winding 1'], ['red', 'winding 0']]);
        v.readout(() => {
          if (!st) return '';
          return `bulk gap $2|v-w|=${v.fix(2 * st.gapBulk, 3)}$ · winding number of $h(k)$ about the origin: **${st.W}** (${vS.value < wS.value ? '$v<w$' : '$v>w$'}) · states inside the gap: **${st.nEdge}** (energies $${v.sci(st.E1, 2)}$ and $${v.sci(st.E2, 2)}$) — the count equals $2\\times$winding.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Anderson localization',
      credit: 'Anderson, 1958',
      statement: String.raw`In a tight-binding chain $\varepsilon_j\psi_j-t(\psi_{j+1}+\psi_{j-1})=E\psi_j$ with random on-site energies $\varepsilon_j$ drawn independently from $[-W/2,W/2]$, the eigenstates are no longer Bloch waves. In one dimension (and, by the scaling theory, in two for non-interacting spinless electrons) **every** eigenstate is exponentially localized for any $W>0$: $|\psi_j|\sim e^{-|j-j_0|/\xi}$, with a localization length $\xi(E,W)$ that, for weak disorder, is $\xi\simeq 24(4t^2-E^2)/W^2$ (96 $t^2/W^2$ at the band centre), so $\xi\propto W^{-2}$. A localized electron cannot carry a current at zero temperature: the disordered chain is an insulator. In three dimensions the states in the band tails localize first, and a mobility edge separates localized from extended states.`,
      idea: String.raw`The state’s amplitude along the chain obeys the transfer-matrix recursion $\psi_{j+1}=(\varepsilon_j-E)\psi_j-\psi_{j-1}$ ($t=1$), a product of random $2\times2$ matrices of determinant 1; by the Furstenberg theorem such a product grows exponentially at a deterministic rate $\gamma=1/\xi>0$ (the Lyapunov exponent), so a solution that is bounded at $-\infty$ must blow up at $+\infty$ except at special energies, whose eigenfunctions decay on both sides. Weak disorder scatters Bloch waves with a mean free path $\ell\sim\xi/2$ (the reflections add up coherently in 1D). The weak-disorder formula comes from second-order perturbation theory in $W$ (Thouless).`,
      caption: String.raw`A chain of 90 sites with random on-site energies (fixed random numbers scaled by $W$; **Resample** draws new ones). Top left: $|\psi_n|^2$ of the **selected eigenstate**, found by exact diagonalisation. Top right: the same on a log scale, with the decay $e^{-2|j-j_0|/\xi}$ predicted from the transfer-matrix Lyapunov exponent on a 20 000-site chain (gold). Bottom: $\xi$ against $W$ for the selected energy, computed by transfer matrices (green), against the weak-disorder law (dashed); where $\xi$ exceeds the 90 sites of the sample the state still fills the chain.`,
      scope: String.raw`Non-interacting particles with uncorrelated static disorder. With correlated disorder (random dimers) or interactions the story changes; in 3D there is a genuine transition at $W_c\approx16.5\,t$ for the box distribution.`,
      deps: ['qm-9.9'],
      refs: ['Kittel ch. 19'],
      tags: ['anderson localization', 'disorder', 'transfer matrix'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Anderson_localization' },
      viz(v) {
        const M = v.M, L = 90, NLONG = 20000;
        let seed = 11, U = null, long = null;
        const draw = (s) => { const r = v.rng(s); U = Array.from({ length: L }, () => r() - 0.5); long = Float64Array.from({ length: NLONG }, () => r() - 0.5); };
        draw(seed);
        const wS = v.slider('disorder $W/t$', 0, 6, 2, { step: 0.05 });
        const nS = v.slider('eigenstate (by energy)', 1, L, 45, { int: true });
        v.button('Resample', () => { seed += 1; draw(seed); cacheKey = ''; });
        const sA = v.stage({ x: [0, L + 1], y: [0, 1], height: 250, axes: 'box', gutter: true, weight: 1, xlabel: 'site j', ylabel: '$|\\psi_j|^2$', title: 'selected eigenstate' });
        const sB = v.stage({ x: [0, L + 1], y: [-12, 0], height: 250, axes: 'box', gutter: true, weight: 1, xlabel: 'site j', ylabel: '$\\log_{10}|\\psi_j|^2$', title: 'logarithm: exponential tails' });
        const sX = v.stage({ x: [0, 6], y: [0, 3.2], height: 260, axes: 'box', gutter: true, full: true, xlabel: 'disorder W / t', ylabel: 'ξ (sites, log scale)', title: 'localization length against disorder', xticks: [0, 1, 2, 3, 4, 5, 6], yticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']] });
        let cacheKey = '', eig = null;
        const lyap = (E, W) => { let a = 1, b = 0, s = 0; for (let n = 0; n < NLONG; n++) { const c = (W * long[n] - E) * a - b; b = a; a = c; const m = Math.hypot(a, b); if (m > 1e100 || m < 1e-100 || (n & 63) === 0) { s += Math.log(m); a /= m; b /= m; } } return s / NLONG; };
        let st = null;
        v.render(() => {
          const W = wS.value, key = seed + '|' + W.toFixed(3);
          if (key !== cacheKey) {
            cacheKey = key; const H = Array.from({ length: L }, () => new Array(L).fill(0));
            for (let i = 0; i < L; i++) { H[i][i] = W * U[i]; if (i < L - 1) H[i][i + 1] = H[i + 1][i] = -1; }
            const e = M.eigSym(H), ord = e.values.map((_, i) => i).sort((a, b) => e.values[a] - e.values[b]);
            eig = { E: ord.map((i) => e.values[i]), psi: ord.map((i) => e.vecs[i]) };
          }
          const k = nS.value - 1, E = eig.E[k], psi = eig.psi[k], rho = psi.map((x) => x * x);
          const j0 = rho.indexOf(Math.max(...rho));
          sA.setView([0, L + 1], [0, Math.max(...rho) * 1.15]);
          for (let j = 0; j < L; j++) sA.rect(j + 0.6, 0, j + 1.4, rho[j], { fill: 'accent', fillAlpha: 0.65, color: 'accent', width: 0.5 });
          sA.dot(j0 + 1, rho[j0], { r: 4.5, color: 'gold' });
          sB.path(rho.map((r, j) => [j + 1, Math.log10(Math.max(r, 1e-14))]), { color: 'accent', width: 2 });
          const gam = Math.abs(lyap(E, W)), xi = W < 0.05 ? Infinity : 1 / gam;
          if (Number.isFinite(xi)) { const y0 = Math.log10(rho[j0]), s = (2 / xi) / Math.LN10; sB.line(j0 + 1, y0, 0, y0 + s * (j0 + 1), { color: 'gold', width: 2, dash: [5, 4] }); sB.line(j0 + 1, y0, L + 1, y0 - s * (L - j0), { color: 'gold', width: 2, dash: [5, 4] }); }
          sB.dot(j0 + 1, Math.log10(rho[j0]), { r: 4.5, color: 'gold' });
          const PR = 1 / rho.reduce((s, r) => s + r * r, 0);
          // xi(W)
          const Ws = lin(0.4, 6, 29), xs = Ws.map((w) => [w, Math.log10(Math.min(1e3, 1 / Math.abs(lyap(E, w))))]);
          sX.hline(Math.log10(L), { color: 'muted', width: 1.3, dash: [4, 4] }); sX.text('sample size L = 90', 5.95, Math.log10(L) + 0.12, { size: 11, color: 'muted', align: 'right' });
          sX.fn((w) => Math.log10(Math.min(1e3, (24 * (4 - E * E)) / (w * w))), { domain: [0.4, 6], color: 'ink', width: 2, dash: [5, 4] });
          sX.path(xs, { color: 'green', width: 2.8 });
          if (W >= 0.4) sX.dot(W, Math.log10(Math.min(1e3, xi)), { r: 6.5, color: 'gold' });
          st = { E, xi, PR, th: (24 * (4 - E * E)) / Math.max(1e-9, W * W), W };
        });
        v.legend([['accent', 'eigenstate'], ['gold', 'decay from the Lyapunov exponent', { dash: true }], ['green', 'ξ from transfer matrices'], ['ink', '24(4t²−E²)/W²', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$E=${v.fix(st.E, 3)}\\,t$ · localization length from the Lyapunov exponent **${Number.isFinite(st.xi) ? v.fix(st.xi, 1) : '∞'}** sites vs weak-disorder $24(4t^2-E^2)/W^2=${st.W > 0.05 ? v.fix(st.th, 1) : '∞'}$ · participation length of this state $1/\\sum|\\psi_j|^4=${v.fix(st.PR, 1)}$ sites (sample: 90).`;
        });
      },
    },
  ],
};
