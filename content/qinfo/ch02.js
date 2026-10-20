// Quantum Information & Computation — Chapter 2: Entanglement as a resource
import {
  TAU, R2, cmul, cabs2, cscale, mmul, adj, stateOf, rhoOf, unit3, norm3, dot3, mul3, blochOf, rz, ry,
  blochFrame, sphereOutline, blochStage, sphereHandle, drawGroups, tilesR, texVec3,
  zeroState, normalize, kronV, outerV, applyOne, applyCX, ptrace, ptransposeB, blochRho, rhoReal, eigvals, concurrence, haarState, H2, entEntropy, BELL, bellVec,
} from './ch02.shared.js';

const HAD = [[[R2, 0], [R2, 0]], [[R2, 0], [-R2, 0]]];
const ketTex = (s) => `|${s}\\rangle`;
const fix = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);
const cpu = (a) => [a, 0];
const clampBall = (p) => { const L = norm3(p); return L > 1 ? p.map((x) => x / L) : p; };
function qubit(th, ph) { return [[Math.cos(th / 2), 0], [Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph)]]; }
const matR = (A) => A.map((r) => r.map((z) => z[0]));
const SWAP = [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]];
const kron22 = (A, B) => { const R = []; for (let i = 0; i < 4; i++) { R.push([]); for (let j = 0; j < 4; j++) R[i].push(cmul(A[i >> 1][j >> 1], B[i & 1][j & 1])); } return R; };
const I2 = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];

/** Werner–Keyl universal 1→2 qubit cloner: ρ ↦ (2/3) P_sym (ρ ⊗ 1) P_sym, with P_sym the projector onto the symmetric subspace. */
function cloneOptimal(rho) {
  const P = SWAP.map((r, i) => r.map((x, j) => [0.5 * ((i === j ? 1 : 0) + x), 0]));
  const X = mmul(P, mmul(kron22(rho, I2), P)).map((r) => r.map((z) => [z[0] * (2 / 3), z[1] * (2 / 3)]));
  return [ptrace(X, 2, [0]), ptrace(X, 2, [1])];
}
const fidelityTo = (r, rhoOut) => (1 + dot3(r, blochRho(rhoOut))) / 2;

