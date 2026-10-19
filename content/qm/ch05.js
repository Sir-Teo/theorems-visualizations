// Quantum Mechanics — Chapter 5: The formalism: states, observables, measurement (items 5.1–5.8; 5.9–5.15 in ch05-b.js, 5.16–5.22 in ch05-c.js)
// Everything is finite-dimensional linear algebra computed live (complex Jacobi diagonalization, Born-rule sampling),
// except where a wave function on a grid is the point. ħ = 1 throughout.
import {
  TAU, phaseLUT, drawPsi, drawReal, phaseWheel, fz, sub, toMomentum,
  C, cadd, cmul, cconj, cscale, cabs, cabs2, carg, cis, ip, vnorm, vnormalize, vscale, basis,
  mat, eye, cplx, mmul, mvec, adj, madd, msub, mscale, trace, fnorm, maxAbs, outer, expect, herm, cols, fromCols,
  heig, funcH, expmC, randState, randHerm, randUnitary, SX, SY, SZ, spinOps, spinAlong, blochOf, stateOf, spinCoherent, rotate3,
  sampleIdx, texC, texMat, cells, dial, blochFrame, sphereOutline,
} from './ch05.shared.js';

/** Named qubit states used by several items. */
const R2 = Math.SQRT1_2;
const KETS = {
  0: [[1, 0], [0, 0]], 1: [[0, 0], [1, 0]], '+': [[R2, 0], [R2, 0]], '-': [[R2, 0], [-R2, 0]], '+i': [[R2, 0], [0, R2]], '-i': [[R2, 0], [0, -R2]],
};
const KET_TEX = { 0: '0', 1: '1', '+': '{+}', '-': '{-}', '+i': '{+i}', '-i': '{-i}', psi: '\\psi', phi: '\\varphi' };

/**
 * Tokenize and evaluate a Dirac-notation expression over ℂ² (see item 5.2). Kets |name>, bras <name|, brackets <a|b>,
 * sandwiches <a|X|b>, operators X Y Z H I A, numbers, i, /2, /sqrt2, sums with + and −.
 * → {terms: [{coef, factors: [{kind, name, M}]}], value (matrix), shape, error}
 */
function dirac(src, env) {
  const s = src.replace(/ψ/g, 'psi').replace(/φ/g, 'phi').replace(/⟨/g, '<').replace(/⟩/g, '>').replace(/√/g, 'sqrt').replace(/·|\*/g, ' ');
  const terms = []; let cur = null, i = 0, sign = 1;
  const newTerm = () => { cur = { coef: [sign, 0], factors: [] }; terms.push(cur); sign = 1; };
  const ket = (name) => { const k = env.kets[name.trim()]; if (!k) throw new Error(`unknown ket |${name}⟩ (try 0, 1, +, -, +i, -i, psi, phi)`); return k; };
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '+' || ch === '-') { if (cur && cur.factors.length) cur = null; sign *= ch === '-' ? -1 : 1; i++; continue; }
    if (!cur) newTerm();
    if (ch === '<') {
      const j = s.indexOf('|', i + 1); if (j < 0) throw new Error('a bra ⟨…| needs its closing bar');
      const name = s.slice(i + 1, j).trim(); cur.factors.push({ kind: 'bra', name, M: [ket(name).map(cconj)] }); i = j + 1;
      const m = /^([^|<>]+)>/.exec(s.slice(i)); // shared bar: <a|b>
      if (m) { const nm = m[1].trim(); cur.factors.push({ kind: 'ket', name: nm, M: ket(nm).map((z) => [z]) }); i += m[0].length; }
      continue;
    }
    if (ch === '|') {
      const j = s.indexOf('>', i + 1); if (j < 0) throw new Error('a ket |…⟩ needs its closing >');
      const nm = s.slice(i + 1, j).trim(); cur.factors.push({ kind: 'ket', name: nm, M: ket(nm).map((z) => [z]) }); i = j + 1; continue;
    }
    if (ch === '/') {
      const m = /^\/\s*(sqrt\s*\(?\s*(\d*\.?\d+)\s*\)?|\d*\.?\d+)/.exec(s.slice(i)); if (!m) throw new Error('“/” must be followed by a number or sqrt2');
      const d = m[2] ? Math.sqrt(+m[2]) : +m[1]; cur.coef = cscale(cur.coef, 1 / d); i += m[0].length; continue;
    }
    let m = /^sqrt\s*\(?\s*(\d*\.?\d+)\s*\)?/.exec(s.slice(i));
    if (m) { cur.coef = cscale(cur.coef, Math.sqrt(+m[1])); i += m[0].length; continue; }
    m = /^\d*\.?\d+/.exec(s.slice(i));
    if (m) { cur.coef = cscale(cur.coef, +m[0]); i += m[0].length; continue; }
    if (ch === 'i') { cur.coef = cmul(cur.coef, [0, 1]); i++; continue; }
    if (env.ops[ch]) { cur.factors.push({ kind: 'op', name: ch, M: env.ops[ch] }); i++; continue; }
    throw new Error(`cannot read “${s.slice(i, i + 6)}”`);
  }
  if (!terms.length) throw new Error('empty expression');
  let shape = null, value = null;
  for (const t of terms) {
    if (!t.factors.length) throw new Error('a term needs at least one ket, bra or operator');
    let P = null;
    for (const f of t.factors) {
      if (!P) { P = f.M; continue; }
      const sc1 = P.length === 1 && P[0].length === 1, sc2 = f.M.length === 1 && f.M[0].length === 1;
      if (sc1) P = mscale(f.M, P[0][0]); else if (sc2) P = mscale(P, f.M[0][0]);
      else if (P[0].length !== f.M.length) throw new Error(`shapes do not chain: ${P.length}×${P[0].length} followed by ${f.M.length}×${f.M[0].length}`);
      else P = mmul(P, f.M);
    }
    P = mscale(P, t.coef); t.value = P;
    const sh = `${P.length}×${P[0].length}`;
    if (shape && sh !== shape) throw new Error(`cannot add a ${shape} array to a ${sh} array`);
    shape = sh; value = value ? madd(value, P) : P;
  }
  return { terms, value, shape };
}

