// Quantum Information & Computation — Chapter 3: Quantum communication and cryptography
import {
  TAU, R2, fidOfW, wOfFid, wernerR, BELLR, BELL, bellFidR, corrT, chshMax, dephaseR, jointProbs, swapOutcome, bilateralRound, bbpsswFormula,
  drawGroups, tilesR, rtrace,
} from './ch03.shared.js';

import {repeaterModel,logDirect} from './algorithm-sources-audit.shared.js';

const fix = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);
const pct = (v, x, d = 1) => `${fix(v, x * 100, d)}%`;
const bit2 = (n) => n.toString(2).padStart(2, '0');

export default {
  collection: 'qinfo',
  chapter: 3,
  title: 'Quantum communication and cryptography',
  summary: String.raw`In the circuit model, shared entanglement plus classical bits doubles the capacity of a qubit (superdense coding), and a Bell measurement in the middle of a chain swaps entanglement between parties that never met. Because measurement disturbs and copying is impossible, quantum states make unforgeable money and keys whose eavesdroppers reveal themselves (BB84, E91). Noisy entanglement can be distilled, and repeaters stitch short links into long ones.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Quantum circuit model',
      statement: String.raw`A **quantum circuit** on $n$ qubits is a time-ordered list of gates, each a unitary acting on one or two of the qubits, applied to the input $|0\rangle^{\otimes n}$ and usually ended by measurements in the computational basis. The state after the first $k$ gates is
$$\begin{gathered}|\psi_k\rangle=U_k\cdots U_2U_1|0\ldots0\rangle\\\in\mathbb C^{2^n},\end{gathered}$$
where each $U_j$ is a one- or two-qubit gate tensored with identities on the other wires. A measurement of all wires then returns the bit string $x$ with probability $|\langle x|\psi_k\rangle|^2$ (the Born rule). The circuit's *size* is the number of gates and its *depth* the number of layers of gates that can run in parallel.`,
      idea: String.raw`A wire is a qubit and a box is a unitary, so the diagram is just a product of matrices written in time order: reading it left to right you multiply on the left each time. Gates on disjoint wires commute, which is why they can be drawn in one column. A state of $n$ qubits needs $2^n$ complex amplitudes (qm-14.1), so a classical simulation tracks exponentially many numbers; this is the sense in which the picture is expensive to simulate but cheap to run on hardware. Measurement collapses the state according to the projection postulate (qm-5.7).

The tensor-basis result ladr-9.74 gives a basis of the composite space by taking all products of the two basis vectors on each wire. Iterating it yields one basis vector for each of the $2^n$ binary strings, so a generic pure state needs that many complex coordinates. This is the state-vector storage claim used here, not a lower bound for every possible classical simulation of special circuits.`,
      caption: String.raw`**Build a circuit**: choose a gate, the target wire (and a control wire for two-qubit gates) and press *Add gate*; or load a preset. The *after gate* slider replays the circuit gate by gate (a click on a gate in the diagram does the same). Bars show the probability of every bit string, with colour giving the phase of the amplitude; the three spheres are the single-qubit Bloch vectors, which shrink toward the centre exactly when that qubit is entangled with the others.`,
      deps: ['qinfo-2.1', 'qm-5.7', 'ladr-9.74'],
      refs: ['Nielsen–Chuang §1.3.4', 'Nielsen–Chuang §4.6'],
      tags: ['circuits', 'gates', 'simulation'],
      credit: 'D. Deutsch, “Quantum computational networks”, Proc. R. Soc. Lond. A 425, 73–90 (1989)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_circuit' },
      viz(v) {
        const Q = v.quantum(), n = 3, qc = Q.circuit(n), MAXG = 16;
        const Dg = v.stage({ axes: false, height: 200, full: true, title: 'the circuit (drag the slider or click a gate to replay)' });
        const Am = v.stage({ axes: false, height: 250, weight: 1.6, title: 'amplitudes of the state after the chosen gate' });
        const B = [0, 1, 2].map((i) => v.stage3d({ height: 250, range: 1.5, weight: 0.55, minWidth: 150, title: `qubit ${i}` }));
        const GATES = [['H', 'H'], ['X', 'X'], ['Z', 'Z'], ['S', 'S'], ['T', 'T'], ['CX', 'CNOT'], ['CZ', 'CZ'], ['SWAP', 'SWAP']];
        const gate = v.select('gate', GATES.map(([value, label]) => ({ value, label })), 'H');
        const tgt = v.select('target wire', ['0', '1', '2'].map((value) => ({ value, label: `q${value}` })), '0');
        const ctl = v.select('control wire', ['0', '1', '2'].map((value) => ({ value, label: `q${value}` })), '1');
        const step = v.slider('after gate', 0, MAXG, MAXG, { int: true });
        let ops = [{ g: 'H', q: [0] }, { g: 'CX', q: [0, 1] }, { g: 'CX', q: [1, 2] }];
        const two = (g) => g === 'CX' || g === 'CZ' || g === 'SWAP';
        v.button('Add gate', () => {
          if (ops.length >= MAXG) return;
          const t = +tgt.value; let c = +ctl.value; if (c === t) c = (t + 1) % n;
          ops.push({ g: gate.value, q: two(gate.value) ? [c, t] : [t] });
        });
        v.button('Undo', () => { ops.pop(); });
        v.button('Clear', () => { ops = []; });
        v.button('Bell pair', () => { ops = [{ g: 'H', q: [0] }, { g: 'CX', q: [0, 1] }]; });
        v.button('GHZ state', () => { ops = [{ g: 'H', q: [0] }, { g: 'CX', q: [0, 1] }, { g: 'CX', q: [1, 2] }]; });
        v.button('Swap by 3 CNOTs', () => { ops = [{ g: 'X', q: [0] }, { g: 'CX', q: [0, 1] }, { g: 'CX', q: [1, 0] }, { g: 'CX', q: [0, 1] }]; });
        let cur;
        v.render(() => {
          qc.clear(); for (const o of ops) qc.add(o.g, o.q);
          const k = Math.min(step.value, ops.length), psi = qc.state(k);
          Q.diagram(Dg, qc, { step: k, onPick: (j) => step.set(j) });
          Q.amplitudes(Am, psi);
          for (let i = 0; i < n; i++) Q.bloch(B[i], psi, { qubit: i });
          cur = { k, psi, ents: [0, 1, 2].map((i) => psi.entropy(i)), norm: psi.probs().reduce((s, x) => s + x, 0) };
        });
        v.readout(() => `state after ${cur.k} of ${ops.length} gates: $${cur.psi.ket(3)}$\nentropy of each wire: $${cur.ents.map((e) => fix(v, e, 2)).join(',\\ ')}$ bit${cur.ents.some((e) => e > 0.01) ? ' — some wires are entangled with the rest' : ' — a product state'} · total probability $${fix(v, cur.norm, 6)}$ (unitary gates preserve it) · $2^{${n}}=${1 << n}$ amplitudes tracked`);
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Algorithm',
      name: 'Superdense coding',
      statement: String.raw`Alice and Bob share the Bell pair $|\Phi^+\rangle=\tfrac1{\sqrt2}(|00\rangle+|11\rangle)$, Alice holding the first qubit. To send two classical bits $m=(a,b)$, Alice applies $Z^aX^b$ to her qubit and sends that one qubit to Bob. The four resulting states $(Z^aX^b\otimes I)|\Phi^+\rangle$ are the four Bell states, which are orthogonal, so Bob's Bell measurement (CNOT, Hadamard, then a computational-basis measurement) returns $(a,b)$ with certainty. One transmitted qubit therefore carries two bits, **given one previously shared ebit**.

Without the shared entanglement a qubit carries at most one classical bit (Holevo's bound); with it the capacity doubles, but only because the pair was distributed beforehand.`,
      idea: String.raw`Alice's operation on her half cannot change Bob's reduced state, which stays maximally mixed (no-signalling, qm-14.13), yet it moves the *joint* state among four orthogonal Bell states (qinfo-2.2), and a joint measurement can read off which one. The information sits in the correlations of the pair, not in either qubit. Four messages need four orthogonal states, and only a two-qubit system has room for them: a single qubit offers only a two-dimensional space, in which four equiprobable messages can never be told apart better than half the time.

The dimension step uses ladr-6.25: orthonormal message vectors are linearly independent, so a two-dimensional qubit space cannot contain four of them. The shared pair instead supplies a four-dimensional space and four orthogonal Bell messages. The stronger stated half-success bound for four equiprobable qubit messages also follows directly: each density matrix is bounded by I, so summing $\operatorname{tr}(E_m\rho_m)/4$ over any four-outcome POVM is at most $\operatorname{tr}I/4=1/2$.`,
      caption: String.raw`Pick the **message** and step the circuit with the slider: prepare the Bell pair, Alice's gate, Bob's decoder. The tally compares the decoding success of **superdense coding** (green) with the best that one *unentangled* qubit can do for four equally likely messages (orange, the four tetrahedron states with their optimal measurement): $\tfrac12$. The *channel noise* slider replaces Alice's qubit by the maximally mixed state with probability $p$; the success rate falls to $1-\tfrac34p$.`,
      deps: ['qinfo-3.1', 'qinfo-2.2', 'ladr-6.25'],
      refs: ['Nielsen–Chuang §2.3'],
      tags: ['entanglement', 'classical capacity', 'Bell states'],
      scope: String.raw`Ideal gates and a noiseless shared pair; the noise slider models only depolarisation of the transmitted qubit. The 1996 Innsbruck photon experiment implemented the protocol, but linear optics can separate only three of the four Bell states, so it reached about $\log_23\approx1.58$ bits per qubit rather than 2.`,
      credit: 'C. H. Bennett and S. J. Wiesner, Phys. Rev. Lett. 69, 2881 (1992); first experiment: K. Mattle, H. Weinfurter, P. G. Kwiat and A. Zeilinger, Phys. Rev. Lett. 76, 4656 (1996)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Superdense_coding' },
      viz(v) {
        const Q = v.quantum(), qc = Q.circuit(2);
        const Dg = v.stage({ axes: false, height: 210, weight: 1.5, title: 'the protocol (Alice: top wire, Bob: bottom wire)' });
        const Am = v.stage({ axes: false, height: 210, weight: 1, title: 'state after the chosen step' });
        const T = v.stage({ x: [-0.1, 9.2], y: [-0.2, 1.34], axes: false, height: 250, full: true, title: 'what Bob learns (pale: exact probability, gold: your trials)' });
        const msg = v.select('message $(a,b)$', ['00', '01', '10', '11'].map((value) => ({ value, label: value })), '10');
        const step = v.slider('step', 0, 7, 7, { int: true });
        const noise = v.slider('channel noise $p$', 0, 1, 0, { step: 0.01 });
        const nTr = v.slider('trials', 10, 5000, 400, { log: true, int: true });
        let seed = 4; v.button('run again', () => { seed++; });
        const tet = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((p) => p.map((x) => x / Math.sqrt(3)));
        let cur;
        v.render(() => {
          const a = +msg.value[0], b = +msg.value[1], m = 2 * a + b;
          qc.clear(); qc.h(0).cx(0, 1); if (b) qc.x(0); if (a) qc.z(0); qc.cx(0, 1).h(0).measure();
          const nOps = qc.ops.length, k = Math.min(step.value, nOps);
          Q.diagram(Dg, qc, { step: k, onPick: (j) => step.set(j), labels: ['A', 'B'] });
          Q.amplitudes(Am, qc.state(k), { wheel: false });
          const fin = qc.state(nOps - 2), pr = fin.probs();
          const p = noise.value, ent = [0, 1, 2, 3].map((j) => (1 - p) * pr[j] + p / 4);
          // one unentangled qubit: states at the tetrahedron vertices, POVM elements ½|ψ_j⟩⟨ψ_j|
          const alone = [0, 1, 2, 3].map((j) => 0.5 * (1 + tet[j][0] * tet[m][0] + tet[j][1] * tet[m][1] + tet[j][2] * tet[m][2]) / 2);
          const r = v.rng(seed * 31 + m), N = nTr.value, ce = [0, 0, 0, 0], ca = [0, 0, 0, 0];
          const draw = (probs, cnt) => { let u = r(), j = 0; while (j < 3 && u > probs[j]) { u -= probs[j]; j++; } cnt[j]++; };
          for (let i = 0; i < N; i++) { draw(ent, ce); draw(alone, ca); }
          const nm = ['00', '01', '10', '11'];
          drawGroups(v, T, [
            { probs: ent, freq: ce.map((c) => c / N), names: nm, colors: ['green', 'green', 'green', 'green'], label: 'with a shared Bell pair', labelColor: 'green' },
            { probs: alone, freq: ca.map((c) => c / N), names: nm, colors: ['orange', 'orange', 'orange', 'orange'], label: 'one unentangled qubit', labelColor: 'orange' },
          ], { labelY: 1.22 });
          cur = { m, okE: ce[m] / N, okA: ca[m] / N, exactE: ent[m], N };
        });
        v.readout(() => `message ${msg.value}: Bob decodes correctly in ${pct(v, cur.okE)} of ${cur.N} trials with entanglement (exact ${fix(v, cur.exactE, 3)}${noise.value > 0 ? `, $1-\\tfrac34p=${fix(v, 1 - 0.75 * noise.value, 3)}$` : ''}) and in ${pct(v, cur.okA)} with an unentangled qubit (exact $\\tfrac12$, Alice sends 1 qubit either way)`);
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Phenomenon',
      name: 'Entanglement swapping',
      statement: String.raw`Let $A,B$ share a Bell state and $C,D$ share another, the two pairs being independent. Measure $B$ and $C$ together in the Bell basis. Each of the four outcomes occurs with probability $\tfrac14$, and conditioned on outcome $k$ the qubits $A$ and $D$, which never interacted, are left in the Bell state $|\beta_k\rangle$ (for two $|\Phi^+\rangle$ pairs, the same label as the outcome). Telling $D$'s holder the outcome lets her undo the Pauli difference.

If the pairs are Werner states with visibilities $w_1,w_2$ (mixtures $w|\Phi^+\rangle\langle\Phi^+|+(1-w)I/4$), the swapped pair is a Werner state with visibility $w_1w_2$, and its best CHSH value is $2\sqrt2\,w_1w_2$.`,
      idea: String.raw`Write the four-qubit state $|\Phi^+\rangle_{AB}|\Phi^+\rangle_{CD}$ in the Bell basis of $(B,C)$: it is an equal-weight sum of $|\beta_k\rangle_{BC}|\beta_k\rangle_{AD}$, so projecting $BC$ onto $\beta_k$ leaves $AD$ in $\beta_k$. This is teleportation (qm-14.15) in which the teleported qubit is itself half of a pair; it moves entanglement without moving qubits. The measurement of $B,C$ is the Bell measurement of qinfo-2.2. Noise multiplies because the correlation matrix of a Werner state is $w$ times that of the Bell state, and projecting multiplies the two matrices.`,
      caption: String.raw`The circuit makes both pairs and measures $B,C$; the sliders set the visibility of each pair. The bars compare the best CHSH value $S_{\max}$ (Horodecki's formula, computed from the exact four-qubit density matrix after tracing out $B,C$) for $A$–$D$ before the measurement (zero, no correlation) and after each outcome: all four reach $2\sqrt2\,w_1w_2$, above the classical bound 2 only while $w_1w_2>1/\sqrt2$. The matrix shows the correlation tensor of the swapped pair for the selected outcome.`,
      deps: ['qm-14.15', 'qinfo-2.2'],
      refs: ['Nielsen–Chuang §1.3.7'],
      tags: ['entanglement', 'Bell measurement', 'teleportation'],
      scope: String.raw`Two independent, identically prepared Werner pairs and a perfect Bell measurement. Experiments (Pan, Bouwmeester, Weinfurter, Zeilinger, 1998) used photons, whose Bell measurement is incomplete.`,
      credit: 'M. Żukowski, A. Zeilinger, M. A. Horne and A. K. Ekert, Phys. Rev. Lett. 71, 4287 (1993); first experiment: J.-W. Pan, D. Bouwmeester, H. Weinfurter and A. Zeilinger, Phys. Rev. Lett. 80, 3891 (1998)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entanglement_swapping' },
      viz(v) {
        const Q = v.quantum(), qc = Q.circuit(4).h(0).cx(0, 1).h(2).cx(2, 3).cx(1, 2).h(1).measure(1).measure(2);
        const Dg = v.stage({ axes: false, height: 230, full: true, title: 'pairs $AB$ and $CD$, then a Bell measurement of $B$ and $C$' });
        const Sb = v.stage({ x: [-0.6, 5.6], y: [-0.35, 3.3], axes: false, height: 290, weight: 1.15, title: 'best CHSH value of $A$–$D$' });
        const Tm = v.stage({ x: [-0.55, 1.05], y: [-0.2, 1.3], axes: false, height: 290, weight: 0.9, title: 'correlation tensor $T_{ij}$ of $A$–$D$' });
        const w1 = v.slider('visibility of pair $AB$', 0.5, 1, 1, { step: 0.005 });
        const w2 = v.slider('visibility of pair $CD$', 0.5, 1, 1, { step: 0.005 });
        const out = v.select('Bell outcome of $B,C$', BELL.map((b, k) => ({ value: String(k), label: `$${b.tex}$` })), '0');
        const step = v.slider('circuit step', 0, 8, 8, { int: true });
        let cur;
        v.render(() => {
          Q.diagram(Dg, qc, { step: step.value, onPick: (j) => step.set(j), labels: ['A', 'B', 'C', 'D'] });
          const res = [0, 1, 2, 3].map((k) => swapOutcome(w1.value, w2.value, k));
          const Ss = res.map((r) => chshMax(v, r.rho)), k = +out.value, T = corrT(res[k].rho);
          // before the measurement A and D are uncorrelated: tr_BC of the product state is I/4
          const vals = [0, ...Ss], names = ['before', ...BELL.map((b) => b.name)];
          vals.forEach((s, i) => {
            const col = i === 0 ? 'muted' : i - 1 === k ? 'green' : 'blue';
            Sb.rect(i + 0.12, 0, i + 0.88, s, { fill: col, fillAlpha: 0.3, color: col, width: 1.6 });
            Sb.text(fix(v, s, 2), i + 0.5, s, { size: 11.5, align: 'center', baseline: 'bottom', dy: -3, color: 'ink' });
            Sb.text(names[i], i + 0.5, 0, { size: 12, align: 'center', baseline: 'top', dy: 5, color: 'muted' });
          });
          Sb.hline(2, { color: 'red', dash: true, width: 1.4 }); Sb.text('classical bound 2', -0.5, 2, { size: 11, color: 'red', align: 'left', baseline: 'bottom', dy: -3 });
          Sb.hline(2 * Math.SQRT2, { color: 'green', dash: true, width: 1.2 }); Sb.text('Tsirelson 2√2', -0.5, 2 * Math.SQRT2, { size: 11, color: 'green', align: 'left', baseline: 'bottom', dy: -3 });
          tilesR(v, Tm, T, [0, 0, 1, 1], { size: 13 });
          ['x', 'y', 'z'].forEach((c, i) => { Tm.text(`σ${c}`, (i + 0.5) / 3, 1.03, { size: 12, align: 'center', baseline: 'bottom', color: 'muted' }); Tm.text(`σ${c}`, -0.03, 1 - (i + 0.5) / 3, { size: 12, align: 'right', baseline: 'middle', color: 'muted' }); });
          Tm.text('rows: A, columns: D', 0.5, -0.04, { size: 11, align: 'center', baseline: 'top', color: 'muted' });
          const fid = [0, 1, 2, 3].map((j) => bellFidR(res[k].rho, j));
          cur = { Ss, prod: w1.value * w2.value, p: res.map((r) => r.p), fid, k, pAll: res.reduce((s, r) => s + r.p, 0) };
        });
        v.readout(() => `outcome probabilities $${cur.p.map((p) => fix(v, p, 3)).join(',\\ ')}$ (sum $${fix(v, cur.pAll, 3)}$); for outcome $${BELL[cur.k].tex}$ the pair $A$–$D$ has fidelity $${fix(v, cur.fid[cur.k], 3)}$ with $${BELL[cur.k].tex}$\nbest CHSH value $S_{\\max}=${fix(v, cur.Ss[cur.k], 4)}$ against $2\\sqrt2\\,w_1w_2=${fix(v, 2 * Math.SQRT2 * cur.prod, 4)}$ · ${cur.Ss[cur.k] > 2 + 1e-9 ? '**violates CHSH: A and D are entangled although they never interacted**' : 'no CHSH violation; this test alone does not establish whether the swapped pair is separable'}`);
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Algorithm',
      name: 'Wiesner’s quantum money',
      statement: String.raw`A bank issues a note with a serial number and $n$ qubits, the $i$-th prepared in one of $|0\rangle,|1\rangle,|+\rangle,|-\rangle$, chosen at random: a secret basis bit $b_i$ ($+$ or $\times$) and a secret value bit $s_i$. The bank stores $(b_i,s_i)_i$ against the serial number. To **verify** a note it measures qubit $i$ in basis $b_i$ and accepts if all results equal $s_i$: a genuine note is always accepted.

A forger who does not know the bases and uses *measure and resend* (measure each qubit in a guessed basis, prepare a state from the outcome) passes the test on a single forged note with probability $(3/4)^n$ per note; to turn one note into **two** accepted notes this attack succeeds with probability $(5/8)^n$, and no strategy whatever achieves more than $(3/4)^n$ for two notes. Either way the success probability falls exponentially in $n$.`,
      idea: String.raw`If the guessed basis is right (probability $\tfrac12$) the forger learns $s_i$ and the copy is perfect; if it is wrong, the outcome is a fair coin in the wrong basis and the bank's measurement in the true basis again gives a fair coin, so the qubit passes with probability $\tfrac12$. Averaging, $\tfrac12\cdot1+\tfrac12\cdot\tfrac12=\tfrac34$ per qubit. For two copies the wrong-basis case must pass twice, $\tfrac14$, giving $\tfrac12+\tfrac18=\tfrac58$. Qubits are independent, so the probabilities multiply. The root cause is the no-cloning theorem (qm-14.14): the four states are not orthogonal (qinfo-1.5), so no measurement identifies them, and measuring disturbs them.

The exponential factors use the finite-family independence definition prob-2.1.1a. For this specified measure-and-resend attack, independent note preparations and separate independent basis guesses make the per-position acceptance events independent. Their intersection therefore has probability $(3/4)^n$ for one output note or $(5/8)^n$ for both outputs together. This multiplication does not prove the separately quoted optimal bound against arbitrary joint forging strategies.`,
      caption: String.raw`The top row of the strip is the bank's secret state of each qubit (toggle *reveal* to see it; arrows show the polarisation). The forger picks a basis for each (row 2, green if lucky) and sends two copies; rows 3 and 4 show whether each copy passes the bank's test. Slide the **note length** $n$: on the log-scale graph the gold dots are the fraction of 20 000 simulated forgeries in which *both* copies were accepted, tracking $(5/8)^n$ (orange); the green curve $(3/4)^n$ is the pass rate of a single copy, and also the best any attack can do for two copies. A genuine, untouched note passes every time.`,
      deps: ['qinfo-1.5', 'qm-14.14', 'prob-2.1.1a'],
      refs: ['Nielsen–Chuang §12.6'],
      tags: ['quantum money', 'no-cloning', 'cryptography'],
      scope: String.raw`Wiesner's original scheme is *private-key* money: only the bank can verify, by looking up the secret bases in its database, and the bank's accept/reject answers must not leak (a forger who can query the bank repeatedly can learn the bases). The numbers assume noiseless qubits and a forger holding one note.`,
      credit: 'S. Wiesner, “Conjugate coding”, written around 1970 and published in SIGACT News 15(1), 78–88 (1983); optimal two-note forgery bound $(3/4)^n$: A. Molina, T. Vidick and J. Watrous, 2012 (arXiv:1202.4010)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_money', arxiv: 'https://arxiv.org/abs/1202.4010' },
      viz(v) {
        const NS = 20, MAXN = 40, TR = 20000;
        const St = v.stage({ x: [-5.6, NS], y: [0, 4.2], axes: false, height: 250, weight: 1.35, title: 'the note and the forged copies (first 20 qubits)' });
        const Gr = v.stage({ x: [0, 40], y: [1e-7, 1], ylog: true, axes: 'box', gutter: true, height: 250, weight: 1, xlabel: 'qubits on the note $n$', ylabel: 'probability the forgery is accepted', title: 'pass probability' });
        const nn = v.slider('qubits on the note $n$', 1, 40, 12, { int: true });
        const strat = v.select('forger', [{ value: 'rand', label: 'random bases' }, { value: 'z', label: 'always $+$ basis' }, { value: 'none', label: 'no forgery (genuine note)' }], 'rand');
        const reveal = v.toggle('reveal the secret', false);
        let seed = 7; v.button('forge again', () => { seed++; });
        // arrow for state (basis b: 0 = +, 1 = ×; bit s), drawn with a fixed pixel length
        const dirOf = (b, s) => (b === 0 ? (s === 0 ? [0, 1] : [0, -1]) : (s === 0 ? [R2, R2] : [-R2, R2]));
        const glyph = (x, y, d, col) => { const L = 11, ax = L / Math.abs(St.sx), ay = L / Math.abs(St.sy); St.arrow(x - d[0] * ax, y - d[1] * ay, x + d[0] * ax, y + d[1] * ay, { color: col, width: 2.2, head: 6 }); };
        // one qubit of the experiment: the bank's secret (b, s), the forger's basis g; each forged copy is then tested by the bank in basis b
        const trial = (r, kind) => {
          const b = r() < 0.5 ? 0 : 1, s = r() < 0.5 ? 0 : 1, g = kind === 'z' ? 0 : (r() < 0.5 ? 0 : 1);
          let c1 = true, c2 = true;
          if (kind !== 'none' && g !== b) { c1 = (r() < 0.5 ? 0 : 1) === s; c2 = (r() < 0.5 ? 0 : 1) === s; } // wrong basis: each copy gives a fair coin when tested
          return { b, s, g, c1, c2 };
        };
        let cache = null, sim = {};
        function monteCarlo(kind, sd) {
          const r = v.rng(sd * 977 + 11), fail = new Array(MAXN + 2).fill(0); // first qubit at which a note stops passing with both copies
          for (let t = 0; t < TR; t++) { let f = MAXN + 1; for (let i = 0; i < MAXN; i++) { const q = trial(r, kind); if (!(q.c1 && q.c2)) { f = i + 1; break; } } fail[f]++; }
          const out = []; let acc = TR; for (let n = 0; n <= MAXN; n++) { if (n > 0) acc -= fail[n]; out.push(acc / TR); }
          return out;
        }
        v.render(() => {
          const n = nn.value, kind = strat.value, key = `${kind}|${seed}`;
          if (!cache || cache.key !== key) cache = { key, both: monteCarlo(kind, seed) };
          const r = v.rng(seed * 131 + 5), cells = []; let p1 = 0, p2 = 0;
          for (let i = 0; i < n; i++) { const c = trial(r, kind); if (c.c1) p1++; if (c.c1 && c.c2) p2++; if (i < NS) cells.push(c); }
          sim = { n, ok1: p1 === n, ok2: p2 === n };
          const rowY = [3.5, 2.5, 1.5, 0.5], lab = ['bank’s secret', kind === 'none' ? 'no forger' : 'forger’s basis', 'copy 1 tested', 'copy 2 tested'];
          lab.forEach((t, i) => St.text(t, -5.5, rowY[i], { size: 11.5, color: 'muted', align: 'left', baseline: 'middle' }));
          cells.forEach((c, i) => {
            const x = i + 0.5;
            St.rect(i + 0.06, 3.05, i + 0.94, 3.95, { fill: 'grid', fillAlpha: 0.14, color: 'grid', width: 0.8, radius: 3 });
            if (reveal.value) glyph(x, rowY[0], dirOf(c.b, c.s), c.b === 0 ? 'accent' : 'purple'); else St.text('?', x, rowY[0], { size: 14, align: 'center', baseline: 'middle', color: 'faint' });
            if (kind !== 'none') St.text(c.g === 0 ? '+' : '×', x, rowY[1], { size: 16, align: 'center', baseline: 'middle', color: reveal.value ? (c.g === c.b ? 'green' : 'red') : 'ink' });
            St.text(c.c1 ? '✓' : '✗', x, rowY[2], { size: 14, align: 'center', baseline: 'middle', color: c.c1 ? 'green' : 'red' });
            St.text(c.c2 ? '✓' : '✗', x, rowY[3], { size: 14, align: 'center', baseline: 'middle', color: c.c2 ? 'green' : 'red' });
          });
          if (n > NS) St.text(`… and ${n - NS} more qubits`, NS - 0.1, 4.05, { size: 11, align: 'right', baseline: 'middle', color: 'muted' });
          const xs = Array.from({ length: MAXN + 1 }, (_, i) => i), floor = 1.5e-7;
          const curve = (p) => xs.map((x) => (Math.pow(p, x) >= floor ? [x, Math.pow(p, x)] : null)).filter(Boolean);
          Gr.path(curve(0.75), { color: 'green', width: 2 }); Gr.path(curve(0.625), { color: 'orange', width: 2 });
          if (kind !== 'none') Gr.dots(xs.filter((x) => x > 0 && cache.both[x] > 0).map((x) => [x, cache.both[x]]), { r: 3, color: 'gold' });
          Gr.vline(n, { color: 'faint', dash: true });
          Gr.text('$(3/4)^n$', 38, 0.75 ** 38 * 1.6, { size: 12, color: 'green', align: 'right', baseline: 'bottom' });
          Gr.text('$(5/8)^n$', 22, 0.625 ** 22 * 1.6, { size: 12, color: 'orange', align: 'left', baseline: 'bottom', dx: 6 });
        });
        v.readout(() => {
          const n = sim.n, kind = strat.value;
          if (kind === 'none') return `a genuine note of $n=${n}$ qubits passes the bank’s test with probability 1: the bank measures each qubit in the basis in which it was prepared`;
          const mc = cache.both[Math.min(n, 40)];
          return `this forgery: copy 1 ${sim.ok1 ? '**accepted**' : '**rejected**'}, both copies ${sim.ok2 ? '**accepted**' : '**rejected**'}\nboth copies pass in ${fix(v, mc * 100, 3)}% of 20 000 forgeries (gold dots; theory $(5/8)^{${n}}=${fix(v, 0.625 ** n * 100, 3)}$%); a single copy would pass with probability $(3/4)^{${n}}=${fix(v, 0.75 ** n * 100, 3)}$%${kind === 'z' ? ' (a fixed basis is no worse for the forger than a random one: the secret bases are uniform)' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Algorithm',
      name: 'BB84 quantum key distribution',
      statement: String.raw`Alice sends Bob $N$ qubits; qubit $i$ is $|0\rangle,|1\rangle$ or $|+\rangle,|-\rangle$ according to a random value bit $a_i$ and a random basis bit (rectilinear $+$ or diagonal $\times$). Bob measures each in an independently random basis. Over a public authenticated channel they announce the *bases* (not the values) and keep the positions where the bases agree, about $N/2$ of them (the **sifted key**); for those, in the absence of noise and eavesdropping, Bob's bit equals Alice's. They then publicly compare a random sample of $k$ sifted bits.

An eavesdropper who independently intercepts each qubit with probability $q$, measures each in a random basis and resends the result, causes an error in a sifted bit with probability $q/4$, so a sample of $k$ bits reveals her with probability $1-(1-q/4)^k$.`,
      idea: String.raw`The four states form two bases that are *mutually unbiased*: a state of one basis measured in the other gives a fair coin (qinfo-1.5, qm-5.7). Eve does not know the basis, guesses it right half the time (no disturbance) and wrong half the time, in which case the resent state is random in the true basis and Bob, if he uses the true basis, errs half the time. So she disturbs a sifted bit with probability $\tfrac12\cdot\tfrac12=\tfrac14$. She cannot do better by copying, since that would violate no-cloning (qm-14.14); any information she gains costs a disturbance, which the comparison detects.

For the intercept-resend sampling formula, interception is independently attempted with probability q on each signal, and the preparation, basis choices and shot outcomes are independent across positions. The sampled error events are then independent with probability $q/4$ per sifted bit. By prob-2.1.1a their complements intersect with probability $(1-q/4)^k$, giving the displayed detection probability. A fixed number of intercepted positions with sampling without replacement would require a different finite-population formula.`,
      caption: String.raw`The strip shows the first 24 qubits: Alice's bit and basis, Eve (if she intercepts), Bob's basis and result, and whether the position survives sifting (basis match, shaded) and whether it is an error (red). Move **Eve's interception fraction** $q$: the error rate of the sifted key rises to $q/4$ ($25\%$ at $q=1$). The right graph is the chance that comparing $k$ bits exposes her: the curve is $1-(1-q/4)^k$, the dots are resampled from the actual sifted key.`,
      deps: ['qinfo-1.5', 'qm-14.14', 'prob-2.1.1a'],
      refs: ['Nielsen–Chuang §12.6.3'],
      tags: ['key distribution', 'cryptography', 'no-cloning'],
      scope: String.raw`Ideal single-qubit source, lossless channel, perfect detectors, independent per-signal intercept–resend attack only; real systems add error correction, privacy amplification and decoy states, and the secret key is shorter than the sifted key.`,
      credit: 'C. H. Bennett and G. Brassard, “Quantum cryptography: public key distribution and coin tossing”, Proc. IEEE Int. Conf. on Computers, Systems and Signal Processing, Bangalore, 175–179 (1984)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/BB84', arxiv: 'https://arxiv.org/abs/2003.06557' },
      viz(v) {
        const NS = 24;
        const St = v.stage({ x: [-6, NS], y: [0, 7.4], axes: false, height: 290, weight: 1.5, title: 'the first 24 qubits' });
        const Pd = v.stage({ x: [0, 64], y: [0, 1.02], axes: 'box', gutter: true, height: 290, weight: 1, xlabel: 'sifted bits compared $k$', ylabel: 'probability Eve is detected', title: 'detecting the eavesdropper' });
        const N = v.slider('qubits sent $N$', 100, 4000, 1000, { log: true, int: true });
        const q = v.slider('Eve intercepts a fraction $q$', 0, 1, 0.5, { step: 0.01 });
        const kk = v.slider('bits compared $k$', 1, 64, 16, { int: true });
        let seed = 3; v.button('send again', () => { seed++; });
        let run = null;
        const fresh = (n, qv, sd) => {
          const r = v.rng(sd * 7919), A = [], keep = [], err = [], rows = [];
          for (let i = 0; i < n; i++) {
            const a = r() < 0.5 ? 0 : 1, ba = r() < 0.5 ? 0 : 1, eve = r() < qv, be = r() < 0.5 ? 0 : 1, bb = r() < 0.5 ? 0 : 1;
            let bit = a, basis = ba, eveBit = null;
            if (eve) { eveBit = be === basis ? bit : (r() < 0.5 ? 0 : 1); bit = eveBit; basis = be; }
            const bobBit = bb === basis ? bit : (r() < 0.5 ? 0 : 1), kept = bb === ba;
            A.push(a); keep.push(kept); err.push(kept && bobBit !== a);
            if (i < NS) rows.push({ a, ba, eve, be, eveBit, bb, bobBit, kept, bad: kept && bobBit !== a });
          }
          const idx = keep.map((k, i) => (k ? i : -1)).filter((i) => i >= 0), e = idx.filter((i) => err[i]).length;
          return { rows, sifted: idx.length, errors: e, errFlags: idx.map((i) => err[i]) };
        };
        const detMC = (flags, k, trials, sd) => {
          if (flags.length < k) return NaN;
          const r = v.rng(sd * 31 + k); let hit = 0;
          for (let t = 0; t < trials; t++) { const pick = new Set(); while (pick.size < k) pick.add(Math.floor(r() * flags.length)); for (const i of pick) if (flags[i]) { hit++; break; } }
          return hit / trials;
        };
        v.render(() => {
          run = fresh(N.value, q.value, seed);
          const rowY = { a: 6.4, ba: 5.4, eve: 4.1, bb: 2.8, bob: 1.8, kept: 0.7 };
          const labels = [['Alice’s bit', rowY.a], ['Alice’s basis', rowY.ba], ['Eve’s basis', rowY.eve], ['Bob’s basis', rowY.bb], ['Bob’s result', rowY.bob], ['kept / error', rowY.kept]];
          labels.forEach(([t, y]) => St.text(t, -5.9, y, { size: 11.5, color: 'muted', align: 'left', baseline: 'middle' }));
          run.rows.forEach((c, i) => {
            const x = i + 0.5;
            if (c.kept) St.rect(i + 0.04, 0.05, i + 0.96, 7.2, { fill: c.bad ? 'red' : 'green', fillAlpha: c.bad ? 0.2 : 0.1, color: c.bad ? 'red' : 'green', width: 0.8, radius: 3 });
            St.text(String(c.a), x, rowY.a, { size: 14, align: 'center', baseline: 'middle', color: 'ink' });
            St.text(c.ba === 0 ? '+' : '×', x, rowY.ba, { size: 15, align: 'center', baseline: 'middle', color: 'accent' });
            if (c.eve) { St.text(c.be === 0 ? '+' : '×', x, rowY.eve, { size: 15, align: 'center', baseline: 'middle', color: 'red' }); } else St.text('·', x, rowY.eve, { size: 14, align: 'center', baseline: 'middle', color: 'faint' });
            St.text(c.bb === 0 ? '+' : '×', x, rowY.bb, { size: 15, align: 'center', baseline: 'middle', color: 'orange' });
            St.text(String(c.bobBit), x, rowY.bob, { size: 14, align: 'center', baseline: 'middle', color: c.kept ? 'ink' : 'faint' });
            St.text(c.kept ? (c.bad ? '✗' : '✓') : '–', x, rowY.kept, { size: 13, align: 'center', baseline: 'middle', color: c.kept ? (c.bad ? 'red' : 'green') : 'faint' });
          });
          const qq = q.value, ks = [...new Set([1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64])];
          Pd.fn((k) => 1 - Math.pow(1 - qq / 4, k), { domain: [0, 64], color: 'red', width: 2 });
          Pd.dots(ks.map((k) => [k, detMC(run.errFlags, k, 400, seed)]).filter((p) => !Number.isNaN(p[1])), { r: 3.5, color: 'gold' });
          Pd.vline(kk.value, { color: 'faint', dash: true });
        });
        v.readout(() => {
          const s = run.sifted, e = run.errors, qq = q.value, k = kk.value;
          return `sifted key: ${s} of ${N.value} qubits (≈ N/2 = ${N.value / 2}); errors ${e}, error rate $${fix(v, s ? e / s : 0, 3)}$ against the prediction $q/4=${fix(v, qq / 4, 3)}$\ncomparing $k=${k}$ bits exposes Eve with probability $1-(1-q/4)^k=${fix(v, 1 - Math.pow(1 - qq / 4, k), 3)}$${qq === 0 ? ' (no eavesdropper: the keys agree on every kept position)' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Algorithm',
      name: 'E91 entanglement-based key distribution',
      statement: String.raw`A source emits Bell pairs $|\Phi^+\rangle$; Alice and Bob each receive one qubit and measure it along an axis chosen at random from three, all in the $xz$-plane of the Bloch sphere (the observable $\cos\theta\,Z+\sin\theta\,X$). For $\Phi^+$ the correlation of axes $\theta_A,\theta_B$ is $E=\cos(\theta_A-\theta_B)$. Rounds where the two axes coincide give identical random bits: the **key**. Rounds with the four settings $(0,\tfrac\pi4),(0,-\tfrac\pi4),(\tfrac\pi2,\tfrac\pi4),(\tfrac\pi2,-\tfrac\pi4)$ are used to estimate
$$S=E_{00}+E_{01}+E_{10}-E_{11},$$
which equals $2\sqrt2$ for the undisturbed pair. If $S\le2$ the data are explainable by local hidden variables and no secrecy can be certified; values of $S$ below the Tsirelson value $2\sqrt2$ signal that the pairs are noisy or have been tampered with.`,
      idea: String.raw`A Bell-violating correlation cannot be shared with a third party (monogamy, qinfo-2.8), so the more Eve learns about the key, the more $S$ must fall below $2\sqrt2$. An intercept–resend attack replaces the entangled pair by a classical correlation along Eve's basis: with probability $q$ the pair is dephased, which removes correlations in the $xz$-plane that the CHSH settings rely on and so cuts $S$ linearly (qm-14.9). The scheme is the entangled twin of BB84 (qinfo-3.5); Bennett, Brassard and Mermin showed that its key distribution is equivalent to BB84 and needs no Bell inequality for its security argument.`,
      caption: String.raw`Choose **Eve's strategy** and the fraction $q$ of pairs she intercepts (she measures Bob's qubit in the stated basis and resends it). The bars on the left are the CHSH estimate from the simulated rounds and the exact value; the middle graph plots the exact $S$ against $q$: it falls linearly from $2\sqrt2$ to $\sqrt2$ and crosses the classical bound 2 at $q=\tfrac{2\sqrt2-2}{\sqrt2}\approx0.59$, whichever basis she uses (for these settings the three strategies give the same $S$). The right graph shows what the strategies do *not* share: the error rate of the matching-axis rounds, which differs with her basis. The axis set used here is one convenient choice, not Ekert's original angles.`,
      deps: ['qm-14.9', 'qinfo-3.5'],
      refs: ['Nielsen–Chuang §12.6.3'],
      tags: ['key distribution', 'Bell inequality', 'cryptography'],
      scope: String.raw`Only intercept–resend attacks on one qubit of each pair are simulated, with a perfect source; general security proofs (and device-independent security) need $S$ together with the error rate and are more delicate than the single threshold suggests.`,
      credit: 'A. K. Ekert, Phys. Rev. Lett. 67, 661 (1991); equivalence with BB84: C. H. Bennett, G. Brassard and N. D. Mermin, Phys. Rev. Lett. 68, 557 (1992)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_key_distribution#E91_protocol:_Artur_Ekert_(1991)' },
      viz(v) {
        const Sb = v.stage({ x: [-0.3, 3.1], y: [-0.35, 3.2], axes: false, height: 290, weight: 0.8, title: 'CHSH value' });
        const Gq = v.stage({ x: [0, 1], y: [1, 3.1], axes: 'box', gutter: true, height: 290, weight: 1.25, xlabel: 'fraction $q$ of pairs intercepted', ylabel: 'exact CHSH value $S$', title: '$S$ against the eavesdropping fraction' });
        const Kt = v.stage({ x: [0, 1], y: [0, 0.4], axes: 'box', gutter: true, height: 290, weight: 1, xlabel: 'fraction $q$ of pairs intercepted', ylabel: 'error rate of the key', title: 'error rate of the matching-axis rounds' });
        const strat = v.select('Eve measures in', [{ value: 'Z', label: '$Z$ basis' }, { value: 'X', label: '$X$ basis' }, { value: 'R', label: 'random basis' }], 'R');
        const q = v.slider('intercepted fraction $q$', 0, 1, 0.4, { step: 0.01 });
        const nR = v.slider('rounds', 200, 20000, 4000, { log: true, int: true });
        let seed = 5; v.button('run again', () => { seed++; });
        const A = [0, Math.PI / 2, Math.PI / 4], B = [Math.PI / 4, -Math.PI / 4, 0];
        const rhoFor = (s, qv) => {
          const r0 = wernerR(1), dz = dephaseR(r0, 1, 'Z'), dx = dephaseR(r0, 1, 'X');
          const eve = s === 'Z' ? dz : s === 'X' ? dx : r0.map((row, i) => row.map((_, j) => 0.5 * (dz[i][j] + dx[i][j])));
          return r0.map((row, i) => row.map((_, j) => (1 - qv) * r0[i][j] + qv * eve[i][j]));
        };
        const Sexact = (rho) => {
          const E = (a, b) => { const p = jointProbs(rho, a, b); return p[0] - p[1] - p[2] + p[3]; };
          return E(A[0], B[0]) + E(A[0], B[1]) + E(A[1], B[0]) - E(A[1], B[1]);
        };
        let cur;
        v.render(() => {
          const rho = rhoFor(strat.value, q.value), r = v.rng(seed * 53 + 1), n = nR.value;
          const cnt = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({ n: 0, same: 0 }))), probs = [[], [], []];
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) probs[i][j] = jointProbs(rho, A[i], B[j]);
          for (let t = 0; t < n; t++) {
            const i = Math.floor(r() * 3), j = Math.floor(r() * 3), p = probs[i][j]; let u = r(), o = 0; while (o < 3 && u > p[o]) { u -= p[o]; o++; }
            cnt[i][j].n++; if (o === 0 || o === 3) cnt[i][j].same++;
          }
          const Eh = (i, j) => (cnt[i][j].n ? (2 * cnt[i][j].same - cnt[i][j].n) / cnt[i][j].n : 0);
          const Sest = Eh(0, 0) + Eh(0, 1) + Eh(1, 0) - Eh(1, 1), Sx = Sexact(rho);
          const k1 = cnt[0][2], k2 = cnt[2][0], keyN = k1.n + k2.n, keyBad = keyN - k1.same - k2.same;
          const qberOf = (rr) => { const f = (a, b) => { const p = jointProbs(rr, a, b); return p[1] + p[2]; }; return (f(A[0], B[2]) + f(A[2], B[0])) / 2; };
          const qber = keyN ? keyBad / keyN : 0, exactQ = qberOf(rho);
          [[Sest, 'blue', 'simulated'], [Sx, 'green', 'exact']].forEach(([s, col, nm], i) => {
            const x0 = 0.3 + i * 1.5;
            Sb.rect(x0, 0, x0 + 1.1, s, { fill: col, fillAlpha: 0.3, color: col, width: 1.6 });
            Sb.text(fix(v, s, 3), x0 + 0.55, s, { size: 12, align: 'center', baseline: 'bottom', dy: -3, color: 'ink' });
            Sb.text(nm, x0 + 0.55, 0, { size: 12, align: 'center', baseline: 'top', dy: 5, color: 'muted' });
          });
          Sb.hline(2, { color: 'red', dash: true, width: 1.4 }); Sb.text('2', 3.05, 2, { size: 11, color: 'red', align: 'right', baseline: 'bottom', dy: -2 });
          Sb.hline(2 * Math.SQRT2, { color: 'green', dash: true, width: 1.2 }); Sb.text('2√2', 3.05, 2 * Math.SQRT2, { size: 11, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
          const qs = Array.from({ length: 41 }, (_, i) => i / 40);
          Gq.path(qs.map((qq) => [qq, Sexact(rhoFor(strat.value, qq))]), { color: 'orange', width: 2.4 });
          Gq.hline(2, { color: 'red', dash: true, width: 1.3 }); Gq.hline(2 * Math.SQRT2, { color: 'green', dash: true, width: 1.2 });
          Gq.text('classical bound 2', 0.99, 2, { size: 11, color: 'red', align: 'right', baseline: 'top', dy: 3 });
          Gq.text('Tsirelson 2√2', 0.99, 2 * Math.SQRT2, { size: 11, color: 'green', align: 'right', baseline: 'top', dy: 3 });
          Gq.dot(q.value, Sx, { r: 6, color: 'gold' });
          for (const [sname, col] of [['Z', 'accent'], ['X', 'purple'], ['R', 'orange']]) {
            Kt.path(qs.map((qq) => [qq, qberOf(rhoFor(sname, qq))]), { color: col, width: sname === strat.value ? 2.6 : 1.3, alpha: sname === strat.value ? 1 : 0.65 });
            Kt.text(sname === 'R' ? 'random' : sname, 0.98, qberOf(rhoFor(sname, 1)), { size: 11.5, color: col, align: 'right', baseline: 'bottom', dy: -3 });
          }
          Kt.dot(q.value, exactQ, { r: 6, color: 'gold' });
          Kt.dot(q.value, qber, { r: 4, color: 'ink', hollow: true });
          cur = { Sest, Sx, qber, exactQ, keyN };
        });
        v.readout(() => `exact $S=${fix(v, cur.Sx, 4)}$, from the simulated rounds $${fix(v, cur.Sest, 3)}$ · key rounds: ${cur.keyN}, error rate $${fix(v, cur.qber, 3)}$ (exact $${fix(v, cur.exactQ, 3)}$)\n${cur.Sx < 2 ? '**$S<2$: the pairs carry no Bell violation — the parties abort**' : cur.Sx < 2 * Math.SQRT2 - 0.02 ? '$S$ is below $2\\sqrt2$: noise or an eavesdropper is present' : 'close to $2\\sqrt2$: no sign of an intruder'}`);
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Method',
      name: 'Entanglement distillation',
      statement: String.raw`Let two parties share many copies of a Werner state $\rho_F=F|\Phi^+\rangle\langle\Phi^+|+\tfrac{1-F}3(I-|\Phi^+\rangle\langle\Phi^+|)$ of fidelity $F>\tfrac12$ (such a state is entangled exactly when $F>\tfrac12$). In one round of the **recurrence protocol** they take two pairs, apply a CNOT on both sides (Alice's pair-1 qubit controls her pair-2 qubit, and likewise for Bob), measure the pair-2 qubits in the computational basis and keep pair 1 only when their results agree. With $g=\tfrac{1-F}3$ the kept pair is, after a random local twirl, again a Werner state, with
$$\begin{gathered}F'=\frac{F^2+g^2}{F^2+2Fg+5g^2},\qquad\\p_{\rm succ}=F^2+2Fg+5g^2 .\end{gathered}$$
For $F>\tfrac12$ one has $F'>F$ and iteration converges to $F\to1$; for $F\le\tfrac12$ it does not help.`,
      idea: String.raw`Local operations and classical communication cannot create entanglement, but they can concentrate it. The bilateral CNOT compares the two pairs' *parity* errors; the error bits that survive agreement are rarer than before, since two errors must coincide to go unnoticed ($F^2$ versus the single-error terms). Weighing the four Bell components $F,g,g,g$ gives the map above; its fixed points are $F=\tfrac14,\tfrac12,1$, with $\tfrac12$ unstable (the PPT threshold, qinfo-2.5). The cost is that two pairs make at most one, with probability $p_{\rm succ}<1$.

The recurrence assumes two independently prepared copies. By prob-2.1.1a their Bell-component labels have product probabilities, such as $F^2$, Fg and $g^2$. Summing the weights of the accepted parity cases gives the stated success probability; dividing the accepted correct-component weight by that sum gives the new fidelity. Correlated pairs need not obey this map, and neither this product rule nor the finite display proves a positive asymptotic yield.`,
      caption: String.raw`**Drag the point on the diagonal** to set the starting fidelity $F_0$. The left graph is the map $F\mapsto F'$ with the cobweb of the iteration; the right graph follows the fidelity over the rounds together with the expected number of original pairs consumed per output pair. Below $F=\tfrac12$ the iteration runs away from 1. The readout compares the closed form with a direct simulation on the $16\times16$ density matrix of the four qubits.`,
      deps: ['qinfo-2.5', 'qinfo-3.1', 'prob-2.1.1a'],
      refs: ['Nielsen–Chuang §12.5.2'],
      tags: ['entanglement', 'purification', 'LOCC'],
      scope: String.raw`Werner states, perfect local gates and measurements, and a re-twirl after every round (in the original protocol this is a random bilateral rotation); the yield is zero in the limit, since each round at least halves the number of pairs. Later protocols (Deutsch et al., 1996) and hashing do better.`,
      credit: 'C. H. Bennett, G. Brassard, S. Popescu, B. Schumacher, J. A. Smolin and W. K. Wootters, Phys. Rev. Lett. 76, 722 (1996)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entanglement_distillation', arxiv: 'https://arxiv.org/abs/quant-ph/9511027' },
      viz(v) {
        const Mp = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'fidelity $F$ of the input pairs', ylabel: 'fidelity $F^\\prime$ of the output pair', title: 'one round: $F\\mapsto F^\\prime$', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 0.25, 0.5, 0.75, 1] });
        const Rd = v.stage({ x: [0, 10], y: [0, 1.04], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'round', ylabel: 'fidelity after the round', title: 'iterating the protocol', xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 0.25, 0.5, 0.75, 1] });
        const nr = v.slider('rounds', 1, 10, 6, { int: true });
        const h = Mp.handle(0.7, 0.7, { color: 'gold', r: 7, label: 'F₀', labelPos: 'se', constrain: (x) => { const c = Math.max(0.27, Math.min(0.995, x)); return [c, c]; } });
        let cur;
        v.render(() => {
          const F0 = h.x, N = nr.value;
          Mp.fn((F) => bbpsswFormula(F).F, { domain: [0, 1], color: 'accent', width: 2.2 });
          Mp.line(0, 0, 1, 1, { color: 'muted', width: 1.2, dash: true });
          Mp.vline(0.5, { color: 'red', dash: true, width: 1, alpha: 0.6 }); Mp.text('F = ½', 0.5, 0.04, { size: 11, color: 'red', align: 'left', dx: 4 });
          const Fs = [F0], ps = [], cost = [1];
          for (let i = 0; i < N; i++) { const o = bbpsswFormula(Fs[i]); Fs.push(o.F); ps.push(o.p); cost.push(cost[i] * 2 / o.p); }
          const web = [[F0, 0]]; for (let i = 0; i < N; i++) web.push([Fs[i], Fs[i + 1]], [Fs[i + 1], Fs[i + 1]]);
          Mp.path(web, { color: 'gold', width: 1.6 });
          Mp.dots(Fs.map((F) => [F, F]), { r: 3, color: 'gold' });
          const lo = [0.3, 0.45, 0.55, 0.7, 0.85];
          for (const f0 of lo) { const tr = [f0]; for (let i = 0; i < 10; i++) tr.push(bbpsswFormula(tr[i]).F); Rd.path(tr.map((F, i) => [i, F]), { color: 'faint', width: 1.1, alpha: 0.8 }); }
          Rd.path(Fs.map((F, i) => [i, F]), { color: 'gold', width: 2.6 }); Rd.dots(Fs.map((F, i) => [i, F]), { r: 4, color: 'gold' });
          Rd.hline(0.5, { color: 'red', dash: true, width: 1.2 }); Rd.text('F = ½ (entangled above)', 9.9, 0.5, { size: 11, color: 'red', align: 'right', baseline: 'top', dy: 3 });
          const sim = bilateralRound(F0), form = bbpsswFormula(F0);
          cur = { F0, Fs, ps, cost, sim, form, N };
        });
        v.readout(() => `$F_0=${fix(v, cur.F0, 3)}$ → $F_{${cur.N}}=${fix(v, cur.Fs[cur.N], 4)}$ after ${cur.N} rounds; each round succeeds with probability $${cur.ps.slice(0, 3).map((p) => fix(v, p, 3)).join(',\\ ')}\\ldots$, so one output pair costs about ${v.fmt(cur.cost[cur.N], 3)} input pairs\ndirect simulation of one round on the 16×16 density matrix: $F'=${fix(v, cur.sim.F, 5)}$, $p=${fix(v, cur.sim.p, 5)}$; closed form $F'=${fix(v, cur.form.F, 5)}$, $p=${fix(v, cur.form.p, 5)}$ ${cur.F0 > 0.5 ? '· above ½: the fidelity climbs toward 1' : '· at or below ½: no distillation'}`);
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Invention',
      name: 'Quantum repeaters',
      statement: String.raw`A quantum repeater distributes elementary entangled pairs between intermediate nodes, then combines them by entanglement swapping and nested purification. Briegel, Dür, Cirac and Zoller (1998) show how this can avoid exponential resource scaling **when the connection–purification cycle restores a chosen working fidelity at each level**. If a level combines $b$ links and uses a fixed average $M$ copies for purification, $N=b^K$ segments require $R=(bM)^K=N^{1+\log_b M}$ elementary pairs. Their sequential-memory variant trades parallel copies for time and has logarithmic local storage under its additional nesting condition and ideal-memory assumption.

For an illustrative loss-only fibre model, transmission probability is $10^{-\alpha L/10}$; this demo chooses $\alpha=0.2$ dB/km as a parameter, without claiming a universal fibre value. Fixed purification rounds do **not** guarantee an entangled output or a distance-independent fidelity.`,
      idea: String.raw`Swapping ideal Werner links multiplies visibility: after $2^K$ unpurified segments it is $w_0^{2^K}$, and fidelity is $F=(1+3w)/4$ (fidelity itself is not $w$). The original repeater requires the post-connection pair to lie above the purification threshold and enough purification to restore a working fidelity before the next level. The toy model below instead fixes the number of recurrence rounds and tracks failures of that requirement. Its waiting time is a bootstrap estimate of repeated maxima of two independent sub-link times, retried after unsuccessful swaps/purification. The often-used factor 3/2 applies approximately to the maximum of two rare-success geometric/exponential waits, not to every higher-level distribution.`,
      caption: String.raw`**Choose segment length, nesting, swap success, purification rounds and starting visibility.** This simplified Monte Carlo model uses 3000 bootstrap samples per level, perfect memories/local gates, instantaneous messages and reset-after-failure scheduling. Purification is applied at level zero as well as after each swap level. The left plot uses **log10 accepted-pair rate**, including pairs that may be separable; its loss-only comparison stays representable even when the probability would underflow. Gold marks your final level; the readout separately checks whether $F>1/2$. The chain draws at most four levels; the fidelity graph shows whether the chosen finite purification actually maintains quality. It is not a simulation of every resource or timing assumption in the original protocol.`,
      deps: ['qinfo-3.3', 'qinfo-3.7'],
      refs: ['Briegel, Dür, Cirac & Zoller, Physical Review Letters81 (1998),5932–5935, full paper: equation(1), connection/purification equations(5)–(6), nesting-condition and sequential-memory discussion: https://people.ee.duke.edu/~jungsang/ECE590_01/BriegelPRL1998.pdf'],
      tags: ['repeaters', 'entanglement', 'networks'],
      scope: String.raw`Toy per-attempt-cycle rates, not physical pairs per second: no finite memory lifetime, classical-signal latency, detector loss, imperfect gates or resource cap. Fixed rounds can produce separable output, so an accepted-pair rate alone is not an entanglement-delivery rate. The original paper's polynomial guarantee has working-fidelity and resource hypotheses that this finite display does not certify.`,
      credit: 'Briegel, Dür, Cirac & Zoller, Physical Review Letters81,5932–5935 (1998)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_repeater', arxiv: 'https://arxiv.org/abs/quant-ph/9803056' },
      viz(v) {
        const Rt = v.stage({ x: [5, 20000], y: [-400, 0.1], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1.35, xlabel: 'distance $L$ (km)', ylabel: '$\\log_{10}$ rate', title: 'rate against distance' });
        const Ch = v.stage({ x: [-0.6, 16.6], y: [-1.3, 5.2], axes: false, height: 320, weight: 1.1, title: 'the chain (drawn for up to 4 levels)' });
        const Fd = v.stage({ x: [0, 8], y: [0.25, 1.02], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: 'nesting level $k$', ylabel: 'fidelity of the pair', title: 'fidelity of the long pair', xticks: [0, 2, 4, 6, 8] });
        const l0 = v.slider('segment length $\\ell_0$ (km)', 5, 50, 20, { step: 1, int: true });
        const K = v.slider('nesting levels $K$', 0, 8, 5, { int: true });
        const ps = v.select('Bell measurement', [{ value: '1', label: 'ideal ($p_s=1$)' }, { value: '0.5', label: 'probabilistic ($p_s=\\tfrac12$)' }], '0.5');
        const pr = v.slider('purification rounds per level', 0, 2, 1, { int: true });
        const w0 = v.slider('elementary visibility $w_0$', 0.8, 1, 0.97, { step: 0.005 });
        let cache = {};
        const M = 3000;
        function model(){const key=[l0.value,ps.value,pr.value,w0.value].join('|');if(cache.key===key)return cache.levels;const levels=repeaterModel({length:l0.value,swap:+ps.value,rounds:pr.value,visibility:w0.value,samples:M},v.rng(2024));cache={key,levels};return levels;}
        let cur;
        v.render(() => {
          const lv = model(), Kk = K.value, pts = lv.slice(0, Kk + 1);
          const xmax=Math.max(10,pts.at(-1).L*1.2);Rt.setView([5,xmax],[Math.min(logDirect(xmax),...pts.map(p=>Math.log10(p.rate)))*1.15,.2]);
          Rt.fn((L) => logDirect(L), { domain: [5, xmax], color: 'red', width: 2 });
          Rt.path(pts.map((p) => [p.L, Math.log10(p.rate)]), { color: 'green', width: 2.4 });
          Rt.dots(pts.map((p) => [p.L, Math.log10(p.rate)]), { r: 4.5, color: 'green' });
          const last = pts[pts.length - 1];
          Rt.dot(last.L, Math.log10(last.rate), { r: 7, color: 'gold' });
          // chain schematic
          const Kd = Math.min(Kk, 4), Nseg = 1 << Kd, sx = 16 / Nseg;
          const lc = ['blue', 'teal', 'purple', 'orange', 'pink'];
          for (let i = 0; i <= Nseg; i++) Ch.dot(i * sx, 0, { r: 5, color: i === 0 || i === Nseg ? 'gold' : 'ink' });
          for (let j = 0; j <= Kd; j++) {
            const span = 1 << j, h = 0.45 + j * 0.95;
            for (let i = 0; i + span <= Nseg; i += span) {
              const x0 = i * sx, x1 = (i + span) * sx, pts2 = [];
              for (let t = 0; t <= 20; t++) { const u = t / 20; pts2.push([x0 + (x1 - x0) * u, j === 0 ? 0 : h * 4 * u * (1 - u)]); }
              if (j === 0) Ch.line(x0, -0.0, x1, 0, { color: lc[0], width: 3 });
              else Ch.path(pts2.map((p) => [p[0], p[1] + 0.0]), { color: lc[j % lc.length], width: 2 });
              if (j > 0) Ch.dot(x0 + (x1 - x0) / 2, h, { r: 3.2, color: lc[j % lc.length] });
            }
          }
          Ch.text(`${Nseg} schematic segment${Nseg > 1 ? 's' : ''} · arcs = swapped pairs`, 8, -0.55, { size: 11, color: 'muted', align: 'center', baseline: 'top' });
          if (Kk > 4) Ch.text(`only 4 levels drawn (real chain: ${1 << Kk} segments)`, 8, 4.9, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          // fidelity
          Fd.path(pts.map((p) => [p.k, p.Fraw]), { color: 'red', width: 2, dash: true });
          Fd.path(pts.map((p) => [p.k, p.F]), { color: 'green', width: 2.4 }); Fd.dots(pts.map((p) => [p.k, p.F]), { r: 3.5, color: 'green' });
          Fd.hline(0.5, { color: 'muted', dash: true, width: 1.2 }); Fd.text('F = ½', 7.9, 0.5, { size: 11, color: 'muted', align: 'right', baseline: 'top', dy: 3 });
          Fd.text('no purification', 7.9, Math.max(0.28, Math.min(0.98, pts[pts.length - 1].Fraw + 0.04)), { size: 11, color: 'red', align: 'right', baseline: 'bottom' });
          const prevP = pts.length > 1 ? pts[pts.length - 2] : null;
          cur = { last, prevP, logDirect: logDirect(last.L), slope: prevP ? Math.log(last.rate / prevP.rate) / Math.log(2) : NaN };
        });
        v.legend([['green','accepted-pair rate (may be separable)'],['red','loss-only direct transmission'],['gold','selected final level',{dot:true}]]);
        v.readout(()=>`${K.value} levels: $L=${v.fmt(cur.last.L,4)}$ km; bootstrap accepted-pair rate $${v.sci(cur.last.rate,3)}$ per cycle, $\\log_{10}$ direct rate $=${fix(v,cur.logDirect,3)}$.\n$F=${fix(v,cur.last.F,5)}$: **${cur.last.entangled?'entangled Werner output':'separable Werner output; the displayed rate is not an entanglement rate'}**; raw no-purification fidelity ${fix(v,cur.last.Fraw,5)}. ${cur.prevP?`Observed last-level log2 rate ratio ${fix(v,cur.slope,3)}; one finite ratio is not proof of a power law.`:`No swaps at K=0; ${pr.value} purification rounds still act on elementary pairs.`}`);
      },
    },
  ],
};