export default {
  collection: 'qinfo',
  chapter: 2,
  title: 'Entanglement as a resource',
  summary: String.raw`Taking tensor products, Schmidt decompositions and density operators from quantum mechanics, this chapter treats entanglement as something to make, test and spend. A Hadamard and a CNOT prepare Bell states and, run backwards, measure them; every mixed state has a purification; imperfect cloning has a sharp optimum; partial transposition detects entanglement; the CHSH game and Hardy’s argument turn nonlocality into odds one can bet on; and entanglement is monogamous.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'CNOT and controlled gates',
      statement: String.raw`The **controlled-NOT** acts on two qubits (control first, target second) by $\mathrm{CNOT}\,|c,t\rangle=|c,\,t\oplus c\rangle$: it flips the target exactly when the control is $|1\rangle$. In the basis $|00\rangle,|01\rangle,|10\rangle,|11\rangle$ it is the permutation matrix $\bigl(\begin{smallmatrix}I&0\\0&X\end{smallmatrix}\bigr)$, which is unitary. More generally, for any single-qubit unitary $U$ the **controlled-$U$** is $|0\rangle\langle0|\otimes I+|1\rangle\langle1|\otimes U$.

By linearity CNOT acts on superpositions: $(\alpha|0\rangle+\beta|1\rangle)|0\rangle\mapsto\alpha|00\rangle+\beta|11\rangle$, which is entangled whenever $\alpha\beta\neq0$.`,
      idea: String.raw`A gate is fixed by what it does to the four basis states (qinfo-1.2), and CNOT permutes them: $|10\rangle\leftrightarrow|11\rangle$ and the others stay. A control that is not in a basis state cannot be "read": linearity sends each branch through its own action, so the control and target become correlated in a coherent way, which is entanglement (qm-14.1). The product form survives only if the target is an eigenvector of the controlled operation, $X|\pm\rangle=\pm|\pm\rangle$; then the sign lands on the control as a phase (**phase kickback**).

The linear map lemma ladr-3.4 says that prescribing images of a basis determines one unique linear operator. Applying it to the four computational basis vectors extends the classical CNOT permutation to superpositions without reading or measuring the control. Thus the displayed entangled output follows by linearity on the two occupied basis vectors; replacing a superposition by a random classical branch would be a different map.`,
      caption: String.raw`Choose the **target** state and tilt the **control** with the sliders (or use the buttons). Bars show the input and output amplitudes (colour = phase); the matrix on the left highlights the columns the input uses. Notice that a $|0\rangle$ or $|1\rangle$ target with a superposed control gives entropy 1 bit, while a $|+\rangle$ target leaves the pair unentangled and a $|-\rangle$ target kicks a phase back onto the control.`,
      deps: ['qm-14.1', 'qinfo-1.2', 'ladr-3.4'],
      refs: ['Nielsen–Chuang §1.3.2', 'Nielsen–Chuang §4.3'],
      tags: ['two-qubit gates', 'entanglement'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Controlled_NOT_gate' },
      viz(v) {
        const Q = v.quantum(), qc = Q.circuit(2).cx(0, 1);
        const D = v.stage({ axes: false, height: 270, weight: 0.75, title: 'the gate (control on top)' });
        const Mx = v.stage({ x: [-0.3, 1.02], y: [-0.02, 1.2], axes: false, equal: true, height: 270, weight: 0.8, title: 'CNOT as a matrix' });
        const A = v.stage({ axes: false, height: 270, weight: 1, title: 'input amplitudes' });
        const B = v.stage({ axes: false, height: 270, weight: 1, title: 'output amplitudes' });
        const th = v.slider('control tilt $\\theta$', 0, Math.PI, Math.PI / 2, { step: 0.01 });
        const ph = v.slider('control phase $\\varphi$', 0, TAU, 0, { step: 0.01 });
        const tg = v.select('target', [{ value: '0', label: '$|0\\rangle$' }, { value: '1', label: '$|1\\rangle$' }, { value: '+', label: '$|+\\rangle$' }, { value: '-', label: '$|-\\rangle$' }], '0');
        v.button('control |0⟩', () => th.set(0)); v.button('control |1⟩', () => th.set(Math.PI)); v.button('control |+⟩', () => { th.set(Math.PI / 2); ph.set(0); });
        const tgt = { 0: [[1, 0], [0, 0]], 1: [[0, 0], [1, 0]], '+': [[R2, 0], [R2, 0]], '-': [[R2, 0], [-R2, 0]] };
        const CN = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]];
        let psi, out;
        v.render(() => {
          psi = kronV(qubit(th.value, ph.value), tgt[tg.value]); out = applyCX(psi, 0, 1, 2);
          Q.diagram(D, qc, {});
          tilesR(v, Mx, CN, [0, 0, 1, 1], { size: 12 });
          for (let j = 0; j < 4; j++) {
            if (cabs2(psi[j]) > 1e-6) Mx.rect(0.25 * j, 0, 0.25 * j + 0.25, 1, { color: 'gold', width: 2.2, fill: 'gold', fillAlpha: 0.12 });
            Mx.text(`|${j.toString(2).padStart(2, '0')}⟩`, 0.25 * j + 0.125, 1.04, { size: 11, align: 'center', baseline: 'bottom', color: 'muted' });
            Mx.text(`|${j.toString(2).padStart(2, '0')}⟩`, -0.03, 1 - 0.25 * j - 0.125, { size: 11, align: 'right', baseline: 'middle', color: 'muted' });
          }
          Q.amplitudes(A, Q.state(psi)); Q.amplitudes(B, Q.state(out));
        });
        v.readout(() => {
          const S = entEntropy(out), Qs = Q.state(out);
          return `output $${Qs.ket(2)}$\nentanglement entropy of the output $=${v.fix(S, 3)}$ bit${S < 1e-6 ? ' (a product state)' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Method',
      name: 'Bell-state preparation and Bell measurement',
      statement: String.raw`Let $H$ be a Hadamard on the first qubit and CNOT the controlled-NOT with the first qubit as control. For $a,b\in\{0,1\}$,
$$\mathrm{CNOT}\,(H\otimes I)\,|a,b\rangle=|\beta_{ab}\rangle=\tfrac1{\sqrt2}\bigl(|0,b\rangle+(-1)^a|1,\bar b\rangle\bigr),$$
so $|00\rangle,|01\rangle,|10\rangle,|11\rangle$ go to $|\Phi^+\rangle,|\Psi^+\rangle,|\Phi^-\rangle,|\Psi^-\rangle$. These four **Bell states** form an orthonormal basis of two qubits, each maximally entangled. Since the circuit is unitary, its inverse $(H\otimes I)\,\mathrm{CNOT}$ followed by a measurement in the computational basis is a **Bell measurement**: it returns the labels $ab$ of the Bell state, and identifies an unknown member of the basis with certainty.`,
      idea: String.raw`CNOT and $H$ are unitary (qinfo-2.1, qinfo-1.3), so applying the circuit to the four orthonormal basis states yields four orthonormal states, and applying its inverse returns each to its label. A measurement in the computational basis after the inverse circuit is therefore a projective measurement onto the images of the basis states, namely the Bell basis. The Bell states are all maximally entangled, which is why no product-basis measurement (and no local measurement) can tell $\Phi^+$ from $\Phi^-$.

By ladr-7.53, a unitary maps an orthonormal basis to an orthonormal basis and its inverse is its adjoint. The preparation circuit therefore produces four orthonormal Bell vectors, and the adjoint circuit sends them back to their distinct computational labels. This is the precise reason the joint measurement identifies all four. It does not prohibit distinguishing a chosen pair by local measurements followed by classical comparison.`,
      caption: String.raw`Top: pick the input $|ab\rangle$ and step the forward circuit with the slider to see the Bell state appear. Bottom: the *unknown* Bell state is sent through the backward circuit and measured; the green bars are theory, the gold bars the tally of your trials. Switch the measurement to *computational basis only* and watch $\Phi^\pm$ and $\Psi^\pm$ become indistinguishable. The noise slider mixes in the maximally mixed state with weight $p$; the success rate is then $1-\tfrac34p$.`,
      deps: ['qinfo-2.1', 'qinfo-1.3', 'ladr-7.53'],
      refs: ['Nielsen–Chuang §1.3.6'],
      tags: ['Bell states', 'measurement'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bell_state' },
      viz(v) {
        const Q = v.quantum(), fw = Q.circuit(2).h(0).cx(0, 1), bw = Q.circuit(2).cx(0, 1).h(0).measure();
        const Dh = v.stage({ axes: false, height: 200, weight: 1.15, title: 'prepare: $|ab\\rangle\\mapsto|\\beta_{ab}\\rangle$' });
        const Fa = v.stage({ axes: false, height: 200, weight: 0.85, title: 'state after the chosen step' });
        const Db = v.stage({ axes: false, height: 200, weight: 1.15, title: 'measure: the circuit run backwards' });
        const T = v.stage({ x: [-0.1, 4.1], y: [-0.2, 1.22], axes: false, height: 230, full: true, title: 'outcome tally (green: exact, gold: your trials)' });
        const inp = v.select('prepared state', BELL.map((b, k) => ({ value: String(k), label: `$|${BELL[k].idx}\\rangle\\to${b.tex}$` })), '0');
        const step = v.slider('forward step', 0, 2, 2, { int: true });
        const meas = v.select('measurement', [{ value: 'bell', label: 'Bell circuit' }, { value: 'comp', label: 'computational basis only' }], 'bell');
        const noise = v.slider('noise $p$', 0, 1, 0, { step: 0.01 });
        const nTr = v.slider('trials', 10, 5000, 300, { log: true, int: true });
        let seed = 5; v.button('run again', () => { seed++; });
        let res;
        v.render(() => {
          const k = +inp.value, ab = BELL[k].idx, bits = [+ab[0], +ab[1]];
          const start = [0, 0, 0, 0].map((_, i) => [i === 2 * bits[0] + bits[1] ? 1 : 0, 0]);
          const s1 = applyOne(start, HAD, 0, 2), s2 = applyCX(s1, 0, 1, 2), states = [start, s1, s2], shown = states[step.value];
          Q.diagram(Dh, fw, { step: step.value }); Q.amplitudes(Fa, Q.state(shown), { wheel: false });
          Q.diagram(Db, bw, {});
          const bellState = states[2], back = meas.value === 'bell' ? applyOne(applyCX(bellState, 0, 1, 2), HAD, 0, 2) : bellState;
          const p = noise.value, probs = back.map((z) => (1 - p) * cabs2(z) + p / 4);
          const r = v.rng(seed * 101 + k), n = nTr.value, cnt = [0, 0, 0, 0];
          for (let i = 0; i < n; i++) { let u = r(), j = 0; while (j < 3 && u > probs[j]) { u -= probs[j]; j++; } cnt[j]++; }
          const freq = cnt.map((c) => c / n);
          drawGroups(v, T, [{ probs, freq, names: ['00 → Φ⁺', '01 → Ψ⁺', '10 → Φ⁻', '11 → Ψ⁻'], colors: ['green', 'green', 'green', 'green'] }]);
          res = { k, success: cnt[k] / n, exact: probs[k], cnt };
        });
        v.readout(() => `true state $${BELL[res.k].tex}$ (label $${BELL[res.k].idx}$): guessed correctly in ${fix(v, res.success * 100, 1)}% of trials; exact probability $${fix(v, res.exact, 3)}$${meas.value === 'bell' ? ` $=1-\\tfrac34p$` : ''}`);
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Purification',
      statement: String.raw`Let $\rho_A$ be any density operator on a finite-dimensional system $A$ with spectral decomposition $\rho_A=\sum_k\lambda_k|k\rangle\langle k|$. Then for a system $R$ of dimension at least $\operatorname{rank}\rho_A$ and any orthonormal vectors $|k\rangle_R$, the pure state
$$|\Psi\rangle_{AR}=\sum_k\sqrt{\lambda_k}\,|k\rangle_A|k\rangle_R$$
has $\operatorname{tr}_R|\Psi\rangle\langle\Psi|=\rho_A$. Two purifications $|\Psi\rangle,|\Psi'\rangle$ of the same $\rho_A$ on $A\otimes R$ are related by a unitary on $R$: $|\Psi'\rangle=(I\otimes U_R)|\Psi\rangle$.`,
      idea: String.raw`Diagonalise $\rho_A$ (ladr-7.39) and read the eigenvalues as squared Schmidt coefficients: tracing out $R$ kills the cross terms because the $|k\rangle_R$ are orthonormal, leaving $\sum_k\lambda_k|k\rangle\langle k|$. Conversely any purification has a Schmidt decomposition whose $A$-side is forced to be the eigenbasis of $\rho_A$ and whose Schmidt weights are the eigenvalues; the $R$-side bases then differ only by a unitary on $R$ (qm-14.4). Mixedness is thus entanglement with something unobserved.

The finite-dimensional density operator is self-adjoint and hence normal, so ladr-7.31 supplies the orthonormal eigenbasis used in the construction. Positivity and trace one give nonnegative eigenvalues summing to one. Their square roots are the eigenvalues of the positive square root from ladr-7.39; these coefficients normalize the displayed purification. Orthogonality of the reference vectors then removes precisely the off-diagonal terms under partial trace.`,
      caption: String.raw`**Drag the point inside the Bloch ball** (left) to choose the mixed state $\rho_A$. Its canonical purification is a two-qubit state (bars). Rotate the partner $R$ with the three Euler-angle sliders: the middle ball (the partner's own reduced state, computed from the two-qubit state) swings around, but the left ball does not move. Push the point to the surface and the purification factorises.`,
      deps: ['qm-14.4', 'ladr-7.39', 'ladr-7.31'],
      refs: ['Nielsen–Chuang §2.5'],
      tags: ['purification', 'mixed states', 'Schmidt decomposition'],
      credit: String.raw`Schrödinger, 1936, and Hughston, Jozsa and Wootters, 1993 (Phys. Lett. A 183, 14), who proved the unitary freedom`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Purification_of_quantum_state' },
      viz(v) {
        const Q = v.quantum();
        const { S: SA, sc: scA } = blochStage(v, { height: 300, weight: 1, title: 'the mixed state $\\rho_A$ (drag inside the ball)' });
        const { S: SR, sc: scR } = blochStage(v, { height: 300, weight: 1, title: 'the partner $R$, reduced from $|\\Psi\\rangle$' });
        const B = v.stage({ axes: false, height: 300, weight: 1, title: 'the purification $|\\Psi\\rangle_{AR}$' });
        const hA = scA.handle([0.35, 0.2, 0.5], { snap: clampBall, color: 'accent', r: 6.5, label: 'ρA' });
        const al = v.slider('partner rotation $\\alpha$ (about $z$)', -Math.PI, Math.PI, 0.9, { step: 0.01 });
        const be = v.slider('partner rotation $\\beta$ (about $y$)', -Math.PI, Math.PI, 1.1, { step: 0.01 });
        const ga = v.slider('partner rotation $\\gamma$ (about $z$)', -Math.PI, Math.PI, 0, { step: 0.01 });
        v.button('maximally mixed', () => hA.set([0, 0, 0])); v.button('pure', () => hA.set(unit3(hA.p)));
        let info;
        v.render(() => {
          const r = hA.p.slice(), L = norm3(r), rh = L > 1e-9 ? r.map((x) => x / L) : [0, 0, 1], lp = (1 + L) / 2, lm = (1 - L) / 2;
          const sp = stateOf(rh), sm = stateOf(rh.map((x) => -x));
          let psi = [0, 1, 2, 3].map((i) => { const a = i >> 1, b = i & 1; return b === 0 ? cscale(sp[a], Math.sqrt(lp)) : cscale(sm[a], Math.sqrt(lm)); });
          const U = mmul(rz(al.value), mmul(ry(be.value), rz(ga.value)));
          psi = applyOne(psi, U, 1, 2);
          const rho = outerV(psi), rA = blochRho(ptrace(rho, 2, [0])), rR = blochRho(ptrace(rho, 2, [1]));
          info = { rA, rR, L, lp, lm, S: H2([lp, lm]), err: Math.hypot(rA[0] - r[0], rA[1] - r[1], rA[2] - r[2]) };
          for (const [S, sc, p, col] of [[SA, scA, r, 'accent'], [SR, scR, rR, 'orange']]) {
            sc.begin(); sphereOutline(S); blochFrame(sc, { labels: false });
            sc.arrow([0, 0, 0], p, { color: col, width: 2.6, head: 9 });
            if (S === SR) sc.dot(p, { color: col, r: 5 });
            sc.flush();
          }
          Q.amplitudes(B, Q.state(psi));
        });
        v.readout(() => `eigenvalues of $\\rho_A$: $\\lambda_\\pm=\\tfrac12(1\\pm|\\mathbf r|)=${fix(v, info.lp)},\\ ${fix(v, info.lm)}$ — Schmidt coefficients $\\sqrt{\\lambda_\\pm}$\n$\\operatorname{tr}_R|\\Psi\\rangle\\langle\\Psi|$ has Bloch vector $${texVec3(v, info.rA)}$, error $${v.sci(info.err, 2)}$ from the chosen $\\rho_A$; the partner has length $${fix(v, norm3(info.rR))}=|\\mathbf r|$\nentanglement entropy $${fix(v, info.S)}$ bit${info.L > 0.9995 ? ' (pure state: the purification is a product)' : ''}`);
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Model',
      name: 'Optimal approximate cloning',
      statement: String.raw`No device copies an unknown qubit state exactly (qm-14.14), but one can copy it approximately. The **universal symmetric $1\to2$ qubit cloner** is the linear completely positive map
$$\rho\;\longmapsto\;\tfrac23\,P_{\rm sym}(\rho\otimes I)P_{\rm sym}$$
($P_{\rm sym}$ the projector onto the symmetric subspace of two qubits). Each of its two output copies is $\rho'=\tfrac23\rho+\tfrac13\,\tfrac I2$, i.e. the Bloch vector is shrunk by $\tfrac23$ without changing its direction, so for every pure input the fidelity of each copy is
$$F=\langle\psi|\rho'|\psi\rangle=\tfrac56\approx0.833,$$
independent of $|\psi\rangle$. No cloner treating all inputs alike (covariant under unitaries) can achieve a larger $F$ for both copies.`,
      idea: String.raw`A quantum cloner is a physically allowed (completely positive, trace preserving) map, and an unknown state means it must work for every input. Symmetrising the output over the two copies and requiring unitary covariance leaves a one-parameter family of maps, and positivity bounds the shrinking factor by $\tfrac23$; this is the Bužek–Hillery construction, whose optimality Gisin–Massar and Werner proved. The same limit follows from no-signalling-style arguments: a cloner with $F>\tfrac56$ could be used to distinguish non-orthogonal states better than the Helstrom bound of qinfo-1.5.`,
      caption: String.raw`**Drag the input point** on the Bloch sphere. The orange arrow is copy 1, the purple ring marks copy 2: they coincide, shorter by the factor $\tfrac23$ (or $\tfrac13$ for *measure and prepare*). On the right, fidelity versus the input's polar angle for each cloner; *Resample* draws random inputs and computes their fidelities from the actual map: the cloner's dots all sit on one horizontal line, the trivial *copy-one-discard-other* strategy trades $F_1=1$ for $F_2=\tfrac12$.`,
      deps: ['qm-14.14'],
      refs: ['Nielsen–Chuang §12.1'],
      tags: ['cloning', 'no-cloning', 'fidelity'],
      scope: String.raw`The map above is the optimal *universal* (input-independent) symmetric cloner for qubits. Cloners tuned to a known set of states, such as the two bases of BB84, can do better.`,
      credit: String.raw`V. Bužek and M. Hillery, 1996 (Phys. Rev. A 54, 1844); optimality: N. Gisin and S. Massar, 1997, and R. F. Werner, 1998`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/No-cloning_theorem' },
      viz(v) {
        const { S, sc } = blochStage(v, { height: 340, weight: 1.1, title: 'input and the two clones' });
        const F = v.stage({ x: [0, Math.PI], y: [0.4, 1.04], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'polar angle of the input', ylabel: 'fidelity of a copy', title: 'fidelity of the clones',
          xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], yticks: [0.5, 2 / 3, 5 / 6, 1] });
        const kind = v.select('cloner', [{ value: 'opt', label: 'optimal (Bužek–Hillery)' }, { value: 'mp', label: 'measure & prepare' }, { value: 'triv', label: 'copy one, discard' }], 'opt');
        const h = sphereHandle(sc, unit3([0.5, 0.3, 0.8]), { color: 'accent', label: 'ψ' });
        let seed = 3; v.button('Resample', () => { seed++; });
        const apply = (k, r) => { const rho = rhoOf(r); if (k === 'opt') return cloneOptimal(rho); if (k === 'mp') { const o = rhoOf(mul3(r, 1 / 3)); return [o, o]; } return [rho, rhoOf([0, 0, 0])]; };
        let cur;
        v.render(() => {
          const r = unit3(h.p), [oa, ob] = apply(kind.value, r), ra = blochRho(oa), rb = blochRho(ob);
          cur = { fa: fidelityTo(r, oa), fb: fidelityTo(r, ob), ra, rb };
          sc.begin(); sphereOutline(S); blochFrame(sc);
          sc.arrow([0, 0, 0], r, { color: 'accent', width: 1.4, head: 8, alpha: 0.5 });
          sc.arrow([0, 0, 0], ra, { color: 'orange', width: 3, head: 10 });
          sc.dot(rb, { color: 'purple', r: 8, hollow: true });
          sc.flush();
          F.hline(1, { color: 'faint', dash: true });
          const lines = [['opt', 5 / 6, 'green'], ['mp', 2 / 3, 'teal']];
          for (const [k, f, c] of lines) F.hline(f, { color: c, width: kind.value === k ? 3 : 1.4, alpha: kind.value === k ? 1 : 0.6 });
          F.hline(0.5, { color: 'red', width: kind.value === 'triv' ? 3 : 1.4, alpha: kind.value === 'triv' ? 1 : 0.45, dash: true });
          F.text('optimal 5/6', 0.04, 5 / 6, { size: 11, color: 'green', baseline: 'bottom', dy: -3 });
          F.text('measure & prepare 2/3', 0.04, 2 / 3, { size: 11, color: 'teal', baseline: 'bottom', dy: -3 });
          F.text('copy 2 of "copy one" 1/2', 0.04, 0.5, { size: 11, color: 'red', baseline: 'bottom', dy: -3 });
          F.text('copy 1 of "copy one" = 1', 0.04, 1, { size: 11, color: 'red', baseline: 'bottom', dy: -3 });
          const rg = v.rng(seed * 7);
          for (let i = 0; i < 40; i++) {
            const z = 2 * rg() - 1, ph = TAU * rg(), s = Math.sqrt(1 - z * z), rr = [s * Math.cos(ph), s * Math.sin(ph), z], th = Math.acos(z), [pa, pb] = apply(kind.value, rr);
            F.dot(th, fidelityTo(rr, pa), { color: 'orange', r: 3.2 }); if (kind.value === 'triv') F.dot(th, fidelityTo(rr, pb), { color: 'purple', r: 3.2 });
          }
          F.dot(Math.acos(r[2]), cur.fa, { color: 'orange', r: 6 }); F.dot(Math.acos(r[2]), cur.fb, { color: 'purple', r: 6, hollow: true });
        });
        v.readout(() => `copy 1: Bloch length $${fix(v, norm3(cur.ra))}$, fidelity $F_1=${fix(v, cur.fa, 4)}$ · copy 2: length $${fix(v, norm3(cur.rb))}$, $F_2=${fix(v, cur.fb, 4)}$\nperfect cloning would need $F_1=F_2=1$; for the optimal cloner $\\tfrac56=${fix(v, 5 / 6, 4)}$ at every input`);
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Peres–Horodecki (PPT) criterion',
      statement: String.raw`For a bipartite state $\rho_{AB}$ let $\rho^{T_B}$ be its **partial transpose** on $B$ (transpose the $B$ indices in a product basis: $(\rho^{T_B})_{ij,kl}=\rho_{il,kj}$). If $\rho_{AB}$ is separable, i.e. a mixture $\sum_ip_i\,\sigma_i\otimes\tau_i$, then $\rho^{T_B}\ge0$ (the state is **PPT**). Hence a negative eigenvalue of $\rho^{T_B}$ proves entanglement. For $2\times2$ and $2\times3$ systems the converse also holds: PPT implies separable.

Example: for $\rho=p|\Phi^+\rangle\langle\Phi^+|+(1-p)\,I/4$ the smallest eigenvalue of $\rho^{T_B}$ is $(1-3p)/4$, so the state is entangled exactly when $p>\tfrac13$.`,
      idea: String.raw`Transposition is positive but not completely positive (qm-14.3). It maps every product state $\sigma\otimes\tau$ to another product state $\sigma\otimes\tau^{T}$, so a convex mixture of products stays a valid state, hence $\ge0$. An entangled state can be turned by this map into an operator with a negative eigenvalue, e.g. $|\Phi^+\rangle\langle\Phi^+|$ becomes half the SWAP operator, whose spectrum is $+\tfrac12,+\tfrac12,+\tfrac12,-\tfrac12$ (qinfo-2.2). The converse in low dimensions is the theorem of the Horodeckis; in $3\times3$ there are PPT entangled ("bound entangled") states.

Use ladr-7.38 on the finite-dimensional positive factors: each has an orthonormal eigenbasis with nonnegative eigenvalues. Complex conjugating the eigenvectors shows that transpose keeps those eigenvalues nonnegative, and tensor products of the eigenbases give nonnegative eigenvalue products. Finally every nonnegative weighted sum has nonnegative quadratic form. This proves PPT necessity for separable states in every dimension; it does not prove the separate low-dimensional converse.`,
      caption: String.raw`Slide the mixing weight $p$ for three families. Left: the smallest eigenvalue of $\rho^{T_B}$ against $p$; the shaded region is where it is negative. Middle: all four eigenvalues. Right: the matrix $\rho^{T_B}$ itself (blue positive, red negative). For the white-noise family the threshold is $p=\tfrac13$; the other two families are entangled except at one point (or never separable).`,
      deps: ['qm-14.3', 'qinfo-2.2', 'ladr-7.38'],
      refs: ['Nielsen–Chuang §2.4'],
      tags: ['separability', 'partial transpose', 'Werner state'],
      scope: String.raw`Necessary for separability in every dimension; sufficient only for $2\times2$ and $2\times3$.`,
      credit: String.raw`A. Peres, 1996 (Phys. Rev. Lett. 77, 1413); M., P. and R. Horodecki, 1996 (Phys. Lett. A 223, 1)`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Peres%E2%80%93Horodecki_criterion' },
      viz(v) {
        const fam = v.select('family', [{ value: 'white', label: 'Bell + white noise' }, { value: 'pm', label: '$p\\Phi^++(1-p)\\Phi^-$' }, { value: 'z', label: '$p\\Phi^++(1-p)|01\\rangle\\langle01|$' }], 'white');
        const p = v.slider('weight $p$ of $|\\Phi^+\\rangle$', 0, 1, 0.6, { step: 0.005 });
        const C = v.stage({ x: [0, 1], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 300, weight: 1.1, xlabel: 'weight $p$', ylabel: 'smallest eigenvalue of $\\rho^{T_B}$', title: 'detecting entanglement' });
        const E = v.stage({ x: [0.3, 4.7], y: [-0.6, 0.9], axes: 'box', gutter: true, height: 300, weight: 0.8, ylabel: 'eigenvalue', xticks: [1, 2, 3, 4], title: 'spectrum of $\\rho^{T_B}$' });
        const M = v.stage({ x: [-0.28, 1.0], y: [-0.02, 1.16], axes: false, equal: true, height: 300, weight: 0.8, title: '$\\rho^{T_B}$' });
        const build = (f, q) => {
          const R = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
          const add = (w, vec) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R[i][j] += w * vec[i] * vec[j]; };
          const phi = [R2, 0, 0, R2], phm = [R2, 0, 0, -R2];
          if (f === 'white') { add(q, phi); for (let i = 0; i < 4; i++) R[i][i] += (1 - q) / 4; }
          if (f === 'pm') { add(q, phi); add(1 - q, phm); }
          if (f === 'z') { add(q, phi); add(1 - q, [0, 1, 0, 0]); }
          return R;
        };
        const ptReal = (R) => { const P = R.map((r) => r.slice()); for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) for (let d = 0; d < 2; d++) P[2 * a + c][2 * b + d] = R[2 * a + d][2 * b + c]; return P; };
        const spec = (f, q) => eigvals(v, rhoReal(ptReal(build(f, q))));
        let cur;
        v.render(() => {
          const f = fam.value, curve = []; for (let i = 0; i <= 100; i++) curve.push([i / 100, spec(f, i / 100)[0]]);
          const PT = ptReal(build(f, p.value)), ev = spec(f, p.value);
          cur = { ev, min: ev[0] };
          const neg = curve.filter((c) => c[1] < -1e-9);
          if (neg.length) C.vband(neg[0][0], neg[neg.length - 1][0], { color: 'red', alpha: 0.08 });
          C.hline(0, { color: 'muted', width: 1 });
          C.path(curve, { color: 'accent', width: 2.4 });
          if (f === 'white') { C.vline(1 / 3, { color: 'green', dash: true, width: 1.4 }); C.text('p = 1/3', 1 / 3, 0.42, { size: 11.5, color: 'green', dx: 5, align: 'left' }); }
          C.dot(p.value, ev[0], { color: ev[0] < -1e-9 ? 'red' : 'green', r: 6 });
          E.hline(0, { color: 'muted' });
          E.bars([...ev].reverse(), { x0: 1, color: (val) => (val < -1e-9 ? 'red' : 'blue') });
          tilesR(v, M, PT, [0, 0, 1, 1], { size: 11 });
          for (let j = 0; j < 4; j++) { const t = `${j >> 1}${j & 1}`; M.text(t, 0.25 * j + 0.125, 1.03, { size: 11, align: 'center', baseline: 'bottom', color: 'muted' }); M.text(t, -0.03, 1 - 0.25 * j - 0.125, { size: 11, align: 'right', baseline: 'middle', color: 'muted' }); }
        });
        v.readout(() => {
          const neg = cur.ev.filter((x) => x < -1e-9).reduce((s, x) => s - x, 0);
          return `smallest eigenvalue of $\\rho^{T_B}$: $${fix(v, cur.min, 4)}$${fam.value === 'white' ? `, formula $(1-3p)/4=${fix(v, (1 - 3 * p.value) / 4, 4)}$` : ''} · negativity $=${fix(v, neg, 4)}$\n${cur.min < -1e-9 ? '**negative: the state is entangled**' : 'PPT: for two qubits this means **separable**'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Model',
      name: 'The CHSH game',
      statement: String.raw`Two cooperating players, Alice and Bob, cannot communicate. A referee sends Alice a random bit $x$ and Bob a random bit $y$; they reply with bits $a,b$, and win if $a\oplus b=x\wedge y$.

(a) With classical strategies, deterministic or randomised with shared randomness, the best winning probability is $\tfrac34$.

(b) If they share the Bell state $|\Phi^+\rangle$ and measure along directions in the $xz$-plane of the Bloch sphere at angles $\theta^A_x,\theta^B_y$, then $P(a=b\mid x,y)=\tfrac12\bigl(1+\cos(\theta^A_x-\theta^B_y)\bigr)$ and the winning probability is $\tfrac12+\tfrac18S$ with $S=E_{00}+E_{01}+E_{10}-E_{11}$. The choice $\theta^A=(0,\tfrac\pi2)$, $\theta^B=(\tfrac\pi4,-\tfrac\pi4)$ gives $S=2\sqrt2$ and
$$P_{\rm win}=\cos^2\tfrac\pi8\approx0.854,$$
which is optimal over all quantum strategies (Tsirelson's bound).`,
      idea: String.raw`A deterministic strategy is a pair of functions $a(x),b(y)$ and only 16 exist; the four conditions $a_x\oplus b_y=xy$ would sum modulo 2 to $0=1$, so at most three hold and the best classical rate is $\tfrac34$; randomness is just a mixture of these. Entanglement lets the answers be correlated through the angle between the two measurement axes without a fixed table of answers (qm-14.9, the Bell–CHSH inequality, in game form). The three pairs with $xy=0$ want aligned axes and the pair $x=y=1$ wants them anti-aligned, which an equal $\tfrac\pi4$ splitting does best.

Condition on the shared random seed, chosen independently of the referee inputs. Each seed fixes a deterministic response table with uniform-input win rate at most three quarters. Monotonicity and linearity of expectation in prob-1.6.1 keep its average at most three quarters as well. Thus shared randomness cannot improve the classical optimum; no assumption of independence between the players responses is made.`,
      caption: String.raw`**Drag the four arrows** (blue: Alice's two axes, orange: Bob's) around the circle: each pair's winning chance (bars, theory in green and gold = simulated rounds) depends only on the angle between them. The default is the optimal choice. Lower the *visibility* of the Bell pair (noise) and the quantum advantage disappears at $1/\sqrt2\approx0.707$. The right panel lists all 16 deterministic classical strategies; none exceeds $\tfrac34$.`,
      deps: ['qm-14.9', 'prob-1.6.1'],
      refs: ['Nielsen–Chuang §2.6'],
      tags: ['nonlocal games', 'Bell inequality', 'Tsirelson bound'],
      scope: String.raw`Winning probability for the state $V|\Phi^+\rangle\langle\Phi^+|+(1-V)I/4$ with measurements in a plane; the classical bound $\tfrac34$ holds for any shared randomness.`,
      credit: String.raw`inequality: Clauser, Horne, Shimony and Holt, 1969; quantum bound: B. Tsirelson (Cirel'son), 1980; game form: Cleve, Høyer, Toner and Watrous, 2004`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CHSH_inequality' },
      viz(v) {
        const C = v.stage({ x: [-1.65, 1.65], y: [-1.65, 1.65], equal: true, axes: false, height: 300, weight: 1, title: 'measurement directions' });
        const W = v.stage({ x: [-0.1, 4.1], y: [-0.2, 1.22], axes: false, height: 300, weight: 1, title: 'winning chance for each question pair' });
        const K = v.stage({ x: [0, 17], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'the 16 deterministic strategies (sorted)', ylabel: 'winning probability', xticks: [], title: 'classical strategies' });
        const strat = v.select('players use', [{ value: 'q', label: 'Bell pair' }, { value: 'c', label: 'best classical' }], 'q');
        const vis = v.slider('visibility $V$', 0, 1, 1, { step: 0.005 });
        const nR = v.slider('rounds', 10, 20000, 1000, { log: true, int: true });
        let seed = 2; v.button('play again', () => { seed++; });
        const mk = (ang, col, label) => { const h = C.handle(Math.cos(ang), Math.sin(ang), { color: col, r: 7, label, constrain: (x, y) => { const L = Math.hypot(x, y) || 1; return [x / L, y / L]; } }); return h; };
        const hA0 = mk(0, 'accent', 'a₀'), hA1 = mk(Math.PI / 2, 'teal', 'a₁'), hB0 = mk(Math.PI / 4, 'orange', 'b₀'), hB1 = mk(-Math.PI / 4, 'pink', 'b₁');
        const place = (a0, a1, b0, b1) => { hA0.set(Math.cos(a0), Math.sin(a0)); hA1.set(Math.cos(a1), Math.sin(a1)); hB0.set(Math.cos(b0), Math.sin(b0)); hB1.set(Math.cos(b1), Math.sin(b1)); };
        v.button('Tsirelson optimum', () => place(0, Math.PI / 2, Math.PI / 4, -Math.PI / 4)); v.button('all aligned', () => place(0, 0, 0, 0));
        const ang = (h) => Math.atan2(h.y, h.x);
        const cls = []; for (let m = 0; m < 16; m++) { const a = [m & 1, (m >> 1) & 1], b = [(m >> 2) & 1, (m >> 3) & 1]; let w = 0; for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) if ((a[x] ^ b[y]) === (x & y)) w++; cls.push({ a, b, w: w / 4 }); }
        cls.sort((p, q) => q.w - p.w);
        let cur;
        v.render(() => {
          const A = [ang(hA0), ang(hA1)], Bo = [ang(hB0), ang(hB1)], V = strat.value === 'q' ? vis.value : 1;
          const E = [[0, 0], [0, 0]], win = [[0, 0], [0, 0]];
          for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) { E[x][y] = V * Math.cos(A[x] - Bo[y]); win[x][y] = x & y ? (1 - E[x][y]) / 2 : (1 + E[x][y]) / 2; }
          if (strat.value === 'c') for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) win[x][y] = x & y ? 0 : 1;
          const r = v.rng(seed * 13), n = nR.value, plays = [0, 0, 0, 0], wins = [0, 0, 0, 0];
          for (let i = 0; i < n; i++) { const x = r() < 0.5 ? 0 : 1, y = r() < 0.5 ? 0 : 1; plays[2 * x + y]++; if (r() < win[x][y]) wins[2 * x + y]++; }
          const tot = wins.reduce((s, q) => s + q, 0) / n, pw = (win[0][0] + win[0][1] + win[1][0] + win[1][1]) / 4;
          cur = { pw, tot, S: E[0][0] + E[0][1] + E[1][0] - E[1][1] };
          C.polarGrid({ rings: [1], spokes: 8, rmax: 1.1, angles: false });
          for (const [h, col] of [[hA0, 'accent'], [hA1, 'teal'], [hB0, 'orange'], [hB1, 'pink']]) C.arrow(0, 0, h.x, h.y, { color: col, width: 2.4, head: 9 });
          drawGroups(v, W, [{ probs: [win[0][0], win[0][1], win[1][0], win[1][1]], freq: wins.map((w, i) => (plays[i] ? w / plays[i] : 0)), names: ['x=0,y=0', 'x=0,y=1', 'x=1,y=0', 'x=1,y=1'], colors: ['green', 'green', 'green', 'green'] }]);
          W.hline(0.75, { color: 'red', dash: true, width: 1.3 }); W.text('dashed: classical bound 3/4', 2, 1.1, { size: 11.5, color: 'red', align: 'center' });
          K.bars(cls.map((c) => c.w), { x0: 1, color: 'blue' });
          K.hline(0.75, { color: 'red', dash: true, width: 1.3 }); K.hline(Math.cos(Math.PI / 8) ** 2, { color: 'green', width: 1.8 });
          K.text('quantum 0.854', 0.4, Math.cos(Math.PI / 8) ** 2, { size: 11, color: 'green', baseline: 'bottom', dy: -3 });
          K.text('classical 0.75', 16.8, 0.75, { size: 11, color: 'red', align: 'right', baseline: 'top', dy: 4 });
        });
        v.readout(() => `win probability $=${fix(v, cur.pw, 4)}$ (simulated: ${fix(v, cur.tot, 4)} over ${nR.value} rounds) · $S=${fix(v, cur.S, 3)}$, check $\\tfrac12+\\tfrac S8=${fix(v, 0.5 + cur.S / 8, 4)}$\n${cur.pw > 0.75 + 1e-9 ? '**above 3/4: impossible for any classical strategy**' : 'no better than classical'} · Tsirelson: $\\cos^2(\\pi/8)=${fix(v, Math.cos(Math.PI / 8) ** 2, 4)}$`);
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Paradox',
      name: 'Hardy’s paradox',
      statement: String.raw`Alice and Bob each choose one of two yes/no measurements, $a_0,a_1$ and $b_0,b_1$ (outcome $1$ or $0$). Suppose the joint statistics satisfy
$$P(a_0{=}1,b_0{=}1)=0,\qquad P(a_1{=}1,b_0{=}0)=0,\qquad P(a_0{=}0,b_1{=}1)=0 .$$
In any local hidden-variable model these force $P(a_1{=}1,b_1{=}1)=0$ as well. But there are pure two-qubit states and measurement settings obeying the three conditions for which $P(a_1{=}1,b_1{=}1)>0$; the largest possible value is $\tfrac{5\sqrt5-11}{2}\approx0.0902$, reached by a non-maximally entangled state. Maximally entangled states never show the effect.`,
      idea: String.raw`Suppose a local model assigns every run values for all four observables. If $a_1=b_1=1$ then the second condition forces $b_0=1$ and the third forces $a_0=1$, contradicting the first. So the event can never occur, a logical contradiction with no inequality or averaging needed (unlike Bell's, qm-14.7 and qm-14.2). In quantum mechanics each zero is an orthogonality $\langle a|\langle b|\Psi\rangle=0$; given $|\Psi\rangle$ and Alice's first axis, the other three axes are determined, and the remaining probability is generically non-zero.`,
      caption: String.raw`Choose the state's Schmidt angle $\varepsilon$ (entanglement) and Alice's first axis $\varphi$; the other three axes are solved so that the three conditions hold exactly (left panel: real axes drawn as arrows). The bars show the four joint probabilities: three zeros and one positive. *Optimise* finds the best $\varphi$. The right-hand curve shows the best achievable probability for each $\varepsilon$: zero for product states and for $\varepsilon=\pi/4$ (maximal entanglement), peaking at about $9.02\%$.`,
      deps: ['qm-14.7', 'qm-14.2'],
      refs: ['Nielsen–Chuang §2.6'],
      tags: ['nonlocality', 'Bell theorem', 'entanglement'],
      scope: String.raw`Pure two-qubit states $\cos\varepsilon|00\rangle+\sin\varepsilon|11\rangle$ (any pure two-qubit state is equivalent to this by local unitaries) with real projective measurements.`,
      credit: String.raw`L. Hardy, 1993 (Phys. Rev. Lett. 71, 1665)`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hardy%27s_paradox' },
      viz(v) {
        const eps = v.slider('state angle $\\varepsilon$', 0.02, Math.PI / 2 - 0.02, 0.435, { step: 0.005 });
        const phi = v.slider('Alice’s first axis $\\varphi$', 0, Math.PI, 2.17, { step: 0.005 });
        const Sx = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 290, weight: 0.7, title: 'the four measurement axes' });
        const Bx = v.stage({ x: [0, 0.125], y: [-0.1, 4.95], axes: false, height: 290, weight: 1, title: 'joint probabilities' });
        const Pf = v.stage({ x: [0, Math.PI], y: [0, 0.105], axes: 'box', gutter: true, height: 290, weight: 0.9, xlabel: 'Alice’s first axis $\\varphi$', ylabel: '$P(a_1{=}1,b_1{=}1)$', title: 'as Alice’s first axis turns', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']] });
        const Pe = v.stage({ x: [0, Math.PI / 2], y: [0, 0.105], axes: 'box', gutter: true, height: 290, weight: 0.9, xlabel: 'state $\\varepsilon$', ylabel: 'largest $P(a_1{=}1,b_1{=}1)$', title: 'the best case versus entanglement', xticks: [[0, '0'], [Math.PI / 4, 'π/4'], [Math.PI / 2, 'π/2']] });
        const perp = (u) => [-u[1], u[0]], dt = (a, b) => a[0] * b[0] + a[1] * b[1], nz = (u) => { const L = Math.hypot(u[0], u[1]) || 1; return [u[0] / L, u[1] / L]; };
        function solve(e, f) {
          const c = Math.cos(e), s = Math.sin(e), M = (u) => [c * u[0], s * u[1]], a0 = [Math.cos(f), Math.sin(f)], a0p = perp(a0);
          const b0z = nz(M(a0)), b0 = perp(b0z), a1 = nz(perp(M(b0z))), b1 = nz(perp(M(a0p))), P = (a, b) => dt(a, M(b)) ** 2;
          return { a0, a1, b0, b1, b0z, a0p, p: [P(a0, b0), P(a1, b0z), P(a0p, b1), P(a1, b1)] };
        }
        const bestPhi = (e) => { let bp = 0, bf = 0; for (let k = 0; k < 360; k++) { const f = (k * Math.PI) / 360, p = solve(e, f).p[3]; if (p > bp) { bp = p; bf = f; } } return [bp, bf]; };
        const EPS = [...Array(120).keys()].map((k) => 0.012 + (k * (Math.PI / 2 - 0.024)) / 119), best = EPS.map((e) => [e, bestPhi(e)[0]]);
        v.button('Optimise $\\varphi$', () => phi.set(bestPhi(eps.value)[1]));
        let cur;
        v.render(() => {
          const sol = solve(eps.value, phi.value); cur = sol;
          Sx.circle(0, 0, 1, { color: 'faint', width: 1 });
          for (const [u, col, lab] of [[sol.a0, 'accent', 'a₀'], [sol.a1, 'teal', 'a₁'], [sol.b0, 'orange', 'b₀'], [sol.b1, 'pink', 'b₁']]) { Sx.arrow(0, 0, u[0], u[1], { color: col, width: 2.4, head: 8 }); Sx.text(lab, u[0] * 1.2, u[1] * 1.2, { color: col, size: 12.5, align: 'center', baseline: 'middle' }); }
          const rows = [['a₀=1, b₀=1', 'forbidden', 0], ['a₁=1, b₀=0', 'forbidden', 1], ['a₀=0, b₁=1', 'forbidden', 2], ['a₁=1, b₁=1', 'local models: also 0', 3]];
          rows.forEach(([lab, note, k]) => {
            const y = 4 - k - 0.2, p = sol.p[k], col = k === 3 ? 'red' : 'green';
            Bx.text(`${lab}   (${note})`, 0.001, y + 0.62, { size: 11.5, color: k === 3 ? 'red' : 'muted', baseline: 'bottom' });
            Bx.rect(0, y, 0.105, y + 0.4, { fill: 'grid', fillAlpha: 0.2, color: 'grid', width: 0.6 });
            if (p > 1e-9) Bx.rect(0, y, p, y + 0.4, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            Bx.text(p < 1e-9 ? '0' : `${fix(v, p * 100, 2)}%`, Math.max(p, 0) + 0.002, y + 0.2, { size: 12, color: 'ink', baseline: 'middle' });
          });
          const cv = []; for (let k = 0; k <= 180; k++) { const f = (k * Math.PI) / 180; cv.push([f, solve(eps.value, f).p[3]]); }
          Pf.path(cv, { color: 'accent', width: 2.2 }); Pf.dot(phi.value, sol.p[3], { color: 'gold', r: 6 });
          Pe.hline((5 * Math.sqrt(5) - 11) / 2, { color: 'green', dash: true, width: 1.4 }); Pe.text('(5√5 − 11)/2 ≈ 0.0902', 0.04, (5 * Math.sqrt(5) - 11) / 2, { size: 11, color: 'green', baseline: 'bottom', dy: -3 });
          Pe.vline(Math.PI / 4, { color: 'faint', dash: true });
          Pe.path(best, { color: 'accent', width: 2.2 }); Pe.dot(eps.value, bestPhi(eps.value)[0], { color: 'gold', r: 6 });
        });
        v.readout(() => {
          const ok = []; for (let m = 0; m < 16; m++) { const a0 = m & 1, a1 = (m >> 1) & 1, b0 = (m >> 2) & 1, b1 = (m >> 3) & 1; if (!(a0 && b0) && !(a1 && !b0) && !(!a0 && b1)) ok.push([a0, a1, b0, b1]); }
          return `quantum: $P(a_1{=}1,b_1{=}1)=${fix(v, cur.p[3], 4)}$ while the three conditions hold to $${v.sci(Math.max(cur.p[0], cur.p[1], cur.p[2]), 1)}$\nlocal deterministic assignments: ${ok.length} of 16 satisfy the three conditions, and ${ok.filter((o) => o[1] && o[3]).length} of them have $a_1=b_1=1$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Monogamy of entanglement',
      statement: String.raw`Let $\rho_{ABC}$ be a pure state of three qubits. Write $\tau_{AB}=C(\rho_{AB})^2$ and $\tau_{AC}=C(\rho_{AC})^2$ for the squared **concurrences** (Wootters) of the two-qubit marginals, and $\tau_{A(BC)}=4\det\rho_A$ for the entanglement of $A$ with the pair $BC$. Then
$$\tau_{AB}+\tau_{AC}\;\le\;\tau_{A(BC)}\;\le\;1 .$$
Entanglement cannot be freely shared: the more strongly $A$ is entangled with $B$, the less it can be with $C$. Equality holds on the $W$ class (for the $W$ state $\tfrac49+\tfrac49=\tfrac89=\tau_{A(BC)}$) and fails strictly for GHZ, where $0<1$.`,
      idea: String.raw`The squared concurrence of a two-qubit state is a convex-roof quantity built from the singular values of $\sigma_y\otimes\sigma_y\rho^*\sigma_y\otimes\sigma_y$ (qm-14.5), and for pure $A(BC)$ it equals $4\det\rho_A$. Coffman, Kundu and Wootters showed by direct inequality that the pairwise terms cannot exceed it. The remainder $\tau_{A(BC)}-\tau_{AB}-\tau_{AC}$ is the **3-tangle**, a genuinely three-party entanglement; it vanishes on the $W$ class and equals 1 on GHZ. The Bell-type monogamy of correlations (qm-14.9) is the quantitative shadow of this statement.`,
      caption: String.raw`Each dot is a three-qubit pure state. Left: $\tau_{AB}+\tau_{AC}$ against $\tau_{A(BC)}$: every dot lies below the diagonal; *W class* states $a|100\rangle+b|010\rangle+c|001\rangle$ sit exactly on it. Right: the pair $(\tau_{AB},\tau_{AC})$ (their sum never exceeds $1$). The gold dot walks the path $\cos\vartheta\,|\mathrm{GHZ}\rangle+\sin\vartheta\,|W\rangle$ with the slider; Bell pairs between $A$ and $B$ would sit at $(1,0)$ but then $\tau_{AC}=0$.`,
      deps: ['qm-14.5', 'qm-14.9'],
      refs: ['Nielsen–Chuang §12.5'],
      tags: ['monogamy', 'concurrence', 'tangle'],
      scope: String.raw`Three qubits in a pure state; the generalisation to $n$ qubits is the CKW inequality, proved for qubits by Osborne and Verstraete (2006).`,
      credit: String.raw`V. Coffman, J. Kundu and W. K. Wootters, 2000 (Phys. Rev. A 61, 052306); concurrence: W. K. Wootters, 1998 (Phys. Rev. Lett. 80, 2245)`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Monogamy_of_entanglement' },
      viz(v) {
        const T1 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, equal: true, height: 330, weight: 1, xlabel: '$\\tau_{A(BC)}=4\\det\\rho_A$', ylabel: '$\\tau_{AB}+\\tau_{AC}$', title: 'the CKW bound' });
        const T2 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, equal: true, height: 330, weight: 1, xlabel: '$\\tau_{AB}$', ylabel: '$\\tau_{AC}$', title: 'pairwise entanglement of $A$' });
        const kind = v.select('states', [{ value: 'haar', label: 'Haar random' }, { value: 'w', label: 'W class' }, { value: 'both', label: 'both' }], 'both');
        const nS = v.slider('number of states', 20, 500, 250, { int: true });
        const th = v.slider('GHZ → W path $\\vartheta$', 0, Math.PI / 2, 0.9, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const taus = (psi) => {
          const rho = outerV(psi), rA = ptrace(rho, 3, [0]), rB = ptrace(rho, 3, [0, 1]), rC = ptrace(rho, 3, [0, 2]);
          const d = rA[0][0][0] * rA[1][1][0] - cabs2(rA[0][1]);
          return { ab: concurrence(v, rB) ** 2, ac: concurrence(v, rC) ** 2, a: 4 * d };
        };
        const GHZ = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i === 0 || i === 7 ? R2 : 0, 0]), Wst = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i === 1 || i === 2 || i === 4 ? 1 / Math.sqrt(3) : 0, 0]);
        const path = (t) => normalize(GHZ.map((z, i) => [Math.cos(t) * z[0] + Math.sin(t) * Wst[i][0], 0]));
        let cache = null, stats;
        const sample = () => {
          const key = `${kind.value}|${nS.value}|${seed}`; if (cache && cache.key === key) return cache.pts;
          const r = v.rng(seed * 977), pts = [];
          for (let i = 0; i < nS.value; i++) {
            const isW = kind.value === 'w' || (kind.value === 'both' && i % 2);
            let psi; if (isW) { const a = Math.abs(r.normal()), b = Math.abs(r.normal()), c = Math.abs(r.normal()); psi = zeroState(8).map(() => [0, 0]); psi[4] = [a, 0]; psi[2] = [b, 0]; psi[1] = [c, 0]; psi = normalize(psi); } else psi = haarState(r, 8);
            pts.push({ ...taus(psi), w: isW });
          }
          cache = { key, pts }; return pts;
        };
        const ptsPath = [...Array(61).keys()].map((k) => { const t = (k * Math.PI) / 120; return { t, ...taus(path(t)) }; });
        v.render(() => {
          const pts = sample(), cu = taus(path(th.value));
          let worst = -1, sat = 0; for (const p of pts) { worst = Math.max(worst, p.ab + p.ac - p.a); if (Math.abs(p.ab + p.ac - p.a) < 1e-6) sat++; }
          stats = { n: pts.length, worst, sat, cu };
          T1.line(0, 0, 1, 1, { color: 'green', width: 1.6, dash: true }); T1.text('equality line', 0.02, 0.82, { size: 11, color: 'green', align: 'left', plate: true });
          for (const p of pts) T1.dot(p.a, p.ab + p.ac, { color: p.w ? 'orange' : 'accent', r: 2.6 });
          T1.path(ptsPath.map((p) => [p.a, p.ab + p.ac]), { color: 'gold', width: 1.4, alpha: 0.7 });
          T1.dot(cu.a, cu.ab + cu.ac, { color: 'gold', r: 6.5, label: 'GHZ→W' , labelPos: 'se' });
          T2.line(0, 1, 1, 0, { color: 'red', width: 1.4, dash: true }); T2.text('$\\tau_{AB}+\\tau_{AC}=1$', 0.62, 0.7, { size: 11, color: 'red', align: 'left', plate: true });
          for (const p of pts) T2.dot(p.ab, p.ac, { color: p.w ? 'orange' : 'accent', r: 2.6 });
          T2.path(ptsPath.map((p) => [p.ab, p.ac]), { color: 'gold', width: 1.4, alpha: 0.7 });
          T2.dot(cu.ab, cu.ac, { color: 'gold', r: 6.5 });
          T2.dot(1, 0, { color: 'muted', r: 4, hollow: true, label: 'Bell pair AB', labelPos: 'nw' });
          T2.dot(4 / 9, 4 / 9, { color: 'muted', r: 4, hollow: true, label: 'W', labelPos: 'ne' });
          T2.dot(0, 0, { color: 'muted', r: 4, hollow: true, label: 'GHZ', labelPos: 'ne' });
        });
        v.legend([['accent', 'Haar random'], ['orange', 'W class'], ['gold', 'GHZ → W path']]);
        v.readout(() => `${stats.n} states: smallest gap $\\tau_{A(BC)}-\\tau_{AB}-\\tau_{AC}=${v.sci(Math.max(-stats.worst, 1e-16), 2)}$ (never negative beyond rounding: the bound holds), ${stats.sat} on the equality line\ngold state: $\\tau_{AB}=${fix(v, stats.cu.ab)},\\ \\tau_{AC}=${fix(v, stats.cu.ac)},\\ \\tau_{A(BC)}=${fix(v, stats.cu.a)}$, 3-tangle $=${fix(v, stats.cu.a - stats.cu.ab - stats.cu.ac)}$`);
      },
    },
  ],
};
