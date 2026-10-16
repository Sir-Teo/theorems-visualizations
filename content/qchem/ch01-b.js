// Quantum Chemistry & Spectroscopy — Chapter 1, part b: items 1.10–1.14 (1.1–1.7 and 1.9 are in ch01.js; 1.8 is cross-listed from qm-4.4)
import { TAU, grid, normalize, interp, phaseLUT, drawPsi, drawReal, phaseWheel, hermiteFns, boxPsi, fz, sub, FAMILY, units } from './ch01.shared.js';

const fmtTime = (ps) => (ps < 1e-3 ? `${(ps * 1e3).toFixed(2)} fs` : ps < 1 ? `${(ps * 1e3).toFixed(0)} fs` : ps < 1e3 ? `${ps.toFixed(1)} ps` : ps < 1e6 ? `${(ps / 1e3).toFixed(1)} ns` : ps < 1e9 ? `${(ps / 1e6).toFixed(1)} µs` : `${(ps / 1e9).toFixed(1)} ms`);

export default {
  collection: 'qchem',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Commutators and the uncertainty principle',
      credit: 'Kennard, 1927; Robertson, 1929',
      statement: String.raw`The **commutator** of two operators is $[\hat A,\hat B]=\hat A\hat B-\hat B\hat A$. Observables with $[\hat A,\hat B]=0$ have a common set of eigenstates and can be sharp together; if they do not commute, then for every state
$$\Delta A\,\Delta B\;\ge\;\tfrac12\,\big|\langle[\hat A,\hat B]\rangle\big|,\qquad \Delta A=\sqrt{\langle\hat A^2\rangle-\langle\hat A\rangle^2}.$$
For position and momentum $[\hat x,\hat p]=i\hbar$, so $\Delta x\,\Delta p\ge\hbar/2$, with equality only for a Gaussian wave packet (with no phase chirp). For the spin components of a spin-½ particle $[\hat S_x,\hat S_y]=i\hbar\hat S_z$ and the bound depends on the state: $\Delta S_x\Delta S_y\ge\tfrac\hbar2|\langle S_z\rangle|$.`,
      idea: String.raw`Put $\hat a=\hat A-\langle A\rangle$, $\hat b=\hat B-\langle B\rangle$. The Cauchy–Schwarz inequality gives $\Delta A^2\Delta B^2=\|a\psi\|^2\|b\psi\|^2\ge|\langle a\psi|b\psi\rangle|^2$, and the right side is at least the square of the imaginary part $\frac1{2i}\langle[\hat a,\hat b]\rangle$ (Hermitian operators, 1.3). For $x$ and $p$ the position and momentum wave functions are Fourier transforms of each other, so squeezing one necessarily spreads the other. Equality needs $\hat b\psi\propto i\hat a\psi$, a Gaussian.`,
      caption: String.raw`Choose a **wave-packet shape** and drag its **width $\sigma$**: the momentum distribution (computed by an FFT of $\psi$) widens as the position distribution narrows, yet $\Delta x\,\Delta p$ (right) stays on or above the line $\hbar/2$ — touching it only for the Gaussian. A phase **chirp** or a non-Gaussian shape lifts the product. Switch to **spin components** and tilt the spin on the Bloch sphere: the bound $\frac12|\langle[S_x,S_y]\rangle|$ moves with the state, and is attained only when the spin lies in a coordinate plane.`,
      deps: ['qchem-1.3', 'qm-5.10'],
      refs: ['McQuarrie ch. 4'],
      tags: ['uncertainty principle', 'commutator', 'Fourier transform'],
      viz(v) {
        const M = v.M, NX = 2048, XL = 40, { x, dx } = grid(-XL, XL, NX + 1);
        const xg = x.subarray(0, NX);
        const pair = v.select('pair of observables', [{ value: 'xp', label: 'position & momentum' }, { value: 'spin', label: 'spin components $S_x$, $S_y$' }], 'xp', { onChange: () => sync() });
        const shape = v.select('wave packet', [{ value: 'g', label: 'Gaussian' }, { value: 'c', label: 'chirped Gaussian' }, { value: 's', label: 'sech' }, { value: 'b', label: 'two bumps' }], 'g', { onChange: () => sync() });
        const sig = v.slider('width $\\sigma_x$ (units of $a$)', 0.3, 3, 1, { step: 0.01 });
        const chirp = v.slider('chirp', 0, 2, 1, { step: 0.01 });
        const thS = v.slider('spin polar angle $\\theta$', 0, Math.PI, 1.0, { step: 0.01 });
        const phS = v.slider('spin azimuth $\\varphi$', 0, TAU, 0.6, { step: 0.01 });
        const s1 = v.stage({ x: [-8, 8], y: [0, 0.5], height: 280, axes: 'box', gutter: true, weight: 1, xlabel: 'x / a', ylabel: '|ψ|²', title: 'position distribution' });
        const s2 = v.stage({ x: [-4, 4], y: [0, 0.5], height: 280, axes: 'box', gutter: true, weight: 1, xlabel: 'p / (ħ/a)', ylabel: '|φ|²', title: 'momentum distribution (FFT of ψ)' });
        const s3 = v.stage({ x: [0.3, 4.7], y: [0, 1.6], height: 280, axes: 'box', gutter: true, weight: 0.8, xticks: [[1, 'Gaussian'], [2, 'chirped'], [3, 'sech'], [4, 'two bumps']], ylabel: 'Δx Δp / ħ', title: 'uncertainty product for each shape' });
        const sB = v.stage3d({ range: 1.55, height: 300, weight: 1, title: 'spin ½ state on the Bloch sphere' });
        const sBar = v.stage({ x: [0.3, 4.7], y: [0, 0.6], height: 300, axes: 'box', gutter: true, weight: 1, xticks: [[1, 'ΔSₓ'], [2, 'ΔS_y'], [3, 'ΔSₓΔS_y'], [4, '½|⟨S_z⟩|']], ylabel: 'units of ħ', title: 'spin uncertainty and its lower bound' });
        function sync() {
          const sp = pair.value === 'spin';
          for (const c of [s1, s2, s3]) c.el.hidden = sp;
          sB.el.hidden = !sp; sBar.el.hidden = !sp;
          shape.el.hidden = sp; sig.el.hidden = sp; chirp.el.hidden = sp || shape.value !== 'c';
          thS.el.hidden = !sp; phS.el.hidden = !sp;
          v.invalidate();
        }
        const build = (kind, s, ch) => {
          const re = new Float64Array(NX), im = new Float64Array(NX);
          for (let i = 0; i < NX; i++) {
            const X = xg[i];
            if (kind === 'g' || kind === 'c') { const a = Math.exp(-(X * X) / (4 * s * s)), ph = kind === 'c' ? (ch * X * X) / (4 * s * s) : 0; re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph); }
            else if (kind === 's') { const w = (2 * Math.sqrt(3) * s) / Math.PI; re[i] = 1 / Math.cosh(X / w); }
            else { const d = 3 * s; re[i] = Math.exp(-((X - d) ** 2) / (4 * s * s)) + Math.exp(-((X + d) ** 2) / (4 * s * s)); }
          }
          normalize(re, im, dx);
          const R = Float64Array.from(re), I = Float64Array.from(im);
          M.fft(R, I);
          // momentum grid: k_j = 2π j/(N dx), j in −N/2..N/2−1 after the shift
          const dp = TAU / (NX * dx), P = new Float64Array(NX), pc = new Float64Array(NX);
          let tot = 0;
          for (let j = 0; j < NX; j++) { const jj = j < NX / 2 ? j : j - NX; pc[j] = jj * dp; P[j] = R[j] * R[j] + I[j] * I[j]; tot += P[j]; }
          let mp = 0, mp2 = 0; for (let j = 0; j < NX; j++) { const w = P[j] / tot; mp += w * pc[j]; mp2 += w * pc[j] * pc[j]; }
          let mx = 0, mx2 = 0; for (let i = 0; i < NX; i++) { const w = (re[i] ** 2 + im[i] ** 2) * dx; mx += w * xg[i]; mx2 += w * xg[i] * xg[i]; }
          return { re, im, P, pc, tot, dp, dX: Math.sqrt(mx2 - mx * mx), dP: Math.sqrt(mp2 - mp * mp), mx, mp };
        };
        let st = null;
        v.render(() => {
          if (pair.value === 'spin') {
            const th = thS.value, ph = phS.value, n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
            const Q = v.quantum();
            Q.bloch(sB, { theta: th, phi: ph }, {});
            const dSx = 0.5 * Math.sqrt(Math.max(0, 1 - n[0] ** 2)), dSy = 0.5 * Math.sqrt(Math.max(0, 1 - n[1] ** 2)), bound = 0.25 * Math.abs(n[2]);
            const cols = ['accent', 'orange', 'green', 'red'], vals = [dSx, dSy, dSx * dSy, bound];
            sBar.hline(0, { color: 'faint' });
            vals.forEach((q, i) => { sBar.rect(i + 0.6, 0, i + 1.4, q, { fill: cols[i], fillAlpha: 0.5, color: cols[i], width: 1.2 }); sBar.text(v.fix(q, 3), i + 1, q, { size: 11.5, color: 'ink', align: 'center', dy: -9 }); });
            st = { spin: true, dSx, dSy, prod: dSx * dSy, bound, n };
            return;
          }
          const kind = shape.value, s = sig.value, ch = chirp.value, D = build(kind, s, ch);
          const xr = Math.max(5, 4.6 * D.dX), pr = Math.max(2.6, 4.6 * D.dP);
          let pk = 0; for (let i = 0; i < NX; i++) pk = Math.max(pk, D.re[i] ** 2 + D.im[i] ** 2);
          s1.setView([-xr, xr], [0, pk * 1.3]);
          s1.path(Array.from(xg, (X, i) => [X, D.re[i] ** 2 + D.im[i] ** 2]), { color: 'accent', width: 2.4 });
          const pts = []; for (let i = 0; i < NX; i++) pts.push([xg[i], D.re[i] ** 2 + D.im[i] ** 2]);
          s1.poly([[xg[0], 0], ...pts, [xg[NX - 1], 0]], { fill: 'accent', fillAlpha: 0.14, stroke: false });
          s1.measure(D.mx - D.dX, pk * 1.18, D.mx + D.dX, pk * 1.18, 'Δx');
          // momentum distribution (ordered)
          const order = Array.from({ length: NX }, (_, j) => j).sort((a, b) => D.pc[a] - D.pc[b]);
          const dens = order.map((j) => D.P[j] / D.tot / D.dp);
          let pm = 0; for (const q of dens) pm = Math.max(pm, q);
          s2.setView([-pr, pr], [0, pm * 1.3]);
          const pp = order.map((j, k) => [D.pc[j], dens[k]]);
          s2.poly([[pp[0][0], 0], ...pp, [pp[NX - 1][0], 0]], { fill: 'orange', fillAlpha: 0.16, stroke: false });
          s2.path(pp, { color: 'orange', width: 2.4 });
          s2.measure(D.mp - D.dP, pm * 1.18, D.mp + D.dP, pm * 1.18, 'Δp');
          // bars for the four shapes
          const prods = ['g', 'c', 's', 'b'].map((k2) => { const d = build(k2, s, ch); return d.dX * d.dP; });
          s3.hline(0.5, { color: 'green', width: 2, dash: [6, 4] }); s3.text('ħ/2', 4.68, 0.5, { size: 11, color: 'green', align: 'right', dy: -9 });
          prods.forEach((q, i) => { const on = 'gcsb'[i] === kind; s3.rect(i + 0.62, 0, i + 1.38, q, { fill: on ? 'gold' : 'purple', fillAlpha: on ? 0.55 : 0.3, color: on ? 'gold' : 'purple', width: 1.2 }); s3.text(v.fix(q, 3), i + 1, q, { size: 11.5, color: 'ink', align: 'center', dy: -9 }); });
          st = { spin: false, dX: D.dX, dP: D.dP, prod: D.dX * D.dP, kind, ch };
        });
        v.legend([['accent', '$|\\psi(x)|^2$', { area: true }], ['orange', '$|\\varphi(p)|^2$', { area: true }], ['green', 'lower bound', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.spin) return `$\\langle S\\rangle=\\tfrac\\hbar2(${v.fix(st.n[0], 2)},${v.fix(st.n[1], 2)},${v.fix(st.n[2], 2)})$ · $\\Delta S_x\\Delta S_y=${v.fix(st.prod, 4)}\\hbar^2$ ≥ $\\tfrac12|\\langle[S_x,S_y]\\rangle|=\\tfrac\\hbar2|\\langle S_z\\rangle|=${v.fix(st.bound, 4)}\\hbar^2$ — ${st.prod - st.bound < 1e-9 ? 'equality (spin in the $xz$ or $yz$ plane)' : 'inequality strict'}; $[S_x,S_y]=i\\hbar S_z$.`;
          return `$\\Delta x=${v.fix(st.dX, 3)}\\,a$, $\\Delta p=${v.fix(st.dP, 3)}\\,\\hbar/a$ → $\\Delta x\\,\\Delta p=${v.fix(st.prod, 4)}\\,\\hbar$ ${st.prod < 0.5 - 1e-6 ? '**< ħ/2: impossible, check numerics**' : st.prod < 0.5 + 1e-4 ? '= ħ/2 (the minimum: a Gaussian)' : '> ħ/2'} · $[\\hat x,\\hat p]=i\\hbar$ so the bound is $\\tfrac12|\\langle i\\hbar\\rangle|=\\hbar/2$.`;
        });
        sync();
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Tunnelling and the ammonia inversion',
      credit: 'Hund, 1927 (double-well tunnelling); ammonia maser, Gordon–Zeiger–Townes, 1954',
      statement: String.raw`In a symmetric double well the two lowest levels are a nearly degenerate pair: an even ground state $\psi_0$ and an odd state $\psi_1$, split by a **tunnelling splitting** $\Delta E=E_1-E_0$ that falls roughly exponentially with the barrier height and width and with the square root of the mass. A state prepared in one well, $(\psi_0+\psi_1)/\sqrt2$, is not stationary: it passes through the barrier and oscillates between the wells with period $h/\Delta E$. Ammonia, whose N atom flips through the plane of the three H atoms, is the standard example: $\Delta E\approx0.79\ \text{cm}^{-1}$ ($23.79$ GHz, a 42 ps period), through a barrier of about $2000\ \text{cm}^{-1}$; for ND$_3$ the splitting drops to $0.053\ \text{cm}^{-1}$.`,
      scope: String.raw`A one-dimensional model of a one-coordinate motion; real ammonia has a reaction path in which all atoms move. The model here is **illustrative**: a quartic double well with minima at ±0.38 Å (the N–plane distance of NH$_3$) and barrier 2020 cm$^{-1}$, with the effective mass tuned (2.81 u) so that the splitting is 0.79 cm$^{-1}$.`,
      idea: String.raw`Solve (1.1) for the double well: if the wells were isolated each would have the same level $E_L=E_R$; the real eigenstates are the symmetric and antisymmetric combinations, whose energies differ by twice the coupling through the barrier. Under the barrier $\psi\sim e^{-\kappa x}$ with $\kappa=\sqrt{2m(V-E)}/\hbar$, so the coupling is $\propto e^{-\int\kappa\,dx}$, exponentially small in barrier width times $\sqrt{m V_b}$. Tunnelling is a purely wave-mechanical effect: classically the molecule at this energy could never invert.`,
      caption: String.raw`**Raise the barrier** (cm$^{-1}$): the two lowest levels (blue even, orange odd) crowd together and the splitting on the right falls by orders of magnitude on the log plot. **Heavier mass** (button: an ND$_3$-like factor) slows tunnelling. Below, the gold curve is the density of the state prepared in the left well: it sloshes through the barrier at the computed period $h/\Delta E$. The hollow marker is the measured NH$_3$ splitting at the tuned barrier; the square is the measured ND$_3$ value.`,
      deps: ['qchem-1.4', 'qm-3.17'],
      refs: ['McQuarrie ch. 4', 'Townes & Schawlow, Microwave Spectroscopy (1955)'],
      tags: ['tunnelling', 'double well', 'inversion splitting'],
      viz(v) {
        const M = v.M, U = units(M), HB = Math.sqrt(U.hbar2_uA2), X0 = 0.38, MU0 = 2.8116, VB0 = 2020, NG = 1100, T = 12;
        const vS = v.slider('barrier height $V_b$ (cm⁻¹)', 300, 6000, VB0, { log: true, sig: 3 });
        const mS = v.slider('effective mass (u)', 1.4, 7, MU0, { step: 0.01 });
        v.button('Tuned NH₃ model', () => { vS.set(VB0); mS.set(MU0); });
        v.button('ND₃-like mass (×1.64)', () => { vS.set(VB0); mS.set(MU0 * 1.64); });
        const solve = (Vb, mu, k = 4) => { const V = (X) => Vb * ((X / X0) ** 2 - 1) ** 2; return M.schrodinger1D(V, [-1.5, 1.5], { n: NG, k, mass: mu, hbar: HB }); };
        let scanKey = '', scan = null;
        const scanFor = (mu) => {
          const key = mu.toFixed(3); if (scanKey === key) return scan;
          const pts = []; for (let i = 0; i <= 28; i++) { const Vb = 300 * Math.pow(20, i / 28), E = solve(Vb, mu, 2).E; pts.push([Vb, E[1] - E[0]]); }
          scanKey = key; return (scan = pts);
        };
        const sA = v.stage({ x: [-1.2, 1.2], y: [0, 3000], height: 360, axes: 'box', gutter: true, weight: 1.2, xlabel: 'inversion coordinate x (Å)', ylabel: 'E (cm⁻¹)', title: 'double well, lowest levels, and a state prepared on the left' });
        const sB = v.stage({ x: [300, 6000], y: [1e-4, 100], xlog: true, ylog: true, height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'barrier height (cm⁻¹)', ylabel: 'splitting E₁ − E₀ (cm⁻¹)', title: 'tunnelling splitting against barrier height' });
        const sT = v.stage({ x: [0, 2], y: [0, 1], height: 190, axes: 'box', gutter: true, full: true, xlabel: 't / period', ylabel: 'P(left well)', title: 'population of the left well' });
        let sol = null, key = '';
        const getSol = () => { const k = `${vS.value.toFixed(2)}|${mS.value.toFixed(3)}`; if (k !== key) { sol = solve(vS.value, mS.value); key = k; const x = sol.x, dx = x[1] - x[0]; let I = 0; for (let i = 0; i < x.length; i++) if (x[i] < 0) I += sol.psi[0][i] * sol.psi[1][i] * dx; if (I < 0) for (let i = 0; i < x.length; i++) sol.psi[1][i] *= -1; I = Math.abs(I); sol.I = I; } return sol; };
        let st = null;
        v.animate((t) => {
          const S = getSol(), Vb = vS.value, mu = mS.value, x = S.x, E = S.E, dE = E[1] - E[0], col = phaseLUT(v);
          const top = Math.max(1.35 * Vb, E[3] * 1.12), YT = Math.min(top, 1.9 * Vb + 200);
          sA.setView([-1.2, 1.2], [-0.05 * Vb, YT]);
          const Vg = Float64Array.from(x, (X) => Vb * ((X / X0) ** 2 - 1) ** 2);
          const pts = Array.from(x, (X, i) => [X, Math.min(Vg[i], YT * 3)]);
          sA.clip(() => { sA.poly([[x[0], -0.05 * Vb - 1], ...pts, [x[x.length - 1], -0.05 * Vb - 1]], { fill: 'muted', fillAlpha: 0.12, stroke: false }); sA.path(pts, { color: 'muted', width: 2 }); });
          const amp = 0.2 * Vb / Math.max(...S.psi[0].map(Math.abs));
          [0, 1, 2, 3].forEach((k) => { sA.line(-1.15, E[k], 1.15, E[k], { color: k < 2 ? 'ink' : 'muted', width: k < 2 ? 1.4 : 1, dash: [4, 3], alpha: 0.7 }); sA.text(`E${sub(k)}`, 1.18, E[k], { size: 11, color: 'muted', align: 'right', baseline: 'middle', dy: -8 }); });
          sA.clip(() => {
            sA.path(Array.from(x, (X, i) => [X, E[0] + amp * S.psi[0][i]]), { color: 'accent', width: 2.2 });
            sA.path(Array.from(x, (X, i) => [X, E[1] + amp * S.psi[1][i]]), { color: 'orange', width: 2.2 });
          });
          // prepared state
          const tau = 1 / (2.99792458e-2 * dE);   // ps per period: 1/(c·ΔE), c = 0.0299792458 cm/ps
          const tt = (t / T) * 2, ph = TAU * tt;
          const dens = Float64Array.from(x, (X, i) => { const a = S.psi[0][i], b = S.psi[1][i]; return 0.5 * (a * a + b * b + 2 * a * b * Math.cos(ph)); });
          let dm = 0; for (const q of dens) dm = Math.max(dm, q);
          const dscale = (0.34 * Vb) / dm; // fixed height scale for the density
          sA.clip(() => sA.path(Array.from(x, (X, i) => [X, -0.0 * Vb + dscale * dens[i]]), { color: 'gold', width: 2.4 }));
          // scan
          const sc = scanFor(mu);
          sB.path(sc, { color: 'accent', width: 2.4 });
          sB.dot(Vb, dE, { r: 6, color: 'gold' });
          sB.dot(VB0, 0.79, { r: 6, hollow: true, color: 'green' }); sB.text('NH₃ measured, 0.79', VB0, 0.79, { size: 11, color: 'green', align: 'left', dx: 9, dy: -2 });
          sB.dot(VB0, 0.053, { r: 5, color: 'red', hollow: true }); sB.text('ND₃ measured, 0.053', VB0, 0.053, { size: 11, color: 'red', align: 'left', dx: 9, dy: 8 });
          // population of the left well
          sT.path(Array.from({ length: 241 }, (_, i) => { const q = (i / 240) * 2; return [q, 0.5 + S.I * Math.cos(TAU * q)]; }), { color: 'gold', width: 2.2 });
          sT.hline(0.5, { color: 'faint' }); sT.vline(tt, { color: 'ink', width: 1, alpha: 0.5 });
          sT.dot(tt, 0.5 + S.I * Math.cos(ph), { r: 5, color: 'gold' });
          sT.corner(`one period = ${fmtTime(tau)}`, 'tr', { color: 'muted' });
          st = { Vb, mu, dE, E, tau, I: S.I, ground: E[2] - E[0], dbl: E[3] - E[2] };
        }, { period: T, still: 0.45 * T });
        v.legend([['accent', '$\\psi_0$ (even)'], ['orange', '$\\psi_1$ (odd)'], ['gold', 'density of $(\\psi_0+\\psi_1)/\\sqrt2$']]);
        v.readout(() => st && `$V_b=${v.fix(st.Vb, 0)}$ cm$^{-1}$, $m=${v.fix(st.mu, 2)}$ u: **$E_1-E_0=${st.dE < 0.01 ? v.sci(st.dE, 2) : v.fix(st.dE, st.dE < 1 ? 3 : 2)}$ cm$^{-1}$** → inversion frequency $c\\,\\Delta E=${v.fix(29.9792458 * st.dE, st.dE < 0.1 ? 2 : 1)}$ GHz, period ${fmtTime(st.tau)} · the upper doublet is split by ${v.fix(st.dbl, 1)} cm$^{-1}$ (measured NH$_3$: ≈ 36), $E_2-E_0=${v.fix(st.ground, 0)}$ cm$^{-1}$ (measured umbrella mode: 932 cm$^{-1}$).\nMeasured values: NH$_3$ 0.79 cm$^{-1}$, ND$_3$ 0.053 cm$^{-1}$ (literature); barrier ≈ 2020 cm$^{-1}$. The model here is illustrative.`);
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Postulate',
      name: 'Expectation values and measurement',
      statement: String.raw`A measurement of an observable $\hat A$ on a system in the normalized state $\psi$ can only return one of the eigenvalues $a_k$ of $\hat A$. If $\psi=\sum_kc_k\varphi_k$ is expanded in the orthonormal eigenfunctions of $\hat A$, the outcome $a_k$ occurs with probability $|c_k|^2$, and immediately afterwards the system is in the state $\varphi_k$ (collapse): repeating the measurement at once gives the same result. The mean over many identically prepared systems is the **expectation value**
$$\langle A\rangle=\int\bar\psi\,\hat A\,\psi\,dx=\sum_k|c_k|^2a_k.$$`,
      idea: String.raw`For a Hermitian operator the eigenfunctions are an orthonormal basis (1.3), so $\psi$ can be expanded; the Born rule (1.2) says that the probability of the outcome $a_k$ is the squared overlap $|\langle\varphi_k|\psi\rangle|^2$. The two forms of $\langle A\rangle$ agree because $\int\bar\psi\hat A\psi=\sum_{jk}\bar c_jc_k a_k\langle\varphi_j|\varphi_k\rangle=\sum_k|c_k|^2a_k$. The average of $N$ outcomes converges to it like $\sigma_A/\sqrt N$ (law of large numbers). The collapse postulate is what makes a second measurement reproducible.`,
      caption: String.raw`The state is a superposition of the first four box levels of an electron in a 1 nm box. **Drag the bars** to change the amplitudes $c_n$ (renormalised). Simulated measurements arrive one by one: with **energy** each returns one of $E_1,\dots,E_4$ only, in proportion to $|c_n|^2$, and their running mean (bottom right) converges to $\langle H\rangle=\sum|c_n|^2E_n$ inside its $\sigma/\sqrt N$ band. With **position** the clicks follow $|\psi|^2$. **Measure energy once (collapse)** replaces the state by the eigenstate that was found; then every further energy measurement repeats it.`,
      deps: ['qchem-1.2', 'qchem-1.3'],
      refs: ['McQuarrie ch. 4'],
      tags: ['expectation value', 'measurement', 'collapse'],
      viz(v) {
        const M = v.M, U = units(M), E1 = U.boxE1, NS = 4, NP = 3000, T = 20;
        const cInit = [0.55, 0.65, 0.4, -0.35];
        let c = cInit.slice(), cSaved = cInit.slice(), seed = 5, last = null;
        const what = v.select('measure', [{ value: 'E', label: 'energy' }, { value: 'x', label: 'position' }], 'E');
        v.button('Measure energy once (collapse)', () => {
          const nc = norm(c), r = v.rng(900 + (seed++)); let u = r(), k = 0, acc = nc[0] ** 2; while (u > acc && k < NS - 1) { k++; acc += nc[k] ** 2; }
          c = c.map((_, i) => (i === k ? 1 : 0)); last = k + 1;
        });
        v.button('Restore the superposition', () => { c = cSaved.slice(); last = null; });
        v.button('New random sample', () => { seed += 7; });
        const norm = (a) => { const s = Math.sqrt(a.reduce((p, q) => p + q * q, 0)) || 1; return a.map((q) => q / s); };
        const s1 = v.stage({ x: [0, 1], y: [-2.4, 2.4], height: 260, axes: 'box', gutter: true, weight: 1, xlabel: 'x (nm)', ylabel: 'ψ (nm⁻¹ᐟ²)', title: 'the state $\\psi(x)$ in a 1 nm box' });
        const s2 = v.stage({ x: [0.4, NS + 0.6], y: [-1, 1], height: 260, axes: 'box', gutter: true, weight: 1, xticks: [[1, 'n=1'], [2, 'n=2'], [3, 'n=3'], [4, 'n=4']], ylabel: 'amplitude cₙ', title: 'amplitudes cₙ (drag); p = |cₙ|²' });
        const s3 = v.stage({ x: [0.4, NS + 0.6], y: [0, 1], height: 260, axes: 'box', gutter: true, weight: 1, xticks: [[1, 'E₁'], [2, 'E₂'], [3, 'E₃'], [4, 'E₄']], ylabel: 'frequency', title: 'outcomes of the simulated measurements' });
        const s4 = v.stage({ x: [10, NP], y: [0, 1], xlog: true, height: 260, axes: 'box', gutter: true, weight: 1, xlabel: 'number of measurements N', ylabel: 'running mean', title: 'running mean of the outcomes' });
        s2.onDrag((X, Y) => { const n = Math.round(X); if (n < 1 || n > NS) return; c[n - 1] = M.clamp(Y, -1, 1); cSaved = c.slice(); last = null; });
        const xs = Array.from({ length: 401 }, (_, i) => i / 400);
        let cacheKey = '', outE = null, outX = null;
        const samples = () => {
          const nc = norm(c), key = nc.map((q) => q.toFixed(4)).join(',') + '|' + seed;
          if (key === cacheKey) return;
          cacheKey = key;
          const r = v.rng(31 + seed * 13), cum = []; let a = 0; for (const q of nc) { a += q * q; cum.push(a); }
          outE = new Float64Array(NP); for (let k = 0; k < NP; k++) { const u = r(); let j = 0; while (u > cum[j] && j < NS - 1) j++; outE[k] = j + 1; }
          const dens = xs.map((X) => { let s = 0; nc.forEach((q, i) => { s += q * boxPsi(i + 1, 1, X); }); return s * s; });
          const f = M.gridSampler(xs, dens), r2 = v.rng(77 + seed * 5);
          outX = new Float64Array(NP); for (let k = 0; k < NP; k++) outX[k] = f(r2());
        };
        let st = null;
        v.animate((t) => {
          const nc = norm(c), N = Math.max(0, Math.min(NP, Math.floor((NP * t) / T))); samples();
          const energy = what.value === 'E', out = energy ? outE : outX, col = phaseLUT(v);
          const psi = xs.map((X) => nc.reduce((s, q, i) => s + q * boxPsi(i + 1, 1, X), 0));
          s1.hline(0, { color: 'faint' });
          drawReal(s1, xs, psi, { col, alpha: 0.45 });
          s1.path(xs.map((X, i) => [X, psi[i] * psi[i] * 0.5]), { color: 'ink', width: 1.5, dash: [5, 3] });
          let ex = 0; for (let i = 0; i < xs.length; i++) ex += psi[i] * psi[i] * xs[i] * (1 / 400);
          s1.vline(ex, { color: 'green', width: 1.8, dash: [5, 4] });
          s2.hline(0, { color: 'faint' });
          c.forEach((q, i) => { s2.rect(i + 0.64, 0, i + 1.36, q, { fill: col(q < 0 ? Math.PI : 0), fillAlpha: 0.85, color: 'ink', width: 0.8 }); s2.text(`p = ${v.fix(nc[i] * nc[i], 2)}`, i + 1, q >= 0 ? q : 0, { size: 10.5, color: 'ink', align: 'center', dy: -9 }); });
          const EH = nc.reduce((s, q, i) => s + q * q * E1 * (i + 1) ** 2, 0), EH2 = nc.reduce((s, q, i) => s + q * q * (E1 * (i + 1) ** 2) ** 2, 0);
          let mean = 0, cnt = new Array(NS).fill(0), pts = [], sum = 0;
          const marks = new Set(); for (let q = 0; q <= 120; q++) marks.add(Math.round(10 * Math.pow(NP / 10, q / 120)));
          for (let k = 0; k < N; k++) { const val = energy ? E1 * out[k] * out[k] : out[k]; sum += val; if (energy) cnt[out[k] - 1]++; if (marks.has(k + 1) && k + 1 >= 10) pts.push([k + 1, sum / (k + 1)]); }
          mean = N ? sum / N : NaN;
          let m2 = 0; for (let i = 0; i < xs.length; i++) m2 += (psi[i] * psi[i] * xs[i] * xs[i]) / 400;
          const target = energy ? EH : ex, sd = energy ? Math.sqrt(Math.max(0, EH2 - EH * EH)) : Math.sqrt(Math.max(0, m2 - ex * ex));
          if (energy) {
            nc.forEach((q, i) => { const fr = N ? cnt[i] / N : 0; s3.rect(i + 0.64, 0, i + 1.36, fr, { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 1.2 }); s3.line(i + 0.55, q * q, i + 1.45, q * q, { color: 'green', width: 2.6 }); s3.text(`${v.fix(E1 * (i + 1) ** 2, 2)} eV`, i + 1, 0, { size: 10, color: 'muted', align: 'center', baseline: 'bottom', dy: -3 }); });
            s3.setView([0.4, NS + 0.6], [0, 1]); s3.setTicks([[1, 'E₁'], [2, 'E₂'], [3, 'E₃'], [4, 'E₄']], null);
          } else {
            s3.setView([0, 1], [0, 3]); s3.setTicks(null, null);
            if (N >= 2) s3.hist(Array.from(out.subarray(0, N)), { bins: 30, range: [0, 1], density: true, color: 'orange', fillAlpha: 0.35 });
            s3.fn((X) => { const q = nc.reduce((s, w, i) => s + w * boxPsi(i + 1, 1, X), 0); return q * q; }, { color: 'green', width: 2.2 });
          }
          s4.setView([10, NP], [target - 2.2 * sd / Math.sqrt(10) - 1e-3, target + 2.2 * sd / Math.sqrt(10) + 1e-3]);
          s4.between((x) => target - sd / Math.sqrt(x), (x) => target + sd / Math.sqrt(x), 10, NP, { fill: 'green', fillAlpha: 0.14 });
          s4.hline(target, { color: 'green', width: 2 });
          if (pts.length > 1) s4.path(pts, { color: 'orange', width: 2 });
          if (N >= 10) s4.dot(N, mean, { r: 5, color: 'gold' });
          st = { energy, N, mean, target, sd, nc, cnt, last, EH };
        }, { period: T, still: 17 });
        v.legend([['green', 'prediction from the amplitudes'], ['orange', 'simulated measurements']]);
        v.readout(() => st && (st.energy ? `$\\langle H\\rangle=\\sum|c_n|^2E_n=${v.fix(st.target, 3)}$ eV, $\\Delta H=${v.fix(st.sd, 3)}$ eV` : `$\\langle x\\rangle=\\int\\bar\\psi\\,x\\,\\psi\\,dx=${v.fix(st.target, 3)}$ nm, $\\Delta x=${v.fix(st.sd, 3)}$ nm`) + ` · after $N=${st.N}$ measurements the average is **${Number.isFinite(st.mean) ? v.fix(st.mean, 3) : '–'}**` + (st.energy ? `; counts per level: ${st.cnt.join(', ')} (only the four eigenvalues ever occur)` : '') + (st.last ? ` · state collapsed to $n=${st.last}$ after an energy measurement — it now returns $E_${st.last}$ every time.` : '.'));
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Method',
      name: 'Ladder operators for the oscillator',
      credit: 'Dirac, 1930',
      statement: String.raw`For the harmonic oscillator define, in the scaled variable $\xi=x\sqrt{\mu\omega/\hbar}$,
$$\hat a=\tfrac1{\sqrt2}\Big(\xi+\frac{d}{d\xi}\Big),\qquad \hat a^\dagger=\tfrac1{\sqrt2}\Big(\xi-\frac{d}{d\xi}\Big),\qquad [\hat a,\hat a^\dagger]=1,\qquad \hat H=\hbar\omega\big(\hat a^\dagger\hat a+\tfrac12\big).$$
Acting on the normalized eigenstates $|n\rangle$ (energy $\hbar\omega(n+\frac12)$):
$$\hat a^\dagger|n\rangle=\sqrt{n+1}\,|n+1\rangle,\qquad \hat a|n\rangle=\sqrt n\,|n-1\rangle,\qquad \hat a|0\rangle=0.$$
So $\hat a^\dagger$ climbs one rung ($+\hbar\omega$), $\hat a$ descends one, the ground state has nowhere to go down, and every state is $|n\rangle=(\hat a^\dagger)^n|0\rangle/\sqrt{n!}$.`,
      idea: String.raw`From $[\hat a,\hat a^\dagger]=1$ one gets $[\hat H,\hat a^\dagger]=\hbar\omega\hat a^\dagger$: if $\hat H\psi=E\psi$ then $\hat H(\hat a^\dagger\psi)=(E+\hbar\omega)(\hat a^\dagger\psi)$, so $\hat a^\dagger$ raises the energy by exactly $\hbar\omega$. The norm $\|\hat a\psi_n\|^2=\langle\hat a^\dagger\hat a\rangle=n$ shows the factor $\sqrt n$; since norms cannot be negative the ladder must stop at a state with $\hat a\psi_0=0$, which is the Gaussian $(\xi+d/d\xi)e^{-\xi^2/2}=0$. The commutator $[\hat a,\hat a^\dagger]=1$ is $[x,p]=i\hbar$ (1.10) in disguise.`,
      caption: String.raw`Start from $|0\rangle$, $|2\rangle$ or a superposition, then press **$a^\dagger$** and **$a$**. Left: the amplitudes on each rung and the move of the last press with its factor $\sqrt{n+1}$ or $\sqrt n$. Right: the wave function, obtained two ways — by applying the *differential operator* $(\xi\mp d/d\xi)/\sqrt2$ numerically on a grid (coloured), and by reshuffling coefficients with the $\sqrt n$ rule (dashed). They agree. Press $a$ on the ground state: the result is exactly zero. The readout also checks $[\hat a,\hat a^\dagger]\psi=\psi$.`,
      deps: ['qchem-1.7', 'qchem-1.10', 'qm-4.2'],
      refs: ['McQuarrie ch. 5'],
      tags: ['ladder operators', 'creation and annihilation', 'harmonic oscillator'],
      viz(v) {
        const M = v.M, NB = 26, NG = 721, XI = 9, { x: xi, dx } = grid(-XI, XI, NG), PH = hermiteFns(NB - 1, xi), NR = 10;
        const start = v.select('start from', [{ value: '0', label: '$|0\\rangle$' }, { value: '2', label: '$|2\\rangle$' }, { value: 'sup', label: '$(|0\\rangle+|2\\rangle)/\\sqrt2$' }], '2', { onChange: () => reset() });
        let c = null, g = null, move = null, msg = '';
        const init = () => {
          c = new Float64Array(NB); g = new Float64Array(NG);
          const w = start.value === '0' ? [[0, 1]] : start.value === '2' ? [[2, 1]] : [[0, Math.SQRT1_2], [2, Math.SQRT1_2]];
          for (const [n, a] of w) { c[n] = a; for (let i = 0; i < NG; i++) g[i] += a * PH[n][i]; }
          move = null; msg = '';
        };
        const reset = () => { init(); v.invalidate(); };
        init();
        const dgrid = (f) => { const d = new Float64Array(NG); for (let i = 1; i < NG - 1; i++) d[i] = (f[i + 1] - f[i - 1]) / (2 * dx); return d; };
        const opUp = (f) => { const d = dgrid(f), o = new Float64Array(NG); for (let i = 0; i < NG; i++) o[i] = (xi[i] * f[i] - d[i]) / Math.SQRT2; return o; };
        const opDn = (f) => { const d = dgrid(f), o = new Float64Array(NG); for (let i = 0; i < NG; i++) o[i] = (xi[i] * f[i] + d[i]) / Math.SQRT2; return o; };
        const nz = () => { const k = []; for (let n = 0; n < NB; n++) if (Math.abs(c[n]) > 1e-12) k.push(n); return k; };
        v.button('$a^\\dagger$  (raise)', () => {
          const k = nz(), nc = new Float64Array(NB); for (let n = 0; n < NB - 1; n++) nc[n + 1] = Math.sqrt(n + 1) * c[n];
          msg = k.length === 1 ? `$\\hat a^\\dagger|${k[0]}\\rangle=\\sqrt{${k[0] + 1}}\\,|${k[0] + 1}\\rangle=${v.fix(Math.sqrt(k[0] + 1) * Math.abs(c[k[0]]), 3)}|${k[0] + 1}\\rangle$` : 'each amplitude $c_n$ moves up one rung and is multiplied by $\\sqrt{n+1}$';
          move = k.map((n) => ({ from: n, to: n + 1, f: Math.sqrt(n + 1) })); c = nc; g = opUp(g);
        });
        v.button('$a$  (lower)', () => {
          const k = nz(), nc = new Float64Array(NB); for (let n = 1; n < NB; n++) nc[n - 1] = Math.sqrt(n) * c[n];
          if (k.length === 1 && k[0] === 0) { msg = '$\\hat a|0\\rangle=0$ exactly: there is no rung below the ground state'; move = [{ from: 0, to: -1, f: 0 }]; }
          else { msg = k.length === 1 ? `$\\hat a|${k[0]}\\rangle=\\sqrt{${k[0]}}\\,|${k[0] - 1}\\rangle=${v.fix(Math.sqrt(k[0]) * Math.abs(c[k[0]]), 3)}|${k[0] - 1}\\rangle$` : 'each amplitude $c_n$ moves down one rung and is multiplied by $\\sqrt n$'; move = k.filter((n) => n > 0).map((n) => ({ from: n, to: n - 1, f: Math.sqrt(n) })); }
          c = nc; g = opDn(g);
        });
        v.button('Normalise', () => { const s = Math.sqrt(c.reduce((p, q) => p + q * q, 0)); if (s > 1e-12) { c = c.map((q) => q / s); g = g.map((q) => q / s); } });
        v.button('Reset', reset);
        const sL = v.stage({ x: [-2, 2], y: [0, NR + 0.2], height: 400, axes: 'box', gutter: true, weight: 1, xticks: [], ylabel: 'E / ħω', title: 'rungs of the ladder and their amplitudes' });
        const sR = v.stage({ x: [-6.5, 6.5], y: [-1, 1], height: 400, axes: 'box', gutter: true, weight: 1.2, xlabel: 'ξ = x / √(ħ/μω)', ylabel: 'ψ', title: 'the wave function: operator on the grid vs rung amplitudes' });
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), nrm = Math.sqrt(c.reduce((p, q) => p + q * q, 0));
          for (let n = 0; n < NR; n++) {
            sL.line(-1.9, n + 0.5, 1.9, n + 0.5, { color: 'muted', width: 1, dash: [4, 3], alpha: 0.5 });
            sL.text(`n = ${n}`, -1.95, n + 0.5, { size: 10.5, color: 'muted', align: 'left', baseline: 'middle', dy: 9 });
            const a = c[n] * 1.2 / Math.max(1, nrm); if (Math.abs(a) > 1e-9) { sL.rect(Math.min(0, a * 0.9), n + 0.5 - 0.22, Math.max(0, a * 0.9), n + 0.5 + 0.22, { fill: col(c[n] < 0 ? Math.PI : 0), fillAlpha: 0.8, color: 'ink', width: 0.9 }); sL.text(v.fix(c[n], 3), a >= 0 ? a * 0.9 + 0.05 : a * 0.9 - 0.05, n + 0.5, { size: 11, color: 'ink', align: a >= 0 ? 'left' : 'right', baseline: 'middle' }); }
          }
          sL.vline(0, { color: 'faint' });
          if (move) for (const m of move) { if (m.to < 0) { sL.text('0', 0.0, 0.5, { size: 22, color: 'red', align: 'center', dy: -26 }); continue; } if (m.to < NR) { sL.arrow(1.55, m.from + 0.5, 1.55, m.to + 0.5, { color: 'gold', width: 2.4, head: 8 }); sL.text(`×${v.fix(m.f, 3)}`, 1.5, (m.from + m.to) / 2 + 0.5, { size: 11, color: 'gold', align: 'right', baseline: 'middle' }); } }
          // wave function
          let gm = 0.4; for (let i = 0; i < NG; i++) gm = Math.max(gm, Math.abs(g[i]));
          sR.setView([-6.5, 6.5], [-1.2 * gm, 1.2 * gm]);
          sR.hline(0, { color: 'faint' });
          drawReal(sR, xi, g, { col, alpha: 0.45 });
          const rec = new Float64Array(NG); for (let n = 0; n < NB; n++) if (Math.abs(c[n]) > 1e-12) for (let i = 0; i < NG; i++) rec[i] += c[n] * PH[n][i];
          sR.path(Array.from(xi, (X, i) => [X, rec[i]]), { color: 'ink', width: 1.6, dash: [5, 4] });
          let dmax = 0; for (let i = 5; i < NG - 5; i++) dmax = Math.max(dmax, Math.abs(g[i] - rec[i]));
          // commutator check on the grid: a a† ψ − a† a ψ − ψ
          const com = opDn(opUp(g)), com2 = opUp(opDn(g)); let cres = 0; for (let i = 8; i < NG - 8; i++) cres = Math.max(cres, Math.abs(com[i] - com2[i] - g[i]));
          st = { nrm, dmax: dmax / gm, cres: cres / gm, zero: nrm < 1e-9 };
        });
        v.legend([['accent', 'operator applied on the grid', { area: true }], ['ink', 'amplitudes × Hermite functions', { dash: true }], ['gold', 'last move']]);
        v.readout(() => st && (msg ? msg + ' · ' : '') + `norm $\\|\\psi\\|=${v.fix(st.nrm, 4)}$ · grid operator vs coefficient rule differ by ${v.sci(st.dmax, 1)} (relative to the peak) · $[\\hat a,\\hat a^\\dagger]\\psi-\\psi$ on the grid: ${v.sci(st.cres, 1)}.`);
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Postulate',
      name: 'Time-dependent Schrödinger equation and wave packets',
      credit: 'Schrödinger, 1926',
      statement: String.raw`The state of a system evolves according to
$$i\hbar\,\frac{\partial\Psi(x,t)}{\partial t}=\hat H\,\Psi(x,t).$$
If $\hat H$ does not depend on time, the solution with initial state $\Psi(x,0)=\sum_nc_n\psi_n(x)$ (expansion in energy eigenstates) is $\Psi(x,t)=\sum_nc_ne^{-iE_nt/\hbar}\psi_n(x)$. A single eigenstate only rotates its phase, so its density never changes; a superposition has a density that oscillates at the **Bohr frequencies** $(E_m-E_n)/h$. In the box a localized packet spreads, then reforms ("revives") after $T_{\rm rev}=h/E_1$ and appears as a mirror copy halfway; in a harmonic oscillator all gaps are equal, so a packet keeps its shape and oscillates with the classical period $2\pi/\omega$, returning exactly.`,
      idea: String.raw`For time-independent $\hat H$ the equation is solved by superposing the stationary states of 1.1: each $\psi_ne^{-iE_nt/\hbar}$ solves it, the equation is linear, and the coefficients $c_n$ fix the initial condition. The density of a superposition contains cross terms $\bar c_mc_n\,\bar\psi_m\psi_n\,e^{-i(E_n-E_m)t/\hbar}$ that rotate at the Bohr frequencies. If the energies are integer multiples of a common unit, as $E_n=n^2E_1$ in the box (with $E_1=h/T_{\rm rev}$) or $\hbar\omega(n+\tfrac12)$ in the oscillator, all the phases realign at $t=T_{\rm rev}$ and the state returns exactly.`,
      caption: String.raw`Choose the **system** (an electron in a 1 nm box, or the stretching vibration of CO, 2170 cm$^{-1}$) and the **initial state**. An eigenstate only spins its phase colour; a **two-state superposition** sloshes at the Bohr frequency; a **wave packet** (a Gaussian, with momentum in the box or displaced from the minimum in the oscillator) moves, spreads and — in the box — revives. Below: $\langle x\rangle(t)$ and the overlap $|\langle\Psi(0)|\Psi(t)\rangle|^2$ with its peaks at the revival times. Times are in femtoseconds; the animation is slowed down enormously.`,
      deps: ['qchem-1.1', 'qchem-1.12'],
      refs: ['McQuarrie ch. 4'],
      tags: ['time-dependent Schrödinger equation', 'wave packet', 'revival'],
      viz(v) {
        const M = v.M, U = units(M), C = M.CONST, HBAR_EVFS = (C.hbar / C.eV) * 1e15;   // 0.6582 eV·fs
        const SYS = { box: { name: 'electron in a 1 nm box', NB: 70 }, osc: { name: 'CO vibration', NB: 40 } };
        const sys = v.select('system', Object.entries(SYS).map(([value, s]) => ({ value, label: s.name })), 'box', { onChange: () => { sync(); } });
        const stS = v.select('initial state', [{ value: 'eig', label: 'eigenstate' }, { value: 'two', label: 'two-state superposition' }, { value: 'pack', label: 'wave packet' }], 'pack', { onChange: () => sync() });
        const nS = v.slider('level number (1 = lowest)', 1, 6, 2, { int: true });
        const kS = v.slider('packet momentum (mean $n$)', 3, 20, 8, { int: true });
        const dS = v.slider('packet displacement (oscillator lengths)', 0, 4, 2.5, { step: 0.05 });
        function sync() {
          const box = sys.value === 'box', s = stS.value;
          nS.el.hidden = s === 'pack'; kS.el.hidden = !(box && s === 'pack'); dS.el.hidden = !(!box && s === 'pack');
          v.invalidate();
        }
        const NG = 520, T = 14;
        const sP = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, full: true, xlabel: 'x', ylabel: '|Ψ|', title: 'Ψ(x, t): height $|\\Psi|$, colour = phase' });
        const sX = v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: 'box', gutter: true, weight: 1, xlabel: 't (fs)', ylabel: '⟨x⟩', title: 'mean position' });
        const sC = v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: 'box', gutter: true, weight: 1, xlabel: 't (fs)', ylabel: '|⟨Ψ(0)|Ψ(t)⟩|²', title: 'overlap with the initial state' });
        let cache = {};
        const setup = () => {
          const box = sys.value === 'box', s = stS.value, n = nS.value, k0 = kS.value, d = dS.value;
          const key = [sys.value, s, n, k0, d].join('|'); if (cache.key === key) return cache;
          const NB = SYS[sys.value].NB;
          let X, basis, E, xlab, Vf;
          if (box) { X = Float64Array.from({ length: NG }, (_, i) => (i + 0.5) / NG); basis = []; for (let m = 1; m <= NB; m++) basis.push(Float64Array.from(X, (q) => boxPsi(m, 1, q))); E = Array.from({ length: NB }, (_, i) => (i + 1) ** 2 * U.boxE1); }
          else { X = Float64Array.from({ length: NG }, (_, i) => -8 + (16 * (i + 0.5)) / NG); basis = hermiteFns(NB - 1, X); const w = 2169.81358 * U.eV_per_cm; E = Array.from({ length: NB }, (_, i) => (i + 0.5) * w); }
          const dx = X[1] - X[0], c = new Float64Array(NB);
          if (s === 'eig') c[box ? n - 1 : n - 1] = 1;
          else if (s === 'two') { c[n - 1] = Math.SQRT1_2; c[n] = Math.SQRT1_2; }
          else {
            const psi0 = box ? Float64Array.from(X, (q) => Math.exp(-((q - 0.3) ** 2) / (4 * 0.06 ** 2))) : Float64Array.from(X, (q) => Math.exp(-((q - d) ** 2) / 2));
            // for the box the packet carries momentum: ψ = e^{i k x}, so keep its real/imag parts separately
            const re = new Float64Array(NB), im = new Float64Array(NB);
            for (let m = 0; m < NB; m++) { let a = 0, b = 0; for (let i = 0; i < NG; i++) { const ph = box ? k0 * Math.PI * (X[i] - 0.3) : 0; a += basis[m][i] * psi0[i] * Math.cos(ph); b += basis[m][i] * psi0[i] * Math.sin(ph); } re[m] = a * dx; im[m] = b * dx; }
            let nn = 0; for (let m = 0; m < NB; m++) nn += re[m] * re[m] + im[m] * im[m];
            const sc = 1 / Math.sqrt(nn); cache.cre = re.map((q) => q * sc); cache.cim = im.map((q) => q * sc);
          }
          if (s !== 'pack') { cache.cre = c; cache.cim = new Float64Array(NB); }
          const Tspan = box ? (2 * Math.PI * HBAR_EVFS) / E[0] : 2 * ((2 * Math.PI * HBAR_EVFS) / (E[1] - E[0]));
          // matrix elements of x between basis functions, for ⟨x⟩(t)
          const Xm = []; for (let a = 0; a < NB; a++) { Xm.push(new Float64Array(NB)); for (let b = 0; b <= a; b++) { let q = 0; for (let i = 0; i < NG; i++) q += basis[a][i] * basis[b][i] * X[i]; Xm[a][b] = q * dx; } }
          for (let a = 0; a < NB; a++) for (let b = a + 1; b < NB; b++) Xm[a][b] = Xm[b][a];
          const cre = cache.cre, cim = cache.cim, NT = 360, ts = [], xt = [], ct = [];
          for (let k = 0; k <= NT; k++) {
            const t = (Tspan * k) / NT, a = new Float64Array(NB), b = new Float64Array(NB);
            for (let m = 0; m < NB; m++) { const ph = -(E[m] * t) / HBAR_EVFS, co = Math.cos(ph), si = Math.sin(ph); a[m] = cre[m] * co - cim[m] * si; b[m] = cre[m] * si + cim[m] * co; }
            let xs = 0; for (let p = 0; p < NB; p++) { if (Math.abs(a[p]) + Math.abs(b[p]) < 1e-9) continue; for (let q2 = 0; q2 < NB; q2++) xs += Xm[p][q2] * (a[p] * a[q2] + b[p] * b[q2]); }
            let or = 0, oi = 0; for (let m = 0; m < NB; m++) { or += cre[m] * a[m] + cim[m] * b[m]; oi += cre[m] * b[m] - cim[m] * a[m]; }
            ts.push(t); xt.push(xs); ct.push(or * or + oi * oi);
          }
          return (cache = { key, box, X, basis, E, NB, cre, cim, Tspan, ts, xt, ct, dx });
        };
        sync();
        let stt = null;
        v.animate((t) => {
          const S = setup(), col = phaseLUT(v), { X, basis, E, NB, cre, cim, Tspan } = S, tau = (t / T) * Tspan;
          const re = new Float64Array(NG), im = new Float64Array(NG);
          for (let m = 0; m < NB; m++) {
            if (Math.abs(cre[m]) + Math.abs(cim[m]) < 1e-9) continue;
            const ph = -(E[m] * tau) / HBAR_EVFS, co = Math.cos(ph), si = Math.sin(ph), a = cre[m] * co - cim[m] * si, b = cre[m] * si + cim[m] * co, B = basis[m];
            for (let i = 0; i < NG; i++) { re[i] += a * B[i]; im[i] += b * B[i]; }
          }
          let pk = 0.5, mx = 0, m0 = 0; for (let i = 0; i < NG; i++) { const r = re[i] ** 2 + im[i] ** 2; pk = Math.max(pk, Math.sqrt(r)); mx += r * X[i]; m0 += r; }
          mx /= m0;
          const box = S.box, xr = box ? [0, 1] : [-6.5, 6.5];
          sP.setView(xr, [-0.04 * pk * 1.6, pk * 1.6]);
          if (box) { sP.line(0, 0, 0, pk * 1.6, { color: 'muted', width: 3 }); sP.line(1, 0, 1, pk * 1.6, { color: 'muted', width: 3 }); }
          else sP.fn((q) => Math.min(pk * 1.6, 0.5 * q * q * (pk * 1.6) / 20), { color: 'muted', width: 1.4, dash: [4, 3], n: 300 });
          drawPsi(sP, X, re, im, { col });
          sP.vline(mx, { color: 'green', width: 1.6, dash: [5, 4] }); sP.text('⟨x⟩', mx, pk * 1.52, { color: 'green', size: 11.5, dx: 5 });
          phaseWheel(sP, col, sP.W - 34, 42, 12);
          const dd = Math.max(3.2, dS.value + 0.8); sX.setView([0, Tspan], [box ? 0 : -dd, box ? 1 : dd]); sX.hline(box ? 0.5 : 0, { color: 'faint' });
          sX.path(S.ts.map((q, k) => [q, S.xt[k]]), { color: 'green', width: 2.2 }); sX.vline(tau, { color: 'gold', width: 1.6 }); sX.dot(tau, mx, { r: 5, color: 'gold' });
          sC.setView([0, Tspan], [0, 1.05]);
          sC.path(S.ts.map((q, k) => [q, S.ct[k]]), { color: 'purple', width: 2.2 }); sC.vline(tau, { color: 'gold', width: 1.6 });
          let ci = Math.round((tau / Tspan) * 360); ci = M.clamp(ci, 0, 360); sC.dot(tau, S.ct[ci], { r: 5, color: 'gold' });
          let dev = 0; { const re0 = new Float64Array(NG), im0 = new Float64Array(NG); for (let m = 0; m < NB; m++) for (let i = 0; i < NG; i++) { re0[i] += cre[m] * basis[m][i]; im0[i] += cim[m] * basis[m][i]; } let mxd = 0; for (let i = 0; i < NG; i++) mxd = Math.max(mxd, Math.abs(Math.hypot(re[i], im[i]) - Math.hypot(re0[i], im0[i]))); dev = mxd; }
          const nn = (re.reduce((s, q, i) => s + q * q + im[i] * im[i], 0)) * S.dx;
          stt = { tau, Tspan, mx, norm: nn, dev, box, E1: E[0], ov: S.ct[ci] };
        }, { period: T, still: 4.2 });
        v.legend([['green', '⟨x⟩'], ['purple', 'overlap with $\\Psi(0)$']]);
        v.readout(() => stt && `$t=${v.fix(stt.tau, 2)}$ fs of ${v.fix(stt.Tspan, 1)} fs shown · $\\int|\\Psi|^2=${v.fix(stt.norm, 4)}$ (conserved) · $|\\Psi|$ differs from its initial profile by ${v.fix(stt.dev, 3)} at most · overlap with the initial state ${v.fix(stt.ov, 3)}` + (stt.box ? ` · revival time $T_{\\rm rev}=h/E_1=${v.fix(stt.Tspan, 2)}$ fs for $E_1=${v.fix(stt.E1, 3)}$ eV; at $T_{\\rm rev}/2$ the packet is reborn displaced by $L/2$.` : ` · the oscillator period $2\\pi/\\omega=${v.fix(stt.Tspan / 2, 2)}$ fs ($\\tilde\\nu=2169.8$ cm$^{-1}$ for CO, NIST); a real, anharmonic CO wave packet dephases and revives later.`));
      },
    },
  ],
};
