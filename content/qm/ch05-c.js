// Quantum Mechanics — Chapter 5, part c: items 5.16–5.22 (pictures, Heisenberg equation, conservation, Zeno, minimum uncertainty,
// interaction-free measurement, and Heisenberg's 1925 paper)
import {
  TAU, grid, normalize, phaseLUT, drawPsi, phaseWheel, fz, sub, moments,
  cadd, csub, cmul, cconj, cscale, cabs, cabs2, carg, cis, ip, vnorm, vnormalize, basis,
  mat, eye, cplx, mmul, mvec, adj, madd, msub, mscale, comm, trace, fnorm, maxAbs, outer, expect, herm,
  heig, propagator, expmC, spinOps, spinAlong, blochOf, stateOf, spinCoherent, rotate3, oscX, oscP, sampleIdx,
  texC, texMat, cells, blochFrame, sphereOutline,
} from './ch05.shared.js';

/** Real matrix helpers for the oscillator items (plain number arrays). */
const rmul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const radd = (A, B, b = 1) => A.map((r, i) => r.map((x, j) => x + b * B[i][j]));
/** Truncated oscillator matrices on N Fock states (ħ = m = ω = 1): x, p² (both real) and H = p²/2 + x²/2 + λx⁴/4. */
function oscH(N, lam) {
  const X = oscX(N), X2 = rmul(X, X), X4 = rmul(X2, X2);
  const P2 = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => { // p² = −(a† − a)²/2
    if (i === j) return i + 0.5; if (Math.abs(i - j) === 2) { const m = Math.min(i, j); return -0.5 * Math.sqrt((m + 1) * (m + 2)); } return 0;
  }));
  const H = P2.map((r, i) => r.map((x, j) => 0.5 * x + 0.5 * X2[i][j] + 0.25 * lam * X4[i][j]));
  return { X, X2, X4, P2, H };
}
/** Coherent-state Fock amplitudes for α = (x0 + i p0)/√2. */
function coherent(x0, p0, N) {
  const ar = x0 / Math.SQRT2, ai = p0 / Math.SQRT2, c = [[Math.exp(-0.5 * (ar * ar + ai * ai)), 0]];
  for (let n = 0; n < N - 1; n++) c.push(cscale(cmul(c[n], [ar, ai]), 1 / Math.sqrt(n + 1)));
  return c;
}

