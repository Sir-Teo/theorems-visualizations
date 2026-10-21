// Quantum Information & Computation — Chapter 4: Circuits and universality
// (items 4.1–4.4 here; 4.5–4.9 in ch04-b.js)
import {
  TAU, R2, cmul, cadd, cabs2, mmul, adj, cplx, GATE, qmul, qapply, qdist, QG, qkey, kronC, pauliMat, pauliDecompose, gate2, conjugate,
  PAULI_STRINGS2, haarState, normalize,
} from './ch04.shared.js';

import { eliminate4, stateOrbit, orbitErrors } from './gate-universality-audit.shared.js';

const fix = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

// ------------------------------------------------------------------ reversible circuits (4.1)
// gates: ['X', t], ['CX', c, t], ['CCX', c1, c2, t]; wires are bits
const REV = {
  and: { name: 'AND', k: 2, wires: ['a', 'b', 'z'], g: [['CCX', 0, 1, 2]], outs: [2], f: (a, b) => [a & b] },
  nand: { name: 'NAND', k: 2, wires: ['a', 'b', 'z'], g: [['CCX', 0, 1, 2], ['X', 2]], outs: [2], f: (a, b) => [1 - (a & b)] },
  or: { name: 'OR', k: 2, wires: ['a', 'b', 'z'], g: [['X', 0], ['X', 1], ['CCX', 0, 1, 2], ['X', 2], ['X', 0], ['X', 1]], outs: [2], f: (a, b) => [a | b] },
  and3: { name: 'AND of three', k: 3, wires: ['a', 'b', 'c', 'g', 'z'], g: [['CCX', 0, 1, 3], ['CCX', 3, 2, 4]], outs: [4], f: (a, b, c) => [a & b & c] },
  add: { name: 'full adder', k: 3, wires: ['a', 'b', 'c', 's', 'o'], g: [['CX', 0, 3], ['CX', 1, 3], ['CX', 2, 3], ['CCX', 0, 1, 4], ['CX', 0, 1], ['CCX', 1, 2, 4], ['CX', 0, 1]], outs: [3, 4], f: (a, b, c) => [a ^ b ^ c, (a & b) | (a & c) | (b & c)] },
};
function revBuild(spec, clean) {
  const wires = spec.wires.slice(), g = spec.g.map((x) => x.slice()); let outs = spec.outs.slice();
  if (clean) {
    const cp = spec.outs.map((_, j) => { wires.push(spec.outs.length > 1 ? 'f' + (j + 1) : 'f'); return wires.length - 1; });
    spec.outs.forEach((o, j) => g.push(['CX', o, cp[j]]));
    g.push(...spec.g.slice().reverse().map((x) => x.slice())); outs = cp;
  }
  return { wires, g, outs };
}
const revApply = (g, bits) => { const b = bits.slice(); if (g[0] === 'X') b[g[1]] ^= 1; else if (g[0] === 'CX') b[g[2]] ^= b[g[1]]; else if (b[g[1]] && b[g[2]]) b[g[3]] ^= 1; return b; };
const revRun = (circ, bits, upto = circ.g.length) => { let b = bits.slice(); for (let i = 0; i < upto; i++) b = revApply(circ.g[i], b); return b; };

