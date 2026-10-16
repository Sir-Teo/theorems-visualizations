// Quantum Chemistry & Spectroscopy — Chapter 1: Quantum models a chemist lives by (items 1.1–1.7 and 1.9; the rest in ch01-b.js)
import { TAU, grid, normalize, interp, phaseLUT, drawPsi, drawReal, phaseWheel, numerov, countNodes, hermiteFns, boxPsi, Ylm, fz, sub, FAMILY, units } from './ch01.shared.js';

// ---------------------------------------------------------------------------------------------------------------
// Experimental data used by 1.5 (checked on the web, October 2026)
// Thiacyanine dyes 3,3'-diethylthia-(n+1)-carbocyanine iodide, n vinylene groups added between the two rings: peak wavelengths as
// tabulated by Sturmer and reproduced in a university lab manual (Lakehead CHEM 3451, Table 7.1): 423, 557, 650, 758 nm.
// Spot-checks against suppliers' spec sheets: carbocyanine 557 nm (TCI, MeOH); tricarbocyanine 762 nm (TCI, EtOH).
const CYANINE = [[0, 423], [1, 557], [2, 650], [3, 758]];
// Simple polyenes with k conjugated C=C: butadiene 217, hexatriene 258, octatetraene 290 nm (OpenStax Organic Chemistry §14.8);
// beta-carotene (k = 11): 451–455 nm in hexane (PhotochemCAD, Glentham spec sheet).
const POLYENE = [[2, 217], [3, 258], [4, 290], [11, 453]];