export default {
  collection: 'qm',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.16
    {
      num: '5.16',
      kind: 'Definition',
      name: 'Schrödinger and Heisenberg pictures',
      statement: String.raw`With the time-evolution operator $U(t)=e^{-iHt/\hbar}$ there are two equivalent bookkeepings.

(a) **Schrödinger picture:** states move, $|\psi_S(t)\rangle=U(t)|\psi(0)\rangle$ (density operators $\rho_S(t)=U\rho_0U^\dagger$), and observables $A_S$ are fixed.

(b) **Heisenberg picture:** states are fixed, $|\psi_H\rangle=|\psi(0)\rangle$, and observables move, $A_H(t)=U(t)^\dagger A_S\,U(t)$.

Every prediction agrees because $\langle\psi_S(t)|A_S|\psi_S(t)\rangle=\langle\psi(0)|U^\dagger A_SU|\psi(0)\rangle=\langle\psi_H|A_H(t)|\psi_H\rangle$, and the same holds for all probabilities $\langle\psi|P_\lambda|\psi\rangle$ and all operator products, since $U^\dagger(AB)U=(U^\dagger AU)(U^\dagger BU)$. (An interaction picture splits the evolution between the two.)`,
      idea: String.raw`Only inner products of the form $\langle\varphi|A|\psi\rangle$ are physical, and unitarity (5.15) lets $U$ be moved from the kets onto the operator: $\langle U\varphi|A\,U\psi\rangle=\langle\varphi|U^\dagger AU\,\psi\rangle$. Geometrically for a spin: the Schrödinger picture rotates the Bloch vector forward about the field axis, while the Heisenberg picture rotates the measurement axis *backward* by the same angle — the angle between them, which is all a measurement sees, evolves identically. Heisenberg's own matrix mechanics (5.22) was born in the second picture; Schrödinger's wave mechanics in the first.`,
      caption: String.raw`A spin-½ in a field along $\mathbf n$ (purple); we measure $\sigma_{\mathbf m}$ along the green axis. **Toggle the picture.** *Schrödinger:* the state (gold) precesses about $\mathbf n$ and the green axis stays put. *Heisenberg:* the state is frozen and the green axis precesses the other way. **Drag the initial state** (ring) or tilt the axes. Right: $\langle\sigma_{\mathbf m}\rangle(t)$ computed both ways — $\langle\psi(t)|\sigma_{\mathbf m}|\psi(t)\rangle$ (accent) and $\langle\psi_0|U^\dagger\sigma_{\mathbf m}U|\psi_0\rangle$ (dashed) — the curves coincide. Bottom: which matrices move — $\rho$ in one picture, $A$ in the other.`,
      deps: ['qm-5.15', 'qm-5.9'],
      refs: ['Griffiths §6.8', 'Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heisenberg_picture' },
      tags: ['Heisenberg picture', 'Schrödinger picture', 'time evolution'],
      viz(v) {
        const M = v.M;
        const pic = v.select('picture', [{ value: 'S', label: 'Schrödinger: states move' }, { value: 'H', label: 'Heisenberg: observables move' }], 'S');
        const tn = v.slider('field axis $\\mathbf n$ tilt', 0, Math.PI, 0.5, { step: 0.01 });
        const tm = v.slider('measured axis $\\mathbf m$ tilt', 0, Math.PI, 1.9, { step: 0.01 });
        const SB = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 320, weight: 1, title: 'Bloch sphere' });
        const SP = v.stage({ x: [0, TAU * 2], y: [-1.1, 1.1], axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: 'ωt', ylabel: '⟨σₘ⟩', title: 'the expectation value is the same in both pictures' });
        const SC = v.stage({ x: [0, 16], y: [-0.3, 2.9], equal: true, axes: false, height: 165, full: true });
        const sc = v.scene3(SB, { axes: false, yaw: -0.6, pitch: 0.3 });
        const h = sc.handle([0.62, 0.55, 0.56], { color: 'gold', snap: (p) => { const r = Math.hypot(...p) || 1; return p.map((c) => c / r); } });
        const pauli = (u) => madd(madd(mscale(cplx([[0, 1], [1, 0]]), u[0]), mscale([[[0, 0], [0, -1]], [[0, 1], [0, 0]]], u[1])), mscale(cplx([[1, 0], [0, -1]]), u[2]));
        let st = null;
        v.animate((t) => {
          const n = [Math.sin(tn.value), 0, Math.cos(tn.value)], m = [Math.sin(tm.value), 0.0, Math.cos(tm.value)], H = mscale(pauli(n), 0.5);
          const psi0 = stateOf(h.p), Am = pauli(m), E = heig(H);
          const U = (s) => propagator(H, s, E);
          const tt = t % (TAU * 2), Ut = U(tt);
          const r = blochOf(mvec(Ut, psi0)), mH = rotate3(m, n, -tt);
          // sphere
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc, { labels: false });
          sc.arrow([0, 0, 0], n.map((c) => 1.3 * c), { color: 'purple', width: 2 }); sc.tex('\\mathbf n', n.map((c) => 1.45 * c), { color: 'purple' });
          const mm = pic.value === 'S' ? m : mH, rr = pic.value === 'S' ? r : h.p;
          sc.line(mm.map((c) => -1.2 * c), mm.map((c) => 1.2 * c), { color: 'green', width: 2.2 }, 12); sc.tex('\\mathbf m', mm.map((c) => 1.38 * c), { color: 'green' });
          const trail = []; for (let k = 0; k <= 60; k++) { const s = (tt * k) / 60; trail.push(pic.value === 'S' ? blochOf(mvec(U(s), psi0)) : rotate3(m, n, -s)); }
          sc.path(trail, { color: pic.value === 'S' ? 'gold' : 'green', width: 1.4, alpha: 0.6 });
          sc.arrow([0, 0, 0], rr, { color: 'gold', width: 2.6 });
          sc.flush();
          // expectation curves
          const fS = (s) => expect(Am, mvec(U(s), psi0))[0], fH = (s) => expect(mmul(mmul(adj(U(s)), Am), U(s)), psi0)[0];
          SP.hline(0, { color: 'faint' });
          SP.fn(fS, { color: 'accent', width: 3, n: 240 });
          SP.fn(fH, { color: 'ink', width: 1.5, dash: [5, 4], n: 240 });
          SP.vline(tt, { color: 'gold', width: 1.2 }); SP.dot(tt, fS(tt), { r: 5, color: 'gold' });
          // matrices
          const rho0 = outer(psi0, psi0), rhoS = mmul(mmul(Ut, rho0), adj(Ut)), AH = mmul(mmul(adj(Ut), Am), Ut);
          const four = pic.value === 'S' ? [[rhoS, '$\\rho_S(t)$', true], [Am, '$A_S=\\sigma_{\\mathbf m}$', false]] : [[rho0, '$\\rho_H=\\rho_0$', false], [AH, '$A_H(t)=U^\\dagger\\sigma_{\\mathbf m}U$', true]];
          four.forEach(([A, lab, moving], k) => {
            const x0 = 0.8 + k * 8;
            cells(v, SC, A, [x0, 0, x0 + 2.7, 2.7], { max: 1, text: (z) => texC(v, z, 2).replace(/-/g, '−'), size: 10 });
            SC.text(lab, x0 + 3.0, 1.7, { size: 14 });
            SC.text(moving ? 'moves' : 'fixed', x0 + 3.0, 0.8, { size: 12, color: moving ? 'gold' : 'muted', weight: 700 });
          });
          let dmax = 0; for (let k = 0; k <= 60; k++) { const s = (TAU * 2 * k) / 60; dmax = Math.max(dmax, Math.abs(fS(s) - fH(s))); }
          st = { val: fS(tt), dmax, tt, ang: (Math.acos(Math.max(-1, Math.min(1, pic.value === 'S' ? M.dot(r, m) : M.dot(h.p, mH)))) * 180) / Math.PI };
        }, { period: TAU * 2, still: 2.6 });
        v.legend([['accent', 'Schrödinger: $\\langle\\psi(t)|\\sigma_{\\mathbf m}|\\psi(t)\\rangle$'], ['ink', 'Heisenberg: $\\langle\\psi_0|U^\\dagger\\sigma_{\\mathbf m}U|\\psi_0\\rangle$', { dash: true }], ['purple', 'field axis'], ['green', 'measured axis']]);
        v.readout(() => st && `$\\omega t = ${v.fix(st.tt, 2)}$: $\\langle\\sigma_{\\mathbf m}\\rangle = ${v.fix(st.val, 4)}$; angle between state and measured axis $= ${v.fix(st.ang, 1)}^\\circ$ in the ${pic.value === 'S' ? 'Schrödinger' : 'Heisenberg'} picture (the same in the other). Largest difference between the two curves over two periods: $${v.sci(Math.max(st.dmax, 1e-17), 1)}$.`);
      },
    },
    // ------------------------------------------------------------------ 5.17
    {
      num: '5.17',
      kind: 'Theorem',
      name: 'Heisenberg equation and Poisson brackets',
      statement: String.raw`In the Heisenberg picture an observable without explicit time dependence evolves by the **Heisenberg equation**
$$\frac{dA_H}{dt}=\frac{i}{\hbar}\,[H,A_H].$$
For $H=\frac{p^2}{2m}+V(x)$ the canonical relation gives $\dot x_H=p_H/m$ and $\dot p_H=-V'(x_H)$ — Hamilton's equations as operator equations. This is Dirac's correspondence: the classical Poisson bracket $\{f,g\}$ is replaced by $\tfrac1{i\hbar}[\hat f,\hat g]$, and $\dot f=\{f,H\}$ becomes the Heisenberg equation. Taking expectation values gives Ehrenfest's theorem; $\langle x\rangle,\langle p\rangle$ follow the classical orbit exactly when $V$ is at most quadratic, because only then is $\langle V'(x)\rangle=V'(\langle x\rangle)$.`,
      idea: String.raw`Differentiate $A_H=U^\dagger AU$ using $\dot U=-\tfrac i\hbar HU$ and the fact that $U$ commutes with $H$. For the Hamiltonian above, $[H,x]=\tfrac{1}{2m}[p^2,x]=-\tfrac{i\hbar}{m}p$ and $[H,p]=[V(x),p]=i\hbar V'(x)$, both from $[x,p]=i\hbar$ (5.9) — the algebra of commutators mirrors the Poisson algebra $\{x,p\}=1$ (mech-12.7). For the oscillator the equations are linear, $x_H(t)=x\cos\omega t+\tfrac{p}{m\omega}\sin\omega t$, a rigid rotation of phase space; an $x^4$ term makes them nonlinear, and the quantum mean departs from the classical orbit as the wave packet spreads.`,
      caption: String.raw`An oscillator $H=\tfrac12p^2+\tfrac12x^2+\tfrac\lambda4x^4$ ($\hbar=m=\omega=1$) represented by $60\times60$ matrices in the Fock basis; the state is a coherent state started at the handle (**drag it** in phase space). Left: the quantum means $(\langle x\rangle,\langle p\rangle)(t)$ (accent), computed by diagonalizing $H$, against the classical Hamiltonian orbit from the same start (orange, Runge–Kutta). At $\lambda=0$ they coincide forever. **Raise $\lambda$:** the classical orbit stays on its energy contour while the quantum mean spirals inward (dephasing), then partially revives. Right: $\langle x\rangle(t)$ and $x_{\rm cl}(t)$. The readout checks the operator identities $i[H,x]=p$ and $i[H,p]=-x-\lambda x^3$ on the matrices.`,
      deps: ['qm-5.16', 'mech-12.7', 'qm-2.9'],
      refs: ['Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heisenberg_picture#Commutator_relations' },
      tags: ['Heisenberg equation', 'Poisson bracket', 'Ehrenfest theorem'],
      viz(v) {
        const M = v.M, N = 60, TMAX = 30;
        const lam = v.slider('anharmonicity $\\lambda$', 0, 0.12, 0.04, { step: 0.002 });
        const SPh = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], equal: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'x', ylabel: 'p', title: 'phase space' });
        const ST = v.stage({ x: [0, TMAX], y: [-3, 3], axes: 'box', gutter: true, height: 330, weight: 1.25, xlabel: 't', ylabel: 'x', title: 'quantum mean vs classical' });
        const h0 = SPh.handle(2.2, 0, { color: 'gold', label: 'start', labelPos: 'ne', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 3 ? [(3 * x) / r, (3 * y) / r] : [x, y]; } });
        let cacheE = null, cacheT = null;
        const eig = () => {
          if (cacheE && cacheE.lam === lam.value) return cacheE;
          const O = oscH(N, lam.value), E = M.eigSym(O.H);
          // operator checks on the upper-left block (away from the truncation edge)
          const X = O.X, P = oscP(N), Hc = cplx(O.H), Xc = cplx(X);
          const iHX = mscale(comm(Hc, Xc), [0, 1]), iHP = mscale(comm(Hc, P), [0, 1]), X3 = cplx(rmul(O.X2, X));
          const target = madd(mscale(Xc, -1), mscale(X3, -lam.value));
          const blk = (A) => A.slice(0, 40).map((r) => r.slice(0, 40));
          return (cacheE = { lam: lam.value, O, E, e1: fnorm(blk(msub(iHX, P))), e2: fnorm(blk(msub(iHP, target))) });
        };
        const traj = () => {
          const key = `${lam.value}|${h0.x}|${h0.y}`; if (cacheT && cacheT.key === key) return cacheT;
          const { O, E } = eig(), c0 = coherent(h0.x, h0.y, N), K = E.values.length;
          const b = E.vecs.map((w) => w.reduce((s, wi, i) => cadd(s, cscale(c0[i], wi)), [0, 0]));
          const X = O.X, q = [];
          const S = 600;
          for (let s = 0; s <= S; s++) {
            const t = (TMAX * s) / S, c = Array.from({ length: N }, () => [0, 0]);
            for (let k = 0; k < K; k++) { const ph = cmul(b[k], cis(-E.values[k] * t)), w = E.vecs[k]; for (let i = 0; i < N; i++) { c[i][0] += ph[0] * w[i]; c[i][1] += ph[1] * w[i]; } }
            let mx = 0, mp = 0;
            for (let i = 0; i < N - 1; i++) { const a = X[i][i + 1], z = cmul(cconj(c[i]), c[i + 1]); mx += 2 * a * z[0]; mp += 2 * a * z[1]; } // ⟨p⟩ with p_{i,i+1} = −i√((i+1)/2)
            q.push([t, mx, mp]);
          }
          const cl = []; let y = [h0.x, h0.y]; const dt = TMAX / 3000, F = (Y) => [Y[1], -Y[0] - lam.value * Y[0] ** 3];
          cl.push([0, y[0], y[1]]);
          for (let k = 1; k <= 3000; k++) { const k1 = F(y), k2 = F([y[0] + 0.5 * dt * k1[0], y[1] + 0.5 * dt * k1[1]]), k3 = F([y[0] + 0.5 * dt * k2[0], y[1] + 0.5 * dt * k2[1]]), k4 = F([y[0] + dt * k3[0], y[1] + dt * k3[1]]); y = [y[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; if (k % 5 === 0) cl.push([k * dt, y[0], y[1]]); }
          return (cacheT = { key, q, cl, dt });
        };
        let st = null;
        v.animate((tt) => {
          const T = traj(), { q, cl, dt } = T, t = tt % TMAX, idx = Math.round((t / TMAX) * (q.length - 1));
          const Ecl = 0.5 * h0.y ** 2 + 0.5 * h0.x ** 2 + 0.25 * lam.value * h0.x ** 4;
          SPh.contour((x, p) => 0.5 * p * p + 0.5 * x * x + 0.25 * lam.value * x ** 4, [Ecl], { color: 'faint', width: 1 });
          SPh.path(cl.map((r) => [r[1], r[2]]), { color: 'orange', width: 1.6, dash: [5, 4] });
          SPh.path(q.slice(0, idx + 1).map((r) => [r[1], r[2]]), { color: 'accent', width: 2 });
          SPh.dot(q[idx][1], q[idx][2], { r: 5, color: 'accent' });
          const ci = Math.min(cl.length - 1, Math.round(t / (5 * dt))); SPh.dot(cl[ci][1], cl[ci][2], { r: 4.5, color: 'orange' });
          ST.hline(0, { color: 'faint' });
          ST.path(cl.map((r) => [r[0], r[1]]), { color: 'orange', width: 1.4, dash: [5, 4] });
          ST.path(q.map((r) => [r[0], r[1]]), { color: 'accent', width: 1.8 });
          ST.vline(t, { color: 'gold', width: 1 });
          let dev = 0; for (let k = 0; k <= idx; k++) { const r = q[k], c = cl[Math.min(cl.length - 1, Math.round(r[0] / (5 * dt)))]; dev = Math.max(dev, Math.hypot(r[1] - c[1], r[2] - c[2])); }
          const Ee = eig();
          st = { e1: Ee.e1, e2: Ee.e2, dev, t, lam: lam.value };
        }, { period: TMAX, still: 22 });
        v.legend([['accent', 'quantum $(\\langle x\\rangle,\\langle p\\rangle)$'], ['orange', 'classical orbit', { dash: true }], ['faint', 'classical energy contour']]);
        v.readout(() => st && `Operator identities on the $40\\times40$ block (truncation edge excluded): $\\|i[H,x]-p\\| = ${v.sci(Math.max(st.e1, 1e-17), 1)}$, $\\|i[H,p]-(-x-\\lambda x^3)\\| = ${v.sci(Math.max(st.e2, 1e-17), 1)}$ — the commutators reproduce the Poisson brackets $\\{x,H\\}=p$, $\\{p,H\\}=-V'(x)$. ` +
          `Largest quantum–classical separation in phase space up to $t = ${v.fix(st.t, 1)}$: $${st.lam === 0 ? v.sci(Math.max(st.dev, 1e-17), 1) : v.fix(st.dev, 3)}$${st.lam === 0 ? ' (harmonic: identical, up to integration error)' : ' — $\\langle x^3\\rangle\\neq\\langle x\\rangle^3$ pulls the mean off the orbit'}.`);
      },
    },
    // ------------------------------------------------------------------ 5.18
    {
      num: '5.18',
      kind: 'Theorem',
      name: 'Conserved quantities commute with H',
      statement: String.raw`For an observable $A$ with no explicit time dependence and a time-independent Hamiltonian $H$, the following are equivalent:

(a) $[A,H]=0$;

(b) $\langle A\rangle_{\psi(t)}$ is constant for every initial state;

(c) the entire probability distribution of outcomes of $A$ is constant in time for every initial state.

Then $A$ is a **constant of motion**, its eigenvalues are good quantum numbers, and $H$ and $A$ can be diagonalized together (5.12). Symmetries generate such quantities: if $H$ commutes with the unitary group $e^{-i\theta A}$, then $A$ is conserved (Noether's theorem in quantum form).`,
      idea: String.raw`(a)⇒(c): if $[A,H]=0$ then every spectral projection $P_\lambda$ of $A$ commutes with $U(t)$, so $\langle\psi(t)|P_\lambda|\psi(t)\rangle=\langle\psi|U^\dagger P_\lambda U|\psi\rangle=\langle\psi|P_\lambda|\psi\rangle$. (c)⇒(b) is trivial. (b)⇒(a): by the Heisenberg equation (5.17) $\tfrac{d}{dt}\langle A\rangle=\tfrac i\hbar\langle\psi|[H,A]|\psi\rangle$ at $t=0$, and a Hermitian-times-$i$ operator with vanishing expectation in every state is zero.`,
      caption: String.raw`A spin-1 particle in a magnetic field, $H=\mathbf B\cdot\mathbf S$ with the field tilted from $z$ by the slider (plus an optional $DS_z^2$ term). Choose an observable. Top: the probabilities of its three outcomes over time, stacked (each band's height is one probability), computed from $e^{-iHt}$ on a fixed initial state. Right: the commutator $[A,H]$ entry by entry. The bands are frozen exactly when the commutator panel is empty: $S_z$ with the field along $z$; the field component $\hat{\mathbf B}\cdot\mathbf S$ always (unless $D\neq0$); $S_z$ even with $D\neq0$ when the field is along $z$.`,
      deps: ['qm-5.17', 'qm-5.12'],
      refs: ['Griffiths §6.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Constant_of_motion#In_quantum_mechanics' },
      tags: ['conservation laws', 'commutator', 'constants of motion'],
      viz(v) {
        const S = spinOps(1);
        const obs = v.select('observable $A$', [{ value: 'z', label: '$S_z$' }, { value: 'x', label: '$S_x$' }, { value: 'b', label: '$\\hat{\\mathbf B}\\cdot\\mathbf S$' }, { value: 'z2', label: '$S_z^2$' }], 'z');
        const tilt = v.slider('field tilt from $z$', 0, Math.PI / 2, 0.45, { step: 0.01 });
        const quad = v.toggle('add $D\\,S_z^2$ ($D=0.7$)', false);
        const SP = v.stage({ x: [0, 4 * Math.PI], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.6, xlabel: 't (field strength B = 1)', ylabel: 'outcome probabilities (stacked)' });
        const SC = v.stage({ x: [-0.6, 3.3], y: [-0.7, 3.45], equal: true, axes: false, height: 300, weight: 0.9, title: '$[A,H]$' });
        const psi0 = spinCoherent(S, [Math.sin(1.1) * Math.cos(0.5), Math.sin(1.1) * Math.sin(0.5), Math.cos(1.1)]);
        const COL = ['accent', 'purple', 'orange'];
        let st = null;
        v.render(() => {
          const nB = [Math.sin(tilt.value), 0, Math.cos(tilt.value)];
          let H = spinAlong(S, nB); if (quad.value) H = madd(H, mscale(mmul(S.Sz, S.Sz), 0.7));
          const A = obs.value === 'z' ? S.Sz : obs.value === 'x' ? S.Sx : obs.value === 'b' ? spinAlong(S, nB) : mmul(S.Sz, S.Sz);
          const EA = heig(A), EH = heig(H);
          // group A's eigenvalues into projections (S_z² is degenerate)
          const groups = []; EA.values.forEach((l, k) => { const g = groups.find((G) => Math.abs(G.l - l) < 1e-9); if (g) g.v.push(EA.vectors[k]); else groups.push({ l, v: [EA.vectors[k]] }); });
          const prob = (psi) => groups.map((g) => g.v.reduce((s, w) => s + cabs2(ip(w, psi)), 0));
          const NT = 400, rows = [];
          for (let i = 0; i <= NT; i++) { const t = (4 * Math.PI * i) / NT, psi = mvec(propagator(H, t, EH), psi0); rows.push([t, prob(psi)]); }
          let acc = rows.map(() => 0);
          groups.forEach((g, k) => {
            const lo = acc.slice(), hi = acc.map((a, i) => a + rows[i][1][k]);
            SP.poly([...rows.map((r, i) => [r[0], hi[i]]), ...rows.map((r, i) => [r[0], lo[i]]).reverse()], { fill: COL[k], fillAlpha: 0.45, color: COL[k], width: 1 });
            const mid = Math.round(NT * 0.04); if (rows[mid][1][k] > 0.06) SP.text(`${fz(v, g.l, 0)}`, rows[mid][0], (lo[mid] + hi[mid]) / 2, { size: 11, color: 'ink', plate: true });
            acc = hi;
          });
          const Cm = comm(A, H), cn = fnorm(Cm);
          cells(v, SC, Cm, [0, 0, 3, 3], { max: 1, text: (z) => (cabs(z) < 5e-13 ? '0' : texC(v, z, 2).replace(/-/g, '−')), size: 9.5 });
          SC.text(cn < 1e-12 ? 'zero: conserved' : `‖[A,H]‖ = ${v.fix(cn, 3)}`, 1.5, -0.4, { align: 'center', size: 12, color: cn < 1e-12 ? 'green' : 'red' });
          let drift = 0; for (const r of rows) r[1].forEach((p, k) => { drift = Math.max(drift, Math.abs(p - rows[0][1][k])); });
          const mA = rows.map((r) => r[1].reduce((s, p, k) => s + p * groups[k].l, 0)); const dA = Math.max(...mA) - Math.min(...mA);
          st = { cn, drift, dA, labels: groups.map((g) => fz(v, g.l, 0)) };
        });
        v.legend([['accent', 'smallest eigenvalue', { area: true }], ['purple', 'middle', { area: true }], ['orange', 'largest (labels give the values)', { area: true }]]);
        v.readout(() => st && `Outcomes of $A$: ${st.labels.join(', ')}. $\\|[A,H]\\| = ${v.sci(Math.max(st.cn, 1e-17), 2)}$; largest change of any outcome probability over $0\\le t\\le4\\pi$: $${v.sci(Math.max(st.drift, 1e-17), 2)}$; range of $\\langle A\\rangle(t)$: $${v.sci(Math.max(st.dA, 1e-17), 2)}$ — ${st.cn < 1e-12 ? '**conserved**.' : 'not conserved.'}`);
      },
    },
    // ------------------------------------------------------------------ 5.19
    {
      num: '5.19',
      kind: 'Phenomenon',
      name: 'Quantum Zeno effect',
      statement: String.raw`Frequent measurement inhibits evolution. If a system starts in $|\psi_0\rangle$ and is measured with the projection $P=|\psi_0\rangle\langle\psi_0|$ at $N$ equally spaced times during an interval $T$, the probability that it is found in $|\psi_0\rangle$ every time tends to 1 as $N\to\infty$. For a two-level system driven from $|0\rangle$ to $|1\rangle$ at Rabi frequency $\Omega$ over one half-period $T=\pi/\Omega$ (which would complete the transfer), it is
$$P_N=\Big[\cos^2\frac{\pi}{2N}\Big]^N\;\approx\;1-\frac{\pi^2}{4N}\to1.$$`,
      scope: String.raw`Needs measurements much faster than the system's natural evolution (the quadratic short-time regime). For decays with a long exponential regime, measurements at intermediate rates can instead accelerate decay (anti-Zeno effect). Observed with trapped ions by Itano et al. (1990).`,
      idea: String.raw`At short times the survival amplitude deviates from 1 only quadratically: $|\langle\psi_0|e^{-iHt}|\psi_0\rangle|^2\approx1-(\Delta E\,t/\hbar)^2$ (5.11). Each measurement projects the state back onto $|\psi_0\rangle$ (5.7), restarting the clock, so after $N$ intervals of length $T/N$ the survival is $\big(1-(\Delta E\,T/\hbar N)^2\big)^N\approx1-(\Delta E\,T/\hbar)^2/N\to1$: the losses per interval shrink like $1/N^2$ while their number grows only like $N$.`,
      caption: String.raw`Left: the probability of still being in $|0\rangle$ during one Rabi half-period. Without measurement (faint) it falls to 0. With $N$ measurements (**slider**) it falls a little, gets reset to "still in $|0\rangle$" for the survivors, and falls a little again — a staircase that ends at $P_N$. Thin gold lines: 25 simulated individual runs (a run drops to 0 when a measurement finds $|1\rangle$). Right: $P_N$ against $N$ — exact formula (curve), its large-$N$ form $1-\pi^2/4N$ (dashed), and Monte Carlo estimates from 4000 simulated runs each (dots, ±1 s.e.).`,
      deps: ['qm-5.7', 'qm-5.15', 'qm-5.11'],
      refs: ['Griffiths ch. 12'],
      credit: 'Misra & Sudarshan, 1977',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_Zeno_effect' },
      tags: ['quantum Zeno effect', 'measurement', 'Rabi oscillation'],
      viz(v) {
        const NN = v.slider('measurements $N$ per half-period', 1, 60, 6, { int: true });
        const SL = v.stage({ x: [0, 1], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: 't / (π/Ω)', ylabel: 'P(still in |0⟩)', title: 'one Rabi half-period' });
        const SR = v.stage({ x: [1, 100], y: [0, 1.02], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'N', ylabel: 'survival P(N)', title: 'more looking, less change' });
        const PN = (N) => Math.cos(Math.PI / (2 * N)) ** (2 * N);
        // Monte Carlo (seeded): a run survives a measurement with probability cos²(π/2N)
        const mc = new Map(); const sim = (N) => { if (mc.has(N)) return mc.get(N); const r = v.rng(500 + N), q = Math.cos(Math.PI / (2 * N)) ** 2; let s = 0; for (let k = 0; k < 4000; k++) { let ok = true; for (let j = 0; j < N && ok; j++) if (r() > q) ok = false; if (ok) s++; } const p = s / 4000; mc.set(N, p); return p; };
        let st = null;
        v.render(() => {
          const N = NN.value, q = Math.cos(Math.PI / (2 * N)) ** 2;
          SL.fn((t) => Math.cos((Math.PI * t) / 2) ** 2, { color: 'muted', width: 1.4, alpha: 0.6 });
          // individual runs
          const r = v.rng(77 + N), fails = [];
          for (let run = 0; run < 25; run++) {
            const pts = [[0, 1]]; let alive = true;
            for (let j = 0; j < N; j++) {
              const t0 = j / N, t1 = (j + 1) / N;
              if (!alive) { pts.push([t1, 0]); continue; }
              for (let k = 1; k <= 8; k++) { const t = t0 + ((t1 - t0) * k) / 8; pts.push([t, Math.cos((Math.PI * (t - t0)) / 2) ** 2]); }
              if (r() > q) { alive = false; pts.push([t1, 0]); fails.push(t1); } else pts.push([t1, 1]);
            }
            SL.path(pts, { color: 'gold', width: 0.8, alpha: 0.35 });
          }
          fails.forEach((tf, i) => SL.dot(tf, 0.025 + 0.022 * (i % 4), { r: 3.2, color: 'red' }));
          SL.text(`${fails.length} of 25 runs caught in |1⟩ (red)`, 0.02, 0.2, { size: 10.5, color: 'red', plate: true });
          // ensemble staircase
          const pts = []; for (let j = 0; j < N; j++) { const t0 = j / N; for (let k = 0; k <= 30; k++) { const t = t0 + k / (30 * N); pts.push([t, q ** j * Math.cos((Math.PI * (t - t0)) / 2) ** 2]); } }
          SL.path(pts, { color: 'accent', width: 2.6 });
          for (let j = 1; j <= N; j++) SL.vline(j / N, { color: 'faint', width: 0.8 });
          SL.dot(1, PN(N), { r: 5.5, color: 'accent' });
          // right panel
          SR.fn((n) => PN(n), { color: 'accent', width: 2.4 });
          SR.fn((n) => 1 - (Math.PI ** 2) / (4 * n), { color: 'muted', width: 1.3, dash: [5, 4] });
          for (const n of [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96]) { const p = sim(n), se = Math.sqrt((p * (1 - p)) / 4000); SR.line(n, p - se, n, p + se, { color: 'gold', width: 1.4 }); SR.dot(n, p, { r: 3.2, color: 'gold' }); }
          SR.dot(N, PN(N), { r: 6, color: 'accent' });
          st = { N, P: PN(N), mcP: sim(N) };
        });
        v.legend([['accent', 'survival with measurements'], ['muted', 'no measurement / large-N form'], ['gold', 'simulated runs and Monte Carlo', { dot: true }]]);
        v.readout(() => st && `$N = ${st.N}$: $P_N = \\cos^{2N}(\\pi/2N) = ${v.fix(st.P, 4)}$ (Monte Carlo, 4000 runs: $${v.fix(st.mcP, 4)}$; large-$N$ form $1-\\pi^2/4N = ${v.fix(1 - Math.PI ** 2 / (4 * st.N), 4)}$). Without measurement the same interval leaves $P = 0$: the system is fully transferred to $|1\\rangle$.`);
      },
    },
    // ------------------------------------------------------------------ 5.20
    {
      num: '5.20',
      kind: 'Theorem',
      name: 'Minimum-uncertainty states are Gaussian',
      statement: String.raw`A wave function $\psi\in L^2(\R)$ with finite $\Delta x,\Delta p$ satisfies $\Delta x\,\Delta p=\hbar/2$ **if and only if** it is a Gaussian
$$\psi(x)=C\exp\Big(-\frac{(x-x_0)^2}{4\sigma^2}+\frac{ip_0x}{\hbar}\Big),\qquad\sigma>0,$$
with real $x_0,p_0$ (centre, mean momentum) and width $\sigma=\Delta x$. Allowing a complex width ("chirped" Gaussians) gives exactly the states that saturate the stronger Schrödinger relation $\Delta x^2\Delta p^2\ge\hbar^2/4+\mathrm{Cov}(x,p)^2$. Any other shape has $\Delta x\,\Delta p>\hbar/2$.`,
      idea: String.raw`In the proof of Robertson's inequality (5.10), equality needs $(\hat p-p_0)\psi=c\,(\hat x-x_0)\psi$ for a constant $c$, and the covariance term must vanish, forcing $c$ to be purely imaginary, $c=i\hbar/2\sigma^2$. This is a first-order ODE, $-i\hbar\psi'=\big(p_0+\tfrac{i\hbar}{2\sigma^2}(x-x_0)\big)\psi$, whose only solutions are the Gaussians above — the same equation $a\,\psi=\alpha\psi$ that defines coherent states (qm-4.7).`,
      caption: String.raw`**Optimize:** start from any shape (preset, or draw over the top panel) and watch a descent algorithm minimize $\Delta x\,\Delta p$: each step applies $e^{-\tau K}$ with $K=\Delta p^2(x-\langle x\rangle)^2+\Delta x^2(p-\langle p\rangle)^2$ by split-step Fourier and renormalizes. The shape (colour = phase) relaxes onto the dashed Gaussian with the same centre, momentum and width; the right panel tracks the product down to $\tfrac12$ (green line, $\hbar=1$). Linear phases (the "moving" preset) survive as $p_0$. **Perturb:** a Gaussian plus $\varepsilon$ times a chosen deformation; the product is minimal exactly at $\varepsilon=0$.`,
      deps: ['qm-5.10', 'qm-4.7'],
      refs: ['Griffiths §3.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Uncertainty_principle#Minimum_uncertainty_states' },
      tags: ['uncertainty principle', 'Gaussian wave packet', 'optimization'],
      viz(v) {
        const M = v.M, n = 512, L = 24, x = Float64Array.from({ length: n }, (_, i) => -L / 2 + (L * i) / n), dx = L / n;
        const k = Float64Array.from({ length: n }, (_, i) => (TAU * (i < n / 2 ? i : i - n)) / L);
        const PRE = {
          box: (X) => [Math.abs(X + 0.5) < 2 ? 1 : 0, 0],
          two: (X) => [Math.exp(-((X + 2) ** 2) / 0.6) + 0.8 * Math.exp(-((X - 1.8) ** 2) / 1.2), 0],
          tri: (X) => [Math.max(0, 1 - Math.abs(X - 0.5) / 2.5), 0],
          move: (X) => { const a = Math.max(0, 1 - ((X + 1) / 3) ** 2); return [a * Math.cos(1.5 * X), a * Math.sin(1.5 * X)]; },
        };
        const mode = v.select('mode', [{ value: 'opt', label: 'optimize' }, { value: 'pert', label: 'perturb a Gaussian' }], 'opt', { onChange: () => { pre.el.hidden = mode.value !== 'opt'; eps.el.hidden = def.el.hidden = mode.value === 'opt'; } });
        const pre = v.select('start', [{ value: 'box', label: 'box' }, { value: 'two', label: 'two bumps' }, { value: 'tri', label: 'triangle' }, { value: 'move', label: 'moving lump' }], 'two', { onChange: () => { drawn = null; S.reset(); v.restart(); } });
        const eps = v.slider('deformation $\\varepsilon$', -0.6, 0.6, 0.25, { step: 0.01 });
        const def = v.select('deformation', [{ value: 'sk', label: 'skew' }, { value: 'fl', label: 'flat top' }, { value: 'ch', label: 'chirp' }], 'sk');
        eps.el.hidden = def.el.hidden = true;
        let drawn = null;
        const SW = v.stage({ x: [-8, 8], y: [0, 1.15], axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 'x', ylabel: '|ψ|', title: 'the wave function' });
        const SR = v.stage({ x: [0, 240], y: [0.45, 1.2], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'step', ylabel: 'Δx·Δp', title: 'the product falls to ½' });
        SW.onDrag((X, Y, ph) => {
          if (mode.value !== 'opt') return;
          const cur = S.state; if (!drawn) { drawn = { re: Float64Array.from(cur.re), im: Float64Array.from(cur.im) }; let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.hypot(drawn.re[i], drawn.im[i])); for (let i = 0; i < n; i++) { drawn.re[i] /= mx; drawn.im[i] /= mx; } }
          const i = Math.round((X + L / 2) / dx); for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) { drawn.re[j] = Math.max(0, Math.min(1.1, Y)); drawn.im[j] = 0; }
          if (ph === 'end') { S.reset(); v.restart(); }
          v.invalidate();
        });
        const initState = () => {
          const re = new Float64Array(n), im = new Float64Array(n);
          if (drawn) { re.set(drawn.re); im.set(drawn.im); } else for (let i = 0; i < n; i++) { const z = PRE[pre.value](x[i]); re[i] = z[0]; im[i] = z[1]; }
          normalize(re, im, dx);
          const m = moments(x, re, im); return { re, im, hist: [[0, m.sx * m.sp]], it: 0 };
        };
        const step = (s) => {
          const m = moments(x, s.re, s.im), a = m.sp * m.sp, b = m.sx * m.sx, tau = 0.012 / Math.sqrt(a * b);
          const R = Array.from(s.re), I = Array.from(s.im);
          for (let i = 0; i < n; i++) { const f = Math.exp(-0.5 * tau * a * (x[i] - m.mx) ** 2); R[i] *= f; I[i] *= f; }
          M.fft(R, I); for (let i = 0; i < n; i++) { const f = Math.exp(-tau * b * (k[i] - m.mp) ** 2); R[i] *= f; I[i] *= f; } M.ifft(R, I);
          for (let i = 0; i < n; i++) { const f = Math.exp(-0.5 * tau * a * (x[i] - m.mx) ** 2); s.re[i] = R[i] * f; s.im[i] = I[i] * f; }
          normalize(s.re, s.im, dx); s.it++;
          const m2 = moments(x, s.re, s.im); s.hist.push([s.it, m2.sx * m2.sp]);
        };
        /** The perturbed Gaussian: e^{−x²/4} deformed by ε (skew: + ε·0.6·x e^{−x²/4}·tanh-free odd bump; flat: ε·0.3(2 − x²)e^{−x²/4}; chirp: phase e^{0.4iεx²}). */
        const shape = (e) => {
          const re = new Float64Array(n), im = new Float64Array(n);
          for (let i = 0; i < n; i++) {
            const X = x[i], g = Math.exp(-X * X / 4);
            let a = g, ph = 0;
            if (def.value === 'sk') a = g + e * 0.6 * X * X * g * Math.sign(X) / 2; else if (def.value === 'fl') a = g + e * 0.3 * (2 - X * X) * g; else ph = 0.4 * e * X * X;
            re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph);
          }
          normalize(re, im, dx); return { re, im };
        };
        const S = v.sim(initState, (s) => { step(s); }, { dt: 0.05, maxSteps: 4000 });
        let st = null;
        v.animate((t) => {
          const col = phaseLUT(v);
          let re, im, hist = null;
          if (mode.value === 'opt') { S.advance(t); ({ re, im, hist } = S.state); }
          else {
            ({ re, im } = shape(eps.value));
          }
          const m = moments(x, re, im);
          let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.hypot(re[i], im[i]));
          const sc = 1 / mx;
          drawPsi(SW, x, re, im, { col, mode: 'abs', scale: sc });
          // Gaussian with the same centre and width
          const gA = (2 * Math.PI * m.sx * m.sx) ** -0.25;
          SW.fn((X) => sc * gA * Math.exp(-((X - m.mx) ** 2) / (4 * m.sx * m.sx)), { color: 'green', width: 2, dash: [6, 4] });
          phaseWheel(SW, col, SW.W - 34, 64, 12);
          if (mode.value === 'opt') { SW.corner('drag to draw a new start', 'tl', { color: 'muted', size: 11 }); }
          // right: history, or the product as a function of ε
          if (mode.value === 'opt') {
            const last = hist[hist.length - 1][0];
            SR.setView([0, 240], [0.45, Math.max(1.0, Math.min(6, hist[0][1] * 1.08))]);
            SR.setLabels('step', 'Δx·Δp');
            SR.hline(0.5, { color: 'green', width: 1.6, dash: [5, 4] });
            SR.path(hist, { color: 'accent', width: 2 }); SR.dot(hist[hist.length - 1][0], hist[hist.length - 1][1], { r: 5, color: 'accent' });
          } else {
            const prod = (e) => { const q = moments(x, ...Object.values(shape(e))); return q.sx * q.sp; };
            const pts = []; for (let j = 0; j <= 80; j++) { const e = -0.6 + (1.2 * j) / 80; pts.push([e, prod(e)]); }
            SR.setView([-0.6, 0.6], [0.45, Math.max(0.7, ...pts.map((p) => p[1] * 1.03))]);
            SR.setLabels('ε', 'Δx·Δp');
            SR.hline(0.5, { color: 'green', width: 1.6, dash: [5, 4] });
            SR.path(pts, { color: 'accent', width: 2 }); SR.dot(eps.value, prod(eps.value), { r: 5.5, color: 'gold' });
          }
          let dev = 0; for (let i = 0; i < n; i++) dev = Math.max(dev, Math.abs(Math.hypot(re[i], im[i]) - gA * Math.exp(-((x[i] - m.mx) ** 2) / (4 * m.sx * m.sx))));
          st = { m, prod: m.sx * m.sp, dev: dev / (gA || 1), it: hist ? hist[hist.length - 1][0] : null };
        }, { period: 12, once: true, still: 6 });
        v.legend([['green', 'Gaussian with the same $\\langle x\\rangle$, $\\Delta x$ / the bound $\\frac12$', { dash: true }], ['accent', '$\\Delta x\\,\\Delta p$']]);
        v.readout(() => st && `${st.it != null ? `Step ${st.it}: ` : ''}$\\Delta x = ${v.fix(st.m.sx, 4)}$, $\\Delta p = ${v.fix(st.m.sp, 4)}$, $\\langle p\\rangle = ${fz(v, st.m.mp, 3)}$: $\\Delta x\\,\\Delta p = ${v.fix(st.prod, 5)}$ ${st.prod < 0.5005 ? '≈ ½ — a Gaussian' : '> ½'}; largest gap between $|\\psi|$ and the matching Gaussian: $${v.fix(100 * st.dev, 2)}\\%$ of its peak.`);
      },
    },
    // ------------------------------------------------------------------ 5.21
    {
      num: '5.21',
      kind: 'Phenomenon',
      name: 'Interaction-free measurement',
      statement: String.raw`Quantum interference can reveal an object without any particle interacting with it. In a balanced Mach–Zehnder interferometer tuned so that every photon leaves through the bright port C, place in one arm an object that absorbs (or is triggered by) any photon passing it — Elitzur and Vaidman's "bomb". Then a single photon

- triggers the bomb with probability $\tfrac12$,
- reaches C with probability $\tfrac14$,
- reaches the normally dark port D with probability $\tfrac14$;

a click at D proves the bomb is there although no photon touched it. Repeating the interrogation in $N$ weak cycles (each rotating the photon's state by $\pi/2N$, with Zeno-style projection by the bomb) raises the interaction-free success probability to $\cos^{2N}(\pi/2N)\to1$.`,
      scope: String.raw`Idealized lossless optics and a perfectly absorbing object. Experiments (Kwiat, Weinfurter, Herzog, Zeilinger and Kasevich, 1995) reached interaction-free detection efficiencies above 50%, limited by losses.`,
      idea: String.raw`Without the bomb the two paths interfere: the amplitudes to reach D cancel exactly, those to reach C add (waves-6.9). The bomb is a which-path measurement (qm-1.12): it projects the photon onto one arm (5.7), destroying the cancellation, so the photon that took the other arm reaches each port with amplitude $\tfrac12$. In the Zeno version each cycle's small rotation is undone by the projection (5.19), so the photon stays in its initial mode with probability $\cos^{2N}(\pi/2N)$, while without the object the rotations accumulate to a full $\pi/2$ — the outcome flips depending on whether the object is there.`,
      caption: String.raw`**Elitzur–Vaidman:** a Mach–Zehnder interferometer; arrows on each path are the photon's amplitude (colour = phase, length = modulus), computed with beam splitters $\tfrac1{\sqrt2}\left(\begin{smallmatrix}1&i\\i&1\end{smallmatrix}\right)$. **Toggle the bomb**: without it D is dark; with it half the photons explode, and D lights up in a quarter of runs. Right: predicted probabilities and the frequencies among $N$ simulated photons. **Zeno version:** the photon's polarization is rotated by $\pi/2N$ per cycle; with the bomb (an absorber of the rotated component) each cycle projects it back, and the success probability climbs toward 1 with $N$, versus $\tfrac13$ for the single-pass scheme (fraction of non-exploding detections that are interaction-free).`,
      deps: ['qm-5.7', 'waves-6.9', 'qm-1.12', 'qm-5.19'],
      refs: ['Griffiths ch. 12'],
      credit: 'Elitzur & Vaidman, 1993',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Elitzur%E2%80%93Vaidman_bomb_tester' },
      tags: ['interaction-free measurement', 'interferometry', 'Zeno effect'],
      viz(v) {
        const Q = v.quantum();
        const mode = v.select('scheme', [{ value: 'ev', label: 'Elitzur–Vaidman (one pass)' }, { value: 'zeno', label: 'Zeno version ($N$ cycles)' }], 'ev', { onChange: (m) => { shots.el.hidden = m !== 'ev'; cyc.el.hidden = m === 'ev'; } });
        const bomb = v.toggle('bomb in the lower arm', true);
        const shots = v.slider('photons fired', 1, 10000, 1000, { int: true, log: true });
        const cyc = v.slider('cycles $N$', 1, 30, 6, { int: true }); cyc.el.hidden = true;
        const SD = v.stage({ x: [0, 10], y: [-1.0, 5.6], equal: true, axes: false, height: 320, weight: 1.35, title: 'the interferometer' });
        const SR = v.stage({ x: [-0.6, 2.6], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1, ylabel: 'probability', xticks: [[0, 'explodes'], [1, 'C (bright)'], [2, 'D (dark)']], title: 'outcomes' });
        const bs = (a, b) => [cadd(cscale(a, Math.SQRT1_2), cmul([0, Math.SQRT1_2], b)), cadd(cmul([0, Math.SQRT1_2], a), cscale(b, Math.SQRT1_2))];
        const arrowAmp = (x, y, z, dir = [1, 0]) => { if (cabs(z) < 1e-9) return; const L = 0.9 * cabs(z), c = Q.phaseColor(carg(z)); SD.arrow(x - (dir[0] * L) / 2, y - (dir[1] * L) / 2, x + (dir[0] * L) / 2, y + (dir[1] * L) / 2, { color: c, width: 4, head: 10 }); };
        let st = null;
        v.render(() => {
          v.legend(mode.value === 'ev' ? [['accent', 'quantum prediction (and amplitudes)', { area: true }], ['gold', 'simulated frequencies', { area: true }]] : [['green', 'interaction-free success $\\cos^{2N}(\\pi/2N)$', { dot: true }], ['orange', 'one-pass efficiency', { dash: true }]]);
          if (mode.value === 'ev') {
            SR.setView([-0.6, 2.6], [0, 1.12]); SR.setTicks([[0, 'explodes'], [1, 'C (bright)'], [2, 'D (dark)']], null); SR.setLabels(null, 'probability');
            // amplitudes: input in the horizontal mode a; BS1 → upper arm (a, transmitted) and lower arm (b, reflected, ×i)
            const [up, lo] = bs([1, 0], [0, 0]);
            const loAfter = bomb.value ? [0, 0] : lo;
            const [C, D] = bs(loAfter, up); // at BS2 the lower arm reaches C by transmission, the upper by reflection
            const pX = bomb.value ? cabs2(lo) : 0, pC = cabs2(C), pD = cabs2(D);
            // diagram geometry: source (0.4, 4.6) → BS1 (2, 4.6); upper arm to mirror (2, 5.6)? use a square: BS1 (2,4.5), M1 (7,4.5), M2 (2,1.5), BS2 (7,1.5)
            const P = { src: [0.75, 4.5], b1: [2.2, 4.5], m1: [7.2, 4.5], m2: [2.2, 1.5], b2: [7.2, 1.5], C: [9.3, 1.5], D: [7.2, -0.35] };
            const line = (p, q, o = {}) => SD.line(p[0], p[1], q[0], q[1], { color: 'muted', width: 1.6, ...o });
            line(P.src, P.b1); line(P.b1, P.m1); line(P.b1, P.m2); line(P.m1, P.b2); line(P.m2, P.b2, { alpha: bomb.value ? 0.35 : 1 }); line(P.b2, P.C); line(P.b2, P.D);
            const bsBox = (p, lab) => { SD.line(p[0] - 0.45, p[1] + 0.45, p[0] + 0.45, p[1] - 0.45, { color: 'teal', width: 4 }); SD.text(lab, p[0] - 0.55, p[1] + 0.55, { size: 11, color: 'teal', align: 'right' }); };
            bsBox(P.b1, 'BS1'); bsBox(P.b2, 'BS2');
            for (const p of [P.m1, P.m2]) SD.line(p[0] - 0.45, p[1] + 0.45, p[0] + 0.45, p[1] - 0.45, { color: 'ink', width: 5 });
            SD.rect(P.src[0] - 0.4, P.src[1] - 0.3, P.src[0] + 0.15, P.src[1] + 0.3, { fill: 'gold', fillAlpha: 0.5, color: 'gold', radius: 3 }); SD.text('photon', P.src[0] - 0.12, P.src[1] + 0.6, { size: 10.5, align: 'left', color: 'muted', dx: -14 });
            // detectors
            const det = (p, lab, prob, vertical) => { SD.circle(p[0], p[1], 0.38, { fill: prob > 1e-9 ? 'green' : 'grid', fillAlpha: 0.15 + 0.6 * prob, color: 'ink', width: 1.4 }); SD.text(lab, p[0] + (vertical ? 0.6 : 0), p[1] + (vertical ? 0 : 0.65), { size: 12, align: vertical ? 'left' : 'center', weight: 700 }); };
            det(P.C, 'C', pC, false); det(P.D, 'D', pD, true);
            // bomb on the lower arm (vertical segment b1 → m2)
            if (bomb.value) { SD.circle(2.2, 3.0, 0.42, { fill: 'red', fillAlpha: 0.65, color: 'red' }); SD.text('bomb', 2.75, 3.0, { size: 11, color: 'red' }); }
            // amplitude arrows
            arrowAmp(1.3, 4.5, [1, 0]); arrowAmp(4.7, 4.5, up); arrowAmp(2.2, 3.9, lo, [0, -1]); if (!bomb.value) arrowAmp(2.2, 2.1, lo, [0, -1]);
            arrowAmp(7.2, 3.0, up, [0, -1]); if (!bomb.value) arrowAmp(4.7, 1.5, lo);
            arrowAmp(8.3, 1.5, C); arrowAmp(7.2, 0.6, D, [0, -1]);
            // outcome bars + simulation
            const N = shots.value, r = v.rng(90 + (bomb.value ? 1 : 0)), probs = [pX, pC, pD], cnt = [0, 0, 0];
            for (let k = 0; k < N; k++) cnt[sampleIdx(r, probs)]++;
            probs.forEach((p, k) => {
              SR.rect(k - 0.36, 0, k + 0.02, p, { fill: 'accent', fillAlpha: 0.5, color: 'accent' });
              SR.rect(k + 0.02, 0, k + 0.36, cnt[k] / N, { fill: 'gold', fillAlpha: 0.6, color: 'gold' });
              SR.text(v.fix(p, 3), k - 0.17, p, { dy: -9, size: 10.5, align: 'center', color: 'accent' });
            });
            st = { m: 'ev', probs, cnt, N, eff: pD / (pD + pX || 1) };
          } else {
            const N = cyc.value, th = Math.PI / (2 * N);
            SR.setView([0.5, 30.5], [0, 1.05]); SR.setTicks(null, null); SR.setLabels('cycles N', 'probability');
            // diagram: a row of cycles with the polarization arrow after each
            const show = Math.min(N, 12), w = 9 / show;
            let amp = [1, 0], alive = 1;
            SD.text(bomb.value ? 'with the absorber: each cycle projects back onto H' : 'no absorber: the rotations add up to V', 5, 5.2, { align: 'center', size: 12, color: bomb.value ? 'green' : 'muted' });
            for (let j = 0; j < show; j++) {
              const cx = 0.5 + w * (j + 0.5), cy = 2.9, R = Math.min(0.42 * w, 0.9), L = R * Math.sqrt(alive);
              // rotate by θ
              const a = Math.cos(th) * amp[0] - Math.sin(th) * amp[1], b = Math.sin(th) * amp[0] + Math.cos(th) * amp[1];
              amp = [a, b];
              SD.circle(cx, cy, R, { color: 'faint', width: 1 });
              SD.line(cx - R, cy, cx + R, cy, { color: 'faint', width: 0.6 }); SD.line(cx, cy - R, cx, cy + R, { color: 'faint', width: 0.6 });
              SD.arrow(cx, cy, cx + L * amp[0], cy + L * amp[1], { color: 'accent', width: 2.4, head: 7 });
              if (bomb.value) {
                SD.line(cx + L * amp[0], cy, cx + L * amp[0], cy + L * amp[1], { color: 'red', width: 2.2 });
                alive *= amp[0] ** 2; amp = [1, 0];
              }
              SD.text(`${j + 1}`, cx, cy + R + 0.3, { size: 10, align: 'center', color: 'muted' });
              SD.text(bomb.value ? `${v.fix(100 * alive, 1)}%` : `${v.fix((Math.atan2(amp[1], amp[0]) * 180) / Math.PI, 0)}°`, cx, cy - R - 0.32, { size: 9.5, align: 'center', color: bomb.value ? 'green' : 'accent' });
            }
            SD.text(bomb.value ? 'green: probability not yet absorbed' : 'blue: polarization angle', 5, 1.3, { size: 10.5, align: 'center', color: 'muted' });
            if (N > show) SD.text(`… (${N} cycles; first 12 shown)`, 5, 1.9, { size: 11, align: 'center', color: 'muted' });
            SD.text('arrow = polarization after each rotation by π/2N' + (bomb.value ? '; red = component absorbed' : ''), 5, 0.6, { size: 10.5, align: 'center', color: 'muted' });
            // probabilities vs N
            SR.fn((n) => Math.cos(Math.PI / (2 * n)) ** (2 * n), { color: 'green', width: 1.2, alpha: 0.5, domain: [1, 30.5] });
            for (let n = 1; n <= 30; n++) SR.dot(n, Math.cos(Math.PI / (2 * n)) ** (2 * n), { r: 2.8, color: 'green' });
            SR.hline(1 / 3, { color: 'orange', width: 1.4, dash: [5, 4] }); SR.text('one-pass EV: 1/3', 30, 1 / 3, { align: 'right', dy: -10, size: 10.5, color: 'orange' });
            const pS = Math.cos(th) ** (2 * N); SR.dot(N, pS, { r: 6, color: 'green' });
            st = { m: 'zeno', N, pS, noBomb: Math.sin(N * th) ** 2 };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'ev') return `${bomb.value ? 'Bomb present' : 'No bomb'}: $P(\\text{explode}) = ${v.fix(st.probs[0], 3)}$, $P(C) = ${v.fix(st.probs[1], 3)}$, $P(D) = ${v.fix(st.probs[2], 3)}$. Of ${st.N} simulated photons: ${st.cnt[0]} explosions, ${st.cnt[1]} at C, ${st.cnt[2]} at D. ${bomb.value ? `Every click at D (${st.cnt[2]} of them) certifies the bomb without touching it; efficiency $P(D)/(P(D)+P(\\text{explode})) = ${v.fix(st.eff, 3)}$.` : 'D never clicks: destructive interference.'}`;
          return `$N = ${st.N}$ cycles: with the absorber the photon survives every cycle with probability $\\cos^{2N}(\\pi/2N) = ${v.fix(st.pS, 4)}$ and exits still horizontally polarized — the object is detected without absorption. Without it the polarization ends vertical with probability $\\sin^2(N\\pi/2N) = ${v.fix(st.noBomb, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.22
    {
      num: '5.22',
      kind: 'Paper',
      name: 'Quantentheoretische Umdeutung kinematischer Beziehungen',
      paper: { authors: 'W. Heisenberg', year: 1925, title: 'Über quantentheoretische Umdeutung kinematischer und mechanischer Beziehungen', venue: 'Zeitschrift für Physik 33: 879–893', doi: '10.1007/BF01328377' },
      introduces: [],
      statement: String.raw`Heisenberg proposed to build atomic mechanics only from observable quantities — transition frequencies $\omega(n,n-\alpha)$ and amplitudes $x(n,n-\alpha)$ — instead of unobservable electron orbits. He replaced the classical Fourier series $x(t)=\sum_\alpha a_\alpha(n)e^{i\alpha\omega(n)t}$ by the array $x(n,m)e^{i\omega(n,m)t}$ with Ritz-combining frequencies $\omega(n,m)=(E_n-E_m)/\hbar$, which forces the multiplication rule $(xy)(n,m)=\sum_kx(n,k)\,y(k,m)$ — non-commutative. Keeping Newton's equation of motion and replacing the Bohr–Sommerfeld condition by its differentiated form (the Thomas–Kuhn sum rule $\sum_k(E_k-E_n)|x(n,k)|^2=\hbar^2/2m$), he computed the harmonic oscillator's energies $E_n=(n+\tfrac12)\hbar\omega$ — with a zero-point energy — and first-order energies of anharmonic oscillators, e.g. for $\ddot x+\omega^2x+\lambda x^3=0$: $E_n=(n+\tfrac12)\hbar\omega+\tfrac{3\lambda\hbar^2}{8m\omega^2}\big(n^2+n+\tfrac12\big)$, which differs from the old quantum theory's $\big(n+\tfrac12\big)^2$ by a quantum term.`,
      idea: String.raw`By 1925 the Bohr–Sommerfeld rules (qm-1.7) worked for hydrogen but failed for helium, the anomalous Zeeman effect and intensities; the correspondence principle (qm-1.6) linked spectral lines to Fourier components of orbits. Heisenberg's reinterpretation (*Umdeutung*) kept the formal structure of classical mechanics but replaced each Fourier component by a transition between two stationary states (Bohr 1913, qm-1.16; Rydberg–Ritz combination, qm-1.4). Within months Born and Jordan recognized his arrays as matrices and derived $[x,p]=i\hbar$ (5.9); Born, Heisenberg and Jordan built matrix mechanics, Dirac its algebra of q-numbers (5.17), and Schrödinger proved it equivalent to wave mechanics — the formalism of this whole chapter.`,
      caption: String.raw`A recreation of the paper's calculation with today's matrices ($\hbar=m=\omega=1$). **Arrays:** the oscillator's $x(n,m)$ — only $m=n\pm1$, i.e. a single classical harmonic — with Heisenberg's product $x\cdot x$; **click any entry of $x^2$** to see the row and column whose products sum to it. **Quantum condition:** the sum rule fixes $|x(n,n+1)|^2$ rung by rung from $x(0,-1)=0$; the energy array $\tfrac12(p^2+x^2)$ then comes out *diagonal* with $E_n=n+\tfrac12$. **Anharmonic:** for $V=\tfrac12x^2+\tfrac\lambda4x^4$ (his second example) the first-order shift is $\tfrac{3\lambda}8\times$ ($n^2+n+\tfrac12$ for Heisenberg, $(n+\tfrac12)^2$ or $n^2$ in the old quantum theory with $J=(n+\tfrac12)\hbar$ or $J=n\hbar$). The plot shows $\big[E_n-(n+\tfrac12)\big]/\tfrac{3\lambda}8-(n+\tfrac12)^2$: the exact levels from diagonalizing an $80\times80$ matrix (bars) sit on Heisenberg's $+\tfrac14$ (green), not on 0 (orange) or $-(n+\tfrac14)$ (red). **Slide $\lambda$** down and the bars settle onto $\tfrac14$; up, and second-order terms pull the high levels away.`,
      deps: ['qm-1.4', 'qm-1.6', 'qm-1.7', 'qm-1.16'],
      see: ['qm-5.9', 'qm-4.3'],
      refs: [],
      credit: 'Heisenberg, 1925',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Matrix_mechanics', doi: 'https://doi.org/10.1007/BF01328377' },
      tags: ['matrix mechanics', 'Umdeutung', 'anharmonic oscillator'],
      viz(v) {
        const M = v.M;
        const step = v.select('part', [{ value: 'arr', label: 'arrays and the product rule' }, { value: 'qc', label: 'quantum condition → $E_n$' }, { value: 'anh', label: 'anharmonic oscillator' }], 'arr', { onChange: (m) => show(m) });
        const NN = v.slider('array size', 4, 9, 6, { int: true });
        const lam = v.slider('$\\lambda$ (strength of $\\frac\\lambda4x^4$)', 1e-4, 0.05, 0.002, { log: true });
        const SA = v.stage({ x: [0, 20], y: [-1.5, 7.5], equal: true, axes: false, height: 330, full: true });
        const SP = v.stage({ x: [-0.6, 6.6], y: [-0.45, 0.42], axes: 'box', gutter: true, height: 330, full: true, xlabel: 'n', ylabel: 'energy shift ÷ (3λ/8)  −  (n + ½)²' });
        const show = (m) => { SA.el.style.display = m === 'anh' ? 'none' : ''; SP.el.style.display = m === 'anh' ? '' : 'none'; lam.el.hidden = m !== 'anh'; NN.el.hidden = m === 'anh'; };
        show('arr');
        let pick = [1, 3];
        SA.onClick((X, Y) => { if (step.value !== 'arr' || !geo) return; const { x0, y0, u, N } = geo; const j = Math.floor((X - x0) / u), i = Math.floor((y0 + N * u - Y) / u); if (i >= 0 && j >= 0 && i < N && j < N) { pick = [i, j]; v.invalidate(); } });
        let geo = null, st = null, exactCache = null;
        v.render(() => {
          const N = NN.value;
          v.legend(step.value === 'arr' ? [['accent', 'entry (disc area ∝ size)', { dot: true }], ['gold', 'row $n$ of the left factor, column $m$ of the right'], ['green', 'the product entry']]
            : step.value === 'qc' ? [['accent', '$|x(n,n+1)|^2$ from the quantum condition', { area: true }], ['accent', 'energy array $\\tfrac12(p^2+x^2)$', { dot: true }]]
            : [['accent', 'exact diagonalization (80 levels)', { area: true }], ['green', 'Heisenberg 1925, first order', { dot: true }], ['orange', 'old quantum theory, $J=(n+\\frac12)\\hbar$'], ['red', 'old quantum theory, $J=n\\hbar$', { dot: true }]]);
          if (step.value === 'arr') {
            const X = cplx(oscX(N)), X2 = mmul(X, X), u = Math.min(1, 6 / N), W = N * u;
            const xs = [0.4, 0.4 + W + 1.4, 0.4 + 2 * W + 3.0];
            SA.setView([0, xs[2] + W + 0.4], [-1.5, Math.max(7.2, W + 1.4)]);
            const y0 = 0.2; geo = { x0: xs[2], y0, u, N };
            const [pi, pj] = pick.map((q) => Math.min(q, N - 1));
            cells(v, SA, X, [xs[0], y0, xs[0] + W, y0 + W], { max: Math.sqrt(N / 2), text: N <= 7 ? (z) => (Math.abs(z[0]) < 1e-12 ? null : v.fix(z[0], 2)) : null, size: 9.5, hi: (i, j) => (i === pi ? 'gold' : null) });
            cells(v, SA, X, [xs[1], y0, xs[1] + W, y0 + W], { max: Math.sqrt(N / 2), text: N <= 7 ? (z) => (Math.abs(z[0]) < 1e-12 ? null : v.fix(z[0], 2)) : null, size: 9.5, hi: (i, j) => (j === pj ? 'gold' : null) });
            cells(v, SA, X2, [xs[2], y0, xs[2] + W, y0 + W], { max: N - 0.5, text: N <= 7 ? (z) => (Math.abs(z[0]) < 1e-12 ? null : v.fix(z[0], 2)) : null, size: 9.5, hi: (i, j) => (i === pi && j === pj ? 'green' : null) });
            SA.text('×', xs[1] - 0.7, y0 + W / 2, { size: 20, align: 'center', color: 'muted' }); SA.text('=', xs[2] - 0.8, y0 + W / 2, { size: 20, align: 'center', color: 'muted' });
            SA.text('$x(n,m)$', xs[0] + W / 2, y0 + W + 0.5, { align: 'center', size: 14 }); SA.text('$x(n,m)$', xs[1] + W / 2, y0 + W + 0.5, { align: 'center', size: 14 }); SA.text('$(x^2)(n,m)=\\sum_k x(n,k)\\,x(k,m)$', xs[2] + W / 2, y0 + W + 0.5, { align: 'center', size: 13 });
            SA.text('rows n, columns m: transition n → m oscillates at ω(n,m) = (Eₙ − Eₘ)/ħ', (xs[0] + xs[2] + W) / 2, -0.7, { align: 'center', size: 11, color: 'muted' });
            const terms = []; for (let k = 0; k < N; k++) { const a = X[pi][k][0], b = X[k][pj][0]; if (Math.abs(a * b) > 1e-12) terms.push([k, a, b]); }
            st = { m: 'arr', pi, pj, terms, val: X2[pi][pj][0], N };
          } else if (step.value === 'qc') {
            // recursion from the sum rule: (E_{n+1}−E_n)|x_{n,n+1}|² − (E_n−E_{n−1})|x_{n−1,n}|² = 1/2 with E_{n+1} − E_n = ω = 1
            const a2 = []; let prev = 0; for (let n = 0; n < N; n++) { const val = prev + 0.5; a2.push(val); prev = val; } // |x(n,n+1)|² = (n+1)/2
            const X = mat(N, N, (i, j) => (j === i + 1 ? Math.sqrt(a2[i]) : i === j + 1 ? Math.sqrt(a2[j]) : 0));
            const P = mat(N, N, (i, j) => (i === j + 1 ? [0, Math.sqrt(a2[j])] : j === i + 1 ? [0, -Math.sqrt(a2[i])] : 0)); // p = m ẋ, ẋ(n,m) = iω(n,m) x(n,m)
            const H = mscale(madd(mmul(P, P), mmul(X, X)), 0.5);
            const u = Math.min(1, 6 / N), W = N * u;
            SA.setView([0, 11.5 + W + 0.5], [-0.8, Math.max(7.0, W + 1.3)]);
            // left: the ladder of |x(n,n+1)|²
            const bx = 0.6, bw = 7.5, top = Math.max(...a2);
            a2.forEach((q, n) => { const y = 0.3 + (n * W) / N, h = (0.7 * W) / N, len = (bw * q) / top; SA.rect(bx, y, bx + len, y + h, { fill: 'accent', fillAlpha: 0.5, color: 'accent', radius: 2 }); SA.text(`|x(${n},${n + 1})|² = ${v.fix(q, 1)}`, bx + len + 0.15, y + h / 2, { size: 10, color: 'ink' }); });
            SA.text('built rung by rung from x(0,−1) = 0', bx, W + 0.75, { size: 11, color: 'muted' });
            // right: H array
            const hx = 11.5;
            cells(v, SA, H, [hx, 0.2, hx + W, 0.2 + W], { max: N, text: N <= 8 ? (z) => (cabs(z) < 1e-12 ? null : v.fix(z[0], 2)) : null, size: 9.5 });
            SA.text('$\\tfrac12(p^2+x^2)$ — diagonal!', hx + W / 2, W + 0.75, { align: 'center', size: 13 });
            SA.text('corner: truncation artifact', hx + W, 0.2 - 0.35, { align: 'right', size: 10, color: 'muted' });
            let off = 0; for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) if (i !== j) off = Math.max(off, cabs(H[i][j]));
            st = { m: 'qc', E: Array.from({ length: N - 1 }, (_, n) => H[n][n][0]), off };
          } else {
            const l = lam.value;
            if (!exactCache || exactCache.l !== l) { const O = oscH(80, l); const vals = M.eigSym(O.H).values.slice().sort((a, b) => a - b); exactCache = { l, vals }; }
            const ex = exactCache.vals, K = 7, c = (3 * l) / 8;
            // normalized: shift/(3λ/8) − (n+½)²  → Heisenberg ¼, old quantum theory with J=(n+½)ħ: 0, with J=nħ: −(n+¼)
            SP.hline(0.25, { color: 'green', width: 1.6, dash: [6, 4] }); SP.text('Heisenberg: n² + n + ½ → +¼', 6.5, 0.25, { align: 'right', dy: -11, size: 11, color: 'green' });
            SP.hline(0, { color: 'orange', width: 1.6, dash: [6, 4] }); SP.text('old theory, J = (n+½)ħ: (n+½)² → 0', 1.0, 0, { align: 'left', dy: 12, size: 11, color: 'orange' });
            const ys = [];
            for (let n = 0; n < K; n++) {
              const y = (ex[n] - (n + 0.5)) / c - (n + 0.5) ** 2; ys.push(y);
              SP.rect(n - 0.3, Math.min(0, y), n + 0.3, Math.max(0, y), { fill: 'accent', fillAlpha: 0.45, color: 'accent' });
              SP.dot(n, 0.25, { r: 4.5, color: 'green' });
              const yr = -(n + 0.25); if (yr > -0.45) SP.dot(n, yr, { r: 4, color: 'red' });
            }
            SP.text('old theory, J = nħ: n² → −(n+¼), off scale for n ≥ 1', 0.1, -0.25, { size: 10.5, color: 'red', dx: 8 });
            st = { m: 'anh', l, ys, e0: ex[0], h0: 0.5 + c * 0.5, b0: 0.5 + c * 0.25, j0: 0.5 };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'arr') return `$(x^2)(${st.pi},${st.pj}) = ${st.terms.length ? st.terms.map(([k, a, b]) => `x(${st.pi},${k})\\,x(${k},${st.pj})`).join('+') : '0'} = ${v.fix(st.val, 4)}$. Only intermediate states $k=n\\pm1$ contribute; the diagonal $(x^2)(n,n)=n+\\tfrac12$ is the quantum mean of $x^2$, the off-diagonal entries oscillate at $\\pm2\\omega$ — the second harmonic.`;
          if (st.m === 'qc') return `Energies from the arrays: $E_n = ${st.E.map((e) => v.fix(e, 3)).join(',\\ ')}$ $=(n+\\tfrac12)\\hbar\\omega$ — including the zero-point energy $E_0=\\tfrac12\\hbar\\omega$, absent in the old quantum theory. Largest off-diagonal entry of $\\tfrac12(p^2+x^2)$ (truncation corner excluded): $${v.sci(Math.max(st.off, 1e-17), 1)}$ — energy is conserved, the array is diagonal.`;
          return `$\\lambda = ${v.sci(st.l, 2)}$: exact levels give ${st.ys.slice(0, 4).map((y, n) => `$${v.fix(y, 3)}$ ($n=${n}$)`).join(', ')} — tending to Heisenberg's $\\tfrac14$ as $\\lambda\\to0$ (the drift at larger $n$ is the second-order term $\\propto\\lambda n^3$). Ground state: exact $E_0 = ${v.fix(st.e0, 7)}$, Heisenberg $\\tfrac12+\\tfrac{3\\lambda}{16} = ${v.fix(st.h0, 7)}$, old theory $${v.fix(st.b0, 7)}$ ($J=(n+\\frac12)\\hbar$) or $${v.fix(st.j0, 7)}$ ($J=n\\hbar$).`;
        });
      },
    },
  ],
};
