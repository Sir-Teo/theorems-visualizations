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
  ],
};
