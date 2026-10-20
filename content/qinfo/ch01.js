// Quantum Information & Computation — Chapter 1: Qubits, gates and measurement
import {
  TAU, R2, cmul, cabs, cabs2, carg, cis, cscale, polar, mvec, mmul, adj, msub, fnorm, eye2,
  GATE, rn, rotate3, unit3, norm3, dot3, sub3, blochOf, stateOf, so3, mat3vec, axisAngle, zyz, rzyz, rz, ry, randU, unitaryError,
  texC, txtC, texMat, texVec3, texAngle, cells, tilesR, dial, blochFrame, sphereOutline, blochStage, stateArrow, arcPts, sphereHandle, drawGroups,
} from './ch01.shared.js';

const KET = (p) => `|${p}\\rangle`;

export default {
  collection: 'qinfo',
  chapter: 1,
  title: 'Qubits, gates and measurement',
  summary: String.raw`Starting from spin-½ quantum mechanics and the Bloch sphere, a qubit becomes a programmable object: every single-qubit gate is a rotation of the sphere, so gates are built from Pauli rotations and the Hadamard and decomposed into Euler angles. Non-orthogonal states cannot be told apart with certainty — the Helstrom bound says how well one can do — generalized measurements extend the toolkit, and a Mach–Zehnder interferometer is a qubit circuit made of light.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Qubit and the computational basis',
      statement: String.raw`A **qubit** is a quantum system whose state space is $\C^2$ with a distinguished orthonormal **computational basis** $|0\rangle,|1\rangle$. A pure state is a unit vector $|\psi\rangle=\alpha|0\rangle+\beta|1\rangle$ with $\alpha,\beta\in\C$ and $|\alpha|^2+|\beta|^2=1$, defined up to a global phase $e^{i\gamma}$. Measuring in the computational basis returns $0$ with probability $|\alpha|^2$ and $1$ with probability $|\beta|^2$ (Born rule), and leaves the qubit in the state that was found. Repeating the experiment on freshly prepared copies, the frequencies of $0$ and $1$ converge to $|\alpha|^2$ and $|\beta|^2$.`,
      idea: String.raw`Two complex numbers carry four real parameters; normalization removes one and the unobservable global phase another, so a qubit has two real degrees of freedom — a point on the Bloch sphere (qm-7.10). The Born rule (qm-5.7) turns the amplitudes into probabilities, so a single shot gives one bit but the amplitudes can only be learned statistically: by the law of large numbers the relative frequency of outcome $1$ after $n$ shots lies within about $2\sqrt{p(1-p)/n}$ of $p=|\beta|^2$.

For repeated independent preparations and measurements, let $X_j$ indicate outcome 1. These indicators are identically distributed, independent and integrable, with mean $p=|\beta|^2$. The strong law prob-2.4.1 therefore gives almost-sure convergence of their average to p. This proves the stated frequency limit; the preceding two-standard-deviation scale is a finite-shot heuristic, not a conclusion of that law or a guaranteed confidence interval.`,
      caption: String.raw`**Drag the two arrow tips**: the amplitudes $\alpha,\beta$ are kept normalized (making one longer shrinks the other), arrow colour is the phase. Bars: pale = $|\alpha|^2,|\beta|^2$, gold = frequencies of the simulated shots. Raise the number of shots and watch the running frequency (right) settle inside its $\pm2\sigma$ band. The same random numbers are reused as you drag, so the histogram moves smoothly.`,
      deps: ['qm-5.1', 'qm-7.7', 'ladr-6.27', 'prob-2.4.1'],
      refs: ['Nielsen–Chuang §1.2', 'Nielsen–Chuang §2.2.1'],
      tags: ['qubit', 'Born rule', 'computational basis'],
      credit: String.raw`the word "qubit": B. Schumacher, 1995 (Phys. Rev. A 51, 2738), who credits W. K. Wootters for the term`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Qubit' },
      viz(v) {
        const D = v.stage({ x: [-2.9, 2.9], y: [-1.5, 1.9], equal: true, axes: false, height: 250, weight: 1.15, title: 'amplitudes $\\alpha,\\beta\\in\\mathbb C$' });
        const H = v.stage({ x: [-0.1, 2.1], y: [-0.2, 1.22], axes: false, height: 250, weight: 0.85, title: 'one measurement, many shots' });
        const Cv = v.stage({ x: [1, 20000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 250, weight: 1.2, xlabel: 'shots $n$', ylabel: 'frequency of outcome 1', title: 'convergence' });
        const N = v.slider('shots $n$', 1, 20000, 300, { log: true, int: true });
        const R = 1, cA = [-1.5, 0], cB = [1.5, 0];
        let ma = 1 / Math.SQRT2, pa = 0, pb = 0.8; // |α|, arg α, arg β
        const tip = (c, m, p) => [c[0] + R * m * Math.cos(p), c[1] + R * m * Math.sin(p)];
        const clampD = (c) => (x, y) => { const dx = x - c[0], dy = y - c[1], r = Math.hypot(dx, dy); return r > R ? [c[0] + dx / r * R, c[1] + dy / r * R] : [x, y]; };
        const hA = D.handle(...tip(cA, ma, pa), { color: 'accent', r: 6.5, constrain: clampD(cA) });
        const hB = D.handle(...tip(cB, Math.sqrt(1 - ma * ma), pb), { color: 'accent', r: 6.5, constrain: clampD(cB) });
        hA.onDrag = () => { const dx = hA.x - cA[0], dy = hA.y - cA[1], r = Math.min(1, Math.hypot(dx, dy) / R); ma = r; if (r > 1e-3) pa = Math.atan2(dy, dx); };
        hB.onDrag = () => { const dx = hB.x - cB[0], dy = hB.y - cB[1], r = Math.min(1, Math.hypot(dx, dy) / R); ma = Math.sqrt(Math.max(0, 1 - r * r)); if (r > 1e-3) pb = Math.atan2(dy, dx); };
        const presets = [['|0⟩', 1, 0, 0], ['|1⟩', 0, 0, 0], ['|+⟩', R2, 0, 0], ['|−⟩', R2, 0, Math.PI], ['|+i⟩', R2, 0, Math.PI / 2]];
        for (const [name, m, a, b] of presets) v.button(name, () => { ma = m; pa = a; pb = b; });
        const U = v.rng(11), us = new Float64Array(20000); for (let i = 0; i < us.length; i++) us[i] = U();
        let st = null;
        v.render(() => {
          const mb = Math.sqrt(Math.max(0, 1 - ma * ma)), a = polar(ma, pa), b = polar(mb, pb);
          hA.set(...tip(cA, ma, pa)); hB.set(...tip(cB, mb, pb));
          dial(v, D, cA[0], cA[1], R, a, { label: '\\alpha' }); dial(v, D, cB[0], cB[1], R, b, { label: '\\beta' });
          D.text(`|α|² = ${v.fix(ma * ma, 3)}`, cA[0], -1.28, { align: 'center', size: 12 });
          D.text(`|β|² = ${v.fix(mb * mb, 3)}`, cB[0], -1.28, { align: 'center', size: 12 });
          const p1 = mb * mb, n = N.value;
          let k = 0; const cum = new Float64Array(n + 1); for (let i = 0; i < n; i++) { if (us[i] < p1) k++; cum[i + 1] = k; }
          const f1 = k / n, f0 = 1 - f1;
          drawGroups(v, H, [{ probs: [ma * ma, p1], freq: [f0, f1], names: ['0', '1'], colors: ['accent', 'orange'] }]);
          H.text('gold bars: measured', 1, 1.17, { size: 11, align: 'center', color: 'gold' });
          const sd = (m) => 2 * Math.sqrt(p1 * (1 - p1) / m);
          const pts = [], hi = [], lo = []; const M = 140;
          for (let j = 0; j <= M; j++) { const m = Math.max(1, Math.round(Math.exp(Math.log(20000) * j / M))); if (m <= n) { pts.push([m, cum[m] / m]); } hi.push([m, Math.min(1, p1 + sd(m))]); lo.push([m, Math.max(0, p1 - sd(m))]); }
          Cv.path(hi, { color: 'accent', alpha: 0.4, width: 1 }); Cv.path(lo, { color: 'accent', alpha: 0.4, width: 1 });
          Cv.poly([...hi, ...lo.slice().reverse()], { fill: 'accent', fillAlpha: 0.08, stroke: false });
          Cv.hline(p1, { color: 'accent', width: 1.6 });
          Cv.path(pts, { color: 'gold', width: 2 });
          Cv.vline(n, { color: 'muted', width: 1, dash: true });
          st = { a, b, p1, n, k, f1, z: (f1 - p1) / Math.max(1e-9, Math.sqrt(p1 * (1 - p1) / n)) };
        });
        v.legend([['accent', 'probability $|\\beta|^2$ with $\\pm2\\sigma$ band'], ['gold', 'measured frequency of $1$']]);
        v.readout(() => {
          const { a, b, p1, n, k, z } = st;
          return `$|\\psi\\rangle = (${texC(v, a, 3)})|0\\rangle + (${texC(v, b, 3)})|1\\rangle$, $\\;|\\alpha|^2+|\\beta|^2 = ${v.fix(cabs2(a) + cabs2(b), 6)}$\n` +
            `${n} shots: ${n - k} zeros, ${k} ones $\\Rightarrow$ frequency of $1$ is $${v.fix(k / n, 4)}$ vs $|\\beta|^2=${v.fix(p1, 4)}$ (${v.fix(Math.abs(z), 2)} standard deviations away)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Single-qubit gates are Bloch-sphere rotations',
      statement: String.raw`Let $U$ be a $2\times2$ unitary acting on a qubit whose Bloch vector is $\mathbf r$. Then $U\rho U^\dagger$ has Bloch vector $R_U\mathbf r$, where $R_U\in SO(3)$ has entries $(R_U)_{ij}=\tfrac12\operatorname{tr}(\sigma_iU\sigma_jU^\dagger)$. Conversely every rotation arises this way, and $U=e^{i\gamma}R_{\hat n}(\theta)$ with $R_{\hat n}(\theta)=e^{-i\theta\,\hat n\cdot\boldsymbol\sigma/2}=\cos\tfrac\theta2\,I-i\sin\tfrac\theta2\,\hat n\cdot\boldsymbol\sigma$ rotates the sphere by the angle $\theta$ about the axis $\hat n$. The global phase $\gamma$ is invisible. So $X,Y,Z$ are half-turns about the axes, $S$ and $T$ are quarter- and eighth-turns about $z$, and $H$ is a half-turn about $(\hat x+\hat z)/\sqrt2$.`,
      idea: String.raw`Conjugation $\rho\mapsto U\rho U^\dagger$ is linear in $\rho=\tfrac12(I+\mathbf r\cdot\boldsymbol\sigma)$ and preserves the trace and the determinant, hence the length $|\mathbf r|$; so it acts on $\mathbf r$ as an orthogonal matrix, and a continuous path from $I$ (a product of exponentials $e^{-i\theta\hat n\cdot\sigma/2}$) keeps $\det R=+1$. The identity $(\hat n\cdot\sigma)^2=I$ gives the closed form of $R_{\hat n}(\theta)$, and the half-angle $\theta/2$ is why $\theta=2\pi$ gives $-I$ on $\C^2$ (a global phase) but the identity on the sphere. This is the spin-½ rotation of qm-7.10 with the Hamiltonian $\tfrac\omega2\hat n\cdot\sigma$ read as a quantum gate.`,
      caption: String.raw`**Drag the state** (blue) and, for the free rotation $R_n(\theta)$, the green rotation axis; drag the background to turn the sphere. Choose a gate and press **Apply**: the state sweeps along the orange arc to its image (hollow ring, preview). The tiles show the unitary $U$ (disc size $=|u_{ij}|$, colour = phase) and the $3\times3$ rotation matrix computed from it. The readout compares $U|\psi\rangle$ with $R_U\mathbf r$ — they agree to rounding.`,
      deps: ['qinfo-1.1', 'qm-7.10', 'ladr-7.51'],
      refs: ['Nielsen–Chuang §4.2', 'Nielsen–Chuang §1.3.1'],
      tags: ['Bloch sphere', 'gates', 'SU(2)'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bloch_sphere' },
      viz(v) {
        const { S, sc } = blochStage(v, { height: 360, weight: 1.35, title: 'Bloch sphere' });
        const T = v.stage({ x: [0, 10], y: [0, 13.5], equal: true, axes: false, height: 360, weight: 0.8, title: 'the gate as a matrix and as a rotation' });
        const gate = v.select('gate', [{ value: 'H', label: '$H$' }, { value: 'X', label: '$X$' }, { value: 'Y', label: '$Y$' }, { value: 'Z', label: '$Z$' }, { value: 'S', label: '$S$' }, { value: 'T', label: '$T$' }, { value: 'Sdg', label: '$S^\\dagger$' }, { value: 'Tdg', label: '$T^\\dagger$' }, { value: 'R', label: '$R_n(\\theta)$' }], 'H');
        const th = v.slider('$R_n(\\theta)$: angle $\\theta$', 0, TAU, Math.PI / 2, { step: 0.01 });
        const prog = v.slider('sweep', 0, 1, 0.55, { step: 0.005 });
        const hPsi = sphereHandle(sc, [0.55, 0.25, 0.8], { color: 'accent', label: 'ψ' });
        const hAx = sphereHandle(sc, unit3([0.4, 0.7, 0.6]), { color: 'green', label: 'n' });
        let raf = 0, hist = [];
        const unitary = () => (gate.value === 'R' ? rn(hAx.p, th.value) : GATE[gate.value]());
        const apply = () => {
          if (raf) return; const t0 = performance.now(), U = unitary(), AA = axisAngle(U), r0 = hPsi.p.slice();
          hPsi.visible = false;
          const tick = (now) => {
            const s = Math.min(1, (now - t0) / 1300); prog.set(s);
            if (s < 1) raf = requestAnimationFrame(tick);
            else { raf = 0; hist.push({ r: r0, axis: AA.axis, angle: AA.angle, name: gate.value }); if (hist.length > 6) hist.shift(); hPsi.set(blochOf(mvec(U, stateOf(r0)))); hPsi.visible = true; prog.set(0); }
          };
          raf = requestAnimationFrame(tick);
        };
        v.button('Apply gate', apply);
        v.button('Reset', () => { cancelAnimationFrame(raf); raf = 0; hist = []; hPsi.visible = true; hPsi.set(unit3([0.55, 0.25, 0.8])); prog.set(0.55); });
        v.onCleanup(() => cancelAnimationFrame(raf));
        v.render(() => {
          hAx.visible = gate.value === 'R'; th.el.hidden = gate.value !== 'R';
          const U = unitary(), AA = axisAngle(U), R = so3(U), r = hPsi.p.slice(), s = prog.value;
          const rs = rotate3(r, AA.axis, s * AA.angle), out = mat3vec(R, r);
          sc.begin(); sphereOutline(S); blochFrame(sc);
          for (const h of hist) sc.path(arcPts(h.r, h.axis, h.angle), { color: 'gold', width: 1.6, alpha: 0.55 });
          if (!AA.identity) { sc.line(AA.axis.map((x) => -1.3 * x), AA.axis.map((x) => 1.3 * x), { color: 'green', width: 1.8, dash: true }); const q = sc.P(AA.axis.map((x) => 1.42 * x)); S.tex('\\hat n', q[0], q[1], { color: 'green', size: 13, align: 'center' }); }
          sc.path(arcPts(r, AA.axis, AA.angle), { color: 'orange', width: 2.2, dash: true });
          sc.dot(out, { color: 'orange', r: 6, hollow: true });
          if (hPsi.visible === false || s > 0) stateArrow(S, sc, rs, '', 'accent'); else sc.arrow([0, 0, 0], r, { color: 'accent', width: 2.8, head: 10 });
          sc.flush();
          // matrices
          T.text('U', 0.5, 13.2, { size: 15, color: 'muted', math: true });
          cells(v, T, U, [1.5, 9.1, 8.5, 13], { text: (z) => txtC(v, z, 2) });
          T.text('R', 0.5, 7.9, { size: 15, color: 'muted', math: true }); T.text('(rotation of the sphere)', 1.6, 8.1, { size: 11, color: 'muted', align: 'left' });
          tilesR(v, T, R, [1, 3.4, 9, 7.7]);
          T.text(AA.identity ? 'identity' : `axis n̂ = (${AA.axis.map((x) => v.fix(Math.abs(x) < 5e-4 ? 0 : x, 3)).join(', ')})`, 5, 2.5, { size: 12, align: 'center' });
          T.text(`angle θ = ${v.fix(AA.angle, 3)} rad = ${v.fix(AA.angle / Math.PI, 3)}π`, 5, 1.4, { size: 12, align: 'center' });
          T.text(`det R = ${v.fix(R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]), 4)}`, 5, 0.4, { size: 12, align: 'center', color: 'muted' });
        });
        v.legend([['accent', 'state $\\psi$'], ['orange', 'path and image $U\\psi$'], ['green', 'rotation axis'], ['gold', 'earlier gates']]);
        v.readout(() => {
          const U = unitary(), r = hPsi.p, R = so3(U), a = mat3vec(R, r), b = blochOf(mvec(U, stateOf(r))), AA = axisAngle(U);
          return `$U\\psi$ has Bloch vector $${texVec3(v, b)}$ and $R_U\\mathbf r = ${texVec3(v, a)}$: difference $${v.sci(norm3(sub3(a, b)) + 1e-17, 1)}$; $\\;\\|U^\\dagger U-I\\| = ${v.sci(unitaryError(U) + 1e-17, 1)}$\n` +
            `$U = e^{i\\gamma}R_{\\hat n}(\\theta)$ with $\\theta = ${texAngle(v, AA.angle)}$, $\\gamma = ${texAngle(v, AA.phase)}$ (global phase: changes nothing on the sphere)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Hadamard gate and conjugate bases',
      statement: String.raw`The **Hadamard gate** is $H=\tfrac1{\sqrt2}\begin{pmatrix}1&1\\1&-1\end{pmatrix}$. It is unitary, Hermitian ($H=H^\dagger=H^{-1}$, so $H^2=I$) and swaps the two **conjugate** bases: $H|0\rangle=|{+}\rangle$, $H|1\rangle=|{-}\rangle$ with $|\pm\rangle=(|0\rangle\pm|1\rangle)/\sqrt2$, and $HXH=Z$, $HZH=X$, $HYH=-Y$. On the Bloch sphere $H$ is the half-turn about $(\hat x+\hat z)/\sqrt2$, exchanging the $z$- and $x$-axes. The bases are *mutually unbiased*: $|\langle\pm|k\rangle|^2=\tfrac12$ for $k=0,1$. Hence measuring in the $X$ basis a state $|\psi\rangle$ gives the same statistics as applying $H$ and measuring in the computational basis.`,
      idea: String.raw`$H$ is a rotation by $\pi$ about the unit vector $\hat h=(\hat x+\hat z)/\sqrt2$ (qinfo-1.2): such a half-turn reflects $z\leftrightarrow x$ and sends $y\mapsto-y$. The probability of $+$ in the $X$ basis is $|\langle+|\psi\rangle|^2=|\langle0|H|\psi\rangle|^2$ because $\langle+|=\langle0|H$ — the Born rule (qm-5.7) applied to the rotated state. A qubit that is certain in one basis is therefore maximally uncertain in the conjugate one: $\langle Z\rangle=\pm1\Rightarrow\langle X\rangle=0$.

The unitary characterization ladr-7.53 identifies the adjoint with the inverse and the images of an orthonormal basis with another orthonormal basis. Here $H^\dagger=H$ and $H^2=I$, so the preimages of the computational outcomes are exactly the X-basis vectors. The Born probabilities after H are therefore the X-basis probabilities of the original state, for every normalized input.`,
      caption: String.raw`**Drag the state $\psi$** (blue) around the sphere; $H\psi$ (orange) is its mirror image across the plane through the $y$-axis and $\hat h$. The bars compare three experiments, each with simulated shots (gold): measure $\psi$ in $Z$; measure $\psi$ in $X$; apply $H$, then measure in $Z$. The last two always agree. Try $|0\rangle$: certain in $Z$, a fair coin in $X$.`,
      deps: ['qinfo-1.2', 'ladr-7.53'],
      refs: ['Nielsen–Chuang §1.3.1'],
      tags: ['Hadamard', 'mutually unbiased bases'],
      credit: String.raw`named after Jacques Hadamard through the Hadamard matrices of J. J. Sylvester (1867) and Hadamard (1893); its use as a quantum gate is standard from the 1990s`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_logic_gate#Hadamard_gate' },
      viz(v) {
        const { S, sc } = blochStage(v, { height: 340, weight: 1.15, title: 'ψ and Hψ on the Bloch sphere' });
        const B = v.stage({ x: [-0.3, 8.3], y: [-0.2, 1.35], axes: false, height: 340, weight: 1.15, title: 'three experiments' });
        const shots = v.slider('shots per experiment', 10, 20000, 400, { log: true, int: true });
        const hPsi = sphereHandle(sc, [0.0, 0.0, 1], { color: 'accent' });
        const presets = [['|0⟩', [0, 0, 1]], ['|1⟩', [0, 0, -1]], ['|+⟩', [1, 0, 0]], ['|−⟩', [-1, 0, 0]], ['|+i⟩', [0, 1, 0]]];
        for (const [n, p] of presets) v.button(n, () => hPsi.set(p));
        const hv = unit3([1, 0, 1]), H = GATE.H();
        const us = [1, 2, 3].map((k) => { const r = v.rng(40 + k), a = new Float64Array(20000); for (let i = 0; i < a.length; i++) a[i] = r(); return a; });
        const freq = (u, p0, n) => { let k = 0; for (let i = 0; i < n; i++) if (u[i] < p0) k++; return k / n; };
        let st = null;
        v.render(() => {
          const r = hPsi.p.slice(), psi = stateOf(r), hp = mvec(H, psi), rh = blochOf(hp), n = shots.value;
          sc.begin(); sphereOutline(S); blochFrame(sc);
          sc.line(hv.map((x) => -1.28 * x), hv.map((x) => 1.28 * x), { color: 'green', width: 1.6, dash: true });
          const q = sc.P(hv.map((x) => 1.4 * x)); S.tex('\\hat h', q[0], q[1], { color: 'green', size: 13, align: 'center' });
          sc.path(arcPts(r, hv, Math.PI), { color: 'orange', width: 1.8, dash: true });
          stateArrow(S, sc, rh, 'Hψ', 'orange'); stateArrow(S, sc, r, 'ψ', 'accent');
          sc.flush();
          const pz = cabs2(psi[0]), px = (1 + r[0]) / 2, phz = cabs2(hp[0]);
          drawGroups(v, B, [
            { label: 'ψ in Z basis', probs: [pz, 1 - pz], freq: [freq(us[0], pz, n), 1 - freq(us[0], pz, n)], names: ['0', '1'], colors: ['accent', 'accent'] },
            { label: 'ψ in X basis', probs: [px, 1 - px], freq: [freq(us[1], px, n), 1 - freq(us[1], px, n)], names: ['+', '−'], colors: ['purple', 'purple'] },
            { label: 'H, then Z basis', probs: [phz, 1 - phz], freq: [freq(us[2], phz, n), 1 - freq(us[2], phz, n)], names: ['0', '1'], colors: ['orange', 'orange'] },
          ]);
          st = { r, pz, px, phz, rh };
        });
        v.legend([['accent', 'Z-basis probabilities'], ['purple', 'X-basis probabilities'], ['orange', 'after $H$'], ['gold', 'simulated shots']]);
        v.readout(() => {
          const { r, pz, px, phz, rh } = st;
          return `$P_Z(0)=${v.fix(pz, 4)}$, $\\;P_X(+)=\\tfrac12(1+x)=${v.fix(px, 4)}$, $\\;P_Z(0)$ after $H$ $=${v.fix(phz, 4)}$ — equal to $P_X(+)$ to $${v.sci(Math.abs(px - phz) + 1e-17, 1)}$\n` +
            `Bloch vector $${texVec3(v, r)}\\mapsto${texVec3(v, rh)}$: $(x,y,z)\\mapsto(z,-y,x)$ $\\;\\Rightarrow\\;$ $\\langle Z\\rangle^2+\\langle X\\rangle^2 = ${v.fix(r[0] ** 2 + r[2] ** 2, 3)}\\le1$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Z–Y Euler decomposition of a qubit unitary',
      statement: String.raw`Every $2\times2$ unitary $U$ can be written $U=e^{i\alpha}R_z(\beta)R_y(\gamma)R_z(\delta)$ with real $\alpha,\beta,\gamma,\delta$, where $R_z(\beta)=\mathrm{diag}(e^{-i\beta/2},e^{i\beta/2})$ and $R_y(\gamma)=\begin{pmatrix}\cos\frac\gamma2&-\sin\frac\gamma2\\\sin\frac\gamma2&\cos\frac\gamma2\end{pmatrix}$. Equivalently, every rotation of the Bloch sphere is a rotation by $\delta$ about $z$, then by $\gamma$ about $y$, then by $\beta$ about $z$. The same holds for any pair of perpendicular axes in place of $(z,y)$.`,
      idea: String.raw`Write $V=e^{-i\alpha}U\in SU(2)$ with $\alpha=\tfrac12\arg\det U$, so $V=\begin{pmatrix}a&-\bar b\\b&\bar a\end{pmatrix}$ with $|a|^2+|b|^2=1$. Set $\gamma=2\arctan(|b|/|a|)$ so that $\cos\frac\gamma2=|a|$, $\sin\frac\gamma2=|b|$, and read the two remaining phases off $\arg a=-\frac{\beta+\delta}2$ and $\arg b=\frac{\beta-\delta}2$. Geometrically (qinfo-1.2): $R_z(\delta)$ turns the state about the pole until the $R_y$ axis does the work of tilting it, and the last $R_z$ fixes the longitude — the Euler-angle picture of an arbitrary rotation in $SO(3)$.

The determinant result ladr-9.58 supplies the first phase-removal step: unitarity gives $|\det U|=1$, so choose a real phase alpha with $e^{2i\alpha}=\det U$. Then $V=e^{-i\alpha}U$ is still unitary and has determinant one, justifying the displayed SU(2) form before extracting the Euler angles. At a zero entry its phase is arbitrary; the remaining angle combination can be chosen to match the nonzero entry.`,
      caption: String.raw`**Choose a unitary** (or press *New random unitary*) and drag the sweep slider from $0$ to $3$: each test state (the draggable blue one and three fixed ones) is carried by $R_z(\delta)$ (orange arc), then $R_y(\gamma)$ (green), then $R_z(\beta)$ (purple). The hollow rings mark where the original $U$ sends each state — the three-step path always ends on them. The tiles show $U$ and the reconstruction.`,
      deps: ['qinfo-1.2', 'ladr-9.58'],
      refs: ['Nielsen–Chuang §4.2'],
      tags: ['Euler angles', 'decomposition', 'SU(2)'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler_angles' },
      viz(v) {
        const { S, sc } = blochStage(v, { height: 360, weight: 1.35, title: 'replaying $R_z(\\delta)$, $R_y(\\gamma)$, $R_z(\\beta)$' });
        const T = v.stage({ x: [0, 10], y: [0, 13.5], equal: true, axes: false, height: 360, weight: 0.8, title: 'U and its reconstruction' });
        const which = v.select('unitary', [{ value: 'rand', label: 'random' }, { value: 'H', label: '$H$' }, { value: 'T', label: '$T$' }, { value: 'X', label: '$X$' }, { value: 'sx', label: '$\\sqrt X$' }], 'rand');
        let seed = 3; const mk = () => randU(v.rng(seed));
        v.button('New random unitary', () => { seed++; which.set('rand'); });
        const sw = v.slider('sweep $0\\to3$', 0, 3, 1.5, { step: 0.01 });
        let raf = 0, info = null;
        v.button('Play', () => { cancelAnimationFrame(raf); const t0 = performance.now(); const tick = (now) => { const s = Math.min(3, (now - t0) / 1200); sw.set(s); if (s < 3) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); });
        v.onCleanup(() => cancelAnimationFrame(raf));
        const hPsi = sphereHandle(sc, [0.5, 0.35, 0.75], { color: 'accent' });
        const tests = [[[1, 0, 0], 'purple'], [[0, 1, 0], 'teal'], [[0, 0, -1], 'pink']];
        const axes = [[0, 0, 1], [0, 1, 0], [0, 0, 1]], cols = ['orange', 'green', 'purple'];
        v.render(() => {
          const U = which.value === 'rand' ? mk() : which.value === 'sx' ? rn([1, 0, 0], Math.PI / 2) : GATE[which.value]();
          const E = zyz(U), ang = [E.delta, E.gamma, E.beta], Ur = rzyz(E);
          const err = fnorm(msub(U, Ur));
          const s = sw.value, R = so3(U);
          sc.begin(); sphereOutline(S); blochFrame(sc);
          const all = [[hPsi.p.slice(), 'accent'], ...tests.map(([p, c]) => [p, c])];
          all.forEach(([r0, col], idx) => {
            let r = r0.slice();
            for (let k = 0; k < 3; k++) {
              const part = Math.max(0, Math.min(1, s - k));
              if (idx === 0 || part > 0) sc.path(arcPts(r, axes[k], ang[k] * (idx === 0 ? 1 : part)), { color: cols[k], width: idx === 0 ? 2.4 : 1.4, alpha: idx === 0 ? 0.9 : 0.6 });
              r = rotate3(r, axes[k], ang[k] * part);
            }
            sc.dot(mat3vec(R, r0), { color: col, r: 6, hollow: true });
            if (idx === 0) stateArrow(S, sc, r, 'ψ', 'accent'); else sc.dot(r, { color: col, r: 4.5 });
          });
          sc.flush();
          T.text('U', 0.5, 13.2, { size: 15, color: 'muted', math: true });
          cells(v, T, U, [1.5, 9.1, 8.5, 13], { text: (z) => txtC(v, z, 2) });
          T.text('$e^{i\\alpha}R_z(\\beta)R_y(\\gamma)R_z(\\delta)$', 5, 8.6, { size: 12, align: 'center', color: 'muted' });
          cells(v, T, Ur, [1.5, 4.3, 8.5, 8.2], { text: (z) => txtC(v, z, 2) });
          T.text(`α = ${v.fix(E.alpha, 3)}   β = ${v.fix(E.beta, 3)}`, 5, 2.6, { size: 12, align: 'center' });
          T.text(`γ = ${v.fix(E.gamma, 3)}   δ = ${v.fix(E.delta, 3)}`, 5, 1.5, { size: 12, align: 'center' });
          T.text(`‖U − reconstruction‖ ${err < 1e-12 ? '< 1e-12' : '= ' + err.toExponential(1)}`, 5, 0.4, { size: 11, align: 'center', color: 'muted' });
          info = { E, err };
        });
        v.legend([['orange', '$R_z(\\delta)$'], ['green', '$R_y(\\gamma)$'], ['purple', '$R_z(\\beta)$']]);
        v.readout(() => {
          const { E, err } = info;
          return `$\\alpha=${texAngle(v, E.alpha)}$, $\\beta=${v.fix(E.beta, 4)}$, $\\gamma=${v.fix(E.gamma, 4)}$, $\\delta=${v.fix(E.delta, 4)}$ (rad); $\\|U-e^{i\\alpha}R_z(\\beta)R_y(\\gamma)R_z(\\delta)\\|=${v.sci(err + 1e-17, 1)}$`;
        });
      },
    },
  ],
};
