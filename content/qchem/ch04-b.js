// Quantum Chemistry & Spectroscopy — Chapter 4, part b: items 4.7–4.12 (4.1–4.6 are in ch04.js)
import { HARTREE_EV, A0_ANG, KB_MEV, IE, radialLevels, boxMatrix, boxX, goldenMin } from './ch04.shared.js';

const EBOX = (n) => (n * n * Math.PI * Math.PI) / 2;       // box [0,1], ħ = m = 1

export default {
  collection: 'qchem',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Method',
      name: 'Degenerate perturbation theory',
      credit: 'Schrödinger, 1926 (Stark effect of the Balmer lines, the degenerate case)',
      statement: String.raw`Suppose $E^{(0)}$ is a $g$-fold degenerate level of $H^{(0)}$ with orthonormal eigenfunctions $\phi_1,\dots,\phi_g$, and $H=H^{(0)}+\lambda W$. To first order the energies that emerge from $E^{(0)}$ are $E^{(0)}+\lambda w_i$, where $w_1,\dots,w_g$ are the eigenvalues of the $g\times g$ matrix $W_{ab}=\langle\phi_a|W|\phi_b\rangle$, and the correct zeroth-order states are the corresponding eigenvectors $\sum_a c_a\phi_a$, in general *mixtures* of the original functions. The nondegenerate formula of 4.4 and 4.5 would divide by $E^{(0)}-E^{(0)}=0$.`,
      scope: String.raw`If $W$ is diagonal in the degenerate subspace (for instance because of a symmetry) the original functions are already the good ones. If all $w_i$ coincide the degeneracy survives to first order and must be resolved at second order, by the same method applied to the effective matrix there.`,
      idea: String.raw`In the degenerate subspace $H^{(0)}$ acts as a multiple of the identity, so any combination is a legitimate zeroth-order state and the perturbation decides which one the true eigenstate approaches as $\lambda\to0$. Projecting $(H^{(0)}+\lambda W)\psi=E\psi$ onto the subspace at order $\lambda$ gives $\sum_b(W_{ab}-w\,\delta_{ab})c_b=0$: the eigenproblem of a small Hermitian matrix (1.3 guarantees real $w$ and orthogonal $c$), the same secular determinant as in the linear variation method (4.2) restricted to the degenerate block.`,
      caption: String.raw`Two electrons in a unit square box ($\hbar=m=1$): the levels $(n_x,n_y)=(1,2)$ and $(2,1)$ both have $E=5\pi^2/2$. Choose a perturbation (a cross term $\lambda xy$, a one-sided $\lambda x^2$, or a tilt $\lambda x$) and drag $\lambda$. Left: the exact pair of levels from a 36-function basis (solid) and the first-order prediction from the $2\times2$ block (dashed). Right: the exact wavefunction of the lower or upper level, or the unperturbed $\psi_{12}$. For $xy$ the correct states are $\psi_{12}\pm\psi_{21}$, rotated $45^\circ$ from the original ones, and the splitting is $\pm\lambda|W_{12,21}|$; for $x^2$ the original states are already right; for $x$ nothing splits at first order.`,
      deps: ['qchem-4.4', 'qchem-1.6', 'qm-11.4'],
      see: ['qm-11.4'],
      refs: ['McQuarrie ch. 8'],
      tags: ['degenerate perturbation theory', 'mixing', 'square box'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perturbation_theory_(quantum_mechanics)#Degenerate_energy_levels' },
      viz(v) {
        const M = v.M, N = 6, LMAX = 60, nS = N * N;
        const X1 = boxMatrix((x) => x, N), X2 = boxMatrix((x) => x * x, N);
        const idx = (a, b) => a * N + b, P = idx(0, 1), Q = idx(1, 0);
        const E0 = Array.from({ length: nS }, (_, i) => EBOX(Math.floor(i / N) + 1) + EBOX((i % N) + 1));
        const Wf = (kind, i, j) => { const a = Math.floor(i / N), b = i % N, c = Math.floor(j / N), d = j % N; return kind === 'xy' ? X1[a][c] * X1[b][d] : kind === 'x2' ? X2[a][c] * (b === d ? 1 : 0) : X1[a][c] * (b === d ? 1 : 0); };
        const Wm = {}; for (const k of ['xy', 'x2', 'x']) Wm[k] = Array.from({ length: nS }, (_, i) => Array.from({ length: nS }, (_, j) => Wf(k, i, j)));
        const pair = (kind, lam) => {
          const H = Wm[kind].map((row, i) => row.map((w, j) => lam * w + (i === j ? E0[i] : 0))), eg = M.eigSym(H);
          const sc = eg.vecs.map((c, k) => ({ k, w: c[P] ** 2 + c[Q] ** 2 })).sort((a, b) => b.w - a.w).slice(0, 2).map((o) => o.k).sort((a, b) => eg.values[a] - eg.values[b]);
          return { E: sc.map((k) => eg.values[k]), c: sc.map((k) => eg.vecs[k]) };
        };
        const kindS = v.select('perturbation $W$', [{ value: 'xy', label: '$xy$' }, { value: 'x2', label: '$x^2$' }, { value: 'x', label: '$x$' }], 'xy');
        const lamS = v.slider('strength $\\lambda$', 0, LMAX, 30, { step: 0.5 });
        const showS = v.select('wavefunction', [{ value: 'lo', label: 'lower exact' }, { value: 'hi', label: 'upper exact' }, { value: 'p', label: 'unperturbed $\\psi_{12}$' }], 'lo');
        const sL = v.stage({ x: [0, LMAX], y: [-8, 8], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'λ', ylabel: 'E − 5π²/2', title: 'the degenerate pair' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'x', ylabel: 'y', title: 'wavefunction ψ(x, y)' });
        const cache = {}; const curves = (kind) => cache[kind] ||= Array.from({ length: 31 }, (_, i) => { const l = (LMAX * i) / 30; return [l, pair(kind, l).E]; });
        const phi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
        let info = null;
        v.render(() => {
          const kind = kindS.value, lam = lamS.value, cv = curves(kind), pr = pair(kind, lam), e0 = E0[P];
          const wpp = Wm[kind][P][P], wqq = Wm[kind][Q][Q], wpq = Wm[kind][P][Q];
          const mid = (wpp + wqq) / 2, half = Math.hypot((wpp - wqq) / 2, wpq);
                    sL.setView([0, LMAX], [-(Math.abs(mid) + half) * LMAX * 0.15 - 0.5, (Math.abs(mid) + half) * LMAX * 1.1 + 0.5]);
          sL.hline(0, { color: 'faint' });
          sL.line(0, 0, LMAX, LMAX * wpp, { color: 'muted', dash: [2, 4], width: 1.4 });
          sL.line(0, 0, LMAX, LMAX * wqq, { color: 'muted', dash: [2, 4], width: 1.4 });
          sL.line(0, 0, LMAX, LMAX * (mid - half), { color: 'orange', dash: true, width: 1.8 });
          sL.line(0, 0, LMAX, LMAX * (mid + half), { color: 'orange', dash: true, width: 1.8 });
          for (let j = 0; j < 2; j++) sL.path(cv.map((q) => [q[0], q[1][j] - e0]), { color: j ? 'accent' : 'green', width: 2.5 });
          sL.vline(lam, { color: 'gold', dash: true });
          sL.dot(lam, pr.E[0] - e0, { r: 6, color: 'green' }); sL.dot(lam, pr.E[1] - e0, { r: 6, color: 'accent' });
          // wavefunction
          const sel = showS.value;
          let coef; if (sel === 'p') coef = { [P]: 1 }; else { const c = pr.c[sel === 'lo' ? 0 : 1]; coef = {}; c.forEach((x, i) => { if (Math.abs(x) > 2e-3) coef[i] = x; }); }
          const ent = Object.entries(coef).map(([i, c]) => [Math.floor(+i / N) + 1, (+i % N) + 1, c]);
          sH.heat((x, y) => { if (x < 0 || x > 1 || y < 0 || y > 1) return 0; let s = 0; for (const [a, b, c] of ent) s += c * phi(a, x) * phi(b, y); return s / 2; }, { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${kind},${lam},${sel}` });
          const cp = sel === 'p' ? 1 : (pr.c[sel === 'lo' ? 0 : 1][P]), cq = sel === 'p' ? 0 : (pr.c[sel === 'lo' ? 0 : 1][Q]);
          info = { kind, lam, wpp, wqq, wpq, split: pr.E[1] - pr.E[0], pred: 2 * half * lam, cp, cq, sel };
        });
        v.legend([['green', 'exact lower'], ['accent', 'exact upper'], ['orange', 'degenerate first order', { dash: true }], ['muted', 'naive $\\lambda W_{aa}$', { dash: [2, 4] }]]);
        v.readout(() => info && `block $W=\\begin{pmatrix}${v.fix(info.wpp, 4)}&${v.fix(info.wpq, 4)}\\\\${v.fix(info.wpq, 4)}&${v.fix(info.wqq, 4)}\\end{pmatrix}$ in the basis $(\\psi_{12},\\psi_{21})$ · predicted splitting $2\\lambda\\sqrt{((W_{11}-W_{22})/2)^2+W_{12}^2}=${v.fix(info.pred, 3)}$, exact $${v.fix(info.split, 3)}$\nthe state drawn has coefficients $(c_{12},c_{21})=(${v.fix(info.cp, 3)},${v.fix(info.cq, 3)})$ · ordinary second order would contain $|W_{12}|^2/(E^{(0)}-E^{(0)})=${Math.abs(info.wpq) > 1e-6 ? `${v.fix(info.wpq ** 2, 4)}/0\\to\\infty` : '0/0 (no coupling)'}$`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Hellmann–Feynman theorem',
      credit: 'Güttinger, 1932; Pauli, 1933; Hellmann, 1937; Feynman, 1939 (independently; for forces on nuclei: Feynman, Phys. Rev. 56, 340)',
      statement: String.raw`Let $H(\lambda)$ depend differentiably on a real parameter and let $\psi(\lambda)$ be a normalised eigenstate, $H\psi=E\psi$. Then
$$\frac{dE}{d\lambda}=\Big\langle\psi\Big|\frac{\partial H}{\partial\lambda}\Big|\psi\Big\rangle.$$
The same holds for a trial function that makes $\langle H\rangle$ stationary with respect to *all* of its own parameters. With $\lambda$ a nuclear coordinate it says that the force on a nucleus is the classical electrostatic force from the electron density, with no term from the change of the wavefunction.`,
      scope: String.raw`Exact eigenstates, or approximate states that are variationally optimal within a family that is complete enough that the family itself does not move with $\lambda$ (for an atom-centred basis set that does move, the extra Pulay force must be added). A trial function that is not stationary does not obey it.`,
      idea: String.raw`Differentiate $E=\langle\psi|H|\psi\rangle$ with $\langle\psi|\psi\rangle=1$ (differentiation under the integral sign, pma-9.42): $E'=\langle\psi|H'|\psi\rangle+\langle\psi'|H|\psi\rangle+\langle\psi|H|\psi'\rangle=\langle H'\rangle+E\,\frac{d}{d\lambda}\langle\psi|\psi\rangle=\langle H'\rangle$, because $H\psi=E\psi$ makes the two extra terms multiples of $\langle\psi'|\psi\rangle+\langle\psi|\psi'\rangle=0$. For a stationary trial function the same cancellation holds with $\partial E/\partial c_i=0$.`,
      caption: String.raw`Choose a one-dimensional oscillator whose parameter is the frequency $\omega$ or the quartic coupling $\lambda$, and a level $n$. The curve is the exact $E_n(p)$ (finite differences). The green tangent has slope $\langle\partial H/\partial p\rangle$ computed from the exact *state* and it lies exactly along the curve (the readout compares it with the numerical derivative). For the ground state the dashed orange curve is the best Gaussian trial $\psi_s\propto e^{-sx^2/2}$ re-optimised at each $p$; its tangent, with slope computed from the optimised trial function, also touches *its* curve. The red tangent uses the same quantity from a Gaussian with a **frozen** width $s_0$ (second slider) that is not re-optimised, and misses the true slope unless $s_0$ happens to be optimal.`,
      deps: ['qchem-1.3', 'pma-9.42', 'qm-11.7'],
      see: ['qm-11.7', 'qchem-4.6'],
      refs: ['Szabo–Ostlund ch. 1'],
      tags: ['Hellmann–Feynman', 'forces', 'derivative of energy'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hellmann%E2%80%93Feynman_theorem' },
      viz(v) {
        const M = v.M;
        const sysS = v.select('parameter', [{ value: 'w', label: 'frequency $\\omega$ in $\\tfrac12\\omega^2x^2$' }, { value: 'l', label: 'quartic $\\lambda$ in $\\tfrac12x^2+\\lambda x^4$' }], 'w');
        const nS = v.select('level $n$', [0, 1, 2].map((n) => ({ value: n, label: String(n) })), 0);
        const pw = v.slider('parameter $\\omega$', 0.5, 2.5, 1.4, { step: 0.01 }), pl = v.slider('parameter $\\lambda$', 0, 1.5, 0.6, { step: 0.01 });
        const sf = v.slider('frozen trial width $s_0$', 0.3, 4, 1.0, { step: 0.01 });
        const upd = () => { pw.el.hidden = sysS.value !== 'w'; pl.el.hidden = sysS.value !== 'l'; };
        const sE = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'parameter', ylabel: 'energy', title: 'E(parameter) and tangents' });
        const sP = v.stage({ x: [-4, 4], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'x', ylabel: '|ψ|²', title: 'states at this parameter' });
        const pot = (sys, p) => (x) => (sys === 'w' ? 0.5 * p * p * x * x : 0.5 * x * x + p * x ** 4);
        const dH = (sys, p, x) => (sys === 'w' ? p * x * x : x ** 4);                // ∂H/∂p
        const solve = (sys, p, k = 3) => M.schrodinger1D(pot(sys, p), [-7, 7], { n: 560, k });
        const Et = (sys, p, s) => (sys === 'w' ? s / 4 + (p * p) / (4 * s) : s / 4 + 1 / (4 * s) + (3 * p) / (4 * s * s));
        const dEt = (sys, p, s) => (sys === 'w' ? p / (2 * s) : 3 / (4 * s * s));     // ⟨∂H/∂p⟩ in the Gaussian ψ_s
        const sOpt = (sys, p) => goldenMin((s) => Et(sys, p, s), 0.05, 20, 1e-10);
        const exp = (sol, k, f) => { let t = 0; for (let i = 0; i < sol.x.length; i++) t += sol.psi[k][i] ** 2 * f(sol.x[i]); return t * (sol.x[1] - sol.x[0]); };
        const curveCache = {};
        const curve = (sys, k) => curveCache[sys + k] ||= (() => { const lo = sys === 'w' ? 0.5 : 0, hi = sys === 'w' ? 2.5 : 1.5, pts = []; for (let i = 0; i <= 40; i++) { const p = lo + ((hi - lo) * i) / 40; pts.push([p, solve(sys, p, k + 1).E[k]]); } return pts; })();
        let info = null;
        v.render(() => {
          upd();
          const sys = sysS.value, k = +nS.value, p = (sys === 'w' ? pw : pl).value, lo = sys === 'w' ? 0.5 : 0, hi = sys === 'w' ? 2.5 : 1.5, s0 = sf.value;
          const pts = curve(sys, k), ymin = Math.min(...pts.map((q) => q[1])), ymax = Math.max(...pts.map((q) => q[1]));
          sE.setView([lo, hi], [ymin - 0.15 * (ymax - ymin), ymax + 0.2 * (ymax - ymin)]); sE.setLabels(sys === 'w' ? 'ω' : 'λ', 'E');
          sE.path(pts, { color: 'accent', width: 2.6 });
          const sol = solve(sys, p, k + 1), E = sol.E[k], slopeExact = exp(sol, k, (x) => dH(sys, p, x));
          const d = 0.22 * (hi - lo);
          const so = sOpt(sys, p);
          if (k === 0) {
            sE.fn((q) => Et(sys, q, sOpt(sys, q)), { color: 'orange', dash: true, width: 1.8, domain: [lo, hi], n: 60 });
            sE.fn((q) => Et(sys, q, s0), { color: 'red', dash: [2, 3], width: 1.5, domain: [lo, hi], n: 60 });
            sE.segment([p - d, Et(sys, p, so) - d * dEt(sys, p, so)], [p + d, Et(sys, p, so) + d * dEt(sys, p, so)], { color: 'orange', width: 1.8 });
            sE.segment([p - d, Et(sys, p, s0) - d * dEt(sys, p, s0)], [p + d, Et(sys, p, s0) + d * dEt(sys, p, s0)], { color: 'red', width: 1.8 });
          }
          sE.segment([p - d, E - d * slopeExact], [p + d, E + d * slopeExact], { color: 'green', width: 2.6 });
          sE.dot(p, E, { r: 6, color: 'accent' });
          // state panel
          sP.setView([-4, 4], [0, Math.max(0.9, 1.1 * Math.max(...Array.from(sol.psi[k], (y) => y * y)))]);
          sP.path(Array.from(sol.x, (x, i) => [x, sol.psi[k][i] ** 2]), { color: 'accent', width: 2.4 });
          if (k === 0) {
            const g = (s) => (x) => Math.sqrt(s / Math.PI) * Math.exp(-s * x * x);
            sP.fn(g(so), { color: 'orange', dash: true, width: 1.8 }); sP.fn(g(s0), { color: 'red', dash: [2, 3], width: 1.5 });
          }
          const h = 0.01, fd = (solve(sys, Math.min(hi, p + h), k + 1).E[k] - solve(sys, Math.max(lo, p - h), k + 1).E[k]) / (Math.min(hi, p + h) - Math.max(lo, p - h));
          info = { sys, k, p, E, slopeExact, fd, so, s0, eo: Et(sys, p, so), dopt: dEt(sys, p, so), dfr: dEt(sys, p, s0) };
        });
        v.legend([['accent', 'exact $E_n(p)$'], ['green', 'tangent from $\\langle\\partial H/\\partial p\\rangle_{\\rm exact}$'], ['orange', 'optimised Gaussian', { dash: true }], ['red', 'frozen-width Gaussian', { dash: [2, 3] }]]);
        v.readout(() => info && `exact: $dE/dp$ from finite differences $=${v.fix(info.fd, 4)}$, $\\langle\\partial H/\\partial p\\rangle=${v.fix(info.slopeExact, 4)}$ — they agree.` + (info.k === 0 ? `\noptimised Gaussian ($s=${v.fix(info.so, 3)}$): $E=${v.fix(info.eo, 4)}\\ge${v.fix(info.E, 4)}$, slope of its own curve $=\\langle\\partial H/\\partial p\\rangle_{\\rm trial}=${v.fix(info.dopt, 4)}$ (HF holds for a stationary trial function)\nfrozen $s_0=${v.fix(info.s0, 2)}$: expectation $${v.fix(info.dfr, 4)}$ $\\ne$ true slope $${v.fix(info.slopeExact, 4)}$ (off by ${v.fix(info.dfr - info.slopeExact, 4)})` : '\n(trial Gaussians describe only the ground state; they are hidden for $n>0$)'));
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Quantum virial theorem',
      credit: 'Fock, 1930 (Z. Phys. 63, 855); the classical theorem is Clausius, 1870',
      statement: String.raw`For a stationary state of $H=T+V(\mathbf r)$ with kinetic energy $T=\mathbf p^2/2m$,
$$2\langle T\rangle=\langle\mathbf r\cdot\nabla V\rangle .$$
For a potential homogeneous of degree $s$, $V\propto r^s$, this is $\langle T\rangle=\tfrac s2\langle V\rangle$, so $E=\tfrac{s+2}{2}\langle V\rangle=\tfrac{s+2}{s}\langle T\rangle$: for the Coulomb potential ($s=-1$) $\langle T\rangle=-E$, $\langle V\rangle=2E$ and $\langle V\rangle/\langle T\rangle=-2$; for the oscillator ($s=2$) $\langle T\rangle=\langle V\rangle=E/2$.`,
      scope: String.raw`For eigenstates (or any state stationary under dilations of the wavefunction). With fixed nuclei in a molecule the potential includes $r^{-1}$ terms *and* the force on the nuclei: $2\langle T\rangle+\langle V\rangle=-\sum_A\mathbf R_A\cdot\mathbf F_A$, which vanishes only at an equilibrium geometry.`,
      idea: String.raw`Scale the eigenfunction, $\psi_a(\mathbf r)=a^{3/2}\psi(a\mathbf r)$. Then $\langle T\rangle_a=a^2\langle T\rangle$ and, for $V\propto r^s$, $\langle V\rangle_a=a^{-s}\langle V\rangle$. Because $\psi$ makes the energy stationary (4.1), $dE_a/da|_{a=1}=2\langle T\rangle-s\langle V\rangle=0$. The same follows from Hellmann–Feynman (4.8) with the scale as the parameter, or from $\langle[H,\,\mathbf r\cdot\mathbf p]\rangle=0$ in a stationary state, the quantum counterpart of Clausius's classical average (mech-8.16).`,
      caption: String.raw`Radial $s$-wave bound states ($\hbar=m=1$) in the potential $V=\operatorname{sgn}(s)\,r^s$ (attractive $-1/r^{|s|}$ for $s<0$, and the logarithm $\ln r$ for $s=0$). Drag the exponent $s$ and choose the level: the left panel shows the potential, the energy and $u^2(r)$ (computed by diagonalising the radial equation); the middle panel gives the bars $\langle T\rangle$, $\langle V\rangle$ and $E$ and the two sides $2\langle T\rangle$ and $\langle rV'\rangle=s\langle V\rangle$ of the theorem, which are equal; the right panel plots the ratio $\langle T\rangle/\langle V\rangle$ for the 1s state against $s$, together with the line $s/2$. For Coulomb it reads $-\tfrac12$, for the oscillator 1.`,
      deps: ['qchem-4.8', 'mech-8.16'],
      see: ['mech-8.16', 'qchem-4.3'],
      refs: ['McQuarrie ch. 8'],
      tags: ['virial theorem', 'kinetic and potential energy', 'scaling'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Virial_theorem' },
      viz(v) {
        const M = v.M;
        const sS = v.slider('exponent $s$ in $V\\propto r^s$ ($s=0$: $\\ln r$)', -1, 4, -1, { step: 0.25 });
        const nS = v.select('level', [{ value: 0, label: '1s' }, { value: 1, label: '2s' }, { value: 2, label: '3s' }], 0);
        const pot = (s) => (s === 0 ? Math.log : s > 0 ? (r) => r ** s : (r) => -(r ** s));
        const solve = (s, k) => { const rmax = s <= -0.5 ? 40 + 30 * k : s <= 1 ? 50 : 22, h = rmax / 3500; return radialLevels(M, pot(s), 0, k, { rmax, h }); };
        const stats = (s, sol, k) => {
          const u = sol.u[k], h = sol.h, V = pot(s); let T = 0, Vv = 0, prev = 0;
          for (let i = 0; i < u.length; i++) { const d = (u[i] - prev) / h; T += 0.5 * d * d * h; prev = u[i]; Vv += V((i + 1) * h) * u[i] * u[i] * h; }
          return { T, V: Vv, E: sol.E[k] };
        };
        const sP = v.stage({ x: [0, 10], y: [-2, 4], axes: 'box', gutter: true, height: 320, weight: 1.1, xlabel: 'r', ylabel: 'energy', title: 'potential, level and u²' });
        const sB = v.stage({ x: [0.5, 5.5], y: [-2, 2], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: '', ylabel: 'energy', title: 'the pieces', xticks: [[1, '⟨T⟩'], [2, '⟨V⟩'], [3, 'E'], [4, '2⟨T⟩'], [5, '⟨rV′⟩']] });
        const sR = v.stage({ x: [-1, 4], y: [-1.5, 2.5], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: 'exponent s', ylabel: '⟨T⟩ / ⟨V⟩', title: 'ratio against the exponent' });
        const ratios = []; for (let s = -1; s <= 4.001; s += 0.5) if (Math.abs(s) > 1e-9) { const st = stats(s, solve(s, 1), 0); ratios.push([s, st.T / st.V]); }
        let info = null;
        v.render(() => {
          const s = sS.value, k = +nS.value, sol = solve(s, k + 1), st = stats(s, sol, k), V = pot(s);
          const rr = (i) => (i + 1) * sol.h, u = sol.u[k];
          let rmx = 0, acc = 0; for (let i = 0; i < u.length; i++) { acc += u[i] * u[i] * sol.h; if (acc > 0.995) { rmx = rr(i); break; } }
          const R = Math.max(2, rmx * 1.1), emin = Math.min(st.E, V(0.3)) - 0.3, emax = st.E + 0.3 * Math.abs(st.E) + 1.5;
          sP.setView([0, R], [Math.max(emin, st.E - 2 * Math.abs(st.E) - 1), emax]);
          sP.fn(V, { color: 'ink', width: 2, domain: [0.05, R] });
          sP.hline(st.E, { color: 'orange', dash: true });
          const mu = Math.max(...u.map((x) => x * x)), sc = (0.6 * (emax - st.E)) / mu;
          sP.path(Array.from({ length: u.length }, (_, i) => [rr(i), st.E + sc * u[i] * u[i]]).filter((q) => q[0] <= R), { color: 'accent', width: 2.2 });
          const rVp = s === 0 ? 1 : s * st.V, vals = [st.T, st.V, st.E, 2 * st.T, rVp], mx = Math.max(...vals.map(Math.abs), 0.1) * 1.2;
          sB.setView([0.5, 5.5], [-mx, mx]); sB.hline(0, { color: 'faint' });
          sB.bars(vals, { x0: 1, color: (val, i) => ['gold', 'purple', 'orange', 'green', 'green'][i], width: 0.65 });
          sR.hline(0, { color: 'faint' });
          sR.line(-1, -0.5, 4, 2, { color: 'green', dash: true, width: 1.8 });
          sR.dots(ratios, { r: 4, color: 'accent' });
          if (s !== 0) sR.dot(s, st.T / st.V, { r: 7, color: 'gold' });
          info = { s, k, ...st, rVp, ratio: st.T / st.V };
        });
        v.legend([['accent', '$u^2$ (drawn at the level)'], ['green', 'virial line $s/2$', { dash: true }], ['accent', '1s ratios', { dot: true }]]);
        v.readout(() => info && `$\\langle T\\rangle=${v.fix(info.T, 4)}$, $\\langle V\\rangle=${v.fix(info.V, 4)}$, $E=${v.fix(info.E, 4)}$ (sum ${v.fix(info.T + info.V, 4)}) · $2\\langle T\\rangle=${v.fix(2 * info.T, 4)}$ vs $\\langle rV'\\rangle=${v.fix(info.rVp, 4)}$` + (info.s === 0 ? ' (for $\\ln r$, $rV\'=1$)' : `\n$\\langle T\\rangle/\\langle V\\rangle=${v.fix(info.ratio, 4)}$ against the theorem's $s/2=${v.fix(info.s / 2, 4)}$${info.s === -1 ? `, and $\\langle T\\rangle=-E$: $${v.fix(info.T, 4)}$ vs $${v.fix(-info.E, 4)}$` : ''}`));
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Non-crossing rule',
      credit: 'von Neumann and Wigner, 1929 (Phys. Z. 30, 467); Teller, 1937 (polyatomic molecules, conical intersections)',
      statement: String.raw`Let a real symmetric Hamiltonian depend on one parameter (the internuclear distance of a diatomic). Two of its eigenvalues belonging to states of the **same symmetry** (same $\Lambda$, spin, parity…) generically do not cross: they approach and then repel, $E_\pm=\bar E\pm\sqrt{d^2+V_{12}^2}$, whose minimum gap $2|V_{12}|$ is nonzero whenever the coupling is. States of **different** symmetry have $V_{12}\equiv0$ and may cross freely. In a molecule with $f$ internal coordinates, same-symmetry levels can cross only on a set of dimension $f-2$, a cone-shaped point in two coordinates.`,
      scope: String.raw`A statement of genericity for real Hamiltonians, with $f$ the number of internal coordinates: accidental crossings are exceptional, not strictly impossible, and the Born–Oppenheimer curves lose meaning exactly where they approach. Complex (e.g. magnetic) Hamiltonians need three parameters.`,
      idea: String.raw`In the two-dimensional space of the two levels the Hamiltonian is a real symmetric matrix $\begin{pmatrix}H_{11}&V\\V&H_{22}\end{pmatrix}$ and the eigenvalues coincide only if both conditions $H_{11}=H_{22}$ and $V=0$ hold. A real parameter family can satisfy one condition by tuning, but two independent conditions need two parameters. This is the same counting that makes the degenerate perturbation problem of 4.7 split: the repulsion is the secular determinant of 4.2 with the coupling in the off-diagonal. Symmetry sets $V=0$ identically, which is the one way to cross for free (cf. mech-11.13).`,
      caption: String.raw`Left: two diabatic energies (straight lines, blue and orange) cross as $R$ varies. With **same** symmetry and a nonzero coupling the solid adiabatic curves repel; their colour shows which diabatic state they resemble, swapping across the avoided crossing. Choose **different** symmetry and they cross. Right: the energy surface over the two parameters (half the diabatic difference $d$, the coupling $V$) is a double cone. Your one-parameter sweep is the hyperbola at fixed $V$; the second slider $q$ moves it by changing $V=g\,q$, and it hits the tip (a true crossing) only when $q=0$, something a diatomic molecule has no coordinate to do.`,
      deps: ['qchem-4.7', 'qchem-4.2', 'mech-11.13'],
      see: ['mech-11.13', 'qm-11.5'],
      refs: ['McQuarrie ch. 11'],
      tags: ['avoided crossing', 'conical intersection', 'symmetry'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Avoided_crossing' },
      viz(v) {
        const M = v.M, G = 0.5, A = 1.0;       // coupling V = G q; half-difference of the diabats d = A (R − R0)
        const symS = v.select('the two states have', [{ value: 'same', label: 'the same symmetry' }, { value: 'diff', label: 'different symmetry' }], 'same');
        const qS = v.slider('second coordinate $q$ (V = 0.5 q)', -1, 1, 0.5, { step: 0.01 });
        const s2 = v.stage({ x: [-1, 1], y: [-1.6, 1.6], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'R − R₀', ylabel: 'energy', title: 'potential energy curves' });
        const s3 = v.stage3d({ height: 340, range: 1.5, yaw: 0.7, pitch: 0.35, labels: ['d', 'V', 'E'], weight: 0.9 });
        let info = null;
        v.render(() => {
          const same = symS.value === 'same', V = same ? G * qS.value : 0;
          qS.el.hidden = !same;
          const e1 = (R) => -0.6 * R * 0 + (-A * R * 0.9), e2 = (R) => A * R * 0.9;      // diabatic lines H11, H22 (average zero)
          s2.hline(0, { color: 'faint' });
          s2.line(-1, e1(-1), 1, e1(1), { color: 'accent', dash: true, alpha: 0.7, width: 1.5 }); s2.line(-1, e2(-1), 1, e2(1), { color: 'orange', dash: true, alpha: 0.7, width: 1.5 });
          const d = (R) => A * 0.9 * R, E = (R, sg) => sg * Math.hypot(d(R), V);
          const w = (R, sg) => { const dd = d(R), r = Math.hypot(dd, V) || 1e-12; return 0.5 * (1 + (sg * dd) / r); };   // weight of diabat 2 in state sg  (sg=+1 upper)
          for (const sg of [-1, 1]) {
            const NSEG = 160;
            for (let i = 0; i < NSEG; i++) { const R0 = -1 + (2 * i) / NSEG, R1 = -1 + (2 * (i + 1)) / NSEG; s2.segment([R0, E(R0, sg)], [R1, E(R1, sg)], { color: v.mix('accent', 'orange', w((R0 + R1) / 2, sg) ), width: 3.2 }); }
          }
          if (same && Math.abs(V) > 1e-6) { s2.measure(0.02, -Math.abs(V), 0.02, Math.abs(V), '2|V|'); }
          // cone
          const cone = (sg) => s3.surface((r, ph) => [r * Math.cos(ph), r * Math.sin(ph), sg * r], [0, 1.2], [0, 2 * Math.PI], { n: 26, color: sg > 0 ? 'orange' : 'accent', alpha: 0.35, wire: true });
          cone(1); cone(-1);
          const path = (sg) => s3.curve((t) => [A * 0.9 * t, V, sg * Math.hypot(A * 0.9 * t, V)], -1, 1);
          path(1); path(-1);
          s3.dot([0, 0, 0], { label: 'degeneracy' });
          info = { same, V, gap: 2 * Math.abs(V), q: qS.value };
        });
        v.legend([['accent', 'diabatic state 1 / its character'], ['orange', 'diabatic state 2 / its character']]);
        v.readout(() => info && (info.same ? `coupling $V=0.5\\,q=${v.fix(info.V, 3)}$ · minimum gap $2|V|=${v.fix(info.gap, 3)}$ at the would-be crossing · ${Math.abs(info.V) < 1e-3 ? '**$q=0$: at the tip of the cone the curves touch (a conical intersection)**; one coordinate alone could not reach it' : 'the sweep passes at distance $|V|$ from the tip, so the levels repel'}` : '$V\\equiv0$ by symmetry: the curves cross at $R_0$ with no gap, the two states do not talk to each other'));
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'London dispersion forces',
      credit: 'London, 1930 (Eisenschitz and London, Z. Phys. 60, 491; London, Z. Phys. 63, 245); Drude oscillator model of London, 1937',
      statement: String.raw`Two neutral, spherically symmetric atoms at large separation $R$ attract one another even though each has no permanent dipole. Second-order perturbation theory in the dipole–dipole interaction gives
$$E_{\rm disp}(R)=-\frac{C_6}{R^6},\qquad C_6=\sum_{m,n\ne0}\frac{|\langle0|\boldsymbol\mu_A|m\rangle|^2\,|\langle0|\boldsymbol\mu_B|n\rangle|^2}{3\,(4\pi\varepsilon_0)^2\,(E_m-E_0^A+E_n-E_0^B)},$$
and in London's one-frequency (Drude) approximation, with $\hbar\omega_0\approx$ the ionisation energy and polarizability volume $\alpha'=\alpha/4\pi\varepsilon_0$ for both atoms, $C_6\approx\tfrac34\hbar\omega_0\alpha'^2$.`,
      scope: String.raw`Valid at distances where the electron clouds do not overlap and retardation is negligible ($R\ll$ the wavelength of the dominant transitions; beyond that the $R^{-7}$ Casimir–Polder law takes over). The Drude estimate is accurate only to tens of percent: for argon it gives $\approx53$ a.u. while the best dipole-oscillator-strength and *ab initio* values are near $64$ a.u. (quoted from a literature range 62–65, not looked up in the primary source).`,
      idea: String.raw`The first-order dipole–dipole energy vanishes because each atom's ground state has $\langle\boldsymbol\mu\rangle=0$ (4.4). At second order (4.5) the ground state is lowered by mixing in simultaneous excitations of both atoms, which is an effect of the *correlation* of the two fluctuating dipoles: the energy is $-\sum|W_{0,mn}|^2/(\Delta E)$ with $W\propto R^{-3}$, hence $R^{-6}$. The Drude model makes this exact: two oscillators coupled by $-2\mu_1\mu_2/4\pi\varepsilon_0R^3$ have normal modes $\omega_\pm=\omega_0\sqrt{1\pm\kappa}$ with $\kappa=2\alpha'/R^3$, and the zero-point energy sinks by $\tfrac12\hbar(\omega_++\omega_--2\omega_0)\approx-\hbar\omega_0\kappa^2/8$; adding the two transverse pairs ($\kappa/2$) gives $-\tfrac34\hbar\omega_0\alpha'^2/R^6$.`,
      caption: String.raw`Pick a noble gas (polarizability $\alpha'$ from experiment and $\hbar\omega_0=$ the first ionisation energy, as London proposed) or edit the sliders, and drag the separation $R$. Left, on log-log axes: the exact zero-point energy shift of three coupled Drude oscillator pairs (blue) and the $-C_6/R^6$ asymptote (dashed); they merge at large $R$ with slope $-6$, and the model breaks down (grey zone, far inside the region where real atoms overlap) where $\kappa\to1$ and the soft mode collapses. Shrink $R$ to see the correlation tilt grow. Right: samples of the joint ground-state distribution of the two dipole coordinates along the axis, $(x_1,x_2)$ in units of $\sqrt{\hbar/m\omega_0}$: the cloud is tilted onto the diagonal because the fluctuations are correlated, and that correlation is what the energy comes from.`,
      deps: ['qchem-4.5', 'qchem-4.6', 'qm-11.17'],
      see: ['qm-11.17', 'qchem-4.12'],
      refs: ['McQuarrie ch. 8'],
      tags: ['dispersion', 'van der Waals', 'Drude model'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/London_dispersion_force' },
      viz(v) {
        const M = v.M;
        // static dipole polarizabilities in atomic units (experimental values compiled in arXiv:1805.04989, Table); ionisation energies from NIST (shared table)
        const ATOMS = { He: { Z: 2, a: 1.3838 }, Ne: { Z: 10, a: 2.6611 }, Ar: { Z: 18, a: 11.083 }, Kr: { Z: 36, a: 16.74 }, Xe: { Z: 54, a: 27.292 } };
        const A03 = A0_ANG ** 3, C6conv = HARTREE_EV * A0_ANG ** 6;
        const atom = v.select('atom (London’s $\\hbar\\omega_0\\approx I$)', [...Object.keys(ATOMS), 'custom'], 'Ar', { onChange: (x) => { if (ATOMS[x]) { aS.set(ATOMS[x].a * A03); wS.set(IE[ATOMS[x].Z - 1]); } } });
        const aS = v.slider('polarizability volume $\\alpha\'$ (Å³)', 0.1, 6, ATOMS.Ar.a * A03, { step: 0.01 });
        const wS = v.slider('$\\hbar\\omega_0$ (eV)', 5, 30, IE[17], { step: 0.01 });
        const rS = v.slider('separation $R$ (Å)', 1.6, 12, 3.8, { step: 0.05 });
        const sE = v.stage({ x: [1.2, 14], y: [1e-4, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'R (Å)', ylabel: '|ΔE| (meV)', title: 'dispersion energy of two atoms' });
        const sS = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, axes: 'box', gutter: true, height: 330, weight: 0.85, xlabel: 'x₁', ylabel: 'x₂', title: 'correlated dipole fluctuations' });
        const g = (k) => Math.sqrt(1 + k) + Math.sqrt(1 - k) - 2;
        const dE = (R, al, w) => { const k = (2 * al) / R ** 3; return k >= 1 ? NaN : 0.5 * w * (g(k) + 2 * g(k / 2)); };       // eV, three Drude pairs
        const rng = v.rng(7), Zs = Array.from({ length: 500 }, () => [rng.normal(), rng.normal()]);
        let info = null;
        v.render(() => {
          const al = aS.value, w = wS.value, R = rS.value, C6 = 0.75 * w * al * al, k = (2 * al) / R ** 3;
          const Rc = (2 * al) ** (1 / 3);
          sE.vband(1.2, Math.max(1.2001, Rc), { color: 'muted', alpha: 0.18 });
          sE.fn((x) => (C6 / x ** 6) * 1e3, { color: 'orange', dash: true, width: 1.8, domain: [1.2, 14] });
          sE.fn((x) => { const e = dE(x, al, w); return Number.isNaN(e) ? NaN : -e * 1e3; }, { color: 'accent', width: 2.6, domain: [Math.max(1.2, Rc * 1.0001), 14] });
          const e = dE(R, al, w);
          if (!Number.isNaN(e)) sE.dot(R, -e * 1e3, { r: 7, color: 'gold' });
          sE.text('κ ≥ 1: model collapses', 1.3, 3e-4, { color: 'muted', size: 11 });
          // correlated Gaussians for the axial pair: modes (x1 ± x2)/√2 with ω² = ω0²(1 ∓ κ), variances 1/(2√(1∓κ)) in units of ħ/mω0
          if (k < 1) {
            const vs = 1 / (2 * Math.sqrt(1 - k)), va = 1 / (2 * Math.sqrt(1 + k)), pts = Zs.map(([a, b]) => { const X = a * Math.sqrt(vs), Y = b * Math.sqrt(va); return [(X + Y) / Math.SQRT2, (X - Y) / Math.SQRT2]; });
            sS.dots(pts, { r: 2, color: 'accent', alpha: 0.5 });
            sS.line(-3, -3, 3, 3, { color: 'faint', dash: true });
            sS.curve((t) => { const X = 2 * Math.sqrt(vs) * Math.cos(t), Y = 2 * Math.sqrt(va) * Math.sin(t); return [(X + Y) / Math.SQRT2, (X - Y) / Math.SQRT2]; }, 0, 2 * Math.PI, { color: 'orange', width: 2 });
            info = { al, w, R, C6, k, e, corr: (vs - va) / (vs + va), ok: true };
          } else info = { al, w, R, C6, k, e, corr: NaN, ok: false };
        });
        v.legend([['accent', 'Drude energy shift (exact for the model)'], ['orange', '$-C_6/R^6$', { dash: true }]]);
        v.readout(() => info && (info.ok ? `at $R=${v.fix(info.R, 2)}$ Å: $\\kappa=2\\alpha'/R^3=${v.fix(info.k, 3)}$ · $\\Delta E=${v.fix(info.e * 1e3, 3)}$ meV (asymptote $-C_6/R^6=-${v.fix((info.C6 / info.R ** 6) * 1e3, 3)}$ meV)` : `at $R=${v.fix(info.R, 2)}$ Å the coupling is $\\kappa\\ge1$: the soft mode has no restoring force (model breakdown)`) + `\n$C_6\\approx\\tfrac34\\hbar\\omega_0\\alpha'^2=${v.fix(info.C6, 1)}$ eV Å⁶ $=${v.fix(info.C6 / C6conv, 1)}$ a.u. · correlation of the axial dipole coordinates $\\langle x_1x_2\\rangle/\\langle x^2\\rangle=${info.ok ? v.fix(info.corr, 3) : '—'}$`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Lennard-Jones potential',
      credit: 'J. E. Jones, 1924 (Proc. R. Soc. A 106, 441 and 463; the $r^{-6}$ attraction, repulsive exponent fitted); named for Lennard-Jones, who developed it in 1931',
      statement: String.raw`The Lennard-Jones (12–6) potential between two closed-shell atoms or molecules is
$$U(r)=4\varepsilon\Big[\Big(\frac\sigma r\Big)^{12}-\Big(\frac\sigma r\Big)^{6}\Big],$$
with $U(\sigma)=0$, a minimum $U=-\varepsilon$ at $r_m=2^{1/6}\sigma\approx1.122\,\sigma$, and an attractive tail $-C_6/r^6$ with $C_6=4\varepsilon\sigma^6$ equal to the London dispersion coefficient (4.11). The repulsion $r^{-12}$ is a convenience (it is the square of $r^{-6}$); the real repulsion is closer to exponential.`,
      scope: String.raw`An effective pair potential: its two parameters are fitted, so $C_6=4\varepsilon\sigma^6$ is generally larger than the true dispersion coefficient (for argon with $\varepsilon/k_B=119.8$ K and $\sigma=3.405$ Å it gives $\approx108$ a.u. against the Drude estimate $53$ a.u. of 4.11, because it also absorbs three-body and repulsion effects). The argon parameters are commonly used values; their original source was not checked.`,
      idea: String.raw`Dispersion fixes the long-range form $-C_6/r^6$ (4.11) and the Pauli repulsion from overlapping closed shells (exclusion, 3.1) fixes a steep wall; any two-parameter curve with these two features has a well of the same character. Choosing the twelfth power makes the algebra trivial: setting $dU/dr=0$ gives $r_m=2^{1/6}\sigma$ and $U(r_m)=-\varepsilon$. How arbitrary the wall is shows up in the second virial coefficient $B_2(T)=2\pi N_A\int_0^\infty(1-e^{-U/k_BT})r^2dr$, which is sensitive to the well but only mildly to the steepness once the position and depth of the minimum are fixed.`,
      caption: String.raw`The curve uses the parameters of argon, $\varepsilon/k_B=119.8$ K ($10.32$ meV) and $\sigma=3.405$ Å. Choose the repulsive wall: the classical **12–6**, a generalised **$n$–6** with the same minimum $r_m$ and depth $\varepsilon$ and steepness $n$, or an **exp-6** (Buckingham) with steepness $\alpha$. Drag the steepness: the well stays put and the wall moves, and the exp-6 form turns over at very small $r$ and becomes unphysical (shaded). Right: the second virial coefficient computed from whatever $U$ you have, with the temperature where it changes sign (the Boyle temperature); for the 12–6 form it is $3.42\,\varepsilon/k_B\approx410$ K for argon's parameters. The potentials are models, not fits to measured data.`,
      deps: ['qchem-4.11', 'qchem-3.1'],
      see: ['qchem-4.11'],
      refs: ['McQuarrie ch. 8'],
      tags: ['Lennard-Jones', 'intermolecular potential', 'second virial coefficient'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lennard-Jones_potential' },
      viz(v) {
        const EPS = 119.8 * KB_MEV, SIG = 3.405, RM = 2 ** (1 / 6) * SIG, NA = 0.6022140857;     // meV, Å, Å, 10⁻²⁴ mol⁻¹ (so Å³ → cm³/mol)
        const form = v.select('repulsive wall', [{ value: 'lj', label: '12–6' }, { value: 'nm', label: '$n$–6' }, { value: 'exp', label: 'exp-6' }], 'lj', { onChange: (f) => { stp.el.hidden = f === 'lj'; if (f === 'nm') stp.set(16); if (f === 'exp') stp.set(14); } });
        const stp = v.slider('steepness ($n$ or $\\alpha$)', 8, 24, 14, { step: 0.1 });
        stp.el.hidden = true;
        const sU = v.stage({ x: [3, 8.5], y: [-14, 30], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'r (Å)', ylabel: 'U (meV)', title: 'pair potential' });
        const sB = v.stage({ x: [60, 1000], y: [-400, 80], axes: 'box', gutter: true, height: 330, weight: 0.95, xlabel: 'T (K)', ylabel: 'B₂ (cm³/mol)', title: 'second virial coefficient' });
        const U = (f, s, r) => {
          if (f === 'lj') return 4 * EPS * ((SIG / r) ** 12 - (SIG / r) ** 6);
          if (f === 'nm') return (EPS / (s - 6)) * (6 * (RM / r) ** s - s * (RM / r) ** 6);
          return (EPS / (1 - 6 / s)) * ((6 / s) * Math.exp(s * (1 - r / RM)) - (RM / r) ** 6);
        };
        const rPeak = (s) => { let rp = RM; for (let r = RM; r > 0.4; r -= 0.01) { if (U('exp', s, r - 0.01) < U('exp', s, r)) { rp = r; break; } } return rp; };
        const B2 = (f, s, T) => {
          const kT = KB_MEV * T, rc = f === 'exp' ? rPeak(s) : 0.3; let I = 0; const h = 0.02;
          for (let r = Math.max(rc, 0.3) + h / 2; r < 40; r += h) { const e = Math.exp(-U(f, s, r) / kT); I += (1 - (Number.isFinite(e) ? e : 0)) * r * r * h; }
          I += (Math.max(rc, 0.3) ** 3) / 3;
          const C6 = f === 'lj' ? 4 * EPS * SIG ** 6 : f === 'nm' ? (EPS * s * RM ** 6) / (s - 6) : (EPS * RM ** 6) / (1 - 6 / s);
          I += (C6 / kT) / (3 * 40 ** 3);
          return 2 * Math.PI * NA * I;
        };
        let info = null;
        v.render(() => {
          const f = form.value, s = f === 'lj' ? 12 : stp.value;
          const rp = f === 'exp' ? rPeak(s) : 0;
          if (f === 'exp') sU.rect(3, -14, rp, 30, { color: 'muted', fill: 'muted', fillAlpha: 0.15, stroke: false });
          sU.hline(0, { color: 'faint' }); sU.hline(-EPS, { color: 'green', dash: true, alpha: 0.7 });
          sU.vline(SIG, { color: 'faint', dash: true }); sU.vline(RM, { color: 'green', dash: true, alpha: 0.7 });
          if (f !== 'lj') sU.fn((r) => U('lj', 12, r), { color: 'muted', dash: true, width: 1.6, domain: [3, 8.5] });
          const C6 = f === 'lj' ? 4 * EPS * SIG ** 6 : f === 'nm' ? (EPS * s * RM ** 6) / (s - 6) : (EPS * RM ** 6) / (1 - 6 / s);
          sU.fn((r) => -C6 / r ** 6, { color: 'orange', dash: [2, 3], width: 1.4, domain: [3.3, 8.5] });
          sU.fn((r) => (f === 'exp' && r < rp ? NaN : U(f, s, r)), { color: 'accent', width: 2.6, domain: [3, 8.5] });
          sU.dot(RM, -EPS, { r: 5, color: 'green', label: `rₘ = ${RM.toFixed(2)} Å`, labelPos: 'n' });
          sU.text('σ', SIG, 27, { color: 'muted', align: 'center' });
          const Ts = Array.from({ length: 36 }, (_, i) => 60 + (940 * i) / 35), pts = Ts.map((T) => [T, B2(f, s, T)]);
          const ref = f === 'lj' ? null : Ts.map((T) => [T, B2('lj', 12, T)]);
          if (ref) sB.path(ref, { color: 'muted', dash: true, width: 1.6 });
          sB.hline(0, { color: 'faint' });
          sB.path(pts, { color: 'accent', width: 2.6 });
          let TB = NaN; for (let i = 1; i < pts.length; i++) if (pts[i - 1][1] < 0 && pts[i][1] >= 0) { TB = pts[i - 1][0] + ((pts[i][0] - pts[i - 1][0]) * -pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1]); break; }
          if (!Number.isNaN(TB)) sB.dot(TB, 0, { r: 6, color: 'gold', label: `Boyle T ≈ ${TB.toFixed(0)} K`, labelPos: 'ne' });
          info = { f, s, C6, TB, rp, b300: B2(f, s, 300) };
        });
        v.legend([['accent', 'this potential'], ['muted', '12–6', { dash: true }], ['orange', '$-C_6/r^6$ tail', { dash: [2, 3] }], ['green', 'well: $-\\varepsilon$, $r_m$', { dash: true }]]);
        v.readout(() => info && `$r_m=${v.fix(RM, 3)}$ Å, depth $\\varepsilon=${v.fix(EPS, 2)}$ meV, $\\sigma=${v.fix(SIG, 3)}$ Å, tail coefficient $C_6=${v.fix(info.C6 / (HARTREE_EV * A0_ANG ** 6) * 1e-3, 1)}$ a.u. (for the 12–6: $4\\varepsilon\\sigma^6$) · $B_2(300\\,\\mathrm{K})=${v.fix(info.b300, 1)}$ cm³/mol · Boyle temperature ${Number.isNaN(info.TB) ? '—' : v.fix(info.TB, 0) + ' K'} (12–6: $3.42\\,\\varepsilon/k_B\\approx410$ K)` + (info.f === 'exp' ? `\nthe exp-6 curve turns over at $r=${v.fix(info.rp, 2)}$ Å (shaded, treated as a hard core in $B_2$)` : ''));
      },
    },
  ],
};