export default {
  collection: 'qchem',
  chapter: 1,
  title: 'Quantum models a chemist lives by',
  summary: String.raw`Chemistry borrows a handful of exactly solvable quantum problems and leans on them constantly. The particle in a box explains why long conjugated dyes absorb red light, the harmonic oscillator underlies every vibrational spectrum, and the rigid rotor every rotational one. Along the way we meet the operator language — Hermitian observables, commutators, uncertainty — that the rest of the course uses, and the time-dependent equation that makes wave packets move.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Postulate',
      name: 'Time-independent Schrödinger equation',
      credit: 'Schrödinger, 1926',
      statement: String.raw`The stationary states of a particle of mass $m$ in a potential $V(x)$ are the normalizable solutions of the eigenvalue equation
$$-\frac{\hbar^2}{2m}\,\psi''(x)+V(x)\,\psi(x)=E\,\psi(x).$$
For a *bound* particle (one whose potential climbs above $E$ on both sides) a solution that stays finite at both ends exists only for special energies $E_0<E_1<E_2<\dots$ The $n$-th eigenfunction has $n$ nodes. In chemistry $E$ is the energy of an electron in an orbital or of a nuclear motion in a molecular potential.`,
      scope: String.raw`Non-relativistic, one particle, a fixed real potential. For several particles the same equation holds in many dimensions (chapters 3 and 7).`,
      idea: String.raw`Where $E>V$ the equation reads $\psi''=-k^2\psi$ with $k^2=2m(E-V)/\hbar^2>0$ and the solution oscillates; where $E<V$ it reads $\psi''=+\kappa^2\psi$ and the solution is a mix of $e^{+\kappa x}$ and $e^{-\kappa x}$. Integrating from the left wall, the growing exponential is generically present in the forbidden region on the right, so $\psi$ diverges there. Only when $E$ is tuned so that its coefficient vanishes does the tail decay: **quantization is the requirement that the shooting solution is the decaying one**. The count of nodes rises by one at each eigenvalue (Sturm oscillation).`,
      caption: String.raw`Pick a well and **slide the trial energy $E$**. The solution is integrated from the left wall by Numerov's method and drawn at height $E$; its value at the far wall is the shooting function (right, signed $\log_{10}$ scale). It blows up with one sign, then the other, and crosses zero only at the eigenvalues (green lines). Use **snap** to jump to the nearest one and count the nodes.`,
      deps: ['qm-2.4'],
      see: ['qm-3.1'],
      refs: ['McQuarrie ch. 3'],
      tags: ['Schrödinger equation', 'eigenvalue problem', 'shooting method'],
      viz(v) {
        const M = v.M, NG = 1000, EMAX = 14;
        const POTS = {
          morse: { name: 'Morse well (a bond)', V: (x) => 12 * (1 - Math.exp(-0.5 * x)) ** 2, xr: [-3, 14], yr: [-0.8, 14.5] },
          harm: { name: 'harmonic well', V: (x) => 0.5 * x * x, xr: [-6, 6], yr: [-0.8, 14.5] },
          finite: { name: 'finite square well', V: (x) => (Math.abs(x) < 2 ? 0 : 10), xr: [-5, 5], yr: [-0.8, 14.5] },
          dbl: { name: 'double well', V: (x) => 0.15 * (x * x - 4) ** 2, xr: [-4.6, 4.6], yr: [-0.8, 14.5] },
        };
        const pot = v.select('potential', Object.entries(POTS).map(([value, p]) => ({ value, label: p.name })), 'morse', { onChange: () => { Es.set(1.19); } });
        const Es = v.slider('trial energy $E$', 0.02, EMAX, 1.19, { step: 0.001, decimals: 3 });
        const cache = {};
        const setup = () => {
          const k = pot.value; if (cache[k]) return cache[k];
          const P = POTS[k], { x, dx } = grid(P.xr[0], P.xr[1], NG), Vg = Float64Array.from(x, P.V);
          const shoot = (E) => numerov(Vg, dx, E, 0, 1e-8);
          const endOf = (E) => { const u = shoot(E); return u[NG - 1]; };
          // scan of the shooting function
          const Esc = [], f = [], NS = 700;
          for (let i = 0; i <= NS; i++) {
            const E = 0.02 + ((EMAX - 0.02) * i) / NS, u = shoot(E);
            let mx = 0; for (let j = 0; j < NG; j++) if (Vg[j] < E) mx = Math.max(mx, Math.abs(u[j]));
            if (!mx) mx = 1e-8;
            Esc.push(E); f.push(Math.sign(u[NG - 1]) * Math.min(7, Math.log10(1 + Math.abs(u[NG - 1]) / mx)));
          }
          const roots = [];
          for (let i = 0; i < NS; i++) if (f[i] * f[i + 1] < 0) { roots.push(M.bisect((E) => endOf(E), Esc[i], Esc[i + 1], 1e-10)); }
          const R = M.schrodinger1D(P.V, P.xr, { n: 900, k: 10 });
          return (cache[k] = { P, x, dx, Vg, shoot, Esc, f, roots, solver: R.E });
        };
        const sL = v.stage({ x: [-3, 14], y: [-0.8, 14.5], height: 360, axes: 'box', gutter: true, weight: 1.35, xlabel: 'x', ylabel: 'E', title: 'solution shot from the left wall at energy $E$' });
        const sR = v.stage({ x: [0, EMAX], y: [-7.6, 7.6], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'trial energy E', ylabel: 'ψ(far wall)', title: 'shooting function (signed log scale)' });
        v.button('Snap to nearest eigenvalue', () => { const S = setup(); if (!S.roots.length) return; let best = S.roots[0]; for (const r of S.roots) if (Math.abs(r - Es.value) < Math.abs(best - Es.value)) best = r; Es.set(best); });
        let st = null;
        v.render(() => {
          const S = setup(), E = Es.value, { P, x, Vg } = S;
          sL.setView(P.xr, P.yr);
          const pts = Array.from(x, (X, i) => [X, Math.min(Vg[i], 40)]);
          sL.clip(() => {
            sL.poly([[x[0], P.yr[0] - 1], ...pts, [x[NG - 1], P.yr[0] - 1]], { fill: 'muted', fillAlpha: 0.13, stroke: false });
            sL.path(pts, { color: 'muted', width: 2 });
          });
          sL.hline(E, { color: 'ink', width: 1, dash: [4, 3], alpha: 0.6 });
          const u = S.shoot(E);
          let mx = 0; for (let j = 0; j < NG; j++) if (Vg[j] < E) mx = Math.max(mx, Math.abs(u[j]));
          const ok = mx > 0; if (!ok) mx = 1;
          const amp = (0.09 * (P.yr[1] - P.yr[0])) / mx;
          let iFirst = 0; while (iFirst < NG - 1 && Vg[iFirst] >= E) iFirst++;
          let iLast = NG - 1; while (iLast > 0 && Vg[iLast] >= E) iLast--;
          const nodes = iLast > iFirst ? countNodes(u, iFirst, iLast, 1e-9) : 0;
          const ptsU = []; for (let j = 0; j < NG; j += 2) ptsU.push([x[j], E + amp * u[j]]);
          const endGood = Math.abs(u[NG - 1]) / mx < 0.2;
          sL.clip(() => sL.path(ptsU, { color: endGood ? 'green' : 'accent', width: 2.4 }));
          sL.dot(x[NG - 1] - 0.015 * (P.xr[1] - P.xr[0]), Math.max(P.yr[0] + 0.3, Math.min(P.yr[1] - 0.3, E + amp * u[NG - 1])), { r: 5, color: endGood ? 'green' : 'red' });
          sL.text('ψ at the far wall', P.xr[1] - 0.05 * (P.xr[1] - P.xr[0]), P.yr[1] - 0.9, { size: 11, color: 'muted', align: 'right' });
          // shooting function
          sR.hline(0, { color: 'ink', width: 1, alpha: 0.5 });
          sR.path(S.Esc.map((e, i) => [e, S.f[i]]), { color: 'accent', width: 2 });
          for (const r of S.roots) { sR.vline(r, { color: 'green', width: 1.2, dash: [4, 3] }); }
          sR.vline(E, { color: 'gold', width: 2 });
          sR.dot(E, Math.sign(u[NG - 1]) * Math.min(7, Math.log10(1 + Math.abs(u[NG - 1]) / mx)), { r: 5, color: 'gold' });
          let nearest = S.roots.length ? S.roots[0] : NaN; for (const r of S.roots) if (Math.abs(r - E) < Math.abs(nearest - E)) nearest = r;
          let idx = S.roots.indexOf(nearest);
          const solv = S.solver.reduce((b, e) => (Math.abs(e - nearest) < Math.abs(b - nearest) ? e : b), S.solver[0]);
          st = { E, nodes, tail: Math.sign(u[NG - 1]) * Math.abs(u[NG - 1]) / mx, nearest, idx, solv, endGood };
        });
        v.legend([['accent', 'ψ shot from the left'], ['green', 'eigenvalues from sign changes', { dash: true }], ['gold', 'your trial energy']]);
        v.readout(() => {
          if (!st) return '';
          const n = st.idx >= 0 ? st.idx : '?';
          const tail = Math.abs(st.tail) > 1e6 ? `$${v.sci(Math.abs(st.tail), 1)}$` : v.fix(Math.abs(st.tail), 3);
          return `$E = ${v.fix(st.E, 3)}$ · nodes in the allowed region: **${st.nodes}** · size of the solution at the far wall relative to its bulk: ${st.tail < 0 ? '−' : '+'}${tail}${st.endGood ? ' — **the tail has settled: an eigenvalue**' : ' — diverging'}\nNearest eigenvalue by shooting: $E_{${n}} = ${v.fix(st.nearest, 5)}$ · by diagonalizing the Hamiltonian matrix: ${v.fix(st.solv, 5)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Postulate',
      name: 'Born interpretation of the wavefunction',
      credit: 'Born, 1926',
      statement: String.raw`The wavefunction itself is not observable, but its squared modulus is a probability density: for a particle described by a normalized $\psi(x)$ the probability of finding it in $[a,b]$ is
$$P(a\le x\le b)=\int_a^b|\psi(x)|^2\,dx,\qquad \int_{-\infty}^{\infty}|\psi|^2\,dx=1.$$
Repeating the preparation and the position measurement many times gives a histogram of outcomes that converges to $|\psi|^2$. A solution of the Schrödinger equation can always be rescaled, so the postulate also says that **only the normalized one** carries probabilities; $c\,\psi$ and $\psi$ describe the same state.`,
      idea: String.raw`The Schrödinger equation is linear, so it fixes $\psi$ only up to a constant; the Born rule supplies the missing meaning by tying $|\psi|^2$ to relative frequencies, and the total probability must be one, which fixes $|c|$. For $N$ independent detections the fraction landing in $[a,b]$ is a binomial average with mean $P$ and spread $\sqrt{P(1-P)/N}$, so the histogram converges like $1/\sqrt N$ (law of large numbers). The overall phase of $\psi$ never shows up in $|\psi|^2$.`,
      caption: String.raw`A particle in a box prepared in state $n$ is detected again and again; every click lands at a random place drawn from $|\psi_n|^2$ and the histogram (orange) fills in. **Drag the orange handles** $a$ and $b$ to choose an interval: the right panel shows the fraction of clicks inside it homing in on the Born probability (green) inside its $\pm1/\sqrt N$ band. Change the **scale $c$** of $\psi$: the unnormalized curve $|c\psi|^2$ no longer matches the histogram (its area is $c^2$, not 1) — only the normalized one is a probability density.`,
      deps: ['qchem-1.1', 'qm-2.2'],
      see: ['qm-2.2'],
      refs: ['McQuarrie ch. 4'],
      tags: ['Born rule', 'probability density', 'normalization'],
      viz(v) {
        const M = v.M, NP = 6000, T = 20;
        const nS = v.slider('box state $n$', 1, 4, 2, { int: true });
        const cS = v.slider('scale $c$ of $\\psi$ ($c=1$: normalised)', 0.5, 2, 1, { step: 0.01 });
        const s1 = v.stage({ x: [0, 1], y: [-0.3, 2.6], height: 340, axes: 'box', gutter: true, weight: 1.3, xlabel: 'x / L', ylabel: 'density', title: 'detector clicks and $|\\psi|^2$' });
        const s2 = v.stage({ x: [10, NP], y: [0, 1], xlog: true, height: 340, axes: 'box', gutter: true, weight: 1, xlabel: 'number of clicks N', ylabel: 'fraction in [a, b]', title: 'fraction of clicks in $[a,b]$' });
        const ha = s1.handle(0.25, -0.15, { color: 'orange', r: 7, label: 'a', labelPos: 'n', constrain: 'x' });
        const hb = s1.handle(0.6, -0.15, { color: 'orange', r: 7, label: 'b', labelPos: 'n', constrain: 'x' });
        const cache = {};
        const clicks = (n) => {
          if (cache[n]) return cache[n];
          const xs = [], ps = []; for (let i = 0; i <= 800; i++) { const x = i / 800; xs.push(x); ps.push(2 * Math.sin(n * Math.PI * x) ** 2); }
          const f = M.gridSampler(xs, ps), r = v.rng(11 * n + 3), a = new Float64Array(NP);
          for (let k = 0; k < NP; k++) a[k] = f(r());
          return (cache[n] = a);
        };
        const Pint = (n, a, b) => (b - a) - (Math.sin(2 * n * Math.PI * b) - Math.sin(2 * n * Math.PI * a)) / (2 * n * Math.PI);
        let st = null;
        v.animate((t) => {
          const n = nS.value, c = cS.value, arr = clicks(n), N = Math.max(0, Math.min(NP, Math.floor((NP * t) / T)));
          let a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x); if (b - a < 0.02) b = a + 0.02;
          const ymax = Math.max(2.4, 2 * c * c * 1.12);
          s1.setView([0, 1], [-0.17 * ymax, ymax]);
          ha.set(M.clamp(ha.x, 0, 1), -0.09 * ymax); hb.set(M.clamp(hb.x, 0, 1), -0.09 * ymax);
          s1.hline(0, { color: 'faint' });
          const dens = (x) => 2 * c * c * Math.sin(n * Math.PI * x) ** 2;
          s1.fn((x) => dens(x), { domain: [a, b], fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 0.5 });
          if (N >= 2) s1.hist(Array.from(arr.subarray(0, N)), { bins: 40, range: [0, 1], density: true, color: 'orange', fillAlpha: 0.32 });
          s1.fn(dens, { color: 'accent', width: 2.4 });
          if (Math.abs(c - 1) > 0.005) s1.fn((x) => 2 * Math.sin(n * Math.PI * x) ** 2, { color: 'green', width: 2, dash: [6, 4] });
          for (let k = Math.max(0, N - 40); k < N; k++) s1.line(arr[k], -0.025 * ymax, arr[k], -0.075 * ymax * 0.999, { color: 'gold', width: 1.5, alpha: 0.4 + 0.6 * ((k - (N - 40)) / 40) });
          // fraction of clicks inside [a, b]
          const P = Pint(n, a, b); let inside = 0; const pts = [], marks = new Set();
          for (let q = 0; q <= 140; q++) marks.add(Math.round(10 * Math.pow(NP / 10, q / 140)));
          for (let k = 0; k < N; k++) { if (arr[k] >= a && arr[k] <= b) inside++; if (marks.has(k + 1) && k + 1 >= 10) pts.push([k + 1, inside / (k + 1)]); }
          const cap = (x) => M.clamp(x, 0, 1);
          s2.between((x) => cap(P - Math.sqrt((P * (1 - P)) / x)), (x) => cap(P + Math.sqrt((P * (1 - P)) / x)), 10, NP, { fill: 'green', fillAlpha: 0.14 });
          s2.hline(P, { color: 'green', width: 2 });
          if (pts.length > 1) s2.path(pts, { color: 'orange', width: 2 });
          if (N >= 10) s2.dot(N, inside / N, { r: 5, color: 'gold' });
          st = { n, c, N, a, b, P, inside, area: c * c };
        }, { period: T, still: 16 });
        v.legend([['orange', 'histogram of detector clicks', { area: true }], ['accent', '$|c\\psi|^2$'], ['green', 'normalised $|\\psi|^2$ / Born probability', { dash: true }]]);
        v.readout(() => st && `${st.N} clicks · inside $[a,b]=[${v.fix(st.a, 2)},${v.fix(st.b, 2)}]$: ${st.inside}${st.N ? ` (${v.fix(st.inside / st.N, 3)})` : ''} against Born $P=\\int_a^b|\\psi|^2dx=${v.fix(st.P, 4)}$ · area under the plotted $|c\\psi|^2$ is $c^2=${v.fix(st.area, 2)}$${Math.abs(st.c - 1) > 0.005 ? ' — not a probability density until divided by it' : ' — normalised, as the Born rule requires'}.`);
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Hermitian operators: real eigenvalues, orthogonal states',
      statement: String.raw`An operator $\hat A$ is **Hermitian** (self-adjoint) when $\langle\phi|\hat A\psi\rangle=\langle\hat A\phi|\psi\rangle$ for all states; for a matrix this means $A=A^\dagger$ (conjugate transpose). Then:
(a) every eigenvalue of $\hat A$ is real;
(b) eigenvectors belonging to different eigenvalues are orthogonal, $\langle\psi_i|\psi_j\rangle=0$;
(c) in finite dimension (and for the operators of chemistry with discrete spectrum) the eigenvectors can be chosen as an orthonormal basis of the whole space.
This is why measurable quantities are represented by Hermitian operators: measured values are real numbers, and the possible outcomes are mutually exclusive states.`,
      scope: String.raw`Finite matrices exactly; for differential operators one also needs the boundary conditions that make $\hat A$ self-adjoint. A non-Hermitian matrix may still have real eigenvalues — but its eigenvectors then fail to be orthogonal.`,
      idea: String.raw`If $\hat A\psi=a\psi$ then $a\langle\psi|\psi\rangle=\langle\psi|\hat A\psi\rangle=\langle\hat A\psi|\psi\rangle=\bar a\langle\psi|\psi\rangle$, so $a=\bar a$ is real. If $\hat A\psi_1=a_1\psi_1$ and $\hat A\psi_2=a_2\psi_2$ with $a_1\ne a_2$, then $a_2\langle\psi_1|\psi_2\rangle=\langle\psi_1|\hat A\psi_2\rangle=\langle\hat A\psi_1|\psi_2\rangle=a_1\langle\psi_1|\psi_2\rangle$ (using that $a_1$ is real), forcing the inner product to vanish. Part (c) is the spectral theorem (fa-12.23, ladr-7.12).`,
      caption: String.raw`A $3\times3$ matrix with real diagonal and couplings $t$, and a complex phase $\varphi$ on the $1$–$3$ element. At $\varepsilon=0$ it is Hermitian: the three eigenvalues sit **on the real axis** and the overlap table $|\langle v_i|v_j\rangle|$ is the identity. **Drag $\varepsilon$**: the lower triangle of the matrix is replaced by $\cos(\pi\varepsilon)$ times the conjugate of the upper one (orange cells mark the mismatch). At $\varepsilon=\tfrac12$ the matrix is triangular and the eigenvalues are real again — but the eigenvectors are no longer orthogonal; near $\varepsilon=1$ the eigenvalues leave the real axis.`,
      deps: ['qchem-1.1', 'fa-12.23', 'ladr-7.12', 'qm-5.4'],
      refs: ['McQuarrie ch. 4'],
      tags: ['Hermitian operators', 'eigenvalues', 'orthogonality'],
      viz(v) {
        const M = v.M;
        const tS = v.slider('coupling $t$', 0, 1.6, 0.8, { step: 0.01 });
        const phS = v.slider('phase $\\varphi$ of $A_{13}$', 0, TAU, 0.9, { step: 0.01 });
        const eS = v.slider('break Hermiticity $\\varepsilon$', 0, 1, 0, { step: 0.005 });
        v.button('Hermitian ($\\varepsilon=0$)', () => eS.set(0));
        v.button('Triangular ($\\varepsilon=\\frac12$)', () => eS.set(0.5));
        const sM = v.stage({ x: [0, 3], y: [0, 3], height: 230, axes: false, weight: 1, title: 'the matrix $A$' });
        const sE = v.stage({ x: [-1.3, 3.7], y: [-2, 2], height: 230, axes: 'box', gutter: true, weight: 1, xlabel: 'Re λ', ylabel: 'Im λ', title: 'eigenvalues in the complex plane' });
        const sG = v.stage({ x: [0, 3], y: [0, 3], height: 230, axes: false, weight: 0.8, title: 'overlaps $|\\langle v_i|v_j\\rangle|$' });
        const fc = (re, im) => (Math.abs(im) < 5e-4 ? v.fix(re, 2) : `${v.fix(re, 2)}${im < 0 ? '−' : '+'}${v.fix(Math.abs(im), 2)}i`);
        let st = null;
        v.render(() => {
          const t = tS.value, ph = phS.value, e = eS.value, cc = Math.cos(Math.PI * e);
          const up = { 12: [t, 0], 13: [0.6 * t * Math.cos(ph), 0.6 * t * Math.sin(ph)], 23: [0.8 * t, 0] };
          const cj = (z) => [z[0], -z[1]];
          const A = [
            [[0, 0], up[12], up[13]],
            [[cc * up[12][0], 0], [1, 0], up[23]],
            [[cc * up[13][0], -cc * up[13][1]], [cc * up[23][0], 0], [2.2, 0]],
          ];
          let defect = 0;
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const d = [A[i][j][0] - A[j][i][0], A[i][j][1] + A[j][i][1]]; defect += d[0] * d[0] + d[1] * d[1]; }
          defect = Math.sqrt(defect);
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const mis = i !== j && Math.hypot(A[i][j][0] - A[j][i][0], A[i][j][1] + A[j][i][1]) > 1e-9;
            sM.rect(j + 0.04, 2 - i + 0.04, j + 0.96, 3 - i - 0.04, { fill: mis ? 'orange' : 'accent', fillAlpha: mis ? 0.22 : 0.1, color: mis ? 'orange' : 'muted', width: 1, radius: 4 });
            sM.text(fc(A[i][j][0], A[i][j][1]), j + 0.5, 2.5 - i, { size: 11.5, color: 'ink', align: 'center', baseline: 'middle' });
          }
          const R = M.eigC(A), idx = R.values.map((_, k) => k).sort((p, q) => R.values[p].re - R.values[q].re || R.values[p].im - R.values[q].im);
          const lam = idx.map((k) => R.values[k]), vec = idx.map((k) => R.vectors[k]);
          let maxIm = 0, maxOv = 0;
          const G = [];
          for (let i = 0; i < 3; i++) {
            maxIm = Math.max(maxIm, Math.abs(lam[i].im)); G.push([]);
            for (let j = 0; j < 3; j++) {
              let pr = 0, pi = 0, ni = 0, nj = 0;
              for (let k = 0; k < 3; k++) { pr += vec[i].re[k] * vec[j].re[k] + vec[i].im[k] * vec[j].im[k]; pi += vec[i].re[k] * vec[j].im[k] - vec[i].im[k] * vec[j].re[k]; ni += vec[i].re[k] ** 2 + vec[i].im[k] ** 2; nj += vec[j].re[k] ** 2 + vec[j].im[k] ** 2; }
              const g = Math.hypot(pr, pi) / Math.sqrt(ni * nj); G[i].push(g); if (i !== j) maxOv = Math.max(maxOv, g);
            }
          }
          sE.hline(0, { color: 'green', width: 2.5, alpha: 0.5 });
          lam.forEach((z, i) => sE.dot(z.re, z.im, { r: 7, color: FAMILY[i], label: `λ${sub(i + 1)}`, labelPos: i % 2 ? 'n' : 's' }));
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const g = G[i][j];
            sG.rect(j + 0.04, 2 - i + 0.04, j + 0.96, 3 - i - 0.04, { fill: i === j ? 'green' : 'orange', fillAlpha: i === j ? 0.2 : 0.06 + 0.7 * g, color: 'muted', width: 1, radius: 4 });
            sG.text(g < 5e-4 ? '0' : v.fix(g, 3), j + 0.5, 2.5 - i, { size: 13, color: 'ink', align: 'center', baseline: 'middle' });
          }
          st = { defect, maxIm, maxOv };
        });
        v.readout(() => st && `$\\|A-A^\\dagger\\|=${v.fix(st.defect, 3)}$ · largest $|{\\rm Im}\\,\\lambda|=${v.fix(st.maxIm, 4)}$ · largest off-diagonal overlap $=${v.fix(st.maxOv, 4)}$` + (st.defect < 1e-9 ? ' — Hermitian: real eigenvalues, orthogonal eigenvectors.' : st.maxIm < 1e-6 ? ' — not Hermitian: eigenvalues still real, but the eigenvectors are not orthogonal.' : ' — not Hermitian: complex eigenvalues.'));
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Model',
      name: 'Particle in a one-dimensional box',
      statement: String.raw`A particle of mass $m$ confined to $0\le x\le L$ (infinite walls) has stationary states and energies
$$\psi_n(x)=\sqrt{\tfrac{2}{L}}\sin\frac{n\pi x}{L},\qquad E_n=\frac{n^2h^2}{8mL^2},\qquad n=1,2,3,\dots$$
$\psi_n$ has $n-1$ nodes; the lowest energy $E_1>0$ is the zero-point energy of confinement. Levels scale as $1/L^2$ and as $1/m$: confining an electron to nanometre lengths makes level gaps of electron-volts, while for a molecule in a laboratory vessel the gaps are so tiny compared with $k_BT$ that the spectrum looks continuous (classical translational motion).`,
      scope: String.raw`Idealization of deep confinement: electrons delocalized along a conjugated chain (1.5), quantum wells and dots, translation of gas molecules in a vessel. A finite wall depth lowers the levels.`,
      idea: String.raw`Inside the box the time-independent equation (1.1) is $\psi''=-k^2\psi$ with $E=\hbar^2k^2/2m$; the walls require $\psi(0)=\psi(L)=0$, so only whole numbers of half-wavelengths fit, $kL=n\pi$. Substituting gives $E_n\propto n^2/(mL^2)$. The same formula governs the ratio of level spacing to thermal energy: $E_2-E_1=3E_1\propto 1/(mL^2)$ becomes negligible against $k_BT$ when $mL^2$ is macroscopic, which is why quantization is invisible for gas molecules in a flask.`,
      caption: String.raw`**Slide the box width $L$** (an electron; energies in eV) and watch the ladder $E_n\propto n^2/L^2$ squeeze together or spread apart, each rung carrying one more node; pin a **reference width** to see the old rungs as ghosts. The right panel plots the spacing $E_2-E_1$ on log–log axes for an electron and for an N$_2$ molecule, against the thermal energy $k_BT$ at 300 K: for the electron the spacing exceeds $k_BT$ only below a few nanometres, for N$_2$ in a 1 cm box it is $10^{-17}$ of $k_BT$.`,
      deps: ['qchem-1.1', 'qm-3.3'],
      refs: ['McQuarrie ch. 3'],
      tags: ['particle in a box', 'quantization', 'zero-point energy'],
      viz(v) {
        const M = v.M, U = units(M), C = M.CONST, E1nm = U.boxE1, kT = U.kT300;
        const mN2 = 28.0134 * C.u / C.me;                 // N₂ mass in electron masses
        const Ls = v.slider('box width $L$ (nm)', 0.25, 1.5, 0.8, { step: 0.01 });
        const nS = v.slider('highlighted level $n$', 1, 6, 3, { int: true });
        let Lref = null;
        v.button('Halve $L$', () => Ls.set(Math.max(0.25, Ls.value / 2)));
        v.button('Double $L$', () => Ls.set(Math.min(1.5, Ls.value * 2)));
        v.button('Pin this width as reference', () => { Lref = Ls.value; });
        v.button('Clear reference', () => { Lref = null; });
        const YT = 44;
        const sL = v.stage({ x: [-0.15, 1.75], y: [0, YT], height: 380, axes: 'box', gutter: true, weight: 1.25, xlabel: 'x (nm)', ylabel: 'E (eV)', title: 'an electron in a box of width $L$' });
        const sR = v.stage({ x: [0.1, 1e8], y: [1e-24, 1e4], xlog: true, ylog: true, height: 380, axes: 'box', gutter: true, weight: 1, xlabel: 'L (nm)', ylabel: 'E₂ − E₁ (eV)', title: 'level spacing against thermal energy' });
        let st = null;
        v.render(() => {
          const L = Ls.value, col = phaseLUT(v), n0 = nS.value, E = (n, l = L) => (n * n * E1nm) / (l * l);
          sL.rect(-0.15, 0, 0, YT, { fill: 'muted', fillAlpha: 0.12, hatch: 'muted', hatchAlpha: 0.35, stroke: false });
          sL.rect(L, 0, 1.75, YT, { fill: 'muted', fillAlpha: 0.12, hatch: 'muted', hatchAlpha: 0.35, stroke: false });
          sL.line(0, 0, 0, YT, { color: 'muted', width: 2 }); sL.line(L, 0, L, YT, { color: 'muted', width: 2 });
          if (Lref != null) for (let n = 1; E(n, Lref) < YT; n++) sL.line(0, E(n, Lref), Lref, E(n, Lref), { color: 'muted', width: 1, dash: [2, 3], alpha: 0.7 });
          const { x } = grid(0, L, 240); let lastY = 1e9;
          for (let n = 1; E(n) < YT && n <= 16; n++) {
            const hi = n === n0, e = E(n);
            sL.line(0, e, L, e, { color: hi ? 'ink' : 'muted', width: hi ? 1.6 : 1, alpha: hi ? 0.9 : 0.6, dash: hi ? false : [4, 3] });
            if (n <= 6) {
              const amp = 0.42 * (E(n + 1) - e) * (n === 6 ? 0.5 : 1), y = Float64Array.from(x, (X) => boxPsi(n, L, X) / Math.sqrt(2 / L));
              drawReal(sL, x, y, { col, base: e, scale: amp, alpha: hi ? 0.6 : 0.2, outline: hi ? 'ink' : 'muted', width: hi ? 1.6 : 1, outlineAlpha: hi ? 1 : 0.55 });
            }
            if (hi || sL.Y(e) < lastY - 13) { sL.text(`n = ${n}`, L + 0.04, e, { size: 11, color: hi ? 'ink' : 'muted', align: 'left', baseline: 'middle' }); lastY = sL.Y(e); }
          }
          for (let k = 1; k < n0; k++) sL.dot((k * L) / n0, E(n0), { r: 3.6, color: 'red' });
          sL.text(`E₁ = ${v.fix(E(1), E(1) < 1 ? 3 : 2)} eV`, 1.74, YT * 0.94, { size: 12, color: 'ink', align: 'right' });
          // spacing vs thermal energy
          sR.hline(kT, { color: 'red', width: 1.8, dash: [6, 4] });
          sR.text('k_BT at 300 K', 3e7, kT * 3, { size: 11.5, color: 'red', align: 'right' });
          const dE = (m) => (l) => (3 * E1nm) / (m * l * l);
          sR.fn(dE(1), { color: 'accent', width: 2.4 });
          sR.fn(dE(mN2), { color: 'orange', width: 2.4 });
          sR.dot(L, dE(1)(L), { r: 6, color: 'gold' });
          sR.dot(L, dE(mN2)(L), { r: 5, color: 'gold', hollow: true });
          sR.dot(1e7, dE(mN2)(1e7), { r: 5, color: 'orange', label: 'N₂ in 1 cm', labelPos: 'n' });
          const Lcl = Math.sqrt((3 * E1nm) / kT);
          sR.vline(Lcl, { color: 'green', width: 1.2, dash: [3, 3] });
          sR.text('ΔE = k_BT', Lcl * 1.15, 1e-17, { size: 11, color: 'green', align: 'left' });
          st = { L, e1: E(1), d12: 3 * E(1) / 3, lam: U.nm_eV / (E(2) - E(1)), ratio: dE(1)(L) / kT, ratioN2: dE(mN2)(L) / kT, Lcl, n0, flask: dE(mN2)(1e7) / kT };
        });
        v.legend([['accent', 'electron'], ['orange', 'N₂ molecule'], ['red', 'thermal energy', { dash: true }]]);
        v.readout(() => st && `$L=${v.fix(st.L, 2)}$ nm: $E_1=${v.fix(st.e1, 3)}$ eV, $E_2-E_1=${v.fix(3 * st.e1, 3)}$ eV (a photon of ${v.fix(U.nm_eV / (3 * st.e1), 0)} nm) · level $n=${st.n0}$ has ${st.n0 - 1} node${st.n0 === 2 ? '' : 's'} · $(E_2-E_1)/k_BT$: electron **${v.fix(st.ratio, 1)}**, N$_2$ at this $L$ $${v.sci(st.ratioN2, 2)}$ · electron spacing equals $k_BT$ at $L=${v.fix(st.Lcl, 1)}$ nm; N$_2$ in a 1 cm box has $(E_2-E_1)/k_BT=${v.sci(st.flask, 1)}$.`);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Free-electron model of conjugated dyes',
      credit: 'Kuhn, 1948–49 (building on Pauling, 1936)',
      statement: String.raw`In the free-electron (Kuhn) model the $N$ $\pi$ electrons of a conjugated chain are treated as non-interacting particles in a one-dimensional box of length $L$ equal to the chain length plus one bond length at each end. They fill the levels $E_n=n^2h^2/8m_eL^2$ two per level, so the HOMO is $n=N/2$ and the LUMO $n=N/2+1$, and the longest-wavelength absorption is the HOMO$\to$LUMO jump
$$\Delta E=\frac{(N+1)\,h^2}{8m_eL^2},\qquad \lambda_{\max}=\frac{hc}{\Delta E}=\frac{8m_ec\,L^2}{h\,(N+1)}.$$
With $L=(N_{\rm bonds}+2)\,\ell$ and $\ell\approx1.39$ Å, lengthening a **cyanine** chain by one vinylene group ($N\to N+2$) shifts the band by roughly 100 nm toward the red, from the ultraviolet through the visible to the near infrared, in fair agreement with measurement.`,
      scope: String.raw`Good for symmetric polymethine (cyanine) dyes, whose bonds are nearly equal. It fails for neutral polyenes: it predicts $\lambda\propto N+1$, growing without limit, whereas real polyenes saturate because bond-length alternation opens a gap (see 6.15).`,
      idea: String.raw`The box levels $\propto n^2/L^2$ (1.4) are filled by the Pauli principle. Because $L$ grows linearly with $N$, the gap $\Delta E\propto (N+1)/L^2\propto 1/N$ falls, so $\lambda\propto L^2/(N+1)\propto N$. The model replaces the whole $\sigma$ frame and electron repulsion by a constant potential: it throws away nearly everything, and still captures the main trend because the chain length is what sets the kinetic-energy scale of the $\pi$ electrons.`,
      caption: String.raw`**Lengthen the chain** with the slider: the box grows, the $\pi$ electrons (arrows) fill the levels two by two and the gap shrinks; the photon's colour is the predicted absorption. Right: predicted $\lambda_{\max}$ against measured values (filled dots, with their sources in the readout). Switch to **neutral polyenes** and the model keeps rising while the real values flatten. Tune the **bond length $\ell$**, toggle the end correction or press **fit** to see how far a single parameter can go.`,
      deps: ['qchem-1.4'],
      refs: ['McQuarrie ch. 3', 'Kuhn, J. Chem. Phys. 17, 1198 (1949)'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cyanine' },
      tags: ['conjugated dyes', 'free-electron model', 'absorption'],
      viz(v) {
        const M = v.M, U = units(M), E1nm = U.boxE1;
        const fam = v.select('family', [{ value: 'cy', label: 'cyanine dyes (equal bonds)' }, { value: 'poly', label: 'neutral polyenes (alternating)' }], 'cy', { onChange: () => { nS.el.hidden = fam.value !== 'cy'; kS.el.hidden = fam.value !== 'poly'; } });
        const nS = v.slider('vinylene groups added $n$', 0, 6, 1, { int: true });
        const kS = v.slider('C=C double bonds $k$', 1, 12, 3, { int: true }); kS.el.hidden = true;
        const lS = v.slider('bond length $\\ell$ (Å)', 1.1, 1.7, 1.39, { step: 0.005 });
        const endT = v.toggle('end correction (+1 bond each end)', true);
        // chain geometry: N π electrons, bonds in the path
        const geo = { cy: (N) => ({ N, bonds: N - 2 }), poly: (N) => ({ N, bonds: N - 1 }) };
        const lam = (f, N, l = lS.value) => { const g = geo[f](N), L = (g.bonds + (endT.value ? 2 : 0)) * l * 0.1; return (U.nm_eV * L * L) / ((N + 1) * E1nm); };
        const DATA = { cy: CYANINE.map(([n, w], i) => [6 + 2 * n, w, ['DTC', 'DTCC', 'DTDC', 'DTTC'][i]]), poly: POLYENE.map(([k, w]) => [2 * k, w, { 2: 'butadiene', 3: 'hexatriene', 4: 'octatetraene', 11: 'β-carotene' }[k]]) };
        v.button('Fit $\\ell$ to this family\'s data', () => {
          const f = fam.value; let num = 0, den = 0;
          for (const [N, w] of DATA[f]) { const a = lam(f, N, 1); num += a * w; den += a * a; }
          lS.set(M.clamp(Math.sqrt(num / den), 1.1, 1.7));
        });
        const sL = v.stage({ x: [0, 1], y: [0, 3], height: 380, axes: 'box', gutter: true, weight: 1, xticks: [], ylabel: 'E (eV)', title: 'π levels of the chain (box of length $L$)' });
        const sR = v.stage({ x: [2, 24], y: [100, 1500], height: 380, axes: 'box', gutter: true, weight: 1.15, xlabel: 'number of π electrons N', ylabel: 'λ_max (nm)', title: 'predicted and measured absorption maximum' });
        let st = null;
        v.render(() => {
          const f = fam.value, l = lS.value;
          const N = f === 'cy' ? 6 + 2 * nS.value : 2 * kS.value, g = geo[f](N), L = (g.bonds + (endT.value ? 2 : 0)) * l * 0.1;  // nm
          const E = (j) => (j * j * E1nm) / (L * L), nH = N / 2, nTop = nH + 3, wl = lam(f, N);
          // levels
          const Ytop = E(nTop) * 1.08; sL.setView([0, 1], [0, Ytop]);
          for (let j = 1; j <= nTop; j++) {
            const e = E(j), hom = j === nH, lum = j === nH + 1;
            sL.line(0.12, e, 0.68, e, { color: hom || lum ? 'ink' : 'muted', width: hom || lum ? 2.4 : 1.4 });
            if (j <= nH) sL.text('↑↓', 0.4, e, { size: 13, color: 'accent', align: 'center', baseline: 'bottom', dy: -1 });
            sL.text(hom ? 'HOMO' : lum ? 'LUMO' : `n=${j}`, 0.7, e, { size: 11, color: hom || lum ? 'ink' : 'muted', align: 'left', baseline: 'middle' });
          }
          const rgb = wl >= 380 && wl <= 780 ? M.wavelengthRGB(wl) : null;
          sL.arrow(0.82, E(nH), 0.82, E(nH + 1), { color: rgb ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : 'ink', width: 3, head: 9 });
          sL.text(`${v.fix(wl, 0)} nm`, 0.95, (E(nH) + E(nH + 1)) / 2, { size: 12, color: 'ink', align: 'right', baseline: 'middle', dy: -14 });
          sL.corner(`L = ${v.fix(L * 10, 1)} Å`, 'tl', { color: 'muted' });
          // right: λ against N
          sR.raster((x, y) => (y >= 380 && y <= 750 ? [...M.wavelengthRGB(y), 0.32] : null), { res: 3, key: 'vis', rect: [2, 380, 24, 750] });
          sR.text('visible', 2.5, 750 - 20, { size: 11, color: 'muted', align: 'left' });
          for (const [ff, color] of [['cy', 'accent'], ['poly', 'orange']]) {
            const on = ff === f;
            sR.fn((x) => lam(ff, x), { domain: [ff === 'cy' ? 6 : 2, 24], color, width: on ? 2.6 : 1.3, alpha: on ? 1 : 0.4, dash: on ? false : [5, 4] });
            for (const [n, w, name] of DATA[ff]) sR.dot(n, w, { r: on ? 6 : 4, color, alpha: on ? 1 : 0.5, label: on ? name : undefined, labelPos: 'se' });
          }
          sR.dot(N, wl, { r: 7, color: 'gold', hollow: true });
          sR.vline(N, { color: 'gold', width: 1, dash: [3, 3], alpha: 0.7 });
          let rms = 0; for (const [n, w] of DATA[f]) rms += (lam(f, n) - w) ** 2; rms = Math.sqrt(rms / DATA[f].length);
          const hit = DATA[f].find((d) => d[0] === N);
          st = { f, N, L, wl, rms, hit, l };
        });
        v.legend([['accent', 'model: cyanines'], ['orange', 'model: polyenes'], ['gold', 'chain shown', { dot: true }]]);
        v.readout(() => st && `$N=${st.N}$ π electrons, $L=${v.fix(st.L * 10, 1)}$ Å: $\\Delta E=${v.fix((((st.N + 1) * U.boxE1) / (st.L * st.L)), 3)}$ eV, predicted $\\lambda_{\\max}=${v.fix(st.wl, 0)}$ nm` + (st.hit ? `, measured **${st.hit[1]} nm** (${st.hit[2]}): error ${v.fix(((st.wl - st.hit[1]) / st.hit[1]) * 100, 0)} %` : ' (no measurement at this length)') + ` · rms error over this family's data: ${v.fix(st.rms, 0)} nm.\n` + (st.f === 'cy' ? 'Data: 3,3\'-diethylthia-, carbo-, dicarbo-, tricarbocyanine iodides (Sturmer, as tabulated in a lab manual; carbocyanine 557 nm and tricarbocyanine 762 nm confirmed on supplier sheets). The π-electron count $N=6+2n$ is the usual textbook counting.' : 'Data: butadiene 217, hexatriene 258, octatetraene 290 nm (OpenStax Organic Chemistry); β-carotene about 451–455 nm in hexane (PhotochemCAD; supplier sheet). The model has no way to saturate.'));
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Phenomenon',
      name: 'Degeneracy in two- and three-dimensional boxes',
      statement: String.raw`For a particle in a rectangular box with sides $L_x,L_y$ (and $L_z$) the Schrödinger equation separates and
$$E_{n_xn_y}=\frac{h^2}{8m}\Big(\frac{n_x^2}{L_x^2}+\frac{n_y^2}{L_y^2}\Big),\qquad \psi=\psi_{n_x}(x)\,\psi_{n_y}(y),\quad n_x,n_y\ge1,$$
(with a third term $n_z^2/L_z^2$ in three dimensions). Different quantum numbers can give the same energy: a **degenerate** level has several independent eigenfunctions. In a square the swap $(n_x,n_y)\leftrightarrow(n_y,n_x)$ always does so; in a cube all permutations of $(n_x,n_y,n_z)$ do. Stretching the box breaks this symmetry-related degeneracy, but further coincidences, such as $(n_x,n_y)=(1,2)$ against $(2,1)$ at a rational ratio of $L_y^2/L_x^2$, can reappear at special aspect ratios.`,
      idea: String.raw`Separation of variables turns the energy into a sum of one-dimensional box energies (1.4). Degeneracy of a symmetric box is forced by symmetry: the operation exchanging $x$ and $y$ commutes with $\hat H$ and maps $\psi_{n_xn_y}$ into $\psi_{n_yn_x}$ with the same energy. Stretching removes the symmetry and lifts the degeneracy. A coincidence $n_x^2+n_y^2/a^2=m_x^2+m_y^2/a^2$ requires $a^2=(m_y^2-n_y^2)/(n_x^2-m_x^2)$ to be a ratio of integers — an *accidental* degeneracy, with no symmetry behind it.`,
      caption: String.raw`**Drag the aspect ratio $a$** (2D: $L_y=aL_x$; 3D: a square-based box with height $L_z=aL_x$). The correlation diagram shows every level as a line; at $a=1$ the lines in a square or cube pile up pairwise or in triples, and the right-hand ladder reads off the degeneracy of each level. Away from $a=1$ they separate; **snap to $\sqrt2$, $3/2$ or $2$** and look for new crossings, which occur only when $a^2$ is rational. The heat map shows $|\psi|^2$ of the chosen partner of the chosen level.`,
      deps: ['qchem-1.4'],
      refs: ['McQuarrie ch. 3'],
      tags: ['degeneracy', 'separation of variables', 'symmetry'],
      viz(v) {
        const M = v.M, NM = 5, NL = 14;
        const dim = v.select('box', [{ value: '2', label: '2D rectangle' }, { value: '3', label: '3D box with square base' }], '2', { onChange: () => { jS.set(Math.min(jS.value, NL)); } });
        const aS = v.slider('aspect ratio $a$', 0.5, 2.5, 1, { step: 0.005 });
        const jS = v.slider('inspect level #', 1, NL, 4, { int: true });
        const pS = v.slider('partner state', 1, 6, 1, { int: true });
        for (const [lab, val] of [['$a=1$', 1], ['$a=\\sqrt2$', Math.SQRT2], ['$a=\\tfrac32$', 1.5], ['$a=2$', 2]]) v.button(lab, () => aS.set(val));
        const states = () => {
          const a = aS.value, three = dim.value === '3', out = [];
          for (let i = 1; i <= NM; i++) for (let j = 1; j <= NM; j++) {
            if (three) for (let k = 1; k <= NM; k++) out.push({ q: [i, j, k], E: i * i + j * j + (k * k) / (a * a) });
            else out.push({ q: [i, j], E: i * i + (j * j) / (a * a) });
          }
          return out;
        };
        const levelsOf = (S) => {
          const A = S.slice().sort((p, q) => p.E - q.E), L = [];
          for (const s of A) { const last = L[L.length - 1]; if (last && Math.abs(s.E - last.E) < 1e-9 * Math.max(1, s.E)) last.s.push(s); else L.push({ E: s.E, s: [s] }); }
          return L;
        };
        const sC = v.stage({ x: [0.5, 2.5], y: [0, 26], height: 360, axes: 'box', gutter: true, weight: 1.25, xlabel: 'aspect ratio a', ylabel: 'E / E₀', title: 'correlation diagram: every level against $a$' });
        const sD = v.stage({ x: [0, 1], y: [0, 26], height: 360, axes: 'box', gutter: true, weight: 0.8, xticks: [], title: 'levels at this $a$ (× degeneracy)' });
        const sH = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 360, axes: false, weight: 0.9, title: '$|\\psi|^2$ of the chosen state' });
        const ha = sC.handle(1, 0.8, { color: 'gold', r: 8, label: 'a', labelPos: 'n', constrain: (x) => [M.clamp(x, 0.5, 2.5), ha.y] });
        ha.onDrag = () => aS.set(M.clamp(ha.x, 0.5, 2.5));
        let st = null;
        v.render(() => {
          const three = dim.value === '3', a = aS.value, S = states(), L = levelsOf(S);
          const top = three ? 22 : 26; sC.setView([0.5, 2.5], [0, top]); sD.setView([0, 1], [0, top]);
          ha.set(a, 0.04 * top);
          const lev = Math.min(jS.value, L.length) - 1, cur = L[lev], g = cur.s.length, part = Math.min(pS.value, g) - 1;
          pS.el.hidden = g < 2;
          const hiKey = new Set(cur.s.map((s) => s.q.join(',')));
          // lines
          for (const s0 of S) {
            const key = s0.q.join(','), hi = hiKey.has(key), q = s0.q;
            const f = three ? (x) => q[0] * q[0] + q[1] * q[1] + (q[2] * q[2]) / (x * x) : (x) => q[0] * q[0] + (q[1] * q[1]) / (x * x);
            sC.fn(f, { domain: [0.5, 2.5], color: hi ? 'orange' : 'muted', width: hi ? 2.6 : 1, alpha: hi ? 1 : 0.4 });
          }
          sC.vline(a, { color: 'gold', width: 1.4, dash: [4, 3] });
          L.slice(0, NL).forEach((lv) => { if (lv.s.length > 1 && lv.E < top) sC.dot(a, lv.E, { r: 5, hollow: true, color: 'green' }); });
          // ladder
          L.slice(0, NL).forEach((lv, i) => {
            const hi = i === lev, e = lv.E; if (e > top) return;
            sD.line(0.08, e, 0.52, e, { color: hi ? 'orange' : 'muted', width: hi ? 3 : 1.8, alpha: hi ? 1 : 0.7 });
            sD.text(`${lv.s.length > 1 ? '×' + lv.s.length : ''}`, 0.56, e, { size: 12, color: lv.s.length > 1 ? 'green' : 'muted', align: 'left', baseline: 'middle' });
            sD.text(v.fix(e, 2), 0.97, e, { size: 10.5, color: hi ? 'ink' : 'muted', align: 'right', baseline: 'middle', dy: -7 });
          });
          // density of the chosen partner (projected on the xy-plane in 3D)
          const q = cur.s[part].q, wy = three ? 1 : a;
          sH.setView([0, 1], [0, wy]);
          sH.heat((x, y) => (2 * Math.sin(q[0] * Math.PI * x) ** 2) * (2 * Math.sin(q[1] * Math.PI * (y / wy)) ** 2) / wy, { cmap: 'theme', color: 'accent', range: [0, 4.2 / wy], res: 3, key: `${q}|${wy.toFixed(3)}` });
          sH.rect(0, 0, 1, wy, { stroke: true, fill: false, color: 'ink', width: 1.5 });
          sH.corner(`(n = ${q.join(', ')})`, 'tl', { color: 'ink', plate: true });
          // statistics
          const lows = L.slice(0, NL), degPairs = lows.filter((l) => l.s.length > 1).length;
          let ratio = null; if (Math.abs(a - 1) > 1e-6) for (let d = 1; d <= 12 && !ratio; d++) { const p = Math.round(a * a * d); if (p > 0 && Math.abs(a * a - p / d) < 1e-6) ratio = `${p}/${d}`; }
          st = { a, g, E: cur.E, degPairs, ratio, q: cur.s.map((s) => `(${s.q.join(',')})`).join(' '), degs: lows.map((l) => l.s.length).join(', ') };
        });
        v.legend([['muted', 'a level (one line per $(n_x,n_y)$ state)'], ['orange', 'states of the inspected level'], ['green', 'degenerate here', { dot: true }]]);
        v.readout(() => st && `$a=${v.fix(st.a, 3)}$ ($a^2=${v.fix(st.a * st.a, 4)}$${st.ratio ? ' $=' + st.ratio + '$' : ''}) · degeneracies of the lowest ${NL} levels: ${st.degs} · ${st.degPairs} of them degenerate · inspected level: $E=${v.fix(st.E, 3)}\\,E_0$ with states ${st.q}` + (Math.abs(st.a - 1) < 1e-6 ? ' — symmetric box: pairs (or triples) forced by symmetry.' : st.degPairs ? ' — an accidental degeneracy at a rational $a^2$ (no symmetry forces it).' : ' — all levels non-degenerate.'));
      },
    },
  ],
};