export default {
  collection: 'qinfo',
  chapter: 4,
  title: 'Circuits and universality',
  summary: String.raw`Any classical computation can be made reversible with Toffoli gates. CNOT plus single-qubit gates generate every unitary, the Clifford group plus T approximates them efficiently (Solovay–Kitaev), and Clifford circuits alone can be simulated classically (Gottesman–Knill). Phase kickback and oracles are the basic algorithmic tools, and simulating quantum dynamics by Trotterization is the most natural task of all.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Reversible computation with Toffoli gates',
      statement: String.raw`The **Toffoli gate** $\mathrm{CCX}:(a,b,c)\mapsto(a,b,c\oplus ab)$ is a permutation of the eight 3-bit strings, hence a unitary on three qubits. Together with ancillas fixed to $0$ or $1$ it computes NAND (set $c=1$) and fan-out (with $b=1$, $c=0$), so every Boolean function $f:\{0,1\}^n\to\{0,1\}^m$ is computed by a reversible circuit
$$\begin{gathered}(x,\,0^m,\,0^k)\\\;\longmapsto\;(x,\,f(x),\,g(x)),\end{gathered}$$
where $g(x)$ is "garbage" left on the $k$ work bits. Copying $f(x)$ onto fresh bits and then running the circuit backwards (**compute–copy–uncompute**) returns $g(x)$ to $0$: $(x,0^m,0^k,0^m)\mapsto(x,0^m,0^k,f(x))$. A circuit of size $s$ becomes one of size $2s+m$, so reversibility costs only a constant factor.`,
      idea: String.raw`A gate that is a bijection on bit strings can be undone, so no information is erased. The Toffoli gate is a controlled-controlled-NOT: when both controls are 1 it flips the target, which is exactly an AND added into the target, and AND plus constants gives NAND, which is universal for classical logic (circ-4.9). The garbage $g(x)$ is the only obstacle to zero net erasure, and Bennett's trick removes it: after the answer is copied (CNOT is reversible, and the copy is the only thing that must survive), the first half is inverted gate by gate. By Landauer's principle (thermo-5.17) erasing one bit costs at least $k_BT\ln 2$; the clean circuit erases none, so that bound does not force any dissipation.

Each Toffoli or copying gate is a bijection of the full classical basis. By alg-1.15 their composition remains a bijection, so reversing the order and inverting each gate undoes the computed work. After copying the output into a separate register, uncomputation acts on the original input/work registers and leaves that output register intact. Copying here is basis-bit fan-out, not cloning an arbitrary unknown quantum state.`,
      caption: String.raw`Choose a function and toggle **uncompute garbage**. The top panel is the circuit (controls are dots, the target $\oplus$); the slider steps it for the chosen **input**, showing each wire's bit. The table lists the final wire values for every input: green columns hold $f$, orange columns are garbage that would have to be erased, and grey columns are ancillas returned to $0$. In the *AND of three* circuit, uncomputing frees the work wire $g$.`,
      deps: ['qinfo-3.1', 'circ-4.9', 'thermo-5.17', 'alg-1.15'],
      refs: ['Nielsen–Chuang §3.2.5', 'Nielsen–Chuang §1.4.1'],
      tags: ['reversible computing', 'Toffoli gate', 'Landauer'],
      scope: String.raw`Ideal gates. The identity of "no erasure" is logical: real reversible hardware still dissipates through finite speed and imperfect gates, and the uncomputation doubles the gate count.`,
      credit: 'C. H. Bennett, IBM J. Res. Dev. 17, 525 (1973) (reversible computation by compute–copy–uncompute); T. Toffoli, “Reversible computing”, Automata, Languages and Programming, LNCS 85, 632–644 (1980); E. Fredkin and T. Toffoli, Int. J. Theor. Phys. 21, 219 (1982)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Toffoli_gate' },
      viz(v) {
        const D = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, full: true, title: 'the reversible circuit' });
        const Tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, full: true, title: 'final wire values for every input' });
        const fsel = v.select('function', Object.entries(REV).map(([value, s]) => ({ value, label: s.name })), 'and3');
        const clean = v.toggle('uncompute garbage', false);
        const inp = v.slider('input $x$ (as a number)', 0, 7, 7, { int: true });
        const step = v.slider('step', 0, 20, 20, { int: true });
        const T = v.table(Tb, { rows: 8, cols: 5, square: false, maxCell: 40, cellAspect: 1.15, size: 14 });
        let info;
        v.render(() => {
          const spec = REV[fsel.value], circ = revBuild(spec, clean.value), N = circ.wires.length, G = circ.g.length;
          inp.el.hidden = false; step.el.hidden = false;
          const xv = inp.value % (1 << spec.k), k = Math.min(step.value, G);
          const x0 = [...Array(spec.k).keys()].map((i) => (xv >> (spec.k - 1 - i)) & 1);
          const start = [...x0, ...Array(N - spec.k).fill(0)], cur = revRun(circ, start, k);
          // ---- circuit diagram (pixel drawing)
          const cx = D.ctx, W = D.W, H = D.H, left = 56, right = 24, colW = Math.min(64, (W - left - right - 40) / Math.max(1, G)), gy = (H - 40) / Math.max(1, N - 1), Y = (q) => 22 + q * Math.min(gy, 44), X = (i) => left + 26 + i * colW;
          const ink = v.color('ink'), muted = v.color('muted'), panel = v.color('panel');
          cx.save(); cx.lineWidth = 1.4; cx.strokeStyle = muted;
          for (let q = 0; q < N; q++) { cx.beginPath(); cx.moveTo(left - 6, Y(q)); cx.lineTo(X(G) + 4, Y(q)); cx.stroke(); }
          cx.font = '600 13px Inter, system-ui, sans-serif'; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillStyle = v.color('ink');
          for (let q = 0; q < N; q++) cx.fillText(`${circ.wires[q]}  ${start[q]}`, left - 12, Y(q));
          if (k > 0) { cx.fillStyle = v.color('gold', 0.18); cx.fillRect(X(k - 1) - colW / 2 + 2, 6, colW - 4, Y(N - 1) - 6 + 16); }
          circ.g.forEach((g, i) => {
            const x = X(i), a = i < k ? 1 : 0.38; cx.globalAlpha = a; cx.strokeStyle = ink; cx.lineWidth = 1.8;
            const tq = g[g.length - 1], ctl = g.slice(1, -1);
            if (g[0] === 'X') { cx.fillStyle = panel; cx.fillRect(x - 11, Y(tq) - 11, 22, 22); cx.strokeRect(x - 11, Y(tq) - 11, 22, 22); cx.fillStyle = ink; cx.textAlign = 'center'; cx.font = '700 13px Inter, system-ui'; cx.fillText('X', x, Y(tq) + 1); }
            else {
              const ys = [...ctl, tq].map(Y); cx.beginPath(); cx.moveTo(x, Math.min(...ys)); cx.lineTo(x, Math.max(...ys)); cx.stroke();
              for (const c of ctl) { cx.beginPath(); cx.arc(x, Y(c), 4.5, 0, TAU); cx.fillStyle = ink; cx.fill(); }
              cx.beginPath(); cx.arc(x, Y(tq), 10, 0, TAU); cx.fillStyle = panel; cx.fill(); cx.stroke(); cx.beginPath(); cx.moveTo(x - 10, Y(tq)); cx.lineTo(x + 10, Y(tq)); cx.moveTo(x, Y(tq) - 10); cx.lineTo(x, Y(tq) + 10); cx.stroke();
            }
            cx.globalAlpha = 1;
          });
          // current values as badges at the right end
          cx.textAlign = 'center'; cx.font = '700 12px Inter, system-ui';
          for (let q = 0; q < N; q++) { const isOut = circ.outs.includes(q), xx = X(G) + 20; cx.beginPath(); cx.arc(xx, Y(q), 10, 0, TAU); cx.fillStyle = cur[q] ? v.color(isOut ? 'green' : 'accent', 0.9) : v.color('faint', 0.5); cx.fill(); cx.fillStyle = cur[q] ? v.color('panel') : ink; cx.fillText(String(cur[q]), xx, Y(q) + 1); }
          cx.restore();
          // ---- truth table
          const rows = 1 << spec.k, vals = [], garb = Array(N).fill(false); let ok = true;
          for (let r = 0; r < rows; r++) {
            const xs = [...Array(spec.k).keys()].map((i) => (r >> (spec.k - 1 - i)) & 1), fin = revRun(circ, [...xs, ...Array(N - spec.k).fill(0)]);
            vals.push(fin); const want = spec.f(...xs);
            circ.outs.forEach((o, j) => { if (fin[o] !== want[j]) ok = false; });
            for (let q = spec.k; q < N; q++) if (!circ.outs.includes(q) && fin[q]) garb[q] = true;
            for (let q = 0; q < spec.k; q++) if (fin[q] !== xs[q]) ok = false;
          }
          // bijection on all 2^N basis states
          const seen = new Set(); for (let s = 0; s < 1 << N; s++) { const bits = [...Array(N).keys()].map((i) => (s >> (N - 1 - i)) & 1); seen.add(revRun(circ, bits).join('')); }
          const nGarb = garb.filter(Boolean).length;
          info = { ok, bij: seen.size === 1 << N, nGarb, N, G, spec, clean: clean.value, row: xv };
          T.draw({
            rows, cols: N, colLabels: circ.wires, rowLabels: (r) => [...Array(spec.k).keys()].map((i) => (r >> (spec.k - 1 - i)) & 1).join(''), cornerLabel: 'x',
            value: (r, c) => vals[r][c],
            fill: (r, c) => (circ.outs.includes(c) ? ['green', 0.34] : c < spec.k ? ['accent', 0.14] : garb[c] ? ['orange', 0.42] : ['faint', 0.3]),
            highlight: [[xv % rows, 0, 'gold']],
          });
          step.el.hidden = false;
        });
        v.readout(() => {
          const kT = 1.380649e-23 * 300 * Math.log(2);
          return `${info.spec.name}${info.clean ? ' (compute–copy–uncompute)' : ''}: ${info.G} gates on ${info.N} wires; every input gives the correct answer: **${info.ok ? 'yes' : 'NO'}**; the map on all $2^{${info.N}}=${1 << info.N}$ basis states is a permutation: **${info.bij ? 'yes' : 'NO'}**\ngarbage bits left on work wires: $${info.nGarb}$ → erasing them costs at least $${info.nGarb}\\cdot k_BT\\ln2=${info.nGarb ? v.sci(info.nGarb * kT, 3) : '0'}$ J at 300 K`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'CNOT and single-qubit gates are universal',
      statement: String.raw`Every unitary on $n$ qubits is an exact product of CNOT gates and arbitrary single-qubit gates. One construction uses at most $\binom{2^n}{2}$ two-level elimination rotations, followed by a diagonal phase matrix. A two-level unitary acts on only two computational basis states. A Gray-code path implements it using $O(n)$ multiply-controlled gates, each admitting an $O(n^2)$ construction without work qubits. This gives the conservative original bound $O(n^3 4^n)$ elementary gates.
A controlled $U\in U(2)$ uses two CNOTs, three target-qubit gates and a phase gate on the control. General two-qubit synthesis has a separate optimal bound of three CNOTs plus single-qubit gates, up to global phase.`,
      idea: String.raw`Unitary row rotations eliminate subdiagonal entries, leaving a diagonal unitary $D$; its phases must also be implemented. A Gray-code sequence permutes the selected basis pair to states differing in one bit, applies a controlled unitary, then uncomputes the permutation. For $U=e^{i\delta}V$, $V\in SU(2)$, choose $ABC=I$ and $AXBXC=V$. Two CNOTs insert the two $X$ factors only on the controlled branch. A gate $\operatorname{diag}(1,e^{i\delta})$ on the control supplies the branch phase; a target global phase alone would be insufficient. Barenco et al.'s complete construction gives the stated conservative bound. The separate three-CNOT result uses a more efficient two-qubit canonical decomposition.`,
      caption: String.raw`Choose a $4\times4$ unitary and step through its row elimination. The matrix shows actual entry magnitudes and the entry just eliminated. The table lists inverse two-level factors: two CNOTs when the basis states differ in one bit, four when they differ in two (a CNOT permutes the pair before and after the controlled gate). These are counts for the explicit unoptimized circuit, not minima. The remaining diagonal phase matrix is implemented separately with two more CNOTs and single-qubit phases. Both the two-level reconstruction and the complete elementary-gate circuit are checked against the selected unitary.`,
      deps: ['qinfo-1.4', 'qinfo-2.1', 'ladr-7.58'],
      refs: ['Barenco et al. (1995), Lemma4.3, Corollary5.3 and §8', 'Vatan–Williams, Theorem5'],
      tags: ['universality', 'decomposition', 'CNOT'],
      scope: String.raw`Ideal exact gates on qubits, with arbitrary continuous single-qubit angles. The displayed construction implements all phases, including a global phase through a single-qubit scalar gate. The comparison bound of three CNOTs for two qubits is up to global phase; it is not the circuit shown here. A finite Clifford+T gate set instead gives approximate universality (qinfo-4.4,4.5).`,
      credit: 'A. Barenco et al., “Elementary gates for quantum computation”, arXiv:quant-ph/9503016v1 (1995), §§4–5,7–8; F. Vatan and C. Williams, “Optimal Quantum Circuits for General Two-Qubit Gates”, arXiv:quant-ph/0308006v3, Theorem5 (2004).',
      links: { primary: 'https://arxiv.org/pdf/quant-ph/9503016', synthesis: 'https://arxiv.org/pdf/quant-ph/0308006', wikipedia: 'https://en.wikipedia.org/wiki/Quantum_logic_gate#Universal_quantum_gates' },
      verify: false,
      viz(v) {
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1, title: 'the matrix after the chosen step ($|U_{ij}|$)' });
        const Gs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15, title: 'inverse two-level factors and their CNOT cost' });
        const kind = v.select('unitary', [{ value: 'rand', label: 'random' }, { value: 'qft', label: 'QFT$_4$' }, { value: 'hh', label: '$H\\otimes H$' }, { value: 'sw', label: 'SWAP' }], 'rand');
        const step = v.slider('step', 0, 6, 3, { int: true });
        let seed = 3; v.button('New random', () => { seed++; kind.set('rand'); });
        const T = v.table(Ts, { rows: 4, cols: 4, square: true, maxCell: 62, size: 13, rowLabels: ['00', '01', '10', '11'], colLabels: ['00', '01', '10', '11'], cmap: 'magma' });
        const T2 = v.table(Gs, { rows: 7, cols: 4, square: false, maxCell: 40, cellAspect: 1.9, size: 13, colLabels: ['gate', 'levels', 'bits differ', 'CNOTs'] });
        const matFor = () => {
          if (kind.value === 'qft') return [0, 1, 2, 3].map((j) => [0, 1, 2, 3].map((k) => [Math.cos(TAU * j * k / 4) / 2, Math.sin(TAU * j * k / 4) / 2]));
          if (kind.value === 'hh') return kronC(GATE.H(), GATE.H());
          if (kind.value === 'sw') return cplx([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]);
          const r = v.rng(seed * 13 + 1), cols = [];
          for (let j = 0; j < 4; j++) { let c = Array.from({ length: 4 }, () => [r.normal(), r.normal()]); for (const p of cols) { let ip = [0, 0]; for (let i = 0; i < 4; i++) ip = cadd(ip, cmul([p[i][0], -p[i][1]], c[i])); c = c.map((z, i) => [z[0] - (ip[0] * p[i][0] - ip[1] * p[i][1]), z[1] - (ip[0] * p[i][1] + ip[1] * p[i][0])]); } const nn = Math.sqrt(c.reduce((s, z) => s + cabs2(z), 0)); cols.push(c.map((z) => [z[0] / nn, z[1] / nn])); }
          return [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => cols[j][i]));
        };
        let cache = null;
        let cur;
        v.render(() => {
          const key = `${kind.value}|${seed}`; if (!cache || cache.key !== key) cache = { key, ...eliminate4(matFor()) };
          const m = cache.steps.length - 1; step.input.max = m; if (step.value > m) step.set(m); step.el.hidden = m === 0;
          const k = Math.min(step.value, m), st = cache.steps[k], tot = cache.gl.slice(0, k).reduce((s, g) => s + g.cost, 0);
          T.draw({
            value: (i, j) => Math.hypot(...st.A[i][j]), format: (x) => (x < 5e-4 ? '0' : x.toFixed(2)), heat: (i, j) => Math.min(1, Math.hypot(...st.A[i][j])),
            highlight: st.pair ? [[st.pair[1], st.col, 'green']] : [], activeRow: undefined,
          });
          T2.draw({
            rows: Math.max(1, cache.gl.length), cols: 4,
            value: (i, j) => { const g = cache.gl[i]; if (!g) return null; return [`$G_{${i + 1}}^\\dagger$`, `${['00', '01', '10', '11'][g.i]},${['00', '01', '10', '11'][g.j]}`, g.d, g.cost][j]; },
            fill: (i) => (i < k ? ['green', 0.25] : null), highlight: k > 0 ? [[k - 1, 0, 'gold']] : [],
          });
          cur = { k, m, tot, err: cache.err, all: cache.gl.reduce((s, g) => s + g.cost, 0), n: cache.gl.length, synthesisError: cache.synthesisError, diagonalCost: cache.diagonalCost, diag: k === m };
        });
        v.readout(() => `after ${cur.k} of ${cur.m} elimination rotations; ${cur.n} inverse two-level factors, costing ${cur.all} CNOTs, plus ${cur.diagonalCost} for $D$: ${cur.all+cur.diagonalCost} in this unoptimized circuit. Optimal two-qubit synthesis uses at most 3 CNOTs up to global phase.\nTwo-level reconstruction error $${v.sci(cur.err,2)}$; complete elementary-circuit error $${v.sci(cur.synthesisError,2)}$${cur.diag?' — only the diagonal phases $D$ remain':''}`);
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Pauli and Clifford groups',
      statement: String.raw`The **Pauli group** $\mathcal P_n$ is generated by the $n$-fold tensor products of $I,X,Y,Z$ together with the phases $\pm1,\pm i$; modulo phases it has $4^n$ elements. The **Clifford group** $\mathcal C_n$ is the normalizer of $\mathcal P_n$ in the unitary group:
$$\mathcal C_n=\{U:\ UPU^\dagger\in\mathcal P_n\ \text{for all }P\in\mathcal P_n\}.$$
Modulo global phase, it is generated by $H$, the phase gate $S=\mathrm{diag}(1,i)$ and CNOT; modulo global phase $|\mathcal C_1|=24$ and $|\mathcal C_2|=11\,520$. Conjugation by a Clifford gate permutes the Pauli strings (with signs), and is determined by its action on the $2n$ generators $X_j,Z_j$. The gate $T=\mathrm{diag}(1,e^{i\pi/4})$ is **not** Clifford: $TXT^\dagger=(X+Y)/\sqrt2$.`,
      idea: String.raw`Conjugation preserves products, so the images of $X_j,Z_j$ determine all Pauli images. Hermiticity restricts their phases to signs. Preservation of commutation gives a binary symplectic matrix; signs supply the remaining Pauli choice. Conversely, an inductive reduction of the generator images constructs such an action using $H,S$ and CNOT, so these gates generate the full normalizer modulo global phase. A unitary fixing every Pauli commutes with the full matrix algebra and is scalar. Thus its generator action determines it up to global phase. This finite representation is the basis of stabilizer simulation (qinfo-4.6).`,
      caption: String.raw`Build a gate word, acting left to right in time. Each cell summarizes the actual conjugation of one of the15 nonidentity two-qubit Paulis. A green cell is one signed Pauli; a red cell is a sum. A $T$ gate can produce sums, but later gates can cancel them: for example $T^2=S$ is Clifford. Select a Pauli to inspect all16 real expansion coefficients below. Its squared coefficients sum to1 by Hilbert–Schmidt orthogonality. The classification uses the complete word, not the presence of an individual $T$.`,
      deps: ['qm-7.7', 'qinfo-2.1'],
      refs: ['Gottesman thesis (1997), §§5.6/5.8', 'Gottesman (1998), §§2–3/Table1', 'Koenig–Smolin (2014), Eq.(1), §I.A/C'],
      tags: ['Clifford group', 'Pauli group', 'stabilizer'],
      scope: String.raw`Qubits ($d=2$); the sign bookkeeping differs for odd prime dimension. Group orders are modulo global phase.`,
      credit: 'D. Gottesman, “The Heisenberg Representation of Quantum Computers”, arXiv:quant-ph/9807006v1 (1998), §§2–3; R. Koenig and J. A. Smolin, arXiv:1406.2170v1 (2014), Eq.(1), §I.A and §I.C.',
      links: { primary: 'https://arxiv.org/pdf/quant-ph/9807006', counting: 'https://arxiv.org/pdf/1406.2170', generation: 'https://arxiv.org/pdf/quant-ph/9705052', wikipedia: 'https://en.wikipedia.org/wiki/Clifford_gates' },
      verify: false,
      viz(v) {
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true, title: 'conjugation $P\\mapsto UPU^\\dagger$ of the 15 non-trivial Pauli strings' });
        const B = v.stage({x:[-.6,15.6],y:[-1.08,1.08],height:280,full:true,axes:'box',gutter:true,xticks:PAULI_STRINGS2.map((s,i)=>[i,s]),ylabel:'real coefficient',title:'coefficients of the selected Pauli image'});
        const selected=v.select('inspect Pauli',PAULI_STRINGS2.slice(1).map(s=>({value:s,label:s})),'XI');
        let word = ['H0', 'CX01'];
        const add = (g) => v.button(g.label, () => { if (word.length < 10) word.push(g.id); });
        [{ id: 'H0', label: 'H on q0' }, { id: 'H1', label: 'H on q1' }, { id: 'S0', label: 'S on q0' }, { id: 'S1', label: 'S on q1' }, { id: 'CX01', label: 'CNOT 0→1' }, { id: 'CX10', label: 'CNOT 1→0' }, { id: 'CZ', label: 'CZ' }, { id: 'T0', label: 'T on q0' }, { id: 'T1', label: 'T on q1' }].forEach(add);
        v.button('Undo', () => { word.pop(); }); v.button('Clear', () => { word = []; });
        const T = v.table(S, { rows: 5, cols: 3, square: false, maxCell: 54, cellAspect: 3.4, size: 14 });
        const NAMES = { H0: 'H₀', H1: 'H₁', S0: 'S₀', S1: 'S₁', CX01: 'CX₀₁', CX10: 'CX₁₀', CZ: 'CZ', T0: 'T₀', T1: 'T₁' };
        let cur; const strs = PAULI_STRINGS2.slice(1);
        const fmt = (dec) => {
          if (dec.length === 1 && Math.abs(Math.abs(dec[0].c[0]) - 1) < 1e-6 && Math.abs(dec[0].c[1]) < 1e-6) return { pauli: true, text: `${dec[0].c[0] < 0 ? '−' : '+'}${dec[0].s}` };
          return { pauli: false, text: `sum of ${dec.length} Paulis` };
        };
        v.render(() => {
          let U = cplx([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);
          for (const g of word) U = mmul(gate2(g), U);
          const imgs = strs.map((s) => fmt(pauliDecompose(conjugate(U, pauliMat(s)))));
          const nP = imgs.filter((x) => x.pauli).length;
          const dec=pauliDecompose(conjugate(U,pauliMat(selected.value))),coeff=PAULI_STRINGS2.map(s=>dec.find(d=>d.s===s)?.c[0]||0);
          B.hline(0,{color:'faint'});coeff.forEach((a,i)=>B.rect(i-.31,0,i+.31,a,{color:a<0?'red':'accent',fill:a<0?'red':'accent',fillAlpha:.45}));
          cur = { nP, n: word.length, coeff,selected:selected.value,power:coeff.reduce((s,a)=>s+a*a,0),word:word.slice() };
          T.draw({
            value: (i, j) => `${strs[i * 3 + j]}  ↦  ${imgs[i * 3 + j].text}`,
            fill: (i, j) => (imgs[i * 3 + j].pauli ? ['green', 0.22] : ['red', 0.3]),
          });
        });
        v.readout(() => `word: ${word.length ? word.map((g) => NAMES[g]).join(' ') : '(empty)'} — ${cur.nP} of 15 Pauli strings are sent to a single signed Pauli string${cur.nP === 15 ? ': this word is a **Clifford** gate' : ': this word is **not** Clifford'}\nselected ${cur.selected}: squared coefficient sum $${fix(v,cur.power,8)}$.\n$|\\mathcal P_2/\\{\\pm I,\\pm iI\\}|=4^2=16$ strings up to phase, $|\\mathcal C_1|=24$, $|\\mathcal C_2|=11\\,520$`);
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Clifford + T is approximately universal',
      statement: String.raw`The group generated by $H$ and $T=\mathrm{diag}(1,e^{i\pi/4})$ is **dense** in $SU(2)$ up to global phase: for every single-qubit unitary $U$ and every $\varepsilon>0$ there is a finite word $W$ in $H,T$ with $\|U-e^{i\alpha}W\|<\varepsilon$. Together with CNOT, the set $\{H,T,\mathrm{CNOT}\}$ therefore approximates every $n$-qubit unitary to any accuracy. The Clifford generators $\{H,S,\mathrm{CNOT}\}$ alone give only a finite group.`,
      idea: String.raw`After removing global phases, $T$ and $HTH$ are $\pi/4$ rotations about $z$ and $x$. Their product has half-angle cosine $c=\cos^2(\pi/8)=(2+\sqrt2)/4$. For $z=e^{i\theta}$, with $\theta$ its Bloch rotation angle, eliminating $c$ gives the irreducible rational polynomial $z^4+z^3+\tfrac14z^2+z+1$. Its noninteger coefficient excludes a root of unity, since the minimal monic polynomial of a root of unity is an integer cyclotomic polynomial. Hence $\theta/\pi$ is irrational. Powers give a dense circle of rotations about this product's axis. Conjugation by $T$ gives a nonparallel axis; the two infinitesimal generators and their commutator span $\mathfrak{so}(3)$, so the closed generated group contains all rotations. This is the geometric irrational-rotation argument of Boykin et al., with a different choice of conjugate axes. Density alone supplies no rate guarantee.`,
      caption: String.raw`Each dot is a numerically deduplicated state $W|0\rangle$ for the completed word layers through $L$. Azimuth against $\cos\theta$ preserves spherical area, but a finite scatter does not prove a uniform cover or gate universality. Gold marks the newest state layer. Drag the target, including a pole, or press **north pole** for a zero-error case. The error is the best angular distance to this one state, not an operator error for approximating an entire unitary. The dashed $2/\sqrt N$ curve is only a chosen random-cover scale. With $\{H,S\}$, the orbit closes on six axis states.`,
      deps: ['qinfo-4.2', 'qinfo-4.3'],
      refs: ['Boykin et al. (1999), §3, Eqs.(5)–(14), AppendixB'],
      tags: ['universality', 'T gate', 'density'],
      scope: String.raw`Single-qubit projective universality; the multi-qubit theorem follows from qinfo-4.2 with errors distributed across the finitely many gates. This finite orbit uses quaternion and state coordinates rounded to $10^{-10}$ for numerical deduplication; its counts are not exact algebraic certificates. The60000-rotation cap discards an unfinished layer and limits the slider to the last complete layer. The proof of density is separate from this finite numerical illustration.`,
      credit: 'P. O. Boykin, T. Mor, M. Pulver, V. Roychowdhury and F. Vatan, “On Universal and Fault-Tolerant Quantum Computing”, arXiv:quant-ph/9906054v1 (1999), §3 and AppendixB.',
      links: { primary: 'https://arxiv.org/pdf/quant-ph/9906054', wikipedia: 'https://en.wikipedia.org/wiki/Quantum_logic_gate#Universal_quantum_gates' },
      verify: false,
      viz(v) {
        const M = v.stage({ x: [-Math.PI, Math.PI], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 1.2, xlabel: 'azimuth $\\varphi$', ylabel: '$\\cos\\theta$', title: 'states $W|0\\rangle$ on the sphere (equal-area map)' });
        const E = v.stage({ x: [0, 30], y: [0, Math.PI*1.03], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'word length $L$', ylabel: 'best error', title: 'error of the best word' });
        const gens = v.select('generators', [{ value: 'HT', label: '$\\{H,T\\}$' }, { value: 'HS', label: '$\\{H,S\\}$' }], 'HT');
        const Lsl = v.slider('word length $L\\le$', 0, 30, 20, { int: true });
        const tgt = M.handle(1.1, 0.35, { color: 'red', label: 'target', constrain: { x: [-Math.PI, Math.PI], y: [-1, 1] } });
        v.button('north pole',()=>{tgt.x=0;tgt.y=1;v.invalidate();});
        let cur;
        v.render(() => {
          const O = stateOrbit(gens.value), maxL=O.layers.length-1; Lsl.input.max=maxL; if(Lsl.value>maxL)Lsl.set(maxL); const L=Lsl.value;
          const ct=tgt.y,st=Math.sqrt(Math.max(0,1-ct*ct)),tv=[st*Math.cos(tgt.x),st*Math.sin(tgt.x),ct],best=orbitErrors(O,tv);
          const cx = M.ctx;
          for (const p of O.pts) {
            if (p.len > L) continue;
            const ph = Math.atan2(p.p[1], p.p[0]); cx.fillStyle = p.len === L && L > 0 ? v.color('gold', 0.95) : v.color('accent', 0.5);
            cx.fillRect(M.X(ph) - 1.5, M.Y(p.p[2]) - 1.5, 3, 3);
          }
          const Lm = O.layers.length - 1, pts = [], ref = []; E.setView([0,Math.max(1,Lm)],[0,Math.PI*1.03]);
          for (let l = 0; l <= Lm; l++) { pts.push([l, best[l]]); ref.push([l, 2 / Math.sqrt(O.layers[l].states)]); }
          E.path(ref, { color: 'muted', dash: true, width: 1.5 });
          E.path(pts, { color: 'accent', width: 2 }); E.dots(pts, { color: 'accent', r: 3 });
          E.vline(L, { color: 'gold', width: 1.5 });
          cur = { L, N: O.layers[L].states, R: O.layers[L].rot, err: best[Math.min(L, 30)], Lmax: O.layers.length - 1, capped: O.capped, total: O.pts.length,cap:O.cap,best,pts:O.pts,tv };
        });
        v.legend([['accent', 'best error found'], ['muted', 'random-cover estimate $2/\\sqrt N$', { dash: true }], ['gold', 'current $L$']]);
        v.readout(() => `words of length ≤ ${cur.L}: ${cur.R} numerically distinct rotations, ${cur.N} states; best error to the target ${fix(v, cur.err, 4)} rad (random-cover estimate ${fix(v, 2 / Math.sqrt(cur.N), 4)})\n${gens.value === 'HS' ? 'The full Clifford orbit has 24 rotations and 6 axis states; extra letters cannot approach a target closer than its nearest axis state.' : `Completed layers through ${cur.Lmax};${cur.capped?' the next layer is discarded at the 60000-rotation cap.':' the search stops at the depth limit.'} Growth of a finite orbit does not certify density or a convergence rate.`}`);
      },
    },
  ],
};
