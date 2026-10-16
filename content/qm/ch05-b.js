// Quantum Mechanics — Chapter 5, part b: items 5.9–5.15 (commutators, uncertainty, compatibility, CCR, Stone–von Neumann, unitary evolution)
import {
  TAU, grid, phaseLUT, drawPsi, drawReal, phaseWheel, fz, sub, hermiteFns,
  cadd, csub, cmul, cconj, cscale, cabs, cabs2, carg, cis, ip, vnorm, vnormalize, basis,
  mat, eye, cplx, mmul, mvec, adj, madd, msub, mscale, comm, trace, fnorm, maxAbs, outer, expect, herm, cols, fromCols,
  heig, propagator, expmC, randState, randHerm, randUnitary, spinOps, spinAlong, blochOf, stateOf, spinCoherent, rotate3,
  oscX, oscP, texC, texMat, cells, blochFrame, sphereOutline,
} from './ch05.shared.js';

/** Mean and spread of a Hermitian A in state ψ: {m, d} with d = ΔA. */
function spread(A, psi) { const m = expect(A, psi)[0], m2 = expect(mmul(A, A), psi)[0]; return { m, d: Math.sqrt(Math.max(0, m2 - m * m)) }; }

export default {
  collection: 'qm',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Definition',
      name: 'Canonical commutation relation',
      statement: String.raw`The **commutator** of two operators is $[A,B]=AB-BA$. Position and momentum on $L^2(\R)$, $\hat x\psi=x\psi$ and $\hat p\psi=-i\hbar\,\psi'$, satisfy the **canonical commutation relation**
$$[\hat x,\hat p]=i\hbar\,I$$
on every smooth, rapidly decaying $\psi$ (e.g. Schwartz functions, a common dense domain). In $n$ dimensions, $[\hat x_j,\hat p_k]=i\hbar\,\delta_{jk}$ and $[\hat x_j,\hat x_k]=[\hat p_j,\hat p_k]=0$. Canonical quantization takes these relations as the definition of position and momentum; everything else (uncertainty, the Heisenberg equations, the oscillator spectrum) follows from them.`,
      idea: String.raw`Apply both orders to a test function: $\hat x\hat p\psi=-i\hbar\,x\psi'$, while $\hat p\hat x\psi=-i\hbar\,(x\psi)'=-i\hbar(\psi+x\psi')$ by the product rule. The large terms $x\psi'$ cancel and $\psi$ is left: $[\hat x,\hat p]\psi=i\hbar\psi$. The momentum operator (qm-2.8) is a derivative and $\hat x$ a multiplication, so the commutator is nothing but the product rule — and it holds for *every* function, which is why it is an operator identity rather than a property of a state.`,
      caption: String.raw`Top: a wave function — **draw your own** by dragging across the panel, or pick a preset; the boost $k$ multiplies it by $e^{ikx}$ (colour = phase). Bottom (real parts, $\hbar=1$): $\tfrac1i\hat x\hat p\psi=-x\psi'$ (orange) and $\tfrac1i\hat p\hat x\psi=-(x\psi)'$ (purple) are large and wiggly, but their difference (green) lands on $\psi$ itself (dashed), whatever you draw. Derivatives are fourth-order finite differences; the readout reports the residual, which shrinks with the grid spacing and grows only at kinks you draw.`,
      deps: ['qm-5.3', 'qm-2.8'],
      refs: ['Griffiths §3.5', 'Sakurai ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Canonical_commutation_relation' },
      tags: ['commutator', 'canonical commutation relation', 'momentum operator'],
      viz(v) {
        const G = grid(-5, 5, 801), x = G.x, n = G.n, dx = G.dx;
        const PRE = {
          gauss: (X) => Math.exp(-X * X / 1.2),
          two: (X) => Math.exp(-((X + 1.6) ** 2) / 0.5) - 0.7 * Math.exp(-((X - 1.4) ** 2) / 0.9),
          osc: (X) => { const h = X * (8 * X * X - 12); return 0.12 * h * Math.exp(-X * X / 2); },
          tent: (X) => Math.max(0, 1 - Math.abs(X + 0.5) / 2) * (1 + 0.3 * Math.sin(4 * X)),
        };
        let y = Float64Array.from(x, PRE.two), last = null;
        const pre = v.select('preset', [{ value: 'gauss', label: 'Gaussian' }, { value: 'two', label: 'two bumps' }, { value: 'osc', label: '$\\psi_3$-like' }, { value: 'tent', label: 'kinked tent' }], 'two', { onChange: (p) => { y = Float64Array.from(x, PRE[p]); } });
        const kk = v.slider('boost $k$: multiply by $e^{ikx}$', -4, 4, 0, { step: 0.05 });
        const ST = v.stage({ x: [-5, 5], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 230, full: true, xlabel: null, ylabel: 'ψ (draw here)' });
        const SB = v.stage({ x: [-5, 5], y: [-6, 6], axes: 'box', gutter: true, height: 270, full: true, xlabel: 'x', ylabel: 'real parts' });
        const smooth = (a, b) => { for (let pass = 0; pass < 2; pass++) { const c = Float64Array.from(y); for (let i = Math.max(1, a); i <= Math.min(n - 2, b); i++) c[i] = (y[i - 1] + 2 * y[i] + y[i + 1]) / 4; y = c; } };
        ST.onDrag((X, Y, ph) => {
          const i = Math.round((X - x[0]) / dx); if (i < 0 || i >= n) return;
          const val = Math.max(-1.2, Math.min(1.2, Y));
          if (ph === 'start' || last == null) { y[i] = val; last = [i, val]; return; }
          const [i0, v0] = last, s = Math.sign(i - i0) || 1;
          for (let j = i0; j !== i + s; j += s) y[j] = v0 + ((val - v0) * (j - i0)) / ((i - i0) || 1);
          last = ph === 'end' ? null : [i, val];
          smooth(Math.min(i0, i) - 3, Math.max(i0, i) + 3);
          v.invalidate();
        });
        const d4 = (f) => { const d = new Float64Array(n); for (let i = 2; i < n - 2; i++) d[i] = (f[i - 2] - 8 * f[i - 1] + 8 * f[i + 1] - f[i + 2]) / (12 * dx); return d; };
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), k = kk.value;
          const re = Float64Array.from(y, (a, i) => a * Math.cos(k * x[i])), im = Float64Array.from(y, (a, i) => a * Math.sin(k * x[i]));
          if (Math.abs(k) < 1e-9) drawReal(ST, x, y, { col, alpha: 0.5 }); else drawPsi(ST, x, re, im, { col, mode: 'abs' });
          ST.corner('drag to draw ψ', 'tr', { color: 'muted', size: 11 });
          // (1/i) x p ψ = −x ψ',  (1/i) p x ψ = −(x ψ)'
          const dre = d4(re), dim = d4(im), xr = Float64Array.from(re, (a, i) => a * x[i]), xi = Float64Array.from(im, (a, i) => a * x[i]), dxr = d4(xr), dxi = d4(xi);
          const A = Float64Array.from(x, (X, i) => -X * dre[i]), B = Float64Array.from(x, (X, i) => -dxr[i]), D = Float64Array.from(A, (a, i) => a - B[i]);
          let err = 0, big = 0, mx = 0;
          for (let i = 3; i < n - 3; i++) {
            const Ai = [-x[i] * dre[i], -x[i] * dim[i]], Bi = [-dxr[i], -dxi[i]], Di = csub(Ai, Bi);
            err = Math.max(err, Math.hypot(Di[0] - re[i], Di[1] - im[i])); big = Math.max(big, cabs(Ai)); mx = Math.max(mx, Math.hypot(re[i], im[i]));
          }
          const top = Math.max(1.5, Math.min(40, 1.1 * Math.max(...A.slice(2, n - 2).map(Math.abs), ...B.slice(2, n - 2).map(Math.abs))));
          SB.setView([-5, 5], [-top, top]);
          SB.hline(0, { color: 'faint' });
          SB.path(Array.from(x, (X, i) => [X, A[i]]).slice(2, n - 2), { color: 'orange', width: 1.6 });
          SB.path(Array.from(x, (X, i) => [X, B[i]]).slice(2, n - 2), { color: 'purple', width: 1.6 });
          SB.path(Array.from(x, (X, i) => [X, D[i]]).slice(2, n - 2), { color: 'green', width: 3.2 });
          SB.path(Array.from(x, (X, i) => [X, re[i]]), { color: 'ink', width: 1.4, dash: [5, 4] });
          st = { err, big, mx };
        });
        v.legend([['orange', '$\\frac1i\\,\\hat x\\hat p\\psi=-x\\psi\'$'], ['purple', '$\\frac1i\\,\\hat p\\hat x\\psi=-(x\\psi)\'$'], ['green', 'difference $\\frac1i[\\hat x,\\hat p]\\psi$'], ['ink', '$\\psi$', { dash: true }]]);
        v.readout(() => st && `Largest $|\\hat x\\hat p\\psi| = ${v.fix(st.big, 2)}$, yet $\\max_x\\big|[\\hat x,\\hat p]\\psi - i\\psi\\big| = ${v.sci(Math.max(st.err, 1e-16), 1)}$ ($${v.sci(Math.max(st.err, 1e-16) / (st.mx || 1), 1)}$ of $\\max|\\psi|$; finite differences, $\\Delta x = ${v.fix(dx, 4)}$). The commutator is $i\\hbar$ times the identity.`);
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Theorem',
      name: 'Robertson uncertainty relation',
      statement: String.raw`For any two observables $A,B$ and any unit state $\psi$ in the domains of $AB$ and $BA$,
$$\Delta A\,\Delta B\;\ge\;\tfrac12\,\big|\langle\psi|[A,B]|\psi\rangle\big|,$$
where $\Delta A=\norm{(A-\langle A\rangle)\psi}$. For $A=\hat x$, $B=\hat p$ this is Heisenberg's $\Delta x\,\Delta p\ge\hbar/2$ (qm-2.11). Schrödinger's sharper form adds the covariance: $(\Delta A)^2(\Delta B)^2\ge\big(\tfrac12\langle\{A-\langle A\rangle,B-\langle B\rangle\}\rangle\big)^2+\big(\tfrac1{2}|\langle[A,B]\rangle|\big)^2$. The bound depends on the state: for non-commuting spin components it vanishes on some states, and equality holds only when $(A-\langle A\rangle)\psi$ and $(B-\langle B\rangle)\psi$ are parallel.`,
      idea: String.raw`Put $f=(A-\langle A\rangle)\psi$ and $g=(B-\langle B\rangle)\psi$. Cauchy–Schwarz (ladr-6.14) gives $\norm f^2\norm g^2\ge|\langle f|g\rangle|^2\ge(\mathrm{Im}\langle f|g\rangle)^2$, and since $A,B$ are Hermitian, $\langle f|g\rangle-\langle g|f\rangle=\langle\psi|[A,B]|\psi\rangle$, so $\mathrm{Im}\langle f|g\rangle=\tfrac1{2i}\langle[A,B]\rangle$. Keeping the real part too gives Schrödinger's version. Equality needs $g$ to be a multiple of $f$ — a strong condition that singles out special states.`,
      caption: String.raw`**Drag the state** on the Bloch sphere (for spin 1 it is the spin coherent state pointing there). The observables are spin components $A=\mathbf a\cdot\mathbf S$ (orange axis) and $B=\mathbf b\cdot\mathbf S$ (purple), with the angle between the axes on the slider. Right: each grey dot is a random state of the chosen spin (Haar-random in $\C^2$ or $\C^3$) plotted at $(\tfrac12|\langle[A,B]\rangle|,\ \Delta A\Delta B)$ — all lie on or above the diagonal; the gold dot is your state. Green on the sphere: the directions where the bound is tight — where the covariance $\tfrac12\langle\{A,B\}\rangle-\langle A\rangle\langle B\rangle\propto\mathbf a\cdot\mathbf b-(\mathbf a\cdot\mathbf r)(\mathbf b\cdot\mathbf r)$ of the (coherent) state vanishes. Align the axes and $[A,B]=0$: the bound collapses to 0.`,
      deps: ['qm-5.9', 'ladr-6.14', 'qm-2.11'],
      refs: ['Griffiths §3.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Uncertainty_principle#Robertson%E2%80%93Schr%C3%B6dinger_uncertainty_relations' },
      tags: ['uncertainty principle', 'commutator', 'spin'],
      viz(v) {
        const M = v.M;
        const spin = v.select('spin', [{ value: 0.5, label: 'spin ½' }, { value: 1, label: 'spin 1' }], 0.5);
        const ang = v.slider('angle between the axes $\\mathbf a$ and $\\mathbf b$', 0, Math.PI, Math.PI / 2, { step: 0.01 });
        const SB = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 340, weight: 1, title: 'state on the sphere' });
        const SR = v.stage({ x: [0, 0.6], y: [0, 0.6], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: '½|⟨[A,B]⟩|', ylabel: 'ΔA·ΔB', title: 'random states never go below the diagonal' });
        const sc = v.scene3(SB, { axes: false, yaw: -0.65, pitch: 0.33 });
        const hs = sc.handle(vnormalize([[0.45, 0], [0.55, 0], [0.7, 0]]).map((z) => z[0]), { color: 'gold', snap: (p) => { const r = Math.hypot(...p) || 1; return p.map((c) => c / r); } });
        const rng = v.rng(21), R2 = Array.from({ length: 500 }, () => randState(rng, 2)), R3 = Array.from({ length: 500 }, () => randState(rng, 3));
        let st = null;
        v.render(() => {
          const s = +spin.value, S = spinOps(s), a = [0, 0, 1], b = [Math.sin(ang.value), 0, Math.cos(ang.value)];
          const A = spinAlong(S, a), B = spinAlong(S, b), Cm = comm(A, B);
          const stat = (psi) => { const sa = spread(A, psi), sb = spread(B, psi); return [cabs(expect(Cm, psi)) / 2, sa.d * sb.d, sa, sb]; };
          const pts = (s === 0.5 ? R2 : R3).map((p) => stat(p));
          const psi = s === 0.5 ? stateOf(hs.p) : spinCoherent(S, hs.p), [bd, pr, sa, sb] = stat(psi);
          const top = s === 0.5 ? 0.3 : 1.05;
          SR.setView([0, top], [0, top]);
          SR.between((x) => x, () => 0, 0, top, { fill: 'red', fillAlpha: 0.08 });
          SR.text('forbidden', top * 0.62, top * 0.18, { color: 'red', size: 11, align: 'center' });
          SR.line(0, 0, top, top, { color: 'ink', width: 1.4 });
          SR.dots(pts.map((q) => [q[0], q[1]]), { r: 2, color: 'muted' });
          SR.dot(bd, pr, { r: 6.5, color: 'gold' });
          // sphere: axes, tight locus, state
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc, { labels: false });
          const ab = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
          // tight set: (1 − α²)(1 − β²) − ((a×b)·r)² = (a·b − αβ)² = 0, located as sign changes of a·b − αβ on a (θ, φ) grid
          const ab0 = M.dot(a, b), F = (r) => ab0 - M.dot(a, r) * M.dot(b, r), NT = 90, NP = 180, P3 = (i, j) => { const th = (Math.PI * i) / NT, ph = (TAU * j) / NP; return [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]; };
          const lerpS = (p, q, fp, fq) => { const t = fp / (fp - fq), m = p.map((c, k) => c + t * (q[k] - c)), l = Math.hypot(...m) || 1; return m.map((c) => c / l); };
          for (let i = 0; i <= NT; i++) for (let j = 0; j < NP; j++) {
            const p = P3(i, j), fp = F(p), q = P3(i, j + 1), fq = F(q);
            if (fp * fq < 0) sc.dot(lerpS(p, q, fp, fq), { r: 1.7, color: 'green', top: false });
            if (i < NT) { const w = P3(i + 1, j), fw = F(w); if (fp * fw < 0) sc.dot(lerpS(p, w, fp, fw), { r: 1.7, color: 'green', top: false }); }
          }
          sc.arrow([0, 0, 0], a.map((c) => c * 1.3), { color: 'orange', width: 2 }); sc.tex('\\mathbf a', a.map((c) => c * 1.45), { color: 'orange' });
          sc.arrow([0, 0, 0], b.map((c) => c * 1.3), { color: 'purple', width: 2 }); sc.tex('\\mathbf b', b.map((c) => c * 1.45), { color: 'purple' });
          sc.arrow([0, 0, 0], hs.p, { color: 'gold', width: 2.6 });
          sc.flush();
          let minGap = Infinity; for (const q of pts) minGap = Math.min(minGap, q[1] - q[0]);
          st = { bd, pr, sa, sb, minGap, s, tight: Math.abs(pr - bd) < 1e-3 * Math.max(1e-9, pr) || pr - bd < 2e-3 };
        });
        v.legend([['gold', 'your state', { dot: true }], ['muted', 'random states', { dot: true }], ['green', 'directions where the bound is tight', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `Spin ${st.s === 0.5 ? '½' : '1'}: $\\Delta A = ${v.fix(st.sa.d, 4)}$, $\\Delta B = ${v.fix(st.sb.d, 4)}$, $\\Delta A\\,\\Delta B = ${v.fix(st.pr, 4)}\\;\\ge\\;\\tfrac12|\\langle[A,B]\\rangle| = ${v.fix(st.bd, 4)}$${st.tight ? ' — **tight** here' : ''}. ` +
            `Over 500 random states the smallest $\\Delta A\\Delta B-\\tfrac12|\\langle[A,B]\\rangle|$ is $${v.sci(st.minGap, 2)}$ (never negative beyond rounding).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Theorem',
      name: 'Energy–time uncertainty',
      statement: String.raw`Let $\psi(t)$ evolve under a time-independent Hamiltonian with energy spread $\Delta E$, and let $Q$ be any observable without explicit time dependence. Then
$$\Delta E\;\tau_Q\;\ge\;\frac\hbar2,\qquad \tau_Q=\frac{\Delta Q}{|d\langle Q\rangle/dt|},$$
the time for $\langle Q\rangle$ to change by one standard deviation (**Mandelstam–Tamm**). Choosing $Q=|\psi(0)\rangle\langle\psi(0)|$ gives the survival probability $P(t)=|\langle\psi(0)|\psi(t)\rangle|^2\ge\cos^2(\Delta E\,t/\hbar)$ for $0\le t\le\pi\hbar/2\Delta E$, so no state can become orthogonal to itself in less than $\pi\hbar/2\Delta E$. Time is not an operator here: $\Delta t$ means a characteristic time of evolution, not the spread of a measured value.`,
      idea: String.raw`Ehrenfest's theorem (qm-2.9) gives $\tfrac{d}{dt}\langle Q\rangle=\tfrac i\hbar\langle[H,Q]\rangle$, and Robertson's relation (5.10) with $A=H$, $B=Q$ bounds $|\langle[H,Q]\rangle|\le2\Delta E\,\Delta Q$; dividing gives $\Delta E\,\tau_Q\ge\hbar/2$. For the projector onto the initial state, $\langle Q\rangle=P$ and $\Delta Q=\sqrt{P(1-P)}$, so $|\dot P|\le\tfrac{2\Delta E}\hbar\sqrt{P(1-P)}$; integrating this differential inequality gives the cosine-squared bound. An equal-weight two-level superposition saturates it exactly.`,
      caption: String.raw`Top: the energy distribution $|c_n|^2$ of the prepared state (spread $\Delta E$ shaded). Bottom left: the survival probability $P(t)=|\sum_n|c_n|^2e^{-iE_nt}|^2$ (accent) never dips below the Mandelstam–Tamm curve $\cos^2(\Delta E\,t)$ (red, until it reaches 0 at $t=\pi/2\Delta E$). Bottom right: $\Delta E\cdot\tau_Q(t)$ for $Q=|\psi(0)\rangle\langle\psi(0)|$, which stays above $\tfrac12$. **Switch spectra and slide the spread**: the two-level state touches both bounds; broad spectra decay faster but always respect them. Units $\hbar=1$.`,
      deps: ['qm-5.10', 'qm-2.9'],
      refs: ['Griffiths §3.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Energy%E2%80%93time_uncertainty_principle' },
      tags: ['energy-time uncertainty', 'Mandelstam–Tamm', 'quantum speed limit'],
      viz(v) {
        const kind = v.select('spectrum', [{ value: 'two', label: 'two levels' }, { value: 'gauss', label: 'Gaussian band' }, { value: 'flat', label: 'flat band' }, { value: 'rnd', label: 'random levels' }], 'gauss');
        const wsl = v.slider('spread (two levels: weight of the upper level)', 0.05, 1, 0.5, { step: 0.01 });
        const SS = v.stage({ x: [-0.5, 10.5], y: [0, 0.6], axes: 'box', gutter: true, height: 150, full: true, xlabel: 'energy E', ylabel: '|cₙ|²' });
        const SP = v.stage({ x: [0, 6], y: [0, 1.05], axes: 'box', gutter: true, height: 280, xlabel: 't', ylabel: 'survival probability', title: '$P(t)\\ge\\cos^2(\\Delta E\\,t)$' });
        const ST = v.stage({ x: [0, 6], y: [0, 3], axes: 'box', gutter: true, height: 280, xlabel: 't', ylabel: 'ΔE·τ_Q', title: '$\\Delta E\\,\\tau_Q\\ge\\frac12$' });
        let st = null;
        v.render(() => {
          const w = wsl.value; let E = [], p = [];
          if (kind.value === 'two') { E = [3, 7]; p = [1 - w, w]; }
          else if (kind.value === 'gauss') { for (let k = 0; k <= 40; k++) { E.push(k / 4); p.push(Math.exp(-((k / 4 - 5) ** 2) / (2 * (0.25 + 2.5 * w) ** 2))); } }
          else if (kind.value === 'flat') { const hw = 0.5 + 4.5 * w; for (let k = 0; k <= 40; k++) { E.push(k / 4); p.push(Math.abs(k / 4 - 5) <= hw ? 1 : 0); } }
          else { const r = v.rng(9); for (let k = 0; k < 14; k++) { E.push(5 + (r() - 0.5) * 10 * w); p.push(r()); } }
          const Z = p.reduce((a, b) => a + b, 0); p = p.map((q) => q / Z);
          const mE = p.reduce((s, q, k) => s + q * E[k], 0), dE = Math.sqrt(Math.max(1e-12, p.reduce((s, q, k) => s + q * (E[k] - mE) ** 2, 0)));
          // spectrum
          SS.vband(mE - dE, mE + dE, { color: 'accent', alpha: 0.1 });
          const pm = Math.max(...p); SS.setView([-0.5, 10.5], [0, pm * 1.25]);
          E.forEach((e, k) => SS.line(e, 0, e, p[k], { color: 'accent', width: kind.value === 'two' ? 5 : 3 }));
          SS.text(`ΔE = ${v.fix(dE, 3)}`, mE + dE, pm * 1.12, { size: 11, color: 'accent', dx: 6 });
          // survival
          const T = Math.max(1.2, Math.min(40, 3 * Math.PI / (2 * dE)));
          SP.setView([0, T], [0, 1.05]); ST.setView([0, T], [0, 3]);
          const surv = (t) => { let a = 0, b = 0; for (let k = 0; k < E.length; k++) { a += p[k] * Math.cos(E[k] * t); b -= p[k] * Math.sin(E[k] * t); } return [a, b]; };
          const tau = (t) => { const [a, b] = surv(t); let da = 0, db = 0; for (let k = 0; k < E.length; k++) { da -= p[k] * E[k] * Math.sin(E[k] * t); db -= p[k] * E[k] * Math.cos(E[k] * t); } const P = a * a + b * b, dP = 2 * (a * da + b * db); return Math.sqrt(Math.max(0, P * (1 - P))) / Math.max(1e-12, Math.abs(dP)); };
          const tb = Math.PI / (2 * dE);
          SP.fn((t) => (t < tb ? Math.cos(dE * t) ** 2 : 0), { color: 'red', width: 2, dash: [6, 4], n: 400 });
          SP.fn((t) => cabs2(surv(t)), { color: 'accent', width: 2.2, n: 800 });
          SP.vline(tb, { color: 'red', alpha: 0.5, dash: [2, 3] }); SP.text('π/2ΔE', tb, 0.98, { dx: 4, size: 10.5, color: 'red' });
          ST.hline(0.5, { color: 'red', width: 2, dash: [6, 4] });
          ST.fn((t) => Math.min(5, dE * tau(t)), { color: 'accent', width: 2, n: 800 });
          // checks on a fine time grid
          let minR = Infinity, minT = Infinity, tHalf = null;
          for (let i = 1; i <= 3000; i++) { const t = (T * i) / 3000, P = cabs2(surv(t)); if (t < tb) minR = Math.min(minR, P - Math.cos(dE * t) ** 2); minT = Math.min(minT, dE * tau(t)); if (tHalf == null && P <= 0.5) tHalf = t; }
          st = { dE, minR, minT, tHalf, tb };
        });
        v.legend([['accent', 'computed'], ['red', 'Mandelstam–Tamm bound', { dash: true }]]);
        v.readout(() => st && `$\\Delta E = ${v.fix(st.dE, 4)}$. Smallest $P(t)-\\cos^2(\\Delta E\\,t)$ before $\\pi/2\\Delta E$: $${v.sci(st.minR, 1)}$ (≥ 0 up to rounding). Smallest $\\Delta E\\,\\tau_Q$: $${v.fix(st.minT, 4)}\\ge0.5$. ${st.tHalf != null ? `$P$ first falls to ½ at $t = ${v.fix(st.tHalf, 3)}$, never before $\\pi/4\\Delta E = ${v.fix(st.tb / 2, 3)}$.` : 'P never falls to ½ in this window.'}`);
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Theorem',
      name: 'Compatible observables share eigenbases',
      statement: String.raw`Two observables $A,B$ on a finite-dimensional space **commute**, $[A,B]=0$, if and only if there is an orthonormal basis of common eigenvectors. Then they are **compatible**: measuring $A$, then $B$, then $A$ again returns the first value of $A$ with certainty, and the joint outcome $(a,b)$ has probability $\norm{P^A_aP^B_b\psi}^2$ independent of the order. If $A$ has a degenerate eigenvalue, its eigenbasis is not unique, and $B$ selects the shared basis inside each eigenspace; a **complete set of commuting observables** is one whose joint eigenvalues label a basis uniquely. For unbounded operators "commute" means their spectral projections commute.`,
      idea: String.raw`If $AB=BA$ and $Av=av$, then $A(Bv)=B(Av)=a\,Bv$: $B$ maps each eigenspace of $A$ into itself, and the restriction of $B$ there is still Hermitian, so it can be diagonalized inside it (ladr-5.76). Collecting these bases over all eigenvalues of $A$ gives a common eigenbasis; the converse is immediate because diagonal matrices commute. Perturb $B$ by a non-commuting term and the restriction argument breaks: the eigenbases rotate apart by an amount proportional to the perturbation.`,
      caption: String.raw`Real symmetric $3\times3$ observables drawn in $\R^3$ (drag the background to rotate): the blue lines are the eigen-axes of $A$ (a blue disc marks a degenerate eigen*plane*), the orange lines those of $B=B_0+\varepsilon K$, where $B_0$ commutes with $A$ and $K$ is a fixed random symmetric matrix. At $\varepsilon=0$ every orange axis lies along a blue one (or inside the blue plane); **raise $\varepsilon$** and the frames split. The middle panel shows $[A,B]$ entry by entry; the bottom plot follows $\norm{[A,B]}$ and the defect $\max_k\norm{Av_k-\langle v_k|A|v_k\rangle v_k}$ of $B$'s eigenvectors $v_k$ as functions of $\varepsilon$. **Degenerate $A$**: $A$'s own eigenvectors in the plane are arbitrary, but $B$'s still diagonalize $A$.`,
      deps: ['qm-5.9', 'ladr-5.76', 'qm-5.4'],
      refs: ['Sakurai ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Complete_set_of_commuting_observables' },
      tags: ['commuting observables', 'simultaneous diagonalization', 'compatibility'],
      viz(v) {
        const M = v.M;
        const eps = v.slider('non-commuting part $\\varepsilon$', 0, 1, 0, { step: 0.01 });
        const deg = v.toggle('$A$ degenerate', false);
        const S3 = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 330, weight: 1.15, title: 'eigen-axes in $\\mathbb R^3$' });
        const SC = v.stage({ x: [-0.7, 3.3], y: [-0.5, 3.45], equal: true, axes: false, height: 330, weight: 0.85, title: 'the commutator $[A,B]$' });
        const SE = v.stage({ x: [0, 1], y: [0, 1.6], axes: 'box', gutter: true, height: 180, full: true, xlabel: 'ε', ylabel: 'size' });
        const sc = v.scene3(S3, { yaw: -0.7, pitch: 0.35, axis: 1.35, lim: 1.4 });
        const r = v.rng(31), Rq = M.qr([[r.normal(), r.normal(), r.normal()], [r.normal(), r.normal(), r.normal()], [r.normal(), r.normal(), r.normal()]]).Q;
        const Kr = (() => { const G = [[0, 0, 0], [0, 0, 0], [0, 0, 0]].map((row) => row.map(() => r.normal())); return G.map((row, i) => row.map((x, j) => (x + G[j][i]) / 2)); })();
        const build = (e, dg) => {
          const Ra = Rq, D = (d) => Ra.map((row, i) => row.map((_, j) => d.reduce((s, dk, k) => s + Ra[i][k] * dk * Ra[j][k], 0)));
          const A = D(dg ? [-1, 0.7, 0.7] : [-1, 0.3, 1.1]), B0 = D([0.9, -0.8, 0.2]);
          return { A, B: B0.map((row, i) => row.map((x, j) => x + e * Kr[i][j])) };
        };
        const defect = (A, B) => { const E = M.eigSym(B); let d = 0; for (const w of E.vecs) { const Aw = M.matVec(A, w), m = M.dot(w, Aw); d = Math.max(d, M.norm(M.vsub(Aw, M.vscale(w, m)))); } return d; };
        const cnorm = (A, B) => { const C = M.matMul(A, B).map((row, i) => row.map((x, j) => x - M.matMul(B, A)[i][j])); return Math.sqrt(C.flat().reduce((s, x) => s + x * x, 0)); };
        let st = null;
        v.render(() => {
          const { A, B } = build(eps.value, deg.value), EA = M.eigSym(A), EB = M.eigSym(B);
          sc.begin();
          // A: axes, or a disc for a degenerate pair
          const vals = EA.values, groups = [];
          vals.forEach((l, k) => { const g = groups.find((G) => Math.abs(G.l - l) < 1e-6); if (g) g.k.push(k); else groups.push({ l, k: [k] }); });
          for (const g of groups) {
            if (g.k.length === 2) { const a = EA.vecs[g.k[0]], b = EA.vecs[g.k[1]]; sc.disc(a, b, 1.15, { fill: 'accent', fillAlpha: 0.12, color: 'accent', grid: true }); }
            else { const w = EA.vecs[g.k[0]]; sc.line(w.map((c) => -1.3 * c), w.map((c) => 1.3 * c), { color: 'accent', width: 3.2 }, 12); }
          }
          for (const w of EB.vecs) { sc.line(w.map((c) => -1.15 * c), w.map((c) => 1.15 * c), { color: 'orange', width: 1.8 }, 12); sc.dot(w.map((c) => 1.15 * c), { r: 3.5, color: 'orange' }); sc.dot(w.map((c) => -1.15 * c), { r: 3.5, color: 'orange' }); }
          sc.flush();
          // commutator cells
          const C = cplx(M.matMul(A, B).map((row, i) => row.map((x, j) => x - M.matMul(B, A)[i][j])));
          cells(v, SC, C, [0, 0, 3, 3], { max: 0.6, text: (z) => v.fix(z[0], 3), size: 10.5 });
          // curves
          const es = Array.from({ length: 51 }, (_, i) => i / 50);
          SE.path(es.map((e) => { const q = build(e, deg.value); return [e, cnorm(q.A, q.B)]; }), { color: 'purple', width: 2 });
          SE.path(es.map((e) => { const q = build(e, deg.value); return [e, defect(q.A, q.B)]; }), { color: 'orange', width: 2 });
          const cn = cnorm(A, B), df = defect(A, B);
          SE.dot(eps.value, cn, { r: 5, color: 'purple' }); SE.dot(eps.value, df, { r: 5, color: 'orange' });
          st = { cn, df, deg: deg.value };
        });
        v.legend([['accent', 'eigen-axes (or eigenplane) of $A$'], ['orange', 'eigen-axes of $B$; defect of $B$\'s eigenvectors'], ['purple', '$\\|[A,B]\\|$']]);
        v.readout(() => st && `$\\|[A,B]\\| = ${v.sci(Math.max(st.cn, 1e-17), 2)}$; $B$'s eigenvectors fail to be eigenvectors of $A$ by $${v.sci(Math.max(st.df, 1e-17), 2)}$. ${st.cn < 1e-9 ? `**Compatible:** one orthonormal basis diagonalizes both${st.deg ? ' — inside $A$\'s degenerate plane it is $B$ that picks it' : ''}.` : 'Not compatible: no common eigenbasis, so measuring $B$ disturbs the value of $A$.'}`);
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Theorem',
      name: 'No finite matrices satisfy [x, p] = iħ',
      statement: String.raw`There are no $N\times N$ matrices $X,P$ (any $N\ge1$) with $XP-PX=i\hbar I$. More generally, no bounded operators on a Hilbert space satisfy $[X,P]=i\hbar I$ (Wintner–Wielandt), so position and momentum must be unbounded and live on an infinite-dimensional space. Quantitatively, for any $N\times N$ matrices $\norm{[X,P]-i\hbar I}_F\ge\hbar\sqrt N$ in the Frobenius norm — no better than the commuting choice $[X,P]=0$.`,
      idea: String.raw`Take traces: $\mathrm{tr}(XP)=\mathrm{tr}(PX)$ (ladr-8.49), so $\mathrm{tr}[X,P]=0$, while $\mathrm{tr}(i\hbar I)=i\hbar N\neq0$. Cauchy–Schwarz for the Frobenius inner product turns the trace mismatch into the norm bound: $\hbar N=|\mathrm{tr}([X,P]-i\hbar I)|\le\sqrt N\,\norm{[X,P]-i\hbar I}_F$. Truncating the oscillator's infinite matrices $x=(a+a^\dagger)/\sqrt2$, $p=i(a^\dagger-a)/\sqrt2$ shows how the infinite case escapes: the commutator is $i$ on the diagonal except in the last entry, $-i(N-1)$, which pays the whole trace — and slides off to infinity as $N$ grows.`,
      caption: String.raw`Left: the commutator $[X,P]$ of the oscillator's position and momentum matrices truncated to the first $N$ levels ($\hbar=1$), entry by entry (colour = phase: pink is $+i$, green is $-i$). **Raise $N$**: the diagonal is $i,i,\dots,i$ — exactly the canonical relation — except the bottom corner, which grows as $-i(N-1)$. Right: the imaginary parts of the diagonal entries as bars, and their running sum (the partial trace) which always returns to 0 at the end. Toggle **random Hermitian $X,P$**: the entries become arbitrary, but the trace is still exactly 0.`,
      deps: ['qm-5.9', 'ladr-8.49', 'qm-4.2'],
      refs: ['Hall ch. 14'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Canonical_commutation_relation#Uniqueness_of_canonical_commutation_relations' },
      tags: ['canonical commutation relation', 'trace', 'unbounded operators'],
      viz(v) {
        const NN = v.slider('truncation $N$', 2, 12, 6, { int: true });
        const rnd = v.toggle('random Hermitian $X,P$', false);
        let seed = 1; v.button('resample', () => { seed++; });
        const SC = v.stage({ x: [-0.6, 6.2], y: [-0.4, 6.45], equal: true, axes: false, height: 340, weight: 1, title: '$[X,P]$ for $N\\times N$ matrices' });
        const SD = v.stage({ x: [-0.6, 12.6], y: [-12, 2], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'diagonal index k', ylabel: 'Im [X,P]ₖₖ', title: 'the trace must vanish' });
        let st = null;
        v.render(() => {
          const N = NN.value;
          let X, P;
          if (rnd.value) { const r = v.rng(seed * 101 + N); X = randHerm(r, N, 0.8); P = randHerm(r, N, 0.8); } else { X = cplx(oscX(N)); P = oscP(N); }
          const Cm = comm(X, P), u = 6 / N;
          cells(v, SC, Cm, [0, 0, 6, 6], { max: rnd.value ? maxAbs(Cm) : Math.max(1, N - 1), minR: 0.3, text: N <= 8 ? (z) => texC(v, z, rnd.value ? 1 : 0).replace(/-/g, '−') : null, size: Math.max(8, 13 - N * 0.5) });
          // diagonal bars and running trace
          const d = Cm.map((row, k) => row[k][1]); let run = 0; const runs = [];
          const lo = Math.min(-1.5, ...d) * 1.15, hi = Math.max(2, ...d) * 1.2;
          SD.setView([-0.6, N - 0.4], [lo, hi]);
          SD.hline(0, { color: 'muted' }); SD.hline(1, { color: 'green', dash: [5, 4], width: 1.3 });
          SD.text('iħ: target', N - 0.5, 1, { align: 'right', dy: -10, size: 10.5, color: 'green' });
          d.forEach((y, k) => { SD.rect(k - 0.32, Math.min(0, y), k + 0.32, Math.max(0, y), { fill: y >= 0 ? 'pink' : 'green', fillAlpha: 0.55, color: y >= 0 ? 'pink' : 'green', width: 1.2 }); run += y; runs.push([k + 0.32, run]); });
          SD.path([[-0.32, 0], ...runs], { color: 'ink', width: 2 }); SD.dots(runs, { r: 3, color: 'ink' });
          const tr = trace(Cm), dist = fnorm(msub(Cm, mscale(eye(N), [0, 1])));
          st = { N, tr, dist, last: d[N - 1], rnd: rnd.value };
        });
        v.legend([['pink', '$+i$ entries', { area: true }], ['green', '$-i$ entries / target $i\\hbar$', { area: true }], ['ink', 'running sum $\\sum_{j\\le k}\\mathrm{Im}[X,P]_{jj}$']]);
        v.readout(() => st && `$N = ${st.N}$: $\\mathrm{tr}[X,P] = ${texC(v, st.tr, 12)}$ but $\\mathrm{tr}(i\\hbar I) = ${st.N}i$. ${st.rnd ? '' : `Last diagonal entry $= ${v.fix(st.last, 3)}i = -(N-1)i$. `}$\\|[X,P]-iI\\|_F = ${v.fix(st.dist, 3)}\\ \\ge\\ \\sqrt N = ${v.fix(Math.sqrt(st.N), 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Theorem',
      name: 'Stone–von Neumann theorem',
      statement: String.raw`Let $U(a)$, $V(b)$ ($a,b\in\R$) be strongly continuous one-parameter unitary groups on a Hilbert space satisfying the **Weyl relation**
$$U(a)V(b)=e^{-i ab/\hbar}\,V(b)U(a).$$
If the pair acts irreducibly (no closed subspace other than $0$ and $\mathcal H$ is invariant under all of them), it is unitarily equivalent to the Schrödinger representation on $L^2(\R)$: translations $U(a)=e^{-ia\hat p/\hbar}$, $(U(a)\psi)(x)=\psi(x-a)$, and phase multiplications $V(b)=e^{ib\hat x/\hbar}$. Without irreducibility the representation is a direct sum of copies of it. Hence any two irreducible realizations of the canonical commutation relations in Weyl form — position space, momentum space, the oscillator's Fock space — differ only by a unitary change of basis. The finite analogue: on $\C^N$, the clock $U=\mathrm{diag}(1,\omega,\dots,\omega^{N-1})$ and shift $V|k\rangle=|k+1\rangle$, $\omega=e^{2\pi i/N}$, satisfy $UV=\omega\,VU$, and every irreducible pair with this relation is unitarily equivalent to them.`,
      idea: String.raw`The exponentiated form sidesteps domain problems of $[x,p]=i\hbar$ (Stone's theorem, fa-13.38, turns each group into a self-adjoint generator). The proof builds the intertwiner explicitly; in finite dimensions it is elementary: the relation makes $V$ shift the eigenvalues of $U$ around the circle ($U(V\varphi)=\omega\lambda V\varphi$ if $U\varphi=\lambda\varphi$), so starting from one eigenvector $e_0$ of $U$ with eigenvalue 1, the vectors $e_k=V^ke_0$ form an orthonormal eigenbasis on which $U$ and $V$ act as clock and shift. The matrix $T$ with columns $e_k$ is the unitary equivalence — and for the momentum representation it is the discrete Fourier transform.`,
      caption: String.raw`**Scrambled pair:** a random unitary $W$ hides the clock-and-shift pair, $U'=WUW^\dagger$, $V'=WVW^\dagger$ (left two arrays: noisy phases). The intertwiner $T$ is then *constructed* from $U'$ and $V'$ alone: find the eigenvector of $U'$ with eigenvalue 1, apply $V'$ repeatedly, and stack the results as columns. Conjugating back, $T^\dagger U'T$ and $T^\dagger V'T$ (right) are exactly the clean clock (phases running around the wheel on the diagonal) and shift (ones below the diagonal). **Momentum representation:** the same construction applied to $U'=V^{-1}$, $V'=U$ — the roles of $x$ and $p$ swapped — returns $T=$ the discrete Fourier matrix. Slide $N$; press *new scramble* for another $W$.`,
      deps: ['qm-5.13', 'fa-13.38'],
      refs: ['Hall ch. 14'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stone%E2%80%93von_Neumann_theorem' },
      tags: ['Weyl relations', 'unitary equivalence', 'Fourier transform'],
      viz(v) {
        const NN = v.slider('dimension $N$', 2, 8, 5, { int: true });
        const mode = v.select('pair', [{ value: 'scr', label: 'scrambled by a random unitary' }, { value: 'mom', label: 'momentum representation ($x\\leftrightarrow p$)' }], 'scr');
        let seed = 4; v.button('new scramble', () => { seed++; });
        const S = v.stage({ x: [0, 26], y: [-2.2, 5.4], equal: true, axes: false, height: 260, full: true });
        let st = null;
        v.render(() => {
          const N = NN.value, w = cis(TAU / N);
          const U = mat(N, N, (i, j) => (i === j ? cis((TAU * i) / N) : 0)), V = mat(N, N, (i, j) => (i === (j + 1) % N ? 1 : 0));
          let Up, Vp, W = null;
          if (mode.value === 'scr') { W = randUnitary(v.rng(seed * 13 + N), N); Up = mmul(mmul(W, U), adj(W)); Vp = mmul(mmul(W, V), adj(W)); }
          else { Up = adj(V); Vp = U; } // momentum picture: translation becomes the clock, the clock becomes a shift
          // construct T: eigenvector of U' with eigenvalue 1, then V'^k
          const E = heig(herm(Up)); // U' is normal; use its Hermitian part's eigenvectors as candidates and pick the one with U'e = e
          let e0 = null, best = Infinity;
          for (const c of E.vectors) { const r = fnorm([mvec(Up, c).map((z, i) => csub(z, c[i]))]); if (r < best) { best = r; e0 = c; } }
          if (best > 1e-6) { const H2 = herm(mscale(Up, cis(0.37))); for (const c of heig(H2).vectors) { const r = fnorm([mvec(Up, c).map((z, i) => csub(z, c[i]))]); if (r < best) { best = r; e0 = c; } } }
          const colsT = [e0]; for (let k = 1; k < N; k++) colsT.push(mvec(Vp, colsT[k - 1]));
          const T = fromCols(colsT), Uc = mmul(mmul(adj(T), Up), T), Vc = mmul(mmul(adj(T), Vp), T);
          // layout: five arrays
          const arrs = [[Up, mode.value === 'scr' ? "$U'=WUW^\\dagger$" : "$U'=V^{-1}$"], [Vp, mode.value === 'scr' ? "$V'=WVW^\\dagger$" : "$V'=U$"], [T, '$T=[e_0\\,|\\,V\'e_0\\,|\\cdots]$'], [Uc, "$T^\\dagger U'T$"], [Vc, "$T^\\dagger V'T$"]];
          const sz = 4.2, gap = 1.0;
          arrs.forEach(([A, lab], k) => {
            const x0 = 0.3 + k * (sz + gap);
            cells(v, S, A, [x0, 0, x0 + sz, sz], { max: k === 2 ? Math.max(...T.flat().map(cabs)) : 1, minR: 0.4 });
            S.text(lab, x0 + sz / 2, -0.55, { align: 'center', size: 13, baseline: 'top' });
            if (k === 2) S.rect(x0 - 0.08, -0.08, x0 + sz + 0.08, sz + 0.08, { color: 'gold', width: 2, radius: 4 });
            if (k === 3) S.text('→', x0 - gap / 2, sz / 2, { align: 'center', size: 18, color: 'muted' });
          });
          S.text('found from U′, V′ alone', 0.3 + 2 * (sz + gap) + sz / 2, sz + 0.45, { align: 'center', size: 11, color: 'gold' });
          let fourier = null;
          if (mode.value === 'mom') { const F = mat(N, N, (j, k) => cscale(cis((TAU * j * k) / N), 1 / Math.sqrt(N))); const ph = cscale(cconj(T[0][0]), 1 / cabs(T[0][0])); fourier = fnorm(msub(mscale(T, ph), F)); }
          let wErr = null; if (W) { const ov = ip(cols(W)[0], cols(T)[0]), ph = cscale(cconj(ov), 1 / cabs(ov)); wErr = fnorm(msub(mscale(T, cconj(ph)), W)); }
          st = { N, weyl: fnorm(msub(mmul(Up, Vp), mscale(mmul(Vp, Up), w))), eU: fnorm(msub(Uc, U)), eV: fnorm(msub(Vc, V)), unit: fnorm(msub(mmul(adj(T), T), eye(N))), fourier, wErr };
        });
        v.readout(() => st && `Weyl relation for the given pair: $\\|U'V'-\\omega V'U'\\| = ${v.sci(Math.max(st.weyl, 1e-17), 1)}$ with $\\omega = e^{2\\pi i/${st.N}}$. Constructed $T$: $\\|T^\\dagger T-I\\| = ${v.sci(Math.max(st.unit, 1e-17), 1)}$ (unitary), $\\|T^\\dagger U'T-U\\| = ${v.sci(Math.max(st.eU, 1e-17), 1)}$, $\\|T^\\dagger V'T-V\\| = ${v.sci(Math.max(st.eV, 1e-17), 1)}$. ` +
          (st.fourier != null ? `$T$ equals the discrete Fourier matrix $F_{jk}=e^{2\\pi ijk/N}/\\sqrt N$ up to one overall phase (difference $${v.sci(Math.max(st.fourier, 1e-17), 1)}$).` : `$T$ recovers the hidden $W$ up to one overall phase (difference $${v.sci(Math.max(st.wErr, 1e-17), 1)}$).`));
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Postulate',
      name: 'Unitary time evolution',
      statement: String.raw`The state of an isolated system evolves by a strongly continuous **one-parameter unitary group**: $\psi(t)=U(t)\psi(0)$ with
$$U(t)=e^{-iHt/\hbar},\qquad U(s)U(t)=U(s+t),\quad U(0)=I,\quad U(t)^\dagger=U(t)^{-1}=U(-t),$$
where the generator $H$ is the self-adjoint Hamiltonian; differentiating gives the Schrödinger equation $i\hbar\,\dot\psi=H\psi$ (qm-2.4). Conversely, by Stone's theorem every such group has a unique self-adjoint generator. Unitarity means all inner products are conserved, $\langle U\varphi|U\psi\rangle=\langle\varphi|\psi\rangle$: the configuration of all states moves rigidly, probabilities are conserved, and evolution is reversible.`,
      scope: String.raw`For closed systems. An open system (one exchanging energy or information with an environment it does not track) evolves non-unitarily — decay, decoherence — as in the effective non-Hermitian toggle of the picture; the full system plus environment is still unitary.`,
      idea: String.raw`$H=H^\dagger$ makes $\tfrac{d}{dt}\langle\varphi(t)|\psi(t)\rangle=\tfrac i\hbar\langle H\varphi|\psi\rangle-\tfrac i\hbar\langle\varphi|H\psi\rangle=0$, so inner products are constant; norm conservation (qm-2.5) is the special case $\varphi=\psi$. The group law is the exponential law for commuting exponents, computed from the spectral decomposition $e^{-iHt}=\sum e^{-iE_kt}P_k$ (5.5) — each eigencomponent just turns its phase (ladr-7.53, fa-13.38). For a qubit, $H=\tfrac\omega2\,\mathbf n\cdot\boldsymbol\sigma$ and $U(t)$ rotates the whole Bloch sphere rigidly about $\mathbf n$ at angular speed $\omega$.`,
      caption: String.raw`Five qubit states (gold, joined into a polygon) evolve together under $H=\tfrac\omega2\,\mathbf n\cdot\boldsymbol\sigma$ (axis $\mathbf n$ in purple, tilt on the slider). **Press play:** the polygon turns rigidly about $\mathbf n$; right, the overlaps $|\langle\psi_i(t)|\psi_j(t)\rangle|$ stay frozen. Toggle **non-unitary decay** (an effective $H-\tfrac{i\Gamma}2|1\rangle\langle1|$): norms shrink (the diagonal fades), the normalized states (drawn) slide toward $|0\rangle$, and the polygon deforms — the configuration is no longer rigid. The readout also checks the group law $U(s)U(t)=U(s+t)$ numerically.`,
      deps: ['qm-2.4', 'fa-13.38', 'ladr-7.53', 'qm-5.5'],
      refs: ['Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Time_evolution#In_quantum_mechanics' },
      tags: ['unitary evolution', 'Stone theorem', 'Schrödinger equation'],
      viz(v) {
        const M = v.M;
        const tilt = v.slider('field axis tilt from $z$', 0, Math.PI, 0.9, { step: 0.01 });
        const dec = v.toggle('non-unitary decay ($\\Gamma = 0.6\\,\\omega$)', false);
        const SB = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 340, weight: 1.1, title: 'states on the Bloch sphere' });
        const SG = v.stage({ x: [-0.8, 5.2], y: [-0.7, 5.3], equal: true, axes: false, height: 340, weight: 0.9, title: 'overlaps $|\\langle\\psi_i(t)|\\psi_j(t)\\rangle|$' });
        const sc = v.scene3(SB, { axes: false, yaw: -0.55, pitch: 0.3 });
        const init = [[0.5, 0.2], [1.05, 0.7], [1.3, 1.6], [0.95, 2.5], [0.6, -0.9]].map(([th, ph]) => stateOf([Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]));
        const G0 = mat(5, 5, (i, j) => [cabs(ip(init[i], init[j])), 0]);
        let st = null;
        v.animate((t) => {
          const nH = [Math.sin(tilt.value), 0, Math.cos(tilt.value)], H = mscale(madd(madd(mscale(cplx([[0, 1], [1, 0]]), nH[0]), mscale([[[0, 0], [0, -1]], [[0, 1], [0, 0]]], nH[1])), mscale(cplx([[1, 0], [0, -1]]), nH[2])), 0.5);
          const Heff = dec.value ? msub(H, mat(2, 2, (i, j) => (i === 1 && j === 1 ? [0, 0.3] : 0))) : H;
          const U = expmC(M, mscale(Heff, [0, -t]));
          const psi = init.map((p) => mvec(U, p)), nb = psi.map(blochOf);
          // trails over one period
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc, { labels: true });
          sc.arrow([0, 0, 0], nH.map((c) => 1.32 * c), { color: 'purple', width: 2.4 }); sc.tex('\\mathbf n', nH.map((c) => 1.47 * c), { color: 'purple' });
          for (const p of init) { const tr = []; for (let k = 0; k <= 40; k++) { const s = (t * k) / 40, q = mvec(expmC(M, mscale(Heff, [0, -s])), p); tr.push(blochOf(q)); } sc.path(tr, { color: 'gold', width: 1.2, alpha: 0.45 }); }
          sc.path([...nb, nb[0]], { color: 'gold', width: 2 });
          nb.forEach((b, k) => { sc.dot(b, { r: 5, color: 'gold' }); });
          sc.flush();
          const G = mat(5, 5, (i, j) => [cabs(ip(psi[i], psi[j])), 0]);
          cells(v, SG, G, [0, 0, 5, 5], { max: 1, text: (z) => v.fix(z[0], 3), size: 10, rowLabels: ['ψ₁', 'ψ₂', 'ψ₃', 'ψ₄', 'ψ₅'], colLabels: ['ψ₁', 'ψ₂', 'ψ₃', 'ψ₄', 'ψ₅'] });
          SG.text(`t = ${v.fix(t, 2)}`, 2.5, -0.45, { align: 'center', size: 12, color: 'muted' });
          let dG = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) dG = Math.max(dG, Math.abs(G[i][j][0] - G0[i][j][0]));
          const s1 = 0.7, t1 = 1.3, gl = fnorm(msub(mmul(expmC(M, mscale(Heff, [0, -s1])), expmC(M, mscale(Heff, [0, -t1]))), expmC(M, mscale(Heff, [0, -(s1 + t1)]))));
          st = { dG, gl, unit: fnorm(msub(mmul(adj(U), U), eye(2))), norms: psi.map(vnorm), t };
        }, { period: TAU, still: 2.2 });
        v.legend([['gold', 'five states and their paths'], ['purple', 'axis $\\mathbf n$ of $H$']]);
        v.readout(() => st && `$t = ${v.fix(st.t, 2)}$: $\\|U^\\dagger U-I\\| = ${v.sci(Math.max(st.unit, 1e-17), 1)}$; largest change of any overlap since $t=0$: $${v.sci(Math.max(st.dG, 1e-17), 1)}$; norms ${st.norms.map((x) => v.fix(x, 3)).join(', ')}. Group law $\\|U(0.7)U(1.3)-U(2.0)\\| = ${v.sci(Math.max(st.gl, 1e-17), 1)}$ ${dec.value ? '(still a semigroup, but not unitary)' : ''}.`);
      },
    },
  ],
};
