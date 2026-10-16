// Quantum Mechanics — Chapter 4: The harmonic oscillator (items 4.1–4.7; 4.8–4.13 in ch04-b.js)
// Units: ħ = m = ω = 1 unless an item says otherwise (x in √(ħ/mω), energies in ħω).
import { TAU, grid, normalize, phaseLUT, drawPsi, drawReal, phaseWheel, levelDiagram, fz, sub, hermiteAt, hermiteFns, hermiteTeX, coherentCoeffs, project, evolve, evolveCoeffs, deriv, ladder, covariance, poisson, toMomentum, moments } from './ch04.shared.js';

const PI14 = Math.PI ** -0.25;

/** Classical action A(E) = ∮p dx = 2∫√(2(E − V)) dx of a well sampled on (x, Vg), by the trapezoid rule. */
function action(x, Vg, E) {
  let s = 0; const n = x.length, h = x[1] - x[0];
  for (let i = 0; i < n; i++) if (Vg[i] < E) s += Math.sqrt(2 * (E - Vg[i]));
  return 2 * s * h;
}
/** Draw a parabola V = x²/2 (shaded below) on a stage between x0 and x1, clipped to the view. */
function parabola(s, x0, x1, o = {}) {
  const pts = []; for (let k = 0; k <= 160; k++) { const X = x0 + ((x1 - x0) * k) / 160; pts.push([X, (o.scale ?? 1) * 0.5 * X * X + (o.base ?? 0)]); }
  s.clip(() => {
    s.poly([[x0, s.yr[0] - 1], ...pts, [x1, s.yr[0] - 1]], { fill: 'muted', fillAlpha: o.alpha ?? 0.12, stroke: false });
    s.path(pts, { color: 'muted', width: 1.8 });
  });
}
/** A small matrix of cells on an axes-free stage: entries (number), colour per entry, text per entry. */
function cells(v, s, A, o = {}) {
  const n = A.length, m = A[0].length, [x0, x1] = s.xr, [y0, y1] = s.yr, cw = (x1 - x0) / m, ch = (y1 - y0) / n;
  const px = Math.min(cw * s.sx, ch * s.sy), size = Math.max(8.5, Math.min(14, px * 0.3));
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    const X0 = x0 + j * cw, Y1 = y1 - i * ch, f = o.fill ? o.fill(A[i][j], i, j) : null;
    s.rect(X0 + 0.04 * cw, Y1 - 0.96 * ch, X0 + 0.96 * cw, Y1 - 0.04 * ch, { fill: f ? f[0] : 'grid', fillAlpha: f ? f[1] : 0.25, color: 'grid', width: 0.8, radius: 3 });
    const t = o.text ? o.text(A[i][j], i, j) : null;
    if (t) s.text(t, X0 + cw / 2, Y1 - ch / 2, { size, align: 'center', baseline: 'middle', color: o.textColor ? o.textColor(A[i][j], i, j) : 'ink' });
  }
}