export default {
  collection: 'qm',
  chapter: 5,
  title: 'The formalism: states, observables, measurement',
  summary: String.raw`Quantum states are unit vectors in a complex Hilbert space — arrows whose overall phase is invisible — and observables are self-adjoint operators. The spectral theorem writes each observable as $\sum\lambda P_\lambda$; the Born rule turns the projections into outcome probabilities, and the projection postulate says what the state becomes afterwards. Mixtures and superpositions give different density operators and different statistics. Non-commuting observables obey Robertson’s uncertainty relation, commuting ones share an eigenbasis and can be measured together, and the canonical commutation relation $[x,p]=i\hbar$ has no finite-dimensional solution but, by Stone–von Neumann, essentially one infinite-dimensional one. Time evolution is a one-parameter unitary group, viewed with moving states (Schrödinger) or moving observables (Heisenberg), where commutators replace Poisson brackets — exactly the matrix mechanics Heisenberg found in 1925.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Postulate',
      name: 'States are vectors in a Hilbert space',
      statement: String.raw`The pure states of a quantum system are described by nonzero vectors $\psi$ in a complex Hilbert space $\mathcal H$ (a complete inner-product space), with two vectors describing the same state exactly when one is a nonzero complex multiple of the other. Equivalently a state is a **ray** $\{c\psi : c\in\C\setminus\{0\}\}$, or a unit vector up to a **global phase** $e^{i\gamma}$.

(a) **Superposition:** any linear combination $a\psi+b\varphi\neq0$ of states is again a state.

(b) **Inner products carry the physics:** the transition probability between states is $|\ip{\varphi}{\psi}|^2$ for unit vectors; it is unchanged by $\psi\mapsto e^{i\gamma}\psi$, while *relative* phases between components are physical.

For a single particle on a line $\mathcal H=L^2(\R)$ (wave functions, qm-2.3); for a spin-$\tfrac12$ or any two-level system $\mathcal H=\C^2$, where the rays form the Bloch sphere.`,
      idea: String.raw`Everything observable is computed from squared moduli of inner products (Born rule, qm-2.2 and 5.6), and $|\ip{\varphi}{e^{i\gamma}\psi}|=|\ip{\varphi}{\psi}|$, so a global phase can never be detected; the inner product of rca-4.4 / ladr-6.2 is what makes "how much of $\varphi$ is in $\psi$" a number. For a qubit, $\psi=\cos\frac\theta2|0\rangle+e^{i\phi}\sin\frac\theta2|1\rangle$ after removing the global phase, so two real parameters remain — a point $(\theta,\phi)$ of the unit sphere — and $|\ip{\varphi}{\psi}|^2=\tfrac12(1+\mathbf n_\varphi\cdot\mathbf n_\psi)$: orthogonal states sit at antipodes.`,
      caption: String.raw`**Drag the handles** $a$ and $b$ (raw amplitudes, any length): the solid arrows are the *normalized* amplitudes $\alpha,\beta$ of $|\psi\rangle=(a|0\rangle+b|1\rangle)/\norm{\cdot}$, coloured by phase; the unit circles are modulus 1. The third dial is the inner product $\langle\varphi|\psi\rangle$ with the comparison state. **Slide the global phase** $\gamma$: all three arrows rotate, yet the probabilities, $|\langle\varphi|\psi\rangle|^2$ and the point on the Bloch sphere do not move. Changing the *relative* phase (drag $b$ around its circle) moves the state around the sphere.`,
      deps: ['qm-2.3', 'rca-4.4', 'ladr-6.2'],
      refs: ['Griffiths §3.1', 'Hall ch. 3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_state' },
      tags: ['Hilbert space', 'superposition', 'global phase'],
      viz(v) {
        const S = v.stage({ x: [-3.05, 3.05], y: [-1.55, 1.15], equal: true, axes: false, height: 285, weight: 1.5, title: 'amplitudes as arrows in $\\mathbb C$' });
        const B = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 285, weight: 1, title: 'the ray on the Bloch sphere' });
        const sc = v.scene3(B, { axes: false, yaw: -0.5, pitch: 0.3 });
        const R = 0.8, cA = [-2.05, 0], cB = [0, 0], cI = [2.05, 0];
        const lim = (c) => (x, y) => { const dx = x - c[0], dy = y - c[1], r = Math.hypot(dx, dy), m = 1.2 * R; return r > m ? [c[0] + (dx * m) / r, c[1] + (dy * m) / r] : [x, y]; };
        const hA = S.handle(cA[0] + 0.85 * R, cA[1] + 0.12 * R, { color: 'ink', r: 5.5, label: 'a', constrain: lim(cA) });
        const hB = S.handle(cB[0] + 0.25 * R, cB[1] + 0.5 * R, { color: 'ink', r: 5.5, label: 'b', constrain: lim(cB) });
        const gam = v.slider('global phase $\\gamma$: multiply by $e^{i\\gamma}$', 0, TAU, 0, { step: 0.01 });
        const ref = v.select('compare with $|\\varphi\\rangle=$', [{ value: '0', label: '$|0\\rangle$' }, { value: '+', label: '$|{+}\\rangle$' }, { value: '+i', label: '$|{+i}\\rangle$' }, { value: '1', label: '$|1\\rangle$' }], '+');
        let st = null;
        v.render(() => {
          const a = [(hA.x - cA[0]) / R, (hA.y - cA[1]) / R], b = [(hB.x - cB[0]) / R, (hB.y - cB[1]) / R], nr = Math.hypot(cabs(a), cabs(b));
          if (nr < 1e-6) { S.text('a = b = 0 is not a state', 0, 0, { align: 'center', color: 'red' }); st = null; return; }
          const g = cis(gam.value), psi = [cmul(g, cscale(a, 1 / nr)), cmul(g, cscale(b, 1 / nr))], phi = KETS[ref.value], ov = ip(phi, psi);
          for (const [c, h] of [[cA, hA], [cB, hB]]) S.line(c[0], c[1], h.x, h.y, { color: 'muted', width: 1, dash: [3, 3] });
          dial(v, S, cA[0], cA[1], R, psi[0], { label: '$\\alpha$' });
          dial(v, S, cB[0], cB[1], R, psi[1], { label: '$\\beta$' });
          dial(v, S, cI[0], cI[1], R, ov, { label: '$\\langle\\varphi|\\psi\\rangle$', color: 'purple' });
          const P = [cabs2(psi[0]), cabs2(psi[1])];
          S.text(`|α|² = ${v.fix(P[0], 3)}`, cA[0], -1.3, { align: 'center', size: 12 });
          S.text(`|β|² = ${v.fix(P[1], 3)}`, cB[0], -1.3, { align: 'center', size: 12 });
          S.text(`|⟨φ|ψ⟩|² = ${v.fix(cabs2(ov), 3)}`, cI[0], -1.3, { align: 'center', size: 12, color: 'purple' });
          // Bloch sphere: independent of γ
          const np = blochOf(psi), nf = blochOf(phi);
          sc.begin(); sphereOutline(B, sc); blochFrame(sc);
          sc.arrow([0, 0, 0], nf, { color: 'purple', width: 2.2 }); sc.dot(nf, { color: 'purple', r: 4 });
          sc.arrow([0, 0, 0], np, { color: 'accent', width: 2.8 }); sc.dot(np, { color: 'accent', r: 5 });
          const lp = sc.P(np.map((x) => x * 1.12)); B.text('ψ', lp[0], lp[1], { color: 'accent', math: true, size: 15, align: 'center' });
          sc.flush();
          st = { psi, P, ov, np, nf, nr, P0: [cabs2(cscale(a, 1 / nr)), cabs2(cscale(b, 1 / nr))] };
        });
        v.legend([['accent', 'state $|\\psi\\rangle$'], ['purple', 'comparison $|\\varphi\\rangle$ and $\\langle\\varphi|\\psi\\rangle$']]);
        v.readout(() => {
          if (!st) return 'Move a handle away from the origin.';
          const { psi, P, ov, np, nf } = st, dot = np[0] * nf[0] + np[1] * nf[1] + np[2] * nf[2];
          const dP = Math.max(Math.abs(P[0] - st.P0[0]), Math.abs(P[1] - st.P0[1]));
          return `$\\|a|0\\rangle+b|1\\rangle\\| = ${v.fix(st.nr, 3)}$ $\\Rightarrow$ $|\\psi\\rangle = (${texC(v, psi[0], 3)})\\,|0\\rangle + (${texC(v, psi[1], 3)})\\,|1\\rangle$, $\\;|\\alpha|^2+|\\beta|^2 = ${v.fix(P[0] + P[1], 6)}$\n` +
            `$\\langle\\varphi|\\psi\\rangle = ${texC(v, ov, 3)}$, $\\;|\\langle\\varphi|\\psi\\rangle|^2 = ${v.fix(cabs2(ov), 4)}$ $=\\tfrac12(1+\\mathbf n_\\varphi\\cdot\\mathbf n_\\psi) = ${v.fix((1 + dot) / 2, 4)}$\n` +
            `global phase $e^{i\\gamma}$, $\\gamma = ${v.fix(gam.value, 2)}$: change in the probabilities $= ${v.sci(Math.max(dP, 0), 1)}$ — **invisible**; relative phase $\\arg\\beta-\\arg\\alpha = ${v.fix(((carg(psi[1]) - carg(psi[0]) + 3 * Math.PI) % TAU) - Math.PI, 3)}$ sets the longitude on the sphere.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Definition',
      name: 'Dirac notation',
      statement: String.raw`In Dirac's notation a state vector is a **ket** $|\psi\rangle$; the linear functional "take the inner product with $\varphi$", $\psi\mapsto\ip{\varphi}{\psi}$, is the **bra** $\langle\varphi|$, and applying a bra to a ket gives the **bracket** $\langle\varphi|\psi\rangle\in\C$. By the Riesz representation theorem every continuous linear functional is a bra, and $\langle\varphi|$ depends *antilinearly* on $\varphi$: the bra of $c|\varphi\rangle$ is $\bar c\langle\varphi|$.

Products are read by juxtaposition: $A|\psi\rangle$ is a ket, $\langle\varphi|A|\psi\rangle$ a number (a matrix element), and $|\psi\rangle\langle\varphi|$ the rank-one operator $\chi\mapsto\langle\varphi|\chi\rangle\,|\psi\rangle$. For an orthonormal basis $\{|k\rangle\}$, $\sum_k|k\rangle\langle k|=I$ (resolution of the identity) and $|k\rangle\langle k|$ projects onto $|k\rangle$. In $\C^n$: kets are columns, bras are conjugate-transposed rows, and every expression is a matrix product.`,
      idea: String.raw`The notation makes the types check themselves: a ket is $n\times1$, a bra $1\times n$, an operator $n\times n$, and a well-formed product chains the shapes like matrix multiplication — so $\langle\varphi|\psi\rangle$ is $1\times1$ (a number) and $|\psi\rangle\langle\varphi|$ is $n\times n$ (an operator). The Riesz theorem (fa-12.3, ladr-6.42) guarantees that the bras are exactly the dual space, and conjugate symmetry $\langle\psi|\varphi\rangle=\overline{\langle\varphi|\psi\rangle}$ is the statement that the bra is the conjugate transpose of the ket.`,
      caption: String.raw`**Type an expression** (or pick a preset): kets “|psi>”, “|0>”, “|+>”, “|-i>”; bras “<phi|”; brackets “<phi|psi>”; operators X Y Z H I A; numbers, “i”, “/sqrt2”; sums with + and −. The first term is drawn factor by factor as arrays — each entry a disc whose area is its modulus and whose colour is its phase — and the result after the equals sign. Notice the bra of $|\psi\rangle$ is a row with *conjugated* colours, a bracket collapses to one cell, and $|\psi\rangle\langle\varphi|$ blows up to a $2\times2$ matrix. Sliders set $|\psi\rangle$.`,
      deps: ['qm-5.1', 'fa-12.5', 'ladr-6.42'],
      refs: ['Griffiths §3.6'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bra%E2%80%93ket_notation' },
      tags: ['Dirac notation', 'bra-ket', 'dual space'],
      viz(v) {
        const S = v.stage({ x: [0, 12], y: [-1.7, 3.0], equal: true, axes: false, height: 270, full: true });
        const inp = v.input('expression', '<phi|A|psi>', { width: 230, placeholder: '<phi|psi>' });
        const pre = v.select('presets', [
          { value: '<phi|psi>', label: '$\\langle\\varphi|\\psi\\rangle$' }, { value: '|psi><phi|', label: '$|\\psi\\rangle\\langle\\varphi|$' },
          { value: '<phi|A|psi>', label: '$\\langle\\varphi|A|\\psi\\rangle$' }, { value: '|0><0| + |1><1|', label: '$\\sum|k\\rangle\\langle k|$' },
          { value: '|+><+|psi>', label: '$|{+}\\rangle\\langle{+}|\\psi\\rangle$' }, { value: '<psi|', label: '$\\langle\\psi|$' },
        ], '<phi|A|psi>', { onChange: (x) => inp.set(x) });
        const th = v.slider('$|\\psi\\rangle$: polar angle $\\theta$', 0, Math.PI, 2.1, { step: 0.01 });
        const ph = v.slider('relative phase $\\phi$', 0, TAU, 0.9, { step: 0.01 });
        const ops = { X: cplx([[0, 1], [1, 0]]), Y: SY, Z: SZ, H: cplx([[R2, R2], [R2, -R2]]), I: eye(2), A: [[[1, 0], [0.6, -0.4]], [[0.6, 0.4], [-0.5, 0]]] };
        let st = null;
        const label = (f) => (f.kind === 'ket' ? `|${KET_TEX[f.name] ?? f.name}\\rangle` : f.kind === 'bra' ? `\\langle${KET_TEX[f.name] ?? f.name}|` : f.name);
        v.render(() => {
          const psi = [[Math.cos(th.value / 2), 0], cscale(cis(ph.value), Math.sin(th.value / 2))];
          const env = { kets: { ...KETS, psi, phi: [[Math.cos(0.45), 0], [0, Math.sin(0.45)]] }, ops };
          let r;
          try { r = dirac(inp.value, env); } catch (e) { st = { error: e.message }; S.text(e.message, 6, 0.7, { align: 'center', color: 'red', size: 13 }); return; }
          const t0 = r.terms[0], items = r.terms.length === 1 ? t0.factors.map((f) => ({ M: f.M, lab: label(f) })) : r.terms.map((t) => ({ M: t.value, lab: t.factors.map(label).join('') }));
          const u = 1.3, gap = 0.8, max = Math.max(1, ...items.map((x) => maxAbs(x.M)), maxAbs(r.value));
          const all = [...items, { M: r.value, lab: '', res: true }];
          const W = all.reduce((s, x) => s + x.M[0].length * u, 0) + gap * (all.length - 1) + (r.terms.length === 1 && Math.abs(cabs(t0.coef) - 1) > 1e-9 ? 1.2 : 0);
          S.setView([-0.4, Math.max(8, W + 0.4)], [-1.7, 3.0]);
          let x = 0;
          const yc = 0.8, coef = r.terms.length === 1 ? t0.coef : null;
          if (coef && (Math.abs(coef[0] - 1) > 1e-9 || Math.abs(coef[1]) > 1e-9)) { S.text(`$${texC(v, coef, 3)}$`, x + 0.5, yc, { align: 'center', size: 15 }); x += 1.2; }
          all.forEach((it, k) => {
            const nr = it.M.length, nc = it.M[0].length, y0 = yc - (nr * u) / 2;
            if (it.res) {
              S.text('=', x - gap / 2, yc, { align: 'center', size: 20, color: 'muted' });
              S.rect(x - 0.08, y0 - 0.08, x + nc * u + 0.08, y0 + nr * u + 0.08, { color: 'green', width: 2, radius: 5 });
            } else if (k > 0) S.text(r.terms.length === 1 ? '·' : '+', x - gap / 2, yc, { align: 'center', size: 20, color: 'muted' });
            cells(v, S, it.M, [x, y0, x + nc * u, y0 + nr * u], { max, text: (z) => texC(v, z, 2).replace(/-/g, '−'), size: 11 });
            const shape = nr === 1 && nc === 1 ? 'number' : nc === 1 ? `${nr}×1 ket` : nr === 1 ? `1×${nc} bra` : `${nr}×${nc} operator`;
            if (it.lab) S.text(`$${it.lab}$`, x + (nc * u) / 2, y0 - 0.32, { align: 'center', size: 14, baseline: 'top' });
            S.text(shape, x + (nc * u) / 2, y0 + nr * u + 0.18, { align: 'center', size: 10.5, color: it.res ? 'green' : 'muted', baseline: 'bottom' });
            x += nc * u + gap;
          });
          st = { r, psi };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.error) return `**Cannot evaluate:** ${st.error}`;
          const { r } = st, V = r.value, n = V.length, m = V[0].length;
          let kind;
          if (n === 1 && m === 1) kind = `a **number**: $${texC(v, V[0][0], 4)}$, modulus $${v.fix(cabs(V[0][0]), 4)}$`;
          else if (m === 1) kind = `a **ket** (column), norm $${v.fix(vnorm(V.map((rw) => rw[0])), 4)}$`;
          else if (n === 1) kind = `a **bra** (row), norm $${v.fix(vnorm(V[0]), 4)}$ — the conjugate transpose of the ket $${texMat(v, V[0].map(cconj), 2)}$`;
          else {
            const herm2 = fnorm(msub(V, adj(V))) < 1e-9, P2 = fnorm(msub(mmul(V, V), V)) < 1e-9;
            kind = `an **operator** (${n}×${m} matrix), trace $${texC(v, trace(V), 3)}$; ${herm2 ? 'Hermitian' : 'not Hermitian'}${herm2 && P2 ? ', and $P^2=P$: a **projection**' : ''}${fnorm(msub(V, eye(n))) < 1e-9 ? ' — it is the **identity**' : ''}`;
          }
          return `Result: ${kind}. In this panel $|\\psi\\rangle = ${texMat(v, st.psi, 3)}$, $|\\varphi\\rangle = ${texMat(v, [[Math.cos(0.45), 0], [0, Math.sin(0.45)]], 3)}$, $A = ${texMat(v, ops.A, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Postulate',
      name: 'Observables are self-adjoint operators',
      statement: String.raw`Each measurable quantity (an **observable**) is represented by a self-adjoint operator $A=A^\dagger$ on the state space: $\langle\varphi|A\psi\rangle=\langle A\varphi|\psi\rangle$ for all $\varphi,\psi$ in its domain, and the domain of $A^\dagger$ equals that of $A$. The possible results of measuring it are the points of its spectrum, and its mean value in a unit state is $\langle A\rangle_\psi=\langle\psi|A|\psi\rangle$ (qm-2.7).

In finite dimensions self-adjoint means **Hermitian**: $a_{ji}=\overline{a_{ij}}$. A matrix is Hermitian **if and only if** $\langle\psi|A|\psi\rangle$ is real for every $\psi$. For unbounded operators such as $\hat x$ and $\hat p$ on $L^2(\R)$, being symmetric on a dense domain is not enough: self-adjointness is what the spectral theorem (5.5) and unitary time evolution (5.15) require.`,
      idea: String.raw`Measured values are real numbers, so the mean $\langle\psi|A|\psi\rangle$ must be real in every state. Conversely, write any matrix as $A=H+iK$ with $H=\tfrac12(A+A^\dagger)$ and $K=\tfrac1{2i}(A-A^\dagger)$ both Hermitian; then $\langle\psi|A|\psi\rangle=\langle H\rangle+i\langle K\rangle$ with both brackets real, so a real expectation in all states forces $\langle\psi|K|\psi\rangle=0$ for all $\psi$, hence $K=0$ by polarization. The set of all values $\langle\psi|A|\psi\rangle$ — the **numerical range** — is a convex set (Toeplitz–Hausdorff), and it is a real segment $[\lambda_{\min},\lambda_{\max}]$ exactly when $A$ is Hermitian (fa-13.3).`,
      caption: String.raw`Left: a $3\times3$ matrix (disc area = modulus, colour = phase). **Click an entry**, then **drag the handle in the round pad** to set its complex value. In *Hermitian* mode the mirror entry follows as its conjugate and diagonal entries stay real; switch to *free* to break the symmetry. Right: $\langle\psi|A|\psi\rangle$ for 600 random unit vectors $\psi$ (gold dots), the exact boundary of the numerical range (outline, computed from the top eigenvector of $\mathrm{Re}(e^{-i\theta}A)$ for each direction $\theta$), and the eigenvalues. Hermitian: everything collapses onto the real axis between the extreme eigenvalues.`,
      deps: ['qm-5.1', 'fa-13.3', 'qm-2.7'],
      refs: ['Griffiths §3.2', 'Hall ch. 9'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Self-adjoint_operator' },
      tags: ['observables', 'Hermitian operators', 'numerical range'],
      viz(v) {
        const M = v.M, Q = v.quantum();
        const SM = v.stage({ x: [-0.4, 6.6], y: [-0.55, 3.35], equal: true, axes: false, height: 300, weight: 1.15, title: 'the matrix $A$ and the entry pad' });
        const SP = v.stage({ x: [-3, 3], y: [-2, 2], equal: true, axes: false, height: 300, weight: 1, title: '$\\langle\\psi|A|\\psi\\rangle$ in the complex plane' });
        let A = [[[1.2, 0], [0.5, -0.5], [0, 0.4]], [[0.5, 0.5], [-0.6, 0], [0.7, 0]], [[0, -0.4], [0.7, 0], [0.2, 0]]];
        let sel = [0, 1];
        const PC = [4.85, 1.5], PR = 1.3, PS = 2; // pad centre, radius (data), entry modulus at the rim
        const mode = v.select('editing', [{ value: 'h', label: 'Hermitian (mirror edits)' }, { value: 'f', label: 'free (break the symmetry)' }], 'h', {
          onChange: (m) => { if (m === 'h') A = herm(A); else { A[2][0] = cadd(A[2][0], [0.9, 0.5]); } sync(); },
        });
        const toPad = (z) => [PC[0] + (z[0] * PR) / PS, PC[1] + (z[1] * PR) / PS];
        const hp = SM.handle(...toPad(A[0][1]), {
          color: 'gold', r: 6.5,
          constrain: (x, y) => { let dx = x - PC[0], dy = y - PC[1]; if (mode.value === 'h' && sel[0] === sel[1]) dy = 0; const r = Math.hypot(dx, dy); if (r > PR) { dx *= PR / r; dy *= PR / r; } return [PC[0] + dx, PC[1] + dy]; },
          onDrag: () => { const z = [((hp.x - PC[0]) * PS) / PR, ((hp.y - PC[1]) * PS) / PR], [i, j] = sel; A[i][j] = z; if (mode.value === 'h') { if (i === j) A[i][i] = [z[0], 0]; else A[j][i] = cconj(z); } },
        });
        const sync = () => { const p = toPad(A[sel[0]][sel[1]]); hp.set(p[0], p[1]); };
        SM.onClick((x, y) => { if (x < 0 || x > 3 || y < 0 || y > 3) return; sel = [Math.min(2, Math.floor(3 - y)), Math.min(2, Math.floor(x))]; sync(); v.invalidate(); });
        const rng = v.rng(11), samples = Array.from({ length: 600 }, () => randState(rng, 3));
        let st = null;
        v.render(() => {
          cells(v, SM, A, [0, 0, 3, 3], { max: 1.6, text: (z) => texC(v, z, 2).replace(/-/g, '−'), size: 10, hi: (i, j) => (i === sel[0] && j === sel[1] ? 'gold' : mode.value === 'h' && i === sel[1] && j === sel[0] ? 'orange' : null) });
          SM.text('click an entry', 1.5, -0.32, { align: 'center', size: 11, color: 'muted' });
          // pad
          SM.circle(PC[0], PC[1], PR, { color: 'faint', fill: 'grid', fillAlpha: 0.12 });
          SM.line(PC[0] - PR, PC[1], PC[0] + PR, PC[1], { color: 'faint' }); SM.line(PC[0], PC[1] - PR, PC[0], PC[1] + PR, { color: 'faint' });
          SM.text(`a${sub(sel[0] + 1)}${sub(sel[1] + 1)}`, PC[0], PC[1] + PR + 0.22, { align: 'center', size: 12, color: 'gold' });
          SM.text('Re', PC[0] + PR + 0.08, PC[1], { size: 10, color: 'muted' }); SM.text('Im', PC[0], PC[1] - PR - 0.2, { size: 10, color: 'muted', align: 'center' });
          SM.arrow(PC[0], PC[1], hp.x, hp.y, { color: Q.phaseColor(carg(A[sel[0]][sel[1]])), width: 2.4 });
          // numerical range
          const vals = samples.map((p) => expect(A, p)), ev = M.eigC(A).values;
          const bd = []; for (let k = 0; k <= 120; k++) { const t = (TAU * k) / 120, Ht = herm(mscale(A, cis(-t))), E = heig(Ht), w = E.vectors[2]; bd.push(expect(A, w)); }
          let ext = 1; for (const z of [...vals, ...bd, ...ev.map((l) => [l.re, l.im])]) ext = Math.max(ext, Math.abs(z[0]), Math.abs(z[1]) * 1.5);
          SP.setView([-1.15 * ext, 1.15 * ext], [-0.75 * ext, 0.75 * ext]);
          SP.line(SP.xr[0], 0, SP.xr[1], 0, { color: 'muted', width: 1 }); SP.line(0, SP.yr[0], 0, SP.yr[1], { color: 'faint', width: 1 });
          SP.text('Re', SP.xr[1], 0, { dx: -18, dy: -10, size: 11, color: 'muted' }); SP.text('Im', 0, SP.yr[1], { dx: 6, dy: 10, size: 11, color: 'muted' });
          SP.poly(bd.map((z) => [z[0], z[1]]), { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.6 });
          SP.dots(vals.map((z) => [z[0], z[1]]), { r: 1.9, color: 'gold' });
          for (const l of ev) SP.dot(l.re, l.im, { r: 5.5, color: Math.abs(l.im) < 1e-7 ? 'green' : 'red' });
          let im = 0; for (const z of vals) im = Math.max(im, Math.abs(z[1]));
          st = { im, ah: fnorm(msub(A, adj(A))), ev };
        });
        v.legend([['gold', '$\\langle\\psi|A|\\psi\\rangle$, random $\\psi$', { dot: true }], ['accent', 'numerical range', { area: true }], ['green', 'real eigenvalue', { dot: true }], ['red', 'complex eigenvalue', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const ev = st.ev.map((l) => texC(v, [l.re, l.im], 3)).join(',\\ ');
          return st.ah < 1e-9
            ? `$\\|A-A^\\dagger\\| = ${v.fix(st.ah, 3)}$: **Hermitian**. Largest $|\\mathrm{Im}\\langle\\psi|A|\\psi\\rangle|$ over 600 states $= ${v.sci(Math.max(st.im, 1e-17), 1)}$ (rounding). Eigenvalues $${ev}$ — all real, and every expectation lies between the extremes.`
            : `$\\|A-A^\\dagger\\| = ${v.fix(st.ah, 3)}$: **not Hermitian**. Expectation values leave the real axis: largest $|\\mathrm{Im}\\langle\\psi|A|\\psi\\rangle| = ${v.fix(st.im, 3)}$. Eigenvalues $${ev}$. Such an $A$ cannot be an observable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4',
      kind: 'Theorem',
      name: 'Real eigenvalues, orthogonal eigenvectors',
      statement: String.raw`Let $A$ be a self-adjoint operator. Then

(a) every eigenvalue of $A$ is real;

(b) eigenvectors belonging to distinct eigenvalues are orthogonal.

Consequently, in finite dimensions the eigenvectors can be chosen to form an orthonormal basis (by 5.5). Both conclusions fail for general matrices: a non-Hermitian perturbation can push eigenvalues off the real axis and tilts eigenvectors away from right angles.`,
      idea: String.raw`(a) If $A\psi=\lambda\psi$ with $\psi\neq0$, then $\lambda\norm{\psi}^2=\langle\psi|A\psi\rangle=\langle A\psi|\psi\rangle=\bar\lambda\norm{\psi}^2$. (b) If $A\psi=\lambda\psi$, $A\varphi=\mu\varphi$ with $\lambda\neq\mu$ real, then $\lambda\langle\varphi|\psi\rangle=\langle\varphi|A\psi\rangle=\langle A\varphi|\psi\rangle=\mu\langle\varphi|\psi\rangle$, so $\langle\varphi|\psi\rangle=0$ (ladr-7.12). Both lines use nothing but moving $A$ across the inner product — exactly the property a non-Hermitian matrix lacks.`,
      caption: String.raw`**2×2 real:** drag $Se_1$ (the first column of the symmetric part) anywhere; $Se_2$ is forced onto the vertical line that keeps the matrix symmetric. The unit circle (faint) is mapped to the shaded ellipse; the green lines are the eigenvector directions, whose angle is in the readout. Raise **non-Hermitian part** $\gamma$ (adds $\gamma\left(\begin{smallmatrix}0&1\\-1&0\end{smallmatrix}\right)$): the eigenvectors close up like scissors, merge, and the eigenvalues (right, following the traced locus as $\gamma$ grows) collide on the real axis and split into a complex-conjugate pair. **3×3 complex:** a random Hermitian matrix plus $\gamma$ times a random anti-Hermitian one; the left panel shows the overlaps $|\langle v_i|v_j\rangle|$ of the unit eigenvectors — the identity matrix only at $\gamma=0$.`,
      deps: ['qm-5.3', 'ladr-7.12'],
      refs: ['Griffiths §3.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hermitian_matrix' },
      tags: ['Hermitian operators', 'eigenvalues', 'orthogonality'],
      viz(v) {
        const M = v.M;
        const mode = v.select('matrix', [{ value: '2', label: '2×2 real' }, { value: '3', label: '3×3 complex' }], '2', { onChange: (m) => { h1.visible = h2.visible = m === '2'; } });
        const gam = v.slider('non-Hermitian part $\\gamma$', 0, 1.5, 0, { step: 0.01 });
        const SL = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 340, title: 'eigenvector directions' });
        const SR = v.stage({ x: [-2.6, 2.6], y: [-1.7, 1.7], equal: true, axes: false, height: 340, title: 'eigenvalues in $\\mathbb C$' });
        const h1 = SL.handle(1.3, 0.55, { color: 'accent', label: '$Se_1$', constrain: (x, y) => [M.clamp(x, -2, 2), M.clamp(y, -2, 2)] });
        const h2 = SL.handle(0.55, -0.6, { color: 'orange', label: '$Se_2$', constrain: (x, y) => [h1.y, M.clamp(y, -2, 2)] });
        h1.onDrag = () => h2.set(h1.y, h2.y);
        const rng = v.rng(5), H3 = randHerm(rng, 3, 0.8), K3 = mscale(randHerm(rng, 3, 0.6), [0, 1]);
        const mat2 = (g) => [[h1.x, h1.y + g], [h1.y - g, h2.y]];
        const mat3 = (g) => madd(H3, mscale(K3, g));
        const evals = (g) => (mode.value === '2' ? M.eigC(mat2(g)).values : M.eigC(mat3(g)).values).map((z) => [z.re, z.im]);
        let st = null;
        v.render(() => {
          const g = gam.value;
          // locus over γ
          const loc = []; for (let k = 0; k <= 75; k++) for (const z of evals((1.5 * k) / 75)) loc.push(z);
          let ext = 1.4; for (const z of loc) ext = Math.max(ext, Math.abs(z[0]) * 1.1, Math.abs(z[1]) * 1.6);
          SR.setView([-ext, ext], [-0.66 * ext, 0.66 * ext]);
          SR.line(-ext * 2, 0, ext * 2, 0, { color: 'green', width: 2, alpha: 0.5 }); SR.line(0, -ext, 0, ext, { color: 'faint' });
          SR.text('real axis', SR.xr[0], 0, { dx: 6, dy: -10, size: 10.5, color: 'green' });
          SR.dots(loc, { r: 1.6, color: 'muted' });
          const ev = evals(g);
          for (const z of ev) SR.dot(z[0], z[1], { r: 6, color: Math.abs(z[1]) < 1e-7 ? 'green' : 'red' });
          if (mode.value === '2') {
            SL.setView([-2.3, 2.3], [-2.3, 2.3]);
            SL.line(-2.3, 0, 2.3, 0, { color: 'faint' }); SL.line(0, -2.3, 0, 2.3, { color: 'faint' });
            const A = mat2(g), img = []; for (let k = 0; k <= 120; k++) { const t = (TAU * k) / 120, c = Math.cos(t), s = Math.sin(t); img.push([A[0][0] * c + A[0][1] * s, A[1][0] * c + A[1][1] * s]); }
            SL.circle(0, 0, 1, { color: 'faint', width: 1.2 });
            SL.poly(img, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.4 });
            SL.arrow(0, 0, A[0][0], A[1][0], { color: 'accent', width: 1.6, alpha: 0.6 }); SL.arrow(0, 0, A[0][1], A[1][1], { color: 'orange', width: 1.6, alpha: 0.6 });
            const E = M.eig(A), dirs = [];
            E.values.forEach((l, k) => { const w = E.vectors[k]; if (Math.abs(l.im) < 1e-9 && w) dirs.push([w[0], w[1], l.re]); });
            for (const [a, b, l] of dirs) { SL.line(-3 * a, -3 * b, 3 * a, 3 * b, { color: 'green', width: 2.2 }); SL.arrow(0, 0, l * a, l * b, { color: 'green', width: 3, head: 9 }); }
            let ang = null; if (dirs.length === 2) ang = (Math.acos(Math.min(1, Math.abs(dirs[0][0] * dirs[1][0] + dirs[0][1] * dirs[1][1]))) * 180) / Math.PI;
            if (ang != null && dirs.length === 2) SL.corner(`angle between eigenvectors: ${v.fix(ang, 1)}°`, 'tl', { color: Math.abs(ang - 90) < 0.05 ? 'green' : 'red', size: 12, plate: true });
            else SL.corner('no real eigenvector', 'tl', { color: 'red', size: 12, plate: true });
            st = { m: 2, A, ev, ang, g };
          } else {
            SL.setView([-0.75, 3.35], [-0.7, 3.4]);
            const A = mat3(g), E = g === 0 ? { vecs: heig(A).vectors } : { vecs: M.eigC(A).vectors.map((w) => vnormalize(w.re.map((x, i) => [x, w.im[i]]))) };
            const G = mat(3, 3, (i, j) => [cabs(ip(E.vecs[i], E.vecs[j])), 0]);
            cells(v, SL, G, [0, 0, 3, 3], { max: 1, text: (z) => v.fix(z[0], 3), size: 11, rowLabels: ['v₁', 'v₂', 'v₃'], colLabels: ['v₁', 'v₂', 'v₃'] });
            SL.text('$|\\langle v_i|v_j\\rangle|$', 1.5, -0.38, { align: 'center', size: 13 });
            let off = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) off = Math.max(off, G[i][j][0]);
            st = { m: 3, ev, off, g };
          }
        });
        v.legend([['green', 'real eigenvalue / eigenvector', { dot: true }], ['red', 'complex eigenvalue', { dot: true }], ['muted', 'locus as $\\gamma$ runs over $[0,1.5]$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const evs = st.ev.map((z) => texC(v, z, 3)).join(',\\ ');
          if (st.m === 2) {
            const A = st.A;
            return `$A = \\begin{pmatrix}${v.fix(A[0][0], 2)}&${v.fix(A[0][1], 2)}\\\\${v.fix(A[1][0], 2)}&${v.fix(A[1][1], 2)}\\end{pmatrix}$, eigenvalues $${evs}$. ` +
              (st.g === 0 ? `Symmetric: eigenvalues real, eigenvectors at **${v.fix(st.ang ?? 90, 4)}°**.` : st.ang != null ? `Not symmetric: eigenvalues still real, but the eigenvectors meet at **${v.fix(st.ang, 2)}°** — not orthogonal.` : `Not symmetric: the eigenvalues have left the real axis (a conjugate pair); no real direction is an eigenvector.`);
          }
          return `Eigenvalues $${evs}$; largest off-diagonal overlap $\\max_{i\\ne j}|\\langle v_i|v_j\\rangle| = ${st.g === 0 ? v.sci(Math.max(st.off, 1e-17), 1) : v.fix(st.off, 4)}$ — ${st.g === 0 ? '**orthonormal** eigenbasis of a Hermitian matrix.' : 'the eigenvectors are no longer orthogonal.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Theorem',
      name: 'Spectral theorem for observables',
      statement: String.raw`**Finite dimensions.** A Hermitian operator $A$ on $\C^n$ has real eigenvalues $\lambda_1<\dots<\lambda_m$ and orthogonal projections $P_k$ onto its eigenspaces with
$$A=\sum_{k}\lambda_kP_k,\qquad P_jP_k=\delta_{jk}P_k,\qquad \sum_kP_k=I,$$
and then $f(A)=\sum_kf(\lambda_k)P_k$ for every function $f$. The projections are unique even when eigenvalues are degenerate (the eigen*vectors* are not).

**General case.** A self-adjoint operator $A$ on a Hilbert space (possibly unbounded) has a unique **projection-valued measure** $E$ on the Borel sets of $\R$ with $A=\int\lambda\,dE(\lambda)$; for a unit state, $\mu_\psi(\Delta)=\langle\psi|E(\Delta)|\psi\rangle$ is a probability measure — the distribution of measured values. For the position operator, $E(\Delta)$ multiplies by the indicator of $\Delta$, and $\mu_\psi(\Delta)=\int_\Delta|\psi(x)|^2dx$.`,
      idea: String.raw`In finite dimensions: by 5.4 the eigenvalues are real and eigenspaces for different eigenvalues are orthogonal; the orthogonal complement of an eigenvector is invariant under $A$ (because $A$ is Hermitian), so one can split off eigenvectors one at a time until they span everything (ladr-7.31). Grouping them by eigenvalue gives the $P_k$. Infinite-dimensional observables need not have any eigenvectors ($\hat x$ has none in $L^2$), so the sum becomes an integral against a projection-valued measure (fa-13.30); the discrete grid picture shows it emerging as the eigenvalues fill in.`,
      caption: String.raw`**Finite:** a $3\times3$ Hermitian $A$ is rebuilt as $\sum\lambda_kP_k$; each array shows modulus (disc area) and phase (colour), and under each projection sit the eigenvectors that span it. **Drag the eigenvalues** on the number line; bring two together and they snap into a **degenerate** eigenvalue — the two rank-one projections merge into one rank-two projection. *New basis in each eigenspace* rotates the eigenvectors inside a degenerate eigenspace: the vectors change, the projection does not. **Position grid:** the position operator discretized on $N$ points is $\mathrm{diag}(x_i)=\sum x_i|x_i\rangle\langle x_i|$; the stems are $\langle\psi|P_{x_i}|\psi\rangle/\Delta x$. Drag the interval ends and raise $N$: $\langle\psi|P_{[a,b]}|\psi\rangle$ converges to $\int_a^b|\psi|^2$ (lower plot, error against $N$).`,
      deps: ['qm-5.4', 'ladr-7.31', 'fa-13.30'],
      refs: ['Griffiths §3.3', 'Hall ch. 10'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spectral_theorem' },
      tags: ['spectral theorem', 'projections', 'projection-valued measure'],
      viz(v) {
        const M = v.M;
        const mode = v.select('view', [{ value: 'fin', label: 'finite: $A=\\sum\\lambda_kP_k$' }, { value: 'pos', label: 'position grid: a projection-valued measure' }], 'fin', { onChange: () => show() });
        const SA = v.stage({ x: [0, 16], y: [-2.0, 3.85], equal: true, axes: false, height: 270, full: true });
        const SN = v.stage({ x: [-2.6, 2.6], y: [-0.55, 0.75], axes: false, height: 110, full: true });
        const SX_ = v.stage({ x: [-4, 4], y: [0, 0.75], axes: 'box', gutter: true, height: 290, full: true, xlabel: 'x (eigenvalue of the grid position operator)', ylabel: 'probability density' });
        const SE = v.stage({ x: [4, 1024], y: [1e-5, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 190, full: true, xlabel: 'grid points N', ylabel: 'error in ⟨ψ|P[a,b]|ψ⟩' });
        const NN = v.slider('grid points $N$', 4, 512, 24, { int: true, log: true });
        const btn = v.button('new basis in each eigenspace', () => { rot++; });
        const res = v.button('new eigenvectors', () => { seed++; U0 = randUnitary(v.rng(seed), 3); });
        let rot = 0, seed = 3, U0 = randUnitary(v.rng(seed), 3);
        const hs = [];
        [[-1.4, 'accent'], [0.4, 'orange'], [1.6, 'green']].forEach(([x, c], k) => hs.push(SN.handle(x, 0, { color: c, label: `λ${sub(k + 1)}`, labelPos: 'n', constrain: (X) => { X = M.clamp(X, -2.4, 2.4); for (const o of hs) if (o !== hs[k] && Math.abs(o.x - X) < 0.12) X = o.x; return [X, 0]; } })));
        const ha = SX_.handle(-1.6, 0, { color: 'purple', label: 'a', labelPos: 'n', constrain: (x) => [M.clamp(x, -3.9, 3.9), 0] });
        const hb = SX_.handle(0.4, 0, { color: 'purple', label: 'b', labelPos: 'n', constrain: (x) => [M.clamp(x, -3.9, 3.9), 0] });
        const show = () => {
          const f = mode.value === 'fin';
          SA.el.style.display = SN.el.style.display = f ? '' : 'none'; SX_.el.style.display = SE.el.style.display = f ? 'none' : '';
          btn.hidden = res.hidden = !f; NN.el.hidden = f;
        };
        show();
        // wave function for the position view
        const psiF = (x) => Math.exp(-((x + 1.2) ** 2) / 0.8) + 0.75 * Math.exp(-((x - 1.3) ** 2) / 0.3) * Math.cos(0) ;
        const Z = M.integrate((x) => psiF(x) ** 2, -8, 8, 4000), dens = (x) => psiF(x) ** 2 / Z;
        const disc = (N, a, b) => { const dx = 8 / N; let s = 0, tot = 0; for (let i = 0; i < N; i++) { const x = -4 + (i + 0.5) * dx, p = dens(x) * dx; tot += p; if (x >= Math.min(a, b) && x <= Math.max(a, b)) s += p; } return s / tot; };
        let st = null;
        v.render(() => {
          if (mode.value === 'fin') {
            const lam = hs.map((h) => h.x);
            // group equal eigenvalues; rotate the basis inside each group by a seeded random unitary
            const groups = []; lam.map((l, k) => [l, k]).sort((p, q) => p[0] - q[0]).forEach(([l, k]) => { const g = groups.find((G) => Math.abs(G.l - l) < 1e-9); if (g) g.ks.push(k); else groups.push({ l, ks: [k] }); });
            const cU = cols(U0), r = v.rng(100 + rot);
            for (const g of groups) if (g.ks.length > 1) {
              const W = randUnitary(r, g.ks.length), old = g.ks.map((k) => cU[k]);
              g.vecs = W[0].map((_, j) => old.reduce((acc, vk, i) => acc.map((z, t) => cadd(z, cmul(W[i][j], vk[t]))), [[0, 0], [0, 0], [0, 0]]));
            } else g.vecs = [cU[g.ks[0]]];
            for (const g of groups) g.P = g.vecs.reduce((P, w) => madd(P, outer(w, w)), mat(3, 3, () => 0));
            const A = groups.reduce((S, g) => madd(S, mscale(g.P, g.l)), mat(3, 3, () => 0));
            const max = Math.max(1, maxAbs(A));
            const u = 1, yA = 0.2, cols3 = ['accent', 'orange', 'green'];
            let x = 0.2;
            cells(v, SA, A, [x, yA, x + 3 * u, yA + 3 * u], { max });
            SA.text('$A$', x + 1.5, yA + 3.35, { align: 'center', size: 15 });
            x += 3 * u + 0.25; SA.text('=', x + 0.25, yA + 1.5, { align: 'center', size: 22, color: 'muted' }); x += 0.55;
            groups.forEach((g, gi) => {
              if (gi > 0) { SA.text('+', x + 0.15, yA + 1.5, { align: 'center', size: 22, color: 'muted' }); x += 0.5; }
              const colr = cols3[g.ks[0]];
              SA.text(`$${v.fix(g.l, 2)}\\,\\times$`, x + 0.62, yA + 1.5, { align: 'center', size: 14, color: colr }); x += 1.35;
              cells(v, SA, g.P, [x, yA, x + 3 * u, yA + 3 * u], { max: 1 });
              SA.rect(x - 0.05, yA - 0.05, x + 3 * u + 0.05, yA + 3 * u + 0.05, { color: colr, width: 1.6, radius: 4 });
              SA.text(`$P_{${g.ks.map((k) => k + 1).join('')}}$ (rank ${g.ks.length})`, x + 1.5, yA + 3.35, { align: 'center', size: 13, color: colr });
              // the eigenvectors spanning it, as 3×1 columns under the projection
              g.vecs.forEach((w, j) => { const x0 = x + 1.5 - (g.vecs.length * 0.5) / 2 + j * 0.5 - 0.0, y1 = yA - 0.35; cells(v, SA, w.map((z) => [z]), [x0 + 0.04, y1 - 1.5 * 0.5 * 3 / 1.5, x0 + 0.46, y1], { max: 1, minR: 0.3 }); });
              x += 3 * u + 0.2;
            });
            SA.setView([0, Math.max(14.2, x + 0.1)], [-2.0, 3.85]);
            SA.text('eigenvectors', 0.2, -1.4, { size: 11, color: 'muted' });
            // number line
            SN.line(-2.5, 0, 2.5, 0, { color: 'muted', width: 1.2 });
            for (let t = -2; t <= 2; t++) { SN.line(t, -0.06, t, 0.06, { color: 'muted' }); SN.text(String(t).replace('-', '−'), t, -0.3, { align: 'center', size: 10.5, color: 'muted' }); }
            SN.text('spectrum of A — drag the eigenvalues', -2.5, 0.55, { size: 11, color: 'muted' });
            // checks
            const I3 = eye(3), sumP = groups.reduce((S, g) => madd(S, g.P), mat(3, 3, () => 0));
            let orth = 0; groups.forEach((g, i) => groups.forEach((h, j) => { if (i < j) orth = Math.max(orth, fnorm(mmul(g.P, h.P))); }));
            const E = heig(A), rec = fnorm(msub(groups.reduce((S, g) => madd(S, mscale(g.P, g.l)), mat(3, 3, () => 0)), A));
            const eA = expmC(M, A), eS = groups.reduce((S, g) => madd(S, mscale(g.P, Math.exp(g.l))), mat(3, 3, () => 0));
            st = { m: 'fin', groups, E, orth, comp: fnorm(msub(sumP, I3)), rec, fe: fnorm(msub(eA, eS)), idem: Math.max(...groups.map((g) => fnorm(msub(mmul(g.P, g.P), g.P)))) };
          } else {
            const N = NN.value, dx = 8 / N, a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
            const top = 0.75;
            SX_.vband(a, b, { color: 'purple', alpha: 0.1 });
            SX_.fn(dens, { color: 'ink', width: 1.6, domain: [-4, 4] });
            let tot = 0; const ps = []; for (let i = 0; i < N; i++) { const x = -4 + (i + 0.5) * dx; ps.push([x, dens(x) * dx]); tot += dens(x) * dx; }
            for (const [x, p] of ps) { const inn = x >= a && x <= b, h = p / tot / dx; SX_.line(x, 0, x, h, { color: inn ? 'purple' : 'accent', width: N > 200 ? 1 : 2, alpha: 0.8 }); if (N <= 64) SX_.dot(x, h, { r: 2.6, color: inn ? 'purple' : 'accent' }); }
            SX_.setView([-4, 4], [0, top]);
            const mu = disc(N, a, b), ex = M.integrate(dens, a, b, 2000);
            // convergence plot
            const Ns = []; for (let k = 2; k <= 10; k += 0.25) Ns.push(Math.round(2 ** k));
            const errs = Ns.map((n) => [n, Math.max(1e-7, Math.abs(disc(n, a, b) - ex))]);
            SE.path(errs, { color: 'purple', width: 1.8 }); SE.dots(errs, { r: 2.4, color: 'purple' });
            SE.fn((n) => 1 / n, { color: 'muted', dash: [4, 4], width: 1.2 }); SE.text('∝ 1/N', 600, 1 / 600, { dy: -10, size: 10.5, color: 'muted' });
            SE.dot(N, Math.max(1e-7, Math.abs(mu - ex)), { r: 5.5, color: 'gold' });
            st = { m: 'pos', N, a, b, mu, ex };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.m === 'fin') {
            const deg = st.groups.some((g) => g.ks.length > 1);
            return `Eigenvalues found by diagonalizing the rebuilt $A$: $${st.E.values.map((l) => v.fix(l, 4)).join(',\\ ')}$${deg ? ' (degenerate)' : ''}. ` +
              `$\\|A-\\sum\\lambda_kP_k\\| = ${v.sci(Math.max(st.rec, 1e-17), 1)}$, $\\max\\|P_jP_k\\|_{j\\ne k} = ${v.sci(Math.max(st.orth, 1e-17), 1)}$, $\\max\\|P_k^2-P_k\\| = ${v.sci(Math.max(st.idem, 1e-17), 1)}$, $\\|\\sum P_k - I\\| = ${v.sci(Math.max(st.comp, 1e-17), 1)}$. ` +
              `Functional calculus: $\\|e^{A}-\\sum e^{\\lambda_k}P_k\\| = ${v.sci(Math.max(st.fe, 1e-17), 1)}$ ($e^A$ by Padé).`;
          }
          return `$N = ${st.N}$ eigenvalues $x_i$ of $\\mathrm{diag}(x_i)$; $P_{[a,b]} = \\sum_{x_i\\in[a,b]}|x_i\\rangle\\langle x_i|$ on $[${v.fix(st.a, 2)}, ${v.fix(st.b, 2)}]$: $\\langle\\psi|P_{[a,b]}|\\psi\\rangle = ${v.fix(st.mu, 5)}$ vs $\\int_a^b|\\psi|^2dx = ${v.fix(st.ex, 5)}$ (error $${v.sci(Math.abs(st.mu - st.ex), 1)}$). As $N\\to\\infty$ the point masses fill into the continuous measure $|\\psi(x)|^2dx$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Postulate',
      name: 'Generalized Born rule',
      statement: String.raw`Let the observable $A$ have spectral decomposition $A=\sum_\lambda\lambda P_\lambda$ (5.5), and let the system be in the unit state $|\psi\rangle$. A measurement of $A$ yields the value $\lambda$ with probability
$$\Pr(\lambda)=\langle\psi|P_\lambda|\psi\rangle=\norm{P_\lambda\psi}^2,$$
which for a non-degenerate eigenvalue with unit eigenvector $|e_\lambda\rangle$ is $|\langle e_\lambda|\psi\rangle|^2$. These probabilities sum to 1, and the mean of the outcomes is $\sum_\lambda\lambda\Pr(\lambda)=\langle\psi|A|\psi\rangle$, with variance $(\Delta A)^2=\langle A^2\rangle-\langle A\rangle^2$. For continuous spectrum, $\Pr(A\in\Delta)=\langle\psi|E(\Delta)|\psi\rangle$; for position this is the original Born rule $\int_\Delta|\psi|^2$ (qm-2.2).`,
      idea: String.raw`The probabilities sum to one because $\sum P_\lambda=I$ and $\norm\psi=1$, and they are non-negative because $\langle\psi|P|\psi\rangle=\norm{P\psi}^2$. The mean is $\sum\lambda\langle\psi|P_\lambda|\psi\rangle=\langle\psi|\sum\lambda P_\lambda|\psi\rangle=\langle\psi|A|\psi\rangle$, so the expectation-value formula of qm-2.7 is a consequence. What the rule predicts is *frequencies*: by the law of large numbers the fraction of runs giving $\lambda$ converges to $\Pr(\lambda)$, and the running mean converges to $\langle A\rangle$ with fluctuations of size $\Delta A/\sqrt N$.`,
      caption: String.raw`A spin-1 particle is measured along a direction at angle $\alpha$ from $z$ (observable $A=\mathbf n\cdot\mathbf S$, outcomes $-1,0,+1$). Left: predicted probabilities $|\langle e_m|\psi\rangle|^2$ (bars, computed from the eigenvectors of $A$) and the observed frequencies in $N$ simulated measurements (gold); the strip above shows the first 60 outcomes. Right: the running mean of the outcomes against the number of measurements, converging inside the $\pm\Delta A/\sqrt n$ funnel to $\langle\psi|A|\psi\rangle$. **Raise $N$**, change the state or the axis, and press *new run* for fresh randomness.`,
      deps: ['qm-5.5', 'qm-2.2'],
      refs: ['Griffiths §3.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Born_rule' },
      tags: ['Born rule', 'measurement', 'probability'],
      viz(v) {
        const M = v.M, S1 = spinOps(1);
        const prep = v.select('state', [{ value: 'coh', label: 'spin pointing at 60° from $z$' }, { value: 'sup', label: '$(|{+}1\\rangle+i|0\\rangle-|{-}1\\rangle)/\\sqrt3$' }, { value: 'rnd', label: 'random' }], 'coh');
        const al = v.slider('axis angle $\\alpha$ from $z$', 0, Math.PI, 0.35, { step: 0.01 });
        const NS = v.slider('measurements $N$', 1, 20000, 500, { int: true, log: true });
        let seed = 1; v.button('new run', () => { seed++; });
        const SL = v.stage({ x: [-1.7, 1.7], y: [0, 1.25], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'outcome m', ylabel: 'probability', xticks: [[-1, '−1'], [0, '0'], [1, '+1']], title: 'predicted vs observed' });
        const SR = v.stage({ x: [1, 20000], y: [-1.1, 1.1], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: 'number of measurements n', ylabel: 'running mean', title: 'mean of the outcomes $\\to\\langle\\psi|A|\\psi\\rangle$' });
        let cache = null;
        const getState = () => {
          if (prep.value === 'coh') return spinCoherent(S1, [Math.sin(Math.PI / 3), 0, Math.cos(Math.PI / 3)]);
          if (prep.value === 'sup') return vnormalize([[1, 0], [0, 1], [-1, 0]]);
          return randState(v.rng(77), 3);
        };
        let st = null;
        v.render(() => {
          const psi = getState(), n = [Math.sin(al.value), 0, Math.cos(al.value)], A = spinAlong(S1, n), E = heig(A);
          const probs = E.vectors.map((e) => cabs2(ip(e, psi))), vals = E.values.map((l) => Math.round(l));
          const key = `${prep.value}|${al.value}|${seed}`;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 7919 + 1), out = new Int8Array(20000); for (let k = 0; k < 20000; k++) out[k] = vals[sampleIdx(r, probs)]; cache = { key, out }; }
          const N = NS.value, out = cache.out, cnt = { '-1': 0, 0: 0, 1: 0 };
          for (let k = 0; k < N; k++) cnt[out[k]]++;
          const mean = expect(A, psi)[0], var_ = expect(mmul(A, A), psi)[0] - mean * mean, sd = Math.sqrt(Math.max(0, var_));
          // bars
          vals.forEach((m, k) => {
            SL.rect(m - 0.36, 0, m + 0.04, probs[k], { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 1.2 });
            const f = cnt[m] / N; SL.rect(m + 0.04, 0, m + 0.36, f, { fill: 'gold', fillAlpha: 0.6, color: 'gold', width: 1.2 });
            SL.text(v.fix(probs[k], 3), m - 0.16, probs[k], { align: 'center', baseline: 'bottom', dy: -2, size: 10.5, color: 'accent' });
            SL.text(v.fix(f, 3), m + 0.2, f, { align: 'center', baseline: 'bottom', dy: -14, size: 10.5, color: 'gold' });
          });
          // first outcomes strip
          const K = Math.min(60, N), Q = v.quantum();
          for (let k = 0; k < K; k++) { const x = -1.62 + (3.24 * (k + 0.5)) / 60, m = out[k]; SL.dot(x, 1.17, { r: 3, color: m === 1 ? 'accent' : m === 0 ? 'purple' : 'orange' }); }
          SL.text(`first ${K} outcomes:`, -1.62, 1.08, { size: 10, color: 'muted' }); SL.text('+1', -0.55, 1.08, { size: 10, color: 'accent' }); SL.text('0', -0.3, 1.08, { size: 10, color: 'purple' }); SL.text('−1', -0.12, 1.08, { size: 10, color: 'orange' });
          // running mean, log-spaced samples
          SR.between((x) => mean + sd / Math.sqrt(x), (x) => mean - sd / Math.sqrt(x), 1, 20000, { fill: 'accent', fillAlpha: 0.12 });
          SR.hline(mean, { color: 'accent', width: 1.6 });
          const pts = []; let s = 0, nxt = 1;
          for (let k = 0; k < N; k++) { s += out[k]; if (k + 1 >= nxt || k === N - 1) { pts.push([k + 1, s / (k + 1)]); nxt = Math.max(nxt + 1, Math.floor(nxt * 1.03)); } }
          SR.path(pts, { color: 'gold', width: 1.8 }); SR.dot(N, s / N, { r: 5, color: 'gold' });
          SR.text('⟨ψ|A|ψ⟩', 1.2, mean, { dy: -11, size: 11, color: 'accent' });
          st = { probs, vals, cnt, N, mean, sd, avg: s / N };
        });
        v.legend([['accent', 'Born rule $|\\langle e_m|\\psi\\rangle|^2$', { area: true }], ['gold', 'simulated frequencies / running mean', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { probs, vals, cnt, N } = st, z = (st.avg - st.mean) / (st.sd / Math.sqrt(N) || 1);
          return `Born rule: ${vals.map((m, k) => `$P(${m > 0 ? '+' : ''}${m}) = ${v.fix(probs[k], 4)}$`).join(', ')} (sum $${v.fix(probs.reduce((a, b) => a + b, 0), 6)}$). Observed in $N = ${N}$: ${vals.map((m) => `${cnt[m]}`).join(' / ')}.\n` +
            `Mean of outcomes $= ${v.fix(st.avg, 4)}$ vs $\\langle\\psi|A|\\psi\\rangle = ${v.fix(st.mean, 4)}$, $\\Delta A = ${v.fix(st.sd, 4)}$: deviation $= ${v.fix(z, 2)}$ standard errors.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Postulate',
      name: 'Projection postulate',
      statement: String.raw`If a measurement of the observable $A=\sum\lambda P_\lambda$ on the state $|\psi\rangle$ gives the result $\lambda$, then immediately afterwards the system is in the state
$$|\psi'\rangle=\frac{P_\lambda|\psi\rangle}{\norm{P_\lambda\psi}}\qquad\text{(Lüders' rule; von Neumann's for non-degenerate }\lambda).$$
Hence an immediate repetition of the same measurement gives $\lambda$ again with certainty. If the result is not recorded, the ensemble is described by the **density operator** $\rho'=\sum_\lambda P_\lambda\rho P_\lambda$: the off-diagonal elements (coherences) in the eigenbasis of $A$ are erased, and a superposition becomes a **mixture**, which gives different statistics for incompatible measurements.`,
      scope: String.raw`An idealization of a *non-demolition*, first-kind measurement; many real detectors destroy or disturb the system differently (described by POVMs and quantum instruments). Whether the "collapse" is a physical process or an update of information is the measurement problem (qm ch. 14).`,
      idea: String.raw`$P_\lambda$ is an orthogonal projection (fa-12.14), so $P_\lambda^2=P_\lambda$ and the new state lies in the eigenspace: by the Born rule (5.6) the repeat gives $\lambda$ with probability $\langle\psi'|P_\lambda|\psi'\rangle=1$. Averaging the post-measurement states over the outcomes, weighted by their probabilities, gives $\sum_\lambda P_\lambda|\psi\rangle\langle\psi|P_\lambda$. For a qubit the density operator is $\rho=\tfrac12(I+\mathbf r\cdot\boldsymbol\sigma)$ with $|\mathbf r|\le1$: a pure state has $|\mathbf r|=1$, and measuring $Z$ without looking projects $\mathbf r$ onto the $z$-axis — the equal superposition $|{+}\rangle$ ($\mathbf r=\hat x$) becomes the maximally mixed $\rho=I/2$ ($\mathbf r=0$), after which $X$ gives $\pm$ at random instead of always $+$.`,
      caption: String.raw`An ensemble of 500 qubits, each prepared in $|\psi_0\rangle$, goes through the sequence of operations listed in the table (columns). **Build your own sequence** with the buttons: measure $Z$, $X$, or along $\hat n$ (angle set by the slider), or *wait* (a $90^\circ$ precession about $z$). Left: each member's post-measurement state on the Bloch sphere (dot size ∝ number of members) and the ensemble's average Bloch vector $\mathbf r$ (purple) — the density operator; it shrinks inside the sphere when the coherences are destroyed. Right: the outcomes of the first 16 members, step by step — rows stay constant under repeated identical measurements and scramble after an incompatible one.`,
      deps: ['qm-5.6', 'fa-12.14', 'qm-1.14'],
      see: ['qm-14.3'],
      refs: ['Sakurai ch. 1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_function_collapse' },
      tags: ['measurement', 'collapse', 'density operator'],
      viz(v) {
        const M = v.M, K = 500, ROWS = 16, MAX = 8;
        let seq = ['X', 'Z', 'Z', 'X'];
        const th0 = v.slider('$|\\psi_0\\rangle$ at angle', 0, Math.PI, Math.PI / 2, { step: 0.01 });
        const bet = v.slider('$\\hat n$ at angle', 0, Math.PI, Math.PI / 4, { step: 0.01 });
        const push = (op) => { if (seq.length < MAX) seq = [...seq, op]; };
        v.button('measure Z', () => push('Z')); v.button('measure X', () => push('X')); v.button('measure n̂', () => push('n')); v.button('wait', () => push('W'));
        v.button('undo', () => { seq = seq.slice(0, -1); }); v.button('clear', () => { seq = []; });
        const SB = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 350, weight: 1, title: 'ensemble on the Bloch sphere' });
        const ST = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 350, weight: 1.15, title: 'outcomes, member by member' });
        const sc = v.scene3(SB, { axes: false, yaw: -0.5, pitch: 0.28 });
        let st = null;
        v.render(() => {
          const r0 = [Math.sin(th0.value), 0, Math.cos(th0.value)], nAx = [Math.sin(bet.value), 0, Math.cos(bet.value)];
          const axes = { Z: [0, 0, 1], X: [1, 0, 0], n: nAx };
          let R = Array.from({ length: K }, () => r0.slice());
          const rng = v.rng(4242), hist = [], stats = [];
          seq.forEach((op, k) => {
            if (op === 'W') { R = R.map((r) => rotate3(r, [0, 0, 1], Math.PI / 2)); hist.push(null); stats.push({ op }); return; }
            const m = axes[op], out = new Int8Array(K);
            let plus = 0;
            R = R.map((r, i) => { const p = (1 + M.dot(r, m)) / 2, s = rng() < p ? 1 : -1; out[i] = s; if (s > 0) plus++; return m.map((c) => c * s); });
            // same-basis repeat check against the previous measurement (only if no wait between and the same axis)
            let prev = null; for (let j = k - 1; j >= 0; j--) { if (seq[j] === 'W') { prev = 'w'; break; } prev = j; break; }
            let rep = null; if (typeof prev === 'number' && seq[prev] === op) { rep = 0; for (let i = 0; i < K; i++) if (hist[prev][i] === out[i]) rep++; }
            hist.push(out); stats.push({ op, plus, rep });
          });
          const rbar = [0, 1, 2].map((c) => R.reduce((s, r) => s + r[c], 0) / K);
          // Bloch sphere with clusters
          sc.begin(); sphereOutline(SB, sc); blochFrame(sc);
          sc.arrow([0, 0, 0], r0, { color: 'muted', width: 1.4, alpha: 0.6 });
          const cl = new Map(); for (const r of R) { const k = r.map((c) => c.toFixed(3)).join(','); cl.set(k, (cl.get(k) || { r, n: 0 })); cl.get(k).n++; }
          for (const { r, n } of cl.values()) { const rad = 3 + 9 * Math.sqrt(n / K); sc.dot(r, { r: rad, color: 'gold' }); const P = sc.P(r); SB.text(String(n), P[0], P[1], { size: 11, align: 'center', color: 'ink', dy: -rad - 9, plate: true }); }
          const len = Math.hypot(...rbar);
          if (len > 0.02) sc.arrow([0, 0, 0], rbar, { color: 'purple', width: 3 }); else sc.dot([0, 0, 0], { r: 4, color: 'purple' });
          sc.flush();
          // table
          const nc = Math.max(1, seq.length), cw = Math.min(1.25, 8.4 / nc), x0 = 1.4, y1 = 9.3, rh = 0.47;
                    for (let i = 0; i < ROWS; i++) ST.text(`#${i + 1}`, x0 - 0.2, y1 - (i + 0.5) * rh, { size: 9.5, color: 'muted', align: 'right' });
          if (!seq.length) ST.text('add operations with the buttons below', 5, 5, { align: 'center', color: 'muted' });
          seq.forEach((op, k) => {
            const x = x0 + k * cw, lab = op === 'W' ? 'wait' : op === 'n' ? 'n̂' : op;
            ST.text(lab, x + cw / 2, y1 + 0.35, { size: 12, align: 'center', color: op === 'W' ? 'muted' : 'ink', weight: 700 });
            for (let i = 0; i < ROWS; i++) {
              const Y = y1 - (i + 1) * rh;
              if (op === 'W') { ST.rect(x + 0.06, Y + 0.05, x + cw - 0.06, Y + rh - 0.05, { fill: 'grid', fillAlpha: 0.2, stroke: false, radius: 2 }); continue; }
              const s = hist[k][i];
              ST.rect(x + 0.06, Y + 0.05, x + cw - 0.06, Y + rh - 0.05, { fill: s > 0 ? 'accent' : 'orange', fillAlpha: 0.5, stroke: false, radius: 2 });
              ST.text(s > 0 ? '+' : '−', x + cw / 2, Y + rh / 2, { size: 10, align: 'center' });
            }
            const s = stats[k], yb = y1 - ROWS * rh - 0.5;
            if (op !== 'W') {
              ST.text(`${Math.round((100 * s.plus) / K)}%+`, x + cw / 2, yb, { size: 9.5, align: 'center', color: 'muted' });
              if (s.rep != null) ST.text(`${s.rep === K ? '100' : v.fix((100 * s.rep) / K, 0)}%`, x + cw / 2, yb - 0.75, { size: 9.5, align: 'center', color: s.rep === K ? 'green' : 'red' });
            }
          });
          ST.text('fraction +', x0 - 0.2, y1 - ROWS * rh - 0.5, { size: 9.5, color: 'muted', align: 'right' });
          ST.text('repeats', x0 - 0.2, y1 - ROWS * rh - 1.25, { size: 9.5, color: 'muted', align: 'right' });
          st = { rbar, len, stats, r0 };
        });
        v.legend([['gold', 'post-measurement states', { dot: true }], ['purple', 'average Bloch vector $\\mathbf r$ (density operator)'], ['muted', 'initial state']]);
        v.readout(() => {
          if (!st) return '';
          const r = st.rbar, rho = [[[(1 + r[2]) / 2, 0], [r[0] / 2, -r[1] / 2]], [[r[0] / 2, r[1] / 2], [(1 - r[2]) / 2, 0]]];
          const rho0 = [[[(1 + st.r0[2]) / 2, 0], [st.r0[0] / 2, 0]], [[st.r0[0] / 2, 0], [(1 - st.r0[2]) / 2, 0]]];
          const pur = (1 + st.len * st.len) / 2;
          const reps = st.stats.filter((s) => s.rep != null);
          return `Initial pure state $\\rho_0 = ${texMat(v, rho0, 2)}$ → after the sequence $\\rho = \\tfrac12(I+\\mathbf r\\cdot\\boldsymbol\\sigma) = ${texMat(v, rho, 2)}$, $|\\mathbf r| = ${v.fix(st.len, 3)}$, purity $\\mathrm{Tr}\\,\\rho^2 = ${v.fix(pur, 3)}$ ${pur > 0.995 ? '(pure)' : '(**mixture**)'}.\n` +
            (reps.length ? `Immediate repeats of the same measurement: ${reps.map((s) => `${s.rep}/${K}`).join(', ')} members got the same result again.` : 'Measure the same observable twice in a row to see the repeat give the same result with certainty.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Definition',
      name: 'Position and momentum eigenstates',
      statement: String.raw`The position and momentum operators on $L^2(\R)$ have no eigenvectors, but they have **generalized eigenfunctions**:
$$\hat x\,\delta_{x_0}=x_0\,\delta_{x_0},\qquad \hat p\,u_{p_0}=p_0\,u_{p_0},\quad u_{p_0}(x)=\frac{e^{ip_0x/\hbar}}{\sqrt{2\pi\hbar}},$$
written $|x_0\rangle$ and $|p_0\rangle$. They are not square-integrable but pair with smooth, rapidly decaying wave functions $f$: $\langle x_0|f\rangle=f(x_0)$ and $\langle p_0|f\rangle=\hat f(p_0)$, the momentum-space wave function. They are **delta-normalized**, $\langle x|x'\rangle=\delta(x-x')$, $\langle p|p'\rangle=\delta(p-p')$, complete, $\int|x\rangle\langle x|\,dx=I=\int|p\rangle\langle p|\,dp$, and related by $\langle x|p\rangle=u_p(x)$. Rigorously they are tempered distributions (a rigged-Hilbert-space or spectral-measure description, 5.5).`,
      idea: String.raw`Approximate them by honest wave functions: a Gaussian of width $\varepsilon$ with unit integral tends to $\delta_{x_0}$, and a plane wave cut off by a Gaussian window of width $L$ tends to $u_{p_0}$. Their $L^2$ norms blow up ($\propto\varepsilon^{-1/2}$ and $L^{1/2}$), so the limits leave the Hilbert space; but their pairings with a fixed smooth $f$ converge, to $f(x_0)$ and $\hat f(p_0)$ — which is exactly the sense of convergence for tempered distributions (fa-7.11). The Fourier transform exchanges the two pictures: the narrower the spike in $x$, the flatter its momentum profile, and vice versa.`,
      caption: String.raw`**Narrow → δ:** a unit-area Gaussian of width $\varepsilon$ at $x_0$ (drag the handle; the profile above it may run off the top), with its momentum-space wave function computed by FFT (right, colour = phase): it flattens toward the constant modulus $1/\sqrt{2\pi}$ with a phase winding $e^{-ipx_0}$. **Widen → plane wave:** $e^{ip_0x}/\sqrt{2\pi}$ times a Gaussian window of width $L$; its momentum profile narrows to a spike at $p_0$. **Slide the width** toward the limit: the readout shows the norm diverging while the pairing with the fixed smooth test function $f$ (grey) converges.`,
      deps: ['qm-5.5', 'fa-7.11', 'qm-2.10'],
      refs: ['Griffiths §3.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Position_and_momentum_spaces' },
      tags: ['position eigenstates', 'plane waves', 'distributions'],
      viz(v) {
        const M = v.M, n = 8192, x = Float64Array.from({ length: n }, (_, i) => -40 + (80 * i) / n), dx = 80 / n;
        const mode = v.select('limit', [{ value: 'x', label: 'narrow → $|x_0\\rangle=\\delta_{x_0}$' }, { value: 'p', label: 'widen → $|p_0\\rangle\\propto e^{ip_0x}$' }], 'x', { onChange: (m) => { hx.visible = m === 'x'; hp.visible = m === 'p'; } });
        const w = v.slider('width $\\varepsilon$ or $1/L$', 0.03, 2, 0.35, { log: true });
        const SXs = v.stage({ x: [-6, 6], y: [-1.6, 3.2], axes: 'box', gutter: true, height: 320, xlabel: 'x', title: 'position space' });
        const SPs = v.stage({ x: [-8, 8], y: [0, 1.6], axes: 'box', gutter: true, height: 320, xlabel: 'p', title: 'momentum space: $|\\tilde\\psi(p)|$, colour = phase' });
        const hx = SXs.handle(0.8, 0, { color: 'accent', label: '$x_0$', labelPos: 's', constrain: (X) => [M.clamp(X, -4.5, 4.5), 0] });
        const hp = SPs.handle(2, 0, { color: 'accent', label: '$p_0$', labelPos: 'e', constrain: (X) => [M.clamp(X, -6, 6), 0] });
        hp.visible = false;
        const f = (X) => Math.exp(-((X - 0.4) ** 2) / 2) * (1 + 0.5 * Math.sin(1.7 * X));
        // f̂(p) by quadrature on the grid (a fixed smooth function)
        const fhat = (p) => { let a = 0, b = 0; for (let i = 0; i < n; i += 2) { const fx = f(x[i]); a += fx * Math.cos(p * x[i]); b -= fx * Math.sin(p * x[i]); } return [(a * 2 * dx) / Math.sqrt(TAU), (b * 2 * dx) / Math.sqrt(TAU)]; };
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), re = new Float64Array(n), im = new Float64Array(n);
          if (mode.value === 'x') {
            const e = w.value, x0 = hx.x, A = 1 / (e * Math.sqrt(TAU));
            for (let i = 0; i < n; i++) re[i] = A * Math.exp(-((x[i] - x0) ** 2) / (2 * e * e));
          } else {
            const L = 1 / w.value, p0 = hp.x, A = 1 / Math.sqrt(TAU);
            for (let i = 0; i < n; i++) { const g = A * Math.exp(-(x[i] ** 2) / (2 * L * L)); re[i] = g * Math.cos(p0 * x[i]); im[i] = g * Math.sin(p0 * x[i]); }
          }
          // pairing ⟨u|f⟩ = ∫ conj(u) f, norm ∫|u|²
          let pr = 0, pi = 0, nn = 0; for (let i = 0; i < n; i++) { const fx = f(x[i]); pr += re[i] * fx; pi -= im[i] * fx; nn += re[i] * re[i] + im[i] * im[i]; }
          pr *= dx; pi *= dx; nn *= dx;
          const P = toMomentum(M, x, re, im);
          // draw x-space
          SXs.setView([-6, 6], mode.value === 'x' ? [-0.3, 3.2] : [-0.6, 1.6]);
          SXs.fn(f, { color: 'muted', width: 1.6, dash: [5, 4] });
          SXs.text('f', 1.45, f(1.45), { dx: 10, color: 'muted', math: true, size: 15 });
          if (mode.value === 'x') {
            drawReal(SXs, x, re, { col, alpha: 0.55 });
            const peak = 1 / (w.value * Math.sqrt(TAU)); if (peak > 3.2) SXs.text(`peak height ${v.fix(peak, 1)} ↑`, hx.x, 3.0, { dx: 8, size: 11, color: 'accent' });
          } else drawPsi(SXs, x, re, im, { col, mode: 'abs', outline: 'ink' }), SXs.fn((X) => Math.exp(-(X ** 2) / (2 / w.value ** 2)) / Math.sqrt(TAU) * Math.cos(hp.x * X), { color: 'accent', width: 1, alpha: 0.6 });
          // p-space
          const sel = []; for (let i = 0; i < n; i++) if (P.p[i] > -8.5 && P.p[i] < 8.5) sel.push(i);
          const pp = Float64Array.from(sel, (i) => P.p[i]), prr = Float64Array.from(sel, (i) => P.re[i]), pii = Float64Array.from(sel, (i) => P.im[i]);
          let pmax = 0; for (let k = 0; k < pp.length; k++) pmax = Math.max(pmax, Math.hypot(prr[k], pii[k]));
          const top = mode.value === 'x' ? 0.7 : Math.max(0.7, Math.min(pmax * 1.12, 40));
          SPs.setView([-8, 8], [0, top]);
          drawPsi(SPs, pp, prr, pii, { col, mode: 'abs' });
          if (mode.value === 'x') { SPs.hline(1 / Math.sqrt(TAU), { color: 'green', dash: [5, 4], width: 1.3 }); SPs.text('1/√(2π)', 7.8, 1 / Math.sqrt(TAU), { align: 'right', dy: -10, size: 11, color: 'green' }); }
          phaseWheel(SPs, col, SPs.W - 40, 58, 13);
          const target = mode.value === 'x' ? [f(hx.x), 0] : fhat(hp.x);
          st = { m: mode.value, pair: [pr, pi], nn, target, wv: w.value };
        });
        v.readout(() => {
          if (!st) return '';
          const err = Math.hypot(st.pair[0] - st.target[0], st.pair[1] - st.target[1]);
          return st.m === 'x'
            ? `$\\varepsilon = ${v.fix(st.wv, 3)}$: $\\|\\delta_\\varepsilon\\|^2 = ${v.fix(st.nn, 2)}$ $(=1/2\\varepsilon\\sqrt\\pi\\to\\infty)$ — not normalizable in the limit; but $\\langle\\delta_\\varepsilon|f\\rangle = ${v.fix(st.pair[0], 5)}\\to f(x_0) = ${v.fix(st.target[0], 5)}$ (difference $${v.sci(err, 1)}$).`
            : `$L = ${v.fix(1 / st.wv, 2)}$: $\\|u_L\\|^2 = ${v.fix(st.nn, 2)}$ $(=L/2\\sqrt\\pi\\to\\infty)$; but $\\langle u_L|f\\rangle = ${texC(v, st.pair, 4)}\\to\\tilde f(p_0) = ${texC(v, st.target, 4)}$ (difference $${v.sci(err, 1)}$).`;
        });
      },
    },
  ],
};
