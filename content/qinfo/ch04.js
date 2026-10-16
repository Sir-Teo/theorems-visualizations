// Quantum Information & Computation — Chapter 4: Circuits and universality
// (items 4.1–4.4 here; 4.5–4.9 in ch04-b.js)
import {
  TAU, R2, cmul, cadd, cabs2, mmul, adj, cplx, GATE, qmul, qapply, qdist, QG, qkey, kronC, pauliMat, pauliDecompose, gate2, conjugate,
  PAULI_STRINGS2, haarState, normalize,
} from './ch04.shared.js';

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

// ------------------------------------------------------------------ Clifford+T orbit (4.4)
const orbitCache = {};
function orbit(gens) {
  const key = gens.join('');
  if (orbitCache[key]) return orbitCache[key];
  const CAP = 60000, seen = new Map(), states = new Map(), layers = [];
  const q0 = [1, 0, 0, 0]; seen.set(qkey(q0), 1); let frontier = [q0], len = 0;
  const push = (q, l) => { const p = qapply(q, [0, 0, 1]), k = p.map((x) => Math.round(x * 1e5) / 1e5 + 0).join(','); if (!states.has(k)) states.set(k, { p, len: l }); };
  push(q0, 0); layers.push({ rot: 1, states: 1 });
  while (frontier.length && len < 40 && seen.size < CAP) {
    len++; const next = [];
    for (const q of frontier) for (const g of gens) { const nq = qmul(QG[g], q), k = qkey(nq); if (seen.has(k)) continue; seen.set(k, len); next.push(nq); push(nq, len); }
    frontier = next; layers.push({ rot: seen.size, states: states.size });
    if (!next.length) break;
  }
  const pts = [...states.values()];
  return (orbitCache[key] = { pts, layers, capped: seen.size >= CAP });
}

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
$$(x,\,0^m,\,0^k)\;\longmapsto\;(x,\,f(x),\,g(x)),$$
where $g(x)$ is "garbage" left on the $k$ work bits. Copying $f(x)$ onto fresh bits and then running the circuit backwards (**compute–copy–uncompute**) returns $g(x)$ to $0$: $(x,0^m,0^k,0^m)\mapsto(x,0^m,0^k,f(x))$. A circuit of size $s$ becomes one of size $2s+m$, so reversibility costs only a constant factor.`,
      idea: String.raw`A gate that is a bijection on bit strings can be undone, so no information is erased. The Toffoli gate is a controlled-controlled-NOT: when both controls are 1 it flips the target, which is exactly an AND added into the target, and AND plus constants gives NAND, which is universal for classical logic (circ-4.9). The garbage $g(x)$ is the only obstacle to zero net erasure, and Bennett's trick removes it: after the answer is copied (CNOT is reversible, and the copy is the only thing that must survive), the first half is inverted gate by gate. By Landauer's principle (thermo-5.17) erasing one bit costs at least $k_BT\ln 2$; the clean circuit erases none, so that bound does not force any dissipation.`,
      caption: String.raw`Choose a function and toggle **uncompute garbage**. The top panel is the circuit (controls are dots, the target $\oplus$); the slider steps it for the chosen **input**, showing each wire's bit. The table lists the final wire values for every input: green columns hold $f$, orange columns are garbage that would have to be erased, and grey columns are ancillas returned to $0$. In the *AND of three* circuit, uncomputing frees the work wire $g$.`,
      deps: ['qinfo-3.1', 'circ-4.9', 'thermo-5.17'],
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
      statement: String.raw`Every unitary $U$ on $n$ qubits is an exact product of CNOT gates and single-qubit gates. Concretely:
(a) $U$ is a product of at most $\binom{2^n}{2}$ **two-level unitaries**, each acting non-trivially on only two computational basis states;
(b) every two-level unitary is a product of $O(n)$ multiply-controlled single-qubit gates and bit flips (a Gray-code path joins the two basis states);
(c) every controlled single-qubit gate, and the multiply-controlled ones with ancillas or $O(n^2)$ gates without, is a product of CNOTs and single-qubit gates.
Hence $O(n^24^n)$ gates always suffice; for two qubits, three CNOTs and single-qubit gates suffice.`,
      idea: String.raw`(a) is Gaussian elimination with unitary steps: a rotation in the plane of two coordinates (a Givens rotation) zeroes one subdiagonal entry of the matrix without disturbing zeros already created, and since the result is unitary and upper triangular it is diagonal; the diagonal phases are themselves two-level. (b) A two-level gate on $|x\rangle,|y\rangle$ is moved to a pair of basis states differing in one bit by a chain of controlled flips along a Gray code, applied, then undone. (c) Any single-qubit unitary is $e^{i\alpha}AXBXC$ with $ABC=I$ (qinfo-1.4), which makes a controlled version out of two CNOTs. The count shows universality is cheap to prove but exponentially expensive to use: most unitaries really do need exponentially many gates by counting dimensions.`,
      caption: String.raw`Pick a $4\times4$ unitary (random, or a preset) and step through the elimination. Each step is a two-level unitary $G_k$ on neighbouring basis states chosen to zero the highlighted entry (brightness is $|U_{ij}|$); at the end only the diagonal phases remain. The table lists every step with the number of CNOTs it costs by the textbook construction (2 when the two states differ in one bit, 4 when they differ in two). The readout checks that $G_1^\dagger\cdots G_m^\dagger D$ reproduces $U$.`,
      deps: ['qinfo-1.4', 'qinfo-2.1', 'ladr-7.58'],
      refs: ['Nielsen–Chuang §4.5.1', 'Nielsen–Chuang §4.5.2'],
      tags: ['universality', 'decomposition', 'CNOT'],
      scope: String.raw`Exact universality; the construction gives $O(4^n n^2)$ gates, and a counting argument shows $\Omega(4^n/n)$ are sometimes necessary. Approximate universality with a finite gate set is a separate matter (qinfo-4.4, 4.5). The bound "three CNOTs for two qubits" is the optimal-synthesis result of Vatan–Williams and Shende–Bullock–Markov (2004).`,
      credit: 'D. P. DiVincenzo, Phys. Rev. A 51, 1015 (1995) (two-bit gates are universal); A. Barenco et al., Phys. Rev. A 52, 3457 (1995) (elementary gates; CNOT plus one-qubit gates); D. Deutsch, A. Barenco and A. Ekert, Proc. R. Soc. A 449, 669 (1995)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_logic_gate#Universal_quantum_gates' },
      verify: true,
      viz(v) {
        const Ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1, title: 'the matrix after the chosen step ($|U_{ij}|$)' });
        const Gs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15, title: 'the two-level gates and their cost' });
        const kind = v.select('unitary', [{ value: 'rand', label: 'random' }, { value: 'qft', label: 'QFT$_4$' }, { value: 'hh', label: '$H\\otimes H$' }, { value: 'sw', label: 'SWAP' }], 'rand');
        const step = v.slider('step', 0, 7, 3, { int: true });
        let seed = 3; v.button('New random', () => { seed++; kind.set('rand'); });
        const T = v.table(Ts, { rows: 4, cols: 4, square: true, maxCell: 62, size: 13, rowLabels: ['00', '01', '10', '11'], colLabels: ['00', '01', '10', '11'], cmap: 'magma' });
        const T2 = v.table(Gs, { rows: 7, cols: 4, square: false, maxCell: 40, cellAspect: 1.9, size: 13, colLabels: ['gate', 'levels', 'bits differ', 'CNOTs'] });
        const ident = () => [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => [i === j ? 1 : 0, 0]));
        const matFor = () => {
          if (kind.value === 'qft') return [0, 1, 2, 3].map((j) => [0, 1, 2, 3].map((k) => [Math.cos(TAU * j * k / 4) / 2, Math.sin(TAU * j * k / 4) / 2]));
          if (kind.value === 'hh') return kronC(GATE.H(), GATE.H());
          if (kind.value === 'sw') return cplx([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]);
          const r = v.rng(seed * 13 + 1), cols = [];
          for (let j = 0; j < 4; j++) { let c = Array.from({ length: 4 }, () => [r.normal(), r.normal()]); for (const p of cols) { let ip = [0, 0]; for (let i = 0; i < 4; i++) ip = cadd(ip, cmul([p[i][0], -p[i][1]], c[i])); c = c.map((z, i) => [z[0] - (ip[0] * p[i][0] - ip[1] * p[i][1]), z[1] - (ip[0] * p[i][1] + ip[1] * p[i][0])]); } const nn = Math.sqrt(c.reduce((s, z) => s + cabs2(z), 0)); cols.push(c.map((z) => [z[0] / nn, z[1] / nn])); }
          return [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => cols[j][i]));
        };
        let cache = null;
        const decompose = (U) => {
          let A = U.map((r) => r.map((z) => z.slice())); const steps = [{ A: A.map((r) => r.map((z) => z.slice())) }], gl = [];
          for (let c = 0; c < 3; c++) for (let r = 3; r > c; r--) {
            const a = A[r - 1][c], b = A[r][c], n = Math.sqrt(cabs2(a) + cabs2(b)); if (Math.sqrt(cabs2(b)) < 1e-12) continue;
            const G = ident(); G[r - 1][r - 1] = [a[0] / n, -a[1] / n]; G[r - 1][r] = [b[0] / n, -b[1] / n]; G[r][r - 1] = [-b[0] / n, -b[1] / n]; G[r][r] = [a[0] / n, a[1] / n];
            A = mmul(G, A); const d = ((r - 1) ^ r).toString(2).split('1').length - 1;
            gl.push({ G, i: r - 1, j: r, d, cost: d === 1 ? 2 : 4 }); steps.push({ A: A.map((rw) => rw.map((z) => z.slice())), k: gl.length, pair: [r - 1, r], col: c });
          }
          let P = ident(); for (const g of gl) P = mmul(P, adj(g.G)); const R = mmul(P, A);
          let err = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) err = Math.max(err, Math.hypot(R[i][j][0] - U[i][j][0], R[i][j][1] - U[i][j][1]));
          return { steps, gl, err, D: A };
        };
        let cur;
        v.render(() => {
          const key = `${kind.value}|${seed}`; if (!cache || cache.key !== key) cache = { key, ...decompose(matFor()) };
          const m = cache.steps.length - 1; step.el.hidden = false;
          const k = Math.min(step.value, m), st = cache.steps[k], tot = cache.gl.slice(0, k).reduce((s, g) => s + g.cost, 0);
          T.draw({
            value: (i, j) => Math.hypot(...st.A[i][j]), format: (x) => (x < 5e-4 ? '0' : x.toFixed(2)), heat: (i, j) => Math.min(1, Math.hypot(...st.A[i][j])),
            highlight: st.pair ? [[st.pair[1], st.col, 'green']] : [], activeRow: undefined,
          });
          T2.draw({
            rows: Math.max(1, cache.gl.length), cols: 4,
            value: (i, j) => { const g = cache.gl[i]; if (!g) return null; return [`$G_{${i + 1}}$`, `${['00', '01', '10', '11'][g.i]},${['00', '01', '10', '11'][g.j]}`, g.d, g.cost][j]; },
            fill: (i) => (i < k ? ['green', 0.25] : null), highlight: k > 0 ? [[k - 1, 0, 'gold']] : [],
          });
          cur = { k, m, tot, err: cache.err, all: cache.gl.reduce((s, g) => s + g.cost, 0), n: cache.gl.length, diag: k === m };
        });
        v.readout(() => `after ${cur.k} of ${cur.m} elimination steps; ${cur.n} two-level gates in all (at most $\\binom{4}{2}=6$) costing ${cur.all} CNOTs by this textbook construction (a 2-qubit unitary needs at most 3 with optimal synthesis)\nreconstruction error $\\max|G_1^\\dagger\\cdots G_m^\\dagger D-U|=${v.sci(Math.max(cur.err, 1e-16), 2)}$${cur.diag ? ' — only the diagonal phases $D$ remain' : ''}`);
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Pauli and Clifford groups',
      statement: String.raw`The **Pauli group** $\mathcal P_n$ is generated by the $n$-fold tensor products of $I,X,Y,Z$ together with the phases $\pm1,\pm i$; modulo phases it has $4^n$ elements. The **Clifford group** $\mathcal C_n$ is the normalizer of $\mathcal P_n$ in the unitary group:
$$\mathcal C_n=\{U:\ UPU^\dagger\in\mathcal P_n\ \text{for all }P\in\mathcal P_n\}.$$
It is generated by $H$, the phase gate $S=\mathrm{diag}(1,i)$ and CNOT; modulo global phase $|\mathcal C_1|=24$ and $|\mathcal C_2|=11\,520$. Conjugation by a Clifford gate permutes the Pauli strings (with signs), and is determined by its action on the $2n$ generators $X_j,Z_j$. The gate $T=\mathrm{diag}(1,e^{i\pi/4})$ is **not** Clifford: $TXT^\dagger=(X+Y)/\sqrt2$.`,
      idea: String.raw`Because $U(PQ)U^\dagger=(UPU^\dagger)(UQU^\dagger)$, a unitary that sends the generators $X_j,Z_j$ to Pauli strings sends every Pauli string to one, so it suffices to track $2n$ images. That makes a Clifford gate a small symplectic matrix over $\mathbb F_2$ (plus signs) instead of a $2^n\times2^n$ unitary, which is what the Gottesman–Knill theorem exploits (qinfo-4.6). Checking H, S and CNOT by hand shows they are Clifford; closure under products then gives the whole group. The Pauli matrices themselves (qm-7.7) generate the group that Cliffords normalize.`,
      caption: String.raw`Build a **gate word** from the buttons (acts left to right in time). The grid shows what conjugation $P\mapsto UPU^\dagger$ does to each of the 15 non-trivial two-qubit Pauli strings, computed from the actual $4\times4$ matrices. Green cells are Pauli strings with a sign; red cells are sums of several strings, which happens as soon as a $T$ is in the word. Count how many of the 15 stay Paulis.`,
      deps: ['qm-7.7', 'qinfo-2.1'],
      refs: ['Nielsen–Chuang §10.5.2'],
      tags: ['Clifford group', 'Pauli group', 'stabilizer'],
      scope: String.raw`Qubits ($d=2$); the sign bookkeeping differs for odd prime dimension. Group orders are modulo global phase.`,
      credit: 'D. Gottesman, Phys. Rev. A 54, 1862 (1996) (stabilizer codes and the normalizer of the Pauli group); the name “Clifford group” follows its use in A. R. Calderbank, E. M. Rains, P. W. Shor and N. J. A. Sloane, IEEE Trans. Inf. Theory 44, 1369 (1998)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Clifford_gates' },
      verify: true,
      viz(v) {
        const S = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true, title: 'conjugation $P\\mapsto UPU^\\dagger$ of the 15 non-trivial Pauli strings' });
        let word = ['H0', 'CX01'];
        const add = (g) => v.button(g.label, () => { if (word.length < 10) word.push(g.id); });
        [{ id: 'H0', label: 'H on q0' }, { id: 'H1', label: 'H on q1' }, { id: 'S0', label: 'S on q0' }, { id: 'S1', label: 'S on q1' }, { id: 'CX01', label: 'CNOT 0→1' }, { id: 'CX10', label: 'CNOT 1→0' }, { id: 'CZ', label: 'CZ' }, { id: 'T0', label: 'T on q0' }, { id: 'T1', label: 'T on q1' }].forEach(add);
        v.button('Undo', () => { word.pop(); }); v.button('Clear', () => { word = []; });
        const T = v.table(S, { rows: 5, cols: 3, square: false, maxCell: 54, cellAspect: 3.4, size: 14 });
        const NAMES = { H0: 'H₀', H1: 'H₁', S0: 'S₀', S1: 'S₁', CX01: 'CX₀₁', CX10: 'CX₁₀', CZ: 'CZ', T0: 'T₀', T1: 'T₁' };
        let cur; const strs = PAULI_STRINGS2.slice(1);
        const fmt = (dec) => {
          if (dec.length === 1 && Math.abs(Math.abs(dec[0].c[0]) - 1) < 1e-6 && Math.abs(dec[0].c[1]) < 1e-6) return { pauli: true, text: `${dec[0].c[0] < 0 ? '−' : '+'}${dec[0].s}` };
          return { pauli: false, text: dec.map((d) => `${v.fix(d.c[0], 2)}${d.s}`).join(' + ').replace(/\+ −/g, '− ') };
        };
        v.render(() => {
          let U = cplx([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);
          for (const g of word) U = mmul(gate2(g), U);
          const imgs = strs.map((s) => fmt(pauliDecompose(conjugate(U, pauliMat(s)))));
          const nP = imgs.filter((x) => x.pauli).length;
          cur = { nP, n: word.length, nonP: strs.filter((_, i) => !imgs[i].pauli).slice(0, 2) };
          T.draw({
            value: (i, j) => `${strs[i * 3 + j]}  ↦  ${imgs[i * 3 + j].text}`,
            fill: (i, j) => (imgs[i * 3 + j].pauli ? ['green', 0.22] : ['red', 0.3]),
          });
        });
        v.readout(() => `word: ${word.length ? word.map((g) => NAMES[g]).join(' ') : '(empty)'} — ${cur.nP} of 15 Pauli strings are sent to a single signed Pauli string${cur.nP === 15 ? ': this word is a **Clifford** gate' : ': this word is **not** Clifford'}\n$|\\mathcal P_2|=4^2=16$ strings up to phase, $|\\mathcal C_1|=24$, $|\\mathcal C_2|=11\\,520$`);
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Clifford + T is approximately universal',
      statement: String.raw`The group generated by $H$ and $T=\mathrm{diag}(1,e^{i\pi/4})$ is **dense** in $SU(2)$ up to global phase: for every single-qubit unitary $U$ and every $\varepsilon>0$ there is a finite word $W$ in $H,T$ with $\|U-e^{i\alpha}W\|<\varepsilon$. Together with CNOT, the set $\{H,T,\mathrm{CNOT}\}$ therefore approximates every $n$-qubit unitary to any accuracy. The Clifford generators $\{H,S,\mathrm{CNOT}\}$ alone give only a finite group.`,
      idea: String.raw`$HTH$ and $T$ are rotations by $\pi/4$ about two different axes (the $x$ and $z$ axes of the Bloch sphere), and the product $THTH$ is a rotation through an angle that is an *irrational* multiple of $\pi$ about a third axis. Powers of an irrational rotation are dense in the circle of rotations about that axis, and conjugating by the other rotations moves the axis around; a short argument with these dense subgroups then fills all of $SO(3)$. By contrast the Clifford group is finite (24 elements, qinfo-4.3), so it can never be dense: this is why a non-Clifford gate such as $T$ is the missing ingredient. Density says nothing about *speed*, which is the subject of qinfo-4.5.`,
      caption: String.raw`Each dot is a Bloch-sphere state $W|0\rangle$ reached by a word of at most $L$ letters (map: azimuth against $\cos\theta$, which is area-preserving, so an even scatter means an even cover of the sphere); the newest layer is gold. Drag the **target** and watch the best error shrink as $L$ grows, against the random-cover heuristic $2/\sqrt N$. Switch the generators to $\{H,S\}$: only 6 states ever appear.`,
      deps: ['qinfo-4.2', 'qinfo-4.3'],
      refs: ['Nielsen–Chuang §4.5.3'],
      tags: ['universality', 'T gate', 'density'],
      scope: String.raw`Single-qubit statement (the multi-qubit one follows from qinfo-4.2). Distances are measured between Bloch vectors; the count of states is capped at 60 000 for speed.`,
      credit: 'P. O. Boykin, T. Mor, M. Pulver, V. Roychowdhury and F. Vatan, “On universal and fault-tolerant quantum computing”, FOCS 1999, 486–494 (the {H,T} basis); earlier universality results: Barenco et al., Phys. Rev. A 52, 3457 (1995)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_logic_gate#Universal_quantum_gates' },
      verify: true,
      viz(v) {
        const M = v.stage({ x: [-Math.PI, Math.PI], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 1.2, xlabel: 'azimuth $\\varphi$', ylabel: '$\\cos\\theta$', title: 'states $W|0\\rangle$ on the sphere (equal-area map)' });
        const E = v.stage({ x: [0, 30], y: [1e-3, 3], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'word length $L$', ylabel: 'best error', title: 'error of the best word' });
        const gens = v.select('generators', [{ value: 'HT', label: '$\\{H,T\\}$' }, { value: 'HS', label: '$\\{H,S\\}$' }], 'HT');
        const Lsl = v.slider('word length $L\\le$', 0, 30, 20, { int: true });
        const tgt = M.handle(1.1, 0.35, { color: 'red', label: 'target', constrain: { x: [-3.1, 3.1], y: [-0.98, 0.98] } });
        let cur;
        v.render(() => {
          const O = orbit(gens.value.split('')), L = Math.min(Lsl.value, O.layers.length - 1);
          const ct = tgt.y, st = Math.sqrt(1 - ct * ct), tv = [st * Math.cos(tgt.x), st * Math.sin(tgt.x), ct];
          const best = Array(31).fill(9);
          for (const p of O.pts) { const d = Math.acos(Math.max(-1, Math.min(1, p.p[0] * tv[0] + p.p[1] * tv[1] + p.p[2] * tv[2]))); if (d < best[p.len] || best[p.len] === undefined) best[p.len] = Math.min(best[p.len] ?? 9, d); }
          for (let l = 1; l < best.length; l++) best[l] = Math.min(best[l], best[l - 1]);
          const cx = M.ctx;
          for (const p of O.pts) {
            if (p.len > L) continue;
            const ph = Math.atan2(p.p[1], p.p[0]); cx.fillStyle = p.len === L && L > 0 ? v.color('gold', 0.95) : v.color('accent', 0.5);
            cx.fillRect(M.X(ph) - 1.5, M.Y(p.p[2]) - 1.5, 3, 3);
          }
          const Lm = Math.min(O.layers.length - 1, 30), pts = [], ref = [];
          for (let l = 0; l <= Lm; l++) { pts.push([l, Math.max(best[l], 1.1e-3)]); ref.push([l, Math.min(3, 2 / Math.sqrt(O.layers[l].states))]); }
          E.path(ref, { color: 'muted', dash: true, width: 1.5 });
          E.path(pts, { color: 'accent', width: 2 }); E.dots(pts, { color: 'accent', r: 3 });
          E.vline(L, { color: 'gold', width: 1.5 });
          cur = { L, N: O.layers[L].states, R: O.layers[L].rot, err: best[Math.min(L, 30)], Lmax: O.layers.length - 1, capped: O.capped, total: O.pts.length };
        });
        v.legend([['accent', 'best error found'], ['muted', 'random-cover estimate $2/\\sqrt N$', { dash: true }], ['gold', 'current $L$']]);
        v.readout(() => `words of length ≤ ${cur.L}: ${cur.R} distinct rotations, ${cur.N} distinct states; best error to the target ${fix(v, cur.err, 4)} rad (random-cover estimate ${fix(v, 2 / Math.sqrt(cur.N), 4)})\n${gens.value === 'HS' ? 'The Clifford generators close up after ' + cur.Lmax + ' letters on only ' + cur.total + ' states: the error cannot fall below the distance to the nearest of the 6 axis states.' : 'Each extra letter multiplies the count roughly geometrically' + (cur.capped ? ' (list capped at 60 000 rotations)' : '') + ', so the cover thickens and the error falls.'}`);
      },
    },
  ],
};