export default {
  collection: 'qm',
  chapter: 4,
  title: 'The harmonic oscillator',
  summary: String.raw`Near any minimum a potential is a parabola, so the harmonic oscillator is the first system everyone quantizes — and it can be solved by pure algebra. The ladder operators $a_\pm$ step between equally spaced levels $(n+\tfrac12)\hbar\omega$, and the bottom rung leaves a zero-point energy $\tfrac12\hbar\omega$ that the uncertainty principle demands. The eigenfunctions are Hermite functions, which are also the eigenfunctions of the Fourier transform: a quarter period of oscillator motion *is* a Fourier transform. Coherent states ride the classical orbit without spreading, squeezed states trade uncertainty between $x$ and $p$, and highly excited states reproduce the classical probability density. Quantizing every normal mode of a crystal or a cavity turns vibrations into phonons and light into photons, and the zero-point energy of the field modes between two mirrors produces the Casimir force.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Quantum harmonic oscillator',
      statement: String.raw`A particle of mass $m$ in the potential $V(x)=\tfrac12 m\omega^2x^2$ has the Hamiltonian
$$\hat H=\frac{\hat p^2}{2m}+\frac12 m\omega^2\hat x^2 .$$
Its spectrum is purely discrete, non-degenerate and **exactly equally spaced**:
$$E_n=\Big(n+\tfrac12\Big)\hbar\omega,\qquad n=0,1,2,\dots,$$
with eigenfunctions $\psi_n(x)=\big(\tfrac{m\omega}{\pi\hbar}\big)^{1/4}\frac{1}{\sqrt{2^nn!}}H_n(\xi)\,e^{-\xi^2/2}$, $\xi=x\sqrt{m\omega/\hbar}$ ($H_n$ the Hermite polynomials). The natural units are the length $\sqrt{\hbar/m\omega}$ and the energy $\hbar\omega$. Equal spacing is special to the parabola: an anharmonic well (quartic, Morse, …) has level spacings that change with $n$.`,
      scope: String.raw`Exact for an ideal parabolic potential. Real systems — molecular vibrations, atoms in traps, crystal lattices, field modes — are harmonic only near the bottom of their wells; at higher energies the anharmonic terms bend the ladder (molecular levels crowd together toward dissociation).`,
      idea: String.raw`Expanding any smooth potential about a minimum gives $V(x_0)+\tfrac12V''(x_0)(x-x_0)^2+\dots$, so small oscillations are always harmonic (mech-4.2) — which is why this one model describes molecules, phonons and photons. Classically every orbit has the same period $2\pi/\omega$, whatever its amplitude; by the correspondence principle the level spacing near energy $E$ is $\hbar\cdot 2\pi/T_{\rm cl}(E)$, so an amplitude-independent period means an energy-independent spacing. The exact spectrum follows by algebra from the ladder operators (4.2, 4.3) or by solving the eigenvalue equation (3.1) with a power series that must terminate.`,
      caption: String.raw`Left: the levels computed numerically (finite differences) for the well shown, each eigenfunction drawn at its energy; green ticks at the left mark the harmonic ladder $n+\tfrac12$. Right: the spacings $E_{n+1}-E_n$ (dots) plotted at their mean energy, against the classical prediction $2\pi\hbar/T_{\rm cl}(E)$ (curve) computed from the period of a classical orbit. **Drag the morph slider** to bend the parabola into a quartic (stiffer walls: spacings grow) or a Morse well (soft outer wall: spacings shrink toward dissociation). Only the parabola keeps them all equal — and only there is the classical period independent of the energy.`,
      deps: ['qm-3.1', 'mech-4.2'],
      see: ['qm-3.18', 'mech-4.5'],
      refs: ['Griffiths §2.3', 'Hall ch. 11'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_harmonic_oscillator' },
      tags: ['harmonic oscillator', 'energy levels', 'anharmonicity'],
      viz(v) {
        const M = v.M, K = 10, D = 8, AM = 0.25;
        const TG = {
          morse: { V: (x) => D * (1 - Math.exp(-AM * x)) ** 2, dom: [-6, 16], view: [-5, 13] },
          quartic: { V: (x) => x ** 4 / 8, dom: [-7.5, 7.5], view: [-6, 6] },
        };
        const tg = v.select('morph toward', [{ value: 'morse', label: 'Morse well' }, { value: 'quartic', label: 'quartic $x^4/8$' }], 'morse');
        const sm = v.slider('morph $s$ (0 = parabola)', 0, 1, 0, { step: 0.01 });
        const sL = v.stage({ x: [-5, 13], y: [0, 10], height: 360, axes: 'box', gutter: { r: 4 }, weight: 1.45, xlabel: 'x', ylabel: 'E / ħω', title: '$V_s=(1-s)\\tfrac12x^2+s\\,V_{\\rm target}$ and its levels' });
        const sR = v.stage({ x: [0, 10], y: [0, 2], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'E / ħω', ylabel: 'spacing / ħω', title: 'level spacing vs $2\\pi\\hbar/T_{\\rm cl}(E)$' });
        let S = null;
        const solve = () => {
          const key = `${tg.value}|${sm.value}`; if (S && S.key === key) return S;
          const T = TG[tg.value], s = sm.value, Vf = (x) => (1 - s) * 0.5 * x * x + s * T.V(x);
          const R = M.schrodinger1D(Vf, T.dom, { n: 1100, k: K }), x = R.x, Vg = Float64Array.from(x, Vf);
          // classical: A(E) on a fine grid, ω_cl = 2π dE/dA
          const xf = Float64Array.from({ length: 6001 }, (_, i) => T.dom[0] + ((T.dom[1] - T.dom[0]) * i) / 6000), Vff = Float64Array.from(xf, Vf);
          const Etop = R.E[K - 1] + 0.4, cl = [];
          for (let k = 1; k <= 120; k++) { const E = (Etop * k) / 120, h = 0.01, dA = action(xf, Vff, E + h) - action(xf, Vff, E - h); if (dA > 0) cl.push([E, (TAU * 2 * h) / dA]); }
          const sp = []; for (let n = 0; n < K - 1; n++) sp.push([(R.E[n] + R.E[n + 1]) / 2, R.E[n + 1] - R.E[n]]);
          return (S = { key, x, Vg, E: R.E, psi: R.psi, cl, sp, s, tg: tg.value, Etop });
        };
        let st = null;
        v.render(() => {
          const S = solve(), col = phaseLUT(v), T = TG[S.tg];
          sL.setView(T.view, [0, S.Etop + 0.35]);
          let pmax = 0; for (const p of S.psi) for (const y of p) pmax = Math.max(pmax, Math.abs(y));
          levelDiagram(sL, { x: S.x, V: S.Vg, E: S.E, psi: S.psi, col, amp: 0.42 / pmax, label: (i) => `E${sub(i)} = ${v.fix(S.E[i], 3)}` });
          for (let n = 0; n < K + 1; n++) if (n + 0.5 < S.Etop + 0.3) sL.line(T.view[0], n + 0.5, T.view[0] + 0.035 * (T.view[1] - T.view[0]), n + 0.5, { color: 'green', width: 2.2 });
          // spacings
          const ymax = Math.max(1.6, ...S.sp.map((p) => p[1] * 1.15), ...S.cl.map((p) => Math.min(p[1], 3) * 1.08));
          sR.setView([0, S.Etop], [0, Math.min(3.2, ymax)]);
          sR.hline(1, { color: 'green', width: 1.4, dash: [5, 4] });
          sR.text('ħω (parabola)', S.Etop * 0.03, 1, { color: 'green', size: 10.5, dy: -9 });
          sR.path(S.cl, { color: 'orange', width: 2.4 });
          for (const [E, d] of S.sp) sR.line(E, 0, E, d, { color: 'accent', width: 1, alpha: 0.35 });
          sR.dots(S.sp, { r: 4.5, color: 'accent' });
          let dev = 0; for (let n = 0; n < K; n++) dev = Math.max(dev, Math.abs(S.E[n] - (n + 0.5)));
          let mdev = 0; if (S.tg === 'morse' && S.s === 1) for (let n = 0; n < K; n++) mdev = Math.max(mdev, Math.abs(S.E[n] - ((n + 0.5) - (n + 0.5) ** 2 / (4 * D))));
          const dmin = Math.min(...S.sp.map((p) => p[1])), dmax = Math.max(...S.sp.map((p) => p[1]));
          st = { S, dev, mdev, dmin, dmax };
        });
        v.legend([['accent', 'computed spacing $E_{n+1}-E_n$', { dot: true }], ['orange', 'classical $2\\pi\\hbar/T_{\\rm cl}(E)$'], ['green', 'harmonic ladder $n+\\frac12$']]);
        v.readout(() => {
          if (!st) return '';
          const { S } = st;
          const head = `spacings range from **${v.fix(st.dmin, 4)}** to **${v.fix(st.dmax, 4)}** $\\hbar\\omega$`;
          if (S.s === 0) return `Parabola: ${head} — equal to grid accuracy; $\\max_n|E_n-(n+\\tfrac12)\\hbar\\omega| = ${v.sci(st.dev, 1)}$ over the first ${K} levels (finite-difference error $\\propto h^2$).`;
          if (S.tg === 'morse' && S.s === 1) return `Morse well $D(1-e^{-ax})^2$, $D=8$, $a=\\tfrac14$: ${head}, shrinking toward the dissociation energy $D$. Exact Morse levels $(n+\\tfrac12)-(n+\\tfrac12)^2/4D$ agree to $${v.sci(Math.max(st.mdev, 1e-12), 1)}$.`;
          return `$s = ${v.fix(S.s, 2)}$: ${head} — ${S.tg === 'quartic' ? 'stiffer walls, shorter classical period at high energy, wider spacings' : 'softer outer wall, longer period at high energy, narrower spacings'}; the dots track $2\\pi\\hbar/T_{\\rm cl}$, the correspondence principle at work.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Ladder operators',
      statement: String.raw`For the oscillator define the **raising** and **lowering operators**
$$a_\pm=\frac{1}{\sqrt{2\hbar m\omega}}\big(\mp i\hat p+m\omega\hat x\big),\qquad\text{in units }\hbar=m=\omega=1:\quad a_\pm=\frac{1}{\sqrt2}\Big(x\mp\frac{d}{dx}\Big),$$
also written $a^\dagger=a_+$, $a=a_-$ (they are each other's adjoints). They satisfy $[a_-,a_+]=1$, and
$$\hat H=\hbar\omega\Big(a_+a_-+\tfrac12\Big),\qquad [\hat H,a_\pm]=\pm\hbar\omega\,a_\pm .$$
On the normalized eigenstates they act as $a_+\psi_n=\sqrt{n+1}\,\psi_{n+1}$ and $a_-\psi_n=\sqrt n\,\psi_{n-1}$; in particular $a_-\psi_0=0$. The **number operator** $\hat N=a_+a_-$ has $\hat N\psi_n=n\psi_n$.`,
      idea: String.raw`Factor the Hamiltonian like $u^2+v^2=(u-iv)(u+iv)$: because $\hat x$ and $\hat p$ do not commute, the product $a_+a_-$ misses $\hat H/\hbar\omega$ by exactly $\tfrac12$, which is the commutator $[\hat x,\hat p]=i\hbar$ (qm-2.11) at work. From $[\hat H,a_+]=\hbar\omega a_+$, if $\hat H\psi=E\psi$ then $\hat H(a_+\psi)=(E+\hbar\omega)(a_+\psi)$: $a_+$ climbs one rung, $a_-$ descends one. The factors follow from norms: $\norm{a_+\psi_n}^2=\langle\psi_n|a_-a_+\psi_n\rangle=\langle\psi_n|(\hat N+1)\psi_n\rangle=n+1$.`,
      caption: String.raw`The panel shows the current state, a real function (blue where positive, orange where negative). Press **apply $a_+$** or **apply $a_-$**: the operator $\tfrac{1}{\sqrt2}(x\mp d/dx)$ is applied *numerically* to the function on screen — the thin orange and purple curves are its two terms $x\psi/\sqrt2$ and $\mp\psi'/\sqrt2$ computed from the previous state (dashed grey), and their sum is the new state. The gold dashes show the prediction $\sqrt{n+1}\,\psi_{n+1}$ or $\sqrt n\,\psi_{n-1}$; they coincide. Lower all the way to $\psi_0$ and apply $a_-$ once more: the two terms cancel exactly and the result is the zero function. The ladder at the right records the path.`,
      deps: ['qm-4.1', 'qm-2.11'],
      see: ['qm-2.12'],
      refs: ['Griffiths §2.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Creation_and_annihilation_operators' },
      tags: ['ladder operators', 'creation and annihilation', 'number operator'],
      viz(v) {
        const G = grid(-9, 9, 1401), x = G.x, NMAX = 12, phi = hermiteFns(x, NMAX + 2);
        let cur, prev, n, c, hist, last;
        const reset = () => { n = n0.value; c = 1; cur = Float64Array.from(phi[n]); prev = null; hist = [n]; last = null; };
        const n0 = v.slider('start in $\\psi_n$, $n=$', 0, 8, 2, { int: true, onChange: () => reset() });
        const apply = (raise) => {
          if (raise && n >= NMAX) return;
          const from = c === 0 ? -1 : n;
          prev = cur; cur = ladder(x, cur, raise);
          let f = 0;
          if (c !== 0) { if (raise) { f = Math.sqrt(n + 1); c *= f; n++; } else if (n === 0) { c = 0; } else { f = Math.sqrt(n); c *= f; n--; } }
          last = { raise, from, to: c === 0 ? -1 : n, f };
          hist.push(c === 0 ? -1 : n); if (hist.length > 12) hist.shift();
        };
        v.button('apply $a_+$', () => apply(true));
        v.button('apply $a_-$', () => apply(false));
        v.button('reset', () => reset());
        const terms = v.toggle('show the two terms', true);
        reset();
        const sA = v.stage({ x: [-6.5, 6.5], y: [-1, 1], height: 330, axes: 'box', gutter: true, weight: 1.65, xlabel: 'x', title: 'the state on screen and what the operator makes of it' });
        const sB = v.stage({ x: [-4.6, 4.6], y: [-1.1, NMAX + 1], height: 330, axes: false, weight: 0.6, title: 'the ladder $E_n=n+\\frac12$' });
        let st = null;
        v.render(() => {
          const col = phaseLUT(v);
          let mx = 0; for (let i = 0; i < x.length; i++) mx = Math.max(mx, Math.abs(cur[i]), prev ? Math.abs(prev[i]) : 0);
          if (c === 0) { mx = 0; for (let i = 0; i < x.length; i++) mx = Math.max(mx, Math.abs(prev[i])); }
          mx = Math.max(mx, 0.3) * 1.15; sA.setView([-6.5, 6.5], [-mx, mx]);
          sA.hline(0, { color: 'grid', width: 1 });
          if (prev) sA.path(Array.from(x, (X, i) => [X, prev[i]]), { color: 'muted', width: 1.4, dash: [4, 3] });
          if (prev && terms.value) {
            const d = deriv(prev, G.dx), s = last.raise ? -1 : 1;
            sA.path(Array.from(x, (X, i) => [X, (X * prev[i]) / Math.SQRT2]), { color: 'orange', width: 1.3 });
            sA.path(Array.from(x, (X, i) => [X, (s * d[i]) / Math.SQRT2]), { color: 'purple', width: 1.3 });
          }
          drawReal(sA, x, cur, { col, alpha: 0.45, width: 2 });
          if (c !== 0) sA.path(Array.from(x, (X, i) => [X, c * phi[n][i]]), { color: 'gold', width: 2, dash: [7, 5] });
          // the ladder
          sB.clip(() => { const pts = []; for (let k = 0; k <= 100; k++) { const X = -4.6 + 9.2 * k / 100; pts.push([X, 0.5 * X * X]); } sB.path(pts, { color: 'muted', width: 1.5 }); });
          for (let k = 0; k <= NMAX; k++) { const w = Math.sqrt(2 * k + 1); sB.line(-w, k + 0.5, w, k + 0.5, { color: c !== 0 && k === n ? 'gold' : 'muted', width: c !== 0 && k === n ? 3.5 : 1, alpha: c !== 0 && k === n ? 1 : 0.6 }); }
          sB.text('0', 0, -0.6, { size: 14, color: c === 0 ? 'red' : 'faint', align: 'center', weight: 700 });
          const yOf = (k) => (k < 0 ? -0.6 : k + 0.5), m = hist.length;
          for (let j = 1; j < m; j++) {
            const X = -2.6 + (5.2 * j) / Math.max(m, 2), a = yOf(hist[j - 1]), b = yOf(hist[j]);
            if (hist[j - 1] < 0 && hist[j] < 0) continue;
            sB.arrow(X, a, X, b, { color: b > a ? 'green' : b < 0 ? 'red' : 'accent', width: j === m - 1 ? 2.4 : 1.3, alpha: j === m - 1 ? 1 : 0.55, head: 7 });
          }
          if (last && last.from >= 0) sB.text(last.to < 0 ? '×0' : `×√${last.raise ? last.from + 1 : last.from}`, 2.9, (yOf(last.from) + yOf(last.to)) / 2, { size: 12, color: 'ink', weight: 600, plate: true });
          if (c === 0) sA.corner('a₋ψ₀ = 0: the two terms cancel', 'tl', { color: 'red', weight: 600 });
          let err = 0, ref = 0, nrm = 0; for (let i = 0; i < x.length; i++) { const p = c * phi[n][i]; err = Math.max(err, Math.abs(cur[i] - p)); ref = Math.max(ref, Math.abs(p)); nrm += cur[i] * cur[i]; }
          st = { err, ref, nrm: nrm * G.dx };
        });
        v.legend([['accent', 'new state (signed fill)', { area: true }], ['muted', 'previous state', { dash: true }], ['orange', '$x\\psi/\\sqrt2$'], ['purple', '$\\mp\\psi\'/\\sqrt2$'], ['gold', 'prediction', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (c === 0) return `$a_-\\psi_0 = \\tfrac{1}{\\sqrt2}(x\\psi_0+\\psi_0') = 0$: the Gaussian is the only state the lowering operator kills — numerically $\\max|a_-\\psi_0| = ${v.sci(Math.max(st.err, 1e-16), 1)}$ (finite differences). The ladder has a bottom rung. Further operators keep giving 0.`;
          const hd = last ? `$a_${last.raise ? '+' : '-'}\\psi_{${last.from}} = \\sqrt{${last.raise ? last.from + 1 : last.from}}\\,\\psi_{${last.to}}$ · ` : '';
          return hd + `state on screen $= ${v.fix(c, 4)}\\,\\psi_{${n}}$, $\\int|\\cdot|^2dx = ${v.fix(st.nrm, 4)}$ (predicted ${v.fix(c * c, 4)}) · largest deviation from the prediction: $${v.sci(Math.max(st.err, 1e-16), 1)}$ (relative ${v.sci(Math.max(st.err / st.ref, 1e-16), 1)}, the error of the numerical derivative).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Spectrum from the ladder algebra',
      statement: String.raw`Let $a$ be an operator on a Hilbert space with $[a,a^\dagger]=1$, and $\hat H=\hbar\omega(a^\dagger a+\tfrac12)$. Suppose $\hat H$ has an eigenvector. Then:
(a) the spectrum of $\hat H$ contains the ladder $E_n=(n+\tfrac12)\hbar\omega$, $n=0,1,2,\dots$, and every eigenvalue is of this form;
(b) there is a ground state $|0\rangle$ with $a|0\rangle=0$, and $|n\rangle=(a^\dagger)^n|0\rangle/\sqrt{n!}$ are orthonormal eigenvectors;
(c) the relation $[a,a^\dagger]=1$ has **no** solution by finite matrices: $\operatorname{tr}[A,B]=0$ for all $N\times N$ matrices, while $\operatorname{tr}\mathbf 1=N$. Any $N\times N$ truncation of $a$ satisfies the relation on the first $N-1$ basis vectors and fails on the last.
For the oscillator $a$ is the lowering operator 4.2, and (a) is its whole spectrum.`,
      idea: String.raw`$\langle\psi|a^\dagger a\psi\rangle=\norm{a\psi}^2\ge0$, so energies are bounded below by $\tfrac12\hbar\omega$. If $\hat H\psi=E\psi$, then $a\psi$ has energy $E-\hbar\omega$ (from $[\hat H,a]=-\hbar\omega a$) unless it is zero. Lowering repeatedly would eventually go below the bound, so the chain must stop at a vector with $a|0\rangle=0$, whose energy is exactly $\tfrac12\hbar\omega$; raising from there with $a^\dagger$ never stops, since $\norm{a^\dagger|n\rangle}^2=n+1>0$. Nothing else is used: the same algebra quantizes every oscillator, from phonons (4.11) to photons (4.12). Swapping the commutator for an anticommutator $\{b,b^\dagger\}=1$ gives $(b^\dagger)^2=0$, and the ladder has only two rungs, which is the Pauli principle for fermions.`,
      caption: String.raw`Left: the matrix $[a_N,a_N^\dagger]$ for the $N\times N$ truncation of $a$ (entries $\sqrt n$ above the diagonal). It is the identity except in the bottom corner, where it is $1-N$, as the trace argument forces. Right: the ladder is built rung by rung by applying $a^\dagger$; each rung's energy is computed from the truncated matrices as $\langle n|\tfrac12(X_N^2+P_N^2)|n\rangle$ with $X_N=(a_N+a_N^\dagger)/\sqrt2$, $P_N=(a_N-a_N^\dagger)/i\sqrt2$. All rungs sit at $n+\tfrac12$ except the top one (red), where the truncation shows. Change $N$, or switch to **fermions**: there $b^\dagger b^\dagger=0$ and the ladder stops after one step.`,
      deps: ['qm-4.2'],
      see: ['qm-5.13', 'fa-12.10'],
      refs: ['Griffiths §2.3', 'Hall ch. 11'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Canonical_commutation_relation' },
      tags: ['commutation relations', 'spectrum', 'algebraic method'],
      viz(v) {
        const M = v.M, STEP = 1.1;
        let Ns = null;
        const alg = v.select('algebra', [{ value: 'b', label: 'bosons $[a,a^\\dagger]=1$' }, { value: 'f', label: 'fermions $\\{b,b^\\dagger\\}=1$' }], 'b', { onChange: () => { Ns.el.hidden = alg.value === 'f'; v.restart(); } });
        Ns = v.slider('truncation size $N$', 2, 9, 6, { int: true, onChange: () => v.restart() });
        const sM = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: false, weight: 1, equal: true, title: 'the commutator of the truncated matrices' });
        const sL = v.stage({ x: [-1.25, 1.6], y: [0, 9.6], height: 330, axes: 'box', gutter: true, weight: 1, ylabel: 'E / ħω', xticks: [], title: 'the ladder, built one $a^\\dagger$ at a time' });
        const mats = (N, ferm) => {
          if (ferm) {
            const b = [[0, 1], [0, 0]], bd = M.transpose(b), bdb = M.matMul(bd, b);
            const anti = M.matMul(b, bd).map((r, i) => r.map((q, j) => q + bdb[i][j]));
            const H = bdb.map((r, i) => r.map((q, j) => q + (i === j ? 0.5 : 0)));
            return { a: b, C: anti, H };
          }
          const a = M.zeros(N, N); for (let i = 0; i < N - 1; i++) a[i][i + 1] = Math.sqrt(i + 1);
          const ad = M.transpose(a), ada = M.matMul(ad, a), C = M.matMul(a, ad).map((r, i) => r.map((q, j) => q - ada[i][j]));
          const X = a.map((r, i) => r.map((q, j) => (q + ad[i][j]) / Math.SQRT2)), Pm = a.map((r, i) => r.map((q, j) => (q - ad[i][j]) / Math.SQRT2)); // P = −i·Pm
          const X2 = M.matMul(X, X), P2 = M.matMul(Pm, Pm).map((r) => r.map((q) => -q)); // P² = −Pm²
          const H = X2.map((r, i) => r.map((q, j) => 0.5 * (q + P2[i][j])));
          return { a, C, H };
        };
        let st = null;
        v.animate((t) => {
          const ferm = alg.value === 'f', N = ferm ? 2 : Ns.value, D = mats(N, ferm), nb = Math.min(N, Math.floor(t / STEP) + 1);
          // matrix
          sM.setView([0, N], [0, N]);
          cells(v, sM, D.C, {
            fill: (q, i, j) => (Math.abs(q) < 1e-12 ? null : q > 0 ? ['green', 0.32] : ['red', 0.45]),
            text: (q) => (Math.abs(q) < 1e-12 ? '0' : v.fix(q, Math.abs(q - Math.round(q)) < 1e-9 ? 0 : 2)),
            textColor: (q) => (Math.abs(q) < 1e-12 ? 'faint' : q > 0 ? 'ink' : 'red'),
          });
          // ladder
          const top = ferm ? 2.6 : N + 0.6; sL.setView([-1.25, 1.6], [0, top]);
          const Ed = D.H.map((r, i) => r[i]), ev = M.eigSym(D.H).values.slice().sort((p, q) => p - q);
          for (let k = 0; k < N; k++) sL.line(-0.9, k + 0.5, 0.9, k + 0.5, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.6 });
          for (let k = 0; k < nb; k++) {
            const bad = !ferm && k === N - 1, E = Ed[k];
            sL.line(-0.9, E, 0.9, E, { color: bad ? 'red' : 'accent', width: 3 });
            sL.text(`|${k}⟩`, -1.15, E, { size: 12, color: bad ? 'red' : 'ink', baseline: 'middle' });
            sL.text(v.fix(E, 2), 0.95, E, { size: 11, color: bad ? 'red' : 'muted', baseline: 'middle' });
            if (k > 0) sL.arrow(-0.45, Ed[k - 1] + 0.06, -0.45, E - 0.06, { color: 'green', width: 1.6, head: 6 });
          }
          if (nb >= 2) sL.text('a†', -0.36, (Ed[0] + Ed[1]) / 2, { size: 12, color: 'green', baseline: 'middle', math: true });
          if (ferm && nb >= 2) { sL.text('b† b† = 0: no third rung', 0.05, 2.15, { size: 12, color: 'red', align: 'center', plate: true }); }
          if (!ferm && nb === N) sL.text(`should be ${v.fix(N - 0.5, 1)}`, 0.0, Ed[N - 1] - 0.42, { size: 11, color: 'red', align: 'center', plate: true });
          let tr = 0; for (let i = 0; i < N; i++) tr += D.C[i][i];
          st = { ferm, N, ev, tr, nb };
        }, { period: 11 * STEP, still: 10 * STEP });
        v.legend([['accent', 'rung energy from the matrices'], ['muted', 'exact ladder $n+\\frac12$', { dash: true }], ['red', 'where the truncation fails']]);
        v.readout(() => {
          if (!st) return '';
          if (st.ferm) return `$\\{b,b^\\dagger\\}=\\mathbf 1$ is satisfied by $2\\times2$ matrices, and $(b^\\dagger)^2=0$: the ladder has exactly two rungs, energies ${st.ev.map((e) => v.fix(e, 2)).join(', ')} $\\hbar\\omega$ — at most one quantum per mode (Pauli).`;
          return `$\\operatorname{tr}[a_N,a_N^\\dagger] = ${fz(v, st.tr, 6)}$ (always 0, but $\\operatorname{tr}\\mathbf 1 = ${st.N}$), so no finite matrices satisfy $[a,a^\\dagger]=1$ · eigenvalues of $\\tfrac12(X_N^2+P_N^2)$: ${st.ev.map((e) => v.fix(e, 3)).join(', ')} — the ladder $n+\\tfrac12$ plus one wrong value $(N-1)/2 = ${v.fix((st.N - 1) / 2, 1)}$ from the top rung.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Zero-point energy',
      statement: String.raw`The lowest energy of a quantum oscillator is not zero but
$$E_0=\tfrac12\hbar\omega .$$
Every state satisfies $\langle H\rangle\ge\tfrac12\hbar\omega$, with equality only for the Gaussian ground state $\psi_0\propto e^{-m\omega x^2/2\hbar}$. A classical oscillator can rest at the bottom of the well with $E=0$; a quantum one cannot, because that would require $\Delta x=\Delta p=0$. The zero-point motion is real: it gives $\Delta x_0=\sqrt{\hbar/2m\omega}$ in the ground state and has measurable consequences (isotope shifts of molecular binding energies, helium staying liquid at absolute zero under normal pressure, the Casimir force 4.13).`,
      idea: String.raw`Write $\langle H\rangle=\frac{\langle p^2\rangle}{2m}+\frac{m\omega^2\langle x^2\rangle}{2}\ge\frac{(\Delta p)^2}{2m}+\frac{m\omega^2(\Delta x)^2}{2}$. Squeezing the wave packet (small $\Delta x$) costs kinetic energy because the uncertainty principle (qm-2.11) forces $\Delta p\ge\hbar/2\Delta x$; spreading it costs potential energy. By AM–GM the sum is at least $\omega\,\Delta x\,\Delta p\ge\tfrac12\hbar\omega$, attained only when $\Delta x\Delta p=\hbar/2$ (a Gaussian) and $\Delta x^2=\hbar/2m\omega$. The ladder algebra gives the same number exactly: $\hat H=\hbar\omega(a^\dagger a+\tfrac12)$ and $a^\dagger a\ge0$ (4.3).`,
      caption: String.raw`Left: a trial state of the family you choose (Gaussian, sech or tent) in the parabolic well, drawn at the height of its energy $\langle H\rangle$; the red dot is the classical ground state, at rest with $E=0$. Right: kinetic (orange) and potential (purple) energy against the width $\Delta x$, and their sum. **Drag the gold handle** along the total: narrow states pay in kinetic energy, wide ones in potential energy, and the minimum is $\tfrac12\hbar\omega$ exactly for the Gaussian at $\Delta x=1/\sqrt2$ — higher for the other shapes. Shifting the state ($x_0$) or giving it momentum ($p_0$) only adds energy. The readout re-computes $\langle T\rangle$ and $\langle V\rangle$ by quadrature on a grid.`,
      deps: ['qm-4.3', 'qm-2.11'],
      see: ['qm-4.13', 'qm-4.9'],
      refs: ['Griffiths §2.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zero-point_energy' },
      tags: ['zero-point energy', 'uncertainty principle', 'variational'],
      viz(v) {
        const G = grid(-12, 12, 2401);
        // kinetic coefficient κ in ⟨p²⟩ = κ/Δx² for each shape (Gaussian 1/4 is the uncertainty minimum)
        const FAM = { gauss: { label: 'Gaussian', k: 0.25 }, sech: { label: 'sech', k: (Math.PI * Math.PI) / 36 }, tent: { label: 'tent', k: 0.3 } };
        const fam = v.select('trial shape', Object.entries(FAM).map(([value, f]) => ({ value, label: f.label })), 'gauss');
        const x0s = v.slider('centre $x_0$', -1.5, 1.5, 0, { step: 0.01 });
        const p0s = v.slider('momentum $p_0$', -1.5, 1.5, 0, { step: 0.01 });
        const sL = v.stage({ x: [-4.2, 4.2], y: [-0.15, 3.3], height: 330, axes: 'box', gutter: true, weight: 1.2, xlabel: 'x', ylabel: 'E / ħω', title: 'the trial state, drawn at its energy $\\langle H\\rangle$' });
        const sR = v.stage({ x: [0.12, 2.3], y: [0, 3.3], height: 330, axes: 'box', gutter: true, weight: 1, xlabel: 'Δx', ylabel: 'E / ħω', title: 'energy against width' });
        const Ek = (d) => 0.5 * FAM[fam.value].k / (d * d), Ep = (d) => 0.5 * d * d, shift = () => 0.5 * (x0s.value ** 2 + p0s.value ** 2);
        const Etot = (d) => Ek(d) + Ep(d) + shift();
        const hW = sR.handle(1.25, 1, { color: 'gold', r: 8, label: 'Δx', labelPos: 'ne', constrain: (X) => { const d = Math.min(2.25, Math.max(0.2, X)); return [d, Etot(d)]; } });
        const psiOf = (d) => {
          const f = fam.value, x0 = x0s.value, p0 = p0s.value, n = G.n, re = new Float64Array(n), im = new Float64Array(n);
          for (let i = 0; i < n; i++) {
            const y = G.x[i] - x0;
            const a = f === 'gauss' ? Math.exp(-(y * y) / (4 * d * d)) : f === 'sech' ? 1 / Math.cosh((Math.PI * y) / (Math.sqrt(12) * d)) : Math.max(0, 1 - Math.abs(y) / (Math.sqrt(10) * d));
            re[i] = a * Math.cos(p0 * G.x[i]); im[i] = a * Math.sin(p0 * G.x[i]);
          }
          normalize(re, im, G.dx); return { re, im };
        };
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), d = hW.x, E = Etot(d), top = 3.4 + shift();
          sL.setView([-4.2, 4.2], [-0.15, top]); sR.setView([0.12, 2.3], [0, top]); hW.set(d, E);
          // left
          parabola(sL, -4.2, 4.2);
          sL.hline(0.5, { color: 'green', width: 1.3, dash: [5, 4] }); sL.text('½ħω', -4.1, 0.5, { size: 11, color: 'green', dy: -9 });
          const P = psiOf(d); let pk = 0; for (let i = 0; i < G.n; i++) pk = Math.max(pk, Math.hypot(P.re[i], P.im[i]));
          drawPsi(sL, G.x, P.re, P.im, { col, base: E, scale: 0.75 / Math.max(pk, 0.75) });
          sL.hline(E, { color: 'accent', width: 1.2, dash: [2, 3], alpha: 0.6 });
          sL.dot(0, 0, { r: 6, color: 'red', label: 'classical rest, E = 0', labelPos: 'e' });
          phaseWheel(sL, col, sL.W - 40, 48, 11);
          // right
          const g = 0.25, sh = shift();
          if (fam.value !== 'gauss') sR.fn((q) => 0.5 * g / (q * q) + 0.5 * q * q + sh, { color: 'muted', width: 1.3, dash: [5, 4] });
          sR.fn(Ek, { color: 'orange', width: 2 }); sR.fn(Ep, { color: 'purple', width: 2 });
          sR.fn(Etot, { color: 'accent', width: 3 });
          sR.hline(0.5, { color: 'green', width: 1.3, dash: [5, 4] });
          const kq = FAM[fam.value].k, dmin = Math.pow(kq, 0.25), Emin = Math.sqrt(kq) + sh;
          sR.dot(dmin, Emin, { r: 4.5, color: 'green', label: `min ${v.fix(Emin, 4)}`, labelPos: 's' });
          sR.text('kinetic ∝ 1/Δx²', 0.36, top - 0.3, { size: 11, color: 'orange' }); sR.text('potential ∝ Δx²', 2.25, Math.min(top - 0.3, 2.3), { size: 11, color: 'purple', align: 'right' });
          // numerical check
          const mo = moments(G.x, P.re, P.im), T = 0.5 * (mo.sp * mo.sp + mo.mp * mo.mp), V = 0.5 * (mo.sx * mo.sx + mo.mx * mo.mx);
          st = { d, E, T, V, mo, Emin, dmin };
        });
        v.legend([['orange', 'kinetic $\\langle T\\rangle$'], ['purple', 'potential $\\langle V\\rangle$'], ['accent', 'total $\\langle H\\rangle$'], ['green', '$\\frac12\\hbar\\omega$', { dash: true }]]);
        v.readout(() => st && `$\\Delta x = ${v.fix(st.d, 3)}$: by quadrature $\\langle T\\rangle = ${v.fix(st.T, 4)}$, $\\langle V\\rangle = ${v.fix(st.V, 4)}$, $\\langle H\\rangle = ${v.fix(st.T + st.V, 4)}$ (formula ${v.fix(st.E, 4)}) $\\ge\\tfrac12\\hbar\\omega$ · $\\Delta x\\,\\Delta p = ${v.fix(st.mo.sx * st.mo.sp, 4)}\\ge\\tfrac12$ · best width for this shape $\\Delta x = ${v.fix(st.dmin, 3)}$ with $E = ${v.fix(st.Emin, 4)}$${fam.value === 'gauss' && !x0s.value && !p0s.value ? ' — the ground state, exactly ½' : ''}.`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Hermite-function eigenstates',
      statement: String.raw`The normalized eigenfunctions of the oscillator (units $\hbar=m=\omega=1$) are the **Hermite functions**
$$\psi_n(x)=\frac{(a_+)^n}{\sqrt{n!}}\,\psi_0=\frac{1}{\sqrt{2^n n!\sqrt\pi}}\,H_n(x)\,e^{-x^2/2},\qquad \psi_0=\pi^{-1/4}e^{-x^2/2},$$
where $H_n$ is the $n$-th Hermite polynomial ($H_0=1$, $H_1=2x$, $H_{n+1}=2xH_n-2nH_{n-1}$). They satisfy:
(a) $\psi_n$ has parity $(-1)^n$ and exactly $n$ real zeros, all between the classical turning points $\pm\sqrt{2n+1}$;
(b) $\int\psi_m\psi_n\,dx=\delta_{mn}$;
(c) they form an orthonormal basis of $L^2(\R)$.`,
      idea: String.raw`$\psi_0$ is fixed by the first-order equation $a_-\psi_0=\tfrac1{\sqrt2}(x+\tfrac{d}{dx})\psi_0=0$, whose only solution is the Gaussian. Each application of $a_+=\tfrac1{\sqrt2}(x-\tfrac{d}{dx})$ to a polynomial times $e^{-x^2/2}$ gives another one of one higher degree, $(2xH_n-H_n')e^{-x^2/2}/\sqrt2$, which is the Hermite recurrence. Orthogonality is automatic for eigenvectors of the self-adjoint $\hat H$ with different eigenvalues; the zeros interlace by the node theorem (qm-3.7). Completeness follows because $\{x^ne^{-x^2/2}\}$ spans a dense subspace of $L^2$ (its orthogonal complement would have a Fourier transform that vanishes identically).`,
      caption: String.raw`Left: starting from the chosen state, $a_+$ is applied **numerically** (finite differences) again and again and each result is normalized; the functions appear in the well at their energies $\langle H\rangle$, nodes marked in red. Right: the matrix of overlaps $\int\psi_j\psi_k\,dx$ of everything built so far, colour-coded on a log scale — the identity, to rounding. **Raise $n$** to add rungs. Then switch the starting state to a **sech** that is *not* killed by $a_-$: the functions built from it are not eigenstates (their energy spread is large), and the overlap matrix fills with red.`,
      deps: ['qm-4.3', 'qm-3.7'],
      see: ['rca-4.18', 'ode-4.10'],
      refs: ['Griffiths §2.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hermite_polynomials#Hermite_functions' },
      tags: ['Hermite functions', 'orthogonality', 'eigenfunctions'],
      viz(v) {
        const G = grid(-9, 9, 1801), x = G.x, NMAX = 11;
        const start = v.select('start from', [{ value: 'g', label: 'Gaussian ($a_-\\psi_0=0$)' }, { value: 's', label: 'sech $x$ ($a_-\\psi\\neq0$)' }], 'g');
        const ns = v.slider('raise to $n$', 0, NMAX, 5, { int: true });
        const sL = v.stage({ x: [-6, 6], y: [0, 7], height: 360, axes: 'box', gutter: { r: 4 }, weight: 1.35, xlabel: 'x', ylabel: 'E / ħω', title: '$\\psi_{k+1}\\propto a_+\\psi_k$, each drawn at its energy' });
        const sG = v.stage({ x: [0, 1], y: [0, 1], height: 360, axes: false, weight: 1, equal: true, title: 'overlaps $\\int\\psi_j\\psi_k\\,dx$' });
        let D = null;
        const build = () => {
          if (D && D.key === start.value) return D;
          const f = []; let y = Float64Array.from(x, (X) => (start.value === 'g' ? Math.exp(-0.5 * X * X) : 1 / Math.cosh(X)));
          const nrm = (y) => { let s = 0; for (const q of y) s += q * q; s = Math.sqrt(s * G.dx); return y.map((q) => q / s); };
          y = nrm(y); f.push(y);
          for (let k = 0; k < NMAX; k++) { y = nrm(ladder(x, y, true)); f.push(y); }
          const E = [], res = [], Vg = Float64Array.from(x, (X) => 0.5 * X * X);
          for (const y of f) {
            const d = deriv(y, G.dx), d2 = deriv(d, G.dx); let e = 0; for (let i = 0; i < y.length; i++) e += 0.5 * d[i] * d[i] + Vg[i] * y[i] * y[i]; e *= G.dx; E.push(e);
            let r = 0; for (let i = 20; i < y.length - 20; i++) r += (-0.5 * d2[i] + Vg[i] * y[i] - e * y[i]) ** 2; res.push(Math.sqrt(r * G.dx));
          }
          const Gm = f.map((a) => f.map((b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s * G.dx; }));
          const ex = Array.from({ length: NMAX + 1 }, (_, k) => { let m = 0; for (let i = 0; i < x.length; i += 3) m = Math.max(m, Math.abs(f[k][i] - hermiteAt(x[i], k + 1)[k])); return m; });
          return (D = { key: start.value, f, E, res, Gm, Vg, ex });
        };
        const RAMP = (t) => v.ramp(t, 'red');
        let st = null;
        v.render(() => {
          const D = build(), n = ns.value, col = phaseLUT(v), top = Math.max(3, D.E[n] + 1.25);
          sL.setView([-6, 6], [0, top]);
          const show = Array.from({ length: n + 1 }, (_, k) => k).filter((k) => D.E[k] < top);
          levelDiagram(sL, { x, V: D.Vg, E: D.E, psi: D.f, col, amp: 0.42, show, hi: n, nodes: true, label: (k) => `ψ${sub(k)}` });
          const A = Math.sqrt(2 * D.E[n]);
          for (const s of [-1, 1]) sL.line(s * A, 0, s * A, D.E[n], { color: 'green', width: 1.2, dash: [3, 3] });
          sL.text('turning points ±√(2E)', 0, 0.22, { size: 10.5, color: 'green', align: 'center', plate: true });
          // overlap matrix
          const m = n + 1; sG.setView([0, m], [0, m]);
          const Gs = D.Gm.slice(0, m).map((r) => r.slice(0, m));
          cells(v, sG, Gs, {
            fill: (q, i, j) => (i === j ? ['green', 0.45] : [RAMP(Math.min(1, Math.max(0, (Math.log10(Math.abs(q) + 1e-300) + 14) / 14))), 1]),
            text: (q, i, j) => (m > 7 ? null : i === j ? v.fix(q, 3) : Math.abs(q) < 1e-3 ? '≈0' : v.fix(q, 2)),
            textColor: (q, i, j) => (i === j || Math.abs(q) > 0.05 ? 'ink' : 'muted'),
          });
          let off = 0; for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) off = Math.max(off, Math.abs(Gs[i][j]));
          let zeros = 0; const y = D.f[n]; let mx = 0; for (const q of y) mx = Math.max(mx, Math.abs(q)); for (let i = 1; i < y.length; i++) if (y[i - 1] * y[i] < 0 && Math.abs(y[i]) + Math.abs(y[i - 1]) > 1e-4 * mx) zeros++;
          st = { n, off, E: D.E[n], res: D.res[n], ex: D.ex[n], zeros, g: start.value === 'g' };
        });
        v.legend([['green', 'diagonal: norms', { area: true }], ['red', 'off-diagonal, colour = log₁₀ of size (white ≤ 10⁻¹⁴)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.g) return `$\\psi_{${st.n}}\\propto H_{${st.n}}(x)e^{-x^2/2}$, $H_{${st.n}} = ${hermiteTeX(st.n)}$ · ${st.zeros} nodes · $\\langle H\\rangle = ${v.fix(st.E, 5)}$ (exact ${st.n}.5), residual $\\norm{\\hat H\\psi-E\\psi} = ${v.sci(Math.max(st.res, 1e-16), 1)}$ · largest off-diagonal overlap $${v.sci(Math.max(st.off, 1e-17), 1)}$ · differs from the closed form by $${v.sci(Math.max(st.ex, 1e-16), 1)}$.`;
          return `Built from sech $x$: $\\langle H\\rangle = ${v.fix(st.E, 4)}$, but $\\norm{\\hat H\\psi-\\langle H\\rangle\\psi} = ${v.fix(st.res, 3)}$ — **not** an eigenstate; largest off-diagonal overlap **${v.fix(st.off, 3)}**. Raising preserves eigenstates only if you start at the bottom rung, the state with $a_-\\psi=0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Hermite functions diagonalize the Fourier transform',
      statement: String.raw`With the unitary Fourier transform $(\mathcal F f)(p)=\frac1{\sqrt{2\pi}}\int e^{-ipx}f(x)\,dx$, the Hermite functions are eigenfunctions:
$$\mathcal F\psi_n=(-i)^n\,\psi_n .$$
So $L^2(\R)$ splits into the four eigenspaces of $\mathcal F$, with eigenvalues $1,-i,-1,i$, and $\mathcal F^4=\mathbf 1$. Equivalently, the oscillator propagator for a quarter period is a Fourier transform:
$$e^{-i\hat H\pi/2}=e^{-i\pi/4}\,\mathcal F,\qquad\text{so}\qquad \Psi(x,\tfrac\pi2)=e^{-i\pi/4}\,(\mathcal F\Psi_0)(x)$$
for every initial state (units $\hbar=m=\omega=1$). Evolving for a general time $\theta$ gives the **fractional Fourier transform**.`,
      idea: String.raw`In the Fourier picture $x\mapsto i\,d/dp$ and $d/dx\mapsto ip$, so $\mathcal F a_+\mathcal F^{-1}=\tfrac1{\sqrt2}(i\frac{d}{dp}-ip)=-i\,a_+$. The Gaussian $\psi_0$ is its own transform (fa-7.6), and then $\mathcal F\psi_n=\mathcal F\frac{a_+^n}{\sqrt{n!}}\psi_0=(-i)^n\frac{a_+^n}{\sqrt{n!}}\psi_0=(-i)^n\psi_n$. Expanding any state in Hermite functions (4.5), the propagator multiplies $\psi_n$ by $e^{-i(n+\frac12)t}$, which at $t=\pi/2$ is $e^{-i\pi/4}(-i)^n$ — the Fourier multiplier. Physically: a quarter period of oscillation rotates phase space by $90°$, turning positions into momenta (mech-4.5, qm-2.10).`,
      caption: String.raw`Top left: the Hermite function $\psi_n$ (shaded) and the real and imaginary parts of its numerically computed Fourier transform (FFT) — one of them lies exactly on $\pm\psi_n$ and the other vanishes. Top right: the eigenvalue $\langle\psi_n|\mathcal F\psi_n\rangle$ (gold) lands on $1,-i,-1,i$ in turn as $n$ increases. Bottom: pick any initial state and let the oscillator evolve it (exact Hermite expansion): at $t=\pi/2$ (dashed tick) it has become its own Fourier transform (outline), at $t=\pi$ its mirror image, and at $2\pi$ it is back. The bottom trace shows the overlaps $|\langle\mathcal F\Psi_0|\Psi_t\rangle|^2$ and $|\langle\Psi_0|\Psi_t\rangle|^2$.`,
      deps: ['qm-4.5', 'fa-7.6', 'qm-2.10'],
      see: ['qm-2.10'],
      refs: ['Hall ch. 11'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fractional_Fourier_transform' },
      tags: ['Fourier transform', 'Hermite functions', 'fractional Fourier transform'],
      viz(v) {
        const M = v.M, NG = 512, dx = Math.sqrt(TAU / NG), NH = 70, PER = 16;
        const x = Float64Array.from({ length: NG }, (_, i) => (i - NG / 2) * dx); // self-dual grid: the FFT lands on the same points
        const phi = hermiteFns(x, NH);
        const ns = v.slider('Hermite index $n$', 0, 11, 3, { int: true });
        const SH = { packet: 'moving packet', two: 'two bumps', box: 'soft box' };
        const shape = v.select('initial state', Object.entries(SH).map(([value, label]) => ({ value, label })), 'packet');
        v.button('jump to $t=\\pi/2$', () => { v.pause(); v.t = PER / 4; });
        const sA = v.stage({ x: [-6, 6], y: [-0.8, 0.8], height: 250, axes: 'box', gutter: true, weight: 1.5, xlabel: 'x  (and p)', title: '$\\psi_n$ and its Fourier transform' });
        const sB = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], height: 250, axes: false, equal: true, weight: 0.75, title: 'eigenvalue of $\\mathcal F$' });
        const sC = v.stage({ x: [-7, 7], y: [0, 1], height: 230, axes: 'box', gutter: true, full: true, xlabel: 'x', title: '$\\Psi(x,t)$ under the oscillator (height $|\\Psi|$, colour phase)' });
        const sD = v.stage({ x: [0, TAU], y: [0, 1.05], height: 130, axes: 'box', gutter: true, full: true, xlabel: 't', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [TAU, '2π']], yticks: [0, 0.5, 1], title: 'overlaps with $\\mathcal F\\Psi_0$ and with $\\Psi_0$' });
        const fft = (re, im) => toMomentum(M, x, re, im);
        let D = null;
        const data = () => {
          if (D && D.key === shape.value) return D;
          const re = new Float64Array(NG), im = new Float64Array(NG);
          for (let i = 0; i < NG; i++) {
            const X = x[i]; let a = 0, b = 0;
            if (shape.value === 'packet') { const g = Math.exp(-((X - 2.2) ** 2) / (2 * 0.45 ** 2)); a = g * Math.cos(1.5 * X); b = g * Math.sin(1.5 * X); }
            else if (shape.value === 'two') { const g1 = Math.exp(-((X + 2) ** 2) / 0.9), g2 = 0.6 * Math.exp(-((X - 1.5) ** 2) / 0.5); a = g1 + g2 * Math.cos(2 * X); b = g2 * Math.sin(2 * X); }
            else { a = 0.5 * (Math.tanh(2.5 * (X + 1.6)) - Math.tanh(2.5 * (X - 1.6))); }
            re[i] = a; im[i] = b;
          }
          normalize(re, im, dx);
          const F = fft(re, im), c = project(phi, re, im, dx);
          let kept = 0; for (let k = 0; k < NH; k++) kept += c.re[k] ** 2 + c.im[k] ** 2;
          const ov = (A, B) => { let r = 0, q = 0; for (let i = 0; i < NG; i++) { r += A.re[i] * B.re[i] + A.im[i] * B.im[i]; q += A.re[i] * B.im[i] - A.im[i] * B.re[i]; } return (r * r + q * q) * dx * dx; };
          const tr = []; for (let k = 0; k <= 240; k++) { const t = (TAU * k) / 240, P = evolve(phi, c.re, c.im, t); tr.push([t, ov(F, P), ov({ re, im }, P)]); }
          return (D = { key: shape.value, re, im, F, c, kept, tr, ov });
        };
        let st = null;
        v.animate((t) => {
          const col = phaseLUT(v), n = ns.value, p = phi[n];
          // ψ_n and its FFT
          const F = fft(p, new Float64Array(NG));
          const pk = 1.2 * Math.max(...p.map(Math.abs)); sA.setView([-6, 6], [-pk, pk]);
          drawReal(sA, x, p, { col, alpha: 0.35, outline: 'ink', width: 1.4 });
          sA.path(Array.from(x, (X, i) => [X, F.re[i]]), { color: 'gold', width: 2.4, dash: [7, 4] });
          sA.path(Array.from(x, (X, i) => [X, F.im[i]]), { color: 'purple', width: 2.4, dash: [2, 4] });
          let lr = 0, li = 0, err = 0; const ex = [[1, 0], [0, -1], [-1, 0], [0, 1]][n % 4];
          for (let i = 0; i < NG; i++) { lr += p[i] * F.re[i]; li += p[i] * F.im[i]; err = Math.max(err, Math.hypot(F.re[i] - ex[0] * p[i], F.im[i] - ex[1] * p[i])); }
          lr *= dx; li *= dx;
          // eigenvalue wheel
          sB.circle(0, 0, 1, { color: 'muted', width: 1.2 }); sB.line(-1.35, 0, 1.35, 0, { color: 'grid' }); sB.line(0, -1.35, 0, 1.35, { color: 'grid' });
          const pts = [[1, 0, '1', 'e'], [0, -1, '−i', 's'], [-1, 0, '−1', 'w'], [0, 1, 'i', 'n']];
          pts.forEach(([a, b, lab, pos], k) => { sB.dot(a, b, { r: 5, color: k === n % 4 ? 'accent' : 'muted', hollow: k !== n % 4, label: `${lab}  (n ≡ ${k})`, labelPos: pos }); });
          for (let k = 0; k < 4; k++) { const a0 = -(k * Math.PI) / 2 - 0.25, a1 = -((k + 1) * Math.PI) / 2 + 0.25; sB.curve((u) => [0.78 * Math.cos(a0 + (a1 - a0) * u), 0.78 * Math.sin(a0 + (a1 - a0) * u)], 0, 1, { color: 'faint', width: 1 }); }
          sB.dot(lr, li, { r: 7, color: 'gold' });
          // fractional Fourier transform
          const D = data(), th = (t / PER) * TAU, P = evolve(phi, D.c.re, D.c.im, th);
          let top = 0; for (let i = 0; i < NG; i++) top = Math.max(top, Math.hypot(D.re[i], D.im[i]), Math.hypot(D.F.re[i], D.F.im[i]), Math.hypot(P.re[i], P.im[i]));
          sC.setView([-7, 7], [-0.04 * top, 1.12 * top]);
          sC.path(Array.from(x, (X, i) => [X, Math.hypot(D.re[i], D.im[i])]), { color: 'muted', width: 1.4, dash: [4, 3] });
          sC.path(Array.from(x, (X, i) => [X, Math.hypot(D.F.re[i], D.F.im[i])]), { color: 'ink', width: 1.6, dash: [8, 4] });
          drawPsi(sC, x, P.re, P.im, { col });
          phaseWheel(sC, col, sC.W - 44, 44, 11);
          sC.corner(`t = ${v.fix(th / Math.PI, 3)} π`, 'tl', { color: 'ink', weight: 600 });
          // overlap traces
          for (const q of [Math.PI / 2, Math.PI, 1.5 * Math.PI]) sD.vline(q, { color: 'faint', dash: [3, 3] });
          sD.path(D.tr.map((r) => [r[0], r[1]]), { color: 'green', width: 2.2 });
          sD.path(D.tr.map((r) => [r[0], r[2]]), { color: 'accent', width: 1.6 });
          const oF = D.ov(D.F, P), o0 = D.ov({ re: D.re, im: D.im }, P);
          sD.vline(th, { color: 'gold', width: 1.4 }); sD.dot(th, oF, { r: 5, color: 'green' }); sD.dot(th, o0, { r: 4, color: 'accent' });
          // the π/2 check, with the global phase e^{−iπ/4}
          const Q = evolve(phi, D.c.re, D.c.im, Math.PI / 2); let dq = 0; const cr = Math.cos(-Math.PI / 4), ci = Math.sin(-Math.PI / 4);
          for (let i = 0; i < NG; i++) dq += (Q.re[i] - (cr * D.F.re[i] - ci * D.F.im[i])) ** 2 + (Q.im[i] - (cr * D.F.im[i] + ci * D.F.re[i])) ** 2;
          st = { n, lr, li, err, th, oF, o0, dq: Math.sqrt(dq * dx), kept: D.kept };
        }, { period: PER, still: PER / 4 });
        v.legend([['gold', 'Re 𝓕ψₙ', { dash: true }], ['purple', 'Im 𝓕ψₙ', { dash: true }], ['ink', '|𝓕Ψ₀|', { dash: true }], ['muted', '|Ψ₀|', { dash: true }], ['green', '|⟨𝓕Ψ₀|Ψₜ⟩|²'], ['accent', '|⟨Ψ₀|Ψₜ⟩|²']]);
        v.readout(() => st && `$\\langle\\psi_{${st.n}}|\\mathcal F\\psi_{${st.n}}\\rangle = ${fz(v, st.lr, 5)} ${st.li < 0 ? '-' : '+'} ${fz(v, Math.abs(st.li), 5)}\\,i$ $= (-i)^{${st.n}}$; $\\max|\\mathcal F\\psi_n-(-i)^n\\psi_n| = ${v.sci(Math.max(st.err, 1e-16), 1)}$ (FFT) · now $|\\langle\\mathcal F\\Psi_0|\\Psi_t\\rangle|^2 = ${v.fix(st.oF, 4)}$ · $\\norm{\\Psi(\\tfrac\\pi2)-e^{-i\\pi/4}\\mathcal F\\Psi_0} = ${v.sci(Math.max(st.dq, 1e-16), 1)}$ (the ${NH}-term expansion keeps $1-${v.sci(Math.max(1 - st.kept, 1e-16), 1)}$ of the norm).`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Coherent states',
      credit: 'Schrödinger, 1926; Glauber, 1963',
      statement: String.raw`A **coherent state** is an eigenvector of the lowering operator, $a|\alpha\rangle=\alpha|\alpha\rangle$ with $\alpha\in\C$. Equivalently it is the ground state displaced in phase space to $\langle x\rangle=\sqrt2\,\operatorname{Re}\alpha$, $\langle p\rangle=\sqrt2\,\operatorname{Im}\alpha$ (units $\hbar=m=\omega=1$):
$$|\alpha\rangle=e^{-|\alpha|^2/2}\sum_{n\ge0}\frac{\alpha^n}{\sqrt{n!}}\,|n\rangle,\qquad \psi_\alpha(x)=\pi^{-1/4}e^{-(x-\langle x\rangle)^2/2+i\langle p\rangle x}\ (\text{up to phase}).$$
Its properties: the number of quanta is **Poisson distributed** with mean and variance $|\alpha|^2$; $\Delta x=\Delta p=1/\sqrt2$, the minimum uncertainty; and under the oscillator it stays coherent with $\alpha(t)=\alpha e^{-i\omega t}$ — a Gaussian that swings back and forth **without changing shape**.`,
      idea: String.raw`Solving $a\psi=\alpha\psi$, i.e. $\frac1{\sqrt2}(x+\frac d{dx})\psi=\alpha\psi$, gives a Gaussian of the ground-state width centred at $\sqrt2\alpha$. In the number basis the eigen-equation reads $\sqrt{n+1}\,c_{n+1}=\alpha c_n$, so $c_n\propto\alpha^n/\sqrt{n!}$ and $|c_n|^2$ is Poisson. Time evolution multiplies $c_n$ by $e^{-i(n+\frac12)t}$, which is the same as replacing $\alpha$ by $\alpha e^{-it}$ (and an overall phase), so the state is always a displaced ground state. Ehrenfest (qm-2.9) then says the centre follows the classical orbit, which 4.8 shows in phase space.`,
      caption: String.raw`**Drag $\alpha$** in the phase-plane panel (its position is the packet's starting $\langle x\rangle,\langle p\rangle$). Top: $\Psi(x,t)$ swinging in the well (height $|\Psi|$, colour phase), computed by projecting the displaced Gaussian onto 60 Hermite functions and evolving each one exactly. The dashed outline is the ground state's shape re-centred on the packet: it never deviates, and the red dot is a classical particle with the same start. Bottom right: the probabilities $|\langle n|\alpha\rangle|^2$ from that projection (bars) against the Poisson law with mean $|\alpha|^2$ (dots).`,
      deps: ['qm-4.2', 'qm-2.9'],
      see: ['qm-4.12'],
      refs: ['Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coherent_state' },
      tags: ['coherent states', 'Poisson distribution', 'minimum uncertainty'],
      viz(v) {
        const G = grid(-11, 11, 881), x = G.x, NH = 60, PER = TAU * 2.5;
        const phi = hermiteFns(x, NH);
        const sA = v.stage({ x: [-6.5, 6.5], y: [0, 1], height: 250, axes: 'box', gutter: true, full: true, xlabel: 'x', title: '$\\Psi(x,t)$ in the well' });
        const sP = v.stage({ x: [-4.6, 4.6], y: [-4.6, 4.6], height: 260, axes: 'box', gutter: true, equal: true, weight: 0.85, xlabel: 'x', ylabel: 'p', title: 'phase plane: drag $\\alpha$' });
        const sN = v.stage({ x: [-0.6, 20.5], y: [0, 0.5], height: 260, axes: 'box', gutter: true, weight: 1.3, xlabel: 'n', ylabel: 'P(n)', title: 'number distribution $|\\langle n|\\alpha\\rangle|^2$' });
        const hA = sP.handle(2.5, 1.0, { color: 'gold', r: 8, label: 'α', labelPos: 'ne', constrain: (X, Y) => { const r = Math.hypot(X, Y), k = r > 4.2 ? 4.2 / r : 1; return [X * k, Y * k]; } });
        let D = null;
        const data = () => {
          const key = `${hA.x}|${hA.y}`; if (D && D.key === key) return D;
          const x0 = hA.x, p0 = hA.y, re = new Float64Array(G.n), im = new Float64Array(G.n);
          for (let i = 0; i < G.n; i++) { const a = Math.exp(-0.5 * (x[i] - x0) ** 2); re[i] = a * Math.cos(p0 * x[i]); im[i] = a * Math.sin(p0 * x[i]); }
          normalize(re, im, G.dx);
          const c = project(phi, re, im, G.dx), P = Array.from(c.re, (r, k) => r * r + c.im[k] * c.im[k]);
          const lam = 0.5 * (x0 * x0 + p0 * p0); let mean = 0, m2 = 0; P.forEach((q, k) => { mean += k * q; m2 += k * k * q; });
          return (D = { key, x0, p0, c, P, lam, mean, vr: m2 - mean * mean });
        };
        let st = null;
        v.animate((t) => {
          const D = data(), col = phaseLUT(v), P = evolve(phi, D.c.re, D.c.im, t), pk = PI14;
          // well
          sA.setView([-6.5, 6.5], [-0.05, 1.25 * pk]);
          sA.fn((X) => (0.5 * X * X) / 12 * 1.25 * pk, { color: 'muted', width: 1.5, fill: 'muted', fillAlpha: 0.1, n: 300 });
          drawPsi(sA, x, P.re, P.im, { col });
          const cv = covariance(x, P.re, P.im);
          sA.path(Array.from(x, (X) => [X, pk * Math.exp(-0.5 * (X - cv.mx) ** 2)]), { color: 'ink', width: 1.4, dash: [4, 3] });
          const al = { r: (D.x0 * Math.cos(t) + D.p0 * Math.sin(t)), i: (D.p0 * Math.cos(t) - D.x0 * Math.sin(t)) }; // classical (x, p) after time t
          sA.dot(al.r, 0, { r: 6, color: 'red' });
          phaseWheel(sA, col, sA.W - 40, 44, 11);
          // phase plane
          const R = Math.hypot(D.x0, D.p0);
          sP.circle(0, 0, R, { color: 'muted', width: 1.2, dash: [4, 4] });
          sP.circle(cv.mx, cv.mp, Math.SQRT1_2, { color: 'accent', width: 1.6, fill: 'accent', fillAlpha: 0.2 });
          sP.dot(al.r, al.i, { r: 4, color: 'red' });
          // number distribution
          const top = Math.max(0.12, ...D.P.slice(0, 22)) * 1.18; sN.setView([-0.6, 20.5], [0, top]);
          sN.bars(D.P.slice(0, 21), { x0: 0, dx: 1, color: 'accent' });
          sN.dots(Array.from({ length: 21 }, (_, k) => [k, poisson(D.lam, k)]), { r: 4, color: 'orange' });
          // check a ψ = α(t) ψ numerically
          const d1 = deriv(P.re, G.dx), d2 = deriv(P.im, G.dx), ar = al.r / Math.SQRT2, ai = al.i / Math.SQRT2;
          let res = 0; for (let i = 0; i < G.n; i++) { const ur = (x[i] * P.re[i] + d1[i]) / Math.SQRT2 - (ar * P.re[i] - ai * P.im[i]), ui = (x[i] * P.im[i] + d2[i]) / Math.SQRT2 - (ar * P.im[i] + ai * P.re[i]); res += ur * ur + ui * ui; }
          let tv = 0; for (let k = 0; k < NH; k++) tv += Math.abs(D.P[k] - poisson(D.lam, k));
          st = { D, cv, res: Math.sqrt(res * G.dx), tv: tv / 2, t };
        }, { period: PER, still: 2.2 });
        v.legend([['accent', '$|\\langle n|\\alpha\\rangle|^2$ (projection)', { area: true }], ['orange', 'Poisson, mean $|\\alpha|^2$', { dot: true }], ['ink', 'ground-state shape, re-centred', { dash: true }], ['red', 'classical particle', { dot: true }]]);
        v.readout(() => st && `$|\\alpha|^2 = ${v.fix(st.D.lam, 3)}$: from the projection $\\langle n\\rangle = ${v.fix(st.D.mean, 3)}$, $\\operatorname{Var}n = ${v.fix(st.D.vr, 3)}$ (Poisson: both equal $|\\alpha|^2$), total-variation distance to Poisson $${v.sci(Math.max(st.tv, 1e-16), 1)}$ · now $\\Delta x = ${v.fix(Math.sqrt(st.cv.sxx), 4)}$, $\\Delta p = ${v.fix(Math.sqrt(st.cv.spp), 4)}$ (vacuum $1/\\sqrt2 = 0.7071$) · $\\norm{a\\Psi_t-\\alpha e^{-it}\\Psi_t} = ${v.sci(Math.max(st.res, 1e-16), 1)}$.`);
      },
    },
  ],
};

