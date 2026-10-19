// Quantum Information & Computation — Chapter 4: Circuits and universality (part b: items 4.5–4.9)
import {
  TAU, R2, cmul, cabs2, normalize, applyOne, applyCX, outerV, ptrace, blochRho, cplx, GATE, zeroState, H2,
  qapply, qangleAxis, qrot, qdist, qmul, buildNet, solovayKitaev, GL, Tableau,
} from './ch04.shared.js';

const fix = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

export default {
  collection: 'qinfo',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Solovay–Kitaev theorem',
      statement: String.raw`Let $\mathcal G\subset SU(2)$ be a finite set that contains its own inverses and generates a dense subgroup. Then there is a constant $c$ such that for every $U\in SU(2)$ and every $\varepsilon>0$ some word of length $O(\log^{c}(1/\varepsilon))$ in the elements of $\mathcal G$ approximates $U$ within $\varepsilon$ in operator norm, and such a word can be found by a classical algorithm in time $O(\log^{c'}(1/\varepsilon))$. The standard construction gives $c\approx3.97$ and $c'\approx2.71$ for a compressed sequence representation; explicitly emitting every gate takes time proportional to the output length. Consequently a circuit of $m$ gates from a universal set is simulated to accuracy $\delta$ using $O(m\log^{c}(m/\delta))$ gates of any other such universal set: the choice of gate set changes the cost only polylogarithmically.`,
      idea: String.raw`Start from a coarse net: every $U$ is within $\varepsilon_0$ of some short word $U_0$. Then $\Delta=UU_0^\dagger$ is a rotation by a small angle, and any small rotation is a *group commutator* $\Delta=VWV^\dagger W^\dagger$ of two rotations $V,W$ of size only about $\sqrt{\|\Delta\|}$. Approximate $V$ and $W$ recursively (by words $\tilde V,\tilde W$ at the previous level) and set $U_1=\tilde V\tilde W\tilde V^\dagger\tilde W^\dagger U_0$. The commutator is quadratic in its factors, so errors of size $\varepsilon$ in $V,W$ move the commutator only by $O(\varepsilon\sqrt{\|\Delta\|})$: $\varepsilon_{n+1}\le c\,\varepsilon_n^{3/2}$. The error therefore falls doubly exponentially in the depth $n$, while the word length grows only like $5^n$.`,
      caption: String.raw`The base net is all reduced words in $H,T,T^\dagger$ up to length $L_0$. Choose a target rotation (random or by sliders) and a recursion depth. Left: length against error for $n=0,1,2,\dots$ on log–log axes, with the error falling much faster than any power of the length would suggest at first. Right: $\varepsilon_{n+1}$ against $\varepsilon_n$ with the curve $c\,\varepsilon^{3/2}$ through the worst ratio. Make the net too coarse (small $L_0$) and the recursion no longer improves: the hypothesis "$\varepsilon_0$ small enough" matters.`,
      deps: ['qinfo-4.4', 'ladr-7.87'],
      refs: ['Dawson–Nielsen,quant-ph/0505030 §§2–4,complete theorem and recursion analysis'],
      tags: ['Solovay–Kitaev', 'gate synthesis', 'group commutator'],
      scope: String.raw`The theorem needs an initial net finer than a universal constant and a gate set closed under inverses. The displayed error is the Euclidean distance of unit quaternions minimized over their global sign, i.e. the SU(2) operator-norm distance minimized over $U\mapsto-U$. The demonstration compiles up to global phase. The fitted curve is only a posteriori evidence for this target, not a proven uniform error constant.`,
      credit: 'Solovay–Kitaev theorem; explicit compiler analysis by Dawson and Nielsen',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solovay%E2%80%93Kitaev_theorem', arxiv: 'https://arxiv.org/abs/quant-ph/0505030' },
      viz(v) {
        const A = v.stage({ x: [1, 1e5], y: [1e-6, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'word length $\\ell$', ylabel: 'error $\\varepsilon_n$', title: 'length against error' });
        const B = v.stage({ x: [1e-6, 1], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, xlabel: '$\\varepsilon_n$', ylabel: '$\\varepsilon_{n+1}$', title: 'one recursion step' });
        const L0 = v.slider('base net: words up to length $L_0$', 3, 12, 10, { int: true });
        const depth = v.slider('depth $n$', 0, 4, 3, { int: true });
        const ang = v.slider('rotation angle', 0.2, 3.1, 1.3, { step: 0.01 });
        const pol = v.slider('axis: polar angle', 0, Math.PI, 1.0, { step: 0.01 });
        const azi = v.slider('axis: azimuth', 0, TAU, 2.0, { step: 0.01 });
        let cache = null, cur;
        v.button('Random target', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); ang.set(0.3 + 2.7 * r()); pol.set(Math.acos(1 - 2 * r())); azi.set(TAU * r()); });
        v.render(() => {
          const key = `${L0.value}|${ang.value}|${pol.value}|${azi.value}`;
          if (!cache || cache.key !== key) {
            const net = buildNet(L0.value), U = qrot([Math.sin(pol.value) * Math.cos(azi.value), Math.sin(pol.value) * Math.sin(azi.value), Math.cos(pol.value)], ang.value);
            cache = { key, net, tr: solovayKitaev(net, U, 4) };
          }
          const tr = cache.tr, up = tr.slice(0, depth.value + 1);
          const lo=Math.max(Number.MIN_VALUE,(tr.some(r=>r.err>0)?Math.min(...tr.filter(r=>r.err>0).map(r=>r.err)):1e-6)*.5);
          A.setView([1,Math.max(10,...tr.map(r=>r.len))*1.3],[lo,3]);
          B.setView([lo,1],[Math.max(Number.MIN_VALUE,lo*.01),3]);
          A.path(tr.filter(r=>r.err>0).map((r) => [Math.max(r.len, 1),r.err]), { color: 'faint', width: 1.2, dash: true });
          A.path(up.filter(r=>r.err>0).map((r) => [Math.max(r.len, 1),r.err]), { color: 'accent', width: 2.2 });
          tr.forEach((r, i) => r.err>0 && A.dot(Math.max(r.len, 1),r.err, { color: i <= depth.value ? 'accent' : 'muted', r: i === depth.value ? 6.5 : 4, label: `n=${i}`, labelPos:i===tr.length-1?'nw':'ne' }));
          let cmax = 0; for (let i = 0; i + 1 < tr.length; i++) if (tr[i].err > 1e-9) cmax = Math.max(cmax, tr[i + 1].err / tr[i].err ** 1.5);
          const xs = [...Array(61).keys()].map(k=>lo*(1/lo)**(k/60));
          B.path(xs.map((x) => [x, cmax*x**1.5]), { color: 'green', width: 1.6, dash: true });
          B.line(lo,lo,1,1, { color: 'muted', width: 1, dash: true });
          for (let i = 0; i + 1 < tr.length; i++) if(tr[i].err>0&&tr[i+1].err>0)B.dot(tr[i].err,tr[i+1].err, { color: 'orange', r: 4.5, label: `${i}→${i + 1}`, labelPos: 'nw' });
          cur = { tr, cmax, n: depth.value, net: cache.net.length };
        });
        v.legend([['accent', 'error against word length'], ['green', 'curve $c\\,\\varepsilon^{3/2}$', { dash: true }], ['orange', 'consecutive levels']]);
        v.readout(() => {
          const r = cur.tr[cur.n], r0 = cur.tr[0], grow = cur.n ? cur.tr[cur.n].len / Math.max(1, cur.tr[cur.n - 1].len) : 0;
          const improving = cur.tr.every((x, i) => i === 0 || x.err <= cur.tr[i - 1].err * 1.0001);
          return `net of ${cur.net} distinct rotations, base error $\\varepsilon_0=${fix(v, r0.err, 4)}$ with ${r0.len} letters\ndepth ${cur.n}: error $${v.sci(r.err, 2)}$ with a word of ${r.len} letters${grow ? ` (${fix(v, grow, 1)}× the previous level; without cancellations it would be 5×)` : ''}; fitted $c\\approx${fix(v, cur.cmax, 2)}$ in $\\varepsilon_{n+1}\\le c\\,\\varepsilon_n^{3/2}$\n${improving ? 'The error decreases at every level.' : 'This target does not improve at every level; the theorem requires a sufficiently fine uniform base net.'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Gottesman–Knill theorem',
      statement: String.raw`Any quantum circuit made of Hadamard, phase ($S$) and CNOT gates, with preparation of computational-basis states and measurements in the computational basis, can be simulated on a classical computer in polynomial time: the state is the common $+1$ eigenstate of $n$ commuting Pauli generators, and each Clifford gate or measurement updates a $2n\times(2n+1)$ binary tableau in $O(n)$ (gate) or $O(n^2)$ (measurement) time. Such a state is stored with $O(n^2)$ bits, while the state vector needs $2^n$ amplitudes. Adding a non-Clifford gate takes a circuit outside this stabilizer-only theorem; some such circuits remain easy to simulate.`,
      idea: String.raw`A stabilizer state $|\psi\rangle$ is fixed by $n$ independent commuting Pauli operators $g_1,\dots,g_n$, and these determine it completely. If $U$ is Clifford, $U|\psi\rangle$ is stabilized by $Ug_iU^\dagger$, which are again Pauli strings (qinfo-4.3), so a gate is just a rewrite of $n$ short bit-strings (Heisenberg picture); a $Z$ measurement either leaves the outcome fixed (if $\pm Z_a$ is in the stabilizer group) or gives a fair coin and replaces one generator. The tableau adds $n$ destabilizer rows so that measurement can be done in time $O(n^2)$ (Aaronson–Gottesman). The theorem does not say that entanglement is classically cheap in general: GHZ states are entangled, but a generic circuit with $T$ gates is believed to be hard to simulate.`,
      caption: String.raw`A random Clifford circuit (gates drawn from $H,S,\mathrm{CNOT}$ on $n$ qubits) is simulated two ways: the exact state vector (pale bars) and the stabilizer tableau, sampled by many measurement runs (gold ticks). They agree up to sampling noise, and the stabilizer list shows the $n$ generators. Right: bits stored by each method as $n$ grows. Insert a $T$ gate with the slider and the tableau route is no longer valid.`,
      deps: ['qinfo-4.3'],
      refs: ['Gottesman quant-ph/9807006 §§5,7–8; Aaronson–Gottesman quant-ph/0406196 §III'],
      tags: ['stabilizer', 'classical simulation', 'Clifford group'],
      scope: String.raw`Clifford circuits on computational-basis inputs with $Z$ measurements (and classical control). The state vector is shown only for $n\le 6$; the tableau method itself handles thousands of qubits.`,
      credit: 'D. Gottesman, “The Heisenberg representation of quantum computers”, Group22 (Hobart, 1998), arXiv:quant-ph/9807006; improved tableau algorithm: S. Aaronson and D. Gottesman, Phys. Rev. A 70, 052328 (2004)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gottesman%E2%80%93Knill_theorem', arxiv: 'https://arxiv.org/abs/quant-ph/9807006' },
      viz(v) {
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.5, title: 'outcome probabilities: exact vector (bars) against tableau samples (ticks)' });
        const Mm = v.stage({ x: [1, 60], y: [.8, 1e20], ylog: true, axes: 'box', gutter: true, height: 300, weight: 1, xlabel: 'qubits $n$', ylabel: 'bytes stored', title: 'memory' });
        const nq = v.slider('qubits $n$', 2, 6, 4, { int: true });
        const depth = v.slider('Clifford gates', 2, 40, 18, { int: true });
        const nT = v.slider('extra $T$ gates', 0, 3, 0, { int: true });
        const shots = v.slider('tableau samples', 200, 5000, 2000, { log: true, int: true });
        let seed = 5; v.button('New circuit', () => { seed++; });
        let cur;
        v.render(() => {
          const n = nq.value, N = 1 << n, r = v.rng(seed * 101 + n), gates = [];
          for (let i = 0; i < depth.value; i++) { const t = r.int(0, 3), a = r.int(0, n - 1); let b = r.int(0, n - 1); if (b === a) b = (a + 1) % n; gates.push(t === 0 ? ['h', a] : t === 1 ? ['s', a] : ['cx', a, b]); }
          for (let k = 0; k < nT.value; k++) gates.splice(r.int(0, gates.length), 0, ['t', r.int(0, n - 1)]);
          let psi = zeroState(N); const tab = new Tableau(n);
          for (const g of gates) {
            if (g[0] === 'cx') { psi = applyCX(psi, g[1], g[2], n); tab.cx(g[1], g[2]); } else { psi = applyOne(psi, GATE[g[0] === 'h' ? 'H' : g[0] === 's' ? 'S' : 'T'](), g[1], n); if (g[0] === 'h') tab.h(g[1]); else if (g[0] === 's') tab.s(g[1]); }
          }
          const pr = psi.map(cabs2), ok = nT.value === 0, rr = v.rng(seed * 7 + 1), cnt = new Array(N).fill(0);
          if (ok) for (let sh = 0; sh < shots.value; sh++) { const t = tab.clone(); let idx = 0; for (let a = 0; a < n; a++) idx = (idx << 1) | t.measure(a, () => (rr() < 0.5 ? 0 : 1)).bit; cnt[idx]++; }
          const fr = cnt.map((c) => c / shots.value);
          // bars
          const cx = P.ctx, W = P.W, H = P.H, left = 44, right = 14, top = 48, bottom = N > 8 ? 40 : 28, bw = (W - left - right) / N, base = H - bottom, ph = base - top, mx = Math.max(...pr, ...(ok ? fr : [0]), 0.05) * 1.1;
          cx.save(); cx.font = '500 10.5px Inter, system-ui'; cx.textAlign = 'right'; cx.textBaseline = 'middle'; cx.fillStyle = v.color('muted');
          for (const f of [0, 0.5, 1]) { const y = base - f * ph; cx.strokeStyle = v.color(f ? 'grid' : 'faint'); cx.beginPath(); cx.moveTo(left, y); cx.lineTo(W - right, y); cx.stroke(); cx.fillText((f * mx).toFixed(2), left - 6, y); }
          for (let i = 0; i < N; i++) {
            const x = left + i * bw, w = Math.max(2, bw * 0.66), xc = x + bw / 2, h = (pr[i] / mx) * ph;
            if (h > 0.2) { cx.fillStyle = v.color('accent', 0.45); cx.fillRect(xc - w / 2, base - h, w, h); }
            if (ok) { const y = base - (fr[i] / mx) * ph; cx.strokeStyle = v.color('gold'); cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(xc - w / 2 - 2, y); cx.lineTo(xc + w / 2 + 2, y); cx.stroke(); }
            if (N <= 32 || i % 2 === 0) { cx.save(); cx.fillStyle = v.color('muted'); cx.textBaseline = 'top'; cx.textAlign = 'center'; cx.font = '500 9.5px "JetBrains Mono", monospace'; if (N > 8) { cx.translate(xc, base + 5); cx.rotate(-Math.PI / 4); cx.textAlign = 'right'; } cx.fillText(i.toString(2).padStart(n, '0'), N > 8 ? 0 : xc, N > 8 ? 0 : base + 6); cx.restore(); }
          }
          if (!ok) { cx.fillStyle = v.color('red'); cx.font = '600 13px Inter, system-ui'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('T inserted: this stabilizer-only routine is disabled', W / 2, top + 8); }
          else { cx.fillStyle = v.color('muted'); cx.font = '500 11.5px "JetBrains Mono", monospace'; cx.textAlign = 'left'; cx.textBaseline = 'top'; tab.stabilizers().slice(0, 6).forEach((s, i) => cx.fillText(`g${i + 1} = ${s}`, left + 6 + (i % 3) * 120, 4 + Math.floor(i / 3) * 15)); }
          cx.restore();
          // memory
          const ns = [...Array(60).keys()].map((k) => k + 1);
          Mm.path(ns.map((m) => [m, Math.ceil(2*m*(2*m+1)/8)]), { color: 'green', width: 2.2 }); Mm.path(ns.map((m) => [m, 16*2**m]), { color: 'red', width: 2.2 });
          Mm.hline(2**37, { color: 'muted', dash: true, width: 1 }); Mm.text('128 GiB of float64 storage',14,2**37*3, { size: 11, color: 'muted', align: 'left' });
          Mm.vline(n, { color: 'gold', width: 1.4 });
          let tv = 0; if (ok) for (let i = 0; i < N; i++) tv += Math.abs(pr[i] - fr[i]) / 2;
          const sup = pr.filter((p) => p > 1e-9), flat = sup.length && sup.every((p) => Math.abs(p - sup[0]) < 1e-9);
          cur = { n, ok, tv, sup: sup.length, flat, bits: 2 * n * (2 * n + 1), amps: 2 * N, mix: 1 / Math.sqrt(shots.value), gates: gates.length };
        });
        v.legend([['green', 'packed tableau bytes'], ['red', 'float64 complex-vector bytes']]);
        v.readout(() => cur.ok
          ? `n = ${cur.n}, ${cur.gates} gates. Tableau: ${cur.bits} bits; state vector: ${cur.amps} real numbers. Total variation distance between tableau samples and the exact distribution: $${fix(v, cur.tv, 3)}$ (sampling noise ≈ $${fix(v, cur.mix * Math.sqrt(cur.sup) / 2, 3)}$)\nThe outcome distribution is uniform on ${cur.sup} strings${cur.flat ? ' (a flat distribution on an affine subspace, as every stabilizer state gives)' : ''}.`
          : `n = ${cur.n}: this circuit contains T, so the implemented stabilizer-only route is disabled. A particular output can still be a stabilizer state or have flat probabilities; a T gate alone does not prove classical hardness.`);
      },
    },

    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Phase kickback',
      statement: String.raw`Let $U$ be a unitary with eigenvector $U|u\rangle=e^{i\varphi}|u\rangle$. For the controlled gate $\Lambda(U)=|0\rangle\langle0|\otimes I+|1\rangle\langle1|\otimes U$,
$$\Lambda(U)\bigl(|c\rangle\otimes|u\rangle\bigr)=\bigl(\Lambda_\varphi|c\rangle\bigr)\otimes|u\rangle,\qquad \Lambda_\varphi=\mathrm{diag}(1,e^{i\varphi}),$$
so the **target is unchanged and the eigenphase appears on the control**: for the control $|+\rangle$ the Bloch vector turns about $Z$ by $\varphi$. With a control superposition and nonzero target amplitudes in distinct eigenspaces, different eigenphases entangle the registers and shorten the control Bloch vector. In particular CNOT with target $|-\rangle$ acts on the control as $Z$.`,
      idea: String.raw`This is the linearity of the controlled gate on a product with an eigenvector: the branch where the control is $|1\rangle$ picks up the scalar $e^{i\varphi}$ and the branch $|0\rangle$ does not, and a scalar on one branch is a relative phase between the branches of the *control* even though it was produced by acting on the target. The phase is invisible to a measurement of the target alone but is read out by interfering the control (a Hadamard, qinfo-1.3). All of phase estimation, order finding and the Deutsch–Jozsa family run on this effect.`,
      caption: String.raw`Left sphere: the **control** after the controlled-$U$, starting from $|+\rangle$ (grey arrow); right sphere: the **target** (its eigen-axis $\hat n$ in orange). $U=e^{i\gamma}R_{\hat n}(\alpha)$ has eigenphases $\gamma\mp\alpha/2$ for the target states $|\pm\hat n\rangle$. Set the mixing $\beta=0$ (target an eigenstate) and the control rotates about $Z$ by exactly the eigenphase while its length stays 1; increase $\beta$ and the control shortens as it entangles with the target.`,
      deps: ['qinfo-2.1', 'qinfo-1.3', 'ladr-7.54'],
      refs: ['Cleve–Ekert–Macchiavello–Mosca,quant-ph/9708016 §§2,5,7'],
      tags: ['phase kickback', 'controlled gates', 'eigenphase'],
      scope: String.raw`Ideal controlled-$U$ and pure product input. The eigenphase is relative between control branches; for a control basis state there is no such interference.`,
      credit: 'Cleve, Ekert, Macchiavello and Mosca, phase-kickback analysis',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantum_phase_estimation_algorithm' },
      viz(v) {
        const S1 = v.stage3d({ height: 320, range: 1.5, weight: 1, title: 'control qubit' });
        const S2 = v.stage3d({ height: 320, range: 1.5, weight: 1, title: 'target qubit' });
        const Pl = v.stage({ x: [0, TAU], y: [-Math.PI, Math.PI], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'rotation angle $\\alpha$', ylabel: 'control azimuth', title: 'azimuth of the control against $\\alpha$ ($\\beta=0$, target $|+\\hat n\\rangle$)' });
        const Q = v.quantum();
        const al = v.slider('rotation angle $\\alpha$', 0, TAU, 1.5, { step: 0.01 });
        const gm = v.slider('extra phase $\\gamma$', -Math.PI, Math.PI, 0, { step: 0.01 });
        const pol = v.slider('axis polar angle', 0, Math.PI, Math.PI / 2, { step: 0.01 });
        const azi = v.slider('axis azimuth', 0, TAU, 0, { step: 0.01 });
        const beta = v.slider('mixing $\\beta$', 0, Math.PI / 2, 0, { step: 0.01 });
        v.button('CNOT, target $|-\\rangle$', () => { al.set(Math.PI); gm.set(Math.PI / 2); pol.set(Math.PI / 2); azi.set(0); beta.set(Math.PI / 2); });
        const run = (alpha, gamma, th, ph, b) => {
          const c = Math.cos(th / 2), s = Math.sin(th / 2), ep = [Math.cos(ph), Math.sin(ph)], em = [Math.cos(ph), -Math.sin(ph)];
          const plus = [[c, 0], cmul(ep, [s, 0])], minus = [[-s * em[0], -s * em[1]], [c, 0]];
          // U = e^{iγ} R_n(α): eigenvalue e^{i(γ∓α/2)} on |±n>
          const e1 = [Math.cos(gamma - alpha / 2), Math.sin(gamma - alpha / 2)], e2 = [Math.cos(gamma + alpha / 2), Math.sin(gamma + alpha / 2)];
          const tgt = [0, 1].map((i) => [Math.cos(b) * plus[i][0] + Math.sin(b) * minus[i][0], Math.cos(b) * plus[i][1] + Math.sin(b) * minus[i][1]]);
          // coefficients of the target on |+n>, |-n>
          const psi = [[R2, 0], [0, 0], [0, 0], [0, 0]]; psi[0] = [R2 * tgt[0][0], R2 * tgt[0][1]]; psi[1] = [R2 * tgt[1][0], R2 * tgt[1][1]]; psi[2] = [R2 * tgt[0][0], R2 * tgt[0][1]]; psi[3] = [R2 * tgt[1][0], R2 * tgt[1][1]];
          // apply U on the target when control = 1: decompose into eigenvectors
          const hp = [tgt[0][0] * plus[0][0] + tgt[0][1] * plus[0][1] + tgt[1][0] * plus[1][0] + tgt[1][1] * plus[1][1], tgt[0][1] * plus[0][0] - tgt[0][0] * plus[0][1] + tgt[1][1] * plus[1][0] - tgt[1][0] * plus[1][1]];
          const hm = [tgt[0][0] * minus[0][0] + tgt[0][1] * minus[0][1] + tgt[1][0] * minus[1][0] + tgt[1][1] * minus[1][1], tgt[0][1] * minus[0][0] - tgt[0][0] * minus[0][1] + tgt[1][1] * minus[1][0] - tgt[1][0] * minus[1][1]];
          const a = cmul(e1, hp), bb = cmul(e2, hm);
          for (let i = 0; i < 2; i++) { const z = [a[0] * plus[i][0] - a[1] * plus[i][1] + bb[0] * minus[i][0] - bb[1] * minus[i][1], a[0] * plus[i][1] + a[1] * plus[i][0] + bb[0] * minus[i][1] + bb[1] * minus[i][0]]; psi[2 + i] = [R2 * z[0], R2 * z[1]]; }
          const rho = outerV(psi), rc = blochRho(ptrace(rho, 2, [0])), rt = blochRho(ptrace(rho, 2, [1]));
          return { rc, rt, psi };
        };
        let cur;
        v.render(() => {
          const th = pol.value, ph = azi.value, r = run(al.value, gm.value, th, ph, beta.value), nax = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
          Q.bloch(S1, r.rc, { extra: [{ v: [1, 0, 0], color: 'muted', label: '|{+}\\rangle' }], angles: false });
          Q.bloch(S2, r.rt, { extra: [{ v: nax, color: 'orange', label: '\\hat n' }], color: 'teal' });
          const pts = [...Array(121).keys()].map((k) => { const a = (k / 120) * TAU, rr = run(a, gm.value, th, ph, 0); return [a, Math.atan2(rr.rc[1], rr.rc[0])]; });
          for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] - pts[i - 1][1]) < 3) Pl.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], { color: 'accent', width: 2 });
          const pred = gm.value - al.value / 2, wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));
          Pl.dot(al.value, wrap(pred), { color: 'gold', r: 6, label:'β=0 reference' });
          cur = { rc:r.rc,len: Math.hypot(...r.rc), az: Math.atan2(r.rc[1], r.rc[0]), pred: wrap(pred), lenT: Math.hypot(...r.rt), b: beta.value };
        });
        v.readout(() => {
          const pure=cur.len>1-1e-9,minus=Math.abs(cur.b-Math.PI/2)<1e-6;
          if(pure)return `target lies in one eigenspace: control Bloch length $${fix(v,cur.len,4)}$ (pure), azimuth $${fix(v,cur.az,4)}$ = eigenphase $${fix(v,Math.atan2(Math.sin(gm.value+(minus?1:-1)*al.value/2),Math.cos(gm.value+(minus?1:-1)*al.value/2)),4)}$ (mod $2\pi$). No entanglement.`;
          return `target has distinct eigenphase components (β = ${fix(v,cur.b,2)}): control length $${fix(v,cur.len,3)}$, target length $${fix(v,cur.lenT,3)}$ — entangled. ${Math.hypot(...cur.rc.slice(0,2))<1e-9?'Control azimuth is undefined at zero transverse length.':''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Quantum oracles',
      statement: String.raw`A Boolean function $f:\{0,1\}^n\to\{0,1\}$ is given to a quantum algorithm as an **oracle**: the unitary
$$O_f|x\rangle|y\rangle=|x\rangle|y\oplus f(x)\rangle\qquad(x\in\{0,1\}^n,\ y\in\{0,1\}),$$
a permutation of the $2^{n+1}$ basis states (so it is unitary and its own inverse). Feeding the target $|-\rangle=(|0\rangle-|1\rangle)/\sqrt2$ turns the bit oracle into a **phase oracle**:
$$O_f|x\rangle|-\rangle=(-1)^{f(x)}|x\rangle|-\rangle .$$
One call acts coherently on a superposition $\sum_x\alpha_x|x\rangle$; a measurement does not reveal all values of $f$. Query complexity counts calls to $O_f$; the gate cost of building $O_f$ from $f$'s circuit (qinfo-4.1) is a separate matter.`,
      idea: String.raw`Computing $f$ reversibly needs the answer written *into* a spare bit, not over the input, which is the Toffoli construction of qinfo-4.1; XOR-ing keeps the map invertible whatever $f$ is. The phase oracle is phase kickback (qinfo-4.7): with $y=|-\rangle$ the target is an eigenvector of the flip $X$ with eigenvalue $-1$, so the controlled flip "if $f(x)=1$" multiplies the branch $|x\rangle$ by $-1$ and leaves the target alone. Writing $f$ as a table, $O_f$ is a product of one multiply-controlled NOT for every $x$ with $f(x)=1$ — at most $2^n$ of them.`,
      caption: String.raw`Click the cells of the truth table to define $f$ on 3 bits (or use a preset). Choose the input register (a basis state, or the uniform superposition from a Hadamard layer) and the target. The bars show the 16 amplitudes after one oracle call; the circuit below builds $O_f$ from one multiply-controlled NOT per $x$ with $f(x)=1$ (open circles are controls on $0$). The readout verifies that this circuit equals $O_f$ on all 16 basis states. With target $|-\rangle$, the amplitudes just change sign where $f=1$.`,
      deps: ['qinfo-4.1', 'qinfo-4.7'],
      refs: ['Cleve–Ekert–Macchiavello–Mosca,quant-ph/9708016 §2 Eqs2.1–2.5'],
      tags: ['oracle', 'query complexity', 'phase oracle'],
      scope: String.raw`Black-box model: algorithms are compared by the number of oracle calls. Real speed-ups must also account for the cost of implementing $O_f$.`,
      credit: 'Reversible bit and phase oracles, as formulated by Cleve etal',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Oracle_machine#Quantum_oracle' },
      viz(v) {
        const Tt = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8, minWidth: 190, title: 'truth table (click to flip)' });
        const Am = v.stage({ axes: false, height: 330, weight: 1.6, title: 'amplitudes after one oracle call' });
        const Dg = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 210, full: true, title: 'the oracle as a circuit' });
        const Q = v.quantum();
        let f = [0, 1, 1, 0, 1, 0, 0, 1];
        const preset = (name, fn) => v.button(name, () => { f = [...Array(8).keys()].map(fn); });
        preset('constant 0', () => 0); preset('parity', (x) => (x ^ (x >> 1) ^ (x >> 2)) & 1); preset('AND', (x) => (x === 7 ? 1 : 0)); preset('majority', (x) => (((x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1)) >= 2 ? 1 : 0)); preset('first bit', (x) => (x >> 2) & 1);
        const inreg = v.select('input register', [{ value: 'sup', label: 'uniform superposition' }, { value: 'x', label: 'basis state' }], 'sup');
        const xs = v.slider('basis state $x$', 0, 7, 5, { int: true });
        const tg = v.select('target', [{ value: '0', label: '$|0\\rangle$' }, { value: '1', label: '$|1\\rangle$' }, { value: 'm', label: '$|-\\rangle$' }], '0');
        const T = v.table(Tt, { rows: 8, cols: 1, square: false, maxCell: 34, cellAspect: 2.2, size: 15, rowLabels: [...Array(8).keys()].map((x) => x.toString(2).padStart(3, '0')), colLabels: ['f(x)'], cornerLabel: 'x' });
        Tt.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0) f[c.i] ^= 1; });
        let cur;
        v.render(() => {
          const N = 16, a = Array.from({ length: N }, () => [0, 0]);
          const tvec = tg.value === '0' ? [[1, 0], [0, 0]] : tg.value === '1' ? [[0, 0], [1, 0]] : [[R2, 0], [-R2, 0]];
          const inv = inreg.value === 'sup' ? [...Array(8).keys()].map(() => 1 / Math.sqrt(8)) : [...Array(8).keys()].map((x) => (x === xs.value ? 1 : 0));
          const psi0 = Array.from({ length: N }, (_, i) => [inv[i >> 1] * tvec[i & 1][0], inv[i >> 1] * tvec[i & 1][1]]);
          for (let i = 0; i < N; i++) { const x = i >> 1, y = i & 1, j = (x << 1) | (y ^ f[x]); a[j] = psi0[i]; }
          Q.amplitudes(Am, Q.state(a), { wheel: true });
          T.draw({ value: (i) => f[i], fill: (i) => (f[i] ? ['green', 0.34] : null), format: (x) => String(x) });
          // circuit: one multi-controlled NOT per minterm
          const ones = f.map((b, x) => (b ? x : -1)).filter((x) => x >= 0), cx = Dg.ctx, W = Dg.W, H = Dg.H, left = 60, colW = Math.min(70, (W - left - 30) / Math.max(1, ones.length)), Y = (q) => 22 + q * ((H - 44) / 3), X = (i) => left + 30 + i * colW;
          const ink = v.color('ink'), panel = v.color('panel');
          cx.save(); cx.strokeStyle = v.color('muted'); cx.lineWidth = 1.4; cx.font = '600 13px Inter, system-ui'; cx.fillStyle = ink; cx.textAlign = 'right'; cx.textBaseline = 'middle';
          for (let q = 0; q < 4; q++) { cx.beginPath(); cx.moveTo(left - 6, Y(q)); cx.lineTo(X(Math.max(1, ones.length)) - 10, Y(q)); cx.stroke(); cx.fillText(q < 3 ? `x${q}` : 'y', left - 12, Y(q)); }
          ones.forEach((x, i) => {
            const px = X(i); cx.strokeStyle = ink; cx.lineWidth = 1.8; cx.beginPath(); cx.moveTo(px, Y(0)); cx.lineTo(px, Y(3)); cx.stroke();
            for (let q = 0; q < 3; q++) { const bit = (x >> (2 - q)) & 1; cx.beginPath(); cx.arc(px, Y(q), 5, 0, TAU); if (bit) { cx.fillStyle = ink; cx.fill(); } else { cx.fillStyle = panel; cx.fill(); cx.stroke(); } }
            cx.beginPath(); cx.arc(px, Y(3), 10, 0, TAU); cx.fillStyle = panel; cx.fill(); cx.stroke(); cx.beginPath(); cx.moveTo(px - 10, Y(3)); cx.lineTo(px + 10, Y(3)); cx.moveTo(px, Y(3) - 10); cx.lineTo(px, Y(3) + 10); cx.stroke();
            cx.fillStyle = v.color('muted'); cx.font = '500 11px "JetBrains Mono", monospace'; cx.textAlign = 'center'; cx.fillText(x.toString(2).padStart(3, '0'), px, 8);
          });
          if (!ones.length) { cx.fillStyle = v.color('muted'); cx.font = '600 14px Inter, system-ui'; cx.textAlign = 'left'; cx.fillText('f ≡ 0: the oracle is the identity (no gates)', left + 20, Y(1.5)); }
          cx.restore();
          // verification: apply the minterm gates to every basis state
          let ok = true; for (let s = 0; s < N; s++) { let y = s & 1; const x = s >> 1; for (const m of ones) if (m === x) y ^= 1; if (((x << 1) | y) !== ((x << 1) | ((s & 1) ^ f[x]))) ok = false; }
          const sgn = tg.value === 'm' ? f.filter((b) => b).length : 0;
          cur = { ones: ones.length, ok, sup: inreg.value === 'sup', m: tg.value === 'm', sgn, bal: ones.length === 4, cons: ones.length === 0 || ones.length === 8 };
        });
        v.readout(() => `$f$ has ${cur.ones} ones: the circuit uses ${cur.ones} multi-controlled NOT gates (at most $2^3=8$) and equals $O_f$ on all 16 basis states: **${cur.ok ? 'yes' : 'NO'}**\n${cur.m ? `target $|-\\rangle$: each amplitude is multiplied by $(-1)^{f(x)}$ and the target is left unchanged — a phase oracle` : 'target in a basis state: the answer is XOR-ed into it; '+(cur.sup&&!cur.cons?'the nonconstant function entangles these registers':'this input remains a product state')}\n$f$ is ${cur.cons ? '**constant**' : cur.bal ? '**balanced**' : 'neither constant nor balanced'}`);
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Algorithm',
      name: 'Hamiltonian simulation by Trotterization',
      statement: String.raw`For a finite-dimensional system and $t\ge0$, let $H=\sum_{j=1}^{m}H_j$ be a sum of Hermitian terms, each of which can be simulated efficiently ($e^{-iH_j\tau}$ costs poly($n$) gates). The **Lie–Trotter product formula** gives
$$\Bigl\|\,e^{-iHt}-\bigl(e^{-iH_1t/r}\cdots e^{-iH_mt/r}\bigr)^{r}\Bigr\|\;\le\;\frac{t^2}{2r}\sum_{j<k}\bigl\|[H_j,H_k]\bigr\|,$$
and the symmetric (second-order, Strang) splitting $S_2(\tau)=e^{-iH_1\tau/2}\cdots e^{-iH_m\tau}\cdots e^{-iH_1\tau/2}$ has error $O(t^3/r^2)$. Suzuki's higher-order formulas of order $2k$ have error $O\bigl(t^{2k+1}/r^{2k}\bigr)$, so the step count grows like $t^{1+1/2k}$ at fixed accuracy (with $5^{k}$ factors per step). So, for a $k$-local Hamiltonian, quantum dynamics for time $t$ to accuracy $\varepsilon$ costs $\mathrm{poly}(n,t,1/\varepsilon)$ gates, whereas the classical state vector has $2^n$ entries.`,
      idea: String.raw`If the terms commute, $e^{-iHt}$ factors exactly. If not, the Baker–Campbell–Hausdorff expansion $e^{A\tau}e^{B\tau}=e^{(A+B)\tau+\frac12[A,B]\tau^2+\cdots}$ shows that the leading one-step error is $\tfrac12\|[A,B]\|\tau^2$, and $r=t/\tau$ steps accumulate $r\cdot\tfrac12\|[A,B]\|\tau^2=t^2\|[A,B]\|/2r$: the error is **controlled by the commutator** and falls as $1/r$. The symmetric splitting cancels the second-order term by palindromic symmetry. Trotter's original product formula (1959) was a result about semigroups; Lloyd (1996) showed that it makes Feynman's idea of a quantum simulator (1982) precise. The Pauli square identity (qm-7.7) gives $e^{-i\theta P}=I\cos\theta-iP\sin\theta$ for $P^2=I$, so local terms are cheap gates: $e^{-i\theta Z_iZ_{i+1}}$ is two CNOTs and a $Z$ rotation (qinfo-4.2), $e^{-i\theta X}$ a single-qubit rotation.`,
      caption: String.raw`A transverse-field Ising chain of 5 spins, $H=\sum Z_iZ_{i+1}+g\sum X_i$, started in $|00000\rangle$ (non-commuting terms $A=\sum ZZ$ and $B=g\sum X$). Left: the state error $\|\psi_{\rm Trotter}-\psi_{\rm exact}\|$ at time $t$ against the number of steps $r$ on log–log axes: at sufficiently fine steps first order approaches slope $-1$ and second order $-2$; the dashed line is $\min(2,t^2\|[A,B]\|/2r)$, combining the commutator bound with the unitary norm bound. Right: $\langle Z_2\rangle$ over time for a fixed step size $\tau$; at coarse $\tau$ the Trotter curve drifts from the exact one.`,
      deps: ['qinfo-4.2', 'fa-13.38', 'qm-5.15', 'qm-7.7', 'ode-3.4'],
      refs: ['Childs–Su–Tran–Wiebe–Zhu,arXiv1912.08854 §5.1 Eqs139–152'],
      tags: ['Hamiltonian simulation', 'Trotter formula', 'quantum simulation'],
      scope: String.raw`Finite chain, real symmetric $H$, exact reference by diagonalization. Operator-norm bounds hold for every state; the observed state error can be much smaller. Modern methods (qubitization, QSVT, linear combinations of unitaries) have better asymptotics in $t$ and $1/\varepsilon$ than product formulas.`,
      credit: 'Lie–Trotter and Suzuki product formulas; commutator bounds as proved by Childs etal',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hamiltonian_simulation' },
      viz(v) {
        const E = v.stage({ x: [1, 300], y: [1e-8, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.1, xlabel: 'number of steps $r$', ylabel: 'state error', title: 'error at time $t$ against steps' });
        const Z = v.stage({ x: [0, 6], y: [-1.05, 1.05], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'time', ylabel: '$\\langle Z_2\\rangle$', title: 'dynamics at fixed step size' });
        const g = v.slider('field $g$', 0.2, 2, 1, { step: 0.05 });
        const tt = v.slider('time $t$', 0.5, 6, 3, { step: 0.1 });
        const tau = v.slider('step size $\\tau$', 0.05, 1.2, 0.5, { step: 0.01 });
        const n = 5, N = 32;
        const bits = (s) => [...Array(n).keys()].map((q) => (s >> (n - 1 - q)) & 1);
        const zz = [...Array(N).keys()].map((s) => { const b = bits(s); let e = 0; for (let q = 0; q < n - 1; q++) e += (1 - 2 * b[q]) * (1 - 2 * b[q + 1]); return e; });
        const psi0 = zeroState(N);
        const rxm = (gt) => [[[Math.cos(gt), 0], [0, -Math.sin(gt)]], [[0, -Math.sin(gt)], [Math.cos(gt), 0]]];
        const stepB = (psi, tau_, gg) => { let p = psi; const U = rxm(gg * tau_); for (let q = 0; q < n; q++) p = applyOne(p, U, q, n); return p; };
        const stepA = (psi, tau_) => psi.map((z, s) => cmul(z, [Math.cos(zz[s] * tau_), -Math.sin(zz[s] * tau_)]));
        const trot = (r, T, gg, order) => { const tau_ = T / r; let p = psi0; for (let i = 0; i < r; i++) p = order === 1 ? stepA(stepB(p, tau_, gg), tau_) : stepA(stepB(stepA(p, tau_ / 2), tau_, gg), tau_ / 2); return p; };
        let ecache = null;
        const exact = (gg) => {
          if (ecache && ecache.g === gg) return ecache;
          const Hm = Array.from({ length: N }, () => new Array(N).fill(0)), Bm = Array.from({ length: N }, () => new Array(N).fill(0));
          for (let s = 0; s < N; s++) { Hm[s][s] = zz[s]; for (let q = 0; q < n; q++) { const s2 = s ^ (1 << (n - 1 - q)); Hm[s][s2] += gg; Bm[s][s2] += gg; } }
          const Am = Hm.map((r, i) => r.map((x, j) => (i === j ? x : 0)));
          const C = Am.map((r, i) => r.map((_, j) => { let a = 0; for (let k = 0; k < N; k++) a += Am[i][k] * Bm[k][j] - Bm[i][k] * Am[k][j]; return a; }));
          const CtC = C.map((_, i) => C.map((__, j) => { let a = 0; for (let k = 0; k < N; k++) a += C[k][i] * C[k][j]; return a; }));
          const comm = Math.sqrt(Math.max(0, v.M.eigSym(CtC).values[0]));
          const eg = v.M.eigSym(Hm), co = eg.vecs.map((u) => u[0]);
          ecache = { g: gg, comm, state: (T) => zeroState(N).map((_, s) => { let re = 0, im = 0; for (let k = 0; k < N; k++) { const w = co[k] * eg.vecs[k][s], ph = -eg.values[k] * T; re += w * Math.cos(ph); im += w * Math.sin(ph); } return [re, im]; }) };
          return ecache;
        };
        const dist = (a, b) => Math.sqrt(a.reduce((s, z, i) => s + (z[0] - b[i][0]) ** 2 + (z[1] - b[i][1]) ** 2, 0));
        const Zexp = (psi) => psi.reduce((s, z, i) => s + cabs2(z) * (1 - 2 * bits(i)[2]), 0);
        let cur;
        v.render(() => {
          const ex = exact(g.value), T = tt.value, ref = ex.state(T), rs = [...Array(24).keys()].map((k) => Math.round(1.25 ** (k + 3))).filter((x, i, a) => a.indexOf(x) === i && x <= 300);
          const e1 = rs.map((r) => [r, Math.max(dist(trot(r, T, g.value, 1), ref), 1.1e-8)]), e2 = rs.map((r) => [r, Math.max(dist(trot(r, T, g.value, 2), ref), 1.1e-8)]);
          const bound = rs.map((r) => [r, Math.min(2, (T * T * ex.comm) / (2 * r))]);
          E.path(bound, { color: 'red', dash: true, width: 1.6 }); E.path(e1, { color: 'accent', width: 2.2 }); E.dots(e1, { color: 'accent', r: 3 }); E.path(e2, { color: 'green', width: 2.2 }); E.dots(e2, { color: 'green', r: 3 });
          // fixed step size dynamics
          const K = Math.floor(6 / tau.value), dense = [...Array(121).keys()].map((k) => { const t = (6 * k) / 120; return [t, Zexp(ex.state(t))]; }), p1 = [[0, 1]], p2 = [[0, 1]];
          let a1 = psi0, a2 = psi0;
          for (let k = 1; k <= K; k++) { a1 = stepA(stepB(a1, tau.value, g.value), tau.value); a2 = stepA(stepB(stepA(a2, tau.value / 2), tau.value, g.value), tau.value / 2); p1.push([k * tau.value, Zexp(a1)]); p2.push([k * tau.value, Zexp(a2)]); }
          Z.path(dense, { color: 'ink', width: 2 }); Z.path(p1, { color: 'accent', width: 1.8 }); Z.dots(p1, { color: 'accent', r: 2.6 }); Z.path(p2, { color: 'green', width: 1.8 }); Z.dots(p2, { color: 'green', r: 2.6 });
          const r0 = rs[rs.length >> 1], last = rs[rs.length - 1], s1 = Math.log(e1[0][1] / e1[e1.length - 1][1]) / Math.log(last / rs[0]), s2 = Math.log(e2[0][1] / Math.max(e2[e2.length - 1][1], 1e-8)) / Math.log(last / rs[0]);
          cur = { comm: ex.comm, s1, s2, within: e1.every((p, i) => p[1] <= bound[i][1] + 1e-9) };
        });
        v.legend([['accent', 'first order (Lie–Trotter)'], ['green', 'second order (Strang)'], ['red', 'bound $\\min(2,t^2\\|[A,B]\\|/2r)$', { dash: true }], ['ink', 'exact']]);
        v.readout(() => `$\\|[A,B]\\|=${fix(v, cur.comm, 2)}$; average log–log slope of the error over the plotted range: first order $${fix(v, -cur.s1, 2)}$ (theory $-1$ at large $r$), second order $${fix(v, -cur.s2, 2)}$ (theory $-2$)\nfirst-order error lies below the commutator bound at every plotted $r$: **${cur.within ? 'yes' : 'no'}**`);
      },
    },
  ],
};
